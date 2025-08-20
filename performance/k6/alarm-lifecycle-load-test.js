/**
 * k6 Alarm Lifecycle Load Test for Relife Alarm App
 *
 * Tests the complete alarm creation → trigger → dismiss flow under load
 * with realistic user behavior patterns and performance thresholds.
 */
/* global __ENV, __VU, __ITER */

/* global __ENV, __VU, __ITER */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Test data for realistic scenarios
const alarmTimes = new SharedArray('alarm_times', function () {
  return [
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
  ];
});

const alarmLabels = new SharedArray('alarm_labels', function () {
  return [
    'Morning Workout',
    'Work Start',
    'Meeting Reminder',
    'Lunch Break',
    'Afternoon Break',
    'End of Work',
    'Dinner Time',
    'Evening Walk',
    'TV Show',
    'Bedtime Routine',
    'Medication',
    'Water Break',
  ];
});

export const options = {
  // Advanced load testing configuration
  scenarios: {
    // Scenario 1: Load Test - Normal user behavior
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 }, // Ramp up to 50 users
        { duration: '5m', target: 200 }, // Scale to 200 users
        { duration: '5m', target: 200 }, // Sustain 200 users
        { duration: '2m', target: 0 }, // Ramp down
      ],
      exec: 'alarmLifecycleTest',
      tags: { test_type: 'load', priority: 'high' },
    },

    // Scenario 2: Stress Test - Peak load behavior
    stress_test: {
      executor: 'ramping-vus',
      startTime: '15m', // Start after load test
      stages: [
        { duration: '2m', target: 200 }, // Quick ramp to 200
        { duration: '3m', target: 500 }, // Stress test to 500 users
        { duration: '2m', target: 500 }, // Sustain peak load
        { duration: '3m', target: 0 }, // Gradual ramp down
      ],
      exec: 'alarmLifecycleTest',
      tags: { test_type: 'stress', priority: 'critical' },
    },

    // Scenario 3: Soak Test - Endurance testing
    soak_test: {
      executor: 'constant-vus',
      startTime: '25m', // Start after stress test
      vus: 100,
      duration: '10m',
      exec: 'alarmLifecycleTest',
      tags: { test_type: 'soak', priority: 'stability' },
    },
  },

  // Strict performance thresholds for alarm app
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<300'], // 95% of requests < 300ms
    'http_req_duration{test_type:load}': ['p(90)<250'], // Load test: 90% < 250ms
    'http_req_duration{test_type:stress}': ['p(95)<500'], // Stress test: 95% < 500ms

    // Error rate thresholds
    http_req_failed: ['rate<0.01'], // Overall error rate < 1%
    'http_req_failed{test_type:load}': ['rate<0.005'], // Load test: < 0.5% errors
    'http_req_failed{test_type:stress}': ['rate<0.02'], // Stress test: < 2% errors

    // Throughput thresholds
    http_reqs: ['rate>10'], // Minimum 10 requests/second
    'http_reqs{test_type:load}': ['rate>20'], // Load test: 20+ req/s

    // Specific endpoint thresholds
    'http_req_duration{endpoint:alarm_create}': ['p(95)<400'],
    'http_req_duration{endpoint:alarm_trigger}': ['p(95)<100'],
    'http_req_duration{endpoint:alarm_dismiss}': ['p(95)<200'],
    'http_req_duration{endpoint:premium_check}': ['p(95)<150'],
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3001/api';

// Mock authentication token for testing
const AUTH_TOKEN =
  __ENV.AUTH_TOKEN || 'test-auth-token-' + Math.random().toString(36).substr(2, 9);

/**
 * Main alarm lifecycle test function
 */
