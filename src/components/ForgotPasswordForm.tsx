import React from 'react';
import { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onResetPassword: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export default function ForgotPasswordForm({
  onResetPassword,
  onBackToLogin,
  isLoading,
  error,
  success,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string>('');

  const validateEmail = (): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    await onResetPassword(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <CheckCircle
              className="w-12 h-12 text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            What's next?
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the reset link in the email</li>
            <li>Set a new password</li>
            <li>Return here to sign in</li>
          </ol>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onResetPassword(email)}
            disabled={isLoading}
            className="w-full alarm-button alarm-button-secondary py-3"
          >
            {isLoading ? 'Sending...' : 'Resend Email'}
          </button>

          <button
            onClick={onBackToLogin}
            className="w-full alarm-button alarm-button-primary py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reset Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Password Reset Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="reset-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e: any) => handleEmailChange(e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationError
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Enter your email address"
              autoComplete="email"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'email-error' : undefined}
              required
            />
          </div>
          {validationError && (
            <p
              id="email-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {validationError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full alarm-button alarm-button-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="send-reset-desc"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Sending Reset Link...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Send Reset Link
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </span>
          )}
          <span id="send-reset-desc" className="sr-only">
            Send password reset email to your email address
          </span>
        </button>

        {/* Back to Login Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-dark-600">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
