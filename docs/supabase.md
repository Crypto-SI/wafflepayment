# 🥞 Waffle Payments — Supabase Database Guide

## 🚀 Overview
Waffle Payments uses a **hosted Supabase Postgres database** for all authentication, user management, credits, and payment tracking. This guide explains the schema, connection details, and how the app interacts with Supabase.

---

## 🗄️ Database Schema

### 👤 `subscribers` Table
Holds all user profile and wallet info.

| Column           | Type      | Description                                              |
|------------------|-----------|----------------------------------------------------------|
| `user_id`        | UUID      | Primary key, references `auth.users(id)`                 |
| `username`       | TEXT      | Display name (optional)                                  |
| `wallet_address` | TEXT      | User's wallet address (unique, optional)                 |
| `joined_via`     | TEXT      | How user joined: `telegram`, `discord`, `twitter`, `site`, `wallet` |
| `is_active`      | BOOLEAN   | Is the user active? (default: true)                      |
| `joined_at`      | TIMESTAMP | When the user joined (default: now)                      |
| `ref_code`       | TEXT      | Referral code (optional)                                 |
| `engagement_score`| INTEGER  | Engagement score (default: 0)                            |
| `credits`        | INTEGER   | Lisa Kim credits (default: 0)                            |
| `last_action`    | TIMESTAMP | Last user action                                         |
| `is_admin`       | BOOLEAN   | Admin flag (default: false)                              |
| `is_super_admin` | BOOLEAN   | Super admin flag (default: false)                        |
| `email`          | TEXT      | User's email (optional)                                  |
| `full_name`      | TEXT      | Full name (optional)                                     |
| `avatar_url`     | TEXT      | Profile picture URL (optional)                           |

- 🔐 **RLS (Row Level Security)**: Enabled. Users can only access their own data. Super admins can access all.
- 🪝 **Trigger**: Automatically creates a subscriber record when a new `auth.users` record is created (email or wallet).

---

### 💸 `credit_transactions` Table
Tracks all credit-related transactions (on-chain, off-chain, airdrops, etc).

| Column           | Type      | Description                                              |
|------------------|-----------|----------------------------------------------------------|
| `id`             | UUID      | Primary key, auto-generated                              |
| `user_id`        | UUID      | References `auth.users(id)`                              |
| `type`           | TEXT      | `purchase`, `spend`, `airdrop`, `adjustment`             |
| `credits`        | INTEGER   | Amount of credits (positive or negative)                 |
| `transaction_id` | TEXT      | On-chain hash or Stripe/PayPal ID                        |
| `source`         | TEXT      | `ethereum`, `base`, `solana`, `polygon`, `stripe`, `paypal`, `manual` |
| `description`    | TEXT      | Description of the transaction                           |
| `timestamp`      | TIMESTAMP | When the transaction occurred (default: now)             |

- 🔁 **Trigger**: Automatically updates the user's `credits` in `subscribers` after each insert.
- 🔐 **RLS**: Users can only see their own transactions. Super admins can see all.

---

### 🗂️ Storage: `user-images` Bucket
- Stores user profile pictures (avatars)
- Allowed types: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`
- Max file size: 10MB
- Public read access for avatars
- RLS: Users can upload/view/update/delete their own images

---

## 🔑 Authentication & User Flow

- **Supabase Auth** is used for both email/password and wallet (SIWE) authentication.
- When a user signs up (email or wallet), a record is created in `auth.users`.
- A trigger automatically creates a matching `subscribers` record.
- Wallet users are identified by their `wallet_address` and a synthetic email (`<wallet>@wallet.local`).
- All user data is managed in the `subscribers` table.

---

## 🔌 App Connection Details

- All connections use the hosted Supabase instance:
  - **URL:** `https://ogsvehiqkcdkirstguov.supabase.co`
  - **Anon Key:** (see your `.env`)
  - **Service Role Key:** (see your `.env`)
- The app uses environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- All API routes and client/server code use these env vars for Supabase connections.

---

## 🧠 How the App Uses Supabase

- **Auth:** Handles login/signup for both email and wallet users
- **Profile:** Reads/writes to `subscribers` for user info, credits, and avatars
- **Credits:** All credit changes go through `credit_transactions` (auto-updates balance)
- **Storage:** Profile pictures are uploaded to the `user-images` bucket
- **Security:** RLS and policies ensure users can only access their own data
- **Admin:** Super admins can manage all users and credits

---

## 📝 Example: Creating a Wallet User
1. User signs up with wallet (SIWE)
2. New `auth.users` record is created with wallet metadata
3. Trigger creates a `subscribers` record with wallet address
4. User can now log in, upload avatar, and use credits

---

## 🦾 Powered by Context7 + Supabase MCP
- All migrations, policies, and triggers are managed via Context7 and Supabase MCP for full reproducibility and security.

---

For more details, see the code in `src/lib/supabase/` and API routes in `src/app/api/`. 