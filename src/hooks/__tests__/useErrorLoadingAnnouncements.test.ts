import { expect, test, jest } from "@jest/globals";
/**
 * Unit tests for useErrorLoadingAnnouncements hook
 * Tests error and loading state announcements for accessibility
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorLoadingAnnouncements } from '../useErrorLoadingAnnouncements';

// Mock screen reader announcement service
const mockAnnouncementService = {
  announce: jest.fn(),
  announcePolite: jest.fn(),
  announceAssertive: jest.fn(),
  clearQueue: jest.fn(),
  setEnabled: jest.fn(),
  isEnabled: jest.fn(() => true)
};

jest.mock('../../services/accessibility-announcement', () => ({
  __esModule: true,
  default: {
    getInstance: () => mockAnnouncementService
  }
}));

// Mock i18n hook for error/loading translations
const mockT = jest.fn((key, options) => {
  const translations: Record<string, string> = {
    'error.general': 'An error occurred',
    'error.network': 'Network connection failed',
    'error.authentication': 'Authentication failed',
    'error.permission': 'Permission denied',
    'error.not_found': 'Resource not found',
    'error.server': 'Server error occurred',
    'error.validation': 'Validation failed: {{details}}',
    'loading.started': 'Loading started',
    'loading.progress': 'Loading {{progress}}% complete',
    'loading.completed': 'Loading completed',
    'loading.failed': 'Loading failed: {{error}}',
    'retry.attempting': 'Attempting retry {{attempt}} of {{maxAttempts}}',
    'retry.succeeded': 'Operation succeeded after retry',
    'retry.failed': 'All retry attempts failed'
  };

  let translation = translations[key] || key;

  if (options) {
    Object.keys(options).forEach(optionKey => {
      translation = translation.replace(`{{${optionKey}}}`, options[optionKey]);
    });
  }

  return translation;
});

jest.mock('../useI18n', () => ({
  useErrorI18n: () => ({ t: mockT })
}));

describe('useErrorLoadingAnnouncements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    expect(result.current.isEnabled).toBe(true);
    expect(typeof result.current.announceError).toBe('function');
    expect(typeof result.current.announceLoading).toBe('function');
    expect(typeof result.current.announceSuccess).toBe('function');
  });

  it('should announce general errors', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceError('general');
    });

    expect(mockT).toHaveBeenCalledWith('error.general');
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'An error occurred'
    );
  });

  it('should announce network errors', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceError('network');
    });

    expect(mockT).toHaveBeenCalledWith('error.network');
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Network connection failed'
    );
  });

  it('should announce authentication errors', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceError('authentication');
    });

    expect(mockT).toHaveBeenCalledWith('error.authentication');
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Authentication failed'
    );
  });

  it('should announce custom error messages', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const customError = {
      type: 'custom',
      message: 'Unable to save your settings. Please try again.'
    };

    await act(async () => {
      await result.current.announceCustomError(customError.message);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Unable to save your settings. Please try again.'
    );
  });

  it('should announce validation errors with details', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceError('validation', { details: 'Email format is invalid' });
    });

    expect(mockT).toHaveBeenCalledWith('error.validation', {
      details: 'Email format is invalid'
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Validation failed: Email format is invalid'
    );
  });

  it('should announce loading states', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceLoading('started');
    });

    expect(mockT).toHaveBeenCalledWith('loading.started');
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Loading started'
    );
  });

  it('should announce loading progress', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceLoadingProgress(75);
    });

    expect(mockT).toHaveBeenCalledWith('loading.progress', {
      progress: 75
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Loading 75% complete'
    );
  });

  it('should announce loading completion', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceLoading('completed');
    });

    expect(mockT).toHaveBeenCalledWith('loading.completed');
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Loading completed'
    );
  });

  it('should announce loading failures', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceLoadingFailed('Connection timeout');
    });

    expect(mockT).toHaveBeenCalledWith('loading.failed', {
      error: 'Connection timeout'
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Loading failed: Connection timeout'
    );
  });

  it('should announce retry attempts', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceRetry(2, 3);
    });

    expect(mockT).toHaveBeenCalledWith('retry.attempting', {
      attempt: 2,
      maxAttempts: 3
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Attempting retry 2 of 3'
    );
  });

  it('should announce successful retry', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceRetrySuccess();
    });

    expect(mockT).toHaveBeenCalledWith('retry.succeeded');
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Operation succeeded after retry'
    );
  });

  it('should announce failed retries', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceRetryFailed();
    });

    expect(mockT).toHaveBeenCalledWith('retry.failed');
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'All retry attempts failed'
    );
  });

  it('should handle error objects with proper extraction', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const errorObj = new Error('Network request failed');

    await act(async () => {
      await result.current.announceErrorObject(errorObj);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Network request failed'
    );
  });

  it('should handle API error responses', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const apiError = {
      status: 404,
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    };

    await act(async () => {
      await result.current.announceApiError(apiError);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'User not found'
    );
  });

  it('should respect priority levels for announcements', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    // Critical errors should use assertive
    await act(async () => {
      await result.current.announceError('authentication');
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalled();

    // Loading states should use polite
    await act(async () => {
      await result.current.announceLoading('started');
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalled();
  });

  it('should debounce rapid loading progress updates', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      result.current.announceLoadingProgress(10);
      result.current.announceLoadingProgress(20);
      result.current.announceLoadingProgress(30);
      result.current.announceLoadingProgress(40);
    });

    // Should only announce the final progress after debounce
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledTimes(1);
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Loading 40% complete'
    );
  });

  it('should respect enabled/disabled state', async () => {
    mockAnnouncementService.isEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    expect(result.current.isEnabled).toBe(false);

    await act(async () => {
      await result.current.announceError('general');
    });

    expect(mockAnnouncementService.announceAssertive).not.toHaveBeenCalled();
  });

  it('should handle complex error scenarios', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const complexError = {
      type: 'multi-step',
      step: 'payment',
      errors: [
        'Credit card expired',
        'Billing address invalid'
      ],
      canRetry: true
    };

    await act(async () => {
      await result.current.announceComplexError(complexError);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Payment failed: Credit card expired, Billing address invalid. You can try again.'
    );
  });

  it('should handle loading timeouts', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceTimeout(30);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Operation timed out after 30 seconds'
    );
  });

  it('should clear announcement queue', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      result.current.clearQueue();
    });

    expect(mockAnnouncementService.clearQueue).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in announcement service gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAnnouncementService.announceAssertive.mockRejectedValue(new Error('Announcement failed'));

    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    await act(async () => {
      await result.current.announceError('general');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to announce error:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should support contextual error announcements', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const context = {
      feature: 'alarm_creation',
      action: 'save',
      userLevel: 'beginner'
    };

    await act(async () => {
      await result.current.announceContextualError('validation', context, 'Time format is invalid');
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Alarm creation error: Time format is invalid. Check the help section for time format examples.'
    );
  });

  it('should handle progressive loading announcements', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const stages = [
      { name: 'Authenticating', progress: 25 },
      { name: 'Loading data', progress: 50 },
      { name: 'Rendering', progress: 75 },
      { name: 'Complete', progress: 100 }
    ];

    for (const stage of stages) {
      await act(async () => {
        await result.current.announceLoadingStage(stage.name, stage.progress);
      });
    }

    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Complete stage: 100% complete'
    );
  });

  it('should support error recovery suggestions', async () => {
    const { result } = renderHook(() => useErrorLoadingAnnouncements());

    const errorWithSuggestion = {
      type: 'network',
      message: 'Connection failed',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem persists'
      ]
    };

    await act(async () => {
      await result.current.announceErrorWithSuggestions(errorWithSuggestion);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Connection failed. Suggestions: Check your internet connection, Try refreshing the page, Contact support if the problem persists'
    );
  });
});