export function alarmLifecycleTest() {
  const userId = `user_${__VU}_${__ITER}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'User-Agent': 'k6-load-test/1.0',
  };

  // Step 1: User authentication simulation
  const authResponse = http.post(
    `${API_URL}/auth/validate`,
    JSON.stringify({
      token: AUTH_TOKEN,
      userId: userId,
    }),
    {
      headers: headers,
      tags: { endpoint: 'auth_validate' },
    }
  );

  check(authResponse, {
    'Auth validation successful': r => r.status === 200 || r.status === 201,
    'Auth response time OK': r => r.timings.duration < 500,
  });

  sleep(randomIntBetween(1, 3)); // User thinking time

  // Step 2: Create new alarm
  const alarmTime = alarmTimes[randomIntBetween(0, alarmTimes.length - 1)];
  const alarmLabel = alarmLabels[randomIntBetween(0, alarmLabels.length - 1)];

  const createAlarmResponse = http.post(
    `${API_URL}/alarms`,
    JSON.stringify({
      time: alarmTime,
      label: alarmLabel,
      enabled: true,
      repeat: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      sound: 'default',
      userId: userId,
    }),
    {
      headers: headers,
      tags: { endpoint: 'alarm_create' },
    }
  );

  const alarmId = check(createAlarmResponse, {
    'Alarm created successfully': r => r.status === 201 || r.status === 200,
    'Alarm has ID': r => r.json('id') !== undefined,
    'Alarm creation time OK': r => r.timings.duration < 400,
  })
    ? createAlarmResponse.json('id') ||
      `alarm_${Math.random().toString(36).substr(2, 9)}`
    : null;

  sleep(randomIntBetween(2, 5)); // User interaction delay

  // Step 3: Check premium features (simulate subscription check)
  const premiumResponse = http.get(`${API_URL}/users/${userId}/premium`, {
    headers: headers,
    tags: { endpoint: 'premium_check' },
  });

  check(premiumResponse, {
    'Premium check successful': r => r.status === 200,
    'Premium check fast': r => r.timings.duration < 150,
  });

  sleep(randomIntBetween(1, 2));

  // Step 4: Simulate alarm trigger and analytics logging
  if (alarmId) {
    // Simulate alarm trigger event (background process)
    const triggerResponse = http.post(
      `${API_URL}/alarms/${alarmId}/trigger`,
      JSON.stringify({
        triggerTime: new Date().toISOString(),
        userId: userId,
      }),
      {
        headers: headers,
        tags: { endpoint: 'alarm_trigger' },
      }
    );

    check(triggerResponse, {
      'Alarm triggered successfully': r => r.status === 200 || r.status === 202,
      'Trigger response fast': r => r.timings.duration < 100,
    });

    sleep(randomIntBetween(5, 15)); // Alarm ring time (user response delay)

    // Step 5: Dismiss alarm
    const dismissResponse = http.post(
      `${API_URL}/alarms/${alarmId}/dismiss`,
      JSON.stringify({
        dismissTime: new Date().toISOString(),
        dismissMethod: 'tap', // or 'voice', 'gesture'
        userId: userId,
      }),
      {
        headers: headers,
        tags: { endpoint: 'alarm_dismiss' },
      }
    );

    check(dismissResponse, {
      'Alarm dismissed successfully': r => r.status === 200,
      'Dismiss response fast': r => r.timings.duration < 200,
    });

    // Step 6: Log analytics event
    const analyticsResponse = http.post(
      `${API_URL}/analytics/events`,
      JSON.stringify({
        event: 'alarm_lifecycle_completed',
        userId: userId,
        alarmId: alarmId,
        duration: randomIntBetween(5000, 15000),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: headers,
        tags: { endpoint: 'analytics_log' },
      }
    );

    check(analyticsResponse, {
      'Analytics logged': r => r.status === 200 || r.status === 201 || r.status === 202,
      'Analytics fast': r => r.timings.duration < 100,
    });
  }

  sleep(randomIntBetween(1, 3)); // Cool down period
}

/**
 * Setup function - runs once before all scenarios
 */
export function setup() {
  console.log('🚀 Starting Relife Alarm Lifecycle Load Test');
  console.log(`📊 Target: ${BASE_URL} | API: ${API_URL}`);
  console.log('⏰ Testing: Alarm Creation → Trigger → Dismiss flow');
  return { startTime: new Date().toISOString() };
}

/**
 * Teardown function - runs once after all scenarios complete
 */
export function teardown(data) {
  const endTime = new Date().toISOString();
  console.log('🎯 Alarm Lifecycle Load Test completed');
  console.log(`📈 Started: ${data.startTime}`);
  console.log(`📉 Ended: ${endTime}`);
  console.log('📊 Check the performance thresholds and metrics above');
  console.log('🔍 Full report available in artifacts/k6-load-report.html');
}
