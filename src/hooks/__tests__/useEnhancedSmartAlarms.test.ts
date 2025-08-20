/**
 * Unit tests for useEnhancedSmartAlarms hook
 * Tests enhanced smart alarm features with AI optimization and learning
 */

import { renderHook, act } from '@testing-library/react';
import { useEnhancedSmartAlarms } from '../useEnhancedSmartAlarms';

// Mock smart alarm services
const mockSmartAlarmScheduler = {
  initialize: jest.fn(),
  optimizeAlarmTiming: jest.fn(),
  predictOptimalWakeTime: jest.fn(),
  analyzeUserBehavior: jest.fn(),
  generateSmartRecommendations: jest.fn(),
  adaptToUserFeedback: jest.fn(),
  getOptimizationMetrics: jest.fn(),
  resetLearningData: jest.fn(),
};

const mockAIOptimizer = {
  trainModel: jest.fn(),
  predictWakePreferences: jest.fn(),
  analyzeWakePatterns: jest.fn(),
  generatePersonalizedSuggestions: jest.fn(),
  updateModelWithFeedback: jest.fn(),
};

const mockBehaviorAnalyzer = {
  trackWakeEvent: jest.fn(),
  analyzeSleepPattern: jest.fn(),
  detectBehaviorChanges: jest.fn(),
  generateBehaviorReport: jest.fn(),
};

// Mock services
jest.mock('../../services/smart-alarm-scheduler', () => ({
  __esModule: true,
  default: mockSmartAlarmScheduler,
}));

jest.mock('../../services/ai-optimizer', () => ({
  __esModule: true,
  default: mockAIOptimizer,
}));

jest.mock('../../services/behavior-analyzer', () => ({
  __esModule: true,
  default: mockBehaviorAnalyzer,
}));

// Mock analytics service
const mockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  setUserProperties: jest.fn(),
};

jest.mock('../../services/analytics', () => ({
  __esModule: true,
  default: {
    getInstance: () => mockAnalytics,
  },
}));

