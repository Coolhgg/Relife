import React from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
  isLoading: boolean;
  _error: string | null;
}

export default function LoginForm({
  onLogin,
  onSwitchToSignUp,
  onForgotPassword,
  isLoading,
  _error,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onLogin(email, password);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to access your smart alarms
        </p>
      </div>

      {/* Global Error Alert */}
      {_error && (
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
                Sign In Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{_error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.email
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Enter your email"
              autoComplete="email"
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? 'email-_error' : undefined}
              required
            />
          </div>
          {validationErrors.email && (
            <p
              id="email-_error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.password
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={!!validationErrors.password}
              aria-describedby={
                validationErrors.password ? 'password-_error' : 'password-toggle-desc'
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-describedby="password-toggle-desc"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
            <span id="password-toggle-desc" className="sr-only">
              Click to {showPassword ? 'hide' : 'show'} password characters
            </span>
          </div>
          {validationErrors.password && (
            <p
              id="password-_error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {validationErrors.password}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
          >
            Forgot your password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full alarm-button alarm-button-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="sign-in-desc"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Signing In...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </span>
          )}
          <span id="sign-in-desc" className="sr-only">
            Sign in to access your alarm dashboard
          </span>
        </button>

        {/* Sign Up Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-dark-600">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Don't have an account?
          </p>
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
          >
            Create a new account
          </button>
        </div>
      </form>
    </div>
  );
}
