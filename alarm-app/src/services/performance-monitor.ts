// Performance Monitoring Service for Smart Alarm App
// Tracks Web Vitals, user interactions, and application performance metrics

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WebVitalsMetrics {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTFB: number; // Time to First Byte
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'alarm_action';
  target: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  sessionId: string;
  userId?: string;
  timestamp: number;
  webVitals: Partial<WebVitalsMetrics>;
  interactions: UserInteraction[];
  customMetrics: PerformanceMetric[];
  deviceInfo: {
    userAgent: string;
    viewport: { width: number; height: number };
    connection?: string;
    memory?: number;
  };
  appInfo: {
    version: string;
    buildTime: string;
    features: string[];
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private sessionId: string;
  private webVitals: Partial<WebVitalsMetrics> = {};
  private interactions: UserInteraction[] = [];
  private customMetrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private reportingInterval: number | null = null;
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.setupWebVitalsTracking();
      this.setupNavigationTracking();
      this.setupResourceTracking();
      this.setupMemoryTracking();
      this.setupErrorTracking();
      this.startPeriodicReporting();
      
      this.isInitialized = true;
      console.log('[PerformanceMonitor] Initialized successfully');
      
      this.trackCustomMetric('monitor_initialization', performance.now());
    } catch (error) {
      console.error('[PerformanceMonitor] Initialization failed:', error);
    }
  }

  // Web Vitals tracking using Performance Observer API
  private setupWebVitalsTracking(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
          this.webVitals.LCP = lastEntry.renderTime || lastEntry.loadTime || 0;
          this.trackCustomMetric('LCP', this.webVitals.LCP);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] LCP tracking failed:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.webVitals.FID = entry.processingStart - entry.startTime;
            this.trackCustomMetric('FID', this.webVitals.FID);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] FID tracking failed:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.webVitals.CLS = clsValue;
              this.trackCustomMetric('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] CLS tracking failed:', error);
      }
    }

    // First Contentful Paint (FCP) and Time to First Byte (TTFB)
    if (performance.getEntriesByType) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.FCP = entry.startTime;
            this.trackCustomMetric('FCP', entry.startTime);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', observer);
      } catch (error) {
        console.warn('[PerformanceMonitor] Paint tracking failed:', error);
      }

      // TTFB from navigation timing
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        this.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        this.trackCustomMetric('TTFB', this.webVitals.TTFB);
      }
    }
  }

  // Navigation and page load tracking
  private setupNavigationTracking(): void {
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const entry = navEntries[0];
        
        this.trackCustomMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.navigationStart);
        this.trackCustomMetric('page_load_complete', entry.loadEventEnd - entry.navigationStart);
        this.trackCustomMetric('dom_processing', entry.domContentLoadedEventStart - entry.domInteractive);
      }
    }

    // Track route changes for SPA navigation
    let currentPath = window.location.pathname;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.trackNavigation(args[2] as string || window.location.pathname);
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.trackNavigation(args[2] as string || window.location.pathname);
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', () => {
      this.trackNavigation(window.location.pathname);
    });
  }

  // Resource loading performance
  private setupResourceTracking(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: PerformanceEntry) => {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track slow resources
            const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;
            if (loadTime > 1000) { // Resources taking more than 1s
              this.trackCustomMetric('slow_resource', loadTime, {
                url: entry.name,
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize
              });
            }
            
            // Track failed resources
            if (resourceEntry.responseStart === 0) {
              this.trackCustomMetric('failed_resource', 0, {
                url: entry.name,
                type: resourceEntry.initiatorType
              });
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] Resource tracking failed:', error);
      }
    }
  }

  // Memory usage tracking
  private setupMemoryTracking(): void {
    if ('memory' in performance) {
      const trackMemory = () => {
        const memory = (performance as any).memory;
        this.trackCustomMetric('memory_used', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      };

      // Track memory every 30 seconds
      setInterval(trackMemory, 30000);
      trackMemory(); // Initial measurement
    }
  }

  // Error tracking integration
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackCustomMetric('js_error', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackCustomMetric('unhandled_promise_rejection', 1, {
        reason: event.reason?.toString() || 'Unknown'
      });
    });
  }

  // User interaction tracking
  trackUserInteraction(type: UserInteraction['type'], target: string, metadata?: Record<string, any>, duration?: number): void {
    const interaction: UserInteraction = {
      type,
      target,
      timestamp: performance.now(),
      duration,
      metadata
    };

    this.interactions.push(interaction);

    // Keep only recent interactions (last 100)
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }

    this.trackCustomMetric(`interaction_${type}`, 1, { target, ...metadata });
  }

  // Custom metric tracking
  trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      metadata
    };

    this.customMetrics.push(metric);

    // Keep only recent metrics (last 200)
    if (this.customMetrics.length > 200) {
      this.customMetrics = this.customMetrics.slice(-200);
    }
  }

  // Navigation tracking
  private trackNavigation(path: string): void {
    this.trackUserInteraction('navigation', path, {
      timestamp: Date.now(),
      referrer: document.referrer
    });
  }

  // Alarm-specific performance tracking
  trackAlarmAction(action: 'create' | 'edit' | 'delete' | 'toggle' | 'trigger' | 'dismiss' | 'snooze', duration?: number, metadata?: Record<string, any>): void {
    this.trackUserInteraction('alarm_action', action, {
      ...metadata,
      critical: true // Mark alarm actions as critical for performance
    }, duration);

    this.trackCustomMetric(`alarm_${action}_performance`, duration || 0, metadata);
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      webVitals: { ...this.webVitals },
      interactions: [...this.interactions],
      customMetrics: [...this.customMetrics],
      deviceInfo: this.getDeviceInfo(),
      appInfo: this.getAppInfo()
    };
  }

  // Get device information
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown'
    };
  }

  // Get app information
  private getAppInfo() {
    return {
      version: '1.0.0', // Should come from package.json or build process
      buildTime: new Date().toISOString(), // Should come from build process
      features: [
        'offline-support',
        'error-boundaries',
        'input-validation',
        'pwa-capabilities',
        'performance-monitoring'
      ]
    };
  }

  // Start periodic reporting
  private startPeriodicReporting(): void {
    // Send report every 5 minutes
    this.reportingInterval = window.setInterval(() => {
      this.sendReport();
    }, 5 * 60 * 1000);

    // Send report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendReport();
    });

    // Send report when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendReport();
      }
    });
  }

  // Send performance report
  private sendReport(): void {
    try {
      const report = this.generateReport();
      
      // Store locally for offline scenarios
      this.storeReportLocally(report);
      
      // Send to analytics endpoint if online
      if (navigator.onLine) {
        this.sendReportToServer(report);
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to send report:', error);
    }
  }

  // Store report locally
  private storeReportLocally(report: PerformanceReport): void {
    try {
      const existingReports = JSON.parse(localStorage.getItem('performance-reports') || '[]');
      existingReports.push(report);
      
      // Keep only last 10 reports
      const recentReports = existingReports.slice(-10);
      localStorage.setItem('performance-reports', JSON.stringify(recentReports));
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to store report locally:', error);
    }
  }

  // Send report to server
  private sendReportToServer(report: PerformanceReport): void {
    if ('sendBeacon' in navigator) {
      // Use sendBeacon for reliable delivery
      navigator.sendBeacon('/api/performance', JSON.stringify(report));
    } else {
      // Fallback to fetch
      fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true
      }).catch(error => {
        console.warn('[PerformanceMonitor] Failed to send report:', error);
      });
    }
  }

  // Get stored reports
  getStoredReports(): PerformanceReport[] {
    try {
      return JSON.parse(localStorage.getItem('performance-reports') || '[]');
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to retrieve stored reports:', error);
      return [];
    }
  }

  // Clear stored reports
  clearStoredReports(): void {
    localStorage.removeItem('performance-reports');
  }

  // Get performance summary
  getPerformanceSummary() {
    const reports = this.getStoredReports();
    const currentReport = this.generateReport();
    
    return {
      currentSession: {
        webVitals: currentReport.webVitals,
        interactionCount: currentReport.interactions.length,
        customMetricCount: currentReport.customMetrics.length
      },
      historicalData: {
        totalSessions: reports.length,
        averageWebVitals: this.calculateAverageWebVitals(reports),
        mostCommonInteractions: this.getMostCommonInteractions(reports)
      }
    };
  }

  // Calculate average Web Vitals
  private calculateAverageWebVitals(reports: PerformanceReport[]): Partial<WebVitalsMetrics> {
    if (reports.length === 0) return {};

    const totals = reports.reduce((acc, report) => {
      Object.entries(report.webVitals).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    }, {} as Record<string, number>);

    const averages: Partial<WebVitalsMetrics> = {};
    Object.entries(totals).forEach(([key, total]) => {
      averages[key as keyof WebVitalsMetrics] = total / reports.length;
    });

    return averages;
  }

  // Get most common interactions
  private getMostCommonInteractions(reports: PerformanceReport[]): Array<{ type: string; count: number }> {
    const interactionCounts: Record<string, number> = {};
    
    reports.forEach(report => {
      report.interactions.forEach(interaction => {
        const key = `${interaction.type}:${interaction.target}`;
        interactionCounts[key] = (interactionCounts[key] || 0) + 1;
      });
    });

    return Object.entries(interactionCounts)
      .map(([key, count]) => {
        const [type, target] = key.split(':');
        return { type: `${type} - ${target}`, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    // Send final report
    this.sendReport();
  }
}

export default PerformanceMonitor.getInstance();