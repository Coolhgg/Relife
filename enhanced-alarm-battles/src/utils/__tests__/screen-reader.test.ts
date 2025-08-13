// Screen Reader Service Tests
// Validates screen reader announcements, ARIA patterns, and speech synthesis

import ScreenReaderService from '../screen-reader';

// Mock Speech Synthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Test Voice', lang: 'en-US', default: true, localService: true, voiceURI: 'test' }
  ]),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null
};

const mockSpeechSynthesisUtterance = jest.fn();

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: mockSpeechSynthesisUtterance
});

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ScreenReaderService', () => {
  let screenReaderService: ScreenReaderService;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    screenReaderService = ScreenReaderService.getInstance();
    screenReaderService.initialize();
  });

  afterEach(() => {
    screenReaderService.cleanup();
  });

  describe('Initialization and Singleton', () => {
    test('should be a singleton', () => {
      const instance1 = ScreenReaderService.getInstance();
      const instance2 = ScreenReaderService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should initialize successfully', () => {
      const service = ScreenReaderService.getInstance();
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(false); // Default disabled
    });

    test('should detect screen reader availability', () => {
      // Mock screen reader detection
      const service = ScreenReaderService.getInstance();
      expect(service.detectScreenReader()).toBeDefined();
    });
  });

  describe('Basic Announcements', () => {
    test('should make basic announcements', () => {
      screenReaderService.enable();
      screenReaderService.announce('Test announcement', 'polite');

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.textContent).toBe('Test announcement');
    });

    test('should handle different priority levels', () => {
      screenReaderService.enable();
      
      screenReaderService.announce('Polite message', 'polite');
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion).toBeTruthy();

      screenReaderService.announce('Assertive message', 'assertive');
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion).toBeTruthy();
    });

    test('should queue announcements', () => {
      screenReaderService.enable();
      
      screenReaderService.announce('First message', 'polite');
      screenReaderService.announce('Second message', 'polite');
      screenReaderService.announce('Third message', 'polite');

      // Should have queued announcements
      expect(screenReaderService.getState().announcementQueue.length).toBeGreaterThan(0);
    });
  });

  describe('Alarm-Specific Announcements', () => {
    test('should announce alarm creation', () => {
      screenReaderService.enable();
      
      const alarm = {
        id: 'test-alarm',
        label: 'Morning Wake Up',
        time: '07:00',
        days: [1, 2, 3, 4, 5],
        enabled: true
      };

      screenReaderService.announceAlarm('created', alarm);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toContain('Morning Wake Up');
      expect(liveRegion?.textContent).toContain('7:00 AM');
    });

    test('should announce alarm status changes', () => {
      screenReaderService.enable();
      
      const alarm = {
        id: 'test-alarm',
        label: 'Work Alarm',
        time: '06:30',
        days: [1, 2, 3, 4, 5],
        enabled: true
      };

      screenReaderService.announceAlarm('enabled', alarm);
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain('enabled');

      screenReaderService.announceAlarm('disabled', alarm);
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain('disabled');
    });

    test('should announce alarm ringing', () => {
      screenReaderService.enable();
      
      const alarm = {
        id: 'test-alarm',
        label: 'Wake Up',
        time: '07:00',
        days: [1, 2, 3, 4, 5],
        enabled: true
      };

      screenReaderService.announceAlarm('ringing', alarm);
      
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toContain('Alarm ringing');
      expect(assertiveRegion?.textContent).toContain('Wake Up');
    });
  });

  describe('Navigation Announcements', () => {
    test('should announce page navigation', () => {
      screenReaderService.enable();
      
      screenReaderService.announceNavigation('Dashboard', 'main');
      
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toContain('Dashboard');
      expect(liveRegion?.textContent).toContain('main content');
    });

    test('should announce keyboard shortcuts', () => {
      screenReaderService.enable();
      
      screenReaderService.announceKeyboardShortcuts();
      
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toContain('keyboard shortcuts');
    });
  });

  describe('Form Announcements', () => {
    test('should announce form errors', () => {
      screenReaderService.enable();
      
      screenReaderService.announceFormError('email', 'Please enter a valid email address');
      
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toContain('email');
      expect(assertiveRegion?.textContent).toContain('Please enter a valid email address');
    });

    test('should announce form success', () => {
      screenReaderService.enable();
      
      screenReaderService.announceFormSuccess('Alarm created successfully');
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toContain('Alarm created successfully');
    });
  });

  describe('ARIA Patterns', () => {
    test('should create accordion pattern', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      screenReaderService.createAccordion(container, [
        { id: 'section1', title: 'Section 1', content: 'Content 1' },
        { id: 'section2', title: 'Section 2', content: 'Content 2' }
      ]);

      const buttons = container.querySelectorAll('[role="button"]');
      expect(buttons.length).toBe(2);
      
      const panels = container.querySelectorAll('[role="region"]');
      expect(panels.length).toBe(2);

      // Check ARIA attributes
      buttons.forEach((button, index) => {
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(button.getAttribute('aria-controls')).toBe(`section${index + 1}-panel`);
      });
    });

    test('should create tab pattern', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      screenReaderService.createTabs(container, [
        { id: 'tab1', title: 'Tab 1', content: 'Content 1' },
        { id: 'tab2', title: 'Tab 2', content: 'Content 2' }
      ]);

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();

      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(2);

      const tabpanels = container.querySelectorAll('[role="tabpanel"]');
      expect(tabpanels.length).toBe(2);

      // Check initial selection
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('Settings and Configuration', () => {
    test('should update verbosity level', () => {
      screenReaderService.updateSettings({ verbosityLevel: 'high' });
      expect(screenReaderService.getState().verbosityLevel).toBe('high');

      screenReaderService.updateSettings({ verbosityLevel: 'low' });
      expect(screenReaderService.getState().verbosityLevel).toBe('low');
    });

    test('should update speech rate', () => {
      screenReaderService.updateSettings({ speechRate: 1.5 });
      expect(screenReaderService.getState().speechRate).toBe(1.5);
    });

    test('should toggle auto announce changes', () => {
      screenReaderService.updateSettings({ autoAnnounceChanges: true });
      expect(screenReaderService.getState().autoAnnounceChanges).toBe(true);

      screenReaderService.updateSettings({ autoAnnounceChanges: false });
      expect(screenReaderService.getState().autoAnnounceChanges).toBe(false);
    });
  });

  describe('Time Formatting', () => {
    test('should format time naturally', () => {
      const service = ScreenReaderService.getInstance();
      
      expect(service.formatTimeForSpeech('07:00')).toBe('7:00 AM');
      expect(service.formatTimeForSpeech('13:30')).toBe('1:30 PM');
      expect(service.formatTimeForSpeech('00:00')).toBe('12:00 AM');
      expect(service.formatTimeForSpeech('12:00')).toBe('12:00 PM');
    });

    test('should format days naturally', () => {
      const service = ScreenReaderService.getInstance();
      
      expect(service.formatDaysForSpeech([1, 2, 3, 4, 5])).toBe('Monday through Friday');
      expect(service.formatDaysForSpeech([6, 7])).toBe('Saturday and Sunday');
      expect(service.formatDaysForSpeech([1, 3, 5])).toBe('Monday, Wednesday, and Friday');
      expect(service.formatDaysForSpeech([1, 2, 3, 4, 5, 6, 7])).toBe('Every day');
    });
  });

  describe('Error Handling', () => {
    test('should handle speech synthesis errors gracefully', () => {
      mockSpeechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech synthesis error');
      });

      expect(() => {
        screenReaderService.enable();
        screenReaderService.announce('Test message', 'polite');
      }).not.toThrow();
    });

    test('should handle missing DOM elements gracefully', () => {
      // Remove any existing live regions
      document.querySelectorAll('[aria-live]').forEach(el => el.remove());
      
      expect(() => {
        screenReaderService.announce('Test message', 'polite');
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    test('should clean up resources properly', () => {
      screenReaderService.enable();
      screenReaderService.announce('Test message', 'polite');

      const liveRegionsBefore = document.querySelectorAll('[aria-live]');
      expect(liveRegionsBefore.length).toBeGreaterThan(0);

      screenReaderService.cleanup();

      // Should clean up announcement intervals
      expect(screenReaderService.getState().announcementQueue.length).toBe(0);
    });
  });
});