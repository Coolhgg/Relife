import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Eye,
  Target,
  Zap,
} from 'lucide-react';
import { useAnalyticsContext } from './AnalyticsProvider';

interface AnalyticsMetric {
  name: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface UsageData {
  totalSessions: number;
  averageSessionDuration: number;
  totalPageViews: number;
  uniqueFeatures: number;
  totalAlarms: number;
  engagementScore: number;
  retentionRate: number;
  errorRate: number;
}

const AnalyticsDashboard: React.FC = () => {
  const { track, trackPageView } = useAnalyticsContext();
  const [usageData, setUsageData] = useState<UsageData>({
    totalSessions: 0,
    averageSessionDuration: 0,
    totalPageViews: 0,
    uniqueFeatures: 0,
    totalAlarms: 0,
    engagementScore: 0,
    retentionRate: 0,
    errorRate: 0,
  });
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    trackPageView('analytics-dashboard', {
      user_role: 'admin', // This would be dynamic based on _user permissions
      time_range: timeRange,
    });

    // Load analytics data from localStorage (in real app, this would be from API)
    loadAnalyticsData();
  }, [trackPageView, timeRange]);

  const loadAnalyticsData = () => {
    // Simulate loading analytics data
    // In a real app, this would fetch from PostHog API or your backend
    const simulatedData: UsageData = {
      totalSessions: Math.floor(Math.random() * 1000) + 500,
      averageSessionDuration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
      totalPageViews: Math.floor(Math.random() * 5000) + 2000,
      uniqueFeatures: Math.floor(Math.random() * 15) + 8,
      totalAlarms: Math.floor(Math.random() * 200) + 50,
      engagementScore: Math.floor(Math.random() * 40) + 60, // 60-100%
      retentionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
      errorRate: Math.floor(Math.random() * 5) + 1, // 1-5%
    };

    setUsageData(simulatedData);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatChange = (current: number, previous: number): string => {
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getTrendIcon = (change: string): 'up' | 'down' | 'neutral' => {
    if (change.startsWith('+')) return 'up';
    if (change.startsWith('-')) return 'down';
    return 'neutral';
  };

  const metrics: AnalyticsMetric[] = [
    {
      name: 'Total Sessions',
      value: usageData.totalSessions.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-500',
    },
    {
      name: 'Avg Session Duration',
      value: formatDuration(usageData.averageSessionDuration),
      change: '+8.2%',
      trend: 'up',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-green-500',
    },
    {
      name: 'Page Views',
      value: usageData.totalPageViews.toLocaleString(),
      change: '+15.3%',
      trend: 'up',
      icon: <Eye className="h-5 w-5" />,
      color: 'bg-purple-500',
    },
    {
      name: 'Features Used',
      value: usageData.uniqueFeatures,
      change: '+6.1%',
      trend: 'up',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-orange-500',
    },
    {
      name: 'Total Alarms',
      value: usageData.totalAlarms.toLocaleString(),
      change: '+22.8%',
      trend: 'up',
      icon: <Activity className="h-5 w-5" />,
      color: 'bg-indigo-500',
    },
    {
      name: 'Engagement Score',
      value: `${usageData.engagementScore}%`,
      change: '+4.2%',
      trend: 'up',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-emerald-500',
    },
    {
      name: 'Retention Rate',
      value: `${usageData.retentionRate}%`,
      change: '+1.8%',
      trend: 'up',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-yellow-500',
    },
    {
      name: 'Error Rate',
      value: `${usageData.errorRate}%`,
      change: '-0.5%',
      trend: 'down',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-red-500',
    },
  ];

  const handleTimeRangeChange = (range: 'day' | 'week' | 'month') => {
    setTimeRange(range);
    track('analytics_time_range_changed', {
      previous_range: timeRange,
      new_range: range,
      timestamp: new Date().toISOString(),
    });
    loadAnalyticsData(); // Reload data for new time range
  };

  const handleExportData = () => {
    track('analytics_data_exported', {
      time_range: timeRange,
      metrics_count: metrics.length,
      timestamp: new Date().toISOString(),
    });

    // Simulate data export
    const exportData = {
      timeRange,
      generatedAt: new Date().toISOString(),
      metrics: usageData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relife-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights into _user behavior and app performance
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, _index) => (
          <div
            key={metric.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg text-white`}>
                {metric.icon}
              </div>
              {metric.change && (
                <div
                  className={`flex items-center text-sm font-medium ${
                    metric.trend === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : metric.trend === 'down'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 mr-1 ${
                      metric.trend === 'down' ? 'rotate-180' : ''
                    }`}
                  />
                  {metric.change}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                {metric.name}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Key Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Engagement Insights */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              User Engagement
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Session Quality
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  High
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Feature Adoption
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {Math.round((usageData.uniqueFeatures / 20) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  User Retention
                </span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {usageData.retentionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              App Performance
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Error Rate
                </span>
                <span
                  className={`text-sm font-medium ${
                    usageData.errorRate < 2
                      ? 'text-green-600 dark:text-green-400'
                      : usageData.errorRate < 5
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {usageData.errorRate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Load Performance
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Excellent
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  PWA Score
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  92%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Optimization Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Feature Discovery
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Consider adding feature highlights to increase usage of underutilized
              features.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              User Onboarding
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Extended session durations suggest users are engaged - optimize onboarding
              flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
