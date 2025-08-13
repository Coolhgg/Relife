import PerformanceAnalyticsService, { 
  PerformanceMetric, 
  WebVitalsMetrics, 
  PerformanceThresholds 
} from '../performance-analytics';
import SentryService from '../sentry';
import AnalyticsService from '../analytics';
import AppAnalyticsService from '../app-analytics';

// Mock the dependencies
jest.mock('../sentry');
jest.mock('../analytics');
jest.mock('../app-analytics');

// Mock PerformanceObserver and related APIs
const mockPerformanceObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
  mockPerformanceObserver.mockImplementation(callback);
  return {
    observe: mockObserve,
    disconnect: mockDisconnect
  };
}) as any;

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => 1000),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
    }
  }
});

// Mock console methods
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

// Mock window methods
Object.defineProperty(global.window, 'addEventListener', {
  writable: true,
  value: jest.fn()
});

describe('PerformanceAnalyticsService', () => {
  let performanceAnalyticsService: PerformanceAnalyticsService;
  let mockSentryService: jest.Mocked<SentryService>;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockAppAnalyticsService: jest.Mocked<AppAnalyticsService>;

  beforeEach(() => {
    // Reset singleton instance
    (PerformanceAnalyticsService as any).instance = null;
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Create mock instances
    mockSentryService = {
      getInstance: jest.fn().mockReturnThis(),
      isReady: jest.fn().mockReturnValue(true),
      capturePerformance: jest.fn(),
      captureMessage: jest.fn(),
      addBreadcrumb: jest.fn()
    } as any;

    mockAnalyticsService = {
      getInstance: jest.fn().mockReturnThis(),
      isReady: jest.fn().mockReturnValue(true),
      trackPerformance: jest.fn(),
      track: jest.fn()
    } as any;

    mockAppAnalyticsService = {
      getInstance: jest.fn().mockReturnThis(),
      trackPerformance: jest.fn()
    } as any;

    // Mock the static getInstance methods
    (SentryService.getInstance as jest.Mock).mockReturnValue(mockSentryService);
    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalyticsService);
    (AppAnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAppAnalyticsService);

    performanceAnalyticsService = PerformanceAnalyticsService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceAnalyticsService.getInstance();
      const instance2 = PerformanceAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize service dependencies', () => {
      expect(SentryService.getInstance).toHaveBeenCalled();
      expect(AnalyticsService.getInstance).toHaveBeenCalled();
      expect(AppAnalyticsService.getInstance).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with all monitoring enabled', () => {
      performanceAnalyticsService.initialize();

      expect(mockConsoleInfo).toHaveBeenCalledWith('Performance analytics initialized successfully');
      expect(global.PerformanceObserver).toHaveBeenCalledTimes(6); // All monitoring types
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['paint'] });
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['first-input'] });
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['layout-shift'] });
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['navigation'] });
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['resource'] });
      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['longtask'] });
    });

    it('should only initialize once', () => {
      performanceAnalyticsService.initialize();
      performanceAnalyticsService.initialize();

      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
      expect(global.PerformanceObserver).toHaveBeenCalledTimes(6);
    });

    it('should handle initialization errors gracefully', () => {
      (global.PerformanceObserver as any).mockImplementationOnce(() => {
        throw new Error('PerformanceObserver not supported');
      });

      performanceAnalyticsService.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to initialize performance analytics:',
        expect.any(Error)
      );
    });

    it('should set up periodic reporting', () => {
      performanceAnalyticsService.initialize();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 120000); // 2 minutes
      expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('should set up memory monitoring when available', () => {
      performanceAnalyticsService.initialize();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000); // 30 seconds
    });

    it('should skip memory monitoring when not available', () => {
      delete (global.performance as any).memory;

      performanceAnalyticsService.initialize();

      // Should still initialize but without memory monitoring interval
      expect(mockConsoleInfo).toHaveBeenCalledWith('Performance analytics initialized successfully');
    });
  });

  describe('Custom Metric Tracking', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track custom metrics with default parameters', () => {
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(12345);

      performanceAnalyticsService.trackMetric('custom_operation', 150);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'custom_operation',
        150,
        'ms',
        undefined
      );
      expect(mockSentryService.capturePerformance).toHaveBeenCalledWith(
        'custom_operation',
        150,
        undefined
      );

      mockDateNow.mockRestore();
    });

    it('should track custom metrics with all parameters', () => {
      const context = { userId: '123', feature: 'alarm' };

      performanceAnalyticsService.trackMetric('alarm_creation', 250, 'ms', 'interaction', context);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'alarm_creation',
        250,
        'ms',
        context
      );
      expect(mockSentryService.capturePerformance).toHaveBeenCalledWith(
        'alarm_creation',
        250,
        context
      );
    });

    it('should handle unavailable analytics services', () => {
      mockAnalyticsService.isReady.mockReturnValue(false);
      mockSentryService.isReady.mockReturnValue(false);

      expect(() => {
        performanceAnalyticsService.trackMetric('test_metric', 100);
      }).not.toThrow();

      expect(mockAnalyticsService.trackPerformance).not.toHaveBeenCalled();
      expect(mockSentryService.capturePerformance).not.toHaveBeenCalled();
    });

    it('should limit stored metrics to last 100', () => {
      // Track 105 metrics
      for (let i = 0; i < 105; i++) {
        performanceAnalyticsService.trackMetric(`metric_${i}`, i);
      }

      const summary = performanceAnalyticsService.getPerformanceSummary();
      expect(summary.metrics).toHaveLength(20); // Returns last 20 for summary
    });

    it('should check performance thresholds', () => {
      // Track a metric that exceeds poor threshold for FCP (> 4000ms)
      performanceAnalyticsService.trackMetric('FCP', 5000);

      expect(mockSentryService.captureMessage).toHaveBeenCalledWith(
        'Poor performance detected: FCP',
        'warning',
        {
          component: 'performance-analytics',
          metadata: {
            metric: 'FCP',
            value: 5000,
            threshold: 'poor',
            context: undefined
          }
        }
      );
    });
  });

  describe('Performance Measurement', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
      (global.performance.now as jest.Mock).mockReturnValueOnce(1000).mockReturnValueOnce(1250);
    });

    it('should provide measurement function', () => {
      const endMeasurement = performanceAnalyticsService.startMeasurement('test_operation');
      const duration = endMeasurement();

      expect(duration).toBe(250);
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'test_operation',
        250,
        'ms',
        undefined
      );
    });
  });

  describe('Alarm Performance Tracking', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track successful alarm operations', () => {
      const metadata = { alarmId: 'alarm-123', type: 'wake_up' };

      performanceAnalyticsService.trackAlarmPerformance('create', 120, true, metadata);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'alarm_create',
        120,
        'ms',
        { success: true, operation: 'create', ...metadata }
      );
      expect(mockAppAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'alarm_create',
        120,
        { success: true, ...metadata }
      );
    });

    it('should track failed alarm operations', () => {
      performanceAnalyticsService.trackAlarmPerformance('dismiss', 80, false);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'alarm_dismiss',
        80,
        'ms',
        { success: false, operation: 'dismiss' }
      );
    });
  });

  describe('API Request Tracking', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track successful API requests', () => {
      performanceAnalyticsService.trackApiRequest(
        'https://api.example.com/alarms?userId=123',
        'GET',
        200,
        200
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        200,
        'ms',
        {
          url: 'https://api.example.com/alarms',
          method: 'GET',
          status: 200,
          success: true
        }
      );
    });

    it('should track failed API requests', () => {
      performanceAnalyticsService.trackApiRequest(
        'https://api.example.com/alarms',
        'POST',
        300,
        500
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        300,
        'ms',
        {
          url: 'https://api.example.com/alarms',
          method: 'POST',
          status: 500,
          success: false
        }
      );
    });

    it('should report slow API requests to Sentry', () => {
      performanceAnalyticsService.trackApiRequest(
        'https://api.example.com/slow-endpoint',
        'POST',
        6000,
        200
      );

      expect(mockSentryService.captureMessage).toHaveBeenCalledWith(
        'Slow API request: POST https://api.example.com/slow-endpoint',
        'warning',
        {
          component: 'performance-analytics',
          metadata: {
            duration: 6000,
            status: 200,
            url: 'https://api.example.com/slow-endpoint'
          }
        }
      );
    });

    it('should sanitize URLs for privacy', () => {
      performanceAnalyticsService.trackApiRequest(
        'https://api.example.com/users/123/profile?token=secret&timestamp=456',
        'GET',
        150,
        200
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        150,
        'ms',
        expect.objectContaining({
          url: 'https://api.example.com/users/123/profile'
        })
      );
    });

    it('should handle invalid URLs gracefully', () => {
      performanceAnalyticsService.trackApiRequest('invalid-url', 'GET', 100, 200);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        100,
        'ms',
        expect.objectContaining({
          url: 'invalid-url'
        })
      );
    });
  });

  describe('Component Render Tracking', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track component render performance', () => {
      const props = { alarmId: '123', isActive: true };

      performanceAnalyticsService.trackComponentRender('AlarmCard', 45, props);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'component_render_AlarmCard',
        45,
        'ms',
        {
          componentName: 'AlarmCard',
          propsCount: 2
        }
      );
    });

    it('should track component render without props', () => {
      performanceAnalyticsService.trackComponentRender('SimpleButton', 15);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'component_render_SimpleButton',
        15,
        'ms',
        {
          componentName: 'SimpleButton',
          propsCount: 0
        }
      );
    });

    it('should report slow renders to Sentry', () => {
      performanceAnalyticsService.trackComponentRender('ComplexChart', 150);

      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        'Slow render: ComplexChart',
        'performance',
        { renderTime: 150, componentName: 'ComplexChart' }
      );
    });

    it('should not report fast renders to Sentry', () => {
      performanceAnalyticsService.trackComponentRender('FastButton', 50);

      expect(mockSentryService.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('Core Web Vitals Monitoring', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track First Contentful Paint (FCP)', () => {
      const fcpEntry = { name: 'first-contentful-paint', startTime: 1200 };
      const mockList = { getEntries: jest.fn().mockReturnValue([fcpEntry]) };
      
      // Trigger FCP observation
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'FCP',
        1200,
        'ms',
        undefined
      );

      const webVitals = performanceAnalyticsService.getWebVitals();
      expect(webVitals.FCP).toBe(1200);
    });

    it('should track Largest Contentful Paint (LCP)', () => {
      const lcpEntries = [
        { renderTime: 1500, loadTime: 1600 },
        { renderTime: 1800, loadTime: 1900 }
      ];
      const mockList = { getEntries: jest.fn().mockReturnValue(lcpEntries) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'LCP',
        1800, // Latest entry renderTime
        'ms',
        undefined
      );

      const webVitals = performanceAnalyticsService.getWebVitals();
      expect(webVitals.LCP).toBe(1800);
    });

    it('should use loadTime when renderTime is not available for LCP', () => {
      const lcpEntry = { loadTime: 1700 };
      const mockList = { getEntries: jest.fn().mockReturnValue([lcpEntry]) };
      
      mockPerformanceObserver(mockList);

      const webVitals = performanceAnalyticsService.getWebVitals();
      expect(webVitals.LCP).toBe(1700);
    });

    it('should track First Input Delay (FID)', () => {
      const fidEntry = { startTime: 1000, processingStart: 1050 };
      const mockList = { getEntries: jest.fn().mockReturnValue([fidEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'FID',
        50,
        'ms',
        undefined
      );

      const webVitals = performanceAnalyticsService.getWebVitals();
      expect(webVitals.FID).toBe(50);
    });

    it('should track Cumulative Layout Shift (CLS)', () => {
      const clsEntries = [
        { value: 0.05, hadRecentInput: false },
        { value: 0.03, hadRecentInput: false },
        { value: 0.02, hadRecentInput: true } // Should be ignored
      ];
      const mockList = { getEntries: jest.fn().mockReturnValue(clsEntries) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'CLS',
        0.08, // 0.05 + 0.03 (ignoring recent input)
        'score',
        undefined
      );

      const webVitals = performanceAnalyticsService.getWebVitals();
      expect(webVitals.CLS).toBe(0.08);
    });

    it('should track Time to First Byte (TTFB)', () => {
      const navEntry = { requestStart: 100, responseStart: 250 } as PerformanceNavigationTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([navEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'TTFB',
        150,
        'ms',
        undefined
      );

      const webVitals = performanceAnalyticsService.getWebVitals();
      expect(webVitals.TTFB).toBe(150);
    });
  });

  describe('Resource Monitoring', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track resource loading performance', () => {
      const resourceEntries = [
        {
          name: 'https://example.com/app.js',
          startTime: 100,
          responseEnd: 300,
          transferSize: 50000
        } as PerformanceResourceTiming,
        {
          name: 'https://example.com/styles.css',
          startTime: 150,
          responseEnd: 250,
          transferSize: 20000
        } as PerformanceResourceTiming
      ];
      const mockList = { getEntries: jest.fn().mockReturnValue(resourceEntries) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        200, // 300 - 100
        'ms',
        {
          url: 'https://example.com/app.js',
          type: 'script',
          size: 50000
        }
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        100, // 250 - 150
        'ms',
        {
          url: 'https://example.com/styles.css',
          type: 'stylesheet',
          size: 20000
        }
      );
    });

    it('should categorize different resource types correctly', () => {
      const resourceEntries = [
        { name: 'app.js', startTime: 0, responseEnd: 100, transferSize: 0 },
        { name: 'styles.css', startTime: 0, responseEnd: 100, transferSize: 0 },
        { name: 'image.png', startTime: 0, responseEnd: 100, transferSize: 0 },
        { name: 'font.woff2', startTime: 0, responseEnd: 100, transferSize: 0 },
        { name: 'data.json', startTime: 0, responseEnd: 100, transferSize: 0 }
      ] as PerformanceResourceTiming[];
      const mockList = { getEntries: jest.fn().mockReturnValue(resourceEntries) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load', 100, 'ms', expect.objectContaining({ type: 'script' })
      );
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load', 100, 'ms', expect.objectContaining({ type: 'stylesheet' })
      );
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load', 100, 'ms', expect.objectContaining({ type: 'image' })
      );
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load', 100, 'ms', expect.objectContaining({ type: 'font' })
      );
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load', 100, 'ms', expect.objectContaining({ type: 'other' })
      );
    });
  });

  describe('Long Task Monitoring', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track long tasks and report to Sentry', () => {
      const longTaskEntries = [
        { duration: 120, startTime: 500 },
        { duration: 80, startTime: 1000 }
      ] as PerformanceEntry[];
      const mockList = { getEntries: jest.fn().mockReturnValue(longTaskEntries) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'long_task',
        120,
        'ms',
        { startTime: 500 }
      );

      expect(mockSentryService.captureMessage).toHaveBeenCalledWith(
        'Long task detected: 120ms',
        'warning',
        {
          component: 'performance-monitor',
          metadata: { duration: 120, startTime: 500 }
        }
      );
    });
  });

  describe('Navigation Monitoring', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track navigation timing metrics', () => {
      const navEntry = {
        fetchStart: 100,
        domContentLoadedEventStart: 800,
        domContentLoadedEventEnd: 850,
        loadEventStart: 900,
        loadEventEnd: 950,
        domInteractive: 750
      } as PerformanceNavigationTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([navEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'navigation_domContentLoaded',
        50, // 850 - 800
        'ms',
        undefined
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'navigation_loadComplete',
        50, // 950 - 900
        'ms',
        undefined
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'navigation_domInteractive',
        650, // 750 - 100
        'ms',
        undefined
      );
    });
  });

  describe('Memory Monitoring', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should track memory usage periodically', () => {
      // Fast-forward time to trigger memory monitoring
      jest.advanceTimersByTime(30000);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'memory_used',
        50, // 50MB used
        'MB',
        {
          total: 100, // 100MB total
          limit: 200  // 200MB limit
        }
      );
    });

    it('should continue monitoring memory over time', () => {
      // First interval
      jest.advanceTimersByTime(30000);
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledTimes(1);

      // Second interval
      jest.advanceTimersByTime(30000);
      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Observer Error Handling', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should handle PerformanceObserver errors gracefully', () => {
      (global.PerformanceObserver as any).mockImplementationOnce(() => {
        throw new Error('Observer creation failed');
      });

      // Reset and reinitialize to test error handling
      (PerformanceAnalyticsService as any).instance = null;
      const newInstance = PerformanceAnalyticsService.getInstance();
      newInstance.initialize();

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to observe'),
        expect.any(Error)
      );
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      delete (global as any).PerformanceObserver;

      // Reset and reinitialize
      (PerformanceAnalyticsService as any).instance = null;
      const newInstance = PerformanceAnalyticsService.getInstance();
      
      expect(() => newInstance.initialize()).not.toThrow();
    });
  });

  describe('Performance Summary and Reporting', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should generate comprehensive performance summary', () => {
      // Add some metrics
      performanceAnalyticsService.trackMetric('FCP', 1200);
      performanceAnalyticsService.trackMetric('LCP', 2800);
      performanceAnalyticsService.trackMetric('FID', 80);
      performanceAnalyticsService.trackMetric('api_request', 300);
      performanceAnalyticsService.trackMetric('api_request', 200);

      const summary = performanceAnalyticsService.getPerformanceSummary();

      expect(summary).toHaveProperty('metrics');
      expect(summary).toHaveProperty('webVitals');
      expect(summary).toHaveProperty('averages');
      expect(summary).toHaveProperty('issues');

      expect(summary.averages).toHaveProperty('FCP', 1200);
      expect(summary.averages).toHaveProperty('LCP', 2800);
      expect(summary.averages).toHaveProperty('FID', 80);
      expect(summary.averages).toHaveProperty('api_request', 250); // (300 + 200) / 2
    });

    it('should identify performance issues correctly', () => {
      // Add metrics with performance issues
      performanceAnalyticsService.trackMetric('FCP', 5000); // Poor (> 4000)
      performanceAnalyticsService.trackMetric('LCP', 3500); // Needs improvement (> 3000)
      performanceAnalyticsService.trackMetric('FID', 200);  // Good (< 300)

      const summary = performanceAnalyticsService.getPerformanceSummary();

      expect(summary.issues).toHaveLength(2);
      
      const fcpIssue = summary.issues.find(issue => issue.metric === 'FCP');
      expect(fcpIssue).toEqual({
        metric: 'FCP',
        value: 5000,
        threshold: 'poor',
        severity: 'critical'
      });

      const lcpIssue = summary.issues.find(issue => issue.metric === 'LCP');
      expect(lcpIssue).toEqual({
        metric: 'LCP',
        value: 3500,
        threshold: 'needs-improvement',
        severity: 'warning'
      });
    });

    it('should report performance summary periodically', () => {
      performanceAnalyticsService.trackMetric('FCP', 1500);

      // Fast-forward to trigger periodic reporting
      jest.advanceTimersByTime(120000); // 2 minutes

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'performance_summary',
        expect.objectContaining({
          webVitals: expect.any(Object),
          averages: expect.any(Object),
          issuesCount: expect.any(Number),
          timestamp: expect.any(String)
        })
      );
    });

    it('should report web vitals on page unload', () => {
      // Set some web vitals
      performanceAnalyticsService.trackMetric('FCP', 1200);
      
      // Simulate beforeunload event
      const beforeUnloadCallback = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'beforeunload')?.[1];
      
      if (beforeUnloadCallback) {
        beforeUnloadCallback();
      }

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'web_vitals',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Web Vitals Access', () => {
    it('should return current web vitals', () => {
      const webVitals = performanceAnalyticsService.getWebVitals();
      
      expect(webVitals).toEqual({});
    });

    it('should return copy of web vitals to prevent mutation', () => {
      const webVitals1 = performanceAnalyticsService.getWebVitals();
      const webVitals2 = performanceAnalyticsService.getWebVitals();
      
      webVitals1.FCP = 1000;
      expect(webVitals2.FCP).toBeUndefined();
    });
  });

  describe('Service Integration', () => {
    it('should handle service unavailability gracefully', () => {
      mockAnalyticsService.isReady.mockReturnValue(false);
      mockSentryService.isReady.mockReturnValue(false);

      performanceAnalyticsService.initialize();
      performanceAnalyticsService.trackMetric('test_metric', 100);

      expect(mockAnalyticsService.trackPerformance).not.toHaveBeenCalled();
      expect(mockSentryService.capturePerformance).not.toHaveBeenCalled();
    });

    it('should work with partial service availability', () => {
      mockAnalyticsService.isReady.mockReturnValue(true);
      mockSentryService.isReady.mockReturnValue(false);

      performanceAnalyticsService.initialize();
      performanceAnalyticsService.trackMetric('test_metric', 100);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalled();
      expect(mockSentryService.capturePerformance).not.toHaveBeenCalled();
    });
  });

  describe('URL Sanitization', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should sanitize URLs by removing query parameters and fragments', () => {
      performanceAnalyticsService.trackApiRequest(
        'https://api.example.com/users?id=123&token=secret#section',
        'GET',
        200,
        200
      );

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        200,
        'ms',
        expect.objectContaining({
          url: 'https://api.example.com/users'
        })
      );
    });

    it('should handle invalid URLs', () => {
      performanceAnalyticsService.trackApiRequest('not-a-valid-url', 'GET', 200, 200);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        200,
        'ms',
        expect.objectContaining({
          url: 'invalid-url'
        })
      );
    });
  });

  describe('Resource Type Detection', () => {
    beforeEach(() => {
      performanceAnalyticsService.initialize();
    });

    it('should detect JavaScript files', () => {
      const resourceEntry = {
        name: 'https://example.com/app.js',
        startTime: 0,
        responseEnd: 100,
        transferSize: 0
      } as PerformanceResourceTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([resourceEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        100,
        'ms',
        expect.objectContaining({ type: 'script' })
      );
    });

    it('should detect CSS files', () => {
      const resourceEntry = {
        name: 'https://example.com/styles.css',
        startTime: 0,
        responseEnd: 100,
        transferSize: 0
      } as PerformanceResourceTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([resourceEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        100,
        'ms',
        expect.objectContaining({ type: 'stylesheet' })
      );
    });

    it('should detect image files', () => {
      const resourceEntry = {
        name: 'https://example.com/image.png',
        startTime: 0,
        responseEnd: 100,
        transferSize: 0
      } as PerformanceResourceTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([resourceEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        100,
        'ms',
        expect.objectContaining({ type: 'image' })
      );
    });

    it('should detect font files', () => {
      const resourceEntry = {
        name: 'https://example.com/font.woff2',
        startTime: 0,
        responseEnd: 100,
        transferSize: 0
      } as PerformanceResourceTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([resourceEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        100,
        'ms',
        expect.objectContaining({ type: 'font' })
      );
    });

    it('should categorize unknown files as other', () => {
      const resourceEntry = {
        name: 'https://example.com/data.xml',
        startTime: 0,
        responseEnd: 100,
        transferSize: 0
      } as PerformanceResourceTiming;
      const mockList = { getEntries: jest.fn().mockReturnValue([resourceEntry]) };
      
      mockPerformanceObserver(mockList);

      expect(mockAnalyticsService.trackPerformance).toHaveBeenCalledWith(
        'resource_load',
        100,
        'ms',
        expect.objectContaining({ type: 'other' })
      );
    });
  });
});