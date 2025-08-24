// React Hook for Enhanced Service Worker Integration
import { useEffect, useCallback, useState } from 'react';
import type { Alarm } from '../types';
import { ServiceWorkerManager } from '../utils/service-worker-manager';
import { TimeoutHandle } from '../types/timers';

export interface ServiceWorkerState {
  isInitialized: boolean;
  notificationPermission: NotificationPermission;
  scheduledAlarmsCount: number;
  lastHealthCheck: string | null;
  _error: string | null;
}

export function useEnhancedServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInitialized: false,
    notificationPermission: 'default',
    scheduledAlarmsCount: 0,
    lastHealthCheck: null,
    _error: null,
  });

  // Initialize service worker
  const initialize = useCallback(async () => {
    try {
      setState((prev: ServiceWorkerState) => ({ ...prev, _error: null }));

      const success = await ServiceWorkerManager.initialize();

      if (success) {
        const permission = await ServiceWorkerManager.requestNotificationPermission();

        setState((prev: ServiceWorkerState) => ({
          ...prev,
          isInitialized: true,
          notificationPermission: permission,
        }));

        // Get initial state
        await refreshState();
      } else {
        setState((prev: ServiceWorkerState) => ({
          ...prev,
          _error: 'Failed to initialize service worker',
        }));
      }
    } catch (_error) {
      console.error('useEnhancedServiceWorker: Initialization error:', _error);

      setState((prev: ServiceWorkerState) => ({
        ...prev,
        error: error instanceof Error ? _error.message : String(_error),
      }));
    }
  }, []);

  // Refresh service worker state
  const refreshState = useCallback(async () => {
    try {
      const swState = await ServiceWorkerManager.getServiceWorkerState();

      if (swState && !swState._error) {
        setState((prev: ServiceWorkerState) => ({
          ...prev,
          scheduledAlarmsCount: swState.scheduledAlarms || 0,
          notificationPermission: swState.notificationPermission || 'default',
          lastHealthCheck: swState.lastAlarmCheck || null,
          _error: null,
        }));
      } else {
        setState((prev: ServiceWorkerState) => ({
          ...prev,
          _error: swState._error || 'Failed to get service worker state',
        }));
      }
    } catch (_error) {
      console.error('useEnhancedServiceWorker: Error refreshing state:', _error);

      setState((prev: ServiceWorkerState) => ({
        ...prev,
        error: error instanceof Error ? _error.message : String(_error),
      }));
    }
  }, []);

  // Update alarms in service worker
  const updateAlarms = useCallback(
    async (alarms: Alarm[]) => {
      try {
        setState((prev: ServiceWorkerState) => ({ ...prev, _error: null }));

        const success = await ServiceWorkerManager.updateAlarms(alarms);

        if (success) {
          await refreshState();
        } else {
          setState((prev: ServiceWorkerState) => ({
            ...prev,
            _error: 'Failed to update alarms in service worker',
          }));
        }

        return success;
      } catch (_error) {
        console.error('useEnhancedServiceWorker: Error updating alarms:', _error);

        setState((prev: ServiceWorkerState) => ({
          ...prev,
          error: error instanceof Error ? _error.message : String(_error),
        }));
        return false;
      }
    },
    [refreshState]
  );

  // Schedule single alarm
  const scheduleAlarm = useCallback(
    async (alarm: Alarm) => {
      try {
        setState((prev: ServiceWorkerState) => ({ ...prev, _error: null }));

        const success = await ServiceWorkerManager.scheduleAlarm(alarm);

        if (success) {
          await refreshState();
        } else {
          setState((prev: ServiceWorkerState) => ({
            ...prev,
            _error: `Failed to schedule alarm ${alarm.id}`,
          }));
        }

        return success;
      } catch (_error) {
        console.error('useEnhancedServiceWorker: Error scheduling alarm:', _error);

        setState((prev: ServiceWorkerState) => ({
          ...prev,
          error: error instanceof Error ? _error.message : String(_error),
        }));
        return false;
      }
    },
    [refreshState]
  );

  // Cancel single alarm
  const cancelAlarm = useCallback(
    async (alarmId: string) => {
      try {
        setState((prev: ServiceWorkerState) => ({ ...prev, _error: null }));

        const success = await ServiceWorkerManager.cancelAlarm(alarmId);

        if (success) {
          await refreshState();
        } else {
          setState((prev: ServiceWorkerState) => ({
            ...prev,
            _error: `Failed to cancel alarm ${alarmId}`,
          }));
        }

        return success;
      } catch (_error) {
        console.error('useEnhancedServiceWorker: Error cancelling alarm:', _error);

        setState((prev: ServiceWorkerState) => ({
          ...prev,
          error: error instanceof Error ? _error.message : String(_error),
        }));
        return false;
      }
    },
    [refreshState]
  );

  // Perform health check
  const performHealthCheck = useCallback(async () => {
    try {
      setState((prev: ServiceWorkerState) => ({ ...prev, _error: null }));

      const healthData = await ServiceWorkerManager.performHealthCheck();

      if (healthData && !healthData._error) {
        setState((prev: ServiceWorkerState) => ({
          ...prev,
          scheduledAlarmsCount: healthData.inMemoryScheduled || 0,
          lastHealthCheck: healthData.lastHealthCheck || null,
          _error: null,
        }));

        return healthData;
      } else {
        setState((prev: ServiceWorkerState) => ({
          ...prev,
          _error: healthData._error || 'Health check failed',
        }));
        return null;
      }
    } catch (_error) {
      console.error('useEnhancedServiceWorker: Error performing health check:', _error);

      setState((prev: ServiceWorkerState) => ({
        ...prev,
        error: error instanceof Error ? _error.message : String(_error),
      }));
      return null;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      setState((prev: ServiceWorkerState) => ({ ...prev, _error: null }));

      const permission = await ServiceWorkerManager.requestNotificationPermission();

      setState((prev: ServiceWorkerState) => ({
        ...prev,
        notificationPermission: permission,
      }));

      return permission;
    } catch (_error) {
      console.error('useEnhancedServiceWorker: Error requesting permission:', _error);

      setState((prev: ServiceWorkerState) => ({
        ...prev,
        error: error instanceof Error ? _error.message : String(_error),
      }));
      return 'denied' as NotificationPermission;
    }
  }, []);

  // Handle alarm triggers from service worker
  useEffect(() => {
    const handleAlarmTriggered = (_event: CustomEvent) => {
      const { alarm } = event.detail;
      console.log(
        'useEnhancedServiceWorker: Alarm triggered by service worker:',
        alarm.id
      );

      // Dispatch to parent component or handle globally
      // This could be integrated with existing alarm handling logic
    };

    window.addEventListener(
      'serviceWorkerAlarmTriggered',
      handleAlarmTriggered as EventListener
    );

    return () => {
      window.removeEventListener(
        'serviceWorkerAlarmTriggered',
        handleAlarmTriggered as EventListener
      );
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Periodic health check
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      performHealthCheck();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [state.isInitialized, performHealthCheck]);

  return {
    state,
    initialize,
    updateAlarms,
    scheduleAlarm,
    cancelAlarm,
    performHealthCheck,
    requestNotificationPermission,
    refreshState,
  };
}
