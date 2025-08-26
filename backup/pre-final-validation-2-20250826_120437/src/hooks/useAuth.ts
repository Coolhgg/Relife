/// <reference types="node" />
/// <reference lib="dom" />
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SupabaseService, supabase } from '../services/supabase';
import type { User } from '../types';
import { ErrorHandler } from '../services/error-handler';
import AnalyticsService from '../services/analytics';
import SecurityService from '../services/security';
import { TimeoutHandle } from '../types/timers';
// Removed stub imports - using actual implementations

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  _error: string | null;
  forgotPasswordSuccess: boolean;
  sessionExpiry: Date | null;
  csrfToken: string | null;
  rateLimitRemaining: number;
}

interface AuthHook extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
  isSessionValid: () => boolean;
  getRateLimitInfo: (action: string) => {
    remaining: number;
    resetTime: Date | null;
  };
}

function useAuth(): AuthHook {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: false,
    _error: null,
    forgotPasswordSuccess: false,
    sessionExpiry: null,
    csrfToken: null,
    rateLimitRemaining: 10,
  });

  const sessionTimerRef = useRef<TimeoutHandle | undefined>(undefined);
  const lastActivityRef = useRef<Date>(new Date());
  const analytics = useRef(AnalyticsService.getInstance());

  // Security constants
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await SupabaseService.getCurrentUser();
        const csrfToken = SecurityService.generateCSRFToken();

        setAuthState((prev: AuthState) => ({
          ...prev,
          user,
          isInitialized: true,
          csrfToken,
          sessionExpiry: user ? new Date(Date.now() + SESSION_TIMEOUT_MS) : null,
        }));

        if (user) {
          startSessionManagement();
        }

        if (user) {
          // Using cached analytics service instance
          analytics.current.trackFeatureUsage('user_session_restored', undefined, {
            userId: user.id,
          });
        }
      } catch (_error) {
        ErrorHandler.handleError(
          error instanceof Error ? _error : new Error(String(_error)),
          'Failed to initialize authentication',
          { context: 'auth_initialization' }
        );

        setAuthState((prev: AuthState) => ({
          ...prev,
          isInitialized: true,
          _error: 'Failed to initialize authentication',
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);

      if (_event === 'SIGNED_IN' && session?.user) {
        const userProfile = await SupabaseService.getCurrentUser();
        const csrfToken = SecurityService.generateCSRFToken();

        setAuthState((prev: AuthState) => ({
          ...prev,
          user: userProfile,
          _error: null,
          csrfToken,
          sessionExpiry: new Date(Date.now() + SESSION_TIMEOUT_MS),
          rateLimitRemaining: 10,
        }));

        startSessionManagement();

        // Using cached analytics service instance
        analytics.current.trackFeatureUsage('user_signed_in', undefined, {
          userId: session.user.id,
        });
      } else if (_event === 'SIGNED_OUT') {
        stopSessionManagement();

        setAuthState((prev: AuthState) => ({
          ...prev,
          user: null,
          _error: null,
          csrfToken: null,
          sessionExpiry: null,
          rateLimitRemaining: 10,
        }));

        // Using cached analytics service instance
        analytics.current.trackFeatureUsage('user_signed_out');
      }
    });

    return () => {
      subscription.unsubscribe();
      stopSessionManagement();
    };
  }, []);

  // Session management functions
  const startSessionManagement = () => {
    stopSessionManagement(); // Clear any existing timer

    sessionTimerRef.current = setInterval(() => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - lastActivityRef.current.getTime();

      // Check for inactivity timeout
      if (timeSinceActivity > INACTIVITY_TIMEOUT_MS) {
        console.log('Session expired due to inactivity');
        signOut();
        return;
      }

      // Check for absolute session timeout
      if (authState.sessionExpiry && now > authState.sessionExpiry) {
        console.log('Session expired');
        signOut();
        return;
      }
    }, 60000); // Check every minute

    // Track user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];
    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
  };

  const stopSessionManagement = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = undefined;
    }

    // Remove activity listeners
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];
    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity, true);
    });
  };

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Failed to refresh session:', error);
        await signOut();
        return;
      }

      if (data.session) {
        setAuthState((prev: AuthState) => ({
          ...prev,
          sessionExpiry: new Date(Date.now() + SESSION_TIMEOUT_MS),
          csrfToken: SecurityService.generateCSRFToken(),
        }));

        lastActivityRef.current = new Date();
        console.log('Session refreshed successfully');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await signOut();
    }
  }, []);

  const isSessionValid = useCallback((): boolean => {
    if (!authState.user || !authState.sessionExpiry) {
      return false;
    }

    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivityRef.current.getTime();

    return now < authState.sessionExpiry && timeSinceActivity < INACTIVITY_TIMEOUT_MS;
  }, [authState.user, authState.sessionExpiry]);

  const getRateLimitInfo = useCallback(
    (action: string) => {
      // This would typically be implemented with a more sophisticated rate limiting system
      // For now, we'll use the SecurityService rate limiting
      try {
        const canProceed = SecurityService.checkRateLimit(
          action,
          5,
          RATE_LIMIT_WINDOW_MS
        );
        return {
          remaining: canProceed ? authState.rateLimitRemaining - 1 : 0,
          resetTime: canProceed ? new Date(Date.now() + RATE_LIMIT_WINDOW_MS) : null,
        };
      } catch {
        return { remaining: 0, resetTime: null };
      }
    },
    [authState.rateLimitRemaining]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      // Rate limiting check
      if (!SecurityService.checkRateLimit('sign_in', 5, RATE_LIMIT_WINDOW_MS)) {
        setAuthState((prev: AuthState) => ({
          ...prev,
          _error: 'Too many sign-in attempts. Please try again in 15 minutes.',
          rateLimitRemaining: 0,
        }));
        return;
      }

      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: true,
        _error: null,
        forgotPasswordSuccess: false,
        rateLimitRemaining: Math.max(0, prev.rateLimitRemaining - 1),
      }));

      try {
        // Using cached analytics service instance
        const startTime = performance.now();

        const { user, _error } = await SupabaseService.signIn(email, password);

        if (_error) {
          setAuthState((prev: AuthState) => ({ ...prev, isLoading: false, _error }));
          analytics.current.trackError(new Error(_error), 'sign_in_failed');
          return;
        }

        if (user) {
          setAuthState((prev: AuthState) => ({
            ...prev,
            user,
            isLoading: false,
            _error: null,
          }));

          const duration = performance.now() - startTime;
          analytics.current.trackFeatureUsage('user_sign_in_success', duration, {
            userId: user.id,
            method: 'email_password',
          });
        } else {
          setAuthState((prev: AuthState) => ({
            ...prev,
            isLoading: false,
            _error: 'Sign in failed. Please try again.',
          }));
        }
      } catch (error) {
        // Using cached analytics service instance
        analytics.current.trackError(
          error instanceof Error ? error : new Error(String(error)),
          'sign_in_error'
        );

        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Sign in failed',
          { context: 'sign_in', metadata: { email } }
        );

        setAuthState((prev: AuthState) => ({
          ...prev,
          isLoading: false,
          _error: 'An unexpected error occurred. Please try again.',
        }));
      }
    },
    [authState.rateLimitRemaining]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<void> => {
      // Rate limiting check
      if (!SecurityService.checkRateLimit('sign_up', 3, RATE_LIMIT_WINDOW_MS)) {
        setAuthState((prev: AuthState) => ({
          ...prev,
          _error: 'Too many sign-up attempts. Please try again in 15 minutes.',
          rateLimitRemaining: 0,
        }));
        return;
      }

      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: true,
        _error: null,
        forgotPasswordSuccess: false,
        rateLimitRemaining: Math.max(0, prev.rateLimitRemaining - 1),
      }));

      try {
        // Using cached analytics service instance
        const startTime = performance.now();

        const { user, error } = await SupabaseService.signUp(email, password, name);

        if (error) {
          setAuthState((prev: AuthState) => ({
            ...prev,
            isLoading: false,
            _error: error,
          }));
          analytics.current.trackError(new Error(error), 'sign_up_failed');
          return;
        }

        if (user) {
          setAuthState((prev: AuthState) => ({
            ...prev,
            user,
            isLoading: false,
            _error: null,
          }));

          const duration = performance.now() - startTime;
          analytics.current.trackFeatureUsage('user_sign_up_success', duration, {
            userId: user.id,
            method: 'email_password',
          });
        } else {
          setAuthState((prev: AuthState) => ({
            ...prev,
            isLoading: false,
            _error: 'Account creation failed. Please try again.',
          }));
        }
      } catch (error) {
        // Using cached analytics service instance
        analytics.current.trackError(
          error instanceof Error ? error : new Error(String(error)),
          'sign_up_error'
        );

        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Sign up failed',
          { context: 'sign_up', metadata: { email, name } }
        );

        setAuthState((prev: AuthState) => ({
          ...prev,
          isLoading: false,
          _error: 'An unexpected error occurred. Please try again.',
        }));
      }
    },
    [authState.rateLimitRemaining]
  );

  const signOut = useCallback(async (): Promise<void> => {
    setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, _error: null }));

    try {
      // Using cached analytics service instance
      const userId = authState.user?.id;

      const { error } = await SupabaseService.signOut();

      if (error) {
        setAuthState((prev: AuthState) => ({
          ...prev,
          isLoading: false,
          _error: error,
        }));
        return;
      }

      setAuthState((prev: AuthState) => ({
        ...prev,
        user: null,
        isLoading: false,
        _error: null,
      }));

      analytics.current.trackFeatureUsage('user_sign_out_success', undefined, {
        userId,
      });
    } catch (error) {
      // Using cached analytics service instance
      analytics.current.trackError(
        error instanceof Error ? error : new Error(String(error)),
        'sign_out_error'
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Sign out failed',
        { context: 'sign_out' }
      );

      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        _error: 'Failed to sign out. Please try again.',
      }));
    }
  }, [authState.user?.id]);

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      // Rate limiting check
      if (!SecurityService.checkRateLimit('password_reset', 3, RATE_LIMIT_WINDOW_MS)) {
        setAuthState((prev: AuthState) => ({
          ...prev,
          _error: 'Too many password reset attempts. Please try again in 15 minutes.',
          rateLimitRemaining: 0,
        }));
        return;
      }

      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: true,
        _error: null,
        forgotPasswordSuccess: false,
        rateLimitRemaining: Math.max(0, prev.rateLimitRemaining - 1),
      }));

      try {
        // Using cached analytics service instance

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setAuthState((prev: AuthState) => ({
            ...prev,
            isLoading: false,
            _error: error.message,
          }));
          analytics.current.trackError(
            new Error(error.message),
            'password_reset_failed'
          );
          return;
        }

        setAuthState((prev: AuthState) => ({
          ...prev,
          isLoading: false,
          _error: null,
          forgotPasswordSuccess: true,
        }));

        analytics.current.trackFeatureUsage('password_reset_requested', undefined, {
          email,
        });
      } catch (error) {
        // Using cached analytics service instance
        analytics.current.trackError(
          error instanceof Error ? error : new Error(String(error)),
          'password_reset_error'
        );

        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Password reset failed',
          { context: 'password_reset', metadata: { email } }
        );

        setAuthState((prev: AuthState) => ({
          ...prev,
          isLoading: false,
          _error: 'Failed to send reset email. Please try again.',
        }));
      }
    },
    [authState.rateLimitRemaining]
  );

  const clearError = useCallback((): void => {
    setAuthState((prev: AuthState) => ({
      ...prev,
      _error: null,
      forgotPasswordSuccess: false,
    }));
  }, []);

  const updateUserProfile = useCallback(
    async (updates: Partial<User>): Promise<void> => {
      if (!authState.user) {
        throw new Error('No user logged in');
      }

      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, _error: null }));

      try {
        // Using cached analytics service instance

        // Update user profile in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            name: updates.name,
            preferences: updates.preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authState.user.id);

        if (error) {
          setAuthState((prev: AuthState) => ({
            ...prev,
            isLoading: false,
            _error: error.message,
          }));
          return;
        }

        // Update local state
        const updatedUser: User = {
          ...authState.user,
          ...updates,
        };

        setAuthState((prev: AuthState) => ({
          ...prev,
          user: updatedUser,
          isLoading: false,
          _error: null,
        }));

        analytics.current.trackFeatureUsage('user_profile_updated', undefined, {
          userId: authState.user.id,
          updatedFields: Object.keys(updates),
        });
      } catch (error) {
        // Using cached analytics service instance
        analytics.current.trackError(
          error instanceof Error ? error : new Error(String(error)),
          'profile_update_error'
        );

        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to update profile',
          {
            context: 'profile_update',
            metadata: { userId: authState.user.id, updates },
          }
        );

        setAuthState((prev: AuthState) => ({
          ...prev,
          isLoading: false,
          _error: 'Failed to update profile. Please try again.',
        }));
      }
    },
    [authState.user]
  );

  // Use stable reference for functions object - only recreate when functions change
  const authMethods = useMemo(
    () => ({
      signIn,
      signUp,
      signOut,
      resetPassword,
      clearError,
      updateUserProfile,
      refreshSession,
      isSessionValid,
      getRateLimitInfo,
    }),
    [
      signIn,
      signUp,
      signOut,
      resetPassword,
      clearError,
      updateUserProfile,
      refreshSession,
      isSessionValid,
      getRateLimitInfo,
    ]
  );

  // Only recreate the full object when state or methods actually change
  return useMemo(
    () => ({
      ...authState,
      ...authMethods,
    }),
    [authState, authMethods]
  );
}

export default useAuth;
