/**
 * Enhanced Behavioral Intelligence Dashboard
 * Comprehensive dashboard displaying advanced AI behavior analysis, insights, and recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Zap,
  Shield,
  Users,
  Calendar,
  Cloud,
  Activity,
} from 'lucide-react';
import AdvancedBehavioralIntelligence from '../services/advanced-behavioral-intelligence';
import EnhancedRecommendationEngine from '../services/enhanced-recommendation-engine';
import CrossPlatformIntegration from '../services/cross-platform-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface BehavioralIntelligenceDashboardProps {
  userId: string;
  alarms: unknown[];
  alarmEvents: unknown[];
  className?: string;
}

interface PsychologicalProfile {
  bigFiveTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  motivationalFactors: {
    achievement: number;
    autonomy: number;
    mastery: number;
    purpose: number;
    social: number;
  };
  chronotype: string;
  stressResponse: string;
  changeAdaptability: string;
  confidence: number;
}

interface BehavioralInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionability: 'immediate' | 'short_term' | 'long_term';
  personalizedMessage: string;
  suggestedActions: Array<{
    action: string;
    impact: string;
    difficulty: string;
    timeframe: string;
  }>;
}

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const TYPE_ICONS = {
  pattern_discovery: Brain,
  anomaly_detection: Shield,
  optimization: Target,
  intervention: Activity,
  prediction: TrendingUp,
};

export const EnhancedBehavioralIntelligenceDashboard: React.FC<
  BehavioralIntelligenceDashboardProps
> = ({ userId, alarms, alarmEvents, className = '' }) => {
  const [analysisData, setAnalysisData] = useState<unknown>(null);
  const [recommendations, setRecommendations] = useState<unknown[]>([]);
  const [crossPlatformData, setCrossPlatformData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedInsight, setSelectedInsight] = useState<BehavioralInsight | null>(
    null
  );

  // Fetch comprehensive behavioral analysis data
  useEffect(() => {
    const fetchBehavioralData = async () => {
      setLoading(true);
      try {
        const behavioralIntelligence = AdvancedBehavioralIntelligence.getInstance();
        const recommendationEngine = EnhancedRecommendationEngine.getInstance();
        const crossPlatform = CrossPlatformIntegration.getInstance();

        // Get cross-platform data first
        const platformData = await crossPlatform.getCrossPlatformData(userId);
        setCrossPlatformData(platformData);

        // Generate comprehensive behavioral analysis
        const analysis =
          await behavioralIntelligence.generateAdvancedBehavioralAnalysis(
            userId,
            alarms,
            alarmEvents,
            platformData || undefined
          );
        setAnalysisData(analysis);

        // Generate personalized recommendations
        const recsResult =
          await recommendationEngine.generatePersonalizedRecommendations(
            userId,
            alarms,
            alarmEvents
          );
        setRecommendations(recsResult.recommendations);
      } catch (error) {
        console.error('Failed to fetch behavioral data:', error);
        // Set mock data for development
        setAnalysisData(generateMockAnalysisData());
        setRecommendations(generateMockRecommendations());
      } finally {
        setLoading(false);
      }
    };

    fetchBehavioralData();
  }, [userId, alarms, alarmEvents]);

  // Prepare chart data
  const psychologicalRadarData = useMemo(() => {
    if (!analysisData?.psychologicalProfile) return [];

    const { bigFiveTraits, motivationalFactors } = analysisData.psychologicalProfile;
    return [
      { trait: 'Openness', value: Math.round(bigFiveTraits.openness * 100) },
      {
        trait: 'Conscientiousness',
        value: Math.round(bigFiveTraits.conscientiousness * 100),
      },
      { trait: 'Extraversion', value: Math.round(bigFiveTraits.extraversion * 100) },
      { trait: 'Agreeableness', value: Math.round(bigFiveTraits.agreeableness * 100) },
      {
        trait: 'Neuroticism',
        value: Math.round((1 - bigFiveTraits.neuroticism) * 100),
      }, // Inverted for stability
    ];
  }, [analysisData]);

  const motivationalData = useMemo(() => {
    if (!analysisData?.psychologicalProfile) return [];

    const { motivationalFactors } = analysisData.psychologicalProfile;
    return Object.entries(motivationalFactors).map(([factor, value]) => ({
      name: factor.charAt(0).toUpperCase() + factor.slice(1),
      value: Math.round((value as number) * 100),
    }));
  }, [analysisData]);

  const predictiveData = useMemo(() => {
    if (!analysisData?.predictiveAnalysis) return [];

    const { sleepQualityForecast, energyLevelPrediction } =
      analysisData.predictiveAnalysis;
    return sleepQualityForecast.map((sleep: number, index: number) => ({
      day: `Day ${index + 1}`,
      sleepQuality: Math.round(sleep * 10) / 10,
      energyLevel: Math.round((energyLevelPrediction[index] || 7) * 10) / 10,
    }));
  }, [analysisData]);

  const insightsByPriority = useMemo(() => {
    if (!analysisData?.insights) return { critical: [], high: [], medium: [], low: [] };

    return analysisData.insights.reduce(
      (acc: unknown, insight: BehavioralInsight) => {
        if (!acc[insight.priority]) acc[insight.priority] = [];
        acc[insight.priority].push(insight);
        return acc;
      },
      { critical: [], high: [], medium: [], low: [] }
    );
  }, [analysisData]);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing behavioral patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Behavioral Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced AI-powered insights into your wake patterns and habits
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Brain className="w-4 h-4" />
            <span>
              AI Confidence:{' '}
              {Math.round(
                (analysisData?.psychologicalProfile?.confidence || 0.7) * 100
              )}
              %
            </span>
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insights Generated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysisData?.insights?.length || 0}
                </p>
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recommendations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recommendations?.length || 0}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Sources</p>
                <p className="text-2xl font-bold text-gray-900">
                  {crossPlatformData ? 3 : 1}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Update</p>
                <p className="text-2xl font-bold text-gray-900">6h</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Psychological Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Personality Traits</span>
                </CardTitle>
                <CardDescription>
                  Your Big Five personality profile based on behavioral patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={psychologicalRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Traits"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Motivational Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Motivational Drivers</span>
                </CardTitle>
                <CardDescription>
                  What motivates you based on your behavioral patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={motivationalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Critical Insights Alert */}
          {insightsByPriority.critical.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">
                Critical Insights Detected
              </AlertTitle>
              <AlertDescription className="text-red-700">
                {insightsByPriority.critical.length} critical insight
                {insightsByPriority.critical.length !== 1 ? 's' : ''} require
                {insightsByPriority.critical.length === 1 ? 's' : ''} immediate
                attention.
                <button
                  onClick={() => setSelectedTab('insights')}
                  className="ml-2 underline hover:no-underline"
                >
                  View details →
                </button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Psychology Tab */}
        <TabsContent value="psychology" className="space-y-6">
          {analysisData?.psychologicalProfile && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Chronotype Analysis</CardTitle>
                  <CardDescription>
                    Your natural circadian rhythm and optimal activity times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Chronotype:</span>
                      <Badge variant="secondary">
                        {analysisData.psychologicalProfile.chronotype.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Stress Response:</span>
                      <Badge variant="outline">
                        {analysisData.psychologicalProfile.stressResponse.replace(
                          '_',
                          ' '
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Change Adaptability:</span>
                      <Badge variant="outline">
                        {analysisData.psychologicalProfile.changeAdaptability}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Big Five Traits</CardTitle>
                    <CardDescription>
                      Detailed personality trait analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(
                        analysisData.psychologicalProfile.bigFiveTraits
                      ).map(([trait, value]) => (
                        <div key={trait}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">
                              {trait === 'neuroticism' ? 'Emotional Stability' : trait}
                            </span>
                            <span className="text-sm text-gray-500">
                              {Math.round(
                                (trait === 'neuroticism'
                                  ? 1 - (value as number)
                                  : (value as number)) * 100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (trait === 'neuroticism'
                                ? 1 - (value as number)
                                : (value as number)) * 100
                            }
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Motivational Factors</CardTitle>
                    <CardDescription>
                      What drives your behavior patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(
                        analysisData.psychologicalProfile.motivationalFactors
                      ).map(([factor, value]) => (
                        <div key={factor}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">
                              {factor}
                            </span>
                            <span className="text-sm text-gray-500">
                              {Math.round((value as number) * 100)}%
                            </span>
                          </div>
                          <Progress value={(value as number) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(insightsByPriority).map(([priority, insights]) => {
              if ((insights as BehavioralInsight[]).length === 0) return null;

              return (
                <Card key={priority}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS],
                        }}
                      />
                      <span>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                        Insights
                      </span>
                      <Badge variant="secondary">
                        {(insights as BehavioralInsight[]).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(insights as BehavioralInsight[]).map(insight => {
                        const IconComponent =
                          TYPE_ICONS[insight.type as keyof typeof TYPE_ICONS] || Brain;
                        return (
                          <div
                            key={insight.id}
                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedInsight(insight)}
                          >
                            <div className="flex items-start space-x-3">
                              <IconComponent className="w-5 h-5 mt-1 text-gray-500" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {insight.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {insight.personalizedMessage}
                                </p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(insight.confidence * 100)}% confidence
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {insight.actionability.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {insight.suggestedActions.length} suggested action
                                    {insight.suggestedActions.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>7-Day Forecast</span>
              </CardTitle>
              <CardDescription>
                Predicted sleep quality and energy levels based on your patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sleepQuality"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Sleep Quality"
                  />
                  <Line
                    type="monotone"
                    dataKey="energyLevel"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Energy Level"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimal Wake Times</CardTitle>
                <CardDescription>
                  AI-predicted optimal wake times for the next week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysisData?.predictiveAnalysis?.optimalWakeTimes || []).map(
                    (time: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="font-medium">Day {index + 1}</span>
                        <span className="text-lg font-mono">{time}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
                <CardDescription>
                  Potential challenges and mitigation strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysisData?.predictiveAnalysis?.riskFactors || []).map(
                    (risk: unknown, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{risk.factor}</h4>
                          <Badge variant="outline">
                            {Math.round(risk.probability * 100)}% risk
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{risk.mitigation}</p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {recommendations.map(rec => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>{rec.title}</span>
                      </CardTitle>
                      <CardDescription>{rec.description}</CardDescription>
                    </div>
                    <Badge
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{rec.personalizedReason}</p>

                    {/* Impact Metrics */}
                    <div>
                      <h4 className="font-medium mb-2">Expected Impact</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                        {Object.entries(rec.estimatedImpact).map(([metric, value]) => (
                          <div key={metric} className="text-center">
                            <div className="text-xs text-gray-500 mb-1 capitalize">
                              {metric.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              +{Math.round((value as number) * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {rec.actions && (
                      <div>
                        <h4 className="font-medium mb-2">Action Steps</h4>
                        <div className="space-y-2">
                          {rec.actions.map((action: unknown, index: number) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center mt-0.5">
                                {action.step}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                  {action.description}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Duration: {action.duration} •{' '}
                                  {action.required ? 'Required' : 'Optional'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                        <span>Complexity: {rec.implementationComplexity}</span>
                        <span>Results in: {rec.timeToSeeResults}</span>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Start Implementation
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedInsight.title}
                </h2>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">{selectedInsight.description}</p>
                <p className="text-blue-600 bg-blue-50 p-3 rounded-lg">
                  {selectedInsight.personalizedMessage}
                </p>

                {selectedInsight.suggestedActions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Suggested Actions:</h3>
                    <div className="space-y-2">
                      {selectedInsight.suggestedActions.map((action, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="font-medium text-gray-900">{action.action}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>Impact: {action.impact}</span>
                            <span>Difficulty: {action.difficulty}</span>
                            <span>Timeframe: {action.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock data generators for development
function generateMockAnalysisData() {
  return {
    insights: [
      {
        id: 'insight_1',
        type: 'pattern_discovery',
        title: 'Circadian Rhythm Optimization Detected',
        description:
          'Your natural circadian rhythm shows strong potential for optimization',
        confidence: 0.87,
        priority: 'high',
        actionability: 'short_term',
        personalizedMessage:
          'Your disciplined nature combined with consistent patterns suggests you can achieve 20% better sleep quality with targeted timing adjustments.',
        suggestedActions: [
          {
            action: 'Align primary alarm with natural peak at 06:45',
            impact: 'high',
            difficulty: 'easy',
            timeframe: '1-2 weeks',
          },
        ],
      },
      {
        id: 'insight_2',
        type: 'anomaly_detection',
        title: 'Stress-Performance Correlation Alert',
        description:
          'High correlation detected between stress levels and alarm dismissal patterns',
        confidence: 0.92,
        priority: 'critical',
        actionability: 'immediate',
        personalizedMessage:
          "Stress management could improve your wake consistency by 35%. Let's address this with gentle, supportive adjustments.",
        suggestedActions: [
          {
            action: 'Implement 5-minute evening meditation routine',
            impact: 'high',
            difficulty: 'easy',
            timeframe: '2 weeks',
          },
        ],
      },
    ],
    psychologicalProfile: {
      bigFiveTraits: {
        openness: 0.72,
        conscientiousness: 0.84,
        extraversion: 0.58,
        agreeableness: 0.76,
        neuroticism: 0.34,
      },
      motivationalFactors: {
        achievement: 0.78,
        autonomy: 0.65,
        mastery: 0.82,
        purpose: 0.71,
        social: 0.59,
      },
      chronotype: 'morning',
      stressResponse: 'moderate_resilience',
      changeAdaptability: 'high',
      confidence: 0.83,
    },
    predictiveAnalysis: {
      sleepQualityForecast: [7.2, 7.5, 6.8, 8.1, 7.9, 8.3, 7.6],
      energyLevelPrediction: [7.0, 7.8, 6.5, 8.2, 7.5, 8.0, 7.3],
      optimalWakeTimes: ['06:45', '06:50', '07:00', '06:40', '06:55', '07:15', '07:30'],
      riskFactors: [
        {
          factor: 'Sleep debt accumulation',
          probability: 0.3,
          mitigation:
            'Maintain consistent sleep schedule and avoid late-night screen time',
        },
      ],
    },
  };
}

function generateMockRecommendations() {
  return [
    {
      id: 'rec_1',
      type: 'actionable',
      title: 'Optimize Your Productive Hours',
      description:
        'Align your most challenging tasks with your natural energy peaks for maximum productivity.',
      category: 'productivity',
      priority: 'high',
      confidence: 0.85,
      personalizedReason:
        'Your productivity patterns suggest you could benefit from better task-energy alignment.',
      estimatedImpact: {
        sleepQuality: 0.1,
        energyLevel: 0.3,
        consistency: 0.2,
        wellbeing: 0.2,
        productivity: 0.7,
      },
      implementationComplexity: 'moderate',
      timeToSeeResults: '1-2 weeks',
      actions: [
        {
          step: 1,
          description: 'Track your energy levels hourly for 3 days',
          duration: '5 minutes daily',
          required: true,
        },
      ],
    },
  ];
}

export default EnhancedBehavioralIntelligenceDashboard;
