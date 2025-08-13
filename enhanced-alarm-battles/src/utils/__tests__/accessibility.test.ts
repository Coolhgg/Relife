// Accessibility Utils Tests
// Validates color contrast, ARIA announcements, and accessibility helpers

import AccessibilityUtils, { 
  checkContrastAccessibility, 
  getContrastRatio,
  FocusManager,
  createAriaAnnouncement
} from '../accessibility';

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

describe('Accessibility Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Color Contrast Checking', () => {
    test('should calculate correct contrast ratios', () => {
      // High contrast: black text on white background
      const highContrast = getContrastRatio('#000000', '#ffffff');
      expect(highContrast).toBeCloseTo(21, 0);

      // Low contrast: light gray on white
      const lowContrast = getContrastRatio('#cccccc', '#ffffff');
      expect(lowContrast).toBeLessThan(4.5);

      // Medium contrast
      const mediumContrast = getContrastRatio('#666666', '#ffffff');
      expect(mediumContrast).toBeGreaterThan(4.5);
    });

    test('should validate accessibility compliance', () => {
      // Test AAA compliance (high contrast)
      const aaaResult = checkContrastAccessibility('#000000', '#ffffff');
      expect(aaaResult.level).toBe('AAA');
      expect(aaaResult.isAccessible).toBe(true);
      expect(aaaResult.recommendations).toBeUndefined();

      // Test AA compliance 
      const aaResult = checkContrastAccessibility('#666666', '#ffffff');
      expect(aaResult.level).toBe('AA');
      expect(aaResult.isAccessible).toBe(true);

      // Test failure
      const failResult = checkContrastAccessibility('#cccccc', '#ffffff');
      expect(failResult.level).toBe('FAIL');
      expect(failResult.isAccessible).toBe(false);
      expect(failResult.recommendations).toBeDefined();
      expect(failResult.recommendations!.length).toBeGreaterThan(0);
    });

    test('should handle large text differently', () => {
      const color1 = '#999999';
      const color2 = '#ffffff';

      const normalResult = checkContrastAccessibility(color1, color2, 'normal');
      const largeResult = checkContrastAccessibility(color1, color2, 'large');

      // Large text has more lenient requirements
      expect(largeResult.isAccessible).toBe(true);
      expect(normalResult.isAccessible).toBe(false);
    });

    test('should handle invalid colors gracefully', () => {
      const result = getContrastRatio('invalid-color', '#ffffff');
      expect(result).toBe(0);
    });
  });

  describe('ARIA Announcements', () => {
    test('should create aria live region', () => {
      createAriaAnnouncement('Test announcement', 'polite');
      
      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
      expect(liveRegion?.className).toContain('sr-only');
    });

    test('should update announcement priority', () => {
      createAriaAnnouncement('First announcement', 'polite');
      createAriaAnnouncement('Urgent announcement', 'assertive');
      
      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });

    test('should clear announcements after timeout', (done) => {
      createAriaAnnouncement('Test message', 'polite');
      
      setTimeout(() => {
        const liveRegion = document.getElementById('aria-live-region');
        expect(liveRegion?.textContent).toBe('Test message');
      }, 150);

      setTimeout(() => {
        const liveRegion = document.getElementById('aria-live-region');
        expect(liveRegion?.textContent).toBe('');
        done();
      }, 3500);
    });
  });

  describe('Focus Management', () => {
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      button1 = document.createElement('button');
      button2 = document.createElement('button');
      
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
    });

    test('should push and pop focus correctly', () => {
      button1.focus();
      expect(document.activeElement).toBe(button1);

      FocusManager.pushFocus(button2);
      expect(document.activeElement).toBe(button2);

      FocusManager.popFocus();
      expect(document.activeElement).toBe(button1);
    });

    test('should clear focus stack', () => {
      button1.focus();
      FocusManager.pushFocus(button2);
      FocusManager.clearFocusStack();
      
      FocusManager.popFocus();
      // Should not restore focus after clearing stack
      expect(document.activeElement).toBe(button2);
    });

    test('should trap focus within container', () => {
      const cleanup = FocusManager.trapFocus(container);
      
      expect(document.activeElement).toBe(button1);
      
      // Simulate tab key on last element
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true 
      });
      
      button2.focus();
      container.dispatchEvent(tabEvent);
      
      cleanup();
    });
  });

  describe('Page Navigation', () => {
    test('should announce page changes', () => {
      const originalTitle = document.title;
      
      AccessibilityUtils.announcePageChange('Settings');
      
      expect(document.title).toBe('Settings - Smart Alarm');
      
      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toBeTruthy();
      
      // Restore original title
      document.title = originalTitle;
    });
  });

  describe('Preference Detection', () => {
    test('should detect high contrast mode preference', () => {
      // Mock matchMedia for high contrast
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(AccessibilityUtils.isHighContrastMode()).toBe(true);
    });

    test('should detect reduced motion preference', () => {
      // Mock matchMedia for reduced motion
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(AccessibilityUtils.prefersReducedMotion()).toBe(true);
    });
  });

  describe('Accessible Tooltips', () => {
    let trigger: HTMLButtonElement;

    beforeEach(() => {
      trigger = document.createElement('button');
      trigger.textContent = 'Trigger Button';
      document.body.appendChild(trigger);
    });

    afterEach(() => {
      trigger.remove();
    });

    test('should add accessible tooltips on hover', (done) => {
      const cleanup = AccessibilityUtils.addAccessibleTooltip(
        trigger, 
        'Tooltip content',
        { delay: 100 }
      );

      // Simulate mouse enter
      trigger.dispatchEvent(new Event('mouseenter'));

      setTimeout(() => {
        const tooltip = document.querySelector('[role="tooltip"]');
        expect(tooltip).toBeTruthy();
        expect(tooltip?.textContent).toBe('Tooltip content');
        expect(trigger.getAttribute('aria-describedby')).toBeTruthy();

        cleanup();
        done();
      }, 150);
    });

    test('should show tooltip on focus', () => {
      const cleanup = AccessibilityUtils.addAccessibleTooltip(
        trigger, 
        'Focus tooltip'
      );

      // Simulate focus
      trigger.dispatchEvent(new Event('focus'));

      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.textContent).toBe('Focus tooltip');

      cleanup();
    });

    test('should hide tooltip on blur/mouse leave', () => {
      const cleanup = AccessibilityUtils.addAccessibleTooltip(
        trigger, 
        'Temporary tooltip'
      );

      // Show tooltip
      trigger.dispatchEvent(new Event('focus'));
      expect(document.querySelector('[role="tooltip"]')).toBeTruthy();

      // Hide tooltip
      trigger.dispatchEvent(new Event('blur'));
      expect(document.querySelector('[role="tooltip"]')).toBeFalsy();
      expect(trigger.getAttribute('aria-describedby')).toBeFalsy();

      cleanup();
    });
  });
});

// Integration tests for common accessibility patterns
describe('Accessibility Integration', () => {
  test('should provide comprehensive accessibility utilities', () => {
    // Verify all key functions are available
    expect(typeof AccessibilityUtils.checkContrastAccessibility).toBe('function');
    expect(typeof AccessibilityUtils.createAriaAnnouncement).toBe('function');
    expect(typeof AccessibilityUtils.FocusManager.pushFocus).toBe('function');
    expect(typeof AccessibilityUtils.announcePageChange).toBe('function');
    expect(typeof AccessibilityUtils.isHighContrastMode).toBe('function');
    expect(typeof AccessibilityUtils.prefersReducedMotion).toBe('function');
    expect(typeof AccessibilityUtils.addAccessibleTooltip).toBe('function');
  });

  test('should handle edge cases gracefully', () => {
    // Test with empty strings
    expect(() => {
      getContrastRatio('', '');
    }).not.toThrow();

    // Test with null elements
    expect(() => {
      AccessibilityUtils.addAccessibleTooltip(null as any, 'tooltip');
    }).toThrow();

    // Test announcements with empty messages
    expect(() => {
      createAriaAnnouncement('', 'polite');
    }).not.toThrow();
  });
});