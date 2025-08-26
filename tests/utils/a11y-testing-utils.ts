/*
 * Accessibility Testing Utilities
 * Provides jest-axe integration with component providers
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { axe, toHaveNoViolations, AxeResults } from 'jest-axe';

// Extend Jest matchers with axe
expect.extend(toHaveNoViolations);

// Re-export axe for direct use
export { axe };

/**
 * Enhanced render function that includes accessibility testing
 * Automatically wraps components with necessary providers
 */
export async function axeRender(
  ui: React.ReactElement,
  options?: RenderOptions & {
    /**
     * Axe configuration options
     */
    axeOptions?: {
      rules?: Record<string, any>;
      tags?: string[];
      exclude?: string[];
      include?: string[];
    };
    /**
     * Skip automatic axe test (useful when you want to run axe manually)
     */
    skipAxeTest?: boolean;
  }
): Promise<RenderResult & { axeResults?: AxeResults }> {
  // Import providers dynamically to avoid circular dependencies
  const { TestProviders } = await import(
    '../../src/__tests__/providers/test-providers'
  );

  // Wrap component with test providers
  const WrappedComponent = () => React.createElement(TestProviders, null, ui);

  const renderResult = render(React.createElement(WrappedComponent), options);

  // Run axe test automatically unless skipped
  if (!options?.skipAxeTest) {
    const axeResults = await axe(renderResult.container, options?.axeOptions);
    expect(axeResults).toHaveNoViolations();

    return {
      ...renderResult,
      axeResults,
    };
  }

  return renderResult;
}

/**
 * Run axe tests on an already rendered component
 */
export async function runAxeTest(
  container: Element,
  axeOptions?: {
    rules?: Record<string, any>;
    tags?: string[];
    exclude?: string[];
    include?: string[];
  }
): Promise<AxeResults> {
  const results = await axe(container, axeOptions);
  expect(results).toHaveNoViolations();
  return results;
}

/**
 * Predefined axe rule configurations for different testing scenarios
 */
export const axeRulesets = {
  /**
   * Critical accessibility rules that must never fail
   */
  critical: {
    rules: {
      'color-contrast': { enabled: true },
      keyboard: { enabled: true },
      'focus-order-semantics': { enabled: true },
      label: { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-required-children': { enabled: true },
      'aria-required-parent': { enabled: true },
      'button-name': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'image-alt': { enabled: true },
      'link-name': { enabled: true },
    },
  },

  /**
   * WCAG 2.1 AA compliance rules
   */
  wcag21aa: {
    tags: ['wcag2a', 'wcag2aa'],
  },

  /**
   * Form-specific accessibility rules
   */
  forms: {
    rules: {
      label: { enabled: true },
      'aria-required-attr': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'duplicate-id-aria': { enabled: true },
      'aria-describedby': { enabled: true },
    },
  },

  /**
   * Modal/Dialog specific rules
   */
  modals: {
    rules: {
      'focus-order-semantics': { enabled: true },
      'aria-dialog-name': { enabled: true },
      keyboard: { enabled: true },
      'aria-required-attr': { enabled: true },
    },
  },

  /**
   * Component library specific rules (for testing individual components)
   */
  components: {
    rules: {
      'button-name': { enabled: true },
      'link-name': { enabled: true },
      'image-alt': { enabled: true },
      label: { enabled: true },
      'color-contrast': { enabled: true },
      'aria-required-attr': { enabled: true },
    },
  },
};

/**
 * Test helper for checking specific accessibility patterns
 */
export const accessibilityPatterns = {
  /**
   * Test that an element is properly focusable
   */
  async testFocusable(element: HTMLElement): Promise<void> {
    element.focus();
    expect(document.activeElement).toBe(element);
  },

  /**
   * Test keyboard navigation within a container
   */
  async testKeyboardNavigation(
    container: HTMLElement,
    expectedFocusOrder: string[] // CSS selectors in expected order
  ): Promise<void> {
    const focusableElements = expectedFocusOrder.map(
      selector => container.querySelector(selector) as HTMLElement
    );

    // Test forward navigation
    for (let i = 0; i < focusableElements.length; i++) {
      if (focusableElements[i]) {
        focusableElements[i].focus();
        expect(document.activeElement).toBe(focusableElements[i]);
      }
    }
  },

  /**
   * Test ARIA labels and descriptions
   */
  testAriaLabeling(element: HTMLElement): {
    hasAccessibleName: boolean;
    hasDescription: boolean;
    accessibleName: string;
    description: string;
  } {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const ariaDescribedBy = element.getAttribute('aria-describedby');

    let accessibleName = '';
    let description = '';

    if (ariaLabel) {
      accessibleName = ariaLabel;
    } else if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      accessibleName = labelElement?.textContent || '';
    }

    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      description = descElement?.textContent || '';
    }

    return {
      hasAccessibleName: accessibleName.length > 0,
      hasDescription: description.length > 0,
      accessibleName,
      description,
    };
  },
};

/**
 * Accessibility test result reporter
 */
export const accessibilityReporter = {
  /**
   * Generate a comprehensive accessibility report
   */
  generateReport(
    testName: string,
    axeResults: AxeResults,
    additionalInfo?: Record<string, any>
  ): {
    testName: string;
    timestamp: string;
    passed: boolean;
    violations: number;
    incomplete: number;
    details: any;
    additionalInfo?: Record<string, any>;
  } {
    return {
      testName,
      timestamp: new Date().toISOString(),
      passed: axeResults.violations.length === 0,
      violations: axeResults.violations.length,
      incomplete: axeResults.incomplete.length,
      details: {
        violations: axeResults.violations,
        incomplete: axeResults.incomplete,
        passes: axeResults.passes.length,
        inapplicable: axeResults.inapplicable.length,
      },
      additionalInfo,
    };
  },

  /**
   * Save accessibility report to artifacts
   */
  async saveReport(report: any, filename?: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const reportFilename = filename || `a11y-report-${Date.now()}.json`;
    const reportPath = path.join(
      process.cwd(),
      'artifacts',
      'a11y-reports',
      reportFilename
    );

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  },
};

/**
 * Common accessibility test patterns
 */
export const commonA11yTests = {
  /**
   * Standard button accessibility test
   */
  async testButton(button: HTMLElement): Promise<AxeResults> {
    const container = button.parentElement || document.body;
    return await runAxeTest(container, axeRulesets.components);
  },

  /**
   * Standard form field accessibility test
   */
  async testFormField(field: HTMLElement): Promise<AxeResults> {
    const container = field.closest('form') || field.parentElement || document.body;
    return await runAxeTest(container, axeRulesets.forms);
  },

  /**
   * Standard modal/dialog accessibility test
   */
  async testModal(modal: HTMLElement): Promise<AxeResults> {
    return await runAxeTest(modal, axeRulesets.modals);
  },
};
