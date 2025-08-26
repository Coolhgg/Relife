/**
 * AI Parameters API Routes
 * Express router configuration for AI parameter management endpoints
 */

import { Router } from 'express';
import AIParametersEndpoints from './ai-parameters-endpoints';

// Create router and endpoints instance
const router = Router();
const endpoints = new AIParametersEndpoints();

// Session Management Routes
router.post('/session/start', (req, res) => endpoints.startLiveSession(req, res));
router.get('/session/:sessionId/status', (req, res) =>
  endpoints.getSessionStatus(req, res)
);
router.delete('/session/:sessionId', (req, res) =>
  endpoints.closeLiveSession(req, res)
);

// Configuration Management Routes
router.get('/configuration/:userId', (req, res) =>
  endpoints.getCurrentConfiguration(req, res)
);
router.get('/configuration/:userId/export', (req, res) =>
  endpoints.exportConfiguration(req, res)
);
router.post('/configuration/:userId/import', (req, res) =>
  endpoints.importConfiguration(req, res)
);

// Parameter Update Routes
router.post('/validate', (req, res) => endpoints.validateParameters(req, res));
router.put('/update', (req, res) => endpoints.updateParameters(req, res));
router.put('/batch-update', (req, res) => endpoints.batchUpdateParameters(req, res));
router.post('/rollback', (req, res) => endpoints.rollbackParameters(req, res));

// Monitoring Routes
router.get('/metrics/:timeRange?', (req, res) =>
  endpoints.getParameterMetrics(req, res)
);

export default router;
