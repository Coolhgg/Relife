import { ErrorHandler } from '../error-handler';
import { testUtils } from '../../test-setup';

describe('ErrorHandler', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    // Clear localStorage for each test
    testUtils.mockLocalStorage.clear();
  });

  describe('handleError', () => {
    test('logs error with basic information', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      ErrorHandler.handleError(error, 'Test context');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorHandler]'),
        expect.objectContaining({
          message: 'Test error',
          context: 'Test context'
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('stores error in localStorage', () => {
      const error = new Error('Storage test error');
      
      ErrorHandler.handleError(error, 'Storage test');
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-errors',
        expect.stringContaining('Storage test error')
      );
    });

    test('includes metadata in error log', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Metadata test');
      const metadata = { userId: '123', component: 'AlarmForm' };
      
      ErrorHandler.handleError(error, 'Metadata test', metadata);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('generates unique error IDs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ErrorHandler.handleError(new Error('Error 1'), 'Test 1');
      ErrorHandler.handleError(new Error('Error 2'), 'Test 2');
      
      const call1 = consoleSpy.mock.calls[0][1];
      const call2 = consoleSpy.mock.calls[1][1];
      
      expect(call1.errorId).toBeDefined();
      expect(call2.errorId).toBeDefined();
      expect(call1.errorId).not.toBe(call2.errorId);
      
      consoleSpy.mockRestore();
    });

    test('determines error severity correctly', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // High severity - alarm related
      ErrorHandler.handleError(new Error('Alarm failed'), 'alarm_trigger');
      expect(consoleSpy.mock.calls[0][1].severity).toBe('high');
      
      // Critical severity - contains "critical"
      ErrorHandler.handleError(new Error('Critical system failure'), 'system');
      expect(consoleSpy.mock.calls[1][1].severity).toBe('critical');
      
      // Medium severity - contains "network"
      ErrorHandler.handleError(new Error('Network timeout'), 'api_call');
      expect(consoleSpy.mock.calls[2][1].severity).toBe('medium');
      
      // Low severity - default
      ErrorHandler.handleError(new Error('UI glitch'), 'ui_update');
      expect(consoleSpy.mock.calls[3][1].severity).toBe('low');
      
      consoleSpy.mockRestore();
    });

    test('handles string errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ErrorHandler.handleError('String error message', 'test');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'String error message'
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('handles null/undefined errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ErrorHandler.handleError(null as any, 'null test');
      ErrorHandler.handleError(undefined as any, 'undefined test');
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy.mock.calls[0][1].message).toBe('Unknown error occurred');
      expect(consoleSpy.mock.calls[1][1].message).toBe('Unknown error occurred');
      
      consoleSpy.mockRestore();
    });
  });

  describe('wrapAsync', () => {
    test('wraps async function and handles success', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = ErrorHandler.wrapAsync(successFn, 'test operation');
      
      const result = await wrappedFn();
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
    });

    test('wraps async function and handles errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Async error');
      const failFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = ErrorHandler.wrapAsync(failFn, 'test operation');
      
      await expect(wrappedFn()).rejects.toThrow('Async error');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Async error',
          context: 'test operation'
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('passes arguments to wrapped function', async () => {
      const testFn = jest.fn().mockResolvedValue('result');
      const wrappedFn = ErrorHandler.wrapAsync(testFn, 'test');
      
      await wrappedFn('arg1', 'arg2', 'arg3');
      
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    test('includes additional metadata in error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      const failFn = jest.fn().mockRejectedValue(error);
      const metadata = { operation: 'data-fetch' };
      const wrappedFn = ErrorHandler.wrapAsync(failFn, 'test', metadata);
      
      await expect(wrappedFn()).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getStoredErrors', () => {
    test('returns empty array when no errors stored', () => {
      testUtils.mockLocalStorage.getItem.mockReturnValue(null);
      
      const errors = ErrorHandler.getStoredErrors();
      
      expect(errors).toEqual([]);
    });

    test('returns parsed errors from localStorage', () => {
      const storedErrors = [
        { id: '1', message: 'Error 1', timestamp: '2025-01-01T00:00:00Z' },
        { id: '2', message: 'Error 2', timestamp: '2025-01-01T01:00:00Z' }
      ];
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedErrors));
      
      const errors = ErrorHandler.getStoredErrors();
      
      expect(errors).toEqual(storedErrors);
    });

    test('handles invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      testUtils.mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const errors = ErrorHandler.getStoredErrors();
      
      expect(errors).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse stored errors')
      );
      
      consoleSpy.mockRestore();
    });

    test('limits returned errors to maximum', () => {
      const manyErrors = Array.from({ length: 150 }, (_, i) => ({
        id: `error-${i}`,
        message: `Error ${i}`,
        timestamp: new Date().toISOString()
      }));
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(manyErrors));
      
      const errors = ErrorHandler.getStoredErrors();
      
      expect(errors).toHaveLength(100);
    });
  });

  describe('clearStoredErrors', () => {
    test('removes errors from localStorage', () => {
      ErrorHandler.clearStoredErrors();
      
      expect(testUtils.mockLocalStorage.removeItem).toHaveBeenCalledWith('smart-alarm-errors');
    });
  });

  describe('getErrorStats', () => {
    test('returns correct error statistics', () => {
      const errors = [
        { severity: 'low', timestamp: '2025-01-01T00:00:00Z' },
        { severity: 'medium', timestamp: '2025-01-01T01:00:00Z' },
        { severity: 'high', timestamp: '2025-01-01T02:00:00Z' },
        { severity: 'critical', timestamp: '2025-01-01T03:00:00Z' },
        { severity: 'low', timestamp: '2025-01-01T04:00:00Z' }
      ];
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(errors));
      
      const stats = ErrorHandler.getErrorStats();
      
      expect(stats).toEqual({
        total: 5,
        critical: 1,
        high: 1,
        medium: 1,
        low: 2,
        lastError: '2025-01-01T04:00:00Z'
      });
    });

    test('handles empty error list', () => {
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const stats = ErrorHandler.getErrorStats();
      
      expect(stats).toEqual({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        lastError: null
      });
    });
  });

  describe('error storage management', () => {
    test('maintains maximum number of stored errors', () => {
      // Simulate storing many errors
      const existingErrors = Array.from({ length: 95 }, (_, i) => ({
        id: `existing-${i}`,
        message: `Existing error ${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString()
      }));
      
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingErrors));
      
      // Add 10 more errors
      for (let i = 0; i < 10; i++) {
        ErrorHandler.handleError(new Error(`New error ${i}`), `test-${i}`);
      }
      
      // Check that localStorage.setItem was called and the total doesn't exceed 100
      const lastCall = testUtils.mockLocalStorage.setItem.mock.calls.slice(-1)[0];
      const storedErrors = JSON.parse(lastCall[1]);
      expect(storedErrors.length).toBeLessThanOrEqual(100);
    });

    test('preserves most recent errors when truncating', () => {
      const oldErrors = Array.from({ length: 98 }, (_, i) => ({
        id: `old-${i}`,
        message: `Old error ${i}`,
        timestamp: new Date(Date.now() - (100 - i) * 1000).toISOString()
      }));
      
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldErrors));
      
      ErrorHandler.handleError(new Error('New error 1'), 'test');
      ErrorHandler.handleError(new Error('New error 2'), 'test');
      ErrorHandler.handleError(new Error('New error 3'), 'test');
      
      const lastCall = testUtils.mockLocalStorage.setItem.mock.calls.slice(-1)[0];
      const storedErrors = JSON.parse(lastCall[1]);
      
      expect(storedErrors.length).toBe(100);
      // Most recent error should be included
      expect(storedErrors[storedErrors.length - 1].message).toBe('New error 3');
    });
  });

  describe('error reporting queue', () => {
    test('queues errors for remote reporting when offline', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      ErrorHandler.handleError(new Error('Offline error'), 'test');
      
      // Should store in queue for later
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-error-queue',
        expect.stringContaining('Offline error')
      );
    });

    test('processes error queue when online', () => {
      // Mock online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });
      
      const queuedErrors = [
        { id: '1', message: 'Queued error', timestamp: new Date().toISOString() }
      ];
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedErrors));
      
      ErrorHandler.handleError(new Error('Online error'), 'test');
      
      // Should process queue
      expect(testUtils.mockLocalStorage.removeItem).toHaveBeenCalledWith('smart-alarm-error-queue');
    });
  });
});