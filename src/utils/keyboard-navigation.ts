/// <reference lib="dom" />
// Enhanced Keyboard Navigation for Smart Alarm App
// Provides comprehensive keyboard shortcuts and navigation patterns
// Integrated with accessibility preferences system

import ScreenReaderService from './screen-reader';
import AccessibilityPreferencesService, {
  AccessibilityPreferences,
} from '../services/accessibility-preferences';

export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: (
) => void;
  description: string;
  category: 'navigation' | 'alarm' | 'accessibility' | 'general';
  enabled: boolean;
}

export interface NavigationState {
  currentSection: string;
  focusedElement?: HTMLElement;
  focusHistory: HTMLElement[];
  skipLinksEnabled: boolean;
  rolandEnabled: boolean; // Roving focus enabled
}

/**
 * Advanced Keyboard Navigation Manager
 * Now integrated with accessibility preferences
 */
export class KeyboardNavigationService {
  private static instance: KeyboardNavigationService;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private state: NavigationState;
  private screenReader: ScreenReaderService;
  private focusTrapStack: HTMLElement[] = [];
  private skipLinks: HTMLElement[] = [];
  private accessibilityService: AccessibilityPreferencesService;
  private preferencesUnsubscribe?: (
) => void;

  private constructor() {
    this.state = {
      currentSection: 'main',
      focusHistory: [],
      skipLinksEnabled: true,
      rolandEnabled: true,
    };

    this.screenReader = ScreenReaderService.getInstance();
    this.accessibilityService = AccessibilityPreferencesService.getInstance();

    this.initializeShortcuts();
    this.setupAccessibilityIntegration();
    this.createSkipLinks();
    this.setupEventListeners();
  }

  static getInstance(): KeyboardNavigationService {
    if (!KeyboardNavigationService.instance) {
      KeyboardNavigationService.instance = new KeyboardNavigationService();
    }
    return KeyboardNavigationService.instance;
  }

  /**
   * Initialize the keyboard navigation service (called from App.tsx)
   */
  public initialize(): void {
    // Service is already initialized in constructor
    // This method provides the expected interface for App.tsx
    console.log('KeyboardNavigationService initialized');
  }

  /**
   * Get the current enabled state
   */
  public get isEnabled(): boolean {
    return true; // Always enabled for keyboard navigation
  }

  /**
   * Initialize default keyboard shortcuts
   */
  private initializeShortcuts(): void {
    const shortcuts: Omit<KeyboardShortcut, 'enabled'>[] = [
      // Navigation shortcuts
      {
        key: 'd',
        modifiers: ['alt'],
        action: (
) => this.navigateToSection('dashboard'),
        description: 'Go to Dashboard',
        category: 'navigation',
      },
      {
        key: 'a',
        modifiers: ['alt'],
        action: (
) => this.navigateToSection('alarms'),
        description: 'Go to Alarms',
        category: 'navigation',
      },
      {
        key: 's',
        modifiers: ['alt'],
        action: (
) => this.navigateToSection('settings'),
        description: 'Go to Settings',
        category: 'navigation',
      },
      {
        key: 'p',
        modifiers: ['alt'],
        action: (
) => this.navigateToSection('performance'),
        description: 'Go to Performance',
        category: 'navigation',
      },

      // Alarm management shortcuts
      {
        key: 'n',
        modifiers: ['ctrl'],
        action: (
) => this.createNewAlarm(),
        description: 'Create New Alarm',
        category: 'alarm',
      },
      {
        key: ' ',
        modifiers: [],
        action: (
) => this.toggleSelectedAlarm(),
        description: 'Toggle Selected Alarm',
        category: 'alarm',
      },
      {
        key: 'Delete',
        modifiers: [],
        action: (
) => this.deleteSelectedAlarm(),
        description: 'Delete Selected Alarm',
        category: 'alarm',
      },
      {
        key: 'Enter',
        modifiers: [],
        action: (
) => this.editSelectedAlarm(),
        description: 'Edit Selected Alarm',
        category: 'alarm',
      },

      // Accessibility shortcuts
      {
        key: 'h',
        modifiers: ['alt'],
        action: (
) => this.showKeyboardShortcuts(),
        description: 'Show Keyboard Shortcuts',
        category: 'accessibility',
      },
      {
        key: 'r',
        modifiers: ['alt'],
        action: (
) => this.toggleScreenReaderMode(),
        description: 'Toggle Screen Reader Enhanced Mode',
        category: 'accessibility',
      },
      {
        key: 'f',
        modifiers: ['alt'],
        action: (
) => this.focusFirstElement(),
        description: 'Focus First Interactive Element',
        category: 'accessibility',
      },
      {
        key: 'l',
        modifiers: ['alt'],
        action: (
) => this.focusLastElement(),
        description: 'Focus Last Interactive Element',
        category: 'accessibility',
      },

      // General shortcuts
      {
        key: 'Escape',
        modifiers: [],
        action: (
) => this.handleEscape(),
        description: 'Close Dialog/Go Back',
        category: 'general',
      },
      {
        key: 'F1',
        modifiers: [],
        action: (
) => this.showHelp(),
        description: 'Show Help',
        category: 'general',
      },
    ];

    shortcuts.forEach((shortcut, index
) => {
      this.addShortcut(`shortcut-${index}`, {
        ...shortcut,
        enabled: true,
      });
    });
  }

