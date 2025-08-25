import { expect, test, jest } from '@jest/globals';
/// <reference lib="dom" />
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  usePWA,
  useInstallPrompt,
  useServiceWorkerUpdate,
  usePushNotifications,
} from '../../usePWA';
import { AnalyticsProvider } from '../../../components/AnalyticsProvider';
import { FeatureAccessProvider } from '../../../contexts/FeatureAccessContext';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock PWA Manager Service
jest.mock('../../../services/pwa-manager', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      isPWASupported: jest.fn().mockReturnValue(true),
      isInstalled: jest.fn().mockReturnValue(false),
      isStandalone: jest.fn().mockReturnValue(false),
      canInstall: jest.fn().mockReturnValue(true),
      install: jest.fn(),
      checkForUpdates: jest.fn(),
      updateServiceWorker: jest.fn(),
      subscribeToPushNotifications: jest.fn(),
      unsubscribeFromPushNotifications: jest.fn(),
      requestNotificationPermission: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    }),
  },
}));

// Mock service worker
const mockServiceWorker = {
  register: jest.fn(),
  getRegistration: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
});

// Mock push notifications
Object.defineProperty(global.Notification, 'permission', {
  value: 'default',
  writable: true,
});

Object.defineProperty(global.Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
  writable: true,
});

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
    PWA_INSTALLED: 'pwa_installed',
    SERVICE_WORKER_UPDATED: 'service_worker_updated',
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

jest.mock('@capacitor/device', () => ({
  Device: {
    getLanguageCode: jest.fn().mockResolvedValue({ value: 'en' }),
  },
}));

jest.mock('../../../_config/i18n', () => ({
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

// Mock subscription service
jest.mock('../../../services/subscription-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getFeatureAccess: jest.fn(),
      getUserTier: jest.fn(),
    }),
  },
}));

jest.mock('../../../services/_error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

// Test wrapper with multiple providers
interface TestWrapperProps {
  children: React.ReactNode;
  userId?: string;
  userTier?: 'free' | 'basic' | 'pro';
  pwaSupported?: boolean;
  isInstalled?: boolean;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  userId = 'test-_user-123',
  userTier = 'basic',
  pwaSupported = true,
  isInstalled = false,
}) => {
  // Mock service responses
  React.useEffect(() => {
    const PWAManager = require('../../../services/pwa-manager').default;
    const mockPWAManager = PWAManager.getInstance();
    mockPWAManager.isPWASupported.mockReturnValue(pwaSupported);
    mockPWAManager.isInstalled.mockReturnValue(isInstalled);

    const SubscriptionService =
      require('../../../services/subscription-service').default;
    const mockSubscriptionService = SubscriptionService.getInstance();
    mockSubscriptionService.getUserTier.mockResolvedValue(userTier);
    mockSubscriptionService.getFeatureAccess.mockResolvedValue({
      features: {
        pwa_notifications: {
          hasAccess: userTier !== 'free',
          upgradeRequired: userTier === 'free' ? 'basic' : null,
        },
        background_sync: {
          hasAccess: userTier === 'pro',
          upgradeRequired: userTier !== 'pro' ? 'pro' : null,
        },
        offline_mode: {
          hasAccess: true,
        },
      },
    });
  }, [pwaSupported, isInstalled, userTier]);

  return (
    <AnalyticsProvider>
      <LanguageProvider>
        <FeatureAccessProvider userId={userId}>{children}</FeatureAccessProvider>
      </LanguageProvider>
    </AnalyticsProvider>
  );
};

