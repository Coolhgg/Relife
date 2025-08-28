import { supabase } from './supabase';
import AnalyticsService from './analytics';
import type {
  // Note: User data should come from auth context or be passed as parameter
  EmotionalState,
  EmotionalContext,
  EmotionalMessage,
  EmotionalResponse,
  UserEmotionalProfile,
  EmotionType,
  EmotionalTone,
  EscalationLevel,
  EmotionalNotificationPayload,
} from '../types/emotional';
import {
  EMOTIONAL_MESSAGE_TEMPLATES,
  getEmotionalMessageTemplate,
  personalizeMessage,
  MESSAGE_MODIFIERS,
} from '../data/emotional-message-templates';
import { VOICE_MOOD_TO_EMOTIONAL_TONE } from '../types/emotional';

// Integration with existing services
interface UserStats {
  userId: string;
  daysSinceLastUse: number;
  missedAlarms: number;
  currentStreak: number;
  longestStreak: number;
  totalAlarms: number;
  completionRate: number;
  lastActiveTime?: Date;
  recentAchievements: string[];
  voiceMoodPreference?: string;
  preferredWakeTime?: string;
  weeklyActive: boolean;
}

export class EmotionalIntelligenceService {
  private static instance: EmotionalIntelligenceService;
  private analytics: AnalyticsService;

  private constructor() {
    this.analytics = AnalyticsService;
  }

  public static getInstance(): EmotionalIntelligenceService {
    if (!EmotionalIntelligenceService.instance) {
      EmotionalIntelligenceService.instance = new EmotionalIntelligenceService();
    }
    return EmotionalIntelligenceService.instance;
  }

  /**
   * Main entry point: Analyze user behavior and generate emotional notification
   */
  async generateEmotionalNotification(
    userId: string
  ): Promise<EmotionalNotificationPayload | null> {
    try {
      // 1. Gather user behavior data
      const userStats = await this.getUserStats(userId);
      const userProfile = await this.getUserEmotionalProfile(userId);

      // 2. Analyze emotional state
      const emotionalState = await this.analyzeUserEmotionalState(
        userStats,
        userProfile
      );

      // 3. Check if notification should be sent
      const shouldSend = await this.shouldSendEmotionalNotification(
        userId,
        emotionalState
      );
      if (!shouldSend) {
        return null;
      }

      // 4. Generate personalized message
      const message = await this.generatePersonalizedMessage(userStats, emotionalState);

      // 5. Create notification payload
      const payload = await this.createNotificationPayload(
        userId,
        emotionalState,
        message
      );

      // 6. Track analytics
      this.analytics.track('EMOTIONAL_NOTIFICATION_GENERATED', {
        userId,
        emotion: emotionalState.emotion,
        tone: emotionalState.recommendedTone,
        intensity: emotionalState.intensity,
        daysSinceLastUse: userStats.daysSinceLastUse,
        escalationLevel: this.getEscalationLevel(userStats.daysSinceLastUse),
      });

      return payload;
    } catch (_error) {
      console.error('Error generating emotional notification:', _error);
      this.analytics.track('EMOTIONAL_NOTIFICATION_ERROR', {
        userId,
        _error: _error.message,
      });
      return null;
    }
  }

  /**
   * Analyze user behavior to determine emotional state
   */
  async analyzeUserEmotionalState(
    userStats: UserStats,
    userProfile: UserEmotionalProfile
  ): Promise<EmotionalState> {
    const context = this.buildEmotionalContext(userStats);
    const emotion = this.determineEmotion(context, userProfile);
    const intensity = this.calculateEmotionalIntensity(context);
    const confidence = this.calculateConfidence(context);
    const triggers = this.identifyTriggers(context);
    const recommendedTone = this.selectOptimalTone(emotion, userProfile, context);

    return {
      emotion,
      intensity,
      context,
      confidence,
      triggers,
      recommendedTone,
    };
  }

