import { expect, test, jest } from '@jest/globals';
/**
 * Unit tests for useFormAnnouncements hook
 * Tests form validation and error announcements for accessibility
 */

import { renderHook, act } from '@testing-library/react';
import { useFormAnnouncements } from '../useFormAnnouncements';

// Mock screen reader announcement service
const mockAnnouncementService = {
  announce: jest.fn(),
  announcePolite: jest.fn(),
  announceAssertive: jest.fn(),
  clearQueue: jest.fn(),
  setEnabled: jest.fn(),
  isEnabled: jest.fn((
) => true),
};

jest.mock('../../services/accessibility-announcement', (
) => ({
  __esModule: true,
  default: {
    getInstance: (
) => mockAnnouncementService,
  },
}));

// Mock i18n hook for form translations
const mockT = jest.fn((key, options
) => {
  const translations: Record<string, string> = {
    'form.validation.required': 'Field {{field}} is required',
    'form.validation.email': 'Please enter a valid email address',
    'form.validation.password': 'Password must be at least {{minLength}} characters',
    'form.validation.match': 'Passwords do not match',
    'form.error.summary': '{{count}} validation errors found',
    'form.success.submit': 'Form submitted successfully',
    'form.error.submit': 'Form submission failed: {{error}}',
    'form.field.changed': '{{field}} field updated',
    'form.progress.step': 'Step {{current}} of {{total}}: {{stepName}}',
    'form.autosave.saved': 'Changes saved automatically',
  };

  let translation = translations[key] || key;

  if (options) {
    Object.keys(options).forEach(optionKey => {
      translation = translation.replace(`{{${optionKey}}}`, options[optionKey]);
    });
  }

  return translation;
});

jest.mock('../useI18n', (
) => ({
  useFormI18n: (
) => ({ t: mockT }),
}));

