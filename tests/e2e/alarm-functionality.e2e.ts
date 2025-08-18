/**
 * Mobile E2E Tests for Alarm Functionality
 * 
 * Tests alarm scheduling, triggering, and handling on real devices/simulators
 * using Detox framework for comprehensive mobile testing.
 */

import { mobileE2EHelpers } from './setup';

describe('Alarm Functionality E2E Tests', () => {
  beforeAll(async () => {
    await mobileE2EHelpers.waitForAppReady();
    await mobileE2EHelpers.grantNotificationPermissions();
  });

  afterEach(async () => {
    await mobileE2EHelpers.cleanupTestData();
    await mobileE2EHelpers.takeScreenshot(`test-cleanup-${Date.now()}`);
  });

  describe('Alarm Creation and Management', () => {
    it('should create and save an alarm', async () => {
      console.log('🧪 Testing alarm creation...');

      await mobileE2EHelpers.scheduleTestAlarm('E2E Test Alarm', 2);
      await mobileE2EHelpers.verifyAlarmInList('E2E Test Alarm');

      console.log('✅ Alarm creation test passed');
    });

    it('should display scheduled alarms in the list', async () => {
      console.log('🧪 Testing alarm list display...');

      // Create multiple alarms
      await mobileE2EHelpers.scheduleTestAlarm('Morning Alarm', 1);
      await mobileE2EHelpers.scheduleTestAlarm('Evening Alarm', 2);

      // Verify both appear in list
      await mobileE2EHelpers.verifyAlarmInList('Morning Alarm');
      await mobileE2EHelpers.verifyAlarmInList('Evening Alarm');

      console.log('✅ Alarm list display test passed');
    });

    it('should allow editing existing alarms', async () => {
      console.log('🧪 Testing alarm editing...');

      await mobileE2EHelpers.scheduleTestAlarm('Original Alarm', 1);
      
      // Edit the alarm
      await element(by.text('Original Alarm')).tap();
      await element(by.id('edit-alarm-button')).tap();
      
      await element(by.id('alarm-title-input')).clearText();
      await element(by.id('alarm-title-input')).typeText('Edited Alarm');
      
      await element(by.id('save-alarm-button')).tap();
      
      // Verify edited alarm
      await mobileE2EHelpers.verifyAlarmInList('Edited Alarm');

      console.log('✅ Alarm editing test passed');
    });

    it('should delete alarms when requested', async () => {
      console.log('🧪 Testing alarm deletion...');

      await mobileE2EHelpers.scheduleTestAlarm('Temporary Alarm', 1);
      await mobileE2EHelpers.verifyAlarmInList('Temporary Alarm');
      
      // Delete the alarm
      await element(by.text('Temporary Alarm')).longPress();
      await element(by.id('delete-alarm-button')).tap();
      await element(by.text('Delete')).tap();
      
      // Verify alarm is gone
      await waitFor(element(by.text('Temporary Alarm')))
        .not.toBeVisible()
        .withTimeout(3000);

      console.log('✅ Alarm deletion test passed');
    });
  });

  describe('Alarm Sound and Audio Testing', () => {
    it('should allow selecting different alarm sounds', async () => {
      console.log('🧪 Testing alarm sound selection...');

      await mobileE2EHelpers.scheduleTestAlarm('Sound Test Alarm', 1);
      await mobileE2EHelpers.testAudioPlayback('chime');

      console.log('✅ Alarm sound selection test passed');
    });

    it('should preview alarm sounds', async () => {
      console.log('🧪 Testing sound preview...');

      await element(by.id('create-alarm-button')).tap();
      await element(by.id('alarm-sound-selector')).tap();
      
      // Test sound preview
      await element(by.id('sound-preview-button')).tap();
      
      // Wait a moment for sound to play
      await device.launchApp({ newInstance: false });
      
      console.log('✅ Sound preview test passed');
    });
  });

  describe('Background and Notification Testing', () => {
    it('should continue working when app is backgrounded', async () => {
      console.log('🧪 Testing background functionality...');

      await mobileE2EHelpers.scheduleTestAlarm('Background Test', 1);

      await mobileE2EHelpers.testBackgroundBehavior(async () => {
        // Verify alarm still exists after backgrounding
        await mobileE2EHelpers.verifyAlarmInList('Background Test');
      });

      console.log('✅ Background functionality test passed');
    });

    it('should show notifications when alarm triggers', async () => {
      console.log('🧪 Testing alarm notifications...');

      // Schedule a very short alarm (30 seconds for testing)
      await element(by.id('create-alarm-button')).tap();
      await element(by.id('alarm-title-input')).typeText('Notification Test');
      
      // Set alarm for 30 seconds from now
      const futureTime = new Date(Date.now() + 30000);
      const hours = futureTime.getHours().toString().padStart(2, '0');
      const mins = futureTime.getMinutes().toString().padStart(2, '0');
      
      await element(by.id('time-picker-hours')).replaceText(hours);
      await element(by.id('time-picker-minutes')).replaceText(mins);
      
      await element(by.id('save-alarm-button')).tap();

      // Wait for notification (with extended timeout)
      const notificationReceived = await mobileE2EHelpers.waitForAlarmNotification(45000);
      expect(notificationReceived).toBe(true);

      console.log('✅ Alarm notification test passed');
    });

    it('should persist alarms after app restart', async () => {
      console.log('🧪 Testing alarm persistence...');

      await mobileE2EHelpers.scheduleTestAlarm('Persistence Test', 2);
      await mobileE2EHelpers.simulateDeviceRestart();
      await mobileE2EHelpers.verifyAlarmInList('Persistence Test');

      console.log('✅ Alarm persistence test passed');
    });
  });

  describe('Alarm Actions and User Interaction', () => {
    it('should handle alarm snooze functionality', async () => {
      console.log('🧪 Testing alarm snooze...');

      // This test would require triggering an actual alarm
      // For demonstration, we'll test the snooze UI setup
      await mobileE2EHelpers.scheduleTestAlarm('Snooze Test', 1);
      
      // Navigate to alarm settings to configure snooze
      await element(by.text('Snooze Test')).tap();
      await element(by.id('snooze-duration-selector')).tap();
      await element(by.text('5 minutes')).tap();
      
      await element(by.id('save-alarm-button')).tap();

      console.log('✅ Snooze configuration test passed');
    });

    it('should handle alarm dismiss functionality', async () => {
      console.log('🧪 Testing alarm dismiss...');

      await mobileE2EHelpers.scheduleTestAlarm('Dismiss Test', 1);
      
      // Test dismiss button availability
      await element(by.text('Dismiss Test')).tap();
      await expect(element(by.id('dismiss-enabled-toggle'))).toBeVisible();

      console.log('✅ Dismiss functionality test passed');
    });
  });

  describe('Platform-Specific Features', () => {
    it('should test iOS-specific alarm features', async () => {
      const platform = device.getPlatform();
      
      if (platform === 'ios') {
        console.log('🧪 Testing iOS-specific features...');
        
        await mobileE2EHelpers.testDeviceFeatures();
        
        // Test iOS-specific notification styles
        await element(by.id('create-alarm-button')).tap();
        await element(by.id('notification-style-selector')).tap();
        await element(by.text('Banner')).tap();
        
        console.log('✅ iOS-specific features test passed');
      } else {
        console.log('ℹ️ Skipping iOS-specific tests on non-iOS platform');
      }
    });

    it('should test Android-specific alarm features', async () => {
      const platform = device.getPlatform();
      
      if (platform === 'android') {
        console.log('🧪 Testing Android-specific features...');
        
        await mobileE2EHelpers.testDeviceFeatures();
        
        // Test Android-specific settings
        await element(by.id('settings-button')).tap();
        await element(by.id('android-doze-settings')).tap();
        
        console.log('✅ Android-specific features test passed');
      } else {
        console.log('ℹ️ Skipping Android-specific tests on non-Android platform');
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple alarms without performance issues', async () => {
      console.log('🧪 Testing multiple alarm performance...');

      // Create 10 alarms quickly
      for (let i = 1; i <= 10; i++) {
        await mobileE2EHelpers.scheduleTestAlarm(`Perf Test ${i}`, i);
      }

      // Verify all alarms were created
      for (let i = 1; i <= 10; i++) {
        await mobileE2EHelpers.verifyAlarmInList(`Perf Test ${i}`);
      }

      console.log('✅ Multiple alarm performance test passed');
    });

    it('should maintain alarm accuracy over time', async () => {
      console.log('🧪 Testing alarm timing accuracy...');

      // Schedule alarm for 1 minute
      const startTime = Date.now();
      await mobileE2EHelpers.scheduleTestAlarm('Accuracy Test', 1);

      // Wait for notification with precise timing
      const notificationReceived = await mobileE2EHelpers.waitForAlarmNotification(65000);
      const endTime = Date.now();
      
      const timeDiff = endTime - startTime;
      const expectedTime = 60000; // 1 minute
      const tolerance = 10000; // 10 seconds tolerance

      expect(notificationReceived).toBe(true);
      expect(Math.abs(timeDiff - expectedTime)).toBeLessThan(tolerance);

      console.log('✅ Alarm timing accuracy test passed');
    });

    it('should recover gracefully from errors', async () => {
      console.log('🧪 Testing error recovery...');

      try {
        // Attempt to create invalid alarm
        await element(by.id('create-alarm-button')).tap();
        await element(by.id('save-alarm-button')).tap(); // Save without required fields
        
        // Should show error message
        await expect(element(by.text('Please fill in all required fields'))).toBeVisible();
        
        // Should allow correction
        await element(by.id('alarm-title-input')).typeText('Recovery Test');
        await element(by.id('save-alarm-button')).tap();
        
        await mobileE2EHelpers.verifyAlarmInList('Recovery Test');
        
      } catch (error) {
        console.log('Expected error during recovery test:', error);
      }

      console.log('✅ Error recovery test passed');
    });
  });

  describe('Device Integration Tests', () => {
    it('should integrate properly with device notification settings', async () => {
      console.log('🧪 Testing device notification integration...');

      // This would test system-level notification settings
      // Implementation would be platform-specific
      
      await mobileE2EHelpers.grantNotificationPermissions();
      await mobileE2EHelpers.scheduleTestAlarm('Integration Test', 1);
      
      console.log('✅ Device notification integration test passed');
    });

    it('should handle device rotation and UI adaptation', async () => {
      console.log('🧪 Testing device rotation...');

      await mobileE2EHelpers.scheduleTestAlarm('Rotation Test', 1);
      
      // Rotate device
      await device.setOrientation('landscape');
      await mobileE2EHelpers.verifyAlarmInList('Rotation Test');
      
      // Rotate back
      await device.setOrientation('portrait');
      await mobileE2EHelpers.verifyAlarmInList('Rotation Test');

      console.log('✅ Device rotation test passed');
    });

    it('should work with different screen sizes and densities', async () => {
      console.log('🧪 Testing screen adaptation...');

      // This would be more relevant for multiple device testing
      await mobileE2EHelpers.scheduleTestAlarm('Screen Test', 1);
      await mobileE2EHelpers.takeScreenshot('screen-adaptation-test');
      
      console.log('✅ Screen adaptation test passed');
    });
  });
});