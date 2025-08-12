import { useState, useEffect } from 'react';
import { Plus, Clock, Settings, Bell } from 'lucide-react';
import type { Alarm, AppState, VoiceMood } from './types';

import AlarmList from './components/AlarmList';
import AlarmForm from './components/AlarmForm';
import AlarmRinging from './components/AlarmRinging';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import OnboardingFlow from './components/OnboardingFlow';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { initializeCapacitor } from './services/capacitor';
import { AlarmService } from './services/alarm';
import { ErrorHandler } from './services/error-handler';
import OfflineStorage from './services/offline-storage';
import './App.css';

function App() {
  const [appState, setAppState] = useState<AppState>({
    user: null,
    alarms: [],
    activeAlarm: null,
    permissions: {
      notifications: { granted: false },
      microphone: { granted: false }
    },
    isOnboarding: true,
    currentView: 'dashboard'
  });
  
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Capacitor
        await initializeCapacitor();
        
        // Initialize enhanced service worker
        await registerEnhancedServiceWorker();
        
        // Load alarms from offline storage first (faster)
        const offlineAlarms = await OfflineStorage.getAlarms();
        if (offlineAlarms.length > 0) {
          setAppState(prev => ({
            ...prev,
            alarms: offlineAlarms,
            isOnboarding: offlineAlarms.length === 0
          }));
        }
        
        // Try to load from remote service if online
        if (navigator.onLine) {
          try {
            const savedAlarms = await AlarmService.loadAlarms();
            setAppState(prev => ({
              ...prev,
              alarms: savedAlarms,
              isOnboarding: savedAlarms.length === 0
            }));
            // Save to offline storage
            await OfflineStorage.saveAlarms(savedAlarms);
          } catch (error) {
            console.log('Using offline alarms, remote load failed:', error);
            setSyncStatus('error');
          }
        } else {
          setAppState(prev => ({
            ...prev,
            alarms: offlineAlarms,
            isOnboarding: offlineAlarms.length === 0
          }));
        }
        
        setIsInitialized(true);
      } catch (error) {
        ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to initialize app', {
          context: 'app_initialization'
        });
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('pending');
      // Trigger sync when coming back online
      syncOfflineChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service worker message handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  const registerEnhancedServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-enhanced.js');
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update notification
                console.log('New service worker available');
              }
            });
          }
        });

        console.log('Enhanced service worker registered');
        
        // Send alarms to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'UPDATE_ALARMS',
            data: { alarms: appState.alarms }
          });
        }

      } catch (error) {
        ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Service worker registration failed');
      }
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
      case 'ALARM_TRIGGERED':
        if (data.alarm) {
          setAppState(prev => ({ ...prev, activeAlarm: data.alarm }));
        }
        break;
      case 'SYNC_START':
        setSyncStatus('pending');
        break;
      case 'SYNC_COMPLETE':
        setSyncStatus('synced');
        break;
      case 'SYNC_ERROR':
        setSyncStatus('error');
        ErrorHandler.handleError(new Error(data.error || 'Sync failed'), 'Background sync failed');
        break;
      case 'NETWORK_STATUS':
        setIsOnline(data.isOnline);
        break;
      default:
        console.log('Unknown service worker message:', type);
    }
  };

  const syncOfflineChanges = async () => {
    try {
      const pendingChanges = await OfflineStorage.getPendingChanges();
      
      if (pendingChanges.length > 0) {
        console.log('Syncing', pendingChanges.length, 'offline changes...');
        
        for (const change of pendingChanges) {
          try {
            switch (change.type) {
              case 'create':
                if (change.data) {
                  await AlarmService.createAlarm(change.data);
                }
                break;
              case 'update':
                if (change.data) {
                  await AlarmService.updateAlarm(change.id, change.data);
                }
                break;
              case 'delete':
                await AlarmService.deleteAlarm(change.id);
                break;
            }
          } catch (error) {
            console.error('Failed to sync change:', change, error);
          }
        }
        
        // Clear pending changes after successful sync
        await OfflineStorage.clearPendingChanges();
        setSyncStatus('synced');
        
        // Reload alarms from server to ensure consistency
        const updatedAlarms = await AlarmService.loadAlarms();
        setAppState(prev => ({ ...prev, alarms: updatedAlarms }));
        await OfflineStorage.saveAlarms(updatedAlarms);
      }
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to sync offline changes');
      setSyncStatus('error');
    }
  };

  const handleAddAlarm = async (alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
  }) => {
    try {
      let newAlarm: Alarm;
      
      if (isOnline) {
        // Online: save to server and local storage
        newAlarm = await AlarmService.createAlarm(alarmData);
        await OfflineStorage.saveAlarm(newAlarm);
      } else {
        // Offline: save locally only
        newAlarm = {
          id: `offline-${Date.now()}`,
          enabled: true,
          lastTriggered: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...alarmData
        };
        await OfflineStorage.saveAlarm(newAlarm);
      }
      
      setAppState(prev => ({
        ...prev,
        alarms: [...prev.alarms, newAlarm]
      }));
      setShowAlarmForm(false);
      
      // Update service worker
      updateServiceWorkerAlarms([...appState.alarms, newAlarm]);
      
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to create alarm', {
        context: 'create_alarm',
        metadata: { alarmData, isOnline }
      });
    }
  };

  const handleEditAlarm = async (alarmId: string, alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
  }) => {
    try {
      const existingAlarm = appState.alarms.find(a => a.id === alarmId);
      if (!existingAlarm) throw new Error('Alarm not found');
      
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        ...alarmData,
        updatedAt: new Date().toISOString()
      };
      
      if (isOnline) {
        // Online: update server and local storage
        await AlarmService.updateAlarm(alarmId, alarmData);
        await OfflineStorage.saveAlarm(updatedAlarm);
      } else {
        // Offline: update locally only
        await OfflineStorage.saveAlarm(updatedAlarm);
      }
      
      const updatedAlarms = appState.alarms.map(alarm => 
        alarm.id === alarmId ? updatedAlarm : alarm
      );
      
      setAppState(prev => ({
        ...prev,
        alarms: updatedAlarms
      }));
      setEditingAlarm(null);
      setShowAlarmForm(false);
      
      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
      
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to edit alarm', {
        context: 'edit_alarm',
        metadata: { alarmId, alarmData, isOnline }
      });
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    try {
      if (isOnline) {
        // Online: delete from server and local storage
        await AlarmService.deleteAlarm(alarmId);
        await OfflineStorage.deleteAlarm(alarmId);
      } else {
        // Offline: delete locally only
        await OfflineStorage.deleteAlarm(alarmId);
      }
      
      const updatedAlarms = appState.alarms.filter(alarm => alarm.id !== alarmId);
      setAppState(prev => ({
        ...prev,
        alarms: updatedAlarms
      }));
      
      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
      
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to delete alarm', {
        context: 'delete_alarm',
        metadata: { alarmId, isOnline }
      });
    }
  };

  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    try {
      const existingAlarm = appState.alarms.find(a => a.id === alarmId);
      if (!existingAlarm) throw new Error('Alarm not found');
      
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        enabled,
        updatedAt: new Date().toISOString()
      };
      
      if (isOnline) {
        // Online: update server and local storage
        await AlarmService.toggleAlarm(alarmId, enabled);
        await OfflineStorage.saveAlarm(updatedAlarm);
      } else {
        // Offline: update locally only
        await OfflineStorage.saveAlarm(updatedAlarm);
      }
      
      const updatedAlarms = appState.alarms.map(alarm => 
        alarm.id === alarmId ? updatedAlarm : alarm
      );
      
      setAppState(prev => ({
        ...prev,
        alarms: updatedAlarms
      }));
      
      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
      
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to toggle alarm', {
        context: 'toggle_alarm',
        metadata: { alarmId, enabled, isOnline }
      });
    }
  };

  const updateServiceWorkerAlarms = (alarms: Alarm[]) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_ALARMS',
        data: { alarms }
      });
    }
  };

  const handleOnboardingComplete = () => {
    setAppState(prev => ({ ...prev, isOnboarding: false }));
  };

  const handleAlarmDismiss = async (alarmId: string, method: 'voice' | 'button' | 'shake') => {
    try {
      if (isOnline) {
        await AlarmService.dismissAlarm(alarmId, method);
      }
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to dismiss alarm', {
        context: 'dismiss_alarm',
        metadata: { alarmId, method, isOnline }
      });
      // Fallback: still dismiss the alarm even if logging fails
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    }
  };

  const handleAlarmSnooze = async (alarmId: string) => {
    try {
      if (isOnline) {
        await AlarmService.snoozeAlarm(alarmId);
      }
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to snooze alarm', {
        context: 'snooze_alarm',
        metadata: { alarmId, isOnline }
      });
      // Fallback: still hide the alarm even if snooze fails
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    }
  };

  const handlePWAInstall = () => {
    setShowPWAInstall(false);
    console.log('PWA installation initiated');
  };

  const handlePWADismiss = () => {
    setShowPWAInstall(false);
    console.log('PWA installation dismissed');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Starting Smart Alarm...</h2>
          <p className="text-primary-200 mt-2">Initializing offline capabilities...</p>
        </div>
      </div>
    );
  }

  if (appState.isOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete}
        appState={appState}
        setAppState={setAppState}
      />
    );
  }

  if (appState.activeAlarm) {
    return (
      <ErrorBoundary context="AlarmRinging" fallback={
        <div className="min-h-screen bg-red-50 dark:bg-red-900/10 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Alarm Error</h2>
            <p className="text-red-600 dark:text-red-300 mb-4">There was a problem with the alarm. It has been dismissed.</p>
            <button 
              onClick={() => setAppState(prev => ({ ...prev, activeAlarm: null }))}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      }>
        <AlarmRinging 
          alarm={appState.activeAlarm}
          onDismiss={handleAlarmDismiss}
          onSnooze={handleAlarmSnooze}
        />
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (appState.currentView) {
      case 'dashboard':
        return (
          <ErrorBoundary context="Dashboard">
            <Dashboard 
              alarms={appState.alarms}
              onAddAlarm={() => setShowAlarmForm(true)}
            />
          </ErrorBoundary>
        );
      case 'alarms':
        return (
          <ErrorBoundary context="AlarmList">
            <AlarmList
              alarms={appState.alarms}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={(alarm) => {
                setEditingAlarm(alarm);
                setShowAlarmForm(true);
              }}
              onDeleteAlarm={handleDeleteAlarm}
            />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary context="SettingsPage">
            <SettingsPage 
              appState={appState}
              setAppState={setAppState}
            />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col safe-top safe-bottom">
      {/* Header with Offline Indicator */}
      <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Alarm
            </h1>
            <div className="flex items-center gap-3">
              <OfflineIndicator />
              <button
                onClick={() => setShowAlarmForm(true)}
                className="alarm-button alarm-button-primary p-2 rounded-full"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-200">
        <div className="grid grid-cols-3 px-4 py-2">
          <button
            onClick={() => setAppState(prev => ({ ...prev, currentView: 'dashboard' }))}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'dashboard'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => setAppState(prev => ({ ...prev, currentView: 'alarms' }))}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'alarms'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Alarms</span>
          </button>
          
          <button
            onClick={() => setAppState(prev => ({ ...prev, currentView: 'settings' }))}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'settings'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {/* Alarm Form Modal */}
      {showAlarmForm && (
        <ErrorBoundary context="AlarmForm">
          <AlarmForm
            alarm={editingAlarm}
            onSave={editingAlarm ? 
              (data) => handleEditAlarm(editingAlarm.id, data) : 
              handleAddAlarm
            }
            onCancel={() => {
              setShowAlarmForm(false);
              setEditingAlarm(null);
            }}
          />
        </ErrorBoundary>
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt 
        onInstall={handlePWAInstall}
        onDismiss={handlePWADismiss}
      />
    </div>
  );
}

export default App;