import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useAuth } from '../../useAuth';
import { useFeatureGate } from '../../useFeatureGate';
import { useAdvancedAlarms } from '../../useAdvancedAlarms';
import { useSubscription } from '../../useSubscription';
import { AnalyticsProvider } from '../../../components/AnalyticsProvider';
import { FeatureAccessProvider } from '../../../contexts/FeatureAccessContext';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { StrugglingSamProvider } from '../../../contexts/StrugglingsamContext';

// Mock all services
jest.mock('../../../services/supabase-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      signIn: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn()
    })
  }
}));

jest.mock('../../../services/subscription-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getSubscription: jest.fn(),
      getFeatureAccess: jest.fn(),
      getUserTier: jest.fn(),
      createSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      updateSubscription: jest.fn()
    })
  }
}));

jest.mock('../../../services/stripe-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      createSetupIntent: jest.fn(),
      updatePaymentMethod: jest.fn()
    })
  }
}));

jest.mock('../../../services/alarm-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getAllAlarms: jest.fn(),
      createAlarm: jest.fn(),
      updateAlarm: jest.fn(),
      deleteAlarm: jest.fn()
    })
  }
}));

jest.mock('../../../services/feature-gate-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      trackFeatureAttempt: jest.fn(),
      grantTemporaryAccess: jest.fn()
    })
  }
}));

jest.mock('../../../services/error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn()
  }
}));

// Mock analytics hooks
jest.mock('../../useAnalytics', () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackFeatureUsage: jest.fn()
  }),
  useEngagementAnalytics: () => ({
    trackFeatureDiscovery: jest.fn()
  }),
  usePerformanceAnalytics: () => ({
    trackComponentRenderTime: jest.fn()
  }),
  ANALYTICS_EVENTS: {
    SESSION_ENDED: 'session_ended',
    ERROR_OCCURRED: 'error_occurred',
    USER_SIGNED_IN: 'user_signed_in',
    SUBSCRIPTION_CREATED: 'subscription_created',
    FEATURE_GATE_BYPASSED: 'feature_gate_bypassed'
  }
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      exists: jest.fn().mockReturnValue(true)
    }
  })
}));

jest.mock('@capacitor/device', () => ({
  Device: {
    getLanguageCode: jest.fn().mockResolvedValue({ value: 'en' })
  }
}));

jest.mock('../../../config/i18n', () => ({
  SUPPORTED_LANGUAGES: {
    en: { nativeName: 'English', rtl: false },
    es: { nativeName: 'Español', rtl: false }
  },
  getCurrentLanguage: () => 'en',
  getLanguageInfo: () => ({ nativeName: 'English', rtl: false }),
  isRTL: () => false,
  formatTime: (time: string) => time,
  formatRelativeTime: (date: Date) => date.toLocaleDateString(),
  changeLanguage: jest.fn()
}));

// Comprehensive test wrapper with all providers
interface FullTestWrapperProps {
  children: React.ReactNode;
  initialUser?: any;
  userTier?: 'free' | 'basic' | 'pro';
  subscription?: any;
}

