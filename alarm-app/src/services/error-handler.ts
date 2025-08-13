interface ErrorContext {
  context?: string;
  metadata?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  userId?: string;
  sessionId?: string;
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

interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{ message: string; count: number }>;
  errorRate: number;
  averageErrorsPerSession: number;
}

class ErrorHandlerService {
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private rateLimitWindow = 60000; // 1 minute
  private maxErrorsPerWindow = 10;
  private errorQueue: ErrorEntry[] = [];
  private batchSize = 5;
  private batchTimeout = 10000; // 10 seconds
  private batchTimer?: number;
  
  constructor() {
    this.startBatchProcessing();
    this.setupGlobalErrorHandlers();
  }

  handleError(error: Error, message?: string, context: ErrorContext = {}): string {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error, context);
    const category = this.categorizeError(error, context);
    const fingerprint = this.generateFingerprint(error, context);
    
    // Rate limiting check
    if (this.isRateLimited(fingerprint)) {
      console.warn(`[ERROR-HANDLER] Rate limited error: ${fingerprint}`);
      return errorId;
    }
    
    const errorEntry: ErrorEntry = {
      id: errorId,
      message: message || error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      severity,
      category,
      fingerprint,
      count: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false
    };
    
    // Log to console with appropriate level
    this.logToConsole(errorEntry);
    
    // Store locally with deduplication
    this.storeErrorLocally(errorEntry);
    
    // Add to batch queue for remote reporting
    this.addToBatchQueue(errorEntry);
    
    // Trigger immediate processing for critical errors
    if (severity === 'critical') {
      this.processBatch();
    }
    
    return errorId;
  }
  
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    if (context.severity) {
      return context.severity;
    }
    
    // Critical errors
    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Network error') ||
      context.context?.includes('alarm_trigger') ||
      context.context?.includes('authentication')
    ) {
      return 'critical';
    }
    
    // High severity errors
    if (
      error.message.includes('TypeError') ||
      error.message.includes('ReferenceError') ||
      context.context?.includes('service_worker') ||
      context.context?.includes('storage')
    ) {
      return 'high';
    }
    
    // Medium severity errors
    if (
      error.message.includes('validation') ||
      error.message.includes('permission') ||
      context.context?.includes('ui')
    ) {
      return 'medium';
    }
    
    return 'low';
  }
  
  private categorizeError(error: Error, context: ErrorContext): ErrorCategory {
    const message = error.message.toLowerCase();
    const contextStr = context.context?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    
    if (contextStr.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
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
    
    if (contextStr.includes('render') || contextStr.includes('component') || contextStr.includes('ui')) {
      return 'ui_render';
    }
    
    if (contextStr.includes('alarm') || contextStr.includes('schedule')) {
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
    const contextStr = context.context || '';
    
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
  
  private logToConsole(errorEntry: ErrorEntry): void {
    const logData = {
      id: errorEntry.id,
      message: errorEntry.message,
      category: errorEntry.category,
      severity: errorEntry.severity,
      context: errorEntry.context,
      stack: errorEntry.stack
    };
    
    switch (errorEntry.severity) {
      case 'critical':
        console.error(`🚨 [CRITICAL ERROR] ${errorEntry.category.toUpperCase()}:`, logData);
        break;
      case 'high':
        console.error(`⚠️ [HIGH ERROR] ${errorEntry.category.toUpperCase()}:`, logData);
        break;
      case 'medium':
        console.warn(`⚡ [MEDIUM ERROR] ${errorEntry.category.toUpperCase()}:`, logData);
        break;
      case 'low':
        console.info(`ℹ️ [LOW ERROR] ${errorEntry.category.toUpperCase()}:`, logData);
        break;
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
      
      localStorage.setItem('app_errors_v2', JSON.stringify(sortedErrors));
    } catch (e) {
      console.warn('Could not store error locally:', e);
    }
  }
  
  private addToBatchQueue(error: ErrorEntry): void {
    this.errorQueue.push(error);
    
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
    
    // Send to remote error reporting service
    this.sendToRemoteService(batch).catch(error => {
      console.warn('Failed to send error batch to remote service:', error);
      // Re-queue errors for retry (with exponential backoff)
      setTimeout(() => {
        this.errorQueue.unshift(...batch);
      }, 5000);
    });
  }
  
  private async sendToRemoteService(errors: ErrorEntry[]): Promise<void> {
    // This would typically send to a service like Sentry, LogRocket, etc.
    // For now, we'll simulate the API call
    
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }
    
    const payload = {
      errors,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };
    
    // Simulate API call - replace with actual endpoint
    console.log('🔄 Sending error batch to remote service:', payload);
    
    // If using sendBeacon for reliability during page unload
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/errors', JSON.stringify(payload));
    } else {
      // Fallback to fetch
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
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
  
  // Public API methods
  getStoredErrors(): ErrorEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_errors_v2') || '[]');
    } catch {
      return [];
    }
  }
  
  clearStoredErrors(): void {
    localStorage.removeItem('app_errors_v2');
    this.errorQueue = [];
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
  
  resolveError(errorId: string): void {
    const errors = this.getStoredErrors();
    const errorIndex = errors.findIndex(e => e.id === errorId);
    
    if (errorIndex !== -1) {
      errors[errorIndex].resolved = true;
      localStorage.setItem('app_errors_v2', JSON.stringify(errors));
    }
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-handler-session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('error-handler-session', sessionId);
    }
    return sessionId;
  }
  
  private getUserId(): string | undefined {
    // Try to get user ID from auth state or localStorage
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
    const count = localStorage.getItem('error-handler-session-count');
    return count ? parseInt(count, 10) : 1;
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