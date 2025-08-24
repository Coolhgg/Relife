import { useState, useEffect, useCallback } from 'react';
import {
  capacitorEnhanced,
  DeviceFeatures,
  AlarmNotification,
} from '../services/capacitor-enhanced';
// import ... from '@capacitor/app'; // Package not available in current setup
// import ... from '@capacitor/network'; // Package not available in current setup
import { TimeoutHandle } from '../types/timers';

// Main Capacitor hook
export function useCapacitor() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceFeatures, setDeviceFeatures] = useState<DeviceFeatures | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const initializeCapacitor = async () => {
      try {
        await capacitorEnhanced.initialize();
        setIsInitialized(true);
        setDeviceFeatures(capacitorEnhanced.getDeviceFeatures());
        setIsNative(capacitorEnhanced.isNativePlatform());
      } catch (error) {
        console.error('Failed to initialize Capacitor:', error);
      }
    };

    initializeCapacitor();

    const handleInitialized = (data: { features: DeviceFeatures }) => {
      setDeviceFeatures(data.features);
      setIsInitialized(true);
    };

    capacitorEnhanced.on('initialized', handleInitialized);

    return () => {
      capacitorEnhanced.off('initialized', handleInitialized);
    };
  }, []);

  return {
    isInitialized,
    deviceFeatures,
    isNative,
    platform: deviceFeatures?.platform || 'web',
  };
}

// Hook for alarm notifications
export function useAlarmNotifications() {
  const [pendingAlarms, setPendingAlarms] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const scheduleAlarm = useCallback(async (alarm: AlarmNotification) => {
    setIsScheduling(true);
    try {
      await capacitorEnhanced.scheduleAlarmNotification(alarm);
      const pending = await capacitorEnhanced.getPendingAlarms();
      setPendingAlarms(pending);
      return true;
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
      throw error;
    } finally {
      setIsScheduling(false);
    }
  }, []);

  const cancelAlarm = useCallback(async (alarmId: number) => {
    try {
      await capacitorEnhanced.cancelAlarmNotification(alarmId);
      const pending = await capacitorEnhanced.getPendingAlarms();
      setPendingAlarms(pending);
      return true;
    } catch (error) {
      console.error('Failed to cancel alarm:', error);
      throw error;
    }
  }, []);

  const refreshPendingAlarms = useCallback(async () => {
    try {
      const pending = await capacitorEnhanced.getPendingAlarms();
      setPendingAlarms(pending);
    } catch (error) {
      console.error('Failed to refresh pending alarms:', error);
    }
  }, []);

  useEffect(() => {
    refreshPendingAlarms();

    const handleAlarmScheduled = () => refreshPendingAlarms();
    const handleAlarmCancelled = () => refreshPendingAlarms();

    capacitorEnhanced.on('alarm-scheduled', handleAlarmScheduled);
    capacitorEnhanced.on('alarm-cancelled', handleAlarmCancelled);

    return () => {
      capacitorEnhanced.off('alarm-scheduled', handleAlarmScheduled);
      capacitorEnhanced.off('alarm-cancelled', handleAlarmCancelled);
    };
  }, [refreshPendingAlarms]);

  return {
    pendingAlarms,
    isScheduling,
    scheduleAlarm,
    cancelAlarm,
    refreshPendingAlarms,
  };
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const features = capacitorEnhanced.getDeviceFeatures();
    setIsSupported(features?.hasHaptics || false);
  }, []);

  const triggerHaptic = useCallback(
    async (
      type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
    ) => {
      if (!isSupported) return;

      try {
        await capacitorEnhanced.triggerHapticFeedback(type);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    },
    [isSupported]
  );

  return {
    isSupported,
    triggerHaptic,
  };
}

// Hook for app state management
export function useAppState() {
  const [appState, setAppState] = useState<AppState>({ isActive: true });
  const [isBackground, setIsBackground] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (state: AppState) => {
      setAppState(state);
      setIsBackground(!state.isActive);
    };

    capacitorEnhanced.on('app-state-change', handleAppStateChange);

    return () => {
      capacitorEnhanced.off('app-state-change', handleAppStateChange);
    };
  }, []);

  return {
    appState,
    isActive: appState.isActive,
    isBackground,
  };
}

// Hook for network status
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const handleNetworkChange = (status: ConnectionStatus) => {
      setNetworkStatus(status);
    };

    capacitorEnhanced.on('network-change', handleNetworkChange);

    return () => {
      capacitorEnhanced.off('network-change', handleNetworkChange);
    };
  }, []);

  return {
    isConnected: networkStatus.connected,
    connectionType: networkStatus.connectionType,
    networkStatus,
  };
}

