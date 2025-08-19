import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Trophy,
  Star,
  Target,
  Calendar,
  Zap,
  Award,
  Crown,
  Shield,
  Flame,
  Gift,
  CheckCircle,
  Lock,
  TrendingUp,
  Users,
  Clock,
  BatteryLow
} from 'lucide-react';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';
import type {
  Achievement,
  DailyChallenge,
  WeeklyChallenge,
  LevelReward,
  ExperienceGain,
  PlayerLevel,
  User as UserType
} from '../types/index';

interface GamificationProps {
  currentUser: UserType;
  playerLevel: PlayerLevel;
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  weeklyChallenge?: WeeklyChallenge;
  levelRewards: LevelReward[];
  recentXpGains: ExperienceGain[];
  onClaimReward?: (rewardId: string) => void;
}

// Mock data for gamification features
const MOCK_PLAYER_LEVEL: PlayerLevel = {
  current: 22,
  experience: 3200,
  experienceToNext: 800,
  experienceTotal: 4000,
  progress: 80
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'early_bird_bronze',
    name: 'Early Bird',
    description: 'Wake up before 6:00 AM for 7 consecutive days',
    category: 'wakeup',
    type: 'streak',
    rarity: 'common',
    iconUrl: '/icons/early-bird.png',
    unlockedAt: '2024-01-15T06:00:00Z',
    rewards: [
      { type: 'experience', value: 250, description: '250 XP' },
      { type: 'badge', value: 'Early Bird', description: 'Early Bird Badge' }
    ],
    requirements: [
      { type: 'early_wake', value: 7, description: 'Wake before 6:00 AM for 7 days' }
    ]
  },
  {
    id: 'battle_master',
    name: 'Battle Master',
    description: 'Win 50 battles',
    category: 'battles',
    type: 'milestone',
    rarity: 'rare',
    iconUrl: '/icons/battle-master.png',
    progress: { current: 32, target: 50, percentage: 64 },
    rewards: [
      { type: 'experience', value: 1000, description: '1000 XP' },
      { type: 'title', value: 'Battle Master', description: 'Battle Master Title' },
      { type: 'theme', value: 'champion', description: 'Champion Theme' }
    ],
    requirements: [
      { type: 'battles_won', value: 50, description: 'Win 50 battles' }
    ]
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Add 20 friends',
    category: 'social',
    type: 'social',
    rarity: 'uncommon',
    iconUrl: '/icons/social.png',
    progress: { current: 12, target: 20, percentage: 60 },
    rewards: [
      { type: 'experience', value: 500, description: '500 XP' },
      { type: 'badge', value: 'Social Butterfly', description: 'Social Butterfly Badge' }
    ],
    requirements: [
      { type: 'friends_added', value: 20, description: 'Add 20 friends' }
    ]
  }
];

const MOCK_DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'no_snooze_today',
    date: new Date().toISOString().split('T')[0],
    name: 'No Snooze Hero',
    description: 'Complete your wake-up without hitting snooze',
    type: 'no_snooze',
    difficulty: 'medium',
    target: 1,
    progress: 0,
    rewards: [
      { type: 'experience', value: 150, description: '150 XP' },
      { type: 'badge', value: 'No Snooze Hero', description: 'Daily Badge' }
    ],
    completed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'friend_battle',
    date: new Date().toISOString().split('T')[0],
    name: 'Challenge a Friend',
    description: 'Start a battle with a friend',
    type: 'friend_challenge',
    difficulty: 'easy',
    target: 1,
    progress: 0,
    rewards: [
      { type: 'experience', value: 100, description: '100 XP' }
    ],
    completed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'early_riser',
    date: new Date().toISOString().split('T')[0],
    name: 'Rise and Shine',
    description: 'Wake up before 7:00 AM',
    type: 'wake_early',
    difficulty: 'hard',
    target: 1,
    progress: 1,
    rewards: [
      { type: 'experience', value: 200, description: '200 XP' },
      { type: 'bonus_xp', value: 50, description: '50 Bonus XP' }
    ],
    completed: true,
    completedAt: '2024-01-20T06:30:00Z',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_LEVEL_REWARDS: LevelReward[] = [
  {
    level: 23,
    experience: 4000,
    rewards: [
      { type: 'title', name: 'Morning Champion', description: 'Exclusive champion title', value: 'champion', rarity: 'rare' },
      { type: 'theme', name: 'Golden Theme', description: 'Premium golden theme', value: 'golden', rarity: 'epic' }
    ],
    unlocked: false
  },
  {
    level: 25,
    experience: 5000,
    rewards: [
      { type: 'avatar', name: 'Crown Avatar', description: 'Royal crown avatar frame', value: 'crown_frame', rarity: 'legendary' },
      { type: 'sound', name: 'Victory Fanfare', description: 'Epic victory sound effect', value: 'victory_fanfare', rarity: 'rare' }
    ],
    unlocked: false
  }
];

