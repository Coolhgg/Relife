// Enhanced Webhook Handler for Express Server
import { Request, Response } from 'express';
import Stripe from 'stripe';

interface WebhookConfig {
  stripeSecretKey: string;
  webhookSecret: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export class WebhookProcessor {
  private stripe: Stripe;
  private webhookSecret: string;
  private supabase: any;

  constructor(private config: WebhookConfig) {
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    this.webhookSecret = config.webhookSecret;
  }

  async initialize() {
    // Initialize Supabase client if needed
    if (!this.supabase && this.config.supabaseUrl && this.config.supabaseServiceKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
      } catch (error) {
        console.warn('Could not initialize Supabase:', error);
      }
    }
  }

  async processWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      // Construct the event from the raw body
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    try {
      await this.initialize();

      // Log the webhook event
      await this.logWebhookEvent(event);

      // Process the event
      await this.handleEvent(event);

      // Mark as processed
      await this.markEventProcessed(event.id, 'success');

      res.json({ received: true, eventId: event.id });

    } catch (error) {
      console.error('Webhook processing error:', error);

      // Mark as failed
      await this.markEventProcessed(event.id, 'failed', error instanceof Error ? error.message : 'Unknown error');

      res.status(500).json({
        error: 'Webhook processing failed',
        eventId: event.id
      });
    }
  }

  private async handleEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing webhook: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'customer.created':
        await this.handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'setup_intent.succeeded':
        await this.handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription created:', subscription.id);

    if (this.supabase) {
      await this.upsertSubscription(subscription);
      await this.updateUserSubscriptionTier(subscription, 'created');
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription updated:', subscription.id);

    if (this.supabase) {
      await this.upsertSubscription(subscription);
      await this.updateUserSubscriptionTier(subscription, 'updated');
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription deleted:', subscription.id);

    if (this.supabase) {
      await this.markSubscriptionCanceled(subscription);
      await this.updateUserSubscriptionTier(subscription, 'deleted');
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment succeeded:', invoice.id);

    if (this.supabase && invoice.subscription) {
      await this.recordPayment(invoice, 'succeeded');
      // Send success notification if needed
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment failed:', invoice.id);

    if (this.supabase && invoice.subscription) {
      await this.recordPayment(invoice, 'failed');
      // Send failure notification and retry logic
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    console.log('Trial will end:', subscription.id);

    // Send trial ending notification
    if (this.supabase) {
      await this.scheduleTrialEndingNotification(subscription);
    }
  }

  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    console.log('Customer created:', customer.id);

    if (this.supabase && customer.metadata?.userId) {
      await this.linkCustomerToUser(customer);
    }
  }

  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    console.log('Customer updated:', customer.id);

    if (this.supabase) {
      await this.updateCustomerInfo(customer);
    }
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    console.log('Payment method attached:', paymentMethod.id);

    if (this.supabase && paymentMethod.customer) {
      await this.savePaymentMethod(paymentMethod);
    }
  }

  private async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
    console.log('Setup intent succeeded:', setupIntent.id);

    // Handle successful payment method setup
    if (this.supabase && setupIntent.customer && setupIntent.payment_method) {
      await this.confirmPaymentMethodSetup(setupIntent);
    }
  }

  // Database operations
  private async upsertSubscription(subscription: Stripe.Subscription): Promise<void> {
    if (!this.supabase) return;

    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      billing_interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
      updated_at: new Date()
    };

    await this.supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });
  }

  private async updateUserSubscriptionTier(subscription: Stripe.Subscription, action: string): Promise<void> {
    if (!this.supabase) return;

    // Get user ID from customer
    const { data: customer } = await this.supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (!customer) return;

    // Determine new tier based on subscription
    let newTier = 'free';
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      const priceId = subscription.items.data[0]?.price.id;
      newTier = this.mapPriceIdToTier(priceId);
    }

    // Update user subscription tier
    await this.supabase
      .from('users')
      .update({
        subscription_tier: newTier,
        updated_at: new Date()
      })
      .eq('id', customer.id);

    // Log subscription history
    await this.supabase
      .from('subscription_history')
      .insert({
        user_id: customer.id,
        subscription_id: null, // You'd link this properly in production
        action,
        from_tier: customer.subscription_tier,
        to_tier: newTier,
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.currency,
        metadata: { stripe_subscription_id: subscription.id }
      });
  }

  private async markSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  private async recordPayment(invoice: Stripe.Invoice, status: 'succeeded' | 'failed'): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .from('invoices')
      .upsert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        stripe_subscription_id: invoice.subscription as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        payment_status: status,
        invoice_url: invoice.hosted_invoice_url,
        created_at: new Date(invoice.created * 1000),
        updated_at: new Date()
      }, { onConflict: 'stripe_invoice_id' });
  }

  private async logWebhookEvent(event: Stripe.Event): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        created: new Date(event.created * 1000),
        processed: false,
        attempt_count: 1
      });
  }

  private async markEventProcessed(eventId: string, status: 'success' | 'failed', error?: string): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .from('webhook_events')
      .update({
        processed: status === 'success',
        processed_at: new Date(),
        error_message: error || null,
        status
      })
      .eq('stripe_event_id', eventId);
  }

  // Helper methods
  private mapPriceIdToTier(priceId: string): string {
    // Map Stripe price IDs to subscription tiers
    const priceToTierMap: Record<string, string> = {
      'price_basic_monthly': 'basic',
      'price_premium_monthly': 'premium',
      'price_pro_monthly': 'pro',
      'price_enterprise_monthly': 'enterprise',
      // Add more mappings as needed
    };

    return priceToTierMap[priceId] || 'free';
  }

  // Placeholder methods for additional functionality
  private async scheduleTrialEndingNotification(subscription: Stripe.Subscription): Promise<void> {
    // Implement trial ending notification logic
    console.log('Scheduling trial ending notification for:', subscription.id);
  }

  private async linkCustomerToUser(customer: Stripe.Customer): Promise<void> {
    if (!this.supabase || !customer.metadata?.userId) return;

    await this.supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', customer.metadata.userId);
  }

  private async updateCustomerInfo(customer: Stripe.Customer): Promise<void> {
    // Update customer information in database
    console.log('Updating customer info for:', customer.id);
  }

  private async savePaymentMethod(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    if (!this.supabase) return;

    const card = paymentMethod.card;
    if (card) {
      await this.supabase
        .from('payment_methods')
        .upsert({
          stripe_payment_method_id: paymentMethod.id,
          user_id: null, // You'd need to map this from customer
          type: 'card',
          last4: card.last4,
          brand: card.brand,
          expiry_month: card.exp_month,
          expiry_year: card.exp_year,
          created_at: new Date()
        }, { onConflict: 'stripe_payment_method_id' });
    }
  }

  private async confirmPaymentMethodSetup(setupIntent: Stripe.SetupIntent): Promise<void> {
    // Handle successful payment method setup
    console.log('Payment method setup confirmed:', setupIntent.id);
  }
}

export default WebhookProcessor;