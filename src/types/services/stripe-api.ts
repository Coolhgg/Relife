/**
 * Stripe API Interface Definitions
 * Comprehensive typing for payment and subscription operations
 */

import { ApiResponse } from '../api';

// =============================================================================
// Core Stripe Interfaces
// =============================================================================

/**
 * Stripe customer interface
 */
export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string;
  name?: string;
  description?: string;
  default_source?: string;
  invoice_prefix?: string;
  created: number;
  currency?: string;
  delinquent: boolean;
  discount?: StripeDiscount;
  invoice_settings: {
    custom_fields?: Array<{
      name: string;
      value: string;
    }>;
    default_payment_method?: string;
    footer?: string;
  };
  livemode: boolean;
  metadata: Record<string, string>;
  shipping?: StripeShipping;
  tax_exempt?: 'none' | 'exempt' | 'reverse';
  test_clock?: string;
}

/**
 * Stripe subscription interface
 */
export interface StripeSubscription {
  id: string;
  object: 'subscription';
  application_fee_percent?: number;
  automatic_tax: {
    enabled: boolean;
  };
  billing_cycle_anchor: number;
  billing_thresholds?: {
    amount_gte?: number;
    reset_billing_cycle_anchor?: boolean;
  };
  cancel_at?: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  collection_method: 'charge_automatically' | 'send_invoice';
  created: number;
  current_period_end: number;
  current_period_start: number;
  customer: string;
  days_until_due?: number;
  default_payment_method?: string;
  default_source?: string;
  default_tax_rates: StripePrice[];
  description?: string;
  discount?: StripeDiscount;
  ended_at?: number;
  items: {
    object: 'list';
    data: StripeSubscriptionItem[];
    has_more: boolean;
    total_count: number;
    url: string;
  };
  latest_invoice?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  next_pending_invoice_item_invoice?: number;
  pause_collection?: {
    behavior: 'keep_as_draft' | 'mark_uncollectible' | 'void';
    resumes_at?: number;
  };
  pending_invoice_item_interval?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  pending_setup_intent?: string;
  pending_update?: {
    billing_cycle_anchor?: number;
    expires_at: number;
    subscription_items: StripeSubscriptionItem[];
    trial_end?: number;
    trial_from_plan?: boolean;
  };
  schedule?: string;
  start_date: number;
  status:
    | 'active'
    | 'past_due'
    | 'unpaid'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'paused';
  test_clock?: string;
  transfer_data?: {
    amount_percent?: number;
    destination: string;
  };
  trial_end?: number;
  trial_start?: number;
}

/**
 * Stripe subscription item
 */
export interface StripeSubscriptionItem {
  id: string;
  object: 'subscription_item';
  billing_thresholds?: {
    usage_gte?: number;
  };
  created: number;
  metadata: Record<string, string>;
  price: StripePrice;
  quantity?: number;
  subscription: string;
  tax_rates: StripePrice[];
}

/**
 * Stripe price interface
 */
export interface StripePrice {
  id: string;
  object: 'price';
  active: boolean;
  billing_scheme: 'per_unit' | 'tiered';
  created: number;
  currency: string;
  livemode: boolean;
  lookup_key?: string;
  metadata: Record<string, string>;
  nickname?: string;
  product: string;
  recurring?: {
    aggregate_usage?: 'last_during_period' | 'last_ever' | 'max' | 'sum';
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    usage_type?: 'licensed' | 'metered';
  };
  tax_behavior?: 'exclusive' | 'inclusive' | 'unspecified';
  tiers?: Array<{
    flat_amount?: number;
    flat_amount_decimal?: string;
    unit_amount?: number;
    unit_amount_decimal?: string;
    up_to?: number | 'inf';
  }>;
  tiers_mode?: 'graduated' | 'volume';
  transform_quantity?: {
    divide_by: number;
    round: 'down' | 'up';
  };
  type: 'one_time' | 'recurring';
  unit_amount?: number;
  unit_amount_decimal?: string;
}

/**
 * Stripe payment method
 */
export interface StripePaymentMethod {
  id: string;
  object: 'payment_method';
  billing_details: {
    address?: StripeAddress;
    email?: string;
    name?: string;
    phone?: string;
  };
  card?: {
    brand: string;
    checks?: {
      address_line1_check?: string;
      address_postal_code_check?: string;
      cvc_check?: string;
    };
    country?: string;
    exp_month: number;
    exp_year: number;
    fingerprint?: string;
    funding?: string;
    generated_from?: {
      charge?: string;
      payment_method_details?: Record<string, unknown>;
      setup_attempt?: string;
    };
    last4: string;
    networks?: {
      available: string[];
      preferred?: string;
    };
    three_d_secure_usage?: {
      supported: boolean;
    };
    wallet?: Record<string, unknown>;
  };
  created: number;
  customer?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  type: 'card' | 'us_bank_account' | 'sepa_debit';
}

/**
 * Stripe invoice
 */
