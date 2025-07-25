"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CongratulationsModal } from "@/components/congratulations-modal";
import { AuthService } from "@/lib/supabase/auth-service-client";

interface SessionData {
  status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  metadata: {
    type: string;
    credits: string;
    email: string;
  };
  payment_status: string;
}

function ConfirmationPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/stripe/session-status?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch session data');
        }

        if (data.status === 'open') {
          // Session is still open, redirect back to checkout
          if (typeof window !== 'undefined') {
            window.location.replace('/top-up');
          }
          return;
        }

        setSessionData(data);
        
        // If payment is successful, get user data and show congratulations
        if (data.status === 'complete' && data.payment_status === 'paid') {
          const userResult = await AuthService.getCurrentUser();
          if (userResult.success && userResult.user) {
            setCurrentUser(userResult.user);
            setNewBalance(userResult.subscriber?.credits || 0);
            setShowCongratulations(true);
          }
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center py-12">
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardContent className="p-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading payment confirmation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="container flex items-center justify-center py-12">
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="font-headline mt-6 text-3xl">Payment Error</CardTitle>
            <CardDescription className="mt-2 text-base">
              {error || 'Unable to retrieve payment information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full">
                <Link href="/top-up">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccessful = sessionData.status === 'complete' && sessionData.payment_status === 'paid';
  const credits = parseInt(sessionData.metadata.credits);
  const amountPaid = (sessionData.amount_total / 100).toFixed(2);
  const paymentType = sessionData.metadata.type === 'subscription' ? 'Subscription' : 'One-time Payment';

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            isSuccessful ? 'bg-primary/20' : 'bg-amber-500/20'
          }`}>
            {isSuccessful ? (
              <CheckCircle2 className="h-12 w-12 text-primary" />
            ) : (
              <AlertCircle className="h-12 w-12 text-amber-500" />
            )}
          </div>
          <CardTitle className="font-headline mt-6 text-3xl">
            {isSuccessful ? 'Payment Successful!' : 'Payment Processing'}
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            {isSuccessful 
              ? 'Your credits have been added to your account.' 
              : 'Your payment is being processed. Credits will be added shortly.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-4 text-left">
            <h3 className="font-headline text-lg">Transaction Summary</h3>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span>Credits:</span>
                <span className="font-medium text-foreground">{credits.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span>Amount Paid:</span>
                <span className="font-medium text-foreground">${amountPaid}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span>Payment Type:</span>
                <span className="font-medium text-foreground">{paymentType}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span>Payment Method:</span>
                <span className="font-medium text-foreground">Stripe</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span>Transaction ID:</span>
                <span className="font-mono text-xs font-medium text-foreground break-all sm:break-normal">{sessionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span>Status:</span>
                <span className={`font-medium ${
                  isSuccessful ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {isSuccessful ? 'Completed' : 'Processing'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/top-up">Buy More Credits</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => setShowCongratulations(false)}
        creditsAdded={sessionData ? parseInt(sessionData.metadata.credits) : 0}
        newBalance={newBalance}
        transactionHash={sessionId || ''}
        tokenSymbol="Stripe"
        userEmail={currentUser?.email}
      />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center py-12">
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardContent className="p-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading payment confirmation...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmationPageContent />
    </Suspense>
  );
}