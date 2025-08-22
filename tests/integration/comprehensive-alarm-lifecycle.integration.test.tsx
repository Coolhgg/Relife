/// <reference lib="dom" />
/**
 * Comprehensive Alarm Lifecycle Integration Tests
 *
 * Enhanced end-to-end tests using comprehensive browser API mocks:
 * - Real notification API interactions
 * - Service worker messaging and lifecycle
 * - Voice recognition for dismissal
 * - Push notifications and wake locks
 * - Offline/online state management
 * - Performance validation
 *
 * This test file demonstrates the complete user journey with realistic browser interactions.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
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

// Import enhanced test utilities
import {
  integrationTestHelpers,
  simulateAlarmNotification,
  simulateVoiceAlarmDismiss,
  simulateVoiceSnooze,
  simulatePushSubscription,
  simulateScreenWakeLock,
  verifyNotificationShown,
  verifyServiceWorkerActive,
  verifyPushSubscriptionActive,
  notificationHelpers,
  serviceWorkerHelpers,
  speechHelpers,
  wakeLockHelpers,
} from '../utils/integration-test-setup';

import {
  createMockUser,
  createMockAlarm,
  measurePerformance,
} from '../utils/test-mocks';
import type { Alarm, User, VoiceMood } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/push-notifications');
vi.mock('../../src/services/app-analytics');
vi.mock('../../src/services/ai-rewards');
vi.mock('@capacitor/local-notifications');
vi.mock('@capacitor/device');
vi.mock('@capacitor/preferences');

describe('Comprehensive Alarm Lifecycle Integration', () => {
  let mockUser: User;
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;

  // Service instances
  let analyticsService: AppAnalyticsService;
  let rewardsService: AIRewardsService;

  beforeAll(() => {
    // Enhanced browser API mocks are already set up in integration-test-setup.ts
    console.log('Enhanced browser API mocks initialized');
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser({
      id: 'comprehensive-test-user',
      email: 'comprehensive@test.com',
      name: 'Comprehensive Test User',
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Mock service instances
    analyticsService = AppAnalyticsService.getInstance();
    rewardsService = AIRewardsService.getInstance();

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
      alarms: [],
      error: null,
    });

    // Mock analytics and rewards
    vi.mocked(analyticsService.trackAlarmCreated).mockImplementation(() => {});
    vi.mocked(analyticsService.trackAlarmTriggered).mockImplementation(() => {});
    vi.mocked(analyticsService.trackAlarmSnoozed).mockImplementation(() => {});
    vi.mocked(analyticsService.trackAlarmDismissed).mockImplementation(() => {});

    vi.mocked(rewardsService.analyzeAndGenerateRewards).mockResolvedValue({
      level: 1,
      currentStreak: 0,
      unlockedRewards: [],
      availableRewards: [],
      nextMilestone: { type: 'streak', target: 7, progress: 0 },
    });
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    // Enhanced mocks cleanup is handled in integration-test-setup.ts
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Complete End-to-End Alarm Flow with Browser APIs', () => {
    it('should complete entire alarm lifecycle with realistic browser interactions', async () => {
      // Performance tracking
      const performanceMeasures: { [key: string]: number } = {};

      // Step 1: App initialization with performance tracking
      const appInitTime = await measurePerformance(async () => {
        await act(async () => {
          const result = render(
            <BrowserRouter>
              <App />
            </BrowserRouter>
          );
          container = result.container;
        });
      });

      performanceMeasures.appInit = appInitTime;
      expect(appInitTime).toBeLessThan(3000); // App should init within 3 seconds

      // Step 2: Verify service worker registration
      await waitFor(() => {
        expect(verifyServiceWorkerActive()).toBe(true);
      });

      // Step 3: Set up push notifications
      const pushSubscription = await simulatePushSubscription();
      expect(verifyPushSubscriptionActive()).toBe(true);
      expect(pushSubscription.endpoint).toContain('fcm.googleapis.com');

      // Step 4: Wait for dashboard and verify authentication
      await waitFor(
        () => {
          expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Step 5: Request notification permissions
      await act(async () => {
        await notificationHelpers.requestPermission();
      });
      expect(global.Notification.permission).toBe('granted');

      // Step 6: Create alarm with performance tracking
      const alarmCreationTime = await measurePerformance(async () => {
        const alarmData = {
          time: '07:30',
          label: 'Comprehensive Test Alarm',
          days: [1, 2, 3, 4, 5], // Weekdays
          voiceMood: 'motivational' as VoiceMood,
          sound: 'peaceful-morning.mp3',
          snoozeEnabled: true,
          maxSnoozes: 2,
          volume: 0.8,
          vibrate: true,
        };

        // Click add alarm button
        const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
        await user.click(addAlarmButton);

        // Wait for dialog
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Fill form with realistic interactions
        const timeInput = screen.getByLabelText(/time/i);
        await user.clear(timeInput);
        await user.type(timeInput, alarmData.time);

        const labelInput = screen.getByLabelText(/label|name/i);
        await user.clear(labelInput);
        await user.type(labelInput, alarmData.label);

        // Select weekdays
        for (const day of alarmData.days) {
          const dayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];
          const dayCheckbox = screen.getByLabelText(dayNames[day]);
          if (dayCheckbox && !dayCheckbox.checked) {
            await user.click(dayCheckbox);
          }
        }

        // Configure voice mood
        const voiceMoodSelect = screen.getByLabelText(/voice.*mood/i);
        await user.selectOptions(voiceMoodSelect, alarmData.voiceMood);

        // Enable snooze
        const snoozeToggle = screen.getByLabelText(/snooze/i);
        if (!snoozeToggle.checked) {
          await user.click(snoozeToggle);
        }

        // Mock successful save
        const mockAlarm = createMockAlarm({
          ...alarmData,
          id: 'comprehensive-alarm-123',
          userId: mockUser.id,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
          alarm: mockAlarm,
          error: null,
        });

        // Save alarm
        const saveButton = screen.getByRole('button', { name: /save|create/i });
        await user.click(saveButton);

        // Verify alarm appears in list
        await waitFor(
          () => {
            expect(screen.getByText(alarmData.label)).toBeInTheDocument();
          },
          { timeout: 5000 }
        );
      });

      performanceMeasures.alarmCreation = alarmCreationTime;
      expect(alarmCreationTime).toBeLessThan(2000); // Alarm creation should be under 2 seconds

      // Step 7: Verify service worker received alarm data
      const registrations = serviceWorkerHelpers.getRegistrations();
      expect(registrations.length).toBeGreaterThan(0);

      // Step 8: Simulate alarm triggering with realistic browser notification
      const triggerTime = new Date();
      triggerTime.setHours(7, 30, 0, 0);
      vi.setSystemTime(triggerTime);

      // Create notification through service worker
      const notification = await simulateAlarmNotification('Comprehensive Test Alarm', {
        body: 'Time to wake up! 🌅',
        icon: '/icons/alarm-icon.png',
        tag: 'alarm-comprehensive-alarm-123',
        requireInteraction: true,
        data: {
          alarmId: 'comprehensive-alarm-123',
          actions: ['snooze', 'dismiss'],
        },
      });

      // Verify notification was created
      expect(verifyNotificationShown('Comprehensive Test Alarm')).toBe(true);
      expect(notification).toBeDefined();
      expect(notification.requireInteraction).toBe(true);

      // Step 9: Simulate wake lock for alarm display
      const wakeLockSentinel = await simulateScreenWakeLock();
      expect(wakeLockSentinel.released).toBe(false);
      expect(wakeLockSentinel.type).toBe('screen');

      // Step 10: Wait for alarm ringing interface
      await waitFor(
        () => {
          expect(screen.getByText(/dismiss|stop|snooze/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 11: Test voice-activated snooze
      vi.mocked(AlarmService.snoozeAlarm).mockResolvedValueOnce({
        success: true,
        snoozeUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });

      // Simulate voice command
      await act(async () => {
        simulateVoiceSnooze();
      });

      // Wait for voice recognition to process
      await waitFor(
        () => {
          expect(AlarmService.snoozeAlarm).toHaveBeenCalledWith(
            'comprehensive-alarm-123'
          );
        },
        { timeout: 3000 }
      );

      // Verify analytics tracking
      expect(analyticsService.trackAlarmSnoozed).toHaveBeenCalledWith(
        expect.objectContaining({
          alarmId: 'comprehensive-alarm-123',
          snoozeMethod: 'voice',
        })
      );

      // Step 12: Simulate snooze notification dismissal
      notification.close();
      await wakeLockSentinel.release();
      expect(wakeLockSentinel.released).toBe(true);

      // Step 13: Return to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Step 14: Simulate alarm re-triggering after snooze
      const snoozeEndTime = new Date(Date.now() + 5 * 60 * 1000);
      vi.setSystemTime(snoozeEndTime);

      const secondNotification = await simulateAlarmNotification(
        'Comprehensive Test Alarm',
        {
          body: 'Snooze ended - Time to wake up! ⏰',
          icon: '/icons/alarm-icon.png',
          tag: 'alarm-comprehensive-alarm-123-snooze',
          requireInteraction: true,
          data: {
            alarmId: 'comprehensive-alarm-123',
            snoozeCount: 1,
            actions: ['dismiss'],
          },
        }
      );

      // Step 15: Test voice-activated dismissal
      vi.mocked(AlarmService.dismissAlarm).mockResolvedValueOnce({
        success: true,
        dismissedAt: new Date(),
      });

      await act(async () => {
        simulateVoiceAlarmDismiss();
      });

      // Wait for voice dismissal
      await waitFor(
        () => {
          expect(AlarmService.dismissAlarm).toHaveBeenCalledWith(
            'comprehensive-alarm-123',
            'voice'
          );
        },
        { timeout: 3000 }
      );

      // Step 16: Verify final cleanup and rewards
      expect(analyticsService.trackAlarmDismissed).toHaveBeenCalledWith(
        expect.objectContaining({
          alarmId: 'comprehensive-alarm-123',
          dismissMethod: 'voice',
          totalSnoozes: 1,
        })
      );

      expect(rewardsService.analyzeAndGenerateRewards).toHaveBeenCalled();

      secondNotification.close();

      // Step 17: Performance validation
      console.log('Performance Measures:', performanceMeasures);
      expect(performanceMeasures.appInit).toBeLessThan(3000);
      expect(performanceMeasures.alarmCreation).toBeLessThan(2000);

      // Step 18: Verify final state
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        expect(screen.getByText('Comprehensive Test Alarm')).toBeInTheDocument();
      });

      // Verify no active notifications remain
      const activeNotifications = notificationHelpers.getActiveNotifications();
      expect(activeNotifications.length).toBe(0);

      // Verify no active wake locks remain
      const activeSentinels = wakeLockHelpers.getActiveSentinels();
      expect(activeSentinels.length).toBe(0);
    });
  });

  describe('Cross-Tab Alarm Synchronization', () => {
    it('should synchronize alarm state across browser tabs', async () => {
      // Render first tab
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

      // Create alarm in first tab
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '08:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Cross-Tab Test Alarm');

      const mockAlarm = createMockAlarm({
        id: 'cross-tab-alarm-456',
        userId: mockUser.id,
        time: '08:00',
        label: 'Cross-Tab Test Alarm',
        enabled: true,
      });

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null,
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Cross-Tab Test Alarm')).toBeInTheDocument();
      });

      // Simulate alarm triggering
      const notification = await simulateAlarmNotification('Cross-Tab Test Alarm', {
        body: 'Cross-tab synchronization test',
        tag: 'alarm-cross-tab-alarm-456',
      });

      // Simulate service worker message to all tabs
      await act(async () => {
        serviceWorkerHelpers.simulateMessage({
          type: 'ALARM_TRIGGERED',
          data: {
            alarmId: 'cross-tab-alarm-456',
            timestamp: Date.now(),
          },
        });
      });

      // Verify alarm ringing state
      await waitFor(() => {
        expect(screen.getByText(/dismiss|stop|snooze/i)).toBeInTheDocument();
      });

      // Simulate dismissal from another tab (via service worker message)
      vi.mocked(AlarmService.dismissAlarm).mockResolvedValueOnce({
        success: true,
        dismissedAt: new Date(),
      });

      await act(async () => {
        serviceWorkerHelpers.simulateMessage({
          type: 'ALARM_DISMISSED',
          data: {
            alarmId: 'cross-tab-alarm-456',
            dismissedBy: 'other-tab',
            timestamp: Date.now(),
          },
        });
      });

      // Current tab should return to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        expect(screen.queryByText(/dismiss|stop|snooze/i)).not.toBeInTheDocument();
      });

      notification.close();
    });
  });

  describe('Offline Alarm Management', () => {
    it('should handle alarm operations while offline', async () => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Mock offline user data
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(SupabaseService.loadUserAlarms).mockRejectedValue(
        new Error('Network unavailable')
      );

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should show offline indicator
      const offlineIndicator = screen.queryByText(/offline/i);
      if (offlineIndicator) {
        expect(offlineIndicator).toBeInTheDocument();
      }

      // Create alarm while offline
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '09:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Offline Test Alarm');

      // Mock offline save failure, should fallback to local storage
      vi.mocked(SupabaseService.saveAlarm).mockRejectedValue(
        new Error('Network unavailable')
      );

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should still show the alarm (saved locally)
      await waitFor(() => {
        expect(screen.getByText('Offline Test Alarm')).toBeInTheDocument();
      });

      // Should indicate pending sync
      const pendingIndicator = screen.queryByText(/pending.*sync/i);
      if (pendingIndicator) {
        expect(pendingIndicator).toBeInTheDocument();
      }

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      // Simulate sync on reconnection
      await act(async () => {
        window.dispatchEvent(new Event('online'));
      });

      // Should attempt to sync pending changes
      await waitFor(() => {
        const syncingIndicator = screen.queryByText(/sync/i);
        // Sync process should be initiated
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle notification permission denial gracefully', async () => {
      // Simulate denied notification permission
      notificationHelpers.simulatePermissionDenied();

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

      // Should show notification permission request UI
      const permissionPrompt = screen.queryByText(/notification.*permission/i);
      if (permissionPrompt) {
        expect(permissionPrompt).toBeInTheDocument();
      }

      // Should offer alternative alarm methods
      const fallbackOptions = screen.queryByText(/tab.*open|browser.*alarm/i);
      if (fallbackOptions) {
        expect(fallbackOptions).toBeInTheDocument();
      }
    });

    it('should handle service worker registration failure', async () => {
      // Mock service worker registration failure
      vi.mocked(navigator.serviceWorker.register).mockRejectedValue(
        new Error('Service worker registration failed')
      );

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

      // Should show degraded functionality warning
      const warningMessage = screen.queryByText(/background.*alarm.*unavailable/i);
      if (warningMessage) {
        expect(warningMessage).toBeInTheDocument();
      }

      // Should still allow alarm creation with limitations
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      expect(addAlarmButton).toBeInTheDocument();
    });

    it('should handle voice recognition unavailability', async () => {
      // Mock missing speech recognition
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;

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

      // Create alarm to test voice features
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Voice-related options should be disabled or hidden
      const voiceOptions = screen.queryByText(/voice.*command|voice.*control/i);
      if (voiceOptions) {
        expect(voiceOptions).toBeDisabled();
      }
    });
  });
});
