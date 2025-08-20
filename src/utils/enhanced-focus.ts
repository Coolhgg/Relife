/// <reference lib="dom" />
// Enhanced Focus Management for Smart Alarm App
// Provides advanced focus indicators and management

export interface FocusSettings {
  showFocusRing: boolean;
  focusRingColor: string;
  focusRingWidth: number;
  focusRingOffset: number;
  highlightActiveElement: boolean;
  highlightFocusableElements: boolean;
  skipToContentEnabled: boolean;
  announceOnFocus: boolean;
  announceFocusChanges: boolean;
  isEnabled: boolean;
}

export interface FocusIndicatorOptions {
  color: string;
  width: number;
  style?: "solid" | "dashed" | "dotted";
  borderRadius?: number;
}

export interface FocusState {
  isEnabled: boolean;
  isKeyboardNavigation: boolean;
  focusRingColor: string;
  focusRingWidth: number;
  focusRingOffset: number;
  highlightFocusableElements: boolean;
  announceFocusChanges: boolean;
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
  private styleElement?: HTMLStyleElement;
  private isKeyboardNavigating = false;
  private customIndicators = new Map<HTMLElement, HTMLElement>();
  private skipLinks: HTMLAnchorElement[] = [];

  private constructor() {
    this.settings = {
      showFocusRing: true,
      focusRingColor: "#007AFF",
      focusRingWidth: 3,
      focusRingOffset: 2,
      highlightActiveElement: true,
      highlightFocusableElements: false,
      skipToContentEnabled: true,
      announceOnFocus: false,
      announceFocusChanges: false,
      isEnabled: true,
    };

    this.initialize();
  }

  static getInstance(): EnhancedFocusService {
    if (!EnhancedFocusService.instance) {
      EnhancedFocusService.instance = new EnhancedFocusService();
    }
    return EnhancedFocusService.instance;
  }

  public initialize(): void {
    this.createFocusStyles();
    this.setupEventListeners();
    this.createFocusIndicator();
  }

  /**
   * Get the current enabled state
   */
  public get isEnabled(): boolean {
    return this.settings.isEnabled;
  }

  private createFocusStyles(): void {
    // Remove existing style element if it exists
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }

