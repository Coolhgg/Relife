/**
 * Comprehensive test helper utilities for Relife testing system
 * Provides advanced testing patterns, helpers, and utilities
 */

import { act, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';

// Enhanced test assertion helpers
export interface TestAssertionOptions {
  timeout?: number;
  interval?: number;
  suppressLogs?: boolean;
  retries?: number;
}

// Test state management
export class TestStateManager {
  private static instance: TestStateManager;
  private state: Map<string, any> = new Map();
  private watchers: Map<string, Array<(value: any) => void>> = new Map();

  static getInstance(): TestStateManager {
    if (!TestStateManager.instance) {
      TestStateManager.instance = new TestStateManager();
    }
    return TestStateManager.instance;
  }

  set(key: string, value: any): void {
    this.state.set(key, value);
    this.notifyWatchers(key, value);
  }

  get<T = any>(key: string): T | undefined {
    return this.state.get(key);
  }

  watch(key: string, callback: (value: any) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }
    this.watchers.get(key)!.push(callback);

    // Return unwatch function
    return () => {
      const callbacks = this.watchers.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyWatchers(key: string, value: any): void {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  clear(): void {
    this.state.clear();
    this.watchers.clear();
  }

  snapshot(): Record<string, any> {
    return Object.fromEntries(this.state.entries());
  }

  restore(snapshot: Record<string, any>): void {
    this.state.clear();
    Object.entries(snapshot).forEach(([key, value]) => {
      this.state.set(key, value);
    });
  }
}

// Enhanced test utilities class
export class TestHelpers {
  private user: UserEvent;
  private stateManager = TestStateManager.getInstance();

  constructor() {
    this.user = userEvent.setup();
  }

  // Enhanced element queries with retry logic
  async findElementWithRetry(
    selector: string | (() => HTMLElement | null),
    options: TestAssertionOptions = {}
  ): Promise<HTMLElement> {
    const { timeout = 5000, interval = 100, retries = 3 } = options;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await waitFor(
          () => {
            const element =
              typeof selector === 'string'
                ? (document.querySelector(selector) as HTMLElement)
                : selector();

            if (!element) {
              throw new Error(`Element not found: ${selector}`);
            }

            return element;
          },
          { timeout, interval }
        );
      } catch (error) {
        if (attempt === retries - 1) throw error;
        await this.wait(1000); // Wait 1 second between retries
      }
    }

    throw new Error(`Element not found after ${retries} retries: ${selector}`);
  }

  // Advanced user interactions with realistic delays
  async typeWithDelay(
    element: HTMLElement,
    text: string,
    delay: number = 50
  ): Promise<void> {
    await act(async () => {
      for (const char of text) {
        await this.user.type(element, char);
        await this.wait(delay);
      }
    });
  }

  async clickAndWaitForResponse(
    element: HTMLElement,
    expectedChange: () => boolean | Promise<boolean>,
    options: TestAssertionOptions = {}
  ): Promise<void> {
    const { timeout = 5000 } = options;

    await act(async () => {
      await this.user.click(element);
    });

    await waitFor(
      async () => {
        const result = await expectedChange();
        if (!result) {
          throw new Error('Expected change did not occur after click');
        }
      },
      { timeout }
    );
  }

  async fillFormWithValidation(
    formData: Record<string, string>,
    validateField?: (fieldName: string, value: string) => Promise<boolean>
  ): Promise<void> {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = await this.findElementWithRetry(
        () =>
          screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') }) ||
          screen.getByLabelText(new RegExp(fieldName, 'i'))
      );

      await act(async () => {
        await this.user.clear(field);
        await this.user.type(field, value);
      });

      if (validateField) {
        await waitFor(async () => {
          const isValid = await validateField(fieldName, value);
          if (!isValid) {
            throw new Error(`Field validation failed for ${fieldName}`);
          }
        });
      }
    }
  }

  // Advanced waiting utilities
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    options: TestAssertionOptions = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) return;
      await this.wait(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  async waitForElement(
    getElement: () => HTMLElement | null,
    options: TestAssertionOptions = {}
  ): Promise<HTMLElement> {
    const { timeout = 5000 } = options;

    return waitFor(
      () => {
        const element = getElement();
        if (!element) {
          throw new Error('Element not found');
        }
        return element;
      },
      { timeout }
    );
  }

  async waitForElementToDisappear(
    getElement: () => HTMLElement | null,
    options: TestAssertionOptions = {}
  ): Promise<void> {
    const { timeout = 5000 } = options;

    await waitFor(
      () => {
        const element = getElement();
        if (element) {
          throw new Error('Element still exists');
        }
      },
      { timeout }
    );
  }

  // Form testing utilities
  async submitForm(
    form: HTMLElement,
    expectedResult: 'success' | 'error' | ((result: any) => boolean) = 'success'
  ): Promise<void> {
    await act(async () => {
      await this.user.click(
        form.querySelector('button[type="submit"]') ||
          form.querySelector('input[type="submit"]') ||
          (form.querySelector('[data-testid="submit"]') as HTMLElement)
      );
    });

    if (typeof expectedResult === 'function') {
      await this.waitForCondition(expectedResult);
    } else if (expectedResult === 'success') {
      await this.waitForCondition(() => {
        return !screen.queryByText(/error/i) && !screen.queryByText(/failed/i);
      });
    } else if (expectedResult === 'error') {
      await this.waitForCondition(() => {
        return !!screen.queryByText(/error/i) || !!screen.queryByText(/failed/i);
      });
    }
  }

  async validateFormField(
    fieldName: string,
    value: string,
    expectedValidation: 'valid' | 'invalid' | RegExp
  ): Promise<void> {
    const field = await this.findElementWithRetry(() =>
      screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') })
    );

    await act(async () => {
      await this.user.clear(field);
      await this.user.type(field, value);
      await this.user.tab(); // Trigger validation
    });

    if (expectedValidation === 'valid') {
      await this.waitForCondition(() => {
        return (
          !field.getAttribute('aria-invalid') ||
          field.getAttribute('aria-invalid') === 'false'
        );
      });
    } else if (expectedValidation === 'invalid') {
      await this.waitForCondition(() => {
        return field.getAttribute('aria-invalid') === 'true';
      });
    } else if (expectedValidation instanceof RegExp) {
      await this.waitForCondition(() => {
        const errorMessage = field.getAttribute('aria-describedby');
        if (errorMessage) {
          const errorElement = document.getElementById(errorMessage);
          return (
            errorElement && expectedValidation.test(errorElement.textContent || '')
          );
        }
        return false;
      });
    }
  }

  // Modal and dialog testing
  async openModal(trigger: HTMLElement): Promise<HTMLElement> {
    await act(async () => {
      await this.user.click(trigger);
    });

    return this.waitForElement(
      () =>
        (document.querySelector('[role="dialog"]') as HTMLElement) ||
        (document.querySelector('[data-testid="modal"]') as HTMLElement)
    );
  }

  async closeModal(
    closeMethod: 'escape' | 'close-button' | 'overlay' = 'escape'
  ): Promise<void> {
    if (closeMethod === 'escape') {
      await act(async () => {
        await this.user.keyboard('{Escape}');
      });
    } else if (closeMethod === 'close-button') {
      const closeButton = await this.findElementWithRetry(
        () =>
          (document.querySelector('[aria-label*="close"]') as HTMLElement) ||
          (document.querySelector('[data-testid="close"]') as HTMLElement)
      );
      await act(async () => {
        await this.user.click(closeButton);
      });
    } else if (closeMethod === 'overlay') {
      const overlay = await this.findElementWithRetry(
        () => document.querySelector('[data-testid="modal-overlay"]') as HTMLElement
      );
      await act(async () => {
        await this.user.click(overlay);
      });
    }

    await this.waitForElementToDisappear(
      () =>
        (document.querySelector('[role="dialog"]') as HTMLElement) ||
        (document.querySelector('[data-testid="modal"]') as HTMLElement)
    );
  }

  // Navigation and routing testing
  async navigateTo(
    path: string,
    method: 'link' | 'button' | 'programmatic' = 'link'
  ): Promise<void> {
    if (method === 'link') {
      const link = await this.findElementWithRetry(
        () =>
          screen.getByRole('link', { name: new RegExp(path, 'i') }) ||
          (document.querySelector(`a[href*="${path}"]`) as HTMLElement)
      );
      await act(async () => {
        await this.user.click(link);
      });
    } else if (method === 'button') {
      const button = await this.findElementWithRetry(() =>
        screen.getByRole('button', { name: new RegExp(path, 'i') })
      );
      await act(async () => {
        await this.user.click(button);
      });
    } else if (method === 'programmatic') {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    await this.waitForCondition(() => {
      return (
        window.location.pathname.includes(path) || window.location.href.includes(path)
      );
    });
  }

  async verifyCurrentRoute(expectedPath: string): Promise<void> {
    await this.waitForCondition(() => {
      return (
        window.location.pathname === expectedPath ||
        window.location.pathname.includes(expectedPath)
      );
    });
  }

  // Data loading and API testing
  async waitForDataLoad(
    indicator?: string,
    options: TestAssertionOptions = {}
  ): Promise<void> {
    const { timeout = 10000 } = options;

    // Wait for loading indicators to disappear
    if (indicator) {
      const loadingElement = document.querySelector(indicator);
      if (loadingElement) {
        await this.waitForElementToDisappear(
          () => document.querySelector(indicator) as HTMLElement
        );
      }
    } else {
      // Generic loading indicators
      const genericIndicators = [
        '[data-testid="loading"]',
        '.loading',
        '[aria-label*="loading"]',
        '[role="progressbar"]',
      ];

      for (const selector of genericIndicators) {
        const element = document.querySelector(selector);
        if (element) {
          await this.waitForElementToDisappear(
            () => document.querySelector(selector) as HTMLElement
          );
          break;
        }
      }
    }

    // Wait a bit more to ensure data is rendered
    await this.wait(100);
  }

  async verifyApiCall(
    mockSpy: jest.SpyInstance,
    expectedCalls: number,
    expectedArgs?: any[]
  ): Promise<void> {
    await this.waitForCondition(() => {
      return mockSpy.mock.calls.length === expectedCalls;
    });

    if (expectedArgs) {
      expect(mockSpy).toHaveBeenCalledWith(...expectedArgs);
    }
  }

  // Error boundary testing
  async triggerError(errorComponent: HTMLElement): Promise<void> {
    await act(async () => {
      // Simulate error by clicking error trigger
      await this.user.click(errorComponent);
    });

    await this.waitForElement(
      () =>
        screen.queryByText(/something went wrong/i) ||
        screen.queryByText(/error/i) ||
        (document.querySelector('[data-testid="error-boundary"]') as HTMLElement)
    );
  }

  async verifyErrorHandling(
    errorTrigger: () => Promise<void>,
    expectedErrorMessage?: string | RegExp
  ): Promise<void> {
    await act(async () => {
      await errorTrigger();
    });

    if (expectedErrorMessage) {
      await this.waitForElement(() => {
        if (typeof expectedErrorMessage === 'string') {
          return screen.queryByText(expectedErrorMessage);
        } else {
          return screen.queryByText(expectedErrorMessage);
        }
      });
    } else {
      await this.waitForElement(
        () =>
          screen.queryByText(/error/i) ||
          (document.querySelector('[data-testid="error"]') as HTMLElement)
      );
    }
  }

  // Performance testing helpers
  async measureRenderTime<T>(
    renderFunction: () => T | Promise<T>
  ): Promise<{ result: T; renderTime: number }> {
    const startTime = performance.now();

    const result = await act(async () => {
      return await renderFunction();
    });

    const renderTime = performance.now() - startTime;

    return { result, renderTime };
  }

  async measureInteractionTime(interaction: () => Promise<void>): Promise<number> {
    const startTime = performance.now();
    await interaction();
    return performance.now() - startTime;
  }

  // Accessibility testing helpers
  async verifyFocusManagement(
    interactions: Array<{ action: () => Promise<void>; expectedFocus: string }>
  ): Promise<void> {
    for (const { action, expectedFocus } of interactions) {
      await action();

      await this.waitForCondition(() => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;

        return (
          activeElement.matches(expectedFocus) ||
          activeElement.getAttribute('data-testid') === expectedFocus ||
          activeElement.textContent?.includes(expectedFocus)
        );
      });
    }
  }

  async verifyKeyboardNavigation(
    startElement: HTMLElement,
    keySequence: string[],
    expectedFinalFocus: string
  ): Promise<void> {
    await act(async () => {
      startElement.focus();
    });

    for (const key of keySequence) {
      await act(async () => {
        await this.user.keyboard(key);
      });
    }

    await this.waitForCondition(() => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;

      return (
        activeElement.matches(expectedFinalFocus) ||
        activeElement.getAttribute('data-testid') === expectedFinalFocus
      );
    });
  }

  // Mobile-specific testing helpers
  async simulateSwipe(
    element: HTMLElement,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100
  ): Promise<void> {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    let endX = startX;
    let endY = startY;

    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }

    await act(async () => {
      element.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: startX,
              clientY: startY,
            }),
          ],
        })
      );

      element.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: endX,
              clientY: endY,
            }),
          ],
        })
      );

      element.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: endX,
              clientY: endY,
            }),
          ],
        })
      );
    });
  }

  async simulateLongPress(element: HTMLElement, duration: number = 500): Promise<void> {
    await act(async () => {
      element.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: element.getBoundingClientRect().left,
              clientY: element.getBoundingClientRect().top,
            }),
          ],
        })
      );

      await this.wait(duration);

      element.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: element.getBoundingClientRect().left,
              clientY: element.getBoundingClientRect().top,
            }),
          ],
        })
      );
    });
  }

  // State management helpers
  saveTestState(key: string, value: any): void {
    this.stateManager.set(key, value);
  }

  getTestState<T = any>(key: string): T | undefined {
    return this.stateManager.get<T>(key);
  }

  watchTestState(key: string, callback: (value: any) => void): () => void {
    return this.stateManager.watch(key, callback);
  }

  clearTestState(): void {
    this.stateManager.clear();
  }

  snapshotTestState(): Record<string, any> {
    return this.stateManager.snapshot();
  }

  restoreTestState(snapshot: Record<string, any>): void {
    this.stateManager.restore(snapshot);
  }
}

