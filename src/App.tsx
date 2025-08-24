/// <reference lib="dom" />
import React from 'react'; // auto: added missing React import
import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Clock,
  Settings,
  Bell,
  Brain,
  Gamepad2,
  LogOut,
  Crown,
} from 'lucide-react';
import type { Alarm, AppState, VoiceMood, User, Battle, DayOfWeek } from './types';
import { INITIAL_APP_STATE } from './constants/initialState';

// i18n imports
import { LanguageProvider } from './contexts/LanguageContext';
import { useI18n } from './hooks/useI18n';
import { useTheme } from './hooks/useTheme';

import AlarmList from './components/AlarmList';
import AlarmForm from './components/AlarmForm';
import AlarmRinging from './components/AlarmRinging';
import Dashboard from './components/Dashboard';
import OnboardingFlow from './components/OnboardingFlow';
import AuthenticationFlow from './components/AuthenticationFlow';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
// Enhanced consolidated components
import GamingHub from './components/GamingHub';
import EnhancedSettings from './components/EnhancedSettings';
import PricingPage from './components/PricingPage';
import { ScreenReaderProvider } from './components/ScreenReaderProvider';
import TabProtectionWarning from './components/TabProtectionWarning';
import { ThemeProvider } from './hooks/useTheme';
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
import { PerformanceMonitor } from './services/performance-monitor';
import AppAnalyticsService from './services/app-analytics';
import AIRewardsService from './services/ai-rewards';
import { SupabaseService } from './services/supabase';
import { PushNotificationService } from './services/push-notifications';
import useAuth from './hooks/useAuth';
import { useScreenReaderAnnouncements } from './hooks/useScreenReaderAnnouncements';
import {
  useAnalytics,
  useEngagementAnalytics,
  usePageTracking,
  ANALYTICS_EVENTS,
} from './hooks/useAnalytics';
import { useEmotionalNotifications } from './hooks/useEmotionalNotifications';
import { useTabProtectionAnnouncements } from './hooks/useTabProtectionAnnouncements';
import useTabProtectionSettings from './hooks/useTabProtectionSettings';
import { formatProtectionMessage, formatTimeframe } from './types/tabProtection';
import ServiceWorkerStatus from './components/ServiceWorkerStatus';
import { useEnhancedServiceWorker } from './hooks/useEnhancedServiceWorker';
import { useAdvancedAlarms } from './hooks/useAdvancedAlarms';
import AdvancedSchedulingDashboard from './components/AdvancedSchedulingDashboard';
import { useUISound } from './hooks/useSoundEffects';
import './App.css';

// Email Campaign Integration
import { PersonaType, PersonaDetectionResult } from './types';
class EmailCampaignService {
  private static instance: EmailCampaignService;
  private isInitialized = false;

  static getInstance() {
    if (!this.instance) {
      this.instance = new EmailCampaignService();
    }
    return this.instance;
  }

  async initialize() {
    this.isInitialized = true;
    console.log('Email campaign service initialized');
  }

  async detectPersona(user: any): Promise<PersonaDetectionResult> {
    let persona: PersonaType = 'struggling_sam';
    const tier = user?.subscriptionTier || user?.subscription?.tier || 'free';

    switch (tier) {
      case 'free':
        persona = 'struggling_sam';
        break;
      case 'basic':
        persona = 'busy_ben';
        break;
      case 'premium':
        persona = 'professional_paula';
        break;
      case 'pro':
        persona = 'enterprise_emma';
        break;
      case 'student':
        persona = 'student_sarah';
        break;
    }

    if (user?.email?.includes('.edu')) {
      persona = 'student_sarah';
    }

    return {
      persona,
      confidence: 0.8,
      factors: [
        { factor: 'subscription_tier', weight: 0.8, value: tier, influence: 0.8 },
      ],
      updatedAt: new Date(),
    };
  }

  async addUserToCampaign(user: any, persona: PersonaType) {
    console.log(`Adding user ${user.email} to ${persona} campaign`);
    // Integration with email platform would go here
    return true;
  }
}

