# Wallet Authentication Setup Guide

This guide explains how to complete the wallet authentication setup for your Waffle Payments application.

## 🔧 Environment Variables

Add these environment variables to your `.env.local` file:

```env
# NextAuth (for wallet authentication)
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your_nextauth_secret

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### How to get these values:

1. **NEXTAUTH_SECRET**: Generate a random string (32+ characters)
   ```bash
   openssl rand -base64 32
   ```

2. **NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID**: 
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID

## 🗄️ Database Setup

Run this SQL in your Supabase SQL Editor to add wallet support:

```sql
-- Add wallet support to subscribers table
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'email' CHECK (auth_type IN ('email', 'wallet'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_wallet_address ON public.subscribers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_subscribers_auth_type ON public.subscribers(auth_type);
```

## 🔐 Authentication Flow

### For Wallet Users:
1. User clicks "Continue with Wallet"
2. Selects EVM or Solana wallet
3. Wallet connection modal appears
4. User connects wallet
5. RainbowKit triggers SIWE (Sign-In with Ethereum) flow
6. User signs message to prove wallet ownership
7. NextAuth creates session
8. User is redirected to dashboard

### For Email Users:
1. User clicks "Continue with Email"
2. Standard email/password login via Supabase
3. User is redirected to dashboard

## 🛠️ Key Components

### 1. NextAuth Configuration (`/pages/api/auth/[...nextauth].ts`)
- Handles SIWE authentication
- Verifies wallet signatures
- Creates/updates user records

### 2. Database Service (`/lib/supabase/database-service.ts`)
- `getUserByWalletAddress()` - Find user by wallet
- `createWalletUser()` - Create new wallet user

### 3. Auth Service (`/lib/supabase/auth-service.ts`)
- `getCurrentUser()` - Works with both auth types
- `signOut()` - Signs out from both NextAuth and Supabase

### 4. Auth Guard (`/hooks/use-auth-guard.ts`)
- Protects routes for both auth types
- Redirects unauthenticated users

## 🔄 User Experience

### Wallet Authentication:
- ✅ Connect wallet (MetaMask, WalletConnect, etc.)
- ✅ Sign message to prove ownership
- ✅ Automatic account creation
- ✅ Persistent sessions
- ✅ Secure sign-out

### Email Authentication:
- ✅ Traditional email/password
- ✅ Account registration
- ✅ Password reset
- ✅ Email verification

## 🧪 Testing

1. **Test Wallet Auth:**
   - Connect MetaMask or other wallet
   - Sign the SIWE message
   - Verify dashboard access
   - Test sign out

2. **Test Email Auth:**
   - Use email/password login
   - Verify dashboard access
   - Test sign out

3. **Test Auth Guard:**
   - Try accessing `/dashboard` without auth
   - Should redirect to login page

## 🚀 Production Deployment

1. **Update Environment Variables:**
   ```env
   NEXTAUTH_URL=https://your-domain.com
   ```

2. **Database Migration:**
   - Run the SQL commands in your production database

3. **WalletConnect:**
   - Add your production domain to WalletConnect project settings

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid signature" errors:**
   - Check that NEXTAUTH_SECRET is set
   - Verify wallet is connected to correct network

2. **Database errors:**
   - Ensure wallet columns exist in subscribers table
   - Check Supabase RLS policies

3. **Session issues:**
   - Clear browser cookies/localStorage
   - Verify NextAuth configuration

4. **WalletConnect issues:**
   - Check PROJECT_ID is correct
   - Verify domain is allowlisted

## 📚 Additional Resources

- [RainbowKit SIWE Documentation](https://rainbowkit.com/docs/authentication)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

## ✅ Implementation Complete

Your app now supports:
- 🔐 Wallet authentication via SIWE
- 📧 Email authentication via Supabase
- 🔄 Unified user management
- 🛡️ Secure session handling
- 🎯 Seamless user experience 