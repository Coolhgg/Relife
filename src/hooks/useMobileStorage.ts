/**
 * Custom hook for mobile storage operations
 * Provides a clean interface for components to interact with mobile storage services
 */

import { useState } from 'react';
import { MobileStorageService } from '../services/mobile-storage';
import { UnifiedStorageService } from '../services/unified-storage';
import type { Alarm } from '../types/domain';

export function useMobileStorage() {
  const [mobileStorage] = useState(() => MobileStorageService.getInstance());
  const [unifiedStorage] = useState(() => UnifiedStorageService.getInstance());

  return {
    // Mobile-optimized operations
    saveAlarmOptimized: (alarm: Alarm) => mobileStorage.saveAlarmOptimized(alarm),
    getAlarmsWithFallback: () => mobileStorage.getEnabledAlarmsWithFallback(),

    // Storage management
    getStorageInfo: () => mobileStorage.getMobileStorageInfo(),
    performMaintenance: () => unifiedStorage.performMaintenance(),
    checkHealth: () => unifiedStorage.checkStorageHealth(),

    // Cache operations
    clearCache: (tags?: string[]) => unifiedStorage.clearCache(tags),
    setCache: <T,>(key: string, data: T, ttl?: number, tags?: string[]) =>
      unifiedStorage.setCache(key, data, ttl, tags),
    getCache: <T,>(key: string) => unifiedStorage.getCache<T>(key),

    // Native storage integration
    getCriticalAlarms: () => mobileStorage.getCriticalAlarmsFromNative(),

    // Configuration
    updateConfig: (config: any) => mobileStorage.updateConfig(config),
  };
}