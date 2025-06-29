"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function EmailLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Login with Email</CardTitle>
            <CardDescription className="pt-2">
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-headline">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-headline">Password</Label>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full font-headline text-lg">
                Login
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
