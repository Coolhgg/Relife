/// <reference lib="dom" />
/**
 * Advanced Progressive Loading Strategies
 * Provides critical content prioritization, skeleton loading, and progressive enhancement
 */

import React from 'react';
import { TimeoutHandle } from '../types/timers';

export interface LoadingPriority {
  level: 'critical' | 'high' | 'normal' | 'low';
  timeout?: number;
  fallback?: React.ComponentType;
  skeleton?: React.ComponentType;
}

export interface ProgressiveLoadConfig {
  priority: LoadingPriority;
  dependencies?: string[];
  preloadCondition?: (
) => boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  error?: Error;
  progress?: number;
}

class ProgressiveLoadManager {
  private loadedComponents = new Set<string>();
  private loadingComponents = new Map<string, Promise<any>>();
  private errorComponents = new Set<string>();
  private criticalPath: string[] = [];
  private loadQueue: Array<{
    id: string;
    priority: number;
    loader: (
) => Promise<any>;
  }> = [];
  private isProcessingQueue = false;
  private observers: Array<
    (state: { loaded: string[]; loading: string[]; errors: string[] }
) => void
  > = [];

  constructor() {
    this.setupCriticalPath();
    this.initializeProgressiveLoading();
  }

  /**
   * Setup critical rendering path
   */
  private setupCriticalPath() {
    this.criticalPath = [
      'app-shell',
      'navigation',
      'alarm-list',
      'current-time',
      'quick-actions',
    ];
  }

  /**
   * Initialize progressive loading
   */
  private initializeProgressiveLoading() {
    // Prioritize critical path components
    if (typeof window !== 'undefined') {
      // Load critical components immediately
      this.preloadCriticalComponents();

      // Load other components based on user interaction
      this.setupInteractionBasedLoading();

      // Load remaining components when idle
      this.setupIdleTimeLoading();
    }
  }

  /**
   * Preload critical components
   */
  private async preloadCriticalComponents() {
    const criticalLoaders = [
      (
) => import('../components/AlarmList'),
      (
) => import('../components/Dashboard'),
      (
) => import('../services/alarm'),
    ];

    await Promise.allSettled(
      criticalLoaders.map((loader, index
) =>
        this.loadComponent(`critical-${index}`, loader, { level: 'critical' })
      )
    );
  }

  /**
   * Setup interaction-based loading
   */
  private setupInteractionBasedLoading() {
    // Preload on hover/focus
    const interactionEvents = ['mouseenter', 'focus', 'touchstart'];

    interactionEvents.forEach(event => {
      document.addEventListener(
        event,
        e => {
          const target = e.target as HTMLElement;
          const preloadData = target.dataset.preload;

          if (preloadData) {
            this.preloadByDataAttribute(preloadData);
          }
        },
        { passive: true }
      );
    });
  }

  /**
   * Setup idle time loading
   */
  private setupIdleTimeLoading() {
    if ('requestIdleCallback' in window) {
      const loadNonCritical = (
) => {
        (window as any).requestIdleCallback(
          (
) => {
            this.processLoadQueue();
          },
          { timeout: 5000 }
        );
      };

      // Start loading non-critical components after initial render
      setTimeout(loadNonCritical, 2000);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout((
) => this.processLoadQueue(), 3000);
    }
  }

  /**
   * Load component with priority and configuration
   */
  async loadComponent<T>(
    id: string,
    loader: (
) => Promise<T>,
    config: ProgressiveLoadConfig
  ): Promise<T> {
    // Check if already loaded
    if (this.loadedComponents.has(id)) {
      return loader(); // Return cached result
    }

    // Check if currently loading
    if (this.loadingComponents.has(id)) {
      return this.loadingComponents.get(id);
    }

    // Create loading promise
    const loadingPromise = this.executeLoad(id, loader, config);
    this.loadingComponents.set(id, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadedComponents.add(id);
      this.loadingComponents.delete(id);
      this.notifyObservers();
      return result;
    } catch (error) {
      this.errorComponents.add(id);
      this.loadingComponents.delete(id);
      this.notifyObservers();
      throw error;
    }
  }

