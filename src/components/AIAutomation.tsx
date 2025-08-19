import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Avatar as _Avatar,
  AvatarFallback as _AvatarFallback,
} from "@/components/ui/avatar";
import {
  Brain,
  Zap,
  TrendingUp,
  Clock as _Clock,
  Target,
  Lightbulb,
  Settings,
  BarChart3,
  Moon,
  Sun as _Sun,
  Activity,
  Sparkles,
  Bot,
  AlertCircle as _AlertCircle,
  CheckCircle,
  ChevronRight as _ChevronRight,
  Play as _Play,
  Pause as _Pause,
  RotateCcw,
} from "lucide-react";
import type {
  User as UserType,
  AIOptimization,
  AIRecommendation,
  PersonalizedChallenge,
  SmartAutomation,
  SleepPattern,
  WakeUpBehavior,
} from "../types/index";

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
    id: "1",
    userId: "user1",
    type: "wake_time",
    suggestion:
      "Optimize your wake time to 15 minutes earlier for better sleep cycle alignment",
    confidence: 0.85,
    impact: "high",
    isEnabled: true,
    lastOptimized: new Date(Date.now() - 3600000),
    createdAt: new Date(),
  },
  {
    id: "2",
    userId: "user1",
    type: "difficulty_adjustment",
    suggestion:
      "Increase alarm difficulty based on improved performance metrics",
    confidence: 0.92,
    impact: "medium",
    isEnabled: true,
    lastOptimized: new Date(Date.now() - 7200000),
    createdAt: new Date(),
  },
];

const MOCK_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: "1",
    userId: "user1",
    category: "alarm",
    type: "wake_time",
    title: "Optimize Wake Time",
    description:
      "Based on your sleep patterns, waking up 15 minutes earlier will align better with your sleep cycles.",
    actionable: true,
    priority: "high",
    confidence: 0.87,
    estimatedBenefit: "Better sleep cycle alignment and 15% faster wake-up",
    implementationSteps: [
      "Adjust alarm 15 minutes earlier",
      "Monitor for 1 week",
      "Track wake-up quality",
    ],
    basedOn: [],
    impact: "high",
    action: "adjust_wake_time",
    appliedAt: new Date(Date.now() - 3600000),
    createdAt: new Date(),
  },
  {
    id: "2",
    userId: "user1",
    category: "challenge",
    type: "difficulty_adjustment",
    title: "Adaptive Difficulty",
    description:
      "Your morning performance suggests increasing challenge difficulty on weekdays for better engagement.",
    actionable: true,
    priority: "medium",
    confidence: 0.73,
    estimatedBenefit:
      "Better engagement and 20% improvement in morning routines",
    implementationSteps: [
      "Increase difficulty on weekdays",
      "Monitor performance",
      "Adjust if needed",
    ],
    basedOn: [],
    impact: "medium",
    action: "adjust_difficulty",
    createdAt: new Date(),
  },
  {
    id: "3",
    userId: "user1",
    category: "alarm",
    type: "wake_time",
    title: "Smart Sound Selection",
    description:
      "AI suggests using energetic sounds on cloudy days and gentle sounds on sunny mornings.",
    actionable: true,
    priority: "low",
    confidence: 0.65,
    estimatedBenefit:
      "Weather-based sound optimization for better wake-up experience",
    implementationSteps: [
      "Enable weather-based sounds",
      "Set preferences",
      "Track satisfaction",
    ],
    basedOn: [],
    impact: "low",
    action: "optimize_sounds",
    createdAt: new Date(),
  },
];

const MOCK_PERSONALIZED_CHALLENGES: PersonalizedChallenge[] = [
  {
    id: "1",
    userId: "user1",
    title: "Wake Early Challenge",
    description: "Gradually adjust your wake time to achieve earlier mornings",
    type: "habit_building",
    difficulty: "medium",
    duration: 30,
    personalizedFactors: [
      { type: "sleep_pattern", value: "night_owl", weight: 0.8 },
      { type: "motivation_style", value: "gradual_progress", weight: 0.6 },
    ],
    tasks: [],
    progress: {
      totalTasks: 30,
      completedTasks: 10,
      currentStreak: 5,
      longestStreak: 8,
      completionRate: 0.33,
      consistency: 0.75,
      engagement: 0.85,
      lastActivity: new Date(),
    },
    rewards: [],
    aiInsights: ["Strong improvement in morning consistency"],
    adaptations: [],
    status: "active",
    expectedSuccessRate: 0.8,
    personalizedFor: ["sleep_chronotype", "performance_history"],
    createdAt: new Date(),
  },
];

