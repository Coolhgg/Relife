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

  async createSession(
    userId: string,
    requestInfo?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<SessionInfo> {
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
    return Array.from(this.sessions.values()).filter(
      session => session.userId === userId && session.isActive
    );
  }
}

export default SessionSecurityService.getInstance();
