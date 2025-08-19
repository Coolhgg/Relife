/**
 * Mobile Testing Utilities for Capacitor Plugin Testing
 *
 * Provides comprehensive testing utilities for mobile functionality including:
 * - Alarm scheduling and management
 * - Audio playback testing
 * - Background task simulation
 * - Device capability testing
 * - Notification testing
 */

import { _mockCapacitorSetup } from '../../src/__tests__/mocks/capacitor.mock';

export interface TestAlarmConfig {
  id?: number;
  title: string;
  body: string;
  schedule: {
    at?: Date;
    repeats?: boolean;
    every?: 'day' | 'week' | 'month';
    allowWhileIdle?: boolean;
  };
  sound?: string;
  extra?: Record<string, any>;
}

export interface TestAudioConfig {
  assetId: string;
  assetPath: string;
  volume?: number;
  loop?: boolean;
}

export interface TestDeviceConfig {
  platform: 'web' | 'ios' | 'android';
  model?: string;
  osVersion?: string;
  manufacturer?: string;
  isVirtual?: boolean;
}

/**
 * Mobile Test Helper Class
 * Provides structured testing for mobile Capacitor functionality
 */
export class MobileTestHelper {
  private static instance: MobileTestHelper;

  static getInstance(): MobileTestHelper {
    if (!MobileTestHelper.instance) {
      MobileTestHelper.instance = new MobileTestHelper();
    }
    return MobileTestHelper.instance;
  }

  /**
   * Device Testing Utilities
   */
  device = {
    /**
     * Switch platform for testing cross-platform functionality
     */
    switchPlatform: (platform: 'web' | 'ios' | 'android') => {
      _mockCapacitorSetup.setPlatform(platform);
      console.log(`📱 Test device switched to: ${platform}`);
    },

    /**
     * Configure mock device characteristics
     */
    configure: (config: TestDeviceConfig) => {
      _mockCapacitorSetup.setPlatform(config.platform);

      if (config.model || config.osVersion || config.manufacturer || config.isVirtual !== undefined) {
        _mockCapacitorSetup.setDeviceInfo({
          platform: config.platform,
          model: config.model || 'Test Device',
          osVersion: config.osVersion || '15.0',
          manufacturer: config.manufacturer || 'Test Manufacturer',
          isVirtual: config.isVirtual || false
        });
      }

      console.log('📱 Test device configured:', config);
    },

    /**
     * Test battery states for low-battery alarm scenarios
     */
    setBatteryLevel: (level: number, isCharging: boolean = false) => {
      // This would need to be implemented in the mock if needed
      console.log(`🔋 Test battery set to ${Math.round(level * 100)}% ${isCharging ? '(charging)' : ''}`);
    },

    /**
     * Simulate device going to sleep/wake for background testing
     */
    simulateSleep: () => {
      console.log('😴 Simulating device sleep');
      // Could trigger background mode events here
    },

    simulateWake: () => {
      console.log('😃 Simulating device wake');
    }
  };

  /**
   * Alarm Testing Utilities
   */
  alarms = {
    /**
     * Schedule a test alarm
     */
    schedule: async (config: TestAlarmConfig): Promise<number> => {
      const alarmId = _mockCapacitorSetup.scheduleTestAlarm({
        id: config.id || Date.now(),
        title: config.title,
        body: config.body,
        schedule: config.schedule,
        sound: config.sound || 'default',
        extra: { isAlarm: true, ...config.extra }
      });

      console.log(`⏰ Test alarm scheduled: ${config.title} (ID: ${alarmId})`);
      return alarmId;
    },

    /**
     * Trigger an alarm for testing alarm handling
     */
    trigger: async (alarmId: number) => {
      _mockCapacitorSetup.triggerAlarm(alarmId);
      console.log(`🔔 Test alarm triggered: ${alarmId}`);
    },

    /**
     * Get all scheduled test alarms
     */
    getScheduled: () => {
      const alarms = _mockCapacitorSetup.getScheduledAlarms();
      console.log(`📋 Scheduled test alarms: ${alarms.length}`);
      return alarms;
    },

    /**
     * Get active (triggered) alarms
     */
    getActive: () => {
      const active = _mockCapacitorSetup.getActiveAlarms();
      console.log(`🚨 Active test alarms: ${active.length}`);
      return active;
    },

    /**
     * Get alarm history for testing
     */
    getHistory: () => {
      const history = _mockCapacitorSetup.getAlarmHistory();
      console.log(`📚 Test alarm history: ${history.length} events`);
      return history;
    },

    /**
     * Test snooze functionality
     */
    snooze: async (alarmId: number, minutes: number = 5) => {
      const newSchedule = new Date(Date.now() + minutes * 60 * 1000);
      await this.schedule({
        id: alarmId + 1000, // Offset to avoid conflicts
        title: 'Snoozed Alarm',
        body: 'This alarm was snoozed',
        schedule: { at: newSchedule },
        extra: { originalAlarmId: alarmId, snoozed: true }
      });
      console.log(`😴 Alarm ${alarmId} snoozed for ${minutes} minutes`);
    },

    /**
     * Clear all test alarms
     */
    clearAll: () => {
      _mockCapacitorSetup.reset();
      console.log('🧹 All test alarms cleared');
    }
  };

