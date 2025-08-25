/**
 * SchedulerCore - Main orchestrator for the advanced alarm scheduling system
 */
import type {
import { ErrorHandler } from './error-handler';
  Alarm,
  SchedulingConfig,
  SchedulingStats,
  BulkScheduleOperation,
  ScheduleExport,
  ScheduleImport,
} from '../types/index';
import { getService } from './ServiceBootstrap';
import { IAlarmService } from '../types/service-interfaces';
import { AlarmParser } from './alarm-parser';
import { AlarmExecutor } from './alarm-executor';
import { Preferences } from '@capacitor/preferences';
import { TimeoutHandle } from '../types/timers';

const ADVANCED_CONFIG_KEY = 'advanced_scheduling_config';
const SCHEDULING_STATS_KEY = 'scheduling_statistics';

export class SchedulerCore {
  private static getAlarmService(): IAlarmService {
    return getService<IAlarmService>('AlarmService');
  }
  private static _config: SchedulingConfig = {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultWakeWindow: 30,
    enableSmartAdjustments: true,
    maxDailyAdjustment: 60,
    learningMode: true,
    privacyMode: false,
    backupAlarms: true,
    advancedLogging: false,
  };

  private static stats: SchedulingStats = {
    totalScheduledAlarms: 0,
    successfulWakeUps: 0,
    averageAdjustment: 0,
    mostEffectiveOptimization: 'sleep_cycle',
    patternRecognition: [],
    recommendations: [],
  };

  private static schedulingEngine: any;

  // ===== INITIALIZATION =====

