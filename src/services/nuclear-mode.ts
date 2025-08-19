import type {
  Alarm,
  NuclearModeChallenge,
  NuclearChallengeType,
  NuclearChallengeConfig,
  NuclearModeSession,
  NuclearChallengeAttempt,
  NuclearPerformance,
  SubscriptionTier,
  User
} from '../types';
import { premiumService } from './premium';
import { supabase } from './supabase';
import { ErrorHandler } from './error-handler';
import AppAnalyticsService from './app-analytics';
import { Preferences } from '@capacitor/preferences';

const NUCLEAR_SESSIONS_KEY = 'nuclear_mode_sessions';
const NUCLEAR_PERFORMANCE_KEY = 'nuclear_mode_performance';

export class NuclearModeService {
  private static instance: NuclearModeService;

  private constructor() {}

  static getInstance(): NuclearModeService {
    if (!NuclearModeService.instance) {
      NuclearModeService.instance = new NuclearModeService();
    }
    return NuclearModeService.instance;
  }

  // Nuclear mode challenge templates
  private challengeTemplates: NuclearModeChallenge[] = [
    // Multi-step math challenges
    {
      id: 'nuclear_math_expert',
      type: 'multi_step_math',
      title: 'Mathematical Gauntlet',
      description: 'Solve 5 increasingly complex math problems in sequence',
      difficulty: 9,
      timeLimit: 180, // 3 minutes
      attempts: 0,
      maxAttempts: 3,
      instructions: [
        'Solve each math problem correctly',
        'You must complete all 5 problems in sequence',
        'Getting one wrong resets the sequence',
        'Time limit: 3 minutes total'
      ],
      successCriteria: 'Complete all 5 math problems without errors',
      failureConsequence: 'Alarm continues ringing, challenge resets',
      hints: [
        'Take your time with calculations',
        'Use paper if needed',
        'Double-check each answer'
      ],
      configuration: {
        mathComplexity: 'expert',
        sequenceLength: 5
      }
    },

    // Memory sequence challenge
    {
      id: 'nuclear_memory_master',
      type: 'memory_sequence',
      title: 'Memory Master',
      description: 'Memorize and repeat increasingly long sequences',
      difficulty: 8,
      timeLimit: 240, // 4 minutes
      attempts: 0,
      maxAttempts: 3,
      instructions: [
        'Watch the sequence of colors/numbers',
        'Repeat the sequence exactly',
        'Each round adds one more element',
        'Must complete 8 rounds'
      ],
      successCriteria: 'Successfully repeat 8 sequences without errors',
      failureConsequence: 'Sequence resets to round 1',
      configuration: {
        sequenceLength: 8
      }
    },

    // Physical movement challenge
    {
      id: 'nuclear_movement_extreme',
      type: 'physical_movement',
      title: 'Rise and Move',
      description: 'Complete a series of physical movements',
      difficulty: 7,
      timeLimit: 300, // 5 minutes
      attempts: 0,
      maxAttempts: 2,
      instructions: [
        'Stand up and hold phone steady',
        'Perform 50 jumping jacks (phone detects motion)',
        'Walk 100 steps (step counter)',
        'Do 20 squats (motion detection)',
        'Hold plank position for 30 seconds'
      ],
      successCriteria: 'Complete all physical exercises as detected by phone sensors',
      failureConsequence: 'Must restart entire exercise sequence',
      configuration: {
        movementType: 'walk',
        shakeThreshold: 50
      }
    },

    // Photo proof challenge
    {
      id: 'nuclear_photo_proof',
      type: 'photo_proof',
      title: 'Proof of Life',
      description: 'Take specific photos to prove you\'re awake',
      difficulty: 6,
      timeLimit: 600, // 10 minutes
      attempts: 0,
      maxAttempts: 3,
      instructions: [
        'Take a clear selfie with your eyes open',
        'Photo must show you\'re in a different room than your bed',
        'Take a photo of today\'s newspaper/phone date',
        'Photo must include your face and the date/time'
      ],
      successCriteria: 'All photos must be clear and meet the requirements',
      failureConsequence: 'Must retake all photos',
      configuration: {
        photoType: 'selfie'
      }
    },

    // Barcode scanning challenge
    {
      id: 'nuclear_barcode_hunt',
      type: 'barcode_scan',
      title: 'Barcode Hunter',
      description: 'Scan 3 different barcodes around your home',
      difficulty: 8,
      timeLimit: 480, // 8 minutes
      attempts: 0,
      maxAttempts: 2,
      instructions: [
        'Find and scan 3 different product barcodes',
        'Barcodes must be from different rooms',
        'Each scan must be successful and clear',
        'Cannot reuse the same barcode'
      ],
      successCriteria: 'Successfully scan 3 unique barcodes',
      failureConsequence: 'Must find and scan 3 new barcodes',
      configuration: {
        sequenceLength: 3
      }
    },

    // Voice recognition challenge
    {
      id: 'nuclear_voice_challenge',
      type: 'voice_recognition',
      title: 'Speak to Dismiss',
      description: 'Recite complex phrases with perfect pronunciation',
      difficulty: 7,
      timeLimit: 300, // 5 minutes
      attempts: 0,
      maxAttempts: 4,
      instructions: [
        'Speak each phrase clearly and correctly',
        'Must pronounce tongue twisters perfectly',
        'Voice recognition must confirm accuracy',
        'Complete all 5 phrases in sequence'
      ],
      successCriteria: 'Perfect pronunciation of all tongue twisters',
      failureConsequence: 'Start over with new set of phrases',
      configuration: {
        voicePhrase: 'She sells seashells by the seashore',
        sequenceLength: 5
      }
    },

    // QR Code hunt
    {
      id: 'nuclear_qr_quest',
      type: 'qr_code_hunt',
      title: 'QR Code Quest',
      description: 'Find and scan QR codes in specific order',
      difficulty: 9,
      timeLimit: 420, // 7 minutes
      attempts: 0,
      maxAttempts: 2,
      instructions: [
        'QR codes are hidden around your preset locations',
        'Scan them in the exact order shown',
        'Each QR contains a piece of the dismissal code',
        'Final code must be entered correctly'
      ],
      successCriteria: 'Find all QR codes in correct sequence and enter final code',
      failureConsequence: 'QR code locations are reshuffled',
      configuration: {
        qrCodes: ['KITCHEN', 'BATHROOM', 'LIVING_ROOM'],
        sequenceLength: 3
      }
    },

    // Typing challenge
    {
      id: 'nuclear_typing_master',
      type: 'typing_challenge',
      title: 'Speed Typing Test',
      description: 'Type complex text at high speed with perfect accuracy',
      difficulty: 8,
      timeLimit: 180, // 3 minutes
      attempts: 0,
      maxAttempts: 3,
      instructions: [
        'Type the displayed text exactly as shown',
        'Must maintain 40+ WPM speed',
        'Accuracy must be 98% or higher',
        'Complete 3 passages in sequence'
      ],
      successCriteria: 'Type all passages with 98%+ accuracy at 40+ WPM',
      failureConsequence: 'New passages generated, speed requirement increases',
      configuration: {
        typingSpeed: 40,
        typingText: 'The quick brown fox jumps over the lazy dog while calculating complex mathematical equations',
        sequenceLength: 3
      }
    }
  ];