  /**
   * Audio Testing Utilities
   */
  audio = {
    /**
     * Load test audio file
     */
    load: async (config: TestAudioConfig) => {
      await _mockCapacitorSetup.loadTestSound(config.assetId, config.assetPath);
      console.log(`🎵 Test audio loaded: ${config.assetId}`);
    },

    /**
     * Test audio playback
     */
    play: async (assetId: string) => {
      const mockAudio = (global as any).mockAudio || {};
      if (mockAudio[assetId]) {
        mockAudio[assetId].play();
      }
      console.log(`▶️ Test audio playing: ${assetId}`);
    },

    /**
     * Test audio pause
     */
    pause: async (assetId: string) => {
      const mockAudio = (global as any).mockAudio || {};
      if (mockAudio[assetId]) {
        mockAudio[assetId].pause();
      }
      console.log(`⏸️ Test audio paused: ${assetId}`);
    },

    /**
     * Test audio stop
     */
    stop: async (assetId: string) => {
      const mockAudio = (global as any).mockAudio || {};
      if (mockAudio[assetId]) {
        mockAudio[assetId].currentTime = 0;
        mockAudio[assetId].pause();
      }
      console.log(`⏹️ Test audio stopped: ${assetId}`);
    },

    /**
     * Get currently playing audio
     */
    getCurrentlyPlaying: () => {
      const current = _mockCapacitorSetup.getCurrentAudio();
      console.log('🎵 Currently playing:', current?.currentlyPlaying || 'none');
      return current;
    },

    /**
     * Get loaded sounds
     */
    getLoaded: () => {
      const loaded = _mockCapacitorSetup.getLoadedSounds();
      console.log(`🎧 Loaded test sounds: ${loaded.length}`);
      return loaded;
    }
  };

  /**
   * Background Task Testing Utilities
   */
  background = {
    /**
     * Test background mode activation
     */
    enableBackgroundMode: async () => {
      await _mockCapacitorSetup.enableBackgroundMode();
      console.log('🌙 Background mode enabled for testing');
    },

    /**
     * Test keep awake functionality
     */
    keepAwake: async () => {
      // This would use the KeepAwake mock
      console.log('👁️ Keep awake enabled for testing');
    },

    /**
     * Test background task execution
     */
    runBackgroundTask: async (taskName: string, duration: number = 5000) => {
      console.log(`🚀 Running background task: ${taskName} (${duration}ms)`);
      return new Promise(resolve => {
        setTimeout(() => {
          console.log(`✅ Background task completed: ${taskName}`);
          resolve(taskName);
        }, duration);
      });
    },

    /**
     * Get background state
     */
    getState: () => {
      const state = _mockCapacitorSetup.getBackgroundState();
      console.log('🌙 Background state:', state);
      return state;
    }
  };

  /**
   * Notification Testing Utilities
   */
  notifications = {
    /**
     * Test notification permissions
     */
    requestPermissions: async () => {
      _mockCapacitorSetup.setPermission('notifications', 'granted');
      console.log('🔔 Notification permissions granted for testing');
    },

    /**
     * Test notification denial
     */
    denyPermissions: async () => {
      _mockCapacitorSetup.setPermission('notifications', 'denied');
      console.log('🚫 Notification permissions denied for testing');
    },

    /**
     * Simulate incoming push notification
     */
    simulatePush: (data: any) => {
      console.log('📨 Simulating push notification:', data);
      // This would trigger push notification events
    }
  };

  /**
   * Haptics Testing Utilities
   */
  haptics = {
    /**
     * Test haptic feedback
     */
    testImpact: (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'MEDIUM') => {
      console.log(`📳 Testing haptic impact: ${style}`);
    },

    /**
     * Test haptic notification
     */
    testNotification: (type: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS') => {
      console.log(`📳 Testing haptic notification: ${type}`);
    }
  };

