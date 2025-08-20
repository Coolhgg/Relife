// Advanced Alarm Rate Limiting Service
// Provides comprehensive rate limiting specifically designed for alarm operations with adaptive controls

import { Preferences } from '@capacitor/preferences';
import SecurityService from './security';
import SecurityMonitoringForensicsService from './security-monitoring-forensics';
import { ErrorHandler } from './error-handler';

interface RateLimit {
  operation: AlarmOperation;
  limit: number;
  window: number; // in milliseconds
  burst: number; // max burst before applying strict limits
  recovery: number; // recovery time after limit exceeded
}

interface UserRateLimits {
  userId: string;
  tier: UserTier;
  customLimits?: Partial<Record<AlarmOperation, RateLimit>>;
  violations: number;
  lastViolation: Date | null;
  blocked: boolean;
  blockedUntil: Date | null;
  gracePeriodUntil: Date | null;
}

interface RateLimitEntry {
  userId: string;
  operation: AlarmOperation;
  timestamp: Date;
  ip?: string;
  metadata?: any;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  reason?: string;
  escalation?: EscalationLevel;
}

interface AdaptiveLimitAdjustment {
  operation: AlarmOperation;
  factor: number; // multiplier for base limit
  reason: string;
  expiresAt: Date;
}

type AlarmOperation =
  | 'create_alarm'
  | 'update_alarm'
  | 'delete_alarm'
  | 'snooze_alarm'
  | 'dismiss_alarm'
  | 'bulk_operations'
  | 'alarm_export'
  | 'alarm_import'
  | 'backup_create'
  | 'backup_restore'
  | 'security_test'
  | 'data_access';

type UserTier = 'free' | 'premium' | 'admin' | 'system';

type EscalationLevel = 'warning' | 'temporary_limit' | 'strict_limit' | 'account_block';

export class AlarmRateLimitingService {
  private static instance: AlarmRateLimitingService;
  private static readonly ENTRIES_KEY = 'rate_limit_entries';
  private static readonly USER_LIMITS_KEY = 'user_rate_limits';
  private static readonly ADAPTIVE_ADJUSTMENTS_KEY = 'adaptive_rate_adjustments';
  private static readonly CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private rateLimitEntries: Map<string, RateLimitEntry[]> = new Map();
  private userLimits: Map<string, UserRateLimits> = new Map();
  private adaptiveAdjustments: AdaptiveLimitAdjustment[] = [];
  private defaultLimits: Map<AlarmOperation, RateLimit>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // Base rate limits by operation
  private readonly BASE_LIMITS: Record<AlarmOperation, RateLimit> = {
    create_alarm: {
      operation: 'create_alarm',
      limit: 50,
      window: 60000,
      burst: 10,
      recovery: 300000,
    },
    update_alarm: {
      operation: 'update_alarm',
      limit: 100,
      window: 60000,
      burst: 20,
      recovery: 180000,
    },
    delete_alarm: {
      operation: 'delete_alarm',
      limit: 30,
      window: 60000,
      burst: 5,
      recovery: 300000,
    },
    snooze_alarm: {
      operation: 'snooze_alarm',
      limit: 200,
      window: 60000,
      burst: 50,
      recovery: 60000,
    },
    dismiss_alarm: {
      operation: 'dismiss_alarm',
      limit: 200,
      window: 60000,
      burst: 50,
      recovery: 60000,
    },
    bulk_operations: {
      operation: 'bulk_operations',
      limit: 10,
      window: 300000,
      burst: 2,
      recovery: 600000,
    },
    alarm_export: {
      operation: 'alarm_export',
      limit: 5,
      window: 300000,
      burst: 1,
      recovery: 600000,
    },
    alarm_import: {
      operation: 'alarm_import',
      limit: 5,
      window: 300000,
      burst: 1,
      recovery: 600000,
    },
    backup_create: {
      operation: 'backup_create',
      limit: 10,
      window: 3600000,
      burst: 2,
      recovery: 1800000,
    },
    backup_restore: {
      operation: 'backup_restore',
      limit: 3,
      window: 3600000,
      burst: 1,
      recovery: 3600000,
    },
    security_test: {
      operation: 'security_test',
      limit: 5,
      window: 300000,
      burst: 1,
      recovery: 300000,
    },
    data_access: {
      operation: 'data_access',
      limit: 1000,
      window: 60000,
      burst: 200,
      recovery: 60000,
    },
  };

