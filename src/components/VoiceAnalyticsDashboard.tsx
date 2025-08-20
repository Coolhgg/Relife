// Voice Analytics Dashboard for Relife Smart Alarm
// Comprehensive voice usage statistics, accuracy metrics, and insights

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Activity,
  Zap,
  Target,
  Award,
  Brain,
  Shield,
  Volume2,
  Activity as Waveform,
  Filter,
  Calendar,
  Download,
} from 'lucide-react';
import VoiceBiometricsService from '../services/voice-biometrics';
import VoiceAIEnhancedService from '../services/voice-ai-enhanced';
import useAuth from '../hooks/useAuth';

interface VoiceAnalytics {
  usage: {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    averageResponseTime: number;
    dailyUsage: { date: string; commands: number; success_rate: number }[];
    topCommands: { command: string; usage_count: number; success_rate: number }[];
  };
  accuracy: {
    overallAccuracy: number;
    accuracyTrend: { date: string; accuracy: number }[];
    voicePrintQuality: number;
    authenticationSuccess: number;
    biometricStrength: number;
  };
  personalization: {
    preferredVoiceMood: string;
    moodEffectiveness: { mood: string; success_rate: number; usage_count: number }[];
    adaptationScore: number;
    learningProgress: number;
  };
  insights: {
    recommendations: string[];
    patterns: string[];
    achievements: string[];
    nextSteps: string[];
  };
}

const VoiceAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<VoiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'accuracy' | 'personalization' | 'insights'
  >('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const voiceBiometrics = VoiceBiometricsService.getInstance();
  const voiceAI = VoiceAIEnhancedService.getInstance();

  useEffect(() => {
    if (user) {
      loadVoiceAnalytics();
    }
  }, [user, timeRange]);

  const loadVoiceAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load analytics data from various services
      const [usageData, accuracyData, personalizationData, insightsData] =
        await Promise.all([
          loadUsageAnalytics(),
          loadAccuracyAnalytics(),
          loadPersonalizationAnalytics(),
          loadInsightsData(),
        ]);

      setAnalytics({
        usage: usageData,
        accuracy: accuracyData,
        personalization: personalizationData,
        insights: insightsData,
      });
    } catch (error) {
      console.error('Failed to load voice analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageAnalytics = async (): Promise<VoiceAnalytics['usage']> => {
    // In a real app, this would fetch from the database
    return {
      totalCommands: 1247,
      successfulCommands: 1089,
      failedCommands: 158,
      averageResponseTime: 1.3,
      dailyUsage: generateMockDailyUsage(),
      topCommands: [
        { command: 'dismiss alarm', usage_count: 245, success_rate: 96.7 },
        { command: 'snooze', usage_count: 189, success_rate: 94.2 },
        { command: 'create alarm', usage_count: 156, success_rate: 87.8 },
        { command: 'what time is it', usage_count: 134, success_rate: 99.2 },
        { command: 'go to settings', usage_count: 98, success_rate: 89.7 },
      ],
    };
  };

  const loadAccuracyAnalytics = async (): Promise<VoiceAnalytics['accuracy']> => {
    const trainingProgress = await voiceBiometrics.getTrainingProgress(user!.id);

    return {
      overallAccuracy: 87.3,
      accuracyTrend: generateMockAccuracyTrend(),
      voicePrintQuality: trainingProgress.averageQuality * 100,
      authenticationSuccess: 94.7,
      biometricStrength: 89.2,
    };
  };

  const loadPersonalizationAnalytics = async (): Promise<
    VoiceAnalytics['personalization']
  > => {
    return {
      preferredVoiceMood: 'motivational',
      moodEffectiveness: [
        { mood: 'motivational', success_rate: 89.7, usage_count: 234 },
        { mood: 'gentle', success_rate: 87.2, usage_count: 189 },
        { mood: 'drill-sergeant', success_rate: 91.4, usage_count: 156 },
        { mood: 'sweet-angel', success_rate: 85.6, usage_count: 134 },
        { mood: 'anime-hero', success_rate: 88.9, usage_count: 98 },
        { mood: 'savage-roast', success_rate: 83.1, usage_count: 67 },
      ],
      adaptationScore: 92.4,
      learningProgress: 78.6,
    };
  };

  const loadInsightsData = async (): Promise<VoiceAnalytics['insights']> => {
    return {
      recommendations: [
        'Your voice recognition accuracy is highest in the morning - consider more morning alarms',
        'Training with more varied phrases could improve accuracy by 5-10%',
        'Your response time is fastest with motivational voice mood',
        'Consider using voice authentication for added security',
      ],
      patterns: [
        'Most commands used between 6-9 AM',
        'Higher success rate on weekdays than weekends',
        'Voice quality improves after 3+ training sessions',
        'Mood preferences vary by time of day',
      ],
      achievements: [
        'Voice Recognition Expert - 1000+ successful commands',
        'Early Bird - Most active voice user in morning hours',
        'Personalization Master - AI adaptation score above 90%',
        'Consistent User - 30 days of regular voice interaction',
      ],
      nextSteps: [
        'Complete 2 more voice training sessions for optimal accuracy',
        'Try voice mood rotation to find new preferences',
        'Enable voice authentication for enhanced security',
        'Explore advanced voice commands for smart home control',
      ],
    };
  };

  const generateMockDailyUsage = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      commands: Math.floor(Math.random() * 30) + 10,
      success_rate: Math.random() * 20 + 80,
    }));
  };

  const generateMockAccuracyTrend = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      accuracy: Math.random() * 15 + 80 + i * 0.1, // Slight upward trend
    }));
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-slate-700">
            Loading voice analytics...
          </span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Mic className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No Voice Data Available
          </h3>
          <p className="text-slate-500">
            Start using voice commands to see your analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Voice Analytics
              </h1>
              <p className="text-slate-600">
                Comprehensive insights into your voice interaction patterns and accuracy
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>

              <button
                onClick={exportAnalytics}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Total Commands</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {analytics.usage.totalCommands.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mic className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(
                      (analytics.usage.successfulCommands /
                        analytics.usage.totalCommands) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {analytics.usage.averageResponseTime}s
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Biometric Strength</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analytics.accuracy.biometricStrength}%
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/50 backdrop-blur-sm p-1 rounded-2xl mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'accuracy', label: 'Accuracy', icon: Target },
            { id: 'personalization', label: 'Personalization', icon: Brain },
            { id: 'insights', label: 'Insights', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Usage Chart */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    Daily Voice Usage
                  </h3>
                  <div className="h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex items-end justify-between space-x-2">
                    {analytics.usage.dailyUsage.slice(-14).map((day, index) => (
                      <div
                        key={day.date}
                        className="flex flex-col items-center space-y-2"
                      >
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-8 transition-all hover:from-blue-600 hover:to-blue-500"
                          style={{ height: `${(day.commands / 40) * 200}px` }}
                        />
                        <span className="text-xs text-slate-500 rotate-45 origin-center">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Commands */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    Most Used Commands
                  </h3>
                  <div className="space-y-4">
                    {analytics.usage.topCommands.map((command, index) => (
                      <div
                        key={command.command}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              "{command.command}"
                            </p>
                            <p className="text-sm text-slate-500">
                              {command.usage_count} uses
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {command.success_rate}%
                          </p>
                          <p className="text-xs text-slate-500">success rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accuracy' && (
              <div className="space-y-8">
                {/* Accuracy Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-800">Overall Accuracy</h4>
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analytics.accuracy.overallAccuracy}%
                    </div>
                    <p className="text-sm text-slate-500">
                      Recognition accuracy across all commands
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-800">
                        Voice Print Quality
                      </h4>
                      <Waveform className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analytics.accuracy.voicePrintQuality.toFixed(1)}%
                    </div>
                    <p className="text-sm text-slate-500">
                      Biometric voice signature strength
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-800">
                        Authentication Success
                      </h4>
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {analytics.accuracy.authenticationSuccess}%
                    </div>
                    <p className="text-sm text-slate-500">
                      Voice-based identity verification
                    </p>
                  </div>
                </div>

                {/* Accuracy Trend */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    Accuracy Trend
                  </h3>
                  <div className="h-64 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 flex items-end justify-between space-x-1">
                    {analytics.accuracy.accuracyTrend.slice(-30).map((point, index) => (
                      <div
                        key={point.date}
                        className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg w-2 hover:from-green-600 hover:to-green-500 transition-colors"
                        style={{ height: `${(point.accuracy / 100) * 200}px` }}
                        title={`${point.date}: ${point.accuracy.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personalization' && (
              <div className="space-y-8">
                {/* Personalization Score */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    AI Personalization
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600">Adaptation Score</span>
                        <span className="text-xl font-bold text-blue-600">
                          {analytics.personalization.adaptationScore}%
                        </span>
                      </div>
                      <div className="bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${analytics.personalization.adaptationScore}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        How well the AI adapts to your patterns
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600">Learning Progress</span>
                        <span className="text-xl font-bold text-green-600">
                          {analytics.personalization.learningProgress}%
                        </span>
                      </div>
                      <div className="bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${analytics.personalization.learningProgress}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Voice pattern learning completion
                      </p>
                    </div>
                  </div>
                </div>

                {/* Voice Mood Effectiveness */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    Voice Mood Effectiveness
                  </h3>
                  <div className="space-y-4">
                    {analytics.personalization.moodEffectiveness.map(mood => (
                      <div
                        key={mood.mood}
                        className="p-4 bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Volume2 className="h-5 w-5 text-purple-600" />
                            <span className="font-medium capitalize text-slate-800">
                              {mood.mood}
                            </span>
                            <span className="text-sm text-slate-500">
                              ({mood.usage_count} uses)
                            </span>
                          </div>
                          <span className="font-semibold text-purple-600">
                            {mood.success_rate}%
                          </span>
                        </div>
                        <div className="bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-400 h-full rounded-full"
                            style={{ width: `${mood.success_rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-8">
                {/* Achievements */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    Voice Achievements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.insights.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl"
                      >
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Award className="h-5 w-5 text-yellow-600" />
                        </div>
                        <span className="font-medium text-slate-800">
                          {achievement}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Recommendations */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {analytics.insights.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                        >
                          <div className="bg-blue-100 p-1 rounded-full mt-1">
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm text-slate-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patterns */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">
                      Usage Patterns
                    </h4>
                    <div className="space-y-3">
                      {analytics.insights.patterns.map((pattern, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
                        >
                          <div className="bg-green-100 p-1 rounded-full mt-1">
                            <Activity className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm text-slate-700">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">
                    Next Steps
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.insights.nextSteps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl"
                      >
                        <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-slate-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceAnalyticsDashboard;
