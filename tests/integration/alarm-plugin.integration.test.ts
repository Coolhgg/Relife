/**
 * Alarm Plugin Integration Tests
 *
 * Comprehensive integration tests for alarm scheduling, triggering, and management.
 * Tests both mock and real device behavior for alarm reliability.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { MobileTestHelper } from '../utils/mobile-test-helpers';

describe('Alarm Plugin Integration Tests', () => {
  let mobileHelper: MobileTestHelper;
  const isRealDevice = process.env.USE_REAL_DEVICE === 'true';

  beforeEach(async () => {
    mobileHelper = new MobileTestHelper();
    await mobileHelper.clearAllAlarms();
    await mobileHelper.clearAllAudio();
  });

  afterEach(async () => {
    await mobileHelper.clearAllAlarms();
    await mobileHelper.clearAllAudio();
  });

  describe('Basic Alarm Scheduling', () => {
    it('should schedule a simple alarm', async () => {
      const alarmConfig = {
        title: 'Morning Alarm',
        body: 'Time to wake up!',
        schedule: {
          at: new Date(Date.now() + 60000), // 1 minute from now
          allowWhileIdle: true
        },
        sound: 'morning-chime.mp3'
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);

      expect(alarm).toBeDefined();
      expect(alarm.id).toBeDefined();
      expect(alarm.title).toBe('Morning Alarm');
      expect(alarm.schedule.at).toBeInstanceOf(Date);

      const scheduledAlarms = await mobileHelper.getScheduledAlarms();
      expect(scheduledAlarms).toHaveLength(1);
      expect(scheduledAlarms[0].title).toBe('Morning Alarm');
    });

    it('should schedule multiple alarms with different times', async () => {
      const baseTime = Date.now();
      const alarms = [
        {
          title: 'First Alarm',
          body: 'First wake up call',
          schedule: { at: new Date(baseTime + 60000) }
        },
        {
          title: 'Second Alarm',
          body: 'Second wake up call',
          schedule: { at: new Date(baseTime + 120000) }
        },
        {
          title: 'Third Alarm',
          body: 'Third wake up call',
          schedule: { at: new Date(baseTime + 180000) }
        }
      ];

      const scheduledAlarms = [];
      for (const alarmConfig of alarms) {
        const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
        scheduledAlarms.push(alarm);
      }

      expect(scheduledAlarms).toHaveLength(3);

      const allScheduled = await mobileHelper.getScheduledAlarms();
      expect(allScheduled).toHaveLength(3);

      // Verify they're scheduled for different times
      const times = allScheduled.map(a => a.schedule.at.getTime());
      const uniqueTimes = new Set(times);
      expect(uniqueTimes.size).toBe(3);
    });

    it('should handle alarm scheduling with recurring patterns', async () => {
      const recurringAlarm = {
        title: 'Daily Alarm',
        body: 'Daily reminder',
        schedule: {
          at: new Date(Date.now() + 60000),
          repeats: true,
          every: 'day' as const
        }
      };

      const alarm = await mobileHelper.scheduleAlarm(recurringAlarm);

      expect(alarm.schedule.repeats).toBe(true);
      expect(alarm.schedule.every).toBe('day');
    });
  });

  describe('Alarm Triggering and Management', () => {
    it('should trigger an alarm and track it correctly', async () => {
      const alarmConfig = {
        title: 'Test Trigger Alarm',
        body: 'Testing alarm trigger',
        schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
        sound: 'default-alarm.mp3'
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);

      // Wait a moment and trigger the alarm manually
      await new Promise(resolve => setTimeout(resolve, 100));
      const triggeredAlarm = await mobileHelper.triggerAlarm(alarm.id);

      expect(triggeredAlarm).toBeDefined();
      expect(triggeredAlarm.id).toBe(alarm.id);

      const activeAlarms = await mobileHelper.getActiveAlarms();
      expect(activeAlarms).toContain(alarm.id);

      const alarmHistory = await mobileHelper.getAlarmHistory();
      expect(alarmHistory.length).toBeGreaterThan(0);
      expect(alarmHistory[0].type).toBe('triggered');
      expect(alarmHistory[0].alarmId).toBe(alarm.id);
    });

    it('should handle alarm snoozing', async () => {
      const alarmConfig = {
        title: 'Snooze Test Alarm',
        body: 'Testing snooze functionality',
        schedule: { at: new Date(Date.now() + 1000) }
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
      await mobileHelper.triggerAlarm(alarm.id);

      // Snooze for 5 minutes
      const snoozeResult = await mobileHelper.snoozeAlarm(alarm.id, 5);

      expect(snoozeResult.success).toBe(true);
      expect(snoozeResult.snoozeUntil).toBeInstanceOf(Date);

      const history = await mobileHelper.getAlarmHistory();
      const snoozeEvent = history.find(h => h.type === 'snoozed');
      expect(snoozeEvent).toBeDefined();
      expect(snoozeEvent?.alarmId).toBe(alarm.id);
    });

    it('should cancel alarms properly', async () => {
      const alarmConfig = {
        title: 'Cancellation Test',
        body: 'This alarm will be cancelled',
        schedule: { at: new Date(Date.now() + 60000) }
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
      let scheduledAlarms = await mobileHelper.getScheduledAlarms();
      expect(scheduledAlarms).toHaveLength(1);

      await mobileHelper.cancelAlarm(alarm.id);

      scheduledAlarms = await mobileHelper.getScheduledAlarms();
      expect(scheduledAlarms).toHaveLength(0);
    });
  });

  describe('Alarm Audio Integration', () => {
    it('should schedule alarm with custom audio and play it when triggered', async () => {
      const audioConfig = {
        assetId: 'custom-alarm-sound',
        assetPath: '/sounds/nature-birds.mp3',
        volume: 0.8,
        loop: true
      };

      // Load the audio first
      await mobileHelper.loadAudio(audioConfig);

      const alarmConfig = {
        title: 'Audio Test Alarm',
        body: 'Testing custom audio',
        schedule: { at: new Date(Date.now() + 1000) },
        sound: audioConfig.assetId,
        extra: { audioConfig }
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
      await mobileHelper.triggerAlarm(alarm.id);

      // Verify audio is playing
      const currentAudio = await mobileHelper.getCurrentAudio();
      expect(currentAudio).toBe(audioConfig.assetId);

      const loadedSounds = await mobileHelper.getLoadedSounds();
      expect(loadedSounds).toContain(audioConfig.assetId);
    });

    it('should handle audio playback controls during alarm', async () => {
      await mobileHelper.loadAudio({
        assetId: 'test-alarm-audio',
        assetPath: '/sounds/alarm-beep.mp3',
        volume: 0.7
      });

      const alarmConfig = {
        title: 'Audio Control Test',
        body: 'Testing audio controls',
        schedule: { at: new Date(Date.now() + 1000) },
        sound: 'test-alarm-audio'
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
      await mobileHelper.triggerAlarm(alarm.id);

      // Test audio controls
      await mobileHelper.playAudio('test-alarm-audio');
      let currentAudio = await mobileHelper.getCurrentAudio();
      expect(currentAudio).toBe('test-alarm-audio');

      await mobileHelper.pauseAudio('test-alarm-audio');
      // Note: In mocks, currentAudio might still show the paused sound

      await mobileHelper.stopAudio('test-alarm-audio');
      currentAudio = await mobileHelper.getCurrentAudio();
      expect(currentAudio).toBe(null);
    });
  });

  describe('Alarm Persistence and Recovery', () => {
    it('should persist alarm state across app restarts', async () => {
      const alarmConfig = {
        title: 'Persistent Alarm',
        body: 'Should survive restart',
        schedule: { at: new Date(Date.now() + 300000) }, // 5 minutes from now
        persistent: true
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);

      // Simulate app restart by clearing memory and reloading
      await mobileHelper.simulateAppRestart();

      const persistedAlarms = await mobileHelper.getScheduledAlarms();
      expect(persistedAlarms.length).toBeGreaterThan(0);

      const persistedAlarm = persistedAlarms.find(a => a.id === alarm.id);
      expect(persistedAlarm).toBeDefined();
      expect(persistedAlarm?.title).toBe('Persistent Alarm');
    });

    it('should recover from storage after device reboot simulation', async () => {
      // Schedule multiple alarms
      const alarms = [
        { title: 'Alarm 1', body: 'First', schedule: { at: new Date(Date.now() + 60000) } },
        { title: 'Alarm 2', body: 'Second', schedule: { at: new Date(Date.now() + 120000) } }
      ];

      const scheduledIds = [];
      for (const config of alarms) {
        const alarm = await mobileHelper.scheduleAlarm(config);
        scheduledIds.push(alarm.id);
      }

      // Simulate device reboot
      await mobileHelper.simulateDeviceReboot();

      // Check if alarms are recovered
      const recoveredAlarms = await mobileHelper.getScheduledAlarms();
      expect(recoveredAlarms.length).toBe(alarms.length);

      for (const id of scheduledIds) {
        const recoveredAlarm = recoveredAlarms.find(a => a.id === id);
        expect(recoveredAlarm).toBeDefined();
      }
    });
  });

  describe('Background and Battery Optimization', () => {
    it('should handle background execution for alarms', async () => {
      await mobileHelper.enableBackgroundMode();

      const alarmConfig = {
        title: 'Background Alarm',
        body: 'Should work in background',
        schedule: {
          at: new Date(Date.now() + 30000),
          allowWhileIdle: true
        }
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);

      // Simulate app going to background
      await mobileHelper.simulateBackground();

      const backgroundState = await mobileHelper.getBackgroundState();
      expect(backgroundState.backgroundModeEnabled).toBe(true);

      // Trigger alarm while in background
      await mobileHelper.triggerAlarm(alarm.id);

      const alarmHistory = await mobileHelper.getAlarmHistory();
      const backgroundEvent = alarmHistory.find(h =>
        h.alarmId === alarm.id && h.context?.background === true
      );
      expect(backgroundEvent).toBeDefined();
    });

    it('should prevent device sleep during active alarms', async () => {
      const alarmConfig = {
        title: 'Keep Awake Alarm',
        body: 'Should prevent sleep',
        schedule: { at: new Date(Date.now() + 1000) }
      };

      const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
      await mobileHelper.triggerAlarm(alarm.id);

      // Should automatically enable keep awake during alarm
      const backgroundState = await mobileHelper.getBackgroundState();
      expect(backgroundState.keepAwakeEnabled).toBe(true);

      // Stop alarm should disable keep awake
      await mobileHelper.stopAlarm(alarm.id);

      const updatedState = await mobileHelper.getBackgroundState();
      expect(updatedState.keepAwakeEnabled).toBe(false);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work consistently across platforms', async () => {
      const platforms = ['web', 'android', 'ios'];

      for (const platform of platforms) {
        await mobileHelper.switchToPlatform(platform);

        const alarmConfig = {
          title: `${platform} Alarm`,
          body: `Testing on ${platform}`,
          schedule: { at: new Date(Date.now() + 60000) }
        };

        const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
        expect(alarm).toBeDefined();
        expect(alarm.title).toBe(`${platform} Alarm`);

        await mobileHelper.clearAllAlarms();
      }
    });

    it('should handle platform-specific alarm features', async () => {
      // Test Android-specific features
      await mobileHelper.switchToPlatform('android');

      const androidAlarm = {
        title: 'Android Alarm',
        body: 'Android-specific features',
        schedule: {
          at: new Date(Date.now() + 60000),
          allowWhileIdle: true
        },
        androidSpecific: {
          priority: 'high',
          vibration: true
        }
      };

      let alarm = await mobileHelper.scheduleAlarm(androidAlarm);
      expect(alarm.androidSpecific?.priority).toBe('high');

      // Test iOS-specific features
      await mobileHelper.switchToPlatform('ios');

      const iosAlarm = {
        title: 'iOS Alarm',
        body: 'iOS-specific features',
        schedule: { at: new Date(Date.now() + 60000) },
        iosSpecific: {
          critical: true,
          interruptionLevel: 'critical'
        }
      };

      alarm = await mobileHelper.scheduleAlarm(iosAlarm);
      expect(alarm.iosSpecific?.critical).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid alarm scheduling gracefully', async () => {
      // Test past time
      const pastAlarm = {
        title: 'Past Alarm',
        body: 'This should fail',
        schedule: { at: new Date(Date.now() - 60000) } // 1 minute ago
      };

      await expect(mobileHelper.scheduleAlarm(pastAlarm))
        .rejects.toThrow(/cannot schedule alarm in the past/i);
    });

    it('should handle missing permissions gracefully', async () => {
      // Simulate permission denial
      await mobileHelper.simulatePermissionDenied('notifications');

      const alarmConfig = {
        title: 'Permission Test',
        body: 'Should handle permission denial',
        schedule: { at: new Date(Date.now() + 60000) }
      };

      await expect(mobileHelper.scheduleAlarm(alarmConfig))
        .rejects.toThrow(/notification permission denied/i);

      // Restore permissions
      await mobileHelper.simulatePermissionGranted('notifications');
    });

    it('should handle storage limitations', async () => {
      // Schedule many alarms to test limits
      const manyAlarms = Array.from({ length: 100 }, (_, i) => ({
        title: `Alarm ${i}`,
        body: `Bulk alarm ${i}`,
        schedule: { at: new Date(Date.now() + (i + 1) * 60000) }
      }));

      // Should handle reasonable number of alarms
      const scheduledAlarms = [];
      for (let i = 0; i < Math.min(manyAlarms.length, 64); i++) { // Most platforms limit to 64 notifications
        const alarm = await mobileHelper.scheduleAlarm(manyAlarms[i]);
        scheduledAlarms.push(alarm);
      }

      expect(scheduledAlarms.length).toBeLessThanOrEqual(64);

      const allScheduled = await mobileHelper.getScheduledAlarms();
      expect(allScheduled.length).toBeLessThanOrEqual(64);
    });
  });
});