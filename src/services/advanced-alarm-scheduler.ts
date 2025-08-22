import type {
  Alarm,
  SchedulingConfig,
  SchedulingStats,
  BulkScheduleOperation,
  ScheduleExport,
  ScheduleImport,
  SunSchedule,
} from '../types/index';
import { SchedulerCore } from './scheduler-core';
import { AlarmParser } from './alarm-parser';
import { AlarmExecutor } from './alarm-executor';

/**
 * AdvancedAlarmScheduler - Facade class that delegates to the new modular architecture
 *
 * This maintains backward compatibility while using the new AlarmParser, AlarmExecutor,
 * and SchedulerCore modules for better maintainability and separation of concerns.
 */
export class AdvancedAlarmScheduler {
  // ===== INITIALIZATION =====

  static async initialize(): Promise<void> {
    return SchedulerCore.initialize();
  }

  static async cleanup(): Promise<void> {
    return SchedulerCore.cleanup();
  }

  // ===== SCHEDULING METHODS =====

  static async scheduleAdvancedAlarm(alarm: Alarm): Promise<void> {
    return SchedulerCore.scheduleAdvancedAlarm(alarm);
  }

  static async cancelAdvancedAlarm(alarmId: string): Promise<void> {
    return SchedulerCore.cancelAdvancedAlarm(alarmId);
  }

  static async scheduleAdvancedNotifications(alarm: Alarm): Promise<void> {
    return SchedulerCore.scheduleAdvancedNotifications(alarm);
  }

  static async cancelAdvancedNotifications(alarmId: string): Promise<void> {
    return SchedulerCore.cancelAdvancedNotifications(alarmId);
  }

  // ===== PARSING AND CALCULATIONS =====

  static calculateNextOccurrences(
    alarm: Alarm,
    fromDate: Date = new Date(),
    count: number = 10
  ): Date[] {
    return AlarmParser.calculateNextOccurrences(alarm, fromDate, count);
  }

  static adjustTimeByMinutes(timeString: string, minutes: number): string {
    return AlarmParser.adjustTimeByMinutes(timeString, minutes);
  }

  static formatTimeToHHMM(date: Date): string {
    return AlarmParser.formatTimeToHHMM(date);
  }

  // ===== SMART OPTIMIZATIONS =====

  static async applySmartOptimizations(alarm: Alarm): Promise<Alarm> {
    const config = SchedulerCore.getConfig();
    return AlarmExecutor.applySmartOptimizations(alarm, config);
  }

  static applySeasonalAdjustments(alarm: Alarm, date: Date = new Date()): Alarm {
    return AlarmExecutor.applySeasonalAdjustments(alarm, date);
  }

  // ===== LOCATION-BASED ALARMS =====

  static async evaluateLocationTriggers(
    alarm: Alarm,
    currentLocation?: GeolocationPosition
  ): Promise<boolean> {
    return AlarmExecutor.evaluateLocationTriggers(alarm, currentLocation);
  }

  // ===== SUN-BASED SCHEDULING =====

  static async calculateSunBasedTime(
    sunSchedule: SunSchedule,
    date: Date = new Date()
  ): Promise<string> {
    return AlarmExecutor.calculateSunBasedTime(sunSchedule, date);
  }

  // ===== CONDITIONAL RULES =====

  static async evaluateConditionalRules(
    alarm: Alarm,
    forDate?: Date
  ): Promise<boolean> {
    return AlarmExecutor.evaluateConditionalRules(alarm, forDate);
  }

  // ===== BULK OPERATIONS =====

  static async executeBulkOperation(
    operation: BulkScheduleOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return SchedulerCore.executeBulkOperation(operation);
  }

  // ===== IMPORT/EXPORT =====

  static async exportSchedule(): Promise<ScheduleExport> {
    return SchedulerCore.exportSchedule();
  }

  static async importSchedule(
    importData: ScheduleImport
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return SchedulerCore.importSchedule(importData);
  }

  // ===== CONFIGURATION =====

  static getConfig(): SchedulingConfig {
    return SchedulerCore.getConfig();
  }

  static async updateConfig(updates: Partial<SchedulingConfig>): Promise<void> {
    return SchedulerCore.updateConfig(updates);
  }

  static getStats(): SchedulingStats {
    return SchedulerCore.getStats();
  }

  static async updateStats(updates: Partial<SchedulingStats>): Promise<void> {
    return SchedulerCore.updateStats(updates);
  }
}
