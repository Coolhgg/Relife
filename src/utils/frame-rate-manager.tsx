/**
 * Advanced Frame Rate Management and Animation Optimization
 * Provides adaptive frame rate control, animation quality adjustment, and performance monitoring
 */

import React from 'react';

export interface FrameRateConfig {
  target: number; // Target FPS (e.g., 60, 30)
  adaptive: boolean; // Whether to adapt based on performance
  reducedMotion: boolean; // Respect prefers-reduced-motion
  budgetMs: number; // Frame budget in milliseconds
}

export interface AnimationConfig {
  duration: number; // Animation duration in ms
  easing: string; // CSS easing function
  complexity: 'low' | 'medium' | 'high'; // Animation complexity level
  gpuAccelerated: boolean; // Use GPU acceleration
  willChange: boolean; // Use will-change CSS property
}

export interface FrameMetrics {
  fps: number;
  averageFps: number;
  frameTimeMs: number;
  droppedFrames: number;
  renderTime: number;
  compositeTime: number;
  performanceScore: number; // 0-100
}

export interface AnimationQuality {
  level: 'minimal' | 'reduced' | 'standard' | 'enhanced';
  enableTransitions: boolean;
  enableTransforms: boolean;
  enableFilters: boolean;
  enableShadows: boolean;
  maxDuration: number;
  targetFps: number;
}

class FrameRateManager {
  private rafId?: number;
  private frameCount = 0;
  private lastTime = 0;
  private frameTimes: number[] = [];
  private maxFrameHistory = 60;
  private currentMetrics: FrameMetrics = {
    fps: 60,
    averageFps: 60,
    frameTimeMs: 16.67,
    droppedFrames: 0,
    renderTime: 0,
    compositeTime: 0,
    performanceScore: 100,
  };

  private observers: Array<(metrics: FrameMetrics) => void> = [];
  private animationRegistry = new Map<string, AnimationConfig>();
  private activeAnimations = new Set<string>();
  private performanceObserver?: PerformanceObserver;
  private config: FrameRateConfig = {
    target: 60,
    adaptive: true,
    reducedMotion: false,
    budgetMs: 16.67, // 60fps budget
  };

  constructor() {
    this.initializeFrameMonitoring();
    this.initializePerformanceObserver();
    this.checkReducedMotionPreference();
    this.setupAdaptiveFrameRate();
  }

  /**
   * Initialize frame rate monitoring
   */
  private initializeFrameMonitoring() {
    const measureFrame = (timestamp: number) => {
      if (this.lastTime) {
        const frameTime = timestamp - this.lastTime;
        this.recordFrameTime(frameTime);
        this.updateMetrics();
      }

      this.lastTime = timestamp;
      this.frameCount++;

      if (this.rafId) {
        this.rafId = requestAnimationFrame(measureFrame);
      }
    };

    this.rafId = requestAnimationFrame(measureFrame);
  }

