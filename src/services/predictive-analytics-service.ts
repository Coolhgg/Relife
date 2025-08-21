import type {
  User,
  SleepPattern,
  WakeUpBehavior,
  AIOptimization,
  SchedulingRecommendation,
  PatternInsight
} from '../types/index';
import { Preferences } from '@capacitor/preferences';
import MLAlarmOptimizer from './ml-alarm-optimizer';
import EnhancedLocationService from './enhanced-location-service';

const ANALYTICS_CONFIG_KEY = 'predictive_analytics_config';
const PATTERNS_CACHE_KEY = 'detected_patterns';
const PREDICTIONS_CACHE_KEY = 'predictions_cache';
const INSIGHTS_HISTORY_KEY = 'insights_history';

interface AnalyticsConfig {
  enabled: boolean;
  analysisFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  patternConfidenceThreshold: number;
  predictionHorizonDays: number;
  maxInsightsHistory: number;
  enableLearning: boolean;
  personalizedRecommendations: boolean;
}

interface DetectedPattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  trend: 'improving' | 'declining' | 'stable' | 'emerging';
  dataPoints: number;
  firstDetected: Date;
  lastUpdated: Date;
  metrics: Record<string, number>;
  context: PatternContext;
}

type PatternType =
  | 'wake_consistency'
  | 'snooze_behavior'
  | 'seasonal_adjustment'
  | 'location_influence'
  | 'weather_sensitivity'
  | 'calendar_correlation'
  | 'sleep_quality_impact'
  | 'energy_level_pattern'
  | 'difficulty_optimization'
  | 'voice_mood_preference';

interface PatternContext {
  timeFrame: string;
  conditions: string[];
  correlations: Array<{ factor: string; strength: number }>;
  anomalies: string[];
}

interface PredictiveInsight {
  id: string;
  userId: string;
  type: 'optimization' | 'warning' | 'trend' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  actionable: boolean;
  suggestedActions: string[];
  impact: 'minimal' | 'moderate' | 'significant' | 'major';
  timeframe: string;
  data: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  applied?: Date;
  feedback?: 'helpful' | 'not_helpful' | 'partially_helpful';
}

interface TrendAnalysis {
  metric: string;
  direction: 'up' | 'down' | 'stable' | 'volatile';
  magnitude: number;
  confidence: number;
  timeframe: string;
  description: string;
  projectedValue?: number;
  projectedDate?: Date;
}

export class PredictiveAnalyticsService {
  private static config: AnalyticsConfig = {
    enabled: true,
    analysisFrequency: 'weekly',
    patternConfidenceThreshold: 0.6,
    predictionHorizonDays: 30,
    maxInsightsHistory: 200,
    enableLearning: true,
    personalizedRecommendations: true
  };

  private static detectedPatterns: Map<string, DetectedPattern> = new Map();
  private static insightsHistory: PredictiveInsight[] = [];
  private static analysisSchedule: number | null = null;
  private static lastAnalysisDate: Date | null = null;

  // ===== INITIALIZATION =====

  static async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadDetectedPatterns();
      await this.loadInsightsHistory();

      if (this.config.enabled) {
        await this.startAnalysisSchedule();
        await this.runInitialAnalysis();
      }

