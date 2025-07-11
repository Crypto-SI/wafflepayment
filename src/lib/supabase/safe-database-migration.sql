-- Safe Database Migration: Fix crypto_transactions and ensure credit system works
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
    ELSE
        RAISE NOTICE 'confirmations column already exists';
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
    ELSE
        RAISE NOTICE 'credits_awarded column already exists';
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
    ELSE
        RAISE NOTICE 'processed_at column already exists';
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
    ELSE
        RAISE NOTICE 'gas_used column already exists';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;

    -- Update existing records to have default values
    UPDATE public.crypto_transactions 
    SET 
        confirmations = COALESCE(confirmations, 0),
        credits_awarded = COALESCE(credits_awarded, 0),
        status = COALESCE(status, 'pending')
    WHERE confirmations IS NULL OR credits_awarded IS NULL OR status IS NULL;

END $$;

-- Ensure the credit update function exists and is up to date
CREATE OR REPLACE FUNCTION update_subscriber_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Update credits in subscribers table
    UPDATE public.subscribers 
    SET credits = COALESCE(credits, 0) + NEW.credits,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RAISE NOTICE 'Updated credits for user %: added % credits', NEW.user_id, NEW.credits;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's working properly
DROP TRIGGER IF EXISTS trigger_update_subscriber_credits ON public.credit_transactions;

CREATE TRIGGER trigger_update_subscriber_credits
    AFTER INSERT ON public.credit_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'purchase')
    EXECUTE FUNCTION update_subscriber_credits();

-- Add check constraint for status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'crypto_transactions_status_check'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD CONSTRAINT crypto_transactions_status_check 
        CHECK (status IN ('pending', 'confirmed', 'failed'));
        RAISE NOTICE 'Added status check constraint';
    ELSE
        RAISE NOTICE 'Status check constraint already exists';
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test the trigger by checking if it exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_subscriber_credits';

-- Verify all required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crypto_transactions'
AND column_name IN ('confirmations', 'credits_awarded', 'processed_at', 'gas_used', 'status')
ORDER BY column_name; 