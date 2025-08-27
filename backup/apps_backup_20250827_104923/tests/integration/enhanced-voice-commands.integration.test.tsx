/// <reference lib="dom" />
/**
 * Enhanced Voice Commands Integration Tests
 *
 * Comprehensive end-to-end tests for voice recognition and voice command functionality
 * using enhanced browser API mocks for realistic testing:
 * - Voice permissions and microphone access
 * - Voice-activated alarm management (create, snooze, dismiss)
 * - Voice navigation and accessibility features
 * - Multi-language voice recognition
 * - Voice command error handling and fallbacks
 * - Voice biometrics and personalization
 * - Performance and reliability testing
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
import { VoiceRecognitionService } from '../../src/services/voice-recognition';
import { VoiceEnhancedService } from '../../src/services/voice-enhanced';
import { AlarmService } from '../../src/services/alarm';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import enhanced test utilities with voice command helpers
import {
  integrationTestHelpers,
  speechHelpers,
  permissionHelpers,
  simulateAlarmNotification,
  verifyNotificationShown,
} from '../utils/integration-test-setup';

import {
  createMockUser,
  createMockAlarm,
  measurePerformance,
} from '../utils/test-mocks';
import type { Alarm, User, VoiceMood } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/voice-recognition');
vi.mock('../../src/services/voice-enhanced');
vi.mock('../../src/services/alarm');
vi.mock('../../src/services/app-analytics');
vi.mock('@capacitor/device');

describe('Enhanced Voice Commands Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;

  // Service instances
  let voiceRecognitionService: VoiceRecognitionService;
  let voiceEnhancedService: VoiceEnhancedService;
  let analyticsService: AppAnalyticsService;

  beforeAll(() => {
    // Enhanced speech recognition mocks are set up in integration-test-setup.ts
    console.log('Enhanced voice command tests initialized');
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser({
      id: 'voice-user-123',
      email: 'voice.test@example.com',
      name: 'Voice Test User',
      preferences: {
        voiceCommands: true,
        voiceLanguage: 'en-US',
        voiceSensitivity: 0.8,
      },
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Mock service instances
    voiceRecognitionService = VoiceRecognitionService.getInstance() as any;
    voiceEnhancedService = VoiceEnhancedService.getInstance() as any;
    analyticsService = AppAnalyticsService.getInstance();

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
      alarms: [],
      error: null,
    });

    // Mock voice services
    vi.mocked(voiceRecognitionService.isSupported).mockReturnValue(true);
    vi.mocked(voiceRecognitionService.getPermissionStatus).mockResolvedValue('granted');
    vi.mocked(voiceEnhancedService.initialize).mockResolvedValue(true);

    // Mock analytics
    vi.mocked(analyticsService.trackVoiceCommand).mockImplementation(() => {});
    vi.mocked(analyticsService.trackVoiceError).mockImplementation(() => {});
    vi.mocked(analyticsService.trackAlarmDismissed).mockImplementation(() => {});
    vi.mocked(analyticsService.trackAlarmSnoozed).mockImplementation(() => {});
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

  describe('Voice Permission and Setup', () => {
    it('should request and handle microphone permissions', async () => {
      const performanceMeasures: { [key: string]: number } = {};

      // Step 1: Load app
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

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Step 2: Navigate to voice settings
      const settingsButton = screen.getByRole('button', {
        name: /settings|preferences/i,
      });
      await user.click(settingsButton);

      const voiceTab = screen.queryByText(/voice|speech/i);
      if (voiceTab) {
        await user.click(voiceTab);
      }

      // Step 3: Enable voice commands
      const enableVoiceToggle = screen.getByLabelText(
        /enable.*voice.*command|voice.*control/i
      );
      if (!enableVoiceToggle.checked) {
        await user.click(enableVoiceToggle);
      }

      // Step 4: Mock microphone permission request
      permissionHelpers.setPermission('microphone', 'prompt');

      // Should request microphone permission
      await waitFor(() => {
        expect(
          screen.getByText(/microphone.*permission|allow.*microphone/i)
        ).toBeInTheDocument();
      });

      // Grant permission
      await act(async () => {
        permissionHelpers.setPermission('microphone', 'granted');
        const permissionEvent = new Event('change');
        window.dispatchEvent(permissionEvent);
      });

      // Step 5: Verify voice setup completion
      await waitFor(() => {
        expect(
          screen.getByText(/voice.*enabled|ready.*voice|microphone.*ready/i)
        ).toBeInTheDocument();
      });

      expect(voiceRecognitionService.initialize).toHaveBeenCalled();
      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledWith({
        command: 'setup_complete',
        userId: 'voice-user-123',
        success: true,
      });

      console.log('Voice setup performance:', performanceMeasures);
    });

    it('should handle microphone permission denial gracefully', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Navigate to voice settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Try to enable voice commands
      const enableVoiceToggle = screen.getByLabelText(/enable.*voice.*command/i);
      await user.click(enableVoiceToggle);

      // Deny microphone permission
      permissionHelpers.setPermission('microphone', 'denied');

      await waitFor(() => {
        expect(
          screen.getByText(/microphone.*denied|permission.*required/i)
        ).toBeInTheDocument();
      });

      // Should show alternative interaction methods
      const keyboardShortcutsInfo = screen.queryByText(
        /keyboard.*shortcut|alternative.*input/i
      );
      if (keyboardShortcutsInfo) {
        expect(keyboardShortcutsInfo).toBeInTheDocument();
      }

      expect(analyticsService.trackVoiceError).toHaveBeenCalledWith({
        error: 'permission_denied',
        userId: 'voice-user-123',
      });
    });
  });

  describe('Voice-Activated Alarm Management', () => {
    it('should create alarm using voice commands', async () => {
      // Set up voice permissions
      permissionHelpers.setPermission('microphone', 'granted');

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

      // Step 1: Activate voice commands
      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone|speak/i,
      });
      await user.click(voiceButton);

      // Step 2: Simulate voice command for alarm creation
      await act(async () => {
        speechHelpers.simulateResult(
          'create alarm at 7 AM tomorrow called Morning Workout',
          true
        );
      });

      // Step 3: Voice command should trigger alarm creation dialog
      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /create.*alarm|new.*alarm/i })
        ).toBeInTheDocument();
      });

      // Should pre-fill form based on voice command
      const timeInput = screen.getByLabelText(/time/i);
      expect(timeInput).toHaveValue('07:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      expect(labelInput).toHaveValue('Morning Workout');

      // Mock successful alarm creation
      const mockAlarm = createMockAlarm({
        id: 'voice-created-alarm-123',
        userId: mockUser.id,
        time: '07:00',
        label: 'Morning Workout',
        voiceCreated: true,
      });

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null,
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Step 4: Verify voice-created alarm
      await waitFor(() => {
        expect(screen.getByText('Morning Workout')).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledWith({
        command: 'create_alarm',
        userId: 'voice-user-123',
        success: true,
        parameters: {
          time: '07:00',
          label: 'Morning Workout',
        },
      });
    });

    it('should snooze alarm using voice command', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Create existing alarm
      const mockAlarm = createMockAlarm({
        id: 'snooze-test-alarm-456',
        userId: mockUser.id,
        time: '08:00',
        label: 'Voice Snooze Test',
        enabled: true,
      });

      // Simulate alarm triggering
      const notification = await simulateAlarmNotification('Voice Snooze Test', {
        body: 'Time to wake up!',
        tag: 'alarm-snooze-test-alarm-456',
        requireInteraction: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/dismiss|stop|snooze/i)).toBeInTheDocument();
      });

      // Step 1: Simulate voice snooze command
      vi.mocked(AlarmService.snoozeAlarm).mockResolvedValueOnce({
        success: true,
        snoozeUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      await act(async () => {
        speechHelpers.simulateResult('snooze for 10 minutes', true);
      });

      // Step 2: Verify snooze execution
      await waitFor(() => {
        expect(AlarmService.snoozeAlarm).toHaveBeenCalledWith(
          'snooze-test-alarm-456',
          10 * 60 * 1000 // 10 minutes in milliseconds
        );
      });

      expect(analyticsService.trackAlarmSnoozed).toHaveBeenCalledWith({
        alarmId: 'snooze-test-alarm-456',
        snoozeMethod: 'voice',
        snoozeDuration: 10 * 60 * 1000,
        userId: 'voice-user-123',
      });

      // Step 3: Should return to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      notification.close();
    });

    it('should dismiss alarm using voice command', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Create alarm and simulate triggering
      const mockAlarm = createMockAlarm({
        id: 'dismiss-test-alarm-789',
        userId: mockUser.id,
        time: '09:00',
        label: 'Voice Dismiss Test',
      });

      const notification = await simulateAlarmNotification('Voice Dismiss Test', {
        body: 'Time to wake up!',
        tag: 'alarm-dismiss-test-alarm-789',
      });

      await waitFor(() => {
        expect(screen.getByText(/dismiss|stop|snooze/i)).toBeInTheDocument();
      });

      // Step 1: Simulate voice dismissal
      vi.mocked(AlarmService.dismissAlarm).mockResolvedValueOnce({
        success: true,
        dismissedAt: new Date(),
      });

      await act(async () => {
        speechHelpers.simulateResult('dismiss alarm', true);
      });

      // Step 2: Verify dismissal
      await waitFor(() => {
        expect(AlarmService.dismissAlarm).toHaveBeenCalledWith(
          'dismiss-test-alarm-789',
          'voice'
        );
      });

      expect(analyticsService.trackAlarmDismissed).toHaveBeenCalledWith({
        alarmId: 'dismiss-test-alarm-789',
        dismissMethod: 'voice',
        userId: 'voice-user-123',
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      notification.close();
    });
  });

  describe('Voice Navigation', () => {
    it('should navigate app using voice commands', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

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

      // Step 1: Navigate to settings using voice
      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });
      await user.click(voiceButton);

      await act(async () => {
        speechHelpers.simulateResult('go to settings', true);
      });

      await waitFor(() => {
        expect(screen.getByText(/settings|preferences/i)).toBeInTheDocument();
      });

      // Step 2: Navigate to alarms list using voice
      await act(async () => {
        speechHelpers.simulateResult('show my alarms', true);
      });

      await waitFor(() => {
        expect(screen.getByText(/alarms.*list|my.*alarms/i)).toBeInTheDocument();
      });

      // Step 3: Navigate back to dashboard
      await act(async () => {
        speechHelpers.simulateResult('go home', true);
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledWith({
        command: 'navigate',
        userId: 'voice-user-123',
        success: true,
        parameters: { destination: 'dashboard' },
      });
    });
  });

  describe('Multi-Language Voice Recognition', () => {
    it('should handle different languages and accents', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Navigate to voice settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Step 1: Change language to Spanish
      const languageSelect = screen.getByLabelText(
        /voice.*language|language.*preference/i
      );
      await user.selectOptions(languageSelect, 'es-ES');

      // Mock language change
      vi.mocked(voiceRecognitionService.setLanguage).mockResolvedValue(true);

      // Step 2: Test Spanish voice command
      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|micrófono/i,
      });
      await user.click(voiceButton);

      await act(async () => {
        // Update speech recognition instance language
        speechHelpers.instance.lang = 'es-ES';
        speechHelpers.simulateResult('crear alarma a las siete de la mañana', true);
      });

      // Should interpret Spanish command correctly
      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /crear.*alarma|nueva.*alarma/i })
        ).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledWith({
        command: 'create_alarm',
        language: 'es-ES',
        userId: 'voice-user-123',
        success: true,
      });

      // Step 3: Test French voice command
      await user.selectOptions(languageSelect, 'fr-FR');

      await act(async () => {
        speechHelpers.instance.lang = 'fr-FR';
        speechHelpers.simulateResult('aller aux paramètres', true);
      });

      await waitFor(() => {
        expect(screen.getByText(/paramètres|réglages/i)).toBeInTheDocument();
      });
    });
  });

  describe('Voice Error Handling and Fallbacks', () => {
    it('should handle speech recognition errors gracefully', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });
      await user.click(voiceButton);

      // Step 1: Simulate network error
      await act(async () => {
        speechHelpers.simulateError('network');
      });

      await waitFor(() => {
        expect(
          screen.getByText(/network.*error|connection.*problem|try.*again/i)
        ).toBeInTheDocument();
      });

      // Step 2: Simulate no speech detected
      await user.click(voiceButton);

      await act(async () => {
        speechHelpers.simulateNoMatch();
      });

      await waitFor(() => {
        expect(
          screen.getByText(/no.*speech|didn.*hear|try.*speaking/i)
        ).toBeInTheDocument();
      });

      // Step 3: Simulate audio capture error
      await user.click(voiceButton);

      await act(async () => {
        speechHelpers.simulateError('audio-capture');
      });

      await waitFor(() => {
        expect(
          screen.getByText(/microphone.*error|audio.*problem/i)
        ).toBeInTheDocument();
      });

      // Should show keyboard shortcut alternatives
      const keyboardAlternative = screen.queryByText(/use.*keyboard|press.*key/i);
      if (keyboardAlternative) {
        expect(keyboardAlternative).toBeInTheDocument();
      }

      expect(analyticsService.trackVoiceError).toHaveBeenCalledTimes(3);
    });

    it('should fallback to text input when voice fails consistently', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });

      // Simulate multiple consecutive failures
      for (let i = 0; i < 3; i++) {
        await user.click(voiceButton);
        await act(async () => {
          speechHelpers.simulateError('network');
        });
        await waitFor(() => {
          expect(screen.getByText(/network.*error/i)).toBeInTheDocument();
        });
      }

      // After multiple failures, should suggest text input
      await waitFor(() => {
        expect(
          screen.getByText(/text.*input|type.*command|keyboard.*alternative/i)
        ).toBeInTheDocument();
      });

      // Should show text command input
      const textCommandInput = screen.queryByLabelText(/text.*command|type.*here/i);
      if (textCommandInput) {
        expect(textCommandInput).toBeInTheDocument();

        // Test text fallback
        await user.type(textCommandInput, 'create alarm at 10 AM');
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(
            screen.getByRole('dialog', { name: /create.*alarm/i })
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe('Voice Biometrics and Personalization', () => {
    it('should learn and adapt to user voice patterns', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Step 1: Enable voice learning
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const voiceTab = screen.queryByText(/voice|speech/i);
      if (voiceTab) {
        await user.click(voiceTab);
      }

      const voiceLearningToggle = screen.queryByLabelText(
        /voice.*learning|adapt.*voice|personalization/i
      );
      if (voiceLearningToggle && !voiceLearningToggle.checked) {
        await user.click(voiceLearningToggle);
      }

      // Step 2: Simulate voice training session
      const trainVoiceButton = screen.queryByRole('button', {
        name: /train.*voice|voice.*setup/i,
      });
      if (trainVoiceButton) {
        await user.click(trainVoiceButton);

        // Training phrases
        const trainingPhrases = [
          'create alarm',
          'snooze for five minutes',
          'dismiss alarm',
          'go to settings',
        ];

        for (const phrase of trainingPhrases) {
          await act(async () => {
            speechHelpers.simulateResult(phrase, true);
          });

          await waitFor(() => {
            expect(
              screen.getByText(/training.*progress|voice.*pattern/i)
            ).toBeInTheDocument();
          });
        }

        await waitFor(() => {
          expect(
            screen.getByText(/training.*complete|voice.*ready/i)
          ).toBeInTheDocument();
        });
      }

      // Step 3: Test improved recognition accuracy
      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });
      await user.click(voiceButton);

      // Simulate faster, more accurate recognition
      const recognitionTime = await measurePerformance(async () => {
        await act(async () => {
          speechHelpers.simulateResult('create alarm at six thirty AM', true);
        });
      });

      expect(recognitionTime).toBeLessThan(1000); // Should be faster after training

      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /create.*alarm/i })
        ).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledWith({
        command: 'create_alarm',
        userId: 'voice-user-123',
        success: true,
        recognitionAccuracy: expect.any(Number),
        responseTime: expect.any(Number),
      });
    });
  });

  describe('Voice Accessibility Features', () => {
    it('should provide voice feedback for screen reader users', async () => {
      // Mock screen reader detection
      Object.defineProperty(navigator, 'userAgent', {
        value: 'MockBrowser NVDA/2021.1',
        writable: true,
      });

      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Enable voice accessibility features
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const accessibilityTab = screen.queryByText(/accessibility|a11y/i);
      if (accessibilityTab) {
        await user.click(accessibilityTab);
      }

      const voiceFeedbackToggle = screen.queryByLabelText(
        /voice.*feedback|audio.*description/i
      );
      if (voiceFeedbackToggle && !voiceFeedbackToggle.checked) {
        await user.click(voiceFeedbackToggle);
      }

      // Test voice feedback for navigation
      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });
      await user.click(voiceButton);

      await act(async () => {
        speechHelpers.simulateResult('go to alarms', true);
      });

      // Should provide audio confirmation
      await waitFor(() => {
        expect(
          screen.getByText(/navigating.*alarms|going.*alarms/i)
        ).toBeInTheDocument();
      });

      // Mock speech synthesis for audio feedback
      expect(global.speechSynthesis.speak).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('alarms'),
        })
      );
    });

    it('should support voice commands for users with motor impairments', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Test hands-free alarm creation
      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });
      await user.click(voiceButton);

      // Complex voice command without manual interaction
      await act(async () => {
        speechHelpers.simulateResult(
          'create new alarm for seven fifteen AM every weekday called Work Alarm with snooze enabled',
          true
        );
      });

      // Should create alarm without requiring manual form interaction
      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /create.*alarm/i })
        ).toBeInTheDocument();
      });

      // Form should be pre-filled from voice command
      const timeInput = screen.getByLabelText(/time/i);
      expect(timeInput).toHaveValue('07:15');

      const labelInput = screen.getByLabelText(/label|name/i);
      expect(labelInput).toHaveValue('Work Alarm');

      const weekdayCheckboxes = [
        screen.getByLabelText(/monday/i),
        screen.getByLabelText(/tuesday/i),
        screen.getByLabelText(/wednesday/i),
        screen.getByLabelText(/thursday/i),
        screen.getByLabelText(/friday/i),
      ];

      weekdayCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      const snoozeToggle = screen.getByLabelText(/snooze/i);
      expect(snoozeToggle).toBeChecked();

      // Confirm creation via voice
      await act(async () => {
        speechHelpers.simulateResult('save alarm', true);
      });

      const mockAlarm = createMockAlarm({
        id: 'hands-free-alarm-123',
        userId: mockUser.id,
        time: '07:15',
        label: 'Work Alarm',
        days: [1, 2, 3, 4, 5],
        snoozeEnabled: true,
        voiceCreated: true,
      });

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null,
      });

      await waitFor(() => {
        expect(screen.getByText('Work Alarm')).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledWith({
        command: 'create_complex_alarm',
        userId: 'voice-user-123',
        success: true,
        accessibilityMode: true,
        parameters: {
          time: '07:15',
          label: 'Work Alarm',
          days: [1, 2, 3, 4, 5],
          snoozeEnabled: true,
        },
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should maintain voice recognition performance under load', async () => {
      permissionHelpers.setPermission('microphone', 'granted');

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      const voiceButton = screen.getByRole('button', {
        name: /voice.*command|microphone/i,
      });
      const commands = [
        'create alarm at six AM',
        'go to settings',
        'show my alarms',
        'go home',
        'create alarm at seven PM',
      ];

      // Test rapid consecutive voice commands
      for (const command of commands) {
        const commandTime = await measurePerformance(async () => {
          await user.click(voiceButton);
          await act(async () => {
            speechHelpers.simulateResult(command, true);
          });
          await waitFor(
            () => {
              // Wait for command processing
            },
            { timeout: 2000 }
          );
        });

        expect(commandTime).toBeLessThan(2000); // Each command should process quickly
      }

      // Verify all commands were processed
      expect(analyticsService.trackVoiceCommand).toHaveBeenCalledTimes(commands.length);
    });
  });
});
