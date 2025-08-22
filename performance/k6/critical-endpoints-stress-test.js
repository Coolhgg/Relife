/**
 * k6 Critical Endpoints Stress Test for Relife Alarm App
 *
 * Focuses on testing critical system endpoints under extreme load
 * to identify breaking points and performance bottlenecks.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import {
  randomIntBetween,
  randomString,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Test data for stress scenarios
const _stressScenarios = new SharedArray('stress_scenarios', function () {
  return [
    { endpoint: '/auth/login', weight: 20, critical: true },
    { endpoint: '/alarms', method: 'GET', weight: 30, critical: true },
    { endpoint: '/alarms', method: 'POST', weight: 25, critical: true },
    { endpoint: '/alarms/*/trigger', weight: 15, critical: true },
    { endpoint: '/users/*/premium', weight: 10, critical: false },
    { endpoint: '/analytics/events', method: 'POST', weight: 35, critical: false },
    { endpoint: '/voice/commands', method: 'POST', weight: 5, critical: false },
  ];
});

export const options = {
  scenarios: {
    // Scenario 1: Breaking Point Test
    breaking_point: {
      executor: 'ramping-arrival-rate',
      stages: [
        { duration: '1m', target: 50 }, // 50 requests/sec
        { duration: '2m', target: 200 }, // 200 requests/sec
        { duration: '2m', target: 500 }, // 500 requests/sec
        { duration: '2m', target: 800 }, // 800 requests/sec (breaking point)
        { duration: '1m', target: 1000 }, // 1000 requests/sec (stress)
        { duration: '2m', target: 0 }, // Recovery
      ],
      preAllocatedVUs: 100,
      maxVUs: 1000,
      exec: 'criticalEndpointsTest',
      tags: { test_type: 'breaking_point' },
    },

    // Scenario 2: Spike Test (sudden traffic burst)
    spike_test: {
      executor: 'ramping-vus',
      startTime: '11m',
      stages: [
        { duration: '30s', target: 100 }, // Normal load
        { duration: '1m', target: 2000 }, // Massive spike
        { duration: '30s', target: 100 }, // Back to normal
        { duration: '1m', target: 0 }, // Cool down
      ],
      exec: 'criticalEndpointsTest',
      tags: { test_type: 'spike' },
    },

    // Scenario 3: Critical Path Stress
    critical_path: {
      executor: 'constant-arrival-rate',
      startTime: '15m',
      rate: 300, // 300 requests/second
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 500,
      exec: 'criticalPathTest',
      tags: { test_type: 'critical_path' },
    },
  },

  // Aggressive thresholds for stress testing
  thresholds: {
    // Breaking point detection
    http_req_duration: ['p(50)<200', 'p(95)<1000'], // Median < 200ms, 95% < 1s
    http_req_failed: ['rate<0.05'], // Allow up to 5% errors under stress

    // Critical endpoint specific thresholds
    'http_req_duration{endpoint:auth}': ['p(95)<500'],
    'http_req_duration{endpoint:alarms_get}': ['p(95)<300'],
    'http_req_duration{endpoint:alarms_create}': ['p(95)<600'],
    'http_req_duration{endpoint:alarm_trigger}': ['p(95)<150'],

    // Stress test specific thresholds
    'http_req_failed{test_type:breaking_point}': ['rate<0.10'], // 10% errors allowed
    'http_req_failed{test_type:spike}': ['rate<0.15'], // 15% errors during spikes
    'http_req_failed{test_type:critical_path}': ['rate<0.02'], // 2% errors on critical path

    // System stability indicators
    'http_req_duration{test_type:breaking_point}': ['p(99)<2000'], // 99% < 2s even under breaking load
    'http_req_duration{test_type:spike}': ['p(90)<1500'], // 90% < 1.5s during spikes
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3001/api';
const STRESS_LEVEL = __ENV.STRESS_LEVEL || 'high'; // low, medium, high, extreme

/**
 * Generate realistic authentication data
 */
function generateAuthData() {
  return {
    email: `stress_user_${randomString(8)}@test.com`,
    password: 'StressTest123!',
    deviceId: randomString(16),
  };
}

/**
 * Generate realistic alarm data
 */
function generateAlarmData(userId) {
  const hours = randomIntBetween(5, 23);
  const minutes = randomIntBetween(0, 59);

  return {
    time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    label: `Stress Test Alarm ${randomIntBetween(1, 1000)}`,
    enabled: true,
    userId: userId,
    repeat:
      Math.random() > 0.5
        ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        : [],
    sound: Math.random() > 0.7 ? 'premium-sound' : 'default',
  };
}

/**
 * Critical endpoints stress test
 */
export function criticalEndpointsTest() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-stress-test/1.0',
  };

  // Authentication stress test
  group('Authentication Stress', function () {
    const authData = generateAuthData();
    const authResponse = http.post(`${API_URL}/auth/login`, JSON.stringify(authData), {
      headers: headers,
      tags: { endpoint: 'auth' },
    });

    check(authResponse, {
      'Auth under stress': r =>
        r.status === 200 || r.status === 401 || r.status === 429,
      'Auth not timing out': r => r.timings.duration < 5000,
    });
  });

  const userId = `stress_${__VU}_${__ITER}`;
  const authToken = `stress-token-${randomString(12)}`;
  const authHeaders = {
    ...headers,
    Authorization: `Bearer ${authToken}`,
  };

  sleep(randomIntBetween(1, 3));

  // Alarms GET stress test
  group('Alarms Read Stress', function () {
    const getAlarmsResponse = http.get(`${API_URL}/alarms?userId=${userId}`, {
      headers: authHeaders,
      tags: { endpoint: 'alarms_get' },
    });

    check(getAlarmsResponse, {
      'Alarms read under stress': r => r.status >= 200 && r.status < 500,
      'Read response reasonable': r => r.timings.duration < 2000,
    });
  });

  // Alarms POST stress test
  group('Alarms Create Stress', function () {
    const alarmData = generateAlarmData(userId);
    const createResponse = http.post(`${API_URL}/alarms`, JSON.stringify(alarmData), {
      headers: authHeaders,
      tags: { endpoint: 'alarms_create' },
    });

    const alarmCreated = check(createResponse, {
      'Alarm creation under stress': r => r.status >= 200 && r.status < 500,
      'Creation not failing hard': r => r.status !== 500,
    });

    // If alarm created, test trigger immediately
    if (alarmCreated && createResponse.json('id')) {
      const alarmId = createResponse.json('id');

      const triggerResponse = http.post(
        `${API_URL}/alarms/${alarmId}/trigger`,
        JSON.stringify({
          triggerTime: new Date().toISOString(),
          userId: userId,
        }),
        {
          headers: authHeaders,
          tags: { endpoint: 'alarm_trigger' },
        }
      );

      check(triggerResponse, {
        'Trigger under stress': r => r.status >= 200 && r.status < 500,
        'Trigger fast even under load': r => r.timings.duration < 500,
      });
    }
  });

  // Analytics stress test (high volume)
  group('Analytics Stress', function () {
    const events = [];
    const eventCount = randomIntBetween(1, 5); // Batch events

    for (_let i = 0; i < eventCount; i++) {
      events.push({
        event: 'stress_test_event',
        userId: userId,
        data: { iteration: __ITER, vu: __VU, eventIndex: i },
        timestamp: new Date().toISOString(),
      });
    }

    const analyticsResponse = http.post(
      `${API_URL}/analytics/events/batch`,
      JSON.stringify({
        events: events,
      }),
      {
        headers: authHeaders,
        tags: { endpoint: 'analytics_batch' },
      }
    );

    check(analyticsResponse, {
      'Analytics handling stress': r => r.status >= 200 && r.status < 500,
      'Analytics not blocking': r => r.timings.duration < 1000,
    });
  });

  sleep(randomIntBetween(1, 2));
}

