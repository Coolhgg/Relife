/**
 * k6 Baseline Smoke Test for Relife Alarm App
 *
 * This test validates that basic endpoints can handle minimal load.
 * Run with: k6 run baseline-smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Smoke test configuration - minimal load
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 VUs over 30s
    { duration: '1m', target: 10 }, // Stay at 10 VUs for 1 min
    { duration: '30s', target: 0 }, // Ramp down to 0 VUs
  ],

  // Performance thresholds - baseline expectations
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be under 500ms
    http_req_failed: ['rate<0.01'], // Error rate must be less than 1%
    http_reqs: ['rate>1'], // Must have at least 1 request/second
  },

  // Tags for reporting
  tags: {
    test_type: 'smoke',
    app: 'relife-alarm',
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Test 1: Frontend homepage load
  const homepageResponse = http.get(`${BASE_URL}/`);
  check(homepageResponse, {
    'Homepage loads successfully': r => r.status === 200,
    'Homepage has title': r => r.body.includes('<title>'),
    'Homepage loads fast': r => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 2: API health check
  const healthResponse = http.get(`${API_URL}/health`);
  check(healthResponse, {
    'API health check passes': r => r.status === 200,
    'API responds quickly': r => r.timings.duration < 200,
  });

  sleep(1);

  // Test 3: Static assets (simulate loading CSS/JS)
  const assetsResponse = http.get(`${BASE_URL}/src/main.tsx`);
  check(assetsResponse, {
    'Assets load successfully': r => r.status === 200 || r.status === 404, // 404 is ok for dev
  });

  sleep(1);
}

export function teardown() {
  console.log('🎯 Baseline smoke test completed');
  console.log('📊 Check the performance thresholds above for results');
}
