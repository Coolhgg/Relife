import {
  SmartAlarmScheduler,
  type SmartAlarm,
  type SleepGoal,
  type UserScheduleAnalysis,
} from './smart-alarm-scheduler';
import {
  SleepAnalysisService,
  type SleepPattern,
  type SmartAlarmRecommendation,
} from './sleep-analysis';
import { supabase } from './supabase';
import type { Alarm } from '../types';

export interface EnhancedSmartAlarm extends SmartAlarm {
  realTimeAdaptation: boolean;
  dynamicWakeWindow: boolean;
  conditionBasedAdjustments: ConditionBasedAdjustment[];
  sleepPatternWeight: number; // 0-1, how much to prioritize sleep patterns vs consistency
  learningFactor: number; // How quickly to adapt based on user feedback
  wakeUpFeedback?: WakeUpFeedback[];
  nextOptimalTimes: OptimalTimeSlot[];
  adaptationHistory: AdaptationRecord[];
}

export interface ConditionBasedAdjustment {
  id: string;
  type:
    | 'weather'
    | 'calendar'
    | 'sleep_debt'
    | 'stress_level'
    | 'exercise'
    | 'caffeine'
    | 'screen_time';
  isEnabled: boolean;
  priority: number; // 1-5, higher = more important
  condition: {
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
    threshold?: number;
  };
  adjustment: {
    timeMinutes: number; // positive = later, negative = earlier
    maxAdjustment: number;
    reason: string;
  };
  lastTriggered?: Date;
  effectivenessScore: number; // 0-1 based on user feedback
}

export interface WakeUpFeedback {
  date: Date;
  originalTime: string;
  actualWakeTime: string;
  difficulty: 'very_easy' | 'easy' | 'normal' | 'hard' | 'very_hard';
  feeling: 'terrible' | 'tired' | 'okay' | 'good' | 'excellent';
  sleepQuality: number; // 1-10
  timeToFullyAwake: number; // minutes
  wouldPreferearlier: boolean;
  wouldPreferLater: boolean;
  notes?: string;
}

export interface OptimalTimeSlot {
  time: string;
  confidence: number;
  sleepStage: 'light' | 'deep' | 'rem';
  factors: string[];
  adjustment: number; // minutes from original time
}

export interface AdaptationRecord {
  date: Date;
  originalTime: string;
  adjustedTime: string;
  reason: string;
  source: 'sleep_pattern' | 'condition' | 'user_feedback' | 'learning';
  effectiveness?: number; // scored later based on feedback
}

export interface SmartAlarmMetrics {
  averageWakeUpDifficulty: number;
  sleepDebtTrend: number[];
  adaptationSuccess: number;
  userSatisfaction: number;
  mostEffectiveConditions: string[];
  recommendedAdjustments: SmartRecommendation[];
}

export interface SmartRecommendation {
  type: 'time_adjustment' | 'condition_change' | 'sleep_goal_update';
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  action: {
    type: string;
    value: any;
  };
}

export class EnhancedSmartAlarmScheduler extends SmartAlarmScheduler {
  private static weatherApiKey: string = process.env.REACT_APP_WEATHER_API_KEY || '';
  private static calendarIntegration: boolean = false;

  // ===== ENHANCED SMART SCHEDULING =====

  static async createEnhancedSmartAlarm(
    alarmData: Partial<EnhancedSmartAlarm>
  ): Promise<EnhancedSmartAlarm | null> {
    const baseAlarm = await super.createSmartAlarm(alarmData);
    if (!baseAlarm) return null;

    const enhancedAlarm: EnhancedSmartAlarm = {
      ...baseAlarm,
      realTimeAdaptation: alarmData.realTimeAdaptation ?? true,
      dynamicWakeWindow: alarmData.dynamicWakeWindow ?? true,
      conditionBasedAdjustments:
        alarmData.conditionBasedAdjustments || this.getDefaultConditions(),
      sleepPatternWeight: alarmData.sleepPatternWeight ?? 0.7,
      learningFactor: alarmData.learningFactor ?? 0.3,
      wakeUpFeedback: [],
      nextOptimalTimes: [],
      adaptationHistory: [],
    };

    // Calculate initial optimal times
    enhancedAlarm.nextOptimalTimes =
      await this.calculateOptimalTimeSlots(enhancedAlarm);

    return enhancedAlarm;
  }