// Hook for wake lock functionality
export function useWakeLock() {
  const [isAwake, setIsAwake] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const features = capacitorEnhanced.getDeviceFeatures();
    setIsSupported(features?.hasWakeLock || false);
  }, []);

  const keepAwake = useCallback(async () => {
    if (!isSupported) return false;

    try {
      await capacitorEnhanced.keepAwake();
      setIsAwake(true);
      return true;
    } catch (error) {
      console.error('Failed to keep awake:', error);
      return false;
    }
  }, [isSupported]);

  const allowSleep = useCallback(async () => {
    if (!isSupported) return false;

    try {
      await capacitorEnhanced.allowSleep();
      setIsAwake(false);
      return true;
    } catch (error) {
      console.error('Failed to allow sleep:', error);
      return false;
    }
  }, [isSupported]);

  return {
    isAwake,
    isSupported,
    keepAwake,
    allowSleep,
  };
}

// Hook for notification events
export function useNotificationEvents() {
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [notificationActions, setNotificationActions] = useState<string[]>([]);

  useEffect(() => {
    const handleNotificationReceived = (notification: any) => {
      setLastNotification(notification);
    };

    const handleAlarmSnoozed = (data: any) => {
      setNotificationActions((prev: any) => // auto: implicit any [...prev, `snoozed-${data.alarmId}`]);
    };

    const handleAlarmDismissed = (data: any) => {
      setNotificationActions((prev: any) => // auto: implicit any [...prev, `dismissed-${data.alarmId}`]);
    };

    const handleAlarmTapped = (data: any) => {
      setNotificationActions((prev: any) => // auto: implicit any [...prev, `tapped-${data.alarmId}`]);
    };

    capacitorEnhanced.on('notification-received', handleNotificationReceived);
    capacitorEnhanced.on('alarm-snoozed', handleAlarmSnoozed);
    capacitorEnhanced.on('alarm-dismissed', handleAlarmDismissed);
    capacitorEnhanced.on('alarm-tapped', handleAlarmTapped);

    return () => {
      capacitorEnhanced.off('notification-received', handleNotificationReceived);
      capacitorEnhanced.off('alarm-snoozed', handleAlarmSnoozed);
      capacitorEnhanced.off('alarm-dismissed', handleAlarmDismissed);
      capacitorEnhanced.off('alarm-tapped', handleAlarmTapped);
    };
  }, []);

  const clearActions = useCallback(() => {
    setNotificationActions([]);
  }, []);

  return {
    lastNotification,
    notificationActions,
    clearActions,
    hasRecentActions: notificationActions.length > 0,
  };
}

// Hook for back button handling
export function useBackButton() {
  const [backButtonPressed, setBackButtonPressed] = useState(false);

  useEffect(() => {
    const handleBackButton = (event: any) => {
      setBackButtonPressed(true);

      // Reset after a short delay
      setTimeout(() => setBackButtonPressed(false), 100);
    };

    capacitorEnhanced.on('back-button', handleBackButton);

    return () => {
      capacitorEnhanced.off('back-button', handleBackButton);
    };
  }, []);

  return {
    backButtonPressed,
  };
}

// Hook for URL handling
export function useAppUrlOpen() {
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleAppUrlOpen = (event: any) => {
      setLastUrl(event.url);
    };

    capacitorEnhanced.on('app-url-open', handleAppUrlOpen);

    return () => {
      capacitorEnhanced.off('app-url-open', handleAppUrlOpen);
    };
  }, []);

  return {
    lastUrl,
  };
}

// Comprehensive hook that combines multiple Capacitor features
export function useCapacitorAlarmApp() {
  const capacitor = useCapacitor();
  const alarms = useAlarmNotifications();
  const haptics = useHapticFeedback();
  const appState = useAppState();
  const network = useNetworkStatus();
  const wakeLock = useWakeLock();
  const notifications = useNotificationEvents();
  const backButton = useBackButton();

  return {
    // Core Capacitor
    isInitialized: capacitor.isInitialized,
    deviceFeatures: capacitor.deviceFeatures,
    isNative: capacitor.isNative,
    platform: capacitor.platform,

    // Alarms
    pendingAlarms: alarms.pendingAlarms,
    isSchedulingAlarm: alarms.isScheduling,
    scheduleAlarm: alarms.scheduleAlarm,
    cancelAlarm: alarms.cancelAlarm,

    // Haptics
    triggerHaptic: haptics.triggerHaptic,
    hasHaptics: haptics.isSupported,

    // App State
    isAppActive: appState.isActive,
    isAppInBackground: appState.isBackground,

    // Network
    isOnline: network.isConnected,
    connectionType: network.connectionType,

    // Wake Lock
    keepScreenAwake: wakeLock.keepAwake,
    allowScreenSleep: wakeLock.allowSleep,
    isScreenAwake: wakeLock.isAwake,

    // Notifications
    lastNotification: notifications.lastNotification,
    notificationActions: notifications.notificationActions,
    clearNotificationActions: notifications.clearActions,

    // Back Button
    backButtonPressed: backButton.backButtonPressed,
  };
}
