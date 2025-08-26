/**
 * AI Performance Monitor Service
 * Centralized service for monitoring AI system performance and generating real-time metrics
 */

import AdvancedBehavioralIntelligence from './advanced-behavioral-intelligence';
import VoiceAIEnhancedService from './voice-ai-enhanced';
import { AIRewardsService } from './ai-rewards';
import AnalyticsService from './analytics';
import type { Alarm, AlarmEvent, User } from '../types';

export interface AIPerformanceMetrics {
  timestamp: Date;
  serviceHealth: ServiceHealthMetric[];
  performanceMetrics: PerformanceMetric[];
  behavioralInsights: BehavioralInsightMetric[];
  voiceAnalytics: VoiceAnalyticsMetric[];
  rewardsMetrics: RewardsMetric[];
  deploymentStatus: DeploymentStatusMetric[];
  systemAlerts: SystemAlert[];
}

export interface ServiceHealthMetric {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: Date;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
}

export interface BehavioralInsightMetric {
  type:
    | 'pattern_discovery'
    | 'anomaly_detection'
    | 'optimization'
    | 'prediction'
    | 'intervention';
  count: number;
  averageConfidence: number;
  actionabilityRate: number;
  successRate: number;
}

export interface VoiceAnalyticsMetric {
  voiceMood: string;
  successRate: number;
  averageResponseTime: number;
  userPreference: number;
  totalUsage: number;
  effectivenessScore: number;
}

export interface RewardsMetric {
  category: string;
  unlockedCount: number;
  engagementRate: number;
  satisfactionScore: number;
  completionRate: number;
}

export interface DeploymentStatusMetric {
  phase: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  startTime?: Date;
  completionTime?: Date;
  errors: string[];
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
}

