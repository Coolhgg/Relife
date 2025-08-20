/**
 * k6 Soak/Endurance Test for Relife Alarm App
 *
 * Long-running test to identify memory leaks, performance degradation,
 * and system stability issues over extended periods.
 */
/* global __ENV, __VU, __ITER */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Realistic user behavior patterns for long-term testing
const userPatterns = new SharedArray('user_patterns', function () {
  return [
    { type: 'morning_user', active_hours: [6, 7, 8, 9], frequency: 'high' },
    {
      type: 'office_worker',
      active_hours: [7, 8, 12, 13, 17, 18],
      frequency: 'medium',
    },
    { type: 'night_owl', active_hours: [22, 23, 0, 1], frequency: 'low' },
    { type: 'shift_worker', active_hours: [14, 15, 22, 23, 6, 7], frequency: 'medium' },
    {
      type: 'power_user',
      active_hours: [6, 7, 8, 12, 13, 17, 18, 21, 22],
      frequency: 'high',
    },
  ];
});

export const options = {
  scenarios: {
    // Main soak test - sustained load for memory leak detection
    endurance_test: {
      executor: 'constant-vus',
      vus: 100, // Moderate sustained load
      duration: '30m', // 30 minutes of constant load
      exec: 'soakTest',
      tags: { test_type: 'soak', priority: 'stability' },
    },

    // Background activity simulation
    background_activity: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 requests/second background activity
      duration: '30m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'backgroundActivity',
      tags: { test_type: 'background', priority: 'low' },
    },

    // Periodic heavy activity (simulating rush hours)
    periodic_load: {
      executor: 'ramping-vus',
      stages: [
        // Simulate morning rush (7-9 AM)
        { duration: '2m', target: 50 },
        { duration: '4m', target: 200 }, // Morning peak
        { duration: '2m', target: 50 },

        // Quiet period
        { duration: '4m', target: 25 },

        // Lunch rush (12-1 PM)
        { duration: '2m', target: 150 },
        { duration: '2m', target: 150 },
        { duration: '2m', target: 50 },

        // Afternoon quiet
        { duration: '4m', target: 25 },

        // Evening rush (5-7 PM)
        { duration: '2m', target: 180 },
        { duration: '4m', target: 180 }, // Evening peak
        { duration: '2m', target: 50 },

        // Wind down
        { duration: '2m', target: 25 },
      ],
      exec: 'periodicLoadTest',
      tags: { test_type: 'periodic', priority: 'realistic' },
    },
  },

  // Long-term stability thresholds
  thresholds: {
    // Memory and performance stability
    http_req_duration: [
      'p(50)<250', // Median should stay stable
      'p(95)<800', // 95th percentile shouldn't degrade significantly
      'p(99)<2000', // 99th percentile upper bound
    ],

    // Error rate should remain low throughout
    http_req_failed: ['rate<0.02'], // < 2% errors over 30 minutes

    // Throughput should remain consistent
    http_reqs: ['rate>5'], // Minimum sustained throughput

    // Specific stability checks
    'http_req_duration{test_type:soak}': [
      'p(50)<200', // Soak test median should be better
      'p(95)<600', // Soak test 95th percentile
    ],

    'http_req_failed{test_type:soak}': ['rate<0.01'], // Soak test: < 1% errors
    'http_req_failed{test_type:background}': ['rate<0.005'], // Background: < 0.5% errors

    // Performance degradation detection
    'http_req_duration{endpoint:alarm_create}': [
      'p(95)<500', // Alarm creation should stay fast
      'avg<300', // Average shouldn't degrade
    ],

    'http_req_duration{endpoint:alarm_trigger}': [
      'p(95)<150', // Critical: alarm triggers must stay fast
      'p(99)<300', // Even 99th percentile should be reasonable
    ],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3001/api';
const SOAK_DURATION = parseInt(__ENV.SOAK_DURATION) || 30; // minutes

// Performance tracking variables
let iterationCount = 0;
let errorCount = 0;
let totalResponseTime = 0;

/**
 * Main soak test - simulates realistic user behavior over extended time
 */
export function soakTest() {
  iterationCount++;

  const userId = `soak_user_${__VU}`;
  const sessionId = `session_${__VU}_${Math.floor(__ITER / 10)}`; // New session every 10 iterations

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer soak-token-${userId}`,
    'X-Session-ID': sessionId,
    'User-Agent': 'k6-soak-test/1.0',
  };

  group('Soak: User Session Management', function () {
    // Simulate session validation (happens frequently)
    const sessionCheck = http.get(`${API_URL}/auth/session/${sessionId}`, {
      headers: headers,
      tags: { endpoint: 'session_check' },
    });

    const sessionValid = check(sessionCheck, {
      'Session check stable': r => r.status === 200 || r.status === 401,
      'Session response consistent': r => r.timings.duration < 300,
    });

    if (!sessionValid) errorCount++;
    totalResponseTime += sessionCheck.timings.duration;
  });

  sleep(randomIntBetween(2, 5));

  group('Soak: Alarm Management', function () {
    // Get existing alarms
    const getAlarms = http.get(`${API_URL}/alarms?userId=${userId}&limit=10`, {
      headers: headers,
      tags: { endpoint: 'alarms_get' },
    });

    check(getAlarms, {
      'Alarms list stable': r => r.status === 200,
      'Get alarms performance steady': r => r.timings.duration < 400,
    });

    totalResponseTime += getAlarms.timings.duration;

    // Periodically create new alarms (every 5th iteration)
    if (__ITER % 5 === 0) {
      const alarmData = {
        time: `${randomIntBetween(6, 23)}:${randomIntBetween(0, 59)}`,
        label: `Soak Test Alarm ${__ITER}`,
        userId: userId,
        enabled: true,
      };

      const createAlarm = http.post(`${API_URL}/alarms`, JSON.stringify(alarmData), {
        headers: headers,
        tags: { endpoint: 'alarm_create' },
      });

      const alarmCreated = check(createAlarm, {
        'Alarm creation stable': r => r.status === 201,
        'Creation performance consistent': r => r.timings.duration < 500,
      });

      if (alarmCreated && createAlarm.json('id')) {
        // Test immediate trigger
        const alarmId = createAlarm.json('id');
        const triggerTest = http.post(
          `${API_URL}/alarms/${alarmId}/trigger`,
          JSON.stringify({
            triggerTime: new Date().toISOString(),
            userId: userId,
            testMode: true,
          }),
          {
            headers: headers,
            tags: { endpoint: 'alarm_trigger' },
          }
        );

        check(triggerTest, {
          'Trigger performance stable': r => r.status === 200,
          'Trigger stays fast': r => r.timings.duration < 150,
        });

        totalResponseTime += triggerTest.timings.duration;
      }

      totalResponseTime += createAlarm.timings.duration;
    }
  });

  sleep(randomIntBetween(3, 8));

  group('Soak: Analytics & Monitoring', function () {
    // Send analytics data (memory leak test)
    const analyticsEvents = [];
    for (let i = 0; i < randomIntBetween(1, 3); i++) {
      analyticsEvents.push({
        event: 'soak_test_event',
        userId: userId,
        sessionId: sessionId,
        iteration: __ITER,
        timestamp: new Date().toISOString(),
        data: {
          performanceMetrics: {
            averageResponseTime: totalResponseTime / (iterationCount || 1),
            errorRate: errorCount / (iterationCount || 1),
          },
        },
      });
    }

    const analytics = http.post(
      `${API_URL}/analytics/events/batch`,
      JSON.stringify({
        events: analyticsEvents,
      }),
      {
        headers: headers,
        tags: { endpoint: 'analytics_batch' },
      }
    );

    check(analytics, {
      'Analytics ingestion stable': r => r.status >= 200 && r.status < 300,
      'Analytics processing efficient': r => r.timings.duration < 200,
    });

    totalResponseTime += analytics.timings.duration;
  });

  // Variable sleep based on user pattern simulation
  const userPattern = userPatterns[__VU % userPatterns.length];
  const currentHour = new Date().getHours();
  const isActiveHour = userPattern.active_hours.includes(currentHour);

  if (isActiveHour) {
    sleep(randomIntBetween(1, 3)); // More active during active hours
  } else {
    sleep(randomIntBetween(5, 10)); // Less active during off hours
  }
}

/**
 * Background activity simulation
 */
export function backgroundActivity() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-background/1.0',
  };

  // Lightweight background operations
  const operations = ['health', 'metrics', 'config'];
  const operation = operations[randomIntBetween(0, operations.length - 1)];

  const response = http.get(`${API_URL}/system/${operation}`, {
    headers: headers,
    tags: { endpoint: `system_${operation}`, background: 'true' },
  });

  check(response, {
    'Background ops responsive': r => r.status === 200,
    'Background not impacting performance': r => r.timings.duration < 100,
  });

  sleep(randomIntBetween(1, 2));
}

/**
 * Periodic load simulation
 */
export function periodicLoadTest() {
  const userId = `periodic_${__VU}_${__ITER}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer periodic-token-${userId}`,
    'User-Agent': 'k6-periodic/1.0',
  };

  // Simulate rush hour behavior - more intensive operations
  group('Periodic: Rush Hour Simulation', function () {
    // Multiple alarm operations in sequence
    const operations = randomIntBetween(2, 5);

    for (let i = 0; i < operations; i++) {
      const operation = ['get', 'create', 'update'][randomIntBetween(0, 2)];

      if (operation === 'get') {
        const getResponse = http.get(`${API_URL}/alarms?userId=${userId}`, {
          headers: headers,
          tags: { endpoint: 'alarms_get', load_type: 'periodic' },
        });

        check(getResponse, {
          'Periodic get handled': r => r.status === 200,
        });
      } else if (operation === 'create') {
        const alarmData = {
          time: `${randomIntBetween(7, 9)}:${randomIntBetween(0, 59)}`,
          label: `Rush Hour Alarm ${i}`,
          userId: userId,
          enabled: true,
        };

        const createResponse = http.post(
          `${API_URL}/alarms`,
          JSON.stringify(alarmData),
          {
            headers: headers,
            tags: { endpoint: 'alarm_create', load_type: 'periodic' },
          }
        );

        check(createResponse, {
          'Periodic create handled': r => r.status === 201,
        });
      }

      sleep(0.5); // Quick succession during rush hours
    }
  });

  sleep(randomIntBetween(1, 4));
}

/**
 * Setup function
 */
export function setup() {
  console.log('🏃 Starting Soak/Endurance Test');
  console.log(`📊 Target: ${BASE_URL} | API: ${API_URL}`);
  console.log(`⏰ Duration: ${SOAK_DURATION} minutes`);
  console.log(
    '🔍 Testing for: Memory leaks, performance degradation, long-term stability'
  );
  console.log('📈 Monitoring: Response times, error rates, throughput consistency');

  return {
    startTime: new Date().toISOString(),
    duration: SOAK_DURATION,
  };
}

/**
 * Teardown function
 */
export function teardown(data) {
  const endTime = new Date().toISOString();
  const avgResponseTime = totalResponseTime / (iterationCount || 1);

  console.log('🎯 Soak/Endurance Test completed');
  console.log(`📈 Started: ${data.startTime}`);
  console.log(`📉 Ended: ${endTime}`);
  console.log(`⏱️  Duration: ${data.duration} minutes`);
  console.log(`📊 Total iterations: ${iterationCount}`);
  console.log(`⚡ Average response time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`❌ Total errors: ${errorCount}`);
  console.log('🔍 Check for performance degradation trends in metrics');
  console.log('💾 Memory leaks would show as increasing response times over time');
}
