import { useState, useEffect, useCallback } from 'react';
import { PushNotificationService, type PushNotificationSettings } from '../services/push-notifications';
import { useAnalytics } from './useAnalytics';
import type { Alarm } from '../types';

export interface PushNotificationStatus {
  isSupported: boolean;
  hasPermission: boolean;
  isInitialized: boolean;
  currentToken: string | null;
  settings: PushNotificationSettings;
  isLoading: boolean;
  error: string | null;
}

export interface UsePushNotificationsReturn {
  status: PushNotificationStatus;
  initialize: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  updateSettings: (settings: Partial<PushNotificationSettings>) => Promise<void>;
  scheduleAlarmPush: (alarm: Alarm) => Promise<void>;
  sendDailyMotivation: (message: string) => Promise<void>;
  sendWeeklyProgress: (stats: any) => Promise<void>;
  testNotification: () => Promise<void>;
  unregister: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { track } = useAnalytics();

  const [status, setStatus] = useState<PushNotificationStatus>({
    isSupported: false,
    hasPermission: false,
    isInitialized: false,
    currentToken: null,
    settings: PushNotificationService.getSettings(),
    isLoading: false,
    error: null
  });

  /**
   * Update status from service
   */
  const updateStatus = useCallback(async () => {
    try {
      setStatus(prev => ({
        ...prev,
        hasPermission: PushNotificationService.hasPermission(),
        currentToken: PushNotificationService.getCurrentToken(),
        settings: PushNotificationService.getSettings(),
        isSupported: 'serviceWorker' in navigator || (window as any).Capacitor?.isNativePlatform(),
        error: null
      }));
    } catch (error) {
      console.error('Error updating push notification status:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  /**
   * Initialize push notifications
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      track('push_notifications_initialize_attempt');

      const success = await PushNotificationService.initialize();

      await updateStatus();

      setStatus(prev => ({
        ...prev,
        isInitialized: success,
        isLoading: false
      }));

      if (success) {
        track('push_notifications_initialized', {
          hasPermission: PushNotificationService.hasPermission(),
          token: PushNotificationService.getCurrentToken()?.substring(0, 10) + '...' // Partial token for privacy
        });
      } else {
        track('push_notifications_initialize_failed');
      }

      return success;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';

      setStatus(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        isInitialized: false
      }));

      track('push_notifications_initialize_error', { error: errorMessage });

      return false;
    }
  }, [track, updateStatus]);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      track('push_permissions_request_attempt');

      // Re-initialize to request permissions
      const success = await PushNotificationService.initialize();

      await updateStatus();

      setStatus(prev => ({ ...prev, isLoading: false }));

      if (success) {
        track('push_permissions_granted');
      } else {
        track('push_permissions_denied');
      }

      return success;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Permission request failed';

      setStatus(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      track('push_permissions_error', { error: errorMessage });

      return false;
    }
  }, [track, updateStatus]);

  /**
   * Update notification settings
   */
  const updateSettings = useCallback(async (newSettings: Partial<PushNotificationSettings>): Promise<void> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      track('push_settings_update', {
        settingsChanged: Object.keys(newSettings)
      });

      await PushNotificationService.updateSettings(newSettings);

      await updateStatus();

      setStatus(prev => ({ ...prev, isLoading: false }));

      track('push_settings_updated', {
        enabled: status.settings.enabled,
        alarmReminders: status.settings.alarmReminders,
        dailyMotivation: status.settings.dailyMotivation
      });
    } catch (error) {
      console.error('Error updating push settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Settings update failed';

      setStatus(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      track('push_settings_update_error', { error: errorMessage });
    }
  }, [track, updateStatus, status.settings.enabled, status.settings.alarmReminders, status.settings.dailyMotivation]);

  /**
   * Schedule push notification for alarm
   */
  const scheduleAlarmPush = useCallback(async (alarm: Alarm): Promise<void> => {
    try {
      track('push_alarm_schedule', {
        alarmId: alarm.id,
        label: alarm.label,
        voiceMood: alarm.voiceMood
      });

      await PushNotificationService.scheduleAlarmPush(alarm);

      track('push_alarm_scheduled', { alarmId: alarm.id });
    } catch (error) {
      console.error('Error scheduling alarm push:', error);
      const errorMessage = error instanceof Error ? error.message : 'Alarm scheduling failed';

      setStatus(prev => ({ ...prev, error: errorMessage }));

      track('push_alarm_schedule_error', {
        alarmId: alarm.id,
        error: errorMessage
      });
    }
  }, [track]);

  /**
   * Send daily motivation notification
   */
  const sendDailyMotivation = useCallback(async (message: string): Promise<void> => {
    try {
      track('push_daily_motivation_send', { messageLength: message.length });

      await PushNotificationService.sendDailyMotivation(message);

      track('push_daily_motivation_sent');
    } catch (error) {
      console.error('Error sending daily motivation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Daily motivation failed';

      setStatus(prev => ({ ...prev, error: errorMessage }));

      track('push_daily_motivation_error', { error: errorMessage });
    }
  }, [track]);

  /**
   * Send weekly progress notification
   */
  const sendWeeklyProgress = useCallback(async (stats: any): Promise<void> => {
    try {
      track('push_weekly_progress_send', {
        alarmsTriggered: stats.alarmsTriggered,
        streak: stats.streak
      });

      await PushNotificationService.sendWeeklyProgress(stats);

      track('push_weekly_progress_sent');
    } catch (error) {
      console.error('Error sending weekly progress:', error);
      const errorMessage = error instanceof Error ? error.message : 'Weekly progress failed';

      setStatus(prev => ({ ...prev, error: errorMessage }));

      track('push_weekly_progress_error', { error: errorMessage });
    }
  }, [track]);

  /**
   * Test push notification
   */
  const testNotification = useCallback(async (): Promise<void> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      track('push_test_notification_send');

      await PushNotificationService.testPushNotification();

      setStatus(prev => ({ ...prev, isLoading: false }));

      track('push_test_notification_sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Test notification failed';

      setStatus(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      track('push_test_notification_error', { error: errorMessage });
    }
  }, [track]);

  /**
   * Unregister from push notifications
   */
  const unregister = useCallback(async (): Promise<void> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      track('push_unregister_attempt');

      // Disable all notifications
      await PushNotificationService.updateSettings({ enabled: false });

      await updateStatus();

      setStatus(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        hasPermission: false,
        currentToken: null
      }));

      track('push_unregistered');
    } catch (error) {
      console.error('Error unregistering from push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unregistration failed';

      setStatus(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      track('push_unregister_error', { error: errorMessage });
    }
  }, [track, updateStatus]);

  /**
   * Refresh status
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    await updateStatus();
  }, [updateStatus]);

  // Initialize on mount if not already initialized
  useEffect(() => {
    let mounted = true;

    const initializeIfNeeded = async () => {
      // Update initial status
      await updateStatus();

      // Auto-initialize if supported and not explicitly disabled
      if (status.isSupported && !status.isInitialized && !status.error) {
        if (mounted) {
          await initialize();
        }
      }
    };

    initializeIfNeeded();

    return () => {
      mounted = false;
    };
  }, []);

  // Set up event listeners for push notification events
  useEffect(() => {
    const handleNotificationAnalytics = (event: CustomEvent) => {
      const { event: eventType, data } = event.detail;
      track(`push_notification_${eventType}`, data);
    };

    window.addEventListener('notification-analytics', handleNotificationAnalytics as EventListener);

    return () => {
      window.removeEventListener('notification-analytics', handleNotificationAnalytics as EventListener);
    };
  }, [track]);

  // Monitor permission changes
  useEffect(() => {
    if ('Notification' in window) {
      const checkPermission = () => {
        const hasPermission = Notification.permission === 'granted';
        if (hasPermission !== status.hasPermission) {
          updateStatus();
        }
      };

      // Check permission periodically
      const interval = setInterval(checkPermission, 5000);

      return () => clearInterval(interval);
    }
  }, [status.hasPermission, updateStatus]);

  return {
    status,
    initialize,
    requestPermissions,
    updateSettings,
    scheduleAlarmPush,
    sendDailyMotivation,
    sendWeeklyProgress,
    testNotification,
    unregister,
    refreshStatus
  };
};

export default usePushNotifications;