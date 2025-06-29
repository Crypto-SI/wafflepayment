import type {Metadata} from 'next';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Toaster } from "@/components/ui/toaster"
import { ClientProviders } from './client-providers';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Waffle Payments',
  description: 'Top up your credits with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders>
          {children}
          <Toaster />
          <ThemeToggle />
        </ClientProviders>
      </body>
    </html>
  );
}
