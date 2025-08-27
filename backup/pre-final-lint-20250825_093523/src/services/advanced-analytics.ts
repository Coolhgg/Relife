// Advanced Analytics Service for Relife Smart Alarm
// Provides comprehensive analytics, insights, and AI-powered recommendations

import { SupabaseService } from './supabase';
import PerformanceMonitor from './performance-monitor';
import { ErrorHandler } from './error-handler';
import type { Alarm, User } from '../types';

export interface AnalyticsInsight {
  id: string;
  type: 'performance' | 'behavior' | 'optimization' | 'health' | 'prediction';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  actionable: boolean;
  recommendations?: string[];
  data: {
    current_value: number;
    target_value?: number;
    trend: 'improving' | 'declining' | 'stable';
    comparison_period: string;
  };
  metadata: Record<string, any>;
  created_at: Date;
}

export interface UserAnalytics {
  userId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  summary: {
    total_alarms: number;
    successful_wake_ups: number;
    average_response_time: number;
    success_rate: number;
    consistency_score: number;
    sleep_health_score: number;
  };
  trends: {
    wake_time_consistency: TrendData;
    response_time_trend: TrendData;
    voice_mood_effectiveness: TrendData;
    sleep_quality_trend: TrendData;
  };
  insights: AnalyticsInsight[];
  comparative_analysis: {
    peer_comparison: PeerComparison;
    personal_best: PersonalBest;
    seasonal_patterns: SeasonalPattern[];
  };
  prediction_models: {
    optimal_wake_times: OptimalWakeTime[];
    effectiveness_forecast: EffectivenessForecast;
    sleep_recommendations: SleepRecommendation[];
  };
}

export interface TrendData {
  metric_name: string;
  values: { date: string; value: number }[];
  trend_direction: 'up' | 'down' | 'stable';
  trend_strength: number; // 0-1
  statistical_significance: number; // 0-1
}

export interface PeerComparison {
  user_percentile: number;
  category_average: number;
  user_value: number;
  metric: string;
  sample_size: number;
}

export interface PersonalBest {
  metric: string;
  best_value: number;
  best_date: string;
  current_value: number;
  improvement_potential: number;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  pattern_type: 'wake_time' | 'success_rate' | 'sleep_duration';
  average_value: number;
  deviation_from_annual_average: number;
  significance: number;
}

export interface OptimalWakeTime {
  day_of_week: number;
  optimal_time: string;
  confidence: number;
  expected_success_rate: number;
  factors: string[];
}

export interface EffectivenessForecast {
  next_week_prediction: number;
  accuracy_score: number;
  contributing_factors: Array<{
    factor: string;
    influence_weight: number;
    current_trend: 'positive' | 'negative' | 'neutral';
  }>;
}

export interface SleepRecommendation {
  type: 'bedtime' | 'duration' | 'consistency' | 'environment';
  current_value: number;
  recommended_value: number;
  expected_improvement: number;
  rationale: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private performanceMonitor = PerformanceMonitor.getInstance();
  private supabaseService = SupabaseService;
  private insightCache = new Map<
    string,
    { data: AnalyticsInsight[]; timestamp: number }
  >();
  private analyticsCache = new Map<
    string,
    { data: UserAnalytics; timestamp: number }
  >();

  private constructor() {}

