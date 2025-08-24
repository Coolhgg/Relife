import React, { useState, useEffect } from 'react';
import { TimeoutHandle } from '../types/timers';
import {
  Brain,
  Clock,
  Activity,
  Zap,
  TrendingUp,
  Alert,
  CheckCircle,
  RefreshCw,
  Eye,
  Settings,
  BarChart3,
  Calendar,
  CloudRain,
  Navigation,
  Moon,
  Sun,
  Target,
} from 'lucide-react';
import {
  EnhancedSmartAlarmScheduler,
  type EnhancedSmartAlarm,
  type OptimalTimeSlot,
} from '../services/enhanced-smart-alarm-scheduler';
import {
  RealTimeSmartAdapter,
  type SmartAlarmStatus,
} from '../services/real-time-smart-adapter';

interface SmartAlarmDashboardProps {
  alarms: EnhancedSmartAlarm[];
  onEditAlarm: (alarm: EnhancedSmartAlarm
) => void;
}

const SmartAlarmDashboard: React.FC<SmartAlarmDashboardProps> = ({
  alarms,
  onEditAlarm,
}
) => {
  const [alarmStatuses, setAlarmStatuses] = useState<Map<string, SmartAlarmStatus>>(
    new Map()
  );
  const [optimalTimes, setOptimalTimes] = useState<Map<string, OptimalTimeSlot[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<string | null>(null);

  useEffect((
) => {
    loadDashboardData();

    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 60000); // Update every minute

    return (
) => clearInterval(interval);
  }, [alarms]);

  const loadDashboardData = async (
) => {
    setLoading(true);
    try {
      // Load alarm statuses
      const statuses = RealTimeSmartAdapter.getAllAlarmStatuses();
      setAlarmStatuses(statuses);

      // Load optimal times for each alarm
      const timesMap = new Map<string, OptimalTimeSlot[]>();

      
      for (const alarm of alarms.filter((a: any
) => a.smartEnabled)) {
        try {
          const times =
            await EnhancedSmartAlarmScheduler.calculateOptimalTimeSlots(alarm);
          timesMap.set(alarm.id, times);
        } catch (error) {
          console.error(`Error loading optimal times for alarm ${alarm.id}:`, error);
        }
      }

      setOptimalTimes(timesMap);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeUntil = (date: Date): string => {
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return 'Past due';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: SmartAlarmStatus): string => {
    if (!status.isActive) return 'text-gray-400';
    if (status.confidence >= 0.8) return 'text-green-400';
    if (status.confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceIcon = (confidence: number
) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (confidence >= 0.6) return <Eye className="w-4 h-4 text-yellow-400" />;
    return <Alert className="w-4 h-4 text-red-400" />;
  };

  
  const smartAlarms = alarms.filter((alarm: any
) => alarm.smartEnabled);

  if (smartAlarms.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10 text-center">
        <Brain className="w-12 h-12 mx-auto mb-4 text-white/40" />
        <h3 className="text-lg font-semibold text-white mb-2">
          No Smart Alarms Active
        </h3>
        <p className="text-white/60 mb-4">
          Enable smart mode on your alarms to see AI-powered optimizations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
          <div className="flex items-center justify-between mb-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <span className="text-2xl font-bold text-white">{smartAlarms.length}</span>
          </div>
          <div className="text-white/80 text-sm">Smart Alarms Active</div>
        </div>

        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-400/30">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-green-400" />
            <span className="text-2xl font-bold text-white">
              {Array.from(alarmStatuses.values()).filter(s => s.isActive).length}
            </span>
          </div>
          <div className="text-white/80 text-sm">Currently Monitoring</div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400/30">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {Array.from(alarmStatuses.values()).reduce(
                (sum, s
) => sum + s.adaptationCount,
                0
              )}
            </span>
          </div>
          <div className="text-white/80 text-sm">Today's Adaptations</div>
        </div>
      </div>

      {/* Smart Alarms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Smart Alarms
          </h3>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {smartAlarms.map((alarm: any
) => { // auto: implicit any
          const status = alarmStatuses.get(alarm.id);
          const optimal = optimalTimes.get(alarm.id) || [];
          const isExpanded = selectedAlarm === alarm.id;

          return (
            <div
              key={alarm.id}
              className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
            >
              {/* Alarm Header */}
              <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={(
) => setSelectedAlarm(isExpanded ? null : alarm.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-mono font-bold text-white">
                        {alarm.time}
                      </div>
                      {status && (
                        <div className="flex items-center gap-1 mt-1">
                          {getConfidenceIcon(status.confidence)}
                          <span className={`text-xs ${getStatusColor(status)}`}>
                            {Math.round(status.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-white font-medium">{alarm.label}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-white/60 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {status
                            ? formatTimeUntil(status.nextTriggerTime)
                            : 'Inactive'}
                        </span>

                        {alarm.realTimeAdaptation && (
                          <span className="text-green-400 text-xs px-2 py-1 bg-green-500/20 rounded">
                            ADAPTIVE
                          </span>
                        )}

                        {status && status.currentAdjustment !== 0 && (
                          <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-500/20 rounded">
                            {status.currentAdjustment > 0 ? '+' : ''}
                            {status.currentAdjustment}min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e: any
) => { // auto: implicit any
                        e.stopPropagation();
                        onEditAlarm(alarm);
                      }}
                      className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Current Status */}
                  {status && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/70 text-sm mb-1">
                          Adaptations Today
                        </div>
                        <div className="text-white font-medium">
                          {status.adaptationCount} / 5
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/70 text-sm mb-1">
                          Last Adaptation
                        </div>
                        <div className="text-white font-medium">
                          {status.lastAdaptation
                            ? new Date(status.lastAdaptation).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'None'}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/70 text-sm mb-1">Confidence</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/20 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status.confidence >= 0.8
                                  ? 'bg-green-400'
                                  : status.confidence >= 0.6
                                    ? 'bg-yellow-400'
                                    : 'bg-red-400'
                              }`}
                              style={{ width: `${status.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">
                            {Math.round(status.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Factors */}
                  {status && status.factors.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Active Factors
                      </h5>
                      <div className="space-y-1">
                        {status.factors.map((factor, index
) => (
                          <div
                            key={index}
                            className="text-white/70 text-sm flex items-start gap-2"
                          >
                            <div className="w-1 h-1 bg-white/40 rounded-full mt-2 flex-shrink-0" />
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optimal Times */}
                  {optimal.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        Optimal Wake Times
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {optimal.slice(0, 6).map((slot, index
) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white">{slot.time}</span>
                              <span
                                className={`text-xs px-1 py-0.5 rounded ${
                                  slot.sleepStage === 'light'
                                    ? 'bg-green-500/20 text-green-300'
                                    : slot.sleepStage === 'rem'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {slot.sleepStage.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-white/60 text-xs">
                              {Math.round(slot.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Smart Settings Summary */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-400" />
                      Smart Settings
                    </h5>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 text-white/60" />
                        <span className="text-white/70">Real-time:</span>
                        <span
                          className={
                            alarm.realTimeAdaptation ? 'text-green-400' : 'text-red-400'
                          }>alarm.realTimeAdaptation ? 'ON' : 'OFF'</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-white/60" />
                        <span className="text-white/70">Dynamic:</span>
                        <span
                          className={
                            alarm.dynamicWakeWindow ? 'text-green-400' : 'text-red-400'
                          }>alarm.dynamicWakeWindow ? 'ON' : 'OFF'</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-white/60" />
                        <span className="text-white/70">Learning:</span>
                        <span className="text-white">
                          {Math.round(alarm.learningFactor * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Brain className="w-3 h-3 text-white/60" />
                        <span className="text-white/70">Pattern Weight:</span>
                        <span className="text-white">
                          {Math.round(alarm.sleepPatternWeight * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Conditions */}
                  {alarm.conditionBasedAdjustments &&
                    
                    alarm.conditionBasedAdjustments.filter((c: any
) => c.isEnabled).length >
                      0 && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-yellow-400" />
                          Active Conditions
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {alarm.conditionBasedAdjustments
                            .filter((c: any
) => c.isEnabled)
                            
                            .map((condition: any) => (
        <div
                                key={condition.id}
                                className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-white/70 text-sm capitalize">
                                    {condition.type.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs text-white/50">
                                    {condition.adjustment.timeMinutes > 0 ? '+' : ''}
                                    {condition.adjustment.timeMinutes}min
                                  </span>
                                </div>
                                <div className="text-xs text-white/60">
                                  {Math.round(condition.effectivenessScore * 100)}%
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartAlarmDashboard;
