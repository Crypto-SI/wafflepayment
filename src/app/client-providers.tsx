'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from "next-themes";

const AppProviders = dynamic(() => import('./providers').then(mod => mod.AppProviders), {
  ssr: false,
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppProviders>{children}</AppProviders>
    </NextThemesProvider>
  );
}
