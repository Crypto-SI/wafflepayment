# Stripe Payment Integration Setup

This guide walks you through setting up Stripe payments for the Waffle Payments app.

## 🔑 Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 📋 Stripe Setup Steps

### 1. Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Create an account or log in
3. Navigate to the Dashboard

### 2. Get API Keys
1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** → Add to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Reveal and copy your **Secret key** → Add to `STRIPE_SECRET_KEY`

### 3. Set Up Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
   - For local development: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** → Add to `STRIPE_WEBHOOK_SECRET`

### 4. Local Development Setup

For local testing, you'll need to expose your webhook endpoint:

#### Option A: Using ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 9002

# Use the https URL for your webhook endpoint
```

#### Option B: Using Stripe CLI
```bash
# Install Stripe CLI
# Follow instructions at: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:9002/api/stripe/webhook

# This will give you a webhook secret starting with whsec_
```

## 💳 Credit Packages Configuration

The app comes with pre-configured credit packages:

### One-time Purchases
- **1,000 Credits** - $25
- **2,105 Credits** - $50 (Popular)
- **4,444 Credits** - $100 (Best Value)

### Subscriptions
- **Monthly Plan** - 1,000 credits for $20/month

To modify these packages, edit `src/lib/stripe.ts`:

```typescript
export const CREDIT_PACKAGES = [
  { credits: 1000, price: 25, priceId: 'price_1000_credits' },
  { credits: 2105, price: 50, priceId: 'price_2105_credits' },
  { credits: 4444, price: 100, priceId: 'price_4444_credits' },
] as const;
```

## 🔄 Payment Flow

### For Customers:
1. User selects credit package on `/top-up`
2. Clicks "Pay with Card (Stripe)"
3. Redirected to Stripe Checkout
4. Completes payment
5. Redirected to `/confirmation` with session details
6. Credits automatically added via webhook

### Technical Flow:
1. **Frontend**: Creates checkout session via `/api/stripe/create-checkout-session`
2. **Backend**: Creates Stripe session with metadata
3. **Stripe**: Processes payment
4. **Webhook**: `/api/stripe/webhook` receives payment confirmation
5. **Database**: Credits added to user account via trigger

## 🗄️ Database Integration

The Stripe integration works with your existing Supabase setup:

### Tables Used:
- `subscribers` - User account data and credit balances
- `credit_transactions` - Transaction history
- `user_credits` - Real-time credit balances (updated via triggers)

### Automatic Credit Updates:
When a payment succeeds, the webhook:
1. Creates a record in `credit_transactions`
2. Database trigger automatically updates `user_credits`
3. User sees updated balance immediately

## 🧪 Testing

### Test Cards (Stripe Test Mode):
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any:
- Future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any postal code

### Testing Webhooks:
```bash
# Using Stripe CLI
stripe trigger checkout.session.completed

# Check your webhook endpoint logs
```

## 🚀 Production Deployment

### 1. Switch to Live Mode
1. In Stripe Dashboard, toggle to **Live mode**
2. Get live API keys and update environment variables
3. Update webhook endpoint to production URL

### 2. Set Up Production Webhooks
1. Create new webhook endpoint with production URL
2. Select same events as test webhook
3. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

### 3. Security Checklist
- ✅ Environment variables secured
- ✅ Webhook signature verification enabled
- ✅ HTTPS enforced in production
- ✅ API keys rotated if needed

## 🛠️ Troubleshooting

### Common Issues:

#### "Invalid API Key"
- Check that you're using the correct key for your mode (test/live)
- Ensure no extra spaces in environment variables

#### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check that webhook endpoint URL is accessible
- Ensure raw request body is used for verification

#### "No such customer"
- This happens when user data is inconsistent
- Check Supabase `subscribers` table for user record

#### Credits Not Added
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is receiving events
- Check database triggers are working

### Debug Commands:
```bash
# Check webhook deliveries
# Go to Stripe Dashboard → Webhooks → Your endpoint → View logs

# Test webhook locally
stripe listen --forward-to localhost:9002/api/stripe/webhook

# View Stripe logs
stripe logs tail
```

## 📊 Monitoring

Monitor your Stripe integration:

1. **Stripe Dashboard**: Payment success/failure rates
2. **Webhook Logs**: Event delivery status
3. **Database**: Credit transaction records
4. **Application Logs**: Error tracking

## 💰 Fees

Stripe charges:
- **2.9% + 30¢** per successful card charge
- **0.5%** additional for international cards
- **No setup fees** or monthly fees

Factor these into your pricing strategy.

## 📞 Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For integration issues:
- Check the troubleshooting section above
- Review application logs
- Test with Stripe CLI tools 