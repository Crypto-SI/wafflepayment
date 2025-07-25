// Lazy-loaded wagmi config to prevent SSR issues
let _config: any = null;

export const getConfig = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!_config) {
    const { getDefaultConfig } = require('@rainbow-me/rainbowkit');
    const {
      mainnet,
      polygon,
      arbitrum,
      base,
      optimism,
    } = require('wagmi/chains');

    _config = getDefaultConfig({
      appName: 'WafflePayment',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
      chains: [mainnet, polygon, arbitrum, base, optimism],
      ssr: false,
      storage: null,
    });
  }

  return _config;
};

// Export for backward compatibility
export const config = getConfig();