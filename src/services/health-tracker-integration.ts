
/**
 * Health Tracker Integration Service
 *
 * Features:
 * - Sleep tracking and analysis
 * - Heart rate monitoring
 * - Activity level integration
 * - Sleep quality optimization
 * - Circadian rhythm analysis
 * - Recovery time suggestions
 * - Stress level monitoring
 * - Multi-device support (Apple Health, Google Fit, Fitbit, etc.)
 */

export interface SleepData {
  date: Date;
  bedTime: Date;
  sleepTime: Date;
  wakeTime: Date;
  totalSleepMinutes: number;
  deepSleepMinutes: number;
  lightSleepMinutes: number;
  remSleepMinutes: number;
  awakeMinutes: number;
  sleepEfficiency: number; // percentage
  restingHeartRate: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  sleepScore: number; // 0-100
}

export interface ActivityData {
  date: Date;
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  exerciseMinutes: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'fairly_active' | 'very_active';
  stressLevel: number; // 0-100
  energyLevel: number; // 0-100
}

export interface HealthInsight {
  id: string;
  type: 'sleep_pattern' | 'recovery' | 'optimization' | 'alert' | 'trend';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  data: any;
  actionable: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface CircadianProfile {
  chronotype: 'morning' | 'evening' | 'intermediate';
  naturalWakeTime: string; // HH:mm
  naturalBedTime: string; // HH:mm
  optimalSleepDuration: number; // minutes
  sleepDebtTolerance: number; // minutes
  weekdayPattern: {
    bedTime: string;
    wakeTime: string;
    sleepDuration: number;
  };
  weekendPattern: {
    bedTime: string;
    wakeTime: string;
    sleepDuration: number;
  };
}

export interface HealthConfig {
  enabled: boolean;
  connectedDevices: Array<{
    id: string;
    name: string;
    type: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'samsung_health' | 'oura';
    isActive: boolean;
    lastSync: Date | null;
    permissions: string[];
  }>;
  dataRetentionDays: number;
  syncIntervalMinutes: number;
  sleepTracking: {
    enabled: boolean;
    automaticDetection: boolean;
    minSleepDuration: number; // minutes
    sleepWindowStart: string; // HH:mm
    sleepWindowEnd: string; // HH:mm
  };
  analytics: {
    enabled: boolean;
    trendAnalysisDays: number;
    alertThresholds: {
      sleepDebt: number; // minutes
      sleepEfficiency: number; // percentage
      restingHeartRateIncrease: number; // bpm
    };
  };
}

class HealthTrackerIntegration {
  private static instance: HealthTrackerIntegration;
  private isInitialized = false;
  private config: HealthConfig;
  private sleepHistory: SleepData[] = [];
  private activityHistory: ActivityData[] = [];
  private insights: HealthInsight[] = [];
  private circadianProfile: CircadianProfile | null = null;
  private lastSyncTime: Date | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): HealthTrackerIntegration {
    if (!HealthTrackerIntegration.instance) {
      HealthTrackerIntegration.instance = new HealthTrackerIntegration();
    }
    return HealthTrackerIntegration.instance;
  }

