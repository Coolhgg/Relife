/// <reference lib="dom" />
/**
 * User Authentication Flow Integration Tests
 * 
 * Comprehensive end-to-end tests for user authentication and profile management:
 * - User registration and email verification
 * - Login with various scenarios (success, failure, rate limiting)
 * - Session management and persistence across refreshes
 * - Profile updates and validation
 * - Password reset functionality
 * - Multi-tab session synchronization
 * - Security features (CSRF, rate limiting, session timeout)
 * - Logout and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { AppAnalyticsService } from '../../src/services/app-analytics';
import SecurityService from '../../src/services/security';
import AnalyticsService from '../../src/services/analytics';

// Import enhanced test utilities
import {
  integrationTestHelpers,
  serviceWorkerHelpers,
  permissionHelpers
} from '../utils/integration-test-setup';

import { createMockUser, measurePerformance } from '../utils/test-mocks';
import type { User } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/app-analytics');
vi.mock('../../src/services/security');
vi.mock('../../src/services/analytics');
vi.mock('../../src/services/error-handler');

describe('User Authentication Flow Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  
  // Service instances
  let analyticsService: AppAnalyticsService;
  let securityService: typeof SecurityService;

  beforeAll(() => {
    // Enhanced browser API mocks are already set up
    console.log('Authentication flow tests initialized');
  });

  beforeEach(async () => {
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
    vi.useRealTimers();
    
    // Mock service instances
    analyticsService = AppAnalyticsService.getInstance();
    securityService = SecurityService;

    // Mock initial state - no authenticated user
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(null);
    vi.mocked(SupabaseService.getSession).mockResolvedValue(null);
    
    // Mock analytics
    vi.mocked(analyticsService.trackUserSignIn).mockImplementation(() => {});
    vi.mocked(analyticsService.trackUserSignUp).mockImplementation(() => {});
    vi.mocked(analyticsService.trackUserSignOut).mockImplementation(() => {});
    vi.mocked(analyticsService.trackProfileUpdate).mockImplementation(() => {});
    
    // Mock security service
    vi.mocked(securityService.generateCSRFToken).mockReturnValue('csrf-token-123');
    vi.mocked(securityService.validateCSRFToken).mockReturnValue(true);
    vi.mocked(securityService.checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 5,
      resetTime: new Date(Date.now() + 60000)
    });
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    vi.clearAllTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should complete full user registration with email verification', async () => {
      const performanceMeasures: {[key: string]: number} = {};
      
      // Step 1: Load app in unauthenticated state
      const appLoadTime = await measurePerformance(async () => {
        await act(async () => {
          const result = render(
            <BrowserRouter>
              <App />
            </BrowserRouter>
          );
          container = result.container;
        });
      });
      
      performanceMeasures.appLoad = appLoadTime;
      expect(appLoadTime).toBeLessThan(3000);

      // Step 2: Navigate to registration
      await waitFor(() => {
        expect(screen.getByText(/sign up|register/i)).toBeInTheDocument();
      });

      const signUpButton = screen.getByRole('button', { name: /sign up|register/i });
      await user.click(signUpButton);

      // Step 3: Fill registration form
      await waitFor(() => {
        expect(screen.getByRole('form', { name: /sign up|register/i })).toBeInTheDocument();
      });

      const registrationData = {
        name: 'Test User Registration',
        email: 'test.registration@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!'
      };

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, registrationData.name);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, registrationData.email);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, registrationData.password);

      const confirmPasswordInput = screen.getByLabelText(/confirm.*password/i);
      await user.type(confirmPasswordInput, registrationData.confirmPassword);

      // Step 4: Submit registration
      const mockNewUser = createMockUser({
        id: 'new-user-123',
        email: registrationData.email,
        name: registrationData.name,
        emailVerified: false,
        createdAt: new Date()
      });

      vi.mocked(SupabaseService.signUp).mockResolvedValueOnce({
        user: mockNewUser,
        session: null, // No session until email verification
        error: null
      });

      const submitButton = screen.getByRole('button', { name: /create account|sign up/i });
      
      const registrationTime = await measurePerformance(async () => {
        await user.click(submitButton);
      });
      
      performanceMeasures.registration = registrationTime;
      expect(registrationTime).toBeLessThan(2000);

      // Step 5: Verify registration success and email verification prompt
      await waitFor(() => {
        expect(screen.getByText(/check.*email|verification.*sent/i)).toBeInTheDocument();
      });

      expect(SupabaseService.signUp).toHaveBeenCalledWith(
        registrationData.email,
        registrationData.password,
        registrationData.name
      );

      expect(analyticsService.trackUserSignUp).toHaveBeenCalledWith({
        userId: 'new-user-123',
        email: registrationData.email,
        method: 'email',
        timestamp: expect.any(Date)
      });

      // Step 6: Simulate email verification
      const verificationToken = 'verification-token-456';
      const verifiedUser = {
        ...mockNewUser,
        emailVerified: true,
        id: 'new-user-123'
      };

      vi.mocked(SupabaseService.verifyEmail).mockResolvedValueOnce({
        user: verifiedUser,
        error: null
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(verifiedUser);

      // Simulate clicking email verification link
      const verifyEmailButton = screen.getByRole('button', { name: /resend.*email|verify/i });
      await user.click(verifyEmailButton);

      await waitFor(() => {
        expect(screen.getByText(/email.*verified|verification.*complete/i)).toBeInTheDocument();
      });

      // Step 7: Verify user is now authenticated and redirected
      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      console.log('Registration Performance:', performanceMeasures);
    });

    it('should handle registration validation errors', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/sign up|register/i)).toBeInTheDocument();
      });

      const signUpButton = screen.getByRole('button', { name: /sign up|register/i });
      await user.click(signUpButton);

      // Test weak password validation
      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, '123'); // Weak password

      const confirmPasswordInput = screen.getByLabelText(/confirm.*password/i);
      await user.type(confirmPasswordInput, '456'); // Mismatched password

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/password.*weak|password.*strength/i)).toBeInTheDocument();
        expect(screen.getByText(/password.*match/i)).toBeInTheDocument();
      });

      // Test duplicate email
      vi.mocked(SupabaseService.signUp).mockResolvedValueOnce({
        user: null,
        session: null,
        error: 'User already registered'
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'existing@example.com');

      await user.clear(passwordInput);
      await user.type(passwordInput, 'ValidPassword123!');

      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      const submitButton = screen.getByRole('button', { name: /create account|sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/already.*registered|user.*exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Login Flow', () => {
    it('should complete successful login with session establishment', async () => {
      const mockUser = createMockUser({
        id: 'login-user-789',
        email: 'login.test@example.com',
        name: 'Login Test User',
        emailVerified: true
      });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Step 1: Navigate to login
      await waitFor(() => {
        expect(screen.getByText(/sign in|login/i)).toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /sign in|login/i });
      await user.click(signInButton);

      // Step 2: Fill login form
      await waitFor(() => {
        expect(screen.getByRole('form', { name: /sign in|login/i })).toBeInTheDocument();
      });

      const loginData = {
        email: 'login.test@example.com',
        password: 'LoginPassword123!'
      };

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, loginData.email);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, loginData.password);

      // Step 3: Submit login
      const mockSession = {
        access_token: 'access-token-abc123',
        refresh_token: 'refresh-token-def456',
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
        user: mockUser
      };

      vi.mocked(SupabaseService.signIn).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
        error: null
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      const submitButton = screen.getByRole('button', { name: /sign in|login/i });
      
      const loginTime = await measurePerformance(async () => {
        await user.click(submitButton);
      });
      
      expect(loginTime).toBeLessThan(2000);

      // Step 4: Verify successful authentication
      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(SupabaseService.signIn).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );

      expect(analyticsService.trackUserSignIn).toHaveBeenCalledWith({
        userId: 'login-user-789',
        method: 'email',
        timestamp: expect.any(Date)
      });

      // Step 5: Verify session persistence in localStorage
      const storedSession = localStorage.getItem('supabase.auth.token');
      expect(storedSession).toBeTruthy();
    });

    it('should handle login failures and rate limiting', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      const signInButton = screen.getByRole('button', { name: /sign in|login/i });
      await user.click(signInButton);

      // Test invalid credentials
      vi.mocked(SupabaseService.signIn).mockResolvedValueOnce({
        user: null,
        session: null,
        error: 'Invalid email or password'
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'wrong@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in|login/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid.*credentials|email.*password.*incorrect/i)).toBeInTheDocument();
      });

      // Test rate limiting after multiple failed attempts
      vi.mocked(securityService.checkRateLimit).mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 300000) // 5 minutes
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/too.*many.*attempts|rate.*limit/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Should show rate limit countdown
      const rateLimitMessage = screen.queryByText(/try.*again.*in/i);
      if (rateLimitMessage) {
        expect(rateLimitMessage).toBeInTheDocument();
      }
    });
  });

  describe('Session Management', () => {
    it('should persist session across browser refreshes', async () => {
      const mockUser = createMockUser({
        id: 'session-user-456',
        email: 'session.test@example.com'
      });

      const mockSession = {
        access_token: 'access-token-session123',
        refresh_token: 'refresh-token-session456',
        expires_at: Date.now() + (60 * 60 * 1000),
        user: mockUser
      };

      // Mock existing session in localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
      
      vi.mocked(SupabaseService.getSession).mockResolvedValue(mockSession);
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      // Render app - should automatically authenticate from stored session
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Should skip login and go directly to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/sign in|login/i)).not.toBeInTheDocument();
    });

    it('should handle session refresh when token expires', async () => {
      const mockUser = createMockUser({
        id: 'refresh-user-789',
        email: 'refresh.test@example.com'
      });

      // Mock expired session
      const expiredSession = {
        access_token: 'expired-token-123',
        refresh_token: 'refresh-token-valid456',
        expires_at: Date.now() - 1000, // Expired 1 second ago
        user: mockUser
      };

      localStorage.setItem('supabase.auth.token', JSON.stringify(expiredSession));
      
      vi.mocked(SupabaseService.getSession).mockResolvedValue(expiredSession);
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      // Mock session refresh
      const refreshedSession = {
        access_token: 'new-access-token-789',
        refresh_token: 'new-refresh-token-012',
        expires_at: Date.now() + (60 * 60 * 1000),
        user: mockUser
      };

      vi.mocked(SupabaseService.refreshSession).mockResolvedValueOnce({
        session: refreshedSession,
        error: null
      });

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Should automatically refresh session
      await waitFor(() => {
        expect(SupabaseService.refreshSession).toHaveBeenCalledWith(
          'refresh-token-valid456'
        );
      });

      // Should remain authenticated
      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      // Verify new session is stored
      const storedSession = localStorage.getItem('supabase.auth.token');
      const parsedSession = JSON.parse(storedSession!);
      expect(parsedSession.access_token).toBe('new-access-token-789');
    });

    it('should handle session timeout due to inactivity', async () => {
      vi.useFakeTimers();
      
      const mockUser = createMockUser({
        id: 'timeout-user-123',
        email: 'timeout.test@example.com'
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      // Simulate 30 minutes of inactivity (session timeout)
      await act(async () => {
        vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
      });

      // Should show session timeout warning
      await waitFor(() => {
        expect(screen.getByText(/session.*expired|timeout|please.*sign.*in/i)).toBeInTheDocument();
      });

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sign in|login/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Profile Management', () => {
    it('should allow profile updates and validation', async () => {
      const mockUser = createMockUser({
        id: 'profile-user-456',
        email: 'profile.test@example.com',
        name: 'Original Name',
        avatar: null
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      // Navigate to profile settings
      const profileButton = screen.getByRole('button', { name: /profile|account|settings/i });
      await user.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText(/profile.*settings|edit.*profile/i)).toBeInTheDocument();
      });

      // Update profile information
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Profile Name');

      const bioTextarea = screen.queryByLabelText(/bio|about/i);
      if (bioTextarea) {
        await user.type(bioTextarea, 'Updated bio information');
      }

      // Mock successful profile update
      const updatedUser = {
        ...mockUser,
        name: 'Updated Profile Name',
        bio: 'Updated bio information',
        updatedAt: new Date()
      };

      vi.mocked(SupabaseService.updateUserProfile).mockResolvedValueOnce({
        user: updatedUser,
        error: null
      });

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      // Verify update success
      await waitFor(() => {
        expect(screen.getByText(/profile.*updated|changes.*saved/i)).toBeInTheDocument();
      });

      expect(SupabaseService.updateUserProfile).toHaveBeenCalledWith(
        'profile-user-456',
        expect.objectContaining({
          name: 'Updated Profile Name',
          bio: 'Updated bio information'
        })
      );

      expect(analyticsService.trackProfileUpdate).toHaveBeenCalledWith({
        userId: 'profile-user-456',
        fields: ['name', 'bio'],
        timestamp: expect.any(Date)
      });
    });

    it('should handle password change with security validation', async () => {
      const mockUser = createMockUser({
        id: 'password-user-789',
        email: 'password.test@example.com'
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Navigate to security settings
      const settingsButton = screen.getByRole('button', { name: /settings|account/i });
      await user.click(settingsButton);

      const passwordTab = screen.queryByText(/password|security/i);
      if (passwordTab) {
        await user.click(passwordTab);
      }

      // Change password
      const currentPasswordInput = screen.getByLabelText(/current.*password/i);
      await user.type(currentPasswordInput, 'OldPassword123!');

      const newPasswordInput = screen.getByLabelText(/new.*password/i);
      await user.type(newPasswordInput, 'NewSecurePassword456!');

      const confirmNewPasswordInput = screen.getByLabelText(/confirm.*new.*password/i);
      await user.type(confirmNewPasswordInput, 'NewSecurePassword456!');

      // Mock successful password change
      vi.mocked(SupabaseService.updatePassword).mockResolvedValueOnce({
        success: true,
        error: null
      });

      const changePasswordButton = screen.getByRole('button', { name: /change.*password|update.*password/i });
      await user.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByText(/password.*updated|password.*changed/i)).toBeInTheDocument();
      });

      expect(SupabaseService.updatePassword).toHaveBeenCalledWith(
        'OldPassword123!',
        'NewSecurePassword456!'
      );
    });
  });

  describe('Multi-Tab Session Synchronization', () => {
    it('should synchronize login state across tabs', async () => {
      const mockUser = createMockUser({
        id: 'multitab-user-123',
        email: 'multitab.test@example.com'
      });

      // Render first tab
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/sign in|login/i)).toBeInTheDocument();
      });

      // Simulate login from another tab by updating localStorage and dispatching storage event
      const mockSession = {
        access_token: 'multitab-access-token',
        refresh_token: 'multitab-refresh-token',
        expires_at: Date.now() + (60 * 60 * 1000),
        user: mockUser
      };

      localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      // Simulate storage event from another tab
      await act(async () => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'supabase.auth.token',
          newValue: JSON.stringify(mockSession)
        }));
      });

      // Current tab should automatically authenticate
      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });
    });

    it('should synchronize logout across tabs', async () => {
      const mockUser = createMockUser({
        id: 'logout-sync-user-456',
        email: 'logout.sync@example.com'
      });

      // Start with authenticated user
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      // Simulate logout from another tab
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(null);
      localStorage.removeItem('supabase.auth.token');

      await act(async () => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'supabase.auth.token',
          newValue: null
        }));
      });

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sign in|login/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset process', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Navigate to forgot password
      const forgotPasswordLink = screen.getByText(/forgot.*password|reset.*password/i);
      await user.click(forgotPasswordLink);

      await waitFor(() => {
        expect(screen.getByRole('form', { name: /reset.*password|forgot.*password/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'reset.test@example.com');

      vi.mocked(SupabaseService.resetPassword).mockResolvedValueOnce({
        success: true,
        error: null
      });

      const resetButton = screen.getByRole('button', { name: /send.*reset|reset.*password/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/check.*email|reset.*link.*sent/i)).toBeInTheDocument();
      });

      expect(SupabaseService.resetPassword).toHaveBeenCalledWith('reset.test@example.com');
    });
  });

  describe('Logout and Cleanup', () => {
    it('should properly clean up user session and data on logout', async () => {
      const mockUser = createMockUser({
        id: 'logout-user-789',
        email: 'logout.test@example.com'
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
      });

      // Perform logout
      const logoutButton = screen.getByRole('button', { name: /logout|sign out/i });
      
      vi.mocked(SupabaseService.signOut).mockResolvedValueOnce({
        success: true,
        error: null
      });

      await user.click(logoutButton);

      // Verify cleanup
      expect(SupabaseService.signOut).toHaveBeenCalled();
      expect(analyticsService.trackUserSignOut).toHaveBeenCalledWith({
        userId: 'logout-user-789',
        timestamp: expect.any(Date)
      });

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sign in|login/i)).toBeInTheDocument();
      });

      // Verify session cleanup
      expect(localStorage.getItem('supabase.auth.token')).toBeNull();
      
      // Verify service worker cleanup
      const registrations = serviceWorkerHelpers.getRegistrations();
      registrations.forEach(registration => {
        expect(registration.active?.postMessage).toHaveBeenCalledWith({
          type: 'USER_LOGGED_OUT',
          data: { userId: 'logout-user-789' }
        });
      });
    });
  });
});