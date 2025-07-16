import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { PAYMENT_WALLET_ADDRESS, SUPPORTED_TOKENS } from '@/lib/crypto-tokens';
import { createPublicClient, http, parseUnits, type Log } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism } from 'viem/chains';

// Chain configurations for RPC calls
const chainConfigs: Record<number, { chain: any; rpc: string }> = {
  [mainnet.id]: { chain: mainnet, rpc: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com' },
  [polygon.id]: { chain: polygon, rpc: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com' },
  [arbitrum.id]: { chain: arbitrum, rpc: process.env.ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com' },
  [base.id]: { chain: base, rpc: process.env.BASE_RPC_URL || 'https://base.llamarpc.com' },
  [optimism.id]: { chain: optimism, rpc: process.env.OPTIMISM_RPC_URL || 'https://optimism.llamarpc.com' },
};

// Award credits immediately when transaction is created (0 confirmations)
const REQUIRED_CONFIRMATIONS = 0;

interface PaymentVerificationRequest {
  transactionHash: string;
  userAddress: string;
  tokenSymbol: string;
  expectedAmount: string;
  chainId: number;
  packageCredits: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentVerificationRequest = await request.json();
    const { transactionHash, userAddress, tokenSymbol, expectedAmount, chainId, packageCredits } = body;

    // Validate required fields
    if (!transactionHash || !userAddress || !tokenSymbol || !expectedAmount || !chainId || !packageCredits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get token configuration
    const token = SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol && t.chainId === chainId);
    if (!token) {
      return NextResponse.json({ error: 'Unsupported token or chain' }, { status: 400 });
    }

    // Get chain configuration
    const chainConfig = chainConfigs[chainId];
    if (!chainConfig) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    // Create public client for blockchain interaction
    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http(chainConfig.rpc),
    });

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 400 });
    }

    // Get current block number to calculate confirmations
    const currentBlockNumber = await publicClient.getBlockNumber();
    const confirmations = Number(currentBlockNumber - receipt.blockNumber);

    console.log(`Transaction ${transactionHash} has ${confirmations} confirmations (awarding credits immediately)`);

    // Get transaction details
    const transaction = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`,
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction details not found' }, { status: 404 });
    }

    // Verify transaction details
    const expectedAmountWei = parseUnits(expectedAmount, token.decimals);
    
    // For ERC-20 transfers, we need to check the logs
    const transferLog = receipt.logs.find((log: Log) => {
      // ERC-20 Transfer event signature
      const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      return log.topics[0] === transferEventSignature && 
             log.address.toLowerCase() === token.address.toLowerCase();
    });

    if (!transferLog) {
      return NextResponse.json({ error: 'No transfer event found in transaction' }, { status: 400 });
    }

    // Decode transfer event
    const fromAddress = `0x${transferLog.topics[1]?.slice(-40)}`;
    const toAddress = `0x${transferLog.topics[2]?.slice(-40)}`;
    const amount = BigInt(transferLog.data);

    // Verify the transfer details
    if (fromAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Transaction sender does not match user address' }, { status: 400 });
    }

    if (toAddress.toLowerCase() !== PAYMENT_WALLET_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Transaction recipient does not match payment address' }, { status: 400 });
    }

    if (amount < expectedAmountWei) {
      return NextResponse.json({ error: 'Transaction amount is less than expected' }, { status: 400 });
    }

    // Get the current user from the session instead of trying to match wallet addresses
    // Since we use email-based auth, we need to get the user from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Authentication required. Please log in to process payment.' 
      }, { status: 401 });
    }

    // Get user from session token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid authentication. Please log in again.' 
      }, { status: 401 });
    }

    // Get subscriber record for the authenticated user
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('subscribers')
      .select('user_id, email, username, credits')
      .eq('user_id', user.id)
      .single();

    if (userError || !currentUser) {
      console.error('Subscriber record not found for authenticated user:', user.id, userError);
      return NextResponse.json({ 
        error: 'User profile not found. Please refresh the page and try again.' 
      }, { status: 404 });
    }

    // Check if transaction already processed
    const { data: existingTransaction } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, credits')
      .eq('transaction_id', transactionHash)
      .single();

    if (existingTransaction) {
      console.log(`⚠️ Transaction ${transactionHash} already processed`);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        transaction: {
          hash: transactionHash,
          credits: existingTransaction.credits || packageCredits,
          amount: expectedAmount,
          token: tokenSymbol,
          chain: token.chainName,
          confirmations: confirmations,
          status: 'confirmed'
        }
      });
    }

    // Record the crypto transaction
    const { data: cryptoTransaction, error: cryptoError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: currentUser.user_id,
        type: 'purchase',
        credits: packageCredits,
        transaction_id: transactionHash,
        source: 'ethereum', // or map chainId to appropriate source
        description: `Crypto payment: ${packageCredits} credits via ${tokenSymbol} on ${token.chainName}`
      })
      .select()
      .single();

    if (cryptoError) {
      console.error('Error recording crypto transaction:', cryptoError);
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
    }

    // Add credits to user account immediately
    const { error: creditError } = await supabaseAdmin
      .from('subscribers')
      .update({
        credits: currentUser.credits + packageCredits
      })
      .eq('user_id', currentUser.user_id);

    if (creditError) {
      console.error('Error adding credits:', creditError);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    console.log(`✅ Credits awarded immediately: ${packageCredits} credits to user ${currentUser.user_id} for transaction ${transactionHash}`);
    
    // Debug: Check if subscriber record exists and credits were updated
    const { data: subscriberCheck } = await supabaseAdmin
      .from('subscribers')
      .select('user_id, email, credits')
      .eq('user_id', currentUser.user_id)
      .single();
    
    console.log(`📊 Subscriber check after credit award:`, subscriberCheck);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits awarded immediately!',
      transaction: {
        hash: transactionHash,
        credits: packageCredits,
        amount: expectedAmount,
        token: tokenSymbol,
        chain: token.chainName,
        confirmations: confirmations,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionHash = searchParams.get('hash');

    if (!transactionHash) {
      return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
    }

    const { data: transaction, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('transaction_id', transactionHash)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction: {
        hash: transaction.transaction_id,
        status: 'confirmed',
        confirmations: REQUIRED_CONFIRMATIONS,
        credits: transaction.credits || 0,
        amount: 'N/A',
        token: 'N/A',
        requiredConfirmations: REQUIRED_CONFIRMATIONS
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 