/**
 * Theme Performance Optimization Service
 * Handles efficient theme switching, CSS variable caching, and DOM batching
 */

interface CSSVariableCache {
  variables: Record<string, string>;
  classes: string[];
  hash: string;
  timestamp: number;
}

interface ThemeTransition {
  duration: number;
  easing: string;
  properties: string[];
}

class ThemePerformanceService {
  private static instance: ThemePerformanceService;
  private variableCache = new Map<string, CSSVariableCache>();
  private isApplyingTheme = false;
  private pendingUpdate: NodeJS.Timeout | null = null;
  private lastAppliedHash: string | null = null;
  private observer: MutationObserver | null = null;
  private transitionCleanup: (() => void) | null = null;

  static getInstance(): ThemePerformanceService {
    if (!this.instance) {
      this.instance = new ThemePerformanceService();
    }
    return this.instance;
  }

  private constructor() {
    this.setupDOMObserver();
  }

  /**
   * Generate a hash for theme configuration to enable efficient caching
   */
  private generateHash(variables: Record<string, string>, classes: string[]): string {
    const variableStr = Object.keys(variables)
      .sort()
      .map(key => `${key}:${variables[key]}`)
      .join(';');
    const classStr = classes.sort().join(' ');
    return btoa(variableStr + '|' + classStr).replace(/[=+/]/g, '').substring(0, 16);
  }

