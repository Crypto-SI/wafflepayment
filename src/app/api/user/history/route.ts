import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    
    // Check Supabase auth session using cookies
    try {
      const { createServerClient } = await import('@supabase/ssr');
      const { cookies } = await import('next/headers');
      
      const cookieStore = await cookies();
      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll().map(cookie => ({
                name: cookie.name,
                value: cookie.value
              }));
            },
            setAll(cookiesToSet) {
              // In API routes, we can't set cookies on the response here
              // But we can read them for authentication
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabaseServer.auth.getUser();
      if (!error && user) {
        userId = user.id;
      }
    } catch (error) {
      console.error('Error checking Supabase session:', error);
    }
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Get subscriber profile for signup date and basic info
    const { data: subscriber, error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriberError) {
      console.error('Error fetching subscriber:', subscriberError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 });
    }

    // Get transaction history from credit_transactions table (both crypto and stripe)
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transaction history'
      }, { status: 500 });
    }

    // Format all transactions (both Stripe and crypto from unified table)
    const allTransactions = transactions?.map(tx => ({
      id: tx.id,
      date: tx.timestamp,
      credits: tx.credits,
      transactionType: tx.type,
      paymentMethod: tx.source,
      transactionHash: tx.transaction_id,
      description: tx.description,
      status: 'Completed', // Transactions in the DB are considered completed
      type: tx.source === 'stripe' ? 'stripe' : 'crypto' // Distinguish payment methods
    })) || [];

    // Calculate combined stats
    const completedPurchases = allTransactions.filter(tx => 
      tx.transactionType === 'purchase' && tx.status === 'Completed'
    );
    
    const totalCreditsEarned = completedPurchases.reduce((sum, tx) => sum + tx.credits, 0);
    const totalSpent = completedPurchases.reduce((sum, tx) => sum + (tx.amountUsd || 0), 0);
    const totalCreditsUsed = allTransactions
      .filter(tx => tx.transactionType === 'usage')
      .reduce((sum, tx) => sum + Math.abs(tx.credits), 0);

    // Separate transactions by payment method
    const stripeTransactions = allTransactions.filter(tx => tx.type === 'stripe');
    const cryptoTransactions = allTransactions.filter(tx => tx.type === 'crypto');

    // Format the response
    const history = {
      user: {
        id: userId,
        email: subscriber.email,
        name: subscriber.full_name || subscriber.username,
        signupDate: subscriber.joined_at,
        authType: 'email',
        walletAddress: subscriber.wallet_address,
        currentCredits: subscriber.credits || 0,
        subscriptionTier: null,
        status: subscriber.is_active ? 'active' : 'inactive'
      },
      transactions: allTransactions,
      stats: {
        totalTransactions: allTransactions.length,
        totalCreditsEarned: totalCreditsEarned,
        totalCreditsUsed: totalCreditsUsed,
        totalSpent: totalSpent,
        stripeTransactions: stripeTransactions.length,
        cryptoTransactions: cryptoTransactions.length,
        pendingCryptoTransactions: 0 // All transactions in DB are completed
      }
    };

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting user history:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 