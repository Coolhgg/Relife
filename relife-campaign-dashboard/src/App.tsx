import React, { useState } from 'react'; // auto: added missing React import
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users as _Users,
  Mail,
  TrendingUp,
  Settings,
  Target as _Target,
  Brain,
  Zap,
  ArrowUpRight,
  Send,
  Eye,
  MousePointer,
  CheckCircle as _CheckCircle,
} from 'lucide-react';

// Mock data for demonstrations
const personaData = {
  struggling_sam: { users: 2847, conversion: 12, color: 'bg-emerald-500' },
  busy_ben: { users: 1924, conversion: 28, color: 'bg-blue-500' },
  professional_paula: { users: 1435, conversion: 32, color: 'bg-purple-500' },
  enterprise_emma: { users: 287, conversion: 35, color: 'bg-indigo-500' },
  student_sarah: { users: 3561, conversion: 22, color: 'bg-amber-500' },
  lifetime_larry: { users: 194, conversion: 8, color: 'bg-yellow-500' },
};

const campaignMetrics = {
  total_sent: 45782,
  open_rate: 34.2,
  click_rate: 8.7,
  conversion_rate: 21.4,
  revenue: 127500,
};

const recentCampaigns = [
  {
    id: 1,
    name: 'Sam Welcome Series',
    status: 'active',
    sent: 1245,
    opens: 425,
    clicks: 87,
  },
  {
    id: 2,
    name: 'Ben ROI Campaign',
    status: 'completed',
    sent: 892,
    opens: 312,
    clicks: 98,
  },
  {
    id: 3,
    name: 'Paula Premium Features',
    status: 'draft',
    sent: 0,
    opens: 0,
    clicks: 0,
  },
  {
    id: 4,
    name: 'Emma Enterprise Demo',
    status: 'scheduled',
    sent: 156,
    opens: 67,
    clicks: 23,
  },
];

export default function CampaignDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold">Relife Campaign Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="personas">🧠 Micro-Personas</TabsTrigger>
            <TabsTrigger value="campaigns">📧 Campaign Manager</TabsTrigger>
            <TabsTrigger value="automation">⚡ Automation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Emails Sent
                  </CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaignMetrics.total_sent.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignMetrics.open_rate}%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% above industry avg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaignMetrics.click_rate}%
                  </div>
                  <p className="text-xs text-muted-foreground">+0.8% from last week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue Generated
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${campaignMetrics.revenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +18.2% conversion improvement
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>
                  Performance overview of your latest email campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                              variant={
                                campaign.status === 'active'
                                  ? 'default'
                                  : campaign.status === 'completed'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{campaign.sent}</div>
                          <div className="text-muted-foreground">Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{campaign.opens}</div>
                          <div className="text-muted-foreground">Opens</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{campaign.clicks}</div>
                          <div className="text-muted-foreground">Clicks</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Micro-Personas Tab */}
          <TabsContent value="personas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Enhanced Micro-Persona Analysis
                </CardTitle>
                <CardDescription>
                  Advanced behavioral segmentation and dynamic persona evolution
                  tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(personaData).map(([persona, data]) => (
                    <Card key={persona}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm capitalize">
                            {persona.replace('_', ' ')}
                          </CardTitle>
                          <div className={`w-3 h-3 rounded-full ${data.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Users</span>
                          <span className="font-medium">
                            {data.users.toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Conversion</span>
                            <span className="font-medium">{data.conversion}%</span>
                          </div>
                          <Progress value={data.conversion} className="h-2" />
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Behavioral Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Behavioral Patterns</CardTitle>
                  <CardDescription>
                    Real-time micro-segmentation insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium">Early Morning Engagers</h4>
                        <p className="text-sm text-muted-foreground">
                          Opens emails 6-8 AM
                        </p>
                      </div>
                      <Badge>2,341 users</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium">Weekend Browsers</h4>
                        <p className="text-sm text-muted-foreground">
                          High engagement Sat-Sun
                        </p>
                      </div>
                      <Badge>1,875 users</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium">Feature Explorers</h4>
                        <p className="text-sm text-muted-foreground">
                          Clicks multiple links per email
                        </p>
                      </div>
                      <Badge>956 users</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Persona Evolution</CardTitle>
                  <CardDescription>Dynamic segment transitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Sam → Ben</h4>
                        <p className="text-sm text-muted-foreground">
                          127 users upgraded persona
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Ben → Paula</h4>
                        <p className="text-sm text-muted-foreground">
                          89 users evolved to premium
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaign Manager Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Campaign Manager</h2>
                <p className="text-muted-foreground">
                  Create, manage, and optimize your email campaigns
                </p>
              </div>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>

            {/* Campaign Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Persona-Driven Templates</CardTitle>
                <CardDescription>
                  Pre-built campaigns optimized for each persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      persona: 'Struggling Sam',
                      template: 'Welcome Series',
                      emails: 5,
                      conversion: '12%',
                    },
                    {
                      persona: 'Busy Ben',
                      template: 'ROI Campaign',
                      emails: 7,
                      conversion: '28%',
                    },
                    {
                      persona: 'Professional Paula',
                      template: 'Feature Focus',
                      emails: 6,
                      conversion: '32%',
                    },
                    {
                      persona: 'Enterprise Emma',
                      template: 'B2B Sales',
                      emails: 3,
                      conversion: '35%',
                    },
                    {
                      persona: 'Student Sarah',
                      template: 'Discount Series',
                      emails: 4,
                      conversion: '22%',
                    },
                    {
                      persona: 'Lifetime Larry',
                      template: 'Value Proposition',
                      emails: 3,
                      conversion: '8%',
                    },
                  ].map((template, _index) => (
                    <Card
                      key={_index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{template.template}</CardTitle>
                        <CardDescription>{template.persona}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Emails</span>
                            <span>{template.emails}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Avg. Conversion
                            </span>
                            <span className="font-medium text-green-600">
                              {template.conversion}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Email Platform Integration & Automation
                </CardTitle>
                <CardDescription>
                  Connect with your email platforms and automate campaign workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { platform: 'ConvertKit', status: 'connected', campaigns: 24 },
                    { platform: 'Mailchimp', status: 'pending', campaigns: 0 },
                    {
                      platform: 'ActiveCampaign',
                      status: 'disconnected',
                      campaigns: 0,
                    },
                  ].map((platform, _index) => (
                    <Card key={_index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{platform.platform}</CardTitle>
                          <Badge
                            variant={
                              platform.status === 'connected'
                                ? 'default'
                                : platform.status === 'pending'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {platform.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            Active Campaigns: {platform.campaigns}
                          </div>
                          <Button
                            variant={
                              platform.status === 'connected' ? 'outline' : 'default'
                            }
                            size="sm"
                            className="w-full"
                          >
                            {platform.status === 'connected' ? 'Manage' : 'Connect'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Automation Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Active Automation Rules</CardTitle>
                <CardDescription>Intelligent triggers and workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Persona Detection',
                      description: 'Automatically tag users based on behavior patterns',
                      status: 'active',
                      triggered: 1247,
                    },
                    {
                      name: 'Upgrade Triggers',
                      description: 'Send premium campaigns when usage hits thresholds',
                      status: 'active',
                      triggered: 356,
                    },
                    {
                      name: 'Re-engagement',
                      description: 'Target inactive users with win-back campaigns',
                      status: 'paused',
                      triggered: 89,
                    },
                  ].map((rule, _index) => (
                    <div
                      key={_index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            rule.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                        />
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {rule.triggered} triggered
                        </div>
                        <Badge
                          variant={rule.status === 'active' ? 'default' : 'secondary'}
                        >
                          {rule.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
