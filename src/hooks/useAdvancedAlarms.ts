import { useState, useEffect, useCallback } from 'react';
import type { AdvancedAlarm } from '../types/index';
import { AlarmService } from '../services/alarm';
import AdvancedAlarmScheduler from '../services/advanced-alarm-scheduler';

export function useAdvancedAlarms() {
  const [alarms, setAlarms] = useState<AdvancedAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlarms();
    initializeScheduler();
  }, []);

  const initializeScheduler = async () => {
    try {
      await AdvancedAlarmScheduler.initialize();
    } catch (error) {
      console.error('Failed to initialize Advanced Alarm Scheduler:', error);
      setError('Failed to initialize scheduler');
    }
  };

  const loadAlarms = async () => {
    try {
      setLoading(true);
      const loadedAlarms = await AlarmService.loadAlarms();

      // Convert basic alarms to advanced alarms with default values
      const advancedAlarms: AdvancedAlarm[] = loadedAlarms.map(alarm => ({
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
    } catch (error) {
      console.error('Error loading alarms:', error);
      setError('Failed to load alarms');
    } finally {
      setLoading(false);
    }
  };

  const createAlarm = useCallback(
    async (alarmData: Omit<AdvancedAlarm, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true);

        // Apply smart optimizations before creating
        const optimizedAlarm = await AdvancedAlarmScheduler.applySmartOptimizations(
          alarmData as AdvancedAlarm
        );

        // Apply seasonal adjustments
        const seasonallyAdjustedAlarm =
          AdvancedAlarmScheduler.applySeasonalAdjustments(optimizedAlarm);

        // Create the basic alarm first
        const basicAlarmData = {
          userId: alarmData.userId,
          time: seasonallyAdjustedAlarm.time,
          label: alarmData.label,
          days: alarmData.days,
          sound: alarmData.sound,
          difficulty: alarmData.difficulty,
          snoozeEnabled: alarmData.snoozeEnabled,
          snoozeInterval: alarmData.snoozeInterval,
          voiceMood: alarmData.voiceMood,
          isActive: alarmData.isActive,
        };

        const newAlarm = await AlarmService.createAlarm(basicAlarmData);

        // Convert to advanced alarm with additional properties
        const advancedAlarm: AdvancedAlarm = {
          ...newAlarm,
          scheduleType: alarmData.scheduleType,
          recurrencePattern: alarmData.recurrencePattern,
          conditionalRules: alarmData.conditionalRules || [],
          locationTriggers: alarmData.locationTriggers || [],
          calendarIntegration: alarmData.calendarIntegration,
          timeZone:
            alarmData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          seasonalAdjustments: alarmData.seasonalAdjustments || [],
          smartOptimizations: alarmData.smartOptimizations || [],
          dependencies: alarmData.dependencies || [],
        };

        setAlarms(prev => [...prev, advancedAlarm]);

        // Schedule the alarm with advanced features
        await scheduleAdvancedAlarm(advancedAlarm);

        setError(null);
        return advancedAlarm;
      } catch (error) {
        console.error('Error creating advanced alarm:', error);
        setError('Failed to create alarm');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateAlarm = useCallback(
    async (id: string, updates: Partial<AdvancedAlarm>) => {
      try {
        setLoading(true);

        const existingAlarm = alarms.find(alarm => alarm.id === id);
        if (!existingAlarm) {
          throw new Error('Alarm not found');
        }

        // Merge updates with existing alarm
        const updatedAlarm = { ...existingAlarm, ...updates };

        // Apply smart optimizations if enabled
        const optimizedAlarm =
          await AdvancedAlarmScheduler.applySmartOptimizations(updatedAlarm);

        // Apply seasonal adjustments
        const seasonallyAdjustedAlarm =
          AdvancedAlarmScheduler.applySeasonalAdjustments(optimizedAlarm);

        // Update the basic alarm properties
        await AlarmService.updateAlarm(id, {
          time: seasonallyAdjustedAlarm.time,
          label: seasonallyAdjustedAlarm.label,
          days: seasonallyAdjustedAlarm.days,
          sound: seasonallyAdjustedAlarm.sound,
          difficulty: seasonallyAdjustedAlarm.difficulty,
          snoozeEnabled: seasonallyAdjustedAlarm.snoozeEnabled,
          snoozeInterval: seasonallyAdjustedAlarm.snoozeInterval,
          voiceMood: seasonallyAdjustedAlarm.voiceMood,
          isActive: seasonallyAdjustedAlarm.isActive,
        });

        setAlarms(prev =>
          prev.map(alarm => (alarm.id === id ? seasonallyAdjustedAlarm : alarm))
        );

        // Cancel existing advanced notifications and re-schedule
        await AdvancedAlarmScheduler.cancelAdvancedAlarmNotifications(id);
        await scheduleAdvancedAlarm(seasonallyAdjustedAlarm);

        setError(null);
        return seasonallyAdjustedAlarm;
      } catch (error) {
        console.error('Error updating advanced alarm:', error);
        setError('Failed to update alarm');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [alarms]
  );

  const deleteAlarm = useCallback(async (id: string) => {
    try {
      setLoading(true);

      // Cancel advanced notifications before deleting
      await AdvancedAlarmScheduler.cancelAdvancedAlarmNotifications(id);

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
  }, []);

  const scheduleAdvancedAlarm = async (alarm: AdvancedAlarm) => {
    try {
      // Calculate next occurrences based on recurrence pattern
      const nextOccurrences = AdvancedAlarmScheduler.calculateNextOccurrences(
        alarm,
        new Date(),
        10
      );

      // Evaluate conditional rules
      const shouldTrigger =
        await AdvancedAlarmScheduler.evaluateConditionalRules(alarm);

      if (!shouldTrigger) {
        console.log('Alarm skipped due to conditional rules:', alarm.label);
        return;
      }

      // Check location triggers if available
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const locationCheck = await AdvancedAlarmScheduler.evaluateLocationTriggers(
            alarm,
            position
          );
          if (!locationCheck) {
            console.log('Alarm disabled due to location triggers:', alarm.label);
            return;
          }
        } catch (error) {
          console.log('Geolocation not available, continuing with alarm scheduling');
        }
      }

      // Actually schedule the notifications for the advanced alarm
      await AdvancedAlarmScheduler.scheduleAdvancedAlarmNotifications(alarm);

      console.log(`Advanced alarm scheduled: ${alarm.label}`, {
        nextOccurrences: nextOccurrences.length,
        smartOptimizations:
          alarm.smartOptimizations?.filter(o => o.isEnabled).length || 0,
        conditionalRules: alarm.conditionalRules?.filter(r => r.isActive).length || 0,
      });
    } catch (error) {
      console.error('Error scheduling advanced alarm:', error);
    }
  };

  const getNextOccurrence = useCallback((alarm: AdvancedAlarm): Date | null => {
    try {
      const occurrences = AdvancedAlarmScheduler.calculateNextOccurrences(
        alarm,
        new Date(),
        1
      );
      return occurrences[0] || null;
    } catch (error) {
      console.error('Error calculating next occurrence:', error);
      return null;
    }
  }, []);

  const exportAlarms = useCallback(async () => {
    try {
      const exportData = await AdvancedAlarmScheduler.exportSchedule();

      // Create download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relife-alarms-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      console.error('Error exporting alarms:', error);
      setError('Failed to export alarms');
      throw error;
    }
  }, []);

  const importAlarms = useCallback(async (file: File) => {
    try {
      setLoading(true);

      const text = await file.text();
      const importData = JSON.parse(text);

      const results = await AdvancedAlarmScheduler.importSchedule({
        source: 'backup',
        data: importData,
        options: {
          overwriteExisting: false,
          preserveIds: false,
          adjustTimeZones: true,
          skipInvalid: true,
        },
      });

      if (results.success > 0) {
        await loadAlarms(); // Reload to show imported alarms
      }

      setError(null);
      return results;
    } catch (error) {
      console.error('Error importing alarms:', error);
      setError('Failed to import alarms');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateAlarm = useCallback(
    async (id: string, modifications?: Partial<AdvancedAlarm>) => {
      try {
        const existingAlarm = alarms.find(alarm => alarm.id === id);
        if (!existingAlarm) {
          throw new Error('Alarm not found');
        }

        const duplicatedAlarmData = {
          ...existingAlarm,
          ...modifications,
          label: modifications?.label || `${existingAlarm.label} (Copy)`,
          userId: existingAlarm.userId,
        };

        // Remove id and timestamps to create new alarm
        delete (duplicatedAlarmData as any).id;
        delete (duplicatedAlarmData as any).createdAt;
        delete (duplicatedAlarmData as any).updatedAt;

        const newAlarm = await createAlarm(duplicatedAlarmData);
        return newAlarm;
      } catch (error) {
        console.error('Error duplicating alarm:', error);
        setError('Failed to duplicate alarm');
        throw error;
      }
    },
    [alarms, createAlarm]
  );

  const bulkUpdate = useCallback(
    async (alarmIds: string[], updates: Partial<AdvancedAlarm>) => {
      try {
        setLoading(true);

        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const id of alarmIds) {
          try {
            await updateAlarm(id, updates);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(
              `Failed to update alarm ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        setError(null);
        return results;
      } catch (error) {
        console.error('Error in bulk update:', error);
        setError('Bulk update failed');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [updateAlarm]
  );

  const getSchedulingStats = useCallback(() => {
    try {
      return AdvancedAlarmScheduler.getStats();
    } catch (error) {
      console.error('Error getting scheduling stats:', error);
      return null;
    }
  }, []);

  return {
    // State
    alarms,
    loading,
    error,

    // Actions
    createAlarm,
    updateAlarm,
    deleteAlarm,
    duplicateAlarm,
    bulkUpdate,

    // Utilities
    getNextOccurrence,
    exportAlarms,
    importAlarms,
    getSchedulingStats,

    // Refresh
    refresh: loadAlarms,
  };
}
