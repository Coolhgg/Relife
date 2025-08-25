/**
 * Enhanced Mock Service Worker (MSW) handlers for comprehensive API testing
 * Provides realistic, scenario-based API mocking with advanced features
 */

import { http, HttpResponse, ws } from 'msw';
import type { DefaultBodyType, HttpResponseResolver, PathParams } from 'msw';

// Configuration and base URLs
const CLOUDFLARE_API_URL = 'https://relife-api.workers.dev';
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://test-supabase-url.supabase.co';
const STRIPE_URL = 'https://api.stripe.com';
const ELEVENLABS_URL = 'https://api.elevenlabs.io';
const ANALYTICS_URL = 'https://app.posthog.com';

// Mock data factories
export class MockDataFactory {
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: null,
      subscription_tier: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications_enabled: true,
        sound_enabled: true,
      },
      stats: {
        total_alarms: 5,
        successful_wakeups: 23,
        total_battles_won: 12,
        streak_count: 7,
        premium_features_used: 3,
      },
      ...overrides,
    };
  }

  static createAlarm(overrides: Partial<any> = {}) {
    return {
      id: 'test-alarm-123',
      user_id: 'test-user-123',
      time: '07:00:00',
      label: 'Morning Workout',
      is_active: true,
      days: [1, 2, 3, 4, 5], // Monday to Friday
      voice_mood: 'motivational',
      sound_file: 'energetic_beep.wav',
      difficulty: 'medium',
      snooze_enabled: true,
      snooze_interval: 5,
      max_snoozes: 3,
      battle_mode_enabled: false,
      smart_scheduling_enabled: false,
      location_based: false,
      weather_adaptive: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createBattle(overrides: Partial<any> = {}) {
    return {
      id: 'test-battle-123',
      creator_id: 'test-user-123',
      title: 'Early Bird Challenge',
      description: 'Who can wake up earliest this week?',
      type: 'weekly_challenge',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_participants: 10,
      current_participants: 3,
      prize_pool: 100,
      entry_fee: 10,
      status: 'active',
      rules: {
        wake_up_window: '05:00-08:00',
        verification_required: true,
        snooze_penalty: 5,
      },
      participants: [
        {
          user_id: 'test-user-123',
          joined_at: new Date().toISOString(),
          status: 'active',
          score: 85,
        },
      ],
      leaderboard: [
        {
          user_id: 'test-user-123',
          username: 'Test User',
          score: 85,
          rank: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createSubscription(overrides: Partial<any> = {}) {
    return {
      id: 'sub_test123',
      object: 'subscription',
      status: 'active',
      customer: 'cus_test123',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      plan: {
        id: 'plan_premium_monthly',
        object: 'plan',
        amount: 999,
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        nickname: 'Premium Monthly',
        product: 'prod_premium',
      },
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test123',
            object: 'subscription_item',
            plan: {
              id: 'plan_premium_monthly',
              amount: 999,
              currency: 'usd',
            },
            quantity: 1,
          },
        ],
      },
      ...overrides,
    };
  }

  static createAnalyticsEvent(overrides: Partial<any> = {}) {
    return {
      event: 'alarm_created',
      properties: {
        alarm_type: 'standard',
        difficulty: 'medium',
        time_of_day: 'morning',
        user_tier: 'free',
        device_type: 'mobile',
      },
      timestamp: new Date().toISOString(),
      distinct_id: 'test-user-123',
      ...overrides,
    };
  }

  static createPerformanceMetrics(overrides: Partial<any> = {}) {
    return {
      metrics: {
        page_load_time: 1250,
        first_contentful_paint: 800,
        largest_contentful_paint: 1100,
        first_input_delay: 45,
        cumulative_layout_shift: 0.08,
        time_to_interactive: 1300,
      },
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      url: 'https://app.relife.com/dashboard',
      timestamp: Date.now(),
      user_id: 'test-user-123',
      ...overrides,
    };
  }
}

// Request/Response interceptors for advanced scenarios
export class RequestInterceptor {
  static withDelay(
    delay: number
  ): HttpResponseResolver<PathParams, DefaultBodyType, any> {
    return async _info => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({ success: true, delayed: true });
    };
  }

  static withErrorRate(
    errorRate: number,
    errorStatus: number = 500
  ): HttpResponseResolver<PathParams, DefaultBodyType, any> {
    return _info => {
      if (Math.random() < errorRate) {
        return HttpResponse.json(
          { _error: 'Simulated _error', rate: errorRate },
          { status: errorStatus }
        );
      }
      return HttpResponse.json({ success: true });
    };
  }

  static withAuth(
    requireAuth: boolean = true
  ): HttpResponseResolver<PathParams, DefaultBodyType, any> {
    return info => {
      if (requireAuth) {
        const authHeader = info.request.headers.get('authorization');
        if (!authHeader || !authHeader.includes('Bearer')) {
          return HttpResponse.json(
            { _error: 'Authentication required' },
            { status: 401 }
          );
        }
      }
      return HttpResponse.json({ success: true, authenticated: true });
    };
  }

  static withRateLimit(
    requestsPerMinute: number
  ): HttpResponseResolver<PathParams, DefaultBodyType, any> {
    const requests = new Map<string, number[]>();

    return info => {
      const clientId = info.request.headers.get('x-client-id') || 'default';
      const now = Date.now();
      const minute = Math.floor(now / 60000);

      if (!requests.has(clientId)) {
        requests.set(clientId, []);
      }

      const clientRequests = requests.get(clientId)!;
      const recentRequests = clientRequests.filter(time => time >= minute);

      if (recentRequests.length >= requestsPerMinute) {
        return HttpResponse.json(
          {
            _error: 'Rate limit exceeded',
            retry_after: 60,
            limit: requestsPerMinute,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': requestsPerMinute.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (minute + 1).toString(),
            },
          }
        );
      }

      clientRequests.push(minute);
      requests.set(clientId, clientRequests);

      return HttpResponse.json({ success: true });
    };
  }
}

