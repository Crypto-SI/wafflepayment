# Design Document

## Overview

This design document outlines the systematic cleanup and improvement of the WafflePayment application. The cleanup focuses on removing incompatible wallet authentication while preserving payment functionality, eliminating unused AI features, and improving overall code quality and documentation.

## Architecture

### Current State Analysis

The application currently has a mixed authentication architecture that creates complexity:
- Supabase Auth for email authentication
- NextAuth for wallet authentication 
- Dual authentication paths causing confusion
- Unused AI/Genkit integration
- Bloated dependencies

### Target State Architecture

**Simplified Authentication Flow:**
```
User → Email/Password → Supabase Auth → Dashboard
                    ↓
              Session Management
                    ↓
            Payment Flow (Stripe/Crypto)
```

**Payment Flow (Unchanged Core Logic):**
```
User → Select Package → Choose Payment Method
                     ↓
              [Stripe] OR [Crypto Wallet]
                     ↓
              Payment Verification
                     ↓
              Credit Addition
```

## Components and Interfaces

### Authentication Components to Modify

1. **Login/Signup Pages**
   - Remove wallet authentication options
   - Keep only email/password forms
   - Simplify UI to single authentication method

2. **Auth Service Client**
   - Remove wallet-related methods
   - Keep Supabase-only authentication
   - Simplify error handling

3. **Auth Guard Hook**
   - Remove NextAuth session checks
   - Use only Supabase session validation
   - Simplify authentication state management

### Components to Remove

1. **WalletConnectors Component**
   - Delete src/app/WalletConnectors.tsx
   - Remove wallet authentication UI

2. **NextAuth Configuration**
   - Delete src/pages/api/auth/[...nextauth].ts
   - Remove NextAuth provider setup

3. **AI/Genkit Components**
   - Delete entire src/ai directory
   - Remove AI-related imports and references

### Components to Preserve

1. **Crypto Payment Components**
   - Keep CryptoPayment and CryptoPaymentClient
   - Maintain wallet connection for payments only
   - Preserve RainbowKit integration for payment flow

2. **Payment Processing**
   - Keep all Stripe integration
   - Maintain crypto payment verification
   - Preserve credit system functionality

## Data Models

### Database Schema (No Changes Required)

The existing Supabase schema remains intact:
- `subscribers` table for user profiles
- `credit_transactions` table for payment history
- Supabase Auth tables for authentication

### Authentication Data Flow

**Simplified Flow:**
```
Email/Password → Supabase Auth → User Session → Subscriber Record
```

**Removed Flow:**
```
Wallet Connection → NextAuth → Session Management (REMOVED)
```

## Error Handling

### Authentication Error Handling

1. **Simplified Error States**
   - Remove wallet connection errors
   - Focus on email/password validation
   - Streamline Supabase error handling

2. **Payment Error Handling**
   - Keep existing crypto payment error handling
   - Maintain Stripe error management
   - Preserve payment verification errors

## Testing Strategy

### Authentication Testing

1. **Email Authentication Tests**
   - Test signup flow with email verification
   - Test login with valid/invalid credentials
   - Test password reset functionality

2. **Session Management Tests**
   - Test session persistence
   - Test automatic logout on session expiry
   - Test auth guard protection

### Payment Testing

1. **Crypto Payment Tests**
   - Test wallet connection for payments (not auth)
   - Test payment verification flow
   - Test credit addition after payment

2. **Stripe Payment Tests**
   - Test checkout session creation
   - Test webhook handling
   - Test payment confirmation

### Cleanup Verification Tests

1. **Dependency Tests**
   - Verify removed packages don't break build
   - Test that all imports resolve correctly
   - Verify no dead code remains

2. **Functionality Tests**
   - Test complete user journey (signup → login → payment)
   - Verify all payment methods still work
   - Test profile management functionality

## Implementation Strategy

### Phase 1: Dependency Cleanup
- Remove AI/Genkit dependencies
- Remove NextAuth and wallet auth dependencies
- Clean up package.json scripts

### Phase 2: Code Removal
- Delete AI-related directories and files
- Remove wallet authentication components
- Clean up NextAuth configuration

### Phase 3: Authentication Simplification
- Update login/signup pages
- Modify auth service client
- Update auth guard hooks

### Phase 4: Documentation and Configuration
- Update README.md with accurate information
- Clean up environment variables
- Update setup instructions

### Phase 5: Testing and Verification
- Test all authentication flows
- Verify payment functionality
- Ensure no broken imports or dead code

## Security Considerations

### Authentication Security
- Maintain Supabase Auth security best practices
- Ensure proper session management
- Keep secure password requirements

### Payment Security
- Preserve existing payment verification
- Maintain secure API endpoints
- Keep crypto payment validation intact

## Performance Improvements

### Bundle Size Reduction
- Removing unused dependencies will reduce bundle size
- Eliminating AI libraries will improve build times
- Simplified authentication will reduce client-side complexity

### Runtime Performance
- Fewer authentication checks will improve page load times
- Simplified component tree will reduce re-renders
- Cleaner codebase will improve maintainability

## Migration Considerations

### User Impact
- No impact on existing users (email auth remains)
- No database migrations required
- Payment functionality unchanged

### Development Impact
- Simplified development workflow
- Easier debugging with single auth method
- Reduced complexity for new developers

## File Structure Changes

### Files to Delete
```
src/ai/                          # Entire AI directory
src/app/WalletConnectors.tsx     # Wallet auth component
src/pages/api/auth/[...nextauth].ts # NextAuth config
```

### Files to Modify
```
package.json                     # Remove dependencies
README.md                        # Complete rewrite
env.example                      # Remove unused variables
src/app/page.tsx                 # Remove wallet auth options
src/app/login/page.tsx           # Simplify to email only
src/app/signup/page.tsx          # Simplify to email only
src/lib/supabase/auth-service-client.ts # Remove wallet methods
src/hooks/use-auth-guard.ts      # Simplify auth checks
```

### Files to Preserve
```
src/components/crypto-payment.tsx    # Keep for payments
src/components/CryptoPaymentClient.tsx # Keep for payments
src/app/top-up/page.tsx             # Keep payment functionality
All Stripe integration files        # Keep payment processing
All Supabase database files         # Keep data layer
```