import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Sword, Users, Trophy, TrendingUp, Star, Target, Gift, Clock } from 'lucide-react';
import { BattleSystem } from './BattleSystem';
import { FriendsManager } from './FriendsManager';
import { EnhancedBattles } from './EnhancedBattles';
import { Gamification } from './Gamification';
import { SmartFeatures } from './SmartFeatures';
import { MediaContent } from './MediaContent';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';
import type {
  Battle,
  User as UserType,
  Quest,
  Achievement,
  DailyChallenge,
  PlayerLevel,
  ExperienceGain,
  LevelReward,
  WeatherData,
  LocationChallenge,
  FitnessIntegration,
  FitnessChallenge,
  SmartAlarmSettings
} from '../types/index';

interface CommunityHubProps {
  currentUser: UserType;
  battles: Battle[];
  onCreateBattle: (battle: Partial<Battle>) => void;
  onJoinBattle: (battleId: string) => void;
  onSendTrashTalk: (battleId: string, message: string) => void;
}

// Mock data for community features
const MOCK_GLOBAL_RANKINGS = [
  { rank: 1, user: { id: '5', username: 'alex.kim', displayName: 'Alex Kim', level: 31, experience: 4500, joinDate: '2023-08-10', lastActive: new Date().toISOString() }, score: 2847, change: 0 },
  { rank: 2, user: { id: '2', username: 'sarah.chen', displayName: 'Sarah Chen', level: 22, experience: 3200, joinDate: '2023-12-01', lastActive: new Date().toISOString() }, score: 2634, change: 1 },
  { rank: 3, user: { id: '9', username: 'james.wilson', displayName: 'James Wilson', level: 28, experience: 4100, joinDate: '2023-09-15', lastActive: new Date().toISOString() }, score: 2598, change: -1 },
  { rank: 4, user: { id: '1', username: 'you', displayName: 'You', level: 15, experience: 2450, joinDate: '2024-01-15', lastActive: new Date().toISOString() }, score: 1847, change: 2 },
  { rank: 5, user: { id: '3', username: 'mike.rodriguez', displayName: 'Mike Rodriguez', level: 18, experience: 2800, joinDate: '2024-02-15', lastActive: new Date().toISOString() }, score: 1723, change: -1 },
];

const MOCK_QUESTS: Quest[] = [
  {
    id: '1',
    title: 'Early Bird',
    description: 'Wake up before 7 AM for 3 days straight',
    type: 'daily',
    target: 3,
    progress: 2,
    reward: { experience: 100, title: 'Early Riser' },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Battle Veteran',
    description: 'Win 5 battles this week',
    type: 'weekly',
    target: 5,
    progress: 3,
    reward: { experience: 250, badge: 'Combat Expert' },
  },
  {
    id: '3',
    title: 'Consistency King',
    description: 'Maintain a 7-day wake-up streak',
    type: 'achievement',
    target: 7,
    progress: 5,
    reward: { experience: 500, title: 'Routine Master' },
  }
];

