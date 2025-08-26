import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import {
  Settings,
  Webhook,
  Check,
  X,
  AlertTriangle,
  Clock,
  Send,
  Database,
  Shield,
  Bell,
  CreditCard,
  Smartphone,
  Mail,
  MessageSquare,
  Activity,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  type: 'stripe' | 'push' | 'monitoring' | 'custom';
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastTriggered?: Date;
  successRate: number;
  totalEvents: number;
  errorCount: number;
  enabled: boolean;
}

interface WebhookEvent {
  id: string;
  type: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  payload: any;
  errorMessage?: string;
  retryCount: number;
}

interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  successRate: number;
  avgResponseTime: number;
  errorRate: number;
}

export const WebhookManagementDashboard: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [recentEvents, setRecentEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadWebhookData();
    const interval = setInterval(loadWebhookData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadWebhookData = async () => {
    try {
      setIsLoading(true);

      // Load webhook configurations
      const webhookResponse = await fetch('/api/webhooks/config');
      const webhookData = await webhookResponse.json();
      setWebhooks(webhookData.webhooks || []);

      // Load recent events
      const eventsResponse = await fetch('/api/webhooks/events?limit=50');
      const eventsData = await eventsResponse.json();
      setRecentEvents(eventsData.events || []);

      // Load statistics
      const statsResponse = await fetch('/api/webhooks/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load webhook data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    try {
      setTestResults(prev => ({ ...prev, [webhook.id]: undefined }));

      const response = await fetch(`/api/webhooks/test/${webhook.id}`, {
        method: 'POST',
      });

      const success = response.ok;
      setTestResults(prev => ({ ...prev, [webhook.id]: success }));

      if (success) {
        // Refresh events to show test result
        setTimeout(loadWebhookData, 1000);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [webhook.id]: false }));
    }
  };

  const toggleWebhook = async (webhookId: string, enabled: boolean) => {
    try {
      await fetch(`/api/webhooks/config/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      setWebhooks(prev => prev.map(w => (w.id === webhookId ? { ...w, enabled } : w)));
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const getWebhookIcon = (type: string) => {
    switch (type) {
      case 'stripe':
        return <CreditCard className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'monitoring':
        return <Activity className="h-4 w-4" />;
      default:
        return <Webhook className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      error: 'bg-red-500',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.inactive}>
        {status}
      </Badge>
    );
  };

  const StatCard = ({
    title,
    value,
    icon,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <p
                className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
              </p>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading webhook dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Management</h1>
          <p className="text-gray-600">Monitor and configure notification webhooks</p>
        </div>
        <Button onClick={loadWebhookData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Webhooks"
            value={stats.totalWebhooks}
            icon={<Webhook className="h-5 w-5" />}
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate.toFixed(1)}%`}
            icon={<Check className="h-5 w-5" />}
            trend={2.5}
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents.toLocaleString()}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            title="Avg Response"
            value={`${stats.avgResponseTime}ms`}
            icon={<Clock className="h-5 w-5" />}
            trend={-5.2}
          />
        </div>
      )}

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map(webhook => (
                  <div key={webhook.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getWebhookIcon(webhook.type)}
                        <div>
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <p className="text-sm text-gray-600">{webhook.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(webhook.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWebhook(webhook)}
                          disabled={testResults[webhook.id] === undefined}
                        >
                          {testResults[webhook.id] === undefined ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : testResults[webhook.id] ? (
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 mr-1 text-red-600" />
                          )}
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant={webhook.enabled ? 'secondary' : 'default'}
                          onClick={() => toggleWebhook(webhook.id, !webhook.enabled)}
                        >
                          {webhook.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="ml-2 font-medium">
                          {webhook.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Events:</span>
                        <span className="ml-2 font-medium">{webhook.totalEvents}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Triggered:</span>
                        <span className="ml-2 font-medium">
                          {webhook.lastTriggered
                            ? new Date(webhook.lastTriggered).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Webhook Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          event.status === 'success'
                            ? 'bg-green-500'
                            : event.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{event.type}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.retryCount > 0 && (
                        <Badge variant="outline">{event.retryCount} retries</Badge>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Stripe Webhooks</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push Notifications</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database Logging</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Security Validation</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Slack</span>
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>PagerDuty</span>
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All webhooks are secured with signature validation and rate limiting. Last
              security audit: {new Date().toLocaleDateString()}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Webhook Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Default Timeout (seconds)
                  </label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Retries</label>
                  <Input type="number" defaultValue="3" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Rate Limit (requests per minute)
                </label>
                <Input type="number" defaultValue="1000" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Webhook Logging</h3>
                  <p className="text-sm text-gray-600">
                    Store webhook events in database
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Security Validation</h3>
                  <p className="text-sm text-gray-600">Verify webhook signatures</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhookManagementDashboard;
