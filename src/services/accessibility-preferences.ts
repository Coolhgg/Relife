/// <reference lib="dom" />
/**
 * Accessibility Preferences System
 * Comprehensive accessibility settings management with system integration
 */

export interface AccessibilityPreferences {
  // Visual preferences
  highContrastMode: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindFriendly: boolean;
  darkMode: boolean;

  // Focus and navigation
  enhancedFocusRings: boolean;
  focusRingColor: string;
  skipLinksVisible: boolean;
  keyboardNavigation: boolean;

  // Screen reader and audio
  screenReaderOptimized: boolean;
  announceTransitions: boolean;
  announceErrors: boolean;
  announceSuccess: boolean;
  speechRate: number; // 0.5 to 2.0

  // Touch and interaction
  largerTouchTargets: boolean;
  hapticFeedback: boolean;
  longPressDelay: number; // milliseconds

  // Advanced features
  voiceCommands: boolean;
  gestureNavigation: boolean;
  autoplay: boolean;
  blinkingElements: boolean;
}

export interface AccessibilityState extends AccessibilityPreferences {
  isSystemDarkMode: boolean;
  isSystemReducedMotion: boolean;
  isSystemHighContrast: boolean;
  systemFontScale: number;
  screenReaderActive: boolean;
  touchDevice: boolean;
  hasHover: boolean;
}

class AccessibilityPreferencesService {
  private static instance: AccessibilityPreferencesService;
  private preferences: AccessibilityPreferences;
  private listeners: Array<(prefs: AccessibilityPreferences
) => void> = [];
  private mediaQueries: Map<string, MediaQueryList> = new Map();
  private styleElement?: HTMLStyleElement;

  private defaultPreferences: AccessibilityPreferences = {
    // Visual preferences
    highContrastMode: false,
    reducedMotion: false,
    fontSize: 'medium',
    colorBlindFriendly: false,
    darkMode: false,

    // Focus and navigation
    enhancedFocusRings: true,
    focusRingColor: '#007AFF',
    skipLinksVisible: true,
    keyboardNavigation: true,

    // Screen reader and audio
    screenReaderOptimized: false,
    announceTransitions: true,
    announceErrors: true,
    announceSuccess: true,
    speechRate: 1.0,

    // Touch and interaction
    largerTouchTargets: false,
    hapticFeedback: true,
    longPressDelay: 500,

    // Advanced features
    voiceCommands: false,
    gestureNavigation: true,
    autoplay: false,
    blinkingElements: true,
  };

  private constructor() {
    this.preferences = this.loadPreferences();
    this.initializeSystemDetection();
    this.applyPreferences();
  }

  static getInstance(): AccessibilityPreferencesService {
    if (!AccessibilityPreferencesService.instance) {
      AccessibilityPreferencesService.instance = new AccessibilityPreferencesService();
    }
    return AccessibilityPreferencesService.instance;
  }

  /**
   * Initialize system accessibility detection
   */
  private initializeSystemDetection(): void {
    // Dark mode detection
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueries.set('dark-mode', darkModeQuery);
      darkModeQuery.addEventListener('change', (
) => this.handleSystemChange());

      // Reduced motion detection
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.mediaQueries.set('reduced-motion', reducedMotionQuery);
      reducedMotionQuery.addEventListener('change', (
) => this.handleSystemChange());

      // High contrast detection (Windows)
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      this.mediaQueries.set('high-contrast', highContrastQuery);
      highContrastQuery.addEventListener('change', (
) => this.handleSystemChange());

      // Touch device detection
      const hoverQuery = window.matchMedia('(hover: hover)');
      this.mediaQueries.set('hover', hoverQuery);
      hoverQuery.addEventListener('change', (
) => this.handleSystemChange());
    }

