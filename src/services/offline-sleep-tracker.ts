/// <reference types="node" />
/// <reference lib="dom" />
// Offline Sleep Tracking Service for Relife App
// Comprehensive sleep data collection and analysis when offline

import { ErrorHandler } from './error-handler';
import SecurityService from './security';
import { TimeoutHandle } from '../types/timers';

interface SleepSession {
  id: string;
  userId: string;
  startTime: string; // ISO date string
  endTime?: string; // ISO date string
  duration?: number; // minutes
  quality: number; // 1-10 scale
  stages: SleepStage[];
  interruptions: SleepInterruption[];
  environment: SleepEnvironment;
  wakeMethod: 'natural' | 'alarm' | 'disturbance';
  mood: 'refreshed' | 'tired' | 'groggy' | 'energetic';
  notes?: string;
  createdAt: string;
  synced: boolean;
}

interface SleepStage {
  type: 'awake' | 'light' | 'deep' | 'rem';
  startTime: string;
  duration: number; // minutes
  confidence: number; // 0-1, AI confidence in detection
}

interface SleepInterruption {
  time: string;
  type: 'noise' | 'movement' | 'light' | 'temperature' | 'other';
  severity: number; // 1-5 scale
  duration: number; // minutes
  description?: string;
}

interface SleepEnvironment {
  temperature?: number; // Celsius
  humidity?: number; // percentage
  lightLevel?: number; // lux
  noiseLevel?: number; // decibels
  roomConditions: 'poor' | 'fair' | 'good' | 'excellent';
  bedtimeRoutine: string[];
}

interface SleepGoal {
  id: string;
  type:
    | 'bedtime_consistency'
    | 'sleep_duration'
    | 'wake_consistency'
    | 'sleep_quality'
    | 'routine_completion';
  target: number;
  current: number;
  progress: number; // percentage
  streak: number;
  lastAchieved?: string;
  active: boolean;
}

interface SleepInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions?: string[];
  createdAt: string;
  dismissed?: boolean;
}

interface SleepAnalytics {
  weeklyAverage: number; // hours
  weeklyQuality: number; // 1-10
  bedtimeConsistency: number; // percentage
  wakeTimeConsistency: number; // percentage
  deepSleepPercentage: number;
  remSleepPercentage: number;
  interruptionRate: number; // per night
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastCalculated: string;
}

export class OfflineSleepTracker {
  private static instance: OfflineSleepTracker;
  private readonly STORAGE_KEYS = {
    SLEEP_SESSIONS: 'relife-sleep-sessions',
    SLEEP_GOALS: 'relife-sleep-goals',
    SLEEP_INSIGHTS: 'relife-sleep-insights',
    SLEEP_ANALYTICS: 'relife-sleep-analytics',
    CURRENT_SESSION: 'relife-current-sleep-session',
  };

  private sleepSessions: SleepSession[] = [];
  private sleepGoals: SleepGoal[] = [];
  private sleepInsights: SleepInsight[] = [];
  private sleepAnalytics: SleepAnalytics | null = null;
  private currentSession: SleepSession | null = null;
  private isOnline = navigator.onLine;
  private trackingTimer?: number;

  private constructor() {
    this.loadFromStorage();
    this.setupEventListeners();
    this.initializeDefaultGoals();
  }

  static getInstance(): OfflineSleepTracker {
    if (!OfflineSleepTracker.instance) {
      OfflineSleepTracker.instance = new OfflineSleepTracker();
    }
    return OfflineSleepTracker.instance;
  }

  // ==================== INITIALIZATION ====================

  private async loadFromStorage(): Promise<void> {
    try {
      const sessions = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.SLEEP_SESSIONS
      );
      if (sessions && Array.isArray(sessions)) {
        this.sleepSessions = sessions;
      }

      const goals = SecurityService.secureStorageGet(this.STORAGE_KEYS.SLEEP_GOALS);
      if (goals && Array.isArray(goals)) {
        this.sleepGoals = goals;
      }

      const insights = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.SLEEP_INSIGHTS
      );
      if (insights && Array.isArray(insights)) {
        this.sleepInsights = insights;
      }

