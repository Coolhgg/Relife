/**
 * Focus Restoration Hook
 * Provides robust focus restoration that handles removed elements and dynamic content
 */

import { useRef, useCallback } from 'react';

interface FocusRestorationOptions {
  fallbackSelector?: string;
  fallbackElement?: HTMLElement;
  announceRestoration?: boolean;
  preventScroll?: boolean;
}

/**
 * Hook for managing focus restoration in dynamic components
 */
export function useFocusRestoration(options: FocusRestorationOptions = {}) {
  const {
    fallbackSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    fallbackElement,
    announceRestoration = false,
    preventScroll = false,
  } = options;

  const savedFocusRef = useRef<HTMLElement | null>(null);
  const fallbackSavedRef = useRef<HTMLElement | null>(null);

  /**
   * Check if an element is focusable and visible
   */
  const isElementFocusable = useCallback((element: HTMLElement): boolean => {
    if (!element || !document.body.contains(element)) {
      return false;
    }

    // Check if element is visible
    const style = window.getComputedStyle(element);
    const isVisible = style.display !== 'none' && 
                      style.visibility !== 'hidden' && 
                      element.offsetWidth > 0 && 
                      element.offsetHeight > 0;

    if (!isVisible) return false;

    // Check if element is disabled
    const isDisabled = element.hasAttribute('disabled') || 
                      element.getAttribute('aria-disabled') === 'true' ||
                      element.hasAttribute('inert');

    if (isDisabled) return false;

    // Check if element has tabindex="-1" but is not programmatically focusable
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === '-1' && !element.hasAttribute('data-programmatic-focus')) {
      return false;
    }

    return true;
  }, []);

  /**
   * Find the best focusable element as a fallback
   */
  const findFallbackElement = useCallback((): HTMLElement | null => {
    // Try provided fallback element first
    if (fallbackElement && isElementFocusable(fallbackElement)) {
      return fallbackElement;
    }

    // Try saved fallback
    if (fallbackSavedRef.current && isElementFocusable(fallbackSavedRef.current)) {
      return fallbackSavedRef.current;
    }

    // Find first focusable element on page
    const focusableElements = document.querySelectorAll<HTMLElement>(fallbackSelector);
    
    for (const element of focusableElements) {
      if (isElementFocusable(element)) {
        return element;
      }
    }

    // Last resort: try body or document element
    if (document.body && isElementFocusable(document.body)) {
      return document.body;
    }

    return null;
  }, [fallbackElement, fallbackSelector, isElementFocusable]);

  /**
   * Save current focus for later restoration
   */
  const saveFocus = useCallback((customElement?: HTMLElement) => {
    const elementToSave = customElement || (document.activeElement as HTMLElement);
    
    if (elementToSave && elementToSave !== document.body) {
      savedFocusRef.current = elementToSave;
      
      // Also save a potential fallback (parent container or nearby element)
      const parent = elementToSave.closest('[role="main"], main, section, article, .modal, .dialog');
      if (parent && parent !== elementToSave) {
        fallbackSavedRef.current = parent as HTMLElement;
      }
    }
  }, []);

  /**
   * Restore focus to saved element or suitable fallback
   */
  const restoreFocus = useCallback((customElement?: HTMLElement): boolean => {
    const elementToRestore = customElement || savedFocusRef.current;
    
    // Try to restore to the originally saved element
    if (elementToRestore && isElementFocusable(elementToRestore)) {
      try {
        elementToRestore.focus({ preventScroll });
        
        if (announceRestoration) {
          const label = elementToRestore.getAttribute('aria-label') || 
                       elementToRestore.textContent || 
                       elementToRestore.tagName.toLowerCase();
          
          // Create accessible announcement
          const announcement = document.createElement('div');
          announcement.setAttribute('role', 'status');
          announcement.setAttribute('aria-live', 'polite');
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
          announcement.textContent = `Focus restored to ${label}`;
          
          document.body.appendChild(announcement);
          setTimeout(() => {
            if (announcement.parentNode) {
              announcement.parentNode.removeChild(announcement);
            }
          }, 1000);
        }
        
        return true;
      } catch (error) {
        console.warn('Failed to restore focus to saved element:', error);
      }
    }

    // Try fallback element
    const fallbackEl = findFallbackElement();
    if (fallbackEl) {
      try {
        fallbackEl.focus({ preventScroll });
        
        if (announceRestoration) {
          console.log('Focus restored to fallback element');
        }
        
        return true;
      } catch (error) {
        console.warn('Failed to restore focus to fallback element:', error);
      }
    }

    return false;
  }, [isElementFocusable, findFallbackElement, preventScroll, announceRestoration]);

  /**
   * Clear saved focus reference
   */
  const clearSavedFocus = useCallback(() => {
    savedFocusRef.current = null;
    fallbackSavedRef.current = null;
  }, []);

  /**
   * Get the currently saved focus element (if still valid)
   */
  const getSavedFocus = useCallback((): HTMLElement | null => {
    if (savedFocusRef.current && isElementFocusable(savedFocusRef.current)) {
      return savedFocusRef.current;
    }
    return null;
  }, [isElementFocusable]);

  /**
   * Safely move focus with fallback handling
   */
  const moveFocus = useCallback((targetElement: HTMLElement | null): boolean => {
    if (targetElement && isElementFocusable(targetElement)) {
      try {
        targetElement.focus({ preventScroll });
        return true;
      } catch (error) {
        console.warn('Failed to move focus to target element:', error);
      }
    }

    // Try fallback
    const fallbackEl = findFallbackElement();
    if (fallbackEl) {
      try {
        fallbackEl.focus({ preventScroll });
        return true;
      } catch (error) {
        console.warn('Failed to move focus to fallback element:', error);
      }
    }

    return false;
  }, [isElementFocusable, findFallbackElement, preventScroll]);

  /**
   * Create a focus restoration function for cleanup
   */
  const createRestorationCleanup = useCallback(() => {
    const currentFocus = savedFocusRef.current;
    return () => {
      if (currentFocus && isElementFocusable(currentFocus)) {
        try {
          currentFocus.focus({ preventScroll });
        } catch (error) {
          console.warn('Cleanup focus restoration failed:', error);
          // Try fallback
          const fallback = findFallbackElement();
          if (fallback) {
            try {
              fallback.focus({ preventScroll });
            } catch (fallbackError) {
              console.warn('Cleanup fallback focus failed:', fallbackError);
            }
          }
        }
      }
    };
  }, [isElementFocusable, findFallbackElement, preventScroll]);

  return {
    saveFocus,
    restoreFocus,
    clearSavedFocus,
    getSavedFocus,
    moveFocus,
    isElementFocusable,
    createRestorationCleanup,
    findFallbackElement,
  };
}

export default useFocusRestoration;