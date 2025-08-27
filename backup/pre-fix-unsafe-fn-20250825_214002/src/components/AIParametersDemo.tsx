/**
 * AI Parameters Demo Component
 * Demonstrates the AI Model Parameters Customizer with example usage
 */

import React, { useState } from 'react';
import AIModelParametersCustomizer from './AIModelParametersCustomizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  Lightbulb, 
  Code, 
  BookOpen, 
  CheckCircle,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';

interface AIConfigurationState {
  aiSettings: any;
  platformConfig: any;
  monitoringConfig: any;
  voiceSettings: any;
  behavioralIntelligence: any;
  rewardsSystem: any;
  deploymentSettings: any;
}

const AIParametersDemo: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<AIConfigurationState | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);

  const handleParametersChange = (parameters: AIConfigurationState) => {
    setCurrentConfig(parameters);
  };

  const handleSave = async (parameters: AIConfigurationState): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call to save parameters
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would save to your backend
      localStorage.setItem('ai-model-parameters', JSON.stringify(parameters));
      
      setSaveStatus('success');
      console.log('AI parameters saved:', parameters);
    } catch (error) {
      setSaveStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('ai-model-parameters');
    setSaveStatus('idle');
    console.log('AI parameters reset to defaults');
  };

  const handleExport = (parameters: AIConfigurationState) => {
    console.log('Exporting AI parameters:', parameters);
  };

  const handleImport = async (file: File): Promise<AIConfigurationState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          resolve(config);
        } catch (error) {
          reject(new Error('Invalid configuration file'));
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Model Parameters Customizer
              </h1>
              <p className="text-xl text-muted-foreground">
                Advanced AI Configuration for Relife Smart Alarm System
              </p>
            </div>
          </div>
          
          {saveStatus === 'success' && (
            <Alert className="max-w-md mx-auto border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                AI parameters saved successfully!
              </AlertDescription>
            </Alert>
          )}
          
          {saveStatus === 'error' && (
            <Alert className="max-w-md mx-auto" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to save AI parameters. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Information Tabs */}
        <Tabs defaultValue="overview" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>What is the AI Model Parameters Customizer?</CardTitle>
                <CardDescription>
                  A comprehensive interface for configuring all AI systems in the Relife app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The AI Model Parameters Customizer provides fine-grained control over six main AI systems:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Core AI Settings
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Learning rate, confidence thresholds, pattern recognition sensitivity
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Voice AI Enhancement
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Contextual responses, personality adaptation, emotional intelligence
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Behavioral Intelligence
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Psychological profiling, pattern analysis, anomaly detection
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Rewards System
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Personalization levels, motivational factors, gamification intensity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  Comprehensive AI configuration capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Configuration Management</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Real-time parameter adjustment</li>
                      <li>• Save/load configurations</li>
                      <li>• Export/import settings</li>
                      <li>• Reset to defaults</li>
                      <li>• Change tracking</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">AI System Controls</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Learning rate adjustment</li>
                      <li>• Sensitivity tuning</li>
                      <li>• Feature toggles</li>
                      <li>• Threshold configuration</li>
                      <li>• Deployment management</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Voice AI Customization</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Personality adaptation levels</li>
                      <li>• Response complexity control</li>
                      <li>• Emotional intelligence tuning</li>
                      <li>• Premium audio settings</li>
                      <li>• Learning preferences</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Platform Integration</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Cross-platform sync settings</li>
                      <li>• Privacy level controls</li>
                      <li>• Data retention policies</li>
                      <li>• Health app integration</li>
                      <li>• Calendar synchronization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
                <CardDescription>
                  Step-by-step guide to customizing AI parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Badge className="rounded-full w-8 h-8 flex items-center justify-center">1</Badge>
                    <div>
                      <h4 className="font-semibold">Navigate Through Tabs</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the six tabs (Core AI, Voice AI, Behavioral, Rewards, Platforms, Deployment) to access different AI system settings.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Badge className="rounded-full w-8 h-8 flex items-center justify-center">2</Badge>
                    <div>
                      <h4 className="font-semibold">Adjust Parameters</h4>
                      <p className="text-sm text-muted-foreground">
                        Use sliders, toggles, and dropdowns to modify AI behavior. Real-time feedback shows the impact of your changes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Badge className="rounded-full w-8 h-8 flex items-center justify-center">3</Badge>
                    <div>
                      <h4 className="font-semibold">Save Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        Click "Save" to apply your changes. The system will validate and deploy the new configuration.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Badge className="rounded-full w-8 h-8 flex items-center justify-center">4</Badge>
                    <div>
                      <h4 className="font-semibold">Monitor Performance</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the configuration summary and monitoring tools to track how your changes affect AI performance.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Component API</CardTitle>
                <CardDescription>
                  Props and integration details for developers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Props</h4>
                    <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                      <div>onParametersChange?: (parameters: AIConfigurationState) =&gt; void</div>
                      <div>onSave?: (parameters: AIConfigurationState) =&gt; Promise&lt;void&gt;</div>
                      <div>onReset?: () =&gt; void</div>
                      <div>onExport?: (parameters: AIConfigurationState) =&gt; void</div>
                      <div>onImport?: (file: File) =&gt; Promise&lt;AIConfigurationState&gt;</div>
                      <div>currentUserId?: string</div>
                      <div>isLoading?: boolean</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Example Usage</h4>
                    <div className="bg-muted p-4 rounded-lg text-sm">
                      <pre className="text-xs">
{`<AIModelParametersCustomizer
  onParametersChange={handleParametersChange}
  onSave={handleSave}
  onReset={handleReset}
  onExport={handleExport}
  onImport={handleImport}
  currentUserId="user123"
  isLoading={isLoading}
/>`}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Main Component */}
        <AIModelParametersCustomizer
          onParametersChange={handleParametersChange}
          onSave={handleSave}
          onReset={handleReset}
          onExport={handleExport}
          onImport={handleImport}
          currentUserId="demo-user"
          isLoading={isLoading}
        />

        {/* Current Configuration Display */}
        {currentConfig && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Current Configuration Preview</CardTitle>
              <CardDescription>
                Live preview of your AI parameter settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(currentConfig.aiSettings.learningRate * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Learning Rate</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(currentConfig.voiceSettings.personalityAdaptation * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Voice Adaptation</div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(currentConfig.behavioralIntelligence.patternRecognitionSensitivity * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Pattern Sensitivity</div>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(currentConfig.rewardsSystem.personalizationLevel * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Reward Personalization</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIParametersDemo;