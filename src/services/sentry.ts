// Sentry Error Tracking Service for Smart Alarm App
// Provides comprehensive error tracking, crash reporting, and performance monitoring

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  debug?: boolean;
  enableTracing?: boolean;
  tracesSampleRate?: number;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  segment?: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  feature?: string;
  metadata?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  fingerprint?: string[];
}

class SentryService {
  private static instance: SentryService;
  private isInitialized = false;
  private config: SentryConfig | null = null;

  private constructor() {}

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  /**
   * Initialize Sentry with comprehensive configuration
   */
  initialize(config: SentryConfig): void {
    if (this.isInitialized) {
      console.warn('Sentry is already initialized');
      return;
    }

    // Don't initialize in test environments
    if (process.env.NODE_ENV === 'test') {
      console.info('Sentry disabled in test environment');
      return;
    }

    this.config = config;

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        debug: config.debug || config.environment === 'development',

        // Integrations for enhanced functionality
        integrations: [
          new BrowserTracing({
            // Capture interactions like clicks, navigation
          }),
        ],

        // Performance monitoring
        tracesSampleRate: config.tracesSampleRate || (
          config.environment === 'production' ? 0.1 : 1.0
        ),

        // Session replay for debugging
        replaysSessionSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,

        // Privacy and data filtering
        beforeSend: (event, hint) => {
          // Apply custom filtering if provided
          if (config.beforeSend) {
            event = config.beforeSend(event);
            if (!event) return null;
          }

          // Filter out sensitive data
          event = this.sanitizeEvent(event);

          // Don't send events in development if debug is off
          if (config.environment === 'development' && !config.debug) {
            console.log('Sentry event (dev mode):', event);
            return null;
          }

          return event;
        },

        // Release tracking
        release: process.env.REACT_APP_VERSION || 'unknown',

        // User context
        initialScope: {
          tags: {
            component: 'smart-alarm-app',
            platform: 'web'
          }
        }
      });

      this.isInitialized = true;
      console.info('Sentry initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set user context for all future events
   */
  setUser(user: UserContext): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      segment: user.segment
    });
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser(): void {
    if (!this.isInitialized) return;

    Sentry.setUser(null);
  }

  /**
   * Capture an error with enhanced context
   */
  captureError(error: Error, context: ErrorContext = {}): string {
    if (!this.isInitialized) {
      console.error('Sentry not initialized, falling back to console:', error);
      return 'sentry-not-initialized';
    }

    return Sentry.withScope(scope => {
      // Set error level
      if (context.level) {
        scope.setLevel(context.level);
      }

      // Add tags for filtering and grouping
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Add contextual information
      scope.setContext('errorContext', {
        component: context.component,
        action: context.action,
        feature: context.feature,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context.metadata
      });

      // Set fingerprint for grouping similar errors
      if (context.fingerprint) {
        scope.setFingerprint(context.fingerprint);
      }

      // Additional context
      scope.addBreadcrumb({
        message: `Error in ${context.component || 'Unknown Component'}`,
        category: 'error',
        level: 'error',
        data: context.metadata
      });

      return Sentry.captureException(error);
    });
  }

  /**
   * Capture a custom message/event
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context: ErrorContext = {}): string {
    if (!this.isInitialized) {
      console.log('Sentry not initialized, message:', message);
      return 'sentry-not-initialized';
    }

    return Sentry.withScope(scope => {
      scope.setLevel(level);

      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      scope.setContext('messageContext', {
        component: context.component,
        action: context.action,
        feature: context.feature,
        ...context.metadata
      });

      return Sentry.captureMessage(message, level);
    });
  }

  /**
   * Add breadcrumb for debugging trail
   */
  addBreadcrumb(message: string, category: string = 'user', data?: Record<string, unknown>): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      timestamp: Date.now() / 1000,
      data
    });
  }

  /**
   * Start a performance span (replaces startTransaction in v8+)
   */
  startSpan(name: string, operation: string = 'navigation'): any {
    if (!this.isInitialized) return null;

    return Sentry.startSpan({
      name,
      op: operation,
      tags: {
        component: 'smart-alarm-app'
      }
    }, () => {});
  }

  /**
   * Legacy method for backwards compatibility
   */
  startTransaction(name: string, operation: string = 'navigation'): any {
    return this.startSpan(name, operation);
  }

  /**
   * Finish a performance transaction (deprecated but kept for compatibility)
   */
  finishTransaction(transaction: any): void {
    // In newer Sentry versions, spans auto-complete
    // This method is kept for backwards compatibility
  }

  /**
   * Capture performance metrics
   */
  capturePerformance(name: string, duration: number, metadata?: Record<string, unknown>): void {
    if (!this.isInitialized) return;

    this.addBreadcrumb(`Performance: ${name}`, 'performance', {
      duration,
      ...metadata
    });
  }

  /**
   * Check if Sentry is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): SentryConfig | null {
    return this.config;
  }

  /**
   * Sanitize event data to remove sensitive information
   */
  private sanitizeEvent(event: Sentry.Event): Sentry.Event {
    // Remove sensitive data from different parts of the event
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
        delete event.request.headers['X-API-Key'];
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string
          .replace(/([?&])(token|key|password|secret)=[^&]*/gi, '$1$2=***');
      }
    }

    // Remove sensitive data from extra context
    if (event.extra) {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
      Object.keys(event.extra).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          if (event.extra) {
            event.extra[key] = '***';
          }
        }
      });
    }

    return event;
  }

  /**
   * Create a wrapped version of a function that captures errors
   */
  wrap<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context: ErrorContext = {}
  ): T {
    if (!this.isInitialized) return fn;

    return ((...args: Parameters<T>) => {
      try {
        return (fn as any)(...args);
      } catch (error) {
        this.captureException(error as Error, context);
        throw error;
      }
    }) as T;
  }

  /**
   * Create an error boundary component
   */
  createErrorBoundary(fallback?: React.ComponentType<any>) {
    return Sentry.withErrorBoundary;
  }
}

// Default configuration for different environments
export const defaultSentryConfigs = {
  development: {
    dsn: process.env.REACT_APP_SENTRY_DSN || '',
    environment: 'development' as const,
    debug: true,
    enableTracing: true,
    tracesSampleRate: 1.0
  },
  staging: {
    dsn: process.env.REACT_APP_SENTRY_DSN || '',
    environment: 'staging' as const,
    debug: false,
    enableTracing: true,
    tracesSampleRate: 0.5
  },
  production: {
    dsn: process.env.REACT_APP_SENTRY_DSN || '',
    environment: 'production' as const,
    debug: false,
    enableTracing: true,
    tracesSampleRate: 0.1
  }
};

// React import for routing instrumentation
import React, { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes
} from 'react-router-dom';

export default SentryService;