// Keyboard Navigation Service Tests
// Validates keyboard shortcuts, focus management, and navigation patterns

import KeyboardNavigationService from '../keyboard-navigation';

// Mock DOM events and methods
Object.defineProperty(document, 'activeElement', {
  writable: true,
  value: null
});

describe('KeyboardNavigationService', () => {
  let keyboardService: KeyboardNavigationService;
  let mockElements: HTMLElement[];

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Create mock focusable elements
    mockElements = [
      document.createElement('button'),
      document.createElement('input'),
      document.createElement('select'),
      document.createElement('a')
    ];

    mockElements.forEach((el, index) => {
      el.setAttribute('id', `element-${index}`);
      el.setAttribute('tabindex', '0');
      document.body.appendChild(el);
    });

    keyboardService = KeyboardNavigationService.getInstance();
    keyboardService.initialize();
  });

  afterEach(() => {
    keyboardService.cleanup();
    mockElements.forEach(el => el.remove());
  });

  describe('Initialization and Singleton', () => {
    test('should be a singleton', () => {
      const instance1 = KeyboardNavigationService.getInstance();
      const instance2 = KeyboardNavigationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should initialize keyboard shortcuts', () => {
      const service = KeyboardNavigationService.getInstance();
      expect(service).toBeDefined();
      expect(service.getState().shortcutsEnabled).toBe(true);
    });
  });

  describe('Global Keyboard Shortcuts', () => {
    test('should handle navigation shortcuts', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Simulate Alt+D for Dashboard
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(dispatchSpy).toHaveBeenCalled();
    });

    test('should handle alarm shortcuts', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Simulate Ctrl+N for New Alarm
      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(dispatchSpy).toHaveBeenCalled();
    });

    test('should handle accessibility shortcuts', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Simulate Alt+H for Help
      const event = new KeyboardEvent('keydown', {
        key: 'h',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(dispatchSpy).toHaveBeenCalled();
    });

    test('should not trigger shortcuts when in input fields', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        altKey: true,
        bubbles: true,
        target: input
      });
      
      document.dispatchEvent(event);
      
      // Should not prevent default when in input
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('Focus Management', () => {
    test('should push and restore focus', () => {
      const element1 = mockElements[0];
      const element2 = mockElements[1];
      
      element1.focus = jest.fn();
      element2.focus = jest.fn();
      
      keyboardService.pushFocus(element1);
      expect(element1.focus).toHaveBeenCalled();
      
      keyboardService.pushFocus(element2);
      expect(element2.focus).toHaveBeenCalled();
      
      keyboardService.restoreFocus();
      expect(element1.focus).toHaveBeenCalledTimes(2); // Initial + restore
    });

    test('should clear focus stack', () => {
      const element = mockElements[0];
      element.focus = jest.fn();
      
      keyboardService.pushFocus(element);
      keyboardService.clearFocusStack();
      
      // Should not restore after clearing
      keyboardService.restoreFocus();
      expect(element.focus).toHaveBeenCalledTimes(1); // Only initial call
    });

    test('should trap focus in container', () => {
      const container = document.createElement('div');
      container.appendChild(mockElements[0]);
      container.appendChild(mockElements[1]);
      document.body.appendChild(container);

      const cleanup = keyboardService.trapFocus(container);
      
      // Simulate tab key on last element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      mockElements[1].dispatchEvent(tabEvent);
      
      cleanup();
      container.remove();
    });
  });

  describe('Roving Focus', () => {
    test('should enable roving focus for toolbar', () => {
      const toolbar = document.createElement('div');
      toolbar.setAttribute('role', 'toolbar');
      
      mockElements.forEach(el => {
        el.setAttribute('tabindex', '-1');
        toolbar.appendChild(el);
      });
      
      document.body.appendChild(toolbar);
      
      const cleanup = keyboardService.enableRovingFocus(toolbar);
      
      // First element should be tabbable
      expect(mockElements[0].getAttribute('tabindex')).toBe('0');
      
      // Simulate arrow key navigation
      const arrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      });
      
      mockElements[0].dispatchEvent(arrowEvent);
      
      cleanup();
      toolbar.remove();
    });

    test('should handle wrap-around in roving focus', () => {
      const container = document.createElement('div');
      mockElements.forEach(el => {
        el.setAttribute('tabindex', '-1');
        container.appendChild(el);
      });
      document.body.appendChild(container);
      
      const cleanup = keyboardService.enableRovingFocus(container);
      
      // Focus last element and press right arrow (should wrap to first)
      mockElements[mockElements.length - 1].focus();
      
      const arrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      });
      
      mockElements[mockElements.length - 1].dispatchEvent(arrowEvent);
      
      cleanup();
      container.remove();
    });
  });

  describe('Skip Links', () => {
    test('should add skip link to page', () => {
      keyboardService.addSkipLink('#main-content', 'Skip to main content');
      
      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeTruthy();
      expect(skipLink?.textContent).toBe('Skip to main content');
      expect(skipLink?.getAttribute('class')).toContain('sr-only');
    });

    test('should make skip link visible on focus', () => {
      keyboardService.addSkipLink('#main-content', 'Skip to main content');
      
      const skipLink = document.querySelector('a[href="#main-content"]') as HTMLElement;
      
      skipLink.focus();
      const focusEvent = new Event('focus');
      skipLink.dispatchEvent(focusEvent);
      
      expect(skipLink.getAttribute('class')).not.toContain('sr-only');
    });

    test('should hide skip link on blur', () => {
      keyboardService.addSkipLink('#main-content', 'Skip to main content');
      
      const skipLink = document.querySelector('a[href="#main-content"]') as HTMLElement;
      
      const blurEvent = new Event('blur');
      skipLink.dispatchEvent(blurEvent);
      
      expect(skipLink.getAttribute('class')).toContain('sr-only');
    });
  });

  describe('Keyboard Navigation Detection', () => {
    test('should detect keyboard navigation', () => {
      expect(keyboardService.isKeyboardNavigation()).toBe(false);
      
      // Simulate tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      
      document.dispatchEvent(tabEvent);
      
      expect(keyboardService.isKeyboardNavigation()).toBe(true);
    });

    test('should reset keyboard navigation on mouse use', () => {
      // First trigger keyboard navigation
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      document.dispatchEvent(tabEvent);
      
      expect(keyboardService.isKeyboardNavigation()).toBe(true);
      
      // Then use mouse
      const mouseEvent = new MouseEvent('mousedown', {
        bubbles: true
      });
      document.dispatchEvent(mouseEvent);
      
      expect(keyboardService.isKeyboardNavigation()).toBe(false);
    });
  });

  describe('Shortcut Management', () => {
    test('should register custom shortcuts', () => {
      const callback = jest.fn();
      
      keyboardService.registerShortcut('Ctrl+Shift+T', callback, 'Test shortcut');
      
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should unregister shortcuts', () => {
      const callback = jest.fn();
      
      const unregister = keyboardService.registerShortcut('Ctrl+T', callback, 'Test');
      unregister();
      
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should get all registered shortcuts', () => {
      keyboardService.registerShortcut('Ctrl+A', jest.fn(), 'Select All');
      keyboardService.registerShortcut('Ctrl+C', jest.fn(), 'Copy');
      
      const shortcuts = keyboardService.getRegisteredShortcuts();
      
      expect(shortcuts.length).toBeGreaterThan(0);
      expect(shortcuts.some(s => s.key === 'Ctrl+A')).toBe(true);
      expect(shortcuts.some(s => s.key === 'Ctrl+C')).toBe(true);
    });
  });

  describe('Settings and Configuration', () => {
    test('should enable/disable shortcuts', () => {
      keyboardService.updateSettings({ shortcutsEnabled: false });
      expect(keyboardService.getState().shortcutsEnabled).toBe(false);
      
      keyboardService.updateSettings({ shortcutsEnabled: true });
      expect(keyboardService.getState().shortcutsEnabled).toBe(true);
    });

    test('should respect shortcuts disabled setting', () => {
      keyboardService.updateSettings({ shortcutsEnabled: false });
      
      const callback = jest.fn();
      keyboardService.registerShortcut('Ctrl+T', callback, 'Test');
      
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid elements gracefully', () => {
      expect(() => {
        keyboardService.pushFocus(null as any);
      }).not.toThrow();
      
      expect(() => {
        keyboardService.trapFocus(null as any);
      }).not.toThrow();
    });

    test('should handle invalid shortcut keys', () => {
      expect(() => {
        keyboardService.registerShortcut('', jest.fn(), 'Invalid');
      }).not.toThrow();
      
      expect(() => {
        keyboardService.registerShortcut('Invalid+Key', jest.fn(), 'Invalid');
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    test('should clean up event listeners and focus stack', () => {
      const element = mockElements[0];
      keyboardService.pushFocus(element);
      
      keyboardService.cleanup();
      
      expect(keyboardService.getState().focusStack.length).toBe(0);
      expect(keyboardService.getState().shortcuts.length).toBe(0);
    });

    test('should remove skip links on cleanup', () => {
      keyboardService.addSkipLink('#test', 'Test Skip Link');
      
      const skipLinkBefore = document.querySelector('a[href="#test"]');
      expect(skipLinkBefore).toBeTruthy();
      
      keyboardService.cleanup();
      
      const skipLinkAfter = document.querySelector('a[href="#test"]');
      expect(skipLinkAfter).toBeFalsy();
    });
  });
});