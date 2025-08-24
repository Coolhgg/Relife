/// <reference lib="dom" />
import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import AccessibilityPreferencesService, {
  type AccessibilityPreferences,
  type AccessibilityState,
} from '../services/accessibility-preferences';
import {
  createAriaAnnouncement,
  FocusManager,
  announcePageChange,
  isHighContrastMode,
  prefersReducedMotion,
  addAccessibleTooltip,
} from '../utils/accessibility';

/**
 * Main accessibility hook for managing preferences and state
 */
export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    {} as AccessibilityPreferences
  );
  const [state, setState] = useState<AccessibilityState>({} as AccessibilityState);
  const [isInitialized, setIsInitialized] = useState(false);
  const accessibilityService = useRef<AccessibilityPreferencesService>();

  useEffect(() => {
    accessibilityService.current = AccessibilityPreferencesService.getInstance();

    const initialPreferences = accessibilityService.current.getPreferences();
    const initialState = accessibilityService.current.getState();

    setPreferences(initialPreferences);
    setState(initialState);
    setIsInitialized(true);

    // Subscribe to changes
    const unsubscribe = accessibilityService.current.subscribe((newPrefs: any) => { // auto
      setPreferences(newPrefs);
      setState(accessibilityService.current!.getState());
    });

    return unsubscribe;
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<AccessibilityPreferences>) => {
      if (accessibilityService.current) {
        accessibilityService.current.updatePreferences(updates);
      }
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    if (accessibilityService.current) {
      accessibilityService.current.resetToDefaults();
    }
  }, []);

  const testColorContrast = useCallback((foreground: string, background: string) => {
    if (accessibilityService.current) {
      return accessibilityService.current.testColorContrast(foreground, background);
    }
    return { ratio: 0, wcagAA: false, wcagAAA: false };
  }, []);

  return {
    preferences,
    state,
    isInitialized,
    updatePreferences,
    resetToDefaults,
    testColorContrast,
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const { preferences } = useAccessibility();

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (preferences.announceTransitions) {
        createAriaAnnouncement(message, priority);
      }
    },
    [preferences.announceTransitions]
  );

  const announceError = useCallback(
    (message: string) => {
      if (preferences.announceErrors) {
        createAriaAnnouncement(`Error: ${message}`, 'assertive');
      }
    },
    [preferences.announceErrors]
  );

  const announceSuccess = useCallback(
    (message: string) => {
      if (preferences.announceSuccess) {
        createAriaAnnouncement(`Success: ${message}`, 'polite');
      }
    },
    [preferences.announceSuccess]
  );

  const announceNavigation = useCallback(
    (pageName: string) => {
      if (preferences.announceTransitions) {
        announcePageChange(pageName);
      }
    },
    [preferences.announceTransitions]
  );

  return {
    announce,
    announceError,
    announceSuccess,
    announceNavigation,
  };
};

/**
 * Hook for focus management
 */
export const useFocusManagement = () => {
  const { preferences } = useAccessibility();
  const trapCleanupRef = useRef<(() => void) | null>(null);

  const pushFocus = useCallback(
    (element: HTMLElement) => {
      if (preferences.keyboardNavigation) {
        FocusManager.pushFocus(element);
      }
    },
    [preferences.keyboardNavigation]
  );

  const popFocus = useCallback(() => {
    if (preferences.keyboardNavigation) {
      FocusManager.popFocus();
    }
  }, [preferences.keyboardNavigation]);

  const clearFocusStack = useCallback(() => {
    FocusManager.clearFocusStack();
  }, []);

  const trapFocus = useCallback(
    (container: HTMLElement) => {
      if (preferences.keyboardNavigation) {
        // Clear any existing trap
        if (trapCleanupRef.current) {
          trapCleanupRef.current();
        }

        trapCleanupRef.current = FocusManager.trapFocus(container);
        return trapCleanupRef.current;
      }
      return () => {};
    },
    [preferences.keyboardNavigation]
  );

  const clearTrap = useCallback(() => {
    if (trapCleanupRef.current) {
      trapCleanupRef.current();
      trapCleanupRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTrap();
    };
  }, [clearTrap]);

  return {
    pushFocus,
    popFocus,
    clearFocusStack,
    trapFocus,
    clearTrap,
  };
};

/**
 * Hook for accessible tooltips
 */
