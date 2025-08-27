import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Users,
  Trophy,
  Calendar,
  Target,
  Clock,
  Plus,
  Crown,
  Flame,
  Star,
  Share2,
  MessageCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  SocialChallenge,
  SocialChallengeType,
  ChallengeParticipant,
  ChallengeLeaderboard,
} from '../types/struggling-sam';

interface CommunityChallengeProps {
  challenges: SocialChallenge[];
  userChallenges: SocialChallenge[];
  onJoinChallenge?: (challenge: SocialChallenge) => void;
  onCreateChallenge?: () => void;
  onLeaveChallenge?: (challenge: SocialChallenge) => void;
  onViewChallenge?: (challenge: SocialChallenge) => void;
  onShareProgress?: (challenge: SocialChallenge) => void;
  className?: string;
  showUserChallenges?: boolean;
}

const CHALLENGE_TYPE_CONFIGS = {
  streak_competition: {
    icon: Flame,
    color: '#f59e0b',
    title: 'Streak Competition',
    description: 'Compete for the longest wake-up streak',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
  },
  early_wake_challenge: {
    icon: Clock,
    color: '#3b82f6',
    title: 'Early Wake Challenge',
    description: 'Wake up before a specific time',
    bgGradient: 'from-blue-500/10 to-indigo-500/10',
  },
  consistency_challenge: {
    icon: Target,
    color: '#10b981',
    title: 'Consistency Challenge',
    description: 'Wake up at the same time daily',
    bgGradient: 'from-emerald-500/10 to-green-500/10',
  },
  group_motivation: {
    icon: Users,
    color: '#ec4899',
    title: 'Group Motivation',
    description: 'Support and motivate each other',
    bgGradient: 'from-pink-500/10 to-rose-500/10',
  },
  habit_building: {
    icon: TrendingUp,
    color: '#8b5cf6',
    title: 'Habit Building',
    description: 'Build new morning routine habits',
    bgGradient: 'from-purple-500/10 to-violet-500/10',
  },
  peer_accountability: {
    icon: MessageCircle,
    color: '#06b6d4',
    title: 'Peer Accountability',
    description: 'Check in with accountability partners',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
  },
};

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export const CommunityChallenge: React.FC<CommunityChallengeProps> = ({
  challenges,
  userChallenges,
  onJoinChallenge,
  onCreateChallenge,
  onLeaveChallenge,
  onViewChallenge,
  onShareProgress,
  className = '',
  showUserChallenges = true,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');
  const [filteredChallenges, setFilteredChallenges] = useState(challenges);
  const [selectedType, setSelectedType] = useState<SocialChallengeType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | 'easy' | 'medium' | 'hard'
  >('all');

  useEffect(() => {
    let filtered = challenges;

    if (selectedType !== 'all') {
      filtered = filtered.filter((c: any) => c.challengeType === selectedType);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((c: any) => c.difficulty === selectedDifficulty);
    }

    setFilteredChallenges(filtered);
  }, [challenges, selectedType, selectedDifficulty]);

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const ChallengeCard = ({
    challenge,
    isUserChallenge = false,
  }: {
    challenge: SocialChallenge;
    isUserChallenge?: boolean;
  }) => {
    const config = CHALLENGE_TYPE_CONFIGS[challenge.challengeType];
    const IconComponent = _config.icon;
    const isActive = challenge.status === 'active';
    const timeRemaining = formatTimeRemaining(challenge.endDate);

    return (
      <motion.div layout whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
            isActive ? 'border-primary/20' : 'border-muted/20'
          }`}
          onClick={() => onViewChallenge?.(challenge)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${_config.color}15` }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: _config.color }} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{challenge.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {challenge.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={`text-xs ${isActive ? 'bg-green-100 text-green-700' : ''}`}
                >
                  {challenge.status.toUpperCase()}
                </Badge>
                <Badge
                  variant="outline"
                  style={{
                    color: DIFFICULTY_COLORS[challenge.difficulty],
                    borderColor: DIFFICULTY_COLORS[challenge.difficulty],
                  }}
                  className="text-xs"
                >
                  {challenge.difficulty.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Participants</span>
                <span className="text-sm text-muted-foreground">
                  {challenge.currentParticipants}/{challenge.maxParticipants}
                </span>
              </div>
              <Progress
                value={
                  (challenge.currentParticipants / challenge.maxParticipants) * 100
                }
                className="h-2"
              />
            </div>

            {/* Challenge Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{challenge.duration}</span>
                </div>
                <span className="text-xs text-muted-foreground">days</span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-medium">
                    {challenge.rewards.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">rewards</span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {timeRemaining.split(' ')[0]}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {timeRemaining.includes('d') ? 'days' : 'hours'}
                </span>
              </div>
            </div>

            {/* Top Participants */}
            {challenge.leaderboard.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Top Performers</span>
                </div>
                <div className="flex -space-x-2">
                  {challenge.leaderboard.slice(0, 3).map((leader, _index) => (
                    <motion.div
                      key={leader.userId}
                      className="relative"
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                    >
                      <Avatar className="w-8 h-8 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {leader.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {_index === 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {challenge.currentParticipants > 3 && (
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium">
                        +{challenge.currentParticipants - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-2">
              {isUserChallenge ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onShareProgress?.(challenge);
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onLeaveChallenge?.(challenge);
                    }}
                  >
                    Leave
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onJoinChallenge?.(challenge);
                  }}
                  disabled={challenge.currentParticipants >= challenge.maxParticipants}
                  style={{ backgroundColor: _config.color }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {challenge.currentParticipants >= challenge.maxParticipants
                    ? 'Full'
                    : 'Join Challenge'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Community Challenges
            </CardTitle>
            <Button size="sm" onClick={onCreateChallenge}>
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'discover' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('discover')}
            >
              Discover
              <Badge variant="secondary" className="ml-2">
                {filteredChallenges.length}
              </Badge>
            </Button>
            {showUserChallenges && (
              <Button
                variant={activeTab === 'joined' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('joined')}
              >
                My Challenges
                <Badge variant="secondary" className="ml-2">
                  {userChallenges.length}
                </Badge>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === 'discover' && (
            <>
              {/* Filters */}
              <div className="flex gap-3 mb-6 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <select
                  className="text-sm bg-background border rounded px-2 py-1"
                  value={selectedType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedType(e.target.value as SocialChallengeType | 'all')
                  }
                >
                  <option value="all">All Types</option>
                  <option value="streak_competition">Streak Competition</option>
                  <option value="early_wake_challenge">Early Wake</option>
                  <option value="consistency_challenge">Consistency</option>
                  <option value="group_motivation">Group Support</option>
                  <option value="habit_building">Habit Building</option>
                  <option value="peer_accountability">Accountability</option>
                </select>

                <select
                  className="text-sm bg-background border rounded px-2 py-1"
                  value={selectedDifficulty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedDifficulty(
                      e.target.value as 'all' | 'easy' | 'medium' | 'hard'
                    )
                  }
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Challenge Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredChallenges.map((challenge: any) => (
                    <motion.div
                      key={challenge.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChallengeCard challenge={challenge} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredChallenges.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Challenges Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or create your own challenge!
                  </p>
                  <Button onClick={onCreateChallenge}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Challenge
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === 'joined' && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {userChallenges.map((challenge: any) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    isUserChallenge={true}
                  />
                ))}
              </div>

              {userChallenges.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Challenges</h3>
                  <p className="text-muted-foreground mb-4">
                    Join your first challenge to start building habits with the
                    community!
                  </p>
                  <Button onClick={() => setActiveTab('discover')}>
                    <Users className="w-4 h-4 mr-2" />
                    Discover Challenges
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default CommunityChallenge;
