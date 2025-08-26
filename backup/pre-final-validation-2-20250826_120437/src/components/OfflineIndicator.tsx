/// <reference lib="dom" />
import React, { useState, useEffect } from 'react';
import { TimeoutHandle } from '../types/timers';
// Replaced stub import with proper implementation
import {
  Wifi,
  WifiOff,
  CloudOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Zap,
  Activity,
  HardDrive,
  Clock,
  TrendingUp,
  Settings,
  Info,
  X,
} from 'lucide-react';

interface CacheStats {
  performance: {
    hits: number;
    misses: number;
    hitRatio: number;
    lastCleanup: string;
  };
  caches: Record<
    string,
    {
      entries: number;
      totalSize: number;
      utilization: number;
      oldestEntry: string | null;
      newestEntry: string | null;
    }
  >;
}

interface ServiceWorkerStatus {
  version: string;
  isOnline: boolean;
  lastSync: string | null;
  alarmCount: number;
  analyticsQueued: number;
  emotionalQueued: number;
  cacheStats: {
    hits: number;
    misses: number;
    hitRatio: string;
    lastCleanup: string;
  };
  features: Record<string, boolean>;
}

interface OfflineIndicatorProps {
  className?: string;
  showDetailed?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetailed = false,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    'synced' | 'pending' | '_error' | 'offline'
  >('synced');
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch detailed service worker and cache statistics
  const fetchServiceWorkerStats = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        // Get service worker status
        const swResponse = await new Promise<ServiceWorkerStatus>(resolve => {
          const channel = new MessageChannel();
          channel.port1.onmessage = event => resolve(_event.data);
          navigator.serviceWorker.controller!.postMessage({ type: 'GET_STATUS' }, [
            channel.port2,
          ]);
        });
        setSwStatus(swResponse);

        // Get cache statistics
        const cacheResponse = await new Promise<CacheStats>(resolve => {
          const channel = new MessageChannel();
          channel.port1.onmessage = event => resolve(_event.data);
          navigator.serviceWorker.controller!.postMessage({ type: 'GET_CACHE_STATS' }, [
            channel.port2,
          ]);
        });
        setCacheStats(cacheResponse);

