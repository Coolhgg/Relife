import React, { useState, useEffect } from 'react';
import { Home, AlarmClock, Users, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickAlarmSetup } from '@/components/QuickAlarmSetup';
import { AlarmManagement } from '@/components/AlarmManagement';
import { AlarmTester } from '@/components/AlarmTester';
import { CommunityHub } from '@/components/CommunityHub';
import { Statistics } from '@/components/Statistics';
import { AIAutomation } from '@/components/AIAutomation';
import { MediaContent } from '@/components/MediaContent';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import type { Theme, User as UserType, Battle, Alarm, DayOfWeek } from '../shared/types';

// Mock data for development
const mockUser: UserType = {
  id: '1',
  username: 'you',
  displayName: 'You',
  level: 15,
  experience: 2450,
  joinDate: '2024-01-15',
  lastActive: new Date().toISOString(),
};

const mockActiveBattles: Battle[] = [
  {
    id: '1',
    type: 'speed',
    participants: [
      {
        userId: '1',
        user: mockUser,
        progress: 75,
        joinedAt: new Date().toISOString(),
        stats: { wakeTime: '07:15', tasksCompleted: 0, snoozeCount: 1, score: 75 }
      },
      {
        userId: '2',
        user: { id: '2', username: 'sarah.chen', displayName: 'Sarah Chen', level: 22, experience: 3200, joinDate: '2023-12-01', lastActive: new Date().toISOString() },
        progress: 60,
        joinedAt: new Date().toISOString(),
        stats: { wakeTime: '07:30', tasksCompleted: 0, snoozeCount: 2, score: 60 }
      }
    ],
    creatorId: '2',
    status: 'active',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    settings: { duration: 'PT2H', maxParticipants: 2 },
    createdAt: new Date().toISOString()
  }
];

