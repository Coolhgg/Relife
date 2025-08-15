import { useState, useEffect } from 'react';
import { Plus, Clock, Settings, Bell, BarChart3, Trophy, LogOut, Sword, Users, Target, Accessibility } from 'lucide-react';
import type { Alarm, AppState, VoiceMood, User } from './types';

import AlarmList from './components/AlarmList';
import AlarmForm from './components/AlarmForm';
import AlarmRinging from './components/AlarmRinging';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import OnboardingFlow from './components/OnboardingFlow';
import AuthenticationFlow from './components/AuthenticationFlow';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PerformanceDashboard from './components/PerformanceDashboard';
import RewardsDashboard from './components/RewardsDashboard';
// Enhanced Battles Components
import CommunityHub from './components/CommunityHub';
import BattleSystem from './components/BattleSystem';
import EnhancedBattles from './components/EnhancedBattles';
import Gamification from './components/Gamification';
import SmartFeatures from './components/SmartFeatures';
import AIAutomation from './components/AIAutomation';
import MediaContent from './components/MediaContent';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import FriendsManager from './components/FriendsManager';
import QuickAlarmSetup from './components/QuickAlarmSetup';
import AccessibilityDashboard from './components/AccessibilityDashboard';
import { ScreenReaderProvider } from './components/ScreenReaderProvider';
import { initializeCapacitor } from './services/capacitor';
import { AlarmService } from './services/alarm';
import { ErrorHandler } from './services/error-handler';
import OfflineStorage from './services/offline-storage';
import AccessibilityUtils from './utils/accessibility';
import ScreenReaderService from './utils/screen-reader';
import KeyboardNavigationService from './utils/keyboard-navigation';
import VoiceAccessibilityService from './utils/voice-accessibility';
import MobileAccessibilityService from './utils/mobile-accessibility';
import EnhancedFocusService from './utils/enhanced-focus';
import PerformanceMonitor from './services/performance-monitor';
import AppAnalyticsService from './services/app-analytics';
import AIRewardsService from './services/ai-rewards';
import { SupabaseService } from './services/supabase';
import useAuth from './hooks/useAuth';
import { useScreenReaderAnnouncements } from './hooks/useScreenReaderAnnouncements';
import './App.css';

