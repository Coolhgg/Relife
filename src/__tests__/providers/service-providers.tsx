/**
 * Service-Specific Test Providers
 *
 * Mock implementations and providers for all application services with realistic
 * behavior patterns and comprehensive testing scenarios.
 */

import React, { ReactNode, createContext, useContext } from 'react';

// ===============================
// SERVICE INTERFACES
// ===============================

export interface MockAlarmService {
  createAlarm: jest.MockedFunction<(alarm: any) => Promise<any>>;
  updateAlarm: jest.MockedFunction<(id: string, updates: any) => Promise<any>>;
  deleteAlarm: jest.MockedFunction<(id: string) => Promise<void>>;
  getAlarms: jest.MockedFunction<() => Promise<any[]>>;
  getAlarm: jest.MockedFunction<(id: string) => Promise<any | null>>;
  scheduleAlarm: jest.MockedFunction<(alarm: any) => Promise<void>>;
  cancelAlarm: jest.MockedFunction<(id: string) => Promise<void>>;
  snoozeAlarm: jest.MockedFunction<(id: string, minutes?: number) => Promise<void>>;
  stopAlarm: jest.MockedFunction<(id: string) => Promise<void>>;
  validateAlarmTime: jest.MockedFunction<(time: string) => boolean>;
  getNextAlarmTime: jest.MockedFunction<() => Date | null>;
  syncAlarms: jest.MockedFunction<() => Promise<void>>;
  exportAlarms: jest.MockedFunction<() => Promise<string>>;
  importAlarms: jest.MockedFunction<(data: string) => Promise<number>>;
}

export interface MockAnalyticsService {
  track: jest.MockedFunction<(event: string, properties?: any) => void>;
  identify: jest.MockedFunction<(userId: string, traits?: any) => void>;
  page: jest.MockedFunction<(name: string, properties?: any) => void>;
  group: jest.MockedFunction<(groupId: string, traits?: any) => void>;
  alias: jest.MockedFunction<(userId: string, previousId?: string) => void>;
  reset: jest.MockedFunction<() => void>;
  flush: jest.MockedFunction<() => Promise<void>>;
  getAnalyticsData: jest.MockedFunction<(dateRange: any) => Promise<any>>;
  setUserProperties: jest.MockedFunction<(properties: any) => void>;
  trackConversion: jest.MockedFunction<(event: string, value?: number) => void>;
  trackError: jest.MockedFunction<(error: Error, context?: any) => void>;
}

export interface MockBattleService {
  createBattle: jest.MockedFunction<(config: any) => Promise<any>>;
  joinBattle: jest.MockedFunction<(battleId: string) => Promise<void>>;
  leaveBattle: jest.MockedFunction<(battleId: string) => Promise<void>>;
  getBattles: jest.MockedFunction<(status?: string) => Promise<any[]>>;
  getBattle: jest.MockedFunction<(id: string) => Promise<any | null>>;
  startBattle: jest.MockedFunction<(battleId: string) => Promise<void>>;
  endBattle: jest.MockedFunction<(battleId: string) => Promise<any>>;
  submitAnswer: jest.MockedFunction<
    (battleId: string, answer: any) => Promise<boolean>
  >;
  getLeaderboard: jest.MockedFunction<() => Promise<any[]>>;
  getUserStats: jest.MockedFunction<(userId: string) => Promise<any>>;
  inviteToB;

  attle: jest.MockedFunction<(battleId: string, userIds: string[]) => Promise<void>>;
  spectate: jest.MockedFunction<(battleId: string) => Promise<void>>;
}

export interface MockSubscriptionService {
  getSubscription: jest.MockedFunction<() => Promise<any | null>>;
  getSubscriptions: jest.MockedFunction<() => Promise<any[]>>;
  subscribe: jest.MockedFunction<(tier: string, paymentMethod?: any) => Promise<any>>;
  cancelSubscription: jest.MockedFunction<(subscriptionId: string) => Promise<void>>;
  updateSubscription: jest.MockedFunction<
    (subscriptionId: string, updates: any) => Promise<any>
  >;
  resumeSubscription: jest.MockedFunction<(subscriptionId: string) => Promise<void>>;
  getFeatures: jest.MockedFunction<(tier?: string) => string[]>;
  checkAccess: jest.MockedFunction<(feature: string, tier?: string) => boolean>;
  getUsage: jest.MockedFunction<(feature: string) => Promise<number>>;
  getLimit: jest.MockedFunction<(feature: string) => number>;
  trackUsage: jest.MockedFunction<(feature: string, amount?: number) => Promise<void>>;
  getBillingHistory: jest.MockedFunction<() => Promise<any[]>>;
  updatePaymentMethod: jest.MockedFunction<(paymentMethod: any) => Promise<void>>;
}

