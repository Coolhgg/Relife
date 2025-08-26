/**
 * Higher-Order Component for Input Sanitization
 * Wraps components to automatically sanitize their inputs
 */

import React, { forwardRef } from 'react';
import InputSanitizationService, {
  InputType,
  SanitizationOptions,
} from '../services/input-sanitization';

export interface SanitizationConfig {
  inputType?: InputType;
  options?: SanitizationOptions;
  fieldMapping?: Record<string, { type: InputType; options?: SanitizationOptions }>;
  sanitizeProps?: string[];
  onViolation?: (violations: string[], field?: string) => void;
}

/**
 * HOC that adds automatic input sanitization to any component
 */
export function withSanitization<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  config: SanitizationConfig = {}
) {
  const SanitizedComponent = forwardRef<any, P>((props, ref) => {
    const sanitizationService = InputSanitizationService.getInstance();
    const {
      inputType = 'text',
      options = {},
      fieldMapping = {},
      sanitizeProps = ['value', 'defaultValue', 'placeholder'],
      onViolation,
    } = config;

    // Create sanitized props
    const sanitizedProps = React.useMemo(() => {
      const newProps = { ...props };

      // Sanitize specified props
      sanitizeProps.forEach(propName => {
        if (newProps[propName] && typeof newProps[propName] === 'string') {
          const fieldConfig = fieldMapping[propName];
          const type = fieldConfig?.type || inputType;
          const opts = { ...options, ...fieldConfig?.options };

          const result = sanitizationService.sanitize(newProps[propName], type, opts);

          // Report violations if callback provided
          if (result.violations.length > 0 && onViolation) {
            onViolation(result.violations, propName);
          }

          newProps[propName] = result.sanitized;
        }
      });

      return newProps;
    }, [props, inputType, options, fieldMapping, sanitizeProps, onViolation]);

    return <WrappedComponent {...sanitizedProps} ref={ref} />;
  });

  SanitizedComponent.displayName = `withSanitization(${WrappedComponent.displayName || WrappedComponent.name})`;

  return SanitizedComponent;
}

/**
 * HOC specifically for form components that need comprehensive sanitization
 */
export function withFormSanitization<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  fieldTypes: Record<string, InputType> = {},
  globalOptions: SanitizationOptions = {}
) {
  const FormSanitizedComponent = forwardRef<
    any,
    P & {
      onSubmit?: (
        sanitizedData: any,
        originalData: any,
        violations: Record<string, string[]>
      ) => void;
      onFieldChange?: (
        field: string,
        sanitizedValue: string,
        originalValue: string,
        violations: string[]
      ) => void;
    }
  >((props, ref) => {
    const sanitizationService = InputSanitizationService.getInstance();
    const { onSubmit: originalOnSubmit, onFieldChange, ...otherProps } = props;

    // Track form state for sanitization
    const [formState, setFormState] = React.useState<Record<string, any>>({});
    const [violations, setViolations] = React.useState<Record<string, string[]>>({});

    // Sanitize form data on submit
    const handleSubmit = React.useCallback(
      (data: Record<string, any>) => {
        const sanitizedData: Record<string, any> = {};
        const allViolations: Record<string, string[]> = {};

        for (const [field, value] of Object.entries(data)) {
          const fieldType = fieldTypes[field] || 'text';
          const result = sanitizationService.sanitize(value, fieldType, globalOptions);

          sanitizedData[field] = result.sanitized;
          allViolations[field] = result.violations;
        }

        if (originalOnSubmit) {
          originalOnSubmit(sanitizedData, data, allViolations);
        }
      },
      [fieldTypes, globalOptions, originalOnSubmit]
    );

    // Enhanced props with sanitization
    const enhancedProps = React.useMemo(() => {
      return {
        ...otherProps,
        onSubmit: handleSubmit,
        formViolations: violations,
        sanitizedState: formState,
      };
    }, [otherProps, handleSubmit, violations, formState]);

    return <WrappedComponent {...enhancedProps} ref={ref} />;
  });

  FormSanitizedComponent.displayName = `withFormSanitization(${WrappedComponent.displayName || WrappedComponent.name})`;

  return FormSanitizedComponent;
}

