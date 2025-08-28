#!/usr/bin/env node
/**
 * Custom metrics collector for Relife Smart Alarm
 * Collects business and application metrics for Prometheus monitoring
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  // Prometheus pushgateway endpoint
  pushgateway: process.env.PUSHGATEWAY_URL || 'http://localhost:9091',

  // Supabase configuration
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Analytics endpoints
  analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT,

  // Collection intervals (in seconds)
  intervals: {
    business: 60, // Business metrics every minute
    performance: 30, // Performance metrics every 30 seconds
    mobile: 120, // Mobile metrics every 2 minutes
    security: 30, // Security metrics every 30 seconds
  },

  // Metric collection enabled flags
  enabled: {
    business: process.env.COLLECT_BUSINESS_METRICS !== 'false',
    performance: process.env.COLLECT_PERFORMANCE_METRICS !== 'false',
    mobile: process.env.COLLECT_MOBILE_METRICS !== 'false',
    security: process.env.COLLECT_SECURITY_METRICS !== 'false',
  },
};

// Metrics storage
const metrics = {
  business: new Map(),
  performance: new Map(),
  mobile: new Map(),
  security: new Map(),
};

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = level.toUpperCase().padEnd(5);
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const error = message => log(message, 'error');
const warn = message => log(message, 'warn');
const info = message => log(message, 'info');

// HTTP request helper
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.request(url, options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: res.headers['content-type']?.includes('application/json')
              ? JSON.parse(data)
              : data,
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

// Business metrics collection
const collectBusinessMetrics = async () => {
  try {
    info('Collecting business metrics...');

    // Simulate business metrics (replace with actual database queries)
    const businessData = {
      daily_active_users: Math.floor(Math.random() * 10000 + 5000),
      alarm_success_rate: 0.95 + Math.random() * 0.04,
      premium_conversion_rate: 0.08 + Math.random() * 0.02,
      subscription_churn_rate: 0.05 + Math.random() * 0.03,
      session_duration_minutes: 12 + Math.random() * 8,
      alarm_creation_rate: Math.floor(Math.random() * 500 + 200),
      user_retention_7d: 0.65 + Math.random() * 0.15,
      revenue_daily_usd: Math.floor(Math.random() * 5000 + 2000),
      support_ticket_volume: Math.floor(Math.random() * 50 + 10),
      net_promoter_score: 45 + Math.random() * 20,
    };

    // Store metrics
    for (const [key, value] of Object.entries(businessData)) {
      metrics.business.set(`relife_business_${key}`, {
        value,
        timestamp: Date.now(),
        labels: { type: 'business', source: 'collector' },
      });
    }

    info(`Collected ${Object.keys(businessData).length} business metrics`);
  } catch (err) {
    error(`Business metrics collection failed: ${err.message}`);
  }
};

// Performance metrics collection
const collectPerformanceMetrics = async () => {
  try {
    info('Collecting performance metrics...');

    // Simulate performance metrics (replace with actual monitoring data)
    const performanceData = {
      web_vitals_lcp_ms: 1500 + Math.random() * 1000,
      web_vitals_fid_ms: 50 + Math.random() * 100,
      web_vitals_cls_score: Math.random() * 0.2,
      response_time_ms: 200 + Math.random() * 300,
      error_rate: Math.random() * 0.02,
      cpu_usage_percent: 30 + Math.random() * 40,
      memory_usage_percent: 50 + Math.random() * 30,
      disk_usage_percent: 60 + Math.random() * 20,
      network_latency_ms: 50 + Math.random() * 100,
    };

    // Store metrics
    for (const [key, value] of Object.entries(performanceData)) {
      metrics.performance.set(`relife_performance_${key}`, {
        value,
        timestamp: Date.now(),
        labels: { type: 'performance', source: 'collector' },
      });
    }

    info(`Collected ${Object.keys(performanceData).length} performance metrics`);
  } catch (err) {
    error(`Performance metrics collection failed: ${err.message}`);
  }
};

// Mobile metrics collection
const collectMobileMetrics = async () => {
  try {
    info('Collecting mobile metrics...');

    // Simulate mobile metrics (replace with actual mobile analytics)
    const mobileData = {
      mobile_crash_rate: Math.random() * 0.005,
      mobile_anr_rate: Math.random() * 0.002,
      mobile_app_launch_time_ms: 800 + Math.random() * 1200,
      mobile_memory_usage_mb: 100 + Math.random() * 150,
      mobile_cpu_usage_percent: 15 + Math.random() * 25,
      mobile_battery_drain_rate: 2 + Math.random() * 3,
      mobile_network_error_rate: Math.random() * 0.03,
      mobile_frame_drops_per_second: Math.random() * 1,
      app_store_rating: 4.2 + Math.random() * 0.6,
      mobile_session_duration_minutes: 8 + Math.random() * 10,
    };

    // Add platform-specific metrics
    ['ios', 'android'].forEach(platform => {
      Object.entries(mobileData).forEach(([key, baseValue]) => {
        const variation = 0.8 + Math.random() * 0.4; // ±20% variation
        metrics.mobile.set(`relife_mobile_${key}_${platform}`, {
          value: baseValue * variation,
          timestamp: Date.now(),
          labels: { type: 'mobile', platform, source: 'collector' },
        });
      });
    });

    info(
      `Collected ${Object.keys(mobileData).length * 2} mobile metrics (iOS + Android)`
    );
  } catch (err) {
    error(`Mobile metrics collection failed: ${err.message}`);
  }
};

// Security metrics collection
const collectSecurityMetrics = async () => {
  try {
    info('Collecting security metrics...');

    // Simulate security metrics (replace with actual security monitoring)
    const securityData = {
      auth_failed_attempts_rate: Math.random() * 2,
      api_rate_limit_violations: Math.floor(Math.random() * 10),
      suspicious_login_patterns: Math.floor(Math.random() * 5),
      brute_force_attempts: Math.floor(Math.random() * 3),
      unauthorized_api_attempts: Math.floor(Math.random() * 8),
      ddos_request_rate: Math.random() * 100,
      security_scan_attempts: Math.floor(Math.random() * 15),
      data_export_unusual: Math.floor(Math.random() * 2),
      privilege_escalation_attempts: Math.floor(Math.random() * 1),
      payment_fraud_attempts: Math.floor(Math.random() * 3),
    };

    // Store metrics
    for (const [key, value] of Object.entries(securityData)) {
      metrics.security.set(`relife_security_${key}`, {
        value,
        timestamp: Date.now(),
        labels: { type: 'security', source: 'collector' },
      });
    }

    info(`Collected ${Object.keys(securityData).length} security metrics`);
  } catch (err) {
    error(`Security metrics collection failed: ${err.message}`);
  }
};

// Push metrics to Prometheus pushgateway
const pushMetrics = async category => {
  try {
    const categoryMetrics = metrics[category];
    if (categoryMetrics.size === 0) {
      warn(`No ${category} metrics to push`);
      return;
    }

    // Format metrics for Prometheus
    let prometheusFormat = '';
    for (const [metricName, metricData] of categoryMetrics) {
      const labels = Object.entries(metricData.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      prometheusFormat += `${metricName}{${labels}} ${metricData.value} ${metricData.timestamp}\n`;
    }

    // Push to pushgateway
    const pushUrl = `${CONFIG.pushgateway}/metrics/job/relife-${category}/instance/collector`;
    const response = await makeRequest(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(prometheusFormat),
      },
      body: prometheusFormat,
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      info(`Pushed ${categoryMetrics.size} ${category} metrics to Prometheus`);
    } else {
      error(`Failed to push ${category} metrics: HTTP ${response.statusCode}`);
    }

    // Clear metrics after pushing
    categoryMetrics.clear();
  } catch (err) {
    error(`Failed to push ${category} metrics: ${err.message}`);
  }
};

// Health check endpoint for the collector itself
const startHealthCheckServer = () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          metrics_collected: {
            business: metrics.business.size,
            performance: metrics.performance.size,
            mobile: metrics.mobile.size,
            security: metrics.security.size,
          },
        })
      );
    } else if (req.url === '/metrics') {
      // Export internal collector metrics
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`
# HELP relife_collector_uptime_seconds Time since collector started
# TYPE relife_collector_uptime_seconds counter
relife_collector_uptime_seconds ${process.uptime()}

# HELP relife_collector_metrics_collected_total Total metrics collected by category
# TYPE relife_collector_metrics_collected_total counter
relife_collector_metrics_collected_total{category="business"} ${metrics.business.size}
relife_collector_metrics_collected_total{category="performance"} ${metrics.performance.size}
relife_collector_metrics_collected_total{category="mobile"} ${metrics.mobile.size}
relife_collector_metrics_collected_total{category="security"} ${metrics.security.size}
            `);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const port = process.env.COLLECTOR_PORT || 8080;
  server.listen(port, () => {
    info(`Metrics collector health check server started on port ${port}`);
    info(`Health check: http://localhost:${port}/health`);
    info(`Metrics endpoint: http://localhost:${port}/metrics`);
  });
};

// Graceful shutdown handler
const setupShutdownHandler = () => {
  const shutdown = async signal => {
    info(`Received ${signal}, shutting down gracefully...`);

    // Push any remaining metrics
    for (const category of Object.keys(metrics)) {
      if (metrics[category].size > 0) {
        await pushMetrics(category);
      }
    }

    info('Metrics collector stopped');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Main execution
const main = async () => {
  info('Starting Relife metrics collector...');

  // Validate configuration
  if (!CONFIG.pushgateway) {
    error('PUSHGATEWAY_URL not configured');
    process.exit(1);
  }

  // Setup shutdown handler
  setupShutdownHandler();

  // Start health check server
  startHealthCheckServer();

  // Start metric collection intervals
  if (CONFIG.enabled.business) {
    setInterval(() => {
      collectBusinessMetrics().then(() => pushMetrics('business'));
    }, CONFIG.intervals.business * 1000);
    info(`Business metrics collection started (every ${CONFIG.intervals.business}s)`);
  }

  if (CONFIG.enabled.performance) {
    setInterval(() => {
      collectPerformanceMetrics().then(() => pushMetrics('performance'));
    }, CONFIG.intervals.performance * 1000);
    info(
      `Performance metrics collection started (every ${CONFIG.intervals.performance}s)`
    );
  }

  if (CONFIG.enabled.mobile) {
    setInterval(() => {
      collectMobileMetrics().then(() => pushMetrics('mobile'));
    }, CONFIG.intervals.mobile * 1000);
    info(`Mobile metrics collection started (every ${CONFIG.intervals.mobile}s)`);
  }

  if (CONFIG.enabled.security) {
    setInterval(() => {
      collectSecurityMetrics().then(() => pushMetrics('security'));
    }, CONFIG.intervals.security * 1000);
    info(`Security metrics collection started (every ${CONFIG.intervals.security}s)`);
  }

  // Initial collection
  info('Running initial metric collection...');
  if (CONFIG.enabled.business) await collectBusinessMetrics();
  if (CONFIG.enabled.performance) await collectPerformanceMetrics();
  if (CONFIG.enabled.mobile) await collectMobileMetrics();
  if (CONFIG.enabled.security) await collectSecurityMetrics();

  info('Relife metrics collector is now running...');
  info('Press Ctrl+C to stop');
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled rejection at ${promise}: ${reason}`);
});

process.on('uncaughtException', err => {
  error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});

// Start the collector
if (require.main === module) {
  main().catch(err => {
    error(`Failed to start metrics collector: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  collectBusinessMetrics,
  collectPerformanceMetrics,
  collectMobileMetrics,
  collectSecurityMetrics,
  pushMetrics,
  CONFIG,
};
