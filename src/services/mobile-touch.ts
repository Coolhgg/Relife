import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export interface TouchGestureOptions {
  element: HTMLElement;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventScroll?: boolean;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class MobileTouchService {
  private static instance: MobileTouchService;
  private activeGestures = new Map<HTMLElement, TouchGestureHandler>();
  private isCapacitorAvailable = false;

  constructor() {
    this.initializeCapacitor();
  }

  static getInstance(): MobileTouchService {
    if (!MobileTouchService.instance) {
      MobileTouchService.instance = new MobileTouchService();
    }
    return MobileTouchService.instance;
  }

  private async initializeCapacitor() {
    try {
      // Check if we're in a Capacitor environment
      this.isCapacitorAvailable = !!(window as any).Capacitor;
    } catch (error) {
      console.warn('Capacitor not available:', error);
      this.isCapacitorAvailable = false;
    }
  }

  // Haptic Feedback Methods
  async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    if (!this.isCapacitorAvailable) {
      // Fallback to vibration API if available
      if (navigator.vibrate) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [50],
          success: [10, 50, 10],
          warning: [25, 25, 25],
          error: [100, 50, 100]
        };
        navigator.vibrate(patterns[type]);
      }
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.SUCCESS });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.WARNING });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.ERROR });
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Touch Gesture Registration
  registerGestures(options: TouchGestureOptions): () => void {
    const handler = new TouchGestureHandler(options);
    this.activeGestures.set(options.element, handler);
    
    return () => this.unregisterGestures(options.element);
  }

  unregisterGestures(element: HTMLElement) {
    const handler = this.activeGestures.get(element);
    if (handler) {
      handler.destroy();
      this.activeGestures.delete(element);
    }
  }

  // Enhanced Button Interactions
  enhanceButton(button: HTMLElement, hapticType: 'light' | 'medium' | 'heavy' = 'light') {
    const handleTouchStart = () => {
      button.style.transform = 'scale(0.95)';
      this.triggerHaptic(hapticType);
    };

    const handleTouchEnd = () => {
      button.style.transform = '';
    };

    button.addEventListener('touchstart', handleTouchStart, { passive: true });
    button.addEventListener('touchend', handleTouchEnd, { passive: true });
    button.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Add visual feedback classes
    button.classList.add('mobile-tap-highlight', 'touch-target');

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchEnd);
      button.style.transform = '';
    };
  }

  // Pull-to-Refresh Implementation
  addPullToRefresh(container: HTMLElement, onRefresh: () => Promise<void>) {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;
    let pullDistance = 0;
    const threshold = 80;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || container.scrollTop > 0) return;
      
      currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;

      if (pullDistance > 0) {
        e.preventDefault();
        container.style.transform = `translateY(${Math.min(pullDistance * 0.5, threshold)}px)`;
        
        // Visual feedback
        const opacity = Math.min(pullDistance / threshold, 1);
        container.style.background = `linear-gradient(to bottom, 
          rgba(59, 130, 246, ${opacity * 0.1}) 0%, 
          transparent 100%)`;
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        isRefreshing = true;
        await this.triggerHaptic('success');
        
        try {
          await onRefresh();
        } finally {
          isRefreshing = false;
        }
      }

      // Reset visual state
      container.style.transform = '';
      container.style.background = '';
      pullDistance = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.style.transform = '';
      container.style.background = '';
    };
  }
}

class TouchGestureHandler {
  private element: HTMLElement;
  private options: TouchGestureOptions;
  private startPoint: TouchPoint | null = null;
  private longPressTimer: number | null = null;
  private lastTap = 0;
  private tapTimeout: number | null = null;

  constructor(options: TouchGestureOptions) {
    this.element = options.element;
    this.options = {
      swipeThreshold: 50,
      longPressDelay: 500,
      preventScroll: false,
      ...options
    };

    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: !this.options.preventScroll });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: !this.options.preventScroll });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
  }

  private handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    this.startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    // Start long press timer
    if (this.options.onLongPress) {
      this.longPressTimer = window.setTimeout(() => {
        this.options.onLongPress?.();
        MobileTouchService.getInstance().triggerHaptic('medium');
      }, this.options.longPressDelay);
    }

    if (this.options.preventScroll) {
      e.preventDefault();
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.startPoint) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - this.startPoint.x);
    const deltaY = Math.abs(touch.clientY - this.startPoint.y);

    // Cancel long press if moved too much
    if (this.longPressTimer && (deltaX > 10 || deltaY > 10)) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.options.preventScroll) {
      e.preventDefault();
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.startPoint) return;

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.startPoint.x;
    const deltaY = touch.clientY - this.startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.startPoint.timestamp;

    // Check for swipe gestures
    if (distance > this.options.swipeThreshold! && duration < 500) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      
      if (Math.abs(angle) < 45) {
        // Right swipe
        this.options.onSwipeRight?.();
        MobileTouchService.getInstance().triggerHaptic('light');
      } else if (Math.abs(angle) > 135) {
        // Left swipe
        this.options.onSwipeLeft?.();
        MobileTouchService.getInstance().triggerHaptic('light');
      } else if (angle > 45 && angle < 135) {
        // Down swipe
        this.options.onSwipeDown?.();
        MobileTouchService.getInstance().triggerHaptic('light');
      } else if (angle < -45 && angle > -135) {
        // Up swipe
        this.options.onSwipeUp?.();
        MobileTouchService.getInstance().triggerHaptic('light');
      }
    } else if (distance < 10 && duration < 500) {
      // Tap gesture
      const now = Date.now();
      const timeSinceLastTap = now - this.lastTap;

      if (timeSinceLastTap < 300 && this.options.onDoubleTap) {
        // Double tap
        if (this.tapTimeout) {
          clearTimeout(this.tapTimeout);
          this.tapTimeout = null;
        }
        this.options.onDoubleTap();
        MobileTouchService.getInstance().triggerHaptic('medium');
      } else if (this.options.onTap) {
        // Single tap (with delay to check for double tap)
        this.tapTimeout = window.setTimeout(() => {
          this.options.onTap?.();
          MobileTouchService.getInstance().triggerHaptic('light');
        }, this.options.onDoubleTap ? 300 : 0);
      }

      this.lastTap = now;
    }

    this.startPoint = null;
  };

  private handleTouchCancel = () => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
    this.startPoint = null;
  };

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }
  }
}

export const mobileTouchService = MobileTouchService.getInstance();