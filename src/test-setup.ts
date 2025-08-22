/// <reference lib="dom" />
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Import MSW setup for API mocking
import './__tests__/mocks/msw-setup';

// Import hook testing utilities
import { setupGlobalMocks } from './__tests__/utils/hook-testing-utils';

// Setup global mocks for all tests
setupGlobalMocks();

// Mock localStorage and sessionStorage only if they don't exist or are not functional
const createMockStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
});

// Only mock storage if it doesn't exist or isn't functional
if (typeof global !== 'undefined') {
  // Check if localStorage works, if not mock it
  try {
    global.localStorage?.getItem('test');
  } catch {
    global.localStorage = createMockStorage();
  }

  // Check if sessionStorage works, if not mock it
  try {
    global.sessionStorage?.getItem('test');
  } catch {
    global.sessionStorage = createMockStorage();
  }

  // Mock window.matchMedia only if it doesn't exist
  if (!global.matchMedia) {
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
}

// Mock Speech API only if it doesn't exist
if (!global.SpeechSynthesisUtterance) {
  const MockSpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
    text: '',
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null,
    lang: 'en',
  }));
  global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
}

if (!global.speechSynthesis) {
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
  } as any;
  global.speechSynthesis = mockSpeechSynthesis;
}

// Mock observers only if they don't exist
if (!global.ResizeObserver) {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

if (!global.IntersectionObserver) {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Mock animation frame functions only if they don't exist
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));
}
if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));
}

// Mock window timer functions only if they don't exist or need enhancement
const createTimerMock = (originalTimer: any) => {
  const mockFn = vi.fn(originalTimer) as any;
  mockFn.__promisify__ = vi.fn();
  return mockFn;
};

if (typeof window !== 'undefined') {
  // Only mock if window timer functions don't exist
  if (!window.setInterval) {
    (window as any).setInterval = createTimerMock(() => 1);
  }
  if (!window.clearInterval) {
    (window as any).clearInterval = vi.fn();
  }
  if (!window.setTimeout) {
    (window as any).setTimeout = createTimerMock(() => 1);
  }
  if (!window.clearTimeout) {
    (window as any).clearTimeout = vi.fn();
  }
} else {
  // For global scope
  if (!(global as any).setInterval) {
    (global as any).setInterval = createTimerMock(() => 1);
  }
  if (!(global as any).clearInterval) {
    (global as any).clearInterval = vi.fn();
  }
  if (!(global as any).setTimeout) {
    (global as any).setTimeout = createTimerMock(() => 1);
  }
  if (!(global as any).clearTimeout) {
    (global as any).clearTimeout = vi.fn();
  }
}

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Export utility for creating mock storage
const mockStorage = createMockStorage();

// Ensure DOM is properly set up, but preserve jsdom's real DOM elements
if (typeof document !== 'undefined' && document.body) {
  // Only add a container if it doesn't exist and we're in a test environment
  // Use real DOM methods from jsdom, not mocks
  if (!document.getElementById('root')) {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
  }
}

// Mock HTMLCanvasElement.prototype.getContext for color contrast checking
// Replace jsdom's incomplete implementation
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (
    contextType: string
  ) {
    if (contextType === '2d') {
      return {
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(4).fill(255), // Fill with white pixels
          width: 1,
          height: 1,
        })),
        createImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(4).fill(255),
          width: 1,
          height: 1,
        })),
        putImageData: vi.fn(),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        canvas: this,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
      };
    }
    // Return null for unsupported context types
    return null;
  });
}

// Mock window.getComputedStyle for axe-core color contrast checking
// Replace jsdom's incomplete implementation
if (typeof window !== 'undefined') {
  window.getComputedStyle = vi
    .fn()
    .mockImplementation((element: Element, pseudoElt?: string) => {
      const mockStyle = {
        color: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        width: '100px',
        height: '100px',
        padding: '0px',
        margin: '0px',
        border: '0px',
        borderColor: 'rgb(0, 0, 0)',
        borderStyle: 'none',
        borderWidth: '0px',
        getPropertyValue: vi.fn((prop: string) => {
          switch (prop) {
            case 'color':
              return 'rgb(0, 0, 0)';
            case 'background-color':
              return 'rgb(255, 255, 255)';
            case 'font-size':
              return '16px';
            case 'font-family':
              return 'Arial, sans-serif';
            case 'width':
              return '100px';
            case 'height':
              return '100px';
            case 'display':
              return 'block';
            case 'visibility':
              return 'visible';
            case 'opacity':
              return '1';
            case 'border-color':
              return 'rgb(0, 0, 0)';
            case 'border-style':
              return 'none';
            case 'border-width':
              return '0px';
            default:
              return '';
          }
        }),
        // Add common CSS properties
        position: 'static',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        zIndex: 'auto',
        float: 'none',
        clear: 'none',
        textAlign: 'start',
        textDecoration: 'none',
        textTransform: 'none',
        lineHeight: 'normal',
        letterSpacing: 'normal',
        wordSpacing: 'normal',
      };

      // Return a proper CSSStyleDeclaration-like object
      return mockStyle as CSSStyleDeclaration;
    });
}

// Mock i18next for tests that need translation
const mockI18n = {
  t: vi.fn((key: string) => key),
  changeLanguage: vi.fn(),
  language: 'en',
  languages: ['en'],
  use: vi.fn(() => mockI18n),
  init: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  off: vi.fn(),
};

// Export testUtils for test files
export const testUtils = {
  mockStorage,

  // Mock alarm data that tests reference
  mockAlarm: {
    id: 'test-alarm-123',
    userId: 'test-user-123',
    time: '07:00',
    label: 'Test Alarm',
    enabled: true,
    isActive: true,
    days: [1, 2, 3, 4, 5], // weekdays
    dayNames: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
    ] as import('./types').DayOfWeek[],
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

// Provide i18next mock globally
if (typeof global !== 'undefined') {
  global.i18n = mockI18n;
}

// Additional environment checks for debugging (optional)
if (process.env.NODE_ENV === 'test' && process.env.DEBUG_TESTS) {
  console.log('Test environment detected');
  console.log('document.body type:', typeof document?.body);
  console.log('document.body constructor:', document?.body?.constructor?.name);
  console.log('document.createElement type:', typeof document?.createElement);
}