  // Tier multipliers
  private readonly TIER_MULTIPLIERS: Record<UserTier, number> = {
    free: 1.0,
    premium: 2.0,
    admin: 5.0,
    system: 10.0,
  };

  private constructor() {
    this.initializeDefaultLimits();
    this.loadPersistedData();
    this.startCleanupTimer();
  }

  static getInstance(): AlarmRateLimitingService {
    if (!AlarmRateLimitingService.instance) {
      AlarmRateLimitingService.instance = new AlarmRateLimitingService();
    }
    return AlarmRateLimitingService.instance;
  }

  /**
   * Check if an alarm operation is allowed for a user
   */
  async checkRateLimit(
    userId: string,
    operation: AlarmOperation,
    ip?: string,
    metadata?: any
  ): Promise<RateLimitResult> {
    try {
      // Get user rate limits
      const userLimits = this.getUserLimits(userId);

      // Check if user is blocked
      if (
        userLimits.blocked &&
        userLimits.blockedUntil &&
        userLimits.blockedUntil > new Date()
      ) {
        await this.logRateLimitEvent('blocked_user_attempt', userId, operation, {
          ip,
          blockedUntil: userLimits.blockedUntil,
        });
        return {
          allowed: false,
          remaining: 0,
          resetTime: userLimits.blockedUntil,
          retryAfter: Math.ceil(
            (userLimits.blockedUntil.getTime() - Date.now()) / 1000
          ),
          reason: 'User is temporarily blocked due to rate limit violations',
          escalation: 'account_block',
        };
      }

      // Get effective rate limit for this operation
      const effectiveLimit = this.getEffectiveRateLimit(userId, operation);

      // Check current usage
      const currentUsage = this.getCurrentUsage(
        userId,
        operation,
        effectiveLimit.window
      );

      // Check burst limit first
      const burstUsage = this.getCurrentUsage(userId, operation, 10000); // Last 10 seconds for burst
      if (burstUsage >= effectiveLimit.burst) {
        await this.handleRateLimitViolation(userId, operation, 'burst_limit_exceeded', {
          currentUsage: burstUsage,
          limit: effectiveLimit.burst,
        });
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + effectiveLimit.recovery),
          reason: 'Burst limit exceeded',
          escalation: 'temporary_limit',
        };
      }

