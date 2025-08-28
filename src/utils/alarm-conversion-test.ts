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
      dependencies: [],
    };
  }

  /**
   * Convert an array of advanced alarms to basic alarms
   */
  static convertArrayToBasic(advancedAlarms: AdvancedAlarm[]): Alarm[] {
    return advancedAlarms.map(alarm => this.convertToBasic(alarm));
  }
}

export default AlarmConversionUtil;
