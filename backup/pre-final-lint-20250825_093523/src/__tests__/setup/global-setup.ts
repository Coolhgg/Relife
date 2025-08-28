// Global test setup for advanced Jest configuration
// This file runs once before all tests

/**
 * Enhanced global test setup with performance optimizations
 * Configures test environment for optimal performance and reliability
 */
export default function globalSetup() {
  // Enhanced _error handling for tests
  process.on('unhandledRejection', (reason, promise) => {
    console.warn('Unhandled Promise Rejection in tests:', reason);
    // Don't fail tests due to unhandled promises in test environment
  });

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_APP_ENV = 'test';
  process.env.REACT_APP_ENV = 'test';

  // Mock environment variables for consistent testing
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.VITE_POSTHOG_KEY = 'test-posthog-key';
  process.env.VITE_SENTRY_DSN = 'https://test@sentry.io/test';
  process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';

  // Performance optimizations
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';

  // Set timezone for consistent date testing
  process.env.TZ = 'UTC';

  // Enhanced console configuration for better test output
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Suppress known React warnings in tests
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress React warnings that are expected in tests
      if (
        message.includes('Warning: ReactDOM.render is deprecated') ||
        message.includes('Warning: validateDOMNesting') ||
        message.includes('act(') ||
        message.includes('Warning: An invalid form control')
      ) {
        return;
      }
    }
    originalConsoleError.apply(console, args);
  };

  console.log('🧪 Global test setup complete');
  console.log(`📊 Running tests with ${process.env.JEST_WORKER_ID} workers`);
  console.log(`🌍 Test environment: ${process.env.NODE_ENV}`);
  console.log(`⏰ Timezone: ${process.env.TZ}`);

  return Promise.resolve();
}
