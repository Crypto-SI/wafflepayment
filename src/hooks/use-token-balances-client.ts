'use client';

import { useState, useEffect } from 'react';

interface TokenBalance {
  raw: bigint;
  formatted: string;
  symbol: string;
  chainId: number;
}

export function useTokenBalancesClient() {
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only use wagmi hooks on client side
  useEffect(() => {
    if (!isClient) return;

    // Dynamically import and use the original hook only on client side
    const loadTokenBalances = async () => {
      try {
        const { useTokenBalances } = await import('./use-token-balances');
        // This would need to be restructured to work properly
        // For now, return empty state to prevent SSR issues
        setBalances({});
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading token balances:', error);
        setBalances({});
        setIsLoading(false);
      }
    };

    loadTokenBalances();
  }, [isClient]);

  if (!isClient) {
    return {
      balances: {},
      isLoading: false,
      error: null,
      hasBalances: false,
    };
  }

  return {
    balances,
    isLoading,
    error: null,
    hasBalances: Object.keys(balances).length > 0,
  };
}