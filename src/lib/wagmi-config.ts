import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  arbitrum,
  base,
  optimism,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'WafflePayment',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [mainnet, polygon, arbitrum, base, optimism],
  ssr: false, // Disable SSR for RainbowKit to prevent IndexedDB errors in server context
});