// Create singleton instance for easy use
export const testHelpers = new TestHelpers();

// Enhanced assertion utilities
export class TestAssertions {
  static async expectToLoad(
    loadFunction: () => Promise<any>,
    maxTime: number = 3000
  ): Promise<void> {
    const startTime = performance.now();
    await loadFunction();
    const loadTime = performance.now() - startTime;

    expect(loadTime).toBeLessThan(maxTime);
  }

  static async expectToBeAccessible(element: HTMLElement): Promise<void> {
    // Check for ARIA attributes
    const hasAriaLabel =
      element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasRole = element.hasAttribute('role');
    const isFocusable =
      element.tabIndex >= 0 ||
      ['button', 'input', 'select', 'textarea', 'a'].includes(
        element.tagName.toLowerCase()
      );

    expect(hasAriaLabel || hasRole || isFocusable).toBe(true);

    // Check color contrast (simplified)
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;

    expect(backgroundColor).not.toBe(color); // Basic contrast check
  }

  static async expectToBeResponsive(element: HTMLElement): Promise<void> {
    const styles = window.getComputedStyle(element);

    const isResponsive =
      styles.width.includes('%') ||
      styles.width.includes('vw') ||
      styles.maxWidth === '100%' ||
      styles.display === 'flex' ||
      styles.display === 'grid';

    expect(isResponsive).toBe(true);
  }

