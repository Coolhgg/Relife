/**
 * Alarm State Reducer
 * Handles all alarm-related state mutations with type safety
 */

import type { AlarmState, AlarmAction } from '../types/app-state';
import { INITIAL_ALARM_STATE } from '../constants/initialDomainState';

export const alarmReducer = (
  state: AlarmState = INITIAL_ALARM_STATE,
  action: AlarmAction
): AlarmState => {
  switch (action.type) {
    // =============================================================================
    // ALARM LOADING ACTIONS
    // =============================================================================
    case 'ALARMS_LOAD_START':
      return {
        ...state,
        isLoading: true,
        loadError: null,
      };

    case 'ALARMS_LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        alarms: action.payload,
        activeAlarms: action.payload.filter(alarm => alarm.enabled),
        lastUpdated: new Date(),
        loadError: null,
      };

    case 'ALARMS_LOAD_ERROR':
      return {
        ...state,
        isLoading: false,
        loadError: action.payload,
      };

    // =============================================================================
    // ALARM CREATION ACTIONS
    // =============================================================================
    case 'ALARM_CREATE_START':
      return {
        ...state,
        isSaving: true,
        saveError: null,
        editing: {
          ...state.editing,
          isCreating: true,
        },
      };

    case 'ALARM_CREATE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        alarms: [...state.alarms, action.payload],
        activeAlarms: action.payload.enabled
          ? [...state.activeAlarms, action.payload]
          : state.activeAlarms,
        editing: {
          alarmId: null,
          isCreating: false,
          isDirty: false,
          draftAlarm: null,
          validationErrors: {},
        },
        saveError: null,
      };

    case 'ALARM_CREATE_ERROR':
      return {
        ...state,
        isSaving: false,
        saveError: action.payload,
      };

    // =============================================================================
    // ALARM UPDATE ACTIONS
    // =============================================================================
    case 'ALARM_UPDATE_START':
      return {
        ...state,
        isSaving: true,
        saveError: null,
      };

    case 'ALARM_UPDATE_SUCCESS': {
      const updatedAlarms = state.alarms.map(alarm =>
        alarm.id === action.payload.id ? action.payload : alarm
      );
      
      return {
        ...state,
        isSaving: false,
        alarms: updatedAlarms,
        activeAlarms: updatedAlarms.filter(alarm => alarm.enabled),
        editing: {
          alarmId: null,
          isCreating: false,
          isDirty: false,
          draftAlarm: null,
          validationErrors: {},
        },
        saveError: null,
      };
    }

    case 'ALARM_UPDATE_ERROR':
      return {
        ...state,
        isSaving: false,
        saveError: action.payload.error,
      };

    // =============================================================================
    // ALARM MANAGEMENT ACTIONS  
    // =============================================================================
    case 'ALARM_DELETE': {
      const filteredAlarms = state.alarms.filter(alarm => alarm.id !== action.payload);
      return {
        ...state,
        alarms: filteredAlarms,
        activeAlarms: filteredAlarms.filter(alarm => alarm.enabled),
        // Remove from currently triggering if it was
        currentlyTriggering: state.currentlyTriggering.filter(id => id !== action.payload),
        // Remove from snoozing if it was
        snoozing: Object.fromEntries(
          Object.entries(state.snoozing).filter(([id]) => id !== action.payload)
        ),
      };
    }

    case 'ALARM_TOGGLE': {
      const updatedAlarms = state.alarms.map(alarm =>
        alarm.id === action.payload.id
          ? { ...alarm, enabled: action.payload.enabled }
          : alarm
      );
      
      return {
        ...state,
        alarms: updatedAlarms,
        activeAlarms: updatedAlarms.filter(alarm => alarm.enabled),
      };
    }

    // =============================================================================
    // ALARM EXECUTION ACTIONS
    // =============================================================================
    case 'ALARM_TRIGGER': {
      const alarmId = action.payload;
      return {
        ...state,
        currentlyTriggering: state.currentlyTriggering.includes(alarmId)
          ? state.currentlyTriggering
          : [...state.currentlyTriggering, alarmId],
      };
    }

    case 'ALARM_SNOOZE': {
      const { id, snoozeUntil } = action.payload;
      const currentSnoozeInfo = state.snoozing[id] || { snoozeCount: 0, snoozeUntil: new Date() };
      
      return {
        ...state,
        currentlyTriggering: state.currentlyTriggering.filter(triggerId => triggerId !== id),
        snoozing: {
          ...state.snoozing,
          [id]: {
            snoozeCount: currentSnoozeInfo.snoozeCount + 1,
            snoozeUntil,
          },
        },
      };
    }

    case 'ALARM_DISMISS': {
      const alarmId = action.payload;
      return {
        ...state,
        currentlyTriggering: state.currentlyTriggering.filter(id => id !== alarmId),
        dismissing: state.dismissing.filter(id => id !== alarmId),
        // Remove from snoozing if it was snoozed
        snoozing: Object.fromEntries(
          Object.entries(state.snoozing).filter(([id]) => id !== alarmId)
        ),
      };
    }

    // =============================================================================
    // ALARM EDITING ACTIONS
    // =============================================================================
    case 'SET_EDITING_ALARM':
      return {
        ...state,
        editing: {
          ...state.editing,
          alarmId: action.payload.alarmId,
          isCreating: action.payload.isCreating,
          isDirty: false,
          draftAlarm: action.payload.alarmId
            ? state.alarms.find(alarm => alarm.id === action.payload.alarmId) || null
            : null,
          validationErrors: {},
        },
      };

    case 'UPDATE_DRAFT_ALARM':
      return {
        ...state,
        editing: {
          ...state.editing,
          isDirty: true,
          draftAlarm: state.editing.draftAlarm
            ? { ...state.editing.draftAlarm, ...action.payload }
            : action.payload,
        },
      };

    case 'SET_ALARM_VALIDATION_ERRORS':
      return {
        ...state,
        editing: {
          ...state.editing,
          validationErrors: action.payload,
        },
      };

    // =============================================================================
    // ADVANCED SCHEDULING ACTIONS
    // =============================================================================
    case 'UPDATE_SCHEDULING_CONFIG':
      return {
        ...state,
        schedulingConfigs: {
          ...state.schedulingConfigs,
          [action.payload.alarmId]: action.payload.config,
        },
      };

    // =============================================================================
    // DEFAULT CASE
    // =============================================================================
    default:
      return state;
  }
};