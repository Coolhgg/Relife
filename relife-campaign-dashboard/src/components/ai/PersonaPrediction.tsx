import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Select components removed - not used in this component
import {
  Brain,
  User,
  Users,
  Target,
  TrendingUp,
  Zap,
  RefreshCw,
  Mail,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface PersonaPrediction {
  persona: string;
  confidence: number;
  reasons: string[];
  recommendedCampaigns: string[];
}

interface UserData {
  id: string;
  email: string;
  signupDate: string;
  lastActiveDate: string;
  subscriptionStatus: string;
  featureUsage: Record<string, number>;
  engagementMetrics: {
    emailOpenRate: number;
    clickRate: number;
    appUsageMinutes: number;
  };
  demographics?: {
    ageRange?: string;
    location?: string;
    deviceType?: string;
  };
}

interface PersonaPredictionProps {
  className?: string;
}

export function PersonaPrediction({ className }: PersonaPredictionProps) {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [prediction, setPrediction] = useState<PersonaPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchPredictions, setBatchPredictions] = useState<
    Array<{ user: UserData; prediction: PersonaPrediction }>
  >([]);

  // Mock user data
  const mockUsers: UserData[] = [
    {
      id: 'user-1',
      email: 'alex.johnson@email.com',
      signupDate: '2024-07-15',
      lastActiveDate: '2024-08-14',
      subscriptionStatus: 'free',
      featureUsage: {
        basic_alarm: 45,
        snooze_count: 23,
        wake_time_analysis: 2,
      },
      engagementMetrics: {
        emailOpenRate: 25.4,
        clickRate: 3.2,
        appUsageMinutes: 142,
      },
      demographics: {
        ageRange: '22-29',
        location: 'New York, NY',
        deviceType: 'iPhone',
      },
    },
    {
      id: 'user-2',
      email: 'sarah.davis@company.com',
      signupDate: '2024-06-20',
      lastActiveDate: '2024-08-16',
      subscriptionStatus: 'professional',
      featureUsage: {
        basic_alarm: 156,
        smart_wake: 89,
        analytics_view: 34,
        team_features: 12,
      },
      engagementMetrics: {
        emailOpenRate: 47.8,
        clickRate: 12.1,
        appUsageMinutes: 320,
      },
      demographics: {
        ageRange: '30-39',
        location: 'San Francisco, CA',
        deviceType: 'iPhone',
      },
    },
    {
      id: 'user-3',
      email: 'mike.wilson@startup.io',
      signupDate: '2024-05-10',
      lastActiveDate: '2024-08-15',
      subscriptionStatus: 'premium',
      featureUsage: {
        basic_alarm: 234,
        smart_wake: 187,
        analytics_view: 67,
        advanced_settings: 23,
        api_access: 8,
      },
      engagementMetrics: {
        emailOpenRate: 52.3,
        clickRate: 18.7,
        appUsageMinutes: 485,
      },
      demographics: {
        ageRange: '25-35',
        location: 'Austin, TX',
        deviceType: 'Android',
      },
    },
  ];

  const personaProfiles = {
    struggling_sam: {
      name: 'Struggling Sam',
      description: 'Free tier user, inconsistent sleep patterns, needs motivation',
      color: 'bg-emerald-100 text-emerald-800',
      icon: '😴',
      characteristics: [
        'Free tier',
        'High snooze rate',
        'Inconsistent usage',
        'Needs encouragement',
      ],
    },
    busy_ben: {
      name: 'Busy Ben',
      description:
        'Time-conscious professional, ROI-focused, potential premium upgrade',
      color: 'bg-blue-100 text-blue-800',
      icon: '⏰',
      characteristics: [
        'Professional tier',
        'Time-efficient',
        'ROI-focused',
        'Quick decisions',
      ],
    },
    professional_paula: {
      name: 'Professional Paula',
      description: 'Power user, advanced features, premium subscriber, data-driven',
      color: 'bg-purple-100 text-purple-800',
      icon: '📊',
      characteristics: [
        'Premium tier',
        'High engagement',
        'Feature explorer',
        'Data-driven',
      ],
    },
    enterprise_emma: {
      name: 'Enterprise Emma',
      description: 'Decision maker, team features, enterprise needs',
      color: 'bg-indigo-100 text-indigo-800',
      icon: '🏢',
      characteristics: [
        'Team features',
        'Decision maker',
        'Enterprise scale',
        'Integration needs',
      ],
    },
    student_sarah: {
      name: 'Student Sarah',
      description: 'Budget-conscious, late-night usage, discount-sensitive',
      color: 'bg-amber-100 text-amber-800',
      icon: '🎓',
      characteristics: [
        'Budget-conscious',
        'Late-night usage',
        'Discount-sensitive',
        'Social features',
      ],
    },
    lifetime_larry: {
      name: 'Lifetime Larry',
      description: 'Long-term user, high engagement, brand advocate',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⭐',
      characteristics: [
        'Long-term user',
        'High loyalty',
        'Feature advocate',
        'Community leader',
      ],
    },
  };

  const predictPersona = async (userData: UserData): Promise<PersonaPrediction> => {
    setIsAnalyzing(true);

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock prediction logic based on user data
    let predictedPersona = 'struggling_sam';
    let confidence = 0.65;
    let reasons: string[] = [];
    let recommendedCampaigns: string[] = [];

    const { subscriptionStatus, featureUsage, engagementMetrics } = userData;
    const totalFeatureUsage = Object.values(featureUsage).reduce(
      (sum, usage) => sum + usage,
      0
    );

    if (subscriptionStatus === 'premium' && engagementMetrics.emailOpenRate > 45) {
      predictedPersona = 'professional_paula';
      confidence = 0.89;
      reasons = [
        'High email engagement (52.3% open rate)',
        'Premium subscription active',
        'Heavy feature usage (485+ minutes)',
        'Analytics viewing pattern indicates data-driven behavior',
      ];
      recommendedCampaigns = ['Feature Deep-Dive', 'Advanced Tips', 'Premium Benefits'];
    } else if (subscriptionStatus === 'professional' && featureUsage.team_features) {
      predictedPersona = 'busy_ben';
      confidence = 0.84;
      reasons = [
        'Professional subscription tier',
        'Team features usage indicates business context',
        'Moderate engagement shows time-conscious behavior',
        'Consistent app usage patterns',
      ];
      recommendedCampaigns = ['ROI Calculator', 'Time-Saving Tips', 'Upgrade Benefits'];
    } else if (totalFeatureUsage < 50 && engagementMetrics.emailOpenRate < 30) {
      predictedPersona = 'struggling_sam';
      confidence = 0.76;
      reasons = [
        'Low feature engagement suggests struggles with consistency',
        'Free tier with limited usage',
        'High snooze rate indicates wake-up difficulties',
        'Below-average email engagement',
      ];
      recommendedCampaigns = [
        'Motivation Series',
        'Getting Started Guide',
        'Success Stories',
      ];
    } else if (
      userData.demographics?.ageRange === '22-29' &&
      subscriptionStatus === 'free'
    ) {
      predictedPersona = 'student_sarah';
      confidence = 0.72;
      reasons = [
        'Age demographic matches student profile',
        'Free tier indicates budget consciousness',
        'Usage patterns suggest late-night schedule',
        'Price-sensitive behavior indicators',
      ];
      recommendedCampaigns = [
        'Student Discount',
        'Budget-Friendly Tips',
        'Social Features',
      ];
    }

    setIsAnalyzing(false);

    return {
      persona: predictedPersona,
      confidence,
      reasons,
      recommendedCampaigns,
    };
  };

  const handleAnalyzeUser = async (userData: UserData) => {
    setSelectedUser(userData);
    const result = await predictPersona(userData);
    setPrediction(result);
  };

  const handleBatchAnalysis = async () => {
    setIsAnalyzing(true);
    const results = [];

    for (const user of mockUsers) {
      const prediction = await predictPersona(user);
      results.push({ user, prediction });
    }

    setBatchPredictions(results);
    setIsAnalyzing(false);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Persona Prediction
              </CardTitle>
              <CardDescription>
                Use AI to automatically predict user personas based on behavior patterns
              </CardDescription>
            </div>
            <Button onClick={handleBatchAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Analyze All Users
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="individual" className="space-y-4">
            <TabsList>
              <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
              <TabsTrigger value="batch">Batch Results</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Select User to Analyze</h3>
                  <div className="space-y-2">
                    {mockUsers.map(user => (
                      <Card
                        key={user.id}
                        className={`cursor-pointer transition-colors ${
                          selectedUser?.id === user.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleAnalyzeUser(user)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-sm text-gray-600">
                                {user.subscriptionStatus} • Joined{' '}
                                {new Date(user.signupDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div>
                                Engagement:{' '}
                                {user.engagementMetrics.emailOpenRate.toFixed(1)}%
                              </div>
                              <div className="text-gray-500">
                                {user.engagementMetrics.appUsageMinutes}min usage
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Prediction Results */}
                <div className="space-y-4">
                  <h3 className="font-medium">AI Prediction Results</h3>

                  {isAnalyzing && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Brain className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-pulse" />
                        <div className="space-y-2">
                          <div className="font-medium">Analyzing user behavior...</div>
                          <div className="text-sm text-gray-600">
                            Processing engagement patterns, feature usage, and
                            subscription data
                          </div>
                          <Progress value={75} className="w-full mt-4" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {prediction && selectedUser && !isAnalyzing && (
                    <div className="space-y-4">
                      {/* Main Prediction */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center mb-4">
                            <div className="text-4xl mb-2">
                              {
                                personaProfiles[
                                  prediction.persona as keyof typeof personaProfiles
                                ]?.icon
                              }
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                              {
                                personaProfiles[
                                  prediction.persona as keyof typeof personaProfiles
                                ]?.name
                              }
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {
                                personaProfiles[
                                  prediction.persona as keyof typeof personaProfiles
                                ]?.description
                              }
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-sm font-medium">Confidence:</div>
                              <Badge variant="secondary" className="text-lg px-3 py-1">
                                {Math.round(prediction.confidence * 100)}%
                              </Badge>
                            </div>
                            <Progress
                              value={prediction.confidence * 100}
                              className="mt-2"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Reasoning */}
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Why this prediction?
                          </h4>
                          <ul className="space-y-2">
                            {prediction.reasons.map((reason, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                              >
                                <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Recommended Campaigns */}
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            Recommended Campaigns
                          </h4>
                          <div className="space-y-2">
                            {prediction.recommendedCampaigns.map((campaign, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <span className="text-sm font-medium">{campaign}</span>
                                <Button size="sm" variant="outline">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Create
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {!selectedUser && !isAnalyzing && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <User className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                        <div className="text-gray-500">
                          Select a user to begin AI persona analysis
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              {batchPredictions.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(personaProfiles).map(([key, profile]) => {
                      const count = batchPredictions.filter(
                        bp => bp.prediction.persona === key
                      ).length;
                      const percentage =
                        batchPredictions.length > 0
                          ? ((count / batchPredictions.length) * 100).toFixed(1)
                          : '0';

                      return (
                        <Card key={key}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-1">{profile.icon}</div>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-xs text-gray-600">{profile.name}</div>
                            <div className="text-xs text-gray-500">{percentage}%</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    {batchPredictions.map(({ user, prediction }, index) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-lg">
                                {
                                  personaProfiles[
                                    prediction.persona as keyof typeof personaProfiles
                                  ]?.icon
                                }
                              </div>
                              <div>
                                <div className="font-medium">{user.email}</div>
                                <div className="text-sm text-gray-600">
                                  {
                                    personaProfiles[
                                      prediction.persona as keyof typeof personaProfiles
                                    ]?.name
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                {Math.round(prediction.confidence * 100)}% confidence
                              </Badge>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    No batch analysis yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Run batch analysis to see persona predictions for all users
                  </p>
                  <Button onClick={handleBatchAnalysis}>
                    <Brain className="h-4 w-4 mr-2" />
                    Start Batch Analysis
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Prediction Accuracy
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Overall Accuracy</span>
                        <span className="font-medium">89.3%</span>
                      </div>
                      <Progress value={89.3} />
                      <div className="text-xs text-gray-600">
                        Based on 1,247 verified predictions
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      Model Performance
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>True Positives</span>
                        <span className="font-medium">847</span>
                      </div>
                      <div className="flex justify-between">
                        <span>False Positives</span>
                        <span className="font-medium">73</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence Threshold</span>
                        <span className="font-medium">75%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Key Success Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600 mb-2" />
                      <div className="font-medium text-green-900">
                        Engagement Patterns
                      </div>
                      <div className="text-sm text-green-700">
                        Email open rates and app usage time are strong indicators
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600 mb-2" />
                      <div className="font-medium text-blue-900">
                        Subscription Behavior
                      </div>
                      <div className="text-sm text-blue-700">
                        Tier choices and upgrade patterns reveal persona traits
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600 mb-2" />
                      <div className="font-medium text-purple-900">Usage Timing</div>
                      <div className="text-sm text-purple-700">
                        When and how users interact provides valuable insights
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