  static async updateSmartScheduleRealTime(
    alarmId: string,
    currentTime: Date = new Date()
  ): Promise<EnhancedSmartAlarm | null> {
    const alarm = (await this.getSmartAlarm(alarmId)) as EnhancedSmartAlarm;
    if (!alarm || !alarm.realTimeAdaptation) return alarm;

    try {
      // Get current conditions
      const conditions = await this.getCurrentConditions();

      // Get latest sleep pattern
      const sleepPattern = await SleepAnalysisService.analyzeSleepPatterns();

      if (!sleepPattern) return alarm;

      // Calculate adjustments based on conditions
      let totalAdjustment = 0;
      const appliedAdjustments: string[] = [];

      for (const conditionAdj of alarm.conditionBasedAdjustments.filter(
        c => c.isEnabled
      )) {
        const adjustment = await this.evaluateConditionAdjustment(
          conditionAdj,
          conditions
        );
        if (adjustment !== 0) {
          totalAdjustment += adjustment;
          appliedAdjustments.push(`${conditionAdj.type}: ${adjustment}min`);
        }
      }

      // Calculate sleep pattern adjustment
      const sleepAdjustment = await this.calculateSleepPatternAdjustment(
        alarm,
        sleepPattern
      );

      // Weight the adjustments
      const finalAdjustment = Math.round(
        totalAdjustment * (1 - alarm.sleepPatternWeight) +
          sleepAdjustment * alarm.sleepPatternWeight
      );

      if (Math.abs(finalAdjustment) >= 5) {
        // Only adjust if significant
        const originalTime = alarm.time;
        const adjustedTime = this.adjustTimeByMinutes(originalTime, finalAdjustment);

        // Record adaptation
        const adaptationRecord: AdaptationRecord = {
          date: new Date(),
          originalTime,
          adjustedTime,
          reason: `Conditions: ${appliedAdjustments.join(', ')}. Sleep pattern: ${sleepAdjustment}min`,
          source: 'condition',
        };

        const updatedAlarm = {
          ...alarm,
          time: adjustedTime,
          adaptationHistory: [...(alarm.adaptationHistory || []), adaptationRecord],
          smartSchedule: {
            ...alarm.smartSchedule,
            suggestedTime: adjustedTime,
            reason: adaptationRecord.reason,
            confidence: this.calculateAdjustmentConfidence(
              totalAdjustment,
              sleepAdjustment
            ),
            lastUpdated: new Date(),
          },
        };

        await this.updateSmartAlarm(alarmId, updatedAlarm);
        return updatedAlarm;
      }

      return alarm;
    } catch (_error) {
      console._error('Error updating smart schedule:', _error);
      return alarm;
    }
  }

  // ===== CONDITION-BASED ADJUSTMENTS =====

  private static async getCurrentConditions(): Promise<Record<string, any>> {
    const conditions: Record<string, any> = {};

    try {
      // Weather conditions
      if (this.weatherApiKey) {
        conditions.weather = await this.getWeatherConditions();
      }

      // Calendar events
      if (this.calendarIntegration) {
        conditions.calendar = await this.getUpcomingEvents();
      }

      // Sleep debt
      const sleepHistory = await SleepAnalysisService.getSleepHistory(7);
      conditions.sleep_debt = this.calculateCurrentSleepDebt(sleepHistory);

      // Time-based conditions
      const now = new Date();
      conditions.day_of_week = now.getDay();
      conditions.hour_of_day = now.getHours();
      conditions.is_weekend = now.getDay() === 0 || now.getDay() === 6;

      return conditions;
    } catch (_error) {
      console._error('Error getting current conditions:', _error);
      return {};
    }
  }