export const useAccessibleTooltip = () => {
  const tooltipCleanupRef = useRef<Map<HTMLElement, () => void>>(new Map());

  const addTooltip = useCallback(
    (
      element: HTMLElement,
      content: string,
      options?: {
        position?: 'top' | 'bottom' | 'left' | 'right';
        delay?: number;
      }
    ) => {
      // Remove existing tooltip if any
      const existingCleanup = tooltipCleanupRef.current.get(element);
      if (existingCleanup) {
        existingCleanup();
      }

      // Add new tooltip
      const cleanup = addAccessibleTooltip(element, content, options);
      tooltipCleanupRef.current.set(element, cleanup);

      return cleanup;
    },
    []
  );

  const removeTooltip = useCallback((element: HTMLElement) => {
    const cleanup = tooltipCleanupRef.current.get(element);
    if (cleanup) {
      cleanup();
      tooltipCleanupRef.current.delete(element);
    }
  }, []);

  const removeAllTooltips = useCallback(() => {
    tooltipCleanupRef.current.forEach((cleanup: any) => c // auto: implicit anyleanup());
    tooltipCleanupRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeAllTooltips();
    };
  }, [removeAllTooltips]);

  return {
    addTooltip,
    removeTooltip,
    removeAllTooltips,
  };
};

/**
 * Hook for mobile accessibility features
 */
export const useMobileAccessibility = () => {
  const { preferences, state } = useAccessibility();
  const [isVoiceOverActive, setIsVoiceOverActive] = useState(false);
  const [isTalkBackActive, setIsTalkBackActive] = useState(false);

  useEffect(() => {
    // Detect iOS VoiceOver
    const detectVoiceOver = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const hasVoiceOver = preferences.screenReaderOptimized && isIOS;
      setIsVoiceOverActive(hasVoiceOver);
    };

    // Detect Android TalkBack
    const detectTalkBack = () => {
      const isAndroid = /Android/.test(navigator.userAgent);
      const hasTalkBack = preferences.screenReaderOptimized && isAndroid;
      setIsTalkBackActive(hasTalkBack);
    };

    detectVoiceOver();
    detectTalkBack();
  }, [preferences.screenReaderOptimized]);

  const optimizeForMobileScreenReader = useCallback(() => {
    if (isVoiceOverActive || isTalkBackActive) {
      // Apply mobile screen reader optimizations
      document.body.classList.add('mobile-screen-reader');

      // Increase touch targets
      document.body.classList.add('a11y-large-touch-targets');

      // Enable enhanced focus
      document.body.classList.add('a11y-enhanced-focus');
    }
  }, [isVoiceOverActive, isTalkBackActive]);

  useEffect(() => {
    optimizeForMobileScreenReader();
  }, [optimizeForMobileScreenReader]);

  const getMobileAccessibilityProps = useCallback(
    (elementType: 'button' | 'link' | 'input' | 'select') => {
      const baseProps = {
        style: preferences.largerTouchTargets
          ? {
              minHeight: '44px',
              minWidth: '44px',
              padding: '12px 16px',
            }
          : undefined,
      };

      switch (elementType) {
        case 'button':
          return {
            ...baseProps,
            'aria-label': undefined, // To be set by component
            role: 'button' as const,
            tabIndex: 0,
          };
        case 'link':
          return {
            ...baseProps,
            role: 'link' as const,
            tabIndex: 0,
          };
        case 'input':
          return {
            ...baseProps,
            'aria-describedby': undefined, // To be set by component
            'aria-invalid': false,
          };
        case 'select':
          return {
            ...baseProps,
            'aria-expanded': false,
            'aria-haspopup': 'listbox' as const,
          };
        default:
          return baseProps;
      }
    },
    [preferences.largerTouchTargets]
  );

  return {
    isVoiceOverActive,
    isTalkBackActive,
    optimizeForMobileScreenReader,
    getMobileAccessibilityProps,
    isMobileScreenReaderActive: isVoiceOverActive || isTalkBackActive,
    touchDevice: state.touchDevice,
    hasHover: state.hasHover,
  };
};

/**
 * Hook for high contrast mode
 */
