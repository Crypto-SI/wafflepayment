"use client";

import { WaffleIcon, SolanaIcon, EvmIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// EVM
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

// Solana
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected } = useWallet();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setIsModalOpen(false);
    }
  };

  const handleSolanaConnect = () => {
    setSolanaModalVisible(true);
    setIsModalOpen(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <WaffleIcon className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Waffle Payments</CardTitle>
            <CardDescription className="pt-2">Connect your wallet to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
               <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <Button onClick={() => setIsModalOpen(true)} size="lg" className="font-headline text-lg">Connect Wallet</Button>
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
            </div>
            <div className="mt-4 text-center text-sm">
              By connecting your wallet, you agree to our Terms of Service.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
