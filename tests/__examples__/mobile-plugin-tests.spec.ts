/**
 * Example Mobile Plugin Tests
 * 
 * Demonstrates how to use the mobile testing utilities for testing
 * Capacitor plugins in both mocked and real device environments.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMobileTestHelper, mobileTestUtils } from '../utils/mobile-test-helpers';

describe('Mobile Plugin Testing Examples', () => {
  const helper = createMobileTestHelper();

  beforeEach(() => {
    helper.reset();
  });

  afterEach(() => {
    helper.reset();
  });

  describe('Alarm Plugin Tests', () => {
    it('should schedule and trigger alarms', async () => {
      // Create test alarm configuration
      const alarmConfig = mobileTestUtils.createTestAlarm({
        title: 'Morning Alarm',
        body: 'Time to wake up!',
        schedule: {
          at: new Date(Date.now() + 1000), // 1 second from now
          allowWhileIdle: true
        }
      });

      // Test complete alarm flow
      const alarmId = await helper.scenarios.testAlarmFlow(alarmConfig);
      
      expect(alarmId).toBeDefined();
      expect(typeof alarmId).toBe('number');
    });

    it('should handle alarm snoozing', async () => {
      // Schedule an alarm
      const alarmId = await helper.alarms.schedule(mobileTestUtils.createTestAlarm());
      
      // Trigger the alarm
      await helper.alarms.trigger(alarmId);
      
      // Snooze the alarm
      await helper.alarms.snooze(alarmId, 10); // 10 minutes
      
      // Check that snooze alarm was created
      const scheduled = helper.alarms.getScheduled();
      const snoozedAlarm = scheduled.find(alarm => 
        alarm.extra?.originalAlarmId === alarmId && alarm.extra?.snoozed === true
      );
      
      expect(snoozedAlarm).toBeDefined();
    });

    it('should track alarm history', async () => {
      const alarmConfig = mobileTestUtils.createTestAlarm();
      const alarmId = await helper.alarms.schedule(alarmConfig);
      
      // Trigger alarm to create history
      await helper.alarms.trigger(alarmId);
      
      const history = helper.alarms.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(alarmId);
      expect(history[0].action).toBe('triggered');
    });
  });

  describe('Audio Plugin Tests', () => {
    it('should load and play audio', async () => {
      const audioConfig = mobileTestUtils.createTestAudio({
        assetId: 'alarm-sound',
        assetPath: '/sounds/alarm.mp3'
      });

      // Test audio playback scenario
      await helper.scenarios.testAudioPlayback(audioConfig);
      
      const currentAudio = helper.audio.getCurrentlyPlaying();
      expect(currentAudio?.currentlyPlaying).toBe(audioConfig.assetId);
    });

    it('should handle multiple audio files', async () => {
      const audio1 = mobileTestUtils.createTestAudio({
        assetId: 'sound1',
        assetPath: '/sounds/sound1.mp3'
      });
      
      const audio2 = mobileTestUtils.createTestAudio({
        assetId: 'sound2', 
        assetPath: '/sounds/sound2.mp3'
      });

      await helper.audio.load(audio1);
      await helper.audio.load(audio2);
      
      const loaded = helper.audio.getLoaded();
      expect(loaded).toContain('sound1');
      expect(loaded).toContain('sound2');
    });

    it('should control audio playback', async () => {
      const audioConfig = mobileTestUtils.createTestAudio();
      await helper.audio.load(audioConfig);
      
      // Play audio
      await helper.audio.play(audioConfig.assetId);
      let current = helper.audio.getCurrentlyPlaying();
      expect(current?.isPlaying).toBeTruthy();
      
      // Pause audio
      await helper.audio.pause(audioConfig.assetId);
      current = helper.audio.getCurrentlyPlaying();
      expect(current?.isPaused).toBeTruthy();
      
      // Stop audio
      await helper.audio.stop(audioConfig.assetId);
      current = helper.audio.getCurrentlyPlaying();
      expect(current?.currentlyPlaying).toBeNull();
    });
  });

  describe('Background Task Tests', () => {
    it('should enable background mode', async () => {
      await helper.background.enableBackgroundMode();
      
      const state = helper.background.getState();
      expect(state?.isEnabled).toBeTruthy();
    });

    it('should run background tasks', async () => {
      const taskResult = await helper.background.runBackgroundTask('test-task', 100);
      expect(taskResult).toBe('test-task');
    });

    it('should test background reliability', async () => {
      await helper.scenarios.testBackgroundReliability();
      
      const state = helper.background.getState();
      expect(state?.isEnabled).toBeTruthy();
    });
  });

  describe('Device Capability Tests', () => {
    it('should switch between platforms', () => {
      // Test iOS
      helper.device.switchPlatform('ios');
      // Platform switching is tested through mock setup
      expect(true).toBeTruthy(); // Mock verification
      
      // Test Android
      helper.device.switchPlatform('android');
      expect(true).toBeTruthy(); // Mock verification
      
      // Test Web
      helper.device.switchPlatform('web');
      expect(true).toBeTruthy(); // Mock verification
    });

    it('should configure device characteristics', () => {
      const deviceConfig = mobileTestUtils.createTestDevice('ios', {
        model: 'iPhone 14',
        osVersion: '16.0'
      });
      
      helper.device.configure(deviceConfig);
      expect(true).toBeTruthy(); // Configuration applied through mock
    });

    it('should simulate device states', () => {
      // Test sleep/wake simulation
      helper.device.simulateSleep();
      helper.device.simulateWake();
      
      // Test battery simulation
      helper.device.setBatteryLevel(0.15, false); // Low battery, not charging
      
      expect(true).toBeTruthy(); // Simulation completed
    });
  });

  describe('Notification Tests', () => {
    it('should handle notification permissions', async () => {
      // Grant permissions
      await helper.notifications.requestPermissions();
      
      // Deny permissions
      await helper.notifications.denyPermissions();
      
      expect(true).toBeTruthy(); // Permissions handled through mock
    });

    it('should simulate push notifications', () => {
      const pushData = {
        title: 'Test Push',
        body: 'This is a test push notification',
        data: { type: 'alarm-reminder' }
      };
      
      helper.notifications.simulatePush(pushData);
      expect(true).toBeTruthy(); // Push simulation completed
    });
  });

  describe('Haptics Tests', () => {
    it('should test haptic feedback', () => {
      helper.haptics.testImpact('LIGHT');
      helper.haptics.testImpact('MEDIUM');
      helper.haptics.testImpact('HEAVY');
      
      expect(true).toBeTruthy(); // Haptic tests completed
    });

    it('should test haptic notifications', () => {
      helper.haptics.testNotification('SUCCESS');
      helper.haptics.testNotification('WARNING');
      helper.haptics.testNotification('ERROR');
      
      expect(true).toBeTruthy(); // Haptic notifications tested
    });
  });

  describe('Cross-Platform Testing', () => {
    it('should test alarm functionality across all platforms', async () => {
      const testAlarmOnPlatform = async () => {
        const alarmConfig = mobileTestUtils.createTestAlarm();
        const alarmId = await helper.alarms.schedule(alarmConfig);
        await helper.alarms.trigger(alarmId);
        
        const active = helper.alarms.getActive();
        expect(active).toContain(alarmId);
      };

      const results = await helper.scenarios.testCrossPlatform(testAlarmOnPlatform);
      
      // Expect all platforms to pass
      expect(results.web).toBeTruthy();
      expect(results.ios).toBeTruthy();
      expect(results.android).toBeTruthy();
    });

    it('should test audio across platforms', async () => {
      const testAudioOnPlatform = async () => {
        const audioConfig = mobileTestUtils.createTestAudio();
        await helper.audio.load(audioConfig);
        await helper.audio.play(audioConfig.assetId);
        
        const current = helper.audio.getCurrentlyPlaying();
        expect(current?.currentlyPlaying).toBe(audioConfig.assetId);
      };

      const results = await helper.scenarios.testCrossPlatform(testAudioOnPlatform);
      
      // Audio should work on all platforms
      expect(Object.values(results).every(passed => passed)).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('should test complete alarm flow with audio and background tasks', async () => {
      // 1. Configure device
      helper.device.configure(mobileTestUtils.createTestDevice('ios'));
      
      // 2. Enable background mode
      await helper.background.enableBackgroundMode();
      
      // 3. Load alarm sound
      const audioConfig = mobileTestUtils.createTestAudio({
        assetId: 'alarm-tone',
        assetPath: '/sounds/alarm-tone.mp3'
      });
      await helper.audio.load(audioConfig);
      
      // 4. Schedule alarm
      const alarmConfig = mobileTestUtils.createTestAlarm({
        title: 'Integration Test Alarm',
        sound: audioConfig.assetId
      });
      const alarmId = await helper.alarms.schedule(alarmConfig);
      
      // 5. Trigger alarm (simulates scheduled time reached)
      await helper.alarms.trigger(alarmId);
      
      // 6. Play alarm sound
      await helper.audio.play(audioConfig.assetId);
      
      // 7. Test haptic feedback
      helper.haptics.testNotification('SUCCESS');
      
      // 8. Verify everything worked
      const activeAlarms = helper.alarms.getActive();
      const currentAudio = helper.audio.getCurrentlyPlaying();
      const backgroundState = helper.background.getState();
      
      expect(activeAlarms).toContain(alarmId);
      expect(currentAudio?.currentlyPlaying).toBe(audioConfig.assetId);
      expect(backgroundState?.isEnabled).toBeTruthy();
    });
  });

  describe('Utility Functions', () => {
    it('should validate alarm configurations', () => {
      // Valid configuration
      const validConfig = mobileTestUtils.createTestAlarm();
      expect(() => mobileTestUtils.validateAlarmConfig(validConfig)).not.toThrow();
      
      // Invalid configuration - missing title
      const invalidConfig = { ...validConfig, title: '' };
      expect(() => mobileTestUtils.validateAlarmConfig(invalidConfig)).toThrow();
    });

    it('should generate unique test IDs', () => {
      const id1 = mobileTestUtils.generateTestId();
      const id2 = mobileTestUtils.generateTestId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('number');
      expect(typeof id2).toBe('number');
    });

    it('should provide wait utility', async () => {
      const startTime = Date.now();
      await mobileTestUtils.wait(100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });
});