function App() {
  const auth = useAuth();
  const { announce } = useScreenReaderAnnouncements({
    announceNavigation: true,
    announceStateChanges: true
  });
  
  const [appState, setAppState] = useState<AppState>({
    user: null,
    alarms: [],
    activeAlarm: null,
    permissions: {
      notifications: { granted: false },
      microphone: { granted: false }
    },
    isOnboarding: true,
    currentView: 'dashboard',
    // Enhanced Battles state
    activeBattles: [],
    friends: [],
    achievements: [],
    tournaments: [],
    teams: [],
    theme: 'minimalist'
  });
  
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');
  const [accessibilityInitialized, setAccessibilityInitialized] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [previousView, setPreviousView] = useState<string | null>(null);

  // Refresh rewards system based on current alarms and analytics
  // Handle quick alarm setup with preset configurations
  const handleQuickSetup = async (presetType: 'morning' | 'work' | 'custom') => {
    const presets = {
      morning: {
        time: '07:00',
        label: 'Morning Routine',
        days: [1, 2, 3, 4, 5], // Monday to Friday
        voiceMood: 'motivational' as VoiceMood
      },
      work: {
        time: '06:30',
        label: 'Work Day',
        days: [1, 2, 3, 4, 5], // Monday to Friday
        voiceMood: 'drill-sergeant' as VoiceMood
      },
      custom: {
        time: '07:00',
        label: 'Wake Up',
        days: [1, 2, 3, 4, 5, 6, 7], // Every day
        voiceMood: 'gentle' as VoiceMood
      }
    };

    const presetConfig = presets[presetType];
    if (presetConfig) {
      await handleAddAlarm(presetConfig);
      
      // Track the quick setup usage
      const appAnalytics = AppAnalyticsService.getInstance();
      appAnalytics.trackFeatureUsage('quick_alarm_setup', 'preset_used', { presetType });
    }
  };

  // Initialize all accessibility services
  const initializeAccessibilityServices = async () => {
    try {
      const screenReaderService = ScreenReaderService.getInstance();
      const keyboardService = KeyboardNavigationService.getInstance();
      const voiceService = VoiceAccessibilityService.getInstance();
      const mobileService = MobileAccessibilityService.getInstance();
      const focusService = EnhancedFocusService.getInstance();
      
      // Initialize all services
      screenReaderService.initialize();
      keyboardService.initialize();
      await voiceService.initialize();
      mobileService.initialize();
      focusService.initialize();
      
      // Announce app initialization
      screenReaderService.announce('Smart Alarm app loaded with full accessibility support', 'polite');
      
      setAccessibilityInitialized(true);
      
      // Track accessibility initialization
      const appAnalytics = AppAnalyticsService.getInstance();
      appAnalytics.trackFeatureUsage('accessibility', 'services_initialized', {
        screenReader: screenReaderService.isEnabled(),
        keyboard: true,
        voice: voiceService.isEnabled(),
        mobile: mobileService.isEnabled(),
        focus: true
      });
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to initialize accessibility services',
        { context: 'accessibility_initialization' }
      );
      setAccessibilityInitialized(true); // Continue even if accessibility fails
    }
  };

  const refreshRewardsSystem = async (alarms: Alarm[] = appState.alarms) => {
    try {
      const aiRewards = AIRewardsService.getInstance();
      const rewardSystem = await aiRewards.analyzeAndGenerateRewards(alarms);
      
      setAppState(prev => ({
        ...prev,
        rewardSystem
      }));
      
      // Track rewards analysis
      const appAnalytics = AppAnalyticsService.getInstance();
      appAnalytics.trackFeatureUsage('rewards_analysis', 'system_updated', {
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

  // Update app state when auth state changes
  useEffect(() => {
    const appAnalytics = AppAnalyticsService.getInstance();
    
    setAppState(prev => ({
      ...prev,
      user: auth.user
    }));
    
    // Set analytics user context when user signs in
    if (auth.user) {
      appAnalytics.setUserContext(auth.user.id, {
        email: auth.user.email,
        signInMethod: 'supabase'
      });
    } else {
      // Clear user context when user signs out
      appAnalytics.clearUserContext();
    }
  }, [auth.user]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize performance monitoring and analytics
        const performanceMonitor = PerformanceMonitor.getInstance();
        const appAnalytics = AppAnalyticsService.getInstance();
        
        performanceMonitor.initialize();
        
        // Start performance tracking
        appAnalytics.startPerformanceMarker('app_initialization');
        
        // Initialize analytics services (Sentry + PostHog)
        await appAnalytics.initializeAnalytics();
        
        // Track app launch
        appAnalytics.trackPageView('dashboard', {
          isInitialLoad: true,
          userAuthenticated: !!auth.user
        });
        
        // Initialize Capacitor
        await initializeCapacitor();
        
        // Initialize enhanced service worker
        await registerEnhancedServiceWorker();
        
        // Initialize accessibility services
        await initializeAccessibilityServices();
        
        // Only load alarms if user is authenticated
        if (auth.user) {
          await loadUserAlarms();
        }
        
        setIsInitialized(true);
      } catch (error) {
        ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)), 'Failed to initialize app', {
          context: 'app_initialization'
        });
        setIsInitialized(true);
      }
    };
    
    if (auth.isInitialized) {
      initialize();
    }
  }, [auth.isInitialized, auth.user]);

  const loadUserAlarms = async () => {
    if (!auth.user) return;
    
    try {
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
          const { alarms: savedAlarms } = await SupabaseService.loadUserAlarms(auth.user.id);
          setAppState(prev => ({
            ...prev,
            alarms: savedAlarms,
            isOnboarding: savedAlarms.length === 0
          }));
          // Save to offline storage
          await OfflineStorage.saveAlarms(savedAlarms);
          
          // Announce successful data load to screen readers
          AccessibilityUtils.createAriaAnnouncement(
            `Loaded ${savedAlarms.length} alarm${savedAlarms.length === 1 ? '' : 's'}`,
            'polite'
          );
          
          // Initialize rewards system
          await refreshRewardsSystem(savedAlarms);
        } catch (error) {
          console.log('Using offline alarms, remote load failed:', error);
          setSyncStatus('error');
          
          // Initialize rewards system with offline alarms
          await refreshRewardsSystem(offlineAlarms);
        }
      } else {
        setAppState(prev => ({
          ...prev,
          alarms: offlineAlarms,
          isOnboarding: offlineAlarms.length === 0
        }));
        
        // Initialize rewards system with offline alarms
        await refreshRewardsSystem(offlineAlarms);
      }
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to load user alarms',
        { context: 'load_user_alarms', metadata: { userId: auth.user.id } }
      );
    }
  };

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
    if (!auth.user) return;
    
    try {
      const pendingChanges = await OfflineStorage.getPendingChanges();
      
      if (pendingChanges.length > 0) {
        console.log('Syncing', pendingChanges.length, 'offline changes...');
        
        for (const change of pendingChanges) {
          try {
            switch (change.type) {
              case 'create':
              case 'update':
                if (change.data) {
                  const saveResult = await SupabaseService.saveAlarm(change.data);
                  if (saveResult.error) {
                    throw new Error(saveResult.error);
                  }
                }
                break;
              case 'delete':
                const deleteResult = await SupabaseService.deleteAlarm(change.id);
                if (deleteResult.error) {
                  throw new Error(deleteResult.error);
                }
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
        const { alarms: updatedAlarms } = await SupabaseService.loadUserAlarms(auth.user.id);
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
    if (!auth.user) {
      ErrorHandler.handleError(new Error('User not authenticated'), 'Cannot create alarm without authentication');
      return;
    }
    
    const appAnalytics = AppAnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    // Start performance tracking
    appAnalytics.startPerformanceMarker('alarm_creation');
    
    try {
      let newAlarm: Alarm;
      
      const alarmWithUser = {
        ...alarmData,
        userId: auth.user.id
      };
      
      if (isOnline) {
        // Online: save to server and local storage
        newAlarm = {
          id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: auth.user.id,
          enabled: true,
          snoozeCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...alarmData
        };
        
        const saveResult = await SupabaseService.saveAlarm(newAlarm);
        if (saveResult.error) {
          throw new Error(saveResult.error);
        }
        
        await OfflineStorage.saveAlarm(newAlarm);
      } else {
        // Offline: save locally only
        newAlarm = {
          id: `offline-${Date.now()}`,
          userId: auth.user.id,
          enabled: true,
          snoozeCount: 0,
          lastTriggered: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
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
      
      // Announce successful alarm creation
      AccessibilityUtils.createAriaAnnouncement(
        `Alarm created successfully for ${newAlarm.label} at ${newAlarm.time}`,
        'polite'
      );
      
      // Refresh rewards system with new alarms
      await refreshRewardsSystem(updatedAlarms);
      
      // Track comprehensive analytics
      appAnalytics.trackAlarmCreated(newAlarm, {
        isQuickSetup: false
      });
      
      // Track performance
      const duration = appAnalytics.endPerformanceMarker('alarm_creation', {
        success: true,
        isOnline,
        totalAlarms: updatedAlarms.length
      });
      
      performanceMonitor.trackAlarmAction('create', duration, { success: true });
      
      // Update service worker
      updateServiceWorkerAlarms([...appState.alarms, newAlarm]);
      
    } catch (error) {
      // Track error and performance
      const duration = appAnalytics.endPerformanceMarker('alarm_creation', {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      performanceMonitor.trackAlarmAction('create', duration, { success: false, error: error instanceof Error ? error.message : String(error) });
      appAnalytics.trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'create_alarm',
        alarmData
      });
      
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
    if (!auth.user) {
      ErrorHandler.handleError(new Error('User not authenticated'), 'Cannot edit alarm without authentication');
      return;
    }
    
    const analytics = AppAnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('edit', alarmId, { voiceMood: alarmData.voiceMood });
      const existingAlarm = appState.alarms.find(a => a.id === alarmId);
      if (!existingAlarm) throw new Error('Alarm not found');
      
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        ...alarmData,
        updatedAt: new Date()
      };
      
      if (isOnline) {
        // Online: update server and local storage
        const saveResult = await SupabaseService.saveAlarm(updatedAlarm);
        if (saveResult.error) {
          throw new Error(saveResult.error);
        }
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
      
      // Announce successful alarm update
      AccessibilityUtils.createAriaAnnouncement(
        `Alarm updated successfully for ${updatedAlarm.label} at ${updatedAlarm.time}`,
        'polite'
      );
      
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
    if (!auth.user) {
      ErrorHandler.handleError(new Error('User not authenticated'), 'Cannot delete alarm without authentication');
      return;
    }
    
    const analytics = AppAnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('delete', alarmId);
      if (isOnline) {
        // Online: delete from server and local storage
        const deleteResult = await SupabaseService.deleteAlarm(alarmId);
        if (deleteResult.error) {
          throw new Error(deleteResult.error);
        }
        await OfflineStorage.deleteAlarm(alarmId);
      } else {
        // Offline: delete locally only
        await OfflineStorage.deleteAlarm(alarmId);
      }
      
      const alarmToDelete = appState.alarms.find(a => a.id === alarmId);
      const updatedAlarms = appState.alarms.filter(alarm => alarm.id !== alarmId);
      setAppState(prev => ({
        ...prev,
        alarms: updatedAlarms
      }));
      
      // Announce successful alarm deletion
      if (alarmToDelete) {
        announce({
          type: 'alarm-delete',
          data: { alarm: alarmToDelete },
          priority: 'polite'
        });
      }
      
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
    if (!auth.user) {
      ErrorHandler.handleError(new Error('User not authenticated'), 'Cannot toggle alarm without authentication');
      return;
    }
    
    const analytics = AppAnalyticsService.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      analytics.trackAlarmAction('toggle', alarmId, { enabled });
      const existingAlarm = appState.alarms.find(a => a.id === alarmId);
      if (!existingAlarm) throw new Error('Alarm not found');
      
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        enabled,
        updatedAt: new Date()
      };
      
      if (isOnline) {
        // Online: update server and local storage
        const saveResult = await SupabaseService.saveAlarm(updatedAlarm);
        if (saveResult.error) {
          throw new Error(saveResult.error);
        }
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
      
      // Announce alarm toggle state change
      announce({
        type: 'alarm-toggle',
        data: { alarm: updatedAlarm, enabled },
        priority: 'polite'
      });
      
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
    const appAnalytics = AppAnalyticsService.getInstance();
    
    // Track onboarding completion
    appAnalytics.trackOnboardingCompleted(
      5, // Number of onboarding steps
      Date.now() - sessionStartTime, // Time spent in onboarding
      false // Not skipped
    );
    
    setAppState(prev => ({ ...prev, isOnboarding: false }));
  };

  const handleAlarmDismiss = async (alarmId: string, method: 'voice' | 'button' | 'shake') => {
    const analytics = AppAnalyticsService.getInstance();
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
    const analytics = AppAnalyticsService.getInstance();
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

  // Show loading screen while auth is initializing
  if (!auth.isInitialized || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Starting Smart Alarm...</h2>
          <p className="text-primary-200 mt-2">
            {!auth.isInitialized ? 'Checking authentication...' : 
             !accessibilityInitialized ? 'Initializing accessibility services...' :
             'Initializing offline capabilities...'}
          </p>
        </div>
      </div>
    );
  }

  // Show authentication flow if user is not logged in
  if (!auth.user) {
    return (
      <ErrorBoundary 
        context="Authentication" 
        fallback={
          <div className="min-h-screen bg-red-50 dark:bg-red-900/10 flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Authentication Error</h2>
              <p className="text-red-600 dark:text-red-300 mb-4">
                There was a problem with the authentication system. Please refresh the page or try again later.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <AuthenticationFlow
          onAuthSuccess={(user) => {
            // Auth success is handled by the useAuth hook
            console.log('Auth success:', user);
          }}
          onSignUp={auth.signUp}
          onSignIn={auth.signIn}
          onForgotPassword={auth.resetPassword}
          isLoading={auth.isLoading}
          error={auth.error}
          forgotPasswordSuccess={auth.forgotPasswordSuccess}
        />
      </ErrorBoundary>
    );
  }

  // Show onboarding flow for new users (after authentication)
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
    const appAnalytics = AppAnalyticsService.getInstance();
    
    switch (appState.currentView) {
      case 'dashboard':
        appAnalytics.trackPageView('dashboard', {
          totalAlarms: appState.alarms.length,
          activeAlarms: appState.alarms.filter(a => a.enabled).length
        });
        return (
          <ErrorBoundary context="Dashboard">
            <Dashboard 
              alarms={appState.alarms}
              onAddAlarm={() => {
                appAnalytics.trackFeatureUsage('add_alarm', 'button_clicked');
                setShowAlarmForm(true);
              }}
              onQuickSetup={handleQuickSetup}
            />
          </ErrorBoundary>
        );
      case 'alarms':
        appAnalytics.trackPageView('alarms', {
          totalAlarms: appState.alarms.length
        });
        return (
          <ErrorBoundary context="AlarmList">
            <AlarmList
              alarms={appState.alarms}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={(alarm) => {
                appAnalytics.trackFeatureUsage('edit_alarm', 'button_clicked', {
                  alarmId: alarm.id,
                  alarmLabel: alarm.label
                });
                setEditingAlarm(alarm);
                setShowAlarmForm(true);
              }}
              onDeleteAlarm={handleDeleteAlarm}
            />
          </ErrorBoundary>
        );
      case 'settings':
        appAnalytics.trackPageView('settings');
        return (
          <ErrorBoundary context="SettingsPage">
            <SettingsPage 
              appState={appState}
              setAppState={setAppState}
              onUpdateProfile={auth.updateUserProfile}
              onSignOut={auth.signOut}
              isLoading={auth.isLoading}
              error={auth.error}
            />
          </ErrorBoundary>
        );
      case 'performance':
        appAnalytics.trackPageView('performance');
        appAnalytics.trackFeatureUsage('performance_dashboard', 'accessed');
        return (
          <ErrorBoundary context="PerformanceDashboard">
            <PerformanceDashboard />
          </ErrorBoundary>
        );
      case 'rewards':
        appAnalytics.trackPageView('rewards', {
          level: appState.rewardSystem?.level,
          currentStreak: appState.rewardSystem?.currentStreak,
          totalRewards: appState.rewardSystem?.unlockedRewards.length
        });
        appAnalytics.trackFeatureUsage('rewards_dashboard', 'accessed');
        return (
          <ErrorBoundary context="RewardsDashboard">
            {appState.rewardSystem ? (
              <RewardsDashboard
                rewardSystem={appState.rewardSystem}
                onRefreshRewards={() => refreshRewardsSystem()}
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center text-gray-700 dark:text-gray-300">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <p>Loading your rewards...</p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        );
      case 'community':
        appAnalytics.trackPageView('community');
        appAnalytics.trackFeatureUsage('community_hub', 'accessed');
        return (
          <ErrorBoundary context="CommunityHub">
            <CommunityHub
              user={auth.user as User}
              battles={appState.activeBattles || []}
              friends={appState.friends || []}
              achievements={appState.achievements || []}
              tournaments={appState.tournaments || []}
              teams={appState.teams || []}
              currentSeason={appState.currentSeason}
              onBattleCreate={(battle) => {
                // Add battle to state
                setAppState(prev => ({
                  ...prev,
                  activeBattles: [...(prev.activeBattles || []), battle]
                }));
              }}
              onJoinBattle={(battleId) => {
                // Handle battle join logic
                appAnalytics.trackFeatureUsage('battle_join', 'joined', { battleId });
              }}
            />
          </ErrorBoundary>
        );
      case 'battles':
        appAnalytics.trackPageView('battles');
        appAnalytics.trackFeatureUsage('battle_system', 'accessed');
        return (
          <ErrorBoundary context="BattleSystem">
            <BattleSystem
              user={auth.user as User}
              battles={appState.activeBattles || []}
              onBattleCreate={(battle) => {
                setAppState(prev => ({
                  ...prev,
                  activeBattles: [...(prev.activeBattles || []), battle]
                }));
                appAnalytics.trackFeatureUsage('battle_creation', 'created', {
                  battleType: battle.type
                });
              }}
              onJoinBattle={(battleId) => {
                appAnalytics.trackFeatureUsage('battle_participation', 'joined', { battleId });
              }}
            />
          </ErrorBoundary>
        );
      case 'accessibility':
        appAnalytics.trackPageView('accessibility');
        appAnalytics.trackFeatureUsage('accessibility_dashboard', 'accessed');
        return (
          <ErrorBoundary context="AccessibilityDashboard">
            <AccessibilityDashboard />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenReaderProvider enabled={true} verbosity="medium">
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                🚀 Relife Alarms
              </h1>
              {auth.user && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {auth.user.name || auth.user.email}
                  </span>
                  {auth.user.level && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">
                      Level {auth.user.level}
                    </span>
                  )}
                </div>
              )}
            </div>
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
              <button
                onClick={auth.signOut}
                className="p-2 rounded-full text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
                aria-label="Sign out"
                aria-describedby="sign-out-desc"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span id="sign-out-desc" className="sr-only">Sign out of your account</span>
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
        <div className="grid grid-cols-7 px-2 py-2" role="tablist" aria-label="App sections">
          <button
            onClick={() => {
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'dashboard_clicked');
              setAppState(prev => ({ ...prev, currentView: 'dashboard' }));
              AccessibilityUtils.announcePageChange('Dashboard');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'dashboard'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
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
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'alarms_clicked', {
                totalAlarms: appState.alarms.length
              });
              setAppState(prev => ({ ...prev, currentView: 'alarms' }));
              AccessibilityUtils.announcePageChange('Alarms');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'alarms'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
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
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'rewards_clicked', {
                currentLevel: appState.rewardSystem?.level,
                hasRewards: !!appState.rewardSystem?.unlockedRewards.length
              });
              setAppState(prev => ({ ...prev, currentView: 'rewards' }));
              AccessibilityUtils.announcePageChange('Rewards');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'rewards'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
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
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'settings_clicked');
              setAppState(prev => ({ ...prev, currentView: 'settings' }));
              AccessibilityUtils.announcePageChange('Settings');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'settings'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
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
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'community_clicked');
              setAppState(prev => ({ ...prev, currentView: 'community' }));
              AccessibilityUtils.announcePageChange('Community');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'community'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'community'}
            aria-current={appState.currentView === 'community' ? 'page' : undefined}
            aria-label="Community - Battle friends and compete"
            aria-controls="main-content"
          >
            <Users className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Community</span>
          </button>
          
          <button
            onClick={() => {
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'battles_clicked');
              setAppState(prev => ({ ...prev, currentView: 'battles' }));
              AccessibilityUtils.announcePageChange('Battles');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'battles'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'battles'}
            aria-current={appState.currentView === 'battles' ? 'page' : undefined}
            aria-label="Battles - Gaming challenges and tournaments"
            aria-controls="main-content"
          >
            <Sword className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Battles</span>
          </button>
          
          <button
            onClick={() => {
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'performance_clicked');
              setAppState(prev => ({ ...prev, currentView: 'performance' }));
              AccessibilityUtils.announcePageChange('Performance');
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
          
          <button
            onClick={() => {
              const appAnalytics = AppAnalyticsService.getInstance();
              appAnalytics.trackFeatureUsage('navigation', 'accessibility_clicked');
              setAppState(prev => ({ ...prev, currentView: 'accessibility' }));
              AccessibilityUtils.announcePageChange('Accessibility');
            }}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              appState.currentView === 'accessibility'
                ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
            }`}
            role="tab"
            aria-selected={appState.currentView === 'accessibility'}
            aria-current={appState.currentView === 'accessibility' ? 'page' : undefined}
            aria-label="Accessibility - Configure accessibility settings"
            aria-controls="main-content"
          >
            <Accessibility className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">A11y</span>
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
    </ScreenReaderProvider>
  );
}

export default App;