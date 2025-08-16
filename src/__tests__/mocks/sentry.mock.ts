// Sentry error tracking mock for testing

/**
 * Comprehensive Sentry mock for testing error handling and monitoring
 * Provides all methods used in the application with proper jest mocks
 */

const mockSentry = {
  // Initialization
  init: jest.fn((options: any) => {
    console.log('🔍 Mock Sentry initialized', options);
  }),

  // Error capturing
  captureException: jest.fn((exception: any, hint?: any) => {
    console.log('❌ Mock Sentry captureException', exception, hint);
    return 'mock-event-id-' + Math.random().toString(36).substr(2, 9);
  }),

  captureMessage: jest.fn((message: string, level?: any) => {
    console.log(`📝 Mock Sentry captureMessage: ${message}`, level);
    return 'mock-event-id-' + Math.random().toString(36).substr(2, 9);
  }),

  // Context and scope management
  withScope: jest.fn((callback: (scope: any) => void) => {
    const mockScope = {
      setTag: jest.fn((key: string, value: string) => {
        console.log(`🏷️ Mock Sentry setTag: ${key} = ${value}`);
      }),
      setContext: jest.fn((key: string, context: any) => {
        console.log(`📋 Mock Sentry setContext: ${key}`, context);
      }),
      setLevel: jest.fn((level: string) => {
        console.log(`📊 Mock Sentry setLevel: ${level}`);
      }),
      setUser: jest.fn((user: any) => {
        console.log('👤 Mock Sentry setUser', user);
      }),
      setExtra: jest.fn((key: string, extra: any) => {
        console.log(`➕ Mock Sentry setExtra: ${key}`, extra);
      }),
      setFingerprint: jest.fn((fingerprint: string[]) => {
        console.log('👆 Mock Sentry setFingerprint', fingerprint);
      }),
      clear: jest.fn(() => {
        console.log('🧹 Mock Sentry scope clear');
      })
    };
    
    callback(mockScope);
  }),

  // Global scope management
  setTag: jest.fn((key: string, value: string) => {
    console.log(`🏷️ Mock Sentry global setTag: ${key} = ${value}`);
  }),

  setContext: jest.fn((key: string, context: any) => {
    console.log(`📋 Mock Sentry global setContext: ${key}`, context);
  }),

  setUser: jest.fn((user: any) => {
    console.log('👤 Mock Sentry global setUser', user);
  }),

  setLevel: jest.fn((level: string) => {
    console.log(`📊 Mock Sentry global setLevel: ${level}`);
  }),

  setExtra: jest.fn((key: string, extra: any) => {
    console.log(`➕ Mock Sentry global setExtra: ${key}`, extra);
  }),

  // User feedback
  showReportDialog: jest.fn((options?: any) => {
    console.log('💬 Mock Sentry showReportDialog', options);
  }),

  // Breadcrumbs
  addBreadcrumb: jest.fn((breadcrumb: any) => {
    console.log('🍞 Mock Sentry addBreadcrumb', breadcrumb);
  }),

  // Performance monitoring
  startTransaction: jest.fn((context: any) => {
    console.log('🚀 Mock Sentry startTransaction', context);
    return {
      setTag: jest.fn(),
      setData: jest.fn(),
      setStatus: jest.fn(),
      finish: jest.fn(() => {
        console.log('✅ Mock Sentry transaction finished');
      }),
      startChild: jest.fn(() => mockSentry.startTransaction({}))
    };
  }),

  // Hub management
  getCurrentHub: jest.fn(() => ({
    getClient: jest.fn(() => ({
      captureException: mockSentry.captureException,
      captureMessage: mockSentry.captureMessage
    })),
    getScope: jest.fn(() => ({
      setTag: mockSentry.setTag,
      setContext: mockSentry.setContext,
      setUser: mockSentry.setUser,
      setLevel: mockSentry.setLevel,
      setExtra: mockSentry.setExtra
    })),
    withScope: mockSentry.withScope
  })),

  // Configuration
  configureScope: jest.fn((callback: (scope: any) => void) => {
    console.log('⚙️ Mock Sentry configureScope');
    mockSentry.withScope(callback);
  }),

  // Browser specific
  wrap: jest.fn((fn: Function) => {
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
  ErrorBoundary: jest.fn(({ children, fallback, onError }: any) => {
    // Mock error boundary component
    return children;
  }),

  withErrorBoundary: jest.fn((component: any, options?: any) => {
    console.log('🛡️ Mock Sentry withErrorBoundary', options);
    return component;
  }),

  // Profiling
  Profiler: jest.fn(({ children }: any) => children),

  // Tracing
  trace: jest.fn((operation: string, callback: () => any) => {
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
    BrowserTracing: jest.fn(() => ({
      name: 'BrowserTracing',
      setupOnce: jest.fn()
    })),
    Replay: jest.fn(() => ({
      name: 'Replay',
      setupOnce: jest.fn()
    })),
    CaptureConsole: jest.fn(() => ({
      name: 'CaptureConsole',
      setupOnce: jest.fn()
    }))
  },

  // Transport and client
  close: jest.fn((timeout?: number) => {
    console.log(`🔒 Mock Sentry close: ${timeout}ms`);
    return Promise.resolve(true);
  }),

  flush: jest.fn((timeout?: number) => {
    console.log(`🚽 Mock Sentry flush: ${timeout}ms`);
    return Promise.resolve(true);
  }),

  // Event processors
  addGlobalEventProcessor: jest.fn((processor: (event: any) => any) => {
    console.log('🔄 Mock Sentry addGlobalEventProcessor');
  }),

  // Internal methods for testing
  _mockReset: jest.fn(() => {
    // Reset all mocks for clean testing
    Object.values(mockSentry).forEach(value => {
      if (typeof value === 'function' && value.mockClear) {
        value.mockClear();
      }
    });
  }),

  _mockSetUser: jest.fn((user: any) => {
    mockSentry.setUser(user);
  }),

  _mockClearContext: jest.fn(() => {
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