import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    
    // Check NextAuth session first (wallet users)
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Check Supabase auth session (email users) using cookies
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

    // Get transaction history from credit_transactions table
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transaction history'
      }, { status: 500 });
    }

    // Get crypto transaction history
    const { data: cryptoTransactions, error: cryptoError } = await supabaseAdmin
      .from('crypto_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cryptoError) {
      console.error('Error fetching crypto transactions:', cryptoError);
      // Don't fail the entire request if crypto transactions fail
    }

    // Format credit transactions (Stripe payments)
    const creditTransactions = transactions?.map(tx => ({
      id: tx.id,
      date: tx.created_at,
      credits: tx.credits,
      transactionType: tx.transaction_type,
      paymentMethod: tx.payment_method,
      amountUsd: tx.amount_usd,
      transactionHash: tx.transaction_hash,
      packageInfo: tx.package_info,
      status: 'Completed', // Transactions in the DB are considered completed
      type: 'credit' // Distinguish from crypto transactions
    })) || [];

    // Format crypto transactions
    const formattedCryptoTransactions = cryptoTransactions?.map(tx => ({
      id: tx.id,
      date: tx.created_at,
      credits: tx.credits_awarded || 0,
      transactionType: 'purchase',
      paymentMethod: 'crypto',
      amountUsd: parseFloat(tx.amount || '0'),
      transactionHash: tx.transaction_hash,
      packageInfo: {
        token_symbol: tx.token_symbol,
        token_address: tx.token_address,
        chain_id: tx.chain_id,
        from_address: tx.from_address,
        to_address: tx.to_address,
        amount_wei: tx.amount_wei,
        block_number: tx.block_number,
        confirmations: tx.confirmations || 0
      },
      status: tx.status === 'confirmed' ? 'Completed' : 
              tx.status === 'pending' ? `Pending (${tx.confirmations || 0}/3 confirmations)` : 
              'Failed',
      type: 'crypto', // Distinguish from credit transactions
      confirmations: tx.confirmations || 0,
      tokenSymbol: tx.token_symbol,
      chainId: tx.chain_id
    })) || [];

    // Combine and sort all transactions by date
    const allTransactions = [...creditTransactions, ...formattedCryptoTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate combined stats
    const completedPurchases = allTransactions.filter(tx => 
      tx.transactionType === 'purchase' && tx.status === 'Completed'
    );
    
    const totalCreditsEarned = completedPurchases.reduce((sum, tx) => sum + tx.credits, 0);
    const totalSpent = completedPurchases.reduce((sum, tx) => sum + (tx.amountUsd || 0), 0);
    const totalCreditsUsed = allTransactions
      .filter(tx => tx.transactionType === 'usage')
      .reduce((sum, tx) => sum + Math.abs(tx.credits), 0);

    // Format the response
    const history = {
      user: {
        id: userId,
        email: subscriber.email,
        name: subscriber.full_name || subscriber.name,
        signupDate: subscriber.created_at,
        authType: subscriber.auth_type,
        walletAddress: subscriber.wallet_address,
        currentCredits: subscriber.credits || 0,
        subscriptionTier: subscriber.subscription_tier,
        status: subscriber.status
      },
      transactions: allTransactions,
      stats: {
        totalTransactions: allTransactions.length,
        totalCreditsEarned: totalCreditsEarned,
        totalCreditsUsed: totalCreditsUsed,
        totalSpent: totalSpent,
        stripeTransactions: creditTransactions.length,
        cryptoTransactions: formattedCryptoTransactions.length,
        pendingCryptoTransactions: formattedCryptoTransactions.filter(tx => tx.status.includes('Pending')).length
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