  private static async evaluateConditionAdjustment(
    conditionAdj: ConditionBasedAdjustment,
    conditions: Record<string, any>
  ): Promise<number> {
    const conditionValue = conditions[conditionAdj.type];
    if (conditionValue === undefined) return 0;

    let shouldAdjust = false;
    const { operator, value, threshold } = conditionAdj.condition;

    switch (operator) {
      case 'equals':
        shouldAdjust = conditionValue === value;
        break;
      case 'greater_than':
        shouldAdjust = conditionValue > (threshold || value);
        break;
      case 'less_than':
        shouldAdjust = conditionValue < (threshold || value);
        break;
      case 'contains':
        shouldAdjust = Array.isArray(conditionValue)
          ? conditionValue.includes(value)
          : String(conditionValue).includes(String(value));
        break;
    }

    if (shouldAdjust) {
      // Apply effectiveness weighting
      const adjustment =
        conditionAdj.adjustment.timeMinutes * conditionAdj.effectivenessScore;
      return Math.max(
        -conditionAdj.adjustment.maxAdjustment,
        Math.min(conditionAdj.adjustment.maxAdjustment, adjustment)
      );
    }

    return 0;
  }

  private static async calculateSleepPatternAdjustment(
    alarm: EnhancedSmartAlarm,
    sleepPattern: SleepPattern
  ): Promise<number> {
    // Predict optimal wake time based on recent sleep cycles
    const recommendation = await SleepAnalysisService.getSmartAlarmRecommendation(
      alarm as Alarm
    );

    if (!recommendation) return 0;

    const originalMinutes = this.timeStringToMinutes(alarm.time);
    const recommendedMinutes = this.timeStringToMinutes(recommendation.recommendedTime);

    const adjustment = recommendedMinutes - originalMinutes;

    // Limit adjustment based on wake window
    const maxWindow = alarm.dynamicWakeWindow
      ? this.calculateDynamicWakeWindow(alarm, sleepPattern)
      : alarm.wakeWindow;

    return Math.max(-maxWindow, Math.min(maxWindow, adjustment));
  }

  private static calculateDynamicWakeWindow(
    alarm: EnhancedSmartAlarm,
    sleepPattern: SleepPattern
  ): number {
    // Adjust wake window based on sleep consistency and user feedback
    const baseWindow = alarm.wakeWindow;
    const consistencyScore = sleepPattern.sleepEfficiency / 100;

    // More consistent sleep = larger window acceptable
    const consistencyFactor = 0.5 + consistencyScore * 0.5;

    // User feedback factor
    const feedbackFactor = this.calculateFeedbackFactor(alarm.wakeUpFeedback || []);

    return Math.round(baseWindow * consistencyFactor * feedbackFactor);
  }

  // ===== OPTIMAL TIME CALCULATION =====

  static async calculateOptimalTimeSlots(
    alarm: EnhancedSmartAlarm
  ): Promise<OptimalTimeSlot[]> {
    try {
      const sleepPattern = await SleepAnalysisService.analyzeSleepPatterns();
      if (!sleepPattern) return [];

      const originalTime = this.timeStringToMinutes(alarm.time);
      const windowStart = originalTime - alarm.wakeWindow;
      const windowEnd = originalTime + 10; // Small buffer after original

      const slots: OptimalTimeSlot[] = [];

      // Generate 5-minute intervals within the window
      for (let minutes = windowStart; minutes <= windowEnd; minutes += 5) {
        const timeString = this.minutesToTimeString(minutes);
        const sleepStages = await SleepAnalysisService.predictSleepStages(
          alarm as Alarm,
          sleepPattern
        );
        const stageAtTime = this.predictStageAtMinutes(sleepStages, minutes);

        // Calculate confidence based on sleep stage and other factors
        let confidence = 0.5;

        // Sleep stage scoring
        if (stageAtTime === 'light') confidence += 0.3;
        else if (stageAtTime === 'rem') confidence += 0.1;
        else confidence -= 0.2; // deep sleep is harder

        // Distance from original time (closer is better for consistency)
        const distanceFromOriginal = Math.abs(minutes - originalTime);
        confidence += Math.max(
          0,
          0.2 - (distanceFromOriginal / alarm.wakeWindow) * 0.2
        );

        // Apply user feedback learning
        confidence *= this.getTimePrefenceFactor(
          alarm.wakeUpFeedback || [],
          timeString
        );

        const factors = this.getOptimalityFactors(
          stageAtTime,
          distanceFromOriginal,
          confidence
        );

        slots.push({
          time: timeString,
          confidence: Math.max(0, Math.min(1, confidence)),
          sleepStage: stageAtTime,
          factors,
          adjustment: minutes - originalTime,
        });
      }

      // Sort by confidence and return top 5
      return slots.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    } catch (_error) {
      console._error('Error calculating optimal time slots:', _error);
      return [];
    }
  }

