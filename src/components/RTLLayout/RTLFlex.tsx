/**
 * RTL-aware Flex component that automatically handles direction-based flexbox layouts
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { useRTLFlex } from '../../hooks/useRTL';

interface RTLFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse' | 'row-rtl';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean | 'reverse';
  gap?: number | string;
  inline?: boolean;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

const justifyClasses = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignClasses = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const directionClasses = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

export const RTLFlex: React.FC<RTLFlexProps> = ({
  children,
  className,
  direction = 'row',
  justify = 'start',
  align = 'stretch',
  wrap = false,
  gap,
  inline = false,
  as: Component = 'div',
  style,
}) => {
  const { flex, isRTL } = useRTLFlex();

  // Handle RTL-aware row direction
  const getFlexDirection = () => {
    if (direction === 'row-rtl') {
      return isRTL ? 'flex-row-reverse' : 'flex-row';
    }

    if (direction === 'row' && isRTL) {
      return 'flex-row-reverse';
    }

    return directionClasses[direction as keyof typeof directionClasses] || 'flex-row';
  };

  // Handle RTL-aware justify content
  const getJustifyClass = () => {
    if (justify === 'start' || justify === 'end') {
      return justifyClasses[
        flex.justifyContent[justify] as keyof typeof justifyClasses
      ];
    }
    return justifyClasses[justify];
  };

  const flexClasses = cn(
    inline ? 'inline-flex' : 'flex',
    getFlexDirection(),
    getJustifyClass(),
    alignClasses[align],
    wrap === true && 'flex-wrap',
    wrap === 'reverse' && 'flex-wrap-reverse',
    className
  );

  const flexStyle = {
    ...(gap && { gap: typeof gap === 'number' ? `${gap}px` : gap }),
    ...style,
  };

  return (
    <Component
      className={flexClasses}
      style={flexStyle}
      data-rtl={isRTL}
      data-direction={direction}
    >
      {children}
    </Component>
  );
};
