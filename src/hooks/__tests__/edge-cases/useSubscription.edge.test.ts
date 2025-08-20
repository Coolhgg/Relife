import { renderHook, act } from "@testing-library/react";
import { useSubscription } from "../../useSubscription";

// Mock dependencies
jest.mock("../../../services/subscription-service", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getSubscription: jest.fn(),
      createSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      getPaymentMethods: jest.fn(),
      addPaymentMethod: jest.fn(),
      removePaymentMethod: jest.fn(),
      setDefaultPaymentMethod: jest.fn(),
      validatePromoCode: jest.fn(),
      applyPromoCode: jest.fn(),
    }),
  },
}));

jest.mock("../../../services/stripe-service", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      createSetupIntent: jest.fn(),
      updatePaymentMethod: jest.fn(),
      handle3DSecureAuthentication: jest.fn(),
    }),
  },
}));

jest.mock("../../../services/error-handler", () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

jest.mock("../../useAnalytics", () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackFeatureUsage: jest.fn(),
  }),
  ANALYTICS_EVENTS: {
    SUBSCRIPTION_CREATED: "subscription_created",
    SUBSCRIPTION_CANCELLED: "subscription_cancelled",
    PAYMENT_FAILED: "payment_failed",
  },
}));

describe("useSubscription Edge Cases and Stress Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Payment Processing Edge Cases", () => {
    it("should handle payment failure with retry mechanism", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let attemptCount = 0;
      mockSubscriptionService.createSubscription.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error("Payment failed"));
        }
        return Promise.resolve({
          id: "sub-123",
          status: "active",
          tier: "pro",
        });
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.createSubscription("pro", "pm_test_card");
      });

      expect(attemptCount).toBe(3);
      expect(result.current.subscription?.status).toBe("active");
    });

    it("should handle 3D Secure authentication flow", async () => {
      const StripeService = require("../../../services/stripe-service").default;
      const mockStripeService = StripeService.getInstance();

      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: "pi_test",
        status: "requires_action",
        next_action: {
          type: "use_stripe_sdk",
          use_stripe_sdk: {
            type: "three_d_secure_redirect",
          },
        },
      });

      mockStripeService.handle3DSecureAuthentication.mockResolvedValue({
        id: "pi_test",
        status: "succeeded",
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.processPayment({
          amount: 999,
          currency: "usd",
          paymentMethodId: "pm_test_card",
        });
      });

      expect(mockStripeService.handle3DSecureAuthentication).toHaveBeenCalled();
    });

    it("should handle corrupted payment method data", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      // Return corrupted payment methods
      mockSubscriptionService.getPaymentMethods.mockResolvedValue([
        { id: null, type: undefined, last4: "invalid" }, // Invalid data
        { id: "pm_valid", type: "card", last4: "4242" }, // Valid data
        "invalid-payment-method-format", // Wrong format
      ]);

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.loadPaymentMethods();
      });

      // Should filter out invalid payment methods
      const validMethods = result.current.paymentMethods.filter(
        (method) => method && typeof method === "object" && method.id,
      );
      expect(validMethods).toHaveLength(1);
      expect(validMethods[0].id).toBe("pm_valid");
    });
  });

  describe("Subscription State Race Conditions", () => {
    it("should handle concurrent subscription operations", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let operationCount = 0;
      mockSubscriptionService.updateSubscription.mockImplementation(
        (id, updates) => {
          operationCount++;
          return new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  id,
                  ...updates,
                  updated_at: new Date().toISOString(),
                }),
              100 + Math.random() * 100,
            );
          });
        },
      );

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        // Fire multiple concurrent updates
        const promises = [
          result.current.updateSubscription("sub-123", { tier: "pro" }),
          result.current.updateSubscription("sub-123", { tier: "basic" }),
          result.current.updateSubscription("sub-123", { tier: "pro" }),
        ];

        await Promise.allSettled(promises);
      });

      expect(operationCount).toBe(3);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle subscription cancellation during upgrade", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      mockSubscriptionService.updateSubscription.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "sub-123",
                  tier: "pro",
                  status: "active",
                }),
              200,
            ),
          ),
      );

      mockSubscriptionService.cancelSubscription.mockResolvedValue({
        id: "sub-123",
        status: "cancelled",
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        // Start upgrade
        const upgradePromise = result.current.updateSubscription("sub-123", {
          tier: "pro",
        });

        // Cancel before upgrade completes
        setTimeout(() => {
          result.current.cancelSubscription("sub-123");
        }, 50);

        await Promise.allSettled([upgradePromise]);
      });

      // Should handle conflicting operations gracefully
      expect(result.current.error).not.toContain("conflict");
    });
  });

  describe("Network and API Failures", () => {
    it("should handle intermittent network failures", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let failureCount = 0;
      mockSubscriptionService.getSubscription.mockImplementation(() => {
        failureCount++;
        if (failureCount <= 2) {
          return Promise.reject(new Error("Network timeout"));
        }
        return Promise.resolve({
          id: "sub-123",
          status: "active",
          tier: "pro",
        });
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        // Should retry automatically
        await result.current.refreshSubscription();
      });

      expect(failureCount).toBe(3);
      expect(result.current.subscription?.status).toBe("active");
    });

    it("should handle API rate limiting", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      mockSubscriptionService.createSubscription.mockRejectedValue(
        new Error("Rate limit exceeded"),
      );

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.createSubscription("pro", "pm_test_card");
      });

      expect(result.current.error).toContain("rate limit");

      // Should provide retry mechanism
      await act(async () => {
        jest.advanceTimersByTime(60000); // Advance 1 minute
        mockSubscriptionService.createSubscription.mockResolvedValue({
          id: "sub-123",
          status: "active",
        });

        await result.current.retryLastOperation();
      });

      expect(result.current.subscription?.status).toBe("active");
    });

    it("should handle Stripe webhook delays", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      // Initial payment intent creation
      mockSubscriptionService.createSubscription.mockResolvedValue({
        id: "sub-123",
        status: "incomplete",
        payment_intent: {
          id: "pi_test",
          status: "processing",
        },
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.createSubscription("pro", "pm_test_card");
      });

      expect(result.current.subscription?.status).toBe("incomplete");

      // Simulate webhook processing delay
      await act(async () => {
        jest.advanceTimersByTime(30000); // 30 seconds

        // Mock webhook update
        mockSubscriptionService.getSubscription.mockResolvedValue({
          id: "sub-123",
          status: "active",
          tier: "pro",
        });

        await result.current.pollSubscriptionStatus("sub-123");
      });

      expect(result.current.subscription?.status).toBe("active");
    });
  });

  describe("Data Corruption and Invalid States", () => {
    it("should handle corrupted subscription data", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      // Return corrupted subscription data
      mockSubscriptionService.getSubscription.mockResolvedValue({
        id: undefined,
        status: "invalid_status",
        tier: null,
        expires_at: "invalid-date",
        metadata: "not-an-object",
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.refreshSubscription();
      });

      // Should handle corrupted data gracefully
      expect(result.current.error).not.toContain("TypeError");
      expect(result.current.subscription).toBeNull(); // Should fallback to null
    });

    it("should handle missing required fields", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      // Return subscription missing critical fields
      mockSubscriptionService.getSubscription.mockResolvedValue({
        // Missing id, status, tier
        created_at: "2023-01-01T00:00:00Z",
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.refreshSubscription();
      });

      // Should validate data structure
      expect(result.current.subscription).toBeNull();
    });
  });

  describe("Memory Leaks and Performance", () => {
    it("should handle rapid subscription polling without memory leaks", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let callCount = 0;
      mockSubscriptionService.getSubscription.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: "sub-123",
          status: "active",
          tier: "pro",
          call_count: callCount,
        });
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        // Enable aggressive polling
        result.current.enableAutoRefresh(1000); // 1 second intervals

        // Fast forward through many polling cycles
        for (let i = 0; i < 100; i++) {
          jest.advanceTimersByTime(1000);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        result.current.disableAutoRefresh();
      });

      expect(callCount).toBeGreaterThan(90);
      expect(result.current.isLoading).toBe(false);
    });

    it("should cleanup polling on unmount", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let callCount = 0;
      mockSubscriptionService.getSubscription.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: "sub-123", status: "active" });
      });

      const { result, unmount } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        result.current.enableAutoRefresh(500);
        jest.advanceTimersByTime(1000);
      });

      const callCountBeforeUnmount = callCount;

      unmount();

      await act(async () => {
        jest.advanceTimersByTime(2000); // Should not trigger more calls
      });

      expect(callCount).toBe(callCountBeforeUnmount);
    });
  });

  describe("Promo Code Edge Cases", () => {
    it("should handle expired promo codes", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      mockSubscriptionService.validatePromoCode.mockResolvedValue({
        valid: false,
        error: "expired",
        expires_at: "2023-01-01T00:00:00Z",
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.validatePromoCode("EXPIRED2023");
      });

      expect(result.current.promoCodeError).toContain("expired");
    });

    it("should handle promo code usage limits", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      mockSubscriptionService.applyPromoCode.mockRejectedValue(
        new Error("Promo code usage limit exceeded"),
      );

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.applyPromoCode("LIMITREACHED");
      });

      expect(result.current.error).toContain("usage limit");
    });

    it("should handle concurrent promo code applications", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let applicationCount = 0;
      mockSubscriptionService.applyPromoCode.mockImplementation((code) => {
        applicationCount++;
        return Promise.resolve({
          discount: { percent: 50 },
          code: code,
          applied_at: new Date().toISOString(),
        });
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        // Try to apply multiple codes simultaneously
        const promises = [
          result.current.applyPromoCode("FIRST50"),
          result.current.applyPromoCode("SECOND25"),
          result.current.applyPromoCode("THIRD10"),
        ];

        await Promise.allSettled(promises);
      });

      // Should handle gracefully (typically only one would succeed)
      expect(applicationCount).toBeGreaterThan(0);
    });
  });

  describe("Stress Testing", () => {
    it("should handle high frequency subscription updates", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      let updateCount = 0;
      mockSubscriptionService.updateSubscription.mockImplementation(
        (id, updates) => {
          updateCount++;
          return Promise.resolve({
            id,
            ...updates,
            update_number: updateCount,
          });
        },
      );

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        // Fire 100 rapid updates
        const promises = Array(100)
          .fill(null)
          .map((_, index) =>
            result.current.updateSubscription("sub-123", {
              metadata: { update: index },
            }),
          );

        await Promise.allSettled(promises);
      });

      expect(updateCount).toBe(100);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle large payment method collections", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      // Generate 1000 payment methods
      const largePaymentMethodCollection = Array(1000)
        .fill(null)
        .map((_, index) => ({
          id: `pm_${index}`,
          type: "card",
          last4: `${index}`.padStart(4, "0"),
          exp_month: (index % 12) + 1,
          exp_year: 2025 + (index % 10),
        }));

      mockSubscriptionService.getPaymentMethods.mockResolvedValue(
        largePaymentMethodCollection,
      );

      const { result } = renderHook(() => useSubscription("user-123"));

      const startTime = Date.now();
      await act(async () => {
        await result.current.loadPaymentMethods();
      });
      const endTime = Date.now();

      // Should handle large collections efficiently
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
      expect(result.current.paymentMethods).toHaveLength(1000);
    });
  });

  describe("Regression Tests", () => {
    it("should maintain trial period tracking accuracy", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      mockSubscriptionService.getSubscription.mockResolvedValue({
        id: "sub-123",
        status: "trialing",
        tier: "pro",
        trial_end: trialEndDate.toISOString(),
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.refreshSubscription();
      });

      expect(result.current.subscription?.status).toBe("trialing");
      expect(result.current.trialDaysRemaining).toBeCloseTo(7, 0);
    });

    it("should handle subscription renewal edge cases", async () => {
      const SubscriptionService =
        require("../../../services/subscription-service").default;
      const mockSubscriptionService = SubscriptionService.getInstance();

      // Subscription that renews in the next minute
      const renewalDate = new Date();
      renewalDate.setMinutes(renewalDate.getMinutes() + 1);

      mockSubscriptionService.getSubscription.mockResolvedValue({
        id: "sub-123",
        status: "active",
        tier: "pro",
        current_period_end: renewalDate.toISOString(),
      });

      const { result } = renderHook(() => useSubscription("user-123"));

      await act(async () => {
        await result.current.refreshSubscription();

        // Fast forward past renewal
        jest.advanceTimersByTime(120000); // 2 minutes
      });

      // Should handle renewal timing correctly
      expect(result.current.subscription?.status).toBe("active");
    });
  });
});
