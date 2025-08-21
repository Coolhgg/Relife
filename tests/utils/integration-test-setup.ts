/// <reference lib="dom" />
import '@testing-library/jest-dom';
import { vi, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Import MSW setup for API mocking (Vitest-compatible version)
import { setupServer } from 'msw/node';

// Import MSW handlers from the main test setup
import { handlers } from '../../src/__tests__/mocks/msw-handlers';

// Import enhanced browser API mocks
import { setupEnhancedBrowserAPIMocks, createIntegrationTestHelpers } from './enhanced-browser-api-mocks';

// Import additional mocks for new features
import { 
  setupAllMocks,
  mockWebSocket,
  mockMediaRecorder,
  mockFileAPI,
  mockBiometricAPIs,
  mockSleepAPIs
} from './test-mocks';

// Setup MSW server for integration tests
const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests instead of erroring
  });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Setup enhanced browser API mocks globally
const integrationTestHelpers = createIntegrationTestHelpers();

// Setup all additional mocks for new features
setupAllMocks();

// Reset enhanced mocks after each test
afterEach(() => {
  integrationTestHelpers.resetAll();
});

// Setup global mocks for integration tests
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

// Mock timer functions
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

// Ensure DOM is properly set up
if (typeof document !== 'undefined' && document.body) {
  // Only add a container if it doesn't exist and we're in a test environment
  if (!document.getElementById('root')) {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
  }
}

// Mock HTMLCanvasElement.prototype.getContext for color contrast checking
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
          data: new Uint8ClampedArray(4).fill(255),
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
    return null;
  });
}

// Mock window.getComputedStyle for axe-core color contrast checking
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

// Provide i18next mock globally
if (typeof global !== 'undefined') {
  global.i18n = mockI18n;
}

// Additional global setup for new features
if (typeof global !== 'undefined') {
  // Mock performance.now for timing measurements
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => [])
    } as any;
  }

  // Mock requestIdleCallback for sleep analysis
  if (!global.requestIdleCallback) {
    global.requestIdleCallback = vi.fn((cb) => {
      return setTimeout(() => cb({ 
        didTimeout: false, 
        timeRemaining: () => 50 
      }), 0);
    });
  }

  if (!global.cancelIdleCallback) {
    global.cancelIdleCallback = vi.fn(clearTimeout);
  }

  // Mock TextEncoder/TextDecoder for WebSocket message handling
  if (!global.TextEncoder) {
    global.TextEncoder = vi.fn().mockImplementation(() => ({
      encode: vi.fn((text) => new Uint8Array(Buffer.from(text, 'utf-8')))
    }));
  }

  if (!global.TextDecoder) {
    global.TextDecoder = vi.fn().mockImplementation(() => ({
      decode: vi.fn((bytes) => Buffer.from(bytes).toString('utf-8'))
    }));
  }
}

// Helper functions for integration tests
export const mockApiError = (endpoint: string, status: number = 500, message: string = 'Server Error') => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.all(endpoint, () => {
      return HttpResponse.json({ error: message }, { status });
    })
  );
};

export const mockApiDelay = (endpoint: string, delay: number = 1000) => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.all(endpoint, async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({ success: true });
    })
  );
};

// Enhanced delay mock for real-time features
export const mockRealtimeDelay = (endpoint: string, delay: number = 100) => {
  return mockApiDelay(endpoint, delay);
};

export const mockApiSuccess = (endpoint: string, data: any) => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.all(endpoint, () => {
      return HttpResponse.json(data);
    })
  );
};

// New API mock helpers for advanced features
export const mockWebSocketServer = (url: string, responses: any[] = []) => {
  const mockWS = mockWebSocket();
  
  // Simulate server responses
  responses.forEach((response, index) => {
    setTimeout(() => {
      if (mockWS.onmessage) {
        mockWS.onmessage({ data: JSON.stringify(response) });
      }
    }, 100 * (index + 1));
  });
  
  return mockWS;
};

export const mockTTSService = (audioUrl: string = 'blob:mock-tts-audio') => {
  const { http, HttpResponse } = require('msw');
  
  server.use(
    http.post('*/api/voice/synthesize', () => {
      return HttpResponse.json({ audioUrl, duration: 5.2 });
    }),
    http.post('*/api/voice/clone', () => {
      return HttpResponse.json({ 
        voiceId: 'mock-voice-id',
        status: 'ready',
        similarity: 0.95 
      });
    })
  );
};

export const mockSleepAnalysisService = (analysisData: any) => {
  const { http, HttpResponse } = require('msw');
  
  server.use(
    http.post('*/api/sleep/analyze', () => {
      return HttpResponse.json(analysisData);
    }),
    http.get('*/api/sleep/recommendations', () => {
      return HttpResponse.json({
        optimalBedtime: '22:30',
        optimalWakeTime: '06:30',
        sleepCycles: 5,
        chronotype: 'intermediate',
        confidence: 0.87
      });
    })
  );
};

// Export server and enhanced test helpers for use in specific tests
export { server as mswServer };
export { integrationTestHelpers };

// Export individual mock helpers for convenience
export const {
  notifications: notificationHelpers,
  serviceWorker: serviceWorkerHelpers,
  wakeLock: wakeLockHelpers,
  speech: speechHelpers,
  permissions: permissionHelpers,
  simulateAlarmNotification,
  simulateVoiceAlarmDismiss,
  simulateVoiceSnooze,
  simulatePushSubscription,
  simulateScreenWakeLock,
  verifyNotificationShown,
  verifyServiceWorkerActive,
  verifyPushSubscriptionActive
} = integrationTestHelpers;

// Additional helper exports for new features
export {
  mockWebSocket,
  mockMediaRecorder,
  mockFileAPI,
  mockBiometricAPIs,
  mockSleepAPIs,
  simulateWebSocketMessage,
  simulateWebSocketConnection,
  simulateWebSocketDisconnection,
  simulateVoiceRecording,
  generateLargeSleepDataset,
  simulateBattleProgress,
  generateMockAudioBlob
} from './test-mocks';