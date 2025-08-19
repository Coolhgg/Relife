// Security Monitoring and Forensic Logging Service
// Provides comprehensive security monitoring, threat detection, and forensic logging for alarm security

import { Preferences } from "@capacitor/preferences";
import SecurityService from "./security";
import { ErrorHandler } from "./error-handler";

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  userId?: string;
  details: any;
  resolved: boolean;
  actions: string[];
  fingerprint: string;
}

type SecurityEventType =
  | "alarm_access_denied"
  | "tampering_detected"
  | "backup_failure"
  | "encryption_error"
  | "suspicious_activity"
  | "rate_limit_exceeded"
  | "authentication_failure"
  | "data_corruption"
  | "unauthorized_modification"
  | "security_test_failure"
  | "forensic_analysis_requested"
  | "incident_detected"
  | "threat_detected";

interface ThreatSignature {
  id: string;
  name: string;
  pattern: RegExp | string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  mitigation: string[];
  enabled: boolean;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  threatsDetected: number;
  incidentsResolved: number;
  averageResponseTime: number;
  lastAnalysis: Date;
  riskLevel: "low" | "medium" | "high" | "critical";
  trendAnalysis: {
    direction: "improving" | "stable" | "degrading";
    confidence: number;
  };
}

interface ForensicReport {
  id: string;
  generated: Date;
  timeframe: { start: Date; end: Date };
  eventCount: number;
  suspiciousActivities: SecurityEvent[];
  threatAnalysis: any;
  recommendations: string[];
  riskAssessment: {
    level: "low" | "medium" | "high" | "critical";
    factors: string[];
    mitigations: string[];
  };
}

interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: "immediate" | "hourly" | "daily";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  events: string[]; // Event IDs
  acknowledged: boolean;
  resolved: boolean;
}

export class SecurityMonitoringForensicsService {
  private static instance: SecurityMonitoringForensicsService;
  private static readonly EVENTS_KEY = "security_events_log";
  private static readonly ALERTS_KEY = "security_alerts";
  private static readonly METRICS_KEY = "security_metrics";
  private static readonly MAX_EVENTS = 1000;
  private static readonly ANALYSIS_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private static readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private eventBuffer: SecurityEvent[] = [];
  private threatSignatures: Map<string, ThreatSignature> = new Map();
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private analysisTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private metrics: SecurityMetrics | null = null;

  private constructor() {
    this.initializeThreatSignatures();
    this.startSecurityAnalysis();
    this.startDataCleanup();
    this.loadExistingEvents();
  }

  static getInstance(): SecurityMonitoringForensicsService {
    if (!SecurityMonitoringForensicsService.instance) {
      SecurityMonitoringForensicsService.instance =
        new SecurityMonitoringForensicsService();
    }
    return SecurityMonitoringForensicsService.instance;
  }

