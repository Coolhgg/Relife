/**
 * AI Parameters Security Configuration Service
 * Centralized security management for AI parameter API
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface SecurityMetrics {
  authenticationAttempts: number;
  successfulAuthentications: number;
  failedAuthentications: number;
  rateLimitHits: number;
  securityViolations: number;
  activeSessions: number;
  lastSecurityIncident?: Date;
}

export interface UserPermissions {
  userId: string;
  role: 'admin' | 'user' | 'developer' | 'readonly';
  permissions: string[];
  rateLimitOverride?: number;
  securityLevel: 'standard' | 'enhanced' | 'maximum';
}

export class AIParametersSecurityService {
  private static instance: AIParametersSecurityService;
  private securityMetrics: SecurityMetrics;
  private userPermissions: Map<string, UserPermissions> = new Map();
  private activeApiKeys: Map<string, any> = new Map();
  private blockedIPs: Set<string> = new Set();

  private constructor() {
    this.initializeSecurityMetrics();
    this.initializeDefaultPermissions();
    this.startSecurityMonitoring();
  }

  static getInstance(): AIParametersSecurityService {
    if (!AIParametersSecurityService.instance) {
      AIParametersSecurityService.instance = new AIParametersSecurityService();
    }
    return AIParametersSecurityService.instance;
  }

  private initializeSecurityMetrics(): void {
    this.securityMetrics = {
      authenticationAttempts: 0,
      successfulAuthentications: 0,
      failedAuthentications: 0,
      rateLimitHits: 0,
      securityViolations: 0,
      activeSessions: 0
    };
  }

  private initializeDefaultPermissions(): void {
    // Default permission sets
    const adminPermissions = [
      'session_create', 'session_read', 'session_delete',
      'parameter_read', 'parameter_write', 'parameter_validate',
      'parameter_export', 'parameter_import', 'parameter_batch_write',
      'parameter_rollback', 'metrics_read', 'audit_read',
      'security_read', 'security_write', 'bypass_rate_limit'
    ];

    const userPermissions = [
      'session_create', 'session_read', 'session_delete',
      'parameter_read', 'parameter_write', 'parameter_validate',
      'parameter_export', 'metrics_read'
    ];

    const developerPermissions = [
      ...userPermissions,
      'parameter_import', 'parameter_batch_write',
      'audit_read', 'security_read'
    ];

    const readonlyPermissions = [
      'session_read', 'parameter_read', 'metrics_read'
    ];

    // Set default permissions for common roles
    this.setUserPermissions('admin-default', {
      userId: 'admin-default',
      role: 'admin',
      permissions: adminPermissions,
      securityLevel: 'maximum'
    });

    this.setUserPermissions('user-default', {
      userId: 'user-default',
      role: 'user',
      permissions: userPermissions,
      securityLevel: 'standard'
    });

    this.setUserPermissions('developer-default', {
      userId: 'developer-default',
      role: 'developer',
      permissions: developerPermissions,
      securityLevel: 'enhanced'
    });
  }

  private startSecurityMonitoring(): void {
    // Reset metrics every hour
    setInterval(() => {
      this.securityMetrics = {
        ...this.securityMetrics,
        authenticationAttempts: 0,
        successfulAuthentications: 0,
        failedAuthentications: 0,
        rateLimitHits: 0,
        securityViolations: 0
      };
    }, 60 * 60 * 1000);
  }

  // Permission management
  setUserPermissions(userId: string, permissions: UserPermissions): void {
    this.userPermissions.set(userId, permissions);
  }

  getUserPermissions(userId: string): UserPermissions | null {
    // Return user-specific permissions or default for role
    const userPerms = this.userPermissions.get(userId);
    if (userPerms) return userPerms;

    // Return default permissions (in production, fetch from database)
    return this.userPermissions.get('user-default');
  }

  // API Key management
  generateAPIKey(name: string, permissions: string[], expiresIn = '1y'): string {
    const keyId = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString('hex');
    const apiKey = `ak_${keyId}_${secret}`;

    this.activeApiKeys.set(apiKey, {
      id: keyId,
      name,
      permissions,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.parseExpiration(expiresIn)),
      lastUsed: null,
      usageCount: 0
    });

    return apiKey;
  }

  validateAPIKey(apiKey: string): boolean {
    const keyData = this.activeApiKeys.get(apiKey);
    if (!keyData) return false;

    // Check expiration
    if (keyData.expiresAt < new Date()) {
      this.activeApiKeys.delete(apiKey);
      return false;
    }

    // Update usage
    keyData.lastUsed = new Date();
    keyData.usageCount++;

    return true;
  }

  revokeAPIKey(apiKey: string): boolean {
    return this.activeApiKeys.delete(apiKey);
  }

  // Security monitoring
  recordAuthenticationAttempt(success: boolean, userId?: string): void {
    this.securityMetrics.authenticationAttempts++;
    
    if (success) {
      this.securityMetrics.successfulAuthentications++;
    } else {
      this.securityMetrics.failedAuthentications++;
      
      // Track potential security threats
      if (this.securityMetrics.failedAuthentications > 10) {
        this.securityMetrics.lastSecurityIncident = new Date();
      }
    }
  }

  recordRateLimitHit(ip: string): void {
    this.securityMetrics.rateLimitHits++;
    
    // Block IP after excessive rate limit hits
    const recentHits = this.securityMetrics.rateLimitHits;
    if (recentHits > 50) {
      this.blockIP(ip, 60 * 60 * 1000); // Block for 1 hour
    }
  }

  recordSecurityViolation(type: string, details: any): void {
    this.securityMetrics.securityViolations++;
    this.securityMetrics.lastSecurityIncident = new Date();
    
    console.warn('[SECURITY VIOLATION]', { type, details, timestamp: new Date() });
  }

  // IP blocking
  blockIP(ip: string, duration: number): void {
    this.blockedIPs.add(ip);
    
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Security metrics
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  // Utility methods
  private parseExpiration(expiration: string): number {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000
    };

    const match = expiration.match(/^(\d+)([smhdwy])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }

  // Generate JWT tokens
  generateJWT(userId: string, role: string, permissions: string[]): string {
    const payload = {
      userId,
      role,
      permissions,
      sessionId: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'ai-params-secret-key');
  }

  // Security configuration methods
  updateSecurityConfig(config: Partial<any>): void {
    // Update security configuration (rate limits, timeouts, etc.)
    console.log('[Security] Configuration updated:', config);
  }

  getSecurityStatus(): any {
    return {
      authentication: 'active',
      rateLimiting: 'active',
      auditLogging: 'active',
      csrfProtection: 'active',
      securityHeaders: 'active',
      activeUsers: this.userPermissions.size,
      activeAPIKeys: this.activeApiKeys.size,
      blockedIPs: this.blockedIPs.size,
      metrics: this.securityMetrics,
      lastCheck: new Date().toISOString()
    };
  }
}

export default AIParametersSecurityService;