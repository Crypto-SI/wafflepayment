-- COMPREHENSIVE CREDIT SYSTEM FIX
-- Copy and paste this into your Supabase SQL Editor

-- First, let's check if the trigger function exists and recreate it
CREATE OR REPLACE FUNCTION update_subscriber_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution for debugging
    RAISE NOTICE 'Credit trigger fired: user_id=%, credits=%, type=%', NEW.user_id, NEW.credits, NEW.transaction_type;
    
    -- Update credits in subscribers table
    UPDATE public.subscribers 
    SET credits = COALESCE(credits, 0) + NEW.credits,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Check if the update actually affected any rows
    IF NOT FOUND THEN
        RAISE NOTICE 'No subscriber found for user_id: %', NEW.user_id;
    ELSE
        RAISE NOTICE 'Successfully updated credits for user_id: %', NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS trigger_update_subscriber_credits ON public.credit_transactions;
CREATE TRIGGER trigger_update_subscriber_credits
    AFTER INSERT ON public.credit_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'purchase')
    EXECUTE FUNCTION update_subscriber_credits();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_subscriber_credits() TO service_role;
GRANT EXECUTE ON FUNCTION update_subscriber_credits() TO authenticated;

-- Test the system by checking existing data
-- Show current subscribers and their credits
SELECT 
    s.user_id,
    s.email,
    s.credits,
    s.auth_type,
    s.wallet_address,
    s.updated_at
FROM public.subscribers s
ORDER BY s.created_at DESC
LIMIT 10;

-- Show recent credit transactions
SELECT 
    ct.user_id,
    ct.credits,
    ct.transaction_type,
    ct.payment_method,
    ct.transaction_hash,
    ct.created_at
FROM public.credit_transactions ct
ORDER BY ct.created_at DESC
LIMIT 10;

-- Manual fix: Update subscriber credits based on existing credit transactions
-- This will sync any credits that weren't properly applied due to trigger issues
UPDATE public.subscribers 
SET credits = COALESCE(
    (
        SELECT SUM(
            CASE 
                WHEN ct.transaction_type = 'purchase' THEN ct.credits
                WHEN ct.transaction_type = 'refund' THEN ct.credits
                WHEN ct.transaction_type = 'usage' THEN -ct.credits
                ELSE 0
            END
        )
        FROM public.credit_transactions ct
        WHERE ct.user_id = subscribers.user_id
    ), 
    100  -- Default starting credits
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM public.credit_transactions ct 
    WHERE ct.user_id = subscribers.user_id
);

-- Show the results after manual sync
SELECT 
    s.user_id,
    s.email,
    s.credits,
    s.auth_type,
    s.updated_at,
    (
        SELECT COUNT(*) 
        FROM public.credit_transactions ct 
        WHERE ct.user_id = s.user_id AND ct.transaction_type = 'purchase'
    ) as purchase_count
FROM public.subscribers s
WHERE s.credits > 100 OR EXISTS (
    SELECT 1 FROM public.credit_transactions ct 
    WHERE ct.user_id = s.user_id
)
ORDER BY s.updated_at DESC; 