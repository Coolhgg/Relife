/**
 * Test setup for Service Tests
 *
 * This file configures the test environment for service testing,
 * including mocks for browser APIs and service dependencies.
 */

// Mock IndexedDB
const FDBKeyRange = {
  bound: jest.fn(),
  lowerBound: jest.fn(),
  upperBound: jest.fn(),
  only: jest.fn(),
};

const mockIDBRequest = () => ({
  onsuccess: null,
  onerror: null,
  result: null,
  readyState: 'done',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

const mockIDBObjectStore = {
  get: jest.fn(() => mockIDBRequest()),
  put: jest.fn(() => mockIDBRequest()),
  delete: jest.fn(() => mockIDBRequest()),
  clear: jest.fn(() => mockIDBRequest()),
  getAllKeys: jest.fn(() => ({ ...mockIDBRequest(), result: [] })),
  createIndex: jest.fn(),
  index: jest.fn(),
  add: jest.fn(() => mockIDBRequest()),
  count: jest.fn(() => mockIDBRequest()),
  getAll: jest.fn(() => ({ ...mockIDBRequest(), result: [] })),
};

const mockIDBTransaction = {
  objectStore: jest.fn(() => mockIDBObjectStore),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

const mockIDBDatabase = {
  transaction: jest.fn(() => mockIDBTransaction),
  close: jest.fn(),
  createObjectStore: jest.fn(() => mockIDBObjectStore),
  deleteObjectStore: jest.fn(),
  objectStoreNames: { contains: jest.fn(() => false) },
  version: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

const mockIDBOpenDBRequest = {
  ...mockIDBRequest(),
  onupgradeneeded: null,
  onblocked: null,
  result: mockIDBDatabase,
};

global.indexedDB = {
  open: jest.fn(() => mockIDBOpenDBRequest),
  deleteDatabase: jest.fn(() => mockIDBRequest()),
  databases: jest.fn(() => Promise.resolve([])),
  cmp: jest.fn(),
} as any;

global.IDBKeyRange = FDBKeyRange as any;

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
  },
});

// Mock document
Object.defineProperty(window, 'document', {
  value: {
    referrer: '',
    cookie: '',
    title: 'Test Page',
  },
});

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hostname: 'localhost',
    port: '3000',
    protocol: 'http:',
    pathname: '/',
    search: '',
    hash: '',
  },
});

// Mock Intl for timezone detection
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: jest.fn(() => ({
      resolvedOptions: jest.fn(() => ({ timeZone: 'America/New_York' })),
    })),
  },
});

// Mock console methods to reduce test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock timers
global.setTimeout = jest.fn((fn, delay) => {
  if (typeof fn === 'function') {
    fn();
  }
  return 1 as any;
});

global.setInterval = jest.fn((fn, delay) => {
  return 1 as any;
});

global.clearTimeout = jest.fn();
global.clearInterval = jest.fn();

// Mock process.env if it doesn't exist
if (typeof process === 'undefined') {
  (global as any).process = {
    env: {
      NODE_ENV: 'test',
    },
  };
}

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
    getRandomValues: jest.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
  },
});

// Export test utilities
export const testUtils = {
  mockIDBDatabase,
  mockIDBObjectStore,
  mockIDBTransaction,
  mockIDBRequest: mockIDBRequest(),
  mockStorage,

  // Helper to simulate IndexedDB success
  simulateIDBSuccess: (request: any, result?: any) => {
    setTimeout(() => {
      if (request.onsuccess) {
        request.result = result;
        request.onsuccess({ target: request });
      }
    }, 0);
  },

  // Helper to simulate IndexedDB error
  simulateIDBError: (request: any, error?: Error) => {
    setTimeout(() => {
      if (request.onerror) {
        request.error = error || new Error('IDB Error');
        request.onerror({ target: request });
      }
    }, 0);
  },

  // Helper to reset all mocks
  resetMocks: () => {
    jest.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
    mockStorage.length = 0;
  },
};

// Jest setup
beforeEach(() => {
  testUtils.resetMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

export default testUtils;
