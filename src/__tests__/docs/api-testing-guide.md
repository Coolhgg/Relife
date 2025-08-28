# API Testing Guide

This guide covers testing API endpoints, service integrations, and backend functionality in the Relife application.

## Overview

Relife uses a hybrid API architecture:
- **Cloudflare Workers** for edge API endpoints
- **Supabase** for database operations and real-time features
- **Stripe** for payment processing
- **ElevenLabs** for voice processing

## API Testing Utilities

### Enhanced MSW Handlers

The framework provides comprehensive MSW (Mock Service Worker) handlers for all API endpoints:

```typescript
import { enhancedHandlers } from '../api/enhanced-msw-handlers';
import { setupServer } from 'msw/node';

// Setup MSW server
const server = setupServer(...enhancedHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### API Test Client

Use the `ApiTestClient` for making test requests:

```typescript
import { ApiTestClient } from '../api/api-testing-utilities';

describe('Alarm API', () => {
  let apiClient: ApiTestClient;

  beforeEach(() => {
    apiClient = new ApiTestClient();
  });

  it('should create alarm via API', async () => {
    const alarmData = {
      label: 'Test Alarm',
      time: '07:00',
      days: [1, 2, 3, 4, 5]
    };

    const response = await apiClient.request('POST', '/api/alarms', alarmData);
    
    expect(response.status).toBe(201);
    expect(response.data.alarm).toMatchObject(alarmData);
  });
});
```

## Testing Different API Scenarios

### Success Scenarios

```typescript
it('should handle successful API responses', async () => {
  apiClient.setScenario('success');
  
  const response = await apiClient.request('GET', '/api/alarms');
  
  expect(response.status).toBe(200);
  expect(response.data.alarms).toHaveLength(5); // Default mock data
});
```

### Error Scenarios

```typescript
it('should handle API errors gracefully', async () => {
  apiClient.setScenario('error');
  
  const response = await apiClient.request('GET', '/api/alarms');
  
  expect(response.status).toBe(500);
  expect(response.data.error).toBeDefined();
});
```

### Slow Network Scenarios

```typescript
it('should handle slow network conditions', async () => {
  apiClient.setScenario('slow');
  
  const startTime = performance.now();
  const response = await apiClient.request('GET', '/api/alarms');
  const duration = performance.now() - startTime;
  
  expect(duration).toBeGreaterThan(2000); // Should be slow
  expect(response.status).toBe(200);
});
```

### Offline Scenarios

```typescript
it('should handle offline conditions', async () => {
  apiClient.setScenario('offline');
  
  await expect(
    apiClient.request('GET', '/api/alarms')
  ).rejects.toThrow(/network error/i);
});
```

## Testing Specific API Endpoints

### User Management APIs

```typescript
describe('User Management API', () => {
  it('should register new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User'
    };

    const response = await apiClient.request('POST', '/api/auth/register', userData);
    
    expect(response.status).toBe(201);
    expect(response.data.user.email).toBe(userData.email);
    expect(response.data.token).toBeDefined();
  });

  it('should authenticate user', async () => {
    await apiClient.authenticateUser('test@example.com', 'password');
    
    const response = await apiClient.request('GET', '/api/user/profile');
    expect(response.status).toBe(200);
    expect(response.data.user.email).toBe('test@example.com');
  });
});
```

### Alarm APIs

```typescript
describe('Alarm Management API', () => {
  beforeEach(async () => {
    await apiClient.authenticateUser();
  });

  it('should create alarm', async () => {
    const alarm = await apiClient.createTestAlarm({
      label: 'API Test Alarm',
      time: '08:00',
      difficulty: 'hard'
    });

    expect(alarm.id).toBeDefined();
    expect(alarm.label).toBe('API Test Alarm');
  });

  it('should update alarm', async () => {
    const alarm = await apiClient.createTestAlarm();
    
    const response = await apiClient.request('PUT', `/api/alarms/${alarm.id}`, {
      label: 'Updated Alarm'
    });

    expect(response.status).toBe(200);
    expect(response.data.alarm.label).toBe('Updated Alarm');
  });

  it('should delete alarm', async () => {
    const alarm = await apiClient.createTestAlarm();
    
    const response = await apiClient.request('DELETE', `/api/alarms/${alarm.id}`);
    expect(response.status).toBe(204);

    // Verify deletion
    const getResponse = await apiClient.request('GET', `/api/alarms/${alarm.id}`);
    expect(getResponse.status).toBe(404);
  });
});
```

### Battle APIs

```typescript
describe('Battle System API', () => {
  beforeEach(async () => {
    await apiClient.authenticateUser();
  });

  it('should join quick battle', async () => {
    const response = await apiClient.request('POST', '/api/battles/join', {
      type: 'quick',
      difficulty: 'medium'
    });

    expect(response.status).toBe(200);
    expect(response.data.battle.status).toBe('waiting');
  });

  it('should submit battle challenge answer', async () => {
    const battle = await apiClient.createTestBattle();
    
    const response = await apiClient.request('POST', `/api/battles/${battle.id}/answer`, {
      challengeId: 'challenge-1',
      answer: '42'
    });

    expect(response.status).toBe(200);
    expect(response.data.correct).toBe(true);
  });
});
```

## Performance Testing APIs

### Response Time Testing

```typescript
import { apiPerformanceTester } from '../performance/performance-testing-utilities';

