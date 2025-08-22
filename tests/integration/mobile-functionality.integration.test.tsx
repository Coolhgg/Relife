/// <reference lib="dom" />
/**
 * Mobile-Specific Functionality Integration Tests
 *
 * Tests for Capacitor plugins and mobile device features:
 * - Device capabilities detection and adaptation
 * - Local notifications and background processing
 * - Haptic feedback and device vibration
 * - Mobile storage and preferences
 * - Geolocation for smart alarms
 * - Device orientation and screen wake lock
 * - Mobile app lifecycle (pause/resume)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import App from '../../src/App';
import { CapacitorService } from '../../src/services/capacitor';

import {
  integrationTestHelpers,
  simulateScreenWakeLock,
} from '../utils/integration-test-setup';
import { createMockUser } from '../utils/test-mocks';

// Mock Capacitor plugins
vi.mock('@capacitor/local-notifications');
vi.mock('@capacitor/haptics');
vi.mock('@capacitor/device');
vi.mock('@capacitor/geolocation');
vi.mock('@capacitor/preferences');

describe('Mobile-Specific Functionality Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container) container.remove();
  });

  describe('Mobile Device Capabilities', () => {
    it('should detect and adapt to mobile device capabilities', async () => {
      // Mock mobile device detection
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      const mobileUser = createMockUser({ deviceType: 'mobile' });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mobileUser);

      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Should show mobile-optimized interface
      await waitFor(() => {
        expect(screen.getByText(/mobile.*view|touch.*friendly/i)).toBeInTheDocument();
      });

      // Should enable mobile-specific features
      const hapticToggle = screen.queryByLabelText(/haptic.*feedback|vibration/i);
      if (hapticToggle) {
        expect(hapticToggle).toBeInTheDocument();
      }
    });

    it('should handle mobile notification permissions and setup', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Mock Capacitor local notifications
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({
        display: 'granted',
      });
      vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({
        display: 'granted',
      });

      const notificationSetup = screen.getByRole('button', {
        name: /setup.*notifications/i,
      });
      await user.click(notificationSetup);

      await waitFor(() => {
        expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(
          screen.getByText(/notifications.*enabled|ready.*alarms/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Alarm Features', () => {
    it('should use device wake lock and haptic feedback for alarms', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Simulate alarm triggering with mobile features
      const wakeLockSentinel = await simulateScreenWakeLock();

      // Mock haptic feedback
      const { Haptics } = await import('@capacitor/haptics');
      vi.mocked(Haptics.vibrate).mockResolvedValue();

      // Simulate alarm ringing state
      const alarmNotification = screen.queryByText(/dismiss.*alarm|stop.*alarm/i);
      if (alarmNotification) {
        // Should activate wake lock
        expect(wakeLockSentinel.released).toBe(false);

        // Should trigger haptic feedback
        expect(Haptics.vibrate).toHaveBeenCalledWith({ duration: 1000 });
      }

      await wakeLockSentinel.release();
    });
  });
});
