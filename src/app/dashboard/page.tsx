"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { MetamaskIcon } from "@/components/icons";
import Link from "next/link";

const topUpOptions = [
  { credits: 100, price: 10, popular: false, bestValue: false },
  { credits: 550, price: 50, popular: true, bestValue: false },
  { credits: 1200, price: 100, popular: false, bestValue: true },
];

type TopUpOption = typeof topUpOptions[0];

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<TopUpOption | null>(null);

  const handleTopUpClick = (option: TopUpOption) => {
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">Top-Up Your Credits</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Choose a package that suits your needs. More credits, more value!</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {topUpOptions.map((option) => (
          <Card key={option.credits} className="relative flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
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
              <CardTitle className="font-headline text-3xl">{option.credits.toLocaleString()} Credits</CardTitle>
              <CardDescription>for just</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between text-center">
              <div className="mb-6">
                <span className="font-headline text-5xl font-bold">${option.price}</span>
              </div>
              <Button onClick={() => handleTopUpClick(option)} className="w-full font-headline text-lg">
                Top Up
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase {selectedOption?.credits.toLocaleString()} credits for ${selectedOption?.price}.
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
