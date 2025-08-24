/**
 * Enhanced Performance Monitoring with Real-Time Alerts
 * Provides intelligent alerting, performance degradation detection, and automated optimization
 */

import React from 'react';
import { TimeoutHandle } from '../types/timers';

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  category: 'webvitals' | 'memory' | 'network' | 'error' | 'custom';
  severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
  resolved?: boolean;
  autoResolve?: boolean;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  enabled: boolean;
  category: PerformanceAlert['category'];
  severity: PerformanceAlert['severity'];
  cooldownPeriod: number; // Minutes before same alert can fire again
  autoResolve: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'notification' | 'console' | 'storage' | 'callback' | 'optimization';
  config: Record<string, any>;
}

export interface PerformanceTrend {
  metric: string;
  values: number[];
  timestamps: number[];
  trend: 'improving' | 'degrading' | 'stable';
  changePercent: number;
}

export interface OptimizationSuggestion {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedGain: string;
}

class PerformanceAlertManager {
  private alerts: Map<string, PerformanceAlert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertCooldowns: Map<string, TimeoutHandle> = new Map();
  private metricHistory: Map<string, Array<{ value: number; timestamp: number }>> =
    new Map();
  private observers: Array<(alert: PerformanceAlert) => void> = [];
  private isMonitoring = false;
  private monitoringInterval?: number;

  constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
    this.setupNotificationPermission();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'lcp_threshold',
        name: 'Largest Contentful Paint',
        metric: 'LCP',
        condition: 'gt',
        threshold: 2500,
        enabled: true,
        category: 'webvitals',
        severity: 3,
        cooldownPeriod: 5,
        autoResolve: true,
        actions: [
          {
            type: 'notification',
            config: { title: 'LCP Performance Issue', persistent: false },
          },
          { type: 'console', config: { level: 'warn' } },
        ],
      },
      {
        id: 'fid_threshold',
        name: 'First Input Delay',
        metric: 'FID',
        condition: 'gt',
        threshold: 100,
        enabled: true,
        category: 'webvitals',
        severity: 3,
        cooldownPeriod: 3,
        autoResolve: true,
        actions: [
          { type: 'notification', config: { title: 'Input Responsiveness Issue' } },
          { type: 'console', config: { level: 'warn' } },
        ],
      },
      {
        id: 'cls_threshold',
        name: 'Cumulative Layout Shift',
        metric: 'CLS',
        condition: 'gt',
        threshold: 0.1,
        enabled: true,
        category: 'webvitals',
        severity: 2,
        cooldownPeriod: 5,
        autoResolve: false,
        actions: [
          { type: 'notification', config: { title: 'Layout Stability Issue' } },
        ],
      },
      {
        id: 'memory_usage',
        name: 'Memory Usage',
        metric: 'memory_used',
        condition: 'gt',
        threshold: 50 * 1024 * 1024, // 50MB
        enabled: true,
        category: 'memory',
        severity: 4,
        cooldownPeriod: 10,
        autoResolve: true,
        actions: [
          { type: 'notification', config: { title: 'High Memory Usage' } },
          { type: 'optimization', config: { type: 'memory_cleanup' } },
        ],
      },
      {
        id: 'network_error_rate',
        name: 'Network Error Rate',
        metric: 'network_error_rate',
        condition: 'gt',
        threshold: 0.1, // 10% error rate
        enabled: true,
        category: 'network',
        severity: 4,
        cooldownPeriod: 5,
        autoResolve: false,
        actions: [
          { type: 'notification', config: { title: 'Network Issues Detected' } },
        ],
      },
      {
        id: 'js_error_frequency',
        name: 'JavaScript Error Frequency',
        metric: 'js_error',
        condition: 'gt',
        threshold: 5, // More than 5 errors in monitoring period
        enabled: true,
        category: 'error',
        severity: 5,
        cooldownPeriod: 2,
        autoResolve: false,
        actions: [
          { type: 'notification', config: { title: 'Critical Error Frequency' } },
          { type: 'storage', config: { key: 'critical_errors' } },
        ],
      },
    ];

    defaultRules.forEach(rule => this.alertRules.set(rule.id, rule));
  }

  /**
   * Setup notification permission
   */
  private async setupNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn(
          '[PerformanceAlerts] Could not request notification permission:',
          error
        );
      }
    }
  }

  /**
   * Start monitoring performance metrics
   */
  private startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.checkAllMetrics();
      this.analyzePerformanceTrends();
      this.cleanupResolvedAlerts();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Record performance metric and check for alerts
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    // Store metric history
    if (!this.metricHistory.has(name)) {
      this.metricHistory.set(name, []);
    }

    const history = this.metricHistory.get(name)!;
    history.push({ value, timestamp: Date.now() });

    // Keep only last 100 data points
    if (history.length > 100) {
      history.shift();
    }

    // Check alert rules for this metric
    this.checkMetricAlerts(name, value, metadata);
  }

  /**
   * Check metric against alert rules
   */
  private checkMetricAlerts(
    metric: string,
    value: number,
    metadata?: Record<string, any>
  ) {
    this.alertRules.forEach(rule => {
      if (rule.metric !== metric || !rule.enabled) return;

      // Check cooldown period
      const lastAlertTime = this.alertCooldowns.get(rule.id);
      if (
        lastAlertTime &&
        Date.now() - lastAlertTime < rule.cooldownPeriod * 60 * 1000
      ) {
        return;
      }

      // Evaluate condition
      const shouldAlert = this.evaluateCondition(value, rule.condition, rule.threshold);

      if (shouldAlert) {
        this.createAlert(rule, value, metadata);
      }
    });
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    value: number,
    condition: AlertRule['condition'],
    threshold: number
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Create and process alert
   */
  private createAlert(rule: AlertRule, value: number, metadata?: Record<string, any>) {
    const alertId = `${rule.id}-${Date.now()}`;

    const alert: PerformanceAlert = {
      id: alertId,
      type: this.getAlertType(rule.severity),
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      message: this.generateAlertMessage(rule, value),
      timestamp: Date.now(),
      category: rule.category,
      severity: rule.severity,
      resolved: false,
      autoResolve: rule.autoResolve,
      metadata,
    };

    this.alerts.set(alertId, alert);
    this.alertCooldowns.set(rule.id, Date.now());

    // Execute alert actions
    this.executeAlertActions(rule, alert);

    // Notify observers
    this.notifyObservers(alert);

    console.warn(`[PerformanceAlert] ${alert.message}`, { alert, metadata });
  }

  /**
   * Get alert type from severity
   */
  private getAlertType(severity: number): PerformanceAlert['type'] {
    switch (severity) {
      case 1:
        return 'info';
      case 2:
        return 'info';
      case 3:
        return 'warning';
      case 4:
        return 'error';
      case 5:
        return 'critical';
      default:
        return 'warning';
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, value: number): string {
    const formatted = this.formatValue(rule.metric, value);
    const thresholdFormatted = this.formatValue(rule.metric, rule.threshold);

    return `${rule.name} exceeded threshold: ${formatted} > ${thresholdFormatted}`;
  }

  /**
   * Format value based on metric type
   */
  private formatValue(metric: string, value: number): string {
    if (
      metric.includes('time') ||
      metric.includes('delay') ||
      metric === 'LCP' ||
      metric === 'FID'
    ) {
      return `${Math.round(value)}ms`;
    }

    if (metric.includes('memory')) {
      return `${Math.round(value / 1024 / 1024)}MB`;
    }

    if (metric.includes('rate') || metric === 'CLS') {
      return (value * 100).toFixed(1) + '%';
    }

    return value.toString();
  }

  /**
   * Execute alert actions
   */
  private executeAlertActions(rule: AlertRule, alert: PerformanceAlert) {
    rule.actions.forEach(action => {
      try {
        switch (action.type) {
          case 'notification':
            this.showNotification(alert, action.config);
            break;
          case 'console':
            this.logToConsole(alert, action.config);
            break;
          case 'storage':
            this.storeAlert(alert, action.config);
            break;
          case 'optimization':
            this.triggerOptimization(alert, action.config);
            break;
        }
      } catch (error) {
        console.error(`[PerformanceAlert] Action ${action.type} failed:`, error);
      }
    });
  }

  /**
   * Show browser notification
   */
  private showNotification(alert: PerformanceAlert, config: Record<string, any>) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(config.title || 'Performance Alert', {
        body: alert.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: `perf-alert-${alert.category}`,
        requireInteraction: config.persistent || alert.severity >= 4,
        data: { alertId: alert.id },
      });

      // Auto-close after 10 seconds unless persistent
      if (!config.persistent && alert.severity < 4) {
        setTimeout(() => notification.close(), 10000);
      }

      notification.onclick = () => {
        window.focus();
        this.resolveAlert(alert.id);
        notification.close();
      };
    }
  }

  /**
   * Log alert to console
   */
  private logToConsole(alert: PerformanceAlert, config: Record<string, any>) {
    const level = config.level || 'warn';
    const method = console[level as keyof Console] as Function;

    if (typeof method === 'function') {
      method(`[PerformanceAlert] ${alert.message}`, alert);
    }
  }

  /**
   * Store alert for persistence
   */
  private storeAlert(alert: PerformanceAlert, config: Record<string, any>) {
    try {
      const key = config.key || 'performance-alerts';
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      stored.push(alert);

      // Keep only last 50 alerts
      const recent = stored.slice(-50);
      localStorage.setItem(key, JSON.stringify(recent));
    } catch (error) {
      console.error('[PerformanceAlert] Failed to store alert:', error);
    }
  }

  /**
   * Trigger optimization based on alert
   */
  private triggerOptimization(alert: PerformanceAlert, config: Record<string, any>) {
    switch (config.type) {
      case 'memory_cleanup':
        this.triggerMemoryCleanup();
        break;
      case 'cache_clear':
        this.clearPerformanceCache();
        break;
      case 'gc_force':
        this.forceGarbageCollection();
        break;
    }
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup() {
    // Trigger memory pressure event
    window.dispatchEvent(
      new CustomEvent('memory-pressure', {
        detail: { source: 'performance-alert', timestamp: Date.now() },
      })
    );
  }

  /**
   * Clear performance caches
   */
  private clearPerformanceCache() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('perf') || cacheName.includes('temp')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }

  /**
   * Force garbage collection
   */
  private forceGarbageCollection() {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Check all metrics against thresholds
   */
  private checkAllMetrics() {
    // Get current performance data
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize);
    }

    // Check network error rate
    const networkErrors = this.getRecentMetricCount('network_error', 5 * 60 * 1000); // 5 minutes
    const networkRequests = this.getRecentMetricCount('network_request', 5 * 60 * 1000);
    if (networkRequests > 0) {
      this.recordMetric('network_error_rate', networkErrors / networkRequests);
    }

    // Check JavaScript error frequency
    const jsErrors = this.getRecentMetricCount('js_error', 5 * 60 * 1000);
    this.recordMetric('js_error_frequency', jsErrors);
  }

  /**
   * Get recent metric count
   */
  private getRecentMetricCount(metric: string, timeWindow: number): number {
    const history = this.metricHistory.get(metric);
    if (!history) return 0;

    const cutoff = Date.now() - timeWindow;
    return history.filter(entry => entry.timestamp > cutoff).length;
  }

  /**
   * Analyze performance trends
   */
  private analyzePerformanceTrends() {
    this.metricHistory.forEach((history, metric) => {
      const trend = this.calculateTrend(history);

      if (trend.trend === 'degrading' && Math.abs(trend.changePercent) > 20) {
        this.createTrendAlert(metric, trend);
      }
    });
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(
    history: Array<{ value: number; timestamp: number }>
  ): PerformanceTrend {
    if (history.length < 10) {
      return {
        metric: '',
        values: [],
        timestamps: [],
        trend: 'stable',
        changePercent: 0,
      };
    }

    const values = history.map(h => h.value);
    const timestamps = history.map(h => h.timestamp);

    // Simple linear regression to detect trend
    const n = values.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate percent change
    const first =
      values.slice(0, Math.floor(n / 3)).reduce((a, b) => a + b) / Math.floor(n / 3);
    const last =
      values.slice(-Math.floor(n / 3)).reduce((a, b) => a + b) / Math.floor(n / 3);
    const changePercent = ((last - first) / first) * 100;

    let trend: PerformanceTrend['trend'];
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'degrading';
    } else {
      trend = 'improving';
    }

    return {
      metric: '',
      values,
      timestamps,
      trend,
      changePercent,
    };
  }

  /**
   * Create trend alert
   */
  private createTrendAlert(metric: string, trend: PerformanceTrend) {
    const alert: PerformanceAlert = {
      id: `trend-${metric}-${Date.now()}`,
      type: 'warning',
      metric,
      value: trend.changePercent,
      threshold: 20,
      message: `Performance degrading: ${metric} has degraded by ${Math.abs(trend.changePercent).toFixed(1)}%`,
      timestamp: Date.now(),
      category: 'custom',
      severity: 3,
      resolved: false,
      autoResolve: true,
      metadata: { trend },
    };

    this.alerts.set(alert.id, alert);
    this.notifyObservers(alert);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.notifyObservers(alert);
    }
  }

  /**
   * Clean up resolved alerts
   */
  private cleanupResolvedAlerts() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.timestamp < cutoff) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const activeAlerts = this.getActiveAlerts();

    activeAlerts.forEach(alert => {
      switch (alert.category) {
        case 'webvitals':
          suggestions.push(...this.getWebVitalsOptimizations(alert));
          break;
        case 'memory':
          suggestions.push(...this.getMemoryOptimizations(alert));
          break;
        case 'network':
          suggestions.push(...this.getNetworkOptimizations(alert));
          break;
        case 'error':
          suggestions.push(...this.getErrorOptimizations(alert));
          break;
      }
    });

    // Remove duplicates and sort by priority
    const unique = suggestions.filter(
      (suggestion, index, arr) => arr.findIndex(s => s.id === suggestion.id) === index
    );

    return unique.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get Web Vitals optimizations
   */
  private getWebVitalsOptimizations(alert: PerformanceAlert): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    if (alert.metric === 'LCP') {
      suggestions.push({
        id: 'optimize-lcp',
        category: 'Web Vitals',
        priority: 'high',
        title: 'Optimize Largest Contentful Paint',
        description:
          'Your largest contentful paint is too slow, affecting user experience',
        impact: 'Improves perceived loading performance',
        implementation:
          'Optimize images, use CDN, implement preloading for critical resources',
        estimatedGain: '30-50% improvement in LCP',
      });
    }

    if (alert.metric === 'FID') {
      suggestions.push({
        id: 'reduce-fid',
        category: 'Web Vitals',
        priority: 'high',
        title: 'Reduce First Input Delay',
        description: 'Users are experiencing delays when interacting with your app',
        impact: 'Improves interactivity and user satisfaction',
        implementation:
          'Use web workers, defer non-critical JavaScript, optimize event handlers',
        estimatedGain: '60-80% improvement in responsiveness',
      });
    }

    return suggestions;
  }

  /**
   * Get memory optimizations
   */
  private getMemoryOptimizations(alert: PerformanceAlert): OptimizationSuggestion[] {
    return [
      {
        id: 'memory-cleanup',
        category: 'Memory',
        priority: 'medium',
        title: 'Implement Memory Cleanup',
        description: 'High memory usage detected, potential memory leaks',
        impact: 'Prevents crashes and improves stability',
        implementation:
          'Review event listeners, clear caches, implement proper cleanup',
        estimatedGain: '20-40% reduction in memory usage',
      },
    ];
  }

  /**
   * Get network optimizations
   */
  private getNetworkOptimizations(alert: PerformanceAlert): OptimizationSuggestion[] {
    return [
      {
        id: 'network-optimization',
        category: 'Network',
        priority: 'medium',
        title: 'Optimize Network Requests',
        description: 'High network error rate affecting user experience',
        impact: 'Improves reliability and reduces errors',
        implementation: 'Implement retry logic, request batching, and caching',
        estimatedGain: '50-70% reduction in network errors',
      },
    ];
  }

  /**
   * Get error optimizations
   */
  private getErrorOptimizations(alert: PerformanceAlert): OptimizationSuggestion[] {
    return [
      {
        id: 'error-handling',
        category: 'Error Handling',
        priority: 'critical',
        title: 'Improve Error Handling',
        description: 'High frequency of JavaScript errors detected',
        impact: 'Prevents crashes and improves user experience',
        implementation: 'Add error boundaries, improve validation, fix critical bugs',
        estimatedGain: '80-90% reduction in error frequency',
      },
    ];
  }

  /**
   * Add alert observer
   */
  addObserver(observer: (alert: PerformanceAlert) => void) {
    this.observers.push(observer);
  }

  /**
   * Remove alert observer
   */
  removeObserver(observer: (alert: PerformanceAlert) => void) {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify observers
   */
  private notifyObservers(alert: PerformanceAlert) {
    this.observers.forEach(observer => observer(alert));
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopMonitoring();
    this.alerts.clear();
    this.alertCooldowns.clear();
    this.metricHistory.clear();
    this.observers.length = 0;
  }
}

