/**
 * Adaptive Spinner Component
 * Automatically adjusts complexity and animation based on device capabilities
 */

import React, { memo, useMemo } from 'react';
import { useDeviceCapabilities, usePerformanceOptimizations } from '../hooks/useDeviceCapabilities';
import { useOptimizedAnimation } from '../utils/frame-rate-manager';
import type { AnimationConfig } from '../utils/frame-rate-manager';

export interface AdaptiveSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const AdaptiveSpinner = memo<AdaptiveSpinnerProps>(({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Loading...',
  showLabel = false,
}) => {
  const { isLowEnd, tier } = useDeviceCapabilities();
  const { shouldReduceAnimations } = usePerformanceOptimizations();

  // Animation configuration
  const animationConfig: AnimationConfig = useMemo(() => ({
    duration: isLowEnd ? 800 : 600, // Slower on low-end devices to reduce CPU usage
    easing: 'linear',
    complexity: 'low',
    gpuAccelerated: !isLowEnd,
    willChange: !isLowEnd,
  }), [isLowEnd]);

  const { canAnimate, getOptimizedClasses } = useOptimizedAnimation(
    `spinner-${size}`, 
    animationConfig
  );

  // Size configurations
  const sizeClasses = useMemo(() => {
    const sizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    };
    return sizes[size];
  }, [size]);

  // Color configurations
  const colorClasses = useMemo(() => {
    const colors = {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      white: 'text-white',
      gray: 'text-gray-400',
    };
    return colors[color];
  }, [color]);

  // Animation classes based on device capabilities
  const animationClasses = useMemo(() => {
    if (!canAnimate || shouldReduceAnimations) {
      return 'animate-pulse'; // Fallback to simple pulse animation
    }
    
    return isLowEnd ? 'animate-spin-slow' : 'animate-spin';
  }, [canAnimate, shouldReduceAnimations, isLowEnd]);

  // Different spinner types based on device capabilities
  const SpinnerContent = useMemo(() => {
    // Simple dots for very low-end devices
    if (shouldReduceAnimations && isLowEnd) {
      return (
        <div className={`flex space-x-1 ${colorClasses}`}>
          <div className={`${sizeClasses} bg-current rounded-full animate-pulse`} />
          <div className={`${sizeClasses} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0.1s' }} />
          <div className={`${sizeClasses} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }} />
        </div>
      );
    }

    // Standard circle spinner for low-end devices
    if (isLowEnd || tier === 'low-end') {
      return (
        <div className={`${sizeClasses} ${colorClasses}`}>
          <div className={`w-full h-full border-2 border-current border-t-transparent rounded-full ${animationClasses}`} />
        </div>
      );
    }

    // Enhanced spinner for mid-range devices
    if (tier === 'mid-range') {
      return (
        <div className={`${sizeClasses} ${colorClasses}`}>
          <div className={`w-full h-full border-2 border-gray-200 rounded-full ${animationClasses}`}>
            <div className="w-full h-full border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }

    // Premium spinner for high-end devices
    return (
      <div className={`relative ${sizeClasses} ${colorClasses}`}>
        <div className={`absolute inset-0 border-2 border-gray-200 rounded-full ${animationClasses}`} />
        <div className={`absolute inset-0 border-2 border-current border-t-transparent rounded-full ${animationClasses}`} />
        <div 
          className={`absolute inset-1 border border-current border-t-transparent rounded-full ${animationClasses}`}
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
      </div>
    );
  }, [shouldReduceAnimations, isLowEnd, tier, colorClasses, sizeClasses, animationClasses]);

  const finalClasses = getOptimizedClasses(
    `inline-flex items-center justify-center ${className}`.trim()
  );

  return (
    <div className={finalClasses} role="status" aria-label={label}>
      {SpinnerContent}
      {showLabel && (
        <span className={`ml-2 text-sm ${colorClasses} select-none`}>
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
});

AdaptiveSpinner.displayName = 'AdaptiveSpinner';

/**
 * Adaptive Loading Overlay Component
 */
export interface AdaptiveLoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  spinnerSize?: AdaptiveSpinnerProps['size'];
  className?: string;
  overlayClassName?: string;
  blur?: boolean;
}

export const AdaptiveLoadingOverlay = memo<AdaptiveLoadingOverlayProps>(({
  isLoading,
  children,
  message = 'Loading...',
  spinnerSize = 'lg',
  className = '',
  overlayClassName = '',
  blur = true,
}) => {
  const { isLowEnd, tier } = useDeviceCapabilities();
  const { shouldReduceAnimations } = usePerformanceOptimizations();

  const overlayStyles = useMemo(() => {
    let baseClass = 'absolute inset-0 flex items-center justify-center bg-white/80 z-50';
    
    // Add blur effect for better devices
    if (blur && !isLowEnd && !shouldReduceAnimations) {
      baseClass += ' backdrop-blur-sm';
    }
    
    return `${baseClass} ${overlayClassName}`.trim();
  }, [blur, isLowEnd, shouldReduceAnimations, overlayClassName]);

  return (
    <div className={`relative ${className}`.trim()}>
      {children}
      {isLoading && (
        <div className={overlayStyles}>
          <div className="flex flex-col items-center space-y-4">
            <AdaptiveSpinner 
              size={spinnerSize} 
              color="primary"
            />
            {message && (
              <p className="text-sm text-gray-600 text-center max-w-xs">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

AdaptiveLoadingOverlay.displayName = 'AdaptiveLoadingOverlay';

/**
 * Skeleton Loading Component (for better UX)
 */
export interface AdaptiveSkeletonProps {
  lines?: number;
  height?: string;
  className?: string;
  animated?: boolean;
}

export const AdaptiveSkeleton = memo<AdaptiveSkeletonProps>(({
  lines = 1,
  height = '1rem',
  className = '',
  animated = true,
}) => {
  const { isLowEnd } = useDeviceCapabilities();
  const { shouldReduceAnimations } = usePerformanceOptimizations();

  const shouldAnimate = animated && !shouldReduceAnimations && !isLowEnd;

  const skeletonLines = useMemo(() => {
    return Array.from({ length: lines }, (_, index) => (
      <div
        key={index}
        className={`
          bg-gray-200 rounded
          ${shouldAnimate ? 'animate-pulse' : ''}
          ${index < lines - 1 ? 'mb-2' : ''}
          ${className}
        `.trim()}
        style={{ height }}
      />
    ));
  }, [lines, height, className, shouldAnimate]);

  return <div className="space-y-2">{skeletonLines}</div>;
});

AdaptiveSkeleton.displayName = 'AdaptiveSkeleton';

/**
 * Loading Button Component
 */
export interface AdaptiveLoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: AdaptiveSpinnerProps['size'];
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AdaptiveLoadingButton = memo<AdaptiveLoadingButtonProps>(({
  children,
  loading = false,
  loadingText,
  spinnerSize = 'sm',
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const { isLowEnd } = useDeviceCapabilities();

  const variantClasses = useMemo(() => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
      outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
    };
    return variants[variant];
  }, [variant]);

  const baseClasses = `
    inline-flex items-center justify-center px-4 py-2 border rounded-md
    font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${!isLowEnd ? 'transition-colors duration-150' : ''}
    ${variantClasses}
    ${className}
  `.trim();

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <AdaptiveSpinner 
          size={spinnerSize} 
          color="white" 
          className="mr-2" 
        />
      )}
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
});

AdaptiveLoadingButton.displayName = 'AdaptiveLoadingButton';

// Add CSS for slow spin animation (for low-end devices)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 1.2s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

export default AdaptiveSpinner;