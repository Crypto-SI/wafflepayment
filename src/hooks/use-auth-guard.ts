'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

export function useAuthGuard() {
  const router = useRouter();
  const { isConnected: isEvmConnected, isConnecting: isEvmConnecting } = useAccount();
  const { connected: isSolanaConnected, connecting: isSolanaConnecting } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const isConnecting = isEvmConnecting || isSolanaConnecting;
    if (isConnecting) {
      return;
    }

    const emailLoggedIn = sessionStorage.getItem('isEmailLoggedIn') === 'true';
    const walletConnected = isEvmConnected || isSolanaConnected;

    if (walletConnected || emailLoggedIn) {
      setIsAuthenticated(true);
    } else {
      router.push('/');
    }
  }, [isEvmConnected, isSolanaConnected, isEvmConnecting, isSolanaConnecting, router]);

  return isAuthenticated;
}