// Create singleton instance
export const performanceAlertManager = new PerformanceAlertManager();

/**
 * React hook for performance alerts
 */
export function usePerformanceAlerts() {
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = React.useState<OptimizationSuggestion[]>([]);

  React.useEffect(() => {
    const updateAlerts = (alert: PerformanceAlert) => {
      setAlerts(performanceAlertManager.getActiveAlerts());
      setSuggestions(performanceAlertManager.getOptimizationSuggestions());
    };

    performanceAlertManager.addObserver(updateAlerts);
    setAlerts(performanceAlertManager.getActiveAlerts());
    setSuggestions(performanceAlertManager.getOptimizationSuggestions());

    return () => {
      performanceAlertManager.removeObserver(updateAlerts);
    };
  }, []);

  const recordMetric = React.useCallback(
    (name: string, value: number, metadata?: Record<string, any>) => {
      performanceAlertManager.recordMetric(name, value, metadata);
    },
    []
  );

  const resolveAlert = React.useCallback((alertId: string) => {
    performanceAlertManager.resolveAlert(alertId);
  }, []);

  return {
    alerts,
    suggestions,
    recordMetric,
    resolveAlert,
  };
}

/**
 * Performance Alert Display Component
 */
export interface PerformanceAlertDisplayProps {
  maxAlerts?: number;
  showSuggestions?: boolean;
  className?: string;
}

