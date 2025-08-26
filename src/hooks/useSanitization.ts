/**
 * React Hooks for Input Sanitization
 * Provides easy-to-use hooks for sanitizing user inputs in React components
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import InputSanitizationService, {
  SanitizationOptions,
  SanitizationResult,
  InputType,
} from '../services/input-sanitization';

export interface UseSanitizedInputOptions extends SanitizationOptions {
  type?: InputType;
  validateOnChange?: boolean;
  showViolations?: boolean;
  onViolation?: (violations: string[]) => void;
  debounceMs?: number;
}

export interface SanitizedInputState {
  value: string;
  sanitizedValue: string;
  isValid: boolean;
  violations: string[];
  wasModified: boolean;
  isValidating: boolean;
}

/**
 * Hook for sanitizing a single input field
 */
export function useSanitizedInput(
  initialValue: string = '',
  options: UseSanitizedInputOptions = {}
): {
  state: SanitizedInputState;
  setValue: (value: string) => void;
  validate: () => SanitizationResult;
  reset: () => void;
  bindToInput: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };
} {
  const sanitizationService = InputSanitizationService.getInstance();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const {
    type = 'text',
    validateOnChange = true,
    showViolations = false,
    onViolation,
    debounceMs = 0,
    ...sanitizationOptions
  } = options;

  // Initialize state with sanitized initial value
  const initialSanitizedResult = useMemo(
    () => sanitizationService.sanitize(initialValue, type, sanitizationOptions),
    [initialValue, type, sanitizationOptions]
  );

  const [state, setState] = useState<SanitizedInputState>({
    value: initialValue,
    sanitizedValue: initialSanitizedResult.sanitized,
    isValid: initialSanitizedResult.isValid,
    violations: initialSanitizedResult.violations,
    wasModified: initialSanitizedResult.wasModified,
    isValidating: false,
  });

  // Debounced sanitization function
  const debouncedSanitize = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState(prev => ({ ...prev, isValidating: true }));

      const sanitize = () => {
        const result = sanitizationService.sanitize(value, type, sanitizationOptions);

        setState({
          value,
          sanitizedValue: result.sanitized,
          isValid: result.isValid,
          violations: result.violations,
          wasModified: result.wasModified,
          isValidating: false,
        });

        // Call violation callback if there are violations
        if (result.violations.length > 0 && onViolation) {
          onViolation(result.violations);
        }
      };

      if (debounceMs > 0) {
        timeoutRef.current = setTimeout(sanitize, debounceMs);
      } else {
        sanitize();
      }
    },
    [type, sanitizationOptions, onViolation, debounceMs]
  );

  // Set value function
  const setValue = useCallback(
    (value: string) => {
      if (validateOnChange) {
        debouncedSanitize(value);
      } else {
        setState(prev => ({ ...prev, value, isValidating: false }));
      }
    },
    [validateOnChange, debouncedSanitize]
  );

  // Validate function (immediate, no debounce)
  const validate = useCallback(() => {
    const result = sanitizationService.sanitize(state.value, type, sanitizationOptions);

    setState(prev => ({
      ...prev,
      sanitizedValue: result.sanitized,
      isValid: result.isValid,
      violations: result.violations,
      wasModified: result.wasModified,
      isValidating: false,
    }));

    return result;
  }, [state.value, type, sanitizationOptions]);

  // Reset function
  const reset = useCallback(() => {
    const result = sanitizationService.sanitize(
      initialValue,
      type,
      sanitizationOptions
    );
    setState({
      value: initialValue,
      sanitizedValue: result.sanitized,
      isValid: result.isValid,
      violations: result.violations,
      wasModified: result.wasModified,
      isValidating: false,
    });
  }, [initialValue, type, sanitizationOptions]);

  // Bind to input helpers
  const bindToInput = useMemo(
    () => ({
      value: state.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(e.target.value);
      },
    }),
    [state.value, setValue]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    setValue,
    validate,
    reset,
    bindToInput,
  };
}

/**
 * Hook for sanitizing multiple form fields
 */
