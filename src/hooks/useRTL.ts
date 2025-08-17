/**
 * React hooks for RTL-aware functionality and styling
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type SupportedLanguage } from '../config/i18n';
import { 
  isRTL, 
  getTextDirection, 
  getFlexDirection, 
  getTextAlign,
  rtlClassNames,
  combineRTLClasses 
} from '../utils/rtl-utilities';

/**
 * Main RTL hook that provides all RTL-related functionality
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;
  
  // Core RTL state
  const isCurrentRTL = useMemo(() => isRTL(currentLanguage), [currentLanguage]);
  const direction = useMemo(() => getTextDirection(currentLanguage), [currentLanguage]);
  
  // Direction-aware utilities
  const getDirection = useCallback((language?: SupportedLanguage) => {
    return getTextDirection(language || currentLanguage);
  }, [currentLanguage]);
  
  const getFlexDir = useCallback((reverse?: boolean) => {
    return getFlexDirection(currentLanguage, reverse);
  }, [currentLanguage]);
  
  const getAlign = useCallback((alignment: 'start' | 'end' | 'center' = 'start') => {
    return getTextAlign(currentLanguage, alignment);
  }, [currentLanguage]);
  
  // Class name utilities
  const textAlignClass = useCallback((alignment: 'start' | 'end' | 'center' = 'start') => {
    return rtlClassNames.textAlign[alignment];
  }, []);
  
  const flexDirectionClass = useCallback((reverse?: boolean) => {
    return reverse ? rtlClassNames.flexDirection.rowReverse : rtlClassNames.flexDirection.row;
  }, []);
  
  const floatClass = useCallback((side: 'start' | 'end') => {
    return rtlClassNames.float[side];
  }, []);
  
  // CSS-in-JS style utilities
  const getMarginStyle = useCallback((side: 'start' | 'end', size: string | number) => {
    const property = side === 'start' 
      ? (isCurrentRTL ? 'marginRight' : 'marginLeft')
      : (isCurrentRTL ? 'marginLeft' : 'marginRight');
    return { [property]: size };
  }, [isCurrentRTL]);
  
  const getPaddingStyle = useCallback((side: 'start' | 'end', size: string | number) => {
    const property = side === 'start' 
      ? (isCurrentRTL ? 'paddingRight' : 'paddingLeft')
      : (isCurrentRTL ? 'paddingLeft' : 'paddingRight');
    return { [property]: size };
  }, [isCurrentRTL]);
  
  const getPositionStyle = useCallback((side: 'start' | 'end', offset: string | number) => {
    const property = side === 'start' 
      ? (isCurrentRTL ? 'right' : 'left')
      : (isCurrentRTL ? 'left' : 'right');
    const resetProperty = side === 'start'
      ? (isCurrentRTL ? 'left' : 'right')
      : (isCurrentRTL ? 'right' : 'left');
    
    return { [property]: offset, [resetProperty]: 'auto' };
  }, [isCurrentRTL]);
  
  // Transform utilities
  const getTransformStyle = useCallback((baseTransform?: string) => {
    const scaleX = isCurrentRTL ? 'scaleX(-1)' : '';
    
    if (baseTransform && scaleX) {
      return { transform: `${baseTransform} ${scaleX}` };
    }
    
    return { transform: baseTransform || scaleX || 'none' };
  }, [isCurrentRTL]);
  
  return {
    // Core state
    isRTL: isCurrentRTL,
    direction,
    language: currentLanguage,
    
    // Direction utilities
    getDirection,
    getFlexDirection: getFlexDir,
    getTextAlign: getAlign,
    
    // Class name utilities
    textAlignClass,
    flexDirectionClass,
    floatClass,
    combineClasses: combineRTLClasses,
    
    // CSS-in-JS utilities
    getMarginStyle,
    getPaddingStyle,
    getPositionStyle,
    getTransformStyle,
  };
};

/**
 * Hook for RTL-aware spacing (margins and padding)
 */
