/**
 * AI Performance Dashboard
 * Comprehensive real-time monitoring and insights dashboard for all AI systems
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Brain,
  Mic,
  Trophy,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Calendar,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
  Line,
  Bar,
  Pie,
} from 'recharts';

// Types
interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

interface DeploymentStatus {
  phase: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  name: string;
  startTime?: Date;
  completionTime?: Date;
  errors?: string[];
}

interface AIMetrics {
  patternRecognitionAccuracy: number;
  recommendationEngagementRate: number;
  userSatisfactionScore: number;
  voiceEffectivenessScore: number;
  rewardsEngagementRate: number;
  averageResponseTime: number;
  totalInsightsGenerated: number;
  activeUsers: number;
}

interface PerformanceMetric {
  timestamp: string;
  accuracy: number;
  responseTime: number;
  engagement: number;
  satisfaction: number;
}

interface VoiceAnalytics {
  mood: string;
  successRate: number;
  avgResponseTime: number;
  userPreference: number;
  totalUsage: number;
}

interface RewardMetrics {
  category: string;
  unlocked: number;
  engagement: number;
  satisfaction: number;
}

interface BehavioralInsight {
  type: string;
  count: number;
  averageConfidence: number;
  actionabilityRate: number;
}

// Mock data generator for demo
const generateMockData = () => {
  const currentTime = new Date();
  const last24Hours = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(currentTime.getTime() - (23 - i) * 60 * 60 * 1000);
    return {
      timestamp: time.toISOString(),
      accuracy: 85 + Math.random() * 10,
      responseTime: 1200 + Math.random() * 800,
      engagement: 70 + Math.random() * 25,
      satisfaction: 80 + Math.random() * 15,
    };
  });

  const serviceHealth: ServiceHealth[] = [
    {
      serviceName: 'Behavioral Intelligence',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 1250,
      errorRate: 0.2,
      uptime: 99.8,
    },
    {
      serviceName: 'Voice AI Enhanced',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 890,
      errorRate: 0.1,
      uptime: 99.9,
    },
    {
      serviceName: 'AI Rewards System',
      status: 'degraded',
      lastCheck: new Date(),
      responseTime: 2100,
      errorRate: 1.2,
      uptime: 98.5,
    },
    {
      serviceName: 'Cross-Platform Integration',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 650,
      errorRate: 0.05,
      uptime: 99.95,
    },
    {
      serviceName: 'Recommendation Engine',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 1100,
      errorRate: 0.3,
      uptime: 99.7,
    },
  ];

  const deploymentStatus: DeploymentStatus[] = [
    {
      phase: 1,
      status: 'completed',
      progress: 100,
      name: 'Core Services',
      completionTime: new Date(),
    },
    {
      phase: 2,
      status: 'completed',
      progress: 100,
      name: 'Cross-Platform Integration',
      completionTime: new Date(),
    },
    {
      phase: 3,
      status: 'completed',
      progress: 100,
      name: 'Recommendation Engine',
      completionTime: new Date(),
    },
    {
      phase: 4,
      status: 'in_progress',
      progress: 85,
      name: 'Dashboard & UI',
      startTime: new Date(),
    },
    { phase: 5, status: 'pending', progress: 0, name: 'Optimization & Scaling' },
  ];

  const voiceAnalytics: VoiceAnalytics[] = [
    {
      mood: 'motivational',
      successRate: 87,
      avgResponseTime: 45,
      userPreference: 92,
      totalUsage: 1450,
    },
    {
      mood: 'drill-sergeant',
      successRate: 95,
      avgResponseTime: 32,
      userPreference: 78,
      totalUsage: 890,
    },
    {
      mood: 'sweet-angel',
      successRate: 82,
      avgResponseTime: 58,
      userPreference: 95,
      totalUsage: 1200,
    },
    {
      mood: 'gentle',
      successRate: 79,
      avgResponseTime: 62,
      userPreference: 88,
      totalUsage: 980,
    },
    {
      mood: 'anime-hero',
      successRate: 91,
      avgResponseTime: 38,
      userPreference: 85,
      totalUsage: 750,
    },
    {
      mood: 'savage-roast',
      successRate: 88,
      avgResponseTime: 41,
      userPreference: 73,
      totalUsage: 650,
    },
  ];

  const rewardMetrics: RewardMetrics[] = [
    { category: 'consistency', unlocked: 245, engagement: 89, satisfaction: 92 },
    { category: 'productivity', unlocked: 189, engagement: 85, satisfaction: 87 },
    { category: 'wellness', unlocked: 156, engagement: 92, satisfaction: 94 },
    { category: 'explorer', unlocked: 134, engagement: 78, satisfaction: 85 },
    { category: 'challenger', unlocked: 98, engagement: 95, satisfaction: 89 },
  ];

  const behavioralInsights: BehavioralInsight[] = [
    {
      type: 'pattern_discovery',
      count: 342,
      averageConfidence: 0.89,
      actionabilityRate: 0.73,
    },
    {
      type: 'anomaly_detection',
      count: 89,
      averageConfidence: 0.95,
      actionabilityRate: 0.91,
    },
    {
      type: 'optimization',
      count: 156,
      averageConfidence: 0.82,
      actionabilityRate: 0.67,
    },
    {
      type: 'prediction',
      count: 201,
      averageConfidence: 0.86,
      actionabilityRate: 0.58,
    },
    {
      type: 'intervention',
      count: 67,
      averageConfidence: 0.93,
      actionabilityRate: 0.89,
    },
  ];

  const aiMetrics: AIMetrics = {
    patternRecognitionAccuracy: 89.3,
    recommendationEngagementRate: 76.8,
    userSatisfactionScore: 87.2,
    voiceEffectivenessScore: 85.6,
    rewardsEngagementRate: 82.4,
    averageResponseTime: 1150,
    totalInsightsGenerated: 855,
    activeUsers: 2847,
  };

  return {
    last24Hours,
    serviceHealth,
    deploymentStatus,
    voiceAnalytics,
    rewardMetrics,
    behavioralInsights,
    aiMetrics,
  };
};

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const chartColors = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.warning,
  COLORS.danger,
  COLORS.success,
  COLORS.info,
];

export default function AIPerformanceDashboard() {
  const [data, setData] = useState(generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setData(generateMockData());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(generateMockData());
      setIsRefreshing(false);
    }, 1000);
  };

  const healthyServices = data.serviceHealth.filter(s => s.status === 'healthy').length;
  const totalServices = data.serviceHealth.length;
  const completedPhases = data.deploymentStatus.filter(
    p => p.status === 'completed'
  ).length;
  const totalPhases = data.deploymentStatus.length;

  const overallHealthScore = useMemo(() => {
    const serviceHealthScore = (healthyServices / totalServices) * 100;
    const deploymentScore = (completedPhases / totalPhases) * 100;
    const metricsScore =
      (data.aiMetrics.patternRecognitionAccuracy +
        data.aiMetrics.userSatisfactionScore +
        data.aiMetrics.voiceEffectivenessScore) /
      3;

    return Math.round((serviceHealthScore + deploymentScore + metricsScore) / 3);
  }, [healthyServices, totalServices, completedPhases, totalPhases, data.aiMetrics]);

  const StatusIcon = ({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) => {
    if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'degraded')
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'success';
      case 'degraded':
      case 'in_progress':
        return 'warning';
      case 'unhealthy':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Performance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and insights for all AI systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity
              className={`w-4 h-4 mr-2 ${autoRefresh ? 'text-green-500' : 'text-gray-500'}`}
            />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {overallHealthScore}%
              </div>
              <div className="text-sm text-muted-foreground">System Health Score</div>
              <Progress value={overallHealthScore} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                {healthyServices}/{totalServices}
              </div>
              <div className="text-sm text-muted-foreground">Services Healthy</div>
              <div className="flex gap-1">
                {data.serviceHealth.map((service, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy'
                        ? 'bg-green-500'
                        : service.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    title={service.serviceName}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                {completedPhases}/{totalPhases}
              </div>
              <div className="text-sm text-muted-foreground">Deployment Phases</div>
              <div className="flex gap-1">
                {data.deploymentStatus.map((phase, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      phase.status === 'completed'
                        ? 'bg-green-500'
                        : phase.status === 'in_progress'
                          ? 'bg-blue-500'
                          : phase.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                    }`}
                    title={`Phase ${phase.phase}: ${phase.name}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                {data.aiMetrics.activeUsers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+12.3% this week</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Pattern Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.aiMetrics.patternRecognitionAccuracy}%
            </div>
            <div className="text-xs text-muted-foreground">Accuracy Rate</div>
            <Progress
              value={data.aiMetrics.patternRecognitionAccuracy}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              Voice AI Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.aiMetrics.voiceEffectivenessScore}%
            </div>
            <div className="text-xs text-muted-foreground">User Success Rate</div>
            <Progress
              value={data.aiMetrics.voiceEffectivenessScore}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              Rewards Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.aiMetrics.rewardsEngagementRate}%
            </div>
            <div className="text-xs text-muted-foreground">User Engagement</div>
            <Progress
              value={data.aiMetrics.rewardsEngagementRate}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.aiMetrics.averageResponseTime}ms
            </div>
            <div className="text-xs text-muted-foreground">Average Response</div>
            <div className="flex items-center gap-1 text-green-600 mt-1">
              <TrendingDown className="w-3 h-3" />
              <span className="text-xs">-8% from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral AI</TabsTrigger>
          <TabsTrigger value="voice">Voice AI</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance Trends (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={data.last24Hours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={value =>
                        new Date(value).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={value => new Date(value).toLocaleString()}
                      formatter={(value: number, name: string) => [
                        `${Math.round(value)}${name.includes('Time') ? 'ms' : '%'}`,
                        name
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase()),
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Accuracy"
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      name="Engagement"
                    />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      name="Satisfaction"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Insights Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  AI Insights Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.behavioralInsights}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, value }) =>
                        `${name.replace(/_/g, ' ')}: ${value}`
                      }
                    >
                      {data.behavioralInsights.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle>Service Performance Warning</AlertTitle>
                  <AlertDescription>
                    AI Rewards System response time increased to 2.1s (threshold: 2.0s)
                  </AlertDescription>
                </Alert>
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Deployment In Progress</AlertTitle>
                  <AlertDescription>
                    Phase 4 (Dashboard & UI) is 85% complete - estimated completion in
                    15 minutes
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Health Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-4">
            {data.serviceHealth.map(service => (
              <Card key={service.serviceName}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={service.status} />
                      <div>
                        <div className="font-semibold">{service.serviceName}</div>
                        <div className="text-sm text-muted-foreground">
                          Last check: {service.lastCheck.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                      <div className="text-lg font-semibold">
                        {service.responseTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                      <div className="text-lg font-semibold">{service.errorRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                      <div className="text-lg font-semibold">{service.uptime}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Behavioral AI Tab */}
        <TabsContent value="behavioral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Insight Types & Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={data.behavioralInsights}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'averageConfidence'
                          ? `${Math.round(value * 100)}%`
                          : value,
                        name === 'averageConfidence' ? 'Avg Confidence' : 'Count',
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill={COLORS.primary} />
                    <Bar dataKey="averageConfidence" fill={COLORS.secondary} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actionability Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.behavioralInsights.map(insight => (
                    <div key={insight.type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">
                          {insight.type.replace(/_/g, ' ')}
                        </span>
                        <span>{Math.round(insight.actionabilityRate * 100)}%</span>
                      </div>
                      <Progress
                        value={insight.actionabilityRate * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.aiMetrics.totalInsightsGenerated}
                  </div>
                  <div className="text-sm text-blue-800">Total Insights Generated</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">73%</div>
                  <div className="text-sm text-green-800">
                    Average Actionability Rate
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-purple-800">
                    Average Confidence Score
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice AI Tab */}
        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Voice Mood Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={data.voiceAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mood" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="successRate"
                      fill={COLORS.primary}
                      name="Success Rate %"
                    />
                    <Bar
                      dataKey="userPreference"
                      fill={COLORS.secondary}
                      name="User Preference %"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.voiceAnalytics}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="totalUsage"
                      label={({ mood, value }) => `${mood}: ${value}`}
                    >
                      {data.voiceAnalytics.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Voice Mood Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Voice Mood</th>
                      <th className="text-center py-2">Success Rate</th>
                      <th className="text-center py-2">Avg Response Time</th>
                      <th className="text-center py-2">User Preference</th>
                      <th className="text-center py-2">Total Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.voiceAnalytics.map(voice => (
                      <tr key={voice.mood} className="border-b">
                        <td className="py-3 font-medium capitalize">
                          {voice.mood.replace('-', ' ')}
                        </td>
                        <td className="text-center">
                          <Badge
                            variant={voice.successRate > 85 ? 'default' : 'secondary'}
                          >
                            {voice.successRate}%
                          </Badge>
                        </td>
                        <td className="text-center">{voice.avgResponseTime}s</td>
                        <td className="text-center">{voice.userPreference}%</td>
                        <td className="text-center">
                          {voice.totalUsage.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward Categories Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={data.rewardMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="engagement"
                      fill={COLORS.primary}
                      name="Engagement %"
                    />
                    <Bar
                      dataKey="satisfaction"
                      fill={COLORS.secondary}
                      name="Satisfaction %"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rewards Unlocked by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.rewardMetrics}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="unlocked"
                      label={({ category, unlocked }) => `${category}: ${unlocked}`}
                    >
                      {data.rewardMetrics.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reward System Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.rewardMetrics.reduce((sum, r) => sum + r.unlocked, 0)}
                  </div>
                  <div className="text-sm text-yellow-800">Total Rewards Unlocked</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      data.rewardMetrics.reduce((sum, r) => sum + r.engagement, 0) /
                        data.rewardMetrics.length
                    )}
                    %
                  </div>
                  <div className="text-sm text-blue-800">Avg Engagement Rate</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(
                      data.rewardMetrics.reduce((sum, r) => sum + r.satisfaction, 0) /
                        data.rewardMetrics.length
                    )}
                    %
                  </div>
                  <div className="text-sm text-green-800">Avg Satisfaction</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-purple-800">Active Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
              <CardDescription>5-Phase AI system deployment progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.deploymentStatus.map(phase => (
                  <div
                    key={phase.phase}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">Phase {phase.phase}</div>
                      <div>
                        <div className="font-medium">{phase.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {phase.status === 'completed' &&
                            phase.completionTime &&
                            `Completed at ${phase.completionTime.toLocaleTimeString()}`}
                          {phase.status === 'in_progress' &&
                            phase.startTime &&
                            `Started at ${phase.startTime.toLocaleTimeString()}`}
                          {phase.status === 'pending' && 'Waiting for dependencies'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{phase.progress}%</div>
                        <Progress value={phase.progress} className="w-24 h-2" />
                      </div>
                      <Badge variant={getStatusColor(phase.status)}>
                        {phase.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phase Completion Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsBarChart data={data.deploymentStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="progress" fill={COLORS.primary} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completed Phases:</span>
                    <span className="font-semibold">
                      {completedPhases} / {totalPhases}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overall Progress:</span>
                    <span className="font-semibold">
                      {Math.round(
                        data.deploymentStatus.reduce((sum, p) => sum + p.progress, 0) /
                          totalPhases
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Phase:</span>
                    <span className="font-semibold">
                      {data.deploymentStatus.find(p => p.status === 'in_progress')
                        ?.name || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>System Status:</span>
                    <Badge
                      variant={completedPhases === totalPhases ? 'default' : 'warning'}
                    >
                      {completedPhases === totalPhases
                        ? 'Fully Deployed'
                        : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
