// Premium Analytics and Insights for Relife Alarm App
// Advanced analytics features exclusive to premium subscribers

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Target,
  Calendar,
  Moon,
  Zap,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FeatureGate } from './FeatureGate';
import { FeatureBadge } from './FeatureUtils';
import useAuth from '../../hooks/useAuth';

interface AnalyticsData {
  wakeUpSuccess: {
    rate: number;
    trend: 'up' | 'down' | 'stable';
    weeklyData: number[];
  };
  sleepQuality: {
    score: number;
    factors: Array<{
      name: string;
      impact: number;
      trend: 'positive' | 'negative' | 'neutral';
    }>;
  };
  productivity: {
    correlation: number;
    morningEnergy: number;
    focusTime: number;
  };
  habits: {
    consistency: number;
    streaks: Array<{ name: string; current: number; best: number }>;
  };
  insights: Array<{
    type: 'tip' | 'warning' | 'achievement';
    title: string;
    description: string;
    actionable?: string;
  }>;
}

interface PremiumAnalyticsProps {
  className?: string;
}

// Sleep Quality Analysis Component
function SleepQualityAnalysis({ data }: { data: AnalyticsData['sleepQuality'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-600" />
          Sleep Quality Analysis
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-indigo-600 mb-2">
            {data.score}/100
          </div>
          <p className="text-gray-600">Overall Sleep Quality Score</p>
          <Progress value={data.score} className="mt-2" />
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Contributing Factors</h4>
          {data.factors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{factor.name}</span>
              <div className="flex items-center gap-2">
                <Progress value={Math.abs(factor.impact)} className="w-20 h-2" />
                <Badge
                  variant={
                    factor.trend === 'positive'
                      ? 'default'
                      : factor.trend === 'negative'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="text-xs"
                >
                  {factor.trend === 'positive'
                    ? '↗'
                    : factor.trend === 'negative'
                      ? '↘'
                      : '→'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-900 mb-2">AI Recommendations</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Try going to bed 15 minutes earlier</li>
            <li>• Avoid screens 1 hour before bedtime</li>
            <li>• Consider a gradual wake-up light</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Productivity Correlation Component
function ProductivityCorrelation({ data }: { data: AnalyticsData['productivity'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-600" />
          Productivity Insights
          <FeatureBadge tier="pro" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(data.correlation * 100)}%
            </div>
            <p className="text-xs text-gray-600">Wake-up → Productivity</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {data.morningEnergy}/10
            </div>
            <p className="text-xs text-gray-600">Morning Energy</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{data.focusTime}h</div>
            <p className="text-xs text-gray-600">Deep Focus Time</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Productivity Patterns</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Best wake-up time</span>
              <Badge variant="outline">6:30 AM</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Peak focus hours</span>
              <Badge variant="outline">9:00 - 11:00 AM</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Energy dip</span>
              <Badge variant="outline">2:00 - 3:00 PM</Badge>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-semibold text-green-900 mb-2">Optimization Tips</h5>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Schedule important tasks for 9-11 AM</li>
            <li>• Use afternoon dip for lighter activities</li>
            <li>• Maintain consistent wake-up times</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Habit Tracking Component
function HabitTracking({ data }: { data: AnalyticsData['habits'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          Habit Consistency
          <FeatureBadge tier="basic" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {Math.round(data.consistency * 100)}%
          </div>
          <p className="text-gray-600">Overall Consistency</p>
          <Progress value={data.consistency * 100} className="mt-2" />
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Streak Tracking</h4>
          {data.streaks.map((streak, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{streak.name}</p>
                <p className="text-sm text-gray-600">Best: {streak.best} days</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-600">
                  {streak.current}
                </div>
                <p className="text-xs text-gray-600">current</p>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" variant="outline">
          View Detailed Habit Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

// AI Insights Component
function AIInsights({ data }: { data: AnalyticsData['insights'] }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Brain className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-green-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'tip':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'achievement':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI-Powered Insights
          <FeatureBadge tier="pro" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <h5 className="font-semibold mb-1">{insight.title}</h5>
                <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                {insight.actionable && (
                  <Button size="sm" variant="outline" className="text-xs">
                    {insight.actionable}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Advanced Reports Component
function AdvancedReports() {
  const [reportType, setReportType] = useState('weekly');
  const [exportFormat, setExportFormat] = useState('pdf');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Advanced Reports
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Report Period</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
                <SelectItem value="monthly">Monthly Analysis</SelectItem>
                <SelectItem value="quarterly">Quarterly Review</SelectItem>
                <SelectItem value="yearly">Annual Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="csv">CSV Data</SelectItem>
                <SelectItem value="json">JSON Export</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Available Reports</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Sleep Pattern Analysis</span>
              <Button size="sm" variant="ghost">
                Generate
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Productivity Correlation</span>
              <Button size="sm" variant="ghost">
                Generate
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Habit Formation Progress</span>
              <Button size="sm" variant="ghost">
                Generate
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Custom Analytics</span>
              <Button size="sm" variant="ghost">
                Create
              </Button>
            </div>
          </div>
        </div>

        <Button className="w-full">
          Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
        </Button>
      </CardContent>
    </Card>
  );
}

// Main Premium Analytics Component
export function PremiumAnalytics({ className = '' }: PremiumAnalyticsProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    wakeUpSuccess: {
      rate: 0.85,
      trend: 'up',
      weeklyData: [75, 80, 90, 85, 95, 90, 85],
    },
    sleepQuality: {
      score: 78,
      factors: [
        { name: 'Sleep Duration', impact: 85, trend: 'positive' },
        { name: 'Bedtime Consistency', impact: 72, trend: 'neutral' },
        { name: 'Screen Time Before Bed', impact: -45, trend: 'negative' },
        { name: 'Caffeine Intake', impact: -30, trend: 'positive' },
        { name: 'Exercise', impact: 60, trend: 'positive' },
      ],
    },
    productivity: {
      correlation: 0.73,
      morningEnergy: 7.8,
      focusTime: 4.2,
    },
    habits: {
      consistency: 0.82,
      streaks: [
        { name: 'Morning Wake-up', current: 12, best: 28 },
        { name: 'No Snooze', current: 5, best: 15 },
        { name: 'Exercise', current: 8, best: 21 },
        { name: 'Meditation', current: 3, best: 12 },
      ],
    },
    insights: [
      {
        type: 'achievement',
        title: 'Streak Milestone!',
        description:
          "You've maintained a consistent wake-up time for 12 days straight.",
        actionable: 'Keep it up!',
      },
      {
        type: 'tip',
        title: 'Optimize Your Evening',
        description:
          'Your sleep quality improves when you avoid screens 1 hour before bed.',
        actionable: 'Set a reminder',
      },
      {
        type: 'warning',
        title: 'Weekend Pattern',
        description:
          'Your wake-up times vary significantly on weekends, affecting Monday performance.',
        actionable: 'Adjust schedule',
      },
    ],
  });

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">Sign in to access premium analytics</p>
      </div>
    );
  }

  return (
    <FeatureGate feature="advanced_analytics" userId={user.id} showUpgradePrompt>
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Premium Analytics</h2>
            <p className="text-gray-600">
              Deep insights into your sleep and wake patterns
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sleep">Sleep Analysis</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SleepQualityAnalysis data={analyticsData.sleepQuality} />
              <ProductivityCorrelation data={analyticsData.productivity} />
              <HabitTracking data={analyticsData.habits} />
              <AIInsights data={analyticsData.insights} />
            </div>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SleepQualityAnalysis data={analyticsData.sleepQuality} />
              <HabitTracking data={analyticsData.habits} />
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductivityCorrelation data={analyticsData.productivity} />
              <AIInsights data={analyticsData.insights} />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AdvancedReports />
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  );
}

export default PremiumAnalytics;
