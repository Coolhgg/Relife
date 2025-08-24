/**
 * Integration tests for SubscriptionReducer
 * Tests that the reducer handles typed payloads correctly
 */

import { subscriptionReducer } from '../subscriptionReducer';
import { INITIAL_SUBSCRIPTION_STATE } from '../../constants/initialDomainState';
import type { SubscriptionState, SubscriptionAction } from '../../types/app-state';
import type { Subscription, PaymentMethod } from '../../types/domain';

describe('SubscriptionReducer Integration Tests', () => {
  let initialState: SubscriptionState;

  beforeEach(() => {
    initialState = INITIAL_SUBSCRIPTION_STATE;
  });

  describe('Subscription Management', () => {
    it('should handle SUBSCRIPTION_LOAD_SUCCESS with typed subscription payload', () => {
      const mockSubscription: Subscription = {
        id: 'sub-123',
        userId: 'user-456',
        tier: 'premium',
        status: 'active',
        billingInterval: 'monthly',
        amount: 9.99,
        currency: 'USD',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-02-01T00:00:00Z'),
        nextBillingDate: new Date('2024-02-01T00:00:00Z'),
        trialEnd: null,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        paymentMethodId: 'pm-123',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      };

      const action: SubscriptionAction = {
        type: 'SUBSCRIPTION_LOAD_SUCCESS',
        payload: { subscription: mockSubscription }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.current).toEqual(mockSubscription);
      expect(newState.isActive).toBe(true);
      expect(newState.isPremium).toBe(true);
      expect(newState.tier).toBe('premium');
    });

    it('should handle SUBSCRIPTION_UPGRADE_SUCCESS with typed upgrade payload', () => {
      const currentSubscription: Subscription = {
        id: 'sub-123',
        userId: 'user-456',
        tier: 'free',
        status: 'active',
        billingInterval: 'monthly',
        amount: 0,
        currency: 'USD',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-02-01T00:00:00Z'),
        nextBillingDate: new Date('2024-02-01T00:00:00Z'),
        trialEnd: null,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        paymentMethodId: null,
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      };

      const stateWithSubscription: SubscriptionState = {
        ...initialState,
        current: currentSubscription,
        isActive: true,
        tier: 'free'
      };

      const upgradedSubscription: Subscription = {
        ...currentSubscription,
        tier: 'premium',
        amount: 9.99,
        paymentMethodId: 'pm-123',
        updatedAt: new Date()
      };

      const action: SubscriptionAction = {
        type: 'SUBSCRIPTION_UPGRADE_SUCCESS',
        payload: { subscription: upgradedSubscription }
      };

      const newState = subscriptionReducer(stateWithSubscription, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.current).toEqual(upgradedSubscription);
      expect(newState.tier).toBe('premium');
      expect(newState.isPremium).toBe(true);
    });

    it('should handle SUBSCRIPTION_CANCEL_SUCCESS correctly', () => {
      const activeSubscription: Subscription = {
        id: 'sub-123',
        userId: 'user-456',
        tier: 'premium',
        status: 'active',
        billingInterval: 'monthly',
        amount: 9.99,
        currency: 'USD',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-02-01T00:00:00Z'),
        nextBillingDate: new Date('2024-02-01T00:00:00Z'),
        trialEnd: null,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        paymentMethodId: 'pm-123',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      };

      const stateWithActiveSubscription: SubscriptionState = {
        ...initialState,
        current: activeSubscription,
        isActive: true,
        isPremium: true,
        tier: 'premium'
      };

      const canceledSubscription: Subscription = {
        ...activeSubscription,
        status: 'canceled',
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      };

      const action: SubscriptionAction = {
        type: 'SUBSCRIPTION_CANCEL_SUCCESS',
        payload: { subscription: canceledSubscription }
      };

      const newState = subscriptionReducer(stateWithActiveSubscription, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.current).toEqual(canceledSubscription);
      expect(newState.isActive).toBe(false);
    });
  });

  describe('Feature Access Management', () => {
    it('should handle FEATURE_ACCESS_UPDATE with typed feature access payload', () => {
      const featureAccess = {
        premiumAlarms: true,
        advancedScheduling: true,
        customSounds: true,
        battlesAndGaming: true,
        prioritySupport: false,
        advancedAnalytics: false
      };

      const action: SubscriptionAction = {
        type: 'FEATURE_ACCESS_UPDATE',
        payload: { featureAccess }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.featureAccess).toEqual(featureAccess);
    });

    it('should handle FEATURE_USAGE_UPDATE with typed usage payload', () => {
      const usage = {
        alarmsUsed: 15,
        alarmsLimit: 50,
        customSoundsUsed: 3,
        customSoundsLimit: 10,
        battlesParticipated: 2,
        apiCallsUsed: 100,
        apiCallsLimit: 1000,
        storageUsed: 50,
        storageLimit: 100
      };

      const action: SubscriptionAction = {
        type: 'FEATURE_USAGE_UPDATE',
        payload: { usage }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.usage).toEqual(usage);
    });
  });

  describe('Payment Method Management', () => {
    it('should handle PAYMENT_METHOD_ADD with typed payment method payload', () => {
      const newPaymentMethod: PaymentMethod = {
        id: 'pm-123',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const action: SubscriptionAction = {
        type: 'PAYMENT_METHOD_ADD',
        payload: { paymentMethod: newPaymentMethod }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.paymentMethods).toHaveLength(1);
      expect(newState.paymentMethods[0]).toEqual(newPaymentMethod);
      expect(newState.defaultPaymentMethod).toEqual(newPaymentMethod);
    });

    it('should handle PAYMENT_METHOD_REMOVE with typed payment method id payload', () => {
      const paymentMethod1: PaymentMethod = {
        id: 'pm-123',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const paymentMethod2: PaymentMethod = {
        id: 'pm-456',
        type: 'card',
        last4: '1234',
        brand: 'mastercard',
        expiryMonth: 6,
        expiryYear: 2026,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const stateWithPaymentMethods: SubscriptionState = {
        ...initialState,
        paymentMethods: [paymentMethod1, paymentMethod2],
        defaultPaymentMethod: paymentMethod1
      };

      const action: SubscriptionAction = {
        type: 'PAYMENT_METHOD_REMOVE',
        payload: { paymentMethodId: 'pm-123' }
      };

      const newState = subscriptionReducer(stateWithPaymentMethods, action);

      expect(newState.paymentMethods).toHaveLength(1);
      expect(newState.paymentMethods[0]).toEqual(paymentMethod2);
      expect(newState.defaultPaymentMethod).toBeNull(); // Default was removed
    });
  });

  describe('Error Handling', () => {
    it('should handle SUBSCRIPTION_UPGRADE_ERROR with typed error payload', () => {
      const action: SubscriptionAction = {
        type: 'SUBSCRIPTION_UPGRADE_ERROR',
        payload: { error: 'Payment method declined' }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe('Payment method declined');
    });

    it('should handle SUBSCRIPTION_LOAD_ERROR with typed error payload', () => {
      const action: SubscriptionAction = {
        type: 'SUBSCRIPTION_LOAD_ERROR',
        payload: { error: 'Failed to load subscription' }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe('Failed to load subscription');
    });
  });

  describe('UI State Management', () => {
    it('should handle UPGRADE_PROMPT_SHOW correctly', () => {
      const action: SubscriptionAction = {
        type: 'UPGRADE_PROMPT_SHOW',
        payload: { 
          feature: 'premiumAlarms',
          context: 'alarm_limit_reached'
        }
      };

      const newState = subscriptionReducer(initialState, action);

      expect(newState.ui.showUpgradeModal).toBe(true);
      expect(newState.ui.upgradePrompt).toEqual({
        feature: 'premiumAlarms',
        context: 'alarm_limit_reached'
      });
    });

    it('should handle UPGRADE_PROMPT_DISMISS correctly', () => {
      const stateWithUpgradeModal: SubscriptionState = {
        ...initialState,
        ui: {
          showUpgradeModal: true,
          upgradePrompt: {
            feature: 'premiumAlarms',
            context: 'alarm_limit_reached'
          },
          isProcessingPayment: false,
          showPaymentModal: false
        }
      };

      const action: SubscriptionAction = {
        type: 'UPGRADE_PROMPT_DISMISS',
        payload: {}
      };

      const newState = subscriptionReducer(stateWithUpgradeModal, action);

      expect(newState.ui.showUpgradeModal).toBe(false);
      expect(newState.ui.upgradePrompt).toBeNull();
    });
  });
});