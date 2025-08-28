/**
 * Platform Service Mocks (Supabase, Capacitor, External APIs)
 * Provides comprehensive mocks for platform-specific services and external integrations
 */

import type { User } from '@supabase/supabase-js';

// Mock Supabase Client
export class MockSupabaseClient {
  private static instance: MockSupabaseClient;
  private static users: Map<string, User> = new Map();
  private static sessions: Map<string, any> = new Map();
  private static realTimeChannels: Map<string, any> = new Map();
  private static callHistory: Array<{
    method: string;
    args: any[];
    timestamp: number;
  }> = [];

  static getInstance(): MockSupabaseClient {
    if (!this.instance) {
      this.instance = new MockSupabaseClient();
    }
    return this.instance;
  }

  static reset(): void {
    this.users.clear();
    this.sessions.clear();
    this.realTimeChannels.clear();
    this.callHistory = [];
  }

  static getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  private static logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg =>
        typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg
      ),
      timestamp: Date.now(),
    });
  }

  // Auth methods
  auth = {
    signUp: async (credentials: { email: string; password: string }) => {
      MockSupabaseClient.logCall('auth.signUp', [credentials]);

      if (credentials.email === 'existing@example.com') {
        return {
          data: { user: null, session: null },
          error: { message: 'User already exists' },
        };
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email: credentials.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
      };

      const session = {
        access_token: `token_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        expires_in: 3600,
        token_type: 'bearer',
        user,
      };

      MockSupabaseClient.users.set(user.id, user);
      MockSupabaseClient.sessions.set(session.access_token, session);

      return {
        data: { user, session },
        error: null,
      };
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      MockSupabaseClient.logCall('auth.signInWithPassword', [credentials]);

      if (credentials.password === 'wrong') {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' },
        };
      }

      const existingUser = Array.from(MockSupabaseClient.users.values()).find(
        u => u.email === credentials.email
      );

      if (!existingUser) {
        return {
          data: { user: null, session: null },
          error: { message: 'User not found' },
        };
      }

      const session = {
        access_token: `token_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        expires_in: 3600,
        token_type: 'bearer',
        user: existingUser,
      };

      MockSupabaseClient.sessions.set(session.access_token, session);

      return {
        data: { user: existingUser, session },
        error: null,
      };
    },

    signOut: async () => {
      MockSupabaseClient.logCall('auth.signOut', []);

      return {
        error: null,
      };
    },

    getSession: async () => {
      MockSupabaseClient.logCall('auth.getSession', []);

      const sessions = Array.from(MockSupabaseClient.sessions.values());
      const latestSession = sessions[sessions.length - 1] || null;

      return {
        data: { session: latestSession },
        error: null,
      };
    },

    getUser: async (token?: string) => {
      MockSupabaseClient.logCall('auth.getUser', [token]);

      const session = token ? MockSupabaseClient.sessions.get(token) : null;
      const user = session?.user || null;

      return {
        data: { user },
        error: user ? null : { message: 'User not found' },
      };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      MockSupabaseClient.logCall('auth.onAuthStateChange', []);

      // Mock auth state changes
      setTimeout(() => {
        const sessions = Array.from(MockSupabaseClient.sessions.values());
        const session = sessions[sessions.length - 1] || null;
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }, 100);

      return {
        data: { subscription: { unsubscribe: () => {} } },
      };
    },

    resetPasswordForEmail: async (email: string) => {
      MockSupabaseClient.logCall('auth.resetPasswordForEmail', [email]);

      return {
        data: {},
        error: null,
      };
    },
  };

  // Database methods
  from(table: string) {
    return new MockSupabaseQueryBuilder(table);
  }

  // Real-time methods
  channel(name: string) {
    MockSupabaseClient.logCall('channel', [name]);

    const channel = new MockSupabaseRealtimeChannel(name);
    MockSupabaseClient.realTimeChannels.set(name, channel);
    return channel;
  }

  removeChannel(channel: any) {
    MockSupabaseClient.logCall('removeChannel', [channel]);

    if (channel.name) {
      MockSupabaseClient.realTimeChannels.delete(channel.name);
    }
  }

  removeAllChannels() {
    MockSupabaseClient.logCall('removeAllChannels', []);
    MockSupabaseClient.realTimeChannels.clear();
  }
}

// Mock Query Builder
class MockSupabaseQueryBuilder {
  private table: string;
  private queryParams: any = {};
  private static mockData: Map<string, any[]> = new Map();

  constructor(table: string) {
    this.table = table;

    // Initialize mock data for common tables
    if (!MockSupabaseQueryBuilder.mockData.has(table)) {
      this.initializeMockData(table);
    }
  }

