/**
 * RTL-aware Text component that handles direction-based text alignment and typography
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { useRTLText } from '../../hooks/useRTL';

interface RTLTextProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center' | 'justify';
  as?: keyof JSX.IntrinsicElements;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?:
    | 'thin'
    | 'light'
    | 'normal'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'extrabold'
    | 'black';
  color?: string;
  leading?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
  tracking?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
  truncate?: boolean | number;
  dir?: 'ltr' | 'rtl' | 'auto';
  style?: React.CSSProperties;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
};

const weightClasses = {
  thin: 'font-thin',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
};

const leadingClasses = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const trackingClasses = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
};

export const RTLText: React.FC<RTLTextProps> = ({
  children,
  className,
  align = 'start',
  as: Component = 'span',
  size = 'base',
  weight = 'normal',
  color,
  leading = 'normal',
  tracking = 'normal',
  truncate = false,
  dir = 'auto',
  style,
}) => {
  const { text, isRTL } = useRTLText();

  const textDir = dir === 'auto' ? text.direction : dir;

  // Get alignment class based on RTL direction
  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return text.alignClass('start');
      case 'end':
        return text.alignClass('end');
      case 'center':
        return 'text-center';
      case 'justify':
        return 'text-justify';
      default:
        return text.alignClass('start');
    }
  };

  // Handle truncation
  const getTruncateClass = () => {
    if (truncate === true) {
      return 'truncate';
    }
    if (typeof truncate === 'number') {
      return `line-clamp-${truncate}`;
    }
    return '';
  };

  const textClasses = cn(
    'rtl-text',
    sizeClasses[size],
    weightClasses[weight],
    leadingClasses[leading],
    trackingClasses[tracking],
    getAlignClass(),
    getTruncateClass(),
    color && `text-${color}`,
    className
  );

  const textStyle = {
    direction: textDir,
    unicodeBidi: isRTL ? 'embed' : 'normal',
    ...style,
  };

  return (
    <Component
      className={textClasses}
      style={textStyle}
      dir={textDir}
      data-rtl={isRTL}
      data-align={align}
    >
      {children}
    </Component>
  );
};
