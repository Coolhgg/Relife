import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Edit2,
  Trash2,
  Clock,
  Brain,
  MapPin,
  TrendingUp,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, formatDays, getVoiceMoodConfig } from '../utils';
import { AdaptiveConfirmationModal } from './AdaptiveModal';
import {
  useScreenReaderAnnouncements,
  useFocusAnnouncements,
} from '../hooks/useScreenReaderAnnouncements';
import MLAlarmOptimizer from '../services/ml-alarm-optimizer';
import PredictiveAnalyticsService from '../services/predictive-analytics-service';
import EnhancedLocationService from '../services/enhanced-location-service';
import { TimeoutHandle } from '../types/timers';

interface AlarmListProps {
  alarms: Alarm[];
  onToggleAlarm: (alarmId: string, enabled: boolean) => void;
  onEditAlarm: (alarm: Alarm) => void;
  onDeleteAlarm: (alarmId: string) => void;
}

const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alarmOptimizations, setAlarmOptimizations] = useState<Map<string, any>>(
    new Map()
  );
  const [advancedFeaturesEnabled, setAdvancedFeaturesEnabled] = useState({
    ml: false,
    location: false,
    analytics: false,
  });
  const { announce, announceListChange: _announceListChange } =
    useScreenReaderAnnouncements();
  const { announceEnter } = useFocusAnnouncements('Alarm List');

  const loadAlarmOptimizations = useCallback(async () => {
    if (!MLAlarmOptimizer.isMLEnabled()) return;

    const optimizations = new Map();
    for (const alarm of alarms) {
      try {
        const prediction = await MLAlarmOptimizer.predictOptimalWakeTime(
          alarm.userId || 'default',
          alarm,
          new Date()
        );
        if (prediction.adjustmentMinutes !== 0) {
          optimizations.set(alarm.id, {
            optimalTime: prediction.optimalWakeTime,
            adjustment: prediction.adjustmentMinutes,
            confidence: prediction.confidence,
          });
        }
      } catch (error) {
        console.error('Error getting optimization for alarm:', alarm.id, error);
      }
    }
    setAlarmOptimizations(optimizations);
  }, [alarms, setAlarmOptimizations]);

  // Load advanced features status and optimizations
  useEffect(() => {
    loadAdvancedFeatureStatus();
    loadAlarmOptimizations();
  }, [alarms, loadAlarmOptimizations]);

  // Announce when entering the alarm list
  useEffect(() => {
    announceEnter(`Showing ${alarms.length} alarms`);
  }, [announceEnter, alarms.length]);

  const loadAdvancedFeatureStatus = () => {
    setAdvancedFeaturesEnabled({
      ml: MLAlarmOptimizer.isMLEnabled(),
      location: EnhancedLocationService.isLocationEnabled(),
      analytics: PredictiveAnalyticsService.isAnalyticsEnabled(),
    });
  };

  // Announce when alarm count changes
  useEffect(() => {
    const alarmCountMessage =
      alarms.length === 0
        ? 'No alarms configured'
        : alarms.length === 1
          ? '1 alarm configured'
          : `${alarms.length} alarms configured`;

    // Only announce if this isn't the initial load
    const timer = setTimeout(() => {
      announce({
        type: 'custom',
        message: alarmCountMessage,
        priority: 'polite',
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [alarms.length, announce]);

  const handleDeleteConfirm = (alarmId?: string) => {
    const idToDelete = alarmId || deleteConfirmId;
    if (idToDelete) {
      const alarm = alarms.find(a => a.id === idToDelete);
      onDeleteAlarm(idToDelete);
      setDeleteConfirmId(null);

      // Announce deletion
      if (alarm) {
        announce({
          type: 'alarm-delete',
          data: { alarm },
          priority: 'polite',
        });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
    announce({
      type: 'custom',
      message: 'Delete cancelled',
      priority: 'polite',
    });
  };

  const handleToggleAlarm = (alarmId: string, enabled: boolean) => {
    const alarm = alarms.find(a => a.id === alarmId);
    onToggleAlarm(alarmId, enabled);

    // Announce toggle
    if (alarm) {
      announce({
        type: 'alarm-toggle',
        data: { alarm, enabled },
        priority: 'polite',
      });
    }
  };

  const handleEditAlarm = (alarm: Alarm) => {
    onEditAlarm(alarm);
    announce({
      type: 'custom',
      message: `Editing alarm for ${formatTime(alarm.time)} ${alarm.label}`,
      priority: 'polite',
    });
  };

  const handleDeleteRequest = (alarmId: string) => {
    const alarm = alarms.find(a => a.id === alarmId);
    setDeleteConfirmId(alarmId);

    if (alarm) {
      announce({
        type: 'custom',
        message: `Delete confirmation requested for ${formatTime(alarm.time)} ${alarm.label}. Press confirm to delete or cancel to keep the alarm.`,
        priority: 'assertive',
      });
    }
  };
  if (alarms.length === 0) {
    return (
      <main className="p-4" role="main" aria-labelledby="alarms-heading">
        <h2 id="alarms-heading" className="sr-only">
          Alarms
        </h2>
        <div
          className="alarm-card text-center py-12"
          role="region"
          aria-label="Empty alarms state"
        >
          <Clock
            className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No Alarms Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first alarm to get started with smart wake-ups.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4" role="main" aria-labelledby="alarms-heading">
      <h2
        id="alarms-heading"
        className="text-xl font-bold mb-4 text-gray-900 dark:text-white"
      >
        Your Alarms ({alarms.length})
      </h2>

      <ul className="space-y-3" role="list" aria-label="List of alarms">
        {alarms.map(alarm => {
          const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

          return (
            <li key={alarm.id} role="listitem">
              <article
                className="alarm-card"
                aria-labelledby={`alarm-${alarm.id}-time`}
                aria-describedby={`alarm-${alarm.id}-details`}
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Time and details */}
                  <div className="flex items-center gap-4">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggleAlarm(alarm.id, !alarm.enabled)}
                      className={`alarm-toggle ${
                        alarm.enabled
                          ? 'alarm-toggle-checked'
                          : 'alarm-toggle-unchecked'
                      }`}
                      role="switch"
                      aria-checked={alarm.enabled}
                      aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm for ${formatTime(alarm.time)} ${alarm.label}`}
                      aria-describedby={`alarm-${alarm.id}-status`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                        aria-hidden="true"
                      />
                      <span id={`alarm-${alarm.id}-status`} className="sr-only">
                        Alarm is {alarm.enabled ? 'enabled' : 'disabled'}
                      </span>
                    </button>

                    {/* Alarm info */}
                    <div className={alarm.enabled ? '' : 'opacity-50'}>
                      <div
                        id={`alarm-${alarm.id}-time`}
                        className="text-2xl font-bold text-gray-900 dark:text-white"
                      >
                        {formatTime(alarm.time)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {alarm.label}
                      </div>
                      <div
                        id={`alarm-${alarm.id}-details`}
                        className="text-xs text-gray-500 dark:text-gray-500 mt-1"
                      >
                        {formatDays(alarm.days)}
                      </div>

                      {/* Voice mood and snooze info */}
                      <div className="flex items-center justify-between mt-2">
                        <div
                          className="flex items-center gap-2"
                          role="img"
                          aria-label={`Voice mood: ${voiceMoodConfig.name}`}
                        >
                          <span className="text-sm" aria-hidden="true">
                            {voiceMoodConfig.icon}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {voiceMoodConfig.name}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${voiceMoodConfig.color}`}
                            aria-hidden="true"
                          />
                        </div>

                        {/* Snooze settings indicator */}
                        {alarm.snoozeEnabled && (
                          <div
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500"
                            role="img"
                            aria-label={`Snooze enabled: ${alarm.snoozeInterval} minutes, max ${alarm.maxSnoozes || 'unlimited'} times`}
                          >
                            <span aria-hidden="true">⏰</span>
                            <span>{alarm.snoozeInterval}min</span>
                            {alarm.maxSnoozes && alarm.maxSnoozes > 0 && (
                              <span>({alarm.maxSnoozes}x max)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Advanced Features Indicators */}
                      {(advancedFeaturesEnabled.ml ||
                        advancedFeaturesEnabled.location ||
                        advancedFeaturesEnabled.analytics) && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-dark-400">
                          <div className="flex items-center gap-1">
                            {advancedFeaturesEnabled.ml && (
                              <div
                                className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs"
                                role="img"
                                aria-label="AI optimization enabled"
                              >
                                <Brain className="w-3 h-3" aria-hidden="true" />
                                <span>AI</span>
                              </div>
                            )}
                            {advancedFeaturesEnabled.location && (
                              <div
                                className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-xs"
                                role="img"
                                aria-label="Location-based scheduling enabled"
                              >
                                <MapPin className="w-3 h-3" aria-hidden="true" />
                                <span>Location</span>
                              </div>
                            )}
                            {advancedFeaturesEnabled.analytics && (
                              <div
                                className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-xs"
                                role="img"
                                aria-label="Predictive analytics enabled"
                              >
                                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                                <span>Analytics</span>
                              </div>
                            )}
                          </div>

                          {/* ML Optimization Suggestion */}
                          {alarmOptimizations.has(alarm.id) && (
                            <div className="ml-auto">
                              <div
                                className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full text-xs font-medium"
                                role="status"
                                aria-label={`Optimization available: ${alarmOptimizations.get(alarm.id)?.adjustment > 0 ? '+' : ''}${alarmOptimizations.get(alarm.id)?.adjustment} minutes suggested`}
                              >
                                <Sparkles className="w-3 h-3" aria-hidden="true" />
                                <span>
                                  {alarmOptimizations.get(alarm.id)?.adjustment > 0
                                    ? '+'
                                    : ''}
                                  {alarmOptimizations.get(alarm.id)?.adjustment}min
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Action buttons */}
                  <div
                    className="flex items-center gap-2"
                    role="group"
                    aria-label="Alarm actions"
                  >
                    {/* Quick optimization button */}
                    {alarmOptimizations.has(alarm.id) && (
                      <button
                        onClick={() => {
                          const optimization = alarmOptimizations.get(alarm.id);
                          if (optimization) {
                            // Apply the optimization
                            const [_hours, _minutes] =
                              optimization.optimalTime.split(':');
                            const updatedAlarm = {
                              ...alarm,
                              time: optimization.optimalTime,
                            };
                            handleEditAlarm(updatedAlarm);
                            announce({
                              type: 'custom',
                              message: `Applied AI optimization to ${alarm.label}. Time changed to ${optimization.optimalTime}`,
                              priority: 'polite',
                            });
                          }
                        }}
                        className="alarm-button bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 hover:from-yellow-600 hover:to-orange-600"
                        aria-label={`Apply AI optimization: change time to ${alarmOptimizations.get(alarm.id)?.optimalTime}`}
                        title={`Suggested time: ${alarmOptimizations.get(alarm.id)?.optimalTime} (${Math.round(alarmOptimizations.get(alarm.id)?.confidence * 100)}% confidence)`}
                      >
                        <Lightbulb className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}

                    <button
                      onClick={() => handleEditAlarm(alarm)}
                      className="alarm-button alarm-button-secondary p-2"
                      aria-label={`Edit alarm ${formatTime(alarm.time)} ${alarm.label}`}
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      onClick={() => handleDeleteRequest(alarm.id)}
                      className="alarm-button alarm-button-danger p-2"
                      aria-label={`Delete alarm ${formatTime(alarm.time)} ${alarm.label}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Snooze count and warnings */}
                {alarm.snoozeCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-300">
                    <div className="flex items-center justify-between">
                      <div
                        className="text-xs text-orange-600 dark:text-orange-400"
                        role="status"
                        aria-label={`This alarm has been snoozed ${alarm.snoozeCount} time${alarm.snoozeCount !== 1 ? 's' : ''}`}
                      >
                        ⏰ Snoozed {alarm.snoozeCount} time
                        {alarm.snoozeCount !== 1 ? 's' : ''}
                      </div>

                      {alarm.maxSnoozes && alarm.snoozeCount >= alarm.maxSnoozes && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Max snoozes reached
                        </div>
                      )}

                      {alarm.maxSnoozes && alarm.snoozeCount < alarm.maxSnoozes && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {alarm.maxSnoozes - alarm.snoozeCount} left
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>

      {/* Summary */}
      <div
        className="mt-6 alarm-card bg-gray-50 dark:bg-dark-200"
        role="status"
        aria-label="Alarms summary"
      >
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {alarms.filter(a => a.enabled).length} of {alarms.length} alarms active
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AdaptiveConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Alarm"
        message="Are you sure you want to delete this alarm? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        announceOnOpen="Delete confirmation dialog opened. Are you sure you want to delete this alarm?"
        announceOnClose="Delete confirmation dialog closed"
      />
    </main>
  );
};

export default AlarmList;
