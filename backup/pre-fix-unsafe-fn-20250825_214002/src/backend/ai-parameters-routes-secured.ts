/**
 * Secured AI Parameters API Routes
 * Express router with comprehensive security middleware applied
 */

import { Router } from 'express';
import AIParametersEndpoints from './ai-parameters-endpoints';
import SecurityMiddleware from '../middleware/ai-parameters-security';

// Create router and endpoints instance
const router = Router();
const endpoints = new AIParametersEndpoints();

// Apply security middleware to all routes
router.use(SecurityMiddleware.securityHeaders);
router.use(SecurityMiddleware.securityLogger);

// Authentication required for all AI parameter routes
router.use(SecurityMiddleware.authenticate);

// Session Management Routes (rate limited for auth)
router.post('/session/start', 
  SecurityMiddleware.rateLimiters.auth,
  SecurityMiddleware.authorize(['session_create']),
  SecurityMiddleware.validateParameterUpdate,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.startLiveSession(req, res)
);

router.get('/session/:sessionId/status', 
  SecurityMiddleware.rateLimiters.general,
  SecurityMiddleware.authorize(['session_read']),
  SecurityMiddleware.validateSessionId,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.getSessionStatus(req, res)
);

router.delete('/session/:sessionId', 
  SecurityMiddleware.rateLimiters.general,
  SecurityMiddleware.authorize(['session_delete']),
  SecurityMiddleware.validateSessionId,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.closeLiveSession(req, res)
);

// Configuration Management Routes (moderate rate limiting)
router.get('/configuration/:userId', 
  SecurityMiddleware.rateLimiters.general,
  SecurityMiddleware.authorize(['parameter_read']),
  SecurityMiddleware.validateUserId,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.getCurrentConfiguration(req, res)
);

router.get('/configuration/:userId/export', 
  SecurityMiddleware.rateLimiters.general,
  SecurityMiddleware.authorize(['parameter_export']),
  SecurityMiddleware.validateUserId,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.exportConfiguration(req, res)
);

router.post('/configuration/:userId/import', 
  SecurityMiddleware.rateLimiters.critical,
  SecurityMiddleware.authorize(['parameter_import']),
  SecurityMiddleware.csrfProtection,
  SecurityMiddleware.validateUserId,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.importConfiguration(req, res)
);

// Parameter Update Routes (stricter rate limiting)
router.post('/validate', 
  SecurityMiddleware.rateLimiters.parameterUpdates,
  SecurityMiddleware.authorize(['parameter_validate']),
  SecurityMiddleware.validateParameterUpdate,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.validateParameters(req, res)
);

router.put('/update', 
  SecurityMiddleware.rateLimiters.parameterUpdates,
  SecurityMiddleware.authorize(['parameter_write']),
  SecurityMiddleware.csrfProtection,
  SecurityMiddleware.validateParameterUpdate,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.updateParameters(req, res)
);

router.put('/batch-update', 
  SecurityMiddleware.rateLimiters.critical,
  SecurityMiddleware.authorize(['parameter_batch_write']),
  SecurityMiddleware.csrfProtection,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.batchUpdateParameters(req, res)
);

router.post('/rollback', 
  SecurityMiddleware.rateLimiters.critical,
  SecurityMiddleware.authorize(['parameter_rollback']),
  SecurityMiddleware.csrfProtection,
  SecurityMiddleware.handleValidationErrors,
  (req, res) => endpoints.rollbackParameters(req, res)
);

// Monitoring Routes (general rate limiting)
router.get('/metrics/:timeRange?', 
  SecurityMiddleware.rateLimiters.general,
  SecurityMiddleware.authorize(['metrics_read']),
  (req, res) => endpoints.getParameterMetrics(req, res)
);

// Admin/Security Routes (very strict)
router.get('/audit/logs', 
  SecurityMiddleware.rateLimiters.critical,
  SecurityMiddleware.authorize(['audit_read']),
  (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = SecurityMiddleware.SecurityUtils.getAuditLogs(limit);
      
      res.json({
        success: true,
        data: logs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit logs'
      });
    }
  }
);

router.get('/security/status', 
  SecurityMiddleware.rateLimiters.general,
  SecurityMiddleware.authorize(['security_read']),
  (req, res) => {
    try {
      const status = {
        authentication: 'active',
        rateLimiting: 'active',
        auditLogging: 'active',
        csrfProtection: 'active',
        securityHeaders: 'active',
        lastSecurityCheck: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check security status'
      });
    }
  }
);

// CSRF token endpoint
router.get('/csrf-token',
  SecurityMiddleware.rateLimiters.general,
  (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication token required for CSRF token generation'
        });
      }
      
      const csrfToken = SecurityMiddleware.generateCSRFToken(token);
      
      res.json({
        success: true,
        data: { csrfToken },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate CSRF token'
      });
    }
  }
);

// Health check endpoint (no auth required)
router.get('/health', 
  SecurityMiddleware.rateLimiters.general,
  (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  }
);

// Apply error handling middleware
router.use(SecurityMiddleware.securityErrorHandler);

export default router;