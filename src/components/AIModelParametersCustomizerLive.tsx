/**
 * AI Model Parameters Customizer - Live Edition
 * Enhanced version with real-time endpoint connections and live configuration management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Brain, 
  Settings, 
  Mic, 
  Trophy, 
  Zap, 
  Target, 
  Clock, 
  Shield, 
  Activity, 
  Users,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  Wifi,
  WifiOff,
  Server,
  Globe,
  Play
} from 'lucide-react';

// Import the Live AI Parameter Customizer component
import LiveAIParameterCustomizer from './LiveAIParameterCustomizer';

interface AIParameterCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  parameterCount: number;
  isLive: boolean;
}

interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  isDefault?: boolean;
}

const AIModelParametersCustomizerLive: React.FC = () => {
  const [mode, setMode] = useState<'overview' | 'live' | 'presets'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [systemHealth, setSystemHealth] = useState<Record<string, number>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // AI Parameter Categories with live status
  const categories: AIParameterCategory[] = [
    {
      id: 'core_ai',
      name: 'Core AI Settings',
      icon: <Brain className="w-5 h-5" />,
      description: 'Learning rate, pattern recognition, confidence thresholds',
      parameterCount: 12,
      isLive: true
    },
    {
      id: 'voice_ai',
      name: 'Voice AI Configuration',
      icon: <Mic className="w-5 h-5" />,
      description: 'Personality adaptation, response complexity, speech patterns',
      parameterCount: 18,
      isLive: true
    },
    {
      id: 'behavioral_intelligence',
      name: 'Behavioral Intelligence',
      icon: <Brain className="w-5 h-5" />,
      description: 'Analysis depth, psychological profiling, contextual learning',
      parameterCount: 15,
      isLive: true
    },
    {
      id: 'rewards_system',
      name: 'Rewards System',
      icon: <Trophy className="w-5 h-5" />,
      description: 'Personalization, gamification intensity, achievement triggers',
      parameterCount: 22,
      isLive: true
    },
    {
      id: 'platform_integration',
      name: 'Platform Integration',
      icon: <Globe className="w-5 h-5" />,
      description: 'Health apps, calendar sync, weather integration, privacy settings',
      parameterCount: 16,
      isLive: false
    },
    {
      id: 'deployment_config',
      name: 'Deployment Configuration',
      icon: <Zap className="w-5 h-5" />,
      description: 'Phase management, monitoring depth, rollback strategies',
      parameterCount: 8,
      isLive: false
    }
  ];

  // Configuration Presets
  const configurationPresets: ConfigurationPreset[] = [
    {
      id: 'balanced',
      name: 'Balanced Performance',
      description: 'Optimal balance between accuracy and speed for general use',
      parameters: {
        learningRate: 0.7,
        confidenceThreshold: 0.8,
        responseComplexity: 'moderate',
        personalizationLevel: 0.6
      },
      isDefault: true
    },
    {
      id: 'high_accuracy',
      name: 'High Accuracy',
      description: 'Maximum precision with deeper analysis, slower responses',
      parameters: {
        learningRate: 0.9,
        confidenceThreshold: 0.95,
        responseComplexity: 'complex',
        personalizationLevel: 0.8
      }
    },
    {
      id: 'fast_response',
      name: 'Fast Response',
      description: 'Quick responses with simplified analysis for real-time use',
      parameters: {
        learningRate: 0.5,
        confidenceThreshold: 0.6,
        responseComplexity: 'simple',
        personalizationLevel: 0.4
      }
    },
    {
      id: 'privacy_focused',
      name: 'Privacy Focused',
      description: 'Minimal data collection with enhanced privacy protection',
      parameters: {
        learningRate: 0.4,
        confidenceThreshold: 0.7,
        dataRetention: 'minimal',
        personalizationLevel: 0.3
      }
    }
  ];

  // Simulate system health monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth({
        'Core AI': 0.85 + Math.random() * 0.15,
        'Voice Processing': 0.9 + Math.random() * 0.1,
        'Behavioral Analysis': 0.8 + Math.random() * 0.2,
        'Rewards Engine': 0.95 + Math.random() * 0.05
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleLiveConfiguration = useCallback(() => {
    setMode('live');
  }, []);

  const handlePresetApplication = useCallback((presetId: string) => {
    // In a real implementation, this would apply the preset configuration
    console.log('Applying preset:', presetId);
    setSelectedPreset(presetId);
  }, []);

  // Render overview mode
  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Real-time status of AI model parameters and system health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">Connection Status</span>
              </div>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Live Services</span>
              </div>
              <Badge variant="secondary">
                {categories.filter(cat => cat.isLive).length} Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Parameters</span>
              </div>
              <Badge variant="outline">
                {categories.reduce((total, cat) => total + cat.parameterCount, 0)} Total
              </Badge>
            </div>
          </div>

          {/* Health Metrics */}
          {Object.keys(systemHealth).length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Service Health</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(systemHealth).map(([service, health]) => (
                  <div key={service} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{service}</span>
                      <span>{Math.round(health * 100)}%</span>
                    </div>
                    <Progress value={health * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parameter Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="cursor-pointer transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                {category.isLive && (
                  <Badge variant="secondary" className="text-xs">
                    Live
                  </Badge>
                )}
              </div>
              <CardDescription>{category.description}</CardDescription>
              {category.isLive && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Real-time updates active
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common parameter configuration tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={handleLiveConfiguration}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Live Config
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setMode('presets')}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Presets
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/api/ai-parameters/configuration/current-user/export')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render presets mode
  const renderPresets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration Presets</h2>
          <p className="text-muted-foreground">Pre-configured parameter sets for common use cases</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => setMode('overview')}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Back to Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configurationPresets.map((preset) => (
          <Card key={preset.id} className="cursor-pointer transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {preset.isDefault && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {preset.name}
                </CardTitle>
                <Button
                  size="sm"
                  variant={selectedPreset === preset.id ? "default" : "outline"}
                  onClick={() => handlePresetApplication(preset.id)}
                >
                  Apply
                </Button>
              </div>
              <CardDescription>{preset.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm font-medium">Preview Parameters:</div>
                <div className="space-y-1 text-sm">
                  {Object.entries(preset.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 bg-muted rounded">
                      <span>{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render live configuration mode
  const renderLiveConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Configuration</h2>
          <p className="text-muted-foreground">Real-time parameter adjustment with instant feedback</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setMode('overview')}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button 
            variant="outline"
            onClick={() => setMode('presets')}
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Presets
          </Button>
        </div>
      </div>

      <LiveAIParameterCustomizer />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Parameters - Live Edition</h1>
          <p className="text-muted-foreground">
            Advanced configuration with real-time monitoring and adjustment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </div>
      </div>

      {/* Content based on current mode */}
      {mode === 'overview' && renderOverview()}
      {mode === 'presets' && renderPresets()}
      {mode === 'live' && renderLiveConfiguration()}
    </div>
  );
};

export default AIModelParametersCustomizerLive;