import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  usePerformanceOptimizations,
  useDeviceCapabilities,
} from '../hooks/useDeviceCapabilities';

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  placeholder?: 'blur' | 'empty' | string; // Blur, empty, or custom placeholder URL
  onLoad?: (
) => void;
  onError?: (error: Event
) => void;
  sizes?: string; // Responsive image sizes
  quality?: 'auto' | 'low' | 'medium' | 'high';
}

interface ImageVariant {
  src: string;
  quality: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const AdaptiveImage = memo<AdaptiveImageProps>(
  ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    placeholder = 'blur',
    onLoad,
    onError,
    sizes,
    quality = 'auto',
  }
) => {
    const { imageQuality, shouldPreloadImages } = usePerformanceOptimizations();
    const { isLowEnd } = useDeviceCapabilities();

    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isIntersecting, setIsIntersecting] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Determine optimal image quality
    const finalQuality = quality === 'auto' ? imageQuality : quality;

    // WebP support detection (cached)
    const supportsWebP = useCallback((): boolean => {
      if (typeof window === 'undefined') return false;

      // Check cached result
      const cached = sessionStorage.getItem('webp-support');
      if (cached !== null) return cached === 'true';

      // Test WebP support
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const supported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

      // Cache result
      sessionStorage.setItem('webp-support', supported.toString());
      return supported;
    }, []);

    // Generate image variants based on device capabilities
    const generateImageVariants = useCallback(
      (originalSrc: string): ImageVariant[] => {
        const variants: ImageVariant[] = [];

        // Base variant
        variants.push({
          src: originalSrc,
          quality: 'high',
          format: 'jpeg',
        });

        // Generate optimized variants for different qualities
        const baseUrl = originalSrc.split('.').slice(0, -1).join('.');
        const extension = originalSrc.split('.').pop()?.toLowerCase();

        if (extension && ['jpg', 'jpeg', 'png'].includes(extension)) {
          // Low quality variant
          variants.push({
            src: `${baseUrl}_q30.${extension}`,
            quality: 'low',
            format: 'jpeg',
          });

          // Medium quality variant
          variants.push({
            src: `${baseUrl}_q60.${extension}`,
            quality: 'medium',
            format: 'jpeg',
          });

          // WebP variants for supported browsers
          if (supportsWebP()) {
            variants.push({
              src: `${baseUrl}_q30.webp`,
              quality: 'low',
              format: 'webp',
            });

            variants.push({
              src: `${baseUrl}_q60.webp`,
              quality: 'medium',
              format: 'webp',
            });

            variants.push({
              src: `${baseUrl}.webp`,
              quality: 'high',
              format: 'webp',
            });
          }
        }

        return variants;
      },
      [supportsWebP]
    );

    // Get optimal image source based on device capabilities
    const getOptimalImageSrc = useCallback(
      (variants: ImageVariant[]): string => {
        // Filter by format support
        const supportedVariants = variants.filter(variant => {
          if (variant.format === 'webp') return supportsWebP();
          return true;
        });

        // Find variant matching desired quality
        const qualityVariant = supportedVariants.find(v => v.quality === finalQuality);
        if (qualityVariant) return qualityVariant.src;

        // Fallback to original source
        return src;
      },
      [finalQuality, src, supportsWebP]
    );

    // Intersection observer for lazy loading
    useEffect((
) => {
      if (priority || !imgRef.current) return;

      // Create intersection observer
      observerRef.current = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsIntersecting(true);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: isLowEnd ? '50px' : '100px', // Smaller margin for low-end devices
          threshold: 0.1,
        }
      );

      observerRef.current.observe(imgRef.current);

      return (
) => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }, [priority, isLowEnd]);

    // Handle image load
    const handleLoad = useCallback((
) => {
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    }, [onLoad]);

    // Handle image error
    const handleError = useCallback(
      (event: React.SyntheticEvent<HTMLImageElement>
) => {
        setHasError(true);
        onError?.(event.nativeEvent);
      },
      [onError]
    );

    // Get placeholder styles
    const getPlaceholderStyles = useCallback((): React.CSSProperties => {
      if (placeholder === 'empty') return {};

      if (placeholder === 'blur') {
        return {
          backgroundColor: '#f3f4f6',
          backgroundImage: isLowEnd
            ? undefined
            : `
          linear-gradient(45deg, #f9fafb 25%, transparent 25%),
          linear-gradient(-45deg, #f9fafb 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #f9fafb 75%),
          linear-gradient(-45deg, transparent 75%, #f9fafb 75%)
        `,
          backgroundSize: isLowEnd ? undefined : '20px 20px',
          backgroundPosition: isLowEnd
            ? undefined
            : '0 0, 0 10px, 10px -10px, -10px 0px',
        };
      }

      // Custom placeholder URL
      return {
        backgroundImage: `url(${placeholder})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }, [placeholder, isLowEnd]);

    // Determine if image should be loaded
    const shouldLoad = priority || isIntersecting;

    // Get optimal image source
    const variants = generateImageVariants(src);
    const optimalSrc = getOptimalImageSrc(variants);

    // Generate srcSet for responsive images
    const generateSrcSet = useCallback((): string => {
      if (!shouldPreloadImages || isLowEnd) return '';

      
      const webpVariants = variants.filter(
        (v: any
) => v.format === 'webp' && supportsWebP()
      );
      if (webpVariants.length === 0) return '';

      return webpVariants
        .map((variant: any
) => {
          // auto: implicit any
          const descriptor =
            variant.quality === 'low'
              ? '0.5x'
              : variant.quality === 'medium'
                ? '1x'
                : '2x';
          return `${variant.src} ${descriptor}`;
        })
        .join(', ');
    }, [variants, shouldPreloadImages, isLowEnd, supportsWebP]);

    const srcSet = generateSrcSet();

    // Container styles
    const containerStyles: React.CSSProperties = {
      ...getPlaceholderStyles(),
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
      display: 'inline-block',
      overflow: 'hidden',
      position: 'relative',
    };

    // Image styles
    const imageStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: isLoaded && !isLowEnd ? 'opacity 0.3s ease-in-out' : undefined,
      opacity: isLoaded ? 1 : 0,
    };

    // Error fallback
    if (hasError) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
          style={containerStyles}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className={className} style={containerStyles}>
        {shouldLoad && (
          <img
            ref={imgRef}
            src={optimalSrc}
            srcSet={srcSet || undefined}
            sizes={sizes}
            alt={alt}
            style={imageStyles}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding={isLowEnd ? 'sync' : 'async'} // Sync decoding for low-end devices
          />
        )}

        {/* Loading skeleton for low-end devices */}
        {!isLoaded && isLowEnd && shouldLoad && (
          <div
            className="absolute inset-0 animate-pulse bg-gray-200"
            style={{ animationDuration: '1.5s' }}
          />
        )}
      </div>
    );
  }
);

AdaptiveImage.displayName = 'AdaptiveImage';

export default AdaptiveImage;