export interface StripeInvoice {
  id: string;
  object: 'invoice';
  account_country?: string;
  account_name?: string;
  account_tax_ids?: string[];
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  application_fee_amount?: number;
  attempt_count: number;
  attempted: boolean;
  auto_advance?: boolean;
  automatic_tax: {
    enabled: boolean;
    status?: 'requires_location_inputs' | 'complete' | 'failed';
  };
  billing_reason?:
    | 'manual'
    | 'subscription_cycle'
    | 'subscription_create'
    | 'subscription_update'
    | 'subscription'
    | 'upcoming'
    | 'subscription_threshold';
  charge?: string;
  collection_method: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  custom_fields?: Array<{
    name: string;
    value: string;
  }>;
  customer: string;
  customer_address?: StripeAddress;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_shipping?: StripeShipping;
  customer_tax_exempt?: 'none' | 'exempt' | 'reverse';
  customer_tax_ids?: Array<{
    type: string;
    value: string;
  }>;
  default_payment_method?: string;
  default_source?: string;
  default_tax_rates: StripePrice[];
  description?: string;
  discount?: StripeDiscount;
  discounts: StripeDiscount[];
  due_date?: number;
  ending_balance?: number;
  footer?: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  last_finalization_error?: Record<string, unknown>;
  lines: {
    object: 'list';
    data: StripeInvoiceLineItem[];
    has_more: boolean;
    total_count: number;
    url: string;
  };
  livemode: boolean;
  metadata: Record<string, string>;
  next_payment_attempt?: number;
  number?: string;
  on_behalf_of?: string;
  paid: boolean;
  payment_intent?: string;
  payment_settings: {
    payment_method_options?: Record<string, unknown>;
    payment_method_types?: string[];
  };
  period_end: number;
  period_start: number;
  post_payment_credit_notes_amount: number;
  pre_payment_credit_notes_amount: number;
  quote?: string;
  receipt_number?: string;
  starting_balance: number;
  statement_descriptor?: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  status_transitions: {
    finalized_at?: number;
    marked_uncollectible_at?: number;
    paid_at?: number;
    voided_at?: number;
  };
  subscription?: string;
  subtotal: number;
  tax?: number;
  test_clock?: string;
  total: number;
  total_discount_amounts: Array<{
    amount: number;
    discount: string;
  }>;
  total_tax_amounts: Array<{
    amount: number;
    inclusive: boolean;
    tax_rate: string;
  }>;
  transfer_data?: {
    amount?: number;
    destination: string;
  };
  webhooks_delivered_at?: number;
}

// =============================================================================
// Helper Interfaces
// =============================================================================

export interface StripeAddress {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postal_code?: string;
  state?: string;
}

export interface StripeShipping {
  address?: StripeAddress;
  carrier?: string;
  name?: string;
  phone?: string;
  tracking_number?: string;
}

export interface StripeDiscount {
  id: string;
  object: 'discount';
  coupon?: StripeCoupon;
  customer?: string;
  end?: number;
  invoice?: string;
  invoice_item?: string;
  promotion_code?: string;
  start: number;
  subscription?: string;
}

export interface StripeCoupon {
  id: string;
  object: 'coupon';
  amount_off?: number;
  created: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  duration_in_months?: number;
  livemode: boolean;
  max_redemptions?: number;
  metadata: Record<string, string>;
  name?: string;
  percent_off?: number;
  redeem_by?: number;
  times_redeemed: number;
  valid: boolean;
}

export interface StripeInvoiceLineItem {
  id: string;
  object: 'line_item';
  amount: number;
  currency: string;
  description?: string;
  discount_amounts: Array<{
    amount: number;
    discount: string;
  }>;
  discountable: boolean;
  discounts: string[];
  invoice_item?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  period: {
    end: number;
    start: number;
  };
  price?: StripePrice;
  proration: boolean;
  quantity?: number;
  subscription?: string;
  subscription_item?: string;
  tax_amounts: Array<{
    amount: number;
    inclusive: boolean;
    tax_rate: string;
  }>;
  tax_rates: StripePrice[];
  type: 'invoiceitem' | 'subscription';
  unit_amount_excluding_tax?: string;
}

// =============================================================================
// Request/Response Interfaces
// =============================================================================

/**
 * Create subscription request
 */
export interface CreateSubscriptionRequest {
  customer: string;
  items: Array<{
    price: string;
    quantity?: number;
  }>;
  trial_period_days?: number;
  default_payment_method?: string;
  promotion_code?: string;
  metadata?: Record<string, string>;
}

/**
 * Update subscription request
 */
export interface UpdateSubscriptionRequest {
  items?: Array<{
    id?: string;
    price?: string;
    quantity?: number;
    deleted?: boolean;
  }>;
  default_payment_method?: string;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Create payment intent request
 */
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customer?: string;
  payment_method?: string;
  confirm?: boolean;
  return_url?: string;
  metadata?: Record<string, string>;
}

/**
 * Create customer request
 */
export interface CreateCustomerRequest {
  email: string;
  name?: string;
  description?: string;
  payment_method?: string;
  invoice_settings?: {
    default_payment_method?: string;
  };
  metadata?: Record<string, string>;
}

// =============================================================================
// Service Response Interfaces
// =============================================================================

export interface StripeServiceResponse<T> extends ApiResponse<T> {
  stripeRequestId?: string;
  stripeVersion?: string;
}

export interface SubscriptionServiceResponse {
  subscription: StripeServiceResponse<StripeSubscription>;
  subscriptions: StripeServiceResponse<StripeSubscription[]>;
}

export interface PaymentServiceResponse {
  paymentIntent: StripeServiceResponse<{
    id: string;
    client_secret: string;
    status: string;
  }>;
  paymentMethods: StripeServiceResponse<StripePaymentMethod[]>;
}

export interface CustomerServiceResponse {
  customer: StripeServiceResponse<StripeCustomer>;
  invoices: StripeServiceResponse<StripeInvoice[]>;
}
