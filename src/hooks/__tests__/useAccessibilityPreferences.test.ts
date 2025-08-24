import { expect, test, jest } from '@jest/globals';
/**
 * Unit tests for useAccessibilityPreferences hook
 * Tests accessibility preferences management and state synchronization
 */

import { renderHook, act } from '@testing-library/react';
import { useAccessibilityPreferences } from '../useAccessibilityPreferences';

// Mock the accessibility preferences service
const mockService = {
  getPreferences: jest.fn(),
  getState: jest.fn(),
  subscribe: jest.fn(),
  updatePreferences: jest.fn(),
  resetToDefaults: jest.fn(),
  getInstance: jest.fn(),
};

// Mock module
jest.mock('../../services/accessibility-preferences', () => {
  return {
    __esModule: true,
    default: {
      getInstance: () => mockService,
    },
  };
});

describe('useAccessibilityPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock returns
    mockService.getPreferences.mockReturnValue({
      highContrast: false,
      reducedMotion: false,
      screenReaderSupport: true,
      fontSize: 'medium',
      colorScheme: 'auto',
    });

    mockService.getState.mockReturnValue({
      isHighContrast: false,
      hasReducedMotion: false,
      isScreenReaderActive: false,
      currentFontSize: 16,
      currentColorScheme: 'light',
    });

    mockService.subscribe.mockImplementation(callback => {
      // Return unsubscribe function
      return jest.fn();
    });
  });

  it('should initialize with current preferences and state', () => {
    const { result } = renderHook(() => useAccessibilityPreferences());

    expect(result.current.preferences).toEqual({
      highContrast: false,
      reducedMotion: false,
      screenReaderSupport: true,
      fontSize: 'medium',
      colorScheme: 'auto',
    });

    expect(result.current.state).toEqual({
      isHighContrast: false,
      hasReducedMotion: false,
      isScreenReaderActive: false,
      currentFontSize: 16,
      currentColorScheme: 'light',
    });

    expect(mockService.getPreferences).toHaveBeenCalledTimes(1);
    expect(mockService.getState).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to preference changes on mount', () => {
    renderHook(() => useAccessibilityPreferences());

    expect(mockService.subscribe).toHaveBeenCalledTimes(1);
    expect(typeof mockService.subscribe.mock.calls[0][0]).toBe('function');
  });

  it('should update preferences and state when service notifies changes', () => {
    let subscribeCallback: Function;
    mockService.subscribe.mockImplementation(callback => {
      subscribeCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useAccessibilityPreferences());

    // Simulate service notifying of changes
    const newPreferences = {
      highContrast: true,
      reducedMotion: true,
      screenReaderSupport: true,
      fontSize: 'large',
      colorScheme: 'dark',
    };

    const newState = {
      isHighContrast: true,
      hasReducedMotion: true,
      isScreenReaderActive: true,
      currentFontSize: 18,
      currentColorScheme: 'dark',
    };

    mockService.getState.mockReturnValue(newState);

    act(() => {
      subscribeCallback(newPreferences);
    });

    expect(result.current.preferences).toEqual(newPreferences);
    expect(result.current.state).toEqual(newState);
  });

  it('should update preferences when updatePreferences is called', async () => {
    mockService.updatePreferences.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAccessibilityPreferences());

    const newPreferences = {
      highContrast: true,
      reducedMotion: false,
      screenReaderSupport: true,
      fontSize: 'large',
      colorScheme: 'dark',
    };

    await act(async () => {
      await result.current.updatePreferences(newPreferences);
    });

    expect(mockService.updatePreferences).toHaveBeenCalledWith(newPreferences);
  });

  it('should reset preferences when resetToDefaults is called', async () => {
    mockService.resetToDefaults.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAccessibilityPreferences());

    await act(async () => {
      await result.current.resetToDefaults();
    });

    expect(mockService.resetToDefaults).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in updatePreferences gracefully', async () => {
    const consoleSpy = jest.spyOn(console, '_error').mockImplementation();
    mockService.updatePreferences.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useAccessibilityPreferences());

    await act(async () => {
      await result.current.updatePreferences({
        highContrast: true,
        reducedMotion: false,
        screenReaderSupport: true,
        fontSize: 'medium',
        colorScheme: 'auto',
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update accessibility preferences:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle errors in resetToDefaults gracefully', async () => {
    const consoleSpy = jest.spyOn(console, '_error').mockImplementation();
    mockService.resetToDefaults.mockRejectedValue(new Error('Reset failed'));

    const { result } = renderHook(() => useAccessibilityPreferences());

    await act(async () => {
      await result.current.resetToDefaults();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to reset accessibility preferences:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should unsubscribe when component unmounts', () => {
    const mockUnsubscribe = jest.fn();
    mockService.subscribe.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAccessibilityPreferences());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should provide helper functions for specific preference updates', async () => {
    mockService.updatePreferences.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAccessibilityPreferences());

    // Test high contrast toggle
    await act(async () => {
      await result.current.toggleHighContrast();
    });

    expect(mockService.updatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ highContrast: true })
    );

    // Test reduced motion toggle
    await act(async () => {
      await result.current.toggleReducedMotion();
    });

    expect(mockService.updatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ reducedMotion: true })
    );

    // Test font size update
    await act(async () => {
      await result.current.setFontSize('large');
    });

    expect(mockService.updatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ fontSize: 'large' })
    );
  });

  it('should handle rapid preference updates without race conditions', async () => {
    mockService.updatePreferences.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10))
    );

    const { result } = renderHook(() => useAccessibilityPreferences());

    // Fire multiple updates rapidly
    const promises = [
      result.current.updatePreferences({
        highContrast: true,
        reducedMotion: false,
        screenReaderSupport: true,
        fontSize: 'medium',
        colorScheme: 'auto',
      }),
      result.current.updatePreferences({
        highContrast: false,
        reducedMotion: true,
        screenReaderSupport: true,
        fontSize: 'large',
        colorScheme: 'dark',
      }),
      result.current.updatePreferences({
        highContrast: true,
        reducedMotion: true,
        screenReaderSupport: false,
        fontSize: 'small',
        colorScheme: 'light',
      }),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    // Should have called updatePreferences for each request
    expect(mockService.updatePreferences).toHaveBeenCalledTimes(3);
  });
});
