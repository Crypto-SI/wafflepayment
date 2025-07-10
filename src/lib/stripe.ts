import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Client-side Stripe promise
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Credit package configurations
export const CREDIT_PACKAGES = [
  { name: 'Single Stack', credits: 1000, price: 25, priceId: 'price_1000_credits', description: 'Perfect for getting started' },
  { name: 'Belgian Special', credits: 2105, price: 50, priceId: 'price_2105_credits', description: 'Most popular choice' },
  { name: 'Waffle Tower', credits: 4444, price: 100, priceId: 'price_4444_credits', description: 'Maximum value stack' },
] as const;

export const SUBSCRIPTION_PACKAGES = [
  { 
    name: 'Waffle Club', 
    credits: 1000, 
    price: 20, 
    priceId: 'price_monthly_subscription',
    interval: 'month',
    description: 'Join the monthly waffle feast with auto-renewed credits and VIP community access'
  },
] as const;

export type CreditPackage = typeof CREDIT_PACKAGES[number];
export type SubscriptionPackage = typeof SUBSCRIPTION_PACKAGES[number]; 