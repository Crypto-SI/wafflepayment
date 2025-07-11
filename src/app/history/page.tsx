"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, CreditCard, TrendingUp, Activity, ExternalLink, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  credits: number;
  transactionType: 'purchase' | 'usage' | 'refund';
  paymentMethod: string | null;
  amountUsd: number | null;
  transactionHash: string | null;
  packageInfo: any;
  status: string;
  type: 'credit' | 'crypto';
  confirmations?: number;
  tokenSymbol?: string;
  chainId?: number;
}

interface UserHistory {
  user: {
    id: string;
    email: string;
    name: string;
    signupDate: string;
    authType: 'email' | 'wallet';
    walletAddress?: string;
    currentCredits: number;
    subscriptionTier?: string;
    status: string;
  };
  transactions: Transaction[];
  stats: {
    totalTransactions: number;
    totalCreditsEarned: number;
    totalCreditsUsed: number;
    totalSpent: number;
    stripeTransactions: number;
    cryptoTransactions: number;
    pendingCryptoTransactions: number;
  };
}

export default function HistoryPage() {
  const { isAuthenticated, loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchHistory();
    }
  }, [isAuthenticated, authLoading]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setHistory(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load history');
      toast({
        title: "Error",
        description: "Failed to load transaction history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl mb-4">Transaction History</h1>
          <p className="text-muted-foreground">Failed to load your transaction history.</p>
          <button 
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplay = (transaction: Transaction) => {
    if (transaction.type === 'crypto') {
      return `${transaction.tokenSymbol || 'Crypto'} (Chain ${transaction.chainId || 'Unknown'})`;
    }
    if (!transaction.paymentMethod) return 'Unknown';
    if (transaction.paymentMethod.toLowerCase().includes('crypto') || transaction.transactionHash) {
      return 'Crypto (USDT/USDC)';
    }
    return transaction.paymentMethod;
  };

  const getStatusDisplay = (transaction: Transaction) => {
    if (transaction.type === 'crypto') {
      if (transaction.status.includes('Pending')) {
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-600">{transaction.status}</span>
          </div>
        );
      } else if (transaction.status === 'Completed') {
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Confirmed</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-600">{transaction.status}</span>
          </div>
        );
      }
    }
    return (
      <Badge variant="secondary">
        {transaction.status}
      </Badge>
    );
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'default';
      case 'usage':
        return 'secondary';
      case 'refund':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">Account History</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Review your account details and transaction history.
        </p>
      </header>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(history.user.signupDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {history.user.authType === 'wallet' ? 'Wallet User' : 'Email User'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history.user.currentCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${history.stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {history.stats.totalCreditsEarned.toLocaleString()} credits earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history.stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {history.stats.stripeTransactions} Stripe, {history.stats.cryptoTransactions} Crypto
              {history.stats.pendingCryptoTransactions > 0 && (
                <span className="text-yellow-600"> ({history.stats.pendingCryptoTransactions} pending)</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Details Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{history.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{history.user.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <p className="text-base capitalize">{history.user.authType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="secondary" className="capitalize">{history.user.status}</Badge>
            </div>
            {history.user.walletAddress && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                <p className="text-base font-mono text-xs break-all">{history.user.walletAddress}</p>
              </div>
            )}
            {history.user.subscriptionTier && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subscription</p>
                <Badge variant="outline" className="capitalize">{history.user.subscriptionTier}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {history.transactions.length > 0 
              ? `Your ${history.transactions.length} most recent transactions`
              : 'No transactions found'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your credit purchases and usage will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-card">
                    <TableHead className="font-headline">Date</TableHead>
                    <TableHead className="font-headline">Type</TableHead>
                    <TableHead className="font-headline text-right">Credits</TableHead>
                    <TableHead className="font-headline text-right">Amount</TableHead>
                    <TableHead className="font-headline">Payment Method</TableHead>
                    <TableHead className="font-headline text-center">Status</TableHead>
                    <TableHead className="font-headline text-center">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getTransactionTypeColor(tx.transactionType)} className="capitalize">
                            {tx.transactionType}
                          </Badge>
                          {tx.type === 'crypto' && (
                            <Badge variant="outline" className="text-xs">
                              Crypto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={tx.transactionType === 'usage' ? 'text-red-600' : 'text-green-600'}>
                          {tx.transactionType === 'usage' ? '-' : '+'}{Math.abs(tx.credits).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.amountUsd ? `$${parseFloat(tx.amountUsd.toString()).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodDisplay(tx)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusDisplay(tx)}
                      </TableCell>
                      <TableCell className="text-center">
                        {tx.transactionHash ? (
                          <a
                            href={`https://etherscan.io/tx/${tx.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="text-xs">View</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
