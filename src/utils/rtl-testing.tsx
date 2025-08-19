/**
 * RTL testing utilities for validating direction-aware components
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../config/i18n';
import { type SupportedLanguage } from '../config/i18n';

// Mock i18n instance for testing
export const createMockI18n = (language: SupportedLanguage = 'en') => {
  const mockI18n = {
    language,
    languages: [language],
    t: (key: string) => key,
    changeLanguage: jest.fn(),
    dir: () => ['ar', 'he', 'ur', 'fa', 'ku'].includes(language) ? 'rtl' : 'ltr',
    exists: jest.fn(() => true),
    getFixedT: jest.fn(),
    hasResourceBundle: jest.fn(() => true),
    loadNamespaces: jest.fn(),
    loadLanguages: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
  return mockI18n;
};

// Custom render function with RTL language support
interface RTLRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  language?: SupportedLanguage;
  initialI18nStore?: any;
  i18nOptions?: any;
}

export const renderWithRTL = (
  ui: ReactElement,
  options: RTLRenderOptions = {}
) => {
  const { language = 'en', ...renderOptions } = options;

  // Create wrapper with i18n provider
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const mockI18n = createMockI18n(language);

    return (
      <I18nextProvider i18n={mockI18n as any}>
        <div dir={['ar', 'he', 'ur', 'fa', 'ku'].includes(language) ? 'rtl' : 'ltr'}>
          {children}
        </div>
      </I18nextProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// RTL test helpers
export const rtlTestHelpers = {
  /**
   * Get all RTL languages supported by the app
   */
  getRTLLanguages: (): SupportedLanguage[] => ['ar', 'he', 'ur', 'fa', 'ku'],

  /**
   * Get all LTR languages supported by the app
   */
  getLTRLanguages: (): SupportedLanguage[] => ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi', 'bn', 'vi', 'th', 'id'],

  /**
   * Check if element has correct direction attribute
   */
  expectCorrectDirection: (element: HTMLElement, expectedDirection: 'ltr' | 'rtl') => {
    expect(element).toHaveAttribute('dir', expectedDirection);
  },

  /**
   * Check if element has RTL data attribute
   */
  expectRTLDataAttribute: (element: HTMLElement, isRTL: boolean) => {
    expect(element).toHaveAttribute('data-rtl', isRTL.toString());
  },

  /**
   * Check RTL-aware text alignment
   */
  expectRTLTextAlignment: (element: HTMLElement, isRTL: boolean, alignment: 'start' | 'end' | 'center' = 'start') => {
    if (alignment === 'center') {
      expect(element).toHaveClass('text-center');
      return;
    }

    const expectedClass = alignment === 'start'
      ? (isRTL ? 'text-right' : 'text-left')
      : (isRTL ? 'text-left' : 'text-right');

    expect(element).toHaveClass(expectedClass);
  },

  /**
   * Check RTL-aware flex direction
   */
  expectRTLFlexDirection: (element: HTMLElement, isRTL: boolean, reverse?: boolean) => {
    if (reverse) {
      expect(element).toHaveClass(isRTL ? 'flex-row' : 'flex-row-reverse');
    } else {
      expect(element).toHaveClass(isRTL ? 'flex-row-reverse' : 'flex-row');
    }
  },

  /**
   * Check RTL-aware positioning
   */
  expectRTLPositioning: (element: HTMLElement, isRTL: boolean, side: 'start' | 'end', position: string) => {
    const expectedProperty = side === 'start'
      ? (isRTL ? 'right' : 'left')
      : (isRTL ? 'left' : 'right');

    const styles = window.getComputedStyle(element);
    expect(styles.getPropertyValue(expectedProperty)).toBe(position);
  },

  /**
   * Check RTL-aware margin/padding
   */
  expectRTLSpacing: (element: HTMLElement, isRTL: boolean, type: 'margin' | 'padding', side: 'start' | 'end', expectedValue: string) => {
    const property = side === 'start'
      ? `${type}-${isRTL ? 'right' : 'left'}`
      : `${type}-${isRTL ? 'left' : 'right'}`;

    const styles = window.getComputedStyle(element);
    expect(styles.getPropertyValue(property)).toBe(expectedValue);
  },
};