export const PerformanceAlertDisplay: React.FC<PerformanceAlertDisplayProps> = ({
  maxAlerts = 5,
  showSuggestions = true,
  className = '',
}) => {
  const { alerts, suggestions, resolveAlert } = usePerformanceAlerts();

  const displayAlerts = alerts.slice(0, maxAlerts);
  const criticalAlerts = alerts.filter((alert: any) => a.lert.severity >= 4);

  if (displayAlerts.length === 0 && (!showSuggestions || suggestions.length === 0)) {
    return null;
  }

  return (
    <div className={`performance-alerts ${className}`}>
      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <div className="critical-alert-banner bg-red-600 text-white p-2 rounded mb-4">
          <strong>⚠️ Critical Performance Issues ({criticalAlerts.length})</strong>
          <p className="text-sm">Immediate attention required</p>
        </div>
      )}

      {/* Active alerts */}
      {displayAlerts.length > 0 && (
        <div className="active-alerts mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Performance Alerts</h4>
          <div className="space-y-2">
            {displayAlerts.map((alert: any) => ({ // auto: implicit any
              <div
                key={alert.id}
                className={`alert-item p-3 rounded border-l-4 ${
                  alert.type === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : alert.type === 'error'
                      ? 'bg-orange-50 border-orange-500'
                      : alert.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.category} •{' '}
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="optimization-suggestions">
          <h4 className="font-semibold text-gray-800 mb-2">Optimization Suggestions</h4>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion: any) => ({ // auto: implicit any
              <div
                key={suggestion.id}
                className={`suggestion-item p-3 rounded border ${
                  suggestion.priority === 'critical'
                    ? 'border-red-300 bg-red-50'
                    : suggestion.priority === 'high'
                      ? 'border-orange-300 bg-orange-50'
                      : suggestion.priority === 'medium'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{suggestion.title}</h5>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      suggestion.priority === 'critical'
                        ? 'bg-red-200 text-red-800'
                        : suggestion.priority === 'high'
                          ? 'bg-orange-200 text-orange-800'
                          : suggestion.priority === 'medium'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                <p className="text-xs text-green-600 font-medium">
                  {suggestion.estimatedGain}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default performanceAlertManager;
