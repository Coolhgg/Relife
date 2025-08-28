/**
 * AI Deployment API Routes
 * Express routes for the AI deployment system
 */

import { Router } from 'express';
import AIDeploymentAPI from './ai-deployment-api';

const router = Router();
const deploymentAPI = new AIDeploymentAPI();

// Deployment control routes
router.post('/start', (req, res) => deploymentAPI.startDeployment(req, res));
router.get('/status', (req, res) => deploymentAPI.getDeploymentStatus(req, res));

// Phase-specific routes
router.post('/phases/:phaseNumber/deploy', (req, res) =>
  deploymentAPI.deployPhase(req, res)
);
router.post('/phases/:phaseNumber/rollback', (req, res) =>
  deploymentAPI.rollbackPhase(req, res)
);

// Health and monitoring routes
router.get('/health', (req, res) => {
  // Simple health endpoint
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Configuration route
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      phases: [
        { phase: 1, name: 'Core Services' },
        { phase: 2, name: 'Cross-Platform Integration' },
        { phase: 3, name: 'Recommendation Engine' },
        { phase: 4, name: 'Dashboard & UI' },
        { phase: 5, name: 'Optimization & Scaling' },
      ],
      apiVersion: '1.0.0',
    },
  });
});

export default router;
