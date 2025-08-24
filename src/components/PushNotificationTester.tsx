import React, { useState, useCallback } from 'react';
import {
  TestTube,
  Send,
  Clock,
  Zap,
  TrendingUp,
  Shield,
  Bell,
  CheckCircle,
  XCircle,
  Alert,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAnalytics } from '../hooks/useAnalytics';
import { TimeoutHandle } from '../types/timers';

interface TestResult {
  id: string;
  type: string;
  title: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  error?: string;
  duration?: number;
}

export const PushNotificationTester: React.FC = () => {
  const { status, testNotification, sendDailyMotivation, sendWeeklyProgress } =
    usePushNotifications();
  const { track } = useAnalytics();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<string>('basic');

  const testTypes = [
    {
      id: 'basic',
      title: 'Basic Test',
      description: 'Simple test notification',
      icon: TestTube,
      color: 'blue',
    },
    {
      id: 'alarm',
      title: 'Alarm Notification',
      description: 'Simulated alarm notification',
      icon: Clock,
      color: 'orange',
    },
    {
      id: 'motivation',
      title: 'Daily Motivation',
      description: 'Motivational message',
      icon: Zap,
      color: 'yellow',
    },
    {
      id: 'progress',
      title: 'Weekly Progress',
      description: 'Progress statistics',
      icon: TrendingUp,
      color: 'green',
    },
    {
      id: 'emergency',
      title: 'Emergency Alert',
      description: 'High priority notification',
      icon: Shield,
      color: 'red',
    },
  ];

  const addTestResult = useCallback(
    (
      type: string,
      title: string,
      status: 'success' | 'error',
      error?: string,
      duration?: number
    ) => {
      const result: TestResult = {
        id: Date.now().toString(),
        type,
        title,
        status,
        timestamp: new Date(),
        error,
        duration,
      };

      setTestResults((prev: any) => // auto: implicit any [result, ...prev.slice(0, 9)]); // Keep last 10 results
    },
    []
  );

  const runSingleTest = useCallback(
    async (testType: string) => {
      const startTime = Date.now();

      try {
        switch (testType) {
          case 'basic':
            await testNotification();
            break;
          case 'motivation':
            await sendDailyMotivation(
              "🌟 You're doing amazing! Keep pushing forward and make today count!"
            );
            break;
          case 'progress':
            await sendWeeklyProgress({
              alarmsTriggered: 12,
              streak: 5,
              averageWakeTime: '7:15 AM',
              improvementTrend: 'up',
            });
            break;
          case 'alarm':
            // For testing, we'll use the basic test notification but with alarm styling
            await testNotification();
            break;
          case 'emergency':
            // For testing, we'll use the basic test notification
            await testNotification();
            break;
          default:
            throw new Error('Unknown test type');
        }

        const duration = Date.now() - startTime;
        const testTypeData = testTypes.find(t => t.id === testType);

        addTestResult(
          testType,
          testTypeData?.title || 'Unknown Test',
          'success',
          undefined,
          duration
        );

        track('push_notification_test_success', {
          testType,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        const testTypeData = testTypes.find(t => t.id === testType);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        addTestResult(
          testType,
          testTypeData?.title || 'Unknown Test',
          'error',
          errorMessage,
          duration
        );

        track('push_notification_test_error', {
          testType,
          error: errorMessage,
          duration,
        });
      }
    },
    [
      testNotification,
      sendDailyMotivation,
      sendWeeklyProgress,
      addTestResult,
      testTypes,
      track,
    ]
  );

  const runAllTests = useCallback(async () => {
    if (!status.hasPermission) {
      return;
    }

    setIsRunningTests(true);
    track('push_notification_test_suite_start');

    try {
      for (const testType of testTypes) {
        await runSingleTest(testType.id);
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      track('push_notification_test_suite_complete');
    } catch (error) {
      track('push_notification_test_suite_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunningTests(false);
    }
  }, [status.hasPermission, testTypes, runSingleTest, track]);

  const clearResults = useCallback(() => {
    setTestResults([]);
    track('push_notification_test_results_cleared');
  }, [track]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Alert className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  if (!status.isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Alert className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
              Push Notification Testing Not Available
            </h3>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
              Push notifications are not supported on this platform.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Push Notification Tester
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Test different types of push notifications
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${status.hasPermission ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {status.hasPermission ? 'Ready for testing' : 'Permission required'}
            </span>
          </div>
        </div>

        {!status.hasPermission && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm">
              Push notification permission is required to run tests. Please enable
              notifications in the settings first.
            </p>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Controls
        </h3>

        {/* Test Type Selection */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Test Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testTypes.map(testType => {
              const Icon = testType.icon;
              return (
                <button
                  key={testType.id}
                  onClick={() => setSelectedTestType(testType.id)}
                  disabled={!status.hasPermission || isRunningTests}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    selectedTestType === testType.id
                      ? `border-${testType.color}-500 ${getColorClasses(testType.color)}`
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${!status.hasPermission || isRunningTests ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{testType.title}</div>
                      <div className="text-xs opacity-75">{testType.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => runSingleTest(selectedTestType)}
            disabled={!status.hasPermission || isRunningTests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
            Test Selected
          </button>

          <button
            onClick={runAllTests}
            disabled={!status.hasPermission || isRunningTests}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {isRunningTests ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </button>

          {testResults.length > 0 && (
            <button
              onClick={clearResults}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Results
          </h3>

          {/* Results Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {testResults.filter((r: any) => // auto: implicit any r.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {testResults.filter((r: any) => // auto: implicit any r.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {testResults.length > 0
                  ? Math.round(
                      testResults.reduce((acc, r) => acc + (r.duration || 0), 0) /
                        testResults.length
                    )
                  : 0}
                ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Duration
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {testResults.map((result: any) => // auto: implicit any (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {result.timestamp.toLocaleTimeString()}
                      {result.duration && (
                        <span className="ml-2">({result.duration}ms)</span>
                      )}
                    </div>
                    {result.error && (
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : result.status === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Testing Tips
            </h3>
            <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
              <li>• Test on both desktop and mobile devices for best coverage</li>
              <li>• Check if notifications appear when the app is in the background</li>
              <li>• Verify that notification actions (like snooze) work correctly</li>
              <li>• Test during quiet hours to ensure they're respected</li>
              <li>• Make sure emergency notifications override quiet hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationTester;