  /**
   * Initialize performance observer for paint timing
   */
  private initializePerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              this.currentMetrics.renderTime = entry.startTime;
            }
          } else if (entry.entryType === 'measure') {
            if (entry.name.includes('composite')) {
              this.currentMetrics.compositeTime = entry.duration;
            }
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['paint', 'measure', 'navigation'],
      });
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }

  /**
   * Check for prefers-reduced-motion preference
   */
  private checkReducedMotionPreference() {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.config.reducedMotion = mediaQuery.matches;

    mediaQuery.addEventListener('change', e => {
      this.config.reducedMotion = e.matches;
      this.notifyObservers();
    });
  }

  /**
   * Setup adaptive frame rate adjustment
   */
  private setupAdaptiveFrameRate() {
    // Monitor performance and adjust frame rate target
    setInterval(() => {
      if (this.config.adaptive) {
        this.adjustFrameRateTarget();
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Record frame timing data
   */
  private recordFrameTime(frameTime: number) {
    this.frameTimes.push(frameTime);

    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift();
    }

    // Count dropped frames (>33ms = dropped frame for 30fps, >16.67ms for 60fps)
    const frameThreshold = (1000 / this.config.target) * 1.5;
    if (frameTime > frameThreshold) {
      this.currentMetrics.droppedFrames++;
    }
  }

  /**
   * Update frame rate metrics
   */
  private updateMetrics() {
    if (this.frameTimes.length === 0) return;

    const recentFrames = this.frameTimes.slice(-30); // Last 30 frames
    const averageFrameTime =
      recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length;

    this.currentMetrics.fps = Math.round(1000 / averageFrameTime);
    this.currentMetrics.averageFps = Math.round(
      1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length)
    );
    this.currentMetrics.frameTimeMs = averageFrameTime;

    // Calculate performance score (0-100)
    const targetFrameTime = 1000 / this.config.target;
    const efficiency = Math.min(targetFrameTime / averageFrameTime, 1);
    this.currentMetrics.performanceScore = Math.round(efficiency * 100);

    this.notifyObservers();
  }

  /**
   * Adjust frame rate target based on performance
   */
  private adjustFrameRateTarget() {
    const avgFps = this.currentMetrics.averageFps;
    const droppedFrameRatio = this.currentMetrics.droppedFrames / this.frameCount;

    // If dropping too many frames, reduce target
    if (droppedFrameRatio > 0.1 && avgFps < this.config.target * 0.8) {
      if (this.config.target > 30) {
        this.config.target = 30;
        this.config.budgetMs = 1000 / 30;
        console.log('Adaptive FPS: Reduced to 30fps due to performance');
      }
    }
    // If performing well, try to increase
    else if (droppedFrameRatio < 0.05 && avgFps >= this.config.target * 0.95) {
      if (this.config.target < 60) {
        this.config.target = 60;
        this.config.budgetMs = 1000 / 60;
        console.log('Adaptive FPS: Increased to 60fps due to good performance');
      }
    }
  }

  /**
   * Register an animation configuration
   */
  registerAnimation(id: string, config: AnimationConfig): void {
    // Optimize animation config based on performance
    const optimizedConfig = this.optimizeAnimationConfig(config);
    this.animationRegistry.set(id, optimizedConfig);
  }

  /**
   * Start tracking an animation
   */
  startAnimation(id: string): boolean {
    if (!this.animationRegistry.has(id)) {
      console.warn(`Animation ${id} not registered`);
      return false;
    }

    // Check if we should allow this animation
    if (!this.shouldAllowAnimation()) {
      return false;
    }

    this.activeAnimations.add(id);
    return true;
  }

  /**
   * Stop tracking an animation
   */
  stopAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  /**
   * Optimize animation configuration for current performance
   */
  private optimizeAnimationConfig(config: AnimationConfig): AnimationConfig {
    const quality = this.getOptimalAnimationQuality();

    const optimized = { ...config };

    // Adjust duration based on quality level
    switch (quality.level) {
      case 'minimal':
        optimized.duration = Math.min(config.duration, 100);
        optimized.gpuAccelerated = false;
        optimized.willChange = false;
        break;
      case 'reduced':
        optimized.duration = Math.min(config.duration, 200);
        optimized.gpuAccelerated = config.complexity === 'low';
        optimized.willChange = config.complexity === 'low';
        break;
      case 'standard':
        optimized.duration = Math.min(config.duration, quality.maxDuration);
        optimized.gpuAccelerated = config.complexity !== 'high';
        optimized.willChange = config.complexity !== 'high';
        break;
      case 'enhanced':
        // Keep original configuration
        break;
    }

    // Respect reduced motion preference
    if (this.config.reducedMotion) {
      optimized.duration = Math.min(optimized.duration, 200);
      if (config.complexity === 'high') {
        optimized.complexity = 'medium';
      }
    }

    return optimized;
  }

  /**
   * Determine if animation should be allowed
   */
  private shouldAllowAnimation(): boolean {
    // Respect reduced motion preference
    if (this.config.reducedMotion) {
      return false;
    }

    // Check performance threshold
    if (this.currentMetrics.performanceScore < 50) {
      return false;
    }

    // Limit concurrent animations on low-performance devices
    const maxConcurrentAnimations = this.currentMetrics.performanceScore < 70 ? 2 : 5;
    if (this.activeAnimations.size >= maxConcurrentAnimations) {
      return false;
    }

    return true;
  }

  /**
   * Get optimal animation quality based on current performance
   */
  getOptimalAnimationQuality(): AnimationQuality {
    const score = this.currentMetrics.performanceScore;
    const avgFps = this.currentMetrics.averageFps;

    if (this.config.reducedMotion || score < 30 || avgFps < 20) {
      return {
        level: 'minimal',
        enableTransitions: false,
        enableTransforms: false,
        enableFilters: false,
        enableShadows: false,
        maxDuration: 100,
        targetFps: 30,
      };
    }

    if (score < 50 || avgFps < 30) {
      return {
        level: 'reduced',
        enableTransitions: true,
        enableTransforms: false,
        enableFilters: false,
        enableShadows: false,
        maxDuration: 200,
        targetFps: 30,
      };
    }

    if (score < 75 || avgFps < 45) {
      return {
        level: 'standard',
        enableTransitions: true,
        enableTransforms: true,
        enableFilters: false,
        enableShadows: false,
        maxDuration: 300,
        targetFps: 45,
      };
    }

    return {
      level: 'enhanced',
      enableTransitions: true,
      enableTransforms: true,
      enableFilters: true,
      enableShadows: true,
      maxDuration: 500,
      targetFps: 60,
    };
  }

  /**
   * Get animation styles based on performance
   */
  getOptimizedAnimationStyles(baseStyles: React.CSSProperties): React.CSSProperties {
    const quality = this.getOptimalAnimationQuality();
    const styles = { ...baseStyles };

    // Remove expensive properties on low-performance devices
    if (!quality.enableFilters) {
      delete styles.filter;
      delete styles.backdropFilter;
    }

    if (!quality.enableShadows) {
      delete styles.boxShadow;
      delete styles.textShadow;
    }

    if (!quality.enableTransforms) {
      delete styles.transform;
    }

    if (!quality.enableTransitions) {
      delete styles.transition;
      delete styles.animation;
    }

    // Add GPU acceleration hints for capable devices
    if (quality.level === 'enhanced' || quality.level === 'standard') {
      styles.willChange = styles.willChange || 'transform';
      styles.transform = styles.transform || 'translateZ(0)'; // Force GPU layer
    }

    return styles;
  }

  /**
   * Create optimized CSS class names
   */
  getOptimizedClassNames(baseClasses: string): string {
    const quality = this.getOptimalAnimationQuality();
    let classes = baseClasses;

    // Add performance-specific classes
    classes += ` animation-quality-${quality.level}`;

    if (this.config.reducedMotion) {
      classes += ' reduced-motion';
    }

    if (quality.targetFps <= 30) {
      classes += ' fps-30';
    }

    return classes.trim();
  }

  /**
   * Add metrics observer
   */
  addObserver(observer: (metrics: FrameMetrics) => void): void {
    this.observers.push(observer);
  }

  /**
   * Remove metrics observer
   */
  removeObserver(observer: (metrics: FrameMetrics) => void): void {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify all observers
   */
  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.currentMetrics));
  }

  /**
   * Get current metrics
   */
  getMetrics(): FrameMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get current configuration
   */
  getConfig(): FrameRateConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<FrameRateConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.frameCount = 0;
    this.frameTimes = [];
    this.currentMetrics.droppedFrames = 0;
    this.currentMetrics.performanceScore = 100;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }

    this.observers = [];
    this.animationRegistry.clear();
    this.activeAnimations.clear();
  }
}

