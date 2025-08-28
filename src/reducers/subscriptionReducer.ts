/**
 * Subscription State Reducer
 * Handles all subscription-related state mutations with type safety
 */

import type { SubscriptionState, SubscriptionAction } from '../types/app-state';
import { INITIAL_SUBSCRIPTION_STATE } from '../constants/initialDomainState';

export const subscriptionReducer = (
  state: SubscriptionState = INITIAL_SUBSCRIPTION_STATE,
  action: SubscriptionAction
): SubscriptionState => {
  switch (action.type) {
    // =============================================================================
    // SUBSCRIPTION LOADING ACTIONS
    // =============================================================================
    case 'SUBSCRIPTION_LOAD_START':
      return {
        ...state,
        loading: {
          ...state.loading,
          subscription: true,
        },
        errors: {
          ...state.errors,
          subscriptionError: null,
        },
      };

    case 'SUBSCRIPTION_LOAD_SUCCESS': {
      const subscription = action.payload;

      return {
        ...state,
        currentSubscription: subscription,
        status: {
          ...state.status,
          isActive: subscription.status === 'active',
          isPremium: subscription.tier !== 'free',
          tier: subscription.tier,
          status: subscription.status,
          expiresAt: subscription.currentPeriodEnd,
          renewsAt: subscription.autoRenew ? subscription.currentPeriodEnd : null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
        loading: {
          ...state.loading,
          subscription: false,
        },
        errors: {
          ...state.errors,
          subscriptionError: null,
        },
      };
    }

    case 'SUBSCRIPTION_LOAD_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          subscription: false,
        },
        errors: {
          ...state.errors,
          subscriptionError: action.payload,
        },
      };

    // =============================================================================
    // SUBSCRIPTION UPGRADE ACTIONS
    // =============================================================================
    case 'SUBSCRIPTION_UPGRADE_START':
      return {
        ...state,
        ui: {
          ...state.ui,
          paymentProcessing: true,
          lastPaymentError: null,
        },
      };

    case 'SUBSCRIPTION_UPGRADE_SUCCESS': {
      const subscription = action.payload;

      return {
        ...state,
        currentSubscription: subscription,
        status: {
          ...state.status,
          isActive: subscription.status === 'active',
          isPremium: subscription.tier !== 'free',
          tier: subscription.tier,
          status: subscription.status,
          expiresAt: subscription.currentPeriodEnd,
          renewsAt: subscription.autoRenew ? subscription.currentPeriodEnd : null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
        ui: {
          ...state.ui,
          paymentProcessing: false,
          showUpgradeModal: false,
          selectedUpgradePlan: null,
          lastPaymentError: null,
        },
        // Clear any trial state if they upgraded
        trial: {
          ...state.trial,
          isInTrial: false,
          hasUsedTrial: true,
        },
      };
    }

    case 'SUBSCRIPTION_UPGRADE_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          paymentProcessing: false,
          lastPaymentError: action.payload,
        },
      };

    // =============================================================================
    // SUBSCRIPTION CANCELLATION ACTIONS
    // =============================================================================
    case 'SUBSCRIPTION_CANCEL_START':
      return {
        ...state,
        ui: {
          ...state.ui,
          paymentProcessing: true,
        },
      };

    case 'SUBSCRIPTION_CANCEL_SUCCESS': {
      const subscription = action.payload;

      return {
        ...state,
        currentSubscription: subscription,
        status: {
          ...state.status,
          cancelAtPeriodEnd: true,
          // Keep premium access until period end
          isActive: subscription.status === 'active',
          isPremium: subscription.tier !== 'free',
        },
        ui: {
          ...state.ui,
          paymentProcessing: false,
          showCancelModal: false,
        },
      };
    }

    case 'SUBSCRIPTION_CANCEL_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          paymentProcessing: false,
        },
        errors: {
          ...state.errors,
          subscriptionError: action.payload,
        },
      };

    // =============================================================================
    // FEATURE ACCESS ACTIONS
    // =============================================================================
    case 'FEATURE_ACCESS_UPDATE':
      return {
        ...state,
        featureAccess: action.payload,
      };

    case 'FEATURE_USAGE_UPDATE': {
      const { feature, usage } = action.payload;
      return {
        ...state,
        featureUsage: {
          ...state.featureUsage,
          [feature]: usage,
        },
      };
    }

    // =============================================================================
    // PAYMENT METHOD ACTIONS
    // =============================================================================
    case 'PAYMENT_METHOD_ADD': {
      const paymentMethod = action.payload;
      const updatedPaymentMethods = [...state.billing.paymentMethods, paymentMethod];

      return {
        ...state,
        billing: {
          ...state.billing,
          paymentMethods: updatedPaymentMethods,
          // Set as default if it's the first payment method
          defaultPaymentMethod:
            state.billing.paymentMethods.length === 0
              ? paymentMethod
              : state.billing.defaultPaymentMethod,
        },
      };
    }

    case 'PAYMENT_METHOD_REMOVE': {
      const paymentMethodId = action.payload;
      const updatedPaymentMethods = state.billing.paymentMethods.filter(
        pm => pm.id !== paymentMethodId
      );

      return {
        ...state,
        billing: {
          ...state.billing,
          paymentMethods: updatedPaymentMethods,
          // Clear default if it was the removed payment method
          defaultPaymentMethod:
            state.billing.defaultPaymentMethod?.id === paymentMethodId
              ? updatedPaymentMethods[0] || null
              : state.billing.defaultPaymentMethod,
        },
      };
    }

    // =============================================================================
    // BILLING ACTIONS
    // =============================================================================
    case 'INVOICE_RECEIVED': {
      const invoice = action.payload;
      return {
        ...state,
        billing: {
          ...state.billing,
          invoiceHistory: [invoice, ...state.billing.invoiceHistory],
        },
      };
    }

    // =============================================================================
    // UPGRADE PROMPT ACTIONS
    // =============================================================================
    case 'UPGRADE_PROMPT_SHOW': {
      const prompt = action.payload;
      return {
        ...state,
        changes: {
          ...state.changes,
          upgradePrompts: [...state.changes.upgradePrompts, prompt],
          lastUpgradePrompt: new Date(),
        },
        ui: {
          ...state.ui,
          showUpgradeModal: true,
          selectedUpgradePlan: prompt.targetPlan,
        },
      };
    }

    case 'UPGRADE_PROMPT_DISMISS': {
      const promptId = action.payload;
      return {
        ...state,
        changes: {
          ...state.changes,
          upgradePrompts: state.changes.upgradePrompts.map(prompt =>
            prompt.id === promptId ? { ...prompt, dismissedAt: new Date() } : prompt
          ),
        },
        ui: {
          ...state.ui,
          showUpgradeModal: false,
          selectedUpgradePlan: null,
        },
      };
    }

    // =============================================================================
    // DEFAULT CASE
    // =============================================================================
    default:
      return state;
  }
};
