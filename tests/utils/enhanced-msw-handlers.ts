/**
 * Enhanced MSW Handlers for Critical User Flow Integration Tests
 *
 * Specialized handlers for testing alarm lifecycle, premium features,
 * voice commands, analytics, and app initialization flows.
 */

import { http, HttpResponse } from 'msw';
import type {
  User,
  Alarm,
  SubscriptionTier,
  AnalyticsEvent,
  VoiceCommand,
} from '../../src/types';

// Base URLs
const SUPABASE_URL = 'https://test-supabase-url.supabase.co';
const STRIPE_URL = 'https://api.stripe.com';
const POSTHOG_URL = 'https://app.posthog.com';
const VOICE_API_URL = 'https://voice-api.test.com';

// Test data stores
const testUsers: Map<string, User> = new Map();
const testAlarms: Map<string, Alarm> = new Map();
const testSubscriptions: Map<string, any> = new Map();
let testAnalyticsEvents: AnalyticsEvent[] = [];

// Helper to generate realistic test data
const generateUserId = () =>
  `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateAlarmId = () =>
  `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateSubscriptionId = () =>
  `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// Enhanced Authentication Handlers
// ============================================================================

export const authHandlers = [
  // Sign up with realistic flow
  http.post(`${SUPABASE_URL}/auth/v1/signup`, async ({ request }) => {
    const body = (await request.json()) as any;
    const userId = generateUserId();

    const user: User = {
      id: userId,
      email: body.email,
      name: body.name || body.email.split('@')[0],
      createdAt: new Date(),
      level: 1,
      experience: 0,
      subscriptionTier: 'free',
      premiumFeatures: [],
      subscriptionId: null,
      subscriptionStatus: null,
      trialEndsAt: null,
      achievements: [],
      friends: [],
      detectedPersona: 'struggling_sam',
    };

    testUsers.set(userId, user);

    return HttpResponse.json({
      user,
      session: {
        access_token: `access_token_${userId}`,
        refresh_token: `refresh_token_${userId}`,
        expires_in: 3600,
      },
    });
  }),

  // Enhanced login with subscription state
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = (await request.json()) as any;
    const email = body.email || 'test@example.com';

    // Find or create user
    let user = Array.from(testUsers.values()).find(u => u.email === email);
    if (!user) {
      const userId = generateUserId();
      user = {
        id: userId,
        email,
        name: email.split('@')[0],
        createdAt: new Date(),
        level: 1,
        experience: 0,
        subscriptionTier: 'free',
        premiumFeatures: [],
        subscriptionId: null,
        subscriptionStatus: null,
        trialEndsAt: null,
        achievements: [],
        friends: [],
        detectedPersona: 'struggling_sam',
      };
      testUsers.set(userId, user);
    }

    return HttpResponse.json({
      access_token: `access_token_${user.id}`,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: `refresh_token_${user.id}`,
      user,
    });
  }),

  // Session refresh
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');

    if (grantType === 'refresh_token') {
      return HttpResponse.json({
        access_token: `new_access_token_${Date.now()}`,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `new_refresh_token_${Date.now()}`,
      });
    }

    return HttpResponse.json({ error: 'Invalid grant type' }, { status: 400 });
  }),
];

// ============================================================================
// Enhanced Alarm Management Handlers
// ============================================================================

export const alarmHandlers = [
  // Get user alarms with filtering and sorting
  http.get(`${SUPABASE_URL}/rest/v1/alarms`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const isActive = url.searchParams.get('is_active');

    let alarms = Array.from(testAlarms.values());

    if (userId) {
      alarms = alarms.filter(alarm => alarm.userId === userId);
    }

    if (isActive !== null) {
      alarms = alarms.filter(alarm => alarm.isActive === (isActive === 'true'));
    }

    // Sort by creation date (newest first)
    alarms.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return HttpResponse.json(alarms);
  }),

  // Create alarm with validation
  http.post(`${SUPABASE_URL}/rest/v1/alarms`, async ({ request }) => {
    const alarmData = (await request.json()) as Partial<Alarm>;
    const alarmId = generateAlarmId();

    // Simulate validation
    if (!alarmData.time || !alarmData.userId) {
      return HttpResponse.json(
        { error: 'Time and userId are required' },
        { status: 400 }
      );
    }

    // Check alarm limits for free users
    const user = testUsers.get(alarmData.userId!);
    if (user?.subscriptionTier === 'free') {
      const userAlarms = Array.from(testAlarms.values()).filter(
        alarm => alarm.userId === alarmData.userId
      );

      if (userAlarms.length >= 5) {
        return HttpResponse.json(
          {
            error:
              'Free users can only have 5 alarms. Upgrade to premium for unlimited alarms.',
          },
          { status: 403 }
        );
      }
    }

    const alarm: Alarm = {
      id: alarmId,
      userId: alarmData.userId!,
      time: alarmData.time!,
      label: alarmData.label || 'New Alarm',
      enabled: alarmData.enabled ?? true,
      isActive: false,
      days: alarmData.days || [1, 2, 3, 4, 5],
      dayNames: alarmData.dayNames || [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
      ],
      sound: alarmData.sound || 'default',
      volume: alarmData.volume || 0.8,
      vibrate: alarmData.vibrate ?? true,
      voiceMood: alarmData.voiceMood || 'motivational',
      difficulty: alarmData.difficulty || 'medium',
      snoozeEnabled: alarmData.snoozeEnabled ?? true,
      snoozeInterval: alarmData.snoozeInterval || 5,
      maxSnoozes: alarmData.maxSnoozes || 3,
      snoozeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastTriggered: undefined,
      completed: false,
      metadata: alarmData.metadata || {},
      // Premium features
      nuclearMode: alarmData.nuclearMode || false,
      smartWakeupEnabled: alarmData.smartWakeupEnabled || false,
      locationBased: alarmData.locationBased || false,
      nuclearChallenges: alarmData.nuclearChallenges || [],
    };

    testAlarms.set(alarmId, alarm);

    return HttpResponse.json(alarm, { status: 201 });
  }),

  // Update alarm
  http.patch(`${SUPABASE_URL}/rest/v1/alarms`, async ({ request }) => {
    const url = new URL(request.url);
    const alarmId = url.searchParams.get('id');
    const updates = (await request.json()) as Partial<Alarm>;

    if (!alarmId) {
      return HttpResponse.json({ error: 'Alarm ID is required' }, { status: 400 });
    }

    const alarm = testAlarms.get(alarmId);
    if (!alarm) {
      return HttpResponse.json({ error: 'Alarm not found' }, { status: 404 });
    }

    const updatedAlarm = {
      ...alarm,
      ...updates,
      updatedAt: new Date(),
    };

    testAlarms.set(alarmId, updatedAlarm);

    return HttpResponse.json(updatedAlarm);
  }),

  // Delete alarm
  http.delete(`${SUPABASE_URL}/rest/v1/alarms`, ({ request }) => {
    const url = new URL(request.url);
    const alarmId = url.searchParams.get('id');

    if (!alarmId) {
      return HttpResponse.json({ error: 'Alarm ID is required' }, { status: 400 });
    }

    const deleted = testAlarms.delete(alarmId);

    if (!deleted) {
      return HttpResponse.json({ error: 'Alarm not found' }, { status: 404 });
    }

    return HttpResponse.json({}, { status: 204 });
  }),

  // Alarm trigger simulation
  http.post(
    `${SUPABASE_URL}/rest/v1/alarms/:id/trigger`,
    async ({ params, request }) => {
      const alarmId = params.id as string;
      const alarm = testAlarms.get(alarmId);

      if (!alarm) {
        return HttpResponse.json({ error: 'Alarm not found' }, { status: 404 });
      }

      const triggeredAlarm = {
        ...alarm,
        isActive: true,
        lastTriggered: new Date(),
        updatedAt: new Date(),
      };

      testAlarms.set(alarmId, triggeredAlarm);

      return HttpResponse.json({
        success: true,
        alarm: triggeredAlarm,
        triggeredAt: new Date().toISOString(),
      });
    }
  ),

  // Snooze alarm
  http.post(`${SUPABASE_URL}/rest/v1/alarms/:id/snooze`, async ({ params }) => {
    const alarmId = params.id as string;
    const alarm = testAlarms.get(alarmId);

    if (!alarm) {
      return HttpResponse.json({ error: 'Alarm not found' }, { status: 404 });
    }

    if (alarm.snoozeCount >= alarm.maxSnoozes) {
      return HttpResponse.json(
        { error: 'Maximum snooze limit reached' },
        { status: 400 }
      );
    }

    const snoozedAlarm = {
      ...alarm,
      snoozeCount: alarm.snoozeCount + 1,
      isActive: false,
      updatedAt: new Date(),
    };

    testAlarms.set(alarmId, snoozedAlarm);

    const snoozeUntil = new Date(Date.now() + alarm.snoozeInterval * 60 * 1000);

    return HttpResponse.json({
      success: true,
      snoozeUntil,
      snoozeCount: snoozedAlarm.snoozeCount,
      maxSnoozes: alarm.maxSnoozes,
    });
  }),

  // Dismiss alarm
  http.post(
    `${SUPABASE_URL}/rest/v1/alarms/:id/dismiss`,
    async ({ params, request }) => {
      const alarmId = params.id as string;
      const body = (await request.json()) as any;
      const dismissMethod = body.method || 'button'; // button, voice, challenge

      const alarm = testAlarms.get(alarmId);

      if (!alarm) {
        return HttpResponse.json({ error: 'Alarm not found' }, { status: 404 });
      }

      const dismissedAlarm = {
        ...alarm,
        isActive: false,
        completed: true,
        snoozeCount: 0,
        updatedAt: new Date(),
      };

      testAlarms.set(alarmId, dismissedAlarm);

      return HttpResponse.json({
        success: true,
        dismissedAt: new Date(),
        method: dismissMethod,
        alarm: dismissedAlarm,
      });
    }
  ),
];

// ============================================================================
// Premium/Subscription Handlers
// ============================================================================

export const premiumHandlers = [
  // Get user subscription
  http.get(`${STRIPE_URL}/v1/subscriptions`, ({ request }) => {
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customer');

    const subscriptions = Array.from(testSubscriptions.values()).filter(
      sub => !customerId || sub.customer === customerId
    );

    return HttpResponse.json({
      object: 'list',
      data: subscriptions,
    });
  }),

  // Create subscription
  http.post(`${STRIPE_URL}/v1/subscriptions`, async ({ request }) => {
    const body = (await request.json()) as any;
    const subscriptionId = generateSubscriptionId();

    const subscription = {
      id: subscriptionId,
      object: 'subscription',
      status: 'active',
      customer: body.customer,
      items: {
        data: [
          {
            price: {
              id: body.items?.[0]?.price || 'price_premium_monthly',
              nickname: 'Premium Monthly',
              unit_amount: 999,
              currency: 'usd',
              recurring: { interval: 'month' },
            },
          },
        ],
      },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      created: Math.floor(Date.now() / 1000),
      trial_end: body.trial_period_days
        ? Math.floor(Date.now() / 1000) + body.trial_period_days * 24 * 60 * 60
        : null,
    };

    testSubscriptions.set(subscriptionId, subscription);

    // Update user subscription status
    if (body.metadata?.userId) {
      const user = testUsers.get(body.metadata.userId);
      if (user) {
        user.subscriptionId = subscriptionId;
        user.subscriptionTier = subscription.trial_end ? 'trial' : 'premium';
        user.subscriptionStatus = 'active';
        user.premiumFeatures = [
          'nuclear_mode',
          'custom_sounds',
          'unlimited_alarms',
          'smart_wakeup',
        ];
        if (subscription.trial_end) {
          user.trialEndsAt = new Date(subscription.trial_end * 1000);
        }
        testUsers.set(user.id, user);
      }
    }

    return HttpResponse.json(subscription, { status: 201 });
  }),

  // Cancel subscription
  http.delete(`${STRIPE_URL}/v1/subscriptions/:id`, async ({ params }) => {
    const subscriptionId = params.id as string;
    const subscription = testSubscriptions.get(subscriptionId);

    if (!subscription) {
      return HttpResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const canceledSubscription = {
      ...subscription,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      cancel_at_period_end: false,
    };

    testSubscriptions.set(subscriptionId, canceledSubscription);

    return HttpResponse.json(canceledSubscription);
  }),

  // Feature access validation
  http.get(`${SUPABASE_URL}/rest/v1/feature-access/:userId`, ({ params }) => {
    const userId = params.userId as string;
    const user = testUsers.get(userId);

    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasActivePremium =
      user.subscriptionTier === 'premium' || user.subscriptionTier === 'trial';

    return HttpResponse.json({
      userId,
      subscriptionTier: user.subscriptionTier,
      premiumFeatures: user.premiumFeatures,
      limits: {
        maxAlarms: hasActivePremium ? -1 : 5, // -1 = unlimited
        canUseNuclearMode: hasActivePremium,
        canUploadCustomSounds: hasActivePremium,
        canUseSmartWakeup: hasActivePremium,
        canUseVoiceCloning: hasActivePremium,
      },
      usage: {
        currentAlarms: Array.from(testAlarms.values()).filter(a => a.userId === userId)
          .length,
      },
    });
  }),
];

// ============================================================================
// Analytics Handlers
// ============================================================================

export const analyticsHandlers = [
  // PostHog capture event
  http.post(`${POSTHOG_URL}/capture/`, async ({ request }) => {
    const events = (await request.json()) as any;

    // Handle both single events and batch events
    const eventList = Array.isArray(events) ? events : [events];

    eventList.forEach((event: any) => {
      const analyticsEvent: AnalyticsEvent = {
        event: event.event,
        properties: event.properties || {},
        timestamp: new Date(),
      };
      testAnalyticsEvents.push(analyticsEvent);
    });

    return HttpResponse.json({ status: 1 });
  }),

  // PostHog identify user
  http.post(`${POSTHOG_URL}/identify/`, async ({ request }) => {
    const data = (await request.json()) as any;

    const identifyEvent: AnalyticsEvent = {
      event: '$identify',
      properties: {
        distinct_id: data.distinct_id,
        ...data.properties,
      },
      timestamp: new Date(),
    };
    testAnalyticsEvents.push(identifyEvent);

    return HttpResponse.json({ status: 1 });
  }),

  // PostHog batch events
  http.post(`${POSTHOG_URL}/batch/`, async ({ request }) => {
    const batch = (await request.json()) as any;

    batch.batch?.forEach((event: any) => {
      const analyticsEvent: AnalyticsEvent = {
        event: event.event,
        properties: event.properties || {},
        timestamp: new Date(),
      };
      testAnalyticsEvents.push(analyticsEvent);
    });

    return HttpResponse.json({ status: 1 });
  }),

  // Get analytics events (for testing verification)
  http.get('/test/analytics-events', () => {
    return HttpResponse.json(testAnalyticsEvents);
  }),

  // Clear analytics events (for test cleanup)
  http.delete('/test/analytics-events', () => {
    testAnalyticsEvents = [];
    return HttpResponse.json({ cleared: true });
  }),
];

// ============================================================================
// Voice Command Handlers
// ============================================================================

export const voiceHandlers = [
  // Voice recognition service
  http.post(`${VOICE_API_URL}/recognize`, async ({ request }) => {
    const body = (await request.json()) as any;
    const audioData = body.audio;
    const language = body.language || 'en-US';

    // Simulate voice recognition processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock recognition results based on test scenarios
    const mockResults = [
      { transcript: 'stop alarm', confidence: 0.95 },
      { transcript: 'dismiss', confidence: 0.92 },
      { transcript: 'snooze', confidence: 0.88 },
      { transcript: 'turn off', confidence: 0.85 },
      { transcript: 'create alarm', confidence: 0.9 },
      { transcript: 'open settings', confidence: 0.87 },
    ];

    // Return random result for testing
    const result = mockResults[Math.floor(Math.random() * mockResults.length)];

    return HttpResponse.json({
      success: true,
      results: [result],
      language,
      processingTime: 100,
    });
  }),

  // Text-to-speech service
  http.post(`${VOICE_API_URL}/synthesize`, async ({ request }) => {
    const body = (await request.json()) as any;
    const text = body.text;
    const voiceMood = body.voiceMood || 'motivational';

    // Simulate TTS processing
    await new Promise(resolve => setTimeout(resolve, 200));

    return HttpResponse.json({
      success: true,
      audioUrl: `data:audio/mp3;base64,mock_audio_data_${Date.now()}`,
      voiceMood,
      text,
      duration: text.length * 50, // Mock duration based on text length
    });
  }),

  // Voice command validation
  http.post('/api/voice/validate-command', async ({ request }) => {
    const body = (await request.json()) as any;
    const command = body.command?.toLowerCase();

    const validCommands = [
      'stop',
      'stop alarm',
      'dismiss',
      'dismiss alarm',
      'turn off',
      'snooze',
      'snooze alarm',
      'sleep',
      'five more minutes',
      'create alarm',
      'new alarm',
      'add alarm',
      'settings',
      'open settings',
      'profile',
    ];

    const isValid = validCommands.some(
      valid => command.includes(valid) || valid.includes(command)
    );

    let action = 'unknown';
    if (
      command.includes('stop') ||
      command.includes('dismiss') ||
      command.includes('turn off')
    ) {
      action = 'dismiss_alarm';
    } else if (command.includes('snooze') || command.includes('sleep')) {
      action = 'snooze_alarm';
    } else if (
      command.includes('create') ||
      command.includes('new') ||
      command.includes('add')
    ) {
      action = 'create_alarm';
    } else if (command.includes('settings')) {
      action = 'open_settings';
    }

    return HttpResponse.json({
      isValid,
      action,
      confidence: isValid ? 0.85 + Math.random() * 0.15 : 0.1 + Math.random() * 0.3,
      originalCommand: command,
    });
  }),
];

// ============================================================================
// App Initialization Handlers
// ============================================================================

export const appInitHandlers = [
  // App health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-test',
    });
  }),

  // Service worker registration
  http.get('/sw.js', () => {
    const swCode = `
      self.addEventListener('install', () => {
        console.log('Test service worker installed');
      });
      
      self.addEventListener('activate', () => {
        console.log('Test service worker activated');
      });
    `;

    return HttpResponse.text(swCode, {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }),

  // App manifest
  http.get('/manifest.json', () => {
    return HttpResponse.json({
      name: 'Relife Alarm',
      short_name: 'Relife',
      start_url: '/',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    });
  }),

  // Feature flags
  http.get('/api/feature-flags', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    return HttpResponse.json({
      features: {
        nuclear_mode_enabled: true,
        voice_commands_enabled: true,
        smart_wakeup_enabled: true,
        analytics_enabled: true,
        premium_features_enabled: true,
        battle_system_enabled: true,
      },
      userId,
    });
  }),
];

// ============================================================================
// Test Utilities for MSW
// ============================================================================

export const testDataHelpers = {
  // Clear all test data
  clearAll: () => {
    testUsers.clear();
    testAlarms.clear();
    testSubscriptions.clear();
    testAnalyticsEvents = [];
  },

  // Add test user
  addUser: (user: User) => {
    testUsers.set(user.id, user);
  },

  // Add test alarm
  addAlarm: (alarm: Alarm) => {
    testAlarms.set(alarm.id, alarm);
  },

  // Get analytics events
  getAnalyticsEvents: () => [...testAnalyticsEvents],

  // Get user by email
  getUserByEmail: (email: string) => {
    return Array.from(testUsers.values()).find(u => u.email === email);
  },

  // Get alarms for user
  getAlarmsForUser: (userId: string) => {
    return Array.from(testAlarms.values()).filter(a => a.userId === userId);
  },
};

// ============================================================================
// Combined Handlers Export
// ============================================================================

export const enhancedHandlers = [
  ...authHandlers,
  ...alarmHandlers,
  ...premiumHandlers,
  ...analyticsHandlers,
  ...voiceHandlers,
  ...appInitHandlers,
];

export default enhancedHandlers;
