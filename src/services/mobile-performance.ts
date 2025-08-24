/// <reference types="node" />
/// <reference lib="dom" />
// Enhanced Mobile Performance Optimization Service
export interface PerformanceConfig {
  enableMemoryMonitoring: boolean;
  enableBatteryOptimization: boolean;
  enableNetworkOptimization: boolean;
  lazyLoadingThreshold: number;
  memoryWarningThreshold: number;
  batteryLowThreshold: number;
}

export interface PerformanceMetrics {
  memoryUsage: number;
  memoryLimit: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  networkSpeed: 'slow' | 'medium' | 'fast';
  devicePerformance: 'low' | 'medium' | 'high';
  lastUpdated: number;
}

export class MobilePerformanceService {
  private static instance: MobilePerformanceService;
  private observers: Map<string, IntersectionObserver> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private listeners: Array<(metrics: PerformanceMetrics
) => void> = [];
  private config: PerformanceConfig;
  private monitoringInterval?: number;
  private isLowPowerMode = false;

  private defaultConfig: PerformanceConfig = {
    enableMemoryMonitoring: true,
    enableBatteryOptimization: true,
    enableNetworkOptimization: true,
    lazyLoadingThreshold: 0.1,
    memoryWarningThreshold: 0.8,
    batteryLowThreshold: 0.2,
  };

  private constructor() {
    this.config = { ...this.defaultConfig };
    this.performanceMetrics = {
      memoryUsage: 0,
      memoryLimit: 0,
      networkSpeed: 'medium',
      devicePerformance: 'medium',
      lastUpdated: Date.now(),
    };
  }

  static getInstance(): MobilePerformanceService {
    if (!MobilePerformanceService.instance) {
      MobilePerformanceService.instance = new MobilePerformanceService();
    }
    return MobilePerformanceService.instance;
  }

  // Initialize performance monitoring with config
  initialize(config?: Partial<PerformanceConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.setupIntersectionObserver();

    if (this.config.enableMemoryMonitoring) {
      this.setupMemoryMonitoring();
    }

    if (this.config.enableBatteryOptimization) {
      this.setupBatteryOptimization();
    }

    if (this.config.enableNetworkOptimization) {
      this.setupNetworkOptimization();
    }

    this.detectDeviceCapabilities();
    this.startPerformanceMonitoring();

    console.log(
      '[Performance] Mobile optimizations initialized with config:',
      this.config
    );
  }

