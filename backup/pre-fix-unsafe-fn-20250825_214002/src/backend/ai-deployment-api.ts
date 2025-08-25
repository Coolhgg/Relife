/**
 * AI Deployment API Endpoints
 * REST API for controlling and monitoring the 5-phase AI deployment system
 */

import { Request, Response } from 'express';
import AIDeploymentOrchestrator from '../services/ai-deployment-orchestrator';
import { DEPLOYMENT_PHASES } from '../config/ai-deployment-config';

// API Response types
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface DeploymentStartResponse {
  deploymentId: string;
  phases: any[];
  estimatedCompletionTime: Date;
  message: string;
}

interface DeploymentStatusResponse {
  phases: any[];
  overallProgress: number;
  serviceHealth: any[];
  metrics: any[];
  lastUpdated: Date;
}

class AIDeploymentAPI {
  private orchestrator: AIDeploymentOrchestrator;

  constructor() {
    this.orchestrator = AIDeploymentOrchestrator.getInstance();
  }

  /**
   * Start the complete 5-phase deployment
   * POST /api/ai-deployment/start
   */
  async startDeployment(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      
      console.log('[API] Starting AI deployment process...');
      
      const result = await this.orchestrator.startDeployment(userId);
      
      const response: APIResponse<DeploymentStartResponse> = {
        success: true,
        data: {
          ...result,
          message: 'AI deployment started successfully. You can monitor progress via the status endpoint.',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('[API] Failed to start deployment:', error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start deployment',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get current deployment status
   * GET /api/ai-deployment/status
   */
  async getDeploymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.orchestrator.getDeploymentStatus();
      
      const response: APIResponse<DeploymentStatusResponse> = {
        success: true,
        data: {
          ...status,
          lastUpdated: new Date(),
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('[API] Failed to get deployment status:', error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployment status',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Deploy a specific phase
   * POST /api/ai-deployment/phases/:phaseNumber/deploy
   */
  async deployPhase(req: Request, res: Response): Promise<void> {
    try {
      const phaseNumber = parseInt(req.params.phaseNumber, 10);
      
      if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 5) {
        const response: APIResponse = {
          success: false,
          error: 'Invalid phase number. Must be between 1 and 5.',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }
      
      console.log(`[API] Deploying Phase ${phaseNumber}...`);
      
      await this.orchestrator.deployPhase(phaseNumber);
      
      const response: APIResponse = {
        success: true,
        data: {
          phase: phaseNumber,
          message: `Phase ${phaseNumber} deployment initiated successfully`,
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error(`[API] Failed to deploy phase:`, error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deploy phase',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Rollback a specific phase
   * POST /api/ai-deployment/phases/:phaseNumber/rollback
   */
  async rollbackPhase(req: Request, res: Response): Promise<void> {
    try {
      const phaseNumber = parseInt(req.params.phaseNumber, 10);
      
      if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 5) {
        const response: APIResponse = {
          success: false,
          error: 'Invalid phase number. Must be between 1 and 5.',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }
      
      console.log(`[API] Rolling back Phase ${phaseNumber}...`);
      
      await this.orchestrator.rollbackPhase(phaseNumber);
      
      const response: APIResponse = {
        success: true,
        data: {
          phase: phaseNumber,
          message: `Phase ${phaseNumber} rolled back successfully`,
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error(`[API] Failed to rollback phase:`, error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rollback phase',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get health status of all AI services
   * GET /api/ai-deployment/health
   */
  async getServiceHealth(req: Request, res: Response): Promise<void> {
    try {
      const status = this.orchestrator.getDeploymentStatus();
      
      const healthSummary = {
        services: status.serviceHealth,
        overallHealth: this.calculateOverallHealth(status.serviceHealth),
        lastChecked: new Date(),
        criticalAlerts: this.getCriticalAlerts(status.serviceHealth),
      };
      
      const response: APIResponse = {
        success: true,
        data: healthSummary,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('[API] Failed to get service health:', error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get service health',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get deployment metrics and analytics
   * GET /api/ai-deployment/metrics
   */
  async getDeploymentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const status = this.orchestrator.getDeploymentStatus();
      
      const metricsData = {
        phases: status.metrics,
        summary: {
          totalPhases: status.phases.length,
          completedPhases: status.phases.filter(p => p.status === 'completed').length,
          failedPhases: status.phases.filter(p => p.status === 'failed').length,
          overallProgress: status.overallProgress,
          successRate: this.calculateSuccessRate(status.phases),
          averageDeploymentTime: this.calculateAverageDeploymentTime(status.phases),
        },
        trends: this.calculateTrends(status.metrics),
      };
      
      const response: APIResponse = {
        success: true,
        data: metricsData,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('[API] Failed to get deployment metrics:', error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployment metrics',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get deployment configuration
   * GET /api/ai-deployment/config
   */
  async getDeploymentConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = {
        phases: DEPLOYMENT_PHASES,
        supportedOperations: [
          'start-deployment',
          'deploy-phase',
          'rollback-phase',
          'get-status',
          'get-health',
          'get-metrics',
        ],
        apiVersion: '1.0.0',
        lastUpdated: new Date().toISOString(),
      };
      
      const response: APIResponse = {
        success: true,
        data: config,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('[API] Failed to get deployment config:', error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployment config',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Trigger emergency shutdown of all AI services
   * POST /api/ai-deployment/emergency-stop
   */
  async emergencyStop(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      
      console.log(`[API] Emergency stop triggered. Reason: ${reason || 'Not specified'}`);
      
      // Rollback all completed phases in reverse order
      const status = this.orchestrator.getDeploymentStatus();
      const completedPhases = status.phases
        .filter(p => p.status === 'completed')
        .sort((a, b) => b.phase - a.phase);
      
      for (const phase of completedPhases) {
        try {
          await this.orchestrator.rollbackPhase(phase.phase);
          console.log(`[API] Emergency rollback of Phase ${phase.phase} completed`);
        } catch (rollbackError) {
          console.error(`[API] Failed to rollback Phase ${phase.phase}:`, rollbackError);
        }
      }
      
      // Cleanup orchestrator resources
      this.orchestrator.cleanup();
      
      const response: APIResponse = {
        success: true,
        data: {
          message: 'Emergency stop completed. All AI services have been shut down.',
          rolledBackPhases: completedPhases.length,
          reason: reason || 'Emergency stop requested',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('[API] Failed to execute emergency stop:', error);
      
      const response: APIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute emergency stop',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  // Helper methods
  private calculateOverallHealth(serviceHealth: any[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (serviceHealth.length === 0) return 'healthy';
    
    const healthyCount = serviceHealth.filter(s => s.status === 'healthy').length;
    const degradedCount = serviceHealth.filter(s => s.status === 'degraded').length;
    const unhealthyCount = serviceHealth.filter(s => s.status === 'unhealthy').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private getCriticalAlerts(serviceHealth: any[]): string[] {
    const alerts: string[] = [];
    
    serviceHealth.forEach(service => {
      if (service.status === 'unhealthy') {
        alerts.push(`Service ${service.serviceName} is unhealthy (${service.errorRate}% error rate)`);
      } else if (service.status === 'degraded') {
        alerts.push(`Service ${service.serviceName} is degraded (${service.responseTime}ms response time)`);
      }
      
      if (service.uptime < 95) {
        alerts.push(`Service ${service.serviceName} has low uptime (${service.uptime}%)`);
      }
    });
    
    return alerts;
  }

  private calculateSuccessRate(phases: any[]): number {
    if (phases.length === 0) return 0;
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    return completedPhases / phases.length;
  }

  private calculateAverageDeploymentTime(phases: any[]): number {
    const completedPhases = phases.filter(p => 
      p.status === 'completed' && p.startTime && p.completionTime
    );
    
    if (completedPhases.length === 0) return 0;
    
    const totalTime = completedPhases.reduce((sum, phase) => {
      const duration = new Date(phase.completionTime).getTime() - new Date(phase.startTime).getTime();
      return sum + duration;
    }, 0);
    
    return totalTime / completedPhases.length;
  }

  private calculateTrends(metrics: any[]): any {
    if (metrics.length < 2) return {};
    
    const latestMetrics = metrics[metrics.length - 1];
    const previousMetrics = metrics[metrics.length - 2];
    
    return {
      userAdoption: {
        current: latestMetrics.userAdoption,
        trend: latestMetrics.userAdoption > previousMetrics.userAdoption ? 'increasing' : 'decreasing',
        change: latestMetrics.userAdoption - previousMetrics.userAdoption,
      },
      successRate: {
        current: latestMetrics.successRate,
        trend: latestMetrics.successRate > previousMetrics.successRate ? 'increasing' : 'decreasing',
        change: latestMetrics.successRate - previousMetrics.successRate,
      },
      userFeedbackScore: {
        current: latestMetrics.userFeedbackScore,
        trend: latestMetrics.userFeedbackScore > previousMetrics.userFeedbackScore ? 'increasing' : 'decreasing',
        change: latestMetrics.userFeedbackScore - previousMetrics.userFeedbackScore,
      },
    };
  }
}

export default AIDeploymentAPI;