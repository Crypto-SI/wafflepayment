import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase/database-service';

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, full_name, name, metadata } = await request.json();

    if (!user_id || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Register user in database
    const result = await DatabaseService.registerUser({
      user_id,
      email,
      full_name,
      name,
      metadata
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to register user'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 