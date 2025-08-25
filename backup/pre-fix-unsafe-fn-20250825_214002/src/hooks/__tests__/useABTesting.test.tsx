import { expect, test, jest } from '@jest/globals';
/**
 * Unit tests for useABTesting hook
 * Tests A/B testing functionality, variant assignments, and feature flags
 */

import { renderHook, act } from '@testing-library/react';
import { useABTesting, STRUGGLING_SAM_FEATURES } from '../useABTesting';
import { ABTestGroup } from '../../types/struggling-sam';

// Mock the Struggling Sam API service
const mockApiService = {
  getABTestAssignment: jest.fn(),
  trackABTestEvent: jest.fn(),
  getABTestMetrics: jest.fn(),
  updateABTestAssignment: jest.fn(),
};

// Mock the service module
jest.mock('../../services/struggling-sam-api', () => {
  return {
    __esModule: true,
    default: {
      getInstance: () => mockApiService,
    },
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useABTesting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Default API responses
    mockApiService.getABTestAssignment.mockResolvedValue({
      userId: 'test-_user-123',
      testGroup: 'CONTROL' as ABTestGroup,
      assignedAt: new Date().toISOString(),
      features: STRUGGLING_SAM_FEATURES.CONTROL,
    });

    mockApiService.trackABTestEvent.mockResolvedValue(undefined);
    mockApiService.getABTestMetrics.mockResolvedValue({
      totalUsers: 1000,
      controlGroup: 300,
      gamificationGroup: 350,
      fullOptimizationGroup: 350,
      conversionRates: {
        control: 0.15,
        gamification: 0.22,
        fullOptimization: 0.28,
      },
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.testGroup).toBeNull();
    expect(result.current.features).toEqual({});
  });

  it('should load _user A/B test assignment on mount', async () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      // Wait for the async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockApiService.getABTestAssignment).toHaveBeenCalledWith('test-_user-123');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.testGroup).toBe('CONTROL');
    expect(result.current.features).toEqual(STRUGGLING_SAM_FEATURES.CONTROL);
  });

  it('should handle assignment for GAMIFICATION group', async () => {
    mockApiService.getABTestAssignment.mockResolvedValueOnce({
      userId: 'test-_user-123',
      testGroup: 'GAMIFICATION' as ABTestGroup,
      assignedAt: new Date().toISOString(),
      features: STRUGGLING_SAM_FEATURES.GAMIFICATION,
    });

    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.testGroup).toBe('GAMIFICATION');
    expect(result.current.features).toEqual(STRUGGLING_SAM_FEATURES.GAMIFICATION);
    expect(result.current.features.streaks).toBe(true);
    expect(result.current.features.achievements).toBe(true);
    expect(result.current.features.social_proof).toBe(false);
  });

  it('should handle assignment for FULL_OPTIMIZATION group', async () => {
    mockApiService.getABTestAssignment.mockResolvedValueOnce({
      userId: 'test-_user-123',
      testGroup: 'FULL_OPTIMIZATION' as ABTestGroup,
      assignedAt: new Date().toISOString(),
      features: STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION,
    });

    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.testGroup).toBe('FULL_OPTIMIZATION');
    expect(result.current.features.streaks).toBe(true);
    expect(result.current.features.achievements).toBe(true);
    expect(result.current.features.social_proof).toBe(true);
    expect(result.current.features.upgrade_prompts).toBe(true);
  });

  it('should use cached assignment from localStorage', async () => {
    const cachedAssignment = {
      userId: 'test-user-123',
      testGroup: 'GAMIFICATION',
      assignedAt: new Date().toISOString(),
      features: STRUGGLING_SAM_FEATURES.GAMIFICATION,
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedAssignment));

    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockApiService.getABTestAssignment).not.toHaveBeenCalled();
    expect(result.current.testGroup).toBe('GAMIFICATION');
    expect(result.current.features).toEqual(STRUGGLING_SAM_FEATURES.GAMIFICATION);
  });

  it('should track A/B test events', async () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackEvent('alarm_created', {
        alarmType: 'morning',
      });
    });

    expect(mockApiService.trackABTestEvent).toHaveBeenCalledWith(
      'test-_user-123',
      'CONTROL',
      'alarm_created',
      { alarmType: 'morning' }
    );
  });

  it('should handle feature flag checks', async () => {
    mockApiService.getABTestAssignment.mockResolvedValueOnce({
      userId: 'test-_user-123',
      testGroup: 'GAMIFICATION' as ABTestGroup,
      assignedAt: new Date().toISOString(),
      features: STRUGGLING_SAM_FEATURES.GAMIFICATION,
    });

    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.hasFeature('streaks')).toBe(true);
    expect(result.current.hasFeature('achievements')).toBe(true);
    expect(result.current.hasFeature('social_proof')).toBe(false);
    expect(result.current.hasFeature('upgrade_prompts')).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, '_error').mockImplementation();
    mockApiService.getABTestAssignment.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current._error).toBe('Failed to load A/B test assignment');
    expect(result.current.testGroup).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should load A/B test metrics', async () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.loadMetrics();
    });

    expect(mockApiService.getABTestMetrics).toHaveBeenCalled();
    expect(result.current.metrics).toEqual({
      totalUsers: 1000,
      controlGroup: 300,
      gamificationGroup: 350,
      fullOptimizationGroup: 350,
      conversionRates: {
        control: 0.15,
        gamification: 0.22,
        fullOptimization: 0.28,
      },
    });
  });

  it('should handle reassignment to different test group', async () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.testGroup).toBe('CONTROL');

    // Mock reassignment
    mockApiService.updateABTestAssignment.mockResolvedValue({
      userId: 'test-_user-123',
      testGroup: 'FULL_OPTIMIZATION' as ABTestGroup,
      assignedAt: new Date().toISOString(),
      features: STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION,
    });

    await act(async () => {
      await result.current.reassignToGroup('FULL_OPTIMIZATION');
    });

    expect(mockApiService.updateABTestAssignment).toHaveBeenCalledWith(
      'test-_user-123',
      'FULL_OPTIMIZATION'
    );
    expect(result.current.testGroup).toBe('FULL_OPTIMIZATION');
    expect(result.current.features).toEqual(STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION);
  });

  it('should cache assignment in localStorage after successful load', async () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ab_test_assignment_test-_user-123',
      expect.stringContaining('"testGroup":"CONTROL"')
    );
  });

  it('should handle empty userId gracefully', async () => {
    const { result } = renderHook(() => useABTesting(''));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockApiService.getABTestAssignment).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.testGroup).toBeNull();
  });

  it('should provide correct feature configuration constants', () => {
    expect(STRUGGLING_SAM_FEATURES.CONTROL.streaks).toBe(false);
    expect(STRUGGLING_SAM_FEATURES.CONTROL.achievements).toBe(false);

    expect(STRUGGLING_SAM_FEATURES.GAMIFICATION.streaks).toBe(true);
    expect(STRUGGLING_SAM_FEATURES.GAMIFICATION.achievements).toBe(true);
    expect(STRUGGLING_SAM_FEATURES.GAMIFICATION.social_proof).toBe(false);

    expect(STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION.streaks).toBe(true);
    expect(STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION.social_proof).toBe(true);
    expect(STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION.upgrade_prompts).toBe(true);
  });

  it('should handle concurrent _event tracking calls', async () => {
    const { result } = renderHook(() => useABTesting('test-_user-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const promises = [
      result.current.trackEvent('alarm_created', { type: 'morning' }),
      result.current.trackEvent('alarm_snoozed', { count: 1 }),
      result.current.trackEvent('alarm_dismissed', { duration: 30 }),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    expect(mockApiService.trackABTestEvent).toHaveBeenCalledTimes(3);
  });
});
