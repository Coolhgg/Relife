/**
 * k6 Validation Test for Performance Infrastructure
 *
 * This test validates that the k6 setup is working correctly
 * using external endpoints that don't require local servers.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Minimal validation test configuration
  stages: [
    { duration: '10s', target: 5 }, // Ramp up to 5 VUs over 10s
    { duration: '20s', target: 5 }, // Stay at 5 VUs for 20s
    { duration: '10s', target: 0 }, // Ramp down to 0 VUs
  ],

  // Basic performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must be under 1s
    http_req_failed: ['rate<0.05'], // Error rate must be less than 5%
    http_reqs: ['rate>0.5'], // Must have at least 0.5 request/second
  },

  // Tags for reporting
  tags: {
    test_type: 'validation',
    app: 'relife-alarm',
  },
};

export default function () {
  // Test 1: Simple GET request to validate k6 is working
  const response = http.get('https://httpbin.org/get');
  check(response, {
    'Status is 200': r => r.status === 200,
    'Response has origin': r => r.json().origin !== undefined,
    'Response time is acceptable': r => r.timings.duration < 2000,
  });

  sleep(1);

  // Test 2: POST request to validate different HTTP methods work
  const postResponse = http.post(
    'https://httpbin.org/post',
    JSON.stringify({
      test: 'k6-validation',
      timestamp: Date.now(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(postResponse, {
    'POST status is 200': r => r.status === 200,
    'POST response has data': r => r.json().json !== undefined,
  });

  sleep(1);
}

export function teardown() {
  console.log('🎯 k6 validation test completed');
  console.log('📊 Performance infrastructure is working correctly');
}
