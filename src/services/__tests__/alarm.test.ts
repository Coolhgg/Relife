/**
 * Comprehensive tests for AlarmService
 * 
 * Tests cover:
 * - Static methods (CRUD operations)
 * - Security features (rate limiting, ownership validation)
 * - Battle integration
 * - Notification scheduling
 * - Error handling and edge cases
 * - Cache management
 * - Analytics tracking
 */

import { AlarmService, enhancedAlarmTracking } from '../alarm';
import { generateAlarmId, getNextAlarmTime } from '../../utils';
import type { Alarm, VoiceMood, AlarmEvent, AlarmInstance, User } from '../../types';
import { createTestAlarm, createTestUser } from '../../__tests__/factories/core-factories';

// Mock dependencies
jest.mock('../../utils', () => ({
  generateAlarmId: jest.fn(() => 'alarm_test_12345'),
  getNextAlarmTime: jest.fn(() => new Date('2024-01-02T07:00:00.000Z')),
  formatTime: jest.fn((time: string) => time)
}));

jest.mock('../capacitor', () => ({
  scheduleLocalNotification: jest.fn(() => Promise.resolve()),
  cancelLocalNotification: jest.fn(() => Promise.resolve())
}));

jest.mock('../alarm-battle-integration', () => ({
  alarmBattleIntegration: {
    createBattleAlarm: jest.fn(),
    handleAlarmTrigger: jest.fn(),
    handleAlarmDismissal: jest.fn(),
    handleAlarmSnooze: jest.fn(),
    unlinkAlarmFromBattle: jest.fn()
  }
}));

jest.mock('../app-analytics', () => ({
  default: {
    getInstance: jest.fn(() => ({
      track: jest.fn()
    }))
  }
}));

jest.mock('../secure-alarm-storage', () => ({
  default: {
    getInstance: jest.fn(() => ({
      storeAlarms: jest.fn(() => Promise.resolve()),
      retrieveAlarms: jest.fn(() => Promise.resolve([])),
      storeAlarmEvents: jest.fn(() => Promise.resolve()),
      retrieveAlarmEvents: jest.fn(() => Promise.resolve([]))
    }))
  }
}));

jest.mock('../security', () => ({
  default: {
    checkRateLimit: jest.fn(() => true)
  }
}));

jest.mock('../error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn()
  }
}));

// Import mocked modules for type safety
import { scheduleLocalNotification, cancelLocalNotification } from '../capacitor';
import { alarmBattleIntegration } from '../alarm-battle-integration';
import AppAnalyticsService from '../app-analytics';
import SecureAlarmStorageService from '../secure-alarm-storage';
import SecurityService from '../security';
import { ErrorHandler } from '../error-handler';

