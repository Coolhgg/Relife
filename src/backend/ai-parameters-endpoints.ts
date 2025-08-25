/**
 * AI Parameters API Endpoints
 * REST API endpoints for real-time AI parameter configuration and management
 */

import { Request, Response } from 'express';
import AIParametersAPIService from '../services/ai-parameters-api';
import type { 
  ParameterUpdateRequest,
  ParameterUpdateResponse,
  ParameterValidationResult,
  LiveConfigurationSession
} from '../services/ai-parameters-api';

// API Response wrapper
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  version: string;
}

class AIParametersEndpoints {
  private apiService: AIParametersAPIService;

  constructor() {
    this.apiService = AIParametersAPIService.getInstance();
  }

  /**
   * Start a live configuration session
   * POST /api/ai-parameters/session/start
   */
  async startLiveSession(req: Request, res: Response): Promise<void> {
    try {
      const { userId, previewMode = false } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const session = await this.apiService.startLiveSession(userId, previewMode);

      const response: APIResponse<LiveConfigurationSession> = {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to start live session: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Get current configuration for all AI services
   * GET /api/ai-parameters/configuration/:userId
   */
  async getCurrentConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const configurations = await this.apiService.getCurrentConfiguration(userId);

      const response: APIResponse = {
        success: true,
        data: configurations,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get current configuration: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Validate parameters before applying
   * POST /api/ai-parameters/validate
   */
  async validateParameters(req: Request, res: Response): Promise<void> {
    try {
      const updateRequest: ParameterUpdateRequest = req.body;

      if (!updateRequest.category || !updateRequest.parameters || !updateRequest.userId) {
        res.status(400).json({
          success: false,
          error: 'category, parameters, and userId are required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const validation = await this.apiService.validateParameters(updateRequest);

      const response: APIResponse<ParameterValidationResult> = {
        success: true,
        data: validation,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to validate parameters: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Update AI parameters
   * PUT /api/ai-parameters/update
   */
  async updateParameters(req: Request, res: Response): Promise<void> {
    try {
      const updateRequest: ParameterUpdateRequest = req.body;

      if (!updateRequest.category || !updateRequest.parameters || !updateRequest.userId) {
        res.status(400).json({
          success: false,
          error: 'category, parameters, and userId are required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const updateResult = await this.apiService.updateParameters(updateRequest);

      const response: APIResponse<ParameterUpdateResponse> = {
        success: updateResult.success,
        data: updateResult,
        error: updateResult.success ? undefined : 'Parameter update failed',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const statusCode = updateResult.success ? 200 : 400;
      res.status(statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to update parameters: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Rollback parameters to previous state
   * POST /api/ai-parameters/rollback
   */
  async rollbackParameters(req: Request, res: Response): Promise<void> {
    try {
      const { rollbackToken, userId } = req.body;

      if (!rollbackToken || !userId) {
        res.status(400).json({
          success: false,
          error: 'rollbackToken and userId are required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const rollbackResult = await this.apiService.rollbackParameters(rollbackToken, userId);

      const response: APIResponse<ParameterUpdateResponse> = {
        success: rollbackResult.success,
        data: rollbackResult,
        error: rollbackResult.success ? undefined : 'Parameter rollback failed',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const statusCode = rollbackResult.success ? 200 : 400;
      res.status(statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to rollback parameters: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Get performance metrics for parameter changes
   * GET /api/ai-parameters/metrics/:timeRange?
   */
  async getParameterMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange = 'hour' } = req.params;

      if (!['hour', 'day', 'week'].includes(timeRange)) {
        res.status(400).json({
          success: false,
          error: 'timeRange must be hour, day, or week',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const metrics = await this.apiService.getParameterPerformanceMetrics(timeRange as 'hour' | 'day' | 'week');

      const response: APIResponse = {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get parameter metrics: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Get live session status
   * GET /api/ai-parameters/session/:sessionId/status
   */
  async getSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'sessionId is required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const session = this.apiService.getLiveSessionStatus(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found or expired',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const response: APIResponse<LiveConfigurationSession> = {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get session status: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Close live configuration session
   * DELETE /api/ai-parameters/session/:sessionId
   */
  async closeLiveSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'sessionId is required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      await this.apiService.closeLiveSession(sessionId);

      const response: APIResponse = {
        success: true,
        data: { message: 'Session closed successfully' },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to close session: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Batch update parameters for multiple services
   * PUT /api/ai-parameters/batch-update
   */
  async batchUpdateParameters(req: Request, res: Response): Promise<void> {
    try {
      const { updates, userId } = req.body;

      if (!updates || !Array.isArray(updates) || !userId) {
        res.status(400).json({
          success: false,
          error: 'updates array and userId are required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const results: ParameterUpdateResponse[] = [];

      // Process updates sequentially to maintain consistency
      for (const updateRequest of updates) {
        updateRequest.userId = userId; // Ensure userId is set
        const result = await this.apiService.updateParameters(updateRequest);
        results.push(result);
      }

      const response: APIResponse = {
        success: true,
        data: {
          results,
          totalUpdates: updates.length,
          successfulUpdates: results.filter(r => r.success).length,
          failedUpdates: results.filter(r => !r.success).length
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to batch update parameters: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Export current configuration as JSON
   * GET /api/ai-parameters/configuration/:userId/export
   */
  async exportConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const configurations = await this.apiService.getCurrentConfiguration(userId);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ai-config-${userId}-${Date.now()}.json"`);

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId,
        version: '1.0.0',
        configurations
      };

      res.status(200).json(exportData);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to export configuration: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  /**
   * Import configuration from JSON
   * POST /api/ai-parameters/configuration/:userId/import
   */
  async importConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { configurations } = req.body;

      if (!userId || !configurations) {
        res.status(400).json({
          success: false,
          error: 'userId and configurations are required',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        return;
      }

      const results: ParameterUpdateResponse[] = [];

      // Import configurations for each service
      for (const [serviceName, config] of Object.entries(configurations)) {
        const categoryMap: Record<string, string> = {
          'behavioral_intelligence': 'behavioral_intelligence',
          'voice_ai': 'voice_ai',
          'rewards': 'rewards',
          'deployment': 'deployment'
        };

        const category = categoryMap[serviceName];
        if (category && config && typeof config === 'object' && 'currentParameters' in config) {
          const updateRequest: ParameterUpdateRequest = {
            category: category as any,
            parameters: (config as any).currentParameters,
            userId,
            immediate: false
          };

          const result = await this.apiService.updateParameters(updateRequest);
          results.push(result);
        }
      }

      const response: APIResponse = {
        success: true,
        data: {
          results,
          totalImports: results.length,
          successfulImports: results.filter(r => r.success).length,
          failedImports: results.filter(r => !r.success).length
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to import configuration: ${error.message}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }
}

export default AIParametersEndpoints;