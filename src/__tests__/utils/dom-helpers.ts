// DOM manipulation and testing utilities

import { screen, within, fireEvent, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { TEST_CONSTANTS } from './index';

// Element query helpers with enhanced error messages
export const _domQuery = {
  // Get element with better _error messaging
  getByTestId: (testId: string, container?: HTMLElement) => {
    try {
      return container
        ? within(container).getByTestId(testId)
        : screen.getByTestId(testId);
    } catch (_error) {
      throw new Error(
        `Element with testid="${testId}" not found. Available test ids: ${getAvailableTestIds(container).join(', ')}`
      );
    }
  },

  // Get element by role with fallback
  getByRoleWithFallback: (role: string, name?: string, container?: HTMLElement) => {
    try {
      const options = name ? { name } : {};
      return container
        ? within(container).getByRole(role as any, options)
        : screen.getByRole(role as any, options);
    } catch (_error) {
      const availableRoles = getAvailableRoles(container);
      throw new Error(
        `Element with role="${role}"${name ? ` and name="${name}"` : ''} not found. Available roles: ${availableRoles.join(', ')}`
      );
    }
  },

  // Query multiple elements with better error handling
  getAllByTestId: (testId: string, container?: HTMLElement) => {
    const elements = container
      ? within(container).queryAllByTestId(testId)
      : screen.queryAllByTestId(testId);

    if (elements.length === 0) {
      throw new Error(
        `No elements found with testid="${testId}". Available test ids: ${getAvailableTestIds(container).join(', ')}`
      );
    }

    return elements;
  },

  // Find element with timeout and better error messages
  findByTestIdWithTimeout: async (
    testId: string,
    timeout = 3000,
    container?: HTMLElement
  ) => {
    try {
      return await (container
        ? within(container).findByTestId(testId, { timeout })
        : screen.findByTestId(testId, { timeout }));
    } catch (_error) {
      throw new Error(
        `Element with testid="${testId}" not found within ${timeout}ms. Available test ids: ${getAvailableTestIds(container).join(', ')}`
      );
    }
  },
};

// Viewport and responsive testing utilities
export const _viewport = {
  // Set viewport size and trigger resize
  setSize: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });

    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
  },

  // Common viewport presets
  setMobile: () => viewport.setSize(375, 667),
  setTablet: () => viewport.setSize(768, 1024),
  setDesktop: () => viewport.setSize(1200, 800),
  setLargeDesktop: () => viewport.setSize(1920, 1080),

  // Portrait/landscape orientation
  setPortrait: () => {
    const { innerWidth, innerHeight } = window;
    if (innerWidth > innerHeight) {
      viewport.setSize(innerHeight, innerWidth);
    }
  },

  setLandscape: () => {
    const { innerWidth, innerHeight } = window;
    if (innerHeight > innerWidth) {
      viewport.setSize(innerHeight, innerWidth);
    }
  },

  // Get current viewport info
  getCurrent: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    category: getViewportCategory(window.innerWidth),
  }),

  // Test responsive behavior
  testBreakpoints: async (
    element: HTMLElement,
    breakpoints: Array<{ width: number; test: () => void }>
  ) => {
    for (const { width, test } of breakpoints) {
      viewport.setSize(width, 800);
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for reflow
      test();
    }
  },
};

// CSS and styling utilities
export const _styling = {
  // Get computed styles with cleanup
  getComputedStyle: (element: HTMLElement, property?: string) => {
    const computed = window.getComputedStyle(element);
    return property ? computed.getPropertyValue(property) : computed;
  },

  // Check if element has specific CSS class
  hasClass: (element: HTMLElement, className: string): boolean => {
    return element.classList.contains(className);
  },

  // Check multiple classes at once
  hasClasses: (element: HTMLElement, classNames: string[]): boolean => {
    return classNames.every(className => element.classList.contains(className));
  },

  // Check if element has any of the provided classes
  hasAnyClass: (element: HTMLElement, classNames: string[]): boolean => {
    return classNames.some(className => element.classList.contains(className));
  },

  // Get all classes as array
  getClasses: (element: HTMLElement): string[] => {
    return Array.from(element.classList);
  },

  // Check CSS property values
  hasStyleProperty: (
    element: HTMLElement,
    property: string,
    expectedValue: string
  ): boolean => {
    const value = styling.getComputedStyle(element, property);
    return value === expectedValue;
  },

  // Check multiple style properties
  hasStyleProperties: (
    element: HTMLElement,
    properties: Record<string, string>
  ): boolean => {
    return Object.entries(properties).every(([property, expectedValue]) =>
      styling.hasStyleProperty(element, property, expectedValue)
    );
  },

  // Check if element is visible (not display: none or visibility: hidden)
  isVisible: (element: HTMLElement): boolean => {
    const style = styling.getComputedStyle(element);
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
    );
  },

  // Check if element is accessible (not just visible)
  isAccessible: (element: HTMLElement): boolean => {
    return (
      styling.isVisible(element) &&
      !element.hasAttribute('aria-hidden') &&
      element.tabIndex !== -1
    );
  },
};

