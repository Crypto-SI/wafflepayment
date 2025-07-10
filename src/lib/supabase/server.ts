import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate server-side environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create fallback values to prevent crashes
const defaultUrl = 'https://placeholder.supabase.co'
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.placeholder'

// Service role client for admin operations (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl || defaultUrl, 
  supabaseServiceKey || defaultKey, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to check if server-side Supabase is properly configured
export const isSupabaseServerConfigured = () => {
  return !!(supabaseUrl && supabaseServiceKey)
} 