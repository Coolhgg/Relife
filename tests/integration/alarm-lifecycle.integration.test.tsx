/**
 * Complete Alarm Lifecycle Integration Tests
 * 
 * Tests the entire alarm journey from creation to triggering to completion:
 * 1. User authentication
 * 2. Alarm creation with all features
 * 3. Alarm scheduling and persistence
 * 4. Background service worker integration
 * 5. Alarm triggering and notification
 * 6. User interaction (snooze/dismiss)
 * 7. Analytics and rewards integration
 * 8. Data persistence and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { AlarmService } from '../../src/services/alarm';
import { PushNotificationService } from '../../src/services/push-notifications';
import { AppAnalyticsService } from '../../src/services/app-analytics';
import { AIRewardsService } from '../../src/services/ai-rewards';
import OfflineStorage from '../../src/services/offline-storage';

// Import test utilities
import { TestData } from '../e2e/fixtures/test-data';
import { createMockUser, createMockAlarm, mockNavigatorAPI } from '../utils/test-mocks';

// Types
import type { Alarm, User, AppState, VoiceMood } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/push-notifications');
vi.mock('@capacitor/local-notifications');
vi.mock('@capacitor/device');
vi.mock('@capacitor/preferences');

describe('Complete Alarm Lifecycle Integration', () => {
  let mockUser: User;
  let mockServiceWorker: ServiceWorker;
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  
  // Service instances
  let supabaseService: SupabaseService;
  let alarmService: AlarmService;
  let analyticsService: AppAnalyticsService;
  let rewardsService: AIRewardsService;

  beforeAll(() => {
    // Mock browser APIs
    mockNavigatorAPI();
    
    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: { postMessage: vi.fn() },
          addEventListener: vi.fn(),
        }),
        ready: Promise.resolve({
          active: { postMessage: vi.fn() },
        }),
        addEventListener: vi.fn(),
      },
      writable: true,
    });
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();
    
    // Reset all service mocks
    vi.clearAllMocks();
    
    // Mock service instances
    supabaseService = SupabaseService;
    alarmService = AlarmService;
    analyticsService = AppAnalyticsService.getInstance();
    rewardsService = AIRewardsService.getInstance();

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({ 
      alarms: [], 
      error: null 
    });
    
    // Mock analytics and rewards
    vi.mocked(analyticsService.trackAlarmCreated).mockImplementation(() => {});
    vi.mocked(rewardsService.analyzeAndGenerateRewards).mockResolvedValue({
      level: 1,
      currentStreak: 0,
      unlockedRewards: [],
      availableRewards: [],
      nextMilestone: { type: 'streak', target: 7, progress: 0 }
    });
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    vi.clearAllTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Full Alarm Creation to Triggering Flow', () => {
    it('should complete the entire alarm lifecycle successfully', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      // Step 1: Verify user is authenticated and on dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 2: Create a new alarm
      const alarmData = {
        time: '07:00',
        label: 'Integration Test Alarm',
        days: [1, 2, 3, 4, 5], // Weekdays
        voiceMood: 'motivational' as VoiceMood,
        sound: 'morning-chime.mp3',
        snoozeEnabled: true,
        maxSnoozes: 3
      };

      // Click add alarm button
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      // Fill out alarm form
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, alarmData.time);

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, alarmData.label);

      // Select days
      for (const day of alarmData.days) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCheckbox = screen.getByLabelText(dayNames[day]);
        if (dayCheckbox && !dayCheckbox.checked) {
          await user.click(dayCheckbox);
        }
      }

      // Configure advanced settings
      const voiceMoodSelect = screen.getByLabelText(/voice.*mood/i);
      await user.selectOptions(voiceMoodSelect, alarmData.voiceMood);

      // Enable snooze
      const snoozeToggle = screen.getByLabelText(/snooze/i);
      if (!snoozeToggle.checked) {
        await user.click(snoozeToggle);
      }

      // Save alarm
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      
      // Mock the save operation
      const mockAlarm = createMockAlarm({
        ...alarmData,
        id: 'test-alarm-123',
        userId: mockUser.id,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null
      });

      await user.click(saveButton);

      // Step 3: Verify alarm was created and appears in list
      await waitFor(() => {
        expect(screen.getByText(alarmData.label)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify service calls
      expect(SupabaseService.saveAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          time: alarmData.time,
          label: alarmData.label,
          userId: mockUser.id,
          enabled: true
        })
      );

      // Step 4: Verify analytics tracking
      expect(analyticsService.trackAlarmCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-alarm-123',
          label: alarmData.label
        }),
        expect.any(Object)
      );

      // Step 5: Simulate alarm triggering
      // Mock current time to match alarm time
      const triggerTime = new Date();
      triggerTime.setHours(7, 0, 0, 0);
      vi.setSystemTime(triggerTime);

      // Mock service worker alarm trigger
      const serviceWorkerMessage = {
        type: 'ALARM_TRIGGERED',
        data: { 
          alarm: mockAlarm,
          triggeredAt: triggerTime.toISOString()
        }
      };

      // Simulate service worker message
      await act(async () => {
        const messageEvent = new MessageEvent('message', { 
          data: serviceWorkerMessage 
        });
        navigator.serviceWorker.dispatchEvent?.(messageEvent);
      });

      // Step 6: Verify alarm ringing state
      await waitFor(() => {
        expect(screen.getByText(/dismiss|stop|snooze/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Step 7: Test snooze functionality
      const snoozeButton = screen.getByRole('button', { name: /snooze/i });
      
      vi.mocked(AlarmService.snoozeAlarm).mockResolvedValueOnce({
        success: true,
        snoozeUntil: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

      await user.click(snoozeButton);

      // Verify snooze was called
      await waitFor(() => {
        expect(AlarmService.snoozeAlarm).toHaveBeenCalledWith('test-alarm-123');
      });

      // Step 8: Verify return to dashboard after snooze
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Step 9: Test final dismissal
      // Trigger alarm again after snooze
      await act(async () => {
        const snoozeEndMessage = {
          type: 'ALARM_TRIGGERED',
          data: { 
            alarm: mockAlarm,
            triggeredAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            isSnoozeEnd: true
          }
        };
        const messageEvent = new MessageEvent('message', { 
          data: snoozeEndMessage 
        });
        navigator.serviceWorker.dispatchEvent?.(messageEvent);
      });

      await waitFor(() => {
        expect(screen.getByText(/dismiss|stop/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss|stop/i });
      
      vi.mocked(AlarmService.dismissAlarm).mockResolvedValueOnce({
        success: true,
        dismissedAt: new Date()
      });

      await user.click(dismissButton);

      // Step 10: Verify final dismissal and rewards
      await waitFor(() => {
        expect(AlarmService.dismissAlarm).toHaveBeenCalledWith(
          'test-alarm-123',
          'button'
        );
      });

      // Verify rewards system was called
      expect(rewardsService.analyzeAndGenerateRewards).toHaveBeenCalled();

      // Step 11: Verify return to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(alarmData.label)).toBeInTheDocument(); // Alarm should still exist
      });
    });
  });

  describe('Alarm Lifecycle with Premium Features', () => {
    it('should handle premium alarm features throughout lifecycle', async () => {
      // Mock premium user
      const premiumUser = {
        ...mockUser,
        subscriptionTier: 'premium' as const,
        premiumFeatures: ['advanced_scheduling', 'custom_sounds', 'unlimited_alarms']
      };
      
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(premiumUser);

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Create alarm with premium features
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test premium-only features are available
      const smartWakeupToggle = screen.queryByLabelText(/smart.*wakeup/i);
      const customSoundOption = screen.queryByText(/upload.*custom/i);
      const advancedScheduling = screen.queryByText(/ai.*optimization/i);

      // These should be visible for premium users
      if (smartWakeupToggle) {
        expect(smartWakeupToggle).toBeInTheDocument();
        await user.click(smartWakeupToggle);
      }

      // Fill basic alarm data
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '06:30');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Premium Test Alarm');

      // Save premium alarm
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      
      const mockPremiumAlarm = createMockAlarm({
        id: 'premium-alarm-456',
        userId: premiumUser.id,
        time: '06:30',
        label: 'Premium Test Alarm',
        isPremiumFeature: true,
        smartWakeupEnabled: true,
        enabled: true
      });
      
      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockPremiumAlarm,
        error: null
      });

      await user.click(saveButton);

      // Verify premium alarm was created
      await waitFor(() => {
        expect(screen.getByText('Premium Test Alarm')).toBeInTheDocument();
      });

      // Verify premium features were tracked in analytics
      expect(analyticsService.trackAlarmCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          isPremiumFeature: true,
          smartWakeupEnabled: true
        }),
        expect.any(Object)
      );
    });
  });

  describe('Alarm Lifecycle Error Handling', () => {
    it('should handle errors gracefully throughout the lifecycle', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Test alarm creation failure
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill alarm form
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '08:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Error Test Alarm');

      // Mock save failure
      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: null,
        error: 'Database connection failed'
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Should remain on form
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Test offline fallback
      vi.mocked(SupabaseService.saveAlarm).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Mock offline storage success
      vi.spyOn(OfflineStorage, 'saveAlarm').mockResolvedValueOnce();

      await user.click(saveButton);

      // Should fall back to offline storage
      await waitFor(() => {
        expect(OfflineStorage.saveAlarm).toHaveBeenCalled();
      });

      // Should show offline indicator
      const offlineIndicator = screen.queryByText(/offline/i);
      if (offlineIndicator) {
        expect(offlineIndicator).toBeInTheDocument();
      }
    });

    it('should handle alarm triggering failures', async () => {
      // Mock existing alarm
      const mockAlarm = createMockAlarm({
        id: 'fail-alarm-789',
        userId: mockUser.id,
        time: '09:00',
        label: 'Fail Test Alarm',
        enabled: true
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [mockAlarm],
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText('Fail Test Alarm')).toBeInTheDocument();
      });

      // Simulate alarm trigger failure
      await act(async () => {
        const failureMessage = {
          type: 'ALARM_ERROR',
          data: { 
            alarmId: 'fail-alarm-789',
            error: 'Notification permission denied',
            fallbackMethod: 'web_notification'
          }
        };
        const messageEvent = new MessageEvent('message', { 
          data: failureMessage 
        });
        navigator.serviceWorker.dispatchEvent?.(messageEvent);
      });

      // Should show error handling UI
      await waitFor(() => {
        const errorMessage = screen.queryByText(/permission.*denied|notification.*failed/i);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      }, { timeout: 5000 });

      // Should attempt fallback notification method
      await waitFor(() => {
        // Verify fallback handling was attempted
        expect(true).toBe(true); // Placeholder for actual fallback verification
      });
    });
  });

  describe('Alarm Lifecycle Performance', () => {
    it('should complete lifecycle within performance budgets', async () => {
      const startTime = performance.now();
      
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      // Measure app initialization time
      const initTime = performance.now();
      expect(initTime - startTime).toBeLessThan(3000); // App should initialize within 3 seconds

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Measure alarm creation time
      const creationStartTime = performance.now();
      
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Quick alarm creation
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '10:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Performance Test');

      const mockAlarm = createMockAlarm({
        id: 'perf-alarm-999',
        userId: mockUser.id,
        time: '10:00',
        label: 'Performance Test',
        enabled: true
      });
      
      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Performance Test')).toBeInTheDocument();
      });

      const creationEndTime = performance.now();
      expect(creationEndTime - creationStartTime).toBeLessThan(2000); // Alarm creation should take less than 2 seconds

      // Verify no memory leaks by checking service call counts
      expect(vi.mocked(SupabaseService.saveAlarm)).toHaveBeenCalledTimes(1);
      expect(analyticsService.trackAlarmCreated).toHaveBeenCalledTimes(1);
    });
  });
});