/// <reference path="../vite-env.d.ts" />
// Enhanced Performance Monitoring API for Relife Smart Alarm
// Advanced performance tracking, analytics, and real-world usage monitoring
// Built for Cloudflare Workers with D1 Database integration

import type { D1Database, KVNamespace } from "../types/index";

// Environment bindings interface
interface Env {
  // Database connections
  DB: D1Database; // D1 SQL database
  KV: KVNamespace; // Key-value storage for caching

  // External service keys
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  POSTHOG_API_KEY?: string;
  SENTRY_DSN?: string;

  // Configuration
  ENVIRONMENT: string;
  JWT_SECRET: string;
}

// Performance metrics interfaces
interface PerformanceMetric {
  id?: string;
  user_id?: string;
  session_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  page_path?: string;
  user_agent?: string;
  device_type?: string;
  network_type?: string;
  timestamp?: string;
  metadata?: any;
}

interface WebVitalsData {
  session_id: string;
  user_id?: string;
  url: string;
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint
  device_type: string;
  connection_type?: string;
  viewport_size?: string;
  user_agent?: string;
  timestamp: string;
}

interface ErrorEvent {
  user_id?: string;
  session_id: string;
  error_message: string;
  error_stack?: string;
  error_category: string;
  severity: "low" | "medium" | "high" | "critical";
  page_path?: string;
  user_agent?: string;
  device_info?: any;
  app_version?: string;
  fingerprint: string;
}

interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  session_id: string;
  properties: Record<string, any>;
  timestamp: string;
  page_path?: string;
  device_type?: string;
}

// Performance Monitoring API Class
export class PerformanceMonitoringAPI {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // Main request handler
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const origin = request.headers.get("Origin") || "*";

    // CORS headers
    const corsHeaders = this.getCorsHeaders(origin);

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Performance metrics collection endpoints
      if (url.pathname === "/api/performance/metrics" && method === "POST") {
        return await this.collectPerformanceMetrics(request, corsHeaders);
      }

      if (url.pathname === "/api/performance/web-vitals" && method === "POST") {
        return await this.collectWebVitals(request, corsHeaders);
      }

      if (url.pathname === "/api/performance/errors" && method === "POST") {
        return await this.logError(request, corsHeaders);
      }

      if (url.pathname === "/api/performance/analytics" && method === "POST") {
        return await this.trackAnalyticsEvent(request, corsHeaders);
      }

      // Performance data retrieval endpoints
      if (url.pathname === "/api/performance/dashboard" && method === "GET") {
        return await this.getPerformanceDashboard(request, corsHeaders);
      }

      if (
        url.pathname === "/api/performance/user-metrics" &&
        method === "GET"
      ) {
        return await this.getUserMetrics(request, corsHeaders);
      }

      if (
        url.pathname === "/api/performance/system-health" &&
        method === "GET"
      ) {
        return await this.getSystemHealth(request, corsHeaders);
      }

      if (url.pathname === "/api/performance/real-time" && method === "GET") {
        return await this.getRealTimeMetrics(request, corsHeaders);
      }

      // Advanced analytics endpoints
      if (url.pathname === "/api/performance/trends" && method === "GET") {
        return await this.getPerformanceTrends(request, corsHeaders);
      }

      if (url.pathname === "/api/performance/anomalies" && method === "GET") {
        return await this.detectAnomalies(request, corsHeaders);
      }

      if (
        url.pathname === "/api/performance/recommendations" &&
        method === "GET"
      ) {
        return await this.getOptimizationRecommendations(request, corsHeaders);
      }

      // Health check
      if (url.pathname === "/api/performance/health" && method === "GET") {
        return this.healthCheck(corsHeaders);
      }

