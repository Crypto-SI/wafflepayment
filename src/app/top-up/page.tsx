"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Star, Loader2 } from "lucide-react";
import { MetamaskIcon } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/supabase/auth-service-client";
import { CryptoPayment } from "@/components/crypto-payment";
import { CREDIT_PACKAGES, type PaymentPackage } from "@/lib/crypto-tokens";

type TopUpOption = {
  type: 'top-up';
  name: string;
  credits: number;
  price: number;
  description: string;
  popular: boolean;
  bestValue: boolean;
};

type SubscriptionOption = {
  type: 'subscription';
  name: string;
  credits: number;
  price: number;
  billing: string;
  description: string;
  popular: boolean;
  bestValue: boolean;
};

type PurchaseOption = TopUpOption | SubscriptionOption;

const topUpOptions: TopUpOption[] = [
  { type: 'top-up', name: 'Single Stack', credits: 1000, price: 25, description: 'Perfect for getting started', popular: false, bestValue: false },
  { type: 'top-up', name: 'Belgian Special', credits: 2105, price: 50, description: 'Most popular choice', popular: true, bestValue: false },
  { type: 'top-up', name: 'Waffle Tower', credits: 4444, price: 100, description: 'Maximum value stack', popular: false, bestValue: true },
];

const subscriptionOptions: SubscriptionOption[] = [
  { type: 'subscription', name: 'Waffle Club', credits: 1000, price: 20, billing: '/ month', description: 'Join the monthly waffle feast with auto-renewed credits and VIP community access.', popular: true, bestValue: true },
];

