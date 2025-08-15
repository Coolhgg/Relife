// Mobile-Specific Accessibility for Smart Alarm App
// Provides touch, gesture, and mobile screen reader optimizations

import ScreenReaderService from './screen-reader';

export interface TouchGesture {
  name: string;
  action: (event: TouchEvent) => void;
  description: string;
  fingers: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  enabled: boolean;
}

export interface MobileAccessibilityState {
  isEnabled: boolean;
  touchTargetSize: number; // Minimum touch target size in pixels
  gesturesEnabled: boolean;
  hapticFeedback: boolean;
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  swipeGesturesEnabled: boolean;
  doubleTapDelay: number;
}

export interface MobileDevice {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenReader: 'talkback' | 'voiceover' | 'none';
  orientation: 'portrait' | 'landscape';
}

/**
 * Mobile Accessibility Service for touch and mobile optimizations
 */
export class MobileAccessibilityService {
  private static instance: MobileAccessibilityService;
  private gestures: Map<string, TouchGesture> = new Map();
  private state: MobileAccessibilityState;
  private device: MobileDevice;
  private screenReader: ScreenReaderService;
  private activeTouch?: Touch;
  private touchStartTime = 0;
  private touchStartPosition = { x: 0, y: 0 };
  private lastTapTime = 0;
  private tapCount = 0;
  private vibrationSupported = false;

  private constructor() {
    this.device = this.detectDevice();
    this.screenReader = ScreenReaderService.getInstance();
    this.vibrationSupported = 'vibrate' in navigator;
    
    this.state = {
      isEnabled: this.device.isMobile,
      touchTargetSize: 44, // iOS HIG minimum
      gesturesEnabled: true,
      hapticFeedback: true,
      largeText: false,
      highContrast: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      screenReaderOptimized: this.device.screenReader !== 'none',
      swipeGesturesEnabled: true,
      doubleTapDelay: 300
    };
    
    this.initializeGestures();
    this.setupEventListeners();
    this.applyMobileOptimizations();
  }

  static getInstance(): MobileAccessibilityService {
    if (!MobileAccessibilityService.instance) {
      MobileAccessibilityService.instance = new MobileAccessibilityService();
    }
    return MobileAccessibilityService.instance;
  }

  /**
   * Initialize the mobile accessibility service
   */
  initialize(): void {
    this.createMobileLiveRegions();
    this.optimizeForScreenReader();
    this.setupTouchGestures();
    this.adaptToDevice();
  }

  /**
   * Check if mobile accessibility features are enabled
   */
  get isEnabled(): boolean {
    return this.state.isEnabled && this.device.isMobile;
  }

  /**
   * Detect mobile device and screen reader
   */
  private detectDevice(): MobileDevice {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    
    // Detect screen readers
    let screenReader: 'talkback' | 'voiceover' | 'none' = 'none';
    if (isIOS && window.speechSynthesis) {
      // VoiceOver detection (approximate)
      screenReader = 'voiceover';
    } else if (isAndroid) {
      // TalkBack detection (approximate)
      screenReader = 'talkback';
    }
    
    return {
      isMobile: isMobile || isTablet,
      isTablet,
      isIOS,
      isAndroid,
      screenReader,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };
  }

  /**
   * Initialize touch gestures
   */
  private initializeGestures(): void {
    const gestures: TouchGesture[] = [
      {
        name: 'swipe-left',
        action: () => this.handleSwipeLeft(),
        description: 'Swipe left to go to next alarm',
        fingers: 1,
        direction: 'left',
        enabled: true
      },
      {
        name: 'swipe-right',
        action: () => this.handleSwipeRight(),
        description: 'Swipe right to go to previous alarm',
        fingers: 1,
        direction: 'right',
        enabled: true
      },
      {
        name: 'swipe-up',
        action: () => this.handleSwipeUp(),
        description: 'Swipe up to dismiss alarm',
        fingers: 1,
        direction: 'up',
        enabled: true
      },
      {
        name: 'swipe-down',
        action: () => this.handleSwipeDown(),
        description: 'Swipe down to snooze alarm',
        fingers: 1,
        direction: 'down',
        enabled: true
      },
      {
        name: 'two-finger-tap',
        action: () => this.handleTwoFingerTap(),
        description: 'Two finger tap to toggle screen reader mode',
        fingers: 2,
        direction: 'none',
        enabled: true
      },
      {
        name: 'three-finger-swipe-up',
        action: () => this.handleThreeFingerSwipeUp(),
        description: 'Three finger swipe up to read page',
        fingers: 3,
        direction: 'up',
        enabled: true
      },
      {
        name: 'long-press',
        action: () => this.handleLongPress(),
        description: 'Long press for context menu',
        fingers: 1,
        direction: 'none',
        enabled: true
      }
    ];

    gestures.forEach(gesture => {
      this.gestures.set(gesture.name, gesture);
    });
  }

