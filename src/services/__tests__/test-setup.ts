/// <reference lib="dom" />
/**
 * Test setup for Analytics & Crash Reporting Services
 * Provides consistent test environment and mocks for all analytics tests
 */

import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend({
  toHaveBeenCalledWithObjectContaining(received: jest.Mock, expected: object) {
    const pass = received.mock.calls.some(
      (
        call: any) => call.some(
          arg => typeof arg === 'object' &&
            arg !== null &&
            Object.keys(expected).every(
              key => arg.hasOwnProperty(key) && arg[key] === expected[key]
            )
        )
    );

    if (pass) {
      return {
        message: () => `expected mock not to have been called with object containing ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected mock to have been called with object containing ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  },
});

// Mock browser APIs consistently across all tests
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn((key: string
) => {
      // Default return values for common test scenarios
      if (key === 'relife_consent') {
        return JSON.stringify({
          analytics: true,
          errorReporting: true,
          performance: true,
          timestamp: Date.now(),
          version: '1.0',
        });
      }
      if (key === 'relife_privacy_settings') {
        return JSON.stringify({
          dataRetention: 365,
          anonymizeIP: true,
          shareUsageData: false,
        });
      }
      return null;
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

// Mock Performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn((
) => 1000),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn((
) => []),
    getEntriesByName: jest.fn((
) => []),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
    },
    navigation: {
      type: 0,
      redirectCount: 0,
    },
    timing: {
      navigationStart: 1000,
      loadEventEnd: 2000,
      domContentLoadedEventEnd: 1500,
      responseStart: 1200,
      requestStart: 1100,
      fetchStart: 1000,
      domInteractive: 1300,
    },
  },
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback: any
) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn((
) => []),
})) as any;

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback: any
) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
})) as any;

// Mock URL and URLSearchParams
Object.defineProperty(global, 'URL', {
  writable: true,
  value: class URL {
    constructor(
      public href: string,
      base?: string
    ) {
      if (base && !href.startsWith('http')) {
        this.href = new URL(base).origin + '/' + href.replace(/^\//, '');
      }

      const url = new (global as any).URL(this.href);
      this.protocol = url.protocol;
      this.hostname = url.hostname;
      this.pathname = url.pathname;
      this.search = url.search;
      this.hash = url.hash;
      this.origin = url.origin;
    }

    protocol = '';
    hostname = '';
    pathname = '';
    search = '';
    hash = '';
    origin = '';
  },
});

// Mock Navigator
Object.defineProperty(global, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (compatible; Jest Test Environment)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'Test',
    onLine: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
    },
    permissions: {
      query: jest.fn().mockResolvedValue({ state: 'granted' }),
    },
    serviceWorker: {
      register: jest.fn().mockResolvedValue({}),
      ready: Promise.resolve({}),
    },
  },
});

// Mock Window methods
Object.defineProperty(global, 'window', {
  writable: true,
  value: {
    ...global.window,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    location: {
      href: 'https://localhost:3000',
      origin: 'https://localhost:3000',
      protocol: 'https:',
      hostname: 'localhost',
      pathname: '/',
      search: '',
      hash: '',
    },
    history: {
      pushState: jest.fn(),
      replaceState: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    },
    innerWidth: 1920,
    innerHeight: 1080,
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1080,
    },
  },
});

// Mock Date for consistent timestamps in tests
const mockDate = new Date('2023-01-01T00:00:00.000Z');
const OriginalDate = Date;

global.Date = jest.fn((dateString?: string | number | Date
) => {
  if (dateString) {
    return new OriginalDate(dateString);
  }
  return mockDate;
}) as any;

// Preserve static methods
Object.setPrototypeOf(global.Date, OriginalDate);
global.Date.now = jest.fn((
) => mockDate.getTime());
global.Date.UTC = OriginalDate.UTC;
global.Date.parse = OriginalDate.parse;

// Mock crypto for generating UUIDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn((
) => 'mock-uuid-123-456-789'),
    getRandomValues: jest.fn((array: Uint8Array
) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
});

// Mock console methods to track warnings and errors
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleLog = console.log;

// Store original methods for tests that need them
(global as any).originalConsole = {
  error: originalConsoleError,
  warn: originalConsoleWarn,
  info: originalConsoleInfo,
  log: originalConsoleLog,
};

// Mock console methods
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();
console.log = jest.fn();

// Utility function to restore console methods
(global as any).restoreConsole = (
) => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  console.log = originalConsoleLog;
};

// Mock fetch for API calls
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: (
) => Promise.resolve({}),
    text: (
) => Promise.resolve(''),
    headers: new Map(),
  })
) as any;

// Common test utilities
(global as any).testUtils = {
  // Reset all singleton instances
  resetSingletons: (
) => {
    const services = [
      'AnalyticsConfigService',
      'PrivacyComplianceService',
      'SentryService',
      'AnalyticsService',
      'AppAnalyticsService',
      'PerformanceAnalyticsService',
    ];

    services.forEach(service => {
      const serviceModule = require(
        `../${service.replace(/Service$/, '').toLowerCase()}`
      );
      if (serviceModule.default) {
        (serviceModule.default as any).instance = null;
      }
    });
  },

  // Create mock user data
  createMockUser: (overrides = {}
) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser123',
    displayName: 'Test User',
    avatar: undefined,
    level: 1,
    experience: 0,
    joinDate: '2023-01-01T00:00:00.000Z',
    lastActive: '2023-01-01T00:00:00.000Z',
    preferences: {
      theme: 'auto' as const,
      notificationsEnabled: true,
      voiceDismissalSensitivity: 5,
      defaultVoiceMood: 'motivational' as const,
      hapticFeedback: true,
      snoozeMinutes: 10,
      maxSnoozes: 3,
      rewardsEnabled: true,
      aiInsightsEnabled: true,
      personalizedMessagesEnabled: true,
      shareAchievements: false,
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    ...overrides,
  }),

  // Create mock alarm data
  createMockAlarm: (overrides = {}
) => ({
    id: 'alarm-123',
    time: '07:00',
    type: 'wake_up',
    enabled: true,
    repeatDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    ...overrides,
  }),

  // Create mock performance entry
  createMockPerformanceEntry: (overrides = {}
) => ({
    name: 'test-metric',
    entryType: 'measure',
    startTime: 1000,
    duration: 100,
    ...overrides,
  }),

  // Wait for async operations
  waitForAsync: (
) => new Promise(resolve => setTimeout(resolve, 0)),

  // Advance timers and wait
  advanceTimersAndWait: async (ms: number
) => {
    jest.advanceTimersByTime(ms);
    await (global as any).testUtils.waitForAsync();
  },
};

// Setup environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.REACT_APP_ENVIRONMENT = 'test';
process.env.REACT_APP_SENTRY_DSN = 'https://test@sentry.io/123456';
process.env.REACT_APP_POSTHOG_API_KEY = 'test-posthog-key';
process.env.REACT_APP_POSTHOG_HOST = 'https://test.posthog.com';

// Global test cleanup
afterEach((
) => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset timers
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers();
  }

  // Reset localStorage
  (global.localStorage.getItem as jest.Mock).mockClear();
  (global.localStorage.setItem as jest.Mock).mockClear();

  // Reset console mocks
  (console.error as jest.Mock).mockClear();
  (console.warn as jest.Mock).mockClear();
  (console.info as jest.Mock).mockClear();
  (console.log as jest.Mock).mockClear();

  // Reset performance.now
  (global.performance.now as jest.Mock).mockReturnValue(1000);

  // Reset Date.now
  (global.Date.now as jest.Mock).mockReturnValue(mockDate.getTime());
});

// Global test teardown
afterAll((
) => {
  // Restore original console methods
  (global as any).restoreConsole();
});

// Add custom Jest matchers types
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithObjectContaining(expected: object): R;
    }
  }
}

export {};
