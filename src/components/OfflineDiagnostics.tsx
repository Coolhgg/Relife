import React, { useState, useEffect } from 'react';
import {
  Activity,
  Alert,
  CheckCircle,
  Database,
  HardDrive,
  RefreshCw,
  Settings,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import OfflineGamingService from '../services/offline-gaming';
import OfflineAnalyticsService from '../services/offline-analytics';
import OfflineSleepTracker from '../services/offline-sleep-tracker';
import { TimeoutHandle } from '../types/timers';

interface DiagnosticCheck {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  details?: Record<string, any>;
  lastChecked: Date;
}

interface OfflineDiagnosticsProps {
  className?: string;
}

const OfflineDiagnostics: React.FC<OfflineDiagnosticsProps> = ({ className = '' }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'error'>(
    'healthy'
  );

  const runDiagnostics = async () => {
    setIsRunning(true);
    const checks: DiagnosticCheck[] = [];

    try {
      // Check service worker
      const swCheck = await checkServiceWorker();
      checks.push(swCheck);

      // Check cache health
      const cacheCheck = await checkCacheHealth();
      checks.push(cacheCheck);

      // Check IndexedDB
      const dbCheck = await checkIndexedDB();
      checks.push(dbCheck);

      // Check offline services
      const gamingCheck = await checkGamingService();
      checks.push(gamingCheck);

      const analyticsCheck = await checkAnalyticsService();
      checks.push(analyticsCheck);

      const sleepCheck = await checkSleepService();
      checks.push(sleepCheck);

      // Check network connectivity
      const networkCheck = checkNetworkConnectivity();
      checks.push(networkCheck);

      // Check storage quota
      const storageCheck = await checkStorageQuota();
      checks.push(storageCheck);

      setDiagnostics(checks);
      setLastCheck(new Date());

      // Calculate overall health
      const errorCount = checks.filter(c => c.status === 'error').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;

      if (errorCount > 0) {
        setOverallHealth('error');
      } else if (warningCount > 0) {
        setOverallHealth('warning');
      } else {
        setOverallHealth('healthy');
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const checkServiceWorker = async (): Promise<DiagnosticCheck> => {
    try {
      if (!('serviceWorker' in navigator)) {
        return {
          id: 'service-worker',
          name: 'Service Worker',
          status: 'error',
          message: 'Service Worker not supported',
          lastChecked: new Date(),
        };
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return {
          id: 'service-worker',
          name: 'Service Worker',
          status: 'error',
          message: 'Service Worker not registered',
          lastChecked: new Date(),
        };
      }

      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        return {
          id: 'service-worker',
          name: 'Service Worker',
          status: 'warning',
          message: 'Service Worker registered but not controlling',
          lastChecked: new Date(),
        };
      }

      // Try to get service worker status
      try {
        const status = await new Promise<any>(resolve => {
          const channel = new MessageChannel();
          channel.port1.onmessage = event => resolve(event.data);
          controller.postMessage({ type: 'GET_STATUS' }, [channel.port2]);
          setTimeout(() => resolve({ error: 'timeout' }), 5000);
        });

        if (status.error) {
          return {
            id: 'service-worker',
            name: 'Service Worker',
            status: 'warning',
            message: 'Service Worker not responding to messages',
            lastChecked: new Date(),
          };
        }

        return {
          id: 'service-worker',
          name: 'Service Worker',
          status: 'healthy',
          message: `Active and responding (v${status.version || 'unknown'})`,
          details: status,
          lastChecked: new Date(),
        };
      } catch (error) {
        return {
          id: 'service-worker',
          name: 'Service Worker',
          status: 'warning',
          message: 'Service Worker communication error',
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      return {
        id: 'service-worker',
        name: 'Service Worker',
        status: 'error',
        message: `Service Worker check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const checkCacheHealth = async (): Promise<DiagnosticCheck> => {
    try {
      if (!('caches' in window)) {
        return {
          id: 'cache',
          name: 'Cache API',
          status: 'error',
          message: 'Cache API not supported',
          lastChecked: new Date(),
        };
      }

      const cacheNames = await caches.keys();
      if (cacheNames.length === 0) {
        return {
          id: 'cache',
          name: 'Cache Storage',
          status: 'warning',
          message: 'No caches found',
          lastChecked: new Date(),
        };
      }

      // Check cache sizes
      let totalSize = 0;
      let totalEntries = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalEntries += requests.length;

        // Estimate size (rough calculation)
        for (const request of requests.slice(0, 5)) {
          // Sample first 5 entries
          try {
            const response = await cache.match(request);
            if (response) {
              const size = parseInt(
                response.headers.get('content-length') || '1024',
                10
              );
              totalSize += size;
            }
          } catch (error) {
            // Ignore individual errors
          }
        }
      }

      return {
        id: 'cache',
        name: 'Cache Storage',
        status: 'healthy',
        message: `${cacheNames.length} caches with ${totalEntries} entries`,
        details: {
          cacheCount: cacheNames.length,
          totalEntries,
          estimatedSize: totalSize,
          cacheNames,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        id: 'cache',
        name: 'Cache Storage',
        status: 'error',
        message: `Cache check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const checkIndexedDB = async (): Promise<DiagnosticCheck> => {
    try {
      if (!('indexedDB' in window)) {
        return {
          id: 'indexeddb',
          name: 'IndexedDB',
          status: 'error',
          message: 'IndexedDB not supported',
          lastChecked: new Date(),
        };
      }

      // Try to open a test database
      const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('RelifeOfflineDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
          // Database will be created if it doesn't exist
        };
      });

      const objectStoreNames = Array.from(testDB.objectStoreNames);
      testDB.close();

      return {
        id: 'indexeddb',
        name: 'IndexedDB',
        status: 'healthy',
        message: `Accessible with ${objectStoreNames.length} stores`,
        details: {
          storeNames: objectStoreNames,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        id: 'indexeddb',
        name: 'IndexedDB',
        status: 'error',
        message: `IndexedDB check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const checkGamingService = async (): Promise<DiagnosticCheck> => {
    try {
      const gamingService = OfflineGamingService.getInstance();
      const stats = gamingService.getOfflineStats();

      const status = stats.pendingActions > 100 ? 'warning' : 'healthy';
      const message = `${stats.battles} battles, ${stats.pendingActions} pending actions`;

      return {
        id: 'gaming',
        name: 'Gaming Service',
        status,
        message,
        details: stats,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        id: 'gaming',
        name: 'Gaming Service',
        status: 'error',
        message: `Gaming service check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const checkAnalyticsService = async (): Promise<DiagnosticCheck> => {
    try {
      const analyticsService = OfflineAnalyticsService.getInstance();
      const stats = analyticsService.getAnalyticsStats();

      const status = stats.queuedEvents > 500 ? 'warning' : 'healthy';
      const message = `${stats.queuedEvents} queued events, session ${stats.sessionDuration}ms`;

      return {
        id: 'analytics',
        name: 'Analytics Service',
        status,
        message,
        details: stats,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        id: 'analytics',
        name: 'Analytics Service',
        status: 'error',
        message: `Analytics service check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const checkSleepService = async (): Promise<DiagnosticCheck> => {
    try {
      const sleepService = OfflineSleepTracker.getInstance();
      const stats = sleepService.getTrackingStats();

      const status = stats.unsyncedSessions > 50 ? 'warning' : 'healthy';
      const message = `${stats.totalSessions} sessions, ${stats.unsyncedSessions} unsynced`;

      return {
        id: 'sleep',
        name: 'Sleep Tracker',
        status,
        message,
        details: stats,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        id: 'sleep',
        name: 'Sleep Tracker',
        status: 'error',
        message: `Sleep service check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const checkNetworkConnectivity = (): DiagnosticCheck => {
    const isOnline = navigator.onLine;
    return {
      id: 'network',
      name: 'Network Connectivity',
      status: isOnline ? 'healthy' : 'warning',
      message: isOnline ? 'Online' : 'Offline - sync will resume when connected',
      details: {
        isOnline,
        connection: (navigator as any).connection,
      },
      lastChecked: new Date(),
    };
  };

  const checkStorageQuota = async (): Promise<DiagnosticCheck> => {
    try {
      if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
        return {
          id: 'storage',
          name: 'Storage Quota',
          status: 'warning',
          message: 'Storage quota API not available',
          lastChecked: new Date(),
        };
      }

      const estimate = await navigator.storage.estimate();
      const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      const usagePercent = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0;

      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (usagePercent > 90) status = 'error';
      else if (usagePercent > 70) status = 'warning';

      return {
        id: 'storage',
        name: 'Storage Quota',
        status,
        message: `${usedMB}MB used of ${quotaMB}MB (${usagePercent}%)`,
        details: {
          usedBytes: estimate.usage,
          quotaBytes: estimate.quota,
          usagePercent,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        id: 'storage',
        name: 'Storage Quota',
        status: 'error',
        message: `Storage quota check failed: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Alert className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <Alert className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'checking':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  useEffect(() => {
    // Run initial diagnostics
    runDiagnostics();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Offline Health Diagnostics</CardTitle>
            <Badge
              variant={
                overallHealth === 'healthy'
                  ? 'default'
                  : overallHealth === 'warning'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {overallHealth.toUpperCase()}
            </Badge>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Checking...' : 'Run Diagnostics'}
          </Button>
        </div>
        {lastCheck && (
          <p className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleString()}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {diagnostics.map(($1) => {
        // TODO(manual): implement
        return null;
      })
          <div key={check.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 mt-1">{getStatusIcon(check.status)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{check.name}</h4>
                <span className={`text-xs font-medium ${getStatusColor(check.status)}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-1">{check.message}</p>

              {check.details && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    View Details
                  </summary>
                  <pre className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(check.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}

        {diagnostics.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No diagnostics data available</p>
            <Button onClick={runDiagnostics} className="mt-2" size="sm">
              Run Initial Check
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineDiagnostics;
