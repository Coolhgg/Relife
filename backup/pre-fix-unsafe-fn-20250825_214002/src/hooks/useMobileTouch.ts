/// <reference lib="dom" />
import { useEffect, useRef, useCallback } from 'react';
import { mobileTouchService, TouchGestureOptions } from '../services/mobile-touch';

// Hook for touch gestures
export function useTouchGestures(options: Omit<TouchGestureOptions, 'element'>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = mobileTouchService.registerGestures({
      ...options,
      element,
    });

    return cleanup;
  }, [options]);

  return ref;
}

// Hook for enhanced button interactions
export function useEnhancedButton(hapticType: 'light' | 'medium' | 'heavy' = 'light') {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = mobileTouchService.enhanceButton(element, hapticType);
    return cleanup;
  }, [hapticType]);

  return ref;
}

// Hook for haptic feedback
export function useHaptic() {
  return useCallback(
    (
      type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | '_error' = 'light'
    ) => {
      mobileTouchService.triggerHaptic(type);
    },
    []
  );
}

// Hook for pull-to-refresh
export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const cleanup = mobileTouchService.addPullToRefresh(element, onRefresh);
    return cleanup;
  }, [onRefresh, enabled]);

  return ref;
}

// Hook for swipe navigation
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = mobileTouchService.registerGestures({
      element,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      swipeThreshold: 50,
    });

    return cleanup;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return ref;
}

// Hook for mobile-specific touch behaviors
export function useMobileBehavior() {
  const isTouchDevice = useRef<boolean>();

  useEffect(() => {
    // Detect if device supports touch
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Prevent zoom on double-tap (iOS Safari)
    let lastTouchEnd = 0;
    const preventZoom = (_event: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent pull-to-refresh on body (except for designated areas)
    const preventPullToRefresh = (_event: TouchEvent) => {
      if ((_event.target as HTMLElement).closest('[data-pull-to-refresh]')) {
        return; // Allow pull-to-refresh in designated areas
      }

      // Prevent only when scrolled to top
      if (document.body.scrollTop === 0) {
        event.preventDefault();
      }
    };

    // Add mobile-specific styles to body
    document.body.style.touchAction = 'manipulation';
    document.body.style.webkitTapHighlightColor = 'transparent';
    document.body.style.overscrollBehaviorY = 'contain';

    if (isTouchDevice.current) {
      document.addEventListener('touchend', preventZoom, { passive: false });
      document.addEventListener('touchmove', preventPullToRefresh, {
        passive: false,
      });
    }

    return () => {
      if (isTouchDevice.current) {
        document.removeEventListener('touchend', preventZoom);
        document.removeEventListener('touchmove', preventPullToRefresh);
      }
    };
  }, []);

  return {
    isTouchDevice: isTouchDevice.current ?? false,
    triggerHaptic: mobileTouchService.triggerHaptic.bind(mobileTouchService),
  };
}

// Hook for modal/sheet swipe-to-dismiss
export function useSwipeToDismiss(onDismiss: () => void, threshold = 100) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        // Moving down - show dismiss preview
        const progress = Math.min(deltaY / threshold, 1);
        element.style.transform = `translateY(${deltaY}px)`;
        element.style.opacity = `${1 - progress * 0.3}`;
      }
    };

    const handleTouchEnd = () => {
      const deltaY = currentY - startY;

      if (deltaY > threshold) {
        // Trigger dismiss
        mobileTouchService.triggerHaptic('success');
        onDismiss();
      } else {
        // Snap back
        element.style.transform = '';
        element.style.opacity = '';
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onDismiss, threshold]);

  return ref;
}

// Hook for long press interactions
export function useLongPress(onLongPress: () => void, delay = 500) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = mobileTouchService.registerGestures({
      element,
      onLongPress,
      longPressDelay: delay,
    });

    return cleanup;
  }, [onLongPress, delay]);

  return ref;
}
