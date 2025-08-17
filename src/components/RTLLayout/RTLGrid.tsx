/**
 * RTL-aware Grid component that automatically handles direction-based grid layouts
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { useRTL } from '../../hooks/useRTL';

interface RTLGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number; '2xl'?: number };
  rows?: number | 'auto';
  gap?: number | string | { x?: number | string; y?: number | string };
  autoFlow?: 'row' | 'col' | 'row-dense' | 'col-dense' | 'rtl-row' | 'rtl-col';
  justify?: 'start' | 'end' | 'center' | 'stretch';
  align?: 'start' | 'end' | 'center' | 'stretch';
  placeItems?: 'start' | 'end' | 'center' | 'stretch';
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

const colsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

const responsiveColsClasses = {
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    7: 'sm:grid-cols-7',
    8: 'sm:grid-cols-8',
    9: 'sm:grid-cols-9',
    10: 'sm:grid-cols-10',
    11: 'sm:grid-cols-11',
    12: 'sm:grid-cols-12',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    7: 'md:grid-cols-7',
    8: 'md:grid-cols-8',
    9: 'md:grid-cols-9',
    10: 'md:grid-cols-10',
    11: 'md:grid-cols-11',
    12: 'md:grid-cols-12',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
    8: 'lg:grid-cols-8',
    9: 'lg:grid-cols-9',
    10: 'lg:grid-cols-10',
    11: 'lg:grid-cols-11',
    12: 'lg:grid-cols-12',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
    7: 'xl:grid-cols-7',
    8: 'xl:grid-cols-8',
    9: 'xl:grid-cols-9',
    10: 'xl:grid-cols-10',
    11: 'xl:grid-cols-11',
    12: 'xl:grid-cols-12',
  },
  '2xl': {
    1: '2xl:grid-cols-1',
    2: '2xl:grid-cols-2',
    3: '2xl:grid-cols-3',
    4: '2xl:grid-cols-4',
    5: '2xl:grid-cols-5',
    6: '2xl:grid-cols-6',
    7: '2xl:grid-cols-7',
    8: '2xl:grid-cols-8',
    9: '2xl:grid-cols-9',
    10: '2xl:grid-cols-10',
    11: '2xl:grid-cols-11',
    12: '2xl:grid-cols-12',
  },
};

const autoFlowClasses = {
  row: 'grid-flow-row',
  col: 'grid-flow-col',
  'row-dense': 'grid-flow-row-dense',
  'col-dense': 'grid-flow-col-dense',
};

const justifyClasses = {
  start: 'justify-items-start',
  end: 'justify-items-end',
  center: 'justify-items-center',
  stretch: 'justify-items-stretch',
};

const alignClasses = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch',
};

const placeItemsClasses = {
  start: 'place-items-start',
  end: 'place-items-end',
  center: 'place-items-center',
  stretch: 'place-items-stretch',
};

export const RTLGrid: React.FC<RTLGridProps> = ({
  children,
  className,
  cols = 1,
  rows,
  gap,
  autoFlow = 'row',
  justify,
  align,
  placeItems,
  as: Component = 'div',
  style,
}) => {
  const { isRTL } = useRTL();
  
  // Generate column classes
  const getColsClasses = () => {
    if (typeof cols === 'number') {
      return colsClasses[cols as keyof typeof colsClasses] || 'grid-cols-1';
    }
    
    const classes = [];
    
    // Default mobile-first class
    if (cols.sm) {
      classes.push(colsClasses[cols.sm as keyof typeof colsClasses]);
    }
    
    // Responsive classes
    Object.entries(cols).forEach(([breakpoint, value]) => {
      if (breakpoint !== 'sm' && value && responsiveColsClasses[breakpoint as keyof typeof responsiveColsClasses]) {
        classes.push(responsiveColsClasses[breakpoint as keyof typeof responsiveColsClasses][value as keyof typeof responsiveColsClasses.sm]);
      }
    });
    
    return classes.join(' ');
  };
  
  // Handle RTL-aware auto flow
  const getAutoFlowClass = () => {
    if (autoFlow === 'rtl-row') {
      return isRTL ? 'grid-flow-row-dense' : 'grid-flow-row';
    }
    
    if (autoFlow === 'rtl-col') {
      return isRTL ? 'grid-flow-col-dense' : 'grid-flow-col';
    }
    
    return autoFlowClasses[autoFlow as keyof typeof autoFlowClasses] || 'grid-flow-row';
  };
  
  const gridClasses = cn(
    'grid',
    getColsClasses(),
    rows && typeof rows === 'number' && `grid-rows-${rows}`,
    rows === 'auto' && 'grid-rows-auto',
    getAutoFlowClass(),
    justify && justifyClasses[justify],
    align && alignClasses[align],
    placeItems && placeItemsClasses[placeItems],
    className
  );
  
  const gridStyle = {
    ...(gap && typeof gap === 'object' ? {
      columnGap: typeof gap.x === 'number' ? `${gap.x}px` : gap.x,
      rowGap: typeof gap.y === 'number' ? `${gap.y}px` : gap.y,
    } : gap && {
      gap: typeof gap === 'number' ? `${gap}px` : gap,
    }),
    ...style,
  };
  
  return (
    <Component 
      className={gridClasses}
      style={gridStyle}
      data-rtl={isRTL}
      data-auto-flow={autoFlow}
    >
      {children}
    </Component>
  );
};