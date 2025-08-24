/// <reference lib="dom" />
/**
 * Theme Accessibility Service
 * Provides enhanced accessibility features for the theme system including
 * ARIA announcements, keyboard navigation, screen reader optimizations,
 * and WCAG compliance utilities
 */

import { PersonalizationSettings } from '../types';
import { TimeoutHandle } from '../types/timers';

interface ContrastRatio {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'fail';
  isAccessible: boolean;
}

interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
}

interface ColorBlindnessSimulation {
  protanopia: string;
  deuteranopia: string;
  tritanopia: string;
  achromatopsia: string;
}

class ThemeAccessibilityService {
  private static instance: ThemeAccessibilityService;
  private ariaLiveRegion: HTMLElement | null = null;
  private focusManager: FocusManager;
  private contrastCache = new Map<string, ContrastRatio>();
  private keyboardNavigation: KeyboardNavigationManager;

  static getInstance(): ThemeAccessibilityService {
    if (!this.instance) {
      this.instance = new ThemeAccessibilityService();
    }
    return this.instance;
  }

  private constructor() {
    this.initializeAriaLiveRegion();
    this.focusManager = new FocusManager();
    this.keyboardNavigation = new KeyboardNavigationManager();
    this.setupAccessibilityEventListeners();
  }

  /**
   * Initialize ARIA live region for theme announcements
   */
  private initializeAriaLiveRegion(): void {
    if (typeof document === 'undefined') return;

    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    this.ariaLiveRegion.setAttribute('aria-relevant', 'additions text');
    this.ariaLiveRegion.className = 'sr-only';
    this.ariaLiveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    document.body.appendChild(this.ariaLiveRegion);
  }

  /**
   * Announce theme changes to screen readers
   */
  announceThemeChange(
    themeName: string,
    options: {
      includePreviousTheme?: boolean;
      previousTheme?: string;
      priority?: 'polite' | 'assertive';
    } = {}
  ): void {
    const {
      includePreviousTheme = false,
      previousTheme,
      priority = 'polite',
    } = options;

    let message = `Theme changed to ${themeName}`;
    if (includePreviousTheme && previousTheme) {
      message = `Theme changed from ${previousTheme} to ${themeName}`;
    }

    this.announce({ message, priority });
  }

  /**
   * Announce accessibility setting changes
   */
  announceAccessibilityChange(setting: string, value: any, description?: string): void {
    const message = description || `${setting} ${value ? 'enabled' : 'disabled'}`;
    this.announce({ message, priority: 'polite' });
  }

  /**
   * Generic announcement method
   */
  private announce({
    message,
    priority,
    delay = 100,
  }: AccessibilityAnnouncement): void {
    if (!this.ariaLiveRegion) return;

    // Update aria-live attribute if needed
    if (this.ariaLiveRegion.getAttribute('aria-live') !== priority) {
      this.ariaLiveRegion.setAttribute('aria-live', priority);
    }

    // Clear and set new message with small delay for screen reader reliability
    setTimeout(() => {
      if (this.ariaLiveRegion) {
        this.ariaLiveRegion.textContent = '';
        setTimeout(() => {
          if (this.ariaLiveRegion) {
            this.ariaLiveRegion.textContent = message;
          }
        }, 10);
      }
    }, delay);
  }

  /**
   * Calculate WCAG contrast ratio between two colors
   */
  calculateContrastRatio(foreground: string, background: string): ContrastRatio {
    const cacheKey = `${foreground}-${background}`;
    const cached = this.contrastCache.get(cacheKey);
    if (cached) return cached;

    const ratio = this.getContrastRatio(foreground, background);
    let level: ContrastRatio['level'] = 'fail';
    let isAccessible = false;

    if (ratio >= 7) {
      level = 'AAA';
      isAccessible = true;
    } else if (ratio >= 4.5) {
      level = 'AA';
      isAccessible = true;
    } else if (ratio >= 3) {
      level = 'A';
      isAccessible = false; // A is not sufficient for most content
    }

    const result: ContrastRatio = { ratio, level, isAccessible };
    this.contrastCache.set(cacheKey, result);
    return result;
  }

