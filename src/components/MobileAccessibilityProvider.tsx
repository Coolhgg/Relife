import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  useAccessibility,
  useMobileAccessibility,
  useScreenReader,
  useFocusManagement,
} from '../hooks/useAccessibility';
import { useMobilePerformance } from '../hooks/useMobilePerformance';
import { mobilePerformance } from '../services/mobile-performance';
import AccessibilityPreferencesService from '../services/accessibility-preferences';
import { TimeoutHandle } from '../types/timers';

interface MobileAccessibilityContextValue {
  // Accessibility state
  isAccessibilityEnabled: boolean;
  isMobileScreenReaderActive: boolean;
  preferences: any;

  // Performance state
  performanceMetrics: any;
  optimizations: any;

  // Methods
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
  updatePreferences: (updates: any) => void;
  enableLowPowerMode: () => void;
  disableLowPowerMode: () => void;
}

const MobileAccessibilityContext =
  createContext<MobileAccessibilityContextValue | null>(null);

export const useMobileAccessibilityContext = () => {
  const context = useContext(MobileAccessibilityContext);
  if (!context) {
    throw new Error(
      'useMobileAccessibilityContext must be used within MobileAccessibilityProvider'
    );
  }
  return context;
};

interface MobileAccessibilityProviderProps {
  children: React.ReactNode;
}

export const MobileAccessibilityProvider: React.FC<
  MobileAccessibilityProviderProps
