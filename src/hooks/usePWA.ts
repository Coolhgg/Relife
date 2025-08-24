import { useState, useEffect, useCallback } from 'react';
import { pwaManager } from '../services/pwa-manager';

// Main PWA hook
export function usePWA() {
  const [capabilities, setCapabilities] = useState(pwaManager.getCapabilities());
  const [state, setState] = useState(pwaManager.getState());
  const [isOnline, setIsOnline] = useState(!pwaManager.isOffline());

  useEffect(() => {
    // Update capabilities and state
    const updateCapabilities = () => setCapabilities(pwaManager.getCapabilities());
    const updateState = () => setState(pwaManager.getState());

    // Online/offline handling
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA events
    pwaManager.on('installable', updateState);
    pwaManager.on('installed', updateState);
    pwaManager.on('already-installed', updateState);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      pwaManager.off('installable', updateState);
      pwaManager.off('installed', updateState);
      pwaManager.off('already-installed', updateState);
    };
  }, []);

  const showInstallPrompt = useCallback(async () => {
    return await pwaManager.showInstallPrompt();
  }, []);

  const updateServiceWorker = useCallback(async () => {
    return await pwaManager.updateServiceWorker();
  }, []);

  return {
    capabilities,
    state,
    isOnline,
    isOffline: !isOnline,
    showInstallPrompt,
    updateServiceWorker,
    shouldShowInstallPrompt: pwaManager.shouldShowInstallPrompt(),
  };
}

// Hook for install prompt
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(pwaManager.shouldShowInstallPrompt());
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleInstallable = () => setCanInstall(true);
    const handleInstalled = () => {
      setCanInstall(false);
      setIsInstalling(false);
    };

    pwaManager.on('installable', handleInstallable);
    pwaManager.on('installed', handleInstalled);
    pwaManager.on('install-accepted', () => setIsInstalling(true));
    pwaManager.on('install-dismissed', () => setIsInstalling(false));

    return () => {
      pwaManager.off('installable', handleInstallable);
      pwaManager.off('installed', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!canInstall || isInstalling) return false;

    setIsInstalling(true);
    try {
      const result = await pwaManager.showInstallPrompt();
      if (!result) {
        setIsInstalling(false);
      }
      return result;
    } catch (error) {
      setIsInstalling(false);
      throw error;
    }
  }, [canInstall, isInstalling]);

  return {
    canInstall,
    isInstalling,
    install,
  };
}

// Hook for service worker updates
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    pwaManager.on('sw-update-available', handleUpdateAvailable);

    return () => {
      pwaManager.off('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateAvailable || isUpdating) return;

    setIsUpdating(true);
    try {
      await pwaManager.updateServiceWorker();
    } catch (error) {
      setIsUpdating(false);
      throw error;
    }
  }, [updateAvailable, isUpdating]);

  return {
    updateAvailable,
    isUpdating,
    applyUpdate,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Get current subscription
    pwaManager.getPushSubscription().then(setSubscription);

    const handlePermissionChange = (data: { permission: NotificationPermission }) => {
      setPermission(data.permission);
    };

    const handleSubscribed = (data: { subscription: PushSubscription }) => {
      setSubscription(data.subscription);
      setIsSubscribing(false);
    };

    pwaManager.on('notification-permission-changed', handlePermissionChange);
    pwaManager.on('push-subscribed', handleSubscribed);

    return () => {
      pwaManager.off('notification-permission-changed', handlePermissionChange);
      pwaManager.off('push-subscribed', handleSubscribed);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const newPermission = await pwaManager.requestNotificationPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (isSubscribing) return null;

    setIsSubscribing(true);
    try {
      const newSubscription = await pwaManager.subscribeToPushNotifications();
      if (!newSubscription) {
        setIsSubscribing(false);
      }
      return newSubscription;
    } catch (error) {
      setIsSubscribing(false);
      throw error;
    }
  }, [isSubscribing]);

  return {
    permission,
    subscription,
    isSubscribing,
    isSupported: pwaManager.getCapabilities().pushNotifications,
    requestPermission,
    subscribe,
  };
}

// Hook for offline functionality
export function useOffline() {
  const [isOnline, setIsOnline] = useState(!pwaManager.isOffline());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleSyncComplete = () => setSyncStatus('idle');
    const handleSyncError = () => setSyncStatus('error');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    pwaManager.on('sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      pwaManager.off('sync-complete', handleSyncComplete);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    syncStatus,
    isBackgroundSyncSupported: pwaManager.getCapabilities().backgroundSync,
  };
}

// Hook for PWA-specific UI behaviors
export function usePWAUI() {
  const [isStandalone, setIsStandalone] = useState(
    pwaManager.getCapabilities().standalone
  );

  useEffect(() => {
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return {
    isStandalone,
    displayMode: isStandalone ? 'standalone' : 'browser',
    shouldShowBackButton: !isStandalone,
    shouldHideAddressBar: isStandalone,
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const [pendingItems, setPendingItems] = useState<string[]>([]);

  const addToQueue = useCallback((item: string) => {
    setPendingItems((prev: any) => [ // auto: implicit any...prev, item]);
    // Send to service worker for background sync
    pwaManager.sendMessageToSW({
      type: 'QUEUE_SYNC',
      data: item,
    });
  }, []);

  const clearQueue = useCallback(() => {
    setPendingItems([]);
  }, []);

  useEffect(() => {
    const handleSyncComplete = () => {
      clearQueue();
    };

    pwaManager.on('sync-complete', handleSyncComplete);

    return () => {
      pwaManager.off('sync-complete', handleSyncComplete);
    };
  }, [clearQueue]);

  return {
    pendingItems,
    hasPendingItems: pendingItems.length > 0,
    addToQueue,
    clearQueue,
    isSupported: pwaManager.getCapabilities().backgroundSync,
  };
}

// Hook for alarm-specific PWA features
export function useAlarmPWA() {
  const [alarmEvents, setAlarmEvents] = useState<any[]>([]);

  useEffect(() => {
    const handleAlarmTriggered = (data: any) => {
      setAlarmEvents((prev: any) => [ // auto: implicit any...prev, { type: 'triggered', ...data }]);
    };

    const handleAlarmDismissed = (data: any) => {
      setAlarmEvents((prev: any) => [ // auto: implicit any...prev, { type: 'dismissed', ...data }]);
    };

    const handleAlarmSnoozed = (data: any) => {
      setAlarmEvents((prev: any) => [ // auto: implicit any...prev, { type: 'snoozed', ...data }]);
    };

    pwaManager.on('alarm-triggered', handleAlarmTriggered);
    pwaManager.on('alarm-dismissed', handleAlarmDismissed);
    pwaManager.on('alarm-snoozed', handleAlarmSnoozed);

    return () => {
      pwaManager.off('alarm-triggered', handleAlarmTriggered);
      pwaManager.off('alarm-dismissed', handleAlarmDismissed);
      pwaManager.off('alarm-snoozed', handleAlarmSnoozed);
    };
  }, []);

  const clearAlarmEvents = useCallback(() => {
    setAlarmEvents([]);
  }, []);

  return {
    alarmEvents,
    clearAlarmEvents,
  };
}
