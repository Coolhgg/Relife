/**
 * Example Migration: AlarmForm Component
 *
 * This shows how to migrate AlarmForm.tsx from direct service imports
 * to using the dependency injection container.
 *
 * This is an EXAMPLE FILE to demonstrate the migration pattern.
 * The actual AlarmForm.tsx should be updated following this pattern.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Volume2, Calendar, Gamepad2, Target, Crown, Lock } from 'lucide-react';
import type { Alarm, VoiceMood, CustomSound, AlarmDifficulty, User } from '../types';
import { VOICE_MOODS, DAYS_OF_WEEK } from '../utils';
import { validateAlarmData, type AlarmValidationErrors } from '../utils/validation';
import { useDynamicFocus } from '../hooks/useDynamicFocus';
import { useFormAnnouncements } from '../hooks/useFormAnnouncements';
import { useFocusAnnouncements } from '../hooks/useScreenReaderAnnouncements';
import NuclearModeSelector from './NuclearModeSelector';
import UpgradePrompt from './UpgradePrompt';
import { TimeoutHandle } from '../types/timers';

// NEW: Import DI container and service interfaces instead of direct service imports
import { getService } from '../services/ServiceBootstrap';
import {
  IAlarmService,
  IAnalyticsService,
  ISubscriptionService,
  IAudioService,
} from '../types/service-interfaces';

// OLD: These imports would be removed
// import { CustomSoundManager } from '../services/custom-sound-manager';
// import { PremiumService } from '../services/premium';

interface AlarmFormProps {
  alarm?: Alarm;
  onSave: (alarm: Partial<Alarm>) => void;
  onCancel: () => void;
  user?: User;
  className?: string;
}

export default function AlarmFormExample({
  alarm,
  onSave,
  onCancel,
  user,
  className = '',
}: AlarmFormProps) {
  // NEW: Get services from DI container using useMemo for performance
  const alarmService = useMemo(() => getService<IAlarmService>('AlarmService'), []);
  const analyticsService = useMemo(
    () => getService<IAnalyticsService>('AnalyticsService'),
    []
  );
  const subscriptionService = useMemo(
    () => getService<ISubscriptionService>('SubscriptionService'),
    []
  );
  const audioService = useMemo(() => getService<IAudioService>('AudioService'), []);

  // Component state
  const [formData, setFormData] = useState({
    time: alarm?.time || '07:00',
    label: alarm?.label || '',
    days: alarm?.days || [1, 2, 3, 4, 5], // Weekdays by default
    voiceMood: alarm?.voiceMood || ('motivational' as VoiceMood),
    sound: alarm?.sound || 'default',
    difficulty: alarm?.difficulty || ('medium' as AlarmDifficulty),
    snoozeEnabled: alarm?.snoozeEnabled ?? true,
    snoozeInterval: alarm?.snoozeInterval || 5,
    maxSnoozes: alarm?.maxSnoozes || 3,
    battleId: alarm?.battleId || '',
    weatherEnabled: alarm?.weatherEnabled || false,
  });

  const [validationErrors, setValidationErrors] = useState<AlarmValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Hooks
  const { focusRef, moveFocus } = useDynamicFocus();
  const { announceFormError, announceFormSuccess } = useFormAnnouncements();
  const { announceToScreenReader } = useFocusAnnouncements();

  // NEW: Load custom sounds using audio service
  useEffect(() => {
    const loadCustomSounds = async () => {
      try {
        // In the actual implementation, this would call the audio service
        // const sounds = await audioService.getCustomSounds(user?.id);
        // setCustomSounds(sounds);

        // For now, using placeholder
        setCustomSounds([]);
      } catch (error) {
        console.error('Failed to load custom sounds:', error);
        await analyticsService.track('custom_sounds_load_error', {
          userId: user?.id,
          error: (error as Error).message,
        });
      }
    };

    if (user?.id) {
      loadCustomSounds();
    }
  }, [user?.id, audioService, analyticsService]);

  // NEW: Check premium status using subscription service
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.id) {
        setIsPremium(false);
        return;
      }

      try {
        const hasAccess = await subscriptionService.checkFeatureAccess(
          user.id,
          'premium_alarms'
        );
        setIsPremium(hasAccess);
      } catch (error) {
        console.error('Failed to check premium status:', error);
        setIsPremium(false);
      }
    };

    checkPremiumStatus();
  }, [user?.id, subscriptionService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const errors = validateAlarmData(formData);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      announceFormError('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      // NEW: Use alarm service through DI container
      if (alarm?.id) {
        // Updating existing alarm
        await alarmService.updateAlarm(alarm.id, formData);
        await analyticsService.track('alarm_updated', {
          alarmId: alarm.id,
          userId: user?.id,
          changes: Object.keys(formData),
        });
      } else {
        // Creating new alarm
        const newAlarm = await alarmService.createAlarm({
          ...formData,
          userId: user?.id,
        });
        await analyticsService.track('alarm_created', {
          alarmId: newAlarm.id,
          userId: user?.id,
          difficulty: formData.difficulty,
          hasBattle: !!formData.battleId,
        });
      }

      announceFormSuccess(
        alarm ? 'Alarm updated successfully' : 'Alarm created successfully'
      );
      onSave(formData);
    } catch (error) {
      console.error('Failed to save alarm:', error);
      announceFormError('Failed to save alarm. Please try again.');

      await analyticsService.track('alarm_save_error', {
        userId: user?.id,
        error: (error as Error).message,
        isUpdate: !!alarm?.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePremiumFeature = (featureName: string) => {
    if (!isPremium) {
      setShowUpgradePrompt(true);
      analyticsService.track('premium_feature_blocked', {
        feature: featureName,
        userId: user?.id,
      });
      return false;
    }
    return true;
  };

  const handleDifficultyChange = (difficulty: AlarmDifficulty) => {
    if (difficulty === 'extreme' && !handlePremiumFeature('extreme_difficulty')) {
      return;
    }

    setFormData(prev => ({ ...prev, difficulty }));
    analyticsService.track('alarm_difficulty_changed', {
      difficulty,
      userId: user?.id,
    });
  };

  // Component render logic would continue here...
  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Form fields would be rendered here */}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          ref={focusRef}
          className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : alarm ? 'Update Alarm' : 'Create Alarm'}
        </button>
      </div>

      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
          feature="Premium Alarm Features"
        />
      )}
    </form>
  );
}

/**
 * Key Migration Changes:
 *
 * 1. Removed direct service imports:
 *    - import { CustomSoundManager } from '../services/custom-sound-manager';
 *    - import { PremiumService } from '../services/premium';
 *
 * 2. Added DI container imports:
 *    - import { getService } from '../services/ServiceBootstrap';
 *    - import service interfaces
 *
 * 3. Get services using useMemo for performance:
 *    - const alarmService = useMemo(() => getService<IAlarmService>('AlarmService'), []);
 *
 * 4. Use service instances instead of static methods:
 *    - await alarmService.createAlarm() instead of AlarmService.createAlarm()
 *    - await analyticsService.track() instead of AnalyticsService.track()
 *
 * 5. Added proper error handling and analytics tracking
 *
 * 6. Maintained all existing functionality while using the new architecture
 */
