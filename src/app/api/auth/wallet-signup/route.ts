import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { parseSiweMessage, validateSiweMessage, type SiweMessage } from 'viem/siwe';
import { DatabaseService } from '@/lib/supabase/database-service';

// Create a public client for signature verification
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function POST(request: NextRequest) {
  try {
    const { message, signature, nonce } = await request.json();

    if (!message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the SIWE message
    const siweMessage = parseSiweMessage(message) as SiweMessage;

    // Validate the message structure
    if (!validateSiweMessage({
      address: siweMessage?.address,
      message: siweMessage,
    })) {
      return NextResponse.json(
        { error: 'Invalid SIWE message structure' },
        { status: 400 }
      );
    }

    // Verify the nonce matches
    if (siweMessage.nonce !== nonce) {
      return NextResponse.json(
        { error: 'Invalid nonce' },
        { status: 400 }
      );
    }

    // Verify the signature
    const valid = await publicClient.verifyMessage({
      address: siweMessage.address,
      message: message,
      signature: signature as `0x${string}`,
    });

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const walletAddress = siweMessage.address.toLowerCase();
    const existingUser = await DatabaseService.getWalletUser(walletAddress);
    
    if (existingUser.success && existingUser.data) {
      return NextResponse.json(
        { error: 'User already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Create new wallet user
    const newUser = await DatabaseService.createWalletUser({
      wallet_address: walletAddress,
      name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    });

    if (newUser.success && newUser.data) {
      return NextResponse.json({
        success: true,
        message: 'User created successfully. You can now sign in.',
        user: {
          id: newUser.data.user_id,
          name: newUser.data.name,
          wallet_address: newUser.data.wallet_address,
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Wallet signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 