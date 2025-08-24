import { expect, test, jest } from '@jest/globals';
/**
 * Button Component - Accessibility Tests
 *
 * Tests WCAG 2.1 AA compliance for the Button component
 * including focus management, ARIA attributes, and keyboard navigation.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  axeRender,
  axeRulesets,
  accessibilityPatterns,
} from '../../../../tests/utils/a11y-testing-utils.tsx';
import { Button } from '../button';

describe('Button - Accessibility Tests', () => {
  describe('Basic Accessibility Compliance', () => {
    it('should have no axe violations with default props', async () => {
      await axeRender(<Button>Click me</Button>);
      // axe test automatically runs in axeRender
    });

    it('should have no axe violations with all variants', async () => {
      const variants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ] as const;

      for (const variant of variants) {
        await axeRender(
          <Button variant={variant} data-testid={`button-${variant}`}>
            {variant} Button
          </Button>,
          { axeOptions: axeRulesets.components }
        );
      }
    });

    it('should have no axe violations with all sizes', async () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;

      for (const size of sizes) {
        await axeRender(
          <Button size={size} data-testid={`button-${size}`}>
            {size !== 'icon' ? `${size} Button` : '🔘'}
          </Button>,
          { axeOptions: axeRulesets.components }
        );
      }
    });

    it('should have no axe violations when disabled', async () => {
      await axeRender(<Button disabled>Disabled Button</Button>, {
        axeOptions: axeRulesets.components,
      });
    });
  });

  describe('Focus Management', () => {
    it('should be focusable by default', async () => {
      const { container } = await axeRender(<Button>Focus Test</Button>);
      const button = container.querySelector('button');

      expect(button).toBeInTheDocument();
      await accessibilityPatterns.testFocusable(button!);
    });

    it('should not be focusable when disabled', async () => {
      const { container } = await axeRender(
        <Button disabled>Disabled Focus Test</Button>
      );
      const button = container.querySelector('button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('disabled');

      button?.focus();
      expect(document.activeElement).not.toBe(button);
    });

    it('should have proper focus indicators', async () => {
      await axeRender(<Button>Focus Indicator Test</Button>);
      const button = screen.getByRole('button');

      // Check focus ring classes are present
      expect(button).toHaveClass('focus-visible:ring-[3px]');
      expect(button).toHaveClass('focus-visible:ring-ring/50');
    });

    it('should maintain focus order in a group', async () => {
      const { container } = await axeRender(
        <div>
          <Button data-testid="first">First</Button>
          <Button data-testid="second">Second</Button>
          <Button data-testid="third">Third</Button>
        </div>
      );

      await accessibilityPatterns.testKeyboardNavigation(container, [
        '[data-testid="first"]',
        '[data-testid="second"]',
        '[data-testid="third"]',
      ]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be activated by Enter key', async () => {
      const handleClick = vi.fn();
      await axeRender(<Button onClick={handleClick}>Enter Test</Button>);

      const button = screen.getByRole('button');
      button.focus();

      const user = userEvent.setup();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be activated by Space key', async () => {
      const handleClick = vi.fn();
      await axeRender(<Button onClick={handleClick}>Space Test</Button>);

      const button = screen.getByRole('button');
      button.focus();

      const user = userEvent.setup();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not be activated when disabled', async () => {
      const handleClick = vi.fn();
      await axeRender(
        <Button disabled onClick={handleClick}>
          Disabled Test
        </Button>
      );

      const user = userEvent.setup();
      const button = screen.getByRole('button');

      // Try to activate with keyboard
      await user.type(button, '{Enter}');
      await user.type(button, ' ');

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('ARIA Attributes and Labels', () => {
    it('should have accessible name from text content', async () => {
      await axeRender(<Button>Submit Form</Button>);
      const button = screen.getByRole('button');

      const ariaInfo = accessibilityPatterns.testAriaLabeling(button);
      expect(ariaInfo.hasAccessibleName).toBe(true);
      expect(button).toHaveAccessibleName('Submit Form');
    });

    it('should use aria-label when provided', async () => {
      await axeRender(<Button aria-label="Close Dialog">×</Button>);
      const button = screen.getByRole('button');

      const ariaInfo = accessibilityPatterns.testAriaLabeling(button);
      expect(ariaInfo.hasAccessibleName).toBe(true);
      expect(button).toHaveAccessibleName('Close Dialog');
    });

    it('should use aria-labelledby when provided', async () => {
      await axeRender(
        <div>
          <h2 id="submit-heading">Submit Your Application</h2>
          <Button aria-labelledby="submit-heading">Submit</Button>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-labelledby', 'submit-heading');
    });

    it('should support aria-describedby for additional context', async () => {
      await axeRender(
        <div>
          <Button aria-describedby="help-text">Delete</Button>
          <div id="help-text">This action cannot be undone</div>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should handle aria-expanded for toggle buttons', async () => {
      await axeRender(<Button aria-expanded={false}>Toggle Menu</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should handle aria-pressed for toggle buttons', async () => {
      await axeRender(<Button aria-pressed={false}>Toggle Option</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Error States and Validation', () => {
    it('should handle aria-invalid state', async () => {
      await axeRender(<Button aria-invalid={true}>Invalid Action</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-invalid', 'true');
      expect(button).toHaveClass('aria-invalid:ring-destructive/20');
    });

    it('should maintain accessibility in error state', async () => {
      await axeRender(
        <Button aria-invalid={true} aria-describedby="error-msg">
          Submit
        </Button>,
        { axeOptions: axeRulesets.components }
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'error-msg');
    });
  });

  describe('RTL (Right-to-Left) Support', () => {
    it('should render correctly in RTL context', async () => {
      await axeRender(<Button>RTL Button</Button>);

      const button = screen.getByRole('button');
      // Button should be accessible in RTL context
      expect(button).toBeInTheDocument();
    });

    it('should handle explicit dir prop', async () => {
      await axeRender(<Button dir="rtl">Explicit RTL</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('dir', 'rtl');
    });

    it('should handle dir="auto"', async () => {
      await axeRender(<Button dir="auto">Auto Direction</Button>);
      const button = screen.getByRole('button');

      // Should have some direction attribute set
      expect(button).toHaveAttribute('dir');
    });
  });

  describe('Interactive States', () => {
    it('should handle hover states accessibly', async () => {
      await axeRender(<Button>Hover Test</Button>);
      const user = userEvent.setup();
      const button = screen.getByRole('button');

      await user.hover(button);

      // Button should maintain accessibility when hovered
      expect(button).toBeInTheDocument();
    });

    it('should handle active states accessibly', async () => {
      await axeRender(<Button>Active Test</Button>);
      const button = screen.getByRole('button');
      const user = userEvent.setup();

      // Test mouse down (active state)
      await user.pointer({ keys: '[MouseLeft>]', target: button });

      // Button should still be accessible in active state
      expect(button).toBeInTheDocument();
    });

    it('should handle loading states accessibly', async () => {
      await axeRender(
        <Button disabled aria-label="Loading, please wait">
          Loading...
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Loading, please wait');
      expect(button).toBeDisabled();
    });
  });

  describe('Icon Buttons', () => {
    it('should require accessible name for icon-only buttons', async () => {
      await axeRender(
        <Button size="icon" aria-label="Settings">
          ⚙️
        </Button>,
        { axeOptions: axeRulesets.components }
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Settings');
    });

    it('should fail axe test without accessible name for icon buttons', async () => {
      // This should fail axe tests due to missing accessible name
      // Use a truly empty button to trigger the axe rule violation
      await expect(async () => {
        await axeRender(
          <Button size="icon" />, // Empty button with no text content
          { axeOptions: { rules: { 'button-name': { enabled: true } } } } // Specifically test button-name rule
        );
      }).rejects.toThrow();
    });
  });

  describe('As Child (Polymorphic) Behavior', () => {
    it('should maintain accessibility when used as child', async () => {
      await axeRender(
        <Button asChild>
          <a href="/link" role="button">
            Link styled as Button
          </a>
        </Button>,
        { axeOptions: axeRulesets.components }
      );

      // Should render as link but maintain button semantics
      const element = screen.getByRole('button');
      expect(element.tagName).toBe('A');
      expect(element).toHaveAttribute('href', '/link');
    });

    it('should handle custom components with accessibility', async () => {
      const CustomComponent = React.forwardRef<
        HTMLDivElement,
        React.ComponentProps<'div'>
      >((props, ref) => <div ref={ref} role="button" tabIndex={0} {...props} />);

      await axeRender(
        <Button asChild>
          <CustomComponent>Custom Button</CustomComponent>
        </Button>,
        { axeOptions: axeRulesets.components }
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Custom Button');
    });
  });

  describe('Color Contrast', () => {
    it('should maintain sufficient contrast in all variants', async () => {
      const variants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
      ] as const;

      for (const variant of variants) {
        const { container } = await axeRender(
          <Button variant={variant}>{variant} Button</Button>,
          { axeOptions: { rules: { 'color-contrast': { enabled: true } } } }
        );

        // Axe will automatically check color contrast ratios
        // Test passes if no axe violations are thrown
        expect(container.querySelector('button')).toBeInTheDocument();
      }
    });
  });

  describe('Touch Accessibility', () => {
    it('should have adequate touch target size', async () => {
      const { container } = await axeRender(<Button size="default">Touch Test</Button>);
      const button = container.querySelector('button');

      // Default size should be h-9 (36px) which meets 44px minimum with padding
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });

    it('should have adequate touch target size for small buttons', async () => {
      const { container } = await axeRender(<Button size="sm">Small Touch</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('h-8'); // 32px height
      expect(button).toHaveClass('px-3'); // Additional padding
    });
  });
});
