'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { signIn, getCsrfToken } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { EvmIcon } from "@/components/icons";
import { Loader2 } from 'lucide-react';
interface WalletAuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
}

export default function WalletAuthModal({ mode, onClose }: WalletAuthModalProps) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConnect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleWalletAuth = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First, check if user exists (for both sign-in and sign-up)
      const checkResponse = await fetch('/api/auth/check-wallet-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      const checkResult = await checkResponse.json();

      if (mode === 'signin') {
        // For sign-in, user must exist
        if (!checkResult.exists) {
          setError('No account found for this wallet. Please sign up first.');
          setIsLoading(false);
          return;
        }
      } else {
        // For sign-up, user must not exist
        if (checkResult.exists) {
          setError('Account already exists for this wallet. Please sign in instead.');
          setIsLoading(false);
          return;
        }
      }

      // Get nonce for SIWE
      const nonce = await getCsrfToken();
      if (!nonce) {
        throw new Error('Failed to get nonce');
      }

      // Create SIWE message manually (following EIP-4361 format)
      const statement = mode === 'signin' 
        ? 'Sign in to Waffle Payments' 
        : 'Sign up for Waffle Payments';
      
      const message = `${window.location.host} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${window.location.origin}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

      // Sign the message
      const signature = await signMessageAsync({ message });

      if (mode === 'signup') {
        // For sign-up, create the user first
        const signupResponse = await fetch('/api/auth/wallet-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            signature,
            nonce,
          }),
        });

        const signupResult = await signupResponse.json();

        if (!signupResponse.ok) {
          throw new Error(signupResult.error || 'Sign-up failed');
        }

        setSuccess('Account created successfully! You can now sign in.');
        
        // Wait a moment then proceed to sign in
        setTimeout(async () => {
          await performSignIn(message, signature);
        }, 1000);
      } else {
        // For sign-in, authenticate directly
        await performSignIn(message, signature);
      }

    } catch (error: any) {
      console.error('Wallet auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const performSignIn = async (message: string, signature: string) => {
    try {
      const result = await signIn('credentials', {
        message,
        signature,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        setSuccess('Successfully signed in! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' 
              ? 'Connect your wallet to sign in' 
              : 'Connect your wallet to create an account'
            }
          </p>
          <Button
            variant="outline"
            className="h-28 flex-col gap-2 text-lg hover:bg-secondary min-w-[200px]"
            onClick={handleConnect}
            disabled={isLoading}
          >
            <EvmIcon className="h-10 w-10 text-primary" />
            Connect EVM Wallet
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <Button
            onClick={handleWalletAuth}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' 
              ? (isLoading ? 'Signing in...' : 'Sign In') 
              : (isLoading ? 'Creating account...' : 'Create Account')
            }
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 text-center">
          {success}
        </div>
      )}
    </div>
  );
} 