> = ({ children }) => {
  const { preferences, updatePreferences, isInitialized } = useAccessibility();
  const { isMobileScreenReaderActive, optimizeForMobileScreenReader } =
    useMobileAccessibility();
  const { announce, announceError, announceSuccess } = useScreenReader();
  const {
    metrics: performanceMetrics,
    optimizations,
    enableLowPowerMode,
    disableLowPowerMode,
  } = useMobilePerformance();

  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);

  // Initialize mobile accessibility and performance services
  useEffect(() => {
    if (!isInitialized) return;

    try {
      // Initialize performance monitoring
      mobilePerformance.initialize({
        enableMemoryMonitoring: true,
        enableBatteryOptimization: true,
        enableNetworkOptimization: true,
        lazyLoadingThreshold: 0.1,
        memoryWarningThreshold: 0.8,
        batteryLowThreshold: 0.2,
      });

      // Initialize accessibility preferences service
      const accessibilityService = AccessibilityPreferencesService.getInstance();

      setIsAccessibilityEnabled(true);
      console.log('[MobileAccessibility] Services initialized successfully');

      // Announce initialization
      if (preferences.announceTransitions) {
        setTimeout(() => {
          announce('Mobile accessibility features initialized', 'polite');
        }, 1000);
      }
    } catch (error) {
      console.error('[MobileAccessibility] Initialization failed:', error);
      announceError('Failed to initialize accessibility features');
    }
  }, [isInitialized, preferences.announceTransitions, announce, announceError]);

  // Apply mobile-specific accessibility optimizations
  useEffect(() => {
    if (!isAccessibilityEnabled) return;

    // Mobile screen reader optimizations
    if (isMobileScreenReaderActive) {
      optimizeForMobileScreenReader();
    }

    // Apply touch target optimizations
    if (preferences.largerTouchTargets) {
      document.body.classList.add('mobile-large-touch-targets');
    } else {
      document.body.classList.remove('mobile-large-touch-targets');
    }

    // Apply high contrast mode for mobile
    if (preferences.highContrastMode) {
      document.body.classList.add('mobile-high-contrast');
    } else {
      document.body.classList.remove('mobile-high-contrast');
    }

    // Apply reduced motion for mobile
    if (preferences.reducedMotion || optimizations.reducedAnimations) {
      document.body.classList.add('mobile-reduce-motion');
    } else {
      document.body.classList.remove('mobile-reduce-motion');
    }

    // Apply low power mode styles
    if (optimizations.lowBatteryMode) {
      document.body.classList.add('mobile-low-power');
    } else {
      document.body.classList.remove('mobile-low-power');
    }
  }, [
    isAccessibilityEnabled,
    isMobileScreenReaderActive,
    preferences.largerTouchTargets,
    preferences.highContrastMode,
    preferences.reducedMotion,
    optimizations.reducedAnimations,
    optimizations.lowBatteryMode,
    optimizeForMobileScreenReader,
  ]);

  // Monitor performance and adjust accessibility features accordingly
  useEffect(() => {
    if (!isAccessibilityEnabled) return;

    // Enable accessibility optimizations for low-performance devices
    if (performanceMetrics.devicePerformance === 'low') {
      updatePreferences({
        reducedMotion: true,
        enhancedFocusRings: false, // Reduce visual complexity
      });
    }

    // Adjust for low battery
    if (performanceMetrics.batteryLevel && performanceMetrics.batteryLevel < 0.2) {
      updatePreferences({
        reducedMotion: true,
        hapticFeedback: false, // Save battery
      });
    }

    // Adjust for slow network
    if (performanceMetrics.networkSpeed === 'slow') {
      // Could adjust announcement frequency or disable non-essential features
      console.log('[MobileAccessibility] Adjusting for slow network');
    }
  }, [
    isAccessibilityEnabled,
    performanceMetrics.devicePerformance,
    performanceMetrics.batteryLevel,
    performanceMetrics.networkSpeed,
    updatePreferences,
  ]);

  // Add mobile accessibility CSS classes
  useEffect(() => {
    const addMobileAccessibilityStyles = () => {
      const style = document.createElement('style');
      style.id = 'mobile-accessibility-styles';
      style.textContent = `
        /* Mobile accessibility enhancements */
        .mobile-large-touch-targets button,
        .mobile-large-touch-targets [role="button"],
        .mobile-large-touch-targets input,
        .mobile-large-touch-targets select,
        .mobile-large-touch-targets textarea,
        .mobile-large-touch-targets a {
          min-height: 48px !important;
          min-width: 48px !important;
          padding: 14px 18px !important;
          font-size: 1rem !important;
        }

        .mobile-large-touch-targets .alarm-card button {
          min-height: 52px !important;
          min-width: 52px !important;
        }

        /* High contrast for mobile */
        .mobile-high-contrast {
          filter: contrast(150%) brightness(110%);
        }

        .mobile-high-contrast .bg-gradient-to-r {
          background: linear-gradient(to right, #000000, #333333) !important;
          color: #ffffff !important;
        }

        .mobile-high-contrast .text-gray-400,
        .mobile-high-contrast .text-gray-500,
        .mobile-high-contrast .text-gray-600 {
          color: #000000 !important;
        }

        /* Reduced motion for mobile */
        .mobile-reduce-motion *,
        .mobile-reduce-motion *::before,
        .mobile-reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
          transform: none !important;
        }

        /* Low power mode */
        .mobile-low-power {
          filter: grayscale(0.3);
        }

        .mobile-low-power .bg-gradient-to-r,
        .mobile-low-power .bg-gradient-to-br {
          background: #4a5568 !important;
        }

        .mobile-low-power .shadow-xl {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }

        /* Mobile screen reader optimizations */
        .mobile-screen-reader .sr-only {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: normal !important;
        }

        .mobile-screen-reader [aria-hidden="true"] {
          display: none !important;
        }

        /* Enhanced focus for mobile */
        .mobile-screen-reader *:focus {
          outline: 4px solid #007AFF !important;
          outline-offset: 2px !important;
          border-radius: 6px !important;
          box-shadow: 0 0 0 8px rgba(0, 122, 255, 0.3) !important;
        }

        /* Touch feedback */
        @media (hover: none) and (pointer: coarse) {
          button:active,
          [role="button"]:active {
            transform: scale(0.98);
            background-color: rgba(0, 0, 0, 0.1);
          }

          .mobile-large-touch-targets button:active {
            transform: scale(0.96);
          }
        }

        /* Safe area handling */
        @supports (padding: max(0px)) {
          .mobile-safe-area {
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
            padding-top: max(16px, env(safe-area-inset-top));
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        }

        /* Responsive text sizes */
        @media (max-width: 640px) {
          .mobile-large-touch-targets .text-xs { font-size: 0.875rem !important; }
          .mobile-large-touch-targets .text-sm { font-size: 1rem !important; }
          .mobile-large-touch-targets .text-base { font-size: 1.125rem !important; }
          .mobile-large-touch-targets .text-lg { font-size: 1.25rem !important; }
        }
      `;

      document.head.appendChild(style);
    };

    // Add styles only once
    if (!document.getElementById('mobile-accessibility-styles')) {
      addMobileAccessibilityStyles();
    }

    return () => {
      const existingStyle = document.getElementById('mobile-accessibility-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const contextValue: MobileAccessibilityContextValue = {
    isAccessibilityEnabled,
    isMobileScreenReaderActive,
    preferences,
    performanceMetrics,
    optimizations,
    announce,
    announceError,
    announceSuccess,
    updatePreferences,
    enableLowPowerMode,
    disableLowPowerMode,
  };

  return (
    <MobileAccessibilityContext.Provider value={contextValue}>
      {children}
    </MobileAccessibilityContext.Provider>
  );
};

export default MobileAccessibilityProvider;
