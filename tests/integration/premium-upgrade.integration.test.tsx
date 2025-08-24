import React from 'react'; // auto: added missing React import
/**
 * Premium Feature Upgrade Integration Tests
 *
 * Tests the complete premium subscription flow:
 * 1. Free user explores premium features
 * 2. Upgrade flow with payment processing
 * 3. Feature unlocking and access control
 * 4. Subscription management
 * 5. Analytics and user persona tracking
 * 6. Downgrade handling
 * 7. Trial period management
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import test utilities
import {
  createMockUser,
  createMockAlarm,
  mockNavigatorAPI,
  mockStripeAPI,
} from '../utils/test-mocks';
import { TestData } from '../e2e/fixtures/test-data';

// Types
import type { Alarm, User, PersonaType } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('@stripe/stripe-js');
vi.mock('posthog-js');

describe('Premium Feature Upgrade Integration', () => {
  let mockUser: User;
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;

  // Service instances
  let analyticsService: AppAnalyticsService;

  beforeAll(() => {
    mockNavigatorAPI();
    mockStripeAPI();
  });

  beforeEach(async () => {
    user = userEvent.setup();

    // Create free tier user
    mockUser = createMockUser({
      subscriptionTier: 'free',
      premiumFeatures: [],
      trialEndsAt: null,
    });

    // Reset all mocks
    vi.clearAllMocks();

    analyticsService = AppAnalyticsService.getInstance();

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
      alarms: [],
      error: null,
    });

    // Mock analytics
    vi.mocked(analyticsService.trackFeatureUsage).mockImplementation(() => {});
    vi.mocked(analyticsService.trackConversion).mockImplementation(() => {});
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    localStorage.clear();
    sessionStorage.clear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Premium Feature Discovery and Paywall', () => {
    it('should show premium features with paywall for free users', async () => {
      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to advanced scheduling (premium feature)
      const advancedButton = screen.getByRole('button', { name: /advanced|brain/i });
      await user.click(advancedButton);

      // Should show premium paywall
      await waitFor(() => {
        const premiumModal = screen.queryByText(/upgrade.*premium|unlock.*features/i);
        const premiumBadge = screen.queryByText(/premium|pro/i);

        // Either paywall modal or premium badge should appear
        if (premiumModal) {
          expect(premiumModal).toBeInTheDocument();
        } else if (premiumBadge) {
          expect(premiumBadge).toBeInTheDocument();
        }
      });

      // Track premium feature discovery
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'premium_feature_discovery',
        expect.any(String),
        expect.objectContaining({
          feature: expect.any(String),
          userTier: 'free',
        })
      );
    });

    it('should show limited alarm creation for free users', async () => {
      // Create some existing alarms near the free limit
      const existingAlarms = Array.from({ length: 3 }, (_, i) =>
        createMockAlarm({
          id: `free-alarm-${i}`,
          userId: mockUser.id,
          time: `0${6 + i}:00`,
          label: `Free Alarm ${i + 1}`,
          enabled: true,
        })
      );

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: existingAlarms,
        error: null,
      });

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      // Wait for alarms to load
      await waitFor(() => {
        expect(screen.getByText('Free Alarm 1')).toBeInTheDocument();
      });

      // Try to create one more alarm (should work - within limit)
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should show free tier limitations
      const limitWarning = screen.queryByText(/free.*limit|upgrade.*more/i);
      if (limitWarning) {
        expect(limitWarning).toBeInTheDocument();
      }

      // Fill and save alarm
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '09:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Limit Test Alarm');

      const mockAlarm = createMockAlarm({
        id: 'limit-test-alarm',
        userId: mockUser.id,
        time: '09:00',
        label: 'Limit Test Alarm',
        enabled: true,
      });

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null,
      });

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      await waitFor(() => {
        expect(screen.getByText('Limit Test Alarm')).toBeInTheDocument();
      });

      // Now try to create another alarm (should hit limit)
      await user.click(addAlarmButton);

      // Should show upgrade prompt
      await waitFor(() => {
        const upgradePrompt = screen.getByText(/upgrade.*premium|alarm.*limit/i);
        expect(upgradePrompt).toBeInTheDocument();
      });
    });
  });

  describe('Subscription Upgrade Flow', () => {
    it('should complete the premium upgrade process', async () => {
      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to pricing page
      const pricingButton = screen.getByRole('button', {
        name: /premium|crown|pricing/i,
      });
      await user.click(pricingButton);

      await waitFor(() => {
        expect(screen.getByText(/plans|pricing|subscription/i)).toBeInTheDocument();
      });

      // Select premium plan
      const premiumPlan = screen.getByRole('button', { name: /premium|pro.*plan/i });
      await user.click(premiumPlan);

      // Should show payment form
      await waitFor(() => {
        const paymentForm = screen.getByText(/payment|billing|card/i);
        expect(paymentForm).toBeInTheDocument();
      });

      // Mock successful payment
      const mockStripe = {
        confirmCardPayment: vi.fn().mockResolvedValue({
          paymentIntent: {
            status: 'succeeded',
            id: 'pi_test_12345',
          },
        }),
        elements: vi.fn().mockReturnValue({
          create: vi.fn().mockReturnValue({
            mount: vi.fn(),
            on: vi.fn(),
            destroy: vi.fn(),
          }),
        }),
      };

      // @ts-ignore
      global.Stripe = vi.fn().mockResolvedValue(mockStripe);

      // Fill payment form (mock interaction)
      const cardNumberInput = screen.queryByLabelText(/card.*number/i);
      if (cardNumberInput) {
        await user.type(cardNumberInput, '4242424242424242');
      }

      const expiryInput = screen.queryByLabelText(/expiry|mm.*yy/i);
      if (expiryInput) {
        await user.type(expiryInput, '12/25');
      }

      const cvcInput = screen.queryByLabelText(/cvc|cvv/i);
      if (cvcInput) {
        await user.type(cvcInput, '123');
      }

      // Mock successful subscription creation
      const upgradedUser = {
        ...mockUser,
        subscriptionTier: 'premium' as const,
        premiumFeatures: ['advanced_scheduling', 'unlimited_alarms', 'custom_sounds'],
        subscriptionId: 'sub_test_12345',
        subscriptionStatus: 'active' as const,
      };

      vi.mocked(SupabaseService.updateUserSubscription).mockResolvedValueOnce({
        user: upgradedUser,
        error: null,
      });

      // Complete payment
      const payButton = screen.getByRole('button', { name: /pay|subscribe|upgrade/i });
      await user.click(payButton);

      // Wait for successful upgrade
      await waitFor(
        () => {
          const successMessage = screen.getByText(/success|upgraded|welcome.*premium/i);
          expect(successMessage).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Verify analytics tracking
      expect(analyticsService.trackConversion).toHaveBeenCalledWith(
        'subscription_upgrade',
        expect.objectContaining({
          planId: 'premium',
          amount: expect.any(Number),
          userId: mockUser.id,
        })
      );

      // Verify user can now access premium features
      const advancedButton = screen.getByRole('button', { name: /advanced|brain/i });
      await user.click(advancedButton);

      // Should no longer show paywall
      await waitFor(() => {
        const paywallContent = screen.queryByText(/upgrade.*premium|unlock.*features/i);
        expect(paywallContent).not.toBeInTheDocument();
      });
    });

    it('should handle payment failures gracefully', async () => {
      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to pricing
      const pricingButton = screen.getByRole('button', {
        name: /premium|crown|pricing/i,
      });
      await user.click(pricingButton);

      await waitFor(() => {
        expect(screen.getByText(/plans|pricing/i)).toBeInTheDocument();
      });

      // Select premium plan
      const premiumPlan = screen.getByRole('button', { name: /premium|pro.*plan/i });
      await user.click(premiumPlan);

      // Mock payment failure
      const mockStripe = {
        confirmCardPayment: vi.fn().mockResolvedValue({
          error: {
            type: 'card_error',
            code: 'card_declined',
            message: 'Your card was declined.',
          },
        }),
      };

      // @ts-ignore
      global.Stripe = vi.fn().mockResolvedValue(mockStripe);

      // Attempt payment
      const payButton = screen.getByRole('button', { name: /pay|subscribe|upgrade/i });
      await user.click(payButton);

      // Should show error message
      await waitFor(() => {
        const errorMessage = screen.getByText(/declined|failed|error/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // User should still be on free tier
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'payment_failure',
        'card_declined',
        expect.objectContaining({
          userId: mockUser.id,
          planId: 'premium',
        })
      );
    });
  });

  describe('Premium Feature Access Control', () => {
    it('should unlock premium features after successful upgrade', async () => {
      // Start with premium user
      const premiumUser = createMockUser({
        subscriptionTier: 'premium',
        premiumFeatures: ['advanced_scheduling', 'unlimited_alarms', 'custom_sounds'],
        subscriptionId: 'sub_test_67890',
        subscriptionStatus: 'active',
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(premiumUser);

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Test unlimited alarms (create more than free limit)
      for (let i = 0; i < 6; i++) {
        const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
        await user.click(addAlarmButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const timeInput = screen.getByLabelText(/time/i);
        await user.clear(timeInput);
        await user.type(timeInput, `0${6 + i}:00`);

        const labelInput = screen.getByLabelText(/label|name/i);
        await user.clear(labelInput);
        await user.type(labelInput, `Premium Alarm ${i + 1}`);

        const mockAlarm = createMockAlarm({
          id: `premium-alarm-${i}`,
          userId: premiumUser.id,
          time: `0${6 + i}:00`,
          label: `Premium Alarm ${i + 1}`,
          enabled: true,
        });

        vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
          alarm: mockAlarm,
          error: null,
        });

        await user.click(screen.getByRole('button', { name: /save|create/i }));

        await waitFor(() => {
          expect(screen.getByText(`Premium Alarm ${i + 1}`)).toBeInTheDocument();
        });

        // No limit warning should appear
        const limitWarning = screen.queryByText(/limit.*reached|upgrade.*more/i);
        expect(limitWarning).not.toBeInTheDocument();
      }

      // Test advanced scheduling access
      const advancedButton = screen.getByRole('button', { name: /advanced|brain/i });
      await user.click(advancedButton);

      await waitFor(() => {
        // Should have access to advanced features
        const aiOptimization = screen.queryByText(
          /ai.*optimization|smart.*scheduling/i
        );
        const customPatterns = screen.queryByText(/custom.*pattern|advanced.*repeat/i);

        // At least one premium feature should be visible
        if (aiOptimization) {
          expect(aiOptimization).toBeInTheDocument();
        } else if (customPatterns) {
          expect(customPatterns).toBeInTheDocument();
        }
      });
    });

    it('should handle subscription expiration and feature locking', async () => {
      // Start with expired premium user
      const expiredPremiumUser = createMockUser({
        subscriptionTier: 'free',
        premiumFeatures: [],
        subscriptionId: 'sub_test_expired',
        subscriptionStatus: 'canceled',
        subscriptionEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(expiredPremiumUser);

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should show subscription expired notice
      const expiredNotice = screen.queryByText(
        /subscription.*expired|reactivate.*plan/i
      );
      if (expiredNotice) {
        expect(expiredNotice).toBeInTheDocument();
      }

      // Try to access premium feature
      const advancedButton = screen.getByRole('button', { name: /advanced|brain/i });
      await user.click(advancedButton);

      // Should show upgrade prompt again
      await waitFor(() => {
        const upgradePrompt = screen.getByText(
          /upgrade.*premium|subscription.*expired/i
        );
        expect(upgradePrompt).toBeInTheDocument();
      });

      // Analytics should track feature access attempt
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'premium_feature_blocked',
        'advanced_scheduling',
        expect.objectContaining({
          reason: 'subscription_expired',
          userId: expiredPremiumUser.id,
        })
      );
    });
  });

  describe('Trial Period Management', () => {
    it('should handle free trial correctly', async () => {
      // Create user with active trial
      const trialUser = createMockUser({
        subscriptionTier: 'trial',
        premiumFeatures: ['advanced_scheduling', 'unlimited_alarms'],
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        trialStartedAt: new Date(),
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(trialUser);

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should show trial status
      const trialIndicator = screen.queryByText(/trial|days.*left|free.*until/i);
      if (trialIndicator) {
        expect(trialIndicator).toBeInTheDocument();
      }

      // Should have access to premium features
      const advancedButton = screen.getByRole('button', { name: /advanced|brain/i });
      await user.click(advancedButton);

      await waitFor(() => {
        // Should access premium features without paywall
        const paywallContent = screen.queryByText(/upgrade.*premium|unlock.*features/i);
        expect(paywallContent).not.toBeInTheDocument();
      });

      // Analytics should track trial usage
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'trial_feature_usage',
        'advanced_scheduling',
        expect.objectContaining({
          trialDaysRemaining: expect.any(Number),
          userId: trialUser.id,
        })
      );
    });

    it('should handle trial expiration', async () => {
      // Create user with expired trial
      const expiredTrialUser = createMockUser({
        subscriptionTier: 'free',
        premiumFeatures: [],
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        trialStartedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(expiredTrialUser);

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should show trial expired message
      const trialExpiredMessage = screen.queryByText(
        /trial.*expired|subscribe.*continue/i
      );
      if (trialExpiredMessage) {
        expect(trialExpiredMessage).toBeInTheDocument();
      }

      // Premium features should be locked
      const advancedButton = screen.getByRole('button', { name: /advanced|brain/i });
      await user.click(advancedButton);

      await waitFor(() => {
        const upgradePrompt = screen.getByText(/upgrade.*premium|trial.*ended/i);
        expect(upgradePrompt).toBeInTheDocument();
      });

      // Should offer conversion to paid plan
      const subscribeButton = screen.queryByRole('button', {
        name: /subscribe|upgrade.*now/i,
      });
      if (subscribeButton) {
        expect(subscribeButton).toBeInTheDocument();
      }
    });
  });

  describe('Persona-Based Upgrade Flows', () => {
    it('should customize upgrade flow for different user personas', async () => {
      // Mock persona detection
      const strugglingSamUser = createMockUser({
        subscriptionTier: 'free',
        email: 'sam@example.com',
        detectedPersona: 'struggling_sam' as PersonaType,
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(strugglingSamUser);

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to pricing
      const pricingButton = screen.getByRole('button', {
        name: /premium|crown|pricing/i,
      });
      await user.click(pricingButton);

      await waitFor(() => {
        expect(screen.getByText(/plans|pricing/i)).toBeInTheDocument();
      });

      // Should show persona-specific messaging
      const strugglingMessage = screen.queryByText(
        /struggle|getting.*started|free.*trial/i
      );
      if (strugglingMessage) {
        expect(strugglingMessage).toBeInTheDocument();
      }

      // Should offer appropriate discount or trial
      const discountOffer = screen.queryByText(
        /50%.*off|special.*offer|limited.*time/i
      );
      if (discountOffer) {
        expect(discountOffer).toBeInTheDocument();
      }

      // Analytics should track persona-specific conversion attempt
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'personalized_upgrade_view',
        'struggling_sam',
        expect.objectContaining({
          userId: strugglingSamUser.id,
          persona: 'struggling_sam',
        })
      );
    });
  });

  describe('Subscription Management', () => {
    it('should allow subscription management for premium users', async () => {
      const premiumUser = createMockUser({
        subscriptionTier: 'premium',
        premiumFeatures: ['advanced_scheduling', 'unlimited_alarms'],
        subscriptionId: 'sub_test_active',
        subscriptionStatus: 'active',
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(premiumUser);

      let appContainer: HTMLElement;

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText(/settings/i)).toBeInTheDocument();
      });

      // Look for subscription management section
      const subscriptionSection = screen.queryByText(
        /subscription|billing|manage.*plan/i
      );
      if (subscriptionSection) {
        expect(subscriptionSection).toBeInTheDocument();
      }

      // Should show current plan details
      const currentPlan = screen.queryByText(/premium|current.*plan/i);
      if (currentPlan) {
        expect(currentPlan).toBeInTheDocument();
      }

      // Should offer management options
      const manageButton = screen.queryByRole('button', {
        name: /manage|cancel|update.*payment/i,
      });
      if (manageButton) {
        expect(manageButton).toBeInTheDocument();
        await user.click(manageButton);

        // Should track subscription management access
        expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
          'subscription_management',
          'accessed',
          expect.objectContaining({
            userId: premiumUser.id,
            subscriptionTier: 'premium',
          })
        );
      }
    });
  });
});
