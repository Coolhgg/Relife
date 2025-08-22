/**
 * Accessibility Preferences Hook
 * React integration for the accessibility preferences system
 */

import { useState, useEffect, useCallback } from 'react';
import AccessibilityPreferencesService, {
  AccessibilityPreferences,
  AccessibilityState,
} from '../services/accessibility-preferences';

/**
 * Hook for managing accessibility preferences
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() =>
    AccessibilityPreferencesService.getInstance().getPreferences()
  );
  const [state, setState] = useState<AccessibilityState>(() =>
    AccessibilityPreferencesService.getInstance().getState()
  );

  useEffect(() => {
    const service = AccessibilityPreferencesService.getInstance();

    const unsubscribe = service.subscribe(newPreferences => {
      setPreferences(newPreferences);
      setState(service.getState());
    });

    return unsubscribe;
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<AccessibilityPreferences>) => {
      AccessibilityPreferencesService.getInstance().updatePreferences(updates);
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    AccessibilityPreferencesService.getInstance().resetToDefaults();
  }, []);

  const testColorContrast = useCallback((foreground: string, background: string) => {
    return AccessibilityPreferencesService.getInstance().testColorContrast(
      foreground,
      background
    );
  }, []);

  return {
    preferences,
    state,
    updatePreferences,
    resetToDefaults,
    testColorContrast,
  };
}

/**
 * Hook for specific accessibility features
 */
export function useReducedMotion(): boolean {
  const { state } = useAccessibilityPreferences();
  return state.reducedMotion || state.isSystemReducedMotion;
}

export function useHighContrast(): boolean {
  const { state } = useAccessibilityPreferences();
  return state.highContrastMode || state.isSystemHighContrast;
}

export function useDarkMode(): boolean {
  const { state } = useAccessibilityPreferences();
  return state.darkMode || state.isSystemDarkMode;
}

export function useScreenReader(): boolean {
  const { state } = useAccessibilityPreferences();
  return state.screenReaderActive;
}

export function useTouchDevice(): boolean {
  const { state } = useAccessibilityPreferences();
  return state.touchDevice;
}

export function useFontScale(): number {
  const { state } = useAccessibilityPreferences();
  const scales = {
    small: 0.875,
    medium: 1,
    large: 1.125,
    'extra-large': 1.25,
  };
  return scales[state.fontSize];
}

/**
 * Hook for accessible animations
 */
export function useAccessibleAnimation() {
  const reducedMotion = useReducedMotion();

  const getAnimationConfig = useCallback(
    (
      config: {
        duration?: number;
        easing?: string;
        delay?: number;
      } = {}
    ) => {
      if (reducedMotion) {
        return {
          duration: 0,
          easing: 'linear',
          delay: 0,
        };
      }

      return {
        duration: config.duration ?? 200,
        easing: config.easing ?? 'ease-in-out',
        delay: config.delay ?? 0,
      };
    },
    [reducedMotion]
  );

  const shouldAnimate = !reducedMotion;

  return {
    shouldAnimate,
    getAnimationConfig,
    reducedMotion,
  };
}

/**
 * Hook for accessible touch interactions
 */
export function useAccessibleTouch() {
  const { state } = useAccessibilityPreferences();

  const getTouchConfig = useCallback(
    () => ({
      minTouchTarget: state.largerTouchTargets ? 48 : 44,
      longPressDelay: state.longPressDelay,
      hapticFeedback: state.hapticFeedback,
    }),
    [state.largerTouchTargets, state.longPressDelay, state.hapticFeedback]
  );

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (state.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
    [state.hapticFeedback]
  );

  return {
    getTouchConfig,
    vibrate,
    isTouchDevice: state.touchDevice,
    hasHover: state.hasHover,
  };
}

/**
 * Hook for accessible focus management
 */
export function useAccessibleFocus() {
  const { state } = useAccessibilityPreferences();

  const getFocusConfig = useCallback(
    () => ({
      enhancedRings: state.enhancedFocusRings,
      focusRingColor: state.focusRingColor,
      skipLinksVisible: state.skipLinksVisible,
      keyboardNavigation: state.keyboardNavigation,
    }),
    [
      state.enhancedFocusRings,
      state.focusRingColor,
      state.skipLinksVisible,
      state.keyboardNavigation,
    ]
  );

  return {
    getFocusConfig,
    enhancedFocusRings: state.enhancedFocusRings,
    keyboardNavigation: state.keyboardNavigation,
  };
}

/**
 * Hook for accessible color schemes
 */
export function useAccessibleColors() {
  const { state } = useAccessibilityPreferences();

  const getColorConfig = useCallback(
    () => ({
      highContrast: state.highContrastMode,
      colorBlindFriendly: state.colorBlindFriendly,
      darkMode: state.darkMode,
    }),
    [state.highContrastMode, state.colorBlindFriendly, state.darkMode]
  );

  const getAccessibleColor = useCallback(
    (color: string, type: 'text' | 'background' = 'text') => {
      if (!state.colorBlindFriendly) return color;

      // Color blind friendly palette
      const colorMap: Record<string, string> = {
        red: '#d73027',
        green: '#1a9641',
        blue: '#313695',
        orange: '#fdae61',
        purple: '#762a83',
        yellow: '#fee08b',
      };

      return colorMap[color.toLowerCase()] || color;
    },
    [state.colorBlindFriendly]
  );

  return {
    getColorConfig,
    getAccessibleColor,
    highContrast: state.highContrastMode,
    darkMode: state.darkMode,
  };
}

export default useAccessibilityPreferences;
