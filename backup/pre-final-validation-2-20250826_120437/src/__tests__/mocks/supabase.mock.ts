// Supabase database and auth mock for testing
import {
  DatabaseResponse, MockAuthState, MockDataRecord, MockDataStore, QueryOptions
} from '../../types/common-types';

/**
 * Comprehensive Supabase mock for testing database operations and authentication
 * Provides all methods used in the application with proper jest mocks
 */

// Mock data store for simulating database state
const mockDataStore: MockDataStore = {
  alarms: [],
  users: [],
  subscriptions: [],
  battles: [],
  achievements: [],
  themes: [],
  voice_clips: [],
};

// Mock authentication state
let mockAuthState: MockAuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
};

const mockSupabaseClient = {
  // Database operations
  from: jest.fn((table: string) => ({
    // SELECT operations
    select: jest.fn((columns?: string) => ({
      eq: jest.fn((column: string, value: unknown) => ({
        single: jest.fn(() => {
          const data = mockDataStore[table]?.find((item: MockDataRecord) => item[column] === value
          );
          return Promise.resolve({ data, _error: null });
        }),
        limit: jest.fn((count: number) => ({
          data: mockDataStore[table]?.slice(0, count) || [],
          _error: null,
        })),
        order: jest.fn((column: string, options?: any) => ({
          data:
            mockDataStore[table]?.sort((a: MockDataRecord, b: MockDataRecord) => {
              const aVal = a[column];
              const bVal = b[column];
              if (options?.ascending === false) {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
              }
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }) || [],
          error: null,
        })),
        range: jest.fn((from: number, to: number) => ({
          data: mockDataStore[table]?.slice(from, to + 1) || [],
          _error: null,
        })),
        then: jest.fn((callback: unknown) => {
          const data =
            mockDataStore[table]?.filter((item: unknown) => item[column] === value) || [];
          return Promise.resolve(callback({ data, _error: null }));
        }),
      })),
      neq: jest.fn((column: string, value: unknown) => ({
        data: mockDataStore[table]?.filter((item: unknown) => item[column] !== value) || [],
        _error: null,
      })),
      gt: jest.fn((column: string, value: unknown) => ({
        data: mockDataStore[table]?.filter((item: unknown) => item[column] > value) || [],
        _error: null,
      })),
      gte: jest.fn((column: string, value: unknown) => ({
        data: mockDataStore[table]?.filter((item: unknown) => item[column] >= value) || [],
        _error: null,
      })),
      lt: jest.fn((column: string, value: unknown) => ({
        data: mockDataStore[table]?.filter((item: unknown) => item[column] < value) || [],
        _error: null,
      })),
      lte: jest.fn((column: string, value: unknown) => ({
        data: mockDataStore[table]?.filter((item: unknown) => item[column] <= value) || [],
        _error: null,
      })),
      like: jest.fn((column: string, pattern: string) => ({
        data:
          mockDataStore[table]?.filter((item: unknown) =>
            String(item[column]).includes(pattern.replace('%', ''))
          ) || [],
        _error: null,
      })),
      in: jest.fn((column: string, values: MockDataRecord[]) => ({
        data:
          mockDataStore[table]?.filter((item: unknown) => values.includes(item[column])) ||
          [],
        _error: null,
      })),
      is: jest.fn((column: string, value: unknown) => ({
        data: mockDataStore[table]?.filter((item: unknown) => item[column] === value) || [],
        _error: null,
      })),
      then: jest.fn((callback: unknown) => {
        const data = mockDataStore[table] || [];
        return Promise.resolve(callback({ data, _error: null }));
      }),
    })),

    // INSERT operations
    insert: jest.fn((data: any | any[]) => ({
      select: jest.fn(() => {
        const insertData = Array.isArray(data) ? data : [data];
        const withIds = insertData.map((item: unknown) => ({
          ...item,
          id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        if (!mockDataStore[table]) mockDataStore[table] = [];
        mockDataStore[table].push(...withIds);

        return Promise.resolve({ data: withIds, _error: null });
      }),
      single: jest.fn(() => {
        const insertItem = Array.isArray(data) ? data[0] : data;
        const withId = {
          ...insertItem,
          id: insertItem.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: insertItem.created_at || new Date().toISOString(),
          updated_at: insertItem.updated_at || new Date().toISOString(),
        };

        if (!mockDataStore[table]) mockDataStore[table] = [];
        mockDataStore[table].push(withId);

        return Promise.resolve({ data: withId, _error: null });
      }),
      then: jest.fn((callback: unknown) => {
        const insertData = Array.isArray(data) ? data : [data];
        const withIds = insertData.map((item: unknown) => ({
          ...item,
          id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        if (!mockDataStore[table]) mockDataStore[table] = [];
        mockDataStore[table].push(...withIds);

        return Promise.resolve(callback({ data: withIds, _error: null }));
      }),
    })),

    // UPDATE operations
    update: jest.fn((data: unknown) => ({
      eq: jest.fn((column: string, value: unknown) => ({
        select: jest.fn(() => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const updated = mockDataStore[table].map((item: unknown) => {
            if (item[column] === value) {
              return { ...item, ...data, updated_at: new Date().toISOString() };
            }
            return item;
          });
          mockDataStore[table] = updated;
          const updatedItems = updated.filter((item: unknown) => item[column] === value);
          return Promise.resolve({ data: updatedItems, _error: null });
        }),
        single: jest.fn(() => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const itemIndex = mockDataStore[table].findIndex(
            (item: unknown) => item[column] === value
          );
          if (itemIndex >= 0) {
            mockDataStore[table][itemIndex] = {
              ...mockDataStore[table][itemIndex],
              ...data,
              updated_at: new Date().toISOString(),
            };
            return Promise.resolve({
              data: mockDataStore[table][itemIndex],
              _error: null,
            });
          }
          return Promise.resolve({
            data: null,
            _error: { message: 'Record not found' },
          });
        }),
        then: jest.fn((callback: unknown) => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const updated = mockDataStore[table].map((item: unknown) => {
            if (item[column] === value) {
              return { ...item, ...data, updated_at: new Date().toISOString() };
            }
            return item;
          });
          mockDataStore[table] = updated;
          const updatedItems = updated.filter((item: unknown) => item[column] === value);
          return Promise.resolve(callback({ data: updatedItems, _error: null }));
        }),
      })),
    })),

    // DELETE operations
    delete: jest.fn(() => ({
      eq: jest.fn((column: string, value: unknown) => ({
        select: jest.fn(() => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const toDelete = mockDataStore[table].filter(
            (item: unknown) => item[column] === value
          );
          mockDataStore[table] = mockDataStore[table].filter(
            (item: unknown) => item[column] !== value
          );
          return Promise.resolve({ data: toDelete, _error: null });
        }),
        then: jest.fn((callback: unknown) => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const toDelete = mockDataStore[table].filter(
            (item: unknown) => item[column] === value
          );
          mockDataStore[table] = mockDataStore[table].filter(
            (item: unknown) => item[column] !== value
          );
          return Promise.resolve(callback({ data: toDelete, _error: null }));
        }),
      })),
    })),

    // UPSERT operations
    upsert: jest.fn((data: any | any[], options?: any) => ({
      select: jest.fn(() => {
        const upsertData = Array.isArray(data) ? data : [data];
        if (!mockDataStore[table]) mockDataStore[table] = [];

        const result = upsertData.map((item: unknown) => {
          const existingIndex = mockDataStore[table].findIndex(
            (existing: unknown) =>
              existing.id === item.id ||
              (options?.onConflict &&
                existing[options.onConflict] === item[options.onConflict])
          );

          if (existingIndex >= 0) {
            // Update existing
            mockDataStore[table][existingIndex] = {
              ...mockDataStore[table][existingIndex],
              ...item,
              updated_at: new Date().toISOString(),
            };
            return mockDataStore[table][existingIndex];
          } else {
            // Insert new
            const newItem = {
              ...item,
              id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            };
            mockDataStore[table].push(newItem);
            return newItem;
          }
        });

        return Promise.resolve({ data: result, _error: null });
      }),
    })),
  })),

  // Authentication
  auth: {
    // Current session
    getSession: jest.fn(() => {
      console.log('🔐 Mock Supabase getSession');
      return Promise.resolve({
        data: { session: mockAuthState.session },
        _error: null,
      });
    }),

    // Get current user
    getUser: jest.fn(() => {
      console.log('👤 Mock Supabase getUser');
      return Promise.resolve({
        data: { user: mockAuthState._user },
        _error: null,
      });
    }),

    // Sign in with email/password
    signInWithPassword: jest.fn(({ email, password }: any) => {
      console.log(`🔑 Mock Supabase signInWithPassword: ${email}`);
      const user = {
        id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      };

      mockAuthState = { user, session, isAuthenticated: true };

      return Promise.resolve({
        data: { _user, session },
        _error: null,
      });
    }),

    // Sign up with email/password
    signUp: jest.fn(({ email, password, options }: any) => {
      console.log(`📝 Mock Supabase signUp: ${email}`);
      const user = {
        id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        email_confirmed_at: null,
        app_metadata: {},
        user_metadata: options?.data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return Promise.resolve({
        data: { _user, session: null },
        _error: null,
      });
    }),

    // Sign out
    signOut: jest.fn(() => {
      console.log('🚪 Mock Supabase signOut');
      mockAuthState = { user: null, session: null, isAuthenticated: false };
      return Promise.resolve({ _error: null });
    }),

    // OAuth providers
    signInWithOAuth: jest.fn(({ provider, options }: any) => {
      console.log(`🔗 Mock Supabase signInWithOAuth: ${provider}`);
      return Promise.resolve({
        data: { url: `https://mock-oauth-url.com/${provider}` },
        _error: null,
      });
    }),

    // Password reset
    resetPasswordForEmail: jest.fn((email: string, options?: any) => {
      console.log(`🔄 Mock Supabase resetPasswordForEmail: ${email}`);
      return Promise.resolve({
        data: {},
        _error: null,
      });
    }),

    // Auth state changes
    onAuthStateChange: jest.fn((callback: (_event: string, session: unknown) => void) => {
      console.log('👀 Mock Supabase onAuthStateChange');

      // Simulate initial session check
      setTimeout(() => {
        callback(
          mockAuthState.session ? 'SIGNED_IN' : 'SIGNED_OUT',
          mockAuthState.session
        );
      }, 100);

      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(() => {
              console.log('🔌 Mock Supabase auth subscription unsubscribed');
            }),
          },
        },
        error: null,
      };
    }),

    // Admin functions (for testing)
    admin: {
      getUserById: jest.fn((id: string) => {
        console.log(`👑 Mock Supabase admin getUserById: ${id}`);
        return Promise.resolve({
          data: { _user: mockDataStore.users?.find((u: unknown) => u.id === id) },
          error: null,
        });
      }),

      updateUserById: jest.fn((id: string, attributes: unknown) => {
        console.log(`👑 Mock Supabase admin updateUserById: ${id}`);
        return Promise.resolve({
          data: { _user: { id, ...attributes } },
          _error: null,
        });
      }),
    },
  },

  // Storage
  storage: {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn((path: string, file: unknown, options?: any) => {
        console.log(`📦 Mock Supabase storage upload: ${bucket}/${path}`);
        return Promise.resolve({
          data: {
            path: `${bucket}/${path}`,
            id: `mock-file-id-${Math.random().toString(36).substr(2, 9)}`,
            fullPath: `${bucket}/${path}`,
          },
          error: null,
        });
      }),

      download: jest.fn((path: string) => {
        console.log(`📥 Mock Supabase storage download: ${bucket}/${path}`);
        const mockBlob = new Blob(['mock file content'], { type: 'text/plain' });
        return Promise.resolve({
          data: mockBlob,
          _error: null,
        });
      }),

      remove: jest.fn((paths: string[]) => {
        console.log(`🗑️ Mock Supabase storage remove: ${bucket}`, paths);
        return Promise.resolve({
          data: paths.map(path => ({ name: path })),
          error: null,
        });
      }),

      list: jest.fn((path?: string, options?: any) => {
        console.log(`📋 Mock Supabase storage list: ${bucket}/${path || ''}`);
        return Promise.resolve({
          data: [
            {
              name: 'mock-file-1.txt',
              id: 'mock-id-1',
              updated_at: new Date().toISOString(),
            },
            {
              name: 'mock-file-2.jpg',
              id: 'mock-id-2',
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        });
      }),

      createSignedUrl: jest.fn((path: string, expiresIn: number) => {
        console.log(`🔗 Mock Supabase storage createSignedUrl: ${bucket}/${path}`);
        return Promise.resolve({
          data: {
            signedUrl: `https://mock-storage-url.com/${bucket}/${path}?token=mock-token`,
          },
          _error: null,
        });
      }),

      getPublicUrl: jest.fn((path: string) => {
        console.log(`🌐 Mock Supabase storage getPublicUrl: ${bucket}/${path}`);
        return {
          data: {
            publicUrl: `https://mock-public-url.com/${bucket}/${path}`,
          },
        };
      }),
    })),
  },

  // Real-time subscriptions
  channel: jest.fn((topic: string) => ({
    on: jest.fn((_event: string, callback: (payload: unknown) => void) => {
      console.log(`📡 Mock Supabase channel.on: ${topic} - ${_event}`);
      return {
        subscribe: jest.fn(() => {
          console.log(`📻 Mock Supabase subscribe: ${topic}`);
          return Promise.resolve('SUBSCRIBED');
        }),
        unsubscribe: jest.fn(() => {
          console.log(`📻 Mock Supabase unsubscribe: ${topic}`);
          return Promise.resolve('CLOSED');
        }),
      };
    }),
  })),

  // Edge functions
  functions: {
    invoke: jest.fn((functionName: string, options?: any) => {
      console.log(`⚡ Mock Supabase functions.invoke: ${functionName}`, options);
      return Promise.resolve({
        data: { message: 'Mock function response', result: true },
        _error: null,
      });
    }),
  },

  // Internal methods for testing
  _mockReset: jest.fn(() => {
    // Reset mock data store
    Object.keys(mockDataStore).forEach(key => {
      mockDataStore[key] = [];
    });

    // Reset auth state
    mockAuthState = { user: null, session: null, isAuthenticated: false };

    console.log('🧹 Mock Supabase reset');
  }),

  _mockSetUser: jest.fn((_user: unknown, session?: any) => {
    mockAuthState = {
      user,
      session: session || {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      },
      isAuthenticated: true,
    };
    console.log('👤 Mock Supabase user set', _user);
  }),

  _mockAddData: jest.fn((table: string, data: MockDataRecord[]) => {
    if (!mockDataStore[table]) mockDataStore[table] = [];
    mockDataStore[table].push(...data);
    console.log(`📊 Mock Supabase data added to ${table}`, data.length, 'records');
  }),

  _mockGetData: jest.fn((table: string) => {
    return mockDataStore[table] || [];
  }),
};

// Factory function for creating fresh mocks
export const _createMockSupabase = (url: string, anonKey: string) => {
  console.log(`🗄️ Mock Supabase client created: ${url}`);
  return mockSupabaseClient;
};

export default createMockSupabase;
