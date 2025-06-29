"use client";

import { WaffleIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

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
              <ConnectButton />
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
