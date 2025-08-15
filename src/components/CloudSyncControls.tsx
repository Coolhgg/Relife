import React, { useState, useEffect } from 'react';
import { CloudSyncStatus } from '../services/CloudSyncService';
import useTheme from '../hooks/useTheme';

interface CloudSyncControlsProps {
  className?: string;
}

export function CloudSyncControls({ className = '' }: CloudSyncControlsProps) {
  const { 
    cloudSyncStatus, 
    enableCloudSync, 
    forceCloudSync, 
    resetCloudData,
    onCloudSyncStatusChange 
  } = useTheme();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = onCloudSyncStatusChange((status: CloudSyncStatus) => {
      setIsSyncing(status.isSyncing);
      setLastSyncTime(status.lastSyncTime);
    });

    return unsubscribe;
  }, [onCloudSyncStatusChange]);

  const handleToggleCloudSync = async () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    enableCloudSync(newEnabled);
  };

  const handleForceSync = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      await forceCloudSync();
    } catch (error) {
      console.error('Failed to force sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetCloudData = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    try {
      setIsSyncing(true);
      await resetCloudData();
      setIsEnabled(false);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Failed to reset cloud data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = (time: Date | null) => {
    if (!time) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const getStatusColor = () => {
    if (cloudSyncStatus.error) return 'text-red-500';
    if (cloudSyncStatus.hasConflicts) return 'text-yellow-500';
    if (!cloudSyncStatus.isOnline) return 'text-gray-500';
    if (isEnabled && cloudSyncStatus.isOnline) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (cloudSyncStatus.error) return 'Sync Error';
    if (cloudSyncStatus.hasConflicts) return 'Conflicts Need Resolution';
    if (!cloudSyncStatus.isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (!isEnabled) return 'Disabled';
    return 'Synced';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cloud Sync Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary">Cloud Sync</h3>
          <p className="text-sm text-text-secondary">
            Sync your theme preferences across all devices
          </p>
        </div>
        <button
          onClick={handleToggleCloudSync}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled 
              ? 'bg-primary-500 hover:bg-primary-600' 
              : 'bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500'
          }`}
          disabled={isSyncing}
          aria-label={`${isEnabled ? 'Disable' : 'Enable'} cloud sync`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Sync Status */}
          <div className="rounded-lg border border-border-primary bg-background-secondary p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                  <div className={`h-2 w-2 rounded-full ${
                    isSyncing 
                      ? 'animate-pulse bg-primary-500' 
                      : cloudSyncStatus.isOnline && isEnabled 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium">
                    {getStatusText()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleForceSync}
                disabled={isSyncing || !cloudSyncStatus.isOnline}
                className="inline-flex items-center space-x-1 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Force sync now"
              >
                <svg
                  className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Sync Now</span>
              </button>
            </div>
            
            <div className="mt-2 space-y-1 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span>{formatLastSyncTime(lastSyncTime)}</span>
              </div>
              {cloudSyncStatus.pendingChanges > 0 && (
                <div className="flex justify-between">
                  <span>Pending Changes:</span>
                  <span className="text-yellow-600">{cloudSyncStatus.pendingChanges}</span>
                </div>
              )}
            </div>
            
            {cloudSyncStatus.error && (
              <div className="mt-2 rounded-md bg-red-50 p-2 dark:bg-red-900/20">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {cloudSyncStatus.error}
                </p>
              </div>
            )}
            
            {cloudSyncStatus.hasConflicts && (
              <div className="mt-2 rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Theme conflicts detected. Manual resolution required.
                </p>
                <button className="mt-1 text-xs underline hover:no-underline">
                  Resolve Conflicts
                </button>
              </div>
            )}
          </div>

          {/* Sync Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-primary">Sync Settings</h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="h-4 w-4 rounded border-border-primary text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-text-secondary">Auto-sync theme changes</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="h-4 w-4 rounded border-border-primary text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-text-secondary">Sync personalization settings</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="h-4 w-4 rounded border-border-primary text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-text-secondary">Sync custom themes</span>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-border-primary pt-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Danger Zone</h4>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Reset all cloud data and return to default settings
              </p>
              <button
                onClick={handleResetCloudData}
                disabled={isSyncing}
                className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showResetConfirm ? 'Confirm Reset' : 'Reset Cloud Data'}
              </button>
              {showResetConfirm && (
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="ml-2 mt-2 rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CloudSyncControls;