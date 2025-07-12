# Fix for "Database error saving new user" Issue

## Problem
The signup process is failing with "Database error saving new user" because the database trigger that creates subscriber records when new users sign up is not working properly.

## Root Cause
The `handle_new_user()` trigger function is either missing or has errors that prevent it from creating subscriber records when new users are created in the `auth.users` table.

## Solution

### Step 1: Access Your Supabase Dashboard
1. Go to your Supabase project dashboard at `https://api.supabase.cryptosi.org`
2. Navigate to the **SQL Editor** tab

### Step 2: Create/Fix the Trigger Function
Copy and paste this SQL into the SQL Editor and run it:

```sql
-- Create or replace the trigger function
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
    100, -- Starting credits
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
```

### Step 3: Create/Update the Trigger
Run this SQL to create or update the trigger:

```sql
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 4: Grant Necessary Permissions
Run this SQL to ensure the trigger has the right permissions:

```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.subscribers TO supabase_auth_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
```

### Step 5: Verify the Fix
After running the above SQL commands, test the signup process:

1. Go to your signup page
2. Try creating a new account with the same details:
   - Full Name: Carl Anthony
   - Email: test@example.com (use a different email)
   - Password: (any password)

The signup should now work without the "Database error saving new user" error.

## Alternative Fix (If the above doesn't work)

If the trigger approach doesn't work, you can also modify the application code to handle user creation differently:

### Disable the Trigger Approach
In your `src/lib/supabase/auth-service-client.ts`, modify the `signUp` method to not rely on the trigger:

```typescript
// Remove the call to the /api/user/register endpoint
// and handle subscriber creation directly in the client
```

### Use Manual Subscriber Creation
Instead of relying on the trigger, create the subscriber record manually after successful auth signup.

## Testing
After implementing the fix, test with:
- New email signups
- Wallet-based signups
- Existing user logins (should still work)

The error "Database error saving new user" should be resolved, and new users should be able to sign up successfully. 