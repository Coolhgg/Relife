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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  RefreshCw,
  Copy,
  TrendingUp,
  Target,
  Eye,
  BarChart3,
  Zap,
  MessageSquare,
  Type,
  Wand2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  History,
  A,
} from 'lucide-react';

interface ContentOptimization {
  original: string;
  optimized: string;
  improvements: string[];
  score: number;
  tone: string;
  readability: number;
}

interface SubjectLineVariation {
  id: string;
  text: string;
  score: number;
  category: string;
  predictedPerformance: {
    openRate: number;
    clickRate: number;
  };
}

interface ContentOptimizationProps {
  className?: string;
}

export function ContentOptimization({ className }: ContentOptimizationProps) {
  const [subjectLine, setSubjectLine] = useState(
    'Save 2 hours daily with smarter wake-ups'
  );
  const [emailBody, setEmailBody] = useState(`Hi {firstName},

Are you tired of hitting snooze 5 times every morning?

Our users save an average of 2 hours daily by optimizing their wake-up routine with Relife's smart alarm features.

✅ Smart wake-up timing based on your sleep cycle
✅ Gradual volume increase for natural awakening
✅ Personalized morning routine suggestions

Ready to transform your mornings?`);

  const [selectedPersona, setSelectedPersona] = useState('busy_ben');
  const [optimizationGoal, setOptimizationGoal] = useState<
    'engagement' | 'conversion' | 'retention' | 'activation'
  >('conversion');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState<ContentOptimization | null>(
    null
  );
  const [subjectLineVariations, setSubjectLineVariations] = useState<
    SubjectLineVariation[]
  >([]);
  const [optimizationHistory, setOptimizationHistory] = useState<ContentOptimization[]>(
    []
  );

  const personas = [
    {
      value: 'struggling_sam',
      label: 'Struggling Sam',
      description: 'Needs motivation and encouragement',
    },
    {
      value: 'busy_ben',
      label: 'Busy Ben',
      description: 'Values time efficiency and ROI',
    },
    {
      value: 'professional_paula',
      label: 'Professional Paula',
      description: 'Data-driven, feature-focused',
    },
    {
      value: 'enterprise_emma',
      label: 'Enterprise Emma',
      description: 'Decision maker, team benefits',
    },
    {
      value: 'student_sarah',
      label: 'Student Sarah',
      description: 'Budget-conscious, casual tone',
    },
    {
      value: 'lifetime_larry',
      label: 'Lifetime Larry',
      description: 'Loyalty rewards, exclusive benefits',
    },
  ];

  const generateSubjectLineVariations = async () => {
    setIsOptimizing(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const variations: SubjectLineVariation[] = [
      {
        id: 'var-1',
        text: 'ROI Calculator: Your sleep is costing you $2,847/year',
        score: 92,
        category: 'Urgency + Value',
        predictedPerformance: { openRate: 42.3, clickRate: 8.9 },
      },
      {
        id: 'var-2',
        text: 'Ben, stop losing 2 hours every morning (5-min fix inside)',
        score: 88,
        category: 'Personalized + Solution',
        predictedPerformance: { openRate: 39.7, clickRate: 7.2 },
      },
      {
        id: 'var-3',
        text: 'The $47 productivity hack successful professionals swear by',
        score: 85,
        category: 'Social Proof + Value',
        predictedPerformance: { openRate: 37.4, clickRate: 6.8 },
      },
      {
        id: 'var-4',
        text: '2-hour morning routine → 15-minute power start',
        score: 82,
        category: 'Transformation + Benefit',
        predictedPerformance: { openRate: 35.1, clickRate: 6.2 },
      },
    ];

    setSubjectLineVariations(variations);
    setIsOptimizing(false);
  };

  const optimizeContent = async () => {
    setIsOptimizing(true);

    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 3000));

    const optimization: ContentOptimization = {
      original: subjectLine,
      optimized:
        selectedPersona === 'busy_ben'
          ? 'ROI Alert: Your inefficient mornings are costing you $156/week'
          : selectedPersona === 'struggling_sam'
            ? "Sam, you're not broken - your alarm is (here's the fix)"
            : 'Transform your mornings in just 3 minutes (data inside)',
      improvements: [
        'Added personalization with recipient name',
        'Included specific monetary value for ROI focus',
        'Shortened subject line for mobile optimization',
        'Added urgency indicator for better open rates',
        'Aligned tone with persona preference (professional/direct)',
      ],
      score: 89,
      tone:
        selectedPersona === 'busy_ben'
          ? 'Professional & Direct'
          : 'Encouraging & Supportive',
      readability: 8.2,
    };

    setOptimizedContent(optimization);
    setOptimizationHistory([optimization, ...optimizationHistory]);
    setIsOptimizing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Content Optimization
              </CardTitle>
              <CardDescription>
                Optimize email content with AI for better engagement and conversions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateSubjectLineVariations}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Variations
              </Button>
              <Button onClick={optimizeContent} disabled={isOptimizing}>
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Optimize Content
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="optimize" className="space-y-4">
            <TabsList>
              <TabsTrigger value="optimize">Content Optimizer</TabsTrigger>
              <TabsTrigger value="variations">Subject Line A/B</TabsTrigger>
              <TabsTrigger value="history">Optimization History</TabsTrigger>
            </TabsList>

            <TabsContent value="optimize" className="space-y-6">
              {/* Input Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="persona-select">Target Persona</Label>
                    <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map(persona => (
                          <SelectItem key={persona.value} value={persona.value}>
                            <div>
                              <div className="font-medium">{persona.label}</div>
                              <div className="text-xs text-gray-500">
                                {persona.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="goal-select">Optimization Goal</Label>
                    <Select
                      value={optimizationGoal}
                      onValueChange={(value: any) => setOptimizationGoal(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="conversion">Conversion</SelectItem>
                        <SelectItem value="retention">Retention</SelectItem>
                        <SelectItem value="activation">Activation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject-line">Subject Line</Label>
                    <Input
                      id="subject-line"
                      value={subjectLine}
                      onChange={e => setSubjectLine(e.target.value)}
                      placeholder="Enter your subject line..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {subjectLine.length} characters
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email-body">Email Body</Label>
                    <Textarea
                      id="email-body"
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      rows={8}
                      placeholder="Enter your email content..."
                    />
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  {isOptimizing && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-pulse" />
                        <div className="space-y-2">
                          <div className="font-medium">
                            AI is optimizing your content...
                          </div>
                          <div className="text-sm text-gray-600">
                            Analyzing persona preferences, A/B test data, and engagement
                            patterns
                          </div>
                          <Progress value={75} className="w-full mt-4" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {optimizedContent && !isOptimizing && (
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">Optimized Subject Line</h3>
                            <Badge
                              className={`px-2 py-1 ${getScoreColor(optimizedContent.score)}`}
                            >
                              {optimizedContent.score}/100
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div className="p-3 bg-red-50 rounded border">
                              <div className="text-xs text-red-600 font-medium mb-1">
                                ORIGINAL
                              </div>
                              <div className="text-sm">{optimizedContent.original}</div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />

                            <div className="p-3 bg-green-50 rounded border">
                              <div className="text-xs text-green-600 font-medium mb-1 flex items-center justify-between">
                                OPTIMIZED
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(optimizedContent.optimized)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-sm font-medium">
                                {optimizedContent.optimized}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3">Analysis & Improvements</h4>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-50 rounded">
                              <div className="text-lg font-bold text-blue-600">
                                {optimizedContent.tone}
                              </div>
                              <div className="text-xs text-blue-700">Tone Match</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded">
                              <div className="text-lg font-bold text-green-600">
                                {optimizedContent.readability}/10
                              </div>
                              <div className="text-xs text-green-700">Readability</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">
                              Key Improvements:
                            </div>
                            {optimizedContent.improvements.map((improvement, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{improvement}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(optimizedContent.optimized)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Use This Version
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setOptimizedContent(null)}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {!optimizedContent && !isOptimizing && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                        <div className="text-gray-500 mb-4">
                          Click "Optimize Content" to improve your email with AI
                        </div>
                        <div className="text-xs text-gray-400">
                          AI will analyze your content for persona fit, engagement
                          potential, and conversion optimization
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variations" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Subject Line Variations</h3>
                  <p className="text-sm text-gray-600">
                    AI-generated alternatives for A/B testing
                  </p>
                </div>
                <Button onClick={generateSubjectLineVariations} disabled={isOptimizing}>
                  {isOptimizing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Generate New
                </Button>
              </div>

              {subjectLineVariations.length > 0 ? (
                <div className="space-y-3">
                  {subjectLineVariations.map((variation, _index) => (
                    <Card key={variation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getScoreColor(variation.score)}
                            >
                              {variation.score}/100
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {variation.category}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(variation.text)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-sm font-medium mb-3">{variation.text}</div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span>
                              Predicted Open: {variation.predictedPerformance.openRate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-green-500" />
                            <span>
                              Predicted Click:{' '}
                              {variation.predictedPerformance.clickRate}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <A className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    No variations generated yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Generate AI-powered subject line alternatives for A/B testing
                  </p>
                  <Button onClick={generateSubjectLineVariations}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Variations
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {optimizationHistory.length > 0 ? (
                <div className="space-y-3">
                  {optimizationHistory.map((opt, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">
                            Optimization #{index + 1}
                          </div>
                          <Badge className={getScoreColor(opt.score)}>
                            {opt.score}/100
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {opt.optimized}
                        </div>
                        <div className="text-xs text-gray-500">
                          {opt.tone} tone • {opt.readability}/10 readability
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    No optimization history
                  </h3>
                  <p className="text-gray-500">
                    Your content optimizations will appear here
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
