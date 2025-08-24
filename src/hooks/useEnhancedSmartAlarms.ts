import { useState, useEffect, useCallback } from 'react';
import {
  EnhancedSmartAlarmScheduler,
  type EnhancedSmartAlarm,
} from '../services/enhanced-smart-alarm-scheduler';
import { RealTimeSmartAdapter } from '../services/real-time-smart-adapter';

export interface UseEnhancedSmartAlarmsResult {
  alarms: EnhancedSmartAlarm[];
  loading: boolean;
  error: string | null;
  createAlarm: (alarmData: Partial<EnhancedSmartAlarm>) => Promise<boolean>;
  updateAlarm: (id: string, updates: Partial<EnhancedSmartAlarm>) => Promise<boolean>;
  deleteAlarm: (id: string) => Promise<boolean>;
  recordFeedback: (alarmId: string, feedback: any) => Promise<boolean>;
  refreshAlarms: () => Promise<void>;
}

export const useEnhancedSmartAlarms = (): UseEnhancedSmartAlarmsResult => {
  const [alarms, setAlarms] = useState<EnhancedSmartAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize services and load alarms
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize the real-time adapter
        await RealTimeSmartAdapter.initialize();

        // Load existing alarms
        await loadAlarms();
      } catch (err) {
        console.error('Error initializing smart alarm services:', err);
        setError('Failed to initialize smart alarm system');
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      RealTimeSmartAdapter.shutdown();
    };
  }, []);

  const loadAlarms = async () => {
    try {
      setLoading(true);
      setError(null);

      const smartAlarms =
        (await EnhancedSmartAlarmScheduler.getAllSmartAlarms()) as EnhancedSmartAlarm[];
      setAlarms(smartAlarms);

      // Start monitoring for enabled alarms
      for (const alarm of smartAlarms) {
        if (alarm.enabled && alarm.realTimeAdaptation) {
          await RealTimeSmartAdapter.startMonitoringAlarm(alarm);
        }
      }
    } catch (err) {
      console.error('Error loading smart alarms:', err);
      setError('Failed to load smart alarms');
    } finally {
      setLoading(false);
    }
  };

  const createAlarm = useCallback(
    async (alarmData: Partial<EnhancedSmartAlarm>): Promise<boolean> => {
      try {
        setError(null);

        const newAlarm =
          await EnhancedSmartAlarmScheduler.createEnhancedSmartAlarm(alarmData);

        if (newAlarm) {
          setAlarms((prev: any) => // auto: implicit any [...prev, newAlarm]);

          // Start monitoring if enabled
          if (newAlarm.enabled && newAlarm.realTimeAdaptation) {
            await RealTimeSmartAdapter.startMonitoringAlarm(newAlarm);
          }

          return true;
        }

        setError('Failed to create smart alarm');
        return false;
      } catch (err) {
        console.error('Error creating smart alarm:', err);
        setError('Failed to create smart alarm');
        return false;
      }
    },
    []
  );

  const updateAlarm = useCallback(
    async (id: string, updates: Partial<EnhancedSmartAlarm>): Promise<boolean> => {
      try {
        setError(null);

        const updatedAlarm = (await EnhancedSmartAlarmScheduler.updateSmartAlarm(
          id,
          updates
        )) as EnhancedSmartAlarm;

        if (updatedAlarm) {
          setAlarms((prev: any) => // auto: implicit any
            prev.map((alarm: any) => // auto: implicit any (alarm.id === id ? updatedAlarm : alarm))
          );

          // Update monitoring status
          if (updatedAlarm.enabled && updatedAlarm.realTimeAdaptation) {
            await RealTimeSmartAdapter.startMonitoringAlarm(updatedAlarm);
          } else {
            RealTimeSmartAdapter.stopMonitoringAlarm(id);
          }

          return true;
        }

        setError('Failed to update smart alarm');
        return false;
      } catch (err) {
        console.error('Error updating smart alarm:', err);
        setError('Failed to update smart alarm');
        return false;
      }
    },
    []
  );

  const deleteAlarm = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      // Stop monitoring
      RealTimeSmartAdapter.stopMonitoringAlarm(id);

      // Remove from state (actual deletion would happen in the service)
      setAlarms((prev: any) => // auto: implicit any prev.filter((alarm: any) => // auto: implicit any alarm.id !== id));

      return true;
    } catch (err) {
      console.error('Error deleting smart alarm:', err);
      setError('Failed to delete smart alarm');
      return false;
    }
  }, []);

  const recordFeedback = useCallback(
    async (alarmId: string, feedback: any): Promise<boolean> => {
      try {
        setError(null);

        await EnhancedSmartAlarmScheduler.recordWakeUpFeedback(alarmId, feedback);

        // Refresh the specific alarm to get updated data
        const updatedAlarm = (await EnhancedSmartAlarmScheduler.getSmartAlarm(
          alarmId
        )) as EnhancedSmartAlarm;
        if (updatedAlarm) {
          setAlarms((prev: any) => // auto: implicit any
            prev.map((alarm: any) => // auto: implicit any (alarm.id === alarmId ? updatedAlarm : alarm))
          );
        }

        return true;
      } catch (err) {
        console.error('Error recording feedback:', err);
        setError('Failed to record feedback');
        return false;
      }
    },
    []
  );

  const refreshAlarms = useCallback(async (): Promise<void> => {
    await loadAlarms();
  }, []);

  return {
    alarms,
    loading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    recordFeedback,
    refreshAlarms,
  };
};

export default useEnhancedSmartAlarms;
