import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Calendar,
  BarChart3,
  TrendingUp,
  Star,
  Plus,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import {
  SleepAnalysisService,
  type SleepSession,
  type SleepPattern,
} from '../services/sleep-analysis';

interface SleepTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SleepEntry {
  bedtime: string;
  wakeTime: string;
  quality: number;
  date: string;
}

const SleepTracker: React.FC<SleepTrackerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'insights'>('log');
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [sleepPattern, setSleepPattern] = useState<SleepPattern | null>(null);
  const [loading, setLoading] = useState(false);

  // Sleep entry form
  const [sleepEntry, setSleepEntry] = useState<SleepEntry>({
    bedtime: '22:30',
    wakeTime: '07:00',
    quality: 5,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const sessions = await SleepAnalysisService.getSleepHistory(30);
          setSleepSessions(sessions);

          const pattern = await SleepAnalysisService.analyzeSleepPatterns();
          setSleepPattern(pattern);
        } catch (error) {
          console.error('Error loading sleep data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [isOpen]);

  const handleLogSleep = async () => {
    setLoading(true);
    try {
      const bedtime = new Date(`${sleepEntry.date}T${sleepEntry.bedtime}`);
      let wakeTime = new Date(`${sleepEntry.date}T${sleepEntry.wakeTime}`);

      // If wake time is before bedtime, assume next day
      if (wakeTime < bedtime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }

      await SleepAnalysisService.trackSleepManually(
        bedtime,
        wakeTime,
        sleepEntry.quality
      );

      // Refresh data
      const sessions = await SleepAnalysisService.getSleepHistory(30);
      setSleepSessions(sessions);

      // Clear form
      setSleepEntry({
        bedtime: '22:30',
        wakeTime: '07:00',
        quality: 5,
        date: new Date().toISOString().split('T')[0],
      });

      setActiveTab('history');
    } catch (error) {
      console.error('Error logging sleep:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getQualityColor = (quality: number): string => {
    if (quality >= 8) return 'text-green-400';
    if (quality >= 6) return 'text-yellow-400';
    if (quality >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getQualityEmoji = (quality: number): string => {
    if (quality >= 9) return '😴';
    if (quality >= 7) return '😊';
    if (quality >= 5) return '😐';
    if (quality >= 3) return '😴';
    return '😵';
  };

  const calculateSleepDuration = (bedtime: string, wakeTime: string): string => {
    const bed = new Date(`2023-01-01T${bedtime}`);
    let wake = new Date(`2023-01-01T${wakeTime}`);

    if (wake < bed) {
      wake.setDate(wake.getDate() + 1);
    }

    const duration = (wake.getTime() - bed.getTime()) / (1000 * 60);
    return formatDuration(duration);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto glass">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Moon className="w-6 h-6 text-blue-400" />
            Sleep Tracker
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {[
            { id: 'log', label: 'Log Sleep', icon: Plus },
            { id: 'history', label: 'History', icon: Calendar },
            { id: 'insights', label: 'Insights', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'log' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Log Your Sleep
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="sleep-date" className="block text-white/80 mb-2">
                      Date
                    </label>
                    <input
                      id="sleep-date"
                      type="date"
                      value={sleepEntry.date}
                      onChange={e =>
                        setSleepEntry(prev => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="bedtime"
                        className="block text-white/80 mb-2 flex items-center gap-2"
                      >
                        <Moon className="w-4 h-4 text-blue-400" />
                        Bedtime
                      </label>
                      <input
                        id="bedtime"
                        type="time"
                        value={sleepEntry.bedtime}
                        onChange={e =>
                          setSleepEntry(prev => ({ ...prev, bedtime: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="wake-time"
                        className="block text-white/80 mb-2 flex items-center gap-2"
                      >
                        <Sun className="w-4 h-4 text-yellow-400" />
                        Wake Time
                      </label>
                      <input
                        id="wake-time"
                        type="time"
                        value={sleepEntry.wakeTime}
                        onChange={e =>
                          setSleepEntry(prev => ({ ...prev, wakeTime: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sleep-quality" className="block text-white/80 mb-2">
                      Sleep Quality: {sleepEntry.quality}/10{' '}
                      {getQualityEmoji(sleepEntry.quality)}
                    </label>
                    <input
                      id="sleep-quality"
                      type="range"
                      min="1"
                      max="10"
                      value={sleepEntry.quality}
                      onChange={e =>
                        setSleepEntry(prev => ({
                          ...prev,
                          quality: parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>Terrible</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Sleep Duration</span>
                      <span className="text-white font-mono text-lg">
                        {calculateSleepDuration(
                          sleepEntry.bedtime,
                          sleepEntry.wakeTime
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogSleep}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {loading ? 'Logging Sleep...' : 'Log Sleep Session'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Recent Sleep Sessions
                </h3>
                <span className="text-white/60 text-sm">
                  {sleepSessions.length} sessions recorded
                </span>
              </div>

              {loading ? (
                <div className="text-center text-white/60 py-8">
                  Loading sleep history...
                </div>
              ) : sleepSessions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sleepSessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {session.bedtime.toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(session.sleepQuality / 2)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-400'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-mono ${getQualityColor(session.sleepQuality)}`}
                        >
                          {session.sleepQuality}/10
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-white/60 flex items-center gap-1">
                            <Moon className="w-3 h-3" />
                            Bedtime
                          </span>
                          <span className="text-white font-mono">
                            {formatTime(session.bedtime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60 flex items-center gap-1">
                            <Sun className="w-3 h-3" />
                            Wake Time
                          </span>
                          <span className="text-white font-mono">
                            {formatTime(session.wakeTime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Duration
                          </span>
                          <span className="text-white font-mono">
                            {formatDuration(session.sleepDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <Moon className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p>No sleep sessions recorded yet.</p>
                  <p className="text-sm mt-2">
                    Start logging your sleep to see your history here.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center text-white/60 py-8">
                  Analyzing sleep patterns...
                </div>
              ) : sleepPattern ? (
                <>
                  {/* Sleep Pattern Summary */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Sleep Pattern Analysis
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {formatDuration(sleepPattern.averageSleepDuration)}
                        </div>
                        <div className="text-white/60 text-sm">Average Sleep</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {sleepPattern.averageBedtime}
                        </div>
                        <div className="text-white/60 text-sm">Avg Bedtime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {sleepPattern.averageWakeTime}
                        </div>
                        <div className="text-white/60 text-sm">Avg Wake Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {sleepPattern.averageSleepQuality.toFixed(1)}
                        </div>
                        <div className="text-white/60 text-sm">Avg Quality</div>
                      </div>
                    </div>
                  </div>

                  {/* Chronotype */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Your Chronotype
                    </h3>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-sm font-medium">
                        {sleepPattern.chronotype.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>

                    <p className="text-white/80 text-sm mb-3">
                      {sleepPattern.chronotype === 'extreme_early' &&
                        "You're an extreme early bird! You naturally want to sleep and wake very early."}
                      {sleepPattern.chronotype === 'early' &&
                        "You're an early bird! You prefer going to bed and waking up earlier than most people."}
                      {sleepPattern.chronotype === 'normal' &&
                        'You have a normal chronotype! Your sleep schedule aligns with typical social hours.'}
                      {sleepPattern.chronotype === 'late' &&
                        "You're a night owl! You prefer staying up later and waking up later than most people."}
                      {sleepPattern.chronotype === 'extreme_late' &&
                        "You're an extreme night owl! You naturally want to sleep and wake very late."}
                    </p>
                  </div>

                  {/* Weekday vs Weekend Patterns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-3">Weekday Pattern</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Bedtime</span>
                          <span className="text-white font-mono">
                            {sleepPattern.weekdayPattern.bedtime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Wake Time</span>
                          <span className="text-white font-mono">
                            {sleepPattern.weekdayPattern.wakeTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Duration</span>
                          <span className="text-white font-mono">
                            {formatDuration(sleepPattern.weekdayPattern.sleepDuration)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Quality</span>
                          <span className="text-white font-mono">
                            {sleepPattern.weekdayPattern.sleepQuality.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-3">Weekend Pattern</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Bedtime</span>
                          <span className="text-white font-mono">
                            {sleepPattern.weekendPattern.bedtime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Wake Time</span>
                          <span className="text-white font-mono">
                            {sleepPattern.weekendPattern.wakeTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Duration</span>
                          <span className="text-white font-mono">
                            {formatDuration(sleepPattern.weekendPattern.sleepDuration)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Quality</span>
                          <span className="text-white font-mono">
                            {sleepPattern.weekendPattern.sleepQuality.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sleep Metrics */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Sleep Metrics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/70">Sleep Latency</span>
                          <span className="text-white font-mono">
                            {formatDuration(sleepPattern.sleepLatency)}
                          </span>
                        </div>
                        <div className="text-xs text-white/50 mb-3">
                          Time it takes you to fall asleep
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/70">Sleep Efficiency</span>
                          <span className="text-white font-mono">
                            {sleepPattern.sleepEfficiency.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-white/50 mb-3">
                          Percentage of time in bed actually sleeping
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : sleepSessions.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p>No sleep data to analyze yet.</p>
                  <p className="text-sm mt-2">
                    Log a few sleep sessions to see detailed insights.
                  </p>
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <p>Not enough sleep data for comprehensive analysis.</p>
                  <p className="text-sm mt-2">
                    Log more sleep sessions to see detailed patterns and insights.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SleepTracker;