  /**
   * Execute component loading with retry logic
   */
  private async executeLoad<T>(
    id: string,
    loader: (
) => Promise<T>,
    config: ProgressiveLoadConfig
  ): Promise<T> {
    const { priority, retryAttempts = 3, retryDelay = 1000 } = config;
    let lastError: Error;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Check dependencies first
        if (config.dependencies) {
          await this.waitForDependencies(config.dependencies);
        }

        // Apply timeout if specified
        if (priority.timeout) {
          return Promise.race([loader(), this.createTimeoutPromise(priority.timeout)]);
        }

        return await loader();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryAttempts) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Wait for dependencies to load
   */
  private async waitForDependencies(dependencies: string[]): Promise<void> {
    const pendingDeps = dependencies.filter(dep => !this.loadedComponents.has(dep));

    if (pendingDeps.length === 0) return;

    // Wait for dependencies or timeout
    await Promise.race([
      Promise.all(
        pendingDeps.map(
          dep =>
            new Promise<void>(resolve => {
              const checkDependency = (
) => {
                if (this.loadedComponents.has(dep)) {
                  resolve();
                } else {
                  setTimeout(checkDependency, 100);
                }
              };
              checkDependency();
            })
        )
      ),
      this.delay(5000), // 5 second timeout for dependencies
    ]);
  }

