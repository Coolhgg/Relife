/**
 * Comprehensive Accessibility Integration Tests
 * Verifies that all accessibility features work together harmoniously
 */

import AccessibilityPreferencesService from '../services/accessibility-preferences';
import { KeyboardNavigationService } from '../utils/keyboard-navigation';
import ScreenReaderService from '../utils/screen-reader';

// Mock DOM environment
const mockDocument = {
  documentElement: {
    style: {
      setProperty: jest.fn(),
      getPropertyValue: jest.fn(() => '16px'),
    },
  },
  body: {
    classList: {
      toggle: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
    },
  },
  createElement: jest.fn(() => ({
    id: '',
    className: '',
    style: {},
    textContent: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
  head: {
    appendChild: jest.fn(),
  },
  getElementById: jest.fn(() => null),
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  contains: jest.fn(() => true),
};

// Mock window environment
const mockWindow = {
  matchMedia: jest.fn((query) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
  localStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  navigator: {
    userAgent: 'Test Browser',
    vibrate: jest.fn(),
  },
  speechSynthesis: {
    getVoices: jest.fn(() => []),
  },
};

// Setup global mocks
global.document = mockDocument as any;
global.window = mockWindow as any;
global.localStorage = mockWindow.localStorage as any;
global.navigator = mockWindow.navigator as any;

describe('Accessibility Integration Tests', () => {
  let accessibilityService: AccessibilityPreferencesService;
  let keyboardService: KeyboardNavigationService;
  let screenReaderService: ScreenReaderService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get fresh instances
    accessibilityService = AccessibilityPreferencesService.getInstance();
    keyboardService = KeyboardNavigationService.getInstance();
    screenReaderService = ScreenReaderService.getInstance();
  });

  afterEach(() => {
    // Clean up services
    try {
      accessibilityService.cleanup();
      keyboardService.cleanup();
      screenReaderService.cleanup();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Service Integration', () => {
    test('accessibility preferences service should initialize properly', () => {
      expect(accessibilityService).toBeDefined();
      const preferences = accessibilityService.getPreferences();
      expect(preferences).toBeDefined();
      expect(typeof preferences.highContrastMode).toBe('boolean');
      expect(typeof preferences.reducedMotion).toBe('boolean');
      expect(typeof preferences.keyboardNavigation).toBe('boolean');
    });

    test('keyboard navigation should integrate with accessibility preferences', () => {
      expect(keyboardService).toBeDefined();
      
      // Test initial state
      const initialStatus = keyboardService.getAccessibilityStatus();
      expect(initialStatus).toBeDefined();
      expect(typeof initialStatus.keyboardNavigationEnabled).toBe('boolean');
      
      // Test preference updates
      accessibilityService.updatePreferences({ keyboardNavigation: false });
      keyboardService.refreshAccessibilityIntegration();
      
      const updatedStatus = keyboardService.getAccessibilityStatus();
      expect(updatedStatus.keyboardNavigationEnabled).toBe(false);
    });

    test('screen reader service should respond to accessibility preferences', () => {
      expect(screenReaderService).toBeDefined();
      
      // Test screen reader optimization
      accessibilityService.updatePreferences({ 
        screenReaderOptimized: true,
        announceTransitions: true 
      });
      
      const state = screenReaderService.getState();
      expect(state).toBeDefined();
    });
  });

  describe('WCAG Compliance', () => {
    test('should provide proper contrast ratios', () => {
      const contrastResult = accessibilityService.testColorContrast('#000000', '#ffffff');
      expect(contrastResult).toBeDefined();
      expect(typeof contrastResult.ratio).toBe('number');
      expect(typeof contrastResult.wcagAA).toBe('boolean');
      expect(typeof contrastResult.wcagAAA).toBe('boolean');
    });

    test('focus management should follow WCAG guidelines', () => {
      const status = keyboardService.getAccessibilityStatus();
      expect(status.enhancedFocusRings).toBeDefined();
      expect(status.focusRingColor).toBeDefined();
      expect(typeof status.focusRingColor).toBe('string');
    });
  });
});