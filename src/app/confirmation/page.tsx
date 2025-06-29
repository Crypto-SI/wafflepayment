import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfirmationPage() {
  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline mt-6 text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="mt-2 text-base">
            Your credits have been added to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-4 text-left">
            <h3 className="font-headline text-lg">Transaction Summary</h3>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-medium text-foreground">550 Credits</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium text-foreground">$50.00</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium text-foreground">Stripe</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono text-xs font-medium text-foreground">txn_1a2b3c4d5e6f</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full">
              <Link href="/dashboard">Back to Top-Up</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/history">View History</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