// Form testing utilities
export const _forms = {
  // Fill out form with data object
  fillForm: async (formData: Record<string, any>, container?: HTMLElement) => {
    const user = userEvent.setup();

    for (const [fieldName, value] of Object.entries(formData)) {
      const field = container
        ? within(container).getByRole('textbox', { name: new RegExp(fieldName, 'i') })
        : screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') });

      await user.clear(field);

      if (typeof value === 'string') {
        await user.type(field, value);
      } else if (typeof value === 'boolean' && field.type === 'checkbox') {
        if (value !== field.checked) {
          await user.click(field);
        }
      }
    }
  },

  // Submit form and wait for response
  submitForm: async (formSelector = 'form', container?: HTMLElement) => {
    const user = userEvent.setup();
    const form = container
      ? within(container).getByRole('form') ||
        within(container).querySelector(formSelector)
      : screen.getByRole('form') || document.querySelector(formSelector);

    if (!form) {
      throw new Error(`Form not found with selector: ${formSelector}`);
    }

    const submitButton = within(form as HTMLElement).getByRole('button', {
      name: /submit|send|save/i,
    });
    await user.click(submitButton);
  },

  // Validate form errors
  expectFormErrors: (expectedErrors: string[], container?: HTMLElement) => {
    expectedErrors.forEach(_error => {
      const errorElement = container
        ? within(container).getByText(_error)
        : screen.getByText(_error);
      expect(errorElement).toBeVisible();
    });
  },

  // Check form validation state
  getFormValidationState: (formElement: HTMLFormElement) => {
    const inputs = Array.from(formElement.querySelectorAll('input, select, textarea'));
    return {
      isValid: formElement.checkValidity(),
      invalidFields: inputs.filter(
        input => !(input as HTMLInputElement).checkValidity()
      ),
      validFields: inputs.filter(input => (input as HTMLInputElement).checkValidity()),
      hasRequiredFields: inputs.some(input => (input as HTMLInputElement).required),
      completedFields: inputs.filter(
        input => (input as HTMLInputElement).value.length > 0
      ),
    };
  },
};

// Event simulation utilities
export const _events = {
  // Enhanced click with options
  click: async (
    element: HTMLElement,
    options: { double?: boolean; right?: boolean } = {}
  ) => {
    const user = userEvent.setup();

    if (options.double) {
      await user.dblClick(element);
    } else if (options.right) {
      fireEvent.contextMenu(element);
    } else {
      await user.click(element);
    }
  },

  // Keyboard interactions
  keyboard: {
    press: async (element: HTMLElement, key: string) => {
      const user = userEvent.setup();
      element.focus();
      await user.keyboard(key);
    },

    type: async (
      element: HTMLElement,
      text: string,
      options: { delay?: number } = {}
    ) => {
      const user = userEvent.setup({ delay: options.delay });
      await user.type(element, text);
    },

    shortcut: async (keys: string) => {
      const user = userEvent.setup();
      await user.keyboard(keys);
    },
  },

  // Touch and gesture events for mobile testing
  touch: {
    tap: (element: HTMLElement) => {
      fireEvent.touchStart(element, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchEnd(element, { changedTouches: [{ clientX: 0, clientY: 0 }] });
    },

    swipe: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down') => {
      const startCoords = { clientX: 100, clientY: 100 };
      const endCoords = {
        left: { clientX: 50, clientY: 100 },
        right: { clientX: 150, clientY: 100 },
        up: { clientX: 100, clientY: 50 },
        down: { clientX: 100, clientY: 150 },
      }[direction];

      fireEvent.touchStart(element, { touches: [startCoords] });
      fireEvent.touchMove(element, { touches: [endCoords] });
      fireEvent.touchEnd(element, { changedTouches: [endCoords] });
    },

    longPress: (element: HTMLElement, duration = 1000) => {
      fireEvent.touchStart(element, { touches: [{ clientX: 0, clientY: 0 }] });
      setTimeout(() => {
        fireEvent.touchEnd(element, { changedTouches: [{ clientX: 0, clientY: 0 }] });
      }, duration);
    },
  },

  // Mouse events
  mouse: {
    hover: async (element: HTMLElement) => {
      const user = userEvent.setup();
      await user.hover(element);
    },

    unhover: async (element: HTMLElement) => {
      const user = userEvent.setup();
      await user.unhover(element);
    },

    dragAndDrop: async (source: HTMLElement, target: HTMLElement) => {
      fireEvent.dragStart(source);
      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      fireEvent.drop(target);
      fireEvent.dragEnd(source);
    },
  },
};