const MOCK_RECENT_XP: ExperienceGain[] = [
  {
    id: '1',
    userId: 'user1',
    amount: 200,
    source: 'challenge_complete',
    description: 'Completed "Rise and Shine" challenge',
    multiplier: 1.5,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    userId: 'user1',
    amount: 100,
    source: 'alarm_complete',
    description: 'Successfully woke up on time',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'text-gray-500 bg-gray-100';
    case 'uncommon': return 'text-green-600 bg-green-100';
    case 'rare': return 'text-blue-600 bg-blue-100';
    case 'epic': return 'text-purple-600 bg-purple-100';
    case 'legendary': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'hard': return 'text-red-600 bg-red-100';
    case 'expert': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

export function Gamification({
  currentUser,
  playerLevel = MOCK_PLAYER_LEVEL,
  achievements = MOCK_ACHIEVEMENTS,
  dailyChallenges = MOCK_DAILY_CHALLENGES,
  levelRewards = MOCK_LEVEL_REWARDS,
  recentXpGains = MOCK_RECENT_XP,
  onClaimReward
}: GamificationProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Gaming announcements
  const {
    announceAchievement,
    announceLevelChange,
    announceQuestEvent,
    trackAchievements,
    announceGaming
  } = useGamingAnnouncements();

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const progressAchievements = achievements.filter(a => a.progress && !a.unlockedAt);



  // Track previous values for change detection
  const previousValues = useRef<{
    level?: number;
    experience?: number;
    unlockedCount?: number;
    completedChallenges?: number;
  }>({});

  // Track achievement unlocks
  useEffect(() => {
    trackAchievements(achievements);

    // Track individual achievement progress changes
    const previousUnlockedCount = previousValues.current.unlockedCount || 0;
    const currentUnlockedCount = unlockedAchievements.length;

    if (currentUnlockedCount > previousUnlockedCount && previousUnlockedCount > 0) {
      // Find newly unlocked achievements
      const newAchievements = unlockedAchievements.slice(-1); // Get most recent
      newAchievements.forEach(achievement => {
        announceAchievement('unlocked', achievement);
      });
    }

    previousValues.current.unlockedCount = currentUnlockedCount;
  }, [achievements, trackAchievements, announceAchievement, unlockedAchievements]);

  // Track level changes and XP gains
  useEffect(() => {
    const previousLevel = previousValues.current.level;
    const previousExperience = previousValues.current.experience;

    if (previousLevel && previousLevel < playerLevel.current) {
      // Level up!
      announceLevelChange('level-up', {
        current: playerLevel.current,
        experienceToNext: playerLevel.experienceToNext
      });
    } else if (previousExperience && previousExperience < playerLevel.experience) {
      // XP gained
      const xpGained = playerLevel.experience - previousExperience;
      announceLevelChange('xp-gained', {
        amount: xpGained,
        source: 'activity',
        reason: `You now have ${playerLevel.experience.toLocaleString()} total XP`
      });
    }

    previousValues.current.level = playerLevel.current;
    previousValues.current.experience = playerLevel.experience;
  }, [playerLevel, announceLevelChange]);

  // Track challenge completions
  useEffect(() => {
    const previousCompletedCount = previousValues.current.completedChallenges || 0;
    const currentCompletedCount = completedChallenges.length;

    if (currentCompletedCount > previousCompletedCount && previousCompletedCount > 0) {
      // New challenge completed
      const newlyCompleted = completedChallenges.slice(-1)[0];
      if (newlyCompleted) {
        announceQuestEvent('completed', {
          title: newlyCompleted.name,
          description: newlyCompleted.description,
          rewards: newlyCompleted.rewards
        });
      }
    }

    previousValues.current.completedChallenges = currentCompletedCount;
  }, [completedChallenges, announceQuestEvent]);

  // Interactive announcement functions
  const handleAchievementClick = (achievement: Achievement) => {
    if (achievement.unlockedAt) {
      announceGaming({
        type: 'achievement',
        customMessage: `Viewing achievement: ${achievement.name}. ${achievement.description} Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString()}.`
      });
    } else if (achievement.progress) {
      announceAchievement('progress', achievement);
    }
  };

  const handleChallengeClick = (challenge: DailyChallenge) => {
    if (challenge.completed) {
      announceGaming({
        type: 'quest',
        customMessage: `Challenge completed: ${challenge.name}. Earned ${challenge.rewards[0]?.value} XP.`
      });
    } else {
      announceQuestEvent('progress', {
        title: challenge.name,
        description: challenge.description,
        progress: challenge.progress,
        target: challenge.target
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Level & XP Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Level {playerLevel.current}</h2>
                    <p className="text-muted-foreground">{currentUser.displayName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{playerLevel.experience.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Level {playerLevel.current + 1}</span>
                  <span>{playerLevel.experience}/{playerLevel.experienceTotal} XP</span>
                </div>
                <Progress value={playerLevel.progress} className="h-3" />
                <p className="text-sm text-muted-foreground">{playerLevel.experienceToNext} XP to next level</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{completedChallenges.length}</div>
                <div className="text-sm text-muted-foreground">Challenges Today</div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeChallenges.slice(0, 3).map((challenge: DailyChallenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{challenge.name}</div>
                      <div className="text-sm text-muted-foreground">{challenge.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                    <div className="text-sm font-bold">+{challenge.rewards[0]?.value} XP</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {/* Achievement Categories */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-primary">{unlockedAchievements.length}</div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-muted-foreground">{progressAchievements.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
          </div>

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Unlocked Achievements</h3>
              {unlockedAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className="border-2 border-primary/20 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleAchievementClick(achievement)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View achievement: ${achievement.name}. ${achievement.description}. Rarity: ${achievement.rarity}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Progress Achievements */}
          {progressAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg">In Progress</h3>
              {progressAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleAchievementClick(achievement)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Achievement in progress: ${achievement.name}. ${achievement.description}. Progress: ${achievement.progress?.current || 0} of ${achievement.progress?.target || 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        </div>
                      </div>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    {achievement.progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress.current}/{achievement.progress.target}</span>
                        </div>
                        <Progress value={achievement.progress.percentage} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {/* Challenge Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-500">{completedChallenges.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-primary">{activeChallenges.length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-500">
                  {completedChallenges.reduce((sum: number, c: DailyChallenge) => {
                    const reward = c.rewards[0];
                    return sum + (reward && typeof reward.value === 'number' ? reward.value : 0);
                  }, 0)}
                </div>
                <div className="text-sm text-muted-foreground">XP Today</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle>Active Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeChallenges.map((challenge: DailyChallenge) => (
                <div
                  key={challenge.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleChallengeClick(challenge)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Active challenge: ${challenge.name}. ${challenge.description}. Progress: ${challenge.progress} of ${challenge.target}. Difficulty: ${challenge.difficulty}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{challenge.name}</h3>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{challenge.progress}/{challenge.target}</span>
                    </div>
                    <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">+{challenge.rewards[0]?.value} XP</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires in {Math.ceil((new Date(challenge.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))}h
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Completed Challenges */}
          {completedChallenges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => handleChallengeClick(challenge)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Completed challenge: ${challenge.name}. Earned ${challenge.rewards[0]?.value} XP. Completed at ${new Date(challenge.completedAt!).toLocaleTimeString()}`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{challenge.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Completed at {new Date(challenge.completedAt!).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-green-600">+{challenge.rewards[0]?.value} XP</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {/* Recent XP Gains */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent XP Gains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentXpGains.map((xp) => (
                <div key={xp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{xp.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(xp.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">+{xp.amount} XP</div>
                    {xp.multiplier && xp.multiplier > 1 && (
                      <div className="text-xs text-yellow-600">x{xp.multiplier} bonus</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Level Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Upcoming Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {levelRewards.slice(0, 2).map((levelReward) => (
                <div key={levelReward.level} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold">Level {levelReward.level}</h3>
                      <p className="text-sm text-muted-foreground">
                        {levelReward.experience - playerLevel.experience} XP to unlock
                      </p>
                    </div>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    {levelReward.rewards.map((reward, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <div className="flex-1">
                          <div className="font-medium">{reward.name}</div>
                          <div className="text-xs text-muted-foreground">{reward.description}</div>
                        </div>
                        <Badge className={getRarityColor(reward.rarity)}>
                          {reward.rarity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Gamification;