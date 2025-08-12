import OfflineStorage from '../offline-storage';
import { testUtils } from '../../test-setup';
import type { Alarm } from '../../types';

describe('OfflineStorage', () => {
  let mockAlarm: Alarm;

  beforeEach(() => {
    testUtils.clearAllMocks();
    mockAlarm = { ...testUtils.mockAlarm };
  });

  describe('saveAlarms', () => {
    test('saves alarms to localStorage', async () => {
      const alarms = [mockAlarm];
      
      await OfflineStorage.saveAlarms(alarms);
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-alarms',
        expect.stringContaining(mockAlarm.id)
      );
    });

    test('includes timestamp and version in saved data', async () => {
      const alarms = [mockAlarm];
      
      await OfflineStorage.saveAlarms(alarms);
      
      const savedData = JSON.parse(testUtils.mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.timestamp).toBeDefined();
      expect(savedData.version).toBe('1.0');
      expect(savedData.alarms).toEqual(alarms);
    });

    test('updates metadata after saving', async () => {
      const alarms = [mockAlarm];
      
      await OfflineStorage.saveAlarms(alarms);
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-metadata',
        expect.stringContaining('lastModified')
      );
    });

    test('handles errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      testUtils.mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      await expect(OfflineStorage.saveAlarms([mockAlarm])).rejects.toThrow('Storage full');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('getAlarms', () => {
    test('retrieves alarms from localStorage', async () => {
      const storedData = {
        alarms: [mockAlarm],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const result = await OfflineStorage.getAlarms();
      
      expect(result).toEqual([mockAlarm]);
      expect(testUtils.mockLocalStorage.getItem).toHaveBeenCalledWith('smart-alarm-alarms');
    });

    test('returns empty array when no data exists', async () => {
      testUtils.mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await OfflineStorage.getAlarms();
      
      expect(result).toEqual([]);
    });

    test('handles data migration for different versions', async () => {
      const oldData = {
        alarms: [mockAlarm],
        timestamp: new Date().toISOString(),
        version: '0.9'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldData));
      
      const result = await OfflineStorage.getAlarms();
      
      expect(result).toEqual([mockAlarm]);
      // Should have saved migrated data
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-alarms',
        expect.stringContaining('"version":"1.0"')
      );
    });

    test('handles corrupted data gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      testUtils.mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const result = await OfflineStorage.getAlarms();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveAlarm', () => {
    test('adds new alarm to existing alarms', async () => {
      const existingAlarms = [{ ...mockAlarm, id: 'existing-1' }];
      const newAlarm = { ...mockAlarm, id: 'new-1' };
      
      // Mock existing alarms
      const storedData = {
        alarms: existingAlarms,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      await OfflineStorage.saveAlarm(newAlarm);
      
      const savedData = JSON.parse(testUtils.mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.alarms).toHaveLength(2);
      expect(savedData.alarms).toContain(newAlarm);
    });

    test('updates existing alarm', async () => {
      const existingAlarms = [mockAlarm];
      const updatedAlarm = { ...mockAlarm, label: 'Updated Label' };
      
      // Mock existing alarms
      const storedData = {
        alarms: existingAlarms,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      await OfflineStorage.saveAlarm(updatedAlarm);
      
      const savedData = JSON.parse(testUtils.mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.alarms).toHaveLength(1);
      expect(savedData.alarms[0].label).toBe('Updated Label');
    });

    test('adds pending change for new alarm', async () => {
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ alarms: [], version: '1.0' }));
      
      await OfflineStorage.saveAlarm(mockAlarm);
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-pending',
        expect.stringContaining('"type":"create"')
      );
    });

    test('adds pending change for updated alarm', async () => {
      const storedData = {
        alarms: [mockAlarm],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const updatedAlarm = { ...mockAlarm, label: 'Updated' };
      await OfflineStorage.saveAlarm(updatedAlarm);
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-pending',
        expect.stringContaining('"type":"update"')
      );
    });
  });

  describe('deleteAlarm', () => {
    test('removes alarm from stored alarms', async () => {
      const storedData = {
        alarms: [mockAlarm, { ...mockAlarm, id: 'alarm-2' }],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      await OfflineStorage.deleteAlarm(mockAlarm.id);
      
      const savedData = JSON.parse(testUtils.mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.alarms).toHaveLength(1);
      expect(savedData.alarms[0].id).toBe('alarm-2');
    });

    test('adds pending change for deletion', async () => {
      const storedData = {
        alarms: [mockAlarm],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      await OfflineStorage.deleteAlarm(mockAlarm.id);
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart-alarm-pending',
        expect.stringContaining('"type":"delete"')
      );
    });
  });

  describe('pending changes management', () => {
    test('getPendingChanges returns parsed changes', async () => {
      const pendingChanges = [
        { id: 'change-1', type: 'create', data: mockAlarm, timestamp: new Date().toISOString() }
      ];
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(pendingChanges));
      
      const result = await OfflineStorage.getPendingChanges();
      
      expect(result).toEqual(pendingChanges);
    });

    test('getPendingChanges returns empty array when no changes', async () => {
      testUtils.mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await OfflineStorage.getPendingChanges();
      
      expect(result).toEqual([]);
    });

    test('addPendingChange replaces existing change for same item', async () => {
      const existingChanges = [
        { id: mockAlarm.id, type: 'create', data: mockAlarm, timestamp: '2025-01-01T00:00:00Z' }
      ];
      testUtils.mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingChanges));
      
      const newChange = {
        id: mockAlarm.id,
        type: 'update',
        data: { ...mockAlarm, label: 'Updated' },
        timestamp: '2025-01-01T01:00:00Z'
      };
      
      await OfflineStorage.addPendingChange(newChange);
      
      const savedChanges = JSON.parse(testUtils.mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedChanges).toHaveLength(1);
      expect(savedChanges[0].type).toBe('update');
    });

    test('clearPendingChanges removes all changes', async () => {
      await OfflineStorage.clearPendingChanges();
      
      expect(testUtils.mockLocalStorage.removeItem).toHaveBeenCalledWith('smart-alarm-pending');
    });
  });

  describe('data export and import', () => {
    test('exportData includes all data types', async () => {
      const alarms = [mockAlarm];
      const metadata = { version: '1.0', lastSync: new Date().toISOString(), pendingChanges: [] };
      const pendingChanges = [{ id: 'change-1', type: 'create', data: mockAlarm, timestamp: new Date().toISOString() }];
      
      testUtils.mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify({ alarms, version: '1.0' }))
        .mockReturnValueOnce(JSON.stringify(metadata))
        .mockReturnValueOnce(JSON.stringify(pendingChanges));
      
      const exportData = await OfflineStorage.exportData();
      const parsed = JSON.parse(exportData);
      
      expect(parsed.alarms).toEqual(alarms);
      expect(parsed.metadata).toEqual(metadata);
      expect(parsed.pendingChanges).toEqual(pendingChanges);
      expect(parsed.exportTimestamp).toBeDefined();
    });

    test('importData restores alarms and pending changes', async () => {
      const importData = {
        alarms: [mockAlarm],
        pendingChanges: [{ id: 'change-1', type: 'create', data: mockAlarm, timestamp: new Date().toISOString() }],
        exportTimestamp: new Date().toISOString()
      };
      
      await OfflineStorage.importData(JSON.stringify(importData));
      
      // Should save alarms
      const alarmsCall = testUtils.mockLocalStorage.setItem.mock.calls.find(call => 
        call[0] === 'smart-alarm-alarms'
      );
      expect(alarmsCall).toBeDefined();
      
      // Should save pending changes
      const changesCall = testUtils.mockLocalStorage.setItem.mock.calls.find(call => 
        call[0] === 'smart-alarm-pending'
      );
      expect(changesCall).toBeDefined();
    });

    test('importData handles invalid JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(OfflineStorage.importData('invalid json')).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('storage statistics', () => {
    test('getStorageStats returns correct statistics', async () => {
      const alarms = [mockAlarm, { ...mockAlarm, id: 'alarm-2' }];
      const pendingChanges = [{ id: 'change-1', type: 'create', data: mockAlarm, timestamp: new Date().toISOString() }];
      const metadata = { version: '1.0', lastSync: '2025-01-01T00:00:00Z', pendingChanges: [] };
      
      testUtils.mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify({ alarms, version: '1.0' }))
        .mockReturnValueOnce(JSON.stringify(pendingChanges))
        .mockReturnValueOnce(JSON.stringify(metadata));
      
      const stats = await OfflineStorage.getStorageStats();
      
      expect(stats.alarmsCount).toBe(2);
      expect(stats.pendingChangesCount).toBe(1);
      expect(stats.lastSync).toBe('2025-01-01T00:00:00Z');
      expect(stats.storageUsed).toMatch(/\d+\.\d+ KB/);
    });

    test('getStorageStats handles errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      testUtils.mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const stats = await OfflineStorage.getStorageStats();
      
      expect(stats.alarmsCount).toBe(0);
      expect(stats.pendingChangesCount).toBe(0);
      expect(stats.lastSync).toBe('Never');
      expect(stats.storageUsed).toBe('0 KB');
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearAllData', () => {
    test('removes all storage keys', async () => {
      await OfflineStorage.clearAllData();
      
      expect(testUtils.mockLocalStorage.removeItem).toHaveBeenCalledWith('smart-alarm-alarms');
      expect(testUtils.mockLocalStorage.removeItem).toHaveBeenCalledWith('smart-alarm-metadata');
      expect(testUtils.mockLocalStorage.removeItem).toHaveBeenCalledWith('smart-alarm-pending');
    });

    test('handles errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      testUtils.mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Clear error');
      });
      
      await OfflineStorage.clearAllData();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('singleton pattern', () => {
    test('returns same instance', () => {
      const instance1 = OfflineStorage;
      const instance2 = require('../offline-storage').default;
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('background sync integration', () => {
    test('requests background sync when supported', async () => {
      const mockRegister = jest.fn().mockResolvedValue(undefined);
      const mockServiceWorker = {
        ready: Promise.resolve({
          sync: { register: mockRegister }
        })
      };
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true
      });
      
      await OfflineStorage.saveAlarm(mockAlarm);
      
      // Should request background sync
      await testUtils.waitFor(100);
      expect(mockRegister).toHaveBeenCalledWith('alarm-sync');
    });

    test('handles background sync registration failure', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('Sync not supported'));
      const mockServiceWorker = {
        ready: Promise.resolve({
          sync: { register: mockRegister }
        })
      };
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true
      });
      
      // Should not throw even if sync registration fails
      await expect(OfflineStorage.saveAlarm(mockAlarm)).resolves.not.toThrow();
    });
  });
});