// Scroll and navigation utilities
export const _scrolling = {
  // Scroll element into view
  scrollIntoView: (element: HTMLElement) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  // Scroll to top/bottom of container
  scrollToTop: (container: HTMLElement = document.documentElement) => {
    container.scrollTop = 0;
  },

  scrollToBottom: (container: HTMLElement = document.documentElement) => {
    container.scrollTop = container.scrollHeight;
  },

  // Scroll by specific amount
  scrollBy: (
    x: number,
    y: number,
    container: HTMLElement = document.documentElement
  ) => {
    container.scrollBy(x, y);
  },

  // Check if element is in viewport
  isInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Wait for element to be in viewport
  waitForInViewport: async (element: HTMLElement, timeout = 3000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();

      const checkViewport = () => {
        if (scrolling.isInViewport(element)) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element not in viewport after ${timeout}ms`));
        } else {
          requestAnimationFrame(checkViewport);
        }
      };

      checkViewport();
    });
  },
};

// Text and content utilities
export const _textContent = {
  // Get all text content including children
  getAllText: (element: HTMLElement): string => {
    return element.textContent || '';
  },

  // Get only direct text (excluding children)
  getDirectText: (element: HTMLElement): string => {
    return Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent)
      .join('');
  },

  // Search for text with fuzzy matching
  containsText: (element: HTMLElement, searchText: string, fuzzy = false): boolean => {
    const elementText = textContent.getAllText(element).toLowerCase();
    const search = searchText.toLowerCase();

    if (fuzzy) {
      // Simple fuzzy search - checks if all characters appear in order
      let searchIndex = 0;
      for (let i = 0; i < elementText.length && searchIndex < search.length; i++) {
        if (elementText[i] === search[searchIndex]) {
          searchIndex++;
        }
      }
      return searchIndex === search.length;
    }

    return elementText.includes(search);
  },

  // Count occurrences of text
  countTextOccurrences: (element: HTMLElement, searchText: string): number => {
    const text = textContent.getAllText(element);
    return (text.match(new RegExp(searchText, 'gi')) || []).length;
  },

  // Extract links from element
  getLinks: (element: HTMLElement): Array<{ text: string; href: string }> => {
    const links = Array.from(
      element.querySelectorAll('a[href]')
    ) as HTMLAnchorElement[];
    return links.map(link => ({
      text: link.textContent || '',
      href: link.href,
    }));
  },
};

// Helper functions
const getAvailableTestIds = (container?: HTMLElement): string[] => {
  const root = container || document.body;
  const elements = Array.from(root.querySelectorAll('[data-testid]'));
  return elements.map(el => el.getAttribute('data-testid')).filter(Boolean) as string[];
};

const getAvailableRoles = (container?: HTMLElement): string[] => {
  const root = container || document.body;
  const elements = Array.from(root.querySelectorAll('[role]'));
  return [...new Set(elements.map(el => el.getAttribute('role')).filter(Boolean))];
};

const getViewportCategory = (width: number): string => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'desktop';
  return 'large-desktop';
};

// Export utilities grouped by category
export const _domHelpers = {
  query: domQuery,
  viewport,
  styling,
  forms,
  events,
  scrolling,
  textContent,
};

// Export everything for convenience
export default domHelpers;
