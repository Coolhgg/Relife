/// <reference lib="dom" />
import * as React from 'react';
/**
 * Focus Trap Hook for Modal Components
 * Provides comprehensive focus management including trapping, restoration, and announcements
 */

import { useEffect, useRef, useCallback } from 'react';
import { TimeoutHandle } from '../types/timers';

interface FocusTrapOptions {
  isEnabled: boolean;
  restoreFocus?: boolean;
  allowOutsideClick?: boolean;
  preventScroll?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
  onEscape?: () => void;
  announceOnOpen?: string;
  announceOnClose?: string;
}

interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
}

/**
 * Custom hook for managing focus trapping within modal components
 */
export function useFocusTrap({
  isEnabled,
  restoreFocus = true,
  allowOutsideClick = false,
  preventScroll = true,
  initialFocusRef,
  finalFocusRef,
  onEscape,
  announceOnOpen,
  announceOnClose,
}: FocusTrapOptions) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const sentinelStartRef = useRef<HTMLElement>(null);
  const sentinelEndRef = useRef<HTMLElement>(null);
  const isInitialFocusSet = useRef<boolean>(false);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback(
    (container: HTMLElement): FocusableElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        'area[href]',
        'summary',
        'iframe',
        'object',
        'embed',
        'audio[controls]',
        'video[controls]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]:not([contenteditable="false"])',
      ].join(', ');

      const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );

      return candidates
        .filter(element => {
          // Check if element is visible and not disabled
          const style = window.getComputedStyle(element);
          const isVisible =
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            element.offsetWidth > 0 &&
            element.offsetHeight > 0;

          const isDisabled =
            element.hasAttribute('disabled') ||
            element.getAttribute('aria-disabled') === 'true';

          return isVisible && !isDisabled;
        })
        .map(element => ({
          element,
          tabIndex: parseInt(element.getAttribute('tabindex') || '0', 10),
        }))
        .sort((a, b) => {
          // Sort by tabindex, then by DOM order
          if (a.tabIndex !== b.tabIndex) {
            if (a.tabIndex === 0) return 1;
            if (b.tabIndex === 0) return -1;
            return a.tabIndex - b.tabIndex;
          }

          // Use DOM order
          return (
            Array.prototype.indexOf.call(
              containerRef.current?.querySelectorAll('*') || [],
              a.element
            ) -
            Array.prototype.indexOf.call(
              containerRef.current?.querySelectorAll('*') || [],
              b.element
            )
          );
        });
    },
    []
  );

  /**
   * Move focus to the first focusable element
   */
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;

    // Try initial focus ref first
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus({ preventScroll });
      return;
    }

    const focusableElements = getFocusableElements(containerRef.current);

    if (focusableElements.length > 0) {
      focusableElements[0].element.focus({ preventScroll });
    } else {
      // Fallback to container itself
      containerRef.current.focus({ preventScroll });
    }
  }, [getFocusableElements, initialFocusRef, preventScroll]);

  /**
   * Move focus to the last focusable element
   */
  const focusLast = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);

    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].element.focus({ preventScroll });
    } else {
      containerRef.current.focus({ preventScroll });
    }
  }, [getFocusableElements, preventScroll]);

  /**
   * Handle keydown events for focus trapping
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled || !containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      // Only trap Tab key
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);

      if (focusableElements.length === 0) {
        // No focusable elements, prevent tabbing
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0].element;
      const lastElement = focusableElements[focusableElements.length - 1].element;
      const currentFocused = document.activeElement as HTMLElement;

      // If no element is focused, focus first element
      if (!currentFocused || !containerRef.current.contains(currentFocused)) {
        event.preventDefault();
        focusFirst();
        return;
      }

      // Tab backwards from first element - go to last
      if (event.shiftKey && currentFocused === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll });
        return;
      }

      // Tab forwards from last element - go to first
      if (!event.shiftKey && currentFocused === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll });
        return;
      }
    },
    [isEnabled, onEscape, getFocusableElements, focusFirst, preventScroll]
  );

  /**
   * Handle click events outside the focus trap
   */
  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (!isEnabled || !containerRef.current || allowOutsideClick) return;

      const target = event.target as HTMLElement;

      // If click is outside the container, prevent it and return focus
      if (!containerRef.current.contains(target)) {
        event.preventDefault();
        event.stopPropagation();

        // Return focus to the container or first focusable element
        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
          focusableElements[0].element.focus({ preventScroll });
        } else {
          containerRef.current.focus({ preventScroll });
        }
      }
    },
    [isEnabled, allowOutsideClick, getFocusableElements, preventScroll]
  );

  /**
   * Create focus sentinels to detect when focus tries to leave the trap
   */
  const createSentinels = useCallback(() => {
    if (!containerRef.current) return;

    // Remove existing sentinels
    const existingSentinels = containerRef.current.querySelectorAll(
      '[data-focus-sentinel]'
    );
    existingSentinels.forEach((sentinel: any) => // auto: implicit any sentinel.remove());

    // Create start sentinel
    const startSentinel = document.createElement('div');
    startSentinel.setAttribute('tabindex', '0');
    startSentinel.setAttribute('data-focus-sentinel', 'start');
    startSentinel.setAttribute('aria-hidden', 'true');
    startSentinel.style.cssText = `
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

    startSentinel.addEventListener('focus', () => focusLast());
    containerRef.current.insertBefore(startSentinel, containerRef.current.firstChild);
    sentinelStartRef.current = startSentinel;

    // Create end sentinel
    const endSentinel = document.createElement('div');
    endSentinel.setAttribute('tabindex', '0');
    endSentinel.setAttribute('data-focus-sentinel', 'end');
    endSentinel.setAttribute('aria-hidden', 'true');
    endSentinel.style.cssText = startSentinel.style.cssText;

    endSentinel.addEventListener('focus', () => focusFirst());
    containerRef.current.appendChild(endSentinel);
    sentinelEndRef.current = endSentinel;
  }, [focusFirst, focusLast]);

  /**
   * Announce to screen readers
   */
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
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
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }, []);

  /**
   * Setup focus trap
   */
  const setupFocusTrap = useCallback(() => {
    if (!isEnabled || !containerRef.current) return;

    // Store previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Create sentinels for focus trapping
    createSentinels();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);

    // Set initial focus
    setTimeout(() => {
      focusFirst();
      isInitialFocusSet.current = true;

      // Announce to screen readers
      if (announceOnOpen) {
        announceToScreenReader(announceOnOpen);
      }
    }, 0);

    return () => {
      // Cleanup
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('touchstart', handleOutsideClick, true);

      // Remove sentinels
      if (sentinelStartRef.current?.parentNode) {
        sentinelStartRef.current.parentNode.removeChild(sentinelStartRef.current);
      }
      if (sentinelEndRef.current?.parentNode) {
        sentinelEndRef.current.parentNode.removeChild(sentinelEndRef.current);
      }
    };
  }, [
    isEnabled,
    createSentinels,
    handleKeyDown,
    handleOutsideClick,
    focusFirst,
    announceOnOpen,
    announceToScreenReader,
  ]);

  /**
   * Restore focus when trap is disabled
   */
  const restorePreviousFocus = useCallback(() => {
    if (!restoreFocus) return;

    const elementToFocus = finalFocusRef?.current || previousActiveElementRef.current;

    if (elementToFocus && document.body.contains(elementToFocus)) {
      // Check if element is still focusable
      const style = window.getComputedStyle(elementToFocus);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
      const isDisabled =
        elementToFocus.hasAttribute('disabled') ||
        elementToFocus.getAttribute('aria-disabled') === 'true';

      if (isVisible && !isDisabled) {
        elementToFocus.focus({ preventScroll });
      }
    }

    // Announce to screen readers
    if (announceOnClose) {
      announceToScreenReader(announceOnClose);
    }
  }, [
    restoreFocus,
    finalFocusRef,
    preventScroll,
    announceOnClose,
    announceToScreenReader,
  ]);

  /**
   * Effect to setup/cleanup focus trap
   */
  useEffect(() => {
    if (isEnabled) {
      return setupFocusTrap();
    } else if (isInitialFocusSet.current) {
      // Only restore focus if we had previously set it
      restorePreviousFocus();
      isInitialFocusSet.current = false;
    }
  }, [isEnabled, setupFocusTrap, restorePreviousFocus]);

  /**
   * Cleanup on unmount - restore focus to previous element when component unmounts
   * Note: Empty dependency array is intentional - this should only run on unmount,
   * not when restorePreviousFocus changes, to avoid unwanted focus restoration
   * during component lifecycle.
   */
  useEffect(() => {
    return () => {
      if (isInitialFocusSet.current) {
        restorePreviousFocus();
      }
    };
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements: () =>
      containerRef.current ? getFocusableElements(containerRef.current) : [],
  };
}

export default useFocusTrap;
