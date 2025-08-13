// Enhanced Focus Service Tests
// Validates focus indicators, skip links, and advanced focus management

import EnhancedFocusService from '../enhanced-focus';

describe('EnhancedFocusService', () => {
  let focusService: EnhancedFocusService;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    focusService = EnhancedFocusService.getInstance();
    focusService.initialize();
  });

  afterEach(() => {
    focusService.cleanup();
  });

  describe('Initialization and Singleton', () => {
    test('should be a singleton', () => {
      const instance1 = EnhancedFocusService.getInstance();
      const instance2 = EnhancedFocusService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should initialize focus indicators', () => {
      const service = EnhancedFocusService.getInstance();
      expect(service).toBeDefined();
      expect(service.getState().isEnabled).toBe(true);
    });

    test('should create focus styles on initialization', () => {
      const styleElement = document.querySelector('style[data-focus-service]');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('focus-ring');
    });
  });

  describe('Focus Ring Enhancement', () => {
    let button: HTMLButtonElement;

    beforeEach(() => {
      button = document.createElement('button');
      button.textContent = 'Test Button';
      button.id = 'test-button';
      document.body.appendChild(button);
    });

    afterEach(() => {
      button.remove();
    });

    test('should enhance focus ring on focus', () => {
      focusService.enhanceFocusRing(button);

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      expect(button.classList.contains('enhanced-focus')).toBe(true);
    });

    test('should remove focus ring on blur', () => {
      focusService.enhanceFocusRing(button);

      // Focus first
      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);
      expect(button.classList.contains('enhanced-focus')).toBe(true);

      // Then blur
      const blurEvent = new Event('blur');
      button.dispatchEvent(blurEvent);
      expect(button.classList.contains('enhanced-focus')).toBe(false);
    });

    test('should create visual focus indicator', () => {
      focusService.enhanceFocusRing(button);

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      const focusIndicator = document.querySelector('.focus-ring-indicator');
      expect(focusIndicator).toBeTruthy();
    });

    test('should position focus indicator correctly', () => {
      // Mock getBoundingClientRect
      button.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        left: 200,
        width: 150,
        height: 40,
        right: 350,
        bottom: 140,
        x: 200,
        y: 100,
        toJSON: jest.fn()
      }));

      focusService.enhanceFocusRing(button);

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      const focusIndicator = document.querySelector('.focus-ring-indicator') as HTMLElement;
      expect(focusIndicator).toBeTruthy();
      expect(focusIndicator.style.top).toBe('98px');
      expect(focusIndicator.style.left).toBe('198px');
    });

    test('should update indicator position on window resize', () => {
      focusService.enhanceFocusRing(button);

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      const focusIndicator = document.querySelector('.focus-ring-indicator') as HTMLElement;
      expect(focusIndicator).toBeTruthy();

      // Change mock position
      button.getBoundingClientRect = jest.fn(() => ({
        top: 200,
        left: 300,
        width: 150,
        height: 40,
        right: 450,
        bottom: 240,
        x: 300,
        y: 200,
        toJSON: jest.fn()
      }));

      // Trigger resize
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      expect(focusIndicator.style.top).toBe('198px');
      expect(focusIndicator.style.left).toBe('298px');
    });
  });

  describe('Skip-to-Content Links', () => {
    test('should create skip link', () => {
      focusService.createSkipLink('#main-content', 'Skip to main content');

      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeTruthy();
      expect(skipLink?.textContent).toBe('Skip to main content');
      expect(skipLink?.classList.contains('skip-link')).toBe(true);
    });

    test('should make skip link visible on focus', () => {
      focusService.createSkipLink('#main-content', 'Skip to main content');

      const skipLink = document.querySelector('a[href="#main-content"]') as HTMLElement;

      const focusEvent = new Event('focus');
      skipLink.dispatchEvent(focusEvent);

      expect(skipLink.classList.contains('skip-link-visible')).toBe(true);
    });

    test('should hide skip link on blur', () => {
      focusService.createSkipLink('#main-content', 'Skip to main content');

      const skipLink = document.querySelector('a[href="#main-content"]') as HTMLElement;

      // Focus first
      const focusEvent = new Event('focus');
      skipLink.dispatchEvent(focusEvent);
      expect(skipLink.classList.contains('skip-link-visible')).toBe(true);

      // Then blur
      const blurEvent = new Event('blur');
      skipLink.dispatchEvent(blurEvent);
      expect(skipLink.classList.contains('skip-link-visible')).toBe(false);
    });

    test('should navigate to target on click', () => {
      const target = document.createElement('div');
      target.id = 'main-content';
      target.setAttribute('tabindex', '-1');
      document.body.appendChild(target);

      focusService.createSkipLink('#main-content', 'Skip to main content');

      const skipLink = document.querySelector('a[href="#main-content"]') as HTMLElement;
      
      // Mock focus method
      target.focus = jest.fn();

      const clickEvent = new Event('click');
      skipLink.dispatchEvent(clickEvent);

      expect(target.focus).toHaveBeenCalled();

      target.remove();
    });

    test('should not create duplicate skip links', () => {
      focusService.createSkipLink('#main-content', 'Skip to main content');
      focusService.createSkipLink('#main-content', 'Skip to main content');

      const skipLinks = document.querySelectorAll('a[href="#main-content"]');
      expect(skipLinks.length).toBe(1);
    });
  });

  describe('Keyboard Navigation Detection', () => {
    test('should detect keyboard navigation on Tab key', () => {
      expect(focusService.isKeyboardNavigation()).toBe(false);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      document.dispatchEvent(tabEvent);

      expect(focusService.isKeyboardNavigation()).toBe(true);
    });

    test('should detect keyboard navigation on arrow keys', () => {
      const arrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });
      document.dispatchEvent(arrowEvent);

      expect(focusService.isKeyboardNavigation()).toBe(true);
    });

    test('should reset on mouse interaction', () => {
      // First trigger keyboard navigation
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      document.dispatchEvent(tabEvent);
      expect(focusService.isKeyboardNavigation()).toBe(true);

      // Then use mouse
      const mouseEvent = new MouseEvent('mousedown', {
        bubbles: true
      });
      document.dispatchEvent(mouseEvent);

      expect(focusService.isKeyboardNavigation()).toBe(false);
    });

    test('should apply keyboard navigation styles', () => {
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      document.dispatchEvent(tabEvent);

      expect(document.body.classList.contains('keyboard-navigation')).toBe(true);
    });

    test('should remove keyboard navigation styles on mouse use', () => {
      // First keyboard navigation
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      document.dispatchEvent(tabEvent);
      expect(document.body.classList.contains('keyboard-navigation')).toBe(true);

      // Then mouse interaction
      const mouseEvent = new MouseEvent('mousedown', {
        bubbles: true
      });
      document.dispatchEvent(mouseEvent);

      expect(document.body.classList.contains('keyboard-navigation')).toBe(false);
    });
  });

  describe('Focus Management', () => {
    let elements: HTMLElement[];

    beforeEach(() => {
      elements = [
        document.createElement('button'),
        document.createElement('input'),
        document.createElement('select')
      ];

      elements.forEach((el, index) => {
        el.id = `element-${index}`;
        el.setAttribute('tabindex', '0');
        document.body.appendChild(el);
      });
    });

    afterEach(() => {
      elements.forEach(el => el.remove());
    });

    test('should highlight all focusable elements', () => {
      focusService.highlightFocusableElements();

      elements.forEach(el => {
        expect(el.classList.contains('focusable-highlight')).toBe(true);
      });
    });

    test('should remove focusable highlights', () => {
      focusService.highlightFocusableElements();
      focusService.removeFocusableHighlights();

      elements.forEach(el => {
        expect(el.classList.contains('focusable-highlight')).toBe(false);
      });
    });

    test('should get all focusable elements', () => {
      const focusableElements = focusService.getFocusableElements();

      expect(focusableElements.length).toBeGreaterThanOrEqual(elements.length);
      elements.forEach(el => {
        expect(focusableElements).toContain(el);
      });
    });
  });

  describe('Settings and Configuration', () => {
    test('should update focus ring color', () => {
      focusService.updateSettings({ focusRingColor: '#ff0000' });
      expect(focusService.getState().focusRingColor).toBe('#ff0000');

      // Check if style is updated
      const styleElement = document.querySelector('style[data-focus-service]');
      expect(styleElement?.textContent).toContain('#ff0000');
    });

    test('should update focus ring width', () => {
      focusService.updateSettings({ focusRingWidth: 4 });
      expect(focusService.getState().focusRingWidth).toBe(4);

      const styleElement = document.querySelector('style[data-focus-service]');
      expect(styleElement?.textContent).toContain('4px');
    });

    test('should toggle focus highlighting', () => {
      focusService.updateSettings({ highlightFocusableElements: true });
      expect(focusService.getState().highlightFocusableElements).toBe(true);

      focusService.updateSettings({ highlightFocusableElements: false });
      expect(focusService.getState().highlightFocusableElements).toBe(false);
    });

    test('should update focus ring offset', () => {
      focusService.updateSettings({ focusRingOffset: 3 });
      expect(focusService.getState().focusRingOffset).toBe(3);
    });
  });

  describe('Custom Focus Indicators', () => {
    let button: HTMLButtonElement;

    beforeEach(() => {
      button = document.createElement('button');
      button.textContent = 'Custom Button';
      document.body.appendChild(button);
    });

    afterEach(() => {
      button.remove();
    });

    test('should create custom focus indicator with specific color', () => {
      focusService.createCustomFocusIndicator(button, {
        color: '#00ff00',
        width: 3,
        style: 'solid'
      });

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      const indicator = document.querySelector('.focus-ring-indicator') as HTMLElement;
      expect(indicator).toBeTruthy();
      expect(indicator.style.borderColor).toBe('rgb(0, 255, 0)');
      expect(indicator.style.borderWidth).toBe('3px');
    });

    test('should create dashed focus indicator', () => {
      focusService.createCustomFocusIndicator(button, {
        color: '#0000ff',
        width: 2,
        style: 'dashed'
      });

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      const indicator = document.querySelector('.focus-ring-indicator') as HTMLElement;
      expect(indicator.style.borderStyle).toBe('dashed');
    });

    test('should apply border radius to indicator', () => {
      focusService.createCustomFocusIndicator(button, {
        color: '#ff00ff',
        width: 2,
        borderRadius: 8
      });

      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      const indicator = document.querySelector('.focus-ring-indicator') as HTMLElement;
      expect(indicator.style.borderRadius).toBe('8px');
    });
  });

  describe('Focus Announcement Integration', () => {
    test('should announce focus changes when enabled', () => {
      focusService.updateSettings({ announceFocusChanges: true });

      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Test button');
      document.body.appendChild(button);

      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');

      focusService.enhanceFocusRing(button);
      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'focus-announcement',
          detail: expect.objectContaining({
            element: button,
            text: expect.stringContaining('Test button')
          })
        })
      );

      button.remove();
    });

    test('should not announce when disabled', () => {
      focusService.updateSettings({ announceFocusChanges: false });

      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Test button');
      document.body.appendChild(button);

      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');

      focusService.enhanceFocusRing(button);
      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'focus-announcement'
        })
      );

      button.remove();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid elements gracefully', () => {
      expect(() => {
        focusService.enhanceFocusRing(null as any);
      }).not.toThrow();

      expect(() => {
        focusService.createCustomFocusIndicator(null as any, {});
      }).not.toThrow();
    });

    test('should handle missing target elements for skip links', () => {
      expect(() => {
        focusService.createSkipLink('#non-existent', 'Skip to nowhere');
      }).not.toThrow();

      const skipLink = document.querySelector('a[href="#non-existent"]') as HTMLElement;
      expect(skipLink).toBeTruthy();

      // Click should not throw error even if target doesn't exist
      expect(() => {
        const clickEvent = new Event('click');
        skipLink.dispatchEvent(clickEvent);
      }).not.toThrow();
    });

    test('should handle getBoundingClientRect errors', () => {
      const button = document.createElement('button');
      button.getBoundingClientRect = jest.fn(() => {
        throw new Error('DOM error');
      });
      document.body.appendChild(button);

      expect(() => {
        focusService.enhanceFocusRing(button);
        const focusEvent = new Event('focus');
        button.dispatchEvent(focusEvent);
      }).not.toThrow();

      button.remove();
    });
  });

  describe('Cleanup', () => {
    test('should remove all focus indicators on cleanup', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      focusService.enhanceFocusRing(button);
      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);

      expect(document.querySelector('.focus-ring-indicator')).toBeTruthy();

      focusService.cleanup();

      expect(document.querySelector('.focus-ring-indicator')).toBeFalsy();

      button.remove();
    });

    test('should remove skip links on cleanup', () => {
      focusService.createSkipLink('#main', 'Skip to main');

      expect(document.querySelector('.skip-link')).toBeTruthy();

      focusService.cleanup();

      expect(document.querySelector('.skip-link')).toBeFalsy();
    });

    test('should remove style element on cleanup', () => {
      expect(document.querySelector('style[data-focus-service]')).toBeTruthy();

      focusService.cleanup();

      expect(document.querySelector('style[data-focus-service]')).toBeFalsy();
    });

    test('should remove event listeners on cleanup', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      focusService.enhanceFocusRing(button);

      // Focus should work before cleanup
      const focusEvent = new Event('focus');
      button.dispatchEvent(focusEvent);
      expect(button.classList.contains('enhanced-focus')).toBe(true);

      focusService.cleanup();

      // Remove and re-add classes to test
      button.classList.remove('enhanced-focus');
      button.dispatchEvent(focusEvent);
      expect(button.classList.contains('enhanced-focus')).toBe(false);

      button.remove();
    });
  });
});