export function useSanitizedForm<T extends Record<string, any>>(
  initialValues: T,
  fieldTypes: Record<keyof T, InputType> = {} as Record<keyof T, InputType>,
  fieldOptions: Record<keyof T, SanitizationOptions> = {} as Record<
    keyof T,
    SanitizationOptions
  >
): {
  values: T;
  sanitizedValues: T;
  violations: Record<keyof T, string[]>;
  isValid: boolean;
  hasViolations: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  validate: () => Record<keyof T, SanitizationResult>;
  reset: () => void;
  getSanitizedData: () => T;
} {
  const sanitizationService = InputSanitizationService.getInstance();

  const [values, setValues] = useState<T>(initialValues);
  const [sanitizedValues, setSanitizedValues] = useState<T>(() => {
    const sanitized = {} as T;
    for (const [key, value] of Object.entries(initialValues)) {
      const type = fieldTypes[key as keyof T] || 'text';
      const options = fieldOptions[key as keyof T] || {};
      const result = sanitizationService.sanitize(value, type, options);
      sanitized[key as keyof T] = result.sanitized as T[keyof T];
    }
    return sanitized;
  });

  const [violations, setViolations] = useState<Record<keyof T, string[]>>(
    {} as Record<keyof T, string[]>
  );

  // Sanitize and update a single field
  const sanitizeField = useCallback(
    (field: keyof T, value: any) => {
      const type = fieldTypes[field] || 'text';
      const options = fieldOptions[field] || {};
      const result = sanitizationService.sanitize(value, type, options);

      setSanitizedValues(prev => ({
        ...prev,
        [field]: result.sanitized,
      }));

      setViolations(prev => ({
        ...prev,
        [field]: result.violations,
      }));

      return result;
    },
    [fieldTypes, fieldOptions]
  );

  // Set value for a specific field
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));
      sanitizeField(field, value);
    },
    [sanitizeField]
  );

  // Set multiple values at once
  const setValuesCallback = useCallback(
    (newValues: Partial<T>) => {
      setValues(prev => ({ ...prev, ...newValues }));

      // Sanitize all updated fields
      for (const [key, value] of Object.entries(newValues)) {
        sanitizeField(key as keyof T, value);
      }
    },
    [sanitizeField]
  );

  // Validate all fields
  const validate = useCallback(() => {
    const results: Record<keyof T, SanitizationResult> = {} as Record<
      keyof T,
      SanitizationResult
    >;
    const newSanitizedValues = {} as T;
    const newViolations = {} as Record<keyof T, string[]>;

    for (const [key, value] of Object.entries(values)) {
      const type = fieldTypes[key as keyof T] || 'text';
      const options = fieldOptions[key as keyof T] || {};
      const result = sanitizationService.sanitize(value, type, options);

      results[key as keyof T] = result;
      newSanitizedValues[key as keyof T] = result.sanitized as T[keyof T];
      newViolations[key as keyof T] = result.violations;
    }

    setSanitizedValues(newSanitizedValues);
    setViolations(newViolations);

    return results;
  }, [values, fieldTypes, fieldOptions]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);

    const newSanitizedValues = {} as T;
    const newViolations = {} as Record<keyof T, string[]>;

    for (const [key, value] of Object.entries(initialValues)) {
      const type = fieldTypes[key as keyof T] || 'text';
      const options = fieldOptions[key as keyof T] || {};
      const result = sanitizationService.sanitize(value, type, options);

      newSanitizedValues[key as keyof T] = result.sanitized as T[keyof T];
      newViolations[key as keyof T] = result.violations;
    }

    setSanitizedValues(newSanitizedValues);
    setViolations(newViolations);
  }, [initialValues, fieldTypes, fieldOptions]);

  // Get sanitized data (ready for submission)
  const getSanitizedData = useCallback(() => sanitizedValues, [sanitizedValues]);

  // Computed values
  const isValid = useMemo(
    () => Object.values(violations).every(v => Array.isArray(v) && v.length === 0),
    [violations]
  );

  const hasViolations = useMemo(
    () => Object.values(violations).some(v => Array.isArray(v) && v.length > 0),
    [violations]
  );

  return {
    values,
    sanitizedValues,
    violations,
    isValid,
    hasViolations,
    setFieldValue,
    setValues: setValuesCallback,
    validate,
    reset,
    getSanitizedData,
  };
}

/**
 * Hook for real-time input validation with visual feedback
 */
export function useSecureInput(
  options: UseSanitizedInputOptions & {
    showSecurityWarnings?: boolean;
    blockDangerousInput?: boolean;
  } = {}
): {
  value: string;
  sanitizedValue: string;
  isDangerous: boolean;
  securityWarnings: string[];
  setValue: (value: string) => void;
  bindToInput: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    style?: React.CSSProperties;
  };
} {
  const sanitizationService = InputSanitizationService.getInstance();
  const {
    showSecurityWarnings = true,
    blockDangerousInput = false,
    ...sanitizationOptions
  } = options;

  const {
    state,
    setValue: setValueInternal,
    bindToInput: originalBindToInput,
  } = useSanitizedInput('', sanitizationOptions);

  const isDangerous = useMemo(
    () => sanitizationService.isDangerous(state.value),
    [state.value]
  );

  const securityWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (isDangerous) {
      warnings.push('This input contains potentially dangerous content');
    }

    if (state.violations.length > 0 && showSecurityWarnings) {
      warnings.push(...state.violations);
    }

    return warnings;
  }, [isDangerous, state.violations, showSecurityWarnings]);

  const setValue = useCallback(
    (value: string) => {
      // Block dangerous input if configured to do so
      if (blockDangerousInput && sanitizationService.isDangerous(value)) {
        return;
      }

      setValueInternal(value);
    },
    [blockDangerousInput, setValueInternal]
  );

  const bindToInput = useMemo(
    () => ({
      ...originalBindToInput,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(e.target.value);
      },
      style: isDangerous
        ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' }
        : undefined,
    }),
    [originalBindToInput, setValue, isDangerous]
  );

  return {
    value: state.value,
    sanitizedValue: state.sanitizedValue,
    isDangerous,
    securityWarnings,
    setValue,
    bindToInput,
  };
}

export default {
  useSanitizedInput,
  useSanitizedForm,
  useSecureInput,
};
