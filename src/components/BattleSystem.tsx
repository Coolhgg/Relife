/// <reference lib="dom" />
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';
import OfflineGamingService from '../services/offline-gaming';
import OfflineAnalyticsService from '../services/offline-analytics';
import {
  Sword,
  Clock,
  Target,
  Trophy,
  MessageSquare,
  Plus,
  Calendar,
  Users,
  Zap,
  TrendingUp,
  Coffee,
  CheckCircle,
  X,
  WifiOff,
  Database,
} from 'lucide-react';
import type {
  Battle,
  BattleType,
  BattleParticipant,
  User as UserType,
  TrashTalkMessage,
} from '../types/index';

interface BattleSystemProps {
  currentUser: UserType;
  friends: UserType[];
  activeBattles: Battle[];
  onCreateBattle: (battle: Partial<Battle>) => void;
  onJoinBattle: (battleId: string) => void;
  onSendTrashTalk: (battleId: string, message: string) => void;
}

const BATTLE_TYPES = [
  {
    type: 'speed' as BattleType,
    name: 'Speed Battle',
    icon: Zap,
    emoji: '⚡',
    description: 'First to wake up wins',
    duration: '2 hours',
    maxParticipants: 8,
  },
  {
    type: 'consistency' as BattleType,
    name: 'Consistency Challenge',
    icon: TrendingUp,
    emoji: '📈',
    description: 'Most consistent wake times',
    duration: '7 days',
    maxParticipants: 20,
  },
  {
    type: 'tasks' as BattleType,
    name: 'Task Master',
    icon: Target,
    emoji: '🎯',
    description: 'Complete tasks fastest',
    duration: '1 day',
    maxParticipants: 10,
  },
];

const MOCK_FRIENDS: UserType[] = [
  {
    id: '2',
    username: 'sarah.chen',
    displayName: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    level: 22,
    experience: 3200,
    joinDate: '2023-12-01',
    lastActive: new Date().toISOString(),
    preferences: {
      theme: 'system',
      soundEnabled: true,
      notificationsEnabled: true,
      voiceDismissalSensitivity: 5,
      defaultVoiceMood: 'motivational',
      hapticFeedback: true,
      snoozeMinutes: 5,
      maxSnoozes: 3,
      rewardsEnabled: true,
      aiInsightsEnabled: true,
      personalizedMessagesEnabled: true,
      shareAchievements: true,
    },
    createdAt: '2023-12-01',
  },
  {
    id: '3',
    username: 'mike.rodriguez',
    displayName: 'Mike Rodriguez',
    email: 'mike.rodriguez@example.com',
    level: 18,
    experience: 2800,
    joinDate: '2024-02-15',
    lastActive: new Date().toISOString(),
    preferences: {
      theme: 'system',
      soundEnabled: true,
      notificationsEnabled: true,
      voiceDismissalSensitivity: 5,
      defaultVoiceMood: 'motivational',
      hapticFeedback: true,
      snoozeMinutes: 5,
      maxSnoozes: 3,
      rewardsEnabled: true,
      aiInsightsEnabled: true,
      personalizedMessagesEnabled: true,
      shareAchievements: true,
    },
    createdAt: '2024-02-15',
  },
  {
    id: '4',
    username: 'emma.thompson',
    displayName: 'Emma Thompson',
    email: 'emma.thompson@example.com',
    level: 8,
    experience: 1200,
    joinDate: '2024-07-20',
    lastActive: new Date().toISOString(),
    preferences: {
      theme: 'system',
      soundEnabled: true,
      notificationsEnabled: true,
      voiceDismissalSensitivity: 5,
      defaultVoiceMood: 'motivational',
      hapticFeedback: true,
      snoozeMinutes: 5,
      maxSnoozes: 3,
      rewardsEnabled: true,
      aiInsightsEnabled: true,
      personalizedMessagesEnabled: true,
      shareAchievements: true,
    },
    createdAt: '2024-07-20',
  },
  {
    id: '5',
    username: 'alex.kim',
    displayName: 'Alex Kim',
    email: 'alex.kim@example.com',
    level: 31,
    experience: 4500,
    joinDate: '2023-08-10',
    lastActive: new Date().toISOString(),
    preferences: {
      theme: 'system',
      soundEnabled: true,
      notificationsEnabled: true,
      voiceDismissalSensitivity: 5,
      defaultVoiceMood: 'motivational',
      hapticFeedback: true,
      snoozeMinutes: 5,
      maxSnoozes: 3,
      rewardsEnabled: true,
      aiInsightsEnabled: true,
      personalizedMessagesEnabled: true,
      shareAchievements: true,
    },
    createdAt: '2023-08-10',
  },
];

