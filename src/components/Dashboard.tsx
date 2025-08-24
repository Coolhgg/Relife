import React from 'react';
import {
  Plus,
  Clock,
  Calendar,
  Volume2,
  Sunrise,
  Coffee,
  Brain,
  Zap,
  TrendingUp,
  MapPin,
  Bell,
  ChevronRight,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Alarm } from '../types';
import { formatTime, getTimeUntilNextAlarm, getVoiceMoodConfig } from '../utils';
import MLAlarmOptimizer from '../services/ml-alarm-optimizer';
import PredictiveAnalyticsService from '../services/predictive-analytics-service';
import EnhancedLocationService from '../services/enhanced-location-service';

// Struggling Sam Optimization Components
import { StreakCounter } from './StreakCounter';
import { AchievementBadges } from './AchievementBadges';
import { SocialProof } from './SocialProof';
import { CommunityChallenge } from './CommunityChallenge';
import { HabitCelebration } from './HabitCelebration';
import { SmartUpgradePrompt } from './SmartUpgradePrompt';
import { useStrugglingSam } from '../contexts/StrugglingsamContext';
import { useABTesting } from '../hooks/useABTesting';

interface DashboardProps {
  alarms?: Alarm[];
  onAddAlarm: (
) => void;
  onQuickSetup?: (presetType: 'morning' | 'work' | 'custom'
) => void;
  onNavigateToAdvanced?: (
) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  alarms,
  onAddAlarm,
  onQuickSetup,
  onNavigateToAdvanced,
}
) => {
  const { alarm: nextAlarm, timeUntil } = getTimeUntilNextAlarm(alarms);
  
  const enabledAlarms = alarms.filter((a: any
) => a.enabled);
  const [smartInsights, setSmartInsights] = useState<any[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);
  const [advancedFeaturesEnabled, setAdvancedFeaturesEnabled] = useState(false);

  useEffect((
) => {
    loadSmartInsights();
  }, [alarms]);

  const loadSmartInsights = async (
) => {
    try {
      // Check if advanced features are enabled
      const mlEnabled = MLAlarmOptimizer.isMLEnabled();
      const analyticsEnabled = PredictiveAnalyticsService.isAnalyticsEnabled();
      const locationEnabled = EnhancedLocationService.isLocationEnabled();

      setAdvancedFeaturesEnabled(mlEnabled || analyticsEnabled || locationEnabled);

      if (analyticsEnabled) {
        const insights = PredictiveAnalyticsService.getRecentInsights(3);
        setSmartInsights(insights);
      }

      if (mlEnabled && alarms.length > 0) {
        // Get optimization suggestions for the user (using first alarm's userId or default)
        const userId = alarms[0]?.userId || 'default';
        const suggestions = await MLAlarmOptimizer.getOptimizationSuggestions(userId);
        setOptimizationSuggestions(suggestions.slice(0, 2));
      }
    } catch (error) {
      console.error('Error loading smart insights:', error);
    }
  };

  // Show loading state if alarms is undefined
  if (!alarms) {
    return (
      <main className="p-4 space-y-6" role="main" aria-labelledby="dashboard-heading">
        <div
          data-testid="loading-spinner"
          className="flex justify-center items-center p-8"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i
) => (
            <div
              key={i}
              data-testid="alarm-skeleton"
              className="h-16 bg-gray-200 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-6" role="main" aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading" className="sr-only">
        Alarm Dashboard
      </h1>
      {/* Next Alarm Card */}
      <section
        className="alarm-card bg-gradient-to-br from-primary-500 to-primary-700 text-white"
        role="region"
        aria-labelledby="next-alarm-heading"
        aria-live="polite"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="next-alarm-heading" className="text-lg font-semibold">
            Next Alarm
          </h2>
          <Clock className="w-6 h-6 opacity-80" aria-hidden="true" />
        </div>

        {nextAlarm ? (
          <div
            className="space-y-2"
            role="status"
            aria-label={`Next alarm is ${nextAlarm.label} at ${formatTime(nextAlarm.time)} in ${timeUntil}`}
          >
            <div
              className="text-3xl font-bold"
              aria-label={`Time: ${formatTime(nextAlarm.time)}`}
            >
              {formatTime(nextAlarm.time)}
            </div>
            <div className="text-white" aria-label={`Label: ${nextAlarm.label}`}>
              {nextAlarm.label}
            </div>
            <div
              className="flex items-center gap-2 text-sm text-white/90"
              role="timer"
              aria-label={`Alarm rings in ${timeUntil}`}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>in {timeUntil}</span>
            </div>
            <div
              className="flex items-center gap-2 text-sm text-white/90"
              role="img"
              aria-label={`Voice mood: ${getVoiceMoodConfig(nextAlarm.voiceMood).name}`}
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>{getVoiceMoodConfig(nextAlarm.voiceMood).name}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6" role="status">
            <div className="text-2xl font-semibold mb-2">No alarms set</div>
            <div className="text-white/90 mb-6">
              Let's get you started with your first smart alarm!
            </div>

            {/* Quick Setup Options for New Users */}
            <div className="space-y-3 mb-6">
              <button
                onClick={(
) => (onQuickSetup ? onQuickSetup('morning') : onAddAlarm())}
                className="w-full bg-white text-primary-800 px-4 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                aria-label="Quick setup - Morning routine alarm at 7:00 AM"
              >
                <Sunrise className="w-4 h-4" aria-hidden="true" />
                Quick Morning (7:00 AM)
              </button>

              <button
                onClick={(
) => (onQuickSetup ? onQuickSetup('work') : onAddAlarm())}
                className="w-full bg-white/90 text-primary-800 px-4 py-3 rounded-lg font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                aria-label="Quick setup - Work day alarm at 6:30 AM"
              >
                <Coffee className="w-4 h-4" aria-hidden="true" />
                Work Day (6:30 AM)
              </button>
            </div>

            <button
              onClick={onAddAlarm}
              className="bg-white/80 text-primary-800 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              aria-label="Create custom alarm with your own time and settings"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Custom Setup
            </button>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section
        className="grid grid-cols-2 gap-4"
        role="region"
        aria-labelledby="stats-heading"
      >
        <h2 id="stats-heading" className="sr-only">
          Alarm Statistics
        </h2>
        <div
          className="alarm-card text-center"
          role="status"
          aria-label={`${enabledAlarms.length} active alarms out of ${alarms.length} total`}
        >
          <div
            className="text-2xl font-bold text-primary-700 dark:text-primary-300"
            aria-label={`${enabledAlarms.length} active`}
          >
            {enabledAlarms.length}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200">Active Alarms</div>
        </div>

        <div
          className="alarm-card text-center"
          role="status"
          aria-label={`${alarms.length} total alarms created`}
        >
          <div
            className="text-2xl font-bold text-green-700 dark:text-green-300"
            aria-label={`${alarms.length} total`}
          >
            {alarms.length}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200">Total Alarms</div>
        </div>
      </section>

      {/* Recent Alarms */}
      {alarms.length > 0 && (
        <section
          className="alarm-card"
          role="region"
          aria-labelledby="recent-alarms-heading"
        >
          <h3
            id="recent-alarms-heading"
            className="text-lg font-semibold mb-4 text-gray-900 dark:text-white"
          >
            Recent Alarms
          </h3>
          <ul className="space-y-3" role="list" aria-label="Recent alarm summaries">
            {alarms.slice(0, 3).map((alarm: any
) => { // auto: implicit any
              const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

              return (
                <li key={alarm.id} role="listitem">
                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg"
                    role="status"
                    aria-label={`Alarm ${formatTime(alarm.time)} ${alarm.label} - ${alarm.enabled ? 'enabled' : 'disabled'} - ${voiceMoodConfig.name} mood`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          alarm.enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        role="img"
                        aria-label={alarm.enabled ? 'Alarm enabled' : 'Alarm disabled'}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatTime(alarm.time)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {alarm.label}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2"
                      role="img"
                      aria-label={`Voice mood: ${voiceMoodConfig.name}`}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {voiceMoodConfig.icon}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${voiceMoodConfig.color}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {alarms.length > 3 && (
            <div className="mt-4 text-center" role="status">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{alarms.length - 3} more alarms
              </span>
            </div>
          )}
        </section>
      )}

      {/* Smart Insights & Optimization */}
      {(smartInsights.length > 0 || optimizationSuggestions.length > 0) && (
        <section
          className="alarm-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
          role="region"
          aria-labelledby="smart-insights-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              id="smart-insights-heading"
              className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2"
            >
              <Brain className="w-5 h-5" aria-hidden="true" />
              Smart Insights
            </h3>
            {onNavigateToAdvanced && (
              <button
                onClick={onNavigateToAdvanced}
                className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1 transition-colors"
                aria-label="View all advanced scheduling options"
              >
                View All <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Optimization Suggestions */}
            {optimizationSuggestions.map((suggestion, index
) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Lightbulb
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {suggestion.suggestion}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {Math.round(suggestion.confidence * 100)}% confidence •{' '}
                      {suggestion.impact} impact
                    </div>
                  </div>
                  <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            ))}

            {/* Smart Insights */}
            {smartInsights
      .map((insight: any
) => (
              <div
                key={insight.id}
                className="bg-white dark:bg-dark-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1 rounded-full ${
                      insight.priority === 'high'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : insight.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}
                  >
                    <AlertCircle
                      className={`w-4 h-4 ${
                        insight.priority === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : insight.priority === 'medium'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-blue-600 dark:text-blue-400'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {insight.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Advanced Features Prompt */}
      {!advancedFeaturesEnabled && alarms.length > 0 && onNavigateToAdvanced && (
        <section
          className="alarm-card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800"
          role="region"
          aria-labelledby="advanced-features-heading"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Zap
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h3
                id="advanced-features-heading"
                className="text-lg font-semibold text-purple-900 dark:text-purple-100"
              >
                Unlock Smart Scheduling
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                AI-powered optimization, location awareness, and predictive insights
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
              <Brain className="w-3 h-3" aria-hidden="true" />
              <span>ML Optimization</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              <span>Location-Based</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              <span>Pattern Analytics</span>
            </div>
          </div>

          <button
            onClick={onNavigateToAdvanced}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            aria-label="Enable advanced scheduling features"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            Enable Advanced Features
          </button>
        </section>
      )}

      {/* Quick Actions */}
      <section
        className="alarm-card"
        role="region"
        aria-labelledby="quick-actions-heading"
      >
        <h3
          id="quick-actions-heading"
          className="text-lg font-semibold mb-4 text-gray-900 dark:text-white"
        >
          Quick Actions
        </h3>
        <div
          className="grid grid-cols-1 gap-3"
          role="group"
          aria-label="Available actions"
        >
          <button
            onClick={onAddAlarm}
            className="alarm-button alarm-button-primary p-4 text-left"
            aria-label="Add new alarm - Set up a new wake-up time"
            aria-describedby="add-alarm-desc"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" aria-hidden="true" />
              <div>
                <div className="font-medium">Add New Alarm</div>
                <div id="add-alarm-desc" className="text-sm opacity-80">
                  Set up a new wake-up time
                </div>
              </div>
            </div>
          </button>

          {alarms.length > 0 && onQuickSetup && (
            <>
              <button
                onClick={(
) => onQuickSetup('morning')}
                className="alarm-button alarm-button-secondary p-4 text-left"
                aria-label="Quick morning routine - Add 7:00 AM motivational alarm"
              >
                <div className="flex items-center gap-3">
                  <Sunrise className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Morning Routine</div>
                    <div className="text-sm opacity-80">
                      7:00 AM with motivational wake-up
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={(
) => onQuickSetup('work')}
                className="alarm-button alarm-button-secondary p-4 text-left"
                aria-label="Work day setup - Add 6:30 AM professional alarm"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Work Day</div>
                    <div className="text-sm opacity-80">6:30 AM for your commute</div>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