// Create singleton instance
export const frameRateManager = new FrameRateManager();

/**
 * React hook for frame rate monitoring
 */
export function useFrameRate() {
  const [metrics, setMetrics] = React.useState<FrameMetrics>(() =>
    frameRateManager.getMetrics()
  );

  React.useEffect(() => {
    const observer = (newMetrics: FrameMetrics) => setMetrics(newMetrics);
    frameRateManager.addObserver(observer);

    return () => frameRateManager.removeObserver(observer);
  }, []);

  return metrics;
}

/**
 * React hook for optimized animations
 */
export function useOptimizedAnimation(animationId: string, config: AnimationConfig) {
  const [isActive, setIsActive] = React.useState(false);
  const animationQuality = React.useMemo(
    () => frameRateManager.getOptimalAnimationQuality(),
    [frameRateManager.getMetrics().performanceScore]
  );

  React.useEffect(() => {
    frameRateManager.registerAnimation(animationId, config);
  }, [animationId, config]);

  const startAnimation = React.useCallback(() => {
    const allowed = frameRateManager.startAnimation(animationId);
    setIsActive(allowed);
    return allowed;
  }, [animationId]);

  const stopAnimation = React.useCallback(() => {
    frameRateManager.stopAnimation(animationId);
    setIsActive(false);
  }, [animationId]);

  const getOptimizedStyles = React.useCallback((styles: React.CSSProperties) => {
    return frameRateManager.getOptimizedAnimationStyles(styles);
  }, []);

  const getOptimizedClasses = React.useCallback((classes: string) => {
    return frameRateManager.getOptimizedClassNames(classes);
  }, []);

  return {
    isActive,
    animationQuality,
    startAnimation,
    stopAnimation,
    getOptimizedStyles,
    getOptimizedClasses,
    canAnimate: animationQuality.level !== 'minimal',
  };
}

