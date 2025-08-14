// CSRF Protection Component
// Provides Cross-Site Request Forgery protection for forms

import React, { useEffect, useState } from 'react';
import SecurityService from '../services/security';
import useAuth from '../hooks/useAuth';

interface CSRFProtectionProps {
  children: (csrfToken: string, isValid: boolean) => React.ReactNode;
  onInvalidToken?: () => void;
}

const CSRFProtection: React.FC<CSRFProtectionProps> = ({ 
  children, 
  onInvalidToken 
}) => {
  const { csrfToken: authCsrfToken } = useAuth();
  const [localCsrfToken, setLocalCsrfToken] = useState<string>('');
  const [isValidToken, setIsValidToken] = useState<boolean>(false);

  useEffect(() => {
    // Use auth-provided CSRF token if available, otherwise generate a new one
    if (authCsrfToken) {
      setLocalCsrfToken(authCsrfToken);
      setIsValidToken(true);
    } else {
      const newToken = SecurityService.generateCSRFToken();
      setLocalCsrfToken(newToken);
      setIsValidToken(true);
    }
  }, [authCsrfToken]);

  // Validate token periodically
  useEffect(() => {
    if (!localCsrfToken) return;

    const validateInterval = setInterval(() => {
      // In a real app, you might want to validate against a server-side token
      // For now, we'll just ensure the token exists and is not empty
      const isValid = localCsrfToken.length > 0;
      
      if (!isValid && onInvalidToken) {
        onInvalidToken();
      }
      
      setIsValidToken(isValid);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(validateInterval);
  }, [localCsrfToken, onInvalidToken]);

  return (
    <>
      {children(localCsrfToken, isValidToken)}
    </>
  );
};

// Higher-order component for CSRF protection
export const withCSRFProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P & { csrfToken: string }>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <CSRFProtection>
      {(csrfToken, isValid) => (
        isValid ? (
          <WrappedComponent 
            {...props} 
            csrfToken={csrfToken} 
            ref={ref}
          />
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 text-sm">
              Security validation failed. Please refresh the page and try again.
            </div>
          </div>
        )
      )}
    </CSRFProtection>
  ));
};

// Hook for using CSRF protection in functional components
export const useCSRFProtection = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const { csrfToken: authCsrfToken } = useAuth();

  useEffect(() => {
    if (authCsrfToken) {
      setCsrfToken(authCsrfToken);
      setIsValid(true);
    } else {
      const newToken = SecurityService.generateCSRFToken();
      setCsrfToken(newToken);
      setIsValid(true);
    }
  }, [authCsrfToken]);

  const validateCSRFToken = (tokenToValidate: string): boolean => {
    return SecurityService.validateCSRFToken(tokenToValidate, csrfToken);
  };

  const refreshToken = (): string => {
    const newToken = SecurityService.generateCSRFToken();
    setCsrfToken(newToken);
    setIsValid(true);
    return newToken;
  };

  return {
    csrfToken,
    isValid,
    validateCSRFToken,
    refreshToken
  };
};

export default CSRFProtection;