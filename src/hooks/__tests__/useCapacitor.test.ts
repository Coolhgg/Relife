import { expect, test, jest } from '@jest/globals';
/**
 * Unit tests for useCapacitor hook
 * Tests native mobile integration via Capacitor plugins
 */

import { renderHook, act } from '@testing-library/react';
import { useCapacitor } from '../useCapacitor';

// Mock Capacitor plugins
const mockDevice = {
  getInfo: jest.fn(),
  getBatteryInfo: jest.fn(),
};

const mockHaptics = {
  impact: jest.fn(),
  vibrate: jest.fn(),
  selectionStart: jest.fn(),
  selectionChanged: jest.fn(),
  selectionEnd: jest.fn(),
};

const mockLocalNotifications = {
  schedule: jest.fn(),
  getPending: jest.fn(),
  cancel: jest.fn(),
  areEnabled: jest.fn(),
  requestPermissions: jest.fn(),
};

const mockPreferences = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
};

// Mock Capacitor core and plugins
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => true),
    getPlatform: jest.fn(() => 'ios'),
    isPluginAvailable: jest.fn(() => true),
  },
}));

jest.mock('@capacitor/device', () => ({
  Device: mockDevice,
}));

jest.mock('@capacitor/haptics', () => ({
  Haptics: mockHaptics,
}));

jest.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: mockLocalNotifications,
}));

jest.mock('@capacitor/preferences', () => ({
  Preferences: mockPreferences,
}));

