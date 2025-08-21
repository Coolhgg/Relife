/**
 * Premium Integration Tests
 *
 * Tests integration between Premium components and subscription flows,
 * including end-to-end user journeys for upgrading, downgrading, and managing subscriptions.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../__tests__/utils/render-helpers';
import {
  createTestSubscription,
  createTestSubscriptionPlan,
  createTestPaymentMethod
} from '../../../__tests__/factories/premium-factories';
import { SubscriptionDashboard } from '../SubscriptionDashboard';
import { PricingTable } from '../PricingTable';
import { PaymentFlow } from '../PaymentFlow';
import { FeatureGate } from '../FeatureGate';

// Mock the subscription service
const mockSubscriptionService = {
  createSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  getSubscription: jest.fn(),
  getUsage: jest.fn()
};

jest.mock('../../../services/subscriptionService', () => ({
  subscriptionService: mockSubscriptionService
}));

// Mock Stripe
const mockStripe = {
  createPaymentMethod: jest.fn(),
  confirmCardPayment: jest.fn()
};

jest.mock('../../../lib/stripe', () => ({
  getStripe: () => Promise.resolve(mockStripe)
}));

describe('Premium Integration Tests', () => {
  const testPlans = [
    createTestSubscriptionPlan({
      tier: 'free',
      displayName: 'Free Plan',
      pricing: { monthly: { amount: 0, currency: 'usd' } }
    }),
    createTestSubscriptionPlan({
      tier: 'premium',
      displayName: 'Premium Plan',
      pricing: {
        monthly: { amount: 999, currency: 'usd' },
        yearly: { amount: 9999, currency: 'usd' }
      }
    }),
    createTestSubscriptionPlan({
      tier: 'pro',
      displayName: 'Pro Plan',
      pricing: {
        monthly: { amount: 1999, currency: 'usd' },
        yearly: { amount: 19999, currency: 'usd' }
      }
    })
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe.createPaymentMethod.mockResolvedValue({
      paymentMethod: { id: 'pm_test_123' }
    });
    mockStripe.confirmCardPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' }
    });
    mockSubscriptionService.createSubscription.mockResolvedValue({
      clientSecret: 'pi_test_secret',
      subscriptionId: 'sub_test_123'
    });
  });

  describe('Complete Upgrade Flow', () => {
    it('completes full upgrade journey from free to premium', async () => {
      const user = userEvent.setup();

      // Start with free tier user
      const mockFreeSubscription = createTestSubscription({
        tier: 'free',
        status: 'active'
      });

      const mockData = {
        subscription: mockFreeSubscription,
        currentPlan: testPlans[0], // Free plan
        usage: {
          userId: 'test-user',
          subscriptionId: mockFreeSubscription.id,
          period: { start: new Date(), end: new Date() },
          usage: {
            alarms: { used: 5, limit: 5, percentage: 100 }, // At limit
            battles: { used: 3, limit: 3, percentage: 100 }
          },
          overageCharges: [],
          totalOverageAmount: 0
        },
        upcomingInvoice: null,
        paymentMethods: [],
        invoiceHistory: [],
        availablePlans: testPlans,
        discountCodes: [],
        referralStats: { code: 'USER123', referrals: 0, rewards: 0, pendingRewards: 0 }
      };

      const { rerender } = renderWithProviders(
        <div>
          <SubscriptionDashboard
            data={mockData}
            onUpgrade={async planId => {
              // Mock navigation to pricing table
              rerender(
                <PricingTable
                  plans={testPlans}
                  currentTier="free"
                  onPlanSelect={(plan, interval) => {
                    // Mock navigation to payment flow
                    rerender(
                      <PaymentFlow
                        selectedPlan={plan}
                        billingInterval={interval}
                        onPaymentSuccess={subscriptionId => {
                          // Mock successful upgrade
                          const upgradedData = {
                            ...mockData,
                            subscription: createTestSubscription({
                              tier: 'premium',
                              status: 'active'
                            }),
                            currentPlan: testPlans[1] // Premium plan
                          };
                          rerender(<SubscriptionDashboard data={upgradedData} />);
                        }}
                        onPaymentError={() => {}}
                        onCancel={() => {}}
                        onCreateSubscription={mockSubscriptionService.createSubscription}
                      />
                    );
                  }}
                />
              );
            }}
          />
        </div>
      );

      // 1. User sees they're at limit and wants to upgrade
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByText('5 / 5')).toBeInTheDocument(); // At alarm limit

      // 2. Click upgrade button
      const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
      await user.click(upgradeButton);

      // 3. Should see pricing table
      await waitFor(() => {
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('$9.99 / month')).toBeInTheDocument();
      });

      // 4. Select premium plan
      const selectPremiumButton = screen.getByRole('button', { name: /upgrade to premium/i });
      await user.click(selectPremiumButton);

      // 5. Should see payment flow
      await waitFor(() => {
        expect(screen.getByText('Complete Your Subscription')).toBeInTheDocument();
        expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      });

      // 6. Fill out payment form
      await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
      await user.type(screen.getByLabelText(/expiry date/i), '12/25');
      await user.type(screen.getByLabelText(/cvc/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/address line 1/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/postal code/i), '10001');

      // 7. Submit payment
      const submitButton = screen.getByRole('button', { name: /complete subscription/i });
      await user.click(submitButton);

      // 8. Should complete and show success
      await waitFor(() => {
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.queryByText('5 / 5')).not.toBeInTheDocument(); // No longer limited
      });

      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith({
        planId: testPlans[1].id,
        billingInterval: 'month',
        paymentMethodId: 'pm_test_123'
      });
    });
  });

  describe('Feature Gating Integration', () => {
    it('integrates feature gating with subscription status', async () => {
      const user = userEvent.setup();

      // Mock feature gate hook to simulate gated feature
      const mockUseFeatureGate = {
        hasAccess: false,
        isGated: true,
        requiredTier: 'premium',
        upgradeMessage: 'Upgrade to Premium for unlimited alarms',
        showUpgradeModal: jest.fn()
      };

      jest.doMock('../../../hooks/useFeatureGate', () => ({
        __esModule: true,
        default: jest.fn(() => mockUseFeatureGate)
      }));

      const PremiumFeatureComponent = () => (
        <FeatureGate
          feature="unlimited_alarms"
          userId="test-user"
          onUpgradeClick={() => {
            // Should trigger upgrade flow
            mockUseFeatureGate.showUpgradeModal();
          }}
        >
          <div data-testid="premium-content">Unlimited alarms feature</div>
        </FeatureGate>
      );

      renderWithProviders(<PremiumFeatureComponent />);

      // Feature should be gated
      expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
      expect(screen.getByText('Upgrade to Premium for unlimited alarms')).toBeInTheDocument();

      // Click upgrade
      const upgradeButton = screen.getByRole('button', { name: /upgrade to premium/i });
      await user.click(upgradeButton);

      expect(mockUseFeatureGate.showUpgradeModal).toHaveBeenCalled();
    });
  });

  describe('Subscription Management Integration', () => {
    it('handles plan changes within subscription dashboard', async () => {
      const user = userEvent.setup();

      const mockPremiumSubscription = createTestSubscription({
        tier: 'premium',
        status: 'active'
      });

      const mockData = {
        subscription: mockPremiumSubscription,
        currentPlan: testPlans[1], // Premium plan
        usage: {
          userId: 'test-user',
          subscriptionId: mockPremiumSubscription.id,
          period: { start: new Date(), end: new Date() },
          usage: {
            alarms: { used: 25, limit: -1, percentage: 0 }, // Unlimited
            battles: { used: 50, limit: -1, percentage: 0 }
          },
          overageCharges: [],
          totalOverageAmount: 0
        },
        upcomingInvoice: null,
        paymentMethods: [createTestPaymentMethod()],
        invoiceHistory: [],
        availablePlans: testPlans,
        discountCodes: [],
        referralStats: { code: 'USER123', referrals: 2, rewards: 1, pendingRewards: 0 }
      };

      const mockOnUpgrade = jest.fn();
      const mockOnDowngrade = jest.fn();

      renderWithProviders(
        <SubscriptionDashboard
          data={mockData}
          onUpgrade={mockOnUpgrade}
          onDowngrade={mockOnDowngrade}
        />
      );

      // Should show premium plan details
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('Unlimited')).toBeInTheDocument();

      // Switch to Plans tab
      const plansTab = screen.getByRole('tab', { name: /plans/i });
      await user.click(plansTab);

      // Should see available plans
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();

      // Click upgrade to pro
      const upgradeToProButton = screen.getByRole('button', { name: /upgrade to pro/i });
      await user.click(upgradeToProButton);

      expect(mockOnUpgrade).toHaveBeenCalledWith('pro');
    });

    it('handles subscription cancellation flow', async () => {
      const user = userEvent.setup();

      const mockPremiumSubscription = createTestSubscription({
        tier: 'premium',
        status: 'active'
      });

      const mockData = {
        subscription: mockPremiumSubscription,
        currentPlan: testPlans[1],
        usage: {
          userId: 'test-user',
          subscriptionId: mockPremiumSubscription.id,
          period: { start: new Date(), end: new Date() },
          usage: {
            alarms: { used: 10, limit: -1, percentage: 0 },
            battles: { used: 20, limit: -1, percentage: 0 }
          },
          overageCharges: [],
          totalOverageAmount: 0
        },
        upcomingInvoice: null,
        paymentMethods: [createTestPaymentMethod()],
        invoiceHistory: [],
        availablePlans: testPlans,
        discountCodes: [],
        referralStats: { code: 'USER123', referrals: 0, rewards: 0, pendingRewards: 0 }
      };

      const mockOnCancel = jest.fn();

      renderWithProviders(
        <SubscriptionDashboard
          data={mockData}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to settings/cancel area (might be in a menu or separate tab)
      const moreOptionsButton = screen.getByRole('button', { name: /more options/i });
      await user.click(moreOptionsButton);

      const cancelButton = screen.getByRole('button', { name: /cancel subscription/i });
      await user.click(cancelButton);

      // Should show confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      const confirmCancelButton = screen.getByRole('button', { name: /yes, cancel/i });
      await user.click(confirmCancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles payment failures gracefully across components', async () => {
      const user = userEvent.setup();

      // Mock payment failure
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: { message: 'Your card was declined.' }
      });

      const selectedPlan = testPlans[1]; // Premium plan
      const mockOnPaymentError = jest.fn();

      renderWithProviders(
        <PaymentFlow
          selectedPlan={selectedPlan}
          billingInterval="month"
          onPaymentSuccess={() => {}}
          onPaymentError={mockOnPaymentError}
          onCancel={() => {}}
          onCreateSubscription={mockSubscriptionService.createSubscription}
        />
      );

      // Fill out form
      await user.type(screen.getByLabelText(/card number/i), '4000000000000002'); // Declined card
      await user.type(screen.getByLabelText(/expiry date/i), '12/25');
      await user.type(screen.getByLabelText(/cvc/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/address line 1/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/postal code/i), '10001');

      // Submit payment
      const submitButton = screen.getByRole('button', { name: /complete subscription/i });
      await user.click(submitButton);

      // Should handle error
      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith('Your card was declined.');
      });

      // Error should be displayed
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();

      // Form should be re-enabled for retry
      expect(screen.getByLabelText(/card number/i)).not.toBeDisabled();
    });

    it('handles network errors during subscription operations', async () => {
      mockSubscriptionService.createSubscription.mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      const mockOnPaymentError = jest.fn();

      renderWithProviders(
        <PaymentFlow
          selectedPlan={testPlans[1]}
          billingInterval="month"
          onPaymentSuccess={() => {}}
          onPaymentError={mockOnPaymentError}
          onCancel={() => {}}
          onCreateSubscription={mockSubscriptionService.createSubscription}
        />
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
      await user.type(screen.getByLabelText(/expiry date/i), '12/25');
      await user.type(screen.getByLabelText(/cvc/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/address line 1/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/postal code/i), '10001');

      const submitButton = screen.getByRole('button', { name: /complete subscription/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Mobile Integration', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('adapts premium flows for mobile devices', () => {
      const mockData = {
        subscription: createTestSubscription({ tier: 'free' }),
        currentPlan: testPlans[0],
        usage: {
          userId: 'test-user',
          subscriptionId: 'test-sub',
          period: { start: new Date(), end: new Date() },
          usage: {
            alarms: { used: 5, limit: 5, percentage: 100 }
          },
          overageCharges: [],
          totalOverageAmount: 0
        },
        upcomingInvoice: null,
        paymentMethods: [],
        invoiceHistory: [],
        availablePlans: testPlans,
        discountCodes: [],
        referralStats: { code: 'USER123', referrals: 0, rewards: 0, pendingRewards: 0 }
      };

      renderWithProviders(<SubscriptionDashboard data={mockData} />);

      // Mobile layout should be applied
      const dashboardContainer = screen.getByTestId('subscription-dashboard');
      expect(dashboardContainer).toHaveClass('px-4'); // Mobile padding
    });
  });
});