  // Enhanced lazy loading with intersection observer
  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: this.config.lazyLoadingThreshold,
    };

    const imageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;

          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');

            // Add load event listener for fade-in effect
            img.addEventListener(
              'load',
              (
) => {
                img.style.opacity = '1';
              },
              { once: true }
            );
          }

          imageObserver.unobserve(img);
        }
      });
    }, options);

    const contentObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.transform = 'translateY(0)';
          target.style.opacity = '1';
          target.classList.add('animate-in');
        }
      });
    }, options);

    this.observers.set('images', imageObserver);
    this.observers.set('content', contentObserver);
  }

  // Enhanced memory usage monitoring
  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      console.warn('[Performance] Memory API not available');
      return;
    }

    const checkMemory = (
) => {
      const memory = (performance as any).memory;
      const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize;
      this.performanceMetrics.memoryLimit = memory.jsHeapSizeLimit;
      this.performanceMetrics.lastUpdated = Date.now();

      // Trigger warnings and optimizations
      if (usagePercent > this.config.memoryWarningThreshold) {
        this.handleHighMemoryUsage();
      }

      this.notifyListeners();
    };

    // Initial check
    checkMemory();

    // Set up periodic monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.monitoringInterval = setInterval(checkMemory, 15000);
  }

  // Handle high memory usage scenarios
  private handleHighMemoryUsage(): void {
    console.warn('[Performance] High memory usage detected, enabling optimizations');

    // Enable aggressive optimizations
    document.body.classList.add('memory-pressure');

    // Reduce animation complexity
    document.body.classList.add('reduce-motion');

    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (e) {
        console.warn('[Performance] Manual GC failed:', e);
      }
    }

    // Notify components to reduce their memory footprint
    this.listeners.forEach(listener => {
      try {
        listener(this.performanceMetrics);
      } catch (e) {
        console.error('[Performance] Listener error:', e);
      }
    });
  }

  // Enhanced battery optimization
  private setupBatteryOptimization(): void {
    if (!('getBattery' in navigator)) {
      console.warn('[Performance] Battery API not available');
      return;
    }

    (navigator as any)
      .getBattery()
      .then((battery: any
) => {
        const updateBatteryStatus = (
) => {
          this.performanceMetrics.batteryLevel = battery.level;
          this.performanceMetrics.batteryCharging = battery.charging;
          this.performanceMetrics.lastUpdated = Date.now();

          const isLowBattery = battery.level < this.config.batteryLowThreshold;
          const shouldOptimize = isLowBattery && !battery.charging;

          if (shouldOptimize && !this.isLowPowerMode) {
            this.enableLowPowerMode();
          } else if (!isLowBattery && this.isLowPowerMode) {
            this.disableLowPowerMode();
          }

          this.notifyListeners();
        };

        // Initial check
        updateBatteryStatus();

        // Listen for battery changes
        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingtimechange', updateBatteryStatus);
        battery.addEventListener('dischargingtimechange', updateBatteryStatus);
      })
      .catch((error: any
) => {
        console.warn('[Performance] Battery API error:', error);
      });
  }

  // Enable low power mode optimizations
  private enableLowPowerMode(): void {
    if (this.isLowPowerMode) return;

    this.isLowPowerMode = true;
    console.log('[Performance] Enabling low power mode');

    document.body.classList.add('low-power-mode');
    document.body.classList.add('reduce-motion');
    document.body.classList.add('battery-saver');

    // Reduce monitoring frequency
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval((
) => {
        this.updatePerformanceMetrics();
      }, 30000); // Reduce to 30 seconds
    }
  }

  // Disable low power mode optimizations
  private disableLowPowerMode(): void {
    if (!this.isLowPowerMode) return;

    this.isLowPowerMode = false;
    console.log('[Performance] Disabling low power mode');

    document.body.classList.remove('low-power-mode');
    document.body.classList.remove('reduce-motion');
    document.body.classList.remove('battery-saver');

    // Restore normal monitoring frequency
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval((
) => {
        this.updatePerformanceMetrics();
      }, 15000); // Back to 15 seconds
    }
  }

  // Set up network optimization
  private setupNetworkOptimization(): void {
    if (!('connection' in navigator)) {
      console.warn('[Performance] Network Information API not available');
      return;
    }

    const connection = (navigator as any).connection;

    const updateNetworkStatus = (
) => {
      const effectiveType = connection.effectiveType || '4g';
      const saveData = connection.saveData || false;

      // Classify network speed
      if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
        this.performanceMetrics.networkSpeed = 'slow';
        document.body.classList.add('slow-network');
      } else if (effectiveType === '3g') {
        this.performanceMetrics.networkSpeed = 'medium';
        document.body.classList.remove('slow-network');
      } else {
        this.performanceMetrics.networkSpeed = 'fast';
        document.body.classList.remove('slow-network');
      }

      this.performanceMetrics.lastUpdated = Date.now();
      this.notifyListeners();
    };

    updateNetworkStatus();
    connection.addEventListener('change', updateNetworkStatus);
  }

  // Detect device capabilities
  private detectDeviceCapabilities(): void {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const pixelRatio = window.devicePixelRatio || 1;

    // Classify device performance
    if (deviceMemory <= 2 || hardwareConcurrency <= 2) {
      this.performanceMetrics.devicePerformance = 'low';
      document.body.classList.add('low-performance-device');
    } else if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
      this.performanceMetrics.devicePerformance = 'medium';
    } else {
      this.performanceMetrics.devicePerformance = 'high';
      document.body.classList.add('high-performance-device');
    }

    // Handle high DPI displays
    if (pixelRatio > 2) {
      document.body.classList.add('high-dpi');
    }

    console.log(
      `[Performance] Device capabilities - Memory: ${deviceMemory}GB, CPU: ${hardwareConcurrency} cores, Performance: ${this.performanceMetrics.devicePerformance}`
    );
  }

  // Start performance monitoring
  private startPerformanceMonitoring(): void {
    this.updatePerformanceMetrics();

    // Monitor performance marks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 16.67) {
              // Longer than 60fps frame
              console.warn(
                `[Performance] Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`
              );
            }
          });
        });

        observer.observe({ entryTypes: ['measure', 'mark'] });
      } catch (e) {
        console.warn('[Performance] PerformanceObserver setup failed:', e);
      }
    }
  }

  // Update performance metrics
  private updatePerformanceMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize;
      this.performanceMetrics.memoryLimit = memory.jsHeapSizeLimit;
    }

    this.performanceMetrics.lastUpdated = Date.now();
    this.notifyListeners();
  }

  // Lazy load images with enhanced features
  lazyLoadImage(img: HTMLImageElement, options?: { priority?: 'high' | 'low' }): void {
    const imageObserver = this.observers.get('images');
    if (!imageObserver) return;

    // Add loading class for styling
    img.classList.add('lazy-loading');
    img.style.opacity = '0';

    // Set loading attribute for native lazy loading support
    if ('loading' in img) {
      img.loading = options?.priority === 'high' ? 'eager' : 'lazy';
    }

    imageObserver.observe(img);
  }

  // Lazy load content sections
  lazyLoadContent(element: HTMLElement): void {
    const contentObserver = this.observers.get('content');
    if (!contentObserver) return;

    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    contentObserver.observe(element);
  }

  // Optimize animations based on device capabilities
  optimizeAnimations(): void {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isLowPerformance = this.performanceMetrics.devicePerformance === 'low';

    if (prefersReducedMotion || isLowPerformance || this.isLowPowerMode) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Subscribe to performance updates
  subscribe(listener: (metrics: PerformanceMetrics
) => void): (
) => void {
    this.listeners.push(listener);
    return (
) => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getMetrics());
      } catch (error) {
        console.error('[Performance] Listener error:', error);
      }
    });
  }

  // Force performance optimization
  forceOptimization(): void {
    console.log('[Performance] Forcing performance optimizations');
    this.enableLowPowerMode();
    this.optimizeAnimations();

    // Clear any unnecessary intervals
    this.cleanup();
    this.initialize(this.config);
  }

  // Cleanup method
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    this.listeners = [];

    document.body.classList.remove(
      'low-power-mode',
      'reduce-motion',
      'battery-saver',
      'memory-pressure',
      'slow-network',
      'low-performance-device',
      'high-performance-device',
      'high-dpi'
    );
  }
}

export const mobilePerformance = MobilePerformanceService.getInstance();
export type { PerformanceConfig, PerformanceMetrics };
