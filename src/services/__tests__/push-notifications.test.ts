import { PushNotificationService } from '../push-notifications';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor and its plugins
jest.mock('@capacitor/core');
jest.mock('@capacitor/preferences');
jest.mock('@capacitor/push-notifications');

// Mock window.Notification
const mockNotification = {
  requestPermission: jest.fn(),
  permission: 'default' as NotificationPermission
};

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true
});

// Mock ServiceWorker
const mockServiceWorker = {
  ready: Promise.resolve({
    pushManager: {
      getSubscription: jest.fn(),
      subscribe: jest.fn()
    }
  })
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
});

describe('PushNotificationService', () => {
  const mockAlarm = {
    id: 'test-alarm-1',
    userId: 'user-1',
    time: '07:00',
    label: 'Morning Alarm',
    days: [1, 2, 3, 4, 5],
    voiceMood: 'motivational' as const,
    enabled: true,
    isActive: true,
    dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    sound: 'default',
    difficulty: 'medium',
    snoozeEnabled: true,
    snoozeInterval: 5,
    snoozeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    (PushNotificationService as any).isInitialized = false;
    (PushNotificationService as any).hasPermission = false;
    (PushNotificationService as any).currentToken = null;
    
    // Setup default mocks
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');
    
    (Preferences.get as jest.Mock).mockResolvedValue({ value: null });
    (Preferences.set as jest.Mock).mockResolvedValue();
    
    (PushNotifications.requestPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });
    (PushNotifications.register as jest.Mock).mockResolvedValue();
    (PushNotifications.addListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
  });

  describe('initialize', () => {
    it('should initialize successfully on web platform', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const result = await PushNotificationService.initialize();
      
      expect(result).toBe(true);
      expect(PushNotificationService.hasPermission()).toBe(true);
    });

    it('should initialize successfully on native platform', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      
      const result = await PushNotificationService.initialize();
      
      expect(result).toBe(true);
      expect(PushNotifications.requestPermissions).toHaveBeenCalled();
      expect(PushNotifications.register).toHaveBeenCalled();
    });

    it('should handle initialization failure gracefully', async () => {
      mockNotification.requestPermission.mockRejectedValue(new Error('Permission denied'));
      
      const result = await PushNotificationService.initialize();
      
      expect(result).toBe(false);
      expect(PushNotificationService.hasPermission()).toBe(false);
    });

    it('should not re-initialize if already initialized', async () => {
      // First initialization
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
      
      // Second initialization should return cached result
      const result = await PushNotificationService.initialize();
      
      expect(result).toBe(true);
      expect(mockNotification.requestPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings management', () => {
    it('should load default settings', () => {
      const settings = PushNotificationService.getSettings();
      
      expect(settings).toMatchObject({
        enabled: true,
        alarmReminders: true,
        dailyMotivation: true,
        weeklyProgress: true,
        systemUpdates: true,
        emergencyAlerts: true,
        soundEnabled: true,
        vibrationEnabled: true,
        badgeCount: true
      });
    });

    it('should load saved settings from preferences', async () => {
      const savedSettings = {
        enabled: false,
        alarmReminders: false,
        dailyMotivation: false
      };
      
      (Preferences.get as jest.Mock).mockResolvedValue({ 
        value: JSON.stringify(savedSettings) 
      });
      
      await PushNotificationService.initialize();
      
      const settings = PushNotificationService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.alarmReminders).toBe(false);
      expect(settings.dailyMotivation).toBe(false);
    });

    it('should update settings and save to preferences', async () => {
      await PushNotificationService.initialize();
      
      const newSettings = {
        alarmReminders: false,
        dailyMotivation: false
      };
      
      await PushNotificationService.updateSettings(newSettings);
      
      const settings = PushNotificationService.getSettings();
      expect(settings.alarmReminders).toBe(false);
      expect(settings.dailyMotivation).toBe(false);
      
      expect(Preferences.set).toHaveBeenCalledWith({
        key: 'push_settings',
        value: JSON.stringify(expect.objectContaining(newSettings))
      });
    });
  });

  describe('notification scheduling', () => {
    beforeEach(async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
    });

    it('should schedule alarm push notification', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.scheduleAlarmPush(mockAlarm);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.objectContaining({
          title: '🔔 Morning Alarm',
          body: 'Your alarm is ready to wake you up!'
        }),
        expect.any(Date)
      );
      
      consoleSpy.mockRestore();
    });

    it('should not schedule if no permission', async () => {
      // Override permission
      (PushNotificationService as any).hasPermission = false;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.scheduleAlarmPush(mockAlarm);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.any(Object),
        expect.any(Date)
      );
      
      consoleSpy.mockRestore();
    });

    it('should not schedule if alarm reminders disabled', async () => {
      await PushNotificationService.updateSettings({ alarmReminders: false });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.scheduleAlarmPush(mockAlarm);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.any(Object),
        expect.any(Date)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('daily motivation', () => {
    beforeEach(async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
    });

    it('should send daily motivation notification', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.sendDailyMotivation('Stay motivated!');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.objectContaining({
          title: '💪 Daily Motivation',
          body: 'Stay motivated!'
        }),
        undefined
      );
      
      consoleSpy.mockRestore();
    });

    it('should not send if daily motivation disabled', async () => {
      await PushNotificationService.updateSettings({ dailyMotivation: false });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.sendDailyMotivation('Stay motivated!');
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.any(Object),
        expect.any(Date)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('weekly progress', () => {
    beforeEach(async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
    });

    it('should send weekly progress notification', async () => {
      const stats = {
        alarmsTriggered: 12,
        streak: 5,
        averageWakeTime: '7:15 AM',
        improvementTrend: 'up'
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.sendWeeklyProgress(stats);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.objectContaining({
          title: '📊 Weekly Progress',
          body: 'You've completed 12 alarms this week! '
        }),
        undefined
      );
      
      consoleSpy.mockRestore();
    });

    it('should not send if weekly progress disabled', async () => {
      await PushNotificationService.updateSettings({ weeklyProgress: false });
      
      const stats = { alarmsTriggered: 12, streak: 5 };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await PushNotificationService.sendWeeklyProgress(stats);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.any(Object),
        expect.any(Date)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('quiet hours', () => {
    beforeEach(async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
    });

    it('should respect quiet hours for motivation notifications', async () => {
      // Set quiet hours from 10 PM to 7 AM
      await PushNotificationService.updateSettings({
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00'
        }
      });

      // Mock current time to be midnight (within quiet hours)
      const mockDate = new Date('2024-01-01T00:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await PushNotificationService.sendDailyMotivation('Good morning!');

      // Should not send during quiet hours
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.any(Object),
        expect.any(Date)
      );

      consoleSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('emergency alerts', () => {
    beforeEach(async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
    });

    it('should send emergency alert even during quiet hours', async () => {
      // Set quiet hours
      await PushNotificationService.updateSettings({
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00'
        }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await PushNotificationService.sendEmergencyAlert('Critical Alert', 'This is urgent!');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.objectContaining({
          title: '🚨 Critical Alert',
          body: 'This is urgent!'
        }),
        undefined
      );

      consoleSpy.mockRestore();
    });
  });

  describe('test notifications', () => {
    beforeEach(async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      await PushNotificationService.initialize();
    });

    it('should send test notification', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await PushNotificationService.testPushNotification();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Scheduling push notification:',
        expect.objectContaining({
          title: '🔔 Test Notification',
          body: 'This is a test push notification from Relife Alarm!'
        }),
        undefined
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle permission request errors gracefully', async () => {
      mockNotification.requestPermission.mockRejectedValue(new Error('User denied permission'));

      const result = await PushNotificationService.initialize();

      expect(result).toBe(false);
      expect(PushNotificationService.hasPermission()).toBe(false);
    });

    it('should handle notification sending errors gracefully', async () => {
      await PushNotificationService.initialize();

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock sendPushToServer to throw an error
      const originalMethod = (PushNotificationService as any).sendPushToServer;
      (PushNotificationService as any).sendPushToServer = jest.fn().mockRejectedValue(new Error('Network error'));

      await PushNotificationService.sendDailyMotivation('Test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sending daily motivation:',
        expect.any(Error)
      );

      // Restore original method
      (PushNotificationService as any).sendPushToServer = originalMethod;
      consoleSpy.mockRestore();
    });

    it('should handle settings update errors gracefully', async () => {
      await PushNotificationService.initialize();

      (Preferences.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await PushNotificationService.updateSettings({ enabled: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving push settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('web push integration', () => {
    beforeEach(() => {
      // Mock web push manager
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth'
        }
      };

      mockServiceWorker.ready = Promise.resolve({
        pushManager: {
          getSubscription: jest.fn().mockResolvedValue(null),
          subscribe: jest.fn().mockResolvedValue(mockSubscription)
        }
      });
    });

    it('should register for web push notifications', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');

      await PushNotificationService.initialize();

      expect(mockServiceWorker.ready).toHaveBeenCalled();
    });
  });
});

describe('PushNotificationService - Integration Tests', () => {
  let eventListeners: { [key: string]: EventListener[] } = {};

  beforeEach(() => {
    eventListeners = {};
    
    // Mock addEventListener and dispatchEvent
    jest.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(listener as EventListener);
    });

    jest.spyOn(window, 'dispatchEvent').mockImplementation((event) => {
      const listeners = eventListeners[event.type] || [];
      listeners.forEach(listener => listener(event));
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle custom events correctly', async () => {
    mockNotification.requestPermission.mockResolvedValue('granted');
    await PushNotificationService.initialize();

    const instance = PushNotificationService.getInstance();

    // Simulate alarm triggered event
    const alarmTriggeredEvent = new CustomEvent('alarm-triggered', {
      detail: { alarmId: 'test-alarm' }
    });

    window.dispatchEvent(alarmTriggeredEvent);

    // Test that the event was handled (this would require more detailed implementation inspection)
    expect(window.addEventListener).toHaveBeenCalledWith('alarm-triggered', expect.any(Function));
  });
});