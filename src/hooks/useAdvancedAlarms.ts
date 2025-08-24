import { useState, useEffect } from 'react';
import { AlarmService } from '../services/alarm';
import type { Alarm } from '../types';

export function useAdvancedAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    try {
      setLoading(true);
      const loadedAlarms = await AlarmService.loadAlarms();

      // Convert basic alarms to advanced alarms with default values
      const advancedAlarms = loadedAlarms.map(alarm => ({
        ...alarm,
        scheduleType: 'daily',
        recurrencePattern: undefined,
        conditionalRules: [],
        locationTriggers: [],
        calendarIntegration: undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        seasonalAdjustments: [],
        smartOptimizations: [],
        dependencies: [],
      }));

      setAlarms(advancedAlarms);
      setError(null);
    } catch (_error) {
      console._error('Error loading alarms:', _error);
      setError('Failed to load alarms');
    } finally {
      setLoading(false);
    }
  };

  const createAlarm = async (alarmData: any) => {
    try {
      setLoading(true);
      const newAlarm = await AlarmService.createAlarm(alarmData);
      setAlarms((prev: Alarm[]) => [...prev, newAlarm]);
      setError(null);
      return newAlarm;
    } catch (_error) {
      console.error('Error creating alarm:', _error);
      setError('Failed to create alarm');
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  const updateAlarm = async (id: string, alarmData: any) => {
    try {
      setLoading(true);
      await AlarmService.updateAlarm(id, alarmData);

      setAlarms((prev: Alarm[]) =>
        prev.map((alarm: Alarm) =>
          alarm.id === id ? { ...alarm, ...alarmData } : alarm
        )
      );
      setError(null);
    } catch (_error) {
      console.error('Error updating alarm:', _error);
      setError('Failed to update alarm');
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      setLoading(true);
      await AlarmService.deleteAlarm(id);
      setAlarms((prev: Alarm[]) => prev.filter((alarm: Alarm) => alarm.id !== id));
      setError(null);
    } catch (_error) {
      console.error('Error deleting alarm:', _error);
      setError('Failed to delete alarm');
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  return {
    alarms,
    loading,
    _error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    refresh: loadAlarms,
  };
}
