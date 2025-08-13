// Enhanced Focus Management for Smart Alarm App
// Provides advanced focus indicators and management

export interface FocusSettings {
  showFocusRing: boolean;
  focusRingColor: string;
  focusRingWidth: number;
  highlightActiveElement: boolean;
  skipToContentEnabled: boolean;
  announceOnFocus: boolean;
}

/**
 * Enhanced Focus Management Service
 */
export class EnhancedFocusService {
  private static instance: EnhancedFocusService;
  private settings: FocusSettings;
  private focusObserver?: MutationObserver;
  private activeElement?: HTMLElement;
  private focusIndicator?: HTMLElement;

  private constructor() {
    this.settings = {
      showFocusRing: true,
      focusRingColor: '#007AFF',
      focusRingWidth: 3,
      highlightActiveElement: true,
      skipToContentEnabled: true,
      announceOnFocus: false
    };
    
    this.initialize();
  }

  static getInstance(): EnhancedFocusService {
    if (!EnhancedFocusService.instance) {
      EnhancedFocusService.instance = new EnhancedFocusService();
    }
    return EnhancedFocusService.instance;
  }

  private initialize(): void {
    this.createFocusStyles();
    this.setupEventListeners();
    this.createFocusIndicator();
  }

  private createFocusStyles(): void {
    const style = document.createElement('style');
    style.id = 'enhanced-focus-styles';
    style.textContent = `
      .enhanced-focus-ring {
        outline: ${this.settings.focusRingWidth}px solid ${this.settings.focusRingColor} !important;
        outline-offset: 2px !important;
        border-radius: 4px;
        box-shadow: 0 0 0 ${this.settings.focusRingWidth + 2}px rgba(0, 122, 255, 0.2) !important;
      }
      
      .focus-highlight {
        background-color: rgba(0, 122, 255, 0.1) !important;
        transition: all 0.2s ease-in-out !important;
      }
      
      .skip-to-content {
        position: absolute !important;
        top: -40px !important;
        left: 6px !important;
        background: #000 !important;
        color: white !important;
        padding: 8px 16px !important;
        z-index: 100000 !important;
        text-decoration: none !important;
        border-radius: 4px !important;
        font-size: 14px !important;
      }
      
      .skip-to-content:focus {
        top: 6px !important;
        outline: 2px solid #fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleFocusIn(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    if (!element) return;

    this.activeElement = element;
    
    if (this.settings.showFocusRing) {
      element.classList.add('enhanced-focus-ring');
    }
    
    if (this.settings.highlightActiveElement) {
      element.classList.add('focus-highlight');
    }
    
    this.updateFocusIndicator(element);
  }

  private handleFocusOut(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    if (!element) return;

    element.classList.remove('enhanced-focus-ring', 'focus-highlight');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Show focus rings only when navigating with keyboard
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  }

  private createFocusIndicator(): void {
    this.focusIndicator = document.createElement('div');
    this.focusIndicator.id = 'focus-indicator';
    this.focusIndicator.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      border: 2px solid ${this.settings.focusRingColor};
      background: transparent;
      transition: all 0.15s ease-out;
      border-radius: 4px;
      opacity: 0;
    `;
    document.body.appendChild(this.focusIndicator);
  }

  private updateFocusIndicator(element: HTMLElement): void {
    if (!this.focusIndicator || !this.settings.showFocusRing) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.focusIndicator.style.cssText += `
      top: ${rect.top + scrollTop - 2}px;
      left: ${rect.left + scrollLeft - 2}px;
      width: ${rect.width + 4}px;
      height: ${rect.height + 4}px;
      opacity: 1;
    `;
  }

  updateSettings(newSettings: Partial<FocusSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.createFocusStyles(); // Recreate styles with new settings
  }

  getSettings(): FocusSettings {
    return { ...this.settings };
  }
}

export default EnhancedFocusService;