      return Response.json(
        { error: "Not Found", path: url.pathname },
        { status: 404, headers: corsHeaders },
      );
    } catch (error) {
      console.error("Performance API Error:", error);

      // Log critical errors to monitoring
      await this.logCriticalError(error, request);

      return Response.json(
        { error: "Internal Server Error" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Collect performance metrics
  private async collectPerformanceMetrics(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const metrics: PerformanceMetric[] = await request.json();

      if (!Array.isArray(metrics)) {
        return Response.json(
          { error: "Metrics must be an array" },
          { status: 400, headers: corsHeaders },
        );
      }

      const processedMetrics = [];
      const timestamp = new Date().toISOString();

      for (const metric of metrics) {
        const processedMetric = {
          id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: metric.user_id || undefined,
          session_id: metric.session_id,
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          metric_unit: metric.metric_unit || "ms",
          page_path: metric.page_path || "/",
          user_agent:
            metric.user_agent || request.headers.get("User-Agent") || undefined,
          device_type:
            metric.device_type ||
            this.detectDeviceType(request.headers.get("User-Agent") || ""),
          network_type: metric.network_type || "unknown",
          timestamp: metric.timestamp || timestamp,
          metadata: JSON.stringify(metric.metadata || {}),
          created_at: timestamp,
        };

        processedMetrics.push(processedMetric);

        // Store in D1 database
        await this.env.DB.prepare(
          `
          INSERT INTO performance_analytics 
          (id, user_id, session_id, metric_name, metric_value, metric_unit, 
           page_path, user_agent, device_type, network_type, timestamp, metadata, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        )
          .bind(
            processedMetric.id,
            processedMetric.user_id,
            processedMetric.session_id,
            processedMetric.metric_name,
            processedMetric.metric_value,
            processedMetric.metric_unit,
            processedMetric.page_path,
            processedMetric.user_agent,
            processedMetric.device_type,
            processedMetric.network_type,
            processedMetric.timestamp,
            processedMetric.metadata,
            processedMetric.created_at,
          )
          .run();

        // Cache recent metrics for real-time access
        await this.cacheRecentMetric(processedMetric);
      }

      // Update real-time aggregations
      await this.updateRealTimeAggregations(processedMetrics);

      return Response.json(
        {
          success: true,
          processed: processedMetrics.length,
          timestamp,
        },
        { headers: corsHeaders },
      );
    } catch (error) {
      console.error("Error collecting performance metrics:", error);
      return Response.json(
        { error: "Failed to collect metrics" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Collect Web Vitals data
  private async collectWebVitals(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const vitalsData: WebVitalsData = await request.json();

      const timestamp = new Date().toISOString();
      const vitalsId = `vitals_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store individual Web Vitals metrics
      const vitalsMetrics = [
        { name: "FCP", value: vitalsData.fcp, unit: "ms" },
        { name: "LCP", value: vitalsData.lcp, unit: "ms" },
        { name: "FID", value: vitalsData.fid, unit: "ms" },
        { name: "CLS", value: vitalsData.cls, unit: "score" },
        { name: "TTFB", value: vitalsData.ttfb, unit: "ms" },
        { name: "INP", value: vitalsData.inp, unit: "ms" },
      ];

      for (const vital of vitalsMetrics) {
        if (vital.value !== undefined && vital.value !== null) {
          await this.env.DB.prepare(
            `
            INSERT INTO performance_analytics 
            (id, user_id, session_id, metric_name, metric_value, metric_unit, 
             page_path, user_agent, device_type, network_type, timestamp, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          )
            .bind(
              `${vitalsId}_${vital.name.toLowerCase()}`,
              vitalsData.user_id || null,
              vitalsData.session_id,
              `web_vitals_${vital.name.toLowerCase()}`,
              vital.value,
              vital.unit,
              vitalsData.url,
              vitalsData.user_agent || request.headers.get("User-Agent"),
              vitalsData.device_type,
              vitalsData.connection_type || "unknown",
              vitalsData.timestamp,
              JSON.stringify({
                viewport_size: vitalsData.viewport_size,
                connection_type: vitalsData.connection_type,
              }),
              timestamp,
            )
            .run();
        }
      }

      // Cache aggregated Web Vitals for real-time dashboard
      await this.cacheWebVitalsAggregation(vitalsData);

      // Check for performance budget violations
      await this.checkPerformanceBudgets(vitalsData);

      return Response.json(
        {
          success: true,
          vitals_id: vitalsId,
          timestamp,
        },
        { headers: corsHeaders },
      );
    } catch (error) {
      console.error("Error collecting Web Vitals:", error);
      return Response.json(
        { error: "Failed to collect Web Vitals" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Log errors with enhanced context
  private async logError(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const errorData: ErrorEvent = await request.json();

      const timestamp = new Date().toISOString();
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate error fingerprint for deduplication
      const fingerprint =
        errorData.fingerprint || this.generateErrorFingerprint(errorData);

      // Check if error already exists
      const existingError = await this.env.DB.prepare(
        `
        SELECT id, occurrence_count FROM error_logs 
        WHERE fingerprint = ? AND created_at > datetime('now', '-24 hours')
        LIMIT 1
      `,
      )
        .bind(fingerprint)
        .first();

      if (existingError) {
        // Update existing error count
        await this.env.DB.prepare(
          `
          UPDATE error_logs 
          SET occurrence_count = occurrence_count + 1, last_seen = ?
          WHERE id = ?
        `,
        )
          .bind(timestamp, existingError.id)
          .run();

        return Response.json(
          {
            success: true,
            error_id: existingError.id,
            action: "updated_existing",
            occurrence_count: existingError.occurrence_count + 1,
          },
          { headers: corsHeaders },
        );
      }

      // Create new error log
      await this.env.DB.prepare(
        `
        INSERT INTO error_logs 
        (id, user_id, session_id, error_message, error_stack, error_category, 
         severity, page_path, user_agent, device_info, app_version, fingerprint,
         occurrence_count, first_seen, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          errorId,
          errorData.user_id || null,
          errorData.session_id,
          errorData.error_message,
          errorData.error_stack || null,
          errorData.error_category,
          errorData.severity,
          errorData.page_path || "/",
          errorData.user_agent || request.headers.get("User-Agent"),
          JSON.stringify(errorData.device_info || {}),
          errorData.app_version || "unknown",
          fingerprint,
          1,
          timestamp,
          timestamp,
          timestamp,
        )
        .run();

      // Cache critical errors for immediate alerting
      if (errorData.severity === "critical") {
        await this.cacheCriticalError(errorData, errorId);
      }

      // Send to external monitoring services if configured
      if (this.env.SENTRY_DSN) {
        await this.sendToSentry(errorData);
      }

      return Response.json(
        {
          success: true,
          error_id: errorId,
          action: "created_new",
          fingerprint,
        },
        { headers: corsHeaders },
      );
    } catch (error) {
      console.error("Error logging error:", error);
      return Response.json(
        { error: "Failed to log error" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Track analytics events
  private async trackAnalyticsEvent(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const eventData: AnalyticsEvent = await request.json();

      const timestamp = new Date().toISOString();
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store as performance metric for unified analytics
      await this.env.DB.prepare(
        `
        INSERT INTO performance_analytics 
        (id, user_id, session_id, metric_name, metric_value, metric_unit, 
         page_path, user_agent, device_type, network_type, timestamp, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          eventId,
          eventData.user_id || null,
          eventData.session_id,
          `analytics_${eventData.event_name}`,
          1, // Event occurrence count
          "count",
          eventData.page_path || "/",
          request.headers.get("User-Agent"),
          eventData.device_type ||
            this.detectDeviceType(request.headers.get("User-Agent") || ""),
          "unknown",
          eventData.timestamp,
          JSON.stringify(eventData.properties),
          timestamp,
        )
        .run();

      // Cache for real-time analytics
      await this.cacheAnalyticsEvent(eventData, eventId);

      // Forward to external analytics if configured
      if (this.env.POSTHOG_API_KEY) {
        await this.forwardToPostHog(eventData);
      }

      return Response.json(
        {
          success: true,
          event_id: eventId,
          timestamp,
        },
        { headers: corsHeaders },
      );
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      return Response.json(
        { error: "Failed to track event" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Get performance dashboard data
  private async getPerformanceDashboard(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const timeRange = url.searchParams.get("timeRange") || "24h";
      const userId = url.searchParams.get("userId");

      const timeFilter = this.getTimeFilter(timeRange);

      // Get Web Vitals summary
      const vitalsQuery = `
        SELECT 
          metric_name,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          COUNT(*) as sample_count
        FROM performance_analytics 
        WHERE metric_name LIKE 'web_vitals_%' 
        AND timestamp > datetime('now', '${timeFilter}')
        ${userId ? "AND user_id = ?" : ""}
        GROUP BY metric_name
      `;

      const vitalsResults = userId
        ? await this.env.DB.prepare(vitalsQuery).bind(userId).all()
        : await this.env.DB.prepare(vitalsQuery).all();

      // Get error summary
      const errorQuery = `
        SELECT 
          severity,
          COUNT(*) as error_count,
          SUM(occurrence_count) as total_occurrences
        FROM error_logs 
        WHERE created_at > datetime('now', '${timeFilter}')
        ${userId ? "AND user_id = ?" : ""}
        GROUP BY severity
      `;

      const errorResults = userId
        ? await this.env.DB.prepare(errorQuery).bind(userId).all()
        : await this.env.DB.prepare(errorQuery).all();

      // Get device type distribution
      const deviceQuery = `
        SELECT 
          device_type,
          COUNT(*) as count
        FROM performance_analytics 
        WHERE timestamp > datetime('now', '${timeFilter}')
        ${userId ? "AND user_id = ?" : ""}
        GROUP BY device_type
        ORDER BY count DESC
      `;

      const deviceResults = userId
        ? await this.env.DB.prepare(deviceQuery).bind(userId).all()
        : await this.env.DB.prepare(deviceQuery).all();

      // Get performance trends (hourly)
      const trendsQuery = `
        SELECT 
          strftime('%H', timestamp) as hour,
          metric_name,
          AVG(metric_value) as avg_value
        FROM performance_analytics 
        WHERE metric_name IN ('web_vitals_lcp', 'web_vitals_fid', 'web_vitals_cls')
        AND timestamp > datetime('now', '${timeFilter}')
        ${userId ? "AND user_id = ?" : ""}
        GROUP BY hour, metric_name
        ORDER BY hour, metric_name
      `;

      const trendsResults = userId
        ? await this.env.DB.prepare(trendsQuery).bind(userId).all()
        : await this.env.DB.prepare(trendsQuery).all();

      const dashboard = {
        timeRange,
        generatedAt: new Date().toISOString(),
        webVitals: this.processVitalsResults(vitalsResults.results || []),
        errors: this.processErrorResults(errorResults.results || []),
        deviceDistribution: deviceResults.results || [],
        performanceTrends: this.processeTrendsResults(
          trendsResults.results || [],
        ),
        summary: {
          totalMetrics:
            vitalsResults.results?.reduce(
              (sum: number, v: any) => sum + v.sample_count,
              0,
            ) || 0,
          totalErrors:
            errorResults.results?.reduce(
              (sum: number, e: any) => sum + e.total_occurrences,
              0,
            ) || 0,
          uniqueUsers: await this.getUniqueUsersCount(timeFilter, userId),
          avgPerformanceScore: await this.calculatePerformanceScore(
            timeFilter,
            userId,
          ),
        },
      };

      return Response.json(dashboard, { headers: corsHeaders });
    } catch (error) {
      console.error("Error getting performance dashboard:", error);
      return Response.json(
        { error: "Failed to get dashboard data" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Get user-specific metrics
  private async getUserMetrics(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      const sessionId = url.searchParams.get("sessionId");
      const timeRange = url.searchParams.get("timeRange") || "7d";

      if (!userId && !sessionId) {
        return Response.json(
          { error: "Either userId or sessionId is required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const timeFilter = this.getTimeFilter(timeRange);
      let whereClause = `WHERE timestamp > datetime('now', '${timeFilter}')`;
      const bindParams: string[] = [];

      if (userId) {
        whereClause += ` AND user_id = ?`;
        bindParams.push(userId);
      }

      if (sessionId) {
        whereClause += ` AND session_id = ?`;
        bindParams.push(sessionId);
      }

      // Get user's performance metrics over time
      const metricsQuery = `
        SELECT 
          DATE(timestamp) as date,
          metric_name,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          COUNT(*) as sample_count
        FROM performance_analytics 
        ${whereClause}
        GROUP BY DATE(timestamp), metric_name
        ORDER BY date DESC, metric_name
      `;

      const stmt = this.env.DB.prepare(metricsQuery);
      const metricsResults =
        bindParams.length > 0
          ? await stmt.bind(...bindParams).all()
          : await stmt.all();

      // Get user's error patterns
      const errorsQuery = `
        SELECT 
          DATE(created_at) as date,
          error_category,
          severity,
          COUNT(*) as error_count,
          SUM(occurrence_count) as total_occurrences
        FROM error_logs 
        ${whereClause.replace("timestamp", "created_at")}
        GROUP BY DATE(created_at), error_category, severity
        ORDER BY date DESC
      `;

      const errorStmt = this.env.DB.prepare(errorsQuery);
      const errorResults =
        bindParams.length > 0
          ? await errorStmt.bind(...bindParams).all()
          : await errorStmt.all();

      const userMetrics = {
        userId,
        sessionId,
        timeRange,
        generatedAt: new Date().toISOString(),
        performanceMetrics: metricsResults.results || [],
        errorPatterns: errorResults.results || [],
        insights: await this.generateUserInsights(
          userId,
          sessionId,
          timeFilter,
        ),
      };

      return Response.json(userMetrics, { headers: corsHeaders });
    } catch (error) {
      console.error("Error getting user metrics:", error);
      return Response.json(
        { error: "Failed to get user metrics" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Get system health status
  private async getSystemHealth(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const currentTime = new Date().toISOString();

      // Check recent error rates
      const recentErrors = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as error_count, SUM(occurrence_count) as total_occurrences
        FROM error_logs 
        WHERE created_at > datetime('now', '-1 hour')
      `,
      ).first();

      // Check performance thresholds
      const recentPerformance = await this.env.DB.prepare(
        `
        SELECT 
          metric_name,
          AVG(metric_value) as avg_value
        FROM performance_analytics 
        WHERE metric_name IN ('web_vitals_lcp', 'web_vitals_fid', 'web_vitals_cls')
        AND timestamp > datetime('now', '-1 hour')
        GROUP BY metric_name
      `,
      ).all();

      // Check database health
      const dbHealth = await this.checkDatabaseHealth();

      // Calculate overall health score
      const healthScore = this.calculateHealthScore(
        recentErrors,
        recentPerformance.results || [],
      );

      const healthStatus = {
        status:
          healthScore > 0.8
            ? "healthy"
            : healthScore > 0.6
              ? "warning"
              : "critical",
        score: healthScore,
        timestamp: currentTime,
        checks: {
          database: dbHealth,
          errors: {
            recentCount: recentErrors?.error_count || 0,
            totalOccurrences: recentErrors?.total_occurrences || 0,
            status:
              (recentErrors?.total_occurrences || 0) < 10
                ? "healthy"
                : "warning",
          },
          performance: {
            metrics: recentPerformance.results || [],
            status: this.getPerformanceHealthStatus(
              recentPerformance.results || [],
            ),
          },
        },
      };

      return Response.json(healthStatus, { headers: corsHeaders });
    } catch (error) {
      console.error("Error getting system health:", error);
      return Response.json(
        {
          status: "critical",
          error: "Failed to get system health",
          timestamp: new Date().toISOString(),
        },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Get real-time metrics
  private async getRealTimeMetrics(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      // Get cached real-time data from KV
      const realtimeKey = "performance:realtime:current";
      const cached = await this.env.KV.get(realtimeKey, "json");

      if (cached) {
        return Response.json(cached, { headers: corsHeaders });
      }

      // Fallback to recent database data
      const realtimeData = await this.generateRealTimeMetrics();

      // Cache for 30 seconds
      await this.env.KV.put(realtimeKey, JSON.stringify(realtimeData), {
        expirationTtl: 30,
      });

      return Response.json(realtimeData, { headers: corsHeaders });
    } catch (error) {
      console.error("Error getting real-time metrics:", error);
      return Response.json(
        { error: "Failed to get real-time metrics" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Get performance trends
  private async getPerformanceTrends(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const timeRange = url.searchParams.get("timeRange") || "7d";
      const metric = url.searchParams.get("metric") || "web_vitals_lcp";
      const granularity = url.searchParams.get("granularity") || "hour";

      const timeFilter = this.getTimeFilter(timeRange);
      const timeFormat =
        granularity === "hour" ? "%Y-%m-%d %H:00:00" : "%Y-%m-%d";

      const trendsQuery = `
        SELECT 
          strftime('${timeFormat}', timestamp) as time_bucket,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          COUNT(*) as sample_count,
          PERCENTILE(metric_value, 0.5) as p50,
          PERCENTILE(metric_value, 0.95) as p95
        FROM performance_analytics 
        WHERE metric_name = ?
        AND timestamp > datetime('now', '${timeFilter}')
        GROUP BY time_bucket
        ORDER BY time_bucket
      `;

      const results = await this.env.DB.prepare(trendsQuery).bind(metric).all();

      const trends = {
        metric,
        timeRange,
        granularity,
        generatedAt: new Date().toISOString(),
        data: results.results || [],
        analysis: this.analyzeTrends(results.results || []),
      };

      return Response.json(trends, { headers: corsHeaders });
    } catch (error) {
      console.error("Error getting performance trends:", error);
      return Response.json(
        { error: "Failed to get performance trends" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Detect anomalies
  private async detectAnomalies(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const timeRange = url.searchParams.get("timeRange") || "24h";
      const sensitivity = parseFloat(
        url.searchParams.get("sensitivity") || "2.0",
      );

      const anomalies = await this.performAnomalyDetection(
        timeRange,
        sensitivity,
      );

      return Response.json(
        {
          timeRange,
          sensitivity,
          generatedAt: new Date().toISOString(),
          anomalies,
        },
        { headers: corsHeaders },
      );
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      return Response.json(
        { error: "Failed to detect anomalies" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Get optimization recommendations
  private async getOptimizationRecommendations(
    request: Request,
    corsHeaders: HeadersInit,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      const timeRange = url.searchParams.get("timeRange") || "7d";

      const recommendations = await this.generateOptimizationRecommendations(
        userId,
        timeRange,
      );

      return Response.json(
        {
          userId,
          timeRange,
          generatedAt: new Date().toISOString(),
          recommendations,
        },
        { headers: corsHeaders },
      );
    } catch (error) {
      console.error("Error getting optimization recommendations:", error);
      return Response.json(
        { error: "Failed to get recommendations" },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Health check endpoint
  private healthCheck(corsHeaders: HeadersInit): Response {
    return Response.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        environment: this.env.ENVIRONMENT || "production",
      },
      { headers: corsHeaders },
    );
  }

  // Helper methods

  private getCorsHeaders(origin: string): HeadersInit {
    return {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };
  }

  private detectDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      return "mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return "tablet";
    }
    return "desktop";
  }

  private generateErrorFingerprint(error: ErrorEvent): string {
    const content = `${error.error_message}${error.error_category}${error.page_path}`;
    return btoa(content).substring(0, 32);
  }

  private getTimeFilter(timeRange: string): string {
    const timeMap: Record<string, string> = {
      "1h": "-1 hour",
      "24h": "-24 hours",
      "7d": "-7 days",
      "30d": "-30 days",
      "90d": "-90 days",
    };
    return timeMap[timeRange] || "-24 hours";
  }

  private processVitalsResults(results: any[]): any {
    const processed: Record<string, any> = {};
    for (const result of results) {
      const metric = result.metric_name.replace("web_vitals_", "");
      processed[metric] = {
        average: result.avg_value,
        min: result.min_value,
        max: result.max_value,
        samples: result.sample_count,
      };
    }
    return processed;
  }

  private processErrorResults(results: any[]): any {
    const processed: Record<string, any> = {};
    for (const result of results) {
      processed[result.severity] = {
        count: result.error_count,
        occurrences: result.total_occurrences,
      };
    }
    return processed;
  }

  private processeTrendsResults(results: any[]): any {
    const processed: Record<string, any[]> = {};
    for (const result of results) {
      if (!processed[result.metric_name]) {
        processed[result.metric_name] = [];
      }
      processed[result.metric_name].push({
        hour: result.hour,
        value: result.avg_value,
      });
    }
    return processed;
  }

  private async getUniqueUsersCount(
    timeFilter: string,
    userId?: string | null,
  ): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT user_id) as unique_users
      FROM performance_analytics 
      WHERE timestamp > datetime('now', '${timeFilter}')
      AND user_id IS NOT NULL
      ${userId ? "AND user_id = ?" : ""}
    `;

    const result = userId
      ? await this.env.DB.prepare(query).bind(userId).first()
      : await this.env.DB.prepare(query).first();

    return result?.unique_users || 0;
  }

  private async calculatePerformanceScore(
    timeFilter: string,
    userId?: string | null,
  ): Promise<number> {
    // Simplified performance score calculation
    const query = `
      SELECT 
        AVG(CASE WHEN metric_name = 'web_vitals_lcp' THEN metric_value END) as avg_lcp,
        AVG(CASE WHEN metric_name = 'web_vitals_fid' THEN metric_value END) as avg_fid,
        AVG(CASE WHEN metric_name = 'web_vitals_cls' THEN metric_value END) as avg_cls
      FROM performance_analytics 
      WHERE timestamp > datetime('now', '${timeFilter}')
      AND metric_name LIKE 'web_vitals_%'
      ${userId ? "AND user_id = ?" : ""}
    `;

    const result = userId
      ? await this.env.DB.prepare(query).bind(userId).first()
      : await this.env.DB.prepare(query).first();

    if (!result) return 0;

    // Score based on Web Vitals thresholds
    let score = 100;
    if (result.avg_lcp > 4000) score -= 30;
    else if (result.avg_lcp > 2500) score -= 15;

    if (result.avg_fid > 300) score -= 25;
    else if (result.avg_fid > 100) score -= 10;

    if (result.avg_cls > 0.25) score -= 25;
    else if (result.avg_cls > 0.1) score -= 10;

    return Math.max(0, score) / 100;
  }

  private async checkDatabaseHealth(): Promise<any> {
    try {
      const start = Date.now();
      await this.env.DB.prepare("SELECT 1").first();
      const responseTime = Date.now() - start;

      return {
        status: responseTime < 100 ? "healthy" : "warning",
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (_error) {
      return {
        status: "critical",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      };
    }
  }

  private calculateHealthScore(
    recentErrors: any,
    performanceMetrics: any[],
  ): number {
    let score = 1.0;

    // Deduct for errors
    if (recentErrors?.total_occurrences) {
      score -= Math.min(0.4, recentErrors.total_occurrences / 100);
    }

    // Deduct for poor performance
    for (const metric of performanceMetrics) {
      if (metric.metric_name === "web_vitals_lcp" && metric.avg_value > 4000) {
        score -= 0.2;
      }
      if (metric.metric_name === "web_vitals_fid" && metric.avg_value > 300) {
        score -= 0.2;
      }
      if (metric.metric_name === "web_vitals_cls" && metric.avg_value > 0.25) {
        score -= 0.2;
      }
    }

    return Math.max(0, score);
  }

  private getPerformanceHealthStatus(metrics: any[]): string {
    for (const metric of metrics) {
      if (metric.metric_name === "web_vitals_lcp" && metric.avg_value > 4000)
        return "warning";
      if (metric.metric_name === "web_vitals_fid" && metric.avg_value > 300)
        return "warning";
      if (metric.metric_name === "web_vitals_cls" && metric.avg_value > 0.25)
        return "warning";
    }
    return "healthy";
  }

  private async generateRealTimeMetrics(): Promise<any> {
    const current5Min = await this.env.DB.prepare(
      `
      SELECT 
        metric_name,
        AVG(metric_value) as avg_value,
        COUNT(*) as sample_count
      FROM performance_analytics 
      WHERE timestamp > datetime('now', '-5 minutes')
      GROUP BY metric_name
    `,
    ).all();

    return {
      timestamp: new Date().toISOString(),
      period: "5 minutes",
      metrics: current5Min.results || [],
    };
  }

  private analyzeTrends(data: any[]): any {
    if (data.length < 2) return { trend: "insufficient_data" };

    const values = data.map((d) => d.avg_value);
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    return {
      trend: change > 5 ? "increasing" : change < -5 ? "decreasing" : "stable",
      changePercent: change,
      direction: change > 0 ? "up" : "down",
    };
  }

  private async performAnomalyDetection(
    timeRange: string,
    sensitivity: number,
  ): Promise<any[]> {
    // Simplified anomaly detection using statistical methods
    const timeFilter = this.getTimeFilter(timeRange);

    const results = await this.env.DB.prepare(
      `
      SELECT 
        metric_name,
        metric_value,
        timestamp
      FROM performance_analytics 
      WHERE timestamp > datetime('now', '${timeFilter}')
      AND metric_name IN ('web_vitals_lcp', 'web_vitals_fid', 'web_vitals_cls')
      ORDER BY timestamp
    `,
    ).all();

    // Group by metric and detect anomalies
    const anomalies: any[] = [];
    const metricGroups: Record<string, any[]> = {};

    for (const result of results.results || []) {
      if (!metricGroups[result.metric_name]) {
        metricGroups[result.metric_name] = [];
      }
      metricGroups[result.metric_name].push(result);
    }

    for (const [metricName, values] of Object.entries(metricGroups)) {
      const mean =
        values.reduce((sum, v) => sum + v.metric_value, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v.metric_value - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);

      const threshold = mean + sensitivity * stdDev;

      for (const value of values) {
        if (value.metric_value > threshold) {
          anomalies.push({
            metric: metricName,
            value: value.metric_value,
            timestamp: value.timestamp,
            threshold,
            severity: value.metric_value > threshold * 1.5 ? "high" : "medium",
          });
        }
      }
    }

    return anomalies;
  }

  private async generateOptimizationRecommendations(
    userId: string | null,
    timeRange: string,
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // Analyze performance patterns and generate recommendations
    const timeFilter = this.getTimeFilter(timeRange);
    let whereClause = `WHERE timestamp > datetime('now', '${timeFilter}')`;

    if (userId) {
      whereClause += ` AND user_id = '${userId}'`;
    }

    const analysis = await this.env.DB.prepare(
      `
      SELECT 
        metric_name,
        AVG(metric_value) as avg_value,
        device_type,
        COUNT(*) as sample_count
      FROM performance_analytics 
      ${whereClause}
      AND metric_name LIKE 'web_vitals_%'
      GROUP BY metric_name, device_type
    `,
    ).all();

    // Generate recommendations based on analysis
    for (const result of analysis.results || []) {
      if (result.metric_name === "web_vitals_lcp" && result.avg_value > 2500) {
        recommendations.push({
          type: "performance",
          severity: result.avg_value > 4000 ? "high" : "medium",
          title: "Optimize Largest Contentful Paint",
          description: `LCP is ${Math.round(result.avg_value)}ms on ${result.device_type} devices. Target: <2500ms`,
          suggestion:
            "Consider optimizing images, improving server response times, or preloading critical resources.",
          impact: "User experience and SEO rankings",
          metric: "web_vitals_lcp",
          deviceType: result.device_type,
          currentValue: result.avg_value,
          targetValue: 2500,
        });
      }

      if (result.metric_name === "web_vitals_fid" && result.avg_value > 100) {
        recommendations.push({
          type: "interactivity",
          severity: result.avg_value > 300 ? "high" : "medium",
          title: "Improve First Input Delay",
          description: `FID is ${Math.round(result.avg_value)}ms on ${result.device_type} devices. Target: <100ms`,
          suggestion:
            "Reduce JavaScript execution time, break up long tasks, or use web workers for heavy computations.",
          impact: "User interaction responsiveness",
          metric: "web_vitals_fid",
          deviceType: result.device_type,
          currentValue: result.avg_value,
          targetValue: 100,
        });
      }

      if (result.metric_name === "web_vitals_cls" && result.avg_value > 0.1) {
        recommendations.push({
          type: "stability",
          severity: result.avg_value > 0.25 ? "high" : "medium",
          title: "Reduce Cumulative Layout Shift",
          description: `CLS is ${result.avg_value.toFixed(3)} on ${result.device_type} devices. Target: <0.1`,
          suggestion:
            "Add size attributes to images and videos, avoid inserting content above existing content, or preload fonts.",
          impact: "Visual stability and user experience",
          metric: "web_vitals_cls",
          deviceType: result.device_type,
          currentValue: result.avg_value,
          targetValue: 0.1,
        });
      }
    }

    return recommendations;
  }

  private async generateUserInsights(
    userId: string | null,
    sessionId: string | null,
    _timeFilter: string,
  ): Promise<any[]> {
    const insights: any[] = [];

    // Add user-specific insights based on their patterns
    if (userId || sessionId) {
      insights.push({
        type: "user_pattern",
        title: "Performance Pattern Analysis",
        description:
          "Based on your usage patterns over the selected time period.",
        confidence: 0.8,
      });
    }

    return insights;
  }

  // Cache management methods
  private async cacheRecentMetric(metric: PerformanceMetric): Promise<void> {
    const key = `metric:recent:${metric.session_id}:${Date.now()}`;
    await this.env.KV.put(key, JSON.stringify(metric), { expirationTtl: 3600 });
  }

  private async cacheWebVitalsAggregation(
    vitals: WebVitalsData,
  ): Promise<void> {
    const key = `vitals:${vitals.session_id}:${Date.now()}`;
    await this.env.KV.put(key, JSON.stringify(vitals), {
      expirationTtl: 86400,
    });
  }

  private async cacheAnalyticsEvent(
    event: AnalyticsEvent,
    eventId: string,
  ): Promise<void> {
    const key = `analytics:${event.session_id}:${eventId}`;
    await this.env.KV.put(key, JSON.stringify(event), { expirationTtl: 3600 });
  }

  private async cacheCriticalError(
    error: ErrorEvent,
    errorId: string,
  ): Promise<void> {
    const key = `error:critical:${errorId}`;
    await this.env.KV.put(key, JSON.stringify(error), { expirationTtl: 3600 });
  }

  private async updateRealTimeAggregations(
    metrics: PerformanceMetric[],
  ): Promise<void> {
    // Update real-time aggregations in KV for dashboard
    const realtimeKey = "performance:realtime:current";
    const current = (await this.env.KV.get(realtimeKey, "json")) || {
      metrics: {},
      lastUpdated: new Date().toISOString(),
    };

    // Aggregate new metrics
    for (const metric of metrics) {
      if (!current.metrics[metric.metric_name]) {
        current.metrics[metric.metric_name] = { sum: 0, count: 0, avg: 0 };
      }

      const existing = current.metrics[metric.metric_name];
      existing.sum += metric.metric_value;
      existing.count += 1;
      existing.avg = existing.sum / existing.count;
    }

    current.lastUpdated = new Date().toISOString();

    await this.env.KV.put(realtimeKey, JSON.stringify(current), {
      expirationTtl: 60,
    });
  }

  private async checkPerformanceBudgets(vitals: WebVitalsData): Promise<void> {
    // Define performance budgets
    const budgets = {
      lcp: 2500, // milliseconds
      fid: 100, // milliseconds
      cls: 0.1, // score
      ttfb: 800, // milliseconds
    };

    const violations: string[] = [];

    if (vitals.lcp && vitals.lcp > budgets.lcp) violations.push("LCP");
    if (vitals.fid && vitals.fid > budgets.fid) violations.push("FID");
    if (vitals.cls && vitals.cls > budgets.cls) violations.push("CLS");
    if (vitals.ttfb && vitals.ttfb > budgets.ttfb) violations.push("TTFB");

    if (violations.length > 0) {
      // Cache budget violations for alerting
      const violationKey = `budget_violation:${vitals.session_id}:${Date.now()}`;
      await this.env.KV.put(
        violationKey,
        JSON.stringify({
          session_id: vitals.session_id,
          user_id: vitals.user_id,
          violations,
          vitals,
          timestamp: new Date().toISOString(),
        }),
        { expirationTtl: 3600 },
      );
    }
  }

  // External service integrations
  private async sendToSentry(error: ErrorEvent): Promise<void> {
    if (!this.env.SENTRY_DSN) return;

    try {
      // Send to Sentry (simplified)
      await fetch(`https://sentry.io/api/0/store/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${this.env.SENTRY_DSN}`,
        },
        body: JSON.stringify({
          message: error.error_message,
          level: error.severity,
          platform: "javascript",
          exception: {
            values: [
              {
                type: error.error_category,
                value: error.error_message,
                stacktrace: error.error_stack,
              },
            ],
          },
          user: { id: error.user_id },
          contexts: {
            device: error.device_info,
          },
        }),
      });
    } catch (e) {
      console.error("Failed to send to Sentry:", e);
    }
  }

  private async forwardToPostHog(event: AnalyticsEvent): Promise<void> {
    if (!this.env.POSTHOG_API_KEY) return;

    try {
      await fetch("https://app.posthog.com/capture/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.env.POSTHOG_API_KEY,
          event: event.event_name,
          distinct_id: event.user_id || event.session_id,
          properties: {
            ...event.properties,
            $current_url: event.page_path,
            $device_type: event.device_type,
            timestamp: event.timestamp,
          },
        }),
      });
    } catch (e) {
      console.error("Failed to forward to PostHog:", e);
    }
  }

  private async logCriticalError(error: any, request: Request): Promise<void> {
    try {
      const errorData: ErrorEvent = {
        session_id: "system",
        error_message: error.message || "Unknown error",
        error_stack: error.stack,
        error_category: "system_error",
        severity: "critical",
        page_path: new URL(request.url).pathname,
        user_agent: request.headers.get("User-Agent") || "unknown",
        app_version: "2.0.0",
        fingerprint: this.generateErrorFingerprint({
          session_id: "system",
          error_message: error.message || "Unknown error",
          error_category: "system_error",
          severity: "critical",
          fingerprint: "",
        }),
      };

      const errorId = `system_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.env.DB.prepare(
        `
        INSERT INTO error_logs 
        (id, session_id, error_message, error_stack, error_category, 
         severity, page_path, user_agent, app_version, fingerprint,
         occurrence_count, first_seen, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          errorId,
          errorData.session_id,
          errorData.error_message,
          errorData.error_stack,
          errorData.error_category,
          errorData.severity,
          errorData.page_path,
          errorData.user_agent,
          errorData.app_version,
          errorData.fingerprint,
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        )
        .run();
    } catch (logError) {
      console.error("Failed to log critical error:", logError);
    }
  }
}

// Worker request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const api = new PerformanceMonitoringAPI(env);
    return await api.handleRequest(request);
  },
};

// Available Performance Monitoring API Endpoints:
//
// Data Collection:
// POST /api/performance/metrics - Collect general performance metrics
// POST /api/performance/web-vitals - Collect Web Vitals data
// POST /api/performance/errors - Log application errors
// POST /api/performance/analytics - Track analytics events
//
// Data Retrieval:
// GET  /api/performance/dashboard - Get performance dashboard data
// GET  /api/performance/user-metrics - Get user-specific metrics
// GET  /api/performance/system-health - Get overall system health
// GET  /api/performance/real-time - Get real-time performance data
//
// Advanced Analytics:
// GET  /api/performance/trends - Get performance trends over time
// GET  /api/performance/anomalies - Detect performance anomalies
// GET  /api/performance/recommendations - Get optimization recommendations
//
// Health Check:
// GET  /api/performance/health - API health check