export interface MockVoiceService {
  generateVoice: jest.MockedFunction<(text: string, options?: any) => Promise<any>>;
  uploadVoice: jest.MockedFunction<(file: File, metadata?: any) => Promise<any>>;
  deleteVoice: jest.MockedFunction<(voiceId: string) => Promise<void>>;
  getVoices: jest.MockedFunction<(userId?: string) => Promise<any[]>>;
  getVoice: jest.MockedFunction<(voiceId: string) => Promise<any | null>>;
  processVoice: jest.MockedFunction<(voiceId: string) => Promise<void>>;
  synthesizeVoice: jest.MockedFunction<
    (voiceId: string, text: string) => Promise<string>
  >;
  cloneVoice: jest.MockedFunction<(sourceId: string, name: string) => Promise<any>>;
  trainVoiceModel: jest.MockedFunction<
    (voiceId: string, samples: File[]) => Promise<void>
  >;
  getVoicePreview: jest.MockedFunction<
    (voiceId: string, text?: string) => Promise<string>
  >;
  analyzeVoice: jest.MockedFunction<(voiceId: string) => Promise<any>>;
}

export interface MockNotificationService {
  requestPermission: jest.MockedFunction<() => Promise<NotificationPermission>>;
  showNotification: jest.MockedFunction<
    (title: string, options?: any) => Promise<void>
  >;
  scheduleNotification: jest.MockedFunction<
    (id: string, notification: any, when: Date) => Promise<void>
  >;
  cancelNotification: jest.MockedFunction<(id: string) => Promise<void>>;
  cancelAllNotifications: jest.MockedFunction<() => Promise<void>>;
  getScheduledNotifications: jest.MockedFunction<() => Promise<any[]>>;
  updateNotificationSettings: jest.MockedFunction<(settings: any) => Promise<void>>;
  getNotificationSettings: jest.MockedFunction<() => Promise<any>>;
  registerDevice: jest.MockedFunction<(token: string) => Promise<void>>;
  unregisterDevice: jest.MockedFunction<() => Promise<void>>;
}

export interface MockAudioService {
  loadSound: jest.MockedFunction<(url: string) => Promise<any>>;
  playSound: jest.MockedFunction<(soundId: string, options?: any) => Promise<void>>;
  stopSound: jest.MockedFunction<(soundId: string) => Promise<void>>;
  pauseSound: jest.MockedFunction<(soundId: string) => Promise<void>>;
  resumeSound: jest.MockedFunction<(soundId: string) => Promise<void>>;
  setVolume: jest.MockedFunction<(soundId: string, volume: number) => Promise<void>>;
  fadeIn: jest.MockedFunction<(soundId: string, duration: number) => Promise<void>>;
  fadeOut: jest.MockedFunction<(soundId: string, duration: number) => Promise<void>>;
  getSoundDuration: jest.MockedFunction<(soundId: string) => Promise<number>>;
  getCurrentTime: jest.MockedFunction<(soundId: string) => Promise<number>>;
  seekTo: jest.MockedFunction<(soundId: string, time: number) => Promise<void>>;
  createSoundGroup: jest.MockedFunction<(groupId: string, soundIds: string[]) => void>;
  deleteSound: jest.MockedFunction<(soundId: string) => Promise<void>>;
}

