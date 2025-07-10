import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
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

    // Get subscriber info for the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscriber record
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    // Check if this transaction has already been processed
    const { data: existingTransaction } = await supabase
      .from('crypto_transactions')
      .select('id')
      .eq('transaction_hash', transactionHash)
      .single();

    if (existingTransaction) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // Verify that the wallet address matches the authenticated user
    const { data: walletUser, error: userError } = await supabase
      .from('subscribers')
      .select('id, email, wallet_address, user_id')
      .eq('wallet_address', userAddress.toLowerCase())
      .single();

    if (userError || !walletUser) {
      return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
    }

    // Verify that the wallet belongs to the authenticated user
    if (walletUser.user_id !== user.id) {
      return NextResponse.json({ error: 'Wallet address does not belong to authenticated user' }, { status: 403 });
    }

    // Start transaction to add credits and record payment
    const { data: creditTransaction, error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        credits: packageCredits,
        transaction_type: 'purchase',
        payment_method: 'crypto',
        amount_usd: parseFloat(expectedAmount),
        transaction_hash: transactionHash,
        package_info: {
          token_symbol: tokenSymbol,
          token_address: token.address,
          chain_id: chainId,
          chain_name: token.chainName,
          from_address: fromAddress,
          to_address: toAddress,
          amount_wei: amount.toString(),
          block_number: receipt.blockNumber.toString(),
        }
      })
      .select()
      .single();

    if (creditError) {
      console.error('Error creating credit transaction:', creditError);
      return NextResponse.json({ error: 'Failed to record credit transaction' }, { status: 500 });
    }

    // Record the crypto transaction
    const { error: cryptoTxError } = await supabase
      .from('crypto_transactions')
      .insert({
        transaction_hash: transactionHash,
        user_id: user.id,
        subscriber_id: subscriber.id,
        token_symbol: tokenSymbol,
        token_address: token.address,
        chain_id: chainId,
        amount: expectedAmount,
        amount_wei: amount.toString(),
        from_address: fromAddress,
        to_address: toAddress,
        block_number: receipt.blockNumber.toString(),
        gas_used: receipt.gasUsed.toString(),
        status: 'confirmed',
        credits_awarded: packageCredits,
        processed_at: new Date().toISOString(),
      });

    if (cryptoTxError) {
      console.error('Error recording crypto transaction:', cryptoTxError);
      // Note: Credits have already been added, so we don't want to fail here
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits added successfully',
      transaction: {
        hash: transactionHash,
        credits: packageCredits,
        amount: expectedAmount,
        token: tokenSymbol,
        chain: token.chainName,
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

    const { data: transaction, error } = await supabase
      .from('crypto_transactions')
      .select('*')
      .eq('transaction_hash', transactionHash)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      transaction: {
        hash: transaction.transaction_hash,
        status: transaction.status,
        credits: transaction.credits_awarded,
        amount: transaction.amount,
        token: transaction.token_symbol,
        processedAt: transaction.processed_at,
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 