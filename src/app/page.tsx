"use client";

import { WaffleIcon, EvmIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamically import wallet components to prevent SSR issues
const WalletAuthModal = dynamic(() => import('@/components/wallet-auth-modal'), {
  ssr: false,
  loading: () => <div>Loading wallet options...</div>
});

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAuthMode, setWalletAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // If user is authenticated via NextAuth (wallet), redirect to dashboard
    if (session?.user) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

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
              <Button 
                onClick={() => {
                  setWalletAuthMode('signin');
                  setIsWalletModalOpen(true);
                }} 
                size="lg" 
                className="w-full font-headline text-lg"
              >
                <EvmIcon className="mr-2 h-5 w-5" /> Sign In with Wallet
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

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
                {' or '}
                <button 
                  onClick={() => {
                    setWalletAuthMode('signup');
                    setIsWalletModalOpen(true);
                  }}
                  className="font-semibold text-primary hover:text-primary/80 underline"
                >
                  Sign up with Wallet
                </button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-center">
              {walletAuthMode === 'signin' ? 'Sign In with Wallet' : 'Sign Up with Wallet'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {walletAuthMode === 'signin' 
                ? 'Connect your wallet to sign in to your existing account.'
                : 'Connect your wallet to create a new account with crypto payments.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <WalletAuthModal 
              mode={walletAuthMode} 
              onClose={() => setIsWalletModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
