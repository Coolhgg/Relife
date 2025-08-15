import { useState, useEffect, useCallback } from 'react';
import PWAService, { PWACapabilities, BackgroundSyncStatus, PushSubscriptionInfo } from '../services/pwa-service';
import { OfflineManager, SyncStatus } from '../services/offline-manager';

export interface PWAState {
  isInitialized: boolean;
  capabilities: PWACapabilities | null;
  installPrompt: {
    canInstall: boolean;
    isInstalled: boolean;
  };
  updateStatus: {
    hasUpdate: boolean;
    isUpdating: boolean;
  };
  syncStatus: BackgroundSyncStatus | null;
  offlineStatus: SyncStatus | null;
  pushNotifications: PushSubscriptionInfo | null;
  networkStatus: {
    isOnline: boolean;
    lastOnline: Date | null;
  };
}

export interface PWAActions {
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  triggerSync: (tags?: string[]) => Promise<void>;
  forceSync: () => Promise<void>;
  queueAnalytics: (event: any) => void;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInitialized: false,
    capabilities: null,
    installPrompt: {
      canInstall: false,
      isInstalled: false
    },
    updateStatus: {
      hasUpdate: false,
      isUpdating: false
    },
    syncStatus: null,
    offlineStatus: null,
    pushNotifications: null,
    networkStatus: {
      isOnline: navigator.onLine,
      lastOnline: navigator.onLine ? new Date() : null
    }
  });

  const pwaService = PWAService.getInstance();

  // Initialize PWA service and load initial state
  const initializePWA = useCallback(async () => {
    try {
      console.log('PWA Hook: Initializing...');
      
      const isInitialized = await pwaService.initialize();
      
      if (isInitialized) {
        // Load all PWA status information
        const capabilities = pwaService.getPWACapabilities();
        const installStatus = pwaService.getInstallPromptStatus();
        const hasUpdate = pwaService.hasUpdateAvailable();
        const syncStatus = pwaService.getBackgroundSyncStatus();
        const offlineStatus = await OfflineManager.getStatus();
        const pushInfo = await pwaService.getPushSubscriptionInfo();

        setState(prev => ({
          ...prev,
          isInitialized: true,
          capabilities,
          installPrompt: {
            canInstall: installStatus.canInstall,
            isInstalled: installStatus.isInstalled
          },
          updateStatus: {
            hasUpdate,
            isUpdating: false
          },
          syncStatus,
          offlineStatus,
          pushNotifications: pushInfo
        }));

        console.log('PWA Hook: Initialization complete');
      }
    } catch (error) {
      console.error('PWA Hook: Initialization failed:', error);
      setState(prev => ({ ...prev, isInitialized: true })); // Mark as initialized even if failed
    }
  }, [pwaService]);

  // Set up event listeners
  useEffect(() => {
    initializePWA();

    // Set up PWA service listeners
    const handleInstallPromptChange = (canInstall: boolean) => {
      setState(prev => ({
        ...prev,
        installPrompt: {
          ...prev.installPrompt,
          canInstall
        }
      }));
    };

    const handleUpdateAvailable = (hasUpdate: boolean) => {
      setState(prev => ({
        ...prev,
        updateStatus: {
          ...prev.updateStatus,
          hasUpdate
        }
      }));
    };

    const handleSyncStatusChange = (syncStatus: BackgroundSyncStatus) => {
      setState(prev => ({
        ...prev,
        syncStatus
      }));
    };

    const handleNetworkChange = (isOnline: boolean) => {
      setState(prev => ({
        ...prev,
        networkStatus: {
          isOnline,
          lastOnline: isOnline ? new Date() : prev.networkStatus.lastOnline
        }
      }));
    };

    // Add listeners
    pwaService.addInstallPromptListener(handleInstallPromptChange);
    pwaService.addUpdateListener(handleUpdateAvailable);
    pwaService.addSyncListener(handleSyncStatusChange);
    pwaService.addNetworkListener(handleNetworkChange);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        installPrompt: {
          canInstall: false,
          isInstalled: true
        }
      }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      pwaService.removeInstallPromptListener(handleInstallPromptChange);
      pwaService.removeUpdateListener(handleUpdateAvailable);
      pwaService.removeSyncListener(handleSyncStatusChange);
      pwaService.removeNetworkListener(handleNetworkChange);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [initializePWA, pwaService]);

  // Periodic status refresh
  useEffect(() => {
    if (!state.isInitialized) return;

    const refreshStatus = async () => {
      try {
        const offlineStatus = await OfflineManager.getStatus();
        const pushInfo = await pwaService.getPushSubscriptionInfo();
        
        setState(prev => ({
          ...prev,
          offlineStatus,
          pushNotifications: pushInfo
        }));
      } catch (error) {
        console.error('PWA Hook: Status refresh failed:', error);
      }
    };

    // Refresh status every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isInitialized, pwaService]);

  // PWA actions
  const actions: PWAActions = {
    installApp: useCallback(async () => {
      try {
        setState(prev => ({
          ...prev,
          installPrompt: { ...prev.installPrompt, canInstall: false }
        }));
        
        const success = await pwaService.installApp();
        
        if (success) {
          setState(prev => ({
            ...prev,
            installPrompt: { canInstall: false, isInstalled: true }
          }));
        } else {
          // Reset if failed
          setState(prev => ({
            ...prev,
            installPrompt: { ...prev.installPrompt, canInstall: true }
          }));
        }
        
        return success;
      } catch (error) {
        console.error('PWA Hook: Install failed:', error);
        return false;
      }
    }, [pwaService]),

    updateApp: useCallback(async () => {
      try {
        setState(prev => ({
          ...prev,
          updateStatus: { ...prev.updateStatus, isUpdating: true }
        }));
        
        const success = await pwaService.updateApp();
        
        setState(prev => ({
          ...prev,
          updateStatus: { hasUpdate: !success, isUpdating: false }
        }));
        
        return success;
      } catch (error) {
        console.error('PWA Hook: Update failed:', error);
        setState(prev => ({
          ...prev,
          updateStatus: { ...prev.updateStatus, isUpdating: false }
        }));
        return false;
      }
    }, [pwaService]),

    checkForUpdates: useCallback(async () => {
      try {
        const hasUpdate = await pwaService.checkForUpdates();
        
        setState(prev => ({
          ...prev,
          updateStatus: { ...prev.updateStatus, hasUpdate }
        }));
        
        return hasUpdate;
      } catch (error) {
        console.error('PWA Hook: Update check failed:', error);
        return false;
      }
    }, [pwaService]),

    subscribeToPush: useCallback(async () => {
      try {
        const subscription = await pwaService.subscribeToPushNotifications();
        
        setState(prev => ({
          ...prev,
          pushNotifications: subscription
        }));
        
        return subscription.subscribed;
      } catch (error) {
        console.error('PWA Hook: Push subscription failed:', error);
        return false;
      }
    }, [pwaService]),

    unsubscribeFromPush: useCallback(async () => {
      try {
        const success = await pwaService.unsubscribeFromPushNotifications();
        
        if (success) {
          const updatedInfo = await pwaService.getPushSubscriptionInfo();
          setState(prev => ({
            ...prev,
            pushNotifications: updatedInfo
          }));
        }
        
        return success;
      } catch (error) {
        console.error('PWA Hook: Push unsubscribe failed:', error);
        return false;
      }
    }, [pwaService]),

    triggerSync: useCallback(async (tags?: string[]) => {
      try {
        await pwaService.triggerBackgroundSync(tags);
        
        // Refresh sync status after triggering
        const syncStatus = pwaService.getBackgroundSyncStatus();
        setState(prev => ({ ...prev, syncStatus }));
      } catch (error) {
        console.error('PWA Hook: Sync trigger failed:', error);
      }
    }, [pwaService]),

    forceSync: useCallback(async () => {
      try {
        await pwaService.forceSync();
        
        // Refresh status after force sync
        const syncStatus = pwaService.getBackgroundSyncStatus();
        const offlineStatus = await OfflineManager.getStatus();
        
        setState(prev => ({
          ...prev,
          syncStatus,
          offlineStatus
        }));
      } catch (error) {
        console.error('PWA Hook: Force sync failed:', error);
      }
    }, [pwaService]),

    queueAnalytics: useCallback((event: any) => {
      try {
        pwaService.queueAnalytics(event);
      } catch (error) {
        console.error('PWA Hook: Analytics queuing failed:', error);
      }
    }, [pwaService])
  };

  // Convenience computed values
  const isInstallable = state.installPrompt.canInstall && !state.installPrompt.isInstalled;
  const isOffline = !state.networkStatus.isOnline;
  const hasPendingSync = (state.offlineStatus?.pendingOperations || 0) > 0;
  const syncEnabled = state.syncStatus?.enabled || false;
  const pushEnabled = state.pushNotifications?.subscribed || false;

  return {
    ...state,
    actions,
    // Computed values
    isInstallable,
    isOffline,
    hasPendingSync,
    syncEnabled,
    pushEnabled,
    // Helper methods
    canShowInstallPrompt: () => isInstallable,
    canShowUpdatePrompt: () => state.updateStatus.hasUpdate && !state.updateStatus.isUpdating,
    shouldShowSyncIndicator: () => hasPendingSync || !syncEnabled,
    getNetworkStatusText: () => state.networkStatus.isOnline ? 'Online' : 'Offline',
    getSyncStatusText: () => {
      if (!syncEnabled) return 'Sync disabled';
      if (hasPendingSync) return `${state.offlineStatus?.pendingOperations} pending`;
      if (state.syncStatus?.lastSync) return `Last sync: ${state.syncStatus.lastSync.toLocaleTimeString()}`;
      return 'Never synced';
    },
    getPushStatusText: () => pushEnabled ? 'Notifications enabled' : 'Notifications disabled'
  };
};

export default usePWA;