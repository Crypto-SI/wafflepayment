"use client";

import { WaffleIcon, SolanaIcon, EvmIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail } from "lucide-react";

// EVM
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

// Solana
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from "next/link";

export default function LoginPage() {
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected } = useWallet();
  const router = useRouter();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const { openConnectModal } = useConnectModal();
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  useEffect(() => {
    if (isEvmConnected || isSolanaConnected) {
      router.push('/dashboard');
    }
  }, [isEvmConnected, isSolanaConnected, router]);

  const handleEvmConnect = () => {
    if (openConnectModal) {
      openConnectModal();
      setIsWalletModalOpen(false);
    }
  };

  const handleSolanaConnect = () => {
    setSolanaModalVisible(true);
    setIsWalletModalOpen(false);
  };

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
              <Button onClick={() => setIsWalletModalOpen(true)} size="lg" className="w-full font-headline text-lg">
                <EvmIcon className="mr-2 h-5 w-5" /> Continue with Wallet
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
                  Sign up
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-center">Choose Wallet Type</DialogTitle>
            <DialogDescription className="text-center">
              Select your preferred blockchain network.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-28 flex-col gap-2 text-lg hover:bg-secondary"
              onClick={handleEvmConnect}
            >
              <EvmIcon className="h-10 w-10 text-primary" />
              EVM Wallet
            </Button>
            <Button
              variant="outline"
              className="h-28 flex-col gap-2 text-lg hover:bg-secondary"
              onClick={handleSolanaConnect}
            >
              <SolanaIcon className="h-10 w-10 text-primary" />
              Solana Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
