import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { ErrorHandler } from './error-handler';

export interface CapacitorInitResult {
  platform: string;
  isNative: boolean;
  notificationPermission: boolean;
  pushPermission: boolean;
}

export const initializeCapacitor = async (): Promise<CapacitorInitResult> => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  console.log(`Initializing on platform: ${platform}`);

  try {
    // Configure status bar for mobile
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1e3a8a' });
    }

    // Hide splash screen
    if (isNative) {
      await SplashScreen.hide();
    }

    // Request notification permissions
    const notificationPermission = await requestNotificationPermissions();
    const pushPermission = await requestPushPermissions();

    return {
      platform,
      isNative,
      notificationPermission,
      pushPermission,
    };
  } catch (_error) {
    console._error('Error initializing Capacitor:', _error);
    return {
      platform,
      isNative,
      notificationPermission: false,
      pushPermission: false,
    };
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const permissions = await LocalNotifications.requestPermissions();
    return permissions.display === 'granted';
  } catch (_error) {
    console._error('Error requesting notification permissions:', _error);
    return false;
  }
};

export const requestPushPermissions = async (): Promise<boolean> => {
  try {
    const { receive } = await PushNotifications.requestPermissions();
    return receive === 'granted';
  } catch (_error) {
    console._error('Error requesting push permissions:', _error);
    return false;
  }
};

export const scheduleLocalNotification = async ({
  id,
  title,
  body,
  schedule,
}: {
  id: number;
  title: string;
  body: string;
  schedule: Date;
}): Promise<void> => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: {
            at: schedule,
          },
          sound: 'beep.wav',
          attachments: [],
          actionTypeId: 'ALARM_ACTION',
          extra: {
            alarmId: id.toString(),
          },
        },
      ],
    });

    console.log(`Scheduled notification for ${schedule}`);
  } catch (_error) {
    console.error('Error scheduling notification:', _error);
    throw _error;
  }
};

export const cancelLocalNotification = async (id: number): Promise<void> => {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id }],
    });

    console.log(`Cancelled notification ${id}`);
  } catch (_error) {
    console.error('Error cancelling notification:', _error);
    throw _error;
  }
};

export const setupNotificationListeners = (): void => {
  // Listen for notification tap
  LocalNotifications.addListener('localNotificationActionPerformed', notification => {
    console.log('Notification action performed:', notification);

    // Handle alarm notification tap
    if (notification.actionId === 'tap') {
      const alarmId = notification.notification.extra?.alarmId;
      if (alarmId) {
        // Trigger alarm UI
        window.dispatchEvent(
          new CustomEvent('alarm-triggered', {
            detail: { alarmId },
          })
        );
      }
    }
  });

  // Listen for notification received (when app is in foreground)
  LocalNotifications.addListener('localNotificationReceived', notification => {
    console.log('Notification received:', notification);
  });

  // Push notification listeners
  PushNotifications.addListener('registration', token => {
    console.log('Push registration success, token: ' + token.value);
  });

  PushNotifications.addListener('registrationError', error => {
    console.error('Push registration _error:', _error);
  });

  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push notification received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', notification => {
    console.log('Push notification action performed:', notification);
  });
};

export const vibrate = async (duration: number = 500): Promise<void> => {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (_error) {
    console.warn('Haptics not available:', _error);

    // Fallback for web
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }
};
