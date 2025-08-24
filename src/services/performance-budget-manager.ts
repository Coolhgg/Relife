/// <reference types="node" />
import type {
  PerformanceBudget,
  PerformanceThresholds,
  PerformanceAlert,
  PerformanceSnapshot,
  AdaptivePerformanceConfig,
  DeviceAdaptation,
} from './types/performance';
import { deviceCapabilities, DeviceTier } from './device-capabilities';
import { TimeoutHandle } from '../types/timers';

export class PerformanceBudgetManager {
  private static instance: PerformanceBudgetManager | null = null;
  private budgets: Map<DeviceTier, PerformanceBudget> = new Map();
  private thresholds: Map<DeviceTier, PerformanceThresholds> = new Map();
  private currentSnapshot: PerformanceSnapshot | null = null;
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private monitoringInterval: TimeoutHandle | null = null;
  private adaptations: DeviceAdaptation | null = null;
  private listeners: Array<(snapshot: PerformanceSnapshot) => void> = [];
  private alertListeners: Array<(alert: PerformanceAlert) => void> = [];
  private isMonitoring = false;
  private performanceObserver: PerformanceObserver | null = null;
  private frameRateTracker: FrameRateTracker | null = null;

  private constructor() {
    this.initializeBudgets();
    this.initializeThresholds();
  }

  static getInstance(): PerformanceBudgetManager {
    if (!this.instance) {
      this.instance = new PerformanceBudgetManager();
    }
    return this.instance;
  }

  private initializeBudgets(): void {
    // Low-end device budgets
    this.budgets.set('low-end', {
      // Time budgets (ms)
      pageLoad: 3000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
      timeToInteractive: 3500,

      // Resource budgets (KB)
      totalBundleSize: 200,
      initialBundleSize: 100,
      imageSize: 50,
      audioSize: 20,

      // Memory budgets (MB)
      heapSize: 100,
      domNodes: 1000,

      // Network budgets
      requestCount: 20,
      requestDuration: 2000,
    });

    // Mid-range device budgets
    this.budgets.set('mid-range', {
      pageLoad: 2000,
      firstContentfulPaint: 1000,
      largestContentfulPaint: 2000,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 50,
      timeToInteractive: 2500,

      totalBundleSize: 500,
      initialBundleSize: 200,
      imageSize: 100,
      audioSize: 50,

      heapSize: 250,
      domNodes: 2000,

      requestCount: 50,
      requestDuration: 1500,
    });

    // High-end device budgets
    this.budgets.set('high-end', {
      pageLoad: 1500,
      firstContentfulPaint: 800,
      largestContentfulPaint: 1500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 30,
      timeToInteractive: 2000,

      totalBundleSize: 1000,
      initialBundleSize: 300,
      imageSize: 200,
      audioSize: 100,

      heapSize: 500,
      domNodes: 5000,

      requestCount: 100,
      requestDuration: 1000,
    });
  }

  private initializeThresholds(): void {
    // Low-end device thresholds
    this.thresholds.set('low-end', {
      critical: {
        memoryUsage: 400, // MB
        fps: 20,
        responseTime: 500, // ms
        errorRate: 5, // percentage
      },
      warning: {
        memoryUsage: 300, // MB
        fps: 25,
        responseTime: 300, // ms
        errorRate: 2, // percentage
      },
      good: {
        memoryUsage: 200, // MB
        fps: 30,
        responseTime: 150, // ms
        errorRate: 0.5, // percentage
      },
    });

    // Mid-range device thresholds
    this.thresholds.set('mid-range', {
      critical: {
        memoryUsage: 800, // MB
        fps: 30,
        responseTime: 300, // ms
        errorRate: 3, // percentage
      },
      warning: {
        memoryUsage: 600, // MB
        fps: 40,
        responseTime: 200, // ms
        errorRate: 1, // percentage
      },
      good: {
        memoryUsage: 400, // MB
        fps: 45,
        responseTime: 100, // ms
        errorRate: 0.3, // percentage
      },
    });

    // High-end device thresholds
    this.thresholds.set('high-end', {
      critical: {
        memoryUsage: 1500, // MB
        fps: 45,
        responseTime: 200, // ms
        errorRate: 2, // percentage
      },
      warning: {
        memoryUsage: 1000, // MB
        fps: 55,
        responseTime: 100, // ms
        errorRate: 0.5, // percentage
      },
      good: {
        memoryUsage: 600, // MB
        fps: 60,
        responseTime: 50, // ms
        errorRate: 0.1, // percentage
      },
    });
  }

