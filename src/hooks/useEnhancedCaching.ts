/// <reference types="node" />
import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedCacheManager } from '../services/enhanced-cache-manager';
import type {
  CacheStats,
  CachePolicy,
  CacheWarmingConfig,
  CacheEntry,
} from '../services/enhanced-cache-manager';
import type { CustomSound } from '../services/types/media';
import { TimeoutHandle } from '../types/timers';

export interface CacheState {
  stats: CacheStats;
  isOptimizing: boolean;
  isWarming: boolean;
  memoryPressure: 'low' | 'medium' | 'high';
  lastOptimization: Date | null;
}

/**
 * Main hook for enhanced caching functionality
 */
export function useEnhancedCaching(): {
  cacheState: CacheState;
  optimize: () => Promise<void>;
  warmCache: (sounds: CustomSound[]) => Promise<void>;
  clearCache: () => Promise<void>;
  updatePolicy: (policy: Partial<CachePolicy>) => void;
  getCacheEntry: (id: string) => Promise<CacheEntry | null>;
} {
  const [cacheState, setCacheState] = useState<CacheState>({
    stats: enhancedCacheManager.getStats(),
    isOptimizing: false,
    isWarming: false,
    memoryPressure: 'low',
    lastOptimization: null,
  });

  const statsInterval = useRef<TimeoutHandle>();

  const updateStats = useCallback(() => {
    const stats = enhancedCacheManager.getStats();
    const memoryPressure =
      stats.memoryPressure < 0.5
        ? 'low'
        : stats.memoryPressure < 0.8
          ? 'medium'
          : 'high';

    setCacheState(prev => ({
      ...prev,
      stats,
      memoryPressure,
    }));
  }, []);

  const optimize = useCallback(async () => {
    setCacheState(prev => ({ ...prev, isOptimizing: true }));

    try {
      await enhancedCacheManager.optimize();
      setCacheState(prev => ({
        ...prev,
        lastOptimization: new Date(),
      }));
    } finally {
      setCacheState(prev => ({ ...prev, isOptimizing: false }));
      updateStats();
    }
  }, [updateStats]);

  const warmCache = useCallback(
    async (sounds: CustomSound[]) => {
      setCacheState(prev => ({ ...prev, isWarming: true }));

      try {
        await enhancedCacheManager.warmCache(sounds);
      } finally {
        setCacheState(prev => ({ ...prev, isWarming: false }));
        updateStats();
      }
    },
    [updateStats]
  );

  const clearCache = useCallback(async () => {
    await enhancedCacheManager.clear();
    updateStats();
  }, [updateStats]);

  const updatePolicy = useCallback((policy: Partial<CachePolicy>) => {
    enhancedCacheManager.updatePolicy(policy);
  }, []);

  const getCacheEntry = useCallback(async (id: string) => {
    return await enhancedCacheManager.get(id);
  }, []);

  // Update stats periodically
  useEffect(() => {
    updateStats();

    statsInterval.current = setInterval(updateStats, 30000); // Every 30 seconds

    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
    };
  }, [updateStats]);

  return {
    cacheState,
    optimize,
    warmCache,
    clearCache,
    updatePolicy,
    getCacheEntry,
  };
}

/**
 * Hook for monitoring cache performance
 */
