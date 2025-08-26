// Premium Team and Social Features for Relife Alarm App
// Collaborative wake-up experiences and social accountability features

import React, { useState, useEffect } from 'react';
import {
  // Replaced stub import with proper implementation // auto: restored by scout - verify
  Users,
  Crown,
  Trophy,
  MessageCircle,
  Share2,
  Target,
  Calendar,
  Clock,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FeatureGate } from './FeatureGate';
import { FeatureBadge } from './FeatureUtils';
import useAuth from '../../hooks/useAuth';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  tier: 'free' | 'basic' | 'premium' | 'pro';
  currentStreak: number;
  lastWakeUp: Date;
  isOnline: boolean;
  role: 'member' | 'captain' | 'coach';
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  currentChallenge?: string;
  totalScore: number;
  rank: number;
  createdBy: string;
}

interface PremiumTeamFeaturesProps {
  className?: string;
}

// Team Dashboard Component
function TeamDashboard() {
  const [team, setTeam] = useState<Team>({
    id: 'team1',
    name: 'Morning Champions',
    description: 'Early risers conquering the day together!',
    members: [
      {
        id: '1',
        name: 'Alex',
        tier: 'premium',
        currentStreak: 12,
        lastWakeUp: new Date(),
        isOnline: true,
        role: 'captain',
      },
      {
        id: '2',
        name: 'Sam',
        tier: 'basic',
        currentStreak: 8,
        lastWakeUp: new Date(),
        isOnline: false,
        role: 'member',
      },
      {
        id: '3',
        name: 'Jordan',
        tier: 'pro',
        currentStreak: 15,
        lastWakeUp: new Date(),
        isOnline: true,
        role: 'coach',
      },
      {
        id: '4',
        name: 'Casey',
        tier: 'premium',
        currentStreak: 3,
        lastWakeUp: new Date(),
        isOnline: true,
        role: 'member',
      },
    ],
    totalScore: 1248,
    rank: 3,
    createdBy: '1',
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'text-blue-600';
      case 'premium':
        return 'text-purple-600';
      case 'pro':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'captain':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'coach':
        return <Target className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          {team.name}
          <Badge variant="outline">Rank #{team.rank}</Badge>
        </CardTitle>
        <p className="text-gray-600">{team.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{team.totalScore}</p>
            <p className="text-sm text-gray-600">Total Score</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{team.members.length}</p>
            <p className="text-sm text-gray-600">Members</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Team Members</h4>
          {team.members.map((member: unknown) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {member.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    {getRoleIcon(member.role)}
                  </div>
                  <p className={`text-sm capitalize ${getTierColor(member.tier)}`}>
                    {member.tier} member
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">{member.currentStreak}</p>
                <p className="text-xs text-gray-600">day streak</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
          <Button className="flex-1">
            <MessageCircle className="w-4 h-4 mr-2" />
            Team Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Wake-up Challenges Component
function WakeUpChallenges() {
  const [activeChallenge, setActiveChallenge] = useState({
    id: 'challenge1',
    title: '7-Day Early Bird Challenge',
    description: 'Wake up before 6:30 AM for 7 consecutive days',
    progress: 4,
    target: 7,
    reward: '100 points',
    participants: 12,
    timeRemaining: '3 days',
  });

  const [availableChallenges, setAvailableChallenges] = useState([
    {
      id: '2',
      title: 'No-Snooze Week',
      difficulty: 'Medium',
      reward: '150 points',
      participants: 8,
    },
    {
      id: '3',
      title: 'Weekend Warrior',
      difficulty: 'Hard',
      reward: '200 points',
      participants: 5,
    },
    {
      id: '4',
      title: '5 AM Club',
      difficulty: 'Extreme',
      reward: '300 points',
      participants: 3,
    },
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-orange-100 text-orange-800';
      case 'Extreme':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Wake-up Challenges
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeChallenge && (
          <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-yellow-900">{activeChallenge.title}</h4>
              <Badge className="bg-yellow-500 text-white">
                {activeChallenge.timeRemaining}
              </Badge>
            </div>
            <p className="text-sm text-yellow-800 mb-3">
              {activeChallenge.description}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Progress: {activeChallenge.progress}/{activeChallenge.target}
                </span>
                <span>
                  {Math.round(
                    (activeChallenge.progress / activeChallenge.target) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={(activeChallenge.progress / activeChallenge.target) * 100}
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-yellow-800">
                {activeChallenge.participants} participants
              </span>
              <span className="text-sm font-medium text-yellow-900">
                Reward: {activeChallenge.reward}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold">Available Challenges</h4>
          {availableChallenges.map((challenge: unknown) => (
            <div
              key={challenge.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <h5 className="font-medium">{challenge.title}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    {challenge.participants} joined
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">{challenge.reward}</p>
                <Button size="sm" variant="outline">
                  Join
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full">
          <Target className="w-4 h-4 mr-2" />
          Create Custom Challenge
        </Button>
      </CardContent>
    </Card>
  );
}

// Accountability Partners Component
function AccountabilityPartners() {
  const [partners, setPartners] = useState([
    { id: '1', name: 'Riley', streak: 15, lastCheckIn: '2 hours ago', avatar: '' },
    { id: '2', name: 'Morgan', streak: 8, lastCheckIn: '1 day ago', avatar: '' },
  ]);
  const [partnerRequests, setPartnerRequests] = useState([
    {
      id: '3',
      name: 'Taylor',
      message: "Let's be accountability partners!",
      avatar: '',
    },
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-600" />
          Accountability Partners
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold">Your Partners</h4>
          {partners.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No accountability partners yet</p>
              <Button size="sm" className="mt-2">
                Find Partners
              </Button>
            </div>
          ) : (
            partners.map((partner: unknown) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={partner.avatar} />
                    <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-sm text-gray-600">
                      Last check-in: {partner.lastCheckIn}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pink-600">{partner.streak}</p>
                  <p className="text-xs text-gray-600">day streak</p>
                </div>
              </div>
            ))
          )}
        </div>

        {partnerRequests.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Partner Requests</h4>
            {partnerRequests.map((request: unknown) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.avatar} />
                    <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-gray-600">{request.message}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Decline
                  </Button>
                  <Button size="sm">Accept</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-pink-50 p-3 rounded-lg">
          <h5 className="font-semibold text-pink-900 mb-2">Partner Features</h5>
          <div className="space-y-1 text-sm text-pink-800">
            <div className="flex items-center gap-2">
              <Switch size="sm" />
              <span>Share wake-up status</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch size="sm" />
              <span>Daily check-in reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch size="sm" />
              <span>Motivational messages</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Team Leaderboard Component
function TeamLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([
    { rank: 1, team: 'Morning Warriors', score: 2150, members: 8, trend: 'up' },
    { rank: 2, team: 'Rise & Shine Squad', score: 1980, members: 6, trend: 'up' },
    { rank: 3, team: 'Morning Champions', score: 1248, members: 4, trend: 'same' },
    { rank: 4, team: 'Early Birds United', score: 1100, members: 5, trend: 'down' },
    { rank: 5, team: 'Dawn Patrol', score: 950, members: 3, trend: 'up' },
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>;
      case 'down':
        return <span className="text-red-500">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold-600" />
          Global Team Leaderboard
          <FeatureBadge tier="pro" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboardData.map((team, _index) => (
          <div
            key={team.rank}
            className={`flex items-center justify-between p-3 rounded-lg ${
              team.rank === 3 ? 'bg-blue-50 border-2 border-blue-200' : 'border'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  team.rank === 1
                    ? 'bg-yellow-500'
                    : team.rank === 2
                      ? 'bg-gray-400'
                      : team.rank === 3
                        ? 'bg-orange-500'
                        : 'bg-gray-600'
                }`}
              >
                {team.rank}
              </div>
              <div>
                <p className="font-medium">{team.team}</p>
                <p className="text-sm text-gray-600">{team.members} members</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <p className="font-bold">{team.score.toLocaleString()}</p>
                <p className="text-xs text-gray-600">points</p>
              </div>
              {getTrendIcon(team.trend)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Social Wake-up Features Component
function SocialWakeUpFeatures() {
  const [socialSettings, setSocialSettings] = useState({
    shareWakeUpTime: true,
    allowFriendsToWakeYou: false,
    shareStreaks: true,
    joinMorningChat: true,
    showOnlineStatus: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-green-600" />
          Social Wake-up Features
          <FeatureBadge tier="basic" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold">Privacy Settings</h4>
          {Object.entries(socialSettings).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={(checked: unknown) =>
                  setSocialSettings((prev: unknown) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <h5 className="font-semibold text-green-900 mb-2">Morning Community</h5>
          <p className="text-sm text-green-800 mb-3">
            Join the daily morning chat with other early risers worldwide!
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-800">287 people online now</span>
            <Button size="sm" variant="outline">
              Join Chat
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold">Quick Actions</h5>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Cheers
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Success
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Premium Team Features Component
export function PremiumTeamFeatures({ className = '' }: PremiumTeamFeaturesProps) {
  const { user } = useAuth();

  if (!_user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">Sign in to access premium team features</p>
      </div>
    );
  }

  return (
    <FeatureGate feature="team_features" userId={_user.id} showUpgradePrompt>
      <div className={`space-y-6 ${className}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Premium Team & Social Features</h2>
          <p className="text-gray-600">
            Join forces with others to build better wake-up habits together
          </p>
        </div>

        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team">My Team</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TeamDashboard />
              <SocialWakeUpFeatures />
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <WakeUpChallenges />
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <AccountabilityPartners />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <TeamLeaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  );
}

export default PremiumTeamFeatures;
