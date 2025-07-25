'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the ConnectButton with no SSR
const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => ({ default: mod.ConnectButton })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
    )
  }
);

export function ConnectButtonWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side after hydration
  if (!isClient) {
    return <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>;
  }

  return <ConnectButton />;
}