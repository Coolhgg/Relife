// Analytics Dashboard Component
// Displays app usage insights and error tracking information

import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, AlertTriangle, TrendingUp, Eye, Shield } from 'lucide-react';
import AppAnalyticsService from '../services/app-analytics';
import PrivacyComplianceService from '../services/privacy-compliance';
import PerformanceAnalyticsService from '../services/performance-analytics';

interface AnalyticsDashboard {
  onPrivacySettingsClick: () => void;
}

export default function AnalyticsDashboard({ onPrivacySettingsClick }: AnalyticsDashboard) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [privacyStatus, setPrivacyStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const appAnalytics = AppAnalyticsService.getInstance();
  const privacyService = PrivacyComplianceService.getInstance();
  const performanceService = PerformanceAnalyticsService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load performance data
      const performance = performanceService.getPerformanceSummary();
      setPerformanceData(performance);
      
      // Load privacy status
      const consent = privacyService.getConsent();
      const compliance = privacyService.isCompliant();
      setPrivacyStatus({ consent, compliance });
      
      // Mock analytics data (in real app, this would come from PostHog API)
      const mockAnalytics = {
        totalUsers: 1247,
        activeUsers: 892,
        totalAlarms: 3421,
        alarmsTriggered: 2845,
        successfulWakeups: 2456,
        topFeatures: [
          { name: 'Voice Commands', usage: 78 },
          { name: 'Quick Setup', usage: 65 },
          { name: 'Snooze', usage: 42 },
          { name: 'Rewards', usage: 38 }
        ],
        errorRate: 2.3,
        performanceScore: 87
      };
      setAnalyticsData(mockAnalytics);
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Insights into app usage and performance</p>
        </div>
        <button
          onClick={onPrivacySettingsClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Privacy Settings
        </button>
      </div>

      {/* Privacy Status */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy & Consent Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
              privacyStatus?.consent?.analytics ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Analytics</p>
            <p className="text-xs text-gray-500">{privacyStatus?.consent?.analytics ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
              privacyStatus?.consent?.errorTracking ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Error Tracking</p>
            <p className="text-xs text-gray-500">{privacyStatus?.consent?.errorTracking ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
              privacyStatus?.consent?.performance ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Performance</p>
            <p className="text-xs text-gray-500">{privacyStatus?.consent?.performance ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
              privacyStatus?.consent?.sessionRecording ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Eye className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Recording</p>
            <p className="text-xs text-gray-500">{privacyStatus?.consent?.sessionRecording ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData?.totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData?.activeUsers || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Alarms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData?.totalAlarms || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData?.errorRate || 0}%</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Core Web Vitals</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">LCP</span>
                <span className="text-sm font-medium">{performanceData?.webVitals?.LCP?.toFixed(0) || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">FID</span>
                <span className="text-sm font-medium">{performanceData?.webVitals?.FID?.toFixed(0) || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">CLS</span>
                <span className="text-sm font-medium">{performanceData?.webVitals?.CLS?.toFixed(3) || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Performance Issues</p>
            <div className="space-y-2">
              {performanceData?.issues?.slice(0, 3).map((issue: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    issue.severity === 'critical' ? 'bg-red-500' : 
                    issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm">{issue.metric}</span>
                </div>
              )) || <p className="text-sm text-gray-500">No issues detected</p>}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Top Features</p>
            <div className="space-y-2">
              {analyticsData?.topFeatures?.slice(0, 3).map((feature: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm">{feature.name}</span>
                  <span className="text-sm font-medium">{feature.usage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}