export interface MockStorageService {
  set: jest.MockedFunction<(key: string, value: any, options?: any) => Promise<void>>;
  get: jest.MockedFunction<(key: string) => Promise<any>>;
  remove: jest.MockedFunction<(key: string) => Promise<void>>;
  clear: jest.MockedFunction<() => Promise<void>>;
  keys: jest.MockedFunction<() => Promise<string[]>>;
  size: jest.MockedFunction<() => Promise<number>>;
  has: jest.MockedFunction<(key: string) => Promise<boolean>>;
  getMultiple: jest.MockedFunction<(keys: string[]) => Promise<Record<string, any>>>;
  setMultiple: jest.MockedFunction<(items: Record<string, any>) => Promise<void>>;
  removeMultiple: jest.MockedFunction<(keys: string[]) => Promise<void>>;
  sync: jest.MockedFunction<() => Promise<void>>;
  backup: jest.MockedFunction<() => Promise<string>>;
  restore: jest.MockedFunction<(backup: string) => Promise<void>>;
}

export interface MockSecurityService {
  encrypt: jest.MockedFunction<(data: any, key?: string) => Promise<string>>;
  decrypt: jest.MockedFunction<(encryptedData: string, key?: string) => Promise<any>>;
  hash: jest.MockedFunction<(data: string, algorithm?: string) => Promise<string>>;
  verify: jest.MockedFunction<(data: string, hash: string) => Promise<boolean>>;
  generateToken: jest.MockedFunction<
    (payload?: any, expiresIn?: string) => Promise<string>
  >;
  validateToken: jest.MockedFunction<(token: string) => Promise<boolean>>;
  generateSecureId: jest.MockedFunction<() => string>;
  generateKeyPair: jest.MockedFunction<
    () => Promise<{ publicKey: string; privateKey: string }>
  >;
  signData: jest.MockedFunction<(data: any, privateKey: string) => Promise<string>>;
  verifySignature: jest.MockedFunction<
    (data: any, signature: string, publicKey: string) => Promise<boolean>
  >;
}

// ===============================
// SERVICE IMPLEMENTATIONS
// ===============================

const createMockAlarmService = (): MockAlarmService => ({
  createAlarm: jest.fn().mockResolvedValue({ id: 'new-alarm-id', created: true }),
  updateAlarm: jest.fn().mockResolvedValue({ updated: true }),
  deleteAlarm: jest.fn().mockResolvedValue(undefined),
  getAlarms: jest.fn().mockResolvedValue([]),
  getAlarm: jest.fn().mockResolvedValue(null),
  scheduleAlarm: jest.fn().mockResolvedValue(undefined),
  cancelAlarm: jest.fn().mockResolvedValue(undefined),
  snoozeAlarm: jest.fn().mockResolvedValue(undefined),
  stopAlarm: jest.fn().mockResolvedValue(undefined),
  validateAlarmTime: jest.fn().mockReturnValue(true),
  getNextAlarmTime: jest
    .fn()
    .mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  syncAlarms: jest.fn().mockResolvedValue(undefined),
  exportAlarms: jest.fn().mockResolvedValue(JSON.stringify([])),
  importAlarms: jest.fn().mockResolvedValue(0),
});

const createMockAnalyticsService = (): MockAnalyticsService => ({
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  group: jest.fn(),
  alias: jest.fn(),
  reset: jest.fn(),
  flush: jest.fn().mockResolvedValue(undefined),
  getAnalyticsData: jest.fn().mockResolvedValue({}),
  setUserProperties: jest.fn(),
  trackConversion: jest.fn(),
  trackError: jest.fn(),
});

const createMockBattleService = (): MockBattleService => ({
  createBattle: jest.fn().mockResolvedValue({ id: 'battle-123', created: true }),
  joinBattle: jest.fn().mockResolvedValue(undefined),
  leaveBattle: jest.fn().mockResolvedValue(undefined),
  getBattles: jest.fn().mockResolvedValue([]),
  getBattle: jest.fn().mockResolvedValue(null),
  startBattle: jest.fn().mockResolvedValue(undefined),
  endBattle: jest.fn().mockResolvedValue({ winner: 'user-123' }),
  submitAnswer: jest.fn().mockResolvedValue(true),
  getLeaderboard: jest.fn().mockResolvedValue([]),
  getUserStats: jest.fn().mockResolvedValue({ wins: 0, losses: 0, score: 0 }),
  inviteToBattle: jest.fn().mockResolvedValue(undefined),
  spectate: jest.fn().mockResolvedValue(undefined),
});

