/// <reference lib="dom" />
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Tag,
  Calendar,
  Volume2,
  Upload,
  Play,
  Pause,
  Trash2,
  Target,
  Crown,
  Lock,
} from 'lucide-react';
import type { Alarm, VoiceMood, CustomSound, AlarmDifficulty, User } from '../types';
import { CustomSoundManager } from '../services/custom-sound-manager';
import { VOICE_MOODS, DAYS_OF_WEEK } from '../utils';
import { validateAlarmData, type AlarmValidationErrors } from '../utils/validation';
import { useDynamicFocus } from '../hooks/useDynamicFocus';
import { useFormAnnouncements } from '../hooks/useFormAnnouncements';
import { useFocusAnnouncements } from '../hooks/useScreenReaderAnnouncements';
import { PremiumService } from '../services/premium';
import _NuclearModeSelector from './_NuclearModeSelector';
import UpgradePrompt from './UpgradePrompt';

interface AlarmFormProps {
  alarm?: Alarm | null;
  onSave: (data: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
    difficulty?: AlarmDifficulty;
    nuclearChallenges?: string[];
    soundType?: 'built-in' | 'custom' | 'voice-only';
    customSoundId?: string;
    snoozeEnabled?: boolean;
    snoozeInterval?: number;
    maxSnoozes?: number;
  }) => void;
  onCancel: () => void;
  userId: string; // Required for custom sound management
  user: User; // Required for premium feature checks
}

