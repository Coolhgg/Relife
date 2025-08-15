// Stripe Payment Processing Service for Relife Alarm App
// Handles subscriptions, payments, invoices, and customer management

import { Stripe } from '@stripe/stripe-js';
import type {
  Subscription,
  SubscriptionPlan,
  PaymentMethod,
  Invoice,
  Payment,
  Refund,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  SubscriptionError,
  StripeConfig
} from '../types/premium';
import { supabase } from './supabase';
import { ErrorHandler } from './error-handler';
import AnalyticsService from './analytics';

class StripeService {
  private static instance: StripeService;
  private stripe: Stripe | null = null;
  private isInitialized = false;
  private config: StripeConfig | null = null;

  private constructor() {}

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Initialize Stripe with configuration
   */
  public async initialize(config: StripeConfig): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const { loadStripe } = await import('@stripe/stripe-js');
        this.stripe = await loadStripe(config.publishableKey, {
          apiVersion: config.apiVersion as any,
          appInfo: config.appInfo
        });
      }
      
      this.config = config;
      this.isInitialized = true;
      
      console.log('Stripe service initialized successfully');
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to initialize Stripe service',
        { context: 'stripe_initialization' }
      );
      throw error;
    }
  }

  /**
   * Check if Stripe is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.stripe) {
      throw new Error('Stripe service not initialized. Call initialize() first.');
    }
  }

  /**
   * Create Stripe customer
   */
  public async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const response = await fetch('/api/stripe/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          name,
          metadata: {
            userId,
            source: 'relife_alarm_app'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.statusText}`);
      }

      const data = await response.json();
      return data.customerId;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to create Stripe customer',
        { context: 'create_customer', metadata: { userId, email } }
      );
      throw error;
    }
  }

  /**
   * Create subscription
   */
  public async createSubscription(
    userId: string,
    request: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> {
    this.ensureInitialized();

    try {
      const analytics = AnalyticsService.getInstance();
      const startTime = performance.now();

      // First, ensure user has a Stripe customer ID
      let stripeCustomerId = await this.getOrCreateCustomerId(userId);

      const response = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: stripeCustomerId,
          priceId: await this.getPriceIdForPlan(request.planId, request.billingInterval),
          paymentMethodId: request.paymentMethodId,
          discountCode: request.discountCode,
          trialDays: request.trialDays,
          metadata: {
            userId,
            planId: request.planId,
            billingInterval: request.billingInterval
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const error: SubscriptionError = {
          code: data.error?.code || 'subscription_creation_failed',
          message: data.error?.message || 'Failed to create subscription',
          details: data.error?.details,
          retryable: data.error?.retryable || false,
          userFriendlyMessage: data.error?.userFriendlyMessage || 'Unable to create subscription. Please try again.'
        };

        analytics.trackError(new Error(error.message), 'subscription_creation_failed', {
          userId,
          planId: request.planId,
          errorCode: error.code
        });

        return { subscription: null as any, requiresAction: false, error };
      }

      // Save subscription to our database
      const subscription = await this.saveSubscriptionToDatabase(userId, data.subscription);

      const duration = performance.now() - startTime;
      analytics.trackFeatureUsage('subscription_created', duration, {
        userId,
        planId: request.planId,
        tier: subscription.tier,
        amount: subscription.amount
      });

      return {
        subscription,
        clientSecret: data.client_secret,
        requiresAction: data.requires_action || false
      };

    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        'subscription_creation_error',
        { userId, planId: request.planId }
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to create subscription',
        { context: 'create_subscription', metadata: { userId, request } }
      );

      const subscriptionError: SubscriptionError = {
        code: 'subscription_creation_failed',
        message: error instanceof Error ? error.message : String(error),
        retryable: true,
        userFriendlyMessage: 'Unable to create subscription. Please check your payment method and try again.'
      };

      return { subscription: null as any, requiresAction: false, error: subscriptionError };
    }
  }

  /**
   * Update subscription
   */
  public async updateSubscription(
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<UpdateSubscriptionResponse> {
    try {
      const analytics = AnalyticsService.getInstance();
      
      const response = await fetch(`/api/stripe/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        const error: SubscriptionError = {
          code: data.error?.code || 'subscription_update_failed',
          message: data.error?.message || 'Failed to update subscription',
          details: data.error?.details,
          retryable: data.error?.retryable || false,
          userFriendlyMessage: data.error?.userFriendlyMessage || 'Unable to update subscription. Please try again.'
        };

        return { subscription: null as any, effectiveDate: new Date(), error };
      }

      // Update subscription in our database
      const subscription = await this.updateSubscriptionInDatabase(data.subscription);

      analytics.trackFeatureUsage('subscription_updated', undefined, {
        subscriptionId,
        changeType: request.planId ? 'plan_change' : 'billing_change'
      });

      return {
        subscription,
        prorationAmount: data.proration_amount,
        effectiveDate: new Date(data.effective_date)
      };

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to update subscription',
        { context: 'update_subscription', metadata: { subscriptionId, request } }
      );

      const subscriptionError: SubscriptionError = {
        code: 'subscription_update_failed',
        message: error instanceof Error ? error.message : String(error),
        retryable: true,
        userFriendlyMessage: 'Unable to update subscription. Please try again.'
      };

      return { subscription: null as any, effectiveDate: new Date(), error: subscriptionError };
    }
  }

  /**
   * Cancel subscription
   */
  public async cancelSubscription(
    subscriptionId: string,
    request: CancelSubscriptionRequest
  ): Promise<CancelSubscriptionResponse> {
    try {
      const analytics = AnalyticsService.getInstance();
      
      const response = await fetch(`/api/stripe/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        const error: SubscriptionError = {
          code: data.error?.code || 'subscription_cancel_failed',
          message: data.error?.message || 'Failed to cancel subscription',
          details: data.error?.details,
          retryable: data.error?.retryable || false,
          userFriendlyMessage: data.error?.userFriendlyMessage || 'Unable to cancel subscription. Please contact support.'
        };

        return { subscription: null as any, effectiveDate: new Date(), error };
      }

      // Update subscription in our database
      const subscription = await this.updateSubscriptionInDatabase(data.subscription);

      // Save cancellation survey if provided
      if (request.surveyData && subscription.userId) {
        await this.saveCancellationSurvey(subscription.userId, subscriptionId, request.surveyData);
      }

      analytics.trackFeatureUsage('subscription_canceled', undefined, {
        subscriptionId,
        reason: request.reason,
        immediate: request.cancelImmediately
      });

      return {
        subscription,
        refundAmount: data.refund_amount,
        effectiveDate: new Date(data.effective_date),
        retentionOffer: data.retention_offer
      };

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to cancel subscription',
        { context: 'cancel_subscription', metadata: { subscriptionId, request } }
      );

      const subscriptionError: SubscriptionError = {
        code: 'subscription_cancel_failed',
        message: error instanceof Error ? error.message : String(error),
        retryable: true,
        userFriendlyMessage: 'Unable to cancel subscription. Please contact support.'
      };

      return { subscription: null as any, effectiveDate: new Date(), error: subscriptionError };
    }
  }

  /**
   * Add payment method
   */
  public async addPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentMethod> {
    this.ensureInitialized();

    try {
      const customerId = await this.getOrCreateCustomerId(userId);

      const response = await fetch('/api/stripe/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          paymentMethodId,
          setAsDefault: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add payment method: ${response.statusText}`);
      }

      const data = await response.json();
      return await this.savePaymentMethodToDatabase(userId, data.paymentMethod);

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to add payment method',
        { context: 'add_payment_method', metadata: { userId, paymentMethodId } }
      );
      throw error;
    }
  }

  /**
   * Remove payment method
   */
  public async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const response = await fetch(`/api/stripe/payment-methods/${paymentMethodId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to remove payment method: ${response.statusText}`);
      }

      // Remove from our database
      await supabase
        .from('payment_methods')
        .delete()
        .eq('stripe_payment_method_id', paymentMethodId);

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to remove payment method',
        { context: 'remove_payment_method', metadata: { paymentMethodId } }
      );
      throw error;
    }
  }

  /**
   * Get payment methods for user
   */
  public async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(this.mapDatabasePaymentMethod) || [];

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get payment methods',
        { context: 'get_payment_methods', metadata: { userId } }
      );
      return [];
    }
  }

  /**
   * Create payment intent for one-time payments
   */
  public async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: Record<string, any>
  ): Promise<{clientSecret: string, id: string}> {
    this.ensureInitialized();

    try {
      const response = await fetch('/api/stripe/payment-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          customerId,
          metadata,
          automaticPaymentMethods: {
            enabled: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment intent: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        clientSecret: data.client_secret,
        id: data.id
      };

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to create payment intent',
        { context: 'create_payment_intent', metadata: { amount, currency, customerId } }
      );
      throw error;
    }
  }

  /**
   * Confirm payment
   */
  public async confirmPayment(clientSecret: string, paymentMethod?: any): Promise<any> {
    this.ensureInitialized();

    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const result = await this.stripe.confirmPayment({
        clientSecret,
        confirmParams: paymentMethod ? {
          payment_method: paymentMethod
        } : undefined,
        redirect: 'if_required'
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.paymentIntent;

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to confirm payment',
        { context: 'confirm_payment' }
      );
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  public async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('id', subscriptionId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseSubscription(data);

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get subscription',
        { context: 'get_subscription', metadata: { subscriptionId } }
      );
      return null;
    }
  }

  /**
   * Get user's active subscription
   */
  public async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseSubscription(data);

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get user subscription',
        { context: 'get_user_subscription', metadata: { userId } }
      );
      return null;
    }
  }

  /**
   * Get invoices for user
   */
  public async getUserInvoices(userId: string, limit: number = 20): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.map(this.mapDatabaseInvoice) || [];

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get user invoices',
        { context: 'get_user_invoices', metadata: { userId } }
      );
      return [];
    }
  }

  /**
   * Apply discount code
   */
  public async applyDiscountCode(customerId: string, code: string): Promise<{valid: boolean, discount?: any}> {
    try {
      const response = await fetch('/api/stripe/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          code
        })
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: data.valid,
        discount: data.discount
      };

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to apply discount code',
        { context: 'apply_discount_code', metadata: { customerId, code } }
      );
      return { valid: false };
    }
  }

  /**
   * Get upcoming invoice
   */
  public async getUpcomingInvoice(subscriptionId: string): Promise<Invoice | null> {
    try {
      const response = await fetch(`/api/stripe/subscriptions/${subscriptionId}/upcoming-invoice`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.mapStripeInvoice(data.invoice);

    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get upcoming invoice',
        { context: 'get_upcoming_invoice', metadata: { subscriptionId } }
      );
      return null;
    }
  }

  /**
   * Private helper methods
   */

  private async getOrCreateCustomerId(userId: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Check existing subscription for customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (subscription?.stripe_customer_id) {
      return subscription.stripe_customer_id;
    }

    // Create new Stripe customer
    return await this.createCustomer(userId, user.email, user.name);
  }

  private async getPriceIdForPlan(planId: string, billingInterval: string): Promise<string> {
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('pricing')
      .eq('id', planId)
      .single();

    if (error || !plan) {
      throw new Error('Subscription plan not found');
    }

    const pricing = plan.pricing as any;
    
    if (billingInterval === 'month') {
      return pricing.monthly?.stripePriceId || '';
    } else if (billingInterval === 'year') {
      return pricing.yearly?.stripePriceId || '';
    } else if (billingInterval === 'lifetime') {
      return pricing.lifetime?.stripePriceId || '';
    }

    throw new Error(`Invalid billing interval: ${billingInterval}`);
  }

  private async saveSubscriptionToDatabase(userId: string, stripeSubscription: any): Promise<Subscription> {
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer,
      tier: this.getTierFromPriceId(stripeSubscription.items.data[0].price.id),
      status: stripeSubscription.status,
      billing_interval: stripeSubscription.items.data[0].price.recurring?.interval || 'month',
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      currency: stripeSubscription.currency,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
      trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
      ended_at: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
      metadata: stripeSubscription.metadata || {}
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapDatabaseSubscription(data);
  }

  private async updateSubscriptionInDatabase(stripeSubscription: any): Promise<Subscription> {
    const updateData = {
      status: stripeSubscription.status,
      tier: this.getTierFromPriceId(stripeSubscription.items.data[0].price.id),
      billing_interval: stripeSubscription.items.data[0].price.recurring?.interval || 'month',
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
      ended_at: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscription.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapDatabaseSubscription(data);
  }

  private async savePaymentMethodToDatabase(userId: string, stripePaymentMethod: any): Promise<PaymentMethod> {
    const paymentMethodData = {
      user_id: userId,
      stripe_payment_method_id: stripePaymentMethod.id,
      type: stripePaymentMethod.type,
      is_default: false,
      card_data: stripePaymentMethod.card ? {
        brand: stripePaymentMethod.card.brand,
        last4: stripePaymentMethod.card.last4,
        expMonth: stripePaymentMethod.card.exp_month,
        expYear: stripePaymentMethod.card.exp_year,
        country: stripePaymentMethod.card.country
      } : null,
      billing_details: stripePaymentMethod.billing_details
    };

    const { data, error } = await supabase
      .from('payment_methods')
      .insert(paymentMethodData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapDatabasePaymentMethod(data);
  }

  private async saveCancellationSurvey(userId: string, subscriptionId: string, surveyData: any): Promise<void> {
    await supabase
      .from('cancellation_surveys')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        ...surveyData
      });
  }

  private getTierFromPriceId(priceId: string): string {
    // This would typically be a lookup in your database
    // For now, we'll use a simple mapping
    const tierMapping: Record<string, string> = {
      // These would be your actual Stripe price IDs
      'price_basic_monthly': 'basic',
      'price_basic_yearly': 'basic',
      'price_premium_monthly': 'premium',
      'price_premium_yearly': 'premium',
      'price_pro_monthly': 'pro',
      'price_pro_yearly': 'pro'
    };

    return tierMapping[priceId] || 'free';
  }

  // Mapping functions to convert database records to TypeScript interfaces
  private mapDatabaseSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripeCustomerId: data.stripe_customer_id,
      tier: data.tier,
      status: data.status,
      billingInterval: data.billing_interval,
      amount: data.amount,
      currency: data.currency,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      trialStart: data.trial_start ? new Date(data.trial_start) : undefined,
      trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      canceledAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata || {}
    };
  }

  private mapDatabasePaymentMethod(data: any): PaymentMethod {
    return {
      id: data.id,
      userId: data.user_id,
      stripePaymentMethodId: data.stripe_payment_method_id,
      type: data.type,
      isDefault: data.is_default,
      card: data.card_data,
      billingDetails: data.billing_details,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDatabaseInvoice(data: any): Invoice {
    return {
      id: data.id,
      userId: data.user_id,
      subscriptionId: data.subscription_id,
      stripeInvoiceId: data.stripe_invoice_id,
      status: data.status,
      amount: data.amount,
      tax: data.tax,
      total: data.total,
      currency: data.currency,
      dueDate: new Date(data.due_date),
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      description: data.description,
      downloadUrl: data.download_url,
      receiptUrl: data.receipt_url,
      items: data.items || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapStripeInvoice(stripeInvoice: any): Invoice {
    return {
      id: '', // This would be populated when saved to database
      userId: '', // This would be populated when saved to database
      subscriptionId: stripeInvoice.subscription,
      stripeInvoiceId: stripeInvoice.id,
      status: stripeInvoice.status,
      amount: stripeInvoice.amount_due,
      tax: stripeInvoice.tax || 0,
      total: stripeInvoice.total,
      currency: stripeInvoice.currency,
      dueDate: new Date(stripeInvoice.due_date * 1000),
      paidAt: stripeInvoice.status_transitions?.paid_at ? 
        new Date(stripeInvoice.status_transitions.paid_at * 1000) : undefined,
      periodStart: new Date(stripeInvoice.period_start * 1000),
      periodEnd: new Date(stripeInvoice.period_end * 1000),
      description: stripeInvoice.description,
      downloadUrl: stripeInvoice.invoice_pdf,
      receiptUrl: stripeInvoice.hosted_invoice_url,
      items: stripeInvoice.lines?.data?.map((item: any) => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        periodStart: item.period?.start ? new Date(item.period.start * 1000) : undefined,
        periodEnd: item.period?.end ? new Date(item.period.end * 1000) : undefined
      })) || [],
      createdAt: new Date(stripeInvoice.created * 1000),
      updatedAt: new Date(stripeInvoice.created * 1000)
    };
  }
}

export default StripeService;