      const analytics = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.SLEEP_ANALYTICS
      );
      if (analytics) {
        this.sleepAnalytics = analytics;
      }

      const currentSession = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.CURRENT_SESSION
      );
      if (currentSession) {
        this.currentSession = currentSession;
        // Resume tracking if we have an active session
        this.resumeTracking();
      }

      console.log(
        '[OfflineSleepTracker] Loaded',
        this.sleepSessions.length,
        'sleep sessions'
      );
    } catch (error) {
      console.error('[OfflineSleepTracker] Failed to load from storage:', error);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'SLEEP_SYNC_COMPLETE') {
          this.handleSyncComplete(event.data);
        }
      });
    }
  }

  private initializeDefaultGoals(): void {
    if (this.sleepGoals.length === 0) {
      const defaultGoals: SleepGoal[] = [
        {
          id: 'bedtime_consistency',
          type: 'bedtime_consistency',
          target: 85, // 85% consistency
          current: 0,
          progress: 0,
          streak: 0,
          active: true,
        },
        {
          id: 'sleep_duration',
          type: 'sleep_duration',
          target: 8, // 8 hours
          current: 0,
          progress: 0,
          streak: 0,
          active: true,
        },
        {
          id: 'sleep_quality',
          type: 'sleep_quality',
          target: 7, // 7/10 quality score
          current: 0,
          progress: 0,
          streak: 0,
          active: true,
        },
      ];

      this.sleepGoals = defaultGoals;
      this.saveToStorage();
    }
  }

  // ==================== SLEEP TRACKING ====================

  async startSleepTracking(
    userId: string,
    environment?: Partial<SleepEnvironment>
  ): Promise<string> {
    try {
      // End any existing session first
      if (this.currentSession) {
        await this.endSleepTracking();
      }

      const session: SleepSession = {
        id: `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        startTime: new Date().toISOString(),
        quality: 5, // Default middle score
        stages: [],
        interruptions: [],
        environment: {
          roomConditions: 'fair',
          bedtimeRoutine: [],
          ...environment,
        },
        wakeMethod: 'natural',
        mood: 'tired',
        createdAt: new Date().toISOString(),
        synced: false,
      };

      this.currentSession = session;
      await this.saveCurrentSession();

      // Start monitoring sleep stages
      this.startStageTracking();

      console.log('[OfflineSleepTracker] Started sleep tracking:', session.id);
      return session.id;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to start sleep tracking', {
        context: 'OfflineSleepTracker.startSleepTracking',
      });
      throw error;
    }
  }

  async endSleepTracking(
    wakeMethod: SleepSession['wakeMethod'] = 'natural',
    mood: SleepSession['mood'] = 'refreshed',
    quality?: number,
    notes?: string
  ): Promise<SleepSession | null> {
    try {
      if (!this.currentSession) {
        console.warn('[OfflineSleepTracker] No active sleep session to end');
        return null;
      }

      const endTime = new Date().toISOString();
      const startTime = new Date(this.currentSession.startTime);
      const duration = Math.round(
        (new Date(endTime).getTime() - startTime.getTime()) / (1000 * 60)
      );

      // Complete the session
      this.currentSession.endTime = endTime;
      this.currentSession.duration = duration;
      this.currentSession.wakeMethod = wakeMethod;
      this.currentSession.mood = mood;
      this.currentSession.quality =
        quality || this.calculateSleepQuality(this.currentSession);
      this.currentSession.notes = notes;

      // Stop stage tracking
      this.stopStageTracking();

      // Add to sessions list
      this.sleepSessions.unshift({ ...this.currentSession });

      // Update goals and analytics
      await this.updateGoalsProgress(this.currentSession);
      await this.updateSleepAnalytics();
      await this.generateInsights();

      // Save and clear current session
      const completedSession = { ...this.currentSession };
      this.currentSession = null;

      await this.saveToStorage();
      await this.saveCurrentSession();

      // Queue for sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'QUEUE_SLEEP_DATA',
          data: { session: completedSession },
        });
      }

      console.log(
        '[OfflineSleepTracker] Ended sleep tracking:',
        completedSession.id,
        'Duration:',
        duration,
        'minutes'
      );
      return completedSession;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to end sleep tracking', {
        context: 'OfflineSleepTracker.endSleepTracking',
      });
      return null;
    }
  }

  async recordInterruption(
    type: SleepInterruption['type'],
    severity: number,
    description?: string
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const interruption: SleepInterruption = {
      time: new Date().toISOString(),
      type,
      severity,
      duration: 1, // Will be updated when interruption ends
      description,
    };

    this.currentSession.interruptions.push(interruption);
    await this.saveCurrentSession();

    console.log('[OfflineSleepTracker] Recorded sleep interruption:', type, severity);
  }

  // ==================== SLEEP STAGE TRACKING ====================

  private startStageTracking(): void {
    if (!this.currentSession) return;

    // Initialize with awake stage
    const awakeStage: SleepStage = {
      type: 'awake',
      startTime: this.currentSession.startTime,
      duration: 0,
      confidence: 1.0,
    };

    this.currentSession.stages.push(awakeStage);

    // Start monitoring timer (simplified simulation)
    this.trackingTimer = setInterval((
) => {
      this.simulateSleepStageDetection();
    }, 60000); // Check every minute
  }

  private stopStageTracking(): void {
    if (this.trackingTimer) {
      clearInterval(this.trackingTimer);
      this.trackingTimer = undefined;
    }
  }

  private resumeTracking(): void {
    if (this.currentSession && !this.trackingTimer) {
      console.log(
        '[OfflineSleepTracker] Resuming sleep tracking for session:',
        this.currentSession.id
      );
      this.startStageTracking();
    }
  }

  private simulateSleepStageDetection(): void {
    if (!this.currentSession || this.currentSession.stages.length === 0) return;

    const currentStage =
      this.currentSession.stages[this.currentSession.stages.length - 1];
    const sessionDuration =
      Date.now() - new Date(this.currentSession.startTime).getTime();
    const sessionMinutes = sessionDuration / (1000 * 60);

    // Update current stage duration
    currentStage.duration = Math.round(
      sessionMinutes -
        this.currentSession.stages
          .slice(0, -1)
          .reduce((sum, stage
) => sum + stage.duration, 0)
    );

    // Simple sleep stage progression simulation
    let nextStageType = currentStage.type;

    if (sessionMinutes > 15 && currentStage.type === 'awake') {
      nextStageType = 'light';
    } else if (
      sessionMinutes > 45 &&
      currentStage.type === 'light' &&
      currentStage.duration > 20
    ) {
      nextStageType = 'deep';
    } else if (
      sessionMinutes > 90 &&
      currentStage.type === 'deep' &&
      currentStage.duration > 30
    ) {
      nextStageType = 'rem';
    } else if (
      sessionMinutes > 120 &&
      currentStage.type === 'rem' &&
      currentStage.duration > 20
    ) {
      nextStageType = Math.random() > 0.5 ? 'light' : 'deep';
    }

    // Add new stage if type changed
    if (nextStageType !== currentStage.type && currentStage.duration >= 5) {
      // Minimum 5 minutes per stage
      const newStage: SleepStage = {
        type: nextStageType,
        startTime: new Date().toISOString(),
        duration: 0,
        confidence: 0.8 + Math.random() * 0.2, // 80-100% confidence
      };

      this.currentSession.stages.push(newStage);
      this.saveCurrentSession();
    }
  }

  // ==================== ANALYTICS AND INSIGHTS ====================

  private calculateSleepQuality(session: SleepSession): number {
    let score = 5; // Base score

    // Duration factor (7-9 hours is optimal)
    if (session.duration) {
      const hours = session.duration / 60;
      if (hours >= 7 && hours <= 9) {
        score += 2;
      } else if (hours >= 6 && hours <= 10) {
        score += 1;
      } else {
        score -= 1;
      }
    }

    // Interruption factor
    const interruptionPenalty = Math.min(session.interruptions.length * 0.5, 3);
    score -= interruptionPenalty;

    // Deep sleep factor
    const deepSleepMinutes = session.stages
      .filter(stage => stage.type === 'deep')
      .reduce((sum, stage
) => sum + stage.duration, 0);

    if (session.duration && deepSleepMinutes > session.duration * 0.15) {
      // More than 15% deep sleep
      score += 1;
    }

    // REM sleep factor
    const remSleepMinutes = session.stages
      .filter(stage => stage.type === 'rem')
      .reduce((sum, stage
) => sum + stage.duration, 0);

    if (session.duration && remSleepMinutes > session.duration * 0.2) {
      // More than 20% REM sleep
      score += 1;
    }

    return Math.max(1, Math.min(10, Math.round(score)));
  }

  private async updateGoalsProgress(session: SleepSession): Promise<void> {
    try {
      const bedtime = new Date(session.startTime);
      const duration = (session.duration || 0) / 60; // Convert to hours

      for (const goal of this.sleepGoals) {
        if (!goal.active) continue;

        let progress = false;

        switch (goal.type) {
          case 'sleep_duration':
            progress = duration >= goal.target * 0.9; // Within 90% of target
            goal.current = duration;
            break;

          case 'sleep_quality':
            progress = session.quality >= goal.target;
            goal.current = session.quality;
            break;

          case 'bedtime_consistency':
            // Check if bedtime is within 30 minutes of average bedtime
            const recentSessions = this.sleepSessions.slice(0, 7); // Last 7 sessions
            if (recentSessions.length > 0) {
              const avgBedtime = this.calculateAverageBedtime(recentSessions);
              const bedtimeHour = bedtime.getHours() + bedtime.getMinutes() / 60;
              progress = Math.abs(bedtimeHour - avgBedtime) <= 0.5; // Within 30 minutes
            }
            break;
        }

        if (progress) {
          goal.streak++;
          goal.lastAchieved = session.createdAt;
        } else {
          goal.streak = 0;
        }

        // Calculate overall progress (simplified)
        goal.progress = Math.min(100, (goal.streak / 7) * 100); // 7-day streak = 100%
      }

      await this.saveToStorage();
    } catch (error) {
      console.error('[OfflineSleepTracker] Failed to update goals progress:', error);
    }
  }

  private calculateAverageBedtime(sessions: SleepSession[]): number {
    const bedtimes = sessions.map(session => {
      const bedtime = new Date(session.startTime);
      return bedtime.getHours() + bedtime.getMinutes() / 60;
    });

    return bedtimes.reduce((sum, time
) => sum + time, 0) / bedtimes.length;
  }

  private async updateSleepAnalytics(): Promise<void> {
    try {
      const recentSessions = this.sleepSessions.slice(0, 7); // Last 7 sessions

      if (recentSessions.length === 0) {
        return;
      }

      const weeklyDurations = recentSessions.map(s => (s.duration || 0) / 60);
      const weeklyQualities = recentSessions.map(s => s.quality);

      this.sleepAnalytics = {
        weeklyAverage:
          weeklyDurations.reduce((sum, dur
) => sum + dur, 0) / weeklyDurations.length,
        weeklyQuality:
          weeklyQualities.reduce((sum, qual
) => sum + qual, 0) / weeklyQualities.length,
        bedtimeConsistency: this.calculateBedtimeConsistency(recentSessions),
        wakeTimeConsistency: this.calculateWakeTimeConsistency(recentSessions),
        deepSleepPercentage: this.calculateDeepSleepPercentage(recentSessions),
        remSleepPercentage: this.calculateRemSleepPercentage(recentSessions),
        interruptionRate:
          recentSessions.reduce((sum, s
) => sum + s.interruptions.length, 0) /
          recentSessions.length,
        improvementTrend: this.calculateImprovementTrend(recentSessions),
        lastCalculated: new Date().toISOString(),
      };

      await this.saveToStorage();
    } catch (error) {
      console.error('[OfflineSleepTracker] Failed to update sleep analytics:', error);
    }
  }

  private calculateBedtimeConsistency(sessions: SleepSession[]): number {
    if (sessions.length < 2) return 0;

    const bedtimes = sessions.map(s => new Date(s.startTime).getHours());
    const avgBedtime = bedtimes.reduce((sum, time
) => sum + time, 0) / bedtimes.length;
    const deviations = bedtimes.map(time => Math.abs(time - avgBedtime));
    const avgDeviation =
      deviations.reduce((sum, dev
) => sum + dev, 0) / deviations.length;

    return Math.max(0, 100 - avgDeviation * 10); // Lower deviation = higher consistency
  }

  private calculateWakeTimeConsistency(sessions: SleepSession[]): number {
    if (sessions.length < 2) return 0;

    const wakeTimes = sessions
      .filter(s => s.endTime)
      .map(s => new Date(s.endTime!).getHours());

    if (wakeTimes.length < 2) return 0;

    const avgWakeTime =
      wakeTimes.reduce((sum, time
) => sum + time, 0) / wakeTimes.length;
    const deviations = wakeTimes.map(time => Math.abs(time - avgWakeTime));
    const avgDeviation =
      deviations.reduce((sum, dev
) => sum + dev, 0) / deviations.length;

    return Math.max(0, 100 - avgDeviation * 10);
  }

  private calculateDeepSleepPercentage(sessions: SleepSession[]): number {
    let totalSleep = 0;
    let totalDeep = 0;

    for (const session of sessions) {
      if (session.duration) {
        totalSleep += session.duration;
        totalDeep += session.stages
          .filter(stage => stage.type === 'deep')
          .reduce((sum, stage
) => sum + stage.duration, 0);
      }
    }

    return totalSleep > 0 ? (totalDeep / totalSleep) * 100 : 0;
  }

  private calculateRemSleepPercentage(sessions: SleepSession[]): number {
    let totalSleep = 0;
    let totalRem = 0;

    for (const session of sessions) {
      if (session.duration) {
        totalSleep += session.duration;
        totalRem += session.stages
          .filter(stage => stage.type === 'rem')
          .reduce((sum, stage
) => sum + stage.duration, 0);
      }
    }

    return totalSleep > 0 ? (totalRem / totalSleep) * 100 : 0;
  }

  private calculateImprovementTrend(
    sessions: SleepSession[]
  ): 'improving' | 'stable' | 'declining' {
    if (sessions.length < 4) return 'stable';

    const recent = sessions.slice(0, 3).map(s => s.quality);
    const older = sessions.slice(3, 6).map(s => s.quality);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, q
) => sum + q, 0) / recent.length;
    const olderAvg = older.reduce((sum, q
) => sum + q, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  }

  private async generateInsights(): Promise<void> {
    try {
      if (this.sleepSessions.length < 3) return; // Need at least 3 sessions for insights

      const insights: SleepInsight[] = [];
      const recentSessions = this.sleepSessions.slice(0, 7);

      // Pattern insight: Bedtime consistency
      const bedtimeConsistency = this.calculateBedtimeConsistency(recentSessions);
      if (bedtimeConsistency < 70) {
        insights.push({
          id: `insight_bedtime_${Date.now()}`,
          type: 'recommendation',
          title: 'Inconsistent Bedtime Detected',
          description: `Your bedtime varies significantly. Try going to bed at the same time each night to improve sleep quality. Current consistency: ${bedtimeConsistency.toFixed(1)}%`,
          data: { consistency: bedtimeConsistency },
          confidence: 0.9,
          priority: 'high',
          actionable: true,
          actions: [
            'Set a consistent bedtime',
            'Create a bedtime routine',
            'Use sleep reminders',
          ],
          createdAt: new Date().toISOString(),
        });
      }

      // Sleep duration insight
      const avgDuration =
        recentSessions.reduce((sum, s
) => sum + (s.duration || 0), 0) /
        recentSessions.length /
        60;
      if (avgDuration < 7) {
        insights.push({
          id: `insight_duration_${Date.now()}`,
          type: 'warning',
          title: 'Insufficient Sleep Duration',
          description: `You're averaging ${avgDuration.toFixed(1)} hours of sleep. Most adults need 7-9 hours for optimal health and performance.`,
          data: { avgDuration },
          confidence: 0.95,
          priority: 'high',
          actionable: true,
          actions: [
            'Go to bed earlier',
            'Reduce screen time before bed',
            'Create a calming bedtime routine',
          ],
          createdAt: new Date().toISOString(),
        });
      }

      // Sleep quality trend
      if (this.sleepAnalytics && this.sleepAnalytics.improvementTrend === 'improving') {
        insights.push({
          id: `insight_improvement_${Date.now()}`,
          type: 'achievement',
          title: 'Sleep Quality Improving!',
          description: `Great job! Your sleep quality has been trending upward. Keep up the good habits!`,
          data: { trend: 'improving' },
          confidence: 0.8,
          priority: 'medium',
          actionable: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Add new insights (avoid duplicates)
      const existingInsightTypes = this.sleepInsights.map(i => i.type + '_' + i.title);
      const newInsights = insights.filter(
        insight => !existingInsightTypes.includes(insight.type + '_' + insight.title)
      );

      this.sleepInsights.unshift(...newInsights);

      // Keep only recent insights (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.sleepInsights = this.sleepInsights.filter(
        insight => new Date(insight.createdAt) > thirtyDaysAgo
      );

      if (newInsights.length > 0) {
        await this.saveToStorage();
        console.log(
          '[OfflineSleepTracker] Generated',
          newInsights.length,
          'new insights'
        );
      }
    } catch (error) {
      console.error('[OfflineSleepTracker] Failed to generate insights:', error);
    }
  }

  // ==================== EVENT HANDLERS ====================

  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    console.log('[OfflineSleepTracker] Coming online, syncing sleep data...');
    await this.syncWithServer();
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('[OfflineSleepTracker] Going offline, continuing offline tracking...');
  }

  private handleSyncComplete(data: any): void {
    console.log('[OfflineSleepTracker] Sync completed via service worker:', data);
  }

  // ==================== SYNC MANAGEMENT ====================

  async syncWithServer(): Promise<void> {
    if (!this.isOnline) return;

    try {
      console.log('[OfflineSleepTracker] Starting sync with server...');

      const unsyncedSessions = this.sleepSessions.filter(s => !s.synced);

      for (const session of unsyncedSessions) {
        try {
          await this.syncSleepSession(session);
          session.synced = true;
        } catch (error) {
          console.error(
            '[OfflineSleepTracker] Failed to sync session:',
            session.id,
            error
          );
        }
      }

      if (unsyncedSessions.length > 0) {
        await this.saveToStorage();
        console.log(
          '[OfflineSleepTracker] Synced',
          unsyncedSessions.length,
          'sleep sessions'
        );
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Sleep tracking sync failed', {
        context: 'OfflineSleepTracker.syncWithServer',
      });
    }
  }

  private async syncSleepSession(session: SleepSession): Promise<void> {
    // In a real implementation, this would make API calls to sync the session
    console.log('[OfflineSleepTracker] Syncing sleep session:', session.id);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return Promise.resolve();
  }

  // ==================== DATA ACCESS METHODS ====================

  getSleepSessions(limit = 30): SleepSession[] {
    return this.sleepSessions.slice(0, limit);
  }

  getCurrentSession(): SleepSession | null {
    return this.currentSession;
  }

  getSleepGoals(): SleepGoal[] {
    return this.sleepGoals.filter(g => g.active);
  }

  getSleepInsights(): SleepInsight[] {
    return this.sleepInsights.filter(i => !i.dismissed);
  }

  getSleepAnalytics(): SleepAnalytics | null {
    return this.sleepAnalytics;
  }

  dismissInsight(insightId: string): void {
    const insight = this.sleepInsights.find(i => i.id === insightId);
    if (insight) {
      insight.dismissed = true;
      this.saveToStorage();
    }
  }

  // ==================== STORAGE MANAGEMENT ====================

  private async saveToStorage(): Promise<void> {
    try {
      SecurityService.secureStorageSet(
        this.STORAGE_KEYS.SLEEP_SESSIONS,
        this.sleepSessions
      );
      SecurityService.secureStorageSet(this.STORAGE_KEYS.SLEEP_GOALS, this.sleepGoals);
      SecurityService.secureStorageSet(
        this.STORAGE_KEYS.SLEEP_INSIGHTS,
        this.sleepInsights
      );

      if (this.sleepAnalytics) {
        SecurityService.secureStorageSet(
          this.STORAGE_KEYS.SLEEP_ANALYTICS,
          this.sleepAnalytics
        );
      }
    } catch (error) {
      console.error('[OfflineSleepTracker] Failed to save to storage:', error);
    }
  }

  private async saveCurrentSession(): Promise<void> {
    try {
      if (this.currentSession) {
        SecurityService.secureStorageSet(
          this.STORAGE_KEYS.CURRENT_SESSION,
          this.currentSession
        );
      } else {
        SecurityService.secureStorageRemove(this.STORAGE_KEYS.CURRENT_SESSION);
      }
    } catch (error) {
      console.error('[OfflineSleepTracker] Failed to save current session:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  getTrackingStats() {
    return {
      totalSessions: this.sleepSessions.length,
      unsyncedSessions: this.sleepSessions.filter(s => !s.synced).length,
      currentlyTracking: !!this.currentSession,
      currentSessionDuration: this.currentSession
        ? Math.round(
            (Date.now() - new Date(this.currentSession.startTime).getTime()) /
              (1000 * 60)
          )
        : 0,
      averageQuality:
        this.sleepSessions.length > 0
          ? this.sleepSessions.reduce((sum, s
) => sum + s.quality, 0) /
            this.sleepSessions.length
          : 0,
      isOnline: this.isOnline,
    };
  }

  async clearOfflineData(): Promise<void> {
    try {
      this.sleepSessions = [];
      this.sleepGoals = [];
      this.sleepInsights = [];
      this.sleepAnalytics = null;

      if (this.currentSession) {
        await this.endSleepTracking();
      }

      await this.saveToStorage();
      await this.saveCurrentSession();

      this.initializeDefaultGoals();

      console.log('[OfflineSleepTracker] Cleared all offline sleep data');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to clear offline sleep data', {
        context: 'OfflineSleepTracker.clearOfflineData',
      });
    }
  }
}

export default OfflineSleepTracker;
