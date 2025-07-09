import { supabase } from './client'
import { DatabaseService } from './database-service'

export class AuthService {
  // Full signup flow: Create in auth.users + subscribers
  static async signUp(userData: {
    email: string
    password: string
    fullName?: string
    metadata?: any
  }) {
    try {
      // Step 1: Create user in auth.users (Supabase handles password hashing)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            ...userData.metadata
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user data returned')

      // Step 2: Create user in subscribers table
      const subscriberResult = await DatabaseService.registerUser({
        user_id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        name: userData.fullName,
        metadata: userData.metadata
      })

      if (!subscriberResult.success) {
        console.error('Failed to create subscriber:', subscriberResult.error)
        // Note: User is created in auth but not in subscribers
        // You might want to handle this differently
      }

      return {
        success: true,
        user: authData.user,
        subscriber: subscriberResult.data,
        needsEmailConfirmation: !authData.user.email_confirmed_at
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error }
    }
  }

  // Full login flow: Authenticate + get subscriber data
  static async signIn(credentials: {
    email: string
    password: string
  }) {
    try {
      // Step 1: Authenticate with auth.users
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user data returned')

      // Step 2: Check if subscriber record exists
      const subscriberResult = await DatabaseService.getSubscriberProfile(authData.user.id)
      
      if (subscriberResult.success && subscriberResult.data) {
        // Subscriber exists - return existing data
        console.log('Found existing subscriber for user:', authData.user.id)
        return {
          success: true,
          user: authData.user,
          subscriber: subscriberResult.data,
          session: authData.session
        }
      }
      
      // Step 3: Subscriber doesn't exist - create one (for users from other apps)
      console.log('No subscriber found for auth user, creating new subscriber record')
      const newSubscriber = await DatabaseService.registerUser({
        user_id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name,
        name: authData.user.user_metadata?.full_name,
        metadata: { 
          migrated: true,
          migratedAt: new Date().toISOString(),
          sourceApp: 'waffle-payments'
        }
      })
      
      if (!newSubscriber.success) {
        // Failed to create subscriber - still return auth data
        console.error('Failed to create subscriber for migrated user:', newSubscriber.error)
        return {
          success: true,
          user: authData.user,
          subscriber: null,
          session: authData.session,
          warning: 'Could not create app profile'
        }
      }
      
      console.log('Successfully created subscriber for migrated user')
      return {
        success: true,
        user: authData.user,
        subscriber: newSubscriber.data,
        session: authData.session,
        isNewSubscriber: true
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error }
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      return { success: false, error }
    }
  }

  // Get current user (both auth + subscriber data)
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      if (!user) return { success: false, error: 'No user logged in' }

      // Get subscriber data
      const subscriberResult = await DatabaseService.getSubscriberProfile(user.id)
      
      return {
        success: true,
        user,
        subscriber: subscriberResult.success ? subscriberResult.data : null
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return { success: false, error }
    }
  }

  // Password reset
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error }
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      return { success: false, error }
    }
  }
} 