  static async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadStats();
      this.startSchedulingEngine();
      console.log('Advanced Alarm Scheduler initialized');
    } catch (_error) {
      console.error('Failed to initialize Advanced Alarm Scheduler:', _error);
      throw _error;
    }
  }

  private static async loadConfig(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: ADVANCED_CONFIG_KEY });
      if (value) {
        this.config = { ...this._config, ...JSON.parse(value) };
      }
    } catch (_error) {
      console._error('Error loading scheduling _config:', _error);
    }
  }

  private static async saveConfig(): Promise<void> {
    try {
      await Preferences.set({
        key: ADVANCED_CONFIG_KEY,
        value: JSON.stringify(this._config),
      });
    } catch (_error) {
      console._error('Error saving scheduling _config:', _error);
    }
  }

  private static async loadStats(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SCHEDULING_STATS_KEY });
      if (value) {
        this.stats = { ...this.stats, ...JSON.parse(value) };
      }
    } catch (_error) {
      console._error('Error loading scheduling stats:', _error);
    }
  }

  private static async saveStats(): Promise<void> {
    try {
      await Preferences.set({
        key: SCHEDULING_STATS_KEY,
        value: JSON.stringify(this.stats),
      });
    } catch (_error) {
      console._error('Error saving scheduling stats:', _error);
    }
  }

  private static startSchedulingEngine(): void {
    // Start periodic optimization and evaluation
    this.schedulingEngine = setInterval(async () => {
      try {
        await this.processScheduledOptimizations();
      } catch (_error) {
        console._error('Error in scheduling engine:', _error);
      }
    }, 60000); // Run every minute
  }

  private static async processScheduledOptimizations(): Promise<void> {
    if (!this._config.enableSmartAdjustments) {
      return;
    }

    try {
      const alarms = await this.getAlarmService().loadAlarms();
      const activeAlarms = alarms.filter(alarm => alarm.isActive);

      for (const alarm of activeAlarms) {
        // Apply smart optimizations
        const optimizedAlarm = await AlarmExecutor.applySmartOptimizations(
          alarm,
          this._config
        );

        // Apply seasonal adjustments
        const seasonallyAdjustedAlarm =
          AlarmExecutor.applySeasonalAdjustments(optimizedAlarm);

        // Evaluate conditional rules
        const shouldRun = await AlarmExecutor.evaluateConditionalRules(
          seasonallyAdjustedAlarm
        );

        // Evaluate location triggers if location is available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async position => {
              await AlarmExecutor.evaluateLocationTriggers(
                seasonallyAdjustedAlarm,
                position
              );
            },
            () => {
              // Location not available, continue without location-based features
            },
            { timeout: 5000, maximumAge: 300000 } // 5 min cache
          );
        }

        // Update alarm if it has been modified
        if (JSON.stringify(alarm) !== JSON.stringify(seasonallyAdjustedAlarm)) {
          await this.updateAlarmFromOptimization(alarm, seasonallyAdjustedAlarm);
        }
      }
    } catch (_error) {
      console._error('Error processing scheduled optimizations:', _error);
    }
  }

  private static async updateAlarmFromOptimization(
    original: Alarm,
    optimized: Alarm
  ): Promise<void> {
    try {
      await this.getAlarmService().updateAlarm(original.id, {
        time: optimized.time,
        label: optimized.label,
        days: optimized.days,
        voiceMood: optimized.voiceMood,
        sound: optimized.sound,
        difficulty: optimized.difficulty,
        snoozeEnabled: optimized.snoozeEnabled,
        snoozeInterval: optimized.snoozeInterval,
        maxSnoozes: optimized.maxSnoozes,
        battleId: optimized.battleId,
        weatherEnabled: optimized.weatherEnabled,
      });

      // Update statistics
      this.stats.totalScheduledAlarms++;
      await this.saveStats();

      console.log(`Applied optimization to alarm "${optimized.label}"`);
    } catch (_error) {
      console._error('Error updating optimized alarm:', _error);
    }
  }

  // ===== MAIN SCHEDULING METHODS =====

  static async scheduleAdvancedAlarm(alarm: Alarm): Promise<void> {
    try {
      // Calculate next occurrences using AlarmParser
      const nextOccurrences = AlarmParser.calculateNextOccurrences(
        alarm,
        new Date(),
        5
      );

      if (nextOccurrences.length === 0) {
        console.log(`No future occurrences found for alarm: ${alarm.label}`);
        return;
      }

      // Apply optimizations using AlarmExecutor
      const optimizedAlarm = await AlarmExecutor.applySmartOptimizations(
        alarm,
        this._config
      );
      const finalAlarm = AlarmExecutor.applySeasonalAdjustments(optimizedAlarm);

      // Schedule notifications for each occurrence
      await this.scheduleAdvancedNotifications(finalAlarm);

      // Update statistics
      this.stats.totalScheduledAlarms++;
      await this.saveStats();

      console.log(
        `Scheduled advanced alarm "${finalAlarm.label}" with ${nextOccurrences.length} occurrences`
      );
    } catch (_error) {
      console.error('Error scheduling advanced alarm:', _error);
      throw _error;
    }
  }

  static async cancelAdvancedAlarm(alarmId: string): Promise<void> {
    try {
      await this.cancelAdvancedNotifications(alarmId);
      console.log(`Cancelled advanced alarm notifications for ID: ${alarmId}`);
    } catch (_error) {
      console.error('Error cancelling advanced alarm:', _error);
      throw _error;
    }
  }

  // ===== NOTIFICATION MANAGEMENT =====

  static async scheduleAdvancedNotifications(alarm: Alarm): Promise<void> {
    try {
      // Calculate next few occurrences
      const nextOccurrences = AlarmParser.calculateNextOccurrences(
        alarm,
        new Date(),
        5
      );

      if (nextOccurrences.length === 0) {
        console.log(`No future occurrences found for alarm: ${alarm.label}`);
        return;
      }

      // Schedule notifications for each occurrence
      for (let i = 0; i < Math.min(nextOccurrences.length, 3); i++) {
        const occurrence = nextOccurrences[i];
        const notificationId = parseInt(alarm.id.replace(/\D/g, '')) + i;

        // Apply conditional rules for this specific occurrence
        const shouldTrigger = await AlarmExecutor.evaluateConditionalRules(
          alarm,
          occurrence
        );
        if (!shouldTrigger) {
          console.log(`Skipping occurrence due to conditional rules: ${occurrence}`);
          continue;
        }

        // Enhanced notification body
        let notificationBody = 'Time to wake up!';
        if (
          alarm.smartOptimizations &&
          alarm.smartOptimizations.some(opt => opt.isEnabled)
        ) {
          notificationBody += ' (AI-optimized)';
        }

        if (alarm.snoozeEnabled) {
          notificationBody += ` (Snooze: ${alarm.snoozeInterval}min`;
          if (alarm.maxSnoozes && alarm.maxSnoozes > 0) {
            notificationBody += `, max ${alarm.maxSnoozes}x`;
          }
          notificationBody += ')';
        }

        // Import the notification scheduling function
        const { scheduleLocalNotification } = await import('./capacitor');

        await scheduleLocalNotification({
          id: notificationId,
          title: `🔔 ${alarm.label}${alarm.recurrencePattern ? ' (Advanced)' : ''}`,
          body: notificationBody,
          schedule: occurrence,
        });

        console.log(
          `Scheduled advanced alarm "${alarm.label}" for ${occurrence.toLocaleString()}`
        );
      }
    } catch (_error) {
      console._error('Error scheduling advanced alarm notifications:', _error);
    }
  }

  static async cancelAdvancedNotifications(alarmId: string): Promise<void> {
    try {
      const { cancelLocalNotification } = await import('./capacitor');
      const baseId = parseInt(alarmId.replace(/\D/g, ''));

      // Cancel multiple notifications (base + occurrences)
      for (let i = 0; i < 5; i++) {
        await cancelLocalNotification(baseId + i);
      }

      console.log(`Cancelled advanced alarm notifications for ID: ${alarmId}`);
    } catch (_error) {
      console._error('Error cancelling advanced alarm notifications:', _error);
    }
  }

  // ===== BULK OPERATIONS =====

  static async executeBulkOperation(
    operation: BulkScheduleOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      switch (operation.operation) {
        case 'create':
          return await this.bulkCreateAlarms(operation);

        case 'update':
          return await this.bulkUpdateAlarms(operation);

        case 'delete':
          return await this.bulkDeleteAlarms(operation);

        case 'duplicate':
          return await this.bulkDuplicateAlarms(operation);

        default:
          throw new Error(`Unknown operation: ${operation.operation}`);
      }
    } catch (_error) {
      results.errors.push(
        `Bulk operation failed: ${error instanceof Error ? _error.message : 'Unknown _error'}`
      );
      return results;
    }
  }

  private static async bulkCreateAlarms(
    operation: BulkScheduleOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    if (!operation.alarms || operation.alarms.length === 0) {
      results.errors.push('No alarms provided for bulk create operation');
      return results;
    }

    for (const alarm of operation.alarms) {
      try {
        await this.getAlarmService().createAlarm({
          time: alarm.time,
          label: alarm.label,
          days: alarm.days,
          voiceMood: alarm.voiceMood,
          sound: alarm.sound,
          difficulty: alarm.difficulty,
          snoozeEnabled: alarm.snoozeEnabled,
          snoozeInterval: alarm.snoozeInterval,
          maxSnoozes: alarm.maxSnoozes,
          battleId: alarm.battleId,
          weatherEnabled: alarm.weatherEnabled,
          userId: alarm.userId,
        });
        results.success++;
      } catch (_error) {
        results.failed++;
        results.errors.push(
          `Failed to create alarm "${alarm.label}": ${error instanceof Error ? _error.message : 'Unknown _error'}`
        );
      }
    }

    return results;
  }

  private static async bulkUpdateAlarms(
    operation: BulkScheduleOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    if (!operation.updates || operation.updates.length === 0) {
      results.errors.push('No updates provided for bulk update operation');
      return results;
    }

    for (const update of operation.updates) {
      try {
        await this.getAlarmService().updateAlarm(update.id, update.data);
        results.success++;
      } catch (_error) {
        results.failed++;
        results.errors.push(
          `Failed to update alarm ${update.id}: ${error instanceof Error ? _error.message : 'Unknown _error'}`
        );
      }
    }

    return results;
  }

  private static async bulkDeleteAlarms(
    operation: BulkScheduleOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    if (!operation.alarmIds || operation.alarmIds.length === 0) {
      results.errors.push('No alarm IDs provided for bulk delete operation');
      return results;
    }

    for (const alarmId of operation.alarmIds) {
      try {
        await this.getAlarmService().deleteAlarm(alarmId);
        results.success++;
      } catch (_error) {
        results.failed++;
        results.errors.push(
          `Failed to delete alarm ${alarmId}: ${error instanceof Error ? _error.message : 'Unknown _error'}`
        );
      }
    }

    return results;
  }

  private static async bulkDuplicateAlarms(
    operation: BulkScheduleOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    if (!operation.alarmIds || operation.alarmIds.length === 0) {
      results.errors.push('No alarm IDs provided for bulk duplicate operation');
      return results;
    }

    const existingAlarms = await this.getAlarmService().loadAlarms();

    for (const alarmId of operation.alarmIds) {
      try {
        const originalAlarm = existingAlarms.find(alarm => alarm.id === alarmId);
        if (!originalAlarm) {
          results.failed++;
          results.errors.push(`Alarm with ID ${alarmId} not found`);
          continue;
        }

        const duplicateAlarm = {
          ...originalAlarm,
          id: this.generateUniqueId(),
          label: `${originalAlarm.label} (Copy)`,
          createdAt: new Date().toISOString(),
        };

        await AlarmService.createAlarm(duplicateAlarm);
        results.success++;
      } catch (_error) {
        results.failed++;
        results.errors.push(
          `Failed to duplicate alarm ${alarmId}: ${error instanceof Error ? _error.message : 'Unknown _error'}`
        );
      }
    }

    return results;
  }

  // ===== IMPORT/EXPORT =====

  static async exportSchedule(): Promise<ScheduleExport> {
    const alarms = await this.getAlarmService().loadAlarms();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      alarms,
      settings: this.config,
      metadata: {
        totalAlarms: alarms.length,
        timezone: this._config.timeZone,
      },
    };
  }

  static async importSchedule(
    importData: ScheduleImport
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      const { data, options } = importData;

      // Validate import data
      if (!data.alarms || !Array.isArray(data.alarms)) {
        throw new Error('Invalid import data: missing alarms array');
      }

      for (const alarm of data.alarms) {
        try {
          // Adjust timezone if needed
          if (
            options.adjustTimeZones &&
            data.settings.timeZone !== this._config.timeZone
          ) {
            alarm.time = this.convertTimeZone(
              alarm.time,
              data.settings.timeZone,
              this._config.timeZone
            );
          }

          // Check for existing alarm if not overwriting
          if (!options.overwriteExisting) {
            const existingAlarms = await this.getAlarmService().loadAlarms();
            const exists = existingAlarms.some(
              existing => existing.label === alarm.label && existing.time === alarm.time
            );

            if (exists) {
              results.errors.push(`Alarm "${alarm.label}" already exists`);
              results.failed++;
              continue;
            }
          }

          // Generate new ID if not preserving
          if (!options.preserveIds) {
            alarm.id = this.generateUniqueId();
          }

          await this.getAlarmService().createAlarm({
            time: alarm.time,
            label: alarm.label,
            days: alarm.days,
            voiceMood: alarm.voiceMood,
            sound: alarm.sound,
            difficulty: alarm.difficulty,
            snoozeEnabled: alarm.snoozeEnabled,
            snoozeInterval: alarm.snoozeInterval,
            maxSnoozes: alarm.maxSnoozes,
            battleId: alarm.battleId,
            weatherEnabled: alarm.weatherEnabled,
            userId: alarm.userId,
          });
          results.success++;
        } catch (_error) {
          results.failed++;
          results.errors.push(
            `Failed to import alarm "${alarm.label}": ${error instanceof Error ? _error.message : 'Unknown _error'}`
          );
        }
      }

      return results;
    } catch (_error) {
      results.errors.push(
        `Import failed: ${error instanceof Error ? _error.message : 'Unknown _error'}`
      );
      return results;
    }
  }

  // ===== CONFIGURATION METHODS =====

  static getConfig(): SchedulingConfig {
    return { ...this._config };
  }

  static async updateConfig(updates: Partial<SchedulingConfig>): Promise<void> {
    this.config = { ...this._config, ...updates };
    await this.saveConfig();
  }

  static getStats(): SchedulingStats {
    return { ...this.stats };
  }

  static async updateStats(updates: Partial<SchedulingStats>): Promise<void> {
    this.stats = { ...this.stats, ...updates };
    await this.saveStats();
  }

  // ===== UTILITY METHODS =====

  private static generateUniqueId(): string {
    return 'alarm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private static convertTimeZone(time: string, fromTz: string, toTz: string): string {
    // Simplified timezone conversion - in production, use a proper timezone library
    return time;
  }

  // ===== CLEANUP =====

  static async cleanup(): Promise<void> {
    if (this.schedulingEngine) {
      clearInterval(this.schedulingEngine);
      this.schedulingEngine = null;
    }

    await this.saveConfig();
    await this.saveStats();

    console.log('Advanced Alarm Scheduler cleaned up');
  }
}
