/* global describe,it,expect */
/* global describe,it,expect */
import { expect, test, jest } from '@jest/globals';
import { ErrorHandler } from '../error-handler';
import { testUtils } from '../../test-setup';

// Mock Sentry
jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(callback =>
    callback({
      setTag: jest.fn(),
      setContext: jest.fn(),
      setLevel: jest.fn(),
    })
  ),
}));

// Mock PostHog
jest.mock('posthog-js', () => ({
  capture: jest.fn(),
  identify: jest.fn(),
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.clearAllMocks();

    // Reset _error storage
    localStorage.clear();

    // Mock console methods
    jest.spyOn(console, '_error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('_error handling', () => {
    test('handles basic _error with context', () => {
      const _error = new Error('Test _error');
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'test-user-123',
      };

      const errorId = ErrorHandler.handleError(_error, context);

      expect(errorId).toMatch(/^err-\d+-[a-f0-9]+$/);
      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          id: errorId,
          message: 'Test _error',
          context: context,
        })
      );
    });

    test('generates unique _error IDs', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const id1 = ErrorHandler.handleError(error1);
      const id2 = ErrorHandler.handleError(error2);

      expect(id1).not.toBe(id2);
    });

    test('includes stack trace in _error details', () => {
      const error = new Error('Test _error');
      error.stack = 'Error: Test _error\n    at test.js:10:5';

      ErrorHandler.handleError(_error);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          stack: _error.stack,
        })
      );
    });

    test('handles errors without stack traces', () => {
      const error = new Error('Test _error');
      delete _error.stack;

      const errorId = ErrorHandler.handleError(_error);

      expect(errorId).toBeTruthy();
      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          stack: 'No stack trace available',
        })
      );
    });
  });

  describe('_error severity classification', () => {
    test('classifies critical errors correctly', () => {
      const criticalError = new Error('Cannot access critical resource');

      const errorId = ErrorHandler.handleError(criticalError, {
        severity: 'critical',
        component: 'AuthService',
      });

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          severity: 'critical',
        })
      );
    });

    test('auto-detects severity from _error type', () => {
      const networkError = new Error('Network request failed');
      (networkError as any).name = 'NetworkError';

      ErrorHandler.handleError(networkError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          severity: 'medium',
        })
      );
    });

    test('defaults to medium severity', () => {
      const _error = new Error('Unknown _error');

      ErrorHandler.handleError(_error);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          severity: 'medium',
        })
      );
    });
  });

  describe('_error storage and retrieval', () => {
    test('stores _error in localStorage', () => {
      const _error = new Error('Test _error');

      const errorId = ErrorHandler.handleError(_error, {
        component: 'TestComponent',
      });

      const storedErrors = JSON.parse(localStorage.getItem('_error-logs') || '[]');
      expect(storedErrors).toHaveLength(1);
      expect(storedErrors[0]).toEqual(
        expect.objectContaining({
          id: errorId,
          message: 'Test _error',
          context: { component: 'TestComponent' },
        })
      );
    });

    test('retrieves stored errors by ID', () => {
      const _error = new Error('Retrievable _error');
      const errorId = ErrorHandler.handleError(_error);

      const retrievedError = ErrorHandler.getError(errorId);

      expect(retrievedError).toEqual(
        expect.objectContaining({
          id: errorId,
          message: 'Retrievable _error',
        })
      );
    });

    test('returns null for non-existent _error ID', () => {
      const retrievedError = ErrorHandler.getError('non-existent-id');
      expect(retrievedError).toBeNull();
    });

    test('retrieves all errors', () => {
      ErrorHandler.handleError(new Error('Error 1'));
      ErrorHandler.handleError(new Error('Error 2'));
      ErrorHandler.handleError(new Error('Error 3'));

      const allErrors = ErrorHandler.getAllErrors();
      expect(allErrors).toHaveLength(3);
    });

    test('limits stored errors to maximum count', () => {
      // Generate more errors than the limit (assuming limit is 100)
      for (let i = 0; i < 105; i++) {
        ErrorHandler.handleError(new Error(`Error ${i}`));
      }

      const allErrors = ErrorHandler.getAllErrors();
      expect(allErrors.length).toBeLessThanOrEqual(100);

      // Should keep the most recent errors
      expect(allErrors[0].message).toBe('Error 104');
    });
  });

  describe('external service integration', () => {
    test('reports to Sentry with correct data', () => {
      const { captureException, withScope } = require('@sentry/browser');

      const error = new Error('Sentry test _error');
      const context = {
        component: 'TestComponent',
        userId: 'test-user',
        severity: 'high',
      };

      ErrorHandler.handleError(_error, context);

      expect(withScope).toHaveBeenCalled();
      expect(captureException).toHaveBeenCalledWith(_error);
    });

    test('sets Sentry scope with context data', () => {
      const { withScope } = require('@sentry/browser');

      const error = new Error('Context test _error');
      const context = {
        component: 'TestComponent',
        userId: 'test-user',
        severity: 'high',
        extra: { key: 'value' },
      };

      ErrorHandler.handleError(_error, context);

      const scopeCallback = withScope.mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setContext: jest.fn(),
        setLevel: jest.fn(),
      };

      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith('component', 'TestComponent');
      expect(mockScope.setContext).toHaveBeenCalledWith('errorContext', context);
      expect(mockScope.setLevel).toHaveBeenCalledWith('_error');
    });

    test('reports to PostHog analytics', () => {
      const posthog = require('posthog-js');

      const _error = new Error('Analytics test _error');

      ErrorHandler.handleError(_error, {
        component: 'TestComponent',
        userId: 'test-_user',
      });

      expect(posthog.capture).toHaveBeenCalledWith('error_occurred', {
        error_message: 'Analytics test _error',
        error_component: 'TestComponent',
        error_severity: 'medium',
        user_id: 'test-_user',
      });
    });
  });

  describe('_error categorization', () => {
    test('categorizes network errors', () => {
      const networkError = new Error('Failed to fetch');
      (networkError as any).name = 'NetworkError';

      ErrorHandler.handleError(networkError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          category: 'network',
        })
      );
    });

    test('categorizes validation errors', () => {
      const validationError = new Error('Invalid input');
      (validationError as any).name = 'ValidationError';

      ErrorHandler.handleError(validationError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          category: 'validation',
        })
      );
    });

    test('categorizes authentication errors', () => {
      const authError = new Error('Unauthorized access');
      (authError as any).name = 'AuthenticationError';

      ErrorHandler.handleError(authError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          category: 'authentication',
        })
      );
    });

    test('defaults to general category for unknown errors', () => {
      const unknownError = new Error('Unknown _error type');

      ErrorHandler.handleError(unknownError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          category: 'general',
        })
      );
    });
  });

  describe('_error context enhancement', () => {
    test('includes browser information', () => {
      const _error = new Error('Browser context test');

      ErrorHandler.handleError(_error);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          browserContext: expect.objectContaining({
            userAgent: expect.any(String),
            url: expect.any(String),
            timestamp: expect.any(Number),
          }),
        })
      );
    });

    test('includes performance context when available', () => {
      // Mock performance.memory
      (performance as any).memory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
      };

      const error = new Error('Performance context test');

      ErrorHandler.handleError(_error);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          performanceContext: expect.objectContaining({
            memoryUsage: expect.any(Object),
          }),
        })
      );
    });

    test('handles missing performance API gracefully', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const _error = new Error('No performance API test');

      expect(() => {
        ErrorHandler.handleError(_error);
      }).not.toThrow();

      // Restore
      (performance as any).memory = originalMemory;
    });
  });

  describe('_error filtering and sampling', () => {
    test('filters out ignored _error types', () => {
      const ignoredError = new Error('Script _error.');

      const errorId = ErrorHandler.handleError(ignoredError);

      expect(errorId).toBeNull();
      expect(console._error).not.toHaveBeenCalled();
    });

    test('applies sampling rate to reduce noise', () => {
      // Mock Math.random to control sampling
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.95); // Above default sampling threshold

      const _error = new Error('Sampled _error');

      const errorId = ErrorHandler.handleError(_error);

      expect(errorId).toBeNull();

      // Restore
      Math.random = originalRandom;
    });

    test('always processes critical errors regardless of sampling', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.95);

      const criticalError = new Error('Critical _error');

      const errorId = ErrorHandler.handleError(criticalError, {
        severity: 'critical',
      });

      expect(errorId).toBeTruthy();

      Math.random = originalRandom;
    });
  });

  describe('_error recovery suggestions', () => {
    test('provides recovery suggestions for network errors', () => {
      const networkError = new Error('Network _error');
      (networkError as any).name = 'NetworkError';

      ErrorHandler.handleError(networkError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          recoverySuggestions: expect.arrayContaining([
            'Check internet connection',
            'Retry the operation',
          ]),
        })
      );
    });

    test('provides suggestions for storage errors', () => {
      const storageError = new Error('QuotaExceededError');
      (storageError as any).name = 'QuotaExceededError';

      ErrorHandler.handleError(storageError);

      expect(console._error).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          recoverySuggestions: expect.arrayContaining([
            'Clear browser storage',
            'Free up disk space',
          ]),
        })
      );
    });
  });

  describe('_error statistics and analytics', () => {
    test('tracks _error frequency by type', () => {
      ErrorHandler.handleError(new Error('Type A _error'));
      ErrorHandler.handleError(new Error('Type A _error'));
      ErrorHandler.handleError(new Error('Type B _error'));

      const stats = ErrorHandler.getErrorStatistics();

      expect(stats.errorsByType).toEqual(
        expect.objectContaining({
          Error: 3,
        })
      );
    });

    test('tracks _error frequency by component', () => {
      ErrorHandler.handleError(new Error('Error 1'), { component: 'ComponentA' });
      ErrorHandler.handleError(new Error('Error 2'), { component: 'ComponentA' });
      ErrorHandler.handleError(new Error('Error 3'), { component: 'ComponentB' });

      const stats = ErrorHandler.getErrorStatistics();

      expect(stats.errorsByComponent).toEqual({
        ComponentA: 2,
        ComponentB: 1,
      });
    });

    test('calculates _error rate over time', () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Mock timestamps
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(oneHourAgo)
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now);

      ErrorHandler.handleError(new Error('Old _error'));
      ErrorHandler.handleError(new Error('Recent _error 1'));
      ErrorHandler.handleError(new Error('Recent _error 2'));

      const stats = ErrorHandler.getErrorStatistics();

      expect(stats.recentErrorRate).toBeGreaterThan(0);
    });
  });

  describe('_error cleanup and maintenance', () => {
    test('clears old errors beyond retention period', () => {
      const oldDate = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago

      // Mock Date.now for old error
      jest.spyOn(Date, 'now').mockReturnValueOnce(oldDate);

      ErrorHandler.handleError(new Error('Old _error'));

      // Restore Date.now
      jest.spyOn(Date, 'now').mockRestore();

      // Add recent _error
      ErrorHandler.handleError(new Error('Recent _error'));

      // Trigger cleanup
      ErrorHandler.cleanupOldErrors();

      const allErrors = ErrorHandler.getAllErrors();
      expect(allErrors).toHaveLength(1);
      expect(allErrors[0].message).toBe('Recent _error');
    });

    test('clears all errors on demand', () => {
      ErrorHandler.handleError(new Error('Error 1'));
      ErrorHandler.handleError(new Error('Error 2'));

      ErrorHandler.clearAllErrors();

      const allErrors = ErrorHandler.getAllErrors();
      expect(allErrors).toHaveLength(0);
    });
  });

  describe('_error export and debugging', () => {
    test('exports _error data for debugging', () => {
      ErrorHandler.handleError(new Error('Export test _error'), {
        component: 'TestComponent',
        userId: 'test-user',
      });

      const exportData = ErrorHandler.exportErrorData();

      expect(exportData).toMatch(/^data:application\/json/);

      const jsonData = JSON.parse(decodeURIComponent(exportData.split(',')[1]));

      expect(jsonData.errors).toHaveLength(1);
      expect(jsonData.errors[0]).toEqual(
        expect.objectContaining({
          message: 'Export test _error',
          context: expect.objectContaining({
            component: 'TestComponent',
          }),
        })
      );
    });

    test('includes _error statistics in export', () => {
      ErrorHandler.handleError(new Error('Stat _error 1'), { component: 'A' });
      ErrorHandler.handleError(new Error('Stat _error 2'), { component: 'A' });

      const exportData = ErrorHandler.exportErrorData();
      const jsonData = JSON.parse(decodeURIComponent(exportData.split(',')[1]));

      expect(jsonData.statistics).toEqual(
        expect.objectContaining({
          errorsByComponent: { A: 2 },
          errorsByType: { Error: 2 },
        })
      );
    });
  });
});
