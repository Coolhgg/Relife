// Supabase database and auth mock for testing
import { vi } from 'vitest';

/**
 * Comprehensive Supabase mock for testing database operations and authentication
 * Provides all methods used in the application with proper vitest mocks
 */

// Mock data store for simulating database state
const mockDataStore: Record<string, any[]> = {
  alarms: [],
  users: [],
  subscriptions: [],
  battles: [],
  achievements: [],
  themes: [],
  voice_clips: []
};

// Mock authentication state
let mockAuthState = {
  user: null as any,
  session: null as any,
  isAuthenticated: false
};

const mockSupabaseClient = {
  // Database operations
  from: vi.fn((table: string) => ({
    // SELECT operations
    select: vi.fn((columns?: string) => ({
      eq: vi.fn((column: string, value: any) => ({
        single: vi.fn(() => {
          const data = mockDataStore[table]?.find((item: any) => item[column] === value);
          return Promise.resolve({ data, error: null });
        }),
        limit: vi.fn((count: number) => ({
          data: mockDataStore[table]?.slice(0, count) || [],
          error: null
        })),
        order: vi.fn((column: string, options?: any) => ({
          data: mockDataStore[table]?.sort((a: any, b: any) => {
            const aVal = a[column];
            const bVal = b[column];
            if (options?.ascending === false) {
              return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          }) || [],
          error: null
        })),
        range: vi.fn((from: number, to: number) => ({
          data: mockDataStore[table]?.slice(from, to + 1) || [],
          error: null
        })),
        then: vi.fn((callback: any) => {
          const data = mockDataStore[table]?.filter((item: any) => item[column] === value) || [];
          return Promise.resolve(callback({ data, error: null }));
        })
      })),
      neq: vi.fn((column: string, value: any) => ({
        data: mockDataStore[table]?.filter((item: any) => item[column] !== value) || [],
        error: null
      })),
      gt: vi.fn((column: string, value: any) => ({
        data: mockDataStore[table]?.filter((item: any) => item[column] > value) || [],
        error: null
      })),
      gte: vi.fn((column: string, value: any) => ({
        data: mockDataStore[table]?.filter((item: any) => item[column] >= value) || [],
        error: null
      })),
      lt: vi.fn((column: string, value: any) => ({
        data: mockDataStore[table]?.filter((item: any) => item[column] < value) || [],
        error: null
      })),
      lte: vi.fn((column: string, value: any) => ({
        data: mockDataStore[table]?.filter((item: any) => item[column] <= value) || [],
        error: null
      })),
      like: vi.fn((column: string, pattern: string) => ({
        data: mockDataStore[table]?.filter((item: any) =>
          String(item[column]).includes(pattern.replace('%', ''))
        ) || [],
        error: null
      })),
      in: vi.fn((column: string, values: any[]) => ({
        data: mockDataStore[table]?.filter((item: any) => values.includes(item[column])) || [],
        error: null
      })),
      is: vi.fn((column: string, value: any) => ({
        data: mockDataStore[table]?.filter((item: any) => item[column] === value) || [],
        error: null
      })),
      then: vi.fn((callback: any) => {
        const data = mockDataStore[table] || [];
        return Promise.resolve(callback({ data, error: null }));
      })
    })),

    // INSERT operations
    insert: vi.fn((data: any | any[]) => ({
      select: vi.fn(() => {
        const insertData = Array.isArray(data) ? data : [data];
        const withIds = insertData.map((item: any) => ({
          ...item,
          id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }));

        if (!mockDataStore[table]) mockDataStore[table] = [];
        mockDataStore[table].push(...withIds);

        return Promise.resolve({ data: withIds, error: null });
      }),
      single: vi.fn(() => {
        const insertItem = Array.isArray(data) ? data[0] : data;
        const withId = {
          ...insertItem,
          id: insertItem.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: insertItem.created_at || new Date().toISOString(),
          updated_at: insertItem.updated_at || new Date().toISOString()
        };

        if (!mockDataStore[table]) mockDataStore[table] = [];
        mockDataStore[table].push(withId);

        return Promise.resolve({ data: withId, error: null });
      }),
      then: vi.fn((callback: any) => {
        const insertData = Array.isArray(data) ? data : [data];
        const withIds = insertData.map((item: any) => ({
          ...item,
          id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }));

        if (!mockDataStore[table]) mockDataStore[table] = [];
        mockDataStore[table].push(...withIds);

        return Promise.resolve(callback({ data: withIds, error: null }));
      })
    })),

    // UPDATE operations
    update: vi.fn((data: any) => ({
      eq: vi.fn((column: string, value: any) => ({
        select: vi.fn(() => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const updated = mockDataStore[table].map((item: any) => {
            if (item[column] === value) {
              return { ...item, ...data, updated_at: new Date().toISOString() };
            }
            return item;
          });
          mockDataStore[table] = updated;
          const updatedItems = updated.filter((item: any) => item[column] === value);
          return Promise.resolve({ data: updatedItems, error: null });
        }),
        single: vi.fn(() => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const itemIndex = mockDataStore[table].findIndex((item: any) => item[column] === value);
          if (itemIndex >= 0) {
            mockDataStore[table][itemIndex] = {
              ...mockDataStore[table][itemIndex],
              ...data,
              updated_at: new Date().toISOString()
            };
            return Promise.resolve({ data: mockDataStore[table][itemIndex], error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Record not found' } });
        }),
        then: vi.fn((callback: any) => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const updated = mockDataStore[table].map((item: any) => {
            if (item[column] === value) {
              return { ...item, ...data, updated_at: new Date().toISOString() };
            }
            return item;
          });
          mockDataStore[table] = updated;
          const updatedItems = updated.filter((item: any) => item[column] === value);
          return Promise.resolve(callback({ data: updatedItems, error: null }));
        })
      }))
    })),

    // DELETE operations
    delete: vi.fn(() => ({
      eq: vi.fn((column: string, value: any) => ({
        select: vi.fn(() => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const toDelete = mockDataStore[table].filter((item: any) => item[column] === value);
          mockDataStore[table] = mockDataStore[table].filter((item: any) => item[column] !== value);
          return Promise.resolve({ data: toDelete, error: null });
        }),
        then: vi.fn((callback: any) => {
          if (!mockDataStore[table]) mockDataStore[table] = [];
          const toDelete = mockDataStore[table].filter((item: any) => item[column] === value);
          mockDataStore[table] = mockDataStore[table].filter((item: any) => item[column] !== value);
          return Promise.resolve(callback({ data: toDelete, error: null }));
        })
      }))
    })),

    // UPSERT operations
    upsert: vi.fn((data: any | any[], options?: any) => ({
      select: vi.fn(() => {
        const upsertData = Array.isArray(data) ? data : [data];
        if (!mockDataStore[table]) mockDataStore[table] = [];

        const result = upsertData.map((item: any) => {
          const existingIndex = mockDataStore[table].findIndex((existing: any) =>
            existing.id === item.id ||
            (options?.onConflict && existing[options.onConflict] === item[options.onConflict])
          );

          if (existingIndex >= 0) {
            // Update existing
            mockDataStore[table][existingIndex] = {
              ...mockDataStore[table][existingIndex],
              ...item,
              updated_at: new Date().toISOString()
            };
            return mockDataStore[table][existingIndex];
          } else {
            // Insert new
            const newItem = {
              ...item,
              id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            };
            mockDataStore[table].push(newItem);
            return newItem;
          }
        });

        return Promise.resolve({ data: result, error: null });
      })
    }))
  })),

  // Authentication
  auth: {
    // Current session
    getSession: vi.fn(() => {
      console.log('🔐 Mock Supabase getSession');
      return Promise.resolve({
        data: { session: mockAuthState.session },
        error: null
      });
    }),

    // Get current user
    getUser: vi.fn(() => {
      console.log('👤 Mock Supabase getUser');
      return Promise.resolve({
        data: { user: mockAuthState.user },
        error: null
      });
    }),

    // Sign in with email/password
    signInWithPassword: vi.fn(({ email, password }: any) => {
      console.log(`🔑 Mock Supabase signInWithPassword: ${email}`);
      const user = {
        id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user
      };

      mockAuthState = { user, session, isAuthenticated: true };

      return Promise.resolve({
        data: { user, session },
        error: null
      });
    }),

    // Sign up with email/password
    signUp: vi.fn(({ email, password, options }: any) => {
      console.log(`📝 Mock Supabase signUp: ${email}`);
      const user = {
        id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        email_confirmed_at: null,
        app_metadata: {},
        user_metadata: options?.data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return Promise.resolve({
        data: { user, session: null },
        error: null
      });
    }),

    // Sign out
    signOut: vi.fn(() => {
      console.log('🚪 Mock Supabase signOut');
      mockAuthState = { user: null, session: null, isAuthenticated: false };
      return Promise.resolve({ error: null });
    }),

    // OAuth providers
    signInWithOAuth: vi.fn(({ provider, options }: any) => {
      console.log(`🔗 Mock Supabase signInWithOAuth: ${provider}`);
      return Promise.resolve({
        data: { url: `https://mock-oauth-url.com/${provider}` },
        error: null
      });
    }),

    // Password reset
    resetPasswordForEmail: vi.fn((email: string, options?: any) => {
      console.log(`🔄 Mock Supabase resetPasswordForEmail: ${email}`);
      return Promise.resolve({
        data: {},
        error: null
      });
    }),

    // Auth state changes
    onAuthStateChange: vi.fn((callback: (event: string, session: any) => void) => {
      console.log('👀 Mock Supabase onAuthStateChange');

      // Simulate initial session check
      setTimeout(() => {
        callback(mockAuthState.session ? 'SIGNED_IN' : 'SIGNED_OUT', mockAuthState.session);
      }, 100);

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(() => {
              console.log('🔌 Mock Supabase auth subscription unsubscribed');
            })
          }
        },
        error: null
      };
    }),

    // Admin functions (for testing)
    admin: {
      getUserById: vi.fn((id: string) => {
        console.log(`👑 Mock Supabase admin getUserById: ${id}`);
        return Promise.resolve({
          data: { user: mockDataStore.users?.find((u: any) => u.id === id) },
          error: null
        });
      }),

      updateUserById: vi.fn((id: string, attributes: any) => {
        console.log(`👑 Mock Supabase admin updateUserById: ${id}`);
        return Promise.resolve({
          data: { user: { id, ...attributes } },
          error: null
        });
      })
    }
  },

  // Storage
  storage: {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn((path: string, file: any, options?: any) => {
        console.log(`📦 Mock Supabase storage upload: ${bucket}/${path}`);
        return Promise.resolve({
          data: {
            path: `${bucket}/${path}`,
            id: `mock-file-id-${Math.random().toString(36).substr(2, 9)}`,
            fullPath: `${bucket}/${path}`
          },
          error: null
        });
      }),

      download: vi.fn((path: string) => {
        console.log(`📥 Mock Supabase storage download: ${bucket}/${path}`);
        const mockBlob = new Blob(['mock file content'], { type: 'text/plain' });
        return Promise.resolve({
          data: mockBlob,
          error: null
        });
      }),

      remove: vi.fn((paths: string[]) => {
        console.log(`🗑️ Mock Supabase storage remove: ${bucket}`, paths);
        return Promise.resolve({
          data: paths.map(path => ({ name: path })),
          error: null
        });
      }),

      list: vi.fn((path?: string, options?: any) => {
        console.log(`📋 Mock Supabase storage list: ${bucket}/${path || ''}`);
        return Promise.resolve({
          data: [
            { name: 'mock-file-1.txt', id: 'mock-id-1', updated_at: new Date().toISOString() },
            { name: 'mock-file-2.jpg', id: 'mock-id-2', updated_at: new Date().toISOString() }
          ],
          error: null
        });
      }),

      createSignedUrl: vi.fn((path: string, expiresIn: number) => {
        console.log(`🔗 Mock Supabase storage createSignedUrl: ${bucket}/${path}`);
        return Promise.resolve({
          data: {
            signedUrl: `https://mock-storage-url.com/${bucket}/${path}?token=mock-token`
          },
          error: null
        });
      }),

      getPublicUrl: vi.fn((path: string) => {
        console.log(`🌐 Mock Supabase storage getPublicUrl: ${bucket}/${path}`);
        return {
          data: {
            publicUrl: `https://mock-public-url.com/${bucket}/${path}`
          }
        };
      })
    }))
  },

  // Real-time subscriptions
  channel: vi.fn((topic: string) => ({
    on: vi.fn((event: string, callback: (payload: any) => void) => {
      console.log(`📡 Mock Supabase channel.on: ${topic} - ${event}`);
      return {
        subscribe: vi.fn(() => {
          console.log(`📻 Mock Supabase subscribe: ${topic}`);
          return Promise.resolve('SUBSCRIBED');
        }),
        unsubscribe: vi.fn(() => {
          console.log(`📻 Mock Supabase unsubscribe: ${topic}`);
          return Promise.resolve('CLOSED');
        })
      };
    })
  })),

  // Edge functions
  functions: {
    invoke: vi.fn((functionName: string, options?: any) => {
      console.log(`⚡ Mock Supabase functions.invoke: ${functionName}`, options);
      return Promise.resolve({
        data: { message: 'Mock function response', result: true },
        error: null
      });
    })
  },

  // Internal methods for testing
  _mockReset: vi.fn(() => {
    // Reset mock data store
    Object.keys(mockDataStore).forEach(key => {
      mockDataStore[key] = [];
    });

    // Reset auth state
    mockAuthState = { user: null, session: null, isAuthenticated: false };

    console.log('🧹 Mock Supabase reset');
  }),

  _mockSetUser: vi.fn((user: any, session?: any) => {
    mockAuthState = {
      user,
      session: session || {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user
      },
      isAuthenticated: true
    };
    console.log('👤 Mock Supabase user set', user);
  }),

  _mockAddData: vi.fn((table: string, data: any[]) => {
    if (!mockDataStore[table]) mockDataStore[table] = [];
    mockDataStore[table].push(...data);
    console.log(`📊 Mock Supabase data added to ${table}`, data.length, 'records');
  }),

  _mockGetData: vi.fn((table: string) => {
    return mockDataStore[table] || [];
  })
};

// Factory function for creating fresh mocks
export const createMockSupabase = (url: string, anonKey: string) => {
  console.log(`🗄️ Mock Supabase client created: ${url}`);
  return mockSupabaseClient;
};

export default createMockSupabase;