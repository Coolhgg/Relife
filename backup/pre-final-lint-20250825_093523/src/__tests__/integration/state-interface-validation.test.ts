/**
 * Integration tests for domain-specific state interfaces
 * Tests validation of AlarmState, UserState, SubscriptionState, and AppState
 */

import {
  AlarmState,
  UserState,
  SubscriptionState,
  AppState,
  AlarmAction,
  UserAction,
  SubscriptionAction,
  AppAction,
  validateAlarmState,
  validateUserState,
  validateSubscriptionState,
  createAppSelectors,
  isAlarmState,
  isUserState,
  isSubscriptionState,
} from '../../types/app-state';

import type {
  Alarm,
  User,
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
  FeatureAccess,
  _FeatureUsage,
  _BillingUsage,
  VoiceMood,
} from '../../types';

// Mock data for testing
const mockAlarm: Alarm = {
  id: 'alarm-1',
  title: 'Morning Alarm',
  time: '07:00',
  enabled: true,
  days: [1, 2, 3, 4, 5],
  sound: 'default',
  volume: 0.8,
  snoozeEnabled: true,
  snoozeInterval: 5,
  maxSnoozes: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubscription: Subscription = {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'premium',
  status: 'active' as SubscriptionStatus,
  tier: 'premium' as SubscriptionTier,
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  autoRenew: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFeatureAccess: FeatureAccess = {
  userId: 'user-1',
  tier: 'premium' as SubscriptionTier,
  features: {
    'smart-scheduling': {
      hasAccess: true,
      usageCount: 10,
      usageLimit: 100,
      resetDate: new Date(),
    },
  },
  lastUpdated: new Date(),
};

const mockVoiceMood: VoiceMood = {
  id: 'voice-1',
  name: 'Gentle',
  tone: 'calm',
  pitch: 0.8,
  speed: 1.0,
  volume: 0.7,
};

describe('State Interface Validation', () => {
  describe('AlarmState Interface', () => {
    let mockAlarmState: AlarmState;

    beforeEach(() => {
      mockAlarmState = {
        alarms: [mockAlarm],
        activeAlarms: [mockAlarm],
        upcomingAlarms: [],
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
        lastUpdated: new Date(),
        currentlyTriggering: [],
        snoozing: {},
        dismissing: [],
        editing: {
          alarmId: null,
          isCreating: false,
          isDirty: false,
          draftAlarm: null,
          validationErrors: {},
        },
        schedulingConfigs: {},
        enabledOptimizations: [],
        locationTriggers: [],
        conditionalRules: [],
        voiceSettings: {
          defaultMood: mockVoiceMood,
          customMoods: [],
          voiceEnabled: true,
          volume: 0.8,
          speaking: false,
        },
        battleState: {
          activeBattles: {},
          battleResults: {},
          battleStats: null,
        },
        performance: {
          successRate: 85,
          averageDismissalTime: 30,
          snoozeFrequency: 1.2,
          weeklyPatterns: [],
          sleepQualityCorrelation: 0.7,
        },
        settings: {
          defaultSound: 'default',
          defaultVolume: 0.8,
          defaultSnoozeInterval: 5,
          maxSnoozes: 3,
          alarmToneTest: false,
          vibrationEnabled: true,
          locationServicesEnabled: false,
          weatherIntegrationEnabled: false,
          calendarIntegrationEnabled: false,
        },
        ui: {
          selectedAlarmId: null,
          showTestAlarm: false,
          showBattleSetup: false,
          showSchedulingConfig: false,
          expandedSections: new Set(),
          sortBy: 'time',
          filterBy: 'all',
        },
      };
    });

    it('should validate alarm state structure', () => {
      expect(validateAlarmState(mockAlarmState)).toBe(true);
      expect(isAlarmState(mockAlarmState)).toBe(true);
    });

    it('should handle alarm actions with correct types', () => {
      const loadAction: AlarmAction = {
        type: 'ALARMS_LOAD_SUCCESS',
        payload: [mockAlarm],
      };

      const createAction: AlarmAction = {
        type: 'ALARM_CREATE_SUCCESS',
        payload: mockAlarm,
      };

      const triggerAction: AlarmAction = {
        type: 'ALARM_TRIGGER',
        payload: 'alarm-1',
      };

      expect(loadAction.type).toBe('ALARMS_LOAD_SUCCESS');
      expect(createAction.payload.id).toBe('alarm-1');
      expect(triggerAction.payload).toBe('alarm-1');
    });

    it('should fail validation with invalid alarm state', () => {
      const invalidState = { ...mockAlarmState, alarms: 'not-an-array' };
      expect(validateAlarmState(invalidState as any)).toBe(false);
      expect(isAlarmState(invalidState)).toBe(false);
    });
  });

  describe('UserState Interface', () => {
    let mockUserState: UserState;

    beforeEach(() => {
      mockUserState = {
        currentUser: mockUser,
        profile: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          bio: null,
          location: null,
          website: null,
          phoneNumber: null,
          dateOfBirth: null,
          gender: null,
          occupation: null,
        },
        auth: {
          isAuthenticated: true,
          isLoading: false,
          token: 'jwt-token',
          refreshToken: 'refresh-token',
          expiresAt: new Date(Date.now() + 3600000),
          loginMethod: 'email',
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          theme: 'light',
          customTheme: null,
          soundEnabled: true,
          vibrationEnabled: true,
          notificationsEnabled: true,
          locationSharingEnabled: false,
          analyticsEnabled: true,
          marketingEmailsEnabled: false,
        },
        privacy: {
          dataProcessingConsent: true,
          marketingConsent: false,
          analyticsConsent: true,
          consentDate: new Date(),
          twoFactorEnabled: false,
          biometricLoginEnabled: false,
          sessionTimeout: 30,
        },
        activity: {
          currentStreak: 5,
          longestStreak: 12,
          totalAlarmsSet: 50,
          totalAlarmsTriggered: 45,
          totalAlarmsDismissed: 40,
          totalSnoozesUsed: 15,
          averageWakeTime: '07:00',
          sleepScore: 75,
          lastActive: new Date(),
          joinDate: new Date(),
        },
        achievements: {
          unlockedAchievements: [],
          availableAchievements: [],
          totalPoints: 100,
          currentLevel: 2,
          progressToNextLevel: 50,
          badges: [],
        },
        social: {
          friends: [],
          challenges: [],
          leaderboardRank: null,
          sharePermissions: {
            shareProfile: false,
            shareActivity: false,
            shareAchievements: false,
            shareStreaks: false,
            allowFriendRequests: true,
            allowChallengeInvites: true,
          },
          communityParticipation: false,
        },
        errors: {
          profileLoadError: null,
          updateError: null,
          authError: null,
          permissionError: null,
        },
        loading: {
          profile: false,
          preferences: false,
          activity: false,
          achievements: false,
          friends: false,
        },
      };
    });

    it('should validate _user state structure', () => {
      expect(validateUserState(mockUserState)).toBe(true);
      expect(isUserState(mockUserState)).toBe(true);
    });

    it('should handle _user actions with correct types', () => {
      const loginAction: UserAction = {
        type: 'USER_LOGIN_SUCCESS',
        payload: {
          user: mockUser,
          token: 'jwt-token',
          refreshToken: 'refresh-token',
        },
      };

      const preferencesAction: UserAction = {
        type: 'USER_PREFERENCES_UPDATE',
        payload: { theme: 'dark' },
      };

      expect(loginAction.type).toBe('USER_LOGIN_SUCCESS');
      expect(loginAction.payload._user.id).toBe('_user-1');
      expect(preferencesAction.payload.theme).toBe('dark');
    });

    it('should fail validation with invalid _user state', () => {
      const invalidState = { ...mockUserState, auth: null };
      expect(validateUserState(invalidState as any)).toBe(false);
      expect(isUserState(invalidState)).toBe(false);
    });
  });

  describe('SubscriptionState Interface', () => {
    let mockSubscriptionState: SubscriptionState;

    beforeEach(() => {
      mockSubscriptionState = {
        currentSubscription: mockSubscription,
        subscriptionPlan: null,
        availablePlans: [],
        featureAccess: mockFeatureAccess,
        featureUsage: {},
        billingUsage: null,
        status: {
          isActive: true,
          isPremium: true,
          tier: 'premium',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          gracePeriodEndsAt: null,
        },
        trial: {
          isInTrial: false,
          trialPlan: null,
          trialStarted: null,
          trialEndsAt: null,
          trialDaysRemaining: 0,
          hasUsedTrial: true,
          eligibleForExtension: false,
        },
        billing: {
          paymentMethods: [],
          defaultPaymentMethod: null,
          upcomingInvoice: null,
          invoiceHistory: [],
          paymentHistory: [],
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          billingInterval: 'monthly',
          currency: 'USD',
          taxRate: 0.1,
        },
        promotions: {
          activeDiscounts: [],
          availableDiscounts: [],
          referralCode: null,
          referralStats: {
            referralsCount: 0,
            successfulReferrals: 0,
            totalEarnings: 0,
            pendingEarnings: 0,
          },
        },
        changes: {
          pendingChange: null,
          changeHistory: [],
          upgradePrompts: [],
          lastUpgradePrompt: null,
          upgradePromptFrequency: 7,
        },
        limits: {
          reachedLimits: new Set(),
          approachingLimits: new Set(),
          overageFees: [],
          warningsShown: new Set(),
        },
        ui: {
          showUpgradeModal: false,
          showCancelModal: false,
          showPaymentModal: false,
          selectedUpgradePlan: null,
          paymentProcessing: false,
          lastPaymentError: null,
          showUsageDetails: false,
        },
        loading: {
          subscription: false,
          plans: false,
          paymentMethods: false,
          invoices: false,
          featureAccess: false,
        },
        errors: {
          subscriptionError: null,
          paymentError: null,
          billingError: null,
          featureAccessError: null,
        },
      };
    });

    it('should validate subscription state structure', () => {
      expect(validateSubscriptionState(mockSubscriptionState)).toBe(true);
      expect(isSubscriptionState(mockSubscriptionState)).toBe(true);
    });

    it('should handle subscription actions with correct types', () => {
      const upgradeAction: SubscriptionAction = {
        type: 'SUBSCRIPTION_UPGRADE_SUCCESS',
        payload: mockSubscription,
      };

      const featureUpdateAction: SubscriptionAction = {
        type: 'FEATURE_ACCESS_UPDATE',
        payload: mockFeatureAccess,
      };

      expect(upgradeAction.type).toBe('SUBSCRIPTION_UPGRADE_SUCCESS');
      expect(upgradeAction.payload.tier).toBe('premium');
      expect(featureUpdateAction.payload.userId).toBe('_user-1');
    });

    it('should fail validation with invalid subscription state', () => {
      const invalidState = { ...mockSubscriptionState, status: null };
      expect(validateSubscriptionState(invalidState as any)).toBe(false);
      expect(isSubscriptionState(invalidState)).toBe(false);
    });
  });

  describe('AppState Integration', () => {
    let mockAppState: AppState;

    beforeEach(() => {
      mockAppState = {
        alarm: {
          alarms: [mockAlarm],
          activeAlarms: [mockAlarm],
          upcomingAlarms: [],
          isLoading: false,
          isSaving: false,
          loadError: null,
          saveError: null,
          lastUpdated: new Date(),
          currentlyTriggering: [],
          snoozing: {},
          dismissing: [],
          editing: {
            alarmId: null,
            isCreating: false,
            isDirty: false,
            draftAlarm: null,
            validationErrors: {},
          },
          schedulingConfigs: {},
          enabledOptimizations: [],
          locationTriggers: [],
          conditionalRules: [],
          voiceSettings: {
            defaultMood: mockVoiceMood,
            customMoods: [],
            voiceEnabled: true,
            volume: 0.8,
            speaking: false,
          },
          battleState: {
            activeBattles: {},
            battleResults: {},
            battleStats: null,
          },
          performance: {
            successRate: 85,
            averageDismissalTime: 30,
            snoozeFrequency: 1.2,
            weeklyPatterns: [],
            sleepQualityCorrelation: 0.7,
          },
          settings: {
            defaultSound: 'default',
            defaultVolume: 0.8,
            defaultSnoozeInterval: 5,
            maxSnoozes: 3,
            alarmToneTest: false,
            vibrationEnabled: true,
            locationServicesEnabled: false,
            weatherIntegrationEnabled: false,
            calendarIntegrationEnabled: false,
          },
          ui: {
            selectedAlarmId: null,
            showTestAlarm: false,
            showBattleSetup: false,
            showSchedulingConfig: false,
            expandedSections: new Set(),
            sortBy: 'time',
            filterBy: 'all',
          },
        },
        user: {
          currentUser: mockUser,
          profile: null,
          auth: {
            isAuthenticated: true,
            isLoading: false,
            token: 'jwt-token',
            refreshToken: 'refresh-token',
            expiresAt: new Date(Date.now() + 3600000),
            loginMethod: 'email',
          },
          preferences: {
            language: 'en',
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            theme: 'light',
            customTheme: null,
            soundEnabled: true,
            vibrationEnabled: true,
            notificationsEnabled: true,
            locationSharingEnabled: false,
            analyticsEnabled: true,
            marketingEmailsEnabled: false,
          },
          privacy: {
            dataProcessingConsent: true,
            marketingConsent: false,
            analyticsConsent: true,
            consentDate: new Date(),
            twoFactorEnabled: false,
            biometricLoginEnabled: false,
            sessionTimeout: 30,
          },
          activity: {
            currentStreak: 5,
            longestStreak: 12,
            totalAlarmsSet: 50,
            totalAlarmsTriggered: 45,
            totalAlarmsDismissed: 40,
            totalSnoozesUsed: 15,
            averageWakeTime: '07:00',
            sleepScore: 75,
            lastActive: new Date(),
            joinDate: new Date(),
          },
          achievements: {
            unlockedAchievements: [],
            availableAchievements: [],
            totalPoints: 100,
            currentLevel: 2,
            progressToNextLevel: 50,
            badges: [],
          },
          social: {
            friends: [],
            challenges: [],
            leaderboardRank: null,
            sharePermissions: {
              shareProfile: false,
              shareActivity: false,
              shareAchievements: false,
              shareStreaks: false,
              allowFriendRequests: true,
              allowChallengeInvites: true,
            },
            communityParticipation: false,
          },
          errors: {
            profileLoadError: null,
            updateError: null,
            authError: null,
            permissionError: null,
          },
          loading: {
            profile: false,
            preferences: false,
            activity: false,
            achievements: false,
            friends: false,
          },
        },
        subscription: {
          currentSubscription: mockSubscription,
          subscriptionPlan: null,
          availablePlans: [],
          featureAccess: mockFeatureAccess,
          featureUsage: {},
          billingUsage: null,
          status: {
            isActive: true,
            isPremium: true,
            tier: 'premium',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            gracePeriodEndsAt: null,
          },
          trial: {
            isInTrial: false,
            trialPlan: null,
            trialStarted: null,
            trialEndsAt: null,
            trialDaysRemaining: 0,
            hasUsedTrial: true,
            eligibleForExtension: false,
          },
          billing: {
            paymentMethods: [],
            defaultPaymentMethod: null,
            upcomingInvoice: null,
            invoiceHistory: [],
            paymentHistory: [],
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            billingInterval: 'monthly',
            currency: 'USD',
            taxRate: 0.1,
          },
          promotions: {
            activeDiscounts: [],
            availableDiscounts: [],
            referralCode: null,
            referralStats: {
              referralsCount: 0,
              successfulReferrals: 0,
              totalEarnings: 0,
              pendingEarnings: 0,
            },
          },
          changes: {
            pendingChange: null,
            changeHistory: [],
            upgradePrompts: [],
            lastUpgradePrompt: null,
            upgradePromptFrequency: 7,
          },
          limits: {
            reachedLimits: new Set(),
            approachingLimits: new Set(),
            overageFees: [],
            warningsShown: new Set(),
          },
          ui: {
            showUpgradeModal: false,
            showCancelModal: false,
            showPaymentModal: false,
            selectedUpgradePlan: null,
            paymentProcessing: false,
            lastPaymentError: null,
            showUsageDetails: false,
          },
          loading: {
            subscription: false,
            plans: false,
            paymentMethods: false,
            invoices: false,
            featureAccess: false,
          },
          errors: {
            subscriptionError: null,
            paymentError: null,
            billingError: null,
            featureAccessError: null,
          },
        },
        app: {
          initialized: true,
          isOnline: true,
          lastSync: new Date(),
          syncInProgress: false,
          version: '1.0.0',
          environment: 'development',
          maintenanceMode: false,
          criticalError: null,
        },
        navigation: {
          currentView: 'dashboard',
          previousView: null,
          navigationHistory: ['dashboard'],
          modalStack: [],
        },
        performance: {
          startupTime: 1200,
          memoryUsage: 45,
          batteryOptimized: true,
          reducedAnimations: false,
        },
      };
    });

    it('should create app selectors with correct structure', () => {
      const selectors = createAppSelectors(mockAppState);

      expect(selectors.getActiveAlarms()).toEqual([mockAlarm]);
      expect(selectors.isAuthenticated()).toBe(true);
      expect(selectors.isPremiumUser()).toBe(true);
      expect(selectors.getCurrentUser()).toEqual(mockUser);
      expect(selectors.hasFeatureAccess('smart-scheduling')).toBe(true);
      expect(selectors.getSubscriptionStatus().tier).toBe('premium');
    });

    it('should handle combined app actions', () => {
      const alarmAction: AppAction = {
        type: 'ALARM_CREATE_SUCCESS',
        payload: mockAlarm,
      };

      const userAction: AppAction = {
        type: 'USER_LOGIN_SUCCESS',
        payload: {
          user: mockUser,
          token: 'jwt-token',
          refreshToken: 'refresh-token',
        },
      };

      const subscriptionAction: AppAction = {
        type: 'SUBSCRIPTION_UPGRADE_SUCCESS',
        payload: mockSubscription,
      };

      expect(alarmAction.type).toBe('ALARM_CREATE_SUCCESS');
      expect(userAction.type).toBe('USER_LOGIN_SUCCESS');
      expect(subscriptionAction.type).toBe('SUBSCRIPTION_UPGRADE_SUCCESS');
    });

    it('should validate complete app state structure', () => {
      expect(validateAlarmState(mockAppState.alarm)).toBe(true);
      expect(validateUserState(mockAppState._user)).toBe(true);
      expect(validateSubscriptionState(mockAppState.subscription)).toBe(true);
    });
  });

  describe('Reducer Integration Simulation', () => {
    it('should simulate alarm reducer with typed state', () => {
      const initialState: AlarmState = {
        alarms: [],
        activeAlarms: [],
        upcomingAlarms: [],
        isLoading: false,
        isSaving: false,
        loadError: null,
        saveError: null,
        lastUpdated: null,
        currentlyTriggering: [],
        snoozing: {},
        dismissing: [],
        editing: {
          alarmId: null,
          isCreating: false,
          isDirty: false,
          draftAlarm: null,
          validationErrors: {},
        },
        schedulingConfigs: {},
        enabledOptimizations: [],
        locationTriggers: [],
        conditionalRules: [],
        voiceSettings: {
          defaultMood: mockVoiceMood,
          customMoods: [],
          voiceEnabled: true,
          volume: 0.8,
          speaking: false,
        },
        battleState: {
          activeBattles: {},
          battleResults: {},
          battleStats: null,
        },
        performance: {
          successRate: 0,
          averageDismissalTime: 0,
          snoozeFrequency: 0,
          weeklyPatterns: [],
          sleepQualityCorrelation: 0,
        },
        settings: {
          defaultSound: 'default',
          defaultVolume: 0.8,
          defaultSnoozeInterval: 5,
          maxSnoozes: 3,
          alarmToneTest: false,
          vibrationEnabled: true,
          locationServicesEnabled: false,
          weatherIntegrationEnabled: false,
          calendarIntegrationEnabled: false,
        },
        ui: {
          selectedAlarmId: null,
          showTestAlarm: false,
          showBattleSetup: false,
          showSchedulingConfig: false,
          expandedSections: new Set(),
          sortBy: 'time',
          filterBy: 'all',
        },
      };

      // Simulate reducer logic
      const mockAlarmReducer = (state: AlarmState, action: AlarmAction): AlarmState => {
        switch (action.type) {
          case 'ALARMS_LOAD_START':
            return { ...state, isLoading: true, loadError: null };
          case 'ALARMS_LOAD_SUCCESS':
            return {
              ...state,
              isLoading: false,
              alarms: action.payload,
              activeAlarms: action.payload.filter(alarm => alarm.enabled),
              lastUpdated: new Date(),
            };
          case 'ALARM_CREATE_SUCCESS':
            return {
              ...state,
              alarms: [...state.alarms, action.payload],
              activeAlarms: action.payload.enabled
                ? [...state.activeAlarms, action.payload]
                : state.activeAlarms,
            };
          case 'ALARM_TRIGGER':
            return {
              ...state,
              currentlyTriggering: [...state.currentlyTriggering, action.payload],
            };
          default:
            return state;
        }
      };

      // Test reducer operations
      let state = initialState;

      // Load alarms
      state = mockAlarmReducer(state, { type: 'ALARMS_LOAD_START' });
      expect(state.isLoading).toBe(true);

      state = mockAlarmReducer(state, {
        type: 'ALARMS_LOAD_SUCCESS',
        payload: [mockAlarm],
      });
      expect(state.isLoading).toBe(false);
      expect(state.alarms).toHaveLength(1);
      expect(state.activeAlarms).toHaveLength(1);

      // Create alarm
      const newAlarm = { ...mockAlarm, id: 'alarm-2', title: 'Evening Alarm' };
      state = mockAlarmReducer(state, {
        type: 'ALARM_CREATE_SUCCESS',
        payload: newAlarm,
      });
      expect(state.alarms).toHaveLength(2);

      // Trigger alarm
      state = mockAlarmReducer(state, {
        type: 'ALARM_TRIGGER',
        payload: 'alarm-1',
      });
      expect(state.currentlyTriggering).toContain('alarm-1');

      // Validate final state
      expect(validateAlarmState(state)).toBe(true);
    });
  });
});
