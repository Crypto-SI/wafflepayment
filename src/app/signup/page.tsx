"use client";

import { WaffleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/supabase/auth-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function SignupPage() {
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
    const confirmPassword = formData.get('confirm-password') as string;
    const fullName = formData.get('fullName') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Create user in auth.users AND subscribers tables
      const result = await AuthService.signUp({
        email,
        password,
        fullName,
        metadata: { 
          signupSource: 'waffle-payments-web',
          isAdmin: false, // Explicitly set non-admin
          isSuperAdmin: false
        }
      });

      if (result.success) {
        if (result.needsEmailConfirmation) {
          setMessage('Please check your email to confirm your account before logging in.');
        } else {
          // User is signed up and logged in
          setMessage('Account created successfully! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
              } else {
          const errorMessage = result.error instanceof Error 
            ? result.error.message 
            : typeof result.error === 'string' 
              ? result.error 
              : 'An error occurred during signup';
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
              <WaffleIcon className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Create an Account</CardTitle>
            <CardDescription className="pt-2">
              Join Waffle Payments to start topping up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-headline">Full Name</Label>
                <Input 
                  id="fullName" 
                  name="fullName"
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  disabled={loading}
                />
              </div>
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
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-headline">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  name="confirm-password"
                  type="password" 
                  required 
                  disabled={loading}
                  minLength={6}
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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <p>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary underline">
                  Log in
                </Link>
              </p>
               <p className="mt-2">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                  &larr; Back to all login options
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
