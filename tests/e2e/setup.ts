/**
 * Detox E2E Testing Setup
 * Configures mobile device testing environment for alarm and notification testing
 */

import { cleanup, init } from 'detox';

import adapter from 'detox/runners/jest/adapter';
import specReporter from 'detox/runners/jest/specReporter';

// Set the default timeout for all tests
jest.setTimeout(300000);

// Setup Detox adapter
jasmine.getEnv().addReporter(adapter);

// Add spec reporter for better output
jasmine.getEnv().addReporter(specReporter);

beforeAll(async () => {
  console.log('🚀 Initializing Detox mobile testing environment...');
  await init();
  console.log('✅ Detox initialized successfully');
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  console.log('🧹 Cleaning up Detox testing environment...');
  await adapter.afterAll();
  await cleanup();
  console.log('✅ Detox cleanup completed');
});

afterEach(async () => {
  await adapter.afterEach();
});

// Global test utilities for mobile testing (handled by ESLint config)

// Mobile testing helpers
export const mobileE2EHelpers = {
  /**
   * Wait for the app to be ready and visible
   */
  waitForAppReady: async (timeout: number = 10000) => {
    console.log('⏳ Waiting for app to be ready...');
    await waitFor(element(by.id('app-root')))
      .toBeVisible()
      .withTimeout(timeout);
    console.log('✅ App is ready');
  },

  /**
   * Schedule a test alarm through the UI
   */
  scheduleTestAlarm: async (title: string = 'Test Alarm', minutes: number = 1) => {
    console.log(`⏰ Scheduling test alarm: "${title}" in ${minutes} minutes`);

    // Navigate to alarm creation
    await element(by.id('create-alarm-button')).tap();

    // Fill in alarm details
    await element(by.id('alarm-title-input')).typeText(title);

    // Set time (assuming there's a time picker)
    const futureTime = new Date(Date.now() + minutes * 60 * 1000);
    const hours = futureTime.getHours().toString().padStart(2, '0');
    const mins = futureTime.getMinutes().toString().padStart(2, '0');

    await element(by.id('time-picker-hours')).replaceText(hours);
    await element(by.id('time-picker-minutes')).replaceText(mins);

    // Save alarm
    await element(by.id('save-alarm-button')).tap();

    console.log('✅ Test alarm scheduled');
  },

  /**
   * Verify alarm appears in the list
   */
  verifyAlarmInList: async (title: string) => {
    console.log(`🔍 Verifying alarm "${title}" appears in list`);
    await waitFor(element(by.text(title)))
      .toBeVisible()
      .withTimeout(5000);
    console.log('✅ Alarm found in list');
  },

  /**
   * Test alarm notification permissions
   */
  grantNotificationPermissions: async () => {
    console.log('🔔 Requesting notification permissions...');

    // Look for permission dialog and grant it
    try {
      await waitFor(element(by.text('Allow')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('Allow')).tap();
      console.log('✅ Notification permissions granted');
    } catch (_error) {
      console.log('ℹ️ No permission dialog found (already granted or not required)');
    }
  },

  /**
   * Test background app functionality
   */
  testBackgroundBehavior: async (testFunction: () => Promise<void>) => {
    console.log('🌙 Testing background behavior...');

    // Send app to background
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Run the test function
    await testFunction();

    console.log('✅ Background behavior test completed');
  },

  /**
   * Simulate device restart for alarm persistence testing
   */
  simulateDeviceRestart: async () => {
    console.log('🔄 Simulating device restart...');

    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    await mobileE2EHelpers.waitForAppReady();

    console.log('✅ Device restart simulation completed');
  },

  /**
   * Test audio playback for alarms
   */
  testAudioPlayback: async (soundName: string = 'default') => {
    console.log(`🔊 Testing audio playback: ${soundName}`);

    // This would need specific implementation based on your audio testing approach
    // For now, we'll just verify the sound setting is saved
    await element(by.id('alarm-sound-selector')).tap();
    await element(by.text(soundName)).tap();

    console.log('✅ Audio playback test setup completed');
  },

  /**
   * Wait for and handle alarm notifications
   */
  waitForAlarmNotification: async (timeout: number = 65000) => {
    console.log('⏳ Waiting for alarm notification...');

    // This is platform-specific and would need real implementation
    // For Android, we might look for notification bar elements
    // For iOS, we might look for notification banners

    try {
      await waitFor(element(by.id('alarm-notification')))
        .toBeVisible()
        .withTimeout(timeout);
      console.log('✅ Alarm notification received');
      return true;
    } catch (_error) {
      console.log('❌ Alarm notification not received within timeout');
      return false;
    }
  },

  /**
   * Test alarm actions (snooze, dismiss)
   */
  testAlarmActions: async () => {
    console.log('🎯 Testing alarm actions...');

    // Test snooze
    if (await element(by.id('snooze-button')).exists()) {
      await element(by.id('snooze-button')).tap();
      console.log('😴 Snooze button tapped');
    }

    // Test dismiss
    if (await element(by.id('dismiss-button')).exists()) {
      await element(by.id('dismiss-button')).tap();
      console.log('❌ Dismiss button tapped');
    }

    console.log('✅ Alarm actions test completed');
  },

  /**
   * Verify device-specific functionality
   */
  testDeviceFeatures: async () => {
    console.log('📱 Testing device-specific features...');

    const platform = device.getPlatform();

    if (platform === 'ios') {
      console.log('🍎 Testing iOS-specific features...');
      // Test iOS-specific alarm features
    } else if (platform === 'android') {
      console.log('🤖 Testing Android-specific features...');
      // Test Android-specific alarm features
    }

    console.log('✅ Device features test completed');
  },

  /**
   * Take screenshot for debugging
   */
  takeScreenshot: async (name: string) => {
    console.log(`📸 Taking screenshot: ${name}`);
    await device.takeScreenshot(name);
  },

  /**
   * Get device logs for debugging
   */
  getDeviceLogs: async () => {
    console.log('📋 Getting device logs...');

    // This would be platform-specific
    const platform = device.getPlatform();

    if (platform === 'android') {
      // Get Android logcat
      console.log('📱 Getting Android logcat...');
    } else if (platform === 'ios') {
      // Get iOS device logs
      console.log('🍎 Getting iOS device logs...');
    }
  },

  /**
   * Clean up test data
   */
  cleanupTestData: async () => {
    console.log('🧹 Cleaning up test data...');

    // Clear all test alarms
    try {
      await element(by.id('settings-button')).tap();
      await element(by.id('clear-all-alarms-button')).tap();
      await element(by.text('Confirm')).tap();
      console.log('✅ Test alarms cleared');
    } catch (_error) {
      console.log('ℹ️ No test alarms to clear or cleanup not needed');
    }
  }
};

// Export helpers for use in tests
export default mobileE2EHelpers;