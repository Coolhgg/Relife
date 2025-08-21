/// <reference types="node" />
/// <reference lib="dom" />
/**
 * Dynamic Focus Management Hook
 * Handles focus management for dynamically updated content, live regions, and notifications
 */

import { useRef, useCallback, useEffect } from 'react';

interface DynamicFocusOptions {
  announceChanges?: boolean;
  focusOnChange?: boolean;
  debounceMs?: number;
  liveRegionPoliteness?: 'off' | 'polite' | 'assertive';
  persistAnnouncements?: boolean;
}

interface ContentChange {
  type: 'added' | 'updated' | 'removed';
  element: HTMLElement;
  description?: string;
  shouldFocus?: boolean;
}

/**
 * Hook for managing focus and announcements in dynamic content
 */
export function useDynamicFocus(options: DynamicFocusOptions = {}) {
  const {
    announceChanges = true,
    focusOnChange = false,
    debounceMs = 100,
    liveRegionPoliteness = 'polite',
    persistAnnouncements = false,
  } = options;

  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const announcementTimeoutRef = useRef<number | null>(null);
  const pendingAnnouncementsRef = useRef<string[]>([]);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  /**
   * Initialize live region for announcements
   */
  const initializeLiveRegion = useCallback(() => {
    if (!liveRegionRef.current && announceChanges) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', liveRegionPoliteness);
      liveRegion.setAttribute('aria-atomic', 'false');
      liveRegion.setAttribute('id', `dynamic-focus-live-region-${Date.now()}`);
      liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;

      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }
  }, [announceChanges, liveRegionPoliteness]);

  /**
   * Clean up live region
   */
  const cleanupLiveRegion = useCallback(() => {
    if (liveRegionRef.current && liveRegionRef.current.parentNode) {
      liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
      liveRegionRef.current = null;
    }

    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
      announcementTimeoutRef.current = null;
    }
  }, []);

  /**
   * Announce message to screen readers
   */
  const announce = useCallback((message: string, politeness?: 'polite' | 'assertive') => {
    if (!announceChanges || !message.trim()) return;

    initializeLiveRegion();

    if (!liveRegionRef.current) return;

    // Update live region politeness if specified
    if (politeness && politeness !== liveRegionPoliteness) {
      liveRegionRef.current.setAttribute('aria-live', politeness);
    }

    if (debounceMs > 0) {
      // Add to pending announcements
      pendingAnnouncementsRef.current.push(message);

      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }

      announcementTimeoutRef.current = setTimeout(() => {
        if (liveRegionRef.current && pendingAnnouncementsRef.current.length > 0) {
          const announcement = pendingAnnouncementsRef.current.join('. ');
          liveRegionRef.current.textContent = announcement;

          if (!persistAnnouncements) {
            // Clear the announcement after it's been read
            setTimeout(() => {
              if (liveRegionRef.current) {
                liveRegionRef.current.textContent = '';
              }
            }, 1000);
          }

          pendingAnnouncementsRef.current = [];
        }

        // Reset live region politeness if it was changed
        if (politeness && politeness !== liveRegionPoliteness && liveRegionRef.current) {
          liveRegionRef.current.setAttribute('aria-live', liveRegionPoliteness);
        }
      }, debounceMs);
    } else {
      // Immediate announcement
      liveRegionRef.current.textContent = message;

      if (!persistAnnouncements) {
        setTimeout(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = '';
          }
        }, 1000);
      }

      if (politeness && politeness !== liveRegionPoliteness) {
        setTimeout(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.setAttribute('aria-live', liveRegionPoliteness);
          }
        }, 100);
      }
    }
  }, [announceChanges, initializeLiveRegion, debounceMs, liveRegionPoliteness, persistAnnouncements]);

  /**
   * Handle content changes with appropriate focus and announcements
   */
  const handleContentChange = useCallback((change: ContentChange) => {
    const { type, element, description, shouldFocus } = change;

    if (!element) return;

    let announcement = '';

    switch (type) {
      case 'added':
        announcement = description || 'New content added';
        break;
      case 'updated':
        announcement = description || 'Content updated';
        break;
      case 'removed':
        announcement = description || 'Content removed';
        break;
    }

    // Announce the change
    if (announcement) {
      announce(announcement);
    }

    // Handle focus management
    if ((shouldFocus ?? focusOnChange) && type !== 'removed') {
      // Save current focus
      lastFocusedRef.current = document.activeElement as HTMLElement;

      // Focus the new/updated element
      setTimeout(() => {
        if (element && document.body.contains(element)) {
          try {
            // Make element focusable if it isn't already
            if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
              element.setAttribute('tabindex', '-1');
              element.setAttribute('data-dynamic-focus', 'true');
            }

            element.focus({ preventScroll: false });
          } catch (error) {
            console.warn('Failed to focus dynamic content:', error);
          }
        }
      }, 100);
    }
  }, [announce, focusOnChange]);

  /**
   * Announce content loading state
   */
  const announceLoading = useCallback((isLoading: boolean, loadingMessage = 'Loading content', completeMessage = 'Content loaded') => {
    if (isLoading) {
      announce(loadingMessage, 'polite');
    } else {
      announce(completeMessage, 'polite');
    }
  }, [announce]);

  /**
   * Announce error states
   */
  const announceError = useCallback((errorMessage: string) => {
    announce(`Error: ${errorMessage}`, 'assertive');
  }, [announce]);

  /**
   * Announce success states
   */
  const announceSuccess = useCallback((successMessage: string) => {
    announce(`Success: ${successMessage}`, 'polite');
  }, [announce]);

  /**
   * Handle form validation announcements
   */
  const announceValidation = useCallback((field: HTMLElement, isValid: boolean, message?: string) => {
    const fieldLabel = field.getAttribute('aria-label') ||
                      field.getAttribute('name') ||
                      field.id ||
                      'Field';

    if (isValid) {
      if (message) {
        announce(`${fieldLabel} is valid: ${message}`, 'polite');
      }
    } else {
      const errorMessage = message || 'Invalid input';
      announce(`${fieldLabel} error: ${errorMessage}`, 'assertive');

      // Also set aria-invalid and aria-describedby if not already set
      field.setAttribute('aria-invalid', 'true');

      // Focus the field to help user correct the error
      setTimeout(() => {
        field.focus({ preventScroll: false });
      }, 100);
    }
  }, [announce]);

  /**
   * Create a focus trap for dynamic content
   */
  const createContentFocusTrap = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Restore focus to previously focused element
   */
  const restorePreviousFocus = useCallback(() => {
    if (lastFocusedRef.current && document.body.contains(lastFocusedRef.current)) {
      try {
        lastFocusedRef.current.focus({ preventScroll: false });
      } catch (error) {
        console.warn('Failed to restore previous focus:', error);
      }
    }
  }, []);

  /**
   * Initialize on mount and cleanup on unmount
   */
  useEffect(() => {
    initializeLiveRegion();
    return cleanupLiveRegion;
  }, [initializeLiveRegion, cleanupLiveRegion]);

  return {
    announce,
    handleContentChange,
    announceLoading,
    announceError,
    announceSuccess,
    announceValidation,
    createContentFocusTrap,
    restorePreviousFocus,
    liveRegionRef,
  };
}

export default useDynamicFocus;