  static expectToMatchSnapshot(component: any, name?: string): void {
    expect(component).toMatchSnapshot(name);
  }

  static async expectApiToHaveBeenCalled(
    mockFunction: jest.SpyInstance,
    times: number = 1,
    withArgs?: any[]
  ): Promise<void> {
    await testHelpers.waitForCondition(() => {
      return mockFunction.mock.calls.length === times;
    });

    if (withArgs) {
      expect(mockFunction).toHaveBeenCalledWith(...withArgs);
    }
  }

  static expectFormValidation(
    field: HTMLElement,
    isValid: boolean,
    errorMessage?: string
  ): void {
    if (isValid) {
      expect(field.getAttribute('aria-invalid')).not.toBe('true');
    } else {
      expect(field.getAttribute('aria-invalid')).toBe('true');

      if (errorMessage) {
        const errorId = field.getAttribute('aria-describedby');
        if (errorId) {
          const errorElement = document.getElementById(errorId);
          expect(errorElement?.textContent).toContain(errorMessage);
        }
      }
    }
  }
}

// Test utilities for specific Relife features
export class RelifeTestUtils {
  private helpers = new TestHelpers();

  async createTestAlarm(alarmData: Partial<any> = {}): Promise<void> {
    const defaultAlarm = {
      time: '07:00',
      label: 'Test Alarm',
      days: [1, 2, 3, 4, 5], // Monday to Friday
      voiceMood: 'gentle',
      difficulty: 'medium',
      ...alarmData,
    };

    // Navigate to alarm creation
    await this.helpers.navigateTo('/alarms/new');

    // Fill form
    await this.helpers.fillFormWithValidation(defaultAlarm);

    // Submit
    const form = await this.helpers.findElementWithRetry(
      () => document.querySelector('form') as HTMLElement
    );
    await this.helpers.submitForm(form, 'success');

    // Verify creation
    await this.helpers.verifyCurrentRoute('/alarms');
    await this.helpers.waitForElement(() => screen.queryByText(defaultAlarm.label));
  }