const createMockSubscriptionService = (): MockSubscriptionService => ({
  getSubscription: jest.fn().mockResolvedValue(null),
  getSubscriptions: jest.fn().mockResolvedValue([]),
  subscribe: jest.fn().mockResolvedValue({ id: 'sub-123', tier: 'premium' }),
  cancelSubscription: jest.fn().mockResolvedValue(undefined),
  updateSubscription: jest.fn().mockResolvedValue({ updated: true }),
  resumeSubscription: jest.fn().mockResolvedValue(undefined),
  getFeatures: jest.fn().mockReturnValue(['basic_alarms']),
  checkAccess: jest.fn().mockReturnValue(true),
  getUsage: jest.fn().mockResolvedValue(0),
  getLimit: jest.fn().mockReturnValue(100),
  trackUsage: jest.fn().mockResolvedValue(undefined),
  getBillingHistory: jest.fn().mockResolvedValue([]),
  updatePaymentMethod: jest.fn().mockResolvedValue(undefined),
});

const createMockVoiceService = (): MockVoiceService => ({
  generateVoice: jest.fn().mockResolvedValue({ url: 'mock-audio-url' }),
  uploadVoice: jest.fn().mockResolvedValue({ id: 'voice-123', processed: false }),
  deleteVoice: jest.fn().mockResolvedValue(undefined),
  getVoices: jest.fn().mockResolvedValue([]),
  getVoice: jest.fn().mockResolvedValue(null),
  processVoice: jest.fn().mockResolvedValue(undefined),
  synthesizeVoice: jest.fn().mockResolvedValue('mock-audio-url'),
  cloneVoice: jest.fn().mockResolvedValue({ id: 'cloned-voice-123' }),
  trainVoiceModel: jest.fn().mockResolvedValue(undefined),
  getVoicePreview: jest.fn().mockResolvedValue('mock-preview-url'),
  analyzeVoice: jest.fn().mockResolvedValue({ quality: 'good', duration: 30 }),
});

const createMockNotificationService = (): MockNotificationService => ({
  requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission),
  showNotification: jest.fn().mockResolvedValue(undefined),
  scheduleNotification: jest.fn().mockResolvedValue(undefined),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  getScheduledNotifications: jest.fn().mockResolvedValue([]),
  updateNotificationSettings: jest.fn().mockResolvedValue(undefined),
  getNotificationSettings: jest.fn().mockResolvedValue({ enabled: true }),
  registerDevice: jest.fn().mockResolvedValue(undefined),
  unregisterDevice: jest.fn().mockResolvedValue(undefined),
});

const createMockAudioService = (): MockAudioService => ({
  loadSound: jest.fn().mockResolvedValue({ id: 'sound-123', loaded: true }),
  playSound: jest.fn().mockResolvedValue(undefined),
  stopSound: jest.fn().mockResolvedValue(undefined),
  pauseSound: jest.fn().mockResolvedValue(undefined),
  resumeSound: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn().mockResolvedValue(undefined),
  fadeIn: jest.fn().mockResolvedValue(undefined),
  fadeOut: jest.fn().mockResolvedValue(undefined),
  getSoundDuration: jest.fn().mockResolvedValue(30),
  getCurrentTime: jest.fn().mockResolvedValue(0),
  seekTo: jest.fn().mockResolvedValue(undefined),
  createSoundGroup: jest.fn(),
  deleteSound: jest.fn().mockResolvedValue(undefined),
});

const createMockStorageService = (): MockStorageService => ({
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  keys: jest.fn().mockResolvedValue([]),
  size: jest.fn().mockResolvedValue(0),
  has: jest.fn().mockResolvedValue(false),
  getMultiple: jest.fn().mockResolvedValue({}),
  setMultiple: jest.fn().mockResolvedValue(undefined),
  removeMultiple: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  backup: jest.fn().mockResolvedValue(JSON.stringify({})),
  restore: jest.fn().mockResolvedValue(undefined),
});

