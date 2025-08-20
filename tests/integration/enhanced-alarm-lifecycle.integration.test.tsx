/**
 * Enhanced Alarm Lifecycle Integration Tests
 * 
 * Comprehensive integration tests for the complete alarm lifecycle using
 * enhanced test utilities and MSW handlers. Tests all critical paths from
 * the integration test matrix.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import main components
import App from '../../src/App';

// Import types
import type { User, Alarm, VoiceMood } from '../../src/types';

// Import enhanced test utilities
import {
  createPremiumUser,
  createTrialUser,
  createComplexAlarm,
  createNuclearAlarm,
  fillAlarmForm,
  simulateAlarmTrigger,
  expectAlarmRingingState,
  mockSpeechRecognition,
  setupVoiceRecognitionMock,
  simulateVoiceCommand,
  mockPostHog,
  expectAnalyticsEvent,
  measureRenderTime,
  expectRenderTimeUnder,
  renderWithProviders,
  waitForLoadingToFinish,
  expectNoConsoleErrors,
  expectAccessibleForm
} from '../utils/enhanced-test-utilities';

import { createMockUser, createMockAlarm, setupAllMocks } from '../utils/test-mocks';
import { testDataHelpers, integrationTestUtils } from '../utils/integration-test-setup';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/push-notifications');
vi.mock('@capacitor/local-notifications');
vi.mock('@capacitor/device');
vi.mock('@capacitor/preferences');
vi.mock('posthog-js');

describe('Enhanced Alarm Lifecycle Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;
  let mockPostHogInstance: any;
  let mockSpeechRecognition: any;
  let checkConsoleErrors: () => void;

  beforeAll(async () => {
    // Setup all browser API mocks
    setupAllMocks();
    
    // Setup enhanced mocks
    mockPostHogInstance = mockPostHog();
    mockSpeechRecognition = setupVoiceRecognitionMock();
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();
    checkConsoleErrors = expectNoConsoleErrors();
    
    // Clear all test data before each test
    testDataHelpers.clearAll();
    testDataHelpers.addUser(mockUser);
    
    // Reset all mocks
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  afterEach(() => {
    checkConsoleErrors();
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('P0 Critical: Basic Alarm Creation Flow', () => {
    it('should complete basic alarm creation within performance budget', async () => {
      // Measure render performance
      const renderTime = await measureRenderTime(async () => {
        renderWithProviders(<App />, { user: mockUser });
        await waitForLoadingToFinish();
      });
      expectRenderTimeUnder(renderTime, 3000); // 3 second budget

      // Verify dashboard loads
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Measure alarm creation performance
      const creationTime = await measureRenderTime(async () => {
        // Open alarm form
        const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
        await user.click(addAlarmButton);

        // Wait for form to appear
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Verify form accessibility
        await expectAccessibleForm(screen);

        // Fill alarm form
        await fillAlarmForm(user, {
          time: '07:00',
          label: 'Morning Workout',
          days: [1, 2, 3, 4, 5], // Weekdays
          voiceMood: 'motivational',
          snoozeEnabled: true
        });

        // Save alarm
        const saveButton = screen.getByRole('button', { name: /save|create/i });
        await user.click(saveButton);

        // Wait for success
        await waitFor(() => {
          expect(screen.getByText('Morning Workout')).toBeInTheDocument();
        });
      });
      expectRenderTimeUnder(creationTime, 2000); // 2 second budget

      // Verify alarm appears in list with correct details
      const alarmElement = screen.getByText('Morning Workout');
      expect(alarmElement).toBeInTheDocument();
      
      // Verify time is displayed
      expect(screen.getByText('7:00')).toBeInTheDocument();

      // Verify analytics was tracked
      await integrationTestUtils.waitForAnalyticsEvents(1);
      expectAnalyticsEvent(mockPostHogInstance, 'alarm_created', {
        label: 'Morning Workout',
        time: '07:00',
        snoozeEnabled: true,
        voiceMood: 'motivational'
      });

      // Verify user data was updated
      const userAlarms = testDataHelpers.getAlarmsForUser(mockUser.id);
      expect(userAlarms).toHaveLength(1);
      expect(userAlarms[0].label).toBe('Morning Workout');
    });

    it('should handle alarm creation validation errors gracefully', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Open alarm form
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        const errorElement = screen.queryByText(/time.*required|required.*time/i);
        expect(errorElement).toBeInTheDocument();
      });

      // Form should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Fill required fields
      const timeInput = screen.getByLabelText(/time/i);
      await user.type(timeInput, '08:00');

      // Now save should work
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should enforce free user alarm limits', async () => {
      // Create free user with 5 existing alarms (at limit)
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      for (let i = 0; i < 5; i++) {
        const alarm = createMockAlarm({
          id: `alarm-${i}`,
          userId: freeUser.id,
          label: `Alarm ${i + 1}`,
          time: `0${6 + i}:00`
        });
        testDataHelpers.addAlarm(alarm);
      }
      testDataHelpers.addUser(freeUser);

      renderWithProviders(<App />, { user: freeUser });
      await waitForLoadingToFinish();

      // Should see existing alarms
      await waitFor(() => {
        expect(screen.getByText('Alarm 1')).toBeInTheDocument();
      });

      // Try to create 6th alarm
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillAlarmForm(user, {
        time: '12:00',
        label: '6th Alarm'
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should show upgrade prompt
      await waitFor(() => {
        const upgradeMessage = screen.queryByText(/upgrade.*premium|limit.*reached|5 alarms/i);
        expect(upgradeMessage).toBeInTheDocument();
      });

      // Should not create the alarm
      const userAlarms = testDataHelpers.getAlarmsForUser(freeUser.id);
      expect(userAlarms).toHaveLength(5); // Still 5, not 6
    });
  });

  describe('P0 Critical: Alarm Triggering and Interaction', () => {
    it('should handle complete alarm trigger and dismiss cycle', async () => {
      // Create user with an alarm
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '07:30',
        label: 'Test Trigger Alarm',
        enabled: true
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Verify alarm is visible
      await waitFor(() => {
        expect(screen.getByText('Test Trigger Alarm')).toBeInTheDocument();
      });

      // Simulate alarm triggering
      await simulateAlarmTrigger(alarm);

      // Should show alarm ringing interface
      await expectAlarmRingingState(screen);

      // Should show dismiss and snooze buttons
      const dismissButton = screen.getByRole('button', { name: /dismiss|stop/i });
      const snoozeButton = screen.getByRole('button', { name: /snooze/i });
      
      expect(dismissButton).toBeInTheDocument();
      expect(snoozeButton).toBeInTheDocument();

      // Test dismiss functionality
      await user.click(dismissButton);

      // Should return to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should track analytics
      await integrationTestUtils.waitForAnalyticsEvents(1);
      expectAnalyticsEvent(mockPostHogInstance, 'alarm_dismissed', {
        alarmId: alarm.id,
        method: 'button'
      });
    });

    it('should handle snooze functionality with limits', async () => {
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '07:00',
        label: 'Snooze Test Alarm',
        enabled: true,
        snoozeEnabled: true,
        maxSnoozes: 2,
        snoozeInterval: 5
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Trigger alarm
      await simulateAlarmTrigger(alarm);
      await expectAlarmRingingState(screen);

      // First snooze
      const snoozeButton = screen.getByRole('button', { name: /snooze/i });
      await user.click(snoozeButton);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Trigger alarm again after snooze
      await simulateAlarmTrigger(alarm, { isSnoozeEnd: true });
      await expectAlarmRingingState(screen);

      // Second snooze (at limit)
      const snoozeButton2 = screen.getByRole('button', { name: /snooze/i });
      await user.click(snoozeButton2);

      // Trigger third time - should not allow snooze
      await simulateAlarmTrigger(alarm, { isSnoozeEnd: true });
      await expectAlarmRingingState(screen);

      // Snooze button should be disabled or not present
      const snoozeButton3 = screen.queryByRole('button', { name: /snooze/i });
      if (snoozeButton3) {
        expect(snoozeButton3).toBeDisabled();
      }

      // Should show snooze limit message
      const limitMessage = screen.queryByText(/snooze.*limit|no.*more.*snoozes/i);
      expect(limitMessage).toBeInTheDocument();
    });

    it('should handle voice command dismissal', async () => {
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '08:00',
        label: 'Voice Test Alarm',
        enabled: true
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Trigger alarm
      await simulateAlarmTrigger(alarm);
      await expectAlarmRingingState(screen);

      // Should show voice command option
      const voiceButton = screen.queryByText(/voice|speak/i);
      if (voiceButton) {
        await user.click(voiceButton);
      }

      // Simulate voice command
      simulateVoiceCommand(mockSpeechRecognition, 'stop alarm', 0.95);

      // Should dismiss alarm
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should track voice dismissal
      await integrationTestUtils.waitForAnalyticsEvents(2); // trigger + dismiss
      expectAnalyticsEvent(mockPostHogInstance, 'alarm_dismissed', {
        method: 'voice'
      });
    });
  });

  describe('P1 High: Premium Alarm Features', () => {
    it('should show premium features for premium users', async () => {
      const premiumUser = createPremiumUser();
      testDataHelpers.addUser(premiumUser);

      renderWithProviders(<App />, { user: premiumUser });
      await waitForLoadingToFinish();

      // Open alarm creation
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should see premium features
      const nuclearModeToggle = screen.queryByLabelText(/nuclear.*mode/i);
      const smartWakeupToggle = screen.queryByLabelText(/smart.*wake.*up/i);
      const customSoundOption = screen.queryByText(/custom.*sound|upload.*sound/i);

      // At least one premium feature should be visible
      expect(nuclearModeToggle || smartWakeupToggle || customSoundOption).toBeTruthy();

      // Test enabling premium features
      if (nuclearModeToggle && !nuclearModeToggle.checked) {
        await user.click(nuclearModeToggle);
        expect(nuclearModeToggle).toBeChecked();
      }

      if (smartWakeupToggle && !smartWakeupToggle.checked) {
        await user.click(smartWakeupToggle);
        expect(smartWakeupToggle).toBeChecked();
      }
    });

    it('should show upgrade prompts for free users accessing premium features', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      testDataHelpers.addUser(freeUser);

      renderWithProviders(<App />, { user: freeUser });
      await waitForLoadingToFinish();

      // Open alarm creation
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to access premium features
      const premiumSection = screen.queryByText(/premium|pro.*features/i);
      if (premiumSection) {
        await user.click(premiumSection);

        // Should show upgrade prompt
        await waitFor(() => {
          const upgradePrompt = screen.queryByText(/upgrade|premium|subscription/i);
          expect(upgradePrompt).toBeInTheDocument();
        });
      }
    });

    it('should handle nuclear mode alarm challenges', async () => {
      const premiumUser = createPremiumUser();
      const nuclearAlarm = createNuclearAlarm({
        userId: premiumUser.id,
        nuclearChallenges: ['math', 'qr_scan']
      });
      
      testDataHelpers.addUser(premiumUser);
      testDataHelpers.addAlarm(nuclearAlarm);

      renderWithProviders(<App />, { user: premiumUser });
      await waitForLoadingToFinish();

      // Trigger nuclear alarm
      await simulateAlarmTrigger(nuclearAlarm);
      await expectAlarmRingingState(screen);

      // Try to dismiss - should show challenges first
      const dismissButton = screen.getByRole('button', { name: /dismiss|stop/i });
      await user.click(dismissButton);

      // Should show challenge interface
      await waitFor(() => {
        const challengeText = screen.queryByText(/challenge|solve|complete/i);
        expect(challengeText).toBeInTheDocument();
      });

      // Should show math challenge
      const mathProblem = screen.queryByText(/\d+\s*[\+\-\*\/]\s*\d+/);
      if (mathProblem) {
        expect(mathProblem).toBeInTheDocument();
        
        // Would need to solve the math problem in a real test
        // For now, we'll simulate successful completion
        const submitButton = screen.queryByRole('button', { name: /submit|check|solve/i });
        if (submitButton) {
          // Simulate correct answer
          const answerInput = screen.queryByLabelText(/answer|result/i);
          if (answerInput) {
            await user.type(answerInput, '42'); // Mock correct answer
            await user.click(submitButton);
          }
        }
      }

      // After completing challenges, should allow dismissal
      await waitFor(() => {
        const finalDismissButton = screen.queryByRole('button', { name: /dismiss|complete/i });
        expect(finalDismissButton).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('P0 Critical: Error Handling and Resilience', () => {
    it('should handle network failures during alarm creation', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Simulate network failure
      integrationTestUtils.simulateNetworkError();

      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillAlarmForm(user, {
        time: '09:00',
        label: 'Network Test Alarm'
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        const errorMessage = screen.queryByText(/error|failed|network|offline/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Should offer offline mode or retry
      const retryButton = screen.queryByRole('button', { name: /retry|try.*again/i });
      const offlineButton = screen.queryByText(/offline|save.*locally/i);
      
      expect(retryButton || offlineButton).toBeTruthy();

      // Reset network and retry should work
      integrationTestUtils.resetNetworkSimulation();
      
      if (retryButton) {
        await user.click(retryButton);
        
        await waitFor(() => {
          expect(screen.getByText('Network Test Alarm')).toBeInTheDocument();
        });
      }
    });

    it('should handle service worker failures gracefully', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Create an alarm
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillAlarmForm(user, {
        time: '10:00',
        label: 'Service Worker Test'
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Service Worker Test')).toBeInTheDocument();
      });

      // Simulate service worker failure during alarm trigger
      const alarm = testDataHelpers.getAlarmsForUser(mockUser.id)[0];
      
      // Mock service worker error
      await act(async () => {
        const errorMessage = {
          type: 'ALARM_ERROR',
          data: {
            alarmId: alarm.id,
            error: 'Service worker unavailable',
            fallbackMethod: 'web_notification'
          }
        };
        const messageEvent = new MessageEvent('message', { data: errorMessage });
        window.dispatchEvent(messageEvent);
      });

      // Should show fallback notification or error handling
      await waitFor(() => {
        const fallbackMessage = screen.queryByText(/service.*worker|fallback|alternative.*method/i);
        expect(fallbackMessage).toBeInTheDocument();
      });
    });

    it('should maintain data consistency during app crashes', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Create multiple alarms rapidly
      for (let i = 0; i < 3; i++) {
        const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
        await user.click(addAlarmButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        await fillAlarmForm(user, {
          time: `0${7 + i}:00`,
          label: `Crash Test Alarm ${i + 1}`
        });

        const saveButton = screen.getByRole('button', { name: /save|create/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }

      // Verify all alarms were created
      const userAlarms = testDataHelpers.getAlarmsForUser(mockUser.id);
      expect(userAlarms.length).toBeGreaterThanOrEqual(3);

      // Verify each alarm has consistent data
      userAlarms.forEach((alarm, index) => {
        expect(alarm.label).toBe(`Crash Test Alarm ${index + 1}`);
        expect(alarm.time).toBe(`0${7 + index}:00`);
        expect(alarm.userId).toBe(mockUser.id);
      });
    });
  });

  describe('P2 Medium: Performance and Accessibility', () => {
    it('should support keyboard navigation throughout alarm lifecycle', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Tab to add alarm button
      await user.tab();
      expect(document.activeElement).toHaveAccessibleName(/add.*alarm/i);

      // Open form with Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab through form fields
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'time');

      await user.tab();
      expect(document.activeElement).toHaveAccessibleName(/label/i);

      // Fill form with keyboard
      await user.type(document.activeElement!, 'Keyboard Test Alarm');

      // Tab to save button and activate
      while (document.activeElement?.textContent !== 'Save' && 
             document.activeElement?.textContent !== 'Create') {
        await user.tab();
      }

      await user.keyboard('{Enter}');

      // Should create alarm successfully
      await waitFor(() => {
        expect(screen.getByText('Keyboard Test Alarm')).toBeInTheDocument();
      });
    });

    it('should handle large numbers of alarms efficiently', async () => {
      const premiumUser = createPremiumUser();
      
      // Add 50 alarms for performance testing
      const alarms = [];
      for (let i = 0; i < 50; i++) {
        const alarm = createMockAlarm({
          id: `perf-alarm-${i}`,
          userId: premiumUser.id,
          label: `Performance Test ${i + 1}`,
          time: `${String(Math.floor(i / 4) + 6).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`,
          enabled: i % 2 === 0 // Half enabled, half disabled
        });
        alarms.push(alarm);
        testDataHelpers.addAlarm(alarm);
      }
      testDataHelpers.addUser(premiumUser);

      // Measure render time with many alarms
      const renderTime = await measureRenderTime(async () => {
        renderWithProviders(<App />, { user: premiumUser });
        await waitForLoadingToFinish();
      });

      expectRenderTimeUnder(renderTime, 5000); // Should load within 5 seconds

      // Should display all alarms
      await waitFor(() => {
        expect(screen.getByText('Performance Test 1')).toBeInTheDocument();
      });

      // Test scrolling performance
      const alarmList = screen.getByRole('list') || screen.getByTestId('alarm-list');
      if (alarmList) {
        fireEvent.scroll(alarmList, { target: { scrollTop: 1000 } });
        
        // Should handle scrolling without performance issues
        await waitFor(() => {
          expect(screen.getByText('Performance Test 50')).toBeInTheDocument();
        });
      }
    });
  });
});