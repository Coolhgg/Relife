/**
 * Storage Demo Component
 * Demonstrates the new IndexedDB storage implementation
 * Shows migration status, storage statistics, and basic operations
 */

import React, { useState, useEffect } from 'react';
import UnifiedStorageService from '../services/unified-storage';
import StorageMigrationService from '../services/storage-migration';
import type { Alarm } from '../types/domain';

interface StorageStatus {
  initialized: boolean;
  usingModernStorage: boolean;
  storageType: 'indexeddb' | 'localstorage';
  migrationRequired: boolean;
  canMigrate: boolean;
  stats: any;
  health: any;
}

const StorageDemo: React.FC = () => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const storageService = UnifiedStorageService.getInstance();
  const migrationService = StorageMigrationService.getInstance();

  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize storage
      const initResult = await storageService.initialize({
        autoMigrate: true,
        fallbackToLegacy: true,
        createBackup: true,
      });

      // Get migration status
      const migrationStatus = await migrationService.checkMigrationStatus();

      // Get storage stats
      const stats = await storageService.getStorageStats();

      // Get health info
      const health = await storageService.checkStorageHealth();

      setStatus({
        initialized: initResult.success,
        usingModernStorage: initResult.usingModernStorage,
        storageType: storageService.getStorageType(),
        migrationRequired: migrationStatus.isRequired,
        canMigrate: migrationStatus.canMigrate,
        stats,
        health,
      });

      // Load alarms
      const loadedAlarms = await storageService.getAllAlarms();
      setAlarms(loadedAlarms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize storage');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await storageService.search(searchQuery, ['alarm']);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const createTestAlarm = async () => {
    try {
      const testAlarm: Alarm = {
        id: `test-alarm-${Date.now()}`,
        userId: 'demo-user',
        title: 'Test Alarm',
        time: '07:30',
        enabled: true,
        days: [1, 2, 3, 4, 5], // Weekdays
        sound: 'default',
        volume: 0.8,
        snoozeEnabled: true,
        snoozeInterval: 5,
        maxSnoozes: 3,
        label: 'Morning Workout',
        description: 'Time for my daily workout routine',
        isRecurring: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveAlarm(testAlarm);

      // Reload alarms
      const updatedAlarms = await storageService.getAllAlarms();
      setAlarms(updatedAlarms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test alarm');
    }
  };

  const performMaintenance = async () => {
    try {
      const result = await storageService.performMaintenance();
      console.log('Maintenance result:', result);

      // Refresh status
      await initializeStorage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Maintenance failed');
    }
  };

  const exportData = async () => {
    try {
      const exportedData = await storageService.exportData();

      // Create download link
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relife-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2">Initializing storage system...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Storage System Demo</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold">Status</h3>
              <p>Initialized: {status.initialized ? '✅' : '❌'}</p>
              <p>Storage Type: {status.storageType}</p>
              <p>Modern Storage: {status.usingModernStorage ? '✅' : '❌'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold">Migration</h3>
              <p>Required: {status.migrationRequired ? '⚠️' : '✅'}</p>
              <p>Can Migrate: {status.canMigrate ? '✅' : '❌'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold">Health</h3>
              <p>Healthy: {status.health?.isHealthy ? '✅' : '❌'}</p>
              <p>Issues: {status.health?.issues?.length || 0}</p>
              <p>Can Upgrade: {status.health?.canUpgrade ? '⬆️' : '✅'}</p>
            </div>
          </div>
        )}

        {status?.stats && (
          <div className="bg-blue-50 p-4 rounded mb-6">
            <h3 className="font-semibold mb-2">Storage Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Size:</span>
                <p>{Math.round(status.stats.totalSize / 1024)} KB</p>
              </div>
              <div>
                <span className="font-medium">Alarms:</span>
                <p>{status.stats.alarms}</p>
              </div>
              <div>
                <span className="font-medium">Pending Changes:</span>
                <p>{status.stats.pendingChanges}</p>
              </div>
              <div>
                <span className="font-medium">Cache Entries:</span>
                <p>{status.stats.cacheEntries}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={createTestAlarm}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Test Alarm
          </button>
          <button
            onClick={performMaintenance}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Run Maintenance
          </button>
          <button
            onClick={exportData}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Export Data
          </button>
          <button
            onClick={initializeStorage}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Status
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Search Demo</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search alarms..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Search Results:</h3>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p>
                    <strong>Type:</strong> {result.entityType}
                  </p>
                  <p>
                    <strong>ID:</strong> {result.entityId}
                  </p>
                  <p>
                    <strong>Text:</strong> {result.searchText}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Keywords:</strong> {result.keywords.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Current Alarms ({alarms.length})</h2>
        <div className="space-y-4">
          {alarms.length === 0 ? (
            <p className="text-gray-500">
              No alarms found. Create a test alarm to get started!
            </p>
          ) : (
            alarms.map(alarm => (
              <div key={alarm.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{alarm.title}</h3>
                    <p className="text-2xl font-mono">{alarm.time}</p>
                    <p className="text-sm text-gray-600">{alarm.label}</p>
                    {alarm.description && (
                      <p className="text-sm text-gray-500 mt-1">{alarm.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        alarm.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alarm.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Days:{' '}
                      {alarm.days
                        .map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
                        .join(', ')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-sm text-gray-500">
                  <span>Volume: {Math.round(alarm.volume * 100)}%</span>
                  <span>
                    Snooze:{' '}
                    {alarm.snoozeEnabled
                      ? `${alarm.maxSnoozes}x ${alarm.snoozeInterval}min`
                      : 'Disabled'}
                  </span>
                  <span>Created: {new Date(alarm.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {status?.health?.recommendations && status.health.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Recommendations</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {status.health.recommendations.map((rec: string, index: number) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StorageDemo;
