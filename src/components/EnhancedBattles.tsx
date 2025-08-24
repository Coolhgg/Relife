import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Trophy, Users, Crown, Calendar, Award, Shield, Plus } from 'lucide-react';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';
import type { Tournament, Team, Season, User as UserType } from '../types/index';

interface EnhancedBattlesProps {
  currentUser: UserType;
  onCreateTournament?: (tournament: Partial<Tournament>) => void;
  onJoinTournament?: (tournamentId: string) => void;
  onCreateTeam?: (team: Partial<Team>) => void;
  onJoinTeam?: (teamId: string) => void;
}

// Mock data for enhanced battles
const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'Weekend Warriors Cup',
    description: 'Battle for supremacy this weekend!',
    type: 'single-elimination',
    status: 'registration',
    participants: [],
    maxParticipants: 16,
    rounds: [],
    currentRound: 0,
    prizePool: [
      { experience: 1000, title: 'Weekend Champion', badge: 'Champion Crown' },
    ],
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 259200000).toISOString(),
    entryFee: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Speed Demons League',
    description: 'Fast-paced speed battles',
    type: 'round-robin',
    status: 'active',
    participants: [],
    maxParticipants: 8,
    rounds: [],
    currentRound: 1,
    prizePool: [{ experience: 750, badge: 'Speed Master' }],
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 172800000).toISOString(),
    entryFee: 30,
    createdAt: new Date().toISOString(),
  },
];

const MOCK_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Early Birds',
    description: 'Rise and grind together!',
    captainId: '2',
    members: [
      {
        userId: '2',
        user: {
          id: '2',
          email: 'sarah.chen@example.com',
          username: 'sarah.chen',
          displayName: 'Sarah Chen',
          level: 22,
          experience: 3200,
          joinDate: '2023-12-01',
          lastActive: new Date().toISOString(),
          preferences: {} as any,
          createdAt: '2023-12-01',
        },
        role: 'captain',
        joinedAt: '2024-01-01',
        contribution: {
          battlesParticipated: 45,
          battlesWon: 32,
          totalScore: 1580,
          averagePerformance: 0.71,
        },
      },
    ],
    maxMembers: 5,
    isPublic: true,
    stats: {
      totalBattles: 67,
      wins: 45,
      losses: 22,
      winRate: 0.67,
      rank: 3,
      seasonPoints: 1890,
      averageScore: 82.4,
    },
    createdAt: '2024-01-01',
  },
];

const MOCK_SEASON: Season = {
  id: 'summer2024',
  name: 'Summer Showdown 2024',
  description: 'The biggest competitive season yet!',
  status: 'active',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  type: 'mixed',
  leaderboard: [],
  tournaments: MOCK_TOURNAMENTS,
  rewards: [
    {
      rank: 1,
      experience: 5000,
      title: 'Summer Champion',
      badge: 'Golden Sun',
      exclusiveContent: 'Champion Avatar Frame',
    },
    { rank: 2, experience: 3000, title: 'Summer Runner-up', badge: 'Silver Moon' },
    { rank: 3, experience: 2000, title: 'Summer Bronze', badge: 'Bronze Star' },
  ],
  theme: 'Summer Vibes',
  rules: ['Weekly tournaments', 'Team battles count double', 'Consistency bonuses'],
};

