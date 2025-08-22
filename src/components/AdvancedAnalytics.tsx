import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  BarChart3,
  Brain,
  Calendar,
  Clock,
  Heart,
  Moon,
  Sun,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Coffee,
  CloudRain,
  Thermometer,
  Trophy,
  AlertCircle,
  CheckCircle,
  Timer,
  Smile,
  Frown,
  Meh,
  Star,
  LineChart,
  PieChart,
} from 'lucide-react';
import type {
  User as UserType,
  SleepPattern,
  WakeUpBehavior,
  BattlePerformanceData,
  WakeUpMood,
  LearningData,
} from '../types/index';

interface AdvancedAnalyticsProps {
  currentUser: UserType;
  sleepData: SleepPattern[];
  wakeUpData: WakeUpBehavior[];
  battlePerformance: BattlePerformanceData[];
  learningData: LearningData;
  onExportData?: () => void;
  onUpdatePreferences?: (preferences: any) => void;
}

// Mock data for development
const MOCK_SLEEP_DATA: SleepPattern[] = [
  {
    id: '1',
    userId: 'user1',
    date: '2024-01-10',
    bedTime: '23:30',
    wakeTime: '07:00',
    totalSleepHours: 7.5,
    sleepQuality: 8,
    interruptions: [],
    factors: [],
    mood: 'refreshed',
    energyLevel: 8,
    source: 'smart_alarm',
    sleepDuration: 450,
    sleepEfficiency: 0.92,
    deepSleepPercentage: 22,
    remSleepPercentage: 18,
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    date: '2024-01-09',
    bedTime: '23:45',
    wakeTime: '07:15',
    totalSleepHours: 7.5,
    sleepQuality: 7,
    interruptions: [],
    factors: [],
    mood: 'good',
    energyLevel: 7,
    source: 'smart_alarm',
    sleepDuration: 450,
    sleepEfficiency: 0.88,
    deepSleepPercentage: 20,
    remSleepPercentage: 19,
    createdAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    date: '2024-01-08',
    bedTime: '00:15',
    wakeTime: '07:30',
    totalSleepHours: 7.25,
    sleepQuality: 6,
    interruptions: [],
    factors: [],
    mood: 'okay',
    energyLevel: 6,
    source: 'smart_alarm',
    sleepDuration: 435,
    sleepEfficiency: 0.85,
    deepSleepPercentage: 18,
    remSleepPercentage: 16,
    createdAt: new Date(),
  },
  {
    id: '4',
    userId: 'user1',
    date: '2024-01-07',
    bedTime: '23:15',
    wakeTime: '06:45',
    totalSleepHours: 7.5,
    sleepQuality: 9,
    interruptions: [],
    factors: [],
    mood: 'excellent',
    energyLevel: 9,
    source: 'smart_alarm',
    sleepDuration: 450,
    sleepEfficiency: 0.95,
    deepSleepPercentage: 25,
    remSleepPercentage: 20,
    createdAt: new Date(),
  },
];

const MOCK_WAKEUP_DATA: WakeUpBehavior[] = [
  {
    id: '1',
    userId: 'user1',
    alarmId: 'alarm1',
    date: '2024-01-10',
    scheduledWakeTime: '07:00',
    alarmTime: '07:00',
    actualWakeTime: '07:05',
    dismissMethod: 'button',
    snoozeCount: 1,
    snoozeDuration: 5,
    difficulty: 'medium',
    completionTime: 145,
    mood: 'good',
    energyLevel: 7,
    readiness: 7,
    challenges: [],
    context: {
      weather: 'sunny',
      temperature: 22,
      dayOfWeek: 'wednesday',
      sleepHours: 7.5,
    },
    performance: {
      responseTime: 145,
      accuracy: 0.9,
      persistence: 0.8,
      consistency: 0.85,
    },
    environment: 'home',
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    alarmId: 'alarm2',
    date: '2024-01-09',
    scheduledWakeTime: '07:15',
    alarmTime: '07:15',
    actualWakeTime: '07:15',
    dismissMethod: 'voice',
    snoozeCount: 0,
    snoozeDuration: 0,
    difficulty: 'easy',
    completionTime: 95,
    mood: 'excellent',
    energyLevel: 9,
    readiness: 9,
    challenges: [],
    context: {
      weather: 'cloudy',
      temperature: 20,
      dayOfWeek: 'tuesday',
      sleepHours: 7.5,
    },
    performance: {
      responseTime: 95,
      accuracy: 1.0,
      persistence: 1.0,
      consistency: 0.95,
    },
    environment: 'home',
    createdAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    alarmId: 'alarm3',
    date: '2024-01-08',
    scheduledWakeTime: '07:30',
    alarmTime: '07:30',
    actualWakeTime: '07:45',
    dismissMethod: 'shake',
    snoozeCount: 3,
    snoozeDuration: 15,
    difficulty: 'hard',
    completionTime: 220,
    mood: 'tired',
    energyLevel: 4,
    readiness: 4,
    challenges: [],
    context: {
      weather: 'rainy',
      temperature: 18,
      dayOfWeek: 'monday',
      sleepHours: 6.5,
    },
    performance: {
      responseTime: 220,
      accuracy: 0.7,
      persistence: 0.6,
      consistency: 0.5,
    },
    environment: 'home',
    createdAt: new Date(),
  },
];

