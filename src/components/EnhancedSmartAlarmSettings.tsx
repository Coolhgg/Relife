import React, { useState, useEffect } from 'react';
import {
  Brain,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Settings,
  Activity,
  CloudRain,
  Calendar,
  Moon,
  Coffee,
  Smartphone,
  Heart,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import {
  EnhancedSmartAlarmScheduler,
  type EnhancedSmartAlarm,
  type ConditionBasedAdjustment,
  type OptimalTimeSlot,
  type SmartAlarmMetrics,
  type WakeUpFeedback,
  type SmartRecommendation,
} from '../services/enhanced-smart-alarm-scheduler';
import {
  AdvancedConditionsHelper,
  QuickSetupScripts,
  CUSTOM_CONDITION_TEMPLATES,
} from '../services/advanced-conditions-helper';

interface EnhancedSmartAlarmSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  alarm?: EnhancedSmartAlarm;
  onSave: (alarmData: Partial<EnhancedSmartAlarm>) => void;
}

const conditionIcons: Record<string, React.ComponentType<any>> = {
  weather: CloudRain,
  calendar: Calendar,
  sleep_debt: Moon,
  stress_level: Heart,
  exercise: Activity,
  caffeine: Coffee,
  screen_time: Smartphone,
};

const EnhancedSmartAlarmSettings: React.FC<EnhancedSmartAlarmSettingsProps> = ({
  isOpen,
  onClose,
  alarm,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<
    'quick' | 'smart' | 'conditions' | 'optimization' | 'feedback' | 'metrics'
  >('quick');
  const [loading, setLoading] = useState(false);

  // Smart settings
  const [smartEnabled, setSmartEnabled] = useState(alarm?.smartEnabled ?? true);
  const [realTimeAdaptation, setRealTimeAdaptation] = useState(
    alarm?.realTimeAdaptation ?? true
  );
  const [dynamicWakeWindow, setDynamicWakeWindow] = useState(
    alarm?.dynamicWakeWindow ?? true
  );
  const [sleepPatternWeight, setSleepPatternWeight] = useState(
    alarm?.sleepPatternWeight ?? 0.7
  );
  const [learningFactor, setLearningFactor] = useState(alarm?.learningFactor ?? 0.3);

  // Condition settings
  const [conditions, setConditions] = useState<ConditionBasedAdjustment[]>(
    alarm?.conditionBasedAdjustments || []
  );

  // Optimization data
  const [optimalTimes, setOptimalTimes] = useState<OptimalTimeSlot[]>([]);
  const [metrics, setMetrics] = useState<SmartAlarmMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);

  useEffect(() => {
    if (isOpen && alarm) {
      loadOptimizationData();
    }
  }, [isOpen, alarm?.id]);

  const loadOptimizationData = async () => {
    if (!alarm) return;

    setLoading(true);
    try {
      // Load optimal times
      const times = await EnhancedSmartAlarmScheduler.calculateOptimalTimeSlots(alarm);
      setOptimalTimes(times);

      // Load metrics
      const alarmMetrics = await EnhancedSmartAlarmScheduler.getSmartAlarmMetrics(
        alarm.id
      );
      setMetrics(alarmMetrics);

      if (alarmMetrics) {
        setRecommendations(alarmMetrics.recommendedAdjustments);
      }
    } catch (error) {
      console.error('Error loading optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const enhancedData: Partial<EnhancedSmartAlarm> = {
      smartEnabled,
      realTimeAdaptation,
      dynamicWakeWindow,
      sleepPatternWeight,
      learningFactor,
      conditionBasedAdjustments: conditions,
    };

    onSave(enhancedData);
    onClose();
  };

  const updateCondition = (id: string, updates: Partial<ConditionBasedAdjustment>) => {
    /* auto: implicit any */
    setConditions((prev: any) => 
      prev.map((cond: any) => (cond.id === id ? { ...cond, ...updates } : cond))
    );
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
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

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '+';
    return `${sign}${hours}h ${mins}m`;
  };

  const formatAdjustment = (minutes: number): string => {
    const sign = minutes > 0 ? '+' : '';
    return `${sign}${minutes}min`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto glass">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Enhanced Smart Alarm
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
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1 overflow-x-auto">
          {[
            { id: 'quick', label: 'Quick Setup', icon: Lightbulb },
            { id: 'smart', label: 'Smart Mode', icon: Brain },
            { id: 'conditions', label: 'Conditions', icon: Settings },
            { id: 'optimization', label: 'Optimization', icon: Zap },
            { id: 'feedback', label: 'Feedback', icon: TrendingUp },
            { id: 'metrics', label: 'Analytics', icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
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
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* Custom Configuration Card */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-400/30">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Your Custom Smart Alarm Setup
                  </h3>
                </div>
                <p className="text-white/80 mb-6">
                  Apply your personalized configuration with 4 intelligent conditions
                  for optimal morning routines.
                </p>

                {/* Configuration Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(CUSTOM_CONDITION_TEMPLATES).map(([id, condition]) => {
                    const IconComponent = conditionIcons[condition.type] || Settings;
                    return (
                      <div
                        key={id}
                        className="bg-white/10 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5 text-purple-400" />
                          <span className="text-white font-medium capitalize">
                            {condition.id.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mb-2">
                          {condition.adjustment.reason}
                        </p>
                        <div className="text-purple-300 text-sm">
                          {condition.adjustment.timeMinutes > 0 ? '+' : ''}
                          {condition.adjustment.timeMinutes} minutes
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Apply Configuration Button */}
                <button
                  onClick={async () => {
                    if (!alarm) return;
                    setLoading(true);
                    try {
                      await QuickSetupScripts.applyUserCustomConfiguration(alarm.id);
                      // Refresh the alarm data
                      const updatedAlarm =
                        await EnhancedSmartAlarmScheduler.getSmartAlarm(alarm.id);
                      if (updatedAlarm) {
                        setConditions(updatedAlarm.conditionBasedAdjustments || []);
                        setSmartEnabled(updatedAlarm.smartEnabled);
                      }
                      alert(
                        '✅ Your custom configuration has been applied successfully!'
                      );
                    } catch (error) {
                      console.error('Setup failed:', error);
                      alert('❌ Setup failed. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !alarm}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Applying Configuration...
                    </div>
                  ) : (
                    'Apply Custom Configuration'
                  )}
                </button>
              </div>

              {/* Alternative Setup Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    New User Setup
                  </h4>
                  <p className="text-white/70 text-sm mb-4">
                    Conservative settings for first-time smart alarm users
                  </p>
                  <button
                    onClick={async () => {
                      if (!alarm) return;
                      setLoading(true);
                      try {
                        await QuickSetupScripts.setupNewUser(alarm.id);
                        alert('✅ New user setup complete!');
                      } catch (error) {
                        alert('❌ Setup failed. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || !alarm}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-all disabled:opacity-50"
                  >
                    Apply Conservative Setup
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Reset to Defaults
                  </h4>
                  <p className="text-white/70 text-sm mb-4">
                    Clear all conditions and reset to basic settings
                  </p>
                  <button
                    onClick={async () => {
                      if (!alarm) return;
                      if (
                        !confirm('This will reset all smart alarm settings. Continue?')
                      )
                        return;
                      setLoading(true);
                      try {
                        await QuickSetupScripts.emergencyReset(alarm.id);
                        setConditions([]);
                        setSmartEnabled(false);
                        alert('✅ Settings reset to defaults');
                      } catch (error) {
                        alert('❌ Reset failed. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || !alarm}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-all disabled:opacity-50"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smart' && (
            <div className="space-y-6">
              {/* Smart Mode Toggle */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Enhanced Smart Mode
                    </h3>
                    <p className="text-white/70 text-sm">
                      Advanced AI-powered alarm optimization with real-time adaptation
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smartEnabled}
                      onChange={(e: any) => s // auto: implicit anyetSmartEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {smartEnabled && (
                  <div className="space-y-4">
                    {/* Real-time Adaptation */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">
                          Real-time Adaptation
                        </span>
                        <p className="text-white/60 text-xs">
                          Continuously adjust based on current conditions
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={realTimeAdaptation}
                          onChange={(e: any) => s // auto: implicit anyetRealTimeAdaptation(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    {/* Dynamic Wake Window */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">
                          Dynamic Wake Window
                        </span>
                        <p className="text-white/60 text-xs">
                          Automatically adjust wake window based on sleep patterns
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dynamicWakeWindow}
                          onChange={(e: any) => s // auto: implicit anyetDynamicWakeWindow(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    {/* Sleep Pattern Weight */}
                    <div>
                      <label className="block text-white/80 mb-2">
                        Sleep Pattern vs Consistency Balance:{' '}
                        {Math.round(sleepPatternWeight * 100)}% sleep patterns
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={sleepPatternWeight}
                        onChange={(e: any) => /* auto: implicit any */
                          setSleepPatternWeight(parseFloat(e.target.value))
                        }
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>Consistency Priority</span>
                        <span>Sleep Pattern Priority</span>
                      </div>
                    </div>

                    {/* Learning Factor */}
                    <div>
                      <label className="block text-white/80 mb-2">
                        Learning Speed: {Math.round(learningFactor * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.5"
                        step="0.05"
                        value={learningFactor}
                        onChange={(e: any) => s // auto: implicit anyetLearningFactor(parseFloat(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>Slow Learning</span>
                        <span>Fast Learning</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'conditions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Condition-Based Adjustments
              </h3>

              {conditions.map((condition: any) => { // auto: implicit any
                const Icon = conditionIcons[condition.type] || Settings;
                return (
                  <div
                    key={condition.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium capitalize">
                              {condition.type.replace('_', ' ')} Adjustment
                            </h4>
                            <p className="text-white/60 text-sm">
                              {condition.adjustment.reason}
                            </p>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={condition.isEnabled}
                              onChange={(e: any) => /* auto: implicit any */
                                updateCondition(condition.id, {
                                  isEnabled: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-8 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-white/70 text-sm">
                              Time Adjustment
                            </span>
                            <div className="text-white font-medium">
                              {formatAdjustment(condition.adjustment.timeMinutes)}
                            </div>
                          </div>
                          <div>
                            <span className="text-white/70 text-sm">
                              Max Adjustment
                            </span>
                            <div className="text-white font-medium">
                              {formatAdjustment(condition.adjustment.maxAdjustment)}
                            </div>
                          </div>
                        </div>

                        {/* Effectiveness Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-sm">Effectiveness</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/20 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full"
                                style={{
                                  width: `${condition.effectivenessScore * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-white text-sm">
                              {Math.round(condition.effectivenessScore * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center text-white/60 py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Calculating optimal times...</p>
                </div>
              ) : (
                <>
                  {/* Optimal Time Slots */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Optimal Wake Times (Next 24h)
                    </h3>

                    <div className="space-y-3">
                      {optimalTimes.slice(0, 5).map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-mono text-white">
                              {slot.time}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  slot.sleepStage === 'light'
                                    ? 'bg-green-500/20 text-green-300'
                                    : slot.sleepStage === 'rem'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {slot.sleepStage.toUpperCase()}
                              </span>
                              <span className="text-white/60 text-sm">
                                ({formatAdjustment(slot.adjustment)})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-white/20 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getConfidenceColor(slot.confidence).replace('text-', 'bg-')}`}
                                style={{ width: `${slot.confidence * 100}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm ${getConfidenceColor(slot.confidence)}`}
                            >
                              {Math.round(slot.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        AI Recommendations
                      </h3>

                      <div className="space-y-3">
                        {recommendations.map((rec, index) => (
                          <div
                            key={index}
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
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              ) : rec.impact === 'medium' ? (
                                <Info className="w-4 h-4 text-yellow-400" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-white font-medium mb-1">
                                {rec.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${getImpactColor(rec.impact)} bg-current bg-opacity-20`}
                                >
                                  {rec.impact.toUpperCase()}
                                </span>
                                <span className="text-xs text-white/60">
                                  {Math.round(rec.confidence * 100)}% confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  How did you wake up today?
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  Your feedback helps improve smart scheduling accuracy
                </p>

                {/* Quick feedback form would go here */}
                <div className="text-center text-white/60 py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <p>Feedback collection form</p>
                  <p className="text-sm mt-2">
                    This will be implemented as a quick daily survey
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {metrics ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {metrics.averageWakeUpDifficulty.toFixed(1)}/5
                      </div>
                      <div className="text-white/70 text-sm">Avg Difficulty</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {Math.round(metrics.adaptationSuccess * 100)}%
                      </div>
                      <div className="text-white/70 text-sm">Adaptation Success</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {Math.round(metrics.userSatisfaction * 100)}%
                      </div>
                      <div className="text-white/70 text-sm">Satisfaction</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {metrics.mostEffectiveConditions.length}
                      </div>
                      <div className="text-white/70 text-sm">Active Conditions</div>
                    </div>
                  </div>

                  {/* Sleep Quality Trend */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Sleep Quality Trend (7 days)
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {metrics.sleepDebtTrend.map((quality, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-white/20 rounded-t"
                          style={{ height: `${quality * 10}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Most Effective Conditions */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Most Effective Conditions
                    </h3>
                    <div className="space-y-2">
                      {metrics.mostEffectiveConditions.map((condition, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-white/5 rounded"
                        >
                          <span className="text-purple-400 font-mono">
                            #{index + 1}
                          </span>
                          <span className="text-white capitalize">
                            {condition.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p>Not enough data for analytics</p>
                  <p className="text-sm mt-2">
                    Use the smart alarm for a few days to see metrics
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

export default EnhancedSmartAlarmSettings;
