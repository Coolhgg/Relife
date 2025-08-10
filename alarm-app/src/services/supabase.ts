import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Alarm, AlarmEvent, User as AppUser } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using local storage fallback.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key'
);

export class SupabaseService {
  private static isAvailable = !!supabaseUrl && !!supabaseAnonKey;

  static async signUp(email: string, password: string, name?: string): Promise<{ user: AppUser | null; error: string | null }> {
    if (!this.isAvailable) {
      return { user: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Create user profile
        const userProfile = await this.createUserProfile(data.user);
        return { user: userProfile, error: null };
      }

      return { user: null, error: 'Sign up failed' };
    } catch (error) {
      return { user: null, error: (error as Error).message };
    }
  }

  static async signIn(email: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
    if (!this.isAvailable) {
      return { user: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const userProfile = await this.getUserProfile(data.user.id);
        return { user: userProfile, error: null };
      }

      return { user: null, error: 'Sign in failed' };
    } catch (error) {
      return { user: null, error: (error as Error).message };
    }
  }

  static async signOut(): Promise<{ error: string | null }> {
    if (!this.isAvailable) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  static async getCurrentUser(): Promise<AppUser | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return await this.getUserProfile(user.id);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private static async createUserProfile(user: User): Promise<AppUser> {
    const userProfile: AppUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      preferences: {
        theme: 'auto',
        notificationsEnabled: true,
        voiceDismissalSensitivity: 5,
        defaultVoiceMood: 'motivational',
        hapticFeedback: true,
        snoozeMinutes: 5,
        maxSnoozes: 3
      },
      createdAt: new Date()
    };

    // Insert user profile
    const { error } = await supabase
      .from('users')
      .insert([{
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        preferences: userProfile.preferences,
        created_at: userProfile.createdAt.toISOString()
      }]);

    if (error) {
      console.error('Error creating user profile:', error);
    }

    return userProfile;
  }

  private static async getUserProfile(userId: string): Promise<AppUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error getting user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        preferences: data.preferences,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async saveAlarm(alarm: Alarm): Promise<{ error: string | null }> {
    if (!this.isAvailable) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('alarms')
        .upsert([{
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
          updated_at: alarm.updatedAt.toISOString()
        }]);

      return { error: error?.message || null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  static async loadUserAlarms(userId: string): Promise<{ alarms: Alarm[]; error: string | null }> {
    if (!this.isAvailable) {
      return { alarms: [], error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { alarms: [], error: error.message };
      }

      const alarms: Alarm[] = (data || []).map(row => ({
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
        updatedAt: new Date(row.updated_at)
      }));

      return { alarms, error: null };
    } catch (error) {
      return { alarms: [], error: (error as Error).message };
    }
  }

  static async deleteAlarm(alarmId: string): Promise<{ error: string | null }> {
    if (!this.isAvailable) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('alarms')
        .delete()
        .eq('id', alarmId);

      return { error: error?.message || null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  static async logAlarmEvent(event: AlarmEvent): Promise<{ error: string | null }> {
    if (!this.isAvailable) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('alarm_events')
        .insert([{
          id: event.id,
          alarm_id: event.alarmId,
          fired_at: event.firedAt.toISOString(),
          dismissed: event.dismissed,
          snoozed: event.snoozed,
          user_action: event.userAction,
          dismiss_method: event.dismissMethod
        }]);

      return { error: error?.message || null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  static async getAlarmEvents(alarmId: string): Promise<{ events: AlarmEvent[]; error: string | null }> {
    if (!this.isAvailable) {
      return { events: [], error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('alarm_events')
        .select('*')
        .eq('alarm_id', alarmId)
        .order('fired_at', { ascending: false })
        .limit(50);

      if (error) {
        return { events: [], error: error.message };
      }

      const events: AlarmEvent[] = (data || []).map(row => ({
        id: row.id,
        alarmId: row.alarm_id,
        firedAt: new Date(row.fired_at),
        dismissed: row.dismissed,
        snoozed: row.snoozed,
        userAction: row.user_action,
        dismissMethod: row.dismiss_method
      }));

      return { events, error: null };
    } catch (error) {
      return { events: [], error: (error as Error).message };
    }
  }

  static subscribeToUserAlarms(userId: string, callback: (alarms: Alarm[]) => void): () => void {
    if (!this.isAvailable) {
      return () => {};
    }

    const subscription = supabase
      .channel('user-alarms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarms',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          // Refetch alarms when changes occur
          const { alarms } = await this.loadUserAlarms(userId);
          callback(alarms);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  static isConfigured(): boolean {
    return this.isAvailable;
  }
}