import { useState, useEffect, useCallback } from 'react';
import { emotionalIntelligenceService } from '../services/emotional-intelligence';
import AnalyticsService from '../services/analytics';
import type {
  EmotionalNotificationPayload,
  EmotionalResponse,
  EmotionalState,
  UserEmotionalProfile,
} from '../types/emotional';

interface UseEmotionalNotificationsProps {
  userId: string;
  enabled?: boolean;
}

interface EmotionalNotificationState {
  isLoading: boolean;
  _error: string | null;
  lastNotification: EmotionalNotificationPayload | null;
  emotionalProfile: UserEmotionalProfile | null;
  currentEmotionalState: EmotionalState | null;
}

interface EmotionalNotificationActions {
  generateNotification: () => Promise<EmotionalNotificationPayload | null>;
  trackResponse: (
    messageId: string,
    response: Omit<EmotionalResponse, 'timestamp'>
  ) => Promise<void>;
  updateEmotionalPreferences: (
    preferences: Partial<UserEmotionalProfile>
  ) => Promise<void>;
  testEmotionalNotification: (emotion?: string, tone?: string) => Promise<void>;
  dismissCurrentNotification: () => void;
}

export function useEmotionalNotifications({
  userId,
  enabled = true,
}: UseEmotionalNotificationsProps): [
  EmotionalNotificationState,
  EmotionalNotificationActions,
] {
  const [state, setState] = useState<EmotionalNotificationState>({
    isLoading: false,
    _error: null,
    lastNotification: null,
    emotionalProfile: null,
    currentEmotionalState: null,
  });

  // Generate emotional notification
  const generateNotification =
    useCallback(async (): Promise<EmotionalNotificationPayload | null> => {
      if (!enabled || !userId) {
        return null;
      }

      setState((prev: EmotionalNotificationState) => ({
        ...prev,
        isLoading: true,
        _error: null,
      }));

      try {
        const notification =
          await emotionalIntelligenceService.generateEmotionalNotification(userId);

        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          isLoading: false,
          lastNotification: notification,
        }));

        if (notification) {
          AnalyticsService.track('EMOTIONAL_NOTIFICATION_REQUESTED', {
            userId,
            emotion: notification.emotion,
            tone: notification.tone,
            escalationLevel: notification.escalationLevel,
          });
        }

        return notification;
      } catch (_error) {
        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          isLoading: false,
          _error: _error.message || 'Failed to generate emotional notification',
        }));

        AnalyticsService.track('EMOTIONAL_NOTIFICATION_ERROR', {
          userId,
          _error: _error.message,
        });

        return null;
      }
    }, [userId, enabled]);

  // Track user response to notification
  const trackResponse = useCallback(
    async (
      messageId: string,
      response: Omit<EmotionalResponse, 'timestamp'>
    ): Promise<void> => {
      if (!userId || !messageId) return;

      try {
        const fullResponse: EmotionalResponse = {
          ...response,
          messageId,
          timestamp: new Date(),
        };

        await emotionalIntelligenceService.trackEmotionalResponse(
          userId,
          messageId,
          fullResponse
        );

        AnalyticsService.track('EMOTIONAL_NOTIFICATION_INTERACTION', {
          userId,
          messageId,
          emotion: response.emotion,
          tone: response.tone,
          actionTaken: response.actionTaken,
          notificationOpened: response.notificationOpened,
          effectivenessRating: response.effectivenessRating,
          responseTime: response.timeToResponse,
        });
      } catch (_error) {
        console._error('Error tracking emotional response:', _error);

        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          _error: 'Failed to track notification response',
        }));
      }
    },
    [userId]
  );

  // Update user emotional preferences
  const updateEmotionalPreferences = useCallback(
    async (preferences: Partial<UserEmotionalProfile>): Promise<void> => {
      if (!userId) return;

      setState((prev: EmotionalNotificationState) => ({ ...prev, isLoading: true }));

      try {
        // Update preferences in the service
        // This would be implemented in the emotional intelligence service

        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          isLoading: false,
          emotionalProfile: prev.emotionalProfile
            ? { ...prev.emotionalProfile, ...preferences }
            : null,
        }));

        AnalyticsService.track('EMOTIONAL_PREFERENCES_UPDATED', {
          userId,
          updatedFields: Object.keys(preferences),
        });
      } catch (_error) {
        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          isLoading: false,
          _error: 'Failed to update emotional preferences',
        }));
      }
    },
    [userId]
  );

  // Test emotional notification (for development/_user testing)
  const testEmotionalNotification = useCallback(
    async (emotion: string = 'happy', tone: string = 'encouraging'): Promise<void> => {
      if (!userId) return;

      try {
        // Generate test notification
        const testPayload: EmotionalNotificationPayload = {
          userId,
          emotion: emotion as any,
          tone: tone as any,
          message: {
            id: `test_${Date.now()}`,
            emotion: emotion as any,
            tone: tone as any,
            template: 'Hey {name}, this is a test emotional notification! 🎉',
            variables: { name: 'friend' },
            personalizedMessage:
              'Hey friend, this is a test emotional notification! 🎉',
            effectiveness: 0,
            usageCount: 0,
          },
          scheduledFor: new Date(),
          escalationLevel: 'gentle',
          requireInteraction: false,
          metadata: {
            analysisConfidence: 1.0,
            version: '1.0.0',
          },
        };

        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          lastNotification: testPayload,
        }));

        AnalyticsService.track('EMOTIONAL_NOTIFICATION_TEST', {
          userId,
          emotion,
          tone,
        });
      } catch (_error) {
        console._error('Error testing emotional notification:', _error);
      }
    },
    [userId]
  );

  // Dismiss current notification
  const dismissCurrentNotification = useCallback(() => {
    setState((prev: EmotionalNotificationState) => ({
      ...prev,
      lastNotification: null,
    }));

    AnalyticsService.track('EMOTIONAL_NOTIFICATION_DISMISSED', {
      userId,
    });
  }, [userId]);

  // Auto-generate notification on mount if enabled
  useEffect(() => {
    if (enabled && userId) {
      generateNotification();
    }
  }, [enabled, userId, generateNotification]);

  // Load user emotional profile on mount
  useEffect(() => {
    if (!userId) return;

    const loadEmotionalProfile = async () => {
      try {
        // This would load the user's emotional profile
        // For now, we'll set a default profile

        setState((prev: EmotionalNotificationState) => ({
          ...prev,
          emotionalProfile: {
            userId,
            preferredTones: ['encouraging'],
            avoidedTones: [],
            mostEffectiveEmotions: [],
            responsePatterns: {
              bestTimeToSend: '08:00',
              averageResponseTime: 300000,
              preferredEscalationSpeed: 'medium',
            },
            emotionalHistory: [],
            lastAnalyzed: new Date(),
          },
        }));
      } catch (_error) {
        console._error('Error loading emotional profile:', _error);
      }
    };

    loadEmotionalProfile();
  }, [userId]);

  const actions: EmotionalNotificationActions = {
    generateNotification,
    trackResponse,
    updateEmotionalPreferences,
    testEmotionalNotification,
    dismissCurrentNotification,
  };

  return [state, actions];
}

