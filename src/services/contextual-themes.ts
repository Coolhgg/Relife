/**
 * Contextual Themes Service
 * Automatically suggests and applies appropriate themes based on context
 * including time of day, weather, user patterns, and calendar events
 */

import { VisualAlarmThemeId, visualAlarmThemes } from './visual-alarm-themes';
import { SoundTheme } from './sound-effects';
import { VoiceMood } from '../types';

export interface ContextualThemeRecommendation {
  visual: VisualAlarmThemeId;
  sound: SoundTheme;
  voice: VoiceMood;
  confidence: number; // 0-100
  reason: string;
  context: ThemeContext[];
}

export interface ThemeContext {
  type:
    | 'time'
    | 'weather'
    | 'calendar'
    | 'pattern'
    | 'location'
    | 'health'
    | 'sleep'
    | 'mood';
  value: string | number;
  weight: number; // Importance multiplier
}

export interface UserThemePattern {
  timeOfDay: {
    hour: number;
    preferences: { visual: VisualAlarmThemeId; sound: SoundTheme; voice: VoiceMood }[];
  }[];
  dayOfWeek: {
    day: number;
    preferences: { visual: VisualAlarmThemeId; sound: SoundTheme; voice: VoiceMood }[];
  }[];
  weatherConditions: {
    condition: string;
    preferences: { visual: VisualAlarmThemeId; sound: SoundTheme; voice: VoiceMood }[];
  }[];
  moodHistory: {
    mood: string;
    timestamp: Date;
    themes: { visual: VisualAlarmThemeId; sound: SoundTheme; voice: VoiceMood };
  }[];
}

export interface SmartThemeRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: ThemeCondition[];
  recommendation: Omit<ContextualThemeRecommendation, 'confidence' | 'context'>;
}

export interface ThemeCondition {
  type:
    | 'time-range'
    | 'weather'
    | 'calendar-event'
    | 'sleep-quality'
    | 'stress-level'
    | 'location'
    | 'day-of-week';
  operator: 'equals' | 'contains' | 'between' | 'greater-than' | 'less-than';
  value: any;
  weight: number;
}

class ContextualThemesService {
  private static instance: ContextualThemesService | null = null;
  private userPatterns: UserThemePattern;
  private smartRules: SmartThemeRule[];
  private isLearningMode: boolean = true;
  private currentLocation: { lat: number; lon: number } | null = null;
  private weatherData: any = null;

  private constructor() {
    this.userPatterns = this.getDefaultPatterns();
    this.smartRules = this.getDefaultRules();
    this.initializeService();
  }

