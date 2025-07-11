-- Clean SQL script for crypto_transactions table
-- This script handles existing objects gracefully

-- Create crypto_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crypto_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_hash TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscriber_id INTEGER REFERENCES public.subscribers(id) ON DELETE CASCADE NOT NULL,
    token_symbol TEXT NOT NULL,
    token_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    amount_wei TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    block_number TEXT NOT NULL,
    gas_used TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    credits_awarded INTEGER DEFAULT 0,
    confirmations INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'crypto_transactions' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own crypto transactions" ON public.crypto_transactions;
DROP POLICY IF EXISTS "Service role can manage crypto transactions" ON public.crypto_transactions;

-- Create RLS Policies
CREATE POLICY "Users can view own crypto transactions" ON public.crypto_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage crypto transactions" ON public.crypto_transactions
    FOR ALL USING (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_hash ON public.crypto_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON public.crypto_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created ON public.crypto_transactions(created_at DESC);

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crypto_transactions'
ORDER BY ordinal_position; 