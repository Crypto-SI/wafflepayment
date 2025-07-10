import { NextRequest, NextResponse } from 'next/server';
import { stripe, CREDIT_PACKAGES, SUBSCRIPTION_PACKAGES } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, packageIndex, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user data from Supabase
    const { data: subscriber, error: userError } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !subscriber) {
      console.error('Subscriber lookup error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let sessionConfig;
    const headersList = await headers();
    const origin = headersList.get('origin') || 'http://localhost:9002';

    if (type === 'top-up') {
      const package_ = CREDIT_PACKAGES[packageIndex];
      if (!package_) {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      sessionConfig = {
        mode: 'payment' as const,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${package_.name} - ${package_.credits.toLocaleString()} Credits`,
                description: `${package_.description} - Credit top-up for ${subscriber.email}`,
              },
              unit_amount: package_.price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/top-up`,
        metadata: {
          type: 'credit_purchase',
          userId: userId,
          credits: package_.credits.toString(),
          email: subscriber.email,
        },
      };
    } else if (type === 'subscription') {
      const package_ = SUBSCRIPTION_PACKAGES[packageIndex];
      if (!package_) {
        return NextResponse.json({ error: 'Invalid subscription package' }, { status: 400 });
      }

      sessionConfig = {
        mode: 'subscription' as const,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: package_.name,
                description: `${package_.description} - ${package_.credits.toLocaleString()} credits per month`,
              },
              unit_amount: package_.price * 100, // Convert to cents
              recurring: {
                interval: 'month' as const,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/top-up`,
        metadata: {
          type: 'subscription',
          userId: userId,
          credits: package_.credits.toString(),
          email: subscriber.email,
        },
      };
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      ...sessionConfig,
      customer_email: subscriber.email,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 