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
      calendarIntegration: false,
      seasonalAdjustments: [],
      smartOptimizations: [],
      preferences: {},
      dependencies: []
    };
  }

  /**
   * Convert advanced alarm to basic alarm
   */
  static convertToBasic(advancedAlarm: AdvancedAlarm): Alarm {
    return {
      id: advancedAlarm.id,
      time: advancedAlarm.time,
      label: advancedAlarm.label,
      enabled: advancedAlarm.enabled,
      days: advancedAlarm.days,
      sound: advancedAlarm.sound
    };
  }
}

export default AlarmConversionUtil;