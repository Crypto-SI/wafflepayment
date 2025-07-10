import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase/client';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const { metadata } = session;
  const { userId, credits, type, email } = metadata;

  if (type === 'credit_purchase') {
    // Add credits to user account
    const creditsToAdd = parseInt(credits);
    
    // Create credit transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        credits: creditsToAdd,
        transaction_type: 'purchase',
        payment_method: 'stripe',
        amount_usd: session.amount_total / 100, // Convert from cents
        transaction_hash: session.id,
        package_info: {
          credits: creditsToAdd,
          price: session.amount_total / 100,
          session_id: session.id,
        },
      });

    if (transactionError) {
      console.error('Error creating credit transaction:', transactionError);
    }

    console.log(`Added ${creditsToAdd} credits to user ${userId} via Stripe payment`);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  // Handle recurring subscription payments
  const customerId = invoice.customer;
  
  // Get customer metadata from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) return;
  
  const metadata = customer.metadata;
  const { userId, credits } = metadata;

  if (userId && credits) {
    const creditsToAdd = parseInt(credits);
    
    // Create credit transaction record for subscription payment
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        credits: creditsToAdd,
        transaction_type: 'purchase',
        payment_method: 'stripe_subscription',
        amount_usd: invoice.amount_paid / 100,
        transaction_hash: invoice.id,
        package_info: {
          credits: creditsToAdd,
          price: invoice.amount_paid / 100,
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
        },
      });

    if (transactionError) {
      console.error('Error creating subscription credit transaction:', transactionError);
    }

    console.log(`Added ${creditsToAdd} credits to user ${userId} via subscription payment`);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  // Handle subscription cancellation
  console.log(`Subscription ${subscription.id} was cancelled`);
  
  // You could update user's subscription status in the database here
  // For now, we'll just log it
} 