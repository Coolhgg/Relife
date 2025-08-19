// Advanced Screen Reader Support for Smart Alarm App
// Provides comprehensive ARIA patterns and screen reader utilities

export interface ScreenReaderState {
  isEnabled: boolean;
  verbosityLevel: 'low' | 'medium' | 'high';
  speechRate: number;
  autoAnnounceChanges: boolean;
  preferredVoice?: string;
}

export interface AlarmAnnouncement {
  id: string;
  time: string;
  label: string;
  isActive: boolean;
  repeatDays: string[];
  voiceMood: string;
}

/**
 * Advanced Screen Reader Service for comprehensive accessibility
 */
export class ScreenReaderService {
  private static instance: ScreenReaderService;
  private state: ScreenReaderState;
  private announcementQueue: string[] = [];
  private isProcessingQueue = false;
  private liveRegion?: HTMLElement;
  private statusRegion?: HTMLElement;
  private navigationHistory: string[] = [];

  private constructor() {
    this.state = {
      isEnabled: this.detectScreenReader(),
      verbosityLevel: 'medium',
      speechRate: 1.0,
      autoAnnounceChanges: true,
      preferredVoice: undefined
    };

    this.initializeLiveRegions();
    this.loadUserPreferences();
  }

  static getInstance(): ScreenReaderService {
    if (!ScreenReaderService.instance) {
      ScreenReaderService.instance = new ScreenReaderService();
    }
    return ScreenReaderService.instance;
  }

  /**
   * Initialize the screen reader service (called from App.tsx)
   */
  public initialize(): void {
    // Service is already initialized in constructor
    // This method provides the expected interface for App.tsx
    console.log('ScreenReaderService initialized');
  }

  /**
   * Get the current enabled state
   */
  public get isEnabled(): boolean {
    return this.state.isEnabled;
  }

