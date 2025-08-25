import {
  SleepAnalysisService,
  SmartAlarmRecommendation,
  SleepPattern,
} from './sleep-analysis';
import { supabase } from './supabase';
import type { Alarm } from '../types';

export interface SmartAlarm extends Alarm {
  smartEnabled: boolean;
  wakeWindow: number; // minutes before original time
  adaptiveEnabled: boolean;
  sleepGoal: number; // minutes of sleep
  consistency: boolean; // maintain consistent wake times
  seasonalAdjustment: boolean;
  smartSchedule: SmartSchedule;
  conditionBasedAdjustments?: unknown;
}

export interface SmartSchedule {
  originalTime: string;
  suggestedTime: string;
  confidence: number;
  reason: string;
  sleepQuality: number;
  wakeUpDifficulty: string;
  lastUpdated: Date;
}

export interface AlarmOptimization {
  alarmId: string;
  optimizationType: 'sleep_cycle' | 'consistency' | 'sleep_goal' | 'seasonal';
  oldTime: string;
  newTime: string;
  reason: string;
  effectiveDate: Date;
  accepted: boolean;
}

export interface SleepGoal {
  targetBedtime: string;
  targetWakeTime: string;
  targetDuration: number; // minutes
  consistency: boolean;
  weekendVariation: number; // minutes difference allowed
  adaptToLifestyle: boolean;
}

export interface UserScheduleAnalysis {
  sleepDebt: number; // accumulated sleep deficit in minutes
  averageSleepDuration: number;
  sleepConsistency: number; // 0-100 score
  chronotypeAlignment: number; // how well aligned current schedule is
  recommendations: ScheduleRecommendation[];
}

export interface ScheduleRecommendation {
  type:
    | 'bedtime_earlier'
    | 'bedtime_later'
    | 'wake_consistent'
    | 'sleep_goal'
    | 'weekend_adjustment';
  description: string;
  impact: 'low' | 'medium' | 'high';
  timeAdjustment: number; // minutes
  expectedImprovement: string;
}

export class SmartAlarmScheduler {
  private static userId: string | null = null;
  private static sleepGoal: SleepGoal | null = null;

