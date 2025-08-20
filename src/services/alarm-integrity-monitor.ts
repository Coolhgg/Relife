// Alarm Integrity Monitoring Service
// Provides real-time monitoring and validation of alarm data integrity

import SecurityService from './security';
import SecureAlarmStorageService from './secure-alarm-storage';
import { ErrorHandler } from './error-handler';
import type { Alarm } from '../types';

interface IntegrityCheckResult {
  isValid: boolean;
  issues: IntegrityIssue[];
  timestamp: Date;
  checkId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface IntegrityIssue {
  type:
    | 'checksum_mismatch'
    | 'signature_invalid'
    | 'data_corruption'
    | 'unauthorized_access'
    | 'timestamp_anomaly';
  description: string;
  affectedAlarmIds: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata?: any;
}

interface TamperDetectionEvent {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  affectedData: string[];
  sourceIP?: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
}

interface IntegrityMetrics {
  totalChecks: number;
  failedChecks: number;
  lastCheckTime: Date | null;
  averageCheckDuration: number;
  tamperAttempts: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
}

export class AlarmIntegrityMonitor {
  private static instance: AlarmIntegrityMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private integrityCheckInterval = 30000; // 30 seconds
  private lastKnownAlarmHashes: Map<string, string> = new Map();
  private integrityHistory: IntegrityCheckResult[] = [];
  private tamperEvents: TamperDetectionEvent[] = [];
  private metrics: IntegrityMetrics = {
    totalChecks: 0,
    failedChecks: 0,
    lastCheckTime: null,
    averageCheckDuration: 0,
    tamperAttempts: 0,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
  };

  private alertCallbacks: Array<(event: TamperDetectionEvent) => void> = [];
  private recoveryCallbacks: Array<(result: any) => void> = [];

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): AlarmIntegrityMonitor {
    if (!AlarmIntegrityMonitor.instance) {
      AlarmIntegrityMonitor.instance = new AlarmIntegrityMonitor();
    }
    return AlarmIntegrityMonitor.instance;
  }

