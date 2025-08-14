import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error' | 'offline'>('synced');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setSyncStatus('synced');
      
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_ALARMS'
        });
      }
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

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker sync status
    const handleSyncStatus = (event: CustomEvent) => {
      setSyncStatus(event.detail.status);
    };

    window.addEventListener('sync-status', handleSyncStatus as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-status', handleSyncStatus as EventListener);
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <CloudOff className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'pending':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      default:
        return 'Online';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-600 dark:text-red-400';
    }

    switch (syncStatus) {
      case 'synced':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <>
      {/* Status indicator (always visible in header) */}
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
      </div>

      {/* Offline message banner */}
      {showOfflineMessage && (
        <div 
          className="fixed top-0 left-0 right-0 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2 z-50 animate-slide-down"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center gap-2 text-sm">
            <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              You're offline. Alarms will still work!
            </span>
          </div>
        </div>
      )}

      {/* Sync error message */}
      {syncStatus === 'error' && isOnline && (
        <div 
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 z-40 animate-slide-up"
          role="alert"
          aria-live="assertive"
          aria-labelledby="sync-error-title"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 
                id="sync-error-title"
                className="text-sm font-medium text-red-800 dark:text-red-200"
              >
                Sync Failed
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Unable to sync your alarms. They'll sync when connection improves.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;