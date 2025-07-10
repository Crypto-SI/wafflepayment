-- Crypto Transactions Setup for Waffle Payments
-- Run this in your Supabase SQL Editor

-- 1. Add wallet support to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'email' CHECK (auth_type IN ('email', 'wallet'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_wallet_address ON public.subscribers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_subscribers_auth_type ON public.subscribers(auth_type);

-- 2. Create crypto_transactions table
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

-- 3. Create indexes for crypto_transactions
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_hash ON public.crypto_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_subscriber_id ON public.crypto_transactions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON public.crypto_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_token ON public.crypto_transactions(token_symbol, chain_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created_at ON public.crypto_transactions(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for crypto_transactions
CREATE POLICY "Users can view own crypto transactions" ON public.crypto_transactions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.subscribers 
            WHERE id = crypto_transactions.subscriber_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can insert crypto transactions" ON public.crypto_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Add currency field to credit_transactions if it doesn't exist
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 7. Create index for transaction hash lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_hash ON public.credit_transactions(transaction_hash);

-- 8. Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_crypto_transactions_updated_at ON public.crypto_transactions;
CREATE TRIGGER update_crypto_transactions_updated_at 
    BEFORE UPDATE ON public.crypto_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.crypto_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.credit_transactions TO authenticated;
GRANT SELECT, UPDATE ON public.subscribers TO authenticated;

-- 11. Create a function to process crypto payments
CREATE OR REPLACE FUNCTION process_crypto_payment(
    p_transaction_hash TEXT,
    p_user_id UUID,
    p_subscriber_id INTEGER,
    p_token_symbol TEXT,
    p_token_address TEXT,
    p_chain_id INTEGER,
    p_amount TEXT,
    p_amount_wei TEXT,
    p_from_address TEXT,
    p_to_address TEXT,
    p_block_number TEXT,
    p_gas_used TEXT,
    p_credits_awarded INTEGER
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    crypto_tx_id UUID;
    credit_tx_id UUID;
BEGIN
    -- Insert crypto transaction
    INSERT INTO public.crypto_transactions (
        transaction_hash, user_id, subscriber_id, token_symbol, token_address,
        chain_id, amount, amount_wei, from_address, to_address, block_number,
        gas_used, status, credits_awarded, processed_at
    ) VALUES (
        p_transaction_hash, p_user_id, p_subscriber_id, p_token_symbol, p_token_address,
        p_chain_id, p_amount, p_amount_wei, p_from_address, p_to_address, p_block_number,
        p_gas_used, 'confirmed', p_credits_awarded, NOW()
    ) RETURNING id INTO crypto_tx_id;
    
    -- Insert credit transaction
    INSERT INTO public.credit_transactions (
        user_id, credits, transaction_type, payment_method, amount_usd, 
        transaction_hash, currency, package_info
    ) VALUES (
        p_user_id, p_credits_awarded, 'purchase', 'crypto', p_amount::DECIMAL,
        p_transaction_hash, p_token_symbol, json_build_object(
            'token_symbol', p_token_symbol,
            'token_address', p_token_address,
            'chain_id', p_chain_id,
            'from_address', p_from_address,
            'to_address', p_to_address,
            'amount_wei', p_amount_wei,
            'block_number', p_block_number
        )
    ) RETURNING id INTO credit_tx_id;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'crypto_transaction_id', crypto_tx_id,
        'credit_transaction_id', credit_tx_id,
        'credits_awarded', p_credits_awarded
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        result := json_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION process_crypto_payment TO authenticated; 