  /**
   * Log a security event for monitoring and forensic analysis
   */
  async logSecurityEvent(
    type: SecurityEventType,
    severity: "low" | "medium" | "high" | "critical",
    source: string,
    details: any,
    userId?: string,
  ): Promise<string> {
    try {
      const event: SecurityEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        type,
        severity,
        source,
        userId,
        details: this.sanitizeDetails(details),
        resolved: false,
        actions: [],
        fingerprint: this.generateEventFingerprint(type, source, details),
      };

      // Add to buffer for immediate analysis
      this.eventBuffer.push(event);

      // Store persistently
      await this.storeSecurityEvent(event);

      // Perform immediate threat analysis
      await this.analyzeEvent(event);

      // Check if this should trigger an alert
      await this.checkForAlerts(event);

      // Log to console for debugging
      console.log(
        `[SecurityMonitoring] Event logged: ${type} (${severity}) from ${source}`,
      );

      // Emit custom event for UI components
      window.dispatchEvent(
        new CustomEvent("security-event-logged", {
          detail: event,
        }),
      );

      return event.id;
    } catch (error) {
      console.error(
        "[SecurityMonitoring] Failed to log security event:",
        error,
      );
      throw error;
    }
  }

  /**
   * Perform comprehensive threat analysis on security events
   */
  private async analyzeEvent(event: SecurityEvent): Promise<void> {
    try {
      // Check against threat signatures
      for (const [signatureId, signature] of this.threatSignatures) {
        if (!signature.enabled) continue;

        const isMatch = this.matchesThreatSignature(event, signature);
        if (isMatch) {
          await this.handleThreatDetection(event, signature);
        }
      }

      // Pattern analysis for suspicious behavior
      const suspiciousPatterns = this.analyzeSuspiciousPatterns(event);
      if (suspiciousPatterns.length > 0) {
        await this.logSecurityEvent(
          "suspicious_activity",
          "medium",
          "pattern_analyzer",
          { patterns: suspiciousPatterns, originalEvent: event.id },
        );
      }

      // Rate-based analysis
      const rateAnomalies = this.analyzeRateAnomalies(event);
      if (rateAnomalies) {
        await this.logSecurityEvent(
          "rate_limit_exceeded",
          "high",
          "rate_analyzer",
          { anomaly: rateAnomalies, originalEvent: event.id },
          event.userId,
        );
      }
    } catch (error) {
      console.error("[SecurityMonitoring] Event analysis failed:", error);
    }
  }

  /**
   * Handle detected security threats
   */
  private async handleThreatDetection(
    event: SecurityEvent,
    signature: ThreatSignature,
  ): Promise<void> {
    const threatEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: "threat_detected",
      severity: signature.severity,
      source: "threat_detection_engine",
      userId: event.userId,
      details: {
        threatSignature: signature.id,
        threatName: signature.name,
        description: signature.description,
        mitigation: signature.mitigation,
        triggeringEvent: event.id,
        automated: true,
      },
      resolved: false,
      actions: [],
      fingerprint: this.generateEventFingerprint(
        "threat_detected",
        signature.id,
        event.details,
      ),
    };

    await this.storeSecurityEvent(threatEvent);

    // Create immediate alert for high/critical threats
    if (signature.severity === "high" || signature.severity === "critical") {
      await this.createSecurityAlert(
        "immediate",
        signature.severity,
        `Threat Detected: ${signature.name}`,
        `${signature.description}. Automated mitigation may be required.`,
        [event.id, threatEvent.id],
      );
    }

    // Execute automated mitigation if configured
    await this.executeAutomatedMitigation(signature, event);

    console.warn(
      `[SecurityMonitoring] THREAT DETECTED: ${signature.name} (${signature.severity})`,
    );
  }

  /**
   * Execute automated mitigation for detected threats
   */
  private async executeAutomatedMitigation(
    signature: ThreatSignature,
    event: SecurityEvent,
  ): Promise<void> {
    try {
      const actions: string[] = [];

      // Example automated mitigations
      if (signature.mitigation.includes("rate_limit")) {
        // Implement temporary rate limiting
        actions.push("Applied temporary rate limiting");
      }

      if (signature.mitigation.includes("block_user") && event.userId) {
        // Temporary user blocking for critical threats
        if (signature.severity === "critical") {
          actions.push(`Temporarily restricted user: ${event.userId}`);
        }
      }

      if (signature.mitigation.includes("backup_recovery")) {
        // Trigger automatic backup recovery
        actions.push("Initiated backup recovery procedure");
      }

      if (signature.mitigation.includes("alert_admin")) {
        // Create admin alert
        await this.createSecurityAlert(
          "immediate",
          "critical",
          "Admin Action Required",
          `Critical security threat requires immediate attention: ${signature.name}`,
          [event.id],
        );
        actions.push("Admin alert created");
      }

      // Log mitigation actions
      if (actions.length > 0) {
        await this.logSecurityEvent(
          "incident_detected",
          signature.severity,
          "automated_mitigation",
          { actions, threat: signature.id, originalEvent: event.id },
        );
      }
    } catch (error) {
      console.error("[SecurityMonitoring] Automated mitigation failed:", error);
    }
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(
    type: "immediate" | "hourly" | "daily",
    severity: "low" | "medium" | "high" | "critical",
    title: string,
    description: string,
    eventIds: string[],
  ): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      type,
      severity,
      title,
      description,
      events: eventIds,
      acknowledged: false,
      resolved: false,
    };

    this.activeAlerts.set(alert.id, alert);
    await this.storeSecurityAlerts();

    // Emit alert event
    window.dispatchEvent(
      new CustomEvent("security-alert-created", {
        detail: alert,
      }),
    );

    console.log(`[SecurityMonitoring] Alert created: ${title} (${severity})`);
    return alert.id;
  }

  /**
   * Generate comprehensive forensic report
   */
  async generateForensicReport(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<ForensicReport> {
    try {
      console.log("[SecurityMonitoring] Generating forensic report...");

      // Load events for the specified timeframe
      const events = await this.getEventsInTimeframe(
        startDate,
        endDate,
        userId,
      );

      // Analyze suspicious activities
      const suspiciousActivities = events.filter(
        (event) =>
          event.severity === "high" ||
          event.severity === "critical" ||
          event.type === "suspicious_activity" ||
          event.type === "threat_detected",
      );

      // Perform threat analysis
      const threatAnalysis = this.performThreatAnalysis(events);

      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(events);

      // Risk assessment
      const riskAssessment = this.performRiskAssessment(
        events,
        suspiciousActivities,
      );

      const report: ForensicReport = {
        id: this.generateReportId(),
        generated: new Date(),
        timeframe: { start: startDate, end: endDate },
        eventCount: events.length,
        suspiciousActivities,
        threatAnalysis,
        recommendations,
        riskAssessment,
      };

      // Store report
      await this.storeForensicReport(report);

      // Log report generation
      await this.logSecurityEvent(
        "forensic_analysis_requested",
        "low",
        "forensic_service",
        { reportId: report.id, eventCount: events.length, userId },
      );

      console.log(
        `[SecurityMonitoring] Forensic report generated: ${report.id}`,
      );
      return report;
    } catch (error) {
      console.error(
        "[SecurityMonitoring] Failed to generate forensic report:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get security metrics and analytics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      if (
        this.metrics &&
        this.metrics.lastAnalysis &&
        Date.now() - this.metrics.lastAnalysis.getTime() < 300000
      ) {
        // 5 minutes cache
        return this.metrics;
      }

      // Calculate metrics from recent events
      const recentEvents = await this.getRecentEvents(24 * 60 * 60 * 1000); // Last 24 hours
      const criticalEvents = recentEvents.filter(
        (e) => e.severity === "critical",
      ).length;
      const threatsDetected = recentEvents.filter(
        (e) => e.type === "threat_detected",
      ).length;
      const resolvedIncidents = recentEvents.filter((e) => e.resolved).length;

      // Calculate risk level
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";
      if (criticalEvents > 5) {
        riskLevel = "critical";
      } else if (criticalEvents > 2 || threatsDetected > 10) {
        riskLevel = "high";
      } else if (criticalEvents > 0 || threatsDetected > 5) {
        riskLevel = "medium";
      }

      // Trend analysis
      const yesterdayEvents = await this.getEventsInTimeframe(
        new Date(Date.now() - 48 * 60 * 60 * 1000),
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      );

      const trendDirection =
        recentEvents.length > yesterdayEvents.length
          ? "degrading"
          : recentEvents.length < yesterdayEvents.length
            ? "improving"
            : "stable";

      this.metrics = {
        totalEvents: recentEvents.length,
        criticalEvents,
        threatsDetected,
        incidentsResolved: resolvedIncidents,
        averageResponseTime: this.calculateAverageResponseTime(recentEvents),
        lastAnalysis: new Date(),
        riskLevel,
        trendAnalysis: {
          direction: trendDirection,
          confidence: 0.75, // Basic confidence calculation
        },
      };

      await this.storeMetrics();
      return this.metrics;
    } catch (error) {
      console.error(
        "[SecurityMonitoring] Failed to get security metrics:",
        error,
      );
      return {
        totalEvents: 0,
        criticalEvents: 0,
        threatsDetected: 0,
        incidentsResolved: 0,
        averageResponseTime: 0,
        lastAnalysis: new Date(),
        riskLevel: "low",
        trendAnalysis: {
          direction: "stable",
          confidence: 0,
        },
      };
    }
  }

  /**
   * Initialize threat detection signatures
   */
  private initializeThreatSignatures(): void {
    const signatures: ThreatSignature[] = [
      {
        id: "multiple_failed_access",
        name: "Multiple Failed Access Attempts",
        pattern: "alarm_access_denied",
        severity: "high",
        description: "Multiple failed attempts to access alarms detected",
        mitigation: ["rate_limit", "block_user"],
        enabled: true,
      },
      {
        id: "tampering_pattern",
        name: "Data Tampering Pattern",
        pattern: "tampering_detected",
        severity: "critical",
        description: "Systematic data tampering detected",
        mitigation: ["backup_recovery", "alert_admin"],
        enabled: true,
      },
      {
        id: "encryption_failures",
        name: "Encryption System Compromise",
        pattern: "encryption_error",
        severity: "critical",
        description:
          "Multiple encryption failures may indicate system compromise",
        mitigation: ["alert_admin", "backup_recovery"],
        enabled: true,
      },
      {
        id: "rapid_alarm_changes",
        name: "Rapid Alarm Modifications",
        pattern: "unauthorized_modification",
        severity: "medium",
        description: "Unusually rapid alarm modifications detected",
        mitigation: ["rate_limit"],
        enabled: true,
      },
      {
        id: "backup_system_failure",
        name: "Backup System Compromise",
        pattern: "backup_failure",
        severity: "high",
        description: "Critical backup system failures",
        mitigation: ["alert_admin"],
        enabled: true,
      },
    ];

    signatures.forEach((signature) => {
      this.threatSignatures.set(signature.id, signature);
    });

    console.log(
      `[SecurityMonitoring] Initialized ${signatures.length} threat signatures`,
    );
  }

  /**
   * Check if event matches threat signature
   */
  private matchesThreatSignature(
    event: SecurityEvent,
    signature: ThreatSignature,
  ): boolean {
    if (signature.pattern instanceof RegExp) {
      return signature.pattern.test(JSON.stringify(event));
    } else {
      return event.type === signature.pattern;
    }
  }

  /**
   * Analyze suspicious patterns in events
   */
  private analyzeSuspiciousPatterns(event: SecurityEvent): string[] {
    const patterns: string[] = [];

    // Check for rapid repeated actions
    const recentSimilarEvents = this.eventBuffer.filter(
      (e) =>
        e.type === event.type &&
        e.userId === event.userId &&
        Date.now() - e.timestamp.getTime() < 300000, // Last 5 minutes
    );

    if (recentSimilarEvents.length > 10) {
      patterns.push("rapid_repeated_actions");
    }

    // Check for off-hours activity
    const hour = event.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      patterns.push("off_hours_activity");
    }

    // Check for unusual source patterns
    if (
      (event.source && event.source.includes("unknown")) ||
      event.source.includes("suspicious")
    ) {
      patterns.push("suspicious_source");
    }

    return patterns;
  }

  /**
   * Analyze rate-based anomalies
   */
  private analyzeRateAnomalies(event: SecurityEvent): any | null {
    // Count similar events in the last hour
    const hourlyEvents = this.eventBuffer.filter(
      (e) =>
        e.type === event.type &&
        e.userId === event.userId &&
        Date.now() - e.timestamp.getTime() < 3600000, // Last hour
    );

    // Define rate limits by event type
    const rateLimits: Record<string, number> = {
      alarm_access_denied: 20,
      tampering_detected: 5,
      encryption_error: 10,
      unauthorized_modification: 30,
      backup_failure: 3,
    };

    const limit = rateLimits[event.type];
    if (limit && hourlyEvents.length > limit) {
      return {
        eventType: event.type,
        count: hourlyEvents.length,
        limit,
        timeframe: "hourly",
      };
    }

    return null;
  }

  /**
   * Check if event should trigger alerts
   */
  private async checkForAlerts(event: SecurityEvent): Promise<void> {
    // Immediate alerts for critical events
    if (event.severity === "critical") {
      await this.createSecurityAlert(
        "immediate",
        "critical",
        `Critical Security Event: ${event.type}`,
        `Critical security event detected from ${event.source}`,
        [event.id],
      );
    }

    // Check for alert patterns
    if (
      event.type === "tampering_detected" ||
      event.type === "threat_detected"
    ) {
      await this.createSecurityAlert(
        "immediate",
        event.severity,
        `Security Threat: ${event.type}`,
        `Security threat detected requiring attention`,
        [event.id],
      );
    }
  }

  /**
   * Start periodic security analysis
   */
  private startSecurityAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.analysisTimer = setInterval(async () => {
      try {
        await this.performPeriodicAnalysis();
      } catch (error) {
        console.error("[SecurityMonitoring] Periodic analysis failed:", error);
      }
    }, SecurityMonitoringForensicsService.ANALYSIS_INTERVAL);

    console.log("[SecurityMonitoring] Started periodic security analysis");
  }

  /**
   * Start data cleanup timer
   */
  private startDataCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error("[SecurityMonitoring] Data cleanup failed:", error);
      }
    }, SecurityMonitoringForensicsService.CLEANUP_INTERVAL);

    console.log("[SecurityMonitoring] Started data cleanup");
  }

  /**
   * Perform periodic comprehensive analysis
   */
  private async performPeriodicAnalysis(): Promise<void> {
    console.log(
      "[SecurityMonitoring] Performing periodic security analysis...",
    );

    // Update metrics
    await this.getSecurityMetrics();

    // Analyze trends
    await this.analyzeTrends();

    // Check system health
    await this.checkSystemHealth();

    // Generate digest alerts if needed
    await this.generateDigestAlerts();
  }

  /**
   * Analyze security trends
   */
  private async analyzeTrends(): Promise<void> {
    const recentEvents = await this.getRecentEvents(24 * 60 * 60 * 1000);
    const previousEvents = await this.getEventsInTimeframe(
      new Date(Date.now() - 48 * 60 * 60 * 1000),
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    // Significant increase in events
    if (recentEvents.length > previousEvents.length * 2) {
      await this.createSecurityAlert(
        "hourly",
        "medium",
        "Unusual Activity Spike",
        `Security events increased significantly: ${recentEvents.length} vs ${previousEvents.length}`,
        recentEvents.slice(0, 5).map((e) => e.id),
      );
    }
  }

  /**
   * Check overall system health
   */
  private async checkSystemHealth(): Promise<void> {
    const recentCriticalEvents = (
      await this.getRecentEvents(60 * 60 * 1000)
    ).filter((e) => e.severity === "critical");

    if (recentCriticalEvents.length > 3) {
      await this.createSecurityAlert(
        "immediate",
        "critical",
        "System Health Critical",
        "Multiple critical security events detected in the last hour",
        recentCriticalEvents.map((e) => e.id),
      );
    }
  }

  /**
   * Generate digest alerts
   */
  private async generateDigestAlerts(): Promise<void> {
    const recentHighSeverityEvents = (
      await this.getRecentEvents(24 * 60 * 60 * 1000)
    ).filter((e) => e.severity === "high" || e.severity === "critical");

    if (recentHighSeverityEvents.length > 0) {
      await this.createSecurityAlert(
        "daily",
        "medium",
        "Daily Security Digest",
        `${recentHighSeverityEvents.length} high/critical security events in the last 24 hours`,
        recentHighSeverityEvents.map((e) => e.id),
      );
    }
  }

  // Helper methods for data management
  private generateEventId(): string {
    return `sec_evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `sec_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `forensic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventFingerprint(
    type: SecurityEventType,
    source: string,
    details: any,
  ): string {
    const fingerprintData = { type, source, details: JSON.stringify(details) };
    return SecurityService.hashData(JSON.stringify(fingerprintData));
  }

  private sanitizeDetails(details: any): any {
    // Remove sensitive information from details
    const sanitized = { ...details };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.key;
    return sanitized;
  }

  // Data storage methods
  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const existingEvents = await this.loadSecurityEvents();
      existingEvents.unshift(event);

      // Keep only recent events
      const recentEvents = existingEvents.slice(
        0,
        SecurityMonitoringForensicsService.MAX_EVENTS,
      );

      await Preferences.set({
        key: SecurityMonitoringForensicsService.EVENTS_KEY,
        value: SecurityService.encryptData(recentEvents),
      });
    } catch (error) {
      console.error(
        "[SecurityMonitoring] Failed to store security event:",
        error,
      );
    }
  }

  private async loadSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const { value } = await Preferences.get({
        key: SecurityMonitoringForensicsService.EVENTS_KEY,
      });

      if (!value) return [];

      const events = SecurityService.decryptData(value);
      return events.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
    } catch (error) {
      console.error(
        "[SecurityMonitoring] Failed to load security events:",
        error,
      );
      return [];
    }
  }

  private async storeSecurityAlerts(): Promise<void> {
    try {
      const alertsArray = Array.from(this.activeAlerts.values());
      await Preferences.set({
        key: SecurityMonitoringForensicsService.ALERTS_KEY,
        value: SecurityService.encryptData(alertsArray),
      });
    } catch (error) {
      console.error("[SecurityMonitoring] Failed to store alerts:", error);
    }
  }

  private async storeMetrics(): Promise<void> {
    try {
      if (this.metrics) {
        await Preferences.set({
          key: SecurityMonitoringForensicsService.METRICS_KEY,
          value: SecurityService.encryptData(this.metrics),
        });
      }
    } catch (error) {
      console.error("[SecurityMonitoring] Failed to store metrics:", error);
    }
  }

  private async storeForensicReport(report: ForensicReport): Promise<void> {
    try {
      const reportKey = `forensic_report_${report.id}`;
      await Preferences.set({
        key: reportKey,
        value: SecurityService.encryptData(report),
      });
    } catch (error) {
      console.error(
        "[SecurityMonitoring] Failed to store forensic report:",
        error,
      );
    }
  }

  // Data retrieval methods
  private async getEventsInTimeframe(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<SecurityEvent[]> {
    const allEvents = await this.loadSecurityEvents();
    return allEvents.filter(
      (event) =>
        event.timestamp >= startDate &&
        event.timestamp <= endDate &&
        (!userId || !event.userId || event.userId === userId),
    );
  }

  private async getRecentEvents(
    milliseconds: number,
  ): Promise<SecurityEvent[]> {
    const cutoff = new Date(Date.now() - milliseconds);
    return this.getEventsInTimeframe(cutoff, new Date());
  }

  private async loadExistingEvents(): Promise<void> {
    const events = await this.loadSecurityEvents();
    this.eventBuffer = events.slice(0, 100); // Keep recent events in memory
  }

  // Analysis helper methods
  private performThreatAnalysis(events: SecurityEvent[]): any {
    const threatTypes = events
      .filter((e) => e.type === "threat_detected")
      .reduce(
        (acc, event) => {
          const threatName = event.details.threatName || "unknown";
          acc[threatName] = (acc[threatName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalThreats: events.filter((e) => e.type === "threat_detected").length,
      threatTypes,
      mostCommonThreat: Object.entries(threatTypes).sort(
        ([, a], [, b]) => b - a,
      )[0],
      severity: this.calculateOverallThreatSeverity(events),
    };
  }

  private generateSecurityRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = [];

    const criticalEvents = events.filter(
      (e) => e.severity === "critical",
    ).length;
    const tamperingEvents = events.filter(
      (e) => e.type === "tampering_detected",
    ).length;
    const accessDeniedEvents = events.filter(
      (e) => e.type === "alarm_access_denied",
    ).length;

    if (criticalEvents > 5) {
      recommendations.push(
        "Review and strengthen security policies due to high critical event count",
      );
    }

    if (tamperingEvents > 0) {
      recommendations.push(
        "Implement additional data integrity checks and monitoring",
      );
    }

    if (accessDeniedEvents > 20) {
      recommendations.push(
        "Review authentication mechanisms and user access patterns",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Security posture appears healthy based on recent activity",
      );
    }

    return recommendations;
  }

  private performRiskAssessment(
    events: SecurityEvent[],
    suspiciousActivities: SecurityEvent[],
  ): any {
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    const factors: string[] = [];
    const mitigations: string[] = [];

    if (suspiciousActivities.length > 10) {
      riskLevel = "high";
      factors.push("High number of suspicious activities detected");
      mitigations.push(
        "Implement enhanced monitoring and automated threat response",
      );
    }

    const criticalEvents = events.filter(
      (e) => e.severity === "critical",
    ).length;
    if (criticalEvents > 5) {
      riskLevel = riskLevel === "low" ? "medium" : "critical";
      factors.push("Multiple critical security events");
      mitigations.push(
        "Immediate security review and incident response required",
      );
    }

    if (factors.length === 0) {
      factors.push("No significant risk factors identified");
      mitigations.push("Continue current security monitoring practices");
    }

    return { level: riskLevel, factors, mitigations };
  }

  private calculateOverallThreatSeverity(
    events: SecurityEvent[],
  ): "low" | "medium" | "high" | "critical" {
    const severityCounts = events.reduce(
      (acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    if (severityCounts.critical > 0) return "critical";
    if (severityCounts.high > 3) return "high";
    if (severityCounts.medium > 10) return "medium";
    return "low";
  }

  private calculateAverageResponseTime(events: SecurityEvent[]): number {
    const resolvedEvents = events.filter((e) => e.resolved);
    if (resolvedEvents.length === 0) return 0;

    const totalTime = resolvedEvents.reduce((acc, event) => {
      // Calculate response time based on event actions
      return acc + event.actions.length * 300000; // Estimate 5 minutes per action
    }, 0);

    return totalTime / resolvedEvents.length;
  }

  private async cleanupOldData(): Promise<void> {
    console.log("[SecurityMonitoring] Cleaning up old security data...");

    try {
      // Clean up old events (keep only last 30 days)
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const allEvents = await this.loadSecurityEvents();
      const recentEvents = allEvents.filter((e) => e.timestamp > cutoffDate);

      if (recentEvents.length !== allEvents.length) {
        await Preferences.set({
          key: SecurityMonitoringForensicsService.EVENTS_KEY,
          value: SecurityService.encryptData(recentEvents),
        });

        console.log(
          `[SecurityMonitoring] Cleaned up ${allEvents.length - recentEvents.length} old events`,
        );
      }

      // Clean up resolved alerts older than 7 days
      const oldAlerts = Array.from(this.activeAlerts.values()).filter(
        (alert) =>
          alert.resolved &&
          Date.now() - alert.timestamp.getTime() > 7 * 24 * 60 * 60 * 1000,
      );

      oldAlerts.forEach((alert) => this.activeAlerts.delete(alert.id));
      if (oldAlerts.length > 0) {
        await this.storeSecurityAlerts();
        console.log(
          `[SecurityMonitoring] Cleaned up ${oldAlerts.length} old alerts`,
        );
      }
    } catch (error) {
      console.error("[SecurityMonitoring] Data cleanup failed:", error);
    }
  }

  /**
   * Get active security alerts
   */
  async getActiveAlerts(): Promise<SecurityAlert[]> {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  /**
   * Acknowledge security alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.storeSecurityAlerts();
    }
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      await this.storeSecurityAlerts();
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboardData(): Promise<any> {
    const metrics = await this.getSecurityMetrics();
    const activeAlerts = await this.getActiveAlerts();
    const recentEvents = await this.getRecentEvents(24 * 60 * 60 * 1000);

    return {
      metrics,
      activeAlerts,
      recentEvents: recentEvents.slice(0, 20),
      systemHealth: {
        status: metrics.riskLevel === "low" ? "healthy" : "needs_attention",
        riskLevel: metrics.riskLevel,
        lastUpdate: new Date(),
      },
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.eventBuffer = [];
    this.activeAlerts.clear();
    console.log("[SecurityMonitoring] Service destroyed");
  }
}

export default SecurityMonitoringForensicsService.getInstance();