    this.styleElement = document.createElement("style");
    this.styleElement.setAttribute("data-focus-service", "true");
    this.styleElement.id = "enhanced-focus-styles";
    this.styleElement.textContent = `
      .enhanced-focus {
        outline: ${this.settings.focusRingWidth}px solid ${this.settings.focusRingColor} !important;
        outline-offset: ${this.settings.focusRingOffset}px !important;
        border-radius: 4px;
        box-shadow: 0 0 0 ${this.settings.focusRingWidth + 2}px rgba(0, 122, 255, 0.2) !important;
      }

      .enhanced-focus-ring {
        outline: ${this.settings.focusRingWidth}px solid ${this.settings.focusRingColor} !important;
        outline-offset: ${this.settings.focusRingOffset}px !important;
        border-radius: 4px;
        box-shadow: 0 0 0 ${this.settings.focusRingWidth + 2}px rgba(0, 122, 255, 0.2) !important;
      }

      .focus-highlight {
        background-color: rgba(0, 122, 255, 0.1) !important;
        transition: all 0.2s ease-in-out !important;
      }

      .focusable-highlight {
        background-color: rgba(255, 255, 0, 0.2) !important;
        outline: 1px solid #ffeb3b !important;
        outline-offset: 1px !important;
      }

      .keyboard-navigation *:focus {
        outline: ${this.settings.focusRingWidth}px solid ${this.settings.focusRingColor} !important;
        outline-offset: ${this.settings.focusRingOffset}px !important;
      }

      .skip-link {
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
        transition: top 0.2s ease-in-out !important;
      }

      .skip-link:focus,
      .skip-link-visible {
        top: 6px !important;
        outline: 2px solid #fff !important;
      }

      .focus-ring-indicator {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        background: transparent;
        transition: all 0.15s ease-out;
        border-radius: 4px;
        opacity: 0;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  private setupEventListeners(): void {
    document.addEventListener("focusin", this.handleFocusIn.bind(this));
    document.addEventListener("focusout", this.handleFocusOut.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private handleFocusIn(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    if (!element) return;

    this.activeElement = element;

    if (this.settings.showFocusRing && this.isKeyboardNavigating) {
      element.classList.add("enhanced-focus-ring");
    }

    if (this.settings.highlightActiveElement) {
      element.classList.add("focus-highlight");
    }

    this.updateFocusIndicator(element);
  }

  private handleFocusOut(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    if (!element) return;

    element.classList.remove("enhanced-focus-ring", "focus-highlight");

    if (this.focusIndicator) {
      this.focusIndicator.style.opacity = "0";
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Show focus rings only when navigating with keyboard
    if (
      event.key === "Tab" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      this.isKeyboardNavigating = true;
      document.body.classList.add("keyboard-navigation");
    }
  }

  private handleMouseDown(): void {
    this.isKeyboardNavigating = false;
    document.body.classList.remove("keyboard-navigation");
  }

  private handleResize(): void {
    if (this.activeElement) {
      this.updateFocusIndicator(this.activeElement);
    }
  }

  private createFocusIndicator(): void {
    if (this.focusIndicator && this.focusIndicator.parentNode) {
      this.focusIndicator.parentNode.removeChild(this.focusIndicator);
    }

    this.focusIndicator = document.createElement("div");
    this.focusIndicator.id = "focus-indicator";
    this.focusIndicator.className = "focus-ring-indicator";
    this.focusIndicator.style.cssText = `
      border: ${this.settings.focusRingWidth}px solid ${this.settings.focusRingColor};
    `;
    document.body.appendChild(this.focusIndicator);
  }

  private updateFocusIndicator(element: HTMLElement): void {
    if (!this.focusIndicator || !this.settings.showFocusRing) return;

    try {
      const rect = element.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      const offset = this.settings.focusRingOffset;
      this.focusIndicator.style.top = `${rect.top + scrollTop - offset}px`;
      this.focusIndicator.style.left = `${rect.left + scrollLeft - offset}px`;
      this.focusIndicator.style.width = `${rect.width + offset * 2}px`;
      this.focusIndicator.style.height = `${rect.height + offset * 2}px`;
      this.focusIndicator.style.opacity = "1";
    } catch (error) {
      // Handle getBoundingClientRect errors gracefully
      console.warn("Focus indicator positioning error:", error);
    }
  }

  updateSettings(newSettings: Partial<FocusSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.createFocusStyles(); // Recreate styles with new settings
    if (this.focusIndicator) {
      this.createFocusIndicator(); // Recreate focus indicator with new settings
    }
  }

  getSettings(): FocusSettings {
    return { ...this.settings };
  }

  getState(): FocusState {
    return {
      isEnabled: this.settings.isEnabled,
      isKeyboardNavigation: this.isKeyboardNavigating,
      focusRingColor: this.settings.focusRingColor,
      focusRingWidth: this.settings.focusRingWidth,
      focusRingOffset: this.settings.focusRingOffset,
      highlightFocusableElements: this.settings.highlightFocusableElements,
      announceFocusChanges: this.settings.announceFocusChanges,
    };
  }

  isKeyboardNavigation(): boolean {
    return this.isKeyboardNavigating;
  }

  enhanceFocusRing(element: HTMLElement): void {
    if (!element) return;

    const handleFocus = () => {
      element.classList.add("enhanced-focus");
      this.updateFocusIndicator(element);

      if (this.settings.announceFocusChanges) {
        const label = this.getElementLabel(element);
        const event = new CustomEvent("focus-announcement", {
          detail: {
            element,
            text: `Focused on ${label}`,
          },
        });
        document.dispatchEvent(event);
      }
    };

    const handleBlur = () => {
      element.classList.remove("enhanced-focus");
      if (this.focusIndicator) {
        this.focusIndicator.style.opacity = "0";
      }
    };

    element.addEventListener("focus", handleFocus);
    element.addEventListener("blur", handleBlur);
  }

  private getElementLabel(element: HTMLElement): string {
    // Try aria-label first
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Try aria-labelledby
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || "";
    }

    // Try associated label element
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || "";
    }

    // Use text content or placeholder
    return (
      element.textContent ||
      (element as HTMLInputElement).placeholder ||
      element.getAttribute("title") ||
      element.tagName.toLowerCase()
    );
  }

  createSkipLink(href: string, text: string): void {
    // Check if skip link already exists
    const existing = document.querySelector(`a[href="${href}"]`);
    if (existing) return;

    const skipLink = document.createElement("a");
    skipLink.href = href;
    skipLink.textContent = text;
    skipLink.className = "skip-link";

    const handleFocus = () => {
      skipLink.classList.add("skip-link-visible");
    };

    const handleBlur = () => {
      skipLink.classList.remove("skip-link-visible");
    };

    const handleClick = (e: Event) => {
      e.preventDefault();
      const target = document.querySelector(href) as HTMLElement;
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    skipLink.addEventListener("focus", handleFocus);
    skipLink.addEventListener("blur", handleBlur);
    skipLink.addEventListener("click", handleClick);

    document.body.insertBefore(skipLink, document.body.firstChild);
    this.skipLinks.push(skipLink);
  }

  highlightFocusableElements(): void {
    const focusableElements = this.getFocusableElements();
    focusableElements.forEach((element) => {
      element.classList.add("focusable-highlight");
    });
  }

  removeFocusableHighlights(): void {
    const highlighted = document.querySelectorAll(".focusable-highlight");
    highlighted.forEach((element) => {
      element.classList.remove("focusable-highlight");
    });
  }

  getFocusableElements(): HTMLElement[] {
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

    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) as HTMLElement[];
  }

  createCustomFocusIndicator(
    element: HTMLElement,
    options: FocusIndicatorOptions,
  ): void {
    if (!element) return;

    const indicator = document.createElement("div");
    indicator.className = "focus-ring-indicator";
    indicator.style.cssText = `
      border: ${options.width}px ${options.style || "solid"} ${options.color};
      border-radius: ${options.borderRadius || 4}px;
    `;

    const handleFocus = () => {
      try {
        const rect = element.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft =
          window.pageXOffset || document.documentElement.scrollLeft;

        indicator.style.top = `${rect.top + scrollTop - 2}px`;
        indicator.style.left = `${rect.left + scrollLeft - 2}px`;
        indicator.style.width = `${rect.width + 4}px`;
        indicator.style.height = `${rect.height + 4}px`;
        indicator.style.opacity = "1";

        if (!indicator.parentNode) {
          document.body.appendChild(indicator);
        }
      } catch (error) {
        console.warn("Custom focus indicator positioning error:", error);
      }
    };

    const handleBlur = () => {
      indicator.style.opacity = "0";
    };

    element.addEventListener("focus", handleFocus);
    element.addEventListener("blur", handleBlur);

    this.customIndicators.set(element, indicator);
  }

  cleanup(): void {
    // Remove event listeners
    document.removeEventListener("focusin", this.handleFocusIn.bind(this));
    document.removeEventListener("focusout", this.handleFocusOut.bind(this));
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.removeEventListener("mousedown", this.handleMouseDown.bind(this));
    window.removeEventListener("resize", this.handleResize.bind(this));

    // Remove focus indicator
    if (this.focusIndicator && this.focusIndicator.parentNode) {
      this.focusIndicator.parentNode.removeChild(this.focusIndicator);
    }

    // Remove custom indicators
    this.customIndicators.forEach((indicator, element) => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    });
    this.customIndicators.clear();

    // Remove skip links
    this.skipLinks.forEach((link) => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    this.skipLinks = [];

    // Remove style element
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }

    // Remove focusable highlights
    this.removeFocusableHighlights();

    // Remove keyboard navigation class
    document.body.classList.remove("keyboard-navigation");
  }
}

export default EnhancedFocusService;