  /**
   * Check if user can access Nuclear Mode
   */
  async canAccessNuclearMode(userId: string): Promise<{
    hasAccess: boolean;
    userTier: SubscriptionTier;
    upgradeUrl?: string;
  }> {
    const result = await premiumService.checkFeatureAccess(userId, 'nuclear_mode');
    return {
      hasAccess: result.hasAccess,
      userTier: result.userTier,
      upgradeUrl: result.upgradeUrl
    };
  }

  /**
   * Create a nuclear mode alarm (premium feature)
   */
  async createNuclearAlarm(userId: string, alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: string;
    challengeTypes: NuclearChallengeType[];
    customDifficulty?: number;
  }): Promise<{ success: boolean; alarm?: Alarm; error?: string }> {
    try {
      // Check premium access
      const access = await this.canAccessNuclearMode(userId);
      if (!access.hasAccess) {
        return {
          success: false,
          error: `Nuclear Mode requires Premium subscription. Upgrade at: ${access.upgradeUrl}`
        };
      }

      // Create nuclear alarm with premium features
      const nuclearAlarm: Partial<Alarm> = {
        userId,
        time: alarmData.time,
        label: `💣 ${alarmData.label}`,
        enabled: true,
        isActive: true,
        days: alarmData.days,
        dayNames: alarmData.days.map(d =>
          ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d] as any
        ),
        voiceMood: alarmData.voiceMood as any,
        sound: 'nuclear_alert',
        difficulty: 'nuclear',
        snoozeEnabled: false, // Nuclear mode doesn't allow snoozing
        snoozeInterval: 0,
        snoozeCount: 0,
        maxSnoozes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      const { data, error } = await supabase
        .from('alarms')
        .insert(nuclearAlarm)
        .select()
        .single();

      if (error) {
        ErrorHandler.handleError(error, 'Failed to create nuclear alarm');
        return { success: false, error: 'Failed to create nuclear alarm' };
      }

      // Generate nuclear challenge configuration
      await this.generateNuclearChallenges(data.id, alarmData.challengeTypes, alarmData.customDifficulty);

      // Track analytics
      AppAnalyticsService.getInstance().track('nuclear_alarm_created', {
        userId,
        challengeTypes: alarmData.challengeTypes,
        difficulty: alarmData.customDifficulty || 10
      });

      return { success: true, alarm: data };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Error creating nuclear alarm'
      );
      return { success: false, error: 'Failed to create nuclear alarm' };
    }
  }

  /**
   * Generate nuclear challenges for an alarm
   */
  private async generateNuclearChallenges(
    alarmId: string,
    challengeTypes: NuclearChallengeType[],
    customDifficulty?: number
  ): Promise<void> {
    const selectedChallenges = challengeTypes.map(type => {
      const template = this.challengeTemplates.find(t => t.type === type);
      if (!template) return null;

      return {
        ...template,
        id: `${alarmId}_${type}_${Date.now()}`,
        difficulty: customDifficulty || template.difficulty,
        attempts: 0
      };
    }).filter(Boolean) as NuclearModeChallenge[];

    // Save challenges configuration
    await Preferences.set({
      key: `nuclear_challenges_${alarmId}`,
      value: JSON.stringify(selectedChallenges)
    });
  }

  /**
   * Start a nuclear mode session when alarm triggers
   */
  async startNuclearSession(alarm: Alarm, user: User): Promise<NuclearModeSession> {
    const challenges = await this.getChallengesForAlarm(alarm.id);

    const session: NuclearModeSession = {
      id: `nuclear_${Date.now()}_${alarm.id}`,
      alarmId: alarm.id,
      userId: user.id,
      startedAt: new Date().toISOString(),
      challenges: [],
      totalAttempts: 0,
      successfulChallenges: 0,
      failedChallenges: 0,
      sessionDuration: 0,
      difficulty: this.calculateSessionDifficulty(challenges),
      result: 'failed',
      performance: {
        overallScore: 0,
        speed: 0,
        accuracy: 0,
        persistence: 0,
        improvement: 0,
        rank: 0,
        achievements: []
      }
    };

    // Save session
    await this.saveNuclearSession(session);

    // Track session start
    AppAnalyticsService.getInstance().track('nuclear_session_started', {
      userId: user.id,
      alarmId: alarm.id,
      challengeCount: challenges.length,
      difficulty: session.difficulty
    });

    return session;
  }

  /**
   * Process challenge attempt
   */
  async processChallengeAttempt(
    sessionId: string,
    challengeId: string,
    attemptData: {
      successful: boolean;
      timeToComplete?: number;
      hintsUsed?: number;
      errorsMade?: number;
      details?: Record<string, any>;
    }
  ): Promise<{ continueSession: boolean; nextChallenge?: NuclearModeChallenge; sessionComplete?: boolean }> {
    const session = await this.getNuclearSession(sessionId);
    if (!session) {
      throw new Error('Nuclear session not found');
    }

    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Nuclear challenge not found');
    }

    const attempt: NuclearChallengeAttempt = {
      challengeId,
      challenge,
      attemptNumber: challenge.attempts + 1,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      successful: attemptData.successful,
      timeToComplete: attemptData.timeToComplete || 0,
      hintsUsed: attemptData.hintsUsed || 0,
      errorsMade: attemptData.errorsMade || 0,
      details: attemptData.details
    };

    // Update session
    session.challenges.push(attempt);
    session.totalAttempts++;

    if (attemptData.successful) {
      session.successfulChallenges++;

      // Check if all challenges are complete
      const allChallenges = await this.getChallengesForAlarm(session.alarmId);
      if (session.successfulChallenges >= allChallenges.length) {
        session.result = 'completed';
        session.completedAt = new Date().toISOString();
        session.sessionDuration = new Date().getTime() - new Date(session.startedAt).getTime();
        session.performance = await this.calculatePerformance(session);

        await this.saveNuclearSession(session);

        // Track completion
        AppAnalyticsService.getInstance().track('nuclear_session_completed', {
          userId: session.userId,
          sessionDuration: session.sessionDuration,
          totalAttempts: session.totalAttempts,
          performance: session.performance.overallScore
        });

        return { continueSession: false, sessionComplete: true };
      }

      // Get next challenge
      const nextChallenge = allChallenges.find(c =>
        !session.challenges.some(attempt =>
          attempt.challengeId === c.id && attempt.successful
        )
      );

      await this.saveNuclearSession(session);
      return { continueSession: true, nextChallenge };

    } else {
      session.failedChallenges++;

      // Check if max attempts exceeded
      challenge.attempts++;
      if (challenge.attempts >= challenge.maxAttempts) {
        session.result = 'failed';
        session.completedAt = new Date().toISOString();

        await this.saveNuclearSession(session);

        // Track failure
        AppAnalyticsService.getInstance().track('nuclear_session_failed', {
          userId: session.userId,
          challengeId,
          attempts: challenge.attempts,
          reason: 'max_attempts_exceeded'
        });

        return { continueSession: false, sessionComplete: false };
      }

      await this.saveNuclearSession(session);
      return { continueSession: true, nextChallenge: challenge };
    }
  }

  /**
   * Get challenges for an alarm
   */
  async getChallengesForAlarm(alarmId: string): Promise<NuclearModeChallenge[]> {
    try {
      const { value } = await Preferences.get({ key: `nuclear_challenges_${alarmId}` });
      if (value) {
        return JSON.parse(value);
      }
      return [];
    } catch (error) {
      console.error('Error getting nuclear challenges:', error);
      return [];
    }
  }

  /**
   * Get specific challenge
   */
  private async getChallenge(challengeId: string): Promise<NuclearModeChallenge | null> {
    // Extract alarm ID from challenge ID pattern
    const alarmId = challengeId.split('_')[0];
    const challenges = await this.getChallengesForAlarm(alarmId);
    return challenges.find(c => c.id === challengeId) || null;
  }

  /**
   * Save nuclear session
   */
  private async saveNuclearSession(session: NuclearModeSession): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: NUCLEAR_SESSIONS_KEY });
      const sessions: NuclearModeSession[] = value ? JSON.parse(value) : [];

      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      // Keep only last 50 sessions
      if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50);
      }

      await Preferences.set({
        key: NUCLEAR_SESSIONS_KEY,
        value: JSON.stringify(sessions)
      });
    } catch (error) {
      console.error('Error saving nuclear session:', error);
    }
  }

  /**
   * Get nuclear session
   */
  private async getNuclearSession(sessionId: string): Promise<NuclearModeSession | null> {
    try {
      const { value } = await Preferences.get({ key: NUCLEAR_SESSIONS_KEY });
      if (value) {
        const sessions: NuclearModeSession[] = JSON.parse(value);
        return sessions.find(s => s.id === sessionId) || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting nuclear session:', error);
      return null;
    }
  }

  /**
   * Calculate session difficulty based on challenges
   */
  private calculateSessionDifficulty(challenges: NuclearModeChallenge[]): number {
    if (challenges.length === 0) return 10;

    const avgDifficulty = challenges.reduce((sum, c) => sum + c.difficulty, 0) / challenges.length;
    const complexityBonus = challenges.length > 3 ? 1 : 0;

    return Math.min(10, Math.round(avgDifficulty + complexityBonus));
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformance(session: NuclearModeSession): Promise<NuclearPerformance> {
    const totalChallenges = session.challenges.length;
    const successfulAttempts = session.challenges.filter(c => c.successful).length;

    // Calculate scores (0-100)
    const accuracy = (successfulAttempts / totalChallenges) * 100;
    const speed = this.calculateSpeedScore(session);
    const persistence = this.calculatePersistenceScore(session);
    const overallScore = (accuracy * 0.4 + speed * 0.3 + persistence * 0.3);

    // Calculate improvement (compared to previous sessions)
    const improvement = await this.calculateImprovement(session.userId, overallScore);

    // Calculate rank (mock for now - would be based on global leaderboard)
    const rank = Math.floor(Math.random() * 1000) + 1;

    return {
      overallScore: Math.round(overallScore),
      speed: Math.round(speed),
      accuracy: Math.round(accuracy),
      persistence: Math.round(persistence),
      improvement,
      rank,
      achievements: this.calculateAchievements(session)
    };
  }

  /**
   * Calculate speed score based on completion times
   */
  private calculateSpeedScore(session: NuclearModeSession): number {
    const completionTimes = session.challenges
      .filter(c => c.successful && c.timeToComplete)
      .map(c => c.timeToComplete!);

    if (completionTimes.length === 0) return 0;

    const avgTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const maxExpectedTime = 120; // 2 minutes per challenge

    // Better performance = lower time = higher score
    return Math.max(0, ((maxExpectedTime - avgTime) / maxExpectedTime) * 100);
  }

  /**
   * Calculate persistence score based on attempts and errors
   */
  private calculatePersistenceScore(session: NuclearModeSession): number {
    if (session.totalAttempts === 0) return 0;

    const avgAttemptsPerChallenge = session.totalAttempts / session.challenges.length;
    const maxAttempts = 3; // Average max attempts per challenge

    // Fewer attempts = higher persistence score
    return Math.max(0, ((maxAttempts - avgAttemptsPerChallenge) / maxAttempts) * 100);
  }

  /**
   * Calculate improvement compared to previous sessions
   */
  private async calculateImprovement(userId: string, currentScore: number): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: `${NUCLEAR_PERFORMANCE_KEY}_${userId}` });
      if (!value) return 0;

      const previousScores = JSON.parse(value) as number[];
      if (previousScores.length === 0) return 0;

      const avgPreviousScore = previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length;
      const improvement = ((currentScore - avgPreviousScore) / avgPreviousScore) * 100;

      // Save current score
      previousScores.push(currentScore);
      if (previousScores.length > 10) {
        previousScores.splice(0, previousScores.length - 10);
      }

      await Preferences.set({
        key: `${NUCLEAR_PERFORMANCE_KEY}_${userId}`,
        value: JSON.stringify(previousScores)
      });

      return Math.round(improvement);
    } catch (error) {
      console.error('Error calculating improvement:', error);
      return 0;
    }
  }

  /**
   * Calculate achievements earned during session
   */
  private calculateAchievements(session: NuclearModeSession): string[] {
    const achievements: string[] = [];

    // Perfect completion
    if (session.successfulChallenges === session.challenges.length && session.totalAttempts === session.challenges.length) {
      achievements.push('nuclear_perfect');
    }

    // Speed demon
    const avgTime = session.challenges
      .filter(c => c.timeToComplete)
      .reduce((sum, c, _, arr) => sum + c.timeToComplete! / arr.length, 0);
    if (avgTime < 60) {
      achievements.push('nuclear_speed_demon');
    }

    // Persistent warrior
    if (session.totalAttempts > session.challenges.length * 2) {
      achievements.push('nuclear_persistent_warrior');
    }

    // Challenge master
    if (session.challenges.length >= 5 && session.successfulChallenges === session.challenges.length) {
      achievements.push('nuclear_challenge_master');
    }

    return achievements;
  }

  /**
   * Get nuclear mode statistics for user
   */
  async getNuclearStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    successRate: number;
    averageScore: number;
    bestScore: number;
    totalChallengesCompleted: number;
    favoriteChallenge: NuclearChallengeType | null;
    achievements: string[];
    ranking: number;
  }> {
    try {
      const { value } = await Preferences.get({ key: NUCLEAR_SESSIONS_KEY });
      if (!value) {
        return {
          totalSessions: 0,
          completedSessions: 0,
          successRate: 0,
          averageScore: 0,
          bestScore: 0,
          totalChallengesCompleted: 0,
          favoriteChallenge: null,
          achievements: [],
          ranking: 0
        };
      }

      const sessions: NuclearModeSession[] = JSON.parse(value);
      const userSessions = sessions.filter(s => s.userId === userId);

      const completedSessions = userSessions.filter(s => s.result === 'completed');
      const scores = completedSessions.map(s => s.performance.overallScore);

      // Calculate favorite challenge type
      const challengeTypes: Record<string, number> = {};
      userSessions.forEach(session => {
        session.challenges.forEach(challenge => {
          challengeTypes[challenge.challenge.type] = (challengeTypes[challenge.challenge.type] || 0) + 1;
        });
      });

      const favoriteChallenge = Object.keys(challengeTypes).length > 0
        ? Object.keys(challengeTypes).reduce((a, b) => challengeTypes[a] > challengeTypes[b] ? a : b) as NuclearChallengeType
        : null;

      // Collect all achievements
      const allAchievements = new Set<string>();
      completedSessions.forEach(session => {
        session.performance.achievements.forEach(achievement => {
          allAchievements.add(achievement);
        });
      });

      return {
        totalSessions: userSessions.length,
        completedSessions: completedSessions.length,
        successRate: userSessions.length > 0 ? (completedSessions.length / userSessions.length) * 100 : 0,
        averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        totalChallengesCompleted: completedSessions.reduce((sum, session) => sum + session.successfulChallenges, 0),
        favoriteChallenge,
        achievements: Array.from(allAchievements),
        ranking: completedSessions.length > 0 ? Math.max(...completedSessions.map(s => s.performance.rank)) : 0
      };
    } catch (error) {
      console.error('Error getting nuclear stats:', error);
      throw error;
    }
  }

  /**
   * Get available challenge types and their descriptions
   */
  getChallengeTypes(): Array<{
    type: NuclearChallengeType;
    name: string;
    description: string;
    difficulty: number;
    estimatedTime: number;
  }> {
    return this.challengeTemplates.map(template => ({
      type: template.type,
      name: template.title,
      description: template.description,
      difficulty: template.difficulty,
      estimatedTime: template.timeLimit || 300
    }));
  }
}

export const nuclearModeService = NuclearModeService.getInstance();