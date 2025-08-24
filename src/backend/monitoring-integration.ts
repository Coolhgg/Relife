/// <reference path="../vite-env.d.ts" />
// Performance Monitoring Integration Service
// Centralized service to coordinate performance monitoring across all backend components

import { PerformanceMonitoringAPI } from './performance-monitoring';
import type { D1Database, KVNamespace } from '../types/index';
import {
  DatabaseUser,
  DatabaseAlarm,
  DatabaseAlarmEvent,
  DatabaseAnalyticsEvent,
  DatabaseUserStats,
  DatabaseEmotionalProfile,
  DatabaseBattleStats,
  DatabasePerformanceMetric,
  DatabaseDeploymentData,
  DatabaseHealthData,
  DatabaseAIResponse,
  DatabaseRecommendation,
  DatabaseVoiceAnalysis,
  DatabaseQueryResult,
  isDatabaseUser,
  isDatabaseAlarm,
  isDatabaseAlarmEvent,
  isNumeric,
  isStringValue,
  asNumber,
  asString,
  asObject,
} from './database-types';

// Integration service environment
interface MonitoringEnv {
  DB: D1Database;
  KV: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  POSTHOG_API_KEY?: string;
  SENTRY_DSN?: string;
  DATADOG_API_KEY?: string;
  NEWRELIC_API_KEY?: string;
  AMPLITUDE_API_KEY?: string;
  ENVIRONMENT: string;
  JWT_SECRET: string;
}

// Enhanced monitoring service with external integrations
export class MonitoringIntegrationService {
  private performanceAPI: PerformanceMonitoringAPI;
  private env: MonitoringEnv;

  constructor(env: MonitoringEnv) {
    this.env = env;
    this.performanceAPI = new PerformanceMonitoringAPI(env);
  }

  // Main request router for all monitoring endpoints
  async handleMonitoringRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Route performance monitoring requests
    if (
      url.pathname.startsWith('/api/performance/') ||
      url.pathname.startsWith('/api/analytics/') ||
      url.pathname.startsWith('/api/monitoring/')
    ) {
      return await this.performanceAPI.handleRequest(request);
    }

    // Route additional monitoring requests
    if (url.pathname.startsWith('/api/external-monitoring/')) {
      return await this.handleExternalMonitoringRequest(request);
    }

    // Route deployment monitoring requests
    if (url.pathname.startsWith('/api/deployment/')) {
      return await this.handleDeploymentMonitoringRequest(request);
    }

