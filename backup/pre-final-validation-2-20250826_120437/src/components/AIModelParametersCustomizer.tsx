/**
 * AI Model Parameters Customizer
 * Comprehensive interface for customizing all AI model parameters in the Relife app
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
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
} from 'lucide-react';

// Import AI configuration types
import type {
  AISettings,
  PlatformConfig,
  MonitoringConfig,
  PhaseConfig,
} from '../config/ai-deployment-config';
import {
  DEFAULT_AI_SETTINGS,
  DEFAULT_PLATFORM_CONFIG,
  MONITORING_CONFIG,
  DEPLOYMENT_PHASES,
} from '../config/ai-deployment-config';

// Voice AI types
import type {
  VoicePersonality,
  VoiceLearningData,
} from '../services/voice-ai-enhanced';

interface AIModelParametersCustomizerProps {
  onParametersChange?: (parameters: AIConfigurationState) => void;
  onSave?: (parameters: AIConfigurationState) => Promise<void>;
  onReset?: () => void;
  onExport?: (parameters: AIConfigurationState) => void;
  onImport?: (file: File) => Promise<AIConfigurationState>;
  currentUserId?: string;
  isLoading?: boolean;
}

interface AIConfigurationState {
  aiSettings: AISettings;
  platformConfig: PlatformConfig;
  monitoringConfig: MonitoringConfig;
  voiceSettings: {
    contextualResponseEnabled: boolean;
    aiEnhancementEnabled: boolean;
    premiumAudioEnabled: boolean;
    learningEnabled: boolean;
    personalityAdaptation: number; // 0-1
    responseComplexity: 'simple' | 'moderate' | 'complex';
    emotionalIntelligence: number; // 0-1
  };
  behavioralIntelligence: {
    analysisDepth: 'basic' | 'standard' | 'advanced' | 'comprehensive';
    patternRecognitionSensitivity: number; // 0-1
    psychologicalProfilingEnabled: boolean;
    predictiveAnalysisEnabled: boolean;
    contextualFactorsWeight: number; // 0-1
    anomalyDetectionThreshold: number; // 0-1
    interventionTriggerLevel: number; // 0-1
  };
  rewardsSystem: {
    personalizationLevel: number; // 0-1
    achievementComplexity: 'simple' | 'moderate' | 'complex';
    motivationalFactorWeighting: {
      achievement: number;
      autonomy: number;
      mastery: number;
      purpose: number;
      social: number;
    };
    habitFormationSupport: number; // 0-1
    gamificationIntensity: number; // 0-1
  };
  deploymentSettings: {
    enabledPhases: number[];
    automaticDeployment: boolean;
    rollbackStrategy: 'conservative' | 'balanced' | 'aggressive';
    testingSuiteLevel: 'basic' | 'standard' | 'comprehensive';
  };
}

const AIModelParametersCustomizer: React.FC<AIModelParametersCustomizerProps> = ({
  onParametersChange,
  onSave,
  onReset,
  onExport,
  onImport,
  currentUserId,
  isLoading = false,
}) => {
  const [config, setConfig] = useState<AIConfigurationState>({
    aiSettings: { ...DEFAULT_AI_SETTINGS },
    platformConfig: { ...DEFAULT_PLATFORM_CONFIG },
    monitoringConfig: { ...MONITORING_CONFIG },
    voiceSettings: {
      contextualResponseEnabled: true,
      aiEnhancementEnabled: true,
      premiumAudioEnabled: false,
      learningEnabled: true,
      personalityAdaptation: 0.7,
      responseComplexity: 'moderate',
      emotionalIntelligence: 0.8,
    },
    behavioralIntelligence: {
      analysisDepth: 'standard',
      patternRecognitionSensitivity: 0.7,
      psychologicalProfilingEnabled: true,
      predictiveAnalysisEnabled: true,
      contextualFactorsWeight: 0.6,
      anomalyDetectionThreshold: 0.8,
      interventionTriggerLevel: 0.7,
    },
    rewardsSystem: {
      personalizationLevel: 0.8,
      achievementComplexity: 'moderate',
      motivationalFactorWeighting: {
        achievement: 0.8,
        autonomy: 0.6,
        mastery: 0.7,
        purpose: 0.5,
        social: 0.4,
      },
      habitFormationSupport: 0.8,
      gamificationIntensity: 0.6,
    },
    deploymentSettings: {
      enabledPhases: [1, 2, 3, 4, 5],
      automaticDeployment: false,
      rollbackStrategy: 'balanced',
      testingSuiteLevel: 'standard',
    },
  });

  const [activeTab, setActiveTab] = useState('core');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );

  useEffect(() => {
    onParametersChange?.(config);
    setHasUnsavedChanges(true);
  }, [config, onParametersChange]);

  const updateConfig = (path: string, value: unknown) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: unknown = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaveStatus('saving');
    try {
      await onSave(config);
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    setConfig({
      aiSettings: { ...DEFAULT_AI_SETTINGS },
      platformConfig: { ...DEFAULT_PLATFORM_CONFIG },
      monitoringConfig: { ...MONITORING_CONFIG },
      voiceSettings: {
        contextualResponseEnabled: true,
        aiEnhancementEnabled: true,
        premiumAudioEnabled: false,
        learningEnabled: true,
        personalityAdaptation: 0.7,
        responseComplexity: 'moderate',
        emotionalIntelligence: 0.8,
      },
      behavioralIntelligence: {
        analysisDepth: 'standard',
        patternRecognitionSensitivity: 0.7,
        psychologicalProfilingEnabled: true,
        predictiveAnalysisEnabled: true,
        contextualFactorsWeight: 0.6,
        anomalyDetectionThreshold: 0.8,
        interventionTriggerLevel: 0.7,
      },
      rewardsSystem: {
        personalizationLevel: 0.8,
        achievementComplexity: 'moderate',
        motivationalFactorWeighting: {
          achievement: 0.8,
          autonomy: 0.6,
          mastery: 0.7,
          purpose: 0.5,
          social: 0.4,
        },
        habitFormationSupport: 0.8,
        gamificationIntensity: 0.6,
      },
      deploymentSettings: {
        enabledPhases: [1, 2, 3, 4, 5],
        automaticDeployment: false,
        rollbackStrategy: 'balanced',
        testingSuiteLevel: 'standard',
      },
    });
    onReset?.();
    setHasUnsavedChanges(false);
  };

  const handleExport = () => {
    onExport?.(config);
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-config-${currentUserId || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;

    try {
      const importedConfig = await onImport(file);
      setConfig(importedConfig);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to import configuration:', error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Model Parameters</h1>
            <p className="text-muted-foreground">
              Customize advanced AI behavior, intelligence, and learning systems
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={hasUnsavedChanges ? 'destructive' : 'secondary'}>
            {hasUnsavedChanges ? 'Unsaved Changes' : 'Saved'}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('config-import')?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <input
              id="config-import"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isLoading || saveStatus === 'saving'}
            className="min-w-[100px]"
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved!'
                : 'Save'}
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to save configuration. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="core" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Core AI
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice AI
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Behavioral
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="deployment" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Deployment
          </TabsTrigger>
        </TabsList>

        {/* Core AI Settings Tab */}
        <TabsContent value="core" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Core AI Parameters
              </CardTitle>
              <CardDescription>
                Fundamental AI behavior and learning settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pattern Recognition Sensitivity */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Pattern Recognition Sensitivity
                </Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[
                      config.aiSettings.patternRecognitionSensitivity === 'low'
                        ? 0.3
                        : config.aiSettings.patternRecognitionSensitivity === 'medium'
                          ? 0.6
                          : 0.9,
                    ]}
                    onValueChange={value => {
                      const level =
                        value[0] < 0.4 ? 'low' : value[0] < 0.7 ? 'medium' : 'high';
                      updateConfig('aiSettings.patternRecognitionSensitivity', level);
                    }}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  How sensitive the AI is to detecting patterns in your behavior
                </p>
              </div>

              {/* Learning Rate */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Learning Rate</Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.aiSettings.learningRate]}
                    onValueChange={value =>
                      updateConfig('aiSettings.learningRate', value[0])
                    }
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.1 (Slow)</span>
                    <span>{config.aiSettings.learningRate}</span>
                    <span>0.9 (Fast)</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  How quickly the AI adapts to your behavior changes
                </p>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Confidence Threshold</Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.aiSettings.confidenceThreshold]}
                    onValueChange={value =>
                      updateConfig('aiSettings.confidenceThreshold', value[0])
                    }
                    min={0.5}
                    max={0.95}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.5 (Permissive)</span>
                    <span>{config.aiSettings.confidenceThreshold}</span>
                    <span>0.95 (Strict)</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Minimum confidence level for AI recommendations and interventions
                </p>
              </div>

              {/* Recommendation Frequency */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Recommendation Frequency
                </Label>
                <Select
                  value={config.aiSettings.recommendationFrequency}
                  onValueChange={value =>
                    updateConfig('aiSettings.recommendationFrequency', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="adaptive">Adaptive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How often the AI provides recommendations and insights
                </p>
              </div>

              {/* Privacy Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Privacy Level</Label>
                <Select
                  value={config.aiSettings.privacyLevel}
                  onValueChange={value =>
                    updateConfig('aiSettings.privacyLevel', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="enhanced">Enhanced</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Level of data protection and privacy controls
                </p>
              </div>

              <Separator />

              {/* Feature Toggles */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">AI Features</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Behavioral Intelligence</Label>
                      <p className="text-xs text-muted-foreground">
                        Advanced behavior analysis
                      </p>
                    </div>
                    <Switch
                      checked={config.aiSettings.enabledFeatures.behavioralIntelligence}
                      onCheckedChange={checked =>
                        updateConfig(
                          'aiSettings.enabledFeatures.behavioralIntelligence',
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Recommendation Engine</Label>
                      <p className="text-xs text-muted-foreground">
                        Smart recommendations
                      </p>
                    </div>
                    <Switch
                      checked={config.aiSettings.enabledFeatures.recommendationEngine}
                      onCheckedChange={checked =>
                        updateConfig(
                          'aiSettings.enabledFeatures.recommendationEngine',
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Predictive Analytics</Label>
                      <p className="text-xs text-muted-foreground">
                        Future behavior prediction
                      </p>
                    </div>
                    <Switch
                      checked={config.aiSettings.enabledFeatures.predictiveAnalytics}
                      onCheckedChange={checked =>
                        updateConfig(
                          'aiSettings.enabledFeatures.predictiveAnalytics',
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Psychological Profiling</Label>
                      <p className="text-xs text-muted-foreground">
                        Personality-based insights
                      </p>
                    </div>
                    <Switch
                      checked={config.aiSettings.enabledFeatures.psychologicalProfiling}
                      onCheckedChange={checked =>
                        updateConfig(
                          'aiSettings.enabledFeatures.psychologicalProfiling',
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice AI Settings Tab */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice AI Configuration
              </CardTitle>
              <CardDescription>
                Advanced voice personality and contextual response settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Contextual Responses</Label>
                    <p className="text-xs text-muted-foreground">
                      Context-aware voice messages
                    </p>
                  </div>
                  <Switch
                    checked={config.voiceSettings.contextualResponseEnabled}
                    onCheckedChange={checked =>
                      updateConfig('voiceSettings.contextualResponseEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">AI Enhancement</Label>
                    <p className="text-xs text-muted-foreground">
                      GPT-powered voice enhancement
                    </p>
                  </div>
                  <Switch
                    checked={config.voiceSettings.aiEnhancementEnabled}
                    onCheckedChange={checked =>
                      updateConfig('voiceSettings.aiEnhancementEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Premium Audio</Label>
                    <p className="text-xs text-muted-foreground">
                      ElevenLabs voice synthesis
                    </p>
                  </div>
                  <Switch
                    checked={config.voiceSettings.premiumAudioEnabled}
                    onCheckedChange={checked =>
                      updateConfig('voiceSettings.premiumAudioEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Voice Learning</Label>
                    <p className="text-xs text-muted-foreground">
                      Adaptive voice optimization
                    </p>
                  </div>
                  <Switch
                    checked={config.voiceSettings.learningEnabled}
                    onCheckedChange={checked =>
                      updateConfig('voiceSettings.learningEnabled', checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Personality Adaptation */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Personality Adaptation Level
                </Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.voiceSettings.personalityAdaptation]}
                    onValueChange={value =>
                      updateConfig('voiceSettings.personalityAdaptation', value[0])
                    }
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Static</span>
                    <span>
                      {Math.round(config.voiceSettings.personalityAdaptation * 100)}%
                    </span>
                    <span>Highly Adaptive</span>
                  </div>
                </div>
              </div>

              {/* Response Complexity */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Response Complexity</Label>
                <Select
                  value={config.voiceSettings.responseComplexity}
                  onValueChange={value =>
                    updateConfig('voiceSettings.responseComplexity', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Emotional Intelligence */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Emotional Intelligence</Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.voiceSettings.emotionalIntelligence]}
                    onValueChange={value =>
                      updateConfig('voiceSettings.emotionalIntelligence', value[0])
                    }
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Basic</span>
                    <span>
                      {Math.round(config.voiceSettings.emotionalIntelligence * 100)}%
                    </span>
                    <span>Advanced</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavioral Intelligence Tab */}
        <TabsContent value="behavioral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Behavioral Intelligence Configuration
              </CardTitle>
              <CardDescription>
                Advanced behavioral analysis and psychological profiling settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analysis Depth */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Analysis Depth</Label>
                <Select
                  value={config.behavioralIntelligence.analysisDepth}
                  onValueChange={value =>
                    updateConfig('behavioralIntelligence.analysisDepth', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Surface patterns only</SelectItem>
                    <SelectItem value="standard">
                      Standard - Multi-dimensional analysis
                    </SelectItem>
                    <SelectItem value="advanced">
                      Advanced - Deep psychological insights
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      Comprehensive - Full behavioral modeling
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Behavioral Analysis Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Psychological Profiling</Label>
                    <p className="text-xs text-muted-foreground">
                      Big Five personality traits
                    </p>
                  </div>
                  <Switch
                    checked={
                      config.behavioralIntelligence.psychologicalProfilingEnabled
                    }
                    onCheckedChange={checked =>
                      updateConfig(
                        'behavioralIntelligence.psychologicalProfilingEnabled',
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Predictive Analysis</Label>
                    <p className="text-xs text-muted-foreground">
                      Future behavior prediction
                    </p>
                  </div>
                  <Switch
                    checked={config.behavioralIntelligence.predictiveAnalysisEnabled}
                    onCheckedChange={checked =>
                      updateConfig(
                        'behavioralIntelligence.predictiveAnalysisEnabled',
                        checked
                      )
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Advanced Parameters */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Advanced Parameters</h4>

                {/* Pattern Recognition Sensitivity */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Pattern Recognition Sensitivity
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[
                        config.behavioralIntelligence.patternRecognitionSensitivity,
                      ]}
                      onValueChange={value =>
                        updateConfig(
                          'behavioralIntelligence.patternRecognitionSensitivity',
                          value[0]
                        )
                      }
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Conservative</span>
                      <span>
                        {Math.round(
                          config.behavioralIntelligence.patternRecognitionSensitivity *
                            100
                        )}
                        %
                      </span>
                      <span>Aggressive</span>
                    </div>
                  </div>
                </div>

                {/* Contextual Factors Weight */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Contextual Factors Weight
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[config.behavioralIntelligence.contextualFactorsWeight]}
                      onValueChange={value =>
                        updateConfig(
                          'behavioralIntelligence.contextualFactorsWeight',
                          value[0]
                        )
                      }
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low Impact</span>
                      <span>
                        {Math.round(
                          config.behavioralIntelligence.contextualFactorsWeight * 100
                        )}
                        %
                      </span>
                      <span>High Impact</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How much environmental and social factors influence analysis
                  </p>
                </div>

                {/* Anomaly Detection Threshold */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Anomaly Detection Threshold
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[config.behavioralIntelligence.anomalyDetectionThreshold]}
                      onValueChange={value =>
                        updateConfig(
                          'behavioralIntelligence.anomalyDetectionThreshold',
                          value[0]
                        )
                      }
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Sensitive</span>
                      <span>
                        {Math.round(
                          config.behavioralIntelligence.anomalyDetectionThreshold * 100
                        )}
                        %
                      </span>
                      <span>Strict</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Threshold for detecting unusual behavior patterns
                  </p>
                </div>

                {/* Intervention Trigger Level */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Intervention Trigger Level
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[config.behavioralIntelligence.interventionTriggerLevel]}
                      onValueChange={value =>
                        updateConfig(
                          'behavioralIntelligence.interventionTriggerLevel',
                          value[0]
                        )
                      }
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Proactive</span>
                      <span>
                        {Math.round(
                          config.behavioralIntelligence.interventionTriggerLevel * 100
                        )}
                        %
                      </span>
                      <span>Conservative</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When the AI should suggest behavioral interventions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards System Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                AI Rewards System Configuration
              </CardTitle>
              <CardDescription>
                Personalized achievement and motivation system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personalization Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Personalization Level</Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.rewardsSystem.personalizationLevel]}
                    onValueChange={value =>
                      updateConfig('rewardsSystem.personalizationLevel', value[0])
                    }
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Generic</span>
                    <span>
                      {Math.round(config.rewardsSystem.personalizationLevel * 100)}%
                    </span>
                    <span>Highly Personal</span>
                  </div>
                </div>
              </div>

              {/* Achievement Complexity */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Achievement Complexity</Label>
                <Select
                  value={config.rewardsSystem.achievementComplexity}
                  onValueChange={value =>
                    updateConfig('rewardsSystem.achievementComplexity', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple - Basic milestones</SelectItem>
                    <SelectItem value="moderate">
                      Moderate - Multi-step achievements
                    </SelectItem>
                    <SelectItem value="complex">
                      Complex - Intricate reward chains
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Motivational Factor Weighting */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Motivational Factor Weighting</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust how much each motivational factor influences reward generation
                </p>

                <div className="space-y-4">
                  {Object.entries(config.rewardsSystem.motivationalFactorWeighting).map(
                    ([factor, weight]) => (
                      <div key={factor} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="capitalize font-medium">{factor}</Label>
                          <Badge variant="outline">{Math.round(weight * 100)}%</Badge>
                        </div>
                        <Slider
                          value={[weight]}
                          onValueChange={value =>
                            updateConfig(
                              `rewardsSystem.motivationalFactorWeighting.${factor}`,
                              value[0]
                            )
                          }
                          max={1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              <Separator />

              {/* Additional Settings */}
              <div className="space-y-6">
                {/* Habit Formation Support */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Habit Formation Support
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[config.rewardsSystem.habitFormationSupport]}
                      onValueChange={value =>
                        updateConfig('rewardsSystem.habitFormationSupport', value[0])
                      }
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimal</span>
                      <span>
                        {Math.round(config.rewardsSystem.habitFormationSupport * 100)}%
                      </span>
                      <span>Maximum</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How much the system helps with habit formation and maintenance
                  </p>
                </div>

                {/* Gamification Intensity */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Gamification Intensity
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[config.rewardsSystem.gamificationIntensity]}
                      onValueChange={value =>
                        updateConfig('rewardsSystem.gamificationIntensity', value[0])
                      }
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Subtle</span>
                      <span>
                        {Math.round(config.rewardsSystem.gamificationIntensity * 100)}%
                      </span>
                      <span>Intense</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Level of game-like elements in the reward system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Integration Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Platform Integration Settings
              </CardTitle>
              <CardDescription>
                Cross-platform data integration and privacy controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Frequency */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Sync Frequency (minutes)
                </Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.platformConfig.syncFrequency]}
                    onValueChange={value =>
                      updateConfig('platformConfig.syncFrequency', value[0])
                    }
                    min={5}
                    max={180}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 min</span>
                    <span>{config.platformConfig.syncFrequency} min</span>
                    <span>3 hours</span>
                  </div>
                </div>
              </div>

              {/* Data Retention */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Data Retention (days)</Label>
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <Slider
                    value={[config.platformConfig.dataRetentionDays]}
                    onValueChange={value =>
                      updateConfig('platformConfig.dataRetentionDays', value[0])
                    }
                    min={7}
                    max={365}
                    step={7}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 week</span>
                    <span>{config.platformConfig.dataRetentionDays} days</span>
                    <span>1 year</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Platform Settings */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Platform Integrations</h4>

                {/* Health Apps */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Health Apps</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Apple Health</Label>
                      <Switch
                        checked={
                          config.platformConfig.platformSettings.healthApps.appleHealth
                        }
                        onCheckedChange={checked =>
                          updateConfig(
                            'platformConfig.platformSettings.healthApps.appleHealth',
                            checked
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Google Fit</Label>
                      <Switch
                        checked={
                          config.platformConfig.platformSettings.healthApps.googleFit
                        }
                        onCheckedChange={checked =>
                          updateConfig(
                            'platformConfig.platformSettings.healthApps.googleFit',
                            checked
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Fitbit</Label>
                      <Switch
                        checked={
                          config.platformConfig.platformSettings.healthApps.fitbit
                        }
                        onCheckedChange={checked =>
                          updateConfig(
                            'platformConfig.platformSettings.healthApps.fitbit',
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Calendar Integration */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Calendar Integration</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Google Calendar</Label>
                      <Switch
                        checked={
                          config.platformConfig.platformSettings.calendar.googleCalendar
                        }
                        onCheckedChange={checked =>
                          updateConfig(
                            'platformConfig.platformSettings.calendar.googleCalendar',
                            checked
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Outlook</Label>
                      <Switch
                        checked={
                          config.platformConfig.platformSettings.calendar.outlook
                        }
                        onCheckedChange={checked =>
                          updateConfig(
                            'platformConfig.platformSettings.calendar.outlook',
                            checked
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Apple Calendar</Label>
                      <Switch
                        checked={
                          config.platformConfig.platformSettings.calendar.appleCalendar
                        }
                        onCheckedChange={checked =>
                          updateConfig(
                            'platformConfig.platformSettings.calendar.appleCalendar',
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Weather Integration */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Weather Integration</Label>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Weather Integration Enabled</Label>
                    <Switch
                      checked={config.platformConfig.platformSettings.weather.enabled}
                      onCheckedChange={checked =>
                        updateConfig(
                          'platformConfig.platformSettings.weather.enabled',
                          checked
                        )
                      }
                    />
                  </div>
                  {config.platformConfig.platformSettings.weather.enabled && (
                    <>
                      <Select
                        value={config.platformConfig.platformSettings.weather.provider}
                        onValueChange={value =>
                          updateConfig(
                            'platformConfig.platformSettings.weather.provider',
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Weather Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openweather">OpenWeather</SelectItem>
                          <SelectItem value="weatherapi">WeatherAPI</SelectItem>
                          <SelectItem value="darksky">Dark Sky</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-2">
                        <Label>Forecast Days</Label>
                        <Slider
                          value={[
                            config.platformConfig.platformSettings.weather.forecastDays,
                          ]}
                          onValueChange={value =>
                            updateConfig(
                              'platformConfig.platformSettings.weather.forecastDays',
                              value[0]
                            )
                          }
                          min={1}
                          max={14}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-muted-foreground">
                          {config.platformConfig.platformSettings.weather.forecastDays}{' '}
                          days
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Settings Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Deployment Configuration
              </CardTitle>
              <CardDescription>
                Phased deployment and rollback strategy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deployment Phases */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Enabled Deployment Phases
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {DEPLOYMENT_PHASES.map(phase => (
                    <div
                      key={phase.phase}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Phase {phase.phase}</Badge>
                          <Label className="font-medium">{phase.name}</Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Services: {phase.services.join(', ')}
                        </p>
                      </div>
                      <Switch
                        checked={config.deploymentSettings.enabledPhases.includes(
                          phase.phase
                        )}
                        onCheckedChange={checked => {
                          const newPhases = checked
                            ? [...config.deploymentSettings.enabledPhases, phase.phase]
                            : config.deploymentSettings.enabledPhases.filter(
                                p => p !== phase.phase
                              );
                          updateConfig(
                            'deploymentSettings.enabledPhases',
                            newPhases.sort()
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Deployment Strategy */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Automatic Deployment</Label>
                  <Switch
                    checked={config.deploymentSettings.automaticDeployment}
                    onCheckedChange={checked =>
                      updateConfig('deploymentSettings.automaticDeployment', checked)
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically deploy phases when dependencies are met
                </p>
              </div>

              {/* Rollback Strategy */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Rollback Strategy</Label>
                <Select
                  value={config.deploymentSettings.rollbackStrategy}
                  onValueChange={value =>
                    updateConfig('deploymentSettings.rollbackStrategy', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">
                      Conservative - Rollback on any issue
                    </SelectItem>
                    <SelectItem value="balanced">
                      Balanced - Rollback on significant issues
                    </SelectItem>
                    <SelectItem value="aggressive">
                      Aggressive - Rollback only on critical failures
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Testing Suite Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Testing Suite Level</Label>
                <Select
                  value={config.deploymentSettings.testingSuiteLevel}
                  onValueChange={value =>
                    updateConfig('deploymentSettings.testingSuiteLevel', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Essential tests only</SelectItem>
                    <SelectItem value="standard">
                      Standard - Comprehensive testing
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      Comprehensive - Full test coverage
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Monitoring Configuration */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Monitoring & KPIs</h4>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Reporting Frequency</Label>
                  <Select
                    value={config.monitoringConfig.reportingFrequency}
                    onValueChange={value =>
                      updateConfig('monitoringConfig.reportingFrequency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Realtime</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Dashboard Update Interval (seconds)
                  </Label>
                  <div className="px-3 py-2 bg-muted/50 rounded-lg">
                    <Slider
                      value={[config.monitoringConfig.dashboardUpdateInterval]}
                      onValueChange={value =>
                        updateConfig(
                          'monitoringConfig.dashboardUpdateInterval',
                          value[0]
                        )
                      }
                      min={30}
                      max={3600}
                      step={30}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>30s</span>
                      <span>{config.monitoringConfig.dashboardUpdateInterval}s</span>
                      <span>1h</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Configuration Summary
          </CardTitle>
          <CardDescription>
            Overview of your current AI model parameter settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(config.aiSettings.learningRate * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Learning Rate</div>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {
                  Object.values(config.aiSettings.enabledFeatures).filter(Boolean)
                    .length
                }
              </div>
              <div className="text-sm text-muted-foreground">Active Features</div>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {config.deploymentSettings.enabledPhases.length}
              </div>
              <div className="text-sm text-muted-foreground">Enabled Phases</div>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(config.aiSettings.confidenceThreshold * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Confidence Threshold</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These parameters control the behavior of the AI systems throughout your Relife
          app. Changes take effect after saving and may require a restart of certain
          services. For optimal performance, consider your usage patterns when adjusting
          learning rates and sensitivity levels.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AIModelParametersCustomizer;
