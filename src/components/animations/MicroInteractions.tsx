// Micro-interactions for Relife Smart Alarm
// Delightful, smooth animations for form inputs and UI elements

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useEntranceAnimation, useHoverAnimation } from '../../hooks/useAnimations';
import { TimeoutHandle } from '../types/timers';

// ================================================================
// ANIMATED FORM INPUTS
// ================================================================

interface AnimatedInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  icon,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Container */}
      <motion.div
        className={`
          relative bg-white rounded-xl border-2 transition-all duration-200
          ${
            isFocused
              ? 'border-blue-500 shadow-lg shadow-blue-500/10'
              : error
                ? 'border-red-300 shadow-lg shadow-red-500/10'
                : 'border-gray-200 hover:border-gray-300'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        whileHover={
          !disabled
            ? {
                scale: 1.01,
                transition: { duration: 0.2 },
              }
            : {}
        }
        whileTap={
          !disabled
            ? {
                scale: 0.99,
                transition: { duration: 0.1 },
              }
            : {}
        }
      >
        {/* Icon */}
        {icon && (
          <motion.div
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`}
            animate={{
              scale: isFocused ? 1.1 : 1,
              color: isFocused ? '#3B82F6' : '#9CA3AF',
            }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Floating Label */}
        <motion.label
          className={`
            absolute left-${icon ? '12' : '4'} pointer-events-none select-none font-medium
            ${isFocused ? 'text-blue-500' : error ? 'text-red-500' : 'text-gray-500'}
          `}
          animate={{
            y: isFocused || hasValue ? -28 : 0,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused ? '#3B82F6' : error ? '#EF4444' : '#6B7280',
          }}
          transition={{
            type: 'spring' as const,
            stiffness: 300,
            damping: 20,
          }}
          style={{
            transformOrigin: 'left center',
          }}
        >
          {label}
        </motion.label>

        {/* Input */}
        <input
          ref={inputRef}
          type={type}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={(e: any) => // auto: implicit any onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            w-full bg-transparent px-${icon ? '12' : '4'} py-4 text-gray-900 placeholder-gray-400
            focus:outline-none disabled:cursor-not-allowed
          `}
        />

        {/* Focus indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500 rounded-full"
          initial={{ width: 0, left: '50%', x: '-50%' }}
          animate={{
            width: isFocused ? '100%' : 0,
            left: isFocused ? '0%' : '50%',
            x: isFocused ? '0%' : '-50%',
          }}
          transition={{
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
          }}
        />
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-2 text-sm text-red-500 flex items-center space-x-2"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' as const, stiffness: 300 }}
            >
              ⚠️
            </motion.span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success indicator */}
      <AnimatePresence>
        {!error && hasValue && !isFocused && (
          <motion.div
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ================================================================
// ANIMATED SELECT DROPDOWN
// ================================================================

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedSelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
    options.find((opt: any) => // auto: implicit any opt.value === value) || null
  );

  const handleSelect = (option: SelectOption) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Floating Label */}
      <motion.label
        className={`
          absolute left-4 pointer-events-none select-none font-medium z-10
          ${
            isOpen || selectedOption
              ? 'text-blue-500'
              : error
                ? 'text-red-500'
                : 'text-gray-500'
          }
        `}
        animate={{
          y: isOpen || selectedOption ? -28 : 16,
          scale: isOpen || selectedOption ? 0.85 : 1,
          color: isOpen ? '#3B82F6' : error ? '#EF4444' : '#6B7280',
        }}
        transition={{
          type: 'spring' as const,
          stiffness: 300,
          damping: 20,
        }}
        style={{
          transformOrigin: 'left center',
        }}
      >
        {label}
      </motion.label>

      {/* Select Button */}
      <motion.button
        type="button"
        className={`
          w-full bg-white rounded-xl border-2 px-4 py-4 text-left flex items-center justify-between
          transition-all duration-200 focus:outline-none
          ${
            isOpen
              ? 'border-blue-500 shadow-lg shadow-blue-500/10'
              : error
                ? 'border-red-300 shadow-lg shadow-red-500/10'
                : 'border-gray-200 hover:border-gray-300'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        whileHover={
          !disabled
            ? {
                scale: 1.01,
                transition: { duration: 0.2 },
              }
            : {}
        }
        whileTap={
          !disabled
            ? {
                scale: 0.99,
                transition: { duration: 0.1 },
              }
            : {}
        }
      >
        {/* Selected value or placeholder */}
        <div className="flex items-center space-x-3">
          {selectedOption?.icon && (
            <motion.div
              className="text-gray-500"
              animate={{ scale: isOpen ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {selectedOption.icon}
            </motion.div>
          )}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Chevron */}
        <motion.div
          className="text-gray-400"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>

        {/* Focus indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500 rounded-full"
          initial={{ width: 0, left: '50%', x: '-50%' }}
          animate={{
            width: isOpen ? '100%' : 0,
            left: isOpen ? '0%' : '50%',
            x: isOpen ? '0%' : '-50%',
          }}
          transition={{
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
          }}
        />
      </motion.button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors flex items-center space-x-3"
                onClick={() => handleSelect(option)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                whileHover={{ x: 4 }}
              >
                {option.icon && <div className="text-gray-500">{option.icon}</div>}
                <span className="text-gray-900">{option.label}</span>
                {selectedOption?.value === option.value && (
                  <motion.div
                    className="ml-auto text-blue-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' as const, stiffness: 300 }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-2 text-sm text-red-500 flex items-center space-x-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ================================================================
// ANIMATED BUTTON WITH RIPPLE EFFECT
// ================================================================

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
}) => {
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number }>>(
    []
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const baseClasses = {
    primary:
      'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
    secondary:
      'bg-white text-gray-700 border border-gray-200 shadow-sm hover:shadow-md',
    ghost: 'text-gray-600 hover:bg-gray-50',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now().toString(), x, y };

      setRipples((prev: any) => // auto: implicit any [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev: any) => // auto: implicit any prev.filter((ripple: any) => // auto: implicit any ripple.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-xl font-medium transition-all duration-200
        flex items-center justify-center space-x-2
        ${baseClasses[variant]} ${sizes[size]} ${className}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={
        !disabled && !loading
          ? {
              scale: 1.02,
              y: -1,
              transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
            }
          : {}
      }
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : {}
      }
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple: any) => // auto: implicit any (
          <motion.div
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 25,
              top: ripple.y - 25,
              width: 50,
              height: 50,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        className="relative z-10 flex items-center space-x-2"
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {icon && (
          <motion.div
            animate={
              !disabled && !loading
                ? {
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
          >
            {icon}
          </motion.div>
        )}
        <span>{children}</span>
      </motion.div>
    </motion.button>
  );
};

// ================================================================
// ANIMATED CHECKBOX
// ================================================================

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { checkbox: 'w-4 h-4', text: 'text-sm' },
    md: { checkbox: 'w-5 h-5', text: 'text-base' },
    lg: { checkbox: 'w-6 h-6', text: 'text-lg' },
  };

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <motion.div
        className={`
          relative ${sizes[size].checkbox} mt-0.5
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && onChange(!checked)}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        {/* Checkbox background */}
        <motion.div
          className={`
            w-full h-full rounded border-2 transition-colors duration-200
            ${
              checked
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50' : ''}
          `}
          animate={{
            scale: checked ? [1, 1.1, 1] : 1,
            backgroundColor: checked ? '#3B82F6' : '#FFFFFF',
            borderColor: checked ? '#3B82F6' : '#D1D5DB',
          }}
          transition={{
            scale: { duration: 0.2, type: 'spring' as const, stiffness: 300 },
            backgroundColor: { duration: 0.2 },
            borderColor: { duration: 0.2 },
          }}
        />

        {/* Check mark */}
        <AnimatePresence>
          {checked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-white"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring' as const,
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}
            >
              <svg
                className="w-full h-full p-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <motion.path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label and description */}
      <div
        className={`flex-1 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <motion.label
          className={`font-medium text-gray-900 ${sizes[size].text}`}
          animate={{ color: checked ? '#1F2937' : '#374151' }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
        {description && (
          <motion.p
            className="text-sm text-gray-500 mt-1"
            animate={{ opacity: disabled ? 0.5 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {description}
          </motion.p>
        )}
      </div>
    </div>
  );
};

// ================================================================
// ANIMATED PROGRESS BAR
// ================================================================

interface AnimatedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
  animated = true,
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={className}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <motion.span
              className="text-sm font-medium text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {label}
            </motion.span>
          )}
          {showPercentage && (
            <motion.span
              className="text-sm font-medium text-gray-500"
              key={percentage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
            >
              {Math.round(percentage)}%
            </motion.span>
          )}
        </div>
      )}

      {/* Progress bar background */}
      <motion.div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: 'left' }}
      >
        {/* Progress bar fill */}
        <motion.div
          className={`h-full bg-gradient-to-r ${colors[color]} relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            type: 'spring' as const,
            stiffness: 100,
            damping: 20,
          }}
        >
          {/* Animated shimmer effect */}
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 1,
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default {
  AnimatedInput,
  AnimatedSelect,
  AnimatedButton,
  AnimatedCheckbox,
  AnimatedProgress,
};