export function useCachePerformance() {
  const [performance, setPerformance] = useState({
    hitRate: 0,
    averageAccessTime: 0,
    compressionRatio: 0,
    evictionRate: 0,
    trend: 'stable' as 'improving' | 'stable' | 'degrading',
  });

  const [performanceHistory, setPerformanceHistory] = useState<
    {
      timestamp: Date;
      hitRate: number;
      accessTime: number;
    }[]
  >([]);

  useEffect(() => {
    const updatePerformance = () => {
      const stats = enhancedCacheManager.getStats();

      const newPerformance = {
        hitRate: stats.hitRate / (stats.hitRate + stats.missRate) || 0,
        averageAccessTime: stats.averageAccessTime,
        compressionRatio: stats.compressionRatio,
        evictionRate: stats.evictionCount / Math.max(1, stats.totalEntries),
        trend: 'stable' as 'improving' | 'stable' | 'degrading',
      };

      // Determine trend
      if (performanceHistory.length > 5) {
        const recent = performanceHistory.slice(-3);
        const earlier = performanceHistory.slice(-6, -3);

        const recentHitRate =
          recent.reduce((sum, p) => sum + p.hitRate, 0) / recent.length;
        const earlierHitRate =
          earlier.reduce((sum, p) => sum + p.hitRate, 0) / earlier.length;

        if (recentHitRate > earlierHitRate + 0.05) {
          newPerformance.trend = 'improving';
        } else if (recentHitRate < earlierHitRate - 0.05) {
          newPerformance.trend = 'degrading';
        }
      }

      setPerformance(newPerformance);

      // Update history
      setPerformanceHistory(prev => {
        const newEntry = {
          timestamp: new Date(),
          hitRate: newPerformance.hitRate,
          accessTime: stats.averageAccessTime,
        };

        const updated = [...prev, newEntry];
        return updated.slice(-50); // Keep last 50 entries
      });
    };

    updatePerformance();
    const interval = setInterval(updatePerformance, 60000); // Every minute

    return () => clearInterval(interval);
  }, [performanceHistory]);

  return {
    performance,
    performanceHistory,
  };
}

/**
 * Hook for cache warming strategies
 */
export function useCacheWarming() {
  const [warmingConfig, setWarmingConfig] = useState<CacheWarmingConfig>({
    enabled: true,
    scheduleHours: [6, 7, 8, 18, 19, 20],
    maxWarmingEntries: 50,
    warmingBatchSize: 5,
    priorityCategories: ['nature', 'energetic', 'motivation'],
  });

  const [warmingStatus, setWarmingStatus] = useState({
    isActive: false,
    nextScheduledTime: null as Date | null,
    lastWarmingTime: null as Date | null,
    warmedEntriesCount: 0,
  });

  const updateWarmingConfig = useCallback(
    (updates: Partial<CacheWarmingConfig>) => {
      const newConfig = { ...warmingConfig, ...updates };
      setWarmingConfig(newConfig);
      enhancedCacheManager.updateWarmingConfig(updates);
    },
    [warmingConfig]
  );

  const scheduleWarming = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // Find next scheduled warming time
    const nextHour = warmingConfig.scheduleHours.find(hour => hour > currentHour);
    const targetHour = nextHour ?? warmingConfig.scheduleHours[0];

    const nextTime = new Date();
    if (nextHour) {
      nextTime.setHours(targetHour, 0, 0, 0);
    } else {
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(targetHour, 0, 0, 0);
    }

    setWarmingStatus(prev => ({
      ...prev,
      nextScheduledTime: nextTime,
    }));
  }, [warmingConfig.scheduleHours]);

  const enableSmartWarming = useCallback(() => {
    updateWarmingConfig({
      enabled: true,
      scheduleHours: [6, 7, 8, 18, 19, 20], // Morning and evening
      maxWarmingEntries: 100,
      warmingBatchSize: 10,
    });
  }, [updateWarmingConfig]);

  const enableBatteryOptimizedWarming = useCallback(() => {
    updateWarmingConfig({
      enabled: true,
      scheduleHours: [2, 3], // During low usage hours
      maxWarmingEntries: 25,
      warmingBatchSize: 3,
    });
  }, [updateWarmingConfig]);

  const disableWarming = useCallback(() => {
    updateWarmingConfig({ enabled: false });
  }, [updateWarmingConfig]);

  useEffect(() => {
    if (warmingConfig.enabled) {
      scheduleWarming();

      const interval = setInterval(scheduleWarming, 60 * 60 * 1000); // Check every hour
      return () => clearInterval(interval);
    }
  }, [warmingConfig.enabled, scheduleWarming]);

  return {
    warmingConfig,
    warmingStatus,
    updateWarmingConfig,
    enableSmartWarming,
    enableBatteryOptimizedWarming,
    disableWarming,
  };
}

/**
 * Hook for cache policy management
 */
