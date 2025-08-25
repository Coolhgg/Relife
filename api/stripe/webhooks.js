// Stripe Webhook API Route for Vercel Deployment
// This file handles incoming Stripe webhook events in production

import { createServerlessWebhookHandler } from '../../src/backend/webhook-endpoint.js';

// Create the webhook handler
const webhookHandler = createServerlessWebhookHandler();

// Export as default for Vercel
export default webhookHandler;

// Important: Configure to handle raw webhook data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    // Disable default body parser to get raw request body for signature verification
    externalResolver: true,
  },
};