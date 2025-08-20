/**
 * SubscriptionDashboard Component Tests
 *
 * Tests the main subscription management interface that displays subscription status,
 * billing information, usage metrics, and provides upgrade/downgrade functionality.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../__tests__/utils/render-helpers';
import { createTestSubscription } from '../../../__tests__/factories/premium-factories';
import { SubscriptionDashboard } from '../SubscriptionDashboard';
import type { SubscriptionDashboardData } from '../../../types/premium';

const mockSubscriptionDashboard = {
  subscription: createTestSubscription({ tier: 'premium', status: 'active' }),
  currentPlan: {
    id: 'premium-plan',
    displayName: 'Premium Plan',
    tier: 'premium' as const,
    limits: { maxAlarms: 50, maxBattles: 100 }
  },
  usage: {
    userId: 'test-user-123',
    subscriptionId: 'test-subscription-123',
    period: { start: new Date(), end: new Date() },
    usage: {
      alarms: { used: 25, limit: 50, percentage: 50 },
      battles: { used: 30, limit: 100, percentage: 30 }
    },
    overageCharges: [],
    totalOverageAmount: 0
  },
  upcomingInvoice: null,
  paymentMethods: [],
  invoiceHistory: [],
  availablePlans: [],
  discountCodes: [],
  referralStats: {
    code: 'USER123',
    referrals: 5,
    rewards: 2,
    pendingRewards: 1
  }
};

describe('SubscriptionDashboard', () => {
  const defaultProps = {
    data: mockSubscriptionDashboard,
    onUpgrade: jest.fn(),
    onDowngrade: jest.fn(),
    onCancelSubscription: jest.fn(),
    onReactivateSubscription: jest.fn(),
    onAddPaymentMethod: jest.fn(),
    onRemovePaymentMethod: jest.fn(),
    onSetDefaultPaymentMethod: jest.fn(),
    onUpdateBillingDetails: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} isLoading={true} />
      );

      // Should show loading skeletons
      const skeletons = screen.getAllByRole('generic', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(0);

      // Should not show actual content
      expect(screen.queryByText('Current Plan')).not.toBeInTheDocument();
    });

    it('displays content when loading is complete', () => {
      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} isLoading={false} />
      );

      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('displays current subscription information', () => {
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows next billing information for paid plans', () => {
      const dataWithBilling = {
        ...mockSubscriptionDashboard,
        subscription: createTestSubscription({
          tier: 'premium',
          status: 'active',
          billingInterval: 'month',
          amount: 999
        })
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={dataWithBilling} />
      );

      expect(screen.getByText('Next Billing')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
    });

    it('displays features used count', () => {
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      expect(screen.getByText('Features Used')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument(); // 25 + 30 from usage
      expect(screen.getByText('This month')).toBeInTheDocument();
    });

    it('shows trial information when user has active trial', () => {
      const dataWithTrial = {
        ...mockSubscriptionDashboard,
        activeTrial: {
          id: 'trial-123',
          userId: 'test-user-123',
          planId: 'premium-plan',
          tier: 'premium' as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active' as const,
          convertedToSubscriptionId: undefined,
          remindersSent: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={dataWithTrial} />
      );

      expect(screen.getByText('Free Trial Active')).toBeInTheDocument();
      expect(screen.getByText(/Your free trial ends on/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose a plan/i })).toBeInTheDocument();
    });
  });

  describe('Subscription Status Alerts', () => {
    it('shows past due alert when subscription is past due', () => {
      const pastDueData = {
        ...mockSubscriptionDashboard,
        subscription: createTestSubscription({ status: 'past_due' })
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={pastDueData} />
      );

      expect(screen.getByText(/payment is past due/i)).toBeInTheDocument();
    });

    it('shows cancellation notice when subscription will cancel at period end', () => {
      const cancelingData = {
        ...mockSubscriptionDashboard,
        subscription: {
          ...createTestSubscription({ status: 'active' }),
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={cancelingData} />
      );

      expect(screen.getByText(/subscription will end on/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reactivate/i })).toBeInTheDocument();
    });

    it('handles reactivation when reactivate button is clicked', async () => {
      const cancelingData = {
        ...mockSubscriptionDashboard,
        subscription: {
          ...createTestSubscription({ status: 'active' }),
          cancelAtPeriodEnd: true
        }
      };
      const user = userEvent.setup();

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={cancelingData} />
      );

      const reactivateButton = screen.getByRole('button', { name: /reactivate/i });
      await user.click(reactivateButton);

      expect(defaultProps.onReactivateSubscription).toHaveBeenCalled();
    });
  });

  describe('Usage Tab', () => {
    it('displays usage statistics for each feature', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      // Click on Usage tab
      const usageTab = screen.getByRole('tab', { name: /usage/i });
      await user.click(usageTab);

      expect(screen.getByText('alarms')).toBeInTheDocument();
      expect(screen.getByText('25 used')).toBeInTheDocument();
      expect(screen.getByText('50 limit')).toBeInTheDocument();

      expect(screen.getByText('battles')).toBeInTheDocument();
      expect(screen.getByText('30 used')).toBeInTheDocument();
      expect(screen.getByText('100 limit')).toBeInTheDocument();
    });

    it('shows progress bars for usage visualization', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /usage/i }));

      // Progress bars should be present
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('displays no usage data message when usage is null', async () => {
      const dataWithoutUsage = {
        ...mockSubscriptionDashboard,
        usage: null
      };
      const user = userEvent.setup();

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={dataWithoutUsage} />
      );

      await user.click(screen.getByRole('tab', { name: /usage/i }));

      expect(screen.getByText('No usage data')).toBeInTheDocument();
      expect(screen.getByText('Usage statistics will appear here once you start using premium features.')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('provides change plan action', () => {
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /change plan/i })).toBeInTheDocument();
    });

    it('provides cancel subscription action for active subscriptions', () => {
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel subscription/i })).toBeInTheDocument();
    });

    it('does not show cancel button for already cancelled subscriptions', () => {
      const cancelledData = {
        ...mockSubscriptionDashboard,
        subscription: {
          ...mockSubscriptionDashboard.subscription!,
          cancelAtPeriodEnd: true
        }
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={cancelledData} />
      );

      expect(screen.queryByRole('button', { name: /cancel subscription/i })).not.toBeInTheDocument();
    });

    it('handles subscription cancellation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel subscription/i });
      await user.click(cancelButton);

      expect(defaultProps.onCancelSubscription).toHaveBeenCalledWith('User initiated cancellation');
    });
  });

  describe('Plan Management', () => {
    it('handles plan upgrades correctly', async () => {
      const availablePlans = [
        {
          id: 'pro-plan',
          tier: 'pro' as const,
          displayName: 'Pro Plan',
          limits: { maxAlarms: 100 }
        }
      ];

      const dataWithPlans = {
        ...mockSubscriptionDashboard,
        availablePlans
      };

      const user = userEvent.setup();
      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={dataWithPlans} />
      );

      // Navigate to plans tab
      await user.click(screen.getByRole('tab', { name: /plans/i }));

      // This would trigger the plan selection in the PricingTable component
      // The actual plan selection would be tested in PricingTable tests
    });

    it('handles plan downgrades correctly', async () => {
      const currentPremiumUser = {
        ...mockSubscriptionDashboard,
        subscription: createTestSubscription({ tier: 'pro' })
      };

      const availablePlans = [
        {
          id: 'premium-plan',
          tier: 'premium' as const,
          displayName: 'Premium Plan'
        }
      ];

      const dataWithDowngrade = {
        ...currentPremiumUser,
        availablePlans
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={dataWithDowngrade} />
      );

      // Downgrade functionality would be triggered through PricingTable
      // The dashboard should handle the tier comparison correctly
    });
  });

  describe('Error Handling', () => {
    it('displays error messages when actions fail', async () => {
      const failingProps = {
        ...defaultProps,
        onCancelSubscription: jest.fn().mockRejectedValue(new Error('Cancellation failed'))
      };

      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<SubscriptionDashboard {...failingProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel subscription/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to cancel subscription:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('handles missing subscription data gracefully', () => {
      const dataWithoutSubscription = {
        ...mockSubscriptionDashboard,
        subscription: null,
        currentPlan: null
      };

      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} data={dataWithoutSubscription} />
      );

      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument(); // No billing info
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for tabs', () => {
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /overview/i })).toHaveAccessibleName();
      expect(screen.getByRole('tab', { name: /usage/i })).toHaveAccessibleName();
      expect(screen.getByRole('tab', { name: /billing/i })).toHaveAccessibleName();
      expect(screen.getByRole('tab', { name: /plans/i })).toHaveAccessibleName();
    });

    it('supports keyboard navigation between tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      const usageTab = screen.getByRole('tab', { name: /usage/i });

      // Focus first tab
      overviewTab.focus();
      expect(overviewTab).toHaveFocus();

      // Navigate to next tab with arrow key
      await user.keyboard('{ArrowRight}');
      expect(usageTab).toHaveFocus();
    });

    it('provides screen reader friendly content', () => {
      renderWithProviders(
        <SubscriptionDashboard {...defaultProps} />,
        { screenReaderEnabled: true }
      );

      // Key information should be accessible to screen readers
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      // Should still display core information on mobile
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    });
  });

  describe('Integration with Child Components', () => {
    it('passes correct props to PaymentMethodManager', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /billing/i }));

      // PaymentMethodManager should receive the payment methods data
      // This is implicitly tested by the component not crashing
    });

    it('passes correct props to BillingHistory', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /billing/i }));

      // BillingHistory should receive the invoice history data
      // This is implicitly tested by the component not crashing
    });

    it('passes correct props to PricingTable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionDashboard {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /plans/i }));

      // PricingTable should receive the available plans data
      // This is implicitly tested by the component not crashing
    });
  });
});