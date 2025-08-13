// Enhanced Error Handler with Sentry and Analytics Integration
import SentryService from './sentry';
import AnalyticsService, { ANALYTICS_EVENTS } from './analytics';

export interface ErrorContext {
  context?: string;
  component?: string;
  action?: string;
  feature?: string;
  metadata?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  fingerprint?: string[];
  userId?: string;
  suppressAnalytics?: boolean;
  suppressSentry?: boolean;
}

export interface ErrorMetrics {
  errorRate: number;
  lastErrorTime: number;
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
}

class ErrorHandlerService {
  private sentryService: SentryService;
  private analyticsService: AnalyticsService;
  private errorMetrics: ErrorMetrics;
  private errorQueue: Array<{error: Error; context: ErrorContext; timestamp: number}> = [];
  private maxQueueSize = 50;

  constructor() {
    this.sentryService = SentryService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
    this.errorMetrics = {
      errorRate: 0,
      lastErrorTime: 0,
      totalErrors: 0,
      errorsByType: {},
      errorsByComponent: {}
    };
    
    // Load existing metrics from localStorage
    this.loadErrorMetrics();
    
    // Set up periodic metrics saving
    setInterval(() => this.saveErrorMetrics(), 30000); // Every 30 seconds
  }

  /**
   * Enhanced error handling with Sentry and Analytics integration
   */
  handleError(error: Error, context: ErrorContext = {}): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = Date.now();
    
    // Update metrics
    this.updateErrorMetrics(error, context);
    
