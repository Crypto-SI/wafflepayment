-- Comprehensive migration: Fix crypto_transactions table schema
-- Run this in your Supabase SQL Editor

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add confirmations column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'confirmations'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN confirmations INTEGER DEFAULT 0;
        RAISE NOTICE 'Added confirmations column';
    END IF;

    -- Add credits_awarded column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'credits_awarded'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN credits_awarded INTEGER DEFAULT 0;
        RAISE NOTICE 'Added credits_awarded column';
    END IF;

    -- Add processed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added processed_at column';
    END IF;

    -- Add gas_used column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'gas_used'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN gas_used TEXT;
        RAISE NOTICE 'Added gas_used column';
    END IF;

    -- Add status column with check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN status TEXT DEFAULT 'pending';
        
        -- Add check constraint for status
        ALTER TABLE public.crypto_transactions 
        ADD CONSTRAINT crypto_transactions_status_check 
        CHECK (status IN ('pending', 'confirmed', 'failed'));
        
        RAISE NOTICE 'Added status column with check constraint';
    END IF;

    -- Update existing records to have default values
    UPDATE public.crypto_transactions 
    SET 
        confirmations = COALESCE(confirmations, 0),
        credits_awarded = COALESCE(credits_awarded, 0),
        status = COALESCE(status, 'pending')
    WHERE confirmations IS NULL OR credits_awarded IS NULL OR status IS NULL;

END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify all required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crypto_transactions'
ORDER BY ordinal_position; 