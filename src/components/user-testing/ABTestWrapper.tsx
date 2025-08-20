import React, { useEffect, useState, ReactNode } from 'react';
import UserTestingService from '../../services/user-testing';

interface ABTestWrapperProps {
  testId: string;
  variants: {
    [variantId: string]: ReactNode;
  };
  defaultVariant?: string;
  trackingEvents?: {
    onView?: string;
    onClick?: string;
    onConversion?: string;
  };
  children?: ReactNode;
  className?: string;
}

interface ABTestContextType {
  variant: string | null;
  trackConversion: (metric: string, value?: number) => void;
  trackEvent: (event: string, metadata?: Record<string, any>) => void;
}

export const ABTestContext = React.createContext<ABTestContextType>({
  variant: null,
  trackConversion: () => {},
  trackEvent: () => {},
});

export function ABTestWrapper({
  testId,
  variants,
  defaultVariant = 'control',
  trackingEvents = {},
  children,
  className,
}: ABTestWrapperProps) {
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userTestingService = UserTestingService.getInstance();

  useEffect(() => {
    // Get variant assignment
    const assignedVariant = userTestingService.getVariant(testId);

    if (assignedVariant && variants[assignedVariant]) {
      setVariant(assignedVariant);
    } else if (variants[defaultVariant]) {
      setVariant(defaultVariant);
    } else {
      // Fallback to first available variant
      const firstVariant = Object.keys(variants)[0];
      setVariant(firstVariant || null);
    }

    setIsLoading(false);

    // Track view event
    if (trackingEvents.onView) {
      userTestingService.trackEvent({
        type: 'custom',
        metadata: {
          testId,
          variant: assignedVariant || defaultVariant,
          event: trackingEvents.onView,
          type: 'ab_test_view',
        },
      });
    }
  }, [testId, variants, defaultVariant, trackingEvents.onView]);

  const trackConversion = (metric: string, value: number = 1) => {
    if (variant) {
      userTestingService.trackABTestConversion(testId, metric, value);
    }
  };

  const trackEvent = (event: string, metadata: Record<string, any> = {}) => {
    if (variant) {
      userTestingService.trackEvent({
        type: 'custom',
        metadata: {
          testId,
          variant,
          event,
          ...metadata,
          type: 'ab_test_event',
        },
      });
    }
  };

  const handleClick = () => {
    if (trackingEvents.onClick) {
      trackEvent(trackingEvents.onClick);
    }
  };

  const contextValue: ABTestContextType = {
    variant,
    trackConversion,
    trackEvent,
  };

  // Show loading state or fallback
  if (isLoading || !variant) {
    return children || null;
  }

  // Render the selected variant
  const VariantComponent = variants[variant];

  return (
    <ABTestContext.Provider value={contextValue}>
      <div className={className} onClick={handleClick}>
        {VariantComponent || children}
      </div>
    </ABTestContext.Provider>
  );
}

// Hook to use A/B test context
export function useABTest() {
  const context = React.useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within an ABTestWrapper');
  }
  return context;
}

// Higher-order component for A/B testing
export function withABTest<P extends object>(
  Component: React.ComponentType<P>,
  testId: string,
  variantProps: { [variantId: string]: Partial<P> }
) {
  return function ABTestComponent(props: P) {
    const userTestingService = UserTestingService.getInstance();
    const variant = userTestingService.getVariant(testId);

    const enhancedProps =
      variant && variantProps[variant] ? { ...props, ...variantProps[variant] } : props;

    return <Component {...enhancedProps} />;
  };
}

// Component for simple A/B testing of props
interface ABTestPropsProps<T> {
  testId: string;
  variants: {
    [variantId: string]: T;
  };
  defaultVariant?: string;
  children: (props: T) => ReactNode;
}

export function ABTestProps<T>({
  testId,
  variants,
  defaultVariant = 'control',
  children,
}: ABTestPropsProps<T>) {
  const userTestingService = UserTestingService.getInstance();
  const variant = userTestingService.getVariant(testId) || defaultVariant;

  const variantProps =
    variants[variant] || variants[defaultVariant] || variants[Object.keys(variants)[0]];

  return <>{children(variantProps)}</>;
}

export default ABTestWrapper;
