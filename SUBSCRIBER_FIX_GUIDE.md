# Subscriber Creation Fix Guide

## Problem
New wallet users are being created in the authentication system but are not showing up as 'subscribers' in the dashboard. This happens because the wallet authentication flow bypasses the automatic subscriber creation.

## Root Cause
The current system has two authentication flows:
1. **Email users**: Go through Supabase Auth → automatic subscriber creation
2. **Wallet users**: Go through NextAuth + SIWE → manual subscriber creation

The wallet flow was manually creating subscribers, but this could fail or conflict with database constraints.

## Solution: Database Triggers (Recommended)

### Step 1: Set Up Database Trigger
Run the SQL in `src/lib/supabase/setup-triggers.sql` in your **Supabase SQL Editor**:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `src/lib/supabase/setup-triggers.sql`
4. Click "Run"

This creates a trigger that automatically creates a subscriber record whenever a new user is added to `auth.users`.

### Step 2: Verify the Fix
The trigger should:
- ✅ Automatically create subscriber records for new users
- ✅ Handle both email and wallet authentication
- ✅ Give new users 100 starting credits
- ✅ Set proper `auth_type` (email/wallet)
- ✅ Extract wallet address from user metadata

## What Changed in the Code

### 1. Simplified `createWalletUser()` Method
- Now creates user in `auth.users` with proper metadata
- Relies on database trigger to create subscriber record
- Removes manual subscriber creation to avoid conflicts

### 2. Enhanced Database Trigger
- Extracts wallet address from user metadata
- Sets appropriate `auth_type` based on presence of wallet address
- Provides initial credits for new users

### 3. Updated Database Schema
- Added trigger function `public.handle_new_user()`
- Added trigger `on_auth_user_created` on `auth.users` table
- Proper permissions for `supabase_auth_admin`

## Testing the Fix

1. **Run the SQL trigger setup** in Supabase SQL Editor
2. **Connect a new wallet** that hasn't been used before
3. **Check the dashboard** - the user should now appear with:
   - Proper name (truncated wallet address)
   - 100 starting credits
   - `auth_type: 'wallet'`
   - Wallet address stored

## Verification Query
Run this in Supabase SQL Editor to check if subscribers are being created:

```sql
SELECT 
    s.user_id,
    s.email,
    s.wallet_address,
    s.auth_type,
    s.credits,
    s.created_at,
    u.email as auth_email,
    u.raw_user_meta_data
FROM public.subscribers s
JOIN auth.users u ON s.user_id = u.id
WHERE s.auth_type = 'wallet'
ORDER BY s.created_at DESC
LIMIT 10;
```

## Benefits of This Approach

1. **Consistency**: All user creation goes through the same trigger
2. **Reliability**: Database-level constraints ensure data integrity  
3. **Maintainability**: Single source of truth for subscriber creation
4. **Scalability**: Handles high volume user creation efficiently
5. **Compliance**: Follows Supabase best practices for user management

## Rollback (if needed)
If you need to remove the trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

## Next Steps
After implementing this fix:
1. Test with a fresh wallet connection
2. Verify dashboard shows user data correctly
3. Check that credits system works properly
4. Monitor server logs for any remaining issues 