'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Create a client-only component that uses wagmi hooks
const TestWalletClient = dynamic(() => import('./TestWalletClient'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Wallet Testing Page</h1>
        <div className="text-center">Loading...</div>
      </div>
    </div>
  ),
});

export default function TestWalletPage() {
  return <TestWalletClient />;
} 