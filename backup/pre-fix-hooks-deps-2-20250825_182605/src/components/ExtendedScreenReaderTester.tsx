/**
 * Extended Screen Reader Tester for Relife Smart Alarm App
 * Comprehensive testing component with custom scenarios
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { config } from 'src/utils/__auto_stubs';
import {
  PlayCircle,
  PauseCircle,
  SkipForward,
  Volume2,
  Settings,
  Star,
  Lock,
  User,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import ScreenReaderService from '../utils/screen-reader';
import { TimeoutHandle } from '../types/timers';
import {
  customTestCategories,
  customCategoryConfig,
  generateDynamicTestData,
  getEnabledCustomCategories,
  filterTestsByFeatureAccess,
  getAllCustomTests,
  validateTestScenario,
  getCategoryStats,
  UserContext,
  TestCategory,
  TestScenario,
} from '../services/custom-test-scenarios';
import {
  appSpecificTestCategories,
  appSpecificCategoryConfig,
} from '../services/app-specific-test-scenarios';
import {
  additionalAppSpecificTestCategories,
  additionalAppSpecificCategoryConfig,
} from '../services/additional-app-specific-test-scenarios';

interface ExtendedScreenReaderTesterProps {
  userId?: string;
  userName?: string;
  isPremium?: boolean;
  embedded?: boolean;
  onTestComplete?: (testId: string, success: boolean) => void;
}

interface TestResult {
  testId: string;
  success: boolean;
  timestamp: Date;
  category?: string;
}

interface TestPreferences {
  autoAdvance: boolean;
  delayBetweenTests: number;
  includeDescriptions: boolean;
  simulatePremium: boolean;
}

const ExtendedScreenReaderTester: React.FC<ExtendedScreenReaderTesterProps> = ({
  userId,
  userName = 'User',
  isPremium = false,
  embedded = false,
  onTestComplete,
}) => {
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('base');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Screen Reader Service
  const [screenReaderService] = useState(() => ScreenReaderService.getInstance());

  // User preferences
  const [preferences, setPreferences] = useState<TestPreferences>({
    autoAdvance: true,
    delayBetweenTests: 2000,
    includeDescriptions: true,
    simulatePremium: false,
  });

  // Dynamic user context
  const userContext: UserContext = useMemo(
    () => ({
      userId,
      userName,
      isPremium: isPremium || preferences.simulatePremium,
      currentTime: new Date(),
      scheduledAlarms: 3,
      sleepGoalHours: 8,
      preferredVoiceMood: 'energetic',
      battleLevel: 5,
    }),
    [userId, userName, isPremium, preferences.simulatePremium]
  );

  // Base test categories
  const baseTestCategories: Record<string, TestCategory> = {
    basic: {
      name: 'Basic Announcements',
      description: 'Fundamental screen reader functionality',
      icon: '📢',
      color: '#6366F1',
      tests: [
        {
          id: 'basic-alarm-set',
          message: 'Alarm set for 7:00 AM tomorrow with label "Morning Workout"',
          priority: 'high',
          context: 'alarm',
          tags: ['basic', 'alarm-set'],
        },
        {
          id: 'basic-alarm-ring',
          message:
            'Alarm ringing: Morning Workout, 7:00 AM. Tap to snooze or swipe to dismiss.',
          priority: 'high',
          context: 'alarm',
          tags: ['basic', 'alarm-ring'],
        },
        {
          id: 'basic-snooze',
          message: 'Alarm snoozed for 9 minutes. Next ring at 7:09 AM.',
          priority: 'medium',
          context: 'alarm',
          tags: ['basic', 'snooze'],
        },
      ],
    },
    navigation: {
      name: 'Navigation & UI',
      description: 'Interface navigation and interaction feedback',
      icon: '🧭',
      color: '#059669',
      tests: [
        {
          id: 'nav-page-change',
          message: 'Navigated to Alarm Settings. 5 alarms configured, 2 active.',
          priority: 'medium',
          context: 'general',
          tags: ['navigation', 'page-change'],
        },
        {
          id: 'nav-modal-open',
          message: 'Add New Alarm dialog opened. Set time, label, and repeat options.',
          priority: 'medium',
          context: 'general',
          tags: ['navigation', 'modal'],
        },
      ],
    },
    errors: {
      name: 'Errors & Alerts',
      description: 'Error handling and important alerts',
      icon: '⚠️',
      color: '#DC2626',
      tests: [
        {
          id: 'error-time-conflict',
          message:
            'Error: Alarm conflicts with existing 7:00 AM alarm. Choose different time or replace existing alarm.',
          priority: 'high',
          context: 'alarm',
          tags: ['_error', 'conflict'],
        },
        {
          id: 'alert-battery-low',
          message:
            'Battery Alert: 15% remaining. Connect charger to ensure alarms work reliably overnight.',
          priority: 'high',
          context: 'general',
          tags: ['alert', 'battery'],
        },
      ],
    },
  };

  // Merge base, custom, app-specific, and additional app-specific categories
  const allCategories = useMemo(() => {
    const customCategories = getEnabledCustomCategories();
    const effectiveUserPremium = isPremium || preferences.simulatePremium;

    // Filter custom categories by premium access
    const filteredCustomCategories = Object.fromEntries(
      Object.entries(customCategories).filter(([key, category]) => {
        if (category.isPremium && !effectiveUserPremium) {
          return false;
        }
        return true;
      })
    );

    // Filter app-specific categories by premium access
    const filteredAppSpecificCategories = Object.fromEntries(
      Object.entries(appSpecificTestCategories).filter(([key, category]) => {
        const _config =
          appSpecificCategoryConfig[key as keyof typeof appSpecificCategoryConfig];
        if (_config?.requiresPremium && !effectiveUserPremium) {
          return false;
        }
        return config?.enabled !== false;
      })
    );

    // Filter additional app-specific categories by premium access
    const filteredAdditionalAppSpecificCategories = Object.fromEntries(
      Object.entries(additionalAppSpecificTestCategories).filter(([key, category]) => {
        const _config =
          additionalAppSpecificCategoryConfig[
            key as keyof typeof additionalAppSpecificCategoryConfig
          ];
        if (_config?.requiresPremium && !effectiveUserPremium) {
          return false;
        }
        return config?.enabled !== false;
      })
    );

    return {
      ...baseTestCategories,
      ...filteredCustomCategories,
      ...filteredAppSpecificCategories,
      ...filteredAdditionalAppSpecificCategories,
    };
  }, [isPremium, preferences.simulatePremium]);

  // Get tests for active category
  const currentTests = useMemo(() => {
    const category = allCategories[activeCategory];
    if (!category) return [];

    const effectiveUserPremium = isPremium || preferences.simulatePremium;
    let tests = [...category.tests];

    // Add dynamic tests for custom categories
    if (
      activeCategory !== 'basic' &&
      activeCategory !== 'navigation' &&
      activeCategory !== 'errors'
    ) {
      const dynamicTests = generateDynamicTestData(userContext);
      tests = [...tests, ...dynamicTests.slice(0, 2)]; // Add 2 dynamic tests
    }

    // Filter by user access
    return filterTestsByFeatureAccess(tests, effectiveUserPremium);
  }, [
    activeCategory,
    allCategories,
    userContext,
    isPremium,
    preferences.simulatePremium,
  ]);

  // Current test
  const currentTest = currentTests[currentTestIndex];

  // Play test announcement
  const playTest = useCallback(
    async (test: TestScenario) => {
      if (!screenReaderService || !test) return;

      try {
        // Personalize message with user name
        let personalizedMessage = test.message;
        if (userName && userName !== 'User') {
          personalizedMessage = personalizedMessage.replace(/\byou\b/g, userName);
          personalizedMessage = personalizedMessage.replace(
            /\bYour\b/g,
            `${userName}'s`
          );
        }

        // Add test context if enabled
        if (preferences.includeDescriptions && test.expectedBehavior) {
          personalizedMessage += ` [Expected: ${test.expectedBehavior}]`;
        }

        await screenReaderService.announce(personalizedMessage, 'assertive');

        // Mark as successful
        const result: TestResult = {
          testId: test.id,
          success: true,
          timestamp: new Date(),
          category: activeCategory,
        };

        setTestResults((prev: any) => [
          ...prev.filter((r: any) => r.testId !== test.id),
          result,
        ]);
        onTestComplete?.(test.id, true);
      } catch (_error) {
        console._error('Test playback failed:', _error);
        const result: TestResult = {
          testId: test.id,
          success: false,
          timestamp: new Date(),
          category: activeCategory,
        };
        setTestResults((prev: any) => [
          ...prev.filter((r: any) => r.testId !== test.id),
          result,
        ]);
        onTestComplete?.(test.id, false);
      }
    },
    [screenReaderService, userName, preferences, activeCategory, onTestComplete]
  );

  // Auto-advance logic
  useEffect(() => {
    if (!isPlaying || !preferences.autoAdvance || !currentTest) return;

    const timer = setTimeout(() => {
      if (currentTestIndex < currentTests.length - 1) {
        setCurrentTestIndex((prev: any) => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentTestIndex(0);
      }
    }, preferences.delayBetweenTests);

    return () => clearTimeout(timer);
  }, [
    isPlaying,
    currentTestIndex,
    currentTests.length,
    preferences.autoAdvance,
    preferences.delayBetweenTests,
    currentTest,
  ]);

  // Play current test when playing state changes
  useEffect(() => {
    if (isPlaying && currentTest) {
      playTest(currentTest);
    }
  }, [isPlaying, currentTest, playTest]);

  // Handlers
  const handlePlay = () => {
    if (currentTests.length === 0) return;
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentTestIndex < currentTests.length - 1) {
      setCurrentTestIndex((prev: any) => prev + 1);
    }
  };

  const handlePlaySingle = (test: TestScenario) => {
    playTest(test);
  };

  const handleCategoryChange = (categoryKey: string) => {
    setActiveCategory(categoryKey);
    setCurrentTestIndex(0);
    setIsPlaying(false);
  };

  const handleRunAllCategories = async () => {
    const categories = Object.keys(allCategories);
    for (const categoryKey of categories) {
      setActiveCategory(categoryKey);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const categoryTests = allCategories[categoryKey].tests;
      const filteredTests = filterTestsByFeatureAccess(
        categoryTests,
        isPremium || preferences.simulatePremium
      );

      for (const test of filteredTests) {
        await playTest(test);
        await new Promise(resolve =>
          setTimeout(resolve, preferences.delayBetweenTests)
        );
      }
    }
  };

  // Get test result status
  const getTestStatus = (testId: string) => {
    const result = testResults.find((r: any) => r.testId === testId);
    return result?.success ? 'success' : result ? '_error' : 'pending';
  };

  // Test results summary
  const testSummary = useMemo(() => {
    const total = testResults.length;
    const successful = testResults.filter((r: any) => r.success).length;
    const failed = total - successful;

    return { total, successful, failed };
  }, [testResults]);

  const activeCategory_data = allCategories[activeCategory];

  return (
    <div
      className={`${embedded ? 'p-4' : 'p-6'} bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-6xl mx-auto`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Extended Screen Reader Tester
            </h2>
          </div>

          {/* User Context Display */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{userName}</span>
              {(isPremium || preferences.simulatePremium) && (
                <Star
                  className="h-4 w-4 text-yellow-500 fill-current"
                  title="Premium User"
                />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Test Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Tests</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {testSummary.total}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <div className="text-sm text-green-600 dark:text-green-400">Successful</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {testSummary.successful}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {testSummary.failed}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 border-b dark:border-gray-700">
        <div className="flex flex-wrap -mb-px">
          {Object.entries(allCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors
                ${
                  activeCategory === key
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }
                ${category.isPremium && !(isPremium || preferences.simulatePremium) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={
                category.isPremium && !(isPremium || preferences.simulatePremium)
              }
              style={{ color: activeCategory === key ? category.color : undefined }}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
              {category.isPremium && !(isPremium || preferences.simulatePremium) && (
                <Lock className="inline ml-2 h-3 w-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Category Info */}
      {activeCategory_data && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2 text-2xl">{activeCategory_data.icon}</span>
                {activeCategory_data.name}
                {activeCategory_data.isPremium &&
                  !(isPremium || preferences.simulatePremium) && (
                    <Lock className="ml-2 h-4 w-4 text-gray-400" />
                  )}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {activeCategory_data.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {currentTests.length} test{currentTests.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={currentTests.length === 0}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Play Tests
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <PauseCircle className="mr-2 h-4 w-4" />
              Pause
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentTestIndex >= currentTests.length - 1}
            className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            onClick={handleRunAllCategories}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Run All Categories
          </button>
        </div>

        {/* Test Preferences */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.autoAdvance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences((prev: any) => ({
                  ...prev,
                  autoAdvance: e.target.checked,
                }))
              }
              className="mr-2 rounded"
            />
            <span className="text-sm">Auto-advance</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.simulatePremium}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences((prev: any) => ({
                  ...prev,
                  simulatePremium: e.target.checked,
                }))
              }
              className="mr-2 rounded"
            />
            <span className="text-sm">Simulate Premium</span>
          </label>

          <select
            value={preferences.delayBetweenTests}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPreferences((prev: any) => ({
                ...prev,
                delayBetweenTests: Number(e.target.value),
              }))
            }
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          >
            <option value={1000}>1s delay</option>
            <option value={2000}>2s delay</option>
            <option value={3000}>3s delay</option>
            <option value={5000}>5s delay</option>
          </select>
        </div>
      </div>

      {/* Current Test Display */}
      {currentTest && (
        <div className="mb-6 p-4 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                Current Test ({currentTestIndex + 1}/{currentTests.length})
              </h4>
              <p className="text-indigo-800 dark:text-indigo-200 mb-2">
                {currentTest.message}
              </p>
              {preferences.includeDescriptions && currentTest.expectedBehavior && (
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  Expected: {currentTest.expectedBehavior}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {currentTest.tags.map((tag: any) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-4 flex items-center">
              {getTestStatus(currentTest.id) === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {getTestStatus(currentTest.id) === '_error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {getTestStatus(currentTest.id) === 'pending' && (
                <Info className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {currentTests.map((test, _index) => (
          <div
            key={test.id}
            className={`p-3 border rounded-lg transition-colors
              ${
                _index === currentTestIndex
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">Test {_index + 1}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      test.priority === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : test.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {test.priority}
                  </span>
                  {test.userTypes?.includes('premium') && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {test.message}
                </p>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <button
                  onClick={() => handlePlaySingle(test)}
                  className="p-1 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"
                  title="Play this test"
                >
                  <PlayCircle className="h-4 w-4" />
                </button>
                {getTestStatus(test.id) === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {getTestStatus(test.id) === '_error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        ))}

        {currentTests.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tests available for this category</p>
            {activeCategory_data?.isPremium &&
              !(isPremium || preferences.simulatePremium) && (
                <p className="text-sm mt-2">
                  Premium subscription required to access these tests
                </p>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtendedScreenReaderTester;
