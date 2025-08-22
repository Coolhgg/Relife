// Vitest globals are available globally, no need to import
/**
 * AccessibilityTester Component Tests
 *
 * Tests accessibility testing interface including contrast checking,
 * screen reader simulation, and accessibility compliance validation.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/utils/render-helpers';
import AccessibilityTester from '../AccessibilityTester';

// Mock accessibility hooks
const mockUseAccessibility = {
  preferences: {
    screenReaderEnabled: false,
    highContrast: false,
    keyboardNavigationOnly: false,
  },
  updatePreferences: jest.fn(),
};

jest.mock('../hooks/useAccessibility', () => ({
  useAccessibility: () => mockUseAccessibility,
  useScreenReader: () => ({
    announce: jest.fn(),
    announceError: jest.fn(),
    announceSuccess: jest.fn(),
  }),
  useFocusManagement: () => ({
    trapFocus: jest.fn(() => () => {}),
    clearTrap: jest.fn(),
  }),
  useAccessibleTooltip: () => ({
    addTooltip: jest.fn(),
    removeAllTooltips: jest.fn(),
  }),
  useMobileAccessibility: () => ({
    isMobileScreenReaderActive: false,
    getMobileAccessibilityProps: jest.fn(() => ({})),
    touchDevice: false,
    hasHover: true,
  }),
  useHighContrast: () => ({
    isHighContrastActive: false,
    getHighContrastStyles: jest.fn(() => ({})),
  }),
  useReducedMotion: () => ({
    shouldReduceMotion: false,
    getAnimationProps: jest.fn(() => ({})),
  }),
  useColorBlindFriendly: () => ({
    getColorBlindFriendlyColor: jest.fn(color => color),
  }),
  useKeyboardNavigation: () => ({
    handleKeyboardNavigation: jest.fn(),
  }),
}));

describe('AccessibilityTester', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible', () => {
      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      expect(screen.getByText('Accessibility Tester')).toBeInTheDocument();
      expect(screen.getByText('Test accessibility features')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      renderWithProviders(<AccessibilityTester {...defaultProps} isVisible={false} />);

      expect(screen.queryByText('Accessibility Tester')).not.toBeInTheDocument();
    });
  });

  describe('Contrast Testing', () => {
    it('runs color contrast tests', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const contrastTestButton = screen.getByRole('button', {
        name: /test color contrast/i,
      });
      await user.click(contrastTestButton);

      await waitFor(() => {
        expect(screen.getByText(/contrast test results/i)).toBeInTheDocument();
      });
    });

    it('shows contrast ratios for different color combinations', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const contrastTestButton = screen.getByRole('button', {
        name: /test color contrast/i,
      });
      await user.click(contrastTestButton);

      await waitFor(() => {
        expect(screen.getByText(/4.5:1/)).toBeInTheDocument(); // WCAG AA ratio
        expect(screen.getByText(/7:1/)).toBeInTheDocument(); // WCAG AAA ratio
      });
    });
  });

  describe('Screen Reader Testing', () => {
    it('provides screen reader simulation', () => {
      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      expect(screen.getByText(/screen reader simulation/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /start simulation/i })
      ).toBeInTheDocument();
    });

    it('tests reading order', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const readingOrderButton = screen.getByRole('button', {
        name: /test reading order/i,
      });
      await user.click(readingOrderButton);

      expect(screen.getByText(/reading order test/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Testing', () => {
    it('tests tab navigation', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const tabTestButton = screen.getByRole('button', {
        name: /test tab navigation/i,
      });
      await user.click(tabTestButton);

      expect(screen.getByText(/tab navigation results/i)).toBeInTheDocument();
    });

    it('identifies focus traps', () => {
      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const focusTrapTest = screen.getByRole('button', { name: /test focus traps/i });
      expect(focusTrapTest).toBeInTheDocument();
    });
  });

  describe('ARIA Compliance Testing', () => {
    it('validates ARIA labels and roles', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const ariaTestButton = screen.getByRole('button', {
        name: /test aria compliance/i,
      });
      await user.click(ariaTestButton);

      await waitFor(() => {
        expect(screen.getByText(/aria compliance results/i)).toBeInTheDocument();
      });
    });

    it('checks for missing alt text', () => {
      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      expect(screen.getByText(/missing alt text check/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('traps focus within dialog', () => {
      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('closes on escape key', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityTester {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
