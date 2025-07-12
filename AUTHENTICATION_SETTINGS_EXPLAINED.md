# Supabase Authentication Settings Explained

## What These Settings Do

### Site URL
- **Purpose**: The primary URL of your application
- **Function**: Used as the default redirect after authentication actions
- **Current Issue**: Your production emails are redirecting to Supabase studio instead of your app

### Redirect URLs
- **Purpose**: Whitelist of allowed URLs for authentication callbacks
- **Function**: Security measure to prevent unauthorized redirects
- **Current Issue**: Email confirmation links fail because the redirect URL isn't whitelisted

## Impact on Database and Access

### ✅ What These Settings **DO** Change:
1. **Email Confirmation Flow**: 
   - Users clicking email links will be redirected to your app instead of Supabase studio
   - Confirmation tokens will be properly handled by your application

2. **Authentication Callbacks**:
   - OAuth providers (Google, GitHub, etc.) can redirect back to your app
   - Password reset links work correctly

3. **CORS Settings**:
   - Your domain is automatically whitelisted for authentication requests
   - Prevents cross-origin issues

### ❌ What These Settings **DON'T** Change:
1. **Database Schema**: No changes to tables, columns, or data
2. **Database Permissions**: Row Level Security (RLS) policies remain unchanged
3. **API Access**: Database connection strings and API keys stay the same
4. **User Data**: Existing user accounts and data are unaffected
5. **Database Performance**: No impact on query performance or connections

## Security Implications

### Positive Security Effects:
- **Prevents Open Redirects**: Only whitelisted URLs can be used for redirects
- **Reduces Phishing Risk**: Users can't be redirected to malicious sites
- **Proper Token Handling**: Confirmation tokens are sent to your controlled domain

### No Security Risks:
- **Database Access**: No changes to database security
- **API Keys**: No changes to authentication tokens or API access
- **User Privacy**: No changes to data access or user information handling

## Current Problem Without These Settings

### Email Confirmation Issue:
1. User signs up → receives confirmation email
2. Email link points to: `https://studio.supabase.cryptosi.org`
3. User clicks link → sees Supabase studio (not your app)
4. User is confused, thinks signup failed
5. Account remains unconfirmed

### With Correct Settings:
1. User signs up → receives confirmation email
2. Email link points to: `https://waffle.cryptosi.org/auth/confirm`
3. User clicks link → sees your app's confirmation page
4. Your app handles the confirmation token
5. User is redirected to dashboard or login

## How to Apply These Settings

### Method 1: Supabase Dashboard
1. Go to your production Supabase project
2. Navigate to: **Authentication → Settings** (or Configuration)
3. Update:
   - **Site URL**: `https://waffle.cryptosi.org`
   - **Redirect URLs**: Add `https://waffle.cryptosi.org/auth/confirm`
4. Save changes

### Method 2: Supabase CLI
```bash
# Install CLI if needed
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Update settings
supabase auth update \
  --site-url "https://waffle.cryptosi.org" \
  --redirect-urls "https://waffle.cryptosi.org/auth/confirm"
```

### Method 3: Supabase API (if CLI doesn't work)
You can also update these settings via Supabase's management API, but the dashboard method is recommended.

## Why SQL Won't Work

These are **configuration settings**, not database schema changes. They control how Supabase's authentication service behaves, not what's stored in your database.

SQL is for:
- Creating tables
- Modifying data
- Setting up triggers
- Managing permissions

Authentication settings are for:
- Controlling redirect behavior
- Setting CORS policies
- Managing OAuth flows
- Configuring email templates

## Verification

After updating these settings, you can verify they're working by:

1. **Check the dashboard**: Settings should show your new URLs
2. **Test email flow**: Sign up with a test account and check where the email link points
3. **Monitor logs**: Check your application logs for successful confirmations
4. **Test redirects**: Ensure users land on your app after confirmation

## Timeline

- **Settings Update**: Immediate (within 1-2 minutes)
- **Email Template Update**: May take 5-10 minutes
- **CORS Changes**: Usually immediate
- **Full Propagation**: Allow up to 15 minutes for all changes to take effect 