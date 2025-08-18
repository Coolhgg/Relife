import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock localStorage and sessionStorage
const createMockStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
});

const mockStorage = createMockStorage();

// Ensure global objects are available
if (typeof global !== 'undefined') {
  global.localStorage = global.localStorage || mockStorage;
  global.sessionStorage = global.sessionStorage || mockStorage;
  
  // Mock window.matchMedia
  global.matchMedia = global.matchMedia || vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock SpeechSynthesisUtterance and speechSynthesis
const MockSpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
  text: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null,
  lang: 'en',
}));
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as any;

global.speechSynthesis = mockSpeechSynthesis;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock window timer functions with proper typing
const createTimerMock = (originalTimer: any) => {
  const mockFn = vi.fn(originalTimer) as any;
  mockFn.__promisify__ = vi.fn();
  return mockFn;
};

if (typeof window !== 'undefined') {
  (window as any).setInterval = createTimerMock(() => 1);
  (window as any).clearInterval = vi.fn();
  (window as any).setTimeout = createTimerMock(() => 1);
  (window as any).clearTimeout = vi.fn();
} else {
  (global as any).setInterval = createTimerMock(() => 1);
  (global as any).clearInterval = vi.fn();
  (global as any).setTimeout = createTimerMock(() => 1);
  (global as any).clearTimeout = vi.fn();
}

// Mock document methods with comprehensive HTMLElement properties
const createMockElement = (tagName: string = 'div') => ({
  // Core DOM methods
  focus: vi.fn(),
  blur: vi.fn(),
  click: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  
  // Attribute methods
  setAttribute: vi.fn(),
  getAttribute: vi.fn((attr: string) => {
    if (attr === 'class') return '';
    if (attr === 'id') return '';
    return null;
  }),
  removeAttribute: vi.fn(),
  hasAttribute: vi.fn(() => false),
  getAttributeNames: vi.fn(() => []),
  
  // DOM manipulation
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  insertBefore: vi.fn(),
  replaceChild: vi.fn(),
  cloneNode: vi.fn(() => createMockElement(tagName)),
  remove: vi.fn(),
  
  // Query methods
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  getElementById: vi.fn(() => null),
  getElementsByClassName: vi.fn(() => []),
  getElementsByTagName: vi.fn(() => []),
  
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
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false),
    toggle: vi.fn(),
    replace: vi.fn(),
    forEach: vi.fn(),
    item: vi.fn(),
    length: 0,
    value: ''
  },
  style: new Proxy({}, {
    get: () => '',
    set: () => true
  }),
  
  // Layout and positioning
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  })),
  getClientRects: vi.fn(() => []),
  
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
  matches: vi.fn(() => false),
  closest: vi.fn(() => null),
  contains: vi.fn(() => false),
  
  // Custom properties for test utilities
  dataset: new Proxy({}, {
    get: () => '',
    set: () => true
  }),
  
  // Additional methods that might be needed
  scrollIntoView: vi.fn(),
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
  hasPointerCapture: vi.fn(() => false),
  
  // For compatibility with specific element types
  ...(tagName.toLowerCase() === 'input' && {
    select: vi.fn(),
    setSelectionRange: vi.fn(),
    checkValidity: vi.fn(() => true),
    reportValidity: vi.fn(() => true),
    setCustomValidity: vi.fn(),
  }),
  
  ...(tagName.toLowerCase() === 'form' && {
    submit: vi.fn(),
    reset: vi.fn(),
    checkValidity: vi.fn(() => true),
    reportValidity: vi.fn(() => true),
  }),
  
  ...(tagName.toLowerCase() === 'button' && {
    type: 'button',
  }),
});

const mockElement = createMockElement();

// Mock document.createElement to return properly typed mock elements
const originalCreateElement = document.createElement;
(document.createElement as any) = vi.fn((tagName: string, options?: ElementCreationOptions) => {
  return createMockElement(tagName);
});

// Mock document.getElementById with proper typing
(document.getElementById as any) = vi.fn((id: string) => null);

// Mock document.body and document.head with comprehensive elements
Object.defineProperty(document, 'body', {
  value: {
    ...createMockElement('body'),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(document, 'head', {
  value: {
    ...createMockElement('head'),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as any;

// Mock implementations for modules (these will be used by jest.mock calls in test files)
global.mockCapacitor = {
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    platform: 'web',
  },
};

global.mockHaptics = {
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
    selection: vi.fn(),
  },
};

global.mockDevice = {
  Device: {
    getInfo: vi.fn(() => Promise.resolve({
      platform: 'web',
      model: 'Unknown',
      operatingSystem: 'unknown',
      osVersion: 'unknown',
    })),
  },
};

global.mockPostHog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  isFeatureEnabled: vi.fn(() => false),
};

global.mockSentry = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => callback({
    setTag: vi.fn(),
    setContext: vi.fn(),
    setLevel: vi.fn(),
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
    vi.clearAllMocks();
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    mockStorage.clear.mockClear();
  },
};

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Ensure DOM is properly set up
if (typeof document !== 'undefined') {
  // Add a container to the body if it doesn't exist
  const body = document.body;
  if (!body.querySelector('#root')) {
    const container = document.createElement('div');
    container.id = 'root';
    body.appendChild(container);
  }
}