const mockUpcomingAlarms: Alarm[] = [
  {
    id: '1',
    userId: '1',
    time: '07:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    label: 'Wake up for work',
    isActive: true,
    sound: 'default',
    snoozeEnabled: true,
    snoozeInterval: 5,
    difficulty: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: '1',
    time: '08:30',
    days: ['saturday', 'sunday'],
    label: 'Weekend sleep-in',
    isActive: true,
    sound: 'gentle',
    snoozeEnabled: false,
    snoozeInterval: 10,
    difficulty: 'easy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState<Theme>('minimalist');
  const [alarms, setAlarms] = useState<Alarm[]>(mockUpcomingAlarms);
  const [battles, setBattles] = useState<Battle[]>(mockActiveBattles);

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.className = theme === 'minimalist' ? '' : theme;
  }, [theme]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getTimeUntilAlarm = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const diff = alarmTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="mx-auto max-w-md relative">
        <main className="pb-20 mobile-fade-up">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0">
              <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Good morning!</h1>
                    <p className="text-sm text-muted-foreground">Ready to win the day?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Level {mockUser.level}</Badge>
                    <Avatar>
                      <AvatarFallback>{mockUser.displayName[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">5</div>
                      <div className="text-sm text-muted-foreground">Win Streak</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">73%</div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Battles */}
                {mockActiveBattles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Active Battle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mockActiveBattles.map((battle) => {
                        const opponent = battle.participants.find(p => p.userId !== mockUser.id);
                        const userProgress = battle.participants.find(p => p.userId === mockUser.id)?.progress || 0;
                        const opponentProgress = opponent?.progress || 0;
                        
                        return (
                          <div key={battle.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant={battle.type === 'speed' ? 'default' : 'secondary'}>
                                {battle.type} • {battle.type === 'speed' ? 'coffee' : 'challenge'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">1h 0m left</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">You</span>
                                <span className="text-sm font-bold text-primary">{userProgress}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${userProgress}%` }}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{opponent?.user.displayName}</span>
                                <span className="text-sm font-bold text-destructive">{opponentProgress}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-destructive transition-all duration-300"
                                  style={{ width: `${opponentProgress}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="bg-muted/50 rounded-lg p-3 text-sm italic">
                              "Hope you like the taste of defeat with your morning coffee!"
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Alarms */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Upcoming Alarms
                      <QuickAlarmSetup onAlarmSet={(newAlarm) => {
                        const alarm: Alarm = {
                          id: Date.now().toString(),
                          userId: mockUser.id,
                          time: newAlarm.time,
                          days: newAlarm.days,
                          label: newAlarm.label,
                          isActive: true,
                          sound: 'default',
                          snoozeEnabled: newAlarm.snoozeEnabled,
                          snoozeInterval: 5,
                          difficulty: newAlarm.difficulty as any,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        };
                        setAlarms(prev => [...prev, alarm]);
                      }} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alarms.map((alarm) => (
                      <div key={alarm.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{formatTime(alarm.time)}</div>
                          <div className="text-sm text-muted-foreground">{alarm.label}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{getTimeUntilAlarm(alarm.time)}</div>
                          <div className="text-xs text-muted-foreground">until alarm</div>
                        </div>
                      </div>
                    ))}
                    {alarms.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlarmClock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>No alarms set</p>
                        <p className="text-sm">Tap "Quick Set" to add your first alarm</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alarms" className="mt-0">
              <div className="p-4">
                <AlarmManagement 
                  alarms={alarms}
                  onUpdateAlarm={(id, updates) => {
                    setAlarms(prev => prev.map(alarm => 
                      alarm.id === id ? { ...alarm, ...updates, updatedAt: new Date().toISOString() } : alarm
                    ));
                  }}
                  onDeleteAlarm={(id) => {
                    setAlarms(prev => prev.filter(alarm => alarm.id !== id));
                  }}
                  onCreateAlarm={(newAlarmData) => {
                    const alarm: Alarm = {
                      id: Date.now().toString(),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      ...newAlarmData
                    };
                    setAlarms(prev => [...prev, alarm]);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="community" className="mt-0">
              <div className="p-4">
                <CommunityHub
                  currentUser={mockUser}
                  battles={battles}
                  onCreateBattle={(newBattle) => {
                    const battle: Battle = {
                      id: Date.now().toString(),
                      createdAt: new Date().toISOString(),
                      participants: [],
                      settings: { duration: 'PT2H', maxParticipants: 8 },
                      ...newBattle,
                    } as Battle;
                    setBattles(prev => [...prev, battle]);
                  }}
                  onJoinBattle={(battleId) => {
                    console.log('Joining battle:', battleId);
                  }}
                  onSendTrashTalk={(battleId, message) => {
                    console.log('Trash talk:', battleId, message);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <div className="p-4">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="ai">AI</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6">
                    <div className="text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarFallback className="text-2xl">{mockUser.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold">{mockUser.displayName}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant="secondary">Level {mockUser.level}</Badge>
                        <Badge variant="outline">73% Win Rate</Badge>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">247</div>
                            <div className="text-sm text-muted-foreground">Total Battles</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">180</div>
                            <div className="text-sm text-muted-foreground">Victories</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">5</div>
                            <div className="text-sm text-muted-foreground">Current Streak</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">7:15</div>
                            <div className="text-sm text-muted-foreground">Avg Wake Time</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <AlarmTester />
                  </TabsContent>

                  <TabsContent value="analytics">
                    <AdvancedAnalytics
                      currentUser={mockUser}
                      sleepData={[]}
                      wakeUpData={[]}
                      battlePerformance={[]}
                      learningData={{
                        sleepPatterns: [],
                        wakeUpBehavior: [],
                        battlePerformance: [],
                        userPreferences: [],
                        contextualFactors: []
                      }}
                      onExportData={() => {
                        console.log('Exporting analytics data');
                      }}
                      onUpdatePreferences={(preferences) => {
                        console.log('Updating preferences:', preferences);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="media">
                    <MediaContent
                      currentUser={mockUser}
                      mediaLibrary={{
                        id: '1',
                        userId: mockUser.id,
                        sounds: [],
                        playlists: [],
                        quotes: [],
                        photos: [],
                        storage: {
                          used: 0,
                          total: 104857600,
                          percentage: 0
                        }
                      }}
                      contentPreferences={{
                        defaultSoundCategory: 'nature',
                        preferredQuoteCategories: ['motivation', 'inspiration'],
                        autoPlayPlaylists: true,
                        quotesEnabled: true,
                        photoChallengesEnabled: true,
                        contentSharing: true,
                        nsfw: false
                      }}
                      onUploadSound={(file) => {
                        console.log('Uploading sound:', file.name);
                      }}
                      onCreatePlaylist={(playlist) => {
                        console.log('Creating playlist:', playlist);
                      }}
                      onSubmitQuote={(quote) => {
                        console.log('Submitting quote:', quote);
                      }}
                      onCompletePhotoChallenge={(challengeId, photo, caption) => {
                        console.log('Completing photo challenge:', challengeId, caption);
                      }}
                      onUpdatePreferences={(preferences) => {
                        console.log('Updating content preferences:', preferences);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="ai">
                    <AIAutomation
                      currentUser={mockUser}
                      aiOptimizations={[]}
                      recommendations={[]}
                      personalizedChallenges={[]}
                      automations={[]}
                      sleepData={[]}
                      wakeUpData={[]}
                      onApplyRecommendation={(recommendationId) => {
                        console.log('Applying recommendation:', recommendationId);
                      }}
                      onToggleOptimization={(optimizationId, enabled) => {
                        console.log('Toggling optimization:', optimizationId, enabled);
                      }}
                      onCreateAutomation={(automation) => {
                        console.log('Creating automation:', automation);
                      }}
                      onToggleAutomation={(automationId, enabled) => {
                        console.log('Toggling automation:', automationId, enabled);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Theme</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {(['minimalist', 'colorful', 'dark'] as Theme[]).map((themeOption) => (
                          <Button
                            key={themeOption}
                            variant={theme === themeOption ? 'default' : 'outline'}
                            className="w-full justify-start"
                            onClick={() => setTheme(themeOption)}
                          >
                            {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Battle challenges</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Friend requests</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Achievement unlocks</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Daily reminders</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Privacy</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Public profile</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Show online status</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Allow friend requests</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50">
          <div className="mx-auto max-w-md">
            <TabsList className="grid w-full grid-cols-4 h-16 bg-transparent">
              <TabsTrigger value="dashboard" className="flex-col h-full mobile-touch-target mobile-press-feedback">
                <Home size={20} />
                <span className="text-xs mt-1">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="alarms" className="flex-col h-full mobile-touch-target mobile-press-feedback">
                <AlarmClock size={20} />
                <span className="text-xs mt-1">Alarms</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex-col h-full mobile-touch-target mobile-press-feedback">
                <Users size={20} />
                <span className="text-xs mt-1">Community</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-col h-full mobile-touch-target mobile-press-feedback">
                <User size={20} />
                <span className="text-xs mt-1">Profile</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
      </div>
    </div>
  );
}
