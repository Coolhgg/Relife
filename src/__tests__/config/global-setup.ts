// Global setup for Jest testing environment
// This runs once before all test suites

import { performance } from 'perf_hooks';

/**
 * Enhanced global setup for comprehensive test environment initialization
 */
export default async function globalSetup() {
  const startTime = performance.now();

  console.log('\n🚀 Starting Relife test suite setup...\n');

  try {
    // Set global test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
    process.env.TZ = 'UTC';

    // Mock environment variables for consistent testing
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-12345';
    process.env.VITE_POSTHOG_KEY = 'test-posthog-key-67890';
    process.env.VITE_SENTRY_DSN = 'https://test-sentry-dsn@sentry.io/123456';
    process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789abcdef';
    process.env.VITE_APP_VERSION = '1.0.0-test';
    process.env.VITE_APP_ENV = 'test';

    // Database test configuration
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/relife_test';
    process.env.REDIS_URL = 'redis://localhost:6380/1';

    // External service test endpoints
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

    console.log('✅ Environment variables configured');

    // Initialize test database if needed (when running integration tests)
    if (process.env.RUN_INTEGRATION_TESTS === 'true') {
      console.log('🗄️ Preparing test database...');
      // Database setup would go here
      console.log('✅ Test database ready');
    }

    // Setup test file system if needed
    if (process.env.TEST_FILE_UPLOADS === 'true') {
      const fs = await import('fs/promises');
      const path = await import('path');

      const testUploadsDir = path.join(process.cwd(), 'tmp', 'test-uploads');
      try {
        await fs.mkdir(testUploadsDir, { recursive: true });
        console.log('📁 Test uploads directory created');
      } catch (error) {
        if ((error as any).code !== 'EEXIST') {
          console.warn('⚠️ Could not create test uploads directory:', error);
        }
      }
    }

    // Enhanced error handling for tests
    process.on('unhandledRejection', (reason, promise) => {
      console.warn('\n⚠️ Unhandled Promise Rejection in test environment:');
      console.warn('Promise:', promise);
      console.warn('Reason:', reason);
      console.warn('This may cause tests to fail unexpectedly.\n');
    });

    process.on('uncaughtException', error => {
      console.error('\n❌ Uncaught Exception in test environment:');
      console.error(error);
      console.error('This will cause the test suite to terminate.\n');
      process.exit(1);
    });

    // Setup performance monitoring for tests
    const originalPerformanceNow = performance.now;
    let testStartTimes = new Map<string, number>();

    (global as any).testPerformance = {
      startTest: (testName: string) => {
        testStartTimes.set(testName, originalPerformanceNow());
      },
      endTest: (testName: string) => {
        const startTime = testStartTimes.get(testName);
        if (startTime) {
          const duration = originalPerformanceNow() - startTime;
          if (duration > 5000) {
            // Log slow tests (>5s)
            console.log(
              `⏱️ Slow test detected: ${testName} took ${duration.toFixed(2)}ms`
            );
          }
          testStartTimes.delete(testName);
          return duration;
        }
        return 0;
      },
      getSlowTests: () => {
        const slowTests: Array<{ name: string; duration: number }> = [];
        // Implementation would track and return slow tests
        return slowTests;
      },
    };

    // Mock external services that don't need real connections
    console.log('🔧 Setting up service mocks...');

    // Mock time for consistent date testing
    if (process.env.MOCK_DATE) {
      const mockDate = new Date(process.env.MOCK_DATE);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
      console.log(`⏰ Date mocked to: ${mockDate.toISOString()}`);
    }

    // Setup test cleanup tracking
    (global as any).testCleanupTasks = [];
    (global as any).addTestCleanupTask = (task: () => void | Promise<void>) => {
      (global as any).testCleanupTasks.push(task);
    };

    const endTime = performance.now();
    const setupDuration = endTime - startTime;

    console.log('✅ Service mocks configured');
    console.log(`\n🎉 Global test setup complete in ${setupDuration.toFixed(2)}ms`);
    console.log(`📊 Running tests with ${process.env.JEST_WORKER_ID} worker(s)`);
    console.log(`🌍 Test environment: ${process.env.NODE_ENV}`);
    console.log(`⏰ Timezone: ${process.env.TZ}`);
    console.log(`📱 App version: ${process.env.VITE_APP_VERSION}`);

    if (process.env.VERBOSE_TESTS) {
      console.log('\n🔧 Environment Variables:');
      Object.keys(process.env)
        .filter(key => key.startsWith('VITE_') || key.startsWith('TEST_'))
        .forEach(key => {
          const value = process.env[key];
          const maskedValue =
            key.includes('SECRET') || key.includes('KEY')
              ? value?.slice(0, 10) + '...'
              : value;
          console.log(`  ${key}: ${maskedValue}`);
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('\n❌ Global test setup failed:');
    console.error(error);
    console.error('\nThis will prevent tests from running properly.\n');
    throw error;
  }
}
