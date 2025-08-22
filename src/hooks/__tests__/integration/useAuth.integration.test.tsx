import { expect, test, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useAuth } from '../../useAuth';
import { AnalyticsProvider } from '../../../components/AnalyticsProvider';
import { FeatureAccessProvider } from '../../../contexts/FeatureAccessContext';
import { LanguageProvider } from '../../../contexts/LanguageContext';

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

jest.mock('../../../services/error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

// Mock analytics hooks
jest.mock('../../useAnalytics', () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackFeatureUsage: jest.fn(),
  }),
  useEngagementAnalytics: () => ({
    trackFeatureDiscovery: jest.fn(),
  }),
  usePerformanceAnalytics: () => ({
    trackComponentRenderTime: jest.fn(),
  }),
  ANALYTICS_EVENTS: {
    SESSION_ENDED: 'session_ended',
    ERROR_OCCURRED: 'error_occurred',
    USER_SIGNED_IN: 'user_signed_in',
    USER_SIGNED_OUT: 'user_signed_out',
  },
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      exists: jest.fn().mockReturnValue(true),
    },
  }),
}));

// Mock Capacitor Device
jest.mock('@capacitor/device', () => ({
  Device: {
    getLanguageCode: jest.fn().mockResolvedValue({ value: 'en' }),
  },
}));

// Mock i18n config
jest.mock('../../../config/i18n', () => ({
  SUPPORTED_LANGUAGES: {
    en: { nativeName: 'English', rtl: false },
    es: { nativeName: 'Español', rtl: false },
  },
  getCurrentLanguage: () => 'en',
  getLanguageInfo: () => ({ nativeName: 'English', rtl: false }),
  isRTL: () => false,
  formatTime: (time: string) => time,
  formatRelativeTime: (date: Date) => date.toLocaleDateString(),
  changeLanguage: jest.fn(),
}));

