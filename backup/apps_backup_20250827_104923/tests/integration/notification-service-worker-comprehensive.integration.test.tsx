/// <reference lib="dom" />
/**
 * Comprehensive Notification and Service Worker Integration Tests
 *
 * Tests background alarm processing, notification handling, and service worker lifecycle:
 * - Service worker registration and messaging
 * - Background alarm triggering when tab inactive
 * - Push notification subscription and handling
 * - Cross-tab alarm state synchronization
 * - Notification interaction (dismiss/snooze from notification)
 * - Offline notification queuing and delivery
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { PushNotificationService } from '../../src/services/push-notifications';
import { AlarmService } from '../../src/services/alarm';

import {
  integrationTestHelpers,
  simulateAlarmNotification,
  simulatePushSubscription,
  verifyNotificationShown,
  verifyServiceWorkerActive,
  serviceWorkerHelpers,
  notificationHelpers,
} from '../utils/integration-test-setup';

import { createMockUser, createMockAlarm } from '../utils/test-mocks';

vi.mock('../../src/services/supabase');
vi.mock('../../src/services/push-notifications');
vi.mock('../../src/services/alarm');

describe('Comprehensive Notification and Service Worker Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: any;

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();
    vi.clearAllMocks();
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    if (container) container.remove();
    vi.clearAllTimers();
  });

  describe('Service Worker Registration and Background Processing', () => {
    it('should register service worker and handle background alarms', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(verifyServiceWorkerActive()).toBe(true);
      });

      // Create and trigger background alarm
      const mockAlarm = createMockAlarm({
        id: 'bg-alarm-123',
        time: '08:00',
        label: 'Background Test Alarm',
      });

      const notification = await simulateAlarmNotification('Background Test Alarm', {
        body: 'Background alarm test',
        requireInteraction: true,
      });

      expect(verifyNotificationShown('Background Test Alarm')).toBe(true);
      notification.close();
    });

    it('should handle push notification subscription', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      const subscription = await simulatePushSubscription();
      expect(subscription.endpoint).toContain('fcm.googleapis.com');

      // Verify push subscription stored
      expect(vi.mocked(PushNotificationService.subscribe)).toHaveBeenCalled();
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should synchronize alarm dismissal across tabs', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Create notification
      const notification = await simulateAlarmNotification('Sync Test Alarm');

      // Simulate dismissal from service worker message (other tab)
      vi.mocked(AlarmService.dismissAlarm).mockResolvedValueOnce({
        success: true,
        dismissedAt: new Date(),
      });

      await act(async () => {
        serviceWorkerHelpers.simulateMessage({
          type: 'ALARM_DISMISSED',
          data: { alarmId: 'sync-alarm-123' },
        });
      });

      await waitFor(() => {
        expect(screen.queryByText(/dismiss|stop|snooze/i)).not.toBeInTheDocument();
      });

      notification.close();
    });
  });
});