    // Enhanced console logging
    const logLevel = context.level || 'error';
    const logData = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(timestamp).toISOString(),
      component: context.component,
      action: context.action,
      feature: context.feature
    };

    console[logLevel === 'warning' ? 'warn' : 'error'](`[${logLevel.toUpperCase()}] ${context.context || context.component || 'Unknown'}:`, logData);

    // Send to Sentry (unless suppressed)
    if (!context.suppressSentry && this.sentryService.isReady()) {
      try {
        const sentryId = this.sentryService.captureError(error, {
          component: context.component,
          action: context.action,
          feature: context.feature,
          level: context.level,
          metadata: {
            errorId,
            userId: context.userId,
            ...context.metadata
          },
          tags: {
            errorHandler: 'true',
            source: 'error-handler-service',
            ...context.tags
          },
          fingerprint: context.fingerprint
        });
        
        console.debug('Error sent to Sentry:', sentryId);
      } catch (sentryError) {
        console.warn('Failed to send error to Sentry:', sentryError);
      }
    }

    // Send to Analytics (unless suppressed)
    if (!context.suppressAnalytics && this.analyticsService.isReady()) {
      try {
        this.analyticsService.trackError(error, {
          source: 'error-handler',
          category: 'error',
          label: context.context || context.component,
          metadata: {
            errorId,
            component: context.component,
            action: context.action,
            feature: context.feature,
            level: context.level,
            userId: context.userId,
            ...context.metadata
          }
        });
      } catch (analyticsError) {
        console.warn('Failed to send error to Analytics:', analyticsError);
      }
    }

    // Store in localStorage for offline analysis
    this.storeErrorLocally({
      id: errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(timestamp).toISOString()
    });

    // Add to error queue for batch processing
    this.addToErrorQueue(error, context, timestamp);

    return errorId;
  }

  /**
   * Enhanced async wrapper with better error context
   */
  wrapAsync<T>(promise: Promise<T>, context: ErrorContext = {}): Promise<T> {
    return promise.catch((error) => {
      const enhancedContext = {
        ...context,
        action: context.action || 'async_operation',
        metadata: {
          isAsyncError: true,
          promiseType: 'wrapped',
          ...context.metadata
        }
      };
      
      this.handleError(
        error instanceof Error ? error : new Error(String(error)), 
        enhancedContext
      );
      throw error;
    });
  }

  /**
   * Wrap a function with error handling
   */
  wrapFunction<T extends (...args: any[]) => any>(fn: T, context: ErrorContext = {}): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result && typeof result.then === 'function') {
          return this.wrapAsync(result, {
            ...context,
            action: context.action || 'function_execution',
            metadata: {
              functionName: fn.name,
              isAsyncFunction: true,
              ...context.metadata
            }
          });
        }
        
        return result;
      } catch (error) {
        this.handleError(
          error instanceof Error ? error : new Error(String(error)),
          {
            ...context,
            action: context.action || 'function_execution',
            metadata: {
              functionName: fn.name,
              isAsyncFunction: false,
              ...context.metadata
            }
          }
        );
        throw error;
      }
    }) as T;
  }

  /**
   * Handle React component errors
   */
  handleComponentError(error: Error, errorInfo: React.ErrorInfo, component: string): string {
    return this.handleError(error, {
      context: 'react_error_boundary',
      component,
      action: 'component_error',
      level: 'error',
      metadata: {
        componentStack: errorInfo.componentStack,
        isReactError: true
      },
      tags: {
        errorBoundary: 'true',
        component
      }
    });
  }

  /**
   * Handle network/API errors
   */
  handleNetworkError(error: Error, url: string, method: string = 'GET', context: ErrorContext = {}): string {
    return this.handleError(error, {
      ...context,
      context: 'network_error',
      action: 'api_request',
      level: 'error',
      metadata: {
        url,
        method,
        isNetworkError: true,
        ...context.metadata
      },
      tags: {
        network: 'true',
        method: method.toUpperCase(),
        ...context.tags
      }
    });
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: Error, field: string, context: ErrorContext = {}): string {
    return this.handleError(error, {
      ...context,
      context: 'validation_error',
      action: 'validation',
      level: 'warning',
      metadata: {
        field,
        isValidationError: true,
        ...context.metadata
      },
      tags: {
        validation: 'true',
        field,
        ...context.tags
      }
    });
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Get recent errors from queue
   */
  getRecentErrors(limit: number = 10): Array<{error: Error; context: ErrorContext; timestamp: number}> {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Clear error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, userInfo: Record<string, unknown> = {}): void {
    if (this.sentryService.isReady()) {
      this.sentryService.setUser({
        id: userId,
        ...userInfo
      } as any);
    }
    
    if (this.analyticsService.isReady()) {
      this.analyticsService.identify(userId, userInfo as any);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    if (this.sentryService.isReady()) {
      this.sentryService.clearUser();
    }
    
    if (this.analyticsService.isReady()) {
      this.analyticsService.reset();
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string = 'user', data?: Record<string, unknown>): void {
    if (this.sentryService.isReady()) {
      this.sentryService.addBreadcrumb(message, category, data);
    }
  }

  /**
   * Update error metrics
   */
  private updateErrorMetrics(error: Error, context: ErrorContext): void {
    const now = Date.now();
    
    this.errorMetrics.totalErrors++;
    this.errorMetrics.lastErrorTime = now;
    
    // Calculate error rate (errors per minute)
    const windowMs = 60000; // 1 minute
    const recentErrors = this.errorQueue.filter(e => now - e.timestamp < windowMs).length + 1;
    this.errorMetrics.errorRate = recentErrors;
    
    // Track by error type
    const errorType = error.name || 'UnknownError';
    this.errorMetrics.errorsByType[errorType] = (this.errorMetrics.errorsByType[errorType] || 0) + 1;
    
    // Track by component
    if (context.component) {
      this.errorMetrics.errorsByComponent[context.component] = 
        (this.errorMetrics.errorsByComponent[context.component] || 0) + 1;
    }
  }

  /**
   * Store error locally for offline analysis
   */
  private storeErrorLocally(errorData: any): void {
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      localStorage.setItem('app_errors', JSON.stringify(errors.slice(-50)));
    } catch (e) {
      console.warn('Could not store error locally:', e);
    }
  }

  /**
   * Add error to processing queue
   */
  private addToErrorQueue(error: Error, context: ErrorContext, timestamp: number): void {
    this.errorQueue.push({ error, context, timestamp });
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Load error metrics from localStorage
   */
  private loadErrorMetrics(): void {
    try {
      const stored = localStorage.getItem('error_metrics');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errorMetrics = { ...this.errorMetrics, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load error metrics:', e);
    }
  }

  /**
   * Save error metrics to localStorage
   */
  private saveErrorMetrics(): void {
    try {
      localStorage.setItem('error_metrics', JSON.stringify(this.errorMetrics));
    } catch (e) {
      console.warn('Could not save error metrics:', e);
    }
  }
}

// Import React for error info type
import React from 'react';

export const ErrorHandler = new ErrorHandlerService();