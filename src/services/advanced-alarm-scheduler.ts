import type {
  RecurrencePattern,
  ConditionalRule,
  LocationTrigger,
  CalendarIntegration,
  SchedulingConfig,
  SchedulingStats,
  SunSchedule,
  BulkScheduleOperation,
  ScheduleExport,
  ScheduleImport,
  SmartOptimization,
  SeasonalAdjustment,
  OptimizationType,
  AlarmDependency
} from '../types/index';
import { AlarmService } from './alarm';
import { Preferences } from '@capacitor/preferences';

const ADVANCED_CONFIG_KEY = 'advanced_scheduling_config';
const SCHEDULING_STATS_KEY = 'scheduling_statistics';

  private static config: SchedulingConfig = {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultWakeWindow: 30,
    enableSmartAdjustments: true,
    maxDailyAdjustment: 60,
    learningMode: true,
    privacyMode: false,
    backupAlarms: true,
    advancedLogging: false
  };

  private static stats: SchedulingStats = {
    totalScheduledAlarms: 0,
    successfulWakeUps: 0,
    averageAdjustment: 0,
    mostEffectiveOptimization: 'sleep_cycle',
    patternRecognition: [],
    recommendations: []
  };

  // ===== INITIALIZATION =====

  static async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadStats();
      this.startSchedulingEngine();
      console.log('Advanced Alarm Scheduler initialized');
    } catch (error) {
      console.error('Failed to initialize Advanced Alarm Scheduler:', error);
      throw error;
    }
  }

  private static async loadConfig(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: ADVANCED_CONFIG_KEY });
      if (value) {
        this.config = { ...this.config, ...JSON.parse(value) };
      }
    } catch (error) {
      console.error('Error loading scheduling config:', error);
    }
  }

  private static async saveConfig(): Promise<void> {
    try {
      await Preferences.set({
        key: ADVANCED_CONFIG_KEY,
        value: JSON.stringify(this.config)
      });
    } catch (error) {
      console.error('Error saving scheduling config:', error);
    }
  }

  // ===== RECURRENCE PATTERN HANDLING =====

  static calculateNextOccurrences(
    fromDate: Date = new Date(),
    count: number = 10
  ): Date[] {
    const occurrences: Date[] = [];

    if (!alarm.recurrencePattern) {
      // One-time alarm
      const alarmTime = this.parseAlarmTime(alarm.time, fromDate);
      if (alarmTime > fromDate) {
        occurrences.push(alarmTime);
      }
      return occurrences;
    }

    const pattern = alarm.recurrencePattern;
    let currentDate = new Date(fromDate);

    while (occurrences.length < count) {
      const nextOccurrence = this.getNextOccurrence(alarm, currentDate);

      if (!nextOccurrence) break;

      // Check if we've reached the end conditions
      if (pattern.endDate && nextOccurrence > pattern.endDate) break;
      if (pattern.endAfterOccurrences &&
          this.getTotalOccurrences(alarm, fromDate) >= pattern.endAfterOccurrences) break;

      // Check if this date is an exception
      if (!this.isException(nextOccurrence, pattern.exceptions || [])) {
        occurrences.push(nextOccurrence);
      }

      currentDate = new Date(nextOccurrence.getTime() + 24 * 60 * 60 * 1000);
    }

    return occurrences;
  }

  private static getNextOccurrence(
    fromDate: Date,
  ): Date | null {
    const pattern = alarm.recurrencePattern!;
    const baseTime = this.parseAlarmTime(alarm.time, fromDate);

    switch (pattern.type) {
      case 'daily':
        return this.getNextDaily(baseTime, pattern, fromDate);

      case 'weekly':
        return this.getNextWeekly(baseTime, pattern, fromDate);

      case 'monthly':
        return this.getNextMonthly(baseTime, pattern, fromDate);

      case 'yearly':
        return this.getNextYearly(baseTime, pattern, fromDate);

      case 'workdays':
        return this.getNextWorkday(baseTime, fromDate);

      case 'weekends':
        return this.getNextWeekend(baseTime, fromDate);

      case 'custom':
        return this.getNextCustom(baseTime, pattern, fromDate);

      default:
        return null;
    }
  }

  private static getNextDaily(baseTime: Date, pattern: RecurrencePattern, fromDate: Date): Date {
    const nextTime = new Date(baseTime);
    const daysDiff = Math.ceil((fromDate.getTime() - baseTime.getTime()) / (24 * 60 * 60 * 1000));
    const intervalAdjusted = Math.ceil(daysDiff / pattern.interval) * pattern.interval;
    nextTime.setDate(nextTime.getDate() + intervalAdjusted);
    return nextTime;
  }

  private static getNextWeekly(baseTime: Date, pattern: RecurrencePattern, fromDate: Date): Date {
    const daysOfWeek = pattern.daysOfWeek || [baseTime.getDay()];
    const nextTime = new Date(baseTime);

    // Find next occurrence within the week pattern
    for (let i = 0; i < 14; i++) { // Look ahead 2 weeks max
      const checkDate = new Date(fromDate);
      checkDate.setDate(fromDate.getDate() + i);
      checkDate.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

      if (daysOfWeek.includes(checkDate.getDay()) && checkDate > fromDate) {
        return checkDate;
      }
    }

    return nextTime;
  }

  private static getNextMonthly(baseTime: Date, pattern: RecurrencePattern, fromDate: Date): Date {
    const nextTime = new Date(baseTime);

    if (pattern.daysOfMonth) {
      // Specific days of month
      return this.getNextMonthlyByDate(baseTime, pattern.daysOfMonth, fromDate);
    } else if (pattern.weeksOfMonth) {
      // Specific weeks of month (e.g., first Monday, third Friday)
      return this.getNextMonthlyByWeek(baseTime, pattern.weeksOfMonth, pattern.daysOfWeek || [], fromDate);
    }

    // Default: same date next month
    nextTime.setMonth(nextTime.getMonth() + pattern.interval);
    return nextTime;
  }

  private static getNextYearly(baseTime: Date, pattern: RecurrencePattern, fromDate: Date): Date {
    const nextTime = new Date(baseTime);
    const monthsOfYear = pattern.monthsOfYear || [baseTime.getMonth() + 1];

    for (const month of monthsOfYear) {
      nextTime.setFullYear(nextTime.getFullYear() + pattern.interval);
      nextTime.setMonth(month - 1);
      if (nextTime > fromDate) {
        return nextTime;
      }
    }

    return nextTime;
  }

  private static getNextWorkday(baseTime: Date, fromDate: Date): Date {
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    while (nextTime <= fromDate || this.isWeekend(nextTime)) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  private static getNextWeekend(baseTime: Date, fromDate: Date): Date {
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    while (nextTime <= fromDate || !this.isWeekend(nextTime)) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  private static getNextCustom(baseTime: Date, pattern: RecurrencePattern, fromDate: Date): Date | null {
    if (!pattern.customPattern) return null;

    const { customPattern } = pattern;

    if (customPattern.dates) {
      // Specific dates
      for (const dateStr of customPattern.dates) {
        const date = new Date(dateStr);
        date.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
        if (date > fromDate) {
          return date;
        }
      }
    }

    if (customPattern.intervals) {
      // Intervals from start date
      const startDate = new Date(baseTime);
      for (const interval of customPattern.intervals) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + interval);
        if (date > fromDate) {
          return date;
        }
      }
    }

    return null;
  }

  // ===== CONDITIONAL RULES =====
  // (See more complete implementation below)

  // ===== SMART OPTIMIZATIONS =====

  static async applySmartOptimizations(
    if (!alarm.smartOptimizations || !this.config.enableSmartAdjustments) {
      return alarm;
    }

    let optimizedAlarm = { ...alarm };

    for (const optimization of alarm.smartOptimizations.filter(o => o.isEnabled)) {
      try {
        optimizedAlarm = await this.applyOptimization(optimizedAlarm, optimization);
      } catch (error) {
        console.error('Error applying optimization:', optimization.type, error);
      }
    }

    return optimizedAlarm;
  }

  private static async applyOptimization(
    optimization: SmartOptimization,
    const { type, parameters } = optimization;
    let adjustmentMinutes = 0;

    switch (type) {
      case 'sleep_cycle':
        adjustmentMinutes = await this.calculateSleepCycleAdjustment(alarm);
        break;

      case 'sunrise_sunset':
        adjustmentMinutes = await this.calculateSunriseAdjustment(alarm);
        break;

      case 'traffic_conditions':
        adjustmentMinutes = await this.calculateTrafficAdjustment(alarm);
        break;

      case 'weather_forecast':
        adjustmentMinutes = await this.calculateWeatherAdjustment(alarm);
        break;

      case 'energy_levels':
        adjustmentMinutes = await this.calculateEnergyLevelAdjustment(alarm);
        break;

      default:
        return alarm;
    }

    // Apply constraints
    const maxAdjustment = parameters.maxAdjustment || this.config.maxDailyAdjustment;
    adjustmentMinutes = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustmentMinutes));

    // Adjust alarm time
    if (adjustmentMinutes !== 0) {
      const optimizedTime = this.adjustTimeByMinutes(alarm.time, adjustmentMinutes);
      optimization.lastApplied = new Date();

      return {
        ...alarm,
        time: optimizedTime,
        smartOptimizations: alarm.smartOptimizations?.map(o =>
          o.type === type ? optimization : o
        )
      };
    }

    return alarm;
  }

  // ===== SEASONAL ADJUSTMENTS =====

  static applySeasonalAdjustments(
    date: Date = new Date(),
    if (!alarm.seasonalAdjustments || alarm.seasonalAdjustments.length === 0) {
      return alarm;
    }

    const currentSeason = this.getCurrentSeason(date);
    const activeAdjustment = alarm.seasonalAdjustments.find(
      adj => adj.season === currentSeason && adj.isActive
    );

    if (activeAdjustment) {
      const adjustedTime = this.adjustTimeByMinutes(alarm.time, activeAdjustment.adjustmentMinutes);
      return { ...alarm, time: adjustedTime };
    }

    return alarm;
  }

  private static getCurrentSeason(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = date.getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  // ===== LOCATION-BASED ALARMS =====

  static async evaluateLocationTriggers(
    currentLocation?: GeolocationPosition,
  ): Promise<boolean> {
    if (!alarm.locationTriggers || !currentLocation) {
      return true;
    }

    for (const trigger of alarm.locationTriggers.filter(t => t.isActive)) {
      const distance = this.calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        trigger.location.latitude,
        trigger.location.longitude
      );

      const isWithinRadius = distance <= trigger.radius;

      switch (trigger.type) {
        case 'enter_location':
          if (isWithinRadius) {
            await this.executeLocationAction(alarm, trigger.action);
            return trigger.action.type !== 'disable_alarm';
          }
          break;

        case 'exit_location':
          if (!isWithinRadius) {
            await this.executeLocationAction(alarm, trigger.action);
            return trigger.action.type !== 'disable_alarm';
          }
          break;
      }
    }

    return true;
  }

  private static async executeLocationAction(
    action: any,
  ): Promise<void> {
    switch (action.type) {
      case 'enable_alarm':
        await AlarmService.updateAlarm(alarm.id, { isActive: true });
        break;

      case 'disable_alarm':
        await AlarmService.updateAlarm(alarm.id, { isActive: false });
        break;

      case 'adjust_time':
        const adjustmentMinutes = action.parameters.minutes || 0;
        const newTime = this.adjustTimeByMinutes(alarm.time, adjustmentMinutes);
        await AlarmService.updateAlarm(alarm.id, { time: newTime });
        break;

      case 'notification':
        await this.sendNotification(
          action.parameters.message || 'Location-based alarm triggered',
          action.parameters
        );
        break;
    }
  }

  // ===== SUN-BASED SCHEDULING =====

  static async calculateSunBasedTime(sunSchedule: SunSchedule, date: Date = new Date()): Promise<string> {
    try {
      const sunTimes = await this.getSunTimes(sunSchedule.location, date);
      const baseTime = sunSchedule.type === 'sunrise' ? sunTimes.sunrise : sunTimes.sunset;

      // Apply offset
      const adjustedTime = new Date(baseTime.getTime() + (sunSchedule.offset * 60 * 1000));

      // Apply seasonal adjustment if enabled
      if (sunSchedule.seasonalAdjustment) {
        const seasonalOffset = this.getSeasonalSunOffset(date);
        adjustedTime.setMinutes(adjustedTime.getMinutes() + seasonalOffset);
      }

      return this.formatTimeToHHMM(adjustedTime);
    } catch (error) {
      console.error('Error calculating sun-based time:', error);
      return '07:00'; // Fallback time
    }
  }

  private static async getSunTimes(location: any, date: Date): Promise<{ sunrise: Date; sunset: Date }> {
    // This would integrate with a sunrise/sunset API
    // For now, return estimated times based on location and date
    const sunrise = new Date(date);
    const sunset = new Date(date);

    // Simplified calculation - in real implementation, use SunCalc or similar library
    sunrise.setHours(6, 30, 0, 0);
    sunset.setHours(18, 30, 0, 0);

    return { sunrise, sunset };
  }

  // ===== NOTIFICATION INTEGRATION =====

  ): Promise<void> {
    try {
      // Calculate next few occurrences
      const nextOccurrences = this.calculateNextOccurrences(alarm, new Date(), 5);

      if (nextOccurrences.length === 0) {
        console.log(`No future occurrences found for alarm: ${alarm.label}`);
        return;
      }

      // Schedule notifications for each occurrence
      for (let i = 0; i < Math.min(nextOccurrences.length, 3); i++) {
        const occurrence = nextOccurrences[i];
        const notificationId = parseInt(alarm.id.replace(/\D/g, '')) + i;

        // Apply conditional rules for this specific occurrence
        const shouldTrigger = await this.evaluateConditionalRules(alarm, occurrence.time);
        if (!shouldTrigger) {
          console.log(`Skipping occurrence due to conditional rules: ${occurrence}`);
          continue;
        }

        // Enhanced notification body
        let notificationBody = 'Time to wake up!';
        if (alarm.smartOptimizations && alarm.smartOptimizations.some(opt => opt.isEnabled)) {
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
          schedule: occurrence
        });

        console.log(`Scheduled advanced alarm "${alarm.label}" for ${occurrence.toLocaleString()}`);
      }

    } catch (error) {
      console.error('Error scheduling advanced alarm notifications:', error);
    }
  }

    alarmId: string,
  ): Promise<void> {
    try {
      const { cancelLocalNotification } = await import('./capacitor');
      const baseId = parseInt(alarmId.replace(/\D/g, ''));

      // Cancel multiple notifications (base + occurrences)
      for (let i = 0; i < 5; i++) {
        await cancelLocalNotification(baseId + i);
      }

      console.log(`Cancelled advanced alarm notifications for ID: ${alarmId}`);
    } catch (error) {
      console.error('Error cancelling advanced alarm notifications:', error);
    }
  }

  static async evaluateConditionalRules(
    forDate?: Date,
  ): Promise<boolean> {
    if (!alarm.conditionalRules || alarm.conditionalRules.length === 0) {
      return true;
    }

    for (const rule of alarm.conditionalRules.filter(r => r.isActive)) {
      let conditionMet = false;

      try {
        switch (rule.type) {
          case 'weather':
            conditionMet = await this.evaluateWeatherCondition(rule.conditions);
            break;
          case 'calendar':
            conditionMet = await this.evaluateCalendarCondition(rule.conditions);
            break;
          case 'sleep_quality':
            conditionMet = await this.evaluateSleepQualityCondition(rule.conditions);
            break;
          case 'day_of_week':
            conditionMet = await this.evaluateDayOfWeekCondition(rule.conditions);
            break;
          case 'time_since_last':
            conditionMet = await this.evaluateTimeSinceLastCondition(rule.conditions);
            break;
          default:
            console.log(`Unknown conditional rule type: ${rule.type}`);
            conditionMet = true;
            break;
        }
      } catch (error) {
        console.error(`Error evaluating conditional rule ${rule.type}:`, error);
        conditionMet = true; // Default to allowing the alarm
      }

      if (rule.action.type === 'disable_alarm' && conditionMet) {
        return false;
      } else if (rule.action.type === 'enable_alarm' && !conditionMet) {
        return false;
      }
    }

    return true;
  }

  // ===== BULK OPERATIONS =====

  static async executeBulkOperation(operation: BulkScheduleOperation): Promise<{ success: number; failed: number; errors: string[] }> {
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
    } catch (error) {
      results.errors.push(`Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  // ===== IMPORT/EXPORT =====

  static async exportSchedule(): Promise<ScheduleExport> {

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      alarms,
      settings: this.config,
      metadata: {
        totalAlarms: alarms.length,
        timezone: this.config.timeZone,
      },
    };
  }

  static async importSchedule(importData: ScheduleImport): Promise<{ success: number; failed: number; errors: string[] }> {
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
          if (options.adjustTimeZones && data.settings.timeZone !== this.config.timeZone) {
            alarm.time = this.convertTimeZone(alarm.time, data.settings.timeZone, this.config.timeZone);
          }

          // Check for existing alarm if not overwriting
          if (!options.overwriteExisting) {
            const existingAlarms = await AlarmService.loadAlarms();
            const exists = existingAlarms.some(existing =>
              existing.label === alarm.label && existing.time === alarm.time
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

          await AlarmService.createAlarm(alarm);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to import alarm "${alarm.label}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    } catch (error) {
      results.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  // ===== UTILITY METHODS =====

  private static parseAlarmTime(timeString: string, date: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private static adjustTimeByMinutes(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return this.formatTimeToHHMM(date);
  }

  private static formatTimeToHHMM(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  private static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  private static isException(date: Date, exceptions: Date[]): boolean {
    return exceptions.some(exception =>
      exception.getFullYear() === date.getFullYear() &&
      exception.getMonth() === date.getMonth() &&
      exception.getDate() === date.getDate()
    );
  }

  private static getTotalOccurrences(
    fromDate: Date,
  ): number {
    // Count how many times this alarm has occurred since its creation
    // In a full implementation, this would query a database of alarm history

    if (!alarm.recurrencePattern || !alarm.createdAt) {
      return 0;
    }

    const createdAt = new Date(alarm.createdAt);
    const occurrences = this.calculateNextOccurrences(alarm, createdAt, 1000); // Get up to 1000 occurrences

    // Count how many occurred before fromDate
    return occurrences.filter(date => date < fromDate).length;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private static generateUniqueId(): string {
    return 'alarm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private static convertTimeZone(time: string, fromTz: string, toTz: string): string {
    // Simplified timezone conversion - in production, use a proper timezone library
    return time;
  }

  private static getSeasonalSunOffset(date: Date): number {
    // Return seasonal offset in minutes for sun-based alarms
    const month = date.getMonth() + 1;
    if (month >= 12 || month <= 2) return -15; // Winter: earlier
    if (month >= 6 && month <= 8) return 15;   // Summer: later
    return 0; // Spring/Fall: no adjustment
  }

  private static async calculateSleepCycleAdjustment(
  ): Promise<number> {
    // Basic sleep cycle optimization - adjust to align with 90-minute sleep cycles
    // In a full implementation, this would analyze user's sleep data

    const [hours, minutes] = alarm.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Standard sleep cycles are ~90 minutes, optimal wake times are at cycle ends
    const cycleLength = 90; // minutes
    const optimalWakeTimes = [360, 450, 540, 630, 720]; // 6:00, 7:30, 9:00, 10:30, 12:00

    // Find the closest optimal wake time
    let minDifference = Infinity;
    let bestAdjustment = 0;

    for (const optimalTime of optimalWakeTimes) {
      const difference = Math.abs(totalMinutes - optimalTime);
      if (difference < minDifference && difference <= 30) { // Only adjust up to 30 minutes
        minDifference = difference;
        bestAdjustment = optimalTime - totalMinutes;
      }
    }

    // Apply maximum adjustment limit
    const maxAdjustment = this.config.maxDailyAdjustment || 60;
    bestAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, bestAdjustment));

    console.log(`Sleep cycle adjustment for ${alarm.time}: ${bestAdjustment} minutes`);
    return bestAdjustment;
  }

  private static async calculateSunriseAdjustment(
  ): Promise<number> {
    // Basic sunrise adjustment - earlier in summer, later in winter
    // In a full implementation, this would use actual sunrise/sunset API

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // 1-12

    // Seasonal adjustment based on month (Northern Hemisphere)
    let adjustment = 0;
    if (month >= 6 && month <= 8) {
      // Summer: wake earlier (sunrise is earlier)
      adjustment = -15; // 15 minutes earlier
    } else if (month >= 12 || month <= 2) {
      // Winter: wake later (sunrise is later)
      adjustment = 15; // 15 minutes later
    } else if (month >= 3 && month <= 5) {
      // Spring: gradual adjustment
      adjustment = -5;
    } else {
      // Fall: gradual adjustment
      adjustment = 5;
    }

    // Apply maximum adjustment limit
    const maxAdjustment = this.config.maxDailyAdjustment || 60;
    adjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));

    console.log(`Sunrise adjustment for month ${month}: ${adjustment} minutes`);
    return adjustment;
  }

  private static async calculateTrafficAdjustment(
  ): Promise<number> {
    // Basic traffic adjustment simulation
    // In a full implementation, this would call a traffic API like Google Maps

    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isRushHour = isWeekday; // Simplified rush hour detection

    let adjustment = 0;
    if (isRushHour) {
      // Simulate heavy traffic conditions
      const trafficMultiplier = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
      adjustment = Math.round(trafficMultiplier * 20); // 0-20 minutes
      console.log(`Traffic adjustment (rush hour): ${adjustment} minutes`);
    } else {
      console.log('Traffic adjustment (off-peak): 0 minutes');
    }

    // Apply maximum adjustment limit
    const maxAdjustment = this.config.maxDailyAdjustment || 60;
    adjustment = Math.max(0, Math.min(maxAdjustment, adjustment));

    return adjustment;
  }

  private static async calculateWeatherAdjustment(
  ): Promise<number> {
    // Basic weather adjustment simulation
    // In a full implementation, this would call a weather API

    // Simulate weather conditions (replace with actual API call)
    const weatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy'];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    let adjustment = 0;
    switch (randomWeather) {
      case 'sunny':
        adjustment = -5; // Wake earlier on nice days
        break;
      case 'rainy':
      case 'snowy':
      case 'stormy':
        adjustment = 10; // Wake later on bad weather days
        break;
      case 'cloudy':
      default:
        adjustment = 0; // No adjustment for neutral weather
        break;
    }

    // Apply maximum adjustment limit
    const maxAdjustment = this.config.maxDailyAdjustment || 60;
    adjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));

    console.log(`Weather adjustment (${randomWeather}): ${adjustment} minutes`);
    return adjustment;
  }

  private static async calculateEnergyLevelAdjustment(
  ): Promise<number> {
    // Basic energy level adjustment based on historical patterns
    // In a full implementation, this would analyze user's historical wake-up success rates

    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let adjustment = 0;

    // Simulate energy patterns
    if (isWeekend) {
      // Generally more relaxed on weekends, allow later wake up
      adjustment = 15;
    } else {
      // Weekdays: simulate energy dips (Monday, Wednesday) and peaks (Tuesday, Thursday)
      switch (dayOfWeek) {
        case 1: // Monday - typically harder to wake up
          adjustment = 10;
          break;
        case 2: // Tuesday - good energy
          adjustment = -5;
          break;
        case 3: // Wednesday - mid-week slump
          adjustment = 5;
          break;
        case 4: // Thursday - near weekend energy
          adjustment = -5;
          break;
        case 5: // Friday - anticipation energy
          adjustment = -10;
          break;
        default:
          adjustment = 0;
      }
    }

    // Apply maximum adjustment limit
    const maxAdjustment = this.config.maxDailyAdjustment || 60;
    adjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));

    console.log(`Energy level adjustment (${isWeekend ? 'weekend' : 'weekday'}): ${adjustment} minutes`);
    return adjustment;
  }

  private static async evaluateWeatherCondition(condition: any): Promise<boolean> {
    // Basic weather condition evaluation
    // In a full implementation, this would call a weather API

    if (!condition || typeof condition !== 'object') {
      return true;
    }

    // Simulate current weather (replace with actual API call)
    const currentWeather = {
      temperature: Math.floor(Math.random() * 40) + 40, // 40-80°F
      condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) // 0-20 mph
    };

    // Evaluate conditions based on rule parameters
    const { type, operator, value, condition: weatherType } = condition;

    switch (type) {
      case 'temperature':
        switch (operator) {
          case 'greater_than':
            return currentWeather.temperature > value;
          case 'less_than':
            return currentWeather.temperature < value;
          case 'equals':
            return currentWeather.temperature === value;
          default:
            return true;
        }

      case 'condition':
        return currentWeather.condition === weatherType;

      case 'humidity':
        switch (operator) {
          case 'greater_than':
            return currentWeather.humidity > value;
          case 'less_than':
            return currentWeather.humidity < value;
          default:
            return true;
        }

      case 'wind_speed':
        switch (operator) {
          case 'greater_than':
            return currentWeather.windSpeed > value;
          case 'less_than':
            return currentWeather.windSpeed < value;
          default:
            return true;
        }

      default:
        console.log(`Unknown weather condition type: ${type}`);
        return true;
    }
  }

  private static async evaluateCalendarCondition(condition: any): Promise<boolean> {
    // Basic calendar condition evaluation
    // In a full implementation, this would integrate with calendar APIs

    if (!condition || typeof condition !== 'object') {
      return true;
    }

    const { type, value, operator } = condition;
    const now = new Date();

    switch (type) {
      case 'day_of_week':
        return value.includes(now.getDay());

      case 'date_range':
        const startDate = new Date(value.start);
        const endDate = new Date(value.end);
        return now >= startDate && now <= endDate;

      case 'has_events':
        // Simulate calendar events (replace with actual calendar API)
        const hasEvents = Math.random() > 0.5;
        return operator === 'equals' ? hasEvents === value : !hasEvents === value;

      case 'free_time':
        // Simulate free time availability (replace with actual calendar API)
        const hasFreeTime = Math.random() > 0.3;
        return hasFreeTime;

      default:
        console.log(`Unknown calendar condition type: ${type}`);
        return true;
    }
  }

  private static async evaluateSleepQualityCondition(condition: any): Promise<boolean> {
    // Basic sleep quality condition evaluation
    // In a full implementation, this would integrate with sleep tracking APIs

    if (!condition || typeof condition !== 'object') {
      return true;
    }

    const { type, value, operator } = condition;

    // Simulate sleep quality metrics (replace with actual sleep tracking data)
    const sleepData = {
      quality: Math.floor(Math.random() * 100), // 0-100
      duration: Math.floor(Math.random() * 4) + 6, // 6-10 hours
      efficiency: Math.floor(Math.random() * 30) + 70, // 70-100%
      deepSleep: Math.floor(Math.random() * 3) + 1, // 1-4 hours
    };

    switch (type) {
      case 'quality_score':
        switch (operator) {
          case 'greater_than':
            return sleepData.quality > value;
          case 'less_than':
            return sleepData.quality < value;
          default:
            return true;
        }

      case 'duration':
        switch (operator) {
          case 'greater_than':
            return sleepData.duration > value;
          case 'less_than':
            return sleepData.duration < value;
          default:
            return true;
        }

      case 'efficiency':
        switch (operator) {
          case 'greater_than':
            return sleepData.efficiency > value;
          case 'less_than':
            return sleepData.efficiency < value;
          default:
            return true;
        }

      default:
        console.log(`Unknown sleep quality condition type: ${type}`);
        return true;
    }
  }

  private static async evaluateDayOfWeekCondition(condition: any): Promise<boolean> {
    const today = new Date().getDay();
    return condition.value.includes(today);
  }

  private static async evaluateTimeSinceLastCondition(condition: any): Promise<boolean> {
    // Basic time since last alarm condition evaluation

    if (!condition || typeof condition !== 'object') {
      return true;
    }

    const { value, operator, unit } = condition;
    const now = new Date();

    // In a real implementation, this would fetch the last alarm time from storage
    // For now, simulate with a random time in the past 24 hours
    const lastAlarmTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);

    const timeSinceMs = now.getTime() - lastAlarmTime.getTime();
    let timeSinceInUnits: number;

    switch (unit) {
      case 'minutes':
        timeSinceInUnits = Math.floor(timeSinceMs / (60 * 1000));
        break;
      case 'hours':
        timeSinceInUnits = Math.floor(timeSinceMs / (60 * 60 * 1000));
        break;
      case 'days':
        timeSinceInUnits = Math.floor(timeSinceMs / (24 * 60 * 60 * 1000));
        break;
      default:
        console.log(`Unknown time unit: ${unit}`);
        return true;
    }

    switch (operator) {
      case 'greater_than':
        return timeSinceInUnits > value;
      case 'less_than':
        return timeSinceInUnits < value;
      case 'equals':
        return timeSinceInUnits === value;
      default:
        return true;
    }
  }

  private static async adjustAlarmTime(alarmId: string, minutes: number): Promise<void> {
    // Adjust alarm time by specified minutes
    try {
      const alarm = AlarmService.getAlarmById(alarmId);
      if (!alarm) {
        console.error(`Alarm ${alarmId} not found`);
        return;
      }

      const newTime = this.adjustTimeByMinutes(alarm.time, minutes);
      await AlarmService.updateAlarm(alarmId, {
        ...alarm,
        time: newTime
      });

      console.log(`Adjusted alarm ${alarmId} by ${minutes} minutes to ${newTime}`);
    } catch (error) {
      console.error(`Error adjusting alarm time:`, error);
    }
  }

  private static async changeAlarmSound(alarmId: string, sound: string): Promise<void> {
    // Implementation would change alarm sound
  }

  private static async changeAlarmDifficulty(alarmId: string, difficulty: string): Promise<void> {
    // Implementation would change alarm difficulty
  }

  private static async sendNotification(message: string, parameters: any): Promise<void> {
    // Send a notification to the user
    try {
      // In a real implementation, this would use the notification service
      console.log(`Notification: ${message}`, parameters);

      // For now, just log the notification
      // Could be enhanced to use actual push notifications or in-app alerts
      if (parameters?.type === 'alert') {
        alert(message);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private static async bulkCreateAlarms(operation: BulkScheduleOperation): Promise<{ success: number; failed: number; errors: string[] }> {
    // Implementation for bulk create
    return { success: 0, failed: 0, errors: [] };
  }

  private static async bulkUpdateAlarms(operation: BulkScheduleOperation): Promise<{ success: number; failed: number; errors: string[] }> {
    // Implementation for bulk update
    return { success: 0, failed: 0, errors: [] };
  }

  private static async bulkDeleteAlarms(operation: BulkScheduleOperation): Promise<{ success: number; failed: number; errors: string[] }> {
    // Implementation for bulk delete
    return { success: 0, failed: 0, errors: [] };
  }

  private static async bulkDuplicateAlarms(operation: BulkScheduleOperation): Promise<{ success: number; failed: number; errors: string[] }> {
    // Implementation for bulk duplicate
    return { success: 0, failed: 0, errors: [] };
  }

  private static startSchedulingEngine(): void {
    // Start background service to evaluate schedules
    console.log('Advanced scheduling engine started');

    // Set up periodic evaluation of advanced alarms
    setInterval(() => {
      this.evaluateAndScheduleAll();
    }, 60000); // Check every minute
  }

  private static async evaluateAndScheduleAll(): Promise<void> {
    // This would typically get alarms from a registry
    // For now, this is a placeholder for the scheduling logic
    console.log('Evaluating advanced alarm schedules...');
  }

  private static async loadStats(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SCHEDULING_STATS_KEY });
      if (value) {
        this.stats = { ...this.stats, ...JSON.parse(value) };
      }
    } catch (error) {
      console.error('Error loading scheduling stats:', error);
    }
  }

  private static getNextMonthlyByDate(baseTime: Date, daysOfMonth: number[], fromDate: Date): Date {
    // Find next occurrence based on specific days of the month
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    // Sort days in ascending order
    const sortedDays = [...daysOfMonth].sort((a, b) => a - b);

    // Check if any day in current month works
    for (const day of sortedDays) {
      const testDate = new Date(nextTime.getFullYear(), nextTime.getMonth(), day,
                                baseTime.getHours(), baseTime.getMinutes(), 0, 0);
      if (testDate > fromDate) {
        return testDate;
      }
    }

    // Move to next month and use first valid day
    nextTime.setMonth(nextTime.getMonth() + 1);
    const firstDay = Math.min(...sortedDays);
    nextTime.setDate(firstDay);

    return nextTime;
  }

  private static getNextMonthlyByWeek(baseTime: Date, weeksOfMonth: number[], daysOfWeek: number[], fromDate: Date): Date {
    // Find next occurrence based on week of month (e.g., first Monday, third Friday)
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    // Try current month first
    for (const week of weeksOfMonth) {
      for (const dayOfWeek of daysOfWeek) {
        const testDate = this.getNthWeekdayOfMonth(nextTime.getFullYear(), nextTime.getMonth(), week, dayOfWeek);
        testDate.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

        if (testDate > fromDate) {
          return testDate;
        }
      }
    }

    // Move to next month
    nextTime.setMonth(nextTime.getMonth() + 1);
    const firstWeek = Math.min(...weeksOfMonth);
    const firstDay = Math.min(...daysOfWeek);
    const resultDate = this.getNthWeekdayOfMonth(nextTime.getFullYear(), nextTime.getMonth(), firstWeek, firstDay);
    resultDate.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    return resultDate;
  }

  private static getNthWeekdayOfMonth(year: number, month: number, week: number, dayOfWeek: number): Date {
    // Get the nth occurrence of a weekday in a month (e.g., 2nd Tuesday)
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();

    // Calculate offset to first occurrence of the target weekday
    let offset = (dayOfWeek - firstWeekday + 7) % 7;

    // Add weeks to get to the nth occurrence
    offset += (week - 1) * 7;

    return new Date(year, month, 1 + offset);
  }

  // Removed duplicate getNextCustom method (see complete implementation above)

  // ===== PUBLIC API =====

  static getConfig(): SchedulingConfig {
    return { ...this.config };
  }

  static async updateConfig(updates: Partial<SchedulingConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }

  static getStats(): SchedulingStats {
    return { ...this.stats };
  }
}

