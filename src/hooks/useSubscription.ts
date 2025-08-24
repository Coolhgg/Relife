/// <reference types="node" />
// Premium Subscription React Hook for Relife Alarm App
// Manages subscription state, feature access, and billing operations

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionTier,
  FeatureAccess,
  BillingUsage,
  PaymentMethod,
  Invoice,
  Trial,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  SubscriptionDashboardData,
  PremiumUIState,
} from '../types/premium';
import SubscriptionService from '../services/subscription-service';
import StripeService from '../services/stripe-service';
import { ErrorHandler } from '../services/error-handler';
import AnalyticsService from '../services/analytics';
import { TimeoutHandle } from '../types/timers';

interface SubscriptionHookState {
  // Core subscription data
  subscription: Subscription | null;
  currentPlan: SubscriptionPlan | null;
  userTier: SubscriptionTier;
  featureAccess: FeatureAccess | null;
  usage: BillingUsage | null;

  // UI state
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  uiState: PremiumUIState;

  // Available data
  availablePlans: SubscriptionPlan[];
  paymentMethods: PaymentMethod[];
  invoiceHistory: Invoice[];
  upcomingInvoice: Invoice | null;

  // Trial and discounts
  activeTrial: Trial | null;
  availableDiscounts: string[];
}

interface SubscriptionHookActions {
  // Core subscription actions
  createSubscription: (
    request: CreateSubscriptionRequest
  ) => Promise<{ success: boolean; error?: string; requiresAction?: boolean }>;
  updateSubscription: (
    request: UpdateSubscriptionRequest
  ) => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: (
    request: CancelSubscriptionRequest
  ) => Promise<{ success: boolean; error?: string; retentionOffer?: any }>;

  // Feature access
  hasFeatureAccess: (featureId: string) => boolean;
  trackFeatureUsage: (featureId: string, amount?: number) => Promise<void>;
  getUpgradeRequirement: (featureId: string) => SubscriptionTier | null;

  // Payment methods
  addPaymentMethod: (
    paymentMethodId: string
  ) => Promise<{ success: boolean; error?: string }>;
  removePaymentMethod: (
    paymentMethodId: string
  ) => Promise<{ success: boolean; error?: string }>;
  setDefaultPaymentMethod: (
    paymentMethodId: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Trials and discounts
  startFreeTrial: (planId: string) => Promise<{ success: boolean; error?: string }>;
  validateDiscountCode: (code: string) => Promise<{ valid: boolean; error?: string }>;

  // Utility functions
  refreshSubscription: () => Promise<void>;
  clearError: () => void;
  resetUIState: () => void;

  // Plan comparison
  comparePlans: (
    currentPlanId: string,
    targetPlanId: string
  ) => {
    isUpgrade: boolean;
    isDowngrade: boolean;
    priceDifference: number;
    newFeatures: string[];
    removedFeatures: string[];
  };
}

interface UseSubscriptionOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAnalytics?: boolean;
}

