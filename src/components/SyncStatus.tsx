import React, { useState, useEffect } from 'react';
import { TimeoutHandle } from '../types/timers';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CloudOff,
  Cloud,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  OfflineManager,
  type SyncStatus as SyncStatusType,
  type OfflineCapabilities,
} from '../services/offline-manager';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({
  className = '',
  showDetails = false,
}) => {
  const [status, setStatus] = useState<SyncStatusType>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: 0,
    failedOperations: 0,
    syncInProgress: false,
  });

  const [capabilities, setCapabilities] = useState<OfflineCapabilities>({
    alarmProcessing: false,
    voicePlayback: false,
    dataStorage: false,
    backgroundSync: false,
    serviceWorker: false,
  });

  const [expanded, setExpanded] = useState(false);
  const [syncAnimation, setSyncAnimation] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const newStatus = await OfflineManager.getStatus();
      const newCapabilities = OfflineManager.getCapabilities();

      setStatus(newStatus);
      setCapabilities(newCapabilities);
    };

    // Initial load
    updateStatus();

    // Set up listeners
    const handleOnline = () => {
      setStatus((prev: any) => ({ // auto: implicit any{ ...prev, isOnline: true }));
      triggerSyncAnimation();
    };

    const handleOffline = () => {
      setStatus((prev: any) => ({ // auto: implicit any{ ...prev, isOnline: false }));
    };

    OfflineManager.addOnlineListener(handleOnline);
    OfflineManager.addOfflineListener(handleOffline);

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => {
      OfflineManager.removeOnlineListener(handleOnline);
      OfflineManager.removeOfflineListener(handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSyncAnimation = () => {
    setSyncAnimation(true);
    setTimeout(() => setSyncAnimation(false), 2000);
  };

  const handleManualSync = async () => {
    triggerSyncAnimation();
    try {
      await OfflineManager.syncPendingOperations();
      const newStatus = await OfflineManager.getStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-400" />;
    }

    if (status.syncInProgress || syncAnimation) {
      return (
        <RefreshCw
          className={`w-4 h-4 text-blue-400 ${syncAnimation ? 'animate-spin' : ''}`}
        />
      );
    }

    if (status.pendingOperations > 0) {
      return <Clock className="w-4 h-4 text-yellow-400" />;
    }

    if (status.failedOperations > 0) {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-400" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (status.syncInProgress || syncAnimation) return 'Syncing...';
    if (status.pendingOperations > 0) return `${status.pendingOperations} pending`;
    if (status.failedOperations > 0) return `${status.failedOperations} failed`;
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-400';
    if (status.syncInProgress || syncAnimation) return 'text-blue-400';
    if (status.pendingOperations > 0) return 'text-yellow-400';
    if (status.failedOperations > 0) return 'text-red-400';
    return 'text-green-400';
  };

  if (!showDetails) {
    // Compact status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
        {status.isOnline &&
          (status.pendingOperations > 0 || status.failedOperations > 0) && (
            <button
              onClick={handleManualSync}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Sync now"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
      </div>
    );
  }

  return (
    <div className={`bg-white/5 rounded-lg border border-white/10 ${className}`}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <div className="text-white font-medium">
                {status.isOnline ? 'Online' : 'Offline Mode'}
              </div>
              <div className={`text-sm ${getStatusColor()}`}>{getStatusText()}</div>
              <div className={`text-sm ${getStatusColor()}`}>{getStatusText()}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status.isOnline && (
              <button
                onClick={(e: any) => { // auto: implicit any
                  e.stopPropagation();
                  handleManualSync();
                }}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Sync now"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncAnimation ? 'animate-spin' : ''}`}
                />
              </button>
            )}
            <div
              className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          {/* Sync Status Details */}
          <div>
            <h4 className="text-white font-medium mb-2">Sync Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Connection</span>
                <span className={status.isOnline ? 'text-green-400' : 'text-red-400'}>
                  {status.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {status.pendingOperations > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/70">Pending Operations</span>
                  <span className="text-yellow-400">{status.pendingOperations}</span>
                </div>
              )}

              {status.failedOperations > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/70">Failed Operations</span>
                  <span className="text-red-400">{status.failedOperations}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-white/70">Last Sync</span>
                <span className="text-white">
                  {status.lastSync ? status.lastSync.toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Offline Capabilities */}
          <div>
            <h4 className="text-white font-medium mb-2">Offline Capabilities</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`flex items-center gap-2 p-2 rounded ${
                  capabilities.alarmProcessing
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {capabilities.alarmProcessing ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Alarm Processing
              </div>

              <div
                className={`flex items-center gap-2 p-2 rounded ${
                  capabilities.voicePlayback
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {capabilities.voicePlayback ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Voice Playback
              </div>

              <div
                className={`flex items-center gap-2 p-2 rounded ${
                  capabilities.dataStorage
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {capabilities.dataStorage ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Data Storage
              </div>

              <div
                className={`flex items-center gap-2 p-2 rounded ${
                  capabilities.backgroundSync
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {capabilities.backgroundSync ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Background Sync
              </div>
            </div>
          </div>

          {/* Offline Mode Info */}
          {!status.isOnline && (
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CloudOff className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <div className="text-blue-400 font-medium mb-1">
                    Offline Mode Active
                  </div>
                  <div className="text-white/80">
                    Your alarms will continue to work. Changes will sync when you're
                    back online.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
