'use client';

import dynamic from 'next/dynamic';
import { ReactNode, useEffect, useState } from 'react';

// Dynamically import providers with no SSR
const AppProviders = dynamic(
  () => import('../app/providers').then((mod) => ({ default: mod.AppProviders })),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render providers after client-side hydration
  if (!isClient) {
    return <>{children}</>;
  }

  return <AppProviders>{children}</AppProviders>;
}