describe('API Performance', () => {
  it('should meet response time requirements', async () => {
    const results = await apiPerformanceTester.testEndpointPerformance(
      '/api/alarms',
      'GET',
      {
        iterations: 100,
        concurrent: 5,
        acceptableResponseTime: 500
      }
    );

    expect(results.passed).toBe(true);
    expect(results.averageResponseTime).toBeLessThan(500);
    expect(results.p95ResponseTime).toBeLessThan(750);
  });

  it('should handle concurrent requests', async () => {
    const results = await apiPerformanceTester.testEndpointPerformance(
      '/api/alarms',
      'GET',
      { concurrent: 10 }
    );

    expect(results.successRate).toBeGreaterThan(0.95); // 95% success rate
  });
});
```

### Load Testing

```typescript
describe('API Load Testing', () => {
  it('should handle high request volume', async () => {
    const results = await apiPerformanceTester.benchmarkCriticalPaths([
      { name: 'load_alarms', endpoint: '/api/alarms', method: 'GET' },
      { name: 'create_alarm', endpoint: '/api/alarms', method: 'POST' },
      { name: 'join_battle', endpoint: '/api/battles/join', method: 'POST' }
    ], { acceptableResponseTime: 1000 });

    Object.values(results).forEach(result => {
      expect(result.passed).toBe(true);
    });
  });
});
```

## Testing API Integrations

### Supabase Integration

```typescript
import { MockSupabaseClient } from '../mocks/platform-service-mocks';

describe('Supabase Integration', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = new MockSupabaseClient();
  });

  it('should sync data with Supabase', async () => {
    const alarm = await mockSupabase.from('alarms').insert({
      label: 'Test Alarm',
      time: '07:00',
      user_id: 'user-123'
    });

    expect(alarm.data).toBeDefined();
    expect(alarm.error).toBeNull();
  });

  it('should handle real-time updates', async () => {
    const channel = mockSupabase.channel('alarms');
    const updateHandler = jest.fn();

    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'alarms'
    }, updateHandler);

    // Simulate update
    await mockSupabase.simulateRealtimeUpdate('alarms', {
      id: '1',
      label: 'Updated Alarm'
    });

    expect(updateHandler).toHaveBeenCalled();
  });
});
```

### Stripe Integration

```typescript
import { PaymentFlowTester } from '../payments/payment-testing-utilities';

describe('Stripe Integration', () => {
  let paymentTester: PaymentFlowTester;

  beforeEach(() => {
    paymentTester = new PaymentFlowTester();
  });

  it('should process subscription payment', async () => {
    const result = await paymentTester.testSubscriptionFlow('premium', {
      customer: { email: 'test@example.com' },
      paymentMethod: 'pm_card_visa'
    });

    expect(result.success).toBe(true);
    expect(result.subscription.status).toBe('active');
  });

  it('should handle webhook events', async () => {
    const result = await paymentTester.testWebhookReliability([
      'invoice.payment_succeeded',
      'customer.subscription.updated'
    ]);

    expect(result.allProcessed).toBe(true);
    expect(result.averageProcessingTime).toBeLessThan(1000);
  });
});
```

## Testing Real-time Features

### WebSocket Testing

```typescript
import { realTimePerformanceTester } from '../performance/performance-testing-utilities';

