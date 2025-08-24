import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Zap, Clock, Star, MessageCircle } from 'lucide-react';
import type {
  EmotionalNotificationPayload,
  EmotionalResponse,
  EmotionType,
} from '../types/emotional';
import { useEmotionalNotificationResponse } from '../hooks/useEmotionalNotifications';
import { TimeoutHandle } from '../types/timers';

interface EmotionalNudgeModalProps {
  notification: EmotionalNotificationPayload | null;
  isVisible: boolean;
  onClose: () => void;
  onResponse: (response: EmotionalResponse) => void;
  className?: string;
}

// Lottie animation component (placeholder - would use actual Lottie React)
const EmotionalAnimation: React.FC<{ emotion: EmotionType; className?: string }> = ({
  emotion,
  className = 'w-24 h-24',
}) => {
  const animations = {
    happy: '😊',
    excited: '🎉',
    sad: '😢',
    worried: '😟',
    lonely: '🤗',
    proud: '🏆',
    sleepy: '😴',
  };

  return (
    <div
      className={`${className} flex items-center justify-center text-6xl animate-bounce`}
    >
      {animations[emotion]}
    </div>
  );
};

export const EmotionalNudgeModal: React.FC<EmotionalNudgeModalProps> = ({
  notification,
  isVisible,
  onClose,
  onResponse,
  className = '',
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [effectivenessRating, setEffectivenessRating] = useState<number | null>(null);

  const { handleResponse } = useEmotionalNotificationResponse(notification, onResponse);

  // Close modal after 30 seconds if no interaction
  useEffect(() => {
    if (!isVisible || !notification) return;

    const timeout = setTimeout(() => {
      handleResponse('none');
      onClose();
    }, 30000);

    return () => clearTimeout(timeout);
  }, [isVisible, notification, handleResponse, onClose]);

  if (!notification || !isVisible) {
    return null;
  }

  const { emotion, tone, message, escalationLevel } = notification;

  // Get theme colors based on emotion
  const getEmotionTheme = (emotion: EmotionType) => {
    const themes = {
      happy: {
        bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-yellow-300',
      },
      excited: {
        bg: 'bg-gradient-to-br from-purple-500 to-pink-600',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-purple-300',
      },
      sad: {
        bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-blue-300',
      },
      worried: {
        bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-amber-300',
      },
      lonely: {
        bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-indigo-300',
      },
      proud: {
        bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-green-300',
      },
      sleepy: {
        bg: 'bg-gradient-to-br from-slate-600 to-slate-800',
        text: 'text-white',
        accent: 'bg-white/20',
        ring: 'ring-slate-300',
      },
    };

    return themes[emotion] || themes.happy;
  };

  const theme = getEmotionTheme(emotion);

  // Get main CTA text based on emotion and escalation
  const getMainCTA = () => {
    const ctas = {
      sad: escalationLevel === 'gentle' ? '💙 Try again' : '💪 Restart journey',
      worried: escalationLevel === 'gentle' ? '🌱 Small step' : '⚡ Take action',
      happy: '⭐ Keep going',
      excited: '🚀 Continue streak',
      lonely: '🤗 Start together',
      proud: '👑 Next milestone',
      sleepy: escalationLevel === 'gentle' ? '☀️ Gentle start' : '⏰ Wake up call',
    };

    return ctas[emotion] || "✨ Let's go";
  };

  // Handle main action
  const handleMainAction = () => {
    handleResponse('completed_task', effectivenessRating || undefined);
    onClose();
  };

  // Handle snooze
  const handleSnooze = () => {
    handleResponse('snoozed');
    onClose();
  };

  // Handle dismiss
  const handleDismiss = () => {
    handleResponse('dismissed', effectivenessRating || undefined);
    onClose();
  };

  // Handle feedback toggle
  const handleFeedbackToggle = () => {
    setShowFeedback(!showFeedback);
  };

  // Handle effectiveness rating
  const handleRating = (rating: number) => {
    setEffectivenessRating(rating);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => {
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`
              ${theme.bg} ${theme.text}
              rounded-2xl shadow-2xl max-w-md w-full mx-4
              relative overflow-hidden
              ${className}
            `}
          >
            {/* Header */}
            <div className="relative p-6 text-center">
              <button
                onClick={handleDismiss}
                className={`
                  absolute top-4 right-4 p-2 rounded-full
                  ${theme.accent} hover:bg-white/30
                  transition-colors duration-200
                `}
                aria-label="Close"
              >
                <X size={20} />
              </button>

              {/* Animated emotion icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200 }}
                className="mb-4"
              >
                <EmotionalAnimation emotion={emotion} className="w-20 h-20 mx-auto" />
              </motion.div>

              {/* Emotion indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`
                  inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                  ${theme.accent} mb-3
                `}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-70" />
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)} • {tone}
              </motion.div>

              {/* Main message */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-bold mb-3 leading-tight"
              >
                {message.personalizedMessage}
              </motion.h3>

              {/* Escalation level indicator */}
              {escalationLevel !== 'gentle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-1 text-sm opacity-75 mb-4"
                >
                  {escalationLevel === 'strong_emotional' && <Zap size={16} />}
                  {escalationLevel === 'social_pressure' && <Heart size={16} />}
                  {escalationLevel === 'major_reset' && <Star size={16} />}
                  <span className="capitalize">
                    {escalationLevel.replace('_', ' ')}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Feedback section */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-4"
                >
                  <div className={`${theme.accent} rounded-lg p-4`}>
                    <p className="text-sm font-medium mb-3">How was this message?</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleRating(rating)}
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            transition-all duration-200 transform hover:scale-110
                            ${
                              effectivenessRating === rating
                                ? 'bg-white text-gray-800 shadow-lg'
                                : 'bg-white/20 hover:bg-white/30'
                            }
                          `}
                        >
                          <Star
                            size={16}
                            fill={
                              effectivenessRating === rating ? 'currentColor' : 'none'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              {/* Main action button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleMainAction}
                className={`
                  w-full py-4 px-6 bg-white text-gray-800 rounded-xl font-semibold
                  shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                  transition-all duration-200 active:scale-[0.98]
                  flex items-center justify-center gap-2
                `}
              >
                {getMainCTA()}
              </motion.button>

              {/* Secondary actions */}
              <div className="flex gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleSnooze}
                  className={`
                    flex-1 py-3 px-4 ${theme.accent} rounded-lg font-medium
                    hover:bg-white/30 transition-colors duration-200
                    flex items-center justify-center gap-2
                  `}
                >
                  <Clock size={16} />
                  Later
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={handleFeedbackToggle}
                  className={`
                    flex-1 py-3 px-4 ${theme.accent} rounded-lg font-medium
                    hover:bg-white/30 transition-colors duration-200
                    flex items-center justify-center gap-2
                    ${showFeedback ? 'bg-white/30' : ''}
                  `}
                >
                  <MessageCircle size={16} />
                  Feedback
                </motion.button>
              </div>
            </div>

            {/* Progress indicator for auto-close */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 30, ease: 'linear' }}
              className="h-1 bg-white/30 absolute bottom-0 left-0"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Settings component for emotional notification preferences
export const EmotionalNotificationSettings: React.FC<{
  settings: any;
  onUpdate: (settings: any) => void;
}> = ({ settings, onUpdate }) => {
  const handleToneChange = (tone: string) => {
    onUpdate({ ...settings, preferredTone: tone });
  };

  const handleIntensityChange = (intensity: string) => {
    onUpdate({ ...settings, intensityLevel: intensity });
  };

  const handleFrequencyChange = (frequency: string) => {
    onUpdate({ ...settings, frequency });
  };

  const handleRoastModeToggle = () => {
    onUpdate({ ...settings, roastModeEnabled: !settings.roastModeEnabled });
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">
        Emotional Notification Settings
      </h3>

      {/* Preferred Tone */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Motivation Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: 'encouraging',
              label: '😊 Encouraging friend',
              desc: 'Supportive and caring',
            },
            { value: 'playful', label: '🎮 Playful buddy', desc: 'Fun and energetic' },
            { value: 'firm', label: '💪 Firm coach', desc: 'Direct and motivating' },
            {
              value: 'roast',
              label: '😈 Savage roast',
              desc: 'Brutally honest (18+)',
              disabled: !settings.roastModeEnabled,
            },
          ].map(tone => (
            <button
              key={tone.value}
              onClick={() => handleToneChange(tone.value)}
              disabled={tone.disabled}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${
                  settings.preferredTone === tone.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }
                ${tone.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
              `}
            >
              <div className="font-medium text-sm">{tone.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tone.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Roast Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div>
          <div className="font-medium text-orange-900">Roast Mode</div>
          <div className="text-sm text-orange-700">
            Enable brutally honest notifications (requires age verification)
          </div>
        </div>
        <button
          onClick={handleRoastModeToggle}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${settings.roastModeEnabled ? 'bg-orange-500' : 'bg-gray-300'}
          `}
        >
          <div
            className={`
              absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
              ${settings.roastModeEnabled ? 'translate-x-6' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>

      {/* Intensity Level */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Emotional Intensity
        </label>
        <div className="flex gap-3">
          {[
            { value: 'soft', label: 'Soft' },
            { value: 'medium', label: 'Medium' },
            { value: 'strong', label: 'Strong' },
          ].map(intensity => (
            <button
              key={intensity.value}
              onClick={() => handleIntensityChange(intensity.value)}
              className={`
                flex-1 py-2 px-4 rounded-lg border-2 transition-all duration-200
                ${
                  settings.intensityLevel === intensity.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {intensity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Notification Frequency
        </label>
        <div className="flex gap-3">
          {[
            { value: 'daily', label: 'Daily' },
            { value: 'every2days', label: 'Every 2 days' },
            { value: 'weekly', label: 'Weekly' },
          ].map(freq => (
            <button
              key={freq.value}
              onClick={() => handleFrequencyChange(freq.value)}
              className={`
                flex-1 py-2 px-4 rounded-lg border-2 transition-all duration-200
                ${
                  settings.frequency === freq.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {freq.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default EmotionalNudgeModal;
