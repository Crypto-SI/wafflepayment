import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { SUPPORTED_TOKENS, ERC20_ABI } from '@/lib/crypto-tokens';
import { useState, useEffect } from 'react';

interface TokenBalance {
  raw: bigint;
  formatted: string;
  symbol: string;
  chainId: number;
}

export function useTokenBalances() {
  const { address, chain } = useAccount();
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get tokens for current chain
  const currentChainTokens = chain ? SUPPORTED_TOKENS.filter(token => token.chainId === chain.id) : [];

  useEffect(() => {
    if (!address || !chain || currentChainTokens.length === 0) {
      setBalances({});
      return;
    }

    setIsLoading(true);
    
    // Fetch real balances from blockchain
    const fetchRealBalances = async () => {
      const newBalances: Record<string, TokenBalance> = {};
      
      // Use Promise.all to fetch all balances concurrently
      const balancePromises = currentChainTokens.map(async (token) => {
        try {
          // Use viem's publicClient to read contract
          const { createPublicClient, http } = await import('viem');
          const { mainnet, polygon, arbitrum, base, optimism } = await import('viem/chains');
          
          // Map chain IDs to viem chains
          const chainMap: Record<number, any> = {
            1: mainnet,
            137: polygon,
            42161: arbitrum,
            8453: base,
            10: optimism,
          };
          
          const viemChain = chainMap[token.chainId];
          if (!viemChain) {
            throw new Error(`Unsupported chain: ${token.chainId}`);
          }
          
          const publicClient = createPublicClient({
            chain: viemChain,
            transport: http(),
          });
          
          const balance = await publicClient.readContract({
            address: token.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;
          
          const formattedBalance = formatUnits(balance, token.decimals);
          
          return {
            key: `${token.symbol}-${token.chainId}`,
            balance: {
              raw: balance,
              formatted: formattedBalance,
              symbol: token.symbol,
              chainId: token.chainId,
            }
          };
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol} on chain ${token.chainId}:`, error);
          return {
            key: `${token.symbol}-${token.chainId}`,
            balance: {
              raw: BigInt(0),
              formatted: '0',
              symbol: token.symbol,
              chainId: token.chainId,
            }
          };
        }
      });
      
      const results = await Promise.all(balancePromises);
      
      results.forEach(({ key, balance }) => {
        newBalances[key] = balance;
      });
      
      setBalances(newBalances);
      setIsLoading(false);
    };

    fetchRealBalances();
  }, [address, chain?.id, currentChainTokens.length]);

  return {
    balances,
    isLoading,
    error: null,
    hasBalances: Object.keys(balances).length > 0,
  };
}