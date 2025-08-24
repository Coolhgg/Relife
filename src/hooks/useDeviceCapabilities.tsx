import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  deviceCapabilities,
  DeviceTier,
  DeviceCapabilities,
  AdaptiveConfig,
  DevicePerformanceMetrics,
} from '../services/device-capabilities';
import {
  performanceBudgetManager,
  PerformanceSnapshot,
  PerformanceAlert,
  DeviceAdaptation,
} from '../services/performance-budget-manager';

export interface DeviceCapabilityHookReturn {
  // Device information
  tier: DeviceTier | null;
  capabilities: DeviceCapabilities | null;
  metrics: DevicePerformanceMetrics | null;
  config: AdaptiveConfig | null;
  adaptations: DeviceAdaptation | null;

  // Performance monitoring
  performanceSnapshot: PerformanceSnapshot | null;
  activeAlerts: PerformanceAlert[];

  // Convenience methods
  isLowEnd: boolean;
  isMidRange: boolean;
  isHighEnd: boolean;
  shouldReduceAnimations: boolean;
  shouldUseVirtualScrolling: boolean;
  shouldPreloadContent: boolean;
  optimalImageQuality: 'low' | 'medium' | 'high';
  optimalAudioQuality: 'low' | 'medium' | 'high';
  maxCacheSize: number;

  // Loading states
  isLoading: boolean;
  error: Error | null;

  // Actions
  reevaluateCapabilities: () => Promise<void>;
  resolveAlert: (alertId: string) => void;
  triggerAutoFix: (alertId: string) => Promise<void>;
}

export function useDeviceCapabilities(): DeviceCapabilityHookReturn {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [metrics, setMetrics] = useState<DevicePerformanceMetrics | null>(null);
  const [config, setConfig] = useState<AdaptiveConfig | null>(null);
  const [adaptations, setAdaptations] = useState<DeviceAdaptation | null>(null);
  const [performanceSnapshot, setPerformanceSnapshot] =
    useState<PerformanceSnapshot | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize device capabilities
  useEffect(() => {
    const initializeCapabilities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize device capabilities
        const adaptiveConfig = await deviceCapabilities.initialize();

        // Initialize performance monitoring
        await performanceBudgetManager.initialize();

        // Update state
        setTier(deviceCapabilities.getDeviceTier());
        setCapabilities(deviceCapabilities.getCapabilities());
        setMetrics(deviceCapabilities.getMetrics());
        setConfig(adaptiveConfig);
        setAdaptations(performanceBudgetManager.getAdaptations());
        setPerformanceSnapshot(performanceBudgetManager.getCurrentSnapshot());
        setActiveAlerts(performanceBudgetManager.getActiveAlerts());
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to initialize device capabilities')
        );
        console.error('Device capabilities initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCapabilities();
  }, []);

  // Listen for device capability changes
  useEffect(() => {
    const unsubscribeConfig = deviceCapabilities.onConfigChange(newConfig => {
      setConfig(newConfig);
      setTier(deviceCapabilities.getDeviceTier());
      setCapabilities(deviceCapabilities.getCapabilities());
      setMetrics(deviceCapabilities.getMetrics());
    });

    return unsubscribeConfig;
  }, []);

  // Listen for performance updates
  useEffect(() => {
    const unsubscribeSnapshot = performanceBudgetManager.onSnapshot(snapshot => {
      setPerformanceSnapshot(snapshot);
    });

    const unsubscribeAlerts = performanceBudgetManager.onAlert(alert => {
      setActiveAlerts((prev: any) => {
        const existing = prev.find((a: any) => a.id === alert.id);
        if (existing) {
          // Update existing alert
          return prev.map((a: any) => (a.id === alert.id ? alert : a));
        } else {
          // Add new alert
          return [...prev, alert];
        }
      });
    });

    return () => {
      unsubscribeSnapshot();
      unsubscribeAlerts();
    };
  }, []);

  // Computed values
  const isLowEnd = tier === 'low-end';
  const isMidRange = tier === 'mid-range';
  const isHighEnd = tier === 'high-end';
  const shouldReduceAnimations = deviceCapabilities.shouldReduceAnimations();
  const shouldUseVirtualScrolling = deviceCapabilities.shouldUseVirtualScrolling();
  const shouldPreloadContent = adaptations?.preloadingStrategy !== 'disabled';
  const optimalImageQuality = adaptations?.imageQuality || 'low';
  const optimalAudioQuality = adaptations?.audioQuality || 'low';
  const maxCacheSize = deviceCapabilities.getMaxCacheSize();

  // Actions
  const reevaluateCapabilities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newConfig = await deviceCapabilities.reevaluate();

      setTier(deviceCapabilities.getDeviceTier());
      setCapabilities(deviceCapabilities.getCapabilities());
      setMetrics(deviceCapabilities.getMetrics());
      setConfig(newConfig);
      setAdaptations(performanceBudgetManager.getAdaptations());
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to re-evaluate capabilities')
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    performanceBudgetManager.resolveAlert(alertId);
    setActiveAlerts((prev: any) => prev.filter((alert: any) => alert.id !== alertId));
  }, []);

  const triggerAutoFix = useCallback(async (alertId: string) => {
    try {
      await performanceBudgetManager.triggerAutoFix(alertId);
      setActiveAlerts((prev: any) => prev.filter((alert: any) => alert.id !== alertId));
    } catch (err) {
      console.error('Auto-fix failed:', err);
    }
  }, []);

  return {
    // Device information
    tier,
    capabilities,
    metrics,
    config,
    adaptations,

    // Performance monitoring
    performanceSnapshot,
    activeAlerts,

    // Convenience methods
    isLowEnd,
    isMidRange,
    isHighEnd,
    shouldReduceAnimations,
    shouldUseVirtualScrolling,
    shouldPreloadContent,
    optimalImageQuality,
    optimalAudioQuality,
    maxCacheSize,

    // Loading states
    isLoading,
    error,

    // Actions
    reevaluateCapabilities,
    resolveAlert,
    triggerAutoFix,
  };
}

