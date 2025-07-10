"use client";

import Link from "next/link";
import { LayoutGrid, History, User, LogOut } from "lucide-react";
import { WaffleIcon } from "./icons";
import { useSession } from 'next-auth/react';
import { AuthService } from '@/lib/supabase/auth-service-client';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import wallet components to prevent SSR issues
const WalletButtons = dynamic(() => import('./WalletButtons'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href={session?.user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <WaffleIcon className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-semibold text-foreground">Waffle Payments</span>
        </Link>
        
        {/* Only show navigation when user is authenticated */}
        {session?.user && (
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/dashboard" className="flex items-center gap-1 transition-colors hover:text-primary">
              <User className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/top-up" className="flex items-center gap-1 transition-colors hover:text-primary">
              <LayoutGrid className="h-4 w-4" />
              Top-Up
            </Link>
            <Link href="/history" className="flex items-center gap-1 transition-colors hover:text-primary">
              <History className="h-4 w-4" />
              History
            </Link>
          </nav>
        )}
        
        <div className="flex items-center gap-4">
          {session?.user ? (
            // Authenticated user - show user info and sign out
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {session.user.name || `${session.user.email?.slice(0, 6)}...${session.user.email?.slice(-4)}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            // Always show wallet connection buttons for non-authenticated users
            <WalletButtons />
          )}
        </div>
      </div>
    </header>
  );
}
