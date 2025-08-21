import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  Clock,
  Target,
  Trophy,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Flame,
  Moon,
  Sun,
  Zap
} from 'lucide-react';

interface StatisticsProps {
  userId: string;
}

// Mock statistical data
const MOCK_STATS = {
  overview: {
    totalAlarms: 342,
    alarmsCompleted: 289,
    completionRate: 0.845,
    totalBattles: 67,
    battlesWon: 49,
    winRate: 0.731,
    currentStreak: 8,
    longestStreak: 23,
    averageWakeTime: '07:23',
    totalSnoozes: 78,
    averageSnoozes: 0.23
  },
  weeklyData: [
    { day: 'Mon', alarms: 5, completed: 5, battles: 2, won: 1 },
    { day: 'Tue', alarms: 3, completed: 3, battles: 1, won: 1 },
    { day: 'Wed', alarms: 4, completed: 4, battles: 3, won: 2 },
    { day: 'Thu', alarms: 2, completed: 1, battles: 1, won: 0 },
    { day: 'Fri', alarms: 6, completed: 6, battles: 2, won: 2 },
    { day: 'Sat', alarms: 1, completed: 1, battles: 0, won: 0 },
    { day: 'Sun', alarms: 2, completed: 2, battles: 1, won: 1 }
  ],
  monthlyProgress: {
    currentMonth: 'August 2024',
    daysCompleted: 23,
    perfectDays: 18,
    missedDays: 3,
    battlesThisMonth: 19,
    winsThisMonth: 14
  },
  achievements: [
    { id: 1, name: 'Early Bird', description: 'Wake up before 6 AM', progress: 15, target: 30, unlocked: false },
    { id: 2, name: 'Consistency King', description: '30-day streak', progress: 30, target: 30, unlocked: true },
    { id: 3, name: 'Battle Master', description: 'Win 50 battles', progress: 49, target: 50, unlocked: false },
    { id: 4, name: 'No Snooze Zone', description: '7 days without snoozing', progress: 3, target: 7, unlocked: false },
    { id: 5, name: 'Social Butterfly', description: 'Add 10 friends', progress: 10, target: 10, unlocked: true }
  ],
  wakeTimeTrends: [
    { time: '6:00', count: 12 },
    { time: '6:30', count: 18 },
    { time: '7:00', count: 45 },
    { time: '7:30', count: 67 },
    { time: '8:00', count: 34 },
    { time: '8:30', count: 21 },
    { time: '9:00', count: 8 }
  ]
};

export function Statistics({ userId }: StatisticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTab, setSelectedTab] = useState('overview');

  const { overview, weeklyData, monthlyProgress, achievements, wakeTimeTrends } = MOCK_STATS;

  const getStreakColor = (streak: number) => {
    if (streak >= 20) return 'text-purple-500';
    if (streak >= 10) return 'text-orange-500';
    if (streak >= 5) return 'text-blue-500';
    return 'text-green-500';
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-500';
    if (rate >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const maxWakeTimeCount = Math.max(...wakeTimeTrends.map(t => t.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Statistics & Progress</h2>
          <p className="text-sm text-muted-foreground">Track your wake-up journey and battle performance</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-bold ${getCompletionColor(overview.completionRate)}`}>
                  {Math.round(overview.completionRate * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {overview.alarmsCompleted}/{overview.totalAlarms} alarms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-bold ${getStreakColor(overview.currentStreak)}`}>
                  {overview.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {overview.longestStreak} days
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {Math.round(overview.winRate * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Battle Win Rate</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {overview.battlesWon}/{overview.totalBattles} battles
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {overview.averageWakeTime}
                </div>
                <div className="text-sm text-muted-foreground">Avg Wake Time</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {overview.averageSnoozes} snoozes/alarm
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week's Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((day) => (
                  <div key={day.day} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs font-medium mb-2">{day.day}</div>
                    <div className="space-y-1">
                      <div className={`text-lg font-bold ${day.completed === day.alarms ? 'text-green-500' : 'text-yellow-500'}`}>
                        {day.completed}/{day.alarms}
                      </div>
                      <div className="text-xs text-muted-foreground">alarms</div>
                      {day.battles > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {day.won}/{day.battles} battles
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Perfect Days</span>
                    <span className="font-bold">{monthlyProgress.perfectDays}/31</span>
                  </div>
                  <Progress value={(monthlyProgress.perfectDays / 31) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Battle Wins</span>
                    <span className="font-bold">{monthlyProgress.winsThisMonth}/{monthlyProgress.battlesThisMonth}</span>
                  </div>
                  <Progress value={(monthlyProgress.winsThisMonth / monthlyProgress.battlesThisMonth) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Wake Time Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wakeTimeTrends.map(trend => (
                  <div key={trend.time} className="flex items-center gap-3">
                    <div className="w-12 text-sm font-mono">{trend.time}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(trend.count / maxWakeTimeCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{trend.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Friday</div>
                  <div className="text-sm text-muted-foreground">97% completion rate</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Battles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Wednesday</div>
                  <div className="text-sm text-muted-foreground">Average 2.3 battles</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.unlocked ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-yellow-500 text-white' : 'bg-muted'}`}>
                      {achievement.unlocked ? (
                        <Trophy className="h-6 w-6" />
                      ) : (
                        <Award className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{achievement.name}</h3>
                        {achievement.unlocked && <Badge variant="default">Unlocked!</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>

                      {!achievement.unlocked && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.target}</span>
                          </div>
                          <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Morning Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Earliest wake-up</span>
                  <span className="text-sm font-bold">5:47 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Latest wake-up</span>
                  <span className="text-sm font-bold">9:23 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Most common time</span>
                  <span className="text-sm font-bold">7:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Weekend average</span>
                  <span className="text-sm font-bold">8:15 AM</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Battle Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Favorite battle type</span>
                  <span className="text-sm font-bold">Speed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Best opponent</span>
                  <span className="text-sm font-bold">Sarah Chen</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Longest battle</span>
                  <span className="text-sm font-bold">7 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Quick wins</span>
                  <span className="text-sm font-bold">23 battles</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">342</div>
                  <div className="text-sm text-muted-foreground">Total Alarms</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">78</div>
                  <div className="text-sm text-muted-foreground">Times Snoozed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">156</div>
                  <div className="text-sm text-muted-foreground">Days Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Statistics;