export function EnhancedBattles({
  currentUser,
  onCreateTournament,
  onJoinTournament,
  onCreateTeam,
  onJoinTeam,
}: EnhancedBattlesProps) {
  const [selectedTab, setSelectedTab] = useState('tournaments');
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  // Gaming announcements
  const { announceTournamentEvent, announceGaming } = useGamingAnnouncements();

  const formatTimeLeft = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="space-y-6">
      {/* Season Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{MOCK_SEASON.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {MOCK_SEASON.description}
                </p>
              </div>
            </div>
            <Badge variant="default">Active Season</Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">47</div>
              <div className="text-xs text-muted-foreground">Days Left</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">#12</div>
              <div className="text-xs text-muted-foreground">Your Rank</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">1,250</div>
              <div className="text-xs text-muted-foreground">Season Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="space-y-4">
          {MOCK_TOURNAMENTS.map(tournament => (
            <Card key={tournament.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h3 className="font-medium">{tournament.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tournament.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={tournament.status === 'active' ? 'default' : 'secondary'}
                  >
                    {tournament.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                  <div>
                    <div className="text-sm font-bold">
                      {tournament.participants.length}/{tournament.maxParticipants}
                    </div>
                    <div className="text-xs text-muted-foreground">Participants</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{tournament.entryFee} XP</div>
                    <div className="text-xs text-muted-foreground">Entry Fee</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {formatTimeLeft(tournament.endTime)}
                    </div>
                    <div className="text-xs text-muted-foreground">Time Left</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Progress
                    value={
                      (tournament.participants.length / tournament.maxParticipants) *
                      100
                    }
                    className="flex-1 h-2"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tournament.status === 'registration') {
                        announceTournamentEvent('joined', {
                          name: tournament.name,
                          description: tournament.description,
                          participantCount: tournament.participants.length,
                        });
                      } else {
                        announceGaming({
                          type: 'tournament',
                          customMessage: `Viewing tournament: ${tournament.name}. Status: ${tournament.status}.`,
                          priority: 'polite',
                        });
                      }
                      onJoinTournament?.(tournament.id);
                    }}
                    disabled={tournament.status !== 'registration'}
                    aria-label={
                      tournament.status === 'registration'
                        ? `Join tournament: ${tournament.name}`
                        : `View tournament: ${tournament.name}`
                    }
                  >
                    {tournament.status === 'registration' ? 'Join' : 'View'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {MOCK_TEAMS.map(team => (
            <Card key={team.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {team.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Rank #{team.stats.rank}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                  <div>
                    <div className="text-sm font-bold">
                      {team.members.length}/{team.maxMembers}
                    </div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {Math.round(team.stats.winRate * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{team.stats.seasonPoints}</div>
                    <div className="text-xs text-muted-foreground">Season Points</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 3).map(member => (
                      <Avatar
                        key={member.userId}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarFallback className="text-xs">
                          {member.user.displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.members.length > 3 && (
                      <div className="h-6 w-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                        <span className="text-xs">+{team.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (team.members.length < team.maxMembers) {
                        announceGaming({
                          type: 'friend',
                          customMessage: `Joined team: ${team.name}. ${team.members.length + 1} of ${team.maxMembers} members.`,
                          priority: 'assertive',
                        });
                        onJoinTeam?.(team.id);
                      }
                    }}
                    disabled={team.members.length >= team.maxMembers}
                    aria-label={
                      team.members.length >= team.maxMembers
                        ? `Team ${team.name} is full`
                        : `Join team: ${team.name}`
                    }
                  >
                    {team.members.length >= team.maxMembers ? 'Full' : 'Join'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="seasons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Season Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_SEASON.rewards.map((reward: any) => // auto: implicit any (
                <div
                  key={reward.rank}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        reward.rank === 1
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : reward.rank === 2
                            ? 'bg-gray-400/20 text-gray-400'
                            : 'bg-amber-600/20 text-amber-600'
                      }`}
                    >
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Rank #{reward.rank}</div>
                      <div className="text-sm text-muted-foreground">
                        {reward.title}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{reward.experience} XP</div>
                    <div className="text-xs text-muted-foreground">{reward.badge}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Dialog open={showCreateTournament} onOpenChange={setShowCreateTournament}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Create Tournament</h3>
                    <p className="text-sm text-muted-foreground">
                      Organize competitive brackets
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Tournament</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tournament-name">Tournament Name</Label>
                    <Input id="tournament-name" placeholder="Enter tournament name" />
                  </div>
                  <div>
                    <Label htmlFor="tournament-type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tournament type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-elimination">
                          Single Elimination
                        </SelectItem>
                        <SelectItem value="round-robin">Round Robin</SelectItem>
                        <SelectItem value="swiss">Swiss System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      announceTournamentEvent('joined', {
                        name: 'New Tournament',
                        description: 'Tournament created successfully!',
                        participantCount: 0,
                      });
                      setShowCreateTournament(false);
                      onCreateTournament?.({});
                    }}
                  >
                    Create Tournament
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Create Team</h3>
                    <p className="text-sm text-muted-foreground">Build your squad</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input id="team-name" placeholder="Enter team name" />
                  </div>
                  <div>
                    <Label htmlFor="team-description">Description</Label>
                    <Input id="team-description" placeholder="Describe your team" />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      announceGaming({
                        type: 'friend',
                        customMessage:
                          'Team created successfully! You are now the team captain.',
                        priority: 'assertive',
                      });
                      setShowCreateTeam(false);
                      onCreateTeam?.({});
                    }}
                  >
                    Create Team
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedBattles;