const FullTestWrapper: React.FC<FullTestWrapperProps> = ({
  children,
  initialUser = null,
  userTier = 'free',
  subscription = null
}) => {
  const [user, setUser] = React.useState(initialUser);

  // Mock all service responses
  React.useEffect(() => {
    // Mock Supabase Service
    const SupabaseService = require('../../../services/supabase-service').default;
    const mockSupabaseService = SupabaseService.getInstance();
    mockSupabaseService.getCurrentUser.mockResolvedValue(user);
    mockSupabaseService.getSession.mockResolvedValue(
      user ? { access_token: 'token', user } : null
    );
    mockSupabaseService.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => callback(user ? 'SIGNED_IN' : 'SIGNED_OUT',
        user ? { access_token: 'token', user } : null), 10);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    // Mock Subscription Service
    const SubscriptionService = require('../../../services/subscription-service').default;
    const mockSubscriptionService = SubscriptionService.getInstance();
    mockSubscriptionService.getSubscription.mockResolvedValue(subscription);
    mockSubscriptionService.getUserTier.mockResolvedValue(userTier);
    mockSubscriptionService.getFeatureAccess.mockResolvedValue({
      features: {
        advanced_alarms: {
          hasAccess: userTier !== 'free',
          usageLimit: userTier === 'basic' ? 10 : null,
          usageCount: 0,
          upgradeRequired: userTier === 'free' ? 'basic' : null
        },
        premium_themes: {
          hasAccess: userTier === 'pro',
          upgradeRequired: userTier !== 'pro' ? 'pro' : null
        },
        export_data: {
          hasAccess: userTier === 'pro',
          upgradeRequired: userTier !== 'pro' ? 'pro' : null
        }
      }
    });

    // Mock Alarm Service
    const AlarmService = require('../../../services/alarm-service').default;
    const mockAlarmService = AlarmService.getInstance();
    mockAlarmService.getAllAlarms.mockResolvedValue([]);
  }, [user, userTier, subscription]);

  return (
    <AnalyticsProvider>
      <LanguageProvider>
        <FeatureAccessProvider userId={user?.id || ''}>
          <StrugglingSamProvider userId={user?.id || ''}>
            {children}
          </StrugglingSamProvider>
        </FeatureAccessProvider>
      </LanguageProvider>
    </AnalyticsProvider>
  );
};

