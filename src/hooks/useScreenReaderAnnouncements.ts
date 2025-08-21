/// <reference types="node" />
// Enhanced Screen Reader Hook for automatic state change announcements
import { useEffect, useRef, useCallback } from 'react';
import ScreenReaderService, { type AlarmAnnouncement } from '../utils/screen-reader';
import type { Alarm } from '../types';

interface UseScreenReaderOptions {
  enabled?: boolean;
  verbosity?: 'low' | 'medium' | 'high';
  announceNavigation?: boolean;
  announceStateChanges?: boolean;
}

interface StateChangeAnnouncement {
  type: 'alarm-toggle' | 'alarm-create' | 'alarm-update' | 'alarm-delete' | 'navigation' | 'error' | 'success' | 'loading' | 'custom';
  message?: string;
  data?: any;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export function useScreenReaderAnnouncements(options: UseScreenReaderOptions = {}) {
  const {
    enabled = true,
    verbosity = 'medium',
    announceNavigation = true,
    announceStateChanges = true
  } = options;

  const screenReader = useRef<ScreenReaderService>();
  const previousValues = useRef<Record<string, any>>({});

  useEffect(() => {
    if (enabled) {
      screenReader.current = ScreenReaderService.getInstance();
      screenReader.current.updateSettings({
        isEnabled: true,
        verbosityLevel: verbosity,
        autoAnnounceChanges: announceStateChanges
      });
    }
  }, [enabled, verbosity, announceStateChanges]);

  const announce = useCallback((announcement: StateChangeAnnouncement) => {
    if (!enabled || !screenReader.current) return;

    const { type, message, data, priority = 'polite', delay = 0 } = announcement;

    const announcementText = message || '';

    switch (type) {
      case 'alarm-toggle':
        if (data?.alarm && data?.enabled !== undefined) {
          const alarm = data.alarm as Alarm;
          const alarmData: AlarmAnnouncement = {
            id: alarm.id,
            time: alarm.time,
            label: alarm.label,
            isActive: data.enabled,
            repeatDays: alarm.days || [],
            voiceMood: alarm.voiceMood
          };
          screenReader.current.announceAlarm(alarmData, 'toggled');
        }
        break;

      case 'alarm-create':
        if (data?.alarm) {
          const alarm = data.alarm as Alarm;
          const alarmData: AlarmAnnouncement = {
            id: alarm.id,
            time: alarm.time,
            label: alarm.label,
            isActive: alarm.enabled,
            repeatDays: alarm.days || [],
            voiceMood: alarm.voiceMood
          };
          screenReader.current.announceAlarm(alarmData, 'created');
        }
        break;

      case 'alarm-update':
        if (data?.alarm) {
          const alarm = data.alarm as Alarm;
          const alarmData: AlarmAnnouncement = {
            id: alarm.id,
            time: alarm.time,
            label: alarm.label,
            isActive: alarm.enabled,
            repeatDays: alarm.days || [],
            voiceMood: alarm.voiceMood
          };
          screenReader.current.announceAlarm(alarmData, 'updated');
        }
        break;

      case 'alarm-delete':
        if (data?.alarm) {
          const alarm = data.alarm as Alarm;
          const alarmData: AlarmAnnouncement = {
            id: alarm.id,
            time: alarm.time,
            label: alarm.label,
            isActive: false,
            repeatDays: alarm.days || [],
            voiceMood: alarm.voiceMood
          };
          screenReader.current.announceAlarm(alarmData, 'deleted');
        }
        break;

      case 'navigation':
        if (data?.pageName && announceNavigation) {
          screenReader.current.announceNavigation(data.pageName, data.pageDescription);
        }
        break;

      case 'error':
        if (data?.fieldName && data?.errorMessage) {
          screenReader.current.announceFormError(data.fieldName, data.errorMessage);
        } else if (announcementText) {
          screenReader.current.announce(`Error: ${announcementText}`, 'assertive');
        }
        break;

      case 'success':
        if (announcementText) {
          screenReader.current.announceSuccess(announcementText);
        }
        break;

      case 'loading':
        if (data?.action && data?.isLoading !== undefined) {
          screenReader.current.announceLoading(data.action, data.isLoading);
        }
        break;

      case 'custom':
        if (announcementText) {
          screenReader.current.announce(announcementText, priority, { delay });
        }
        break;

      default:
        if (announcementText) {
          screenReader.current.announce(announcementText, priority, { delay });
        }
        break;
    }
  }, [enabled, announceNavigation]);

  // Track value changes automatically
  const trackChange = useCallback((key: string, newValue: any, announcement?: Partial<StateChangeAnnouncement>) => {
    if (!enabled) return;

    const previousValue = previousValues.current[key];

    if (previousValue !== newValue) {
      previousValues.current[key] = newValue;

      if (announcement) {
        announce({
          type: 'custom',
          priority: 'polite',
          ...announcement
        });
      }
    }
  }, [enabled, announce]);

  // Enhanced announcements for different scenarios
  const announceFormValidation = useCallback((fieldName: string, isValid: boolean, errorMessage?: string) => {
    if (!isValid && errorMessage) {
      announce({
        type: 'error',
        data: { fieldName, errorMessage },
        priority: 'assertive'
      });
    }
  }, [announce]);

  const announceListChange = useCallback((listName: string, action: 'added' | 'removed' | 'updated', itemDescription: string) => {
    announce({
      type: 'custom',
      message: `${itemDescription} ${action} ${action === 'added' ? 'to' : action === 'removed' ? 'from' : 'in'} ${listName}`,
      priority: 'polite'
    });
  }, [announce]);

  const announceStatusChange = useCallback((componentName: string, oldStatus: string, newStatus: string) => {
    announce({
      type: 'custom',
      message: `${componentName} status changed from ${oldStatus} to ${newStatus}`,
      priority: 'polite'
    });
  }, [announce]);

  const announceInteraction = useCallback((elementType: string, elementName: string, action: string) => {
    announce({
      type: 'custom',
      message: `${action} ${elementType}: ${elementName}`,
      priority: 'polite',
      delay: 100
    });
  }, [announce]);

  return {
    announce,
    trackChange,
    announceFormValidation,
    announceListChange,
    announceStatusChange,
    announceInteraction,
    isEnabled: enabled
  };
}

// Hook for component focus announcements
export function useFocusAnnouncements(componentName: string, enabled = true) {
  const { announce } = useScreenReaderAnnouncements({ enabled });

  const announceFocus = useCallback((elementType: string, elementLabel: string, additionalContext?: string) => {
    if (!enabled) return;

    const service = ScreenReaderService.getInstance();
    service.announceFocusChange(elementType, elementLabel, additionalContext);
  }, [enabled]);

  const announceEnter = useCallback((description?: string) => {
    announce({
      type: 'custom',
      message: `Entered ${componentName}${description ? `. ${description}` : ''}`,
      priority: 'polite'
    });
  }, [announce, componentName]);

  const announceExit = useCallback((description?: string) => {
    announce({
      type: 'custom',
      message: `Exited ${componentName}${description ? `. ${description}` : ''}`,
      priority: 'polite'
    });
  }, [announce, componentName]);

  return {
    announceFocus,
    announceEnter,
    announceExit
  };
}

// Hook for automatic state announcements with comparison
export function useStateChangeAnnouncements<T>(
  stateName: string,
  currentValue: T,
  formatter?: (value: T) => string,
  options: {
    enabled?: boolean;
    compareDeep?: boolean;
    debounceMs?: number;
    priority?: 'polite' | 'assertive';
  } = {}
) {
  const { enabled = true, compareDeep = false, debounceMs = 100, priority = 'polite' } = options;
  const { announce } = useScreenReaderAnnouncements({ enabled });
  const previousValue = useRef<T>();
  const timeoutRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const hasChanged = compareDeep
      ? JSON.stringify(previousValue.current) !== JSON.stringify(currentValue)
      : previousValue.current !== currentValue;

    if (hasChanged && previousValue.current !== undefined) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce announcements
      timeoutRef.current = setTimeout(() => {
        const formattedValue = formatter ? formatter(currentValue) : String(currentValue);
        announce({
          type: 'custom',
          message: `${stateName} changed to ${formattedValue}`,
          priority
        });
      }, debounceMs);
    }

    previousValue.current = currentValue;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentValue, enabled, compareDeep, debounceMs, priority, formatter, stateName, announce]);
}

export default useScreenReaderAnnouncements;