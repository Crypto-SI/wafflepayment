import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { DatabaseService } from '@/lib/supabase/database-service';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;
    
    // Check NextAuth session first (wallet users)
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      userId = session.user.id;
      userEmail = session.user.email || null;
    } else {
      // Check Supabase auth session (email users) using cookies
      try {
        // Create a Supabase server client that can read cookies
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
          userEmail = user.email || null;
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

    // Get subscriber profile for the authenticated user
    const subscriberResult = await DatabaseService.getSubscriberProfile(userId);
    
    if (subscriberResult.success && subscriberResult.data) {
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          user_metadata: { 
            wallet_address: subscriberResult.data.wallet_address,
            auth_type: subscriberResult.data.auth_type || 'email'
          }
        },
        subscriber: subscriberResult.data
      });
    } else {
      // Subscriber profile not found, but user is authenticated
      // This can happen if the database trigger didn't create the subscriber record
      console.log('Authenticated user but no subscriber profile found:', userId);
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          user_metadata: { 
            auth_type: 'email'
          }
        },
        subscriber: null,
        needsProfile: true
      });
    }

  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const { name, email, avatarUrl } = await request.json();

    // Update subscriber profile
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .update({
        ...(name && { username: name, full_name: name }),
        ...(email && { email }),
        ...(avatarUrl && { avatar_url: avatarUrl })
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}