export function CommunityHub({ currentUser, battles, onCreateBattle, onJoinBattle, onSendTrashTalk }: CommunityHubProps) {
  const [selectedTab, setSelectedTab] = useState('battles');

  // Gaming announcements
  const {
    announceLeaderboardChange,
    announceFriendEvent,
    announceQuestEvent,
    announceRewardEvent,
    announceTournamentEvent,
    announceGaming
  } = useGamingAnnouncements();

  // Track previous values for change detection
  const previousValues = useRef<{
    userRank?: number;
    friendsRank?: number;
  }>({});

  // Track leaderboard changes
  useEffect(() => {
    const userEntry = MOCK_GLOBAL_RANKINGS.find(entry => entry.user.id === currentUser.id);
    if (userEntry) {
      const previousUserRank = previousValues.current.userRank;

      if (previousUserRank && previousUserRank !== userEntry.rank) {
        const rankChange = previousUserRank - userEntry.rank;
        announceLeaderboardChange(
          rankChange > 0 ? 'rank-up' : 'rank-down',
          {
            oldRank: previousUserRank,
            newRank: userEntry.rank,
            score: userEntry.score
          }
        );
      }

      previousValues.current.userRank = userEntry.rank;
    }
  }, [currentUser.id, announceLeaderboardChange]);

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-green-500 text-sm">↗ +{change}</span>;
    if (change < 0) return <span className="text-red-500 text-sm">↘ {change}</span>;
    return <span className="text-muted-foreground text-sm">–</span>;
  };

  const getQuestTypeEmoji = (type: Quest['type']) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '🗓️';
      case 'achievement': return '🏆';
      default: return '🎯';
    }
  };

  return (
    <div className="space-y-6">
      {/* Community Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold">Community & Battles</h2>
        <p className="text-sm text-muted-foreground">Connect, compete, and conquer together</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="battles">Battles</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
          <TabsTrigger value="smart">Smart</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="battles">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <BattleSystem
                currentUser={currentUser}
                friends={[]}
                activeBattles={battles}
                onCreateBattle={onCreateBattle}
                onJoinBattle={onJoinBattle}
                onSendTrashTalk={onSendTrashTalk}
              />
            </TabsContent>

            <TabsContent value="friends">
              <FriendsManager
                currentUser={currentUser}
                onChallengeFriend={(friendId) => {
                  console.log('Challenging friend:', friendId);
                  // This would typically trigger the battle creation flow
                }}
                onSendFriendRequest={(username) => {
                  console.log('Sending friend request to:', username);
                }}
                onAcceptFriendRequest={(requestId) => {
                  console.log('Accepting friend request:', requestId);
                }}
                onRejectFriendRequest={(requestId) => {
                  console.log('Rejecting friend request:', requestId);
                }}
              />
            </TabsContent>

            <TabsContent value="rankings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Global Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_GLOBAL_RANKINGS.map((entry) => (
                    <div
                      key={entry.user.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors ${
                        entry.user.id === currentUser.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                      onClick={() => {
                        if (entry.user.id === currentUser.id) {
                          announceGaming({
                            type: 'leaderboard',
                            customMessage: `Your current rank: ${entry.rank}. Score: ${entry.score.toLocaleString()} points. ${entry.change > 0 ? `Up ${entry.change} positions` : entry.change < 0 ? `Down ${Math.abs(entry.change)} positions` : 'No change'}.`,
                            priority: 'polite'
                          });
                        } else {
                          announceGaming({
                            type: 'leaderboard',
                            customMessage: `${entry.user.displayName} rank ${entry.rank}. Level ${entry.user.level}. Score: ${entry.score.toLocaleString()} points.`,
                            priority: 'polite'
                          });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${entry.user.displayName} rank ${entry.rank}, level ${entry.user.level}, score ${entry.score.toLocaleString()} points`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            entry.rank === 1 ? 'bg-yellow-500 text-white' :
                            entry.rank === 2 ? 'bg-gray-400 text-white' :
                            entry.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {entry.rank}
                          </div>
                          {entry.rank <= 3 && <Star className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{entry.user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.user.displayName}</span>
                            {entry.user.id === currentUser.id && (
                              <Badge variant="secondary">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">Level {entry.user.level}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.score.toLocaleString()}</div>
                        <div>{getChangeIndicator(entry.change)}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Weekly Top
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {MOCK_GLOBAL_RANKINGS.slice(0, 3).map((entry, index) => (
                        <div key={entry.user.id} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-4">#{index + 1}</span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{entry.user.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{entry.user.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Friends Rank
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">#4</div>
                      <div className="text-sm text-muted-foreground">among friends</div>
                      <Badge
                        variant="outline"
                        className="mt-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          announceGaming({
                            type: 'leaderboard',
                            customMessage: 'You are ranked number 4 among friends. Moved up 2 positions this week.',
                            priority: 'polite'
                          });
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Your friend ranking: number 4, up 2 positions this week"
                      >
                        ↗ +2 this week
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="enhanced">
          <EnhancedBattles
            currentUser={currentUser}
            onCreateTournament={(tournament) => {
              console.log('Creating tournament:', tournament);
            }}
            onJoinTournament={(tournamentId) => {
              console.log('Joining tournament:', tournamentId);
            }}
            onCreateTeam={(team) => {
              console.log('Creating team:', team);
            }}
            onJoinTeam={(teamId) => {
              console.log('Joining team:', teamId);
            }}
          />
        </TabsContent>

        <TabsContent value="smart">
          <SmartFeatures
            currentUser={currentUser}
            locationChallenges={[]}
            fitnessIntegrations={[]}
            fitnessChallenges={[]}
            smartSettings={{
              weatherEnabled: true,
              locationEnabled: true,
              fitnessEnabled: true,
              smartWakeWindow: 30,
              adaptiveDifficulty: true,
              contextualTasks: true,
              environmentalAdjustments: true
            }}
            contextualTasks={[]}
            onUpdateSettings={(settings) => {
              console.log('Updating smart settings:', settings);
            }}
            onCreateLocationChallenge={(challenge) => {
              console.log('Creating location challenge:', challenge);
            }}
            onConnectFitness={(provider) => {
              console.log('Connecting fitness provider:', provider);
            }}
          />
        </TabsContent>

        <TabsContent value="rewards">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="quests">Quests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Gamification
                currentUser={currentUser}
                playerLevel={{
                  current: currentUser.level,
                  experience: currentUser.experience,
                  experienceToNext: (currentUser.level + 1) * 200 - currentUser.experience,
                  experienceTotal: (currentUser.level + 1) * 200,
                  progress: (currentUser.experience / ((currentUser.level + 1) * 200)) * 100
                }}
                achievements={[]}
                dailyChallenges={[]}
                levelRewards={[]}
                recentXpGains={[]}
                onClaimReward={(rewardId) => {
                  console.log('Claiming reward:', rewardId);
                }}
              />
            </TabsContent>

            <TabsContent value="quests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Active Quests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_QUESTS.map((quest) => (
                    <div
                      key={quest.id}
                      className="space-y-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => {
                        announceQuestEvent('progress', {
                          title: quest.title,
                          description: quest.description,
                          progress: quest.progress,
                          target: quest.target
                        });
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Quest: ${quest.title}. ${quest.description}. Progress: ${quest.progress} of ${quest.target}. Type: ${quest.type}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getQuestTypeEmoji(quest.type)}</span>
                          <div>
                            <div className="font-medium">{quest.title}</div>
                            <div className="text-sm text-muted-foreground">{quest.description}</div>
                          </div>
                        </div>
                        <Badge variant={quest.type === 'daily' ? 'default' : 'secondary'}>
                          {quest.type}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{quest.progress}/{quest.target}</span>
                        </div>
                        <Progress value={(quest.progress / quest.target) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Gift className="h-4 w-4" />
                          <span>{quest.reward.experience} XP</span>
                          {quest.reward.title && <span>+ "{quest.reward.title}"</span>}
                          {quest.reward.badge && <span>+ {quest.reward.badge} badge</span>}
                        </div>
                        {quest.expiresAt && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{Math.ceil((new Date(quest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))}h left</span>
                          </div>
                        )}
                      </div>

                      {quest.progress >= quest.target && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            announceRewardEvent('claimed', {
                              title: `${quest.reward.experience} XP${quest.reward.title ? ` + ${quest.reward.title}` : ''}${quest.reward.badge ? ` + ${quest.reward.badge}` : ''}`,
                              description: `Completed quest: ${quest.title}`,
                              rarity: 'common'
                            });
                            announceQuestEvent('completed', quest);
                          }}
                          aria-label={`Claim reward for ${quest.title}: ${quest.reward.experience} XP${quest.reward.title ? ` and ${quest.reward.title}` : ''}${quest.reward.badge ? ` and ${quest.reward.badge}` : ''}`}
                        >
                          Claim Reward
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quest Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">12</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">3</div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">1,750</div>
                      <div className="text-sm text-muted-foreground">Total XP</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>


      </Tabs>
    </div>
  );
}

export default CommunityHub;