/**
 * Live AI Parameter Customizer
 * Real-time AI parameter configuration with live service endpoints
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
  Eye
} from 'lucide-react';

// API interfaces
interface ParameterUpdateRequest {
  category: 'core_ai' | 'voice_ai' | 'behavioral_intelligence' | 'rewards' | 'platform' | 'deployment';
  parameters: Record<string, any>;
  userId: string;
  immediate?: boolean;
  validateOnly?: boolean;
}

interface ParameterUpdateResponse {
  success: boolean;
  appliedParameters: Record<string, any>;
  validationErrors?: string[];
  rollbackToken?: string;
  affectedServices: string[];
  estimatedEffectTime: number;
  warnings?: string[];
}

interface LiveConfigurationSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  activeServices: string[];
  pendingChanges: ParameterUpdateRequest[];
  rollbackTokens: Map<string, string>;
  autoSaveEnabled: boolean;
  previewMode: boolean;
}

interface ServiceConfiguration {
  serviceName: string;
  currentParameters: Record<string, any>;
  pendingUpdates: Record<string, any>;
  lastUpdated: Date;
  version: string;
  rollbackAvailable: boolean;
}

const LiveAIParameterCustomizer: React.FC = () => {
  // State management
  const [session, setSession] = useState<LiveConfigurationSession | null>(null);
  const [configurations, setConfigurations] = useState<Record<string, ServiceConfiguration>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('behavioral_intelligence');
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});
  const [updateHistory, setUpdateHistory] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const userId = 'current-user'; // Get from auth context

  // API functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = '/api/ai-parameters';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  };

  // Initialize live session
  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Start live session
      const sessionResponse = await apiCall('/session/start', {
        method: 'POST',
        body: JSON.stringify({ userId, previewMode })
      });

      if (sessionResponse.success) {
        setSession(sessionResponse.data);
      }

      // Get current configurations
      const configResponse = await apiCall(`/configuration/${userId}`);
      if (configResponse.success) {
        setConfigurations(configResponse.data);
      }

      // Get performance metrics
      const metricsResponse = await apiCall('/metrics/hour');
      if (metricsResponse.success) {
        setPerformanceMetrics(metricsResponse.data);
      }

      setIsConnected(true);
      setErrors([]);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setErrors([error.message]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [previewMode, userId]);

  // Validate parameters before applying
  const validateParameters = async (category: string, parameters: Record<string, any>) => {
    try {
      const response = await apiCall('/validate', {
        method: 'POST',
        body: JSON.stringify({
          category,
          parameters,
          userId
        } as ParameterUpdateRequest)
      });

      if (response.success) {
        setValidationResults(prev => ({ ...prev, [category]: response.data }));
        return response.data;
      }
    } catch (error) {
      console.error('Validation failed:', error);
      return { isValid: false, errors: [error.message] };
    }
  };

  // Update parameters with validation
  const updateParameters = async (category: string, parameters: Record<string, any>, immediate = false) => {
    setIsLoading(true);
    setErrors([]);
    setWarnings([]);

    try {
      const response = await apiCall('/update', {
        method: 'PUT',
        body: JSON.stringify({
          category,
          parameters,
          userId,
          immediate
        } as ParameterUpdateRequest)
      });

      if (response.success) {
        const updateResult: ParameterUpdateResponse = response.data;
        
        // Update local state
        setConfigurations(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            currentParameters: { ...prev[category].currentParameters, ...updateResult.appliedParameters },
            lastUpdated: new Date()
          }
        }));

        // Clear pending changes
        setPendingChanges(prev => ({ ...prev, [category]: {} }));
        
        // Show success message
        setSuccessMessage(`Updated ${updateResult.affectedServices.join(', ')} successfully`);
        
        // Add to history
        setUpdateHistory(prev => [
          {
            timestamp: new Date(),
            category,
            parameters: updateResult.appliedParameters,
            services: updateResult.affectedServices,
            rollbackToken: updateResult.rollbackToken
          },
          ...prev.slice(0, 9) // Keep last 10
        ]);

        if (updateResult.warnings) {
          setWarnings(updateResult.warnings);
        }
      } else {
        setErrors(response.data.validationErrors || ['Update failed']);
      }
    } catch (error) {
      console.error('Update failed:', error);
      setErrors([error.message]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rollback parameters
  const rollbackParameters = async (rollbackToken: string) => {
    setIsLoading(true);
    try {
      const response = await apiCall('/rollback', {
        method: 'POST',
        body: JSON.stringify({ rollbackToken, userId })
      });

      if (response.success) {
        setSuccessMessage('Parameters rolled back successfully');
        await initializeSession(); // Refresh configurations
      } else {
        setErrors([response.error || 'Rollback failed']);
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      setErrors([error.message]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle parameter changes
  const handleParameterChange = useCallback((category: string, key: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));

    if (autoSave) {
      // Debounced auto-save
      setTimeout(() => {
        updateParameters(category, { [key]: value }, true);
      }, 1000);
    }
  }, [autoSave]);

  // Apply pending changes
  const applyChanges = (category: string, immediate = false) => {
    const changes = pendingChanges[category];
    if (changes && Object.keys(changes).length > 0) {
      updateParameters(category, changes, immediate);
    }
  };

  // Export configuration
  const exportConfiguration = async () => {
    try {
      const response = await fetch(`/api/ai-parameters/configuration/${userId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-config-${userId}-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Configuration exported successfully');
    } catch (error) {
      setErrors(['Export failed: ' + error.message]);
    }
  };

  // Import configuration
  const importConfiguration = async (file: File) => {
    try {
      const content = await file.text();
      const config = JSON.parse(content);
      
      const response = await apiCall(`/configuration/${userId}/import`, {
        method: 'POST',
        body: JSON.stringify({ configurations: config.configurations })
      });

      if (response.success) {
        setSuccessMessage('Configuration imported successfully');
        await initializeSession(); // Refresh
      } else {
        setErrors(['Import failed']);
      }
    } catch (error) {
      setErrors(['Import failed: ' + error.message]);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeSession();
    
    // Setup auto-refresh
    const interval = setInterval(() => {
      if (isConnected) {
        apiCall('/metrics/hour').then(response => {
          if (response.success) {
            setPerformanceMetrics(response.data);
          }
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (session) {
        apiCall(`/session/${session.sessionId}`, { method: 'DELETE' });
      }
    };
  }, [initializeSession, isConnected, session]);

  // Render parameter controls based on metadata
  const renderParameterControl = (category: string, key: string, metadata: any, currentValue: any) => {
    const value = pendingChanges[category]?.[key] ?? currentValue;

    switch (metadata.type) {
      case 'slider':
        return (
          <div className=\"space-y-2\">
            <div className=\"flex justify-between items-center\">
              <Label htmlFor={key}>{metadata.description}</Label>
              <span className=\"text-sm text-muted-foreground\">{value}</span>
            </div>
            <Slider
              id={key}
              min={metadata.min}
              max={metadata.max}
              step={metadata.step}
              value={[value]}
              onValueChange={([newValue]) => handleParameterChange(category, key, newValue)}
              className=\"w-full\"
            />
          </div>
        );

      case 'select':
        return (
          <div className=\"space-y-2\">
            <Label htmlFor={key}>{metadata.description}</Label>
            <Select value={value} onValueChange={(newValue) => handleParameterChange(category, key, newValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metadata.options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option.replace('_', ' ').replace(/\\b\\w/g, (l: string) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'boolean':
        return (
          <div className=\"flex items-center justify-between\">
            <div className=\"space-y-0.5\">
              <Label htmlFor={key}>{metadata.description}</Label>
              {metadata.requiresConsent && (
                <Badge variant=\"outline\" className=\"text-xs\">Requires Consent</Badge>
              )}
            </div>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) => handleParameterChange(category, key, checked)}
            />
          </div>
        );

      case 'number':
        return (
          <div className=\"space-y-2\">
            <Label htmlFor={key}>{metadata.description}</Label>
            <Input
              id={key}
              type=\"number\"
              min={metadata.min}
              max={metadata.max}
              step={metadata.step}
              value={value}
              onChange={(e) => handleParameterChange(category, key, parseFloat(e.target.value))}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Render service configuration panel
  const renderServicePanel = (category: string, config: ServiceConfiguration, metadata: Record<string, any>) => {
    const hasPendingChanges = pendingChanges[category] && Object.keys(pendingChanges[category]).length > 0;

    return (
      <div className=\"space-y-6\">
        {/* Service Status */}
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center gap-2\">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className=\"font-medium\">{config.serviceName}</span>
            <Badge variant=\"secondary\">v{config.version}</Badge>
          </div>
          <div className=\"flex items-center gap-2 text-sm text-muted-foreground\">
            <Clock className=\"w-4 h-4\" />
            Updated {new Date(config.lastUpdated).toLocaleTimeString()}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          {Object.entries(metadata).map(([key, paramMetadata]) => (
            <Card key={key}>
              <CardContent className=\"pt-4\">
                {renderParameterControl(category, key, paramMetadata, config.currentParameters[key])}
                
                {/* Impact indicator */}
                <div className=\"mt-2 flex items-center gap-2\">
                  <Badge variant=\"outline\" className=\"text-xs\">
                    Impact: {(paramMetadata as any).impact}
                  </Badge>
                  {(paramMetadata as any).riskLevel && (
                    <Badge variant=\"destructive\" className=\"text-xs\">
                      {(paramMetadata as any).riskLevel} risk
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className=\"flex items-center gap-3 pt-4 border-t\">
          <Button
            onClick={() => applyChanges(category, true)}
            disabled={!hasPendingChanges || isLoading}
            className=\"flex items-center gap-2\"
          >
            <Play className=\"w-4 h-4\" />
            Apply Now
          </Button>
          
          <Button
            variant=\"outline\"
            onClick={() => applyChanges(category, false)}
            disabled={!hasPendingChanges || isLoading}
            className=\"flex items-center gap-2\"
          >
            <Clock className=\"w-4 h-4\" />
            Queue Update
          </Button>

          <Button
            variant=\"outline\"
            onClick={async () => {
              await validateParameters(category, pendingChanges[category] || {});
            }}
            disabled={!hasPendingChanges || isLoading}
            className=\"flex items-center gap-2\"
          >
            <CheckCircle className=\"w-4 h-4\" />
            Validate
          </Button>

          {hasPendingChanges && (
            <Button
              variant=\"ghost\"
              onClick={() => setPendingChanges(prev => ({ ...prev, [category]: {} }))}
              className=\"flex items-center gap-2\"
            >
              <RotateCcw className=\"w-4 h-4\" />
              Reset
            </Button>
          )}
        </div>

        {/* Validation Results */}
        {validationResults[category] && (
          <Alert className={validationResults[category].isValid ? 'border-green-500' : 'border-red-500'}>
            <AlertTriangle className=\"h-4 w-4\" />
            <AlertDescription>
              {validationResults[category].isValid ? (
                <>
                  <span className=\"text-green-600 font-medium\">Validation passed</span>
                  {validationResults[category].warnings?.length > 0 && (
                    <div className=\"mt-2\">
                      <strong>Warnings:</strong>
                      <ul className=\"list-disc list-inside\">
                        {validationResults[category].warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className=\"text-red-600 font-medium\">Validation failed</span>
                  <ul className=\"list-disc list-inside mt-2\">
                    {validationResults[category].errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  if (isLoading && !isConnected) {
    return (
      <div className=\"flex items-center justify-center h-64\">
        <div className=\"text-center space-y-4\">
          <RefreshCw className=\"w-8 h-8 mx-auto animate-spin\" />
          <p>Connecting to AI services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"max-w-7xl mx-auto p-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold flex items-center gap-2\">
            <Settings className=\"w-8 h-8\" />
            Live AI Parameter Customizer
          </h1>
          <p className=\"text-muted-foreground mt-1\">
            Real-time configuration of AI services with live monitoring
          </p>
        </div>

        <div className=\"flex items-center gap-3\">
          {/* Connection Status */}
          <div className=\"flex items-center gap-2\">
            {isConnected ? (
              <>
                <Wifi className=\"w-4 h-4 text-green-500\" />
                <span className=\"text-sm text-green-600\">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className=\"w-4 h-4 text-red-500\" />
                <span className=\"text-sm text-red-600\">Disconnected</span>
              </>
            )}
          </div>

          {/* Mode Toggle */}
          <div className=\"flex items-center gap-2\">
            <Label htmlFor=\"preview-mode\">Preview Mode</Label>
            <Switch
              id=\"preview-mode\"
              checked={previewMode}
              onCheckedChange={(checked) => {
                setPreviewMode(checked);
                if (session) {
                  initializeSession();
                }
              }}
            />
            {previewMode && <Eye className=\"w-4 h-4 text-blue-500\" />}
          </div>

          {/* Auto-save Toggle */}
          <div className=\"flex items-center gap-2\">
            <Label htmlFor=\"auto-save\">Auto-save</Label>
            <Switch
              id=\"auto-save\"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {errors.length > 0 && (
        <Alert variant=\"destructive\">
          <AlertTriangle className=\"h-4 w-4\" />
          <AlertDescription>
            {errors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <Info className=\"h-4 w-4\" />
          <AlertDescription>
            {warnings.map((warning, i) => (
              <div key={i}>{warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className=\"border-green-500\">
          <CheckCircle className=\"h-4 w-4 text-green-500\" />
          <AlertDescription className=\"text-green-700\">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Interface */}
      <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-6\">
        {/* Sidebar - Quick Actions & Status */}
        <div className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle className=\"text-sm\">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-2\">
              <Button 
                onClick={exportConfiguration}
                variant=\"outline\" 
                size=\"sm\" 
                className=\"w-full justify-start\"
              >
                <Download className=\"w-4 h-4 mr-2\" />
                Export Config
              </Button>
              
              <div className=\"relative\">
                <input
                  type=\"file\"
                  accept=\".json\"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importConfiguration(file);
                  }}
                  className=\"absolute inset-0 opacity-0 cursor-pointer\"
                />
                <Button variant=\"outline\" size=\"sm\" className=\"w-full justify-start\">
                  <Upload className=\"w-4 h-4 mr-2\" />
                  Import Config
                </Button>
              </div>

              <Button 
                onClick={initializeSession}
                variant=\"outline\" 
                size=\"sm\" 
                className=\"w-full justify-start\"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Update History */}
          {updateHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className=\"text-sm flex items-center gap-2\">
                  <History className=\"w-4 h-4\" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent className=\"space-y-2\">
                {updateHistory.slice(0, 5).map((update, i) => (
                  <div key={i} className=\"p-2 bg-muted rounded text-xs space-y-1\">
                    <div className=\"font-medium\">{update.category.replace('_', ' ')}</div>
                    <div className=\"text-muted-foreground\">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </div>
                    <div className=\"flex gap-1\">
                      {update.rollbackToken && (
                        <Button
                          size=\"sm\"
                          variant=\"ghost\"
                          onClick={() => rollbackParameters(update.rollbackToken)}
                          className=\"h-6 text-xs\"
                        >
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Panel - Parameter Configuration */}
        <div className=\"lg:col-span-3\">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className=\"grid w-full grid-cols-4\">
              <TabsTrigger value=\"behavioral_intelligence\" className=\"flex items-center gap-2\">
                <Brain className=\"w-4 h-4\" />
                Behavioral AI
              </TabsTrigger>
              <TabsTrigger value=\"voice_ai\" className=\"flex items-center gap-2\">
                <Mic className=\"w-4 h-4\" />
                Voice AI
              </TabsTrigger>
              <TabsTrigger value=\"rewards\" className=\"flex items-center gap-2\">
                <Trophy className=\"w-4 h-4\" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value=\"deployment\" className=\"flex items-center gap-2\">
                <Zap className=\"w-4 h-4\" />
                Deployment
              </TabsTrigger>
            </TabsList>

            {/* Behavioral Intelligence */}
            <TabsContent value=\"behavioral_intelligence\" className=\"space-y-6\">
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Brain className=\"w-5 h-5\" />
                    Behavioral Intelligence Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure deep learning patterns, psychological profiling, and behavioral analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {configurations.behavioral_intelligence && (
                    renderServicePanel(
                      'behavioral_intelligence',
                      configurations.behavioral_intelligence,
                      {
                        analysisDepth: {
                          type: 'select',
                          options: ['surface', 'moderate', 'deep', 'comprehensive'],
                          description: 'Depth of behavioral pattern analysis',
                          impact: 'performance'
                        },
                        learningRate: {
                          type: 'slider',
                          min: 0.1,
                          max: 1.0,
                          step: 0.05,
                          description: 'Rate at which the system learns from new data',
                          impact: 'accuracy'
                        },
                        confidenceThreshold: {
                          type: 'slider',
                          min: 0.5,
                          max: 0.95,
                          step: 0.05,
                          description: 'Minimum confidence required for insights',
                          impact: 'precision'
                        },
                        psychologicalProfiling: {
                          type: 'boolean',
                          description: 'Enable deep psychological trait analysis',
                          impact: 'privacy',
                          requiresConsent: true
                        }
                      }
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice AI */}
            <TabsContent value=\"voice_ai\" className=\"space-y-6\">
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Mic className=\"w-5 h-5\" />
                    Voice AI Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize voice personality, speech patterns, and contextual responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {configurations.voice_ai && (
                    renderServicePanel(
                      'voice_ai',
                      configurations.voice_ai,
                      {
                        personalityAdaptation: {
                          type: 'slider',
                          min: 0,
                          max: 1,
                          step: 0.1,
                          description: 'How much the voice adapts to user personality',
                          impact: 'user_experience'
                        },
                        responseComplexity: {
                          type: 'select',
                          options: ['simple', 'moderate', 'complex', 'adaptive'],
                          description: 'Complexity level of voice responses',
                          impact: 'comprehension'
                        },
                        emotionalIntelligence: {
                          type: 'slider',
                          min: 0,
                          max: 1,
                          step: 0.1,
                          description: 'Emotional awareness and response capability',
                          impact: 'empathy'
                        },
                        speechRate: {
                          type: 'slider',
                          min: 0.5,
                          max: 2.0,
                          step: 0.1,
                          description: 'Speed of voice delivery',
                          impact: 'comprehension'
                        }
                      }
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rewards System */}
            <TabsContent value=\"rewards\" className=\"space-y-6\">
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Trophy className=\"w-5 h-5\" />
                    AI Rewards System Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize gamification intensity, reward frequency, and motivation strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {configurations.rewards && (
                    renderServicePanel(
                      'rewards',
                      configurations.rewards,
                      {
                        gamificationIntensity: {
                          type: 'slider',
                          min: 0,
                          max: 100,
                          step: 5,
                          description: 'Overall intensity of gamification features',
                          impact: 'engagement'
                        },
                        rewardFrequency: {
                          type: 'select',
                          options: ['minimal', 'balanced', 'frequent', 'abundant'],
                          description: 'How often rewards are given',
                          impact: 'motivation'
                        },
                        personalizationLevel: {
                          type: 'slider',
                          min: 0,
                          max: 1,
                          step: 0.1,
                          description: 'Level of reward personalization',
                          impact: 'relevance'
                        },
                        streakMultiplier: {
                          type: 'slider',
                          min: 1.0,
                          max: 3.0,
                          step: 0.1,
                          description: 'Multiplier for streak-based rewards',
                          impact: 'consistency'
                        }
                      }
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deployment */}
            <TabsContent value=\"deployment\" className=\"space-y-6\">
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Zap className=\"w-5 h-5\" />
                    Deployment Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure deployment strategies, rollback policies, and monitoring settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {configurations.deployment && (
                    renderServicePanel(
                      'deployment',
                      configurations.deployment,
                      {
                        deploymentStrategy: {
                          type: 'select',
                          options: ['immediate', 'gradual', 'canary', 'blue_green'],
                          description: 'Strategy for deploying AI services',
                          impact: 'risk_management'
                        },
                        rollbackStrategy: {
                          type: 'select',
                          options: ['immediate', 'gradual', 'manual'],
                          description: 'Strategy for rolling back failed deployments',
                          impact: 'recovery_time'
                        },
                        autoRollback: {
                          type: 'boolean',
                          description: 'Automatically rollback on failure',
                          impact: 'reliability'
                        },
                        successThreshold: {
                          type: 'slider',
                          min: 0.8,
                          max: 1.0,
                          step: 0.01,
                          description: 'Minimum success rate to continue deployment',
                          impact: 'quality_gate'
                        }
                      }
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Performance Metrics Footer */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className=\"text-sm flex items-center gap-2\">
              <BarChart3 className=\"w-4 h-4\" />
              Performance Impact (Last Hour)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-4 gap-4 text-sm\">
              <div>
                <div className=\"text-muted-foreground\">Response Time</div>
                <div className=\"font-medium\">{performanceMetrics.avgResponseTime || 'N/A'}ms</div>
              </div>
              <div>
                <div className=\"text-muted-foreground\">Success Rate</div>
                <div className=\"font-medium\">{performanceMetrics.successRate || 'N/A'}%</div>
              </div>
              <div>
                <div className=\"text-muted-foreground\">Active Updates</div>
                <div className=\"font-medium\">{Object.values(pendingChanges).reduce((acc, changes) => acc + Object.keys(changes as any).length, 0)}</div>
              </div>
              <div>
                <div className=\"text-muted-foreground\">Session Duration</div>
                <div className=\"font-medium\">
                  {session ? Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000) : 0}m
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveAIParameterCustomizer;