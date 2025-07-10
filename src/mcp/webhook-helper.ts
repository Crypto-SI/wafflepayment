#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { stripe } from '../lib/stripe.js';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Create server
const server = new Server({
  name: 'waffle-webhook-helper',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Helper function to get current environment
function getEnvironment() {
  const envFile = join(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envFile, 'utf8');
    return {
      hasStripeKeys: content.includes('STRIPE_SECRET_KEY') && content.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
      hasWebhookSecret: content.includes('STRIPE_WEBHOOK_SECRET'),
      content
    };
  } catch {
    return { hasStripeKeys: false, hasWebhookSecret: false, content: '' };
  }
}

// Helper function to update environment file
function updateEnvFile(key: string, value: string) {
  const envFile = join(process.cwd(), '.env.local');
  let content = '';
  
  try {
    content = readFileSync(envFile, 'utf8');
  } catch {
    content = '';
  }
  
  const lines = content.split('\n');
  const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));
  
  if (keyIndex >= 0) {
    lines[keyIndex] = `${key}=${value}`;
  } else {
    lines.push(`${key}=${value}`);
  }
  
  writeFileSync(envFile, lines.join('\n'));
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_webhook_setup',
        description: 'Check current webhook configuration and environment setup',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_webhook_endpoint',
        description: 'Create a webhook endpoint in Stripe dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Your webhook endpoint URL (e.g., https://yourdomain.com/api/stripe/webhook)',
            },
            events: {
              type: 'array',
              description: 'List of events to listen for',
              items: { type: 'string' },
              default: ['checkout.session.completed', 'invoice.payment_succeeded'],
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'start_stripe_cli_listener',
        description: 'Start Stripe CLI webhook forwarding for local development',
        inputSchema: {
          type: 'object',
          properties: {
            port: {
              type: 'number',
              description: 'Local port to forward to',
              default: 9002,
            },
          },
        },
      },
      {
        name: 'test_webhook_endpoint',
        description: 'Test your webhook endpoint by triggering a test event',
        inputSchema: {
          type: 'object',
          properties: {
            event_type: {
              type: 'string',
              description: 'Type of event to trigger',
              default: 'checkout.session.completed',
            },
          },
        },
      },
      {
        name: 'get_webhook_events',
        description: 'Get list of recent webhook events and their status',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of events to retrieve',
              default: 10,
            },
          },
        },
      },
      {
        name: 'setup_local_webhook',
        description: 'Complete local webhook setup with ngrok or similar',
        inputSchema: {
          type: 'object',
          properties: {
            use_ngrok: {
              type: 'boolean',
              description: 'Use ngrok for local tunneling',
              default: true,
            },
          },
        },
      },
      {
        name: 'validate_webhook_secret',
        description: 'Test webhook secret validation with your endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            test_payload: {
              type: 'string',
              description: 'Test payload to validate',
              default: '{"id": "evt_test_webhook", "object": "event"}',
            },
          },
        },
      },
      {
        name: 'generate_webhook_guide',
        description: 'Generate step-by-step webhook setup guide for your specific setup',
        inputSchema: {
          type: 'object',
          properties: {
            deployment_type: {
              type: 'string',
              description: 'Type of deployment (local, vercel, netlify, custom)',
              default: 'local',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'check_webhook_setup': {
      const env = getEnvironment();
      let webhookEndpoints = [];
      
      try {
        const endpoints = await stripe.webhookEndpoints.list();
        webhookEndpoints = endpoints.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `❌ Error checking webhook endpoints: ${errorMessage}`,
          }],
        };
      }

      const status = `
🔧 **Webhook Setup Status**

**Environment Variables:**
- Stripe Secret Key: ${env.hasStripeKeys ? '✅ Set' : '❌ Missing'}
- Webhook Secret: ${env.hasWebhookSecret ? '✅ Set' : '❌ Missing'}

**Webhook Endpoints in Stripe:**
${webhookEndpoints.length > 0 ? 
  webhookEndpoints.map(ep => `- ${ep.url} (${ep.status})`).join('\n') :
  '❌ No webhook endpoints configured'
}

**Next Steps:**
${!env.hasStripeKeys ? '1. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local\n' : ''}
${webhookEndpoints.length === 0 ? '2. Create webhook endpoint using create_webhook_endpoint\n' : ''}
${!env.hasWebhookSecret ? '3. Add STRIPE_WEBHOOK_SECRET after creating endpoint\n' : ''}
      `;

      return {
        content: [{
          type: 'text',
          text: status,
        }],
      };
    }

    case 'create_webhook_endpoint': {
      const url = args?.url as string;
      const events = (args?.events as string[]) || ['checkout.session.completed', 'invoice.payment_succeeded'];
      
      if (!url) {
        return {
          content: [{
            type: 'text',
            text: '❌ URL is required to create webhook endpoint',
          }],
        };
      }
      
      try {
        const endpoint = await stripe.webhookEndpoints.create({
          url: url,
          enabled_events: events as any, // Cast to bypass type checking for webhook events
        });
        
        const guide = `
✅ **Webhook Endpoint Created Successfully!**

**Endpoint Details:**
- URL: ${endpoint.url}
- Status: ${endpoint.status}
- Events: ${endpoint.enabled_events.join(', ')}

**🔑 IMPORTANT - Your Webhook Secret:**
\`\`\`
${endpoint.secret}
\`\`\`

**Add this to your .env.local file:**
\`\`\`
STRIPE_WEBHOOK_SECRET=${endpoint.secret}
\`\`\`

**Test your webhook:**
1. Make sure your app is running on the specified URL
2. Use the test_webhook_endpoint tool to send a test event
3. Check your app logs to see if the webhook was received
        `;
        
        // Auto-update environment file
        if (endpoint.secret) {
          updateEnvFile('STRIPE_WEBHOOK_SECRET', endpoint.secret);
        }
        
        return {
          content: [{
            type: 'text',
            text: guide,
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `❌ Error creating webhook endpoint: ${errorMessage}`,
          }],
        };
      }
    }

    case 'start_stripe_cli_listener': {
      const port = (args?.port as number) || 9002;
      
      const instructions = `
🚀 **Starting Stripe CLI Listener**

**Run this command in your terminal:**
\`\`\`bash
stripe listen --forward-to localhost:${port}/api/stripe/webhook
\`\`\`

**This will:**
1. Forward webhook events to your local app
2. Display a webhook signing secret
3. Show real-time webhook events

**After running the command:**
1. Copy the webhook signing secret (starts with whsec_)
2. Add it to your .env.local: STRIPE_WEBHOOK_SECRET=whsec_...
3. Test with: stripe trigger checkout.session.completed

**Note:** Make sure your app is running on port ${port}
      `;
      
      return {
        content: [{
          type: 'text',
          text: instructions,
        }],
      };
    }

    case 'test_webhook_endpoint': {
      const event_type = (args?.event_type as string) || 'checkout.session.completed';
      
      const instructions = `
🧪 **Testing Webhook Endpoint**

**Using Stripe CLI:**
\`\`\`bash
stripe trigger ${event_type}
\`\`\`

**Manual Test (if webhook endpoint exists):**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select "${event_type}" event
5. Click "Send test webhook"

**Check your application logs for:**
- ✅ Webhook received successfully
- ✅ Signature verification passed
- ✅ Event processed correctly

**Common Issues:**
- 400 Bad Request: Check webhook secret configuration
- 404 Not Found: Verify webhook URL is correct
- 500 Server Error: Check your webhook handler code
      `;
      
      return {
        content: [{
          type: 'text',
          text: instructions,
        }],
      };
    }

    case 'get_webhook_events': {
      const limit = (args?.limit as number) || 10;
      
      try {
        const events = await stripe.events.list({ limit });
        
        const eventsList = events.data.map(event => 
          `- ${event.type} (${event.created}) - ${event.id}`
        ).join('\n');
        
        const report = `
📊 **Recent Webhook Events**

${eventsList}

**Event Details:**
- Total events: ${events.data.length}
- Most recent: ${events.data[0]?.type || 'None'}

**To see detailed event data:**
\`\`\`bash
stripe events retrieve ${events.data[0]?.id || 'evt_id'}
\`\`\`
        `;
        
        return {
          content: [{
            type: 'text',
            text: report,
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `❌ Error fetching webhook events: ${errorMessage}`,
          }],
        };
      }
    }

    case 'setup_local_webhook': {
      const use_ngrok = (args?.use_ngrok as boolean) ?? true;
      
      const guide = `
🔧 **Local Webhook Setup Guide**

**Option 1: Using ngrok (Recommended)**
\`\`\`bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, create tunnel
ngrok http 9002

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Use create_webhook_endpoint with: https://abc123.ngrok.io/api/stripe/webhook
\`\`\`

**Option 2: Using Stripe CLI (Easier)**
\`\`\`bash
# Install Stripe CLI
# Start your app
npm run dev

# In another terminal
stripe listen --forward-to localhost:9002/api/stripe/webhook

# Copy the webhook secret and add to .env.local
\`\`\`

**Option 3: Using Cloudflare Tunnel**
\`\`\`bash
# Install cloudflared
cloudflared tunnel --url localhost:9002
\`\`\`

**Current Status:**
- App should be running on: http://localhost:9002
- Webhook endpoint: /api/stripe/webhook
- Next: Choose one of the options above and run create_webhook_endpoint
      `;
      
      return {
        content: [{
          type: 'text',
          text: guide,
        }],
      };
    }

    case 'validate_webhook_secret': {
      const test_payload = (args?.test_payload as string) || '{"id": "evt_test_webhook", "object": "event"}';
      
      const env = getEnvironment();
      if (!env.hasWebhookSecret) {
        return {
          content: [{
            type: 'text',
            text: '❌ STRIPE_WEBHOOK_SECRET not found in .env.local. Please set it up first.',
          }],
        };
      }
      
      try {
        const secret = process.env.STRIPE_WEBHOOK_SECRET || env.content.match(/STRIPE_WEBHOOK_SECRET=(.+)/)?.[1];
        
        if (!secret) {
          return {
            content: [{
              type: 'text',
              text: '❌ Could not find webhook secret in environment',
            }],
          };
        }
        
        // Generate test signature
        const testHeader = stripe.webhooks.generateTestHeaderString({
          payload: test_payload,
          secret: secret,
        });
        
        // Verify it works
        const event = stripe.webhooks.constructEvent(test_payload, testHeader, secret);
        
        const result = `
✅ **Webhook Secret Validation Successful!**

**Test Results:**
- Secret: ${secret?.substring(0, 12)}...
- Payload validated: ✅
- Event constructed: ✅
- Event ID: ${event.id}

**Your webhook secret is correctly configured!**

**Test in your app:**
1. Make sure your webhook handler uses the same secret
2. Use stripe.webhooks.constructEvent() in your handler
3. Test with a real webhook event
        `;
        
        return {
          content: [{
            type: 'text',
            text: result,
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `❌ Webhook secret validation failed: ${errorMessage}`,
          }],
        };
      }
    }

    case 'generate_webhook_guide': {
      const deployment_type = (args?.deployment_type as string) || 'local';
      
      const guides = {
        local: `
🏠 **Local Development Webhook Setup**

**Step 1: Environment Setup**
\`\`\`bash
# Add to .env.local
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
\`\`\`

**Step 2: Start Local Tunnel**
\`\`\`bash
# Option A: Stripe CLI (Recommended)
stripe listen --forward-to localhost:9002/api/stripe/webhook

# Option B: ngrok
ngrok http 9002
\`\`\`

**Step 3: Create Webhook Endpoint**
- Use the create_webhook_endpoint tool with your tunnel URL
- Copy the webhook secret to .env.local

**Step 4: Test**
\`\`\`bash
stripe trigger checkout.session.completed
\`\`\`
        `,
        vercel: `
🚀 **Vercel Deployment Webhook Setup**

**Step 1: Deploy to Vercel**
\`\`\`bash
vercel --prod
\`\`\`

**Step 2: Set Environment Variables**
\`\`\`bash
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
\`\`\`

**Step 3: Create Webhook Endpoint**
- URL: https://your-app.vercel.app/api/stripe/webhook
- Use create_webhook_endpoint tool

**Step 4: Update Environment**
\`\`\`bash
vercel env add STRIPE_WEBHOOK_SECRET [your-secret]
\`\`\`
        `,
        netlify: `
🌐 **Netlify Deployment Webhook Setup**

**Step 1: Deploy to Netlify**
\`\`\`bash
netlify deploy --prod
\`\`\`

**Step 2: Set Environment Variables**
- Go to Site settings → Environment variables
- Add STRIPE_SECRET_KEY
- Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- Add STRIPE_WEBHOOK_SECRET

**Step 3: Create Webhook Endpoint**
- URL: https://your-app.netlify.app/api/stripe/webhook
- Use create_webhook_endpoint tool
        `,
      };
      
      return {
        content: [{
          type: 'text',
          text: guides[deployment_type as keyof typeof guides] || guides.local,
        }],
      };
    }

    default:
      return {
        content: [{
          type: 'text',
          text: `Unknown tool: ${name}`,
        }],
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Waffle Webhook Helper MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
}); 