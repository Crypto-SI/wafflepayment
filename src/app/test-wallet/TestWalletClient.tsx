'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';

export default function TestWalletClient() {
  const { data: session, status } = useSession();
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

  const handleSiweSign = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await signIn('credentials');
    } catch (error) {
      console.error('SIWE sign in error:', error);
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

        {/* SIWE Authentication */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">SIWE Authentication</h2>
          <div className="space-y-4">
            <div className="text-sm">
              Status: {status === 'loading' ? 'Loading...' : status === 'authenticated' ? 'Authenticated' : 'Not authenticated'}
            </div>
            {session && (
              <div className="text-sm text-muted-foreground">
                User: {session.user?.name} ({session.user?.email})
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSiweSign}
                disabled={!isConnected || status === 'loading'}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                Sign In with Ethereum
              </button>
              {session && (
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message Signing Test */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Message Signing Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Message:
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter message to sign"
              />
            </div>
            <button
              onClick={handleTestSign}
              disabled={!isConnected || isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              {isPending ? 'Signing...' : 'Sign Message'}
            </button>
            {signature && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Signature:</div>
                <div className="text-xs bg-muted p-2 rounded break-all">
                  {signature}
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <div>Wallet Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Address: {address || 'Not connected'}</div>
            <div>Session Status: {status}</div>
            <div>User ID: {session?.user?.id || 'Not authenticated'}</div>
            <div>Environment: {process.env.NODE_ENV}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 