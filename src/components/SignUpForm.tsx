import React from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { validateEmail, validatePassword } from '../utils/validation';
import SecurityService from '../services/security';

interface SignUpFormProps {
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function SignUpForm({ 
  onSignUp, 
  onSwitchToLogin, 
  isLoading, 
  error 
}: SignUpFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof SecurityService.checkPasswordStrength> | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    // Enhanced email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors[0];
    }
    
    // Enhanced password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await onSignUp(formData.email, formData.password, formData.name);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check password strength in real-time
    if (field === 'password') {
      setPasswordStrength(SecurityService.checkPasswordStrength(value));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrengthDisplay = () => {
    if (!passwordStrength || !formData.password) {
      return { strength: 0, label: '', color: '', width: '0%' };
    }
    
    const score = passwordStrength.score;
    const strengthPercent = (score / 4) * 100;
    
    if (score === 0) return { strength: 0, label: 'Very Weak', color: 'text-red-600', width: '20%' };
    if (score === 1) return { strength: 25, label: 'Weak', color: 'text-red-500', width: '40%' };
    if (score === 2) return { strength: 50, label: 'Fair', color: 'text-yellow-600', width: '60%' };
    if (score === 3) return { strength: 75, label: 'Good', color: 'text-blue-600', width: '80%' };
    return { strength: 100, label: 'Strong', color: 'text-green-600', width: '100%' };
  };

  const passwordStrengthDisplay = getPasswordStrengthDisplay();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Join Smart Alarm to sync your data and unlock AI insights
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
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Account Creation Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Name Field */}
        <div>
          <label 
            htmlFor="name" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Enter your full name"
              autoComplete="name"
              aria-invalid={!!validationErrors.name}
              aria-describedby={validationErrors.name ? 'name-error' : undefined}
              required
            />
          </div>
          {validationErrors.name && (
            <p 
              id="name-error" 
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {validationErrors.name}
            </p>
          )}
        </div>

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
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Enter your email"
              autoComplete="email"
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? 'email-error' : undefined}
              required
            />
          </div>
          {validationErrors.email && (
            <p 
              id="email-error" 
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
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Create a strong password"
              autoComplete="new-password"
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? 'password-error' : 'password-strength'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Enhanced Password Strength Indicator */}
          {formData.password && passwordStrengthDisplay.label && (
            <div id="password-strength" className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                <span className={`font-medium ${passwordStrengthDisplay.color}`}>
                  {passwordStrengthDisplay.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrengthDisplay.strength < 50 ? 'bg-red-500' :
                    passwordStrengthDisplay.strength < 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: passwordStrengthDisplay.width }}
                  role="progressbar"
                  aria-valuenow={passwordStrengthDisplay.strength}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Password strength: ${passwordStrengthDisplay.label}`}
                />
              </div>
              
              {/* Security Feedback */}
              {passwordStrength?.feedback.warning && (
                <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{passwordStrength.feedback.warning}</span>
                </div>
              )}
              
              {passwordStrength?.feedback.suggestions && passwordStrength.feedback.suggestions.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="font-medium mb-1">Suggestions:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {passwordStrength.feedback.suggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {validationErrors.password && (
            <p 
              id="password-error" 
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {validationErrors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
              }`}
              placeholder="Confirm your password"
              autoComplete="new-password"
              aria-invalid={!!validationErrors.confirmPassword}
              aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              Passwords match
            </p>
          )}
          {validationErrors.confirmPassword && (
            <p 
              id="confirm-password-error" 
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 text-sm">
            Password Requirements:
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1" role="list">
            <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'line-through opacity-75' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden="true" />
              At least 8 characters
            </li>
            <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'line-through opacity-75' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden="true" />
              One uppercase letter
            </li>
            <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'line-through opacity-75' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden="true" />
              One lowercase letter
            </li>
            <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'line-through opacity-75' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden="true" />
              One number
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full alarm-button alarm-button-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="create-account-desc"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              Creating Account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Account
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </span>
          )}
          <span id="create-account-desc" className="sr-only">
            Create your Smart Alarm account to save and sync your alarms
          </span>
        </button>

        {/* Sign In Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-dark-600">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Already have an account?
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
          >
            Sign in instead
          </button>
        </div>
      </form>
    </div>
  );
}