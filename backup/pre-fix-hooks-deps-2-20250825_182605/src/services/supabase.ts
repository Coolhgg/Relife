import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Alarm, AlarmEvent, User as AppUser } from '../types';
import { ErrorHandler } from './error-handler';
import PerformanceMonitor from './performance-monitor';
import { TimeoutHandle } from '../types/timers';
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { _error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { _user } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { user } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify

interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using local storage fallback.');
}

// Enhanced Supabase client configuration
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'relife-auth',
    },
    global: {
      headers: {
        'x-application': 'relife-alarm-app',
        'x-version': '2.0.0',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export class SupabaseService {
  private static isAvailable = !!supabaseUrl && !!supabaseAnonKey;
  private static cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private static performanceMonitor = PerformanceMonitor.getInstance();
  private static activeConnections = 0;
  private static subscriptions = new Map<string, RealtimeChannel>();

  // Configuration
  private static readonly connectionPool: ConnectionPoolConfig = {
    maxConnections: 10,
    connectionTimeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  private static readonly cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  };

  // Enhanced retry logic with exponential backoff
  private static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    attempts: number = this.connectionPool.retryAttempts
  ): Promise<T> {
    const startTime = performance.now();

    for (let i = 0; i < attempts; i++) {
      try {
        this.activeConnections++;
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Operation timeout')),
              this.connectionPool.connectionTimeout
            )
          ),
        ]);

        const duration = performance.now() - startTime;
        this.performanceMonitor.trackCustomMetric(
          `supabase_${context}_success`,
          duration,
          { attempts: i + 1 }
        );

        return result;
      } catch (_error) {
        const duration = performance.now() - startTime;
        const errorMessage = error instanceof Error ? _error.message : String(_error);

        this.performanceMonitor.trackCustomMetric(
          `supabase_${context}_error`,
          duration,
          {
            attempt: i + 1,
            _error: errorMessage,
          }
        );

        if (i === attempts - 1) {
          ErrorHandler.handleError(
            _error instanceof Error ? _error : new Error(errorMessage),
            `Supabase ${context} failed after ${attempts} attempts`,
            { context: `supabase_${context}`, attempts, duration }
          );
          throw error;
        }

        // Exponential backoff with jitter
        const delay =
          this.connectionPool.retryDelay * Math.pow(2, i) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } finally {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
      }
    }

    throw new Error(`Failed after ${attempts} attempts`);
  }

  // Cache management
  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.performanceMonitor.trackCustomMetric('cache_hit', 1, { key });
      return cached.data as T;
    }

    if (cached) {
      this.cache.delete(key);
    }

    this.performanceMonitor.trackCustomMetric('cache_miss', 1, { key });
    return null;
  }

  private static setCachedData(key: string, data: any, customTtl?: number): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.cacheConfig.ttl,
    });

    this.performanceMonitor.trackCustomMetric('cache_set', 1, { key });
  }

  private static clearCacheByPattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
    this.performanceMonitor.trackCustomMetric('cache_clear', keysToDelete.length, {
      pattern,
    });
  }

  // Connection health check
  private static async healthCheck(): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      const { _error } = await supabase.from('users').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  static async signUp(
    email: string,
    password: string,
    name?: string
  ): Promise<{ user: AppUser | null; _error: string | null }> {
    if (!this.isAvailable) {
      return { user: null, _error: 'Supabase not configured' };
    }

    return await this.withRetry(async () => {
      const { data, _error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (_error) {
        throw new Error(_error.message);
      }

      if (data._user) {
        // Create user profile with retry
        const userProfile = await this.createUserProfile(data._user);
        // Clear any cached user data
        this.clearCacheByPattern(`user_${data._user.id}`);
        return { user: userProfile, _error: null };
      }

      throw new Error('Sign up failed - no _user returned');
    }, 'signup').catch(error => ({
      _user: null,
      _error: _error.message || 'Sign up failed',
    }));
  }

  static async signIn(
    email: string,
    password: string
  ): Promise<{ user: AppUser | null; _error: string | null }> {
    if (!this.isAvailable) {
      return { user: null, _error: 'Supabase not configured' };
    }

    return await this.withRetry(async () => {
      const { data, _error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (_error) {
        throw new Error(_error.message);
      }

      if (data._user) {
        const userProfile = await this.getUserProfile(data._user.id);
        return { user: userProfile, _error: null };
      }

      throw new Error('Sign in failed - no _user returned');
    }, 'signin').catch(error => ({
      _user: null,
      _error: _error.message || 'Sign in failed',
    }));
  }

  static async signOut(): Promise<{ _error: string | null }> {
    if (!this.isAvailable) {
      return { _error: 'Supabase not configured' };
    }

    try {
      const { _error } = await supabase.auth.signOut();
      return { error: _error?.message || null };
    } catch (_error) {
      return { _error: (_error as Error).message };
    }
  }

  static async getCurrentUser(): Promise<AppUser | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (_user) {
        // Try cache first for better performance
        const cacheKey = `user_profile_${user.id}`;
        const cachedProfile = this.getCachedData<AppUser>(cacheKey);
        if (cachedProfile) {
          return cachedProfile;
        }

        const profile = await this.getUserProfile(_user.id);
        if (profile) {
          this.setCachedData(cacheKey, profile);
        }
        return profile;
      }
      return null;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to get current user',
        { context: 'getCurrentUser' }
      );
      return null;
    }
  }

  private static async createUserProfile(_user: User): Promise<AppUser> {
    const userProfile: AppUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      username: user.user_metadata?.name || user.email!.split('@')[0],
      displayName: user.user_metadata?.name || user.email!.split('@')[0],
      level: 1,
      experience: 0,
      joinDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      subscriptionTier: 'free',
      featureAccess: {
        elevenlabsVoices: false,
        customVoiceMessages: false,
        voiceCloning: false,
        advancedAIInsights: false,
        personalizedChallenges: false,
        smartRecommendations: false,
        behaviorAnalysis: false,
        premiumThemes: false,
        customSounds: false,
        advancedPersonalization: false,
        unlimitedCustomization: false,
        advancedScheduling: false,
        smartScheduling: false,
        locationBasedAlarms: false,
        weatherIntegration: false,
        exclusiveBattleModes: false,
        customBattleRules: false,
        advancedStats: false,
        leaderboardFeatures: false,
        premiumSoundLibrary: false,
        exclusiveContent: false,
        adFree: false,
        prioritySupport: false,
      },
      preferences: {
        personalization: {
          theme: {
            mode: 'auto',
            primaryColor: '#3b82f6',
            accentColor: '#f59e0b',
            backgroundColor: '#ffffff',
            cardColor: '#f9fafb',
            borderColor: '#e5e7eb',
          },
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 'normal',
            lineHeight: 1.5,
          },
          layout: {
            compactMode: false,
            sidebarPosition: 'left',
            cardSpacing: 'normal',
          },
          motion: {
            reducedMotion: false,
            animationSpeed: 'normal',
          },
          accessibility: {
            highContrast: false,
            largeText: false,
            screenReaderOptimized: false,
          },
          sounds: {
            volume: 0.8,
            enableHaptics: true,
            soundProfile: 'balanced',
          },
        },
        notificationsEnabled: true,
        soundEnabled: true,
        voiceDismissalSensitivity: 5,
        defaultVoiceMood: 'motivational',
        hapticFeedback: true,
        snoozeMinutes: 5,
        maxSnoozes: 3,
        rewardsEnabled: true,
        aiInsightsEnabled: true,
        personalizedMessagesEnabled: true,
        shareAchievements: true,
        battleNotifications: true,
        friendRequests: true,
        trashTalkEnabled: false,
        autoJoinBattles: false,
        smartFeaturesEnabled: true,
        fitnessIntegration: false,
        locationChallenges: false,
        photoChallenges: false,
      },
      createdAt: new Date(),
    };

    // Insert user profile with retry logic
    await this.withRetry(async () => {
      const { _error } = await supabase.from('users').insert([
        {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          username: userProfile.username,
          display_name: userProfile.displayName,
          level: userProfile.level,
          experience: userProfile.experience,
          join_date: userProfile.joinDate,
          last_active: userProfile.lastActive,
          subscription_tier: userProfile.subscriptionTier,
          feature_access: userProfile.featureAccess,
          preferences: userProfile.preferences,
          created_at: userProfile.createdAt.toISOString(),
        },
      ]);

      if (_error) {
        throw new Error(`Failed to create _user profile: ${_error.message}`);
      }
    }, 'createUserProfile');

    // Cache the new profile
    this.setCachedData(`user_profile_${userProfile.id}`, userProfile);

    return userProfile;
  }

  private static async getUserProfile(userId: string): Promise<AppUser | null> {
    const cacheKey = `user_profile_${userId}`;

    // Check cache first
    const cached = this.getCachedData<AppUser>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      return await this.withRetry(async () => {
        const { data, _error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (_error) {
          throw new Error(`Failed to get _user profile: ${_error.message}`);
        }

        if (!data) {
          throw new Error('User profile not found');
        }

        const profile: AppUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          username: data.username || data.email.split('@')[0],
          displayName: data.display_name || data.name || data.email.split('@')[0],
          level: data.level || 1,
          experience: data.experience || 0,
          joinDate: data.join_date || data.created_at,
          lastActive: data.last_active || data.created_at,
          subscriptionTier: data.subscription_tier || 'free',
          featureAccess: data.feature_access || {
            elevenlabsVoices: false,
            customVoiceMessages: false,
            voiceCloning: false,
            advancedAIInsights: false,
            personalizedChallenges: false,
            smartRecommendations: false,
            behaviorAnalysis: false,
            premiumThemes: false,
            customSounds: false,
            advancedPersonalization: false,
            unlimitedCustomization: false,
            advancedScheduling: false,
            smartScheduling: false,
            locationBasedAlarms: false,
            weatherIntegration: false,
            exclusiveBattleModes: false,
            customBattleRules: false,
            advancedStats: false,
            leaderboardFeatures: false,
            premiumSoundLibrary: false,
            exclusiveContent: false,
            adFree: false,
            prioritySupport: false,
          },
          preferences: data.preferences,
          createdAt: new Date(data.created_at),
        };

        // Cache the result
        this.setCachedData(cacheKey, profile);

        return profile;
      }, 'getUserProfile');
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to get user profile',
        { context: 'getUserProfile', userId }
      );
      return null;
    }
  }

  static async saveAlarm(alarm: Alarm): Promise<{ _error: string | null }> {
    if (!this.isAvailable) {
      return { _error: 'Supabase not configured' };
    }

    try {
      return await this.withRetry(async () => {
        const { _error } = await supabase.from('alarms').upsert(
          [
            {
              id: alarm.id,
              user_id: alarm.userId,
              time: alarm.time,
              label: alarm.label,
              enabled: alarm.enabled,
              days: alarm.days,
              voice_mood: alarm.voiceMood,
              snooze_count: alarm.snoozeCount,
              last_triggered: alarm.lastTriggered?.toISOString(),
              created_at: alarm.createdAt.toISOString(),
              updated_at: alarm.updatedAt.toISOString(),
            },
          ],
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

        if (_error) {
          throw new Error(`Failed to save alarm: ${_error.message}`);
        }

        // Clear related cache
        this.clearCacheByPattern(`alarms_${alarm.userId}`);
        this.clearCacheByPattern(`alarm_${alarm.id}`);

        return { _error: null };
      }, 'saveAlarm');
    } catch (_error) {
      return { _error: (_error as Error).message };
    }
  }

  static async loadUserAlarms(
    userId: string
  ): Promise<{ alarms: Alarm[]; _error: string | null }> {
    if (!this.isAvailable) {
      return { alarms: [], _error: 'Supabase not configured' };
    }

    const cacheKey = `alarms_${userId}`;

    // Check cache first for better performance
    const cached = this.getCachedData<Alarm[]>(cacheKey);
    if (cached) {
      return { alarms: cached, _error: null };
    }

    try {
      return await this.withRetry(async () => {
        const { data, _error } = await supabase
          .from('alarms')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (_error) {
          throw new Error(`Failed to load alarms: ${_error.message}`);
        }

        const alarms: Alarm[] = (data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          time: row.time,
          label: row.label,
          enabled: row.enabled,
          days: row.days,
          voiceMood: row.voice_mood,
          snoozeCount: row.snooze_count || 0,
          lastTriggered: row.last_triggered ? new Date(row.last_triggered) : undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));

        // Cache the result
        this.setCachedData(cacheKey, alarms);

        return { alarms, _error: null };
      }, 'loadUserAlarms');
    } catch (_error) {
      return { alarms: [], _error: (_error as Error).message };
    }
  }

  static async deleteAlarm(alarmId: string): Promise<{ _error: string | null }> {
    if (!this.isAvailable) {
      return { _error: 'Supabase not configured' };
    }

    try {
      const { _error } = await supabase.from('alarms').delete().eq('id', alarmId);

      return { error: _error?.message || null };
    } catch (_error) {
      return { _error: (_error as Error).message };
    }
  }

  static async logAlarmEvent(_event: AlarmEvent): Promise<{ _error: string | null }> {
    if (!this.isAvailable) {
      return { _error: 'Supabase not configured' };
    }

    try {
      const { _error } = await supabase.from('alarm_events').insert([
        {
          id: event.id,
          alarm_id: event.alarmId,
          fired_at: _event.firedAt.toISOString(),
          dismissed: event.dismissed,
          snoozed: event.snoozed,
          user_action: event.userAction,
          dismiss_method: event.dismissMethod,
        },
      ]);

      return { error: _error?.message || null };
    } catch (_error) {
      return { _error: (_error as Error).message };
    }
  }

  static async getAlarmEvents(
    alarmId: string
  ): Promise<{ events: AlarmEvent[]; _error: string | null }> {
    if (!this.isAvailable) {
      return { events: [], _error: 'Supabase not configured' };
    }

    try {
      const { data, _error } = await supabase
        .from('alarm_events')
        .select('*')
        .eq('alarm_id', alarmId)
        .order('fired_at', { ascending: false })
        .limit(50);

      if (_error) {
        return { events: [], error: _error.message };
      }

      const events: AlarmEvent[] = (data || []).map((row: any) => ({
        id: row.id,
        alarmId: row.alarm_id,
        firedAt: new Date(row.fired_at),
        dismissed: row.dismissed,
        snoozed: row.snoozed,
        userAction: row.user_action,
        dismissMethod: row.dismiss_method,
      }));

      return { events, _error: null };
    } catch (_error) {
      return { events: [], _error: (_error as Error).message };
    }
  }

  static subscribeToUserAlarms(
    userId: string,
    callback: (alarms: Alarm[]) => void
  ): () => void {
    if (!this.isAvailable) {
      return () => {};
    }

    const channelName = `user-alarms-${userId}`;

    // Clean up existing subscription if any
    const existingSubscription = this.subscriptions.get(channelName);
    if (existingSubscription) {
      existingSubscription.unsubscribe();
      this.subscriptions.delete(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          _event: '*',
          schema: 'public',
          table: 'alarms',
          filter: `user_id=eq.${userId}`,
        },
        async payload => {
          try {
            // Clear cache to ensure fresh data
            this.clearCacheByPattern(`alarms_${userId}`);

            // Optimize: only refetch if we can't reconstruct from payload
            const { alarms } = await this.loadUserAlarms(userId);
            callback(alarms);

            this.performanceMonitor.trackCustomMetric('realtime_alarm_update', 1, {
              _event: payload.eventType,
              userId,
            });
          } catch (_error) {
            ErrorHandler.handleError(
              error instanceof Error ? _error : new Error(String(_error)),
              'Failed to handle real-time alarm update',
              { context: 'subscribeToUserAlarms', userId }
            );
          }
        }
      )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          this.performanceMonitor.trackCustomMetric(
            'realtime_subscription_success',
            1,
            { userId }
          );
        } else if (status === 'CLOSED') {
          this.performanceMonitor.trackCustomMetric('realtime_subscription_closed', 1, {
            userId,
          });
        }
      });

    this.subscriptions.set(channelName, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(channelName);
    };
  }

  static isConfigured(): boolean {
    return this.isAvailable;
  }

  // Enhanced connection monitoring
  static async getConnectionStatus(): Promise<{
    isConnected: boolean;
    latency: number;
    activeConnections: number;
    cacheSize: number;
    subscriptionCount: number;
  }> {
    const startTime = performance.now();
    const isConnected = await this.healthCheck();
    const latency = performance.now() - startTime;

    return {
      isConnected,
      latency,
      activeConnections: this.activeConnections,
      cacheSize: this.cache.size,
      subscriptionCount: this.subscriptions.size,
    };
  }

  // Bulk operations for better performance
  static async bulkSaveAlarms(
    alarms: Alarm[]
  ): Promise<{ success: number; errors: string[] }> {
    if (!this.isAvailable) {
      return { success: 0, errors: ['Supabase not configured'] };
    }

    const errors: string[] = [];
    let success = 0;

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < alarms.length; i += batchSize) {
      const batch = alarms.slice(i, i + batchSize);

      try {
        await this.withRetry(async () => {
          const { _error } = await supabase.from('alarms').upsert(
            batch.map(alarm => ({
              id: alarm.id,
              user_id: alarm.userId,
              time: alarm.time,
              label: alarm.label,
              enabled: alarm.enabled,
              days: alarm.days,
              voice_mood: alarm.voiceMood,
              snooze_count: alarm.snoozeCount,
              last_triggered: alarm.lastTriggered?.toISOString(),
              created_at: alarm.createdAt.toISOString(),
              updated_at: alarm.updatedAt.toISOString(),
            })),
            {
              onConflict: 'id',
              ignoreDuplicates: false,
            }
          );

          if (_error) {
            throw new Error(_error.message);
          }

          success += batch.length;

          // Clear cache for affected users
          const userIds = [...new Set(batch.map(alarm => alarm.userId))];
          userIds.forEach(userId => this.clearCacheByPattern(`alarms_${userId}`));
        }, 'bulkSaveAlarms');
      } catch (_error) {
        errors.push(
          `Batch ${i}-${i + batchSize - 1}: ${error instanceof Error ? _error.message : String(_error)}`
        );
      }
    }

    return { success, errors };
  }

  // Cache maintenance
  static clearAllCache(): void {
    this.cache.clear();
    this.performanceMonitor.trackCustomMetric('cache_clear_all', 1);
  }

  static getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(entry => entry.timestamp);

    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Calculate hit rate from metrics
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  // Cleanup method for app shutdown
  static cleanup(): void {
    // Unsubscribe from all real-time subscriptions
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // Clear cache
    this.clearAllCache();

    this.performanceMonitor.trackCustomMetric('supabase_cleanup', 1);
  }
}
