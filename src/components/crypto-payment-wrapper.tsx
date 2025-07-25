'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { type PaymentPackage } from '@/lib/crypto-tokens';

// Dynamically import the crypto payment component with no SSR
const CryptoPayment = dynamic(
  () => import('./crypto-payment').then((mod) => ({ default: mod.CryptoPayment })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
);

interface CryptoPaymentWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PaymentPackage | null;
  onPaymentSuccess: (txHash: string, amount: number) => void;
}

export function CryptoPaymentWrapper({ 
  isOpen, 
  onClose, 
  selectedPackage, 
  onPaymentSuccess 
}: CryptoPaymentWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side after hydration
  if (!isClient) {
    return null;
  }

  return (
    <CryptoPayment
      isOpen={isOpen}
      onClose={onClose}
      selectedPackage={selectedPackage}
      onPaymentSuccess={onPaymentSuccess}
    />
  );
}