  /**
   * Build emotional context from user stats
   */
  private buildEmotionalContext(userStats: UserStats): EmotionalContext {
    const now = new Date();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const timeOfDay = this.getTimeOfDay(now);

    return {
      daysSinceLastUse: userStats.daysSinceLastUse,
      missedAlarms: userStats.missedAlarms,
      brokenStreaks: Math.max(0, userStats.longestStreak - userStats.currentStreak),
      socialActivity: userStats.weeklyActive ? 1 : 0,
      achievements: userStats.recentAchievements.length,
      sleepPatterns: this.analyzeSleepPatterns(userStats),
      timeOfDay,
      weekday: isWeekday,
      previousEmotionalResponses: [], // Would be populated from database
    };
  }

  /**
   * Determine primary emotion based on context and user history
   */
  private determineEmotion(
    context: EmotionalContext,
    profile: UserEmotionalProfile
  ): EmotionType {
    const { daysSinceLastUse, achievements, brokenStreaks, missedAlarms } = context;

    // Recent achievements or milestones
    if (achievements > 0 && daysSinceLastUse <= 1) {
      return 'excited';
    }

    // Active user with good patterns
    if (daysSinceLastUse <= 1 && missedAlarms <= 2) {
      return 'happy';
    }

    // Long absence (major concern)
    if (daysSinceLastUse >= 14) {
      return 'lonely';
    }

    // Moderate absence with concerning patterns
    if (daysSinceLastUse >= 3 && daysSinceLastUse <= 7) {
      return 'worried';
    }

    // Recently broken streak or missed alarms
    if (brokenStreaks > 0 || (daysSinceLastUse >= 1 && daysSinceLastUse <= 3)) {
      return 'sad';
    }

    // Sleep-related issues
    if (context.sleepPatterns === 'poor' || context.timeOfDay === 'night') {
      return 'sleepy';
    }

    // Major milestone achieved
    if (achievements >= 3) {
      return 'proud';
    }

    // Default to encouraging
    return 'happy';
  }

  /**
   * Calculate emotional intensity (1-10)
   */
  private calculateEmotionalIntensity(context: EmotionalContext): number {
    let intensity = 5; // Base intensity

    // Increase intensity based on severity
    if (context.daysSinceLastUse >= 7) intensity += 3;
    else if (context.daysSinceLastUse >= 3) intensity += 2;
    else if (context.daysSinceLastUse >= 1) intensity += 1;

    // Achievements reduce intensity (more gentle celebration)
    if (context.achievements > 0) intensity = Math.max(3, intensity - 2);

    // Sleep issues increase intensity
    if (context.sleepPatterns === 'poor') intensity += 1;

    // Cap between 1-10
    return Math.max(1, Math.min(10, intensity));
  }

  /**
   * Select optimal emotional tone based on user preferences and context
   */
  private selectOptimalTone(
    emotion: EmotionType,
    profile: UserEmotionalProfile,
    context: EmotionalContext
  ): EmotionalTone {
    // Use user's voice mood preference if available
    if (profile.preferredTones.length > 0) {
      // Select most effective preferred tone for this emotion
      const availableTones = profile.preferredTones.filter(
        tone => EMOTIONAL_MESSAGE_TEMPLATES[emotion][tone]?.length > 0
      );

      if (availableTones.length > 0) {
        return availableTones[0];
      }
    }

    // Default tone selection based on emotion and context
    switch (emotion) {
      case 'sad':
      case 'lonely':
        return context.daysSinceLastUse >= 7 ? 'firm' : 'encouraging';

      case 'excited':
      case 'happy':
        return 'playful';

      case 'worried':
        return context.daysSinceLastUse >= 5 ? 'firm' : 'encouraging';

      case 'proud':
        return 'encouraging';

      case 'sleepy':
        return 'gentle';

      default:
        return 'encouraging';
    }
  }

