// Accessibility testing utilities for WCAG compliance and inclusive design

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Accessibility violation interface
export interface AccessibilityViolation {
  type: 'error' | 'warning';
  rule: string;
  element: HTMLElement;
  message: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface ColorContrastResult {
  ratio: number;
  passes: { AA: boolean; AAA: boolean };
  foregroundColor: string;
  backgroundColor: string;
}

// Core accessibility utilities
export const _accessibilityCore = {
  // Get all focusable elements
  getFocusableElements: (container: HTMLElement = document.body): HTMLElement[] => {
    const selectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(container.querySelectorAll(selectors)).filter(el => {
      const element = el as HTMLElement;
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.hasAttribute('aria-hidden')
      );
    }) as HTMLElement[];
  },

  // Get accessible name
  getAccessibleName: (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const input = element as HTMLInputElement;
      const label = input.labels?.[0];
      if (label) return label.textContent || '';
    }

    return element.textContent || element.getAttribute('title') || '';
  },
};

// ARIA utilities
export const _ariaUtils = {
  // Validate ARIA attributes
  validateARIA: (element: HTMLElement): AccessibilityViolation[] => {
    const violations: AccessibilityViolation[] = [];

    // Check for empty aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel !== null && !ariaLabel.trim()) {
      violations.push({
        type: 'error',
        rule: 'empty-aria-label',
        element,
        message: 'aria-label attribute is empty',
        severity: 'serious',
        wcagLevel: 'A',
      });
    }

    return violations;
  },

  // Test screen reader announcements
  expectScreenReaderAnnouncement: async (
    trigger: () => void,
    expectedText?: string,
    timeout = 1000
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const announcements: string[] = [];

      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          const target = mutation.target as HTMLElement;
          const liveRegion = target.closest('[aria-live]');
          if (liveRegion) {
            announcements.push(liveRegion.textContent || '');
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      trigger();

      setTimeout(() => {
        observer.disconnect();
        if (expectedText && !announcements.some(a => a.includes(expectedText))) {
          reject(new Error(`Expected announcement "${expectedText}" not found`));
        }
        resolve();
      }, timeout);
    });
  },
};

// Color contrast utilities
export const _colorContrast = {
  // Calculate luminance
  getLuminance: (color: string): number => {
    const rgb = colorContrast.parseColor(color);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  // Parse color string to RGB values
  parseColor: (color: string): [number, number, number] => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }

    if (color.startsWith('rgb')) {
      const values = color.match(/\d+/g);
      return values ? [+values[0], +values[1], +values[2]] : [0, 0, 0];
    }

    return [0, 0, 0];
  },

  // Calculate contrast ratio
  calculateContrast: (fg: string, bg: string): ColorContrastResult => {
    const fgLum = colorContrast.getLuminance(fg);
    const bgLum = colorContrast.getLuminance(bg);
    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    return {
      ratio,
      passes: { AA: ratio >= 4.5, AAA: ratio >= 7 },
      foregroundColor: fg,
      backgroundColor: bg,
    };
  },

  // Test element contrast
  testElementContrast: (element: HTMLElement): ColorContrastResult => {
    const style = window.getComputedStyle(element);
    const fg = style.color;
    let bg = style.backgroundColor;

    // Find effective background color
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
      let parent = element.parentElement;
      while (parent && (!bg || bg === 'transparent')) {
        const parentStyle = window.getComputedStyle(parent);
        bg = parentStyle.backgroundColor;
        parent = parent.parentElement;
      }
      bg = bg || '#ffffff'; // Default to white
    }

    return colorContrast.calculateContrast(fg, bg);
  },
};

// Keyboard navigation utilities
export const _keyboardNavigation = {
  // Test tab order
  testTabOrder: async (
    container?: HTMLElement
  ): Promise<{
    focusableElements: HTMLElement[];
    violations: string[];
  }> => {
    const user = userEvent.setup();
    const elements = accessibilityCore.getFocusableElements(container);
    const violations: string[] = [];

    if (elements.length === 0) return { focusableElements: [], violations };

    // Test tab navigation
    elements[0].focus();
    for (let i = 1; i < elements.length; i++) {
      await user.tab();
      const focused = document.activeElement as HTMLElement;
      if (focused !== elements[i]) {
        violations.push(`Tab order violation at index ${i}`);
      }
    }

    return { focusableElements: elements, violations };
  },

  // Test focus trap
  testFocusTrap: async (container: HTMLElement): Promise<boolean> => {
    const user = userEvent.setup();
    const elements = accessibilityCore.getFocusableElements(container);

    if (elements.length < 2) return false;

    // Test forward wrap
    elements[elements.length - 1].focus();
    await user.tab();
    const wrappedForward = document.activeElement === elements[0];

    // Test backward wrap
    elements[0].focus();
    await user.tab({ shift: true });
    const wrappedBackward = document.activeElement === elements[elements.length - 1];

    return wrappedForward && wrappedBackward;
  },
};

// Screen reader utilities
export const _screenReader = {
  // Check image alt text
  checkImageAltText: (container: HTMLElement = document.body) => {
    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];

    return images.map(img => {
      const altText = img.getAttribute('alt') || '';
      const hasAlt = img.hasAttribute('alt');

      return {
        element: img,
        hasAltText: hasAlt,
        altText,
        isDecorative: altText === '' && hasAlt,
        isAccessible: hasAlt && (altText === '' || altText.trim().length > 0),
      };
    });
  },

  // Get page structure for screen readers
  getPageStructure: (container: HTMLElement = document.body) => ({
    headings: Array.from(
      container.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')
    ),
    landmarks: Array.from(
      container.querySelectorAll(
        'main,nav,header,footer,aside,[role="main"],[role="navigation"],[role="banner"],[role="contentinfo"],[role="complementary"]'
      )
    ),
    links: Array.from(container.querySelectorAll('a[href],[role="link"]')),
    buttons: Array.from(
      container.querySelectorAll(
        'button,[role="button"],input[type="button"],input[type="submit"]'
      )
    ),
    formControls: Array.from(
      container.querySelectorAll(
        'input,textarea,select,[role="textbox"],[role="combobox"]'
      )
    ),
  }),
};

// Accessibility test suite
export const _accessibilityTestSuite = {
  // Run comprehensive accessibility audit
  auditElement: (element: HTMLElement): AccessibilityViolation[] => {
    const violations: AccessibilityViolation[] = [];

    // ARIA validation
    violations.push(...ariaUtils.validateARIA(element));

    // Color contrast for text elements
    if (element.textContent && element.textContent.trim()) {
      const contrast = colorContrast.testElementContrast(element);
      if (!contrast.passes.AA) {
        violations.push({
          type: 'error',
          rule: 'color-contrast',
          element,
          message: `Color contrast ratio ${contrast.ratio.toFixed(2)} is below WCAG AA standard (4.5)`,
          severity: 'serious',
          wcagLevel: 'AA',
        });
      }
    }

    return violations;
  },

  // Test keyboard accessibility
  testKeyboardAccessibility: async (container?: HTMLElement) => {
    const tabTest = await keyboardNavigation.testTabOrder(container);
    const focusTrapTest = container
      ? await keyboardNavigation.testFocusTrap(container)
      : false;

    return {
      tabOrder: tabTest,
      focusTrap: focusTrapTest,
      passed: tabTest.violations.length === 0,
    };
  },
};

// Export grouped utilities
export const _accessibilityHelpers = {
  core: accessibilityCore,
  aria: ariaUtils,
  colorContrast,
  keyboard: keyboardNavigation,
  screenReader,
  testSuite: accessibilityTestSuite,
};

export default accessibilityHelpers;