describe('useCapacitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock responses
    mockDevice.getInfo.mockResolvedValue({
      model: 'iPhone',
      platform: 'ios',
      osVersion: '15.0',
      manufacturer: 'Apple',
      isVirtual: false,
    });

    mockDevice.getBatteryInfo.mockResolvedValue({
      batteryLevel: 0.75,
      isCharging: false,
    });

    mockLocalNotifications.areEnabled.mockResolvedValue({ value: true });
    mockLocalNotifications.requestPermissions.mockResolvedValue({ display: 'granted' });
    mockLocalNotifications.getPending.mockResolvedValue({ notifications: [] });

    mockPreferences.get.mockResolvedValue({ value: null });
  });

  it('should initialize with correct platform detection', async () => {
    const { result } = renderHook(() => useCapacitor());

    expect(result.current.isNative).toBe(true);
    expect(result.current.platform).toBe('ios');
  });

  it('should get device information', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      const deviceInfo = await result.current.getDeviceInfo();

      expect(deviceInfo).toEqual({
        model: 'iPhone',
        platform: 'ios',
        osVersion: '15.0',
        manufacturer: 'Apple',
        isVirtual: false,
      });
    });

    expect(mockDevice.getInfo).toHaveBeenCalledTimes(1);
  });

  it('should get battery information', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      const batteryInfo = await result.current.getBatteryInfo();

      expect(batteryInfo).toEqual({
        batteryLevel: 0.75,
        isCharging: false,
      });
    });

    expect(mockDevice.getBatteryInfo).toHaveBeenCalledTimes(1);
  });

  it('should handle haptic feedback', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      await result.current.hapticImpact('medium');
    });

    expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'medium' });
  });

  it('should handle different haptic feedback styles', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      await result.current.hapticImpact('light');
    });
    expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'light' });

    await act(async () => {
      await result.current.hapticImpact('heavy');
    });
    expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'heavy' });
  });

  it('should handle vibration', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      await result.current.vibrate(500);
    });

    expect(mockHaptics.vibrate).toHaveBeenCalledWith({ duration: 500 });
  });

  it('should schedule local notifications', async () => {
    const { result } = renderHook(() => useCapacitor());

    const notification = {
      title: 'Alarm',
      body: 'Time to wake up!',
      id: 1,
      schedule: { at: new Date(Date.now() + 60000) },
    };

    await act(async () => {
      await result.current.scheduleNotification(notification);
    });

    expect(mockLocalNotifications.schedule).toHaveBeenCalledWith({
      notifications: [notification],
    });
  });

  it('should get pending notifications', async () => {
    mockLocalNotifications.getPending.mockResolvedValue({
      notifications: [{ id: 1, title: 'Test Notification' }],
    });

    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      const pending = await result.current.getPendingNotifications();

      expect(pending).toEqual([{ id: 1, title: 'Test Notification' }]);
    });

    expect(mockLocalNotifications.getPending).toHaveBeenCalledTimes(1);
  });

  it('should cancel notifications', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      await result.current.cancelNotifications([1, 2, 3]);
    });

    expect(mockLocalNotifications.cancel).toHaveBeenCalledWith({
      notifications: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });
  });

  it('should check and request notification permissions', async () => {
    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      const hasPermission = await result.current.hasNotificationPermission();
      expect(hasPermission).toBe(true);
    });

    expect(mockLocalNotifications.areEnabled).toHaveBeenCalledTimes(1);

    await act(async () => {
      const granted = await result.current.requestNotificationPermission();
      expect(granted).toBe(true);
    });

    expect(mockLocalNotifications.requestPermissions).toHaveBeenCalledTimes(1);
  });

  it('should handle preferences storage', async () => {
    const { result } = renderHook(() => useCapacitor());

    // Set preference
    await act(async () => {
      await result.current.setPreference('theme', 'dark');
    });

    expect(mockPreferences.set).toHaveBeenCalledWith({
      key: 'theme',
      value: 'dark',
    });

    // Get preference
    mockPreferences.get.mockResolvedValue({ value: 'dark' });

    await act(async () => {
      const value = await result.current.getPreference('theme');
      expect(value).toBe('dark');
    });

    expect(mockPreferences.get).toHaveBeenCalledWith({ key: 'theme' });

    // Remove preference
    await act(async () => {
      await result.current.removePreference('theme');
    });

    expect(mockPreferences.remove).toHaveBeenCalledWith({ key: 'theme' });
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockDevice.getInfo.mockRejectedValue(new Error('Device info failed'));

    const { result } = renderHook(() => useCapacitor());

    await act(async () => {
      const deviceInfo = await result.current.getDeviceInfo();
      expect(deviceInfo).toBeNull();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to get device info:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle web platform gracefully', async () => {
    // Mock web platform
    const mockCapacitor = {
      isNativePlatform: jest.fn(() => false),
      getPlatform: jest.fn(() => 'web'),
      isPluginAvailable: jest.fn(() => false),
    };

    jest.doMock('@capacitor/core', () => ({
      Capacitor: mockCapacitor,
    }));

    const { result } = renderHook(() => useCapacitor());

    expect(result.current.isNative).toBe(false);
    expect(result.current.platform).toBe('web');

    // Web platform should handle haptic feedback gracefully
    await act(async () => {
      await result.current.hapticImpact('medium');
    });

    // Should not crash on web platform
    expect(result.current.isNative).toBe(false);
  });

  it('should handle plugin availability checks', async () => {
    const { result } = renderHook(() => useCapacitor());

    expect(result.current.isPluginAvailable('Device')).toBe(true);
    expect(result.current.isPluginAvailable('Haptics')).toBe(true);
    expect(result.current.isPluginAvailable('LocalNotifications')).toBe(true);
  });

  it('should batch notification operations efficiently', async () => {
    const { result } = renderHook(() => useCapacitor());

    const notifications = [
      { id: 1, title: 'Alarm 1', body: 'First alarm' },
      { id: 2, title: 'Alarm 2', body: 'Second alarm' },
      { id: 3, title: 'Alarm 3', body: 'Third alarm' },
    ];

    await act(async () => {
      await result.current.scheduleMultipleNotifications(notifications);
    });

    expect(mockLocalNotifications.schedule).toHaveBeenCalledWith({
      notifications: notifications,
    });
  });
});
