"use client";

import Link from "next/link";
import { LayoutGrid, History } from "lucide-react";
import { WaffleIcon } from "./icons";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <WaffleIcon className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-semibold text-foreground">Waffle Payments</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/dashboard" className="flex items-center gap-1 transition-colors hover:text-primary">
            <LayoutGrid className="h-4 w-4" />
            Top-Up
          </Link>
          <Link href="/history" className="flex items-center gap-1 transition-colors hover:text-primary">
            <History className="h-4 w-4" />
            History
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
