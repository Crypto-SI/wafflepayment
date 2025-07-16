# Implementation Plan

- [x] 1. Clean up package.json and remove unused dependencies
  - Remove AI/Genkit dependencies (@genkit-ai/googleai, @genkit-ai/next, genkit, genkit-cli, firebase)
  - Remove NextAuth dependencies (next-auth, @rainbow-me/rainbowkit-siwe-next-auth)
  - Remove Solana wallet dependencies if only used for authentication (@solana/wallet-adapter-phantom, @solana/wallet-adapter-react, @solana/wallet-adapter-react-ui, @solana/wallet-adapter-solflare, @solana/web3.js)
  - Remove unused scripts (genkit:dev, genkit:watch)
  - Keep payment-related dependencies (Stripe, RainbowKit for payments, Wagmi)
  - _Requirements: 2.1, 2.2, 2.4, 4.2, 4.3_

- [x] 2. Delete AI/Genkit related files and directories
  - Delete src/ai directory completely
  - Remove any AI-related imports from remaining files
  - Clean up any references to Genkit in configuration files
  - _Requirements: 2.2, 2.3, 6.3_

- [ ] 3. Remove wallet authentication components and files
  - Delete src/app/WalletConnectors.tsx
  - Delete src/pages/api/auth/[...nextauth].ts
  - Remove wallet authentication API routes in src/app/api/auth/check-wallet-user/
  - Clean up any wallet authentication imports
  - _Requirements: 1.4, 5.1, 5.2, 5.4_

- [ ] 4. Update authentication pages to email-only
- [ ] 4.1 Modify src/app/page.tsx (landing page)
  - Remove wallet authentication options from UI
  - Keep only email login button
  - Clean up any wallet-related imports
  - _Requirements: 1.1, 5.1_

- [x] 4.2 Update src/app/login/page.tsx
  - Ensure only email/password form is present
  - Remove any wallet authentication UI elements
  - Clean up imports and unused code
  - _Requirements: 1.1, 1.2_

- [x] 4.3 Update src/app/signup/page.tsx
  - Ensure only email/password signup form
  - Remove wallet authentication options
  - Keep email verification flow
  - _Requirements: 1.1, 1.2_

- [ ] 5. Clean up authentication service and hooks
- [ ] 5.1 Update src/lib/supabase/auth-service-client.ts
  - Remove wallet authentication methods
  - Keep only Supabase email authentication
  - Simplify error handling for single auth method
  - _Requirements: 1.2, 5.3_

- [ ] 5.2 Update src/hooks/use-auth-guard.ts
  - Remove NextAuth session checks
  - Use only Supabase authentication state
  - Simplify authentication logic
  - _Requirements: 1.2, 5.3_

- [ ] 6. Preserve and verify payment functionality
- [x] 6.1 Verify crypto payment components work without wallet auth
  - Test src/components/crypto-payment.tsx
  - Test src/components/CryptoPaymentClient.tsx
  - Ensure wallet connection works for payments only
  - _Requirements: 1.3, 7.1, 7.3_

- [ ] 6.2 Test Stripe payment integration
  - Verify Stripe checkout session creation
  - Test payment webhook handling
  - Ensure credit addition works correctly
  - _Requirements: 7.2, 7.4_

- [ ] 6.3 Test complete payment flows on top-up page
  - Test src/app/top-up/page.tsx functionality
  - Verify both Stripe and crypto payment options work
  - Test payment success and error handling
  - _Requirements: 7.3, 7.5_

- [ ] 7. Update environment configuration
  - Remove NextAuth environment variables from env.example (NEXTAUTH_URL, NEXTAUTH_SECRET)
  - Keep Supabase, Stripe, and WalletConnect variables
  - Update comments to reflect simplified setup
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 8. Rewrite README.md with proper documentation
- [ ] 8.1 Create comprehensive project description
  - Describe WafflePayment as a crypto payment platform
  - Explain credit system and payment options
  - Document key features and tech stack
  - _Requirements: 3.1, 3.3_

- [ ] 8.2 Add installation and setup instructions
  - Document environment variable setup
  - Provide step-by-step installation guide
  - Include database setup instructions
  - _Requirements: 3.2, 3.5, 8.3_

- [ ] 8.3 Document the simplified authentication system
  - Explain email-only authentication
  - Document payment wallet connection process
  - Clarify the separation between auth and payments
  - _Requirements: 3.4, 8.3_

- [ ] 9. Clean up imports and dead code
- [ ] 9.1 Remove unused imports across all files
  - Scan for NextAuth imports
  - Remove AI/Genkit imports
  - Clean up wallet authentication imports
  - _Requirements: 6.2, 4.1_

- [ ] 9.2 Remove dead code and unused utilities
  - Delete unused helper functions
  - Remove commented-out code
  - Clean up unused type definitions
  - _Requirements: 6.1, 6.2_

- [ ] 10. Final testing and verification
- [ ] 10.1 Test complete user authentication flow
  - Test signup with email verification
  - Test login with email/password
  - Test session management and auth guards
  - _Requirements: 7.5, 1.5_

- [ ] 10.2 Test payment functionality end-to-end
  - Test Stripe payment flow
  - Test crypto payment with wallet connection
  - Verify credit addition and transaction recording
  - _Requirements: 7.5, 1.3_

- [ ] 10.3 Verify build and deployment
  - Ensure application builds without errors
  - Test that all imports resolve correctly
  - Verify no linting errors remain
  - _Requirements: 6.5, 4.5_