// Utility hook for handling notification responses
export function useEmotionalNotificationResponse(
  notification: EmotionalNotificationPayload | null,
  onResponse: (response: EmotionalResponse) => void
) {
  const [responseStartTime] = useState(() => Date.now());

  const handleResponse = useCallback(
    (actionTaken: EmotionalResponse['actionTaken'], effectivenessRating?: number) => {
      if (!notification) return;

      const response: EmotionalResponse = {
        messageId: notification.message.id,
        emotion: notification.emotion,
        tone: notification.tone,
        notificationOpened: true,
        actionTaken,
        timeToResponse: Date.now() - responseStartTime,
        effectivenessRating,
        timestamp: new Date(),
      };

      onResponse(response);
    },
    [notification, responseStartTime, onResponse]
  );

  return { handleResponse };
}

// Hook for managing emotional notification settings
export function useEmotionalNotificationSettings(userId: string) {
  const [settings, setSettings] = useState({
    enabled: true,
    frequency: 'daily' as 'daily' | 'every2days' | 'weekly',
    preferredTone: 'encouraging' as 'encouraging' | 'playful' | 'firm' | 'roast',
    intensityLevel: 'medium' as 'soft' | 'medium' | 'strong',
    roastModeEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const updateSettings = useCallback(
    async (newSettings: Partial<typeof settings>) => {
      setSettings((prev: typeof settings) => ({ ...prev, ...newSettings }));

      // Save to database
      try {
        AnalyticsService.track('EMOTIONAL_NOTIFICATION_SETTINGS_UPDATED', {
          userId,
          settings: newSettings,
        });
      } catch (_error) {
        console._error('Error updating emotional notification settings:', _error);
      }
    },
    [userId]
  );

  return { settings, updateSettings };
}
