/**
 * RTL-aware utility functions and classes for consistent direction-based styling
 */

import { type SupportedLanguage } from '../config/i18n';

/**
 * Determines if a language is RTL
 */
export const isRTL = (language: SupportedLanguage): boolean => {
  const rtlLanguages: SupportedLanguage[] = ['ar', 'he', 'ur', 'fa', 'ku'];
  return rtlLanguages.includes(language);
};

/**
 * Gets the text direction for a language
 */
export const getTextDirection = (language: SupportedLanguage): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

/**
 * Gets direction-aware flex direction
 */
export const getFlexDirection = (
  language: SupportedLanguage,
  reverse?: boolean
): 'row' | 'row-reverse' => {
  const isLanguageRTL = isRTL(language);

  if (reverse) {
    return isLanguageRTL ? 'row' : 'row-reverse';
  }

  return isLanguageRTL ? 'row-reverse' : 'row';
};

/**
 * Gets direction-aware text alignment
 */
export const getTextAlign = (
  language: SupportedLanguage,
  alignment: 'start' | 'end' | 'center' = 'start'
): 'left' | 'right' | 'center' => {
  if (alignment === 'center') return 'center';

  const isLanguageRTL = isRTL(language);

  if (alignment === 'start') {
    return isLanguageRTL ? 'right' : 'left';
  } else {
    return isLanguageRTL ? 'left' : 'right';
  }
};

/**
 * RTL-aware CSS class generator
 */
export const rtlClass = {
  /**
   * Direction-aware margin utilities
   */
  margin: {
    start: (size: string
) => ({
      '[dir="ltr"] &': { marginLeft: size },
      '[dir="rtl"] &': { marginRight: size },
    }),
    end: (size: string
) => ({
      '[dir="ltr"] &': { marginRight: size },
      '[dir="rtl"] &': { marginLeft: size },
    }),
  },

  /**
   * Direction-aware padding utilities
   */
  padding: {
    start: (size: string
) => ({
      '[dir="ltr"] &': { paddingLeft: size },
      '[dir="rtl"] &': { paddingRight: size },
    }),
    end: (size: string
) => ({
      '[dir="ltr"] &': { paddingRight: size },
      '[dir="rtl"] &': { paddingLeft: size },
    }),
  },

  /**
   * Direction-aware positioning
   */
  position: {
    start: (offset: string
) => ({
      '[dir="ltr"] &': { left: offset, right: 'auto' },
      '[dir="rtl"] &': { right: offset, left: 'auto' },
    }),
    end: (offset: string
) => ({
      '[dir="ltr"] &': { right: offset, left: 'auto' },
      '[dir="rtl"] &': { left: offset, right: 'auto' },
    }),
  },

  /**
   * Direction-aware border utilities
   */
  border: {
    start: (width: string, color: string
) => ({
      '[dir="ltr"] &': { borderLeft: `${width} solid ${color}` },
      '[dir="rtl"] &': { borderRight: `${width} solid ${color}` },
    }),
    end: (width: string, color: string
) => ({
      '[dir="ltr"] &': { borderRight: `${width} solid ${color}` },
      '[dir="rtl"] &': { borderLeft: `${width} solid ${color}` },
    }),
  },

  /**
   * Direction-aware border radius
   */
  borderRadius: {
    start: (radius: string
) => ({
      '[dir="ltr"] &': {
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
      },
      '[dir="rtl"] &': {
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
      },
    }),
    end: (radius: string
) => ({
      '[dir="ltr"] &': {
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
      },
      '[dir="rtl"] &': {
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
      },
    }),
  },
};

/**
 * CSS logical properties for better RTL support
 */
export const logicalProperties = {
  marginInlineStart: 'margin-inline-start',
  marginInlineEnd: 'margin-inline-end',
  paddingInlineStart: 'padding-inline-start',
  paddingInlineEnd: 'padding-inline-end',
  borderInlineStart: 'border-inline-start',
  borderInlineEnd: 'border-inline-end',
  insetInlineStart: 'inset-inline-start',
  insetInlineEnd: 'inset-inline-end',
};

/**
 * Direction-aware transform utilities
 */
export const getTransform = (
  language: SupportedLanguage,
  baseTransform?: string
): string => {
  const isLanguageRTL = isRTL(language);
  const scaleX = isLanguageRTL ? 'scaleX(-1)' : '';

  if (baseTransform && scaleX) {
    return `${baseTransform} ${scaleX}`;
  }

  return baseTransform || scaleX || '';
};

/**
 * RTL-aware class names for common patterns
 */
export const rtlClassNames = {
  textAlign: {
    start: 'ltr:text-left rtl:text-right',
    end: 'ltr:text-right rtl:text-left',
    center: 'text-center',
  },
  flexDirection: {
    row: 'ltr:flex-row rtl:flex-row-reverse',
    rowReverse: 'ltr:flex-row-reverse rtl:flex-row',
  },
  float: {
    start: 'ltr:float-left rtl:float-right',
    end: 'ltr:float-right rtl:float-left',
  },
  clear: {
    start: 'ltr:clear-left rtl:clear-right',
    end: 'ltr:clear-right rtl:clear-left',
  },
};

/**
 * Helper to combine RTL-aware classes
 */
export const combineRTLClasses = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate responsive RTL utilities
 */
export const generateRTLUtilities = (theme: any
) => {
  const spacing = theme('spacing');
  const utilities: Record<string, any> = {};

  // Generate margin utilities
  Object.entries(spacing).forEach(([key, value]
) => {
    utilities[`.ms-${key}`] = {
      '[dir="ltr"] &': { marginLeft: value },
      '[dir="rtl"] &': { marginRight: value },
    };
    utilities[`.me-${key}`] = {
      '[dir="ltr"] &': { marginRight: value },
      '[dir="rtl"] &': { marginLeft: value },
    };
  });

  // Generate padding utilities
  Object.entries(spacing).forEach(([key, value]
) => {
    utilities[`.ps-${key}`] = {
      '[dir="ltr"] &': { paddingLeft: value },
      '[dir="rtl"] &': { paddingRight: value },
    };
    utilities[`.pe-${key}`] = {
      '[dir="ltr"] &': { paddingRight: value },
      '[dir="rtl"] &': { paddingLeft: value },
    };
  });

  return utilities;
};
