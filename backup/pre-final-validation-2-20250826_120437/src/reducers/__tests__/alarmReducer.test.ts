/**
 * Integration tests for AlarmReducer
 * Tests that the reducer handles typed payloads correctly
 */

import { alarmReducer } from '../alarmReducer';
import { INITIAL_ALARM_STATE } from '../../constants/initialDomainState';
import type { AlarmState, AlarmAction } from '../../types/app-state';
import type { Alarm } from '../../types/domain';

describe('AlarmReducer Integration Tests', () => {
  let initialState: AlarmState;

  beforeEach(() => {
    initialState = INITIAL_ALARM_STATE;
  });

  describe('Alarm Creation', () => {
    it('should handle ALARM_CREATE_SUCCESS with typed alarm payload', () => {
      const mockAlarm: Alarm = {
        id: 'alarm-123',
        userId: 'user-456',
        title: 'Morning Workout',
        time: '06:30',
        enabled: true,
        isActive: true,
        days: [1, 2, 3, 4, 5], // Monday to Friday
        dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        sound: 'default',
        volume: 0.8,
        snoozeEnabled: true,
        snoozeInterval: 10,
        maxSnoozes: 3,
        snoozeCount: 0,
        difficulty: 'medium',
        createdAt: new Date('2024-01-01T06:30:00Z'),
        updatedAt: new Date('2024-01-01T06:30:00Z'),
      };

      const action: AlarmAction = {
        type: 'ALARM_CREATE_SUCCESS',
        payload: { alarm: mockAlarm },
      };

      const newState = alarmReducer(initialState, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.alarms).toHaveLength(1);
      expect(newState.alarms[0]).toEqual(mockAlarm);
      expect(newState.activeAlarms).toHaveLength(1);
      expect(newState.activeAlarms[0]).toEqual(mockAlarm);
    });

    it('should handle ALARM_CREATE_ERROR with typed error payload', () => {
      const action: AlarmAction = {
        type: 'ALARM_CREATE_ERROR',
        payload: { error: 'Failed to create alarm' },
      };

      const newState = alarmReducer(initialState, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe('Failed to create alarm');
      expect(newState.alarms).toHaveLength(0);
    });
  });

  describe('Alarm Dismissal', () => {
    it('should handle ALARM_DISMISS with typed alarm id payload', () => {
      // Setup initial state with a triggered alarm
      const mockAlarm: Alarm = {
        id: 'alarm-123',
        userId: 'user-456',
        title: 'Test Alarm',
        time: '07:00',
        enabled: true,
        isActive: true,
        days: [1],
        dayNames: ['monday'],
        sound: 'default',
        volume: 0.8,
        snoozeEnabled: true,
        snoozeInterval: 5,
        maxSnoozes: 3,
        snoozeCount: 0,
        difficulty: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const stateWithTriggeredAlarm: AlarmState = {
        ...initialState,
        currentlyTriggering: [mockAlarm.id],
        alarms: [mockAlarm],
      };

      const action: AlarmAction = {
        type: 'ALARM_DISMISS',
        payload: { alarmId: mockAlarm.id, method: 'button' },
      };

      const newState = alarmReducer(stateWithTriggeredAlarm, action);

      expect(newState.currentlyTriggering).toHaveLength(0);
      expect(newState.dismissing).toContain(mockAlarm.id);
    });
  });

  describe('Alarm Toggle', () => {
    it('should handle ALARM_TOGGLE with typed toggle payload', () => {
      const mockAlarm: Alarm = {
        id: 'alarm-123',
        userId: 'user-456',
        title: 'Test Alarm',
        time: '07:00',
        enabled: true,
        isActive: true,
        days: [1],
        dayNames: ['monday'],
        sound: 'default',
        volume: 0.8,
        snoozeEnabled: true,
        snoozeInterval: 5,
        maxSnoozes: 3,
        snoozeCount: 0,
        difficulty: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const stateWithAlarm: AlarmState = {
        ...initialState,
        alarms: [mockAlarm],
        activeAlarms: [mockAlarm],
      };

      const action: AlarmAction = {
        type: 'ALARM_TOGGLE',
        payload: { alarmId: mockAlarm.id, enabled: false },
      };

      const newState = alarmReducer(stateWithAlarm, action);

      const updatedAlarm = newState.alarms.find(a => a.id === mockAlarm.id);
      expect(updatedAlarm?.enabled).toBe(false);
      expect(updatedAlarm?.isActive).toBe(false);
      expect(newState.activeAlarms).toHaveLength(0);
    });
  });

  describe('Loading States', () => {
    it('should handle ALARMS_LOAD_START correctly', () => {
      const action: AlarmAction = {
        type: 'ALARMS_LOAD_START',
        payload: {},
      };

      const newState = alarmReducer(initialState, action);

      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });

    it('should handle ALARMS_LOAD_ERROR correctly', () => {
      const stateWithLoading: AlarmState = {
        ...initialState,
        isLoading: true,
      };

      const action: AlarmAction = {
        type: 'ALARMS_LOAD_ERROR',
        payload: { error: 'Network error' },
      };

      const newState = alarmReducer(stateWithLoading, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe('Network error');
    });
  });
});