      console.log('Predictive Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize Predictive Analytics:', error);
    }
  }

  private static async loadConfig(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: ANALYTICS_CONFIG_KEY });
      if (value) {
        this.config = { ...this.config, ...JSON.parse(value) };
      }
    } catch (error) {
      console.error('Error loading analytics config:', error);
    }
  }

  private static async loadDetectedPatterns(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: PATTERNS_CACHE_KEY });
      if (value) {
        const data = JSON.parse(value);
        this.detectedPatterns = new Map(Object.entries(data).map(([k, v]) => [k, {
          ...v as any,
          firstDetected: new Date((v as any).firstDetected),
          lastUpdated: new Date((v as any).lastUpdated)
        }]));
      }
    } catch (error) {
      console.error('Error loading detected patterns:', error);
    }
  }

  private static async loadInsightsHistory(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: INSIGHTS_HISTORY_KEY });
      if (value) {
        const data = JSON.parse(value);
        this.insightsHistory = data.map((insight: any) => ({
          ...insight,
          createdAt: new Date(insight.createdAt),
          expiresAt: insight.expiresAt ? new Date(insight.expiresAt) : undefined,
          applied: insight.applied ? new Date(insight.applied) : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading insights history:', error);
    }
  }

  // ===== PATTERN DETECTION =====

  static async analyzeUserPatterns(
    userId: string,
    behaviors: WakeUpBehavior[],
  ): Promise<DetectedPattern[]> {
    try {
      const patterns: DetectedPattern[] = [];

      // Analyze different pattern types
      patterns.push(...await this.detectWakeConsistencyPatterns(behaviors));
      patterns.push(...await this.detectSnoozeBehaviorPatterns(behaviors));
      patterns.push(...await this.detectSeasonalPatterns(behaviors));
      patterns.push(...await this.detectLocationInfluencePatterns(userId, behaviors));
      patterns.push(...await this.detectWeatherSensitivityPatterns(behaviors));
      patterns.push(...await this.detectCalendarCorrelationPatterns(behaviors));
      patterns.push(...await this.detectSleepQualityImpactPatterns(behaviors));
      patterns.push(...await this.detectEnergyLevelPatterns(behaviors));
      patterns.push(...await this.detectDifficultyOptimizationPatterns(behaviors));
      patterns.push(...await this.detectVoiceMoodPreferences(behaviors));

      // Filter by confidence threshold
      const validPatterns = patterns.filter(p => p.confidence >= this.config.patternConfidenceThreshold);

      // Update detected patterns cache
      for (const pattern of validPatterns) {
        this.detectedPatterns.set(pattern.id, pattern);
      }

      await this.saveDetectedPatterns();
      return validPatterns;

    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      return [];
    }
  }

  private static async detectWakeConsistencyPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    if (behaviors.length < 7) return patterns; // Need at least a week of data

    // Group by day of week
    const dayGroups: Record<string, WakeUpBehavior[]> = {};
    behaviors.forEach(b => {
      const day = new Date(b.date).getDay().toString();
      dayGroups[day] = dayGroups[day] || [];
      dayGroups[day].push(b);
    });

    // Calculate consistency for each day
    const consistencyScores: Record<string, number> = {};
    const avgWakeTimes: Record<string, number> = {};

    for (const [day, dayBehaviors] of Object.entries(dayGroups)) {
      if (dayBehaviors.length < 3) continue;

      const wakeTimes = dayBehaviors.map(b => this.timeToMinutes(b.actualWakeTime));
      const avgTime = wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
      const variance = wakeTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / wakeTimes.length;
      const consistency = Math.max(0, 1 - Math.sqrt(variance) / 60); // Normalize by 1 hour

      consistencyScores[day] = consistency;
      avgWakeTimes[day] = avgTime;
    }

    // Detect overall consistency pattern
    const avgConsistency = Object.values(consistencyScores).reduce((sum, score) => sum + score, 0) / Object.values(consistencyScores).length;

    if (avgConsistency > 0.7) {
      patterns.push({
        id: this.generatePatternId('wake_consistency'),
        type: 'wake_consistency',
        name: 'Consistent Wake Times',
        description: `You maintain consistent wake times with ${Math.round(avgConsistency * 100)}% regularity`,
        confidence: avgConsistency,
        frequency: behaviors.length,
        trend: this.calculateTrend(consistencyScores),
        dataPoints: behaviors.length,
        firstDetected: new Date(Math.min(...behaviors.map(b => new Date(b.date).getTime()))),
        lastUpdated: new Date(),
        metrics: { avgConsistency, ...consistencyScores },
        context: {
          timeFrame: `${behaviors.length} days`,
          conditions: Object.entries(avgWakeTimes).map(([day, time]) =>
            `${this.getDayName(parseInt(day))}: ${this.minutesToTime(time)}`
          ),
          correlations: [],
          anomalies: this.findConsistencyAnomalies(consistencyScores)
        }
      });
    }

    return patterns;
  }

  private static async detectSnoozeBehaviorPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    const snoozeData = behaviors.filter(b => b.snoozeCount > 0);
    if (snoozeData.length < 5) return patterns;

    const avgSnoozeCount = snoozeData.reduce((sum, b) => sum + b.snoozeCount, 0) / snoozeData.length;
    const snoozeFrequency = snoozeData.length / behaviors.length;

    // Detect snooze patterns by day of week
    const weekdaySnoozes = snoozeData.filter(b => {
      const day = new Date(b.date).getDay();
      return day >= 1 && day <= 5;
    });

    const weekendSnoozes = snoozeData.filter(b => {
      const day = new Date(b.date).getDay();
      return day === 0 || day === 6;
    });

    let description = `You snooze ${Math.round(snoozeFrequency * 100)}% of the time, averaging ${avgSnoozeCount.toFixed(1)} snoozes`;
    const conditions = [`Snooze frequency: ${Math.round(snoozeFrequency * 100)}%`];

    if (weekdaySnoozes.length > 0 && weekendSnoozes.length > 0) {
      const weekdayAvg = weekdaySnoozes.reduce((sum, b) => sum + b.snoozeCount, 0) / weekdaySnoozes.length;
      const weekendAvg = weekendSnoozes.reduce((sum, b) => sum + b.snoozeCount, 0) / weekendSnoozes.length;

      if (weekdayAvg > weekendAvg * 1.5) {
        description += '. Higher snoozing on weekdays suggests work stress or insufficient sleep';
        conditions.push('Weekday snooze pattern detected');
      }
    }

    patterns.push({
      id: this.generatePatternId('snooze_behavior'),
      type: 'snooze_behavior',
      name: 'Snooze Usage Pattern',
      description,
      confidence: Math.min(0.95, snoozeData.length / 10),
      frequency: snoozeData.length,
      trend: this.calculateSnoozeTrend(behaviors),
      dataPoints: behaviors.length,
      firstDetected: new Date(Math.min(...behaviors.map(b => new Date(b.date).getTime()))),
      lastUpdated: new Date(),
      metrics: { avgSnoozeCount, snoozeFrequency },
      context: {
        timeFrame: `${behaviors.length} days`,
        conditions,
        correlations: this.findSnoozeCorrelations(behaviors),
        anomalies: []
      }
    });

    return patterns;
  }

  private static async detectSeasonalPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    if (behaviors.length < 30) return patterns; // Need at least a month of data

    // Group by month
    const monthGroups: Record<string, WakeUpBehavior[]> = {};
    behaviors.forEach(b => {
      const month = new Date(b.date).getMonth().toString();
      monthGroups[month] = monthGroups[month] || [];
      monthGroups[month].push(b);
    });

    if (Object.keys(monthGroups).length < 2) return patterns;

    // Calculate average wake times by month
    const monthlyAverages: Record<string, number> = {};
    for (const [month, monthBehaviors] of Object.entries(monthGroups)) {
      const wakeTimes = monthBehaviors.map(b => this.timeToMinutes(b.actualWakeTime));
      monthlyAverages[month] = wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
    }

    // Detect seasonal variation
    const times = Object.values(monthlyAverages);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxVariation = Math.max(...times.map(time => Math.abs(time - avgTime)));

    if (maxVariation > 20) { // 20+ minute seasonal variation
      const winterMonths = [11, 0, 1]; // Dec, Jan, Feb
      const summerMonths = [5, 6, 7]; // Jun, Jul, Aug

      const winterAvg = this.calculateSeasonalAverage(monthlyAverages, winterMonths);
      const summerAvg = this.calculateSeasonalAverage(monthlyAverages, summerMonths);

      let seasonalDescription = 'Seasonal wake time variation detected';
      if (winterAvg && summerAvg) {
        const diff = winterAvg - summerAvg;
        seasonalDescription = diff > 0
          ? `You wake ${Math.abs(diff).toFixed(0)} minutes later in winter than summer`
          : `You wake ${Math.abs(diff).toFixed(0)} minutes earlier in winter than summer`;
      }

      patterns.push({
        id: this.generatePatternId('seasonal_adjustment'),
        type: 'seasonal_adjustment',
        name: 'Seasonal Wake Time Pattern',
        description: seasonalDescription,
        confidence: Math.min(0.9, maxVariation / 60), // Higher variation = higher confidence
        frequency: behaviors.length,
        trend: 'stable',
        dataPoints: behaviors.length,
        firstDetected: new Date(Math.min(...behaviors.map(b => new Date(b.date).getTime()))),
        lastUpdated: new Date(),
        metrics: { maxVariation, winterAvg, summerAvg },
        context: {
          timeFrame: `${Object.keys(monthGroups).length} months`,
          conditions: Object.entries(monthlyAverages).map(([month, avg]) =>
            `${this.getMonthName(parseInt(month))}: ${this.minutesToTime(avg)}`
          ),
          correlations: [{ factor: 'daylight_hours', strength: 0.7 }],
          anomalies: []
        }
      });
    }

    return patterns;
  }

  private static async detectLocationInfluencePatterns(userId: string, behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    try {
      const locationPatterns = EnhancedLocationService.getLocationPatterns();
      if (locationPatterns.length === 0) return patterns;

      // Group behaviors by location (simplified - would need actual location data per behavior)
      const homePattern = locationPatterns.find(p => p.type === 'home');
      const workPattern = locationPatterns.find(p => p.type === 'work');

      if (homePattern && workPattern) {
        // Simulate location-based analysis
        const homeBehaviors = behaviors.filter(b => new Date(b.date).getDay() === 0 || new Date(b.date).getDay() === 6);
        const workBehaviors = behaviors.filter(b => new Date(b.date).getDay() >= 1 && new Date(b.date).getDay() <= 5);

        if (homeBehaviors.length > 3 && workBehaviors.length > 3) {
          const homeAvgWake = homeBehaviors.reduce((sum, b) => sum + this.timeToMinutes(b.actualWakeTime), 0) / homeBehaviors.length;
          const workAvgWake = workBehaviors.reduce((sum, b) => sum + this.timeToMinutes(b.actualWakeTime), 0) / workBehaviors.length;

          const timeDiff = Math.abs(homeAvgWake - workAvgWake);

          if (timeDiff > 30) { // 30+ minute difference
            patterns.push({
              id: this.generatePatternId('location_influence'),
              type: 'location_influence',
              name: 'Location-Based Wake Times',
              description: `Your wake times vary by ${timeDiff.toFixed(0)} minutes between home and work days`,
              confidence: 0.8,
              frequency: behaviors.length,
              trend: 'stable',
              dataPoints: behaviors.length,
              firstDetected: new Date(Math.min(...behaviors.map(b => new Date(b.date).getTime()))),
              lastUpdated: new Date(),
              metrics: { homeAvgWake, workAvgWake, timeDiff },
              context: {
                timeFrame: `${behaviors.length} days`,
                conditions: [
                  `Home days: ${this.minutesToTime(homeAvgWake)}`,
                  `Work days: ${this.minutesToTime(workAvgWake)}`
                ],
                correlations: [{ factor: 'location_type', strength: 0.8 }],
                anomalies: []
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error detecting location influence patterns:', error);
    }

    return patterns;
  }

  private static async detectWeatherSensitivityPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    // Simulate weather correlation analysis
    const rainyDays = behaviors.filter(b => b.context?.weather?.includes('rain'));
    const sunnyDays = behaviors.filter(b => b.context?.weather?.includes('sun'));

    if (rainyDays.length > 3 && sunnyDays.length > 3) {
      const rainyAvgWake = rainyDays.reduce((sum, b) => sum + this.timeToMinutes(b.actualWakeTime), 0) / rainyDays.length;
      const sunnyAvgWake = sunnyDays.reduce((sum, b) => sum + this.timeToMinutes(b.actualWakeTime), 0) / sunnyDays.length;

      const timeDiff = rainyAvgWake - sunnyAvgWake;

      if (Math.abs(timeDiff) > 15) { // 15+ minute difference
        patterns.push({
          id: this.generatePatternId('weather_sensitivity'),
          type: 'weather_sensitivity',
          name: 'Weather-Sensitive Wake Times',
          description: timeDiff > 0
            ? `You wake ${Math.abs(timeDiff).toFixed(0)} minutes later on rainy days`
            : `You wake ${Math.abs(timeDiff).toFixed(0)} minutes earlier on rainy days`,
          confidence: 0.7,
          frequency: rainyDays.length + sunnyDays.length,
          trend: 'stable',
          dataPoints: behaviors.length,
          firstDetected: new Date(Math.min(...behaviors.map(b => new Date(b.date).getTime()))),
          lastUpdated: new Date(),
          metrics: { rainyAvgWake, sunnyAvgWake, timeDiff },
          context: {
            timeFrame: `${behaviors.length} days`,
            conditions: [
              `Rainy days: ${this.minutesToTime(rainyAvgWake)}`,
              `Sunny days: ${this.minutesToTime(sunnyAvgWake)}`
            ],
            correlations: [{ factor: 'weather_condition', strength: 0.7 }],
            anomalies: []
          }
        });
      }
    }

    return patterns;
  }

  // Additional pattern detection methods would continue here...
  private static async detectCalendarCorrelationPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    // Implementation for calendar correlation patterns
    return [];
  }

  private static async detectSleepQualityImpactPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    // Implementation for sleep quality impact patterns
    return [];
  }

  private static async detectEnergyLevelPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    // Implementation for energy level patterns
    return [];
  }

  private static async detectDifficultyOptimizationPatterns(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    // Implementation for difficulty optimization patterns
    return [];
  }

  private static async detectVoiceMoodPreferences(behaviors: WakeUpBehavior[]): Promise<DetectedPattern[]> {
    // Implementation for voice mood preference patterns
    return [];
  }

  // ===== PREDICTIVE INSIGHTS =====

  static async generatePredictiveInsights(
    userId: string,
  ): Promise<PredictiveInsight[]> {
    try {
      const insights: PredictiveInsight[] = [];
      const patterns = Array.from(this.detectedPatterns.values());

      // Generate insights based on detected patterns
      for (const pattern of patterns) {
        const patternInsights = await this.generateInsightsFromPattern(userId, pattern, alarms);
        insights.push(...patternInsights);
      }

      // Generate trend-based insights
      const trendInsights = await this.generateTrendInsights(userId, alarms);
      insights.push(...trendInsights);

      // Generate optimization insights
      const optimizationInsights = await this.generateOptimizationInsights(userId, alarms);
      insights.push(...optimizationInsights);

      // Filter and prioritize insights
      const validInsights = insights
        .filter(insight => insight.confidence > 0.5)
        .sort((a, b) => this.calculateInsightPriority(b) - this.calculateInsightPriority(a))
        .slice(0, 10); // Limit to top 10 insights

      // Add to history
      this.insightsHistory.push(...validInsights);

      // Maintain history size
      if (this.insightsHistory.length > this.config.maxInsightsHistory) {
        this.insightsHistory = this.insightsHistory.slice(-this.config.maxInsightsHistory);
      }

      await this.saveInsightsHistory();
      return validInsights;

    } catch (error) {
      console.error('Error generating predictive insights:', error);
      return [];
    }
  }

  private static async generateInsightsFromPattern(
    userId: string,
    pattern: DetectedPattern,
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    const now = new Date();

    switch (pattern.type) {
      case 'wake_consistency':
        if (pattern.confidence > 0.8 && pattern.trend === 'declining') {
          insights.push({
            id: this.generateInsightId(),
            userId,
            type: 'warning',
            title: 'Wake Time Consistency Declining',
            description: 'Your wake time consistency has decreased recently. This might affect your sleep quality and energy levels.',
            confidence: pattern.confidence,
            priority: 'medium',
            category: 'sleep_health',
            actionable: true,
            suggestedActions: [
              'Try to maintain the same bedtime every night',
              'Consider using a smart alarm that wakes you during light sleep',
              'Review your evening routine for consistency'
            ],
            impact: 'moderate',
            timeframe: 'next_week',
            data: { pattern: pattern.metrics },
            createdAt: now
          });
        }
        break;

      case 'snooze_behavior':
        if (pattern.metrics.avgSnoozeCount > 2) {
          insights.push({
            id: this.generateInsightId(),
            userId,
            type: 'optimization',
            title: 'High Snooze Usage Detected',
            description: `You average ${pattern.metrics.avgSnoozeCount.toFixed(1)} snoozes per alarm. This suggests your current wake time might not align with your natural sleep cycle.`,
            confidence: pattern.confidence,
            priority: 'high',
            category: 'alarm_optimization',
            actionable: true,
            suggestedActions: [
              'Try moving your bedtime 30 minutes earlier',
              'Experiment with waking up 15 minutes earlier to align with sleep cycles',
              'Consider increasing alarm difficulty to reduce snooze temptation'
            ],
            impact: 'significant',
            timeframe: 'next_two_weeks',
            data: { pattern: pattern.metrics },
            createdAt: now
          });
        }
        break;

      case 'seasonal_adjustment':
        const currentMonth = now.getMonth();
        const isWinter = currentMonth >= 11 || currentMonth <= 1;
        const isTransition = currentMonth === 2 || currentMonth === 3 || currentMonth === 8 || currentMonth === 9;

        if (isTransition && pattern.metrics.maxVariation > 30) {
          insights.push({
            id: this.generateInsightId(),
            userId,
            type: 'recommendation',
            title: 'Seasonal Adjustment Opportunity',
            description: 'Based on your seasonal patterns, consider adjusting your alarm times for the changing season.',
            confidence: pattern.confidence,
            priority: 'medium',
            category: 'seasonal_optimization',
            actionable: true,
            suggestedActions: [
              isWinter ? 'Gradually shift wake time later for winter comfort' : 'Gradually shift wake time earlier for spring energy',
              'Consider using light therapy in darker months',
              'Adjust your evening routine for the new season'
            ],
            impact: 'moderate',
            timeframe: 'next_month',
            data: { pattern: pattern.metrics, currentSeason: isWinter ? 'winter' : 'spring' },
            createdAt: now,
            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
          });
        }
        break;
    }

    return insights;
  }

  private static async generateTrendInsights(
    userId: string,
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    // Implementation for trend-based insights would go here
    return insights;
  }

  private static async generateOptimizationInsights(
    userId: string,
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Analyze alarm frequency and distribution
    const activeAlarms = alarms.filter(a => a.enabled);
    if (activeAlarms.length > 5) {
      insights.push({
        id: this.generateInsightId(),
        userId,
        type: 'optimization',
        title: 'Multiple Alarm Optimization',
        description: `You have ${activeAlarms.length} active alarms. Consider consolidating similar alarms for better sleep consistency.`,
        confidence: 0.8,
        priority: 'medium',
        category: 'alarm_management',
        actionable: true,
        suggestedActions: [
          'Review alarms with similar times and merge if possible',
          'Use advanced scheduling instead of multiple daily alarms',
          'Consider using conditional alarms for varying schedules'
        ],
        impact: 'moderate',
        timeframe: 'this_week',
        data: { alarmCount: activeAlarms.length },
        createdAt: new Date()
      });
    }

    return insights;
  }

  // ===== UTILITY METHODS =====

  private static calculateInsightPriority(insight: PredictiveInsight): number {
    const priorityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const impactScores = { major: 4, significant: 3, moderate: 2, minimal: 1 };

    return (priorityScores[insight.priority] * 2) +
           (impactScores[insight.impact] * 1.5) +
           (insight.confidence * 2);
  }

  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  private static getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  }

  private static calculateTrend(scores: Record<string, number>): DetectedPattern['trend'] {
    const values = Object.values(scores);
    if (values.length < 2) return 'stable';

    const recent = values.slice(-3).reduce((sum, v) => sum + v, 0) / Math.min(3, values.length);
    const older = values.slice(0, -3).reduce((sum, v) => sum + v, 0) / Math.max(1, values.length - 3);

    const diff = recent - older;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  }

  private static calculateSnoozeTrend(behaviors: WakeUpBehavior[]): DetectedPattern['trend'] {
    if (behaviors.length < 14) return 'stable';

    const recent = behaviors.slice(-7);
    const older = behaviors.slice(-14, -7);

    const recentAvgSnooze = recent.reduce((sum, b) => sum + b.snoozeCount, 0) / recent.length;
    const olderAvgSnooze = older.reduce((sum, b) => sum + b.snoozeCount, 0) / older.length;

    const diff = recentAvgSnooze - olderAvgSnooze;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'declining' : 'improving';
  }

  private static findConsistencyAnomalies(scores: Record<string, number>): string[] {
    const anomalies: string[] = [];
    const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;

    for (const [day, score] of Object.entries(scores)) {
      if (score < avgScore - 0.3) {
        anomalies.push(`${this.getDayName(parseInt(day))} shows lower consistency`);
      }
    }

    return anomalies;
  }

  private static findSnoozeCorrelations(behaviors: WakeUpBehavior[]): Array<{ factor: string; strength: number }> {
    const correlations: Array<{ factor: string; strength: number }> = [];

    // Analyze correlation with day of week
    const weekdaySnoozes = behaviors.filter(b => {
      const day = new Date(b.date).getDay();
      return day >= 1 && day <= 5;
    });
    const weekendSnoozes = behaviors.filter(b => {
      const day = new Date(b.date).getDay();
      return day === 0 || day === 6;
    });

    if (weekdaySnoozes.length > 0 && weekendSnoozes.length > 0) {
      const weekdayAvg = weekdaySnoozes.reduce((sum, b) => sum + b.snoozeCount, 0) / weekdaySnoozes.length;
      const weekendAvg = weekendSnoozes.reduce((sum, b) => sum + b.snoozeCount, 0) / weekendSnoozes.length;

      const correlation = Math.abs(weekdayAvg - weekendAvg) / Math.max(weekdayAvg, weekendAvg);
      if (correlation > 0.3) {
        correlations.push({ factor: 'day_of_week', strength: correlation });
      }
    }

    return correlations;
  }

  private static calculateSeasonalAverage(monthlyAverages: Record<string, number>, months: number[]): number | null {
    const seasonalTimes = months
      .filter(month => monthlyAverages[month.toString()] !== undefined)
      .map(month => monthlyAverages[month.toString()]);

    if (seasonalTimes.length === 0) return null;
    return seasonalTimes.reduce((sum, time) => sum + time, 0) / seasonalTimes.length;
  }

  private static generatePatternId(type: string): string {
    return `pattern_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async runInitialAnalysis(): Promise<void> {
    // Run initial pattern analysis if enough data is available
    console.log('Running initial predictive analysis...');
  }

  private static async startAnalysisSchedule(): Promise<void> {
    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      biweekly: 14 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[this.config.analysisFrequency];

    this.analysisSchedule = setInterval(async () => {
      try {
        await this.runScheduledAnalysis();
      } catch (error) {
        console.error('Error in scheduled analysis:', error);
      }
    }, interval) as unknown as number;
  }

  private static async runScheduledAnalysis(): Promise<void> {
    console.log('Running scheduled predictive analysis...');
    this.lastAnalysisDate = new Date();
    // Implementation for scheduled analysis
  }

  // ===== STORAGE METHODS =====

  private static async saveDetectedPatterns(): Promise<void> {
    try {
      const dataObject = Object.fromEntries(this.detectedPatterns);
      await Preferences.set({
        key: PATTERNS_CACHE_KEY,
        value: JSON.stringify(dataObject)
      });
    } catch (error) {
      console.error('Error saving detected patterns:', error);
    }
  }

  private static async saveInsightsHistory(): Promise<void> {
    try {
      await Preferences.set({
        key: INSIGHTS_HISTORY_KEY,
        value: JSON.stringify(this.insightsHistory)
      });
    } catch (error) {
      console.error('Error saving insights history:', error);
    }
  }

  // ===== PUBLIC API =====

  static async enablePredictiveAnalytics(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;

    if (enabled) {
      await this.startAnalysisSchedule();
    } else if (this.analysisSchedule) {
      clearInterval(this.analysisSchedule);
      this.analysisSchedule = null;
    }

    await Preferences.set({
      key: ANALYTICS_CONFIG_KEY,
      value: JSON.stringify(this.config)
    });
  }

  static getDetectedPatterns(): DetectedPattern[] {
    return Array.from(this.detectedPatterns.values());
  }

  static getInsightsHistory(): PredictiveInsight[] {
    return [...this.insightsHistory];
  }

  static getRecentInsights(days: number = 7): PredictiveInsight[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.insightsHistory.filter(insight => insight.createdAt >= cutoff);
  }

  static async markInsightApplied(insightId: string): Promise<void> {
    const insight = this.insightsHistory.find(i => i.id === insightId);
    if (insight) {
      insight.applied = new Date();
      await this.saveInsightsHistory();
    }
  }

  static async provideFeedback(insightId: string, feedback: PredictiveInsight['feedback']): Promise<void> {
    const insight = this.insightsHistory.find(i => i.id === insightId);
    if (insight) {
      insight.feedback = feedback;
      await this.saveInsightsHistory();
    }
  }

  static getAnalyticsStats(): {
    patterns: number;
    insights: number;
    lastAnalysis: Date | null;
    isEnabled: boolean;
  } {
    return {
      patterns: this.detectedPatterns.size,
      insights: this.insightsHistory.length,
      lastAnalysis: this.lastAnalysisDate,
      isEnabled: this.config.enabled
    };
  }

  static isAnalyticsEnabled(): boolean {
    return this.config.enabled;
  }
}

export default PredictiveAnalyticsService;