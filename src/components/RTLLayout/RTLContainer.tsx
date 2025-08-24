/* global JSX */
/**
 * RTL-aware Container component that automatically handles direction-based styling
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { useRTL } from '../../hooks/useRTL';

interface RTLContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  padding?: boolean | 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
  dir?: 'ltr' | 'rtl' | 'auto';
  as?: keyof JSX.IntrinsicElements;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
  none: '',
};

const paddingClasses = {
  none: '',
  sm: 'px-2 py-2',
  md: 'px-4 py-4',
  lg: 'px-6 py-6',
  xl: 'px-8 py-8',
};

const RTLContainer: React.FC<RTLContainerProps> = ({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  center = true,
  dir = 'auto',
  as: Component = 'div',
}) => {
  const { direction, isRTL } = useRTL();

  const containerDir = dir === 'auto' ? direction : dir;
  const maxWidthClass = maxWidthClasses[maxWidth];
  const paddingClass =
    typeof padding === 'boolean'
      ? padding
        ? paddingClasses.md
        : paddingClasses.none
      : paddingClasses[padding];

  const containerClasses = cn(
    'rtl-container',
    maxWidthClass,
    paddingClass,
    center && 'mx-auto',
    className
  );

  return (
    <Component className={containerClasses} dir={containerDir} data-rtl={isRTL}>
      {children}
    </Component>
  );
};

export default RTLContainer;