describe('AlarmService', () => {
  let mockAlarms: Alarm[];
  let mockUser: User;
  let mockSecureStorage: any;
  let mockAnalytics: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup test data
    mockUser = createTestUser({ tier: 'premium' });
    mockAlarms = [
      createTestAlarm({ userId: mockUser.id, enabled: true }),
      createTestAlarm({ userId: mockUser.id, enabled: false }),
      createTestAlarm({ userId: 'other_user', enabled: true })
    ];

    // Setup mocks
    mockSecureStorage = {
      storeAlarms: jest.fn(() => Promise.resolve()),
      retrieveAlarms: jest.fn(() => Promise.resolve(mockAlarms)),
      storeAlarmEvents: jest.fn(() => Promise.resolve()),
      retrieveAlarmEvents: jest.fn(() => Promise.resolve([]))
    };
    
    mockAnalytics = {
      track: jest.fn()
    };

    (SecureAlarmStorageService.getInstance as jest.Mock).mockReturnValue(mockSecureStorage);
    (AppAnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalytics);
    (SecurityService.checkRateLimit as jest.Mock).mockReturnValue(true);

    // Reset static state
    (AlarmService as any).alarms = [];
    (AlarmService as any).checkInterval = null;
  });

  describe('loadAlarms', () => {
    it('should load alarms from secure storage successfully', async () => {
      const result = await AlarmService.loadAlarms(mockUser.id);

      expect(mockSecureStorage.retrieveAlarms).toHaveBeenCalledWith(mockUser.id);
      expect(SecurityService.checkRateLimit).toHaveBeenCalledWith('load_alarms', 20, 60000);
      expect(result).toHaveLength(mockAlarms.length);
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        time: expect.any(String),
        label: expect.any(String),
        enabled: expect.any(Boolean)
      });
    });

    it('should handle rate limiting for alarm loading', async () => {
      (SecurityService.checkRateLimit as jest.Mock).mockReturnValue(false);

      await expect(AlarmService.loadAlarms(mockUser.id)).rejects.toThrow('Too many alarm load attempts');
      expect(mockSecureStorage.retrieveAlarms).not.toHaveBeenCalled();
    });

    it('should filter invalid alarms during loading', async () => {
      const invalidAlarms = [
        ...mockAlarms,
        { id: '', time: 'invalid', label: '', days: [] }, // Invalid alarm
        { id: 'valid', time: '07:00', label: 'Test', days: [1, 2], voiceMood: 'motivational' } // Valid alarm
      ];
      
      mockSecureStorage.retrieveAlarms.mockResolvedValue(invalidAlarms);

      const result = await AlarmService.loadAlarms(mockUser.id);

      // Should filter out the invalid alarm
      expect(result).toHaveLength(mockAlarms.length + 1);
      expect(result.every(alarm => alarm.id && alarm.time && alarm.label)).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      mockSecureStorage.retrieveAlarms.mockRejectedValue(new Error('Storage error'));

      const result = await AlarmService.loadAlarms(mockUser.id);

      expect(ErrorHandler.handleError).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should start alarm checker after loading', async () => {
      jest.spyOn(global, 'setInterval');

      await AlarmService.loadAlarms(mockUser.id);

      expect(setInterval).toHaveBeenCalled();
    });
  });

  describe('saveAlarms', () => {
    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
    });

    it('should save alarms to secure storage successfully', async () => {
      await AlarmService.saveAlarms(mockUser.id);

      expect(mockSecureStorage.storeAlarms).toHaveBeenCalledWith(
        expect.any(Array),
        mockUser.id
      );
      expect(SecurityService.checkRateLimit).toHaveBeenCalledWith('save_alarms', 50, 60000);
    });

    it('should handle rate limiting for alarm saving', async () => {
      (SecurityService.checkRateLimit as jest.Mock).mockReturnValue(false);

      await expect(AlarmService.saveAlarms(mockUser.id)).rejects.toThrow('Too many alarm save attempts');
      expect(mockSecureStorage.storeAlarms).not.toHaveBeenCalled();
    });

    it('should handle storage errors during save', async () => {
      mockSecureStorage.storeAlarms.mockRejectedValue(new Error('Storage error'));

      await expect(AlarmService.saveAlarms(mockUser.id)).rejects.toThrow('Storage error');
      expect(ErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('createAlarm', () => {
    const alarmData = {
      time: '07:00',
      label: 'Morning Workout',
      days: [1, 2, 3, 4, 5], // Monday to Friday
      voiceMood: 'motivational' as VoiceMood,
      userId: 'user123',
      sound: 'default',
      difficulty: 'medium',
      snoozeEnabled: true,
      snoozeInterval: 5,
      maxSnoozes: 3
    };

    it('should create a new alarm successfully', async () => {
      const result = await AlarmService.createAlarm(alarmData);

      expect(result).toMatchObject({
        id: 'alarm_test_12345',
        userId: alarmData.userId,
        time: alarmData.time,
        label: alarmData.label,
        enabled: true,
        isActive: true,
        days: alarmData.days,
        voiceMood: alarmData.voiceMood,
        sound: alarmData.sound,
        difficulty: alarmData.difficulty,
        snoozeEnabled: true,
        snoozeInterval: 5,
        snoozeCount: 0
      });

      expect(generateAlarmId).toHaveBeenCalled();
      expect(mockSecureStorage.storeAlarms).toHaveBeenCalled();
      expect(scheduleLocalNotification).toHaveBeenCalled();
    });

    it('should handle invalid alarm data', async () => {
      const invalidData = {
        ...alarmData,
        time: 'invalid-time',
        days: [] // Empty days array
      };

      await expect(AlarmService.createAlarm(invalidData)).rejects.toThrow('Invalid alarm data');
    });

    it('should create alarm with default values', async () => {
      const minimalData = {
        time: '08:00',
        label: 'Test Alarm',
        days: [1],
        voiceMood: 'gentle' as VoiceMood
      };

      const result = await AlarmService.createAlarm(minimalData);

      expect(result.userId).toBe('default_user');
      expect(result.sound).toBe('default');
      expect(result.difficulty).toBe('medium');
      expect(result.snoozeEnabled).toBe(true);
      expect(result.snoozeInterval).toBe(5);
    });

    it('should create battle alarm with special configuration', async () => {
      const battleData = {
        ...alarmData,
        battleId: 'battle123'
      };

      const result = await AlarmService.createAlarm(battleData);

      expect(result.battleId).toBe('battle123');
    });
  });

  describe('updateAlarm', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
    });

    it('should update existing alarm successfully', async () => {
      const updateData = {
        time: '08:30',
        label: 'Updated Morning Workout',
        days: [1, 2, 3],
        voiceMood: 'drill-sergeant' as VoiceMood,
        sound: 'nature-birds',
        difficulty: 'hard'
      };

      const result = await AlarmService.updateAlarm(existingAlarm.id, updateData);

      expect(result).toMatchObject({
        id: existingAlarm.id,
        time: updateData.time,
        label: updateData.label,
        days: updateData.days,
        voiceMood: updateData.voiceMood,
        sound: updateData.sound,
        difficulty: updateData.difficulty
      });

      expect(mockSecureStorage.storeAlarms).toHaveBeenCalled();
      expect(cancelLocalNotification).toHaveBeenCalled();
      expect(scheduleLocalNotification).toHaveBeenCalled();
    });

    it('should handle non-existent alarm', async () => {
      const updateData = {
        time: '08:00',
        label: 'Test',
        days: [1],
        voiceMood: 'motivational' as VoiceMood
      };

      await expect(AlarmService.updateAlarm('non-existent', updateData)).rejects.toThrow('Alarm not found');
    });

    it('should validate updated alarm data', async () => {
      const invalidUpdateData = {
        time: 'invalid-time',
        label: 'Test',
        days: [1],
        voiceMood: 'motivational' as VoiceMood
      };

      await expect(AlarmService.updateAlarm(existingAlarm.id, invalidUpdateData)).rejects.toThrow('Invalid updated alarm data');
    });
  });

  describe('deleteAlarm', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
    });

    it('should delete alarm successfully', async () => {
      await AlarmService.deleteAlarm(existingAlarm.id, mockUser.id);

      expect(cancelLocalNotification).toHaveBeenCalled();
      expect(mockSecureStorage.storeAlarms).toHaveBeenCalled();
    });

    it('should handle non-existent alarm', async () => {
      await expect(AlarmService.deleteAlarm('non-existent', mockUser.id)).rejects.toThrow('Alarm not found');
    });

    it('should validate ownership before deletion', async () => {
      await expect(AlarmService.deleteAlarm(existingAlarm.id, 'other_user')).rejects.toThrow('Access denied');
    });

    it('should allow deletion of alarms without userId (legacy)', async () => {
      const legacyAlarm = { ...existingAlarm, userId: undefined };
      mockAlarms[0] = legacyAlarm as Alarm;

      await expect(AlarmService.deleteAlarm(legacyAlarm.id, 'any_user')).resolves.not.toThrow();
    });
  });

  describe('toggleAlarm', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
    });

    it('should toggle alarm to disabled', async () => {
      const result = await AlarmService.toggleAlarm(existingAlarm.id, false);

      expect(result.enabled).toBe(false);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(cancelLocalNotification).toHaveBeenCalled();
      expect(scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it('should toggle alarm to enabled', async () => {
      existingAlarm.enabled = false;
      const result = await AlarmService.toggleAlarm(existingAlarm.id, true);

      expect(result.enabled).toBe(true);
      expect(scheduleLocalNotification).toHaveBeenCalled();
    });

    it('should handle non-existent alarm', async () => {
      await expect(AlarmService.toggleAlarm('non-existent', true)).rejects.toThrow('Alarm not found');
    });

    it('should validate alarm data after toggle', async () => {
      // Mock validation to fail
      jest.spyOn(AlarmService as any, 'validateAlarmData').mockReturnValue(false);

      await expect(AlarmService.toggleAlarm(existingAlarm.id, true)).rejects.toThrow('Invalid alarm data after toggle');
    });
  });

  describe('dismissAlarm', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
    });

    it('should dismiss alarm successfully', async () => {
      await AlarmService.dismissAlarm(existingAlarm.id, 'voice', mockUser);

      expect(mockSecureStorage.storeAlarms).toHaveBeenCalled();
      expect(mockSecureStorage.storeAlarmEvents).toHaveBeenCalled();
      expect(scheduleLocalNotification).toHaveBeenCalled(); // Reschedule for next occurrence
    });

    it('should handle alarm with battle integration', async () => {
      existingAlarm.battleId = 'battle123';

      await AlarmService.dismissAlarm(existingAlarm.id, 'button', mockUser);

      expect(alarmBattleIntegration.handleAlarmDismissal).toHaveBeenCalledWith(
        expect.objectContaining({
          alarmId: existingAlarm.id,
          battleId: 'battle123'
        }),
        mockUser,
        expect.any(Date),
        'button'
      );
    });

    it('should handle non-existent alarm gracefully', async () => {
      await expect(AlarmService.dismissAlarm('non-existent', 'voice', mockUser)).resolves.not.toThrow();
    });

    it('should reset snooze count on dismissal', async () => {
      existingAlarm.snoozeCount = 3;

      await AlarmService.dismissAlarm(existingAlarm.id, 'voice', mockUser);

      const updatedAlarms = AlarmService.getAlarms();
      const updatedAlarm = updatedAlarms.find(a => a.id === existingAlarm.id);
      expect(updatedAlarm?.snoozeCount).toBe(0);
    });
  });

  describe('snoozeAlarm', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
      existingAlarm.snoozeEnabled = true;
      existingAlarm.snoozeCount = 0;
      existingAlarm.maxSnoozes = 3;
    });

    it('should snooze alarm successfully', async () => {
      await AlarmService.snoozeAlarm(existingAlarm.id, 10, mockUser);

      const updatedAlarms = AlarmService.getAlarms();
      const updatedAlarm = updatedAlarms.find(a => a.id === existingAlarm.id);
      expect(updatedAlarm?.snoozeCount).toBe(1);
      expect(scheduleLocalNotification).toHaveBeenCalled();
      expect(mockSecureStorage.storeAlarmEvents).toHaveBeenCalled();
    });

    it('should use custom snooze minutes', async () => {
      await AlarmService.snoozeAlarm(existingAlarm.id, 15, mockUser);

      expect(scheduleLocalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('15 minutes')
        })
      );
    });

    it('should use default snooze interval if not provided', async () => {
      existingAlarm.snoozeInterval = 7;

      await AlarmService.snoozeAlarm(existingAlarm.id, undefined, mockUser);

      const updatedAlarms = AlarmService.getAlarms();
      const updatedAlarm = updatedAlarms.find(a => a.id === existingAlarm.id);
      expect(updatedAlarm?.snoozeCount).toBe(1);
    });

    it('should respect max snoozes limit', async () => {
      existingAlarm.snoozeCount = 3;
      existingAlarm.maxSnoozes = 3;

      await AlarmService.snoozeAlarm(existingAlarm.id, 5, mockUser);

      // Should not increment snooze count
      const updatedAlarms = AlarmService.getAlarms();
      const updatedAlarm = updatedAlarms.find(a => a.id === existingAlarm.id);
      expect(updatedAlarm?.snoozeCount).toBe(3);
      expect(scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it('should handle battle alarms with snooze restrictions', async () => {
      existingAlarm.battleId = 'battle123';
      existingAlarm.snoozeEnabled = false;

      await AlarmService.snoozeAlarm(existingAlarm.id, 5, mockUser);

      // Should not snooze
      expect(scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it('should handle battle integration for snooze', async () => {
      existingAlarm.battleId = 'battle123';

      await AlarmService.snoozeAlarm(existingAlarm.id, 5, mockUser);

      expect(alarmBattleIntegration.handleAlarmSnooze).toHaveBeenCalled();
    });

    it('should handle non-existent alarm gracefully', async () => {
      await expect(AlarmService.snoozeAlarm('non-existent', 5, mockUser)).resolves.not.toThrow();
    });
  });

  describe('getAlarms', () => {
    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
    });

    it('should return all loaded alarms', () => {
      const result = AlarmService.getAlarms();

      expect(result).toHaveLength(mockAlarms.length);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String) })
      ]));
    });
  });

  describe('getAlarmById', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
    });

    it('should return alarm by ID', () => {
      const result = AlarmService.getAlarmById(existingAlarm.id);

      expect(result).toEqual(existingAlarm);
    });

    it('should return undefined for non-existent alarm', () => {
      const result = AlarmService.getAlarmById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('createBattleAlarm', () => {
    const battleAlarmData = {
      time: '06:00',
      label: 'Battle Alarm',
      days: [1, 2, 3, 4, 5],
      voiceMood: 'drill-sergeant' as VoiceMood,
      battleId: 'battle123',
      userId: mockUser.id,
      difficulty: 'hard'
    };

    it('should create battle alarm successfully', async () => {
      const mockBattleAlarm = createTestAlarm({ battleId: 'battle123' });
      (alarmBattleIntegration.createBattleAlarm as jest.Mock).mockResolvedValue(mockBattleAlarm);

      const result = await AlarmService.createBattleAlarm(battleAlarmData);

      expect(alarmBattleIntegration.createBattleAlarm).toHaveBeenCalled();
      expect(result.battleId).toBe('battle123');
      expect(mockSecureStorage.storeAlarms).toHaveBeenCalled();
      expect(scheduleLocalNotification).toHaveBeenCalled();
    });

    it('should validate battle alarm data', async () => {
      const invalidBattleAlarm = { ...createTestAlarm(), time: 'invalid' };
      (alarmBattleIntegration.createBattleAlarm as jest.Mock).mockResolvedValue(invalidBattleAlarm);

      await expect(AlarmService.createBattleAlarm(battleAlarmData)).rejects.toThrow('Invalid battle alarm data');
    });
  });

  describe('getBattleAlarms', () => {
    beforeEach(async () => {
      mockAlarms[0].battleId = 'battle123';
      await AlarmService.loadAlarms(mockUser.id);
    });

    it('should return only battle alarms for user', () => {
      const result = AlarmService.getBattleAlarms(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0].battleId).toBe('battle123');
      expect(result[0].userId).toBe(mockUser.id);
    });
  });

  describe('getNonBattleAlarms', () => {
    beforeEach(async () => {
      mockAlarms[0].battleId = 'battle123';
      await AlarmService.loadAlarms(mockUser.id);
    });

    it('should return only non-battle alarms for user', () => {
      const result = AlarmService.getNonBattleAlarms(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0].battleId).toBeUndefined();
      expect(result[0].userId).toBe(mockUser.id);
    });
  });

  describe('unlinkAlarmFromBattle', () => {
    let battleAlarm: Alarm;

    beforeEach(async () => {
      mockAlarms[0].battleId = 'battle123';
      await AlarmService.loadAlarms(mockUser.id);
      battleAlarm = mockAlarms[0];
    });

    it('should unlink alarm from battle successfully', async () => {
      await AlarmService.unlinkAlarmFromBattle(battleAlarm.id);

      const updatedAlarms = AlarmService.getAlarms();
      const updatedAlarm = updatedAlarms.find(a => a.id === battleAlarm.id);
      expect(updatedAlarm?.battleId).toBeUndefined();
      expect(updatedAlarm?.snoozeEnabled).toBe(true);
      expect(alarmBattleIntegration.unlinkAlarmFromBattle).toHaveBeenCalled();
    });

    it('should handle non-existent alarm gracefully', async () => {
      await expect(AlarmService.unlinkAlarmFromBattle('non-existent')).resolves.not.toThrow();
    });
  });

  describe('validateAlarmOwnership', () => {
    let existingAlarm: Alarm;

    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      existingAlarm = mockAlarms[0];
    });

    it('should validate ownership for owned alarm', () => {
      const result = AlarmService.validateAlarmOwnership(existingAlarm.id, mockUser.id);

      expect(result).toBe(true);
    });

    it('should reject ownership for non-owned alarm', () => {
      const result = AlarmService.validateAlarmOwnership(existingAlarm.id, 'other_user');

      expect(result).toBe(false);
    });

    it('should allow access to legacy alarms without userId', () => {
      existingAlarm.userId = undefined as any;
      const result = AlarmService.validateAlarmOwnership(existingAlarm.id, 'any_user');

      expect(result).toBe(true);
    });

    it('should return false for non-existent alarm', () => {
      const result = AlarmService.validateAlarmOwnership('non-existent', mockUser.id);

      expect(result).toBe(false);
    });
  });

  describe('getUserAlarms', () => {
    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
    });

    it('should return alarms for specific user', () => {
      const result = AlarmService.getUserAlarms(mockUser.id);

      expect(result).toHaveLength(2); // Two alarms for mockUser.id
      expect(result.every(alarm => !alarm.userId || alarm.userId === mockUser.id)).toBe(true);
    });

    it('should include legacy alarms without userId', () => {
      mockAlarms[0].userId = undefined as any;
      const result = AlarmService.getUserAlarms('any_user');

      expect(result.some(alarm => !alarm.userId)).toBe(true);
    });
  });

  describe('validateAlarmData (private method)', () => {
    it('should validate correct alarm data', () => {
      const validAlarm = {
        id: 'test123',
        time: '07:30',
        label: 'Test Alarm',
        voiceMood: 'motivational' as VoiceMood,
        days: [1, 2, 3],
        snoozeInterval: 5
      };

      const result = (AlarmService as any).validateAlarmData(validAlarm);
      expect(result).toBe(true);
    });

    it('should reject alarm with missing required fields', () => {
      const invalidAlarm = {
        time: '07:30',
        label: 'Test Alarm'
        // Missing id, voiceMood, days
      };

      const result = (AlarmService as any).validateAlarmData(invalidAlarm);
      expect(result).toBe(false);
    });

    it('should reject alarm with invalid time format', () => {
      const invalidAlarm = {
        id: 'test123',
        time: '25:70', // Invalid time
        label: 'Test Alarm',
        voiceMood: 'motivational',
        days: [1, 2, 3]
      };

      const result = (AlarmService as any).validateAlarmData(invalidAlarm);
      expect(result).toBe(false);
    });

    it('should reject alarm with empty days array', () => {
      const invalidAlarm = {
        id: 'test123',
        time: '07:30',
        label: 'Test Alarm',
        voiceMood: 'motivational',
        days: []
      };

      const result = (AlarmService as any).validateAlarmData(invalidAlarm);
      expect(result).toBe(false);
    });

    it('should reject alarm with invalid day values', () => {
      const invalidAlarm = {
        id: 'test123',
        time: '07:30',
        label: 'Test Alarm',
        voiceMood: 'motivational',
        days: [1, 2, 8] // 8 is invalid (should be 0-6)
      };

      const result = (AlarmService as any).validateAlarmData(invalidAlarm);
      expect(result).toBe(false);
    });

    it('should reject alarm with too long label', () => {
      const invalidAlarm = {
        id: 'test123',
        time: '07:30',
        label: 'A'.repeat(101), // Too long
        voiceMood: 'motivational',
        days: [1, 2, 3]
      };

      const result = (AlarmService as any).validateAlarmData(invalidAlarm);
      expect(result).toBe(false);
    });

    it('should reject alarm with invalid snooze interval', () => {
      const invalidAlarm = {
        id: 'test123',
        time: '07:30',
        label: 'Test Alarm',
        voiceMood: 'motivational',
        days: [1, 2, 3],
        snoozeInterval: 65 // Too high (max 60)
      };

      const result = (AlarmService as any).validateAlarmData(invalidAlarm);
      expect(result).toBe(false);
    });
  });

  describe('checkForTriggeredAlarms (private method)', () => {
    beforeEach(async () => {
      await AlarmService.loadAlarms(mockUser.id);
      
      // Mock current time to match alarm time
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(7);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should trigger alarm when time matches', () => {
      const testAlarm = mockAlarms[0];
      testAlarm.time = '07:00';
      testAlarm.days = [1]; // Monday
      testAlarm.enabled = true;

      jest.spyOn(window, 'dispatchEvent');

      (AlarmService as any).checkForTriggeredAlarms();

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'alarm-triggered',
          detail: expect.objectContaining({
            alarm: testAlarm
          })
        })
      );
    });

    it('should not trigger disabled alarms', () => {
      const testAlarm = mockAlarms[0];
      testAlarm.time = '07:00';
      testAlarm.days = [1]; // Monday
      testAlarm.enabled = false;

      jest.spyOn(window, 'dispatchEvent');

      (AlarmService as any).checkForTriggeredAlarms();

      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should not trigger alarms on wrong day', () => {
      const testAlarm = mockAlarms[0];
      testAlarm.time = '07:00';
      testAlarm.days = [2]; // Tuesday, but current day is Monday
      testAlarm.enabled = true;

      jest.spyOn(window, 'dispatchEvent');

      (AlarmService as any).checkForTriggeredAlarms();

      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should handle battle alarms', async () => {
      const testAlarm = mockAlarms[0];
      testAlarm.time = '07:00';
      testAlarm.days = [1];
      testAlarm.enabled = true;
      testAlarm.battleId = 'battle123';

      (AlarmService as any).checkForTriggeredAlarms();

      expect(alarmBattleIntegration.handleAlarmTrigger).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle errors in alarm creation', async () => {
      mockSecureStorage.storeAlarms.mockRejectedValue(new Error('Storage error'));

      const alarmData = {
        time: '07:00',
        label: 'Test',
        days: [1],
        voiceMood: 'motivational' as VoiceMood
      };

      await expect(AlarmService.createAlarm(alarmData)).rejects.toThrow();
      expect(ErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should handle errors in notification scheduling', async () => {
      (scheduleLocalNotification as jest.Mock).mockRejectedValue(new Error('Notification error'));

      const alarmData = {
        time: '07:00',
        label: 'Test',
        days: [1],
        voiceMood: 'motivational' as VoiceMood
      };

      // Should not throw even if notification fails
      await expect(AlarmService.createAlarm(alarmData)).resolves.toBeDefined();
    });
  });

  describe('Security events', () => {
    it('should log security events for important operations', async () => {
      jest.spyOn(window, 'dispatchEvent');

      const alarmData = {
        time: '07:00',
        label: 'Test',
        days: [1],
        voiceMood: 'motivational' as VoiceMood
      };

      await AlarmService.createAlarm(alarmData);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'alarm-security-event',
          detail: expect.objectContaining({
            event: 'alarm_created',
            source: 'AlarmService'
          })
        })
      );
    });
  });
});

