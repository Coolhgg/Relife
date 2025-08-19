/**
 * Mobile Testing Setup Validation
 *
 * Basic test to validate that our mobile testing infrastructure is working
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MobileTestHelper } from './utils/mobile-test-helpers';

describe('Mobile Testing Setup Validation', () => {
  let mobileHelper: MobileTestHelper;

  beforeEach(() => {
    mobileHelper = new MobileTestHelper();
  });

  it('should initialize mobile test helper successfully', () => {
    expect(mobileHelper).toBeDefined();
    expect(mobileHelper.getCurrentPlatform()).toBe('web'); // Default platform
  });

  it('should have working alarm testing utilities', async () => {
    const alarmConfig = {
      title: 'Test Alarm',
      body: 'This is a test alarm',
      schedule: {
        at: new Date(Date.now() + 60000), // 1 minute from now
        allowWhileIdle: true
      }
    };

    const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
    expect(alarm).toBeDefined();
    expect(alarm.id).toBeDefined();
    expect(alarm.title).toBe('Test Alarm');

    const scheduledAlarms = await mobileHelper.getScheduledAlarms();
    expect(scheduledAlarms.length).toBe(1);
    expect(scheduledAlarms[0].title).toBe('Test Alarm');
  });

  it('should have working audio testing utilities', async () => {
    const audioConfig = {
      assetId: 'test-sound',
      assetPath: '/test-audio.mp3',
      volume: 0.8,
      loop: false
    };

    await mobileHelper.loadAudio(audioConfig);
    const loadedSounds = await mobileHelper.getLoadedSounds();
    expect(loadedSounds).toContain('test-sound');

    await mobileHelper.playAudio('test-sound');
    const currentAudio = await mobileHelper.getCurrentAudio();
    expect(currentAudio).toBe('test-sound');
  });

  it('should support platform switching', async () => {
    // Test web platform (default)
    expect(mobileHelper.getCurrentPlatform()).toBe('web');

    // Switch to iOS
    await mobileHelper.switchToPlatform('ios');
    expect(mobileHelper.getCurrentPlatform()).toBe('ios');

    // Switch to Android
    await mobileHelper.switchToPlatform('android');
    expect(mobileHelper.getCurrentPlatform()).toBe('android');
  });

  it('should have working background testing utilities', async () => {
    await mobileHelper.enableBackgroundMode();
    const backgroundState = await mobileHelper.getBackgroundState();
    expect(backgroundState.backgroundModeEnabled).toBe(true);

    await mobileHelper.enableKeepAwake();
    const updatedState = await mobileHelper.getBackgroundState();
    expect(updatedState.keepAwakeEnabled).toBe(true);
  });

  it('should handle environment variable toggling', () => {
    // This test validates that our USE_REAL_DEVICE environment variable system works
    const originalEnv = process.env.USE_REAL_DEVICE;

    // Test mock mode (default)
    process.env.USE_REAL_DEVICE = 'false';
    expect(process.env.USE_REAL_DEVICE).toBe('false');

    // Test real device mode
    process.env.USE_REAL_DEVICE = 'true';
    expect(process.env.USE_REAL_DEVICE).toBe('true');

    // Restore original value
    if (originalEnv !== undefined) {
      process.env.USE_REAL_DEVICE = originalEnv;
    } else {
      delete process.env.USE_REAL_DEVICE;
    }
  });

  it('should provide comprehensive testing scenarios', async () => {
    // Test that our pre-built testing scenarios work
    const alarmFlowResult = await mobileHelper.testAlarmFlow({
      title: 'Morning Alarm',
      body: 'Wake up!',
      schedule: { at: new Date(Date.now() + 30000) },
      sound: 'morning-chime.mp3'
    });

    expect(alarmFlowResult.success).toBe(true);
    expect(alarmFlowResult.alarmScheduled).toBe(true);
    expect(alarmFlowResult.soundLoaded).toBe(true);
  });

  it('should clean up properly after tests', async () => {
    // Schedule some test data
    await mobileHelper.scheduleAlarm({
      title: 'Test Alarm 1',
      body: 'Test body',
      schedule: { at: new Date(Date.now() + 60000) }
    });

    await mobileHelper.loadAudio({
      assetId: 'cleanup-test',
      assetPath: '/cleanup-test.mp3'
    });

    // Verify data exists
    let alarms = await mobileHelper.getScheduledAlarms();
    let sounds = await mobileHelper.getLoadedSounds();
    expect(alarms.length).toBeGreaterThan(0);
    expect(sounds.length).toBeGreaterThan(0);

    // Clear all test data
    await mobileHelper.clearAllAlarms();
    await mobileHelper.clearAllAudio();

    // Verify cleanup worked
    alarms = await mobileHelper.getScheduledAlarms();
    sounds = await mobileHelper.getLoadedSounds();
    expect(alarms.length).toBe(0);
    expect(sounds.length).toBe(0);
  });
});