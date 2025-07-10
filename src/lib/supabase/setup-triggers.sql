-- =============================================
-- WAFFLE PAYMENTS: DATABASE TRIGGERS SETUP
-- =============================================
-- Run this SQL in your Supabase SQL Editor to set up automatic subscriber creation
-- This ensures that every new user in auth.users automatically gets a subscriber record

-- Function to automatically create a subscriber when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Insert new subscriber record
    INSERT INTO public.subscribers (
        user_id,
        email,
        full_name,
        wallet_address,
        auth_type,
        credits,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'wallet_address',
        CASE 
            WHEN NEW.raw_user_meta_data->>'wallet_address' IS NOT NULL THEN 'wallet'
            ELSE 'email'
        END,
        100, -- Give new users 100 credits to start
        'active',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create subscriber when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT INSERT ON TABLE public.subscribers TO supabase_auth_admin;
GRANT UPDATE ON TABLE public.subscribers TO supabase_auth_admin;

-- Verify the trigger was created successfully
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test the function (optional - uncomment to test)
-- SELECT public.handle_new_user();

NOTIFY pgrst, 'reload config'; 