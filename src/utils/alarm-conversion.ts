import { Alarm, AdvancedAlarm } from '../types';

/**
 * Utility class for converting between basic and advanced alarm formats
 */

export class AlarmConversionUtil {
  /**
   * Convert basic alarm to advanced alarm
   */
  static convertToAdvanced(basicAlarm: Alarm): AdvancedAlarm {
    return {
      ...basicAlarm,
      scheduleType: 'daily',
      recurrencePattern: undefined,
      conditionalRules: [],
      locationTriggers: [],
      calendarIntegration: undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      seasonalAdjustments: [],
      smartOptimizations: [],
      dependencies: [],
    };
  }

  /**
   * Convert advanced alarm to basic alarm
   */
  static convertToBasic(advancedAlarm: AdvancedAlarm): Alarm {
    const basicAlarm: Alarm = {
      id: advancedAlarm.id,
      userId: advancedAlarm.userId,
      time: advancedAlarm.time,
      label: advancedAlarm.label,
      enabled: advancedAlarm.enabled,
      isActive: advancedAlarm.isActive,
      days: advancedAlarm.days,
      dayNames: advancedAlarm.dayNames,
      voiceMood: advancedAlarm.voiceMood,
      sound: advancedAlarm.sound,
      difficulty: advancedAlarm.difficulty,
      snoozeEnabled: advancedAlarm.snoozeEnabled,
      snoozeInterval: advancedAlarm.snoozeInterval,
      snoozeCount: advancedAlarm.snoozeCount,
      maxSnoozes: advancedAlarm.maxSnoozes,
      lastTriggered: advancedAlarm.lastTriggered,
      createdAt: advancedAlarm.createdAt,
      updatedAt: advancedAlarm.updatedAt,
      battleId: advancedAlarm.battleId,
      weatherEnabled: advancedAlarm.weatherEnabled,
      smartFeatures: advancedAlarm.smartFeatures,
    };

    return basicAlarm;
  }

  /**
   * Convert an array of basic alarms to advanced alarms
   */
  static convertArrayToAdvanced(basicAlarms: any[]): any[] {
    return basicAlarms.map(alarm => this.convertToAdvanced(alarm));
  }

  /**
   * Convert an array of advanced alarms to basic alarms
   */
  static convertArrayToBasic(advancedAlarms: AdvancedAlarm[]): Alarm[] {
    return advancedAlarms.map(alarm => this.convertToBasic(alarm));
  }

  /**
   * Check if an alarm has advanced features enabled
   */
  static hasAdvancedFeatures(alarm: AdvancedAlarm): boolean {
    return !!(
      alarm.scheduleType !== 'daily' ||
      alarm.recurrencePattern ||
      (alarm.conditionalRules && alarm.conditionalRules.length > 0) ||
      (alarm.locationTriggers && alarm.locationTriggers.length > 0) ||
      alarm.calendarIntegration ||
      (alarm.seasonalAdjustments && alarm.seasonalAdjustments.length > 0) ||
      (alarm.smartOptimizations && alarm.smartOptimizations.length > 0) ||
      (alarm.dependencies && alarm.dependencies.length > 0)
    );
  }

  /**
   * Get a summary of advanced features for an alarm
   */
  static getAdvancedFeaturesSummary(alarm: AdvancedAlarm): string[] {
    const features: string[] = [];

    if (alarm.scheduleType !== 'daily') {
      features.push(`${alarm.scheduleType} scheduling`);
    }

    if (alarm.recurrencePattern) {
      features.push('Custom recurrence pattern');
    }

    if (alarm.conditionalRules && alarm.conditionalRules.length > 0) {
      features.push(
        `${alarm.conditionalRules.length} conditional rule${alarm.conditionalRules.length > 1 ? 's' : ''}`
      );
    }

    if (alarm.locationTriggers && alarm.locationTriggers.length > 0) {
      features.push(
        `${alarm.locationTriggers.length} location trigger${alarm.locationTriggers.length > 1 ? 's' : ''}`
      );
    }

    if (alarm.calendarIntegration && alarm.calendarIntegration.isActive) {
      features.push('Calendar integration');
    }

    if (alarm.seasonalAdjustments && alarm.seasonalAdjustments.length > 0) {
      features.push('Seasonal adjustments');
    }

    if (
      alarm.smartOptimizations &&
      alarm.smartOptimizations.filter(o => o.isEnabled).length > 0
    ) {
      features.push(
        `${alarm.smartOptimizations.filter(o => o.isEnabled).length} smart optimization${alarm.smartOptimizations.filter(o => o.isEnabled).length > 1 ? 's' : ''}`
      );
    }

    if (alarm.dependencies && alarm.dependencies.length > 0) {
      features.push(
        `${alarm.dependencies.length} alarm dependenc${alarm.dependencies.length > 1 ? 'ies' : 'y'}`
      );
    }

    return features;
  }

  /**
   * Validate an advanced alarm configuration
   */
  static validateAdvancedAlarm(alarm: AdvancedAlarm): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!alarm.time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(alarm.time)) {
      errors.push('Invalid time format');
    }

    if (!alarm.label || alarm.label.trim().length === 0) {
      errors.push('Label is required');
    }

    if (!alarm.days || alarm.days.length === 0) {
      errors.push('At least one day must be selected');
    }

    // Advanced features validation
    if (alarm.recurrencePattern) {
      if (alarm.recurrencePattern.interval < 1) {
        errors.push('Recurrence interval must be at least 1');
      }

      if (
        alarm.recurrencePattern.endDate &&
        alarm.recurrencePattern.endAfterOccurrences
      ) {
        errors.push('Cannot set both end date and end after occurrences');
      }
    }

    if (alarm.locationTriggers) {
      for (const trigger of alarm.locationTriggers) {
        if (!trigger.location.latitude || !trigger.location.longitude) {
          errors.push(`Location trigger "${trigger.name}" has invalid coordinates`);
        }
        if (trigger.radius < 0) {
          errors.push(`Location trigger "${trigger.name}" has invalid radius`);
        }
      }
    }

    if (alarm.smartOptimizations) {
      for (const optimization of alarm.smartOptimizations) {
        if (optimization.parameters.maxAdjustment < 0) {
          errors.push(
            `Smart optimization "${optimization.type}" has invalid max adjustment`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a default advanced alarm configuration
   */
  static createDefaultAdvancedAlarm(userId: string): any {
    return {
      userId,
      time: '07:00',
      label: 'Advanced Alarm',
      scheduleType: 'daily',
      isActive: true,
      enabled: true,
      days: [1, 2, 3, 4, 5], // Weekdays
      dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      voiceMood: 'motivational',
      sound: 'default',
      difficulty: 'medium',
      snoozeEnabled: true,
      snoozeInterval: 5,
      snoozeCount: 0,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      conditionalRules: [],
      locationTriggers: [],
      seasonalAdjustments: [],
      smartOptimizations: [
        {
          type: 'sleep_cycle',
          isEnabled: true,
          parameters: {
            sensitivity: 0.5,
            maxAdjustment: 30,
            learningEnabled: true,
            preferences: {},
          },
        },
      ],
      dependencies: [],
    };
  }
}

export default AlarmConversionUtil;