  async joinBattle(battleType: 'quick' | 'ranked' = 'quick'): Promise<void> {
    await this.helpers.navigateTo('/battles');

    const joinButton = await this.helpers.findElementWithRetry(() =>
      screen.getByRole('button', {
        name: new RegExp(`join ${battleType}`, 'i'),
      })
    );

    await this.helpers.clickAndWaitForResponse(
      joinButton,
      () => screen.queryByText(/waiting for opponents/i) !== null
    );
  }

  async testVoiceRecording(duration: number = 5000): Promise<void> {
    const recordButton = await this.helpers.findElementWithRetry(() =>
      screen.getByRole('button', { name: /record/i })
    );

    // Start recording
    await this.helpers.user.click(recordButton);

    await this.helpers.waitForElement(() => screen.queryByText(/recording/i));

    // Wait for duration
    await this.helpers.wait(duration);

    // Stop recording
    const stopButton = await this.helpers.findElementWithRetry(() =>
      screen.getByRole('button', { name: /stop/i })
    );

    await this.helpers.user.click(stopButton);

    // Verify recording completed
    await this.helpers.waitForElement(
      () => screen.queryByText(/recording complete/i) || screen.queryByText(/preview/i)
    );
  }

  async purchaseSubscription(tier: 'premium' | 'ultimate'): Promise<void> {
    await this.helpers.navigateTo('/subscription');

    const tierButton = await this.helpers.findElementWithRetry(() =>
      screen.getByRole('button', {
        name: new RegExp(`upgrade to ${tier}`, 'i'),
      })
    );

    await this.helpers.user.click(tierButton);

    // Handle payment flow (mock)
    await this.helpers.waitForElement(
      () => screen.queryByText(/payment/i) || screen.queryByText(/checkout/i)
    );

    const confirmButton = await this.helpers.findElementWithRetry(
      () =>
        screen.getByRole('button', { name: /confirm/i }) ||
        screen.getByRole('button', { name: /pay/i })
    );

    await this.helpers.user.click(confirmButton);

    // Verify success
    await this.helpers.waitForElement(
      () => screen.queryByText(/success/i) || screen.queryByText(/upgraded/i)
    );
  }
}

// Export all utilities
export { TestStateManager, TestHelpers, TestAssertions, RelifeTestUtils };
export const relifeTestUtils = new RelifeTestUtils();

// Export default comprehensive testing utilities
export default {
  TestStateManager,
  TestHelpers,
  TestAssertions,
  RelifeTestUtils,
  testHelpers,
  relifeTestUtils,
};
