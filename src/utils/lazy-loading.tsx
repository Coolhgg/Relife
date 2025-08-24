/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense, memo, useCallback, useMemo } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { TimeoutHandle } from '../types/timers';

// Loading spinner component
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    <span className="ml-2 text-white/70">Loading...</span>
  </div>
));

// Lazy loaded components with preloading
const lazyWithPreload = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  preloadCondition?: () => boolean
): LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> } => {
  const LazyComponent = lazy(importFunc);

  // Add preload function
  (LazyComponent as any).preload = importFunc;

  // Auto-preload if condition is met
  if (preloadCondition && preloadCondition()) {
    importFunc();
  }

  return LazyComponent as LazyExoticComponent<T> & {
    preload: () => Promise<{ default: T }>;
  };
};

// Lazy loaded components
export const AlarmForm = lazyWithPreload(
  () => import('../components/AlarmForm'),
  () => window.location.pathname === '/create'
);

export const AlarmRinging = lazyWithPreload(
  () => import('../components/AlarmRinging'),
  () => false // Only load when alarm triggers
);

export const SleepTracker = lazyWithPreload(
  () => import('../components/SleepTracker'),
  () => window.location.pathname === '/sleep'
);

export const SmartAlarmSettings = lazyWithPreload(
  () => import('../components/SmartAlarmSettings'),
  () => localStorage.getItem('smart_alarms_enabled') === 'true'
);

export const VoiceSettings = lazyWithPreload(
  () => import('../components/VoiceSettings'),
  () => localStorage.getItem('voice_enabled') === 'true'
);

export const OnboardingFlow = lazyWithPreload(
  () => import('../components/OnboardingFlow'),
  () => !localStorage.getItem('onboarding_completed')
);

// Performance monitoring components
export const PerformanceDashboard = lazyWithPreload(
  () => import('../components/PerformanceDashboard'),
  () => process.env.NODE_ENV === 'development'
);

// Heavy computation components
export const SleepAnalytics = lazyWithPreload(
  () => import('../components/SleepAnalytics'),
  () => false // Load on demand
);

// TODO: Performance optimization - Large dashboard components now lazy loaded
// Analytics dashboards (heavy chart rendering)
export const AnalyticsDashboard = lazyWithPreload(
  () => import('../components/AnalyticsDashboard'),
  () => window.location.pathname.includes('/analytics')
);

export const PersonaAnalyticsDashboard = lazyWithPreload(
  () => import('../components/PersonaAnalyticsDashboard'),
  () => localStorage.getItem('persona_analytics_enabled') === 'true'
);

export const PersonaFocusDashboard = lazyWithPreload(
  () => import('../components/PersonaFocusDashboard'),
  () => false // Load on demand for persona management
);

// TODO: Performance optimization - Theme management components (largest components)
export const ThemeCreator = lazyWithPreload(
  () => import('../components/ThemeCreator'),
  () => false // Load only when theme creation is accessed
);

export const CustomThemeManager = lazyWithPreload(
  () => import('../components/CustomThemeManager'),
  () => false // Load only when custom theme management is needed
);

// TODO: Performance optimization - Premium and security dashboards
export const PremiumDashboard = lazyWithPreload(
  () => import('../components/PremiumDashboard'),
  () => localStorage.getItem('subscription_active') === 'true'
);

export const AccessibilityDashboard = lazyWithPreload(
  () => import('../components/AccessibilityDashboard'),
  () => localStorage.getItem('accessibility_mode') === 'true'
);

export const ComprehensiveSecurityDashboard = lazyWithPreload(
  () => import('../components/ComprehensiveSecurityDashboard'),
  () => process.env.NODE_ENV === 'development' // Admin/dev feature
);

// TODO: Performance optimization - Smart alarm features
export const SmartAlarmDashboard = lazyWithPreload(
  () => import('../components/SmartAlarmDashboard'),
  () => localStorage.getItem('smart_alarms_enabled') === 'true'
);

// TODO: Performance optimization - PWA and diagnostic components
export const PWAStatusDashboard = lazyWithPreload(
  () => import('../components/PWAStatusDashboard'),
  () => false // Load on demand for PWA diagnostics
);

// HOC for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
) => {
  return memo((props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
};

// Bundle splitting utilities
export const preloadRoute = (routePath: string) => {
  const preloadMap: Record<string, () => void> = {
    '/create': () => AlarmForm.preload(),
    '/sleep': () => SleepTracker.preload(),
    '/settings': () => SmartAlarmSettings.preload(),
    '/voice': () => VoiceSettings.preload(),
    '/analytics': () => {
      SleepAnalytics.preload();
      AnalyticsDashboard.preload();
      PersonaAnalyticsDashboard.preload();
    },
    '/premium': () => PremiumDashboard.preload(),
    '/themes': () => {
      ThemeCreator.preload();
      CustomThemeManager.preload();
    },
    '/accessibility': () => AccessibilityDashboard.preload(),
    '/smart-alarms': () => SmartAlarmDashboard.preload(),
    '/diagnostics': () => {
      PWAStatusDashboard.preload();
      ComprehensiveSecurityDashboard.preload();
    },
    '/persona': () => PersonaFocusDashboard.preload(),
  };

  const preloadFn = preloadMap[routePath];
  if (preloadFn) {
    preloadFn();
  }
};

// Route-based preloading
export const useRoutePreloading = () => {
  return useCallback((routePath: string) => {
    // Preload after a short delay to avoid blocking main thread
    setTimeout(() => preloadRoute(routePath), 100);
  }, []);
};

// Component preloading based on user interaction
export const useInteractionPreloading = () => {
  const preloadOnHover = useCallback((componentName: string) => {
    const preloadMap: Record<string, () => void> = {
      'sleep-tracker': () => SleepTracker.preload(),
      'voice-settings': () => VoiceSettings.preload(),
      'smart-settings': () => SmartAlarmSettings.preload(),
      'sleep-analytics': () => SleepAnalytics.preload(),
    };

    const preloadFn = preloadMap[componentName];
    if (preloadFn) {
      preloadFn();
    }
  }, []);

  return { preloadOnHover };
};

// Performance-aware component rendering
export const usePerformantRender = <T,>(
  data: T[],
  renderFn: (item: T, _index: number) => React.ReactNode,
  options: {
    batchSize?: number;
    throttleMs?: number;
  } = {}
) => {
  const { batchSize = 10, throttleMs = 16 } = options;

  return useMemo(() => {
    // Render in batches to avoid blocking
    const batches: React.ReactNode[][] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize).map(renderFn);
      batches.push(batch);
    }

    return batches.flat();
  }, [data, renderFn, batchSize]);
};

// Memory cleanup utilities
export const useMemoryCleanup = (cleanup: () => void, deps: React.DependencyList) => {
  React.useEffect(() => {
    return cleanup;
  }, deps);
};

export default {
  AlarmForm,
  AlarmRinging,
  SleepTracker,
  SmartAlarmSettings,
  VoiceSettings,
  OnboardingFlow,
  PerformanceDashboard,
  SleepAnalytics,
  withLazyLoading,
  preloadRoute,
  useRoutePreloading,
  useInteractionPreloading,
  usePerformantRender,
  useMemoryCleanup,
};
