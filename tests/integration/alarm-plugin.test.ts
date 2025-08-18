/**
 * Alarm Plugin Integration Tests
 * Tests alarm scheduling, triggering, and management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MobileTestHelper } from '../utils/mobile-test-helpers';

describe('Alarm Plugin Integration', () => {
  let mobileHelper: MobileTestHelper;
  
  beforeEach(async () => {
    mobileHelper = new MobileTestHelper();
    await mobileHelper.clearAllAlarms();
  });

  afterEach(async () => {
    await mobileHelper.clearAllAlarms();
  });

  it('should schedule and trigger alarms correctly', async () => {
    const alarmConfig = {
      title: 'Test Alarm',
      body: 'Test alarm body',
      schedule: { at: new Date(Date.now() + 60000) },
      sound: 'default.mp3'
    };

    const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
    expect(alarm.id).toBeDefined();
    expect(alarm.title).toBe('Test Alarm');

    const scheduledAlarms = await mobileHelper.getScheduledAlarms();
    expect(scheduledAlarms).toHaveLength(1);

    await mobileHelper.triggerAlarm(alarm.id);
    const activeAlarms = await mobileHelper.getActiveAlarms();
    expect(activeAlarms).toContain(alarm.id);
  });

  it('should handle alarm cancellation', async () => {
    const alarmConfig = {
      title: 'Cancel Test',
      body: 'Will be cancelled',
      schedule: { at: new Date(Date.now() + 60000) }
    };

    const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
    await mobileHelper.cancelAlarm(alarm.id);
    
    const scheduledAlarms = await mobileHelper.getScheduledAlarms();
    expect(scheduledAlarms).toHaveLength(0);
  });

  it('should support alarm snoozing', async () => {
    const alarmConfig = {
      title: 'Snooze Test',
      body: 'Snooze test body',
      schedule: { at: new Date(Date.now() + 1000) }
    };

    const alarm = await mobileHelper.scheduleAlarm(alarmConfig);
    await mobileHelper.triggerAlarm(alarm.id);
    
    const snoozeResult = await mobileHelper.snoozeAlarm(alarm.id, 5);
    expect(snoozeResult.success).toBe(true);
    expect(snoozeResult.snoozeUntil).toBeInstanceOf(Date);
  });
});