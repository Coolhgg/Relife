import { expect, test, jest } from '@jest/globals';
/// <reference lib="dom" />
/**
 * Unit tests for PWA hooks
 * Tests Progressive Web App functionality including installation, updates, and notifications
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePWA,
  useInstallPrompt,
  useServiceWorkerUpdate,
  usePushNotifications,
  useOffline,
  usePWAUI,
  useBackgroundSync,
  useAlarmPWA,
} from '../usePWA';
import {
  renderHookWithProviders,
  clearAllMocks,
} from '../../__tests__/utils/hook-testing-utils';

// Mock PWA manager
const mockPWAManager = {
  getCapabilities: jest.fn(),
  getState: jest.fn(),
  isOffline: jest.fn(),
  showInstallPrompt: jest.fn(),
  updateServiceWorker: jest.fn(),
  shouldShowInstallPrompt: jest.fn(),
  getPushSubscription: jest.fn(),
  requestNotificationPermission: jest.fn(),
  subscribeToPushNotifications: jest.fn(),
  sendMessageToSW: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('../../services/pwa-manager', () => ({
  pwaManager: mockPWAManager,
}));

describe('PWA Hooks', () => {
  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();

    // Setup default mock responses
    mockPWAManager.getCapabilities.mockReturnValue({
      pushNotifications: true,
      backgroundSync: true,
      standalone: false,
      installPrompt: true,
    });

    mockPWAManager.getState.mockReturnValue({
      installed: false,
      installable: true,
      updateAvailable: false,
    });

    mockPWAManager.isOffline.mockReturnValue(false);
    mockPWAManager.shouldShowInstallPrompt.mockReturnValue(true);
    mockPWAManager.showInstallPrompt.mockResolvedValue(true);
    mockPWAManager.updateServiceWorker.mockResolvedValue(true);
    mockPWAManager.getPushSubscription.mockResolvedValue(null);
    mockPWAManager.requestNotificationPermission.mockResolvedValue('granted');
    mockPWAManager.subscribeToPushNotifications.mockResolvedValue({
      endpoint: 'https://example.com/push',
      keys: {},
    });

    // Mock global Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock online/offline events
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: jest.fn(),
      writable: true,
    });
  });

  describe('usePWA', () => {
    it('should initialize with PWA manager data', () => {
      const { result } = renderHookWithProviders(() => usePWA());

      expect(result.current.capabilities).toEqual({
        pushNotifications: true,
        backgroundSync: true,
        standalone: false,
        installPrompt: true,
      });

      expect(result.current.state).toEqual({
        installed: false,
        installable: true,
        updateAvailable: false,
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.shouldShowInstallPrompt).toBe(true);
    });

    it('should handle offline state', () => {
      mockPWAManager.isOffline.mockReturnValue(true);

      const { result } = renderHookWithProviders(() => usePWA());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });

    it('should show install prompt', async () => {
      const { result } = renderHookWithProviders(() => usePWA());

      let installResult;
      await act(async () => {
        installResult = await result.current.showInstallPrompt();
      });

      expect(installResult).toBe(true);
      expect(mockPWAManager.showInstallPrompt).toHaveBeenCalled();
    });

    it('should update service worker', async () => {
      const { result } = renderHookWithProviders(() => usePWA());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateServiceWorker();
      });

      expect(updateResult).toBe(true);
      expect(mockPWAManager.updateServiceWorker).toHaveBeenCalled();
    });

    it('should set up _event listeners on mount', () => {
      renderHookWithProviders(() => usePWA());

      expect(window.addEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'installable',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith('installed', expect.any(Function));
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'already-installed',
        expect.any(Function)
      );
    });

    it('should clean up _event listeners on unmount', () => {
      const { unmount } = renderHookWithProviders(() => usePWA());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
      expect(mockPWAManager.off).toHaveBeenCalledWith(
        'installable',
        expect.any(Function)
      );
      expect(mockPWAManager.off).toHaveBeenCalledWith(
        'installed',
        expect.any(Function)
      );
      expect(mockPWAManager.off).toHaveBeenCalledWith(
        'already-installed',
        expect.any(Function)
      );
    });
  });

  describe('useInstallPrompt', () => {
    it('should initialize with installable state', () => {
      const { result } = renderHookWithProviders(() => useInstallPrompt());

      expect(result.current.canInstall).toBe(true);
      expect(result.current.isInstalling).toBe(false);
    });

    it('should handle install action', async () => {
      const { result } = renderHookWithProviders(() => useInstallPrompt());

      let installResult;
      await act(async () => {
        installResult = await result.current.install();
      });

      expect(installResult).toBe(true);
      expect(mockPWAManager.showInstallPrompt).toHaveBeenCalled();
    });

    it('should not install when already installing', async () => {
      const { result } = renderHookWithProviders(() => useInstallPrompt());

      // Start installation
      act(() => {
        result.current.install();
      });

      // Try to install again while installing
      const installResult = await act(async () => {
        return await result.current.install();
      });

      expect(installResult).toBe(false);
    });

    it('should not install when cannot install', async () => {
      mockPWAManager.shouldShowInstallPrompt.mockReturnValue(false);

      const { result } = renderHookWithProviders(() => useInstallPrompt());

      const installResult = await act(async () => {
        return await result.current.install();
      });

      expect(installResult).toBe(false);
    });

    it('should handle install errors', async () => {
      mockPWAManager.showInstallPrompt.mockRejectedValue(new Error('Install failed'));

      const { result } = renderHookWithProviders(() => useInstallPrompt());

      await expect(async () => {
        await act(async () => {
          await result.current.install();
        });
      }).rejects.toThrow('Install failed');

      expect(result.current.isInstalling).toBe(false);
    });

    it('should set up PWA _event listeners', () => {
      renderHookWithProviders(() => useInstallPrompt());

      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'installable',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith('installed', expect.any(Function));
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'install-accepted',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'install-dismissed',
        expect.any(Function)
      );
    });
  });

  describe('useServiceWorkerUpdate', () => {
    it('should initialize with no update available', () => {
      const { result } = renderHookWithProviders(() => useServiceWorkerUpdate());

      expect(result.current.updateAvailable).toBe(false);
      expect(result.current.isUpdating).toBe(false);
    });

    it('should apply update when available', async () => {
      const { result } = renderHookWithProviders(() => useServiceWorkerUpdate());

      // Simulate update available
      act(() => {
        // Trigger the event handler that would be called by PWA manager
        const eventHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'sw-update-available'
        )?.[1];
        eventHandler?.();
      });

      expect(result.current.updateAvailable).toBe(true);

      await act(async () => {
        await result.current.applyUpdate();
      });

      expect(mockPWAManager.updateServiceWorker).toHaveBeenCalled();
    });

    it('should not apply update when not available', async () => {
      const { result } = renderHookWithProviders(() => useServiceWorkerUpdate());

      await act(async () => {
        await result.current.applyUpdate();
      });

      expect(mockPWAManager.updateServiceWorker).not.toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      mockPWAManager.updateServiceWorker.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHookWithProviders(() => useServiceWorkerUpdate());

      // Set update available
      act(() => {
        const eventHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'sw-update-available'
        )?.[1];
        eventHandler?.();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.applyUpdate();
        });
      }).rejects.toThrow('Update failed');

      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('usePushNotifications', () => {
    it('should initialize with default permission state', async () => {
      const { result } = renderHookWithProviders(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).toBe('default');
        expect(result.current.subscription).toBeNull();
        expect(result.current.isSubscribing).toBe(false);
        expect(result.current.isSupported).toBe(true);
      });
    });

    it('should request notification permission', async () => {
      const { result } = renderHookWithProviders(() => usePushNotifications());

      let permission;
      await act(async () => {
        permission = await result.current.requestPermission();
      });

      expect(permission).toBe('granted');
      expect(result.current.permission).toBe('granted');
      expect(mockPWAManager.requestNotificationPermission).toHaveBeenCalled();
    });

    it('should handle permission request errors', async () => {
      mockPWAManager.requestNotificationPermission.mockRejectedValue(
        new Error('Permission denied')
      );

      const { result } = renderHookWithProviders(() => usePushNotifications());

      await expect(async () => {
        await act(async () => {
          await result.current.requestPermission();
        });
      }).rejects.toThrow('Permission denied');
    });

    it('should subscribe to push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://example.com/push',
        keys: { p256dh: 'key', auth: 'auth' },
      };

      mockPWAManager.subscribeToPushNotifications.mockResolvedValue(mockSubscription);

      const { result } = renderHookWithProviders(() => usePushNotifications());

      let subscription;
      await act(async () => {
        subscription = await result.current.subscribe();
      });

      expect(subscription).toEqual(mockSubscription);
      expect(mockPWAManager.subscribeToPushNotifications).toHaveBeenCalled();
    });

    it('should not subscribe when already subscribing', async () => {
      const { result } = renderHookWithProviders(() => usePushNotifications());

      // Start subscription
      act(() => {
        result.current.subscribe();
      });

      // Try to subscribe again
      const subscriptionResult = await act(async () => {
        return await result.current.subscribe();
      });

      expect(subscriptionResult).toBeNull();
    });

    it('should handle subscription errors', async () => {
      mockPWAManager.subscribeToPushNotifications.mockRejectedValue(
        new Error('Subscription failed')
      );

      const { result } = renderHookWithProviders(() => usePushNotifications());

      await expect(async () => {
        await act(async () => {
          await result.current.subscribe();
        });
      }).rejects.toThrow('Subscription failed');

      expect(result.current.isSubscribing).toBe(false);
    });

    it('should handle unsupported notifications', () => {
      // Mock window without Notification API
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHookWithProviders(() => usePushNotifications());

      expect(result.current.permission).toBe('denied');
    });
  });

  describe('useOffline', () => {
    it('should initialize with online state', () => {
      const { result } = renderHookWithProviders(() => useOffline());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.syncStatus).toBe('idle');
      expect(result.current.isBackgroundSyncSupported).toBe(true);
    });

    it('should handle offline state', () => {
      mockPWAManager.isOffline.mockReturnValue(true);

      const { result } = renderHookWithProviders(() => useOffline());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });

    it('should set up online/offline _event listeners', () => {
      renderHookWithProviders(() => useOffline());

      expect(window.addEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'sync-complete',
        expect.any(Function)
      );
    });
  });

  describe('usePWAUI', () => {
    it('should initialize with browser display mode', () => {
      const { result } = renderHookWithProviders(() => usePWAUI());

      expect(result.current.isStandalone).toBe(false);
      expect(result.current.displayMode).toBe('browser');
      expect(result.current.shouldShowBackButton).toBe(true);
      expect(result.current.shouldHideAddressBar).toBe(false);
    });

    it('should handle standalone mode', () => {
      mockPWAManager.getCapabilities.mockReturnValue({
        pushNotifications: true,
        backgroundSync: true,
        standalone: true,
        installPrompt: false,
      });

      // Mock matchMedia to return true for standalone
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      const { result } = renderHookWithProviders(() => usePWAUI());

      expect(result.current.isStandalone).toBe(true);
      expect(result.current.displayMode).toBe('standalone');
      expect(result.current.shouldShowBackButton).toBe(false);
      expect(result.current.shouldHideAddressBar).toBe(true);
    });

    it('should set up display mode change listener', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(display-mode: standalone)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };

      window.matchMedia = jest.fn().mockReturnValue(mockMediaQuery);

      renderHookWithProviders(() => usePWAUI());

      expect(window.matchMedia).toHaveBeenCalledWith('(display-mode: standalone)');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should use legacy listener methods for older browsers', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(display-mode: standalone)',
        addEventListener: undefined, // Simulate old browser
        removeEventListener: undefined,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };

      window.matchMedia = jest.fn().mockReturnValue(mockMediaQuery);

      const { unmount } = renderHookWithProviders(() => usePWAUI());

      expect(mockMediaQuery.addListener).toHaveBeenCalledWith(expect.any(Function));

      unmount();

      expect(mockMediaQuery.removeListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('useBackgroundSync', () => {
    it('should initialize with empty queue', () => {
      const { result } = renderHookWithProviders(() => useBackgroundSync());

      expect(result.current.pendingItems).toEqual([]);
      expect(result.current.hasPendingItems).toBe(false);
      expect(result.current.isSupported).toBe(true);
    });

    it('should add items to sync queue', () => {
      const { result } = renderHookWithProviders(() => useBackgroundSync());

      act(() => {
        result.current.addToQueue('test-item-1');
        result.current.addToQueue('test-item-2');
      });

      expect(result.current.pendingItems).toEqual(['test-item-1', 'test-item-2']);
      expect(result.current.hasPendingItems).toBe(true);

      expect(mockPWAManager.sendMessageToSW).toHaveBeenCalledTimes(2);
      expect(mockPWAManager.sendMessageToSW).toHaveBeenCalledWith({
        type: 'QUEUE_SYNC',
        data: 'test-item-1',
      });
      expect(mockPWAManager.sendMessageToSW).toHaveBeenCalledWith({
        type: 'QUEUE_SYNC',
        data: 'test-item-2',
      });
    });

    it('should clear sync queue', () => {
      const { result } = renderHookWithProviders(() => useBackgroundSync());

      act(() => {
        result.current.addToQueue('test-item');
      });

      expect(result.current.hasPendingItems).toBe(true);

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.pendingItems).toEqual([]);
      expect(result.current.hasPendingItems).toBe(false);
    });

    it('should clear queue on sync complete', () => {
      const { result } = renderHookWithProviders(() => useBackgroundSync());

      act(() => {
        result.current.addToQueue('test-item');
      });

      expect(result.current.hasPendingItems).toBe(true);

      // Simulate sync complete event
      act(() => {
        const eventHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'sync-complete'
        )?.[1];
        eventHandler?.();
      });

      expect(result.current.pendingItems).toEqual([]);
    });
  });

  describe('useAlarmPWA', () => {
    it('should initialize with empty alarm events', () => {
      const { result } = renderHookWithProviders(() => useAlarmPWA());

      expect(result.current.alarmEvents).toEqual([]);
    });

    it('should track alarm events', () => {
      const { result } = renderHookWithProviders(() => useAlarmPWA());

      // Simulate alarm triggered event
      act(() => {
        const triggerHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'alarm-triggered'
        )?.[1];
        triggerHandler?.({ alarmId: 'alarm-1', timestamp: Date.now() });
      });

      expect(result.current.alarmEvents).toHaveLength(1);
      expect(result.current.alarmEvents[0].type).toBe('triggered');
      expect(result.current.alarmEvents[0].alarmId).toBe('alarm-1');

      // Simulate alarm dismissed event
      act(() => {
        const dismissHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'alarm-dismissed'
        )?.[1];
        dismissHandler?.({ alarmId: 'alarm-1', timestamp: Date.now() });
      });

      expect(result.current.alarmEvents).toHaveLength(2);
      expect(result.current.alarmEvents[1].type).toBe('dismissed');

      // Simulate alarm snoozed event
      act(() => {
        const snoozeHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'alarm-snoozed'
        )?.[1];
        snoozeHandler?.({
          alarmId: 'alarm-1',
          timestamp: Date.now(),
          duration: 300,
        });
      });

      expect(result.current.alarmEvents).toHaveLength(3);
      expect(result.current.alarmEvents[2].type).toBe('snoozed');
      expect(result.current.alarmEvents[2].duration).toBe(300);
    });

    it('should clear alarm events', () => {
      const { result } = renderHookWithProviders(() => useAlarmPWA());

      // Add some events first
      act(() => {
        const triggerHandler = mockPWAManager.on.mock.calls.find(
          ([_event]) => event === 'alarm-triggered'
        )?.[1];
        triggerHandler?.({ alarmId: 'alarm-1' });
        triggerHandler?.({ alarmId: 'alarm-2' });
      });

      expect(result.current.alarmEvents).toHaveLength(2);

      act(() => {
        result.current.clearAlarmEvents();
      });

      expect(result.current.alarmEvents).toEqual([]);
    });

    it('should set up alarm _event listeners', () => {
      renderHookWithProviders(() => useAlarmPWA());

      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'alarm-triggered',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'alarm-dismissed',
        expect.any(Function)
      );
      expect(mockPWAManager.on).toHaveBeenCalledWith(
        'alarm-snoozed',
        expect.any(Function)
      );
    });

    it('should clean up alarm _event listeners on unmount', () => {
      const { unmount } = renderHookWithProviders(() => useAlarmPWA());

      unmount();

      expect(mockPWAManager.off).toHaveBeenCalledWith(
        'alarm-triggered',
        expect.any(Function)
      );
      expect(mockPWAManager.off).toHaveBeenCalledWith(
        'alarm-dismissed',
        expect.any(Function)
      );
      expect(mockPWAManager.off).toHaveBeenCalledWith(
        'alarm-snoozed',
        expect.any(Function)
      );
    });
  });
});
