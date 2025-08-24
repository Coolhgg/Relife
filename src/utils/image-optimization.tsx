/**
 * Advanced Image Optimization Utilities
 * Provides WebP support, responsive loading, progressive enhancement, and smart caching
 */

import React from 'react';
import { TimeoutHandle } from '../types/timers';

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  sizes?: string[];
  lazy?: boolean;
  placeholder?: 'blur' | 'color' | 'none';
  priority?: boolean;
  progressive?: boolean;
}

export interface OptimizedImageData {
  src: string;
  srcSet?: string;
  sizes?: string;
  placeholder?: string;
  aspectRatio?: number;
}

class ImageOptimizer {
  private cache = new Map<string, OptimizedImageData>();
  private loadQueue: Array<{ url: string; resolve: Function; reject: Function }> = [];
  private isProcessing = false;
  private observer?: IntersectionObserver;

  constructor() {
    this.initializeObserver();
    this.preloadCriticalImages();
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initializeObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  }

  /**
   * Preload critical images that are above the fold
   */
  private preloadCriticalImages() {
    const criticalImages = [
      '/icon-192x192.png',
      '/icon-512x512.png',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPHN2Zz4K', // Star icon placeholder
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * Check if WebP is supported by the browser
   */
  private async checkWebPSupport(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Generate responsive image srcSet
   */
  private generateSrcSet(
    baseSrc: string,
    sizes: string[],
    format: string = 'auto'
  ): string {
    return sizes
      .map(size => {
        const width = parseInt(size);
        const optimizedSrc = this.getOptimizedSrc(baseSrc, { width, format });
        return `${optimizedSrc} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Get optimized image source with proper format and quality
   */
  private getOptimizedSrc(
    src: string,
    options: { width?: number; format?: string; quality?: number } = {}
  ): string {
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return src;
    }

    const url = new URL(src, window.location.origin);
    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.format && options.format !== 'auto') params.set('fm', options.format);
    if (options.quality) params.set('q', options.quality.toString());

    // Add basic optimization parameters
    params.set('fit', 'crop');
    params.set('auto', 'compress,format');

    const queryString = params.toString();
    return queryString ? `${url.pathname}?${queryString}` : url.pathname;
  }

  /**
   * Generate blur placeholder for progressive loading
   */
  private async generateBlurPlaceholder(src: string): Promise<string> {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 10;
      canvas.height = 10;

      img.onload = () => {
        if (ctx) {
          ctx.filter = 'blur(5px)';
          ctx.drawImage(img, 0, 0, 10, 10);
          resolve(canvas.toDataURL('image/jpeg', 0.1));
        } else {
          resolve(
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo='
          );
        }
      };

      img.onerror = () => {
        resolve(
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo='
        );
      };

      img.src = src;
    });
  }

  /**
   * Process image load queue with batching
   */
  private async processLoadQueue() {
    if (this.isProcessing || this.loadQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.loadQueue.splice(0, 3); // Process 3 images at a time

    await Promise.allSettled(
      batch.map(async ({ url, resolve, reject }) => {
        try {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        } catch (error) {
          reject(error);
        }
      })
    );

    this.isProcessing = false;
    if (this.loadQueue.length > 0) {
      setTimeout(() => this.processLoadQueue(), 10);
    }
  }

  /**
   * Load image with lazy loading support
   */
  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcSet = img.dataset.srcset;

    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }

    if (srcSet) {
      img.srcset = srcSet;
      img.removeAttribute('data-srcset');
    }

    img.classList.remove('lazy');
    img.classList.add('loaded');
  }

  /**
   * Optimize image with comprehensive options
   */
  async optimizeImage(
    src: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageData> {
    const cacheKey = `${src}_${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const {
      quality = 85,
      format = 'auto',
      sizes = ['320', '640', '768', '1024', '1280'],
      placeholder = 'blur',
      progressive = true,
    } = options;

    // Determine optimal format
    let finalFormat = format;
    if (format === 'auto') {
      const supportsWebP = await this.checkWebPSupport();
      finalFormat = supportsWebP ? 'webp' : 'jpeg';
    }

    // Generate optimized sources
    const optimizedSrc = this.getOptimizedSrc(src, { quality, format: finalFormat });
    const srcSet = this.generateSrcSet(src, sizes, finalFormat);

    // Generate placeholder if needed
    let placeholderData: string | undefined;
    if (placeholder === 'blur') {
      placeholderData = await this.generateBlurPlaceholder(src);
    } else if (placeholder === 'color') {
      placeholderData =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';
    }

    const result: OptimizedImageData = {
      src: optimizedSrc,
      srcSet,
      sizes: sizes.map(s => `(max-width: ${s}px) ${s}px`).join(', '),
      placeholder: placeholderData,
      aspectRatio: undefined, // Will be calculated when image loads
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Setup lazy loading for an image element
   */
  setupLazyLoading(
    img: HTMLImageElement,
    src: string,
    options: ImageOptimizationOptions = {}
  ) {
    if (!this.observer) return;

    img.classList.add('lazy');
    img.dataset.src = src;

    if (options.sizes) {
      const srcSet = this.generateSrcSet(src, options.sizes, options.format);
      img.dataset.srcset = srcSet;
      img.sizes = options.sizes.map(s => `(max-width: ${s}px) ${s}px`).join(', ');
    }

    // Add placeholder
    if (options.placeholder !== 'none') {
      img.style.backgroundColor = '#f3f4f6';
      img.style.backgroundImage = `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=")`;
    }

    this.observer.observe(img);
  }

  /**
   * Preload image with priority
   */
  async preloadImage(
    src: string,
    priority: boolean = false
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (priority) {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      } else {
        this.loadQueue.push({ url: src, resolve, reject });
        this.processLoadQueue();
      }
    });
  }

  /**
   * Clear cache and cleanup
   */
  cleanup() {
    this.cache.clear();
    this.loadQueue.length = 0;
    this.observer?.disconnect();
  }
}

// Create singleton instance
export const imageOptimizer = new ImageOptimizer();

/**
 * React hook for optimized images
 */
export function useOptimizedImage(src: string, options: ImageOptimizationOptions = {}) {
  const [imageData, setImageData] = React.useState<OptimizedImageData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadOptimizedImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const optimized = await imageOptimizer.optimizeImage(src, options);

        if (mounted) {
          setImageData(optimized);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Image optimization failed'));
          setIsLoading(false);
        }
      }
    };

    loadOptimizedImage();

    return () => {
      mounted = false;
    };
  }, [src, JSON.stringify(options)]);

  return { imageData, isLoading, error };
}

/**
 * Optimized Image component with all performance features
 */
export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  optimization?: ImageOptimizationOptions;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  optimization = {},
  onLoad,
  onError,
  className = '',
  style = {},
  ...props
}) => {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const { imageData, isLoading, error } = useOptimizedImage(src, optimization);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  React.useEffect(() => {
    if (imgRef.current && imageData) {
      const img = imgRef.current;

      if (optimization.lazy && !optimization.priority) {
        imageOptimizer.setupLazyLoading(img, imageData.src, optimization);
      } else {
        img.src = imageData.src;
        if (imageData.srcSet) img.srcset = imageData.srcSet;
        if (imageData.sizes) img.sizes = imageData.sizes;
      }
    }
  }, [imageData, optimization]);

  const handleLoad = React.useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={style}>
      {/* Placeholder */}
      {!loaded && imageData?.placeholder && (
        <img
          src={imageData.placeholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100'}`}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={handleLoad}
        {...props}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default imageOptimizer;
