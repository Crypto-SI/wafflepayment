'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createStorage, cookieStorage } from 'wagmi';
import { SessionProvider } from 'next-auth/react';
import { useMemo, useEffect, useState } from 'react';
import type { GetSiweMessageOptions } from '@rainbow-me/rainbowkit-siwe-next-auth';

// SIWE message options
const getSiweMessageOptions: GetSiweMessageOptions = () => ({
  statement: 'Sign in to Waffle Payments to access your account.',
  domain: typeof window !== 'undefined' ? window.location.host : 'localhost:9002',
  uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002',
  version: '1',
});

export function AppProviders({ 
  children, 
  session
}: { 
  children: React.ReactNode;
  session?: any;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create wagmi config with SSR support and cookie storage
  const config = useMemo(() => {
    try {
      return getDefaultConfig({
        appName: 'Waffle Payments',
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        chains: [mainnet, polygon, optimism, arbitrum, base],
        ssr: true,
        storage: createStorage({
          storage: cookieStorage,
        }),
      });
    } catch (error) {
      console.error('Error creating wagmi config:', error);
      // Fallback config for SSR
      return getDefaultConfig({
        appName: 'Waffle Payments',
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        chains: [mainnet],
        ssr: true,
      });
    }
  }, []);

  // Create query client with singleton pattern
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
          retry: false, // Reduce retries during SSR
        },
      },
    });
  }, []);

  // Don't render wallet components until client-side hydration is complete
  if (!isClient) {
    return (
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <div suppressHydrationWarning>
            {children}
          </div>
        </QueryClientProvider>
      </SessionProvider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider getSiweMessageOptions={getSiweMessageOptions}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}