  /**
   * Detect if a screen reader is likely being used
   */
  private detectScreenReader(): boolean {
    // Check for screen reader specific APIs
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      // Check for NVDA, JAWS, or other screen readers
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('nvda') || userAgent.includes('jaws') || userAgent.includes('dragon')) {
        return true;
      }
    }

    // Check for accessibility features enabled
    const hasAccessibilityFeatures =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(prefers-contrast: high)').matches ||
      window.matchMedia('(forced-colors: active)').matches;

    return hasAccessibilityFeatures;
  }

  /**
   * Initialize ARIA live regions for announcements
   */
  private initializeLiveRegions(): void {
    // Remove existing regions if they exist
    const existingMain = document.getElementById('sr-main-live-region');
    const existingStatus = document.getElementById('sr-status-region');
    if (existingMain) existingMain.remove();
    if (existingStatus) existingStatus.remove();

    // Main live region for general announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'sr-main-live-region';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('aria-relevant', 'additions text');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';

    // Ensure the region is inserted after page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.liveRegion!);
      });
    } else {
      document.body.appendChild(this.liveRegion);
    }

    // Status region for important updates
    this.statusRegion = document.createElement('div');
    this.statusRegion.id = 'sr-status-region';
    this.statusRegion.setAttribute('aria-live', 'assertive');
    this.statusRegion.setAttribute('aria-atomic', 'true');
    this.statusRegion.setAttribute('aria-relevant', 'additions text');
    this.statusRegion.className = 'sr-only';
    this.statusRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';

    // Ensure the region is inserted after page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.statusRegion!);
      });
    } else {
      document.body.appendChild(this.statusRegion);
    }

    // Add CSS for screen reader only class if it doesn't exist
    this.addScreenReaderOnlyCSS();
  }

  /**
   * Load user accessibility preferences
   */
  private loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('screen-reader-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.state = { ...this.state, ...preferences };
      }
    } catch (error) {
      console.warn('Failed to load screen reader preferences:', error);
    }
  }

  /**
   * Save user accessibility preferences
   */
  private saveUserPreferences(): void {
    try {
      localStorage.setItem('screen-reader-preferences', JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save screen reader preferences:', error);
    }
  }

  /**
   * Update screen reader settings
   */
  updateSettings(settings: Partial<ScreenReaderState>): void {
    this.state = { ...this.state, ...settings };
    this.saveUserPreferences();

    if (settings.isEnabled !== undefined) {
      this.announce(
        settings.isEnabled
          ? 'Screen reader enhancements enabled'
          : 'Screen reader enhancements disabled'
      );
    }
  }

  /**
   * Get current screen reader state
   */
  getState(): ScreenReaderState {
    return { ...this.state };
  }

  /**
   * Queue announcement for screen readers
   */
  announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    options: {
      interrupt?: boolean;
      verbosity?: 'low' | 'medium' | 'high';
      delay?: number;
    } = {}
  ): void {
    if (!this.state.isEnabled || !message.trim()) return;

    const { interrupt = false, verbosity = this.state.verbosityLevel, delay = 0 } = options;

    // Check verbosity level
    if (verbosity === 'low' && this.state.verbosityLevel !== 'high') return;
    if (verbosity === 'medium' && this.state.verbosityLevel === 'low') return;

    const processAnnouncement = () => {
      if (interrupt) {
        this.clearQueue();
      }

      const region = priority === 'assertive' ? this.statusRegion : this.liveRegion;
      if (region && document.body.contains(region)) {
        // Use a more reliable method for screen reader announcements
        this.announceToLiveRegion(region, message);
      } else {
        // Reinitialize if regions are missing
        console.warn('Live regions not found, reinitializing...');
        this.initializeLiveRegions();
        // Retry announcement after reinitializing
        setTimeout(() => {
          const retryRegion = priority === 'assertive' ? this.statusRegion : this.liveRegion;
          if (retryRegion) {
            this.announceToLiveRegion(retryRegion, message);
          }
        }, 100);
      }
    };

    if (delay > 0) {
      setTimeout(processAnnouncement, delay);
    } else {
      processAnnouncement();
    }
  }

  /**
   * Announce alarm information in a structured way
   */
  announceAlarm(alarm: AlarmAnnouncement, action: 'created' | 'updated' | 'deleted' | 'toggled'): void {
    if (!this.state.isEnabled) return;

    const timeFormatted = this.formatTimeForSpeech(alarm.time);
    const daysText = this.formatDaysForSpeech(alarm.repeatDays);
    const statusText = alarm.isActive ? 'active' : 'inactive';

    let message = '';

    switch (action) {
      case 'created':
        message = `Alarm created for ${timeFormatted}. ${alarm.label}. ${daysText}. Voice mood: ${alarm.voiceMood}. Status: ${statusText}.`;
        break;
      case 'updated':
        message = `Alarm updated: ${timeFormatted}. ${alarm.label}. ${daysText}. Voice mood: ${alarm.voiceMood}. Status: ${statusText}.`;
        break;
      case 'deleted':
        message = `Alarm deleted: ${timeFormatted}. ${alarm.label}.`;
        break;
      case 'toggled':
        message = `Alarm ${alarm.isActive ? 'activated' : 'deactivated'}: ${timeFormatted}. ${alarm.label}.`;
        break;
    }

    this.announce(message, 'polite');
  }

  /**
   * Announce page navigation changes
   */
  announceNavigation(pageName: string, pageDescription?: string): void {
    if (!this.state.isEnabled) return;

    this.navigationHistory.push(pageName);

    let message = `Navigated to ${pageName}`;
    if (pageDescription) {
      message += `. ${pageDescription}`;
    }

    // Add navigation context for complex flows
    if (this.navigationHistory.length > 1) {
      const previousPage = this.navigationHistory[this.navigationHistory.length - 2];
      message += `. Previous page: ${previousPage}.`;
    }

    this.announce(message, 'polite');

    // Update document title for screen readers
    document.title = `${pageName} - Smart Alarm App`;
  }

  /**
   * Announce form validation errors
   */
  announceFormError(fieldName: string, errorMessage: string): void {
    if (!this.state.isEnabled) return;

    const message = `Error in ${fieldName}: ${errorMessage}`;
    this.announce(message, 'assertive');
  }

  /**
   * Announce successful actions
   */
  announceSuccess(message: string): void {
    if (!this.state.isEnabled) return;

    this.announce(`Success: ${message}`, 'polite');
  }

  /**
   * Announce loading states
   */
  announceLoading(action: string, isLoading: boolean): void {
    if (!this.state.isEnabled) return;

    const message = isLoading ? `Loading ${action}...` : `${action} completed`;
    this.announce(message, 'polite');
  }

  /**
   * Announce alarm ringing with contextual information
   */
  announceAlarmRinging(alarm: AlarmAnnouncement): void {
    if (!this.state.isEnabled) return;

    const timeFormatted = this.formatTimeForSpeech(alarm.time);
    const message = `Alarm ringing! ${timeFormatted}. ${alarm.label}. Voice mood: ${alarm.voiceMood}. Say "stop" to dismiss or "snooze" to snooze for 10 minutes.`;

    this.announce(message, 'assertive', { interrupt: true });
  }

  /**
   * Announce state changes with automatic detection
   */
  announceStateChange(componentName: string, previousState: ComponentState, newState: ComponentState, customMessage?: string): void {
    if (!this.state.isEnabled || !this.state.autoAnnounceChanges) return;

    let message = customMessage;
    if (!message) {
      if (typeof newState === 'boolean') {
        message = `${componentName} ${newState ? 'enabled' : 'disabled'}`;
      } else if (typeof newState === 'string') {
        message = `${componentName} changed to ${newState}`;
      } else if (typeof newState === 'number') {
        message = `${componentName} set to ${newState}`;
      } else {
        message = `${componentName} updated`;
      }
    }

    this.announce(message, 'polite');
  }

  /**
   * Announce collection changes (add/remove/update items)
   */
  announceCollectionChange(collectionName: string, action: 'added' | 'removed' | 'updated', itemCount: number, itemDescription?: string): void {
    if (!this.state.isEnabled) return;

    const item = itemDescription || 'item';
    let message = '';

    switch (action) {
      case 'added':
        message = itemCount === 1
          ? `${item} added to ${collectionName}`
          : `${itemCount} ${item}s added to ${collectionName}`;
        break;
      case 'removed':
        message = itemCount === 1
          ? `${item} removed from ${collectionName}`
          : `${itemCount} ${item}s removed from ${collectionName}`;
        break;
      case 'updated':
        message = itemCount === 1
          ? `${item} updated in ${collectionName}`
          : `${itemCount} ${item}s updated in ${collectionName}`;
        break;
    }

    this.announce(message, 'polite');
  }

  /**
   * Provide keyboard shortcuts announcement
   */
  announceKeyboardShortcuts(): void {
    if (!this.state.isEnabled) return;

    const shortcuts = [
      'Alt plus D for Dashboard',
      'Alt plus A for Alarms',
      'Alt plus S for Settings',
      'Alt plus P for Performance',
      'Space to toggle alarms',
      'Enter to edit selected alarm',
      'Delete to remove selected alarm',
      'Escape to close dialogs'
    ];

    const message = `Keyboard shortcuts available: ${shortcuts.join(', ')}.`;
    this.announce(message, 'polite');
  }

  /**
   * Announce element focus changes with context
   */
  announceFocusChange(elementType: string, elementLabel: string, additionalContext?: string): void {
    if (!this.state.isEnabled || this.state.verbosityLevel === 'low') return;

    let message = `${elementType}: ${elementLabel}`;
    if (additionalContext) {
      message += `. ${additionalContext}`;
    }

    // Announce for medium and high verbosity (already filtered out 'low' above)
    this.announce(message, 'polite', { delay: 100 });
  }

  /**
   * Format time for natural speech
   */
  private formatTimeForSpeech(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    if (minutes === 0) {
      return `${displayHours} ${period}`;
    } else {
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }

  /**
   * Format repeat days for natural speech
   */
  private formatDaysForSpeech(days: string[]): string {
    if (days.length === 0) return 'One time only';
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) {
      return 'Weekdays only';
    }
    if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) {
      return 'Weekends only';
    }

    return `Repeats on ${days.join(', ')}`;
  }

  /**
   * Announce to live region with fallback methods
   */
  private announceToLiveRegion(region: HTMLElement, message: string): void {
    // Method 1: Clear and set text content
    region.textContent = '';

    // Use RAF to ensure the clear is processed before setting new content
    requestAnimationFrame(() => {
      region.textContent = message;

      // Method 2: Retry textContent as a fallback
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
          region.textContent = message;
        }
      }, 50);

      // Method 3: Force a reflow by temporarily changing aria-live
      setTimeout(() => {
        const currentLive = region.getAttribute('aria-live');
        region.setAttribute('aria-live', 'off');
        requestAnimationFrame(() => {
          region.setAttribute('aria-live', currentLive || 'polite');
        });
      }, 100);

      // Clear after 3 seconds to prevent accumulation
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, 3000);
    });
  }

  /**
   * Add CSS for screen reader only class
   */
  private addScreenReaderOnlyCSS(): void {
    const styleId = 'sr-only-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .sr-only {
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
   * Clear announcement queue
   */
  private clearQueue(): void {
    this.announcementQueue = [];
    if (this.liveRegion) this.liveRegion.textContent = '';
    if (this.statusRegion) this.statusRegion.textContent = '';
  }

  /**
   * Cleanup method for component unmounting
   */
  cleanup(): void {
    if (this.liveRegion && document.body.contains(this.liveRegion)) {
      document.body.removeChild(this.liveRegion);
    }
    if (this.statusRegion && document.body.contains(this.statusRegion)) {
      document.body.removeChild(this.statusRegion);
    }
  }
}