const MOCK_AUTOMATIONS: SmartAutomation[] = [
  {
    id: "1",
    userId: "user1",
    name: "Weather-Based Alarm Adjustment",
    type: "alarm_optimization",
    triggers: [
      {
        type: "external_api",
        parameters: { source: "weather", condition: "rain_probability" },
        sensitivity: 0.7,
      },
    ],
    actions: [
      {
        type: "adjust_alarm",
        parameters: { adjustment: -15 },
        priority: 1,
        reversible: true,
        delay: 0,
      },
    ],
    conditions: [
      {
        type: "weather",
        operator: "greater_than",
        value: 0.7,
        required: true,
      },
    ],
    isActive: true,
    learningEnabled: true,
    performanceMetrics: {
      totalTriggers: 12,
      successfulActions: 11,
      userOverrides: 1,
      averageResponseTime: 1.2,
      satisfactionScore: 8,
      lastEvaluated: new Date(),
    },
    lastTriggered: new Date(Date.now() - 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    isEnabled: true,
    description: "Automatically adjusts alarm time based on weather conditions",
    executionCount: 12,
    lastExecuted: new Date(Date.now() - 86400000),
  },
  {
    id: "2",
    userId: "user1",
    name: "Sleep Score Optimizer",
    type: "routine_adjustment",
    triggers: [
      {
        type: "performance",
        parameters: { metric: "sleep_quality", threshold: 6 },
        sensitivity: 0.8,
      },
    ],
    actions: [
      {
        type: "update_settings",
        parameters: { difficulty: "easy" },
        priority: 1,
        reversible: true,
      },
    ],
    conditions: [
      {
        type: "performance_threshold",
        operator: "less_than",
        value: 6,
        required: true,
      },
    ],
    isActive: true,
    learningEnabled: true,
    performanceMetrics: {
      totalTriggers: 5,
      successfulActions: 5,
      userOverrides: 0,
      averageResponseTime: 0.8,
      satisfactionScore: 9,
      lastEvaluated: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isEnabled: true,
    description: "Creates easier challenges after poor sleep nights",
    executionCount: 5,
  },
];

const MOCK_SLEEP_DATA: SleepPattern[] = [
  {
    id: "1",
    userId: "user1",
    date: "2024-01-19",
    bedTime: "23:15",
    wakeTime: "07:00",
    totalSleepHours: 7.75,
    sleepQuality: 8,
    interruptions: [],
    factors: [],
    mood: "refreshed",
    energyLevel: 8,
    source: "smart_alarm",
    sleepDuration: 465,
    sleepEfficiency: 0.89,
    deepSleepPercentage: 22,
    remSleepPercentage: 18,
    createdAt: new Date(),
  },
  {
    id: "2",
    userId: "user1",
    date: "2024-01-18",
    bedTime: "23:45",
    wakeTime: "07:15",
    totalSleepHours: 7.5,
    sleepQuality: 7,
    interruptions: [],
    factors: [],
    mood: "good",
    energyLevel: 7,
    source: "smart_alarm",
    sleepDuration: 450,
    sleepEfficiency: 0.85,
    deepSleepPercentage: 20,
    remSleepPercentage: 16,
    createdAt: new Date(),
  },
];

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return "text-green-600 bg-green-100";
  if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100";
  return "text-orange-600 bg-orange-100";
};

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case "high":
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    case "medium":
      return <BarChart3 className="h-4 w-4 text-yellow-500" />;
    case "low":
      return <Activity className="h-4 w-4 text-green-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

export function AIAutomation({
  currentUser: _currentUser,
  aiOptimizations = MOCK_AI_OPTIMIZATIONS,
  recommendations = MOCK_RECOMMENDATIONS,
  personalizedChallenges = MOCK_PERSONALIZED_CHALLENGES,
  automations = MOCK_AUTOMATIONS,
  sleepData = MOCK_SLEEP_DATA,
  wakeUpData: _wakeUpData = [],
  onApplyRecommendation,
  onToggleOptimization,
  onCreateAutomation,
  onToggleAutomation,
}: AIAutomationProps) {
  const [selectedTab, setSelectedTab] = useState("overview");

  const enabledOptimizations = aiOptimizations.filter((opt) => opt.isEnabled);
  const pendingRecommendations = recommendations.filter(
    (rec) => !rec.appliedAt,
  );
  const enabledAutomations = automations.filter((auto) => auto.isEnabled);

  const averageConfidence =
    aiOptimizations.reduce((sum, opt) => sum + opt.confidence, 0) /
    aiOptimizations.length;
  const totalAutomationExecutions = automations.reduce(
    (sum, auto) => sum + auto.executionCount,
    0,
  );

  return (
    <div className="space-y-6">
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
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
                    <p className="text-sm text-muted-foreground">
                      Learning and optimizing your wake-up experience
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-purple-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(averageConfidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    AI Confidence
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {enabledOptimizations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Active Features
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalAutomationExecutions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Auto Actions
                  </div>
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
                    <div className="text-lg font-bold">
                      {pendingRecommendations.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New Insights
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-500" />
                  <div>
                    <div className="text-lg font-bold">
                      {enabledAutomations.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Rules
                    </div>
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
                <div
                  key={optimization.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">
                        {optimization.type.replace("_", " ")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last optimized:{" "}
                        {optimization.lastOptimized
                          ? new Date(
                              optimization.lastOptimized,
                            ).toLocaleTimeString()
                          : "Never"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getConfidenceColor(optimization.confidence)}
                    >
                      {Math.round(optimization.confidence * 100)}%
                    </Badge>
                    <Switch
                      checked={optimization.isEnabled}
                      onCheckedChange={(checked) =>
                        onToggleOptimization?.(optimization.id, checked)
                      }
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
                      <div className="text-2xl font-bold text-blue-600">
                        {sleepData[0].sleepQuality}/10
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sleep Quality
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {sleepData[0].sleepDuration}h
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Duration
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sleep Efficiency</span>
                      <span>{sleepData[0].sleepEfficiency}%</span>
                    </div>
                    <Progress
                      value={sleepData[0].sleepEfficiency}
                      className="h-2"
                    />
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {recommendation.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={getConfidenceColor(recommendation.confidence)}
                    >
                      {Math.round(recommendation.confidence * 100)}% confident
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          recommendation.impact === "high"
                            ? "destructive"
                            : recommendation.impact === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {recommendation.impact} impact
                      </Badge>
                      {typeof recommendation.action === "object" &&
                        recommendation.action?.reversible && (
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
                        onClick={() =>
                          onApplyRecommendation?.(recommendation.id)
                        }
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
                  <p className="text-sm">
                    Check back later for new AI insights
                  </p>
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
                      <h3 className="font-medium capitalize">
                        {challenge.type.replace("_", " ")} Challenge
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        AI-generated based on your patterns
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(challenge.expectedSuccessRate * 100)}% success
                      rate
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Difficulty: {challenge.difficulty}
                      </Badge>
                      <Badge variant="outline">Generated by AI</Badge>
                    </div>

                    <div className="bg-muted/30 rounded p-3">
                      <h4 className="font-medium text-sm mb-2">
                        Personalization Factors:
                      </h4>
                      <div className="space-y-1">
                        {challenge.personalizedFactors.map((factor, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="capitalize">
                              {factor.type.replace("_", " ")}
                            </span>
                            <span className="text-muted-foreground">
                              {Math.round(factor.weight * 100)}% weight
                            </span>
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
                  onClick={() =>
                    onCreateAutomation?.({ name: "New Automation" })
                  }
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
                      <p className="text-sm text-muted-foreground">
                        {automation.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={automation.isEnabled ? "default" : "secondary"}
                      >
                        {automation.isEnabled ? "Active" : "Paused"}
                      </Badge>
                      <Switch
                        checked={automation.isEnabled}
                        onCheckedChange={(checked) =>
                          onToggleAutomation?.(automation.id, checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Triggers:</span>
                      <div className="mt-1">
                        {automation.triggers.map((trigger, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-1 mb-1"
                          >
                            {trigger.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actions:</span>
                      <div className="mt-1">
                        {automation.actions.map((action, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-1 mb-1"
                          >
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
                        <span>
                          {" "}
                          • Last:{" "}
                          {new Date(
                            automation.lastExecuted,
                          ).toLocaleDateString()}
                        </span>
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