  /**
   * Generate personalized message
   */
  async generatePersonalizedMessage(
    userStats: UserStats,
    emotionalState: EmotionalState
  ): Promise<EmotionalMessage> {
    // Get user name from preferences
    const userName = await this.getUserName(userStats.userId);

    // Select template
    const template = getEmotionalMessageTemplate(
      emotionalState.emotion,
      emotionalState.recommendedTone
    );

    // Prepare variables for personalization
    const variables = {
      name: userName || 'friend',
      missed_days: emotionalState.context.daysSinceLastUse,
      streak_days: userStats.currentStreak,
      missed_alarms: emotionalState.context.missedAlarms,
      achievement: userStats.recentAchievements[0] || 'Morning Champion',
      missed_weeks: Math.ceil(emotionalState.context.daysSinceLastUse / 7),
      days_to_milestone: this.calculateDaysToMilestone(userStats),
    };

    // Apply contextual modifiers
    let finalTemplate = template;
    const modifier = this.selectMessageModifier(userStats, emotionalState);
    if (modifier) {
      finalTemplate = modifier.prefix + template + modifier.suffix;
    }

    // Personalize the message
    const personalizedMessage = personalizeMessage(finalTemplate, variables);

    const messageId = `${Date.now()}_${emotionalState.emotion}_${emotionalState.recommendedTone}`;

    return {
      id: messageId,
      emotion: emotionalState.emotion,
      tone: emotionalState.recommendedTone,
      template: finalTemplate,
      variables,
      personalizedMessage,
      effectiveness: 0, // Will be updated based on user response
      usageCount: 0,
      lastUsed: new Date(),
    };
  }

  /**
   * Check if emotional notification should be sent
   */
  async shouldSendEmotionalNotification(
    userId: string,
    emotionalState: EmotionalState
  ): Promise<boolean> {
    try {
      // Check user preferences
      const { data: user } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (!_user?.preferences?.notificationsEnabled) {
        return false;
      }

      // Check frequency limits
      const lastNotification = await this.getLastEmotionalNotification(userId);
      if (lastNotification) {
        const hoursSinceLastNotification =
          (Date.now() - new Date(lastNotification.created_at).getTime()) /
          (1000 * 60 * 60);

        // Minimum 24 hours between emotional notifications
        if (hoursSinceLastNotification < 24) {
          return false;
        }
      }

      // Check quiet hours
      const quietHoursActive = await this.isQuietHoursActive(userId);
      if (quietHoursActive) {
        return false;
      }

      // Don't send if confidence is too low
      if (emotionalState.confidence < 0.6) {
        return false;
      }

      return true;
    } catch (_error) {
      console._error('Error checking notification send criteria:', _error);
      return false;
    }
  }

  /**
   * Create notification payload for push service
   */
  async createNotificationPayload(
    userId: string,
    emotionalState: EmotionalState,
    message: EmotionalMessage
  ): Promise<EmotionalNotificationPayload> {
    const escalationLevel = this.getEscalationLevel(
      emotionalState.context.daysSinceLastUse
    );

    return {
      userId,
      emotion: emotionalState.emotion,
      tone: emotionalState.recommendedTone,
      message,
      scheduledFor: new Date(),
      escalationLevel,
      deepLink: this.getDeepLink(emotionalState.emotion),
      largeImage: this.getLargeImage(emotionalState.emotion),
      vibrationPattern: this.getVibrationPattern(emotionalState.emotion),
      requireInteraction: escalationLevel !== 'gentle',
      metadata: {
        analysisConfidence: emotionalState.confidence,
        version: '1.0.0',
      },
    };
  }

