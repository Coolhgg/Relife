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
  Play,
  Pause,
  Wifi,
  WifiOff,
  History,
  Eye,
  Server,
  Database,
  Globe,
  Smartphone
} from 'lucide-react';

// Import the live component
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
  category: string;
  parameters: Record<string, any>;
}

const AIModelParametersCustomizerLive: React.FC = () => {
  const [mode, setMode] = useState<'overview' | 'live' | 'batch' | 'presets'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('core_ai');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'offline'>('offline');
  const [systemHealth, setSystemHealth] = useState<Record<string, number>>({});

  const categories: AIParameterCategory[] = [
    {
      id: 'core_ai',
      name: 'Core AI Settings',
      icon: <Brain className=\"w-5 h-5\" />,
      description: 'Learning rate, pattern recognition, confidence thresholds',
      parameterCount: 12,
      isLive: true
    },
    {
      id: 'voice_ai',
      name: 'Voice AI Configuration',
      icon: <Mic className=\"w-5 h-5\" />,
      description: 'Personality adaptation, response complexity, speech patterns',
      parameterCount: 18,
      isLive: true
    },
    {
      id: 'behavioral_intelligence',
      name: 'Behavioral Intelligence',
      icon: <Brain className=\"w-5 h-5\" />,
      description: 'Analysis depth, psychological profiling, contextual learning',
      parameterCount: 15,
      isLive: true
    },
    {
      id: 'rewards_system',
      name: 'Rewards System',
      icon: <Trophy className=\"w-5 h-5\" />,
      description: 'Personalization, gamification intensity, achievement triggers',
      parameterCount: 22,
      isLive: true
    },
    {
      id: 'platform_integration',
      name: 'Platform Integration',
      icon: <Globe className=\"w-5 h-5\" />,
      description: 'Health apps, calendar sync, weather integration, privacy settings',
      parameterCount: 16,
      isLive: false
    },
    {
      id: 'deployment_config',
      name: 'Deployment Configuration',
      icon: <Zap className=\"w-5 h-5\" />,
      description: 'Phase management, monitoring depth, rollback strategies',
      parameterCount: 20,
      isLive: true
    }
  ];

  const configPresets: ConfigurationPreset[] = [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Prioritizes accuracy and privacy over advanced features',
      category: 'general',
      parameters: {
        learningRate: 0.2,
        confidenceThreshold: 0.85,
        psychologicalProfiling: false,
        gamificationIntensity: 40
      }
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Optimal balance between performance and privacy',
      category: 'general',
      parameters: {
        learningRate: 0.5,
        confidenceThreshold: 0.75,
        psychologicalProfiling: true,
        gamificationIntensity: 70
      }
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'Maximum AI capabilities with advanced features enabled',
      category: 'general',
      parameters: {
        learningRate: 0.8,
        confidenceThreshold: 0.65,
        psychologicalProfiling: true,
        gamificationIntensity: 95
      }
    },
    {
      id: 'privacy_focused',
      name: 'Privacy Focused',
      description: 'Minimal data collection with essential features only',
      category: 'privacy',
      parameters: {
        learningRate: 0.3,
        confidenceThreshold: 0.9,
        psychologicalProfiling: false,
        gamificationIntensity: 30
      }
    }
  ];

  // Connection management
  const checkConnection = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      const response = await fetch('/api/ai-parameters/configuration/health-check');
      if (response.ok) {
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Get system health metrics
        const healthData = await response.json();
        setSystemHealth(healthData.systemHealth || {});
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    checkConnection();
    
    // Setup periodic health checks
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Apply configuration preset
  const applyPreset = async (preset: ConfigurationPreset) => {
    try {
      const response = await fetch('/api/ai-parameters/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          updates: Object.entries(preset.parameters).map(([key, value]) => ({
            category: 'core_ai', // Default category, would be mapped properly
            parameters: { [key]: value },
            userId: 'current-user',
            immediate: true
          }))
        })
      });

      if (response.ok) {
        // Show success message
        console.log(`Applied preset: ${preset.name}`);
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  };

  const renderOverview = () => (
    <div className=\"space-y-6\">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <Server className=\"w-5 h-5\" />
            System Status
          </CardTitle>
          <CardDescription>
            Real-time status of AI parameter configuration system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
            <div className=\"flex items-center justify-between p-4 bg-muted rounded-lg\">
              <div className=\"flex items-center gap-2\">
                {connectionStatus === 'connected' ? (
                  <Wifi className=\"w-5 h-5 text-green-500\" />
                ) : (
                  <WifiOff className=\"w-5 h-5 text-red-500\" />
                )}
                <span className=\"font-medium\">Connection</span>
              </div>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus}
              </Badge>
            </div>

            <div className=\"flex items-center justify-between p-4 bg-muted rounded-lg\">
              <div className=\"flex items-center gap-2\">
                <Activity className=\"w-5 h-5 text-blue-500\" />
                <span className=\"font-medium\">Live Services</span>
              </div>
              <Badge variant=\"secondary\">
                {categories.filter(c => c.isLive).length} Active
              </Badge>
            </div>

            <div className=\"flex items-center justify-between p-4 bg-muted rounded-lg\">
              <div className=\"flex items-center gap-2\">
                <Settings className=\"w-5 h-5 text-purple-500\" />
                <span className=\"font-medium\">Parameters</span>
              </div>
              <Badge variant=\"secondary\">
                {categories.reduce((sum, cat) => sum + cat.parameterCount, 0)} Total
              </Badge>
            </div>
          </div>

          {/* Health Metrics */}
          {Object.keys(systemHealth).length > 0 && (
            <div className=\"mt-6 space-y-3\">
              <h4 className=\"font-medium\">Service Health</h4>
              <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3\">
                {Object.entries(systemHealth).map(([service, health]) => (
                  <div key={service} className=\"space-y-2\">
                    <div className=\"flex justify-between text-sm\">
                      <span>{service}</span>
                      <span>{Math.round(health * 100)}%</span>
                    </div>
                    <Progress value={health * 100} className=\"h-2\" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Overview */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
        {categories.map((category) => (
          <Card key={category.id} className=\"cursor-pointer hover:shadow-md transition-shadow\"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setMode('live');
                }}>
            <CardHeader className=\"pb-3\">
              <div className=\"flex items-center justify-between\">
                <div className=\"flex items-center gap-2\">
                  {category.icon}
                  <CardTitle className=\"text-base\">{category.name}</CardTitle>
                </div>
                {category.isLive && (
                  <Badge variant=\"outline\" className=\"text-xs\">Live</Badge>
                )}
              </div>
              <CardDescription className=\"text-sm\">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"flex items-center justify-between text-sm\">
                <span className=\"text-muted-foreground\">Parameters</span>
                <span className=\"font-medium\">{category.parameterCount}</span>
              </div>
              {category.isLive && (
                <div className=\"flex items-center gap-1 mt-2 text-xs text-green-600\">
                  <div className=\"w-2 h-2 rounded-full bg-green-500 animate-pulse\" />
                  Real-time configuration
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <Zap className=\"w-5 h-5\" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common configuration tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3\">
            <Button 
              variant=\"outline\" 
              onClick={() => setMode('live')}
              className=\"flex items-center gap-2\"
            >
              <Play className=\"w-4 h-4\" />
              Live Config
            </Button>
            
            <Button 
              variant=\"outline\"
              onClick={() => setMode('presets')}
              className=\"flex items-center gap-2\"
            >
              <Target className=\"w-4 h-4\" />
              Presets
            </Button>
            
            <Button 
              variant=\"outline\"
              onClick={() => window.open('/api/ai-parameters/configuration/current-user/export')}
              className=\"flex items-center gap-2\"
            >
              <Download className=\"w-4 h-4\" />
              Export
            </Button>
            
            <Button 
              variant=\"outline\"
              onClick={checkConnection}
              className=\"flex items-center gap-2\"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPresets = () => (
    <div className=\"space-y-6\">
      <div className=\"flex items-center justify-between\">
        <div>
          <h2 className=\"text-2xl font-bold\">Configuration Presets</h2>
          <p className=\"text-muted-foreground\">Pre-configured parameter sets for common use cases</p>
        </div>
        <Button 
          variant=\"outline\"
          onClick={() => setMode('overview')}
          className=\"flex items-center gap-2\"
        >
          <RotateCcw className=\"w-4 h-4\" />
          Back to Overview
        </Button>
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        {configPresets.map((preset) => (
          <Card key={preset.id}>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                {preset.name}
                <Badge variant=\"secondary\">{preset.category}</Badge>
              </CardTitle>
              <CardDescription>
                {preset.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                <div className=\"text-sm font-medium\">Preview Parameters:</div>
                <div className=\"grid grid-cols-2 gap-2 text-xs\">
                  {Object.entries(preset.parameters).map(([key, value]) => (
                    <div key={key} className=\"flex justify-between p-2 bg-muted rounded\">
                      <span>{key}:</span>
                      <span className=\"font-medium\">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => applyPreset(preset)}
                  className=\"w-full mt-3\"
                  disabled={!isConnected}
                >
                  Apply Preset
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Preset</CardTitle>
          <CardDescription>
            Create your own configuration preset from current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label htmlFor=\"preset-name\">Preset Name</Label>
                <Input id=\"preset-name\" placeholder=\"My Custom Preset\" />
              </div>
              <div>
                <Label htmlFor=\"preset-category\">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder=\"Select category\" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"general\">General</SelectItem>
                    <SelectItem value=\"privacy\">Privacy</SelectItem>
                    <SelectItem value=\"performance\">Performance</SelectItem>
                    <SelectItem value=\"custom\">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor=\"preset-description\">Description</Label>
              <Textarea 
                id=\"preset-description\" 
                placeholder=\"Describe your preset configuration...\"
              />
            </div>
            <Button disabled={!isConnected}>
              <Save className=\"w-4 h-4 mr-2\" />
              Save Preset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className=\"max-w-7xl mx-auto p-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between mb-8\">
        <div>
          <h1 className=\"text-3xl font-bold flex items-center gap-2\">
            <Settings className=\"w-8 h-8\" />
            AI Model Parameters Customizer
          </h1>
          <p className=\"text-muted-foreground mt-1\">
            Live configuration and management of all AI model parameters
          </p>
        </div>

        {/* Mode Selector */}
        <div className=\"flex items-center gap-2\">
          <Button
            variant={mode === 'overview' ? 'default' : 'outline'}
            onClick={() => setMode('overview')}
            size=\"sm\"
          >
            <BarChart3 className=\"w-4 h-4 mr-2\" />
            Overview
          </Button>
          <Button
            variant={mode === 'live' ? 'default' : 'outline'}
            onClick={() => setMode('live')}
            size=\"sm\"
            disabled={!isConnected}
          >
            <Wifi className=\"w-4 h-4 mr-2\" />
            Live Config
          </Button>
          <Button
            variant={mode === 'presets' ? 'default' : 'outline'}
            onClick={() => setMode('presets')}
            size=\"sm\"
          >
            <Target className=\"w-4 h-4 mr-2\" />
            Presets
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {!isConnected && mode === 'live' && (
        <Alert variant=\"destructive\" className=\"mb-6\">
          <AlertTriangle className=\"h-4 w-4\" />
          <AlertDescription>
            Unable to connect to AI parameter services. Live configuration is unavailable.
          </AlertDescription>
        </Alert>
      )}

      {/* Mode Content */}
      {mode === 'overview' && renderOverview()}
      {mode === 'live' && (
        isConnected ? (
          <LiveAIParameterCustomizer />
        ) : (
          <div className=\"text-center py-12\">
            <WifiOff className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
            <h3 className=\"text-lg font-semibold mb-2\">Connection Required</h3>
            <p className=\"text-muted-foreground mb-4\">
              Live configuration requires an active connection to AI services.
            </p>
            <Button onClick={checkConnection}>
              <RefreshCw className=\"w-4 h-4 mr-2\" />
              Retry Connection
            </Button>
          </div>
        )
      )}
      {mode === 'presets' && renderPresets()}
    </div>
  );
};

export default AIModelParametersCustomizerLive;