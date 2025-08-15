// Alarm Access Control Service
// Implements user-specific access controls and authorization for alarm operations

import SecurityService from './security';
import { ErrorHandler } from './error-handler';
import type { Alarm, User } from '../types';

interface AccessControlContext {
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  permissions: string[];
  role: UserRole;
}

interface AccessAttempt {
  userId: string;
  resource: string;
  action: string;
  result: 'granted' | 'denied' | 'error';
  reason?: string;
  timestamp: Date;
  metadata?: any;
}

type UserRole = 'user' | 'premium' | 'admin';
type AlarmAction = 'read' | 'create' | 'update' | 'delete' | 'toggle' | 'snooze' | 'dismiss';

export class AlarmAccessControl {
  private static instance: AlarmAccessControl;
  private accessHistory: AccessAttempt[] = [];
  private sessionCache: Map<string, AccessControlContext> = new Map();
  private blockedUsers: Set<string> = new Set();
  private suspiciousActivity: Map<string, number> = new Map();

  private constructor() {
    this.initializeAccessControl();
  }

  static getInstance(): AlarmAccessControl {
    if (!AlarmAccessControl.instance) {
      AlarmAccessControl.instance = new AlarmAccessControl();
    }
    return AlarmAccessControl.instance;
  }

  private initializeAccessControl(): void {
    // Clean up old sessions every 10 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 10 * 60 * 1000);

    // Reset suspicious activity counters every hour
    setInterval(() => {
      this.suspiciousActivity.clear();
    }, 60 * 60 * 1000);

    console.log('[AlarmAccessControl] Initialized');
  }

