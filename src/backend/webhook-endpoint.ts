// Stripe Webhook Endpoint for Relife Alarm App
// HTTP endpoint to receive and process Stripe webhook events

import StripeWebhookHandler from './stripe-webhooks';
import { ErrorHandler } from '../services/error-handler';
import AnalyticsService from '../services/analytics';

// Configuration - these should come from environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const webhookHandler = new StripeWebhookHandler(
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET
);

export interface WebhookRequest {
  body: string | Buffer;
  headers: {
    'stripe-signature': string;
    'content-type'?: string;
  };
}

export interface WebhookResponse {
  statusCode: number;
  body: string;
  headers: {
    'Content-Type': string;
  };
}

/**
 * Main webhook endpoint handler
 * This can be deployed as a serverless function or regular API endpoint
 */
export async function handleStripeWebhook(
  request: WebhookRequest
): Promise<WebhookResponse> {
  const startTime = Date.now();

  try {
    // Validate required headers
    const signature = request.headers['stripe-signature'];
    if (!signature) {
      return createErrorResponse(400, 'Missing Stripe signature header');
    }

    // Validate content type
    const contentType = request.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      return createErrorResponse(400, 'Invalid content type');
    }

    // Verify webhook signature and construct event
    let event;
    try {
      event = webhookHandler.constructEvent(request.body, signature);
    } catch (error) {
      ErrorHandler.logError(error as Error, {
        context: 'webhook_signature_verification',
        signature: signature.substring(0, 20) + '...', // Log partial signature for debugging
      });
      return createErrorResponse(400, 'Invalid webhook signature');
    }

    // Check if we've already processed this event (idempotency)
    const isProcessed = await checkIfEventProcessed(event.id);
    if (isProcessed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return createSuccessResponse('Event already processed');
    }

    // Process the webhook event
    await webhookHandler.handleWebhook(event);

    // Mark event as processed
    await markEventAsProcessed(event.id, event.type);

    // Track processing time
    const processingTime = Date.now() - startTime;
    AnalyticsService.getInstance().track('webhook_processed', {
      eventType: event.type,
      eventId: event.id,
      processingTime,
      success: true,
    });

    console.log(
      `Successfully processed webhook ${event.type} (${event.id}) in ${processingTime}ms`
    );
    return createSuccessResponse('Webhook processed successfully');
  } catch (error) {
    const processingTime = Date.now() - startTime;

    ErrorHandler.logError(error as Error, {
      context: 'webhook_processing_error',
      processingTime,
      body:
        typeof request.body === 'string' ? request.body.substring(0, 1000) : '[Buffer]',
    });

    AnalyticsService.getInstance().track('webhook_failed', {
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return 500 to trigger Stripe's retry mechanism
    return createErrorResponse(500, 'Webhook processing failed');
  }
}

/**
 * Check if a webhook event has already been processed
 */
async function checkIfEventProcessed(eventId: string): Promise<boolean> {
  try {
    const { supabase } = await import('../services/supabase');
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('stripeEventId', eventId)
      .eq('status', 'success')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking event processing status:', error);
    return false; // Assume not processed if we can't check
  }
}

/**
 * Mark a webhook event as processed
 */
async function markEventAsProcessed(eventId: string, eventType: string): Promise<void> {
  try {
    const { supabase } = await import('../services/supabase');
    await supabase.from('webhook_logs').upsert({
      stripeEventId: eventId,
      eventType,
      status: 'success',
      processedAt: new Date(),
    });
  } catch (error) {
    console.error('Error marking event as processed:', error);
    // Don't throw here as the main processing was successful
  }
}

/**
 * Create a success response
 */
function createSuccessResponse(message: string): WebhookResponse {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      message,
    }),
  };
}

/**
 * Create an error response
 */
function createErrorResponse(statusCode: number, message: string): WebhookResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: true,
      message,
    }),
  };
}

// Express.js middleware version
export function createExpressWebhookHandler() {
  return async (req: any, res: any
) => {
    try {
      const webhookRequest: WebhookRequest = {
        body: req.body,
        headers: {
          'stripe-signature': req.headers['stripe-signature'],
          'content-type': req.headers['content-type'],
        },
      };

      const response = await handleStripeWebhook(webhookRequest);

      res.status(response.statusCode);
      Object.entries(response.headers).forEach(([key, value]
) => {
        res.set(key, value);
      });
      res.send(response.body);
    } catch (error) {
      console.error('Express webhook handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Vercel/Netlify serverless function version
export function createServerlessWebhookHandler() {
  return async (req: any, res: any
) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const webhookRequest: WebhookRequest = {
        body: req.body,
        headers: {
          'stripe-signature': req.headers['stripe-signature'],
          'content-type': req.headers['content-type'],
        },
      };

      const response = await handleStripeWebhook(webhookRequest);

      res.status(response.statusCode);
      Object.entries(response.headers).forEach(([key, value]
) => {
        res.setHeader(key, value);
      });
      res.end(response.body);
    } catch (error) {
      console.error('Serverless webhook handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Next.js API route version
export function createNextJSWebhookHandler() {
  return async (req: any, res: any
) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).end('Method Not Allowed');
      return;
    }

    try {
      const webhookRequest: WebhookRequest = {
        body: req.body,
        headers: {
          'stripe-signature': req.headers['stripe-signature'],
          'content-type': req.headers['content-type'],
        },
      };

      const response = await handleStripeWebhook(webhookRequest);

      res.status(response.statusCode);
      Object.entries(response.headers).forEach(([key, value]
) => {
        res.setHeader(key, value);
      });
      res.end(response.body);
    } catch (error) {
      console.error('Next.js webhook handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Health check endpoint for webhook endpoint
export async function handleHealthCheck(): Promise<WebhookResponse> {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'stripe-webhook-handler',
    }),
  };
}

export default {
  handleStripeWebhook,
  createExpressWebhookHandler,
  createServerlessWebhookHandler,
  createNextJSWebhookHandler,
  handleHealthCheck,
};
