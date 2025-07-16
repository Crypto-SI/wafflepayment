"use client";

import Link from "next/link";
import { LayoutGrid, History, User, LogOut } from "lucide-react";
import { WaffleIcon } from "./icons";
import { AuthService } from '@/lib/supabase/auth-service-client';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Fetch user on mount and on auth state change
  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      const result = await AuthService.getCurrentUser();
      if (!mounted) return;
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    }
    fetchUser();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      router.replace('/'); // Use replace to go to landing page and prevent back navigation
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <WaffleIcon className="h-8 w-8 text-primary" />
          <span className="font-bold text-lg">Waffle</span>
        </Link>
        {/* Navigation links for authenticated users */}
        {user && (
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
          {/* Wallet Connection - Always show when user is authenticated */}
          {user && (
            <ConnectButton />
          )}
          {/* User Authentication */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.name || `${user.email?.slice(0, 6)}...${user.email?.slice(-4)}`}
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
