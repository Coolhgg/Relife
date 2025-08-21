// Animation Manager Service for Relife Smart Alarm
// Central animation orchestration and performance optimization

import { AnimationControls, MotionValue } from 'framer-motion';

export interface AnimationPreferences {
  reducedMotion: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  enableParticles: boolean;
  enableTransitions: boolean;
  enableMicroInteractions: boolean;
  performanceMode: 'auto' | 'high' | 'low';
}

export interface AnimationMetrics {
  averageFrameRate: number;
  droppedFrames: number;
  animationCount: number;
  performanceScore: number;
  lastOptimization: Date;
}

class AnimationManagerService {
  private static instance: AnimationManagerService;
  private preferences: AnimationPreferences = {
    reducedMotion: false,
    animationSpeed: 'normal',
    enableParticles: true,
    enableTransitions: true,
    enableMicroInteractions: true,
    performanceMode: 'auto'
  };

  private metrics: AnimationMetrics = {
    averageFrameRate: 60,
    droppedFrames: 0,
    animationCount: 0,
    performanceScore: 100,
    lastOptimization: new Date()
  };

  private activeAnimations = new Map<string, AnimationControls>();
  private frameRateHistory: number[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private animationFrameId: number | null = null;

  private constructor() {
    this.initializePreferences();
    this.setupPerformanceMonitoring();
  }

  static getInstance(): AnimationManagerService {
    if (!AnimationManagerService.instance) {
      AnimationManagerService.instance = new AnimationManagerService();
    }
    return AnimationManagerService.instance;
  }

  /**
   * Initialize animation preferences from system and user settings
   */
  private initializePreferences(): void {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.preferences.reducedMotion = true;
      this.preferences.animationSpeed = 'slow';
      this.preferences.enableParticles = false;
    }

    // Load user preferences from storage
    const savedPreferences = localStorage.getItem('animation_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        this.preferences = { ...this.preferences, ...parsed };
      } catch (error) {
        console.warn('Failed to load animation preferences:', error);
      }
    }