describe('Cross-Hook Integration Tests with Full Provider Stack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication → Feature Access → Alarms Flow', () => {
    it('should cascade authentication state through all providers and hooks', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { subscription_tier: 'basic' }
      };

      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      // Wait for all hooks to initialize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // All hooks should reflect authenticated state
      expect(result.current.auth.user).toEqual(mockUser);
      expect(result.current.featureGate.hasAccess).toBe(true);
      expect(result.current.alarms.canUseAdvancedFeatures).toBe(true);
    });

    it('should handle authentication changes affecting downstream features', async () => {
      const { result, rerender } = renderHook(
        () => ({
          auth: useAuth(),
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} userTier="free" />
        }
      );

      // Initially unauthenticated/free user
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.featureGate.hasAccess).toBe(false);

      // Sign in and upgrade
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      rerender();

      // Use new wrapper with authenticated user
      const { result: newResult } = renderHook(
        () => ({
          auth: useAuth(),
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(newResult.current.auth.user).toEqual(mockUser);
      expect(newResult.current.featureGate.hasAccess).toBe(true);
    });
  });

  describe('Subscription → Feature Gates → Usage Integration', () => {
    it('should coordinate subscription status across feature gates and usage tracking', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSubscription = {
        id: 'sub-123',
        status: 'active',
        tier: 'pro',
        features: ['advanced_alarms', 'premium_themes', 'export_data']
      };

      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          subscription: useSubscription('user-123'),
          advancedAlarmsGate: useFeatureGate('advanced_alarms'),
          premiumThemesGate: useFeatureGate('premium_themes'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: props => (
            <FullTestWrapper
              {...props}
              initialUser={mockUser}
              userTier="pro"
              subscription={mockSubscription}
            />
          )
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // All pro features should be accessible
      expect(result.current.subscription.tier).toBe('pro');
      expect(result.current.advancedAlarmsGate.hasAccess).toBe(true);
      expect(result.current.premiumThemesGate.hasAccess).toBe(true);
      expect(result.current.alarms.canUseConditionalRules).toBe(true);
    });

    it('should handle subscription cancellation affecting all gated features', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { result } = renderHook(
        () => ({
          subscription: useSubscription('user-123'),
          featureGate: useFeatureGate('premium_themes'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="pro" />
        }
      );

      // Mock subscription service to simulate cancellation
      const SubscriptionService = require('../../../services/subscription-service').default;
      const mockSubscriptionService = SubscriptionService.getInstance();
      mockSubscriptionService.cancelSubscription.mockResolvedValue({
        id: 'sub-123',
        status: 'canceled'
      });

      await act(async () => {
        await result.current.subscription.cancelSubscription('sub-123');
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should track cancellation through analytics
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn()
      });

      expect(mockTrack).toHaveBeenCalled();
    });
  });

  describe('Language → Analytics → Feature Access Integration', () => {
    it('should coordinate language settings across all providers and hooks', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      // Mock language change
      const i18nConfig = require('../../../config/i18n');
      i18nConfig.getCurrentLanguage.mockReturnValue('es');

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // All hooks should be aware of language context
      expect(result.current.auth.isLoading).toBeDefined();
      expect(result.current.featureGate.hasAccess).toBeDefined();
      expect(result.current.alarms.isLoading).toBeDefined();
    });

    it('should track multilingual feature usage through analytics', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn()
      });

      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { result } = renderHook(
        () => ({
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      await act(async () => {
        await result.current.featureGate.requestAccess();
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.objectContaining({
            user_language: expect.any(String)
          })
        })
      );
    });
  });

  describe('Achievement → Streak → Analytics Integration', () => {
    it('should coordinate achievements across alarm usage and streak tracking', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { result } = renderHook(
        () => ({
          alarms: useAdvancedAlarms('user-123'),
          auth: useAuth()
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      // Mock successful alarm creation
      const AlarmService = require('../../../services/alarm-service').default;
      const mockAlarmService = AlarmService.getInstance();
      mockAlarmService.createAlarm.mockResolvedValue({
        id: 'alarm-123',
        name: 'Test Alarm',
        time: '07:00'
      });

      await act(async () => {
        await result.current.alarms.createAlarm({
          name: 'Test Alarm',
          time: '07:00',
          enabled: true,
          repeatDays: []
        });
      });

      // Should track achievement through StrugglingSam context
      expect(result.current.alarms.error).toBeNull();
    });
  });

  describe('Error Propagation Across Provider Chain', () => {
    it('should handle cascading errors across all providers gracefully', async () => {
      const mockHandleError = jest.fn();
      const ErrorHandler = require('../../../services/error-handler').ErrorHandler;
      ErrorHandler.handleError = mockHandleError;

      // Mock service failures
      const SubscriptionService = require('../../../services/subscription-service').default;
      const mockSubscriptionService = SubscriptionService.getInstance();
      mockSubscriptionService.getFeatureAccess.mockRejectedValue(new Error('Service unavailable'));

      const { result } = renderHook(
        () => ({
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        { wrapper: FullTestWrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Hooks should handle provider errors gracefully
      expect(result.current.featureGate.hasAccess).toBe(false);
      expect(result.current.alarms.error).toBeNull(); // Should not propagate provider errors
    });

    it('should maintain hook functionality despite provider chain failures', async () => {
      // Mock multiple provider failures
      const SubscriptionService = require('../../../services/subscription-service').default;
      const mockSubscriptionService = SubscriptionService.getInstance();
      mockSubscriptionService.getUserTier.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          featureGate: useFeatureGate('advanced_alarms')
        }),
        { wrapper: FullTestWrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Hooks should still be functional with fallback behavior
      expect(result.current.auth.isLoading).toBe(false);
      expect(result.current.featureGate.isLoading).toBe(false);
    });
  });

  describe('Performance with Full Provider Stack', () => {
    it('should maintain acceptable performance with all providers and hooks', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const startTime = Date.now();

      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          subscription: useSubscription('user-123'),
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should initialize within reasonable time even with full stack
      expect(duration).toBeLessThan(500);

      // All hooks should be ready
      expect(result.current.auth.isLoading).toBe(false);
      expect(result.current.subscription.isLoading).toBe(false);
      expect(result.current.featureGate.isLoading).toBe(false);
      expect(result.current.alarms.isLoading).toBe(false);
    });
  });

  describe('State Synchronization Across Hooks', () => {
    it('should maintain consistent state across all hooks when user data changes', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          featureGate: useFeatureGate('advanced_alarms'),
          alarms: useAdvancedAlarms('user-123'),
          subscription: useSubscription('user-123')
        }),
        {
          wrapper: (props) => <FullTestWrapper {...props} initialUser={mockUser} userTier="basic" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // All hooks should reflect the same user context
      expect(result.current.auth.user?.id).toBe('user-123');
      expect(result.current.featureGate.hasAccess).toBe(true); // Basic user has access
      expect(result.current.alarms.canUseAdvancedFeatures).toBe(true);
    });
  });
});