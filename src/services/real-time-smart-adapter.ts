/// <reference types="node" />
import {
  EnhancedSmartAlarmScheduler,
  type EnhancedSmartAlarm,
} from "./enhanced-smart-alarm-scheduler";
import { SleepAnalysisService } from "./sleep-analysis";
import { AlarmService } from "./alarm";

export interface RealTimeAdaptationConfig {
  enabled: boolean;
  adaptationInterval: number; // minutes
  maxDailyAdaptations: number;
  minConfidenceThreshold: number;
  emergencyOverrideEnabled: boolean;
}

export interface AdaptationTrigger {
  type: 'sleep_pattern_change' | 'external_condition' | 'user_behavior' | 'calendar_event' | 'emergency';
  priority: number;
  confidence: number;
  suggestedAdjustment: number; // minutes
  reason: string;
  data: any;
}

export interface SmartAlarmStatus {
  isActive: boolean;
  nextTriggerTime: Date;
  currentAdjustment: number;
  adaptationCount: number;
  lastAdaptation: Date | null;
  confidence: number;
  factors: string[];
}

export class RealTimeSmartAdapter {
  private static instance: RealTimeSmartAdapter;
  private static config: RealTimeAdaptationConfig = {
    enabled: true,
    adaptationInterval: 15, // Check every 15 minutes
    maxDailyAdaptations: 5,
    minConfidenceThreshold: 0.6,
    emergencyOverrideEnabled: true
  };

  private static adaptationIntervals = new Map<string, NodeJS.Timeout>();
  private static alarmStatuses = new Map<string, SmartAlarmStatus>();
  private static isInitialized = false;

  // ===== INITIALIZATION =====

  static getInstance(): RealTimeSmartAdapter {
    if (!this.instance) {
      this.instance = new RealTimeSmartAdapter();
    }
    return this.instance;
  }

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing Real-Time Smart Adapter');

    // Start monitoring active smart alarms
    await this.startMonitoring();

    // Set up periodic checks
    this.setupPeriodicChecks();

