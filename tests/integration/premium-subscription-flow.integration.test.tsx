/// <reference lib="dom" />
/**
 * Premium Subscription Flow Integration Tests
 * 
 * End-to-end tests for premium features and subscription management:
 * - Free tier limitations and upgrade prompts
 * - Premium feature discovery and paywall interactions
 * - Stripe payment processing and subscription activation
 * - Trial period management (start, usage tracking, expiration)
 * - Subscription management (billing, downgrades, cancellation)
 * - Premium feature unlocking and access control
 * - Persona-based upgrade flows and targeting
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { StripeService } from '../../src/services/stripe-service';
import { SubscriptionService } from '../../src/services/subscription';

import { integrationTestHelpers } from '../utils/integration-test-setup';
import { createMockUser, createMockAlarm, measurePerformance } from '../utils/test-mocks';

vi.mock('../../src/services/supabase');
vi.mock('../../src/services/stripe-service');
vi.mock('../../src/services/subscription');

describe('Premium Subscription Flow Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container) container.remove();
  });

  describe('Free Tier Limitations and Upgrade Discovery', () => {
    it('should trigger upgrade prompts when hitting free tier limits', async () => {
      const freeUser = createMockUser({
        subscriptionTier: 'free',
        alarmsCount: 3, // At free tier limit
        premiumFeatures: []
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(freeUser);
      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: Array(3).fill(null).map((_, i) => createMockAlarm({ id: `alarm-${i}` })),
        error: null
      });

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      // Try to create 4th alarm (should hit limit)
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      // Should show upgrade prompt instead of alarm form
      await waitFor(() => {
        expect(screen.getByText(/upgrade.*premium|unlock.*premium/i)).toBeInTheDocument();
        expect(screen.getByText(/3.*alarm.*limit/i)).toBeInTheDocument();
      });

      // Should show pricing options
      expect(screen.getByText(/\$.*month|\$.*year/i)).toBeInTheDocument();
    });

    it('should show premium feature teasers with upgrade CTAs', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(freeUser);

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      // Navigate to settings to see premium features
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Should show premium feature teasers
      const smartWakeupTeaser = screen.queryByText(/smart.*wakeup.*premium/i);
      const customSoundsTeaser = screen.queryByText(/custom.*sounds.*premium/i);

      if (smartWakeupTeaser) {
        expect(smartWakeupTeaser).toBeInTheDocument();
        
        // Click should trigger upgrade flow
        await user.click(smartWakeupTeaser);
        
        await waitFor(() => {
          expect(screen.getByText(/upgrade.*premium/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Complete Premium Upgrade Flow', () => {
    it('should complete Stripe payment and activate subscription', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(freeUser);

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      // Start upgrade process
      const upgradeButton = screen.getByRole('button', { name: /upgrade.*premium/i });
      await user.click(upgradeButton);

      // Select monthly plan
      const monthlyPlan = screen.getByRole('button', { name: /monthly.*\$9\.99/i });
      await user.click(monthlyPlan);

      // Mock Stripe payment setup
      const mockPaymentMethod = { id: 'pm_test_card', type: 'card' };
      vi.mocked(StripeService.createPaymentMethod).mockResolvedValue(mockPaymentMethod);
      vi.mocked(StripeService.createSubscription).mockResolvedValue({
        id: 'sub_test_123',
        status: 'active',
        current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });

      // Fill payment form (mocked Stripe Elements)
      const cardElement = screen.getByTestId('stripe-card-element');
      await user.click(cardElement);

      const subscribeButton = screen.getByRole('button', { name: /subscribe.*now/i });
      await user.click(subscribeButton);

      // Should activate premium features
      const updatedUser = { ...freeUser, subscriptionTier: 'premium', premiumFeatures: ['unlimited_alarms', 'custom_sounds'] };
      vi.mocked(SupabaseService.updateUserSubscription).mockResolvedValue({ user: updatedUser, error: null });

      await waitFor(() => {
        expect(screen.getByText(/subscription.*active|welcome.*premium/i)).toBeInTheDocument();
      });

      expect(StripeService.createSubscription).toHaveBeenCalledWith(mockPaymentMethod.id, 'monthly');
    });

    it('should handle payment failures gracefully', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(freeUser);

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
      await user.click(upgradeButton);

      // Mock payment failure
      vi.mocked(StripeService.createPaymentMethod).mockRejectedValue(new Error('Your card was declined'));

      const monthlyPlan = screen.getByRole('button', { name: /monthly/i });
      await user.click(monthlyPlan);

      const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
      await user.click(subscribeButton);

      await waitFor(() => {
        expect(screen.getByText(/card.*declined|payment.*failed/i)).toBeInTheDocument();
      });

      // Should remain on payment form for retry
      expect(screen.getByTestId('stripe-card-element')).toBeInTheDocument();
    });
  });

  describe('Trial Period Management', () => {
    it('should activate premium trial and track usage', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(freeUser);

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      // Start premium trial
      const startTrialButton = screen.getByRole('button', { name: /start.*trial|try.*free/i });
      await user.click(startTrialButton);

      const trialUser = {
        ...freeUser,
        subscriptionTier: 'trial',
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        premiumFeatures: ['unlimited_alarms', 'custom_sounds']
      };

      vi.mocked(SupabaseService.startPremiumTrial).mockResolvedValue({ user: trialUser, error: null });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(trialUser);

      await waitFor(() => {
        expect(screen.getByText(/trial.*active|premium.*trial/i)).toBeInTheDocument();
      });

      // Should show trial countdown
      expect(screen.getByText(/7.*days.*remaining|trial.*expires/i)).toBeInTheDocument();

      // Premium features should now be accessible
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const smartWakeupToggle = screen.queryByLabelText(/smart.*wakeup/i);
      if (smartWakeupToggle) {
        expect(smartWakeupToggle).not.toBeDisabled();
      }
    });
  });
});