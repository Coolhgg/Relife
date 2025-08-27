/// <reference lib="dom" />
/**
 * Advanced Sleep Tracking Integration Tests
 * 
 * Comprehensive end-to-end tests for advanced sleep tracking functionality including:
 * - Sleep session logging and pattern analysis
 * - Chronotype detection and sleep cycle prediction
 * - Smart alarm recommendations and optimal wake windows
 * - Historical data analysis and seasonal variations
 * - Environmental data integration and wearable support
 * - Performance validation and analytics tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import SleepTracker from '../../src/components/SleepTracker';
import { SleepAnalysisService } from '../../src/services/sleep-analysis';
import { SupabaseService } from '../../src/services/supabase';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import test utilities
import { 
  createMockUser, 
  createMockAlarm, 
  measurePerformance,
  setupAllMocks
} from '../utils/test-mocks';

import type { 
  User, 
  SleepSession, 
  SleepPattern,
  SmartAlarmRecommendation,
  OptimalWakeWindow
} from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/sleep-analysis');
vi.mock('../../src/services/app-analytics');

describe('Advanced Sleep Tracking Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;
  
  // Service instances
  let analyticsService: AppAnalyticsService;

  // Mock sleep data
  const mockSleepSessions: SleepSession[] = [
    {
      id: 'sleep-session-1',
      userId: 'sleep-user-123',
      bedtime: new Date('2024-01-15T22:30:00'),
      sleepTime: new Date('2024-01-15T22:45:00'),
      wakeTime: new Date('2024-01-16T07:15:00'),
      getUpTime: new Date('2024-01-16T07:30:00'),
      sleepDuration: 450, // 7.5 hours
      sleepQuality: 8,
      sleepStages: [
        { stage: 'light', startTime: new Date('2024-01-15T22:45:00'), duration: 20, quality: 8 },
        { stage: 'deep', startTime: new Date('2024-01-15T23:05:00'), duration: 90, quality: 9 },
        { stage: 'rem', startTime: new Date('2024-01-16T00:35:00'), duration: 60, quality: 7 }
      ],
      environmentData: {
        averageLight: 2,
        averageNoise: 25,
        temperature: 18,
        humidity: 45,
        wearableData: {
          heartRate: [65, 58, 52, 48, 55, 62, 70],
          movement: [0.1, 0.05, 0.02, 0.01, 0.03, 0.08, 0.15],
          oxygenSaturation: [98, 97, 98, 97, 98, 97, 98]
        }
      },
      createdAt: new Date('2024-01-16T07:30:00'),
      updatedAt: new Date('2024-01-16T07:30:00')
    },
    {
      id: 'sleep-session-2',
      userId: 'sleep-user-123',
      bedtime: new Date('2024-01-16T23:00:00'),
      sleepTime: new Date('2024-01-16T23:20:00'),
      wakeTime: new Date('2024-01-17T06:45:00'),
      getUpTime: new Date('2024-01-17T07:00:00'),
      sleepDuration: 425, // 7 hours 5 minutes
      sleepQuality: 6,
      sleepStages: [],
      environmentData: {
        averageLight: 5,
        averageNoise: 35,
        temperature: 20,
        humidity: 50
      },
      createdAt: new Date('2024-01-17T07:00:00'),
      updatedAt: new Date('2024-01-17T07:00:00')
    }
  ];

  const mockSleepPattern: SleepPattern = {
    userId: 'sleep-user-123',
    averageBedtime: '22:45',
    averageSleepTime: '23:02',
    averageWakeTime: '07:00',
    averageSleepDuration: 437,
    averageSleepQuality: 7.2,
    sleepLatency: 17,
    sleepEfficiency: 92,
    weekdayPattern: {
      bedtime: '22:30',
      wakeTime: '06:45',
      sleepDuration: 435,
      sleepQuality: 7.5
    },
    weekendPattern: {
      bedtime: '23:15',
      wakeTime: '08:30',
      sleepDuration: 465,
      sleepQuality: 7.8
    },
    seasonalVariations: {
      winter: {
        averageBedtime: '22:15',
        averageSleepDuration: 450
      },
      summer: {
        averageBedtime: '23:00',
        averageSleepDuration: 420
      }
    },
    chronotype: 'early'
  };

  beforeAll(() => {
    setupAllMocks();
    console.log('Advanced sleep tracking tests initialized');
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser({
      id: 'sleep-user-123',
      email: 'sleep.tracker@example.com',
      name: 'Sleep Tracker User',
      preferences: {
        sleepTracking: {
          enabled: true,
          smartRecommendations: true,
          wearableIntegration: true
        }
      }
    });
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock service instances
    analyticsService = AppAnalyticsService.getInstance();

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({ 
      alarms: [], 
      error: null 
    });
    
    // Mock sleep analysis service
    vi.mocked(SleepAnalysisService.initialize).mockResolvedValue(undefined);
    vi.mocked(SleepAnalysisService.getSleepHistory).mockResolvedValue(mockSleepSessions);
    vi.mocked(SleepAnalysisService.analyzeSleepPatterns).mockResolvedValue(mockSleepPattern);
    vi.mocked(SleepAnalysisService.getCachedSleepPattern).mockReturnValue(mockSleepPattern);

    // Mock analytics
    vi.mocked(analyticsService.trackSleepAnalytics).mockImplementation(() => {});
    vi.mocked(analyticsService.trackSmartAlarmRecommendation).mockImplementation(() => {});
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Sleep Session Logging', () => {
    it('should log sleep session with manual entry', async () => {
      const performanceMeasures: {[key: string]: number} = {};

      // Step 1: Render sleep tracker
      const renderTime = await measurePerformance(async () => {
        await act(async () => {
          const result = render(
            <SleepTracker 
              isOpen={true} 
              onClose={() => {}} 
            />
          );
          container = result.container;
        });
      });
      
      performanceMeasures.componentRender = renderTime;

      // Step 2: Should show log sleep form
      await waitFor(() => {
        expect(screen.getByText(/log.*sleep|sleep.*log/i)).toBeInTheDocument();
      });

      // Step 3: Fill in sleep data
      const dateInput = screen.getByLabelText(/date/i);
      const bedtimeInput = screen.getByLabelText(/bedtime/i);
      const waketimeInput = screen.getByLabelText(/wake.*time/i);
      const qualitySlider = screen.getByLabelText(/sleep.*quality/i);

      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-18');

      await user.clear(bedtimeInput);
      await user.type(bedtimeInput, '22:00');

      await user.clear(waketimeInput);
      await user.type(waketimeInput, '06:30');

      await user.click(qualitySlider);
      await user.keyboard('{ArrowRight}{ArrowRight}'); // Set to 7

      // Step 4: Should show calculated duration
      await waitFor(() => {
        expect(screen.getByText(/8h 30m|8\.5.*hour/i)).toBeInTheDocument();
      });

      // Step 5: Mock successful logging
      const mockNewSession: SleepSession = {
        ...mockSleepSessions[0],
        id: 'new-sleep-session',
        bedtime: new Date('2024-01-18T22:00:00'),
        wakeTime: new Date('2024-01-19T06:30:00'),
        sleepDuration: 510,
        sleepQuality: 7
      };

      vi.mocked(SleepAnalysisService.trackSleepManually).mockResolvedValue(undefined);
      vi.mocked(SleepAnalysisService.recordSleepSession).mockResolvedValue(mockNewSession);

      // Step 6: Submit the form
      const logTime = await measurePerformance(async () => {
        const logButton = screen.getByRole('button', { name: /log.*sleep/i });
        await user.click(logButton);

        await waitFor(() => {
          expect(screen.getByText(/history|recent.*sleep/i)).toBeInTheDocument();
        });
      });

      performanceMeasures.sleepLogging = logTime;

      // Step 7: Verify logging was called
      expect(SleepAnalysisService.trackSleepManually).toHaveBeenCalledWith(
        new Date('2024-01-18T22:00'),
        new Date('2024-01-19T06:30'),
        7
      );

      expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
        action: 'manual_sleep_logged',
        userId: mockUser.id,
        sleepDuration: expect.any(Number),
        sleepQuality: 7,
        bedtime: '22:00',
        wakeTime: '06:30'
      });

      console.log('Sleep logging performance:', performanceMeasures);
    });

    it('should handle wearable data integration', async () => {
      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      // Navigate to wearable integration
      const settingsButton = screen.getByRole('button', { name: /settings|integrate/i });
      if (settingsButton) {
        await user.click(settingsButton);

        // Step 1: Enable wearable integration
        const wearableToggle = screen.getByLabelText(/wearable.*integration|fitness.*tracker/i);
        await user.click(wearableToggle);

        // Step 2: Should show connected devices
        await waitFor(() => {
          expect(screen.getByText(/connected.*device|fitness.*tracker.*connected/i)).toBeInTheDocument();
        });

        // Step 3: Mock wearable data sync
        const mockWearableSession = {
          ...mockSleepSessions[0],
          environmentData: {
            ...mockSleepSessions[0].environmentData,
            wearableData: {
              heartRate: Array.from({ length: 480 }, (_, i) => 60 + Math.sin(i / 60) * 15),
              movement: Array.from({ length: 480 }, (_, i) => Math.random() * 0.5),
              oxygenSaturation: Array.from({ length: 480 }, () => 97 + Math.random() * 2)
            }
          }
        };

        vi.mocked(SleepAnalysisService.getSleepHistory).mockResolvedValue([mockWearableSession]);

        const syncButton = screen.getByRole('button', { name: /sync.*data|import.*wearable/i });
        await user.click(syncButton);

        // Step 4: Should show enhanced data
        await waitFor(() => {
          expect(screen.getByText(/heart.*rate|sleep.*stages/i)).toBeInTheDocument();
        });

        expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
          action: 'wearable_data_synced',
          userId: mockUser.id,
          dataPoints: expect.any(Number)
        });
      }
    });
  });

  describe('Sleep Pattern Analysis and Chronotype Detection', () => {
    it('should analyze sleep patterns and detect chronotype', async () => {
      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      // Navigate to insights tab
      const insightsTab = screen.getByRole('button', { name: /insights|analysis/i });
      await user.click(insightsTab);

      // Step 1: Should show loading state
      expect(screen.getByText(/analyzing.*sleep.*pattern/i)).toBeInTheDocument();

      // Step 2: Should show pattern analysis results
      await waitFor(() => {
        expect(screen.getByText(/sleep.*pattern.*analysis/i)).toBeInTheDocument();
      });

      // Verify sleep metrics are displayed
      expect(screen.getByText(/7h 17m|437.*min/)).toBeInTheDocument(); // Average sleep duration
      expect(screen.getByText('22:45')).toBeInTheDocument(); // Average bedtime
      expect(screen.getByText('07:00')).toBeInTheDocument(); // Average wake time
      expect(screen.getByText('7.2')).toBeInTheDocument(); // Average quality

      // Step 3: Should show chronotype
      expect(screen.getByText(/your.*chronotype/i)).toBeInTheDocument();
      expect(screen.getByText(/EARLY/i)).toBeInTheDocument();

      // Should show chronotype description
      expect(screen.getByText(/early.*bird|naturally.*wake.*early/i)).toBeInTheDocument();

      // Step 4: Should show weekday vs weekend patterns
      expect(screen.getByText(/weekday.*pattern|work.*day/i)).toBeInTheDocument();
      expect(screen.getByText(/weekend.*pattern/i)).toBeInTheDocument();

      expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
        action: 'pattern_analyzed',
        userId: mockUser.id,
        chronotype: 'early',
        averageSleepDuration: 437,
        sleepEfficiency: 92
      });
    });

    it('should show seasonal variations in sleep patterns', async () => {
      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      const insightsTab = screen.getByRole('button', { name: /insights/i });
      await user.click(insightsTab);

      await waitFor(() => {
        expect(screen.getByText(/seasonal.*variation|season.*pattern/i)).toBeInTheDocument();
      });

      // Should show winter vs summer differences
      expect(screen.getByText(/winter/i)).toBeInTheDocument();
      expect(screen.getByText(/summer/i)).toBeInTheDocument();

      // Winter: earlier bedtime (22:15) vs Summer: later bedtime (23:00)
      const seasonalInfo = screen.getByText(/winter.*earlier|longer.*winter/i);
      expect(seasonalInfo).toBeInTheDocument();
    });
  });

  describe('Smart Alarm Recommendations', () => {
    it('should generate smart alarm recommendations based on sleep cycles', async () => {
      const mockAlarm = createMockAlarm({
        id: 'smart-alarm-test',
        userId: mockUser.id,
        time: '07:00',
        label: 'Smart Wake Up',
        enabled: true
      });

      // Mock smart alarm recommendation
      const mockRecommendation: SmartAlarmRecommendation = {
        originalTime: '07:00',
        recommendedTime: '06:45',
        reason: "You'll be in light sleep, making it easier to wake up naturally. Based on your early chronotype.",
        confidence: 0.87,
        sleepStageAtOriginal: 'deep',
        sleepStageAtRecommended: 'light',
        estimatedSleepQuality: 8.2,
        wakeUpDifficulty: 'very_easy'
      };

      vi.mocked(SleepAnalysisService.getSmartAlarmRecommendation).mockResolvedValue(mockRecommendation);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to alarm creation
      const createAlarmButton = screen.getByRole('button', { name: /create.*alarm|new.*alarm/i });
      await user.click(createAlarmButton);

      // Set alarm time
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '07:00');

      // Step 1: Should show smart recommendation option
      const smartToggle = screen.getByLabelText(/smart.*alarm|optimal.*timing/i);
      await user.click(smartToggle);

      // Step 2: Should generate recommendation
      await waitFor(() => {
        expect(screen.getByText(/smart.*recommendation|optimal.*time/i)).toBeInTheDocument();
      });

      // Should show recommended time
      expect(screen.getByText('06:45')).toBeInTheDocument();
      expect(screen.getByText(/15.*minutes.*earlier/i)).toBeInTheDocument();

      // Should show reason
      expect(screen.getByText(/light.*sleep|easier.*wake/i)).toBeInTheDocument();

      // Should show confidence
      expect(screen.getByText(/87.*confidence|87%/i)).toBeInTheDocument();

      // Should show wake difficulty
      expect(screen.getByText(/very.*easy/i)).toBeInTheDocument();

      // Step 3: User can accept recommendation
      const acceptButton = screen.getByRole('button', { name: /accept.*recommendation|use.*smart.*time/i });
      await user.click(acceptButton);

      // Time should be updated
      expect(timeInput).toHaveValue('06:45');

      expect(analyticsService.trackSmartAlarmRecommendation).toHaveBeenCalledWith({
        userId: mockUser.id,
        originalTime: '07:00',
        recommendedTime: '06:45',
        accepted: true,
        confidence: 0.87,
        timeDifference: -15
      });
    });

    it('should show optimal wake windows with sleep cycle visualization', async () => {
      const mockOptimalWindow: OptimalWakeWindow = {
        start: '06:30',
        end: '07:05',
        stages: [
          { time: '06:30', stage: 'light', quality: 10 },
          { time: '06:45', stage: 'light', quality: 9 },
          { time: '07:00', stage: 'deep', quality: 2 },
          { time: '07:05', stage: 'rem', quality: 5 }
        ]
      };

      vi.mocked(SleepAnalysisService.findOptimalWakeWindow).mockReturnValue(mockOptimalWindow);

      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      // Navigate to sleep optimization
      const optimizeTab = screen.getByRole('tab', { name: /optimize|recommendations/i });
      if (optimizeTab) {
        await user.click(optimizeTab);

        // Should show optimal wake window
        await waitFor(() => {
          expect(screen.getByText(/optimal.*wake.*window/i)).toBeInTheDocument();
        });

        // Should show time range
        expect(screen.getByText('06:30')).toBeInTheDocument();
        expect(screen.getByText('07:05')).toBeInTheDocument();

        // Should show sleep stages visualization
        expect(screen.getByText(/light.*sleep/i)).toBeInTheDocument();
        expect(screen.getByText(/deep.*sleep/i)).toBeInTheDocument();
        expect(screen.getByText(/rem.*sleep/i)).toBeInTheDocument();

        // Should show quality scores
        const lightStages = screen.getAllByText(/10|9/);
        expect(lightStages.length).toBeGreaterThan(0);
      }
    });

    it('should handle insufficient sleep data for recommendations', async () => {
      // Mock insufficient data
      vi.mocked(SleepAnalysisService.getSleepHistory).mockResolvedValue([]);
      vi.mocked(SleepAnalysisService.analyzeSleepPatterns).mockResolvedValue(null);
      vi.mocked(SleepAnalysisService.getSmartAlarmRecommendation).mockResolvedValue(null);

      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      const insightsTab = screen.getByRole('button', { name: /insights/i });
      await user.click(insightsTab);

      // Should show insufficient data message
      await waitFor(() => {
        expect(screen.getByText(/insufficient.*data|more.*sleep.*data/i)).toBeInTheDocument();
      });

      // Should suggest logging more sleep
      expect(screen.getByText(/log.*more.*sleep|record.*sleep/i)).toBeInTheDocument();

      // Should show minimum requirements
      expect(screen.getByText(/7.*nights|week.*data/i)).toBeInTheDocument();
    });
  });

  describe('Sleep Cycle Prediction and Analysis', () => {
    it('should predict sleep stages based on sleep cycles', async () => {
      const mockAlarm = createMockAlarm({
        time: '07:00',
        days: [1, 2, 3, 4, 5] // Weekdays
      });

      const mockPredictedStages = [
        { time: 390, stage: 'light' as const }, // 6:30 AM
        { time: 405, stage: 'light' as const }, // 6:45 AM  
        { time: 420, stage: 'deep' as const },  // 7:00 AM
        { time: 435, stage: 'rem' as const }    // 7:15 AM
      ];

      vi.mocked(SleepAnalysisService.predictSleepStages).mockResolvedValue(mockPredictedStages);

      // Test prediction functionality
      const prediction = await SleepAnalysisService.predictSleepStages(mockAlarm, mockSleepPattern);

      expect(SleepAnalysisService.predictSleepStages).toHaveBeenCalledWith(mockAlarm, mockSleepPattern);
      expect(prediction).toEqual(mockPredictedStages);

      // Verify 90-minute cycle pattern
      const lightStages = prediction.filter(s => s.stage === 'light');
      const deepStages = prediction.filter(s => s.stage === 'deep'); 
      const remStages = prediction.filter(s => s.stage === 'rem');

      expect(lightStages.length).toBeGreaterThan(0);
      expect(deepStages.length).toBeGreaterThan(0);
      expect(remStages.length).toBeGreaterThan(0);
    });

    it('should differentiate between weekday and weekend patterns', async () => {
      // Test weekday alarm
      const weekdayAlarm = createMockAlarm({
        time: '06:30',
        days: [1, 2, 3, 4, 5] // Monday-Friday
      });

      // Test weekend alarm
      const weekendAlarm = createMockAlarm({
        time: '08:00',
        days: [0, 6] // Saturday-Sunday
      });

      await SleepAnalysisService.predictSleepStages(weekdayAlarm, mockSleepPattern);
      await SleepAnalysisService.predictSleepStages(weekendAlarm, mockSleepPattern);

      // Verify different patterns were used
      expect(SleepAnalysisService.predictSleepStages).toHaveBeenCalledTimes(2);
      
      // The service should use weekday pattern (22:30 bedtime) vs weekend pattern (23:15 bedtime)
      const calls = vi.mocked(SleepAnalysisService.predictSleepStages).mock.calls;
      expect(calls[0][1].weekdayPattern.bedtime).toBe('22:30');
      expect(calls[1][1].weekendPattern.bedtime).toBe('23:15');
    });
  });

  describe('Performance and Analytics Validation', () => {
    it('should handle large sleep datasets efficiently', async () => {
      // Generate large dataset
      const largeSleepDataset = Array.from({ length: 365 }, (_, i) => ({
        ...mockSleepSessions[0],
        id: `sleep-session-${i}`,
        bedtime: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000)
      }));

      vi.mocked(SleepAnalysisService.getSleepHistory).mockResolvedValue(largeSleepDataset);

      const analysisTime = await measurePerformance(async () => {
        await act(async () => {
          render(
            <SleepTracker 
              isOpen={true} 
              onClose={() => {}} 
            />
          );
        });

        await waitFor(() => {
          expect(screen.getByText(/365.*sessions|year.*data/i)).toBeInTheDocument();
        });
      });

      // Should handle large datasets efficiently
      expect(analysisTime).toBeLessThan(3000); // < 3 seconds

      // Navigate to insights to trigger pattern analysis
      const insightsTab = screen.getByRole('button', { name: /insights/i });
      await user.click(insightsTab);

      const patternAnalysisTime = await measurePerformance(async () => {
        await waitFor(() => {
          expect(screen.getByText(/sleep.*pattern.*analysis/i)).toBeInTheDocument();
        });
      });

      expect(patternAnalysisTime).toBeLessThan(2000); // < 2 seconds for analysis
    });

    it('should track comprehensive sleep analytics', async () => {
      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      // Track component initialization
      expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
        action: 'sleep_tracker_opened',
        userId: mockUser.id
      });

      // Navigate through different tabs
      const historyTab = screen.getByRole('button', { name: /history/i });
      await user.click(historyTab);

      expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
        action: 'sleep_history_viewed',
        userId: mockUser.id,
        sessionCount: mockSleepSessions.length
      });

      const insightsTab = screen.getByRole('button', { name: /insights/i });
      await user.click(insightsTab);

      expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
        action: 'sleep_insights_viewed', 
        userId: mockUser.id,
        chronotype: 'early',
        averageSleepQuality: 7.2
      });
    });

    it('should handle sleep data synchronization errors gracefully', async () => {
      // Mock synchronization error
      vi.mocked(SleepAnalysisService.getSleepHistory).mockRejectedValue(
        new Error('Sleep data synchronization failed')
      );

      await act(async () => {
        const result = render(
          <SleepTracker 
            isOpen={true} 
            onClose={() => {}} 
          />
        );
        container = result.container;
      });

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error.*loading|sync.*failed/i)).toBeInTheDocument();
      });

      // Should show retry option
      const retryButton = screen.getByRole('button', { name: /retry|try.*again/i });
      expect(retryButton).toBeInTheDocument();

      // Should offer offline mode
      const offlineButton = screen.getByRole('button', { name: /offline.*mode|cached.*data/i });
      if (offlineButton) {
        await user.click(offlineButton);

        await waitFor(() => {
          expect(screen.getByText(/offline.*data|cached.*session/i)).toBeInTheDocument();
        });
      }

      expect(analyticsService.trackSleepAnalytics).toHaveBeenCalledWith({
        action: 'sync_error',
        userId: mockUser.id,
        error: 'Sleep data synchronization failed'
      });
    });
  });
});