  static getInstance(): ContextualThemesService {
    if (!ContextualThemesService.instance) {
      ContextualThemesService.instance = new ContextualThemesService();
    }
    return ContextualThemesService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Load saved patterns and preferences
      await this.loadUserPatterns();

      // Get user location if permission granted
      await this.updateLocation();

      // Fetch initial weather data
      await this.updateWeatherData();

      console.log('ContextualThemesService initialized successfully');
    } catch (error) {
      console.error('Error initializing ContextualThemesService:', error);
    }
  }

  private getDefaultPatterns(): UserThemePattern {
    return {
      timeOfDay: [
        {
          hour: 6,
          preferences: [{ visual: 'sunrise_glow', sound: 'nature', voice: 'gentle' }],
        },
        {
          hour: 7,
          preferences: [
            { visual: 'morning_mist', sound: 'nature', voice: 'sweet-angel' },
          ],
        },
        {
          hour: 8,
          preferences: [
            { visual: 'sunrise_glow', sound: 'default', voice: 'motivational' },
          ],
        },
        {
          hour: 12,
          preferences: [{ visual: 'clean_white', sound: 'minimal', voice: 'gentle' }],
        },
        {
          hour: 18,
          preferences: [{ visual: 'forest_canopy', sound: 'nature', voice: 'gentle' }],
        },
        {
          hour: 22,
          preferences: [{ visual: 'galaxy_spiral', sound: 'ambient', voice: 'gentle' }],
        },
      ],
      dayOfWeek: [
        {
          day: 1,
          preferences: [
            { visual: 'lightning_bolt', sound: 'energetic', voice: 'motivational' },
          ],
        }, // Monday
        {
          day: 5,
          preferences: [
            { visual: 'neon_pulse', sound: 'electronic', voice: 'anime-hero' },
          ],
        }, // Friday
        {
          day: 6,
          preferences: [{ visual: 'morning_mist', sound: 'nature', voice: 'gentle' }],
        }, // Saturday
        {
          day: 0,
          preferences: [{ visual: 'forest_canopy', sound: 'ambient', voice: 'gentle' }],
        }, // Sunday
      ],
      weatherConditions: [
        {
          condition: 'sunny',
          preferences: [
            { visual: 'sunrise_glow', sound: 'nature', voice: 'sweet-angel' },
          ],
        },
        {
          condition: 'rainy',
          preferences: [{ visual: 'morning_mist', sound: 'ambient', voice: 'gentle' }],
        },
        {
          condition: 'stormy',
          preferences: [
            { visual: 'lightning_bolt', sound: 'electronic', voice: 'drill-sergeant' },
          ],
        },
        {
          condition: 'snowy',
          preferences: [{ visual: 'clean_white', sound: 'minimal', voice: 'gentle' }],
        },
        {
          condition: 'foggy',
          preferences: [{ visual: 'morning_mist', sound: 'ambient', voice: 'gentle' }],
        },
      ],
      moodHistory: [],
    };
  }

  private getDefaultRules(): SmartThemeRule[] {
    return [
      {
        id: 'early_morning_gentle',
        name: 'Early Morning Gentle',
        description: 'Soft, gentle wake-up for very early hours',
        priority: 8,
        conditions: [
          { type: 'time-range', operator: 'between', value: [4, 6], weight: 1 },
        ],
        recommendation: {
          visual: 'sunrise_glow',
          sound: 'nature',
          voice: 'gentle',
          reason: 'Early morning gentle wake-up',
        },
      },
      {
        id: 'monday_motivation',
        name: 'Monday Motivation',
        description: 'Extra energy boost for Monday mornings',
        priority: 7,
        conditions: [
          { type: 'day-of-week', operator: 'equals', value: 1, weight: 1 },
          { type: 'time-range', operator: 'between', value: [6, 9], weight: 0.8 },
        ],
        recommendation: {
          visual: 'lightning_bolt',
          sound: 'energetic',
          voice: 'motivational',
          reason: 'Monday motivation boost',
        },
      },
      {
        id: 'rainy_day_cozy',
        name: 'Rainy Day Cozy',
        description: 'Gentle, cozy themes for rainy weather',
        priority: 6,
        conditions: [
          { type: 'weather', operator: 'contains', value: 'rain', weight: 1 },
        ],
        recommendation: {
          visual: 'morning_mist',
          sound: 'ambient',
          voice: 'gentle',
          reason: 'Cozy wake-up for rainy weather',
        },
      },
      {
        id: 'weekend_relaxed',
        name: 'Weekend Relaxed',
        description: 'Relaxed themes for weekend mornings',
        priority: 5,
        conditions: [
          { type: 'day-of-week', operator: 'equals', value: 0, weight: 1 }, // Sunday
          { type: 'day-of-week', operator: 'equals', value: 6, weight: 1 }, // Saturday
        ],
        recommendation: {
          visual: 'forest_canopy',
          sound: 'nature',
          voice: 'gentle',
          reason: 'Relaxed weekend morning',
        },
      },
      {
        id: 'late_night_minimal',
        name: 'Late Night Minimal',
        description: 'Minimal themes for late night/early morning alarms',
        priority: 7,
        conditions: [
          { type: 'time-range', operator: 'between', value: [23, 4], weight: 1 },
        ],
        recommendation: {
          visual: 'clean_white',
          sound: 'minimal',
          voice: 'gentle',
          reason: 'Minimal disruption for late hours',
        },
      },
      {
        id: 'sunny_energetic',
        name: 'Sunny & Energetic',
        description: 'Bright, energetic themes for sunny days',
        priority: 6,
        conditions: [
          { type: 'weather', operator: 'contains', value: 'clear', weight: 1 },
          { type: 'time-range', operator: 'between', value: [6, 10], weight: 0.8 },
        ],
        recommendation: {
          visual: 'sunrise_glow',
          sound: 'energetic',
          voice: 'sweet-angel',
          reason: 'Bright and energetic for sunny morning',
        },
      },
      {
        id: 'stormy_dramatic',
        name: 'Stormy & Dramatic',
        description: 'Dramatic themes matching stormy weather',
        priority: 8,
        conditions: [
          { type: 'weather', operator: 'contains', value: 'storm', weight: 1 },
        ],
        recommendation: {
          visual: 'lightning_bolt',
          sound: 'electronic',
          voice: 'drill-sergeant',
          reason: 'Dramatic wake-up matching the storm outside',
        },
      },
      {
        id: 'workout_day',
        name: 'Workout Day',
        description: 'High-energy themes when workout is scheduled',
        priority: 9,
        conditions: [
          { type: 'calendar-event', operator: 'contains', value: 'workout', weight: 1 },
          { type: 'calendar-event', operator: 'contains', value: 'gym', weight: 1 },
        ],
        recommendation: {
          visual: 'lightning_bolt',
          sound: 'workout',
          voice: 'motivational',
          reason: 'High-energy wake-up for workout day',
        },
      },
    ];
  }

  // Main recommendation method
  async getContextualRecommendation(
    alarmTime: string,
    date: Date = new Date()
  ): Promise<ContextualThemeRecommendation> {
    const contexts = await this.gatherContexts(alarmTime, date);

    // Apply smart rules
    const ruleRecommendations = this.applySmartRules(contexts);

    // Get pattern-based recommendations
    const patternRecommendations = this.getPatternBasedRecommendation(alarmTime, date);

    // Combine and score recommendations
    const finalRecommendation = this.combineRecommendations(
      ruleRecommendations,
      patternRecommendations,
      contexts
    );

    return finalRecommendation;
  }

  private async gatherContexts(alarmTime: string, date: Date): Promise<ThemeContext[]> {
    const contexts: ThemeContext[] = [];

    // Time context
    const hour = parseInt(alarmTime.split(':')[0]);
    contexts.push({
      type: 'time',
      value: hour,
      weight: 1,
    });

    // Day of week context
    contexts.push({
      type: 'time',
      value: date.getDay(),
      weight: 0.7,
    });

    // Weather context
    if (this.weatherData) {
      contexts.push({
        type: 'weather',
        value: this.weatherData.weather[0].main.toLowerCase(),
        weight: 0.8,
      });
    }

    // Calendar context (would integrate with calendar API)
    const calendarEvents = await this.getUpcomingCalendarEvents(date);
    calendarEvents.forEach(event => {
      contexts.push({
        type: 'calendar',
        value: event.title.toLowerCase(),
        weight: 0.9,
      });
    });

    // Sleep quality context (would integrate with health data)
    const sleepQuality = this.getSleepQuality();
    if (sleepQuality) {
      contexts.push({
        type: 'sleep',
        value: sleepQuality,
        weight: 0.6,
      });
    }

    return contexts;
  }

  private applySmartRules(contexts: ThemeContext[]): ContextualThemeRecommendation[] {
    const recommendations: ContextualThemeRecommendation[] = [];

    for (const rule of this.smartRules) {
      let matchScore = 0;
      let totalWeight = 0;

      for (const condition of rule.conditions) {
        const matchingContexts = contexts.filter(ctx =>
          this.contextMatchesCondition(ctx, condition)
        );

        if (matchingContexts.length > 0) {
          matchScore += condition.weight;
        }
        totalWeight += condition.weight;
      }

      const confidence = totalWeight > 0 ? (matchScore / totalWeight) * 100 : 0;

      if (confidence > 50) {
        // Only include rules with reasonable confidence
        recommendations.push({
          ...rule.recommendation,
          confidence: confidence * (rule.priority / 10), // Factor in rule priority
          context: contexts.filter(ctx =>
            rule.conditions.some(cond => this.contextMatchesCondition(ctx, cond))
          ),
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private contextMatchesCondition(
    context: ThemeContext,
    condition: ThemeCondition
  ): boolean {
    switch (condition.type) {
      case 'time-range':
        if (context.type === 'time' && condition.operator === 'between') {
          const [start, end] = condition.value;
          const hour = context.value as number;
          return hour >= start && hour <= end;
        }
        break;

      case 'weather':
        if (context.type === 'weather' && condition.operator === 'contains') {
          return (context.value as string).includes(condition.value);
        }
        break;

      case 'day-of-week':
        if (context.type === 'time' && condition.operator === 'equals') {
          return context.value === condition.value;
        }
        break;

      case 'calendar-event':
        if (context.type === 'calendar' && condition.operator === 'contains') {
          return (context.value as string).includes(condition.value);
        }
        break;
    }

    return false;
  }

  private getPatternBasedRecommendation(
    alarmTime: string,
    date: Date
  ): ContextualThemeRecommendation {
    const hour = parseInt(alarmTime.split(':')[0]);
    const dayOfWeek = date.getDay();

    // Find matching time-based patterns
    const timePattern = this.userPatterns.timeOfDay.find(tp => tp.hour === hour);
    const dayPattern = this.userPatterns.dayOfWeek.find(dp => dp.day === dayOfWeek);

    // Use most relevant pattern or default
    const pattern = timePattern?.preferences[0] ||
      dayPattern?.preferences[0] || {
        visual: 'sunrise_glow' as VisualAlarmThemeId,
        sound: 'default' as SoundTheme,
        voice: 'gentle' as VoiceMood,
      };

    return {
      visual: pattern.visual,
      sound: pattern.sound,
      voice: pattern.voice,
      confidence: timePattern ? 70 : dayPattern ? 50 : 30,
      reason: timePattern
        ? `Based on your ${hour}:00 preferences`
        : dayPattern
          ? `Based on your ${this.getDayName(dayOfWeek)} preferences`
          : 'Default gentle wake-up',
      context: [{ type: 'pattern', value: 'user-history', weight: 1 }],
    };
  }

  private combineRecommendations(
    ruleRecs: ContextualThemeRecommendation[],
    patternRec: ContextualThemeRecommendation,
    contexts: ThemeContext[]
  ): ContextualThemeRecommendation {
    // If we have high-confidence rule recommendations, use the best one
    if (ruleRecs.length > 0 && ruleRecs[0].confidence > 70) {
      return ruleRecs[0];
    }

    // Otherwise, blend rule and pattern recommendations
    if (ruleRecs.length > 0) {
      const bestRule = ruleRecs[0];

      // Use rule recommendation but boost confidence if it aligns with patterns
      if (
        bestRule.visual === patternRec.visual ||
        bestRule.sound === patternRec.sound ||
        bestRule.voice === patternRec.voice
      ) {
        bestRule.confidence = Math.min(95, bestRule.confidence + 15);
        bestRule.reason += ' (matches your preferences)';
      }

      return bestRule;
    }

    // Fall back to pattern-based recommendation
    return patternRec;
  }

  // Learning and adaptation methods
  recordThemeUsage(
    visual: VisualAlarmThemeId,
    sound: SoundTheme,
    voice: VoiceMood,
    alarmTime: string,
    date: Date,
    userSatisfaction?: number
  ): void {
    if (!this.isLearningMode) return;

    const hour = parseInt(alarmTime.split(':')[0]);
    const dayOfWeek = date.getDay();

    // Update time-based patterns
    let timePattern = this.userPatterns.timeOfDay.find(tp => tp.hour === hour);
    if (!timePattern) {
      timePattern = { hour, preferences: [] };
      this.userPatterns.timeOfDay.push(timePattern);
    }

    // Add or update preference (with simple frequency-based learning)
    const existingPref = timePattern.preferences.find(
      p => p.visual === visual && p.sound === sound && p.voice === voice
    );

    if (existingPref) {
      // Increase weight of existing preference
      timePattern.preferences = timePattern.preferences.map(
        p => (p === existingPref ? p : p) // Could add usage counting here
      );
    } else {
      timePattern.preferences.unshift({ visual, sound, voice });
      // Keep only top 3 preferences
      timePattern.preferences = timePattern.preferences.slice(0, 3);
    }

    // Update day-based patterns similarly
    let dayPattern = this.userPatterns.dayOfWeek.find(dp => dp.day === dayOfWeek);
    if (!dayPattern) {
      dayPattern = { day: dayOfWeek, preferences: [] };
      this.userPatterns.dayOfWeek.push(dayPattern);
    }

    // Save patterns
    this.saveUserPatterns();
  }

  // Weather integration
  private async updateWeatherData(): Promise<void> {
    if (!this.currentLocation) return;

    try {
      // In a real implementation, you'd call a weather API
      // For now, simulate weather data
      this.weatherData = {
        weather: [{ main: 'Clear', description: 'clear sky' }],
        main: { temp: 20, humidity: 50 },
      };
    } catch (error) {
      console.warn('Failed to fetch weather data:', error);
    }
  }

  private async updateLocation(): Promise<void> {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
        });
      }
    } catch (error) {
      console.warn('Failed to get location:', error);
    }
  }

  // Calendar integration (placeholder)
  private async getUpcomingCalendarEvents(
    date: Date
  ): Promise<{ title: string; time: string }[]> {
    // This would integrate with calendar APIs (Google Calendar, Outlook, etc.)
    // For now, return mock data
    const hour = date.getHours();
    const mockEvents = [];

    if (hour >= 6 && hour <= 8) {
      // Morning workout events
      if (Math.random() > 0.7) {
        mockEvents.push({ title: 'Morning Workout', time: '7:00 AM' });
      }
    }

    return mockEvents;
  }

  // Health data integration (placeholder)
  private getSleepQuality(): number | null {
    // This would integrate with health APIs (Apple Health, Google Fit, etc.)
    // For now, return mock data
    return Math.random() > 0.5 ? Math.floor(Math.random() * 100) : null;
  }

  // Utility methods
  private getDayName(dayOfWeek: number): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayOfWeek] || 'Unknown';
  }

  private async loadUserPatterns(): Promise<void> {
    try {
      const savedPatterns = localStorage.getItem('contextual-theme-patterns');
      if (savedPatterns) {
        this.userPatterns = { ...this.userPatterns, ...JSON.parse(savedPatterns) };
      }
    } catch (error) {
      console.warn('Failed to load user patterns:', error);
    }
  }

  private async saveUserPatterns(): Promise<void> {
    try {
      localStorage.setItem(
        'contextual-theme-patterns',
        JSON.stringify(this.userPatterns)
      );
    } catch (error) {
      console.error('Failed to save user patterns:', error);
    }
  }

  // Public API methods
  toggleLearningMode(enabled: boolean): void {
    this.isLearningMode = enabled;
  }

  addCustomRule(rule: SmartThemeRule): void {
    this.smartRules.push(rule);
    this.smartRules.sort((a, b) => b.priority - a.priority);
  }

  removeCustomRule(ruleId: string): void {
    this.smartRules = this.smartRules.filter(rule => rule.id !== ruleId);
  }

  getSmartRules(): SmartThemeRule[] {
    return [...this.smartRules];
  }

  getUserPatterns(): UserThemePattern {
    return { ...this.userPatterns };
  }

  // Preview and testing
  async previewRecommendation(
    alarmTime: string,
    date: Date = new Date()
  ): Promise<ContextualThemeRecommendation> {
    return this.getContextualRecommendation(alarmTime, date);
  }
}

// Export singleton instance
export const contextualThemes = ContextualThemesService.getInstance();
export default ContextualThemesService;
