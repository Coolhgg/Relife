import React, { useState, useEffect } from 'react';
import {
  Brain,
  Clock,
  Target,
  TrendingUp,
  Moon,
  Sun,
  Zap,
  ChevronRight,
  Info,
  CheckCircle,
  Alert,
} from 'lucide-react';
import {
  SmartAlarmScheduler,
  type SleepGoal,
  type UserScheduleAnalysis,
  type ScheduleRecommendation,
  type SmartAlarm,
} from '../services/smart-alarm-scheduler';

interface SmartAlarmSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  alarm?: SmartAlarm;
  onSave: (alarmData: Partial<SmartAlarm>) => void;
}

const SmartAlarmSettings: React.FC<SmartAlarmSettingsProps> = ({
  isOpen,
  onClose,
  alarm,
  onSave,
}) => {
  const [smartEnabled, setSmartEnabled] = useState(alarm?.smartEnabled ?? true);
  const [wakeWindow, setWakeWindow] = useState(alarm?.wakeWindow ?? 30);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(
    alarm?.adaptiveEnabled ?? true
  );
  const [consistency, setConsistency] = useState(alarm?.consistency ?? true);
  const [seasonalAdjustment, setSeasonalAdjustment] = useState(
    alarm?.seasonalAdjustment ?? false
  );

  const [sleepGoal, setSleepGoal] = useState<SleepGoal>({
    targetBedtime: '22:30',
    targetWakeTime: '07:00',
    targetDuration: 510,
    consistency: true,
    weekendVariation: 60,
    adaptToLifestyle: true,
  });

  const [scheduleAnalysis, setScheduleAnalysis] = useState<UserScheduleAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'smart' | 'goals' | 'analysis'>('smart');

  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setLoading(true);

        try {
          // Load existing sleep goal
          const existingGoal = SmartAlarmScheduler.getSleepGoal();
          if (existingGoal) {
            setSleepGoal(existingGoal);
          }

          // Load schedule analysis
          const analysis = await SmartAlarmScheduler.analyzeUserSchedule();
          setScheduleAnalysis(analysis);
        } catch (_error) {
          console._error('Error loading smart alarm data:', _error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [isOpen]);

  const handleSave = async () => {
    // Save sleep goal
    await SmartAlarmScheduler.setSleepGoal(sleepGoal);

    // Prepare smart alarm data
    const smartAlarmData: Partial<SmartAlarm> = {
      smartEnabled,
      wakeWindow,
      adaptiveEnabled,
      sleepGoal: sleepGoal.targetDuration,
      consistency,
      seasonalAdjustment,
    };

    onSave(smartAlarmData);
    onClose();
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getImpactColor = (impact: 'low' | 'medium' | 'high'): string => {
    switch (impact) {
      case 'low':
        return 'text-blue-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number, type: 'percentage' | 'debt'): string => {
    if (type === 'debt') {
      if (score === 0) return 'text-green-400';
      if (score < 60) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto glass">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Smart Alarm Settings
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
            { id: 'smart', label: 'Smart Features', icon: Brain },
            { id: 'goals', label: 'Sleep Goals', icon: Target },
            { id: 'analysis', label: 'Analysis', icon: TrendingUp },
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
          {activeTab === 'smart' && (
            <div className="space-y-6">
              {/* Smart Features Toggle */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Enable Smart Scheduling
                    </h3>
                    <p className="text-white/70 text-sm">
                      Automatically optimize alarm times based on your sleep cycles
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smartEnabled}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSmartEnabled(e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {smartEnabled && (
                  <div className="space-y-4">
                    {/* Wake Window */}
                    <div>
                      <label htmlFor="wake-window" className="block text-white/80 mb-2">
                        Wake Window: {wakeWindow} minutes
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="wake-window"
                          type="range"
                          min="10"
                          max="60"
                          step="5"
                          value={wakeWindow}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setWakeWindow(parseInt(e.target.value))
                          }
                          className="flex-1 accent-purple-500"
                        />
                        <div className="text-white/60 text-sm min-w-[100px]">
                          {wakeWindow < 20
                            ? 'Precise'
                            : wakeWindow < 40
                              ? 'Balanced'
                              : 'Flexible'}
                        </div>
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        How far before your set time we can wake you for optimal sleep
                        cycle alignment
                      </p>
                    </div>

                    {/* Advanced Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">
                            Adaptive Learning
                          </span>
                          <p className="text-white/60 text-xs">
                            Learn from your sleep patterns and improve over time
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={adaptiveEnabled}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setAdaptiveEnabled(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">
                            Consistency Priority
                          </span>
                          <p className="text-white/60 text-xs">
                            Favor consistent wake times over optimal sleep cycles
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consistency}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setConsistency(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">
                            Seasonal Adjustment
                          </span>
                          <p className="text-white/60 text-xs">
                            Adjust for daylight changes throughout the year
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={seasonalAdjustment}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setSeasonalAdjustment(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Smart Schedule Display */}
              {alarm?.smartSchedule && smartEnabled && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Smart Schedule Recommendation
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-white/70 text-sm">Original Time</span>
                      <div className="text-xl font-mono text-white">
                        {alarm.smartSchedule.originalTime}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Suggested Time</span>
                      <div className="text-xl font-mono text-green-400">
                        {alarm.smartSchedule.suggestedTime}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/70 text-sm">Confidence</span>
                      <span className="text-white text-sm">
                        {Math.round(alarm.smartSchedule.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${alarm.smartSchedule.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-white/80 text-sm">{alarm.smartSchedule.reason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* Sleep Duration Goal */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-blue-400" />
                  Sleep Duration Goal
                </h3>

                <div className="mb-4">
                  <label className="block text-white/80 mb-2">
                    Target Sleep Duration: {formatTime(sleepGoal.targetDuration)}
                  </label>
                  <input
                    type="range"
                    min="300"
                    max="720"
                    step="15"
                    value={sleepGoal.targetDuration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSleepGoal((prev: any) => ({
                        ...prev,
                        targetDuration: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>5h</span>
                    <span>12h</span>
                  </div>
                </div>
              </div>

              {/* Sleep Schedule */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  Target Schedule
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-white/80 mb-2">Target Bedtime</label>
                    <input
                      type="time"
                      value={sleepGoal.targetBedtime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSleepGoal((prev: any) => ({
                          ...prev,
                          targetBedtime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">Target Wake Time</label>
                    <input
                      type="time"
                      value={sleepGoal.targetWakeTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSleepGoal((prev: any) => ({
                          ...prev,
                          targetWakeTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">
                        Maintain Consistency
                      </span>
                      <p className="text-white/60 text-xs">
                        Try to keep the same schedule every day
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sleepGoal.consistency}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSleepGoal((prev: any) => ({
                            ...prev,
                            consistency: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">
                      Weekend Variation: {formatTime(sleepGoal.weekendVariation)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="15"
                      value={sleepGoal.weekendVariation}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSleepGoal((prev: any) => ({
                          ...prev,
                          weekendVariation: parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-purple-500"
                    />
                    <p className="text-white/60 text-xs mt-1">
                      How much you can vary your schedule on weekends
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center text-white/60">Loading analysis...</div>
              ) : scheduleAnalysis ? (
                <>
                  {/* Sleep Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70">Sleep Debt</span>
                        <span
                          className={`font-semibold ${getScoreColor(scheduleAnalysis.sleepDebt, 'debt')}`}
                        >
                          {scheduleAnalysis.sleepDebt === 0
                            ? 'None'
                            : formatTime(scheduleAnalysis.sleepDebt)}
                        </span>
                      </div>
                      <div className="text-xs text-white/50">
                        Accumulated sleep deficit from the last week
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70">Sleep Consistency</span>
                        <span
                          className={`font-semibold ${getScoreColor(scheduleAnalysis.sleepConsistency, 'percentage')}`}
                        >
                          {scheduleAnalysis.sleepConsistency}%
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            scheduleAnalysis.sleepConsistency >= 80
                              ? 'bg-green-400'
                              : scheduleAnalysis.sleepConsistency >= 60
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${scheduleAnalysis.sleepConsistency}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70">Average Sleep</span>
                        <span className="text-white font-semibold">
                          {formatTime(scheduleAnalysis.averageSleepDuration)}
                        </span>
                      </div>
                      <div className="text-xs text-white/50">
                        Your typical sleep duration per night
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70">Chronotype Match</span>
                        <span
                          className={`font-semibold ${getScoreColor(scheduleAnalysis.chronotypeAlignment, 'percentage')}`}
                        >
                          {scheduleAnalysis.chronotypeAlignment}%
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            scheduleAnalysis.chronotypeAlignment >= 80
                              ? 'bg-green-400'
                              : scheduleAnalysis.chronotypeAlignment >= 60
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${scheduleAnalysis.chronotypeAlignment}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {scheduleAnalysis.recommendations.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Personalized Recommendations
                      </h3>

                      <div className="space-y-3">
                        {scheduleAnalysis.recommendations.map((rec, _index) => (
                          <div
                            key={_index}
                            className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                          >
                            <div
                              className={`p-1 rounded-full ${
                                rec.impact === 'high'
                                  ? 'bg-red-500/20'
                                  : rec.impact === 'medium'
                                    ? 'bg-yellow-500/20'
                                    : 'bg-blue-500/20'
                              }`}
                            >
                              {rec.impact === 'high' ? (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              ) : rec.impact === 'medium' ? (
                                <Info className="w-4 h-4 text-yellow-400" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium mb-1">
                                {rec.description}
                              </p>
                              <p className="text-white/60 text-sm">
                                {rec.expectedImprovement}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${getImpactColor(rec.impact)} bg-current bg-opacity-20`}
                                >
                                  {rec.impact.toUpperCase()} IMPACT
                                </span>
                                {rec.timeAdjustment !== 0 && (
                                  <span className="text-xs text-white/60">
                                    {rec.timeAdjustment > 0 ? '+' : ''}
                                    {formatTime(Math.abs(rec.timeAdjustment))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <Moon className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p>Not enough sleep data for analysis.</p>
                  <p className="text-sm mt-2">
                    Use the app for a few days to see personalized insights.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white/80 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartAlarmSettings;