// Test scenarios for RTL components
export const rtlTestScenarios = {
  /**
   * Test component in both LTR and RTL modes
   */
  testBothDirections: (
    componentFactory: () => ReactElement,
    testFn: (element: HTMLElement, isRTL: boolean, language: SupportedLanguage) => void
  ) => {
    describe('RTL Support', () => {
      test('renders correctly in LTR mode', () => {
        const { container } = renderWithRTL(componentFactory(), { language: 'en' });
        const element = container.firstChild as HTMLElement;
        testFn(element, false, 'en');
      });

      test('renders correctly in RTL mode', () => {
        const { container } = renderWithRTL(componentFactory(), { language: 'ar' });
        const element = container.firstChild as HTMLElement;
        testFn(element, true, 'ar');
      });
    });
  },

  /**
   * Test component with all RTL languages
   */
  testAllRTLLanguages: (
    componentFactory: () => ReactElement,
    testFn: (element: HTMLElement, language: SupportedLanguage) => void
  ) => {
    describe('All RTL Languages', () => {
      rtlTestHelpers.getRTLLanguages().forEach(language => {
        test(`renders correctly in ${language}`, () => {
          const { container } = renderWithRTL(componentFactory(), { language });
          const element = container.firstChild as HTMLElement;
          testFn(element, language);
        });
      });
    });
  },

  /**
   * Test responsive RTL behavior
   */
  testResponsiveRTL: (
    componentFactory: () => ReactElement,
    breakpoints: string[],
    testFn: (element: HTMLElement, isRTL: boolean, breakpoint: string) => void
  ) => {
    describe('Responsive RTL', () => {
      breakpoints.forEach(breakpoint => {
        test(`adapts to ${breakpoint} screen in RTL`, () => {
          // Mock window.matchMedia for breakpoint testing
          Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
              matches: query.includes(breakpoint),
              media: query,
              onchange: null,
              addListener: jest.fn(),
              removeListener: jest.fn(),
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              dispatchEvent: jest.fn(),
            })),
          });

          const { container } = renderWithRTL(componentFactory(), { language: 'ar' });
          const element = container.firstChild as HTMLElement;
          testFn(element, true, breakpoint);
        });
      });
    });
  },
};

// Accessibility testing for RTL
export const rtlA11yHelpers = {
  /**
   * Check if text direction is properly announced to screen readers
   */
  expectScreenReaderDirection: (element: HTMLElement, isRTL: boolean) => {
    expect(element).toHaveAttribute('dir', isRTL ? 'rtl' : 'ltr');
    // Check lang attribute is set for proper screen reader pronunciation
    expect(element.closest('[lang]')).toBeTruthy();
  },

  /**
   * Check if interactive elements maintain proper tab order in RTL
   */
  expectRTLTabOrder: (elements: HTMLElement[], isRTL: boolean) => {
    elements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex !== null) {
        expect(parseInt(tabIndex, 10)).toBe(isRTL ? elements.length - index - 1 : index);
      }
    });
  },

  /**
   * Check if ARIA labels are properly positioned for RTL
   */
  expectRTLAriaLabels: (element: HTMLElement, isRTL: boolean) => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');

    if (ariaLabel || ariaLabelledBy) {
      // Ensure the element or its parent has proper direction
      const dirElement = element.closest('[dir]') || element;
      expect(dirElement).toHaveAttribute('dir', isRTL ? 'rtl' : 'ltr');
    }
  },
};

// Performance testing for RTL
export const rtlPerformanceHelpers = {
  /**
   * Measure rendering performance between LTR and RTL modes
   */
  measureRTLPerformance: async (
    componentFactory: () => ReactElement,
    iterations: number = 100
  ) => {
    const ltrTimes: number[] = [];
    const rtlTimes: number[] = [];

    // Measure LTR rendering
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const { unmount } = renderWithRTL(componentFactory(), { language: 'en' });
      const end = performance.now();
      ltrTimes.push(end - start);
      unmount();
    }

    // Measure RTL rendering
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const { unmount } = renderWithRTL(componentFactory(), { language: 'ar' });
      const end = performance.now();
      rtlTimes.push(end - start);
      unmount();
    }

    const ltrAverage = ltrTimes.reduce((a, b) => a + b) / ltrTimes.length;
    const rtlAverage = rtlTimes.reduce((a, b) => a + b) / rtlTimes.length;

    return {
      ltr: { average: ltrAverage, times: ltrTimes },
      rtl: { average: rtlAverage, times: rtlTimes },
      difference: rtlAverage - ltrAverage,
      percentageDifference: ((rtlAverage - ltrAverage) / ltrAverage) * 100,
    };
  },
};

export default {
  renderWithRTL,
  rtlTestHelpers,
  rtlTestScenarios,
  rtlA11yHelpers,
  rtlPerformanceHelpers,
  createMockI18n,
};