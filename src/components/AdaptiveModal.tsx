/**
 * Adaptive Modal Component
 * Automatically adjusts visual complexity, animations, and interactions based on device capabilities
 */

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDeviceCapabilities, usePerformanceOptimizations } from '../hooks/useDeviceCapabilities';
import { useOptimizedAnimation } from '../utils/frame-rate-manager';
import { createMemoryEfficientListener } from '../utils/memory-management';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useFocusRestoration } from '../hooks/useFocusRestoration';
import type { AnimationConfig } from '../utils/frame-rate-manager';

export interface AdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  animationIntensity?: 'minimal' | 'standard' | 'enhanced';
  priority?: 'low' | 'normal' | 'high';
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
  preventScroll?: boolean;
  announceOnOpen?: string;
  announceOnClose?: string;
}

export const AdaptiveModal = memo<AdaptiveModalProps>(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  animationIntensity = 'standard',
  priority = 'normal',
  initialFocusRef,
  finalFocusRef,
  preventScroll = true,
  announceOnOpen,
  announceOnClose,
}) => {
  const { isLowEnd, deviceTier } = useDeviceCapabilities();
  const { shouldReduceAnimations } = usePerformanceOptimizations();
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animation configuration based on device capabilities
  const animationConfig: AnimationConfig = useMemo(() => ({
    duration: isLowEnd ? 150 : animationIntensity === 'enhanced' ? 300 : 200,
    easing: isLowEnd ? 'ease' : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    complexity: isLowEnd ? 'low' : animationIntensity === 'minimal' ? 'low' : 'medium',
    gpuAccelerated: !isLowEnd && deviceTier !== 'low-end',
    willChange: !isLowEnd && deviceTier !== 'low-end',
  }), [isLowEnd, deviceTier, animationIntensity]);

  const {
    startAnimation,
    stopAnimation,
    getOptimizedStyles,
    getOptimizedClasses,
    canAnimate,
  } = useOptimizedAnimation(`modal-${size}`, animationConfig);

  // Size configurations
  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: isLowEnd ? 'w-full max-w-sm' : 'w-full max-w-sm',
      md: isLowEnd ? 'w-full max-w-md' : 'w-full max-w-md',
      lg: isLowEnd ? 'w-full max-w-lg' : 'w-full max-w-lg',
      xl: isLowEnd ? 'w-full max-w-2xl' : 'w-full max-w-2xl',
      full: 'w-full h-full max-w-full max-h-full',
    };

    return sizes[size];
  }, [size, isLowEnd]);

  // Modal styles based on device capabilities
  const modalStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      backgroundColor: '#ffffff',
      borderRadius: isLowEnd ? '8px' : '12px',
      padding: 0,
      maxHeight: size === 'full' ? '100vh' : '90vh',
      overflow: 'hidden',
    };

    // Enhanced styling for better devices
    if (!isLowEnd && deviceTier !== 'low-end') {
      baseStyles.boxShadow = animationIntensity === 'enhanced' 
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        : '0 10px 25px rgba(0, 0, 0, 0.15)';
    } else {
      baseStyles.border = '1px solid #e5e7eb';
    }

    // Animation styles
    if (canAnimate && !shouldReduceAnimations) {
      baseStyles.transform = isOpen ? 'scale(1)' : 'scale(0.95)';
      baseStyles.opacity = isOpen ? 1 : 0;
      baseStyles.transition = `transform ${animationConfig.duration}ms ${animationConfig.easing}, opacity ${animationConfig.duration}ms ${animationConfig.easing}`;
    }

    return baseStyles;
  }, [isLowEnd, deviceTier, animationIntensity, canAnimate, shouldReduceAnimations, isOpen, animationConfig, size]);

  // Overlay styles
  const overlayStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: size === 'full' ? 'stretch' : 'center',
      justifyContent: 'center',
      padding: size === 'full' ? 0 : isLowEnd ? '16px' : '24px',
    };

    // Background and backdrop
    if (isLowEnd || shouldReduceAnimations) {
      baseStyles.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    } else {
      baseStyles.backgroundColor = isOpen ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)';
      baseStyles.backdropFilter = deviceTier === 'high-end' ? 'blur(4px)' : undefined;
      baseStyles.transition = `background-color ${animationConfig.duration}ms ${animationConfig.easing}`;
    }

    return baseStyles;
  }, [isLowEnd, shouldReduceAnimations, isOpen, deviceTier, animationConfig, size]);

  // Setup robust focus restoration
  const { saveFocus, restoreFocus } = useFocusRestoration({
    announceRestoration: true,
    preventScroll,
  });

  // Setup focus trap with improved restoration
  const { containerRef } = useFocusTrap({
    isEnabled: isOpen,
    restoreFocus: false, // We'll handle this manually with the restoration hook
    allowOutsideClick: false,
    preventScroll,
    initialFocusRef,
    finalFocusRef,
    onEscape: closeOnEscape ? onClose : undefined,
    announceOnOpen: announceOnOpen || (title ? `Modal opened: ${title}` : 'Modal opened'),
    announceOnClose: announceOnClose || (title ? `Modal closed: ${title}` : 'Modal closed'),
  });

  // Handle animation lifecycle
  useEffect(() => {
    if (isOpen) {
      // Start animation
      if (canAnimate) {
        startAnimation();
      }
    } else {
      // Stop animation
      if (canAnimate) {
        stopAnimation();
      }
    }
  }, [isOpen, canAnimate, startAnimation, stopAnimation]);

  // Handle focus management and animation lifecycle
  useEffect(() => {
    if (isOpen) {
      // Save current focus before opening
      saveFocus();
      
      // Start animation
      if (canAnimate) {
        startAnimation();
      }
    } else {
      // Stop animation
      if (canAnimate) {
        stopAnimation();
      }
      
      // Restore focus after closing
      setTimeout(() => {
        restoreFocus();
      }, 100); // Small delay to ensure modal is fully removed
    }
  }, [isOpen, canAnimate, startAnimation, stopAnimation, saveFocus, restoreFocus]);

  // Sync containerRef with modalRef
  useEffect(() => {
    if (modalRef.current && containerRef) {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = modalRef.current;
    }
  }, [containerRef]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlay && event.target === overlayRef.current) {
      onClose();
    }
  }, [closeOnOverlay, onClose]);

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Optimized styles
  const finalModalStyles = getOptimizedStyles(modalStyles);
  const finalOverlayClasses = getOptimizedClasses(overlayClassName);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      ref={overlayRef}
      className={finalOverlayClasses}
      style={overlayStyles}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`${sizeClasses} ${className}`.trim()}
        style={finalModalStyles}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2 
                id="modal-title" 
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {closable && (
              <button
                type="button"
                className={`
                  text-gray-400 hover:text-gray-600 p-1 rounded-md
                  ${canAnimate ? 'transition-colors duration-150' : ''}
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
                onClick={handleCloseClick}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            maxHeight: size === 'full' 
              ? 'calc(100vh - 60px)' 
              : 'calc(90vh - 60px)' 
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal for better performance and z-index management
  return createPortal(modalContent, document.body);
});

AdaptiveModal.displayName = 'AdaptiveModal';

/**
 * Modal hook for easier state management
 */
export function useAdaptiveModal(initialOpen = false) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Modal wrapper with confirmation dialog
 */
export interface ConfirmationModalProps extends Omit<AdaptiveModalProps, 'children'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const AdaptiveConfirmationModal = memo<ConfirmationModalProps>(({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  variant = 'info',
  ...modalProps
}) => {
  const { isLowEnd } = useDeviceCapabilities();

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const variantStyles = useMemo(() => {
    const styles = {
      danger: 'text-red-600 bg-red-50 border-red-200',
      warning: 'text-orange-600 bg-orange-50 border-orange-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    return styles[variant];
  }, [variant]);

  const buttonVariant = useMemo(() => {
    return variant === 'danger' ? 'primary' : 'secondary';
  }, [variant]);

  return (
    <AdaptiveModal
      {...modalProps}
      onClose={onClose}
      size="sm"
      animationIntensity={isLowEnd ? 'minimal' : 'standard'}
    >
      <div className="p-6">
        <div className={`p-4 rounded-lg ${variantStyles} mb-6`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-md
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }
            `}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AdaptiveModal>
  );
});

AdaptiveConfirmationModal.displayName = 'AdaptiveConfirmationModal';

export default AdaptiveModal;