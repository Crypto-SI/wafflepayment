'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WaffleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        if (!searchParams) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please try again.');
          return;
        }

        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please try again.');
          return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. Please try again.');
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Email confirmation failed. Please try again.');
        }
      } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <WaffleIcon className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">
              Email Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p>Confirming your email...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-green-600 text-4xl">✓</div>
                <p className="text-green-600 font-medium">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login page in 3 seconds...
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <div className="text-red-600 text-4xl">✗</div>
                <p className="text-red-600 font-medium">{message}</p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/signup">Try Signing Up Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Already have an account? Login</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 