    // Listen for reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', (e) => {
        this.preferences.reducedMotion = e.matches;
        this.optimizeForPerformance();
      });
  }

  /**
   * Setup performance monitoring for animations
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.updatePerformanceMetrics(entries);
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Monitor frame rate
    this.startFrameRateMonitoring();
  }

  /**
   * Monitor frame rate performance
   */
  private startFrameRateMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFrameRate = (currentTime: number) => {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        this.frameRateHistory.push(fps);

        // Keep only last 10 seconds of data
        if (this.frameRateHistory.length > 10) {
          this.frameRateHistory.shift();
        }

        // Calculate average FPS
        this.metrics.averageFrameRate = this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / this.frameRateHistory.length;

        // Check for performance issues
        if (this.metrics.averageFrameRate < 30) {
          this.handleLowPerformance();
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(measureFrameRate);
    };

    this.animationFrameId = requestAnimationFrame(measureFrameRate);
  }

  /**
   * Get optimized animation configuration based on performance
   */
  getAnimationConfig(animationType: 'entrance' | 'hover' | 'transition' | 'micro'): any {
    const speedMultipliers = {
      slow: 1.5,
      normal: 1,
      fast: 0.7
    };

    const baseConfig = {
      entrance: {
        duration: 0.6,
        stiffness: 120,
        damping: 20
      },
      hover: {
        duration: 0.3,
        stiffness: 300,
        damping: 30
      },
      transition: {
        duration: 0.4,
        stiffness: 200,
        damping: 25
      },
      micro: {
        duration: 0.2,
        stiffness: 400,
        damping: 35
      }
    };

    const config = baseConfig[animationType];
    const speedMultiplier = speedMultipliers[this.preferences.animationSpeed];

    // Adjust for reduced motion
    if (this.preferences.reducedMotion) {
      return {
        duration: config.duration * 0.3,
        ease: 'easeOut',
        reduce: true
      };
    }

    // Adjust for performance mode
    if (this.preferences.performanceMode === 'low' || this.metrics.performanceScore < 50) {
      return {
        duration: config.duration * 0.5,
        ease: 'easeInOut'
      };
    }

    return {
      type: 'spring' as const,
      stiffness: config.stiffness,
      damping: config.damping,
      duration: config.duration * speedMultiplier
    };
  }

  /**
   * Register an animation for tracking
   */
  registerAnimation(id: string, controls: AnimationControls): void {
    this.activeAnimations.set(id, controls);
    this.metrics.animationCount = this.activeAnimations.size;
  }

  /**
   * Unregister an animation
   */
  unregisterAnimation(id: string): void {
    this.activeAnimations.delete(id);
    this.metrics.animationCount = this.activeAnimations.size;
  }

  /**
   * Pause all animations for performance
   */
  pauseAllAnimations(): void {
    this.activeAnimations.forEach(controls => {
      controls.stop();
    });
  }

  /**
   * Resume all animations
   */
  resumeAllAnimations(): void {
    // Animations will resume naturally when triggered again
    console.log('Animations ready to resume');
  }

  /**
   * Update animation preferences
   */
  updatePreferences(newPreferences: Partial<AnimationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };

    // Save to localStorage
    localStorage.setItem('animation_preferences', JSON.stringify(this.preferences));

    // Apply optimizations
    this.optimizeForPerformance();
  }

  /**
   * Get current animation preferences
   */
  getPreferences(): AnimationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): AnimationMetrics {
    return { ...this.metrics };
  }

  /**
   * Handle low performance scenarios
   */
  private handleLowPerformance(): void {
    if (this.preferences.performanceMode === 'auto') {
      // Automatically reduce animation quality
      this.preferences.enableParticles = false;
      this.preferences.animationSpeed = 'fast';

      // Reduce active animations
      if (this.metrics.animationCount > 5) {
        this.pauseAllAnimations();

        setTimeout(() => {
          this.resumeAllAnimations();
        }, 1000);
      }
    }

    this.metrics.performanceScore = Math.max(0, this.metrics.performanceScore - 10);
    this.metrics.lastOptimization = new Date();
  }

  /**
   * Optimize animations for current performance
   */
  private optimizeForPerformance(): void {
    const avgFrameRate = this.metrics.averageFrameRate;

    if (avgFrameRate < 30) {
      // Critical performance issues
      this.preferences.performanceMode = 'low';
      this.preferences.enableParticles = false;
      this.preferences.enableMicroInteractions = false;
    } else if (avgFrameRate < 45) {
      // Moderate performance issues
      this.preferences.enableParticles = false;
      this.preferences.animationSpeed = 'fast';
    } else if (avgFrameRate > 55) {
      // Good performance, restore features
      if (this.preferences.performanceMode === 'auto') {
        this.preferences.enableParticles = true;
        this.preferences.enableMicroInteractions = true;
      }
    }
  }

  /**
   * Update performance metrics from PerformanceObserver
   */
  private updatePerformanceMetrics(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.entryType === 'measure') {
        // Update performance score based on measurement duration
        const expectedDuration = 16.67; // 60fps = 16.67ms per frame
        const actualDuration = entry.duration;

        if (actualDuration > expectedDuration * 2) {
          this.metrics.droppedFrames++;
          this.metrics.performanceScore = Math.max(0, this.metrics.performanceScore - 1);
        } else if (actualDuration < expectedDuration) {
          this.metrics.performanceScore = Math.min(100, this.metrics.performanceScore + 0.5);
        }
      }
    });
  }

  /**
   * Create optimized spring configuration
   */
  createSpringConfig(type: 'gentle' | 'bouncy' | 'snappy'): any {
    const configs = {
      gentle: { stiffness: 120, damping: 20 },
      bouncy: { stiffness: 200, damping: 10 },
      snappy: { stiffness: 300, damping: 30 }
    };

    const baseConfig = configs[type];

    if (this.preferences.reducedMotion) {
      return { duration: 0.2, ease: 'easeOut' };
    }

    if (this.metrics.performanceScore < 50) {
      return {
        ...baseConfig,
        stiffness: baseConfig.stiffness * 0.7,
        damping: baseConfig.damping * 1.3
      };
    }

    return { type: 'spring' as const, ...baseConfig };
  }

  /**
   * Should animation be enabled based on preferences and performance
   */
  shouldAnimate(animationType?: 'particles' | 'transitions' | 'micro'): boolean {
    if (this.preferences.reducedMotion) {
      return false;
    }

    if (animationType) {
      switch (animationType) {
        case 'particles':
          return this.preferences.enableParticles;
        case 'transitions':
          return this.preferences.enableTransitions;
        case 'micro':
          return this.preferences.enableMicroInteractions;
        default:
          return true;
      }
    }

    return this.metrics.performanceScore > 30;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.activeAnimations.clear();
  }
}

export default AnimationManagerService;