  // ===== USER FEEDBACK LEARNING =====

  static async recordWakeUpFeedback(
    alarmId: string,
    feedback: WakeUpFeedback
  ): Promise<void> {
    const alarm = (await this.getSmartAlarm(alarmId)) as EnhancedSmartAlarm;
    if (!alarm) return;

    // Add feedback to alarm
    const updatedFeedback = [...(alarm.wakeUpFeedback || []), feedback];

    // Update effectiveness scores for conditions that were active
    const updatedConditions = alarm.conditionBasedAdjustments?.map(condition => {
      if (
        condition.lastTriggered &&
        this.isSameDay(condition.lastTriggered, feedback.date)
      ) {
        // Calculate effectiveness based on feedback
        const effectiveness = this.calculateEffectiveness(feedback);
        condition.effectivenessScore = this.updateEffectivenesScore(
          condition.effectivenessScore,
          effectiveness,
          alarm.learningFactor
        );
      }
      return condition;
    });

    // Update adaptation history effectiveness
    const updatedHistory = alarm.adaptationHistory?.map(record => {
      if (this.isSameDay(record.date, feedback.date) && !record.effectiveness) {
        record.effectiveness = this.calculateEffectiveness(feedback);
      }
      return record;
    });

    await this.updateSmartAlarm(alarmId, {
      wakeUpFeedback: updatedFeedback,
      conditionBasedAdjustments: updatedConditions,
      adaptationHistory: updatedHistory,
    });
  }

  static async getSmartAlarmMetrics(
    alarmId: string
  ): Promise<SmartAlarmMetrics | null> {
    const alarm = (await this.getSmartAlarm(alarmId)) as EnhancedSmartAlarm;
    if (!alarm || !alarm.wakeUpFeedback) return null;

    const feedback = alarm.wakeUpFeedback;
    const recent30Days = feedback.filter(
      f => f.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recent30Days.length === 0) return null;

    // Calculate metrics
    const avgDifficulty = this.calculateAverageDifficulty(recent30Days);
    const sleepDebtTrend = this.calculateSleepDebtTrend(recent30Days);
    const adaptationSuccess = this.calculateAdaptationSuccess(alarm);
    const userSatisfaction = this.calculateUserSatisfaction(recent30Days);
    const mostEffective = this.getMostEffectiveConditions(alarm);
    const recommendations = await this.generateSmartRecommendations(
      alarm,
      recent30Days
    );

    return {
      averageWakeUpDifficulty: avgDifficulty,
      sleepDebtTrend,
      adaptationSuccess,
      userSatisfaction,
      mostEffectiveConditions: mostEffective,
      recommendedAdjustments: recommendations,
    };
  }

  // ===== UTILITY METHODS =====

  private static getDefaultConditions(): ConditionBasedAdjustment[] {
    return [
      {
        id: 'weather_rain',
        type: 'weather',
        isEnabled: true,
        priority: 3,
        condition: { operator: 'contains', value: 'rain' },
        adjustment: {
          timeMinutes: -10,
          maxAdjustment: 20,
          reason: 'Allow extra time for rainy weather commute',
        },
        effectivenessScore: 0.8,
      },
      {
        id: 'sleep_debt_high',
        type: 'sleep_debt',
        isEnabled: true,
        priority: 4,
        condition: { operator: 'greater_than', value: 60 }, // 1 hour debt
        adjustment: {
          timeMinutes: -15,
          maxAdjustment: 30,
          reason: 'Extra sleep to recover from sleep debt',
        },
        effectivenessScore: 0.7,
      },
      {
        id: 'weekend_relaxed',
        type: 'calendar',
        isEnabled: true,
        priority: 2,
        condition: { operator: 'equals', value: 'weekend' },
        adjustment: { timeMinutes: 30, maxAdjustment: 60, reason: 'Weekend lie-in' },
        effectivenessScore: 0.9,
      },
    ];
  }

  private static timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTimeString(totalMinutes: number): string {
    const adjustedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(adjustedMinutes / 60);
    const minutes = adjustedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private static adjustTimeByMinutes(timeStr: string, minutes: number): string {
    const totalMinutes = this.timeStringToMinutes(timeStr) + minutes;
    return this.minutesToTimeString(totalMinutes);
  }

  private static predictStageAtMinutes(
    sleepStages: Array<{ time: number; stage: 'light' | 'deep' | 'rem' }>,
    targetMinutes: number
  ): 'light' | 'deep' | 'rem' {
    const closestStage = sleepStages.reduce((closest, stage) => {
      const closestDistance = Math.abs(closest.time - targetMinutes);
      const stageDistance = Math.abs(stage.time - targetMinutes);
      return stageDistance < closestDistance ? stage : closest;
    });

    return closestStage ? closestStage.stage : 'light';
  }

  private static calculateAdjustmentConfidence(
    conditionAdjustment: number,
    sleepAdjustment: number
  ): number {
    // Higher confidence when both adjustments agree
    const agreement = Math.abs(conditionAdjustment - sleepAdjustment) < 10 ? 0.3 : 0;
    const magnitude = Math.min(
      Math.abs(conditionAdjustment + sleepAdjustment) / 30,
      0.3
    );
    return Math.min(0.5 + agreement + magnitude, 1.0);
  }

  private static calculateCurrentSleepDebt(sleepHistory: any[]): number {
    const last7Days = sleepHistory.slice(0, 7);
    const averageNeeded = 8 * 60; // 8 hours in minutes
    return last7Days.reduce((debt, session) => {
      return debt + Math.max(0, averageNeeded - session.sleepDuration);
    }, 0);
  }

  private static calculateFeedbackFactor(feedback: WakeUpFeedback[]): number {
    if (feedback.length === 0) return 1.0;

    const recent = feedback.slice(-10); // Last 10 feedback entries
    const avgDifficulty =
      recent.reduce((sum, f) => {
        const difficultyScore =
          ['very_easy', 'easy', 'normal', 'hard', 'very_hard'].indexOf(f.difficulty) +
          1;
        return sum + difficultyScore;
      }, 0) / recent.length;

    // Lower difficulty = allow larger window
    return 0.6 + (5 - avgDifficulty) * 0.1;
  }

  private static getOptimalityFactors(
    stage: string,
    distance: number,
    confidence: number
  ): string[] {
    const factors: string[] = [];

    if (stage === 'light') factors.push('Optimal sleep stage (light)');
    else if (stage === 'rem') factors.push('Good sleep stage (REM)');
    else factors.push('Suboptimal sleep stage (deep)');

    if (distance < 10) factors.push('Close to preferred time');
    if (confidence > 0.8) factors.push('High confidence based on patterns');

    return factors;
  }

  private static getTimePrefenceFactor(
    feedback: WakeUpFeedback[],
    timeString: string
  ): number {
    const timeMinutes = this.timeStringToMinutes(timeString);
    let factor = 1.0;

    for (const f of feedback.slice(-5)) {
      // Last 5 feedback entries
      const actualMinutes = this.timeStringToMinutes(f.actualWakeTime);
      const distance = Math.abs(timeMinutes - actualMinutes);

      if (distance < 15) {
        // Within 15 minutes
        const satisfaction =
          ['terrible', 'tired', 'okay', 'good', 'excellent'].indexOf(f.feeling) / 4;
        factor *= 0.7 + satisfaction * 0.3;
      }
    }

    return factor;
  }

  private static calculateEffectiveness(feedback: WakeUpFeedback): number {
    const difficultyScore =
      (5 -
        ['very_easy', 'easy', 'normal', 'hard', 'very_hard'].indexOf(
          feedback.difficulty
        )) /
      5;
    const feelingScore =
      ['terrible', 'tired', 'okay', 'good', 'excellent'].indexOf(feedback.feeling) / 4;
    const qualityScore = feedback.sleepQuality / 10;

    return (difficultyScore + feelingScore + qualityScore) / 3;
  }

  private static updateEffectivenesScore(
    current: number,
    newScore: number,
    learningFactor: number
  ): number {
    return current * (1 - learningFactor) + newScore * learningFactor;
  }

  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private static calculateAverageDifficulty(feedback: WakeUpFeedback[]): number {
    const difficulties = feedback.map(
      f =>
        ['very_easy', 'easy', 'normal', 'hard', 'very_hard'].indexOf(f.difficulty) + 1
    );
    return difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
  }

  private static calculateSleepDebtTrend(feedback: WakeUpFeedback[]): number[] {
    // Return trend over last 7 days
    return feedback.slice(-7).map(f => f.sleepQuality);
  }

  private static calculateAdaptationSuccess(alarm: EnhancedSmartAlarm): number {
    const adaptations =
      alarm.adaptationHistory?.filter(a => a.effectiveness !== undefined) || [];
    if (adaptations.length === 0) return 0.5;

    const avgEffectiveness =
      adaptations.reduce((sum, a) => sum + (a.effectiveness || 0.5), 0) /
      adaptations.length;
    return avgEffectiveness;
  }

  private static calculateUserSatisfaction(feedback: WakeUpFeedback[]): number {
    const feelings = feedback.map(f =>
      ['terrible', 'tired', 'okay', 'good', 'excellent'].indexOf(f.feeling)
    );
    return feelings.reduce((sum, f) => sum + f, 0) / feelings.length / 4; // Normalize to 0-1
  }

  private static getMostEffectiveConditions(alarm: EnhancedSmartAlarm): string[] {
    const conditions = alarm.conditionBasedAdjustments || [];
    return conditions
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 3)
      .map(c => c.type);
  }