  async initialize(): Promise<void> {
    try {
      // Wait for device capabilities to be ready
      const config = await deviceCapabilities.initialize();

      // Set up device-specific adaptations
      this.adaptations = this.generateDeviceAdaptations(config.tier);

      // Initialize frame rate tracking
      this.frameRateTracker = new FrameRateTracker();

      // Set up performance observer
      if ('PerformanceObserver' in window) {
        this.setupPerformanceObserver();
      }

      // Start monitoring
      this.startMonitoring();

      console.log('Performance Budget Manager initialized for', config.tier, 'device');
    } catch (error) {
      console.error('Failed to initialize Performance Budget Manager:', error);
    }
  }

  private generateDeviceAdaptations(tier: DeviceTier): DeviceAdaptation {
    const adaptations: Record<DeviceTier, DeviceAdaptation> = {
      'low-end': {
        audioQuality: 'low',
        imageQuality: 'low',
        animationComplexity: 'none',
        cacheStrategy: 'minimal',
        preloadingStrategy: 'disabled',

        listVirtualization: true,
        lazyImageLoading: true,
        reducedAnimations: true,
        simplifiedUI: true,

        monitoringFrequency: 60000, // 1 minute
        metricRetention: 50,
        alertThresholds: this.thresholds.get('low-end')!,
      },
      'mid-range': {
        audioQuality: 'medium',
        imageQuality: 'medium',
        animationComplexity: 'simple',
        cacheStrategy: 'moderate',
        preloadingStrategy: 'conservative',

        listVirtualization: true,
        lazyImageLoading: true,
        reducedAnimations: false,
        simplifiedUI: false,

        monitoringFrequency: 45000, // 45 seconds
        metricRetention: 200,
        alertThresholds: this.thresholds.get('mid-range')!,
      },
      'high-end': {
        audioQuality: 'high',
        imageQuality: 'high',
        animationComplexity: 'complex',
        cacheStrategy: 'aggressive',
        preloadingStrategy: 'aggressive',

        listVirtualization: false,
        lazyImageLoading: false,
        reducedAnimations: false,
        simplifiedUI: false,

        monitoringFrequency: 30000, // 30 seconds
        metricRetention: 500,
        alertThresholds: this.thresholds.get('high-end')!,
      },
    };

    return adaptations[tier];
  }