export function BattleSystem({
  currentUser,
  friends = MOCK_FRIENDS,
  activeBattles,
  onCreateBattle,
  onJoinBattle,
  onSendTrashTalk,
}: BattleSystemProps) {
  const [selectedBattleType, setSelectedBattleType] = useState<BattleType>('speed');
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [battleDuration, setBattleDuration] = useState('2');
  const [trashTalkMessage, setTrashTalkMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineGaming, setOfflineGaming] = useState(
    OfflineGamingService.getInstance()
  );
  const [offlineAnalytics] = useState(OfflineAnalyticsService.getInstance());

  // Gaming announcements
  const { announceBattleEvent, trackBattleCount, announceGaming } =
    useGamingAnnouncements();

  // Track battle count changes
  useEffect(() => {
    trackBattleCount(activeBattles);
  }, [activeBattles, trackBattleCount]);

  // Track battle status changes
  const previousBattleStatuses = useRef<Record<string, string>>({});
  useEffect(() => {
    activeBattles.forEach(battle => {
      const previousStatus = previousBattleStatuses.current[battle.id];
      const currentStatus = battle.status;

      if (previousStatus && previousStatus !== currentStatus) {
        if (currentStatus === 'active' && previousStatus === 'pending') {
          announceBattleEvent('started', battle);
        } else if (currentStatus === 'completed' && previousStatus === 'active') {
          // Determine if user won or lost based on battle results
          const userParticipant = battle.participants.find(
            p => p.userId === currentUser.id
          );
          const isWinner = userParticipant && battle.winner === currentUser.id;
          announceBattleEvent(isWinner ? 'won' : 'lost', battle);
        }
      }

      previousBattleStatuses.current[battle.id] = currentStatus;
    });
  }, [activeBattles, announceBattleEvent, currentUser.id]);

  // Setup offline gaming functionality
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for gaming sync events
    const handleGamingSync = (event: CustomEvent) => {
      console.log('[BattleSystem] Gaming sync completed:', event.detail);
      // Refresh battle data if needed
    };

    window.addEventListener('gaming-sync-complete', handleGamingSync as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'gaming-sync-complete',
        handleGamingSync as EventListener
      );
    };
  }, []);

  const handleCreateChallenge = async () => {
    try {
      const battleType = BATTLE_TYPES.find(bt => bt.type === selectedBattleType)!;

      const newBattle: Partial<Battle> = {
        type: selectedBattleType,
        creatorId: currentUser.id,
        status: 'registration', // Changed to registration for offline compatibility
        startTime: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        endTime: new Date(
          Date.now() + parseInt(battleDuration) * 3600000
        ).toISOString(),
        settings: {
          wakeWindow: 30,
          allowSnooze: false,
          maxSnoozes: 0,
          difficulty: 'medium',
          weatherBonus: false,
          taskChallenge: false,
        },
        maxParticipants: battleType.maxParticipants,
        minParticipants: 2,
      };

      let createdBattle: Battle;

      if (isOnline) {
        // Try to create online first
        onCreateBattle(newBattle);
        createdBattle = newBattle as Battle; // Assume success for now
      } else {
        // Create offline
        createdBattle = await offlineGaming.createBattle(newBattle);
      }

      // Track analytics
      await offlineAnalytics.trackBattleEvent('created', {
        id: createdBattle.id,
        type: selectedBattleType,
        participants: [],
        duration: battleDuration,
        isOffline: !isOnline,
      });

      // Announce battle creation
      announceBattleEvent('created', {
        type: selectedBattleType,
        participants: [],
      });

      setShowCreateBattle(false);
      setSelectedFriends([]);

      // Show success message based on online/offline status
      if (!isOnline) {
        console.log('Battle created offline and will sync when connection is restored');
      }
    } catch (error) {
      console.error('Failed to create battle:', error);
      // Handle error appropriately
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleJoinBattle = async (battle: Battle) => {
    try {
      let success = false;

      if (isOnline) {
        // Try to join online first
        onJoinBattle(battle.id);
        success = true; // Assume success for now
      } else {
        // Join offline
        success = await offlineGaming.joinBattle(battle.id, currentUser.id);
      }

      if (success) {
        // Track analytics
        await offlineAnalytics.trackBattleEvent('joined', {
          id: battle.id,
          type: battle.type,
          participants: battle.participants?.length || 0,
          isOffline: !isOnline,
        });

        // Announce joining battle
        announceBattleEvent('joined', {
          type: battle.type,
          participants: battle.participants,
        });

        if (!isOnline) {
          console.log(
            'Joined battle offline and will sync when connection is restored'
          );
        }
      }
    } catch (error) {
      console.error('Failed to join battle:', error);
    }
  };

  const handleBattleResult = (battle: Battle, isWin: boolean) => {
    // Announce battle result
    announceBattleEvent(isWin ? 'won' : 'lost', {
      type: battle.type,
      participants: battle.participants,
    });
  };

  const formatTimeLeft = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Finished';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Battle Arena</h2>
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <WifiOff className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Offline
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Challenge friends and prove your wake-up skills
            {!isOnline && ' (battles will sync when online)'}
          </p>
          {!isOnline && (
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>{offlineGaming.getPendingActions().length} actions queued</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span>{offlineGaming.getOfflineRewards().length} rewards pending</span>
              </div>
            </div>
          )}
        </div>
        <Dialog open={showCreateBattle} onOpenChange={setShowCreateBattle}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Sword className="h-4 w-4" />
              Create Battle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Battle</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Battle Type Selection */}
              <div>
                <Label>Battle Type</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {BATTLE_TYPES.map(battleType => {
                    const Icon = battleType.icon;
                    return (
                      <Card
                        key={battleType.type}
                        className={`cursor-pointer transition-colors ${
                          selectedBattleType === battleType.type
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedBattleType(battleType.type)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{battleType.emoji}</span>
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {battleType.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {battleType.description}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Duration: {battleType.duration} • Max:{' '}
                                {battleType.maxParticipants} players
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Select value={battleDuration} onValueChange={setBattleDuration}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invite Friends */}
              <div>
                <Label>Invite Friends</Label>
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                  {friends.slice(0, 4).map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <input
                        id={`friend-${friend.id}`}
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriendSelection(friend.id)}
                        className="rounded"
                        aria-label={`Select ${friend.displayName} for battle invitation`}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {friend.displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{friend.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          Level {friend.level}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateChallenge} className="flex-1">
                  Create Battle
                </Button>
                <Button variant="outline" onClick={() => setShowCreateBattle(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeBattles
            .filter(b => b.status === 'active')
            .map(battle => {
              const battleType = BATTLE_TYPES.find(bt => bt.type === battle.type)!;
              const userParticipant = battle.participants.find(
                p => p.userId === currentUser.id
              );
              const opponents = battle.participants.filter(
                p => p.userId !== currentUser.id
              );

              return (
                <Card key={battle.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Battle Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{battleType?.emoji || '⚡'}</span>
                          <div>
                            <div className="font-medium">
                              {battleType?.name || 'Battle'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTimeLeft(battle.endTime)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={battle.status === 'active' ? 'default' : 'secondary'}
                        >
                          {battle.status}
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="space-y-3">
                        {userParticipant && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>You</span>
                              <span className="font-bold">
                                {userParticipant.progress}%
                              </span>
                            </div>
                            <Progress
                              value={userParticipant.progress}
                              className="h-2"
                            />
                          </div>
                        )}

                        {opponents.map(opponent => (
                          <div key={opponent.userId}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{opponent.user.displayName}</span>
                              <span className="font-bold">{opponent.progress}%</span>
                            </div>
                            <Progress value={opponent.progress} className="h-2" />
                          </div>
                        ))}
                      </div>

                      {/* Trash Talk */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-medium">Trash Talk</span>
                        </div>
                        <div className="text-sm italic text-muted-foreground mb-2">
                          "Hope you like the taste of defeat with your morning coffee!"
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Send a message..."
                            value={trashTalkMessage}
                            onChange={e => setTrashTalkMessage(e.target.value)}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              onSendTrashTalk(battle.id, trashTalkMessage);
                              // Announce trash talk sent
                              announceGaming({
                                type: 'battle',
                                customMessage: `Trash talk sent: "${trashTalkMessage.slice(0, 30)}${trashTalkMessage.length > 30 ? '...' : ''}"`,
                              });
                              setTrashTalkMessage('');
                            }}
                            disabled={!trashTalkMessage.trim()}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {activeBattles.filter(b => b.status === 'active').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Sword className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Active Battles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Challenge your friends to a wake-up battle!
                </p>
                <Button onClick={() => setShowCreateBattle(true)}>
                  Create Your First Battle
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No pending battles</p>
            <p className="text-sm">Check back when friends challenge you!</p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-3">
            {/* Mock battle history */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Speed Battle vs Mike Rodriguez</div>
                      <div className="text-sm text-muted-foreground">
                        Victory • 7:32 vs 8:15
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">⚡ Speed</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <X className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-medium">Task Battle vs Emma Thompson</div>
                      <div className="text-sm text-muted-foreground">
                        Defeat • 2/3 vs 3/3 tasks
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">🎯 Tasks</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Consistency vs Sarah Chen</div>
                      <div className="text-sm text-muted-foreground">
                        Victory • 5/7 vs 4/7 days
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">📈 Consistency</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BattleSystem;
