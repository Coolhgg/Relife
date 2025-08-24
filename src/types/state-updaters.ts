/**
 * Utility types for type-safe state updaters
 * These types help ensure proper typing for React useState setters
 */

/**
 * Generic state updater type
 * Used for complex state objects that need proper typing
 */
export type StateUpdater<T> = (prev: T) => T;

/**
 * Array state updater type
 * Used for state that manages arrays
 */
export type ArrayStateUpdater<T> = (prev: T[]) => T[];

/**
 * Object state updater type
 * Used for state that manages objects with spread updates
 */
export type ObjectStateUpdater<T extends Record<string, any>> = (prev: T) => T;

/**
 * Performance history entry type for preloading hooks
 */
export interface PerformanceHistoryEntry {
  timestamp: number;
  duration: number;
  success: boolean;
  assetCount: number;
  cacheHitRate: number;
}

/**
 * Preloading status interface
 */
export interface PreloadingStatus {
  isPreloading: boolean;
  preloadedCount: number;
  totalToPreload: number;
  errors: string[];
}

/**
 * Audio loading error interface
 */
export interface AudioLoadingError {
  soundId: string;
  _error: string;
}

/**
 * Cache debug info interface
 */
export interface CacheDebugInfo {
  memoryUsage: number;
  diskUsage: number;
  hitRate: number;
  compressionSavings: number;
  topAccessedEntries: Array<{
    id: string;
    accessCount: number;
    size: number;
  }>;
  recentEvictions: Array<{
    id: string;
    evictedAt: Date;
    reason: string;
  }>;
  cacheErrors: Array<{ timestamp: Date; _error: string; category: string }>;
}

/**
 * Cache warming status interface
 */
export interface WarmingStatus {
  isActive: boolean;
  nextScheduledTime: Date | null;
  lastWarmingTime: Date | null;
  warmedEntriesCount: number;
}

/**
 * Optimization status interface
 */
export interface OptimizationStatus {
  isEnabled: boolean;
  lastOptimization: Date | null;
  optimizationCount: number;
  averageOptimizationTime: number;
}

/**
 * Cache debug info interface
 */
export interface CacheDebugInfo {
  memoryUsage: number;
  diskUsage: number;
  hitRate: number;
  compressionSavings: number;
  topAccessedEntries: Array<{
    id: string;
    accessCount: number;
  }>;
}

/**
 * Cache performance history entry interface
 */
export interface CachePerformanceHistoryEntry {
  timestamp: Date;
  hitRate: number;
  accessTime: number;
}