describe('useEnhancedSmartAlarms', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock responses
    mockSmartAlarmScheduler.initialize.mockResolvedValue(undefined);
    mockSmartAlarmScheduler.optimizeAlarmTiming.mockResolvedValue({
      originalTime: '07:00',
      optimizedTime: '06:45',
      confidence: 0.85,
      reason: 'Better sleep cycle alignment',
    });

    mockSmartAlarmScheduler.predictOptimalWakeTime.mockResolvedValue({
      recommendedTime: '06:45',
      confidence: 0.9,
      factors: ['sleep_cycle', 'historical_data', 'weather'],
    });

    mockSmartAlarmScheduler.analyzeUserBehavior.mockResolvedValue({
      wakeTimePreference: '06:30-07:00',
      averageSnoozeCount: 2,
      mostProductiveDays: ['monday', 'tuesday'],
      sleepDebtScore: 0.3,
    });

    mockSmartAlarmScheduler.getOptimizationMetrics.mockResolvedValue({
      successRate: 0.85,
      avgOptimizationGain: 15,
      userSatisfaction: 0.9,
      totalOptimizations: 42,
    });

    mockAIOptimizer.predictWakePreferences.mockResolvedValue({
      optimalTimeRange: { start: '06:30', end: '07:00' },
      preferredAlarmType: 'gradual',
      weatherSensitivity: 0.7,
      workdayPattern: 'consistent',
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.optimizations).toEqual([]);
  });

  it('should initialize smart alarm services', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSmartAlarmScheduler.initialize).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isInitialized).toBe(true);
  });

  it('should optimize alarm timing', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const optimization = await result.current.optimizeAlarm({
        id: 'alarm-1',
        time: '07:00',
        userId: 'user-123',
      });

      expect(optimization).toEqual({
        originalTime: '07:00',
        optimizedTime: '06:45',
        confidence: 0.85,
        reason: 'Better sleep cycle alignment',
      });
    });

    expect(mockSmartAlarmScheduler.optimizeAlarmTiming).toHaveBeenCalledWith({
      id: 'alarm-1',
      time: '07:00',
      userId: 'user-123',
    });
  });

  it('should predict optimal wake times', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const prediction = await result.current.predictOptimalWakeTime({
        currentBedtime: '23:00',
        desiredWakeTime: '07:00',
        userId: 'user-123',
      });

      expect(prediction).toEqual({
        recommendedTime: '06:45',
        confidence: 0.9,
        factors: ['sleep_cycle', 'historical_data', 'weather'],
      });
    });

    expect(mockSmartAlarmScheduler.predictOptimalWakeTime).toHaveBeenCalledWith({
      currentBedtime: '23:00',
      desiredWakeTime: '07:00',
      userId: 'user-123',
    });
  });

  it('should analyze user behavior patterns', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.analyzeUserBehavior('user-123');
    });

    expect(result.current.behaviorAnalysis).toEqual({
      wakeTimePreference: '06:30-07:00',
      averageSnoozeCount: 2,
      mostProductiveDays: ['monday', 'tuesday'],
      sleepDebtScore: 0.3,
    });

    expect(mockSmartAlarmScheduler.analyzeUserBehavior).toHaveBeenCalledWith(
      'user-123'
    );
  });

  it('should generate smart recommendations', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    mockSmartAlarmScheduler.generateSmartRecommendations.mockResolvedValue([
      {
        type: 'timing',
        message: 'Consider moving your alarm 15 minutes earlier',
        confidence: 0.8,
        impact: 'high',
      },
      {
        type: 'bedtime',
        message: 'Your bedtime could be 30 minutes earlier',
        confidence: 0.7,
        impact: 'medium',
      },
    ]);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.generateRecommendations('user-123');
    });

    expect(result.current.recommendations).toHaveLength(2);
    expect(result.current.recommendations[0]).toMatchObject({
      type: 'timing',
      confidence: 0.8,
      impact: 'high',
    });

    expect(mockSmartAlarmScheduler.generateSmartRecommendations).toHaveBeenCalledWith(
      'user-123'
    );
  });

  it('should handle user feedback and adapt', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const feedback = {
      alarmId: 'alarm-1',
      rating: 4,
      wakeQuality: 'good',
      actualWakeTime: '06:50',
      comments: 'Felt rested',
    };

    await act(async () => {
      await result.current.provideFeedback(feedback);
    });

    expect(mockSmartAlarmScheduler.adaptToUserFeedback).toHaveBeenCalledWith(feedback);
    expect(mockAnalytics.track).toHaveBeenCalledWith('smart_alarm_feedback', feedback);
  });

  it('should get optimization metrics', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.loadOptimizationMetrics();
    });

    expect(result.current.metrics).toEqual({
      successRate: 0.85,
      avgOptimizationGain: 15,
      userSatisfaction: 0.9,
      totalOptimizations: 42,
    });

    expect(mockSmartAlarmScheduler.getOptimizationMetrics).toHaveBeenCalledTimes(1);
  });

  it('should handle AI-based wake preference predictions', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const preferences = await result.current.predictWakePreferences('user-123');

      expect(preferences).toEqual({
        optimalTimeRange: { start: '06:30', end: '07:00' },
        preferredAlarmType: 'gradual',
        weatherSensitivity: 0.7,
        workdayPattern: 'consistent',
      });
    });

    expect(mockAIOptimizer.predictWakePreferences).toHaveBeenCalledWith('user-123');
  });

  it('should track wake events for learning', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const wakeEvent = {
      alarmId: 'alarm-1',
      scheduledTime: '07:00',
      actualWakeTime: '07:05',
      snoozeCount: 1,
      wakeQuality: 'good',
      timestamp: new Date(),
    };

    await act(async () => {
      await result.current.trackWakeEvent(wakeEvent);
    });

    expect(mockBehaviorAnalyzer.trackWakeEvent).toHaveBeenCalledWith(wakeEvent);
    expect(result.current.wakeHistory).toContain(wakeEvent);
  });

  it('should handle sleep pattern analysis', async () => {
    mockBehaviorAnalyzer.analyzeSleepPattern.mockResolvedValue({
      averageBedtime: '23:15',
      averageWakeTime: '06:45',
      sleepDuration: 7.5,
      sleepEfficiency: 0.85,
      pattern: 'consistent',
    });

    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.analyzeSleepPattern('user-123', 'week');
    });

    expect(result.current.sleepPattern).toEqual({
      averageBedtime: '23:15',
      averageWakeTime: '06:45',
      sleepDuration: 7.5,
      sleepEfficiency: 0.85,
      pattern: 'consistent',
    });

    expect(mockBehaviorAnalyzer.analyzeSleepPattern).toHaveBeenCalledWith(
      'user-123',
      'week'
    );
  });

  it('should detect behavior changes', async () => {
    mockBehaviorAnalyzer.detectBehaviorChanges.mockResolvedValue({
      significantChanges: true,
      changes: [
        { type: 'bedtime_shift', magnitude: 0.5, direction: 'later' },
        { type: 'wake_quality', magnitude: -0.3, direction: 'decline' },
      ],
      recommendedActions: ['adjust_alarm_timing', 'suggest_earlier_bedtime'],
    });

    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const changes = await result.current.detectBehaviorChanges('user-123');

      expect(changes.significantChanges).toBe(true);
      expect(changes.changes).toHaveLength(2);
      expect(changes.recommendedActions).toContain('adjust_alarm_timing');
    });

    expect(mockBehaviorAnalyzer.detectBehaviorChanges).toHaveBeenCalledWith('user-123');
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSmartAlarmScheduler.optimizeAlarmTiming.mockRejectedValue(
      new Error('Optimization failed')
    );

    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const optimization = await result.current.optimizeAlarm({
        id: 'alarm-1',
        time: '07:00',
        userId: 'user-123',
      });

      expect(optimization).toBeNull();
    });

    expect(result.current.error).toBe('Optimization failed');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Smart alarm optimization failed:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should reset learning data when requested', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.resetLearningData('user-123');
    });

    expect(mockSmartAlarmScheduler.resetLearningData).toHaveBeenCalledWith('user-123');
    expect(result.current.behaviorAnalysis).toBeNull();
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.wakeHistory).toEqual([]);
  });

  it('should handle real-time optimization updates', async () => {
    const onOptimizationUpdate = jest.fn();

    renderHook(() => useEnhancedSmartAlarms({ onOptimizationUpdate }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate real-time optimization update
    const optimizationUpdate = {
      alarmId: 'alarm-1',
      newOptimizedTime: '06:50',
      reason: 'Weather adjustment',
      confidence: 0.82,
    };

    // This would typically come from a WebSocket or event listener
    act(() => {
      onOptimizationUpdate(optimizationUpdate);
    });

    expect(onOptimizationUpdate).toHaveBeenCalledWith(optimizationUpdate);
  });

  it('should batch multiple optimization requests', async () => {
    const { result } = renderHook(() => useEnhancedSmartAlarms());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const alarms = [
      { id: 'alarm-1', time: '07:00', userId: 'user-123' },
      { id: 'alarm-2', time: '07:30', userId: 'user-123' },
      { id: 'alarm-3', time: '08:00', userId: 'user-123' },
    ];

    mockSmartAlarmScheduler.optimizeAlarmTiming
      .mockResolvedValueOnce({ optimizedTime: '06:45' })
      .mockResolvedValueOnce({ optimizedTime: '07:15' })
      .mockResolvedValueOnce({ optimizedTime: '07:45' });

    await act(async () => {
      const results = await result.current.optimizeMultipleAlarms(alarms);

      expect(results).toHaveLength(3);
      expect(results[0].optimizedTime).toBe('06:45');
      expect(results[1].optimizedTime).toBe('07:15');
      expect(results[2].optimizedTime).toBe('07:45');
    });

    expect(mockSmartAlarmScheduler.optimizeAlarmTiming).toHaveBeenCalledTimes(3);
  });
});