  /**
   * Add a new keyboard shortcut
   */
  addShortcut(id: string, shortcut: KeyboardShortcut): void {
    const key = this.createShortcutKey(shortcut.key, shortcut.modifiers);
    this.shortcuts.set(key, { ...shortcut });
  }

  /**
   * Remove a keyboard shortcut
   */
  removeShortcut(key: string, modifiers: string[]): void {
    const shortcutKey = this.createShortcutKey(key, modifiers);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Create shortcut key string
   */
  private createShortcutKey(key: string, modifiers: string[]): string {
    const sortedModifiers = [...modifiers].sort();
    return `${sortedModifiers.join('+')}-${key.toLowerCase()}`;
  }

  /**
   * Setup global keyboard event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Handle roving focus for arrow keys
    document.addEventListener('keydown', this.handleRovingFocus.bind(this));
  }

  /**
   * Setup accessibility preferences integration
   */
  private setupAccessibilityIntegration(): void {
    // Subscribe to accessibility preference changes
    this.preferencesUnsubscribe = this.accessibilityService.subscribe(preferences => {
      this.updateFromPreferences(preferences);
    });

    // Apply initial preferences
    this.updateFromPreferences(this.accessibilityService.getPreferences());
  }

  /**
   * Update keyboard navigation based on accessibility preferences
   */
  private updateFromPreferences(preferences: AccessibilityPreferences): void {
    // Update keyboard navigation state
    this.state.skipLinksEnabled = preferences.skipLinksVisible;
    this.state.rolandEnabled = preferences.keyboardNavigation;

    // Enable/disable all shortcuts based on keyboard navigation preference
    this.shortcuts.forEach(shortcut => {
      if (shortcut.category !== 'general') {
        shortcut.enabled = preferences.keyboardNavigation;
      }
    });

    // Update skip links visibility
    this.updateSkipLinksVisibility(preferences.skipLinksVisible);

    // Update focus ring styles
    this.updateFocusRingStyles(preferences);
  }

  /**
   * Update skip links visibility
   */
  private updateSkipLinksVisibility(visible: boolean): void {
    const skipContainer = document.getElementById('skip-links');
    if (skipContainer) {
      if (visible) {
        skipContainer.style.display = 'block';
        // Make skip links always visible
        this.skipLinks.forEach(link => {
          link.classList.remove('-top-96');
          link.classList.add('top-2');
        });
      } else {
        // Hide skip links until focused
        this.skipLinks.forEach(link => {
          link.classList.add('-top-96');
          link.classList.remove('top-2');
          link.classList.add('focus:top-2');
        });
      }
    }
  }

  /**
   * Update focus ring styles based on preferences
   */
  private updateFocusRingStyles(preferences: AccessibilityPreferences): void {
    // Update CSS custom properties for focus styling
    document.documentElement.style.setProperty(
      '--a11y-focus-ring-color',
      preferences.focusRingColor
    );

    // Update enhanced focus ring state
    document.body.classList.toggle(
      'a11y-enhanced-focus',
      preferences.enhancedFocusRings
    );
  }

  /**
   * Handle global keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Check if keyboard navigation is enabled
    const preferences = this.accessibilityService.getPreferences();
    if (!preferences.keyboardNavigation && !this.isGlobalShortcut(event)) {
      return;
    }

    // Skip if typing in input fields (unless it's a global shortcut)
    if (
      this.isTypingInInput(event.target as HTMLElement) &&
      !this.isGlobalShortcut(event)
    ) {
      return;
    }

    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    const shortcutKey = this.createShortcutKey(event.key, modifiers);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut && shortcut.enabled) {
      event.preventDefault();
      shortcut.action();

      // Announce only if screen reader optimization is enabled
      if (preferences.screenReaderOptimized && preferences.announceSuccess) {
        this.screenReader.announce(`Executed: ${shortcut.description}`);
      }
    }
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    if (element && this.isFocusableElement(element)) {
      this.state.focusedElement = element;
      this.state.focusHistory.push(element);

      // Limit focus history to last 10 elements
      if (this.state.focusHistory.length > 10) {
        this.state.focusHistory.shift();
      }

      // Announce focus change for screen readers
      this.announceFocusChange(element);
    }
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    // Implementation for focus out handling
  }

  /**
   * Handle roving focus with arrow keys
   */
  private handleRovingFocus(event: KeyboardEvent): void {
    const preferences = this.accessibilityService.getPreferences();

    // Check if keyboard navigation and roving focus are enabled
    if (!preferences.keyboardNavigation || !this.state.rolandEnabled) return;

    const currentElement = document.activeElement as HTMLElement;
    if (!currentElement) return;

    const container = this.findRovingContainer(currentElement);
    if (!container) return;

    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex =
          (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = focusableElements.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      focusableElements[nextIndex].focus();

      // Announce focus change if screen reader is optimized
      if (preferences.screenReaderOptimized && preferences.announceTransitions) {
        const element = focusableElements[nextIndex];
        const label = this.getElementLabel(element);
        this.screenReader.announce(`Focused: ${label}`);
      }
    }
  }

  /**
   * Find the roving focus container for an element
   */
  private findRovingContainer(element: HTMLElement): HTMLElement | null {
    // Look for container with data-roving-focus attribute
    let current = element.parentElement;
    while (current) {
      if (
        current.hasAttribute('data-roving-focus') ||
        current.getAttribute('role') === 'toolbar' ||
        current.getAttribute('role') === 'menubar' ||
        current.getAttribute('role') === 'tablist'
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Get focusable elements within a container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = `
      button:not([disabled]),
      [href]:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      [role="button"]:not([disabled]),
      [role="tab"]:not([disabled])
    `;

    return Array.from(container.querySelectorAll(selector)).filter(el =>
      this.isVisible(el as HTMLElement)
    ) as HTMLElement[];
  }

  /**
   * Check if element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Check if currently typing in an input field
   */
  private isTypingInInput(element: HTMLElement): boolean {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type?.toLowerCase();

    return (
      (tagName === 'input' &&
        !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(type || '')) ||
      tagName === 'textarea' ||
      element.contentEditable === 'true'
    );
  }

  /**
   * Check if shortcut should work globally (even in input fields)
   */
  private isGlobalShortcut(event: KeyboardEvent): boolean {
    const globalKeys = ['F1', 'Escape'];
    const globalWithModifiers = ['alt+h', 'alt+r', 'alt+d', 'alt+a', 'alt+s', 'alt+p'];

    if (globalKeys.includes(event.key)) return true;

    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    const shortcutString = `${modifiers.join('+')}${modifiers.length ? '+' : ''}${event.key.toLowerCase()}`;
    return globalWithModifiers.includes(shortcutString);
  }

  /**
   * Check if element is focusable
   */
  private isFocusableElement(element: HTMLElement): boolean {
    const focusableElements = ['button', 'input', 'select', 'textarea', 'a'];

    if (focusableElements.includes(element.tagName.toLowerCase())) {
      return true;
    }

    return (
      element.tabIndex >= 0 ||
      element.getAttribute('role') === 'button' ||
      element.getAttribute('role') === 'tab'
    );
  }

  /**
   * Announce focus change to screen reader
   */
  private announceFocusChange(element: HTMLElement): void {
    const preferences = this.accessibilityService.getPreferences();

    // Only announce if screen reader optimization is enabled
    if (!preferences.screenReaderOptimized || !preferences.announceTransitions) {
      return;
    }

    const elementType = this.getElementType(element);
    const label = this.getElementLabel(element);
    const context = this.getElementContext(element);

    this.screenReader.announceFocusChange(elementType, label, context);
  }

  /**
   * Get element type for screen reader announcement
   */
  private getElementType(element: HTMLElement): string {
    const role = element.getAttribute('role');
    if (role) return role;

    const tagName = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type?.toLowerCase();

    if (tagName === 'input') {
      return type || 'input';
    }

    return tagName;
  }

  /**
   * Get element label for screen reader announcement
   */
  private getElementLabel(element: HTMLElement): string {
    // Try aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Try associated label element
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }

    // Use text content or placeholder
    return (
      element.textContent ||
      (element as HTMLInputElement).placeholder ||
      element.getAttribute('title') ||
      'Unlabeled element'
    );
  }

  /**
   * Get additional context for element
   */
  private getElementContext(element: HTMLElement): string | undefined {
    const description = element.getAttribute('aria-describedby');
    if (description) {
      const descElement = document.getElementById(description);
      if (descElement) return descElement.textContent || undefined;
    }

    // Additional context based on element state
    const contexts: string[] = [];

    if (element.getAttribute('aria-expanded')) {
      const expanded = element.getAttribute('aria-expanded') === 'true';
      contexts.push(expanded ? 'Expanded' : 'Collapsed');
    }

    if (element.getAttribute('aria-selected')) {
      const selected = element.getAttribute('aria-selected') === 'true';
      if (selected) contexts.push('Selected');
    }

    if (element.getAttribute('aria-checked')) {
      const checked = element.getAttribute('aria-checked');
      if (checked === 'true') contexts.push('Checked');
      else if (checked === 'false') contexts.push('Unchecked');
      else if (checked === 'mixed') contexts.push('Partially checked');
    }

    return contexts.length > 0 ? contexts.join(', ') : undefined;
  }

  /**
   * Create skip navigation links
   */
  private createSkipLinks(): void {
    const preferences = this.accessibilityService.getPreferences();
    if (!preferences.keyboardNavigation) return;

    const skipContainer = document.createElement('div');
    skipContainer.id = 'skip-links';
    skipContainer.className = 'skip-links fixed top-0 left-0 z-50';

    const skipLinks = [
      { text: 'Skip to main content', target: '#main-content' },
      { text: 'Skip to navigation', target: '#main-navigation' },
      { text: 'Skip to alarm list', target: '#alarm-list' },
      { text: 'Skip to settings', target: '#settings-panel' },
    ];

    skipLinks.forEach(({ text, target }
) => {
      const link = document.createElement('a');
      link.href = target;
      link.textContent = text;

      // Apply initial visibility based on preferences
      const baseClasses =
        'skip-link absolute left-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200';
      const focusRingColor = preferences.focusRingColor || '#007AFF';
      const visibilityClasses = preferences.skipLinksVisible
        ? 'top-2 z-50'
        : '-top-96 focus:top-2 focus:z-50';

      link.className = `${baseClasses} ${visibilityClasses}`;
      link.style.backgroundColor = focusRingColor;
      link.style.color = 'white';

      link.addEventListener('click', e => {
        e.preventDefault();
        const targetElement = document.querySelector(target) as HTMLElement;
        if (targetElement) {
          targetElement.focus();

          // Use reduced motion settings for scroll behavior
          const scrollBehavior = preferences.reducedMotion ? 'auto' : 'smooth';
          targetElement.scrollIntoView({
            behavior: scrollBehavior as ScrollBehavior,
            block: 'start',
          });

          // Announce skip action if enabled
          if (preferences.screenReaderOptimized && preferences.announceTransitions) {
            this.screenReader.announce(`Skipped to ${text.toLowerCase()}`);
          }
        }
      });

      skipContainer.appendChild(link);
      this.skipLinks.push(link);
    });

    document.body.insertBefore(skipContainer, document.body.firstChild);
  }

  /**
   * Navigation shortcut handlers
   */
  private navigateToSection(section: string): void {
    // Dispatch custom navigation event
    const event = new CustomEvent('keyboard-navigate', {
      detail: { section, source: 'keyboard' },
    });
    document.dispatchEvent(event);

    this.state.currentSection = section;

    // Announce navigation if enabled
    const preferences = this.accessibilityService.getPreferences();
    if (preferences.screenReaderOptimized && preferences.announceTransitions) {
      this.screenReader.announceNavigation(section, `Navigated via keyboard shortcut`);
    }
  }

  private createNewAlarm(): void {
    const event = new CustomEvent('alarm-action', {
      detail: { action: 'create', source: 'keyboard' },
    });
    document.dispatchEvent(event);
  }

  private toggleSelectedAlarm(): void {
    const selectedAlarm = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    if (selectedAlarm) {
      const event = new CustomEvent('alarm-action', {
        detail: { action: 'toggle', target: selectedAlarm, source: 'keyboard' },
      });
      document.dispatchEvent(event);
    }
  }

  private deleteSelectedAlarm(): void {
    const selectedAlarm = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    if (selectedAlarm) {
      const event = new CustomEvent('alarm-action', {
        detail: { action: 'delete', target: selectedAlarm, source: 'keyboard' },
      });
      document.dispatchEvent(event);
    }
  }

  private editSelectedAlarm(): void {
    const selectedAlarm = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    if (selectedAlarm) {
      const event = new CustomEvent('alarm-action', {
        detail: { action: 'edit', target: selectedAlarm, source: 'keyboard' },
      });
      document.dispatchEvent(event);
    }
  }

  private handleEscape(): void {
    // Close any open modals or dialogs
    const modals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
    if (modals.length > 0) {
      const modal = modals[modals.length - 1] as HTMLElement;
      const closeButton = modal.querySelector('[data-dismiss]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
      return;
    }

    // Return focus to previous element
    if (this.state.focusHistory.length > 1) {
      const previousElement =
        this.state.focusHistory[this.state.focusHistory.length - 2];
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
      }
    }
  }

  private showKeyboardShortcuts(): void {
    const preferences = this.accessibilityService.getPreferences();
    const shortcuts = Array.from(this.shortcuts.values())
      .filter(s => s.enabled)
      .sort((a, b
) => a.category.localeCompare(b.category));

    // Announce shortcuts if screen reader is enabled
    if (preferences.screenReaderOptimized) {
      const shortcutText = shortcuts
        .map(
          s =>
            `${s.description}: ${s.modifiers.join('+')}${s.modifiers.length ? '+' : ''}${s.key}`
        )
        .join(', ');

      this.screenReader.announce(
        `Available keyboard shortcuts: ${shortcutText}`,
        'polite'
      );
    }

    // Also dispatch event to show visual shortcut help
    const event = new CustomEvent('show-shortcuts', {
      detail: { shortcuts },
    });
    document.dispatchEvent(event);
  }

  private toggleScreenReaderMode(): void {
    const currentState = this.screenReader.getState();
    this.screenReader.updateSettings({
      isEnabled: !currentState.isEnabled,
    });
  }

  private focusFirstElement(): void {
    const firstFocusable = this.getFocusableElements(document.body)[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  private focusLastElement(): void {
    const focusableElements = this.getFocusableElements(document.body);
    const lastFocusable = focusableElements[focusableElements.length - 1];
    if (lastFocusable) {
      lastFocusable.focus();
    }
  }

  private showHelp(): void {
    const event = new CustomEvent('show-help');
    document.dispatchEvent(event);
    this.screenReader.announce('Help opened', 'polite');
  }

  /**
   * Get current navigation state
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Get all enabled shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(shortcut => shortcut.enabled);
  }

  /**
   * Enable or disable roving focus
   */
  setRovingFocus(enabled: boolean): void {
    this.state.rolandEnabled = enabled;
  }

  /**
   * Enable or disable skip links
   */
  setSkipLinks(enabled: boolean): void {
    this.state.skipLinksEnabled = enabled;
    if (enabled && this.skipLinks.length === 0) {
      this.createSkipLinks();
    } else if (!enabled) {
      this.skipLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      this.skipLinks = [];
    }
  }

  /**
   * Get accessibility preferences integration status
   */
  getAccessibilityStatus(): {
    keyboardNavigationEnabled: boolean;
    skipLinksVisible: boolean;
    enhancedFocusRings: boolean;
    focusRingColor: string;
    screenReaderOptimized: boolean;
  } {
    const preferences = this.accessibilityService.getPreferences();
    return {
      keyboardNavigationEnabled: preferences.keyboardNavigation,
      skipLinksVisible: preferences.skipLinksVisible,
      enhancedFocusRings: preferences.enhancedFocusRings,
      focusRingColor: preferences.focusRingColor,
      screenReaderOptimized: preferences.screenReaderOptimized,
    };
  }

  /**
   * Force refresh of accessibility integration
   */
  refreshAccessibilityIntegration(): void {
    const preferences = this.accessibilityService.getPreferences();
    this.updateFromPreferences(preferences);
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    document.removeEventListener('focusout', this.handleFocusOut.bind(this));

    // Unsubscribe from accessibility preferences
    if (this.preferencesUnsubscribe) {
      this.preferencesUnsubscribe();
    }

    // Remove skip links
    const skipContainer = document.getElementById('skip-links');
    if (skipContainer) {
      skipContainer.remove();
    }
  }
}

export default KeyboardNavigationService;