  /**
   * Add component to load queue
   */
  queueLoad<T>(
    id: string,
    loader: (
) => Promise<T>,
    config: ProgressiveLoadConfig
  ): Promise<T> {
    const priority = this.getPriorityValue(config.priority.level);

    return new Promise((resolve, reject
) => {
      this.loadQueue.push({
        id,
        priority,
        loader: async (
) => {
          try {
            const result = await this.loadComponent(id, loader, config);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
      });

      // Sort queue by priority
      this.loadQueue.sort((a, b
) => b.priority - a.priority);

      if (!this.isProcessingQueue) {
        this.processLoadQueue();
      }
    });
  }

  /**
   * Process the loading queue
   */
  private async processLoadQueue() {
    if (this.isProcessingQueue || this.loadQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.loadQueue.length > 0) {
      const batch = this.loadQueue.splice(0, 3); // Process 3 at a time

      await Promise.allSettled(batch.map(item => item.loader()));

      // Small delay between batches to prevent blocking
      if (this.loadQueue.length > 0) {
        await this.delay(10);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Preload based on data attribute
   */
  private preloadByDataAttribute(preloadData: string) {
    try {
      const config = JSON.parse(preloadData);
      const { componentPath, id, priority } = config;

      if (!componentPath || this.loadedComponents.has(id)) return;

      const loader = (
) => import(componentPath);
      this.queueLoad(id, loader, { priority: { level: priority || 'normal' } });
    } catch (error) {
      console.warn('Invalid preload configuration:', preloadData);
    }
  }

  /**
   * Get numeric priority value
   */
  private getPriorityValue(level: LoadingPriority['level']): number {
    switch (level) {
      case 'critical':
        return 1000;
      case 'high':
        return 750;
      case 'normal':
        return 500;
      case 'low':
        return 250;
      default:
        return 500;
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise<T>(timeout: TimeoutHandle): Promise<T> {
    return new Promise((_, reject
) => {
      setTimeout((
) => {
        reject(new Error(`Loading timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add state observer
   */
  addObserver(
    observer: (state: { loaded: string[]; loading: string[]; errors: string[] }
) => void
  ) {
    this.observers.push(observer);
  }

  /**
   * Remove state observer
   */
  removeObserver(
    observer: (state: { loaded: string[]; loading: string[]; errors: string[] }
) => void
  ) {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify observers of state changes
   */
  private notifyObservers() {
    const state = {
      loaded: Array.from(this.loadedComponents),
      loading: Array.from(this.loadingComponents.keys()),
      errors: Array.from(this.errorComponents),
    };

    this.observers.forEach(observer => observer(state));
  }

  /**
   * Get current loading state
   */
  getState() {
    return {
      loaded: Array.from(this.loadedComponents),
      loading: Array.from(this.loadingComponents.keys()),
      errors: Array.from(this.errorComponents),
    };
  }

  /**
   * Clear error state
   */
  clearError(id: string) {
    this.errorComponents.delete(id);
    this.notifyObservers();
  }
}

// Create singleton instance
export const progressiveLoader = new ProgressiveLoadManager();

/**
 * React hook for progressive loading
 */
export function useProgressiveLoad<T>(
  id: string,
  loader: (
) => Promise<T>,
  config: ProgressiveLoadConfig
) {
  const [state, setState] = React.useState<LoadingState>({
    isLoading: false,
    isLoaded: false,
    isError: false,
  });

  const [data, setData] = React.useState<T | null>(null);

  const load = React.useCallback(async (
) => {
    
      setState((prev: any
) => ({ ...prev, isLoading: true, isError: false }));

    try {
      const result = await progressiveLoader.loadComponent(id, loader, config);
      setData(result);
      
      setState((prev: any
) => ({ ...prev, isLoading: false, isLoaded: true }));
      return result;
    } catch (error) {
      
      setState((prev: any
) => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error as Error,
      }));
      throw error;
    }
  }, [id, loader, config]);

  const retry = React.useCallback((
) => {
    progressiveLoader.clearError(id);
    return load();
  }, [id, load]);

  // Auto-load based on priority
  React.useEffect((
) => {
    if (config.priority.level === 'critical') {
      load();
    } else {
      progressiveLoader.queueLoad(id, loader, config);
    }
  }, [id, config.priority.level]);

  return {
    ...state,
    data,
    load,
    retry,
  };
}

/**
 * Progressive loading wrapper component
 */
export interface ProgressiveWrapperProps {
  id: string;
  loader: (
) => Promise<{ default: React.ComponentType<any> }>;
  config: ProgressiveLoadConfig;
  children?: React.ReactNode;
  fallback?: React.ComponentType;
  skeleton?: React.ComponentType;
  onLoad?: (
) => void;
  onError?: (error: Error
) => void;
}

export const ProgressiveWrapper: React.FC<ProgressiveWrapperProps> = ({
  id,
  loader,
  config,
  children,
  fallback: FallbackComponent,
  skeleton: SkeletonComponent,
  onLoad,
  onError,
}
) => {
  const { isLoading, isLoaded, isError, error, data, retry } = useProgressiveLoad(
    id,
    loader,
    config
  );

  React.useEffect((
) => {
    if (isLoaded && onLoad) onLoad();
    if (isError && onError && error) onError(error);
  }, [isLoaded, isError, error, onLoad, onError]);

  if (isError && FallbackComponent) {
    return <FallbackComponent onClick={retry} />;
  }

  if (isLoading && SkeletonComponent) {
    return <SkeletonComponent />;
  }

  if (isLoaded && data) {
    const Component = data.default;
    return <Component>{children}</Component>;
  }

  return null;
};

/**
 * Skeleton loading component
 */
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  lines = 1,
  className = '',
  animated = true,
}
) => {
  const skeletonLines = Array.from({ length: lines }, (_, i
) => (
    <div
      key={i}
      className={`skeleton-line ${animated ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: '#e5e7eb',
        borderRadius: '0.25rem',
        marginBottom: lines > 1 && i < lines - 1 ? '0.5rem' : 0,
      }}
    />
  ));

  return <div className="skeleton-container">{skeletonLines}</div>;
};

/**
 * Progressive image component
 */
export interface ProgressiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  blurDataURL,
  priority = false,
  className = '',
  onLoad,
  ...props
}
) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect((
) => {
    if (!imgRef.current) return;

    const img = imgRef.current;

    const handleLoad = (
) => {
      setIsLoaded(true);
      onLoad?.({} as any);
    };

    const handleError = (
) => {
      setIsError(true);
    };

    if (priority) {
      // Load immediately for critical images
      img.src = src;
    } else {
      // Use intersection observer for lazy loading
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              img.src = src;
              observer.unobserve(img);
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(img);
    }

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return (
) => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src, priority, onLoad]);

  if (isError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        {...props}
      >
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Blur placeholder */}
      {!isLoaded && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover filter blur-sm transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Color placeholder */}
      {!isLoaded && !blurDataURL && (
        <div
          className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundColor: placeholder || '#e5e7eb' }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

/**
 * Critical CSS inlining utility
 */
export function inlineCriticalCSS() {
  if (typeof document === 'undefined') return;

  const criticalCSS = `
    .skeleton-line {
      background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .progressive-fade-in {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
}

// Initialize critical CSS on module load
if (typeof window !== 'undefined') {
  inlineCriticalCSS();
}

export default progressiveLoader;
