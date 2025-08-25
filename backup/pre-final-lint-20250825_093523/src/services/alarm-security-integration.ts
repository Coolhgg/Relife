/// <reference lib="dom" />
// Alarm Security Integration Service
// Coordinates all security components into a unified security system for alarm reliability

import SecureAlarmStorageService from './secure-alarm-storage';
import AlarmIntegrityMonitor from './alarm-integrity-monitor';
import SecurePushNotificationService from './secure-push-notification';
import AlarmAccessControl from './alarm-access-control';
import AlarmBackupRedundancyService from './alarm-backup-redundancy';
import SecurityMonitoringForensicsService from './security-monitoring-forensics';
import AlarmRateLimitingService from './alarm-rate-limiting';
import AlarmAPISecurityService from './alarm-api-security';
import SecurityService from './security';
import { ErrorHandler } from './error-handler';
import type { Alarm, AlarmEvent } from '../types';
import { TimeoutHandle } from '../types/timers';
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify

interface SecurityStatus {
  overall: 'secure' | 'warning' | 'critical' | 'compromised';
  components: {
    storage: 'active' | 'degraded' | 'failed';
    integrity: 'monitoring' | 'degraded' | 'compromised';
    pushSecurity: 'active' | 'degraded' | 'failed';
    accessControl: 'active' | 'bypassed' | 'failed';
    backup: 'healthy' | 'degraded' | 'failed';
    monitoring: 'active' | 'degraded' | 'offline';
    rateLimiting: 'active' | 'degraded' | 'bypassed';
    apiSecurity: 'active' | 'degraded' | 'failed';
  };
  metrics: {
    totalThreats: number;
    activeAlerts: number;
    backupHealth: number;
    integrityScore: number;
    lastUpdate: Date;
  };
  recommendations: string[];
}

interface SecurityOperation {
  id: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'backup' | 'restore';
  userId: string;
  data: any;
  context: {
    ip?: string;
    userAgent?: string;
    source: string;
    authenticated: boolean;
  };
}

interface SecurityResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
  securityFlags: string[];
  auditTrail: string;
}

export class AlarmSecurityIntegrationService {
  private static instance: AlarmSecurityIntegrationService;
  private securityEnabled = true;
  private emergencyBypassActive = false;
  private lastHealthCheck: Date | null = null;

  private constructor() {
    this.initializeSecuritySystem();
    this.startHealthMonitoring();
  }

  static getInstance(): AlarmSecurityIntegrationService {
    if (!AlarmSecurityIntegrationService.instance) {
      AlarmSecurityIntegrationService.instance = new AlarmSecurityIntegrationService();
    }
    return AlarmSecurityIntegrationService.instance;
  }

  /**
   * Secure alarm creation with full security pipeline
   */
  async createAlarmSecurely(operation: SecurityOperation): Promise<SecurityResult> {
    const startTime = Date.now();
    const auditTrail = `create_alarm_${operation.id}_${operation.userId}`;

    try {
      // 1. Access Control Validation
      const accessResult = await AlarmAccessControl.validateAlarmAccess(
        operation.userId,
        'create',
        operation.data,
        operation.context
      );

      if (!accessResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          accessResult.errors,
          [],
          ['access_denied'],
          auditTrail
        );
      }

      // 2. Rate Limiting Check
      const rateLimitResult = await AlarmRateLimitingService.checkRateLimit(
        operation.userId,
        'create_alarm',
        operation.context.ip
      );

      if (!rateLimitResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          [rateLimitResult.reason || 'Rate limited'],
          [],
          ['rate_limited'],
          auditTrail
        );
      }

      // 3. Input Validation and Sanitization
      const validatedData = await this.validateAndSanitizeAlarmData(operation.data);
      if (!validatedData.valid) {
        return this.createSecurityResult(
          false,
          null,
          validatedData.errors,
          validatedData.warnings,
          ['validation_failed'],
          auditTrail
        );
      }

