interface ErrorContext {
  context?: string;
  metadata?: Record<string, unknown>;
}

class ErrorHandlerService {
  handleError(error: Error, context: ErrorContext = {}): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    console.error(`[ERROR] ${context.context || 'Unknown'}:`, {
      id: errorId,
      message: error.message,
      stack: error.stack,
      context
    });

    // Store in localStorage for later analysis
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push({
        id: errorId,
        message: error.message,
        context,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 errors
      localStorage.setItem('app_errors', JSON.stringify(errors.slice(-10)));
    } catch (e) {
      console.warn('Could not store error:', e);
    }

    return errorId;
  }

  wrapAsync<T>(promise: Promise<T>, context: ErrorContext = {}): Promise<T> {
    return promise.catch((error) => {
      this.handleError(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    });
  }
}

export const ErrorHandler = new ErrorHandlerService();