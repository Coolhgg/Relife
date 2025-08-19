// Async testing utilities for promises, loading states, and time-dependent tests

import { waitFor, screen } from '@testing-library/react';
import { act } from 'react';
import { TEST_CONSTANTS } from './index';

// Generic async utilities
export const asyncUtils = {
  // Wait with timeout and custom error message
  waitWithTimeout: async <T>(
    operation: () => Promise<T>,
    timeout: number = TEST_CONSTANTS.API_TIMEOUT,
    errorMessage?: string
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage || `Operation timed out after ${timeout}ms`));
      }, timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  },

  // Retry operation with backoff
  retryWithBackoff: async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 100,
    backoffMultiplier: number = 2
  ): Promise<T> => {
    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          throw new Error(`Operation failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
        }

        await asyncUtils.delay(delay);
        delay *= backoffMultiplier;
      }
    }

    throw lastError!;
  },

  // Simple delay utility
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Wait for condition with polling
  waitForCondition: async (
    condition: () => boolean | Promise<boolean>,
    options: {
      timeout?: number;
      interval?: number;
      timeoutMessage?: string;
    } = {}
  ): Promise<void> => {
    const {
      timeout = TEST_CONSTANTS.API_TIMEOUT,
      interval = 100,
      timeoutMessage = 'Condition not met within timeout'
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) {
          return;
        }
      } catch (error) {
        // Continue polling even if condition throws
      }

      await asyncUtils.delay(interval);
    }

    throw new Error(`${timeoutMessage} (${timeout}ms)`);
  },

  // Execute multiple async operations concurrently
  concurrent: async <T>(operations: Array<() => Promise<T>>): Promise<T[]> => {
    return Promise.all(operations.map(op => op()));
  },

  // Execute operations with concurrency limit
  withConcurrencyLimit: async <T>(
    operations: Array<() => Promise<T>>,
    limit: number = 3
  ): Promise<T[]> => {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const operation of operations) {
      const promise = operation().then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
        const completed = executing.findIndex(p =>
          p === Promise.resolve(p).then(() => p)
        );
        if (completed !== -1) {
          executing.splice(completed, 1);
        }
      }
    }

    await Promise.all(executing);
    return results;
  }
};

// Loading state testing utilities
export const loadingStates = {
  // Wait for loading to start
  waitForLoadingToStart: async (
    getLoadingElement: () => HTMLElement | null = () => screen.queryByText(/loading|spinner/i),
    timeout: number = 2000
  ): Promise<HTMLElement> => {
    return waitFor(
      () => {
        const loadingElement = getLoadingElement();
        if (!loadingElement) {
          throw new Error('Loading state not found');
        }
        return loadingElement;
      },
      { timeout }
    );
  },

  // Wait for loading to finish
  waitForLoadingToFinish: async (
    getLoadingElement: () => HTMLElement | null = () => screen.queryByText(/loading|spinner/i),
    timeout: number = TEST_CONSTANTS.API_TIMEOUT
  ): Promise<void> => {
    await waitFor(
      () => {
        const loadingElement = getLoadingElement();
        if (loadingElement) {
          throw new Error('Still loading');
        }
      },
      { timeout }
    );
  },

  // Wait for content to appear after loading
  waitForContentAfterLoading: async <T extends HTMLElement>(
    getContentElement: () => T | null,
    options: {
      loadingSelector?: () => HTMLElement | null;
      timeout?: number;
      skipLoadingCheck?: boolean;
    } = {}
  ): Promise<T> => {
    const {
      loadingSelector = () => screen.queryByText(/loading|spinner/i),
      timeout = TEST_CONSTANTS.API_TIMEOUT,
      skipLoadingCheck = false
    } = options;

    // First wait for loading to finish (unless skipped)
    if (!skipLoadingCheck) {
      await loadingStates.waitForLoadingToFinish(loadingSelector, timeout);
    }

    // Then wait for content to appear
    return waitFor(
      () => {
        const content = getContentElement();
        if (!content) {
          throw new Error('Content not found after loading');
        }
        return content;
      },
      { timeout }
    );
  },

  // Test complete loading cycle
  testLoadingCycle: async (
    trigger: () => Promise<void> | void,
    expectations: {
      beforeLoading?: () => void;
      duringLoading?: () => void;
      afterLoading?: () => void;
    } = {},
    options: {
      loadingSelector?: () => HTMLElement | null;
      timeout?: number;
    } = {}
  ): Promise<void> => {
    const { loadingSelector, timeout = TEST_CONSTANTS.API_TIMEOUT } = options;

    // Check state before loading
    expectations.beforeLoading?.();

    // Trigger the operation
    await act(async () => {
      await trigger();
    });

    // Wait for and check loading state
    if (expectations.duringLoading) {
      await loadingStates.waitForLoadingToStart(loadingSelector, 2000);
      expectations.duringLoading();
    }

    // Wait for loading to finish and check final state
    await loadingStates.waitForLoadingToFinish(loadingSelector, timeout);
    expectations.afterLoading?.();
  }
};

// API and network testing utilities
export const apiUtils = {
  // Mock API response with delay
  mockApiResponse: <T>(data: T, delay: number = 100, shouldFail = false): Promise<T> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Mocked API error'));
        } else {
          resolve(data);
        }
      }, delay);
    });
  },

  // Mock network conditions
  mockNetworkConditions: {
    slow: <T>(data: T) => apiUtils.mockApiResponse(data, 3000),
    fast: <T>(data: T) => apiUtils.mockApiResponse(data, 50),
    offline: <T>(_data: T) => Promise.reject(new Error('Network offline')),
    timeout: <T>(_data: T) => new Promise(() => {}) // Never resolves
  },

  // Test API error scenarios
  testErrorScenarios: async (
    apiCall: () => Promise<any>,
    scenarios: Array<{
      name: string;
      mockImplementation: () => Promise<any>;
      expectedError?: string | RegExp;
      test?: () => void;
    }>
  ) => {
    for (const scenario of scenarios) {
      try {
        // Replace the API call with mock
        const originalCall = apiCall;
        const mockCall = scenario.mockImplementation;

        await mockCall();

        if (scenario.expectedError) {
          throw new Error(`Expected error for scenario: ${scenario.name}`);
        }
      } catch (error) {
        if (scenario.expectedError) {
          if (typeof scenario.expectedError === 'string') {
            expect(error.message).toContain(scenario.expectedError);
          } else {
            expect(error.message).toMatch(scenario.expectedError);
          }
        } else {
          throw error;
        }
      }

      scenario.test?.();
    }
  },

  // Wait for API calls to complete
  waitForApiCalls: async (expectedCalls: number = 1, timeout: number = TEST_CONSTANTS.API_TIMEOUT) => {
    // This would typically integrate with your API mocking system
    // For now, it's a placeholder that waits for the specified time
    await asyncUtils.delay(Math.min(timeout, expectedCalls * 100));
  }
};

// Promise testing utilities
export const promiseUtils = {
  // Test promise resolution
  expectToResolve: async <T>(promise: Promise<T>, expectedValue?: T): Promise<T> => {
    const result = await promise;
    if (expectedValue !== undefined) {
      expect(result).toEqual(expectedValue);
    }
    return result;
  },

  // Test promise rejection
  expectToReject: async (
    promise: Promise<any>,
    expectedError?: string | RegExp | Error
  ): Promise<Error> => {
    try {
      await promise;
      throw new Error('Expected promise to reject');
    } catch (error) {
      const err = error as Error;

      if (expectedError) {
        if (typeof expectedError === 'string') {
          expect(err.message).toContain(expectedError);
        } else if (expectedError instanceof RegExp) {
          expect(err.message).toMatch(expectedError);
        } else if (expectedError instanceof Error) {
          expect(err.message).toBe(expectedError.message);
        }
      }

      return err;
    }
  },

  // Test promise timing
  expectToResolveWithin: async <T>(
    promise: Promise<T>,
    maxTime: number,
    minTime: number = 0
  ): Promise<T> => {
    const startTime = Date.now();
    const result = await promise;
    const duration = Date.now() - startTime;

    expect(duration).toBeGreaterThanOrEqual(minTime);
    expect(duration).toBeLessThanOrEqual(maxTime);

    return result;
  },

  // Test multiple promises
  expectAllToResolve: async <T>(promises: Promise<T>[]): Promise<T[]> => {
    return Promise.all(promises);
  },

  expectAnyToResolve: async <T>(promises: Promise<T>[]): Promise<T> => {
    return Promise.race(promises);
  },

  // Create resolved/rejected promises for testing
  resolved: <T>(value: T): Promise<T> => Promise.resolve(value),
  rejected: (error: Error | string): Promise<never> =>
    Promise.reject(typeof error === 'string' ? new Error(error) : error)
};

// Timer and scheduling utilities
export const timerUtils = {
  // Advance timers and wait for effects
  advanceTimersAndWait: async (ms: number): Promise<void> => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
      await asyncUtils.delay(0); // Allow effects to run
    });
  },

  // Run all pending timers
  runAllTimersAndWait: async (): Promise<void> => {
    await act(async () => {
      jest.runAllTimers();
      await asyncUtils.delay(0);
    });
  },

  // Test component with fake timers
  withFakeTimers: async (test: () => Promise<void> | void): Promise<void> => {
    jest.useFakeTimers();

    try {
      await test();
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  },

  // Mock specific timer functions
  mockTimers: {
    setTimeout: (callback: () => void, delay: number) => {
      const mockFn = jest.fn(callback);
      setTimeout(mockFn, delay);
      return mockFn;
    },

    setInterval: (callback: () => void, interval: number) => {
      const mockFn = jest.fn(callback);
      const id = setInterval(mockFn, interval);
      return { mockFn, id };
    }
  }
};

// React-specific async utilities
export const reactAsync = {
  // Wait for React state updates
  waitForStateUpdate: async (component: any, stateProp: string, expectedValue: any): Promise<void> => {
    await waitFor(() => {
      expect(component.state?.[stateProp] || component[stateProp]).toBe(expectedValue);
    });
  },

  // Wait for props to change
  waitForPropsChange: async (element: HTMLElement, attribute: string, expectedValue: string): Promise<void> => {
    await waitFor(() => {
      expect(element.getAttribute(attribute)).toBe(expectedValue);
    });
  },

  // Wait for render completion
  waitForRenderComplete: async (callback?: () => void): Promise<void> => {
    await act(async () => {
      await asyncUtils.delay(0); // Wait for any pending updates
      callback?.();
    });
  },

  // Test component lifecycle
  testAsyncLifecycle: async (
    component: React.ComponentType<any>,
    phases: {
      mount?: () => void;
      update?: () => void;
      unmount?: () => void;
    }
  ): Promise<void> => {
    // This is a conceptual example - actual implementation would depend on your testing setup
    phases.mount?.();
    await reactAsync.waitForRenderComplete();

    phases.update?.();
    await reactAsync.waitForRenderComplete();

    phases.unmount?.();
  }
};

// Export all utilities
export const asyncHelpers = {
  utils: asyncUtils,
  loading: loadingStates,
  api: apiUtils,
  promises: promiseUtils,
  timers: timerUtils,
  react: reactAsync
};

// Export individual utilities for convenience
export {
  asyncUtils,
  loadingStates,
  apiUtils,
  promiseUtils,
  timerUtils,
  reactAsync
};

// Export as default
export default asyncHelpers;