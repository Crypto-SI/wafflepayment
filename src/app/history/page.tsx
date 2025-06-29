"use client";

import { useEffect } from "react";
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: "txn_1", date: "2023-10-27", credits: 100, price: 10, method: "Stripe", status: "Completed" },
  { id: "txn_2", date: "2023-10-25", credits: 550, price: 50, method: "MetaMask", status: "Completed" },
  { id: "txn_3", date: "2023-10-22", credits: 100, price: 10, method: "Stripe", status: "Completed" },
  { id: "txn_4", date: "2023-10-18", credits: 1200, price: 100, method: "Stripe", status: "Completed" },
  { id: "txn_5", date: "2023-10-15", credits: 100, price: 10, method: "MetaMask", status: "Failed" },
];

export default function HistoryPage() {
  const { isConnected: isEvmConnected, isConnecting: isEvmConnecting } = useAccount();
  const { connected: isSolanaConnected, connecting: isSolanaConnecting } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isEvmConnecting || isSolanaConnecting) return;

    if (!isEvmConnected && !isSolanaConnected) {
      router.push('/');
    }
  }, [isEvmConnected, isSolanaConnected, isEvmConnecting, isSolanaConnecting, router]);

  if (!isEvmConnected && !isSolanaConnected) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">Transaction History</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Review your past credit top-ups.</p>
      </header>
      <div className="overflow-hidden rounded-lg border shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-card">
              <TableHead className="font-headline">Date</TableHead>
              <TableHead className="font-headline text-right">Credits</TableHead>
              <TableHead className="font-headline text-right">Amount</TableHead>
              <TableHead className="font-headline">Payment Method</TableHead>
              <TableHead className="font-headline text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right font-medium">{tx.credits.toLocaleString()}</TableCell>
                <TableCell className="text-right">${tx.price.toFixed(2)}</TableCell>
                <TableCell>{tx.method}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={tx.status === 'Completed' ? 'secondary' : 'destructive'}>
                    {tx.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
