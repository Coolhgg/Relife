/**
 * AlarmExecutor - Handles smart optimizations, conditional rules, and advanced execution logic
 */
import { config } from '../config/environment';
import type {
  Alarm,
  SmartOptimization,
  SeasonalAdjustment,
  LocationTrigger,
  SunSchedule,
  ConditionalRule,
  SchedulingConfig,
} from '../types/index';
// import { AlarmService } from './alarm'; // Temporarily commented out due to parsing errors in alarm.ts

// Temporary stub for AlarmService to fix parsing errors
const AlarmService = {
  toggleAlarm: async (id: string, enabled: boolean): Promise<void> => {
    console.warn('AlarmService.toggleAlarm stub called:', { id, enabled });
  },
  updateAlarm: async (id: string, updates: any): Promise<void> => {
    console.warn('AlarmService.updateAlarm stub called:', { id, updates });
  },
};

export class AlarmExecutor {
  // ===== SMART OPTIMIZATIONS =====

  static async applySmartOptimizations(
    alarm: Alarm,
    _config: SchedulingConfig
  ): Promise<Alarm> {
    if (!alarm.smartOptimizations || !_config.enableSmartAdjustments) {
      return alarm;
    }

    let optimizedAlarm = { ...alarm };

    for (const optimization of alarm.smartOptimizations.filter(o => o.isEnabled)) {
      try {
        optimizedAlarm = await this.applyOptimization(
          optimizedAlarm,
          optimization,
          _config
        );
      } catch (_error) {
        console._error('Error applying optimization:', optimization.type, _error);
      }
    }

    return optimizedAlarm;
  }

  private static async applyOptimization(
    alarm: Alarm,
    optimization: SmartOptimization,
    _config: SchedulingConfig
  ): Promise<Alarm> {
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
    const maxAdjustment =
      optimization.parameters.maxAdjustment || config.maxDailyAdjustment;
    adjustmentMinutes = Math.max(
      -maxAdjustment,
      Math.min(maxAdjustment, adjustmentMinutes)
    );

    // Adjust alarm time
    if (adjustmentMinutes !== 0) {
      const optimizedTime = this.adjustTimeByMinutes(alarm.time, adjustmentMinutes);
      const updatedOptimization = { ...optimization, lastApplied: new Date() };

      return {
        ...alarm,
        time: optimizedTime,
        smartOptimizations: alarm.smartOptimizations?.map(o =>
          o.type === type ? optimization : o
        ),
      };
    }

    return alarm;
  }

  private static async calculateSleepCycleAdjustment(alarm: Alarm): Promise<number> {
    // In a real implementation, this would analyze user's sleep patterns
    // and adjust timing to align with optimal sleep cycles (90-minute cycles)
    const sleepCycleMinutes = 90;
    const optimalWakeMinutes = [0, 15, 30]; // Best times within a cycle to wake

    const [hours, minutes] = alarm.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const cyclePosition = totalMinutes % sleepCycleMinutes;

    // Find nearest optimal wake time
    let bestAdjustment = 0;
    let minDistance = Infinity;

    for (const optimal of optimalWakeMinutes) {
      const distance = Math.abs(cyclePosition - optimal);
      if (distance < minDistance) {
        minDistance = distance;
        bestAdjustment = optimal - cyclePosition;
      }
    }

    // Only adjust if significant improvement (> 10 minutes)
    return minDistance > 10 ? bestAdjustment : 0;
  }

  private static async calculateSunriseAdjustment(alarm: Alarm): Promise<number> {
    // In a real implementation, get actual sunrise time for user's location
    // For now, simulate adjustment based on season
    const now = new Date();
    const month = now.getMonth() + 1;

    // Summer: earlier sunrise, winter: later sunrise
    if (month >= 6 && month <= 8) {
      return -15; // Wake 15 minutes earlier in summer
    } else if (month >= 12 || month <= 2) {
      return 15; // Wake 15 minutes later in winter
    }

    return 0;
  }

  private static async calculateTrafficAdjustment(alarm: Alarm): Promise<number> {
    // In a real implementation, integrate with traffic APIs
    // Simulate traffic-based adjustment
    const now = new Date();
    const dayOfWeek = now.getDay();
    const [hours] = alarm.time.split(':').map(Number);

    // Rush hour adjustments (weekdays 7-9 AM)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 7 && hours <= 9) {
      return -10; // Leave 10 minutes earlier for traffic
    }

