import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Search,
  Trophy,
  Sword,
  Check,
  X,
  MoreHorizontal,
  MessageCircle,
  Star,
  Clock,
  Target,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';
import type { User as UserType, UserStats, Friendship } from '../types/index';

interface FriendsManagerProps {
  currentUser: UserType;
  onChallengeFriend?: (friendId: string) => void;
  onSendFriendRequest?: (username: string) => void;
  onAcceptFriendRequest?: (requestId: string) => void;
  onRejectFriendRequest?: (requestId: string) => void;
}

// Mock data for friends and their stats
const MOCK_FRIENDS = [
  {
    user: {
      id: '2',
      username: 'sarah.chen',
      displayName: 'Sarah Chen',
      level: 22,
      experience: 3200,
      joinDate: '2023-12-01',
      lastActive: new Date().toISOString(),
    },
    stats: {
      totalBattles: 156,
      wins: 112,
      losses: 44,
      winRate: 0.72,
      currentStreak: 3,
      longestStreak: 12,
      averageWakeTime: '07:15',
      totalAlarmsSet: 234,
      alarmsCompleted: 198,
      snoozeCount: 56,
    },
    isOnline: true,
    activeBattles: 2,
    friendship: {
      id: '1',
      userId: '1',
      friendId: '2',
      status: 'accepted' as const,
      createdAt: '2024-01-01',
      acceptedAt: '2024-01-01',
    },
  },
  {
    user: {
      id: '3',
      username: 'mike.rodriguez',
      displayName: 'Mike Rodriguez',
      level: 18,
      experience: 2800,
      joinDate: '2024-02-15',
      lastActive: new Date(Date.now() - 3600000).toISOString(),
    },
    stats: {
      totalBattles: 89,
      wins: 52,
      losses: 37,
      winRate: 0.58,
      currentStreak: 1,
      longestStreak: 8,
      averageWakeTime: '08:30',
      totalAlarmsSet: 167,
      alarmsCompleted: 134,
      snoozeCount: 89,
    },
    isOnline: false,
    activeBattles: 0,
    friendship: {
      id: '2',
      userId: '1',
      friendId: '3',
      status: 'accepted' as const,
      createdAt: '2024-02-20',
      acceptedAt: '2024-02-20',
    },
  },
  {
    user: {
      id: '4',
      username: 'emma.thompson',
      displayName: 'Emma Thompson',
      level: 8,
      experience: 1200,
      joinDate: '2024-07-20',
      lastActive: new Date(Date.now() - 86400000).toISOString(),
    },
    stats: {
      totalBattles: 23,
      wins: 8,
      losses: 15,
      winRate: 0.35,
      currentStreak: 0,
      longestStreak: 3,
      averageWakeTime: '09:45',
      totalAlarmsSet: 45,
      alarmsCompleted: 31,
      snoozeCount: 67,
    },
    isOnline: false,
    activeBattles: 1,
    friendship: {
      id: '3',
      userId: '1',
      friendId: '4',
      status: 'accepted' as const,
      createdAt: '2024-07-25',
      acceptedAt: '2024-07-25',
    },
  },
  {
    user: {
      id: '5',
      username: 'alex.kim',
      displayName: 'Alex Kim',
      level: 31,
      experience: 4500,
      joinDate: '2023-08-10',
      lastActive: new Date().toISOString(),
    },
    stats: {
      totalBattles: 278,
      wins: 231,
      losses: 47,
      winRate: 0.83,
      currentStreak: 15,
      longestStreak: 28,
      averageWakeTime: '06:45',
      totalAlarmsSet: 445,
      alarmsCompleted: 421,
      snoozeCount: 23,
    },
    isOnline: true,
    activeBattles: 3,
    friendship: {
      id: '4',
      userId: '1',
      friendId: '5',
      status: 'accepted' as const,
      createdAt: '2023-08-15',
      acceptedAt: '2023-08-15',
    },
  },
];

const MOCK_FRIEND_REQUESTS = [
  {
    id: '1',
    user: {
      id: '6',
      username: 'jenny.park',
      displayName: 'Jenny Park',
      level: 14,
      experience: 2100,
      joinDate: '2024-03-10',
      lastActive: new Date().toISOString(),
    },
    sentAt: '2024-08-10T10:30:00Z',
  },
];

const MOCK_SUGGESTED_FRIENDS = [
  {
    id: '7',
    username: 'david.wilson',
    displayName: 'David Wilson',
    level: 19,
    experience: 2950,
    joinDate: '2024-01-20',
    lastActive: new Date().toISOString(),
  },
  {
    id: '8',
    username: 'lisa.anderson',
    displayName: 'Lisa Anderson',
    level: 25,
    experience: 3800,
    joinDate: '2023-11-05',
    lastActive: new Date().toISOString(),
  },
];

