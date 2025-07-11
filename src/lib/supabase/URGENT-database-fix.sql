-- URGENT DATABASE FIX
-- Copy and paste this into your Supabase SQL Editor and run it

-- Add the missing confirmations column
ALTER TABLE public.crypto_transactions 
ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0;

-- Add other missing columns if they don't exist
ALTER TABLE public.crypto_transactions 
ADD COLUMN IF NOT EXISTS credits_awarded INTEGER DEFAULT 0;

ALTER TABLE public.crypto_transactions 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE public.crypto_transactions 
ADD COLUMN IF NOT EXISTS gas_used TEXT;

-- Update existing records to have 0 confirmations
UPDATE public.crypto_transactions 
SET confirmations = 0 
WHERE confirmations IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Show the table structure to verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crypto_transactions'
ORDER BY ordinal_position; 