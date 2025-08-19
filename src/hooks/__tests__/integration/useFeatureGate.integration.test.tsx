import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useFeatureGate } from '../../useFeatureGate';
import { FeatureAccessProvider } from '../../../contexts/FeatureAccessContext';
import { AnalyticsProvider } from '../../../components/AnalyticsProvider';

// Mock dependencies
jest.mock('../../../services/subscription-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getFeatureAccess: jest.fn(),
      getUserTier: jest.fn()
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
    ERROR_OCCURRED: 'error_occurred'
  }
}));

// Test wrapper combining multiple providers
interface TestWrapperProps {
  children: React.ReactNode;
  userId?: string;
  featureAccess?: any;
  userTier?: 'free' | 'basic' | 'pro';
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  userId = 'test-user-123',
  featureAccess = null,
  userTier = 'free'
}) => {
  // Mock subscription service responses
  React.useEffect(() => {
    const SubscriptionService = require('../../../services/subscription-service').default;
    const mockService = SubscriptionService.getInstance();

    mockService.getFeatureAccess.mockResolvedValue(featureAccess || {
      features: {
        advanced_alarms: {
          hasAccess: userTier !== 'free',
          usageLimit: userTier === 'basic' ? 5 : null,
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

    mockService.getUserTier.mockResolvedValue(userTier);
  }, [featureAccess, userTier]);

  return (
    <AnalyticsProvider>
      <FeatureAccessProvider userId={userId}>
        {children}
      </FeatureAccessProvider>
    </AnalyticsProvider>
  );
};

describe('useFeatureGate Integration Tests with FeatureAccessProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Free Tier User Integration', () => {
    it('should integrate with FeatureAccessProvider for blocked features', async () => {
      const { result } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="free" />
        }
      );

      // Wait for provider to initialize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.requiredTier).toBe('basic');
      expect(result.current.isLoading).toBe(false);
    });

    it('should track feature attempts through context providers', async () => {
      const mockTrackFeatureAttempt = jest.fn();

      const FeatureGateService = require('../../../services/feature-gate-service').default;
      FeatureGateService.getInstance().trackFeatureAttempt = mockTrackFeatureAttempt;

      const { result } = renderHook(
        () => useFeatureGate('premium_themes'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="free" />
        }
      );

      await act(async () => {
        result.current.requestAccess();
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockTrackFeatureAttempt).toHaveBeenCalledWith(
        'test-user-123',
        'premium_themes',
        false,
        expect.any(Object)
      );
    });

    it('should trigger upgrade callbacks through FeatureAccessProvider', async () => {
      const mockOnUpgradeRequired = jest.fn();

      const CustomWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <AnalyticsProvider>
          <FeatureAccessProvider
            userId="test-user-123"
            onUpgradeRequired={mockOnUpgradeRequired}
          >
            {children}
          </FeatureAccessProvider>
        </AnalyticsProvider>
      );

      const { result } = renderHook(
        () => useFeatureGate('premium_themes'),
        { wrapper: CustomWrapper }
      );

      await act(async () => {
        result.current.requestAccess();
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockOnUpgradeRequired).toHaveBeenCalledWith('premium_themes', 'pro');
    });
  });

  describe('Basic Tier User Integration', () => {
    it('should provide limited access with usage tracking', async () => {
      const { result } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="basic" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.usage).toEqual({
        used: 0,
        limit: 5,
        remaining: 5
      });
    });

    it('should handle usage limits through integrated providers', async () => {
      const customFeatureAccess = {
        features: {
          advanced_alarms: {
            hasAccess: true,
            usageLimit: 5,
            usageCount: 4, // Near limit
            upgradeRequired: null
          }
        }
      };

      const { result } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="basic" featureAccess={customFeatureAccess} />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.usage).toEqual({
        used: 4,
        limit: 5,
        remaining: 1
      });
    });
  });

  describe('Pro Tier User Integration', () => {
    it('should provide unlimited access through provider integration', async () => {
      const { result } = renderHook(
        () => useFeatureGate('export_data'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="pro" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.requiredTier).toBeNull();
      expect(result.current.usage).toBeNull(); // No usage limits for pro
    });

    it('should bypass soft gates with pro tier privileges', async () => {
      const { result } = renderHook(
        () => useFeatureGate('premium_themes', { softGate: true }),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="pro" />
        }
      );

      await act(async () => {
        result.current.bypassGate('Pro tier automatic bypass');
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.isBypassed).toBe(false); // Pro users don't need bypasses
    });
  });

  describe('Analytics Integration', () => {
    it('should integrate analytics tracking through AnalyticsProvider', async () => {
      const mockTrack = jest.fn();

      // Mock the analytics hook to spy on calls
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn()
      });

      const { result } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="free" />
        }
      );

      await act(async () => {
        result.current.requestAccess();
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify analytics integration through provider chain
      expect(mockTrack).toHaveBeenCalled();
    });
  });

  describe('Provider State Updates', () => {
    it('should react to FeatureAccessProvider state changes', async () => {
      const { result, rerender } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="free" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasAccess).toBe(false);

      // Simulate tier upgrade through provider
      rerender();

      const { result: resultAfterUpgrade } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="basic" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(resultAfterUpgrade.current.hasAccess).toBe(true);
    });

    it('should handle provider refresh and re-sync', async () => {
      const mockRefreshFeatureAccess = jest.fn();

      const CustomProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [refreshTrigger, setRefreshTrigger] = React.useState(0);

        React.useEffect(() => {
          // Simulate provider refresh
          const timer = setTimeout(() => setRefreshTrigger(1), 50);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AnalyticsProvider>
            <FeatureAccessProvider
              userId="test-user-123"
              autoRefresh={true}
              refreshInterval={100}
            >
              {children}
            </FeatureAccessProvider>
          </AnalyticsProvider>
        );
      };

      const { result } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        { wrapper: CustomProviderWrapper }
      );

      // Wait for initial load and refresh
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Hook should be responsive to provider updates
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle FeatureAccessProvider errors gracefully', async () => {
      // Mock service to throw error
      const SubscriptionService = require('../../../services/subscription-service').default;
      const mockService = SubscriptionService.getInstance();
      mockService.getFeatureAccess.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="free" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Hook should handle provider errors gracefully
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.error).toBeNull(); // Hook should not expose provider errors
    });

    it('should integrate error reporting through providers', async () => {
      const mockHandleError = jest.fn();
      const ErrorHandler = require('../../../services/error-handler').ErrorHandler;
      ErrorHandler.handleError = mockHandleError;

      // Force provider error
      const SubscriptionService = require('../../../services/subscription-service').default;
      const mockService = SubscriptionService.getInstance();
      mockService.getUserTier.mockRejectedValue(new Error('Service unavailable'));

      renderHook(
        () => useFeatureGate('advanced_alarms'),
        {
          wrapper: (props) => <TestWrapper {...props} userTier="free" />
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('Failed to load feature access data'),
        expect.objectContaining({
          context: 'FeatureAccessProvider'
        })
      );
    });
  });

  describe('Multi-Provider Integration', () => {
    it('should work with multiple providers in the chain', async () => {
      const MultiProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <AnalyticsProvider>
          <FeatureAccessProvider userId="test-user-123">
            {children}
          </FeatureAccessProvider>
        </AnalyticsProvider>
      );

      const { result } = renderHook(
        () => {
          const featureGate = useFeatureGate('advanced_alarms');
          return {
            featureGate,
            // Could test other context-dependent hooks here
          };
        },
        { wrapper: MultiProviderWrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.featureGate.hasAccess).toBeDefined();
    });
  });
});