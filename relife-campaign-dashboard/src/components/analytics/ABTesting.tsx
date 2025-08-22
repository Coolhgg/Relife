import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Mail,
  MousePointer,
  Eye,
  AlertTriangle,
  CheckCircle,
  Zap,
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  type: 'subject_line' | 'content' | 'send_time' | 'sender_name';
  created_at: string;
  variants: {
    name: string;
    content: string;
    recipients: number;
    opens: number;
    clicks: number;
    conversions: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  }[];
  winner?: string;
  confidence?: number;
  lift?: number;
}

interface ABTestingProps {
  className?: string;
}

export function ABTesting({ className }: ABTestingProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'results'>(
    'overview'
  );
  const [newTestType, setNewTestType] = useState<
    'subject_line' | 'content' | 'send_time' | 'sender_name'
  >('subject_line');

  // Mock A/B test data
  const abTests: ABTest[] = [
    {
      id: 'test-1',
      name: 'Ben ROI Campaign - Subject Line Test',
      status: 'running',
      type: 'subject_line',
      created_at: '2024-08-10',
      variants: [
        {
          name: 'Control',
          content: 'Save 2 hours daily with smarter wake-ups',
          recipients: 450,
          opens: 153,
          clicks: 31,
          conversions: 8,
          open_rate: 34.0,
          click_rate: 6.9,
          conversion_rate: 1.8,
        },
        {
          name: 'Variant A',
          content: 'ROI Calculator: Your sleep is costing you $2,847/year',
          recipients: 442,
          opens: 178,
          clicks: 42,
          conversions: 14,
          open_rate: 40.3,
          click_rate: 9.5,
          conversion_rate: 3.2,
        },
      ],
      winner: 'Variant A',
      confidence: 87,
      lift: 18.5,
    },
    {
      id: 'test-2',
      name: 'Paula Premium Features - Content Test',
      status: 'completed',
      type: 'content',
      created_at: '2024-08-05',
      variants: [
        {
          name: 'Feature-focused',
          content: 'Advanced sleep analytics + AI optimization',
          recipients: 380,
          opens: 136,
          clicks: 28,
          conversions: 12,
          open_rate: 35.8,
          click_rate: 7.4,
          conversion_rate: 3.2,
        },
        {
          name: 'Benefit-focused',
          content: 'Wake up 15% more refreshed every morning',
          recipients: 375,
          opens: 143,
          clicks: 35,
          conversions: 18,
          open_rate: 38.1,
          click_rate: 9.3,
          conversion_rate: 4.8,
        },
      ],
      winner: 'Benefit-focused',
      confidence: 92,
      lift: 25.3,
    },
    {
      id: 'test-3',
      name: 'Sam Welcome Series - Send Time Test',
      status: 'draft',
      type: 'send_time',
      created_at: '2024-08-12',
      variants: [
        {
          name: '9 AM Send',
          content: 'Morning send time',
          recipients: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
        },
        {
          name: '7 PM Send',
          content: 'Evening send time',
          recipients: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
        },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getWinnerIndicator = (test: ABTest, variantIndex: number) => {
    if (!test.winner || test.status !== 'completed') return null;
    if (test.variants[variantIndex].name === test.winner) {
      return <Badge className="ml-2 bg-green-500 text-white">Winner</Badge>;
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              A/B Testing
            </CardTitle>
            <CardDescription>
              Optimize campaigns with data-driven experiments
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New A/B Test</DialogTitle>
                <DialogDescription>
                  Set up an experiment to optimize your email campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-name">Test Name</Label>
                    <Input
                      id="test-name"
                      placeholder="e.g. Subject Line Test - Ben Campaign"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-type">Test Type</Label>
                    <Select
                      value={newTestType}
                      onValueChange={(value: any) => setNewTestType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject_line">Subject Line</SelectItem>
                        <SelectItem value="content">Email Content</SelectItem>
                        <SelectItem value="send_time">Send Time</SelectItem>
                        <SelectItem value="sender_name">Sender Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="control">Control (A)</Label>
                    {newTestType === 'subject_line' && (
                      <Input id="control" placeholder="Original subject line" />
                    )}
                    {newTestType === 'content' && (
                      <Textarea
                        id="control"
                        placeholder="Original email content"
                        rows={3}
                      />
                    )}
                    {newTestType === 'send_time' && <Input id="control" type="time" />}
                    {newTestType === 'sender_name' && (
                      <Input id="control" placeholder="Original sender name" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="variant">Variant (B)</Label>
                    {newTestType === 'subject_line' && (
                      <Input id="variant" placeholder="Alternative subject line" />
                    )}
                    {newTestType === 'content' && (
                      <Textarea
                        id="variant"
                        placeholder="Alternative email content"
                        rows={3}
                      />
                    )}
                    {newTestType === 'send_time' && <Input id="variant" type="time" />}
                    {newTestType === 'sender_name' && (
                      <Input id="variant" placeholder="Alternative sender name" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="split">Traffic Split</Label>
                    <Select defaultValue="50-50">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50-50">50% / 50%</SelectItem>
                        <SelectItem value="70-30">70% / 30%</SelectItem>
                        <SelectItem value="80-20">80% / 20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      defaultValue="7"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confidence">Min. Confidence</Label>
                    <Select defaultValue="95">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Save as Draft</Button>
                  <Button>Start Test</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-blue-700">Active Tests</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">21.7%</div>
                <div className="text-sm text-green-700">Avg. Lift</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">89%</div>
                <div className="text-sm text-orange-700">Avg. Confidence</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">$4,200</div>
                <div className="text-sm text-purple-700">Revenue Impact</div>
              </div>
            </div>

            {/* Tests List */}
            <div className="space-y-4">
              {abTests.map(test => (
                <div key={test.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(test.status)} text-white`}>
                        {getStatusIcon(test.status)}
                        <span className="ml-1 capitalize">{test.status}</span>
                      </Badge>
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">
                          {test.type.replace('_', ' ')} • Created {test.created_at}
                        </p>
                      </div>
                    </div>
                    {test.status === 'completed' && test.winner && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Winner: {test.winner}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            +{test.lift}% lift ({test.confidence}% confidence)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variants Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {test.variants.map((variant, _index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{variant.name}</h5>
                          {getWinnerIndicator(test, index)}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {test.type === 'subject_line' && variant.content}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <Users className="h-3 w-3 mb-1" />
                            <div className="font-medium">{variant.recipients}</div>
                            <div className="text-gray-500">Recipients</div>
                          </div>
                          <div>
                            <Eye className="h-3 w-3 mb-1" />
                            <div className="font-medium">
                              {variant.open_rate.toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Open Rate</div>
                          </div>
                          <div>
                            <MousePointer className="h-3 w-3 mb-1" />
                            <div className="font-medium">
                              {variant.click_rate.toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Click Rate</div>
                          </div>
                          <div>
                            <BarChart3 className="h-3 w-3 mb-1" />
                            <div className="font-medium">
                              {variant.conversion_rate.toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Convert</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Detailed Results Coming Soon</h3>
              <p className="text-gray-600">
                Statistical significance testing, confidence intervals, and advanced
                analytics
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
