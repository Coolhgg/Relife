/**
 * PricingTable Component Tests
 *
 * Tests the subscription pricing display, plan selection, billing interval changes,
 * and upgrade/downgrade functionality.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../__tests__/utils/render-helpers';
import {
  createTestSubscriptionPlan,
  createTestPricing,
} from '../../../__tests__/factories/premium-factories';
import { PricingTable } from '../PricingTable';
import type { SubscriptionPlan, BillingInterval } from '../../../types/premium';

describe('PricingTable', () => {
  const mockOnPlanSelect = jest.fn();
  const mockOnBillingIntervalChange = jest.fn();

  const testPlans: SubscriptionPlan[] = [
    createTestSubscriptionPlan({
      tier: 'free',
      displayName: 'Free Plan',
      pricing: { monthly: { amount: 0, currency: 'usd' } },
      features: ['Basic alarms', '3 battle modes'],
      limits: { maxAlarms: 5, maxBattles: 3 },
    }),
    createTestSubscriptionPlan({
      tier: 'premium',
      displayName: 'Premium Plan',
      pricing: {
        monthly: { amount: 999, currency: 'usd' }, // $9.99
        yearly: { amount: 9999, currency: 'usd' }, // $99.99/year
      },
      features: ['Unlimited alarms', 'All battle modes', 'Premium voices'],
      limits: { maxAlarms: -1, maxBattles: -1 },
    }),
    createTestSubscriptionPlan({
      tier: 'pro',
      displayName: 'Pro Plan',
      pricing: {
        monthly: { amount: 1999, currency: 'usd' }, // $19.99
        yearly: { amount: 19999, currency: 'usd' }, // $199.99/year
      },
      features: ['Everything in Premium', 'Team collaboration', 'Advanced analytics'],
      limits: { maxAlarms: -1, maxBattles: -1, maxTeamMembers: 10 },
    }),
  ];

  const defaultProps = {
    plans: testPlans,
    onPlanSelect: mockOnPlanSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all provided plans', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });

    it('displays plan features correctly', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      expect(screen.getByText('Basic alarms')).toBeInTheDocument();
      expect(screen.getByText('Unlimited alarms')).toBeInTheDocument();
      expect(screen.getByText('Team collaboration')).toBeInTheDocument();
    });

    it('shows correct pricing for monthly billing', () => {
      renderWithProviders(<PricingTable {...defaultProps} billingInterval="month" />);

      expect(screen.getByText('$0.00 / month')).toBeInTheDocument();
      expect(screen.getByText('$9.99 / month')).toBeInTheDocument();
      expect(screen.getByText('$19.99 / month')).toBeInTheDocument();
    });

    it('shows correct pricing for yearly billing with discount', () => {
      renderWithProviders(<PricingTable {...defaultProps} billingInterval="year" />);

      expect(screen.getByText('$0.00 / year')).toBeInTheDocument();
      expect(screen.getByText('$99.99 / year')).toBeInTheDocument();
      expect(screen.getByText('$199.99 / year')).toBeInTheDocument();
    });

    it('highlights current plan', () => {
      renderWithProviders(<PricingTable {...defaultProps} currentTier="premium" />);

      const premiumCard = screen
        .getByText('Premium Plan')
        .closest('[data-testid="pricing-card"]');
      expect(premiumCard).toHaveClass('ring-2', 'ring-purple-500');
    });

    it('shows popular badge on recommended plan', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      // Premium plan should have popular badge
      const premiumSection = screen
        .getByText('Premium Plan')
        .closest('[data-testid="pricing-card"]');
      expect(
        premiumSection?.querySelector('[data-testid="popular-badge"]')
      ).toBeInTheDocument();
    });
  });

  describe('Billing Interval Toggle', () => {
    it('renders billing interval toggle', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yearly/i })).toBeInTheDocument();
    });

    it('highlights selected billing interval', () => {
      renderWithProviders(<PricingTable {...defaultProps} billingInterval="year" />);

      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      expect(yearlyButton).toHaveClass('bg-purple-600', 'text-white');
    });

    it('updates pricing when billing interval changes', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PricingTable {...defaultProps} />);

      // Initially shows monthly pricing
      expect(screen.getByText('$9.99 / month')).toBeInTheDocument();

      // Click yearly toggle
      await user.click(screen.getByRole('button', { name: /yearly/i }));

      // Should show yearly pricing
      expect(screen.getByText('$99.99 / year')).toBeInTheDocument();
    });

    it('calls onBillingIntervalChange when interval changes', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PricingTable
          {...defaultProps}
          onBillingIntervalChange={mockOnBillingIntervalChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /yearly/i }));

      expect(mockOnBillingIntervalChange).toHaveBeenCalledWith('year');
    });

    it('shows savings badge for yearly billing', () => {
      renderWithProviders(<PricingTable {...defaultProps} billingInterval="year" />);

      expect(screen.getByText(/save/i)).toBeInTheDocument();
    });
  });

  describe('Plan Selection', () => {
    it('calls onPlanSelect when plan is selected', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PricingTable {...defaultProps} />);

      const upgradeButton = screen.getByRole('button', { name: /upgrade to premium/i });
      await user.click(upgradeButton);

      expect(mockOnPlanSelect).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 'premium' }),
        'month'
      );
    });

    it('shows correct button text for each plan type', () => {
      renderWithProviders(<PricingTable {...defaultProps} currentTier="free" />);

      expect(screen.getByRole('button', { name: /current plan/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /upgrade to premium/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /upgrade to pro/i })
      ).toBeInTheDocument();
    });

    it('shows downgrade option when on higher tier', () => {
      renderWithProviders(<PricingTable {...defaultProps} currentTier="pro" />);

      expect(
        screen.getByRole('button', { name: /downgrade to free/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /downgrade to premium/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /current plan/i })).toBeInTheDocument();
    });

    it('disables buttons when loading', () => {
      renderWithProviders(<PricingTable {...defaultProps} loading={true} />);

      const buttons = screen.getAllByRole('button');
      const planButtons = buttons.filter(
        button =>
          button.textContent?.includes('upgrade') ||
          button.textContent?.includes('downgrade') ||
          button.textContent?.includes('Current plan')
      );

      planButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Features Display', () => {
    it('shows feature list for each plan', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      // Check features are displayed with checkmarks
      const checkIcons = screen.getAllByTestId('check-icon');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('shows usage limits when available', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      expect(screen.getByText(/5 alarms/i)).toBeInTheDocument();
      expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
    });

    it('highlights premium features with badges', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      const premiumBadges = screen.getAllByTestId('premium-feature-badge');
      expect(premiumBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('renders mobile-friendly layout on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      renderWithProviders(<PricingTable {...defaultProps} />);

      const container = screen.getByTestId('pricing-table-container');
      expect(container).toHaveClass('flex-col');
    });

    it('renders grid layout on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<PricingTable {...defaultProps} />);

      const container = screen.getByTestId('pricing-table-container');
      expect(container).toHaveClass('grid', 'grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for plan cards', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      const planCards = screen.getAllByRole('article');
      planCards.forEach(card => {
        expect(card).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PricingTable {...defaultProps} />);

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      expect(firstButton).toHaveFocus();

      // Should be able to tab to next button
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement?.tagName).toBe('BUTTON');
    });

    it('announces pricing changes to screen readers', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      const ariaLive = screen.getByTestId('pricing-announcements');
      expect(ariaLive).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Error States', () => {
    it('handles missing pricing gracefully', () => {
      const plansWithMissingPricing = [
        {
          ...testPlans[0],
          pricing: undefined,
        },
      ];

      renderWithProviders(
        <PricingTable {...defaultProps} plans={plansWithMissingPricing as any} />
      );

      // Should still render without crashing
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });

    it('handles empty plans array', () => {
      renderWithProviders(<PricingTable {...defaultProps} plans={[]} />);

      expect(screen.getByText(/no plans available/i)).toBeInTheDocument();
    });

    it('shows error state for invalid plans', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<PricingTable {...defaultProps} plans={null as any} />);

      expect(screen.getByText(/error loading plans/i)).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Currency and Localization', () => {
    it('displays different currencies correctly', () => {
      const euroPlans = testPlans.map(plan => ({
        ...plan,
        pricing: {
          monthly: { amount: 999, currency: 'eur' },
          yearly: { amount: 9999, currency: 'eur' },
        },
      }));

      renderWithProviders(<PricingTable {...defaultProps} plans={euroPlans} />);

      expect(screen.getByText('€9.99 / month')).toBeInTheDocument();
    });

    it('formats prices according to locale', () => {
      renderWithProviders(<PricingTable {...defaultProps} />);

      // US format should have $ symbol before amount
      expect(screen.getByText('$9.99 / month')).toBeInTheDocument();
    });
  });

  describe('Trial and Discounts', () => {
    it('shows trial information when available', () => {
      const plansWithTrial = testPlans.map(plan => ({
        ...plan,
        trialDays: plan.tier !== 'free' ? 14 : undefined,
      }));

      renderWithProviders(<PricingTable {...defaultProps} plans={plansWithTrial} />);

      expect(screen.getByText(/14-day free trial/i)).toBeInTheDocument();
    });

    it('displays discount badges', () => {
      renderWithProviders(<PricingTable {...defaultProps} billingInterval="year" />);

      const discountBadges = screen.getAllByTestId('discount-badge');
      expect(discountBadges.length).toBeGreaterThan(0);
    });

    it('calculates yearly savings correctly', () => {
      renderWithProviders(<PricingTable {...defaultProps} billingInterval="year" />);

      // Should show percentage saved
      expect(screen.getByText(/save \d+%/i)).toBeInTheDocument();
    });
  });
});