    this.isInitialized = true;
    console.log('Real-Time Smart Adapter initialized');
  }

  static async shutdown(): Promise<void> {
    console.log('Shutting down Real-Time Smart Adapter');

    // Clear all intervals
    for (const [alarmId, interval] of this.adaptationIntervals) {
      clearInterval(interval);
    }

    this.adaptationIntervals.clear();
    this.alarmStatuses.clear();
    this.isInitialized = false;
  }

  // ===== MONITORING CONTROL =====

  static async startMonitoringAlarm(alarm: EnhancedSmartAlarm): Promise<void> {
    if (!alarm.realTimeAdaptation || !this.config.enabled) return;

    console.log(`Starting real-time monitoring for alarm ${alarm.id}`);

    // Initialize status
    this.alarmStatuses.set(alarm.id, {
      isActive: true,
      nextTriggerTime: this.calculateNextTriggerTime(alarm),
      currentAdjustment: 0,
      adaptationCount: 0,
      lastAdaptation: null,
      confidence: 0.5,
      factors: []
    });

    // Set up adaptation interval
    const interval = setInterval(async () => {
      await this.checkForAdaptation(alarm.id);
    }, this.config.adaptationInterval * 60 * 1000);

    this.adaptationIntervals.set(alarm.id, interval);
  }

  static stopMonitoringAlarm(alarmId: string): void {
    console.log(`Stopping real-time monitoring for alarm ${alarmId}`);

    const interval = this.adaptationIntervals.get(alarmId);
    if (interval) {
      clearInterval(interval);
      this.adaptationIntervals.delete(alarmId);
    }

    this.alarmStatuses.delete(alarmId);
  }

  static async startMonitoring(): Promise<void> {
    try {
      // Get all active smart alarms
      const alarms = await EnhancedSmartAlarmScheduler.getAllSmartAlarms() as EnhancedSmartAlarm[];

      for (const alarm of alarms) {
        if (alarm.enabled && alarm.realTimeAdaptation) {
          await this.startMonitoringAlarm(alarm);
        }
      }
    } catch (error) {
      console.error('Error starting alarm monitoring:', error);
    }
  }

  // ===== ADAPTATION LOGIC =====

  private static async checkForAdaptation(alarmId: string): Promise<void> {
    try {
      const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId) as EnhancedSmartAlarm;
      if (!alarm || !alarm.enabled || !alarm.realTimeAdaptation) {
        this.stopMonitoringAlarm(alarmId);
        return;
      }

      const status = this.alarmStatuses.get(alarmId);
      if (!status || !this.shouldCheckForAdaptation(alarm, status)) {
        return;
      }

      // Collect adaptation triggers
      const triggers = await this.collectAdaptationTriggers(alarm);

      if (triggers.length === 0) {
        return;
      }

      // Evaluate triggers and determine if adaptation is needed
      const adaptationDecision = await this.evaluateAdaptation(alarm, triggers);

      if (adaptationDecision.shouldAdapt) {
        await this.performAdaptation(alarm, adaptationDecision);
      }

    } catch (error) {
      console.error(`Error checking adaptation for alarm ${alarmId}:`, error);
    }
  }

  private static shouldCheckForAdaptation(alarm: EnhancedSmartAlarm, status: SmartAlarmStatus): boolean {
    // Check if we've hit daily adaptation limit
    if (status.adaptationCount >= this.config.maxDailyAdaptations) {
      return false;
    }

    // Check if enough time has passed since last adaptation
    if (status.lastAdaptation) {
      const timeSinceLastAdaptation = Date.now() - status.lastAdaptation.getTime();
      const minInterval = this.config.adaptationInterval * 60 * 1000; // Convert to ms
      if (timeSinceLastAdaptation < minInterval) {
        return false;
      }
    }

    // Check if alarm is soon (within next 2 hours)
    const nextAlarmTime = this.calculateNextAlarmTime(alarm);
    const timeUntilAlarm = nextAlarmTime.getTime() - Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    return timeUntilAlarm <= twoHours && timeUntilAlarm > 0;
  }

  private static async collectAdaptationTriggers(alarm: EnhancedSmartAlarm): Promise<AdaptationTrigger[]> {
    const triggers: AdaptationTrigger[] = [];

    try {
      // 1. Sleep pattern changes
      const sleepPatternTrigger = await this.checkSleepPatternTrigger(alarm);
      if (sleepPatternTrigger) triggers.push(sleepPatternTrigger);

      // 2. External conditions (weather, calendar, etc.)
      const conditionTriggers = await this.checkConditionTriggers(alarm);
      triggers.push(...conditionTriggers);

      // 3. User behavior patterns
      const behaviorTrigger = await this.checkUserBehaviorTrigger(alarm);
      if (behaviorTrigger) triggers.push(behaviorTrigger);

      // 4. Emergency conditions
      if (this.config.emergencyOverrideEnabled) {
        const emergencyTrigger = await this.checkEmergencyTrigger(alarm);
        if (emergencyTrigger) triggers.push(emergencyTrigger);
      }

    } catch (error) {
      console.error('Error collecting adaptation triggers:', error);
    }

    return triggers;
  }

  private static async checkSleepPatternTrigger(alarm: EnhancedSmartAlarm): Promise<AdaptationTrigger | null> {
    try {
      // Get updated sleep pattern
      const currentPattern = await SleepAnalysisService.analyzeSleepPatterns();
      if (!currentPattern) return null;

      // Check if there's been a significant change in sleep pattern
      const recommendation = await SleepAnalysisService.getSmartAlarmRecommendation(alarm);
      if (!recommendation) return null;

      const currentTime = this.timeToMinutes(alarm.time);
      const recommendedTime = this.timeToMinutes(recommendation.recommendedTime);
      const adjustment = recommendedTime - currentTime;

      // Only trigger if adjustment is significant and confidence is high
      if (Math.abs(adjustment) >= 10 && recommendation.confidence >= 0.7) {
        return {
          type: 'sleep_pattern_change',
          priority: 8,
          confidence: recommendation.confidence,
          suggestedAdjustment: adjustment,
          reason: `Sleep pattern analysis suggests ${Math.abs(adjustment)} minute ${adjustment > 0 ? 'delay' : 'advance'}: ${recommendation.reason}`,
          data: { recommendation, pattern: currentPattern }
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking sleep pattern trigger:', error);
      return null;
    }
  }

  private static async checkConditionTriggers(alarm: EnhancedSmartAlarm): Promise<AdaptationTrigger[]> {
    const triggers: AdaptationTrigger[] = [];

    if (!alarm.conditionBasedAdjustments) return triggers;

    try {
      // Get current conditions (weather, calendar, etc.)
      const conditions = await this.getCurrentConditions();

      for (const conditionAdj of alarm.conditionBasedAdjustments.filter(c => c.isEnabled)) {
        const conditionValue = conditions[conditionAdj.type];
        if (conditionValue === undefined) continue;

        const shouldTrigger = this.evaluateCondition(conditionAdj.condition, conditionValue);

        if (shouldTrigger) {
          const effectiveAdjustment = conditionAdj.adjustment.timeMinutes * conditionAdj.effectivenessScore;

          triggers.push({
            type: 'external_condition',
            priority: conditionAdj.priority,
            confidence: conditionAdj.effectivenessScore,
            suggestedAdjustment: effectiveAdjustment,
            reason: `${conditionAdj.type} condition met: ${conditionAdj.adjustment.reason}`,
            data: { condition: conditionAdj, currentValue: conditionValue }
          });
        }
      }
    } catch (error) {
      console.error('Error checking condition triggers:', error);
    }

    return triggers;
  }

  private static async checkUserBehaviorTrigger(alarm: EnhancedSmartAlarm): Promise<AdaptationTrigger | null> {
    try {
      // Analyze recent user behavior patterns
      const recentFeedback = alarm.wakeUpFeedback?.slice(-5) || [];

      if (recentFeedback.length < 3) return null; // Not enough data

      // Check for consistent difficulty patterns
      const difficulties = recentFeedback.map(f =>
        ['very_easy', 'easy', 'normal', 'hard', 'very_hard'].indexOf(f.difficulty)
      );

      const avgDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;

      // If consistently hard to wake up, suggest earlier time
      if (avgDifficulty >= 3.5) {
        return {
          type: 'user_behavior',
          priority: 6,
          confidence: 0.7,
          suggestedAdjustment: -15, // 15 minutes earlier
          reason: 'Recent feedback indicates consistent difficulty waking up',
          data: { avgDifficulty, recentFeedback: recentFeedback.length }
        };
      }

      // If consistently easy to wake up, suggest optimizing for sleep quality
      if (avgDifficulty <= 1.5) {
        return {
          type: 'user_behavior',
          priority: 4,
          confidence: 0.6,
          suggestedAdjustment: 10, // 10 minutes later for more sleep
          reason: 'Recent feedback indicates easy wake-ups - optimizing for more sleep',
          data: { avgDifficulty, recentFeedback: recentFeedback.length }
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking user behavior trigger:', error);
      return null;
    }
  }

  private static async checkEmergencyTrigger(alarm: EnhancedSmartAlarm): Promise<AdaptationTrigger | null> {
    try {
      // Check for emergency conditions (severe weather, traffic, etc.)
      const conditions = await this.getCurrentConditions();

      // Severe weather conditions
      if (conditions.weather?.severity === 'severe') {
        return {
          type: 'emergency',
          priority: 10,
          confidence: 0.9,
          suggestedAdjustment: -30, // 30 minutes earlier
          reason: 'Severe weather conditions detected - allowing extra time',
          data: { weatherCondition: conditions.weather }
        };
      }

      // Major traffic disruptions
      if (conditions.traffic?.severity === 'major') {
        return {
          type: 'emergency',
          priority: 9,
          confidence: 0.85,
          suggestedAdjustment: -20, // 20 minutes earlier
          reason: 'Major traffic disruptions detected',
          data: { trafficCondition: conditions.traffic }
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking emergency trigger:', error);
      return null;
    }
  }

  private static async evaluateAdaptation(
    alarm: EnhancedSmartAlarm,
    triggers: AdaptationTrigger[]
  ): Promise<{ shouldAdapt: boolean; adjustment: number; reasons: string[]; confidence: number }> {

    if (triggers.length === 0) {
      return { shouldAdapt: false, adjustment: 0, reasons: [], confidence: 0 };
    }

    // Sort triggers by priority
    const sortedTriggers = triggers.sort((a, b) => b.priority - a.priority);

    // Calculate weighted adjustment
    let totalWeight = 0;
    let weightedAdjustment = 0;
    let avgConfidence = 0;
    const reasons: string[] = [];

    for (const trigger of sortedTriggers) {
      const weight = trigger.priority * trigger.confidence;
      totalWeight += weight;
      weightedAdjustment += trigger.suggestedAdjustment * weight;
      avgConfidence += trigger.confidence;
      reasons.push(trigger.reason);
    }

    if (totalWeight === 0) {
      return { shouldAdapt: false, adjustment: 0, reasons: [], confidence: 0 };
    }

    const finalAdjustment = Math.round(weightedAdjustment / totalWeight);
    const finalConfidence = avgConfidence / triggers.length;

    // Check if adjustment meets minimum threshold
    const shouldAdapt = Math.abs(finalAdjustment) >= 5 && finalConfidence >= this.config.minConfidenceThreshold;

    return {
      shouldAdapt,
      adjustment: finalAdjustment,
      reasons,
      confidence: finalConfidence
    };
  }

  private static async performAdaptation(
    alarm: EnhancedSmartAlarm,
    decision: { adjustment: number; reasons: string[]; confidence: number }
  ): Promise<void> {
    try {
      console.log(`Adapting alarm ${alarm.id} by ${decision.adjustment} minutes`);

      // Apply the adjustment
      const updatedAlarm = await EnhancedSmartAlarmScheduler.updateSmartScheduleRealTime(alarm.id);

      if (updatedAlarm) {
        // Update status
        const status = this.alarmStatuses.get(alarm.id);
        if (status) {
          status.currentAdjustment += decision.adjustment;
          status.adaptationCount += 1;
          status.lastAdaptation = new Date();
          status.confidence = decision.confidence;
          status.factors = decision.reasons;
        }

        // Notify user of adaptation (optional)
        await this.notifyUserOfAdaptation(alarm, decision);
      }

    } catch (error) {
      console.error(`Error performing adaptation for alarm ${alarm.id}:`, error);
    }
  }

  // ===== UTILITY METHODS =====

  private static setupPeriodicChecks(): void {
    // Check for new alarms every 5 minutes
    setInterval(async () => {
      await this.startMonitoring();
    }, 5 * 60 * 1000);
  }

  private static calculateNextTriggerTime(alarm: EnhancedSmartAlarm): Date {
    // Calculate next alarm occurrence
    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const nextAlarm = new Date();
    nextAlarm.setHours(hours, minutes, 0, 0);

    if (nextAlarm <= now) {
      nextAlarm.setDate(nextAlarm.getDate() + 1);
    }

    return nextAlarm;
  }

  private static calculateNextAlarmTime(alarm: EnhancedSmartAlarm): Date {
    return this.calculateNextTriggerTime(alarm);
  }

  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static async getCurrentConditions(): Promise<Record<string, any>> {
    // This would integrate with actual APIs
    return {
      weather: { condition: 'clear', severity: 'normal' },
      traffic: { condition: 'normal', severity: 'normal' },
      calendar: { hasEarlyMeeting: false },
      time: new Date()
    };
  }

  private static evaluateCondition(condition: any, value: any): boolean {
    const { operator, value: conditionValue, threshold } = condition;

    switch (operator) {
      case 'equals':
        return value === conditionValue;
      case 'greater_than':
        return value > (threshold || conditionValue);
      case 'less_than':
        return value < (threshold || conditionValue);
      case 'contains':
        return Array.isArray(value) ?
          value.includes(conditionValue) :
          String(value).includes(String(conditionValue));
      default:
        return false;
    }
  }

  private static async notifyUserOfAdaptation(
    alarm: EnhancedSmartAlarm,
    decision: { adjustment: number; reasons: string[] }
  ): Promise<void> {
    // Optional: Send push notification about adaptation
    console.log(`Alarm adapted: ${decision.adjustment} minutes. Reasons: ${decision.reasons.join(', ')}`);
  }

  // ===== PUBLIC API =====

  static getAlarmStatus(alarmId: string): SmartAlarmStatus | null {
    return this.alarmStatuses.get(alarmId) || null;
  }

  static getAllAlarmStatuses(): Map<string, SmartAlarmStatus> {
    return new Map(this.alarmStatuses);
  }

  static async updateConfig(newConfig: Partial<RealTimeAdaptationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    if (!newConfig.enabled) {
      // Stop all monitoring if disabled
      for (const [alarmId] of this.adaptationIntervals) {
        this.stopMonitoringAlarm(alarmId);
      }
    } else if (newConfig.enabled && this.adaptationIntervals.size === 0) {
      // Restart monitoring if enabled
      await this.startMonitoring();
    }
  }
}

export default RealTimeSmartAdapter;