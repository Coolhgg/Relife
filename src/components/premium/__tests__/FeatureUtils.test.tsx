/**
 * FeatureUtils Component Tests
 *
 * Tests utility components for feature display including FeatureBadge,
 * FeatureComparison, and other feature-related utilities.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  renderWithFeatureAccess,
} from '../../../__tests__/utils/render-helpers';
import { createTestPremiumFeature } from '../../../__tests__/factories/premium-factories';
import {
  FeatureBadge,
  FeatureComparison,
  FeatureHighlight,
  PremiumFeatureTooltip,
  FeatureUsageBar,
} from '../FeatureUtils';

describe('FeatureBadge', () => {
  describe('Rendering', () => {
    it('renders basic tier badge correctly', () => {
      renderWithProviders(<FeatureBadge tier="basic" />);

      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });

    it('renders premium tier badge correctly', () => {
      renderWithProviders(<FeatureBadge tier="premium" />);

      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('renders pro tier badge correctly', () => {
      renderWithProviders(<FeatureBadge tier="pro" />);

      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('applies correct styling for different variants', () => {
      const { rerender } = renderWithProviders(
        <FeatureBadge tier="premium" variant="subtle" />
      );

      const subtleBadge = screen.getByText('Premium');
      expect(subtleBadge).toHaveClass('bg-purple-100', 'text-purple-700');

      rerender(<FeatureBadge tier="premium" variant="prominent" />);

      const prominentBadge = screen.getByText('Premium');
      expect(prominentBadge).toHaveClass('bg-purple-600', 'text-white');
    });

    it('applies correct size classes', () => {
      const { rerender } = renderWithProviders(
        <FeatureBadge tier="premium" size="sm" />
      );

      let badge = screen.getByText('Premium');
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-1');

      rerender(<FeatureBadge tier="premium" size="lg" />);

      badge = screen.getByText('Premium');
      expect(badge).toHaveClass('text-lg', 'px-4', 'py-2');
    });

    it('applies custom className', () => {
      renderWithProviders(<FeatureBadge tier="premium" className="custom-class" />);

      const badge = screen.getByText('Premium');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Different Tiers', () => {
    it('uses correct colors for basic tier', () => {
      renderWithProviders(<FeatureBadge tier="basic" variant="prominent" />);

      const badge = screen.getByText('Basic');
      expect(badge).toHaveClass('bg-blue-600');
    });

    it('uses correct colors for premium tier', () => {
      renderWithProviders(<FeatureBadge tier="premium" variant="prominent" />);

      const badge = screen.getByText('Premium');
      expect(badge).toHaveClass('bg-purple-600');
    });

    it('uses correct colors for pro tier', () => {
      renderWithProviders(<FeatureBadge tier="pro" variant="prominent" />);

      const badge = screen.getByText('Pro');
      expect(badge).toHaveClass('bg-yellow-600');
    });
  });

  describe('Accessibility', () => {
    it('provides accessible names for badges', () => {
      renderWithProviders(<FeatureBadge tier="premium" />);

      const badge = screen.getByText('Premium');
      expect(badge).toHaveAccessibleName('Premium tier feature');
    });

    it('includes proper ARIA labels', () => {
      renderWithProviders(<FeatureBadge tier="premium" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Premium tier required');
    });
  });
});

describe('FeatureComparison', () => {
  const mockFeatures = [
    createTestPremiumFeature({
      id: 'unlimited_alarms',
      displayName: 'Unlimited Alarms',
      description: 'Create as many alarms as you need',
      tier: 'premium',
      category: 'alarms',
    }),
    createTestPremiumFeature({
      id: 'team_collaboration',
      displayName: 'Team Collaboration',
      description: 'Share alarms with your team',
      tier: 'pro',
      category: 'collaboration',
    }),
    createTestPremiumFeature({
      id: 'basic_alarms',
      displayName: 'Basic Alarms',
      description: 'Up to 5 alarms',
      tier: 'free',
      category: 'alarms',
    }),
  ];

  const defaultProps = {
    features: mockFeatures,
    currentTier: 'free' as const,
    showUpgradeButtons: true,
  };

  describe('Rendering', () => {
    it('renders all provided features', () => {
      renderWithProviders(<FeatureComparison {...defaultProps} />);

      expect(screen.getByText('Unlimited Alarms')).toBeInTheDocument();
      expect(screen.getByText('Team Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Basic Alarms')).toBeInTheDocument();
    });

    it('shows feature descriptions', () => {
      renderWithProviders(<FeatureComparison {...defaultProps} />);

      expect(screen.getByText('Create as many alarms as you need')).toBeInTheDocument();
      expect(screen.getByText('Share alarms with your team')).toBeInTheDocument();
    });

    it('displays tier badges for each feature', () => {
      renderWithProviders(<FeatureComparison {...defaultProps} />);

      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('groups features by category when specified', () => {
      renderWithProviders(
        <FeatureComparison {...defaultProps} groupByCategory={true} />
      );

      expect(screen.getByText('Alarms')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
    });
  });

  describe('Access Indicators', () => {
    it('shows checkmark for accessible features', () => {
      renderWithProviders(
        <FeatureComparison {...defaultProps} currentTier="premium" />
      );

      const checkIcons = screen.getAllByTestId('check-circle-icon');
      expect(checkIcons).toHaveLength(2); // Basic and Premium features
    });

    it('shows lock icon for inaccessible features', () => {
      renderWithProviders(<FeatureComparison {...defaultProps} />);

      const lockIcons = screen.getAllByTestId('lock-icon');
      expect(lockIcons).toHaveLength(2); // Premium and Pro features
    });

    it('dims inaccessible features', () => {
      renderWithProviders(<FeatureComparison {...defaultProps} />);

      const premiumFeature = screen
        .getByText('Unlimited Alarms')
        .closest('[data-testid="feature-item"]');
      expect(premiumFeature).toHaveClass('opacity-60');
    });
  });

  describe('Upgrade Buttons', () => {
    it('shows upgrade buttons for higher tier features', () => {
      renderWithProviders(<FeatureComparison {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /upgrade to premium/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /upgrade to pro/i })
      ).toBeInTheDocument();
    });

    it('hides upgrade buttons when showUpgradeButtons is false', () => {
      renderWithProviders(
        <FeatureComparison {...defaultProps} showUpgradeButtons={false} />
      );

      expect(
        screen.queryByRole('button', { name: /upgrade/i })
      ).not.toBeInTheDocument();
    });

    it('calls onUpgrade when upgrade button is clicked', async () => {
      const mockOnUpgrade = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <FeatureComparison {...defaultProps} onUpgrade={mockOnUpgrade} />
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade to premium/i });
      await user.click(upgradeButton);

      expect(mockOnUpgrade).toHaveBeenCalledWith('premium');
    });
  });
});

describe('FeatureHighlight', () => {
  const mockFeature = createTestPremiumFeature({
    id: 'premium_voices',
    displayName: 'Premium Voices',
    description: 'Access to high-quality voice options',
    tier: 'premium',
  });

  const defaultProps = {
    feature: mockFeature,
    currentTier: 'free' as const,
  };

  describe('Rendering', () => {
    it('renders feature name and description', () => {
      renderWithProviders(<FeatureHighlight {...defaultProps} />);

      expect(screen.getByText('Premium Voices')).toBeInTheDocument();
      expect(
        screen.getByText('Access to high-quality voice options')
      ).toBeInTheDocument();
    });

    it('shows tier badge', () => {
      renderWithProviders(<FeatureHighlight {...defaultProps} />);

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('highlights new features', () => {
      renderWithProviders(<FeatureHighlight {...defaultProps} isNew={true} />);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByTestId('new-feature-badge')).toBeInTheDocument();
    });

    it('shows popular badge when specified', () => {
      renderWithProviders(<FeatureHighlight {...defaultProps} isPopular={true} />);

      expect(screen.getByText('Popular')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('shows preview button for previewable features', () => {
      renderWithProviders(<FeatureHighlight {...defaultProps} showPreview={true} />);

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    });

    it('calls onPreview when preview button is clicked', async () => {
      const mockOnPreview = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <FeatureHighlight
          {...defaultProps}
          showPreview={true}
          onPreview={mockOnPreview}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledWith(mockFeature);
    });

    it('shows upgrade prompt for inaccessible features', () => {
      renderWithFeatureAccess(<FeatureHighlight {...defaultProps} />, 'free');

      expect(screen.getByText(/upgrade to access/i)).toBeInTheDocument();
    });
  });
});

describe('PremiumFeatureTooltip', () => {
  const mockFeature = createTestPremiumFeature({
    id: 'advanced_analytics',
    displayName: 'Advanced Analytics',
    description: 'Detailed insights into your sleep patterns',
    tier: 'pro',
  });

  describe('Rendering', () => {
    it('renders trigger element', () => {
      renderWithProviders(
        <PremiumFeatureTooltip feature={mockFeature}>
          <button>Hover me</button>
        </PremiumFeatureTooltip>
      );

      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PremiumFeatureTooltip feature={mockFeature}>
          <button>Hover me</button>
        </PremiumFeatureTooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
        expect(
          screen.getByText('Detailed insights into your sleep patterns')
        ).toBeInTheDocument();
      });
    });

    it('shows upgrade information in tooltip', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PremiumFeatureTooltip feature={mockFeature} currentTier="free">
          <button>Hover me</button>
        </PremiumFeatureTooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Pro')).toBeInTheDocument();
        expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PremiumFeatureTooltip feature={mockFeature}>
          <button>Hover me</button>
        </PremiumFeatureTooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      });

      await user.unhover(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Advanced Analytics')).not.toBeInTheDocument();
      });
    });
  });
});

describe('FeatureUsageBar', () => {
  const defaultProps = {
    featureName: 'Custom Alarms',
    used: 7,
    limit: 10,
    tier: 'premium' as const,
  };

  describe('Rendering', () => {
    it('renders feature name and usage', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} />);

      expect(screen.getByText('Custom Alarms')).toBeInTheDocument();
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
    });

    it('shows usage percentage', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} />);

      expect(screen.getByText('70% used')).toBeInTheDocument();
    });

    it('displays correct progress bar fill', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      expect(progressBar).toHaveStyle('width: 70%');
    });

    it('shows unlimited when limit is -1', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} limit={-1} />);

      expect(screen.getByText('7 / Unlimited')).toBeInTheDocument();
    });
  });

  describe('Warning States', () => {
    it('shows warning when near limit', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} used={9} limit={10} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      expect(progressBar).toHaveClass('bg-yellow-500');
      expect(screen.getByText('90% used')).toHaveClass('text-yellow-600');
    });

    it('shows error when at limit', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} used={10} limit={10} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      expect(progressBar).toHaveClass('bg-red-500');
      expect(screen.getByText('100% used')).toHaveClass('text-red-600');
    });

    it('shows upgrade prompt when at limit', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} used={10} limit={10} />);

      expect(screen.getByText(/upgrade for unlimited/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '7');
      expect(progressBar).toHaveAttribute('aria-valuemax', '10');
      expect(progressBar).toHaveAttribute(
        'aria-label',
        'Custom Alarms usage: 7 out of 10'
      );
    });

    it('announces warnings to screen readers', () => {
      renderWithProviders(<FeatureUsageBar {...defaultProps} used={10} limit={10} />);

      const announcement = screen.getByRole('alert');
      expect(announcement).toHaveTextContent('Usage limit reached for Custom Alarms');
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('handles missing feature data gracefully', () => {
    renderWithProviders(<FeatureBadge tier={null as any} />);

    expect(screen.getByText('Free')).toBeInTheDocument(); // Should default to free
  });

  it('handles invalid usage values', () => {
    renderWithProviders(
      <FeatureUsageBar featureName="Test Feature" used={-1} limit={10} tier="premium" />
    );

    expect(screen.getByText('0 / 10')).toBeInTheDocument(); // Should normalize to 0
  });

  it('handles component unmounting during interactions', () => {
    const { unmount } = renderWithProviders(
      <PremiumFeatureTooltip feature={createTestPremiumFeature()}>
        <button>Test</button>
      </PremiumFeatureTooltip>
    );

    unmount();

    expect(() => {
      jest.runAllTimers();
    }).not.toThrow();
  });
});
