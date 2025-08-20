/// <reference lib="dom" />
// Accessibility utilities for Smart Alarm App
// Provides color contrast checking and accessibility helpers

export interface ColorContrastResult {
  ratio: number;
  level: "AAA" | "AA" | "A" | "FAIL";
  isAccessible: boolean;
  recommendations?: string[];
}

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (
  hex: string,
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance of a color
 */
export const getRelativeLuminance = (
  r: number,
  g: number,
  b: number,
): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate color contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 0;
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color combination meets WCAG contrast requirements
 */
export const checkContrastAccessibility = (
  foreground: string,
  background: string,
  fontSize: "normal" | "large" = "normal",
): ColorContrastResult => {
  const ratio = getContrastRatio(foreground, background);

  // WCAG contrast requirements
  const normalAA = 4.5;
  const normalAAA = 7.0;
  const largeAA = 3.0;
  const largeAAA = 4.5;

  const requiredAA = fontSize === "large" ? largeAA : normalAA;
  const requiredAAA = fontSize === "large" ? largeAAA : normalAAA;

  let level: ColorContrastResult["level"] = "FAIL";
  const recommendations: string[] = [];

  if (ratio >= requiredAAA) {
    level = "AAA";
  } else if (ratio >= requiredAA) {
    level = "AA";
  } else if (ratio >= 3.0) {
    level = "A";
    recommendations.push(
      "Consider using a darker foreground or lighter background",
    );
    recommendations.push(
      "Current contrast meets minimum requirements but not recommended standards",
    );
  } else {
    level = "FAIL";
    recommendations.push(
      "Insufficient contrast - text may be difficult to read",
    );
    recommendations.push("Use a darker foreground or lighter background color");
    recommendations.push(
      `Current ratio: ${ratio.toFixed(2)}, Required: ${requiredAA.toFixed(1)}`,
    );
  }

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    level,
    isAccessible: ratio >= requiredAA,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  };
};

/**
 * Get improved color suggestions for better contrast
 */
export const getContrastImprovedColors = (
  foreground: string,
  background: string,
  targetRatio = 4.5,
): { foreground?: string; background?: string } => {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return {};
  }

  const suggestions: { foreground?: string; background?: string } = {};

  // Suggest darker foreground
  const darkerForeground = {
    r: Math.max(0, fgRgb.r - 50),
    g: Math.max(0, fgRgb.g - 50),
    b: Math.max(0, fgRgb.b - 50),
  };

  const fgHex = `#${darkerForeground.r.toString(16).padStart(2, "0")}${darkerForeground.g.toString(16).padStart(2, "0")}${darkerForeground.b.toString(16).padStart(2, "0")}`;

  if (getContrastRatio(fgHex, background) >= targetRatio) {
    suggestions.foreground = fgHex;
  }

  // Suggest lighter background
  const lighterBackground = {
    r: Math.min(255, bgRgb.r + 50),
    g: Math.min(255, bgRgb.g + 50),
    b: Math.min(255, bgRgb.b + 50),
  };

  const bgHex = `#${lighterBackground.r.toString(16).padStart(2, "0")}${lighterBackground.g.toString(16).padStart(2, "0")}${lighterBackground.b.toString(16).padStart(2, "0")}`;

  if (getContrastRatio(foreground, bgHex) >= targetRatio) {
    suggestions.background = bgHex;
  }

  return suggestions;
};

/**
 * Generate ARIA announcements for dynamic content changes
 */
export const createAriaAnnouncement = (
  message: string,
  priority: "polite" | "assertive" = "polite",
): void => {
  // Create or get existing live region
  let liveRegion = document.getElementById("aria-live-region");

  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "aria-live-region";
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);
  } else {
    liveRegion.setAttribute("aria-live", priority);
  }

  // Clear and set new message
  liveRegion.textContent = "";
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);

  // Clear after announcement
  setTimeout(() => {
    liveRegion!.textContent = "";
  }, 3000);
};

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  /**
   * Push current focus to stack and move to new element
   */
  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && currentFocus !== document.body) {
      this.focusStack.push(currentFocus);
    }

    element.focus();
  }

  /**
   * Return focus to previous element in stack
   */
  static popFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }

  /**
   * Clear focus stack
   */
  static clearFocusStack(): void {
    this.focusStack = [];
  }

  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }
}

/**
 * Check if an element is visible on screen (for skip links, etc.)
 */
export const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
};

/**
 * Announce page changes for single-page applications
 */
export const announcePageChange = (pageName: string): void => {
  createAriaAnnouncement(`Navigated to ${pageName}`, "polite");

  // Update page title
  document.title = `${pageName} - Smart Alarm`;
};

/**
 * High contrast mode detection
 */
export const isHighContrastMode = (): boolean => {
  // Check for Windows high contrast mode
  if (window.matchMedia("(prefers-contrast: high)").matches) {
    return true;
  }

  // Check for forced colors (Windows high contrast)
  if (window.matchMedia("(forced-colors: active)").matches) {
    return true;
  }

  return false;
};

/**
 * Reduced motion preference detection
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Add accessible tooltips
 */
export const addAccessibleTooltip = (
  trigger: HTMLElement,
  content: string,
  options: {
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
  } = {},
): (() => void) => {
  const { position = "top", delay = 300 } = options;
  let tooltip: HTMLElement | null = null;
  let timeoutId: number | null = null;

  const showTooltip = () => {
    tooltip = document.createElement("div");
    tooltip.className = `
      absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900
      rounded-md shadow-lg pointer-events-none max-w-xs
    `;
    tooltip.textContent = content;
    tooltip.role = "tooltip";

    document.body.appendChild(tooltip);

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = triggerRect.top - tooltipRect.height - 5;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + 5;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 5;
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 5;
        break;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Generate unique ID
    const tooltipId = `tooltip-${Date.now()}`;
    tooltip.id = tooltipId;
    trigger.setAttribute("aria-describedby", tooltipId);
  };

  const hideTooltip = () => {
    if (tooltip) {
      document.body.removeChild(tooltip);
      tooltip = null;
    }
    trigger.removeAttribute("aria-describedby");
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const handleMouseEnter = () => {
    timeoutId = window.setTimeout(showTooltip, delay);
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleFocus = () => {
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  trigger.addEventListener("mouseenter", handleMouseEnter);
  trigger.addEventListener("mouseleave", handleMouseLeave);
  trigger.addEventListener("focus", handleFocus);
  trigger.addEventListener("blur", handleBlur);

  // Return cleanup function
  return () => {
    hideTooltip();
    trigger.removeEventListener("mouseenter", handleMouseEnter);
    trigger.removeEventListener("mouseleave", handleMouseLeave);
    trigger.removeEventListener("focus", handleFocus);
    trigger.removeEventListener("blur", handleBlur);
  };
};

export default {
  checkContrastAccessibility,
  getContrastImprovedColors,
  createAriaAnnouncement,
  FocusManager,
  announcePageChange,
  isHighContrastMode,
  prefersReducedMotion,
  addAccessibleTooltip,
};