describe('enhancedAlarmTracking', () => {
  let mockUser: User;
  let mockAlarm: Alarm;
  let mockAnalytics: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = createTestUser();
    mockAlarm = createTestAlarm({ userId: mockUser.id });
    mockAnalytics = { track: jest.fn() };

    (AppAnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalytics);
    (AlarmService as any).alarms = [mockAlarm];
    
    jest.spyOn(AlarmService, 'validateAlarmOwnership').mockReturnValue(true);
  });

  describe('trackAlarmPerformance', () => {
    it('should track alarm performance for valid alarm', async () => {
      jest.spyOn(AlarmService, 'getAlarmById').mockReturnValue(mockAlarm);

      await enhancedAlarmTracking.trackAlarmPerformance(mockAlarm.id, mockUser.id);

      expect(mockAnalytics.track).toHaveBeenCalledWith('alarm_performance', {
        alarmId: mockAlarm.id,
        userId: mockUser.id,
        difficulty: mockAlarm.difficulty,
        hasBattle: !!mockAlarm.battleId,
        battleId: mockAlarm.battleId,
        snoozeCount: mockAlarm.snoozeCount,
        voiceMood: mockAlarm.voiceMood
      });
    });

    it('should not track performance for non-existent alarm', async () => {
      jest.spyOn(AlarmService, 'getAlarmById').mockReturnValue(undefined);

      await enhancedAlarmTracking.trackAlarmPerformance('non-existent', mockUser.id);

      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });

    it('should not track performance if ownership validation fails', async () => {
      jest.spyOn(AlarmService, 'getAlarmById').mockReturnValue(mockAlarm);
      jest.spyOn(AlarmService, 'validateAlarmOwnership').mockReturnValue(false);

      await enhancedAlarmTracking.trackAlarmPerformance(mockAlarm.id, 'other_user');

      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });
  });

  describe('trackBattleAlarmUsage', () => {
    beforeEach(() => {
      const battleAlarm = createTestAlarm({ userId: mockUser.id, battleId: 'battle123' });
      const regularAlarm = createTestAlarm({ userId: mockUser.id });

      jest.spyOn(AlarmService, 'getBattleAlarms').mockReturnValue([battleAlarm]);
      jest.spyOn(AlarmService, 'getNonBattleAlarms').mockReturnValue([regularAlarm]);
    });

    it('should track battle alarm usage statistics', async () => {
      await enhancedAlarmTracking.trackBattleAlarmUsage(mockUser.id);

      expect(mockAnalytics.track).toHaveBeenCalledWith('alarm_battle_usage', {
        userId: mockUser.id,
        battleAlarmsCount: 1,
        regularAlarmsCount: 1,
        battleParticipationRate: 0.5
      });
    });

    it('should validate ownership before tracking', async () => {
      jest.spyOn(AlarmService, 'validateAlarmOwnership').mockReturnValue(false);

      await enhancedAlarmTracking.trackBattleAlarmUsage(mockUser.id);

      expect(mockAnalytics.track).toHaveBeenCalledWith('alarm_battle_usage', {
        userId: mockUser.id,
        battleAlarmsCount: 0,
        regularAlarmsCount: 0,
        battleParticipationRate: 0
      });
    });
  });
});