  private static async generateSmartRecommendations(
    alarm: EnhancedSmartAlarm,
    feedback: WakeUpFeedback[]
  ): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];

    // Analyze wake up difficulty
    const avgDifficulty = this.calculateAverageDifficulty(feedback);
    if (avgDifficulty > 3.5) {
      // Hard to wake up
      recommendations.push({
        type: 'time_adjustment',
        description:
          'Consider moving your alarm 15-20 minutes earlier to align with lighter sleep phases',
        impact: 'medium',
        confidence: 0.7,
        action: { type: 'adjust_wake_window', value: alarm.wakeWindow + 10 },
      });
    }

    // Analyze user satisfaction
    const satisfaction = this.calculateUserSatisfaction(feedback);
    if (satisfaction < 0.4) {
      // Low satisfaction
      recommendations.push({
        type: 'sleep_goal_update',
        description:
          'Your sleep goals may need adjustment. Consider going to bed 30 minutes earlier',
        impact: 'high',
        confidence: 0.8,
        action: { type: 'adjust_bedtime', value: -30 },
      });
    }

    return recommendations;
  }

  private static async getWeatherConditions(): Promise<any> {
    // Implement weather API integration
    return { condition: 'clear', temperature: 20 };
  }

  private static async getUpcomingEvents(): Promise<any[]> {
    // Implement calendar integration
    return [];
  }
}

export default EnhancedSmartAlarmScheduler;