const PurchaseCard = ({ option, onPurchaseClick }: { option: PurchaseOption, onPurchaseClick: (option: PurchaseOption) => void }) => (
  <Card className="relative flex h-full flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
    {(option.popular || option.bestValue) && (
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-semibold text-primary-foreground z-10 ${option.popular ? 'bg-accent text-accent-foreground' : 'bg-primary'}`}>
        {option.popular ? 'Popular' : 'Best Value'}
      </div>
    )}
    <CardHeader className="text-center pt-8">
      {option.type === 'top-up' ? (
        <>
          <CardTitle className="font-headline text-3xl">{option.name}</CardTitle>
          <CardDescription className="mt-2 text-base px-2">
            {option.credits.toLocaleString()} Credits
          </CardDescription>
        </>
      ) : (
        <>
          <CardTitle className="font-headline text-3xl">{option.name}</CardTitle>
          <CardDescription className="mt-2 text-base px-2">{option.credits.toLocaleString()} credits {option.billing}</CardDescription>
        </>
      )}
    </CardHeader>
    <CardContent className="flex flex-1 flex-col justify-between text-center">
      <div className="mb-6">
        <p className="mt-2 text-sm text-muted-foreground px-2 mb-4">{option.description}</p>
        <div className="text-sm text-gray-500 mb-2">for just</div>
        <span className="font-headline text-5xl font-bold">${option.price}</span>
        {option.type === 'subscription' && (
          <span className="text-lg text-muted-foreground">/{option.billing}</span>
        )}
      </div>
      <Button onClick={() => onPurchaseClick(option)} className="w-full font-headline text-lg">
        {option.type === 'top-up' ? 'Top Up' : 'Subscribe'}
      </Button>
    </CardContent>
  </Card>
);

export default function TopUpPage() {
  const { isAuthenticated } = useAuthGuard();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PurchaseOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      AuthService.getCurrentUser().then(result => {
        if (result.success && result.user) {
          setCurrentUser(result.user);
        }
      });
    }
  }, [isAuthenticated]);

  const handlePurchaseClick = (option: PurchaseOption) => {
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  const handleCryptoPayment = () => {
    setIsModalOpen(false);
    setIsCryptoModalOpen(true);
  };

  const handleCryptoPaymentSuccess = async (transactionHash: string, tokenSymbol: string, amount: string, userAddress: string, chainId: number) => {
    if (!selectedOption) return;

    try {
      // Verify the payment on the backend
      const response = await fetch('/api/crypto/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash,
          userAddress,
          tokenSymbol,
          expectedAmount: amount,
          chainId,
          packageCredits: selectedOption.credits,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Payment Successful!",
          description: `${selectedOption.credits.toLocaleString()} credits have been added to your account.`,
        });
        setIsCryptoModalOpen(false);
        setSelectedOption(null);
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handleStripePayment = async () => {
    if (!selectedOption || !currentUser) return;

    setIsLoading(true);
    try {
      // Find the package index
      let packageIndex: number;
      if (selectedOption.type === 'top-up') {
        packageIndex = topUpOptions.findIndex(opt => 
          opt.credits === selectedOption.credits && opt.price === selectedOption.price
        );
      } else {
        packageIndex = subscriptionOptions.findIndex(opt => 
          opt.name === selectedOption.name && opt.price === selectedOption.price
        );
      }

      if (packageIndex === -1) {
        throw new Error('Package not found');
      }

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedOption.type,
          packageIndex,
          userId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">Top Up Credits</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Choose a package or subscription that suits your needs.</p>
      </header>
      
      <div className="space-y-16">
        <div>
          <h2 className="font-headline text-3xl font-bold text-center mb-8">Subscriptions</h2>
          <div className="flex justify-center">
            <div className="w-full md:w-1/2 lg:w-1/3">
              {subscriptionOptions.map((option) => (
                <PurchaseCard key={`sub-${option.name}`} option={option} onPurchaseClick={handlePurchaseClick} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-headline text-3xl font-bold text-center mb-8">One-Time Top Up</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {topUpOptions.map((option) => (
              <PurchaseCard key={`topup-${option.credits}`} option={option} onPurchaseClick={handlePurchaseClick} />
            ))}
          </div>
        </div>
        
        <div>
          <Card className="mt-8 border-dashed border-primary/50 bg-card/50">
            <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8 p-8 text-center md:text-left">
              <Image
                src="https://placehold.co/120x120.png"
                data-ai-hint="token logo"
                alt="Soonak Meme Token Logo"
                width={120}
                height={120}
                className="rounded-full border-4 border-primary/20 object-cover"
              />
              <div className="max-w-2xl">
                <h3 className="font-headline text-2xl font-bold">Buyback & Burn Initiative</h3>
                <p className="mt-2 text-muted-foreground">
                  11% of all purchases go directly towards the buyback and burn of the <span className="font-bold text-foreground">Soonak Meme token</span>, helping to support its ecosystem and community.
                </p>
                <div className="mt-4 flex flex-col items-center md:items-start gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Contract:</span>
                    <code className="font-mono text-xs bg-muted p-1 rounded-md">PASTE_CONTRACT_ADDRESS_HERE</code>
                  </div>
                  <div>
                    <Link href="#" className="text-primary underline hover:text-primary/80">
                      Learn more about Soonak
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Confirm Purchase</DialogTitle>
            <DialogDescription>
              {selectedOption && (
                selectedOption.type === 'top-up' 
                ? `You are about to purchase the "${selectedOption.name}" package (${selectedOption.credits.toLocaleString()} credits) for $${selectedOption.price}.` 
                : `You are about to subscribe to the ${selectedOption.name} plan. You'll receive ${selectedOption.credits.toLocaleString()} credits for $${selectedOption.price}${selectedOption.billing}.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">Please select your payment method:</p>
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 text-lg hover:bg-secondary" 
              onClick={handleStripePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-4 h-6 w-6 animate-spin" />
              ) : (
                <CreditCard className="mr-4 h-6 w-6 text-primary" />
              )}
              {isLoading ? 'Creating Checkout...' : 'Pay with Card (Stripe)'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 text-lg hover:bg-secondary" 
              onClick={handleCryptoPayment}
            >
              <MetamaskIcon className="mr-4 h-6 w-6 text-primary" />
              Pay with Crypto (USDT/USDC)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CryptoPayment
        isOpen={isCryptoModalOpen}
        onClose={() => setIsCryptoModalOpen(false)}
        selectedPackage={selectedOption ? {
          credits: selectedOption.credits,
          price: selectedOption.price,
          name: selectedOption.name,
          description: selectedOption.description,
        } : null}
        onPaymentSuccess={handleCryptoPaymentSuccess}
      />
    </div>
  );
}
