// Subscription API for Relife Alarm App
// Temporary stub version for CI compatibility

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

export class SubscriptionAPI {
  /**
   * Create customer - STUB VERSION
   */
  async createCustomer(userData: any): Promise<any> {
    console.log('Create customer stub');
    return { id: 'cus_stub' };
  }

  /**
   * Create subscription - STUB VERSION
   */
  async createSubscription(data: any): Promise<any> {
    console.log('Create subscription stub');
    return { id: 'sub_stub' };
  }

  /**
   * Update subscription - STUB VERSION
   */
  async updateSubscription(subscriptionId: string, data: any): Promise<any> {
    console.log('Update subscription stub');
    return { id: subscriptionId };
  }

  /**
   * Cancel subscription - STUB VERSION
   */
  async cancelSubscription(subscriptionId: string, data: any): Promise<any> {
    console.log('Cancel subscription stub');
    return { id: subscriptionId, status: 'canceled' };
  }

  /**
   * Add payment method - STUB VERSION
   */
  async addPaymentMethod(data: any): Promise<any> {
    console.log('Add payment method stub');
    return { id: 'pm_stub' };
  }

  /**
   * Create payment intent - STUB VERSION
   */
  async createPaymentIntent(data: any): Promise<any> {
    console.log('Create payment intent stub');
    return { id: 'pi_stub' };
  }

  /**
   * Apply discount code - STUB VERSION
   */
  async applyDiscountCode(customerId: string, code: string): Promise<any> {
    console.log('Apply discount stub');
    return { success: true };
  }

  /**
   * Track feature usage - STUB VERSION
   */
  async trackFeatureUsage(userId: string, featureId: string): Promise<any> {
    console.log('Track feature usage stub');
    return { success: true };
  }

  /**
   * Record feature usage - STUB VERSION
   */
  async recordFeatureUsage(data: any): Promise<any> {
    console.log('Record feature usage stub');
    return { success: true };
  }
}

export default new SubscriptionAPI();