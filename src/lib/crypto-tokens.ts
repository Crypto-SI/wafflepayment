// Chain IDs for reference (no longer using wagmi)
const CHAIN_IDS = {
  mainnet: 1,
  polygon: 137,
  arbitrum: 42161,
  base: 8453,
  optimism: 10,
};

export type Address = `0x${string}`;

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
  chainId: number;
  chainName: string;
  icon: string;
}

export interface PaymentPackage {
  credits: number;
  price: number;
  name: string;
  description: string;
  popular?: boolean;
}

// Your wallet address for receiving payments
export const PAYMENT_WALLET_ADDRESS: Address = '0x0B172a4E265AcF4c2E0aB238F63A44bf29bBd158';

// Supported tokens across different chains
export const SUPPORTED_TOKENS: TokenConfig[] = [
  // Ethereum Mainnet
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chainId: CHAIN_IDS.mainnet,
    chainName: 'Ethereum',
    icon: '💰',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: CHAIN_IDS.mainnet,
    chainName: 'Ethereum',
    icon: '💵',
  },
  // Polygon
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    chainId: CHAIN_IDS.polygon,
    chainName: 'Polygon',
    icon: '💰',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    chainId: CHAIN_IDS.polygon,
    chainName: 'Polygon',
    icon: '💵',
  },
  // Arbitrum
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    chainId: CHAIN_IDS.arbitrum,
    chainName: 'Arbitrum',
    icon: '💰',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    chainId: CHAIN_IDS.arbitrum,
    chainName: 'Arbitrum',
    icon: '💵',
  },
  // Base
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    chainId: CHAIN_IDS.base,
    chainName: 'Base',
    icon: '💰',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chainId: CHAIN_IDS.base,
    chainName: 'Base',
    icon: '💵',
  },
  // Optimism
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    chainId: CHAIN_IDS.optimism,
    chainName: 'Optimism',
    icon: '💰',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    chainId: CHAIN_IDS.optimism,
    chainName: 'Optimism',
    icon: '💵',
  },
];

// Credit packages (matching your existing Stripe packages)
export const CREDIT_PACKAGES: PaymentPackage[] = [
  {
    credits: 1000,
    price: 25,
    name: 'Starter Pack',
    description: 'Perfect for getting started',
  },
  {
    credits: 2105,
    price: 50,
    name: 'Popular Pack',
    description: 'Most popular choice',
    popular: true,
  },
  {
    credits: 4444,
    price: 100,
    name: 'Pro Pack',
    description: 'Best value for power users',
  },
];

// ERC-20 ABI for token transfers
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ]
  }
] as const;

// Utility functions
export function getTokensByChain(chainId: number): TokenConfig[] {
  return SUPPORTED_TOKENS.filter(token => token.chainId === chainId);
}

export function getTokenBySymbolAndChain(symbol: string, chainId: number): TokenConfig | undefined {
  return SUPPORTED_TOKENS.find(token => token.symbol === symbol && token.chainId === chainId);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === BigInt(0)) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fractional = ''] = amount.split('.');
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFractional);
} 