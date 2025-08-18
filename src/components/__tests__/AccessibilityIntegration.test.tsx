/**
 * Integration Tests for Accessibility Components
 * Tests the integration between AccessibilityDashboard, AccessibilityTester,
 * and related providers to ensure proper ARIA compliance and accessibility workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessibilityDashboard from '../AccessibilityDashboard';
import AccessibilityTester from '../AccessibilityTester';
import { renderWithAccessibilityProviders } from '../../__tests__/utils/render-helpers';
import { createTestAccessibilityPreferences } from '../../__tests__/factories/core-factories';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Integration Tests', () => {
  const mockOnClose = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock screen reader announcements
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        getVoices: jest.fn().mockReturnValue([]),
      },
    });
  });

  describe('Dashboard and Tester Integration', () => {
    it('should maintain ARIA compliance when both components are rendered', async () => {
      const { container } = renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Check for ARIA violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly manage focus when switching between components', async () => {
      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Find elements that should be focusable
      const dashboardButton = screen.getByRole('button', { name: /visual & display/i });
      const testerDialog = screen.getByRole('dialog', { name: /accessibility tester/i });

      // Test focus management
      await user.tab();
      expect(dashboardButton).toHaveFocus();

      // Focus should move to tester when tab continues
      await user.tab();
      const firstTesterElement = testerDialog.querySelector('[tabindex="0"]');
      expect(firstTesterElement).toBeInTheDocument();
    });

    it('should synchronize accessibility preferences between components', async () => {
      const preferences = createTestAccessibilityPreferences({
        highContrast: false,
        fontSize: 'medium',
        reducedMotion: false,
      });

      const { rerender } = renderWithAccessibilityProviders(
        <AccessibilityDashboard />,
        { accessibilityPreferences: preferences }
      );

      // Enable high contrast in dashboard
      const highContrastToggle = screen.getByRole('switch', { name: /high contrast/i });
      await user.click(highContrastToggle);

      // Rerender with tester and verify it reflects the same preferences
      rerender(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Check that tester shows the updated preference
      expect(screen.getByText(/high contrast.*enabled/i)).toBeInTheDocument();
    });
  });

  describe('Screen Reader Integration', () => {
    it('should coordinate screen reader announcements between components', async () => {
      const speakSpy = jest.spyOn(window.speechSynthesis, 'speak');

      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Trigger an announcement from dashboard
      const fontSizeButton = screen.getByRole('button', { name: /large/i });
      await user.click(fontSizeButton);

      // Verify announcement was made
      await waitFor(() => {
        expect(speakSpy).toHaveBeenCalled();
      });

      // Trigger an announcement from tester
      const contrastButton = screen.getByRole('button', { name: /check contrast/i });
      await user.click(contrastButton);

      // Verify both announcements work without conflicts
      expect(speakSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle screen reader testing workflow', async () => {
      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Enable screen reader mode in dashboard
      const screenReaderToggle = screen.getByRole('switch', { name: /screen reader support/i });
      await user.click(screenReaderToggle);

      // Navigate to screen reader testing section in tester
      const screenReaderTestButton = screen.getByRole('button', { name: /screen reader test/i });
      await user.click(screenReaderTestButton);

      // Verify proper ARIA labels are present
      expect(screen.getByLabelText(/reading order/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content structure/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility Integration', () => {
    it('should adapt interface for mobile accessibility', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Check for mobile-specific accessibility features
      const touchTargets = screen.getAllByRole('button');
      touchTargets.forEach(button => {
        const styles = getComputedStyle(button);
        // Touch targets should be at least 44px (iOS) or 48px (Android) 
        expect(parseInt(styles.minHeight) >= 44).toBeTruthy();
      });
    });

    it('should provide proper touch accessibility', async () => {
      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>,
        { 
          mobileAccessibility: {
            touchTargetSize: 'large',
            hapticFeedback: true,
            gestureSupport: true,
          }
        }
      );

      // Find touch settings
      const touchSection = screen.getByText(/touch & interaction/i);
      await user.click(touchSection);

      // Verify touch-specific controls are available
      expect(screen.getByRole('slider', { name: /touch target size/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /haptic feedback/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('should maintain keyboard navigation across components', async () => {
      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Test tab order across both components
      const focusableElements = screen.getAllByRole('button').concat(
        screen.getAllByRole('switch'),
        screen.getAllByRole('slider')
      );

      // Navigate through all focusable elements
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await user.tab();
        expect(document.activeElement).toBeVisible();
        expect(document.activeElement).toHaveAttribute('tabindex');
      }
    });

    it('should trap focus within tester dialog', async () => {
      renderWithAccessibilityProviders(
        <AccessibilityTester isVisible={true} onClose={mockOnClose} />
      );

      const dialog = screen.getByRole('dialog');
      const firstButton = dialog.querySelector('button:first-of-type');
      const lastButton = dialog.querySelector('button:last-of-type');

      // Focus should start at first element
      if (firstButton) {
        firstButton.focus();
        expect(firstButton).toHaveFocus();
      }

      // Shift+Tab from first element should go to last
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(lastButton).toHaveFocus();

      // Tab from last element should go to first
      await user.tab();
      expect(firstButton).toHaveFocus();
    });
  });

  describe('ARIA Compliance Integration', () => {
    it('should maintain proper ARIA relationships between components', async () => {
      const { container } = renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Check for proper ARIA landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Verify ARIA relationships
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');

      // Check for live regions
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should provide proper ARIA descriptions for complex interactions', async () => {
      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Check for aria-describedby on complex controls
      const fontSizeSlider = screen.getByRole('slider', { name: /font size/i });
      expect(fontSizeSlider).toHaveAttribute('aria-describedby');

      const contrastButton = screen.getByRole('button', { name: /check contrast/i });
      expect(contrastButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle accessibility errors gracefully across components', async () => {
      // Mock console.error to track error handling
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>,
        {
          accessibilityPreferences: null, // Simulate missing preferences
        }
      );

      // Components should still render with default values
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Should not have thrown unhandled errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Unhandled')
      );

      consoleSpy.mockRestore();
    });

    it('should provide accessible error messages', async () => {
      renderWithAccessibilityProviders(
        <AccessibilityTester isVisible={true} onClose={mockOnClose} />
      );

      // Trigger a contrast check error (invalid colors)
      const colorInput1 = screen.getByLabelText(/foreground color/i);
      const colorInput2 = screen.getByLabelText(/background color/i);
      const checkButton = screen.getByRole('button', { name: /check contrast/i });

      await user.clear(colorInput1);
      await user.type(colorInput1, 'invalid-color');
      await user.clear(colorInput2);
      await user.type(colorInput2, 'also-invalid');
      await user.click(checkButton);

      // Error should be announced and accessible
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('Performance Integration', () => {
    it('should not create accessibility performance bottlenecks', async () => {
      const start = performance.now();

      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Simulate rapid user interactions
      const toggles = screen.getAllByRole('switch');
      for (const toggle of toggles.slice(0, 5)) {
        await act(async () => {
          await user.click(toggle);
        });
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Accessibility Workflow Integration', () => {
    it('should support complete accessibility audit workflow', async () => {
      renderWithAccessibilityProviders(
        <div>
          <AccessibilityDashboard />
          <AccessibilityTester isVisible={true} onClose={mockOnClose} />
        </div>
      );

      // Step 1: Configure accessibility preferences in dashboard
      const highContrastToggle = screen.getByRole('switch', { name: /high contrast/i });
      await user.click(highContrastToggle);

      const fontSizeSlider = screen.getByRole('slider', { name: /font size/i });
      await user.click(fontSizeSlider);
      await user.keyboard('{ArrowRight}{ArrowRight}');

      // Step 2: Test configuration in tester
      const contrastTest = screen.getByRole('button', { name: /check contrast/i });
      await user.click(contrastTest);

      const keyboardTest = screen.getByRole('button', { name: /keyboard navigation/i });
      await user.click(keyboardTest);

      // Step 3: Verify results are properly displayed
      await waitFor(() => {
        expect(screen.getByText(/contrast.*ratio/i)).toBeInTheDocument();
      });

      // Step 4: Reset and test again
      const resetButton = screen.getByRole('button', { name: /reset.*default/i });
      await user.click(resetButton);

      // Verify settings were reset
      await waitFor(() => {
        const resetHighContrastToggle = screen.getByRole('switch', { name: /high contrast/i });
        expect(resetHighContrastToggle).not.toBeChecked();
      });
    });
  });
});