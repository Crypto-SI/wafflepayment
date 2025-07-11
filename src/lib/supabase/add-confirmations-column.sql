-- Migration: Add confirmations column to crypto_transactions table
-- Run this in your Supabase SQL Editor

-- Add confirmations column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_transactions' 
        AND column_name = 'confirmations'
    ) THEN
        ALTER TABLE public.crypto_transactions 
        ADD COLUMN confirmations INTEGER DEFAULT 0;
        
        -- Update existing records to have 0 confirmations
        UPDATE public.crypto_transactions 
        SET confirmations = 0 
        WHERE confirmations IS NULL;
        
        RAISE NOTICE 'Added confirmations column to crypto_transactions table';
    ELSE
        RAISE NOTICE 'confirmations column already exists in crypto_transactions table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crypto_transactions'
AND column_name = 'confirmations'; 