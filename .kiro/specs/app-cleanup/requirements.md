# Requirements Document

## Introduction

This specification outlines the cleanup and improvement of the WafflePayment application to remove unnecessary features, fix authentication issues, and improve overall code quality. The app currently has mixed authentication methods that are incompatible with Supabase, unused AI features, and documentation issues that need to be addressed.

## Requirements

### Requirement 1

**User Story:** As a developer maintaining the WafflePayment app, I want to remove wallet-based authentication while keeping wallet payment functionality, so that the authentication system is simplified and fully compatible with Supabase.

#### Acceptance Criteria

1. WHEN a user visits the application THEN they SHALL only see email-based login options
2. WHEN a user attempts to authenticate THEN the system SHALL only use Supabase Auth with email/password
3. WHEN a user makes a payment THEN they SHALL still be able to connect wallets for crypto payments
4. WHEN wallet authentication code is removed THEN all NextAuth and wallet authentication dependencies SHALL be cleaned up
5. WHEN the cleanup is complete THEN no wallet authentication UI components SHALL remain in login/signup flows

### Requirement 2

**User Story:** As a developer, I want to remove all AI/Genkit related code and dependencies, so that the application is leaner and focused on its core payment functionality.

#### Acceptance Criteria

1. WHEN Genkit dependencies are removed THEN all @genkit-ai packages SHALL be uninstalled
2. WHEN AI code is removed THEN the src/ai directory SHALL be deleted
3. WHEN package.json is updated THEN all genkit scripts SHALL be removed
4. WHEN Firebase dependencies are removed THEN firebase package SHALL be uninstalled if not used elsewhere
5. WHEN the cleanup is complete THEN no AI-related imports SHALL remain in the codebase

### Requirement 3

**User Story:** As a developer, I want to clean up the README.md file, so that it provides accurate and professional documentation for the WafflePayment application.

#### Acceptance Criteria

1. WHEN the README is updated THEN it SHALL contain a proper project description
2. WHEN the README is updated THEN it SHALL include installation and setup instructions
3. WHEN the README is updated THEN it SHALL document the tech stack and features
4. WHEN the README is updated THEN it SHALL remove any inappropriate content or comments
5. WHEN the README is updated THEN it SHALL include environment setup instructions

### Requirement 4

**User Story:** As a developer, I want to remove unused dependencies and clean up the package.json, so that the application has a smaller footprint and fewer security vulnerabilities.

#### Acceptance Criteria

1. WHEN dependencies are audited THEN unused packages SHALL be identified and removed
2. WHEN wallet auth dependencies are removed THEN NextAuth and related packages SHALL be uninstalled
3. WHEN AI dependencies are removed THEN Genkit and Firebase packages SHALL be uninstalled
4. WHEN Solana dependencies are audited THEN they SHALL be removed if only used for authentication
5. WHEN the cleanup is complete THEN package.json SHALL only contain necessary dependencies

### Requirement 5

**User Story:** As a developer, I want to clean up authentication-related code and components, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. WHEN wallet authentication is removed THEN WalletConnectors component SHALL be deleted or simplified
2. WHEN NextAuth is removed THEN all NextAuth configuration files SHALL be deleted
3. WHEN authentication is simplified THEN auth guard hooks SHALL be updated to only check Supabase auth
4. WHEN wallet code is cleaned THEN wallet authentication API routes SHALL be removed
5. WHEN the cleanup is complete THEN only email authentication flows SHALL remain

### Requirement 6

**User Story:** As a developer, I want to improve the overall code organization and remove dead code, so that the application is easier to maintain and understand.

#### Acceptance Criteria

1. WHEN dead code is identified THEN unused components and utilities SHALL be removed
2. WHEN imports are cleaned THEN unused import statements SHALL be removed
3. WHEN file structure is optimized THEN empty or unnecessary directories SHALL be removed
4. WHEN code is organized THEN related functionality SHALL be properly grouped
5. WHEN the cleanup is complete THEN the codebase SHALL have no linting errors

### Requirement 7

**User Story:** As a developer, I want to ensure the payment functionality remains intact after cleanup, so that users can still purchase credits via both Stripe and crypto payments.

#### Acceptance Criteria

1. WHEN wallet authentication is removed THEN crypto payment functionality SHALL remain working
2. WHEN dependencies are cleaned THEN Stripe integration SHALL continue to function
3. WHEN components are updated THEN the top-up page SHALL work correctly
4. WHEN authentication is simplified THEN payment verification SHALL still work
5. WHEN the cleanup is complete THEN all payment flows SHALL be tested and functional

### Requirement 8

**User Story:** As a developer, I want to update environment configuration and documentation, so that the setup process is clear and accurate.

#### Acceptance Criteria

1. WHEN environment variables are reviewed THEN unused variables SHALL be removed from env.example
2. WHEN NextAuth variables are removed THEN NEXTAUTH_* variables SHALL be deleted
3. WHEN documentation is updated THEN setup instructions SHALL reflect the simplified auth
4. WHEN configuration is cleaned THEN only necessary environment variables SHALL remain
5. WHEN the cleanup is complete THEN env.example SHALL match the actual requirements