export const useHighContrast = () => {
  const { preferences } = useAccessibility();
  const [systemHighContrast, setSystemHighContrast] = useState(false);

  useEffect(() => {
    const checkSystemHighContrast = () => {
      setSystemHighContrast(isHighContrastMode());
    };

    checkSystemHighContrast();

    // Listen for system changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    mediaQuery.addEventListener('change', checkSystemHighContrast);
    forcedColorsQuery.addEventListener('change', checkSystemHighContrast);

    return () => {
      mediaQuery.removeEventListener('change', checkSystemHighContrast);
      forcedColorsQuery.removeEventListener('change', checkSystemHighContrast);
    };
  }, []);

  const isHighContrastActive = preferences.highContrastMode || systemHighContrast;

  const getHighContrastStyles = useCallback(
    (baseStyles: React.CSSProperties = {}) => {
      if (!isHighContrastActive) return baseStyles;

      return {
        ...baseStyles,
        filter: 'contrast(150%)',
        border: '1px solid currentColor',
        outline: '1px solid currentColor',
      };
    },
    [isHighContrastActive]
  );

  return {
    isHighContrastActive,
    systemHighContrast,
    userHighContrast: preferences.highContrastMode,
    getHighContrastStyles,
  };
};

/**
 * Hook for reduced motion preferences
 */
export const useReducedMotion = () => {
  const { preferences } = useAccessibility();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    const checkSystemReducedMotion = () => {
      setSystemReducedMotion(prefersReducedMotion());
    };

    checkSystemReducedMotion();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkSystemReducedMotion);

    return () => {
      mediaQuery.removeEventListener('change', checkSystemReducedMotion);
    };
  }, []);

  const shouldReduceMotion = preferences.reducedMotion || systemReducedMotion;

  const getAnimationProps = useCallback(
    (duration: number = 300, easing: string = 'ease-in-out') => {
      if (shouldReduceMotion) {
        return {
          transition: 'none',
          animation: 'none',
          animationDuration: '0.01ms',
          transitionDuration: '0.01ms',
        };
      }

      return {
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
      };
    },
    [shouldReduceMotion]
  );

  return {
    shouldReduceMotion,
    systemReducedMotion,
    userReducedMotion: preferences.reducedMotion,
    getAnimationProps,
  };
};

/**
 * Hook for color blind friendly colors
 */
export const useColorBlindFriendly = () => {
  const { preferences } = useAccessibility();

  const getColorBlindFriendlyColor = useCallback(
    (colorType: 'red' | 'green' | 'blue' | 'orange' | 'purple') => {
      if (!preferences.colorBlindFriendly) {
        // Return default colors
        const defaultColors = {
          red: '#dc2626',
          green: '#16a34a',
          blue: '#2563eb',
          orange: '#ea580c',
          purple: '#9333ea',
        };
        return defaultColors[colorType];
      }

      // Return color blind friendly alternatives
      const colorBlindColors = {
        red: '#d73027',
        green: '#1a9641',
        blue: '#313695',
        orange: '#fdae61',
        purple: '#762a83',
      };
      return colorBlindColors[colorType];
    },
    [preferences.colorBlindFriendly]
  );

  return {
    isColorBlindFriendly: preferences.colorBlindFriendly,
    getColorBlindFriendlyColor,
  };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = () => {
  const { preferences } = useAccessibility();
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);

  const handleKeyboardNavigation = useCallback(
    (
      event: React.KeyboardEvent,
      items: HTMLElement[],
      onSelect?: (index: number) => void
    ) => {
      if (!preferences.keyboardNavigation) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = (currentFocusIndex + 1) % items.length;
          setCurrentFocusIndex(nextIndex);
          items[nextIndex]?.focus();
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex =
            currentFocusIndex === 0 ? items.length - 1 : currentFocusIndex - 1;
          setCurrentFocusIndex(prevIndex);
          items[prevIndex]?.focus();
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(currentFocusIndex);
          break;

        case 'Home':
          event.preventDefault();
          setCurrentFocusIndex(0);
          items[0]?.focus();
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = items.length - 1;
          setCurrentFocusIndex(lastIndex);
          items[lastIndex]?.focus();
          break;
      }
    },
    [preferences.keyboardNavigation, currentFocusIndex]
  );

  return {
    isKeyboardNavigationEnabled: preferences.keyboardNavigation,
    currentFocusIndex,
    setCurrentFocusIndex,
    handleKeyboardNavigation,
  };
};

export default {
  useAccessibility,
  useScreenReader,
  useFocusManagement,
  useAccessibleTooltip,
  useMobileAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorBlindFriendly,
  useKeyboardNavigation,
};
