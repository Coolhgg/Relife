import { expect, test, jest } from '@jest/globals';
/**
 * Unit tests for usePushNotifications hook
 * Tests push notification management, permissions, and messaging
 */

import { renderHook, act } from '@testing-library/react';
import { usePushNotifications } from '../usePushNotifications';

// Mock Capacitor Push Notifications plugin
const mockPushNotifications = {
  requestPermissions: jest.fn(),
  checkPermissions: jest.fn(),
  register: jest.fn(),
  getDeliveredNotifications: jest.fn(),
  removeDeliveredNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  createChannel: jest.fn(),
  deleteChannel: jest.fn(),
  listChannels: jest.fn(),
  addListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Mock Capacitor core
const mockCapacitor = {
  isNativePlatform: jest.fn(() => true),
  getPlatform: jest.fn(() => 'ios'),
  isPluginAvailable: jest.fn(() => true),
};

// Mock modules
jest.mock('@capacitor/push-notifications', () => ({
  PushNotifications: mockPushNotifications,
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor,
}));

// Mock service worker registration for web platform
const mockServiceWorkerRegistration = {
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn(),
    permissionState: jest.fn(),
  },
};

global.navigator = {
  ...global.navigator,
  serviceWorker: {
    ready: Promise.resolve(mockServiceWorkerRegistration),
    register: jest.fn(),
  } as any,
};

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock responses
    mockPushNotifications.checkPermissions.mockResolvedValue({
      receive: 'granted',
      alert: 'granted',
      badge: 'granted',
      sound: 'granted',
    });

    mockPushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
      alert: 'granted',
      badge: 'granted',
      sound: 'granted',
    });

    mockPushNotifications.register.mockResolvedValue(undefined);

    mockPushNotifications.getDeliveredNotifications.mockResolvedValue({
      notifications: [],
    });

    mockPushNotifications.listChannels.mockResolvedValue({
      channels: [],
    });

    mockPushNotifications.addListener.mockReturnValue({
      remove: jest.fn(),
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.permission).toBeNull();
    expect(result.current.isRegistered).toBe(false);
  });

  it('should check permissions on mount', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockPushNotifications.checkPermissions).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.permission).toEqual({
      receive: 'granted',
      alert: 'granted',
      badge: 'granted',
      sound: 'granted',
    });
  });

  it('should request permissions when needed', async () => {
    mockPushNotifications.checkPermissions.mockResolvedValue({
      receive: 'prompt',
    });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const granted = await result.current.requestPermission();
      expect(granted).toBe(true);
    });

    expect(mockPushNotifications.requestPermissions).toHaveBeenCalledTimes(1);
    expect(result.current.permission?.receive).toBe('granted');
  });

  it('should handle permission denial', async () => {
    mockPushNotifications.requestPermissions.mockResolvedValue({
      receive: 'denied',
    });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const granted = await result.current.requestPermission();
      expect(granted).toBe(false);
    });

    expect(result.current.permission?.receive).toBe('denied');
  });

  it('should register for push notifications', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.register();
    });

    expect(mockPushNotifications.register).toHaveBeenCalledTimes(1);
    expect(result.current.isRegistered).toBe(true);
  });

  it('should handle registration events', async () => {
    const onRegistered = jest.fn();
    const onRegistrationError = jest.fn();

    renderHook(() =>
      usePushNotifications({
        onRegistered,
        onRegistrationError,
      })
    );

    // Simulate successful registration
    const registrationListener = mockPushNotifications.addListener.mock.calls.find(
      call => call[0] === 'registration'
    )?.[1];

    await act(async () => {
      registrationListener?.({ value: 'test-token-123' });
    });

    expect(onRegistered).toHaveBeenCalledWith('test-token-123');

    // Simulate registration error
    const errorListener = mockPushNotifications.addListener.mock.calls.find(
      call => call[0] === 'registrationError'
    )?.[1];

    await act(async () => {
      errorListener?.({ error: 'Registration failed' });
    });

    expect(onRegistrationError).toHaveBeenCalledWith('Registration failed');
  });

  it('should handle received notifications', async () => {
    const onNotificationReceived = jest.fn();

    renderHook(() =>
      usePushNotifications({
        onNotificationReceived,
      })
    );

    const notificationListener = mockPushNotifications.addListener.mock.calls.find(
      call => call[0] === 'pushNotificationReceived'
    )?.[1];

    const notification = {
      title: 'Test Notification',
      body: 'This is a test',
      data: { alarmId: '123' },
    };

    await act(async () => {
      notificationListener?.(notification);
    });

    expect(onNotificationReceived).toHaveBeenCalledWith(notification);
  });

  it('should handle notification action performed', async () => {
    const onNotificationActionPerformed = jest.fn();

    renderHook(() =>
      usePushNotifications({
        onNotificationActionPerformed,
      })
    );

    const actionListener = mockPushNotifications.addListener.mock.calls.find(
      call => call[0] === 'pushNotificationActionPerformed'
    )?.[1];

    const actionData = {
      actionId: 'dismiss',
      notification: {
        title: 'Test Alarm',
        body: 'Time to wake up!',
      },
    };

    await act(async () => {
      actionListener?.(actionData);
    });

    expect(onNotificationActionPerformed).toHaveBeenCalledWith(actionData);
  });

  it('should get delivered notifications', async () => {
    mockPushNotifications.getDeliveredNotifications.mockResolvedValue({
      notifications: [
        { id: '1', title: 'Test 1', body: 'Body 1' },
        { id: '2', title: 'Test 2', body: 'Body 2' },
      ],
    });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const delivered = await result.current.getDeliveredNotifications();

      expect(delivered).toHaveLength(2);
      expect(delivered[0]).toMatchObject({
        id: '1',
        title: 'Test 1',
      });
    });

    expect(mockPushNotifications.getDeliveredNotifications).toHaveBeenCalledTimes(1);
  });

  it('should remove delivered notifications', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.removeDeliveredNotifications(['1', '2']);
    });

    expect(mockPushNotifications.removeDeliveredNotifications).toHaveBeenCalledWith({
      notifications: [{ id: '1' }, { id: '2' }],
    });
  });

  it('should clear all delivered notifications', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.clearAllDeliveredNotifications();
    });

    expect(mockPushNotifications.removeAllDeliveredNotifications).toHaveBeenCalledTimes(
      1
    );
  });

  it('should manage notification channels on Android', async () => {
    mockCapacitor.getPlatform.mockReturnValue('android');

    const { result } = renderHook(() => usePushNotifications());

    const channel = {
      id: 'alarms',
      name: 'Alarm Notifications',
      description: 'Notifications for alarms',
      sound: 'alarm.wav',
      importance: 4,
      vibration: true,
      lights: true,
    };

    await act(async () => {
      await result.current.createNotificationChannel(channel);
    });

    expect(mockPushNotifications.createChannel).toHaveBeenCalledWith(channel);
  });

  it('should list notification channels', async () => {
    mockPushNotifications.listChannels.mockResolvedValue({
      channels: [
        { id: 'default', name: 'Default' },
        { id: 'alarms', name: 'Alarms' },
      ],
    });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const channels = await result.current.getNotificationChannels();

      expect(channels).toHaveLength(2);
      expect(channels[0]).toMatchObject({
        id: 'default',
        name: 'Default',
      });
    });

    expect(mockPushNotifications.listChannels).toHaveBeenCalledTimes(1);
  });

  it('should delete notification channels', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.deleteNotificationChannel('old-channel');
    });

    expect(mockPushNotifications.deleteChannel).toHaveBeenCalledWith({
      id: 'old-channel',
    });
  });

  it('should handle web platform gracefully', async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(false);
    mockCapacitor.getPlatform.mockReturnValue('web');

    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-key',
        auth: 'test-auth',
      },
    };

    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
    mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(
      mockSubscription
    );
    mockServiceWorkerRegistration.pushManager.permissionState.mockResolvedValue(
      'granted'
    );

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.register();
    });

    expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockPushNotifications.register.mockRejectedValue(new Error('Registration failed'));

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.error).toBe('Registration failed');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Push notification registration failed:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should clean up listeners on unmount', () => {
    const mockRemove = jest.fn();
    mockPushNotifications.addListener.mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = renderHook(() => usePushNotifications());

    unmount();

    expect(mockRemove).toHaveBeenCalled();
    expect(mockPushNotifications.removeAllListeners).toHaveBeenCalled();
  });

  it('should handle permission state changes', async () => {
    const onPermissionChanged = jest.fn();

    const { result } = renderHook(() =>
      usePushNotifications({
        onPermissionChanged,
      })
    );

    await act(async () => {
      // Initial permission check
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate permission change (e.g., user revoked in settings)
    mockPushNotifications.checkPermissions.mockResolvedValue({
      receive: 'denied',
    });

    await act(async () => {
      await result.current.checkPermission();
    });

    expect(onPermissionChanged).toHaveBeenCalledWith({
      receive: 'denied',
    });
  });

  it('should validate notification payload format', async () => {
    const onNotificationReceived = jest.fn();

    renderHook(() =>
      usePushNotifications({
        onNotificationReceived,
      })
    );

    const notificationListener = mockPushNotifications.addListener.mock.calls.find(
      call => call[0] === 'pushNotificationReceived'
    )?.[1];

    // Valid notification
    const validNotification = {
      title: 'Valid',
      body: 'This is valid',
      data: { key: 'value' },
    };

    await act(async () => {
      notificationListener?.(validNotification);
    });

    expect(onNotificationReceived).toHaveBeenCalledWith(validNotification);

    // Invalid notification (missing required fields)
    onNotificationReceived.mockClear();
    const invalidNotification = {
      data: { key: 'value' },
      // Missing title and body
    };

    await act(async () => {
      notificationListener?.(invalidNotification);
    });

    // Should still call handler but potentially with default values
    expect(onNotificationReceived).toHaveBeenCalled();
  });
});
