import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Battery,
  Star,
  Coffee,
  Moon,
  Sun
} from 'lucide-react';
import { type WakeUpFeedback } from '../services/enhanced-smart-alarm-scheduler';

interface WakeUpFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarmId: string;
  alarmTime: string;
  actualWakeTime?: string;
  onSubmit: (feedback: WakeUpFeedback) => Promise<boolean>;
}

const difficultyOptions = [
  { value: 'very_easy', label: 'Very Easy', icon: '😴', color: 'text-green-400' },
  { value: 'easy', label: 'Easy', icon: '😌', color: 'text-green-300' },
  { value: 'normal', label: 'Normal', icon: '😐', color: 'text-yellow-400' },
  { value: 'hard', label: 'Hard', icon: '😫', color: 'text-orange-400' },
  { value: 'very_hard', label: 'Very Hard', icon: '😵', color: 'text-red-400' }
];

const feelingOptions = [
  { value: 'terrible', label: 'Terrible', icon: '😩', color: 'text-red-500' },
  { value: 'tired', label: 'Tired', icon: '😴', color: 'text-orange-400' },
  { value: 'okay', label: 'Okay', icon: '😐', color: 'text-yellow-400' },
  { value: 'good', label: 'Good', icon: '😊', color: 'text-green-400' },
  { value: 'excellent', label: 'Excellent', icon: '🤩', color: 'text-green-500' }
];

const WakeUpFeedbackModal: React.FC<WakeUpFeedbackModalProps> = ({
  isOpen,
  onClose,
  alarmId,
  alarmTime,
  actualWakeTime,
  onSubmit
}) => {
  const [feedback, setFeedback] = useState<Partial<WakeUpFeedback>>({
    date: new Date(),
    originalTime: alarmTime,
    actualWakeTime: actualWakeTime || new Date().toTimeString().slice(0, 5),
    difficulty: 'normal',
    feeling: 'okay',
    sleepQuality: 5,
    timeToFullyAwake: 15,
    wouldPreferEarlier: false,
    wouldPreferLater: false,
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFeedback({
        date: new Date(),
        originalTime: alarmTime,
        actualWakeTime: actualWakeTime || new Date().toTimeString().slice(0, 5),
        difficulty: 'normal',
        feeling: 'okay',
        sleepQuality: 5,
        timeToFullyAwake: 15,
        wouldPreferEarlier: false,
        wouldPreferLater: false,
        notes: ''
      });
      setSubmitted(false);
    }
  }, [isOpen, alarmTime, actualWakeTime]);

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const success = await onSubmit(feedback as WakeUpFeedback);
      if (success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateFeedback = (updates: Partial<WakeUpFeedback>) => {
    setFeedback(prev => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full text-center glass">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
          <p className="text-white/70">
            Your feedback helps improve your smart alarm experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto glass">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            How did you wake up?
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Time Info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/70">Alarm Time</span>
                <div className="text-white font-mono text-lg">{feedback.originalTime}</div>
              </div>
              <div>
                <span className="text-white/70">Actual Wake Time</span>
                <input
                  type="time"
                  value={feedback.actualWakeTime}
                  onChange={(e) => updateFeedback({ actualWakeTime: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Wake Up Difficulty */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Battery className="w-4 h-4 text-yellow-400" />
              How difficult was it to wake up?
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {difficultyOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateFeedback({ difficulty: option.value as any })}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    feedback.difficulty === option.value
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className={`text-xs ${option.color}`}>{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Overall Feeling */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              How do you feel overall?
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {feelingOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateFeedback({ feeling: option.value as any })}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    feedback.feeling === option.value
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className={`text-xs ${option.color}`}>{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Quality */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" />
              Sleep Quality: {feedback.sleepQuality}/10
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Poor</span>
              <input
                type="range"
                min="1"
                max="10"
                value={feedback.sleepQuality}
                onChange={(e) => updateFeedback({ sleepQuality: parseInt(e.target.value) })}
                className="flex-1 accent-purple-500"
              />
              <span className="text-white/60 text-sm">Excellent</span>
            </div>

            {/* Visual stars */}
            <div className="flex justify-center gap-1 mt-2">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < (feedback.sleepQuality || 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Time to Fully Awake */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-orange-400" />
              Time to fully wake up: {feedback.timeToFullyAwake} minutes
            </h3>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={feedback.timeToFullyAwake}
              onChange={(e) => updateFeedback({ timeToFullyAwake: parseInt(e.target.value) })}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Instantly</span>
              <span>1 hour</span>
            </div>
          </div>

          {/* Time Preference */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Time Preference
            </h3>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedback.wouldPreferEarlier}
                  onChange={(e) => updateFeedback({
                    wouldPreferEarlier: e.target.checked,
                    wouldPreferLater: e.target.checked ? false : feedback.wouldPreferLater
                  })}
                  className="rounded text-purple-500 focus:ring-purple-400"
                />
                <ThumbsUp className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">Wake me earlier</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedback.wouldPreferLater}
                  onChange={(e) => updateFeedback({
                    wouldPreferLater: e.target.checked,
                    wouldPreferEarlier: e.target.checked ? false : feedback.wouldPreferEarlier
                  })}
                  className="rounded text-purple-500 focus:ring-purple-400"
                />
                <ThumbsDown className="w-4 h-4 text-red-400" />
                <span className="text-white text-sm">Wake me later</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-white font-medium mb-3">Additional Notes (optional)</h3>
            <textarea
              value={feedback.notes}
              onChange={e => updateFeedback({ notes: e.target.value })}
              placeholder="Any additional thoughts about your wake-up experience..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WakeUpFeedbackModal;