  private setupPerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        this.processPerformanceEntries(entries);
      });

      // Observe different types of performance entries
      const entryTypes = [
        'navigation',
        'paint',
        'largest-contentful-paint',
        'first-input',
        'layout-shift',
      ];

      for (const type of entryTypes) {
        try {
          this.performanceObserver.observe({ type, buffered: true });
        } catch {
          // Entry type not supported in this browser
        }
      }
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }

  private processPerformanceEntries(entries: PerformanceEntryList): void {
    for (const entry of entries) {
      switch (entry.entryType) {
        case 'navigation':
          this.processNavigationEntry(entry as PerformanceNavigationTiming);
          break;
        case 'paint':
          this.processPaintEntry(entry);
          break;
        case 'largest-contentful-paint':
          this.processLCPEntry(entry);
          break;
        case 'first-input':
          this.processFIDEntry(entry);
          break;
        case 'layout-shift':
          this.processCLSEntry(entry);
          break;
      }
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const pageLoad = entry.loadEventEnd - entry.navigationStart;
    const budget = this.getCurrentBudget();

    if (budget && pageLoad > budget.pageLoad) {
      this.createAlert(
        'page-load',
        'warning',
        `Page load time (${Math.round(pageLoad)}ms) exceeds budget (${budget.pageLoad}ms)`,
        { pageLoad }
      );
    }
  }

  private processPaintEntry(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      const budget = this.getCurrentBudget();
      if (budget && entry.startTime > budget.firstContentfulPaint) {
        this.createAlert(
          'fcp',
          'warning',
          `First Contentful Paint (${Math.round(entry.startTime)}ms) exceeds budget (${budget.firstContentfulPaint}ms)`,
          { fcp: entry.startTime }
        );
      }
    }
  }

  private processLCPEntry(entry: any): void {
    const budget = this.getCurrentBudget();
    if (budget && entry.startTime > budget.largestContentfulPaint) {
      this.createAlert(
        'lcp',
        'warning',
        `Largest Contentful Paint (${Math.round(entry.startTime)}ms) exceeds budget (${budget.largestContentfulPaint}ms)`,
        { lcp: entry.startTime }
      );
    }
  }

  private processFIDEntry(entry: any): void {
    const budget = this.getCurrentBudget();
    if (budget && entry.processingStart - entry.startTime > budget.firstInputDelay) {
      this.createAlert(
        'fid',
        'warning',
        `First Input Delay (${Math.round(entry.processingStart - entry.startTime)}ms) exceeds budget (${budget.firstInputDelay}ms)`,
        { fid: entry.processingStart - entry.startTime }
      );
    }
  }

  private processCLSEntry(entry: any): void {
    const budget = this.getCurrentBudget();
    if (budget && entry.value > budget.cumulativeLayoutShift) {
      this.createAlert(
        'cls',
        'warning',
        `Cumulative Layout Shift (${entry.value.toFixed(3)}) exceeds budget (${budget.cumulativeLayoutShift})`,
        { cls: entry.value }
      );
    }
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    const frequency = this.adaptations?.monitoringFrequency || 30000;

    this.monitoringInterval = setInterval(() => {
      this.capturePerformanceSnapshot();
    }, frequency);

    this.isMonitoring = true;
  }

  private async capturePerformanceSnapshot(): Promise<void> {
    const deviceTier = deviceCapabilities.getDeviceTier() || 'low-end';

    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      deviceTier,
      frameRate: await this.getFrameRateMetrics(),
      memory: this.getMemoryMetrics(),
      network: this.getNetworkMetrics(),
      rendering: this.getRenderingMetrics(),
      userExperience: this.getUserExperienceMetrics(),
      overallScore: 0, // Will be calculated
    };

    // Calculate overall performance score
    snapshot.overallScore = this.calculatePerformanceScore(snapshot);

    // Store current snapshot
    this.currentSnapshot = snapshot;

    // Check against budgets and thresholds
    this.checkBudgetCompliance(snapshot);
    this.checkPerformanceThresholds(snapshot);

    // Notify listeners
    this.notifyListeners(snapshot);
  }

  private async getFrameRateMetrics(): Promise<any> {
    if (!this.frameRateTracker) {
      return {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        drops: 0,
        targetFPS: 60,
        history: [60],
      };
    }

    return this.frameRateTracker.getMetrics();
  }

  private getMemoryMetrics(): any {
    const memory = (performance as any).memory;
    if (!memory) {
      return {
        used: 100,
        total: 1024,
        limit: 1024,
        percentage: 10,
        pressure: 'low',
        gcFrequency: 0,
        heapGrowthRate: 0,
      };
    }

    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

    return {
      used,
      total,
      limit,
      percentage: (used / limit) * 100,
      pressure:
        used > limit * 0.8
          ? 'critical'
          : used > limit * 0.6
            ? 'high'
            : used > limit * 0.4
              ? 'medium'
              : 'low',
      gcFrequency: 0, // Would need to be tracked separately
      heapGrowthRate: 0, // Would need historical data
    };
  }

  private getNetworkMetrics(): any {
    const connection = (navigator as any).connection;
    const entries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];

    let latency = 0;
    if (entries.length > 0) {
      const entry = entries[0];
      latency = entry.responseStart - entry.requestStart;
    }

    return {
      latency,
      bandwidth: connection?.downlink || 10,
      requestCount: performance.getEntriesByType('resource').length,
      failureRate: 0, // Would need to be tracked
      cacheHitRate: 0, // Would need to be tracked
      compressionRatio: 0, // Would need to be tracked
    };
  }

  private getRenderingMetrics(): any {
    const entries = performance.getEntriesByType('measure');

    return {
      paintTime: 0, // Would need to be measured
      layoutTime: 0, // Would need to be measured
      styleRecalcTime: 0, // Would need to be measured
      compositeTime: 0, // Would need to be measured
      domNodeCount: document.querySelectorAll('*').length,
      cssRuleCount: this.getCSSRuleCount(),
      jsExecutionTime: 0, // Would need to be measured
    };
  }

  private getCSSRuleCount(): number {
    let count = 0;
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          if (sheet.cssRules) {
            count += sheet.cssRules.length;
          }
        } catch {
          // CORS or other access issues
        }
      }
    } catch {
      // Fallback
    }
    return count;
  }

  private getUserExperienceMetrics(): any {
    const entries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];

    if (entries.length === 0) {
      return {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0,
        interactionToNextPaint: 0,
      };
    }

    const entry = entries[0];

    return {
      firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
      cumulativeLayoutShift: this.getMetricValue('cumulative-layout-shift'),
      firstInputDelay: this.getMetricValue('first-input-delay'),
      timeToInteractive: entry.domContentLoadedEventEnd - entry.navigationStart,
      totalBlockingTime: 0, // Would need to be calculated
      interactionToNextPaint: 0, // Would need to be measured
    };
  }

  private getMetricValue(metricName: string): number {
    const entries = performance.getEntriesByName(metricName);
    if (entries.length > 0) {
      return entries[entries.length - 1].startTime;
    }
    return 0;
  }

  private calculatePerformanceScore(snapshot: PerformanceSnapshot): number {
    const thresholds = this.getCurrentThresholds();
    if (!thresholds) return 50; // Neutral score

    let score = 100;

    // Memory score (25% weight)
    const memoryRatio = snapshot.memory.used / thresholds.good.memoryUsage;
    score -= Math.max(0, (memoryRatio - 1) * 25);

    // FPS score (25% weight)
    const fpsRatio = thresholds.good.fps / snapshot.frameRate.current;
    score -= Math.max(0, (fpsRatio - 1) * 25);

    // Network score (25% weight)
    const latencyRatio = snapshot.network.latency / thresholds.good.responseTime;
    score -= Math.max(0, (latencyRatio - 1) * 25);

    // User experience score (25% weight)
    const uxScore = this.calculateUXScore(snapshot.userExperience);
    score = score * 0.75 + uxScore * 0.25;

    return Math.max(0, Math.min(100, score));
  }

  private calculateUXScore(ux: any): number {
    const budget = this.getCurrentBudget();
    if (!budget) return 50;

    let score = 100;

    // FCP impact
    if (ux.firstContentfulPaint > budget.firstContentfulPaint) {
      score -= 20;
    }

    // LCP impact
    if (ux.largestContentfulPaint > budget.largestContentfulPaint) {
      score -= 30;
    }

    // CLS impact
    if (ux.cumulativeLayoutShift > budget.cumulativeLayoutShift) {
      score -= 25;
    }

    // FID impact
    if (ux.firstInputDelay > budget.firstInputDelay) {
      score -= 25;
    }

    return Math.max(0, score);
  }

  private checkBudgetCompliance(snapshot: PerformanceSnapshot): void {
    const budget = this.getCurrentBudget();
    if (!budget) return;

    // Check memory budget
    if (snapshot.memory.used > budget.heapSize) {
      this.createAlert(
        'memory-budget',
        'warning',
        `Memory usage (${snapshot.memory.used}MB) exceeds budget (${budget.heapSize}MB)`,
        { memoryUsed: snapshot.memory.used, memoryBudget: budget.heapSize }
      );
    }

    // Check DOM node budget
    if (snapshot.rendering.domNodeCount > budget.domNodes) {
      this.createAlert(
        'dom-budget',
        'warning',
        `DOM node count (${snapshot.rendering.domNodeCount}) exceeds budget (${budget.domNodes})`,
        {
          domNodes: snapshot.rendering.domNodeCount,
          domBudget: budget.domNodes,
        }
      );
    }
  }

  private checkPerformanceThresholds(snapshot: PerformanceSnapshot): void {
    const thresholds = this.getCurrentThresholds();
    if (!thresholds) return;

    // Check memory thresholds
    if (snapshot.memory.used > thresholds.critical.memoryUsage) {
      this.createAlert(
        'memory-critical',
        'critical',
        `Critical memory usage: ${snapshot.memory.used}MB`,
        snapshot,
        [
          'Clear unnecessary caches',
          'Trigger garbage collection',
          'Reduce cache sizes',
          'Disable non-essential features',
        ],
        this.createMemoryAutoFix()
      );
    } else if (snapshot.memory.used > thresholds.warning.memoryUsage) {
      this.createAlert(
        'memory-warning',
        'warning',
        `High memory usage: ${snapshot.memory.used}MB`,
        snapshot,
        [
          'Monitor memory growth',
          'Consider cache cleanup',
          'Review memory-intensive operations',
        ]
      );
    }

    // Check FPS thresholds
    if (snapshot.frameRate.current < thresholds.critical.fps) {
      this.createAlert(
        'fps-critical',
        'critical',
        `Critical frame rate: ${snapshot.frameRate.current}fps`,
        snapshot,
        [
          'Reduce animation complexity',
          'Enable hardware acceleration',
          'Optimize rendering performance',
          'Consider reduced motion mode',
        ],
        this.createFPSAutoFix()
      );
    }

    // Check network thresholds
    if (snapshot.network.latency > thresholds.critical.responseTime) {
      this.createAlert(
        'network-critical',
        'critical',
        `Critical response time: ${snapshot.network.latency}ms`,
        snapshot,
        [
          'Enable request caching',
          'Optimize network requests',
          'Consider offline mode',
          'Reduce request frequency',
        ]
      );
    }
  }

  private createAlert(
    id: string,
    severity: 'warning' | 'critical',
    message: string,
    metrics?: any,
    suggestions: string[] = [],
    autoFix?: () => Promise<void>
  ): void {
    const alert: PerformanceAlert = {
      id,
      type: this.getAlertType(id),
      severity,
      message,
      timestamp: Date.now(),
      metrics,
      suggestions,
      autoFix,
    };

    this.activeAlerts.set(id, alert);
    this.notifyAlertListeners(alert);

    // Auto-resolve after some time for non-critical alerts
    if (severity === 'warning') {
      setTimeout(() => {
        this.resolveAlert(id);
      }, 300000); // 5 minutes
    }
  }

  private getAlertType(id: string): 'memory' | 'fps' | 'network' | 'render' | 'user' {
    if (id.includes('memory')) return 'memory';
    if (id.includes('fps')) return 'fps';
    if (id.includes('network')) return 'network';
    if (id.includes('render') || id.includes('dom')) return 'render';
    return 'user';
  }

  private createMemoryAutoFix(): () => Promise<void> {
    return async () => {
      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      // Clear performance entries
      performance.clearMeasures();
      performance.clearMarks();

      // Notify other services to reduce memory usage
      window.dispatchEvent(
        new CustomEvent('memory-pressure', {
          detail: { level: 'critical' },
        })
      );

      console.log('Applied automatic memory optimization');
    };
  }

  private createFPSAutoFix(): () => Promise<void> {
    return async () => {
      // Enable reduced motion
      document.documentElement.style.setProperty('--animation-duration', '0s');

      // Disable non-essential animations
      const animations = document.getAnimations();
      animations.forEach(animation => {
        if (animation.effect) {
          animation.pause();
        }
      });

      // Notify components to reduce complexity
      window.dispatchEvent(
        new CustomEvent('performance-critical', {
          detail: { type: 'fps', action: 'reduce-complexity' },
        })
      );

      console.log('Applied automatic FPS optimization');
    };
  }

  // Public API methods
  getCurrentBudget(): PerformanceBudget | null {
    const tier = deviceCapabilities.getDeviceTier();
    return tier ? this.budgets.get(tier) || null : null;
  }

  getCurrentThresholds(): PerformanceThresholds | null {
    const tier = deviceCapabilities.getDeviceTier();
    return tier ? this.thresholds.get(tier) || null : null;
  }

  getAdaptations(): DeviceAdaptation | null {
    return this.adaptations;
  }

  getCurrentSnapshot(): PerformanceSnapshot | null {
    return this.currentSnapshot;
  }

  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  resolveAlert(id: string): void {
    if (this.activeAlerts.delete(id)) {
      console.log(`Resolved performance alert: ${id}`);
    }
  }

  async triggerAutoFix(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert?.autoFix) {
      try {
        await alert.autoFix();
        this.resolveAlert(alertId);
      } catch (error) {
        console.error('Auto-fix failed:', error);
      }
    }
  }

  // Event listeners
  onSnapshot(callback: (snapshot: PerformanceSnapshot) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertListeners.push(callback);
    return () => {
      const index = this.alertListeners.indexOf(callback);
      if (index > -1) {
        this.alertListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(snapshot: PerformanceSnapshot): void {
    this.listeners.forEach(callback => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error('Error in performance snapshot listener:', error);
      }
    });
  }

  private notifyAlertListeners(alert: PerformanceAlert): void {
    this.alertListeners.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in performance alert listener:', error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.frameRateTracker) {
      this.frameRateTracker.stop();
      this.frameRateTracker = null;
    }

    this.isMonitoring = false;
    this.listeners = [];
    this.alertListeners = [];
    this.activeAlerts.clear();
  }
}

