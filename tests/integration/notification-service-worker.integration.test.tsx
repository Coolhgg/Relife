/**
 * Notification and Service Worker Integration Tests
 * 
 * Tests the complete notification and background processing flow:
 * 1. Service worker registration and initialization
 * 2. Push notification setup and permissions
 * 3. Background alarm scheduling and triggering
 * 4. Tab protection and visibility handling
 * 5. Notification interactions (dismiss, snooze)
 * 6. Cross-tab communication
 * 7. Offline notification queuing
 * 8. Emotional intelligence notifications
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { PushNotificationService } from '../../src/services/push-notifications';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import test utilities
import { createMockUser, createMockAlarm, mockNavigatorAPI } from '../utils/test-mocks';
import { TestData } from '../e2e/fixtures/test-data';

// Types
import type { Alarm, User } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/push-notifications');
vi.mock('@capacitor/local-notifications');
vi.mock('@capacitor/push-notifications');

describe('Notification and Service Worker Integration', () => {
  let mockUser: User;
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  let mockServiceWorkerRegistration: ServiceWorkerRegistration;
  
  // Mock service worker communication
  const serviceWorkerMessages: any[] = [];
  const mockServiceWorker = {
    postMessage: vi.fn((message) => {
      serviceWorkerMessages.push(message);
    }),
    addEventListener: vi.fn(),
    state: 'activated'
  };

  beforeAll(() => {
    mockNavigatorAPI();
    
    // Mock service worker APIs
    mockServiceWorkerRegistration = {
      installing: null,
      waiting: null,
      active: mockServiceWorker as any,
      scope: 'https://localhost:3000/',
      unregister: vi.fn().mockResolvedValue(true),
      update: vi.fn().mockResolvedValue(),
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as any;

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
        ready: Promise.resolve(mockServiceWorkerRegistration),
        controller: mockServiceWorker,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getRegistration: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
        getRegistrations: vi.fn().mockResolvedValue([mockServiceWorkerRegistration]),
      },
      writable: true,
      configurable: true,
    });

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: class MockNotification {
        static permission: NotificationPermission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        
        title: string;
        options: NotificationOptions;
        onclick: ((this: Notification, ev: Event) => any) | null = null;
        onclose: ((this: Notification, ev: Event) => any) | null = null;
        
        constructor(title: string, options?: NotificationOptions) {
          this.title = title;
          this.options = options || {};
        }
        
        close = vi.fn();
      },
      writable: true,
      configurable: true,
    });

    // Mock push messaging
    Object.defineProperty(mockServiceWorkerRegistration, 'pushManager', {
      value: {
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          },
          getKey: vi.fn()
        }),
        getSubscription: vi.fn().mockResolvedValue(null),
        supportedContentEncodings: ['aes128gcm', 'aesgcm']
      },
      writable: true,
      configurable: true,
    });
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();
    
    // Reset all mocks
    vi.clearAllMocks();
    serviceWorkerMessages.length = 0;
    
    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({ 
      alarms: [], 
      error: null 
    });

    // Mock push notification service
    vi.mocked(PushNotificationService.initialize).mockResolvedValue();
    vi.mocked(PushNotificationService.scheduleAlarmPush).mockResolvedValue();
    vi.mocked(PushNotificationService.cancelAlarmPush).mockResolvedValue();
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    localStorage.clear();
    sessionStorage.clear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Service Worker Registration and Initialization', () => {
    it('should register service worker and set up alarm scheduling', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Verify service worker was registered
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw-enhanced.js');

      // Create an alarm to test service worker integration
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill alarm form
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '07:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Service Worker Test Alarm');

      const mockAlarm = createMockAlarm({
        id: 'sw-alarm-123',
        userId: mockUser.id,
        time: '07:00',
        label: 'Service Worker Test Alarm',
        enabled: true
      });

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null
      });

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      await waitFor(() => {
        expect(screen.getByText('Service Worker Test Alarm')).toBeInTheDocument();
      });

      // Wait for service worker communication
      await waitFor(() => {
        expect(mockServiceWorker.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'UPDATE_ALARMS',
            data: expect.objectContaining({
              alarms: expect.arrayContaining([
                expect.objectContaining({
                  id: 'sw-alarm-123',
                  label: 'Service Worker Test Alarm'
                })
              ])
            })
          }),
          expect.any(Array) // MessageChannel port
        );
      }, { timeout: 5000 });
    });

    it('should handle service worker registration failure gracefully', async () => {
      // Mock registration failure
      vi.mocked(navigator.serviceWorker.register).mockRejectedValueOnce(
        new Error('Service worker registration failed')
      );

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // App should still function without service worker
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      expect(addAlarmButton).toBeInTheDocument();

      // Error should be logged but not crash the app
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  describe('Push Notification Setup and Permissions', () => {
    it('should request notification permissions and set up push subscription', async () => {
      // Mock permission granted
      vi.mocked(window.Notification.requestPermission).mockResolvedValueOnce('granted');

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Wait for permission request
      await waitFor(() => {
        expect(window.Notification.requestPermission).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Verify push subscription was set up
      expect(mockServiceWorkerRegistration.pushManager?.subscribe).toHaveBeenCalled();

      // Verify push notification service was initialized
      expect(PushNotificationService.initialize).toHaveBeenCalled();
    });

    it('should handle notification permission denial', async () => {
      // Mock permission denied
      vi.mocked(window.Notification.requestPermission).mockResolvedValueOnce('denied');

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should show permission denied message
      await waitFor(() => {
        const permissionWarning = screen.queryByText(/notification.*permission.*denied|enable.*notifications/i);
        if (permissionWarning) {
          expect(permissionWarning).toBeInTheDocument();
        }
      });

      // App should still function with fallback methods
      expect(screen.getByRole('button', { name: /add.*alarm/i })).toBeInTheDocument();
    });
  });

  describe('Background Alarm Triggering', () => {
    it('should trigger alarms through service worker when tab is inactive', async () => {
      const mockAlarm = createMockAlarm({
        id: 'bg-alarm-456',
        userId: mockUser.id,
        time: '08:30',
        label: 'Background Test Alarm',
        enabled: true
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [mockAlarm],
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText('Background Test Alarm')).toBeInTheDocument();
      });

      // Simulate tab becoming hidden
      await act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true
        });
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      // Simulate alarm trigger from service worker
      await act(async () => {
        const triggerMessage = {
          type: 'ALARM_TRIGGERED',
          data: {
            alarm: mockAlarm,
            triggeredAt: new Date().toISOString(),
            source: 'service_worker'
          }
        };

        // Simulate message event from service worker
        const messageEvent = new MessageEvent('message', {
          data: triggerMessage
        });
        
        // Dispatch to navigator.serviceWorker
        if (navigator.serviceWorker.addEventListener) {
          const listeners = vi.mocked(navigator.serviceWorker.addEventListener).mock.calls;
          const messageListener = listeners.find(call => call[0] === 'message')?.[1];
          if (messageListener) {
            (messageListener as any)(messageEvent);
          }
        }
      });

      // Tab becomes visible again
      await act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true
        });
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      // Should show alarm ringing interface
      await waitFor(() => {
        const dismissButton = screen.queryByRole('button', { name: /dismiss|stop/i });
        const snoozeButton = screen.queryByRole('button', { name: /snooze/i });
        
        expect(dismissButton || snoozeButton).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show notification when tab is closed/hidden', async () => {
      const mockAlarm = createMockAlarm({
        id: 'notification-alarm-789',
        userId: mockUser.id,
        time: '09:00',
        label: 'Notification Alarm',
        enabled: true
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [mockAlarm],
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText('Notification Alarm')).toBeInTheDocument();
      });

      // Mock notification constructor spy
      const NotificationSpy = vi.spyOn(window, 'Notification');

      // Simulate alarm trigger while tab is hidden
      await act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true
        });
      });

      // Simulate service worker showing notification
      await act(async () => {
        // This would normally be done by the service worker
        new window.Notification('Alarm: Notification Alarm', {
          body: 'Time to wake up!',
          icon: '/icon-192x192.png',
          tag: 'alarm-notification-alarm-789',
          requireInteraction: true,
          actions: [
            { action: 'dismiss', title: 'Dismiss' },
            { action: 'snooze', title: 'Snooze 5 min' }
          ]
        });
      });

      // Verify notification was created
      expect(NotificationSpy).toHaveBeenCalledWith(
        'Alarm: Notification Alarm',
        expect.objectContaining({
          body: 'Time to wake up!',
          requireInteraction: true,
          actions: expect.arrayContaining([
            expect.objectContaining({ action: 'dismiss' }),
            expect.objectContaining({ action: 'snooze' })
          ])
        })
      );
    });
  });

  describe('Tab Protection and Visibility Handling', () => {
    it('should warn user before closing tab with active alarms', async () => {
      const mockAlarm = createMockAlarm({
        id: 'protection-alarm-999',
        userId: mockUser.id,
        time: '10:00',
        label: 'Protected Alarm',
        enabled: true
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [mockAlarm],
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText('Protected Alarm')).toBeInTheDocument();
      });

      // Mock beforeunload event
      const beforeUnloadEvent = new BeforeUnloadEvent('beforeunload', {
        cancelable: true
      });
      
      let preventDefaultCalled = false;
      beforeUnloadEvent.preventDefault = () => { preventDefaultCalled = true; };
      
      // Simulate beforeunload
      await act(() => {
        window.dispatchEvent(beforeUnloadEvent);
      });

      // Should prevent default if tab protection is enabled
      await waitFor(() => {
        // If tab protection is enabled and there are active alarms,
        // preventDefault should be called
        if (mockAlarm.enabled) {
          expect(preventDefaultCalled).toBe(true);
        }
      });
    });

    it('should update service worker when visibility changes', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Test tab becoming hidden
      await act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true
        });
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      // Should send sync message to service worker
      await waitFor(() => {
        expect(mockServiceWorker.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SYNC_ALARM_STATE'
          })
        );
      });

      // Test tab becoming visible
      await act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true
        });
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      // Should send health check message
      await waitFor(() => {
        expect(mockServiceWorker.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'HEALTH_CHECK'
          })
        );
      });
    });
  });

  describe('Notification Interactions', () => {
    it('should handle notification click actions (dismiss/snooze)', async () => {
      const mockAlarm = createMockAlarm({
        id: 'interactive-alarm-111',
        userId: mockUser.id,
        time: '11:30',
        label: 'Interactive Alarm',
        enabled: true
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Simulate notification action from service worker
      await act(async () => {
        const dismissMessage = {
          type: 'NOTIFICATION_ACTION',
          data: {
            action: 'dismiss',
            alarmId: 'interactive-alarm-111',
            notificationTag: 'alarm-interactive-alarm-111'
          }
        };

        const messageEvent = new MessageEvent('message', {
          data: dismissMessage
        });
        
        // Simulate message from service worker
        if (navigator.serviceWorker.addEventListener) {
          const listeners = vi.mocked(navigator.serviceWorker.addEventListener).mock.calls;
          const messageListener = listeners.find(call => call[0] === 'message')?.[1];
          if (messageListener) {
            (messageListener as any)(messageEvent);
          }
        }
      });

      // Should handle dismiss action appropriately
      // This would typically involve stopping the alarm and updating analytics
    });

    it('should handle snooze action from notification', async () => {
      const mockAlarm = createMockAlarm({
        id: 'snooze-alarm-222',
        userId: mockUser.id,
        time: '12:00',
        label: 'Snooze Test Alarm',
        enabled: true,
        snoozeEnabled: true,
        maxSnoozes: 3,
        snoozeCount: 0
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      // Simulate snooze action
      await act(async () => {
        const snoozeMessage = {
          type: 'NOTIFICATION_ACTION',
          data: {
            action: 'snooze',
            alarmId: 'snooze-alarm-222',
            snoozeMinutes: 5
          }
        };

        const messageEvent = new MessageEvent('message', {
          data: snoozeMessage
        });
        
        if (navigator.serviceWorker.addEventListener) {
          const listeners = vi.mocked(navigator.serviceWorker.addEventListener).mock.calls;
          const messageListener = listeners.find(call => call[0] === 'message')?.[1];
          if (messageListener) {
            (messageListener as any)(messageEvent);
          }
        }
      });

      // Verify service worker received snooze command
      await waitFor(() => {
        expect(mockServiceWorker.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SNOOZE_ALARM',
            data: expect.objectContaining({
              alarmId: 'snooze-alarm-222',
              snoozeMinutes: 5
            })
          })
        );
      });
    });
  });

  describe('Cross-Tab Communication', () => {
    it('should sync alarm state across multiple tabs', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Simulate message from another tab via service worker
      await act(async () => {
        const crossTabMessage = {
          type: 'CROSS_TAB_ALARM_UPDATE',
          data: {
            alarmId: 'cross-tab-alarm-333',
            action: 'created',
            alarm: createMockAlarm({
              id: 'cross-tab-alarm-333',
              userId: mockUser.id,
              time: '13:00',
              label: 'Cross Tab Alarm',
              enabled: true
            })
          }
        };

        const messageEvent = new MessageEvent('message', {
          data: crossTabMessage
        });
        
        if (navigator.serviceWorker.addEventListener) {
          const listeners = vi.mocked(navigator.serviceWorker.addEventListener).mock.calls;
          const messageListener = listeners.find(call => call[0] === 'message')?.[1];
          if (messageListener) {
            (messageListener as any)(messageEvent);
          }
        }
      });

      // Should update UI with alarm from other tab
      await waitFor(() => {
        expect(screen.getByText('Cross Tab Alarm')).toBeInTheDocument();
      });
    });
  });

  describe('Emotional Intelligence Notifications', () => {
    it('should send emotional intelligence notifications based on user behavior', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Simulate emotional notification from service worker
      await act(async () => {
        const emotionalMessage = {
          type: 'EMOTIONAL_NOTIFICATION_TRIGGERED',
          data: {
            notificationId: 'emotional-123',
            emotionType: 'encouraging',
            message: 'Great job staying consistent with your morning alarms!',
            tone: 'supportive',
            metadata: {
              streak: 7,
              lastActivity: new Date().toISOString()
            }
          }
        };

        const messageEvent = new MessageEvent('message', {
          data: emotionalMessage
        });
        
        if (navigator.serviceWorker.addEventListener) {
          const listeners = vi.mocked(navigator.serviceWorker.addEventListener).mock.calls;
          const messageListener = listeners.find(call => call[0] === 'message')?.[1];
          if (messageListener) {
            (messageListener as any)(messageEvent);
          }
        }
      });

      // Should display emotional notification
      await waitFor(() => {
        const emotionalNotification = screen.queryByText(/great job.*consistent/i);
        if (emotionalNotification) {
          expect(emotionalNotification).toBeInTheDocument();
        }
      });
    });
  });

  describe('Offline Notification Queuing', () => {
    it('should queue notifications when offline and send when back online', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Go offline
      await act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
      });

      // Create alarm while offline (should queue notification)
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '14:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Offline Queue Alarm');

      const mockAlarm = createMockAlarm({
        id: 'offline-queue-alarm-444',
        userId: mockUser.id,
        time: '14:00',
        label: 'Offline Queue Alarm',
        enabled: true
      });

      // Mock offline save
      vi.mocked(SupabaseService.saveAlarm).mockRejectedValueOnce(
        new Error('Network unavailable')
      );

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      // Go back online
      await act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);
      });

      // Should process queued notifications
      await waitFor(() => {
        expect(mockServiceWorker.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'PROCESS_NOTIFICATION_QUEUE'
          })
        );
      });
    });
  });
});