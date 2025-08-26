/**
 * AI Performance Dashboard Demo
 * Demonstration page for the AI Performance Dashboard with integration examples
 */

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  Code,
  Database,
  Eye,
  Info,
  Lightbulb,
  Monitor,
  Settings,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import AIPerformanceDashboard from './AIPerformanceDashboard';

export default function AIPerformanceDashboardDemo() {
  const [activeDemo, setActiveDemo] = useState<'dashboard' | 'overview'>('overview');

  const features = [
    {
      icon: <Activity className="w-6 h-6 text-blue-600" />,
      title: 'Real-time Monitoring',
      description:
        'Live monitoring of all AI services with automatic health checks every 30 seconds',
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      title: 'Behavioral Intelligence Analytics',
      description:
        'Deep insights into user behavioral patterns, anomaly detection, and predictive analysis',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-green-600" />,
      title: 'Performance Metrics',
      description:
        'Comprehensive performance tracking with historical trends and forecasting',
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: 'Voice AI Analytics',
      description:
        'Voice mood effectiveness tracking, user preference analysis, and response time optimization',
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      title: 'Rewards System Insights',
      description:
        'User engagement metrics, achievement unlock rates, and satisfaction scoring',
    },
    {
      icon: <Monitor className="w-6 h-6 text-red-600" />,
      title: 'Deployment Orchestration',
      description:
        '5-phase deployment tracking with rollback capabilities and service health monitoring',
    },
  ];

  const integrationExamples = [
    {
      title: 'Service Health Integration',
      code: `// Real-time service health monitoring
const serviceHealth = await AIDeploymentOrchestrator
  .getInstance()
  .getServiceHealth();

// Auto-alerts for degraded services
serviceHealth.forEach(service => {
  if (service.status !== 'healthy') {
    AlertSystem.notify(\`\${service.name} is \${service.status}\`);
  }
});`,
    },
    {
      title: 'Behavioral Analytics Integration',
      code: `// Generate comprehensive behavioral insights
const insights = await AdvancedBehavioralIntelligence
  .getInstance()
  .generateAdvancedBehavioralAnalysis(userId, alarms, events);

// Display actionable recommendations
insights.insights.forEach(insight => {
  if (insight.actionability === 'immediate') {
    Dashboard.showRecommendation(insight);
  }
});`,
    },
    {
      title: 'Voice AI Performance Tracking',
      code: `// Track voice AI effectiveness
const voiceMetrics = await VoiceAIEnhancedService
  .getInstance()
  .getPerformanceMetrics();

// Optimize voice mood selection
const optimalMood = voiceMetrics.find(m => 
  m.successRate > 85 && m.userPreference > 80
);`,
    },
    {
      title: 'Rewards Analytics Integration',
      code: `// Analyze reward system performance
const rewardSystem = await AIRewardsService
  .getInstance()
  .analyzeAndGenerateRewards(alarms, events);

// Track engagement metrics
Dashboard.updateMetrics({
  engagementRate: rewardSystem.engagementRate,
  satisfactionScore: rewardSystem.satisfactionScore
});`,
    },
  ];

  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/ai/health',
      description: 'Get overall AI system health status',
    },
    {
      method: 'GET',
      endpoint: '/api/ai/metrics',
      description: 'Retrieve current AI performance metrics',
    },
    {
      method: 'GET',
      endpoint: '/api/ai/insights',
      description: 'Get behavioral intelligence insights',
    },
    {
      method: 'GET',
      endpoint: '/api/ai/voice-analytics',
      description: 'Voice AI performance and usage analytics',
    },
    {
      method: 'GET',
      endpoint: '/api/ai/rewards-metrics',
      description: 'Rewards system engagement metrics',
    },
    {
      method: 'GET',
      endpoint: '/api/ai/deployment-status',
      description: 'Current deployment phase status',
    },
    {
      method: 'POST',
      endpoint: '/api/ai/deploy-phase',
      description: 'Deploy specific AI phase',
    },
    {
      method: 'POST',
      endpoint: '/api/ai/rollback-phase',
      description: 'Rollback specific AI phase',
    },
  ];

  const useCases = [
    {
      title: 'Production Monitoring',
      description:
        'Monitor AI service health, detect anomalies, and ensure optimal performance in production environments.',
    },
    {
      title: 'User Experience Optimization',
      description:
        'Analyze user interaction patterns to optimize voice moods, reward strategies, and personalization algorithms.',
    },
    {
      title: 'System Performance Tuning',
      description:
        'Identify performance bottlenecks, optimize response times, and improve overall system efficiency.',
    },
    {
      title: 'Deployment Management',
      description:
        'Track AI feature rollouts, manage gradual deployments, and handle rollbacks when necessary.',
    },
    {
      title: 'Business Intelligence',
      description:
        'Generate insights for business decisions based on AI system performance and user engagement metrics.',
    },
  ];

  if (activeDemo === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <Button
            variant="outline"
            onClick={() => setActiveDemo('overview')}
            className="mb-4"
          >
            ← Back to Overview
          </Button>
        </div>
        <AIPerformanceDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">
              AI Performance Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive real-time monitoring and analytics dashboard for the Relife AI
            ecosystem, providing deep insights into behavioral intelligence, voice AI,
            rewards system, and deployment orchestration.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setActiveDemo('dashboard')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Eye className="w-5 h-5 mr-2" />
              View Live Dashboard
            </Button>
            <Button variant="outline" size="lg">
              <Code className="w-5 h-5 mr-2" />
              View Source Code
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              Key Features
            </CardTitle>
            <CardDescription>
              Advanced monitoring and analytics capabilities for comprehensive AI system
              oversight
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Information Tabs */}
        <Tabs defaultValue="integration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="usecases">Use Cases</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
          </TabsList>

          {/* Integration Examples */}
          <TabsContent value="integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Examples</CardTitle>
                <CardDescription>
                  Code examples showing how to integrate with the AI Performance
                  Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {integrationExamples.map((example, index) => (
                    <div key={index} className="space-y-3">
                      <h3 className="text-lg font-semibold">{example.title}</h3>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Reference */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  REST API endpoints for accessing AI performance data and controlling
                  system behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {endpoint.endpoint}
                        </code>
                      </div>
                      <div className="text-sm text-gray-600 max-w-md text-right">
                        {endpoint.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Use Cases */}
          <TabsContent value="usecases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
                <CardDescription>
                  Real-world scenarios where the AI Performance Dashboard provides value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">{useCase.title}</h3>
                      <p className="text-gray-600">{useCase.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture */}
          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Architecture</CardTitle>
                <CardDescription>
                  Overview of the AI Performance Dashboard architecture and data flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Architecture Overview</AlertTitle>
                    <AlertDescription>
                      The AI Performance Dashboard is built on a modular architecture
                      that integrates with multiple AI services to provide comprehensive
                      monitoring and analytics capabilities.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Data Sources</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          Advanced Behavioral Intelligence Service
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          Voice AI Enhanced Service
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-600 rounded-full" />
                          AI Rewards Service
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full" />
                          AI Deployment Orchestrator
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full" />
                          Performance Monitor Service
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Key Components</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-blue-600" />
                          Real-time Monitoring Engine
                        </li>
                        <li className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-green-600" />
                          Analytics Processing Pipeline
                        </li>
                        <li className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-yellow-600" />
                          Health Check Orchestrator
                        </li>
                        <li className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-purple-600" />
                          Configuration Management
                        </li>
                        <li className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-red-600" />
                          Data Aggregation Layer
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Data Flow</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>AI Services</div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                          <Activity className="w-6 h-6 text-green-600" />
                        </div>
                        <div>Data Collection</div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                          <BarChart3 className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>Processing</div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                          <Monitor className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>Dashboard</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with the AI Performance Dashboard in your development
              environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                <pre className="text-sm">
                  <code>{`// Import the AI Performance Dashboard
import AIPerformanceDashboard from '@/components/AIPerformanceDashboard';

// Use in your React component
function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <AIPerformanceDashboard />
    </div>
  );
}`}</code>
                </pre>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Required</AlertTitle>
                <AlertDescription>
                  Make sure your AI services are properly configured and running before
                  using the dashboard. The dashboard will show mock data in development
                  mode and real data in production.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
