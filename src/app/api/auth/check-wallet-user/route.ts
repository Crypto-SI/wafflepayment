import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase/database-service';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user exists with this wallet address
    const existingUser = await DatabaseService.getWalletUser(walletAddress.toLowerCase());
    
    return NextResponse.json({
      exists: existingUser.success && existingUser.data,
      user: existingUser.success && existingUser.data ? {
        id: existingUser.data.user_id,
        name: existingUser.data.name,
        wallet_address: existingUser.data.wallet_address,
      } : null
    });

  } catch (error) {
    console.error('Check wallet user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 