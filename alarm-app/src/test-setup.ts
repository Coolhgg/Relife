import '@testing-library/jest-dom';

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  clearAllMocks: jest.clearAllMocks,
};

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock SpeechSynthesisUtterance and speechSynthesis
const MockSpeechSynthesisUtterance = jest.fn().mockImplementation(() => ({
  text: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null,
  lang: 'en',
}));
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
if (typeof window !== 'undefined') {
  window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
}

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => []),
    speaking: false,
    pending: false,
    paused: false,
  },
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock window timer functions
if (typeof window !== 'undefined') {
  window.setInterval = jest.fn();
  window.clearInterval = jest.fn();
  window.setTimeout = jest.fn();
  window.clearTimeout = jest.fn();
} else {
  global.setInterval = jest.fn();
  global.clearInterval = jest.fn();
  global.setTimeout = jest.fn();
  global.clearTimeout = jest.fn();
}

// Mock document methods
const mockElement = {
  focus: jest.fn(),
  blur: jest.fn(),
  click: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  remove: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
  style: {},
  textContent: '',
  innerHTML: '',
  id: '',
  className: '',
  parentNode: null,
};

// Mock document.createElement to return mock elements with required methods
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => ({
  ...mockElement,
  tagName: tagName.toUpperCase(),
  nodeName: tagName.toUpperCase(),
}));

// Mock document.getElementById
document.getElementById = jest.fn(() => null);

// Mock document.body and document.head
Object.defineProperty(document, 'body', {
  value: {
    ...mockElement,
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
});

Object.defineProperty(document, 'head', {
  value: {
    ...mockElement,
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock implementations for modules (these will be used by jest.mock calls in test files)
global.mockCapacitor = {
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
    platform: 'web',
  },
};

global.mockHaptics = {
  Haptics: {
    impact: jest.fn(),
    notification: jest.fn(),
    selection: jest.fn(),
  },
};

global.mockDevice = {
  Device: {
    getInfo: jest.fn(() => Promise.resolve({
      platform: 'web',
      model: 'Unknown',
      operatingSystem: 'unknown',
      osVersion: 'unknown',
    })),
  },
};

global.mockPostHog = {
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  isFeatureEnabled: jest.fn(() => false),
};

global.mockSentry = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({
    setTag: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn(),
  })),
};

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Suppress expected console errors in tests
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test helpers
global.testHelpers = {
  mockElement,
  mockStorage,
};

// Export testUtils for test files
export const testUtils = {
  mockElement,
  mockStorage,
  mockCreateElement: document.createElement,
  mockGetElementById: document.getElementById,
  clearAllMocks: () => {
    jest.clearAllMocks();
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    mockStorage.clear.mockClear();
  },
};