        // Get offline storage status (simulated for now)
        setPendingChanges(swResponse.analyticsQueued + swResponse.emotionalQueued);
        // In a real implementation, you would fetch conflicts from EnhancedOfflineStorage
        setConflicts(0);
      } catch (_error) {
        console._error('Failed to fetch SW stats:', _error);
      }
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setSyncStatus('pending');

      // Trigger comprehensive sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'FORCE_SYNC',
        });
      }

      // Fetch updated stats
      await fetchServiceWorkerStats();

      // Set to synced after a delay
      setTimeout(() => setSyncStatus('synced'), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      setSyncStatus('offline');

      // Hide offline message after 5 seconds
      setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
    };

    // Enhanced sync status handler
    const handleSyncStatus = (_event: CustomEvent) => {
      setSyncStatus(_event.detail.status);
      if (_event.detail.pendingChanges !== undefined) {
        setPendingChanges(_event.detail.pendingChanges);
      }
      if (_event.detail.conflicts !== undefined) {
        setConflicts(_event.detail.conflicts);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-status', handleSyncStatus as EventListener);

    // Fetch initial stats
    fetchServiceWorkerStats();

    // Update stats periodically
    const statsInterval = setInterval(() => {
      fetchServiceWorkerStats();
      setLastUpdate(Date.now());
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-status', handleSyncStatus as EventListener);
      clearInterval(statsInterval);
    };
  }, [fetchServiceWorkerStats]);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    switch (syncStatus) {
      case 'synced':
        return conflicts > 0 ? (
          <AlertCircle className="w-4 h-4 text-orange-500" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500" />
        );
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case '_error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-green-500" />;
    }
  };

  const getDetailedStatusIcon = () => {
    if (pendingChanges > 0) return <Database className="w-4 h-4" />;
    if (conflicts > 0) return <AlertCircle className="w-4 h-4" />;
    if (cacheStats && cacheStats.performance.hitRatio > 0.8)
      return <TrendingUp className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return pendingChanges > 0 ? `Offline (${pendingChanges} pending)` : 'Offline';
    }

    switch (syncStatus) {
      case 'synced':
        if (conflicts > 0) return `${conflicts} conflicts`;
        if (pendingChanges > 0) return `${pendingChanges} pending`;
        return 'Synced';
      case 'pending':
        return pendingChanges > 0 ? `Syncing ${pendingChanges}...` : 'Syncing...';
      case 'error':
        return 'Sync Error';
      default:
        return 'Online';
    }
  };

  const getDetailedStatusText = () => {
    const parts = [];

    if (swStatus) {
      if (
        swStatus.cacheStats.hitRatio &&
        parseFloat(swStatus.cacheStats.hitRatio) > 0
      ) {
        parts.push(
          `${Math.round(parseFloat(swStatus.cacheStats.hitRatio) * 100)}% cache hit`
        );
      }
      if (swStatus.alarmCount > 0) {
        parts.push(`${swStatus.alarmCount} alarms`);
      }
    }

    if (cacheStats && Object.keys(cacheStats.caches).length > 0) {
      const totalEntries = Object.values(cacheStats.caches).reduce(
        (sum, cache) => sum + cache.entries,
        0
      );
      parts.push(`${totalEntries} cached items`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Ready';
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-600 dark:text-red-400';
    }

    switch (syncStatus) {
      case 'synced':
        if (conflicts > 0) return 'text-orange-600 dark:text-orange-400';
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case '_error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  };

  const optimizeCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        setSyncStatus('pending');
        const response = await new Promise<{
          success: boolean;
          message: string;
        }>(resolve => {
          const channel = new MessageChannel();
          channel.port1.onmessage = event => resolve(_event.data);
          navigator.serviceWorker.controller!.postMessage({ type: 'OPTIMIZE_CACHE' }, [
            channel.port2,
          ]);
        });

        if (response.success) {
          setSyncStatus('synced');
          await fetchServiceWorkerStats();
        } else {
          setSyncStatus('_error');
        }
      } catch (_error) {
        setSyncStatus('_error');
        console._error('Cache optimization failed:', _error);
      }
    }
  };

  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        setSyncStatus('pending');
        const response = await new Promise<{
          success: boolean;
          message: string;
        }>(resolve => {
          const channel = new MessageChannel();
          channel.port1.onmessage = event => resolve(_event.data);
          navigator.serviceWorker.controller!.postMessage({ type: 'CLEAR_CACHE' }, [
            channel.port2,
          ]);
        });

        if (response.success) {
          setSyncStatus('synced');
          await fetchServiceWorkerStats();
        } else {
          setSyncStatus('_error');
        }
      } catch (_error) {
        setSyncStatus('_error');
        console._error('Cache clearing failed:', _error);
      }
    }
  };

  return (
    <>
      {/* Main status indicator */}
      <div
        className={`flex items-center gap-1 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={`Connection status: ${getStatusText()}`}
      >
        <span aria-hidden="true">{getStatusIcon()}</span>
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {showDetailed && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            aria-label="Toggle detailed status"
          >
            <Info className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Detailed status panel */}
      {showDetailed && showDetails && (
        <div className="fixed top-16 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {getDetailedStatusIcon()}
              Offline Status
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Connection Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Connection
              </span>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className={`text-xs ${getStatusColor()}`}>{getStatusText()}</span>
              </div>
            </div>
            {swStatus && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Version {swStatus.version} • {getDetailedStatusText()}
              </div>
            )}
          </div>

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                Cache Performance
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Hit Ratio:</span>
                  <span
                    className={`font-medium ${
                      cacheStats.performance.hitRatio > 0.8
                        ? 'text-green-600 dark:text-green-400'
                        : cacheStats.performance.hitRatio > 0.5
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {Math.round(cacheStats.performance.hitRatio * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cache Hits:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {cacheStats.performance.hits}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Last Cleanup:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatTimeAgo(cacheStats.performance.lastCleanup)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cache Details */}
          {cacheStats && Object.keys(cacheStats.caches).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cache Usage
              </h4>
              <div className="space-y-1">
                {Object.entries(cacheStats.caches).map(([name, cache]) => (
                  <div key={name} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {name.toLowerCase()}
                    </span>
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-gray-100">
                        {cache.entries} items
                      </div>
                      <div className="text-gray-500 dark:text-gray-500">
                        {formatBytes(cache.totalSize)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Status */}
          {(pendingChanges > 0 || conflicts > 0) && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Sync Status
              </h4>
              <div className="space-y-1 text-xs">
                {pendingChanges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Pending Changes:
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      {pendingChanges}
                    </span>
                  </div>
                )}
                {conflicts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Conflicts:</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {conflicts}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={optimizeCache}
              disabled={syncStatus === 'pending'}
              className="flex-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Optimize
            </button>
            <button
              onClick={clearCache}
              disabled={syncStatus === 'pending'}
              className="flex-1 px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Cache
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 text-center">
            Last updated: {formatTimeAgo(new Date(lastUpdate).toISOString())}
          </div>
        </div>
      )}

      {/* Offline message banner */}
      {showOfflineMessage && (
        <div
          className="fixed top-0 left-0 right-0 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2 z-50"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center gap-2 text-sm">
            <WifiOff
              className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
              aria-hidden="true"
            />
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              You're offline.{' '}
              {pendingChanges > 0
                ? `${pendingChanges} changes pending.`
                : 'Alarms will still work!'}
            </span>
          </div>
        </div>
      )}

      {/* Sync _error message */}
      {syncStatus === 'error' && isOnline && (
        <div
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 z-40"
          role="alert"
          aria-live="assertive"
          aria-labelledby="sync-_error-title"
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h4
                id="sync-_error-title"
                className="text-sm font-medium text-red-800 dark:text-red-200"
              >
                Sync Failed
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Unable to sync your data.{' '}
                {pendingChanges > 0 && `${pendingChanges} changes pending.`} Will retry
                automatically.
              </p>
              <button
                onClick={fetchServiceWorkerStats}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
              >
                Retry now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts notification */}
      {conflicts > 0 && (
        <div
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg px-4 py-3 z-40"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Data Conflicts Detected
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                {conflicts} conflicts need resolution. Review in settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
