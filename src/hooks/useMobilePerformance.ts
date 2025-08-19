import { useState, useEffect, useRef, useCallback } from 'react';
import { mobilePerformance } from '../services/mobile-performance';

export interface PerformanceMetrics {
  memoryUsage?: number;
  memoryLimit?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  networkSpeed?: 'slow' | 'fast' | 'offline';
  devicePerformance?: 'high' | 'medium' | 'low';
}

export interface PerformanceOptimizations {
  reducedAnimations: boolean;
  lazyLoadingEnabled: boolean;
  lowBatteryMode: boolean;
  backgroundSyncEnabled: boolean;
}

/**
 * Hook for monitoring and optimizing mobile performance
 */
export const useMobilePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [optimizations, setOptimizations] = useState<PerformanceOptimizations>({
    reducedAnimations: false,
    lazyLoadingEnabled: true,
    lowBatteryMode: false,
    backgroundSyncEnabled: true,
  });

  const [isLowPerformanceDevice, setIsLowPerformanceDevice] = useState(false);

  useEffect(() => {
    mobilePerformance.initialize();

    const updateMetrics = () => {
      const newMetrics: PerformanceMetrics = {};

      // Memory monitoring
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = memory.usedJSHeapSize;
        newMetrics.memoryLimit = memory.jsHeapSizeLimit;
      }

      // Battery monitoring
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level,
            batteryCharging: battery.charging,
          }));

          // Enable low battery mode
          if (battery.level < 0.2 && !battery.charging) {
            setOptimizations(prev => ({
              ...prev,
              lowBatteryMode: true,
              reducedAnimations: true,
              backgroundSyncEnabled: false,
            }));
          }
        });
      }

      // Network speed detection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection.effectiveType;

        newMetrics.networkSpeed =
          effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' :
          effectiveType === '3g' ? 'fast' : 'fast';
      }

      // Device performance estimation
      const deviceMemory = (navigator as any).deviceMemory || 4;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;

      if (deviceMemory <= 2 || hardwareConcurrency <= 2) {
        newMetrics.devicePerformance = 'low';
        setIsLowPerformanceDevice(true);
      } else if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
        newMetrics.devicePerformance = 'medium';
      } else {
        newMetrics.devicePerformance = 'high';
      }

      setMetrics(prev => ({ ...prev, ...newMetrics }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Automatically optimize based on device capabilities
  useEffect(() => {
    if (isLowPerformanceDevice || metrics.batteryLevel && metrics.batteryLevel < 0.3) {
      setOptimizations(prev => ({
        ...prev,
        reducedAnimations: true,
        backgroundSyncEnabled: false,
      }));
    }

    if (metrics.networkSpeed === 'slow') {
      setOptimizations(prev => ({
        ...prev,
        lazyLoadingEnabled: true,
      }));
    }
  }, [isLowPerformanceDevice, metrics.batteryLevel, metrics.networkSpeed]);

  const enableLowPowerMode = useCallback(() => {
    setOptimizations({
      reducedAnimations: true,
      lazyLoadingEnabled: true,
      lowBatteryMode: true,
      backgroundSyncEnabled: false,
    });

    document.body.classList.add('low-power-mode');
    document.body.classList.add('reduce-motion');
  }, []);

  const disableLowPowerMode = useCallback(() => {
    setOptimizations({
      reducedAnimations: false,
      lazyLoadingEnabled: true,
      lowBatteryMode: false,
      backgroundSyncEnabled: true,
    });

    document.body.classList.remove('low-power-mode');
    document.body.classList.remove('reduce-motion');
  }, []);

  return {
    metrics,
    optimizations,
    isLowPerformanceDevice,
    enableLowPowerMode,
    disableLowPowerMode,
  };
};

/**
 * Hook for lazy loading images with intersection observer
 */
export const useLazyLoading = () => {
  const [isSupported] = useState(
    'IntersectionObserver' in window && 'IntersectionObserverEntry' in window
  );

  const lazyLoadImage = useCallback((element: HTMLImageElement, src: string) => {
    if (!isSupported) {
      element.src = src;
      return;
    }

    mobilePerformance.lazyLoadImage(element);
    element.dataset.src = src;
  }, [isSupported]);

  const lazyLoadRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.dataset.src) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              img.src = img.dataset.src!;
              img.classList.remove('lazy-loading');
              img.classList.add('lazy-loaded');
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(node);
    }
  }, []);

  return {
    isSupported,
    lazyLoadImage,
    lazyLoadRef,
  };
};