    return Response.json({ error: 'Monitoring endpoint not found' }, { status: 404 });
  }

  // Handle external monitoring service integrations
  private async handleExternalMonitoringRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const corsHeaders = this.getCorsHeaders(request.headers.get('Origin') || '*');

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // DataDog integration
      if (
        url.pathname === '/api/external-monitoring/datadog/metrics' &&
        method === 'POST'
      ) {
        return await this.forwardToDataDog(request, corsHeaders);
      }

      // New Relic integration
      if (
        url.pathname === '/api/external-monitoring/newrelic/events' &&
        method === 'POST'
      ) {
        return await this.forwardToNewRelic(request, corsHeaders);
      }

      // Amplitude integration
      if (
        url.pathname === '/api/external-monitoring/amplitude/events' &&
        method === 'POST'
      ) {
        return await this.forwardToAmplitude(request, corsHeaders);
      }

      // Webhook endpoints for external services
      if (
        url.pathname === '/api/external-monitoring/webhook/alerts' &&
        method === 'POST'
      ) {
        return await this.handleAlertWebhook(request, corsHeaders);
      }

      return Response.json(
        { error: 'External monitoring endpoint not found' },
        { status: 404, headers: corsHeaders }
      );
    } catch (error) {
      console.error('External monitoring error:', error);
      return Response.json(
        { error: 'External monitoring request failed' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Handle deployment monitoring
  private async handleDeploymentMonitoringRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const corsHeaders = this.getCorsHeaders(request.headers.get('Origin') || '*');

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Track deployment events
      if (url.pathname === '/api/deployment/track' && method === 'POST') {
        return await this.trackDeploymentEvent(request, corsHeaders);
      }

      // Get deployment metrics
      if (url.pathname === '/api/deployment/metrics' && method === 'GET') {
        return await this.getDeploymentMetrics(request, corsHeaders);
      }

      // Track deployment health
      if (url.pathname === '/api/deployment/health' && method === 'POST') {
        return await this.trackDeploymentHealth(request, corsHeaders);
      }

      // Get deployment status
      if (url.pathname === '/api/deployment/status' && method === 'GET') {
        return await this.getDeploymentStatus(request, corsHeaders);
      }

      return Response.json(
        { error: 'Deployment monitoring endpoint not found' },
        { status: 404, headers: corsHeaders }
      );
    } catch (error) {
      console.error('Deployment monitoring error:', error);
      return Response.json(
        { error: 'Deployment monitoring request failed' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // DataDog integration
  private async forwardToDataDog(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    if (!this.env.DATADOG_API_KEY) {
      return Response.json(
        { error: 'DataDog API key not configured' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const data = await request.json();
      const metrics = Array.isArray(data) ? data : [data];

      // Transform metrics to DataDog format
      const datadogMetrics = metrics.map(metric => ({
        metric: `relife.${metric.name}`,
        points: [[Math.floor(Date.now() / 1000), metric.value]],
        tags: [
          `environment:${this.env.ENVIRONMENT}`,
          `device_type:${metric.device_type || 'unknown'}`,
          `page:${metric.page_path || '/'}`,
          ...(metric.tags || []),
        ],
        type: metric.type || 'gauge',
      }));

      // Send to DataDog
      const response = await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.env.DATADOG_API_KEY,
        },
        body: JSON.stringify({ series: datadogMetrics }),
      });

      if (!response.ok) {
        throw new Error(`DataDog API error: ${response.status}`);
      }

      const result = await response.json();

      return Response.json(
        {
          success: true,
          datadog_response: result,
          metrics_sent: datadogMetrics.length,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('DataDog forwarding error:', error);
      return Response.json(
        { error: 'Failed to forward metrics to DataDog' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // New Relic integration
  private async forwardToNewRelic(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    if (!this.env.NEWRELIC_API_KEY) {
      return Response.json(
        { error: 'New Relic API key not configured' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const data = await request.json();
      const events = Array.isArray(data) ? data : [data];

      // Transform events to New Relic format
      const newRelicEvents = events.map(event => ({
        eventType: `RelifePerformance`,
        timestamp: Date.now(),
        appName: 'Relife Smart Alarm',
        environment: this.env.ENVIRONMENT,
        ...event,
      }));

      // Send to New Relic Insights API
      const response = await fetch(
        'https://insights-collector.newrelic.com/v1/accounts/YOUR_ACCOUNT_ID/events',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Insert-Key': this.env.NEWRELIC_API_KEY,
          },
          body: JSON.stringify(newRelicEvents),
        }
      );

      if (!response.ok) {
        throw new Error(`New Relic API error: ${response.status}`);
      }

      return Response.json(
        {
          success: true,
          events_sent: newRelicEvents.length,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('New Relic forwarding error:', error);
      return Response.json(
        { error: 'Failed to forward events to New Relic' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Amplitude integration
  private async forwardToAmplitude(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    if (!this.env.AMPLITUDE_API_KEY) {
      return Response.json(
        { error: 'Amplitude API key not configured' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const data = await request.json();
      const events = Array.isArray(data) ? data : [data];

      // Transform events to Amplitude format
      const amplitudeEvents = events.map(event => ({
        event_type: event.event_name || 'performance_metric',
        user_id: event.user_id,
        device_id: event.session_id,
        time: new Date(event.timestamp).getTime(),
        event_properties: {
          ...event.properties,
          environment: this.env.ENVIRONMENT,
          source: 'relife_monitoring',
        },
        user_properties: event.user_properties || {},
      }));

      // Send to Amplitude
      const response = await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.env.AMPLITUDE_API_KEY,
          events: amplitudeEvents,
        }),
      });

      if (!response.ok) {
        throw new Error(`Amplitude API error: ${response.status}`);
      }

      const result = await response.json();

      return Response.json(
        {
          success: true,
          amplitude_response: result,
          events_sent: amplitudeEvents.length,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Amplitude forwarding error:', error);
      return Response.json(
        { error: 'Failed to forward events to Amplitude' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Handle alert webhooks from external services
  private async handleAlertWebhook(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    try {
      const alertData = asObject(await request.json(), {});
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store alert in database for tracking
      await this.env.DB.prepare(
        `
        INSERT INTO error_logs
        (id, session_id, error_message, error_category, severity,
         page_path, metadata, occurrence_count, first_seen, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          alertId,
          'webhook_alert',
          asString(alertData.message, 'External alert received'),
          'external_alert',
          asString(alertData.severity, 'medium'),
          asString(alertData.source, 'external'),
          JSON.stringify(alertData),
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString()
        )
        .run();

      // Cache for immediate response
      await this.env.KV.put(`alert:${alertId}`, JSON.stringify(alertData), {
        expirationTtl: 3600,
      });

      return Response.json(
        {
          success: true,
          alert_id: alertId,
          processed: true,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Alert webhook error:', error);
      return Response.json(
        { error: 'Failed to process alert webhook' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Track deployment events
  private async trackDeploymentEvent(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    try {
      const deploymentData = asObject(await request.json(), {});
      const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store deployment event as performance metric
      await this.env.DB.prepare(
        `
        INSERT INTO performance_analytics
        (id, session_id, metric_name, metric_value, metric_unit,
         page_path, metadata, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          deploymentId,
          asString(deploymentData.deployment_id, 'unknown'),
          'deployment_event',
          1,
          'count',
          asString(deploymentData.environment, this.env.ENVIRONMENT),
          JSON.stringify(deploymentData),
          new Date().toISOString(),
          new Date().toISOString()
        )
        .run();

      // Cache deployment status
      await this.env.KV.put(
        `deployment:latest`,
        JSON.stringify({
          ...asObject(deploymentData),
          deployment_id: deploymentId,
          timestamp: new Date().toISOString(),
        }),
        { expirationTtl: 86400 * 7 } // 7 days
      );

      // Send deployment notification to external services
      await this.notifyDeployment(deploymentData, deploymentId);

      return Response.json(
        {
          success: true,
          deployment_id: deploymentId,
          tracked: true,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Deployment tracking error:', error);
      return Response.json(
        { error: 'Failed to track deployment' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Get deployment metrics
  private async getDeploymentMetrics(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const timeRange = url.searchParams.get('timeRange') || '7d';
      const environment = url.searchParams.get('environment') || this.env.ENVIRONMENT;

      const timeFilter = this.getTimeFilter(timeRange);

      // Get deployment frequency
      const deploymentQuery = `
        SELECT
          DATE(timestamp) as deployment_date,
          COUNT(*) as deployment_count,
          MAX(timestamp) as last_deployment
        FROM performance_analytics
        WHERE metric_name = 'deployment_event'
        AND timestamp > datetime('now', '${timeFilter}')
        AND page_path = ?
        GROUP BY DATE(timestamp)
        ORDER BY deployment_date DESC
      `;

      const deploymentResults = await this.env.DB.prepare(deploymentQuery)
        .bind(environment)
        .all();

      // Get deployment success rate (based on error logs after deployments)
      const errorQuery = `
        SELECT
          COUNT(*) as error_count,
          SUM(occurrence_count) as total_errors
        FROM error_logs
        WHERE created_at > datetime('now', '${timeFilter}')
        AND error_category IN ('deployment_error', 'system_error')
      `;

      const errorResults = await this.env.DB.prepare(errorQuery).first();

      // Get latest deployment info
      const latestDeployment = await this.env.KV.get('deployment:latest', 'json');

      const metrics = {
        timeRange,
        environment,
        generatedAt: new Date().toISOString(),
        deployments: {
          frequency: deploymentResults.results || [],
          totalCount: (deploymentResults.results || []).reduce(
            (sum: number, d: any) => sum + asNumber(d.deployment_count, 0),
            0
          ),
          latest: latestDeployment,
        },
        stability: {
          errorCount: asNumber(errorResults?.error_count, 0),
          totalErrors: asNumber(errorResults?.total_errors, 0),
          successRate: this.calculateDeploymentSuccessRate(
            deploymentResults.results || [],
            errorResults
          ),
        },
      };

      return Response.json(metrics, { headers: corsHeaders });
    } catch (error) {
      console.error('Error getting deployment metrics:', error);
      return Response.json(
        { error: 'Failed to get deployment metrics' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Track deployment health
  private async trackDeploymentHealth(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    try {
      const healthData = asObject(await request.json(), {});
      const healthId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store health metric
      await this.env.DB.prepare(
        `
        INSERT INTO performance_analytics
        (id, session_id, metric_name, metric_value, metric_unit,
         device_type, metadata, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          healthId,
          asString(healthData.deployment_id, 'unknown'),
          'deployment_health',
          asNumber(healthData.health_score, 0),
          'score',
          asString(healthData.environment, this.env.ENVIRONMENT),
          JSON.stringify(healthData),
          new Date().toISOString(),
          new Date().toISOString()
        )
        .run();

      // Update deployment health cache
      await this.env.KV.put(
        `deployment:health:${asString(healthData.deployment_id, 'unknown')}`,
        JSON.stringify(healthData),
        { expirationTtl: 3600 }
      );

      return Response.json(
        {
          success: true,
          health_id: healthId,
          tracked: true,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Deployment health tracking error:', error);
      return Response.json(
        { error: 'Failed to track deployment health' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Get deployment status
  private async getDeploymentStatus(
    request: Request,
    corsHeaders: HeadersInit
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const deploymentId = url.searchParams.get('deploymentId');

      if (deploymentId) {
        // Get specific deployment health
        const health = await this.env.KV.get(
          `deployment:health:${deploymentId}`,
          'json'
        );

        return Response.json(
          {
            deployment_id: deploymentId,
            health: health || { status: 'unknown' },
            timestamp: new Date().toISOString(),
          },
          { headers: corsHeaders }
        );
      } else {
        // Get overall deployment status
        const latest = await this.env.KV.get('deployment:latest', 'json');

        // Get recent health scores
        const recentHealth = await this.env.DB.prepare(
          `
          SELECT AVG(metric_value) as avg_health
          FROM performance_analytics
          WHERE metric_name = 'deployment_health'
          AND timestamp > datetime('now', '-1 hour')
        `
        ).first();

        return Response.json(
          {
            latest_deployment: latest,
            overall_health: asNumber(recentHealth?.avg_health, 0),
            status: asNumber(recentHealth?.avg_health, 0) > 0.8 ? 'healthy' : 'warning',
            timestamp: new Date().toISOString(),
          },
          { headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error('Error getting deployment status:', error);
      return Response.json(
        { error: 'Failed to get deployment status' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Helper methods

  private getCorsHeaders(origin: string): HeadersInit {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };
  }

  private getTimeFilter(timeRange: string): string {
    const timeMap: Record<string, string> = {
      '1h': '-1 hour',
      '24h': '-24 hours',
      '7d': '-7 days',
      '30d': '-30 days',
      '90d': '-90 days',
    };
    return timeMap[timeRange] || '-7 days';
  }

  private calculateDeploymentSuccessRate(deployments: any[], errors: any): number {
    if (!deployments || deployments.length === 0) return 1.0;

    const totalDeployments = deployments.reduce(
      (sum, d) => sum + asNumber(d.deployment_count, 0),
      0
    );
    const errorCount = asNumber(errors?.error_count, 0);

    return Math.max(0, (totalDeployments - errorCount) / totalDeployments);
  }

  // Notify external services about deployment
  private async notifyDeployment(
    deploymentData: any,
    deploymentId: string
  ): Promise<void> {
    // Send to DataDog if configured
    if (this.env.DATADOG_API_KEY) {
      try {
        await fetch('https://api.datadoghq.com/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': this.env.DATADOG_API_KEY,
          },
          body: JSON.stringify({
            title: 'Relife Deployment',
            text: `New deployment: ${deploymentData.version || 'unknown'} to ${deploymentData.environment || this.env.ENVIRONMENT}`,
            tags: [
              `environment:${this.env.ENVIRONMENT}`,
              `version:${deploymentData.version}`,
              'source:relife',
            ],
            alert_type: 'info',
          }),
        });
      } catch (error) {
        console.error('Failed to notify DataDog about deployment:', error);
      }
    }

    // Send to Sentry if configured
    if (this.env.SENTRY_DSN) {
      try {
        await fetch('https://sentry.io/api/0/organizations/YOUR_ORG/releases/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.env.SENTRY_DSN}`,
          },
          body: JSON.stringify({
            version: deploymentData.version || deploymentId,
            environment: this.env.ENVIRONMENT,
            dateReleased: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to notify Sentry about deployment:', error);
      }
    }
  }
}

// Main worker export for monitoring integration
export default {
  async fetch(request: Request, env: MonitoringEnv): Promise<Response> {
    const integrationService = new MonitoringIntegrationService(env);
    return await integrationService.handleMonitoringRequest(request);
  },
};

// Available Monitoring Integration Endpoints:
//
// Performance Monitoring (delegated to PerformanceMonitoringAPI):
// POST /api/performance/* - All performance monitoring endpoints
// GET  /api/analytics/* - All analytics endpoints
// GET  /api/monitoring/* - All monitoring endpoints
//
// External Service Integrations:
// POST /api/external-monitoring/datadog/metrics - Forward metrics to DataDog
// POST /api/external-monitoring/newrelic/events - Forward events to New Relic
// POST /api/external-monitoring/amplitude/events - Forward events to Amplitude
// POST /api/external-monitoring/webhook/alerts - Handle external alert webhooks
//
// Deployment Monitoring:
// POST /api/deployment/track - Track deployment events
// GET  /api/deployment/metrics - Get deployment metrics
// POST /api/deployment/health - Track deployment health
// GET  /api/deployment/status - Get deployment status
