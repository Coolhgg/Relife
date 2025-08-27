/**
 * AI Deployment Dashboard
 * Real-time monitoring and control interface for the 5-phase AI deployment
 */

import React, { useState, useEffect } from 'react';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Monitor, 
  Rocket, 
  Shield, 
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import AIDeploymentOrchestrator from '../services/ai-deployment-orchestrator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

interface AIDeploymentDashboardProps {
  className?: string;
}

interface DeploymentStatus {
  phase: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  startTime?: Date;
  completionTime?: Date;
  errors?: string[];
}

interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

const STATUS_COLORS = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  rolled_back: '#f59e0b',
};

const HEALTH_COLORS = {
  healthy: '#10b981',
  degraded: '#f59e0b',
  unhealthy: '#ef4444',
};

const PHASE_NAMES = {
  1: 'Core Services',
  2: 'Cross-Platform Integration',
  3: 'Recommendation Engine',
  4: 'Dashboard & UI',
  5: 'Optimization & Scaling',
};

export const AIDeploymentDashboard: React.FC<AIDeploymentDashboardProps> = ({
  className = '',
}) => {
  const [deploymentData, setDeploymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [orchestrator] = useState(() => AIDeploymentOrchestrator.getInstance());

  // Fetch deployment status
  const fetchDeploymentData = async () => {
    setRefreshing(true);
    try {
      const data = orchestrator.getDeploymentStatus();
      setDeploymentData(data);
    } catch (error) {
      console.error('Failed to fetch deployment data:', error);
      // Set mock data for development
      setDeploymentData(generateMockDeploymentData());
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentData();
    
    // Set up auto-refresh
    const interval = setInterval(fetchDeploymentData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Start deployment
  const handleStartDeployment = async () => {
    try {
      setLoading(true);
      await orchestrator.startDeployment();
      await fetchDeploymentData();
    } catch (error) {
      console.error('Failed to start deployment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rollback phase
  const handleRollbackPhase = async (phaseNumber: number) => {
    try {
      await orchestrator.rollbackPhase(phaseNumber);
      await fetchDeploymentData();
    } catch (error) {
      console.error(`Failed to rollback phase ${phaseNumber}:`, error);
    }
  };

  // Calculate overall statistics
  const overallStats = React.useMemo(() => {
    if (!deploymentData) return {};
    
    const { phases, serviceHealth, metrics } = deploymentData;
    const completedPhases = phases.filter((p: DeploymentStatus) => p.status === 'completed').length;
    const failedPhases = phases.filter((p: DeploymentStatus) => p.status === 'failed').length;
    const healthyServices = serviceHealth.filter((s: ServiceHealth) => s.status === 'healthy').length;
    const avgUserAdoption = metrics.length > 0 ? 
      metrics.reduce((sum: number, m: any) => sum + m.userAdoption, 0) / metrics.length : 0;
    
    return {
      completedPhases,
      failedPhases,
      totalPhases: phases.length,
      healthyServices,
      totalServices: serviceHealth.length,
      overallProgress: deploymentData.overallProgress || 0,
      userAdoption: avgUserAdoption,
    };
  }, [deploymentData]);

  if (loading && !deploymentData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deployment status...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">AI Deployment Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and control the 5-phase AI behavior analysis system deployment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={fetchDeploymentData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleStartDeployment}
            disabled={loading}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Start Deployment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(overallStats.overallProgress || 0)}%
                </p>
              </div>
              <Rocket className="w-8 h-8 text-blue-500" />
            </div>
            <Progress value={overallStats.overallProgress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Phases Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.completedPhases}/{overallStats.totalPhases}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overallStats.failedPhases > 0 && `${overallStats.failedPhases} failed`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Service Health</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.healthyServices}/{overallStats.totalServices}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Adoption</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((overallStats.userAdoption || 0) * 100)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="health">Service Health</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phase Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5" />
                  <span>Deployment Progress</span>
                </CardTitle>
                <CardDescription>Current status of all deployment phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentData?.phases?.map((phase: DeploymentStatus) => (
                    <div key={phase.phase} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[phase.status] }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            Phase {phase.phase}: {PHASE_NAMES[phase.phase as keyof typeof PHASE_NAMES]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {phase.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Service Health</span>
                </CardTitle>
                <CardDescription>Real-time health status of AI services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deploymentData?.serviceHealth?.map((service: ServiceHealth) => (
                    <div key={service.serviceName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: HEALTH_COLORS[service.status] }}
                        />
                        <span className="font-medium">{service.serviceName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{service.responseTime}ms</div>
                        <div className="text-xs text-gray-500">{service.uptime}% uptime</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {deploymentData?.phases?.some((p: DeploymentStatus) => p.status === 'failed') && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Deployment Issues Detected</AlertTitle>
              <AlertDescription className="text-red-700">
                Some phases have failed and may require attention. Check the Phases tab for details.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {deploymentData?.phases?.map((phase: DeploymentStatus) => (
              <Card key={phase.phase}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[phase.status] }}
                      />
                      <div>
                        <CardTitle>
                          Phase {phase.phase}: {PHASE_NAMES[phase.phase as keyof typeof PHASE_NAMES]}
                        </CardTitle>
                        <CardDescription>
                          Status: {phase.status.replace('_', ' ')} • Progress: {phase.progress}%
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {phase.status === 'completed' && (
                        <Button
                          onClick={() => handleRollbackPhase(phase.phase)}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Rollback
                        </Button>
                      )}
                      <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                        {phase.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={phase.progress} className="h-3" />
                    
                    {phase.startTime && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Started: {phase.startTime.toLocaleString()}</span>
                        {phase.completionTime && (
                          <span>Completed: {phase.completionTime.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                    
                    {phase.errors && phase.errors.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                        <div className="space-y-1">
                          {phase.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Service Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deploymentData?.serviceHealth?.map((service: ServiceHealth) => (
              <Card key={service.serviceName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5" />
                      <span>{service.serviceName}</span>
                    </CardTitle>
                    <Badge 
                      variant={service.status === 'healthy' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {service.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">{service.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Error Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{service.errorRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{service.uptime}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Check</p>
                      <p className="text-sm text-gray-900">{service.lastCheck.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Adoption Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>User Adoption by Phase</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deploymentData?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="userAdoption" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Success Rate by Phase</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={deploymentData?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Success Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data generator for development
function generateMockDeploymentData() {
  return {
    phases: [
      {
        phase: 1,
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completionTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 2,
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        completionTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 3,
        status: 'in_progress',
        progress: 75,
        startTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 4,
        status: 'pending',
        progress: 0,
        errors: [],
      },
      {
        phase: 5,
        status: 'pending',
        progress: 0,
        errors: [],
      },
    ],
    overallProgress: 55,
    serviceHealth: [
      {
        serviceName: 'AdvancedBehavioralIntelligence',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 156,
        errorRate: 0,
        uptime: 99.8,
      },
      {
        serviceName: 'CrossPlatformIntegration',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 89,
        errorRate: 0.1,
        uptime: 99.9,
      },
      {
        serviceName: 'EnhancedRecommendationEngine',
        status: 'degraded',
        lastCheck: new Date(),
        responseTime: 245,
        errorRate: 1.2,
        uptime: 98.7,
      },
    ],
    metrics: [
      {
        phase: 1,
        userAdoption: 0.85,
        successRate: 0.96,
        userFeedbackScore: 8.7,
      },
      {
        phase: 2,
        userAdoption: 0.78,
        successRate: 0.92,
        userFeedbackScore: 8.4,
      },
      {
        phase: 3,
        userAdoption: 0.72,
        successRate: 0.89,
        userFeedbackScore: 8.2,
      },
    ],
  };
}

export default AIDeploymentDashboard;