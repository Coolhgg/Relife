import type { PerformanceConfig } from './types/performance';
import { TimeoutHandle } from '../types/timers';

export interface DeviceCapabilities {
  memory: number; // GB
  cores: number;
  connectionType: string;
  pixelRatio: number;
  touchSupport: boolean;
  hardwareAcceleration: boolean;
  webglSupport: boolean;
  audioContextSupport: boolean;
  serviceWorkerSupport: boolean;
  indexedDBSupport: boolean;
  userAgent: string;
  platform: string;
  screenSize: {
    width: number;
    height: number;
    availableWidth: number;
    availableHeight: number;
  };
}

export interface DevicePerformanceMetrics {
  renderingFPS: number;
  memoryUsage: number; // MB
  networkLatency: number; // ms
  storageSpeed: number; // operations/second
  batteryLevel?: number;
  isCharging?: boolean;
  cpuSpeed: number; // relative score
  gpuTier: 'low' | 'medium' | 'high' | 'unknown';
}

export type DeviceTier = 'low-end' | 'mid-range' | 'high-end';

export interface AdaptiveConfig {
  tier: DeviceTier;
  performance: PerformanceConfig;
  features: {
    animationsEnabled: boolean;
    complexUIEnabled: boolean;
    highQualityAudioEnabled: boolean;
    backgroundSyncEnabled: boolean;
    offlineStorageSize: number; // MB
    preloadingEnabled: boolean;
    virtualScrollingEnabled: boolean;
    memoryMonitoringEnabled: boolean;
    compressionLevel: 'none' | 'light' | 'medium' | 'heavy';
  };
  limits: {
    maxCacheSize: number; // MB
    maxAudioQuality: 'low' | 'medium' | 'high';
    maxConcurrentOperations: number;
    performanceMonitoringInterval: number; // ms
    metricHistorySize: number;
    maxPreloadDistance: number; // minutes
  };
}

export class DeviceCapabilityDetector {
  private static instance: DeviceCapabilityDetector | null = null;
  private capabilities: DeviceCapabilities | null = null;
  private metrics: DevicePerformanceMetrics | null = null;
  private tier: DeviceTier | null = null;
  private config: AdaptiveConfig | null = null;
  private isDetecting = false;
  private listeners: Array<(config: AdaptiveConfig) => void> = [];

  private constructor() {}

  static getInstance(): DeviceCapabilityDetector {
    if (!this.instance) {
      this.instance = new DeviceCapabilityDetector();
    }
    return this.instance;
  }

  async initialize(): Promise<AdaptiveConfig> {
    if (this.config) return this.config;
    if (this.isDetecting) {
      // Wait for ongoing detection to complete
      return new Promise(resolve => {
        const checkComplete = () => {
          if (this.config) {
            resolve(this.config);
          } else {
            setTimeout(checkComplete, 100);
          }
        };
        checkComplete();
      });
    }

    this.isDetecting = true;

    try {
      // Detect device capabilities
      this.capabilities = await this.detectCapabilities();

      // Measure performance metrics
      this.metrics = await this.measurePerformance();

      // Determine device tier
      this.tier = this.calculateDeviceTier();

      // Generate adaptive configuration
      this.config = this.generateAdaptiveConfig();

      console.log('Device capabilities detected:', {
        tier: this.tier,
        capabilities: this.capabilities,
        metrics: this.metrics,
      });

      // Notify listeners
      this.notifyListeners();

      return this.config;
    } finally {
      this.isDetecting = false;
    }
  }

  private async detectCapabilities(): Promise<DeviceCapabilities> {
    const capabilities: DeviceCapabilities = {
      memory: this.detectMemory(),
      cores: this.detectCores(),
      connectionType: this.detectConnection(),
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      hardwareAcceleration: await this.detectHardwareAcceleration(),
      webglSupport: this.detectWebGLSupport(),
      audioContextSupport: this.detectAudioContextSupport(),
      serviceWorkerSupport: 'serviceWorker' in navigator,
      indexedDBSupport: 'indexedDB' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
        availableWidth: window.screen.availWidth,
        availableHeight: window.screen.availHeight,
      },
    };

