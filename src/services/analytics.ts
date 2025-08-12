/**
 * Analytics Service
 * Comprehensive user behavior tracking and feature usage analytics
 */

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  interactions: number;
  device: {
    userAgent: string;
    screen: { width: number; height: number };
    viewport: { width: number; height: number };
    language: string;
    timezone: string;
  };
}

interface AnalyticsEvent {
  eventType: 'pageview' | 'interaction' | 'feature_use' | 'alarm_action' | 'error' | 'performance';
  timestamp: number;
  sessionId: string;
  data: Record<string, any>;
  userId?: string;
}

interface FeatureUsage {
  feature: string;
  count: number;
  firstUsed: number;
  lastUsed: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface UserBehavior {
  totalSessions: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  mostUsedFeatures: FeatureUsage[];
  alarmPatterns: {
    totalAlarms: number;
    averageAlarmsPerDay: number;
    mostCommonTime: string;
    dismissRate: number;
    snoozeRate: number;
  };
  navigationPatterns: {
    mostVisitedPages: Array<{ page: string; visits: number }>;
    averagePageDuration: number;
    bounceRate: number;
  };
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private currentSession: UserSession | null = null;
  private events: AnalyticsEvent[] = [];
  private featureUsage: Map<string, FeatureUsage> = new Map();
  private isEnabled: boolean = true;
  private config = {
    maxEvents: 1000,
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  };

  private constructor() {
    this.loadStoredData();
    this.setupAutoFlush();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  initialize(userId?: string): void {
    try {
      this.startSession(userId);
      this.trackPageView(window.location.pathname);
      this.setupActivityTracking();
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Start a new user session
   */
  private startSession(userId?: string): void {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.currentSession = {
      sessionId,
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      interactions: 0,
      device: this.getDeviceInfo(),
    };

    this.trackEvent('session_start', {
      sessionId,
      userId,
      device: this.currentSession.device,
    });
  }

  /**
   * Track page views
   */
  trackPageView(page: string, title?: string): void {
    if (!this.isEnabled || !this.currentSession) return;

    this.currentSession.pageViews++;
    this.currentSession.lastActivity = Date.now();

    this.trackEvent('pageview', {
      page,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(type: string, target: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled || !this.currentSession) return;

    this.currentSession.interactions++;
    this.currentSession.lastActivity = Date.now();

    this.trackEvent('interaction', {
      type,
      target,
      ...metadata,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, duration?: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const now = Date.now();
    const existing = this.featureUsage.get(feature);

    if (existing) {
      existing.count++;
      existing.lastUsed = now;
      if (duration) existing.duration = (existing.duration || 0) + duration;
      if (metadata) existing.metadata = { ...existing.metadata, ...metadata };
    } else {
      this.featureUsage.set(feature, {
        feature,
        count: 1,
        firstUsed: now,
        lastUsed: now,
        duration,
        metadata,
      });
    }

    this.trackEvent('feature_use', {
      feature,
      duration,
      count: this.featureUsage.get(feature)?.count,
      ...metadata,
    });
  }

  /**
   * Track alarm-specific actions
   */
  trackAlarmAction(action: string, alarmId?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.trackEvent('alarm_action', {
      action,
      alarmId,
      timestamp: Date.now(),
      ...metadata,
    });

    // Also track as feature usage
    this.trackFeatureUsage(`alarm_${action}`, undefined, metadata);
  }

  /**
   * Track errors for analytics
   */
  trackError(error: Error, context?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetric(metric: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.trackEvent('performance', {
      metric,
      value,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Get user behavior analytics
   */
  getUserBehavior(): UserBehavior {
    const sessions = this.getStoredSessions();
    const events = this.getStoredEvents();

    const totalSessions = sessions.length;
    const totalTimeSpent = sessions.reduce((total, session) => {
      return total + (session.lastActivity - session.startTime);
    }, 0);

    const alarmEvents = events.filter(e => e.eventType === 'alarm_action');
    const pageViewEvents = events.filter(e => e.eventType === 'pageview');

    return {
      totalSessions,
      totalTimeSpent,
      averageSessionDuration: totalSessions > 0 ? totalTimeSpent / totalSessions : 0,
      mostUsedFeatures: this.getMostUsedFeatures(),
      alarmPatterns: this.getAlarmPatterns(alarmEvents),
      navigationPatterns: this.getNavigationPatterns(pageViewEvents),
    };
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    currentSession: UserSession | null;
    totalEvents: number;
    featuresUsed: number;
    behavior: UserBehavior;
  } {
    return {
      currentSession: this.currentSession,
      totalEvents: this.events.length + this.getStoredEvents().length,
      featuresUsed: this.featureUsage.size,
      behavior: this.getUserBehavior(),
    };
  }

  /**
   * Export analytics data
   */
  exportData(): {
    sessions: UserSession[];
    events: AnalyticsEvent[];
    featureUsage: FeatureUsage[];
    behavior: UserBehavior;
  } {
    return {
      sessions: this.getStoredSessions(),
      events: [...this.events, ...this.getStoredEvents()],
      featureUsage: Array.from(this.featureUsage.values()),
      behavior: this.getUserBehavior(),
    };
  }

  /**
   * Clear analytics data
   */
  clearData(): void {
    this.events = [];
    this.featureUsage.clear();
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_sessions');
    localStorage.removeItem('analytics_features');
    console.log('Analytics data cleared');
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.endSession();
    }
  }

  /**
   * End current session
   */
  endSession(): void {
    if (!this.currentSession) return;

    this.trackEvent('session_end', {
      sessionId: this.currentSession.sessionId,
      duration: Date.now() - this.currentSession.startTime,
      pageViews: this.currentSession.pageViews,
      interactions: this.currentSession.interactions,
    });

    this.saveSession(this.currentSession);
    this.currentSession = null;
    this.flush();
  }

  // Private methods

  private trackEvent(eventType: AnalyticsEvent['eventType'], data: Record<string, any>): void {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId || 'no-session',
      data,
    };

    this.events.push(event);

    if (this.events.length >= this.config.maxEvents) {
      this.flush();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private setupActivityTracking(): void {
    // Track user activity to extend session
    const activityEvents = ['click', 'scroll', 'keydown', 'mousemove'];
    
    const updateActivity = () => {
      if (this.currentSession) {
        this.currentSession.lastActivity = Date.now();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for session timeout
    setInterval(() => {
      if (this.currentSession) {
        const timeSinceActivity = Date.now() - this.currentSession.lastActivity;
        if (timeSinceActivity > this.config.sessionTimeout) {
          this.endSession();
        }
      }
    }, 60000); // Check every minute
  }

  private setupAutoFlush(): void {
    setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private flush(): void {
    if (this.events.length === 0) return;

    try {
      // Save to local storage
      const stored = this.getStoredEvents();
      const combined = [...stored, ...this.events];
      localStorage.setItem('analytics_events', JSON.stringify(combined.slice(-2000))); // Keep last 2000 events

      // Save feature usage
      const featuresArray = Array.from(this.featureUsage.values());
      localStorage.setItem('analytics_features', JSON.stringify(featuresArray));

      // In a real app, you would send this data to your analytics server
      console.log('Analytics data flushed:', {
        events: this.events.length,
        features: this.featureUsage.size,
      });

      // Clear events buffer
      this.events = [];
    } catch (error) {
      console.error('Failed to flush analytics data:', error);
    }
  }

  private loadStoredData(): void {
    try {
      // Load feature usage
      const storedFeatures = localStorage.getItem('analytics_features');
      if (storedFeatures) {
        const features: FeatureUsage[] = JSON.parse(storedFeatures);
        features.forEach(feature => {
          this.featureUsage.set(feature.feature, feature);
        });
      }
    } catch (error) {
      console.error('Failed to load stored analytics data:', error);
    }
  }

  private saveSession(session: UserSession): void {
    try {
      const stored = this.getStoredSessions();
      stored.push(session);
      localStorage.setItem('analytics_sessions', JSON.stringify(stored.slice(-100))); // Keep last 100 sessions
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getStoredSessions(): UserSession[] {
    try {
      const stored = localStorage.getItem('analytics_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getMostUsedFeatures(): FeatureUsage[] {
    return Array.from(this.featureUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getAlarmPatterns(alarmEvents: AnalyticsEvent[]) {
    const createEvents = alarmEvents.filter(e => e.data.action === 'create');
    const dismissEvents = alarmEvents.filter(e => e.data.action === 'dismiss');
    const snoozeEvents = alarmEvents.filter(e => e.data.action === 'snooze');
    const triggerEvents = alarmEvents.filter(e => e.data.action === 'trigger');

    const totalAlarms = createEvents.length;
    const dismissRate = triggerEvents.length > 0 ? dismissEvents.length / triggerEvents.length : 0;
    const snoozeRate = triggerEvents.length > 0 ? snoozeEvents.length / triggerEvents.length : 0;

    return {
      totalAlarms,
      averageAlarmsPerDay: this.calculateAveragePerDay(createEvents),
      mostCommonTime: this.getMostCommonAlarmTime(createEvents),
      dismissRate,
      snoozeRate,
    };
  }

  private getNavigationPatterns(pageViewEvents: AnalyticsEvent[]) {
    const pageViews = pageViewEvents.reduce((acc, event) => {
      const page = event.data.page;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostVisitedPages = Object.entries(pageViews)
      .map(([page, visits]) => ({ page, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    return {
      mostVisitedPages,
      averagePageDuration: this.calculateAveragePageDuration(pageViewEvents),
      bounceRate: this.calculateBounceRate(),
    };
  }

  private calculateAveragePerDay(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    
    const firstEvent = Math.min(...events.map(e => e.timestamp));
    const lastEvent = Math.max(...events.map(e => e.timestamp));
    const days = Math.max(1, (lastEvent - firstEvent) / (1000 * 60 * 60 * 24));
    
    return events.length / days;
  }

  private getMostCommonAlarmTime(createEvents: AnalyticsEvent[]): string {
    const times = createEvents
      .map(e => e.data.time)
      .filter(Boolean)
      .reduce((acc, time) => {
        acc[time] = (acc[time] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const mostCommon = Object.entries(times)
      .sort(([,a], [,b]) => b - a)[0];

    return mostCommon ? mostCommon[0] : 'N/A';
  }

  private calculateAveragePageDuration(pageViewEvents: AnalyticsEvent[]): number {
    // Simplified calculation - in a real app you'd track page leave events
    const sessions = this.getStoredSessions();
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((total, session) => {
      return total + (session.lastActivity - session.startTime);
    }, 0);

    const totalPageViews = sessions.reduce((total, session) => {
      return total + session.pageViews;
    }, 0);

    return totalPageViews > 0 ? totalDuration / totalPageViews : 0;
  }

  private calculateBounceRate(): number {
    const sessions = this.getStoredSessions();
    if (sessions.length === 0) return 0;

    const singlePageSessions = sessions.filter(session => session.pageViews === 1);
    return singlePageSessions.length / sessions.length;
  }
}

export default AnalyticsService;