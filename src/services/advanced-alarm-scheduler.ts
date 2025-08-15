import type { 
  AdvancedAlarm, 
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

export class AdvancedAlarmScheduler {
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
    alarm: AdvancedAlarm, 
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

  private static getNextOccurrence(alarm: AdvancedAlarm, fromDate: Date): Date | null {
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

  static async evaluateConditionalRules(alarm: AdvancedAlarm): Promise<boolean> {
    if (!alarm.conditionalRules || alarm.conditionalRules.length === 0) {
      return true; // No rules = always trigger
    }

    for (const rule of alarm.conditionalRules.filter(r => r.isActive)) {
      const result = await this.evaluateCondition(rule.condition);
      
      if (result) {
        await this.executeAction(alarm, rule.action);
        return rule.action.type !== 'skip_alarm';
      }
    }

    return true;
  }

  private static async evaluateCondition(condition: any): Promise<boolean> {
    switch (condition.type) {
      case 'weather':
        return this.evaluateWeatherCondition(condition);
      
      case 'calendar_event':
        return this.evaluateCalendarCondition(condition);
      
      case 'sleep_quality':
        return this.evaluateSleepQualityCondition(condition);
      
      case 'day_of_week':
        return this.evaluateDayOfWeekCondition(condition);
      
      case 'time_since_last':
        return this.evaluateTimeSinceLastCondition(condition);
      
      default:
        return true;
    }
  }

  private static async executeAction(alarm: AdvancedAlarm, action: any): Promise<void> {
    switch (action.type) {
      case 'adjust_time':
        await this.adjustAlarmTime(alarm.id, action.value);
        break;
      
      case 'change_sound':
        await this.changeAlarmSound(alarm.id, action.value);
        break;
      
      case 'change_difficulty':
        await this.changeAlarmDifficulty(alarm.id, action.value);
        break;
      
      case 'send_notification':
        await this.sendNotification(action.value, action.parameters);
        break;
      
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  // ===== SMART OPTIMIZATIONS =====

  static async applySmartOptimizations(alarm: AdvancedAlarm): Promise<AdvancedAlarm> {
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
    alarm: AdvancedAlarm, 
    optimization: SmartOptimization
  ): Promise<AdvancedAlarm> {
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

  static applySeasonalAdjustments(alarm: AdvancedAlarm, date: Date = new Date()): AdvancedAlarm {
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

  static async evaluateLocationTriggers(alarm: AdvancedAlarm, currentLocation?: GeolocationPosition): Promise<boolean> {
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

  private static async executeLocationAction(alarm: AdvancedAlarm, action: any): Promise<void> {
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
    const alarms = await AlarmService.loadAlarms() as AdvancedAlarm[];
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      alarms,
      settings: this.config,
      metadata: {
        totalAlarms: alarms.length,
        exportedBy: 'AdvancedAlarmScheduler',
        timezone: this.config.timeZone
      }
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

  private static getTotalOccurrences(alarm: AdvancedAlarm, fromDate: Date): number {
    // Implementation would track historical occurrences
    return 0;
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

  private static async calculateSleepCycleAdjustment(alarm: AdvancedAlarm): Promise<number> {
    // Implementation would analyze sleep patterns and optimize for sleep cycles
    return 0;
  }

  private static async calculateSunriseAdjustment(alarm: AdvancedAlarm): Promise<number> {
    // Implementation would adjust based on sunrise/sunset times
    return 0;
  }

  private static async calculateTrafficAdjustment(alarm: AdvancedAlarm): Promise<number> {
    // Implementation would check traffic conditions and adjust accordingly
    return 0;
  }

  private static async calculateWeatherAdjustment(alarm: AdvancedAlarm): Promise<number> {
    // Implementation would check weather forecast and adjust accordingly
    return 0;
  }

  private static async calculateEnergyLevelAdjustment(alarm: AdvancedAlarm): Promise<number> {
    // Implementation would analyze user's energy patterns and adjust accordingly
    return 0;
  }

  private static async evaluateWeatherCondition(condition: any): Promise<boolean> {
    // Implementation would check weather conditions
    return true;
  }

  private static async evaluateCalendarCondition(condition: any): Promise<boolean> {
    // Implementation would check calendar events
    return true;
  }

  private static async evaluateSleepQualityCondition(condition: any): Promise<boolean> {
    // Implementation would check sleep quality metrics
    return true;
  }

  private static async evaluateDayOfWeekCondition(condition: any): Promise<boolean> {
    const today = new Date().getDay();
    return condition.value.includes(today);
  }

  private static async evaluateTimeSinceLastCondition(condition: any): Promise<boolean> {
    // Implementation would check time since last alarm
    return true;
  }

  private static async adjustAlarmTime(alarmId: string, minutes: number): Promise<void> {
    // Implementation would adjust alarm time
  }

  private static async changeAlarmSound(alarmId: string, sound: string): Promise<void> {
    // Implementation would change alarm sound
  }

  private static async changeAlarmDifficulty(alarmId: string, difficulty: string): Promise<void> {
    // Implementation would change alarm difficulty
  }

  private static async sendNotification(message: string, parameters: any): Promise<void> {
    // Implementation would send notification
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
    // Implementation for monthly scheduling by specific dates
    return new Date(baseTime);
  }

  private static getNextMonthlyByWeek(baseTime: Date, weeksOfMonth: number[], daysOfWeek: number[], fromDate: Date): Date {
    // Implementation for monthly scheduling by week patterns
    return new Date(baseTime);
  }

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

export default AdvancedAlarmScheduler;