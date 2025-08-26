import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Eye,
  Send,
  Smartphone,
  Monitor,
  Mail,
  Settings,
  Check,
  X,
  AlertTriangle,
  Clock,
  Users,
  Target,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  subject: string;
  preheader?: string;
  blocks: any[];
  styles: {
    backgroundColor: string;
    fontFamily: string;
    maxWidth: string;
  };
}

interface EmailPreviewProps {
  template: EmailTemplate;
  onSendTest?: (_emails: string[], _options: any) => void;
  className?: string;
}

interface PreviewTest {
  id: string;
  emails: string[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: string;
  results?: {
    delivered: number;
    bounced: number;
    opened: number;
  };
}

export function EmailPreview({ template, _onSendTest, _className }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmails, setTestEmails] = useState<string[]>(['']);
  const [testPersona, setTestPersona] = useState<string>('struggling_sam');
  const [testRecipientsCount, setTestRecipientsCount] = useState<number>(10);
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] =
    useState<boolean>(true);
  const [previewTests, setPreviewTests] = useState<PreviewTest[]>([
    {
      id: 'test-1',
      emails: ['john@relife.com', 'sarah@relife.com'],
      status: 'delivered',
      sentAt: '2024-08-16T10:30:00Z',
      results: { delivered: 2, bounced: 0, opened: 1 },
    },
    {
      id: 'test-2',
      emails: ['team@relife.com'],
      status: 'sent',
      sentAt: '2024-08-16T09:15:00Z',
      results: { delivered: 1, bounced: 0, opened: 0 },
    },
  ]);

  const addTestEmail = () => {
    setTestEmails([...testEmails, '']);
  };

  const removeTestEmail = (_index: number) => {
    setTestEmails(_testEmails.filter((_, _i) => i !== index));
  };

  const updateTestEmail = (_index: number, _value: string) => {
    const updated = [...testEmails];
    updated[index] = value;
    setTestEmails(updated);
  };

  const handleSendTest = () => {
    const validEmails = testEmails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length === 0) return;

    const testOptions = {
      persona: testPersona,
      personalization: isPersonalizationEnabled,
      recipientsCount: testRecipientsCount,
    };

    onSendTest?.(validEmails, testOptions);

    // Add to preview tests
    const newTest: PreviewTest = {
      id: `test-${Date.now()}`,
      emails: validEmails,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };
    setPreviewTests([newTest, ...previewTests]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Check className="h-4 w-4" />;
      case 'sent':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Mock persona data for personalization preview
  const personaData = {
    struggling_sam: {
      firstName: 'Sam',
      lastName: 'Johnson',
      signupDate: '2024-07-15',
      planType: 'Free',
      totalAlarms: 12,
      missedAlarms: 8,
    },
    busy_ben: {
      firstName: 'Ben',
      lastName: 'Williams',
      signupDate: '2024-06-20',
      planType: 'Professional',
      totalAlarms: 156,
      missedAlarms: 15,
    },
    professional_paula: {
      firstName: 'Paula',
      lastName: 'Davis',
      signupDate: '2024-05-10',
      planType: 'Premium',
      totalAlarms: 245,
      missedAlarms: 8,
    },
  };

  // Apply personalization to template content
  const personalizeContent = (content: string, persona: string): string => {
    if (!isPersonalizationEnabled) return content;

    const data = personaData[persona as keyof typeof personaData];
    if (!data) return content;

    return content
      .replace(/\{firstName\}/g, data.firstName)
      .replace(/\{lastName\}/g, data.lastName)
      .replace(/\{planType\}/g, data.planType)
      .replace(/\{totalAlarms\}/g, data.totalAlarms.toString())
      .replace(/\{missedAlarms\}/g, data.missedAlarms.toString());
  };

  const renderEmailContent = () => {
    // This would render the actual email content based on the template blocks
    // For now, we'll show a simplified preview
    return (
      <div
        className={`mx-auto bg-white shadow-lg ${
          viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
        }`}
        style={{
          backgroundColor: template.styles.backgroundColor,
          fontFamily: template.styles.fontFamily,
        }}
      >
        {/* Email Header */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              From: Relife Team &lt;hello@relife.com&gt;
            </span>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="text-lg font-semibold">
            {personalizeContent(template.subject, testPersona)}
          </div>
          {template.preheader && (
            <div className="text-sm text-gray-600 mt-1">
              {personalizeContent(template.preheader, testPersona)}
            </div>
          )}
        </div>

        {/* Email Body - Mock Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <img
                src="https://via.placeholder.com/150x50/6366f1/ffffff?text=Relife"
                alt="Relife Logo"
                className="mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold mb-2">
                {personalizeContent(`Hello {firstName}!`, testPersona)}
              </h1>
              <p className="text-gray-600">
                Welcome to your personalized sleep optimization journey
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">Your Sleep Stats</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Alarms:</span>
                  <span className="ml-2 font-medium">
                    {personalizeContent(`{totalAlarms}`, testPersona)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {Math.round(
                      (1 -
                        parseInt(personalizeContent(`{missedAlarms}`, testPersona)) /
                          parseInt(personalizeContent(`{totalAlarms}`, testPersona))) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="#"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Optimize My Sleep Schedule
              </a>
            </div>

            <div className="text-xs text-gray-500 text-center pt-6 border-t">
              <p>Relife Technologies • 123 Sleep Street, Dream City, DC 12345</p>
              <p className="mt-2">
                <a href="#" className="text-blue-600 hover:underline">
                  Unsubscribe
                </a>{' '}
                |{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Update Preferences
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (<div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview & Testing
              </CardTitle>
              <CardDescription>
                Preview your email and send test campaigns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
              <TabsTrigger value="test">Send Test</TabsTrigger>
              <TabsTrigger value="history">Test History</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              {/* Personalization Controls */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Label htmlFor="test-persona">Preview as:</Label>
                  <Select value={testPersona} onValueChange={setTestPersona}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="struggling_sam">Struggling Sam</SelectItem>
                      <SelectItem value="busy_ben">Busy Ben</SelectItem>
                      <SelectItem value="professional_paula">
                        Professional Paula
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="personalization"
                    checked={isPersonalizationEnabled}
                    onChange={e => setIsPersonalizationEnabled(e.target.checked)}
                  />
                  <Label htmlFor="personalization">Enable personalization</Label>
                </div>
              </div>

              {/* Email Preview */}
              <div className="p-4 bg-gray-100 rounded-lg">{renderEmailContent()}</div>

              {/* Email Analysis */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Subject Line</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Length: {template.subject.length} chars</div>
                      <div>
                        Score:{' '}
                        <span className="text-green-600 font-medium">85/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Mobile Ready</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>
                        Responsive:{' '}
                        <span className="text-green-600 font-medium">Yes</span>
                      </div>
                      <div>
                        Text size:{' '}
                        <span className="text-green-600 font-medium">Good</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Deliverability</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>
                        Spam risk:{' '}
                        <span className="text-green-600 font-medium">Low</span>
                      </div>
                      <div>
                        Links:{' '}
                        <span className="text-yellow-600 font-medium">3 found</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Test Recipients</h3>
                  {testEmails.map((email, _index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={e => updateTestEmail(index, e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTestEmail(index)}
                        disabled={testEmails.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addTestEmail}>
                    Add Email
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Test Settings</h3>
                  <div>
                    <Label htmlFor="test-persona-send">Send as Persona</Label>
                    <Select value={testPersona} onValueChange={setTestPersona}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="struggling_sam">Struggling Sam</SelectItem>
                        <SelectItem value="busy_ben">Busy Ben</SelectItem>
                        <SelectItem value="professional_paula">
                          Professional Paula
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="test-count">Recipients Sample Size</Label>
                    <Input
                      id="test-count"
                      type="number"
                      value={testRecipientsCount}
                      onChange={e => setTestRecipientsCount(parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="test-personalization"
                      checked={isPersonalizationEnabled}
                      onChange={e => setIsPersonalizationEnabled(e.target.checked)}
                    />
                    <Label htmlFor="test-personalization">Use personalization</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
                <Button onClick={handleSendTest}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {previewTests.map(test => (
                  <Card key={test.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(test.status)}>
                            {getStatusIcon(test.status)}
                            <span className="ml-1 capitalize">{test.status}</span>
                          </Badge>
                          <div>
                            <div className="text-sm font-medium">
                              {test.emails.join(', ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(test.sentAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {test.results && (
                          <div className="flex gap-4 text-xs">
                            <div className="text-center">
                              <div className="font-medium">
                                {test.results.delivered}
                              </div>
                              <div className="text-gray-500">Delivered</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{test.results.opened}</div>
                              <div className="text-gray-500">Opened</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{test.results.bounced}</div>
                              <div className="text-gray-500">Bounced</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {previewTests.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    No test emails sent yet
                  </h3>
                  <p className="text-gray-500">
                    Send test emails to see delivery and engagement results here
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