      // Check window limit
      if (currentUsage >= effectiveLimit.limit) {
        await this.handleRateLimitViolation(
          userId,
          operation,
          'window_limit_exceeded',
          { currentUsage, limit: effectiveLimit.limit }
        );
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + effectiveLimit.window),
          retryAfter: Math.ceil(effectiveLimit.window / 1000),
          reason: 'Rate limit exceeded for this operation',
          escalation: this.determineEscalationLevel(userId, operation),
        };
      }

      // Check grace period
      if (userLimits.gracePeriodUntil && userLimits.gracePeriodUntil > new Date()) {
        // Allow with warning during grace period
        await this.recordRateLimitEntry(userId, operation, ip, metadata);
        return {
          allowed: true,
          remaining: Math.max(0, effectiveLimit.limit - currentUsage - 1),
          resetTime: new Date(Date.now() + effectiveLimit.window),
          reason: 'Allowed during grace period',
        };
      }

      // Operation allowed
      await this.recordRateLimitEntry(userId, operation, ip, metadata);
      return {
        allowed: true,
        remaining: Math.max(0, effectiveLimit.limit - currentUsage - 1),
        resetTime: new Date(Date.now() + effectiveLimit.window),
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Rate limit check failed',
        { context: 'rate_limiting', metadata: { userId, operation, ip } }
      );

      // Fail open for system stability, but log the error
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000),
        reason: 'Rate limiting system error - defaulting to allow',
      };
    }
  }

  /**
   * Handle rate limit violations with escalation
   */
  private async handleRateLimitViolation(
    userId: string,
    operation: AlarmOperation,
    violationType: string,
    details: any
  ): Promise<void> {
    const userLimits = this.getUserLimits(userId);
    userLimits.violations++;
    userLimits.lastViolation = new Date();

    // Determine escalation
    const escalation = this.determineEscalationLevel(userId, operation);

    // Apply escalation
    switch (escalation) {
      case 'warning':
        // Just log the warning
        break;

      case 'temporary_limit':
        // Apply stricter limits temporarily
        await this.applyAdaptiveLimiting(
          userId,
          operation,
          0.5,
          'rate_limit_violation',
          15 * 60 * 1000
        );
        break;

      case 'strict_limit':
        // Apply very strict limits
        await this.applyAdaptiveLimiting(
          userId,
          operation,
          0.1,
          'repeated_violations',
          60 * 60 * 1000
        );
        break;

      case 'account_block':
        // Temporarily block user
        userLimits.blocked = true;
        userLimits.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour block
        break;
    }

    // Log security event
    await SecurityMonitoringForensicsService.logSecurityEvent(
      'rate_limit_exceeded',
      escalation === 'account_block' ? 'high' : 'medium',
      'alarm_rate_limiting',
      {
        userId,
        operation,
        violationType,
        escalation,
        violations: userLimits.violations,
        details,
      },
      userId
    );

    // Store updated user limits
    await this.persistUserLimits();

    // Emit event for UI
    window.dispatchEvent(
      new CustomEvent('rate-limit-violation', {
        detail: { userId, operation, escalation, violations: userLimits.violations },
      })
    );

    console.warn(
      `[AlarmRateLimit] Rate limit violation: ${userId} - ${operation} (${escalation})`
    );
  }

  /**
   * Apply adaptive rate limiting based on security events
   */
  async applyAdaptiveLimiting(
    userId: string,
    operation: AlarmOperation,
    factor: number,
    reason: string,
    duration: number
  ): Promise<void> {
    const adjustment: AdaptiveLimitAdjustment = {
      operation,
      factor,
      reason,
      expiresAt: new Date(Date.now() + duration),
    };

    // Remove existing adjustments for this operation
    this.adaptiveAdjustments = this.adaptiveAdjustments.filter(
      adj => adj.operation !== operation || adj.expiresAt <= new Date()
    );

    this.adaptiveAdjustments.push(adjustment);
    await this.persistAdaptiveAdjustments();

    console.log(
      `[AlarmRateLimit] Applied adaptive limiting: ${operation} factor=${factor} (${reason})`
    );
  }

  /**
   * Set user tier for rate limiting
   */
  async setUserTier(userId: string, tier: UserTier): Promise<void> {
    let userLimits = this.userLimits.get(userId);
    if (!userLimits) {
      userLimits = this.createDefaultUserLimits(userId, tier);
    } else {
      userLimits.tier = tier;
    }

    this.userLimits.set(userId, userLimits);
    await this.persistUserLimits();

    console.log(`[AlarmRateLimit] Updated user tier: ${userId} -> ${tier}`);
  }

  /**
   * Grant grace period to user (temporary relief from rate limits)
   */
  async grantGracePeriod(
    userId: string,
    duration: number,
    reason: string
  ): Promise<void> {
    const userLimits = this.getUserLimits(userId);
    userLimits.gracePeriodUntil = new Date(Date.now() + duration);

    await this.persistUserLimits();

    // Log the grace period grant
    await SecurityMonitoringForensicsService.logSecurityEvent(
      'rate_limit_exceeded', // Using existing type
      'low',
      'alarm_rate_limiting',
      {
        userId,
        action: 'grace_period_granted',
        duration,
        reason,
        gracePeriodUntil: userLimits.gracePeriodUntil,
      },
      userId
    );

    console.log(
      `[AlarmRateLimit] Granted grace period: ${userId} for ${duration}ms (${reason})`
    );
  }

  /**
   * Emergency bypass for critical situations
   */
  async emergencyBypass(
    userId: string,
    operation: AlarmOperation,
    reason: string
  ): Promise<string> {
    const bypassToken = SecurityService.generateCSRFToken();

    // Grant temporary high privileges
    await this.setUserTier(userId, 'system');
    await this.grantGracePeriod(userId, 10 * 60 * 1000, `Emergency bypass: ${reason}`); // 10 minutes

    // Log emergency bypass
    await SecurityMonitoringForensicsService.logSecurityEvent(
      'rate_limit_exceeded', // Using existing type
      'critical',
      'alarm_rate_limiting',
      {
        userId,
        operation,
        action: 'emergency_bypass',
        reason,
        bypassToken,
        emergency: true,
      },
      userId
    );

    console.warn(
      `[AlarmRateLimit] EMERGENCY BYPASS: ${userId} - ${operation} (${reason})`
    );
    return bypassToken;
  }

  /**
   * Get rate limiting statistics for monitoring
   */
  async getRateLimitingStats(): Promise<{
    totalUsers: number;
    blockedUsers: number;
    activeViolations: number;
    adaptiveAdjustments: number;
    operationStats: Record<string, { requests: number; violations: number }>;
    topViolators: Array<{ userId: string; violations: number; tier: UserTier }>;
  }> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Count blocked users
      const blockedUsers = Array.from(this.userLimits.values()).filter(
        user => user.blocked && user.blockedUntil && user.blockedUntil > now
      ).length;

      // Count recent violations
      const activeViolations = Array.from(this.userLimits.values()).filter(
        user => user.lastViolation && user.lastViolation > last24Hours
      ).length;

      // Count active adaptive adjustments
      const activeAdjustments = this.adaptiveAdjustments.filter(
        adj => adj.expiresAt > now
      ).length;

      // Calculate operation stats
      const operationStats: Record<string, { requests: number; violations: number }> =
        {};

      for (const [userId, entries] of this.rateLimitEntries) {
        const recentEntries = entries.filter(entry => entry.timestamp > last24Hours);

        for (const entry of recentEntries) {
          if (!operationStats[entry.operation]) {
            operationStats[entry.operation] = { requests: 0, violations: 0 };
          }
          operationStats[entry.operation].requests++;
        }
      }

      // Add violation counts
      for (const user of this.userLimits.values()) {
        if (user.lastViolation && user.lastViolation > last24Hours) {
          // This is an approximation - in a real system you'd track violations per operation
          Object.keys(operationStats).forEach(op => {
            operationStats[op].violations += user.violations;
          });
        }
      }

      // Get top violators
      const topViolators = Array.from(this.userLimits.values())
        .filter(user => user.violations > 0)
        .sort((a, b) => b.violations - a.violations)
        .slice(0, 10)
        .map(user => ({
          userId: user.userId,
          violations: user.violations,
          tier: user.tier,
        }));

      return {
        totalUsers: this.userLimits.size,
        blockedUsers,
        activeViolations,
        adaptiveAdjustments: activeAdjustments,
        operationStats,
        topViolators,
      };
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to get stats:', error);
      return {
        totalUsers: 0,
        blockedUsers: 0,
        activeViolations: 0,
        adaptiveAdjustments: 0,
        operationStats: {},
        topViolators: [],
      };
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(userId: string, adminReason: string): Promise<void> {
    const userLimits = this.getUserLimits(userId);

    userLimits.violations = 0;
    userLimits.lastViolation = null;
    userLimits.blocked = false;
    userLimits.blockedUntil = null;
    userLimits.gracePeriodUntil = null;

    // Clear rate limit entries for this user
    this.rateLimitEntries.delete(userId);

    await this.persistUserLimits();
    await this.persistRateLimitEntries();

    // Log admin action
    await SecurityMonitoringForensicsService.logSecurityEvent(
      'rate_limit_exceeded', // Using existing type
      'medium',
      'alarm_rate_limiting',
      {
        userId,
        action: 'admin_reset',
        adminReason,
        resetBy: 'admin',
      },
      userId
    );

    console.log(`[AlarmRateLimit] Admin reset for user: ${userId} (${adminReason})`);
  }

  // Private helper methods

  private initializeDefaultLimits(): void {
    this.defaultLimits = new Map();
    Object.values(this.BASE_LIMITS).forEach(limit => {
      this.defaultLimits.set(limit.operation, { ...limit });
    });
  }

  private getUserLimits(userId: string): UserRateLimits {
    let userLimits = this.userLimits.get(userId);
    if (!userLimits) {
      userLimits = this.createDefaultUserLimits(userId, 'free');
      this.userLimits.set(userId, userLimits);
    }
    return userLimits;
  }

  private createDefaultUserLimits(userId: string, tier: UserTier): UserRateLimits {
    return {
      userId,
      tier,
      violations: 0,
      lastViolation: null,
      blocked: false,
      blockedUntil: null,
      gracePeriodUntil: null,
    };
  }

  private getEffectiveRateLimit(userId: string, operation: AlarmOperation): RateLimit {
    const userLimits = this.getUserLimits(userId);
    const baseLimit = this.BASE_LIMITS[operation];
    const tierMultiplier = this.TIER_MULTIPLIERS[userLimits.tier];

    // Check for custom user limits
    const customLimit = userLimits.customLimits?.[operation];
    if (customLimit) {
      return { ...customLimit };
    }

    // Apply tier multiplier
    const effectiveLimit = {
      ...baseLimit,
      limit: Math.floor(baseLimit.limit * tierMultiplier),
      burst: Math.floor(baseLimit.burst * tierMultiplier),
    };

    // Apply adaptive adjustments
    const activeAdjustment = this.adaptiveAdjustments.find(
      adj => adj.operation === operation && adj.expiresAt > new Date()
    );

    if (activeAdjustment) {
      effectiveLimit.limit = Math.floor(effectiveLimit.limit * activeAdjustment.factor);
      effectiveLimit.burst = Math.floor(effectiveLimit.burst * activeAdjustment.factor);
    }

    return effectiveLimit;
  }

  private getCurrentUsage(
    userId: string,
    operation: AlarmOperation,
    window: number
  ): number {
    const entries = this.rateLimitEntries.get(userId) || [];
    const cutoff = new Date(Date.now() - window);

    return entries.filter(
      entry => entry.operation === operation && entry.timestamp > cutoff
    ).length;
  }

  private async recordRateLimitEntry(
    userId: string,
    operation: AlarmOperation,
    ip?: string,
    metadata?: any
  ): Promise<void> {
    const entry: RateLimitEntry = {
      userId,
      operation,
      timestamp: new Date(),
      ip,
      metadata,
    };

    if (!this.rateLimitEntries.has(userId)) {
      this.rateLimitEntries.set(userId, []);
    }

    const userEntries = this.rateLimitEntries.get(userId)!;
    userEntries.unshift(entry);

    // Keep only recent entries (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.rateLimitEntries.set(
      userId,
      userEntries.filter(e => e.timestamp > cutoff)
    );

    // Persist periodically (not on every request for performance)
    if (Math.random() < 0.1) {
      // 10% chance to persist
      await this.persistRateLimitEntries();
    }
  }

  private determineEscalationLevel(
    userId: string,
    operation: AlarmOperation
  ): EscalationLevel {
    const userLimits = this.getUserLimits(userId);

    if (userLimits.violations === 0) {
      return 'warning';
    } else if (userLimits.violations < 5) {
      return 'temporary_limit';
    } else if (userLimits.violations < 15) {
      return 'strict_limit';
    } else {
      return 'account_block';
    }
  }

  private async logRateLimitEvent(
    event: string,
    userId: string,
    operation: AlarmOperation,
    details: any
  ): Promise<void> {
    console.log(`[AlarmRateLimit] Event: ${event}`, { userId, operation, details });
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      await this.cleanupExpiredData();
    }, AlarmRateLimitingService.CLEANUP_INTERVAL);

    console.log('[AlarmRateLimit] Started cleanup timer');
  }

  private async cleanupExpiredData(): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {
      // Clean up old entries
      for (const [userId, entries] of this.rateLimitEntries) {
        const recentEntries = entries.filter(entry => entry.timestamp > cutoff);
        if (recentEntries.length !== entries.length) {
          this.rateLimitEntries.set(userId, recentEntries);
        }
      }

      // Clean up expired adaptive adjustments
      this.adaptiveAdjustments = this.adaptiveAdjustments.filter(
        adj => adj.expiresAt > now
      );

      // Unblock expired blocks
      for (const userLimits of this.userLimits.values()) {
        if (
          userLimits.blocked &&
          userLimits.blockedUntil &&
          userLimits.blockedUntil <= now
        ) {
          userLimits.blocked = false;
          userLimits.blockedUntil = null;
        }

        if (userLimits.gracePeriodUntil && userLimits.gracePeriodUntil <= now) {
          userLimits.gracePeriodUntil = null;
        }
      }

      // Persist cleanup results
      await this.persistUserLimits();
      await this.persistAdaptiveAdjustments();
    } catch (error) {
      console.error('[AlarmRateLimit] Cleanup failed:', error);
    }
  }

  // Persistence methods
  private async loadPersistedData(): Promise<void> {
    try {
      await Promise.all([
        this.loadRateLimitEntries(),
        this.loadUserLimits(),
        this.loadAdaptiveAdjustments(),
      ]);
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to load persisted data:', error);
    }
  }

  private async loadRateLimitEntries(): Promise<void> {
    try {
      const { value } = await Preferences.get({
        key: AlarmRateLimitingService.ENTRIES_KEY,
      });
      if (value) {
        const data = SecurityService.decryptData(value);
        this.rateLimitEntries = new Map(
          Object.entries(data).map(([userId, entries]: [string, any[]]) => [
            userId,
            entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) })),
          ])
        );
      }
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to load rate limit entries:', error);
    }
  }

  private async loadUserLimits(): Promise<void> {
    try {
      const { value } = await Preferences.get({
        key: AlarmRateLimitingService.USER_LIMITS_KEY,
      });
      if (value) {
        const data = SecurityService.decryptData(value);
        this.userLimits = new Map(
          data.map((user: any) => [
            user.userId,
            {
              ...user,
              lastViolation: user.lastViolation ? new Date(user.lastViolation) : null,
              blockedUntil: user.blockedUntil ? new Date(user.blockedUntil) : null,
              gracePeriodUntil: user.gracePeriodUntil
                ? new Date(user.gracePeriodUntil)
                : null,
            },
          ])
        );
      }
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to load user limits:', error);
    }
  }

  private async loadAdaptiveAdjustments(): Promise<void> {
    try {
      const { value } = await Preferences.get({
        key: AlarmRateLimitingService.ADAPTIVE_ADJUSTMENTS_KEY,
      });
      if (value) {
        const data = SecurityService.decryptData(value);
        this.adaptiveAdjustments = data.map((adj: any) => ({
          ...adj,
          expiresAt: new Date(adj.expiresAt),
        }));
      }
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to load adaptive adjustments:', error);
    }
  }

  private async persistRateLimitEntries(): Promise<void> {
    try {
      const data = Object.fromEntries(this.rateLimitEntries);
      await Preferences.set({
        key: AlarmRateLimitingService.ENTRIES_KEY,
        value: SecurityService.encryptData(data),
      });
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to persist rate limit entries:', error);
    }
  }

  private async persistUserLimits(): Promise<void> {
    try {
      const data = Array.from(this.userLimits.values());
      await Preferences.set({
        key: AlarmRateLimitingService.USER_LIMITS_KEY,
        value: SecurityService.encryptData(data),
      });
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to persist user limits:', error);
    }
  }

  private async persistAdaptiveAdjustments(): Promise<void> {
    try {
      await Preferences.set({
        key: AlarmRateLimitingService.ADAPTIVE_ADJUSTMENTS_KEY,
        value: SecurityService.encryptData(this.adaptiveAdjustments),
      });
    } catch (error) {
      console.error('[AlarmRateLimit] Failed to persist adaptive adjustments:', error);
    }
  }

  /**
   * Get rate limit status for a user and operation
   */
  async getRateLimitStatus(
    userId: string,
    operation: AlarmOperation
  ): Promise<{
    limit: number;
    remaining: number;
    resetTime: Date;
    tier: UserTier;
    violations: number;
    blocked: boolean;
    gracePeriod: boolean;
  }> {
    const userLimits = this.getUserLimits(userId);
    const effectiveLimit = this.getEffectiveRateLimit(userId, operation);
    const currentUsage = this.getCurrentUsage(userId, operation, effectiveLimit.window);

    return {
      limit: effectiveLimit.limit,
      remaining: Math.max(0, effectiveLimit.limit - currentUsage),
      resetTime: new Date(Date.now() + effectiveLimit.window),
      tier: userLimits.tier,
      violations: userLimits.violations,
      blocked: userLimits.blocked,
      gracePeriod: !!(
        userLimits.gracePeriodUntil && userLimits.gracePeriodUntil > new Date()
      ),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.rateLimitEntries.clear();
    this.userLimits.clear();
    this.adaptiveAdjustments = [];
    console.log('[AlarmRateLimit] Service destroyed');
  }
}

export default AlarmRateLimitingService.getInstance();