  /**
   * Cache CSS variables and classes for efficient reuse
   */
  cacheThemeData(
    themeId: string, 
    variables: Record<string, string>, 
    classes: string[]
  ): CSSVariableCache {
    const hash = this.generateHash(variables, classes);
    const cached: CSSVariableCache = {
      variables: { ...variables },
      classes: [...classes],
      hash,
      timestamp: Date.now()
    };
    
    this.variableCache.set(themeId, cached);
    
    // Limit cache size to prevent memory leaks
    if (this.variableCache.size > 10) {
      const oldest = Array.from(this.variableCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
      this.variableCache.delete(oldest[0]);
    }
    
    return cached;
  }

  /**
   * Get cached theme data if available
   */
  getCachedThemeData(themeId: string): CSSVariableCache | null {
    return this.variableCache.get(themeId) || null;
  }

  /**
   * Apply theme with performance optimizations
   */
  async applyTheme(
    variables: Record<string, string>, 
    classes: string[],
    options: {
      animate?: boolean;
      duration?: number;
      skipIfSame?: boolean;
    } = {}
  ): Promise<void> {
    const { animate = false, duration = 300, skipIfSame = true } = options;
    
    // Prevent concurrent theme applications
    if (this.isApplyingTheme) {
      return;
    }

    const hash = this.generateHash(variables, classes);
    
    // Skip if same theme is already applied
    if (skipIfSame && this.lastAppliedHash === hash) {
      return;
    }

    this.isApplyingTheme = true;

    try {
      // Clear any pending updates
      if (this.pendingUpdate) {
        clearTimeout(this.pendingUpdate);
      }

      // Apply with transition if requested
      if (animate) {
        await this.applyWithTransition(variables, classes, duration);
      } else {
        this.applyImmediately(variables, classes);
      }

      this.lastAppliedHash = hash;
    } finally {
      this.isApplyingTheme = false;
    }
  }

  /**
   * Apply theme immediately without transitions
   */
  private applyImmediately(variables: Record<string, string>, classes: string[]): void {
    const root = document.documentElement;
    const body = document.body;

    // Batch DOM operations using DocumentFragment approach
    this.batchCSSVariables(root, variables);
    this.batchClassNames(body, classes);
  }

  /**
   * Apply theme with smooth transition
   */
  private async applyWithTransition(
    variables: Record<string, string>, 
    classes: string[], 
    duration: number
  ): Promise<void> {
    const root = document.documentElement;
    const body = document.body;

    // Clean up any existing transition
    if (this.transitionCleanup) {
      this.transitionCleanup();
    }

    // Add transition styles
    const transitionStyle = this.createTransitionStyle(duration);
    document.head.appendChild(transitionStyle);

    // Apply the changes
    this.batchCSSVariables(root, variables);
    this.batchClassNames(body, classes);

    // Clean up transition after completion
    this.transitionCleanup = () => {
      if (transitionStyle.parentNode) {
        transitionStyle.parentNode.removeChild(transitionStyle);
      }
    };

    setTimeout(this.transitionCleanup, duration + 50);
  }

  /**
   * Efficiently batch CSS variable updates
   */
  private batchCSSVariables(root: HTMLElement, variables: Record<string, string>): void {
    // Use requestAnimationFrame for optimal timing
    requestAnimationFrame(() => {
      // Group updates to minimize layout thrashing
      const cssText = Object.entries(variables)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');
      
      // Apply all variables at once using cssText (more efficient than individual setProperty calls)
      const existingStyles = root.style.cssText;
      const newStyles = existingStyles + (existingStyles ? '; ' : '') + cssText;
      root.style.cssText = newStyles;
    });
  }

  /**
   * Efficiently update class names
   */
  private batchClassNames(element: HTMLElement, newClasses: string[]): void {
    requestAnimationFrame(() => {
      // Get current classes and filter out old theme classes
      const currentClasses = Array.from(element.classList);
      const filteredClasses = currentClasses.filter(cls => 
        !cls.startsWith('theme-') && 
        !cls.startsWith('high-contrast') &&
        !cls.startsWith('reduce-motion') &&
        !cls.startsWith('dyslexia-friendly')
      );
      
      // Apply new classes efficiently
      element.className = filteredClasses.concat(newClasses).join(' ');
    });
  }

  /**
   * Create transition style element
   */
  private createTransitionStyle(duration: number): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      * {
        transition: 
          color ${duration}ms ease-in-out,
          background-color ${duration}ms ease-in-out,
          border-color ${duration}ms ease-in-out,
          box-shadow ${duration}ms ease-in-out !important;
      }
    `;
    return style;
  }

  /**
   * Setup DOM mutation observer for performance monitoring
   */
  private setupDOMObserver(): void {
    if (typeof window === 'undefined' || !('MutationObserver' in window)) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      const hasStyleMutations = mutations.some(mutation => 
        mutation.type === 'attributes' && 
        (mutation.attributeName === 'style' || mutation.attributeName === 'class')
      );

      if (hasStyleMutations) {
        this.debouncePerformanceCheck();
      }
    });

    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: false
    });
  }

  /**
   * Debounced performance check
   */
  private debouncePerformanceCheck = (() => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.checkPerformanceMetrics();
      }, 100);
    };
  })();

  /**
   * Monitor performance metrics
   */
  private checkPerformanceMetrics(): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('theme-update-complete');
      
      // Measure paint time if available
      if ('measureUserAgentSpecificMemory' in performance) {
        (performance as any).measureUserAgentSpecificMemory?.().then((result: any) => {
          if (result.bytes > 50 * 1024 * 1024) { // 50MB threshold
            console.warn('High memory usage detected after theme update:', result.bytes);
          }
        }).catch(() => {
          // Silently fail if not supported
        });
      }
    }
  }

  /**
   * Debounced theme application for rapid changes
   */
  debouncedApplyTheme(
    variables: Record<string, string>, 
    classes: string[],
    delay: number = 16,
    options: Parameters<typeof this.applyTheme>[2] = {}
  ): void {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
    }

    this.pendingUpdate = setTimeout(() => {
      this.applyTheme(variables, classes, options);
    }, delay);
  }

  /**
   * Preload theme data for smoother transitions
   */
  preloadTheme(themeId: string, variables: Record<string, string>, classes: string[]): void {
    this.cacheThemeData(themeId, variables, classes);
    
    // Preload critical CSS properties
    const criticalVars = Object.entries(variables).filter(([key]) => 
      key.includes('background') || key.includes('text') || key.includes('primary')
    );
    
    // Create invisible element to trigger CSS parsing
    const preloader = document.createElement('div');
    preloader.style.cssText = criticalVars
      .map(([prop, value]) => `${prop}: ${value}`)
      .join('; ');
    preloader.style.position = 'absolute';
    preloader.style.left = '-9999px';
    preloader.style.opacity = '0';
    preloader.style.pointerEvents = 'none';
    
    document.body.appendChild(preloader);
    requestAnimationFrame(() => {
      document.body.removeChild(preloader);
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.variableCache.clear();
    this.lastAppliedHash = null;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    cacheSize: number;
    cacheEntries: string[];
    lastAppliedHash: string | null;
    isApplyingTheme: boolean;
  } {
    return {
      cacheSize: this.variableCache.size,
      cacheEntries: Array.from(this.variableCache.keys()),
      lastAppliedHash: this.lastAppliedHash,
      isApplyingTheme: this.isApplyingTheme
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
    }
    
    if (this.transitionCleanup) {
      this.transitionCleanup();
    }
    
    this.clearCache();
  }
}

export default ThemePerformanceService;