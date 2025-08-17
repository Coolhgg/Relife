/**
 * Animation Testing Utilities for Relife Alarm App
 * Provides comprehensive testing utilities for CSS animations, transitions, and React animation libraries
 */

import { act } from '@testing-library/react';

interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

interface TransitionConfig {
  property: string;
  duration: number;
  delay?: number;
  timingFunction?: string;
}

interface MockAnimationFrame {
  id: number;
  callback: FrameRequestCallback;
  time: number;
}

// Animation State Tracking
let mockAnimationId = 0;
const pendingAnimationFrames = new Map<number, MockAnimationFrame>();
let currentTime = 0;

// CSS Animation Mocking Utilities
export const animationMocks = {
  /**
   * Mock CSS animations globally
   */
  mockCSSAnimations(): void {
    // Mock getComputedStyle to return animation properties
    const originalGetComputedStyle = window.getComputedStyle;
    
    window.getComputedStyle = jest.fn((element: Element) => {
      const originalStyles = originalGetComputedStyle(element);
      
      return {
        ...originalStyles,
        animationName: 'mock-animation',
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-in-out',
        animationDelay: '0s',
        animationIterationCount: '1',
        animationDirection: 'normal',
        animationFillMode: 'none',
        animationPlayState: 'running',
        getPropertyValue: jest.fn((property: string) => {
          switch (property) {
            case 'animation-name': return 'mock-animation';
            case 'animation-duration': return '0.3s';
            case 'animation-timing-function': return 'ease-in-out';
            case 'animation-delay': return '0s';
            case 'animation-iteration-count': return '1';
            case 'animation-direction': return 'normal';
            case 'animation-fill-mode': return 'none';
            case 'animation-play-state': return 'running';
            default: return originalStyles.getPropertyValue(property);
          }
        })
      } as CSSStyleDeclaration;
    });
  },

  /**
   * Mock CSS transitions
   */
  mockCSSTransitions(): void {
    const originalGetComputedStyle = window.getComputedStyle;
    
    window.getComputedStyle = jest.fn((element: Element) => {
      const originalStyles = originalGetComputedStyle(element);
      
      return {
        ...originalStyles,
        transitionProperty: 'all',
        transitionDuration: '0.2s',
        transitionTimingFunction: 'ease',
        transitionDelay: '0s',
        getPropertyValue: jest.fn((property: string) => {
          switch (property) {
            case 'transition-property': return 'all';
            case 'transition-duration': return '0.2s';
            case 'transition-timing-function': return 'ease';
            case 'transition-delay': return '0s';
            default: return originalStyles.getPropertyValue(property);
          }
        })
      } as CSSStyleDeclaration;
    });
  },

  /**
   * Mock requestAnimationFrame and cancelAnimationFrame
   */
  mockAnimationFrame(): {
    requestAnimationFrame: jest.Mock;
    cancelAnimationFrame: jest.Mock;
    advanceTime: (ms: number) => void;
    runAllFrames: () => void;
  } {
    const requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      const id = ++mockAnimationId;
      pendingAnimationFrames.set(id, {
        id,
        callback,
        time: currentTime + 16.67 // ~60fps
      });
      return id;
    });

    const cancelAnimationFrame = jest.fn((id: number) => {
      pendingAnimationFrames.delete(id);
    });

    const advanceTime = (ms: number) => {
      currentTime += ms;
      const framesToRun = Array.from(pendingAnimationFrames.values())
        .filter(frame => frame.time <= currentTime)
        .sort((a, b) => a.time - b.time);

      framesToRun.forEach(frame => {
        pendingAnimationFrames.delete(frame.id);
        act(() => {
          frame.callback(frame.time);
        });
      });
    };

    const runAllFrames = () => {
      while (pendingAnimationFrames.size > 0) {
        const nextFrame = Math.min(
          ...Array.from(pendingAnimationFrames.values()).map(f => f.time)
        );
        advanceTime(nextFrame - currentTime);
      }
    };

    Object.defineProperty(window, 'requestAnimationFrame', {
      value: requestAnimationFrame,
      writable: true
    });

    Object.defineProperty(window, 'cancelAnimationFrame', {
      value: cancelAnimationFrame,
      writable: true
    });

    return {
      requestAnimationFrame,
      cancelAnimationFrame,
      advanceTime,
      runAllFrames
    };
  },

  /**
   * Mock Web Animations API
   */
  mockWebAnimationsAPI(): void {
    const mockAnimation = {
      play: jest.fn(),
      pause: jest.fn(),
      cancel: jest.fn(),
      finish: jest.fn(),
      reverse: jest.fn(),
      currentTime: 0,
      playState: 'idle',
      playbackRate: 1,
      startTime: null,
      onfinish: null,
      oncancel: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };

    Element.prototype.animate = jest.fn(() => mockAnimation);
  }
};

