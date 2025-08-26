/**
 * Payment and Subscription Testing Utilities
 * Comprehensive testing tools for Stripe integration, payment flows, and subscription management
 */

import { http, HttpResponse } from 'msw';

// Mock Stripe Objects
export class MockStripeObjects {
  static createCustomer(overrides: Partial<unknown> = {}) {
    return {
      id: `cus_${Date.now()}_mock`,
      object: 'customer',
      email: 'test@example.com',
      name: 'Test User',
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      invoice_prefix: 'ABC123',
      invoice_settings: {
        default_payment_method: null,
        footer: null,
      },
      livemode: false,
      metadata: {},
      shipping: null,
      tax_exempt: 'none',
      ...overrides,
    };
  }

  static createSubscription(overrides: Partial<unknown> = {}) {
    const startTime = Math.floor(Date.now() / 1000);
    return {
      id: `sub_${Date.now()}_mock`,
      object: 'subscription',
      application_fee_percent: null,
      billing_cycle_anchor: startTime,
      billing_thresholds: null,
      cancel_at: null,
      cancel_at_period_end: false,
      canceled_at: null,
      collection_method: 'charge_automatically',
      created: startTime,
      current_period_end: startTime + 30 * 24 * 60 * 60, // 30 days
      current_period_start: startTime,
      customer: 'cus_test123',
      days_until_due: null,
      default_payment_method: 'pm_test123',
      default_source: null,
      default_tax_rates: [],
      discount: null,
      ended_at: null,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test123',
            object: 'subscription_item',
            billing_thresholds: null,
            created: startTime,
            metadata: {},
            plan: {
              id: 'plan_premium_monthly',
              object: 'plan',
              active: true,
              amount: 999,
              currency: 'usd',
              interval: 'month',
              interval_count: 1,
              nickname: 'Premium Monthly',
              product: 'prod_premium',
            },
            quantity: 1,
            subscription: `sub_${Date.now()}_mock`,
            tax_rates: [],
          },
        ],
      },
      latest_invoice: 'in_test123',
      livemode: false,
      metadata: {},
      pending_setup_intent: null,
      pending_update: null,
      schedule: null,
      start_date: startTime,
      status: 'active',
      tax_percent: null,
      trial_end: null,
      trial_start: null,
      ...overrides,
    };
  }

  static createPaymentIntent(overrides: Partial<unknown> = {}) {
    return {
      id: `pi_${Date.now()}_mock`,
      object: 'payment_intent',
      amount: 999,
      amount_capturable: 0,
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: [],
        has_more: false,
        url: '/v1/charges?payment_intent=pi_test123',
      },
      client_secret: `pi_${Date.now()}_mock_secret_test`,
      confirmation_method: 'automatic',
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      customer: null,
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: null,
      payment_method_options: {},
      payment_method_types: ['card'],
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'requires_payment_method',
      transfer_data: null,
      transfer_group: null,
      ...overrides,
    };
  }

  static createPaymentMethod(overrides: Partial<unknown> = {}) {
    return {
      id: `pm_${Date.now()}_mock`,
      object: 'payment_method',
      billing_details: {
        address: {
          city: null,
          country: null,
          line1: null,
          line2: null,
          postal_code: null,
          state: null,
        },
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
      },
      card: {
        brand: 'visa',
        checks: {
          address_line1_check: null,
          address_postal_code_check: null,
          cvc_check: 'pass',
        },
        country: 'US',
        exp_month: 12,
        exp_year: 2025,
        fingerprint: 'abc123',
        funding: 'credit',
        generated_from: null,
        last4: '4242',
        networks: {
          available: ['visa'],
          preferred: null,
        },
        three_d_secure_usage: {
          supported: true,
        },
        wallet: null,
      },
      created: Math.floor(Date.now() / 1000),
      customer: null,
      livemode: false,
      metadata: {},
      type: 'card',
      ...overrides,
    };
  }

  static createInvoice(overrides: Partial<unknown> = {}) {
    const created = Math.floor(Date.now() / 1000);
    return {
      id: `in_${Date.now()}_mock`,
      object: 'invoice',
      account_country: 'US',
      account_name: 'Relife',
      amount_due: 999,
      amount_paid: 999,
      amount_remaining: 0,
      application_fee_amount: null,
      attempt_count: 1,
      attempted: true,
      auto_advance: false,
      billing_reason: 'subscription_cycle',
      charge: 'ch_test123',
      collection_method: 'charge_automatically',
      created,
      currency: 'usd',
      custom_fields: null,
      customer: 'cus_test123',
      customer_address: null,
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      customer_phone: null,
      customer_shipping: null,
      customer_tax_exempt: 'none',
      customer_tax_ids: [],
      default_payment_method: null,
      default_source: null,
      default_tax_rates: [],
      description: null,
      discount: null,
      due_date: null,
      ending_balance: 0,
      footer: null,
      hosted_invoice_url: 'https://pay.stripe.com/invoice/test',
      invoice_pdf: 'https://pay.stripe.com/invoice/test.pdf',
      lines: {
        object: 'list',
        data: [
          {
            id: 'il_test123',
            object: 'line_item',
            amount: 999,
            currency: 'usd',
            description: 'Premium Monthly Subscription',
            discount_amounts: [],
            discountable: true,
            discounts: [],
            livemode: false,
            metadata: {},
            period: {
              end: created + 30 * 24 * 60 * 60,
              start: created,
            },
            plan: {
              id: 'plan_premium_monthly',
              object: 'plan',
              amount: 999,
              currency: 'usd',
              interval: 'month',
              interval_count: 1,
              nickname: 'Premium Monthly',
            },
            proration: false,
            quantity: 1,
            subscription: 'sub_test123',
            subscription_item: 'si_test123',
            tax_amounts: [],
            tax_rates: [],
            type: 'subscription',
          },
        ],
      },
      livemode: false,
      metadata: {},
      next_payment_attempt: null,
      paid: true,
      payment_intent: 'pi_test123',
      period_end: created + 30 * 24 * 60 * 60,
      period_start: created,
      post_payment_credit_notes_amount: 0,
      pre_payment_credit_notes_amount: 0,
      receipt_number: null,
      starting_balance: 0,
      statement_descriptor: null,
      status: 'paid',
      status_transitions: {
        finalized_at: created,
        marked_uncollectible_at: null,
        paid_at: created,
        voided_at: null,
      },
      subscription: 'sub_test123',
      subtotal: 999,
      tax: null,
      tax_percent: null,
      total: 999,
      total_tax_amounts: [],
      transfer_data: null,
      webhooks_delivered_at: created,
      ...overrides,
    };
  }

  static createWebhookEvent(type: string, data: unknown) {
    return {
      id: `evt_${Date.now()}_mock`,
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: data,
        previous_attributes: {},
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${Date.now()}_mock`,
        idempotency_key: null,
      },
      type,
    };
  }
}

// Payment Flow Testing Utilities
export class PaymentFlowTester {
  private events: Array<{ type: string; data: unknown; timestamp: number }> = [];

  reset() {
    this.events = [];
  }

  getEvents() {
    return [...this.events];
  }

  private logEvent(type: string, data: unknown) {
    this.events.push({ type, data, timestamp: Date.now() });
  }

  async testCompleteSubscriptionFlow(userEmail: string = 'test@example.com') {
    this.logEvent('flow_started', { userEmail });

    // Step 1: Create customer
    const customer = MockStripeObjects.createCustomer({ email: userEmail });
    this.logEvent('customer_created', customer);

    // Step 2: Create payment method
    const paymentMethod = MockStripeObjects.createPaymentMethod({
      customer: customer.id,
    });
    this.logEvent('payment_method_created', paymentMethod);

    // Step 3: Create subscription
    const subscription = MockStripeObjects.createSubscription({
      customer: customer.id,
      default_payment_method: paymentMethod.id,
    });
    this.logEvent('subscription_created', subscription);

    // Step 4: Process first payment
    const invoice = MockStripeObjects.createInvoice({
      customer: customer.id,
      subscription: subscription.id,
    });
    this.logEvent('invoice_created', invoice);

    // Step 5: Webhook events
    const webhookEvents = [
      'customer.subscription.created',
      'invoice.payment_succeeded',
      'invoice.finalized',
    ];

    for (const eventType of webhookEvents) {
      const webhookData = eventType.includes('subscription') ? subscription : invoice;
      const webhook = MockStripeObjects.createWebhookEvent(eventType, webhookData);
      this.logEvent('webhook_received', { eventType, webhook });
      await this.delay(100); // Simulate webhook processing delay
    }

    this.logEvent('flow_completed', {
      customerId: customer.id,
      subscriptionId: subscription.id,
      status: 'active',
    });

    return {
      customer,
      paymentMethod,
      subscription,
      invoice,
      events: this.getEvents(),
    };
  }

  async testFailedPaymentFlow() {
    this.logEvent('failed_payment_flow_started', {});

    const customer = MockStripeObjects.createCustomer();
    const paymentMethod = MockStripeObjects.createPaymentMethod({
      customer: customer.id,
      card: { ...MockStripeObjects.createPaymentMethod().card, last4: '0002' }, // Declined card
    });

    this.logEvent('payment_method_created', { paymentMethod, expectedToFail: true });

    // Attempt to create subscription with failing payment method
    const paymentIntent = MockStripeObjects.createPaymentIntent({
      status: 'requires_payment_method',
      last_payment_error: {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.',
      },
    });

    this.logEvent('payment_failed', paymentIntent);

    // Webhook for failed payment
    const webhook = MockStripeObjects.createWebhookEvent(
      'payment_intent.payment_failed',
      paymentIntent
    );
    this.logEvent('webhook_received', {
      eventType: 'payment_intent.payment_failed',
      webhook,
    });

    return {
      customer,
      paymentMethod,
      paymentIntent,
      events: this.getEvents(),
    };
  }

  async testSubscriptionCancellationFlow(subscriptionId: string = 'sub_test123') {
    this.logEvent('cancellation_flow_started', { subscriptionId });

    // Cancel subscription
    const canceledSubscription = MockStripeObjects.createSubscription({
      id: subscriptionId,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      cancel_at_period_end: false,
    });

    this.logEvent('subscription_canceled', canceledSubscription);

    // Final invoice
    const finalInvoice = MockStripeObjects.createInvoice({
      subscription: subscriptionId,
      amount_due: 0,
      status: 'paid',
    });

    this.logEvent('final_invoice_created', finalInvoice);

    // Webhook
    const webhook = MockStripeObjects.createWebhookEvent(
      'customer.subscription.deleted',
      canceledSubscription
    );
    this.logEvent('webhook_received', {
      eventType: 'customer.subscription.deleted',
      webhook,
    });

    return {
      subscription: canceledSubscription,
      finalInvoice,
      events: this.getEvents(),
    };
  }

  async testSubscriptionUpgradeFlow(subscriptionId: string = 'sub_test123') {
    this.logEvent('upgrade_flow_started', {
      subscriptionId,
      from: 'basic',
      to: 'premium',
    });

    // Create prorated invoice for upgrade
    const proratedInvoice = MockStripeObjects.createInvoice({
      subscription: subscriptionId,
      amount_due: 333, // Prorated amount
      billing_reason: 'subscription_update',
    });

    this.logEvent('prorated_invoice_created', proratedInvoice);

    // Updated subscription
    const updatedSubscription = MockStripeObjects.createSubscription({
      id: subscriptionId,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_updated123',
            object: 'subscription_item',
            plan: {
              id: 'plan_premium_monthly',
              amount: 1999, // Higher tier
              nickname: 'Premium Plus Monthly',
            },
            quantity: 1,
          },
        ],
      },
    });

    this.logEvent('subscription_updated', updatedSubscription);

    // Webhooks
    const webhooks = ['customer.subscription.updated', 'invoice.payment_succeeded'];

    for (const eventType of webhooks) {
      const data = eventType.includes('subscription')
        ? updatedSubscription
        : proratedInvoice;
      const webhook = MockStripeObjects.createWebhookEvent(eventType, data);
      this.logEvent('webhook_received', { eventType, webhook });
    }

    return {
      subscription: updatedSubscription,
      proratedInvoice,
      events: this.getEvents(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Webhook Testing Utilities
export class WebhookTester {
  private receivedWebhooks: Array<{
    event: unknown;
    signature: string;
    timestamp: number;
    processed: boolean;
  }> = [];

  reset() {
    this.receivedWebhooks = [];
  }

  getReceivedWebhooks() {
    return [...this.receivedWebhooks];
  }

  simulateWebhook(
    eventType: string,
    data: unknown,
    endpoint: string = '/api/stripe/webhooks'
  ) {
    const webhook = MockStripeObjects.createWebhookEvent(eventType, data);
    const signature = this.generateWebhookSignature(webhook);

    this.receivedWebhooks.push({
      _event: webhook,
      signature,
      timestamp: Date.now(),
      processed: false,
    });

    return {
      webhook,
      signature,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
      body: JSON.stringify(webhook),
    };
  }

  private generateWebhookSignature(webhook: unknown): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(webhook);
    // Mock signature format: t=timestamp,v1=signature
    return `t=${timestamp},v1=mock_signature_${timestamp}`;
  }

  async testWebhookReliability(eventTypes: string[], maxRetries: number = 3) {
    const results = [];

    for (const eventType of eventTypes) {
      let attempts = 0;
      let success = false;

      while (attempts < maxRetries && !success) {
        attempts++;

        try {
          const mockData = this.getMockDataForEventType(eventType);
          const { webhook, signature } = this.simulateWebhook(eventType, mockData);

          // Simulate webhook processing
          await new Promise(resolve => setTimeout(resolve, 100));

          // Random success/failure for testing
          success = Math.random() > 0.2; // 80% success rate

          results.push({
            eventType,
            attempt: attempts,
            success,
            webhook,
            signature,
          });

          if (!success && attempts < maxRetries) {
            // Exponential backoff
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, attempts) * 1000)
            );
          }
        } catch (_error) {
          results.push({
            eventType,
            attempt: attempts,
            success: false,
            error: error instanceof Error ? _error.message : 'Unknown _error',
          });
        }
      }
    }

    return results;
  }

  private getMockDataForEventType(eventType: string): any {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return MockStripeObjects.createSubscription();

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.finalized':
        return MockStripeObjects.createInvoice();

      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        return MockStripeObjects.createPaymentIntent();

      case 'payment_method.attached':
        return MockStripeObjects.createPaymentMethod();

      default:
        return {};
    }
  }
}

// Subscription Testing Utilities
export class SubscriptionTester {
  async testSubscriptionStates() {
    const states = [
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
    ];

    const subscriptions = states.map(status =>
      MockStripeObjects.createSubscription({ status })
    );

    return {
      subscriptions,
      stateTransitions: this.generateStateTransitions(),
    };
  }

  async testTrialFlow() {
    const trialStart = Math.floor(Date.now() / 1000);
    const trialEnd = trialStart + 14 * 24 * 60 * 60; // 14 days

    const trialSubscription = MockStripeObjects.createSubscription({
      status: 'trialing',
      trial_start: trialStart,
      trial_end: trialEnd,
      current_period_end: trialEnd,
    });

    // Simulate trial ending
    const activeSubscription = {
      ...trialSubscription,
      status: 'active',
      trial_start: null,
      trial_end: null,
      current_period_start: trialEnd,
      current_period_end: trialEnd + 30 * 24 * 60 * 60,
    };

    return {
      trialSubscription,
      activeSubscription,
      trialDuration: 14,
    };
  }

  private generateStateTransitions() {
    return [
      { from: 'incomplete', to: 'active', trigger: 'payment_succeeded' },
      { from: 'active', to: 'past_due', trigger: 'payment_failed' },
      { from: 'past_due', to: 'active', trigger: 'payment_succeeded' },
      { from: 'past_due', to: 'canceled', trigger: 'max_retries_exceeded' },
      { from: 'trialing', to: 'active', trigger: 'trial_ended' },
      { from: 'active', to: 'canceled', trigger: 'user_cancellation' },
    ];
  }
}

// Setup function for payment tests
export const setupPaymentTesting = () => {
  let paymentFlowTester: PaymentFlowTester;
  let webhookTester: WebhookTester;
  let subscriptionTester: SubscriptionTester;

  beforeEach(() => {
    paymentFlowTester = new PaymentFlowTester();
    webhookTester = new WebhookTester();
    subscriptionTester = new SubscriptionTester();
  });

  return {
    paymentFlowTester,
    webhookTester,
    subscriptionTester,
  };
};

export { MockStripeObjects, PaymentFlowTester, WebhookTester, SubscriptionTester };

export default {
  MockStripeObjects,
  PaymentFlowTester,
  WebhookTester,
  SubscriptionTester,
  setupPaymentTesting,
};