  /**
   * Track notification response for learning
   */
  async trackEmotionalResponse(
    userId: string,
    messageId: string,
    response: EmotionalResponse
  ): Promise<void> {
    try {
      // Store response in database
      await supabase.from('emotional_notification_logs').insert({
        user_id: userId,
        message_id: messageId,
        emotion_type: response.emotion,
        message_sent: '', // Would store the actual message
        notification_opened: response.notificationOpened,
        action_taken: response.actionTaken,
        effectiveness_rating: response.effectivenessRating,
        response_time_ms: response.timeToResponse,
      });

      // Update message effectiveness
      await this.updateMessageEffectiveness(messageId, response);

      // Update user emotional profile
      await this.updateUserEmotionalProfile(userId, response);

      // Analytics
      this.analytics.track('EMOTIONAL_NOTIFICATION_RESPONSE', {
        userId,
        messageId,
        emotion: response.emotion,
        tone: response.tone,
        notificationOpened: response.notificationOpened,
        actionTaken: response.actionTaken,
        effectivenessRating: response.effectivenessRating,
        responseTimeMs: response.timeToResponse,
      });
    } catch (_error) {
      console._error('Error tracking emotional response:', _error);
    }
  }

  // Helper methods

  private getEscalationLevel(daysMissed: number): EscalationLevel {
    if (daysMissed <= 1) return 'gentle';
    if (daysMissed <= 3) return 'slightly_emotional';
    if (daysMissed <= 7) return 'strong_emotional';
    if (daysMissed <= 14) return 'social_pressure';
    return 'major_reset';
  }

  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private analyzeSleepPatterns(userStats: UserStats): 'good' | 'poor' | 'inconsistent' {
    // Simple heuristic - in real implementation would analyze sleep data
    if (userStats.completionRate >= 0.8) return 'good';
    if (userStats.completionRate >= 0.5) return 'inconsistent';
    return 'poor';
  }

  private calculateConfidence(context: EmotionalContext): number {
    let confidence = 0.7; // Base confidence

    // More data = higher confidence
    if (context.daysSinceLastUse <= 7) confidence += 0.2;
    if (context.achievements > 0) confidence += 0.1;
    if (context.previousEmotionalResponses.length > 3) confidence += 0.1;

    return Math.min(1, confidence);
  }

  private identifyTriggers(context: EmotionalContext): string[] {
    const triggers: string[] = [];

    if (context.daysSinceLastUse >= 3) triggers.push('extended_absence');
    if (context.missedAlarms >= 5) triggers.push('frequent_misses');
    if (context.brokenStreaks > 0) triggers.push('broken_streak');
    if (context.achievements > 0) triggers.push('recent_achievement');
    if (context.sleepPatterns === 'poor') triggers.push('sleep_issues');

    return triggers;
  }

  private selectMessageModifier(
    userStats: UserStats,
    emotionalState: EmotionalState
  ): { prefix: string; suffix: string } | null {
    if (userStats.daysSinceLastUse >= 30) {
      return MESSAGE_MODIFIERS.comebackAfterLongAbsence;
    }

    if (!userStats.lastActiveTime) {
      return MESSAGE_MODIFIERS.firstTime;
    }

    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend && userStats.completionRate >= 0.8) {
      return MESSAGE_MODIFIERS.weekendEncouragement;
    }

