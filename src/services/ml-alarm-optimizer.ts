import type {
  User,
  SleepPattern,
  WakeUpBehavior,
  LearningData,
  AIOptimization,
  Location,
  WeatherData
} from '../types/index';
import { Preferences } from '@capacitor/preferences';
import { Geolocation } from '@capacitor/geolocation';

const ML_CONFIG_KEY = 'ml_optimization_config';
const USER_BEHAVIOR_DATA_KEY = 'user_behavior_data';
const PREDICTION_CACHE_KEY = 'prediction_cache';

interface MLConfig {
  enabled: boolean;
  learningRate: number;
  minDataPoints: number;
  confidenceThreshold: number;
  adaptationSpeed: 'slow' | 'medium' | 'fast';
  features: string[];
}

interface UserBehaviorPattern {
  id: string;
  userId: string;
  patternType: 'wake_time' | 'snooze_behavior' | 'dismiss_method' | 'sleep_quality' | 'location';
  data: Record<string, any>;
  confidence: number;
  lastUpdated: Date;
  occurrences: number;
}

interface PredictionResult {
  optimalWakeTime: string;
  confidence: number;
  reasoning: string[];
  adjustmentMinutes: number;
  factors: PredictionFactor[];
}

interface PredictionFactor {
  type: 'sleep_cycle' | 'weather' | 'calendar' | 'historical' | 'location' | 'health';
  impact: number; // -1 to 1
  confidence: number;
  description: string;
}

export class MLAlarmOptimizer {
  private static config: MLConfig = {
    enabled: true,
    learningRate: 0.1,
    minDataPoints: 5,
    confidenceThreshold: 0.7,
    adaptationSpeed: 'medium',
    features: ['wake_time', 'sleep_duration', 'snooze_count', 'mood', 'weather', 'day_of_week']
  };

  private static behaviorData: Map<string, UserBehaviorPattern[]> = new Map();
  private static predictionCache: Map<string, PredictionResult> = new Map();

  // ===== INITIALIZATION =====