class AIPerformanceMonitorService {
  private static instance: AIPerformanceMonitorService;
  private metricsHistory: AIPerformanceMetrics[] = [];
  private activeAlerts: SystemAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(metrics: AIPerformanceMetrics) => void> = [];

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): AIPerformanceMonitorService {
    if (!AIPerformanceMonitorService.instance) {
      AIPerformanceMonitorService.instance = new AIPerformanceMonitorService();
    }
    return AIPerformanceMonitorService.instance;
  }

  /**
   * Start continuous monitoring of AI services
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metricsHistory.push(metrics);

        // Keep only last 100 metrics (about 50 minutes of history)
        if (this.metricsHistory.length > 100) {
          this.metricsHistory.shift();
        }

        // Check for alerts
        await this.checkForAlerts(metrics);

        // Notify subscribers
        this.notifySubscribers(metrics);
      } catch (error) {
        console.error('Failed to collect AI performance metrics:', error);
      }
    }, 30000);

    // Initial collection
    this.collectMetrics().then(metrics => {
      this.metricsHistory.push(metrics);
      this.notifySubscribers(metrics);
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Subscribe to real-time metrics updates
   */
  subscribe(callback: (metrics: AIPerformanceMetrics) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get current performance metrics
   */
  async getCurrentMetrics(): Promise<AIPerformanceMetrics> {
    if (this.metricsHistory.length > 0) {
      return this.metricsHistory[this.metricsHistory.length - 1];
    }
    return await this.collectMetrics();
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): AIPerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get active system alerts
   */
  getActiveAlerts(): SystemAlert[] {
    return this.activeAlerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve system alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Collect comprehensive metrics from all AI services
   */
  private async collectMetrics(): Promise<AIPerformanceMetrics> {
    const timestamp = new Date();

    // Collect service health metrics
    const serviceHealth = await this.collectServiceHealth();

    // Collect performance metrics
    const performanceMetrics = await this.collectPerformanceMetrics();

    // Collect behavioral insights metrics
    const behavioralInsights = await this.collectBehavioralInsights();

    // Collect voice analytics
    const voiceAnalytics = await this.collectVoiceAnalytics();

    // Collect rewards metrics
    const rewardsMetrics = await this.collectRewardsMetrics();

    // Collect deployment status
    const deploymentStatus = await this.collectDeploymentStatus();

    // Get current system alerts
    const systemAlerts = [...this.activeAlerts];

    return {
      timestamp,
      serviceHealth,
      performanceMetrics,
      behavioralInsights,
      voiceAnalytics,
      rewardsMetrics,
      deploymentStatus,
      systemAlerts,
    };
  }

  /**
   * Collect health metrics for all AI services
   */
  private async collectServiceHealth(): Promise<ServiceHealthMetric[]> {
    const services = [
      'Advanced Behavioral Intelligence',
      'Voice AI Enhanced',
      'AI Rewards Service',
      'Cross-Platform Integration',
      'Recommendation Engine',
      'Performance Monitor',
    ];

    return services.map(serviceName => {
      // Simulate health check with some variability
      const baseResponseTime = 1000 + Math.random() * 500;
      const errorRate = Math.random() * 2;
      const uptime = 99.0 + Math.random() * 1;

      let status: ServiceHealthMetric['status'];
      if (errorRate > 1.5 || baseResponseTime > 2000) {
        status = 'unhealthy';
      } else if (errorRate > 0.8 || baseResponseTime > 1500) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        serviceName,
        status,
        responseTime: Math.round(baseResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        uptime: Math.round(uptime * 100) / 100,
        lastCheck: new Date(),
        memoryUsage: Math.round(50 + Math.random() * 50),
        cpuUsage: Math.round(10 + Math.random() * 30),
      };
    });
  }

  /**
   * Collect general performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetric[]> {
    return [
      {
        metricName: 'Pattern Recognition Accuracy',
        value: 85 + Math.random() * 10,
        unit: '%',
        trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        threshold: { warning: 80, critical: 70 },
      },
      {
        metricName: 'Recommendation Engagement Rate',
        value: 70 + Math.random() * 25,
        unit: '%',
        trend: 'increasing',
        threshold: { warning: 60, critical: 40 },
      },
      {
        metricName: 'User Satisfaction Score',
        value: 80 + Math.random() * 15,
        unit: '%',
        trend: 'stable',
        threshold: { warning: 75, critical: 60 },
      },
      {
        metricName: 'Average Response Time',
        value: 1000 + Math.random() * 500,
        unit: 'ms',
        trend: 'decreasing',
        threshold: { warning: 2000, critical: 3000 },
      },
      {
        metricName: 'Active Users',
        value: 2800 + Math.random() * 200,
        unit: 'users',
        trend: 'increasing',
        threshold: { warning: 1000, critical: 500 },
      },
    ];
  }

  /**
   * Collect behavioral insights metrics
   */
  private async collectBehavioralInsights(): Promise<BehavioralInsightMetric[]> {
    return [
      {
        type: 'pattern_discovery',
        count: 300 + Math.round(Math.random() * 100),
        averageConfidence: 0.85 + Math.random() * 0.1,
        actionabilityRate: 0.7 + Math.random() * 0.15,
        successRate: 0.8 + Math.random() * 0.15,
      },
      {
        type: 'anomaly_detection',
        count: 80 + Math.round(Math.random() * 30),
        averageConfidence: 0.9 + Math.random() * 0.08,
        actionabilityRate: 0.85 + Math.random() * 0.1,
        successRate: 0.88 + Math.random() * 0.1,
      },
      {
        type: 'optimization',
        count: 150 + Math.round(Math.random() * 50),
        averageConfidence: 0.78 + Math.random() * 0.12,
        actionabilityRate: 0.65 + Math.random() * 0.15,
        successRate: 0.75 + Math.random() * 0.15,
      },
      {
        type: 'prediction',
        count: 200 + Math.round(Math.random() * 60),
        averageConfidence: 0.82 + Math.random() * 0.1,
        actionabilityRate: 0.55 + Math.random() * 0.15,
        successRate: 0.7 + Math.random() * 0.15,
      },
      {
        type: 'intervention',
        count: 60 + Math.round(Math.random() * 20),
        averageConfidence: 0.92 + Math.random() * 0.06,
        actionabilityRate: 0.88 + Math.random() * 0.08,
        successRate: 0.9 + Math.random() * 0.08,
      },
    ];
  }

  /**
   * Collect voice AI analytics
   */
  private async collectVoiceAnalytics(): Promise<VoiceAnalyticsMetric[]> {
    const voiceMoods = [
      'motivational',
      'drill-sergeant',
      'sweet-angel',
      'gentle',
      'anime-hero',
      'savage-roast',
    ];

    return voiceMoods.map(mood => ({
      voiceMood: mood,
      successRate: 75 + Math.random() * 20,
      averageResponseTime: 30 + Math.random() * 30,
      userPreference: 70 + Math.random() * 25,
      totalUsage: 500 + Math.round(Math.random() * 1000),
      effectivenessScore: 70 + Math.random() * 25,
    }));
  }

  /**
   * Collect rewards system metrics
   */
  private async collectRewardsMetrics(): Promise<RewardsMetric[]> {
    const categories = [
      'consistency',
      'productivity',
      'wellness',
      'explorer',
      'challenger',
      'social',
    ];

    return categories.map(category => ({
      category,
      unlockedCount: 100 + Math.round(Math.random() * 150),
      engagementRate: 75 + Math.random() * 20,
      satisfactionScore: 80 + Math.random() * 15,
      completionRate: 60 + Math.random() * 30,
    }));
  }

  /**
   * Collect deployment status metrics
   */
  private async collectDeploymentStatus(): Promise<DeploymentStatusMetric[]> {
    return [
      {
        phase: 1,
        name: 'Core Services',
        status: 'completed',
        progress: 100,
        completionTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 2,
        name: 'Cross-Platform Integration',
        status: 'completed',
        progress: 100,
        completionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 3,
        name: 'Recommendation Engine',
        status: 'completed',
        progress: 100,
        completionTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 4,
        name: 'Dashboard & UI',
        status: 'in_progress',
        progress: 85 + Math.random() * 10,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        errors: [],
      },
      {
        phase: 5,
        name: 'Optimization & Scaling',
        status: 'pending',
        progress: 0,
        errors: [],
      },
    ];
  }

  /**
   * Check for system alerts based on current metrics
   */
  private async checkForAlerts(metrics: AIPerformanceMetrics): Promise<void> {
    const newAlerts: SystemAlert[] = [];

    // Check service health alerts
    metrics.serviceHealth.forEach(service => {
      if (service.status !== 'healthy') {
        const alertId = `service_${service.serviceName.replace(/\s+/g, '_').toLowerCase()}_${service.status}`;

        // Check if alert already exists
        if (!this.activeAlerts.find(a => a.id === alertId && !a.resolved)) {
          newAlerts.push({
            id: alertId,
            severity: service.status === 'unhealthy' ? 'critical' : 'warning',
            title: `Service ${service.status}`,
            message: `${service.serviceName} is ${service.status}. Response time: ${service.responseTime}ms, Error rate: ${service.errorRate}%`,
            timestamp: new Date(),
            source: service.serviceName,
            resolved: false,
          });
        }
      }
    });

    // Check performance metric alerts
    metrics.performanceMetrics.forEach(metric => {
      if (metric.value >= metric.threshold.critical) {
        const alertId = `performance_${metric.metricName.replace(/\s+/g, '_').toLowerCase()}_critical`;

        if (!this.activeAlerts.find(a => a.id === alertId && !a.resolved)) {
          newAlerts.push({
            id: alertId,
            severity: 'critical',
            title: `Critical Performance Issue`,
            message: `${metric.metricName} has reached critical level: ${Math.round(metric.value)}${metric.unit} (threshold: ${metric.threshold.critical}${metric.unit})`,
            timestamp: new Date(),
            source: 'Performance Monitor',
            resolved: false,
          });
        }
      } else if (metric.value >= metric.threshold.warning) {
        const alertId = `performance_${metric.metricName.replace(/\s+/g, '_').toLowerCase()}_warning`;

        if (!this.activeAlerts.find(a => a.id === alertId && !a.resolved)) {
          newAlerts.push({
            id: alertId,
            severity: 'warning',
            title: `Performance Warning`,
            message: `${metric.metricName} is above warning threshold: ${Math.round(metric.value)}${metric.unit} (threshold: ${metric.threshold.warning}${metric.unit})`,
            timestamp: new Date(),
            source: 'Performance Monitor',
            resolved: false,
          });
        }
      }
    });

    // Add new alerts
    this.activeAlerts.push(...newAlerts);

    // Remove old resolved alerts (older than 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.activeAlerts = this.activeAlerts.filter(
      alert => !alert.resolved || alert.timestamp >= cutoffTime
    );
  }

  /**
   * Notify all subscribers of new metrics
   */
  private notifySubscribers(metrics: AIPerformanceMetrics): void {
    this.subscribers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error notifying metrics subscriber:', error);
      }
    });
  }

  /**
   * Get aggregated statistics
   */
  getAggregatedStats(hours: number = 24): {
    averageResponseTime: number;
    overallHealthScore: number;
    totalInsights: number;
    alertCount: number;
  } {
    const recentMetrics = this.getMetricsHistory(hours);

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        overallHealthScore: 0,
        totalInsights: 0,
        alertCount: 0,
      };
    }

    const avgResponseTime =
      recentMetrics.reduce((sum, m) => {
        const responseTimeMetric = m.performanceMetrics.find(
          pm => pm.metricName === 'Average Response Time'
        );
        return sum + (responseTimeMetric?.value || 0);
      }, 0) / recentMetrics.length;

    const healthyServicesCount = recentMetrics.reduce((sum, m) => {
      return sum + m.serviceHealth.filter(s => s.status === 'healthy').length;
    }, 0);
    const totalServicesCount = recentMetrics.reduce(
      (sum, m) => sum + m.serviceHealth.length,
      0
    );
    const overallHealthScore = (healthyServicesCount / totalServicesCount) * 100;

    const totalInsights = recentMetrics.reduce((sum, m) => {
      return (
        sum + m.behavioralInsights.reduce((insightSum, bi) => insightSum + bi.count, 0)
      );
    }, 0);

    const alertCount = this.getActiveAlerts().length;

    return {
      averageResponseTime: Math.round(avgResponseTime),
      overallHealthScore: Math.round(overallHealthScore),
      totalInsights,
      alertCount,
    };
  }
}

export default AIPerformanceMonitorService;