export function FriendsManager({
  currentUser,
  onChallengeFriend,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
}: FriendsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<(typeof MOCK_FRIENDS)[0] | null>(
    null
  );

  // Gaming announcements
  const { announceFriendEvent, announceGaming } = useGamingAnnouncements();

  const filteredFriends = MOCK_FRIENDS.filter(
    friend =>
      friend._user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.8) return 'text-green-500';
    if (winRate >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatLastActive = (lastActive: string) => {
    const now = new Date();
    const last = new Date(lastActive);
    const diff = now.getTime() - last.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 5) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Friends</h2>
          <p className="text-sm text-muted-foreground">
            {MOCK_FRIENDS.length} friends •{' '}
            {MOCK_FRIENDS.filter(f => f.isOnline).length} online
          </p>
        </div>
        <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter username..." className="mt-1" />
              </div>

              <div>
                <Label>Suggested Friends</Label>
                <div className="space-y-2 mt-2">
                  {MOCK_SUGGESTED_FRIENDS.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.displayName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            Level {_user.level}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          announceFriendEvent('request-sent', _user);
                          onSendFriendRequest?.(_user.username);
                        }}
                        aria-label={`Send friend request to ${user.displayName}`}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  announceGaming({
                    type: 'friend',
                    customMessage: 'Friend request sent!',
                    priority: 'polite',
                  });
                  setShowAddFriend(false);
                }}
              >
                Send Friend Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {MOCK_FRIEND_REQUESTS.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                {MOCK_FRIEND_REQUESTS.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>

          {/* Friends List */}
          <div className="space-y-3">
            {filteredFriends.map(friend => (
              <Card key={friend.user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>{friend._user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{friend.user.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          Level {friend.user.level} •{' '}
                          {formatLastActive(friend._user.lastActive)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span
                            className={`text-sm font-medium ${getWinRateColor(friend.stats.winRate)}`}
                          >
                            {Math.round(friend.stats.winRate * 100)}% win rate
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {friend.stats.currentStreak} streak
                          </span>
                          {friend.activeBattles > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {friend.activeBattles} battle
                              {friend.activeBattles > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          announceFriendEvent('added', friend._user);
                          announceGaming({
                            type: 'battle',
                            customMessage: `Challenge sent to ${friend._user.displayName}!`,
                            priority: 'polite',
                          });
                          onChallengeFriend?.(friend._user.id);
                        }}
                        className="gap-1"
                        aria-label={`Challenge ${friend.user.displayName} to a battle`}
                      >
                        <Sword className="h-3 w-3" />
                        Challenge
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedFriend(friend);
                              announceGaming({
                                type: 'friend',
                                customMessage: `Viewing ${friend.user.displayName}'s profile. Level ${friend._user.level}. Win rate: ${Math.round(friend.stats.winRate * 100)}%. Current streak: ${friend.stats.currentStreak}.`,
                                priority: 'polite',
                              });
                            }}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              announceFriendEvent('removed', friend._user);
                            }}
                          >
                            Remove Friend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {MOCK_FRIEND_REQUESTS.length > 0 ? (
            <div className="space-y-3">
              {MOCK_FRIEND_REQUESTS.map(request => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{request.user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{request.user.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            Level {request._user.level} • Sent{' '}
                            {formatLastActive(request.sentAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            announceFriendEvent('added', request._user);
                            onAcceptFriendRequest?.(request.id);
                          }}
                          aria-label={`Accept friend request from ${request.user.displayName}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            announceFriendEvent('removed', request._user);
                            onRejectFriendRequest?.(request.id);
                          }}
                          aria-label={`Reject friend request from ${request.user.displayName}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No friend requests</p>
              <p className="text-sm">New requests will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="space-y-3">
            {[
              ...MOCK_FRIENDS,
              {
                user: currentUser,
                stats: {
                  totalBattles: 65,
                  wins: 47,
                  losses: 18,
                  winRate: 0.72,
                  currentStreak: 5,
                  longestStreak: 12,
                  averageWakeTime: '07:30',
                  totalAlarmsSet: 123,
                  alarmsCompleted: 98,
                  snoozeCount: 34,
                } as UserStats,
                isOnline: true,
                activeBattles: 1,
                friendship: {
                  id: '',
                  userId: '',
                  friendId: '',
                  status: 'accepted' as const,
                  createdAt: '',
                  acceptedAt: '',
                },
              },
            ]
              .sort((a, b) => b.stats.winRate - a.stats.winRate)
              .map((friend, _index) => (
                <Card
                  key={friend.user.id}
                  className={
                    friend.user.id === currentUser.id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                          {_index + 1}
                        </div>
                        <Avatar>
                          <AvatarFallback>{friend.user.displayName[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{friend.user.displayName}</span>
                          {friend._user.id === currentUser.id && (
                            <Badge variant="secondary">You</Badge>
                          )}
                          {_index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Level {friend.user.level} •{' '}
                          {Math.round(friend.stats.winRate * 100)}% win rate
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{friend.stats.wins}W</div>
                        <div className="text-sm text-muted-foreground">
                          {friend.stats.losses}L
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Friend Profile Modal */}
      <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
        <DialogContent className="max-w-md">
          {selectedFriend && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFriend.user.displayName}'s Profile</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarFallback className="text-2xl">
                      {selectedFriend.user.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">
                    {selectedFriend.user.displayName}
                  </h3>
                  <p className="text-muted-foreground">
                    Level {selectedFriend._user.level}
                  </p>
                  <div className="flex justify-center gap-2 mt-2">
                    <Badge variant={selectedFriend.isOnline ? 'default' : 'secondary'}>
                      {selectedFriend.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(selectedFriend.stats.winRate * 100)}% Win Rate
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedFriend.stats.totalBattles}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Battles</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedFriend.stats.currentStreak}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Streak</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedFriend.stats.averageWakeTime}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Wake Time</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedFriend.stats.longestStreak}
                    </div>
                    <div className="text-sm text-muted-foreground">Best Streak</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      onChallengeFriend?.(selectedFriend._user.id);
                      setSelectedFriend(null);
                    }}
                  >
                    <Sword className="h-4 w-4" />
                    Challenge
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FriendsManager;
