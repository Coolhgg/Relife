/**
 * AI Deployment Integration Tests
 * Comprehensive testing of the 5-phase deployment system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import AIDeploymentOrchestrator from '../../services/ai-deployment-orchestrator';
import AIDeploymentDashboard from '../../components/AIDeploymentDashboard';
import AIDeploymentAPI from '../../backend/ai-deployment-api';
import { AIDeploymentAlerting } from '../../services/ai-deployment-alerts';
import AdvancedBehavioralIntelligence from '../../services/advanced-behavioral-intelligence';
import CrossPlatformIntegration from '../../services/cross-platform-integration';
import EnhancedRecommendationEngine from '../../services/enhanced-recommendation-engine';

// Mock external dependencies
jest.mock('../../services/advanced-behavioral-intelligence');
jest.mock('../../services/cross-platform-integration');
jest.mock('../../services/enhanced-recommendation-engine');

describe('AI Deployment Integration Tests', () => {
  let orchestrator: AIDeploymentOrchestrator;
  let alerting: AIDeploymentAlerting;
  let api: AIDeploymentAPI;

  beforeEach(() => {
    orchestrator = AIDeploymentOrchestrator.getInstance();
    alerting = AIDeploymentAlerting.getInstance();
    api = new AIDeploymentAPI();

    // Clear any previous state
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up resources
    orchestrator.cleanup();
  });

  describe('Deployment Orchestrator Integration', () => {
    it('should successfully start and complete a full 5-phase deployment', async () => {
      // Start deployment
      const result = await orchestrator.startDeployment('test-user');

      expect(result.deploymentId).toBeDefined();
      expect(result.phases).toHaveLength(5);
      expect(result.estimatedCompletionTime).toBeDefined();

      // Wait for all phases to complete (mocked execution)
      await waitFor(
        () => {
          const status = orchestrator.getDeploymentStatus();
          const completedPhases = status.phases.filter(p => p.status === 'completed');
          expect(completedPhases).toHaveLength(5);
        },
        { timeout: 10000 }
      );

      // Verify final status
      const finalStatus = orchestrator.getDeploymentStatus();
      expect(finalStatus.overallProgress).toBe(100);
      expect(finalStatus.serviceHealth).toBeDefined();
      expect(finalStatus.metrics).toBeDefined();
    });

    it('should handle phase failures and trigger rollbacks', async () => {
      // Mock a phase failure
      const mockError = new Error('Simulated phase failure');
      jest
        .spyOn(orchestrator as any, 'executePhaseDeployment')
        .mockRejectedValueOnce(mockError);

      // Start deployment
      await orchestrator.startDeployment('test-user');

      // Deploy specific phase that will fail
      await expect(orchestrator.deployPhase(1)).rejects.toThrow(
        'Simulated phase failure'
      );

      // Verify failure status
      const status = orchestrator.getDeploymentStatus();
      const failedPhase = status.phases.find(p => p.phase === 1);
      expect(failedPhase?.status).toBe('failed');
      expect(failedPhase?.errors).toContain('Simulated phase failure');
    });

    it('should respect phase dependencies', async () => {
      // Try to deploy phase 3 without completing phases 1 and 2
      await expect(orchestrator.deployPhase(3)).rejects.toThrow('dependencies not met');

      // Complete phases 1 and 2 first
      await orchestrator.deployPhase(1);
      await orchestrator.deployPhase(2);

      // Now phase 3 should succeed
      await expect(orchestrator.deployPhase(3)).resolves.not.toThrow();
    });
  });

  describe('Service Integration Tests', () => {
    it('should successfully integrate all AI services', async () => {
      // Mock service implementations
      const mockAnalysis = {
        insights: [{ id: '1', title: 'Test insight', confidence: 0.9 }],
        psychologicalProfile: { confidence: 0.8 },
        predictiveAnalysis: { predictions: [] },
      };

      const mockRecommendations = {
        recommendations: [{ id: '1', title: 'Test recommendation', confidence: 0.8 }],
      };

      const mockCrossPlatformData = { platforms: [], lastSync: new Date() };

      const mockBehavioralIntelligence =
        AdvancedBehavioralIntelligence.getInstance as jest.Mock;
      mockBehavioralIntelligence.mockReturnValue({
        generateAdvancedBehavioralAnalysis: jest.fn().mockResolvedValue(mockAnalysis),
      });

      const mockRecommendationEngine =
        EnhancedRecommendationEngine.getInstance as jest.Mock;
      mockRecommendationEngine.mockReturnValue({
        generatePersonalizedRecommendations: jest
          .fn()
          .mockResolvedValue(mockRecommendations),
      });

      const mockCrossPlatform = CrossPlatformIntegration.getInstance as jest.Mock;
      mockCrossPlatform.mockReturnValue({
        getCrossPlatformData: jest.fn().mockResolvedValue(mockCrossPlatformData),
        configurePlatform: jest.fn().mockResolvedValue(true),
        performFullSync: jest.fn().mockResolvedValue(true),
        generatePrivacySummary: jest.fn().mockReturnValue({ privacyScore: 0.9 }),
      });

      // Test full integration
      await orchestrator.startDeployment('test-user');

      // Wait for completion
      await waitFor(
        () => {
          const status = orchestrator.getDeploymentStatus();
          expect(status.phases.every(p => p.status === 'completed')).toBe(true);
        },
        { timeout: 5000 }
      );

      // Verify all services were called
      const behavioralService = AdvancedBehavioralIntelligence.getInstance();
      const recommendationService = EnhancedRecommendationEngine.getInstance();
      const crossPlatformService = CrossPlatformIntegration.getInstance();

      expect(behavioralService.generateAdvancedBehavioralAnalysis).toHaveBeenCalled();
      expect(
        recommendationService.generatePersonalizedRecommendations
      ).toHaveBeenCalled();
      expect(crossPlatformService.configurePlatform).toHaveBeenCalled();
    });
  });

  describe('API Integration Tests', () => {
    it('should handle API requests correctly', async () => {
      const mockReq = {
        body: { userId: 'test-user' },
        params: {},
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Test start deployment endpoint
      await api.startDeployment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deploymentId: expect.any(String),
            message: expect.any(String),
          }),
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle phase deployment via API', async () => {
      const mockReq = {
        params: { phaseNumber: '1' },
        body: {},
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await api.deployPhase(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            phase: 1,
            message: expect.stringContaining('Phase 1'),
          }),
        })
      );
    });

    it('should validate phase numbers', async () => {
      const mockReq = {
        params: { phaseNumber: '99' },
        body: {},
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await api.deployPhase(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid phase number'),
        })
      );
    });
  });

  describe('Alerting Integration Tests', () => {
    it('should trigger alerts for deployment failures', async () => {
      const sendAlertSpy = jest.spyOn(alerting, 'sendAlert');

      // Mock deployment status with failures
      const mockStatus = {
        phases: [{ phase: 1, status: 'failed', errors: ['Test error'] }],
        serviceHealth: [
          {
            serviceName: 'TestService',
            status: 'unhealthy',
            errorRate: 10,
            uptime: 85,
          },
        ],
        metrics: [],
        overallProgress: 20,
      };

      await alerting.checkAndAlert(mockStatus);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        'critical',
        expect.stringContaining('Phase 1 Deployment Failed'),
        expect.any(String),
        'deployment_orchestrator',
        expect.any(Object)
      );

      expect(sendAlertSpy).toHaveBeenCalledWith(
        'high',
        expect.stringContaining('Service Down'),
        expect.any(String),
        'service_monitor',
        expect.any(Object)
      );
    });

    it('should resolve alerts when issues are fixed', async () => {
      // Create an alert
      await alerting.sendAlert('high', 'Test Alert', 'Test message', 'test');

      const activeAlerts = alerting.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      // Resolve the alert
      await alerting.resolveAlert(activeAlerts[0].id, 'Fixed by integration test');

      const updatedActiveAlerts = alerting.getActiveAlerts();
      expect(updatedActiveAlerts).toHaveLength(0);

      const history = alerting.getAlertHistory();
      expect(history.some(alert => alert.resolved)).toBe(true);
    });
  });

  describe('Dashboard Integration Tests', () => {
    it('should render deployment dashboard with live data', async () => {
      render(<AIDeploymentDashboard />);

      // Check for key dashboard elements
      expect(screen.getByText('AI Deployment Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Monitor and control the 5-phase AI behavior analysis system deployment'
        )
      ).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/Overall Progress/)).toBeInTheDocument();
        expect(screen.getByText(/Phases Status/)).toBeInTheDocument();
        expect(screen.getByText(/Service Health/)).toBeInTheDocument();
      });
    });

    it('should handle deployment start from dashboard', async () => {
      render(<AIDeploymentDashboard />);

      const startButton = screen.getByRole('button', { name: /Start Deployment/ });
      expect(startButton).toBeInTheDocument();

      fireEvent.click(startButton);

      // Verify the button is disabled during deployment
      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    });

    it('should display phase progress correctly', async () => {
      render(<AIDeploymentDashboard />);

      // Wait for phases to load
      await waitFor(() => {
        expect(screen.getByText(/Phase 1.*Core Services/)).toBeInTheDocument();
        expect(
          screen.getByText(/Phase 2.*Cross-Platform Integration/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Phase 3.*Recommendation Engine/)).toBeInTheDocument();
        expect(screen.getByText(/Phase 4.*Dashboard & UI/)).toBeInTheDocument();
        expect(screen.getByText(/Phase 5.*Optimization & Scaling/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle concurrent deployment requests', async () => {
      const promises = [];

      // Start multiple deployment requests
      for (let i = 0; i < 5; i++) {
        promises.push(orchestrator.startDeployment(`test-user-${i}`));
      }

      const results = await Promise.allSettled(promises);

      // At least one should succeed (singleton pattern)
      expect(results.some(r => r.status === 'fulfilled')).toBe(true);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();

      // Simulate multiple status checks
      const statusChecks = [];
      for (let i = 0; i < 100; i++) {
        statusChecks.push(orchestrator.getDeploymentStatus());
      }

      await Promise.all(statusChecks);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should gracefully handle service unavailability', async () => {
      // Mock service to throw errors
      const mockBehavioralIntelligence =
        AdvancedBehavioralIntelligence.getInstance as jest.Mock;
      mockBehavioralIntelligence.mockReturnValue({
        generateAdvancedBehavioralAnalysis: jest
          .fn()
          .mockRejectedValue(new Error('Service unavailable')),
      });

      // Deployment should handle the error gracefully
      await orchestrator.startDeployment('test-user');

      // Wait for phase 1 to fail
      await waitFor(
        () => {
          const status = orchestrator.getDeploymentStatus();
          const phase1 = status.phases.find(p => p.phase === 1);
          expect(phase1?.status).toBe('failed');
        },
        { timeout: 5000 }
      );
    });

    it('should recover from transient errors', async () => {
      let callCount = 0;
      const mockBehavioralIntelligence =
        AdvancedBehavioralIntelligence.getInstance as jest.Mock;

      mockBehavioralIntelligence.mockReturnValue({
        generateAdvancedBehavioralAnalysis: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Transient error');
          }
          return Promise.resolve({
            insights: [{ id: '1', title: 'Test insight', confidence: 0.9 }],
            psychologicalProfile: { confidence: 0.8 },
            predictiveAnalysis: { predictions: [] },
          });
        }),
      });

      // First call should fail, retry should succeed
      await orchestrator.startDeployment('test-user');

      // Manually retry phase 1
      await orchestrator.deployPhase(1);

      const status = orchestrator.getDeploymentStatus();
      const phase1 = status.phases.find(p => p.phase === 1);
      expect(phase1?.status).toBe('completed');
    });
  });
});

// Helper functions for integration tests
function mockServiceResponses() {
  const mockAnalysis = {
    insights: [
      { id: '1', title: 'Morning routine insight', confidence: 0.9 },
      { id: '2', title: 'Sleep pattern insight', confidence: 0.8 },
    ],
    psychologicalProfile: {
      bigFiveTraits: {
        openness: 0.7,
        conscientiousness: 0.8,
        extraversion: 0.6,
        agreeableness: 0.9,
        neuroticism: 0.3,
      },
      confidence: 0.85,
    },
    predictiveAnalysis: {
      predictions: [{ metric: 'wake_success', probability: 0.9, confidence: 0.8 }],
    },
  };

  return {
    behavioralAnalysis: mockAnalysis,
    recommendations: {
      recommendations: [
        { id: '1', title: 'Adjust bedtime', confidence: 0.8, type: 'schedule' },
        { id: '2', title: 'Change alarm sound', confidence: 0.7, type: 'sound' },
      ],
    },
    crossPlatformData: {
      platforms: ['apple_health', 'google_calendar'],
      lastSync: new Date(),
      dataQuality: 0.9,
    },
  };
}

export { mockServiceResponses };
