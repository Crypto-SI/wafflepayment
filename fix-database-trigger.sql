-- Step 1: Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscribers (
    user_id,
    email,
    full_name,
    auth_type,
    credits,
    status,
    is_email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'wallet_address' IS NOT NULL THEN 'wallet'
      ELSE 'email'
    END,
    100,
    'active',
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN true
      ELSE false
    END,
    NOW(),
    NOW()
  );
  
  -- If this is a wallet user, also set the wallet address
  IF NEW.raw_user_meta_data->>'wallet_address' IS NOT NULL THEN
    UPDATE public.subscribers 
    SET wallet_address = NEW.raw_user_meta_data->>'wallet_address'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth operation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 2: Create/Update the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.subscribers TO supabase_auth_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin; 