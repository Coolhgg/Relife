/**
 * Performance Dashboard Component
 * Displays performance monitoring and analytics data
 */

import React, { useState, useEffect, useCallback } from 'react';
import PerformanceMonitor from '../services/performance-monitor';
import AnalyticsService from '../services/analytics';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
}

interface DashboardState {
  performanceData: {
    webVitals: WebVitalMetric[];
    customMetrics: Array<{ name: string; value: number; timestamp: number }>;
    memoryUsage: number;
    errors: number;
    slowResources: number;
  };
  analyticsData: {
    currentSession: any;
    totalEvents: number;
    featuresUsed: number;
    behavior: any;
  };
  isLoading: boolean;
  autoRefresh: boolean;
}

const PerformanceDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    performanceData: {
      webVitals: [],
      customMetrics: [],
      memoryUsage: 0,
      errors: 0,
      slowResources: 0,
    },
    analyticsData: {
      currentSession: null,
      totalEvents: 0,
      featuresUsed: 0,
      behavior: null,
    },
    isLoading: true,
    autoRefresh: true,
  });

  const [activeTab, setActiveTab] = useState<'performance' | 'analytics' | 'behavior'>('performance');

  const refreshData = useCallback(async () => {
    try {
      const performanceMonitor = PerformanceMonitor;
      const analytics = AnalyticsService.getInstance();

      const performanceSummary = performanceMonitor.getPerformanceSummary();
      const analyticsSummary = analytics.getAnalyticsSummary();

      setState(prev => ({
        ...prev,
        performanceData: {
          webVitals: [
            {
              name: 'LCP',
              value: performanceSummary.webVitals.lcp || 0,
              rating: getRating(performanceSummary.webVitals.lcp || 0, { good: 2500, poor: 4000 }),
              threshold: { good: 2500, poor: 4000 },
            },
            {
              name: 'FID',
              value: performanceSummary.webVitals.fid || 0,
              rating: getRating(performanceSummary.webVitals.fid || 0, { good: 100, poor: 300 }),
              threshold: { good: 100, poor: 300 },
            },
            {
              name: 'CLS',
              value: performanceSummary.webVitals.cls || 0,
              rating: getRating(performanceSummary.webVitals.cls || 0, { good: 0.1, poor: 0.25 }),
              threshold: { good: 0.1, poor: 0.25 },
            },
            {
              name: 'FCP',
              value: performanceSummary.webVitals.fcp || 0,
              rating: getRating(performanceSummary.webVitals.fcp || 0, { good: 1800, poor: 3000 }),
              threshold: { good: 1800, poor: 3000 },
            },
            {
              name: 'TTFB',
              value: performanceSummary.webVitals.ttfb || 0,
              rating: getRating(performanceSummary.webVitals.ttfb || 0, { good: 800, poor: 1800 }),
              threshold: { good: 800, poor: 1800 },
            },
          ],
          customMetrics: performanceSummary.customMetrics.slice(-10),
          memoryUsage: performanceSummary.memoryUsage,
          errors: performanceSummary.errorCount,
          slowResources: performanceSummary.slowResources,
        },
        analyticsData: analyticsSummary,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    refreshData();

    if (state.autoRefresh) {
      const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [refreshData, state.autoRefresh]);

  const getRating = (value: number, threshold: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const exportData = () => {
    const performanceMonitor = PerformanceMonitor;
    const analytics = AnalyticsService.getInstance();

    const data = {
      performance: performanceMonitor.getPerformanceSummary(),
      analytics: analytics.exportData(),
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all performance and analytics data?')) {
      const performanceMonitor = PerformanceMonitor;
      const analytics = AnalyticsService.getInstance();

      performanceMonitor.clearData();
      analytics.clearData();
      refreshData();
    }
  };

  const MetricCard: React.FC<{ title: string; value: string | number; subtitle?: string; rating?: string }> = ({
    title,
    value,
    subtitle,
    rating
  }) => (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${
      rating === 'good' ? 'border-green-200' :
      rating === 'needs-improvement' ? 'border-yellow-200' :
      rating === 'poor' ? 'border-red-200' : 'border-gray-200'
    }`}>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className={`text-2xl font-bold ${
        rating === 'good' ? 'text-green-600' :
        rating === 'needs-improvement' ? 'text-yellow-600' :
        rating === 'poor' ? 'text-red-600' : 'text-gray-900'
      }`}>
        {value}
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
            className={`px-4 py-2 rounded-lg font-medium ${
              state.autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {state.autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </button>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            🔄 Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
          >
            📊 Export
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['performance', 'analytics', 'behavior'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {state.performanceData.webVitals.map((vital) => (
                <MetricCard
                  key={vital.name}
                  title={vital.name}
                  value={vital.name === 'CLS' ? vital.value.toFixed(3) : formatDuration(vital.value)}
                  rating={vital.rating}
                  subtitle={`Good: ${vital.name === 'CLS' ? vital.threshold.good : formatDuration(vital.threshold.good)}`}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Memory Usage"
                value={formatBytes(state.performanceData.memoryUsage)}
                subtitle="Current usage"
              />
              <MetricCard
                title="Errors"
                value={state.performanceData.errors}
                subtitle="Total errors logged"
                rating={state.performanceData.errors === 0 ? 'good' : state.performanceData.errors < 5 ? 'needs-improvement' : 'poor'}
              />
              <MetricCard
                title="Slow Resources"
                value={state.performanceData.slowResources}
                subtitle="Resources >1s load time"
                rating={state.performanceData.slowResources === 0 ? 'good' : state.performanceData.slowResources < 3 ? 'needs-improvement' : 'poor'}
              />
              <MetricCard
                title="Custom Metrics"
                value={state.performanceData.customMetrics.length}
                subtitle="Tracked metrics"
              />
            </div>
          </div>

          {state.performanceData.customMetrics.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Custom Metrics</h2>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="space-y-2">
                  {state.performanceData.customMetrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-900">{metric.name}</span>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-blue-600">{formatDuration(metric.value)}</span>
                        <div className="text-xs text-gray-500">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Current Session"
                value={state.analyticsData.currentSession ? 'Active' : 'Inactive'}
                subtitle={state.analyticsData.currentSession
                  ? `${Math.floor((Date.now() - state.analyticsData.currentSession.startTime) / 60000)}m ago`
                  : 'No active session'
                }
              />
              <MetricCard
                title="Total Events"
                value={state.analyticsData.totalEvents}
                subtitle="Events tracked"
              />
              <MetricCard
                title="Features Used"
                value={state.analyticsData.featuresUsed}
                subtitle="Unique features"
              />
              <MetricCard
                title="Page Views"
                value={state.analyticsData.currentSession?.pageViews || 0}
                subtitle="Current session"
              />
            </div>
          </div>

          {state.analyticsData.currentSession && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Details</h2>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Session Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Started:</span>{' '}
                        <span className="font-medium">
                          {new Date(state.analyticsData.currentSession.startTime).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>{' '}
                        <span className="font-medium">
                          {formatDuration(Date.now() - state.analyticsData.currentSession.startTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interactions:</span>{' '}
                        <span className="font-medium">{state.analyticsData.currentSession.interactions}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Device Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Screen:</span>{' '}
                        <span className="font-medium">
                          {state.analyticsData.currentSession.device.screen.width} × {state.analyticsData.currentSession.device.screen.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Language:</span>{' '}
                        <span className="font-medium">{state.analyticsData.currentSession.device.language}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Timezone:</span>{' '}
                        <span className="font-medium">{state.analyticsData.currentSession.device.timezone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <div className="space-y-6">
          {state.analyticsData.behavior ? (
            <>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Patterns</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Sessions"
                    value={state.analyticsData.behavior.totalSessions}
                    subtitle="All time"
                  />
                  <MetricCard
                    title="Avg Session Duration"
                    value={formatDuration(state.analyticsData.behavior.averageSessionDuration)}
                    subtitle="Per session"
                  />
                  <MetricCard
                    title="Total Time"
                    value={formatDuration(state.analyticsData.behavior.totalTimeSpent)}
                    subtitle="All sessions"
                  />
                  <MetricCard
                    title="Bounce Rate"
                    value={`${(state.analyticsData.behavior.navigationPatterns.bounceRate * 100).toFixed(1)}%`}
                    subtitle="Single page visits"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Most Used Features</h2>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  {state.analyticsData.behavior.mostUsedFeatures.length > 0 ? (
                    <div className="space-y-3">
                      {state.analyticsData.behavior.mostUsedFeatures.slice(0, 10).map((feature, index) => (
                        <div key={feature.feature} className="flex justify-between items-center py-2">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <span className="font-medium">{feature.feature}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold text-blue-600">{feature.count}</span>
                            <div className="text-xs text-gray-500">uses</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No feature usage data available</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alarm Patterns</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Alarms"
                    value={state.analyticsData.behavior.alarmPatterns.totalAlarms}
                    subtitle="Created"
                  />
                  <MetricCard
                    title="Avg per Day"
                    value={state.analyticsData.behavior.alarmPatterns.averageAlarmsPerDay.toFixed(1)}
                    subtitle="Alarms created"
                  />
                  <MetricCard
                    title="Dismiss Rate"
                    value={`${(state.analyticsData.behavior.alarmPatterns.dismissRate * 100).toFixed(1)}%`}
                    subtitle="Dismissed vs triggered"
                  />
                  <MetricCard
                    title="Snooze Rate"
                    value={`${(state.analyticsData.behavior.alarmPatterns.snoozeRate * 100).toFixed(1)}%`}
                    subtitle="Snoozed vs triggered"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Navigation Patterns</h2>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  {state.analyticsData.behavior.navigationPatterns.mostVisitedPages.length > 0 ? (
                    <div className="space-y-3">
                      {state.analyticsData.behavior.navigationPatterns.mostVisitedPages.map((page, index) => (
                        <div key={page.page} className="flex justify-between items-center py-2">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm font-bold flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <span className="font-medium">{page.page}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold text-green-600">{page.visits}</span>
                            <div className="text-xs text-gray-500">visits</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No navigation data available</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No behavior data available yet</p>
              <p className="text-gray-400 mt-2">Use the app to generate analytics data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;