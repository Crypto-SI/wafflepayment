"use client";

import Link from "next/link";
import { LayoutGrid, History, User, LogOut, Menu, X } from "lucide-react";
import { WaffleIcon } from "./icons";
import { AuthService } from '@/lib/supabase/auth-service-client';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

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
        
        {/* Navigation links for authenticated users - Desktop */}
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
        
        <div className="flex items-center gap-2">
          {/* Wallet Connection - Always show when user is authenticated */}
          {user && (
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
          )}
          
          {/* User Authentication - Desktop */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
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
          
          {/* Mobile Menu */}
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <SheetTitle className="text-lg font-semibold">Waffle Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="flex-1 py-6 space-y-6">
                    <div className="px-2">
                      <h2 className="text-lg font-semibold mb-2">Menu</h2>
                      <nav className="flex flex-col space-y-4">
                        <Link href="/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                          <User className="h-5 w-5" />
                          Dashboard
                        </Link>
                        <Link href="/top-up" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                          <LayoutGrid className="h-5 w-5" />
                          Top-Up
                        </Link>
                        <Link href="/history" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                          <History className="h-5 w-5" />
                          History
                        </Link>
                      </nav>
                    </div>
                    
                    <div className="px-2 pt-4 border-t">
                      <h2 className="text-lg font-semibold mb-4">Wallet</h2>
                      <div className="mb-6">
                        <ConnectButton />
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-4 border-t">
                    <div className="px-2 flex flex-col gap-3">
                      <div className="text-sm text-muted-foreground">
                        Signed in as: <span className="font-medium">{user.email}</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full justify-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