/**
 * React hook for performance-aware rendering
 */
export function usePerformanceAwareRender() {
  const metrics = useFrameRate();
  const [shouldReduceComplexity, setShouldReduceComplexity] = React.useState(false);

  React.useEffect(() => {
    // Reduce complexity if performance is poor
    const shouldReduce = metrics.performanceScore < 60 || metrics.averageFps < 40;
    setShouldReduceComplexity(shouldReduce);
  }, [metrics.performanceScore, metrics.averageFps]);

  const optimizeRenderCount = React.useCallback(
    (baseCount: number): number => {
      if (shouldReduceComplexity) {
        return Math.min(baseCount, 10); // Limit items on poor performance
      }
      return baseCount;
    },
    [shouldReduceComplexity]
  );

  const shouldSkipExpensiveRender = React.useCallback((): boolean => {
    return metrics.performanceScore < 40;
  }, [metrics.performanceScore]);

  return {
    metrics,
    shouldReduceComplexity,
    optimizeRenderCount,
    shouldSkipExpensiveRender,
  };
}

/**
 * Higher-order component for frame rate optimization
 */
export function withFrameRateOptimization<P extends object>(
  Component: React.ComponentType<P>,
  animationConfig?: AnimationConfig
) {
  return React.forwardRef<any, P>((props, ref) => {
    const { shouldReduceComplexity } = usePerformanceAwareRender();

    // Skip expensive renders if performance is poor
    if (shouldReduceComplexity && animationConfig?.complexity === 'high') {
      return null;
    }

    return <Component {...props} ref={ref} />;
  });
}

/**
 * Frame rate monitor component
 */
export interface FrameRateMonitorProps {
  className?: string;
  showDetails?: boolean;
  warningThreshold?: number;
}

export const FrameRateMonitor: React.FC<FrameRateMonitorProps> = ({
  className = '',
  showDetails = false,
  warningThreshold = 30,
}) => {
  const metrics = useFrameRate();
  const isWarning = metrics.averageFps < warningThreshold;

  return (
    <div className={`frame-rate-monitor ${isWarning ? 'warning' : ''} ${className}`}>
      <div className="fps-display">
        <span className={`fps-value ${isWarning ? 'text-red-500' : 'text-green-500'}`}>
          {Math.round(metrics.fps)} FPS
        </span>
      </div>

      {showDetails && (
        <div className="fps-details text-xs mt-1 space-y-1">
          <div>Avg: {Math.round(metrics.averageFps)} FPS</div>
          <div>Score: {metrics.performanceScore}%</div>
          <div>Dropped: {metrics.droppedFrames}</div>
          <div>Frame Time: {Math.round(metrics.frameTimeMs)}ms</div>
        </div>
      )}
    </div>
  );
};

export default frameRateManager;
