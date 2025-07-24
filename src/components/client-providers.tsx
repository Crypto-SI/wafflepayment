'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

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
  return <AppProviders>{children}</AppProviders>;
}