function useSubscription(
  options: UseSubscriptionOptions
): SubscriptionHookState & SubscriptionHookActions {
  const {
    userId,
    autoRefresh = true,
    refreshInterval = 300000,
    enableAnalytics = true,
  } = options;

  const [state, setState] = useState<SubscriptionHookState>({
    subscription: null,
    currentPlan: null,
    userTier: 'free',
    featureAccess: null,
    usage: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    uiState: {
      selectedPlan: undefined,
      isLoading: false,
      isProcessingPayment: false,
      showPaymentModal: false,
      showCancelModal: false,
      showUpgradeModal: false,
      errors: {},
      currentStep: 'plan_selection',
      paymentIntent: undefined,
    },
    availablePlans: [],
    paymentMethods: [],
    invoiceHistory: [],
    upcomingInvoice: null,
    activeTrial: null,
    availableDiscounts: [],
  });

  const subscriptionService = useRef(SubscriptionService.getInstance());
  const stripeService = useRef(StripeService.getInstance());
  const refreshTimeoutRef = useRef<TimeoutHandle | null>(null);
  const analytics = useRef(enableAnalytics ? AnalyticsService.getInstance() : null);

  // Initialize subscription data
  useEffect(() => {
    const initializeSubscription = async () => {
      if (!userId) return;

      setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: true, error: null }));

      try {
        const dashboardData =
          await subscriptionService.current.getSubscriptionDashboard(userId);
        const featureAccess =
          await subscriptionService.current.getFeatureAccess(userId);
        const userTier = await subscriptionService.current.getUserTier(userId);

        setState((prev: any) => ({ // auto: implicit any
          ...prev,
          subscription: dashboardData.subscription,
          currentPlan: dashboardData.currentPlan,
          userTier,
          featureAccess,
          usage: dashboardData.usage,
          availablePlans: dashboardData.availablePlans,
          paymentMethods: dashboardData.paymentMethods,
          invoiceHistory: dashboardData.invoiceHistory,
          upcomingInvoice: dashboardData.upcomingInvoice,
          isLoading: false,
          isInitialized: true,
        }));

        if (analytics.current) {
          analytics.current.trackFeatureUsage('subscription_data_loaded', undefined, {
            userId,
            tier: userTier,
            hasActiveSubscription: !!dashboardData.subscription,
          });
        }
      } catch (error) {
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to initialize subscription data',
          { context: 'useSubscription_init', metadata: { userId } }
        );

        setState((prev: any) => ({ // auto: implicit any
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: 'Failed to load subscription data. Please refresh the page.',
        }));
      }
    };

    initializeSubscription();
  }, [userId]);

  // Auto-refresh subscription data
  useEffect(() => {
    if (!autoRefresh || !state.isInitialized) return;

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(async () => {
        await refreshSubscription();
        scheduleRefresh();
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, state.isInitialized]);

  // Subscription actions
  const createSubscription = useCallback(
    async (request: CreateSubscriptionRequest) => {
      setState((prev: any) => ({ // auto: implicit any
        ...prev,
        uiState: {
          ...prev.uiState,
          isProcessingPayment: true,
          errors: {},
          currentStep: 'processing',
        },
      }));

      try {
        const result = await subscriptionService.current.createSubscription(
          userId,
          request
        );

        if (result.success && result.subscription) {
          // Refresh subscription data
          await refreshSubscription();

          setState((prev: any) => ({ // auto: implicit any
            ...prev,
            uiState: {
              ...prev.uiState,
              isProcessingPayment: false,
              currentStep: 'complete',
              paymentIntent: result.clientSecret
                ? {
                    clientSecret: result.clientSecret,
                    status: 'succeeded',
                  }
                : undefined,
            },
          }));

          if (analytics.current) {
            analytics.current.trackFeatureUsage(
              'subscription_created_success',
              undefined,
              {
                userId,
                planId: request.planId,
                billingInterval: request.billingInterval,
              }
            );
          }

          return {
            success: true,
            requiresAction: !!result.clientSecret,
          };
        } else {
          setState((prev: any) => ({ // auto: implicit any
            ...prev,
            uiState: {
              ...prev.uiState,
              isProcessingPayment: false,
              currentStep: 'plan_selection',
              errors: { general: result.error || 'Failed to create subscription' },
            },
          }));

          return {
            success: false,
            error: result.error || 'Failed to create subscription',
          };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        setState((prev: any) => ({ // auto: implicit any
          ...prev,
          uiState: {
            ...prev.uiState,
            isProcessingPayment: false,
            currentStep: 'plan_selection',
            errors: { general: errorMessage },
          },
        }));

        return { success: false, error: errorMessage };
      }
    },
    [userId]
  );

  const updateSubscription = useCallback(
    async (request: UpdateSubscriptionRequest) => {
      if (!state.subscription) {
        return { success: false, error: 'No active subscription found' };
      }

      setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: true, error: null }));

      try {
        const result = await subscriptionService.current.updateSubscription(
          userId,
          state.subscription.id,
          request
        );

        if (result.success) {
          await refreshSubscription();

          if (analytics.current) {
            analytics.current.trackFeatureUsage(
              'subscription_updated_success',
              undefined,
              {
                userId,
                changeType: request.planId ? 'plan_change' : 'billing_change',
              }
            );
          }
        }

        setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: false }));
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update subscription';
        setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },
    [userId, state.subscription]
  );

  const cancelSubscription = useCallback(
    async (request: CancelSubscriptionRequest) => {
      if (!state.subscription) {
        return { success: false, error: 'No active subscription found' };
      }

      setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: true, error: null }));

      try {
        const result = await subscriptionService.current.cancelSubscription(
          userId,
          state.subscription.id,
          request
        );

        if (result.success) {
          await refreshSubscription();

          if (analytics.current) {
            analytics.current.trackFeatureUsage(
              'subscription_canceled_success',
              undefined,
              {
                userId,
                reason: request.reason,
              }
            );
          }
        }

        setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: false }));
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to cancel subscription';
        setState((prev: any) => ({ // auto: implicit any ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },
    [userId, state.subscription]
  );

  // Feature access functions
  const hasFeatureAccess = useCallback(
    (featureId: string): boolean => {
      if (!state.featureAccess) return false;

      const feature = state.featureAccess.features[featureId];
      if (!feature) return false;

      // Check if user has access
      if (!feature.hasAccess) return false;

      // Check usage limits
      if (feature.usageLimit && feature.usageCount !== undefined) {
        return feature.usageCount < feature.usageLimit;
      }

      return true;
    },
    [state.featureAccess]
  );

  const trackFeatureUsage = useCallback(
    async (featureId: string, amount: number = 1) => {
      try {
        await subscriptionService.current.trackFeatureUsage(userId, featureId, amount);

        // Update local feature access cache
        if (state.featureAccess) {
          const updatedFeatureAccess =
            await subscriptionService.current.getFeatureAccess(userId);
          setState((prev: any) => ({ // auto: implicit any ...prev, featureAccess: updatedFeatureAccess }));
        }
      } catch (error) {
        console.error('Failed to track feature usage:', error);
      }
    },
    [userId, state.featureAccess]
  );

  const getUpgradeRequirement = useCallback(
    (featureId: string) => {
      if (!state.featureAccess) return null;

      const feature = state.featureAccess.features[featureId];
      return feature?.upgradeRequired || null;
    },
    [state.featureAccess]
  );

  // Payment method functions
  const addPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        await stripeService.current.addPaymentMethod(userId, paymentMethodId);
        await refreshSubscription();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to add payment method',
        };
      }
    },
    [userId]
  );

  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      await stripeService.current.removePaymentMethod(paymentMethodId);
      await refreshSubscription();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove payment method',
      };
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    // Implementation would depend on your backend API
    try {
      // Call API to set default payment method
      await refreshSubscription();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to set default payment method',
      };
    }
  }, []);

  // Trial and discount functions
  const startFreeTrial = useCallback(
    async (planId: string) => {
      try {
        const result = await subscriptionService.current.startFreeTrial(userId, planId);

        if (result.success) {
          await refreshSubscription();
        }

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start free trial',
        };
      }
    },
    [userId]
  );

  const validateDiscountCode = useCallback(
    async (code: string) => {
      try {
        return await subscriptionService.current.validateDiscountCode(userId, code);
      } catch (error) {
        return {
          valid: false,
          error:
            error instanceof Error ? error.message : 'Failed to validate discount code',
        };
      }
    },
    [userId]
  );

  // Utility functions
  const refreshSubscription = useCallback(async () => {
    try {
      const [dashboardData, featureAccess, userTier] = await Promise.all([
        subscriptionService.current.getSubscriptionDashboard(userId),
        subscriptionService.current.getFeatureAccess(userId),
        subscriptionService.current.getUserTier(userId),
      ]);

      setState((prev: any) => ({ // auto: implicit any
        ...prev,
        subscription: dashboardData.subscription,
        currentPlan: dashboardData.currentPlan,
        userTier,
        featureAccess,
        usage: dashboardData.usage,
        paymentMethods: dashboardData.paymentMethods,
        invoiceHistory: dashboardData.invoiceHistory,
        upcomingInvoice: dashboardData.upcomingInvoice,
      }));
    } catch (error) {
      console.error('Failed to refresh subscription data:', error);
    }
  }, [userId]);

  const clearError = useCallback(() => {
    setState((prev: any) => ({ // auto: implicit any ...prev, error: null }));
  }, []);

  const resetUIState = useCallback(() => {
    setState((prev: any) => ({ // auto: implicit any
      ...prev,
      uiState: {
        selectedPlan: undefined,
        isLoading: false,
        isProcessingPayment: false,
        showPaymentModal: false,
        showCancelModal: false,
        showUpgradeModal: false,
        errors: {},
        currentStep: 'plan_selection',
        paymentIntent: undefined,
      },
    }));
  }, []);

  // Plan comparison function
  const comparePlans = useCallback(
    (currentTier: SubscriptionTier, targetTier: SubscriptionTier) => {
      const tierHierarchy: SubscriptionTier[] = [
        'free',
        'basic',
        'premium',
        'pro',
        'enterprise',
      ];
      const currentLevel = tierHierarchy.indexOf(currentTier);
      const targetLevel = tierHierarchy.indexOf(targetTier);

      const currentPlan = state.availablePlans.find((p: any) => p.tier === currentTier);
      const targetPlan = state.availablePlans.find((p: any) => p.tier === targetTier);

      const currentPrice = currentPlan?.pricing.monthly?.amount || 0;
      const targetPrice = targetPlan?.pricing.monthly?.amount || 0;

      return {
        isUpgrade: targetLevel > currentLevel,
        isDowngrade: targetLevel < currentLevel,
        priceDifference: targetPrice - currentPrice,
        newFeatures: [], // Implement feature comparison logic
        removedFeatures: [], // Implement feature comparison logic
      };
    },
    [state.availablePlans]
  );

  return {
    // State
    ...state,

    // Actions
    createSubscription,
    updateSubscription,
    cancelSubscription,
    hasFeatureAccess,
    trackFeatureUsage,
    getUpgradeRequirement,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    startFreeTrial,
    validateDiscountCode,
    refreshSubscription,
    clearError,
    resetUIState,
    comparePlans,
  };
}

export default useSubscription;