  /**
   * Initialize the health tracker integration
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadConfiguration();
      await this.loadHealthData();

      if (this.config.enabled) {
        await this.syncHealthData();
        await this.analyzeCircadianRhythm();
        await this.generateHealthInsights();

        // Start periodic sync
        this.startPeriodicSync();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize HealthTrackerIntegration:', error);
      throw error;
    }
  }

  /**
   * Get sleep-optimized wake time suggestions
   */
  public async getSleepOptimizedWakeTime(targetWakeTime: string, date: Date = new Date()): Promise<{
    suggestedTime: string;
    reasoning: string[];
    confidence: number;
    sleepCycles: number;
    expectedQuality: 'poor' | 'fair' | 'good' | 'excellent';
  } | null> {
    if (!this.config.enabled || this.sleepHistory.length < 7) {
      return null;
    }

    // Analyze recent sleep patterns
    const recentSleep = this.sleepHistory.slice(-14);
    const averageSleepDuration = recentSleep.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / recentSleep.length;
    const averageBedTime = this.calculateAverageTime(recentSleep.map(s => s.bedTime));

    // Calculate optimal sleep cycles (90-minute cycles)
    const targetTime = this.parseTimeString(targetWakeTime);
    const targetWakeDate = new Date(date);
    targetWakeDate.setHours(targetTime.hours, targetTime.minutes, 0, 0);

    // Find the best wake time within ±30 minutes that aligns with sleep cycles
    let bestTime = targetWakeDate;
    let bestQuality = 'fair';
    let confidence = 0.5;
    const reasoning: string[] = [];

    // Calculate sleep cycles based on average bedtime
    const estimatedBedTime = new Date(averageBedTime);
    estimatedBedTime.setDate(date.getDate());
    if (estimatedBedTime > targetWakeDate) {
      estimatedBedTime.setDate(estimatedBedTime.getDate() - 1);
    }

    const sleepDurationMs = targetWakeDate.getTime() - estimatedBedTime.getTime();
    const sleepCycles = Math.round(sleepDurationMs / (90 * 60 * 1000));

    // Adjust to complete sleep cycles
    if (sleepCycles >= 4 && sleepCycles <= 6) {
      const optimalWakeTime = new Date(estimatedBedTime.getTime() + sleepCycles * 90 * 60 * 1000);
      const adjustment = Math.abs(optimalWakeTime.getTime() - targetWakeDate.getTime()) / (60 * 1000);

      if (adjustment <= 30) {
        bestTime = optimalWakeTime;
        confidence = 0.8;
        bestQuality = sleepCycles >= 5 ? 'good' : 'fair';
        reasoning.push(`Aligned with ${sleepCycles} complete sleep cycles`);
        reasoning.push(`Based on your average bedtime pattern`);
      }
    }

    // Check against circadian profile
    if (this.circadianProfile) {
      const naturalWake = this.parseTimeString(this.circadianProfile.naturalWakeTime);
      const naturalWakeDate = new Date(date);
      naturalWakeDate.setHours(naturalWake.hours, naturalWake.minutes, 0, 0);

      const deviation = Math.abs(bestTime.getTime() - naturalWakeDate.getTime()) / (60 * 1000);
      if (deviation > 60) {
        confidence *= 0.8;
        reasoning.push(`Deviates from your natural chronotype by ${Math.round(deviation)} minutes`);
      } else {
        confidence = Math.min(confidence * 1.2, 1);
        reasoning.push('Aligns well with your natural wake time');
      }
    }

    // Consider recent sleep quality
    const recentQuality = recentSleep.slice(-3);
    const avgQuality = recentQuality.reduce((sum, s) => sum + s.sleepScore, 0) / recentQuality.length;

    if (avgQuality < 60) {
      reasoning.push('Recent sleep quality suggests need for longer recovery');
      if (sleepCycles < 5) {
        bestQuality = 'poor';
        reasoning.push('Insufficient sleep cycles for recovery');
      }
    }

    return {
      suggestedTime: `${bestTime.getHours().toString().padStart(2, '0')}:${bestTime.getMinutes().toString().padStart(2, '0')}`,
      reasoning,
      confidence,
      sleepCycles,
      expectedQuality: bestQuality
    };
  }

  /**
   * Analyze sleep debt and recovery needs
   */
  public analyzeSleepDebt(): {
    currentDebt: number; // minutes
    trend: 'improving' | 'stable' | 'worsening';
    recoveryDays: number;
    recommendations: string[];
  } {
    if (this.sleepHistory.length < 7) {
      return {
        currentDebt: 0,
        trend: 'stable',
        recoveryDays: 0,
        recommendations: ['Not enough data for analysis']
      };
    }

    const optimalSleep = this.circadianProfile?.optimalSleepDuration || 8 * 60; // 8 hours default
    const recent14Days = this.sleepHistory.slice(-14);
    const recent7Days = this.sleepHistory.slice(-7);

    // Calculate sleep debt
    const currentDebt = recent7Days.reduce((debt, sleep) => {
      return debt + Math.max(0, optimalSleep - sleep.totalSleepMinutes);
    }, 0);

    // Calculate trend
    const earlier7Days = recent14Days.slice(0, 7);
    const earlierDebt = earlier7Days.reduce((debt, sleep) => {
      return debt + Math.max(0, optimalSleep - sleep.totalSleepMinutes);
    }, 0);

    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    const debtChange = currentDebt - earlierDebt;
    if (debtChange > 60) trend = 'worsening';
    else if (debtChange < -60) trend = 'improving';

    // Calculate recovery time
    const avgDailyRecovery = 60; // Assume 1 hour recovery per night with optimal sleep
    const recoveryDays = Math.ceil(currentDebt / avgDailyRecovery);

    // Generate recommendations
    const recommendations: string[] = [];
    if (currentDebt > 180) { // 3+ hours
      recommendations.push('Consider going to bed 30-60 minutes earlier');
      recommendations.push('Prioritize sleep consistency over late activities');
    }
    if (trend === 'worsening') {
      recommendations.push('Sleep debt is accumulating - adjust your schedule');
    }
    if (recoveryDays > 7) {
      recommendations.push('Consider a few early nights to catch up on sleep');
    }

    return {
      currentDebt,
      trend,
      recoveryDays,
      recommendations
    };
  }