    return null;
  }

  private calculateDaysToMilestone(userStats: UserStats): number {
    const nextMilestone =
      [7, 14, 30, 50, 100].find(m => m > userStats.currentStreak) || 365;
    return nextMilestone - userStats.currentStreak;
  }

  private getDeepLink(emotion: EmotionType): string {
    switch (emotion) {
      case 'excited':
      case 'proud':
        return '/achievements';
      case 'sad':
      case 'worried':
        return '/alarms/create';
      case 'sleepy':
        return '/sleep-analysis';
      default:
        return '/dashboard';
    }
  }

  private getLargeImage(emotion: EmotionType): string {
    return `/images/emotional-banners/${emotion}-banner-512x256.png`;
  }

  private getVibrationPattern(emotion: EmotionType): number[] {
    const patterns = {
      happy: [200, 100, 200],
      excited: [100, 50, 100, 50, 200],
      sad: [500, 200, 500],
      worried: [300, 100, 300, 100, 300],
      lonely: [400, 200, 400],
      proud: [100, 50, 100, 50, 100, 50, 200],
      sleepy: [200, 300, 200],
    };

    return patterns[emotion] || [200, 100, 200];
  }

  // Database operations

  private async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Query user alarm statistics
      const { data: alarmStats } = await supabase
        .from('user_alarm_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('alarm_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const lastActivity = recentActivity?.[0];
      const daysSinceLastUse = lastActivity
        ? Math.floor(
            (Date.now() - new Date(lastActivity.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 365;

      return {
        userId,
        daysSinceLastUse,
        missedAlarms: alarmStats?.missed_count || 0,
        currentStreak: alarmStats?.current_streak || 0,
        longestStreak: alarmStats?.longest_streak || 0,
        totalAlarms: alarmStats?.total_alarms || 0,
        completionRate: alarmStats?.completion_rate || 0,
        lastActiveTime: lastActivity ? new Date(lastActivity.created_at) : undefined,
        recentAchievements: [], // Would query achievements table
        weeklyActive: daysSinceLastUse <= 7,
      };
    } catch (_error) {
      console._error('Error getting _user stats:', _error);
      // Return default stats
      return {
        userId,
        daysSinceLastUse: 1,
        missedAlarms: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalAlarms: 0,
        completionRate: 1,
        recentAchievements: [],
        weeklyActive: true,
      };
    }
  }

  private async getUserEmotionalProfile(userId: string): Promise<UserEmotionalProfile> {
    try {
      const { data: profile } = await supabase
        .from('user_emotional_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        return {
          userId,
          preferredTones: profile.preferred_tones || ['encouraging'],
          avoidedTones: profile.avoided_tones || [],
          mostEffectiveEmotions: profile.effective_emotions || [],
          responsePatterns: profile.response_patterns || {
            bestTimeToSend: '08:00',
            averageResponseTime: 300000, // 5 minutes
            preferredEscalationSpeed: 'medium',
          },
          emotionalHistory: [],
          lastAnalyzed: new Date(profile.last_analyzed),
        };
      }

      // Create default profile
      return {
        userId,
        preferredTones: ['encouraging'],
        avoidedTones: [],
        mostEffectiveEmotions: [],
        responsePatterns: {
          bestTimeToSend: '08:00',
          averageResponseTime: 300000,
          preferredEscalationSpeed: 'medium',
        },
        emotionalHistory: [],
        lastAnalyzed: new Date(),
      };
    } catch (_error) {
      console._error('Error getting emotional profile:', _error);
      return {
        userId,
        preferredTones: ['encouraging'],
        avoidedTones: [],
        mostEffectiveEmotions: [],
        responsePatterns: {
          bestTimeToSend: '08:00',
          averageResponseTime: 300000,
          preferredEscalationSpeed: 'medium',
        },
        emotionalHistory: [],
        lastAnalyzed: new Date(),
      };
    }
  }

  private async getUserName(userId: string): Promise<string | null> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

      return user?.preferences?.displayName || null;
    } catch (_error) {
      return null;
    }
  }

  private async getLastEmotionalNotification(userId: string) {
    try {
      const { data } = await supabase
        .from('emotional_notification_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data;
    } catch (_error) {
      return null;
    }
  }

  private async isQuietHoursActive(userId: string): Promise<boolean> {
    // Integration with existing quiet hours system
    // Would check user preferences for quiet hours
    return false;
  }

  private async updateMessageEffectiveness(
    messageId: string,
    response: EmotionalResponse
  ): Promise<void> {
    // Update message effectiveness based on user response
    // Implementation would track success metrics
  }

  private async updateUserEmotionalProfile(
    userId: string,
    response: EmotionalResponse
  ): Promise<void> {
    // Update user's emotional profile based on their response
    // This helps improve future message selection
  }
}

// Export singleton instance
export const emotionalIntelligenceService = EmotionalIntelligenceService.getInstance();
