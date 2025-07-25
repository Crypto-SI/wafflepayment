'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { getConfig } from '@/lib/wagmi-config';
import { useMemo } from 'react';

import '@rainbow-me/rainbowkit/styles.css';

export function AppProviders({ 
  children
}: { 
  children: React.ReactNode;
}) {
  // Create query client with singleton pattern
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });
  }, []);

  const config = getConfig();

  // Only render providers on client side and when config is available
  if (typeof window === 'undefined' || !config) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