    return capabilities;
  }

  private detectMemory(): number {
    // Try modern API first
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }

    // Fallback heuristics based on other indicators
    const userAgent = navigator.userAgent.toLowerCase();

    // Mobile device memory estimation
    if (/mobile|android|iphone|ipad/.test(userAgent)) {
      if (/iphone|ipad/.test(userAgent)) {
        // iOS devices - rough estimation based on model
        const match = userAgent.match(/os (\d+)_/);
        if (match) {
          const version = parseInt(match[1]);
          if (version >= 14) return 4; // Modern iOS devices
          if (version >= 11) return 3; // Mid-range iOS
          return 2; // Older iOS devices
        }
        return 3; // Default iOS assumption
      }

      // Android devices
      if (/android/.test(userAgent)) {
        // Very rough Android estimation
        const match = userAgent.match(/android (\d+)/);
        if (match) {
          const version = parseInt(match[1]);
          if (version >= 10) return 4; // Modern Android
          if (version >= 7) return 3; // Mid-range Android
          return 2; // Older Android
        }
        return 2; // Conservative Android default
      }

      return 2; // Generic mobile default
    }

    // Desktop estimation (usually higher)
    return 8; // Conservative desktop default
  }

  private detectCores(): number {
    return navigator.hardwareConcurrency || 2; // Fallback to 2 cores
  }

  private detectConnection(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  private async detectHardwareAcceleration(): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return false;

      const renderer = gl.getParameter(gl.RENDERER) || '';
      return !renderer.includes('Software');
    } catch {
      return false;
    }
  }

  private detectWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private detectAudioContextSupport(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  private async measurePerformance(): Promise<DevicePerformanceMetrics> {
    const metrics: DevicePerformanceMetrics = {
      renderingFPS: await this.measureFPS(),
      memoryUsage: this.measureMemoryUsage(),
      networkLatency: await this.measureNetworkLatency(),
      storageSpeed: await this.measureStorageSpeed(),
      cpuSpeed: await this.measureCPUSpeed(),
      gpuTier: this.detectGPUTier(),
    };

    // Try to get battery information if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        metrics.batteryLevel = battery.level * 100;
        metrics.isCharging = battery.charging;
      } catch {
        // Battery API not available or blocked
      }
    }

    return metrics;
  }

  private async measureFPS(): Promise<number> {
    return new Promise(resolve => {
      const lastTime = performance.now();
      let frames = 0;
      const duration = 1000; // Measure for 1 second

      const measureFrame = (currentTime: number) => {
        frames++;
        const elapsed = currentTime - lastTime;

        if (elapsed >= duration) {
          const fps = Math.round((frames * 1000) / elapsed);
          resolve(Math.min(fps, 60)); // Cap at 60 FPS
        } else {
          requestAnimationFrame(measureFrame);
        }
      };

      requestAnimationFrame(measureFrame);
    });
  }

  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }

    // Estimation based on device characteristics
    return this.capabilities?.memory ? this.capabilities.memory * 256 : 512; // Rough estimate
  }

  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = performance.now();
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      return Math.round(performance.now() - start);
    } catch {
      return 1000; // Conservative estimate if fetch fails
    }
  }

  private async measureStorageSpeed(): Promise<number> {
    try {
      const testData = 'x'.repeat(1024); // 1KB test data
      const iterations = 10;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        localStorage.setItem(`test_${i}`, testData);
        localStorage.getItem(`test_${i}`);
        localStorage.removeItem(`test_${i}`);
      }

      const elapsed = performance.now() - start;
      return Math.round((iterations * 1000) / elapsed); // Operations per second
    } catch {
      return 100; // Conservative fallback
    }
  }

  private async measureCPUSpeed(): Promise<number> {
    // Simple CPU benchmark - calculate primes
    const start = performance.now();
    let primes = 0;
    const limit = 10000;

    for (let i = 2; i <= limit; i++) {
      let isPrime = true;
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes++;
    }

    const elapsed = performance.now() - start;
    // Normalize to a score (lower time = higher score)
    return Math.round(10000 / Math.max(elapsed, 1));
  }

  private detectGPUTier(): 'low' | 'medium' | 'high' | 'unknown' {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'unknown';

      const renderer = gl.getParameter(gl.RENDERER) || '';
      const vendor = gl.getParameter(gl.VENDOR) || '';

      const gpu = `${vendor} ${renderer}`.toLowerCase();

      // High-end GPU indicators
      if (gpu.includes('nvidia') && (gpu.includes('rtx') || gpu.includes('gtx'))) {
        return 'high';
      }
      if (gpu.includes('radeon') && gpu.includes('rx')) {
        return 'high';
      }
      if (gpu.includes('intel') && gpu.includes('iris')) {
        return 'medium';
      }

      // Mobile GPU classification
      if (gpu.includes('adreno') || gpu.includes('mali') || gpu.includes('powervr')) {
        return 'medium';
      }

      // Software rendering or unknown
      if (gpu.includes('software') || gpu.includes('llvmpipe')) {
        return 'low';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private calculateDeviceTier(): DeviceTier {
    if (!this.capabilities || !this.metrics) {
      return 'low-end'; // Conservative fallback
    }

    const { memory, cores, hardwareAcceleration, webglSupport } = this.capabilities;
    const { renderingFPS, cpuSpeed, gpuTier } = this.metrics;

    // Scoring system (0-100)
    let score = 0;

    // Memory score (0-25 points)
    if (memory >= 8) score += 25;
    else if (memory >= 4) score += 20;
    else if (memory >= 2) score += 10;
    else score += 5;

    // CPU cores score (0-20 points)
    if (cores >= 8) score += 20;
    else if (cores >= 4) score += 15;
    else if (cores >= 2) score += 10;
    else score += 5;

    // Performance score (0-25 points)
    if (renderingFPS >= 55) score += 25;
    else if (renderingFPS >= 45) score += 20;
    else if (renderingFPS >= 30) score += 15;
    else if (renderingFPS >= 20) score += 10;
    else score += 5;

    // CPU speed score (0-15 points)
    if (cpuSpeed >= 100) score += 15;
    else if (cpuSpeed >= 50) score += 10;
    else if (cpuSpeed >= 25) score += 5;

    // GPU and acceleration score (0-15 points)
    if (gpuTier === 'high') score += 15;
    else if (gpuTier === 'medium') score += 10;
    else if (gpuTier === 'low') score += 5;

    if (hardwareAcceleration) score += 5;
    if (webglSupport) score += 5;

    // Determine tier based on total score
    if (score >= 75) return 'high-end';
    if (score >= 45) return 'mid-range';
    return 'low-end';
  }

  private generateAdaptiveConfig(): AdaptiveConfig {
    if (!this.tier) throw new Error('Device tier not calculated');

    const baseConfigs: Record<DeviceTier, AdaptiveConfig> = {
      'low-end': {
        tier: 'low-end',
        performance: {
          targetFPS: 30,
          memoryLimit: 512, // MB
          networkTimeout: 10000,
          cacheSize: 20, // MB
        },
        features: {
          animationsEnabled: false,
          complexUIEnabled: false,
          highQualityAudioEnabled: false,
          backgroundSyncEnabled: false,
          offlineStorageSize: 10, // MB
          preloadingEnabled: false,
          virtualScrollingEnabled: true,
          memoryMonitoringEnabled: true,
          compressionLevel: 'heavy',
        },
        limits: {
          maxCacheSize: 20, // MB
          maxAudioQuality: 'low',
          maxConcurrentOperations: 2,
          performanceMonitoringInterval: 60000, // 1 minute
          metricHistorySize: 50,
          maxPreloadDistance: 2, // minutes
        },
      },
      'mid-range': {
        tier: 'mid-range',
        performance: {
          targetFPS: 45,
          memoryLimit: 1024, // MB
          networkTimeout: 8000,
          cacheSize: 50, // MB
        },
        features: {
          animationsEnabled: true,
          complexUIEnabled: true,
          highQualityAudioEnabled: true,
          backgroundSyncEnabled: true,
          offlineStorageSize: 50, // MB
          preloadingEnabled: true,
          virtualScrollingEnabled: true,
          memoryMonitoringEnabled: true,
          compressionLevel: 'medium',
        },
        limits: {
          maxCacheSize: 50, // MB
          maxAudioQuality: 'medium',
          maxConcurrentOperations: 4,
          performanceMonitoringInterval: 45000, // 45 seconds
          metricHistorySize: 200,
          maxPreloadDistance: 5, // minutes
        },
      },
      'high-end': {
        tier: 'high-end',
        performance: {
          targetFPS: 60,
          memoryLimit: 2048, // MB
          networkTimeout: 5000,
          cacheSize: 100, // MB
        },
        features: {
          animationsEnabled: true,
          complexUIEnabled: true,
          highQualityAudioEnabled: true,
          backgroundSyncEnabled: true,
          offlineStorageSize: 100, // MB
          preloadingEnabled: true,
          virtualScrollingEnabled: false, // Not needed on high-end
          memoryMonitoringEnabled: true,
          compressionLevel: 'light',
        },
        limits: {
          maxCacheSize: 100, // MB
          maxAudioQuality: 'high',
          maxConcurrentOperations: 8,
          performanceMonitoringInterval: 30000, // 30 seconds
          metricHistorySize: 500,
          maxPreloadDistance: 10, // minutes
        },
      },
    };

    return baseConfigs[this.tier];
  }

  // Public getters
  getDeviceTier(): DeviceTier | null {
    return this.tier;
  }

  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  getMetrics(): DevicePerformanceMetrics | null {
    return this.metrics;
  }

  getAdaptiveConfig(): AdaptiveConfig | null {
    return this.config;
  }

  // Utility methods
  isLowEndDevice(): boolean {
    return this.tier === 'low-end';
  }

  isMidRangeDevice(): boolean {
    return this.tier === 'mid-range';
  }

  isHighEndDevice(): boolean {
    return this.tier === 'high-end';
  }

  shouldReduceAnimations(): boolean {
    // Check both device tier and user preferences
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    return prefersReduced || this.tier === 'low-end';
  }

  shouldUseVirtualScrolling(): boolean {
    return this.config?.features.virtualScrollingEnabled || false;
  }

  getOptimalAudioQuality(): 'low' | 'medium' | 'high' {
    return this.config?.limits.maxAudioQuality || 'low';
  }

  getMaxCacheSize(): number {
    return (this.config?.limits.maxCacheSize || 20) * 1024 * 1024; // Convert to bytes
  }

  // Event listeners
  onConfigChange(callback: (config: AdaptiveConfig) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    if (this.config) {
      this.listeners.forEach(callback => {
        try {
          callback(this.config!);
        } catch (error) {
          console.error('Error in device capability listener:', error);
        }
      });
    }
  }

  // Re-evaluation (useful when device conditions change)
  async reevaluate(): Promise<AdaptiveConfig> {
    this.capabilities = null;
    this.metrics = null;
    this.tier = null;
    this.config = null;

    return this.initialize();
  }
}

// Export singleton instance
export const deviceCapabilities = DeviceCapabilityDetector.getInstance();

// Performance configuration interface
export interface PerformanceConfig {
  targetFPS: number;
  memoryLimit: number;
  networkTimeout: number;
  cacheSize: number;
}

// Utility functions
export const getDeviceTier = (): DeviceTier | null => {
  return deviceCapabilities.getDeviceTier();
};

export const isLowEndDevice = (): boolean => {
  return deviceCapabilities.isLowEndDevice();
};

export const getAdaptiveConfig = (): AdaptiveConfig | null => {
  return deviceCapabilities.getAdaptiveConfig();
};

export const shouldReduceAnimations = (): boolean => {
  return deviceCapabilities.shouldReduceAnimations();
};