    return 0;
  }

  private static async calculateWeatherAdjustment(alarm: Alarm): Promise<number> {
    // In a real implementation, get actual weather forecast
    // Simulate weather-based adjustment
    const conditions = ['clear', 'rain', 'snow', 'fog'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

    switch (randomCondition) {
      case 'rain':
      case 'snow':
        return -5; // Wake 5 minutes earlier for bad weather
      case 'fog':
        return -10; // Wake 10 minutes earlier for fog
      default:
        return 0;
    }
  }

  private static async calculateEnergyLevelAdjustment(alarm: Alarm): Promise<number> {
    // In a real implementation, analyze user's energy patterns from fitness trackers
    // or user-reported data. For now, simulate based on time of alarm
    const [hours] = alarm.time.split(':').map(Number);

    // Very early alarms might benefit from slight delay
    if (hours < 6) {
      return 5; // Allow 5 more minutes for very early alarms
    }

    return 0;
  }

  // ===== SEASONAL ADJUSTMENTS =====

  static applySeasonalAdjustments(alarm: Alarm, date: Date = new Date()): Alarm {
    if (!alarm.seasonalAdjustments || alarm.seasonalAdjustments.length === 0) {
      return alarm;
    }

    const currentSeason = this.getCurrentSeason(date);
    const activeAdjustment = alarm.seasonalAdjustments.find(
      adj => adj.season === currentSeason && adj.isActive
    );

    if (activeAdjustment) {
      const adjustedTime = this.adjustTimeByMinutes(
        alarm.time,
        activeAdjustment.adjustmentMinutes
      );
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
    alarm: Alarm,
    currentLocation?: GeolocationPosition
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

  private static async executeLocationAction(alarm: Alarm, action: any): Promise<void> {
    switch (action.type) {
      case 'enable_alarm':
        await AlarmService.toggleAlarm(alarm.id, true);
        break;

      case 'disable_alarm':
        await AlarmService.toggleAlarm(alarm.id, false);
        break;

      case 'adjust_time':
        const adjustmentMinutes = action.parameters.minutes || 0;
        const newTime = this.adjustTimeByMinutes(alarm.time, adjustmentMinutes);
        // Update the alarm with new time using the correct format
        await AlarmService.updateAlarm(alarm.id, {
          time: newTime,
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
        });
        break;

      case 'notification':
        await this.sendNotification(
          action.parameters.message || 'Location-based alarm triggered',
          action.parameters
        );
        break;
    }
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ===== SUN-BASED SCHEDULING =====

  static async calculateSunBasedTime(
    sunSchedule: SunSchedule,
    date: Date = new Date()
  ): Promise<string> {
    try {
      const sunTimes = await this.getSunTimes(sunSchedule.location, date);
      const baseTime =
        sunSchedule.type === 'sunrise' ? sunTimes.sunrise : sunTimes.sunset;

      // Apply offset
      const adjustedTime = new Date(
        baseTime.getTime() + sunSchedule.offset * 60 * 1000
      );

      // Apply seasonal adjustment if enabled
      if (sunSchedule.seasonalAdjustment) {
        const seasonalOffset = this.getSeasonalSunOffset(date);
        adjustedTime.setMinutes(adjustedTime.getMinutes() + seasonalOffset);
      }

      return this.formatTimeToHHMM(adjustedTime);
    } catch (_error) {
      console._error('Error calculating sun-based time:', _error);
      return '07:00'; // Fallback time
    }
  }

  private static async getSunTimes(
    location: any,
    date: Date
  ): Promise<{ sunrise: Date; sunset: Date }> {
    // This would integrate with a sunrise/sunset API
    // For now, return estimated times based on location and date
    const sunrise = new Date(date);
    const sunset = new Date(date);

    // Simplified calculation - in real implementation, use SunCalc or similar library
    sunrise.setHours(6, 30, 0, 0);
    sunset.setHours(18, 30, 0, 0);

    return { sunrise, sunset };
  }

  private static getSeasonalSunOffset(date: Date): number {
    const month = date.getMonth() + 1;

    // Seasonal adjustments for sunrise/sunset timing
    if (month >= 6 && month <= 8) {
      return -10; // Summer: slightly earlier
    } else if (month >= 12 || month <= 2) {
      return 10; // Winter: slightly later
    }

    return 0;
  }

  // ===== CONDITIONAL RULES EVALUATION =====

  static async evaluateConditionalRules(
    alarm: Alarm,
    forDate?: Date
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
      } catch (_error) {
        console._error(`Error evaluating conditional rule ${rule.type}:`, _error);
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

  private static async evaluateWeatherCondition(conditions: any): Promise<boolean> {
    // In a real implementation, get actual weather data
    // For now, simulate weather condition evaluation
    const weatherConditions = ['sunny', 'rainy', 'cloudy', 'snowy'];
    const currentWeather =
      weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    if (conditions.weatherType) {
      return conditions.weatherType === currentWeather;
    }

    if (conditions.temperature) {
      // Simulate temperature check (in real implementation, get actual temperature)
      const currentTemp = 20 + Math.random() * 15; // 20-35°C
      return (
        currentTemp >= conditions.temperature.min &&
        currentTemp <= conditions.temperature.max
      );
    }

    return true;
  }

  private static async evaluateCalendarCondition(conditions: any): Promise<boolean> {
    // In a real implementation, integrate with calendar APIs
    // For now, simulate calendar condition evaluation
    const hasEvents = Math.random() > 0.5;

    if (conditions.hasEvents !== undefined) {
      return conditions.hasEvents === hasEvents;
    }

    return true;
  }

  private static async evaluateSleepQualityCondition(
    conditions: any
  ): Promise<boolean> {
    // In a real implementation, integrate with sleep tracking devices/apps
    // For now, simulate sleep quality evaluation
    const sleepQuality = Math.floor(Math.random() * 100); // 0-100 quality score

    if (conditions.minQuality) {
      return sleepQuality >= conditions.minQuality;
    }

    return true;
  }

  private static async evaluateDayOfWeekCondition(conditions: any): Promise<boolean> {
    const currentDay = new Date().getDay();

    if (conditions.daysOfWeek && Array.isArray(conditions.daysOfWeek)) {
      return conditions.daysOfWeek.includes(currentDay);
    }

    return true;
  }

  private static async evaluateTimeSinceLastCondition(
    conditions: any
  ): Promise<boolean> {
    // In a real implementation, track when alarms were last triggered
    // For now, simulate time since last condition
    const hoursSinceLastAlarm = Math.floor(Math.random() * 24);

    if (conditions.minHours) {
      return hoursSinceLastAlarm >= conditions.minHours;
    }

    return true;
  }

  // ===== UTILITY METHODS =====

  private static adjustTimeByMinutes(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return this.formatTimeToHHMM(date);
  }

  private static formatTimeToHHMM(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  private static async sendNotification(
    message: string,
    parameters: any
  ): Promise<void> {
    // In a real implementation, send actual notifications
    console.log(`Notification: ${message}`, parameters);
  }
}
