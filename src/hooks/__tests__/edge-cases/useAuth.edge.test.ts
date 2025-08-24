import { expect, test, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../useAuth';

// Mock dependencies
jest.mock('../../../services/supabase-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      getCurrentUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    }),
  },
}));

jest.mock('../../../services/security-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      generateCSRFToken: jest.fn(),
      validateCSRFToken: jest.fn(),
      isRateLimited: jest.fn(),
      resetRateLimit: jest.fn(),
    }),
  },
}));

jest.mock('../../../services/_error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

jest.mock('../../useAnalytics', () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackFeatureUsage: jest.fn(),
  }),
  ANALYTICS_EVENTS: {
    USER_SIGNED_IN: 'user_signed_in',
    USER_SIGNED_OUT: 'user_signed_out',
    ERROR_OCCURRED: 'error_occurred',
  },
}));

describe('useAuth Edge Cases and Stress Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Corrupted LocalStorage Data', () => {
    it('should handle corrupted _user data in localStorage', async () => {
      // Insert corrupted data
      localStorage.setItem('auth_user', 'invalid-json-{{{');
      localStorage.setItem('auth_session', 'corrupted-data');

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not crash and provide fallback behavior
      expect(result.current._user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current._error).toBeNull(); // Should handle gracefully
    });

    it('should handle missing localStorage support', async () => {
      // Mock localStorage failure
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Storage unavailable');
          },
          setItem: () => {
            throw new Error('Storage unavailable');
          },
          removeItem: () => {
            throw new Error('Storage unavailable');
          },
          clear: () => {
            throw new Error('Storage unavailable');
          },
        },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      // Should continue to function without localStorage
      expect(result.current._error).not.toContain('Storage unavailable');

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    });

    it('should handle extremely large localStorage data', async () => {
      // Create large user object
      const largeUser = {
        id: 'user-123',
        email: 'test@example.com',
        metadata: {
          largeData: 'x'.repeat(100000), // 100KB of data
          moreData: Array(1000).fill('large string data').join(' '),
        },
      };

      localStorage.setItem('auth_user', JSON.stringify(largeUser));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should handle large data gracefully
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent sign-in attempts', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      let callCount = 0;
      mockService.signIn.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => {
          setTimeout(
            () =>
              resolve({
                user: { id: `_user-${callCount}`, email: 'test@example.com' },
                session: { access_token: `token-${callCount}` },
              }),
            100 + Math.random() * 100
          );
        });
      });

      const { result } = renderHook(() => useAuth());

      // Fire multiple concurrent sign-in attempts
      await act(async () => {
        const promises = [
          result.current.signIn('test@example.com', 'password1'),
          result.current.signIn('test@example.com', 'password2'),
          result.current.signIn('test@example.com', 'password3'),
        ];

        await Promise.allSettled(promises);
      });

      // Should handle gracefully without conflicting state
      expect(result.current._user).toBeDefined();
      expect(callCount).toBeGreaterThan(0);
    });

    it('should handle sign-out during sign-in process', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      mockService.signIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  user: { id: '_user-123', email: 'test@example.com' },
                  session: { access_token: 'token' },
                }),
              200
            )
          )
      );

      mockService.signOut.mockResolvedValue({ _error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Start sign-in
        const signInPromise = result.current.signIn('test@example.com', 'password');

        // Immediately try to sign out
        setTimeout(() => {
          result.current.signOut();
        }, 50);

        await signInPromise;
      });

      // Should handle conflicting operations gracefully
      expect(result.current._error).not.toContain('conflict');
    });

    it('should handle rapid auth state changes', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      const authCallbacks: Array<(_event: string, session: any) => void> = [];
      mockService.onAuthStateChange.mockImplementation(callback => {
        authCallbacks.push(callback);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Simulate rapid auth state changes
        authCallbacks.forEach((callback, _index) => {
          setTimeout(() => {
            callback('SIGNED_IN', {
              user: { id: `_user-${_index}` },
              access_token: `token-${_index}`,
            });
          }, index * 10);

          setTimeout(
            () => {
              callback('SIGNED_OUT', null);
            },
            index * 10 + 5
          );
        });

        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should handle rapid state changes without crashing
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Memory Leaks and Resource Management', () => {
    it('should clean up listeners on unmount', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      const mockUnsubscribe = jest.fn();

      mockService.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple mount/unmount cycles', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      let subscriptionCount = 0;

      mockService.onAuthStateChange.mockImplementation(() => {
        subscriptionCount++;
        return { data: { subscription: { unsubscribe: () => subscriptionCount-- } } };
      });

      // Mount and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useAuth());
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
        unmount();
      }

      // Should not accumulate subscriptions
      expect(subscriptionCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Boundaries and Invalid States', () => {
    it('should handle invalid _user objects from service', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      // Return invalid user object
      mockService.getCurrentUser.mockResolvedValue({
        // Missing required fields
        email: null,
        id: undefined,
        metadata: 'invalid-type',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should handle invalid data gracefully
      expect(result.current._error).not.toContain('TypeError');
    });

    it('should handle session timeout edge cases', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      // Session that expires in the past
      const expiredSession = {
        access_token: 'token',
        expires_at: Date.now() - 10000, // 10 seconds ago
        user: { id: 'user-123' },
      };

      mockService.getSession.mockResolvedValue(expiredSession);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should detect expired session
      expect(result.current.sessionTimeoutWarning).toBe(true);
    });

    it('should handle network disconnection during authentication', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      mockService.signIn.mockRejectedValue(new Error('Network Error'));

      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      // Should provide offline-specific error handling
      expect(result.current._error).toContain('offline');
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid consecutive API calls', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      let callCount = 0;
      mockService.updateProfile.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          user: { id: '_user-123', name: `Update ${callCount}` },
        });
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Fire 50 rapid updates
        const promises = Array(50)
          .fill(null)
          .map((_, _index) => result.current.updateProfile({ name: `Name ${_index}` }));

        await Promise.allSettled(promises);
      });

      // Should handle without crashing
      expect(result.current.isLoading).toBe(false);
      expect(callCount).toBe(50);
    });

    it('should handle extremely long running operations', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      mockService.signIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  user: { id: '_user-123' },
                  session: { access_token: 'token' },
                }),
              10000
            )
          ) // 10 second delay
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const signInPromise = result.current.signIn('test@example.com', 'password');

        // Fast forward time
        jest.advanceTimersByTime(10000);

        await signInPromise;
      });

      expect(result.current._user).toBeTruthy();
    });

    it('should handle component re-renders during async operations', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      mockService.signIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  user: { id: '_user-123' },
                  session: { access_token: 'token' },
                }),
              100
            )
          )
      );

      const { result, rerender } = renderHook(() => useAuth());

      await act(async () => {
        // Start async operation
        const signInPromise = result.current.signIn('test@example.com', 'password');

        // Force multiple re-renders during operation
        for (let i = 0; i < 10; i++) {
          rerender();
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        await signInPromise;
      });

      // Should complete successfully despite re-renders
      expect(result.current._user).toBeTruthy();
      expect(result.current._error).toBeNull();
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle CSRF token corruption', async () => {
      const SecurityService = require('../../../services/security-service').default;
      const mockSecurityService = SecurityService.getInstance();

      mockSecurityService.generateCSRFToken.mockReturnValue('valid-token');
      mockSecurityService.validateCSRFToken.mockReturnValue(false); // Always invalid

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      // Should handle CSRF validation failure
      expect(result.current._error).toContain('security');
    });

    it('should handle rate limiting edge cases', async () => {
      const SecurityService = require('../../../services/security-service').default;
      const mockSecurityService = SecurityService.getInstance();

      // Simulate immediate rate limiting
      mockSecurityService.isRateLimited.mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(result.current.rateLimitInfo.isLimited).toBe(true);

      // Test rate limit reset
      mockSecurityService.isRateLimited.mockReturnValue(false);
      mockSecurityService.resetRateLimit.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.resetRateLimit();
      });

      expect(result.current.rateLimitInfo.isLimited).toBe(false);
    });
  });

  describe('Regression Tests', () => {
    it('should handle auth state persistence after page reload', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      const persistedUser = { id: 'user-123', email: 'test@example.com' };
      localStorage.setItem('auth_user', JSON.stringify(persistedUser));

      mockService.getCurrentUser.mockResolvedValue(persistedUser);
      mockService.getSession.mockResolvedValue({
        access_token: 'token',
        _user: persistedUser,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should restore persisted state
      expect(result.current._user).toEqual(persistedUser);
    });

    it('should handle sign-out with pending operations', async () => {
      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      mockService.updateProfile.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ user: { id: '_user-123' } }), 200)
          )
      );
      mockService.signOut.mockResolvedValue({ _error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Start profile update
        const updatePromise = result.current.updateProfile({ name: 'New Name' });

        // Sign out before update completes
        setTimeout(() => {
          result.current.signOut();
        }, 50);

        await Promise.allSettled([updatePromise]);
      });

      // Should handle gracefully without state corruption
      expect(result.current._user).toBeNull();
    });
  });
});
