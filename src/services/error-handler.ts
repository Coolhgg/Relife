// Enhanced Error Handler with Sentry and Analytics Integration
import SentryService from './sentry';
import AnalyticsService, { ANALYTICS_EVENTS } from './analytics';

export interface ErrorContext {
  context?: string;
  component?: string;
  componentStack?: string;
  action?: string;
  feature?: string;
  metadata?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: Record<string, string>;
  fingerprint?: string[];
  userId?: string;
  sessionId?: string;
  suppressAnalytics?: boolean;
  suppressSentry?: boolean;
}

interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: ErrorCategory;
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  userAgent: string;
  url: string;
  resolved: boolean;
}

type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'validation'
  | 'permission'
  | 'storage'
  | 'service_worker'
  | 'ui_render'
  | 'alarm_logic'
  | 'voice_synthesis'
  | 'notification'
  | 'unknown';

export interface ErrorMetrics {
  errorRate: number;
  lastErrorTime: number;
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
}

interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{ message: string; count: number }>;
  errorRate: number;
  averageErrorsPerSession: number;
}

class ErrorHandlerService {
  private sentryService: SentryService;
  private analyticsService: AnalyticsService;
  private errorMetrics: ErrorMetrics;
  private errorQueue: Array<{error: Error; context: ErrorContext; timestamp: number}> = [];
  private maxQueueSize = 50;
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private rateLimitWindow = 60000; // 1 minute
  private maxErrorsPerWindow = 10;
  private batchSize = 5;
  private batchTimeout = 10000; // 10 seconds
  private batchTimer?: number;

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

    this.startBatchProcessing();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Enhanced error handling with Sentry and Analytics integration
   */
  handleError(error: Error, message?: string, context: ErrorContext = {}): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = Date.now();
    const severity = context.severity || this.determineSeverity(error, context);
    const category = this.categorizeError(error, context);
    const fingerprint = this.generateFingerprint(error, context);

    // Rate limiting check
    if (this.isRateLimited(fingerprint)) {
      console.warn(`[ERROR-HANDLER] Rate limited error: ${fingerprint}`);
      return errorId;
    }

    // Update metrics
    this.updateErrorMetrics(error, context);

    // Enhanced console logging
    const logLevel = context.level || 'error';
    const logData = {
      errorId,
      message: message || error.message,
      stack: error.stack,
      context,
      timestamp: new Date(timestamp).toISOString(),
      severity,
      category
    };

    switch (logLevel) {
      case 'fatal':
      case 'error':
        console.error(`🚨 [${severity?.toUpperCase() || 'ERROR'}] ${category.toUpperCase()}:`, logData);
        break;
      case 'warning':
        console.warn(`⚠️ [WARNING] ${category.toUpperCase()}:`, logData);
        break;
      case 'info':
        console.info(`ℹ️ [INFO] ${category.toUpperCase()}:`, logData);
        break;
      case 'debug':
        console.debug(`🐛 [DEBUG] ${category.toUpperCase()}:`, logData);
        break;
    }

    // Send to Sentry (with enhanced context)
    if (!context.suppressSentry && this.sentryService.isReady()) {
      try {
        const sentryContext = {
          ...context,
          errorId,
          timestamp: new Date(timestamp).toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          category,
          severity
        };

        this.sentryService.captureException(error, {
          component: context.component || 'unknown',
          action: context.action || 'unknown',
          metadata: sentryContext
        });
      } catch (sentryError) {
        console.warn('Failed to send error to Sentry:', sentryError);
      }
    }

