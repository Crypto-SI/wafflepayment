"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/supabase/auth-service-client';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Authenticate with auth.users AND get/create subscriber data
      const result = await AuthService.signIn({
        email,
        password
      });

      if (result.success) {
        // User is now authenticated and has subscriber data
        console.log('Auth user:', result.user);
        console.log('Subscriber data:', result.subscriber);
        
        setMessage('Login successful! Redirecting to dashboard...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : typeof result.error === 'string' 
            ? result.error 
            : 'An error occurred during login';
        setError(errorMessage);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Login</CardTitle>
            <CardDescription className="pt-2">
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-headline">Email</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-headline">Password</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              
              {message && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                  {message}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full font-headline text-lg" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <p>
                Don't have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary underline">
                  Sign up
                </Link>
              </p>
              <p className="mt-2">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                  &larr; Back to home
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
