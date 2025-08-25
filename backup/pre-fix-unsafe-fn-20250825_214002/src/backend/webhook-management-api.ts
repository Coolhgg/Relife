/**
 * Webhook Management API
 * Provides endpoints for managing and monitoring webhooks from the dashboard
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../services/supabase';
import { ErrorHandler } from '../services/error-handler';
import AnalyticsService from '../services/analytics';
import { PushNotificationService } from '../services/push-notifications';

// Types
interface WebhookConfig {
  id: string;
  name: string;
  type: 'stripe' | 'push' | 'monitoring' | 'custom';
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastTriggered?: Date;
  successRate: number;
  totalEvents: number;
  errorCount: number;
  enabled: boolean;
  secretKey?: string;
  metadata: Record<string, any>;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  type: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  payload: any;
  errorMessage?: string;
  retryCount: number;
  responseTime: number;
}

interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  successRate: number;
  avgResponseTime: number;
  errorRate: number;
}

class WebhookManagementAPI {
  private static instance: WebhookManagementAPI;

  static getInstance(): WebhookManagementAPI {
    if (!this.instance) {
      this.instance = new WebhookManagementAPI();
    }
    return this.instance;
  }

  /**
   * Get all webhook configurations
   */
  async getWebhookConfigs(req: Request, res: Response): Promise<void> {
    try {
      const { data: webhooks, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats for each webhook
      const webhooksWithStats = await Promise.all(
        webhooks?.map(async (webhook) => {
          const stats = await this.calculateWebhookStats(webhook.id);
          return {
            ...webhook,
            ...stats
          };
        }) || []
      );

      res.json({
        success: true,
        webhooks: webhooksWithStats
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to get webhook configs');
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook configurations'
      });
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      const { data: configs } = await supabase
        .from('webhook_configs')
        .select('id, enabled, status');

      const { data: events } = await supabase
        .from('webhook_logs')
        .select('status, response_time, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!configs || !events) {
        throw new Error('Failed to fetch webhook data');
      }

      const stats: WebhookStats = {
        totalWebhooks: configs.length,
        activeWebhooks: configs.filter(c => c.enabled && c.status === 'active').length,
        totalEvents: events.length,
        successRate: events.length > 0 
          ? (events.filter(e => e.status === 'success').length / events.length) * 100 
          : 0,
        avgResponseTime: events.length > 0
          ? events.reduce((sum, e) => sum + (e.response_time || 0), 0) / events.length
          : 0,
        errorRate: events.length > 0
          ? (events.filter(e => e.status === 'error').length / events.length) * 100
          : 0
      };

      res.json(stats);
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to get webhook stats');
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook statistics'
      });
    }
  }

  /**
   * Get recent webhook events
   */
  async getWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const webhookId = req.query.webhookId as string;

      let query = supabase
        .from('webhook_logs')
        .select(`
          *,
          webhook_configs(name, type)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        events: events?.map(event => ({
          id: event.id,
          type: event.event_type,
          status: event.status,
          timestamp: event.created_at,
          payload: event.metadata,
          errorMessage: event.error_message,
          retryCount: event.retry_count || 0,
          responseTime: event.response_time,
          webhookName: event.webhook_configs?.name
        })) || []
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to get webhook events');
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook events'
      });
    }
  }

  /**
   * Test a webhook configuration
   */
  async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookId = req.params.id;
      
      const { data: webhook, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error || !webhook) {
        return res.status(404).json({
          success: false,
          error: 'Webhook configuration not found'
        });
      }

      const testResult = await this.executeWebhookTest(webhook);
      
      // Log the test event
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_id: webhookId,
          event_type: 'webhook_test',
          status: testResult.success ? 'success' : 'error',
          error_message: testResult.error,
          response_time: testResult.responseTime,
          metadata: { test: true, result: testResult }
        });

      res.json({
        success: testResult.success,
        message: testResult.success 
          ? 'Webhook test successful' 
          : `Webhook test failed: ${testResult.error}`,
        responseTime: testResult.responseTime
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to test webhook');
      res.status(500).json({
        success: false,
        error: 'Failed to test webhook'
      });
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhookConfig(req: Request, res: Response): Promise<void> {
    try {
      const webhookId = req.params.id;
      const updates = req.body;

      // Validate updates
      const validFields = ['name', 'url', 'enabled', 'metadata', 'status'];
      const sanitizedUpdates = Object.keys(updates)
        .filter(key => validFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      const { data: webhook, error } = await supabase
        .from('webhook_configs')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookId)
        .select()
        .single();

      if (error) throw error;

      // Log the configuration change
      AnalyticsService.getInstance().track('webhook_config_updated', {
        webhookId,
        changes: Object.keys(sanitizedUpdates),
        timestamp: new Date()
      });

      res.json({
        success: true,
        webhook,
        message: 'Webhook configuration updated successfully'
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to update webhook config');
      res.status(500).json({
        success: false,
        error: 'Failed to update webhook configuration'
      });
    }
  }

  /**
   * Create new webhook configuration
   */
  async createWebhookConfig(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, url, metadata = {} } = req.body;

      if (!name || !type || !url) {
        return res.status(400).json({
          success: false,
          error: 'Name, type, and URL are required'
        });
      }

      // Generate a secure secret key for the webhook
      const secretKey = crypto.randomBytes(32).toString('hex');

      const { data: webhook, error } = await supabase
        .from('webhook_configs')
        .insert({
          name,
          type,
          url,
          status: 'active',
          enabled: true,
          secret_key: secretKey,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      AnalyticsService.getInstance().track('webhook_config_created', {
        webhookId: webhook.id,
        type,
        timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        webhook,
        message: 'Webhook configuration created successfully'
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to create webhook config');
      res.status(500).json({
        success: false,
        error: 'Failed to create webhook configuration'
      });
    }
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhookConfig(req: Request, res: Response): Promise<void> {
    try {
      const webhookId = req.params.id;

      const { error } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      AnalyticsService.getInstance().track('webhook_config_deleted', {
        webhookId,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Webhook configuration deleted successfully'
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to delete webhook config');
      res.status(500).json({
        success: false,
        error: 'Failed to delete webhook configuration'
      });
    }
  }

  /**
   * Get webhook health status
   */
  async getWebhookHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthChecks = await Promise.all([
        this.checkStripeWebhookHealth(),
        this.checkPushNotificationHealth(),
        this.checkMonitoringWebhookHealth(),
        this.checkDatabaseHealth()
      ]);

      const [stripe, push, monitoring, database] = healthChecks;

      res.json({
        success: true,
        health: {
          stripe,
          push,
          monitoring, 
          database,
          overall: healthChecks.every(check => check.status === 'healthy')
        }
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to get webhook health');
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook health status'
      });
    }
  }

  /**
   * Retry failed webhook events
   */
  async retryFailedEvents(req: Request, res: Response): Promise<void> {
    try {
      const { eventIds } = req.body;

      if (!Array.isArray(eventIds)) {
        return res.status(400).json({
          success: false,
          error: 'eventIds must be an array'
        });
      }

      const retryResults = await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const result = await this.retryWebhookEvent(eventId);
            return { eventId, success: true, result };
          } catch (error) {
            return { 
              eventId, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      const successCount = retryResults.filter(r => r.success).length;

      res.json({
        success: true,
        message: `Retried ${successCount}/${eventIds.length} events`,
        results: retryResults
      });
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Failed to retry webhook events');
      res.status(500).json({
        success: false,
        error: 'Failed to retry webhook events'
      });
    }
  }

  // Private helper methods

  private async calculateWebhookStats(webhookId: string) {
    const { data: events } = await supabase
      .from('webhook_logs')
      .select('status, created_at')
      .eq('webhook_id', webhookId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!events || events.length === 0) {
      return {
        successRate: 0,
        totalEvents: 0,
        errorCount: 0,
        lastTriggered: null
      };
    }

    const successCount = events.filter(e => e.status === 'success').length;
    const errorCount = events.filter(e => e.status === 'error').length;

    return {
      successRate: (successCount / events.length) * 100,
      totalEvents: events.length,
      errorCount,
      lastTriggered: new Date(Math.max(...events.map(e => new Date(e.created_at).getTime())))
    };
  }

  private async executeWebhookTest(webhook: any): Promise<{
    success: boolean;
    error?: string;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      switch (webhook.type) {
        case 'stripe':
          return await this.testStripeWebhook(webhook);
        
        case 'push':
          return await this.testPushNotification(webhook);
        
        case 'monitoring':
          return await this.testMonitoringWebhook(webhook);
        
        case 'custom':
          return await this.testCustomWebhook(webhook);
        
        default:
          return {
            success: false,
            error: `Unknown webhook type: ${webhook.type}`,
            responseTime: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testStripeWebhook(webhook: any) {
    const startTime = Date.now();
    
    // Test Stripe webhook by validating configuration
    const hasValidKey = process.env.STRIPE_SECRET_KEY?.startsWith('sk_');
    const hasValidWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_');
    
    return {
      success: hasValidKey && hasValidWebhookSecret,
      error: !hasValidKey ? 'Invalid Stripe secret key' : 
             !hasValidWebhookSecret ? 'Invalid webhook secret' : undefined,
      responseTime: Date.now() - startTime
    };
  }

  private async testPushNotification(webhook: any) {
    const startTime = Date.now();
    
    try {
      await PushNotificationService.testPushNotification();
      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Push notification test failed',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testMonitoringWebhook(webhook: any) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🧪 Webhook test from Relife Management Dashboard'
        })
      });

      return {
        success: response.ok,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testCustomWebhook(webhook: any) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Relife-Webhook-Test/1.0'
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });

      return {
        success: response.ok,
        error: !response.ok ? `HTTP ${response.status}` : undefined,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkStripeWebhookHealth() {
    return {
      name: 'Stripe Webhooks',
      status: process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET 
        ? 'healthy' : 'unhealthy',
      lastCheck: new Date()
    };
  }

  private async checkPushNotificationHealth() {
    return {
      name: 'Push Notifications',
      status: PushNotificationService.getPermissionStatus() ? 'healthy' : 'unhealthy',
      lastCheck: new Date()
    };
  }

  private async checkMonitoringWebhookHealth() {
    return {
      name: 'Monitoring Webhooks',
      status: 'healthy', // Could check actual monitoring endpoints
      lastCheck: new Date()
    };
  }

  private async checkDatabaseHealth() {
    try {
      const { error } = await supabase
        .from('webhook_logs')
        .select('count(*)', { count: 'exact', head: true });

      return {
        name: 'Database',
        status: error ? 'unhealthy' : 'healthy',
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        lastCheck: new Date()
      };
    }
  }

  private async retryWebhookEvent(eventId: string) {
    const { data: event, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      throw new Error('Webhook event not found');
    }

    // Implement retry logic based on event type
    // This is a simplified implementation
    await supabase
      .from('webhook_logs')
      .update({
        status: 'pending',
        retry_count: (event.retry_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    return { retried: true };
  }
}

// Express route handlers
const webhookAPI = WebhookManagementAPI.getInstance();

export const webhookManagementRoutes = {
  // GET /api/webhooks/config
  getConfigs: webhookAPI.getWebhookConfigs.bind(webhookAPI),
  
  // GET /api/webhooks/stats  
  getStats: webhookAPI.getWebhookStats.bind(webhookAPI),
  
  // GET /api/webhooks/events
  getEvents: webhookAPI.getWebhookEvents.bind(webhookAPI),
  
  // POST /api/webhooks/test/:id
  testWebhook: webhookAPI.testWebhook.bind(webhookAPI),
  
  // PATCH /api/webhooks/config/:id
  updateConfig: webhookAPI.updateWebhookConfig.bind(webhookAPI),
  
  // POST /api/webhooks/config
  createConfig: webhookAPI.createWebhookConfig.bind(webhookAPI),
  
  // DELETE /api/webhooks/config/:id
  deleteConfig: webhookAPI.deleteWebhookConfig.bind(webhookAPI),
  
  // GET /api/webhooks/health
  getHealth: webhookAPI.getWebhookHealth.bind(webhookAPI),
  
  // POST /api/webhooks/retry
  retryEvents: webhookAPI.retryFailedEvents.bind(webhookAPI)
};

export default WebhookManagementAPI;