  private initializeMockData(table: string): void {
    const mockData: any[] = [];

    switch (table) {
      case 'users':
        mockData.push({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;

      case 'alarms':
        mockData.push({
          id: 'alarm-123',
          user_id: 'user-123',
          time: '07:00:00',
          label: 'Morning Alarm',
          is_active: true,
          days: [1, 2, 3, 4, 5],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;

      case 'subscriptions':
        mockData.push({
          id: 'sub-123',
          user_id: 'user-premium-123',
          tier: 'premium',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;

      case 'battles':
        mockData.push({
          id: 'battle-123',
          creator_id: 'user-123',
          title: 'Morning Champions',
          type: 'weekly_challenge',
          status: 'active',
          max_participants: 10,
          current_participants: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;
    }

    MockSupabaseQueryBuilder.mockData.set(table, mockData);
  }

  select(columns?: string) {
    this.queryParams.select = columns || '*';
    return this;
  }

  insert(data: any | any[]) {
    this.queryParams.insert = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.queryParams.update = data;
    return this;
  }

  upsert(data: any | any[]) {
    this.queryParams.upsert = Array.isArray(data) ? data : [data];
    return this;
  }

  delete() {
    this.queryParams.delete = true;
    return this;
  }

  eq(column: string, value: any) {
    this.queryParams.eq = this.queryParams.eq || {};
    this.queryParams.eq[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.queryParams.neq = this.queryParams.neq || {};
    this.queryParams.neq[column] = value;
    return this;
  }

  gt(column: string, value: any) {
    this.queryParams.gt = this.queryParams.gt || {};
    this.queryParams.gt[column] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.queryParams.gte = this.queryParams.gte || {};
    this.queryParams.gte[column] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.queryParams.lt = this.queryParams.lt || {};
    this.queryParams.lt[column] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.queryParams.lte = this.queryParams.lte || {};
    this.queryParams.lte[column] = value;
    return this;
  }

  like(column: string, pattern: string) {
    this.queryParams.like = this.queryParams.like || {};
    this.queryParams.like[column] = pattern;
    return this;
  }

  in(column: string, values: any[]) {
    this.queryParams.in = this.queryParams.in || {};
    this.queryParams.in[column] = values;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.queryParams.order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.queryParams.limit = count;
    return this;
  }

  range(from: number, to: number) {
    this.queryParams.range = { from, to };
    return this;
  }

  single() {
    this.queryParams.single = true;
    return this;
  }

  // Execute the query
  async then(
    resolve?: (result: any) => void,
    reject?: (error: any) => void
  ): Promise<any> {
    try {
      const result = await this.execute();
      if (resolve) resolve(result);
      return result;
    } catch (error) {
      if (reject) reject(error);
      throw error;
    }
  }

  private async execute(): Promise<any> {
    MockSupabaseClient.logCall(`${this.table}.query`, [this.queryParams]);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));

    let data = MockSupabaseQueryBuilder.mockData.get(this.table) || [];

    // Handle INSERT
    if (this.queryParams.insert) {
      const newRecords = this.queryParams.insert.map((record: any) => ({
        ...record,
        id:
          record.id ||
          `${this.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      data.push(...newRecords);
      MockSupabaseQueryBuilder.mockData.set(this.table, data);

      return {
        data: newRecords,
        error: null,
      };
    }

    // Handle UPDATE
    if (this.queryParams.update) {
      let updatedData = [...data];

      if (this.queryParams.eq) {
        Object.entries(this.queryParams.eq).forEach(([column, value]) => {
          updatedData = updatedData.map(record =>
            record[column] === value
              ? {
                  ...record,
                  ...this.queryParams.update,
                  updated_at: new Date().toISOString(),
                }
              : record
          );
        });
      }

      MockSupabaseQueryBuilder.mockData.set(this.table, updatedData);

      return {
        data: updatedData.filter(record => {
          if (this.queryParams.eq) {
            return Object.entries(this.queryParams.eq).every(
              ([column, value]) => record[column] === value
            );
          }
          return true;
        }),
        error: null,
      };
    }

    // Handle DELETE
    if (this.queryParams.delete) {
      let filteredData = [...data];

      if (this.queryParams.eq) {
        Object.entries(this.queryParams.eq).forEach(([column, value]) => {
          filteredData = filteredData.filter(record => record[column] !== value);
        });
      }

      MockSupabaseQueryBuilder.mockData.set(this.table, filteredData);

      return {
        data: null,
        error: null,
      };
    }

    // Handle SELECT (default)
    let filteredData = [...data];

    // Apply filters
    if (this.queryParams.eq) {
      Object.entries(this.queryParams.eq).forEach(([column, value]) => {
        filteredData = filteredData.filter(record => record[column] === value);
      });
    }

    if (this.queryParams.neq) {
      Object.entries(this.queryParams.neq).forEach(([column, value]) => {
        filteredData = filteredData.filter(record => record[column] !== value);
      });
    }

    if (this.queryParams.in) {
      Object.entries(this.queryParams.in).forEach(
        ([column, values]: [string, any[]]) => {
          filteredData = filteredData.filter(record => values.includes(record[column]));
        }
      );
    }

    // Apply ordering
    if (this.queryParams.order) {
      const { column, ascending } = this.queryParams.order;
      filteredData.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return ascending ? comparison : -comparison;
      });
    }

    // Apply range/limit
    if (this.queryParams.range) {
      const { from, to } = this.queryParams.range;
      filteredData = filteredData.slice(from, to + 1);
    } else if (this.queryParams.limit) {
      filteredData = filteredData.slice(0, this.queryParams.limit);
    }

    // Handle single
    if (this.queryParams.single) {
      if (filteredData.length === 0) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        };
      }

      if (filteredData.length > 1) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'Multiple rows returned' },
        };
      }

      return {
        data: filteredData[0],
        error: null,
      };
    }

    return {
      data: filteredData,
      error: null,
    };
  }

  // Static methods for managing mock data
  static setMockData(table: string, data: any[]): void {
    this.mockData.set(table, data);
  }

  static getMockData(table: string): any[] {
    return this.mockData.get(table) || [];
  }

  static clearMockData(table?: string): void {
    if (table) {
      this.mockData.delete(table);
    } else {
      this.mockData.clear();
    }
  }
}

// Mock Realtime Channel
class MockSupabaseRealtimeChannel {
  public name: string;
  private subscriptions: Array<{ event: string; callback: Function }> = [];
  private static callHistory: Array<{
    method: string;
    args: any[];
    timestamp: number;
  }> = [];

  constructor(name: string) {
    this.name = name;
  }

  static getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  private static logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg =>
        typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg
      ),
      timestamp: Date.now(),
    });
  }

  on(event: string, callback: Function) {
    MockSupabaseRealtimeChannel.logCall('channel.on', [this.name, event]);

    this.subscriptions.push({ event, callback });

    // Simulate initial data
    setTimeout(() => {
      if (event === 'postgres_changes') {
        callback({
          eventType: 'INSERT',
          schema: 'public',
          table: 'alarms',
          new: {
            id: 'new_alarm_123',
            user_id: 'user-123',
            label: 'New Alarm',
            time: '08:00:00',
            is_active: true,
          },
          old: {},
        });
      } else if (event === 'presence') {
        callback({
          event: 'sync',
          payload: {
            user_123: { online_at: new Date().toISOString() },
          },
        });
      } else if (event === 'broadcast') {
        callback({
          event: 'battle_update',
          payload: {
            battle_id: 'battle_123',
            participant_count: 5,
            leaderboard: [{ user_id: 'user_123', score: 100, rank: 1 }],
          },
        });
      }
    }, 100);

    return this;
  }

  subscribe(callback?: (status: string) => void) {
    MockSupabaseRealtimeChannel.logCall('channel.subscribe', [this.name]);

    setTimeout(() => {
      if (callback) callback('SUBSCRIBED');
    }, 50);

    return this;
  }

  unsubscribe() {
    MockSupabaseRealtimeChannel.logCall('channel.unsubscribe', [this.name]);

    this.subscriptions = [];
    return Promise.resolve();
  }

  send(type: string, payload: any) {
    MockSupabaseRealtimeChannel.logCall('channel.send', [this.name, type, payload]);

    // Echo the message back to simulate real-time communication
    setTimeout(() => {
      this.subscriptions.forEach(sub => {
        if (sub.event === 'broadcast') {
          sub.callback({
            event: type,
            payload,
            timestamp: Date.now(),
          });
        }
      });
    }, 10);

    return this;
  }

  // Utility method to trigger events for testing
  trigger(event: string, payload: any) {
    this.subscriptions.forEach(sub => {
      if (sub.event === event) {
        sub.callback(payload);
      }
    });
  }
}

// Export the mock client and utilities
export const createMockSupabaseClient = () => MockSupabaseClient.getInstance();

export { MockSupabaseClient, MockSupabaseQueryBuilder, MockSupabaseRealtimeChannel };

export default {
  MockSupabaseClient,
  MockSupabaseQueryBuilder,
  MockSupabaseRealtimeChannel,
  createMockSupabaseClient,
};
