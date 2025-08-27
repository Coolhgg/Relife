/**
 * AI Deployment Validation Script
 * Smoke tests and validation for the 5-phase deployment system
 */

import AIDeploymentOrchestrator from '../services/ai-deployment-orchestrator';
import { AIDeploymentAlerting } from '../services/ai-deployment-alerts';
import AdvancedBehavioralIntelligence from '../services/advanced-behavioral-intelligence';
import CrossPlatformIntegration from '../services/cross-platform-integration';
import EnhancedRecommendationEngine from '../services/enhanced-recommendation-engine';

class AIDeploymentValidator {
  private orchestrator: AIDeploymentOrchestrator;
  private alerting: AIDeploymentAlerting;

  constructor() {
    this.orchestrator = AIDeploymentOrchestrator.getInstance();
    this.alerting = AIDeploymentAlerting.getInstance();
  }

  async runValidationSuite(): Promise<boolean> {
    console.log('🚀 Starting AI Deployment Validation Suite...\n');

    const results = {
      serviceTests: await this.validateServices(),
      orchestratorTests: await this.validateOrchestrator(),
      integrationTests: await this.validateIntegration(),
      alertingTests: await this.validateAlerting(),
    };

    const allPassed = Object.values(results).every(result => result);
    
    console.log('\n📊 Validation Results Summary:');
    console.log(`Services: ${results.serviceTests ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Orchestrator: ${results.orchestratorTests ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Integration: ${results.integrationTests ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Alerting: ${results.alertingTests ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n${allPassed ? '✅' : '❌'} Overall Status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return allPassed;
  }

  private async validateServices(): Promise<boolean> {
    console.log('🔧 Validating AI Services...');
    
    try {
      // Test AdvancedBehavioralIntelligence
      const behavioral = AdvancedBehavioralIntelligence.getInstance();
      const mockAlarms = [{ id: '1', time: '07:00', enabled: true, userId: 'test' }];
      const mockEvents = [{ id: '1', alarmId: '1', firedAt: new Date(), dismissed: true, snoozed: false }];
      
      const analysis = await behavioral.generateAdvancedBehavioralAnalysis('test', mockAlarms, mockEvents);
      if (!analysis.insights || !analysis.psychologicalProfile) {
        throw new Error('Invalid behavioral analysis response');
      }
      console.log('  ✅ AdvancedBehavioralIntelligence service working');

      // Test CrossPlatformIntegration
      const crossPlatform = CrossPlatformIntegration.getInstance();
      await crossPlatform.configurePlatform('test', 'test_platform', {
        enabled: true,
        syncFrequency: 30,
        permissions: ['health'],
        privacyLevel: 'enhanced',
      });
      console.log('  ✅ CrossPlatformIntegration service working');

      // Test EnhancedRecommendationEngine
      const recommendations = EnhancedRecommendationEngine.getInstance();
      const recs = await recommendations.generatePersonalizedRecommendations('test', mockAlarms, mockEvents);
      if (!recs.recommendations) {
        throw new Error('Invalid recommendations response');
      }
      console.log('  ✅ EnhancedRecommendationEngine service working');

      return true;
    } catch (error) {
      console.error('  ❌ Service validation failed:', error);
      return false;
    }
  }

  private async validateOrchestrator(): Promise<boolean> {
    console.log('🎯 Validating Deployment Orchestrator...');
    
    try {
      // Test deployment status retrieval
      const status = this.orchestrator.getDeploymentStatus();
      if (!status.phases || !status.serviceHealth || !status.metrics) {
        throw new Error('Invalid deployment status structure');
      }
      console.log('  ✅ Deployment status retrieval working');

      // Test phase deployment simulation
      await this.orchestrator.deployPhase(1);
      const updatedStatus = this.orchestrator.getDeploymentStatus();
      const phase1 = updatedStatus.phases.find(p => p.phase === 1);
      if (phase1?.status !== 'completed') {
        throw new Error('Phase 1 deployment failed');
      }
      console.log('  ✅ Phase deployment working');

      return true;
    } catch (error) {
      console.error('  ❌ Orchestrator validation failed:', error);
      return false;
    }
  }

  private async validateIntegration(): Promise<boolean> {
    console.log('🔗 Validating System Integration...');
    
    try {
      // Test full deployment flow
      const result = await this.orchestrator.startDeployment('validation-test');
      if (!result.deploymentId || !result.phases) {
        throw new Error('Failed to start deployment');
      }
      console.log('  ✅ Deployment initiation working');

      // Wait for phases to process (mock execution)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check deployment progress
      const finalStatus = this.orchestrator.getDeploymentStatus();
      const completedPhases = finalStatus.phases.filter(p => p.status === 'completed');
      if (completedPhases.length === 0) {
        throw new Error('No phases completed');
      }
      console.log(`  ✅ ${completedPhases.length}/5 phases completed successfully`);

      return true;
    } catch (error) {
      console.error('  ❌ Integration validation failed:', error);
      return false;
    }
  }

  private async validateAlerting(): Promise<boolean> {
    console.log('🚨 Validating Alerting System...');
    
    try {
      // Test alert creation
      await this.alerting.sendAlert('low', 'Validation Test Alert', 'This is a test alert', 'validator');
      const activeAlerts = this.alerting.getActiveAlerts();
      if (activeAlerts.length === 0) {
        throw new Error('Alert was not created');
      }
      console.log('  ✅ Alert creation working');

      // Test alert resolution
      await this.alerting.resolveAlert(activeAlerts[0].id, 'Resolved by validator');
      const updatedAlerts = this.alerting.getActiveAlerts();
      if (updatedAlerts.length > 0) {
        throw new Error('Alert was not resolved');
      }
      console.log('  ✅ Alert resolution working');

      return true;
    } catch (error) {
      console.error('  ❌ Alerting validation failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up validation resources...');
    this.orchestrator.cleanup();
    console.log('✅ Cleanup completed');
  }
}

// Export for use in tests and scripts
export default AIDeploymentValidator;

// CLI execution
if (require.main === module) {
  const validator = new AIDeploymentValidator();
  
  validator.runValidationSuite()
    .then(async (success) => {
      await validator.cleanup();
      process.exit(success ? 0 : 1);
    })
    .catch(async (error) => {
      console.error('💥 Validation suite crashed:', error);
      await validator.cleanup();
      process.exit(1);
    });
}