  /**
   * Internal contrast ratio calculation
   */
  private getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : null;
  }

  /**
   * Simulate color blindness for color accessibility testing
   */
  simulateColorBlindness(color: string): ColorBlindnessSimulation {
    const rgb = this.hexToRgb(color);
    if (!rgb)
      return {
        protanopia: color,
        deuteranopia: color,
        tritanopia: color,
        achromatopsia: color,
      };

    const [r, g, b] = rgb;

    // Simplified color blindness simulation matrices
    const protanopia = this.rgbToHex([
      0.567 * r + 0.433 * g + 0 * b,
      0.558 * r + 0.442 * g + 0 * b,
      0 * r + 0.242 * g + 0.758 * b,
    ]);

    const deuteranopia = this.rgbToHex([
      0.625 * r + 0.375 * g + 0 * b,
      0.7 * r + 0.3 * g + 0 * b,
      0 * r + 0.3 * g + 0.7 * b,
    ]);

    const tritanopia = this.rgbToHex([
      0.95 * r + 0.05 * g + 0 * b,
      0 * r + 0.433 * g + 0.567 * b,
      0 * r + 0.475 * g + 0.525 * b,
    ]);

    // Achromatopsia (grayscale)
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const achromatopsia = this.rgbToHex([gray, gray, gray]);

    return { protanopia, deuteranopia, tritanopia, achromatopsia };
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(rgb: number[]): string {
    return (
      '#' +
      rgb
        .map(c => {
          const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  /**
   * Apply accessibility enhancements based on personalization settings
   */
  applyAccessibilityEnhancements(settings: PersonalizationSettings): void {
    const root = document.documentElement;
    const body = document.body;

    // High contrast mode
    if (settings.accessibilityPreferences.highContrastMode) {
      body.classList.add('high-contrast');
      this.announceAccessibilityChange('High contrast mode', true);
    } else {
      body.classList.remove('high-contrast');
    }

    // Reduced motion
    if (
      settings.motionPreferences.reduceMotion ||
      settings.accessibilityPreferences.flashingElementsReduced
    ) {
      body.classList.add('reduce-motion');
      this.announceAccessibilityChange('Reduced motion', true);
    } else {
      body.classList.remove('reduce-motion');
    }

    // Screen reader optimizations
    if (settings.accessibilityPreferences.screenReaderOptimized) {
      body.classList.add('screen-reader-optimized');
      this.enableScreenReaderOptimizations();
    } else {
      body.classList.remove('screen-reader-optimized');
      this.disableScreenReaderOptimizations();
    }

    // Large targets for easier interaction
    if (settings.accessibilityPreferences.largeTargets) {
      root.style.setProperty('--min-touch-target-size', '48px');
      body.classList.add('large-targets');
    } else {
      root.style.setProperty('--min-touch-target-size', '40px');
      body.classList.remove('large-targets');
    }

    // Bold text
    if (settings.accessibilityPreferences.boldText) {
      root.style.setProperty('--font-weight-base', '600');
      body.classList.add('bold-text');
    } else {
      root.style.setProperty('--font-weight-base', '400');
      body.classList.remove('bold-text');
    }

    // Underline links
    if (settings.accessibilityPreferences.underlineLinks) {
      body.classList.add('underline-links');
    } else {
      body.classList.remove('underline-links');
    }

    // Focus indicator style
    root.style.setProperty(
      '--focus-indicator-style',
      settings.accessibilityPreferences.focusIndicatorStyle
    );

    // Dyslexia-friendly fonts
    if (settings.typographyPreferences.dyslexiaFriendly) {
      body.classList.add('dyslexia-friendly');
      this.announceAccessibilityChange('Dyslexia-friendly fonts', true);
    } else {
      body.classList.remove('dyslexia-friendly');
    }
  }

  /**
   * Enable screen reader specific optimizations
   */
  private enableScreenReaderOptimizations(): void {
    // Add skip links
    this.addSkipLinks();

    // Enhance landmark navigation
    this.enhanceLandmarks();

    // Add descriptive text for complex UI elements
    this.addDescriptiveText();
  }

  /**
   * Disable screen reader optimizations
   */
  private disableScreenReaderOptimizations(): void {
    // Remove skip links and other screen reader specific elements
    const skipLinks = document.querySelector('#skip-links');
    if (skipLinks) {
      skipLinks.remove();
    }
  }

  /**
   * Add skip links for keyboard navigation
   */
  private addSkipLinks(): void {
    if (document.querySelector('#skip-links')) return;

    const skipLinks = document.createElement('div');
    skipLinks.id = 'skip-links';
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 9999;
      }
      .skip-link {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
      }
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
      }
    `;
    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Enhance landmarks for better navigation
   */
  private enhanceLandmarks(): void {
    // Add missing ARIA landmarks
    const main = document.querySelector('main');
    if (main && !main.getAttribute('aria-label')) {
      main.setAttribute('aria-label', 'Main content');
    }

    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('aria-label')) {
      nav.setAttribute('aria-label', 'Main navigation');
    }
  }

  /**
   * Add descriptive text for complex UI elements
   */
  private addDescriptiveText(): void {
    // Add aria-descriptions for theme controls
    const themeButtons = document.querySelectorAll('[data-theme-toggle]');
    themeButtons.forEach((button, index) => {
      if (!button.getAttribute('aria-describedby')) {
        const descId = `theme-desc-${index}`;
        const desc = document.createElement('span');
        desc.id = descId;
        desc.className = 'sr-only';
        desc.textContent = 'Changes the visual theme of the application';
        button.setAttribute('aria-describedby', descId);
        button.appendChild(desc);
      }
    });
  }

  /**
   * Setup accessibility-related event listeners
   */
  private setupAccessibilityEventListeners(): void {
    // Listen for system preference changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );
      prefersReducedMotion.addEventListener('change', e => {
        if (e.matches) {
          document.body.classList.add('reduce-motion');
          this.announce({
            message: 'Reduced motion enabled based on system preferences',
            priority: 'polite',
          });
        }
      });

      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      prefersHighContrast.addEventListener('change', e => {
        if (e.matches) {
          document.body.classList.add('high-contrast');
          this.announce({
            message: 'High contrast mode enabled based on system preferences',
            priority: 'polite',
          });
        }
      });
    }
  }

  /**
   * Test current theme for accessibility compliance
   */
  testThemeAccessibility(themeColors: Record<string, string>): {
    overallScore: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passedTests = 0;
    const totalTests = 4;

    // Test text contrast
    const textContrast = this.calculateContrastRatio(
      themeColors['--theme-text-primary'] || '#000000',
      themeColors['--theme-background'] || '#ffffff'
    );

    if (!textContrast.isAccessible) {
      issues.push(
        `Text contrast ratio is ${textContrast.ratio.toFixed(2)}, which fails WCAG AA standards (minimum 4.5)`
      );
      recommendations.push('Increase contrast between text and background colors');
    } else {
      passedTests++;
    }

    // Test link contrast
    const linkContrast = this.calculateContrastRatio(
      themeColors['--theme-primary'] || '#0000ff',
      themeColors['--theme-background'] || '#ffffff'
    );

    if (!linkContrast.isAccessible) {
      issues.push(
        `Link contrast ratio is ${linkContrast.ratio.toFixed(2)}, which may be difficult for some users to see`
      );
      recommendations.push(
        'Ensure links have sufficient contrast or use underlines for identification'
      );
    } else {
      passedTests++;
    }

    // Test color blindness accessibility
    const primaryColor = themeColors['--theme-primary'] || '#0000ff';
    const colorBlindSimulation = this.simulateColorBlindness(primaryColor);

    if (
      primaryColor === colorBlindSimulation.protanopia ||
      primaryColor === colorBlindSimulation.deuteranopia
    ) {
      issues.push(
        'Primary color may not be distinguishable for users with color blindness'
      );
      recommendations.push(
        'Use patterns, textures, or shapes in addition to color to convey information'
      );
    } else {
      passedTests++;
    }

    // Test focus visibility
    const focusColor =
      themeColors['--theme-focus'] || themeColors['--theme-primary'] || '#0000ff';
    const focusContrast = this.calculateContrastRatio(
      focusColor,
      themeColors['--theme-background'] || '#ffffff'
    );

    if (!focusContrast.isAccessible) {
      issues.push('Focus indicators may not be visible enough');
      recommendations.push(
        'Ensure focus indicators have at least 3:1 contrast ratio with background'
      );
    } else {
      passedTests++;
    }

    const overallScore = (passedTests / totalTests) * 100;

    return {
      overallScore: Math.round(overallScore),
      issues,
      recommendations,
    };
  }

  /**
   * Get accessibility status summary
   */
  getAccessibilityStatus(): {
    hasHighContrast: boolean;
    hasReducedMotion: boolean;
    hasScreenReaderOptimizations: boolean;
    hasSkipLinks: boolean;
    focusVisible: boolean;
  } {
    const body = document.body;
    return {
      hasHighContrast: body.classList.contains('high-contrast'),
      hasReducedMotion: body.classList.contains('reduce-motion'),
      hasScreenReaderOptimizations: body.classList.contains('screen-reader-optimized'),
      hasSkipLinks: !!document.querySelector('#skip-links'),
      focusVisible: !body.classList.contains('focus-visible-disabled'),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.remove();
    }
    this.contrastCache.clear();
    this.focusManager.destroy();
    this.keyboardNavigation.destroy();
  }
}

/**
 * Focus Management Helper
 */
class FocusManager {
  private focusedElement: Element | null = null;
  private focusTrap: HTMLElement | null = null;

  constructor() {
    this.setupFocusListeners();
  }

  private setupFocusListeners(): void {
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleFocusIn(event: FocusEvent): void {
    this.focusedElement = event.target as Element;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Tab trapping logic would go here
    if (event.key === 'Tab' && this.focusTrap) {
      // Implement focus trap logic
    }
  }

  setFocusTrap(element: HTMLElement): void {
    this.focusTrap = element;
  }

  removeFocusTrap(): void {
    this.focusTrap = null;
  }

  destroy(): void {
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

/**
 * Keyboard Navigation Helper
 */
class KeyboardNavigationManager {
  private shortcuts: Map<string, () => void> = new Map();

  constructor() {
    this.setupKeyboardListeners();
    this.registerDefaultShortcuts();
  }

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.getShortcutKey(event);
    const handler = this.shortcuts.get(key);

    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  private getShortcutKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  private registerDefaultShortcuts(): void {
    // Alt + T for theme toggle
    this.shortcuts.set('alt+t', () => {
      const themeToggle = document.querySelector('[data-theme-toggle]') as HTMLElement;
      if (themeToggle) {
        themeToggle.click();
      }
    });

    // Alt + M for main content
    this.shortcuts.set('alt+m', () => {
      const mainContent = document.querySelector('#main-content, main') as HTMLElement;
      if (mainContent) {
        mainContent.focus();
      }
    });
  }

  registerShortcut(key: string, handler: () => void): void {
    this.shortcuts.set(key, handler);
  }

  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.shortcuts.clear();
  }
}

export default ThemeAccessibilityService;