    // Screen reader detection
    this.detectScreenReader();
  }

  /**
   * Detect if screen reader is active
   */
  private detectScreenReader(): void {
    // Multiple methods to detect screen readers
    const indicators = [
      // NVDA, JAWS, etc. often set these
      navigator.userAgent.includes('NVDA') || navigator.userAgent.includes('JAWS'),

      // Check for common screen reader APIs
      'speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0,

      // Check for accessibility APIs
      'accessibility' in navigator,

      // Check for reduced motion (often enabled with screen readers)
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    ];

    const screenReaderLikely = indicators.filter(Boolean).length >= 2;

    if (screenReaderLikely && !this.preferences.screenReaderOptimized) {
      this.updatePreferences({
        screenReaderOptimized: true,
        reducedMotion: true,
        announceTransitions: true,
        enhancedFocusRings: true,
      });
    }
  }

  /**
   * Handle system preference changes
   */
  private handleSystemChange(): void {
    const state = this.getState();

    // Auto-adjust based on system preferences if user hasn't manually set them
    if (!this.hasUserOverride('reducedMotion') && state.isSystemReducedMotion) {
      this.updatePreferences({ reducedMotion: true });
    }

    if (!this.hasUserOverride('highContrastMode') && state.isSystemHighContrast) {
      this.updatePreferences({ highContrastMode: true });
    }

    if (!this.hasUserOverride('darkMode') && state.isSystemDarkMode) {
      this.updatePreferences({ darkMode: true });
    }

    this.notifyListeners();
  }

  /**
   * Check if user has manually overridden a preference
   */
  private hasUserOverride(preference: keyof AccessibilityPreferences): boolean {
    const stored = localStorage.getItem('accessibility-overrides');
    if (!stored) return false;

    try {
      const overrides = JSON.parse(stored);
      return preference in overrides;
    } catch {
      return false;
    }
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): AccessibilityPreferences {
    try {
      const stored = localStorage.getItem('accessibility-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }

    return { ...this.defaultPreferences };
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(
        'accessibility-preferences',
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  /**
   * Apply preferences to the document
   */
  private applyPreferences(): void {
    const root = document.documentElement;
    const body = document.body;

    // Apply CSS custom properties
    root.style.setProperty('--a11y-font-scale', this.getFontScale());
    root.style.setProperty('--a11y-focus-ring-color', this.preferences.focusRingColor);
    root.style.setProperty(
      '--a11y-long-press-delay',
      `${this.preferences.longPressDelay}ms`
    );

    // Apply class-based preferences
    body.classList.toggle('a11y-high-contrast', this.preferences.highContrastMode);
    body.classList.toggle('a11y-reduced-motion', this.preferences.reducedMotion);
    body.classList.toggle(
      'a11y-large-touch-targets',
      this.preferences.largerTouchTargets
    );
    body.classList.toggle('a11y-enhanced-focus', this.preferences.enhancedFocusRings);
    body.classList.toggle('a11y-screen-reader', this.preferences.screenReaderOptimized);
    body.classList.toggle(
      'a11y-color-blind-friendly',
      this.preferences.colorBlindFriendly
    );
    body.classList.toggle('a11y-skip-links-visible', this.preferences.skipLinksVisible);
    body.classList.toggle('a11y-no-autoplay', !this.preferences.autoplay);
    body.classList.toggle('a11y-no-blinking', !this.preferences.blinkingElements);

    // Create or update CSS styles
    this.updateAccessibilityStyles();

    // Configure speech synthesis
    this.configureSpeechSynthesis();
  }

  /**
   * Get font scale multiplier
   */
  private getFontScale(): string {
    const scales = {
      small: '0.875',
      medium: '1',
      large: '1.125',
      'extra-large': '1.25',
    };
    return scales[this.preferences.fontSize];
  }

  /**
   * Update accessibility CSS styles
   */
  private updateAccessibilityStyles(): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'accessibility-styles';

    const css = `
      /* Font scaling */
      .a11y-font-scale {
        font-size: calc(1rem * var(--a11y-font-scale, 1));
      }

      /* High contrast mode */
      body.a11y-high-contrast {
        filter: contrast(150%);
      }

      body.a11y-high-contrast * {
        border-color: currentColor !important;
        outline-color: currentColor !important;
      }

      body.a11y-high-contrast .bg-gray-50 { background-color: #ffffff !important; }
      body.a11y-high-contrast .bg-gray-100 { background-color: #f0f0f0 !important; }
      body.a11y-high-contrast .text-gray-600 { color: #000000 !important; }
      body.a11y-high-contrast .text-gray-400 { color: #333333 !important; }

      /* Reduced motion */
      body.a11y-reduced-motion *,
      body.a11y-reduced-motion *::before,
      body.a11y-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* Enhanced focus rings */
      body.a11y-enhanced-focus *:focus {
        outline: 3px solid var(--a11y-focus-ring-color, #007AFF) !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
        box-shadow: 0 0 0 6px rgba(0, 122, 255, 0.2) !important;
      }

      /* Large touch targets */
      body.a11y-large-touch-targets button,
      body.a11y-large-touch-targets [role="button"],
      body.a11y-large-touch-targets input,
      body.a11y-large-touch-targets select,
      body.a11y-large-touch-targets textarea {
        min-height: 44px !important;
        min-width: 44px !important;
        padding: 12px 16px !important;
      }

      /* Screen reader optimizations */
      body.a11y-screen-reader .sr-only {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: normal !important;
      }

      /* Color blind friendly adjustments */
      body.a11y-color-blind-friendly {
        --color-red: #d73027;
        --color-green: #1a9641;
        --color-blue: #313695;
        --color-orange: #fdae61;
        --color-purple: #762a83;
      }

      /* Skip links visibility */
      body.a11y-skip-links-visible .skip-link {
        position: static !important;
        transform: none !important;
        opacity: 1 !important;
        background: var(--a11y-focus-ring-color, #007AFF) !important;
        color: white !important;
        padding: 8px 16px !important;
        margin: 4px !important;
        display: inline-block !important;
        border-radius: 4px !important;
        text-decoration: none !important;
        font-weight: bold !important;
      }

      /* Disable autoplay */
      body.a11y-no-autoplay video,
      body.a11y-no-autoplay audio {
        autoplay: none !important;
      }

      /* Disable blinking/flashing */
      body.a11y-no-blinking *,
      body.a11y-no-blinking *::before,
      body.a11y-no-blinking *::after {
        animation-name: none !important;
        -webkit-animation-name: none !important;
      }

      body.a11y-no-blinking .blink,
      body.a11y-no-blinking .flash,
      body.a11y-no-blinking .pulse {
        animation: none !important;
      }

      /* Improved text contrast */
      body.a11y-high-contrast .text-sm { font-size: 0.95rem !important; }
      body.a11y-high-contrast .text-xs { font-size: 0.85rem !important; }

      /* Focus within improvements */
      body.a11y-enhanced-focus .focus-within\:ring {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }

      /* Print accessibility */
      @media print {
        body.a11y-screen-reader .no-print { display: none !important; }
        body.a11y-high-contrast { filter: none !important; }
      }

      /* Responsive accessibility */
      @media (max-width: 768px) {
        body.a11y-large-touch-targets button,
        body.a11y-large-touch-targets [role="button"] {
          min-height: 48px !important;
          min-width: 48px !important;
        }
      }
    `;

    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);
  }

  /**
   * Configure speech synthesis settings
   */
  private configureSpeechSynthesis(): void {
    if (
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    ) {
      try {
        // Set default speech rate
        const utterance = new SpeechSynthesisUtterance('');
        utterance.rate = this.preferences.speechRate;
      } catch (error) {
        console.warn('Speech synthesis configuration failed:', error);
      }
    }
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };

    // Track user overrides
    const overrides = JSON.parse(
      localStorage.getItem('accessibility-overrides') || '{}'
    );
    Object.keys(updates).forEach(key => {
      overrides[key] = true;
    });
    localStorage.setItem('accessibility-overrides', JSON.stringify(overrides));

    this.savePreferences();
    this.applyPreferences();
    this.notifyListeners();
  }

  /**
   * Get current preferences
   */
  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Get current state including system preferences
   */
  getState(): AccessibilityState {
    return {
      ...this.preferences,
      isSystemDarkMode: this.mediaQueries.get('dark-mode')?.matches ?? false,
      isSystemReducedMotion: this.mediaQueries.get('reduced-motion')?.matches ?? false,
      isSystemHighContrast: this.mediaQueries.get('high-contrast')?.matches ?? false,
      systemFontScale:
        parseFloat(getComputedStyle(document.documentElement).fontSize) / 16,
      screenReaderActive: this.preferences.screenReaderOptimized,
      touchDevice: 'ontouchstart' in window,
      hasHover: this.mediaQueries.get('hover')?.matches ?? true,
    };
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.preferences = { ...this.defaultPreferences };
    localStorage.removeItem('accessibility-preferences');
    localStorage.removeItem('accessibility-overrides');
    this.applyPreferences();
    this.notifyListeners();
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (prefs: AccessibilityPreferences
) => void): (
) => void {
    this.listeners.push(listener);
    return (
) => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error('Error in accessibility preference listener:', error);
      }
    });
  }

  /**
   * Test color contrast
   */
  testColorContrast(
    foreground: string,
    background: string
  ): { ratio: number; wcagAA: boolean; wcagAAA: boolean } {
    // Simplified contrast calculation (would use a proper contrast library in production)
    const ratio = 4.5; // Placeholder - implement proper contrast calculation
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
    };
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    this.mediaQueries.forEach(query => {
      query.removeEventListener('change', this.handleSystemChange);
    });
    this.mediaQueries.clear();

    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.listeners = [];
  }
}

export default AccessibilityPreferencesService;
