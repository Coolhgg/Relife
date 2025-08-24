/// <reference types="node" />
import { useState, useEffect, useCallback, useRef } from 'react';
import { criticalPreloader } from '../services/critical-preloader';
import type { Alarm } from '../types';
import { TimeoutHandle } from '../types/timers';
import type { PerformanceHistoryEntry } from '../types/state-updaters';
import type {
  CriticalAsset,
  PreloadStats,
  PreloadStrategy,
} from '../services/critical-preloader';

export interface CriticalPreloadingState {
  isAnalyzing: boolean;
  isPreloading: boolean;
  criticalAssets: CriticalAsset[];
  stats: PreloadStats;
  readinessStatus: Map<
    string,
    {
      ttsReady: boolean;
      audioReady: boolean;
      fallbackReady: boolean;
      overallReady: boolean;
    }
  >;
}

/**
 * Main hook for critical asset preloading
 */
export function useCriticalPreloading(alarms: Alarm[]): CriticalPreloadingState {
  const [state, setState] = useState<CriticalPreloadingState>({
    isAnalyzing: false,
    isPreloading: false,
    criticalAssets: [],
    stats: criticalPreloader.getStats(),
    readinessStatus: new Map(),
  });

  const statsUpdateInterval = useRef<TimeoutHandle>();
  const lastAnalysis = useRef<Date>();

  const analyzeAndPreload = useCallback(async () => {
    if (state.isAnalyzing) return;

    setState((prev: CriticalPreloadingState) => ({ ...prev, isAnalyzing: true }));

    try {
      const criticalAssets = await criticalPreloader.analyzeCriticalAssets(alarms);

      // Verify readiness for all alarms
      const readinessStatus = new Map();
      for (const alarm of alarms) {
        if (alarm.enabled) {
          const status = await criticalPreloader.verifyCriticalAssets(alarm.id);
          readinessStatus.set(alarm.id, status);
        }
      }

      setState((prev: CriticalPreloadingState) => ({
        ...prev,
        criticalAssets,
        readinessStatus,
        isAnalyzing: false,
      }));

      lastAnalysis.current = new Date();
    } catch (error) {
      console.error('Error analyzing critical assets:', error);

      setState((prev: CriticalPreloadingState) => ({ ...prev, isAnalyzing: false }));
    }
  }, [alarms, state.isAnalyzing]);

  const updateStats = useCallback(() => {
    const stats = criticalPreloader.getStats();

    setState((prev: CriticalPreloadingState) => ({ ...prev, stats }));
  }, []);

  // Initial analysis and periodic re-analysis
  useEffect(() => {
    const shouldAnalyze =
      !lastAnalysis.current ||
      new Date().getTime() - lastAnalysis.current.getTime() > 5 * 60 * 1000; // 5 minutes

    if (shouldAnalyze && alarms.length > 0) {
      analyzeAndPreload();
    }
  }, [alarms, analyzeAndPreload]);

  // Start stats monitoring
  useEffect(() => {
    statsUpdateInterval.current = setInterval(updateStats, 10000); // Every 10 seconds

    return () => {
      if (statsUpdateInterval.current) {
        clearInterval(statsUpdateInterval.current);
      }
    };
  }, [updateStats]);

  return state;
}

/**
 * Hook for monitoring individual alarm readiness
 */