  static async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadBehaviorData();
      await this.startLearningProcess();
    } catch (error) {
      console.error('Failed to initialize ML Optimizer:', error);
    }
  }

  private static async loadConfig(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: ML_CONFIG_KEY });
      if (value) {
        this.config = { ...this.config, ...JSON.parse(value) };
      }
    } catch (error) {
      console.error('Error loading ML config:', error);
    }
  }

  private static async loadBehaviorData(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: USER_BEHAVIOR_DATA_KEY });
      if (value) {
        const data = JSON.parse(value);
        this.behaviorData = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading behavior data:', error);
    }
  }

  // ===== LEARNING & PREDICTION =====

  static async recordUserBehavior(
    userId: string,
    behaviorType: UserBehaviorPattern['patternType'],
    data: Record<string, any>
  ): Promise<void> {
    try {
      const patterns = this.behaviorData.get(userId) || [];

      // Find existing pattern or create new one
      let pattern = patterns.find(p => p.patternType === behaviorType);
      if (!pattern) {
        pattern = {
          id: this.generatePatternId(),
          userId,
          patternType: behaviorType,
          data: {},
          confidence: 0,
          lastUpdated: new Date(),
          occurrences: 0
        };
        patterns.push(pattern);
      }

      // Update pattern with new data using exponential moving average
      const alpha = this.config.learningRate;
      pattern.occurrences++;
      pattern.lastUpdated = new Date();

      // Merge new data with existing pattern
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          pattern.data[key] = pattern.data[key]
            ? (1 - alpha) * pattern.data[key] + alpha * value
            : value;
        } else {
          pattern.data[key] = value;
        }
      }

      // Update confidence based on data points
      pattern.confidence = Math.min(0.95, pattern.occurrences / (this.config.minDataPoints * 2));

      this.behaviorData.set(userId, patterns);
      await this.saveBehaviorData();

      // Clear prediction cache for this user
      this.clearUserPredictionCache(userId);

    } catch (error) {
      console.error('Error recording user behavior:', error);
    }
  }

  static async predictOptimalWakeTime(
    userId: string,
    targetDate: Date,
  ): Promise<PredictionResult> {
    try {
      const cacheKey = `${userId}_${alarm.id}_${targetDate.toDateString()}`;

      // Check cache first
      if (this.predictionCache.has(cacheKey)) {
        return this.predictionCache.get(cacheKey)!;
      }

      const factors = await this.analyzePredictionFactors(userId, alarm, targetDate);
      const adjustment = this.calculateOptimalAdjustment(factors);
      const confidence = this.calculatePredictionConfidence(factors);

      const originalTime = alarm.time;
      const [hours, minutes] = originalTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + adjustment;
      const adjustedHours = Math.floor(totalMinutes / 60) % 24;
      const adjustedMinutes = totalMinutes % 60;

      const result: PredictionResult = {
        optimalWakeTime: `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`,
        confidence,
        reasoning: this.generateReasoning(factors),
        adjustmentMinutes: adjustment,
        factors
      };

      // Cache the prediction
      this.predictionCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error predicting optimal wake time:', error);
      return {
        optimalWakeTime: alarm.time,
        confidence: 0,
        reasoning: ['Prediction failed, using original time'],
        adjustmentMinutes: 0,
        factors: []
      };
    }
  }

  // ===== FACTOR ANALYSIS =====

  private static async analyzePredictionFactors(
    userId: string,
    targetDate: Date,
  ): Promise<PredictionFactor[]> {
    const factors: PredictionFactor[] = [];

    // Sleep cycle analysis
    factors.push(await this.analyzeSleepCycleFactor(userId, alarm, targetDate));

    // Historical wake time patterns
    factors.push(await this.analyzeHistoricalFactor(userId, targetDate));

    // Weather impact
    factors.push(await this.analyzeWeatherFactor(alarm, targetDate));

    // Calendar conflicts
    factors.push(await this.analyzeCalendarFactor(userId, alarm, targetDate));

    // Location-based adjustments
    factors.push(await this.analyzeLocationFactor(userId, alarm, targetDate));

    // Health metrics
    factors.push(await this.analyzeHealthFactor(userId, targetDate));

    return factors.filter(f => f.confidence > 0.3);
  }

  private static async analyzeSleepCycleFactor(
    userId: string,
    targetDate: Date,
  ): Promise<PredictionFactor> {
    const patterns = this.behaviorData.get(userId) || [];
    const sleepPattern = patterns.find(p => p.patternType === 'sleep_quality');

    let impact = 0;
    let confidence = 0.5;
    let description = 'Standard sleep cycle optimization';

    if (sleepPattern && sleepPattern.confidence > 0.5) {
      const avgSleepDuration = sleepPattern.data.avgSleepDuration || 8;
      const optimalWakeWindow = sleepPattern.data.optimalWakeWindow || 30;

      // Calculate ideal wake time based on sleep cycles (90 min intervals)
      const cycleLength = 90;
      const [hours, minutes] = alarm.time.split(':').map(Number);
      const currentWakeMinutes = hours * 60 + minutes;

      const nearestCycleEnd = Math.round(currentWakeMinutes / cycleLength) * cycleLength;
      impact = (nearestCycleEnd - currentWakeMinutes) / 60; // Convert to hours
      impact = Math.max(-0.5, Math.min(0.5, impact)); // Limit to ±30 minutes

      confidence = sleepPattern.confidence;
      description = `Optimizing for ${cycleLength}-minute sleep cycles`;
    }

    return {
      type: 'sleep_cycle',
      impact,
      confidence,
      description
    };
  }

  private static async analyzeHistoricalFactor(
    userId: string,
    targetDate: Date
  ): Promise<PredictionFactor> {
    const patterns = this.behaviorData.get(userId) || [];
    const wakeTimePattern = patterns.find(p => p.patternType === 'wake_time');

    let impact = 0;
    let confidence = 0.3;
    let description = 'No historical data available';

    if (wakeTimePattern && wakeTimePattern.confidence > 0.4) {
      const dayOfWeek = targetDate.getDay();
      const historicalTime = wakeTimePattern.data[`day_${dayOfWeek}`];

      if (historicalTime) {
        const [histHours, histMinutes] = historicalTime.split(':').map(Number);
        const historicalMinutes = histHours * 60 + histMinutes;

        // Compare with current alarm time to suggest adjustment
        impact = (historicalMinutes - 420) / 60; // Relative to 7:00 AM baseline
        confidence = wakeTimePattern.confidence;
        description = `Based on your typical ${this.getDayName(dayOfWeek)} wake time`;
      }
    }

    return {
      type: 'historical',
      impact,
      confidence,
      description
    };
  }

  private static async analyzeWeatherFactor(
    targetDate: Date,
  ): Promise<PredictionFactor> {
    try {
      // Simulate weather API call - in production, integrate with weather service
      const weather = await this.getWeatherForecast(targetDate);

      let impact = 0;
      let confidence = 0.6;
      let description = 'Weather conditions normal';

      if (weather) {
        // Darker days (rain/snow) = wake slightly later
        // Sunny days = wake slightly earlier
        if (weather.condition.includes('rain') || weather.condition.includes('snow')) {
          impact = 0.17; // +10 minutes
          description = 'Rainy weather - suggesting slightly later wake time';
        } else if (weather.condition.includes('sunny') || weather.condition.includes('clear')) {
          impact = -0.08; // -5 minutes
          description = 'Clear weather - optimal for early wake';
        }

        // Temperature impact
        if (weather.temperature < 0 || weather.temperature > 30) {
          impact += 0.08; // Extreme temps = slightly later
          description += ' (extreme temperature adjustment)';
        }
      }

      return {
        type: 'weather',
        impact,
        confidence,
        description
      };

    } catch (error) {
      return {
        type: 'weather',
        impact: 0,
        confidence: 0,
        description: 'Weather data unavailable'
      };
    }
  }

  private static async analyzeCalendarFactor(
    userId: string,
    targetDate: Date,
  ): Promise<PredictionFactor> {
    try {
      // Simulate calendar integration - in production, integrate with calendar APIs
      const events = await this.getCalendarEvents(userId, targetDate);

      let impact = 0;
      let confidence = 0.5;
      let description = 'No calendar conflicts';

      if (events && events.length > 0) {
        const firstEvent = events[0];
        const eventTime = new Date(`${targetDate.toDateString()} ${firstEvent.time}`);
        const [alarmHours, alarmMinutes] = alarm.time.split(':').map(Number);
        const alarmTime = new Date(targetDate);
        alarmTime.setHours(alarmHours, alarmMinutes);

        const timeDiff = (eventTime.getTime() - alarmTime.getTime()) / (1000 * 60); // minutes

        if (timeDiff < 60) {
          // Event within 1 hour - suggest earlier wake
          impact = -0.25; // -15 minutes
          description = `Early meeting at ${firstEvent.time} - suggesting earlier wake`;
          confidence = 0.8;
        } else if (timeDiff > 180) {
          // Event more than 3 hours later - can wake slightly later
          impact = 0.08; // +5 minutes
          description = 'Late first meeting - slight adjustment possible';
          confidence = 0.4;
        }
      }

      return {
        type: 'calendar',
        impact,
        confidence,
        description
      };

    } catch (error) {
      return {
        type: 'calendar',
        impact: 0,
        confidence: 0,
        description: 'Calendar integration unavailable'
      };
    }
  }

  private static async analyzeLocationFactor(
    userId: string,
    targetDate: Date,
  ): Promise<PredictionFactor> {
    try {
      const position = await Geolocation.getCurrentPosition();
      const currentLat = position.coords.latitude;
      const currentLon = position.coords.longitude;

      // Get user's typical location patterns
      const patterns = this.behaviorData.get(userId) || [];
      const locationPattern = patterns.find(p => p.patternType === 'location');

      let impact = 0;
      let confidence = 0.4;
      let description = 'Location-based optimization';

      if (locationPattern && locationPattern.data.homeLocation) {
        const { latitude: homeLat, longitude: homeLon } = locationPattern.data.homeLocation;
        const distanceFromHome = this.calculateDistance(currentLat, currentLon, homeLat, homeLon);

        if (distanceFromHome > 10) { // More than 10km from home
          impact = 0.17; // +10 minutes for travel/unfamiliar location
          description = `Away from home location - suggesting buffer time`;
          confidence = 0.7;
        } else if (distanceFromHome < 1) { // Very close to home
          impact = -0.05; // -3 minutes, familiar environment
          description = `Home location - slight optimization possible`;
          confidence = 0.5;
        }
      }

      return {
        type: 'location',
        impact,
        confidence,
        description
      };

    } catch (error) {
      return {
        type: 'location',
        impact: 0,
        confidence: 0,
        description: 'Location services unavailable'
      };
    }
  }

  private static async analyzeHealthFactor(
    userId: string,
    targetDate: Date
  ): Promise<PredictionFactor> {
    const patterns = this.behaviorData.get(userId) || [];
    const healthPattern = patterns.find(p => p.patternType === 'sleep_quality');

    let impact = 0;
    let confidence = 0.3;
    let description = 'No health data available';

    if (healthPattern && healthPattern.confidence > 0.5) {
      const recentSleepQuality = healthPattern.data.recentSleepQuality || 7;
      const avgSleepDuration = healthPattern.data.avgSleepDuration || 8;

      // Poor sleep quality = wake slightly later
      if (recentSleepQuality < 6) {
        impact = 0.17; // +10 minutes
        description = 'Recent poor sleep - suggesting recovery time';
        confidence = 0.6;
      } else if (recentSleepQuality > 8) {
        impact = -0.08; // -5 minutes
        description = 'Great sleep quality - can optimize timing';
        confidence = 0.7;
      }

      // Short sleep duration = wake slightly later
      if (avgSleepDuration < 7) {
        impact += 0.08; // Additional 5 minutes
        description += ' (short sleep compensation)';
      }
    }

    return {
      type: 'health',
      impact,
      confidence,
      description
    };
  }

  // ===== CALCULATION & OPTIMIZATION =====

  private static calculateOptimalAdjustment(factors: PredictionFactor[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      const weight = factor.confidence * factor.confidence; // Square confidence for more aggressive weighting
      weightedSum += factor.impact * weight;
      totalWeight += weight;
    }

    const averageImpact = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Convert to minutes and apply limits
    const adjustmentMinutes = Math.round(averageImpact * 60);
    return Math.max(-30, Math.min(30, adjustmentMinutes)); // Limit to ±30 minutes
  }

  private static calculatePredictionConfidence(factors: PredictionFactor[]): number {
    if (factors.length === 0) return 0;

    const avgConfidence = factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length;
    const factorBonus = Math.min(0.2, factors.length * 0.05); // Bonus for more factors

    return Math.min(0.95, avgConfidence + factorBonus);
  }

  private static generateReasoning(factors: PredictionFactor[]): string[] {
    return factors
      .filter(f => f.confidence > 0.4)
      .sort((a, b) => b.confidence - a.confidence)
      .map(f => f.description);
  }

  // ===== UTILITY METHODS =====

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  private static generatePatternId(): string {
    return 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private static clearUserPredictionCache(userId: string): void {
    for (const [key] of this.predictionCache) {
      if (key.startsWith(userId + '_')) {
        this.predictionCache.delete(key);
      }
    }
  }

  private static async saveBehaviorData(): Promise<void> {
    try {
      const dataObject = Object.fromEntries(this.behaviorData);
      await Preferences.set({
        key: USER_BEHAVIOR_DATA_KEY,
        value: JSON.stringify(dataObject)
      });
    } catch (error) {
      console.error('Error saving behavior data:', error);
    }
  }

  private static async startLearningProcess(): Promise<void> {
    // Start background learning process
    setInterval(() => {
      this.processLearningQueue();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private static async processLearningQueue(): Promise<void> {
    // Process any queued learning tasks
    // This would include analyzing recent user behavior, updating patterns, etc.
  }

  // ===== MOCK API METHODS (Replace with real integrations) =====

  private static async getWeatherForecast(date: Date): Promise<WeatherData | null> {
    // Mock weather data - replace with real weather API
    const conditions = ['sunny', 'cloudy', 'rainy', 'clear'];
    return {
      temperature: Math.round(Math.random() * 30 + 5), // 5-35°C
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.round(Math.random() * 100),
      windSpeed: Math.round(Math.random() * 20),
      forecast: [],
      location: 'Current Location',
      lastUpdated: new Date().toISOString()
    };
  }

  private static async getCalendarEvents(userId: string, date: Date): Promise<any[] | null> {
    // Mock calendar data - replace with real calendar API
    const mockEvents = [
      { time: '09:00', title: 'Morning Meeting', duration: 60 },
      { time: '14:00', title: 'Project Review', duration: 90 },
      { time: '16:30', title: 'Team Standup', duration: 30 }
    ];

    // Return random event or empty for simulation
    return Math.random() > 0.3 ? [mockEvents[Math.floor(Math.random() * mockEvents.length)]] : [];
  }

  // ===== PUBLIC API =====

  static async getOptimizationSuggestions(userId: string): Promise<AIOptimization[]> {
    const patterns = this.behaviorData.get(userId) || [];
    const suggestions: AIOptimization[] = [];

    // Analyze patterns and generate suggestions
    for (const pattern of patterns) {
      if (pattern.confidence > 0.6) {
        suggestions.push({
          id: `suggestion_${Date.now()}`,
          userId,
          type: 'wake_time',
          suggestion: this.generateSuggestionText(pattern),
          confidence: pattern.confidence,
          impact: 'medium',
          createdAt: new Date(),
          isEnabled: true
        });
      }
    }

    return suggestions;
  }

  private static generateSuggestionText(pattern: UserBehaviorPattern): string {
    switch (pattern.patternType) {
      case 'wake_time':
        return `Consider adjusting your alarm time based on your consistent wake patterns`;
      case 'snooze_behavior':
        return `Your snooze patterns suggest optimizing alarm timing or difficulty`;
      case 'sleep_quality':
        return `Sleep quality data indicates potential for better wake time optimization`;
      default:
        return `Pattern detected that could improve your wake experience`;
    }
  }

  static async enableMLOptimization(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;
    await Preferences.set({
      key: ML_CONFIG_KEY,
      value: JSON.stringify(this.config)
    });
  }

  static isMLEnabled(): boolean {
    return this.config.enabled;
  }

  static getMLStats(): { patterns: number; predictions: number; accuracy: number } {
    const totalPatterns = Array.from(this.behaviorData.values()).reduce((sum, patterns) => sum + patterns.length, 0);
    const totalPredictions = this.predictionCache.size;
    const avgConfidence = totalPatterns > 0
      ? Array.from(this.behaviorData.values())
          .flat()
          .reduce((sum, p) => sum + p.confidence, 0) / totalPatterns
      : 0;

    return {
      patterns: totalPatterns,
      predictions: totalPredictions,
      accuracy: Math.round(avgConfidence * 100)
    };
  }
}

export default MLAlarmOptimizer;