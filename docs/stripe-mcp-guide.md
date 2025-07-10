# Stripe MCP Server Guide

This guide covers the comprehensive Stripe MCP server that provides all the tools you need to manage your Stripe integration effectively.

## Setup

### 1. Environment Variables
Make sure you have these environment variables set in your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### 2. MCP Configuration
The MCP is configured in `mcp-config-corrected.json` as `stripe-mcp`. Make sure to update the environment variables in that file with your actual Stripe keys.

### 3. Running the MCP
The MCP server is automatically started when you use it through your MCP-enabled environment. You can also run it manually:

```bash
npm run mcp:stripe         # Run once
npm run mcp:stripe:dev     # Run with watch mode for development
```

## Available Tools

### Customer Management

#### `list_customers`
List Stripe customers with optional filtering.

**Parameters:**
- `limit` (number, optional): Number of customers to retrieve (max 100, default: 10)
- `email` (string, optional): Filter by customer email
- `created_after` (string, optional): Filter customers created after this date (ISO string)

**Example Usage:**
```
List all customers created after January 1, 2024
```

#### `get_customer`
Get detailed information about a specific customer.

**Parameters:**
- `customer_id` (string, required): Stripe customer ID

#### `create_customer`
Create a new Stripe customer.

**Parameters:**
- `email` (string, required): Customer email address
- `name` (string, optional): Customer name
- `metadata` (object, optional): Additional metadata for the customer

#### `update_customer`
Update customer information.

**Parameters:**
- `customer_id` (string, required): Stripe customer ID
- `email` (string, optional): New email address
- `name` (string, optional): New name
- `metadata` (object, optional): Metadata to update

### Payment Sessions

#### `create_checkout_session`
Create a Stripe checkout session for payments.

**Parameters:**
- `line_items` (array, required): Array of line items for the checkout
- `success_url` (string, required): URL to redirect after successful payment
- `cancel_url` (string, required): URL to redirect if payment is cancelled
- `customer_email` (string, optional): Customer email
- `mode` (string, optional): 'payment' or 'subscription' (default: 'payment')
- `metadata` (object, optional): Session metadata

**Example line_items format:**
```json
[
  {
    "price_data": {
      "currency": "usd",
      "unit_amount": 2500,
      "product_data": {
        "name": "Single Stack - 1,000 Credits",
        "description": "Perfect for getting started"
      }
    },
    "quantity": 1
  }
]
```

#### `get_checkout_session`
Retrieve checkout session details.

**Parameters:**
- `session_id` (string, required): Checkout session ID

#### `list_checkout_sessions`
List recent checkout sessions.

**Parameters:**
- `limit` (number, optional): Number of sessions to retrieve (default: 10)
- `status` (string, optional): Filter by status ('open', 'complete', 'expired')

### Subscription Management

#### `list_subscriptions`
List customer subscriptions.

**Parameters:**
- `customer_id` (string, optional): Filter by customer ID
- `status` (string, optional): Filter by status ('active', 'canceled', 'incomplete', 'past_due', 'trialing')
- `limit` (number, optional): Number of subscriptions to retrieve (default: 10)

#### `get_subscription`
Get detailed subscription information.

**Parameters:**
- `subscription_id` (string, required): Subscription ID

#### `cancel_subscription`
Cancel a subscription.

**Parameters:**
- `subscription_id` (string, required): Subscription ID to cancel
- `at_period_end` (boolean, optional): Cancel at period end instead of immediately (default: true)

### Payment Management

#### `list_payments`
List recent payment intents or charges.

**Parameters:**
- `limit` (number, optional): Number of payments to retrieve (default: 10)
- `customer_id` (string, optional): Filter by customer ID
- `status` (string, optional): Filter by payment status

#### `get_payment`
Get payment details by ID.

**Parameters:**
- `payment_id` (string, required): Payment intent ID or charge ID

#### `refund_payment`
Create a refund for a payment.

**Parameters:**
- `charge_id` (string, required): Charge ID to refund
- `amount` (number, optional): Amount to refund in cents (optional for full refund)
- `reason` (string, optional): Refund reason ('duplicate', 'fraudulent', 'requested_by_customer')
- `metadata` (object, optional): Refund metadata

### Webhook Management