describe('Real-time Features', () => {
  it('should maintain WebSocket connection', async () => {
    const results = await realTimePerformanceTester.testWebSocketPerformance({
      duration: 10000,
      messageRate: 5,
      acceptableLatency: 200
    });

    expect(results.passed).toBe(true);
    expect(results.droppedMessages).toBe(0);
    expect(results.averageLatency).toBeLessThan(200);
  });

  it('should sync battle state in real-time', async () => {
    const results = await realTimePerformanceTester.testBattleRealTimeSync(30000);

    expect(results.syncAccuracy).toBeGreaterThan(95);
    expect(results.desyncEvents).toBeLessThan(3);
  });
});
```

## API Testing Best Practices

### 1. Use Proper HTTP Status Codes

```typescript
// Test success cases
expect(response.status).toBe(200); // GET success
expect(response.status).toBe(201); // POST success
expect(response.status).toBe(204); // DELETE success

// Test error cases
expect(response.status).toBe(400); // Bad request
expect(response.status).toBe(401); // Unauthorized
expect(response.status).toBe(404); // Not found
expect(response.status).toBe(500); // Server error
```

### 2. Validate Response Structure

```typescript
it('should return properly structured response', async () => {
  const response = await apiClient.request('GET', '/api/alarms');
  
  expect(response.data).toMatchObject({
    alarms: expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        label: expect.any(String),
        time: expect.any(String),
        enabled: expect.any(Boolean)
      })
    ]),
    total: expect.any(Number),
    page: expect.any(Number)
  });
});
```

### 3. Test Authentication and Authorization

```typescript
describe('API Security', () => {
  it('should require authentication for protected endpoints', async () => {
    // Don't authenticate
    const response = await apiClient.request('GET', '/api/alarms');
    expect(response.status).toBe(401);
  });

  it('should enforce user data isolation', async () => {
    await apiClient.authenticateUser('user1@example.com');
    const user1Alarms = await apiClient.request('GET', '/api/alarms');

    await apiClient.authenticateUser('user2@example.com');
    const user2Alarms = await apiClient.request('GET', '/api/alarms');

    // Users should only see their own alarms
    expect(user1Alarms.data.alarms).not.toEqual(user2Alarms.data.alarms);
  });
});
```

### 4. Test Input Validation

```typescript
it('should validate required fields', async () => {
  const response = await apiClient.request('POST', '/api/alarms', {
    // Missing required fields
    time: '07:00'
  });

  expect(response.status).toBe(400);
  expect(response.data.errors).toContain('label is required');
});

it('should validate field formats', async () => {
  const response = await apiClient.request('POST', '/api/alarms', {
    label: 'Test Alarm',
    time: 'invalid-time-format'
  });

  expect(response.status).toBe(400);
  expect(response.data.errors).toContain('time must be in HH:MM format');
});
```

### 5. Test Rate Limiting

```typescript
it('should enforce rate limits', async () => {
  const requests = Array.from({ length: 101 }, () =>
    apiClient.request('GET', '/api/alarms')
  );

  const responses = await Promise.all(requests);
  const rateLimitedResponses = responses.filter(r => r.status === 429);

  expect(rateLimitedResponses.length).toBeGreaterThan(0);
});
```

## Debugging API Tests

### Enable Request/Response Logging

```typescript
import { ApiTestClient } from '../api/api-testing-utilities';

const apiClient = new ApiTestClient({
  enableLogging: true,
  logLevel: 'debug'
});
```

### Mock Specific Responses

```typescript
import { server } from '../mocks/msw-setup';
import { rest } from 'msw';

it('should handle specific error case', async () => {
  // Override default handler for this test
  server.use(
    rest.get('/api/alarms', (req, res, ctx) => {
      return res(
        ctx.status(503),
        ctx.json({ error: 'Service temporarily unavailable' })
      );
    })
  );

  const response = await apiClient.request('GET', '/api/alarms');
  expect(response.status).toBe(503);
});
```

### Verify Network Requests

```typescript
import { ApiAssertions } from '../api/api-testing-utilities';

it('should make correct API calls', async () => {
  const mockFetch = jest.spyOn(global, 'fetch');
  
  await apiClient.request('GET', '/api/alarms');
  
  ApiAssertions.expectApiToHaveBeenCalled(mockFetch, 1, [
    '/api/alarms',
    expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        'Authorization': expect.stringMatching(/Bearer .+/)
      })
    })
  ]);
});
```

## Next Steps

- Review [Performance Testing Guide](./performance-testing-guide.md) for API performance optimization
- Check [Integration Testing Guide](./integration-testing-guide.md) for E2E API testing
- See [Troubleshooting Guide](./troubleshooting.md) for common API testing issues

---

This guide covers the comprehensive API testing capabilities available in the Relife testing framework. Use these patterns and utilities to ensure robust API functionality and performance.