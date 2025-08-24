import { expect, test, jest } from '@jest/globals';
/// <reference lib="dom" />
import { VoiceService } from '../voice';
import { PremiumVoiceService } from '../premium-voice';
import type { Alarm, VoiceMood } from '../../types';
import { formatTime } from '../../utils';
import {
  createTestAlarm,
  createTestUser,
} from '../../__tests__/factories/core-factories';
import { faker } from '@faker-js/faker';

// Mock dependencies
jest.mock('../premium-voice');
jest.mock('../../utils', () => ({
  formatTime: jest.fn(),
}));

// Mock SpeechSynthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(),
  speaking: false,
  pending: false,
  paused: false,
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation((text: string) => ({
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
  onboundary: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock voices
const mockVoices = [
  {
    name: 'Microsoft David Desktop - English (United States)',
    lang: 'en-US',
    localService: true,
    default: true,
    voiceURI: 'Microsoft David Desktop - English (United States)',
  },
  {
    name: 'Microsoft Zira Desktop - English (United States)',
    lang: 'en-US',
    localService: true,
    default: false,
    voiceURI: 'Microsoft Zira Desktop - English (United States)',
  },
  {
    name: 'Google UK English Female',
    lang: 'en-GB',
    localService: false,
    default: false,
    voiceURI: 'Google UK English Female',
  },
];

// Setup global mocks
beforeAll(() => {
  Object.defineProperty(global, 'speechSynthesis', {
    writable: true,
    value: mockSpeechSynthesis,
  });

  Object.defineProperty(global, 'SpeechSynthesisUtterance', {
    writable: true,
    value: mockSpeechSynthesisUtterance,
  });

  Object.defineProperty(global, 'window', {
    writable: true,
    value: {
      speechSynthesis: mockSpeechSynthesis,
      SpeechSynthesisUtterance: mockSpeechSynthesisUtterance,
    },
  });

  mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
});

describe('VoiceService', () => {
  // Reset mocks and state before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset VoiceService internal state
    VoiceService.clearCache();

    // Reset SpeechSynthesis mock state
    mockSpeechSynthesis.speaking = false;
    mockSpeechSynthesis.pending = false;
    mockSpeechSynthesis.paused = false;

    // Mock formatTime utility
    (formatTime as jest.Mock).mockImplementation((time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when SpeechSynthesis is available', async () => {
      await expect(VoiceService.initialize()).resolves.not.toThrow();
    });

    it('should handle repeated initialization calls gracefully', async () => {
      await VoiceService.initialize();
      await VoiceService.initialize();
      await VoiceService.initialize();

      // Should not throw and should be efficient
      expect(true).toBe(true);
    });

    it('should handle missing SpeechSynthesis gracefully', async () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      delete (global as any).speechSynthesis;

      await expect(VoiceService.initialize()).resolves.not.toThrow();

      // Restore
      Object.defineProperty(global, 'speechSynthesis', {
        writable: true,
        value: originalSpeechSynthesis,
      });
    });
  });

  describe('generateAlarmMessage', () => {
    let testAlarm: Alarm;
    let userId: string;

    beforeEach(() => {
      testAlarm = createTestAlarm({
        voiceMood: 'drill-sergeant',
      });
      userId = faker.string.uuid();
    });

    it('should generate voice message successfully for basic alarm', async () => {
      const result = await VoiceService.generateAlarmMessage(testAlarm, userId);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle premium voice moods by delegating to PremiumVoiceService', async () => {
      const premiumAlarm = createTestAlarm({
        voiceMood: 'demon-lord',
      });

      const mockPremiumResult = 'premium-voice-data-url';
      (PremiumVoiceService.isPremiumPersonality as jest.Mock).mockReturnValue(true);
      (PremiumVoiceService.generateAlarmSpeech as jest.Mock).mockResolvedValue(
        mockPremiumResult
      );

      const result = await VoiceService.generateAlarmMessage(premiumAlarm, userId);

      expect(PremiumVoiceService.isPremiumPersonality).toHaveBeenCalledWith(
        'demon-lord'
      );
      expect(PremiumVoiceService.generateAlarmSpeech).toHaveBeenCalledWith(
        premiumAlarm,
        userId
      );
      expect(result).toBe(mockPremiumResult);
    });

    it('should cache generated voice messages', async () => {
      // Generate same message twice
      await VoiceService.generateAlarmMessage(testAlarm, userId);
      await VoiceService.generateAlarmMessage(testAlarm, userId);

      // Should use cache for second call, so only generate once
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should generate different messages for different voice moods', async () => {
      const gentleAlarm = createTestAlarm({ voiceMood: 'gentle' });
      const drillAlarm = createTestAlarm({ voiceMood: 'drill-sergeant' });

      const gentleResult = await VoiceService.generateAlarmMessage(gentleAlarm, userId);
      const drillResult = await VoiceService.generateAlarmMessage(drillAlarm, userId);

      expect(gentleResult).toBeDefined();
      expect(drillResult).toBeDefined();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should handle alarms with custom names', async () => {
      const customAlarm = createTestAlarm({
        name: 'Morning Workout',
        voiceMood: 'motivational',
      });

      const result = await VoiceService.generateAlarmMessage(customAlarm, userId);

      expect(result).toBeDefined();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle missing userId gracefully', async () => {
      const result = await VoiceService.generateAlarmMessage(testAlarm);

      expect(result).toBeDefined();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle SpeechSynthesis errors gracefully', async () => {
      // Mock speech synthesis error
      mockSpeechSynthesis.speak.mockImplementation((utterance: any) => {
        setTimeout(() => {
          if (utterance.onerror) {
            utterance.onerror(new Event('error'));
          }
        }, 10);
      });

      const result = await VoiceService.generateAlarmMessage(testAlarm, userId);

      expect(result).toBeNull();
    });

    it('should format time correctly in voice messages', async () => {
      const morningAlarm = createTestAlarm({
        time: '07:30',
        voiceMood: 'gentle',
      });

      await VoiceService.generateAlarmMessage(morningAlarm, userId);

      expect(formatTime).toHaveBeenCalledWith('07:30');
    });

    it('should handle different alarm times appropriately', async () => {
      const earlyAlarm = createTestAlarm({
        time: '05:00',
        voiceMood: 'motivational',
      });

      const lateAlarm = createTestAlarm({
        time: '23:45',
        voiceMood: 'gentle',
      });

      const earlyResult = await VoiceService.generateAlarmMessage(earlyAlarm, userId);
      const lateResult = await VoiceService.generateAlarmMessage(lateAlarm, userId);

      expect(earlyResult).toBeDefined();
      expect(lateResult).toBeDefined();
      expect(formatTime).toHaveBeenCalledWith('05:00');
      expect(formatTime).toHaveBeenCalledWith('23:45');
    });
  });

  describe('voice mood configuration', () => {
    let mockUtterance: any;

    beforeEach(() => {
      mockUtterance = new mockSpeechSynthesisUtterance('test');
    });

    it('should configure drill-sergeant voice mood correctly', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'drill-sergeant' });

      await VoiceService.generateAlarmMessage(testAlarm);

      // Check that the utterance was created and configured
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should configure gentle voice mood correctly', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'gentle' });

      await VoiceService.generateAlarmMessage(testAlarm);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should configure sweet-angel voice mood correctly', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'sweet-angel' });

      await VoiceService.generateAlarmMessage(testAlarm);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should configure anime-hero voice mood correctly', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'anime-hero' });

      await VoiceService.generateAlarmMessage(testAlarm);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should configure savage-roast voice mood correctly', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'savage-roast' });

      await VoiceService.generateAlarmMessage(testAlarm);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should configure motivational voice mood correctly', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'motivational' });

      await VoiceService.generateAlarmMessage(testAlarm);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle voice selection when multiple voices available', async () => {
      const testAlarm = createTestAlarm({ voiceMood: 'drill-sergeant' });

      await VoiceService.generateAlarmMessage(testAlarm);

      expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should fall back gracefully when no voices available', async () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([]);

      const testAlarm = createTestAlarm({ voiceMood: 'gentle' });
      const result = await VoiceService.generateAlarmMessage(testAlarm);

      expect(result).toBeDefined();
    });
  });

  describe('preloadAlarmMessages', () => {
    let testAlarms: Alarm[];
    let userId: string;

    beforeEach(() => {
      testAlarms = [
        createTestAlarm({ voiceMood: 'drill-sergeant', time: '06:00' }),
        createTestAlarm({ voiceMood: 'gentle', time: '07:30' }),
        createTestAlarm({ voiceMood: 'motivational', time: '09:00' }),
      ];
      userId = faker.string.uuid();
    });

    it('should preload voice messages for multiple alarms', async () => {
      await VoiceService.preloadAlarmMessages(testAlarms, userId);

      // Should generate voice for each alarm
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(testAlarms.length);
    });

    it('should handle empty alarm array gracefully', async () => {
      await VoiceService.preloadAlarmMessages([], userId);

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should handle mixed premium and standard alarms', async () => {
      const mixedAlarms = [
        createTestAlarm({ voiceMood: 'drill-sergeant' }),
        createTestAlarm({ voiceMood: 'demon-lord' }),
        createTestAlarm({ voiceMood: 'gentle' }),
      ];

      (PremiumVoiceService.isPremiumPersonality as jest.Mock).mockImplementation(
        (mood: VoiceMood) => mood === 'demon-lord'
      );

      await VoiceService.preloadAlarmMessages(mixedAlarms, userId);

      expect(PremiumVoiceService.isPremiumPersonality).toHaveBeenCalledTimes(3);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2); // 2 standard alarms
    });

    it('should skip already cached messages during preload', async () => {
      // Generate one message first
      await VoiceService.generateAlarmMessage(testAlarms[0], userId);

      // Clear the speak mock to check preload behavior
      mockSpeechSynthesis.speak.mockClear();

      // Preload all messages
      await VoiceService.preloadAlarmMessages(testAlarms, userId);

      // Should only generate for the remaining 2 alarms
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during preload gracefully', async () => {
      mockSpeechSynthesis.speak.mockImplementation((utterance: any) => {
        if (utterance.text.includes('error')) {
          setTimeout(() => {
            if (utterance.onerror) {
              utterance.onerror(new Event('error'));
            }
          }, 10);
        }
      });

      const errorAlarm = createTestAlarm({
        name: 'error alarm',
        voiceMood: 'drill-sergeant',
      });
      const testAlarmsWithError = [...testAlarms, errorAlarm];

      await expect(
        VoiceService.preloadAlarmMessages(testAlarmsWithError, userId)
      ).resolves.not.toThrow();
    });

    it('should handle missing userId during preload', async () => {
      await VoiceService.preloadAlarmMessages(testAlarms);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(testAlarms.length);
    });
  });

  describe('testVoice', () => {
    let userId: string;

    beforeEach(() => {
      userId = faker.string.uuid();
    });

    it('should test drill-sergeant voice mood', async () => {
      await VoiceService.testVoice('drill-sergeant', userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const utteranceCall = mockSpeechSynthesisUtterance.mock.calls[0];
      expect(utteranceCall[0]).toContain('drill'); // Should contain drill-sergeant style text
    });

    it('should test gentle voice mood', async () => {
      await VoiceService.testVoice('gentle', userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const utteranceCall = mockSpeechSynthesisUtterance.mock.calls[0];
      expect(utteranceCall[0]).toBeDefined();
    });

    it('should test sweet-angel voice mood', async () => {
      await VoiceService.testVoice('sweet-angel', userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should test anime-hero voice mood', async () => {
      await VoiceService.testVoice('anime-hero', userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should test savage-roast voice mood', async () => {
      await VoiceService.testVoice('savage-roast', userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should test motivational voice mood', async () => {
      await VoiceService.testVoice('motivational', userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle premium voice moods during testing', async () => {
      (PremiumVoiceService.isPremiumPersonality as jest.Mock).mockReturnValue(true);
      (PremiumVoiceService.previewVoice as jest.Mock).mockResolvedValue(
        'premium-test-audio'
      );

      await VoiceService.testVoice('demon-lord', userId);

      expect(PremiumVoiceService.previewVoice).toHaveBeenCalledWith(
        userId,
        'demon-lord'
      );
    });

    it('should handle missing userId during voice testing', async () => {
      await VoiceService.testVoice('drill-sergeant');

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle voice test errors gracefully', async () => {
      mockSpeechSynthesis.speak.mockImplementation((utterance: any) => {
        setTimeout(() => {
          if (utterance.onerror) {
            utterance.onerror(new Event('error'));
          }
        }, 10);
      });

      await expect(
        VoiceService.testVoice('drill-sergeant', userId)
      ).resolves.not.toThrow();
    });

    it('should test different voice personalities with appropriate messages', async () => {
      const moods: VoiceMood[] = [
        'drill-sergeant',
        'gentle',
        'sweet-angel',
        'anime-hero',
        'savage-roast',
        'motivational',
      ];

      for (const mood of moods) {
        await VoiceService.testVoice(mood, userId);
      }

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(moods.length);
    });
  });

  describe('cache management', () => {
    let testAlarm: Alarm;
    let userId: string;

    beforeEach(() => {
      testAlarm = createTestAlarm({ voiceMood: 'drill-sergeant' });
      userId = faker.string.uuid();
    });

    it('should cache voice messages correctly', async () => {
      await VoiceService.generateAlarmMessage(testAlarm, userId);
      await VoiceService.generateAlarmMessage(testAlarm, userId);

      // Should only generate once due to caching
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should clear cache successfully', async () => {
      await VoiceService.generateAlarmMessage(testAlarm, userId);

      VoiceService.clearCache();

      await VoiceService.generateAlarmMessage(testAlarm, userId);

      // Should generate twice since cache was cleared
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should generate different cache entries for different alarms', async () => {
      const alarm1 = createTestAlarm({ voiceMood: 'drill-sergeant', time: '06:00' });
      const alarm2 = createTestAlarm({ voiceMood: 'drill-sergeant', time: '07:00' });
      const alarm3 = createTestAlarm({ voiceMood: 'gentle', time: '06:00' });

      await VoiceService.generateAlarmMessage(alarm1, userId);
      await VoiceService.generateAlarmMessage(alarm2, userId);
      await VoiceService.generateAlarmMessage(alarm3, userId);

      // Should generate 3 times for different alarms
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(3);

      // But repeated calls should use cache
      await VoiceService.generateAlarmMessage(alarm1, userId);
      await VoiceService.generateAlarmMessage(alarm2, userId);
      await VoiceService.generateAlarmMessage(alarm3, userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(3);
    });

    it('should handle cache with different userIds', async () => {
      const userId1 = faker.string.uuid();
      const userId2 = faker.string.uuid();

      await VoiceService.generateAlarmMessage(testAlarm, userId1);
      await VoiceService.generateAlarmMessage(testAlarm, userId2);

      // Should generate for each unique user
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should handle cache with missing userIds consistently', async () => {
      await VoiceService.generateAlarmMessage(testAlarm);
      await VoiceService.generateAlarmMessage(testAlarm);

      // Should use cache even without userId
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    let testAlarm: Alarm;
    let userId: string;

    beforeEach(() => {
      testAlarm = createTestAlarm({ voiceMood: 'drill-sergeant' });
      userId = faker.string.uuid();
    });

    it('should handle SpeechSynthesis not available', async () => {
      delete (global as any).speechSynthesis;
      delete (global as any).SpeechSynthesisUtterance;

      const result = await VoiceService.generateAlarmMessage(testAlarm, userId);

      expect(result).toBeNull();

      // Restore for other tests
      Object.defineProperty(global, 'speechSynthesis', {
        writable: true,
        value: mockSpeechSynthesis,
      });
      Object.defineProperty(global, 'SpeechSynthesisUtterance', {
        writable: true,
        value: mockSpeechSynthesisUtterance,
      });
    });

    it('should handle utterance creation errors', async () => {
      const originalUtterance = global.SpeechSynthesisUtterance;
      (global as any).SpeechSynthesisUtterance = null;

      const result = await VoiceService.generateAlarmMessage(testAlarm, userId);

      expect(result).toBeNull();

      // Restore
      Object.defineProperty(global, 'SpeechSynthesisUtterance', {
        writable: true,
        value: originalUtterance,
      });
    });

    it('should handle synthesis speaking errors', async () => {
      mockSpeechSynthesis.speak.mockImplementation((utterance: any) => {
        setTimeout(() => {
          if (utterance.onerror) {
            utterance.onerror(
              new ErrorEvent('error', { error: new Error('Synthesis failed') })
            );
          }
        }, 10);
      });

      const result = await VoiceService.generateAlarmMessage(testAlarm, userId);

      expect(result).toBeNull();
    });

    it('should handle synthesis timeout', async () => {
      jest.useFakeTimers();

      mockSpeechSynthesis.speak.mockImplementation(() => {
        // Never call onend or onerror to simulate timeout
      });

      const promise = VoiceService.generateAlarmMessage(testAlarm, userId);

      // Fast forward time
      jest.advanceTimersByTime(11000); // 11 seconds

      const result = await promise;
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should handle premium service errors gracefully', async () => {
      const premiumAlarm = createTestAlarm({ voiceMood: 'demon-lord' });

      (PremiumVoiceService.isPremiumPersonality as jest.Mock).mockReturnValue(true);
      (PremiumVoiceService.generateAlarmSpeech as jest.Mock).mockRejectedValue(
        new Error('Premium service failed')
      );

      const result = await VoiceService.generateAlarmMessage(premiumAlarm, userId);

      expect(result).toBeNull();
    });

    it('should handle invalid alarm data gracefully', async () => {
      const invalidAlarm = {
        ...testAlarm,
        time: 'invalid-time',
      } as Alarm;

      (formatTime as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid time format');
      });

      const result = await VoiceService.generateAlarmMessage(invalidAlarm, userId);

      expect(result).toBeNull();
    });

    it('should handle voice configuration errors', async () => {
      mockSpeechSynthesis.getVoices.mockImplementation(() => {
        throw new Error('Failed to get voices');
      });

      const result = await VoiceService.generateAlarmMessage(testAlarm, userId);

      // Should still work with default voice
      expect(result).toBeDefined();
    });

    it('should handle concurrent access gracefully', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => VoiceService.generateAlarmMessage(testAlarm, userId));

      const results = await Promise.allSettled(promises);

      // All promises should resolve (either with value or null)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  describe('integration scenarios', () => {
    let userId: string;

    beforeEach(() => {
      userId = faker.string.uuid();
    });

    it('should handle complete alarm workflow with voice', async () => {
      const alarm = createTestAlarm({
        voiceMood: 'motivational',
        time: '07:00',
        name: 'Morning Motivation',
      });

      // Test voice first
      await VoiceService.testVoice('motivational', userId);

      // Generate alarm message
      const voiceMessage = await VoiceService.generateAlarmMessage(alarm, userId);

      expect(voiceMessage).toBeDefined();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should handle bulk voice generation for multiple alarms', async () => {
      const alarms = Array(5)
        .fill(null)
        .map(() =>
          createTestAlarm({
            voiceMood: faker.helpers.arrayElement([
              'drill-sergeant',
              'gentle',
              'motivational',
              'sweet-angel',
            ] as VoiceMood[]),
          })
        );

      await VoiceService.preloadAlarmMessages(alarms, userId);

      // Generate all messages again - should use cache
      const results = await Promise.all(
        alarms.map(alarm => VoiceService.generateAlarmMessage(alarm, userId))
      );

      results.forEach(result => {
        expect(result).toBeDefined();
      });

      // Should only generate once per unique alarm during preload
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(alarms.length);
    });

    it('should handle mixed premium and standard voice scenarios', async () => {
      const standardAlarm = createTestAlarm({ voiceMood: 'drill-sergeant' });
      const premiumAlarm = createTestAlarm({ voiceMood: 'demon-lord' });

      (PremiumVoiceService.isPremiumPersonality as jest.Mock).mockImplementation(
        (mood: VoiceMood) => mood === 'demon-lord'
      );
      (PremiumVoiceService.generateAlarmSpeech as jest.Mock).mockResolvedValue(
        'premium-audio-data'
      );

      const standardResult = await VoiceService.generateAlarmMessage(
        standardAlarm,
        userId
      );
      const premiumResult = await VoiceService.generateAlarmMessage(
        premiumAlarm,
        userId
      );

      expect(standardResult).toBeDefined();
      expect(premiumResult).toBe('premium-audio-data');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1); // Only standard
      expect(PremiumVoiceService.generateAlarmSpeech).toHaveBeenCalledTimes(1);
    });

    it('should handle voice testing across all available moods', async () => {
      const allMoods: VoiceMood[] = [
        'drill-sergeant',
        'sweet-angel',
        'anime-hero',
        'savage-roast',
        'motivational',
        'gentle',
        'demon-lord',
        'ai-robot',
        'comedian',
        'philosopher',
      ];

      (PremiumVoiceService.isPremiumPersonality as jest.Mock).mockImplementation(
        (mood: VoiceMood) =>
          ['demon-lord', 'ai-robot', 'comedian', 'philosopher'].includes(mood)
      );

      for (const mood of allMoods) {
        await VoiceService.testVoice(mood, userId);
      }

      // Should call standard voice for 6 moods, premium for 4
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(6);
      expect(PremiumVoiceService.previewVoice).toHaveBeenCalledTimes(4);
    });

    it('should handle cache clearing in production scenario', async () => {
      const alarm1 = createTestAlarm({ voiceMood: 'drill-sergeant' });
      const alarm2 = createTestAlarm({ voiceMood: 'gentle' });

      // Generate initial messages
      await VoiceService.generateAlarmMessage(alarm1, userId);
      await VoiceService.generateAlarmMessage(alarm2, userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);

      // Simulate app restart - cache should clear
      VoiceService.clearCache();

      // Generate same messages again
      await VoiceService.generateAlarmMessage(alarm1, userId);
      await VoiceService.generateAlarmMessage(alarm2, userId);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(4);
    });

    it('should handle user switching scenarios', async () => {
      const user1 = faker.string.uuid();
      const user2 = faker.string.uuid();
      const alarm = createTestAlarm({ voiceMood: 'motivational' });

      await VoiceService.generateAlarmMessage(alarm, user1);
      await VoiceService.generateAlarmMessage(alarm, user2);

      // Should generate separate messages for different users
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance and optimization', () => {
    let userId: string;

    beforeEach(() => {
      userId = faker.string.uuid();
    });

    it('should not regenerate cached voice messages', async () => {
      const alarm = createTestAlarm({ voiceMood: 'drill-sergeant' });

      // Generate message multiple times
      await VoiceService.generateAlarmMessage(alarm, userId);
      await VoiceService.generateAlarmMessage(alarm, userId);
      await VoiceService.generateAlarmMessage(alarm, userId);

      // Should only generate once
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should handle large batches of alarms efficiently', async () => {
      const alarms = Array(50)
        .fill(null)
        .map((_, index) =>
          createTestAlarm({
            voiceMood: 'drill-sergeant',
            time: `${String(6 + (index % 12)).padStart(2, '0')}:${String((index * 5) % 60).padStart(2, '0')}`,
            name: `Alarm ${index}`,
          })
        );

      const startTime = Date.now();
      await VoiceService.preloadAlarmMessages(alarms, userId);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(alarms.length);
    });

    it('should handle rapid consecutive calls without issues', async () => {
      const alarm = createTestAlarm({ voiceMood: 'gentle' });

      const promises = Array(10)
        .fill(null)
        .map(() => VoiceService.generateAlarmMessage(alarm, userId));

      const results = await Promise.all(promises);

      // All results should be the same (cached)
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toBe(results[0]);
      });

      // Should only generate once due to caching
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should clean up properly after operations', async () => {
      const alarm = createTestAlarm({ voiceMood: 'motivational' });

      await VoiceService.generateAlarmMessage(alarm, userId);
      await VoiceService.testVoice('motivational', userId);

      VoiceService.clearCache();

      // Should be able to continue operations normally
      const result = await VoiceService.generateAlarmMessage(alarm, userId);
      expect(result).toBeDefined();
    });
  });
});
