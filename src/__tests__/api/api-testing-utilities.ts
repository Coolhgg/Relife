/**
 * Comprehensive API Testing Utilities
 * Provides powerful tools for testing API interactions, response validation, and scenario management
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { allHandlers, scenarioHandlers, MockDataFactory } from './enhanced-msw-handlers';

// Test server instance
export const testServer = setupServer(...allHandlers);

// API Test Configuration
export interface ApiTestConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  scenario?: 'success' | 'error' | 'slow' | 'offline';
}

// Response assertion utilities
export class ApiAssertions {
  static assertSuccessResponse<T = any>(response: any, expectedData?: Partial<T>) {
    expect(response).toHaveProperty('success', true);
    if (expectedData) {
      expect(response.data).toMatchObject(expectedData);
    }
    expect(response).toHaveProperty('timestamp');
  }

  static assertErrorResponse(response: any, expectedStatus?: number, expectedMessage?: string) {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    
    if (expectedStatus) {
      expect(response.error).toHaveProperty('status', expectedStatus);
    }
    
    if (expectedMessage) {
      expect(response.error).toHaveProperty('message', expectedMessage);
    }
  }

  static assertPaginatedResponse<T = any>(response: any, expectedItems?: Partial<T>[]) {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('meta');
    expect(response.meta).toHaveProperty('total');
    expect(response.meta).toHaveProperty('page');
    expect(response.meta).toHaveProperty('per_page');
    
    if (expectedItems) {
      expect(response.data).toHaveLength(expectedItems.length);
      expectedItems.forEach((item, index) => {
        expect(response.data[index]).toMatchObject(item);
      });
    }
  }

  static assertApiTiming(startTime: number, maxDuration: number) {
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(maxDuration);
  }

  static assertRateLimitHeaders(headers: Headers, expectedLimit?: number) {
    expect(headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(headers.get('X-RateLimit-Remaining')).toBeTruthy();
    expect(headers.get('X-RateLimit-Reset')).toBeTruthy();
    
    if (expectedLimit) {
      expect(headers.get('X-RateLimit-Limit')).toBe(expectedLimit.toString());
    }
  }

  static assertAuthHeaders(headers: Headers) {
    expect(headers.get('authorization')).toBeTruthy();
    expect(headers.get('authorization')).toMatch(/^Bearer .+/);
  }
}

// API Test Client with built-in utilities
export class ApiTestClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private scenario: string = 'success';

  constructor(config: ApiTestConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://relife-api.workers.dev';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  setScenario(scenario: 'success' | 'error' | 'slow' | 'offline') {
    this.scenario = scenario;
    testServer.use(...scenarioHandlers[scenario]);
  }

  setAuthToken(token: string) {
    this.defaultHeaders.authorization = `Bearer ${token}`;
  }

  async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<{
    response: Response;
    data: T;
    timing: number;
  }> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    const responseData = await response.json();
    const timing = Date.now() - startTime;
    
    return {
      response,
      data: responseData,
      timing,
    };
  }

  async get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  // Utility methods for common operations
  async authenticateUser(email: string = 'test@example.com', password: string = 'password') {
    const { data } = await this.post('/auth/v1/token', { email, password });
    if (data.access_token) {
      this.setAuthToken(data.access_token);
    }
    return data;
  }

  async createTestAlarm(overrides: any = {}) {
    const alarmData = MockDataFactory.createAlarm(overrides);
    const { data } = await this.post('/api/alarms', alarmData);
    return data;
  }

  async createTestBattle(overrides: any = {}) {
    const battleData = MockDataFactory.createBattle(overrides);
    const { data } = await this.post('/api/battles', battleData);
    return data;
  }

  async joinBattle(battleId: string, userId: string = 'test-user-123') {
    const { data } = await this.post(`/api/battles/${battleId}/join`, { user_id: userId });
    return data;
  }
}

// Request/Response interceptors for testing
export class ApiInterceptors {
  static recordRequests() {
    const requests: Array<{
      method: string;
      url: string;
      headers: Record<string, string>;
      body: any;
      timestamp: number;
    }> = [];

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async (url, options = {}) => {
      requests.push({
        method: options.method || 'GET',
        url: url.toString(),
        headers: options.headers || {},
        body: options.body,
        timestamp: Date.now(),
      });
      
      return originalFetch(url, options);
    });

    return {
      getRequests: () => requests,
      clear: () => requests.splice(0, requests.length),
      restore: () => {
        global.fetch = originalFetch;
      },
    };
  }

  static mockRequestTiming() {
    const timings: Array<{
      url: string;
      duration: number;
      timestamp: number;
    }> = [];

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async (url, options = {}) => {
      const startTime = Date.now();
      const result = await originalFetch(url, options);
      const duration = Date.now() - startTime;
      
      timings.push({
        url: url.toString(),
        duration,
        timestamp: startTime,
      });
      
      return result;
    });

    return {
      getTimings: () => timings,
      getAverageTiming: () => timings.reduce((sum, t) => sum + t.duration, 0) / timings.length,
      clear: () => timings.splice(0, timings.length),
      restore: () => {
        global.fetch = originalFetch;
      },
    };
  }
}

// Scenario testing utilities
export class ScenarioTester {
  private client: ApiTestClient;

  constructor(config?: ApiTestConfig) {
    this.client = new ApiTestClient(config);
  }

  async testSuccessScenario() {
    this.client.setScenario('success');
    
    // Test basic operations
    const auth = await this.client.authenticateUser();
    expect(auth.access_token).toBeTruthy();
    
    const alarm = await this.client.createTestAlarm();
    ApiAssertions.assertSuccessResponse(alarm.data);
    
    const battle = await this.client.createTestBattle();
    ApiAssertions.assertSuccessResponse(battle.data);
    
    return { auth, alarm, battle };
  }

  async testErrorHandling() {
    this.client.setScenario('error');
    
    const results = [];
    
    try {
      await this.client.authenticateUser('invalid@example.com', 'wrongpassword');
    } catch (error) {
      results.push({ type: 'auth_error', error });
    }
    
    try {
      await this.client.get('/api/alarms');
    } catch (error) {
      results.push({ type: 'api_error', error });
    }
    
    return results;
  }

  async testPerformance(maxDuration: number = 5000) {
    this.client.setScenario('success');
    
    const startTime = Date.now();
    
    const requests = await Promise.all([
      this.client.get('/api/health'),
      this.client.get('/api/users'),
      this.client.get('/api/alarms'),
      this.client.get('/api/battles'),
    ]);
    
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(maxDuration);
    
    requests.forEach(({ timing }) => {
      expect(timing).toBeLessThan(1000); // Each request under 1 second
    });
    
    return {
      totalTime,
      individualTimings: requests.map(r => r.timing),
      averageTime: requests.reduce((sum, r) => sum + r.timing, 0) / requests.length,
    };
  }

  async testRateLimiting() {
    // Override with rate-limited handler
    testServer.use(
      http.get('/api/test/rate-limit', ({ request }) => {
        const clientId = request.headers.get('x-client-id') || 'test';
        
        // Simulate rate limiting (5 requests per minute)
        if (Math.random() > 0.5) {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': '5',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 60).toString(),
              }
            }
          );
        }
        
        return HttpResponse.json({ success: true });
      })
    );
    
    const results = [];
    
    // Make multiple requests to trigger rate limiting
    for (let i = 0; i < 10; i++) {
      try {
        const result = await this.client.get('/api/test/rate-limit');
        results.push({ success: true, response: result.data });
      } catch (error: any) {
        if (error.status === 429) {
          ApiAssertions.assertRateLimitHeaders(error.headers);
          results.push({ success: false, rateLimited: true });
        } else {
          results.push({ success: false, error });
        }
      }
    }
    
    return results;
  }

  async testOfflineResilience() {
    this.client.setScenario('offline');
    
    const results = [];
    
    try {
      await this.client.get('/api/health');
    } catch (error) {
      results.push({ type: 'network_error', error });
    }
    
    // Switch back to success and test recovery
    this.client.setScenario('success');
    
    const recovery = await this.client.get('/api/health');
    results.push({ type: 'recovery', data: recovery.data });
    
    return results;
  }
}

// Data validation utilities
export class ApiDataValidation {
  static validateUser(user: any) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('created_at');
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(new Date(user.created_at)).toBeInstanceOf(Date);
  }

  static validateAlarm(alarm: any) {
    expect(alarm).toHaveProperty('id');
    expect(alarm).toHaveProperty('user_id');
    expect(alarm).toHaveProperty('time');
    expect(alarm).toHaveProperty('label');
    expect(alarm).toHaveProperty('is_active');
    expect(alarm.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(typeof alarm.is_active).toBe('boolean');
  }

  static validateBattle(battle: any) {
    expect(battle).toHaveProperty('id');
    expect(battle).toHaveProperty('creator_id');
    expect(battle).toHaveProperty('title');
    expect(battle).toHaveProperty('type');
    expect(battle).toHaveProperty('status');
    expect(battle).toHaveProperty('participants');
    expect(Array.isArray(battle.participants)).toBe(true);
  }

  static validateSubscription(subscription: any) {
    expect(subscription).toHaveProperty('id');
    expect(subscription).toHaveProperty('status');
    expect(subscription).toHaveProperty('current_period_start');
    expect(subscription).toHaveProperty('current_period_end');
    expect(['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'])
      .toContain(subscription.status);
  }

  static validateApiResponse(response: any) {
    expect(response).toHaveProperty('success');
    expect(typeof response.success).toBe('boolean');
    
    if (response.success) {
      expect(response).toHaveProperty('data');
    } else {
      expect(response).toHaveProperty('error');
    }
    
    expect(response).toHaveProperty('timestamp');
    expect(new Date(response.timestamp)).toBeInstanceOf(Date);
  }
}

// Test utilities for async operations
export class AsyncTestUtils {
  static async waitFor<T>(
    operation: () => Promise<T>,
    condition: (result: T) => boolean,
    options: {
      timeout?: number;
      interval?: number;
      maxAttempts?: number;
    } = {}
  ): Promise<T> {
    const {
      timeout = 5000,
      interval = 100,
      maxAttempts = timeout / interval,
    } = options;

    let attempts = 0;
    const startTime = Date.now();

    while (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
      try {
        const result = await operation();
        if (condition(result)) {
          return result;
        }
      } catch (error) {
        // Continue trying unless we've exceeded limits
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met after ${attempts} attempts in ${Date.now() - startTime}ms`);
  }

  static async expectEventually<T>(
    operation: () => Promise<T>,
    assertion: (result: T) => void,
    timeout: number = 5000
  ): Promise<void> {
    await AsyncTestUtils.waitFor(
      operation,
      (result) => {
        try {
          assertion(result);
          return true;
        } catch {
          return false;
        }
      },
      { timeout }
    );
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, backoffMs * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError!;
  }
}

// Export everything for easy access
export {
  testServer,
  MockDataFactory,
  allHandlers,
  scenarioHandlers,
};

// Test setup and teardown helpers
export const setupApiTesting = () => {
  beforeAll(() => testServer.listen());
  afterEach(() => testServer.resetHandlers());
  afterAll(() => testServer.close());
};

export default {
  ApiTestClient,
  ApiAssertions,
  ApiInterceptors,
  ScenarioTester,
  ApiDataValidation,
  AsyncTestUtils,
  MockDataFactory,
  setupApiTesting,
};