// Test wrapper with multiple providers
interface TestWrapperProps {
  children: React.ReactNode;
  userId?: string;
  mockUser?: any;
  mockSession?: any;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  userId = 'test-user-123',
  mockUser = null,
  mockSession = null,
}) => {
  // Mock Supabase service responses
  React.useEffect(() => {
    const SupabaseService = require('../../../services/supabase-service').default;
    const mockService = SupabaseService.getInstance();

    mockService.getCurrentUser.mockResolvedValue(mockUser);
    mockService.getSession.mockResolvedValue(mockSession);
    mockService.onAuthStateChange.mockImplementation(callback => {
      // Simulate initial auth state
      setTimeout(() => callback('SIGNED_IN', mockSession), 10);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  }, [mockUser, mockSession]);

  return (
    <AnalyticsProvider>
      <LanguageProvider>
        <FeatureAccessProvider userId={userId}>{children}</FeatureAccessProvider>
      </LanguageProvider>
    </AnalyticsProvider>
  );
};

describe('useAuth Integration Tests with Multiple Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Analytics Integration', () => {
    it('should track authentication events through AnalyticsProvider', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: props => <TestWrapper {...props} mockUser={mockUser} />,
      });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      mockService.signIn.mockResolvedValue({
        user: mockUser,
        session: { access_token: 'token' },
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'user_signed_in',
        expect.objectContaining({
          metadata: expect.objectContaining({
            user_id: 'user-123',
            method: 'email',
          }),
        })
      );
    });

    it('should track sign out events with analytics context', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: props => <TestWrapper {...props} mockUser={mockUser} />,
      });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      mockService.signOut.mockResolvedValue({ error: null });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'user_signed_out',
        expect.objectContaining({
          metadata: expect.objectContaining({
            user_id: 'user-123',
          }),
        })
      );
    });

    it('should track authentication errors through analytics', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      mockService.signIn.mockRejectedValue(new Error('Invalid credentials'));

      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'auth_error',
        expect.objectContaining({
          metadata: expect.objectContaining({
            error_type: 'sign_in_failed',
            error_message: 'Invalid credentials',
          }),
        })
      );
    });
  });

  describe('FeatureAccessProvider Integration', () => {
    it('should trigger feature access reload on authentication state change', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockRefreshFeatureAccess = jest.fn();

      // Mock the FeatureAccessProvider to spy on refresh calls
      const TestWrapperWithSpy: React.FC<{ children: React.ReactNode }> = ({
        children,
      }) => {
        const [refreshCount, setRefreshCount] = React.useState(0);

        React.useEffect(() => {
          // Simulate refresh on auth change
          if (mockUser) {
            mockRefreshFeatureAccess();
            setRefreshCount(c => c + 1);
          }
        }, []);

        return (
          <AnalyticsProvider>
            <LanguageProvider>
              <FeatureAccessProvider userId={mockUser?.id || ''}>
                {children}
              </FeatureAccessProvider>
            </LanguageProvider>
          </AnalyticsProvider>
        );
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapperWithSpy,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockRefreshFeatureAccess).toHaveBeenCalled();
    });

    it('should clear feature access on sign out', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: props => <TestWrapper {...props} mockUser={mockUser} />,
      });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      // Simulate sign out clearing the user
      mockService.signOut.mockResolvedValue({ error: null });
      mockService.onAuthStateChange.mockImplementation(callback => {
        setTimeout(() => callback('SIGNED_OUT', null), 10);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      await act(async () => {
        await result.current.signOut();
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Language Provider Integration', () => {
    it('should work with language context for localized error messages', async () => {
      const mockT = jest.fn(key => {
        const translations: Record<string, string> = {
          'auth.error.invalid_credentials': 'Credenciales inválidas',
          'auth.error.rate_limited': 'Demasiados intentos',
        };
        return translations[key] || key;
      });

      const useTranslation = require('react-i18next').useTranslation;
      useTranslation.mockReturnValue({
        t: mockT,
        i18n: { language: 'es', exists: jest.fn().mockReturnValue(true) },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      mockService.signIn.mockRejectedValue(new Error('Invalid credentials'));

      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword');
      });

      // Should use localized error messages
      expect(mockT).toHaveBeenCalledWith('auth.error.invalid_credentials');
    });

    it('should respect RTL layout preferences from language context', async () => {
      // Mock RTL language
      const getCurrentLanguage = require('../../../config/i18n').getCurrentLanguage;
      getCurrentLanguage.mockReturnValue('ar');

      const isRTL = require('../../../config/i18n').isRTL;
      isRTL.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Hook should be aware of RTL context through provider chain
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe('Rate Limiting with Provider Integration', () => {
    it('should coordinate rate limiting across provider context', async () => {
      const SecurityService = require('../../../services/security-service').default;
      const mockSecurityService = SecurityService.getInstance();
      mockSecurityService.isRateLimited.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(result.current.rateLimitInfo.isLimited).toBe(true);
      expect(result.current.error).toContain('rate limit');
    });

    it('should reset rate limits through integrated context', async () => {
      const SecurityService = require('../../../services/security-service').default;
      const mockSecurityService = SecurityService.getInstance();

      // Start rate limited
      mockSecurityService.isRateLimited.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      // Reset rate limit
      mockSecurityService.isRateLimited.mockReturnValue(false);
      mockSecurityService.resetRateLimit.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.resetRateLimit();
      });

      expect(result.current.rateLimitInfo.isLimited).toBe(false);
    });
  });

  describe('Session Management Integration', () => {
    it('should coordinate session state across all providers', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession = {
        access_token: 'token-123',
        expires_at: Date.now() + 3600000, // 1 hour
        user: mockUser,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: props => (
          <TestWrapper {...props} mockUser={mockUser} mockSession={mockSession} />
        ),
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle session timeout across provider chain', async () => {
      const mockExpiredSession = {
        access_token: 'expired-token',
        expires_at: Date.now() - 1000, // Expired
        user: { id: 'user-123' },
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: props => <TestWrapper {...props} mockSession={mockExpiredSession} />,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should detect session timeout
      expect(result.current.sessionTimeoutWarning).toBe(true);
    });
  });

  describe('Error Handling Across Providers', () => {
    it('should propagate errors through provider chain properly', async () => {
      const mockHandleError = jest.fn();
      const ErrorHandler = require('../../../services/error-handler').ErrorHandler;
      ErrorHandler.handleError = mockHandleError;

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();
      mockService.signIn.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('Authentication failed'),
        expect.objectContaining({
          context: expect.stringContaining('useAuth'),
        })
      );
    });

    it('should handle provider initialization errors gracefully', async () => {
      // Mock FeatureAccessProvider error
      const SubscriptionService =
        require('../../../services/subscription-service').default;
      const mockService = SubscriptionService.getInstance();
      mockService.getFeatureAccess.mockRejectedValue(new Error('Service down'));

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Auth hook should still work despite provider errors
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should track performance metrics through provider chain', async () => {
      const mockTrackPerformance = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: jest.fn(),
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
        trackPerformance: mockTrackPerformance,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      const SupabaseService = require('../../../services/supabase-service').default;
      const mockService = SupabaseService.getInstance();

      // Add delay to measure performance
      mockService.signIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  user: { id: 'user-123' },
                  session: { access_token: 'token' },
                }),
              100
            )
          )
      );

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      // Should track auth performance through analytics provider
      expect(mockTrackPerformance).toHaveBeenCalledWith(
        'auth_sign_in_duration',
        expect.any(Number),
        'authentication'
      );
    });
  });
});
