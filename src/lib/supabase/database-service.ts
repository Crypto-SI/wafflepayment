import { supabase } from './client'
import { supabaseAdmin } from './server'
import type { Subscriber, CreditTransaction, UserCredits } from './client'

export class DatabaseService {
  // Register user in database (call after successful auth)
  static async registerUser(userData: {
    user_id: string
    email?: string
    full_name?: string
    username?: string
    avatar_url?: string
    wallet_address?: string
    joined_via?: string
  }) {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: userData.user_id,
          email: userData.email,
          full_name: userData.full_name,
          username: userData.username,
          avatar_url: userData.avatar_url,
          wallet_address: userData.wallet_address,
          joined_via: userData.joined_via || 'site',
          credits: 0, // Initialize with 0 credits
          is_active: true,
          joined_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Error registering user:', error)
      return { success: false, error }
    }
  }

  // Initialize user credits (0 balance) - credits are stored in subscribers table
  static async initializeUserCredits(userId: string) {
    try {
      // Credits are already initialized in the subscribers table, no separate table needed
      return { success: true, data: null }
    } catch (error) {
      console.error('Error initializing user credits:', error)
      return { success: false, error }
    }
  }

  // Record credit purchase (call after successful payment)
  static async recordCreditPurchase(transactionData: {
    userId: string
    credits: number
    paymentMethod: string
    amountUsd?: number
    transactionHash?: string
    description?: string
  }) {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: transactionData.userId,
          credits: transactionData.credits,
          type: 'purchase',
          source: transactionData.paymentMethod,
          transaction_id: transactionData.transactionHash,
          description: transactionData.description || `Credit purchase via ${transactionData.paymentMethod}`
        })
        .select()
        .single()

      if (error) throw error
      
      // Credits are automatically updated via database trigger
      
      return { success: true, data }
    } catch (error) {
      console.error('Error recording credit purchase:', error)
      return { success: false, error }
    }
  }

  // Update subscriber credits (credits are automatically updated via database trigger)
  static async updateSubscriberCredits(userId: string, creditChange: number) {
    try {
      // Credits are automatically updated via database trigger when credit_transactions are inserted
      // This method is kept for backward compatibility but does nothing
      return { success: true, data: null }
    } catch (error) {
      console.error('Error updating subscriber credits:', error)
      return { success: false, error }
    }
  }

  // Get user credits balance
  static async getUserCredits(userId: string): Promise<{ success: boolean; balance?: number; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { success: true, balance: data.credits || 0 }
    } catch (error) {
      console.error('Error getting user credits:', error)
      return { success: false, error }
    }
  }

  // Get user transaction history
  static async getUserTransactions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error getting user transactions:', error)
      return { success: false, error }
    }
  }

  // Get subscriber profile
  static async getSubscriberProfile(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error getting subscriber profile:', error)
      return { success: false, error }
    }
  }

  // Use credits (for future API calls)
  static async useCredits(userId: string, credits: number, description?: string) {
    try {
      // First check if user has enough credits
      const { success, balance } = await this.getUserCredits(userId)
      if (!success || !balance || balance < credits) {
        return { success: false, error: 'Insufficient credits' }
      }

      // Record the usage
      const { data, error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          credits: -credits, // Negative for usage
          transaction_type: 'usage',
          package_info: { description }
        })
        .select()
        .single()

      if (error) throw error

      // Update credits in subscribers table
      await this.updateSubscriberCredits(userId, -credits)

      return { success: true, data, newBalance: balance - credits }
    } catch (error) {
      console.error('Error using credits:', error)
      return { success: false, error }
    }
  }

  // Get user by wallet address
  static async getUserByWalletAddress(walletAddress: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error getting user by wallet address:', error)
      return { success: false, error }
    }
  }

  // Get user by wallet email format (wallet_address@wallet.local)
  static async getUserByWalletEmail(walletAddress: string) {
    try {
      const email = `${walletAddress.toLowerCase()}@wallet.local`
      const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error getting user by wallet email:', error)
      return { success: false, error }
    }
  }

  // Get auth user by wallet email format from auth.users table
  static async getAuthUserByWalletEmail(walletAddress: string) {
    try {
      const email = `${walletAddress.toLowerCase()}@wallet.local`
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) throw error
      
      // Find user with matching email
      const user = data.users.find(u => u.email === email)
      
      return { success: true, data: user || null }
    } catch (error) {
      console.error('Error getting auth user by wallet email:', error)
      return { success: false, error }
    }
  }

  // Get wallet user by checking auth.users table first, then subscribers table
  static async getWalletUser(walletAddress: string) {
    try {
      // First check auth.users table for the actual authentication record
      const authResult = await this.getAuthUserByWalletEmail(walletAddress)
      
      if (authResult.success && authResult.data) {
        // Auth user exists, now get the subscriber data
        const subscriberResult = await this.getSubscriberProfile(authResult.data.id)
        
        if (subscriberResult.success && subscriberResult.data) {
          return { success: true, data: subscriberResult.data }
        } else {
          // Auth user exists but no subscriber record - try to create it or find existing one
          console.log('Auth user exists but no subscriber record found, creating subscriber record for:', authResult.data.id)
          
          try {
            // Try to create subscriber record for existing auth user
            const { data, error } = await supabaseAdmin
              .from('subscribers')
              .insert({
                user_id: authResult.data.id,
                email: authResult.data.email,
                full_name: authResult.data.user_metadata?.name || authResult.data.email,
                name: authResult.data.user_metadata?.name || authResult.data.email,
                wallet_address: authResult.data.user_metadata?.wallet_address || walletAddress.toLowerCase(),
                auth_type: 'wallet',
                credits: 100, // Give new users 100 credits to start
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (error) {
              // Check if it's a duplicate key error (subscriber already exists)
              if (error.code === '23505') {
                console.log('Subscriber already exists, fetching existing record for email:', authResult.data.email)
                
                // Subscriber already exists, fetch the existing one
                const existingSubscriber = await supabaseAdmin
                  .from('subscribers')
                  .select('*')
                  .eq('email', authResult.data.email)
                  .single()
                
                if (existingSubscriber.error) {
                  console.error('Error fetching existing subscriber:', existingSubscriber.error)
                  return { success: false, error: existingSubscriber.error }
                }
                
                return { success: true, data: existingSubscriber.data }
              } else {
                // Other error, return it
                console.error('Error creating subscriber record:', error)
                return { success: false, error }
              }
            }
            
            // Successfully created new subscriber
            return { success: true, data }
            
          } catch (error) {
            console.error('Unexpected error in subscriber creation:', error)
            return { success: false, error }
          }
        }
      }
      
      // Fallback: check subscribers table directly (for backward compatibility)
      let result = await this.getUserByWalletAddress(walletAddress)
      
      if (!result.data) {
        result = await this.getUserByWalletEmail(walletAddress)
      }
      
      return result
    } catch (error) {
      console.error('Error getting wallet user:', error)
      return { success: false, error }
    }
  }

  // Create or get existing wallet user
  static async createWalletUser(userData: {
    wallet_address: string
    name?: string
    metadata?: any
  }) {
    try {
      // First check if user already exists in subscribers table
      console.log('Checking for existing user with wallet address:', userData.wallet_address)
      const existingUser = await this.getWalletUser(userData.wallet_address)
      
      if (existingUser.success && existingUser.data) {
        console.log('User already exists, returning existing user')
        return { success: true, data: existingUser.data, isExisting: true }
      }

      // Create new auth user with wallet metadata (trigger will create subscriber automatically)
      const email = `${userData.wallet_address.toLowerCase()}@wallet.local`
      
      try {
        console.log('Creating new auth user with wallet metadata')
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: crypto.randomUUID(), // Random password (won't be used)
          email_confirm: true,
          user_metadata: {
            wallet_address: userData.wallet_address.toLowerCase(),
            name: userData.name || `User ${userData.wallet_address.slice(0, 6)}...${userData.wallet_address.slice(-4)}`,
            auth_type: 'wallet'
          }
        });

        if (authError) {
          if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
            // User already exists, get the existing subscriber record
            console.log('Auth user already exists, getting existing subscriber')
            const existingSubscriber = await this.getWalletUser(userData.wallet_address);
            if (existingSubscriber.success && existingSubscriber.data) {
              return { success: true, data: existingSubscriber.data, isExisting: true };
            }
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('No user data returned from auth creation');
        }

        console.log('Auth user created successfully:', authData.user.id);

        // Wait a moment for the trigger to execute, then fetch the subscriber record
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get the subscriber record that should have been created by the trigger
        const { data: subscriberData, error: subscriberError } = await supabaseAdmin
          .from('subscribers')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (subscriberError) {
          console.error('Subscriber not created by trigger:', subscriberError);
          // Try to create manually as fallback
          const { data: manualSubscriber, error: manualError } = await supabaseAdmin
            .from('subscribers')
            .insert({
              user_id: authData.user.id,
              email: email,
              full_name: userData.name || `User ${userData.wallet_address.slice(0, 6)}...${userData.wallet_address.slice(-4)}`,
              username: userData.name || `User ${userData.wallet_address.slice(0, 6)}...${userData.wallet_address.slice(-4)}`,
              wallet_address: userData.wallet_address.toLowerCase(),
              joined_via: 'wallet',
              credits: 0,
              is_active: true
            })
            .select()
            .single();
          
          if (manualError) {
            throw new Error('Failed to create subscriber record: ' + manualError.message);
          }
          
          return { success: true, data: manualSubscriber, isExisting: false };
        }

        console.log('Successfully created new user via trigger:', subscriberData);
        return { success: true, data: subscriberData, isExisting: false };

      } catch (error: any) {
        console.error('Error in auth user creation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating wallet user:', error);
      return { success: false, error };
    }
  }
} 