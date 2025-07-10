# 🔗 Crypto Payment System Setup Guide

This guide explains how to set up and use the crypto payment system for your Waffle Payments application, allowing users to pay with USDT and USDC tokens across multiple blockchain networks.

## 🎯 Overview

The crypto payment system allows users to:
- Pay with USDT or USDC tokens
- Use multiple blockchain networks (Ethereum, Polygon, Arbitrum, Base, Optimism)
- Have payments automatically verified and credits added to their account
- View transaction history and confirmations

## 🛠️ Setup Instructions

### 1. Database Setup

Run the SQL migration to set up the required database tables:

```sql
-- Execute the contents of src/lib/supabase/crypto-transactions-clean.sql
-- This creates the crypto_transactions table and updates subscribers table
```

**Steps:**
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `src/lib/supabase/crypto-transactions-clean.sql`
4. Click "Run" to execute the migration

**⚠️ Important:** Make sure to run `crypto-transactions-clean.sql` instead of `crypto-transactions.sql` as it has the correct foreign key relationships.

Key tables created:
- `crypto_transactions` - Stores all crypto payment transactions
- Updates to `subscribers` table to support wallet addresses
- Updates to `credit_transactions` table for crypto payment tracking

### 2. Environment Variables

Add these optional environment variables to your `.env` file for custom RPC endpoints:

```env
# Custom RPC endpoints (optional - defaults to public endpoints)
ETHEREUM_RPC_URL=https://your-ethereum-rpc-url
POLYGON_RPC_URL=https://your-polygon-rpc-url
ARBITRUM_RPC_URL=https://your-arbitrum-rpc-url
BASE_RPC_URL=https://your-base-rpc-url
OPTIMISM_RPC_URL=https://your-optimism-rpc-url
```

### 3. Payment Wallet Configuration

Your payment wallet address is configured in `src/lib/crypto-tokens.ts`:

```typescript
export const PAYMENT_WALLET_ADDRESS: Address = '0x0B172a4E265AcF4c2E0aB238F63A44bf29bBd158';
```

**⚠️ Important**: This is where all crypto payments will be sent. Make sure you control this wallet address.

## 💰 Supported Tokens & Networks

### Ethereum Mainnet
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

### Polygon
- **USDT**: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- **USDC**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

### Arbitrum
- **USDT**: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`
- **USDC**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

### Base
- **USDT**: `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2`
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Optimism
- **USDT**: `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58`
- **USDC**: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`

## 🔄 Payment Flow

### For Users:
1. User selects a credit package on `/top-up`
2. Clicks "Pay with Crypto (USDT/USDC)"
3. Selects their preferred token and network
4. Reviews payment details and confirms they have sufficient balance
5. Approves the transaction in their wallet
6. Transaction is confirmed on-chain
7. Credits are automatically added to their account

### Technical Flow:
1. **Frontend**: User selects token and initiates payment via `CryptoPayment` component
2. **Wallet**: User confirms token transfer transaction
3. **Blockchain**: Transaction is mined and confirmed
4. **Backend**: `/api/crypto/verify-payment` verifies the transaction
5. **Database**: Credits are added via `credit_transactions` table
6. **User**: Sees updated balance and transaction confirmation

## 🔧 Key Components

### 1. Token Configuration (`src/lib/crypto-tokens.ts`)
- Defines supported tokens across all networks
- Contains payment wallet address
- Includes ERC-20 ABI for contract interactions
- Utility functions for amount formatting

### 2. Crypto Payment Component (`src/components/crypto-payment.tsx`)
- React component for crypto payment UI
- Handles token selection, balance checking, and transaction execution
- Integrates with wagmi for blockchain interactions

### 3. Payment Verification API (`src/app/api/crypto/verify-payment/route.ts`)
- Verifies transactions on-chain
- Prevents double-spending and fraud
- Updates user credits in database

### 4. Database Integration
- `crypto_transactions` table for transaction tracking
- RLS policies for data security
- Automatic credit updates via triggers

## 🔒 Security Features

### Transaction Verification
- **On-chain verification**: All transactions are verified directly on the blockchain
- **Amount validation**: Ensures the correct amount was sent
- **Address validation**: Verifies sender and recipient addresses
- **Double-spend protection**: Prevents processing the same transaction twice

### Database Security
- **Row Level Security (RLS)**: Users can only view their own transactions
- **Input validation**: All inputs are validated and sanitized
- **Error handling**: Comprehensive error handling prevents data corruption

### Wallet Security
- **User-controlled**: Users maintain control of their wallets at all times
- **No private keys**: Application never handles private keys
- **Standard protocols**: Uses standard ERC-20 transfer methods

## 📊 Monitoring & Analytics

### Transaction Tracking
All crypto payments are tracked in the `crypto_transactions` table with:
- Transaction hash and block number
- Token details (symbol, address, chain)
- Amount in both human-readable and wei formats
- Gas usage and processing status
- Timestamps for audit trails

### User Analytics
- Payment method preferences
- Token and network usage statistics
- Transaction success rates
- Average transaction times

## 🚀 Testing

### Test Networks
For development and testing, you can:
1. Use testnets (Sepolia, Mumbai, etc.)
2. Update token addresses in `crypto-tokens.ts` for testnet tokens
3. Use testnet RPC URLs in environment variables

### Test Transactions
1. Ensure you have testnet tokens in your wallet
2. Set up testnet RPC endpoints
3. Use small amounts for testing
4. Verify transactions on testnet explorers

## 🔧 Customization

### Adding New Tokens
To add support for new tokens:

1. Add token configuration to `SUPPORTED_TOKENS` array:
```typescript
{
  symbol: 'NEW_TOKEN',
  name: 'New Token',
  decimals: 18,
  address: '0x...',
  chainId: chainId,
  chainName: 'Network Name',
  icon: '🪙',
}
```

2. Update the payment verification API if needed
3. Test thoroughly on testnets first

### Adding New Networks
To add support for new blockchain networks:

1. Add chain configuration to wagmi config
2. Add RPC endpoint to `chainConfigs` in verification API
3. Add token addresses for the new network
4. Update documentation

## 📈 Credit Packages

The system supports the same credit packages as Stripe payments:

- **1,000 Credits** - $25
- **2,105 Credits** - $50 (Popular)
- **4,444 Credits** - $100 (Best Value)

Prices are fixed in USD but paid in stablecoins (USDT/USDC) at 1:1 ratio.

## 🆘 Troubleshooting

### Common Issues

**Transaction not confirming:**
- Check network congestion
- Verify gas fees are sufficient
- Ensure wallet is connected to correct network

**Payment verification failed:**
- Check RPC endpoint connectivity
- Verify transaction was actually mined
- Ensure correct token contract address

**Insufficient balance:**
- User needs sufficient token balance
- Check token decimals are correct
- Verify user is on the correct network

### Support

For technical support:
1. Check transaction hash on blockchain explorer
2. Verify user has correct wallet address in database
3. Check API logs for verification errors
4. Contact development team with transaction details

## 🔄 Future Enhancements

Potential improvements:
- Support for more tokens (DAI, FRAX, etc.)
- Layer 2 solutions (Polygon zkEVM, Arbitrum Nova)
- Automatic token swapping
- Subscription payments with crypto
- Multi-signature wallet support
- Enhanced analytics dashboard 