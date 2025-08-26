// Enhanced Session Security Service
import SecurityService from './security';
import AnalyticsService from './analytics';

export interface SessionInfo {
  id: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  isSuspicious: boolean;
  riskScore: number;
  csrfToken: string;
  refreshCount: number;
}

class SessionSecurityService {
  private static instance: SessionSecurityService;
  private sessions: Map<string, SessionInfo> = new Map();
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  private readonly MAX_SESSIONS_PER_USER = 3;
  
  static getInstance(): SessionSecurityService {
    if (!SessionSecurityService.instance) {
      SessionSecurityService.instance = new SessionSecurityService();
    }
    return SessionSecurityService.instance;
  }

  async createSession(userId: string, requestInfo?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SessionInfo> {
    const sessionId = this.generateSecureSessionId();
    const deviceFingerprint = await this.generateDeviceFingerprint(
      requestInfo?.userAgent || navigator.userAgent
    );

    const session: SessionInfo = {
      id: sessionId,
      userId,
      deviceFingerprint,
      ipAddress: requestInfo?.ipAddress || 'unknown',
      userAgent: requestInfo?.userAgent || navigator.userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT_MS),
      isActive: true,
      isSuspicious: false,
      riskScore: this.calculateRiskScore(requestInfo?.userAgent || ''),
      csrfToken: SecurityService.generateCSRFToken(),
      refreshCount: 0,
    };

    this.enforceSessionLimits(userId);
    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId: string): { isValid: boolean; session?: SessionInfo } {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return { isValid: false };
    }
    
    session.lastActivity = new Date();
    return { isValid: true, session };
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
    }
  }

  private generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(random, b => b.toString(36)).join('');
    return `sess_${timestamp}_${randomString}`;
  }

  private async generateDeviceFingerprint(userAgent: string): Promise<string> {
    const components = [
      userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
    ];
    
    const fingerprint = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(components.join('|'))
    );
    
    return Array.from(new Uint8Array(fingerprint))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private calculateRiskScore(userAgent: string): number {
    let score = 0;
    if (/curl|wget|python|bot/i.test(userAgent)) score += 50;
    if (/headless|phantom|selenium/i.test(userAgent)) score += 40;
    return score;
  }

  private enforceSessionLimits(userId: string): void {
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive)
      .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());

    while (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      const oldestSession = userSessions.shift();
      if (oldestSession) {
        this.terminateSession(oldestSession.id);
      }
    }
  }

  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive);
  }
}

export default SessionSecurityService.getInstance();ror)),
        'Failed to create secure session',
        { context: 'session_creation', userId }
      );
      throw error;
    }
  }

  /**
   * Validate and update session
   */
  async validateSession(sessionId: string): Promise<{
    isValid: boolean;
    session?: SessionInfo;
    action: 'allow' | 'refresh' | 'terminate' | 'challenge';
    reason?: string;
  }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        isValid: false,
        action: 'terminate',
        reason: 'Session not found',
      };
    }

    const now = new Date();

    // Check if session has expired
    if (now > session.expiresAt || !session.isActive) {
      await this.terminateSession(sessionId, 'expired');
      return {
        isValid: false,
        action: 'terminate',
        reason: 'Session expired',
      };
    }

    // Check for inactivity
    const inactiveTime = now.getTime() - session.lastActivity.getTime();
    if (inactiveTime > this.INACTIVITY_TIMEOUT_MS) {
      await this.terminateSession(sessionId, 'inactive');
      return {
        isValid: false,
        action: 'terminate',
        reason: 'Session inactive',
      };
    }

    // Check for suspicious activity
    if (session.isSuspicious || session.riskScore > 80) {
      return {
        isValid: false,
        session,
        action: 'challenge',
        reason: 'Suspicious activity detected',
      };
    }

    // Update session activity
    session.lastActivity = now;
    session.activityCount++;

    // Check if session needs refresh
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const shouldRefresh = sessionAge > this.SESSION_TIMEOUT_MS * 0.8; // Refresh at 80% of timeout

    if (shouldRefresh && session.refreshCount < session.maxRefreshes) {
      return {
        isValid: true,
        session,
        action: 'refresh',
      };
    }

    return {
      isValid: true,
      session,
      action: 'allow',
    };
  }

  /**
   * Refresh session with security checks
   */
  async refreshSession(sessionId: string): Promise<{
    success: boolean;
    newSession?: SessionInfo;
    error?: string;
  }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.refreshCount >= session.maxRefreshes) {
      await this.terminateSession(sessionId, 'max_refreshes');
      return { success: false, error: 'Maximum refreshes exceeded' };
    }

    // Create refreshed session
    const refreshedSession: SessionInfo = {
      ...session,
      expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT_MS),
      lastActivity: new Date(),
      csrfToken: SecurityService.generateCSRFToken(),
      refreshCount: session.refreshCount + 1,
    };

    // Re-analyze security
    await this.analyzeSessionSecurity(refreshedSession);

    this.sessions.set(sessionId, refreshedSession);
    this.persistSession(refreshedSession);

    this.analytics.trackEvent('session_refreshed', {
      sessionId,
      userId: session.userId,
      refreshCount: refreshedSession.refreshCount,
    });

    return { success: true, newSession: refreshedSession };
  }

  /**
   * Terminate session with security logging
   */
  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.isActive = false;

      await this.logSecurityEvent({
        type: 'logout',
        timestamp: new Date(),
        sessionId,
        userId: session.userId,
        details: { reason, activityCount: session.activityCount },
        riskLevel: 'low',
        action: 'allow',
      });

      this.sessions.delete(sessionId);
      this.removePersistedSession(sessionId);
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId: string, except?: string): Promise<number> {
    let terminated = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId && sessionId !== except) {
        await this.terminateSession(sessionId, 'user_logout_all');
        terminated++;
      }
    }

    return terminated;
  }

  /**
   * Get active sessions for a user
   */
  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Detect suspicious activity
   */
  private async analyzeSessionSecurity(session: SessionInfo): Promise<void> {
    let riskScore = 0;
    const suspiciousFactors: string[] = [];

    // Check for unusual user agent
    if (this.isUnusualUserAgent(session.userAgent)) {
      riskScore += 20;
      suspiciousFactors.push('unusual_user_agent');
    }

    // Check for concurrent sessions from different locations
    const userSessions = this.getUserSessions(session.userId);
    if (userSessions.length > 1) {
      const locationDistance = this.calculateLocationDistance(session, userSessions[0]);
      if (locationDistance > this.SUSPICIOUS_LOCATION_THRESHOLD) {
        riskScore += 30;
        suspiciousFactors.push('suspicious_location');
      }
    }

    // Check for high activity rate
    if (session.activityCount > this.HIGH_ACTIVITY_THRESHOLD) {
      riskScore += 25;
      suspiciousFactors.push('high_activity');
    }

    // Check for device fingerprint mismatch
    const existingSession = userSessions.find(s => s.deviceFingerprint !== session.deviceFingerprint);
    if (existingSession) {
      riskScore += 15;
      suspiciousFactors.push('device_mismatch');
    }

    session.riskScore = riskScore;
    session.isSuspicious = riskScore > 50;

    if (session.isSuspicious) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: new Date(),
        sessionId: session.id,
        userId: session.userId,
        details: {
          riskScore,
          factors: suspiciousFactors,
          session: {
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            location: session.location,
          },
        },
        riskLevel: riskScore > 80 ? 'critical' : 'high',
        action: riskScore > 80 ? 'block' : 'monitor',
      });
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
    return `sess_${timestamp}_${randomString}`;
  }

  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(userAgent: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const components = [
      userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      canvas.toDataURL(),
    ];

    const fingerprint = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(components.join('|'))
    );

    return Array.from(new Uint8Array(fingerprint))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Check for unusual user agent patterns
   */
  private isUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl|wget|python|ruby|perl|bot|crawler/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
      /automated/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Calculate distance between session locations
   */
  private calculateLocationDistance(session1: SessionInfo, session2: SessionInfo): number {
    // Simplified distance calculation - in real implementation, use proper geolocation
    if (!session1.location || !session2.location) return 0;
    
    // Return a mock distance for demonstration
    return session1.location.country !== session2.location.country ? 2000 : 100;
  }

  /**
   * Enforce session limits per user
   */
  private async enforceSessionLimits(userId: string): Promise<void> {
    const userSessions = this.getUserSessions(userId);

    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Terminate oldest session
      const oldestSession = userSessions[userSessions.length - 1];
      await this.terminateSession(oldestSession.id, 'session_limit');

      await this.logSecurityEvent({
        type: 'concurrent_session',
        timestamp: new Date(),
        sessionId: oldestSession.id,
        userId,
        details: { 
          activeSessionsCount: userSessions.length,
          limit: this.MAX_SESSIONS_PER_USER,
        },
        riskLevel: 'medium',
        action: 'allow',
      });
    }
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.performSecurityScan();
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Perform periodic security scan
   */
  private performSecurityScan(): void {
    const now = new Date();
    let expiredSessions = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        this.terminateSession(sessionId, 'expired_scan');
        expiredSessions++;
      }
    }

    if (expiredSessions > 0) {
      this.analytics.trackEvent('session_cleanup', {
        expiredSessions,
        totalSessions: this.sessions.size,
      });
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    this.securityEvents.push(event);
    
    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Persist critical events
    if (event.riskLevel === 'critical' || event.riskLevel === 'high') {
      SecurityService.secureStorageSet(
        `security_event_${event.timestamp.getTime()}`,
        event
      );
    }

    // Track in analytics
    this.analytics.trackEvent('security_event', {
      type: event.type,
      riskLevel: event.riskLevel,
      action: event.action,
      userId: event.userId,
    });
  }

  /**
   * Get recent security events
   */
  getSecurityEvents(userId?: string, limit = 50): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (userId) {
      events = events.filter(event => event.userId === userId);
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Persist session data
   */
  private persistSession(session: SessionInfo): void {
    try {
      SecurityService.secureStorageSet(`session_${session.id}`, {
        ...session,
        // Don't persist sensitive data in full
        csrfToken: session.csrfToken.substring(0, 8) + '...',
      });
    } catch (error) {
      console.warn('Failed to persist session:', error);
    }
  }

  /**
   * Load persisted sessions
   */
  private loadPersistedSessions(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('session_') && key.includes('saa_')) {
          try {
            const sessionData = SecurityService.secureStorageGet(key.replace('saa_', ''));
            if (sessionData && sessionData.expiresAt && new Date() < new Date(sessionData.expiresAt)) {
              // Session is still valid, restore it
              const session: SessionInfo = {
                ...sessionData,
                createdAt: new Date(sessionData.createdAt),
                lastActivity: new Date(sessionData.lastActivity),
                expiresAt: new Date(sessionData.expiresAt),
                csrfToken: SecurityService.generateCSRFToken(), // Generate new CSRF token
              };
              this.sessions.set(session.id, session);
            }
          } catch (error) {
            // Clean up corrupted session data
            SecurityService.secureStorageRemove(key.replace('saa_', ''));
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load persisted sessions:', error);
    }
  }

  /**
   * Remove persisted session
   */
  private removePersistedSession(sessionId: string): void {
    try {
      SecurityService.secureStorageRemove(`session_${sessionId}`);
    } catch (error) {
      console.warn('Failed to remove persisted session:', error);
    }
  }

  /**
   * Cleanup on service shutdown
   */
  destroy(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    // Terminate all sessions
    for (const sessionId of this.sessions.keys()) {
      this.terminateSession(sessionId, 'service_shutdown');
    }
  }
}

export default SessionSecurityService.getInstance();