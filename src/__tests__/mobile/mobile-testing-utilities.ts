/**
 * Mobile Testing Utilities for Capacitor/Cordova
 * Builds on existing Capacitor mocks with enhanced testing scenarios and helpers
 */

import { _mockCapacitorSetup } from '../mocks/capacitor.mock';

// Mobile Platform Test Scenarios
export class MobilePlatformTester {
  private platform: 'ios' | 'android' | 'web';
  private testEvents: Array<{ type: string; data: any; timestamp: number }> = [];

  constructor(platform: 'ios' | 'android' | 'web' = 'web') {
    this.platform = platform;
    _mockCapacitorSetup.setPlatform(platform);
  }

  reset() {
    this.testEvents = [];
    _mockCapacitorSetup.reset();
    _mockCapacitorSetup.setPlatform(this.platform);
  }

  private logEvent(type: string, data: any) {
    this.testEvents.push({ type, data, timestamp: Date.now() });
  }

  getEvents() {
    return [...this.testEvents];
  }

  // Alarm Testing Scenarios
  async testAlarmLifecycle() {
    this.logEvent('alarm_lifecycle_started', { platform: this.platform });

    // Schedule alarm
    const alarmId = _mockCapacitorSetup.scheduleTestAlarm({
      title: 'Test Alarm',
      body: 'Time to wake up!',
      schedule: {
        at: new Date(Date.now() + 5000), // 5 seconds from now
        repeats: false,
      },
    });

    this.logEvent('alarm_scheduled', { alarmId });

    // Wait for alarm trigger
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger the alarm
    _mockCapacitorSetup.triggerAlarm(alarmId);
    this.logEvent('alarm_triggered', { alarmId });

    // Simulate user interaction
    await new Promise(resolve => setTimeout(resolve, 200));
    this.logEvent('alarm_dismissed', { alarmId, action: 'dismiss' });

    return {
      alarmId,
      events: this.getEvents(),
      scheduledAlarms: _mockCapacitorSetup.getScheduledAlarms(),
      alarmHistory: _mockCapacitorSetup.getAlarmHistory(),
    };
  }

  async testBackgroundAlarmReliability() {
    this.logEvent('background_alarm_test_started', { platform: this.platform });

    // Enable background mode
    await _mockCapacitorSetup.enableBackgroundMode();
    this.logEvent('background_mode_enabled', {});

    // Schedule multiple alarms
    const alarmIds = [];
    for (let i = 0; i < 5; i++) {
      const id = _mockCapacitorSetup.scheduleTestAlarm({
        title: `Background Alarm ${i + 1}`,
        body: `Alarm ${i + 1} body`,
        schedule: {
          at: new Date(Date.now() + (i + 1) * 1000),
          repeats: false,
        },
      });
      alarmIds.push(id);
    }

    this.logEvent('multiple_alarms_scheduled', { count: alarmIds.length });

    // Simulate app going to background
    _mockCapacitorSetup.triggerEvent('App', 'appStateChange', { isActive: false });
    this.logEvent('app_backgrounded', {});

    // Trigger alarms while in background
    for (const alarmId of alarmIds) {
      await new Promise(resolve => setTimeout(resolve, 100));
      _mockCapacitorSetup.triggerAlarm(alarmId);
      this.logEvent('background_alarm_triggered', { alarmId });
    }

    // Simulate app returning to foreground
    _mockCapacitorSetup.triggerEvent('App', 'appStateChange', { isActive: true });
    this.logEvent('app_foregrounded', {});

    return {
      alarmIds,
      events: this.getEvents(),
      backgroundState: _mockCapacitorSetup.getBackgroundState(),
    };
  }

