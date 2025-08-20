/**
 * Unit tests for useAuth hook
 * Tests authentication, session management, rate limiting, and security features
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import useAuth from "../useAuth";
import {
  renderHookWithProviders,
  createMockUser,
  clearAllMocks,
} from "../../__tests__/utils/hook-testing-utils";
import {
  server,
  mockApiError,
  mockApiSuccess,
} from "../../__tests__/mocks/msw-setup";
import { SupabaseService, supabase } from "../../services/supabase";
import SecurityService from "../../services/security";
import AnalyticsService from "../../services/analytics";

// Mock services
jest.mock("../../services/supabase", () => ({
  SupabaseService: {
    getCurrentUser: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  },
}));

jest.mock("../../services/error-handler", () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

jest.mock("../../services/analytics", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      trackFeatureUsage: jest.fn(),
      trackError: jest.fn(),
    })),
  },
}));

jest.mock("../../services/security", () => ({
  __esModule: true,
  default: {
    generateCSRFToken: jest.fn(() => "mock-csrf-token"),
    checkRateLimit: jest.fn(() => true),
  },
}));

// Mock performance
Object.defineProperty(window, "performance", {
  value: {
    now: jest.fn(() => 1000),
  },
  writable: true,
});

describe("useAuth Hook", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Reset all mocks to default successful responses
      // SupabaseService and supabase are now imported at the top
      // SecurityService is now imported at the top

    SupabaseService.getCurrentUser.mockResolvedValue(null);
    SupabaseService.signIn.mockResolvedValue({ user: mockUser, error: null });
    SupabaseService.signUp.mockResolvedValue({ user: mockUser, error: null });
    SupabaseService.signOut.mockResolvedValue({ error: null });

    supabase.auth.refreshSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    SecurityService.checkRateLimit.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHookWithProviders(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.forgotPasswordSuccess).toBe(false);
      expect(result.current.sessionExpiry).toBeNull();
      expect(result.current.csrfToken).toBeNull();
      expect(result.current.rateLimitRemaining).toBe(10);
    });

    it("should initialize auth state on mount", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHookWithProviders(() => useAuth());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.csrfToken).toBe("mock-csrf-token");
      expect(result.current.sessionExpiry).toBeInstanceOf(Date);
    });

    it("should handle initialization errors", async () => {
      // SupabaseService and supabase are now imported at the top
      const errorMessage = "Network error";
      SupabaseService.getCurrentUser.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHookWithProviders(() => useAuth());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.error).toBe("Failed to initialize authentication");
      expect(result.current.user).toBeNull();
    });
  });

  describe("Sign In", () => {
    it("should sign in successfully", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.signIn.mockResolvedValue({ user: mockUser, error: null });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(SupabaseService.signIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    it("should handle sign in errors", async () => {
      // SupabaseService and supabase are now imported at the top
      const errorMessage = "Invalid credentials";
      SupabaseService.signIn.mockResolvedValue({
        user: null,
        error: errorMessage,
      });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "wrongpassword");
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it("should handle rate limiting on sign in", async () => {
      // SecurityService is now imported at the top
      SecurityService.checkRateLimit.mockReturnValue(false);

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.error).toBe(
        "Too many sign-in attempts. Please try again in 15 minutes.",
      );
      expect(result.current.rateLimitRemaining).toBe(0);
    });

    it("should handle network errors during sign in", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.signIn.mockRejectedValue(new Error("Network error"));

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.error).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Sign Up", () => {
    it("should sign up successfully", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.signUp.mockResolvedValue({ user: mockUser, error: null });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signUp(
          "test@example.com",
          "password123",
          "Test User",
        );
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(SupabaseService.signUp).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        "Test User",
      );
    });

    it("should handle sign up errors", async () => {
      // SupabaseService and supabase are now imported at the top
      const errorMessage = "Email already exists";
      SupabaseService.signUp.mockResolvedValue({
        user: null,
        error: errorMessage,
      });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signUp(
          "existing@example.com",
          "password123",
          "Test User",
        );
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it("should handle rate limiting on sign up", async () => {
      // SecurityService is now imported at the top
      SecurityService.checkRateLimit.mockReturnValue(false);

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signUp(
          "test@example.com",
          "password123",
          "Test User",
        );
      });

      expect(result.current.error).toBe(
        "Too many sign-up attempts. Please try again in 15 minutes.",
      );
      expect(result.current.rateLimitRemaining).toBe(0);
    });
  });

  describe("Sign Out", () => {
    it("should sign out successfully", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHookWithProviders(() => useAuth());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(SupabaseService.signOut).toHaveBeenCalled();
    });

    it("should handle sign out errors", async () => {
      // SupabaseService and supabase are now imported at the top
      const errorMessage = "Sign out failed";
      SupabaseService.signOut.mockResolvedValue({ error: errorMessage });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Password Reset", () => {
    it("should reset password successfully", async () => {
      // supabase is now imported at the top
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.resetPassword("test@example.com");
      });

      expect(result.current.forgotPasswordSuccess).toBe(true);
      expect(result.current.error).toBeNull();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        { redirectTo: `${window.location.origin}/reset-password` },
      );
    });

    it("should handle password reset errors", async () => {
      // supabase is now imported at the top
      const errorMessage = "Email not found";
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: errorMessage },
      });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.resetPassword("nonexistent@example.com");
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.forgotPasswordSuccess).toBe(false);
    });

    it("should handle rate limiting on password reset", async () => {
      // SecurityService is now imported at the top
      SecurityService.checkRateLimit.mockReturnValue(false);

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.resetPassword("test@example.com");
      });

      expect(result.current.error).toBe(
        "Too many password reset attempts. Please try again in 15 minutes.",
      );
      expect(result.current.rateLimitRemaining).toBe(0);
    });
  });

  describe("Session Management", () => {
    it("should validate active session", () => {
      const { result } = renderHookWithProviders(() => useAuth());

      // Mock active session
      act(() => {
        result.current.isSessionValid();
      });

      // Without a user, session should be invalid
      expect(result.current.isSessionValid()).toBe(false);
    });

    it("should refresh session successfully", async () => {
      // supabase is now imported at the top
      supabase.auth.refreshSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    it("should handle session refresh errors", async () => {
      // SupabaseService and supabase are now imported at the top
      supabase.auth.refreshSession.mockResolvedValue({
        data: null,
        error: new Error("Session expired"),
      });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(SupabaseService.signOut).toHaveBeenCalled();
    });

    it("should handle inactivity timeout", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHookWithProviders(() => useAuth());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Fast-forward time to trigger inactivity timeout
      act(() => {
        jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes (exceeds 15 minute limit)
      });

      expect(SupabaseService.signOut).toHaveBeenCalled();
    });
  });

  describe("Profile Updates", () => {
    it("should update user profile successfully", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHookWithProviders(() => useAuth());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const updates = { name: "Updated Name" };

      await act(async () => {
        await result.current.updateUserProfile(updates);
      });

      expect(result.current.user?.name).toBe("Updated Name");
      expect(result.current.error).toBeNull();
    });

    it("should handle profile update errors", async () => {
      // SupabaseService and supabase are now imported at the top
      SupabaseService.getCurrentUser.mockResolvedValue(mockUser);

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: { message: "Update failed" } }),
        }),
      });

      const { result } = renderHookWithProviders(() => useAuth());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.updateUserProfile({ name: "New Name" });
      });

      expect(result.current.error).toBe("Update failed");
    });

    it("should throw error when updating profile without user", async () => {
      const { result } = renderHookWithProviders(() => useAuth());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateUserProfile({ name: "New Name" });
        });
      }).rejects.toThrow("No user logged in");
    });
  });

  describe("Rate Limiting", () => {
    it("should return rate limit information", () => {
      const { result } = renderHookWithProviders(() => useAuth());

      const rateLimitInfo = result.current.getRateLimitInfo("sign_in");

      expect(rateLimitInfo).toHaveProperty("remaining");
      expect(rateLimitInfo).toHaveProperty("resetTime");
      expect(typeof rateLimitInfo.remaining).toBe("number");
    });

    it("should handle rate limit service errors", () => {
      // SecurityService is now imported at the top
      SecurityService.checkRateLimit.mockImplementation(() => {
        throw new Error("Rate limit service error");
      });

      const { result } = renderHookWithProviders(() => useAuth());

      const rateLimitInfo = result.current.getRateLimitInfo("sign_in");

      expect(rateLimitInfo.remaining).toBe(0);
      expect(rateLimitInfo.resetTime).toBeNull();
    });
  });

  describe("Utility Functions", () => {
    it("should clear errors", () => {
      const { result } = renderHookWithProviders(() => useAuth());

      // Set an error first
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.forgotPasswordSuccess).toBe(false);
    });
  });

  describe("Analytics Integration", () => {
    it("should track successful sign in", async () => {
      // SupabaseService and supabase are now imported at the top
      // AnalyticsService is now imported at the top
      const mockAnalytics = { trackFeatureUsage: jest.fn() };
      AnalyticsService.getInstance.mockReturnValue(mockAnalytics);

      SupabaseService.signIn.mockResolvedValue({ user: mockUser, error: null });

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalledWith(
        "user_sign_in_success",
        expect.any(Number),
        {
          userId: mockUser.id,
          method: "email_password",
        },
      );
    });

    it("should track errors", async () => {
      // SupabaseService and supabase are now imported at the top
      // AnalyticsService is now imported at the top
      const mockAnalytics = { trackError: jest.fn() };
      AnalyticsService.getInstance.mockReturnValue(mockAnalytics);

      SupabaseService.signIn.mockRejectedValue(new Error("Network error"));

      const { result } = renderHookWithProviders(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockAnalytics.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        "sign_in_error",
      );
    });
  });

  describe("Auth State Changes", () => {
    it("should handle auth state change listener", async () => {
      // supabase is now imported at the top
      let authStateChangeCallback: (event: string, session: any) => void;

      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      const { result } = renderHookWithProviders(() => useAuth());

      // Simulate signed in event
      await act(async () => {
        authStateChangeCallback("SIGNED_IN", { user: mockUser });
      });

      // The hook should update state based on auth changes
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it("should handle signed out event", async () => {
      // supabase is now imported at the top
      let authStateChangeCallback: (event: string, session: any) => void;

      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      const { result } = renderHookWithProviders(() => useAuth());

      // Simulate signed out event
      await act(async () => {
        authStateChangeCallback("SIGNED_OUT", null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.sessionExpiry).toBeNull();
    });
  });
});