export function useCachePolicy() {
  const [policy, setPolicy] = useState<CachePolicy>({
    maxSizeBytes: 150 * 1024 * 1024, // 150MB
    maxEntries: 1000,
    ttlSeconds: 7 * 24 * 60 * 60, // 7 days
    evictionStrategy: 'intelligent',
    compressionThreshold: 1024 * 1024, // 1MB
    preloadThreshold: 5,
  });

  const updatePolicy = useCallback(
    (updates: Partial<CachePolicy>) => {
      const newPolicy = { ...policy, ...updates };
      setPolicy(newPolicy);
      enhancedCacheManager.updatePolicy(updates);
    },
    [policy]
  );

  const setConservativePolicy = useCallback(() => {
    updatePolicy({
      maxSizeBytes: 50 * 1024 * 1024, // 50MB
      maxEntries: 300,
      ttlSeconds: 3 * 24 * 60 * 60, // 3 days
      evictionStrategy: 'lru',
      compressionThreshold: 512 * 1024, // 512KB
    });
  }, [updatePolicy]);

  const setAggressivePolicy = useCallback(() => {
    updatePolicy({
      maxSizeBytes: 300 * 1024 * 1024, // 300MB
      maxEntries: 2000,
      ttlSeconds: 14 * 24 * 60 * 60, // 14 days
      evictionStrategy: 'intelligent',
      compressionThreshold: 2 * 1024 * 1024, // 2MB
    });
  }, [updatePolicy]);

  const setBalancedPolicy = useCallback(() => {
    updatePolicy({
      maxSizeBytes: 150 * 1024 * 1024, // 150MB
      maxEntries: 1000,
      ttlSeconds: 7 * 24 * 60 * 60, // 7 days
      evictionStrategy: 'intelligent',
      compressionThreshold: 1024 * 1024, // 1MB
    });
  }, [updatePolicy]);

  return {
    policy,
    updatePolicy,
    setConservativePolicy,
    setAggressivePolicy,
    setBalancedPolicy,
  };
}

/**
 * Hook for automatic cache optimization
 */
export function useAutoOptimization(enabled: boolean = true) {
  const [optimizationStatus, setOptimizationStatus] = useState({
    isEnabled: enabled,
    lastOptimization: null as Date | null,
    optimizationCount: 0,
    averageOptimizationTime: 0,
  });

  const optimizationInterval = useRef<TimeoutHandle>();

  useEffect(() => {
    if (enabled) {
      const runOptimization = async () => {
        const startTime = performance.now();

        try {
          await enhancedCacheManager.optimize();

          const optimizationTime = performance.now() - startTime;

          setOptimizationStatus(prev => ({
            ...prev,
            lastOptimization: new Date(),
            optimizationCount: prev.optimizationCount + 1,
            averageOptimizationTime:
              prev.averageOptimizationTime * 0.8 + optimizationTime * 0.2,
          }));
        } catch (error) {
          console.error('Auto-optimization failed:', error);
        }
      };

      // Run optimization every 30 minutes
      optimizationInterval.current = setInterval(runOptimization, 30 * 60 * 1000);

      return () => {
        if (optimizationInterval.current) {
          clearInterval(optimizationInterval.current);
        }
      };
    }
  }, [enabled]);

  const toggleAutoOptimization = useCallback(() => {
    setOptimizationStatus(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
    }));
  }, []);

  return {
    optimizationStatus,
    toggleAutoOptimization,
  };
}

/**
 * Hook for cache debugging and monitoring
 */
export function useCacheDebugging() {
  const [debugInfo, setDebugInfo] = useState({
    memoryUsage: 0,
    diskUsage: 0,
    hitRate: 0,
    compressionSavings: 0,
    topAccessedEntries: [] as Array<{ id: string; accessCount: number; size: number }>,
    recentEvictions: [] as Array<{ id: string; reason: string; timestamp: Date }>,
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const stats = enhancedCacheManager.getStats();

      setDebugInfo(prev => ({
        ...prev,
        memoryUsage: stats.memoryUsage,
        diskUsage: stats.totalSize,
        hitRate: stats.hitRate / (stats.hitRate + stats.missRate) || 0,
        compressionSavings:
          stats.compressionRatio > 1 ? (1 - 1 / stats.compressionRatio) * 100 : 0,
        // topAccessedEntries and recentEvictions would need additional tracking
      }));
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return debugInfo;
}
