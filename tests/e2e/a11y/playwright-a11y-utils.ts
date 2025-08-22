/**
 * Playwright Accessibility Testing Utilities
 *
 * Comprehensive utilities for accessibility testing in Playwright E2E tests
 * using axe-core for WCAG compliance validation.
 */

import { Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Configuration for axe-core accessibility testing
 */
export interface AxeConfig {
  /** WCAG rules to include */
  include?: string[];
  /** Elements to exclude from testing */
  exclude?: string[];
  /** Specific axe rules to enable/disable */
  rules?: Record<string, { enabled: boolean }>;
  /** WCAG tags to test against */
  tags?: string[];
  /** Severity levels to report */
  reportSeverity?: ('critical' | 'serious' | 'moderate' | 'minor')[];
}

/**
 * Predefined axe configurations for different testing scenarios
 */
export const axeConfigs = {
  /** Critical accessibility rules that must never fail */
  critical: {
    tags: ['wcag2a', 'wcag2aa'],
    rules: {
      'color-contrast': { enabled: true },
      keyboard: { enabled: true },
      'focus-order-semantics': { enabled: true },
      label: { enabled: true },
      'aria-required-attr': { enabled: true },
      'button-name': { enabled: true },
      'link-name': { enabled: true },
      'image-alt': { enabled: true },
    },
    reportSeverity: ['critical', 'serious'] as const,
  },

  /** WCAG 2.1 AA compliance (default for most tests) */
  wcag21aa: {
    tags: ['wcag2a', 'wcag2aa'],
    reportSeverity: ['critical', 'serious', 'moderate'] as const,
  },

  /** Form-specific accessibility rules */
  forms: {
    tags: ['wcag2a', 'wcag2aa'],
    rules: {
      label: { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'duplicate-id-aria': { enabled: true },
      'aria-describedby': { enabled: true },
      'aria-required-attr': { enabled: true },
    },
  },

  /** Modal/Dialog specific rules */
  modals: {
    tags: ['wcag2a', 'wcag2aa'],
    rules: {
      'focus-order-semantics': { enabled: true },
      'aria-dialog-name': { enabled: true },
      keyboard: { enabled: true },
      'aria-required-attr': { enabled: true },
    },
  },

  /** Complete accessibility audit */
  comprehensive: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    reportSeverity: ['critical', 'serious', 'moderate', 'minor'] as const,
  },
};

/**
 * Enhanced accessibility testing utilities for Playwright
 */
export class PlaywrightA11yUtils {
  constructor(private page: Page) {}

  /**
   * Run axe accessibility tests on the current page
   */
  async runAxeTest(config: AxeConfig = axeConfigs.wcag21aa) {
    const axeBuilder = new AxeBuilder({ page: this.page });

    // Apply configuration
    if (config.include) {
      axeBuilder.include(config.include);
    }
    if (config.exclude) {
      axeBuilder.exclude(config.exclude);
    }
    if (config.tags) {
      axeBuilder.withTags(config.tags);
    }
    if (config.rules) {
      axeBuilder.configure({ rules: config.rules });
    }

    const accessibilityScanResults = await axeBuilder.analyze();

    // Filter violations by severity if specified
    if (config.reportSeverity) {
      accessibilityScanResults.violations = accessibilityScanResults.violations.filter(
        violation => config.reportSeverity!.includes(violation.impact as any)
      );
    }

    return accessibilityScanResults;
  }

  /**
   * Assert no accessibility violations
   */
  async expectNoViolations(config?: AxeConfig) {
    const results = await this.runAxeTest(config);

    if (results.violations.length > 0) {
      const violationMessages = results.violations
        .map(
          violation =>
            `${violation.id}: ${violation.description}\n` +
            `  Impact: ${violation.impact}\n` +
            `  Elements: ${violation.nodes.map(node => node.html).join(', ')}`
        )
        .join('\n\n');

      throw new Error(`Accessibility violations found:\n\n${violationMessages}`);
    }

    return results;
  }

  /**
   * Test keyboard navigation within a container
   */
  async testKeyboardNavigation(container?: Locator | string): Promise<{
    focusableElements: string[];
    tabOrder: string[];
    violations: string[];
  }> {
    const containerLocator =
      typeof container === 'string'
        ? this.page.locator(container)
        : container || this.page.locator('body');

    // Get all focusable elements
    const focusableSelectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const focusableElements: string[] = [];
    const tabOrder: string[] = [];
    const violations: string[] = [];

    for (const selector of focusableSelectors) {
      const elements = await containerLocator.locator(selector).all();
      for (const element of elements) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const id = (await element.getAttribute('id')) || '';
        const className = (await element.getAttribute('class')) || '';
        const identifier = id || `${tagName}.${className.split(' ')[0]}`;
        focusableElements.push(identifier);
      }
    }

    // Test tab navigation order
    if (focusableElements.length > 0) {
      await this.page.keyboard.press('Tab');

      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        const focused = await this.page.evaluate(() => {
          const activeEl = document.activeElement;
          if (!activeEl) return null;

          const id = activeEl.id || '';
          const tagName = activeEl.tagName.toLowerCase();
          const className = activeEl.className || '';
          return id || `${tagName}.${className.split(' ')[0]}`;
        });

        if (focused) {
          tabOrder.push(focused);
        }

        await this.page.keyboard.press('Tab');
      }
    }

    return { focusableElements, tabOrder, violations };
  }

  /**
   * Test focus management in modals/dialogs
   */
  async testModalFocus(modalSelector: string): Promise<{
    initialFocus: string | null;
    focusTrapped: boolean;
    restoresFocus: boolean;
  }> {
    // Store initially focused element
    const initiallyFocused = await this.page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() || null
    );

    // Open modal and check initial focus
    const modal = this.page.locator(modalSelector);
    await modal.waitFor({ state: 'visible' });

    const initialFocus = await this.page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() || null
    );

    // Test focus trap
    let focusTrapped = true;
    const modalFocusableElements = await modal
      .locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .count();

    if (modalFocusableElements > 1) {
      // Tab through modal elements and ensure focus stays within modal
      for (let i = 0; i < modalFocusableElements + 2; i++) {
        await this.page.keyboard.press('Tab');

        const currentFocus = await this.page.evaluate(selector => {
          const modalEl = document.querySelector(selector);
          const activeEl = document.activeElement;
          return modalEl?.contains(activeEl) || false;
        }, modalSelector);

        if (!currentFocus) {
          focusTrapped = false;
          break;
        }
      }
    }

    // Close modal and check focus restoration
    await this.page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });

    const finalFocus = await this.page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() || null
    );

    const restoresFocus = finalFocus === initiallyFocused;

    return {
      initialFocus,
      focusTrapped,
      restoresFocus,
    };
  }

  /**
   * Test screen reader announcements
   */
  async expectAnnouncement(
    action: () => Promise<void>,
    expectedText?: string,
    timeout = 3000
  ): Promise<string[]> {
    const announcements: string[] = [];

    // Set up listener for aria-live regions
    await this.page.evaluate(() => {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          const target = mutation.target as Element;
          const liveRegion = target.closest('[aria-live]');
          if (liveRegion && liveRegion.textContent) {
            (window as any).__announcements = (window as any).__announcements || [];
            (window as any).__announcements.push(liveRegion.textContent.trim());
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      (window as any).__announcements = [];
    });

    // Perform action
    await action();

    // Wait and collect announcements
    await this.page.waitForTimeout(timeout);

    const collectedAnnouncements = await this.page.evaluate(
      () => (window as any).__announcements || []
    );

    announcements.push(...collectedAnnouncements);

    if (expectedText) {
      const found = announcements.some(announcement =>
        announcement.includes(expectedText)
      );

      if (!found) {
        throw new Error(
          `Expected announcement "${expectedText}" not found. ` +
            `Actual announcements: ${announcements.join(', ')}`
        );
      }
    }

    return announcements;
  }

  /**
   * Test color contrast for specific elements
   */
  async testColorContrast(selector?: string): Promise<{
    passed: boolean;
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  }> {
    const results = await this.runAxeTest({
      rules: { 'color-contrast': { enabled: true } },
      include: selector ? [selector] : undefined,
    });

    const contrastViolations = results.violations.filter(
      v => v.id === 'color-contrast'
    );

    if (contrastViolations.length === 0) {
      return { passed: true, ratio: 7, wcagAA: true, wcagAAA: true };
    }

    // Extract contrast ratio from violation (this is simplified)
    const violation = contrastViolations[0];
    const ratioMatch = violation.description.match(/(\d+\.?\d*):1/);
    const ratio = ratioMatch ? parseFloat(ratioMatch[1]) : 0;

    return {
      passed: false,
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
    };
  }

  /**
   * Test touch target sizes
   */
  async testTouchTargets(minSize = 44): Promise<{
    elements: Array<{
      selector: string;
      width: number;
      height: number;
      adequate: boolean;
    }>;
    violations: number;
  }> {
    const touchableSelectors = ['button', 'a', 'input', '[role="button"]', '[onclick]'];
    const results: any[] = [];
    let violations = 0;

    for (const selector of touchableSelectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const box = await element.boundingBox();
        if (box) {
          const adequate = box.width >= minSize && box.height >= minSize;
          if (!adequate) violations++;

          results.push({
            selector,
            width: box.width,
            height: box.height,
            adequate,
          });
        }
      }
    }

    return {
      elements: results,
      violations,
    };
  }

  /**
   * Generate comprehensive accessibility report
   */
  async generateReport(testName: string): Promise<{
    testName: string;
    timestamp: string;
    url: string;
    axeResults: any;
    keyboardNav: any;
    colorContrast: any;
    touchTargets: any;
    summary: {
      violations: number;
      warnings: number;
      passed: boolean;
    };
  }> {
    const timestamp = new Date().toISOString();
    const url = this.page.url();

    // Run all tests
    const axeResults = await this.runAxeTest(axeConfigs.comprehensive);
    const keyboardNav = await this.testKeyboardNavigation();
    const colorContrast = await this.testColorContrast();
    const touchTargets = await this.testTouchTargets();

    const violations = axeResults.violations.length;
    const warnings = axeResults.incomplete.length;
    const passed = violations === 0;

    return {
      testName,
      timestamp,
      url,
      axeResults,
      keyboardNav,
      colorContrast,
      touchTargets,
      summary: {
        violations,
        warnings,
        passed,
      },
    };
  }
}

/**
 * Helper function to create PlaywrightA11yUtils instance
 */
export function createA11yUtils(page: Page): PlaywrightA11yUtils {
  return new PlaywrightA11yUtils(page);
}

/**
 * Common accessibility test patterns
 */
export const a11yPatterns = {
  /**
   * Test basic page accessibility
   */
  async testPageAccessibility(page: Page, config?: AxeConfig) {
    const a11y = createA11yUtils(page);
    return await a11y.expectNoViolations(config);
  },

  /**
   * Test form accessibility
   */
  async testFormAccessibility(page: Page, formSelector?: string) {
    const a11y = createA11yUtils(page);
    const config = formSelector
      ? { ...axeConfigs.forms, include: [formSelector] }
      : axeConfigs.forms;

    return await a11y.expectNoViolations(config);
  },

  /**
   * Test modal accessibility
   */
  async testModalAccessibility(page: Page, modalSelector: string) {
    const a11y = createA11yUtils(page);

    // Test accessibility
    const axeResults = await a11y.expectNoViolations({
      ...axeConfigs.modals,
      include: [modalSelector],
    });

    // Test focus management
    const focusResults = await a11y.testModalFocus(modalSelector);

    return { axeResults, focusResults };
  },
};
