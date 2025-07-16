import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
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
    
    // Check if transaction already processed
    const { data: existingTransaction } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, credits')
      .eq('transaction_id', session.id)
      .single();

    if (existingTransaction) {
      console.log(`⚠️ Stripe transaction ${session.id} already processed`);
      return;
    }

    // Create credit transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        credits: creditsToAdd,
        transaction_id: session.id,
        source: 'stripe',
        description: `Stripe payment: ${creditsToAdd} credits for $${session.amount_total / 100}`
      });

    if (transactionError) {
      console.error('Error creating credit transaction:', transactionError);
      return;
    }

    // Get current user credits and add new credits
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('subscribers')
      .select('user_id, credits')
      .eq('user_id', userId)
      .single();

    if (userError || !currentUser) {
      console.error('Error finding user for credit update:', userError);
      return;
    }

    // Add credits to user account immediately
    const { error: creditError } = await supabaseAdmin
      .from('subscribers')
      .update({
        credits: currentUser.credits + creditsToAdd
      })
      .eq('user_id', userId);

    if (creditError) {
      console.error('Error adding credits to user:', creditError);
      return;
    }

    console.log(`✅ Added ${creditsToAdd} credits to user ${userId} via Stripe payment (new balance: ${currentUser.credits + creditsToAdd})`);
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
    
    // Check if transaction already processed
    const { data: existingTransaction } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, credits')
      .eq('transaction_id', invoice.id)
      .single();

    if (existingTransaction) {
      console.log(`⚠️ Stripe subscription transaction ${invoice.id} already processed`);
      return;
    }

    // Create credit transaction record for subscription payment
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        credits: creditsToAdd,
        transaction_id: invoice.id,
        source: 'stripe',
        description: `Stripe subscription: ${creditsToAdd} credits for $${invoice.amount_paid / 100}`
      });

    if (transactionError) {
      console.error('Error creating subscription credit transaction:', transactionError);
      return;
    }

    // Get current user credits and add new credits
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('subscribers')
      .select('user_id, credits')
      .eq('user_id', userId)
      .single();

    if (userError || !currentUser) {
      console.error('Error finding user for subscription credit update:', userError);
      return;
    }

    // Add credits to user account immediately
    const { error: creditError } = await supabaseAdmin
      .from('subscribers')
      .update({
        credits: currentUser.credits + creditsToAdd
      })
      .eq('user_id', userId);

    if (creditError) {
      console.error('Error adding subscription credits to user:', creditError);
      return;
    }

    console.log(`✅ Added ${creditsToAdd} credits to user ${userId} via subscription payment (new balance: ${currentUser.credits + creditsToAdd})`);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  // Handle subscription cancellation
  console.log(`Subscription ${subscription.id} was cancelled`);
  
  // You could update user's subscription status in the database here
  // For now, we'll just log it
} 