    // Send to Analytics (for error tracking and analysis)
    if (!context.suppressAnalytics && this.analyticsService.isReady()) {
      try {
        this.analyticsService.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
          errorId,
          errorType: error.constructor.name,
          errorMessage: error.message,
          component: context.component,
          action: context.action,
          feature: context.feature,
          severity,
          category,
          context: context.context,
          timestamp: new Date(timestamp).toISOString()
        });
      } catch (analyticsError) {
        console.warn('Failed to send error to Analytics:', analyticsError);
      }
    }

    // Store error for local analysis
    const errorEntry: ErrorEntry = {
      id: errorId,
      message: message || error.message,
      stack: error.stack,
      context,
      timestamp: new Date(timestamp).toISOString(),
      severity,
      category,
      fingerprint,
      count: 1,
      firstSeen: new Date(timestamp).toISOString(),
      lastSeen: new Date(timestamp).toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false
    };

    this.storeErrorLocally(errorEntry);
    this.addToBatchQueue(error, context, timestamp);

    // Trigger immediate processing for critical errors
    if (severity === 'critical') {
      this.processBatch();
    }

    return errorId;
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const level = context.level || 'error';

    // Map level to severity if not explicitly provided
    if (level === 'fatal') return 'critical';
    if (level === 'error') {
      // Critical errors
      if (
        error.message.includes('ChunkLoadError') ||
        error.message.includes('Network error') ||
        context.context?.includes('alarm_trigger') ||
        context.context?.includes('authentication')
      ) {
        return 'critical';
      }
      return 'high';
    }
    if (level === 'warning') return 'medium';
    if (level === 'info' || level === 'debug') return 'low';

    return 'medium';
  }

  private categorizeError(error: Error, context: ErrorContext): ErrorCategory {
    const message = error.message.toLowerCase();
    const contextStr = context.context?.toLowerCase() || '';
    const component = context.component?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }

    if (contextStr.includes('auth') || component.includes('auth') || message.includes('unauthorized')) {
      return 'authentication';
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }

    if (message.includes('permission') || message.includes('denied')) {
      return 'permission';
    }

    if (contextStr.includes('storage') || message.includes('localstorage') || message.includes('indexeddb')) {
      return 'storage';
    }

    if (contextStr.includes('service_worker') || contextStr.includes('sw')) {
      return 'service_worker';
    }

    if (contextStr.includes('render') || component.includes('component') || contextStr.includes('ui')) {
      return 'ui_render';
    }

    if (contextStr.includes('alarm') || component.includes('alarm') || contextStr.includes('schedule')) {
      return 'alarm_logic';
    }

    if (contextStr.includes('voice') || contextStr.includes('speech') || contextStr.includes('tts')) {
      return 'voice_synthesis';
    }

    if (contextStr.includes('notification') || contextStr.includes('push')) {
      return 'notification';
    }

    return 'unknown';
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const message = error.message.replace(/\d+/g, 'X'); // Replace numbers
    const stackTrace = error.stack?.split('\n')[0] || '';
    const contextStr = context.context || context.component || '';

    return btoa(`${message}:${stackTrace}:${contextStr}`).substring(0, 20);
  }

  private isRateLimited(fingerprint: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimitMap.get(fingerprint);

    if (!rateLimit || now > rateLimit.resetTime) {
      this.rateLimitMap.set(fingerprint, {
        count: 1,
        resetTime: now + this.rateLimitWindow
      });
      return false;
    }

    if (rateLimit.count >= this.maxErrorsPerWindow) {
      return true;
    }

    rateLimit.count++;
    return false;
  }

  private updateErrorMetrics(error: Error, context: ErrorContext): void {
    const now = Date.now();
    const errorType = error.constructor.name;
    const component = context.component || 'unknown';

    this.errorMetrics.totalErrors++;
    this.errorMetrics.lastErrorTime = now;
    this.errorMetrics.errorsByType[errorType] = (this.errorMetrics.errorsByType[errorType] || 0) + 1;
    this.errorMetrics.errorsByComponent[component] = (this.errorMetrics.errorsByComponent[component] || 0) + 1;

    // Calculate error rate (errors per minute over last hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentErrors = this.errorQueue.filter(e => e.timestamp > oneHourAgo).length;
    this.errorMetrics.errorRate = recentErrors / 60; // errors per minute
  }

  private loadErrorMetrics(): void {
    try {
      const stored = localStorage.getItem('relife_error_metrics');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errorMetrics = { ...this.errorMetrics, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load error metrics from localStorage:', error);
    }
  }

  private saveErrorMetrics(): void {
    try {
      localStorage.setItem('relife_error_metrics', JSON.stringify(this.errorMetrics));
    } catch (error) {
      console.warn('Failed to save error metrics to localStorage:', error);
    }
  }

  private storeErrorLocally(newError: ErrorEntry): void {
    try {
      const existingErrors = this.getStoredErrors();

      // Check for existing error with same fingerprint
      const existingIndex = existingErrors.findIndex(e => e.fingerprint === newError.fingerprint);

      if (existingIndex !== -1) {
        // Update existing error
        const existing = existingErrors[existingIndex];
        existing.count++;
        existing.lastSeen = newError.timestamp;
        existing.context = { ...existing.context, ...newError.context };
      } else {
        // Add new error
        existingErrors.push(newError);
      }

      // Keep only last 50 unique errors
      const sortedErrors = existingErrors
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
        .slice(0, 50);

      localStorage.setItem('relife_errors_v2', JSON.stringify(sortedErrors));
    } catch (e) {
      console.warn('Could not store error locally:', e);
    }
  }

  private addToBatchQueue(error: Error, context: ErrorContext, timestamp: number): void {
    const queueEntry = { error, context, timestamp };
    this.errorQueue.push(queueEntry);

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    if (this.errorQueue.length >= this.batchSize) {
      this.processBatch();
    }
  }

  private startBatchProcessing(): void {
    this.batchTimer = window.setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.processBatch();
      }
    }, this.batchTimeout);
  }

  private processBatch(): void {
    if (this.errorQueue.length === 0) return;

    const batch = this.errorQueue.splice(0, this.batchSize);

    // Send to remote error reporting service if configured
    this.sendToRemoteService(batch).catch(error => {
      console.warn('Failed to send error batch to remote service:', error);
      // Re-queue errors for retry (with exponential backoff)
      setTimeout(() => {
        this.errorQueue.unshift(...batch);
      }, 5000);
    });
  }

  private async sendToRemoteService(errors: Array<{error: Error; context: ErrorContext; timestamp: number}>): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    const payload = {
      errors: errors.map(e => ({
        message: e.error.message,
        stack: e.error.stack,
        context: e.context,
        timestamp: new Date(e.timestamp).toISOString(),
        type: e.error.constructor.name
      })),
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    // Log for debugging - replace with actual remote service in production
    console.log('🔄 Sending error batch to remote service:', payload);

    // Simulate successful send
    return Promise.resolve();
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(event.message || 'Unknown error'),
        'Global error handler',
        {
          context: 'global_error',
          severity: 'high',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      );
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason?.toString() || 'Unhandled promise rejection'),
        'Unhandled promise rejection',
        {
          context: 'unhandled_promise',
          severity: 'high',
          metadata: {
            reason: event.reason
          }
        }
      );
    });

    // Catch resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleError(
          new Error(`Failed to load resource: ${target.tagName}`),
          'Resource loading error',
          {
            context: 'resource_load',
            severity: 'medium',
            metadata: {
              tagName: target.tagName,
              src: (target as any).src || (target as any).href
            }
          }
        );
      }
    }, true);
  }

  // Wrapper methods for common use cases
  wrapAsync<T>(promise: Promise<T>, context: ErrorContext = {}): Promise<T> {
    return promise.catch((error) => {
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Async operation failed',
        context
      );
      throw error;
    });
  }

  wrapFunction<T extends (...args: any[]) => any>(fn: T, context: ErrorContext = {}): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        if (result && typeof result.then === 'function') {
          return this.wrapAsync(result, context);
        }
        return result;
      } catch (error) {
        this.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Function execution failed',
          context
        );
        throw error;
      }
    }) as T;
  }

  // Public API methods
  getStoredErrors(): ErrorEntry[] {
    try {
      return JSON.parse(localStorage.getItem('relife_errors_v2') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredErrors(): void {
    localStorage.removeItem('relife_errors_v2');
    localStorage.removeItem('relife_error_metrics');
    this.errorQueue = [];
    this.errorMetrics = {
      errorRate: 0,
      lastErrorTime: 0,
      totalErrors: 0,
      errorsByType: {},
      errorsByComponent: {}
    };
  }

  getErrorAnalytics(): ErrorAnalytics {
    const errors = this.getStoredErrors();
    const totalErrors = errors.reduce((sum, error) => sum + error.count, 0);

    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + error.count;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + error.count;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(error => ({ message: error.message, count: error.count }));

    const sessionCount = this.getSessionCount();
    const errorRate = totalErrors / Math.max(sessionCount, 1);

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      errorRate,
      averageErrorsPerSession: errorRate
    };
  }

  getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  resolveError(errorId: string): void {
    const errors = this.getStoredErrors();
    const errorIndex = errors.findIndex(e => e.id === errorId);

    if (errorIndex !== -1) {
      errors[errorIndex].resolved = true;
      localStorage.setItem('relife_errors_v2', JSON.stringify(errors));
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('relife-error-session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('relife-error-session', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch {
      // Fallback to anonymous session
    }
    return undefined;
  }

  private getSessionCount(): number {
    const count = localStorage.getItem('relife-error-session-count');
    return count ? parseInt(count, 10) : 1;
  }

  /**
   * Legacy method for backwards compatibility
   * @deprecated Use handleError instead
   */
  logError(error: Error, context: ErrorContext = {}): string {
    return this.handleError(error, undefined, context);
  }

  // Cleanup method
  cleanup(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Process remaining errors
    if (this.errorQueue.length > 0) {
      this.processBatch();
    }

    // Clear rate limiting
    this.rateLimitMap.clear();
  }
}

export const ErrorHandler = new ErrorHandlerService();
export type { ErrorEntry, ErrorContext, ErrorCategory, ErrorAnalytics };