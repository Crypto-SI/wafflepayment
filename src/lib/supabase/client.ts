import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate client-side environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create clients with fallback values to prevent crashes
const defaultUrl = 'https://placeholder.supabase.co'
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder'

// SSR-compatible client for client-side operations with proper cookie handling
export const supabase = createBrowserClient(
  supabaseUrl || defaultUrl, 
  supabaseAnonKey || defaultKey
)

// Helper function to check if client-side Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Types for our database tables
export interface Subscriber {
  id: number
  user_id: string
  email?: string
  full_name?: string
  name?: string
  avatar_url?: string
  wallet_address?: string
  auth_type?: string
  credits?: number
  subscription_tier?: string
  status?: string
  is_admin?: boolean
  is_super_admin?: boolean
  is_email_verified?: boolean
  last_login?: string
  expires_at?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  credits: number
  transaction_type: 'purchase' | 'usage' | 'refund'
  payment_method?: string
  amount_usd?: number
  transaction_hash?: string
  package_info?: any
  created_at: string
}

export interface UserCredits {
  user_id: string
  balance: number
  updated_at: string
} 