  /**
   * Get health-based alarm recommendations
   */
  public async getHealthBasedAlarmRecommendations(alarm: Alarm): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    if (!this.config.enabled) return insights;

    // Sleep cycle alignment
    const sleepCycleInsight = this.analyzeSleepCycleAlignment(alarm);
    if (sleepCycleInsight) insights.push(sleepCycleInsight);

    // Recovery needs
    const recoveryInsight = this.analyzeRecoveryNeeds(alarm);
    if (recoveryInsight) insights.push(recoveryInsight);

    // Stress level considerations
    const stressInsight = this.analyzeStressImpact(alarm);
    if (stressInsight) insights.push(stressInsight);

    return insights;
  }

  /**
   * Sync health data from connected devices
   */
  public async syncHealthData(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      for (const device of this.config.connectedDevices) {
        if (device.isActive) {
          await this.syncFromDevice(device);
        }
      }

      this.lastSyncTime = new Date();
      await this.saveHealthData();

    } catch (error) {
      console.error('Failed to sync health data:', error);
    }
  }

  /**
   * Get comprehensive health statistics
   */
  public getHealthStats(): any {
    const recent7Days = this.sleepHistory.slice(-7);
    const recent30Days = this.sleepHistory.slice(-30);

    const avgSleepDuration = recent7Days.length > 0
      ? recent7Days.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / recent7Days.length
      : 0;

    const avgSleepEfficiency = recent7Days.length > 0
      ? recent7Days.reduce((sum, s) => sum + s.sleepEfficiency, 0) / recent7Days.length
      : 0;

    const avgSleepScore = recent7Days.length > 0
      ? recent7Days.reduce((sum, s) => sum + s.sleepScore, 0) / recent7Days.length
      : 0;

    return {
      isEnabled: this.config.enabled,
      connectedDevices: this.config.connectedDevices.length,
      activeDevices: this.config.connectedDevices.filter(d => d.isActive).length,
      lastSyncTime: this.lastSyncTime,
      dataPoints: {
        sleepRecords: this.sleepHistory.length,
        activityRecords: this.activityHistory.length
      },
      recent7Days: {
        avgSleepDuration: Math.round(avgSleepDuration / 60 * 10) / 10, // hours
        avgSleepEfficiency: Math.round(avgSleepEfficiency),
        avgSleepScore: Math.round(avgSleepScore)
      },
      trends: {
        sleepDuration: this.calculateSleepTrend(recent30Days),
        sleepQuality: this.calculateQualityTrend(recent30Days)
      },
      circadianProfile: this.circadianProfile,
      insights: this.insights.length
    };
  }

  /**
   * Update health configuration
   */
  public async updateConfig(config: Partial<HealthConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfiguration();
  }

  /**
   * Helper methods
   */
  private async syncFromDevice(device: any): Promise<void> {
    // This would implement actual device API calls
    // For now, generate mock data
    const mockSleepData = this.generateMockSleepData();
    const mockActivityData = this.generateMockActivityData();

    this.sleepHistory.push(mockSleepData);
    this.activityHistory.push(mockActivityData);

    // Keep only recent data
    this.sleepHistory = this.sleepHistory.slice(-this.config.dataRetentionDays);
    this.activityHistory = this.activityHistory.slice(-this.config.dataRetentionDays);

    device.lastSync = new Date();
  }

  private generateMockSleepData(): SleepData {
    const now = new Date();
    const bedTime = new Date(now);
    bedTime.setHours(22 + Math.random() * 2, Math.random() * 60);
    bedTime.setDate(bedTime.getDate() - 1);

    const sleepTime = new Date(bedTime.getTime() + (10 + Math.random() * 20) * 60 * 1000);
    const wakeTime = new Date(sleepTime.getTime() + (6 + Math.random() * 3) * 60 * 60 * 1000);

    const totalSleep = (wakeTime.getTime() - sleepTime.getTime()) / (60 * 1000);

    return {
      date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      bedTime,
      sleepTime,
      wakeTime,
      totalSleepMinutes: totalSleep,
      deepSleepMinutes: totalSleep * (0.15 + Math.random() * 0.1),
      lightSleepMinutes: totalSleep * (0.45 + Math.random() * 0.1),
      remSleepMinutes: totalSleep * (0.2 + Math.random() * 0.1),
      awakeMinutes: totalSleep * (0.05 + Math.random() * 0.05),
      sleepEfficiency: 80 + Math.random() * 15,
      restingHeartRate: 60 + Math.random() * 20,
      sleepQuality: ['fair', 'good', 'good', 'excellent'][Math.floor(Math.random() * 4)] as any,
      sleepScore: 60 + Math.random() * 35
    };
  }

  private generateMockActivityData(): ActivityData {
    return {
      date: new Date(),
      steps: 5000 + Math.random() * 10000,
      caloriesBurned: 1800 + Math.random() * 800,
      activeMinutes: 30 + Math.random() * 90,
      exerciseMinutes: Math.random() * 60,
      activityLevel: ['sedentary', 'lightly_active', 'fairly_active'][Math.floor(Math.random() * 3)] as any,
      stressLevel: Math.random() * 100,
      energyLevel: 50 + Math.random() * 50
    };
  }

  private parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private calculateAverageTime(times: Date[]): Date {
    const avgMinutes = times.reduce((sum, time) =>
      sum + time.getHours() * 60 + time.getMinutes(), 0
    ) / times.length;

    const avg = new Date();
    avg.setHours(Math.floor(avgMinutes / 60), avgMinutes % 60, 0, 0);
    return avg;
  }

  private analyzeSleepCycleAlignment(
    alarm: Alarm
  ): HealthInsight | null {
    // Implementation for sleep cycle analysis
    return null;
  }

  private analyzeRecoveryNeeds(alarm: Alarm): HealthInsight | null {
    // Implementation for recovery analysis
    return null;
  }

  private analyzeStressImpact(alarm: Alarm): HealthInsight | null {
    // Implementation for stress analysis
    return null;
  }

  private calculateSleepTrend(sleepData: SleepData[]): 'improving' | 'stable' | 'declining' {
    if (sleepData.length < 14) return 'stable';

    const firstHalf = sleepData.slice(0, Math.floor(sleepData.length / 2));
    const secondHalf = sleepData.slice(Math.floor(sleepData.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    if (difference > 30) return 'improving';
    if (difference < -30) return 'declining';
    return 'stable';
  }

  private calculateQualityTrend(sleepData: SleepData[]): 'improving' | 'stable' | 'declining' {
    if (sleepData.length < 14) return 'stable';

    const firstHalf = sleepData.slice(0, Math.floor(sleepData.length / 2));
    const secondHalf = sleepData.slice(Math.floor(sleepData.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.sleepScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.sleepScore, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }

  private async analyzeCircadianRhythm(): Promise<void> {
    if (this.sleepHistory.length < 14) return;

    const recent30Days = this.sleepHistory.slice(-30);
    const weekdayData = recent30Days.filter(s => {
      const day = s.date.getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });
    const weekendData = recent30Days.filter(s => {
      const day = s.date.getDay();
      return day === 0 || day === 6; // Saturday and Sunday
    });

    if (weekdayData.length < 5 || weekendData.length < 2) return;

    // Calculate patterns
    const avgWeekdayBedTime = this.calculateAverageTime(weekdayData.map(s => s.bedTime));
    const avgWeekdayWakeTime = this.calculateAverageTime(weekdayData.map(s => s.wakeTime));
    const avgWeekendBedTime = this.calculateAverageTime(weekendData.map(s => s.bedTime));
    const avgWeekendWakeTime = this.calculateAverageTime(weekendData.map(s => s.wakeTime));

    // Determine chronotype
    let chronotype: 'morning' | 'evening' | 'intermediate' = 'intermediate';
    const avgWakeHour = (avgWeekdayWakeTime.getHours() + avgWeekendWakeTime.getHours()) / 2;
    if (avgWakeHour < 6.5) chronotype = 'morning';
    else if (avgWakeHour > 8.5) chronotype = 'evening';

    this.circadianProfile = {
      chronotype,
      naturalWakeTime: `${avgWeekendWakeTime.getHours().toString().padStart(2, '0')}:${avgWeekendWakeTime.getMinutes().toString().padStart(2, '0')}`,
      naturalBedTime: `${avgWeekendBedTime.getHours().toString().padStart(2, '0')}:${avgWeekendBedTime.getMinutes().toString().padStart(2, '0')}`,
      optimalSleepDuration: weekdayData.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / weekdayData.length,
      sleepDebtTolerance: 120, // 2 hours
      weekdayPattern: {
        bedTime: `${avgWeekdayBedTime.getHours().toString().padStart(2, '0')}:${avgWeekdayBedTime.getMinutes().toString().padStart(2, '0')}`,
        wakeTime: `${avgWeekdayWakeTime.getHours().toString().padStart(2, '0')}:${avgWeekdayWakeTime.getMinutes().toString().padStart(2, '0')}`,
        sleepDuration: weekdayData.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / weekdayData.length
      },
      weekendPattern: {
        bedTime: `${avgWeekendBedTime.getHours().toString().padStart(2, '0')}:${avgWeekendBedTime.getMinutes().toString().padStart(2, '0')}`,
        wakeTime: `${avgWeekendWakeTime.getHours().toString().padStart(2, '0')}:${avgWeekendWakeTime.getMinutes().toString().padStart(2, '0')}`,
        sleepDuration: weekendData.reduce((sum, s) => sum + s.totalSleepMinutes, 0) / weekendData.length
      }
    };
  }

  private async generateHealthInsights(): Promise<void> {
    this.insights = [];

    if (this.sleepHistory.length < 7) return;

    // Generate various insights based on health data
    // This would be expanded with more sophisticated analysis
  }

  private startPeriodicSync(): void {
    setInterval(async () => {
      if (this.config.enabled) {
        await this.syncHealthData();
      }
    }, this.config.syncIntervalMinutes * 60 * 1000);
  }

  private getDefaultConfig(): HealthConfig {
    return {
      enabled: false,
      connectedDevices: [],
      dataRetentionDays: 90,
      syncIntervalMinutes: 60,
      sleepTracking: {
        enabled: true,
        automaticDetection: true,
        minSleepDuration: 4 * 60, // 4 hours
        sleepWindowStart: '20:00',
        sleepWindowEnd: '10:00'
      },
      analytics: {
        enabled: true,
        trendAnalysisDays: 30,
        alertThresholds: {
          sleepDebt: 2 * 60, // 2 hours
          sleepEfficiency: 80, // 80%
          restingHeartRateIncrease: 10 // 10 bpm
        }
      }
    };
  }

  // Persistence methods
  private async saveConfiguration(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('health_tracker_config', JSON.stringify(this.config, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }));
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('health_tracker_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    }
  }

  private async saveHealthData(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const data = {
        sleepHistory: this.sleepHistory,
        activityHistory: this.activityHistory,
        insights: this.insights,
        circadianProfile: this.circadianProfile
      };

      localStorage.setItem('health_tracker_data', JSON.stringify(data, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }));
    }
  }

  private async loadHealthData(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('health_tracker_data');
      if (saved) {
        const data = JSON.parse(saved, (key, value) => {
          if (value && typeof value === 'object' && value.__type === 'Date') {
            return new Date(value.value);
          }
          return value;
        });

        this.sleepHistory = data.sleepHistory || [];
        this.activityHistory = data.activityHistory || [];
        this.insights = data.insights || [];
        this.circadianProfile = data.circadianProfile || null;
      }
    }
  }
}

export default HealthTrackerIntegration;