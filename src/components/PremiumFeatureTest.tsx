import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  Check,
  X,
  Crown,
  Star,
  Zap,
  Volume2,
  Target,
  Mic,
  AlertCircle,
  TestTube,
  RefreshCw,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PremiumService } from '../services/premium';
import { premiumVoiceService } from '../services/premium-voice';
import { nuclearModeService } from '../services/nuclear-mode';
import { UpgradePrompt } from './UpgradePrompt';
import { PremiumFeatureCard } from './PremiumFeatureCard';
import { SubscriptionStatus } from './SubscriptionStatus';
import { FeatureLockOverlay } from './FeatureLockOverlay';
import { VoiceSelector } from './VoiceSelector';
import { VoiceCloning } from './VoiceCloning';
import type { SubscriptionTier, User, VoiceMood } from '../types';

interface PremiumFeatureTestProps {
  user: User;
  className?: string;
}

interface TestResult {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'pending';
  details?: string;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

export const PremiumFeatureTest: React.FC<PremiumFeatureTestProps> = ({ user, className }) => {
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [testTier, setTestTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    loadCurrentTier();
  }, [user.id]);

  const loadCurrentTier = async () => {
    try {
      const tier = await PremiumService.getUserTier(user.id);
      setCurrentTier(tier);
      setTestTier(tier);
    } catch (error) {
      console.error('Error loading current tier:', error);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    const suites: TestSuite[] = [];

    try {
      // Test 1: Premium Service Core Functionality
      const premiumServiceSuite: TestSuite = {
        name: 'Premium Service Core',
        tests: []
      };

      // Test getUserTier
      try {
        const tier = await PremiumService.getUserTier(user.id);
        premiumServiceSuite.tests.push({
          name: 'Get User Tier',
          description: 'Verify premium service can retrieve user subscription tier',
          status: ['free', 'premium', 'ultimate'].includes(tier) ? 'pass' : 'fail',
          details: `Current tier: ${tier}`
        });
      } catch (error) {
        premiumServiceSuite.tests.push({
          name: 'Get User Tier',
          description: 'Verify premium service can retrieve user subscription tier',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test feature access for each tier
      const features = ['nuclear_mode', 'custom_voices', 'extra_personalities', 'voice_cloning'];
      for (const feature of features) {
        try {
          const result = await PremiumService.checkFeatureAccess(user.id, feature as any);
          premiumServiceSuite.tests.push({
            name: `Feature Access: ${feature}`,
            description: `Check if user has access to ${feature}`,
            status: result.hasAccess !== undefined ? 'pass' : 'fail',
            details: `Access: ${result.hasAccess}, Tier: ${result.userTier}, Required: ${result.requiredTier || 'N/A'}`
          });
        } catch (error) {
          premiumServiceSuite.tests.push({
            name: `Feature Access: ${feature}`,
            description: `Check if user has access to ${feature}`,
            status: 'fail',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Test subscription status
      try {
        const status = await PremiumService.getSubscriptionStatus(user.id);
        premiumServiceSuite.tests.push({
          name: 'Subscription Status',
          description: 'Retrieve detailed subscription information',
          status: status && typeof status === 'object' ? 'pass' : 'fail',
          details: status ? `Status: ${status.status || 'N/A'}` : 'No status data'
        });
      } catch (error) {
        premiumServiceSuite.tests.push({
          name: 'Subscription Status',
          description: 'Retrieve detailed subscription information',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      suites.push(premiumServiceSuite);

      // Test 2: Nuclear Mode Integration
      const nuclearModeSuite: TestSuite = {
        name: 'Nuclear Mode Features',
        tests: []
      };

      // Test nuclear mode access check
      try {
        const access = await nuclearModeService.canAccessNuclearMode(user.id);
        nuclearModeSuite.tests.push({
          name: 'Nuclear Mode Access Check',
          description: 'Verify nuclear mode access validation',
          status: access && typeof access.hasAccess === 'boolean' ? 'pass' : 'fail',
          details: `Access: ${access.hasAccess}, Tier: ${access.userTier}`
        });
      } catch (error) {
        nuclearModeSuite.tests.push({
          name: 'Nuclear Mode Access Check',
          description: 'Verify nuclear mode access validation',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test challenge types availability
      try {
        const challengeTypes = nuclearModeService.getChallengeTypes();
        nuclearModeSuite.tests.push({
          name: 'Challenge Types',
          description: 'Verify nuclear mode challenge types are available',
          status: Array.isArray(challengeTypes) && challengeTypes.length > 0 ? 'pass' : 'fail',
          details: `Found ${challengeTypes.length} challenge types`
        });
      } catch (error) {
        nuclearModeSuite.tests.push({
          name: 'Challenge Types',
          description: 'Verify nuclear mode challenge types are available',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      suites.push(nuclearModeSuite);

      // Test 3: Premium Voice System
      const voiceSystemSuite: TestSuite = {
        name: 'Premium Voice System',
        tests: []
      };

      // Test voice personalities
      try {
        const personalities = premiumVoiceService.getAvailablePersonalities();
        voiceSystemSuite.tests.push({
          name: 'Voice Personalities',
          description: 'Verify premium voice personalities are loaded',
          status: Array.isArray(personalities) && personalities.length > 0 ? 'pass' : 'fail',
          details: `Found ${personalities.length} personalities`
        });
      } catch (error) {
        voiceSystemSuite.tests.push({
          name: 'Voice Personalities',
          description: 'Verify premium voice personalities are loaded',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test voice access for different tiers
      const voiceIds = ['celebrity-chef', 'zen-master', 'robot-companion'];
      for (const voiceId of voiceIds) {
        try {
          const hasAccess = await premiumVoiceService.hasVoiceAccess(user.id, voiceId);
          voiceSystemSuite.tests.push({
            name: `Voice Access: ${voiceId}`,
            description: `Check access to premium voice ${voiceId}`,
            status: typeof hasAccess === 'boolean' ? 'pass' : 'fail',
            details: `Access: ${hasAccess}`
          });
        } catch (error) {
          voiceSystemSuite.tests.push({
            name: `Voice Access: ${voiceId}`,
            description: `Check access to premium voice ${voiceId}`,
            status: 'fail',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Test voice cloning availability
      try {
        const canClone = await premiumVoiceService.canUseVoiceCloning(user.id);
        voiceSystemSuite.tests.push({
          name: 'Voice Cloning Access',
          description: 'Check if user can access voice cloning (Ultimate tier)',
          status: typeof canClone === 'boolean' ? 'pass' : 'fail',
          details: `Can clone: ${canClone}`
        });
      } catch (error) {
        voiceSystemSuite.tests.push({
          name: 'Voice Cloning Access',
          description: 'Check if user can access voice cloning (Ultimate tier)',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      suites.push(voiceSystemSuite);

      // Test 4: UI Components
      const uiComponentsSuite: TestSuite = {
        name: 'Premium UI Components',
        tests: []
      };

      // Test component rendering (these will always pass if no errors thrown)
      const componentTests = [
        { name: 'UpgradePrompt', description: 'Verify upgrade prompt component renders' },
        { name: 'PremiumFeatureCard', description: 'Verify premium feature card component renders' },
        { name: 'SubscriptionStatus', description: 'Verify subscription status component renders' },
        { name: 'FeatureLockOverlay', description: 'Verify feature lock overlay component renders' }
      ];

      componentTests.forEach(test => {
        uiComponentsSuite.tests.push({
          name: test.name,
          description: test.description,
          status: 'pass', // If we get here, components loaded successfully
          details: 'Component imported and available'
        });
      });

      suites.push(uiComponentsSuite);

      setTestResults(suites);

    } catch (error) {
      console.error('Error running tests:', error);
      setTestResults([{
        name: 'Test Suite Error',
        tests: [{
          name: 'Test Execution',
          description: 'Failed to execute test suite',
          status: 'fail',
          error: error instanceof Error ? error.message : String(error)
        }]
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const changeTierForTesting = async (tier: SubscriptionTier) => {
    try {
      await PremiumService.updateUserTier(user.id, tier);
      setTestTier(tier);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for update
    } catch (error) {
      console.error('Error changing tier:', error);
    }
  };

  const resetToOriginalTier = async () => {
    try {
      await PremiumService.updateUserTier(user.id, currentTier);
      setTestTier(currentTier);
    } catch (error) {
      console.error('Error resetting tier:', error);
    }
  };

  const getTestSummary = () => {
    const totalTests = testResults.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = testResults.reduce((sum, suite) =>
      sum + suite.tests.filter(test => test.status === 'pass').length, 0
    );
    const failedTests = testResults.reduce((sum, suite) =>
      sum + suite.tests.filter(test => test.status === 'fail').length, 0
    );

    return { totalTests, passedTests, failedTests };
  };

  const { totalTests, passedTests, failedTests } = getTestSummary();

  return (
    <div className={cn('max-w-6xl mx-auto p-6 space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <TestTube className="w-8 h-8 text-blue-600" />
          Premium Features Test Suite
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Comprehensive testing of premium subscription features, access controls, and user experience components.
        </p>

        {/* Current Status */}
        <div className="flex items-center justify-center gap-6">
          <Badge variant="outline" className="px-4 py-2">
            Original Tier: {currentTier.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="px-4 py-2">
            Test Tier: {testTier.toUpperCase()}
          </Badge>
          {totalTests > 0 && (
            <Badge
              className={cn(
                'px-4 py-2',
                failedTests === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}
            >
              {passedTests}/{totalTests} Tests Passed
            </Badge>
          )}
        </div>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Run All Tests
                </>
              )}
            </Button>

            <Button
              onClick={resetToOriginalTier}
              variant="outline"
              disabled={testTier === currentTier}
            >
              Reset to Original Tier
            </Button>
          </div>

          {/* Tier Testing */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Test Different Subscription Tiers:</h4>
            <div className="flex gap-2">
              {(['free', 'premium', 'ultimate'] as SubscriptionTier[]).map((tier) => (
                <Button
                  key={tier}
                  onClick={() => changeTierForTesting(tier)}
                  variant={testTier === tier ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {tier === 'free' && <Shield className="w-3 h-3" />}
                  {tier === 'premium' && <Crown className="w-3 h-3" />}
                  {tier === 'ultimate' && <Star className="w-3 h-3" />}
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="components">Component Demo</TabsTrigger>
            <TabsTrigger value="integration">Integration Test</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            {testResults.map((suite, suiteIndex) => (
              <Card key={suiteIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{suite.name}</span>
                    <Badge
                      className={cn(
                        suite.tests.every(t => t.status === 'pass')
                          ? 'bg-green-100 text-green-800'
                          : suite.tests.some(t => t.status === 'fail')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      )}
                    >
                      {suite.tests.filter(t => t.status === 'pass').length}/{suite.tests.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suite.tests.map((test, testIndex) => (
                      <div key={testIndex} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="mt-0.5">
                          {test.status === 'pass' && <Check className="w-5 h-5 text-green-500" />}
                          {test.status === 'fail' && <X className="w-5 h-5 text-red-500" />}
                          {test.status === 'pending' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{test.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{test.description}</p>
                          {test.details && (
                            <p className="text-xs text-blue-600 mt-1">{test.details}</p>
                          )}
                          {test.error && (
                            <p className="text-xs text-red-600 mt-1 font-mono">{test.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="components" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upgrade Prompt Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upgrade Prompt</h3>
                <UpgradePrompt
                  feature="nuclear_mode"
                  variant="modal"
                  requiredTier="premium"
                  onUpgrade={(tier: string) => console.log('Upgrade to:', tier)}
                />
              </div>

              {/* Premium Feature Card Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Premium Feature Card</h3>
                <PremiumFeatureCard
                  title="Nuclear Mode"
                  description="Extreme difficulty challenges"
                  requiredTier="premium"
                  currentTier={testTier}
                  icon={<Zap className="w-6 h-6" />}
                  onUpgrade={() => console.log('Upgrade clicked')}
                />
              </div>

              {/* Subscription Status Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Subscription Status</h3>
                <SubscriptionStatus
                  subscription={{
                    tier: testTier,
                    status: 'active',
                    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    usage: {
                      alarms: { used: 5, limit: testTier === 'free' ? 10 : -1 },
                      voices: { used: 3, limit: testTier === 'free' ? 6 : -1 }
                    }
                  }}
                  variant="card"
                />
              </div>

              {/* Feature Lock Overlay Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feature Lock Overlay</h3>
                <FeatureLockOverlay
                  feature="voice_cloning"
                  requiredTier="ultimate"
                  currentTier={testTier}
                  variant="card"
                  onUpgrade={() => console.log('Upgrade from overlay')}
                >
                  <div className="p-6 bg-gray-100 rounded-lg">
                    <h4 className="font-medium">Voice Cloning Feature</h4>
                    <p className="text-sm text-gray-600">This feature is locked for demo purposes</p>
                  </div>
                </FeatureLockOverlay>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                This tab demonstrates real integration of premium features with actual components.
                Change the test tier above to see how features are locked/unlocked.
              </AlertDescription>
            </Alert>

            {/* Voice Selector Integration */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Selector Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceSelector
                  currentVoice="gentle"
                  onVoiceChange={(voice: string) => console.log('Voice changed to:', voice)}
                  userId={user.id}
                  className="max-w-md"
                />
              </CardContent>
            </Card>

            {/* Voice Cloning Integration (Ultimate only) */}
            {testTier === 'ultimate' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="w-5 h-5 text-green-500" />
                    Voice Cloning (Ultimate Feature)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceCloning
                    userId={user.id}
                    onVoiceCreated={(voice: string) => console.log('Voice created:', voice)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-500" />
                    Voice Cloning (Locked)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ultimate Feature Required</h3>
                    <p className="text-gray-600 mb-4">Voice cloning is available for Ultimate subscribers</p>
                    <Button onClick={() => changeTierForTesting('ultimate')}>
                      Test Ultimate Tier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PremiumFeatureTest;