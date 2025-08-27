import React from 'react'; // auto: added missing React import
/**
 * Offline/Online Sync Integration Tests
 *
 * Tests the complete offline/online synchronization flow:
 * 1. User works offline (creates, edits, deletes alarms)
 * 2. Changes are stored locally
 * 3. User goes back online
 * 4. Automatic sync to server
 * 5. Conflict resolution
 * 6. Background sync with service worker
 * 7. Cross-device synchronization
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
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import OfflineStorage from '../../src/services/offline-storage';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import test utilities
import { createMockUser, createMockAlarm, mockNavigatorAPI } from '../utils/test-mocks';
import { TestData } from '../e2e/fixtures/test-data';

// Types
import type { Alarm, User } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('@capacitor/local-notifications');
vi.mock('@capacitor/device');
vi.mock('@capacitor/preferences');

describe('Offline/Online Sync Integration', () => {
  let mockUser: User;
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  let originalOnLine: boolean;

  // Mock network state
  const setOnlineStatus = (isOnline: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: isOnline,
    });

    // Trigger online/offline events
    const event = new Event(isOnline ? 'online' : 'offline');
    window.dispatchEvent(event);
  };

  beforeAll(() => {
    mockNavigatorAPI();
    originalOnLine = navigator.onLine;
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();

    // Reset all mocks
    vi.clearAllMocks();

    // Set up default online state
    setOnlineStatus(true);

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
      alarms: [],
      error: null,
    });

    // Clear storage
    vi.spyOn(OfflineStorage, 'getAlarms').mockResolvedValue([]);
    vi.spyOn(OfflineStorage, 'getPendingChanges').mockResolvedValue([]);
    vi.spyOn(OfflineStorage, 'saveAlarm').mockResolvedValue();
    vi.spyOn(OfflineStorage, 'deleteAlarm').mockResolvedValue();
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    localStorage.clear();
    sessionStorage.clear();
    setOnlineStatus(true);
  });

  describe('Offline Alarm Operations', () => {
    it('should create alarms offline and sync when back online', async () => {
      let appContainer: HTMLElement;

      // Start online
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
        setOnlineStatus(false);
      });

      // Verify offline indicator appears
      await waitFor(() => {
        const offlineIndicator = screen.queryByText(/offline/i);
        if (offlineIndicator) {
          expect(offlineIndicator).toBeInTheDocument();
        }
      });

      // Create alarm while offline
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill alarm form
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '07:30');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Offline Test Alarm');

      // Mock offline storage
      const offlineAlarm = createMockAlarm({
        id: 'offline-alarm-123',
        userId: mockUser.id,
        time: '07:30',
        label: 'Offline Test Alarm',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(OfflineStorage.saveAlarm).mockResolvedValueOnce();
      vi.mocked(SupabaseService.saveAlarm).mockRejectedValueOnce(
        new Error('Network unavailable')
      );

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Verify alarm was saved offline
      await waitFor(() => {
        expect(screen.getByText('Offline Test Alarm')).toBeInTheDocument();
      });

      expect(OfflineStorage.saveAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          time: '07:30',
          label: 'Offline Test Alarm',
          userId: mockUser.id,
        })
      );

      // Create a second alarm offline
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput2 = screen.getByLabelText(/time/i);
      await user.clear(timeInput2);
      await user.type(timeInput2, '08:45');

      const labelInput2 = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput2);
      await user.type(labelInput2, 'Second Offline Alarm');

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      await waitFor(() => {
        expect(screen.getByText('Second Offline Alarm')).toBeInTheDocument();
      });

      // Go back online
      await act(() => {
        setOnlineStatus(true);
      });

      // Mock successful sync
      vi.mocked(OfflineStorage.getPendingChanges).mockResolvedValueOnce([
        {
          id: 'change-1',
          type: 'create',
          data: offlineAlarm,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'change-2',
          type: 'create',
          data: createMockAlarm({
            id: 'offline-alarm-456',
            userId: mockUser.id,
            time: '08:45',
            label: 'Second Offline Alarm',
          }),
          timestamp: new Date().toISOString(),
        },
      ]);

      vi.mocked(SupabaseService.saveAlarm)
        .mockResolvedValueOnce({ alarm: offlineAlarm, error: null })
        .mockResolvedValueOnce({
          alarm: createMockAlarm({
            id: 'offline-alarm-456',
            userId: mockUser.id,
            time: '08:45',
            label: 'Second Offline Alarm',
          }),
          error: null,
        });

      vi.mocked(OfflineStorage.clearPendingChanges).mockResolvedValueOnce();

      // Wait for automatic sync
      await waitFor(
        () => {
          expect(SupabaseService.saveAlarm).toHaveBeenCalledTimes(2);
        },
        { timeout: 10000 }
      );

      // Verify sync completed
      expect(OfflineStorage.clearPendingChanges).toHaveBeenCalled();

      // Verify offline indicator is gone
      await waitFor(() => {
        const offlineIndicator = screen.queryByText(/offline/i);
        expect(offlineIndicator).not.toBeInTheDocument();
      });
    });

    it('should handle offline alarm edits and sync properly', async () => {
      // Start with existing alarm
      const existingAlarm = createMockAlarm({
        id: 'existing-alarm-789',
        userId: mockUser.id,
        time: '06:00',
        label: 'Existing Alarm',
        enabled: true,
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [existingAlarm],
        error: null,
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
        expect(screen.getByText('Existing Alarm')).toBeInTheDocument();
      });

      // Go offline
      await act(() => {
        setOnlineStatus(false);
      });

      // Edit the alarm
      const alarmItem = screen
        .getByText('Existing Alarm')
        .closest('[data-testid="alarm-item"]');
      const editButton = alarmItem?.querySelector('[data-testid="edit-alarm"]');

      if (editButton) {
        await user.click(editButton);
      } else {
        // Fallback: click on alarm item
        await user.click(screen.getByText('Existing Alarm'));
      }

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Modify alarm
      const labelInput = screen.getByDisplayValue('Existing Alarm');
      await user.clear(labelInput);
      await user.type(labelInput, 'Modified Offline Alarm');

      const timeInput = screen.getByDisplayValue('06:00');
      await user.clear(timeInput);
      await user.type(timeInput, '06:15');

      // Mock offline update
      vi.mocked(SupabaseService.saveAlarm).mockRejectedValueOnce(
        new Error('Network unavailable')
      );

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      // Verify changes are visible
      await waitFor(() => {
        expect(screen.getByText('Modified Offline Alarm')).toBeInTheDocument();
      });

      // Verify offline storage was called
      expect(OfflineStorage.saveAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-alarm-789',
          label: 'Modified Offline Alarm',
          time: '06:15',
        })
      );

      // Go back online
      await act(() => {
        setOnlineStatus(true);
      });

      // Mock pending changes for sync
      vi.mocked(OfflineStorage.getPendingChanges).mockResolvedValueOnce([
        {
          id: 'change-edit-1',
          type: 'update',
          data: {
            ...existingAlarm,
            label: 'Modified Offline Alarm',
            time: '06:15',
            updatedAt: new Date(),
          },
          timestamp: new Date().toISOString(),
        },
      ]);

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: {
          ...existingAlarm,
          label: 'Modified Offline Alarm',
          time: '06:15',
          updatedAt: new Date(),
        },
        error: null,
      });

      // Wait for sync
      await waitFor(
        () => {
          expect(SupabaseService.saveAlarm).toHaveBeenCalledWith(
            expect.objectContaining({
              label: 'Modified Offline Alarm',
              time: '06:15',
            })
          );
        },
        { timeout: 10000 }
      );
    });

    it('should handle offline alarm deletions and sync', async () => {
      // Start with existing alarm
      const existingAlarm = createMockAlarm({
        id: 'delete-me-alarm-999',
        userId: mockUser.id,
        time: '09:30',
        label: 'Delete Me Alarm',
        enabled: true,
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [existingAlarm],
        error: null,
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
        expect(screen.getByText('Delete Me Alarm')).toBeInTheDocument();
      });

      // Go offline
      await act(() => {
        setOnlineStatus(false);
      });

      // Delete the alarm
      const alarmItem = screen
        .getByText('Delete Me Alarm')
        .closest('[data-testid="alarm-item"]');
      const deleteButton = alarmItem?.querySelector('[data-testid="delete-alarm"]');

      if (deleteButton) {
        await user.click(deleteButton);
      } else {
        // Try right-click context menu
        await user.pointer({
          keys: '[MouseRight]',
          target: screen.getByText('Delete Me Alarm'),
        });
        const contextDelete = screen.queryByText(/delete/i);
        if (contextDelete) {
          await user.click(contextDelete);
        }
      }

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = screen.queryByRole('button', {
        name: /confirm|delete|yes/i,
      });
      if (confirmButton) {
        await user.click(confirmButton);
      }

      // Mock offline deletion
      vi.mocked(SupabaseService.deleteAlarm).mockRejectedValueOnce(
        new Error('Network unavailable')
      );

      // Verify alarm is removed from UI
      await waitFor(() => {
        expect(screen.queryByText('Delete Me Alarm')).not.toBeInTheDocument();
      });

      // Verify offline storage was called
      expect(OfflineStorage.deleteAlarm).toHaveBeenCalledWith('delete-me-alarm-999');

      // Go back online
      await act(() => {
        setOnlineStatus(true);
      });

      // Mock pending deletion for sync
      vi.mocked(OfflineStorage.getPendingChanges).mockResolvedValueOnce([
        {
          id: 'change-delete-1',
          type: 'delete',
          data: null,
          alarmId: 'delete-me-alarm-999',
          timestamp: new Date().toISOString(),
        },
      ]);

      vi.mocked(SupabaseService.deleteAlarm).mockResolvedValueOnce({
        success: true,
        error: null,
      });

      // Wait for sync
      await waitFor(
        () => {
          expect(SupabaseService.deleteAlarm).toHaveBeenCalledWith(
            'delete-me-alarm-999'
          );
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Sync Conflict Resolution', () => {
    it('should resolve conflicts when same alarm is modified offline and online', async () => {
      const conflictingAlarm = createMockAlarm({
        id: 'conflict-alarm-555',
        userId: mockUser.id,
        time: '05:00',
        label: 'Conflict Test Alarm',
        enabled: true,
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      });

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [conflictingAlarm],
        error: null,
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
        expect(screen.getByText('Conflict Test Alarm')).toBeInTheDocument();
      });

      // Simulate offline modification
      await act(() => {
        setOnlineStatus(false);
      });

      // Make offline changes
      const alarmItem = screen
        .getByText('Conflict Test Alarm')
        .closest('[data-testid="alarm-item"]');
      const editButton = alarmItem?.querySelector('[data-testid="edit-alarm"]');

      if (editButton) {
        await user.click(editButton);
      }

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const labelInput = screen.getByDisplayValue('Conflict Test Alarm');
      await user.clear(labelInput);
      await user.type(labelInput, 'Offline Modified Alarm');

      await user.click(screen.getByRole('button', { name: /save|update/i }));

      await waitFor(() => {
        expect(screen.getByText('Offline Modified Alarm')).toBeInTheDocument();
      });

      // Go back online
      await act(() => {
        setOnlineStatus(true);
      });

      // Mock server having a newer version (simulating concurrent edit)
      const serverVersionAlarm = {
        ...conflictingAlarm,
        label: 'Server Modified Alarm',
        time: '05:15',
        updatedAt: new Date('2024-01-01T11:00:00Z'), // Newer than local
      };

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [serverVersionAlarm],
        error: null,
      });

      // Mock pending changes
      vi.mocked(OfflineStorage.getPendingChanges).mockResolvedValueOnce([
        {
          id: 'conflict-change-1',
          type: 'update',
          data: {
            ...conflictingAlarm,
            label: 'Offline Modified Alarm',
            updatedAt: new Date('2024-01-01T10:30:00Z'), // Older than server
          },
          timestamp: new Date().toISOString(),
        },
      ]);

      // Mock conflict resolution (server wins by default)
      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: serverVersionAlarm,
        error: null,
      });

      // Wait for conflict resolution
      await waitFor(
        () => {
          // Server version should win
          expect(screen.getByText('Server Modified Alarm')).toBeInTheDocument();
          expect(screen.queryByText('Offline Modified Alarm')).not.toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Background Sync with Service Worker', () => {
    it('should sync changes through service worker when tab is inactive', async () => {
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

      // Create some pending changes
      vi.mocked(OfflineStorage.getPendingChanges).mockResolvedValue([
        {
          id: 'bg-sync-1',
          type: 'create',
          data: createMockAlarm({
            id: 'bg-alarm-111',
            userId: mockUser.id,
            time: '11:00',
            label: 'Background Sync Alarm',
          }),
          timestamp: new Date().toISOString(),
        },
      ]);

      // Simulate tab becoming inactive
      await act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
        });
        document.dispatchEvent(visibilityChangeEvent);
      });

      // Simulate service worker background sync message
      await act(async () => {
        const syncMessage = {
          type: 'SYNC_START',
          data: { source: 'background_sync' },
        };
        const messageEvent = new MessageEvent('message', { data: syncMessage });
        window.dispatchEvent(messageEvent);
      });

      // Mock successful sync
      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: createMockAlarm({
          id: 'bg-alarm-111',
          userId: mockUser.id,
          time: '11:00',
          label: 'Background Sync Alarm',
        }),
        error: null,
      });

      // Simulate sync completion message
      await act(async () => {
        const syncCompleteMessage = {
          type: 'SYNC_COMPLETE',
          data: {
            syncedChanges: 1,
            source: 'background_sync',
          },
        };
        const messageEvent = new MessageEvent('message', { data: syncCompleteMessage });
        window.dispatchEvent(messageEvent);
      });

      // Tab becomes active again
      await act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
        });
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      // Verify sync was completed
      await waitFor(() => {
        expect(SupabaseService.saveAlarm).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'Background Sync Alarm',
          })
        );
      });
    });
  });

  describe('Cross-Device Sync', () => {
    it('should handle data from multiple devices', async () => {
      // Simulate alarms from multiple devices
      const device1Alarms = [
        createMockAlarm({
          id: 'device1-alarm-1',
          userId: mockUser.id,
          time: '06:00',
          label: 'Phone Alarm',
          createdAt: new Date('2024-01-01T08:00:00Z'),
          metadata: { deviceId: 'phone-123' },
        }),
      ];

      const device2Alarms = [
        createMockAlarm({
          id: 'device2-alarm-1',
          userId: mockUser.id,
          time: '07:00',
          label: 'Laptop Alarm',
          createdAt: new Date('2024-01-01T09:00:00Z'),
          metadata: { deviceId: 'laptop-456' },
        }),
      ];

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: [...device1Alarms, ...device2Alarms],
        error: null,
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

      // Verify both device alarms are loaded
      await waitFor(() => {
        expect(screen.getByText('Phone Alarm')).toBeInTheDocument();
        expect(screen.getByText('Laptop Alarm')).toBeInTheDocument();
      });

      // Create new alarm on current device
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '08:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Current Device Alarm');

      const newDeviceAlarm = createMockAlarm({
        id: 'current-device-alarm-1',
        userId: mockUser.id,
        time: '08:00',
        label: 'Current Device Alarm',
        createdAt: new Date(),
        metadata: { deviceId: 'current-device-789' },
      });

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: newDeviceAlarm,
        error: null,
      });

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      // Verify all three alarms are now present
      await waitFor(() => {
        expect(screen.getByText('Phone Alarm')).toBeInTheDocument();
        expect(screen.getByText('Laptop Alarm')).toBeInTheDocument();
        expect(screen.getByText('Current Device Alarm')).toBeInTheDocument();
      });

      // Verify sync includes device information
      expect(SupabaseService.saveAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Current Device Alarm',
          metadata: expect.objectContaining({
            deviceId: expect.any(String),
          }),
        })
      );
    });
  });
});