const AlarmForm: React.FC<AlarmFormProps> = ({
  alarm,
  onSave,
  onCancel,
  userId,
  user,
}) => {
  const [formData, setFormData] = useState({
    time: alarm?.time || '07:00',
    label: alarm?.label || '',
    days: alarm?.days || [1, 2, 3, 4, 5], // Default to weekdays
    voiceMood: alarm?.voiceMood || ('motivational' as VoiceMood),
    difficulty: alarm?.difficulty || ('easy' as AlarmDifficulty),
    nuclearChallenges: alarm?.nuclearChallenges || [],
    soundType:
      alarm?.soundType || ('voice-only' as 'built-in' | 'custom' | 'voice-only'),
    customSoundId: alarm?.customSoundId || '',
    snoozeEnabled: alarm?.snoozeEnabled ?? true,
    snoozeInterval: alarm?.snoozeInterval || 5,
    maxSnoozes: alarm?.maxSnoozes || 3,
  });

  const [errors, setErrors] = useState<AlarmValidationErrors>({});
  const [selectedVoiceMood, setSelectedVoiceMood] = useState(formData.voiceMood);
  const [errorAnnouncement, setErrorAnnouncement] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  // Custom sound management state
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [isUploadingSound, setIsUploadingSound] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    loaded: number;
    total: number;
    percentage: number;
    stage: string;
  } | null>(null);

  // Premium feature state
  const [showNuclearModeUpgrade, setShowNuclearModeUpgrade] = useState(false);
  const [hasNuclearAccess, setHasNuclearAccess] = useState(false);

  useEffect(() => {
    checkNuclearAccess();
  }, [user.id]);

  const checkNuclearAccess = async () => {
    try {
      const access = await PremiumService.getInstance().hasFeatureAccess(
        user.id,
        'nuclear_mode'
      );
      setHasNuclearAccess(access);
    } catch (error) {
      console.error('Error checking nuclear mode access:', error);
      setHasNuclearAccess(false);
    }
  };
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customSoundManager = CustomSoundManager.getInstance();

  // Dynamic focus management for form validation and updates
  const { announceValidation, announceSuccess, announceError } = useDynamicFocus({
    announceChanges: true,
    focusOnChange: false,
    debounceMs: 150,
    liveRegionPoliteness: 'polite',
  });

  // Enhanced form-specific announcements
  const {
    announceFieldChange,
    announceDayToggle,
    announceVoiceMoodSelection,
    announceValidationErrors,
    announceFormSuccess,
    announceFormCancel,
    announceFormReady,
    announceFieldValidation,
    announceFieldDescription,
  } = useFormAnnouncements();

  const { _announceEnter } = useFocusAnnouncements('Alarm Form');

  useEffect(() => {
    if (alarm) {
      setFormData({
        time: alarm.time,
        label: alarm.label,
        days: alarm.days,
        voiceMood: alarm.voiceMood,
        difficulty: alarm.difficulty || 'easy',
        nuclearChallenges: alarm.nuclearChallenges || [],
        soundType: alarm.soundType || 'voice-only',
        customSoundId: alarm.customSoundId || '',
        snoozeEnabled: alarm.snoozeEnabled ?? true,
        snoozeInterval: alarm.snoozeInterval || 5,
        maxSnoozes: alarm.maxSnoozes || 3,
      });
      setSelectedVoiceMood(alarm.voiceMood);
    }
  }, [alarm]);

  // Load user's custom sounds on mount
  useEffect(() => {
    const loadCustomSounds = async () => {
      const sounds = await customSoundManager.getUserCustomSounds(userId);
      setCustomSounds(sounds);
    };

    loadCustomSounds();
  }, [userId]);

  // Enhanced cleanup for preview audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudio) {
        try {
          // Remove all event listeners to prevent memory leaks
          const newAudio = previewAudio.cloneNode(false) as HTMLAudioElement;
          previewAudio.parentNode?.replaceChild(newAudio, previewAudio);

          // Stop playback and clear resources
          previewAudio.pause();
          previewAudio.currentTime = 0;
          previewAudio.removeAttribute('src'); // Release resource
          previewAudio.load(); // Force garbage collection
        } catch (error) {
          // Silently handle cleanup errors in production
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error during audio cleanup:', error);
          }
        }
      }

      // Clear preview states
      setPreviewingSound(null);
      setPreviewAudio(null);
    };
  }, [previewAudio]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Handle voice mood keyboard navigation
  const _handleVoiceMoodKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    mood: VoiceMood
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleVoiceMoodSelect(mood);
    }
  };

  // Focus management and form ready announcement
  useEffect(() => {
    // Announce form is ready
    announceFormReady(alarm ? 'Edit alarm' : 'New alarm', Boolean(alarm));

    // Focus first form element when component mounts
    setTimeout(() => {
      const timeInput = document.getElementById('alarm-time');
      if (timeInput) {
        timeInput.focus();
      }
    }, 100);
  }, [alarm, announceFormReady]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateAlarmData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);

      // Announce validation errors for accessibility
      announceValidationErrors(validation.errors);
      const errorCount = Object.keys(validation.errors).length;
      const errorMessage = `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct the highlighted fields.`;
      announceError(errorMessage);

      // Announce individual field errors
      Object.entries(validation.errors).forEach(([field, message]) => {
        const fieldElement = formRef.current?.querySelector(
          `[name="${field}"]`
        ) as HTMLElement;
        if (fieldElement && message) {
          announceValidation(fieldElement, false, message);
        }
      });

      // Focus first error field
      setTimeout(() => {
        if (firstErrorRef.current) {
          firstErrorRef.current.focus();
        }
      }, 100);

      return;
    }

    setErrors({});
    setErrorAnnouncement('');
    // Announce successful submission for accessibility
    announceSuccess(
      alarm ? 'Alarm updated successfully' : 'Alarm created successfully'
    );
    announceFormSuccess(alarm ? 'update' : 'create', 'Alarm');
    onSave({
      ...formData,
      voiceMood: selectedVoiceMood,
      difficulty: formData.difficulty,
      nuclearChallenges: formData.nuclearChallenges,
      soundType: formData.soundType,
      customSoundId: formData.customSoundId,
      snoozeEnabled: formData.difficulty === 'nuclear' ? false : formData.snoozeEnabled,
      snoozeInterval: formData.snoozeInterval,
      maxSnoozes: formData.maxSnoozes,
    });
  };

  const toggleDay = (dayId: number) => {
    setFormData(prev => {
      const newDays = prev.days.includes(dayId)
        ? prev.days.filter(d => d !== dayId)
        : [...prev.days, dayId].sort();

      // Announce the day toggle
      const dayName = DAYS_OF_WEEK.find(d => d.id === dayId)?.full || 'Day';
      const isSelected = newDays.includes(dayId);
      announceDayToggle(dayName, isSelected, newDays.length);

      return {
        ...prev,
        days: newDays,
      };
    });
  };

  const handleVoiceMoodSelect = (mood: VoiceMood) => {
    setSelectedVoiceMood(mood);
    announceVoiceMoodSelection(mood);
  };

  const selectedMoodConfig = VOICE_MOODS.find(vm => vm.id === selectedVoiceMood);

  // Custom sound handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingSound(true);
    setUploadProgress(null);

    try {
      const result = await customSoundManager.uploadCustomSound(
        file,
        {
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: `Custom alarm sound uploaded from ${file.name}`,
          category: 'custom',
          tags: ['custom', 'uploaded'],
        },
        userId,
        progress => setUploadProgress(progress)
      );

      if (result.success && result.customSound) {
        setCustomSounds(prev => [result.customSound!, ...prev]);
        setFormData(prev => ({
          ...prev,
          soundType: 'custom',
          customSoundId: result.customSound!.id,
        }));
        announceSuccess(
          `Custom sound "${result.customSound.name}" uploaded successfully`
        );
      } else {
        announceError(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      announceError(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUploadingSound(false);
      setUploadProgress(null);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSoundTypeChange = (soundType: 'built-in' | 'custom' | 'voice-only') => {
    setFormData(prev => ({
      ...prev,
      soundType,
      customSoundId: soundType === 'custom' ? prev.customSoundId : '',
    }));
  };

  const handleCustomSoundSelect = (soundId: string) => {
    setFormData(prev => ({
      ...prev,
      soundType: 'custom',
      customSoundId: soundId,
    }));
  };

  const handlePreviewSound = async (sound: CustomSound) => {
    if (previewingSound === sound.id) {
      // Stop preview with enhanced cleanup
      if (previewAudio) {
        try {
          previewAudio.pause();
          previewAudio.currentTime = 0;
          // Remove all event listeners by cloning the element
          const cleanAudio = previewAudio.cloneNode(false) as HTMLAudioElement;
          previewAudio.parentNode?.replaceChild(cleanAudio, previewAudio);
          previewAudio.removeAttribute('src');
          previewAudio.load();
        } catch (_error) {
          // Silently handle cleanup errors
        }
      }
      setPreviewingSound(null);
      setPreviewAudio(null);
    } else {
      // Start preview with proper cleanup of previous audio
      try {
        // Clean up previous audio if exists
        if (previewAudio) {
          previewAudio.pause();
          try {
            const oldAudio = previewAudio.cloneNode(false) as HTMLAudioElement;
            previewAudio.parentNode?.replaceChild(oldAudio, previewAudio);
            previewAudio.removeAttribute('src');
            previewAudio.load();
          } catch (_cleanupError) {
            // Continue even if cleanup fails
          }
        }

        const audio = await customSoundManager.previewCustomSound(sound);

        // Add event listener with proper cleanup reference
        const endedHandler = () => {
          setPreviewingSound(null);
          setPreviewAudio(null);
        };

        audio.addEventListener('ended', endedHandler);

        // Error handler to clean up on audio errors
        const errorHandler = () => {
          setPreviewingSound(null);
          setPreviewAudio(null);
          announceError('Audio playback failed');
        };

        audio.addEventListener('error', errorHandler);

        setPreviewingSound(sound.id);
        setPreviewAudio(audio);
        audio.play();
      } catch (error) {
        announceError(
          `Failed to preview sound: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setPreviewingSound(null);
        setPreviewAudio(null);
      }
    }
  };

  const handleDeleteCustomSound = async (sound: CustomSound) => {
    if (confirm(`Are you sure you want to delete "${sound.name}"?`)) {
      const success = await customSoundManager.deleteCustomSound(sound.id, userId);
      if (success) {
        setCustomSounds(prev => prev.filter(s => s.id !== sound.id));
        // If the deleted sound was selected, reset to voice-only
        if (formData.customSoundId === sound.id) {
          setFormData(prev => ({
            ...prev,
            soundType: 'voice-only',
            customSoundId: '',
          }));
        }
        announceSuccess(`Custom sound "${sound.name}" deleted successfully`);
      } else {
        announceError('Failed to delete custom sound');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-form-title"
    >
      {/* Screen reader announcement for errors */}
      {errorAnnouncement && (
        <div role="alert" aria-live="assertive" className="sr-only">
          {errorAnnouncement}
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-300">
          <h2
            id="alarm-form-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            {alarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button
            onClick={() => {
              announceFormCancel('Alarm form');
              onCancel();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-full transition-colors"
            aria-label="Close alarm form"
          >
            <X
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              aria-hidden="true"
            />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-4 space-y-6"
          noValidate
          aria-describedby={Object.keys(errors).length > 0 ? 'form-errors' : undefined}
        >
          {/* General Errors */}
          {Object.keys(errors).length > 0 && (
            <div
              id="form-errors"
              role="alert"
              aria-live="polite"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
            >
              <div className="text-sm text-red-700 dark:text-red-300">
                <div className="font-medium mb-2">Please fix the following issues:</div>
                <ul className="space-y-1" role="list">
                  {errors.time && <li role="listitem">• Time: {errors.time}</li>}
                  {errors.label && <li role="listitem">• Label: {errors.label}</li>}
                  {errors.days && <li role="listitem">• Days: {errors.days}</li>}
                  {errors.voiceMood && (
                    <li role="listitem">• Voice Mood: {errors.voiceMood}</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <label
              htmlFor="alarm-time"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              Time
            </label>
            <input
              id="alarm-time"
              type="time"
              value={formData.time}
              onChange={e => {
                const newTime = e.target.value;
                setFormData(prev => ({ ...prev, time: newTime }));
                announceFieldChange(
                  {
                    fieldName: 'Alarm time',
                    newValue: newTime,
                    fieldType: 'time',
                  },
                  0
                ); // No debounce for time input
              }}
              onBlur={() => {
                // Validate on blur
                if (formData.time) {
                  announceFieldValidation('Time', true);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'F1') {
                  e.preventDefault();
                  announceFieldDescription(
                    'Alarm time',
                    formData.time,
                    'Set the time for your alarm using 24-hour format'
                  );
                }
              }}
              className={`alarm-input text-2xl font-mono ${errors.time ? 'border-red-500 focus:border-red-500' : ''}`}
              required
              aria-invalid={errors.time ? 'true' : 'false'}
              aria-describedby={errors.time ? 'time-error' : 'time-help'}
              ref={errors.time ? firstErrorRef : undefined}
            />
            <div id="time-help" className="sr-only">
              Press F1 for field description
            </div>
            {errors.time && (
              <div
                id="time-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.time}
              </div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-2">
            <label
              htmlFor="alarm-label"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Tag className="w-4 h-4" aria-hidden="true" />
              Label
            </label>
            <input
              id="alarm-label"
              type="text"
              value={formData.label}
              onChange={e => {
                const newLabel = e.target.value;
                setFormData(prev => ({ ...prev, label: newLabel }));
                announceFieldChange(
                  {
                    fieldName: 'Alarm label',
                    newValue: newLabel,
                    fieldType: 'text',
                  },
                  500
                ); // Debounce for text input
              }}
              onBlur={() => {
                // Validate on blur
                if (formData.label.trim()) {
                  announceFieldValidation('Label', true);
                } else {
                  announceFieldValidation('Label', false, 'Label is required');
                }
              }}
              onKeyDown={e => {
                if (e.key === 'F1') {
                  e.preventDefault();
                  announceFieldDescription(
                    'Alarm label',
                    formData.label,
                    'Give your alarm a descriptive name to help you identify it',
                    'Maximum 100 characters'
                  );
                }
              }}
              placeholder="Wake up time!"
              className={`alarm-input ${errors.label ? 'border-red-500 focus:border-red-500' : ''}`}
              maxLength={100}
              required
              aria-invalid={errors.label ? 'true' : 'false'}
              aria-describedby={errors.label ? 'label-error' : 'label-help'}
              ref={errors.label && !errors.time ? firstErrorRef : undefined}
            />
            <div id="label-help" className="sr-only">
              Press F1 for field description. Character count: {formData.label.length}
              /100
            </div>
            {errors.label && (
              <div
                id="label-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.label}
              </div>
            )}
          </div>

          {/* Days */}
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Days
            </legend>
            <div
              className="grid grid-cols-7 gap-2"
              role="group"
              aria-labelledby="days-legend"
              aria-describedby={errors.days ? 'days-error' : undefined}
              aria-invalid={errors.days ? 'true' : 'false'}
            >
              <div id="days-legend" className="sr-only">
                Select the days for your alarm to repeat
              </div>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDay(day.id);
                    } else if (e.key === 'F1') {
                      e.preventDefault();
                      const selectedDays = DAYS_OF_WEEK.filter(d =>
                        formData.days.includes(d.id)
                      )
                        .map(d => d.full)
                        .join(', ');
                      announceFieldDescription(
                        'Days selection',
                        selectedDays || 'None',
                        'Select which days of the week this alarm should repeat'
                      );
                    }
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 ${
                    formData.days.includes(day.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-300'
                  } ${errors.days ? 'ring-2 ring-red-500' : ''}`}
                  aria-pressed={formData.days.includes(day.id)}
                  aria-label={`${day.full} - ${formData.days.includes(day.id) ? 'selected' : 'not selected'}`}
                  role="switch"
                >
                  <span aria-hidden="true">{day.short}</span>
                  <span className="sr-only">{day.full}</span>
                </button>
              ))}
            </div>
            {errors.days && (
              <div
                id="days-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.days}
              </div>
            )}
          </fieldset>

          {/* Voice Mood */}
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Voice Mood
            </legend>

            {/* Selected mood preview */}
            {selectedMoodConfig && (
              <div className="alarm-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-200 dark:to-dark-300">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{selectedMoodConfig.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedMoodConfig.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMoodConfig.description}
                    </div>
                  </div>
                </div>
                <div className="text-sm italic text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 p-2 rounded border-l-4 border-primary-500">
                  "{selectedMoodConfig.sample}"
                </div>
              </div>
            )}

            {/* Mood options */}
            <div
              className="grid grid-cols-2 gap-3"
              role="radiogroup"
              aria-labelledby="voice-mood-legend"
              aria-describedby={errors.voiceMood ? 'voice-mood-error' : undefined}
              aria-invalid={errors.voiceMood ? 'true' : 'false'}
            >
              <div id="voice-mood-legend" className="sr-only">
                Select a voice mood for your alarm
              </div>
              {VOICE_MOODS.map(mood => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleVoiceMoodSelect(mood.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleVoiceMoodSelect(mood.id);
                    } else if (e.key === 'F1') {
                      e.preventDefault();
                      const selectedMoodName =
                        VOICE_MOODS.find(m => m.id === selectedVoiceMood)?.name ||
                        'None';
                      announceFieldDescription(
                        'Voice mood',
                        selectedMoodName,
                        'Select the tone and style for your alarm wake-up message',
                        VOICE_MOODS.map(m => m.name).join(', ')
                      );
                    }
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedVoiceMood === mood.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-300 hover:border-gray-300 dark:hover:border-dark-200'
                  } ${errors.voiceMood ? 'ring-2 ring-red-500' : ''}`}
                  role="radio"
                  aria-checked={selectedVoiceMood === mood.id}
                  aria-label={`${mood.name}: ${mood.description}`}
                  aria-describedby={`mood-${mood.id}-desc`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg" aria-hidden="true">
                      {mood.icon}
                    </span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {mood.name}
                    </div>
                  </div>
                  <div
                    id={`mood-${mood.id}-desc`}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {mood.description}
                  </div>
                </button>
              ))}
            </div>
            {errors.voiceMood && (
              <div
                id="voice-mood-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.voiceMood}
              </div>
            )}
          </fieldset>

          {/* Difficulty Level & Nuclear Mode */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Target className="w-4 h-4" aria-hidden="true" />
              Alarm Difficulty
            </legend>

            {/* Difficulty Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                {
                  id: 'easy',
                  name: 'Easy',
                  description: 'Simple tap to dismiss',
                  icon: '😊',
                },
                {
                  id: 'medium',
                  name: 'Medium',
                  description: 'Math problem or task',
                  icon: '🤔',
                },
                {
                  id: 'hard',
                  name: 'Hard',
                  description: 'Multiple challenges',
                  icon: '😤',
                },
                {
                  id: 'extreme',
                  name: 'Extreme',
                  description: 'Complex sequences',
                  icon: '🔥',
                },
              ].map(difficulty => (
                <button
                  key={difficulty.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      difficulty: difficulty.id as AlarmDifficulty,
                    }));
                    // Clear nuclear challenges when changing difficulty
                    if (difficulty.id !== 'nuclear') {
                      setFormData(prev => ({ ...prev, nuclearChallenges: [] }));
                    }
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.difficulty === difficulty.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-300 hover:border-gray-300 dark:hover:border-dark-200'
                  }`}
                  role="radio"
                  aria-checked={formData.difficulty === difficulty.id}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg" aria-hidden="true">
                      {difficulty.icon}
                    </span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {difficulty.name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {difficulty.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Nuclear Mode Section */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (hasNuclearAccess) {
                    setFormData(prev => ({
                      ...prev,
                      difficulty:
                        formData.difficulty === 'nuclear' ? 'extreme' : 'nuclear',
                    }));
                  } else {
                    setShowNuclearModeUpgrade(true);
                  }
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                  formData.difficulty === 'nuclear'
                    ? 'border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
                    : hasNuclearAccess
                      ? 'border-gray-200 dark:border-dark-300 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                      : 'border-gray-200 dark:border-dark-300 opacity-75'
                }`}
                role="radio"
                aria-checked={formData.difficulty === 'nuclear'}
              >
                {!hasNuclearAccess && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    <Crown className="h-3 w-3" />
                    PREMIUM
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl" aria-hidden="true">
                    ☢️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        Nuclear Mode
                      </div>
                      {!hasNuclearAccess && (
                        <Lock className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Extreme challenges that guarantee you wake up
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>🧮</span> Math problems
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📸</span> Photo proof
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🗣️</span> Voice tasks
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🚶</span> Physical movement
                  </div>
                </div>

                {!hasNuclearAccess && (
                  <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Upgrade to Premium to unlock Nuclear Mode
                  </div>
                )}
              </button>

              {formData.difficulty === 'nuclear' && hasNuclearAccess && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-700 dark:text-red-300 mb-2 font-medium">
                    Nuclear Mode Configuration
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mb-3">
                    Select the challenge types you want to face:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'math', name: 'Math Problems', icon: '🧮' },
                      { id: 'memory', name: 'Memory Test', icon: '🧠' },
                      { id: 'photo', name: 'Photo Proof', icon: '📸' },
                      { id: 'voice', name: 'Voice Tasks', icon: '🗣️' },
                      { id: 'movement', name: 'Movement', icon: '🚶' },
                      { id: 'typing', name: 'Speed Typing', icon: '⌨️' },
                    ].map(challenge => (
                      <label
                        key={challenge.id}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-dark-800 rounded border hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.nuclearChallenges?.includes(challenge.id) || false
                          }
                          onChange={e => {
                            const challenges = formData.nuclearChallenges || [];
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                nuclearChallenges: [...challenges, challenge.id],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                nuclearChallenges: challenges.filter(
                                  c => c !== challenge.id
                                ),
                              }));
                            }
                          }}
                          className="text-red-500 focus:ring-red-500"
                        />
                        <span>{challenge.icon}</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {challenge.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {formData.difficulty === 'nuclear' && hasNuclearAccess && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">Nuclear Mode Active:</span>
                </div>
                <div className="text-red-600 dark:text-red-400 text-xs mt-1">
                  Snoozing will be disabled. You must complete all challenges to dismiss
                  the alarm.
                </div>
              </div>
            )}
          </fieldset>

          {/* Sound Selection */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="text-lg" aria-hidden="true">
                🔊
              </span>
              Alarm Sound
            </legend>

            {/* Sound Type Selection */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSoundTypeChange('voice-only')}
                  className={`px-3 py-2 rounded-md text-sm transition-all ${
                    formData.soundType === 'voice-only'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200'
                  }`}
                >
                  Voice Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSoundTypeChange('built-in')}
                  className={`px-3 py-2 rounded-md text-sm transition-all ${
                    formData.soundType === 'built-in'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200'
                  }`}
                >
                  Built-in Sounds
                </button>
                <button
                  type="button"
                  onClick={() => handleSoundTypeChange('custom')}
                  className={`px-3 py-2 rounded-md text-sm transition-all ${
                    formData.soundType === 'custom'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200'
                  }`}
                >
                  Custom Sounds
                </button>
              </div>
            </div>

            {/* Custom Sound Management */}
            {formData.soundType === 'custom' && (
              <div className="space-y-4">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 dark:border-dark-300 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Upload a custom alarm sound (MP3, WAV, OGG, AAC, M4A)
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingSound}
                      className="alarm-button alarm-button-secondary text-sm px-4 py-2"
                    >
                      {isUploadingSound ? 'Uploading...' : 'Choose File'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{uploadProgress.stage}</span>
                        <span>{uploadProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-dark-300 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Sounds List */}
                {customSounds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Custom Sounds
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {customSounds.map(sound => (
                        <div
                          key={sound.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            formData.customSoundId === sound.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-dark-300 hover:border-gray-300 dark:hover:border-dark-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleCustomSoundSelect(sound.id)}
                            className="flex-1 text-left"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {sound.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {Math.round(sound.duration)}s • {sound.category}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePreviewSound(sound)}
                            className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                            title={
                              previewingSound === sound.id
                                ? 'Stop preview'
                                : 'Preview sound'
                            }
                          >
                            {previewingSound === sound.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomSound(sound)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete sound"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customSounds.length === 0 && !isUploadingSound && (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                    No custom sounds yet. Upload one to get started!
                  </div>
                )}
              </div>
            )}

            {/* Built-in Sounds Selection */}
            {formData.soundType === 'built-in' && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                Built-in sound selection will be implemented here.
              </div>
            )}

            {/* Voice Only Info */}
            {formData.soundType === 'voice-only' && (
              <div className="text-center text-gray-600 dark:text-gray-400 text-sm py-2">
                Only the voice message will play based on your selected mood above.
              </div>
            )}
          </fieldset>

          {/* Snooze Settings */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">
                ⏰
              </span>
              Snooze Settings
            </legend>

            {/* Enable Snooze Toggle */}
            <div
              className={`flex items-center justify-between p-3 rounded-lg ${
                formData.difficulty === 'nuclear'
                  ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-dark-200'
              }`}
            >
              <div>
                <label
                  htmlFor="snooze-enabled"
                  className={`text-sm font-medium ${
                    formData.difficulty === 'nuclear'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Enable Snooze
                </label>
                <p
                  className={`text-xs ${
                    formData.difficulty === 'nuclear'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {formData.difficulty === 'nuclear'
                    ? 'Snoozing is automatically disabled in Nuclear Mode'
                    : 'Allow delaying the alarm when it goes off'}
                </p>
              </div>
              <button
                type="button"
                id="snooze-enabled"
                onClick={() => {
                  if (formData.difficulty !== 'nuclear') {
                    setFormData(prev => ({
                      ...prev,
                      snoozeEnabled: !prev.snoozeEnabled,
                    }));
                  }
                }}
                disabled={formData.difficulty === 'nuclear'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 ${
                  formData.difficulty === 'nuclear'
                    ? 'bg-gray-300 dark:bg-dark-300 cursor-not-allowed'
                    : formData.snoozeEnabled
                      ? 'bg-primary-600'
                      : 'bg-gray-300 dark:bg-dark-300'
                }`}
                role="switch"
                aria-checked={
                  formData.difficulty === 'nuclear' ? false : formData.snoozeEnabled
                }
                aria-label="Toggle snooze functionality"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.difficulty === 'nuclear'
                      ? 'translate-x-1'
                      : formData.snoozeEnabled
                        ? 'translate-x-6'
                        : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Snooze Interval & Max Snoozes - only show when snooze is enabled and not nuclear mode */}
            {formData.snoozeEnabled && formData.difficulty !== 'nuclear' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Snooze Interval */}
                <div className="space-y-2">
                  <label
                    htmlFor="snooze-interval"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Snooze Duration
                  </label>
                  <select
                    id="snooze-interval"
                    value={formData.snoozeInterval}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        snoozeInterval: parseInt(e.target.value),
                      }))
                    }
                    className="alarm-input text-sm"
                  >
                    <option value={1}>1 minute</option>
                    <option value={2}>2 minutes</option>
                    <option value={3}>3 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>

                {/* Max Snoozes */}
                <div className="space-y-2">
                  <label
                    htmlFor="max-snoozes"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Max Snoozes
                  </label>
                  <select
                    id="max-snoozes"
                    value={formData.maxSnoozes}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        maxSnoozes: parseInt(e.target.value),
                      }))
                    }
                    className="alarm-input text-sm"
                  >
                    <option value={1}>1 time</option>
                    <option value={2}>2 times</option>
                    <option value={3}>3 times</option>
                    <option value={5}>5 times</option>
                    <option value={10}>10 times</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>
              </div>
            )}
          </fieldset>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                announceFormCancel('Alarm creation');
                onCancel();
              }}
              className="flex-1 alarm-button alarm-button-secondary py-3"
              aria-label="Cancel alarm creation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 alarm-button alarm-button-primary py-3"
              aria-label={alarm ? 'Update existing alarm' : 'Create new alarm'}
            >
              {alarm ? 'Update' : 'Create'} Alarm
            </button>
          </div>
        </form>
      </div>

      {/* Nuclear Mode Upgrade Modal */}
      {showNuclearModeUpgrade && (
        <UpgradePrompt
          feature="nuclear_mode"
          onUpgrade={tier => {
            setShowNuclearModeUpgrade(false);
            // In a real app, redirect to upgrade flow
            console.log(`Upgrading to ${tier} for Nuclear Mode`);
          }}
          onDismiss={() => setShowNuclearModeUpgrade(false)}
        />
      )}
    </div>
  );
};

export default AlarmForm;
