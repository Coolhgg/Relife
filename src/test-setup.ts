import '@testing-library/jest-dom';

// Import MSW setup for API mocking
import './__tests__/mocks/msw-setup';

// Import hook testing utilities
import { setupGlobalMocks } from './__tests__/utils/hook-testing-utils';

// Setup global mocks for all tests
setupGlobalMocks();

// Mock localStorage and sessionStorage
const createMockStorage = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
});

const mockStorage = createMockStorage();

// Ensure global objects are available
if (typeof global !== 'undefined') {
  global.localStorage = global.localStorage || mockStorage;
  global.sessionStorage = global.sessionStorage || mockStorage;
  
  // Mock window.matchMedia
  global.matchMedia = global.matchMedia || jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

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

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
} as any;

global.speechSynthesis = mockSpeechSynthesis;

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

// Mock window timer functions with proper typing
const createTimerMock = (originalTimer: any) => {
  const mockFn = jest.fn(originalTimer) as any;
  mockFn.__promisify__ = jest.fn();
  return mockFn;
};

if (typeof window !== 'undefined') {
  (window as any).setInterval = createTimerMock(() => 1);
  (window as any).clearInterval = jest.fn();
  (window as any).setTimeout = createTimerMock(() => 1);
  (window as any).clearTimeout = jest.fn();
} else {
  (global as any).setInterval = createTimerMock(() => 1);
  (global as any).clearInterval = jest.fn();
  (global as any).setTimeout = createTimerMock(() => 1);
  (global as any).clearTimeout = jest.fn();
}

// Mock document methods with comprehensive HTMLElement properties
const createMockElement = (tagName: string = 'div') => ({
  // Core DOM methods
  focus: jest.fn(),
  blur: jest.fn(),
  click: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  
  // Attribute methods
  setAttribute: jest.fn(),
  getAttribute: jest.fn((attr: string) => {
    if (attr === 'class') return '';
    if (attr === 'id') return '';
    return null;
  }),
  removeAttribute: jest.fn(),
  hasAttribute: jest.fn(() => false),
  getAttributeNames: jest.fn(() => []),
  
  // DOM manipulation
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  insertBefore: jest.fn(),
  replaceChild: jest.fn(),
  cloneNode: jest.fn(() => createMockElement(tagName)),
  remove: jest.fn(),
  
  // Query methods
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn(() => null),
  getElementsByClassName: jest.fn(() => []),
  getElementsByTagName: jest.fn(() => []),
  
  // Element properties
  tagName: tagName.toUpperCase(),
  nodeName: tagName.toUpperCase(),
  nodeType: 1, // ELEMENT_NODE
  nodeValue: null,
  
  // Content properties
  textContent: '',
  innerHTML: '',
  outerHTML: `<${tagName}></${tagName}>`,
  innerText: '',
  
  // CSS and styling
  className: '',
  id: '',
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false),
    toggle: jest.fn(),
    replace: jest.fn(),
    forEach: jest.fn(),
    item: jest.fn(),
    length: 0,
    value: ''
  },
  style: new Proxy({}, {
    get: () => '',
    set: () => true
  }),
  
  // Layout and positioning
  getBoundingClientRect: jest.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: jest.fn()
  })),
  getClientRects: jest.fn(() => []),
  
  // Dimensions
  offsetWidth: 0,
  offsetHeight: 0,
  offsetTop: 0,
  offsetLeft: 0,
  offsetParent: null,
  clientWidth: 0,
  clientHeight: 0,
  clientTop: 0,
  clientLeft: 0,
  scrollWidth: 0,
  scrollHeight: 0,
  scrollTop: 0,
  scrollLeft: 0,
  
  // Hierarchy
  parentNode: null,
  parentElement: null,
  children: [],
  childNodes: [],
  firstChild: null,
  lastChild: null,
  firstElementChild: null,
  lastElementChild: null,
  nextSibling: null,
  previousSibling: null,
  nextElementSibling: null,
  previousElementSibling: null,
  childElementCount: 0,
  
  // Form-related (for input elements)
  value: '',
  checked: false,
  disabled: false,
  readonly: false,
  required: false,
  type: 'text',
  name: '',
  form: null,
  
  // Accessibility
  tabIndex: -1,
  title: '',
  lang: '',
  dir: '',
  hidden: false,
  
  // Additional HTMLElement properties
  contentEditable: 'inherit',
  isContentEditable: false,
  accessKey: '',
  accessKeyLabel: '',
  draggable: false,
  spellcheck: true,
  autocapitalize: '',
  translate: true,
  
  // Event handlers (commonly tested)
  onclick: null,
  onchange: null,
  oninput: null,
  onsubmit: null,
  onkeydown: null,
  onkeyup: null,
  onkeypress: null,
  onmousedown: null,
  onmouseup: null,
  onmouseover: null,
  onmouseout: null,
  onfocus: null,
  onblur: null,
  
  // Methods for React Testing Library
  matches: jest.fn(() => false),
  closest: jest.fn(() => null),
  contains: jest.fn(() => false),
  
  // Custom properties for test utilities
  dataset: new Proxy({}, {
    get: () => '',
    set: () => true
  }),
  
  // Additional methods that might be needed
  scrollIntoView: jest.fn(),
  setPointerCapture: jest.fn(),
  releasePointerCapture: jest.fn(),
  hasPointerCapture: jest.fn(() => false),
  
  // For compatibility with specific element types
  ...(tagName.toLowerCase() === 'input' && {
    select: jest.fn(),
    setSelectionRange: jest.fn(),
    checkValidity: jest.fn(() => true),
    reportValidity: jest.fn(() => true),
    setCustomValidity: jest.fn(),
  }),
  
  ...(tagName.toLowerCase() === 'form' && {
    submit: jest.fn(),
    reset: jest.fn(),
    checkValidity: jest.fn(() => true),
    reportValidity: jest.fn(() => true),
  }),
  
  ...(tagName.toLowerCase() === 'button' && {
    type: 'button',
  }),
});

const mockElement = createMockElement();

// Mock document.createElement to return properly typed mock elements
const originalCreateElement = document.createElement;
(document.createElement as any) = jest.fn((tagName: string, options?: ElementCreationOptions) => {
  return createMockElement(tagName);
});

// Mock document.getElementById with proper typing
(document.getElementById as any) = jest.fn((id: string) => null);

// Mock document.body and document.head with comprehensive elements
Object.defineProperty(document, 'body', {
  value: {
    ...createMockElement('body'),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(document, 'head', {
  value: {
    ...createMockElement('head'),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  writable: true,
  configurable: true,
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

// Global test helpers
global.testHelpers = {
  mockElement,
  mockStorage,
};

// Export testUtils for test files
export const testUtils = {
  mockElement,
  mockStorage,
  createMockElement,
  mockCreateElement: document.createElement,
  mockGetElementById: document.getElementById,
  
  // Mock alarm data that tests reference
  mockAlarm: {
    id: 'test-alarm-123',
    userId: 'test-user-123',
    time: '07:00',
    label: 'Test Alarm',
    enabled: true,
    isActive: true,
    days: [1, 2, 3, 4, 5], // weekdays
    dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as import('./types').DayOfWeek[],
    voiceMood: 'motivational' as const,
    sound: 'default-alarm.mp3',
    difficulty: 'medium' as const,
    snoozeEnabled: true,
    snoozeInterval: 5,
    snoozeCount: 0,
    maxSnoozes: 3,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  
  // Mock user data
  mockUser: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: '2023-01-01T00:00:00.000Z',
  },
  
  clearAllMocks: () => {
    jest.clearAllMocks();
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    mockStorage.clear.mockClear();
  },
};