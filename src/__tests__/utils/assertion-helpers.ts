// Custom Jest assertions and matchers for enhanced testing

// Vitest globals are available globally, no need to import
import { TestAlarm, TestUser, TestTheme } from './index';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAlarm(): R;
      toBeValidUser(): R;
      toBeValidTheme(): R;
      toHaveAccessibilityAttributes(): R;
      toBeResponsive(): R;
      toHandleErrors(): R;
      toLoadWithinTime(maxTime: number): R;
    }
  }
}

// Custom matcher: toBeValidAlarm
expect.extend({
  toBeValidAlarm(received: any) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.userId === 'string' &&
      typeof received.time === 'string' &&
      typeof received.label === 'string' &&
      typeof received.enabled === 'boolean' &&
      Array.isArray(received.days) &&
      Array.isArray(received.dayNames) &&
      [
        'gentle',
        'motivational',
        'drill-sergeant',
        'zen',
        'energetic',
        'custom',
      ].includes(received.voiceMood) &&
      ['easy', 'medium', 'hard', 'nuclear'].includes(received.difficulty);

    return {
      message: (
) =>
        pass
          ? `Expected ${received} not to be a valid alarm`
          : `Expected ${received} to be a valid alarm with required properties`,
      pass,
    };
  },
});

// Custom matcher: toBeValidUser
expect.extend({
  toBeValidUser(received: any) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      typeof received.name === 'string' &&
      ['user', 'premium', 'admin'].includes(received.role) &&
      received.email.includes('@') &&
      received.createdAt &&
      received.updatedAt;

    return {
      message: (
) =>
        pass
          ? `Expected ${received} not to be a valid user`
          : `Expected ${received} to be a valid user with required properties`,
      pass,
    };
  },
});

// Custom matcher: toBeValidTheme
expect.extend({
  toBeValidTheme(received: any) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      ['light', 'dark', 'gaming', 'seasonal', 'custom'].includes(received.category) &&
      received.colors &&
      typeof received.colors.primary === 'string' &&
      typeof received.colors.background === 'string';

    return {
      message: (
) =>
        pass
          ? `Expected ${received} not to be a valid theme`
          : `Expected ${received} to be a valid theme with required properties`,
      pass,
    };
  },
});

// Custom matcher: toHaveAccessibilityAttributes
expect.extend({
  toHaveAccessibilityAttributes(received: HTMLElement) {
    const hasAriaAttributes =
      received.hasAttribute('aria-label') ||
      received.hasAttribute('aria-labelledby') ||
      received.hasAttribute('aria-describedby');

    const hasRole = received.hasAttribute('role');
    const isFocusable =
      received.tabIndex >= 0 ||
      ['button', 'input', 'select', 'textarea', 'a'].includes(
        received.tagName.toLowerCase()
      );

    const pass = hasAriaAttributes || hasRole || isFocusable;

    return {
      message: (
) =>
        pass
          ? `Expected element not to have accessibility attributes`
          : `Expected element to have accessibility attributes (aria-*, role, or be focusable)`,
      pass,
    };
  },
});

// Custom matcher: toBeResponsive
expect.extend({
  toBeResponsive(received: HTMLElement) {
    const styles = window.getComputedStyle(received);
    const hasResponsiveWidth =
      styles.width === '100%' ||
      styles.maxWidth === '100%' ||
      styles.width.includes('vw');

    const hasFlexbox = styles.display === 'flex' || styles.display === 'grid';
    const hasResponsiveMargins =
      styles.marginLeft === 'auto' && styles.marginRight === 'auto';

    const pass = hasResponsiveWidth || hasFlexbox || hasResponsiveMargins;

    return {
      message: (
) =>
        pass
          ? `Expected element not to be responsive`
          : `Expected element to have responsive styling (width: 100%, flex/grid, or auto margins)`,
      pass,
    };
  },
});

// Custom matcher: toHandleErrors
expect.extend({
  async toHandleErrors(received: (
) => Promise<any> | any) {
    let errorThrown = false;
    let result;

    try {
      if (typeof received === 'function') {
        result = await received();
      } else {
        result = received;
      }
    } catch (error) {
      errorThrown = true;
    }

    const pass = !errorThrown;

    return {
      message: (
) =>
        pass
          ? `Expected function to throw an error`
          : `Expected function not to throw an error`,
      pass,
    };
  },
});

// Custom matcher: toLoadWithinTime
expect.extend({
  async toLoadWithinTime(received: (
) => Promise<any>, maxTime: number) {
    const startTime = performance.now();
    let loadedInTime = false;

    try {
      await received();
      const endTime = performance.now();
      loadedInTime = endTime - startTime <= maxTime;
    } catch (error) {
      loadedInTime = false;
    }

    return {
      message: (
) =>
        loadedInTime
          ? `Expected operation to take more than ${maxTime}ms`
          : `Expected operation to complete within ${maxTime}ms`,
      pass: loadedInTime,
    };
  },
});

// Helper functions for assertions
export const _assertValidAlarm = (alarm: any): alarm is TestAlarm => {
  expect(alarm).toBeValidAlarm();
  return true;
};

export const _assertValidUser = (user: any): user is TestUser => {
  expect(user).toBeValidUser();
  return true;
};

export const _assertValidTheme = (theme: any): theme is TestTheme => {
  expect(theme).toBeValidTheme();
  return true;
};

export const _assertAccessible = (element: HTMLElement
) => {
  expect(element).toHaveAccessibilityAttributes();
};

export const _assertResponsive = (element: HTMLElement
) => {
  expect(element).toBeResponsive();
};

export const _assertNoErrors = async (fn: (
) => Promise<any> | any
) => {
  expect(fn).toHandleErrors();
};

export const _assertFastLoad = async (
  fn: (
) => Promise<any>,
  maxTime: number = 1000

) => {
  expect(fn).toLoadWithinTime(maxTime);
};
