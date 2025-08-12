import { useState, useEffect } from 'react';
import { X, Clock, Tag, Calendar, Volume2 } from 'lucide-react';
import type { Alarm, VoiceMood } from '../types';
import { VOICE_MOODS, DAYS_OF_WEEK } from '../utils';
import { validateAlarmData, type AlarmValidationErrors } from '../utils/validation';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAlarmData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors({});
    onSave({ ...formData, voiceMood: selectedVoiceMood });
  };

  const toggleDay = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayId)
        ? prev.days.filter(d => d !== dayId)
        : [...prev.days, dayId].sort()
    }));
  };

  const handleVoiceMoodSelect = (mood: VoiceMood) => {
    setSelectedVoiceMood(mood);
  };

  const selectedMoodConfig = VOICE_MOODS.find(vm => vm.id === selectedVoiceMood);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white dark:bg-dark-800 w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {alarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* General Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              Time
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className={`alarm-input text-2xl font-mono ${errors.time ? 'border-red-500 focus:border-red-500' : ''}`}
              required
            />
            {errors.time && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.time}</div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag className="w-4 h-4" />
              Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Wake up time!"
              className={`alarm-input ${errors.label ? 'border-red-500 focus:border-red-500' : ''}`}
              maxLength={100}
              required
            />
            {errors.label && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.label}</div>
            )}
          </div>

          {/* Days */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              Days
            </label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.days.includes(day.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-300'
                  } ${errors.days ? 'ring-2 ring-red-500' : ''}`}
                >
                  {day.short}
                </button>
              ))}
            </div>
            {errors.days && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.days}</div>
            )}
          </div>

          {/* Voice Mood */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Volume2 className="w-4 h-4" />
              Voice Mood
            </label>
            
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
            <div className="grid grid-cols-2 gap-3">
              {VOICE_MOODS.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleVoiceMoodSelect(mood.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedVoiceMood === mood.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-300 hover:border-gray-300 dark:hover:border-dark-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{mood.icon}</span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {mood.name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {mood.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 alarm-button alarm-button-secondary py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 alarm-button alarm-button-primary py-3"
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