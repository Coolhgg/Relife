// Sentry error tracking mock for testing
import { vi } from 'vitest';

/**
 * Comprehensive Sentry mock for testing error handling and monitoring
 * Provides all methods used in the application with proper vitest mocks
 */

const mockSentry = {
  // Initialization
  init: vi.fn((options: any) => {
    console.log('🔍 Mock Sentry initialized', options);
  }),

  // Error capturing
  captureException: vi.fn((exception: any, hint?: any) => {
    console.log('❌ Mock Sentry captureException', exception, hint);
    return 'mock-event-id-' + Math.random().toString(36).substr(2, 9);
  }),

  captureMessage: vi.fn((message: string, level?: any) => {
    console.log(`📝 Mock Sentry captureMessage: ${message}`, level);
    return 'mock-event-id-' + Math.random().toString(36).substr(2, 9);
  }),

  // Context and scope management
  withScope: vi.fn((callback: (scope: any) => void) => {
    const mockScope = {
      setTag: vi.fn((key: string, value: string) => {
        console.log(`🏷️ Mock Sentry setTag: ${key} = ${value}`);
      }),
      setContext: vi.fn((key: string, context: any) => {
        console.log(`📋 Mock Sentry setContext: ${key}`, context);
      }),
      setLevel: vi.fn((level: string) => {
        console.log(`📊 Mock Sentry setLevel: ${level}`);
      }),
      setUser: vi.fn((user: any) => {
        console.log('👤 Mock Sentry setUser', user);
      }),
      setExtra: vi.fn((key: string, extra: any) => {
        console.log(`➕ Mock Sentry setExtra: ${key}`, extra);
      }),
      setFingerprint: vi.fn((fingerprint: string[]) => {
        console.log('👆 Mock Sentry setFingerprint', fingerprint);
      }),
      clear: vi.fn(() => {
        console.log('🧹 Mock Sentry scope clear');
      })
    };

    callback(mockScope);
  }),

  // Global scope management
  setTag: vi.fn((key: string, value: string) => {
    console.log(`🏷️ Mock Sentry global setTag: ${key} = ${value}`);
  }),

  setContext: vi.fn((key: string, context: any) => {
    console.log(`📋 Mock Sentry global setContext: ${key}`, context);
  }),

  setUser: vi.fn((user: any) => {
    console.log('👤 Mock Sentry global setUser', user);
  }),

  setLevel: vi.fn((level: string) => {
    console.log(`📊 Mock Sentry global setLevel: ${level}`);
  }),

  setExtra: vi.fn((key: string, extra: any) => {
    console.log(`➕ Mock Sentry global setExtra: ${key}`, extra);
  }),

  // User feedback
  showReportDialog: vi.fn((options?: any) => {
    console.log('💬 Mock Sentry showReportDialog', options);
  }),

  // Breadcrumbs
  addBreadcrumb: vi.fn((breadcrumb: any) => {
    console.log('🍞 Mock Sentry addBreadcrumb', breadcrumb);
  }),

  // Performance monitoring
  startTransaction: vi.fn((context: any) => {
    console.log('🚀 Mock Sentry startTransaction', context);
    return {
      setTag: vi.fn(),
      setData: vi.fn(),
      setStatus: vi.fn(),
      finish: vi.fn(() => {
        console.log('✅ Mock Sentry transaction finished');
      }),
      startChild: vi.fn(() => mockSentry.startTransaction({}))
    };
  }),

  // Hub management
  getCurrentHub: vi.fn(() => ({
    getClient: vi.fn(() => ({
      captureException: mockSentry.captureException,
      captureMessage: mockSentry.captureMessage
    })),
    getScope: vi.fn(() => ({
      setTag: mockSentry.setTag,
      setContext: mockSentry.setContext,
      setUser: mockSentry.setUser,
      setLevel: mockSentry.setLevel,
      setExtra: mockSentry.setExtra
    })),
    withScope: mockSentry.withScope
  })),

  // Configuration
  configureScope: vi.fn((callback: (scope: any) => void) => {
    console.log('⚙️ Mock Sentry configureScope');
    mockSentry.withScope(callback);
  }),

  // Browser specific
  wrap: vi.fn((fn: Function) => {
    return (...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        mockSentry.captureException(error);
        throw error;
      }
    };
  }),

  // React integration
  ErrorBoundary: vi.fn(({ children, fallback, onError }: any) => {
    // Mock error boundary component
    return children;
  }),

  withErrorBoundary: vi.fn((component: any, options?: any) => {
    console.log('🛡️ Mock Sentry withErrorBoundary', options);
    return component;
  }),

  // Profiling
  Profiler: vi.fn(({ children }: any) => children),

  // Tracing
  trace: vi.fn((operation: string, callback: () => any) => {
    console.log(`📊 Mock Sentry trace: ${operation}`);
    return callback();
  }),

  // SDK information
  SDK_NAME: 'mock-sentry-javascript',
  SDK_VERSION: '7.0.0',

  // Severity levels
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Log: 'log',
    Info: 'info',
    Debug: 'debug'
  },

  // Integration mocks
  Integrations: {
    BrowserTracing: vi.fn(() => ({
      name: 'BrowserTracing',
      setupOnce: vi.fn()
    })),
    Replay: vi.fn(() => ({
      name: 'Replay',
      setupOnce: vi.fn()
    })),
    CaptureConsole: vi.fn(() => ({
      name: 'CaptureConsole',
      setupOnce: vi.fn()
    }))
  },

  // Transport and client
  close: vi.fn((timeout?: number) => {
    console.log(`🔒 Mock Sentry close: ${timeout}ms`);
    return Promise.resolve(true);
  }),

  flush: vi.fn((timeout?: number) => {
    console.log(`🚽 Mock Sentry flush: ${timeout}ms`);
    return Promise.resolve(true);
  }),

  // Event processors
  addGlobalEventProcessor: vi.fn((processor: (event: any) => any) => {
    console.log('🔄 Mock Sentry addGlobalEventProcessor');
  }),

  // Internal methods for testing
  _mockReset: vi.fn(() => {
    // Reset all mocks for clean testing
    Object.values(mockSentry).forEach(value => {
      if (typeof value === 'function' && value.mockClear) {
        value.mockClear();
      }
    });
  }),

  _mockSetUser: vi.fn((user: any) => {
    mockSentry.setUser(user);
  }),

  _mockClearContext: vi.fn(() => {
    console.log('🧹 Mock Sentry clear all context');
  })
};

// Create a factory function for creating fresh mocks
export const createMockSentry = () => ({
  ...mockSentry,
  Integrations: { ...mockSentry.Integrations },
  Severity: { ...mockSentry.Severity }
});

export default mockSentry;