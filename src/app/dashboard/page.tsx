"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { MetamaskIcon } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";

type TopUpOption = {
  type: 'top-up';
  credits: number;
  price: number;
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
  { type: 'top-up', credits: 1000, price: 25, popular: false, bestValue: false },
  { type: 'top-up', credits: 2105, price: 50, popular: true, bestValue: false },
  { type: 'top-up', credits: 4444, price: 100, popular: false, bestValue: true },
];

const subscriptionOptions: SubscriptionOption[] = [
  { type: 'subscription', name: 'Monthly Plan', credits: 1000, price: 20, billing: '/ month', description: 'Get 1,000 credits auto-renewed each month, plus VIP community access.', popular: true, bestValue: true },
];

const PurchaseCard = ({ option, onPurchaseClick }: { option: PurchaseOption, onPurchaseClick: (option: PurchaseOption) => void }) => (
  <Card className="relative flex h-full flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
    {option.popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground z-10">
        Popular
      </div>
    )}
    {option.bestValue && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground z-10">
        Best Value
      </div>
    )}
    <CardHeader className="text-center pt-8">
      {option.type === 'top-up' ? (
        <>
          <CardTitle className="font-headline text-3xl">{option.credits.toLocaleString()} Credits</CardTitle>
          <CardDescription>for just</CardDescription>
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
        <span className="font-headline text-5xl font-bold">${option.price}</span>
        {option.type === 'subscription' && (
          <p className="mt-2 text-sm text-muted-foreground px-2 min-h-[40px]">{option.description}</p>
        )}
      </div>
      <Button onClick={() => onPurchaseClick(option)} className="w-full font-headline text-lg">
        {option.type === 'top-up' ? 'Top Up' : 'Subscribe'}
      </Button>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PurchaseOption | null>(null);

  const handlePurchaseClick = (option: PurchaseOption) => {
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">Pricing Plans</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Choose a package or subscription that suits your needs.</p>
      </header>
      
      <div className="space-y-16">
        <div>
          <h2 className="font-headline text-3xl font-bold text-center mb-8">Subscription</h2>
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
                ? `You are about to purchase ${selectedOption.credits.toLocaleString()} credits for $${selectedOption.price}.` 
                : `You are about to subscribe to the ${selectedOption.name} plan. You'll receive ${selectedOption.credits.toLocaleString()} credits for $${selectedOption.price}${selectedOption.billing}.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">Please select your payment method:</p>
            <Button variant="outline" className="w-full justify-start h-14 text-lg hover:bg-secondary" asChild>
              <Link href="/confirmation">
                <CreditCard className="mr-4 h-6 w-6 text-primary" />
                Pay with Card (Stripe)
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-14 text-lg hover:bg-secondary" asChild>
                <Link href="/confirmation">
                    <MetamaskIcon className="mr-4 h-6 w-6 text-primary" />
                    Pay with Crypto (MetaMask)
                </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
