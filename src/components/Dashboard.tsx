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
  Activity,
  Target,
  Award,
  BarChart3,
  Moon,
  CheckCircle,
  Timer,
  Sparkles,
  Settings,
  Users,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
  onAddAlarm: () => void;
  onQuickSetup?: (presetType: 'morning' | 'work' | 'custom') => void;
  onNavigateToAdvanced?: () => void;
  onViewStats?: () => void;
  onManageAlarms?: () => void;
}

// Sleep quality data for visualization
interface SleepData {
  date: string;
  quality: number;
  duration: number;
  efficiency: number;
}

// Mock sleep data - in real app this would come from API
const mockSleepData: SleepData[] = [
  { date: '2025-08-20', quality: 85, duration: 7.5, efficiency: 92 },
  { date: '2025-08-21', quality: 78, duration: 6.8, efficiency: 88 },
  { date: '2025-08-22', quality: 92, duration: 8.2, efficiency: 95 },
  { date: '2025-08-23', quality: 73, duration: 6.5, efficiency: 82 },
  { date: '2025-08-24', quality: 88, duration: 7.8, efficiency: 91 },
  { date: '2025-08-25', quality: 95, duration: 8.0, efficiency: 96 },
];

const Dashboard: React.FC<DashboardProps> = ({
  alarms,
  onAddAlarm,
  onQuickSetup,
  onNavigateToAdvanced,
  onViewStats,
  onManageAlarms,
}) => {
  // Performance optimized with memoization
  const { alarm: nextAlarm, timeUntil } = useMemo(
    () => getTimeUntilNextAlarm(alarms),
    [alarms]
  );
  const enabledAlarms = useMemo(
    () => alarms?.filter((a: any) => a.enabled) || [],
    [alarms]
  );

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const totalAlarms = alarms?.length || 0;
    const activeAlarms = enabledAlarms.length;
    const completionRate =
      totalAlarms > 0 ? Math.round((activeAlarms / totalAlarms) * 100) : 0;
    const avgSleepQuality =
      mockSleepData.slice(-7).reduce((acc, day) => acc + day.quality, 0) / 7;
    const currentStreak = 12; // Mock data - would come from API

    return {
      totalAlarms,
      activeAlarms,
      completionRate,
      avgSleepQuality: Math.round(avgSleepQuality),
      currentStreak,
      todaySleepScore: mockSleepData[mockSleepData.length - 1]?.quality || 0,
    };
  }, [alarms, enabledAlarms]);
  const [smartInsights, setSmartInsights] = useState<any[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);
  const [advancedFeaturesEnabled, setAdvancedFeaturesEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSmartInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto: manual review required; refs: loadSmartInsights
  }, [alarms]);

  const loadSmartInsights = async () => {
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

      if (mlEnabled && alarms && alarms.length > 0) {
        // Get optimization suggestions for the user (using first alarm's userId or default)
        const userId = alarms[0]?.userId || 'default';
        const suggestions = await MLAlarmOptimizer.getOptimizationSuggestions(userId);
        setOptimizationSuggestions(suggestions.slice(0, 2));
      }
    } catch (error) {
      console.error('Error loading smart insights:', error);
    }
  };

  // Show enhanced loading state if alarms is undefined
  if (!alarms) {
    return (
      <main
        className="min-h-screen theme-bg p-4 space-y-6"
        role="main"
        aria-labelledby="dashboard-heading"
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-theme-primary-500 to-theme-secondary-500 animate-spin opacity-20"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-theme-primary-600 to-theme-secondary-600 animate-pulse"></div>
            <div className="absolute inset-4 rounded-full bg-theme-background"></div>
          </div>
          <div className="text-lg font-semibold theme-text-primary mb-2">
            Loading your dashboard...
          </div>
          <div className="text-theme-text-600">
            Preparing your personalized experience
          </div>
        </div>

        {/* Enhanced Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="alarm-card-glass h-48 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              <div className="h-full bg-theme-surface-100 dark:bg-theme-surface-800 opacity-50 rounded-xl"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen theme-bg p-4 space-y-6"
      role="main"
      aria-labelledby="dashboard-heading"
    >
      <h1 id="dashboard-heading" className="sr-only">
        Enhanced Alarm Dashboard
      </h1>

      {/* Hero Section with Time & Weather */}
      <section className="relative overflow-hidden">
        <div className="alarm-card-glass bg-gradient-to-br from-theme-primary-500/10 via-theme-secondary-500/5 to-theme-accent-500/10 p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-theme-primary-600/20 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="text-6xl font-bold time-display mb-2">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-theme-text-600 text-lg font-medium mb-4">
              {currentTime.toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center justify-center gap-6 text-theme-text-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{enabledAlarms.length} active alarms</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{dashboardMetrics.currentStreak}-day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Next Alarm Card - Enhanced Design */}
        <section
          className="md:col-span-2 lg:col-span-1 alarm-card-glass bg-gradient-to-br from-theme-primary-500 to-theme-primary-700 text-white relative overflow-hidden"
          role="region"
          aria-labelledby="next-alarm-heading"
          aria-live="polite"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2
                id="next-alarm-heading"
                className="text-xl font-bold flex items-center gap-2"
              >
                <Bell className="w-6 h-6" aria-hidden="true" />
                Next Alarm
              </h2>
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Clock className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            {nextAlarm ? (
              <div
                className="space-y-4"
                role="status"
                aria-label={`Next alarm is ${nextAlarm.label} at ${formatTime(nextAlarm.time)} in ${timeUntil}`}
              >
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2 time-display">
                    {formatTime(nextAlarm.time)}
                  </div>
                  <div className="text-xl font-medium text-white/90 mb-1">
                    {nextAlarm.label}
                  </div>
                  <div className="text-sm text-white/75">{timeUntil} remaining</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <Volume2 className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
                    <div className="text-xs text-white/90">
                      {getVoiceMoodConfig(nextAlarm.voiceMood).name}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
                    <div className="text-xs text-white/90">Daily</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" role="status">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8" aria-hidden="true" />
                </div>
                <div className="text-2xl font-bold mb-2">No alarms set</div>
                <div className="text-white/80 mb-6 text-sm">
                  Create your first smart alarm to get started!
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() =>
                      onQuickSetup ? onQuickSetup('morning') : onAddAlarm()
                    }
                    className="w-full bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
                    aria-label="Quick setup - Morning routine"
                  >
                    <Sunrise className="w-4 h-4" aria-hidden="true" />
                    Morning Routine
                  </button>

                  <button
                    onClick={() => (onQuickSetup ? onQuickSetup('work') : onAddAlarm())}
                    className="w-full bg-white/15 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-medium hover:bg-white/25 transition-all duration-300 flex items-center justify-center gap-2 border border-white/15"
                    aria-label="Quick setup - Work schedule"
                  >
                    <Coffee className="w-4 h-4" aria-hidden="true" />
                    Work Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sleep Quality Card */}
        <section
          className="alarm-card-glass bg-gradient-to-br from-theme-success-500/10 to-theme-success-600/5"
          role="region"
          aria-labelledby="sleep-quality-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              id="sleep-quality-heading"
              className="text-lg font-semibold theme-text-primary flex items-center gap-2"
            >
              <Moon className="w-5 h-5 text-theme-success-600" aria-hidden="true" />
              Sleep Quality
            </h3>
            <div className="p-2 bg-theme-success-100 dark:bg-theme-success-900/30 rounded-full">
              <Activity className="w-4 h-4 text-theme-success-600" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-theme-success-600 mb-2">
              {dashboardMetrics.todaySleepScore}%
            </div>
            <div className="text-theme-text-600 text-sm mb-4">Today's Score</div>

            {/* Mini Sleep Chart */}
            <div className="flex items-end justify-between h-12 gap-1 mt-4">
              {mockSleepData.slice(-7).map((day, index) => (
                <div
                  key={day.date}
                  className="bg-theme-success-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${(day.quality / 100) * 100}%`, minHeight: '8px' }}
                  title={`${new Date(day.date).toLocaleDateString()}: ${day.quality}%`}
                />
              ))}
            </div>
            <div className="text-xs text-theme-text-500 mt-2">
              7-day average: {dashboardMetrics.avgSleepQuality}%
            </div>
          </div>
        </section>

        {/* Streak & Achievements Card */}
        <section
          className="alarm-card-glass bg-gradient-to-br from-theme-warning-500/10 to-theme-warning-600/5"
          role="region"
          aria-labelledby="achievements-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              id="achievements-heading"
              className="text-lg font-semibold theme-text-primary flex items-center gap-2"
            >
              <Award className="w-5 h-5 text-theme-warning-600" aria-hidden="true" />
              Achievements
            </h3>
            <div className="p-2 bg-theme-warning-100 dark:bg-theme-warning-900/30 rounded-full">
              <Sparkles className="w-4 h-4 text-theme-warning-600" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-theme-warning-600 mb-1">
                {dashboardMetrics.currentStreak}
              </div>
              <div className="text-theme-text-600 text-sm">Day Streak</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-theme-surface-100 dark:bg-theme-surface-800 rounded-lg">
                <CheckCircle className="w-4 h-4 mx-auto text-theme-success-500 mb-1" />
                <div className="text-xs text-theme-text-600">98%</div>
                <div className="text-xs text-theme-text-500">Success</div>
              </div>
              <div className="text-center p-2 bg-theme-surface-100 dark:bg-theme-surface-800 rounded-lg">
                <Target className="w-4 h-4 mx-auto text-theme-primary-500 mb-1" />
                <div className="text-xs text-theme-text-600">24</div>
                <div className="text-xs text-theme-text-500">Goals</div>
              </div>
              <div className="text-center p-2 bg-theme-surface-100 dark:bg-theme-surface-800 rounded-lg">
                <Award className="w-4 h-4 mx-auto text-theme-warning-500 mb-1" />
                <div className="text-xs text-theme-text-600">12</div>
                <div className="text-xs text-theme-text-500">Badges</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Card */}
        <section
          className="alarm-card-glass bg-gradient-to-br from-theme-accent-500/10 to-theme-accent-600/5"
          role="region"
          aria-labelledby="quick-stats-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              id="quick-stats-heading"
              className="text-lg font-semibold theme-text-primary flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5 text-theme-accent-600" aria-hidden="true" />
              Overview
            </h3>
            <button
              onClick={onViewStats}
              className="p-2 hover:bg-theme-surface-100 dark:hover:bg-theme-surface-800 rounded-full transition-colors"
              aria-label="View detailed statistics"
            >
              <ChevronRight
                className="w-4 h-4 text-theme-text-600"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-text-600 text-sm">Active Alarms</span>
              <span className="font-semibold text-theme-accent-600">
                {enabledAlarms.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-text-600 text-sm">Total Created</span>
              <span className="font-semibold text-theme-text-700">
                {dashboardMetrics.totalAlarms}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-text-600 text-sm">Success Rate</span>
              <span className="font-semibold text-theme-success-600">
                {dashboardMetrics.completionRate}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-theme-text-500 mb-1">
                <span>Weekly Progress</span>
                <span>6/7 days</span>
              </div>
              <div className="w-full bg-theme-surface-200 dark:bg-theme-surface-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-theme-primary-400 to-theme-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: '86%' }}
                ></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alarms Card */}
        {alarms && alarms.length > 0 && (
          <section
            className="alarm-card-glass"
            role="region"
            aria-labelledby="recent-alarms-heading"
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                id="recent-alarms-heading"
                className="text-lg font-semibold theme-text-primary flex items-center gap-2"
              >
                <Timer className="w-5 h-5 text-theme-primary-600" aria-hidden="true" />
                Recent Alarms
              </h3>
              <button
                onClick={onManageAlarms}
                className="p-2 hover:bg-theme-surface-100 dark:hover:bg-theme-surface-800 rounded-full transition-colors"
                aria-label="Manage all alarms"
              >
                <Settings className="w-4 h-4 text-theme-text-600" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3" role="list" aria-label="Recent alarm summaries">
              {alarms.slice(0, 4).map((alarm: any) => {
                const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);
                return (
                  <div
                    key={alarm.id}
                    className="group p-4 bg-theme-surface-50 dark:bg-theme-surface-800/50 hover:bg-theme-surface-100 dark:hover:bg-theme-surface-700/50 rounded-xl transition-all duration-300 cursor-pointer border border-theme-border-200 dark:border-theme-border-700"
                    role="button"
                    tabIndex={0}
                    aria-label={`Alarm ${formatTime(alarm.time)} ${alarm.label} - ${alarm.enabled ? 'enabled' : 'disabled'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${
                              alarm.enabled
                                ? 'bg-theme-success-500 shadow-lg shadow-theme-success-500/30'
                                : 'bg-theme-border-400'
                            }`}
                            role="img"
                            aria-label={
                              alarm.enabled ? 'Alarm enabled' : 'Alarm disabled'
                            }
                          />
                          {alarm.enabled && (
                            <div className="absolute inset-0 bg-theme-success-500 rounded-full animate-ping opacity-30"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold theme-text-primary text-lg">
                            {formatTime(alarm.time)}
                          </div>
                          <div className="text-theme-text-600 text-sm">
                            {alarm.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-xl" aria-hidden="true">
                          {voiceMoodConfig.icon}
                        </div>
                        <ChevronRight
                          className="w-4 h-4 text-theme-text-400 group-hover:text-theme-text-600 transition-colors"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {alarms.length > 4 && (
              <button
                onClick={onManageAlarms}
                className="w-full mt-4 p-3 bg-theme-surface-100 dark:bg-theme-surface-800 hover:bg-theme-surface-200 dark:hover:bg-theme-surface-700 rounded-xl transition-colors text-theme-text-600 hover:text-theme-text-700 font-medium"
                aria-label={`View all ${alarms.length} alarms`}
              >
                View all {alarms.length} alarms
              </button>
            )}
          </section>
        )}

        {/* Smart Insights & Community */}
        <section
          className="alarm-card-glass bg-gradient-to-br from-theme-secondary-500/10 to-theme-secondary-600/5"
          role="region"
          aria-labelledby="insights-heading"
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              id="insights-heading"
              className="text-lg font-semibold theme-text-primary flex items-center gap-2"
            >
              <Brain className="w-5 h-5 text-theme-secondary-600" aria-hidden="true" />
              Smart Insights
            </h3>
            {onNavigateToAdvanced && (
              <button
                onClick={onNavigateToAdvanced}
                className="p-2 hover:bg-theme-surface-100 dark:hover:bg-theme-surface-800 rounded-full transition-colors"
                aria-label="View advanced features"
              >
                <ChevronRight
                  className="w-4 h-4 text-theme-text-600"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* AI Suggestions */}
            {optimizationSuggestions.length > 0 ? (
              optimizationSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="group p-4 bg-gradient-to-r from-theme-success-50 to-theme-success-100 dark:from-theme-success-900/20 dark:to-theme-success-800/20 rounded-xl border border-theme-success-200 dark:border-theme-success-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-theme-success-500 rounded-full">
                      <Lightbulb className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-theme-success-800 dark:text-theme-success-200 text-sm mb-1">
                        {suggestion.suggestion}
                      </div>
                      <div className="text-xs text-theme-success-600 dark:text-theme-success-400">
                        {Math.round(suggestion.confidence * 100)}% confidence •{' '}
                        {suggestion.impact} impact
                      </div>
                    </div>
                    <button className="text-xs bg-theme-success-600 text-white px-3 py-1 rounded-full hover:bg-theme-success-700 transition-colors font-medium">
                      Apply
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-theme-secondary-100 dark:bg-theme-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain
                    className="w-6 h-6 text-theme-secondary-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="text-theme-text-600 text-sm mb-2">
                  AI is learning your patterns
                </div>
                <div className="text-theme-text-500 text-xs">
                  Set more alarms to unlock personalized insights
                </div>
              </div>
            )}

            {/* Community Stats */}
            <div className="pt-4 border-t border-theme-border-200 dark:border-theme-border-700">
              <div className="flex items-center gap-2 mb-3">
                <Users
                  className="w-4 h-4 text-theme-secondary-600"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-theme-text-700">
                  Community
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-theme-secondary-600">2.4K</div>
                  <div className="text-xs text-theme-text-500">Active Users</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-theme-secondary-600">94%</div>
                  <div className="text-xs text-theme-text-500">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Full-width Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <section
          className="alarm-card-glass"
          role="region"
          aria-labelledby="quick-actions-heading"
        >
          <h3
            id="quick-actions-heading"
            className="text-lg font-semibold mb-6 theme-text-primary flex items-center gap-2"
          >
            <Zap className="w-5 h-5 text-theme-primary-600" aria-hidden="true" />
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={onAddAlarm}
              className="group p-4 bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 hover:from-theme-primary-600 hover:to-theme-primary-700 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-theme-primary-500/25"
              aria-label="Add new alarm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                  <Plus className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Create New Alarm</div>
                  <div className="text-sm text-white/90">
                    Set up your perfect wake-up time
                  </div>
                </div>
                <ChevronRight
                  className="w-5 h-5 ml-auto opacity-70 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </div>
            </button>

            {onQuickSetup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onQuickSetup('morning')}
                  className="group p-4 bg-gradient-to-br from-theme-warning-400 to-theme-warning-500 hover:from-theme-warning-500 hover:to-theme-warning-600 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                  aria-label="Quick morning setup"
                >
                  <div className="text-center">
                    <Sunrise className="w-6 h-6 mx-auto mb-2" aria-hidden="true" />
                    <div className="font-semibold text-sm">Morning</div>
                    <div className="text-xs text-white/90">7:00 AM</div>
                  </div>
                </button>

                <button
                  onClick={() => onQuickSetup('work')}
                  className="group p-4 bg-gradient-to-br from-theme-accent-500 to-theme-accent-600 hover:from-theme-accent-600 hover:to-theme-accent-700 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                  aria-label="Quick work setup"
                >
                  <div className="text-center">
                    <Coffee className="w-6 h-6 mx-auto mb-2" aria-hidden="true" />
                    <div className="font-semibold text-sm">Work Day</div>
                    <div className="text-xs text-white/90">6:30 AM</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Advanced Features Card */}
        {!advancedFeaturesEnabled &&
          alarms &&
          alarms.length > 0 &&
          onNavigateToAdvanced && (
            <section
              className="alarm-card-glass bg-gradient-to-br from-theme-secondary-500/10 to-theme-secondary-600/5 border-theme-secondary-200 dark:border-theme-secondary-700"
              role="region"
              aria-labelledby="advanced-features-heading"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-theme-secondary-100 dark:bg-theme-secondary-900/30">
                  <Sparkles
                    className="w-5 h-5 text-theme-secondary-600"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3
                    id="advanced-features-heading"
                    className="text-lg font-semibold theme-text-primary"
                  >
                    Unlock AI Features
                  </h3>
                  <p className="text-sm text-theme-text-600">
                    Personalized optimization & insights
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-theme-surface-100 dark:bg-theme-surface-800 rounded-lg">
                  <Brain
                    className="w-5 h-5 mx-auto text-theme-secondary-600 mb-1"
                    aria-hidden="true"
                  />
                  <div className="text-xs text-theme-text-600">ML Learning</div>
                </div>
                <div className="text-center p-3 bg-theme-surface-100 dark:bg-theme-surface-800 rounded-lg">
                  <MapPin
                    className="w-5 h-5 mx-auto text-theme-secondary-600 mb-1"
                    aria-hidden="true"
                  />
                  <div className="text-xs text-theme-text-600">Location</div>
                </div>
                <div className="text-center p-3 bg-theme-surface-100 dark:bg-theme-surface-800 rounded-lg">
                  <TrendingUp
                    className="w-5 h-5 mx-auto text-theme-secondary-600 mb-1"
                    aria-hidden="true"
                  />
                  <div className="text-xs text-theme-text-600">Analytics</div>
                </div>
              </div>

              <button
                onClick={onNavigateToAdvanced}
                className="w-full bg-gradient-to-r from-theme-secondary-600 to-theme-secondary-700 hover:from-theme-secondary-700 hover:to-theme-secondary-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                aria-label="Enable advanced AI features"
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" aria-hidden="true" />
                  Enable AI Features
                </div>
              </button>
            </section>
          )}
      </div>

      {/* Insights and Suggestions */}
      {(smartInsights.length > 0 || optimizationSuggestions.length > 0) && (
        <section
          className="alarm-card-glass bg-gradient-to-br from-theme-info-500/10 to-theme-info-600/5"
          role="region"
          aria-labelledby="smart-insights-heading"
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              id="smart-insights-heading"
              className="text-lg font-semibold theme-text-primary flex items-center gap-2"
            >
              <Lightbulb className="w-5 h-5 text-theme-info-600" aria-hidden="true" />
              Personalized Suggestions
            </h3>
          </div>

          <div className="space-y-3">
            {optimizationSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 bg-theme-surface-50 dark:bg-theme-surface-800 rounded-xl border border-theme-border-200 dark:border-theme-border-700 hover:bg-theme-surface-100 dark:hover:bg-theme-surface-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-theme-success-100 dark:bg-theme-success-900/30">
                    <CheckCircle
                      className="w-4 h-4 text-theme-success-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium theme-text-primary text-sm mb-1">
                      {suggestion.suggestion}
                    </div>
                    <div className="text-xs text-theme-text-500">
                      {Math.round(suggestion.confidence * 100)}% confidence •{' '}
                      {suggestion.impact} impact
                    </div>
                  </div>
                  <button className="text-xs bg-theme-primary-600 text-white px-3 py-1 rounded-full hover:bg-theme-primary-700 transition-colors font-medium">
                    Apply
                  </button>
                </div>
              </div>
            ))}

            {smartInsights.map((insight: any) => (
              <div
                key={insight.id}
                className="p-4 bg-theme-surface-50 dark:bg-theme-surface-800 rounded-xl border border-theme-border-200 dark:border-theme-border-700"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1 rounded-full ${
                      insight.priority === 'high'
                        ? 'bg-theme-error-100 dark:bg-theme-error-900/30'
                        : insight.priority === 'medium'
                          ? 'bg-theme-warning-100 dark:bg-theme-warning-900/30'
                          : 'bg-theme-info-100 dark:bg-theme-info-900/30'
                    }`}
                  >
                    <AlertCircle
                      className={`w-4 h-4 ${
                        insight.priority === 'high'
                          ? 'text-theme-error-600'
                          : insight.priority === 'medium'
                            ? 'text-theme-warning-600'
                            : 'text-theme-info-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium theme-text-primary text-sm mb-1">
                      {insight.title}
                    </div>
                    <div className="text-xs text-theme-text-500">
                      {insight.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Action Button */}
      <button
        onClick={onAddAlarm}
        className="fab fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 hover:from-theme-primary-600 hover:to-theme-primary-700 text-white rounded-full shadow-2xl hover:shadow-theme-primary-500/30 transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Add new alarm"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </button>
    </main>
  );
};

export default Dashboard;

// Enhanced Dashboard Styles
export const dashboardStyles = {
  heroSection: 'relative overflow-hidden',
  heroCard:
    'alarm-card-glass bg-gradient-to-br from-theme-primary-500/10 via-theme-secondary-500/5 to-theme-accent-500/10 p-8 text-center',
  timeDisplay: 'text-6xl font-bold time-display mb-2',
  dateDisplay: 'text-theme-text-600 text-lg font-medium mb-4',
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  actionCard:
    'group p-4 bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 hover:from-theme-primary-600 hover:to-theme-primary-700 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-theme-primary-500/25',
  fab: 'fab fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 hover:from-theme-primary-600 hover:to-theme-primary-700 text-white rounded-full shadow-2xl hover:shadow-theme-primary-500/30 transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center',
};