// Enhanced API handlers with comprehensive coverage
export const enhancedHandlers = [
  // ==================== CLOUDFLARE EDGE API ====================

  // Health check endpoint
  http.get(`${CLOUDFLARE_API_URL}/api/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        storage: 'connected',
        notifications: 'connected',
      },
      metrics: {
        response_time_ms: 45,
        active_connections: 1247,
        error_rate: 0.02,
      },
    });
  }),

  // User management endpoints
  http.get(`${CLOUDFLARE_API_URL}/api/users`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    const includeBattles = url.searchParams.get('includeBattles') === 'true';

    const user = MockDataFactory.createUser({ id: userId });

    if (includeBattles) {
      user.battles = [MockDataFactory.createBattle()];
    }

    return HttpResponse.json({
      success: true,
      data: [_user],
      meta: {
        total: 1,
        page: 1,
        per_page: 20,
      },
    });
  }),

  http.post(`${CLOUDFLARE_API_URL}/api/users`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newUser = MockDataFactory.createUser({
      email: body.email,
      name: body.name,
      id: `user_${Date.now()}`,
    });

    return HttpResponse.json(
      {
        success: true,
        data: newUser,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  }),

  // Alarm management endpoints
  http.get(`${CLOUDFLARE_API_URL}/api/alarms`, ({ request }) => {
    const url = new URL(request.url);
    const _userId = url.searchParams.get('_userId');
    const enabled = url.searchParams.get('enabled');
    const withBattles = url.searchParams.get('withBattles') === 'true';

    let alarms = [
      MockDataFactory.createAlarm(),
      MockDataFactory.createAlarm({
        id: 'alarm-456',
        label: 'Evening Meditation',
        time: '20:00:00',
        voice_mood: 'calm',
      }),
    ];

    if (enabled !== null) {
      alarms = alarms.filter(alarm => alarm.is_active === (enabled === 'true'));
    }

    if (withBattles) {
      alarms = alarms.map(alarm => ({
        ...alarm,
        battle: MockDataFactory.createBattle(),
      }));
    }

    return HttpResponse.json({
      success: true,
      data: alarms,
      meta: {
        total: alarms.length,
        active: alarms.filter(a => a.is_active).length,
        upcoming: 2,
      },
    });
  }),

  http.post(`${CLOUDFLARE_API_URL}/api/alarms`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newAlarm = MockDataFactory.createAlarm({
      ...body,
      id: `alarm_${Date.now()}`,
    });

    return HttpResponse.json(
      {
        success: true,
        data: newAlarm,
        message: 'Alarm created successfully',
      },
      { status: 201 }
    );
  }),

  http.put(`${CLOUDFLARE_API_URL}/api/alarms/:id`, async ({ request, params }) => {
    const body = (await request.json()) as any;
    const updatedAlarm = MockDataFactory.createAlarm({
      ...body,
      id: params.id,
      updated_at: new Date().toISOString(),
    });

    return HttpResponse.json({
      success: true,
      data: updatedAlarm,
      message: 'Alarm updated successfully',
    });
  }),

  http.delete(`${CLOUDFLARE_API_URL}/api/alarms/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Alarm ${params.id} deleted successfully`,
    });
  }),

  // Battle system endpoints
  http.get(`${CLOUDFLARE_API_URL}/api/battles`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const _userId = url.searchParams.get('_userId');

    let battles = [
      MockDataFactory.createBattle(),
      MockDataFactory.createBattle({
        id: 'battle-456',
        title: 'Weekend Warriors',
        type: 'elimination',
        status: 'pending',
      }),
    ];

    if (status) {
      battles = battles.filter(battle => battle.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: battles,
      meta: {
        total: battles.length,
        active: battles.filter(b => b.status === 'active').length,
        pending: battles.filter(b => b.status === 'pending').length,
      },
    });
  }),

  http.post(`${CLOUDFLARE_API_URL}/api/battles`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newBattle = MockDataFactory.createBattle({
      ...body,
      id: `battle_${Date.now()}`,
      creator_id: body.creator_id || 'test-user-123',
    });

    return HttpResponse.json(
      {
        success: true,
        data: newBattle,
        message: 'Battle created successfully',
      },
      { status: 201 }
    );
  }),

  http.post(
    `${CLOUDFLARE_API_URL}/api/battles/:id/join`,
    async ({ params, request }) => {
      const body = (await request.json()) as any;

      return HttpResponse.json({
        success: true,
        data: {
          battle_id: params.id,
          participant_id: body.user_id,
          joined_at: new Date().toISOString(),
          status: 'active',
        },
        message: 'Successfully joined battle',
      });
    }
  ),

  http.post(
    `${CLOUDFLARE_API_URL}/api/battles/:id/wake`,
    async ({ params, request }) => {
      const body = (await request.json()) as any;

      return HttpResponse.json({
        success: true,
        data: {
          battle_id: params.id,
          user_id: body.user_id,
          wake_time: body.wake_time,
          proof_type: body.proof_type,
          points_earned: 15,
          new_score: 100,
          rank: 1,
        },
        message: 'Wake proof submitted successfully',
      });
    }
  ),

  // Tournament endpoints
  http.get(`${CLOUDFLARE_API_URL}/api/tournaments`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'tournament-123',
          name: 'Monthly Champions',
          description: 'Battle for the monthly championship',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          prize_pool: 1000,
          participants_count: 64,
          status: 'registration_open',
          entry_fee: 25,
          brackets: [],
        },
      ],
    });
  }),

  // Performance monitoring endpoints
  http.post(`${CLOUDFLARE_API_URL}/api/performance/metrics`, async ({ request }) => {
    const _body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      data: {
        metric_id: `metric_${Date.now()}`,
        processed_at: new Date().toISOString(),
        status: 'stored',
      },
    });
  }),

  http.post(`${CLOUDFLARE_API_URL}/api/performance/web-vitals`, async ({ request }) => {
    const _body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      data: {
        vitals_id: `vitals_${Date.now()}`,
        processed_at: new Date().toISOString(),
        scores: {
          performance: 85,
          accessibility: 92,
          best_practices: 88,
          seo: 95,
        },
      },
    });
  }),

  http.get(`${CLOUDFLARE_API_URL}/api/performance/dashboard`, ({ request }) => {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('range') || '7d';

    return HttpResponse.json({
      success: true,
      data: {
        overview: {
          avg_response_time: 245,
          error_rate: 0.015,
          uptime_percentage: 99.9,
          active_users: 2847,
        },
        web_vitals: {
          fcp: { p75: 850, trend: 'improving' },
          lcp: { p75: 1200, trend: 'stable' },
          fid: { p75: 45, trend: 'improving' },
          cls: { p75: 0.08, trend: 'stable' },
        },
        time_range: timeRange,
      },
    });
  }),

  // ==================== SUPABASE INTEGRATION ====================

  // Enhanced Supabase auth handlers
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = (await request.json()) as any;

    // Simulate different authentication scenarios
    if (body.email === 'blocked@example.com') {
      return HttpResponse.json(
        { _error: 'Account is temporarily blocked' },
        { status: 423 }
      );
    }

    if (body.email === 'unverified@example.com') {
      return HttpResponse.json({ _error: 'Email not verified' }, { status: 403 });
    }

    return HttpResponse.json({
      access_token: 'mock_access_token_' + Date.now(),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock_refresh_token_' + Date.now(),
      user: MockDataFactory.createUser({
        email: body.email,
        email_confirmed_at: new Date().toISOString(),
      }),
    });
  }),

  // Enhanced database operations with advanced filtering
  http.get(`${SUPABASE_URL}/rest/v1/users`, ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select');
    const filters = Object.fromEntries(url.searchParams.entries());

    let users = [MockDataFactory.createUser()];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'select') {
        users = users.filter(_user => _user[key] === value);
      }
    });

    // Apply select
    if (select) {
      const fields = select.split(',');
      users = users.map(user => {
        const selectedUser: any = {};
        fields.forEach(field => {
          if (_user[field] !== undefined) {
            selectedUser[field] = user[field];
          }
        });
        return selectedUser;
      });
    }

    return HttpResponse.json(users);
  }),

  // Real-time subscription simulation
  http.post(`${SUPABASE_URL}/realtime/v1/websocket`, () => {
    return HttpResponse.json({
      success: true,
      websocket_url: 'wss://test-realtime.supabase.co/socket',
      access_token: 'realtime_token_123',
    });
  }),

  // ==================== STRIPE INTEGRATION ====================

  // Enhanced Stripe handlers with more realistic responses
  http.get(`${STRIPE_URL}/v1/customers/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      object: 'customer',
      email: 'test@example.com',
      name: 'Test User',
      created: Math.floor(Date.now() / 1000),
      default_source: 'card_123',
      subscriptions: {
        object: 'list',
        data: [MockDataFactory.createSubscription()],
      },
    });
  }),

  http.post(`${STRIPE_URL}/v1/payment_intents`, async ({ request }) => {
    const body = await request.formData();
    const amount = body.get('amount');

    return HttpResponse.json({
      id: `pi_${Date.now()}`,
      object: 'payment_intent',
      amount: parseInt(amount as string),
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_${Date.now()}_secret_123`,
      created: Math.floor(Date.now() / 1000),
    });
  }),

  http.post(`${STRIPE_URL}/v1/payment_intents/:id/confirm`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      object: 'payment_intent',
      status: 'succeeded',
      amount_received: 999,
      charges: {
        object: 'list',
        data: [
          {
            id: `ch_${Date.now()}`,
            amount: 999,
            status: 'succeeded',
            receipt_url: 'https://pay.stripe.com/receipts/test',
          },
        ],
      },
    });
  }),

  // Webhook endpoint simulation
  http.post(`${CLOUDFLARE_API_URL}/api/stripe/webhooks`, async ({ request }) => {
    const _body = await request.text();
    const _signature = request.headers.get('stripe-_signature');

    return HttpResponse.json({
      received: true,
      processed: true,
      timestamp: new Date().toISOString(),
    });
  }),

  // ==================== ELEVENLABS VOICE API ====================

  http.get(`${ELEVENLABS_URL}/v1/voices`, RequestInterceptor.withAuth(), () => {
    return HttpResponse.json({
      voices: [
        {
          voice_id: 'voice_123',
          name: 'Rachel',
          category: 'premade',
          labels: { accent: 'american', description: 'calm', age: 'young' },
          preview_url: 'https://example.com/preview.mp3',
        },
        {
          voice_id: 'voice_456',
          name: 'Josh',
          category: 'premade',
          labels: { accent: 'american', description: 'energetic', age: 'middle aged' },
          preview_url: 'https://example.com/preview2.mp3',
        },
      ],
    });
  }),

  http.post(
    `${ELEVENLABS_URL}/v1/text-to-speech/:voice_id`,
    async ({ _params, request }) => {
      const _body = (await request.json()) as any;

      // Simulate audio generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return mock audio data
      const audioBuffer = new ArrayBuffer(1024 * 50); // 50KB mock audio
      return HttpResponse.arrayBuffer(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': (1024 * 50).toString(),
        },
      });
    }
  ),

  // ==================== ANALYTICS ENDPOINTS ====================

  http.post(`${ANALYTICS_URL}/capture/`, async ({ request }) => {
    const _body = (await request.json()) as any;

    return HttpResponse.json({
      status: 1,
      timestamp: new Date().toISOString(),
      event_id: `evt_${Date.now()}`,
    });
  }),

  http.post(`${ANALYTICS_URL}/batch/`, async ({ request }) => {
    const body = (await request.json()) as any;
    const events = body.batch || [];

    return HttpResponse.json({
      status: 1,
      processed: events.length,
      timestamp: new Date().toISOString(),
    });
  }),

  // Feature flag endpoints
  http.post(`${ANALYTICS_URL}/decide/`, async ({ request }) => {
    const _body = (await request.json()) as any;

    return HttpResponse.json({
      featureFlags: {
        'new-battle-system': true,
        'ai-voice-cloning': false,
        'premium-themes': true,
        'social-challenges': true,
      },
      featureFlagPayloads: {},
    });
  }),

  // ==================== ERROR SIMULATION ====================

  // Rate limiting test endpoint
  http.get('/api/test/rate-limit', RequestInterceptor.withRateLimit(5)),

  // Authentication test endpoint
  http.get('/api/test/auth', RequestInterceptor.withAuth()),

  // Error rate test endpoint
  http.get('/api/test/_error-rate', RequestInterceptor.withErrorRate(0.2, 500)),

  // Delay test endpoint
  http.get('/api/test/delay', RequestInterceptor.withDelay(2000)),
];

// WebSocket handlers for real-time features
export const wsHandlers = [
  // Battle real-time updates
  ws.link('wss://*/battles/:battleId', ({ params }) => {
    return new WebSocket(`wss://mock-battle-server/${params.battleId}`);
  }),

  // General real-time updates
  ws.link('wss://*/realtime', () => {
    return new WebSocket('wss://mock-realtime-server');
  }),
];

// Export all handlers combined
export const allHandlers = [...enhancedHandlers, ...wsHandlers];

// Scenario-specific handler sets
export const scenarioHandlers = {
  // Success scenario - all requests succeed
  success: enhancedHandlers,

  // Error scenario - simulate various error conditions
  _error: [
    ...enhancedHandlers.map(handler => {
      // Override some handlers to return errors
      if (handler.info.path.includes('/api/')) {
        return http.all(handler.info.path, RequestInterceptor.withErrorRate(0.3, 500));
      }
      return handler;
    }),
  ],

  // Slow network scenario
  slow: [
    ...enhancedHandlers.map(handler => {
      if (handler.info.path.includes('/api/')) {
        return http.all(handler.info.path, RequestInterceptor.withDelay(3000));
      }
      return handler;
    }),
  ],

  // Offline scenario - most requests fail
  offline: [
    http.all('*', () => {
      return HttpResponse._error();
    }),
  ],
};

export default allHandlers;
