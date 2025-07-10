-- Add wallet support to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'email' CHECK (auth_type IN ('email', 'wallet'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_wallet_address ON public.subscribers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_subscribers_auth_type ON public.subscribers(auth_type);

-- Create crypto_transactions table
CREATE TABLE IF NOT EXISTS public.crypto_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_hash TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscriber_id INTEGER REFERENCES public.subscribers(id) ON DELETE CASCADE,
    token_symbol TEXT NOT NULL,
    token_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    amount TEXT NOT NULL, -- Store as string to preserve precision
    amount_wei TEXT NOT NULL, -- Raw amount in wei/smallest unit
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    block_number TEXT NOT NULL,
    gas_used TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    credits_awarded INTEGER NOT NULL DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for crypto_transactions
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_hash ON public.crypto_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_subscriber_id ON public.crypto_transactions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON public.crypto_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_token ON public.crypto_transactions(token_symbol, chain_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created_at ON public.crypto_transactions(created_at DESC);

-- Add RLS policies for crypto_transactions
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own transactions
CREATE POLICY "Users can view own crypto transactions" ON public.crypto_transactions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.subscribers 
            WHERE id = crypto_transactions.subscriber_id 
            AND user_id = auth.uid()
        )
    );

-- Policy: Only authenticated users can insert (via API)
CREATE POLICY "Authenticated users can insert crypto transactions" ON public.crypto_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update the credit_transactions table to support crypto payments
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Create index for transaction hash lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_hash ON public.credit_transactions(transaction_hash);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_crypto_transactions_updated_at 
    BEFORE UPDATE ON public.crypto_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.crypto_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.credit_transactions TO authenticated;
GRANT SELECT, UPDATE ON public.subscribers TO authenticated; 