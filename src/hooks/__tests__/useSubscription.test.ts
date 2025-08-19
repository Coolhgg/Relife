/**
 * Unit tests for useSubscription hook
 * Tests subscription management, feature access, billing operations, and premium functionality
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import useSubscription from "../useSubscription";
import {
  renderHookWithProviders,
  createMockSubscription,
  clearAllMocks,
} from "../../__tests__/utils/hook-testing-utils";
import type {
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
} from "../../types/premium";

// Mock services
jest.mock("../../services/subscription-service", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      getSubscriptionDashboard: jest.fn(),
      getFeatureAccess: jest.fn(),
      getUserTier: jest.fn(),
      createSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      trackFeatureUsage: jest.fn(),
      startFreeTrial: jest.fn(),
      validateDiscountCode: jest.fn(),
    })),
  },
}));

jest.mock("../../services/stripe-service", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      addPaymentMethod: jest.fn(),
      removePaymentMethod: jest.fn(),
    })),
  },
}));

jest.mock("../../services/error-handler", () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

jest.mock("../../services/analytics", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      trackFeatureUsage: jest.fn(),
      trackError: jest.fn(),
    })),
  },
}));

describe("useSubscription Hook", () => {
  const mockUserId = "test-user-123";
  const mockSubscription = createMockSubscription();

  const mockFeatureAccess: FeatureAccess = {
    userId: mockUserId,
    tier: "premium",
    features: {
      "advanced-alarms": {
        hasAccess: true,
        usageLimit: 100,
        usageCount: 50,
        upgradeRequired: null,
      },
      "unlimited-snooze": {
        hasAccess: true,
        usageLimit: null,
        usageCount: undefined,
        upgradeRequired: null,
      },
      "voice-customization": {
        hasAccess: false,
        usageLimit: null,
        usageCount: undefined,
        upgradeRequired: "pro",
      },
    },
    lastUpdated: new Date(),
  };

  const mockPlan: SubscriptionPlan = {
    id: "plan_premium",
    name: "Premium Plan",
    tier: "premium",
    pricing: {
      monthly: { amount: 999, currency: "usd" },
      yearly: { amount: 9999, currency: "usd" },
    },
    features: ["advanced-alarms", "unlimited-snooze"],
    limits: {
      alarms: 100,
      customizations: 50,
    },
    description: "Premium features for power users",
    isPopular: true,
    trialDays: 7,
  };

  const mockUsage: BillingUsage = {
    userId: mockUserId,
    period: {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    features: {
      "advanced-alarms": { count: 50, limit: 100 },
      "api-calls": { count: 1000, limit: 10000 },
    },
    totalUsage: 1050,
    estimatedCost: 999,
  };

  const mockDashboardData = {
    subscription: mockSubscription,
    currentPlan: mockPlan,
    usage: mockUsage,
    availablePlans: [mockPlan],
    paymentMethods: [],
    invoiceHistory: [],
    upcomingInvoice: null,
  };

  beforeEach(() => {
    clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Setup default mock implementations
    const SubscriptionService =
      require("../../services/subscription-service").default;
    const StripeService = require("../../services/stripe-service").default;

    const mockSubscriptionService = {
      getSubscriptionDashboard: jest.fn().mockResolvedValue(mockDashboardData),
      getFeatureAccess: jest.fn().mockResolvedValue(mockFeatureAccess),
      getUserTier: jest.fn().mockResolvedValue("premium" as SubscriptionTier),
      createSubscription: jest.fn().mockResolvedValue({
        success: true,
        subscription: mockSubscription,
      }),
      updateSubscription: jest.fn().mockResolvedValue({ success: true }),
      cancelSubscription: jest.fn().mockResolvedValue({ success: true }),
      trackFeatureUsage: jest.fn().mockResolvedValue(true),
      startFreeTrial: jest.fn().mockResolvedValue({ success: true }),
      validateDiscountCode: jest.fn().mockResolvedValue({ valid: true }),
    };

    const mockStripeService = {
      addPaymentMethod: jest.fn().mockResolvedValue(true),
      removePaymentMethod: jest.fn().mockResolvedValue(true),
    };

    SubscriptionService.getInstance.mockReturnValue(mockSubscriptionService);
    StripeService.getInstance.mockReturnValue(mockStripeService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      expect(result.current.subscription).toBeNull();
      expect(result.current.currentPlan).toBeNull();
      expect(result.current.userTier).toBe("free");
      expect(result.current.featureAccess).toBeNull();
      expect(result.current.usage).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.availablePlans).toEqual([]);
      expect(result.current.paymentMethods).toEqual([]);
      expect(result.current.invoiceHistory).toEqual([]);
    });

    it("should load subscription data on initialization", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.subscription).toEqual(mockSubscription);
      expect(result.current.currentPlan).toEqual(mockPlan);
      expect(result.current.userTier).toBe("premium");
      expect(result.current.featureAccess).toEqual(mockFeatureAccess);
      expect(result.current.usage).toEqual(mockUsage);
    });

    it("should handle initialization errors", async () => {
      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.getSubscriptionDashboard.mockRejectedValue(
        new Error("API Error"),
      );

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.error).toBe(
        "Failed to load subscription data. Please refresh the page.",
      );
      expect(result.current.subscription).toBeNull();
    });

    it("should not initialize without userId", () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: "" }),
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe("Subscription Creation", () => {
    it("should create subscription successfully", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: CreateSubscriptionRequest = {
        planId: "plan_premium",
        billingInterval: "monthly",
        paymentMethodId: "pm_123456",
      };

      let createResult;
      await act(async () => {
        createResult = await result.current.createSubscription(request);
      });

      expect(createResult).toEqual({
        success: true,
        requiresAction: false,
      });
      expect(result.current.uiState.currentStep).toBe("complete");
    });

    it("should handle subscription creation with payment action required", async () => {
      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.createSubscription.mockResolvedValue({
        success: true,
        subscription: mockSubscription,
        clientSecret: "pi_123456_secret_xyz",
      });

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: CreateSubscriptionRequest = {
        planId: "plan_premium",
        billingInterval: "monthly",
        paymentMethodId: "pm_123456",
      };

      let createResult;
      await act(async () => {
        createResult = await result.current.createSubscription(request);
      });

      expect(createResult).toEqual({
        success: true,
        requiresAction: true,
      });
      expect(result.current.uiState.paymentIntent).toBeDefined();
    });

    it("should handle subscription creation errors", async () => {
      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.createSubscription.mockResolvedValue({
        success: false,
        error: "Payment failed",
      });

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: CreateSubscriptionRequest = {
        planId: "plan_premium",
        billingInterval: "monthly",
        paymentMethodId: "pm_invalid",
      };

      let createResult;
      await act(async () => {
        createResult = await result.current.createSubscription(request);
      });

      expect(createResult).toEqual({
        success: false,
        error: "Payment failed",
      });
      expect(result.current.uiState.errors.general).toBe("Payment failed");
    });
  });

  describe("Subscription Updates", () => {
    it("should update subscription successfully", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: UpdateSubscriptionRequest = {
        planId: "plan_pro",
      };

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateSubscription(request);
      });

      expect(updateResult).toEqual({ success: true });
    });

    it("should handle update without active subscription", async () => {
      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.getSubscriptionDashboard.mockResolvedValue({
        ...mockDashboardData,
        subscription: null,
      });

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: UpdateSubscriptionRequest = {
        planId: "plan_pro",
      };

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateSubscription(request);
      });

      expect(updateResult).toEqual({
        success: false,
        error: "No active subscription found",
      });
    });
  });

  describe("Subscription Cancellation", () => {
    it("should cancel subscription successfully", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: CancelSubscriptionRequest = {
        reason: "no_longer_needed",
        feedback: "Found a different solution",
      };

      let cancelResult;
      await act(async () => {
        cancelResult = await result.current.cancelSubscription(request);
      });

      expect(cancelResult).toEqual({ success: true });
    });

    it("should handle cancellation with retention offer", async () => {
      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      const retentionOffer = {
        discountPercentage: 50,
        durationMonths: 3,
      };
      mockService.cancelSubscription.mockResolvedValue({
        success: true,
        retentionOffer,
      });

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: CancelSubscriptionRequest = {
        reason: "too_expensive",
      };

      let cancelResult;
      await act(async () => {
        cancelResult = await result.current.cancelSubscription(request);
      });

      expect(cancelResult).toEqual({
        success: true,
        retentionOffer,
      });
    });
  });

  describe("Feature Access", () => {
    it("should check feature access correctly", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Feature with access
      expect(result.current.hasFeatureAccess("advanced-alarms")).toBe(true);

      // Feature without access
      expect(result.current.hasFeatureAccess("voice-customization")).toBe(
        false,
      );

      // Non-existent feature
      expect(result.current.hasFeatureAccess("non-existent")).toBe(false);
    });

    it("should respect usage limits", async () => {
      const limitedFeatureAccess: FeatureAccess = {
        ...mockFeatureAccess,
        features: {
          "limited-feature": {
            hasAccess: true,
            usageLimit: 10,
            usageCount: 10, // At limit
            upgradeRequired: null,
          },
        },
      };

      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.getFeatureAccess.mockResolvedValue(limitedFeatureAccess);

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.hasFeatureAccess("limited-feature")).toBe(false);
    });

    it("should track feature usage", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.trackFeatureUsage("advanced-alarms", 2);
      });

      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      expect(mockService.trackFeatureUsage).toHaveBeenCalledWith(
        mockUserId,
        "advanced-alarms",
        2,
      );
    });

    it("should get upgrade requirement", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.getUpgradeRequirement("voice-customization")).toBe(
        "pro",
      );
      expect(result.current.getUpgradeRequirement("advanced-alarms")).toBe(
        null,
      );
    });
  });

  describe("Payment Methods", () => {
    it("should add payment method", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addPaymentMethod("pm_123456");
      });

      expect(addResult).toEqual({ success: true });
    });

    it("should remove payment method", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let removeResult;
      await act(async () => {
        removeResult = await result.current.removePaymentMethod("pm_123456");
      });

      expect(removeResult).toEqual({ success: true });
    });

    it("should set default payment method", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let setDefaultResult;
      await act(async () => {
        setDefaultResult =
          await result.current.setDefaultPaymentMethod("pm_123456");
      });

      expect(setDefaultResult).toEqual({ success: true });
    });
  });

  describe("Trials and Discounts", () => {
    it("should start free trial", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let trialResult;
      await act(async () => {
        trialResult = await result.current.startFreeTrial("plan_premium");
      });

      expect(trialResult).toEqual({ success: true });
    });

    it("should validate discount code", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateDiscountCode("SAVE20");
      });

      expect(validationResult).toEqual({ valid: true });
    });

    it("should handle invalid discount code", async () => {
      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.validateDiscountCode.mockResolvedValue({
        valid: false,
        error: "Invalid discount code",
      });

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateDiscountCode("INVALID");
      });

      expect(validationResult).toEqual({
        valid: false,
        error: "Invalid discount code",
      });
    });
  });

  describe("Plan Comparison", () => {
    it("should compare plans correctly", async () => {
      const proPlan: SubscriptionPlan = {
        ...mockPlan,
        id: "plan_pro",
        tier: "pro",
        pricing: {
          monthly: { amount: 1999, currency: "usd" },
          yearly: { amount: 19999, currency: "usd" },
        },
      };

      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();
      mockService.getSubscriptionDashboard.mockResolvedValue({
        ...mockDashboardData,
        availablePlans: [mockPlan, proPlan],
      });

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const comparison = result.current.comparePlans("premium", "pro");

      expect(comparison.isUpgrade).toBe(true);
      expect(comparison.isDowngrade).toBe(false);
      expect(comparison.priceDifference).toBe(1000); // 1999 - 999
    });

    it("should handle downgrade comparison", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const comparison = result.current.comparePlans("premium", "free");

      expect(comparison.isUpgrade).toBe(false);
      expect(comparison.isDowngrade).toBe(true);
    });
  });

  describe("Auto-refresh", () => {
    it("should auto-refresh subscription data", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({
          userId: mockUserId,
          autoRefresh: true,
          refreshInterval: 1000, // 1 second for testing
        }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();

      // Clear previous calls
      mockService.getSubscriptionDashboard.mockClear();

      // Fast-forward time to trigger refresh
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockService.getSubscriptionDashboard).toHaveBeenCalled();
      });
    });

    it("should not auto-refresh when disabled", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({
          userId: mockUserId,
          autoRefresh: false,
        }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();

      // Clear previous calls
      mockService.getSubscriptionDashboard.mockClear();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300000); // 5 minutes
      });

      // Should not have made additional calls
      expect(mockService.getSubscriptionDashboard).not.toHaveBeenCalled();
    });
  });

  describe("Utility Functions", () => {
    it("should refresh subscription data manually", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const SubscriptionService =
        require("../../services/subscription-service").default;
      const mockService = SubscriptionService.getInstance();

      // Clear previous calls
      mockService.getSubscriptionDashboard.mockClear();

      await act(async () => {
        await result.current.refreshSubscription();
      });

      expect(mockService.getSubscriptionDashboard).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it("should clear errors", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should reset UI state", async () => {
      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      act(() => {
        result.current.resetUIState();
      });

      expect(result.current.uiState.selectedPlan).toBeUndefined();
      expect(result.current.uiState.isLoading).toBe(false);
      expect(result.current.uiState.isProcessingPayment).toBe(false);
      expect(result.current.uiState.currentStep).toBe("plan_selection");
    });
  });

  describe("Analytics Integration", () => {
    it("should track subscription creation success", async () => {
      const AnalyticsService = require("../../services/analytics").default;
      const mockAnalytics = { trackFeatureUsage: jest.fn() };
      AnalyticsService.getInstance.mockReturnValue(mockAnalytics);

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId, enableAnalytics: true }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const request: CreateSubscriptionRequest = {
        planId: "plan_premium",
        billingInterval: "monthly",
        paymentMethodId: "pm_123456",
      };

      await act(async () => {
        await result.current.createSubscription(request);
      });

      expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalledWith(
        "subscription_created_success",
        undefined,
        {
          userId: mockUserId,
          planId: "plan_premium",
          billingInterval: "monthly",
        },
      );
    });

    it("should not track when analytics disabled", async () => {
      const AnalyticsService = require("../../services/analytics").default;
      const mockAnalytics = { trackFeatureUsage: jest.fn() };
      AnalyticsService.getInstance.mockReturnValue(mockAnalytics);

      const { result } = renderHookWithProviders(() =>
        useSubscription({ userId: mockUserId, enableAnalytics: false }),
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Analytics should not be initialized when disabled
      expect(AnalyticsService.getInstance).not.toHaveBeenCalled();
    });
  });
});
