'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import CryptoPaymentClient from './CryptoPaymentClient';
import { type PaymentPackage } from '@/lib/crypto-tokens';

interface CryptoPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PaymentPackage | null;
  onPaymentSuccess: (transactionHash: string, tokenSymbol: string, amount: string, userAddress: string, chainId: number) => void;
}

export function CryptoPayment({ isOpen, onClose, selectedPackage, onPaymentSuccess }: CryptoPaymentProps) {
  const { isConnected, address, isConnecting } = useAccount();
  const [showConnectButton, setShowConnectButton] = useState(false);

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    // Show connect button after a brief delay to avoid hydration issues
    const timer = setTimeout(() => {
      setShowConnectButton(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isConnected || !address) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Please connect your wallet to make crypto payments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Connecting wallet...</p>
              </>
            ) : (
              <>
                <Wallet className="h-16 w-16 text-muted-foreground" />
                {showConnectButton && (
                  <div className="w-full">
                    <ConnectButton />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <CryptoPaymentClient 
      isOpen={isOpen}
      onClose={onClose}
      selectedPackage={selectedPackage}
      onPaymentSuccess={onPaymentSuccess}
    />
  );
} 