describe('useFormAnnouncements', (
) => {
  beforeEach((
) => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    expect(result.current.isEnabled).toBe(true);
    expect(typeof result.current.announceValidationError).toBe('function');
    expect(typeof result.current.announceFormSuccess).toBe('function');
    expect(typeof result.current.announceFieldChange).toBe('function');
  });

  it('should announce single validation error', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceValidationError('email', 'required');
    });

    expect(mockT).toHaveBeenCalledWith('form.validation.required', {
      field: 'email',
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Field email is required'
    );
  });

  it('should announce email validation error', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceValidationError('email', 'email');
    });

    expect(mockT).toHaveBeenCalledWith('form.validation.email');
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Please enter a valid email address'
    );
  });

  it('should announce password validation error with parameters', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceValidationError('password', 'password', {
        minLength: 8,
      });
    });

    expect(mockT).toHaveBeenCalledWith('form.validation.password', {
      minLength: 8,
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Password must be at least 8 characters'
    );
  });

  it('should announce multiple validation errors with summary', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    const errors = [
      { field: 'email', type: 'required' },
      { field: 'password', type: 'password', params: { minLength: 8 } },
      { field: 'confirmPassword', type: 'match' },
    ];

    await act(async (
) => {
      await result.current.announceValidationErrors(errors);
    });

    expect(mockT).toHaveBeenCalledWith('form.error.summary', {
      count: 3,
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      '3 validation errors found'
    );

    // Should announce each individual error
    expect(mockT).toHaveBeenCalledWith('form.validation.required', { field: 'email' });
    expect(mockT).toHaveBeenCalledWith('form.validation.password', { minLength: 8 });
    expect(mockT).toHaveBeenCalledWith('form.validation.match');
  });

  it('should announce successful form submission', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceFormSuccess('registration');
    });

    expect(mockT).toHaveBeenCalledWith('form.success.submit');
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Form submitted successfully'
    );
  });

  it('should announce form submission error', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceFormError('Network connection failed');
    });

    expect(mockT).toHaveBeenCalledWith('form.error.submit', {
      error: 'Network connection failed',
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Form submission failed: Network connection failed'
    );
  });

  it('should announce field changes', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceFieldChange('username', 'john_doe');
    });

    expect(mockT).toHaveBeenCalledWith('form.field.changed', {
      field: 'username',
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'username field updated'
    );
  });

  it('should announce form progress steps', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceFormProgress(2, 4, 'Account Details');
    });

    expect(mockT).toHaveBeenCalledWith('form.progress.step', {
      current: 2,
      total: 4,
      stepName: 'Account Details',
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Step 2 of 4: Account Details'
    );
  });

  it('should announce autosave events', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceAutosave();
    });

    expect(mockT).toHaveBeenCalledWith('form.autosave.saved');
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Changes saved automatically'
    );
  });

  it('should handle real-time validation announcements', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    // Test debounced announcements
    await act(async (
) => {
      result.current.announceRealTimeValidation('email', 'valid');
      result.current.announceRealTimeValidation('email', 'invalid');
      result.current.announceRealTimeValidation('email', 'valid');
    });

    // Should only announce the final state after debounce
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledTimes(1);
  });

  it('should manage announcement priorities correctly', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    // Critical errors should use assertive
    await act(async (
) => {
      await result.current.announceValidationError('required_field', 'required');
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalled();

    // Success messages should use polite
    await act(async (
) => {
      await result.current.announceFormSuccess();
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalled();
  });

  it('should respect enabled/disabled state', async (
) => {
    mockAnnouncementService.isEnabled.mockReturnValue(false);

    const { result } = renderHook((
) => useFormAnnouncements());

    expect(result.current.isEnabled).toBe(false);

    await act(async (
) => {
      await result.current.announceValidationError('email', 'required');
    });

    // Should not announce when disabled
    expect(mockAnnouncementService.announceAssertive).not.toHaveBeenCalled();
  });

  it('should handle complex form validation scenarios', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    const complexValidation = {
      field: 'creditCard',
      type: 'custom',
      message: 'Credit card number is invalid',
      suggestions: ['Check for typos', 'Ensure all digits are entered'],
    };

    await act(async (
) => {
      await result.current.announceComplexValidation(complexValidation);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Credit card number is invalid. Check for typos. Ensure all digits are entered'
    );
  });

  it('should handle form field focus announcements', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceFieldFocus('password', {
        label: 'Password',
        requirements: 'Must be at least 8 characters',
        required: true,
      });
    });

    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      'Password field focused. Required field. Must be at least 8 characters'
    );
  });

  it('should clear form announcements queue', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      result.current.clearQueue();
    });

    expect(mockAnnouncementService.clearQueue).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async (
) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAnnouncementService.announceAssertive.mockRejectedValue(
      new Error('Announcement failed')
    );

    const { result } = renderHook((
) => useFormAnnouncements());

    await act(async (
) => {
      await result.current.announceValidationError('email', 'required');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to announce form validation error:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should batch form announcements efficiently', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    const formState = {
      errors: [
        { field: 'email', type: 'required' },
        { field: 'phone', type: 'format' },
      ],
      success: false,
      submitting: false,
      step: 1,
      totalSteps: 3,
    };

    await act(async (
) => {
      await result.current.announceFormState(formState);
    });

    // Should batch announcements efficiently
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalled();
    expect(mockT).toHaveBeenCalledWith('form.error.summary', { count: 2 });
  });

  it('should handle dynamic form validation messages', async (
) => {
    const { result } = renderHook((
) => useFormAnnouncements());

    const dynamicValidation = {
      field: 'username',
      type: 'availability',
      message: 'Username "johndoe" is already taken',
      suggestions: ['Try "johndoe2" or "john_doe"'],
    };

    await act(async (
) => {
      await result.current.announceDynamicValidation(dynamicValidation);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      'Username "johndoe" is already taken. Try "johndoe2" or "john_doe"'
    );
  });

  it('should support conditional announcement based on user preferences', async (
) => {
    const { result } = renderHook((
) =>
      useFormAnnouncements({
        verbosity: 'minimal', // Only critical announcements
        realTimeValidation: false,
      })
    );

    // Should not announce field changes in minimal mode
    await act(async (
) => {
      await result.current.announceFieldChange('username', 'test');
    });

    expect(mockAnnouncementService.announcePolite).not.toHaveBeenCalled();

    // But should announce validation errors
    await act(async (
) => {
      await result.current.announceValidationError('email', 'required');
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalled();
  });
});
