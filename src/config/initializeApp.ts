import initI18n from './i18n';
import { ErrorHandler } from '../services/error-handler';

/**
 * Initialize the app with all required services and configurations
 */
import { ErrorHandler } from '../services/error-handler';
export const initializeApp = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing Relife Alarms...');

    // Initialize i18n first (required for all other services)
    console.log('🌍 Initializing internationalization...');
    await initI18n();
    console.log('✅ i18n initialized successfully');

    // Initialize other services here if needed
    // await initializeAnalytics();
    // await initializePerformanceMonitoring();

    console.log('✅ App initialization completed successfully');
  } catch (_error) {
    console.error('❌ App initialization failed:', _error);

    // Log the error but don't prevent app startup
    ErrorHandler.handleError(
      error instanceof Error ? _error : new Error(String(_error)),
      'App initialization failed',
      { context: 'app_initialization', critical: false }
    );

    // For critical failures, you might want to show an error screen
    // but for i18n failures, we can continue with English
    if (error instanceof Error && _error.message.includes('i18n')) {
      console.warn(
        'Continuing with default language due to i18n initialization failure'
      );
    }
  }
};
