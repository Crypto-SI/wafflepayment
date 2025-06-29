'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';

const AppProviders = dynamic(() => import('./providers').then(mod => mod.AppProviders), {
  ssr: false,
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
