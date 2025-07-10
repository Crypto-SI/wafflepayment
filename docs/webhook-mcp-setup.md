# 🧇 Waffle Webhook MCP Server Setup Guide

Your custom MCP server for easy Stripe webhook setup! This server provides 8 powerful tools to make webhook integration a breeze.

## 🚀 Quick Start

### 1. Add to Claude Desktop

Add this to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "waffle-webhook": {
      "command": "npm",
      "args": ["run", "mcp:webhook"],
      "cwd": "/Users/cryptosi/Desktop/Vibe Coding/wafflepayment/wafflepayment",
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your_key_here",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_your_key_here",
        "STRIPE_WEBHOOK_SECRET": "whsec_your_secret_here"
      }
    }
  }
}
```

### 2. Alternative: Run Directly

```bash
# Run the MCP server directly
npm run mcp:webhook

# Run in development mode (auto-restart)
npm run mcp:webhook:dev
```

## 🛠️ Available Tools

### 1. `check_webhook_setup`
- **Purpose**: Check current webhook configuration and environment setup
- **Usage**: Run first to see what's missing
- **Output**: Status of environment variables and webhook endpoints

### 2. `create_webhook_endpoint`
- **Purpose**: Create a webhook endpoint in Stripe dashboard
- **Parameters**: 
  - `url` (required): Your webhook endpoint URL
  - `events` (optional): Array of events to listen for
- **Auto-updates**: Your `.env.local` file with the webhook secret

### 3. `start_stripe_cli_listener`
- **Purpose**: Instructions for Stripe CLI webhook forwarding
- **Parameters**: 
  - `port` (optional): Local port to forward to (default: 9002)
- **Best for**: Local development

### 4. `test_webhook_endpoint`
- **Purpose**: Test your webhook endpoint
- **Parameters**: 
  - `event_type` (optional): Event type to trigger (default: checkout.session.completed)
- **Shows**: How to test both via CLI and Stripe Dashboard

### 5. `get_webhook_events`
- **Purpose**: Get recent webhook events and their status
- **Parameters**: 
  - `limit` (optional): Number of events to retrieve (default: 10)
- **Shows**: Real webhook activity

### 6. `setup_local_webhook`
- **Purpose**: Complete local webhook setup guide
- **Parameters**: 
  - `use_ngrok` (optional): Whether to use ngrok (default: true)
- **Options**: ngrok, Stripe CLI, or Cloudflare Tunnel

### 7. `validate_webhook_secret`
- **Purpose**: Test webhook secret validation
- **Parameters**: 
  - `test_payload` (optional): Test payload to validate
- **Validates**: Your webhook secret configuration

### 8. `generate_webhook_guide`
- **Purpose**: Generate deployment-specific setup guide
- **Parameters**: 
  - `deployment_type` (optional): local, vercel, netlify, or custom
- **Output**: Step-by-step guide for your deployment type

## 📋 Common Workflows

### Local Development Setup

1. **Check Status**
   ```
   Use tool: check_webhook_setup
   ```

2. **Start Local Tunnel**
   ```
   Use tool: start_stripe_cli_listener
   # Follow the instructions to run: stripe listen --forward-to localhost:9002/api/stripe/webhook
   ```

3. **Test Webhook**
   ```
   Use tool: test_webhook_endpoint
   # Follow instructions to run: stripe trigger checkout.session.completed
   ```

### Production Setup

1. **Check Status**
   ```
   Use tool: check_webhook_setup
   ```

2. **Create Webhook Endpoint**
   ```
   Use tool: create_webhook_endpoint
   Parameters: { "url": "https://yourdomain.com/api/stripe/webhook" }
   ```

3. **Test Webhook**
   ```
   Use tool: test_webhook_endpoint
   ```

### Troubleshooting

1. **Get Recent Events**
   ```
   Use tool: get_webhook_events
   ```

2. **Validate Secret**
   ```
   Use tool: validate_webhook_secret
   ```

3. **Get Deployment Guide**
   ```
   Use tool: generate_webhook_guide
   Parameters: { "deployment_type": "vercel" }
   ```

## 🔧 Environment Variables

The MCP server automatically reads and updates your `.env.local` file:

```bash
# Required for webhook creation
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Auto-updated by create_webhook_endpoint
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

## 📁 File Structure

```
src/
├── mcp/
│   └── webhook-helper.ts     # Main MCP server
├── app/api/stripe/
│   ├── webhook/
│   │   └── route.ts         # Your webhook handler
│   └── create-checkout-session/
│       └── route.ts         # Checkout session API
└── lib/
    └── stripe.ts            # Stripe configuration
```

## 🎯 Pro Tips

1. **Always start with `check_webhook_setup`** to see current status
2. **Use `start_stripe_cli_listener`** for local development (easier than ngrok)
3. **The MCP server auto-updates your .env.local** when creating webhooks
4. **Use `get_webhook_events`** to debug webhook delivery issues
5. **Generate deployment-specific guides** with `generate_webhook_guide`

## 🔍 Debugging

If something isn't working:

1. Check your environment variables are set correctly
2. Verify your webhook endpoint URL is accessible
3. Use `validate_webhook_secret` to test secret configuration
4. Check recent webhook events with `get_webhook_events`
5. Test with a simple event like `checkout.session.completed`

## 📚 Integration with Your App

Your webhook handler in `src/app/api/stripe/webhook/route.ts` should:

1. Verify the webhook signature using your secret
2. Handle the specific events you're listening for
3. Update your database (Supabase) with payment results
4. Return a 200 response to acknowledge receipt

The MCP server helps you set up and test this entire flow!

## 🆘 Support

If you encounter issues:

1. Use `check_webhook_setup` to diagnose problems
2. Check the Next.js app logs for webhook errors
3. Use Stripe Dashboard to see webhook delivery attempts
4. Test with `validate_webhook_secret` if signature verification fails

Happy webhook setup! 🎉 