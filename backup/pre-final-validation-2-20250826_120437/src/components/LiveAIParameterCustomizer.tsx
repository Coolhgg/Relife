/**
 * Live AI Parameter Customizer
 * Real-time parameter adjustment with live feedback and monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  Brain,
  Mic,
  Trophy,
  Activity,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
} from 'lucide-react';

interface LiveParameterState {
  coreAI: {
    learningRate: number;
    confidenceThreshold: number;
    patternRecognitionSensitivity: number;
    contextualAwarenessLevel: number;
  };
  voiceAI: {
    personalityAdaptation: number;
    responseComplexity: 'simple' | 'moderate' | 'complex';
    emotionalIntelligence: number;
    speechPatternLearning: boolean;
  };
  behavioralIntelligence: {
    analysisDepth: 'basic' | 'standard' | 'advanced' | 'comprehensive';
    interventionSensitivity: number;
    psychologicalProfiling: boolean;
    predictiveAnalysis: boolean;
  };
  rewardsSystem: {
    personalizationLevel: number;
    gamificationIntensity: number;
    achievementComplexity: 'simple' | 'moderate' | 'complex';
    motivationalBalance: number;
  };
}

interface LiveMetrics {
  responseTime: number;
  accuracy: number;
  userSatisfaction: number;
  systemLoad: number;
}

const LiveAIParameterCustomizer: React.FC = () => {
  const [parameters, setParameters] = useState<LiveParameterState>({
    coreAI: {
      learningRate: 0.7,
      confidenceThreshold: 0.8,
      patternRecognitionSensitivity: 0.6,
      contextualAwarenessLevel: 0.75,
    },
    voiceAI: {
      personalityAdaptation: 0.65,
      responseComplexity: 'moderate',
      emotionalIntelligence: 0.7,
      speechPatternLearning: true,
    },
    behavioralIntelligence: {
      analysisDepth: 'standard',
      interventionSensitivity: 0.6,
      psychologicalProfiling: true,
      predictiveAnalysis: false,
    },
    rewardsSystem: {
      personalizationLevel: 0.8,
      gamificationIntensity: 0.5,
      achievementComplexity: 'moderate',
      motivationalBalance: 0.7,
    },
  });

  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    responseTime: 150,
    accuracy: 0.92,
    userSatisfaction: 0.88,
    systemLoad: 0.45,
  });

  const [isLiveMode, setIsLiveMode] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Simulate live metrics updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        responseTime: Math.max(50, prev.responseTime + (Math.random() - 0.5) * 20),
        accuracy: Math.max(
          0.7,
          Math.min(1, prev.accuracy + (Math.random() - 0.5) * 0.05)
        ),
        userSatisfaction: Math.max(
          0.6,
          Math.min(1, prev.userSatisfaction + (Math.random() - 0.5) * 0.03)
        ),
        systemLoad: Math.max(
          0.2,
          Math.min(0.9, prev.systemLoad + (Math.random() - 0.5) * 0.1)
        ),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const updateParameter = useCallback(
    (category: keyof LiveParameterState, param: string, value: any) => {
      setParameters(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [param]: value,
        },
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasUnsavedChanges(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Live Status and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Parameter Control
              </CardTitle>
              <CardDescription>
                Real-time adjustment with instant feedback
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={isLiveMode} onCheckedChange={setIsLiveMode} />
                <Label>Live Mode</Label>
              </div>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(liveMetrics.responseTime)}ms
              </div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(liveMetrics.accuracy * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(liveMetrics.userSatisfaction * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(liveMetrics.systemLoad * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">System Load</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            You have unsaved changes. Click 'Save Changes' to apply them to the live
            system.
          </AlertDescription>
        </Alert>
      )}

      {/* Core AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Core AI Settings
          </CardTitle>
          <CardDescription>
            Fundamental AI model parameters affecting learning and decision-making
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Learning Rate: {parameters.coreAI.learningRate.toFixed(2)}</Label>
              <Slider
                value={[parameters.coreAI.learningRate]}
                onValueChange={([value]) =>
                  updateParameter('coreAI', 'learningRate', value)
                }
                min={0.1}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label>
                Confidence Threshold: {parameters.coreAI.confidenceThreshold.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.coreAI.confidenceThreshold]}
                onValueChange={([value]) =>
                  updateParameter('coreAI', 'confidenceThreshold', value)
                }
                min={0.5}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label>
                Pattern Recognition Sensitivity:{' '}
                {parameters.coreAI.patternRecognitionSensitivity.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.coreAI.patternRecognitionSensitivity]}
                onValueChange={([value]) =>
                  updateParameter('coreAI', 'patternRecognitionSensitivity', value)
                }
                min={0.1}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label>
                Contextual Awareness Level:{' '}
                {parameters.coreAI.contextualAwarenessLevel.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.coreAI.contextualAwarenessLevel]}
                onValueChange={([value]) =>
                  updateParameter('coreAI', 'contextualAwarenessLevel', value)
                }
                min={0.1}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice AI Configuration
          </CardTitle>
          <CardDescription>
            Voice personality and response configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>
                Personality Adaptation:{' '}
                {parameters.voiceAI.personalityAdaptation.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.voiceAI.personalityAdaptation]}
                onValueChange={([value]) =>
                  updateParameter('voiceAI', 'personalityAdaptation', value)
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Response Complexity</Label>
              <Select
                value={parameters.voiceAI.responseComplexity}
                onValueChange={value =>
                  updateParameter('voiceAI', 'responseComplexity', value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Emotional Intelligence:{' '}
                {parameters.voiceAI.emotionalIntelligence.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.voiceAI.emotionalIntelligence]}
                onValueChange={([value]) =>
                  updateParameter('voiceAI', 'emotionalIntelligence', value)
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={parameters.voiceAI.speechPatternLearning}
                onCheckedChange={checked =>
                  updateParameter('voiceAI', 'speechPatternLearning', checked)
                }
              />
              <Label>Speech Pattern Learning</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Behavioral Intelligence
          </CardTitle>
          <CardDescription>
            Advanced behavioral analysis and intervention settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Analysis Depth</Label>
              <Select
                value={parameters.behavioralIntelligence.analysisDepth}
                onValueChange={value =>
                  updateParameter('behavioralIntelligence', 'analysisDepth', value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Intervention Sensitivity:{' '}
                {parameters.behavioralIntelligence.interventionSensitivity.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.behavioralIntelligence.interventionSensitivity]}
                onValueChange={([value]) =>
                  updateParameter(
                    'behavioralIntelligence',
                    'interventionSensitivity',
                    value
                  )
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={parameters.behavioralIntelligence.psychologicalProfiling}
                onCheckedChange={checked =>
                  updateParameter(
                    'behavioralIntelligence',
                    'psychologicalProfiling',
                    checked
                  )
                }
              />
              <Label>Psychological Profiling</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={parameters.behavioralIntelligence.predictiveAnalysis}
                onCheckedChange={checked =>
                  updateParameter(
                    'behavioralIntelligence',
                    'predictiveAnalysis',
                    checked
                  )
                }
              />
              <Label>Predictive Analysis</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Rewards System
          </CardTitle>
          <CardDescription>Gamification and motivation configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>
                Personalization Level:{' '}
                {parameters.rewardsSystem.personalizationLevel.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.rewardsSystem.personalizationLevel]}
                onValueChange={([value]) =>
                  updateParameter('rewardsSystem', 'personalizationLevel', value)
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label>
                Gamification Intensity:{' '}
                {parameters.rewardsSystem.gamificationIntensity.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.rewardsSystem.gamificationIntensity]}
                onValueChange={([value]) =>
                  updateParameter('rewardsSystem', 'gamificationIntensity', value)
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Achievement Complexity</Label>
              <Select
                value={parameters.rewardsSystem.achievementComplexity}
                onValueChange={value =>
                  updateParameter('rewardsSystem', 'achievementComplexity', value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Motivational Balance:{' '}
                {parameters.rewardsSystem.motivationalBalance.toFixed(2)}
              </Label>
              <Slider
                value={[parameters.rewardsSystem.motivationalBalance]}
                onValueChange={([value]) =>
                  updateParameter('rewardsSystem', 'motivationalBalance', value)
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveAIParameterCustomizer;