// Animation Testing Utilities
export const animationUtils = {
  /**
   * Wait for CSS animation to complete
   */
  async waitForAnimation(
    element: HTMLElement, 
    animationName?: string,
    timeout: number = 5000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Animation did not complete within ${timeout}ms`));
      }, timeout);

      const handleAnimationEnd = (event: AnimationEvent) => {
        if (!animationName || event.animationName === animationName) {
          element.removeEventListener('animationend', handleAnimationEnd);
          clearTimeout(timeoutId);
          resolve();
        }
      };

      element.addEventListener('animationend', handleAnimationEnd);
      
      // Also check if animation is already completed
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.animationPlayState === 'finished') {
        element.removeEventListener('animationend', handleAnimationEnd);
        clearTimeout(timeoutId);
        resolve();
      }
    });
  },

  /**
   * Wait for CSS transition to complete
   */
  async waitForTransition(
    element: HTMLElement,
    property?: string,
    timeout: number = 5000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Transition did not complete within ${timeout}ms`));
      }, timeout);

      const handleTransitionEnd = (event: TransitionEvent) => {
        if (!property || event.propertyName === property) {
          element.removeEventListener('transitionend', handleTransitionEnd);
          clearTimeout(timeoutId);
          resolve();
        }
      };

      element.addEventListener('transitionend', handleTransitionEnd);
    });
  },

  /**
   * Simulate animation events
   */
  simulateAnimationEvents: {
    animationStart(element: HTMLElement, animationName: string): void {
      const event = new AnimationEvent('animationstart', {
        animationName,
        elapsedTime: 0,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    },

    animationIteration(element: HTMLElement, animationName: string, elapsedTime: number): void {
      const event = new AnimationEvent('animationiteration', {
        animationName,
        elapsedTime,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    },

    animationEnd(element: HTMLElement, animationName: string, elapsedTime: number): void {
      const event = new AnimationEvent('animationend', {
        animationName,
        elapsedTime,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    },

    animationCancel(element: HTMLElement, animationName: string, elapsedTime: number): void {
      const event = new AnimationEvent('animationcancel', {
        animationName,
        elapsedTime,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    },

    transitionStart(element: HTMLElement, propertyName: string): void {
      const event = new TransitionEvent('transitionstart', {
        propertyName,
        elapsedTime: 0,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    },

    transitionEnd(element: HTMLElement, propertyName: string, elapsedTime: number): void {
      const event = new TransitionEvent('transitionend', {
        propertyName,
        elapsedTime,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    },

    transitionCancel(element: HTMLElement, propertyName: string, elapsedTime: number): void {
      const event = new TransitionEvent('transitioncancel', {
        propertyName,
        elapsedTime,
        pseudoElement: ''
      });
      element.dispatchEvent(event);
    }
  },

  /**
   * Check if element has specific animation
   */
  hasAnimation(element: HTMLElement, animationName: string): boolean {
    const computedStyle = window.getComputedStyle(element);
    const animationNames = computedStyle.animationName.split(',').map(name => name.trim());
    return animationNames.includes(animationName);
  },

  /**
   * Check if element has transition on property
   */
  hasTransition(element: HTMLElement, property: string): boolean {
    const computedStyle = window.getComputedStyle(element);
    const transitionProperties = computedStyle.transitionProperty.split(',').map(prop => prop.trim());
    return transitionProperties.includes(property) || transitionProperties.includes('all');
  },

  /**
   * Get animation duration in milliseconds
   */
  getAnimationDuration(element: HTMLElement): number {
    const computedStyle = window.getComputedStyle(element);
    const duration = computedStyle.animationDuration;
    
    if (duration.endsWith('ms')) {
      return parseFloat(duration);
    } else if (duration.endsWith('s')) {
      return parseFloat(duration) * 1000;
    }
    
    return 0;
  },

  /**
   * Get transition duration in milliseconds
   */
  getTransitionDuration(element: HTMLElement): number {
    const computedStyle = window.getComputedStyle(element);
    const duration = computedStyle.transitionDuration;
    
    if (duration.endsWith('ms')) {
      return parseFloat(duration);
    } else if (duration.endsWith('s')) {
      return parseFloat(duration) * 1000;
    }
    
    return 0;
  }
};

// Alarm-specific Animation Utilities
export const alarmAnimationUtils = {
  /**
   * Test alarm card appearance animation
   */
  async testAlarmCardAnimation(alarmCard: HTMLElement): Promise<void> {
    // Check for slide-in animation
    expect(animationUtils.hasAnimation(alarmCard, 'slideInUp')).toBe(true);
    
    // Wait for animation to complete
    await animationUtils.waitForAnimation(alarmCard, 'slideInUp');
    
    // Verify final state
    const computedStyle = window.getComputedStyle(alarmCard);
    expect(computedStyle.opacity).toBe('1');
    expect(computedStyle.transform).toBe('translateY(0px)');
  },

  /**
   * Test alarm deletion animation
   */
  async testAlarmDeletionAnimation(alarmCard: HTMLElement): Promise<void> {
    // Trigger deletion animation
    alarmCard.classList.add('deleting');
    
    // Check for slide-out animation
    expect(animationUtils.hasAnimation(alarmCard, 'slideOutRight')).toBe(true);
    
    // Wait for animation to complete
    await animationUtils.waitForAnimation(alarmCard, 'slideOutRight');
    
    // Verify final state
    const computedStyle = window.getComputedStyle(alarmCard);
    expect(computedStyle.opacity).toBe('0');
  },

  /**
   * Test alarm ring animation
   */
  testAlarmRingAnimation(alarmElement: HTMLElement): void {
    // Check for pulse animation
    expect(animationUtils.hasAnimation(alarmElement, 'pulse')).toBe(true);
    
    // Check infinite iteration
    const computedStyle = window.getComputedStyle(alarmElement);
    expect(computedStyle.animationIterationCount).toBe('infinite');
  },

  /**
   * Test snooze button animation
   */
  async testSnoozeButtonAnimation(snoozeButton: HTMLElement): Promise<void> {
    // Simulate button press
    snoozeButton.classList.add('pressed');
    
    // Check for scale animation
    expect(animationUtils.hasTransition(snoozeButton, 'transform')).toBe(true);
    
    // Wait for transition
    await animationUtils.waitForTransition(snoozeButton, 'transform');
    
    // Verify scale effect
    const computedStyle = window.getComputedStyle(snoozeButton);
    expect(computedStyle.transform).toContain('scale');
  },

  /**
   * Test time picker animation
   */
  async testTimePickerAnimation(timePicker: HTMLElement): Promise<void> {
    // Check for fade-in animation
    expect(animationUtils.hasAnimation(timePicker, 'fadeIn')).toBe(true);
    
    // Wait for animation
    await animationUtils.waitForAnimation(timePicker, 'fadeIn');
    
    // Verify visibility
    const computedStyle = window.getComputedStyle(timePicker);
    expect(computedStyle.opacity).toBe('1');
  }
};

// React Animation Library Helpers
export const reactAnimationHelpers = {
  /**
   * Mock Framer Motion animations
   */
  mockFramerMotion(): void {
    jest.mock('framer-motion', () => ({
      motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        img: ({ children, ...props }: any) => <img {...props}>{children}</img>
      },
      AnimatePresence: ({ children }: any) => children,
      useAnimation: () => ({
        start: jest.fn(),
        stop: jest.fn(),
        set: jest.fn()
      })
    }));
  },

  /**
   * Mock React Spring animations
   */
  mockReactSpring(): void {
    jest.mock('@react-spring/web', () => ({
      useSpring: () => ({}),
      animated: {
        div: 'div',
        button: 'button',
        span: 'span',
        img: 'img'
      },
      config: {
        default: {},
        gentle: {},
        wobbly: {},
        stiff: {},
        slow: {},
        molasses: {}
      }
    }));
  },

  /**
   * Mock React Transition Group
   */
  mockTransitionGroup(): void {
    jest.mock('react-transition-group', () => ({
      CSSTransition: ({ children, ...props }: any) => {
        return props.in ? children : null;
      },
      TransitionGroup: ({ children }: any) => children,
      Transition: ({ children, ...props }: any) => {
        return typeof children === 'function' 
          ? children('entered') 
          : children;
      }
    }));
  }
};

// Performance Testing for Animations
export const animationPerformanceUtils = {
  /**
   * Measure animation performance
   */
  measureAnimationPerformance(
    element: HTMLElement,
    animationName: string
  ): Promise<{ duration: number; frames: number }> {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      
      const measureFrame = () => {
        frameCount++;
        
        if (animationUtils.hasAnimation(element, animationName)) {
          requestAnimationFrame(measureFrame);
        } else {
          const endTime = performance.now();
          resolve({
            duration: endTime - startTime,
            frames: frameCount
          });
        }
      };
      
      requestAnimationFrame(measureFrame);
    });
  },

  /**
   * Check for animation jank
   */
  detectAnimationJank(threshold: number = 16.67): {
    monitor: () => void;
    getJankFrames: () => number[];
    cleanup: () => void;
  } {
    let lastFrameTime = performance.now();
    let jankFrames: number[] = [];
    let isMonitoring = false;
    
    const monitorFrame = () => {
      if (!isMonitoring) return;
      
      const currentTime = performance.now();
      const frameDuration = currentTime - lastFrameTime;
      
      if (frameDuration > threshold) {
        jankFrames.push(frameDuration);
      }
      
      lastFrameTime = currentTime;
      requestAnimationFrame(monitorFrame);
    };
    
    return {
      monitor: () => {
        isMonitoring = true;
        lastFrameTime = performance.now();
        requestAnimationFrame(monitorFrame);
      },
      getJankFrames: () => jankFrames,
      cleanup: () => {
        isMonitoring = false;
        jankFrames = [];
      }
    };
  }
};

// Cleanup Utilities
export const animationCleanup = {
  /**
   * Clean up all animation mocks
   */
  cleanupAnimationMocks(): void {
    // Reset getComputedStyle
    if (window.getComputedStyle.mockRestore) {
      (window.getComputedStyle as jest.Mock).mockRestore();
    }
    
    // Reset animation frame mocks
    if (window.requestAnimationFrame.mockRestore) {
      (window.requestAnimationFrame as jest.Mock).mockRestore();
    }
    
    if (window.cancelAnimationFrame.mockRestore) {
      (window.cancelAnimationFrame as jest.Mock).mockRestore();
    }
    
    // Clear pending frames
    pendingAnimationFrames.clear();
    currentTime = 0;
    mockAnimationId = 0;
  },

  /**
   * Reset all animation timers
   */
  resetAnimationTimers(): void {
    jest.clearAllTimers();
    pendingAnimationFrames.clear();
    currentTime = 0;
  }
};

// Complete Animation Test Suite
export const createAnimationTestSuite = () => ({
  /**
   * Test basic CSS animation
   */
  async testBasicAnimation(element: HTMLElement, animationName: string): Promise<void> {
    // Check animation is applied
    expect(animationUtils.hasAnimation(element, animationName)).toBe(true);
    
    // Get animation duration
    const duration = animationUtils.getAnimationDuration(element);
    expect(duration).toBeGreaterThan(0);
    
    // Wait for completion
    await animationUtils.waitForAnimation(element, animationName);
  },

  /**
   * Test animation events
   */
  testAnimationEvents(element: HTMLElement, animationName: string): void {
    const startHandler = jest.fn();
    const endHandler = jest.fn();
    
    element.addEventListener('animationstart', startHandler);
    element.addEventListener('animationend', endHandler);
    
    // Simulate events
    animationUtils.simulateAnimationEvents.animationStart(element, animationName);
    animationUtils.simulateAnimationEvents.animationEnd(element, animationName, 300);
    
    expect(startHandler).toHaveBeenCalled();
    expect(endHandler).toHaveBeenCalled();
  },

  /**
   * Test responsive animations
   */
  testResponsiveAnimations(element: HTMLElement): void {
    // Test different screen sizes
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }))
    });
    
    // Check mobile animation
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    if (mobileQuery.matches) {
      expect(animationUtils.hasAnimation(element, 'mobileSlideIn')).toBe(true);
    } else {
      expect(animationUtils.hasAnimation(element, 'desktopFadeIn')).toBe(true);
    }
  }
});

export default {
  animationMocks,
  animationUtils,
  alarmAnimationUtils,
  reactAnimationHelpers,
  animationPerformanceUtils,
  animationCleanup,
  createAnimationTestSuite
};