"use client";

import { WaffleIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from "next/link";
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    // Check session directly on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session && data.session.user) {
        router.replace('/dashboard');
      }
    });
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        router.replace('/dashboard');
      }
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <WaffleIcon className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Welcome to Waffle</CardTitle>
            <CardDescription className="pt-2">Your seamless gateway to crypto payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button asChild variant="secondary" size="lg" className="w-full font-headline text-lg">
                <Link href="/login">
                  <Mail className="mr-2 h-5 w-5" /> Continue with Email
                </Link>
              </Button>
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:text-primary/80">
                  Sign up with Email
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
