/**
 * Adaptive Button Component
 * Automatically adjusts visual complexity and interactions based on device capabilities
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  useDeviceCapabilities,
  usePerformanceOptimizations,
} from '../hooks/useDeviceCapabilities';
import { useOptimizedAnimation } from '../utils/frame-rate-manager';
import type { AnimationConfig } from '../utils/frame-rate-manager';
import { TimeoutHandle } from '../types/timers';

export interface AdaptiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  animationIntensity?: 'minimal' | 'standard' | 'enhanced';
}

export const AdaptiveButton = memo<AdaptiveButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    animationIntensity = 'standard',
    className = '',
    disabled,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }
) => {
    const { isLowEnd, tier } = useDeviceCapabilities();
    const { shouldReduceAnimations } = usePerformanceOptimizations();
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Animation configuration based on device capabilities
    const animationConfig: AnimationConfig = useMemo(
      (
) => ({
        duration: isLowEnd ? 100 : animationIntensity === 'enhanced' ? 300 : 200,
        easing: 'ease-in-out',
        complexity: isLowEnd
          ? 'low'
          : animationIntensity === 'minimal'
            ? 'low'
            : 'medium',
        gpuAccelerated: !isLowEnd,
        willChange: !isLowEnd,
      }),
      [isLowEnd, animationIntensity]
    );

    const {
      startAnimation,
      stopAnimation,
      getOptimizedStyles,
      getOptimizedClasses,
      canAnimate,
    } = useOptimizedAnimation(`button-${variant}-${size}`, animationConfig);

    // Base styles configuration
    const baseStyles = useMemo((
) => {
      const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      };

      const variantClasses = {
        primary: isLowEnd
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600',
        secondary: 'bg-gray-600 text-white border-gray-600',
        outline: 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50',
        ghost: 'bg-transparent border-transparent text-gray-700 hover:bg-gray-100',
      };

      const baseClass = [
        'inline-flex items-center justify-center',
        'border font-medium rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-150',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ');

      return baseClass;
    }, [variant, size, fullWidth, className, isLowEnd]);

    // Enhanced styles for better devices
    const enhancedStyles: React.CSSProperties = useMemo((
) => {
      if (isLowEnd || shouldReduceAnimations) {
        return {};
      }

      const styles: React.CSSProperties = {
        transition: canAnimate ? 'all 0.2s ease-in-out' : 'none',
      };

      // Add subtle effects for better devices
      if (tier === 'high-end' && animationIntensity === 'enhanced') {
        styles.boxShadow =
          variant === 'primary'
            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)';
      }

      if (variant === 'primary' && !isLowEnd) {
        styles.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      }

      return styles;
    }, [
      isLowEnd,
      shouldReduceAnimations,
      canAnimate,
      tier,
      variant,
      animationIntensity,
    ]);

    // Optimized event handlers
    const handleMouseEnter = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>
) => {
        if (canAnimate && !disabled && !loading) {
          startAnimation();
        }
        onMouseEnter?.(event);
      },
      [canAnimate, disabled, loading, startAnimation, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>
) => {
        if (canAnimate) {
          stopAnimation();
        }
        onMouseLeave?.(event);
      },
      [canAnimate, stopAnimation, onMouseLeave]
    );

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>
) => {
        if (loading || disabled) return;

        // Add haptic feedback on supported devices
        if ('vibrate' in navigator && !isLowEnd) {
          navigator.vibrate(10);
        }

        // Add ripple effect for enhanced devices
        if (canAnimate && tier === 'high-end') {
          createRippleEffect(event, buttonRef.current);
        }

        onClick?.(event);
      },
      [loading, disabled, isLowEnd, canAnimate, tier, onClick]
    );

    // Optimized styles
    const finalStyles = getOptimizedStyles(enhancedStyles);
    const finalClasses = getOptimizedClasses(baseStyles);

    // Loading spinner component (simplified for low-end devices)
    const LoadingSpinner = useMemo((
) => {
      if (!loading) return null;

      if (isLowEnd) {
        return <span className="mr-2 text-sm">...</span>;
      }

      return (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }, [loading, isLowEnd]);

    // Icon rendering (optimized for performance)
    const IconElement = useMemo((
) => {
      if (!icon || loading) return null;

      return <span className={children ? 'mr-2' : ''}>{icon}</span>;
    }, [icon, loading, children]);

    return (
      <button
        ref={buttonRef}
        className={finalClasses}
        style={finalStyles}
        disabled={disabled || loading}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {LoadingSpinner}
        {IconElement}
        {children}
      </button>
    );
  }
);

AdaptiveButton.displayName = 'AdaptiveButton';

/**
 * Create ripple effect for enhanced devices
 */
function createRippleEffect(
  event: React.MouseEvent<HTMLButtonElement>,
  element: HTMLButtonElement | null
) {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const ripple = document.createElement('span');
  ripple.className = 'absolute rounded-full bg-white opacity-30 animate-ping';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = '20px';
  ripple.style.height = '20px';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.pointerEvents = 'none';

  const container =
    element.style.position === 'relative' ? element : element.parentElement;
  if (container) {
    if (container.style.position !== 'relative') {
      container.style.position = 'relative';
    }
    container.appendChild(ripple);

    setTimeout((
) => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }
}

export default AdaptiveButton;
