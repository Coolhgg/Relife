import { expect, test, jest } from "@jest/globals";
/// <reference lib="dom" />
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlarmRinging from "../AlarmRinging";
import { testUtils } from "../../test-setup";
import { vibrate } from "../../services/capacitor";
import { VoiceService } from "../../services/voice-pro";

// Mock services
jest.mock('../../services/voice-pro', () => ({
  VoiceService: {
    speak: jest.fn(() => Promise.resolve()),
    stop: jest.fn(),
    isSupported: jest.fn(() => true),
  }
}));

jest.mock('../../services/voice-recognition', () => ({
  VoiceRecognitionService: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
    isListening: false,
    onCommand: jest.fn(),
    isSupported: jest.fn(() => true),
  }
}));

jest.mock('../../services/capacitor', () => ({
  vibrate: jest.fn(() => Promise.resolve()),
}));

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: true,
  interimResults: true,
  lang: 'en-US',
};

Object.defineProperty(window, 'SpeechRecognition', {
  value: jest.fn(() => mockSpeechRecognition),
  writable: true,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: jest.fn(() => mockSpeechRecognition),
  writable: true,
});

describe('AlarmRinging', () => {
  const mockProps = {
    alarm: testUtils.mockAlarm,
    onDismiss: jest.fn(),
    onSnooze: jest.fn(),
  };

  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.clearAllMocks();

    // Reset speech recognition mock
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();
  });

  describe('rendering', () => {
    test('renders alarm information', () => {
      render(<AlarmRinging {...mockProps} />);

      expect(screen.getByText(testUtils.mockAlarm.label)).toBeInTheDocument();
      expect(screen.getByText(testUtils.mockAlarm.time)).toBeInTheDocument();
      expect(screen.getByText(/wake up/i)).toBeInTheDocument();
    });

    test('renders dismiss and snooze buttons', () => {
      render(<AlarmRinging {...mockProps} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /snooze/i })).toBeInTheDocument();
    });

    test('renders voice recognition controls', () => {
      render(<AlarmRinging {...mockProps} />);

      expect(screen.getByRole('button', { name: /start voice recognition/i })).toBeInTheDocument();
      expect(screen.getByText(/say "stop" to dismiss/i)).toBeInTheDocument();
    });

    test('shows current time', () => {
      const mockDate = new Date('2023-12-25T07:30:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(<AlarmRinging {...mockProps} />);

      expect(screen.getByText('07:30')).toBeInTheDocument();

      jest.restoreAllMocks();
    });

    test('displays motivational message based on voice mood', () => {
      const motivationalAlarm = { ...testUtils.mockAlarm, voiceMood: 'motivational' as const };
      render(<AlarmRinging {...mockProps} alarm={motivationalAlarm} />);

      expect(screen.getByText(/time to conquer/i)).toBeInTheDocument();
    });
  });

  describe('voice recognition', () => {
    test('starts voice recognition when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    test('stops voice recognition when listening', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      // Start listening
      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      // Should now show stop button
      const stopButton = screen.getByRole('button', { name: /stop voice recognition/i });
      await user.click(stopButton);

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    test('shows listening indicator when voice recognition is active', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      expect(screen.getByText(/listening/i)).toBeInTheDocument();
      expect(screen.getByTestId('voice-indicator')).toHaveClass('animate-pulse');
    });

    test('handles voice commands correctly', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      // Simulate speech recognition result
      const mockEvent = {
        results: [{
          0: { transcript: 'stop', confidence: 0.9 },
          isFinal: true,
        }],
        resultIndex: 0,
      };

      // Find the result event handler and call it
      const resultHandler = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];

      if (resultHandler) {
        resultHandler(mockEvent);

        await waitFor(() => {
          expect(mockProps.onDismiss).toHaveBeenCalled();
        });
      }
    });

    test('handles snooze voice command', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      const mockEvent = {
        results: [{
          0: { transcript: 'snooze', confidence: 0.85 },
          isFinal: true,
        }],
        resultIndex: 0,
      };

      const resultHandler = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];

      if (resultHandler) {
        resultHandler(mockEvent);

        await waitFor(() => {
          expect(mockProps.onSnooze).toHaveBeenCalled();
        });
      }
    });

    test('shows voice command feedback', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      const mockEvent = {
        results: [{
          0: { transcript: 'stop alarm', confidence: 0.7 },
          isFinal: false,
        }],
        resultIndex: 0,
      };

      const resultHandler = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];

      if (resultHandler) {
        resultHandler(mockEvent);

        expect(screen.getByText('stop alarm')).toBeInTheDocument();
      }
    });
  });

  describe('interactions', () => {
    test('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockProps.onDismiss).toHaveBeenCalled();
    });

    test('calls onSnooze when snooze button is clicked', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const snoozeButton = screen.getByRole('button', { name: /snooze/i });
      await user.click(snoozeButton);

      expect(mockProps.onSnooze).toHaveBeenCalled();
    });

    test('handles double-tap dismiss', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // First click
      await user.click(dismissButton);
      expect(screen.getByText(/tap again to dismiss/i)).toBeInTheDocument();

      // Second click within time window
      await user.click(dismissButton);
      expect(mockProps.onDismiss).toHaveBeenCalled();
    });

    test('resets double-tap after timeout', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // First click
      await user.click(dismissButton);
      expect(screen.getByText(/tap again to dismiss/i)).toBeInTheDocument();

      // Wait for timeout
      await waitFor(() => {
        expect(screen.queryByText(/tap again to dismiss/i)).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('audio and vibration', () => {
    test('triggers device vibration on mount', async () => {
      const { vibrate } = require('../../services/capacitor');
      render(<AlarmRinging {...mockProps} />);

      await waitFor(() => {
        expect(vibrate).toHaveBeenCalled();
      });
    });

    test('speaks alarm message using voice service', async () => {
      const { VoiceService } = require('../../services/voice-pro');
      render(<AlarmRinging {...mockProps} />);

      await waitFor(() => {
        expect(VoiceService.speak).toHaveBeenCalledWith(
          expect.stringContaining(testUtils.mockAlarm.label)
        );
      });
    });

    test('stops speech when component unmounts', () => {
      const { VoiceService } = require('../../services/voice-pro');
      const { unmount } = render(<AlarmRinging {...mockProps} />);

      unmount();

      expect(VoiceService.stop).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('has proper heading structure', () => {
      render(<AlarmRinging {...mockProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('has proper ARIA labels', () => {
      render(<AlarmRinging {...mockProps} />);

      expect(screen.getByLabelText('Alarm notification')).toBeInTheDocument();
      expect(screen.getByLabelText(/dismiss alarm/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/snooze alarm/i)).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      const snoozeButton = screen.getByRole('button', { name: /snooze/i });

      // Tab navigation
      await user.tab();
      expect(dismissButton).toHaveFocus();

      await user.tab();
      expect(snoozeButton).toHaveFocus();
    });

    test('handles Enter key for dismiss', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      dismissButton.focus();

      await user.keyboard('{Enter}');

      expect(screen.getByText(/tap again to dismiss/i)).toBeInTheDocument();
    });

    test('handles Space key for snooze', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const snoozeButton = screen.getByRole('button', { name: /snooze/i });
      snoozeButton.focus();

      await user.keyboard(' ');

      expect(mockProps.onSnooze).toHaveBeenCalled();
    });

    test('announces voice recognition status', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      expect(screen.getByLabelText('Voice recognition active')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    test('handles voice recognition errors gracefully', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(voiceButton);

      // Simulate speech recognition error
      const errorHandler = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];

      if (errorHandler) {
        errorHandler({ error: 'network', message: 'Network error' });

        expect(screen.getByText(/voice recognition unavailable/i)).toBeInTheDocument();
      }
    });

    test('handles missing Web Speech API', () => {
      // Mock unsupported browser
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      render(<AlarmRinging {...mockProps} />);

      expect(screen.queryByRole('button', { name: /start voice recognition/i }))
        .not.toBeInTheDocument();
      expect(screen.getByText(/voice commands not supported/i)).toBeInTheDocument();
    });

    test('handles voice service errors', async () => {
      const { VoiceService } = require('../../services/voice-pro');
      VoiceService.speak.mockRejectedValueOnce(new Error('Speech synthesis failed'));

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(<AlarmRinging {...mockProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('Speech synthesis failed')
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('snooze functionality', () => {
    test('shows snooze count when alarm has been snoozed', () => {
      const snoozedAlarm = { ...testUtils.mockAlarm, snoozeCount: 2 };
      render(<AlarmRinging {...mockProps} alarm={snoozedAlarm} />);

      expect(screen.getByText(/snoozed 2 times/i)).toBeInTheDocument();
    });

    test('disables snooze when max snoozes reached', () => {
      const maxSnoozedAlarm = {
        ...testUtils.mockAlarm,
        snoozeCount: 3,
        maxSnoozes: 3
      };
      render(<AlarmRinging {...mockProps} alarm={maxSnoozedAlarm} />);

      const snoozeButton = screen.getByRole('button', { name: /snooze/i });
      expect(snoozeButton).toBeDisabled();
      expect(screen.getByText(/max snoozes reached/i)).toBeInTheDocument();
    });

    test('shows snooze interval information', () => {
      const customSnoozeAlarm = { ...testUtils.mockAlarm, snoozeInterval: 10 };
      render(<AlarmRinging {...mockProps} alarm={customSnoozeAlarm} />);

      expect(screen.getByText(/snooze for 10 minutes/i)).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    test('cleans up resources on unmount', () => {
      const { VoiceService } = require('../../services/voice-pro');
      const { unmount } = render(<AlarmRinging {...mockProps} />);

      unmount();

      expect(VoiceService.stop).toHaveBeenCalled();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    test('handles rapid button clicks gracefully', async () => {
      const user = userEvent.setup();
      render(<AlarmRinging {...mockProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // Click rapidly multiple times
      await user.click(dismissButton);
      await user.click(dismissButton);
      await user.click(dismissButton);

      // Should only register as one double-tap dismiss
      expect(mockProps.onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});