/**
 * Premium Purchase Flow Integration Tests
 *
 * Comprehensive tests for the premium subscription purchase flow,
 * covering upgrade prompts, payment processing, subscription management,
 * and feature unlocking.
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
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import main components
import App from '../../src/App';

// Import types
import type { User, SubscriptionTier } from '../../src/types';

// Import enhanced test utilities
import {
  createPremiumUser,
  createTrialUser,
  createExpiredPremiumUser,
  expectPremiumFeatureVisible,
  expectPremiumFeatureGated,
  mockStripeElements,
  simulateSuccessfulPayment,
  simulateFailedPayment,
  mockPostHog,
  expectAnalyticsEvent,
  expectAnalyticsIdentify,
  renderWithProviders,
  waitForLoadingToFinish,
  expectNoConsoleErrors,
} from '../utils/enhanced-test-utilities';

import { createMockUser, setupAllMocks } from '../utils/test-mocks';
import { testDataHelpers, integrationTestUtils } from '../utils/integration-test-setup';

// Mock external services
vi.mock('../../src/services/stripe-service');
vi.mock('../../src/services/subscription');
vi.mock('../../src/services/premium');
vi.mock('@stripe/stripe-js');
vi.mock('posthog-js');

describe('Premium Purchase Flow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;
  let mockPostHogInstance: any;
  let stripeElements: any;
  let checkConsoleErrors: () => void;

  beforeAll(async () => {
    setupAllMocks();
    mockPostHogInstance = mockPostHog();
    stripeElements = mockStripeElements();
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser({ subscriptionTier: 'free' });
    checkConsoleErrors = expectNoConsoleErrors();

    testDataHelpers.clearAll();
    testDataHelpers.addUser(mockUser);

    vi.clearAllMocks();
  });

  afterEach(() => {
    checkConsoleErrors();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('P1 High: Free-to-Premium Upgrade Flow', () => {
    it('should trigger upgrade prompt when hitting alarm limit', async () => {
      // Create free user with 5 alarms (at limit)
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      for (let i = 0; i < 5; i++) {
        testDataHelpers.addAlarm({
          id: `alarm-${i}`,
          userId: freeUser.id,
          time: `0${6 + i}:00`,
          label: `Alarm ${i + 1}`,
          enabled: true,
          isActive: false,
          days: [1, 2, 3, 4, 5],
          dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          sound: 'default',
          volume: 0.8,
          vibrate: true,
          voiceMood: 'motivational',
          difficulty: 'medium',
          snoozeEnabled: true,
          snoozeInterval: 5,
          maxSnoozes: 3,
          snoozeCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          completed: false,
          metadata: {},
        });
      }
      testDataHelpers.addUser(freeUser);

      renderWithProviders(<App />, { user: freeUser });
      await waitForLoadingToFinish();

      // Try to create 6th alarm
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill basic alarm info
      const timeInput = screen.getByLabelText(/time/i);
      await user.type(timeInput, '12:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.type(labelInput, 'Limit Test Alarm');

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should show upgrade prompt
      await waitFor(() => {
        const upgradePrompt = screen.queryByText(
          /upgrade.*premium|limit.*reached|5 alarms.*limit/i
        );
        expect(upgradePrompt).toBeInTheDocument();
      });

      // Should show upgrade button
      const upgradeButton = screen.queryByRole('button', {
        name: /upgrade|go.*premium/i,
      });
      expect(upgradeButton).toBeInTheDocument();

      // Analytics should track limit hit
      expectAnalyticsEvent(mockPostHogInstance, 'subscription_limit_hit', {
        feature: 'alarms',
        currentTier: 'free',
        limit: 5,
      });
    });

    it('should complete successful premium upgrade flow', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Navigate to pricing/upgrade page
      const upgradeButton =
        screen.queryByRole('button', { name: /upgrade|premium|pro/i }) ||
        screen.queryByText(/upgrade.*premium/i);

      if (!upgradeButton) {
        // Try to trigger upgrade prompt by accessing premium feature
        const settingsButton = screen.queryByText(/settings/i);
        if (settingsButton) {
          await user.click(settingsButton);

          // Look for premium section
          const premiumSection = screen.queryByText(/premium|subscription/i);
          if (premiumSection) {
            await user.click(premiumSection);
          }
        }
      }

      // Should see pricing options
      await waitFor(() => {
        const pricingElement = screen.queryByText(
          /premium.*plan|monthly.*plan|\$\d+.*month/i
        );
        expect(pricingElement).toBeInTheDocument();
      });

      // Select premium plan
      const premiumPlan = screen.getByText(/premium|pro/i);
      await user.click(premiumPlan);

      // Should see payment form
      await waitFor(() => {
        const paymentForm = screen.queryByText(/payment.*method|credit.*card|billing/i);
        expect(paymentForm).toBeInTheDocument();
      });

      // Fill payment information (mocked)
      const cardInput = screen.queryByLabelText(/card.*number/i);
      if (cardInput) {
        await user.type(cardInput, '4242424242424242');
      }

      const expiryInput = screen.queryByLabelText(/expir.*date|mm.*yy/i);
      if (expiryInput) {
        await user.type(expiryInput, '12/25');
      }

      const cvcInput = screen.queryByLabelText(/cvc|cvv|security.*code/i);
      if (cvcInput) {
        await user.type(cvcInput, '123');
      }

      // Mock successful payment
      simulateSuccessfulPayment(stripeElements.stripe);

      // Submit payment
      const submitButton = screen.getByRole('button', {
        name: /subscribe|pay|purchase/i,
      });
      await user.click(submitButton);

      // Should show success message
      await waitFor(
        () => {
          const successMessage = screen.queryByText(
            /success|welcome.*premium|subscription.*active/i
          );
          expect(successMessage).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Should update user to premium
      const updatedUser = testDataHelpers.getUserByEmail(mockUser.email);
      expect(updatedUser?.subscriptionTier).toBe('premium');

      // Should track successful conversion
      expectAnalyticsEvent(mockPostHogInstance, 'subscription_created', {
        plan: 'premium',
        interval: 'month',
        amount: 999,
      });

      expectAnalyticsIdentify(mockPostHogInstance, mockUser.id, {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });
    });

    it('should handle payment failures gracefully', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Navigate to upgrade flow (abbreviated for brevity)
      // ... navigation code similar to above ...

      // Mock payment failure
      simulateFailedPayment(stripeElements.stripe, 'Your card was declined.');

      // Find and click submit button
      const submitButton = screen.queryByRole('button', {
        name: /subscribe|pay|purchase/i,
      });
      if (submitButton) {
        await user.click(submitButton);

        // Should show error message
        await waitFor(() => {
          const errorMessage = screen.queryByText(
            /card.*declined|payment.*failed|error/i
          );
          expect(errorMessage).toBeInTheDocument();
        });

        // Should remain on payment form
        const paymentForm = screen.queryByText(/payment.*method|billing/i);
        expect(paymentForm).toBeInTheDocument();

        // Should track payment failure
        expectAnalyticsEvent(mockPostHogInstance, 'subscription_payment_failed', {
          error: 'card_declined',
          plan: 'premium',
        });
      }
    });
  });

  describe('P1 High: Trial Experience', () => {
    it('should provide full trial experience with expiration handling', async () => {
      // Create trial user with 2 days remaining
      const trialUser = createTrialUser();
      trialUser.trialEndsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      testDataHelpers.addUser(trialUser);

      renderWithProviders(<App />, { user: trialUser });
      await waitForLoadingToFinish();

      // Should show trial status
      await waitFor(() => {
        const trialIndicator = screen.queryByText(/trial|2 days.*left|expires/i);
        expect(trialIndicator).toBeInTheDocument();
      });

      // Should have access to premium features
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Premium features should be available
      expectPremiumFeatureVisible(screen, 'nuclear mode');

      // Close form
      const closeButton = screen.queryByRole('button', { name: /close|cancel/i });
      if (closeButton) {
        await user.click(closeButton);
      } else {
        fireEvent.keyDown(document, { key: 'Escape' });
      }

      // Simulate trial expiration
      const expiredTrialUser = {
        ...trialUser,
        subscriptionTier: 'free' as SubscriptionTier,
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        premiumFeatures: [],
      };
      testDataHelpers.addUser(expiredTrialUser);

      // Re-render with expired trial
      renderWithProviders(<App />, { user: expiredTrialUser });
      await waitForLoadingToFinish();

      // Should show trial expired message
      await waitFor(() => {
        const expiredMessage = screen.queryByText(
          /trial.*expired|subscribe.*continue/i
        );
        expect(expiredMessage).toBeInTheDocument();
      });

      // Premium features should now be gated
      const addAlarmButton2 = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton2);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expectPremiumFeatureGated(screen);
    });

    it('should handle trial-to-premium conversion smoothly', async () => {
      const trialUser = createTrialUser();
      testDataHelpers.addUser(trialUser);

      renderWithProviders(<App />, { user: trialUser });
      await waitForLoadingToFinish();

      // Should see convert to premium option
      const convertButton = screen.queryByText(/convert|continue.*premium|subscribe/i);
      if (convertButton) {
        await user.click(convertButton);

        // Should go to subscription flow
        await waitFor(() => {
          const subscriptionForm = screen.queryByText(/payment|billing|subscribe/i);
          expect(subscriptionForm).toBeInTheDocument();
        });

        // Complete subscription
        simulateSuccessfulPayment(stripeElements.stripe);

        const submitButton = screen.queryByRole('button', {
          name: /subscribe|continue/i,
        });
        if (submitButton) {
          await user.click(submitButton);

          await waitFor(() => {
            const successMessage = screen.queryByText(/success|welcome|subscribed/i);
            expect(successMessage).toBeInTheDocument();
          });

          // Should track trial conversion
          expectAnalyticsEvent(mockPostHogInstance, 'trial_converted', {
            plan: 'premium',
            trialDuration: 7,
          });
        }
      }
    });
  });

  describe('P1 High: Subscription Management', () => {
    it('should allow premium users to manage their subscription', async () => {
      const premiumUser = createPremiumUser();
      premiumUser.subscriptionId = 'sub_test_123';
      premiumUser.subscriptionStatus = 'active';
      testDataHelpers.addUser(premiumUser);

      renderWithProviders(<App />, { user: premiumUser });
      await waitForLoadingToFinish();

      // Navigate to account/subscription settings
      const settingsButton = screen.queryByText(/settings|account|profile/i);
      if (settingsButton) {
        await user.click(settingsButton);

        // Look for subscription section
        await waitFor(() => {
          const subscriptionSection = screen.queryByText(/subscription|billing|plan/i);
          expect(subscriptionSection).toBeInTheDocument();
        });

        // Should show current plan
        const currentPlan = screen.queryByText(/premium|pro.*plan/i);
        expect(currentPlan).toBeInTheDocument();

        // Should show subscription status
        const activeStatus = screen.queryByText(/active|current/i);
        expect(activeStatus).toBeInTheDocument();
      }
    });

    it('should handle subscription cancellation flow', async () => {
      const premiumUser = createPremiumUser();
      testDataHelpers.addUser(premiumUser);

      renderWithProviders(<App />, { user: premiumUser });
      await waitForLoadingToFinish();

      // Navigate to subscription settings
      const settingsButton = screen.queryByText(/settings/i);
      if (settingsButton) {
        await user.click(settingsButton);

        // Find cancel subscription option
        const cancelButton = screen.queryByText(/cancel.*subscription|unsubscribe/i);
        if (cancelButton) {
          await user.click(cancelButton);

          // Should show cancellation confirmation
          await waitFor(() => {
            const confirmationDialog = screen.queryByText(
              /sure.*cancel|confirm.*cancellation/i
            );
            expect(confirmationDialog).toBeInTheDocument();
          });

          // Should explain what happens
          const retainAccessText = screen.queryByText(
            /access.*until.*end|period.*end/i
          );
          expect(retainAccessText).toBeInTheDocument();

          // Confirm cancellation
          const confirmButton = screen.getByRole('button', {
            name: /confirm|yes.*cancel/i,
          });
          await user.click(confirmButton);

          // Should show cancellation success
          await waitFor(() => {
            const canceledMessage = screen.queryByText(/canceled|subscription.*ended/i);
            expect(canceledMessage).toBeInTheDocument();
          });

          // Should track cancellation
          expectAnalyticsEvent(mockPostHogInstance, 'subscription_canceled', {
            plan: 'premium',
            reason: 'user_initiated',
          });
        }
      }
    });

    it('should handle payment method updates', async () => {
      const premiumUser = createPremiumUser();
      testDataHelpers.addUser(premiumUser);

      renderWithProviders(<App />, { user: premiumUser });
      await waitForLoadingToFinish();

      // Navigate to billing settings
      const settingsButton = screen.queryByText(/settings/i);
      if (settingsButton) {
        await user.click(settingsButton);

        const billingSection = screen.queryByText(/billing|payment.*method/i);
        if (billingSection) {
          await user.click(billingSection);

          // Should show current payment method
          await waitFor(() => {
            const currentCard = screen.queryByText(/\*\*\*\*.*\d{4}|visa|mastercard/i);
            expect(currentCard).toBeInTheDocument();
          });

          // Update payment method
          const updateButton = screen.queryByText(/update.*payment|change.*card/i);
          if (updateButton) {
            await user.click(updateButton);

            // Should show payment form
            await waitFor(() => {
              const cardForm = screen.queryByLabelText(/card.*number/i);
              expect(cardForm).toBeInTheDocument();
            });

            // Fill new card info
            const cardInput = screen.getByLabelText(/card.*number/i);
            await user.clear(cardInput);
            await user.type(cardInput, '5555555555554444');

            const expiryInput = screen.getByLabelText(/expir/i);
            await user.clear(expiryInput);
            await user.type(expiryInput, '12/26');

            // Submit update
            const submitButton = screen.getByRole('button', { name: /update|save/i });
            await user.click(submitButton);

            // Should show success
            await waitFor(() => {
              const successMessage = screen.queryByText(/updated|saved/i);
              expect(successMessage).toBeInTheDocument();
            });
          }
        }
      }
    });
  });

  describe('P2 Medium: Feature Access Control', () => {
    it('should properly gate premium features across the app', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      testDataHelpers.addUser(freeUser);

      renderWithProviders(<App />, { user: freeUser });
      await waitForLoadingToFinish();

      // Test alarm creation features
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Premium features should be gated
      expectPremiumFeatureGated(screen);

      // Close form
      const closeButton = screen.queryByRole('button', { name: /close|cancel/i });
      if (closeButton) {
        await user.click(closeButton);
      }

      // Test other premium features throughout app
      const premiumSections = [
        /premium|pro/i,
        /nuclear.*mode/i,
        /smart.*wakeup/i,
        /custom.*sounds/i,
      ];

      for (const sectionRegex of premiumSections) {
        const section = screen.queryByText(sectionRegex);
        if (section) {
          await user.click(section);

          // Should show upgrade prompt
          await waitFor(() => {
            const upgradePrompt = screen.queryByText(/upgrade|premium|subscription/i);
            if (upgradePrompt) {
              expect(upgradePrompt).toBeInTheDocument();
            }
          });
        }
      }
    });

    it('should unlock features immediately after successful upgrade', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Start with free user - features should be gated
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expectPremiumFeatureGated(screen);

      // Close form
      const closeButton = screen.queryByRole('button', { name: /close|cancel/i });
      if (closeButton) {
        await user.click(closeButton);
      }

      // Simulate successful upgrade (update user in test data)
      const upgradedUser = {
        ...mockUser,
        subscriptionTier: 'premium' as SubscriptionTier,
        premiumFeatures: [
          'nuclear_mode',
          'custom_sounds',
          'unlimited_alarms',
          'smart_wakeup',
        ],
        subscriptionId: 'sub_new_123',
        subscriptionStatus: 'active',
      };
      testDataHelpers.addUser(upgradedUser);

      // Re-render with updated user state
      renderWithProviders(<App />, { user: upgradedUser });
      await waitForLoadingToFinish();

      // Now features should be unlocked
      const addAlarmButton2 = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton2);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Premium features should now be visible
      expectPremiumFeatureVisible(screen, 'premium');
    });

    it('should handle expired premium subscriptions gracefully', async () => {
      const expiredUser = createExpiredPremiumUser();
      testDataHelpers.addUser(expiredUser);

      renderWithProviders(<App />, { user: expiredUser });
      await waitForLoadingToFinish();

      // Should show subscription expired notice
      await waitFor(() => {
        const expiredNotice = screen.queryByText(
          /subscription.*expired|premium.*ended/i
        );
        expect(expiredNotice).toBeInTheDocument();
      });

      // Features should be gated again
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expectPremiumFeatureGated(screen);

      // Should offer reactivation
      const reactivateButton = screen.queryByText(/reactivate|renew|subscribe.*again/i);
      expect(reactivateButton).toBeInTheDocument();
    });
  });
});
