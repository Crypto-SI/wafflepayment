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

    // Verify that the wallet address matches a user in our system
    // Look for user by wallet address OR by email pattern for wallet users
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, wallet_address, user_id, auth_type')
      .or(`wallet_address.eq.${userAddress.toLowerCase()},email.eq.${userAddress.toLowerCase()}@wallet.local`)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ 
        error: 'Wallet address not found. Please ensure you are logged in with the correct wallet address.' 
      }, { status: 404 });
    }

    // Use a database transaction with advisory lock to prevent race conditions
    const { data: result, error: transactionError } = await supabaseAdmin.rpc('process_crypto_payment', {
      p_transaction_hash: transactionHash,
      p_user_id: currentUser.user_id,
      p_subscriber_id: currentUser.id,
      p_token_symbol: tokenSymbol,
      p_token_address: token.address,
      p_chain_id: chainId,
      p_amount: expectedAmount,
      p_amount_wei: amount.toString(),
      p_from_address: fromAddress,
      p_to_address: toAddress,
      p_block_number: receipt.blockNumber.toString(),
      p_gas_used: receipt.gasUsed.toString(),
      p_confirmations: confirmations,
      p_package_credits: packageCredits,
      p_chain_name: token.chainName
    });

    if (transactionError) {
      console.error('Error processing crypto payment:', transactionError);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    const { already_processed, credits_awarded } = result || { already_processed: false, credits_awarded: 0 };

    if (already_processed) {
      console.log(`⚠️ Transaction ${transactionHash} already processed`);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        transaction: {
          hash: transactionHash,
          credits: credits_awarded,
          amount: expectedAmount,
          token: tokenSymbol,
          chain: token.chainName,
          confirmations: confirmations,
          status: 'confirmed'
        }
      });
    } else {
      console.log(`✅ Credits awarded immediately: ${packageCredits} credits to user ${currentUser.user_id} for transaction ${transactionHash}`);
      
      // Debug: Check if subscriber record exists and credits were updated
      const { data: subscriberCheck } = await supabaseAdmin
        .from('subscribers')
        .select('user_id, email, credits, updated_at')
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
    }

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
      .from('crypto_transactions')
      .select('*')
      .eq('transaction_hash', transactionHash)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction: {
        hash: transaction.transaction_hash,
        status: transaction.status,
        confirmations: transaction.confirmations || 0,
        credits: transaction.credits_awarded || 0,
        amount: transaction.amount,
        token: transaction.token_symbol,
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