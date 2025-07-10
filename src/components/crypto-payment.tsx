'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import { type PaymentPackage } from '@/lib/crypto-tokens';

// Dynamically import the payment component to prevent SSR issues
const CryptoPaymentClient = dynamic(() => import('./CryptoPaymentClient'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
});

interface CryptoPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PaymentPackage | null;
  onPaymentSuccess: (transactionHash: string, tokenSymbol: string, amount: string) => void;
}

export function CryptoPayment({ isOpen, onClose, selectedPackage, onPaymentSuccess }: CryptoPaymentProps) {
  const { isConnected } = useAccount();

  const handleClose = () => {
    onClose();
  };

  if (!isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Please connect your wallet to make crypto payments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Wallet className="h-16 w-16 text-muted-foreground" />
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