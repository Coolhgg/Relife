import PerformanceMonitor from '../performance-monitor';

// Mock Web Vitals
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}));

// Mock performance API
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
};

const mockPerformanceEntry = {
  name: 'test-entry',
  entryType: 'measure',
  startTime: 100,
  duration: 50,
  detail: {},
};

Object.defineProperty(global, 'PerformanceObserver', {
  value: jest.fn(() => mockPerformanceObserver),
  writable: true,
});

Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => [mockPerformanceEntry]),
    getEntriesByName: jest.fn(() => [mockPerformanceEntry]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    navigation: {
      type: 0, // TYPE_NAVIGATE
    },
    timing: {
      navigationStart: 1000,
      loadEventEnd: 2000,
      domContentLoadedEventEnd: 1500,
    },
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 100000000,
    },
  },
  writable: true,
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton instance
    (PerformanceMonitor as any).instance = null;

    // Mock localStorage
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  describe('initialization', () => {
    test('creates singleton instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('initializes performance observers', () => {
      PerformanceMonitor.getInstance();

      expect(global.PerformanceObserver).toHaveBeenCalled();
      expect(mockPerformanceObserver.observe).toHaveBeenCalled();
    });

    test('starts web vitals collection', () => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals');

      PerformanceMonitor.getInstance();

      expect(getCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(getFID).toHaveBeenCalledWith(expect.any(Function));
      expect(getFCP).toHaveBeenCalledWith(expect.any(Function));
      expect(getLCP).toHaveBeenCalledWith(expect.any(Function));
      expect(getTTFB).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('performance tracking', () => {
    test('starts tracking with performance mark', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.startTracking('test-operation');

      expect(performance.mark).toHaveBeenCalledWith('test-operation-start');
    });

    test('ends tracking with performance measure', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.startTracking('test-operation');
      monitor.endTracking('test-operation');

      expect(performance.mark).toHaveBeenCalledWith('test-operation-end');
      expect(performance.measure).toHaveBeenCalledWith(
        'test-operation',
        'test-operation-start',
        'test-operation-end'
      );
    });

    test('returns tracking result with duration', () => {
      const monitor = PerformanceMonitor.getInstance();

      // Mock performance.getEntriesByName to return a measure
      performance.getEntriesByName = jest.fn(() => [{
        name: 'test-operation',
        duration: 150,
        startTime: 100,
      }]);

      monitor.startTracking('test-operation');
      const result = monitor.endTracking('test-operation');

      expect(result).toEqual({
        name: 'test-operation',
        duration: 150,
        startTime: 100,
        endTime: 250,
      });
    });

    test('handles tracking operation that was not started', () => {
      const monitor = PerformanceMonitor.getInstance();

      const result = monitor.endTracking('non-existent-operation');

      expect(result).toBeNull();
    });

    test('prevents duplicate tracking starts', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.startTracking('duplicate-test');
      monitor.startTracking('duplicate-test');

      // Should only call performance.mark once
      expect(performance.mark).toHaveBeenCalledTimes(1);
    });
  });

  describe('user action tracking', () => {
    test('tracks user actions with context', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.trackUserAction('button-click', {
        buttonId: 'save-button',
        page: 'alarm-form',
      });

      // Should store the action (implementation detail)
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('includes timestamp in user action', () => {
      const mockNow = 1234567890;
      performance.now = jest.fn(() => mockNow);

      const monitor = PerformanceMonitor.getInstance();

      monitor.trackUserAction('click', { target: 'button' });

      // Verify timestamp is included
      const storedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(storedData.timestamp).toBe(mockNow);
    });
  });

  describe('web vitals collection', () => {
    test('collects and stores CLS metric', () => {
      const { getCLS } = require('web-vitals');
      const monitor = PerformanceMonitor.getInstance();

      // Simulate CLS callback
      const clsCallback = getCLS.mock.calls[0][0];
      clsCallback({
        name: 'CLS',
        value: 0.1,
        id: 'test-cls-id',
        delta: 0.05,
      });

      const metrics = monitor.getWebVitals();
      expect(metrics.cls).toBe(0.1);
    });

    test('collects and stores FID metric', () => {
      const { getFID } = require('web-vitals');
      const monitor = PerformanceMonitor.getInstance();

      const fidCallback = getFID.mock.calls[0][0];
      fidCallback({
        name: 'FID',
        value: 50,
        id: 'test-fid-id',
        delta: 25,
      });

      const metrics = monitor.getWebVitals();
      expect(metrics.fid).toBe(50);
    });

    test('collects all core web vitals', () => {
      const webVitals = require('web-vitals');
      const monitor = PerformanceMonitor.getInstance();

      // Simulate all vitals callbacks
      webVitals.getCLS.mock.calls[0][0]({ name: 'CLS', value: 0.1 });
      webVitals.getFID.mock.calls[0][0]({ name: 'FID', value: 50 });
      webVitals.getFCP.mock.calls[0][0]({ name: 'FCP', value: 1500 });
      webVitals.getLCP.mock.calls[0][0]({ name: 'LCP', value: 2000 });
      webVitals.getTTFB.mock.calls[0][0]({ name: 'TTFB', value: 200 });

      const metrics = monitor.getWebVitals();
      expect(metrics).toEqual({
        cls: 0.1,
        fid: 50,
        fcp: 1500,
        lcp: 2000,
        ttfb: 200,
      });
    });
  });

  describe('resource performance', () => {
    test('tracks resource loading times', () => {
      const monitor = PerformanceMonitor.getInstance();

      // Mock performance entries for resources
      performance.getEntriesByType = jest.fn(() => [
        {
          name: 'https://example.com/script.js',
          entryType: 'resource',
          startTime: 100,
          responseEnd: 250,
          transferSize: 1024,
        },
        {
          name: 'https://example.com/style.css',
          entryType: 'resource',
          startTime: 50,
          responseEnd: 200,
          transferSize: 2048,
        },
      ]);

      const resources = monitor.getResourcePerformance();

      expect(resources).toHaveLength(2);
      expect(resources[0]).toEqual({
        name: 'https://example.com/script.js',
        duration: 150,
        size: 1024,
        type: 'script',
      });
    });

    test('categorizes resource types correctly', () => {
      const monitor = PerformanceMonitor.getInstance();

      performance.getEntriesByType = jest.fn(() => [
        {
          name: 'https://example.com/image.png',
          entryType: 'resource',
          startTime: 100,
          responseEnd: 300,
          transferSize: 5000,
        },
      ]);

      const resources = monitor.getResourcePerformance();

      expect(resources[0].type).toBe('image');
    });
  });

  describe('memory monitoring', () => {
    test('tracks memory usage', () => {
      const monitor = PerformanceMonitor.getInstance();

      const memoryInfo = monitor.getMemoryUsage();

      expect(memoryInfo).toEqual({
        used: 10000000,
        total: 20000000,
        limit: 100000000,
        percentage: 10,
      });
    });

    test('handles browsers without memory API', () => {
      const originalMemory = performance.memory;
      delete (performance as any).memory;

      const monitor = PerformanceMonitor.getInstance();

      const memoryInfo = monitor.getMemoryUsage();

      expect(memoryInfo).toBeNull();

      // Restore
      (performance as any).memory = originalMemory;
    });
  });

  describe('navigation timing', () => {
    test('calculates page load time', () => {
      const monitor = PerformanceMonitor.getInstance();

      const loadTime = monitor.getPageLoadTime();

      // loadEventEnd - navigationStart = 2000 - 1000 = 1000ms
      expect(loadTime).toBe(1000);
    });

    test('calculates DOM content loaded time', () => {
      const monitor = PerformanceMonitor.getInstance();

      const domTime = monitor.getDOMContentLoadedTime();

      // domContentLoadedEventEnd - navigationStart = 1500 - 1000 = 500ms
      expect(domTime).toBe(500);
    });
  });

  describe('data persistence', () => {
    test('saves performance data to localStorage', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.trackUserAction('test-action', { data: 'test' });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'performance-data',
        expect.any(String)
      );
    });

    test('loads performance data from localStorage', () => {
      const testData = {
        userActions: [{ action: 'test', timestamp: 123 }],
        webVitals: { cls: 0.1 },
      };

      localStorage.getItem = jest.fn(() => JSON.stringify(testData));

      const monitor = PerformanceMonitor.getInstance();
      const data = monitor.getPerformanceData();

      expect(data.userActions).toEqual(testData.userActions);
    });

    test('handles corrupted localStorage data gracefully', () => {
      localStorage.getItem = jest.fn(() => 'invalid-json');

      const monitor = PerformanceMonitor.getInstance();
      const data = monitor.getPerformanceData();

      // Should return default empty structure
      expect(data).toEqual({
        userActions: [],
        webVitals: {},
        tracking: {},
        resources: [],
      });
    });
  });

  describe('performance budgets', () => {
    test('checks if metrics are within budget', () => {
      const monitor = PerformanceMonitor.getInstance();

      // Set performance budget
      monitor.setPerformanceBudget({
        cls: 0.1,
        fid: 100,
        lcp: 2500,
      });

      // Mock current metrics
      monitor.webVitals = { cls: 0.05, fid: 50, lcp: 2000 };

      const budgetStatus = monitor.checkPerformanceBudget();

      expect(budgetStatus.withinBudget).toBe(true);
      expect(budgetStatus.violations).toHaveLength(0);
    });

    test('identifies budget violations', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.setPerformanceBudget({
        cls: 0.1,
        fid: 100,
        lcp: 2500,
      });

      // Mock metrics that exceed budget
      monitor.webVitals = { cls: 0.15, fid: 150, lcp: 3000 };

      const budgetStatus = monitor.checkPerformanceBudget();

      expect(budgetStatus.withinBudget).toBe(false);
      expect(budgetStatus.violations).toHaveLength(3);
      expect(budgetStatus.violations).toEqual([
        { metric: 'cls', budget: 0.1, actual: 0.15 },
        { metric: 'fid', budget: 100, actual: 150 },
        { metric: 'lcp', budget: 2500, actual: 3000 },
      ]);
    });
  });

  describe('cleanup and disposal', () => {
    test('disconnects performance observers on dispose', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.dispose();

      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
    });

    test('clears performance marks and measures', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.dispose();

      expect(performance.clearMarks).toHaveBeenCalled();
      expect(performance.clearMeasures).toHaveBeenCalled();
    });

    test('saves final data before disposal', () => {
      const monitor = PerformanceMonitor.getInstance();

      monitor.dispose();

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('handles performance API unavailability gracefully', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;

      expect(() => {
        PerformanceMonitor.getInstance();
      }).not.toThrow();

      // Restore
      (global as any).performance = originalPerformance;
    });

    test('handles PerformanceObserver unavailability', () => {
      const originalPO = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      expect(() => {
        PerformanceMonitor.getInstance();
      }).not.toThrow();

      // Restore
      (global as any).PerformanceObserver = originalPO;
    });

    test('handles localStorage errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const monitor = PerformanceMonitor.getInstance();

      expect(() => {
        monitor.trackUserAction('test');
      }).not.toThrow();

      consoleError.mockRestore();
    });
  });

  describe('performance reporting', () => {
    test('generates comprehensive performance report', () => {
      const monitor = PerformanceMonitor.getInstance();

      // Setup test data
      monitor.webVitals = { cls: 0.1, fid: 50, lcp: 2000, fcp: 1500, ttfb: 200 };
      monitor.trackUserAction('test-action');

      const report = monitor.generatePerformanceReport();

      expect(report).toEqual({
        timestamp: expect.any(Number),
        webVitals: monitor.webVitals,
        navigationTiming: {
          pageLoadTime: 1000,
          domContentLoadedTime: 500,
        },
        resourcePerformance: expect.any(Array),
        memoryUsage: expect.any(Object),
        userActions: expect.any(Array),
        performanceBudget: expect.any(Object),
      });
    });

    test('exports performance data for analysis', () => {
      const monitor = PerformanceMonitor.getInstance();

      const exportData = monitor.exportPerformanceData();

      expect(exportData).toMatch(/^data:application\/json;charset=utf-8,/);

      const jsonData = JSON.parse(
        decodeURIComponent(exportData.split(',')[1])
      );
      expect(jsonData).toHaveProperty('webVitals');
      expect(jsonData).toHaveProperty('userActions');
    });
  });
});