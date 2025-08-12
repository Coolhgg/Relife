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
import { initializeCapacitor } from './services/capacitor';
import { AlarmService } from './services/alarm';
import { ErrorHandler } from './services/error-handler';
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
        await initializeCapacitor();
        
        // Load saved alarms
        const savedAlarms = await AlarmService.loadAlarms();
        setAppState(prev => ({
          ...prev,
          alarms: savedAlarms,
          isOnboarding: savedAlarms.length === 0
        }));
        
        setIsInitialized(true);
      } catch (error) {
        ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
          context: 'app_initialization'
        });
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
      const newAlarm = await AlarmService.createAlarm(alarmData);
      setAppState(prev => ({
        ...prev,
        alarms: [...prev.alarms, newAlarm]
      }));
      setShowAlarmForm(false);
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'create_alarm',
        metadata: { alarmData }
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
      const updatedAlarm = await AlarmService.updateAlarm(alarmId, alarmData);
      setAppState(prev => ({
        ...prev,
        alarms: prev.alarms.map(alarm => 
          alarm.id === alarmId ? updatedAlarm : alarm
        )
      }));
      setEditingAlarm(null);
      setShowAlarmForm(false);
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'edit_alarm',
        metadata: { alarmId, alarmData }
      });
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    try {
      await AlarmService.deleteAlarm(alarmId);
      setAppState(prev => ({
        ...prev,
        alarms: prev.alarms.filter(alarm => alarm.id !== alarmId)
      }));
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'delete_alarm',
        metadata: { alarmId }
      });
    }
  };

  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    try {
      const updatedAlarm = await AlarmService.toggleAlarm(alarmId, enabled);
      setAppState(prev => ({
        ...prev,
        alarms: prev.alarms.map(alarm => 
          alarm.id === alarmId ? updatedAlarm : alarm
        )
      }));
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'toggle_alarm',
        metadata: { alarmId, enabled }
      });
    }
  };

  const handleOnboardingComplete = () => {
    setAppState(prev => ({ ...prev, isOnboarding: false }));
  };

  const handleAlarmDismiss = async (alarmId: string, method: 'voice' | 'button' | 'shake') => {
    try {
      await AlarmService.dismissAlarm(alarmId, method);
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'dismiss_alarm',
        metadata: { alarmId, method }
      });
      // Fallback: still dismiss the alarm even if logging fails
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    }
  };

  const handleAlarmSnooze = async (alarmId: string) => {
    try {
      await AlarmService.snoozeAlarm(alarmId);
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    } catch (error) {
      ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'snooze_alarm',
        metadata: { alarmId }
      });
      // Fallback: still hide the alarm even if snooze fails
      setAppState(prev => ({ ...prev, activeAlarm: null, currentView: 'dashboard' }));
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Starting Smart Alarm...</h2>
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
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Alarm
            </h1>
            <button
              onClick={() => setShowAlarmForm(true)}
              className="alarm-button alarm-button-primary p-2 rounded-full"
            >
              <Plus className="w-5 h-5" />
            </button>
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
    </div>
  );
}

export default App;