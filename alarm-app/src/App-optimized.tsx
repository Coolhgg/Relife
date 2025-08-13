/**
 * Optimized Smart Alarm App with comprehensive device capability adaptations
 * Integrates all performance optimizations, device detection, and fallback strategies
 */

import React, { useState, useEffect, Suspense } from 'react';
import { Plus, Clock, Settings, Bell, BarChart3, Trophy, LogOut } from 'lucide-react';
import type { Alarm, AppState, VoiceMood } from './types';

// Optimized imports
import { useDeviceCapabilities } from './hooks/useDeviceCapabilities';
import { useFallbackState, FallbackErrorBoundary } from './utils/fallback-strategies';
import { useMemoryManagement } from './utils/memory-management';
import { useFrameRate, FrameRateMonitor } from './utils/frame-rate-manager';
import { progressiveLoader } from './utils/progressive-loading';
import AdaptiveButton from './components/AdaptiveButton';
import AdaptiveModal, { useAdaptiveModal } from './components/AdaptiveModal';
import AdaptiveSpinner from './components/AdaptiveSpinner';
import { AdaptiveAlarmListWithErrorBoundary as AdaptiveAlarmList } from './components/AdaptiveAlarmList';
import AdaptiveImage from './components/AdaptiveImage';

// Core components (always loaded)
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Lazy loaded components for better performance
const AlarmForm = React.lazy(() => import('./components/AlarmForm'));
const AlarmRinging = React.lazy(() => import('./components/AlarmRinging'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const OnboardingFlow = React.lazy(() => import('./components/OnboardingFlow'));
const AuthenticationFlow = React.lazy(() => import('./components/AuthenticationFlow'));
const PerformanceDashboard = React.lazy(() => import('./components/PerformanceDashboard'));
const RewardsDashboard = React.lazy(() => import('./components/RewardsDashboard'));

// Services
import { initializeCapacitor } from './services/capacitor';
import { AlarmService } from './services/alarm';
import { ErrorHandler } from './services/error-handler';
import OfflineStorage from './services/offline-storage';
import AccessibilityUtils from './utils/accessibility';
import PerformanceMonitor from './services/performance-monitor';
import AppAnalyticsService from './services/app-analytics';
import AIRewardsService from './services/ai-rewards';
import { SupabaseService } from './services/supabase';
import useAuth from './hooks/useAuth';
import './App.css';

function OptimizedApp() {
  const auth = useAuth();
  
  // Device capabilities and performance monitoring
  const { isLowEnd, deviceTier, shouldUseVirtualScrolling } = useDeviceCapabilities();
  const fallbackState = useFallbackState();
  const { memoryStats, forceCleanup } = useMemoryManagement();
  const frameMetrics = useFrameRate();
  const alarmFormModal = useAdaptiveModal();

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
  
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');

  // Progressive loading state
  const [componentsLoaded, setComponentsLoaded] = useState({
    alarmForm: false,
    dashboard: false,
    settings: false,
  });

  // Preload critical components based on device capabilities
  useEffect(() => {
    const preloadComponents = async () => {
      // Always preload dashboard for immediate navigation
      try {
        await progressiveLoader.loadComponent(
          'dashboard',
          () => import('./components/Dashboard'),
          { priority: { level: 'critical' } }
        );
        setComponentsLoaded(prev => ({ ...prev, dashboard: true }));
      } catch (error) {
        console.warn('Failed to preload dashboard:', error);
      }

      // Preload alarm form on better devices or when hover detected
      if (!isLowEnd || deviceTier === 'mid-range') {
        try {
          await progressiveLoader.loadComponent(
            'alarm-form',
            () => import('./components/AlarmForm'),
            { priority: { level: 'high' } }
          );
          setComponentsLoaded(prev => ({ ...prev, alarmForm: true }));
        } catch (error) {
          console.warn('Failed to preload alarm form:', error);
        }
      }
    };

    if (auth.user) {
      preloadComponents();
    }
  }, [auth.user, isLowEnd, deviceTier]);

  // Memory pressure handling
  useEffect(() => {
    if (memoryStats && memoryStats.usage > 0.8) {
      console.warn('High memory usage detected, forcing cleanup');
      forceCleanup();
    }
  }, [memoryStats, forceCleanup]);

  // Emergency mode handling
  useEffect(() => {
    if (fallbackState.isEmergencyMode) {
      console.warn('Emergency mode activated - reducing app complexity');
      
      // Clear non-essential data
      if (memoryStats && memoryStats.usage > 0.9) {
        forceCleanup();
      }
      
      // Disable PWA install prompt
      setShowPWAInstall(false);
    }
  }, [fallbackState.isEmergencyMode, memoryStats, forceCleanup]);

  // Initialize app with performance monitoring
  useEffect(() => {
    const initialize = async () => {
      try {
        const performanceMonitor = PerformanceMonitor.getInstance();
        const appAnalytics = AppAnalyticsService.getInstance();
        
        performanceMonitor.initialize();
        appAnalytics.startPerformanceMarker('app_initialization');
        
        // Initialize analytics with device info
        await appAnalytics.initializeAnalytics();
        appAnalytics.trackPageView('dashboard', {
          isInitialLoad: true,
          userAuthenticated: !!auth.user,
          deviceTier,
          memoryUsage: memoryStats?.usage,
          avgFps: frameMetrics.averageFps
        });
        
        await initializeCapacitor();
        await registerEnhancedServiceWorker();
        
        if (auth.user) {
          await loadUserAlarms();
        }
        
        setIsInitialized(true);
        appAnalytics.endPerformanceMarker('app_initialization', { success: true });
      } catch (error) {
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)), 
          'Failed to initialize app'
        );
        setIsInitialized(true);
      }
    };
    
    if (auth.isInitialized) {
      initialize();
    }
  }, [auth.isInitialized, auth.user, deviceTier, memoryStats?.usage, frameMetrics.averageFps]);

  // Optimized alarm operations
  const handleAddAlarm = async (alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
  }) => {
    if (!auth.user) return;
    
    const appAnalytics = AppAnalyticsService.getInstance();
    appAnalytics.startPerformanceMarker('alarm_creation');
    
    try {
      const newAlarm: Alarm = {
        id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: auth.user.id,
        enabled: true,
        snoozeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...alarmData
      };
      
      if (isOnline) {
        const saveResult = await SupabaseService.saveAlarm(newAlarm);
        if (saveResult.error) throw new Error(saveResult.error);
      }
      
      await OfflineStorage.saveAlarm(newAlarm);
      
      const updatedAlarms = [...appState.alarms, newAlarm];
      setAppState(prev => ({ ...prev, alarms: updatedAlarms }));
      alarmFormModal.close();
      
      AccessibilityUtils.createAriaAnnouncement(
        `Alarm created for ${newAlarm.label} at ${newAlarm.time}`,
        'polite'
      );
      
      appAnalytics.trackAlarmCreated(newAlarm, { deviceTier });
      appAnalytics.endPerformanceMarker('alarm_creation', { success: true });
      
      updateServiceWorkerAlarms(updatedAlarms);
    } catch (error) {
      appAnalytics.endPerformanceMarker('alarm_creation', { success: false });
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)), 
        'Failed to create alarm'
      );
    }
  };

  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    if (!auth.user) return;
    
    try {
      const existingAlarm = appState.alarms.find(a => a.id === alarmId);
      if (!existingAlarm) return;
      
      const updatedAlarm = { ...existingAlarm, enabled, updatedAt: new Date() };
      
      if (isOnline) {
        const saveResult = await SupabaseService.saveAlarm(updatedAlarm);
        if (saveResult.error) throw new Error(saveResult.error);
      }
      
      await OfflineStorage.saveAlarm(updatedAlarm);
      
      const updatedAlarms = appState.alarms.map(alarm => 
        alarm.id === alarmId ? updatedAlarm : alarm
      );
      
      setAppState(prev => ({ ...prev, alarms: updatedAlarms }));
      updateServiceWorkerAlarms(updatedAlarms);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)), 
        'Failed to toggle alarm'
      );
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    if (!auth.user) return;
    
    try {
      if (isOnline) {
        const deleteResult = await SupabaseService.deleteAlarm(alarmId);
        if (deleteResult.error) throw new Error(deleteResult.error);
      }
      
      await OfflineStorage.deleteAlarm(alarmId);
      
      const updatedAlarms = appState.alarms.filter(alarm => alarm.id !== alarmId);
      setAppState(prev => ({ ...prev, alarms: updatedAlarms }));
      updateServiceWorkerAlarms(updatedAlarms);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)), 
        'Failed to delete alarm'
      );
    }
  };

  // Utility functions
  const loadUserAlarms = async () => {
    if (!auth.user) return;
    
    try {
      const offlineAlarms = await OfflineStorage.getAlarms();
      setAppState(prev => ({ 
        ...prev, 
        alarms: offlineAlarms,
        isOnboarding: offlineAlarms.length === 0 
      }));
      
      if (isOnline) {
        const { alarms: savedAlarms } = await SupabaseService.loadUserAlarms(auth.user.id);
        setAppState(prev => ({ 
          ...prev, 
          alarms: savedAlarms,
          isOnboarding: savedAlarms.length === 0 
        }));
        await OfflineStorage.saveAlarms(savedAlarms);
      }
    } catch (error) {
      console.warn('Failed to load user alarms:', error);
    }
  };

  const registerEnhancedServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-enhanced.js');
        console.log('Enhanced service worker registered');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
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

  // Loading screen with device-appropriate complexity
  if (!auth.isInitialized || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center text-white">
          <AdaptiveSpinner size="xl" color="white" className="mb-4" />
          <h2 className="text-xl font-semibold">Starting Smart Alarm...</h2>
          <p className="text-primary-200 mt-2">
            {!auth.isInitialized 
              ? 'Checking authentication...' 
              : 'Optimizing for your device...'}
          </p>
          {isLowEnd && (
            <p className="text-primary-300 text-sm mt-1">
              Low-power mode enabled
            </p>
          )}
        </div>
      </div>
    );
  }

  // Authentication flow
  if (!auth.user) {
    return (
      <FallbackErrorBoundary fallbackComponent="simple-text">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <AdaptiveSpinner size="lg" showLabel label="Loading authentication..." />
          </div>
        }>
          <AuthenticationFlow
            onAuthSuccess={() => console.log('Auth success')}
            onSignUp={auth.signUp}
            onSignIn={auth.signIn}
            onForgotPassword={auth.resetPassword}
            isLoading={auth.isLoading}
            error={auth.error}
            forgotPasswordSuccess={auth.forgotPasswordSuccess}
          />
        </Suspense>
      </FallbackErrorBoundary>
    );
  }

  // Onboarding flow
  if (appState.isOnboarding) {
    return (
      <FallbackErrorBoundary fallbackComponent="simple-text">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <AdaptiveSpinner size="lg" showLabel label="Loading onboarding..." />
          </div>
        }>
          <OnboardingFlow 
            onComplete={() => setAppState(prev => ({ ...prev, isOnboarding: false }))}
            appState={appState}
            setAppState={setAppState}
          />
        </Suspense>
      </FallbackErrorBoundary>
    );
  }

  // Active alarm ringing
  if (appState.activeAlarm) {
    return (
      <FallbackErrorBoundary fallbackComponent="simple-text">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-red-50">
            <AdaptiveSpinner size="lg" color="primary" />
          </div>
        }>
          <AlarmRinging 
            alarm={appState.activeAlarm}
            onDismiss={(alarmId, method) => {
              setAppState(prev => ({ ...prev, activeAlarm: null }));
            }}
            onSnooze={(alarmId) => {
              setAppState(prev => ({ ...prev, activeAlarm: null }));
            }}
          />
        </Suspense>
      </FallbackErrorBoundary>
    );
  }

  // Main content renderer
  const renderContent = () => {
    const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <AdaptiveSpinner size="lg" showLabel label="Loading..." />
        </div>
      }>
        {children}
      </Suspense>
    );

    switch (appState.currentView) {
      case 'dashboard':
        return (
          <SuspenseWrapper>
            <Dashboard 
              alarms={appState.alarms}
              onAddAlarm={() => alarmFormModal.open()}
              onQuickSetup={() => {}}
            />
          </SuspenseWrapper>
        );
        
      case 'alarms':
        // Use fallback for critical situations
        if (fallbackState.isEmergencyMode) {
          const EmergencyAlarmList = progressiveLoader.getFallbackComponent('emergency-alarm-list');
          return EmergencyAlarmList ? (
            <EmergencyAlarmList 
              alarms={appState.alarms} 
              onToggle={handleToggleAlarm} 
            />
          ) : null;
        }
        
        return (
          <AdaptiveAlarmList
            alarms={appState.alarms}
            onToggleAlarm={handleToggleAlarm}
            onEditAlarm={(alarm) => {
              setEditingAlarm(alarm);
              alarmFormModal.open();
            }}
            onDeleteAlarm={handleDeleteAlarm}
          />
        );
        
      case 'settings':
        return (
          <SuspenseWrapper>
            <SettingsPage 
              appState={appState}
              setAppState={setAppState}
              onUpdateProfile={auth.updateUserProfile}
              onSignOut={auth.signOut}
              isLoading={auth.isLoading}
              error={auth.error}
            />
          </SuspenseWrapper>
        );
        
      case 'performance':
        return (
          <SuspenseWrapper>
            <PerformanceDashboard />
          </SuspenseWrapper>
        );
        
      case 'rewards':
        return (
          <SuspenseWrapper>
            <RewardsDashboard
              rewardSystem={appState.rewardSystem}
              onRefreshRewards={() => {}}
            />
          </SuspenseWrapper>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col safe-top safe-bottom">
      {/* Performance monitoring (development only) */}
      {process.env.NODE_ENV === 'development' && !isLowEnd && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <FrameRateMonitor showDetails className="text-xs" />
          {memoryStats && (
            <div className="bg-black/80 text-white p-2 rounded text-xs">
              Memory: {Math.round(memoryStats.usage * 100)}%
            </div>
          )}
          {fallbackState.isEmergencyMode && (
            <div className="bg-red-600 text-white p-2 rounded text-xs">
              Emergency Mode
            </div>
          )}
        </div>
      )}

      {/* Skip to main content */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium z-50"
      >
        Skip to main content
      </a>

      {/* Header with optimized components */}
      <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Smart Alarm
              </h1>
              {auth.user && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {auth.user.name || auth.user.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <OfflineIndicator />
              <AdaptiveButton
                variant="primary"
                size="sm"
                onClick={() => alarmFormModal.open()}
                icon={<Plus className="w-5 h-5" />}
                aria-label="Add new alarm"
                animationIntensity={isLowEnd ? 'minimal' : 'standard'}
              />
              <AdaptiveButton
                variant="ghost"
                size="sm"
                onClick={auth.signOut}
                icon={<LogOut className="w-5 h-5" />}
                aria-label="Sign out"
                animationIntensity="minimal"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto">
        <FallbackErrorBoundary>
          {renderContent()}
        </FallbackErrorBoundary>
      </main>

      {/* Bottom navigation with adaptive buttons */}
      <nav className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-200">
        <div className="grid grid-cols-5 px-4 py-2">
          {[
            { key: 'dashboard', icon: Clock, label: 'Dashboard' },
            { key: 'alarms', icon: Bell, label: 'Alarms' },
            { key: 'rewards', icon: Trophy, label: 'Rewards' },
            { key: 'settings', icon: Settings, label: 'Settings' },
            { key: 'performance', icon: BarChart3, label: 'Analytics' }
          ].map(({ key, icon: Icon, label }) => (
            <AdaptiveButton
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setAppState(prev => ({ ...prev, currentView: key as any }))}
              className={`flex flex-col items-center py-2 ${
                appState.currentView === key
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              animationIntensity="minimal"
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </AdaptiveButton>
          ))}
        </div>
      </nav>

      {/* Alarm form modal */}
      <AdaptiveModal
        isOpen={alarmFormModal.isOpen}
        onClose={alarmFormModal.close}
        title={editingAlarm ? 'Edit Alarm' : 'New Alarm'}
        size="md"
        animationIntensity={isLowEnd ? 'minimal' : 'standard'}
      >
        <FallbackErrorBoundary>
          <Suspense fallback={
            <div className="p-6 flex items-center justify-center">
              <AdaptiveSpinner size="md" showLabel label="Loading form..." />
            </div>
          }>
            <AlarmForm
              alarm={editingAlarm}
              onSave={editingAlarm ? 
                (data) => handleEditAlarm(editingAlarm.id, data) : 
                handleAddAlarm
              }
              onCancel={() => {
                alarmFormModal.close();
                setEditingAlarm(null);
              }}
            />
          </Suspense>
        </FallbackErrorBoundary>
      </AdaptiveModal>

      {/* PWA Install Prompt - hidden in emergency mode */}
      {!fallbackState.isEmergencyMode && (
        <PWAInstallPrompt 
          onInstall={() => setShowPWAInstall(false)}
          onDismiss={() => setShowPWAInstall(false)}
        />
      )}
    </div>
  );
}

export default OptimizedApp;