const MOCK_BATTLE_PERFORMANCE: BattlePerformanceData[] = [
  {
    battleId: '1',
    userId: 'user1',
    date: '2024-01-10',
    battleType: 'solo',
    difficulty: 'medium',
    result: 'win',
    score: 85,
    mistakes: 1,
    mood: 'good',
    performance: {} as any,
    comparison: {} as any,
    improvement: {} as any,
    streaks: {} as any,
    achievements: [],
    analysis: {} as any,
    createdAt: new Date(),
  },
  {
    battleId: '2',
    userId: 'user1',
    date: '2024-01-09',
    battleType: 'multiplayer',
    difficulty: 'easy',
    result: 'win',
    score: 92,
    mistakes: 0,
    mood: 'excellent',
    performance: {} as any,
    comparison: {} as any,
    improvement: {} as any,
    streaks: {} as any,
    achievements: [],
    analysis: {} as any,
    createdAt: new Date(),
  },
  {
    battleId: '3',
    userId: 'user1',
    date: '2024-01-08',
    battleType: 'tournament',
    difficulty: 'hard',
    result: 'loss',
    score: 65,
    mistakes: 3,
    mood: 'tired',
    performance: {} as any,
    comparison: {} as any,
    improvement: {} as any,
    streaks: {} as any,
    achievements: [],
    analysis: {} as any,
    createdAt: new Date(),
  },
];

const getMoodIcon = (mood: WakeUpMood) => {
  switch (mood) {
    case 'excellent':
      return <Smile className="h-4 w-4 text-green-500" />;
    case 'good':
      return <Smile className="h-4 w-4 text-blue-500" />;
    case 'neutral':
      return <Meh className="h-4 w-4 text-yellow-500" />;
    case 'tired':
      return <Frown className="h-4 w-4 text-orange-500" />;
    case 'grumpy':
      return <Frown className="h-4 w-4 text-red-500" />;
    default:
      return <Meh className="h-4 w-4 text-gray-500" />;
  }
};

