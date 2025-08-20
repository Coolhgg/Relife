import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Download,
  Bell,
  RefreshCw,
  Smartphone,
  Shield,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw as Sync,
  Settings,
  Info,
} from "lucide-react";
import PWAService, {
  type PWACapabilities,
  type BackgroundSyncStatus,
  type PushSubscriptionInfo,
} from "../services/pwa-service";
import { OfflineManager, type SyncStatus } from "../services/offline-manager";

interface PWAStatusDashboardProps {
  className?: string;
  onClose?: () => void;
}

const PWAStatusDashboard: React.FC<PWAStatusDashboardProps> = ({
  className = "",
  onClose,
}) => {
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(
    null,
  );
  const [syncStatus, setSyncStatus] = useState<BackgroundSyncStatus | null>(
    null,
  );
  const [offlineStatus, setOfflineStatus] = useState<SyncStatus | null>(null);
  const [pushInfo, setPushInfo] = useState<PushSubscriptionInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "sync" | "notifications" | "offline"
  >("overview");

  const pwaService = PWAService.getInstance();

  useEffect(() => {
    const initializeStatus = async () => {
      setIsLoading(true);
      try {
        await pwaService.initialize();

        // Get all status information
        const caps = pwaService.getPWACapabilities();
        const syncStat = pwaService.getBackgroundSyncStatus();
        const offlineStat = await OfflineManager.getStatus();
        const pushInf = await pwaService.getPushSubscriptionInfo();

        setCapabilities(caps);
        setSyncStatus(syncStat);
        setOfflineStatus(offlineStat);
        setPushInfo(pushInf);
      } catch (error) {
        console.error("PWA Status: Failed to initialize:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStatus();

    // Set up listeners
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
    };

    const handleSyncStatusChange = (status: BackgroundSyncStatus) => {
      setSyncStatus(status);
    };

    pwaService.addNetworkListener(handleNetworkChange);
    pwaService.addSyncListener(handleSyncStatusChange);

    return () => {
      pwaService.removeNetworkListener(handleNetworkChange);
      pwaService.removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  const handleInstallApp = async () => {
    try {
      await pwaService.installApp();
    } catch (error) {
      console.error("PWA Status: Install failed:", error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const subscription = await pwaService.subscribeToPushNotifications();
      setPushInfo(subscription);
    } catch (error) {
      console.error("PWA Status: Notification subscription failed:", error);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await pwaService.unsubscribeFromPushNotifications();
      const updatedInfo = await pwaService.getPushSubscriptionInfo();
      setPushInfo(updatedInfo);
    } catch (error) {
      console.error("PWA Status: Notification unsubscribe failed:", error);
    }
  };

  const handleForceSync = async () => {
    try {
      await pwaService.forceSync();
      // Refresh status after sync
      const syncStat = pwaService.getBackgroundSyncStatus();
      const offlineStat = await OfflineManager.getStatus();
      setSyncStatus(syncStat);
      setOfflineStatus(offlineStat);
    } catch (error) {
      console.error("PWA Status: Force sync failed:", error);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const hasUpdate = await pwaService.checkForUpdates();
      if (hasUpdate) {
        const shouldUpdate = confirm(
          "An update is available. Would you like to update now?",
        );
        if (shouldUpdate) {
          await pwaService.updateApp();
        }
      } else {
        alert("No updates available. You have the latest version!");
      }
    } catch (error) {
      console.error("PWA Status: Update check failed:", error);
    }
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (
    status: "active" | "inactive" | "warning" | "error",
  ) => {
    const badgeClasses = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      warning:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };

    return `px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[status]}`;
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 ${className}`}
      >
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
          <span className="text-gray-600 dark:text-gray-300">
            Loading PWA status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-dark-800 rounded-lg shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-200">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              PWA Status
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progressive Web App capabilities and status
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 ${getStatusBadge(isOnline ? "active" : "error")}`}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-200">
        {[
          { id: "overview", label: "Overview", icon: Info },
          { id: "sync", label: "Sync", icon: Sync },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "offline", label: "Offline", icon: Database },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                PWA Capabilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Service Worker
                    </span>
                  </div>
                  {getStatusIcon(capabilities?.serviceWorker || false)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Sync className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Background Sync
                    </span>
                  </div>
                  {getStatusIcon(capabilities?.backgroundSync || false)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </span>
                  </div>
                  {getStatusIcon(capabilities?.pushNotifications || false)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Install Prompt
                    </span>
                  </div>
                  {getStatusIcon(capabilities?.installPrompt || false)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Offline Support
                    </span>
                  </div>
                  {getStatusIcon(capabilities?.offlineSupport || false)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Periodic Sync
                    </span>
                  </div>
                  {getStatusIcon(capabilities?.periodicSync || false)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {capabilities?.installPrompt && (
                <button
                  onClick={handleInstallApp}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </button>
              )}

              <button
                onClick={handleCheckUpdates}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Updates</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "sync" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Background Sync Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Sync Enabled
                    </span>
                    {getStatusIcon(syncStatus?.enabled || false)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Background sync capability available
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Last Sync
                    </span>
                    <span
                      className={`text-xs ${syncStatus?.lastSync ? "text-green-600" : "text-gray-500"}`}
                    >
                      {syncStatus?.lastSync
                        ? syncStatus.lastSync.toLocaleTimeString()
                        : "Never"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last successful background sync
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Failed Syncs
                    </span>
                    <span
                      className={`text-xs ${(syncStatus?.failedSyncs || 0) > 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {syncStatus?.failedSyncs || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Number of failed sync attempts
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Pending Operations
                    </span>
                    <span
                      className={`text-xs ${(offlineStatus?.pendingOperations || 0) > 0 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {offlineStatus?.pendingOperations || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Operations waiting to sync
                  </p>
                </div>
              </div>

              <button
                onClick={handleForceSync}
                disabled={!isOnline}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Sync className="w-4 h-4" />
                <span>Force Sync Now</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Push Notifications
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Notification Status
                    </span>
                    <span
                      className={getStatusBadge(
                        pushInfo?.subscribed ? "active" : "inactive",
                      )}
                    >
                      {pushInfo?.subscribed ? "Subscribed" : "Not Subscribed"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Push notification subscription status
                  </p>
                </div>

                {pushInfo?.subscribed && pushInfo.endpoint && (
                  <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Endpoint
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                      {pushInfo.endpoint.substring(0, 80)}...
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  {!pushInfo?.subscribed ? (
                    <button
                      onClick={handleEnableNotifications}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Enable Notifications</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDisableNotifications}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Disable Notifications</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "offline" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Offline Capabilities
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Network Status
                    </span>
                    <span
                      className={getStatusBadge(
                        isOnline ? "active" : "warning",
                      )}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Current internet connectivity
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Sync in Progress
                    </span>
                    {getStatusIcon(!(offlineStatus?.syncInProgress || false))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {offlineStatus?.syncInProgress
                      ? "Syncing data..."
                      : "Ready"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Offline Features Available
                    </h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• View and create alarms</li>
                      <li>• Voice commands work locally</li>
                      <li>• Sleep tracking continues</li>
                      <li>• All changes sync when back online</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAStatusDashboard;
