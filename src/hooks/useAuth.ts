/// <reference types="node" />
/// <reference lib="dom" />
import { useState, useEffect, useRef } from "react";
import { SupabaseService, supabase } from "../services/supabase";
import type { User } from "../types";
import { ErrorHandler } from "../services/error-handler";
import AnalyticsService from "../services/analytics";
import SecurityService from "../services/security";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
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
    error: null,
    forgotPasswordSuccess: false,
    sessionExpiry: null,
    csrfToken: null,
    rateLimitRemaining: 10,
  });

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

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

        setAuthState((prev) => ({
          ...prev,
          user,
          isInitialized: true,
          csrfToken,
          sessionExpiry: user
            ? new Date(Date.now() + SESSION_TIMEOUT_MS)
            : null,
        }));

        if (user) {
          startSessionManagement();
        }

        if (user) {
          const analytics = AnalyticsService.getInstance();
          analytics.trackFeatureUsage("user_session_restored", undefined, {
            userId: user.id,
          });
        }
      } catch (error) {
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          "Failed to initialize authentication",
          { context: "auth_initialization" },
        );
        setAuthState((prev) => ({
          ...prev,
          isInitialized: true,
          error: "Failed to initialize authentication",
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (event === "SIGNED_IN" && session?.user) {
        const userProfile = await SupabaseService.getCurrentUser();
        const csrfToken = SecurityService.generateCSRFToken();

        setAuthState((prev) => ({
          ...prev,
          user: userProfile,
          error: null,
          csrfToken,
          sessionExpiry: new Date(Date.now() + SESSION_TIMEOUT_MS),
          rateLimitRemaining: 10,
        }));

        startSessionManagement();

        const analytics = AnalyticsService.getInstance();
        analytics.trackFeatureUsage("user_signed_in", undefined, {
          userId: session.user.id,
        });
      } else if (event === "SIGNED_OUT") {
        stopSessionManagement();
        setAuthState((prev) => ({
          ...prev,
          user: null,
          error: null,
          csrfToken: null,
          sessionExpiry: null,
          rateLimitRemaining: 10,
        }));

        const analytics = AnalyticsService.getInstance();
        analytics.trackFeatureUsage("user_signed_out");
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
      const timeSinceActivity =
        now.getTime() - lastActivityRef.current.getTime();

      // Check for inactivity timeout
      if (timeSinceActivity > INACTIVITY_TIMEOUT_MS) {
        console.log("Session expired due to inactivity");
        signOut();
        return;
      }

      // Check for absolute session timeout
      if (authState.sessionExpiry && now > authState.sessionExpiry) {
        console.log("Session expired");
        signOut();
        return;
      }
    }, 60000); // Check every minute

    // Track user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });
  };

  const stopSessionManagement = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    // Remove activity listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    activityEvents.forEach((event) => {
      document.removeEventListener(event, updateActivity, true);
    });
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Failed to refresh session:", error);
        await signOut();
        return;
      }

      if (data.session) {
        setAuthState((prev) => ({
          ...prev,
          sessionExpiry: new Date(Date.now() + SESSION_TIMEOUT_MS),
          csrfToken: SecurityService.generateCSRFToken(),
        }));

        lastActivityRef.current = new Date();
        console.log("Session refreshed successfully");
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      await signOut();
    }
  };

  const isSessionValid = (): boolean => {
    if (!authState.user || !authState.sessionExpiry) {
      return false;
    }

    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivityRef.current.getTime();

    return (
      now < authState.sessionExpiry && timeSinceActivity < INACTIVITY_TIMEOUT_MS
    );
  };

  const getRateLimitInfo = (action: string) => {
    // This would typically be implemented with a more sophisticated rate limiting system
    // For now, we'll use the SecurityService rate limiting
    try {
      const canProceed = SecurityService.checkRateLimit(
        action,
        5,
        RATE_LIMIT_WINDOW_MS,
      );
      return {
        remaining: canProceed ? authState.rateLimitRemaining - 1 : 0,
        resetTime: canProceed
          ? new Date(Date.now() + RATE_LIMIT_WINDOW_MS)
          : null,
      };
    } catch {
      return { remaining: 0, resetTime: null };
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    // Rate limiting check
    if (!SecurityService.checkRateLimit("sign_in", 5, RATE_LIMIT_WINDOW_MS)) {
      setAuthState((prev) => ({
        ...prev,
        error: "Too many sign-in attempts. Please try again in 15 minutes.",
        rateLimitRemaining: 0,
      }));
      return;
    }

    setAuthState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      forgotPasswordSuccess: false,
      rateLimitRemaining: Math.max(0, prev.rateLimitRemaining - 1),
    }));

    try {
      const analytics = AnalyticsService.getInstance();
      const startTime = performance.now();

      const { user, error } = await SupabaseService.signIn(email, password);

      if (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false, error }));
        analytics.trackError(new Error(error), "sign_in_failed");
        return;
      }

      if (user) {
        setAuthState((prev) => ({
          ...prev,
          user,
          isLoading: false,
          error: null,
        }));

        const duration = performance.now() - startTime;
        analytics.trackFeatureUsage("user_sign_in_success", duration, {
          userId: user.id,
          method: "email_password",
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Sign in failed. Please try again.",
        }));
      }
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        "sign_in_error",
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Sign in failed",
        { context: "sign_in", metadata: { email } },
      );

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "An unexpected error occurred. Please try again.",
      }));
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
  ): Promise<void> => {
    // Rate limiting check
    if (!SecurityService.checkRateLimit("sign_up", 3, RATE_LIMIT_WINDOW_MS)) {
      setAuthState((prev) => ({
        ...prev,
        error: "Too many sign-up attempts. Please try again in 15 minutes.",
        rateLimitRemaining: 0,
      }));
      return;
    }

    setAuthState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      forgotPasswordSuccess: false,
      rateLimitRemaining: Math.max(0, prev.rateLimitRemaining - 1),
    }));

    try {
      const analytics = AnalyticsService.getInstance();
      const startTime = performance.now();

      const { user, error } = await SupabaseService.signUp(
        email,
        password,
        name,
      );

      if (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false, error }));
        analytics.trackError(new Error(error), "sign_up_failed");
        return;
      }

      if (user) {
        setAuthState((prev) => ({
          ...prev,
          user,
          isLoading: false,
          error: null,
        }));

        const duration = performance.now() - startTime;
        analytics.trackFeatureUsage("user_sign_up_success", duration, {
          userId: user.id,
          method: "email_password",
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Account creation failed. Please try again.",
        }));
      }
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        "sign_up_error",
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Sign up failed",
        { context: "sign_up", metadata: { email, name } },
      );

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "An unexpected error occurred. Please try again.",
      }));
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const analytics = AnalyticsService.getInstance();
      const userId = authState.user?.id;

      const { error } = await SupabaseService.signOut();

      if (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false, error }));
        return;
      }

      setAuthState((prev) => ({
        ...prev,
        user: null,
        isLoading: false,
        error: null,
      }));

      analytics.trackFeatureUsage("user_sign_out_success", undefined, {
        userId,
      });
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        "sign_out_error",
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Sign out failed",
        { context: "sign_out" },
      );

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to sign out. Please try again.",
      }));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    // Rate limiting check
    if (
      !SecurityService.checkRateLimit("password_reset", 3, RATE_LIMIT_WINDOW_MS)
    ) {
      setAuthState((prev) => ({
        ...prev,
        error:
          "Too many password reset attempts. Please try again in 15 minutes.",
        rateLimitRemaining: 0,
      }));
      return;
    }

    setAuthState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      forgotPasswordSuccess: false,
      rateLimitRemaining: Math.max(0, prev.rateLimitRemaining - 1),
    }));

    try {
      const analytics = AnalyticsService.getInstance();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        analytics.trackError(new Error(error.message), "password_reset_failed");
        return;
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        forgotPasswordSuccess: true,
      }));

      analytics.trackFeatureUsage("password_reset_requested", undefined, {
        email,
      });
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        "password_reset_error",
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Password reset failed",
        { context: "password_reset", metadata: { email } },
      );

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to send reset email. Please try again.",
      }));
    }
  };

  const clearError = (): void => {
    setAuthState((prev) => ({
      ...prev,
      error: null,
      forgotPasswordSuccess: false,
    }));
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    if (!authState.user) {
      throw new Error("No user logged in");
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const analytics = AnalyticsService.getInstance();

      // Update user profile in Supabase
      const { error } = await supabase
        .from("users")
        .update({
          name: updates.name,
          preferences: updates.preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authState.user.id);

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return;
      }

      // Update local state
      const updatedUser: User = {
        ...authState.user,
        ...updates,
      };

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
        error: null,
      }));

      analytics.trackFeatureUsage("user_profile_updated", undefined, {
        userId: authState.user.id,
        updatedFields: Object.keys(updates),
      });
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        "profile_update_error",
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Failed to update profile",
        {
          context: "profile_update",
          metadata: { userId: authState.user.id, updates },
        },
      );

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to update profile. Please try again.",
      }));
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    updateUserProfile,
    refreshSession,
    isSessionValid,
    getRateLimitInfo,
  };
}

export default useAuth;
