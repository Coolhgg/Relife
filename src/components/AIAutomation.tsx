import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Brain,
  Zap,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  Settings,
  BarChart3,
  Moon,
  Sun,
  Activity,
  Sparkles,
  Bot,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import type { 
  User as UserType,
  AIOptimization,
  AIRecommendation,
  PersonalizedChallenge,
  SmartAutomation,
  SleepPattern,
  WakeUpBehavior
} from '../types/index';

interface AIAutomationProps {
  currentUser: UserType;
  aiOptimizations: AIOptimization[];
  recommendations: AIRecommendation[];
  personalizedChallenges: PersonalizedChallenge[];
  automations: SmartAutomation[];
  sleepData: SleepPattern[];
  wakeUpData: WakeUpBehavior[];
  onApplyRecommendation?: (recommendationId: string) => void;
  onToggleOptimization?: (optimizationId: string, enabled: boolean) => void;
  onCreateAutomation?: (automation: Partial<SmartAutomation>) => void;
  onToggleAutomation?: (automationId: string, enabled: boolean) => void;
}

// Mock data for AI & Automation
const MOCK_AI_OPTIMIZATIONS: AIOptimization[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'wake_time',
    isEnabled: true,
    confidence: 0.85,
    recommendations: [],
    learningData: {
      sleepPatterns: [],
      wakeUpBehavior: [],
      battlePerformance: [],
      userPreferences: [],
      contextualFactors: []
    },
    lastOptimized: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    userId: 'user1',
    type: 'difficulty',
    isEnabled: true,
    confidence: 0.92,
    recommendations: [],
    learningData: {
      sleepPatterns: [],
      wakeUpBehavior: [],
      battlePerformance: [],
      userPreferences: [],
      contextualFactors: []
    },
    lastOptimized: new Date(Date.now() - 7200000).toISOString()
  }
];

const MOCK_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: '1',
    type: 'wake_time',
    title: 'Optimize Wake Time',
    description: 'Based on your sleep patterns, waking up 15 minutes earlier will align better with your sleep cycles.',
    confidence: 0.87,
    impact: 'high',
    action: {
      type: 'adjust_time',
      parameters: { adjustment: -15 },
      reversible: true
    }
  },
  {
    id: '2',
    type: 'difficulty',
    title: 'Adaptive Difficulty',
    description: 'Your morning performance suggests increasing challenge difficulty on weekdays for better engagement.',
    confidence: 0.73,
    impact: 'medium',
    action: {
      type: 'change_difficulty',
      parameters: { newDifficulty: 'hard', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      reversible: true
    }
  },
  {
    id: '3',
    type: 'sound_selection',
    title: 'Smart Sound Selection',
    description: 'AI suggests using energetic sounds on cloudy days and gentle sounds on sunny mornings.',
    confidence: 0.65,
    impact: 'low',
    action: {
      type: 'suggest_sound',
      parameters: { weatherBased: true, cloudySound: 'energetic', sunnySound: 'gentle' },
      reversible: true
    }
  }
];

const MOCK_PERSONALIZED_CHALLENGES: PersonalizedChallenge[] = [
  {
    id: '1',
    userId: 'user1',
    generatedBy: 'ai',
    difficulty: 'medium',
    type: 'wake_early',
    adaptiveElements: [
      {
        type: 'dynamic_difficulty',
        parameters: { baseDifficulty: 'medium', adjustmentFactor: 0.1 },
        adaptationRule: {
          trigger: 'success_rate',
          condition: 'greater_than_80_percent',
          action: 'increase_difficulty',
          parameters: { increment: 0.1 }
        }
      }
    ],
    personalizedFor: [
      { type: 'sleep_chronotype', value: 'morning_person', weight: 0.8 },
      { type: 'performance_history', value: 'high_morning_performance', weight: 0.7 }
    ],
    expectedSuccessRate: 0.78,
    createdAt: new Date().toISOString()
  }
];

const MOCK_AUTOMATIONS: SmartAutomation[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Weather-Based Alarm Adjustment',
    description: 'Automatically adjusts alarm time based on weather conditions',
    isEnabled: true,
    triggers: [
      { type: 'weather', condition: 'rain_probability', value: 0.7 }
    ],
    actions: [
      { type: 'adjust_alarm', parameters: { adjustment: -15 }, delay: 0 }
    ],
    conditions: [
      {
        type: 'and',
        rules: [
          { field: 'weather.rain_probability', operator: 'greater_than', value: 0.7 },
          { field: 'time', operator: 'equals', value: '21:00' }
        ]
      }
    ],
    lastExecuted: new Date(Date.now() - 86400000).toISOString(),
    executionCount: 12
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Sleep Score Optimizer',
    description: 'Creates easier challenges after poor sleep nights',
    isEnabled: true,
    triggers: [
      { type: 'sleep_score', condition: 'less_than', value: 6 }
    ],
    actions: [
      { type: 'update_setting', parameters: { difficulty: 'easy' }, delay: 0 }
    ],
    conditions: [
      {
        type: 'and',
        rules: [
          { field: 'sleep.quality', operator: 'less_than', value: 6 }
        ]
      }
    ],
    executionCount: 5
  }
];

const MOCK_SLEEP_DATA: SleepPattern[] = [
  {
    date: '2024-01-19',
    bedTime: '23:15',
    wakeTime: '07:00',
    sleepQuality: 8,
    sleepDuration: 7.75,
    sleepEfficiency: 89,
    deepSleepPercentage: 22,
    remSleepPercentage: 18
  },
  {
    date: '2024-01-18',
    bedTime: '23:45',
    wakeTime: '07:15',
    sleepQuality: 7,
    sleepDuration: 7.5,
    sleepEfficiency: 85,
    deepSleepPercentage: 20,
    remSleepPercentage: 16
  }
];

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600 bg-green-100';
  if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
  return 'text-orange-600 bg-orange-100';
};

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case 'high': return <TrendingUp className="h-4 w-4 text-red-500" />;
    case 'medium': return <BarChart3 className="h-4 w-4 text-yellow-500" />;
    case 'low': return <Activity className="h-4 w-4 text-green-500" />;
    default: return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

