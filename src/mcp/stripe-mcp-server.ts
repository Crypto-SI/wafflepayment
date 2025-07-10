#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import Stripe from 'stripe';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Create server
const server = new Server({
  name: 'stripe-mcp-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Helper function to format currency
function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Helper function to get environment variables
function getEnvVar(key: string): string | undefined {
  const envFile = join(process.cwd(), '.env.local');
  if (existsSync(envFile)) {
    const content = readFileSync(envFile, 'utf8');
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1] : undefined;
  }
  return process.env[key];
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Customer Management
      {
        name: 'list_customers',
        description: 'List Stripe customers with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of customers to retrieve (max 100)', default: 10 },
            email: { type: 'string', description: 'Filter by customer email' },
            created_after: { type: 'string', description: 'Filter customers created after this date (ISO string)' },
          },
        },
      },
      {
        name: 'get_customer',
        description: 'Get detailed information about a specific customer',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { type: 'string', description: 'Stripe customer ID' },
          },
          required: ['customer_id'],
        },
      },
      {
        name: 'create_customer',
        description: 'Create a new Stripe customer',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Customer email address' },
            name: { type: 'string', description: 'Customer name' },
            metadata: { type: 'object', description: 'Additional metadata for the customer' },
          },
          required: ['email'],
        },
      },
      {
        name: 'update_customer',
        description: 'Update customer information',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { type: 'string', description: 'Stripe customer ID' },
            email: { type: 'string', description: 'New email address' },
            name: { type: 'string', description: 'New name' },
            metadata: { type: 'object', description: 'Metadata to update' },
          },
          required: ['customer_id'],
        },
      },

      // Payment Sessions
      {
        name: 'create_checkout_session',
        description: 'Create a Stripe checkout session for payments',
        inputSchema: {
          type: 'object',
          properties: {
            line_items: {
              type: 'array',
              description: 'Array of line items for the checkout',
              items: {
                type: 'object',
                properties: {
                  price_data: {
                    type: 'object',
                    properties: {
                      currency: { type: 'string', default: 'usd' },
                      unit_amount: { type: 'number', description: 'Amount in cents' },
                      product_data: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          description: { type: 'string' },
                        },
                        required: ['name'],
                      },
                    },
                    required: ['currency', 'unit_amount', 'product_data'],
                  },
                  quantity: { type: 'number', default: 1 },
                },
                required: ['price_data'],
              },
            },
            success_url: { type: 'string', description: 'URL to redirect after successful payment' },
            cancel_url: { type: 'string', description: 'URL to redirect if payment is cancelled' },
            customer_email: { type: 'string', description: 'Customer email' },
            mode: { type: 'string', enum: ['payment', 'subscription'], default: 'payment' },
            metadata: { type: 'object', description: 'Session metadata' },
          },
          required: ['line_items', 'success_url', 'cancel_url'],
        },
      },
      {
        name: 'get_checkout_session',
        description: 'Retrieve checkout session details',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: { type: 'string', description: 'Checkout session ID' },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'list_checkout_sessions',
        description: 'List recent checkout sessions',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of sessions to retrieve', default: 10 },
            status: { type: 'string', enum: ['open', 'complete', 'expired'] },
          },
        },
      },

      // Subscription Management
      {
        name: 'list_subscriptions',
        description: 'List customer subscriptions',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { type: 'string', description: 'Filter by customer ID' },
            status: { type: 'string', enum: ['active', 'canceled', 'incomplete', 'past_due', 'trialing'] },
            limit: { type: 'number', description: 'Number of subscriptions to retrieve', default: 10 },
          },
        },
      },
      {
        name: 'get_subscription',
        description: 'Get detailed subscription information',
        inputSchema: {
          type: 'object',
          properties: {
            subscription_id: { type: 'string', description: 'Subscription ID' },
          },
          required: ['subscription_id'],
        },
      },
      {
        name: 'cancel_subscription',
        description: 'Cancel a subscription',
        inputSchema: {
          type: 'object',
          properties: {
            subscription_id: { type: 'string', description: 'Subscription ID to cancel' },
            at_period_end: { type: 'boolean', description: 'Cancel at period end instead of immediately', default: true },
          },
          required: ['subscription_id'],
        },
      },

      // Payment Management
      {
        name: 'list_payments',
        description: 'List recent payment intents or charges',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of payments to retrieve', default: 10 },
            customer_id: { type: 'string', description: 'Filter by customer ID' },
            status: { type: 'string', description: 'Filter by payment status' },
          },
        },
      },
      {
        name: 'get_payment',
        description: 'Get payment details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            payment_id: { type: 'string', description: 'Payment intent ID or charge ID' },
          },
          required: ['payment_id'],
        },
      },
      {
        name: 'refund_payment',
        description: 'Create a refund for a payment',
        inputSchema: {
          type: 'object',
          properties: {
            charge_id: { type: 'string', description: 'Charge ID to refund' },
            amount: { type: 'number', description: 'Amount to refund in cents (optional for full refund)' },
            reason: { type: 'string', enum: ['duplicate', 'fraudulent', 'requested_by_customer'] },
            metadata: { type: 'object', description: 'Refund metadata' },
          },
          required: ['charge_id'],
        },
      },

      // Webhook Management
      {
        name: 'list_webhook_endpoints',
        description: 'List configured webhook endpoints',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of endpoints to retrieve', default: 10 },
          },
        },
      },
      {
        name: 'create_webhook_endpoint',
        description: 'Create a new webhook endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Webhook endpoint URL' },
            enabled_events: {
              type: 'array',
              description: 'List of events to listen for',
              items: { type: 'string' },
              default: ['checkout.session.completed', 'invoice.payment_succeeded'],
            },
            description: { type: 'string', description: 'Webhook description' },
          },
          required: ['url'],
        },
      },
      {
        name: 'update_webhook_endpoint',
        description: 'Update webhook endpoint configuration',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint_id: { type: 'string', description: 'Webhook endpoint ID' },
            url: { type: 'string', description: 'New webhook URL' },
            enabled_events: { type: 'array', items: { type: 'string' } },
            disabled: { type: 'boolean', description: 'Disable the webhook' },
          },
          required: ['endpoint_id'],
        },
      },
      {
        name: 'delete_webhook_endpoint',
        description: 'Delete a webhook endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint_id: { type: 'string', description: 'Webhook endpoint ID to delete' },
          },
          required: ['endpoint_id'],
        },
      },

      // Event and Monitoring
      {
        name: 'list_events',
        description: 'List recent Stripe events',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of events to retrieve', default: 10 },
            type: { type: 'string', description: 'Filter by event type (e.g., checkout.session.completed)' },
            created_after: { type: 'string', description: 'Filter events after this timestamp' },
          },
        },
      },
      {
        name: 'get_event',
        description: 'Get details of a specific event',
        inputSchema: {
          type: 'object',
          properties: {
            event_id: { type: 'string', description: 'Event ID' },
          },
          required: ['event_id'],
        },
      },

      // Products and Prices
      {
        name: 'list_products',
        description: 'List Stripe products',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of products to retrieve', default: 10 },
            active: { type: 'boolean', description: 'Filter by active status' },
          },
        },
      },
      {
        name: 'list_prices',
        description: 'List Stripe prices',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of prices to retrieve', default: 10 },
            product: { type: 'string', description: 'Filter by product ID' },
            active: { type: 'boolean', description: 'Filter by active status' },
          },
        },
      },

      // Analytics and Reporting
      {
        name: 'get_balance',
        description: 'Get current Stripe account balance',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_account_info',
        description: 'Get Stripe account information and settings',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Development and Testing
      {
        name: 'create_test_clock',
        description: 'Create a test clock for testing time-dependent features',
        inputSchema: {
          type: 'object',
          properties: {
            frozen_time: { type: 'number', description: 'Unix timestamp to freeze time at' },
            name: { type: 'string', description: 'Name for the test clock' },
          },
          required: ['frozen_time'],
        },
      },
      {
        name: 'list_test_clocks',
        description: 'List test clocks',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of test clocks to retrieve', default: 10 },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Customer Management
      case 'list_customers': {
        const { limit = 10, email, created_after } = args as any;
        const params: any = { limit };
        
        if (email) params.email = email;
        if (created_after) params.created = { gte: Math.floor(new Date(created_after).getTime() / 1000) };

        const customers = await stripe.customers.list(params);
        
        return {
          content: [{
            type: 'text',
            text: `Found ${customers.data.length} customers:\n\n` + 
                  customers.data.map(customer => 
                    `• ${customer.email || 'No email'} (${customer.id})\n` +
                    `  Name: ${customer.name || 'No name'}\n` +
                    `  Created: ${new Date(customer.created * 1000).toLocaleDateString()}\n`
                  ).join('\n'),
          }],
        };
      }

      case 'get_customer': {
        const { customer_id } = args as any;
        const customer = await stripe.customers.retrieve(customer_id);
        
        if (customer.deleted) {
          return {
            content: [{ type: 'text', text: `Customer ${customer_id} has been deleted.` }],
          };
        }

        return {
          content: [{
            type: 'text',
            text: `Customer Details:\n\n` +
                  `ID: ${customer.id}\n` +
                  `Email: ${customer.email || 'Not set'}\n` +
                  `Name: ${customer.name || 'Not set'}\n` +
                  `Created: ${new Date(customer.created * 1000).toLocaleDateString()}\n` +
                  `Default Payment Method: ${customer.default_source || 'None'}\n` +
                  `Metadata: ${JSON.stringify(customer.metadata, null, 2)}`,
          }],
        };
      }

      case 'create_customer': {
        const { email, name, metadata } = args as any;
        const customerData: any = { email };
        
        if (name) customerData.name = name;
        if (metadata) customerData.metadata = metadata;

        const customer = await stripe.customers.create(customerData);
        
        return {
          content: [{
            type: 'text',
            text: `✅ Customer created successfully!\n\n` +
                  `ID: ${customer.id}\n` +
                  `Email: ${customer.email}\n` +
                  `Name: ${customer.name || 'Not set'}`,
          }],
        };
      }

      case 'update_customer': {
        const { customer_id, email, name, metadata } = args as any;
        const updateData: any = {};
        
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (metadata) updateData.metadata = metadata;

        const customer = await stripe.customers.update(customer_id, updateData);
        
        return {
          content: [{
            type: 'text',
            text: `✅ Customer updated successfully!\n\n` +
                  `ID: ${customer.id}\n` +
                  `Email: ${customer.email}\n` +
                  `Name: ${customer.name || 'Not set'}`,
          }],
        };
      }

      // Payment Sessions
      case 'create_checkout_session': {
        const { line_items, success_url, cancel_url, customer_email, mode = 'payment', metadata } = args as any;
        
        const sessionData: any = {
          line_items,
          mode,
          success_url,
          cancel_url,
          payment_method_types: ['card'],
        };

        if (customer_email) sessionData.customer_email = customer_email;
        if (metadata) sessionData.metadata = metadata;

        const session = await stripe.checkout.sessions.create(sessionData);
        
        return {
          content: [{
            type: 'text',
            text: `✅ Checkout session created successfully!\n\n` +
                  `Session ID: ${session.id}\n` +
                  `URL: ${session.url}\n` +
                  `Status: ${session.status}\n` +
                  `Amount Total: ${session.amount_total ? formatCurrency(session.amount_total) : 'Variable'}`,
          }],
        };
      }

      case 'get_checkout_session': {
        const { session_id } = args as any;
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        return {
          content: [{
            type: 'text',
            text: `Checkout Session Details:\n\n` +
                  `ID: ${session.id}\n` +
                  `Status: ${session.status}\n` +
                  `Payment Status: ${session.payment_status}\n` +
                  `Customer Email: ${session.customer_details?.email || 'Not provided'}\n` +
                  `Amount Total: ${session.amount_total ? formatCurrency(session.amount_total) : 'N/A'}\n` +
                  `Currency: ${session.currency?.toUpperCase() || 'N/A'}\n` +
                  `Mode: ${session.mode}\n` +
                  `Created: ${new Date(session.created * 1000).toLocaleString()}\n` +
                  `Metadata: ${JSON.stringify(session.metadata, null, 2)}`,
          }],
        };
      }

      case 'list_checkout_sessions': {
        const { limit = 10, status } = args as any;
        const params: any = { limit };
        
        if (status) params.status = status;

        const sessions = await stripe.checkout.sessions.list(params);
        
        return {
          content: [{
            type: 'text',
            text: `Found ${sessions.data.length} checkout sessions:\n\n` + 
                  sessions.data.map(session => 
                    `• ${session.id} - ${session.status}\n` +
                    `  Customer: ${session.customer_details?.email || 'Anonymous'}\n` +
                    `  Amount: ${session.amount_total ? formatCurrency(session.amount_total) : 'Variable'}\n` +
                    `  Created: ${new Date(session.created * 1000).toLocaleDateString()}\n`
                  ).join('\n'),
          }],
        };
      }

      // Continue with other tool implementations...
      case 'list_subscriptions': {
        const { customer_id, status, limit = 10 } = args as any;
        const params: any = { limit };
        
        if (customer_id) params.customer = customer_id;
        if (status) params.status = status;

        const subscriptions = await stripe.subscriptions.list(params);
        
        return {
          content: [{
            type: 'text',
            text: `Found ${subscriptions.data.length} subscriptions:\n\n` + 
                  subscriptions.data.map(sub => 
                    `• ${sub.id} - ${sub.status}\n` +
                    `  Customer: ${sub.customer}\n` +
                    `  Current Period: ${new Date(sub.current_period_start * 1000).toLocaleDateString()} - ${new Date(sub.current_period_end * 1000).toLocaleDateString()}\n` +
                    `  Amount: ${sub.items.data[0]?.price ? formatCurrency(sub.items.data[0].price.unit_amount || 0) : 'N/A'}\n`
                  ).join('\n'),
          }],
        };
      }

      case 'cancel_subscription': {
        const { subscription_id, at_period_end = true } = args as any;
        
        let subscription;
        if (at_period_end) {
          subscription = await stripe.subscriptions.update(subscription_id, {
            cancel_at_period_end: true,
          });
        } else {
          subscription = await stripe.subscriptions.cancel(subscription_id);
        }
        
        return {
          content: [{
            type: 'text',
            text: `✅ Subscription ${at_period_end ? 'scheduled for cancellation' : 'cancelled immediately'}!\n\n` +
                  `ID: ${subscription.id}\n` +
                  `Status: ${subscription.status}\n` +
                  `${at_period_end ? `Will cancel at: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}` : 'Cancelled immediately'}`,
          }],
        };
      }

      case 'list_webhook_endpoints': {
        const { limit = 10 } = args as any;
        const endpoints = await stripe.webhookEndpoints.list({ limit });
        
        return {
          content: [{
            type: 'text',
            text: `Found ${endpoints.data.length} webhook endpoints:\n\n` + 
                  endpoints.data.map(endpoint => 
                    `• ${endpoint.id}\n` +
                    `  URL: ${endpoint.url}\n` +
                    `  Status: ${endpoint.status}\n` +
                    `  Events: ${endpoint.enabled_events.join(', ')}\n` +
                    `  Created: ${new Date(endpoint.created * 1000).toLocaleDateString()}\n`
                  ).join('\n'),
          }],
        };
      }

      case 'create_webhook_endpoint': {
        const { url, enabled_events = ['checkout.session.completed', 'invoice.payment_succeeded'], description } = args as any;
        
        const endpointData: any = {
          url,
          enabled_events,
        };
        
        if (description) endpointData.description = description;

        const endpoint = await stripe.webhookEndpoints.create(endpointData);
        
        return {
          content: [{
            type: 'text',
            text: `✅ Webhook endpoint created successfully!\n\n` +
                  `ID: ${endpoint.id}\n` +
                  `URL: ${endpoint.url}\n` +
                  `Secret: ${endpoint.secret}\n` +
                  `Events: ${endpoint.enabled_events.join(', ')}\n\n` +
                  `⚠️  Save the webhook secret in your environment variables:\n` +
                  `STRIPE_WEBHOOK_SECRET=${endpoint.secret}`,
          }],
        };
      }

      case 'get_balance': {
        const balance = await stripe.balance.retrieve();
        
        return {
          content: [{
            type: 'text',
            text: `Stripe Account Balance:\n\n` +
                  balance.available.map(bal => 
                    `Available: ${formatCurrency(bal.amount, bal.currency)}`
                  ).join('\n') + '\n\n' +
                  balance.pending.map(bal => 
                    `Pending: ${formatCurrency(bal.amount, bal.currency)}`
                  ).join('\n'),
          }],
        };
      }

      case 'list_events': {
        const { limit = 10, type, created_after } = args as any;
        const params: any = { limit };
        
        if (type) params.type = type;
        if (created_after) params.created = { gte: Math.floor(new Date(created_after).getTime() / 1000) };

        const events = await stripe.events.list(params);
        
        return {
          content: [{
            type: 'text',
            text: `Found ${events.data.length} events:\n\n` + 
                  events.data.map(event => 
                    `• ${event.type} (${event.id})\n` +
                    `  Created: ${new Date(event.created * 1000).toLocaleString()}\n` +
                    `  Request: ${event.request?.id || 'N/A'}\n`
                  ).join('\n'),
          }],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${errorMessage}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stripe MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });
} 