const createMockSecurityService = (): MockSecurityService => ({
  encrypt: jest.fn().mockResolvedValue('encrypted-data'),
  decrypt: jest.fn().mockResolvedValue('decrypted-data'),
  hash: jest.fn().mockResolvedValue('hash-123'),
  verify: jest.fn().mockResolvedValue(true),
  generateToken: jest.fn().mockResolvedValue('token-123'),
  validateToken: jest.fn().mockResolvedValue(true),
  generateSecureId: jest.fn().mockReturnValue('secure-id-123'),
  generateKeyPair: jest.fn().mockResolvedValue({
    publicKey: 'public-key',
    privateKey: 'private-key',
  }),
  signData: jest.fn().mockResolvedValue('signature-123'),
  verifySignature: jest.fn().mockResolvedValue(true),
});

// ===============================
// SERVICE CONTEXTS
// ===============================

const AlarmServiceContext = createContext<MockAlarmService>(createMockAlarmService());
const AnalyticsServiceContext = createContext<MockAnalyticsService>(
  createMockAnalyticsService()
);
const BattleServiceContext = createContext<MockBattleService>(
  createMockBattleService()
);
const SubscriptionServiceContext = createContext<MockSubscriptionService>(
  createMockSubscriptionService()
);
const VoiceServiceContext = createContext<MockVoiceService>(createMockVoiceService());
const NotificationServiceContext = createContext<MockNotificationService>(
  createMockNotificationService()
);
const AudioServiceContext = createContext<MockAudioService>(createMockAudioService());
const StorageServiceContext = createContext<MockStorageService>(
  createMockStorageService()
);
const SecurityServiceContext = createContext<MockSecurityService>(
  createMockSecurityService()
);

// ===============================
// SERVICE PROVIDERS
// ===============================

export const ServiceTestProviders: React.FC<{
  children: ReactNode;
  alarmService?: Partial<MockAlarmService>;
  analyticsService?: Partial<MockAnalyticsService>;
  battleService?: Partial<MockBattleService>;
  subscriptionService?: Partial<MockSubscriptionService>;
  voiceService?: Partial<MockVoiceService>;
  notificationService?: Partial<MockNotificationService>;
  audioService?: Partial<MockAudioService>;
  storageService?: Partial<MockStorageService>;
  securityService?: Partial<MockSecurityService>;
}> = ({
  children,
  alarmService = {},
  analyticsService = {},
  battleService = {},
  subscriptionService = {},
  voiceService = {},
  notificationService = {},
  audioService = {},
  storageService = {},
  securityService = {},
}) => {
  const mockAlarmService = { ...createMockAlarmService(), ...alarmService };
  const mockAnalyticsService = {
    ...createMockAnalyticsService(),
    ...analyticsService,
  };
  const mockBattleService = { ...createMockBattleService(), ...battleService };
  const mockSubscriptionService = {
    ...createMockSubscriptionService(),
    ...subscriptionService,
  };
  const mockVoiceService = { ...createMockVoiceService(), ...voiceService };
  const mockNotificationService = {
    ...createMockNotificationService(),
    ...notificationService,
  };
  const mockAudioService = { ...createMockAudioService(), ...audioService };
  const mockStorageService = {
    ...createMockStorageService(),
    ...storageService,
  };
  const mockSecurityService = {
    ...createMockSecurityService(),
    ...securityService,
  };

  return (
    <AlarmServiceContext.Provider value={mockAlarmService}>
      <AnalyticsServiceContext.Provider value={mockAnalyticsService}>
        <BattleServiceContext.Provider value={mockBattleService}>
          <SubscriptionServiceContext.Provider value={mockSubscriptionService}>
            <VoiceServiceContext.Provider value={mockVoiceService}>
              <NotificationServiceContext.Provider value={mockNotificationService}>
                <AudioServiceContext.Provider value={mockAudioService}>
                  <StorageServiceContext.Provider value={mockStorageService}>
                    <SecurityServiceContext.Provider value={mockSecurityService}>
                      {children}
                    </SecurityServiceContext.Provider>
                  </StorageServiceContext.Provider>
                </AudioServiceContext.Provider>
              </NotificationServiceContext.Provider>
            </VoiceServiceContext.Provider>
          </SubscriptionServiceContext.Provider>
        </BattleServiceContext.Provider>
      </AnalyticsServiceContext.Provider>
    </AlarmServiceContext.Provider>
  );
};

// ===============================
// HOOK UTILITIES
// ===============================