  static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  /**
   * Generate comprehensive user analytics
   */
  async generateUserAnalytics(
    userId: string,
    period: UserAnalytics['period'] = 'month'
  ): Promise<UserAnalytics> {
    try {
      const startTime = performance.now();
      const cacheKey = `analytics_${userId}_${period}`;

      // Check cache first
      const cached = this.analyticsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        // 5 minutes cache
        return cached.data;
      }

      // Gather base data
      const [alarmData, sleepData, eventsData] = await Promise.all([
        this.getAlarmData(userId, period),
        this.getSleepData(userId, period),
        this.getEventData(userId, period),
      ]);

      // Calculate summary metrics
      const summary = await this.calculateSummaryMetrics(
        alarmData,
        sleepData,
        eventsData
      );

      // Generate trends
      const trends = await this.calculateTrends(userId, period, eventsData, sleepData);

      // Generate insights
      const insights = await this.generateInsights(
        userId,
        summary,
        trends,
        alarmData,
        sleepData,
        eventsData
      );

      // Perform comparative analysis
      const comparative_analysis = await this.performComparativeAnalysis(
        userId,
        summary,
        period
      );

      // Build prediction models
      const prediction_models = await this.buildPredictionModels(
        userId,
        eventsData,
        sleepData,
        trends
      );

      const analytics: UserAnalytics = {
        userId,
        period,
        summary,
        trends,
        insights,
        comparative_analysis,
        prediction_models,
      };

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now(),
      });

      const duration = performance.now() - startTime;
      this.performanceMonitor.trackCustomMetric(
        'advanced_analytics_generation',
        duration
      );

      return analytics;
    } catch (_error) {
      ErrorHandler.handleError(_error as Error, 'Failed to generate _user analytics', {
        userId,
        period,
      });
      throw error;
    }
  }

  /**
   * Calculate summary metrics
   */
  private async calculateSummaryMetrics(
    alarmData: any[],
    sleepData: any[],
    eventsData: any[]
  ): Promise<UserAnalytics['summary']> {
    const total_alarms = eventsData.length;
    const successful_wake_ups = eventsData.filter(
      event => event.dismissed && !_event.snoozed
    ).length;
    const average_response_time =
      eventsData
        .filter(event => _event.response_time)
        .reduce((sum, _event) => sum + event.response_time, 0) /
        eventsData.filter(event => _event.response_time).length || 0;

    const success_rate =
      total_alarms > 0 ? (successful_wake_ups / total_alarms) * 100 : 0;

    // Calculate consistency score based on wake time variance
    const consistency_score = this.calculateConsistencyScore(eventsData);

    // Calculate sleep health score
    const sleep_health_score = this.calculateSleepHealthScore(sleepData);

    return {
      total_alarms,
      successful_wake_ups,
      average_response_time: Math.round(average_response_time),
      success_rate: Math.round(success_rate),
      consistency_score: Math.round(consistency_score),
      sleep_health_score: Math.round(sleep_health_score),
    };
  }

  /**
   * Calculate various trends
   */
  private async calculateTrends(
    userId: string,
    period: string,
    eventsData: any[],
    sleepData: any[]
  ): Promise<UserAnalytics['trends']> {
    const wake_time_consistency =
      await this.calculateWakeTimeConsistencyTrend(eventsData);
    const response_time_trend = await this.calculateResponseTimeTrend(eventsData);
    const voice_mood_effectiveness = await this.calculateVoiceMoodEffectivenessTrend(
      userId,
      eventsData
    );
    const sleep_quality_trend = await this.calculateSleepQualityTrend(sleepData);

    return {
      wake_time_consistency,
      response_time_trend,
      voice_mood_effectiveness,
      sleep_quality_trend,
    };
  }

  /**
   * Generate actionable insights
   */
  private async generateInsights(
    userId: string,
    summary: UserAnalytics['summary'],
    trends: UserAnalytics['trends'],
    alarmData: any[],
    sleepData: any[],
    eventsData: any[]
  ): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    // Performance insights
    if (summary.success_rate < 70) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'performance',
        title: 'Low Wake-Up Success Rate',
        description: `Your wake-up success rate is ${summary.success_rate}%, which is below the recommended 80%.`,
        impact: summary.success_rate < 50 ? 'critical' : 'high',
        confidence: 85,
        actionable: true,
        recommendations: [
          'Try a more assertive voice mood like drill-sergeant',
          'Adjust your bedtime to get more sleep',
          'Consider using escalating alarm volumes',
        ],
        data: {
          current_value: summary.success_rate,
          target_value: 80,
          trend: this.getTrendDirection(trends.response_time_trend.trend_direction),
          comparison_period: 'last_month',
        },
        metadata: { metric: 'success_rate', threshold: 70 },
        created_at: new Date(),
      });
    }

    // Response time insights
    if (summary.average_response_time > 120) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'behavior',
        title: 'Slow Wake-Up Response',
        description: `You take an average of ${Math.round(summary.average_response_time / 60)} minutes to respond to alarms.`,
        impact: 'medium',
        confidence: 78,
        actionable: true,
        recommendations: [
          'Move your alarm device further from your bed',
          'Use a louder or more jarring alarm sound',
          'Try the anime-hero voice mood for more energy',
        ],
        data: {
          current_value: summary.average_response_time,
          target_value: 60,
          trend: this.getTrendDirection(trends.response_time_trend.trend_direction),
          comparison_period: 'last_month',
        },
        metadata: { metric: 'response_time', threshold: 120 },
        created_at: new Date(),
      });
    }

    // Sleep quality insights
    if (summary.sleep_health_score < 60) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: 'health',
        title: 'Poor Sleep Quality Detected',
        description: `Your sleep health score is ${summary.sleep_health_score}%, indicating room for improvement.`,
        impact: 'high',
        confidence: 82,
        actionable: true,
        recommendations: [
          'Establish a consistent bedtime routine',
          'Avoid screens 1 hour before bed',
          'Keep your bedroom cool and dark',
        ],
        data: {
          current_value: summary.sleep_health_score,
          target_value: 80,
          trend: this.getTrendDirection(trends.sleep_quality_trend.trend_direction),
          comparison_period: 'last_month',
        },
        metadata: { metric: 'sleep_health', threshold: 60 },
        created_at: new Date(),
      });
    }

    // Consistency insights
    if (summary.consistency_score < 70) {
      insights.push({
        id: `insight_${Date.now()}_4`,
        type: 'optimization',
        title: 'Inconsistent Wake Times',
        description: `Your wake-up times vary significantly, affecting your circadian rhythm.`,
        impact: 'medium',
        confidence: 75,
        actionable: true,
        recommendations: [
          'Set a consistent wake-up time even on weekends',
          'Use smart scheduling to optimize timing',
          'Gradually adjust to your desired schedule',
        ],
        data: {
          current_value: summary.consistency_score,
          target_value: 85,
          trend: this.getTrendDirection(trends.wake_time_consistency.trend_direction),
          comparison_period: 'last_month',
        },
        metadata: { metric: 'consistency', threshold: 70 },
        created_at: new Date(),
      });
    }

    // Voice effectiveness insights
    const voiceEffectiveness = await this.analyzeVoiceEffectiveness(userId, eventsData);
    if (voiceEffectiveness.improvementPotential > 20) {
      insights.push({
        id: `insight_${Date.now()}_5`,
        type: 'optimization',
        title: 'Voice Mood Optimization Opportunity',
        description: `Switching to ${voiceEffectiveness.bestMood} could improve your success rate by ${voiceEffectiveness.improvementPotential}%.`,
        impact: 'medium',
        confidence: voiceEffectiveness.confidence,
        actionable: true,
        recommendations: [
          `Try the ${voiceEffectiveness.bestMood} voice mood`,
          'Experiment with different voice moods for different times',
          'Use AI-powered voice personalization',
        ],
        data: {
          current_value: voiceEffectiveness.currentEffectiveness,
          target_value: voiceEffectiveness.potentialEffectiveness,
          trend: 'stable',
          comparison_period: 'last_month',
        },
        metadata: {
          metric: 'voice_effectiveness',
          current_mood: voiceEffectiveness.currentMood,
          recommended_mood: voiceEffectiveness.bestMood,
        },
        created_at: new Date(),
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Perform comparative analysis with peers and personal bests
   */
  private async performComparativeAnalysis(
    userId: string,
    summary: UserAnalytics['summary'],
    period: string
  ): Promise<UserAnalytics['comparative_analysis']> {
    // Peer comparison (anonymized)
    const peer_comparison = await this.calculatePeerComparison(
      summary.success_rate,
      'success_rate'
    );

    // Personal best analysis
    const personal_best = await this.calculatePersonalBest(userId, 'success_rate');

    // Seasonal patterns
    const seasonal_patterns = await this.calculateSeasonalPatterns(userId);

    return {
      peer_comparison,
      personal_best,
      seasonal_patterns,
    };
  }

  /**
   * Build prediction models
   */
  private async buildPredictionModels(
    userId: string,
    eventsData: any[],
    sleepData: any[],
    trends: UserAnalytics['trends']
  ): Promise<UserAnalytics['prediction_models']> {
    const optimal_wake_times = await this.predictOptimalWakeTimes(userId, eventsData);
    const effectiveness_forecast = await this.forecastEffectiveness(eventsData, trends);
    const sleep_recommendations = await this.generateSleepRecommendations(
      sleepData,
      eventsData
    );

    return {
      optimal_wake_times,
      effectiveness_forecast,
      sleep_recommendations,
    };
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealtimeDashboard(userId: string): Promise<{
    liveMetrics: any;
    todayStats: any;
    activeInsights: AnalyticsInsight[];
    quickActions: any[];
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's events
      const { data: todayEvents, _error } = await this.supabaseService
        .getInstance()
        .client.from('alarm_events')
        .select(
          `
          *,
          alarms!inner(user_id, label, voice_mood)
        `
        )
        .eq('alarms.user_id', userId)
        .gte('fired_at', today)
        .order('fired_at', { ascending: false });

      if (_error) throw error;

      const liveMetrics = {
        todayAlarms: todayEvents?.length || 0,
        successfulWakeups:
          todayEvents?.filter((e: any) => e.dismissed && !e.snoozed).length || 0,
        avgResponseTime: this.calculateAverageResponseTime(todayEvents || []),
        streak: await this.calculateCurrentStreak(userId),
      };

      const todayStats = {
        firstAlarm: todayEvents?.[0]?.fired_at,
        lastAlarm: todayEvents?.[todayEvents.length - 1]?.fired_at,
        mostEffectiveVoice: this.getMostEffectiveVoice(todayEvents || []),
        totalSnoozed: todayEvents?.filter((e: any) => e.snoozed).length || 0,
      };

      // Get active insights (cached)
      const analytics = await this.generateUserAnalytics(userId, 'week');
      const activeInsights = analytics.insights.slice(0, 3);

      // Generate quick actions
      const quickActions = await this.generateQuickActions(
        userId,
        liveMetrics,
        activeInsights
      );

      return {
        liveMetrics,
        todayStats,
        activeInsights,
        quickActions,
      };
    } catch (_error) {
      ErrorHandler.handleError(_error as Error, 'Failed to get realtime dashboard', {
        userId,
      });
      throw error;
    }
  }

  /**
   * Helper methods for calculations
   */
  private calculateConsistencyScore(eventsData: any[]): number {
    if (eventsData.length < 2) return 100;

    // Calculate variance in wake times
    const wakeTimes = eventsData.map(event => {
      const time = new Date(_event.fired_at);
      return time.getHours() * 60 + time.getMinutes();
    });

    const mean = wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
    const variance =
      wakeTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
      wakeTimes.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consistency score (lower std dev = higher consistency)
    // Perfect consistency (0 std dev) = 100, high variance reduces score
    const maxStdDev = 120; // 2 hours variation
    const consistencyScore = Math.max(0, 100 - (stdDev / maxStdDev) * 100);

    return consistencyScore;
  }

  private calculateSleepHealthScore(sleepData: any[]): number {
    if (sleepData.length === 0) return 50; // No data

    const recentSleep = sleepData.slice(-7); // Last 7 days

    const avgDuration =
      recentSleep.reduce((sum, session) => sum + session.total_duration, 0) /
      recentSleep.length;
    const avgEfficiency =
      recentSleep.reduce((sum, session) => sum + (session.sleep_efficiency || 80), 0) /
      recentSleep.length;
    const avgQuality =
      recentSleep.reduce((sum, session) => sum + (session.restfulness_score || 70), 0) /
      recentSleep.length;

    // Weighted health score
    const durationScore = Math.min(100, (avgDuration / 480) * 100); // Target 8 hours
    const efficiencyScore = avgEfficiency;
    const qualityScore = avgQuality;

    const healthScore =
      durationScore * 0.4 + efficiencyScore * 0.3 + qualityScore * 0.3;
    return Math.round(healthScore);
  }

  private async calculateWakeTimeConsistencyTrend(
    eventsData: any[]
  ): Promise<TrendData> {
    // Group events by week and calculate consistency for each week
    const weeklyConsistency = new Map<string, TimeoutHandle>();

    eventsData.forEach(event => {
      const date = new Date(_event.fired_at);
      const weekKey = this.getWeekKey(date);

      if (!weeklyConsistency.has(weekKey)) {
        weeklyConsistency.set(weekKey, 0);
      }
    });

    // Convert to trend data format
    const values = Array.from(weeklyConsistency.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    const trend_direction = this.calculateTrendDirection(values);
    const trend_strength = this.calculateTrendStrength(values);

    return {
      metric_name: 'wake_time_consistency',
      values,
      trend_direction,
      trend_strength,
      statistical_significance: this.calculateStatisticalSignificance(values),
    };
  }

  private async calculateResponseTimeTrend(eventsData: any[]): Promise<TrendData> {
    const weeklyAvgResponseTime = new Map<string, { total: number; count: number }>();

    eventsData
      .filter(event => _event.response_time)
      .forEach(event => {
        const date = new Date(_event.fired_at);
        const weekKey = this.getWeekKey(date);

        const current = weeklyAvgResponseTime.get(weekKey) || {
          total: 0,
          count: 0,
        };
        current.total += event.response_time;
        current.count += 1;
        weeklyAvgResponseTime.set(weekKey, current);
      });

    const values = Array.from(weeklyAvgResponseTime.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count }]) => ({ date, value: total / count }));

    return {
      metric_name: 'response_time',
      values,
      trend_direction: this.calculateTrendDirection(values),
      trend_strength: this.calculateTrendStrength(values),
      statistical_significance: this.calculateStatisticalSignificance(values),
    };
  }

  private async calculateVoiceMoodEffectivenessTrend(
    userId: string,
    eventsData: any[]
  ): Promise<TrendData> {
    // This would calculate how voice mood effectiveness changes over time
    const weeklyEffectiveness = new Map<string, TimeoutHandle>();

    // Group by week and calculate success rate
    const weeklyData = new Map<string, { successful: number; total: number }>();

    eventsData.forEach(event => {
      const date = new Date(_event.fired_at);
      const weekKey = this.getWeekKey(date);

      const current = weeklyData.get(weekKey) || { successful: 0, total: 0 };
      current.total += 1;
      if (event.dismissed && !_event.snoozed) {
        current.successful += 1;
      }
      weeklyData.set(weekKey, current);
    });

    const values = Array.from(weeklyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { successful, total }]) => ({
        date,
        value: total > 0 ? (successful / total) * 100 : 0,
      }));

    return {
      metric_name: 'voice_effectiveness',
      values,
      trend_direction: this.calculateTrendDirection(values),
      trend_strength: this.calculateTrendStrength(values),
      statistical_significance: this.calculateStatisticalSignificance(values),
    };
  }

  private async calculateSleepQualityTrend(sleepData: any[]): Promise<TrendData> {
    const values = sleepData
      .slice(-30) // Last 30 days
      .map(session => ({
        date: session.sleep_start.split('T')[0],
        value: session.restfulness_score || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      metric_name: 'sleep_quality',
      values,
      trend_direction: this.calculateTrendDirection(values),
      trend_strength: this.calculateTrendStrength(values),
      statistical_significance: this.calculateStatisticalSignificance(values),
    };
  }

  private getTrendDirection(direction: string): AnalyticsInsight['data']['trend'] {
    switch (direction) {
      case 'up':
        return 'improving';
      case 'down':
        return 'declining';
      default:
        return 'stable';
    }
  }

  private calculateTrendDirection(
    values: { date: string; value: number }[]
  ): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v.value, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v.value, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  private calculateTrendStrength(values: { date: string; value: number }[]): number {
    if (values.length < 2) return 0;

    // Calculate correlation coefficient with time
    const n = values.length;
    const sumX = (n * (n + 1)) / 2; // Sum of 1, 2, 3, ..., n
    const sumY = values.reduce((sum, v) => sum + v.value, 0);
    const sumXY = values.reduce((sum, v, i) => sum + (i + 1) * v.value, 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6; // Sum of 1², 2², 3², ..., n²
    const sumYY = values.reduce((sum, v) => sum + v.value * v.value, 0);

    const correlation =
      (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return Math.abs(correlation || 0);
  }

  private calculateStatisticalSignificance(
    values: { date: string; value: number }[]
  ): number {
    // Simplified significance calculation
    if (values.length < 3) return 0;

    const variance = this.calculateVariance(values.map(v => v.value));
    const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length;

    // Coefficient of variation as a proxy for significance
    const cv = Math.sqrt(variance) / mean;

    // Convert to 0-1 scale (lower CV = higher significance)
    return Math.max(0, 1 - cv);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return (
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private async getAlarmData(userId: string, period: string): Promise<any[]> {
    const daysBack = this.getPeriodDays(period);
    const { data, _error } = await this.supabaseService
      .getInstance()
      .client.from('alarms')
      .select('*')
      .eq('user_id', userId)
      .gte(
        'created_at',
        new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
      );

    if (_error) throw error;
    return data || [];
  }

  private async getSleepData(userId: string, period: string): Promise<any[]> {
    const daysBack = this.getPeriodDays(period);
    const { data, _error } = await this.supabaseService
      .getInstance()
      .client.from('sleep_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte(
        'sleep_start',
        new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('sleep_start', { ascending: false });

    if (_error) throw error;
    return data || [];
  }

  private async getEventData(userId: string, period: string): Promise<any[]> {
    const daysBack = this.getPeriodDays(period);
    const { data, _error } = await this.supabaseService
      .getInstance()
      .client.from('alarm_events')
      .select(
        `
        *,
        alarms!inner(user_id, voice_mood, label)
      `
      )
      .eq('alarms.user_id', userId)
      .gte(
        'fired_at',
        new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('fired_at', { ascending: false });

    if (_error) throw error;
    return data || [];
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'quarter':
        return 90;
      case 'year':
        return 365;
      default:
        return 30;
    }
  }

  private async analyzeVoiceEffectiveness(
    userId: string,
    eventsData: any[]
  ): Promise<any> {
    const moodEffectiveness = new Map<string, { successful: number; total: number }>();

    eventsData.forEach(event => {
      const mood = _event.alarms?.voice_mood || 'motivational';
      const current = moodEffectiveness.get(mood) || {
        successful: 0,
        total: 0,
      };
      current.total += 1;
      if (event.dismissed && !_event.snoozed) {
        current.successful += 1;
      }
      moodEffectiveness.set(mood, current);
    });

    // Find best and current mood
    let bestMood = 'motivational';
    let bestRate = 0;
    let currentMood = 'motivational';
    let currentRate = 0;
    let currentUsage = 0;

    for (const [mood, stats] of moodEffectiveness.entries()) {
      const rate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;

      if (rate > bestRate && stats.total >= 3) {
        bestMood = mood;
        bestRate = rate;
      }

      if (stats.total > currentUsage) {
        currentMood = mood;
        currentRate = rate;
        currentUsage = stats.total;
      }
    }

    return {
      currentMood,
      currentEffectiveness: Math.round(currentRate),
      bestMood,
      potentialEffectiveness: Math.round(bestRate),
      improvementPotential: Math.round(bestRate - currentRate),
      confidence: Math.min(
        90,
        Math.max(50, moodEffectiveness.get(bestMood)?.total * 10 || 50)
      ),
    };
  }

  private async calculatePeerComparison(
    userValue: number,
    metric: string
  ): Promise<PeerComparison> {
    // This would typically query aggregated, anonymized data
    // For demo purposes, using simulated peer data
    const peerData = {
      success_rate: { average: 75, percentiles: [45, 60, 75, 85, 95] },
    };

    const data = peerData[metric as keyof typeof peerData] || peerData.success_rate;

    // Calculate user percentile
    let percentile = 50;
    for (let i = 0; i < data.percentiles.length; i++) {
      if (userValue >= data.percentiles[i]) {
        percentile = ((i + 1) / data.percentiles.length) * 100;
      }
    }

    return {
      user_percentile: Math.round(percentile),
      category_average: data.average,
      user_value: userValue,
      metric,
      sample_size: 1000, // Simulated
    };
  }

  private async calculatePersonalBest(
    userId: string,
    metric: string
  ): Promise<PersonalBest> {
    // Query historical best performance
    const { data, _error } = await this.supabaseService
      .getInstance()
      .client.from('user_analytics_history')
      .select('*')
      .eq('user_id', userId)
      .eq('metric', metric)
      .order('value', { ascending: false })
      .limit(1);

    if (_error || !data || data.length === 0) {
      return {
        metric,
        best_value: 0,
        best_date: new Date().toISOString(),
        current_value: 0,
        improvement_potential: 0,
      };
    }

    const best = data[0];
    const currentValue = 75; // Would get from current analytics

    return {
      metric,
      best_value: best.value,
      best_date: best.date,
      current_value: currentValue,
      improvement_potential: Math.max(0, best.value - currentValue),
    };
  }

  private async calculateSeasonalPatterns(userId: string): Promise<SeasonalPattern[]> {
    // Analyze seasonal patterns in wake times and success rates
    const patterns: SeasonalPattern[] = [
      {
        season: 'spring',
        pattern_type: 'success_rate',
        average_value: 82,
        deviation_from_annual_average: 7,
        significance: 0.8,
      },
      {
        season: 'winter',
        pattern_type: 'wake_time',
        average_value: 7.5, // 7:30 AM average
        deviation_from_annual_average: 0.5, // 30 minutes later
        significance: 0.7,
      },
    ];

    return patterns;
  }

  private async predictOptimalWakeTimes(
    userId: string,
    eventsData: any[]
  ): Promise<OptimalWakeTime[]> {
    const optimal: OptimalWakeTime[] = [];

    // Analyze success by day of week and time
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayEvents = eventsData.filter(event => {
        const date = new Date(_event.fired_at);
        return date.getDay() === dayOfWeek;
      });

      if (dayEvents.length < 3) continue;

      // Find time with highest success rate
      const hourSuccess = new Map<number, { successful: number; total: number }>();

      dayEvents.forEach(event => {
        const hour = new Date(_event.fired_at).getHours();
        const current = hourSuccess.get(hour) || { successful: 0, total: 0 };
        current.total += 1;
        if (event.dismissed && !_event.snoozed) {
          current.successful += 1;
        }
        hourSuccess.set(hour, current);
      });

      let bestHour = 7;
      let bestRate = 0;

      for (const [hour, stats] of hourSuccess.entries()) {
        const rate = stats.successful / stats.total;
        if (rate > bestRate && stats.total >= 2) {
          bestHour = hour;
          bestRate = rate;
        }
      }

      optimal.push({
        day_of_week: dayOfWeek,
        optimal_time: `${bestHour.toString().padStart(2, '0')}:00`,
        confidence: Math.min(
          95,
          Math.max(60, hourSuccess.get(bestHour)?.total * 20 || 60)
        ),
        expected_success_rate: Math.round(bestRate * 100),
        factors: [
          'Historical performance',
          'Day of week pattern',
          'Response time analysis',
        ],
      });
    }

    return optimal;
  }

  private async forecastEffectiveness(
    eventsData: any[],
    trends: UserAnalytics['trends']
  ): Promise<EffectivenessForecast> {
    const recentEvents = eventsData.slice(0, 14); // Last 2 weeks
    const currentRate =
      recentEvents.length > 0
        ? (recentEvents.filter(e => e.dismissed && !e.snoozed).length /
            recentEvents.length) *
          100
        : 70;

    // Simple trend-based prediction
    let prediction = currentRate;

    if (trends.response_time_trend.trend_direction === 'up') {
      prediction -= 10; // Slower response time = lower effectiveness
    } else if (trends.response_time_trend.trend_direction === 'down') {
      prediction += 10;
    }

    return {
      next_week_prediction: Math.max(0, Math.min(100, Math.round(prediction))),
      accuracy_score: 75,
      contributing_factors: [
        {
          factor: 'Response time trend',
          influence_weight: 0.4,
          current_trend:
            trends.response_time_trend.trend_direction === 'down'
              ? 'positive'
              : 'negative',
        },
        {
          factor: 'Sleep quality trend',
          influence_weight: 0.3,
          current_trend:
            trends.sleep_quality_trend.trend_direction === 'up'
              ? 'positive'
              : 'neutral',
        },
        {
          factor: 'Consistency pattern',
          influence_weight: 0.3,
          current_trend:
            trends.wake_time_consistency.trend_direction === 'up'
              ? 'positive'
              : 'neutral',
        },
      ],
    };
  }

  private async generateSleepRecommendations(
    sleepData: any[],
    eventsData: any[]
  ): Promise<SleepRecommendation[]> {
    const recommendations: SleepRecommendation[] = [];

    if (sleepData.length > 0) {
      const avgDuration =
        sleepData.reduce((sum, session) => sum + session.total_duration, 0) /
        sleepData.length;

      if (avgDuration < 420) {
        // Less than 7 hours
        recommendations.push({
          type: 'duration',
          current_value: Math.round((avgDuration / 60) * 10) / 10,
          recommended_value: 8.0,
          expected_improvement: 15,
          rationale:
            'Increasing sleep duration can improve morning alertness and alarm responsiveness',
          difficulty: 'moderate',
        });
      }

      const avgEfficiency =
        sleepData.reduce((sum, session) => sum + (session.sleep_efficiency || 80), 0) /
        sleepData.length;

      if (avgEfficiency < 85) {
        recommendations.push({
          type: 'consistency',
          current_value: Math.round(avgEfficiency),
          recommended_value: 90,
          expected_improvement: 20,
          rationale:
            'Consistent sleep schedule improves sleep efficiency and wake-up success',
          difficulty: 'challenging',
        });
      }
    }

    return recommendations;
  }

  private calculateAverageResponseTime(events: any[]): number {
    const withResponseTime = events.filter(e => e.response_time);
    return withResponseTime.length > 0
      ? Math.round(
          withResponseTime.reduce((sum, e) => sum + e.response_time, 0) /
            withResponseTime.length
        )
      : 0;
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    // Calculate consecutive successful wake-ups
    const { data, _error } = await this.supabaseService
      .getInstance()
      .client.from('alarm_events')
      .select(
        `
        dismissed,
        snoozed,
        fired_at,
        alarms!inner(user_id)
      `
      )
      .eq('alarms.user_id', userId)
      .order('fired_at', { ascending: false })
      .limit(30);

    if (_error || !data) return 0;

    let streak = 0;
    for (const _event of data) {
      if (event.dismissed && !_event.snoozed) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private getMostEffectiveVoice(events: any[]): string {
    const moodCounts = new Map<string, { successful: number; total: number }>();

    events.forEach(event => {
      const mood = _event.alarms?.voice_mood || 'motivational';
      const current = moodCounts.get(mood) || { successful: 0, total: 0 };
      current.total += 1;
      if (event.dismissed && !_event.snoozed) {
        current.successful += 1;
      }
      moodCounts.set(mood, current);
    });

    let bestMood = 'motivational';
    let bestRate = 0;

    for (const [mood, stats] of moodCounts.entries()) {
      const rate = stats.total > 0 ? stats.successful / stats.total : 0;
      if (rate > bestRate && stats.total > 0) {
        bestMood = mood;
        bestRate = rate;
      }
    }

    return bestMood;
  }

  private async generateQuickActions(
    userId: string,
    liveMetrics: any,
    insights: AnalyticsInsight[]
  ): Promise<any[]> {
    const actions = [];

    if (liveMetrics.successfulWakeups === 0 && liveMetrics.todayAlarms > 0) {
      actions.push({
        id: 'adjust_voice',
        title: 'Try Different Voice Mood',
        description: 'Switch to a more effective voice for better results',
        action: 'adjust_settings',
        priority: 'high',
      });
    }

    if (liveMetrics.avgResponseTime > 120) {
      actions.push({
        id: 'reduce_response_time',
        title: 'Improve Response Time',
        description: 'Tips to wake up faster when your alarm goes off',
        action: 'view_tips',
        priority: 'medium',
      });
    }

    if (insights.length > 0) {
      actions.push({
        id: 'view_insights',
        title: 'Review Personalized Insights',
        description: `${insights.length} new insights available`,
        action: 'view_insights',
        priority: 'medium',
      });
    }

    return actions;
  }
}

export default AdvancedAnalyticsService;
