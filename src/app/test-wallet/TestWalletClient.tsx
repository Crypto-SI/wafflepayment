'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';

export default function TestWalletClient() {
  const { address, isConnected } = useAccount();
  const { signMessage, data: signature, error, isPending } = useSignMessage();
  const [testMessage, setTestMessage] = useState('Hello from Waffle Payments!');

  const handleTestSign = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await signMessage({ message: testMessage });
    } catch (error) {
      console.error('Signing error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Wallet Testing Page</h1>
        {/* Wallet Connection */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <div className="space-y-4">
            <ConnectButton />
            {isConnected && (
              <div className="text-sm text-muted-foreground">
                Connected Address: {address}
              </div>
            )}
          </div>
        </div>
        {/* Message Signing Test */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Message Signing Test</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Message to sign"
            />
            <button
              onClick={handleTestSign}
              disabled={!isConnected}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              Sign Message
            </button>
            {signature && (
              <div className="text-xs break-all mt-2">Signature: {signature}</div>
            )}
            {error && (
              <div className="text-xs text-red-500 mt-2">Error: {error.message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 