/**
 * Hook for monitoring memory usage and preventing leaks
 */
export const useMemoryMonitoring = () => {
  const [memoryPressure, setMemoryPressure] = useState<'low' | 'medium' | 'high'>('low');
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usagePercent > 0.9) {
        setMemoryPressure('high');
      } else if (usagePercent > 0.7) {
        setMemoryPressure('medium');
      } else {
        setMemoryPressure('low');
      }
    };

    checkMemory();
    intervalRef.current = setInterval(checkMemory, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const forceGarbageCollection = useCallback(() => {
    // Trigger garbage collection if available (Chrome DevTools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, []);

  return {
    memoryPressure,
    forceGarbageCollection,
  };
};

/**
 * Hook for battery-aware optimizations
 */
export const useBatteryOptimization = () => {
  const [batteryInfo, setBatteryInfo] = useState<{
    level: number;
    charging: boolean;
    chargingTime?: number;
    dischargingTime?: number;
  } | null>(null);

  const [batteryOptimizationsEnabled, setBatteryOptimizationsEnabled] = useState(false);

  useEffect(() => {
    if (!('getBattery' in navigator)) return;

    (navigator as any).getBattery().then((battery: any) => {
      const updateBatteryInfo = () => {
        setBatteryInfo({
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        });

        // Enable optimizations when battery is low
        if (battery.level < 0.2 && !battery.charging) {
          setBatteryOptimizationsEnabled(true);
        } else if (battery.level > 0.5 || battery.charging) {
          setBatteryOptimizationsEnabled(false);
        }
      };

      updateBatteryInfo();

      battery.addEventListener('chargingchange', updateBatteryInfo);
      battery.addEventListener('levelchange', updateBatteryInfo);
      battery.addEventListener('chargingtimechange', updateBatteryInfo);
      battery.addEventListener('dischargingtimechange', updateBatteryInfo);
    });
  }, []);

  return {
    batteryInfo,
    batteryOptimizationsEnabled,
  };
};

/**
 * Hook for network-aware loading
 */
export const useNetworkAwareLoading = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    saveData?: boolean;
  }>({});

  const [shouldOptimizeForSlowNetwork, setShouldOptimizeForSlowNetwork] = useState(false);

  useEffect(() => {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        saveData: connection.saveData,
      });

      // Optimize for slow networks
      const isSlowNetwork =
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData ||
        (connection.downlink && connection.downlink < 1);

      setShouldOptimizeForSlowNetwork(isSlowNetwork);
    };

    updateNetworkInfo();
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return {
    networkInfo,
    shouldOptimizeForSlowNetwork,
  };
};

/**
 * Hook for performance-aware animations
 */
export const usePerformanceAwareAnimations = () => {
  const { optimizations } = useMobilePerformance();
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldReduceAnimations =
      prefersReducedMotion ||
      optimizations.reducedAnimations ||
      optimizations.lowBatteryMode;

    setAnimationsEnabled(!shouldReduceAnimations);

    if (shouldReduceAnimations) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }, [optimizations.reducedAnimations, optimizations.lowBatteryMode]);

  const getAnimationDuration = useCallback((baseDuration: number): number => {
    if (!animationsEnabled) return 0;
    return optimizations.lowBatteryMode ? baseDuration * 0.5 : baseDuration;
  }, [animationsEnabled, optimizations.lowBatteryMode]);

  const getAnimationClass = useCallback((animationClass: string): string => {
    if (!animationsEnabled) return '';
    return optimizations.lowBatteryMode ? `${animationClass}-reduced` : animationClass;
  }, [animationsEnabled, optimizations.lowBatteryMode]);

  return {
    animationsEnabled,
    getAnimationDuration,
    getAnimationClass,
  };
};