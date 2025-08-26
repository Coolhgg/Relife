/**
 * AI Deployment Alerting System
 * Comprehensive monitoring and alerting for the deployment process
 * Supports email, Slack, webhook, and in-app notifications
 */

interface AlertConfig {
  enabled: boolean;
  channels: {
    email: {
      enabled: boolean;
      recipients: string[];
      smtpConfig?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
    webhook: {
      enabled: boolean;
      urls: string[];
    };
    inApp: {
      enabled: boolean;
    };
  };
  thresholds: {
    phaseFailure: boolean;
    serviceDown: boolean;
    highErrorRate: number;
    slowResponse: number;
    lowUptime: number;
  };
}

interface AlertMessage {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  data?: any;
  resolved: boolean;
}

export class AIDeploymentAlerting {
  private static instance: AIDeploymentAlerting;
  private config: AlertConfig;
  private activeAlerts: Map<string, AlertMessage> = new Map();
  private alertHistory: AlertMessage[] = [];

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): AIDeploymentAlerting {
    if (!AIDeploymentAlerting.instance) {
      AIDeploymentAlerting.instance = new AIDeploymentAlerting();
    }
    return AIDeploymentAlerting.instance;
  }

  private getDefaultConfig(): AlertConfig {
    return {
      enabled: true,
      channels: {
        email: {
          enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
          recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '')
            .split(',')
            .filter(Boolean),
          smtpConfig: process.env.SMTP_HOST
            ? {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                  user: process.env.SMTP_USER || '',
                  pass: process.env.SMTP_PASS || '',
                },
              }
            : undefined,
        },
        slack: {
          enabled: !!process.env.SLACK_WEBHOOK_URL,
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: process.env.SLACK_CHANNEL || '#ai-deployment',
        },
        webhook: {
          enabled: !!process.env.ALERT_WEBHOOK_URLS,
          urls: (process.env.ALERT_WEBHOOK_URLS || '').split(',').filter(Boolean),
        },
        inApp: {
          enabled: true,
        },
      },
      thresholds: {
        phaseFailure: true,
        serviceDown: true,
        highErrorRate: 5.0,
        slowResponse: 1000,
        lowUptime: 95.0,
      },
    };
  }

  /**
   * Send an alert through all configured channels
   */
  async sendAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    source: string,
    data?: any
  ): Promise<void> {
    if (!this.config.enabled) {
      console.log('[Alerting] Alerts disabled, skipping alert:', title);
      return;
    }

    const alert: AlertMessage = {
      id: this.generateAlertId(),
      severity,
      title,
      message,
      timestamp: new Date(),
      source,
      data,
      resolved: false,
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    console.log(`[Alerting] Sending ${severity} alert: ${title}`);

    // Send to all enabled channels
    const promises: Promise<void>[] = [];

    if (this.config.channels.email.enabled) {
      promises.push(this.sendEmailAlert(alert));
    }

    if (this.config.channels.slack.enabled) {
      promises.push(this.sendSlackAlert(alert));
    }

    if (this.config.channels.webhook.enabled) {
      promises.push(this.sendWebhookAlert(alert));
    }

    if (this.config.channels.inApp.enabled) {
      promises.push(this.sendInAppAlert(alert));
    }

    try {
      await Promise.allSettled(promises);
      console.log(`[Alerting] Alert ${alert.id} sent successfully`);
    } catch (error) {
      console.error(`[Alerting] Failed to send alert ${alert.id}:`, error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: AlertMessage): Promise<void> {
    if (!this.config.channels.email.smtpConfig) {
      console.warn('[Alerting] Email SMTP not configured, skipping email alert');
      return;
    }

    const subject = `[AI Deployment] ${alert.severity.toUpperCase()}: ${alert.title}`;
    const body = this.generateEmailBody(alert);

    try {
      // Mock email sending - in production, use nodemailer or similar
      console.log(
        `[Alerting] Email sent to ${this.config.channels.email.recipients.join(', ')}`
      );
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('[Alerting] Failed to send email alert:', error);
      throw error;
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: AlertMessage): Promise<void> {
    const payload = {
      channel: this.config.channels.slack.channel,
      username: 'AI Deployment Bot',
      icon_emoji: this.getSeverityEmoji(alert.severity),
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Source',
              value: alert.source,
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
          footer: 'AI Deployment System',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    try {
      // Mock Slack webhook - in production, use actual HTTP request
      console.log(
        `[Alerting] Slack alert sent to ${this.config.channels.slack.channel}`
      );
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Simulate Slack webhook
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('[Alerting] Failed to send Slack alert:', error);
      throw error;
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: AlertMessage): Promise<void> {
    const payload = {
      alert_id: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      source: alert.source,
      data: alert.data,
    };

    const promises = this.config.channels.webhook.urls.map(async url => {
      try {
        // Mock webhook - in production, use actual HTTP request
        console.log(`[Alerting] Webhook alert sent to ${url}`);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        // Simulate webhook
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[Alerting] Failed to send webhook alert to ${url}:`, error);
        throw error;
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Send in-app alert (store for dashboard consumption)
   */
  private async sendInAppAlert(alert: AlertMessage): Promise<void> {
    // In production, this would push to a real-time system like WebSocket or Server-Sent Events
    console.log(`[Alerting] In-app alert: ${alert.title}`);

    // Store for dashboard to pick up
    global.aiDeploymentAlerts = global.aiDeploymentAlerts || [];
    global.aiDeploymentAlerts.push(alert);

    // Keep only last 50 alerts
    if (global.aiDeploymentAlerts.length > 50) {
      global.aiDeploymentAlerts = global.aiDeploymentAlerts.slice(-50);
    }
  }

  /**
   * Check deployment status and trigger alerts if needed
   */
  async checkAndAlert(deploymentStatus: any): Promise<void> {
    const { phases, serviceHealth, metrics, overallProgress } = deploymentStatus;

    // Check for phase failures
    const failedPhases = phases.filter((p: any) => p.status === 'failed');
    for (const phase of failedPhases) {
      const alertId = `phase_failure_${phase.phase}`;
      if (!this.activeAlerts.has(alertId)) {
        await this.sendAlert(
          'critical',
          `Phase ${phase.phase} Deployment Failed`,
          `Phase ${phase.phase} (${this.getPhaseNameById(phase.phase)}) has failed. ${phase.errors?.join('. ') || ''}`,
          'deployment_orchestrator',
          { phase: phase.phase, errors: phase.errors }
        );
      }
    }

    // Check service health
    const unhealthyServices = serviceHealth.filter(
      (s: any) => s.status === 'unhealthy'
    );
    for (const service of unhealthyServices) {
      const alertId = `service_down_${service.serviceName}`;
      if (!this.activeAlerts.has(alertId)) {
        await this.sendAlert(
          'high',
          `Service Down: ${service.serviceName}`,
          `Service ${service.serviceName} is unhealthy with ${service.errorRate}% error rate and ${service.uptime}% uptime.`,
          'service_monitor',
          {
            service: service.serviceName,
            errorRate: service.errorRate,
            uptime: service.uptime,
          }
        );
      }
    }

    // Check for degraded services
    const degradedServices = serviceHealth.filter(
      (s: any) =>
        s.status === 'degraded' ||
        s.errorRate > this.config.thresholds.highErrorRate ||
        s.responseTime > this.config.thresholds.slowResponse ||
        s.uptime < this.config.thresholds.lowUptime
    );

    for (const service of degradedServices) {
      const alertId = `service_degraded_${service.serviceName}`;
      if (!this.activeAlerts.has(alertId)) {
        await this.sendAlert(
          'medium',
          `Service Degraded: ${service.serviceName}`,
          `Service ${service.serviceName} is experiencing performance issues. Response time: ${service.responseTime}ms, Error rate: ${service.errorRate}%, Uptime: ${service.uptime}%`,
          'service_monitor',
          {
            service: service.serviceName,
            responseTime: service.responseTime,
            errorRate: service.errorRate,
          }
        );
      }
    }

    // Check overall deployment progress
    if (overallProgress < 50 && phases.some((p: any) => p.status === 'failed')) {
      const alertId = 'deployment_stalled';
      if (!this.activeAlerts.has(alertId)) {
        await this.sendAlert(
          'high',
          'AI Deployment Stalled',
          `Deployment progress is stalled at ${Math.round(overallProgress)}% with failed phases detected.`,
          'deployment_orchestrator',
          { overallProgress, failedPhases: failedPhases.length }
        );
      }
    }
  }

  /**
   * Resolve an active alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.activeAlerts.delete(alertId);

      console.log(
        `[Alerting] Alert ${alertId} resolved: ${resolution || 'No resolution provided'}`
      );

      // Send resolution notification
      await this.sendAlert(
        'low',
        `Alert Resolved: ${alert.title}`,
        `The alert "${alert.title}" has been resolved. ${resolution || ''}`,
        'alert_system',
        { originalAlert: alert, resolution }
      );
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertMessage[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100): AlertMessage[] {
    return this.alertHistory.slice(-limit);
  }

  // Helper methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPhaseNameById(phase: number): string {
    const names: Record<number, string> = {
      1: 'Core Services',
      2: 'Cross-Platform Integration',
      3: 'Recommendation Engine',
      4: 'Dashboard & UI',
      5: 'Optimization & Scaling',
    };
    return names[phase] || `Phase ${phase}`;
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      low: ':information_source:',
      medium: ':warning:',
      high: ':exclamation:',
      critical: ':rotating_light:',
    };
    return emojis[severity] || ':question:';
  }

  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: '#36a64f',
      medium: '#ff9900',
      high: '#ff6600',
      critical: '#ff0000',
    };
    return colors[severity] || '#cccccc';
  }

  private generateEmailBody(alert: AlertMessage): string {
    return `
AI Deployment Alert

Severity: ${alert.severity.toUpperCase()}
Title: ${alert.title}
Time: ${alert.timestamp.toISOString()}
Source: ${alert.source}

Message:
${alert.message}

${alert.data ? `Additional Data:\n${JSON.stringify(alert.data, null, 2)}` : ''}

---
AI Deployment System
`;
  }
}

export default AIDeploymentAlerting;
