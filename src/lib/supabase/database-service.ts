import { supabase } from './client'
import type { Subscriber, CreditTransaction, UserCredits } from './client'

export class DatabaseService {
  // Register user in database (call after successful auth)
  static async registerUser(userData: {
    user_id: string
    email?: string
    full_name?: string
    name?: string
    avatar_url?: string
    metadata?: any
  }) {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: userData.user_id,
          email: userData.email,
          full_name: userData.full_name,
          name: userData.name,
          avatar_url: userData.avatar_url,
          metadata: userData.metadata,
          credits: 0, // Initialize with 0 credits
          status: 'active',
          is_email_verified: false,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) throw error
      
      // Initialize user credits (separate table)
      await this.initializeUserCredits(userData.user_id)
      
      return { success: true, data }
    } catch (error) {
      console.error('Error registering user:', error)
      return { success: false, error }
    }
  }

  // Initialize user credits (0 balance)
  static async initializeUserCredits(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          balance: 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      return { success: true, data }
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
    amountUsd: number
    transactionHash?: string
    packageInfo?: any
  }) {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: transactionData.userId,
          credits: transactionData.credits,
          transaction_type: 'purchase',
          payment_method: transactionData.paymentMethod,
          amount_usd: transactionData.amountUsd,
          transaction_hash: transactionData.transactionHash,
          package_info: transactionData.packageInfo
        })
        .select()
        .single()

      if (error) throw error
      
      // Update credits in subscribers table
      await this.updateSubscriberCredits(transactionData.userId, transactionData.credits)
      
      return { success: true, data }
    } catch (error) {
      console.error('Error recording credit purchase:', error)
      return { success: false, error }
    }
  }

  // Update subscriber credits
  static async updateSubscriberCredits(userId: string, creditChange: number) {
    try {
      // Get current credits
      const { data: subscriber, error: getError } = await supabase
        .from('subscribers')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (getError) throw getError

      const currentCredits = subscriber?.credits || 0
      const newCredits = currentCredits + creditChange

      // Update credits
      const { data, error } = await supabase
        .from('subscribers')
        .update({ 
          credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
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
      const { data, error } = await supabase
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
} 