  /**
   * Testing Scenarios
   * Pre-built test scenarios for common mobile testing needs
   */
  scenarios = {
    /**
     * Test complete alarm flow: schedule -> trigger -> handle
     */
    testAlarmFlow: async (alarmConfig: TestAlarmConfig) => {
      console.log('🧪 Testing complete alarm flow...');

      // 1. Schedule alarm
      const alarmId = await this.alarms.schedule(alarmConfig);

      // 2. Verify it's scheduled
      const scheduled = this.alarms.getScheduled();
      expect(scheduled.find(a => a.id === alarmId)).toBeTruthy();

      // 3. Trigger the alarm
      await this.alarms.trigger(alarmId);

      // 4. Verify it's active
      const active = this.alarms.getActive();
      expect(active.includes(alarmId)).toBeTruthy();

      // 5. Check history
      const history = this.alarms.getHistory();
      expect(history.find(h => h.id === alarmId && h.action === 'triggered')).toBeTruthy();

      console.log('✅ Alarm flow test completed successfully');
      return alarmId;
    },

    /**
     * Test audio playback for alarms
     */
    testAudioPlayback: async (audioConfig: TestAudioConfig) => {
      console.log('🧪 Testing audio playback...');

      // 1. Load audio
      await this.audio.load(audioConfig);

      // 2. Verify loaded
      const loaded = this.audio.getLoaded();
      expect(loaded.includes(audioConfig.assetId)).toBeTruthy();

      // 3. Play audio
      await this.audio.play(audioConfig.assetId);

      // 4. Check current playing
      const current = this.audio.getCurrentlyPlaying();
      expect(current?.currentlyPlaying).toBe(audioConfig.assetId);

      console.log('✅ Audio playback test completed successfully');
    },

    /**
     * Test background reliability
     */
    testBackgroundReliability: async () => {
      console.log('🧪 Testing background reliability...');

      // 1. Enable background mode
      await this.background.enableBackgroundMode();

      // 2. Keep device awake
      await this.background.keepAwake();

      // 3. Simulate background task
      await this.background.runBackgroundTask('alarm-check', 1000);

      // 4. Check state
      const state = this.background.getState();
      expect(state?.isEnabled).toBeTruthy();

      console.log('✅ Background reliability test completed successfully');
    },

    /**
     * Test cross-platform compatibility
     */
    testCrossPlatform: async (testFn: () => Promise<void>) => {
      console.log('🧪 Testing cross-platform compatibility...');

      const platforms: Array<'web' | 'ios' | 'android'> = ['web', 'ios', 'android'];
      const results: Record<string, boolean> = {};

      for (const platform of platforms) {
        try {
          console.log(`📱 Testing on ${platform}...`);
          this.device.switchPlatform(platform);
          await testFn();
          results[platform] = true;
          console.log(`✅ ${platform} test passed`);
        } catch (error) {
          results[platform] = false;
          console.error(`❌ ${platform} test failed:`, error);
        }
      }

      console.log('🏁 Cross-platform test results:', results);
      return results;
    }
  };

  /**
   * Reset all test state
   */
  reset = () => {
    _mockCapacitorSetup.reset();
    console.log('🧹 Mobile test helper reset');
  };
}

/**
 * Convenience function to get mobile test helper instance
 */
export const createMobileTestHelper = () => MobileTestHelper.getInstance();

/**
 * Testing utilities for specific mobile scenarios
 */
export const mobileTestUtils = {
  /**
   * Create a simple alarm for testing
   */
  createTestAlarm: (overrides: Partial<TestAlarmConfig> = {}): TestAlarmConfig => ({
    title: 'Test Alarm',
    body: 'This is a test alarm',
    schedule: {
      at: new Date(Date.now() + 60000), // 1 minute from now
      allowWhileIdle: true
    },
    sound: 'default',
    ...overrides
  }),

  /**
   * Create test audio configuration
   */
  createTestAudio: (overrides: Partial<TestAudioConfig> = {}): TestAudioConfig => ({
    assetId: 'test-sound',
    assetPath: '/sounds/test.mp3',
    volume: 1.0,
    ...overrides
  }),

  /**
   * Create test device configuration
   */
  createTestDevice: (platform: 'web' | 'ios' | 'android', overrides: Partial<TestDeviceConfig> = {}): TestDeviceConfig => ({
    platform,
    model: platform === 'ios' ? 'iPhone 13' : platform === 'android' ? 'Pixel 6' : 'WebKit',
    osVersion: platform === 'ios' ? '15.0' : platform === 'android' ? '12' : 'Browser',
    manufacturer: platform === 'ios' ? 'Apple' : platform === 'android' ? 'Google' : 'Browser',
    isVirtual: false,
    ...overrides
  }),

  /**
   * Wait for a specified time (useful in tests)
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate unique test IDs
   */
  generateTestId: () => Date.now() + Math.floor(Math.random() * 1000),

  /**
   * Validate alarm configuration
   */
  validateAlarmConfig: (config: TestAlarmConfig) => {
    if (!config.title || !config.body) {
      throw new Error('Alarm must have title and body');
    }
    if (!config.schedule || (!config.schedule.at && !config.schedule.repeats)) {
      throw new Error('Alarm must have valid schedule');
    }
    return true;
  }
};

// Global helper for easy testing
if (typeof global !== 'undefined') {
  (global as any).mobileTestHelper = createMobileTestHelper();
}