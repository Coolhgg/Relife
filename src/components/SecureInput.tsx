/**
 * Secure Input Components
 * Provides sanitized input fields with built-in security validation and visual feedback
 */

import React, { forwardRef, useState } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Info,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSanitizedInput, useSecureInput, UseSanitizedInputOptions } from '../hooks/useSanitization';
import { InputType } from '../services/input-sanitization';

export interface SecureInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  inputType?: InputType;
  value?: string;
  onChange?: (value: string, sanitizedValue: string, isValid: boolean) => void;
  showSecurityIndicator?: boolean;
  showViolations?: boolean;
  blockDangerousInput?: boolean;
  sanitizationOptions?: UseSanitizedInputOptions;
  label?: string;
  description?: string;
  error?: string;
}

export interface SecureTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  inputType?: InputType;
  value?: string;
  onChange?: (value: string, sanitizedValue: string, isValid: boolean) => void;
  showSecurityIndicator?: boolean;
  showViolations?: boolean;
  blockDangerousInput?: boolean;
  sanitizationOptions?: UseSanitizedInputOptions;
  label?: string;
  description?: string;
  error?: string;
}

/**
 * Secure Input Field with built-in sanitization
 */
export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  (
    {
      inputType = 'text',
      value: controlledValue,
      onChange,
      showSecurityIndicator = true,
      showViolations = true,
      blockDangerousInput = false,
      sanitizationOptions = {},
      label,
      description,
      error,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const {
      value,
      sanitizedValue,
      isDangerous,
      securityWarnings,
      setValue,
      bindToInput,
    } = useSecureInput({
      type: inputType,
      showSecurityWarnings: showViolations,
      blockDangerousInput,
      validateOnChange: true,
      ...sanitizationOptions,
    });

    // Handle controlled vs uncontrolled
    React.useEffect(() => {
      if (controlledValue !== undefined && controlledValue !== value) {
        setValue(controlledValue);
      }
    }, [controlledValue, value, setValue]);

    // Notify parent of changes
    React.useEffect(() => {
      if (onChange) {
        onChange(value, sanitizedValue, !isDangerous && securityWarnings.length === 0);
      }
    }, [value, sanitizedValue, isDangerous, securityWarnings, onChange]);

    const isPassword = type === 'password' || inputType === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const getSecurityIcon = () => {
      if (isDangerous) {
        return <ShieldAlert className="w-4 h-4 text-destructive" />;
      }
      if (securityWarnings.length > 0) {
        return <Shield className="w-4 h-4 text-yellow-500" />;
      }
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    };

    const getSecurityBadge = () => {
      if (isDangerous) {
        return <Badge variant="destructive" className="text-xs">Dangerous</Badge>;
      }
      if (securityWarnings.length > 0) {
        return <Badge variant="outline" className="text-xs text-yellow-600">Sanitized</Badge>;
      }
      return <Badge variant="outline" className="text-xs text-green-600">Secure</Badge>;
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={props.id} className="text-sm font-medium">
              {label}
            </Label>
            {showSecurityIndicator && (
              <div className="flex items-center space-x-2">
                {getSecurityIcon()}
                {getSecurityBadge()}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Input Field */}
        <div className="relative">
          <Input
            {...props}
            {...bindToInput}
            ref={ref}
            type={inputType}
            className={cn(
              className,
              isDangerous && 'border-destructive bg-destructive/5',
              securityWarnings.length > 0 && !isDangerous && 'border-yellow-500 bg-yellow-50'
            )}
          />
          
          {/* Password Toggle */}
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="border-destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Security Violations */}
        {showViolations && securityWarnings.length > 0 && (
          <Alert className={isDangerous ? 'border-destructive' : 'border-yellow-500'}>
            {isDangerous ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDangerous ? 'Security Warning' : 'Input Sanitized'}
                </p>
                <ul className="text-xs space-y-1">
                  {securityWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

/**
 * Secure Textarea with built-in sanitization
 */
export const SecureTextarea = forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  (
    {
      inputType = 'text',
      value: controlledValue,
      onChange,
      showSecurityIndicator = true,
      showViolations = true,
      blockDangerousInput = false,
      sanitizationOptions = {},
      label,
      description,
      error,
      className,
      ...props
    },
    ref
  ) => {
    const {
      value,
      sanitizedValue,
      isDangerous,
      securityWarnings,
      setValue,
      bindToInput,
    } = useSecureInput({
      type: inputType,
      showSecurityWarnings: showViolations,
      blockDangerousInput,
      validateOnChange: true,
      ...sanitizationOptions,
    });

    // Handle controlled vs uncontrolled
    React.useEffect(() => {
      if (controlledValue !== undefined && controlledValue !== value) {
        setValue(controlledValue);
      }
    }, [controlledValue, value, setValue]);

    // Notify parent of changes
    React.useEffect(() => {
      if (onChange) {
        onChange(value, sanitizedValue, !isDangerous && securityWarnings.length === 0);
      }
    }, [value, sanitizedValue, isDangerous, securityWarnings, onChange]);

    const getSecurityIcon = () => {
      if (isDangerous) {
        return <ShieldAlert className="w-4 h-4 text-destructive" />;
      }
      if (securityWarnings.length > 0) {
        return <Shield className="w-4 h-4 text-yellow-500" />;
      }
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    };

    const getSecurityBadge = () => {
      if (isDangerous) {
        return <Badge variant="destructive" className="text-xs">Dangerous</Badge>;
      }
      if (securityWarnings.length > 0) {
        return <Badge variant="outline" className="text-xs text-yellow-600">Sanitized</Badge>;
      }
      return <Badge variant="outline" className="text-xs text-green-600">Secure</Badge>;
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={props.id} className="text-sm font-medium">
              {label}
            </Label>
            {showSecurityIndicator && (
              <div className="flex items-center space-x-2">
                {getSecurityIcon()}
                {getSecurityBadge()}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Textarea Field */}
        <Textarea
          {...props}
          {...bindToInput}
          ref={ref}
          className={cn(
            className,
            isDangerous && 'border-destructive bg-destructive/5',
            securityWarnings.length > 0 && !isDangerous && 'border-yellow-500 bg-yellow-50'
          )}
        />

        {/* Error Message */}
        {error && (
          <Alert className="border-destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Security Violations */}
        {showViolations && securityWarnings.length > 0 && (
          <Alert className={isDangerous ? 'border-destructive' : 'border-yellow-500'}>
            {isDangerous ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDangerous ? 'Security Warning' : 'Input Sanitized'}
                </p>
                <ul className="text-xs space-y-1">
                  {securityWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

SecureTextarea.displayName = 'SecureTextarea';

/**
 * Security Status Indicator Component
 */
export const SecurityStatusIndicator: React.FC<{
  value: string;
  inputType?: InputType;
  showDetails?: boolean;
  className?: string;
}> = ({ value, inputType = 'text', showDetails = false, className }) => {
  const { state } = useSanitizedInput(value, { type: inputType });
  const isDangerous = state.violations.some(v => v.includes('XSS') || v.includes('SQL') || v.includes('Code injection'));

  if (showDetails) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center space-x-2">
          {isDangerous ? (
            <ShieldAlert className="w-5 h-5 text-destructive" />
          ) : state.violations.length > 0 ? (
            <Shield className="w-5 h-5 text-yellow-500" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {isDangerous ? 'Security Risk Detected' : 
             state.violations.length > 0 ? 'Input Sanitized' : 
             'Input Secure'}
          </span>
        </div>
        
        {state.violations.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            {state.violations.map((violation, index) => (
              <div key={index} className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{violation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {isDangerous ? (
        <ShieldAlert className="w-4 h-4 text-destructive" />
      ) : state.violations.length > 0 ? (
        <Shield className="w-4 h-4 text-yellow-500" />
      ) : (
        <ShieldCheck className="w-4 h-4 text-green-500" />
      )}
      
      <Badge 
        variant={isDangerous ? 'destructive' : state.violations.length > 0 ? 'outline' : 'outline'}
        className={cn(
          'text-xs',
          !isDangerous && state.violations.length > 0 && 'text-yellow-600',
          !isDangerous && state.violations.length === 0 && 'text-green-600'
        )}
      >
        {isDangerous ? 'Dangerous' : state.violations.length > 0 ? 'Sanitized' : 'Secure'}
      </Badge>
    </div>
  );
};

export default {
  SecureInput,
  SecureTextarea,
  SecurityStatusIndicator,
};