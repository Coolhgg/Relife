import { useState, useEffect } from 'react';
import { AlarmService } from '../services/alarm';

export function useAdvancedAlarms() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        dependencies: []
      }));

      setAlarms(advancedAlarms);
      setError(null);
    } catch (error) {
      console.error('Error loading alarms:', error);
      setError('Failed to load alarms');
    } finally {
      setLoading(false);
    }
  };

  const createAlarm = async (alarmData: any) => {
    try {
      setLoading(true);
      const newAlarm = await AlarmService.createAlarm(alarmData);
      setAlarms(prev => [...prev, newAlarm]);
      setError(null);
      return newAlarm;
    } catch (error) {
      console.error('Error creating alarm:', error);
      setError('Failed to create alarm');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAlarm = async (id: string, alarmData: any) => {
    try {
      setLoading(true);
      await AlarmService.updateAlarm(id, alarmData);
      setAlarms(prev => prev.map(alarm => 
        alarm.id === id ? { ...alarm, ...alarmData } : alarm
      ));
      setError(null);
    } catch (error) {
      console.error('Error updating alarm:', error);
      setError('Failed to update alarm');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      setLoading(true);
      await AlarmService.deleteAlarm(id);
      setAlarms(prev => prev.filter(alarm => alarm.id !== id));
      setError(null);
    } catch (error) {
      console.error('Error deleting alarm:', error);
      setError('Failed to delete alarm');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    alarms,
    loading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    refresh: loadAlarms
  };
}