  /**
   * Create access control context for user session
   */
  createAccessContext(user: User, sessionId?: string, metadata?: any): AccessControlContext {
    const context: AccessControlContext = {
      userId: user.id,
      sessionId: sessionId || SecurityService.generateCSRFToken(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      timestamp: new Date(),
      permissions: this.getUserPermissions(user),
      role: this.getUserRole(user)
    };

    // Cache session context
    if (context.sessionId) {
      this.sessionCache.set(context.sessionId, context);
    }

    this.logAccessEvent('session_created', context.userId, 'session', 'granted');
    return context;
  }

  /**
   * Validate user access to specific alarm
   */
  async validateAlarmAccess(
    userId: string, 
    alarmId: string, 
    action: AlarmAction,
    alarm?: Alarm,
    sessionId?: string
  ): Promise<{ granted: boolean; reason?: string; context?: AccessControlContext }> {
    try {
      // Get or validate session context
      const context = await this.getValidatedContext(userId, sessionId);
      if (!context) {
        this.logAccessEvent('access_denied', userId, `alarm:${alarmId}`, 'denied', 'invalid_session');
        return { granted: false, reason: 'Invalid session' };
      }

      // Check if user is blocked
      if (this.blockedUsers.has(userId)) {
        this.logAccessEvent('access_denied', userId, `alarm:${alarmId}`, 'denied', 'user_blocked');
        return { granted: false, reason: 'Access blocked due to security violations' };
      }

      // Rate limiting per user
      if (!this.checkUserRateLimit(userId, action)) {
        this.logAccessEvent('access_denied', userId, `alarm:${alarmId}`, 'denied', 'rate_limited');
        return { granted: false, reason: 'Rate limit exceeded' };
      }

      // Validate alarm ownership
      if (alarm && !this.validateAlarmOwnership(alarm, userId)) {
        this.incrementSuspiciousActivity(userId);
        this.logAccessEvent('access_denied', userId, `alarm:${alarmId}`, 'denied', 'ownership_violation');
        return { granted: false, reason: 'Access denied: alarm belongs to another user' };
      }

      // Check action permissions
      if (!this.hasPermissionForAction(context, action)) {
        this.logAccessEvent('access_denied', userId, `alarm:${alarmId}`, 'denied', 'insufficient_permissions');
        return { granted: false, reason: `Insufficient permissions for action: ${action}` };
      }

      // All checks passed
      this.logAccessEvent('access_granted', userId, `alarm:${alarmId}`, 'granted');
      return { granted: true, context };

    } catch (error) {
      console.error('[AlarmAccessControl] Access validation failed:', error);
      this.logAccessEvent('access_error', userId, `alarm:${alarmId}`, 'error', error.message);
      return { granted: false, reason: 'Access validation failed' };
    }
  }

  /**
   * Validate bulk alarm access for list operations
   */
  async validateBulkAlarmAccess(
    userId: string, 
    action: AlarmAction,
    sessionId?: string
  ): Promise<{ granted: boolean; reason?: string; maxItems?: number }> {
    try {
      const context = await this.getValidatedContext(userId, sessionId);
      if (!context) {
        return { granted: false, reason: 'Invalid session' };
      }

      if (this.blockedUsers.has(userId)) {
        return { granted: false, reason: 'Access blocked' };
      }

      if (!this.hasPermissionForAction(context, action)) {
        return { granted: false, reason: `Insufficient permissions for bulk ${action}` };
      }

      // Determine max items based on user role
      const maxItems = this.getMaxItemsForRole(context.role, action);
      
      this.logAccessEvent('bulk_access_granted', userId, 'alarms:bulk', 'granted');
      return { granted: true, maxItems };

    } catch (error) {
      console.error('[AlarmAccessControl] Bulk access validation failed:', error);
      return { granted: false, reason: 'Bulk access validation failed' };
    }
  }

  /**
   * Check if user can perform specific administrative actions
   */
  canPerformAdminAction(userId: string, action: string, sessionId?: string): boolean {
    try {
      const context = this.sessionCache.get(sessionId || '');
      if (!context || context.userId !== userId) {
        return false;
      }

      return context.role === 'admin' && context.permissions.includes(action);
    } catch {
      return false;
    }
  }

  /**
   * Block user due to security violations
   */
  blockUser(userId: string, reason: string, duration?: number): void {
    this.blockedUsers.add(userId);
    
    if (duration) {
      setTimeout(() => {
        this.blockedUsers.delete(userId);
        this.logAccessEvent('user_unblocked', userId, 'system', 'granted', 'timeout');
      }, duration);
    }

    this.logAccessEvent('user_blocked', userId, 'system', 'denied', reason);
    
    // Emit security event
    window.dispatchEvent(new CustomEvent('user-blocked', {
      detail: { userId, reason, timestamp: new Date() }
    }));
  }

  /**
   * Get access history for audit purposes
   */
  getAccessHistory(userId?: string, limit = 100): AccessAttempt[] {
    let history = this.accessHistory;
    
    if (userId) {
      history = history.filter(attempt => attempt.userId === userId);
    }
    
    return history.slice(-limit).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentAttempts = this.accessHistory.filter(attempt => attempt.timestamp > oneDayAgo);

    return {
      totalAttempts: this.accessHistory.length,
      recentAttempts: recentAttempts.length,
      deniedAttempts: recentAttempts.filter(attempt => attempt.result === 'denied').length,
      blockedUsers: this.blockedUsers.size,
      activeSessions: this.sessionCache.size,
      suspiciousUsers: this.suspiciousActivity.size
    };
  }

  // Private helper methods
  private async getValidatedContext(userId: string, sessionId?: string): Promise<AccessControlContext | null> {
    if (sessionId && this.sessionCache.has(sessionId)) {
      const context = this.sessionCache.get(sessionId)!;
      if (context.userId === userId && this.isSessionValid(context)) {
        return context;
      }
    }

    // If no valid session, create temporary context for validation
    return {
      userId,
      timestamp: new Date(),
      permissions: ['read', 'create', 'update', 'delete', 'toggle', 'snooze', 'dismiss'],
      role: 'user' as UserRole
    };
  }

  private validateAlarmOwnership(alarm: Alarm, userId: string): boolean {
    // If alarm has no userId (legacy), allow access
    // If alarm has userId, it must match the requesting user
    return !alarm.userId || alarm.userId === userId;
  }

  private getUserPermissions(user: User): string[] {
    // Base permissions for all users
    const basePermissions = ['read', 'create', 'update', 'delete', 'toggle', 'snooze', 'dismiss'];
    
    // Additional permissions based on user status/role
    if (user.preferences?.isPremium) {
      basePermissions.push('bulk_operations', 'advanced_scheduling');
    }
    
    return basePermissions;
  }

  private getUserRole(user: User): UserRole {
    if (user.email?.includes('@admin')) return 'admin';
    if (user.preferences?.isPremium) return 'premium';
    return 'user';
  }

  private hasPermissionForAction(context: AccessControlContext, action: AlarmAction): boolean {
    const requiredPermission = this.getRequiredPermissionForAction(action);
    return context.permissions.includes(requiredPermission);
  }

  private getRequiredPermissionForAction(action: AlarmAction): string {
    const permissionMap: Record<AlarmAction, string> = {
      read: 'read',
      create: 'create',
      update: 'update',
      delete: 'delete',
      toggle: 'update',
      snooze: 'snooze',
      dismiss: 'dismiss'
    };
    return permissionMap[action];
  }

  private getMaxItemsForRole(role: UserRole, action: AlarmAction): number {
    const limits = {
      user: { read: 50, create: 10, update: 20, delete: 20 },
      premium: { read: 200, create: 50, update: 100, delete: 100 },
      admin: { read: 1000, create: 1000, update: 1000, delete: 1000 }
    };
    
    return limits[role][action as keyof typeof limits.user] || 10;
  }

  private checkUserRateLimit(userId: string, action: AlarmAction): boolean {
    const rateLimits: Record<AlarmAction, { requests: number; windowMs: number }> = {
      read: { requests: 100, windowMs: 60000 }, // 100 per minute
      create: { requests: 10, windowMs: 60000 }, // 10 per minute
      update: { requests: 20, windowMs: 60000 }, // 20 per minute
      delete: { requests: 10, windowMs: 60000 }, // 10 per minute
      toggle: { requests: 30, windowMs: 60000 }, // 30 per minute
      snooze: { requests: 50, windowMs: 60000 }, // 50 per minute
      dismiss: { requests: 50, windowMs: 60000 } // 50 per minute
    };

    const limit = rateLimits[action];
    const key = `${userId}:${action}`;
    
    return SecurityService.checkRateLimit(key, limit.requests, limit.windowMs);
  }

  private incrementSuspiciousActivity(userId: string): void {
    const count = this.suspiciousActivity.get(userId) || 0;
    this.suspiciousActivity.set(userId, count + 1);
    
    // Block user if too many suspicious activities
    if (count >= 5) {
      this.blockUser(userId, 'Multiple security violations', 60 * 60 * 1000); // 1 hour
    }
  }

  private isSessionValid(context: AccessControlContext): boolean {
    const maxAge = 8 * 60 * 60 * 1000; // 8 hours
    const age = new Date().getTime() - context.timestamp.getTime();
    return age < maxAge;
  }

  private cleanupExpiredSessions(): void {
    for (const [sessionId, context] of this.sessionCache.entries()) {
      if (!this.isSessionValid(context)) {
        this.sessionCache.delete(sessionId);
      }
    }
  }

  private logAccessEvent(
    event: string, 
    userId: string, 
    resource: string, 
    result: 'granted' | 'denied' | 'error',
    reason?: string
  ): void {
    const attempt: AccessAttempt = {
      userId,
      resource,
      action: event,
      result,
      reason,
      timestamp: new Date()
    };

    this.accessHistory.push(attempt);
    
    // Keep only last 1000 access attempts
    if (this.accessHistory.length > 1000) {
      this.accessHistory = this.accessHistory.slice(-1000);
    }

    console.log(`[ACCESS CONTROL] ${event}: ${result}`, attempt);
    
    // Emit security event
    window.dispatchEvent(new CustomEvent('alarm-access-event', {
      detail: attempt
    }));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.sessionCache.clear();
    this.accessHistory = [];
    this.blockedUsers.clear();
    this.suspiciousActivity.clear();
    console.log('[AlarmAccessControl] Service destroyed');
  }
}

export default AlarmAccessControl.getInstance();