export function AIAutomation({
  currentUser,
  aiOptimizations = MOCK_AI_OPTIMIZATIONS,
  recommendations = MOCK_RECOMMENDATIONS,
  personalizedChallenges = MOCK_PERSONALIZED_CHALLENGES,
  automations = MOCK_AUTOMATIONS,
  sleepData = MOCK_SLEEP_DATA,
  wakeUpData = [],
  onApplyRecommendation,
  onToggleOptimization,
  onCreateAutomation,
  onToggleAutomation
}: AIAutomationProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  const enabledOptimizations = aiOptimizations.filter(opt => opt.isEnabled);
  const pendingRecommendations = recommendations.filter(rec => !rec.appliedAt);
  const enabledAutomations = automations.filter(auto => auto.isEnabled);

  const averageConfidence = aiOptimizations.reduce((sum, opt) => sum + opt.confidence, 0) / aiOptimizations.length;
  const totalAutomationExecutions = automations.reduce((sum, auto) => sum + auto.executionCount, 0);

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
          <TabsTrigger value="challenges">Smart Tasks</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* AI Status Overview */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Assistant</h2>
                    <p className="text-sm text-muted-foreground">Learning and optimizing your wake-up experience</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-purple-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{Math.round(averageConfidence * 100)}%</div>
                  <div className="text-sm text-muted-foreground">AI Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{enabledOptimizations.length}</div>
                  <div className="text-sm text-muted-foreground">Active Features</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{totalAutomationExecutions}</div>
                  <div className="text-sm text-muted-foreground">Auto Actions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                  <div>
                    <div className="text-lg font-bold">{pendingRecommendations.length}</div>
                    <div className="text-sm text-muted-foreground">New Insights</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-500" />
                  <div>
                    <div className="text-lg font-bold">{enabledAutomations.length}</div>
                    <div className="text-sm text-muted-foreground">Active Rules</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Optimizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Active AI Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enabledOptimizations.map((optimization) => (
                <div key={optimization.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{optimization.type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        Last optimized: {new Date(optimization.lastOptimized).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getConfidenceColor(optimization.confidence)}>
                      {Math.round(optimization.confidence * 100)}%
                    </Badge>
                    <Switch 
                      checked={optimization.isEnabled}
                      onCheckedChange={(checked) => onToggleOptimization?.(optimization.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Sleep Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Sleep Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sleepData.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{sleepData[0].sleepQuality}/10</div>
                      <div className="text-sm text-muted-foreground">Sleep Quality</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{sleepData[0].sleepDuration}h</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sleep Efficiency</span>
                      <span>{sleepData[0].sleepEfficiency}%</span>
                    </div>
                    <Progress value={sleepData[0].sleepEfficiency} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Moon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Connect a sleep tracker to see AI insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-full mt-1">
                        {getImpactIcon(recommendation.impact)}
                      </div>
                      <div>
                        <h3 className="font-medium">{recommendation.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
                      </div>
                    </div>
                    <Badge className={getConfidenceColor(recommendation.confidence)}>
                      {Math.round(recommendation.confidence * 100)}% confident
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={recommendation.impact === 'high' ? 'destructive' : recommendation.impact === 'medium' ? 'default' : 'secondary'}>
                        {recommendation.impact} impact
                      </Badge>
                      {recommendation.action.reversible && (
                        <Badge variant="outline">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reversible
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Learn More
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => onApplyRecommendation?.(recommendation.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingRecommendations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All caught up!</p>
                  <p className="text-sm">Check back later for new AI insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalized Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalizedChallenges.map((challenge) => (
                <div key={challenge.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium capitalize">{challenge.type.replace('_', ' ')} Challenge</h3>
                      <p className="text-sm text-muted-foreground">
                        AI-generated based on your patterns
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(challenge.expectedSuccessRate * 100)}% success rate
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Difficulty: {challenge.difficulty}</Badge>
                      <Badge variant="outline">Generated by AI</Badge>
                    </div>
                    
                    <div className="bg-muted/30 rounded p-3">
                      <h4 className="font-medium text-sm mb-2">Personalization Factors:</h4>
                      <div className="space-y-1">
                        {challenge.personalizedFor.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{factor.type.replace('_', ' ')}</span>
                            <span className="text-muted-foreground">{Math.round(factor.weight * 100)}% weight</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Smart Automations
                </span>
                <Button 
                  size="sm"
                  onClick={() => onCreateAutomation?.({ name: 'New Automation' })}
                >
                  Create Rule
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automations.map((automation) => (
                <div key={automation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{automation.name}</h3>
                      <p className="text-sm text-muted-foreground">{automation.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={automation.isEnabled ? 'default' : 'secondary'}>
                        {automation.isEnabled ? 'Active' : 'Paused'}
                      </Badge>
                      <Switch 
                        checked={automation.isEnabled}
                        onCheckedChange={(checked) => onToggleAutomation?.(automation.id, checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Triggers:</span>
                      <div className="mt-1">
                        {automation.triggers.map((trigger, index) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {trigger.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actions:</span>
                      <div className="mt-1">
                        {automation.actions.map((action, index) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {action.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Executed {automation.executionCount} times
                      {automation.lastExecuted && (
                        <span> • Last: {new Date(automation.lastExecuted).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIAutomation;