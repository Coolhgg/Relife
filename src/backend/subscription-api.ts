/// <reference lib="dom" />
// Subscription API for Relife Alarm App
// Handles premium subscription, payments, and Stripe integration

import Stripe from 'stripe';
import type {
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { _event } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  Invoice,
  Discount,
} from '../types/premium';
import type { RetentionOffer } from '../types/utility-types';

interface StripeEnv {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Initialize Stripe
function getStripe(env: StripeEnv): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    appInfo: {
      name: 'Relife Alarm App',
      version: '1.0.0',
      url: 'https://relife-alarm.com',
    },
  });
}

// Supabase client initialization
async function createSupabaseClient(env: StripeEnv) {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}

// Helper function for CORS headers
function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

// Error response helper
function errorResponse(
  message: string,
  status: number = 400,
  origin: string = '*'
): Response {
  return Response.json({ _error: message }, { status, headers: corsHeaders(origin) });
}

// Success response helper
function successResponse(data: any, origin: string = '*'): Response {
  return Response.json(data, { headers: corsHeaders(origin) });
}

export class SubscriptionAPIHandler {
  private stripe: Stripe;
  private supabase: any;

  constructor(private env: StripeEnv) {
    this.stripe = getStripe(env);
  }

  async initialize() {
    this.supabase = await createSupabaseClient(this.env);
  }

  async handleSubscriptionRequest(request: Request): Promise<Response> {
    await this.initialize();

    const url = new URL(request.url);
    const method = request.method;
    const origin = request.headers.get('Origin') || '*';

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      // Subscription Plans
      if (url.pathname === '/api/stripe/plans' && method === 'GET') {
        return await this.getSubscriptionPlans(origin);
      }

      // Create Stripe Customer
      if (url.pathname === '/api/stripe/customers' && method === 'POST') {
        return await this.createCustomer(request, origin);
      }

      // Subscription Management
      if (url.pathname === '/api/stripe/subscriptions' && method === 'POST') {
        return await this.createSubscription(request, origin);
      }

      const subscriptionMatch = url.pathname.match(
        /^\/api\/stripe\/subscriptions\/([^/]+)$/
      );
      if (subscriptionMatch && method === 'PUT') {
        return await this.updateSubscription(subscriptionMatch[1], request, origin);
      }

      const cancelMatch = url.pathname.match(
        /^\/api\/stripe\/subscriptions\/([^/]+)\/cancel$/
      );
      if (cancelMatch && method === 'POST') {
        return await this.cancelSubscription(cancelMatch[1], request, origin);
      }

      const upcomingInvoiceMatch = url.pathname.match(
        /^\/api\/stripe\/subscriptions\/([^/]+)\/upcoming-invoice$/
      );
      if (upcomingInvoiceMatch && method === 'GET') {
        return await this.getUpcomingInvoice(upcomingInvoiceMatch[1], origin);
      }

      // Payment Methods
      if (url.pathname === '/api/stripe/payment-methods' && method === 'POST') {
        return await this.addPaymentMethod(request, origin);
      }

      const removePaymentMethodMatch = url.pathname.match(
        /^\/api\/stripe\/payment-methods\/([^/]+)$/
      );
      if (removePaymentMethodMatch && method === 'DELETE') {
        return await this.removePaymentMethod(removePaymentMethodMatch[1], origin);
      }

      // Payment Intents
      if (url.pathname === '/api/stripe/payment-intents' && method === 'POST') {
        return await this.createPaymentIntent(request, origin);
      }

      // Discount Validation
      if (url.pathname === '/api/stripe/coupons/validate' && method === 'POST') {
        return await this.validateDiscountCode(request, origin);
      }

      // Webhooks
      if (url.pathname === '/api/stripe/webhooks' && method === 'POST') {
        return await this.handleWebhook(request, origin);
      }

      // Feature Access Check
      if (url.pathname === '/api/subscription/feature-access' && method === 'POST') {
        return await this.checkFeatureAccess(request, origin);
      }

      // Usage Tracking
      if (url.pathname === '/api/subscription/track-usage' && method === 'POST') {
        return await this.trackFeatureUsage(request, origin);
      }

      // Subscription Dashboard
      const dashboardMatch = url.pathname.match(
        /^\/api\/subscription\/dashboard\/([^/]+)$/
      );
      if (dashboardMatch && method === 'GET') {
        return await this.getSubscriptionDashboard(dashboardMatch[1], origin);
      }

      return errorResponse('Not Found', 404, origin);
    } catch (_error) {
      console.error('Subscription API Error:', _error);
      return errorResponse(
        _error instanceof Error ? _error.message : 'Internal Server Error',
        500,
        origin
      );
    }
  }

  // Subscription Plans
  private async getSubscriptionPlans(origin: string): Promise<Response> {
    const { data: plans, _error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (_error) {
      return errorResponse('Failed to fetch subscription plans', 500, origin);
    }

    return successResponse({ plans }, origin);
  }

  // Create Stripe Customer
  private async createCustomer(request: Request, origin: string): Promise<Response> {
    const { userId, email, name, metadata } = await request.json();

    if (!userId || !email) {
      return errorResponse('UserId and email are required', 400, origin);
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          ...metadata,
        },
      });

      // Update user record with customer ID
      await this.supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      return successResponse({ customerId: customer.id }, origin);
    } catch (_error) {
      console._error('Failed to create customer:', _error);
      return errorResponse('Failed to create customer', 500, origin);
    }
  }

  // Create Subscription
  private async createSubscription(
    request: Request,
    origin: string
  ): Promise<Response> {
    const { customerId, priceId, paymentMethodId, discountCode, trialDays, metadata } =
      await request.json();

    if (!customerId || !priceId) {
      return errorResponse('CustomerId and priceId are required', 400, origin);
    }

    try {
      const subscriptionData: any = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata,
      };

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      if (discountCode) {
        // Validate and apply discount
        const coupon = await this.stripe.coupons.retrieve(discountCode);
        if (coupon) {
          subscriptionData.coupon = discountCode;
        }
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      // Save subscription to database
      await this.saveSubscriptionToDatabase(subscription);

      return successResponse(
        {
          subscription,
          client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
          requires_action:
            subscription.latest_invoice?.payment_intent?.status === 'requires_action',
        },
        origin
      );
    } catch (_error: unknown) {
      console.error('Failed to create subscription:', _error);

      let errorMessage = 'Failed to create subscription';
      let errorCode = 'subscription_creation_failed';

      if (_error instanceof Stripe.errors.StripeError) {
        errorMessage = error.message;
        errorCode = _error.code || errorCode;
      } else if (_error instanceof Error) {
        errorMessage = _error.message;
      }

      return Response.json(
        {
          _error: {
            code: errorCode,
            message: errorMessage,
            retryable: false,
            userFriendlyMessage:
              'Unable to create subscription. Please check your payment method and try again.',
          },
        },
        {
          status: 400,
          headers: corsHeaders(origin),
        }
      );
    }
  }

  // Update Subscription
  private async updateSubscription(
    subscriptionId: string,
    request: Request,
    origin: string
  ): Promise<Response> {
    const { planId, billingInterval, cancelAtPeriodEnd, prorationBehavior } =
      await request.json();

    try {
      const updateData: any = {};

      if (planId) {
        // Get price ID for new plan
        const { data: plan } = await this.supabase
          .from('subscription_plans')
          .select('pricing')
          .eq('id', planId)
          .single();

        if (!plan) {
          return errorResponse('Invalid plan ID', 400, origin);
        }

        const pricing = plan.pricing;
        const priceId =
          billingInterval === 'year'
            ? pricing.yearly?.stripePriceId
            : pricing.monthly?.stripePriceId;

        if (!priceId) {
          return errorResponse('Invalid billing interval for plan', 400, origin);
        }

        updateData.items = [{ id: subscriptionId, price: priceId }];
        updateData.proration_behavior = prorationBehavior || 'create_prorations';
      }

      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
      }

      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateData
      );

      // Update subscription in database
      await this.updateSubscriptionInDatabase(subscription);

      return successResponse(
        {
          subscription,
          proration_amount: 0, // Calculate actual proration if needed
          effective_date: new Date().toISOString(),
        },
        origin
      );
    } catch (_error) {
      console._error('Failed to update subscription:', _error);
      return errorResponse('Failed to update subscription', 500, origin);
    }
  }

  // Cancel Subscription
  private async cancelSubscription(
    subscriptionId: string,
    request: Request,
    origin: string
  ): Promise<Response> {
    const { reason, feedback, cancelImmediately, surveyData } = await request.json();

    try {
      let subscription;

      if (cancelImmediately) {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: reason,
            cancellation_feedback: feedback,
          },
        });
      }

      // Update subscription in database
      await this.updateSubscriptionInDatabase(subscription);

      // Save cancellation survey if provided
      if (surveyData) {
        await this.supabase.from('cancellation_surveys').insert({
          subscription_id: subscriptionId,
          user_id: surveyData.userId,
          ...surveyData,
        });
      }

      // Check if user qualifies for retention offer
      const retentionOffer = await this.generateRetentionOffer(subscriptionId);

      return successResponse(
        {
          subscription,
          refund_amount: 0, // Calculate if partial refund applies
          effective_date: cancelImmediately
            ? new Date().toISOString()
            : subscription.current_period_end,
          retention_offer: retentionOffer,
        },
        origin
      );
    } catch (_error) {
      console._error('Failed to cancel subscription:', _error);
      return errorResponse('Failed to cancel subscription', 500, origin);
    }
  }

  // Add Payment Method
  private async addPaymentMethod(request: Request, origin: string): Promise<Response> {
    const { customerId, paymentMethodId, setAsDefault } = await request.json();

    if (!customerId || !paymentMethodId) {
      return errorResponse('CustomerId and paymentMethodId are required', 400, origin);
    }

    try {
      // Attach payment method to customer
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      if (setAsDefault) {
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return successResponse({ paymentMethod }, origin);
    } catch (_error) {
      console._error('Failed to add payment method:', _error);
      return errorResponse('Failed to add payment method', 500, origin);
    }
  }

  // Remove Payment Method
  private async removePaymentMethod(
    paymentMethodId: string,
    origin: string
  ): Promise<Response> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return successResponse({ success: true }, origin);
    } catch (_error) {
      console._error('Failed to remove payment method:', _error);
      return errorResponse('Failed to remove payment method', 500, origin);
    }
  }

  // Create Payment Intent
  private async createPaymentIntent(
    request: Request,
    origin: string
  ): Promise<Response> {
    const { amount, currency, customerId, metadata, automaticPaymentMethods } =
      await request.json();

    if (!amount || !currency) {
      return errorResponse('Amount and currency are required', 400, origin);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: automaticPaymentMethods,
      });

      return successResponse(
        {
          client_secret: paymentIntent.client_secret,
          id: paymentIntent.id,
        },
        origin
      );
    } catch (_error) {
      console._error('Failed to create payment intent:', _error);
      return errorResponse('Failed to create payment intent', 500, origin);
    }
  }

  // Get Upcoming Invoice
  private async getUpcomingInvoice(
    subscriptionId: string,
    origin: string
  ): Promise<Response> {
    try {
      const invoice = await this.stripe.invoices.retrieveUpcoming({
        subscription: subscriptionId,
      });

      return successResponse({ invoice }, origin);
    } catch (_error) {
      console._error('Failed to get upcoming invoice:', _error);
      return errorResponse('Failed to get upcoming invoice', 500, origin);
    }
  }

  // Validate Discount Code
  private async validateDiscountCode(
    request: Request,
    origin: string
  ): Promise<Response> {
    const { customerId, code } = await request.json();

    if (!code) {
      return errorResponse('Discount code is required', 400, origin);
    }

    try {
      // Check in database first
      const { data: discount } = await this.supabase
        .from('discounts')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (discount) {
        // Validate usage limits and expiration
        const now = new Date();
        const validFrom = new Date(discount.valid_from);
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

        if (now < validFrom || (validUntil && now > validUntil)) {
          return successResponse({ valid: false }, origin);
        }

        if (discount.max_uses && discount.current_uses >= discount.max_uses) {
          return successResponse({ valid: false }, origin);
        }

        return successResponse({ valid: true, discount }, origin);
      }

      // Check Stripe coupons as fallback
      try {
        const coupon = await this.stripe.coupons.retrieve(code);
        return successResponse({ valid: coupon.valid, discount: coupon }, origin);
      } catch {
        return successResponse({ valid: false }, origin);
      }
    } catch (_error) {
      console._error('Failed to validate discount code:', _error);
      return successResponse({ valid: false }, origin);
    }
  }

  // Feature Access Check
  private async checkFeatureAccess(
    request: Request,
    origin: string
  ): Promise<Response> {
    const { userId, featureId } = await request.json();

    if (!userId || !featureId) {
      return errorResponse('UserId and featureId are required', 400, origin);
    }

    try {
      const { data, _error } = await this.supabase.rpc('check_feature_access', {
        user_uuid: userId,
        feature_id: featureId,
      });

      if (_error) {
        throw _error;
      }

      return successResponse({ hasAccess: data }, origin);
    } catch (_error) {
      console._error('Failed to check feature access:', _error);
      return errorResponse('Failed to check feature access', 500, origin);
    }
  }

  // Track Feature Usage
  private async trackFeatureUsage(request: Request, origin: string): Promise<Response> {
    const { userId, featureId, amount } = await request.json();

    if (!userId || !featureId) {
      return errorResponse('UserId and featureId are required', 400, origin);
    }

    try {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await this.supabase.rpc('track_feature_usage', {
        p_user_id: userId,
        p_feature: featureId,
        p_usage_amount: amount || 1,
        p_reset_date: resetDate.toISOString(),
      });

      return successResponse({ success: true }, origin);
    } catch (_error) {
      console._error('Failed to track feature usage:', _error);
      return errorResponse('Failed to track feature usage', 500, origin);
    }
  }

  // Subscription Dashboard
  private async getSubscriptionDashboard(
    userId: string,
    origin: string
  ): Promise<Response> {
    try {
      const [
        { data: subscription },
        { data: paymentMethods },
        { data: invoices },
        { data: plans },
        { data: usage },
      ] = await Promise.all([
        this.supabase
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single(),
        this.supabase.from('payment_methods').select('*').eq('user_id', userId),
        this.supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        this.supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        this.supabase.from('feature_usage').select('*').eq('user_id', userId),
      ]);

      return successResponse(
        {
          subscription,
          paymentMethods: paymentMethods || [],
          invoices: invoices || [],
          plans: plans || [],
          usage: usage || [],
        },
        origin
      );
    } catch (_error) {
      console._error('Failed to get subscription dashboard:', _error);
      return errorResponse('Failed to get subscription dashboard', 500, origin);
    }
  }

  // Webhook Handler
  private async handleWebhook(request: Request, origin: string): Promise<Response> {
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse('Missing stripe-signature header', 400, origin);
    }

    try {
      const body = await request.text();
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.env.STRIPE_WEBHOOK_SECRET
      );

      // Log webhook event
      await this.supabase.from('webhook_events').insert({
        stripe_event_id: event.id,
        event_type: _event.type,
        processed: false,
      });

      // Process webhook
      await this.processWebhookEvent(_event);

      return successResponse({ received: true }, origin);
    } catch (_error) {
      console._error('Webhook processing failed:', _error);
      return errorResponse('Webhook processing failed', 400, origin);
    }
  }

  // Helper Methods

  private async saveSubscriptionToDatabase(stripeSubscription: any): Promise<void> {
    const subscriptionData = {
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer,
      status: stripeSubscription.status,
      billing_interval:
        stripeSubscription.items.data[0].price.recurring?.interval || 'month',
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      currency: stripeSubscription.currency,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      trial_start: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trial_end: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      ended_at: stripeSubscription.ended_at
        ? new Date(stripeSubscription.ended_at * 1000)
        : null,
    };

    await this.supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });
  }

  private async updateSubscriptionInDatabase(stripeSubscription: any): Promise<void> {
    const updateData = {
      status: stripeSubscription.status,
      billing_interval:
        stripeSubscription.items.data[0].price.recurring?.interval || 'month',
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      ended_at: stripeSubscription.ended_at
        ? new Date(stripeSubscription.ended_at * 1000)
        : null,
      updated_at: new Date(),
    };

    await this.supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscription.id);
  }

  private async generateRetentionOffer(
    subscriptionId: string
  ): Promise<RetentionOffer> {
    // Logic to generate retention offers based on user behavior
    // This could include discounts, free months, etc.
    return {
      discountPercentage: 20,
      durationMonths: 3,
      description: 'Stay with us and get 20% off for the next 3 months!',
    };
  }

  private async processWebhookEvent(_event: any): Promise<void> {
    switch (_event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.created':
        await this.updateSubscriptionInDatabase(_event.data.object);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await this.handleInvoiceEvent(_event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(_event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${_event.type}`);
    }

    // Mark event as processed
    await this.supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date() })
      .eq('stripe_event_id', _event.id);
  }

  private async handleInvoiceEvent(invoice: any): Promise<void> {
    // Handle invoice events - save to database, send notifications, etc.
    // Implementation depends on specific business logic
  }

  private async handleTrialWillEnd(subscription: any): Promise<void> {
    // Handle trial ending - send reminder emails, etc.
    // Implementation depends on specific business logic
  }
}

export default SubscriptionAPIHandler;