#### `list_webhook_endpoints`
List configured webhook endpoints.

**Parameters:**
- `limit` (number, optional): Number of endpoints to retrieve (default: 10)

#### `create_webhook_endpoint`
Create a new webhook endpoint.

**Parameters:**
- `url` (string, required): Webhook endpoint URL
- `enabled_events` (array, optional): List of events to listen for (default: ['checkout.session.completed', 'invoice.payment_succeeded'])
- `description` (string, optional): Webhook description

#### `update_webhook_endpoint`
Update webhook endpoint configuration.

**Parameters:**
- `endpoint_id` (string, required): Webhook endpoint ID
- `url` (string, optional): New webhook URL
- `enabled_events` (array, optional): New list of events
- `disabled` (boolean, optional): Disable the webhook

#### `delete_webhook_endpoint`
Delete a webhook endpoint.

**Parameters:**
- `endpoint_id` (string, required): Webhook endpoint ID to delete

### Event Monitoring

#### `list_events`
List recent Stripe events.

**Parameters:**
- `limit` (number, optional): Number of events to retrieve (default: 10)
- `type` (string, optional): Filter by event type (e.g., 'checkout.session.completed')
- `created_after` (string, optional): Filter events after this timestamp

#### `get_event`
Get details of a specific event.

**Parameters:**
- `event_id` (string, required): Event ID

### Products and Prices

#### `list_products`
List Stripe products.

**Parameters:**
- `limit` (number, optional): Number of products to retrieve (default: 10)
- `active` (boolean, optional): Filter by active status

#### `list_prices`
List Stripe prices.

**Parameters:**
- `limit` (number, optional): Number of prices to retrieve (default: 10)
- `product` (string, optional): Filter by product ID
- `active` (boolean, optional): Filter by active status

### Analytics and Account Info

#### `get_balance`
Get current Stripe account balance.

#### `get_account_info`
Get Stripe account information and settings.

### Development and Testing

#### `create_test_clock`
Create a test clock for testing time-dependent features.

**Parameters:**
- `frozen_time` (number, required): Unix timestamp to freeze time at
- `name` (string, optional): Name for the test clock

#### `list_test_clocks`
List test clocks.

**Parameters:**
- `limit` (number, optional): Number of test clocks to retrieve (default: 10)

## Common Use Cases

### 1. Monitor Recent Payments
```
List the last 20 checkout sessions with status 'complete'
```

### 2. Check Customer Activity
```
Get customer details for customer ID cus_abc123 and list their recent payments
```

### 3. Set Up Webhooks
```
Create a webhook endpoint for https://yourdomain.com/api/stripe/webhook with events: checkout.session.completed, invoice.payment_succeeded
```

### 4. Handle Refunds
```
Refund payment charge_xyz789 for the full amount with reason 'requested_by_customer'
```

### 5. Monitor Subscriptions
```
List all active subscriptions and check their status
```

### 6. Create Payment Sessions
```
Create a checkout session for 1000 credits at $25 with success URL /confirmation and cancel URL /top-up
```

## Troubleshooting

### Common Issues

1. **Invalid API Key**: Make sure your `STRIPE_SECRET_KEY` is set correctly and starts with `sk_test_` for test mode or `sk_live_` for live mode.

2. **Webhook Signature Verification**: Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret from your Stripe dashboard.

3. **Permission Errors**: Check that your Stripe API key has the necessary permissions for the operations you're trying to perform.

### Error Handling

The MCP server provides detailed error messages for common issues:
- Invalid parameters
- Missing required fields
- Stripe API errors
- Network connectivity issues

### Logging

The MCP server logs important events and errors to help with debugging. Check the console output when running the server for detailed information about requests and responses.

## Integration with Your Waffle Payment App

This MCP server is designed to work seamlessly with your existing Waffle Payment application. You can:

1. **Monitor payments**: Track successful payments and failed transactions
2. **Manage customers**: Create and update customer information
3. **Handle subscriptions**: Manage recurring payments for Waffle Club subscriptions
4. **Process refunds**: Handle customer refund requests
5. **Webhook management**: Set up and monitor webhook endpoints for real-time payment updates

The MCP provides a comprehensive toolkit for managing all aspects of your Stripe integration without needing to write custom scripts or use the Stripe CLI for most operations. 