/**
 * Enhanced ARIA utilities for complex interactions
 */
export class ARIAPatterns {
  /**
   * Create accessible accordion pattern
   */
  static setupAccordion(container: HTMLElement): () => void {
    const headers = container.querySelectorAll('[role="button"]');
    const panels = container.querySelectorAll('[role="region"]');

    headers.forEach((header, index) => {
      const panel = panels[index] as HTMLElement;
      if (!panel) return;

      const headerId = `accordion-header-${index}`;
      const panelId = `accordion-panel-${index}`;

      header.id = headerId;
      panel.id = panelId;
      header.setAttribute('aria-controls', panelId);
      header.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-labelledby', headerId);
      panel.setAttribute('aria-hidden', 'true');

      const handleToggle = () => {
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', (!isExpanded).toString());
        panel.setAttribute('aria-hidden', isExpanded.toString());

        ScreenReaderService.getInstance().announce(
          `${isExpanded ? 'Collapsed' : 'Expanded'} ${header.textContent}`,
          'polite'
        );
      };

      header.addEventListener('click', handleToggle);
      header.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      });
    });

    return () => {
      headers.forEach(header => {
        header.removeEventListener('click', () => {});
        header.removeEventListener('keydown', () => {});
      });
    };
  }

  /**
   * Create accessible tab pattern
   */
  static setupTabs(container: HTMLElement): () => void {
    const tabList = container.querySelector('[role="tablist"]');
    const tabs = container.querySelectorAll('[role="tab"]');
    const panels = container.querySelectorAll('[role="tabpanel"]');

    if (!tabList || tabs.length === 0 || panels.length === 0) return () => {};

    let activeIndex = 0;

    const setActiveTab = (index: number) => {
      tabs.forEach((tab, i) => {
        const panel = panels[i] as HTMLElement;
        if (i === index) {
          tab.setAttribute('aria-selected', 'true');
          tab.setAttribute('tabindex', '0');
          panel.setAttribute('aria-hidden', 'false');
          (tab as HTMLElement).focus();
        } else {
          tab.setAttribute('aria-selected', 'false');
          tab.setAttribute('tabindex', '-1');
          panel.setAttribute('aria-hidden', 'true');
        }
      });

      activeIndex = index;
      ScreenReaderService.getInstance().announce(
        `Selected tab: ${tabs[index].textContent}`,
        'polite'
      );
    };

    const handleKeydown = (e: KeyboardEvent) => {
      let newIndex = activeIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          newIndex = (activeIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      setActiveTab(newIndex);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setActiveTab(index));
    });

    tabList.addEventListener('keydown', handleKeydown);

    // Initialize first tab as active
    setActiveTab(0);

    return () => {
      tabs.forEach(tab => {
        tab.removeEventListener('click', () => {});
      });
      tabList.removeEventListener('keydown', handleKeydown);
    };
  }

  /**
   * Create accessible combobox pattern
   */
  static setupCombobox(input: HTMLInputElement, listbox: HTMLElement): () => void {
    const options = listbox.querySelectorAll('[role="option"]');
    let activeIndex = -1;

    const comboboxId = `combobox-${Date.now()}`;
    const listboxId = `listbox-${Date.now()}`;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-owns', listboxId);
    listbox.id = listboxId;

    const setActiveOption = (index: number) => {
      options.forEach((option, i) => {
        if (i === index) {
          option.setAttribute('aria-selected', 'true');
          input.setAttribute('aria-activedescendant', option.id || `option-${i}`);
        } else {
          option.setAttribute('aria-selected', 'false');
        }
      });
      activeIndex = index;
    };

    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = activeIndex < options.length - 1 ? activeIndex + 1 : 0;
          setActiveOption(nextIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = activeIndex > 0 ? activeIndex - 1 : options.length - 1;
          setActiveOption(prevIndex);
          break;
        case 'Enter':
          if (activeIndex >= 0) {
            e.preventDefault();
            (options[activeIndex] as HTMLElement).click();
          }
          break;
        case 'Escape':
          input.setAttribute('aria-expanded', 'false');
          input.focus();
          break;
      }
    };

    input.addEventListener('keydown', handleKeydown);

    return () => {
      input.removeEventListener('keydown', handleKeydown);
    };
  }
}

export default ScreenReaderService;