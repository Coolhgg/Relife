import { expect, test, jest } from '@jest/globals';
/**
 * FeatureGate Component Tests
 *
 * Tests the core feature gating functionality that controls access to premium features
 * based on user subscription tier and usage limits.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  renderWithFeatureAccess,
} from '../../../__tests__/utils/render-helpers';
import {
  createTestSubscription,
  createTestPremiumFeature,
} from '../../../__tests__/factories/premium-factories';
import {
  FeatureGate,
  FeatureAccess,
  UsageLimitIndicator,
  withFeatureGate,
} from '../FeatureGate';

// Mock the useFeatureGate hook
const mockUseFeatureGate = {
  hasAccess: true,
  isGated: false,
  requiredTier: null,
  upgradeMessage: '',
  usageRemaining: 10,
  usageLimit: 50,
  canBypass: false,
  trackFeatureAttempt: jest.fn(),
  showUpgradeModal: jest.fn(),
  requestAccess: jest.fn(),
};

jest.mock('../../../hooks/useFeatureGate', () => ({
  __esModule: true,
  default: jest.fn(() => mockUseFeatureGate),
}));

// Test component that will be gated
const TestComponent: React.FC = () => (
  <div data-testid="gated-content">
    This is premium content that should only be visible with proper access
  </div>
);

describe('FeatureGate', () => {
  const defaultProps = {
    feature: 'premium_voices',
    userId: 'test-user-123',
    children: <TestComponent />,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default state
    Object.assign(mockUseFeatureGate, {
      hasAccess: true,
      isGated: false,
      requiredTier: null,
      upgradeMessage: '',
      usageRemaining: 10,
      usageLimit: 50,
      canBypass: false,
    });
  });

  describe('Access Control', () => {
    it('renders children when _user has access', () => {
      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'premium');

      expect(screen.getByTestId('gated-content')).toBeInTheDocument();
    });

    it('shows upgrade prompt when _user lacks access', () => {
      // Mock no access
      mockUseFeatureGate.hasAccess = false;
      mockUseFeatureGate.isGated = true;
      mockUseFeatureGate.requiredTier = 'premium';
      mockUseFeatureGate.upgradeMessage = 'Upgrade to Premium to access this feature';

      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

      expect(screen.queryByTestId('gated-content')).not.toBeInTheDocument();
      expect(
        screen.getByText('Upgrade to Premium to access this feature')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /upgrade to premium/i })
      ).toBeInTheDocument();
    });

    it('shows custom fallback when provided and access denied', () => {
      mockUseFeatureGate.hasAccess = false;
      mockUseFeatureGate.isGated = true;

      const fallback = <div data-testid="custom-fallback">Custom fallback content</div>;

      renderWithFeatureAccess(
        <FeatureGate {...defaultProps} fallback={fallback} />,
        'free'
      );

      expect(screen.queryByTestId('gated-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('returns null when showUpgradePrompt is false and access denied', () => {
      mockUseFeatureGate.hasAccess = false;
      mockUseFeatureGate.isGated = true;

      const { container } = renderWithFeatureAccess(
        <FeatureGate {...defaultProps} showUpgradePrompt={false} />,
        'free'
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Upgrade Prompts', () => {
    beforeEach(() => {
      mockUseFeatureGate.hasAccess = false;
      mockUseFeatureGate.isGated = true;
      mockUseFeatureGate.requiredTier = 'premium';
      mockUseFeatureGate.upgradeMessage = 'Upgrade to Premium to access premium voices';
    });

    it('displays correct tier information in upgrade prompt', () => {
      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(
        screen.getByText('Upgrade to Premium to access premium voices')
      ).toBeInTheDocument();
    });

    it('shows usage meter when limits are provided', () => {
      mockUseFeatureGate.usageRemaining = 3;
      mockUseFeatureGate.usageLimit = 10;

      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

      expect(screen.getByText('Usage this month')).toBeInTheDocument();
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
    });

    it('calls upgrade handler when upgrade button clicked', async () => {
      const onUpgradeClick = jest.fn();
      const user = userEvent.setup();

      renderWithFeatureAccess(
        <FeatureGate {...defaultProps} onUpgradeClick={onUpgradeClick} />,
        'free'
      );

      const upgradeButton = screen.getByRole('button', {
        name: /upgrade to premium/i,
      });
      await user.click(upgradeButton);

      expect(mockUseFeatureGate.showUpgradeModal).toHaveBeenCalled();
      expect(onUpgradeClick).toHaveBeenCalledWith('premium');
    });

    it('shows bypass button when soft gate enabled and bypass allowed', async () => {
      mockUseFeatureGate.canBypass = true;
      const user = userEvent.setup();

      renderWithFeatureAccess(
        <FeatureGate {...defaultProps} softGate={true} />,
        'free'
      );

      const bypassButton = screen.getByRole('button', { name: /try it once/i });
      expect(bypassButton).toBeInTheDocument();

      await user.click(bypassButton);
      expect(mockUseFeatureGate.requestAccess).toHaveBeenCalled();
    });

    it('displays custom message when provided', () => {
      const customMessage = 'Special offer: Get premium voices for just $5/month!';

      renderWithFeatureAccess(
        <FeatureGate {...defaultProps} customMessage={customMessage} />,
        'free'
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Different Subscription Tiers', () => {
    it('shows correct styling for basic tier requirement', () => {
      mockUseFeatureGate.hasAccess = false;
      mockUseFeatureGate.requiredTier = 'basic';

      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

      const upgradeButton = screen.getByRole('button', {
        name: /upgrade to basic/i,
      });
      expect(upgradeButton).toHaveClass('bg-blue-600');
    });

    it('shows correct styling for pro tier requirement', () => {
      mockUseFeatureGate.hasAccess = false;
      mockUseFeatureGate.requiredTier = 'pro';

      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'premium');

      const upgradeButton = screen.getByRole('button', {
        name: /upgrade to pro/i,
      });
      expect(upgradeButton).toHaveClass('bg-yellow-600');
    });
  });

  describe('Feature Tracking', () => {
    it('tracks feature attempt when gate is encountered', () => {
      mockUseFeatureGate.isGated = true;

      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

      expect(mockUseFeatureGate.trackFeatureAttempt).toHaveBeenCalled();
    });

    it('does not track feature attempt when _user has access', () => {
      mockUseFeatureGate.isGated = false;
      mockUseFeatureGate.hasAccess = true;

      renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'premium');

      expect(mockUseFeatureGate.trackFeatureAttempt).not.toHaveBeenCalled();
    });
  });
});

describe('FeatureAccess render prop component', () => {
  const defaultProps = {
    feature: 'premium_themes',
    userId: 'test-user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides access status and upgrade function to children', () => {
    const renderProp = jest.fn(() => <div>Rendered content</div>);

    renderWithFeatureAccess(
      <FeatureAccess {...defaultProps}>{renderProp}</FeatureAccess>,
      'premium'
    );

    expect(renderProp).toHaveBeenCalledWith(
      true, // hasAccess
      expect.any(Function) // upgrade function
    );
  });

  it('provides correct access status for free _user', () => {
    mockUseFeatureGate.hasAccess = false;
    const renderProp = jest.fn(() => <div>Rendered content</div>);

    renderWithFeatureAccess(
      <FeatureAccess {...defaultProps}>{renderProp}</FeatureAccess>,
      'free'
    );

    expect(renderProp).toHaveBeenCalledWith(
      false, // hasAccess
      expect.any(Function) // upgrade function
    );
  });

  it('calls upgrade modal when upgrade function is invoked', () => {
    const renderProp = jest.fn((hasAccess, upgrade) => (
      <button onClick={upgrade}>Upgrade Now</button>
    ));

    renderWithFeatureAccess(
      <FeatureAccess {...defaultProps}>{renderProp}</FeatureAccess>,
      'free'
    );

    fireEvent.click(screen.getByRole('button', { name: /upgrade now/i }));
    expect(mockUseFeatureGate.showUpgradeModal).toHaveBeenCalled();
  });
});

describe('UsageLimitIndicator', () => {
  const defaultProps = {
    feature: 'custom_sounds',
    userId: 'test-user-123',
  };

  beforeEach(() => {
    mockUseFeatureGate.usageLimit = 10;
    mockUseFeatureGate.usageRemaining = 3;
  });

  it('displays usage information correctly', () => {
    renderWithFeatureAccess(<UsageLimitIndicator {...defaultProps} />, 'premium');

    expect(screen.getByText('custom sounds Usage')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
  });

  it('shows warning when near limit', () => {
    mockUseFeatureGate.usageRemaining = 1; // 90% used (9/10)

    renderWithFeatureAccess(
      <UsageLimitIndicator {...defaultProps} warningThreshold={80} />,
      'premium'
    );

    expect(screen.getByText('1 uses remaining this month')).toBeInTheDocument();
  });

  it('shows _error state when at limit', () => {
    mockUseFeatureGate.usageRemaining = 0; // 100% used

    renderWithFeatureAccess(<UsageLimitIndicator {...defaultProps} />, 'premium');

    expect(
      screen.getByText("You've reached your limit. Upgrade for unlimited access!")
    ).toBeInTheDocument();
  });

  it('hides indicator when below warning threshold by default', () => {
    mockUseFeatureGate.usageRemaining = 8; // 20% used, below default 80% threshold

    const { container } = renderWithFeatureAccess(
      <UsageLimitIndicator {...defaultProps} />,
      'premium'
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows indicator regardless of threshold when showOnlyWhenNearLimit is false', () => {
    mockUseFeatureGate.usageRemaining = 8; // 20% used

    renderWithFeatureAccess(
      <UsageLimitIndicator {...defaultProps} showOnlyWhenNearLimit={false} />,
      'premium'
    );

    expect(screen.getByText('custom sounds Usage')).toBeInTheDocument();
  });

  it('returns null when no usage limit is set', () => {
    mockUseFeatureGate.usageLimit = undefined;
    mockUseFeatureGate.usageRemaining = undefined;

    const { container } = renderWithFeatureAccess(
      <UsageLimitIndicator {...defaultProps} />,
      'premium'
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('withFeatureGate HOC', () => {
  const TestComponentForHOC: React.FC<{ title: string }> = ({ title }) => (
    <div data-testid="hoc-content">{title}</div>
  );

  it('wraps component with feature gate', () => {
    const WrappedComponent = withFeatureGate(TestComponentForHOC, 'premium_themes');

    renderWithFeatureAccess(
      <WrappedComponent userId="test-_user-123" title="Test Title" />,
      'premium'
    );

    expect(screen.getByTestId('hoc-content')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('blocks access when feature is gated', () => {
    mockUseFeatureGate.hasAccess = false;
    mockUseFeatureGate.isGated = true;
    mockUseFeatureGate.requiredTier = 'premium';

    const WrappedComponent = withFeatureGate(TestComponentForHOC, 'premium_themes', {
      showUpgradePrompt: true,
    });

    renderWithFeatureAccess(
      <WrappedComponent userId="test-_user-123" title="Test Title" />,
      'free'
    );

    expect(screen.queryByTestId('hoc-content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument();
  });

  it('shows fallback when provided and access denied', () => {
    mockUseFeatureGate.hasAccess = false;
    mockUseFeatureGate.isGated = true;

    const fallback = <div data-testid="hoc-fallback">Fallback content</div>;
    const WrappedComponent = withFeatureGate(TestComponentForHOC, 'premium_themes', {
      fallback,
      showUpgradePrompt: false,
    });

    renderWithFeatureAccess(
      <WrappedComponent userId="test-_user-123" title="Test Title" />,
      'free'
    );

    expect(screen.queryByTestId('hoc-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  beforeEach(() => {
    mockUseFeatureGate.hasAccess = false;
    mockUseFeatureGate.isGated = true;
    mockUseFeatureGate.requiredTier = 'premium';
    mockUseFeatureGate.upgradeMessage = 'Upgrade to Premium';
  });

  it('provides proper ARIA labels for upgrade prompts', () => {
    renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

    const upgradeButton = screen.getByRole('button', {
      name: /upgrade to premium/i,
    });
    expect(upgradeButton).toHaveAccessibleName();
  });

  it('announces feature limitation to screen readers', () => {
    renderWithProviders(<FeatureGate {...defaultProps} />, {
      screenReaderEnabled: true,
      tier: 'free',
    });

    // Screen reader should have access to the upgrade message
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
  });

  it('provides keyboard navigation for upgrade prompts', async () => {
    const user = userEvent.setup();

    renderWithFeatureAccess(<FeatureGate {...defaultProps} />, 'free');

    const upgradeButton = screen.getByRole('button', {
      name: /upgrade to premium/i,
    });

    // Should be focusable
    await user.tab();
    expect(upgradeButton).toHaveFocus();

    // Should be activatable with keyboard
    await user.keyboard('{Enter}');
    expect(mockUseFeatureGate.showUpgradeModal).toHaveBeenCalled();
  });
});

describe('Edge Cases', () => {
  it('handles missing userId gracefully', () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

    renderWithFeatureAccess(
      <FeatureGate feature="premium_voices" userId="">
        <TestComponent />
      </FeatureGate>,
      'free'
    );

    // Should not crash, but may warn about missing userId
    expect(screen.getByTestId('gated-content')).toBeInTheDocument();

    consoleWarn.mockRestore();
  });

  it('handles invalid feature names', () => {
    renderWithFeatureAccess(
      <FeatureGate feature="" userId="test-_user-123">
        <TestComponent />
      </FeatureGate>,
      'free'
    );

    // Should render children when feature is invalid/empty
    expect(screen.getByTestId('gated-content')).toBeInTheDocument();
  });

  it('handles component unmounting during async operations', () => {
    const { unmount } = renderWithFeatureAccess(
      <FeatureGate {...defaultProps} />,
      'free'
    );

    // Unmount before any async operations complete
    unmount();

    // Should not cause any errors or memory leaks
    expect(() => {
      jest.runAllTimers();
    }).not.toThrow();
  });
});