/**
 * Critical path focused test
 */
export function criticalPathTest() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-critical-path/1.0',
  };

  const userId = `critical_${__VU}_${__ITER}`;
  const authToken = `critical-token-${randomString(12)}`;
  const authHeaders = {
    ...headers,
    Authorization: `Bearer ${authToken}`,
  };

  // Focus only on the most critical user journey
  group('Critical: Alarm Creation Flow', function () {
    // Step 1: Quick auth check
    const authCheck = http.get(`${API_URL}/auth/verify`, {
      headers: authHeaders,
      tags: { endpoint: 'auth_verify', critical: 'true' },
    });

    const authValid = check(authCheck, {
      'Critical auth check': r => r.status === 200,
    });

    if (!authValid) return; // Skip if auth fails

    // Step 2: Create alarm (most critical operation)
    const alarmData = generateAlarmData(userId);
    const createResponse = http.post(`${API_URL}/alarms`, JSON.stringify(alarmData), {
      headers: authHeaders,
      tags: { endpoint: 'alarms_create', critical: 'true' },
    });

    const alarmCreated = check(createResponse, {
      'Critical alarm creation': r => r.status === 201,
      'Critical creation speed': r => r.timings.duration < 500,
    });

    if (alarmCreated && createResponse.json('id')) {
      const alarmId = createResponse.json('id');

      // Step 3: Immediate trigger test (critical for reliability)
      const triggerResponse = http.post(
        `${API_URL}/alarms/${alarmId}/trigger`,
        JSON.stringify({
          triggerTime: new Date().toISOString(),
          userId: userId,
          testMode: true,
        }),
        {
          headers: authHeaders,
          tags: { endpoint: 'alarm_trigger', critical: 'true' },
        }
      );

      check(triggerResponse, {
        'Critical trigger works': r => r.status === 200,
        'Critical trigger fast': r => r.timings.duration < 150,
      });
    }
  });

  sleep(1); // Minimal delay for critical path
}

/**
 * Setup function
 */
export function setup() {
  console.log('🔥 Starting Critical Endpoints Stress Test');
  console.log(`📊 Target: ${BASE_URL} | API: ${API_URL}`);
  console.log(`⚡ Stress Level: ${STRESS_LEVEL.toUpperCase()}`);
  console.log('🎯 Testing breaking points and system limits');

  return {
    startTime: new Date().toISOString(),
    stressLevel: STRESS_LEVEL,
  };
}

/**
 * Teardown function
 */
export function teardown(data) {
  const endTime = new Date().toISOString();
  console.log('🎯 Critical Endpoints Stress Test completed');
  console.log(`📈 Started: ${data.startTime}`);
  console.log(`📉 Ended: ${endTime}`);
  console.log(`⚡ Stress Level: ${data.stressLevel.toUpperCase()}`);
  console.log('🔍 Check thresholds to identify breaking points');
  console.log('📊 System limits and bottlenecks revealed in metrics');
}