// Specialized hooks for specific use cases

export function usePerformanceOptimizations() {
  const {
    shouldReduceAnimations,
    shouldUseVirtualScrolling,
    optimalImageQuality,
    isLowEnd,
  } = useDeviceCapabilities();

  return {
    shouldReduceAnimations,
    shouldUseVirtualScrolling,
    shouldLazyLoad: true, // Generally good for all devices
    shouldPreloadImages: !isLowEnd,
    imageQuality: optimalImageQuality,
    animationDuration: shouldReduceAnimations ? 0 : undefined,
    shouldUseMemoization: isLowEnd, // More critical on low-end devices
    shouldBatchUpdates: isLowEnd,
    shouldUsePassiveListeners: true,
  };
}

export function useMemoryOptimizations() {
  const { tier, maxCacheSize, adaptations } = useDeviceCapabilities();

  return {
    maxCacheSize,
    shouldAggressivelyCleanup: tier === 'low-end',
    cacheStrategy: adaptations?.cacheStrategy || 'minimal',
    shouldUseWeakReferences: tier === 'low-end',
    shouldPoolObjects: tier === 'low-end',
    memoryPressureThreshold: tier === 'low-end' ? 0.7 : 0.8,
    shouldCompressCache: tier === 'low-end',
  };
}

export function useNetworkOptimizations() {
  const { tier, capabilities, adaptations } = useDeviceCapabilities();

  const connectionType = capabilities?.connectionType || 'unknown';
  const isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType);

  return {
    shouldBatchRequests: tier === 'low-end' || isSlowConnection,
    requestTimeout: tier === 'low-end' ? 10000 : 5000,
    maxConcurrentRequests: tier === 'low-end' ? 2 : tier === 'mid-range' ? 4 : 8,
    shouldUseCompression: true,
    shouldPreloadCritical: adaptations?.preloadingStrategy === 'aggressive',
    retryAttempts: isSlowConnection ? 3 : 1,
    cacheFirst: tier === 'low-end' || isSlowConnection,
    offlineFirst: tier === 'low-end',
  };
}

export function useAnimationOptimizations() {
  const { shouldReduceAnimations, tier, capabilities } = useDeviceCapabilities();

  const hasGoodGPU = capabilities?.hardwareAcceleration && capabilities?.webglSupport;

  return {
    shouldDisableAnimations: shouldReduceAnimations,
    shouldUseGPUAcceleration: hasGoodGPU,
    animationDuration: shouldReduceAnimations ? 0 : tier === 'low-end' ? 150 : 300,
    shouldUseCSSTransforms: hasGoodGPU,
    shouldUseWillChange: tier !== 'low-end',
    frameRate: tier === 'low-end' ? 30 : 60,
    shouldThrottleAnimations: tier === 'low-end',
    maxSimultaneousAnimations: tier === 'low-end' ? 2 : tier === 'mid-range' ? 4 : 8,
  };
}

// Context provider for device capabilities (optional, for complex apps)
import { createContext, useContext, ReactNode } from 'react';

interface DeviceCapabilityContextType {
  deviceCapabilities: DeviceCapabilityHookReturn;
}

const DeviceCapabilityContext = createContext<DeviceCapabilityContextType | null>(null);

export function DeviceCapabilityProvider({ children }: { children: ReactNode }) {
  const deviceCapabilitiesData = useDeviceCapabilities();

  return (
    <DeviceCapabilityContext.Provider
      value={{ deviceCapabilities: deviceCapabilitiesData }}
    >
      {children}
    </DeviceCapabilityContext.Provider>
  );
}

export function useDeviceCapabilityContext(): DeviceCapabilityHookReturn {
  const context = useContext(DeviceCapabilityContext);
  if (!context) {
    throw new Error(
      'useDeviceCapabilityContext must be used within DeviceCapabilityProvider'
    );
  }
  return context.deviceCapabilities;
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const { performanceSnapshot, activeAlerts, resolveAlert, triggerAutoFix } =
    useDeviceCapabilities();

  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.severity === 'warning');

  const performanceScore = performanceSnapshot?.overallScore || 0;
  const performanceGrade =
    performanceScore >= 90
      ? 'A'
      : performanceScore >= 80
        ? 'B'
        : performanceScore >= 70
          ? 'C'
          : performanceScore >= 60
            ? 'D'
            : 'F';

  return {
    performanceSnapshot,
    activeAlerts,
    criticalAlerts,
    warningAlerts,
    performanceScore,
    performanceGrade,
    hasCriticalIssues: criticalAlerts.length > 0,
    hasWarnings: warningAlerts.length > 0,
    resolveAlert,
    triggerAutoFix,

    // Quick status checks
    isMemoryPressure:
      performanceSnapshot?.memory.pressure === 'high' ||
      performanceSnapshot?.memory.pressure === 'critical',
    isFPSLow: (performanceSnapshot?.frameRate.current || 60) < 30,
    isNetworkSlow: (performanceSnapshot?.network.latency || 0) > 1000,
  };
}
