'use client';

import { supabase, isSupabaseConfigured } from './client'
import { getSession } from 'next-auth/react'

export class AuthService {
  // Helper method to check if Supabase operations can be performed
  private static checkSupabaseConfig() {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase client is not properly configured. Some features may not work.')
      return false
    }
    return true
  }

  // Get current user (supports both email and wallet auth)
  static async getCurrentUser() {
    try {
      // Use the API endpoint to get user profile (works for both client and server)
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Not authenticated' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error getting current user:', error);
      return { success: false, error };
    }
  }

  // Check if user is authenticated (email or wallet)
  static async isAuthenticated() {
    try {
      const result = await this.getCurrentUser()
      return result.success && result.user
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  // Sign out (handles both email and wallet auth)
  static async signOut() {
    try {
      // Sign out from NextAuth (wallet users)
      const { signOut: nextAuthSignOut } = await import('next-auth/react')
      await nextAuthSignOut({ redirect: false })
      
      // Sign out from Supabase (email users) - only if configured
      if (this.checkSupabaseConfig()) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      return { success: false, error }
    }
  }

  // Update user profile via API
  static async updateProfile(profileData: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  }) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  }

  // Full signup flow via API
  static async signUp(userData: {
    email: string
    password: string
    fullName?: string
    metadata?: any
  }) {
    try {
      if (!this.checkSupabaseConfig()) {
        return { success: false, error: 'Service configuration error' }
      }

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

      // Step 2: Create user in subscribers table via API
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          name: userData.fullName,
          metadata: userData.metadata
        }),
      });

      let subscriberResult = { success: true, data: null };
      if (response.ok) {
        subscriberResult = await response.json();
      } else {
        console.error('Failed to create subscriber via API');
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
      if (!this.checkSupabaseConfig()) {
        return { success: false, error: 'Service configuration error' }
      }

      // Step 1: Authenticate with auth.users
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user data returned')

      // Step 2: Get subscriber data via API
      const userResult = await this.getCurrentUser();
      
      return {
        success: true,
        user: authData.user,
        subscriber: userResult.subscriber,
        session: authData.session
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error }
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      if (!this.checkSupabaseConfig()) {
        return { success: false, error: 'Service configuration error' }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { success: false, error }
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    try {
      if (!this.checkSupabaseConfig()) {
        return { success: false, error: 'Service configuration error' }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      return { success: false, error }
    }
  }
} 