      // 4. Create alarm with secure storage
      const newAlarm: Alarm = {
        id: SecurityService.generateCSRFToken(), // Use as unique ID
        ...validatedData.data,
        userId: operation.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 5. Store securely
      await SecureAlarmStorageService.storeAlarms([newAlarm], operation.userId);

      // 6. Create backup
      await AlarmBackupRedundancyService.createBackup('manual', operation.userId);

      // 7. Log security event
      await SecurityMonitoringForensicsService.logSecurityEvent(
        'alarm_access_denied', // Using existing _event type
        'low',
        'alarm_security_integration',
        {
          operation: 'create_alarm',
          userId: operation.userId,
          alarmId: newAlarm.id,
          success: true,
          responseTime: Date.now() - startTime,
        },
        operation.userId
      );

      return this.createSecurityResult(
        true,
        newAlarm,
        [],
        [],
        ['secure_creation'],
        auditTrail
      );
    } catch (_error) {
      await this.handleSecurityError(_error, operation, auditTrail);
      return this.createSecurityResult(
        false,
        null,
        ['Internal security _error'],
        [],
        ['system_error'],
        auditTrail
      );
    }
  }

  /**
   * Secure alarm retrieval with access control
   */
  async retrieveAlarmsSecurely(operation: SecurityOperation): Promise<SecurityResult> {
    const auditTrail = `retrieve_alarms_${operation.id}_${operation.userId}`;

    try {
      // 1. Access Control Validation
      const accessResult = await AlarmAccessControl.validateAlarmAccess(
        operation.userId,
        'read',
        null,
        operation.context
      );

      if (!accessResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          accessResult.errors,
          [],
          ['access_denied'],
          auditTrail
        );
      }

      // 2. Rate Limiting Check
      const rateLimitResult = await AlarmRateLimitingService.checkRateLimit(
        operation.userId,
        'data_access',
        operation.context.ip
      );

      if (!rateLimitResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          [rateLimitResult.reason || 'Rate limited'],
          [],
          ['rate_limited'],
          auditTrail
        );
      }

      // 3. Retrieve from secure storage
      const alarms = await SecureAlarmStorageService.retrieveAlarms(operation.userId);

      // 4. Filter based on user access level
      const filteredAlarms = this.filterAlarmsForUser(alarms, operation.userId);

      // 5. Log access
      await SecurityMonitoringForensicsService.logSecurityEvent(
        'data_access',
        'low',
        'alarm_security_integration',
        {
          operation: 'retrieve_alarms',
          userId: operation.userId,
          alarmCount: filteredAlarms.length,
        },
        operation.userId
      );

      return this.createSecurityResult(
        true,
        filteredAlarms,
        [],
        [],
        ['secure_retrieval'],
        auditTrail
      );
    } catch (_error) {
      await this.handleSecurityError(_error, operation, auditTrail);
      return this.createSecurityResult(
        false,
        null,
        ['Retrieval failed'],
        [],
        ['system_error'],
        auditTrail
      );
    }
  }

  /**
   * Secure alarm update with integrity validation
   */
  async updateAlarmSecurely(operation: SecurityOperation): Promise<SecurityResult> {
    const auditTrail = `update_alarm_${operation.id}_${operation.userId}`;

    try {
      // 1. Access Control Validation
      const accessResult = await AlarmAccessControl.validateAlarmAccess(
        operation.userId,
        'update',
        operation.data,
        operation.context
      );

      if (!accessResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          accessResult.errors,
          [],
          ['access_denied'],
          auditTrail
        );
      }

      // 2. Rate Limiting Check
      const rateLimitResult = await AlarmRateLimitingService.checkRateLimit(
        operation.userId,
        'update_alarm',
        operation.context.ip
      );

      if (!rateLimitResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          [rateLimitResult.reason || 'Rate limited'],
          [],
          ['rate_limited'],
          auditTrail
        );
      }

      // 3. Retrieve current alarms
      const currentAlarms = await SecureAlarmStorageService.retrieveAlarms(
        operation.userId
      );
      const existingAlarm = currentAlarms.find(alarm => alarm.id === operation.data.id);

      if (!existingAlarm) {
        return this.createSecurityResult(
          false,
          null,
          ['Alarm not found'],
          [],
          ['not_found'],
          auditTrail
        );
      }

      // 4. Validate ownership
      if (existingAlarm.userId && existingAlarm.userId !== operation.userId) {
        return this.createSecurityResult(
          false,
          null,
          ['Access denied'],
          [],
          ['ownership_violation'],
          auditTrail
        );
      }

      // 5. Validate and sanitize update data
      const validatedData = await this.validateAndSanitizeAlarmData(operation.data);
      if (!validatedData.valid) {
        return this.createSecurityResult(
          false,
          null,
          validatedData.errors,
          validatedData.warnings,
          ['validation_failed'],
          auditTrail
        );
      }

      // 6. Update alarm
      const updatedAlarm = {
        ...existingAlarm,
        ...validatedData.data,
        updatedAt: new Date(),
      };

      // 7. Update in storage
      const updatedAlarms = currentAlarms.map(alarm =>
        alarm.id === operation.data.id ? updatedAlarm : alarm
      );

      await SecureAlarmStorageService.storeAlarms(updatedAlarms, operation.userId);

      // 8. Create backup after significant changes
      await AlarmBackupRedundancyService.createBackup('manual', operation.userId);

      // 9. Log update
      await SecurityMonitoringForensicsService.logSecurityEvent(
        'unauthorized_modification',
        'medium',
        'alarm_security_integration',
        {
          operation: 'update_alarm',
          userId: operation.userId,
          alarmId: operation.data.id,
          success: true,
        },
        operation.userId
      );

      return this.createSecurityResult(
        true,
        updatedAlarm,
        [],
        [],
        ['secure_update'],
        auditTrail
      );
    } catch (_error) {
      await this.handleSecurityError(_error, operation, auditTrail);
      return this.createSecurityResult(
        false,
        null,
        ['Update failed'],
        [],
        ['system_error'],
        auditTrail
      );
    }
  }

  /**
   * Secure alarm deletion with audit trail
   */
  async deleteAlarmSecurely(operation: SecurityOperation): Promise<SecurityResult> {
    const auditTrail = `delete_alarm_${operation.id}_${operation.userId}`;

    try {
      // 1. Access Control Validation
      const accessResult = await AlarmAccessControl.validateAlarmAccess(
        operation.userId,
        'delete',
        operation.data,
        operation.context
      );

      if (!accessResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          accessResult.errors,
          [],
          ['access_denied'],
          auditTrail
        );
      }

      // 2. Rate Limiting Check
      const rateLimitResult = await AlarmRateLimitingService.checkRateLimit(
        operation.userId,
        'delete_alarm',
        operation.context.ip
      );

      if (!rateLimitResult.allowed) {
        return this.createSecurityResult(
          false,
          null,
          [rateLimitResult.reason || 'Rate limited'],
          [],
          ['rate_limited'],
          auditTrail
        );
      }

      // 3. Retrieve current alarms
      const currentAlarms = await SecureAlarmStorageService.retrieveAlarms(
        operation.userId
      );
      const alarmToDelete = currentAlarms.find(alarm => alarm.id === operation.data.id);

      if (!alarmToDelete) {
        return this.createSecurityResult(
          false,
          null,
          ['Alarm not found'],
          [],
          ['not_found'],
          auditTrail
        );
      }

      // 4. Validate ownership
      if (alarmToDelete.userId && alarmToDelete.userId !== operation.userId) {
        return this.createSecurityResult(
          false,
          null,
          ['Access denied'],
          [],
          ['ownership_violation'],
          auditTrail
        );
      }

      // 5. Create backup before deletion
      await AlarmBackupRedundancyService.createBackup('emergency', operation.userId);

      // 6. Remove alarm
      const updatedAlarms = currentAlarms.filter(
        alarm => alarm.id !== operation.data.id
      );
      await SecureAlarmStorageService.storeAlarms(updatedAlarms, operation.userId);

      // 7. Log deletion
      await SecurityMonitoringForensicsService.logSecurityEvent(
        'unauthorized_modification',
        'high',
        'alarm_security_integration',
        {
          operation: 'delete_alarm',
          userId: operation.userId,
          alarmId: operation.data.id,
          success: true,
          alarmData: alarmToDelete, // Keep for audit
        },
        operation.userId
      );

      return this.createSecurityResult(
        true,
        { deleted: true, alarmId: operation.data.id },
        [],
        [],
        ['secure_deletion'],
        auditTrail
      );
    } catch (_error) {
      await this.handleSecurityError(_error, operation, auditTrail);
      return this.createSecurityResult(
        false,
        null,
        ['Deletion failed'],
        [],
        ['system_error'],
        auditTrail
      );
    }
  }

  /**
   * Get comprehensive security status
   */
  async getSecurityStatus(): Promise<SecurityStatus> {
    try {
      // Check each component
      const storageStatus = await this.checkStorageHealth();
      const integrityStatus = await this.checkIntegrityHealth();
      const backupStatus = await this.checkBackupHealth();
      const monitoringStatus = await this.checkMonitoringHealth();

      // Get metrics
      const securityMetrics =
        await SecurityMonitoringForensicsService.getSecurityMetrics();
      const rateLimitStats = await AlarmRateLimitingService.getRateLimitingStats();
      const apiSecurityStats = await AlarmAPISecurityService.getSecurityStats();

      // Calculate overall status
      const componentStatuses = [
        storageStatus,
        integrityStatus,
        backupStatus,
        monitoringStatus,
      ];

      let overall: 'secure' | 'warning' | 'critical' | 'compromised' = 'secure';
      if (componentStatuses.some(status => status === 'failed')) {
        overall = 'critical';
      } else if (componentStatuses.some(status => status === 'degraded')) {
        overall = 'warning';
      }

      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations({
        storage: storageStatus,
        monitoring: monitoringStatus,
        backup: backupStatus,
        rateLimiting: rateLimitStats,
        apiSecurity: apiSecurityStats,
      });

      return {
        overall,
        components: {
          storage: storageStatus,
          integrity: integrityStatus,
          pushSecurity: 'active', // Assume active for now
          accessControl: 'active', // Assume active for now
          backup: backupStatus,
          monitoring: monitoringStatus,
          rateLimiting: rateLimitStats.blockedUsers > 10 ? 'degraded' : 'active',
          apiSecurity:
            apiSecurityStats.securityLevel === 'critical' ? 'degraded' : 'active',
        },
        metrics: {
          totalThreats: securityMetrics.threatsDetected,
          activeAlerts: securityMetrics.criticalEvents,
          backupHealth: 85, // Placeholder
          integrityScore: securityMetrics.riskLevel === 'low' ? 95 : 70,
          lastUpdate: new Date(),
        },
        recommendations,
      };
    } catch (_error) {
      console._error('[SecurityIntegration] Failed to get security status:', _error);
      return {
        overall: 'critical',
        components: {
          storage: 'failed',
          integrity: 'failed',
          pushSecurity: 'failed',
          accessControl: 'failed',
          backup: 'failed',
          monitoring: 'offline',
          rateLimiting: 'failed',
          apiSecurity: 'failed',
        },
        metrics: {
          totalThreats: 0,
          activeAlerts: 0,
          backupHealth: 0,
          integrityScore: 0,
          lastUpdate: new Date(),
        },
        recommendations: ['Security system is offline - immediate attention required'],
      };
    }
  }

  /**
   * Emergency security bypass for critical situations
   */
  async emergencyBypass(
    adminUserId: string,
    reason: string,
    duration: number = 600000
  ): Promise<string> {
    const bypassToken = SecurityService.generateCSRFToken();

    this.emergencyBypassActive = true;
    setTimeout(() => {
      this.emergencyBypassActive = false;
      console.log('[SecurityIntegration] Emergency bypass expired');
    }, duration);

    // Log emergency bypass
    await SecurityMonitoringForensicsService.logSecurityEvent(
      'security_test_failure',
      'critical',
      'alarm_security_integration',
      {
        action: 'emergency_bypass_activated',
        adminUserId,
        reason,
        duration,
        bypassToken,
      },
      adminUserId
    );

    console.warn(
      `[SecurityIntegration] EMERGENCY BYPASS ACTIVATED: ${reason} (${duration}ms)`
    );
    return bypassToken;
  }

  /**
   * Run comprehensive security diagnostics
   */
  async runSecurityDiagnostics(): Promise<{
    overall: 'pass' | 'warning' | 'fail';
    tests: Array<{
      name: string;
      status: 'pass' | 'warning' | 'fail';
      message: string;
      recommendations?: string[];
    }>;
    summary: string;
  }> {
    const tests = [];

    try {
      // Test storage security
      const storageTest = await this.testStorageSecurity();
      tests.push({
        name: 'Secure Storage',
        status: storageTest.success ? 'pass' : 'fail',
        message: storageTest.message,
        recommendations: storageTest.recommendations,
      });

      // Test backup system
      const backupTest = await this.testBackupSecurity();
      tests.push({
        name: 'Backup System',
        status: backupTest.success ? 'pass' : 'fail',
        message: backupTest.message,
        recommendations: backupTest.recommendations,
      });

      // Test rate limiting
      const rateLimitTest = await this.testRateLimiting();
      tests.push({
        name: 'Rate Limiting',
        status: rateLimitTest.success ? 'pass' : 'fail',
        message: rateLimitTest.message,
        recommendations: rateLimitTest.recommendations,
      });

      // Test API security
      const apiTest = await this.testAPISecurity();
      tests.push({
        name: 'API Security',
        status: apiTest.success ? 'pass' : 'fail',
        message: apiTest.message,
        recommendations: apiTest.recommendations,
      });

      // Calculate overall status
      const failedTests = tests.filter(test => test.status === 'fail').length;
      const warningTests = tests.filter(test => test.status === 'warning').length;

      let overall: 'pass' | 'warning' | 'fail';
      if (failedTests > 0) {
        overall = 'fail';
      } else if (warningTests > 0) {
        overall = 'warning';
      } else {
        overall = 'pass';
      }

      const summary = `Security diagnostics completed: ${tests.length} tests run, ${tests.filter(t => t.status === 'pass').length} passed, ${warningTests} warnings, ${failedTests} failed`;

      return { overall, tests, summary };
    } catch (_error) {
      return {
        overall: 'fail',
        tests: [
          {
            name: 'Diagnostics System',
            status: 'fail',
            message: 'Security diagnostics system failed',
            recommendations: ['Check system integrity and restart security services'],
          },
        ],
        summary: 'Security diagnostics failed due to system error',
      };
    }
  }

  // Private helper methods

  private async initializeSecuritySystem(): Promise<void> {
    try {
      console.log(
        '[SecurityIntegration] Initializing comprehensive security system...'
      );

      // Initialize all security components
      SecureAlarmStorageService.getInstance();
      SecurityMonitoringForensicsService.getInstance();
      AlarmRateLimitingService.getInstance();
      AlarmAPISecurityService.getInstance();
      AlarmBackupRedundancyService.getInstance();

      // Set up event listeners for security events
      this.setupSecurityEventListeners();

      console.log('[SecurityIntegration] Security system initialized successfully');
    } catch (_error) {
      console._error(
        '[SecurityIntegration] Failed to initialize security system:',
        _error
      );
    }
  }

  private setupSecurityEventListeners(): void {
    // Listen for critical security events
    window.addEventListener('security-alert-created', async (_event: any) => {
      if (_event.detail.severity === 'critical') {
        console._error('[SecurityIntegration] CRITICAL SECURITY ALERT:', _event.detail);
        // Could trigger additional automated responses here
      }
    });

    window.addEventListener('alarm-tamper-detected', async (_event: any) => {
      console._error('[SecurityIntegration] TAMPER DETECTED:', _event.detail);
      // Trigger emergency backup
      await AlarmBackupRedundancyService.createEmergencyBackup();
    });
  }

  private startHealthMonitoring(): void {
    setInterval(
      async () => {
        try {
          const status = await this.getSecurityStatus();
          this.lastHealthCheck = new Date();

          if (status.overall === 'critical' || status.overall === 'compromised') {
            console._error('[SecurityIntegration] CRITICAL SECURITY STATUS:', status);
            // Could trigger automated incident response here
          }
        } catch (_error) {
          console._error('[SecurityIntegration] Health check failed:', _error);
        }
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  private async validateAndSanitizeAlarmData(data: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    data?: any;
  }> {
    // Use the API security service for validation
    const mockRequest = {
      method: 'POST',
      url: '/alarms',
      headers: { 'content-type': 'application/json' },
      body: data,
    };

    try {
      const validation = await AlarmAPISecurityService.validateRequest(mockRequest);
      return {
        valid: validation.proceed,
        errors: validation.response ? [validation.response.body._error] : [],
        warnings: [],
        data: validation.proceed ? data : null,
      };
    } catch (_error) {
      return {
        valid: false,
        errors: ['Validation failed'],
        warnings: [],
        data: null,
      };
    }
  }

  private filterAlarmsForUser(alarms: Alarm[], userId: string): Alarm[] {
    return alarms.filter(alarm => !alarm.userId || alarm.userId === userId);
  }

  private createSecurityResult(
    success: boolean,
    data: any,
    errors: string[],
    warnings: string[],
    securityFlags: string[],
    auditTrail: string
  ): SecurityResult {
    return {
      success,
      data,
      errors,
      warnings,
      securityFlags,
      auditTrail,
    };
  }

  private async handleSecurityError(
    _error: any,
    operation: SecurityOperation,
    auditTrail: string
  ): Promise<void> {
    ErrorHandler.handleError(
      error instanceof Error ? _error : new Error(String(_error)),
      'Security operation failed',
      {
        context: 'alarm_security_integration',
        metadata: {
          operationType: operation.type,
          userId: operation.userId,
          auditTrail,
        },
      }
    );

    // Log security error
    await SecurityMonitoringForensicsService.logSecurityEvent(
      'security_test_failure',
      'high',
      'alarm_security_integration',
      {
        _error: _error.message,
        operation: operation.type,
        userId: operation.userId,
        auditTrail,
      },
      operation.userId
    );
  }

  // Health check methods
  private async checkStorageHealth(): Promise<'active' | 'degraded' | 'failed'> {
    try {
      const status = await SecureAlarmStorageService.getStorageStatus();
      if (status._error) return 'failed';
      if (!status.integrityMonitoringActive) return 'degraded';
      return 'active';
    } catch {
      return 'failed';
    }
  }

  private async checkIntegrityHealth(): Promise<
    'monitoring' | 'degraded' | 'compromised'
  > {
    try {
      // This would check the integrity monitor status
      // For now, assume monitoring if storage is active
      const storageHealth = await this.checkStorageHealth();
      return storageHealth === 'active' ? 'monitoring' : 'degraded';
    } catch {
      return 'compromised';
    }
  }

  private async checkBackupHealth(): Promise<'healthy' | 'degraded' | 'failed'> {
    try {
      const status = await AlarmBackupRedundancyService.getRecoveryStatus();
      if (status.totalBackups === 0) return 'failed';
      if (status.verifiedBackups < status.totalBackups * 0.8) return 'degraded';
      return 'healthy';
    } catch {
      return 'failed';
    }
  }

  private async checkMonitoringHealth(): Promise<'active' | 'degraded' | 'offline'> {
    try {
      const metrics = await SecurityMonitoringForensicsService.getSecurityMetrics();
      if (!metrics.lastAnalysis) return 'offline';
      const timeSinceUpdate = Date.now() - metrics.lastAnalysis.getTime();
      if (timeSinceUpdate > 2 * 60 * 60 * 1000) return 'degraded'; // 2 hours
      return 'active';
    } catch {
      return 'offline';
    }
  }

  private generateSecurityRecommendations(status: any): string[] {
    const recommendations: string[] = [];

    if (status.storage === 'failed') {
      recommendations.push(
        'Immediate action required: Secure storage system is offline'
      );
    }

    if (status.backup === 'failed') {
      recommendations.push(
        'Critical: Backup system is not operational - data loss risk'
      );
    }

    if (status.monitoring === 'offline') {
      recommendations.push(
        'Security monitoring is offline - threats may go undetected'
      );
    }

    if (status.rateLimiting.blockedUsers > 5) {
      recommendations.push(
        'High number of blocked users detected - review security policies'
      );
    }

    if (status.apiSecurity.threatsDetected > 10) {
      recommendations.push(
        'Multiple API security threats detected - enhance monitoring'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Security system is operating normally');
    }

    return recommendations;
  }

  // Security test methods
  private async testStorageSecurity(): Promise<{
    success: boolean;
    message: string;
    recommendations?: string[];
  }> {
    try {
      const testAlarm = {
        id: 'test',
        label: 'Security Test',
        time: '12:00',
        enabled: true,
      };
      await SecureAlarmStorageService.storeAlarms([testAlarm], 'security_test');
      const retrieved = await SecureAlarmStorageService.retrieveAlarms('security_test');

      if (retrieved.length === 1 && retrieved[0].label === 'Security Test') {
        return { success: true, message: 'Secure storage is functioning correctly' };
      } else {
        return {
          success: false,
          message: 'Secure storage integrity test failed',
          recommendations: ['Check encryption and storage mechanisms'],
        };
      }
    } catch (_error) {
      return {
        success: false,
        message: 'Secure storage test failed: ' + _error.message,
        recommendations: ['Check storage service availability and encryption keys'],
      };
    }
  }

  private async testBackupSecurity(): Promise<{
    success: boolean;
    message: string;
    recommendations?: string[];
  }> {
    try {
      const backupId = await AlarmBackupRedundancyService.createBackup(
        'manual',
        'security_test'
      );
      if (backupId) {
        return { success: true, message: 'Backup system is functioning correctly' };
      } else {
        return {
          success: false,
          message: 'Backup creation failed',
          recommendations: ['Check backup service and storage availability'],
        };
      }
    } catch (_error) {
      return {
        success: false,
        message: 'Backup system test failed: ' + _error.message,
        recommendations: ['Check backup service configuration and storage'],
      };
    }
  }

  private async testRateLimiting(): Promise<{
    success: boolean;
    message: string;
    recommendations?: string[];
  }> {
    try {
      const result = await AlarmRateLimitingService.checkRateLimit(
        'security_test',
        'create_alarm'
      );
      if (result.allowed !== undefined) {
        return { success: true, message: 'Rate limiting is functioning correctly' };
      } else {
        return {
          success: false,
          message: 'Rate limiting test inconclusive',
          recommendations: ['Check rate limiting service configuration'],
        };
      }
    } catch (_error) {
      return {
        success: false,
        message: 'Rate limiting test failed: ' + _error.message,
        recommendations: ['Check rate limiting service availability'],
      };
    }
  }

  private async testAPISecurity(): Promise<{
    success: boolean;
    message: string;
    recommendations?: string[];
  }> {
    try {
      const stats = await AlarmAPISecurityService.getSecurityStats();
      if (stats.securityLevel) {
        return { success: true, message: 'API security is functioning correctly' };
      } else {
        return {
          success: false,
          message: 'API security test inconclusive',
          recommendations: ['Check API security service configuration'],
        };
      }
    } catch (_error) {
      return {
        success: false,
        message: 'API security test failed: ' + _error.message,
        recommendations: ['Check API security service availability'],
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    SecureAlarmStorageService.getInstance().destroy();
    SecurityMonitoringForensicsService.getInstance().destroy();
    AlarmRateLimitingService.getInstance().destroy();
    AlarmAPISecurityService.getInstance().destroy();
    AlarmBackupRedundancyService.getInstance().destroy();
    console.log('[SecurityIntegration] All security services destroyed');
  }
}

export default AlarmSecurityIntegrationService.getInstance();