/**
 * Hook for sanitizing component props
 */
export function useSanitizedProps<T extends Record<string, any>>(
  props: T,
  sanitizationRules: Record<keyof T, { type: InputType; options?: SanitizationOptions }>
): T & { violations: Record<keyof T, string[]> } {
  const sanitizationService = InputSanitizationService.getInstance();

  return React.useMemo(() => {
    const sanitizedProps = { ...props } as T;
    const violations: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;

    for (const [key, rule] of Object.entries(sanitizationRules)) {
      const typedKey = key as keyof T;
      if (props[typedKey] !== undefined && typeof props[typedKey] === 'string') {
        const result = sanitizationService.sanitize(
          props[typedKey],
          rule.type,
          rule.options
        );
        sanitizedProps[typedKey] = result.sanitized as T[keyof T];
        violations[typedKey] = result.violations;
      }
    }

    return { ...sanitizedProps, violations };
  }, [props, sanitizationRules]);
}

/**
 * Context for providing sanitization configuration throughout the component tree
 */
export interface SanitizationContextValue {
  globalConfig: SanitizationOptions;
  fieldTypes: Record<string, InputType>;
  enableLogging: boolean;
  onViolation?: (violations: string[], field?: string, component?: string) => void;
}

export const SanitizationContext = React.createContext<SanitizationContextValue>({
  globalConfig: {},
  fieldTypes: {},
  enableLogging: false,
});

/**
 * Provider component for sanitization configuration
 */
export const SanitizationProvider: React.FC<{
  children: React.ReactNode;
  config: SanitizationContextValue;
}> = ({ children, config }) => {
  return (
    <SanitizationContext.Provider value={config}>
      {children}
    </SanitizationContext.Provider>
  );
};

/**
 * Hook to access sanitization context
 */
export function useSanitizationContext(): SanitizationContextValue {
  return React.useContext(SanitizationContext);
}

/**
 * HOC that automatically applies context-based sanitization
 */
export function withContextSanitization<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string = 'Unknown'
) {
  const ContextSanitizedComponent = forwardRef<any, P>((props, ref) => {
    const context = useSanitizationContext();
    const sanitizationService = InputSanitizationService.getInstance();

    const sanitizedProps = React.useMemo(() => {
      const newProps = { ...props };
      const violations: string[] = [];

      // Sanitize string props based on context configuration
      Object.keys(props).forEach(key => {
        const value = props[key];
        if (typeof value === 'string' && value.length > 0) {
          const fieldType = context.fieldTypes[key] || 'text';
          const result = sanitizationService.sanitize(
            value,
            fieldType,
            context.globalConfig
          );

          if (result.wasModified) {
            newProps[key] = result.sanitized;
            violations.push(...result.violations);
          }
        }
      });

      // Report violations to context handler
      if (violations.length > 0 && context.onViolation) {
        context.onViolation(violations, undefined, componentName);
      }

      // Log violations if enabled
      if (context.enableLogging && violations.length > 0) {
        console.warn(`[Sanitization] ${componentName}:`, violations);
      }

      return newProps;
    }, [props, context, componentName]);

    return <WrappedComponent {...sanitizedProps} ref={ref} />;
  });

  ContextSanitizedComponent.displayName = `withContextSanitization(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ContextSanitizedComponent;
}

/**
 * Utility component for displaying sanitization status
 */
export const SanitizationStatus: React.FC<{
  violations: string[];
  showDetails?: boolean;
  className?: string;
}> = ({ violations, showDetails = false, className }) => {
  if (violations.length === 0) {
    return null;
  }

  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <span className="font-medium">
        {violations.length === 1
          ? '1 issue sanitized'
          : `${violations.length} issues sanitized`}
      </span>
      {showDetails && (
        <ul className="mt-1 space-y-1">
          {violations.map((violation, index) => (
            <li key={index} className="list-disc list-inside">
              {violation}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default {
  withSanitization,
  withFormSanitization,
  withContextSanitization,
  useSanitizedProps,
  SanitizationProvider,
  useSanitizationContext,
  SanitizationStatus,
};
