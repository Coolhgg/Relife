import { useState, useEffect } from 'react';
import { Plus, Clock, Settings, Bell, BarChart3, Trophy } from 'lucide-react';
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
import PerformanceDashboard from './components/PerformanceDashboard';
import RewardsDashboard from './components/RewardsDashboard';
import { initializeCapacitor } from './services/capacitor';
import { AlarmService } from './services/alarm';
import { ErrorHandler } from './services/error-handler';
import OfflineStorage from './services/offline-storage';
import PerformanceMonitor from './services/performance-monitor';
import AnalyticsService from './services/analytics';
import AIRewardsService from './services/ai-rewards';
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

  // Refresh rewards system based on current alarms and analytics
  const refreshRewardsSystem = async (alarms: Alarm[] = appState.alarms) => {
    try {
      const aiRewards = AIRewardsService.getInstance();
      const rewardSystem = await aiRewards.analyzeAndGenerateRewards(alarms);
      
      setAppState(prev => ({
        ...prev,
        rewardSystem
      }));
      
      // Track rewards analysis
      const analytics = AnalyticsService.getInstance();
      analytics.trackFeatureUsage('rewards_analysis', undefined, {
        totalRewards: rewardSystem.unlockedRewards.length,
        level: rewardSystem.level,
        currentStreak: rewardSystem.currentStreak
      });
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)), 
        'Failed to refresh rewards system',
        { context: 'rewards_refresh' }
      );
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize performance monitoring and analytics
        const performanceMonitor = PerformanceMonitor.getInstance();
        const analytics = AnalyticsService.getInstance();
        
        performanceMonitor.initialize();
        analytics.initialize();
        
        // Track app initialization
        analytics.trackFeatureUsage('app_initialization');
        analytics.trackPageView('/');
        
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
        
        // Initialize rewards system
        await refreshRewardsSystem(savedAlarms || offlineAlarms || []);
        
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
    const analytics = AnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('create', undefined, { voiceMood: alarmData.voiceMood });
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
      
      const updatedAlarms = [...appState.alarms, newAlarm];
      setAppState(prev => ({
        ...prev,
        alarms: updatedAlarms
      }));
      setShowAlarmForm(false);
      
      // Refresh rewards system with new alarms
      await refreshRewardsSystem(updatedAlarms);
      
      // Track performance and analytics
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('create', duration, { success: true });
      analytics.trackFeatureUsage('alarm_creation', duration, { voiceMood: alarmData.voiceMood });
      
      // Update service worker
      updateServiceWorkerAlarms([...appState.alarms, newAlarm]);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('create', duration, { success: false, error: error instanceof Error ? error.message : String(error) });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'create_alarm');
      
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
    const analytics = AnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('edit', alarmId, { voiceMood: alarmData.voiceMood });
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
      
      // Refresh rewards system with updated alarms
      await refreshRewardsSystem(updatedAlarms);
      
      // Track performance and analytics
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('edit', duration, { success: true });
      analytics.trackFeatureUsage('alarm_editing', duration, { voiceMood: alarmData.voiceMood });
      
      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('edit', duration, { success: false, error: error instanceof Error ? error.message : String(error) });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'edit_alarm');
      
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to edit alarm', {
        context: 'edit_alarm',
        metadata: { alarmId, alarmData, isOnline }
      });
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    const analytics = AnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('delete', alarmId);
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
      
      // Refresh rewards system with updated alarms
      await refreshRewardsSystem(updatedAlarms);
      
      // Track performance and analytics
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('delete', duration, { success: true });
      analytics.trackFeatureUsage('alarm_deletion', duration);
      
      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('delete', duration, { success: false, error: error instanceof Error ? error.message : String(error) });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'delete_alarm');
      
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to delete alarm', {
        context: 'delete_alarm',
        metadata: { alarmId, isOnline }
      });
    }
  };

  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    const analytics = AnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('toggle', alarmId, { enabled });
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
      
      // Refresh rewards system with updated alarms
      await refreshRewardsSystem(updatedAlarms);
      
      // Track performance and analytics
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('toggle', duration, { success: true, enabled });
      analytics.trackFeatureUsage('alarm_toggle', duration, { enabled });
      
      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('toggle', duration, { success: false, enabled, error: error instanceof Error ? error.message : String(error) });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'toggle_alarm');
      
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
    const analytics = AnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('dismiss', alarmId, { method });
      
      if (isOnline) {
        await AlarmService.dismissAlarm(alarmId, method);
      }
      
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('dismiss', duration, { success: true, method });
      analytics.trackFeatureUsage('alarm_dismissal', duration, { method });
      
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('dismiss', duration, { success: false, method, error: error instanceof Error ? error.message : String(error) });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'dismiss_alarm');
      
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to dismiss alarm', {
        context: 'dismiss_alarm',
        metadata: { alarmId, method, isOnline }
      });
      // Fallback: still dismiss the alarm even if logging fails
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    }
  };

  const handleAlarmSnooze = async (alarmId: string) => {
    const analytics = AnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('snooze', alarmId);
      
      if (isOnline) {
        await AlarmService.snoozeAlarm(alarmId);
      }
      
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('snooze', duration, { success: true });
      analytics.trackFeatureUsage('alarm_snooze', duration);
      
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAlarmAction('snooze', duration, { success: false, error: error instanceof Error ? error.message : String(error) });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'snooze_alarm');
      
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
    const analytics = AnalyticsService.getInstance();
    
    switch (appState.currentView) {
      case 'dashboard':
        analytics.trackPageView('/dashboard');
        return (
          <ErrorBoundary context="Dashboard">
            <Dashboard 
              alarms={appState.alarms}
              onAddAlarm={() => {
                analytics.trackInteraction('click', 'add_alarm_button');
                setShowAlarmForm(true);
              }}
            />
          </ErrorBoundary>
        );
      case 'alarms':
        analytics.trackPageView('/alarms');
        return (
          <ErrorBoundary context="AlarmList">
            <AlarmList
              alarms={appState.alarms}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={(alarm) => {
                analytics.trackInteraction('click', 'edit_alarm', { alarmId: alarm.id });
                setEditingAlarm(alarm);
                setShowAlarmForm(true);
              }}
              onDeleteAlarm={handleDeleteAlarm}
            />
          </ErrorBoundary>
        );
      case 'settings':
        analytics.trackPageView('/settings');
        return (
          <ErrorBoundary context="SettingsPage">
            <SettingsPage 
              appState={appState}
              setAppState={setAppState}
            />
          </ErrorBoundary>
        );
      case 'performance':
        analytics.trackPageView('/performance');
        analytics.trackFeatureUsage('performance_dashboard_access');
        return (
          <ErrorBoundary context="PerformanceDashboard">
            <PerformanceDashboard />
          </ErrorBoundary>
        );
      case 'rewards':
        analytics.trackPageView('/rewards');
        analytics.trackFeatureUsage('rewards_dashboard_access');
        return (
          <ErrorBoundary context="RewardsDashboard">
            {appState.rewardSystem ? (
              <RewardsDashboard
                rewardSystem={appState.rewardSystem}
                onRefreshRewards={() => refreshRewardsSystem()}
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading your rewards...</p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col safe-top safe-bottom">
      {/* Skip to main content */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium z-50"
      >
        Skip to main content
      </a>

      {/* Header with Offline Indicator */}
      <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-200" role="banner">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Alarm
            </h1>
            <div className="flex items-center gap-3" role="group" aria-label="Header actions">
              <OfflineIndicator />
              <button
                onClick={() => setShowAlarmForm(true)}
                className="alarm-button alarm-button-primary p-2 rounded-full"
                aria-label="Add new alarm"
                aria-describedby="add-alarm-desc"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span id="add-alarm-desc" className="sr-only">Opens the new alarm creation form</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main id="main-content" className="flex-1 overflow-y-auto" role="main">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-200"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-5 px-4 py-2" role="tablist" aria-label="App sections">
          <button
            onClick={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackInteraction('click', 'navigation_dashboard');
              setAppState(prev => ({ ...prev, currentView: 'dashboard' }));
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'dashboard'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'dashboard'}
            aria-current={appState.currentView === 'dashboard' ? 'page' : undefined}
            aria-label="Dashboard - Overview of your alarms"
            aria-controls="main-content"
          >
            <Clock className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackInteraction('click', 'navigation_alarms');
              setAppState(prev => ({ ...prev, currentView: 'alarms' }));
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'alarms'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'alarms'}
            aria-current={appState.currentView === 'alarms' ? 'page' : undefined}
            aria-label="Alarms - Manage your alarm list"
            aria-controls="main-content"
          >
            <Bell className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Alarms</span>
          </button>
          
          <button
            onClick={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackInteraction('click', 'navigation_rewards');
              setAppState(prev => ({ ...prev, currentView: 'rewards' }));
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'rewards'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'rewards'}
            aria-current={appState.currentView === 'rewards' ? 'page' : undefined}
            aria-label="Rewards - View achievements and AI insights"
            aria-controls="main-content"
          >
            <Trophy className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Rewards</span>
          </button>
          
          <button
            onClick={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackInteraction('click', 'navigation_settings');
              setAppState(prev => ({ ...prev, currentView: 'settings' }));
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'settings'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'settings'}
            aria-current={appState.currentView === 'settings' ? 'page' : undefined}
            aria-label="Settings - Configure app preferences"
            aria-controls="main-content"
          >
            <Settings className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Settings</span>
          </button>
          
          <button
            onClick={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackInteraction('click', 'navigation_performance');
              setAppState(prev => ({ ...prev, currentView: 'performance' }));
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'performance'
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'performance'}
            aria-current={appState.currentView === 'performance' ? 'page' : undefined}
            aria-label="Analytics - View usage statistics and insights"
            aria-controls="main-content"
          >
            <BarChart3 className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Analytics</span>
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