// Inner App component that uses i18n hooks
function AppContent() {
  const {
    t,
    getNavigationLabels,
    getActionLabels: _getActionLabels,
    getA11yLabels,
    isRTL: _isRTL,
    getDirectionStyles: _getDirectionStyles,
    formatAlarmTime: _formatAlarmTime,
  } = useI18n();
  const auth = useAuth();
  const {
    getCSSVariables: _getCSSVariables,
    getThemeClasses: _getThemeClasses,
    applyThemeWithPerformance,
    preloadTheme,
  } = useTheme();
  const { announce } = useScreenReaderAnnouncements({
    announceNavigation: true,
    announceStateChanges: true,
  });

  // Analytics integration
  const {
    identify,
    track,
    trackPageView: _trackPageView,
    setUserProperties: _setUserProperties,
    reset,
  } = useAnalytics();
  const {
    trackSessionActivity,
    trackDailyActive,
    trackFeatureDiscovery: _trackFeatureDiscovery,
  } = useEngagementAnalytics();
  usePageTracking('main-app');

  // Advanced Alarms Hook
  const {
    alarms: advancedAlarms,
    loading: _advancedAlarmsLoading,
    error: _advancedAlarmsError,
  } = useAdvancedAlarms();

  // Enhanced Service Worker Hook for alarm reliability
  const {
    state: serviceWorkerState,
    updateAlarms: updateServiceWorkerAlarms,
    performHealthCheck: _performHealthCheck,
  } = useEnhancedServiceWorker();

  // Apply theme with performance optimizations
  useEffect(() => {
    // Use performance-optimized theme application
    applyThemeWithPerformance({
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      duration: 250,
      immediate: false,
    });
  }, [applyThemeWithPerformance]);

  // Preload common themes for better performance
  useEffect(() => {
    // Preload opposite theme for quick switching
    const currentTheme = document.documentElement.classList.contains('theme-dark')
      ? 'dark'
      : 'light';
    const oppositeTheme = currentTheme === 'dark' ? 'light' : 'dark';
    preloadTheme(oppositeTheme);
  }, [preloadTheme]);

  // Sound Effects Hook for UI feedback
  const {
    playClick: _playClick,
    playSuccess,
    playError: _playError,
    createClickHandler,
    createSuccessHandler,
    createErrorHandler,
  } = useUISound();

  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);

  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [accessibilityInitialized, setAccessibilityInitialized] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [_syncStatus, setSyncStatus] = useState<
    'synced' | 'syncing' | 'error' | 'pending' | 'offline'
  >('synced');
  const [_showPWAInstall, setShowPWAInstall] = useState(false);
  const [_tabProtectionEnabled, setTabProtectionEnabled] = useState(() => {
    // Get from localStorage or default to true
    const stored = localStorage.getItem('tabProtectionEnabled');
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Sync alarms with enhanced service worker when they change
  useEffect(() => {
    if (serviceWorkerState.isInitialized && appState.alarms) {
      console.log(
        `App: Syncing ${appState.alarms.length} alarms with enhanced service worker`
      );
      updateServiceWorkerAlarms(appState.alarms);
    }
  }, [appState.alarms, serviceWorkerState.isInitialized, updateServiceWorkerAlarms]);

  // Emotional Intelligence Notifications Hook
  const [_emotionalState, emotionalActions] = useEmotionalNotifications({
    userId: auth.user?.id || '',
    enabled: !!auth.user && appState.permissions.notifications.granted,
  });

  // Tab Protection Announcements Hook
  const tabProtectionSettings = useTabProtectionSettings();
  const { announceProtectionWarning } = useTabProtectionAnnouncements({
    activeAlarm: appState.activeAlarm,
    enabledAlarms: appState.alarms.filter((alarm: any) => alarm.enabled), // auto: implicit any
    settings: tabProtectionSettings.settings,
  });

  // PWA Installation handlers
  const handlePWAInstall = () => {
    setShowPWAInstall(false);
    // PWA install logic would be handled by the PWAInstallPrompt component
  };

  const handlePWADismiss = () => {
    setShowPWAInstall(false);
  };

  const refreshRewardsSystem = useCallback(
    async (alarms: Alarm[] = appState.alarms) => {
      try {
        const aiRewards = AIRewardsService.getInstance();
        const rewardSystem = await aiRewards.analyzeAndGenerateRewards(alarms);

        setAppState((prev: any) => ({ // auto: implicit any
          
          ...prev,
          rewardSystem,
        }));

        // Track rewards analysis
        const appAnalytics = AppAnalyticsService.getInstance();
        appAnalytics.trackFeatureUsage('rewards_analysis', 'system_updated', {
          totalRewards: rewardSystem.unlockedRewards.length,
          level: rewardSystem.level,
          currentStreak: rewardSystem.currentStreak,
        });
      } catch (error) {
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to refresh rewards system',
          { context: 'rewards_refresh' }
        );
      }
    },
    [appState.alarms, setAppState]
  );

  const loadUserAlarms = useCallback(async () => {
    if (!auth.user) return;

    try {
      // Load alarms from offline storage first (faster)
      const offlineAlarms = await OfflineStorage.getAlarms();
      if (offlineAlarms.length > 0) {
        setAppState((prev: any) => ({ // auto: implicit any
          
          ...prev,
          alarms: offlineAlarms,
          isOnboarding: offlineAlarms.length === 0,
        }));
      }

      // Try to load from remote service if online
      if (navigator.onLine) {
        try {
          const { alarms: savedAlarms } = await SupabaseService.loadUserAlarms(
            auth.user.id
          );
          setAppState((prev: any) => ({ // auto: implicit any
          
            ...prev,
            alarms: savedAlarms,
            isOnboarding: savedAlarms.length === 0,
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
          ErrorHandler.handleError(
            error instanceof Error ? error : new Error(String(error)),
            'Remote alarm loading failed, using offline alarms',
            { context: 'load_remote_alarms', metadata: { userId: auth.user.id } }
          );
          setSyncStatus('error');

          // Initialize rewards system with offline alarms
          await refreshRewardsSystem(offlineAlarms);
        }
      } else {
        setAppState((prev: any) => ({ // auto: implicit any
          
          ...prev,
          alarms: offlineAlarms,
          isOnboarding: offlineAlarms.length === 0,
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
  }, [auth.user, setSyncStatus, refreshRewardsSystem]);

  // Handle alarm snooze functionality
  const handleAlarmSnooze = useCallback(
    async (alarmId: string) => {
      const analytics = AppAnalyticsService.getInstance();
      const startTime = performance.now();

      try {
        analytics.trackAlarmAction('snooze', alarmId);

        if (isOnline) {
          await AlarmService.snoozeAlarm(alarmId);
        }

        const duration = performance.now() - startTime;
        analytics.trackAlarmAction('snooze', alarmId, { success: true, duration });
        analytics.trackFeatureUsage('alarm_snooze', 'completed', { duration });

        setAppState((prev: any) => ({ // auto: implicit any
           ...prev, activeAlarm: null, currentView: 'dashboard' }));
      } catch (error) {
        const duration = performance.now() - startTime;
        analytics.trackAlarmAction('snooze', alarmId, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
        analytics.trackError(
          error instanceof Error ? error : new Error(String(error)),
          {
            action: 'snooze_alarm',
          }
        );

        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to snooze alarm',
          {
            context: 'snooze_alarm',
            metadata: { alarmId, isOnline },
          }
        );
        // Fallback: still hide the alarm even if snooze fails
        setAppState((prev: any) => ({ // auto: implicit any
           ...prev, activeAlarm: null, currentView: 'dashboard' }));
      }
    },
    [isOnline, setAppState]
  );

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback(
    (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'ALARM_TRIGGERED':
          if (data.alarm) {
            setAppState((prev: any) => ({ ...prev, activeAlarm: data.alarm })); // auto: implicit any
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
          ErrorHandler.handleError(
            new Error(data.error || 'Sync failed'),
            'Background sync failed'
          );
          break;
        case 'NETWORK_STATUS':
          setIsOnline(data.isOnline);
          break;
        case 'EMOTIONAL_NOTIFICATION_ACTION':
          // Handle emotional notification actions from service worker
          if (data.action && data.emotion_type) {
            emotionalActions.trackResponse(data.notification_id || 'unknown', {
              messageId: data.notification_id || 'unknown',
              emotion: data.emotion_type,
              tone: data.tone || 'encouraging',
              actionTaken:
                data.action === 'dismiss'
                  ? 'dismissed'
                  : data.action === 'snooze'
                    ? 'snoozed'
                    : 'none',
              notificationOpened: true,
              timeToResponse: Date.now() - (data.timestamp || Date.now()),
            });

            // Handle specific actions
            if (data.action === 'dismiss' && appState.activeAlarm) {
              setAppState((prev: any) => ({ ...prev, activeAlarm: null })); // auto: implicit any
            } else if (data.action === 'snooze' && appState.activeAlarm) {
              // Trigger snooze functionality
              handleAlarmSnooze(appState.activeAlarm.id);
            }

            console.log('🧠 Emotional notification action handled:', data.action);
          }
          break;
        default:
          ErrorHandler.handleError(
            new Error(`Unknown service worker message type: ${type}`),
            'Received unknown service worker message',
            { context: 'service_worker_message', metadata: { type, data } }
          );
      }
    },
    [
      setAppState,
      setSyncStatus,
      setIsOnline,
      emotionalActions,
      appState,
      handleAlarmSnooze,
    ]
  );

  // Handle alarm triggers from service worker
  const handleServiceWorkerAlarmTrigger = useCallback(
    (alarm: Alarm) => {
      console.log('App: Handling service worker alarm trigger:', alarm.id);

      // Update app state to show alarm as triggered
      setAppState((prev: any) => ({ // auto: implicit any
          
        ...prev,
        activeAlarm: alarm,
        alarmTriggeredAt: new Date(),
      }));

      // Navigate to alarm screen if needed
      // This would integrate with your existing alarm handling logic
    },
    [setAppState]
  );

  const registerEnhancedServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        console.log('App: Registering enhanced service worker...');
        const registration = await navigator.serviceWorker.register('/sw-enhanced.js');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('App: Service worker updated');
                // Optionally show update notification to user
              }
            });
          }
        });

        // Enhanced service worker registered successfully
        console.log('App: Enhanced service worker registered');

        // Request notification permissions first
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            console.log('App: Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('App: Notification permission:', permission);

            if (permission === 'granted') {
              // Notify service worker about permission
              navigator.serviceWorker.ready.then(reg => {
                reg.active?.postMessage({
                  type: 'REQUEST_NOTIFICATION_PERMISSION',
                });
              });
            }
          } catch (permissionError) {
            console.warn(
              'App: Could not request notification permission:',
              permissionError
            );
          }
        }

        // Wait for service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready;

        // Send alarms to service worker
        if (readyRegistration.active && appState.alarms.length > 0) {
          console.log(
            `App: Sending ${appState.alarms.length} alarms to service worker`
          );

          // Use MessageChannel for reliable communication
          const messageChannel = new MessageChannel();

          messageChannel.port1.onmessage = (event: MessageEvent) => {
            const { success, message, error } = event.data;
            if (success) {
              console.log('App: Service worker response:', message);
            } else {
              console.error('App: Service worker error:', error);
            }
          };

          readyRegistration.active.postMessage(
            {
              type: 'UPDATE_ALARMS',
              data: { alarms: appState.alarms },
            },
            [messageChannel.port2]
          );
        }

        // Set up service worker message listener
        navigator.serviceWorker.addEventListener('message', event => {
          const { type, data } = event.data;

          switch (type) {
            case 'ALARM_TRIGGERED':
              console.log('App: Alarm triggered by service worker:', data.alarm.id);
              // Handle alarm trigger from service worker
              handleServiceWorkerAlarmTrigger(data.alarm);
              break;

            case 'ALARM_SCHEDULED':
              console.log('App: Alarm scheduled by service worker:', data.alarmId);
              break;

            case 'ALARM_CANCELLED':
              console.log('App: Alarm cancelled by service worker:', data.alarmId);
              break;

            case 'NETWORK_STATUS':
              console.log('App: Network status change:', data.isOnline);
              // Update app state based on network status
              break;

            case 'COMPLETE_SYNC_FINISHED':
              console.log('App: Service worker sync completed');
              // Refresh app data if needed
              break;

            default:
              console.log('App: Unknown service worker message:', type);
          }
        });

        // Set up visibility change handling for alarm reliability
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            // Ensure alarms are properly scheduled in service worker when tab becomes hidden
            console.log('App: Tab hidden, ensuring background alarm scheduling...');
            if (readyRegistration.active) {
              readyRegistration.active.postMessage({
                type: 'SYNC_ALARM_STATE',
              });
            }
          } else if (document.visibilityState === 'visible') {
            // Perform health check when tab becomes visible again
            console.log('App: Tab visible, performing alarm health check...');
            if (readyRegistration.active) {
              readyRegistration.active.postMessage({
                type: 'HEALTH_CHECK',
              });
            }
          }
        });

        // Set up beforeunload event for tab close protection
        window.addEventListener('beforeunload', _event => {
          // This will be handled by the tab protection system
          // but we also notify the service worker
          if (readyRegistration.active) {
            readyRegistration.active.postMessage({
              type: 'TAB_CLOSING',
            });
          }
        });
      } catch (error) {
        console.error('App: Service worker registration failed:', error);
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Enhanced service worker registration failed',
          { context: 'service_worker_registration' }
        );
      }
    } else {
      console.warn('App: Service workers not supported in this browser');
    }
  }, [appState.alarms, handleServiceWorkerAlarmTrigger]);

  const syncOfflineChanges = useCallback(async () => {
    if (!auth.user) return;

    try {
      const pendingChanges = await OfflineStorage.getPendingChanges();

      if (pendingChanges.length > 0) {
        // Syncing offline changes silently

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
              case 'delete': {
                const deleteResult = await SupabaseService.deleteAlarm(change.id);
                if (deleteResult.error) {
                  throw new Error(deleteResult.error);
                }
                break;
              }
            }
          } catch (error) {
            ErrorHandler.handleError(
              error instanceof Error ? error : new Error(String(error)),
              'Failed to sync offline change',
              {
                context: 'sync_offline_change',
                metadata: { changeId: change.id, changeType: change.type },
              }
            );
          }
        }

        // Clear pending changes after successful sync
        await OfflineStorage.clearPendingChanges();
        setSyncStatus('synced');

        // Reload alarms from server to ensure consistency
        const { alarms: updatedAlarms } = await SupabaseService.loadUserAlarms(
          auth.user.id
        );
        setAppState((prev: any) => ({ // auto: implicit any
           ...prev, alarms: updatedAlarms }));
        await OfflineStorage.saveAlarms(updatedAlarms);
      }
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to sync offline changes'
      );
      setSyncStatus('error');
    }
  }, [auth.user, setSyncStatus]);

  // Refresh rewards system based on current alarms and analytics
  // Handle quick alarm setup with preset configurations
  const handleQuickSetup = async (presetType: 'morning' | 'work' | 'custom') => {
    const presets = {
      morning: {
        time: '07:00',
        label: 'Morning Routine',
        days: [1, 2, 3, 4, 5], // Monday to Friday
        voiceMood: 'motivational' as VoiceMood,
      },
      work: {
        time: '06:30',
        label: 'Work Day',
        days: [1, 2, 3, 4, 5], // Monday to Friday
        voiceMood: 'drill-sergeant' as VoiceMood,
      },
      custom: {
        time: '07:00',
        label: 'Wake Up',
        days: [1, 2, 3, 4, 5, 6, 7], // Every day
        voiceMood: 'gentle' as VoiceMood,
      },
    };

    const presetConfig = presets[presetType];
    if (presetConfig) {
      await handleAddAlarm(presetConfig);

      // Track the quick setup usage
      const appAnalytics = AppAnalyticsService.getInstance();
      appAnalytics.trackFeatureUsage('quick_alarm_setup', 'preset_used', {
        presetType,
      });
    }
  };

  // Initialize all accessibility services
  const initializeAccessibilityServices = async () => {
    try {
      const screenReaderService = ScreenReaderService.getInstance();
      const _keyboardService = KeyboardNavigationService.getInstance();
      const voiceService = VoiceAccessibilityService.getInstance();
      const _mobileService = MobileAccessibilityService.getInstance();
      const _focusService = EnhancedFocusService.getInstance();

      // Services are automatically initialized when getInstance() is called
      // Just verify they're properly instantiated

      // Announce app initialization
      screenReaderService.announce(
        'Smart Alarm app loaded with full accessibility support',
        'polite'
      );

      setAccessibilityInitialized(true);

      // Track accessibility initialization
      const appAnalytics = AppAnalyticsService.getInstance();
      appAnalytics.trackFeatureUsage('accessibility', 'services_initialized', {
        screenReader: screenReaderService.getState().isEnabled,
        keyboard: true,
        voice: voiceService.getState?.().isEnabled ?? false,
        mobile: true,
        focus: true,
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

  // Update app state when auth state changes
  useEffect(() => {
    const appAnalytics = AppAnalyticsService.getInstance();
    const emailService = EmailCampaignService.getInstance();

    setAppState((prev: any) => ({ // auto: implicit any
          
      ...prev,
      user: auth.user,
    }));

    // Set analytics user context when user signs in/out
    if (auth.user) {
      // Use both analytics services for comprehensive tracking
      appAnalytics.setUserContext(auth.user.id, {
        email: auth.user.email,
        signInMethod: 'supabase',
      });

      // New analytics hook for user identification
      identify(auth.user.id, {
        id: auth.user.id,
        email: auth.user.email,
        createdAt:
          auth.user.createdAt instanceof Date
            ? auth.user.createdAt.toISOString()
            : auth.user.createdAt,
        deviceType: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      });

      // Track sign-in event
      track(ANALYTICS_EVENTS.USER_SIGNED_IN, {
        timestamp: new Date().toISOString(),
        metadata: {
          method: 'supabase',
        },
      });

      // Track daily active user
      trackDailyActive();

      // Email Campaign Integration: Detect persona and add to campaign
      (async () => {
        try {
          await emailService.initialize();
          const personaResult = await emailService.detectPersona(auth.user);
          console.log(
            `Detected persona: ${personaResult.persona} (confidence: ${personaResult.confidence})`
          );

          // Add user to appropriate email campaign
          await emailService.addUserToCampaign(auth.user, personaResult.persona);

          // Track persona detection for analytics
          track('PERSONA_DETECTED', {
            persona: personaResult.persona,
            confidence: personaResult.confidence,
            factors: personaResult.factors.map(f => f.factor),
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Email campaign integration error:', error);
        }
      })();
    } else {
      // Clear user context when user signs out
      appAnalytics.clearUserContext();
      reset();

      // Track sign-out event
      track(ANALYTICS_EVENTS.USER_SIGNED_OUT, {
        timestamp: new Date().toISOString(),
      });
    }
  }, [auth.user, identify, track, reset, trackDailyActive]);

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
  }, [syncOfflineChanges]);

  // Service worker message handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );
      };
    }
  }, [handleServiceWorkerMessage]);

  // Handle emotional notification events from service worker
  useEffect(() => {
    const handleEmotionalAction = (event: CustomEvent) => {
      const { action, emotion_type, notification_id, data: actionData } = event.detail;

      // Track the action in analytics
      emotionalActions.trackResponse(notification_id || 'unknown', {
        messageId: notification_id || 'unknown',
        emotion: emotion_type,
        tone: actionData?.tone || 'encouraging',
        actionTaken:
          action === 'dismiss' ? 'dismissed' : action === 'snooze' ? 'snoozed' : 'none',
        notificationOpened: true,
        timeToResponse: Date.now() - (actionData?.timestamp || Date.now()),
      });

      console.log('🧠 Emotional notification action received:', action, emotion_type);
    };

    const handleServiceWorkerUpdate = (_event: CustomEvent) => {
      console.log('🔄 Service Worker update available');
      // Could show a toast notification or update indicator
    };

    const handleServiceWorkerInstall = () => {
      console.log('✅ Service Worker installed successfully');
    };

    // Add event listeners
    window.addEventListener(
      'emotional-notification-action',
      handleEmotionalAction as EventListener
    );
    window.addEventListener(
      'sw-update-available',
      handleServiceWorkerUpdate as EventListener
    );
    window.addEventListener('sw-install-complete', handleServiceWorkerInstall);

    return () => {
      window.removeEventListener(
        'emotional-notification-action',
        handleEmotionalAction as EventListener
      );
      window.removeEventListener(
        'sw-update-available',
        handleServiceWorkerUpdate as EventListener
      );
      window.removeEventListener('sw-install-complete', handleServiceWorkerInstall);
    };
  }, [emotionalActions]);

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
          userAuthenticated: !!auth.user,
        });

        // Track session activity with enhanced analytics
        trackSessionActivity();

        // Track app installation/update if first time
        const isFirstTime = !localStorage.getItem('app_launched_before');
        if (isFirstTime) {
          track(ANALYTICS_EVENTS.APP_INSTALLED, {
            timestamp: new Date().toISOString(),
            metadata: {
              version: import.meta.env.VITE_APP_VERSION || '1.0.0',
              platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
            },
          });
          localStorage.setItem('app_launched_before', 'true');
        }

        // Initialize Capacitor
        await initializeCapacitor();

        // Initialize Push Notifications
        try {
          await PushNotificationService.initialize();
        } catch (error) {
          console.warn('Push notification initialization failed:', error);
        }

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
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to initialize app',
          {
            context: 'app_initialization',
          }
        );
        setIsInitialized(true);
      }
    };

    if (auth.isInitialized) {
      initialize();
    }
  }, [
    auth.isInitialized,
    auth.user,
    loadUserAlarms,
    registerEnhancedServiceWorker,
    track,
    trackSessionActivity,
  ]);

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
  }, [syncOfflineChanges]);

  // Service worker message handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );
      };
    }
  }, [handleServiceWorkerMessage]);

  // Prevent accidental tab closure when alarms are active
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only show protection if user has enabled it
      if (!tabProtectionSettings.settings.enabled) {
        return;
      }

      // Check if there's an active alarm (currently ringing)
      if (
        appState.activeAlarm &&
        tabProtectionSettings.settings.protectionTiming.activeAlarmWarning
      ) {
        // Announce the warning for accessibility
        announceProtectionWarning();

        const message = formatProtectionMessage(
          tabProtectionSettings.settings.customMessages.activeAlarmMessage,
          { alarmName: appState.activeAlarm.label }
        );
        event.preventDefault();
        event.returnValue = message; // Chrome requires returnValue to be set
        return message; // For other browsers
      }

      // Check if there are enabled alarms that could ring soon
      if (tabProtectionSettings.settings.protectionTiming.upcomingAlarmWarning) {
        const enabledAlarms = appState.alarms.filter((alarm: any) => a // auto: implicit anylarm.enabled);
        if (enabledAlarms.length > 0) {
          // Check if any alarm is within the configured threshold
          const now = new Date();
          const thresholdFromNow = new Date(
            now.getTime() +
              tabProtectionSettings.settings.protectionTiming.upcomingAlarmThreshold *
                60 *
                1000
          );

          const upcomingAlarms = enabledAlarms.filter((alarm: any) => { // auto: implicit any
            const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

            // Check if alarm is set for today
            if (!alarm.days.includes(today)) {
              return false;
            }

            // Parse alarm time
            const [hours, minutes] = alarm.time.split(':').map(Number);
            const alarmTime = new Date(now);
            alarmTime.setHours(hours, minutes, 0, 0);

            // If alarm time has passed today, check if it's for tomorrow
            if (alarmTime <= now) {
              alarmTime.setDate(alarmTime.getDate() + 1);
            }

            return alarmTime <= thresholdFromNow;
          });

          if (upcomingAlarms.length > 0) {
            // Announce the warning for accessibility
            announceProtectionWarning();

            const timeframe = formatTimeframe(
              tabProtectionSettings.settings.protectionTiming.upcomingAlarmThreshold
            );
            const message = formatProtectionMessage(
              tabProtectionSettings.settings.customMessages.upcomingAlarmMessage,
              { count: upcomingAlarms.length, timeframe }
            );
            event.preventDefault();
            event.returnValue = message;
            return message;
          }
        }
      }
    };

    // Add the event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    appState.activeAlarm,
    appState.alarms,
    announceProtectionWarning,
    tabProtectionSettings.settings,
  ]); // Re-run when activeAlarm, alarms, announcement function, or protection settings change

  // Listen for changes to tab protection setting from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('tabProtectionEnabled');
      const enabled = stored !== null ? JSON.parse(stored) : true;
      setTabProtectionEnabled(enabled);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAddAlarm = async (alarmData: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
    snoozeEnabled?: boolean;
    snoozeInterval?: number;
    maxSnoozes?: number;
  }) => {
    if (!auth.user) {
      ErrorHandler.handleError(
        new Error('User not authenticated'),
        'Cannot create alarm without authentication'
      );
      return;
    }

    const appAnalytics = AppAnalyticsService.getInstance();

    // Start performance tracking
    appAnalytics.startPerformanceMarker('alarm_creation');

    try {
      let newAlarm: Alarm;

      // Prepare alarm data with user ID

      if (isOnline) {
        // Online: save to server and local storage
        newAlarm = {
          id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: auth.user.id,
          enabled: true,
          isActive: true,
          dayNames: alarmData.days
            ? alarmData.days.map(
                d =>
                  [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                  ][d] as DayOfWeek
              )
            : [],
          sound: 'default',
          difficulty: 'medium',
          snoozeEnabled: true,
          snoozeInterval: 5,
          maxSnoozes: 3,
          snoozeCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...alarmData,
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
          isActive: true,
          dayNames: alarmData.days
            ? alarmData.days.map(
                d =>
                  [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                  ][d] as DayOfWeek
              )
            : [],
          sound: 'default',
          difficulty: 'medium',
          snoozeEnabled: true,
          snoozeInterval: 5,
          maxSnoozes: 3,
          snoozeCount: 0,
          lastTriggered: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...alarmData,
        };
        await OfflineStorage.saveAlarm(newAlarm);
      }

      const updatedAlarms = [...appState.alarms, newAlarm];
      setAppState((prev: any) => ({ // auto: implicit any
          
        ...prev,
        alarms: updatedAlarms,
      }));
      setShowAlarmForm(false);

      // Announce successful alarm creation
      AccessibilityUtils.createAriaAnnouncement(
        `Alarm created successfully for ${newAlarm.label} at ${newAlarm.time}`,
        'polite'
      );

      // Play success sound
      playSuccess();

      // Refresh rewards system with new alarms
      await refreshRewardsSystem(updatedAlarms);

      // Track comprehensive analytics
      appAnalytics.trackAlarmCreated(newAlarm, {
        isQuickSetup: false,
      });

      // Track performance
      const duration = appAnalytics.endPerformanceMarker('alarm_creation', {
        success: true,
        isOnline,
        totalAlarms: updatedAlarms.length,
      });

      appAnalytics.trackAlarmAction('create', newAlarm.id, { success: true, duration });

      // Update service worker
      updateServiceWorkerAlarms([...appState.alarms, newAlarm]);

      // Schedule push notification for new alarm
      try {
        await PushNotificationService.scheduleAlarmPush(newAlarm);
      } catch (error) {
        console.warn('Failed to schedule push notification for new alarm:', error);
      }
    } catch (error) {
      // Track error and performance
      const duration = appAnalytics.endPerformanceMarker('alarm_creation', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      appAnalytics.trackAlarmAction('create', 'unknown', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      appAnalytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        {
          action: 'create_alarm',
          alarmData,
        }
      );

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to create alarm',
        {
          context: 'create_alarm',
          metadata: { alarmData, isOnline },
        }
      );
    }
  };

  const handleEditAlarm = async (
    alarmId: string,
    alarmData: {
      time: string;
      label: string;
      days: number[];
      voiceMood: VoiceMood;
      snoozeEnabled?: boolean;
      snoozeInterval?: number;
      maxSnoozes?: number;
    }
  ) => {
    if (!auth.user) {
      ErrorHandler.handleError(
        new Error('User not authenticated'),
        'Cannot edit alarm without authentication'
      );
      return;
    }

    const analytics = AppAnalyticsService.getInstance();
    const startTime = performance.now();

    try {
      analytics.trackAlarmAction('edit', alarmId, { voiceMood: alarmData.voiceMood });
      const existingAlarm = appState.alarms.find((a: any) => a // auto: implicit any.id === alarmId);
      if (!existingAlarm) throw new Error('Alarm not found');

      const updatedAlarm: Alarm = {
        ...existingAlarm,
        ...alarmData,
        updatedAt: new Date(),
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

      const updatedAlarms = appState.alarms.map((alarm: any) => // auto: implicit any
        alarm.id === alarmId ? updatedAlarm : alarm
      );

      setAppState((prev: any) => ({ // auto: implicit any
          
        ...prev,
        alarms: updatedAlarms,
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
      analytics.trackAlarmAction('edit', updatedAlarm.id, { success: true, duration });
      analytics.trackFeatureUsage('alarm_editing', 'completed', {
        voiceMood: alarmData.voiceMood,
        duration,
      });

      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
    } catch (error) {
      const duration = performance.now() - startTime;
      analytics.trackAlarmAction('edit', editingAlarm?.id || 'unknown', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'edit_alarm',
      });

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to edit alarm',
        {
          context: 'edit_alarm',
          metadata: { alarmId, alarmData, isOnline },
        }
      );
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    if (!auth.user) {
      ErrorHandler.handleError(
        new Error('User not authenticated'),
        'Cannot delete alarm without authentication'
      );
      return;
    }

    const analytics = AppAnalyticsService.getInstance();
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

      const alarmToDelete = appState.alarms.find((a: any) => a // auto: implicit any.id === alarmId);
      const updatedAlarms = appState.alarms.filter((alarm: any) => a // auto: implicit anylarm.id !== alarmId);
      setAppState((prev: any) => ({ // auto: implicit any
          
        ...prev,
        alarms: updatedAlarms,
      }));

      // Announce successful alarm deletion
      if (alarmToDelete) {
        announce({
          type: 'alarm-delete',
          data: { alarm: alarmToDelete },
          priority: 'polite',
        });
      }

      // Refresh rewards system with updated alarms
      await refreshRewardsSystem(updatedAlarms);

      // Track performance and analytics
      const duration = performance.now() - startTime;
      analytics.trackAlarmAction('delete', alarmId, { success: true, duration });
      analytics.trackFeatureUsage('alarm_deletion', 'completed', { duration });

      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
    } catch (error) {
      const duration = performance.now() - startTime;
      analytics.trackAlarmAction('delete', alarmId, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'delete_alarm',
      });

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to delete alarm',
        {
          context: 'delete_alarm',
          metadata: { alarmId, isOnline },
        }
      );
    }
  };

  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    if (!auth.user) {
      ErrorHandler.handleError(
        new Error('User not authenticated'),
        'Cannot toggle alarm without authentication'
      );
      return;
    }

    const analytics = AppAnalyticsService.getInstance();
    const startTime = performance.now();

    try {
      analytics.trackAlarmAction('toggle', alarmId, { enabled });
      const existingAlarm = appState.alarms.find((a: any) => a // auto: implicit any.id === alarmId);
      if (!existingAlarm) throw new Error('Alarm not found');

      const updatedAlarm: Alarm = {
        ...existingAlarm,
        enabled,
        updatedAt: new Date(),
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

      const updatedAlarms = appState.alarms.map((alarm: any) => // auto: implicit any
        alarm.id === alarmId ? updatedAlarm : alarm
      );

      setAppState((prev: any) => ({ // auto: implicit any
          
        ...prev,
        alarms: updatedAlarms,
      }));

      // Announce alarm toggle state change
      announce({
        type: 'alarm-toggle',
        data: { alarm: updatedAlarm, enabled },
        priority: 'polite',
      });

      // Refresh rewards system with updated alarms
      await refreshRewardsSystem(updatedAlarms);

      // Track performance and analytics
      const duration = performance.now() - startTime;
      analytics.trackAlarmAction('toggle', alarmId, {
        success: true,
        enabled,
        duration,
      });
      analytics.trackFeatureUsage('alarm_toggle', 'completed', { enabled, duration });

      // Update service worker
      updateServiceWorkerAlarms(updatedAlarms);
    } catch (error) {
      const duration = performance.now() - startTime;
      analytics.trackAlarmAction('toggle', alarmId, {
        success: false,
        enabled,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'toggle_alarm',
      });

      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to toggle alarm',
        {
          context: 'toggle_alarm',
          metadata: { alarmId, enabled, isOnline },
        }
      );
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

    setAppState((prev: any) => ({ // auto: implicit any
           ...prev, isOnboarding: false }));
  };

  const handleAlarmDismiss = (
    alarmId: string,
    method: 'voice' | 'button' | 'shake' | 'challenge'
  ) => {
    const analytics = AppAnalyticsService.getInstance();
    const startTime = performance.now();

    const performDismiss = async () => {
      try {
        analytics.trackAlarmAction('dismiss', alarmId, { method });

        if (isOnline) {
          await AlarmService.dismissAlarm(alarmId, method);
        }

        const duration = performance.now() - startTime;
        analytics.trackAlarmAction('dismiss', alarmId, {
          success: true,
          method,
          duration,
        });
        analytics.trackFeatureUsage('alarm_dismissal', 'completed', {
          method,
          duration,
        });

        setAppState((prev: any) => ({ // auto: implicit any
           ...prev, activeAlarm: null, currentView: 'dashboard' }));
      } catch (error) {
        const duration = performance.now() - startTime;
        analytics.trackAlarmAction('dismiss', alarmId, {
          success: false,
          method,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
        analytics.trackError(
          error instanceof Error ? error : new Error(String(error)),
          { action: 'dismiss_alarm' }
        );

        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to dismiss alarm',
          {
            context: 'dismiss_alarm',
            metadata: { alarmId, method, isOnline },
          }
        );
        // Fallback: still dismiss the alarm even if logging fails
        setAppState((prev: any) => ({ // auto: implicit any
           ...prev, activeAlarm: null, currentView: 'dashboard' }));
      }
    };

    performDismiss();
  };

  // Show loading screen while auth is initializing
  if (!auth.isInitialized || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">{t('common:app.loading')}</h2>
          <p className="text-primary-200 mt-2">
            {!auth.isInitialized
              ? t('auth:loading.checkingAuth', {
                  defaultValue: 'Checking authentication...',
                })
              : !accessibilityInitialized
                ? t('common:accessibility.loading', {
                    defaultValue: 'Initializing accessibility services...',
                  })
                : t('common:status.loading', {
                    defaultValue: 'Initializing offline capabilities...',
                  })}
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
              <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                Authentication Error
              </h2>
              <p className="text-red-600 dark:text-red-300 mb-4">
                There was a problem with the authentication system. Please refresh the
                page or try again later.
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
          onAuthSuccess={() => {
            // Auth success is handled by the useAuth hook
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
      <ErrorBoundary
        context="AlarmRinging"
        fallback={
          <div className="min-h-screen bg-red-50 dark:bg-red-900/10 flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                Alarm Error
              </h2>
              <p className="text-red-600 dark:text-red-300 mb-4">
                There was a problem with the alarm. It has been dismissed.
              </p>
              <button
                onClick={() => setAppState((prev: any) => ({ // auto: implicit any
           ...prev, activeAlarm: null }))}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        }
      >
        <AlarmRinging
          alarm={appState.activeAlarm}
          user={auth.user!}
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
          activeAlarms: appState.alarms.filter((a: any) => a // auto: implicit any.enabled).length,
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
              onNavigateToAdvanced={() => {
                appAnalytics.trackFeatureUsage(
                  'navigation',
                  'advanced_scheduling_from_dashboard'
                );
                setAppState((prev: any) => ({ // auto: implicit any
           ...prev, currentView: 'advanced-scheduling' }));
              }}
            />
          </ErrorBoundary>
        );
      case 'alarms':
        appAnalytics.trackPageView('alarms', {
          totalAlarms: appState.alarms.length,
        });
        return (
          <ErrorBoundary context="AlarmList">
            <AlarmList
              alarms={appState.alarms}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={(alarm: any) => { // auto: implicit any
                appAnalytics.trackFeatureUsage('edit_alarm', 'button_clicked', {
                  alarmId: alarm.id,
                  alarmLabel: alarm.label,
                });
                setEditingAlarm(alarm);
                setShowAlarmForm(true);
              }}
              onDeleteAlarm={handleDeleteAlarm}
            />
          </ErrorBoundary>
        );
      case 'advanced-scheduling':
        appAnalytics.trackPageView('advanced_scheduling');
        appAnalytics.trackFeatureUsage('advanced_scheduling', 'accessed');
        return (
          <ErrorBoundary context="AdvancedScheduling">
            <AdvancedSchedulingDashboard alarms={advancedAlarms} />
          </ErrorBoundary>
        );
      case 'gaming':
        appAnalytics.trackPageView('gaming');
        appAnalytics.trackFeatureUsage('gaming_hub', 'accessed');
        return (
          <ErrorBoundary context="GamingHub">
            <GamingHub
              currentUser={auth.user as User}
              rewardSystem={appState.rewardSystem}
              activeBattles={appState.activeBattles || []}
              friends={appState.friends || []}
              onCreateBattle={(battle: any) => { // auto: implicit any
                // Add battle to state with complete Battle object
                const completeBattle: Battle = {
                  id: battle.id || Math.random().toString(36).substr(2, 9),
                  type: battle.type || 'speed',
                  participants: battle.participants || [],
                  creatorId: battle.creatorId || auth.user?.id || '',
                  status: battle.status || 'pending',
                  startTime: battle.startTime || new Date().toISOString(),
                  endTime:
                    battle.endTime ||
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  settings: battle.settings || {
                    duration: 'PT24H',
                    difficulty: 'medium',
                  },
                  createdAt: battle.createdAt || new Date().toISOString(),
                  ...battle,
                };
                setAppState((prev: any) => ({ // auto: implicit any
          
                  ...prev,
                  activeBattles: [...(prev.activeBattles || []), completeBattle],
                }));
                appAnalytics.trackFeatureUsage('battle_creation', 'created', {
                  battleType: completeBattle.type,
                });
              }}
              onJoinBattle={(battleId: any) => { // auto: implicit any
                appAnalytics.trackFeatureUsage('battle_participation', 'joined', {
                  battleId,
                });
              }}
              onSendTrashTalk={(battleId, message) => {
                appAnalytics.trackFeatureUsage('trash_talk', 'sent', {
                  battleId,
                  messageLength: message.length,
                });
              }}
              onRefreshRewards={() => refreshRewardsSystem()}
            />
          </ErrorBoundary>
        );
      case 'settings':
        appAnalytics.trackPageView('settings');
        return (
          <ErrorBoundary context="EnhancedSettings">
            <div className="p-4 space-y-6 max-w-4xl mx-auto">
              {/* Alarm Reliability Status Section */}
              <section aria-labelledby="alarm-reliability-heading">
                <h2
                  id="alarm-reliability-heading"
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-3"
                >
                  Alarm Reliability Status
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Monitor your background alarm system to ensure alarms fire reliably
                  even when switching tabs or closing the app.
                </p>
                <ServiceWorkerStatus />
              </section>

              {/* Divider */}
              <hr className="border-gray-200 dark:border-gray-600" />

              {/* App Settings Section */}
              <section aria-labelledby="app-settings-heading">
                <h2
                  id="app-settings-heading"
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-3"
                >
                  App Settings
                </h2>
                <EnhancedSettings
                  appState={appState}
                  setAppState={setAppState}
                  onUpdateProfile={auth.updateUserProfile}
                  onSignOut={auth.signOut}
                  isLoading={auth.isLoading}
                  error={auth.error}
                />
              </section>
            </div>
          </ErrorBoundary>
        );
      case 'pricing':
        appAnalytics.trackPageView('pricing');
        appAnalytics.trackFeatureUsage('pricing_page', 'accessed');
        return (
          <ErrorBoundary context="PricingPage">
            <PricingPage
              user={auth.user as User}
              onUpgrade={(plan: any) => { // auto: implicit any
                appAnalytics.trackFeatureUsage('subscription', 'upgraded', {
                  plan: plan.id,
                  price: plan.price,
                });
                // Show success message or redirect
              }}
              onManageSubscription={() => {
                appAnalytics.trackFeatureUsage('subscription', 'manage_clicked');
                // Handle subscription management
              }}
            />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider defaultTheme="light" enableSystem={true}>
      <ScreenReaderProvider enabled={true} verbosity="medium">
        <div
          className="min-h-screen flex flex-col safe-top safe-bottom"
          style={{
            backgroundColor: 'var(--theme-background)',
            color: 'var(--theme-text-primary)',
          }}
        >
          {/* Skip to main content */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium z-50"
          >
            {getA11yLabels().skipToContent}
          </a>

          {/* Header with Offline Indicator */}
          <header
            className="shadow-sm border-b"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
            role="banner"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1
                    className="text-xl font-bold"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    🚀 {t('common:app.name')}
                  </h1>
                  {auth.user && (
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm"
                        style={{ color: 'var(--theme-text-secondary)' }}
                      >
                        {auth.user.name || auth.user.email}
                      </span>
                      {auth.user.level && (
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: 'var(--theme-primary-100)',
                            color: 'var(--theme-primary-800)',
                          }}
                        >
                          Level {auth.user.level}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className="flex items-center gap-3"
                  role="group"
                  aria-label="Header actions"
                >
                  <OfflineIndicator />
                  {tabProtectionSettings.settings.enabled &&
                    tabProtectionSettings.settings.visualSettings.showVisualWarning && (
                      <TabProtectionWarning
                        activeAlarm={appState.activeAlarm}
                        enabledAlarms={appState.alarms.filter((alarm: any) => a // auto: implicit anylarm.enabled)}
                        settings={tabProtectionSettings.settings}
                      />
                    )}
                  <button
                    onClick={createClickHandler(() => setShowAlarmForm(true))}
                    className="alarm-button alarm-button-primary p-2 rounded-full"
                    aria-label="Add new alarm"
                    aria-describedby="add-alarm-desc"
                  >
                    <Plus className="w-5 h-5" aria-hidden="true" />
                    <span id="add-alarm-desc" className="sr-only">
                      Opens the new alarm creation form
                    </span>
                  </button>
                  <button
                    onClick={auth.signOut}
                    className="p-2 rounded-full text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
                    aria-label="Sign out"
                    aria-describedby="sign-out-desc"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span id="sign-out-desc" className="sr-only">
                      Sign out of your account
                    </span>
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
            className="border-t"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
            }}
            role="navigation"
            aria-label="Main navigation"
          >
            <div
              className="grid grid-cols-6 px-1 py-2"
              role="tablist"
              aria-label="App sections"
            >
              <button
                onClick={createClickHandler(() => {
                  const appAnalytics = AppAnalyticsService.getInstance();
                  appAnalytics.trackFeatureUsage('navigation', 'dashboard_clicked');
                  setAppState((prev: any) => ({ // auto: implicit any
           ...prev, currentView: 'dashboard' }));
                  AccessibilityUtils.announcePageChange('Dashboard');
                })}
                className="flex flex-col items-center py-2 rounded-lg transition-colors border-2"
                style={
                  appState.currentView === 'dashboard'
                    ? {
                        color: 'var(--theme-primary-800)',
                        backgroundColor: 'var(--theme-primary-100)',
                        borderColor: 'var(--theme-primary-300)',
                      }
                    : {
                        color: 'var(--theme-text-secondary)',
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                      }
                }
                onMouseEnter={(e: any) => { // auto: implicit any
                  if (appState.currentView !== 'dashboard') {
                    e.currentTarget.style.backgroundColor =
                      'var(--theme-surface-hover)';
                    e.currentTarget.style.color = 'var(--theme-text-primary)';
                  }
                }}
                onMouseLeave={(e: any) => { // auto: implicit any
                  if (appState.currentView !== 'dashboard') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--theme-text-secondary)';
                  }
                }}
                role="tab"
                aria-selected={appState.currentView === 'dashboard'}
                aria-current={appState.currentView === 'dashboard' ? 'page' : undefined}
                aria-label="Dashboard - Overview of your alarms"
                aria-controls="main-content"
              >
                <Clock className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {getNavigationLabels().dashboard}
                </span>
              </button>

              <button
                onClick={createClickHandler(() => {
                  const appAnalytics = AppAnalyticsService.getInstance();
                  appAnalytics.trackFeatureUsage('navigation', 'alarms_clicked', {
                    totalAlarms: appState.alarms.length,
                  });
                  setAppState((prev: any) => ({ // auto: implicit any
           ...prev, currentView: 'alarms' }));
                  AccessibilityUtils.announcePageChange('Alarms');
                })}
                className="flex flex-col items-center py-2 rounded-lg transition-colors border-2"
                style={
                  appState.currentView === 'alarms'
                    ? {
                        color: 'var(--theme-primary-800)',
                        backgroundColor: 'var(--theme-primary-100)',
                        borderColor: 'var(--theme-primary-300)',
                      }
                    : {
                        color: 'var(--theme-text-secondary)',
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                      }
                }
                onMouseEnter={(e: any) => { // auto: implicit any
                  if (appState.currentView !== 'alarms') {
                    e.currentTarget.style.backgroundColor =
                      'var(--theme-surface-hover)';
                    e.currentTarget.style.color = 'var(--theme-text-primary)';
                  }
                }}
                onMouseLeave={(e: any) => { // auto: implicit any
                  if (appState.currentView !== 'alarms') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--theme-text-secondary)';
                  }
                }}
                role="tab"
                aria-selected={appState.currentView === 'alarms'}
                aria-current={appState.currentView === 'alarms' ? 'page' : undefined}
                aria-label="Alarms - Manage your alarm list"
                aria-controls="main-content"
              >
                <Bell className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {getNavigationLabels().alarms}
                </span>
              </button>

              <button
                onClick={createClickHandler(() => {
                  const appAnalytics = AppAnalyticsService.getInstance();
                  appAnalytics.trackFeatureUsage(
                    'navigation',
                    'advanced_scheduling_clicked'
                  );
                  setAppState((prev: any) => ({ // auto: implicit any
          
                    ...prev,
                    currentView: 'advanced-scheduling',
                  }));
                  AccessibilityUtils.announcePageChange('Advanced Scheduling');
                })}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  appState.currentView === 'advanced-scheduling'
                    ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                    : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
                }`}
                role="tab"
                aria-selected={appState.currentView === 'advanced-scheduling'}
                aria-current={
                  appState.currentView === 'advanced-scheduling' ? 'page' : undefined
                }
                aria-label="Advanced Scheduling - Create smart alarms with AI optimization"
                aria-controls="main-content"
              >
                <Brain className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {getNavigationLabels().advanced}
                </span>
              </button>

              <button
                onClick={createClickHandler(() => {
                  const appAnalytics = AppAnalyticsService.getInstance();
                  appAnalytics.trackFeatureUsage('navigation', 'gaming_clicked', {
                    currentLevel: appState.rewardSystem?.level,
                    hasRewards: !!appState.rewardSystem?.unlockedRewards.length,
                    activeBattles: appState.activeBattles?.length,
                  });
                  setAppState((prev: any) => ({ // auto: implicit any
           ...prev, currentView: 'gaming' }));
                  AccessibilityUtils.announcePageChange('Gaming Hub');
                })}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  appState.currentView === 'gaming'
                    ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                    : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
                }`}
                role="tab"
                aria-selected={appState.currentView === 'gaming'}
                aria-current={appState.currentView === 'gaming' ? 'page' : undefined}
                aria-label="Gaming - Rewards, battles, and community challenges"
                aria-controls="main-content"
              >
                <Gamepad2 className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {getNavigationLabels().gaming}
                </span>
              </button>

              <button
                onClick={createClickHandler(() => {
                  const appAnalytics = AppAnalyticsService.getInstance();
                  appAnalytics.trackFeatureUsage('navigation', 'settings_clicked');
                  setAppState((prev: any) => ({ // auto: implicit any
           ...prev, currentView: 'settings' }));
                  AccessibilityUtils.announcePageChange('Settings');
                })}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  appState.currentView === 'settings'
                    ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                    : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
                }`}
                role="tab"
                aria-selected={appState.currentView === 'settings'}
                aria-current={appState.currentView === 'settings' ? 'page' : undefined}
                aria-label="Settings - App preferences, analytics, and accessibility"
                aria-controls="main-content"
              >
                <Settings className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {getNavigationLabels().settings}
                </span>
              </button>

              <button
                onClick={() => {
                  const appAnalytics = AppAnalyticsService.getInstance();
                  appAnalytics.trackFeatureUsage('navigation', 'pricing_clicked');
                  setAppState((prev: any) => ({ // auto: implicit any
           ...prev, currentView: 'pricing' }));
                  AccessibilityUtils.announcePageChange('Premium Plans');
                }}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  appState.currentView === 'pricing'
                    ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
                    : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
                }`}
                role="tab"
                aria-selected={appState.currentView === 'pricing'}
                aria-current={appState.currentView === 'pricing' ? 'page' : undefined}
                aria-label="Premium - Subscription plans and premium features"
                aria-controls="main-content"
              >
                <Crown className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {getNavigationLabels().premium}
                </span>
              </button>
            </div>
          </nav>

          {/* Alarm Form Modal */}
          {showAlarmForm && (
            <ErrorBoundary context="AlarmForm">
              <AlarmForm
                alarm={editingAlarm}
                onSave={
                  editingAlarm
                    ? data => handleEditAlarm(editingAlarm.id, data)
                    : handleAddAlarm
                }
                onCancel={() => {
                  setShowAlarmForm(false);
                  setEditingAlarm(null);
                }}
                userId={auth.user?.id || ''}
                user={auth.user!}
              />
            </ErrorBoundary>
          )}

          {/* PWA Install Prompt */}
          <PWAInstallPrompt onInstall={handlePWAInstall} onDismiss={handlePWADismiss} />
        </div>
      </ScreenReaderProvider>
    </ThemeProvider>
  );
}

// Main App component that provides the LanguageProvider
function App() {
  return (
    <LanguageProvider defaultLanguage="en" enableAutoDetect={true}>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
