import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Star,
  Target,
  TrendingUp,
  Brain,
  Gift,
  Award,
  Zap,
  Crown,
  Sparkles,
  ChevronRight,
  Lock,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';
import type { RewardSystem, Reward, AIInsight, UserHabit } from '../types';

interface RewardsDashboardProps {
  rewardSystem: RewardSystem;
  onRefreshRewards: () => Promise<void>;
}

const RewardsDashboard: React.FC<RewardsDashboardProps> = ({
  rewardSystem,
  onRefreshRewards,
}) => {
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'achievements' | 'insights' | 'habits'
  >('overview');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Gaming announcements
  const { announceRewardEvent, announceGaming } = useGamingAnnouncements();

  // Track previous values for change detection
  const previousValues = useRef<{
    level?: number;
    totalPoints?: number;
    unlockedCount?: number;
    currentStreak?: number;
  }>({});

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRewards();
      announceGaming({
        type: 'reward',
        customMessage: 'AI analysis complete. Rewards and insights updated.',
        priority: 'polite',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Track reward system changes
  useEffect(() => {
    const previousLevel = previousValues.current.level;
    const previousPoints = previousValues.current.totalPoints;
    const previousUnlocked = previousValues.current.unlockedCount;
    const previousStreak = previousValues.current.currentStreak;

    // Level up announcement
    if (previousLevel && previousLevel < rewardSystem.level) {
      announceGaming({
        type: 'level',
        customMessage: `Level up! You are now level ${rewardSystem.level}. Total points: ${rewardSystem.totalPoints}.`,
        priority: 'assertive',
      });
    }

    // Points gained announcement
    if (previousPoints && previousPoints < rewardSystem.totalPoints) {
      const pointsGained = rewardSystem.totalPoints - previousPoints;
      announceGaming({
        type: 'xp-gain',
        customMessage: `${pointsGained} points earned! Total: ${rewardSystem.totalPoints} points.`,
        priority: 'polite',
      });
    }

    // New reward unlocked announcement
    if (previousUnlocked && previousUnlocked < rewardSystem.unlockedRewards.length) {
      const newRewards = rewardSystem.unlockedRewards.length - previousUnlocked;
      announceRewardEvent('claimed', {
        title: `${newRewards} new achievement${newRewards > 1 ? 's' : ''}`,
        description: `You've unlocked ${newRewards} new achievement${newRewards > 1 ? 's' : ''}!`,
        rarity: 'common',
      });
    }

    // Streak milestone announcements
    if (previousStreak && previousStreak < rewardSystem.currentStreak) {
      if (rewardSystem.currentStreak % 7 === 0) {
        announceGaming({
          type: 'achievement',
          customMessage: `Amazing! ${rewardSystem.currentStreak} day streak milestone reached!`,
          priority: 'assertive',
        });
      } else if (rewardSystem.currentStreak > previousStreak) {
        announceGaming({
          type: 'quest',
          customMessage: `Streak extended to ${rewardSystem.currentStreak} days! Keep it up!`,
          priority: 'polite',
        });
      }
    }

    // Update tracked values
    previousValues.current.level = rewardSystem.level;
    previousValues.current.totalPoints = rewardSystem.totalPoints;
    previousValues.current.unlockedCount = rewardSystem.unlockedRewards.length;
    previousValues.current.currentStreak = rewardSystem.currentStreak;
  }, [rewardSystem, announceRewardEvent, announceGaming]);

  const getRarityColor = (rarity: Reward['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'epic':
        return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'rare':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getCategoryIcon = (category: Reward['category']) => {
    switch (category) {
      case 'consistency':
        return Target;
      case 'early_riser':
        return Star;
      case 'wellness':
        return Zap;
      case 'productivity':
        return TrendingUp;
      case 'social':
        return Gift;
      case 'explorer':
        return Sparkles;
      case 'master':
        return Crown;
      case 'challenger':
        return Award;
      default:
        return Trophy;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-blue-300 bg-blue-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            Your Achievement Journey
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
            aria-label="Refresh AI analysis and reward data"
          >
            <Brain className={`w-4 h-4 ${isRefreshing ? 'animate-pulse' : ''}`} />
            AI Analysis
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{rewardSystem.level}</div>
            <div className="text-white/80 text-sm">Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{rewardSystem.totalPoints}</div>
            <div className="text-white/80 text-sm">Points</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{rewardSystem.currentStreak}</div>
            <div className="text-white/80 text-sm">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {rewardSystem.unlockedRewards.length}
            </div>
            <div className="text-white/80 text-sm">Achievements</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
        <nav className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: Trophy },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'insights', label: 'AI Insights', icon: Brain },
            { id: 'habits', label: 'Habits', icon: Target },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id as unknown)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedTab === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Recent Achievements
            </h2>
            <div className="grid gap-3">
              {rewardSystem.unlockedRewards.slice(0, 3).map((reward: unknown) => {
                const CategoryIcon = getCategoryIcon(reward.category);
                return (
                  <div
                    key={reward.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-white/50 transition-colors ${getRarityColor(reward.rarity)}`}
                    onClick={() => {
                      setSelectedReward(reward);
                      announceGaming({
                        type: 'reward',
                        customMessage: `Viewing achievement: ${reward.title}. ${reward.description} Worth ${reward.points} points.`,
                        priority: 'polite',
                      });
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View achievement: ${reward.title}. ${reward.description}. Rarity: ${reward.rarity}. Points: ${reward.points}`}
                  >
                    <div className="text-2xl">{reward.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{reward.title}</h3>
                      <p className="text-sm opacity-80">{reward.description}</p>
                      {reward.personalizedMessage && (
                        <p className="text-sm mt-1 italic">
                          "{reward.personalizedMessage}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">+{reward.points}</div>
                      <CategoryIcon className="w-4 h-4 mx-auto mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
            {rewardSystem.unlockedRewards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start using your alarms to unlock achievements!</p>
              </div>
            )}
          </div>

          {/* AI Insights Preview */}
          {rewardSystem.aiInsights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                Latest AI Insight
              </h2>
              <div
                className={`p-4 rounded-lg border-2 ${getPriorityColor(rewardSystem.aiInsights[0].priority)}`}
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 mt-1 text-yellow-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {rewardSystem.aiInsights[0].title}
                    </h3>
                    <p className="text-gray-700 mt-1">
                      {rewardSystem.aiInsights[0].message}
                    </p>
                    {rewardSystem.aiInsights[0].actionable &&
                      rewardSystem.aiInsights[0].suggestedActions && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            Suggested actions:
                          </p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {rewardSystem.aiInsights[0].suggestedActions.map(
                              (action, _index) => (
                                <li key={_index} className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  {action}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round(rewardSystem.aiInsights[0].confidence * 100)}% confident
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Towards Next Level */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Progress to Level {rewardSystem.level + 1}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Current Progress</span>
                <span>{rewardSystem.totalPoints % 100}/100 points</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${rewardSystem.totalPoints % 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {100 - (rewardSystem.totalPoints % 100)} more points to reach the next
                level!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {selectedTab === 'achievements' && (
        <div className="space-y-6">
          {/* Unlocked Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Unlocked Achievements ({rewardSystem.unlockedRewards.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {rewardSystem.unlockedRewards.map((reward: unknown) => {
                const CategoryIcon = getCategoryIcon(reward.category);
                return (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${getRarityColor(reward.rarity)}`}
                    onClick={() => setSelectedReward(reward)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{reward.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{reward.title}</h3>
                        <p className="text-sm opacity-80 mb-2">{reward.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize font-medium">
                            {reward.rarity}
                          </span>
                          <span className="font-bold">+{reward.points} pts</span>
                        </div>
                      </div>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
            {rewardSystem.unlockedRewards.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                <p>Keep using your alarms to unlock amazing achievements!</p>
              </div>
            )}
          </div>

          {/* Available Rewards */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              Available Achievements (
              {rewardSystem.availableRewards.length -
                rewardSystem.unlockedRewards.length}
              )
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {rewardSystem.availableRewards
                .filter(
                  reward =>
                    !rewardSystem.unlockedRewards.find(
                      (ur: unknown) => ur.id === reward.id
                    )
                )
                .map((reward: unknown) => {
                  const CategoryIcon = getCategoryIcon(reward.category);
                  return (
                    <div
                      key={reward.id}
                      className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 opacity-75"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl grayscale">{reward.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                            {reward.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {reward.description}
                          </p>
                          {reward.progress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>
                                  {reward.progress.current}/{reward.progress.target}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-gray-400 h-1.5 rounded-full"
                                  style={{ width: `${reward.progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs mt-2">
                            <span className="capitalize font-medium text-gray-500">
                              {reward.rarity}
                            </span>
                            <span className="font-bold text-gray-600">
                              +{reward.points} pts
                            </span>
                          </div>
                        </div>
                        <CategoryIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {selectedTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              AI-Powered Insights
            </h2>
            <div className="space-y-4">
              {rewardSystem.aiInsights.map((insight: unknown) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border-2 ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        {insight.title}
                      </h3>
                      <p className="text-gray-700 mt-1">{insight.message}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          insight.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : insight.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {insight.priority} priority
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(insight.confidence * 100)}% confident
                      </div>
                    </div>
                  </div>

                  {insight.actionable && insight.suggestedActions && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        💡 Suggested actions:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {insight.suggestedActions.map((action, _index) => (
                          <li key={_index} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {rewardSystem.aiInsights.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
                <p>Use your alarms more to get personalized AI insights!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Habits Tab */}
      {selectedTab === 'habits' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Your Habits & Patterns
            </h2>

            {/* Niche Profile */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Your Profile
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Primary Niche
                  </p>
                  <p className="font-semibold capitalize text-purple-600">
                    {rewardSystem.niche.primary}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                  <p className="font-semibold text-blue-600">
                    {Math.round(rewardSystem.niche.confidence * 100)}%
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Key Traits
                </p>
                <div className="flex flex-wrap gap-1">
                  {rewardSystem.niche.traits.map((trait, _index) => (
                    <span
                      key={_index}
                      className="inline-block px-2 py-1 bg-white/50 text-xs font-medium text-gray-700 rounded-full"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Identified Habits */}
            <div className="space-y-3">
              {rewardSystem.habits.map((habit: unknown) => (
                <div
                  key={habit.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {habit.pattern.replace('_', ' ')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {habit.frequency}x/week
                      </span>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          habit.consistency > 0.8
                            ? 'bg-green-500'
                            : habit.consistency > 0.6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Consistency</span>
                        <span>{Math.round(habit.consistency * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            habit.consistency > 0.8
                              ? 'bg-green-500'
                              : habit.consistency > 0.6
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${habit.consistency * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Improvement Trend</span>
                        <span className="flex items-center gap-1">
                          {habit.improvement > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-red-500 transform rotate-180" />
                          )}
                          {Math.abs(habit.improvement * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            habit.improvement > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(Math.abs(habit.improvement) * 500, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {habit.niche && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Related to:{' '}
                        <span className="font-medium capitalize">
                          {habit.niche.primary}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {rewardSystem.habits.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No habits detected yet</h3>
                <p>Keep using your alarms consistently to build trackable habits!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reward Detail Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">{selectedReward.icon}</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedReward.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {selectedReward.description}
              </p>
            </div>

            {selectedReward.personalizedMessage && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p className="text-blue-800 dark:text-blue-200 italic text-center">
                  "{selectedReward.personalizedMessage}"
                </p>
              </div>
            )}

            {selectedReward.aiInsight && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-4">
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Insight
                </h4>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  {selectedReward.aiInsight}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4 text-sm">
              <span
                className={`px-3 py-1 rounded-full font-medium ${getRarityColor(selectedReward.rarity)}`}
              >
                {selectedReward.rarity}
              </span>
              <span className="font-bold text-lg">+{selectedReward.points} points</span>
            </div>

            <button
              onClick={() => {
                setSelectedReward(null);
                announceGaming({
                  type: 'reward',
                  customMessage: 'Achievement details closed.',
                  priority: 'polite',
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              aria-label="Close achievement details"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsDashboard;