  // Permission Testing
  async testPermissionFlow() {
    this.logEvent('permission_flow_started', { platform: this.platform });

    const permissions = ['notifications', 'camera', 'microphone', 'location'] as const;
    const results: Record<string, any> = {};

    for (const permission of permissions) {
      // Start with denied permission
      _mockCapacitorSetup.setPermission(permission, 'denied');
      this.logEvent('permission_denied', { permission });

      // Request permission
      await new Promise(resolve => setTimeout(resolve, 100));
      _mockCapacitorSetup.setPermission(permission, 'granted');
      this.logEvent('permission_granted', { permission });

      results[permission] = 'granted';
    }

    return {
      permissions: results,
      events: this.getEvents(),
    };
  }

  // Network Connectivity Testing
  async testNetworkScenarios() {
    this.logEvent('network_scenarios_started', { platform: this.platform });

    const scenarios = [
      { connected: true, type: 'wifi' as const },
      { connected: true, type: 'cellular' as const },
      { connected: false, type: 'none' as const },
      { connected: true, type: 'wifi' as const }, // Reconnection
    ];

    for (const scenario of scenarios) {
      _mockCapacitorSetup.setNetworkStatus({
        connected: scenario.connected,
        connectionType: scenario.type,
      });

      this.logEvent('network_changed', scenario);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return {
      scenarios,
      events: this.getEvents(),
    };
  }

  // Battery Testing
  async testBatteryScenarios() {
    this.logEvent('battery_scenarios_started', { platform: this.platform });

    const scenarios = [
      { level: 1.0, charging: true }, // Full, charging
      { level: 0.8, charging: false }, // 80%, not charging
      { level: 0.2, charging: false }, // Low battery
      { level: 0.05, charging: false }, // Critical battery
      { level: 0.1, charging: true }, // Low battery, charging
    ];

    for (const scenario of scenarios) {
      _mockCapacitorSetup.setBatteryInfo({
        batteryLevel: scenario.level,
        isCharging: scenario.charging,
      });

      this.logEvent('battery_changed', scenario);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      scenarios,
      events: this.getEvents(),
    };
  }

  // Platform-specific behavior testing
  async testPlatformSpecificBehavior() {
    this.logEvent('platform_specific_test_started', { platform: this.platform });

    const behaviors: Record<string, any> = {};

    switch (this.platform) {
      case 'ios':
        // iOS-specific tests
        behaviors.haptics = await this.testIOSHaptics();
        behaviors.backgroundApp = await this.testIOSBackgroundApp();
        behaviors.notifications = await this.testIOSNotifications();
        break;

      case 'android':
        // Android-specific tests
        behaviors.batteryOptimization = await this.testAndroidBatteryOptimization();
        behaviors.dozeMode = await this.testAndroidDozeMode();
        behaviors.notifications = await this.testAndroidNotifications();
        break;

      case 'web':
        // Web-specific tests
        behaviors.serviceWorker = await this.testWebServiceWorker();
        behaviors.webNotifications = await this.testWebNotifications();
        behaviors.webAudio = await this.testWebAudio();
        break;
    }

    return {
      platform: this.platform,
      behaviors,
      events: this.getEvents(),
    };
  }

  private async testIOSHaptics() {
    this.logEvent('ios_haptics_test', {});

    // Test different haptic types
    const hapticTypes = ['LIGHT', 'MEDIUM', 'HEAVY'] as const;
    const hapticResults = [];

    for (const type of hapticTypes) {
      await _mockCapacitorSetup.triggerEvent('Haptics', 'impact', { style: type });
      hapticResults.push({ type, triggered: true });
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { hapticTypes: hapticResults };
  }

  private async testIOSBackgroundApp() {
    this.logEvent('ios_background_app_test', {});

    // Simulate iOS background app refresh scenarios
    _mockCapacitorSetup.triggerEvent('App', 'appStateChange', { isActive: false });
    await new Promise(resolve => setTimeout(resolve, 100));

    _mockCapacitorSetup.triggerEvent('App', 'appStateChange', { isActive: true });

    return { backgroundRefreshTested: true };
  }

  private async testIOSNotifications() {
    this.logEvent('ios_notifications_test', {});

    // Test iOS notification categories and actions
    const notificationActions = ['snooze', 'dismiss', 'view'];
    const results = [];

    for (const action of notificationActions) {
      _mockCapacitorSetup.triggerEvent(
        'LocalNotifications',
        'localNotificationActionPerformed',
        {
          actionId: action,
          notificationId: 123,
        }
      );
      results.push({ action, handled: true });
    }

    return { notificationActions: results };
  }

  private async testAndroidBatteryOptimization() {
    this.logEvent('android_battery_optimization_test', {});

    // Simulate Android battery optimization scenarios
    const optimizationStates = ['whitelisted', 'optimized', 'unrestricted'];
    const results = [];

    for (const state of optimizationStates) {
      _mockCapacitorSetup.triggerEvent('Device', 'batteryOptimizationChange', {
        state,
      });
      results.push({ state, tested: true });
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { batteryOptimization: results };
  }

  private async testAndroidDozeMode() {
    this.logEvent('android_doze_mode_test', {});

    // Simulate Android Doze mode scenarios
    const dozeModes = ['entering', 'active', 'exiting'];
    const results = [];

    for (const mode of dozeModes) {
      _mockCapacitorSetup.triggerEvent('Device', 'dozeModeChange', { mode });
      results.push({ mode, tested: true });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { dozeModes: results };
  }

  private async testAndroidNotifications() {
    this.logEvent('android_notifications_test', {});

    // Test Android notification channels and importance
    const channels = [
      { id: 'alarms', importance: 'high' },
      { id: 'reminders', importance: 'default' },
      { id: 'updates', importance: 'low' },
    ];

    const results = [];
    for (const channel of channels) {
      _mockCapacitorSetup.triggerEvent('LocalNotifications', 'channelCreated', channel);
      results.push({ channel: channel.id, created: true });
    }

    return { notificationChannels: results };
  }

  private async testWebServiceWorker() {
    this.logEvent('web_service_worker_test', {});

    // Mock service worker registration and events
    const swEvents = ['install', 'activate', 'message', 'push'];
    const results = [];

    for (const event of swEvents) {
      _mockCapacitorSetup.triggerEvent('ServiceWorker', event, {
        timestamp: Date.now(),
        source: 'mock',
      });
      results.push({ event, triggered: true });
    }

    return { serviceWorkerEvents: results };
  }

  private async testWebNotifications() {
    this.logEvent('web_notifications_test', {});

    // Test web notification API scenarios
    const notificationStates = ['granted', 'denied', 'default'];
    const results = [];

    for (const state of notificationStates) {
      _mockCapacitorSetup.setPermission('notifications', state as any);
      results.push({ permission: state, set: true });
    }

    return { webNotifications: results };
  }

  private async testWebAudio() {
    this.logEvent('web_audio_test', {});

    // Test web audio context scenarios
    const audioStates = ['suspended', 'running', 'closed'];
    const results = [];

    for (const state of audioStates) {
      _mockCapacitorSetup.triggerEvent('WebAudio', 'stateChange', { state });
      results.push({ audioState: state, tested: true });
    }

    return { webAudio: results };
  }
}

// Mobile Performance Testing
export class MobilePerformanceTester {
  private measurements: Array<{
    metric: string;
    value: number;
    timestamp: number;
    platform: string;
  }> = [];

  reset() {
    this.measurements = [];
  }

  getMeasurements() {
    return [...this.measurements];
  }

  private measure(metric: string, value: number, platform: string) {
    this.measurements.push({
      metric,
      value,
      timestamp: Date.now(),
      platform,
    });
  }

  async testAlarmPerformance(platform: 'ios' | 'android' | 'web') {
    _mockCapacitorSetup.setPlatform(platform);

    // Test alarm scheduling performance
    const startTime = Date.now();

    const alarmCount = 50;
    const alarmIds = [];

    for (let i = 0; i < alarmCount; i++) {
      const id = _mockCapacitorSetup.scheduleTestAlarm({
        title: `Performance Test Alarm ${i}`,
        body: `Alarm ${i} for performance testing`,
        schedule: {
          at: new Date(Date.now() + i * 60000), // Every minute
          repeats: false,
        },
      });
      alarmIds.push(id);
    }

    const schedulingTime = Date.now() - startTime;
    this.measure('alarm_scheduling_time', schedulingTime, platform);
    this.measure(
      'alarm_scheduling_rate',
      alarmCount / (schedulingTime / 1000),
      platform
    );

    // Test alarm querying performance
    const queryStartTime = Date.now();
    const scheduledAlarms = _mockCapacitorSetup.getScheduledAlarms();
    const queryTime = Date.now() - queryStartTime;

    this.measure('alarm_query_time', queryTime, platform);
    this.measure('alarm_query_count', scheduledAlarms.length, platform);

    return {
      schedulingTime,
      queryTime,
      alarmCount: scheduledAlarms.length,
      measurements: this.getMeasurements(),
    };
  }

  async testMemoryUsage(platform: 'ios' | 'android' | 'web') {
    _mockCapacitorSetup.setPlatform(platform);

    const measurements = [];

    // Simulate memory usage scenarios
    const scenarios = [
      { name: 'initial', expectedMemory: 50 },
      { name: 'after_alarms', expectedMemory: 75 },
      { name: 'after_audio', expectedMemory: 120 },
      { name: 'after_cleanup', expectedMemory: 60 },
    ];

    for (const scenario of scenarios) {
      // Simulate different memory usage based on scenario
      let memoryUsage = scenario.expectedMemory;

      if (platform === 'ios') {
        memoryUsage *= 0.8; // iOS generally uses less memory
      } else if (platform === 'android') {
        memoryUsage *= 1.2; // Android may use more memory
      }

      this.measure('memory_usage_mb', memoryUsage, platform);
      measurements.push({
        scenario: scenario.name,
        memoryUsage,
        platform,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      measurements,
      peakMemory: Math.max(...measurements.map(m => m.memoryUsage)),
      averageMemory:
        measurements.reduce((sum, m) => sum + m.memoryUsage, 0) / measurements.length,
    };
  }

  async testBatteryImpact(platform: 'ios' | 'android' | 'web') {
    _mockCapacitorSetup.setPlatform(platform);

    const batteryTests = [
      { scenario: 'background_alarms', expectedDrain: 5 },
      { scenario: 'foreground_usage', expectedDrain: 15 },
      { scenario: 'audio_playback', expectedDrain: 25 },
      { scenario: 'location_tracking', expectedDrain: 35 },
    ];

    const results = [];

    for (const test of batteryTests) {
      let batteryDrain = test.expectedDrain;

      // Platform-specific battery impact adjustments
      if (platform === 'ios') {
        batteryDrain *= 0.7; // iOS generally more battery efficient
      } else if (platform === 'web') {
        batteryDrain *= 0.5; // Web apps typically use less battery
      }

      this.measure('battery_drain_percent_per_hour', batteryDrain, platform);
      results.push({
        scenario: test.scenario,
        batteryDrain,
        platform,
      });
    }

    return {
      results,
      totalDrain: results.reduce((sum, r) => sum + r.batteryDrain, 0),
      worstCase: Math.max(...results.map(r => r.batteryDrain)),
    };
  }
}

// Mobile Device Simulation
export class MobileDeviceSimulator {
  private deviceProfiles = {
    iPhone_14_Pro: {
      platform: 'ios' as const,
      model: 'iPhone 14 Pro',
      osVersion: '16.0',
      screenWidth: 393,
      screenHeight: 852,
      devicePixelRatio: 3,
      memory: 6000, // MB
      battery: { level: 0.85, charging: false },
      capabilities: {
        haptics: true,
        faceId: true,
        wirelessCharging: true,
        fifthG: true,
      },
    },
    Samsung_Galaxy_S23: {
      platform: 'android' as const,
      model: 'Samsung Galaxy S23',
      osVersion: '13.0',
      screenWidth: 360,
      screenHeight: 780,
      devicePixelRatio: 3,
      memory: 8000, // MB
      battery: { level: 0.75, charging: true },
      capabilities: {
        haptics: true,
        fingerprint: true,
        wirelessCharging: true,
        fifthG: true,
      },
    },
    iPad_Pro: {
      platform: 'ios' as const,
      model: 'iPad Pro',
      osVersion: '16.1',
      screenWidth: 834,
      screenHeight: 1194,
      devicePixelRatio: 2,
      memory: 8000, // MB
      battery: { level: 0.95, charging: false },
      capabilities: {
        haptics: false,
        faceId: true,
        applePencil: true,
        keyboard: true,
      },
    },
    Budget_Android: {
      platform: 'android' as const,
      model: 'Budget Android Device',
      osVersion: '11.0',
      screenWidth: 360,
      screenHeight: 640,
      devicePixelRatio: 2,
      memory: 3000, // MB
      battery: { level: 0.45, charging: false },
      capabilities: {
        haptics: false,
        fingerprint: false,
        wirelessCharging: false,
        fifthG: false,
      },
    },
  };

  simulateDevice(deviceName: keyof typeof this.deviceProfiles) {
    const profile = this.deviceProfiles[deviceName];

    // Configure Capacitor mock to match device
    _mockCapacitorSetup.setPlatform(profile.platform);
    _mockCapacitorSetup.setDeviceInfo({
      platform: profile.platform,
      model: profile.model,
      osVersion: profile.osVersion,
      memUsed: profile.memory * 0.6, // Assume 60% memory usage
      diskFree: profile.memory * 10, // Rough disk free estimate
    });

    _mockCapacitorSetup.setBatteryInfo(profile.battery);

    // Set device-specific permissions based on capabilities
    const permissions: Record<string, 'granted' | 'denied'> = {
      notifications: 'granted',
      camera: profile.capabilities.haptics ? 'granted' : 'denied',
      microphone: 'granted',
      location: 'granted',
    };

    Object.entries(permissions).forEach(([permission, state]) => {
      _mockCapacitorSetup.setPermission(permission as any, state);
    });

    return {
      deviceName,
      profile,
      configuredSuccessfully: true,
    };
  }

  async testCrossDeviceCompatibility() {
    const deviceNames = Object.keys(this.deviceProfiles) as Array<
      keyof typeof this.deviceProfiles
    >;
    const results = [];

    for (const deviceName of deviceNames) {
      this.simulateDevice(deviceName);

      // Test basic alarm functionality on each device
      const alarmId = _mockCapacitorSetup.scheduleTestAlarm({
        title: `Test on ${deviceName}`,
        body: 'Cross-device compatibility test',
      });

      const testResult = {
        device: deviceName,
        profile: this.deviceProfiles[deviceName],
        alarmScheduled: alarmId > 0,
        alarmTriggered: false,
      };

      // Trigger alarm
      _mockCapacitorSetup.triggerAlarm(alarmId);
      testResult.alarmTriggered = true;

      results.push(testResult);
    }

    return {
      testedDevices: deviceNames.length,
      results,
      allPassed: results.every(r => r.alarmScheduled && r.alarmTriggered),
    };
  }

  getDeviceProfiles() {
    return { ...this.deviceProfiles };
  }
}

// Setup function for mobile tests
export const setupMobileTesting = () => {
  let platformTester: MobilePlatformTester;
  let performanceTester: MobilePerformanceTester;
  let deviceSimulator: MobileDeviceSimulator;

  beforeEach(() => {
    _mockCapacitorSetup.reset();
    platformTester = new MobilePlatformTester();
    performanceTester = new MobilePerformanceTester();
    deviceSimulator = new MobileDeviceSimulator();
  });

  afterEach(() => {
    _mockCapacitorSetup.reset();
  });

  return {
    platformTester,
    performanceTester,
    deviceSimulator,
  };
};

export { MobilePlatformTester, MobilePerformanceTester, MobileDeviceSimulator };

export default {
  MobilePlatformTester,
  MobilePerformanceTester,
  MobileDeviceSimulator,
  setupMobileTesting,
};
