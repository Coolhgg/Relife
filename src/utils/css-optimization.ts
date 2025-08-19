/**
 * CSS Optimization Utilities
 * Provides utilities for efficient CSS custom property management and style calculations
 */

/**
 * Efficiently batch CSS custom property updates
 */
export function batchCSSUpdates(
  element: HTMLElement,
  properties: Record<string, string>,
): void {
  // Use DocumentFragment for batch updates to minimize reflows
  requestAnimationFrame(() => {
    element.style.cssText +=
      "; " +
      Object.entries(properties)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join("; ");
  });
}

/**
 * Create CSS custom properties with fallbacks
 */
export function createCSSProperty(
  property: string,
  value: string,
  fallback?: string,
): string {
  return fallback ? `var(${property}, ${fallback})` : `var(${property})`;
}

/**
 * Generate responsive CSS values based on screen size
 */
export function getResponsiveValue(
  mobile: string,
  tablet: string,
  desktop: string,
  currentBreakpoint: "mobile" | "tablet" | "desktop" = "desktop",
): string {
  switch (currentBreakpoint) {
    case "mobile":
      return mobile;
    case "tablet":
      return tablet;
    case "desktop":
    default:
      return desktop;
  }
}

/**
 * Calculate optimal contrast color
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Generate color variations from base color
 */
export function generateColorScale(
  baseColor: string,
  steps: number = 10,
): Record<string, string> {
  const scale: Record<string, string> = {};

  // This is a simplified version - in production, you'd use a proper color manipulation library
  for (let i = 0; i < steps; i++) {
    const intensity = (i + 1) * (100 / steps);
    scale[`${intensity * 10}`] = baseColor; // Simplified - would normally calculate variations
  }

  return scale;
}

/**
 * CSS-in-JS style object to CSS string converter
 */
export function stylesToCSSString(styles: Record<string, any>): string {
  return Object.entries(styles)
    .map(([property, value]) => {
      // Convert camelCase to kebab-case
      const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssProperty}: ${value}`;
    })
    .join("; ");
}

/**
 * Debounced style application for performance
 */
export function createDebouncedStyler(delay: number = 16) {
  let timeout: NodeJS.Timeout | null = null;

  return function (element: HTMLElement, styles: Record<string, string>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      batchCSSUpdates(element, styles);
    }, delay);
  };
}

/**
 * CSS custom properties manager for better performance
 */
export class CSSCustomPropertiesManager {
  private cache = new Map<string, string>();
  private batchQueue: Array<{ property: string; value: string }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  /**
   * Set a CSS custom property with caching
   */
  setProperty(
    property: string,
    value: string,
    immediate: boolean = false,
  ): void {
    // Skip if value hasn't changed
    if (this.cache.get(property) === value) {
      return;
    }

    this.cache.set(property, value);

    if (immediate) {
      document.documentElement.style.setProperty(property, value);
    } else {
      this.batchQueue.push({ property, value });
      this.scheduleBatch();
    }
  }

  /**
   * Get cached property value
   */
  getProperty(property: string): string | undefined {
    return this.cache.get(property);
  }

  /**
   * Schedule batched updates
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) {
      return;
    }

    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
    }, 16); // One frame delay
  }

  /**
   * Flush queued property updates
   */
  private flushBatch(): void {
    if (this.batchQueue.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      const root = document.documentElement;

      // Apply all queued updates at once
      this.batchQueue.forEach(({ property, value }) => {
        root.style.setProperty(property, value);
      });

      this.batchQueue = [];
      this.batchTimeout = null;
    });
  }

  /**
   * Clear all cached properties
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