describe('PWA Hooks Integration Tests with Multiple Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('usePWA with FeatureAccessProvider Integration', () => {
    it('should respect PWA feature access controls', async () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: props => <TestWrapper {...props} userTier="free" />,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.capabilities.pushNotifications).toBe(false);
    });

    it('should enable advanced PWA features for pro users', async () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: props => <TestWrapper {...props} userTier="pro" />,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.capabilities.backgroundSync).toBe(true);
      expect(result.current.capabilities.pushNotifications).toBe(true);
    });

    it('should track PWA events through AnalyticsProvider', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const { result } = renderHook(() => usePWA(), { wrapper: TestWrapper });

      const PWAManager = require('../../../services/pwa-manager').default;
      const mockPWAManager = PWAManager.getInstance();
      mockPWAManager.install.mockResolvedValue(true);

      await act(async () => {
        await result.current.install();
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'pwa_installed',
        expect.objectContaining({
          metadata: expect.objectContaining({
            installation_source: 'user_action',
          }),
        })
      );
    });
  });

  describe('useInstallPrompt with Language Integration', () => {
    it('should show localized install prompts', async () => {
      const mockT = jest.fn(key => {
        const translations: Record<string, string> = {
          'pwa.install.title': 'Instalar Aplicación',
          'pwa.install.message': 'Instalar Relife para mejor experiencia',
        };
        return translations[key] || key;
      });

      const useTranslation = require('react-i18next').useTranslation;
      useTranslation.mockReturnValue({
        t: mockT,
        i18n: { language: 'es', exists: jest.fn().mockReturnValue(true) },
      });

      const { result } = renderHook(() => useInstallPrompt(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.showPrompt();
      });

      expect(mockT).toHaveBeenCalledWith('pwa.install.title');
      expect(mockT).toHaveBeenCalledWith('pwa.install.message');
    });

    it('should handle RTL layouts for install UI', async () => {
      const i18nConfig = require('../../../_config/i18n');
      i18nConfig.isRTL.mockReturnValue(true);
      i18nConfig.getCurrentLanguage.mockReturnValue('ar');

      const { result } = renderHook(() => useInstallPrompt(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(result.current.canInstall).toBeDefined();
    });
  });

  describe('useServiceWorkerUpdate with Analytics Integration', () => {
    it('should track service worker updates through analytics', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const { result } = renderHook(() => useServiceWorkerUpdate(), {
        wrapper: TestWrapper,
      });

      const PWAManager = require('../../../services/pwa-manager').default;
      const mockPWAManager = PWAManager.getInstance();
      mockPWAManager.updateServiceWorker.mockResolvedValue(true);

      await act(async () => {
        await result.current.updateServiceWorker();
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'service_worker_updated',
        expect.objectContaining({
          metadata: expect.objectContaining({
            update_source: 'manual',
          }),
        })
      );
    });

    it('should handle update errors with _error reporting integration', async () => {
      const mockHandleError = jest.fn();
      const ErrorHandler = require('../../../services/_error-handler').ErrorHandler;
      ErrorHandler.handleError = mockHandleError;

      const { result } = renderHook(() => useServiceWorkerUpdate(), {
        wrapper: TestWrapper,
      });

      const PWAManager = require('../../../services/pwa-manager').default;
      const mockPWAManager = PWAManager.getInstance();
      mockPWAManager.updateServiceWorker.mockRejectedValue(new Error('Update failed'));

      await act(async () => {
        await result.current.updateServiceWorker();
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('Service worker update failed'),
        expect.objectContaining({
          context: 'useServiceWorkerUpdate',
        })
      );
    });

    it('should show update notifications in _user language', async () => {
      const mockT = jest.fn(key => key);
      const useTranslation = require('react-i18next').useTranslation;
      useTranslation.mockReturnValue({
        t: mockT,
        i18n: { language: 'fr', exists: jest.fn().mockReturnValue(true) },
      });

      const { result } = renderHook(() => useServiceWorkerUpdate(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        // Simulate update available
        result.current.showUpdateNotification();
      });

      expect(mockT).toHaveBeenCalledWith(expect.stringContaining('update'));
    });
  });

  describe('usePushNotifications with Feature Gates', () => {
    it('should enforce notification permissions through feature access', async () => {
      const { result } = renderHook(() => usePushNotifications(), {
        wrapper: props => <TestWrapper {...props} userTier="free" />,
      });

      await act(async () => {
        await result.current.subscribe();
      });

      expect(result.current._error).toContain('subscription required');
    });

    it('should enable push notifications for subscribed users', async () => {
      const { result } = renderHook(() => usePushNotifications(), {
        wrapper: props => <TestWrapper {...props} userTier="basic" />,
      });

      const PWAManager = require('../../../services/pwa-manager').default;
      const mockPWAManager = PWAManager.getInstance();
      mockPWAManager.subscribeToPushNotifications.mockResolvedValue({
        endpoint: 'https://example.com/push',
        keys: { p256dh: 'key', auth: 'auth' },
      });

      await act(async () => {
        await result.current.subscribe();
      });

      expect(result.current.subscription).toBeTruthy();
      expect(result.current.isSubscribed).toBe(true);
    });

    it('should track notification permission requests', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const { result } = renderHook(() => usePushNotifications(), {
        wrapper: props => <TestWrapper {...props} userTier="basic" />,
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'push_permission_requested',
        expect.objectContaining({
          metadata: expect.objectContaining({
            permission_status: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Multi-Provider PWA State Management', () => {
    it('should coordinate PWA state across all providers', async () => {
      const { result } = renderHook(
        () => ({
          pwa: usePWA(),
          install: useInstallPrompt(),
          updates: useServiceWorkerUpdate(),
          notifications: usePushNotifications(),
        }),
        {
          wrapper: props => <TestWrapper {...props} userTier="pro" />,
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // All PWA hooks should be initialized consistently
      expect(result.current.pwa.isSupported).toBe(true);
      expect(result.current.install.canInstall).toBeDefined();
      expect(result.current.updates.isUpdateAvailable).toBeDefined();
      expect(result.current.notifications.permission).toBeDefined();
    });

    it('should handle PWA installation flow with provider integration', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const { result } = renderHook(
        () => ({
          pwa: usePWA(),
          install: useInstallPrompt(),
        }),
        { wrapper: TestWrapper }
      );

      const PWAManager = require('../../../services/pwa-manager').default;
      const mockPWAManager = PWAManager.getInstance();
      mockPWAManager.install.mockResolvedValue(true);

      await act(async () => {
        await result.current.install.install();
      });

      // Should update PWA state and track analytics
      expect(mockTrack).toHaveBeenCalledWith(
        expect.stringContaining('pwa_install'),
        expect.any(Object)
      );
    });
  });

  describe('Offline/Online State Integration', () => {
    it('should coordinate offline state with feature access', async () => {
      const { result } = renderHook(() => usePWA(), { wrapper: TestWrapper });

      // Simulate going offline
      await act(async () => {
        window.dispatchEvent(new Event('offline'));
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(result.current.isOnline).toBe(false);

      // Simulate going back online
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should track connectivity changes through analytics', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      renderHook(() => usePWA(), { wrapper: TestWrapper });

      await act(async () => {
        window.dispatchEvent(new Event('offline'));
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'connection_changed',
        expect.objectContaining({
          metadata: expect.objectContaining({
            connection_status: 'offline',
          }),
        })
      );
    });
  });

  describe('Background Sync with Feature Gates', () => {
    it('should enable background sync only for pro users', async () => {
      const { result: basicResult } = renderHook(() => usePWA(), {
        wrapper: props => <TestWrapper {...props} userTier="basic" />,
      });

      const { result: proResult } = renderHook(() => usePWA(), {
        wrapper: props => <TestWrapper {...props} userTier="pro" />,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(basicResult.current.capabilities.backgroundSync).toBe(false);
      expect(proResult.current.capabilities.backgroundSync).toBe(true);
    });

    it('should track background sync usage through analytics', async () => {
      const mockTrack = jest.fn();
      const useAnalytics = require('../../useAnalytics').useAnalytics;
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

      const { result } = renderHook(() => usePWA(), {
        wrapper: props => <TestWrapper {...props} userTier="pro" />,
      });

      await act(async () => {
        result.current.registerBackgroundSync('alarm-sync');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'background_sync_registered',
        expect.objectContaining({
          metadata: expect.objectContaining({
            sync_tag: 'alarm-sync',
          }),
        })
      );
    });
  });

  describe('Error Handling Across PWA Providers', () => {
    it('should handle PWA errors gracefully with provider integration', async () => {
      const mockHandleError = jest.fn();
      const ErrorHandler = require('../../../services/_error-handler').ErrorHandler;
      ErrorHandler.handleError = mockHandleError;

      const { result } = renderHook(() => usePWA(), { wrapper: TestWrapper });

      const PWAManager = require('../../../services/pwa-manager').default;
      const mockPWAManager = PWAManager.getInstance();
      mockPWAManager.install.mockRejectedValue(new Error('Install failed'));

      await act(async () => {
        await result.current.install();
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('PWA installation failed'),
        expect.objectContaining({
          context: 'usePWA',
        })
      );
    });
  });
});
