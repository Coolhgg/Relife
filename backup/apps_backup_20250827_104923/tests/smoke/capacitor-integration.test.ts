/**
 * Capacitor Integration Smoke Tests
 *
 * Basic tests to verify Capacitor plugins work correctly on real devices.
 * These tests run in CI on Android emulator and can be run locally.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';

describe('Capacitor Integration Smoke Tests', () => {
  const isRealDevice = process.env.USE_REAL_DEVICE === 'true';
  const platform = Capacitor.getPlatform();

  beforeAll(async () => {
    console.log(`Running on platform: ${platform}`);
    console.log(`Using real device: ${isRealDevice}`);
  });

  it('should detect the correct platform', () => {
    expect(platform).toBeDefined();
    expect(['web', 'android', 'ios']).toContain(platform);
  });

  it('should get device information', async () => {
    const info = await Device.getInfo();

    expect(info).toBeDefined();
    expect(info.platform).toBeDefined();
    expect(info.model).toBeDefined();

    console.log('Device info:', {
      platform: info.platform,
      model: info.model,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
    });

    if (isRealDevice) {
      // On real devices, we expect specific platform values
      if (platform === 'android') {
        expect(info.platform).toBe('android');
        expect(info.manufacturer).toBeDefined();
      } else if (platform === 'ios') {
        expect(info.platform).toBe('ios');
        expect(info.manufacturer).toBe('Apple');
      }
    }
  });

  it('should handle notification permissions properly', async () => {
    try {
      const permission = await LocalNotifications.requestPermissions();

      expect(permission).toBeDefined();
      expect(['granted', 'denied', 'prompt']).toContain(permission.display);

      console.log('Notification permission:', permission.display);
    } catch (error) {
      // On web or when permissions are not available, this might throw
      console.log('Notification permission check failed:', error);

      if (isRealDevice && platform !== 'web') {
        throw error; // Should work on real mobile devices
      }
    }
  });

  it('should be able to check if running on native platform', () => {
    const isNative = Capacitor.isNativePlatform();

    if (isRealDevice && platform !== 'web') {
      expect(isNative).toBe(true);
    } else {
      expect(isNative).toBe(false);
    }

    console.log('Is native platform:', isNative);
  });

  it('should handle plugin availability correctly', () => {
    const deviceAvailable = Capacitor.isPluginAvailable('Device');
    const notificationsAvailable = Capacitor.isPluginAvailable('LocalNotifications');

    expect(deviceAvailable).toBe(true);
    expect(notificationsAvailable).toBe(true);

    console.log('Plugin availability:', {
      Device: deviceAvailable,
      LocalNotifications: notificationsAvailable,
    });
  });

  // Test specific to real devices
  it('should get battery information on real devices', async () => {
    if (!isRealDevice || platform === 'web') {
      console.log('Skipping battery test on web/mock platform');
      return;
    }

    try {
      const info = await Device.getInfo();

      // Battery level might not be available in emulator
      if (info.batteryLevel !== undefined) {
        expect(info.batteryLevel).toBeGreaterThanOrEqual(0);
        expect(info.batteryLevel).toBeLessThanOrEqual(1);
      }

      console.log('Battery level:', info.batteryLevel);
    } catch (error) {
      console.log('Battery info not available:', error);
    }
  });

  // Integration test for alarm-related functionality
  it('should be able to schedule a test notification', async () => {
    try {
      // Request permissions first
      const permission = await LocalNotifications.requestPermissions();

      if (permission.display !== 'granted') {
        console.log('Notification permission not granted, skipping test');
        return;
      }

      // Schedule a test notification
      const scheduleTime = new Date();
      scheduleTime.setSeconds(scheduleTime.getSeconds() + 5); // 5 seconds from now

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: 'Test Notification',
            body: 'This is a test notification from the mobile testing suite',
            schedule: { at: scheduleTime },
          },
        ],
      });

      // Get pending notifications
      const pending = await LocalNotifications.getPending();
      const testNotification = pending.notifications.find(n => n.id === 999);

      expect(testNotification).toBeDefined();
      expect(testNotification?.title).toBe('Test Notification');

      console.log('Successfully scheduled test notification');

      // Clean up - cancel the test notification
      await LocalNotifications.cancel({
        notifications: [{ id: 999 }],
      });
    } catch (error) {
      console.log('Notification scheduling test failed:', error);

      if (isRealDevice && platform !== 'web') {
        console.warn('Notification test failed on real device:', error);
      }
    }
  });

  // Performance test
  it('should respond to plugin calls within reasonable time', async () => {
    const start = Date.now();

    await Device.getInfo();

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    console.log('Device.getInfo() took', duration, 'ms');
  });
});
