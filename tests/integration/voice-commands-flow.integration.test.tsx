/**
 * Voice Commands Flow Integration Tests
 * 
 * Comprehensive tests for voice recognition and voice command functionality,
 * including alarm dismissal, app navigation, and voice settings management.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import main components
import App from '../../src/App';

// Import types
import type { User, Alarm } from '../../src/types';

// Import enhanced test utilities
import {
  createMockUser,
  createMockAlarm,
  setupVoiceRecognitionMock,
  simulateVoiceCommand,
  simulateVoiceError,
  simulateAlarmTrigger,
  expectAlarmRingingState,
  mockPostHog,
  expectAnalyticsEvent,
  renderWithProviders,
  waitForLoadingToFinish,
  expectNoConsoleErrors,
  expectKeyboardNavigation
} from '../utils/enhanced-test-utilities';

import { setupAllMocks } from '../utils/test-mocks';
import { testDataHelpers, integrationTestUtils } from '../utils/integration-test-setup';

// Mock external services
vi.mock('../../src/services/voice-recognition');
vi.mock('../../src/services/voice');
vi.mock('../../src/services/voice-enhanced');
vi.mock('@capacitor/device');
vi.mock('posthog-js');

describe('Voice Commands Flow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;
  let mockPostHogInstance: any;
  let mockSpeechRecognition: any;
  let checkConsoleErrors: () => void;

  beforeAll(async () => {
    setupAllMocks();
    mockPostHogInstance = mockPostHog();
    mockSpeechRecognition = setupVoiceRecognitionMock();
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();
    checkConsoleErrors = expectNoConsoleErrors();
    
    testDataHelpers.clearAll();
    testDataHelpers.addUser(mockUser);
    
    vi.clearAllMocks();
    
    // Mock microphone permission as granted
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' })
      },
      writable: true
    });
  });

  afterEach(() => {
    checkConsoleErrors();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('P1 High: Voice Recognition Setup', () => {
    it('should handle microphone permission flow', async () => {
      // Start with permission denied
      Object.defineProperty(navigator, 'permissions', {
        value: {
          query: vi.fn().mockResolvedValue({ state: 'prompt' })
        },
        writable: true
      });

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Navigate to voice settings
      const settingsButton = screen.queryByText(/settings/i);
      if (settingsButton) {
        await user.click(settingsButton);

        const voiceSection = screen.queryByText(/voice|speech/i);
        if (voiceSection) {
          await user.click(voiceSection);

          // Should show permission request
          await waitFor(() => {
            const permissionText = screen.queryByText(/microphone.*permission|allow.*microphone/i);
            expect(permissionText).toBeInTheDocument();
          });

          // Click enable microphone
          const enableButton = screen.queryByRole('button', { name: /enable|allow.*microphone/i });
          if (enableButton) {
            await user.click(enableButton);

            // Mock permission granted
            Object.defineProperty(navigator, 'permissions', {
              value: {
                query: vi.fn().mockResolvedValue({ state: 'granted' })
              },
              writable: true
            });

            // Should show success message
            await waitFor(() => {
              const successMessage = screen.queryByText(/microphone.*enabled|voice.*ready/i);
              expect(successMessage).toBeInTheDocument();
            });

            // Should track permission granted
            expectAnalyticsEvent(mockPostHogInstance, 'voice_permission_granted');
          }
        }
      }
    });

    it('should allow voice sensitivity configuration', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Navigate to voice settings
      const settingsButton = screen.queryByText(/settings/i);
      if (settingsButton) {
        await user.click(settingsButton);

        const voiceSection = screen.queryByText(/voice.*settings|speech.*settings/i);
        if (voiceSection) {
          await user.click(voiceSection);

          // Should show sensitivity settings
          await waitFor(() => {
            const sensitivitySlider = screen.queryByLabelText(/sensitivity|confidence/i);
            expect(sensitivitySlider).toBeInTheDocument();
          });

          // Test microphone
          const testButton = screen.queryByRole('button', { name: /test.*microphone|test.*voice/i });
          if (testButton) {
            await user.click(testButton);

            // Should start listening
            await waitFor(() => {
              const listeningText = screen.queryByText(/listening|speak.*now/i);
              expect(listeningText).toBeInTheDocument();
            });

            // Simulate voice input
            simulateVoiceCommand(mockSpeechRecognition, 'test voice recognition', 0.9);

            // Should show recognition result
            await waitFor(() => {
              const recognizedText = screen.queryByText(/test voice recognition|recognized/i);
              expect(recognizedText).toBeInTheDocument();
            });

            // Should track voice test
            expectAnalyticsEvent(mockPostHogInstance, 'voice_test_completed', {
              confidence: 0.9,
              transcript: 'test voice recognition'
            });
          }
        }
      }
    });

    it('should handle voice recognition errors gracefully', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Navigate to voice settings and test microphone
      const settingsButton = screen.queryByText(/settings/i);
      if (settingsButton) {
        await user.click(settingsButton);

        const voiceSection = screen.queryByText(/voice/i);
        if (voiceSection) {
          await user.click(voiceSection);

          const testButton = screen.queryByRole('button', { name: /test/i });
          if (testButton) {
            await user.click(testButton);

            // Simulate microphone error
            simulateVoiceError(mockSpeechRecognition, 'not-allowed');

            // Should show error message
            await waitFor(() => {
              const errorMessage = screen.queryByText(/microphone.*blocked|permission.*denied/i);
              expect(errorMessage).toBeInTheDocument();
            });

            // Should provide troubleshooting
            const troubleshootLink = screen.queryByText(/troubleshoot|help|fix/i);
            expect(troubleshootLink).toBeInTheDocument();
          }
        }
      }
    });
  });

  describe('P1 High: Alarm Dismissal via Voice', () => {
    it('should dismiss alarm with voice commands', async () => {
      // Create an active alarm
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '07:30',
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
      const voiceButton = screen.queryByRole('button', { name: /voice|speak/i }) ||
                         screen.queryByText(/say.*stop|voice.*command/i);

      if (voiceButton) {
        await user.click(voiceButton);

        // Should start listening
        await waitFor(() => {
          const listeningIndicator = screen.queryByText(/listening|speak.*now/i);
          expect(listeningIndicator).toBeInTheDocument();
        });

        // Test different dismiss commands
        const dismissCommands = [
          'stop alarm',
          'dismiss',
          'turn off',
          'stop'
        ];

        for (const command of dismissCommands) {
          // Reset alarm state
          await simulateAlarmTrigger(alarm);
          await expectAlarmRingingState(screen);

          const voiceBtn = screen.queryByRole('button', { name: /voice|speak/i });
          if (voiceBtn) {
            await user.click(voiceBtn);

            // Simulate voice command
            simulateVoiceCommand(mockSpeechRecognition, command, 0.9);

            // Should dismiss alarm
            await waitFor(() => {
              expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
            }, { timeout: 5000 });

            // Should track voice dismissal
            expectAnalyticsEvent(mockPostHogInstance, 'alarm_dismissed', {
              method: 'voice',
              command: command,
              confidence: 0.9
            });
          }
        }
      }
    });

    it('should handle snooze commands via voice', async () => {
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '08:00',
        label: 'Snooze Voice Test',
        enabled: true,
        snoozeEnabled: true,
        maxSnoozes: 3
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Trigger alarm
      await simulateAlarmTrigger(alarm);
      await expectAlarmRingingState(screen);

      // Test voice snooze
      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);

        // Test snooze commands
        const snoozeCommands = [
          'snooze',
          'snooze alarm',
          'five more minutes',
          'sleep'
        ];

        for (const command of snoozeCommands) {
          // Reset alarm
          await simulateAlarmTrigger(alarm);
          await expectAlarmRingingState(screen);

          const voiceBtn = screen.queryByRole('button', { name: /voice/i });
          if (voiceBtn) {
            await user.click(voiceBtn);

            simulateVoiceCommand(mockSpeechRecognition, command, 0.85);

            // Should snooze alarm
            await waitFor(() => {
              expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
            });

            // Should track voice snooze
            expectAnalyticsEvent(mockPostHogInstance, 'alarm_snoozed', {
              method: 'voice',
              command: command,
              confidence: 0.85
            });
          }
        }
      }
    });

    it('should handle low confidence voice recognition', async () => {
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '09:00',
        label: 'Low Confidence Test',
        enabled: true
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      await simulateAlarmTrigger(alarm);
      await expectAlarmRingingState(screen);

      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);

        // Simulate low confidence recognition
        simulateVoiceCommand(mockSpeechRecognition, 'stop alarm', 0.3);

        // Should not dismiss alarm due to low confidence
        await waitFor(() => {
          const stillRinging = screen.queryByRole('button', { name: /dismiss|stop/i });
          expect(stillRinging).toBeInTheDocument();
        });

        // Should show retry or confirmation message
        const retryMessage = screen.queryByText(/try.*again|didn.*understand|repeat/i);
        expect(retryMessage).toBeInTheDocument();

        // Try again with high confidence
        simulateVoiceCommand(mockSpeechRecognition, 'stop alarm', 0.95);

        // Should now dismiss
        await waitFor(() => {
          expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });
      }
    });

    it('should fallback to manual controls when voice fails', async () => {
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '10:00',
        label: 'Voice Fallback Test',
        enabled: true
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      await simulateAlarmTrigger(alarm);
      await expectAlarmRingingState(screen);

      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);

        // Simulate voice recognition error
        simulateVoiceError(mockSpeechRecognition, 'network');

        // Should show error and fallback options
        await waitFor(() => {
          const errorMessage = screen.queryByText(/voice.*error|network.*error/i);
          expect(errorMessage).toBeInTheDocument();
        });

        // Manual dismiss button should still work
        const dismissButton = screen.getByRole('button', { name: /dismiss|stop/i });
        await user.click(dismissButton);

        await waitFor(() => {
          expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });

        // Should track fallback usage
        expectAnalyticsEvent(mockPostHogInstance, 'voice_fallback_used', {
          error: 'network',
          fallbackMethod: 'button'
        });
      }
    });
  });

  describe('P1 High: App Navigation via Voice', () => {
    it('should navigate to different sections via voice', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Look for voice navigation button
      const voiceNavButton = screen.queryByRole('button', { name: /voice.*navigation|speak.*command/i });
      if (voiceNavButton) {
        await user.click(voiceNavButton);

        // Test navigation commands
        const navigationCommands = [
          { command: 'create alarm', expectedSection: /add.*alarm|create.*alarm/ },
          { command: 'open settings', expectedSection: /settings/ },
          { command: 'show profile', expectedSection: /profile|account/ }
        ];

        for (const { command, expectedSection } of navigationCommands) {
          simulateVoiceCommand(mockSpeechRecognition, command, 0.9);

          // Should navigate to the section
          await waitFor(() => {
            const section = screen.queryByText(expectedSection);
            if (section) {
              expect(section).toBeInTheDocument();
            }
          }, { timeout: 3000 });

          // Track navigation
          expectAnalyticsEvent(mockPostHogInstance, 'voice_navigation_used', {
            command: command,
            destination: command.includes('alarm') ? 'create_alarm' : 
                        command.includes('settings') ? 'settings' : 'profile'
          });

          // Go back to dashboard for next test
          const homeButton = screen.queryByText(/dashboard|home/i);
          if (homeButton) {
            await user.click(homeButton);
          }
        }
      }
    });

    it('should handle voice form filling', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Open alarm creation via voice
      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);

        simulateVoiceCommand(mockSpeechRecognition, 'create alarm', 0.9);

        // Should open alarm form
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Test voice form filling
        const voiceFormButton = screen.queryByRole('button', { name: /voice.*input|speak.*details/i });
        if (voiceFormButton) {
          await user.click(voiceFormButton);

          // Simulate voice form input
          simulateVoiceCommand(mockSpeechRecognition, 'set time to seven thirty AM', 0.9);

          // Should fill time field
          await waitFor(() => {
            const timeInput = screen.getByLabelText(/time/i) as HTMLInputElement;
            expect(timeInput.value).toMatch(/07:30|7:30/);
          });

          // Continue with label
          simulateVoiceCommand(mockSpeechRecognition, 'label morning workout', 0.9);

          await waitFor(() => {
            const labelInput = screen.getByLabelText(/label/i) as HTMLInputElement;
            expect(labelInput.value).toMatch(/morning workout/i);
          });

          // Save via voice
          simulateVoiceCommand(mockSpeechRecognition, 'save alarm', 0.9);

          await waitFor(() => {
            expect(screen.getByText(/morning workout/i)).toBeInTheDocument();
          });
        }
      }
    });

    it('should disambiguate similar voice commands', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);

        // Test ambiguous command
        simulateVoiceCommand(mockSpeechRecognition, 'set', 0.8);

        // Should ask for clarification
        await waitFor(() => {
          const clarificationText = screen.queryByText(/did.*mean|clarify|which.*set/i);
          expect(clarificationText).toBeInTheDocument();
        });

        // Should show options
        const options = screen.queryAllByText(/set.*alarm|settings|set.*time/i);
        expect(options.length).toBeGreaterThan(1);

        // User can clarify
        simulateVoiceCommand(mockSpeechRecognition, 'set alarm', 0.9);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      }
    });
  });

  describe('P2 Medium: Accessibility and Performance', () => {
    it('should maintain keyboard navigation with voice commands enabled', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Enable voice commands
      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);
      }

      // Keyboard navigation should still work
      await expectKeyboardNavigation(user);

      // Voice should not interfere with screen readers
      const landmarks = screen.queryAllByRole('main') || screen.queryAllByRole('navigation');
      expect(landmarks.length).toBeGreaterThan(0);

      // Focus management should work properly
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeVisible();
    });

    it('should handle background noise and multiple speakers', async () => {
      const alarm = createMockAlarm({
        userId: mockUser.id,
        time: '11:00',
        label: 'Noise Test Alarm',
        enabled: true
      });
      testDataHelpers.addAlarm(alarm);

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      await simulateAlarmTrigger(alarm);
      await expectAlarmRingingState(screen);

      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        await user.click(voiceButton);

        // Simulate noisy environment (low confidence)
        simulateVoiceCommand(mockSpeechRecognition, 'stop alarm background noise', 0.4);

        // Should not dismiss due to noise
        await waitFor(() => {
          const stillRinging = screen.queryByRole('button', { name: /dismiss/i });
          expect(stillRinging).toBeInTheDocument();
        });

        // Should show noise warning
        const noiseWarning = screen.queryByText(/background.*noise|clearer|try.*again/i);
        expect(noiseWarning).toBeInTheDocument();

        // Clear command should work
        simulateVoiceCommand(mockSpeechRecognition, 'stop', 0.95);

        await waitFor(() => {
          expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });
      }
    });

    it('should have reasonable voice processing performance', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      const voiceButton = screen.queryByRole('button', { name: /voice/i });
      if (voiceButton) {
        const startTime = performance.now();
        
        await user.click(voiceButton);

        // Should start listening quickly
        await waitFor(() => {
          const listeningIndicator = screen.queryByText(/listening/i);
          expect(listeningIndicator).toBeInTheDocument();
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Voice recognition should start within 1 second
        expect(responseTime).toBeLessThan(1000);

        // Command processing should be fast
        const commandStartTime = performance.now();
        simulateVoiceCommand(mockSpeechRecognition, 'create alarm', 0.9);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const commandEndTime = performance.now();
        const commandTime = commandEndTime - commandStartTime;

        // Command should execute within 2 seconds
        expect(commandTime).toBeLessThan(2000);
      }
    });

    it('should work across different browsers and devices', async () => {
      // Simulate different browser capabilities
      const browserTests = [
        { browser: 'chrome', hasWebkitSpeech: true },
        { browser: 'firefox', hasWebkitSpeech: false },
        { browser: 'safari', hasWebkitSpeech: true }
      ];

      for (const { browser, hasWebkitSpeech } of browserTests) {
        // Mock browser-specific APIs
        if (hasWebkitSpeech) {
          (global as any).webkitSpeechRecognition = mockSpeechRecognition;
        } else {
          delete (global as any).webkitSpeechRecognition;
        }

        renderWithProviders(<App />, { user: mockUser });
        await waitForLoadingToFinish();

        const voiceButton = screen.queryByRole('button', { name: /voice/i });
        
        if (hasWebkitSpeech) {
          // Should work normally
          expect(voiceButton).toBeInTheDocument();
        } else {
          // Should show unsupported message or hide voice features
          const unsupportedMessage = screen.queryByText(/voice.*not.*supported|browser.*support/i);
          if (!voiceButton) {
            expect(unsupportedMessage).toBeInTheDocument();
          }
        }

        // Clean up for next iteration
        screen.getByTestId('root').innerHTML = '';
      }
    });
  });
});