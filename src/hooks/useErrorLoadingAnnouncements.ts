import { useCallback } from 'react';
import { useScreenReaderAnnouncements } from './useScreenReaderAnnouncements';

export function useErrorLoadingAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Loading state announcements
  const announceLoadingStart = useCallback((operation: string, context?: string) => {
    let message = `Loading ${operation}`;
    if (context) {
      message += ` for ${context}`;
    }
    message += '. Please wait.';
    announce(message, 'polite');
  }, [announce]);

  const announceLoadingComplete = useCallback((operation: string, context?: string, result?: string) => {
    let message = `${operation} loaded successfully`;
    if (context) {
      message += ` for ${context}`;
    }
    if (result) {
      message += `. ${result}`;
    }
    announce(message, 'polite');
  }, [announce]);

  const announceLoadingProgress = useCallback((operation: string, progress: number, total?: number) => {
    let message;
    if (total) {
      message = `Loading ${operation}: ${progress} of ${total} items completed.`;
    } else {
      message = `Loading ${operation}: ${progress}% complete.`;
    }
    announce(message, 'polite');
  }, [announce]);

  // Error announcements
  const announceError = useCallback((error: string, operation?: string, severity: 'warning' | 'error' | 'critical' = 'error') => {
    let message = '';

    switch (severity) {
      case 'warning':
        message = 'Warning: ';
        break;
      case 'error':
        message = 'Error: ';
        break;
      case 'critical':
        message = 'Critical error: ';
        break;
    }

    message += error;

    if (operation) {
      message += ` during ${operation}`;
    }

    announce(message, 'assertive');
  }, [announce]);

  const announceNetworkError = useCallback((operation?: string) => {
    let message = 'Network connection error.';
    if (operation) {
      message += ` Unable to ${operation}.`;
    }
    message += ' Please check your internet connection and try again.';
    announce(message, 'assertive');
  }, [announce]);

  const announceValidationError = useCallback((field: string, errorMessage: string) => {
    announce(`Validation error in ${field}: ${errorMessage}`, 'assertive');
  }, [announce]);

  const announceFormError = useCallback((errors: Record<string, string>) => {
    const errorCount = Object.keys(errors).length;
    const fields = Object.keys(errors).join(', ');

    if (errorCount === 1) {
      const field = Object.keys(errors)[0];
      announce(`Form error in ${field}: ${errors[field]}`, 'assertive');
    } else {
      announce(`Form has ${errorCount} errors in the following fields: ${fields}. Please review and correct.`, 'assertive');
    }
  }, [announce]);

  // Success announcements
  const announceSuccess = useCallback((operation: string, context?: string, details?: string) => {
    let message = `${operation} successful`;
    if (context) {
      message += ` for ${context}`;
    }
    if (details) {
      message += `. ${details}`;
    }
    announce(message, 'polite');
  }, [announce]);

  const announceFormSuccess = useCallback((operation: string, details?: string) => {
    let message = `Form ${operation} successfully`;
    if (details) {
      message += `. ${details}`;
    }
    announce(message, 'polite');
  }, [announce]);

  // Permission and access announcements
  const announcePermissionError = useCallback((permission: string, reason?: string) => {
    let message = `Permission denied for ${permission}.`;
    if (reason) {
      message += ` ${reason}`;
    }
    announce(message, 'assertive');
  }, [announce]);

  const announceAccessError = useCallback((resource: string, reason?: string) => {
    let message = `Cannot access ${resource}.`;
    if (reason) {
      message += ` ${reason}`;
    } else {
      message += ' You may not have the necessary permissions.';
    }
    announce(message, 'assertive');
  }, [announce]);

  // Offline/online status announcements
  const announceOfflineMode = useCallback(() => {
    announce('You are currently offline. Some features may be limited. The app will sync when connection is restored.', 'assertive');
  }, [announce]);

  const announceOnlineMode = useCallback(() => {
    announce('You are back online. Syncing data now.', 'polite');
  }, [announce]);

  const announceDataSync = useCallback((status: 'started' | 'completed' | 'failed', details?: string) => {
    let message = '';

    switch (status) {
      case 'started':
        message = 'Data synchronization started.';
        break;
      case 'completed':
        message = 'Data synchronized successfully.';
        if (details) {
          message += ` ${details}`;
        }
        break;
      case 'failed':
        message = 'Data synchronization failed.';
        if (details) {
          message += ` ${details}`;
        }
        message += ' Will retry automatically.';
        break;
    }

    announce(message, status === 'failed' ? 'assertive' : 'polite');
  }, [announce]);

  // Timeout and retry announcements
  const announceTimeout = useCallback((operation: string) => {
    announce(`${operation} timed out. Please try again. If the problem persists, check your internet connection.`, 'assertive');
  }, [announce]);

  const announceRetry = useCallback((operation: string, attemptNumber: number, maxAttempts: number) => {
    announce(`Retrying ${operation}. Attempt ${attemptNumber} of ${maxAttempts}.`, 'polite');
  }, [announce]);

  const announceMaxRetriesReached = useCallback((operation: string) => {
    announce(`Maximum retry attempts reached for ${operation}. Please try again later or contact support if the problem persists.`, 'assertive');
  }, [announce]);

  // Data state announcements
  const announceDataEmpty = useCallback((dataType: string) => {
    announce(`No ${dataType} available. Try refreshing or adding some content.`, 'polite');
  }, [announce]);

  const announceDataUpdated = useCallback((dataType: string, updateType: 'added' | 'updated' | 'deleted', itemName?: string) => {
    let message = `${dataType} ${updateType}`;
    if (itemName) {
      message += `: ${itemName}`;
    }
    message += ' successfully.';
    announce(message, 'polite');
  }, [announce]);

  // API and service announcements
  const announceApiError = useCallback((endpoint: string, statusCode?: number, statusText?: string) => {
    let message = `API request failed for ${endpoint}.`;
    if (statusCode) {
      message += ` Status: ${statusCode}`;
      if (statusText) {
        message += ` ${statusText}`;
      }
    }
    message += ' Please try again later.';
    announce(message, 'assertive');
  }, [announce]);

  const announceServiceUnavailable = useCallback((serviceName: string) => {
    announce(`${serviceName} is temporarily unavailable. Please try again later.`, 'assertive');
  }, [announce]);

  // File operation announcements
  const announceFileError = useCallback((operation: 'upload' | 'download' | 'delete' | 'read', filename: string, error: string) => {
    announce(`File ${operation} failed for ${filename}: ${error}`, 'assertive');
  }, [announce]);

  const announceFileSuccess = useCallback((operation: 'uploaded' | 'downloaded' | 'deleted' | 'saved', filename: string, details?: string) => {
    let message = `File ${operation} successfully: ${filename}`;
    if (details) {
      message += `. ${details}`;
    }
    announce(message, 'polite');
  }, [announce]);

  // Session and authentication announcements
  const announceSessionExpired = useCallback(() => {
    announce('Your session has expired. Please log in again to continue.', 'assertive');
  }, [announce]);

  const announceAuthenticationRequired = useCallback((action?: string) => {
    let message = 'Authentication required';
    if (action) {
      message += ` to ${action}`;
    }
    message += '. Please log in to continue.';
    announce(message, 'assertive');
  }, [announce]);

  return {
    announceLoadingStart,
    announceLoadingComplete,
    announceLoadingProgress,
    announceError,
    announceNetworkError,
    announceValidationError,
    announceFormError,
    announceSuccess,
    announceFormSuccess,
    announcePermissionError,
    announceAccessError,
    announceOfflineMode,
    announceOnlineMode,
    announceDataSync,
    announceTimeout,
    announceRetry,
    announceMaxRetriesReached,
    announceDataEmpty,
    announceDataUpdated,
    announceApiError,
    announceServiceUnavailable,
    announceFileError,
    announceFileSuccess,
    announceSessionExpired,
    announceAuthenticationRequired
  };
}