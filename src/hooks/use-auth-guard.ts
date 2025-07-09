'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { AuthService } from '@/lib/supabase/auth-service';

export function useAuthGuard() {
  const router = useRouter();
  const { isConnected: isEvmConnected, isConnecting: isEvmConnecting } = useAccount();
  const { connected: isSolanaConnected, connecting: isSolanaConnecting } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isConnecting = isEvmConnecting || isSolanaConnecting;
      if (isConnecting) {
        return;
      }

      try {
        // Check for Supabase auth (email users)
        const userResult = await AuthService.getCurrentUser();
        const isEmailAuthenticated = userResult.success && userResult.user;

        // Check for wallet connections
        const walletConnected = isEvmConnected || isSolanaConnected;

        if (isEmailAuthenticated || walletConnected) {
          setIsAuthenticated(true);
        } else {
          // No valid authentication found
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // If auth check fails, redirect to login
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isEvmConnected, isSolanaConnected, isEvmConnecting, isSolanaConnecting, router]);

  return { isAuthenticated, loading };
}
