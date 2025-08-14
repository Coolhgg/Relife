// Voice Accessibility Service Tests
// Validates voice commands, speech recognition, and voice feedback

import VoiceAccessibilityService from '../voice-accessibility';

// Mock Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Test Voice', lang: 'en-US', default: true, localService: true, voiceURI: 'test' }
  ]),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  lang: 'en-US',
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null
}));

// Mock constructor
(global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
(global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: mockSpeechSynthesisUtterance
});

describe('VoiceAccessibilityService', () => {
  let voiceService: VoiceAccessibilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    voiceService = VoiceAccessibilityService.getInstance();
  });

  afterEach(() => {
    voiceService.cleanup();
  });

  describe('Initialization and Singleton', () => {
    test('should be a singleton', () => {
      const instance1 = VoiceAccessibilityService.getInstance();
      const instance2 = VoiceAccessibilityService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should initialize speech recognition when available', async () => {
      await voiceService.initialize();
      expect(voiceService.isSupported()).toBe(true);
      expect(voiceService.getState().isSupported).toBe(true);
    });

    test('should handle missing speech recognition gracefully', async () => {
      (global as any).webkitSpeechRecognition = undefined;
      (global as any).SpeechRecognition = undefined;
      
      const service = VoiceAccessibilityService.getInstance();
      await service.initialize();
      
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('Voice Command Processing', () => {
    beforeEach(async () => {
      await voiceService.initialize();
      voiceService.enable();
    });

    test('should process navigation commands', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.processCommand('go to dashboard');
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'navigate',
            target: 'dashboard'
          })
        })
      );
    });

    test('should process alarm management commands', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.processCommand('create alarm');
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'create-alarm'
          })
        })
      );
    });

    test('should process accessibility commands', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.processCommand('keyboard shortcuts');
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'show-keyboard-shortcuts'
          })
        })
      );
    });

    test('should handle fuzzy matching', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Test variations of commands
      voiceService.processCommand('go to the dashboard');
      voiceService.processCommand('navigate to dashboard');
      voiceService.processCommand('show dashboard');
      
      expect(dispatchSpy).toHaveBeenCalledTimes(3);
    });

    test('should ignore commands below confidence threshold', () => {
      voiceService.updateSettings({ confidenceThreshold: 0.8 });
      
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // This should be processed with low confidence
      voiceService.processCommand('maybe go dashboard', 0.5);
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation System', () => {
    beforeEach(async () => {
      await voiceService.initialize();
      voiceService.enable();
      voiceService.updateSettings({ requireConfirmation: true });
    });

    test('should require confirmation for destructive actions', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.processCommand('delete alarm');
      
      // Should prompt for confirmation, not execute immediately
      expect(voiceService.getState().awaitingConfirmation).toBe(true);
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'delete-alarm'
          })
        })
      );
    });

    test('should execute after confirmation', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Start destructive command
      voiceService.processCommand('delete alarm');
      expect(voiceService.getState().awaitingConfirmation).toBe(true);
      
      // Confirm
      voiceService.processCommand('yes');
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'delete-alarm'
          })
        })
      );
      expect(voiceService.getState().awaitingConfirmation).toBe(false);
    });

    test('should cancel after rejection', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Start destructive command
      voiceService.processCommand('delete all alarms');
      expect(voiceService.getState().awaitingConfirmation).toBe(true);
      
      // Reject
      voiceService.processCommand('no');
      
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'delete-all-alarms'
          })
        })
      );
      expect(voiceService.getState().awaitingConfirmation).toBe(false);
    });

    test('should timeout confirmation', (done) => {
      voiceService.updateSettings({ confirmationTimeout: 100 });
      
      voiceService.processCommand('delete alarm');
      expect(voiceService.getState().awaitingConfirmation).toBe(true);
      
      setTimeout(() => {
        expect(voiceService.getState().awaitingConfirmation).toBe(false);
        done();
      }, 150);
    });
  });

  describe('Speech Recognition Control', () => {
    beforeEach(async () => {
      await voiceService.initialize();
    });

    test('should start listening', () => {
      voiceService.startListening();
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(voiceService.getState().isListening).toBe(true);
    });

    test('should stop listening', () => {
      voiceService.startListening();
      voiceService.stopListening();
      
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(voiceService.getState().isListening).toBe(false);
    });

    test('should toggle listening state', () => {
      expect(voiceService.getState().isListening).toBe(false);
      
      voiceService.toggleListening();
      expect(voiceService.getState().isListening).toBe(true);
      
      voiceService.toggleListening();
      expect(voiceService.getState().isListening).toBe(false);
    });

    test('should handle recognition results', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.startListening();
      
      // Simulate recognition result
      const mockEvent = {
        results: [
          [
            { transcript: 'go to dashboard', confidence: 0.9 }
          ]
        ],
        resultIndex: 0
      };
      
      // Trigger the result handler
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent as any);
      }
      
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('Speech Feedback', () => {
    test('should provide voice feedback', () => {
      voiceService.speak('Test feedback message');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Test feedback message');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    test('should cancel previous speech before new', () => {
      voiceService.speak('First message');
      voiceService.speak('Second message');
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    test('should respect language settings', () => {
      voiceService.updateSettings({ language: 'es-ES' });
      voiceService.speak('Hola mundo');
      
      const utterance = mockSpeechSynthesisUtterance.mock.results[0].value;
      expect(utterance.lang).toBe('es-ES');
    });
  });

  describe('Command Categories', () => {
    beforeEach(async () => {
      await voiceService.initialize();
      voiceService.enable();
    });

    test('should enable/disable command categories', () => {
      voiceService.updateSettings({
        enabledCategories: {
          navigation: true,
          alarms: false,
          accessibility: true,
          general: true
        }
      });
      
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      // Navigation command should work
      voiceService.processCommand('go to dashboard');
      expect(dispatchSpy).toHaveBeenCalled();
      
      dispatchSpy.mockClear();
      
      // Alarm command should be ignored
      voiceService.processCommand('create alarm');
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    test('should get available commands for enabled categories', () => {
      voiceService.updateSettings({
        enabledCategories: {
          navigation: true,
          alarms: false,
          accessibility: true,
          general: false
        }
      });
      
      const commands = voiceService.getAvailableCommands();
      
      expect(commands.some(cmd => cmd.includes('dashboard'))).toBe(true);
      expect(commands.some(cmd => cmd.includes('create alarm'))).toBe(false);
      expect(commands.some(cmd => cmd.includes('keyboard shortcuts'))).toBe(true);
    });
  });

  describe('Settings and Configuration', () => {
    test('should update language settings', () => {
      voiceService.updateSettings({ language: 'fr-FR' });
      expect(voiceService.getState().language).toBe('fr-FR');
    });

    test('should update confidence threshold', () => {
      voiceService.updateSettings({ confidenceThreshold: 0.8 });
      expect(voiceService.getState().confidenceThreshold).toBe(0.8);
    });

    test('should toggle continuous recognition', () => {
      voiceService.updateSettings({ continuousRecognition: true });
      expect(voiceService.getState().continuousRecognition).toBe(true);
      
      voiceService.updateSettings({ continuousRecognition: false });
      expect(voiceService.getState().continuousRecognition).toBe(false);
    });
  });

  describe('Help System', () => {
    beforeEach(async () => {
      await voiceService.initialize();
      voiceService.enable();
    });

    test('should provide help for voice commands', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.processCommand('voice help');
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice-command',
          detail: expect.objectContaining({
            action: 'show-voice-help'
          })
        })
      );
    });

    test('should list available commands', () => {
      voiceService.processCommand('list commands');
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const lastCall = mockSpeechSynthesisUtterance.mock.calls[mockSpeechSynthesisUtterance.mock.calls.length - 1];
      expect(lastCall[0]).toContain('Available commands');
    });
  });

  describe('Error Handling', () => {
    test('should handle speech recognition errors', async () => {
      await voiceService.initialize();
      voiceService.startListening();
      
      // Simulate recognition error
      const errorEvent = { error: 'network', message: 'Network error' };
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(errorEvent as any);
      }
      
      expect(voiceService.getState().isListening).toBe(false);
    });

    test('should handle speech synthesis errors', () => {
      mockSpeechSynthesis.speak.mockImplementation(() => {
        throw new Error('Synthesis error');
      });
      
      expect(() => {
        voiceService.speak('Test message');
      }).not.toThrow();
    });

    test('should handle unknown commands gracefully', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
      
      voiceService.processCommand('unknown nonsense command');
      
      // Should provide feedback but not dispatch command
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'voice-command' })
      );
    });
  });

  describe('Cleanup', () => {
    test('should clean up recognition and synthesis', async () => {
      await voiceService.initialize();
      voiceService.startListening();
      voiceService.speak('Test message');
      
      voiceService.cleanup();
      
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(voiceService.getState().isListening).toBe(false);
    });

    test('should clear confirmation state on cleanup', () => {
      voiceService.updateSettings({ requireConfirmation: true });
      voiceService.processCommand('delete alarm');
      
      expect(voiceService.getState().awaitingConfirmation).toBe(true);
      
      voiceService.cleanup();
      
      expect(voiceService.getState().awaitingConfirmation).toBe(false);
    });
  });
});