export const _useAlarmServiceTest = () => useContext(AlarmServiceContext);
export const _useAnalyticsServiceTest = () => useContext(AnalyticsServiceContext);
export const _useBattleServiceTest = () => useContext(BattleServiceContext);
export const _useSubscriptionServiceTest = () => useContext(SubscriptionServiceContext);
export const _useVoiceServiceTest = () => useContext(VoiceServiceContext);
export const _useNotificationServiceTest = () => useContext(NotificationServiceContext);
export const _useAudioServiceTest = () => useContext(AudioServiceContext);
export const _useStorageServiceTest = () => useContext(StorageServiceContext);
export const _useSecurityServiceTest = () => useContext(SecurityServiceContext);

// ===============================
// SERVICE SCENARIOS
// ===============================

export const _serviceScenarios = {
  // Alarm Service Scenarios
  alarmServiceScenarios: {
    withAlarms: {
      getAlarms: jest.fn().mockResolvedValue([
        { id: 'alarm-1', time: '07:00', enabled: true },
        { id: 'alarm-2', time: '08:30', enabled: false },
      ]),
    },
    noAlarms: {
      getAlarms: jest.fn().mockResolvedValue([]),
    },
    createError: {
      createAlarm: jest.fn().mockRejectedValue(new Error('Failed to create alarm')),
    },
    syncError: {
      syncAlarms: jest.fn().mockRejectedValue(new Error('Sync failed')),
    },
  },

  // Analytics Service Scenarios
  analyticsServiceScenarios: {
    trackingEnabled: {
      track: jest.fn(),
      identify: jest.fn(),
    },
    trackingDisabled: {
      track: jest.fn(),
      identify: jest.fn(),
    },
  },

  // Battle Service Scenarios
  battleServiceScenarios: {
    activeBattles: {
      getBattles: jest
        .fn()
        .mockResolvedValue([{ id: 'battle-1', status: 'active', participants: 2 }]),
    },
    noBattles: {
      getBattles: jest.fn().mockResolvedValue([]),
    },
    joinError: {
      joinBattle: jest.fn().mockRejectedValue(new Error('Battle is full')),
    },
  },

  // Subscription Service Scenarios
  subscriptionServiceScenarios: {
    freeUser: {
      getSubscription: jest.fn().mockResolvedValue(null),
      checkAccess: jest.fn((feature: string) => feature === 'basic_alarms'),
      getFeatures: jest.fn().mockReturnValue(['basic_alarms']),
    },
    premiumUser: {
      getSubscription: jest.fn().mockResolvedValue({
        tier: 'premium',
        status: 'active',
      }),
      checkAccess: jest.fn(() => true),
      getFeatures: jest
        .fn()
        .mockReturnValue(['unlimited_alarms', 'custom_voices', 'themes']),
    },
    expiredSubscription: {
      getSubscription: jest.fn().mockResolvedValue({
        tier: 'premium',
        status: 'past_due',
      }),
      checkAccess: jest.fn((feature: string) => feature === 'basic_alarms'),
    },
  },

  // Audio Service Scenarios
  audioServiceScenarios: {
    soundsLoaded: {
      loadSound: jest.fn().mockResolvedValue({ loaded: true }),
      playSound: jest.fn().mockResolvedValue(undefined),
    },
    loadError: {
      loadSound: jest.fn().mockRejectedValue(new Error('Failed to load sound')),
    },
    playbackError: {
      playSound: jest.fn().mockRejectedValue(new Error('Playback failed')),
    },
  },

  // Storage Service Scenarios
  storageServiceScenarios: {
    dataExists: {
      get: jest.fn().mockResolvedValue({ data: 'test' }),
      has: jest.fn().mockResolvedValue(true),
    },
    noData: {
      get: jest.fn().mockResolvedValue(null),
      has: jest.fn().mockResolvedValue(false),
    },
    storageError: {
      set: jest.fn().mockRejectedValue(new Error('Storage quota exceeded')),
    },
  },
};

export default {
  ServiceTestProviders,
  useAlarmServiceTest,
  useAnalyticsServiceTest,
  useBattleServiceTest,
  useSubscriptionServiceTest,
  useVoiceServiceTest,
  useNotificationServiceTest,
  useAudioServiceTest,
  useStorageServiceTest,
  useSecurityServiceTest,
  serviceScenarios,
};