const getMoodColor = (mood: WakeUpMood) => {
  switch (mood) {
    case 'excellent':
      return 'text-green-500';
    case 'good':
      return 'text-blue-500';
    case 'neutral':
      return 'text-yellow-500';
    case 'tired':
      return 'text-orange-500';
    case 'grumpy':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getWeatherIcon = (weather: string) => {
  switch (weather) {
    case 'sunny':
      return <Sun className="h-4 w-4 text-yellow-500" />;
    case 'cloudy':
      return <CloudRain className="h-4 w-4 text-gray-500" />;
    case 'rainy':
      return <CloudRain className="h-4 w-4 text-blue-500" />;
    default:
      return <Sun className="h-4 w-4 text-gray-500" />;
  }
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

export function AdvancedAnalytics({
  currentUser,
  sleepData = MOCK_SLEEP_DATA,
  wakeUpData = MOCK_WAKEUP_DATA,
  battlePerformance = MOCK_BATTLE_PERFORMANCE,
  learningData,
  onExportData,
  onUpdatePreferences,
}: AdvancedAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Calculate sleep analytics
  const avgSleepQuality =
    sleepData.reduce((sum, s) => sum + s.sleepQuality, 0) / sleepData.length;
  const avgSleepDuration =
    sleepData.reduce((sum, s) => sum + s.sleepDuration, 0) / sleepData.length;
  const avgSleepEfficiency =
    sleepData.reduce((sum, s) => sum + s.sleepEfficiency, 0) / sleepData.length;

  // Calculate wake-up analytics
  const avgSnoozeCount =
    wakeUpData.reduce((sum, w) => sum + w.snoozeCount, 0) / wakeUpData.length;
  const avgCompletionTime =
    wakeUpData.reduce((sum, w) => sum + w.completionTime, 0) / wakeUpData.length;
  const onTimeRate =
    (wakeUpData.filter(w => w.snoozeCount === 0).length / wakeUpData.length) * 100;

  // Calculate battle analytics
  const battleWinRate =
    (battlePerformance.filter(b => b.result === 'win').length /
      battlePerformance.length) *
    100;
  const avgBattleScore =
    battlePerformance.reduce((sum, b) => sum + b.score, 0) / battlePerformance.length;

  // Mood distribution
  const moodCounts = wakeUpData.reduce(
    (acc, w) => {
      acc[w.mood] = (acc[w.mood] || 0) + 1;
      return acc;
    },
    {} as Record<WakeUpMood, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Deep insights into your sleep and wake patterns
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(period => (
            <Button
              key={period}
              size="sm"
              variant={selectedPeriod === period ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="sleep" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="mood">Mood</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sleep" className="space-y-4">
          {/* Sleep Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Sleep Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgSleepQuality.toFixed(1)}/10
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={avgSleepQuality * 10} className="flex-1" />
                  <Badge
                    variant={
                      avgSleepQuality >= 8
                        ? 'default'
                        : avgSleepQuality >= 6
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {avgSleepQuality >= 8
                      ? 'Great'
                      : avgSleepQuality >= 6
                        ? 'Good'
                        : 'Needs Work'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Sleep Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSleepDuration.toFixed(1)}h</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={(avgSleepDuration / 9) * 100} className="flex-1" />
                  <Badge variant={avgSleepDuration >= 7 ? 'default' : 'secondary'}>
                    {avgSleepDuration >= 7 ? 'Optimal' : 'Short'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Sleep Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgSleepEfficiency.toFixed(0)}%
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={avgSleepEfficiency} className="flex-1" />
                  <Badge
                    variant={
                      avgSleepEfficiency >= 90
                        ? 'default'
                        : avgSleepEfficiency >= 80
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {avgSleepEfficiency >= 90
                      ? 'Excellent'
                      : avgSleepEfficiency >= 80
                        ? 'Good'
                        : 'Poor'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sleep Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Sleep Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sleepData.slice(0, 7).map((sleep, index) => (
                  <div
                    key={sleep.date}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium w-16">
                        {new Date(sleep.date).toLocaleDateString('en', {
                          weekday: 'short',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">
                          {formatTime(sleep.bedTime)} - {formatTime(sleep.wakeTime)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {sleep.sleepDuration}h
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quality: {sleep.sleepQuality}/10
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(sleep.sleepQuality / 2)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sleep Stages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Sleep Stages Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {sleepData[0]?.deepSleepPercentage || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Deep Sleep</div>
                  <Progress
                    value={sleepData[0]?.deepSleepPercentage || 0}
                    className="mt-2"
                  />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {sleepData[0]?.remSleepPercentage || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">REM Sleep</div>
                  <Progress
                    value={sleepData[0]?.remSleepPercentage || 0}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          {/* Productivity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  On-Time Wake Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onTimeRate.toFixed(0)}%</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={onTimeRate} className="flex-1" />
                  <Badge
                    variant={
                      onTimeRate >= 80
                        ? 'default'
                        : onTimeRate >= 60
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {onTimeRate >= 80
                      ? 'Excellent'
                      : onTimeRate >= 60
                        ? 'Good'
                        : 'Needs Work'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Avg Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(avgCompletionTime / 60)}m {avgCompletionTime % 60}s
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={Math.min((120 / avgCompletionTime) * 100, 100)}
                    className="flex-1"
                  />
                  <Badge
                    variant={
                      avgCompletionTime <= 120
                        ? 'default'
                        : avgCompletionTime <= 180
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {avgCompletionTime <= 120
                      ? 'Fast'
                      : avgCompletionTime <= 180
                        ? 'Average'
                        : 'Slow'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Battle Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{battleWinRate.toFixed(0)}%</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={battleWinRate} className="flex-1" />
                  <Badge
                    variant={
                      battleWinRate >= 70
                        ? 'default'
                        : battleWinRate >= 50
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {battleWinRate >= 70
                      ? 'Champion'
                      : battleWinRate >= 50
                        ? 'Competitor'
                        : 'Challenger'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Productivity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Wake-Up Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wakeUpData.slice(0, 7).map((wakeup, index) => (
                  <div
                    key={wakeup.date}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium w-16">
                        {new Date(wakeup.date).toLocaleDateString('en', {
                          weekday: 'short',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {getMoodIcon(wakeup.mood)}
                        <span className="text-sm capitalize">{wakeup.mood}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(wakeup.context.weather)}
                        <span className="text-sm">{wakeup.context.temperature}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {wakeup.snoozeCount === 0 ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              On time
                            </span>
                          ) : (
                            <span className="text-orange-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {wakeup.snoozeCount} snooze
                              {wakeup.snoozeCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(wakeup.completionTime / 60)}m{' '}
                          {wakeup.completionTime % 60}s
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Battle Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Battle Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {battlePerformance.map((battle, index) => (
                  <div
                    key={battle.battleId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          battle.result === 'win'
                            ? 'default'
                            : battle.result === 'loss'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {battle.result}
                      </Badge>
                      <span className="text-sm capitalize">
                        {battle.battleType} battle
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {battle.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">Score: {battle.score}</div>
                        <div className="text-xs text-muted-foreground">
                          {battle.mistakes} mistake{battle.mistakes !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getMoodIcon(battle.mood)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mood" className="space-y-4">
          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(moodCounts).map(([mood, count]) => {
                  const percentage = (count / wakeUpData.length) * 100;
                  return (
                    <div key={mood} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMoodIcon(mood as WakeUpMood)}
                        <span className="capitalize">{mood}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <Progress value={percentage} className="flex-1" />
                        <span className="text-sm font-medium w-12">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Mood vs Performance Correlation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Mood Impact on Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">92%</div>
                    <div className="text-sm text-muted-foreground">
                      Success rate when feeling excellent
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">45%</div>
                    <div className="text-sm text-muted-foreground">
                      Success rate when feeling tired
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Mood Improvement Tips</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Maintain consistent sleep schedule</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Avoid screens 1 hour before bed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Get natural light in the morning</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Weather Impact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Sunny days</span>
                      </div>
                      <span className="text-sm font-medium text-green-500">
                        +15% better mood
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloudRain className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Rainy days</span>
                      </div>
                      <span className="text-sm font-medium text-red-500">
                        -8% mood impact
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Optimal Conditions</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Temperature:</span>
                      <span className="ml-2 font-medium">18-22°C</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Light Level:</span>
                      <span className="ml-2 font-medium">60-80%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Sleep Quality Improving
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your sleep quality has increased by 12% over the past week. Keep
                      up the consistent bedtime routine!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">
                      Monday Morning Pattern
                    </h4>
                    <p className="text-sm text-orange-700 mt-1">
                      You typically struggle more on Monday mornings. Consider setting
                      an earlier bedtime on Sunday nights.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Weather Adaptation</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Great job adapting to rainy day challenges! Your performance
                      improved by 20% on cloudy days this week.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">Optimize Sleep Schedule</div>
                  <div className="text-sm text-muted-foreground">
                    Shift bedtime 15 minutes earlier for better sleep quality
                  </div>
                </div>
                <Button size="sm">Apply</Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">Weather-Based Alarms</div>
                  <div className="text-sm text-muted-foreground">
                    Add 10 minutes buffer time on rainy days
                  </div>
                </div>
                <Button size="sm">Apply</Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">Difficulty Adjustment</div>
                  <div className="text-sm text-muted-foreground">
                    Increase challenge difficulty on good mood days
                  </div>
                </div>
                <Button size="sm">Apply</Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">This Week vs Last Week</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sleep Quality</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-medium text-green-500">+8%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">On-Time Rate</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-medium text-green-500">+12%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Battle Performance</span>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-sm font-medium text-red-500">-5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Monthly Goals</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Sleep Quality Target</span>
                        <span className="text-sm font-medium">7.8/8.5</span>
                      </div>
                      <Progress value={(7.8 / 8.5) * 100} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Win Rate Target</span>
                        <span className="text-sm font-medium">73/80%</span>
                      </div>
                      <Progress value={(73 / 80) * 100} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedAnalytics;
