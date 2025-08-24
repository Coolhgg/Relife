import React from 'react'; // auto: added missing React import
/**
 * Comprehensive Mobile & Capacitor Integration Tests
 *
 * Complete testing suite for all mobile functionality using Capacitor plugins.
 * Tests critical alarm workflows across iOS, Android, and Web platforms.
 *
 * Test Coverage:
 * - All 15+ Capacitor plugins
 * - Cross-platform compatibility (iOS/Android/Web)
 * - Critical alarm flows (schedule, trigger, handle, background execution)
 * - Mobile-specific features (haptics, notifications, permissions, background mode)
 * - Error handling and edge cases
 * - Performance characteristics under mobile constraints
 * - Real-world mobile scenarios (network loss, battery optimization, permissions)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Import app and services
import App from '../../src/App';
import { CapacitorEnhancedService } from '../../src/services/capacitor-enhanced';

// Import comprehensive mock system
import {
  _mockCapacitorSetup,
  Capacitor,
  Device,
  LocalNotifications,
  PushNotifications,
  Haptics,
  Geolocation,
  Preferences,
  StatusBar,
  SplashScreen,
  App as CapApp,
  Network,
  Badge,
  BackgroundMode,
  KeepAwake,
  Camera,
  Filesystem,
  Keyboard,
  Browser,
  Share,
} from '../../src/__tests__/mocks/capacitor.mock';

// Import mobile test utilities
import { createMobileTestHelper, mobileTestUtils } from '../utils/mobile-test-helpers';

// Global test setup
let container: HTMLElement;
let user: ReturnType<typeof userEvent.setup>;
let mobileHelper: ReturnType<typeof createMobileTestHelper>;
let capacitorService: CapacitorEnhancedService;

describe('Mobile & Capacitor Comprehensive Integration Tests', () => {
  beforeEach(async () => {
    // Reset all mocks and state
    _mockCapacitorSetup.reset();
    vi.clearAllMocks();

    // Initialize test utilities
    user = userEvent.setup();
    mobileHelper = createMobileTestHelper();
    capacitorService = CapacitorEnhancedService.getInstance();

    // Set up default mobile environment
    _mockCapacitorSetup.setPlatform('ios');
    _mockCapacitorSetup.setPermission('notifications', 'granted');
    _mockCapacitorSetup.setPermission('camera', 'granted');
    _mockCapacitorSetup.setPermission('location', 'granted');
  });

  afterEach(() => {
    if (container) container.remove();
    mobileHelper.reset();
    _mockCapacitorSetup.reset();
  });

  // ==========================================================================
  // PLATFORM DETECTION AND ADAPTATION TESTS
  // ==========================================================================

  describe('Platform Detection and Adaptation', () => {
    it('should correctly detect and adapt to iOS platform', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setDeviceInfo({
        platform: 'ios',
        model: 'iPhone 13 Pro',
        osVersion: '15.0',
        manufacturer: 'Apple',
      });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Verify iOS-specific adaptations
      await waitFor(() => {
        expect(Capacitor.getPlatform).toHaveBeenCalled();
        expect(Capacitor.isNativePlatform).toHaveBeenCalled();
      });

      // Check for iOS-specific UI elements
      const iosSpecificElements = screen.queryAllByText(/ios|iphone/i);
      expect(iosSpecificElements.length).toBeGreaterThan(0);
    });

    it('should correctly detect and adapt to Android platform', async () => {
      _mockCapacitorSetup.setPlatform('android');
      _mockCapacitorSetup.setDeviceInfo({
        platform: 'android',
        model: 'Pixel 6',
        osVersion: '12',
        manufacturer: 'Google',
      });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Verify Android-specific adaptations
      await waitFor(() => {
        expect(Device.getInfo).toHaveBeenCalled();
      });

      // Check device info retrieval
      const deviceInfo = await Device.getInfo();
      expect(deviceInfo.platform).toBe('android');
      expect(deviceInfo.manufacturer).toBe('Google');
    });

    it('should gracefully degrade on web platform', async () => {
      _mockCapacitorSetup.setPlatform('web');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(Capacitor.isNativePlatform()).toBe(false);
      });

      // Verify web fallbacks are used
      expect(screen.getByText(/web.*mode|browser.*version/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // COMPREHENSIVE ALARM LIFECYCLE TESTS
  // ==========================================================================

  describe('Comprehensive Alarm Lifecycle on Mobile', () => {
    it('should handle complete alarm workflow with mobile features', async () => {
      // Set up mobile environment
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setPermission('notifications', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // 1. Schedule alarm with mobile-specific features
      const alarmTime = new Date(Date.now() + 60000); // 1 minute from now
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Mobile Test Alarm',
        body: 'Testing complete mobile alarm flow',
        schedule: { at: alarmTime },
        sound: 'custom-alarm.wav',
        extra: { hapticPattern: 'alarm', wakeDevice: true },
      });

      // Verify alarm scheduled
      expect(alarmId).toBeDefined();
      expect(LocalNotifications.schedule).toHaveBeenCalled();

      // 2. Verify badge count updated
      await waitFor(() => {
        expect(Badge.set).toHaveBeenCalledWith({ count: 1 });
      });

      // 3. Trigger alarm
      await mobileHelper.alarms.trigger(alarmId);

      // 4. Verify mobile-specific alarm handling
      await waitFor(() => {
        // Check wake lock activated
        expect(KeepAwake.keepAwake).toHaveBeenCalled();

        // Check haptic feedback triggered
        expect(Haptics.impact).toHaveBeenCalledWith({ style: 'HEAVY' });

        // Check background mode enabled
        expect(BackgroundMode.enable).toHaveBeenCalled();
      });

      // 5. Test alarm interaction (snooze)
      await mobileHelper.alarms.snooze(alarmId, 5);

      // 6. Verify snooze handling
      const scheduledAlarms = mobileHelper.alarms.getScheduled();
      const snoozeAlarm = scheduledAlarms.find(
        a => a.extra?.originalAlarmId === alarmId
      );
      expect(snoozeAlarm).toBeDefined();
      expect(snoozeAlarm?.extra?.snoozed).toBe(true);

      // 7. Verify alarm history
      const history = mobileHelper.alarms.getHistory();
      expect(
        history.find(h => h.id === alarmId && h.action === 'triggered')
      ).toBeDefined();
    });

    it('should handle recurring alarms across platform switches', async () => {
      const platforms: Array<'ios' | 'android' | 'web'> = ['ios', 'android', 'web'];

      for (const platform of platforms) {
        _mockCapacitorSetup.setPlatform(platform);

        // Schedule recurring alarm
        const alarmId = await mobileHelper.alarms.schedule({
          title: `${platform} Recurring Alarm`,
          body: 'Daily recurring alarm test',
          schedule: {
            at: new Date(Date.now() + 60000),
            repeats: true,
            every: 'day',
          },
        });

        // Verify platform-specific handling
        expect(alarmId).toBeDefined();

        if (platform !== 'web') {
          expect(LocalNotifications.schedule).toHaveBeenCalled();
        }
      }
    });

    it('should handle alarm persistence through app lifecycle', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Schedule alarm
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Persistence Test Alarm',
        body: 'Testing alarm persistence',
        schedule: { at: new Date(Date.now() + 60000) },
      });

      // Simulate app going to background
      CapApp._mockAppStateChange(false);

      await waitFor(() => {
        expect(BackgroundMode.enable).toHaveBeenCalled();
      });

      // Simulate app coming back to foreground
      CapApp._mockAppStateChange(true);

      await waitFor(() => {
        expect(Badge.clear).toHaveBeenCalled();
      });

      // Verify alarm still exists
      const scheduledAlarms = mobileHelper.alarms.getScheduled();
      expect(scheduledAlarms.find(a => a.id === alarmId)).toBeDefined();
    });
  });

  // ==========================================================================
  // PERMISSIONS AND SECURITY TESTS
  // ==========================================================================

  describe('Permissions and Security', () => {
    it('should handle notification permission flow', async () => {
      _mockCapacitorSetup.setPlatform('android');
      _mockCapacitorSetup.setPermission('notifications', 'prompt');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Check initial permission state
      expect(await LocalNotifications.checkPermissions()).toEqual({
        display: 'prompt',
      });

      // Request permissions
      await mobileHelper.notifications.requestPermissions();

      // Verify permission request
      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();

      // Grant permissions in mock
      _mockCapacitorSetup.setPermission('notifications', 'granted');

      // Verify alarm scheduling now works
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Permission Test Alarm',
        body: 'Testing after permission grant',
      });

      expect(alarmId).toBeDefined();
    });

    it('should handle denied permissions gracefully', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setPermission('notifications', 'denied');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Try to schedule alarm with denied permissions
      await expect(async () => {
        await mobileHelper.alarms.schedule({
          title: 'Denied Permission Test',
          body: 'This should fail',
        });
      }).rejects.toThrow(/permission/i);

      // Verify error handling UI
      await waitFor(() => {
        expect(
          screen.getByText(/permission.*denied|enable.*notification/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle location permissions for location-based alarms', async () => {
      _mockCapacitorSetup.setPlatform('android');
      _mockCapacitorSetup.setPermission('location', 'granted');
      _mockCapacitorSetup.setDeviceInfo({ platform: 'android' });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Set mock location
      Geolocation._mockSetPosition(37.7749, -122.4194, 10);

      // Get current position for location-based alarm
      const position = await Geolocation.getCurrentPosition();

      expect(position.coords.latitude).toBe(37.7749);
      expect(position.coords.longitude).toBe(-122.4194);

      // Schedule location-based alarm
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Location Alarm',
        body: 'Alarm triggered by location',
        extra: {
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radius: 100,
          },
        },
      });

      expect(alarmId).toBeDefined();
      expect(Geolocation.checkPermissions).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // BACKGROUND EXECUTION AND RELIABILITY TESTS
  // ==========================================================================

  describe('Background Execution and Reliability', () => {
    it('should maintain alarm reliability in background mode', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test background mode activation
      await mobileHelper.background.enableBackgroundMode();

      expect(BackgroundMode.enable).toHaveBeenCalled();
      expect(await BackgroundMode.isEnabled()).toEqual({ enabled: true });

      // Schedule alarm
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Background Test Alarm',
        body: 'Testing background execution',
        schedule: { at: new Date(Date.now() + 1000) },
      });

      // Simulate app going to background
      CapApp._mockAppStateChange(false);

      // Trigger alarm in background
      await mobileHelper.alarms.trigger(alarmId);

      // Verify background handling
      expect(KeepAwake.keepAwake).toHaveBeenCalled();
      expect(Haptics.notification).toHaveBeenCalled();
    });

    it('should handle keep awake during alarm execution', async () => {
      _mockCapacitorSetup.setPlatform('android');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test keep awake functionality
      await mobileHelper.background.keepAwake();

      expect(KeepAwake.keepAwake).toHaveBeenCalled();
      expect(await KeepAwake.isKeptAwake()).toEqual({ kept: true });

      // Schedule and trigger alarm
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Keep Awake Test',
        body: 'Testing screen wake lock',
      });

      await mobileHelper.alarms.trigger(alarmId);

      // Verify wake lock maintained during alarm
      const backgroundState = mobileHelper.background.getState();
      expect(backgroundState?.keepAwakeActive).toBe(true);
    });

    it('should handle background task execution', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      // Test background task
      const taskResult = await mobileHelper.background.runBackgroundTask(
        'alarm-check',
        2000
      );

      expect(taskResult).toBe('alarm-check');
    });
  });

  // ==========================================================================
  // MOBILE UI AND INTERACTION TESTS
  // ==========================================================================

  describe('Mobile UI and Interactions', () => {
    it('should handle haptic feedback patterns', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setDeviceInfo({ platform: 'ios' });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test different haptic patterns
      const hapticTypes: Array<'LIGHT' | 'MEDIUM' | 'HEAVY'> = [
        'LIGHT',
        'MEDIUM',
        'HEAVY',
      ];

      for (const type of hapticTypes) {
        await mobileHelper.haptics.testImpact(type);
        expect(Haptics.impact).toHaveBeenCalledWith({ style: type });
      }

      // Test haptic notifications
      const notificationTypes: Array<'SUCCESS' | 'WARNING' | 'ERROR'> = [
        'SUCCESS',
        'WARNING',
        'ERROR',
      ];

      for (const type of notificationTypes) {
        await mobileHelper.haptics.testNotification(type);
        expect(Haptics.notification).toHaveBeenCalledWith({ type });
      }
    });

    it('should handle status bar customization', async () => {
      _mockCapacitorSetup.setPlatform('android');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test status bar customization
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#667eea' });

      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
      expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#667eea' });

      // Test status bar info
      const statusInfo = await StatusBar.getInfo();
      expect(statusInfo.style).toBe('DARK');
      expect(statusInfo.color).toBe('#667eea');
    });

    it('should handle splash screen management', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test splash screen
      await SplashScreen.show({
        showDuration: 2000,
        fadeInDuration: 500,
        fadeOutDuration: 500,
        autoHide: true,
      });

      expect(SplashScreen.show).toHaveBeenCalled();

      // Test manual hide
      await SplashScreen.hide({ fadeOutDuration: 500 });
      expect(SplashScreen.hide).toHaveBeenCalled();
    });

    it('should handle keyboard interactions', async () => {
      _mockCapacitorSetup.setPlatform('android');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Simulate keyboard events
      Keyboard._mockKeyboardShow();
      await waitFor(() => {
        expect(Keyboard.addListener).toHaveBeenCalledWith(
          'keyboardWillShow',
          expect.any(Function)
        );
      });

      Keyboard._mockKeyboardHide();
      await waitFor(() => {
        expect(Keyboard.addListener).toHaveBeenCalledWith(
          'keyboardWillHide',
          expect.any(Function)
        );
      });
    });
  });

  // ==========================================================================
  // NETWORK AND CONNECTIVITY TESTS
  // ==========================================================================

  describe('Network and Connectivity', () => {
    it('should handle network status changes', async () => {
      _mockCapacitorSetup.setPlatform('android');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test initial network status
      const initialStatus = await Network.getStatus();
      expect(initialStatus.connected).toBe(true);
      expect(initialStatus.connectionType).toBe('wifi');

      // Simulate network loss
      _mockCapacitorSetup.setNetworkStatus({
        connected: false,
        connectionType: 'none',
      });
      Network._mockNetworkChange(false, 'none');

      await waitFor(() => {
        expect(Network.addListener).toHaveBeenCalledWith(
          'networkStatusChange',
          expect.any(Function)
        );
      });

      // Simulate network recovery
      _mockCapacitorSetup.setNetworkStatus({
        connected: true,
        connectionType: 'cellular',
      });
      Network._mockNetworkChange(true, 'cellular');

      const recoveredStatus = await Network.getStatus();
      expect(recoveredStatus.connected).toBe(true);
      expect(recoveredStatus.connectionType).toBe('cellular');
    });

    it('should handle offline alarm functionality', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setNetworkStatus({
        connected: false,
        connectionType: 'none',
      });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Schedule alarm while offline
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Offline Alarm',
        body: 'This alarm should work offline',
      });

      expect(alarmId).toBeDefined();

      // Trigger alarm while offline
      await mobileHelper.alarms.trigger(alarmId);

      // Verify local alarm functionality works
      const history = mobileHelper.alarms.getHistory();
      expect(history.find(h => h.id === alarmId)).toBeDefined();
    });
  });

  // ==========================================================================
  // FILE SYSTEM AND STORAGE TESTS
  // ==========================================================================

  describe('File System and Storage', () => {
    it('should handle alarm sound file management', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      // Test file operations
      const soundFilePath = '/sounds/custom-alarm.wav';
      const soundData = 'mock-audio-binary-data';

      await Filesystem.writeFile({
        path: soundFilePath,
        data: soundData,
        directory: 'Documents',
      });

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: soundFilePath,
        data: soundData,
        directory: 'Documents',
      });

      // Test file reading
      const fileContent = await Filesystem.readFile({ path: soundFilePath });
      expect(fileContent.data).toBe(soundData);

      // Test file deletion
      await Filesystem.deleteFile({ path: soundFilePath });
      expect(Filesystem.deleteFile).toHaveBeenCalledWith({ path: soundFilePath });
    });

    it('should handle preferences storage', async () => {
      _mockCapacitorSetup.setPlatform('android');

      // Test preferences operations
      await Preferences.set({ key: 'alarm-volume', value: '0.8' });
      expect(Preferences.set).toHaveBeenCalledWith({
        key: 'alarm-volume',
        value: '0.8',
      });

      const volume = await Preferences.get({ key: 'alarm-volume' });
      expect(volume.value).toBe('0.8');

      // Test preference removal
      await Preferences.remove({ key: 'alarm-volume' });
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'alarm-volume' });
    });
  });

  // ==========================================================================
  // DEVICE CAPABILITIES AND SENSORS TESTS
  // ==========================================================================

  describe('Device Capabilities and Sensors', () => {
    it('should handle device info and capabilities', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setDeviceInfo({
        platform: 'ios',
        model: 'iPhone 13 Pro Max',
        osVersion: '15.2',
        manufacturer: 'Apple',
        isVirtual: false,
      });

      const deviceInfo = await Device.getInfo();
      expect(deviceInfo.platform).toBe('ios');
      expect(deviceInfo.model).toBe('iPhone 13 Pro Max');
      expect(deviceInfo.manufacturer).toBe('Apple');
      expect(deviceInfo.isVirtual).toBe(false);

      // Test device ID
      const deviceId = await Device.getId();
      expect(deviceId.identifier).toBe('mock-device-id-12345');

      // Test language
      const language = await Device.getLanguageCode();
      expect(language.value).toBe('en');
    });

    it('should handle battery monitoring for alarm optimization', async () => {
      _mockCapacitorSetup.setPlatform('android');
      _mockCapacitorSetup.setBatteryInfo({ batteryLevel: 0.15, isCharging: false });

      const batteryInfo = await Device.getBatteryInfo();
      expect(batteryInfo.batteryLevel).toBe(0.15);
      expect(batteryInfo.isCharging).toBe(false);

      // Test low battery alarm optimization
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Low Battery Alarm',
        body: 'Optimized for low battery',
        extra: { lowBatteryMode: true },
      });

      expect(alarmId).toBeDefined();
    });

    it('should handle camera integration for profile pictures', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setPermission('camera', 'granted');

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: 'uri',
      });

      expect(photo.base64String).toBe('mock-base64-image-data');
      expect(photo.format).toBe('jpeg');
      expect(Camera.getPhoto).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SOCIAL FEATURES AND SHARING TESTS
  // ==========================================================================

  describe('Social Features and Sharing', () => {
    it('should handle alarm sharing functionality', async () => {
      _mockCapacitorSetup.setPlatform('android');

      // Test share capability
      const canShare = await Share.canShare();
      expect(canShare.value).toBe(true);

      // Test sharing alarm
      await Share.share({
        title: 'Check out my alarm setup!',
        text: "I'm using Relife Alarm for better wake-ups",
        url: 'https://relife-alarm.com/share/alarm-config',
        files: [],
      });

      expect(Share.share).toHaveBeenCalledWith({
        title: 'Check out my alarm setup!',
        text: "I'm using Relife Alarm for better wake-ups",
        url: 'https://relife-alarm.com/share/alarm-config',
        files: [],
      });
    });

    it('should handle browser integration for help and support', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      // Test in-app browser
      await Browser.open({
        url: 'https://relife-alarm.com/help',
        windowName: '_system',
      });

      expect(Browser.open).toHaveBeenCalledWith({
        url: 'https://relife-alarm.com/help',
        windowName: '_system',
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING AND EDGE CASES TESTS
  // ==========================================================================

  describe('Error Handling and Edge Cases', () => {
    it('should handle plugin unavailability gracefully', async () => {
      _mockCapacitorSetup.setPlatform('web');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test graceful degradation when native plugins unavailable
      expect(Capacitor.isPluginAvailable('LocalNotifications')).toBe(true);
      expect(Capacitor.isNativePlatform()).toBe(false);

      // Verify web fallbacks
      await waitFor(() => {
        expect(screen.getByText(/web.*fallback|browser.*mode/i)).toBeInTheDocument();
      });
    });

    it('should handle memory constraints and cleanup', async () => {
      _mockCapacitorSetup.setPlatform('android');

      // Schedule multiple alarms to test memory handling
      const alarmIds: number[] = [];

      for (let i = 0; i < 50; i++) {
        const alarmId = await mobileHelper.alarms.schedule({
          title: `Memory Test Alarm ${i}`,
          body: `Testing memory constraints ${i}`,
          schedule: { at: new Date(Date.now() + i * 60000) },
        });
        alarmIds.push(alarmId);
      }

      expect(alarmIds.length).toBe(50);

      // Test cleanup
      mobileHelper.alarms.clearAll();

      const remainingAlarms = mobileHelper.alarms.getScheduled();
      expect(remainingAlarms.length).toBe(0);
    });

    it('should handle concurrent alarm operations', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      // Test concurrent alarm scheduling
      const alarmPromises = Array.from({ length: 10 }, (_, i) =>
        mobileHelper.alarms.schedule({
          title: `Concurrent Alarm ${i}`,
          body: `Testing concurrency ${i}`,
          schedule: { at: new Date(Date.now() + i * 10000) },
        })
      );

      const alarmIds = await Promise.all(alarmPromises);
      expect(alarmIds.length).toBe(10);
      expect(alarmIds.every(id => typeof id === 'number')).toBe(true);

      // Test concurrent triggering
      const triggerPromises = alarmIds.map(id => mobileHelper.alarms.trigger(id));
      await Promise.all(triggerPromises);

      const activeAlarms = mobileHelper.alarms.getActive();
      expect(activeAlarms.length).toBe(10);
    });
  });

  // ==========================================================================
  // PERFORMANCE AND OPTIMIZATION TESTS
  // ==========================================================================

  describe('Performance and Optimization', () => {
    it('should handle performance under mobile constraints', async () => {
      _mockCapacitorSetup.setPlatform('android');

      // Simulate low-performance device
      _mockCapacitorSetup.setDeviceInfo({
        platform: 'android',
        model: 'Budget Android Device',
        osVersion: '8.0',
        manufacturer: 'Generic',
      });

      const startTime = Date.now();

      // Test alarm operations performance
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Performance Test',
        body: 'Testing on low-end device',
      });

      await mobileHelper.alarms.trigger(alarmId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance should be reasonable even on low-end devices
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should optimize battery usage', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setBatteryInfo({ batteryLevel: 0.05, isCharging: false });

      // Test battery optimization features
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Battery Optimized Alarm',
        body: 'Using power-saving mode',
        extra: { powerSavingMode: true },
      });

      expect(alarmId).toBeDefined();

      // Verify reduced power consumption features
      await mobileHelper.alarms.trigger(alarmId);

      // Should use lighter haptics in power saving mode
      expect(Haptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
    });
  });

  // ==========================================================================
  // COMPREHENSIVE CROSS-PLATFORM COMPATIBILITY TESTS
  // ==========================================================================

  describe('Cross-Platform Compatibility', () => {
    it('should maintain feature parity across all platforms', async () => {
      const platforms: Array<'ios' | 'android' | 'web'> = ['ios', 'android', 'web'];
      const results: Record<string, boolean> = {};

      for (const platform of platforms) {
        try {
          _mockCapacitorSetup.setPlatform(platform);

          await act(async () => {
            const result = render(
              <BrowserRouter>
                <App />
              </BrowserRouter>
            );
            container = result.container;
          });

          // Test core alarm functionality on each platform
          const alarmId = await mobileHelper.alarms.schedule({
            title: `${platform} Test Alarm`,
            body: `Testing on ${platform}`,
            schedule: { at: new Date(Date.now() + 60000) },
          });

          await mobileHelper.alarms.trigger(alarmId);

          const history = mobileHelper.alarms.getHistory();
          const triggered = history.find(
            h => h.id === alarmId && h.action === 'triggered'
          );

          results[platform] = !!triggered;

          // Cleanup for next iteration
          if (container) container.remove();
          mobileHelper.reset();
        } catch (error) {
          results[platform] = false;
          console.error(`Platform ${platform} test failed:`, error);
        }
      }

      // All platforms should support core functionality
      expect(Object.values(results).every(success => success)).toBe(true);
    });

    it('should handle platform-specific feature degradation', async () => {
      const platformFeatures = {
        ios: ['haptics', 'backgroundMode', 'localNotifications', 'keepAwake'],
        android: ['haptics', 'backgroundMode', 'localNotifications', 'keepAwake'],
        web: ['localNotifications'], // Web has limited features
      };

      for (const [platform, features] of Object.entries(platformFeatures)) {
        _mockCapacitorSetup.setPlatform(platform as 'ios' | 'android' | 'web');

        // Test feature availability
        const isNative = platform !== 'web';

        if (features.includes('haptics')) {
          await mobileHelper.haptics.testImpact('MEDIUM');
          expect(Haptics.impact).toHaveBeenCalled();
        }

        if (features.includes('backgroundMode')) {
          await mobileHelper.background.enableBackgroundMode();
          if (isNative) {
            expect(BackgroundMode.enable).toHaveBeenCalled();
          }
        }

        if (features.includes('localNotifications')) {
          const alarmId = await mobileHelper.alarms.schedule({
            title: 'Feature Test',
            body: 'Testing platform features',
          });
          expect(alarmId).toBeDefined();
        }
      }
    });
  });

  // ==========================================================================
  // REAL-WORLD SCENARIO SIMULATION TESTS
  // ==========================================================================

  describe('Real-World Scenario Simulations', () => {
    it('should handle typical morning alarm routine', async () => {
      _mockCapacitorSetup.setPlatform('ios');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // 1. User sets alarm before sleep
      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Morning Alarm',
        body: 'Time to wake up!',
        schedule: { at: new Date(Date.now() + 500) }, // Short delay for testing
        sound: 'gentle-wake.wav',
      });

      // 2. App goes to background (user sleeps)
      CapApp._mockAppStateChange(false);

      // 3. Alarm triggers in background
      await new Promise(resolve => setTimeout(resolve, 600));
      await mobileHelper.alarms.trigger(alarmId);

      // 4. Verify alarm handling
      expect(BackgroundMode.enable).toHaveBeenCalled();
      expect(KeepAwake.keepAwake).toHaveBeenCalled();
      expect(Haptics.notification).toHaveBeenCalled();

      // 5. User snoozes alarm
      await mobileHelper.alarms.snooze(alarmId, 5);

      // 6. App comes to foreground when user checks phone
      CapApp._mockAppStateChange(true);

      expect(Badge.clear).toHaveBeenCalled();
    });

    it('should handle travel scenario with timezone changes', async () => {
      _mockCapacitorSetup.setPlatform('android');

      // Set initial location (San Francisco)
      Geolocation._mockSetPosition(37.7749, -122.4194, 10);

      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Travel Alarm',
        body: 'Adjusted for timezone',
        schedule: { at: new Date(Date.now() + 60000) },
        extra: { timezoneAware: true },
      });

      // Simulate travel (New York)
      Geolocation._mockSetPosition(40.7128, -74.006, 10);

      // Verify alarm still works
      await mobileHelper.alarms.trigger(alarmId);

      const history = mobileHelper.alarms.getHistory();
      expect(history.find(h => h.id === alarmId)).toBeDefined();
    });

    it('should handle battery critical scenario', async () => {
      _mockCapacitorSetup.setPlatform('ios');
      _mockCapacitorSetup.setBatteryInfo({ batteryLevel: 0.02, isCharging: false });

      const alarmId = await mobileHelper.alarms.schedule({
        title: 'Critical Battery Alarm',
        body: 'Important alarm with low battery',
        extra: { priority: 'high', batteryOptimized: true },
      });

      await mobileHelper.alarms.trigger(alarmId);

      // Should use minimal resources in critical battery mode
      expect(Haptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
    });

    it('should handle device storage full scenario', async () => {
      _mockCapacitorSetup.setPlatform('android');
      _mockCapacitorSetup.setDeviceInfo({
        platform: 'android',
        diskFree: 100000, // Very low free space
        diskTotal: 16000000000,
      });

      // Try to save large alarm sound file
      const soundPath = '/sounds/large-alarm.wav';

      try {
        await Filesystem.writeFile({
          path: soundPath,
          data: 'x'.repeat(200000), // Large file
        });

        expect(Filesystem.writeFile).toHaveBeenCalled();
      } catch (error) {
        // Should handle storage errors gracefully
        expect(error.message).toMatch(/storage|space/i);
      }
    });
  });
});