  /**
   * Setup touch event listeners
   */
  private setupEventListeners(): void {
    if (!this.state.isEnabled) return;

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Orientation change listener
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Media query listeners for accessibility preferences
    this.setupMediaQueryListeners();
  }

  /**
   * Setup media query listeners for accessibility preferences
   */
  private setupMediaQueryListeners(): void {
    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addListener((e) => {
      this.state.reducedMotion = e.matches;
      this.announcePreferenceChange('Reduced motion', e.matches);
    });

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addListener((e) => {
      this.state.highContrast = e.matches;
      this.announcePreferenceChange('High contrast', e.matches);
      this.applyContrastOptimizations(e.matches);
    });

    // Large text preference (approximate)
    const largeTextQuery = window.matchMedia('(min-font-size: 18px)');
    largeTextQuery.addListener((e) => {
      this.state.largeText = e.matches;
      this.announcePreferenceChange('Large text', e.matches);
      this.applyTextSizeOptimizations(e.matches);
    });
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.state.gesturesEnabled) return;

    this.activeTouch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: this.activeTouch.clientX,
      y: this.activeTouch.clientY
    };

    // Handle multi-finger gestures
    if (event.touches.length > 1) {
      this.handleMultiTouchStart(event);
    }
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.state.gesturesEnabled || !this.activeTouch) return;

    // Prevent default for custom gestures but allow scrolling for screen readers
    if (!this.state.screenReaderOptimized) {
      const currentTouch = event.touches[0];
      const deltaX = Math.abs(currentTouch.clientX - this.touchStartPosition.x);
      const deltaY = Math.abs(currentTouch.clientY - this.touchStartPosition.y);
      
      // Prevent default for horizontal swipes to avoid navigation conflicts
      if (deltaX > deltaY && deltaX > 20) {
        event.preventDefault();
      }
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.state.gesturesEnabled || !this.activeTouch) return;

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    const endTouch = event.changedTouches[0];
    
    const deltaX = endTouch.clientX - this.touchStartPosition.x;
    const deltaY = endTouch.clientY - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Handle different gesture types
    if (touchDuration > 500 && distance < 10) {
      // Long press
      this.executeGesture('long-press', event);
    } else if (distance > 50 && touchDuration < 300) {
      // Swipe gesture
      this.handleSwipeGesture(deltaX, deltaY, event);
    } else if (distance < 10 && touchDuration < 300) {
      // Tap gesture
      this.handleTapGesture(event);
    }

    this.activeTouch = undefined;
  }

  /**
   * Handle multi-touch start
   */
  private handleMultiTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      // Two finger gesture
      this.executeGesture('two-finger-tap', event);
    } else if (event.touches.length === 3) {
      // Three finger gesture - start tracking for swipe
      this.touchStartTime = Date.now();
    }
  }

  /**
   * Handle swipe gestures
   */
  private handleSwipeGesture(deltaX: number, deltaY: number, event: TouchEvent): void {
    if (!this.state.swipeGesturesEnabled) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.executeGesture('swipe-right', event);
      } else {
        this.executeGesture('swipe-left', event);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.executeGesture('swipe-down', event);
      } else {
        this.executeGesture('swipe-up', event);
      }
    }
  }

  /**
   * Handle tap gestures (including double tap)
   */
  private handleTapGesture(event: TouchEvent): void {
    const currentTime = Date.now();
    
    if (currentTime - this.lastTapTime < this.state.doubleTapDelay) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    
    this.lastTapTime = currentTime;
    
    // Handle double tap
    if (this.tapCount === 2) {
      this.handleDoubleTap(event);
      this.tapCount = 0;
    }
  }

  /**
   * Execute a gesture action
   */
  private executeGesture(gestureName: string, event: TouchEvent): void {
    const gesture = this.gestures.get(gestureName);
    if (!gesture || !gesture.enabled) return;

    // Provide haptic feedback
    this.provideHapticFeedback('light');
    
    // Announce gesture to screen reader
    this.screenReader.announce(`Gesture: ${gesture.description}`, 'polite');
    
    // Execute gesture action
    try {
      gesture.action(event);
    } catch (error) {
      console.error('Error executing gesture:', error);
    }
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    setTimeout(() => {
      this.device.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      this.screenReader.announce(`Orientation changed to ${this.device.orientation}`, 'polite');
      this.applyOrientationOptimizations();
    }, 100);
  }

  /**
   * Apply mobile-specific optimizations
   */
  private applyMobileOptimizations(): void {
    if (!this.state.isEnabled) return;

    // Add mobile accessibility classes to body
    document.body.classList.add('mobile-accessible');
    
    if (this.state.screenReaderOptimized) {
      document.body.classList.add('screen-reader-optimized');
    }
    
    if (this.device.isIOS) {
      document.body.classList.add('ios-optimized');
    } else if (this.device.isAndroid) {
      document.body.classList.add('android-optimized');
    }
    
    // Ensure minimum touch target sizes
    this.ensureTouchTargetSizes();
    
    // Apply text and contrast optimizations
    this.applyTextSizeOptimizations(this.state.largeText);
    this.applyContrastOptimizations(this.state.highContrast);
  }

  /**
   * Ensure minimum touch target sizes
   */
  private ensureTouchTargetSizes(): void {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-accessible button,
      .mobile-accessible [role="button"],
      .mobile-accessible input[type="checkbox"],
      .mobile-accessible input[type="radio"],
      .mobile-accessible .touch-target {
        min-height: ${this.state.touchTargetSize}px;
        min-width: ${this.state.touchTargetSize}px;
        position: relative;
      }
      
      .mobile-accessible .touch-target::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-height: ${this.state.touchTargetSize}px;
        min-width: ${this.state.touchTargetSize}px;
        z-index: -1;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Apply text size optimizations
   */
  private applyTextSizeOptimizations(enabled: boolean): void {
    if (enabled) {
      document.body.classList.add('large-text');
      const style = document.createElement('style');
      style.id = 'large-text-styles';
      style.textContent = `
        .large-text {
          font-size: 120% !important;
        }
        .large-text h1 { font-size: 2.5rem !important; }
        .large-text h2 { font-size: 2rem !important; }
        .large-text h3 { font-size: 1.75rem !important; }
        .large-text p, .large-text button, .large-text input {
          font-size: 1.125rem !important;
        }
        .large-text .text-sm { font-size: 1rem !important; }
        .large-text .text-xs { font-size: 0.875rem !important; }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('large-text');
      const existingStyle = document.getElementById('large-text-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  /**
   * Apply contrast optimizations
   */
  private applyContrastOptimizations(enabled: boolean): void {
    if (enabled) {
      document.body.classList.add('high-contrast');
      const style = document.createElement('style');
      style.id = 'high-contrast-styles';
      style.textContent = `
        .high-contrast {
          filter: contrast(150%);
        }
        .high-contrast button {
          border: 2px solid !important;
        }
        .high-contrast .text-gray-500 {
          color: #000000 !important;
        }
        .high-contrast .bg-gray-100 {
          background-color: #ffffff !important;
          border: 1px solid #000000 !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('high-contrast');
      const existingStyle = document.getElementById('high-contrast-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  /**
   * Apply orientation-specific optimizations
   */
  private applyOrientationOptimizations(): void {
    document.body.classList.remove('portrait', 'landscape');
    document.body.classList.add(this.device.orientation);
    
    if (this.device.orientation === 'landscape' && this.device.isMobile) {
      // Adjust for landscape mobile view
      document.body.classList.add('landscape-mobile');
    } else {
      document.body.classList.remove('landscape-mobile');
    }
  }

  /**
   * Provide haptic feedback
   */
  private provideHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.state.hapticFeedback || !this.vibrationSupported) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };

    try {
      navigator.vibrate(patterns[intensity]);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  /**
   * Announce accessibility preference changes
   */
  private announcePreferenceChange(preference: string, enabled: boolean): void {
    const status = enabled ? 'enabled' : 'disabled';
    this.screenReader.announce(`${preference} ${status}`, 'polite');
  }

  /**
   * Gesture action handlers
   */
  private handleSwipeLeft(): void {
    const event = new CustomEvent('mobile-gesture', {
      detail: { gesture: 'swipe-left', action: 'next-alarm' }
    });
    document.dispatchEvent(event);
  }

  private handleSwipeRight(): void {
    const event = new CustomEvent('mobile-gesture', {
      detail: { gesture: 'swipe-right', action: 'previous-alarm' }
    });
    document.dispatchEvent(event);
  }

  private handleSwipeUp(): void {
    const event = new CustomEvent('mobile-gesture', {
      detail: { gesture: 'swipe-up', action: 'dismiss-alarm' }
    });
    document.dispatchEvent(event);
  }

  private handleSwipeDown(): void {
    const event = new CustomEvent('mobile-gesture', {
      detail: { gesture: 'swipe-down', action: 'snooze-alarm' }
    });
    document.dispatchEvent(event);
  }

  private handleTwoFingerTap(): void {
    const currentState = this.screenReader.getState();
    this.screenReader.updateSettings({
      isEnabled: !currentState.isEnabled
    });
  }

  private handleThreeFingerSwipeUp(): void {
    const event = new CustomEvent('mobile-gesture', {
      detail: { gesture: 'three-finger-swipe-up', action: 'read-page' }
    });
    document.dispatchEvent(event);
  }

  private handleLongPress(): void {
    const event = new CustomEvent('mobile-gesture', {
      detail: { gesture: 'long-press', action: 'context-menu' }
    });
    document.dispatchEvent(event);
  }

  private handleDoubleTap(event: TouchEvent): void {
    // Standard double-tap activation
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button')) {
      target.click();
      this.provideHapticFeedback('medium');
    }
  }

  /**
   * Add mobile-specific ARIA live regions
   */
  createMobileLiveRegions(): void {
    // Status bar for mobile screen readers
    const statusBar = document.createElement('div');
    statusBar.id = 'mobile-status-bar';
    statusBar.setAttribute('aria-live', 'polite');
    statusBar.setAttribute('aria-atomic', 'true');
    statusBar.className = 'sr-only';
    document.body.appendChild(statusBar);

    // Gesture feedback region
    const gestureRegion = document.createElement('div');
    gestureRegion.id = 'gesture-feedback';
    gestureRegion.setAttribute('aria-live', 'assertive');
    gestureRegion.setAttribute('aria-atomic', 'true');
    gestureRegion.className = 'sr-only';
    document.body.appendChild(gestureRegion);
  }

  /**
   * Optimize for specific mobile screen readers
   */
  optimizeForScreenReader(): void {
    if (this.device.screenReader === 'voiceover') {
      this.optimizeForVoiceOver();
    } else if (this.device.screenReader === 'talkback') {
      this.optimizeForTalkBack();
    }
  }

  /**
   * VoiceOver specific optimizations
   */
  private optimizeForVoiceOver(): void {
    document.body.classList.add('voiceover-optimized');
    
    // VoiceOver specific ARIA patterns
    const style = document.createElement('style');
    style.textContent = `
      .voiceover-optimized [role="button"]:focus {
        outline: 3px solid #007AFF;
        outline-offset: 2px;
      }
      .voiceover-optimized .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * TalkBack specific optimizations
   */
  private optimizeForTalkBack(): void {
    document.body.classList.add('talkback-optimized');
    
    // TalkBack specific optimizations
    const style = document.createElement('style');
    style.textContent = `
      .talkback-optimized [role="button"]:focus {
        outline: 2px solid #4285F4;
        outline-offset: 2px;
      }
      .talkback-optimized .touch-target {
        min-height: 48px;
        min-width: 48px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update mobile accessibility settings
   */
  updateSettings(settings: Partial<MobileAccessibilityState>): void {
    this.state = { ...this.state, ...settings };
    
    // Reapply optimizations based on new settings
    this.applyMobileOptimizations();
    
    this.screenReader.announce('Mobile accessibility settings updated', 'polite');
  }

  /**
   * Get current state
   */
  getState(): MobileAccessibilityState {
    return { ...this.state };
  }

  /**
   * Get device information
   */
  getDevice(): MobileDevice {
    return { ...this.device };
  }

  /**
   * Get available gestures
   */
  getGestures(): TouchGesture[] {
    return Array.from(this.gestures.values())
      .filter(gesture => gesture.enabled);
  }

  /**
   * Enable or disable specific gesture
   */
  setGestureEnabled(gestureName: string, enabled: boolean): void {
    const gesture = this.gestures.get(gestureName);
    if (gesture) {
      gesture.enabled = enabled;
    }
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Remove mobile accessibility classes
    document.body.classList.remove(
      'mobile-accessible', 'screen-reader-optimized', 'ios-optimized', 
      'android-optimized', 'large-text', 'high-contrast', 'voiceover-optimized', 
      'talkback-optimized', 'portrait', 'landscape', 'landscape-mobile'
    );
  }
}

export default MobileAccessibilityService;