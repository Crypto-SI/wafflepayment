# Supabase Migration: Self-Hosted to Hosted

## Overview
This document outlines the complete migration from self-hosted Supabase to hosted Supabase (supabase.com) for the WafflePayment project.

## Required Information from User
Before proceeding, I need the following information from your hosted Supabase dashboard:

### 1. Project Details
- [ ] **Project URL**: `https://YOUR-PROJECT-REF.supabase.co`
- [ ] **Project Reference**: `ogsvehiqkcdkirstguov` (from your connection strings)
- [ ] **Database Password**: `[YOUR-PASSWORD]` (you'll need to set/reset this)

### 2. API Keys (from Project Settings > API)
- [ ] **Anonymous Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY`

### 3. Database Connection Strings
- [ ] **Direct Connection**: `postgresql://postgres:[YOUR-PASSWORD]@db.ogsvehiqkcdkirstguov.supabase.co:5432/postgres`
- [ ] **Transaction Pooler**: `postgresql://postgres.ogsvehiqkcdkirstguov:[YOUR-PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`
- [ ] **Session Pooler**: `postgresql://postgres.ogsvehiqkcdkirstguov:[YOUR-PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:5432/postgres`

## Migration Tasks

### Phase 1: Environment Configuration
- [ ] **1.1** Update environment variables in local `.env` file
- [ ] **1.2** Update environment variables in production deployment
- [ ] **1.3** Update `env.example` file with new format
- [ ] **1.4** Test client connection with new hosted Supabase
- [ ] **1.5** Test server connection with new hosted Supabase

### Phase 2: Database Schema Recreation
- [ ] **2.1** Create main `subscribers` table with wallet support
- [ ] **2.2** Create `credit_transactions` table for payment tracking
- [ ] **2.3** Create `user_credits` table for balance management
- [ ] **2.4** Create `crypto_transactions` table for crypto payments
- [ ] **2.5** Add necessary indexes for performance
- [ ] **2.6** Enable Row Level Security (RLS) on all tables
- [ ] **2.7** Create RLS policies for data access control
- [ ] **2.8** Create database functions and triggers
- [ ] **2.9** Grant necessary permissions to authenticated users

### Phase 3: Authentication Setup
- [ ] **3.1** Configure email authentication providers
- [ ] **3.2** Configure OAuth providers (if any)
- [ ] **3.3** Set up email templates for confirmations
- [ ] **3.4** Configure redirect URLs for auth flows
- [ ] **3.5** Update auth confirmation handling (remove self-hosted URL)
- [ ] **3.6** Test wallet authentication flow
- [ ] **3.7** Test email authentication flow

### Phase 4: Data Migration (if needed)
- [ ] **4.1** Export existing user data from self-hosted instance
- [ ] **4.2** Export existing transaction data
- [ ] **4.3** Export existing credit balances
- [ ] **4.4** Import user data to hosted Supabase
- [ ] **4.5** Import transaction history
- [ ] **4.6** Import credit balances
- [ ] **4.7** Verify data integrity post-migration

### Phase 5: Application Updates
- [ ] **5.1** Update Supabase client configuration
- [ ] **5.2** Update Supabase server configuration
- [ ] **5.3** Remove self-hosted auth URL from `confirm.tsx`
- [ ] **5.4** Update any hardcoded URLs in the application
- [ ] **5.5** Test all payment flows (Stripe + Crypto)
- [ ] **5.6** Test user registration and login
- [ ] **5.7** Test credit system functionality
- [ ] **5.8** Test wallet connection and authentication

### Phase 6: Testing and Validation
- [ ] **6.1** Test user registration (email)
- [ ] **6.2** Test user registration (wallet)
- [ ] **6.3** Test credit purchases via Stripe
- [ ] **6.4** Test credit purchases via crypto
- [ ] **6.5** Test credit usage and balance updates
- [ ] **6.6** Test transaction history retrieval
- [ ] **6.7** Test admin functions (if applicable)
- [ ] **6.8** Test email confirmations
- [ ] **6.9** Test password reset flows
- [ ] **6.10** Perform end-to-end user journey tests

### Phase 7: Production Deployment
- [ ] **7.1** Update production environment variables
- [ ] **7.2** Deploy updated application
- [ ] **7.3** Monitor application logs for errors
- [ ] **7.4** Verify all integrations work in production
- [ ] **7.5** Test production authentication flows
- [ ] **7.6** Monitor database performance
- [ ] **7.7** Set up backup and monitoring alerts

## Database Schema Files to Execute

### Core Tables
1. **subscribers** table (main user table)
2. **credit_transactions** table (payment tracking)
3. **user_credits** table (balance management)
4. **crypto_transactions** table (crypto payment tracking)

### SQL Files to Execute in Order
1. `database.sql` - Core tables and functions
2. `crypto-transactions-clean.sql` - Crypto payment tables
3. `add-confirmations-column.sql` - Additional crypto columns
4. `setup-triggers.sql` - Database triggers
5. `fix-credit-system.sql` - Credit system fixes

## Configuration Changes Required

### Environment Variables Update
```bash
# OLD (Self-hosted)
NEXT_PUBLIC_SUPABASE_URL=your_self_hosted_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_self_hosted_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_self_hosted_service_key

# NEW (Hosted)
NEXT_PUBLIC_SUPABASE_URL=https://ogsvehiqkcdkirstguov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_hosted_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_hosted_service_key
```

### Auth Configuration Updates
- Remove self-hosted auth URL from `src/pages/auth/confirm.tsx`
- Update any hardcoded URLs in the application
- Configure hosted Supabase auth settings

## Risk Mitigation
- [ ] **Backup**: Create backup of current self-hosted database
- [ ] **Testing**: Test migration on staging environment first
- [ ] **Rollback Plan**: Keep self-hosted instance running until migration is verified
- [ ] **Monitoring**: Monitor application performance post-migration
- [ ] **User Communication**: Notify users of any expected downtime

## Success Criteria
- [ ] All existing users can log in successfully
- [ ] All payment flows work correctly
- [ ] Credit system functions properly
- [ ] No data loss during migration
- [ ] Application performance is maintained or improved
- [ ] All integrations (Stripe, WalletConnect) work correctly

## Next Steps
1. Provide the required information listed above
2. Begin with Phase 1 (Environment Configuration)
3. Execute database schema recreation
4. Test thoroughly before production deployment

---

**Migration Estimated Time**: 4-6 hours (depending on data size and complexity)
**Recommended Approach**: Staging environment first, then production
**Risk Level**: Medium (with proper testing and backup strategy) 