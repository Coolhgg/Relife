import { useState, useEffect, useRef } from 'react';
import { X, Clock, Tag, Calendar, Volume2 } from 'lucide-react';
import type { Alarm, VoiceMood } from '../types';
import { VOICE_MOODS, DAYS_OF_WEEK } from '../utils';
import { validateAlarmData, type AlarmValidationErrors } from '../utils/validation';
import { useDynamicFocus } from '../hooks/useDynamicFocus';
import { useFormAnnouncements } from '../hooks/useFormAnnouncements';
import { useFocusAnnouncements } from '../hooks/useScreenReaderAnnouncements';

interface AlarmFormProps {
  alarm?: Alarm | null;
  onSave: (data: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
  }) => void;
  onCancel: () => void;
}

const AlarmForm: React.FC<AlarmFormProps> = ({ alarm, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    time: alarm?.time || '07:00',
    label: alarm?.label || '',
    days: alarm?.days || [1, 2, 3, 4, 5], // Default to weekdays
    voiceMood: alarm?.voiceMood || ('motivational' as VoiceMood)
  });
  
  const [errors, setErrors] = useState<AlarmValidationErrors>({});
  const [selectedVoiceMood, setSelectedVoiceMood] = useState(formData.voiceMood);
  const [errorAnnouncement, setErrorAnnouncement] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);
  
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
    announceFieldDescription
  } = useFormAnnouncements();
  
  const { announceEnter } = useFocusAnnouncements('Alarm Form');

  useEffect(() => {
    if (alarm) {
      setFormData({
        time: alarm.time,
        label: alarm.label,
        days: alarm.days,
        voiceMood: alarm.voiceMood
      });
      setSelectedVoiceMood(alarm.voiceMood);
    }
  }, [alarm]);

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
  const handleVoiceMoodKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, mood: VoiceMood) => {
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
        const fieldElement = formRef.current?.querySelector(`[name="${field}"]`) as HTMLElement;
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
    announceSuccess(alarm ? 'Alarm updated successfully' : 'Alarm created successfully');
    announceFormSuccess(alarm ? 'update' : 'create', 'Alarm');
    onSave({ ...formData, voiceMood: selectedVoiceMood });
  };

  const toggleDay = (dayId: number) => {
    setFormData(prev => {
      const newDays = prev.days.includes(dayId)
        ? prev.days.filter(d => d !== dayId)
        : [...prev.days, dayId].sort();
      
      // Announce the day toggle
      const dayName = DAYS_OF_WEEK.find(d => d.id === dayId)?.name || 'Day';
      const isSelected = newDays.includes(dayId);
      announceDayToggle(dayName, isSelected, newDays.length);
      
      return {
        ...prev,
        days: newDays
      };
    });
  };

  const handleVoiceMoodSelect = (mood: VoiceMood) => {
    setSelectedVoiceMood(mood);
    announceVoiceMoodSelection(mood);
  };

  const selectedMoodConfig = VOICE_MOODS.find(vm => vm.id === selectedVoiceMood);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-form-title"
    >
      {/* Screen reader announcement for errors */}
      {errorAnnouncement && (
        <div 
          role="alert" 
          aria-live="assertive" 
          className="sr-only"
        >
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
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </button>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className="p-4 space-y-6"
          noValidate
          aria-describedby={Object.keys(errors).length > 0 ? "form-errors" : undefined}
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
                <ul className="space-y-1">
                  {errors.time && <li>• Time: {errors.time}</li>}
                  {errors.label && <li>• Label: {errors.label}</li>}
                  {errors.days && <li>• Days: {errors.days}</li>}
                  {errors.voiceMood && <li>• Voice Mood: {errors.voiceMood}</li>}
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
              onChange={(e) => {
                const newTime = e.target.value;
                setFormData(prev => ({ ...prev, time: newTime }));
                announceFieldChange({
                  fieldName: 'Alarm time',
                  newValue: newTime,
                  fieldType: 'time'
                }, 0); // No debounce for time input
              }}
              onBlur={() => {
                // Validate on blur
                if (formData.time) {
                  announceFieldValidation('Time', true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'F1') {
                  e.preventDefault();
                  announceFieldDescription('Alarm time', formData.time, 'Set the time for your alarm using 24-hour format');
                }
              }}
              className={`alarm-input text-2xl font-mono ${errors.time ? 'border-red-500 focus:border-red-500' : ''}`}
              required
              aria-invalid={errors.time ? 'true' : 'false'}
              aria-describedby={errors.time ? 'time-error' : 'time-help'}
              ref={errors.time ? firstErrorRef : undefined}
            />
            <div id="time-help" className="sr-only">Press F1 for field description</div>
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
              onChange={(e) => {
                const newLabel = e.target.value;
                setFormData(prev => ({ ...prev, label: newLabel }));
                announceFieldChange({
                  fieldName: 'Alarm label',
                  newValue: newLabel,
                  fieldType: 'text'
                }, 500); // Debounce for text input
              }}
              onBlur={() => {
                // Validate on blur
                if (formData.label.trim()) {
                  announceFieldValidation('Label', true);
                } else {
                  announceFieldValidation('Label', false, 'Label is required');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'F1') {
                  e.preventDefault();
                  announceFieldDescription('Alarm label', formData.label, 'Give your alarm a descriptive name to help you identify it', 'Maximum 100 characters');
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
            <div id="label-help" className="sr-only">Press F1 for field description. Character count: {formData.label.length}/100</div>
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
              <div id="days-legend" className="sr-only">Select the days for your alarm to repeat</div>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDay(day.id);
                    } else if (e.key === 'F1') {
                      e.preventDefault();
                      const selectedDays = DAYS_OF_WEEK.filter(d => formData.days.includes(d.id)).map(d => d.name).join(', ');
                      announceFieldDescription('Days selection', selectedDays || 'None', 'Select which days of the week this alarm should repeat');
                    }
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 ${
                    formData.days.includes(day.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-300'
                  } ${errors.days ? 'ring-2 ring-red-500' : ''}`}
                  aria-pressed={formData.days.includes(day.id)}
                  aria-label={`${day.name} - ${formData.days.includes(day.id) ? 'selected' : 'not selected'}`}
                  role="switch"
                >
                  <span aria-hidden="true">{day.short}</span>
                  <span className="sr-only">{day.name}</span>
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
              <div id="voice-mood-legend" className="sr-only">Select a voice mood for your alarm</div>
              {VOICE_MOODS.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleVoiceMoodSelect(mood.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleVoiceMoodSelect(mood.id);
                    } else if (e.key === 'F1') {
                      e.preventDefault();
                      const selectedMoodName = VOICE_MOODS.find(m => m.id === selectedVoiceMood)?.name || 'None';
                      announceFieldDescription('Voice mood', selectedMoodName, 'Select the tone and style for your alarm wake-up message', VOICE_MOODS.map(m => m.name).join(', '));
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
                    <span className="text-lg" aria-hidden="true">{mood.icon}</span>
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
    </div>
  );
};

export default AlarmForm;