export const useRTLSpacing = () => {
  const { isRTL, getMarginStyle, getPaddingStyle } = useRTL();
  
  const margin = useMemo(() => ({
    start: (size: string | number) => getMarginStyle('start', size),
    end: (size: string | number) => getMarginStyle('end', size),
    x: (size: string | number) => ({
      marginLeft: size,
      marginRight: size,
    }),
    y: (size: string | number) => ({
      marginTop: size,
      marginBottom: size,
    }),
  }), [getMarginStyle]);
  
  const padding = useMemo(() => ({
    start: (size: string | number) => getPaddingStyle('start', size),
    end: (size: string | number) => getPaddingStyle('end', size),
    x: (size: string | number) => ({
      paddingLeft: size,
      paddingRight: size,
    }),
    y: (size: string | number) => ({
      paddingTop: size,
      paddingBottom: size,
    }),
  }), [getPaddingStyle]);
  
  return { margin, padding, isRTL };
};

/**
 * Hook for RTL-aware positioning
 */
export const useRTLPosition = () => {
  const { isRTL, getPositionStyle } = useRTL();
  
  const position = useMemo(() => ({
    start: (offset: string | number) => getPositionStyle('start', offset),
    end: (offset: string | number) => getPositionStyle('end', offset),
    insetStart: (offset: string | number) => ({
      [isRTL ? 'right' : 'left']: offset,
    }),
    insetEnd: (offset: string | number) => ({
      [isRTL ? 'left' : 'right']: offset,
    }),
  }), [getPositionStyle, isRTL]);
  
  return { position, isRTL };
};

/**
 * Hook for RTL-aware flex layouts
 */
export const useRTLFlex = () => {
  const { isRTL, getFlexDirection, flexDirectionClass } = useRTL();
  
  const flex = useMemo(() => ({
    direction: getFlexDirection,
    directionClass: flexDirectionClass,
    justifyContent: {
      start: isRTL ? 'flex-end' : 'flex-start',
      end: isRTL ? 'flex-start' : 'flex-end',
      center: 'center',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    },
    alignItems: {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      stretch: 'stretch',
      baseline: 'baseline',
    },
  }), [getFlexDirection, flexDirectionClass, isRTL]);
  
  return { flex, isRTL };
};

/**
 * Hook for RTL-aware text alignment and typography
 */
export const useRTLText = () => {
  const { isRTL, getTextAlign, textAlignClass } = useRTL();
  
  const text = useMemo(() => ({
    align: getTextAlign,
    alignClass: textAlignClass,
    direction: isRTL ? 'rtl' : 'ltr',
    writingMode: isRTL ? 'horizontal-tb' : 'horizontal-tb',
  }), [getTextAlign, textAlignClass, isRTL]);
  
  return { text, isRTL };
};

/**
 * Hook for RTL-aware animations and transitions
 */
export const useRTLAnimation = () => {
  const { isRTL, getTransformStyle } = useRTL();
  
  const animation = useMemo(() => ({
    slideIn: {
      from: isRTL ? 'translateX(100%)' : 'translateX(-100%)',
      to: 'translateX(0)',
    },
    slideOut: {
      from: 'translateX(0)',
      to: isRTL ? 'translateX(100%)' : 'translateX(-100%)',
    },
    slideInOpposite: {
      from: isRTL ? 'translateX(-100%)' : 'translateX(100%)',
      to: 'translateX(0)',
    },
    slideOutOpposite: {
      from: 'translateX(0)',
      to: isRTL ? 'translateX(-100%)' : 'translateX(100%)',
    },
  }), [isRTL]);
  
  const getTransform = useCallback((baseTransform?: string) => {
    return getTransformStyle(baseTransform);
  }, [getTransformStyle]);
  
  return { animation, getTransform, isRTL };
};

/**
 * Hook for managing RTL-aware form layouts
 */
export const useRTLForm = () => {
  const { isRTL } = useRTL();
  const { margin, padding } = useRTLSpacing();
  const { text } = useRTLText();
  
  const form = useMemo(() => ({
    labelPosition: isRTL ? 'right' : 'left',
    inputDirection: isRTL ? 'rtl' : 'ltr',
    fieldSpacing: margin.end('0.5rem'),
    buttonAlignment: text.alignClass('end'),
    errorAlignment: text.alignClass('start'),
  }), [isRTL, margin, text]);
  
  return { form, isRTL };
};