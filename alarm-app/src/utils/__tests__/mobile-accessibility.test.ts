// Mobile Accessibility Service Tests
// Validates mobile gestures, haptic feedback, and mobile-specific accessibility

import MobileAccessibilityService from '../mobile-accessibility';

// Mock mobile APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  vibrate: jest.fn(),
  platform: 'iPhone'
};

Object.defineProperty(window, 'navigator', {
  writable: true,
  value: mockNavigator
});

// Mock touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number; identifier: number }>) => {
  const touchList = touches.map((touch, index) => ({
    ...touch,
    identifier: touch.identifier ?? index,
    target: document.body,
    screenX: touch.clientX,
    screenY: touch.clientY,
    pageX: touch.clientX,
    pageY: touch.clientY,
    radiusX: 10,
    radiusY: 10,
    rotationAngle: 0,
    force: 1
  }));

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: touchList as any,
    targetTouches: touchList as any,
    changedTouches: touchList as any
  });
};

describe('MobileAccessibilityService', () => {
  let mobileService: MobileAccessibilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mobileService = MobileAccessibilityService.getInstance();
    mobileService.initialize();
  });

  afterEach(() => {
    mobileService.cleanup();
  });

  describe('Initialization and Singleton', () => {
    test('should be a singleton', () => {
      const instance1 = MobileAccessibilityService.getInstance();
      const instance2 = MobileAccessibilityService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should detect mobile device correctly', () => {
      expect(mobileService.isMobile()).toBe(true);
      expect(mobileService.getState().deviceType).toBe('ios');
    });

    test('should detect Android devices', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36'
      });

      const service = MobileAccessibilityService.getInstance();
      service.initialize();
      
      expect(service.getState().deviceType).toBe('android');
    });

    test('should detect desktop as non-mobile', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const service = MobileAccessibilityService.getInstance();
      service.initialize();
      
      expect(service.isMobile()).toBe(false);
      expect(service.getState().deviceType).toBe('desktop');
    });
  });

  describe('Touch Gesture Recognition', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.style.width = '300px';
      container.style.height = '300px';
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    test('should detect swipe left gesture', (done) => {
      const callback = jest.fn();
      mobileService.addGestureListener(container, 'swipe-left', callback);

      // Start touch
      const touchStart = createTouchEvent('touchstart', [{ clientX: 200, clientY: 150, identifier: 0 }]);
      container.dispatchEvent(touchStart);

      setTimeout(() => {
        // End touch with left swipe
        const touchEnd = createTouchEvent('touchend', [{ clientX: 50, clientY: 150, identifier: 0 }]);
        container.dispatchEvent(touchEnd);

        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
          done();
        }, 50);
      }, 50);
    });

    test('should detect swipe right gesture', (done) => {
      const callback = jest.fn();
      mobileService.addGestureListener(container, 'swipe-right', callback);

      const touchStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 150, identifier: 0 }]);
      container.dispatchEvent(touchStart);

      setTimeout(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 200, clientY: 150, identifier: 0 }]);
        container.dispatchEvent(touchEnd);

        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
          done();
        }, 50);
      }, 50);
    });

    test('should detect two-finger tap', () => {
      const callback = jest.fn();
      mobileService.addGestureListener(container, 'two-finger-tap', callback);

      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 150, identifier: 0 },
        { clientX: 200, clientY: 150, identifier: 1 }
      ]);
      container.dispatchEvent(touchEvent);

      const touchEnd = createTouchEvent('touchend', [
        { clientX: 100, clientY: 150, identifier: 0 },
        { clientX: 200, clientY: 150, identifier: 1 }
      ]);
      container.dispatchEvent(touchEnd);

      expect(callback).toHaveBeenCalled();
    });

    test('should detect long press', (done) => {
      const callback = jest.fn();
      mobileService.addGestureListener(container, 'long-press', callback);

      const touchStart = createTouchEvent('touchstart', [{ clientX: 150, clientY: 150, identifier: 0 }]);
      container.dispatchEvent(touchStart);

      // Long press should trigger after delay
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 650); // Slightly longer than default long press threshold
    });

    test('should not detect swipe for short distance', () => {
      const callback = jest.fn();
      mobileService.addGestureListener(container, 'swipe-left', callback);

      const touchStart = createTouchEvent('touchstart', [{ clientX: 150, clientY: 150, identifier: 0 }]);
      container.dispatchEvent(touchStart);

      const touchEnd = createTouchEvent('touchend', [{ clientX: 140, clientY: 150, identifier: 0 }]);
      container.dispatchEvent(touchEnd);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Haptic Feedback', () => {
    test('should trigger vibration for gestures when enabled', () => {
      mobileService.updateSettings({ hapticFeedback: true, hapticIntensity: 'medium' });

      mobileService.triggerHapticFeedback('gesture');

      expect(mockNavigator.vibrate).toHaveBeenCalledWith([50]);
    });

    test('should not vibrate when haptic feedback is disabled', () => {
      mobileService.updateSettings({ hapticFeedback: false });

      mobileService.triggerHapticFeedback('gesture');

      expect(mockNavigator.vibrate).not.toHaveBeenCalled();
    });

    test('should use different patterns for different feedback types', () => {
      mobileService.updateSettings({ hapticFeedback: true, hapticIntensity: 'strong' });

      mobileService.triggerHapticFeedback('success');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);

      mobileService.triggerHapticFeedback('error');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([300]);

      mobileService.triggerHapticFeedback('warning');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([150, 75, 150]);
    });

    test('should respect haptic intensity settings', () => {
      mobileService.updateSettings({ hapticFeedback: true, hapticIntensity: 'light' });

      mobileService.triggerHapticFeedback('gesture');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([25]);

      mobileService.updateSettings({ hapticIntensity: 'strong' });

      mobileService.triggerHapticFeedback('gesture');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([100]);
    });
  });

  describe('Touch Target Enhancement', () => {
    test('should enforce minimum touch target size', () => {
      mobileService.updateSettings({ touchTargetSize: 48 });

      const button = document.createElement('button');
      button.style.width = '20px';
      button.style.height = '20px';
      document.body.appendChild(button);

      mobileService.enhanceTouchTargets();

      const computedStyle = window.getComputedStyle(button);
      expect(parseInt(computedStyle.minWidth)).toBeGreaterThanOrEqual(48);
      expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(48);

      button.remove();
    });

    test('should not modify already large elements', () => {
      mobileService.updateSettings({ touchTargetSize: 44 });

      const button = document.createElement('button');
      button.style.width = '60px';
      button.style.height = '60px';
      document.body.appendChild(button);

      const originalWidth = button.style.width;
      const originalHeight = button.style.height;

      mobileService.enhanceTouchTargets();

      expect(button.style.width).toBe(originalWidth);
      expect(button.style.height).toBe(originalHeight);

      button.remove();
    });

    test('should add padding for small clickable elements', () => {
      const link = document.createElement('a');
      link.textContent = 'Small link';
      link.style.fontSize = '12px';
      document.body.appendChild(link);

      mobileService.enhanceTouchTargets();

      const computedStyle = window.getComputedStyle(link);
      expect(parseInt(computedStyle.padding)).toBeGreaterThan(0);

      link.remove();
    });
  });

  describe('Screen Reader Integration', () => {
    test('should detect VoiceOver on iOS', () => {
      // Mock VoiceOver detection
      Object.defineProperty(window, 'speechSynthesis', {
        value: { speaking: false, pending: false }
      });

      const isVoiceOver = mobileService.detectScreenReader();
      expect(typeof isVoiceOver).toBe('object');
      expect(isVoiceOver.detected).toBe(false); // Default when not actually running
    });

    test('should optimize for TalkBack on Android', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36'
      });

      const service = MobileAccessibilityService.getInstance();
      service.initialize();

      const screenReader = service.detectScreenReader();
      expect(screenReader.type).toBe('talkback');
    });
  });

  describe('Orientation Handling', () => {
    test('should handle orientation changes', () => {
      const callback = jest.fn();
      mobileService.onOrientationChange(callback);

      // Simulate orientation change
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      expect(callback).toHaveBeenCalled();
    });

    test('should detect current orientation', () => {
      // Mock orientation
      Object.defineProperty(window, 'orientation', {
        writable: true,
        value: 90
      });

      const orientation = mobileService.getCurrentOrientation();
      expect(orientation).toBe('landscape');
    });

    test('should provide portrait orientation', () => {
      Object.defineProperty(window, 'orientation', {
        writable: true,
        value: 0
      });

      const orientation = mobileService.getCurrentOrientation();
      expect(orientation).toBe('portrait');
    });
  });

  describe('Large Text and High Contrast', () => {
    test('should apply large text styles', () => {
      mobileService.updateSettings({ largeText: true });
      mobileService.applyLargeText();

      const bodyClass = document.body.className;
      expect(bodyClass).toContain('large-text');
    });

    test('should apply high contrast styles', () => {
      mobileService.updateSettings({ highContrast: true });
      mobileService.applyHighContrast();

      const bodyClass = document.body.className;
      expect(bodyClass).toContain('high-contrast');
    });

    test('should remove accessibility classes when disabled', () => {
      // First enable
      mobileService.updateSettings({ largeText: true, highContrast: true });
      mobileService.applyLargeText();
      mobileService.applyHighContrast();

      expect(document.body.className).toContain('large-text');
      expect(document.body.className).toContain('high-contrast');

      // Then disable
      mobileService.updateSettings({ largeText: false, highContrast: false });
      mobileService.applyLargeText();
      mobileService.applyHighContrast();

      expect(document.body.className).not.toContain('large-text');
      expect(document.body.className).not.toContain('high-contrast');
    });
  });

  describe('Mobile-Specific ARIA Optimizations', () => {
    test('should optimize ARIA live regions for mobile', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);

      mobileService.optimizeAriaForMobile();

      // Should have mobile-optimized attributes
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
      expect(liveRegion.getAttribute('aria-relevant')).toBe('additions text');

      liveRegion.remove();
    });

    test('should add mobile-friendly labels', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Delete');
      document.body.appendChild(button);

      mobileService.optimizeAriaForMobile();

      // Should enhance the label for mobile context
      const enhancedLabel = button.getAttribute('aria-label');
      expect(enhancedLabel).toContain('Delete');

      button.remove();
    });
  });

  describe('Settings and Configuration', () => {
    test('should update touch target size', () => {
      mobileService.updateSettings({ touchTargetSize: 52 });
      expect(mobileService.getState().touchTargetSize).toBe(52);
    });

    test('should toggle swipe gestures', () => {
      mobileService.updateSettings({ swipeGesturesEnabled: false });
      expect(mobileService.getState().swipeGesturesEnabled).toBe(false);

      mobileService.updateSettings({ swipeGesturesEnabled: true });
      expect(mobileService.getState().swipeGesturesEnabled).toBe(true);
    });

    test('should update haptic feedback settings', () => {
      mobileService.updateSettings({
        hapticFeedback: true,
        hapticIntensity: 'strong'
      });

      expect(mobileService.getState().hapticFeedback).toBe(true);
      expect(mobileService.getState().hapticIntensity).toBe('strong');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing vibration API gracefully', () => {
      Object.defineProperty(window.navigator, 'vibrate', {
        value: undefined
      });

      expect(() => {
        mobileService.triggerHapticFeedback('gesture');
      }).not.toThrow();
    });

    test('should handle touch events on non-touch devices', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      expect(() => {
        mobileService.addGestureListener(container, 'swipe-left', jest.fn());
      }).not.toThrow();

      container.remove();
    });

    test('should handle invalid gesture types', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      expect(() => {
        mobileService.addGestureListener(container, 'invalid-gesture' as any, jest.fn());
      }).not.toThrow();

      container.remove();
    });
  });

  describe('Cleanup', () => {
    test('should remove gesture listeners on cleanup', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const callback = jest.fn();
      mobileService.addGestureListener(container, 'swipe-left', callback);

      mobileService.cleanup();

      // Gesture should no longer work after cleanup
      const touchStart = createTouchEvent('touchstart', [{ clientX: 200, clientY: 150, identifier: 0 }]);
      const touchEnd = createTouchEvent('touchend', [{ clientX: 50, clientY: 150, identifier: 0 }]);
      
      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchEnd);

      expect(callback).not.toHaveBeenCalled();

      container.remove();
    });

    test('should remove CSS classes on cleanup', () => {
      mobileService.updateSettings({ largeText: true, highContrast: true });
      mobileService.applyLargeText();
      mobileService.applyHighContrast();

      expect(document.body.className).toContain('large-text');
      expect(document.body.className).toContain('high-contrast');

      mobileService.cleanup();

      expect(document.body.className).not.toContain('large-text');
      expect(document.body.className).not.toContain('high-contrast');
    });
  });
});