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
  error: string | null;
}

export function useEnhancedServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInitialized: false,
    notificationPermission: 'default',
    scheduledAlarmsCount: 0,
    lastHealthCheck: null,
    error: null,
  });

  // Initialize service worker
  const initialize = useCallback(async (
) => {
    try {
      
      setState((prev: any
) => ({ ...prev, error: null }));

      const success = await ServiceWorkerManager.initialize();

      if (success) {
        const permission = await ServiceWorkerManager.requestNotificationPermission();
        
      setState((prev: any
) => ({
          ...prev,
          isInitialized: true,
          notificationPermission: permission,
        }));

        // Get initial state
        await refreshState();
      } else {
        
      setState((prev: any
) => ({
          ...prev,
          error: 'Failed to initialize service worker',
        }));
      }
    } catch (error) {
      console.error('useEnhancedServiceWorker: Initialization error:', error);
      
      setState((prev: any
) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  // Refresh service worker state
  const refreshState = useCallback(async (
) => {
    try {
      const swState = await ServiceWorkerManager.getServiceWorkerState();

      if (swState && !swState.error) {
        
      setState((prev: any
) => ({
          ...prev,
          scheduledAlarmsCount: swState.scheduledAlarms || 0,
          notificationPermission: swState.notificationPermission || 'default',
          lastHealthCheck: swState.lastAlarmCheck || null,
          error: null,
        }));
      } else {
        
      setState((prev: any
) => ({
          ...prev,
          error: swState.error || 'Failed to get service worker state',
        }));
      }
    } catch (error) {
      console.error('useEnhancedServiceWorker: Error refreshing state:', error);
      
      setState((prev: any
) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  // Update alarms in service worker
  const updateAlarms = useCallback(
    async (alarms: Alarm[]
) => {
      try {
        
      setState((prev: any
) => ({ ...prev, error: null }));

        const success = await ServiceWorkerManager.updateAlarms(alarms);

        if (success) {
          await refreshState();
        } else {
          
      setState((prev: any
) => ({
            ...prev,
            error: 'Failed to update alarms in service worker',
          }));
        }

        return success;
      } catch (error) {
        console.error('useEnhancedServiceWorker: Error updating alarms:', error);
        
      setState((prev: any
) => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
        }));
        return false;
      }
    },
    [refreshState]
  );

  // Schedule single alarm
  const scheduleAlarm = useCallback(
    async (alarm: Alarm
) => {
      try {
        
      setState((prev: any
) => ({ ...prev, error: null }));

        const success = await ServiceWorkerManager.scheduleAlarm(alarm);

        if (success) {
          await refreshState();
        } else {
          
      setState((prev: any
) => ({
            ...prev,
            error: `Failed to schedule alarm ${alarm.id}`,
          }));
        }

        return success;
      } catch (error) {
        console.error('useEnhancedServiceWorker: Error scheduling alarm:', error);
        
      setState((prev: any
) => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
        }));
        return false;
      }
    },
    [refreshState]
  );

  // Cancel single alarm
  const cancelAlarm = useCallback(
    async (alarmId: string
) => {
      try {
        
      setState((prev: any
) => ({ ...prev, error: null }));

        const success = await ServiceWorkerManager.cancelAlarm(alarmId);

        if (success) {
          await refreshState();
        } else {
          
      setState((prev: any
) => ({
            ...prev,
            error: `Failed to cancel alarm ${alarmId}`,
          }));
        }

        return success;
      } catch (error) {
        console.error('useEnhancedServiceWorker: Error cancelling alarm:', error);
        
      setState((prev: any
) => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
        }));
        return false;
      }
    },
    [refreshState]
  );

  // Perform health check
  const performHealthCheck = useCallback(async (
) => {
    try {
      
      setState((prev: any
) => ({ ...prev, error: null }));

      const healthData = await ServiceWorkerManager.performHealthCheck();

      if (healthData && !healthData.error) {
        
      setState((prev: any
) => ({
          ...prev,
          scheduledAlarmsCount: healthData.inMemoryScheduled || 0,
          lastHealthCheck: healthData.lastHealthCheck || null,
          error: null,
        }));

        return healthData;
      } else {
        
      setState((prev: any
) => ({
          ...prev,
          error: healthData.error || 'Health check failed',
        }));
        return null;
      }
    } catch (error) {
      console.error('useEnhancedServiceWorker: Error performing health check:', error);
      
      setState((prev: any
) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
      return null;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (
) => {
    try {
      
      setState((prev: any
) => ({ ...prev, error: null }));

      const permission = await ServiceWorkerManager.requestNotificationPermission();

      
      setState((prev: any
) => ({
        ...prev,
        notificationPermission: permission,
      }));

      return permission;
    } catch (error) {
      console.error('useEnhancedServiceWorker: Error requesting permission:', error);
      
      setState((prev: any
) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
      return 'denied' as NotificationPermission;
    }
  }, []);

  // Handle alarm triggers from service worker
  useEffect((
) => {
    const handleAlarmTriggered = (event: CustomEvent
) => {
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

    return (
) => {
      window.removeEventListener(
        'serviceWorkerAlarmTriggered',
        handleAlarmTriggered as EventListener
      );
    };
  }, []);

  // Initialize on mount
  useEffect((
) => {
    initialize();
  }, [initialize]);

  // Periodic health check
  useEffect((
) => {
    if (!state.isInitialized) return;

    const interval = setInterval((
) => {
      performHealthCheck();
    }, 60000); // Every minute

    return (
) => clearInterval(interval);
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
