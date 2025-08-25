/**
 * Full 5-Phase AI Deployment Script
 * Executes complete deployment from Phase 1 to Phase 5 with monitoring
 */

import AIDeploymentOrchestrator from './src/services/ai-deployment-orchestrator';
import { AIDeploymentAlerting } from './src/services/ai-deployment-alerts';

class FullPhaseDeployer {
  private orchestrator: AIDeploymentOrchestrator;
  private alerting: AIDeploymentAlerting;

  constructor() {
    this.orchestrator = AIDeploymentOrchestrator.getInstance();
    this.alerting = AIDeploymentAlerting.getInstance();
  }

  async deployAllPhases(): Promise<boolean> {
    console.log('🚀 Starting Full 5-Phase AI Deployment...');
    console.log('=' .repeat(60));

    try {
      // Start monitoring
      await this.orchestrator.startDeployment();
      
      console.log('\n📊 Deployment Status:');
      console.log('Phase 1: Core Services (AdvancedBehavioralIntelligence)');
      console.log('Phase 2: Cross-Platform Integration');  
      console.log('Phase 3: Recommendation Engine');
      console.log('Phase 4: Dashboard & UI');
      console.log('Phase 5: Optimization & Scaling');
      console.log('');

      // Deploy each phase sequentially
      for (let phase = 1; phase <= 5; phase++) {
        console.log(`\n🔄 Starting Phase ${phase} Deployment...`);
        
        const success = await this.deployPhase(phase);
        if (!success) {
          console.error(`❌ Phase ${phase} deployment failed!`);
          await this.handleDeploymentFailure(phase);
          return false;
        }
        
        console.log(`✅ Phase ${phase} deployment completed successfully!`);
        
        // Brief pause between phases
        if (phase < 5) {
          console.log('⏳ Preparing for next phase...');
          await this.sleep(2000);
        }
      }

      console.log('\n🎉 All 5 phases deployed successfully!');
      console.log('📈 Starting post-deployment validation...');
      
      const validationSuccess = await this.validateDeployment();
      if (!validationSuccess) {
        console.warn('⚠️  Some validation checks failed, but deployment is functional');
      }

      console.log('\n✅ AI Deployment Complete!');
      console.log('Dashboard available at: /admin/ai-deployment');
      console.log('Behavioral insights at: /dashboard/ai-insights');
      
      return true;

    } catch (error) {
      console.error('❌ Critical deployment error:', error);
      await this.alerting.sendAlert('critical', 'Deployment Failed', 
        `Critical error during deployment: ${error instanceof Error ? error.message : 'Unknown error'}`, 'deployment-system');
      return false;
    }
  }

  private async deployPhase(phase: number): Promise<boolean> {
    try {
      // Deploy specific phase
      await this.orchestrator.deployPhase(phase);
      
      // Monitor deployment status
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        const status = await this.orchestrator.getDeploymentStatus();
        const phaseStatus = status.phases.find(p => p.phase === phase);
        
        if (phaseStatus?.status === 'completed') {
          return true;
        } else if (phaseStatus?.status === 'failed') {
          console.error(`Phase ${phase} failed:`, phaseStatus.errors);
          return false;
        }
        
        // Show progress
        if (phaseStatus?.progress !== undefined) {
          this.showProgress(phase, phaseStatus.progress);
        }
        
        await this.sleep(1000);
        attempts++;
      }
      
      console.error(`Phase ${phase} deployment timeout`);
      return false;
      
    } catch (error) {
      console.error(`Phase ${phase} deployment error:`, error);
      return false;
    }
  }

  private showProgress(phase: number, progress: number): void {
    const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    process.stdout.write(`\r  [${progressBar}] Phase ${phase}: ${progress}%`);
    if (progress === 100) {
      console.log(); // New line when complete
    }
  }

  private async handleDeploymentFailure(failedPhase: number): Promise<void> {
    console.log(`\n🔄 Attempting rollback for Phase ${failedPhase}...`);
    
    try {
      await this.orchestrator.rollbackPhase(failedPhase);
      console.log(`✅ Phase ${failedPhase} rolled back successfully`);
      
      await this.alerting.sendAlert('high', 'Phase Deployment Failed', 
        `Phase ${failedPhase} deployment failed and was rolled back`, 'deployment-system');
        
    } catch (rollbackError) {
      console.error(`❌ Rollback failed:`, rollbackError);
      await this.alerting.sendAlert('critical', 'Rollback Failed', 
        `Failed to rollback Phase ${failedPhase}: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`, 'deployment-system');
    }
  }

  private async validateDeployment(): Promise<boolean> {
    try {
      const status = await this.orchestrator.getDeploymentStatus();
      const allPhasesCompleted = status.phases.every(p => p.status === 'completed');
      
      if (allPhasesCompleted) {
        console.log('✅ All phases successfully deployed');
        
        // Test service health
        const health = await this.orchestrator.getServiceHealth();
        const healthyServices = health.filter(s => s.status === 'healthy').length;
        
        console.log(`📊 Service Health: ${healthyServices}/${health.length} services healthy`);
        
        if (healthyServices === health.length) {
          console.log('✅ All services are healthy');
          return true;
        } else {
          console.warn(`⚠️  ${health.length - healthyServices} services are not healthy`);
          return false;
        }
      } else {
        console.error('❌ Not all phases completed successfully');
        return false;
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showDeploymentDashboard(): Promise<void> {
    console.log('\n📊 Current Deployment Status:');
    console.log('=' .repeat(60));
    
    try {
      const status = await this.orchestrator.getDeploymentStatus();
      const health = await this.orchestrator.getServiceHealth();
      
      console.log('\n🔧 Phase Status:');
      for (const phase of status.phases) {
        const statusIcon = phase.status === 'completed' ? '✅' : 
                          phase.status === 'in_progress' ? '🔄' :
                          phase.status === 'failed' ? '❌' : '⏳';
        console.log(`  ${statusIcon} Phase ${phase.phase}: ${phase.status} (${phase.progress}%)`);
      }
      
      console.log('\n💊 Service Health:');
      for (const service of health) {
        const healthIcon = service.status === 'healthy' ? '✅' : 
                          service.status === 'degraded' ? '⚠️' : '❌';
        console.log(`  ${healthIcon} ${service.serviceName}: ${service.status} (${service.responseTime}ms)`);
      }
      
      console.log(`\n📈 Overall Progress: ${Math.round(status.phases.reduce((sum, p) => sum + p.progress, 0) / status.phases.length)}%`);
      
    } catch (error) {
      console.error('Failed to get deployment status:', error);
    }
  }
}

// Execute deployment if run directly
if (require.main === module) {
  const deployer = new FullPhaseDeployer();
  
  deployer.deployAllPhases()
    .then(success => {
      if (success) {
        console.log('\n🎊 Deployment completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Deployment failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Deployment error:', error);
      process.exit(1);
    });
}

export default FullPhaseDeployer;