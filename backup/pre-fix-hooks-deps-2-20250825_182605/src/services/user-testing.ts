/// <reference lib="dom" />
import { v4 as uuidv4 } from 'uuid';
import { Device } from '@capacitor/device';
// import ... from '@capacitor/network'; // Package not available in current setup
import { ErrorHandler } from './error-handler';
// auto: restored by scout - verify import path
import { Network } from '@capacitor/network';
// auto: restored by scout - verify import path
import { Network } from '@capacitor/network';

// Types
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { _event } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
export interface UserTestSession {
  id: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  deviceInfo: DeviceInfo;
  appVersion: string;
  testType: 'usability' | 'a-b-test' | 'beta-test' | 'feedback' | 'bug-report';
  metadata: Record<string, any>;
}

export interface DeviceInfo {
  platform: string;
  model: string;
  operatingSystem: string;
  osVersion: string;
  webViewVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  language: string;
  timezone: string;
  networkType: string;
}

export interface UserFeedback {
  id: string;
  sessionId: string;
  userId: string;
  type: 'rating' | 'text' | 'bug' | 'suggestion' | 'complaint';
  category: 'ui' | 'performance' | 'feature' | 'bug' | 'general';
  rating?: number; // 1-5 stars
  title: string;
  description: string;
  screenshot?: string;
  logs?: string[];
  deviceInfo: DeviceInfo;
  timestamp: Date;
  page: string;
  action: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'dismissed';
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate: Date;
  targetPercentage: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  metrics: ABTestMetric[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  percentage: number;
  _config: Record<string, any>;
}

export interface ABTestMetric {
  name: string;
  type: 'conversion' | 'engagement' | 'retention' | 'custom';
  target: number;
  current?: number;
}

export interface UsabilityEvent {
  id: string;
  sessionId: string;
  userId: string;
  type:
    | 'click'
    | 'scroll'
    | 'focus'
    | 'input'
    | 'navigation'
    | '_error'
    | 'performance';
  element?: string;
  elementText?: string;
  page: string;
  x?: number;
  y?: number;
  scrollPosition?: number;
  duration?: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface BugReport {
  id: string;
  sessionId: string;
  userId: string;
  title: string;
  description: string;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'crash' | 'ui' | 'performance' | 'data' | 'feature' | 'security';
  screenshot?: string;
  video?: string;
  logs: string[];
  deviceInfo: DeviceInfo;
  networkInfo: any;
  reproducible: boolean;
  frequency: 'once' | 'sometimes' | 'often' | 'always';
  timestamp: Date;
  status: 'new' | 'confirmed' | 'in-progress' | 'resolved' | 'duplicate' | 'wont-fix';
  assignee?: string;
  tags: string[];
}

// User Testing Service
export class UserTestingService {
  private static instance: UserTestingService;
  private currentSession: UserTestSession | null = null;
  private events: UsabilityEvent[] = [];
  private feedbacks: UserFeedback[] = [];
  private bugReports: BugReport[] = [];
  private abTests: Map<string, ABTest> = new Map();
  private userVariants: Map<string, string> = new Map(); // testId -> variantId
  private isInitialized = false;

  static getInstance(): UserTestingService {
    if (!UserTestingService.instance) {
      UserTestingService.instance = new UserTestingService();
    }
    return UserTestingService.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧪 Initializing User Testing Service...');

      // Start a new session
      await this.startSession(userId, 'usability');

      // Load stored data
      await this.loadStoredData();

      // Load active A/B tests
      await this.loadActiveABTests();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('✅ User Testing Service initialized successfully');
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to initialize User Testing Service',
        { context: 'user_testing_init', userId }
      );
    }
  }

  async startSession(
    userId: string,
    testType: UserTestSession['testType'],
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const deviceInfo = await this.getDeviceInfo();

      this.currentSession = {
        id: uuidv4(),
        userId,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        deviceInfo,
        appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
        testType,
        metadata,
      };

      // Store session
      await this.storeSession(this.currentSession);

      console.log(`🧪 Started ${testType} session:`, this.currentSession.sessionId);
      return this.currentSession.sessionId;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to start user testing session',
        { context: 'start_session', userId, testType }
      );
      throw error;
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.endTime = new Date();

