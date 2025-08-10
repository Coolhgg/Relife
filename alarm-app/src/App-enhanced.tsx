import { useState, useEffect } from 'react';
import { Plus, Clock, Settings, Bell } from 'lucide-react';
import type { Alarm, AppState, VoiceMood } from './types';

import AlarmList from './components/AlarmList';
import AlarmForm from './components/AlarmForm';
import AlarmRinging from './components/AlarmRinging';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import OnboardingFlow from './components/OnboardingFlow';
import { initializeCapacitor } from './services/capacitor';
import { EnhancedAlarmService } from './services/alarm-enhanced';
import { NotificationService } from './services/notification';
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

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Capacitor
        const capacitorResult = await initializeCapacitor();
        
        // Initialize notification service
        const notificationPermission = await NotificationService.initialize();
        
        // Initialize enhanced alarm service
        await EnhancedAlarmService.initialize();
        
        // Load saved alarms
        const savedAlarms = await EnhancedAlarmService.loadAlarms();
        
        // Set up alarm listeners
        const removeAlarmListener = EnhancedAlarmService.addListener((alarms) => {
          setAppState(prev => ({ ...prev, alarms }));
        });
        
        const removeActiveAlarmListener = EnhancedAlarmService.addActiveAlarmListener((alarm) => {
          if (alarm) {
            setAppState(prev => ({ 
              ...prev, 
              activeAlarm: alarm, 
              currentView: 'alarm-ringing' 
            }));
          } else {
            setAppState(prev => ({ 
              ...prev, 
              activeAlarm: null, 
              currentView: 'dashboard' 
            }));
          }
        });
        
        // Set up global alarm event listeners
        const handleAlarmTriggered = (event: any) => {
          const alarm = event.detail?.alarm || event.detail;
          if (alarm) {
            setAppState(prev => ({ 
              ...prev, 
              activeAlarm: alarm, 
              currentView: 'alarm-ringing' 
            }));
          }
        };
        
        const handleNotificationClick = (event: any) => {
          const data = event.detail;
          if (data?.alarmId) {
            const alarm = EnhancedAlarmService.getAlarmById(data.alarmId);
            if (alarm) {
              setAppState(prev => ({ 
                ...prev, 
                activeAlarm: alarm, 
                currentView: 'alarm-ringing' 
              }));
            }
          }
        };
        
        const handleNotificationAction = (event: any) => {
          const { action, alarmId } = event.detail;
          if (action === 'dismiss' && alarmId) {
            handleAlarmDismiss(alarmId, 'button');
          } else if (action === 'snooze' && alarmId) {
            handleAlarmSnooze(alarmId);
          }
        };
        
        window.addEventListener('alarm-triggered', handleAlarmTriggered);
        window.addEventListener('notification-click', handleNotificationClick);
        window.addEventListener('notification-action', handleNotificationAction);
        
        setAppState(prev => ({
          ...prev,
          alarms: savedAlarms,
          isOnboarding: savedAlarms.length === 0,
          permissions: {
            notifications: { granted: notificationPermission },
            microphone: { granted: capacitorResult.notificationPermission }
          }
        }));
        
        setIsInitialized(true);
        
        // Cleanup function
        return () => {
          removeAlarmListener();
          removeActiveAlarmListener();
          window.removeEventListener('alarm-triggered', handleAlarmTriggered);
          window.removeEventListener('notification-click', handleNotificationClick);
          window.removeEventListener('notification-action', handleNotificationAction);
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, []);

  const handleAddAlarm = async (alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
  }) => {
    try {
      const newAlarm = await EnhancedAlarmService.createAlarm(alarmData);
      
      // Schedule notification for the new alarm
      await NotificationService.scheduleAlarmNotification(newAlarm);
      
      setShowAlarmForm(false);
    } catch (error) {
      console.error('Failed to create alarm:', error);
    }
  };

  const handleEditAlarm = async (alarmId: string, alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
  }) => {
    try {
      // Cancel existing notifications
      await NotificationService.cancelAlarmNotifications(alarmId);
      
      const updatedAlarm = await EnhancedAlarmService.updateAlarm(alarmId, alarmData);
      
      // Schedule new notifications
      await NotificationService.scheduleAlarmNotification(updatedAlarm);
      
      setEditingAlarm(null);
      setShowAlarmForm(false);
    } catch (error) {
      console.error('Failed to update alarm:', error);
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    try {
      // Cancel notifications
      await NotificationService.cancelAlarmNotifications(alarmId);
      
      await EnhancedAlarmService.deleteAlarm(alarmId);
    } catch (error) {
      console.error('Failed to delete alarm:', error);
    }
  };

  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    try {
      const updatedAlarm = await EnhancedAlarmService.toggleAlarm(alarmId, enabled);
      
      if (enabled) {
        // Schedule notifications
        await NotificationService.scheduleAlarmNotification(updatedAlarm);
      } else {
        // Cancel notifications
        await NotificationService.cancelAlarmNotifications(alarmId);
      }
    } catch (error) {
      console.error('Failed to toggle alarm:', error);
    }
  };

  const handleOnboardingComplete = () => {
    setAppState(prev => ({ ...prev, isOnboarding: false }));
  };

  const handleAlarmDismiss = async (alarmId: string, method: 'voice' | 'button' | 'shake') => {
    try {
      await EnhancedAlarmService.dismissAlarm(alarmId, method);
      
      // Cancel any snooze notifications
      await NotificationService.cancelAlarmNotifications(alarmId);
      
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      console.error('Failed to dismiss alarm:', error);
    }
  };

  const handleAlarmSnooze = async (alarmId: string) => {
    try {
      const alarm = EnhancedAlarmService.getAlarmById(alarmId);
      if (!alarm) return;
      
      await EnhancedAlarmService.snoozeAlarm(alarmId);
      
      // Schedule snooze notification
      await NotificationService.scheduleSnoozeNotification(alarm, 5);
      
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      console.error('Failed to snooze alarm:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Starting Smart Alarm...</h2>
          <p className="text-primary-200 mt-2">Initializing services...</p>
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
      <AlarmRinging 
        alarm={appState.activeAlarm}
        onDismiss={handleAlarmDismiss}
        onSnooze={handleAlarmSnooze}
      />
    );
  }

  const renderContent = () => {
    switch (appState.currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            alarms={appState.alarms}
            onAddAlarm={() => setShowAlarmForm(true)}
          />
        );
      case 'alarms':
        return (
          <AlarmList
            alarms={appState.alarms}
            onToggleAlarm={handleToggleAlarm}
            onEditAlarm={(alarm) => {
              setEditingAlarm(alarm);
              setShowAlarmForm(true);
            }}
            onDeleteAlarm={handleDeleteAlarm}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            appState={appState}
            setAppState={setAppState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Alarm
            </h1>
            <div className="flex items-center gap-2">
              {/* Notification status indicator */}
              {appState.permissions.notifications.granted && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Notifications enabled" />
              )}
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
      )}
    </div>
  );
}

export default App;