export function useAlarmReadiness(alarmId: string, enabled: boolean = true) {
  const [readiness, setReadiness] = useState({
    ttsReady: false,
    audioReady: false,
    fallbackReady: true,
    overallReady: false,
    lastChecked: null as Date | null,
  });

  const checkReadiness = useCallback(async () => {
    if (!enabled) return;

    try {
      const status = await criticalPreloader.verifyCriticalAssets(alarmId);
      setReadiness({
        ...status,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error(`Error checking readiness for alarm ${alarmId}:`, error);
    }
  }, [alarmId, enabled]);

  useEffect(() => {
    if (enabled) {
      checkReadiness();

      // Check readiness every 30 seconds
      const interval = setInterval(checkReadiness, 30000);
      return () => clearInterval(interval);
    }
  }, [enabled, checkReadiness]);

  return readiness;
}

/**
 * Hook for emergency preloading
 */
export function useEmergencyPreloading() {
  const [isEmergencyPreloading, setIsEmergencyPreloading] = useState(false);

  const triggerEmergencyPreload = useCallback(
    async (alarmIds: string[]) => {
      if (isEmergencyPreloading) return;

      setIsEmergencyPreloading(true);

      try {
        await criticalPreloader.emergencyPreload(alarmIds);
      } catch (error) {
        console.error('Emergency preload failed:', error);
      } finally {
        setIsEmergencyPreloading(false);
      }
    },
    [isEmergencyPreloading]
  );

  return {
    isEmergencyPreloading,
    triggerEmergencyPreload,
  };
}

/**
 * Hook for managing preload strategy
 */
export function usePreloadStrategy() {
  const [currentStrategy, setCurrentStrategy] = useState<PreloadStrategy>({
    name: 'balanced',
    description: 'Balanced preloading strategy',
    preloadWindow: 15,
    batchSize: 3,
    retryAttempts: 3,
    priorityThreshold: 5,
  });

  const updateStrategy = useCallback(
    (updates: Partial<PreloadStrategy>) => {
      const newStrategy = { ...currentStrategy, ...updates };
      setCurrentStrategy(newStrategy);
      criticalPreloader.updateStrategy(updates);
    },
    [currentStrategy]
  );

  const setQuickStrategy = useCallback(() => {
    updateStrategy({
      name: 'aggressive',
      description: 'Aggressive preloading for instant response',
      preloadWindow: 30,
      batchSize: 5,
      retryAttempts: 5,
      priorityThreshold: 3,
    });
  }, [updateStrategy]);

  const setBatteryOptimizedStrategy = useCallback(() => {
    updateStrategy({
      name: 'battery-optimized',
      description: 'Conservative preloading to save battery',
      preloadWindow: 5,
      batchSize: 1,
      retryAttempts: 2,
      priorityThreshold: 8,
    });
  }, [updateStrategy]);

  const setBalancedStrategy = useCallback(() => {
    updateStrategy({
      name: 'balanced',
      description: 'Balanced preloading strategy',
      preloadWindow: 15,
      batchSize: 3,
      retryAttempts: 3,
      priorityThreshold: 5,
    });
  }, [updateStrategy]);

  return {
    currentStrategy,
    updateStrategy,
    setQuickStrategy,
    setBatteryOptimizedStrategy,
    setBalancedStrategy,
  };
}

/**
 * Hook for monitoring critical asset status
 */
export function useCriticalAssetStatus() {
  const [assetStatus, setAssetStatus] = useState<
    Array<{
      id: string;
      type: string;
      alarmId: string;
      priority: number;
      isLoaded: boolean;
      timeUntilTrigger: number;
      timeUntilPreload: number;
    }>
  >([]);

  useEffect(() => {
    const updateStatus = () => {
      const status = criticalPreloader.getCriticalAssetsStatus();
      setAssetStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return assetStatus;
}

/**
 * Hook for preload performance monitoring
 */
export function usePreloadPerformance() {
  const [performance, setPerformance] = useState({
    successRate: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    recentFailures: 0,
    trend: 'stable' as 'improving' | 'stable' | 'degrading',
  });

  const [performanceHistory, setPerformanceHistory] = useState<
    {
      timestamp: Date;
      successRate: number;
      avgLoadTime: number;
    }[]
  >([]);

  useEffect(() => {
    const updatePerformance = () => {
      const stats = criticalPreloader.getStats();

      const newPerformance = {
        successRate: stats.successRate,
        averageLoadTime: stats.averageLoadTime,
        cacheHitRate: stats.cacheHitRate,
        memoryUsage: stats.memoryUsage,
        recentFailures: stats.failedAssets,
        trend: 'stable' as 'improving' | 'stable' | 'degrading',
      };

      // Determine trend
      if (performanceHistory.length > 5) {
        const recent = performanceHistory.slice(-3);
        const earlier = performanceHistory.slice(-6, -3);

        const recentAvg =
          recent.reduce((sum, p) => sum + p.successRate, 0) / recent.length;
        const earlierAvg =
          earlier.reduce((sum, p) => sum + p.successRate, 0) / earlier.length;

        if (recentAvg > earlierAvg + 0.1) {
          newPerformance.trend = 'improving';
        } else if (recentAvg < earlierAvg - 0.1) {
          newPerformance.trend = 'degrading';
        }
      }

      setPerformance(newPerformance);

      // Update history
      setPerformanceHistory((prev: PerformanceHistoryEntry[]) => {
        const newEntry = {
          timestamp: new Date(),
          successRate: stats.successRate,
          avgLoadTime: stats.averageLoadTime,
        };

        const updated = [...prev, newEntry];
        return updated.slice(-20); // Keep last 20 entries
      });
    };

    updatePerformance();
    const interval = setInterval(updatePerformance, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [performanceHistory]);

  return {
    performance,
    performanceHistory,
  };
}

/**
 * Hook for debugging critical preloading
 */
export function usePreloadDebugging() {
  const [debugInfo, setDebugInfo] = useState({
    queueSize: 0,
    activeLoads: 0,
    lastError: null as string | null,
    criticalAssetsCount: 0,
    nextPreloadTime: null as Date | null,
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const stats = criticalPreloader.getStats();
      const assetStatus = criticalPreloader.getCriticalAssetsStatus();

      const nextAsset = assetStatus
        .filter(asset => !asset.isLoaded && asset.timeUntilPreload > 0)
        .sort((a, b) => a.timeUntilPreload - b.timeUntilPreload)[0];

      setDebugInfo({
        queueSize: stats.totalAssets,
        activeLoads: 0, // This would need to be exposed from the preloader
        lastError: null, // This would need error tracking
        criticalAssetsCount: assetStatus.length,
        nextPreloadTime: nextAsset
          ? new Date(Date.now() + nextAsset.timeUntilPreload * 60000)
          : null,
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return debugInfo;
}
