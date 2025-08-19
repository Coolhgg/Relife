/**
 * Basic Mobile E2E Test for Alarm Functionality
 */

import { mobileE2EHelpers } from './setup';

describe('Basic Alarm E2E Tests', () => {
  beforeAll(async () => {
    await mobileE2EHelpers.waitForAppReady();
    await mobileE2EHelpers.grantNotificationPermissions();
  });

  afterEach(async () => {
    await mobileE2EHelpers.cleanupTestData();
  });

  it('should create and display an alarm', async () => {
    console.log('🧪 Testing basic alarm creation...');

    await mobileE2EHelpers.scheduleTestAlarm('Basic Test Alarm', 2);
    await mobileE2EHelpers.verifyAlarmInList('Basic Test Alarm');

    console.log('✅ Basic alarm test passed');
  });

  it('should work in background mode', async () => {
    console.log('🧪 Testing background mode...');

    await mobileE2EHelpers.scheduleTestAlarm('Background Test', 1);
    await mobileE2EHelpers.testBackgroundBehavior(async () => {
      await mobileE2EHelpers.verifyAlarmInList('Background Test');
    });

    console.log('✅ Background test passed');
  });
});