  /**
   * Initialize integrity monitoring
   */
  private initializeMonitoring(): void {
    // Register for storage tamper detection events
    const secureStorage = SecureAlarmStorageService.getInstance();
    secureStorage.onTamperDetected(details => {
      this.handleStorageTamperDetection(details);
    });

    // Register for general security events
    window.addEventListener('alarm-security-event', (event: CustomEvent) => {
      this.handleSecurityEvent(event.detail);
    });

    // Register for visibility changes to perform integrity checks
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.performIntegrityCheck();
      }
    });

    console.log('[AlarmIntegrityMonitor] Initialized');
  }

  /**
   * Start continuous integrity monitoring
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) {
      console.log('[AlarmIntegrityMonitor] Already monitoring');
      return;
    }

    this.integrityCheckInterval = intervalMs;
    this.isMonitoring = true;

    // Perform initial integrity check
    this.performIntegrityCheck();

    // Start periodic checks
    this.monitoringInterval = setInterval(() => {
      this.performIntegrityCheck();
    }, this.integrityCheckInterval);

    console.log(
      `[AlarmIntegrityMonitor] Started monitoring with ${intervalMs}ms interval`
    );
  }

  /**
   * Stop integrity monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[AlarmIntegrityMonitor] Stopped monitoring');
  }

  /**
   * Perform comprehensive integrity check on all alarm data
   */
  async performIntegrityCheck(userId?: string): Promise<IntegrityCheckResult> {
    const startTime = performance.now();
    const checkId = SecurityService.generateCSRFToken();
    const issues: IntegrityIssue[] = [];

    try {
      this.metrics.totalChecks++;

      // 1. Check storage integrity
      const storageStatus =
        await SecureAlarmStorageService.getInstance().getStorageStatus();
      if (storageStatus.error) {
        issues.push({
          type: 'data_corruption',
          description: 'Storage integrity check failed',
          affectedAlarmIds: [],
          severity: 'high',
          timestamp: new Date(),
          metadata: { error: storageStatus.error },
        });
      }

      // 2. Validate alarm data structure and content
      const secureStorage = SecureAlarmStorageService.getInstance();
      let alarms: Alarm[] = [];

      try {
        alarms = await secureStorage.retrieveAlarms(userId);
      } catch (error) {
        issues.push({
          type: 'data_corruption',
          description: 'Failed to retrieve alarms for integrity check',
          affectedAlarmIds: [],
          severity: 'critical',
          timestamp: new Date(),
          metadata: { error: error.message },
        });
      }

      // 3. Validate individual alarm integrity
      for (const alarm of alarms) {
        const alarmIssues = await this.validateAlarmIntegrity(alarm);
        issues.push(...alarmIssues);
      }

      // 4. Check for unauthorized modifications
      const modificationIssues = await this.detectUnauthorizedModifications(alarms);
      issues.push(...modificationIssues);

      // 5. Validate alarm scheduling integrity
      const schedulingIssues = await this.validateSchedulingIntegrity(alarms);
      issues.push(...schedulingIssues);

      // Calculate result
      const duration = performance.now() - startTime;
      this.updateMetrics(duration, issues.length > 0);

      const severity = this.calculateOverallSeverity(issues);
      const result: IntegrityCheckResult = {
        isValid: issues.length === 0,
        issues,
        timestamp: new Date(),
        checkId,
        severity,
      };

      // Store result in history
      this.integrityHistory.push(result);
      if (this.integrityHistory.length > 100) {
        this.integrityHistory = this.integrityHistory.slice(-100);
      }

      // Handle issues if found
      if (issues.length > 0) {
        await this.handleIntegrityIssues(result);
      }

      console.log(
        `[AlarmIntegrityMonitor] Integrity check completed: ${issues.length} issues found`
      );
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateMetrics(duration, true);

      const criticalIssue: IntegrityIssue = {
        type: 'data_corruption',
        description: 'Integrity check failed with error',
        affectedAlarmIds: [],
        severity: 'critical',
        timestamp: new Date(),
        metadata: { error: error.message },
      };

      const result: IntegrityCheckResult = {
        isValid: false,
        issues: [criticalIssue],
        timestamp: new Date(),
        checkId,
        severity: 'critical',
      };

      await this.handleIntegrityIssues(result);

      console.error('[AlarmIntegrityMonitor] Integrity check failed:', error);
      return result;
    }
  }

  /**
   * Validate integrity of individual alarm
   */
  private async validateAlarmIntegrity(alarm: Alarm): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    try {
      // 1. Validate alarm structure
      if (!this.validateAlarmStructure(alarm)) {
        issues.push({
          type: 'data_corruption',
          description: 'Alarm has invalid or corrupted structure',
          affectedAlarmIds: [alarm.id],
          severity: 'high',
          timestamp: new Date(),
        });
      }

      // 2. Check for data consistency
      if (!this.validateAlarmConsistency(alarm)) {
        issues.push({
          type: 'data_corruption',
          description: 'Alarm data contains inconsistencies',
          affectedAlarmIds: [alarm.id],
          severity: 'medium',
          timestamp: new Date(),
        });
      }

      // 3. Validate timestamp integrity
      if (!this.validateTimestamps(alarm)) {
        issues.push({
          type: 'timestamp_anomaly',
          description: 'Alarm has invalid or suspicious timestamps',
          affectedAlarmIds: [alarm.id],
          severity: 'medium',
          timestamp: new Date(),
        });
      }

      // 4. Check for injection attacks in string fields
      if (!this.validateStringFields(alarm)) {
        issues.push({
          type: 'unauthorized_access',
          description: 'Potential injection attack detected in alarm data',
          affectedAlarmIds: [alarm.id],
          severity: 'high',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      issues.push({
        type: 'data_corruption',
        description: 'Failed to validate alarm integrity',
        affectedAlarmIds: [alarm.id],
        severity: 'high',
        timestamp: new Date(),
        metadata: { error: error.message },
      });
    }

    return issues;
  }

  /**
   * Detect unauthorized modifications by comparing with known hashes
   */
  private async detectUnauthorizedModifications(
    alarms: Alarm[]
  ): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    try {
      for (const alarm of alarms) {
        const currentHash = this.calculateAlarmHash(alarm);
        const knownHash = this.lastKnownAlarmHashes.get(alarm.id);

        if (knownHash && knownHash !== currentHash) {
          // Check if this is a legitimate update or unauthorized modification
          if (!this.isLegitimateUpdate(alarm)) {
            issues.push({
              type: 'unauthorized_access',
              description: 'Unauthorized modification detected',
              affectedAlarmIds: [alarm.id],
              severity: 'high',
              timestamp: new Date(),
              metadata: {
                expectedHash: knownHash,
                actualHash: currentHash,
              },
            });
          }
        }

        // Update known hash
        this.lastKnownAlarmHashes.set(alarm.id, currentHash);
      }

      // Check for deleted alarms
      for (const [alarmId, hash] of this.lastKnownAlarmHashes.entries()) {
        if (!alarms.find(a => a.id === alarmId)) {
          issues.push({
            type: 'unauthorized_access',
            description: 'Alarm was deleted without proper authorization',
            affectedAlarmIds: [alarmId],
            severity: 'medium',
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      issues.push({
        type: 'data_corruption',
        description: 'Failed to detect unauthorized modifications',
        affectedAlarmIds: [],
        severity: 'medium',
        timestamp: new Date(),
        metadata: { error: error.message },
      });
    }

    return issues;
  }

  /**
   * Validate scheduling integrity
   */
  private async validateSchedulingIntegrity(
    alarms: Alarm[]
  ): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    try {
      for (const alarm of alarms.filter(a => a.enabled)) {
        // Check for scheduling anomalies
        if (!this.validateScheduling(alarm)) {
          issues.push({
            type: 'data_corruption',
            description: 'Alarm has invalid scheduling configuration',
            affectedAlarmIds: [alarm.id],
            severity: 'high',
            timestamp: new Date(),
          });
        }

        // Check for time manipulation
        if (!this.validateTimeIntegrity(alarm)) {
          issues.push({
            type: 'timestamp_anomaly',
            description: 'Potential time manipulation detected',
            affectedAlarmIds: [alarm.id],
            severity: 'high',
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      issues.push({
        type: 'data_corruption',
        description: 'Failed to validate scheduling integrity',
        affectedAlarmIds: [],
        severity: 'medium',
        timestamp: new Date(),
        metadata: { error: error.message },
      });
    }

    return issues;
  }

  /**
   * Handle integrity issues with automatic recovery attempts
   */
  private async handleIntegrityIssues(result: IntegrityCheckResult): Promise<void> {
    this.metrics.failedChecks++;

    // Create tamper detection event
    const tamperEvent: TamperDetectionEvent = {
      type: 'integrity_violation',
      description: `Integrity check failed with ${result.issues.length} issues`,
      severity: result.severity,
      timestamp: result.timestamp,
      affectedData: result.issues.flatMap(i => i.affectedAlarmIds),
      userId: this.getCurrentUserId(),
    };

    this.tamperEvents.push(tamperEvent);
    this.metrics.tamperAttempts++;

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(tamperEvent);
      } catch (error) {
        console.error('[AlarmIntegrityMonitor] Alert callback error:', error);
      }
    });

    // Attempt automatic recovery for critical issues
    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      await this.attemptRecovery(criticalIssues);
    }

    // Log security event
    this.logSecurityEvent('integrity_violation', {
      checkId: result.checkId,
      issueCount: result.issues.length,
      severity: result.severity,
      issues: result.issues,
    });

    // Emit custom event for UI components
    window.dispatchEvent(
      new CustomEvent('alarm-integrity-violation', {
        detail: { result, tamperEvent },
      })
    );
  }

  /**
   * Attempt automatic recovery from integrity issues
   */
  private async attemptRecovery(issues: IntegrityIssue[]): Promise<void> {
    this.metrics.recoveryAttempts++;

    try {
      console.log(
        `[AlarmIntegrityMonitor] Attempting recovery for ${issues.length} critical issues`
      );

      // Try to recover from backup
      const secureStorage = SecureAlarmStorageService.getInstance();
      const recoveredAlarms = await secureStorage.retrieveAlarms();

      if (recoveredAlarms.length > 0) {
        this.metrics.successfulRecoveries++;
        console.log(
          '[AlarmIntegrityMonitor] Successfully recovered alarm data from backup'
        );

        // Notify recovery callbacks
        this.recoveryCallbacks.forEach(callback => {
          try {
            callback({ success: true, recoveredAlarms });
          } catch (error) {
            console.error('[AlarmIntegrityMonitor] Recovery callback error:', error);
          }
        });

        // Emit recovery event
        window.dispatchEvent(
          new CustomEvent('alarm-data-recovered', {
            detail: { recoveredAlarms, issues },
          })
        );
      }
    } catch (error) {
      console.error('[AlarmIntegrityMonitor] Recovery attempt failed:', error);

      // Notify recovery callbacks of failure
      this.recoveryCallbacks.forEach(callback => {
        try {
          callback({ success: false, error: error.message });
        } catch (callbackError) {
          console.error(
            '[AlarmIntegrityMonitor] Recovery callback error:',
            callbackError
          );
        }
      });
    }
  }

  /**
   * Handle storage tamper detection from SecureAlarmStorageService
   */
  private handleStorageTamperDetection(details: any): void {
    const tamperEvent: TamperDetectionEvent = {
      type: details.type,
      description: details.details?.error || 'Storage tamper detected',
      severity: 'high',
      timestamp: new Date(),
      affectedData: details.details?.alarmIds || [],
      userId: details.details?.userId,
    };

    this.tamperEvents.push(tamperEvent);
    this.metrics.tamperAttempts++;

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(tamperEvent);
      } catch (error) {
        console.error('[AlarmIntegrityMonitor] Alert callback error:', error);
      }
    });

    this.logSecurityEvent('storage_tamper_detected', details);
    console.error('[AlarmIntegrityMonitor] Storage tamper detected:', tamperEvent);
  }

  /**
   * Handle general security events
   */
  private handleSecurityEvent(eventDetail: any): void {
    // Log and analyze security events for patterns
    this.logSecurityEvent('security_event_received', eventDetail);

    // Check for suspicious patterns
    if (this.detectSuspiciousPatterns(eventDetail)) {
      const tamperEvent: TamperDetectionEvent = {
        type: 'suspicious_activity',
        description: 'Suspicious activity pattern detected',
        severity: 'medium',
        timestamp: new Date(),
        affectedData: [],
        userId: eventDetail.details?.userId,
      };

      this.tamperEvents.push(tamperEvent);
      this.alertCallbacks.forEach(callback => callback(tamperEvent));
    }
  }

  // Validation helper methods
  private validateAlarmStructure(alarm: Alarm): boolean {
    return !!(
      alarm.id &&
      alarm.time &&
      alarm.label &&
      alarm.voiceMood &&
      Array.isArray(alarm.days)
    );
  }

  private validateAlarmConsistency(alarm: Alarm): boolean {
    // Check time format
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(alarm.time)) return false;

    // Check days array
    if (!alarm.days.every(day => day >= 0 && day <= 6)) return false;

    // Check snooze settings consistency
    if (alarm.snoozeEnabled && (!alarm.snoozeInterval || alarm.snoozeInterval < 1))
      return false;

    return true;
  }

  private validateTimestamps(alarm: Alarm): boolean {
    const now = new Date();

    // Check if creation time is reasonable
    if (alarm.createdAt && alarm.createdAt > now) return false;

    // Check if updated time is after creation time
    if (alarm.createdAt && alarm.updatedAt && alarm.updatedAt < alarm.createdAt)
      return false;

    return true;
  }

  private validateStringFields(alarm: Alarm): boolean {
    // Check for potential injection attacks
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
    ];

    const stringFields = [alarm.label, alarm.sound];

    return !stringFields.some(
      field => field && suspiciousPatterns.some(pattern => pattern.test(field))
    );
  }

  private validateScheduling(alarm: Alarm): boolean {
    // Basic scheduling validation
    return alarm.days.length > 0 && alarm.time.length > 0;
  }

  private validateTimeIntegrity(alarm: Alarm): boolean {
    // Check for reasonable time values and scheduling
    const [hours, minutes] = alarm.time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  private calculateAlarmHash(alarm: Alarm): string {
    const hashData = {
      id: alarm.id,
      time: alarm.time,
      label: alarm.label,
      days: alarm.days,
      enabled: alarm.enabled,
      voiceMood: alarm.voiceMood,
    };
    return SecurityService.hashData(
      JSON.stringify(hashData, Object.keys(hashData).sort())
    );
  }

  private isLegitimateUpdate(alarm: Alarm): boolean {
    // Check if the update timestamp is recent (within last 10 minutes)
    if (!alarm.updatedAt) return false;

    const now = new Date();
    const timeDiff = now.getTime() - alarm.updatedAt.getTime();

    return timeDiff < 10 * 60 * 1000; // 10 minutes
  }

  private calculateOverallSeverity(
    issues: IntegrityIssue[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.some(i => i.severity === 'critical')) return 'critical';
    if (issues.some(i => i.severity === 'high')) return 'high';
    if (issues.some(i => i.severity === 'medium')) return 'medium';
    return 'low';
  }

  private detectSuspiciousPatterns(eventDetail: any): boolean {
    // Simple pattern detection - could be enhanced with ML
    const suspiciousEvents = ['alarm_deleted', 'alarm_updated', 'alarm_toggled'];

    if (!suspiciousEvents.includes(eventDetail.event)) return false;

    // Check for rapid successive events
    const recentEvents = this.integrityHistory.filter(
      h => new Date().getTime() - h.timestamp.getTime() < 60000
    ).length; // Last minute

    return recentEvents > 10; // More than 10 events in a minute
  }

  private updateMetrics(duration: number, hasFailed: boolean): void {
    this.metrics.lastCheckTime = new Date();

    // Update average check duration
    if (this.metrics.totalChecks === 1) {
      this.metrics.averageCheckDuration = duration;
    } else {
      this.metrics.averageCheckDuration =
        (this.metrics.averageCheckDuration * (this.metrics.totalChecks - 1) +
          duration) /
        this.metrics.totalChecks;
    }
  }

  private getCurrentUserId(): string | undefined {
    // Try to get current user ID from various sources
    try {
      // This would be implementation-specific
      return undefined;
    } catch {
      return undefined;
    }
  }

  private logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      source: 'AlarmIntegrityMonitor',
    };

    console.log('[ALARM INTEGRITY LOG]', logEntry);

    // Emit custom event for external logging systems
    window.dispatchEvent(
      new CustomEvent('alarm-integrity-log', {
        detail: logEntry,
      })
    );
  }

  // Public API methods
  onTamperDetected(callback: (event: TamperDetectionEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  onRecoveryAttempt(callback: (result: any) => void): void {
    this.recoveryCallbacks.push(callback);
  }

  getMetrics(): IntegrityMetrics {
    return { ...this.metrics };
  }

  getIntegrityHistory(): IntegrityCheckResult[] {
    return [...this.integrityHistory];
  }

  getTamperEvents(): TamperDetectionEvent[] {
    return [...this.tamperEvents];
  }

  clearHistory(): void {
    this.integrityHistory = [];
    this.tamperEvents = [];
    this.metrics = {
      totalChecks: 0,
      failedChecks: 0,
      lastCheckTime: null,
      averageCheckDuration: 0,
      tamperAttempts: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
    };
  }

  destroy(): void {
    this.stopMonitoring();
    this.alertCallbacks = [];
    this.recoveryCallbacks = [];
    this.lastKnownAlarmHashes.clear();
    console.log('[AlarmIntegrityMonitor] Service destroyed');
  }
}

export default AlarmIntegrityMonitor.getInstance();