      // Calculate session metrics
      const duration =
        this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
      this.currentSession.metadata.duration = duration;
      this.currentSession.metadata.eventsCount = this.events.length;

      // Store final session data
      await this.storeSession(this.currentSession);

      // Submit collected data
      await this.submitSessionData(this.currentSession);

      console.log(`🧪 Ended session: ${this.currentSession.sessionId} (${duration}ms)`);
      this.currentSession = null;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to end user testing session',
        { context: 'end_session' }
      );
    }
  }

  // Event Tracking
  trackEvent(_event: Partial<UsabilityEvent>): void {
    if (!this.currentSession) return;

    try {
      const fullEvent: UsabilityEvent = {
        id: uuidv4(),
        sessionId: this.currentSession.sessionId,
        userId: this.currentSession.userId,
        type: event.type || 'click',
        element: event.element,
        elementText: event.elementText,
        page: event.page || window.location.pathname,
        x: event.x,
        y: event.y,
        scrollPosition: event.scrollPosition,
        duration: event.duration,
        timestamp: new Date(),
        metadata: event.metadata || {},
      };

      this.events.push(fullEvent);

      // Store events in batches
      if (this.events.length % 10 === 0) {
        this.storeEvents();
      }
    } catch (_error) {
      console._error('Failed to track _event:', _error);
    }
  }

  trackClick(
    element: string,
    x: number,
    y: number,
    metadata: Record<string, any> = {}
  ): void {
    this.trackEvent({
      type: 'click',
      element,
      x,
      y,
      metadata,
    });
  }

  trackNavigation(fromPage: string, toPage: string, duration?: number): void {
    this.trackEvent({
      type: 'navigation',
      page: toPage,
      duration,
      metadata: { fromPage, toPage },
    });
  }

  trackError(
    _error: string,
    element?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.trackEvent({
      type: '_error',
      element,
      metadata: { _error, ...metadata },
    });
  }

  trackPerformance(
    metric: string,
    value: number,
    metadata: Record<string, any> = {}
  ): void {
    this.trackEvent({
      type: 'performance',
      duration: value,
      metadata: { metric, value, ...metadata },
    });
  }

  // Feedback Collection
  async submitFeedback(feedback: Partial<UserFeedback>): Promise<string> {
    if (!this.currentSession) throw new Error('No active session');

    try {
      const fullFeedback: UserFeedback = {
        id: uuidv4(),
        sessionId: this.currentSession.sessionId,
        userId: this.currentSession.userId,
        type: feedback.type || 'text',
        category: feedback.category || 'general',
        rating: feedback.rating,
        title: feedback.title || 'User Feedback',
        description: feedback.description || '',
        screenshot: feedback.screenshot,
        logs: await this.getRecentLogs(),
        deviceInfo: this.currentSession.deviceInfo,
        timestamp: new Date(),
        page: feedback.page || window.location.pathname,
        action: feedback.action || 'manual_feedback',
        sentiment: this.analyzeSentiment(feedback.description || ''),
        priority: this.calculatePriority(feedback),
        status: 'open',
      };

      this.feedbacks.push(fullFeedback);
      await this.storeFeedback(fullFeedback);
      await this.submitFeedbackToServer(fullFeedback);

      console.log('📝 Feedback submitted:', fullFeedback.id);
      return fullFeedback.id;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to submit feedback',
        { context: 'submit_feedback', feedback }
      );
      throw error;
    }
  }

  // Bug Reporting
  async submitBugReport(bug: Partial<BugReport>): Promise<string> {
    if (!this.currentSession) throw new Error('No active session');

    try {
      const networkInfo = await Network.getStatus();

      const fullBugReport: BugReport = {
        id: uuidv4(),
        sessionId: this.currentSession.sessionId,
        userId: this.currentSession.userId,
        title: bug.title || 'Bug Report',
        description: bug.description || '',
        steps: bug.steps || [],
        expectedBehavior: bug.expectedBehavior || '',
        actualBehavior: bug.actualBehavior || '',
        severity: bug.severity || 'medium',
        category: bug.category || 'feature',
        screenshot: bug.screenshot,
        video: bug.video,
        logs: await this.getRecentLogs(),
        deviceInfo: this.currentSession.deviceInfo,
        networkInfo,
        reproducible: bug.reproducible ?? false,
        frequency: bug.frequency || 'once',
        timestamp: new Date(),
        status: 'new',
        tags: bug.tags || [],
      };

      this.bugReports.push(fullBugReport);
      await this.storeBugReport(fullBugReport);
      await this.submitBugReportToServer(fullBugReport);

      console.log('🐛 Bug report submitted:', fullBugReport.id);
      return fullBugReport.id;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to submit bug report',
        { context: 'submit_bug_report', bug }
      );
      throw error;
    }
  }

  // A/B Testing
  getVariant(testId: string): string | null {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'active') return null;

    // Check if user already has a variant
    if (this.userVariants.has(testId)) {
      return this.userVariants.get(testId)!;
    }

    // Assign variant based on user ID hash
    const userHash = this.hashUserId(this.currentSession?.userId || '');
    const variants = test.variants.sort((a, b) => a.percentage - b.percentage);

    let cumulativePercentage = 0;
    for (const variant of variants) {
      cumulativePercentage += variant.percentage;
      if (userHash <= cumulativePercentage) {
        this.userVariants.set(testId, variant.id);
        this.storeUserVariants();
        return variant.id;
      }
    }

    return null;
  }

  trackABTestConversion(testId: string, metric: string, value: number = 1): void {
    const variant = this.getVariant(testId);
    if (!variant) return;

    this.trackEvent({
      type: 'conversion',
      metadata: {
        testId,
        variant,
        metric,
        value,
        type: 'ab_test_conversion',
      },
    });
  }

  // Utility methods
  private async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const device = await Device.getInfo();
      const language = await Device.getLanguageCode();
      const network = await Network.getStatus();

      return {
        platform: device.platform,
        model: device.model,
        operatingSystem: device.operatingSystem,
        osVersion: device.osVersion,
        webViewVersion: device.webViewVersion,
        manufacturer: device.manufacturer,
        isVirtual: device.isVirtual,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        userAgent: navigator.userAgent,
        language: language.value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        networkType: network.connectionType,
      };
    } catch (_error) {
      console._error('Failed to get device info:', _error);
      return {
        platform: 'unknown',
        model: 'unknown',
        operatingSystem: 'unknown',
        osVersion: 'unknown',
        webViewVersion: 'unknown',
        manufacturer: 'unknown',
        isVirtual: false,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        networkType: 'unknown',
      };
    }
  }

  private setupEventListeners(): void {
    // Global click tracking
    document.addEventListener('click', event => {
      const target = _event.target as HTMLElement;
      this.trackClick(this.getElementSelector(target), event.clientX, event.clientY, {
        tagName: target.tagName,
        className: target.className,
        innerText: target.innerText?.slice(0, 100),
      });
    });

    // Error tracking
    window.addEventListener('error', event => {
      this.trackError(event.message, undefined, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: _event._error?.stack,
      });
    });

    // Performance tracking
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.trackPerformance(entry.name, entry.duration, {
              entryType: entry.entryType,
              startTime: entry.startTime,
            });
          }
        });
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (_error) {
        console.warn('PerformanceObserver not supported');
      }
    }

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent({
        type: 'focus',
        metadata: {
          visible: !document.hidden,
          timestamp: Date.now(),
        },
      });
    });
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'good',
      'great',
      'awesome',
      'excellent',
      'love',
      'perfect',
      'amazing',
      'fantastic',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'horrible',
      'worst',
      'sucks',
      'broken',
    ];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculatePriority(
    feedback: Partial<UserFeedback>
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (feedback.type === 'bug' && feedback.rating && feedback.rating <= 2)
      return 'critical';
    if (feedback.type === 'complaint') return 'high';
    if (feedback.rating && feedback.rating >= 4) return 'low';
    return 'medium';
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  private async getRecentLogs(): Promise<string[]> {
    // This would integrate with your logging system
    const logs = [];

    // Get console logs from ErrorHandler if available
    try {
      // You might want to implement a log buffer in ErrorHandler
      logs.push(`Session: ${this.currentSession?.sessionId}`);
      logs.push(`Timestamp: ${new Date().toISOString()}`);
      logs.push(`Page: ${window.location.pathname}`);
      logs.push(`User Agent: ${navigator.userAgent}`);
    } catch (_error) {
      logs.push(`Error getting logs: ${_error}`);
    }

    return logs;
  }

  // Storage methods
  private async storeSession(session: UserTestSession): Promise<void> {
    try {
      const key = `user_testing_session_${session.id}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch (_error) {
      console._error('Failed to store session:', _error);
    }
  }

  private async storeEvents(): Promise<void> {
    try {
      const key = `user_testing_events_${this.currentSession?.sessionId}`;
      localStorage.setItem(key, JSON.stringify(this.events));
    } catch (_error) {
      console._error('Failed to store events:', _error);
    }
  }

  private async storeFeedback(feedback: UserFeedback): Promise<void> {
    try {
      const key = `user_testing_feedback_${feedback.id}`;
      localStorage.setItem(key, JSON.stringify(feedback));
    } catch (_error) {
      console._error('Failed to store feedback:', _error);
    }
  }

  private async storeBugReport(bug: BugReport): Promise<void> {
    try {
      const key = `user_testing_bug_${bug.id}`;
      localStorage.setItem(key, JSON.stringify(bug));
    } catch (_error) {
      console._error('Failed to store bug report:', _error);
    }
  }

  private async storeUserVariants(): Promise<void> {
    try {
      const variants = Object.fromEntries(this.userVariants);
      localStorage.setItem('user_testing_variants', JSON.stringify(variants));
    } catch (_error) {
      console._error('Failed to store _user variants:', _error);
    }
  }

  private async loadStoredData(): Promise<void> {
    try {
      // Load user variants
      const storedVariants = localStorage.getItem('user_testing_variants');
      if (storedVariants) {
        const variants = JSON.parse(storedVariants);
        this.userVariants = new Map(Object.entries(variants));
      }
    } catch (_error) {
      console._error('Failed to load stored data:', _error);
    }
  }

  private async loadActiveABTests(): Promise<void> {
    // This would load active A/B tests from your backend
    // For now, we'll use mock data
    const mockTest: ABTest = {
      id: 'test_alarm_button_color',
      name: 'Alarm Button Color Test',
      description: 'Test different colors for the main alarm button',
      variants: [
        {
          id: 'control',
          name: 'Blue Button',
          description: 'Original blue button',
          percentage: 50,
          _config: { color: 'blue' },
        },
        {
          id: 'variant',
          name: 'Green Button',
          description: 'New green button',
          percentage: 50,
          _config: { color: 'green' },
        },
      ],
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
      targetPercentage: 100,
      status: 'active',
      metrics: [
        { name: 'alarm_created', type: 'conversion', target: 0.8 },
        { name: 'button_clicks', type: 'engagement', target: 5 },
      ],
    };

    this.abTests.set(mockTest.id, mockTest);
  }

  // Server communication methods (you'll need to implement these)
  private async submitSessionData(session: UserTestSession): Promise<void> {
    // Submit to your analytics backend
    console.log('📊 Session data ready for submission:', session);
  }

  private async submitFeedbackToServer(feedback: UserFeedback): Promise<void> {
    // Submit to your feedback system
    console.log('📝 Feedback ready for submission:', feedback);
  }

  private async submitBugReportToServer(bug: BugReport): Promise<void> {
    // Submit to your bug tracking system
    console.log('🐛 Bug report ready for submission:', bug);
  }

  // Public getters
  getCurrentSession(): UserTestSession | null {
    return this.currentSession;
  }

  getEvents(): UsabilityEvent[] {
    return [...this.events];
  }

  getFeedbacks(): UserFeedback[] {
    return [...this.feedbacks];
  }

  getBugReports(): BugReport[] {
    return [...this.bugReports];
  }

  getABTests(): ABTest[] {
    return Array.from(this.abTests.values());
  }

  isTestingActive(): boolean {
    return this.currentSession !== null;
  }
}

export default UserTestingService;
