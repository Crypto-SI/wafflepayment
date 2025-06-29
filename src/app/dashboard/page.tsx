"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const isAuthenticated = useAuthGuard();

  const user = {
    name: 'Satoshi Nakamoto',
    email: 'satoshi@waffle.com',
    avatarUrl: 'https://placehold.co/128x128.png',
    credits: 58008,
    isSubscriber: true,
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">My Dashboard</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Welcome back, {user.name.split(' ')[0]}.</p>
      </header>
      
      <div className="mx-auto grid max-w-4xl gap-8">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar person" />
              <AvatarFallback className="text-3xl">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold font-headline">{user.name}</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Credits Remaining</p>
                  <p className="text-4xl font-bold tracking-tight">{user.credits.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 text-center flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-muted-foreground">Subscription Status</p>
                  {user.isSubscriber ? (
                    <Badge className="mt-2 px-4 py-2 text-base font-semibold" variant="secondary">
                      <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-500" />
                      CryptoWaffle Subscriber
                    </Badge>
                  ) : (
                    <p className="text-2xl font-bold tracking-tight text-muted-foreground">Inactive</p>
                  )}
                </div>
            </div>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href="/top-up">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Top Up Credits
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Profile Management</CardTitle>
            <CardDescription>Update your account settings and manage your subscription.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <form className="space-y-4">
              <h3 className="font-headline text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} />
                </div>
              </div>
              <Button>Save Changes</Button>
            </form>
            
            <Separator />
            
            <form className="space-y-4">
               <h3 className="font-headline text-lg font-semibold">Change Password</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                </div>
              <Button>Update Password</Button>
            </form>

            <Separator />

            <div>
              <h3 className="font-headline text-lg font-semibold">Subscription</h3>
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4 mt-4">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-muted-foreground">{user.isSubscriber ? 'CryptoWaffle Subscriber' : 'No active subscription'}</p>
                </div>
                <Button variant="outline">Manage Subscription</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
