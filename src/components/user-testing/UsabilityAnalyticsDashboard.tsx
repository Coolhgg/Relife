import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Eye,
  MousePointer,
  Clock,
  Users,
  Star,
  Bug,
  TrendingUp,
  Activity,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  MessageSquare
} from 'lucide-react';
import UserTestingService, {
  UserTestSession,
  UsabilityEvent,
  UserFeedback,
  BugReport
} from '../../services/user-testing';

interface AnalyticsData {
  sessions: UserTestSession[];
  events: UsabilityEvent[];
  feedback: UserFeedback[];
  bugs: BugReport[];
}

interface SessionMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  totalEvents: number;
  averageEventsPerSession: number;
  uniqueUsers: number;
  bounceRate: number;
}

interface EventAnalytics {
  clicksByPage: Array<{ page: string; clicks: number }>;
  navigationFlow: Array<{ from: string; to: string; count: number }>;
  errorsByType: Array<{ type: string; count: number }>;
  performanceMetrics: Array<{ metric: string; avgValue: number }>;
}

interface FeedbackAnalytics {
  ratingDistribution: Array<{ rating: number; count: number }>;
  sentimentBreakdown: Array<{ sentiment: string; count: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
  priorityLevels: Array<{ priority: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function UsabilityAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    sessions: [],
    events: [],
    feedback: [],
    bugs: []
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  const userTestingService = UserTestingService.getInstance();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd fetch from your backend
      const sessions = [];
      const events = userTestingService.getEvents();
      const feedback = userTestingService.getFeedbacks();
      const bugs = userTestingService.getBugReports();

      setData({ sessions, events, feedback, bugs });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSessionMetrics = (): SessionMetrics => {
    const { sessions, events } = data;

    return {
      totalSessions: sessions.length,
      averageSessionDuration: sessions.length > 0
        ? sessions.reduce((sum, session) => {
            if (session.endTime) {
              return sum + (session.endTime.getTime() - session.startTime.getTime());
            }
            return sum;
          }, 0) / sessions.length / 1000 / 60 // Convert to minutes
        : 0,
      totalEvents: events.length,
      averageEventsPerSession: sessions.length > 0 ? events.length / sessions.length : 0,
      uniqueUsers: new Set(sessions.map(s => s.userId)).size,
      bounceRate: 0.15 // Mock value
    };
  };

  const calculateEventAnalytics = (): EventAnalytics => {
    const { events } = data;

    const clicksByPage = events
      .filter(e => e.type === 'click')
      .reduce((acc, event) => {
        const page = event.page || 'Unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const navigationFlow = events
      .filter(e => e.type === 'navigation')
      .reduce((acc, event) => {
        const key = `${event.metadata.fromPage || 'Unknown'} → ${event.page}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const errorsByType = events
      .filter(e => e.type === 'error')
      .reduce((acc, event) => {
        const errorType = event.metadata.error || 'Unknown';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      clicksByPage: Object.entries(clicksByPage).map(([page, clicks]) => ({ page, clicks })),
      navigationFlow: Object.entries(navigationFlow).map(([flow, count]) => {
        const [from, to] = flow.split(' → ');
        return { from, to, count };
      }),
      errorsByType: Object.entries(errorsByType).map(([type, count]) => ({ type, count })),
      performanceMetrics: [
        { metric: 'Page Load Time', avgValue: 1.2 },
        { metric: 'First Paint', avgValue: 0.8 },
        { metric: 'Time to Interactive', avgValue: 2.1 }
      ]
    };
  };

  const calculateFeedbackAnalytics = (): FeedbackAnalytics => {
    const { feedback } = data;

    const ratingDistribution = feedback
      .filter(f => f.rating)
      .reduce((acc, f) => {
        acc[f.rating!] = (acc[f.rating!] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const sentimentBreakdown = feedback
      .reduce((acc, f) => {
        acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const categoryBreakdown = feedback
      .reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const priorityLevels = feedback
      .reduce((acc, f) => {
        acc[f.priority] = (acc[f.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      ratingDistribution: Object.entries(ratingDistribution).map(([rating, count]) => ({
        rating: Number(rating),
        count
      })),
      sentimentBreakdown: Object.entries(sentimentBreakdown).map(([sentiment, count]) => ({
        sentiment,
        count
      })),
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, count]) => ({
        category,
        count
      })),
      priorityLevels: Object.entries(priorityLevels).map(([priority, count]) => ({
        priority,
        count
      }))
    };
  };

  const sessionMetrics = calculateSessionMetrics();
  const eventAnalytics = calculateEventAnalytics();
  const feedbackAnalytics = calculateFeedbackAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Testing Analytics</h2>
          <p className="text-gray-600 mt-1">
            Insights from user behavior and feedback data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionMetrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {sessionMetrics.uniqueUsers} unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionMetrics.averageSessionDuration.toFixed(1)}m
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionMetrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {sessionMetrics.averageEventsPerSession.toFixed(1)} per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Items</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.feedback.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.bugs.length} bug reports
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="behavior" className="space-y-4">
        <TabsList>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            User Behavior
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Feedback Analysis
          </TabsTrigger>
          <TabsTrigger value="bugs" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Bug Reports
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="w-5 h-5" />
                  Clicks by Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalytics.clicksByPage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventAnalytics.clicksByPage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="page" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-300 text-gray-500">
                    No click data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Error Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalytics.errorsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={eventAnalytics.errorsByType}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ type, count }) => `${type}: ${count}`}
                      >
                        {eventAnalytics.errorsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-300 text-gray-500">
                    No error data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackAnalytics.ratingDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={feedbackAnalytics.ratingDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-300 text-gray-500">
                    No rating data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackAnalytics.sentimentBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={feedbackAnalytics.sentimentBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ sentiment, count }) => `${sentiment}: ${count}`}
                      >
                        {feedbackAnalytics.sentimentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-300 text-gray-500">
                    No sentiment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {data.feedback.length > 0 ? (
                <div className="space-y-4">
                  {data.feedback.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{feedback.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            feedback.priority === 'critical' ? 'destructive' :
                            feedback.priority === 'high' ? 'destructive' :
                            feedback.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {feedback.priority}
                          </Badge>
                          {feedback.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{feedback.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{feedback.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {feedback.type}</span>
                        <span>Category: {feedback.category}</span>
                        <span>Sentiment: {feedback.sentiment}</span>
                        <span>{feedback.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No feedback data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bugs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bug Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {data.bugs.length > 0 ? (
                <div className="space-y-4">
                  {data.bugs.slice(0, 10).map((bug) => (
                    <div key={bug.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{bug.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            bug.severity === 'critical' ? 'destructive' :
                            bug.severity === 'high' ? 'destructive' :
                            bug.severity === 'medium' ? 'default' : 'secondary'
                          }>
                            {bug.severity}
                          </Badge>
                          <Badge variant="outline">
                            {bug.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{bug.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Frequency: {bug.frequency}</span>
                        <span>Reproducible: {bug.reproducible ? 'Yes' : 'No'}</span>
                        <span>Status: {bug.status}</span>
                        <span>{bug.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No bug reports available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventAnalytics.performanceMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventAnalytics.performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgValue" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-300 text-gray-500">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UsabilityAnalyticsDashboard;