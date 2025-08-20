// Mock helpers and utilities for testing

import { TestUser, TestAlarm, TestTheme, testConsole } from "./index";

// Reset all mocks to clean state
export const _resetAllMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Reset Supabase mock
  if ((global as any).mockSupabase?._mockReset) {
    (global as any).mockSupabase._mockReset();
  }

  // Reset PostHog mock
  if ((global as any).mockPostHog?._mockReset) {
    (global as any).mockPostHog._mockReset();
  }

  // Reset Sentry mock
  if ((global as any).mockSentry?._mockReset) {
    (global as any).mockSentry._mockReset();
  }

  // Reset Capacitor mock
  if ((global as any).mockCapacitor?._mockReset) {
    (global as any).mockCapacitor._mockReset();
  }

  testConsole.debug("All mocks reset");
};

// Mock localStorage with data
export const _mockLocalStorage = (data: Record<string, string> = {}) => {
  const storage: Record<string, string> = { ...data };

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      }),
      length: Object.keys(storage).length,
      key: jest.fn((index: number) => Object.keys(storage)[index] || null),
    },
    writable: true,
  });

  return storage;
};

// Mock timers for testing
export const _mockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceBy: (ms: number) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    restore: () => jest.useRealTimers(),
  };
};

// Mock fetch with responses
export const _mockFetch = (
  responses: Array<{ url: string; response: any; status?: number }>,
) => {
  (global.fetch as jest.Mock) = jest.fn((url: string) => {
    const match = responses.find((r) => url.includes(r.url));
    if (match) {
      return Promise.resolve({
        ok: (match.status || 200) < 400,
        status: match.status || 200,
        json: () => Promise.resolve(match.response),
        text: () => Promise.resolve(JSON.stringify(match.response)),
      });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
};

// Mock console methods
export const _mockConsole = () => {
  const originalConsole = { ...console };

  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();

  return {
    restore: () => {
      Object.assign(console, originalConsole);
    },
    getLogs: () => (console.log as jest.Mock).mock.calls,
    getWarnings: () => (console.warn as jest.Mock).mock.calls,
    getErrors: () => (console.error as jest.Mock).mock.calls,
  };
};