// Simple frame rate tracker
class FrameRateTracker {
  private frames: number[] = [];
  private isTracking = false;
  private animationId: TimeoutHandle | null = null;

  constructor() {
    this.start();
  }

  start(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.track();
  }

  private track(): void {
    const start = performance.now();

    this.animationId = requestAnimationFrame(() => {
      const frameDuration = performance.now() - start;
      const fps = 1000 / frameDuration;

      this.frames.push(fps);

      // Keep only last 60 frames (roughly 1 second at 60fps)
      if (this.frames.length > 60) {
        this.frames.shift();
      }

      if (this.isTracking) {
        this.track();
      }
    });
  }

  getMetrics(): any {
    if (this.frames.length === 0) {
      return {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        drops: 0,
        targetFPS: 60,
        history: [60],
      };
    }

    const current = this.frames[this.frames.length - 1] || 60;
    const average = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    const min = Math.min(...this.frames);
    const max = Math.max(...this.frames);
    const drops = this.frames.filter(fps => fps < 55).length;

    return {
      current: Math.round(current),
      average: Math.round(average),
      min: Math.round(min),
      max: Math.round(max),
      drops,
      targetFPS: 60,
      history: [...this.frames],
    };
  }

  stop(): void {
    this.isTracking = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Export singleton instance
export const performanceBudgetManager = PerformanceBudgetManager.getInstance();