  static async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await SleepAnalysisService.initialize(userId);
    await this.loadUserSleepGoal();
    console.log('Smart alarm scheduler initialized');
  }

  // Smart alarm management
  static async createSmartAlarm(
    alarmData: Partial<SmartAlarm>
  ): Promise<SmartAlarm | null> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      // Generate smart schedule if enabled
      let smartSchedule: SmartSchedule | null = null;
      if (alarmData.smartEnabled) {
        const recommendation = await this.generateSmartSchedule(alarmData as Alarm);
        if (recommendation) {
          smartSchedule = {
            originalTime: alarmData.time!,
            suggestedTime: recommendation.recommendedTime,
            confidence: recommendation.confidence,
            reason: recommendation.reason,
            sleepQuality: recommendation.estimatedSleepQuality,
            wakeUpDifficulty: recommendation.wakeUpDifficulty,
            lastUpdated: new Date(),
          };
        }
      }

      const smartAlarm: SmartAlarm = {
        id: this.generateId(),
        time: alarmData.time!,
        label: alarmData.label || 'Smart Alarm',
        enabled: alarmData.enabled ?? true,
        days: alarmData.days || [1, 2, 3, 4, 5],
        voiceMood: alarmData.voiceMood || 'motivational',
        snoozeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        smartEnabled: alarmData.smartEnabled ?? true,
        wakeWindow: alarmData.wakeWindow ?? 30,
        adaptiveEnabled: alarmData.adaptiveEnabled ?? true,
        sleepGoal: alarmData.sleepGoal ?? 480,
        consistency: alarmData.consistency ?? true,
        seasonalAdjustment: alarmData.seasonalAdjustment ?? false,
        smartSchedule: smartSchedule || {
          originalTime: alarmData.time!,
          suggestedTime: alarmData.time!,
          confidence: 0,
          reason: 'No sleep data available',
          sleepQuality: 5,
          wakeUpDifficulty: 'normal',
          lastUpdated: new Date(),
        },
      };

      // Save to database
      const { data, _error } = await supabase.from('alarms').insert({
        id: smartAlarm.id,
        user_id: this.userId,
        time: smartAlarm.time,
        label: smartAlarm.label,
        enabled: smartAlarm.enabled,
        days: smartAlarm.days,
        voice_mood: smartAlarm.voiceMood,
        snooze_count: smartAlarm.snoozeCount,
        smart_enabled: smartAlarm.smartEnabled,
        wake_window: smartAlarm.wakeWindow,
        adaptive_enabled: smartAlarm.adaptiveEnabled,
        sleep_goal: smartAlarm.sleepGoal,
        consistency: smartAlarm.consistency,
        seasonal_adjustment: smartAlarm.seasonalAdjustment,
        smart_schedule: smartAlarm.smartSchedule,
        created_at: smartAlarm.createdAt,
        updated_at: smartAlarm.updatedAt,
      });

      if (_error) throw error;
      return smartAlarm;
    } catch (_error) {
      console._error('Error creating smart alarm:', _error);
      return null;
    }
  }

  static async updateSmartAlarm(
    alarmId: string,
    updates: Partial<SmartAlarm>
  ): Promise<SmartAlarm | null> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      // Regenerate smart schedule if relevant fields changed
      if (updates.time || updates.days || updates.smartEnabled) {
        const alarm = await this.getSmartAlarm(alarmId);
        if (alarm && updates.smartEnabled !== false) {
          const recommendation = await this.generateSmartSchedule({
            ...alarm,
            ...updates,
          } as Alarm);
          if (recommendation) {
            updates.smartSchedule = {
              originalTime: updates.time || alarm.time,
              suggestedTime: recommendation.recommendedTime,
              confidence: recommendation.confidence,
              reason: recommendation.reason,
              sleepQuality: recommendation.estimatedSleepQuality,
              wakeUpDifficulty: recommendation.wakeUpDifficulty,
              lastUpdated: new Date(),
            };
          }
        }
      }

      const { data, _error } = await supabase
        .from('alarms')
        .update({
          ...updates,
          smart_enabled: updates.smartEnabled,
          wake_window: updates.wakeWindow,
          adaptive_enabled: updates.adaptiveEnabled,
          sleep_goal: updates.sleepGoal,
          seasonal_adjustment: updates.seasonalAdjustment,
          smart_schedule: updates.smartSchedule,
          updated_at: new Date(),
        })
        .eq('id', alarmId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (_error) throw error;
      return this.mapDatabaseToSmartAlarm(data);
    } catch (_error) {
      console._error('Error updating smart alarm:', _error);
      return null;
    }
  }

  static async getSmartAlarm(alarmId: string): Promise<SmartAlarm | null> {
    if (!this.userId) return null;

    try {
      const { data, _error } = await supabase
        .from('alarms')
        .select('*')
        .eq('id', alarmId)
        .eq('user_id', this.userId)
        .single();

      if (_error) throw error;
      return this.mapDatabaseToSmartAlarm(data);
    } catch (_error) {
      console._error('Error fetching smart alarm:', _error);
      return null;
    }
  }

  static async getAllSmartAlarms(): Promise<SmartAlarm[]> {
    if (!this.userId) return [];

    try {
      const { data, _error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', this.userId)
        .order('time', { ascending: true });

      if (_error) throw error;
      return data.map(this.mapDatabaseToSmartAlarm);
    } catch (_error) {
      console._error('Error fetching smart alarms:', _error);
      return [];
    }
  }

  // Smart scheduling logic
  static async generateSmartSchedule(
    alarm: Alarm
  ): Promise<SmartAlarmRecommendation | null> {
    try {
      const recommendation =
        await SleepAnalysisService.getSmartAlarmRecommendation(alarm);

      if (recommendation && this.sleepGoal) {
        // Additional optimization based on sleep goal
        const optimizedRecommendation = await this.optimizeForSleepGoal(
          recommendation,
          alarm
        );
        return optimizedRecommendation;
      }

      return recommendation;
    } catch (_error) {
      console._error('Error generating smart schedule:', _error);
      return null;
    }
  }

  private static async optimizeForSleepGoal(
    recommendation: SmartAlarmRecommendation,
    alarm: Alarm
  ): Promise<SmartAlarmRecommendation> {
    if (!this.sleepGoal) return recommendation;

    const targetWakeTime = this.parseTimeString(this.sleepGoal.targetWakeTime);
    const recommendedWakeTime = this.parseTimeString(recommendation.recommendedTime);

    const targetMinutes = targetWakeTime.hours * 60 + targetWakeTime.minutes;
    const recommendedMinutes =
      recommendedWakeTime.hours * 60 + recommendedWakeTime.minutes;

    // If recommended time is too far from sleep goal, adjust
    const difference = Math.abs(targetMinutes - recommendedMinutes);

    if (difference > 30 && this.sleepGoal.consistency) {
      // Bias towards consistency
      const consistentTime = this.findConsistentTime(targetMinutes, recommendedMinutes);

      return {
        ...recommendation,
        recommendedTime: this.minutesToTimeString(consistentTime),
        reason: `${recommendation.reason} Adjusted for sleep goal consistency.`,
        confidence: recommendation.confidence * 0.9, // Slightly reduce confidence
      };
    }

    return recommendation;
  }

  private static findConsistentTime(
    targetMinutes: number,
    recommendedMinutes: number
  ): number {
    // Find a compromise between target and recommended time
    const midpoint = (targetMinutes + recommendedMinutes) / 2;

    // Bias slightly towards the target time for consistency
    return Math.round(midpoint * 0.7 + targetMinutes * 0.3);
  }

  // Sleep goal management
  static async setSleepGoal(goal: SleepGoal): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    this.sleepGoal = goal;

    try {
      await supabase.from('user_preferences').upsert({
        user_id: this.userId,
        sleep_goal: goal,
        updated_at: new Date(),
      });

      console.log('Sleep goal updated:', goal);
    } catch (_error) {
      console._error('Error saving sleep goal:', _error);
    }
  }

  static getSleepGoal(): SleepGoal | null {
    return this.sleepGoal;
  }

  private static async loadUserSleepGoal(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, _error } = await supabase
        .from('user_preferences')
        .select('sleep_goal')
        .eq('user_id', this.userId)
        .single();

      if (!_error && data?.sleep_goal) {
        this.sleepGoal = data.sleep_goal;
      } else {
        // Set default sleep goal
        this.sleepGoal = {
          targetBedtime: '22:30',
          targetWakeTime: '07:00',
          targetDuration: 510, // 8.5 hours
          consistency: true,
          weekendVariation: 60, // 1 hour variation on weekends
          adaptToLifestyle: true,
        };
      }
    } catch (_error) {
      console._error('Error loading sleep goal:', _error);
    }
  }

  // Schedule analysis and recommendations
  static async analyzeUserSchedule(): Promise<UserScheduleAnalysis | null> {
    try {
      const pattern = await SleepAnalysisService.analyzeSleepPatterns();
      if (!pattern) return null;

      const alarms = await this.getAllSmartAlarms();
      const sleepSessions = await SleepAnalysisService.getSleepHistory(30);

      const analysis: UserScheduleAnalysis = {
        sleepDebt: this.calculateSleepDebt(sleepSessions),
        averageSleepDuration: pattern.averageSleepDuration,
        sleepConsistency: this.calculateSleepConsistency(sleepSessions),
        chronotypeAlignment: this.calculateChronotypeAlignment(pattern, alarms),
        recommendations: this.generateScheduleRecommendations(
          pattern,
          sleepSessions,
          alarms
        ),
      };

      return analysis;
    } catch (_error) {
      console._error('Error analyzing _user schedule:', _error);
      return null;
    }
  }

  private static calculateSleepDebt(sessions: any[]): number {
    if (!this.sleepGoal) return 0;

    const last7Days = sessions.slice(0, 7);
    const totalSleepDeficit = last7Days.reduce((debt, session) => {
      const deficit = Math.max(
        0,
        this.sleepGoal!.targetDuration - session.sleepDuration
      );
      return debt + deficit;
    }, 0);

    return totalSleepDeficit;
  }

  private static calculateSleepConsistency(sessions: any[]): number {
    if (sessions.length < 7) return 0;

    const bedtimes = sessions.slice(0, 7).map(s => {
      const bedtime = new Date(s.bedtime);
      return bedtime.getHours() * 60 + bedtime.getMinutes();
    });

    const waketimes = sessions.slice(0, 7).map(s => {
      const waketime = new Date(s.wakeTime);
      return waketime.getHours() * 60 + waketime.getMinutes();
    });

    const bedtimeVariance = this.calculateVariance(bedtimes);
    const waketimeVariance = this.calculateVariance(waketimes);

    // Convert variance to consistency score (lower variance = higher consistency)
    const maxVariance = 120 * 120; // 2 hours squared
    const avgVariance = (bedtimeVariance + waketimeVariance) / 2;
    const consistencyScore = Math.max(0, 100 - (avgVariance / maxVariance) * 100);

    return Math.round(consistencyScore);
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private static calculateChronotypeAlignment(
    pattern: SleepPattern,
    alarms: SmartAlarm[]
  ): number {
    if (alarms.length === 0) return 50; // Neutral score

    const idealBedtime = this.getIdealBedtimeForChronotype(pattern.chronotype);
    const idealWakeTime = this.getIdealWakeTimeForChronotype(pattern.chronotype);

    const avgAlarmTime = this.calculateAverageAlarmTime(alarms);
    const actualBedtime = this.parseTimeString(pattern.averageBedtime);

    const bedtimeAlignment = this.calculateTimeAlignment(actualBedtime, idealBedtime);
    const waketimeAlignment = this.calculateTimeAlignment(avgAlarmTime, idealWakeTime);

    return Math.round((bedtimeAlignment + waketimeAlignment) / 2);
  }

  private static getIdealBedtimeForChronotype(chronotype: string): {
    hours: number;
    minutes: number;
  } {
    const idealTimes = {
      extreme_early: { hours: 20, minutes: 30 },
      early: { hours: 21, minutes: 30 },
      normal: { hours: 22, minutes: 30 },
      late: { hours: 23, minutes: 30 },
      extreme_late: { hours: 0, minutes: 30 },
    };
    return idealTimes[chronotype as keyof typeof idealTimes] || idealTimes.normal;
  }

  private static getIdealWakeTimeForChronotype(chronotype: string): {
    hours: number;
    minutes: number;
  } {
    const idealTimes = {
      extreme_early: { hours: 5, minutes: 30 },
      early: { hours: 6, minutes: 30 },
      normal: { hours: 7, minutes: 30 },
      late: { hours: 8, minutes: 30 },
      extreme_late: { hours: 9, minutes: 30 },
    };
    return idealTimes[chronotype as keyof typeof idealTimes] || idealTimes.normal;
  }

  private static calculateAverageAlarmTime(alarms: SmartAlarm[]): {
    hours: number;
    minutes: number;
  } {
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length === 0) return { hours: 7, minutes: 0 };

    const totalMinutes = enabledAlarms.reduce((sum, alarm) => {
      const time = this.parseTimeString(alarm.time);
      return sum + (time.hours * 60 + time.minutes);
    }, 0);

    const avgMinutes = totalMinutes / enabledAlarms.length;
    return {
      hours: Math.floor(avgMinutes / 60),
      minutes: Math.round(avgMinutes % 60),
    };
  }

  private static calculateTimeAlignment(
    actual: { hours: number; minutes: number },
    ideal: { hours: number; minutes: number }
  ): number {
    const actualMinutes = actual.hours * 60 + actual.minutes;
    const idealMinutes = ideal.hours * 60 + ideal.minutes;

    const difference = Math.abs(actualMinutes - idealMinutes);
    const maxDifference = 180; // 3 hours

    return Math.max(0, 100 - (difference / maxDifference) * 100);
  }

  private static generateScheduleRecommendations(
    pattern: SleepPattern,
    sessions: any[],
    alarms: SmartAlarm[]
  ): ScheduleRecommendation[] {
    const recommendations: ScheduleRecommendation[] = [];

    // Sleep debt recommendation
    const sleepDebt = this.calculateSleepDebt(sessions);
    if (sleepDebt > 60) {
      recommendations.push({
        type: 'bedtime_earlier',
        description: `Move bedtime 15-30 minutes earlier to reduce your ${Math.round(sleepDebt)} minute sleep debt`,
        impact: 'high',
        timeAdjustment: -30,
        expectedImprovement: 'Better energy and mood throughout the day',
      });
    }

    // Consistency recommendation
    const consistency = this.calculateSleepConsistency(sessions);
    if (consistency < 70) {
      recommendations.push({
        type: 'wake_consistent',
        description: 'Try to wake up at the same time every day, including weekends',
        impact: 'medium',
        timeAdjustment: 0,
        expectedImprovement: 'More stable circadian rhythm and better sleep quality',
      });
    }

    // Chronotype alignment
    const alignment = this.calculateChronotypeAlignment(pattern, alarms);
    if (alignment < 60) {
      const idealBedtime = this.getIdealBedtimeForChronotype(pattern.chronotype);
      const currentBedtime = this.parseTimeString(pattern.averageBedtime);
      const adjustment =
        idealBedtime.hours * 60 +
        idealBedtime.minutes -
        (currentBedtime.hours * 60 + currentBedtime.minutes);

      recommendations.push({
        type: adjustment > 0 ? 'bedtime_later' : 'bedtime_earlier',
        description: `Adjust bedtime to better match your ${pattern.chronotype} chronotype`,
        impact: 'medium',
        timeAdjustment: Math.round(adjustment / 2), // Gradual adjustment
        expectedImprovement: 'Easier time falling asleep and waking up',
      });
    }

    return recommendations;
  }

  // Optimization tracking
  static async recordOptimization(optimization: AlarmOptimization): Promise<void> {
    if (!this.userId) return;

    try {
      await supabase.from('alarm_optimizations').insert({
        user_id: this.userId,
        alarm_id: optimization.alarmId,
        optimization_type: optimization.optimizationType,
        old_time: optimization.oldTime,
        new_time: optimization.newTime,
        reason: optimization.reason,
        effective_date: optimization.effectiveDate,
        accepted: optimization.accepted,
        created_at: new Date(),
      });
    } catch (_error) {
      console._error('Error recording optimization:', _error);
    }
  }

  static async getOptimizationHistory(alarmId?: string): Promise<AlarmOptimization[]> {
    if (!this.userId) return [];

    try {
      let query = supabase
        .from('alarm_optimizations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (alarmId) {
        query = query.eq('alarm_id', alarmId);
      }

      const { data, _error } = await query;
      if (_error) throw error;

      return data.map((item: any) => ({
        alarmId: item.alarm_id,
        optimizationType: item.optimization_type,
        oldTime: item.old_time,
        newTime: item.new_time,
        reason: item.reason,
        effectiveDate: new Date(item.effective_date),
        accepted: item.accepted,
      }));
    } catch (_error) {
      console._error('Error fetching optimization history:', _error);
      return [];
    }
  }

  // Utility methods
  private static mapDatabaseToSmartAlarm(data: any): SmartAlarm {
    return {
      id: data.id,
      time: data.time,
      label: data.label,
      enabled: data.enabled,
      days: data.days,
      voiceMood: data.voice_mood,
      snoozeCount: data.snooze_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      smartEnabled: data.smart_enabled ?? false,
      wakeWindow: data.wake_window ?? 30,
      adaptiveEnabled: data.adaptive_enabled ?? false,
      sleepGoal: data.sleep_goal ?? 480,
      consistency: data.consistency ?? false,
      seasonalAdjustment: data.seasonal_adjustment ?? false,
      smartSchedule: data.smart_schedule || {
        originalTime: data.time,
        suggestedTime: data.time,
        confidence: 0,
        reason: 'No data available',
        sleepQuality: 5,
        wakeUpDifficulty: 'normal',
        lastUpdated: new Date(),
      },
    };
  }

  private static parseTimeString(timeStr: string): {
    hours: number;
    minutes: number;
  } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private static minutesToTimeString(totalMinutes: number): string {
    const adjustedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(adjustedMinutes / 60);
    const minutes = adjustedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export default SmartAlarmScheduler;
