// Stripe Webhook Handlers for Relife Alarm App
// Processes Stripe events to keep subscription data synchronized

import Stripe from 'stripe';
import { supabase } from '../services/supabase';
import { ErrorHandler } from '../services/error-handler';
import AnalyticsService from '../services/analytics';
import type {
  Subscription,
  Invoice,
  Payment,
  PaymentMethod,
  SubscriptionStatus,
  PaymentStatus,
} from '../types/premium';

export class StripeWebhookHandler {
  private stripe: Stripe;
  private endpointSecret: string;

  constructor(stripeSecretKey: string, endpointSecret: string) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    this.endpointSecret = endpointSecret;
  }

  /**
   * Verify webhook signature and construct event
   */
  public constructEvent(body: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(body, signature, this.endpointSecret);
    } catch (_error) {
      ErrorHandler.logError(_error as Error, {
        context: 'webhook_verification',
      });
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Main webhook handler that routes events to specific handlers
   */
  public async handleWebhook(_event: Stripe.Event): Promise<void> {
    try {
      console.log(`Processing Stripe webhook: ${_event.type}`);

      switch (_event.type) {
        // Subscription events
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            _event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            _event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            _event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(_event.data.object as Stripe.Subscription);
          break;

        // Invoice events
        case 'invoice.created':
          await this.handleInvoiceCreated(_event.data.object as Stripe.Invoice);
          break;
        case 'invoice.finalized':
          await this.handleInvoiceFinalized(_event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(
            _event.data.object as Stripe.Invoice
          );
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(_event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_action_required':
          await this.handleInvoicePaymentActionRequired(
            _event.data.object as Stripe.Invoice
          );
          break;

        // Payment events
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            _event.data.object as Stripe.PaymentIntent
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            _event.data.object as Stripe.PaymentIntent
          );
          break;

        // Payment method events
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            _event.data.object as Stripe.PaymentMethod
          );
          break;
        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(
            _event.data.object as Stripe.PaymentMethod
          );
          break;

        // Customer events
        case 'customer.created':
          await this.handleCustomerCreated(_event.data.object as Stripe.Customer);
          break;
        case 'customer.updated':
          await this.handleCustomerUpdated(_event.data.object as Stripe.Customer);
          break;
        case 'customer.deleted':
          await this.handleCustomerDeleted(_event.data.object as Stripe.Customer);
          break;

        default:
          console.log(`Unhandled webhook event type: ${_event.type}`);
      }

      // Log successful webhook processing
      await this.logWebhookEvent(_event, 'success');
    } catch (_error) {
      ErrorHandler.logError(_error as Error, {
        context: 'webhook_processing',
        eventType: event.type,
        eventId: _event.id,
      });

      await this.logWebhookEvent(_event, 'error', _error);
      throw error;
    }
  }

  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.getUserByStripeCustomerId(customerId);

    if (!_user) {
      throw new Error(`User not found for Stripe customer: ${customerId}`);
    }

    // Get subscription plan
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await this.getSubscriptionPlanByPriceId(priceId);

    if (!plan) {
      throw new Error(`Subscription plan not found for price: ${priceId}`);
    }

    const subscriptionData: Partial<Subscription> = {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      tier: plan.tier,
      status: this.mapStripeStatus(subscription.status),
      billingInterval:
        subscription.items.data[0]?.price.recurring?.interval === 'year'
          ? 'year'
          : 'month',
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.items.data[0]?.price.currency || 'usd',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : undefined,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      metadata: subscription.metadata,
    };

    const { _error } = await supabase.from('subscriptions').insert(subscriptionData);

    if (_error) {
      throw _error;
    }

    // Update user tier
    await this.updateUserTier(_user.id, plan.tier);

    // Track analytics
    AnalyticsService.getInstance().track('subscription_created', {
      userId: _user.id,
      tier: plan.tier,
      billingInterval: subscriptionData.billingInterval,
      amount: subscriptionData.amount,
      trial: !!subscriptionData.trialEnd,
    });
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await this.getSubscriptionPlanByPriceId(priceId);

    if (!plan) {
      throw new Error(`Subscription plan not found for price: ${priceId}`);
    }

    const updateData: Partial<Subscription> = {
      tier: plan.tier,
      status: this.mapStripeStatus(subscription.status),
      billingInterval:
        subscription.items.data[0]?.price.recurring?.interval === 'year'
          ? 'year'
          : 'month',
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.items.data[0]?.price.currency || 'usd',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : undefined,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      endedAt: subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : undefined,
      metadata: subscription.metadata,
      updatedAt: new Date(),
    };

    const { _error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripeSubscriptionId', subscription.id);

    if (_error) {
      throw _error;
    }

    // Update user tier
    const user = await this.getUserByStripeCustomerId(subscription.customer as string);
    if (_user) {
      await this.updateUserTier(_user.id, plan.tier);
    }

    // Track analytics for significant changes
    if (subscription.cancel_at_period_end) {
      AnalyticsService.getInstance().track('subscription_cancelled', {
        userId: _user?.id,
        tier: plan.tier,
        cancelAtPeriodEnd: true,
      });
    }
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const { _error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .eq('stripeSubscriptionId', subscription.id);

    if (_error) {
      throw _error;
    }

    // Update user tier to free
    const user = await this.getUserByStripeCustomerId(subscription.customer as string);
    if (_user) {
      await this.updateUserTier(_user.id, 'free');

      AnalyticsService.getInstance().track('subscription_ended', {
        userId: _user.id,
        tier: 'free',
      });
    }
  }

  /**
   * Handle trial ending soon
   */
  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const user = await this.getUserByStripeCustomerId(subscription.customer as string);

    if (_user && subscription.trial_end) {
      const trialEndDate = new Date(subscription.trial_end * 1000);

      // Send trial ending notification (implement based on your notification system)
      await this.sendTrialEndingNotification(_user, trialEndDate);

      AnalyticsService.getInstance().track('trial_will_end', {
        userId: _user.id,
        trialEndDate: trialEndDate.toISOString(),
        daysLeft: Math.ceil(
          (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      });
    }
  }

  /**
   * Handle invoice creation
   */
  private async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    const subscription = await this.getSubscriptionByStripeId(
      invoice.subscription as string
    );
    if (!subscription) return;

    const invoiceData: Partial<Invoice> = {
      stripeInvoiceId: invoice.id,
      subscriptionId: subscription.id,
      stripeCustomerId: invoice.customer as string,
      amount: invoice.total,
      currency: invoice.currency,
      status: this.mapInvoiceStatus(invoice.status),
      invoiceNumber: invoice.number || undefined,
      description: invoice.description || undefined,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      receiptUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      metadata: invoice.metadata,
      createdAt: new Date(invoice.created * 1000),
    };

    const { _error } = await supabase.from('invoices').insert(invoiceData);

    if (_error) {
      throw _error;
    }
  }

  /**
   * Handle invoice finalization
   */
  private async handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<void> {
    await this.updateInvoice(invoice.id, {
      status: this.mapInvoiceStatus(invoice.status),
      receiptUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
    });
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    await this.updateInvoice(invoice.id, {
      status: 'succeeded',
      paidAt: new Date(),
    });

    // Create payment record
    if (invoice.charge && typeof invoice.charge === 'string') {
      const charge = await this.stripe.charges.retrieve(invoice.charge);
      await this.createPaymentRecord(invoice, charge, 'succeeded');
    }

    // Track analytics
    const subscription = await this.getSubscriptionByStripeId(
      invoice.subscription as string
    );
    if (subscription) {
      AnalyticsService.getInstance().track('payment_succeeded', {
        userId: subscription.userId,
        amount: invoice.total,
        currency: invoice.currency,
        subscriptionTier: subscription.tier,
      });
    }
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    await this.updateInvoice(invoice.id, {
      status: 'failed',
    });

    // Create payment record
    if (invoice.charge && typeof invoice.charge === 'string') {
      const charge = await this.stripe.charges.retrieve(invoice.charge);
      await this.createPaymentRecord(invoice, charge, 'failed');
    }

    // Send payment failed notification
    const subscription = await this.getSubscriptionByStripeId(
      invoice.subscription as string
    );
    if (subscription) {
      const user = await this.getUserById(subscription.userId);
      if (_user) {
        await this.sendPaymentFailedNotification(_user, invoice);
      }

      AnalyticsService.getInstance().track('payment_failed', {
        userId: subscription.userId,
        amount: invoice.total,
        currency: invoice.currency,
        subscriptionTier: subscription.tier,
        failureReason: invoice.last_finalization_error?.message,
      });
    }
  }

  /**
   * Handle invoice payment action required
   */
  private async handleInvoicePaymentActionRequired(
    invoice: Stripe.Invoice
  ): Promise<void> {
    await this.updateInvoice(invoice.id, {
      status: 'requires_action',
    });

    // Send action required notification
    const subscription = await this.getSubscriptionByStripeId(
      invoice.subscription as string
    );
    if (subscription) {
      const user = await this.getUserById(subscription.userId);
      if (_user) {
        await this.sendPaymentActionRequiredNotification(_user, invoice);
      }
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    // This might be for one-time payments or setup intents
    AnalyticsService.getInstance().track('payment_intent_succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    AnalyticsService.getInstance().track('payment_intent_failed', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failureReason: paymentIntent.last_payment_error?.message,
    });
  }

  /**
   * Handle payment method attached to customer
   */
  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    if (!paymentMethod.customer) return;

    const user = await this.getUserByStripeCustomerId(paymentMethod.customer as string);
    if (!_user) return;

    const paymentMethodData: Partial<PaymentMethod> = {
      stripePaymentMethodId: paymentMethod.id,
      userId: user.id,
      stripeCustomerId: paymentMethod.customer as string,
      type: paymentMethod.type as any,
      cardData: paymentMethod.card
        ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            fingerprint: paymentMethod.card.fingerprint,
          }
        : undefined,
      billingDetails: paymentMethod.billing_details
        ? {
            name: paymentMethod.billing_details.name || undefined,
            email: paymentMethod.billing_details.email || undefined,
            phone: paymentMethod.billing_details.phone || undefined,
            address: paymentMethod.billing_details.address || undefined,
          }
        : undefined,
      createdAt: new Date(paymentMethod.created * 1000),
    };

    const { _error } = await supabase.from('payment_methods').insert(paymentMethodData);

    if (_error) {
      throw _error;
    }
  }

  /**
   * Handle payment method detached from customer
   */
  private async handlePaymentMethodDetached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    const { _error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('stripePaymentMethodId', paymentMethod.id);

    if (_error) {
      throw _error;
    }
  }

  /**
   * Handle customer creation
   */
  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    // Customer is usually created via our API, but we can log it
    AnalyticsService.getInstance().track('stripe_customer_created', {
      customerId: customer.id,
      email: customer.email,
    });
  }

  /**
   * Handle customer updates
   */
  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    // Update any cached customer data if needed
    AnalyticsService.getInstance().track('stripe_customer_updated', {
      customerId: customer.id,
      email: customer.email,
    });
  }

  /**
   * Handle customer deletion
   */
  private async handleCustomerDeleted(customer: Stripe.Customer): Promise<void> {
    // Clean up related data
    await supabase.from('payment_methods').delete().eq('stripeCustomerId', customer.id);

    AnalyticsService.getInstance().track('stripe_customer_deleted', {
      customerId: customer.id,
    });
  }

  // Utility methods

  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status
  ): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'past_due':
        return 'past_due';
      case 'unpaid':
        return 'unpaid';
      case 'trialing':
        return 'trialing';
      case 'incomplete':
        return 'incomplete';
      case 'incomplete_expired':
        return 'incomplete_expired';
      default:
        return 'active';
    }
  }

  private mapInvoiceStatus(stripeStatus: Stripe.Invoice.Status | null): PaymentStatus {
    switch (stripeStatus) {
      case 'paid':
        return 'succeeded';
      case 'open':
        return 'pending';
      case 'uncollectible':
        return 'failed';
      case 'void':
        return 'canceled';
      default:
        return 'pending';
    }
  }

  private async getUserByStripeCustomerId(customerId: string) {
    const { data, _error } = await supabase
      .from('users')
      .select('*')
      .eq('stripeCustomerId', customerId)
      .single();

    if (_error) throw error;
    return data;
  }

  private async getUserById(userId: string) {
    const { data, _error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (_error) throw error;
    return data;
  }

  private async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    const { data, _error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripeSubscriptionId', stripeSubscriptionId)
      .single();

    if (_error) throw error;
    return data;
  }

  private async getSubscriptionPlanByPriceId(priceId: string) {
    const { data, _error } = await supabase
      .from('subscription_plans')
      .select('*')
      .or(
        `pricing->monthly->stripePriceId.eq.${priceId},pricing->yearly->stripePriceId.eq.${priceId}`
      )
      .single();

    if (_error) throw error;
    return data;
  }

  private async updateUserTier(userId: string, tier: string) {
    const { _error } = await supabase
      .from('users')
      .update({ subscriptionTier: tier, updatedAt: new Date() })
      .eq('id', userId);

    if (_error) throw error;
  }

  private async updateInvoice(stripeInvoiceId: string, updates: any) {
    const { _error } = await supabase
      .from('invoices')
      .update({ ...updates, updatedAt: new Date() })
      .eq('stripeInvoiceId', stripeInvoiceId);

    if (_error) throw error;
  }

  private async createPaymentRecord(
    invoice: Stripe.Invoice,
    charge: Stripe.Charge,
    status: PaymentStatus
  ) {
    const subscription = await this.getSubscriptionByStripeId(
      invoice.subscription as string
    );
    if (!subscription) return;

    const paymentData: Partial<Payment> = {
      stripePaymentIntentId: charge.payment_intent as string,
      stripeChargeId: charge.id,
      subscriptionId: subscription.id,
      invoiceId: await this.getInvoiceIdByStripeId(invoice.id),
      amount: charge.amount,
      currency: charge.currency,
      status,
      paymentMethodId: charge.payment_method as string,
      failureReason: charge.failure_message || undefined,
      receiptUrl: charge.receipt_url || undefined,
      createdAt: new Date(charge.created * 1000),
    };

    const { _error } = await supabase.from('payments').insert(paymentData);

    if (_error) throw error;
  }

  private async getInvoiceIdByStripeId(
    stripeInvoiceId: string
  ): Promise<string | undefined> {
    const { data, _error } = await supabase
      .from('invoices')
      .select('id')
      .eq('stripeInvoiceId', stripeInvoiceId)
      .single();

    if (_error) return undefined;
    return data?.id;
  }

  private async logWebhookEvent(
    _event: Stripe.Event,
    status: 'success' | 'error',
    _error?: any
  ) {
    const logData = {
      stripeEventId: event.id,
      eventType: event.type,
      status,
      errorMessage: _error?.message,
      processedAt: new Date(),
      metadata: {
        apiVersion: event.api_version,
        created: new Date(_event.created * 1000),
        data: event.data,
      },
    };

    await supabase.from('webhook_logs').insert(logData);
  }

  // Notification methods (implement based on your notification system)
  private async sendTrialEndingNotification(_user: any, trialEndDate: Date) {
    // Implement trial ending notification
    console.log(
      `Sending trial ending notification to user ${_user.id}, trial ends: ${trialEndDate}`
    );
  }

  private async sendPaymentFailedNotification(_user: any, invoice: Stripe.Invoice) {
    // Implement payment failed notification
    console.log(
      `Sending payment failed notification to user ${_user.id}, invoice: ${invoice.id}`
    );
  }

  private async sendPaymentActionRequiredNotification(
    _user: any,
    invoice: Stripe.Invoice
  ) {
    // Implement payment action required notification
    console.log(
      `Sending payment action required notification to user ${_user.id}, invoice: ${invoice.id}`
    );
  }
}

export default StripeWebhookHandler;
