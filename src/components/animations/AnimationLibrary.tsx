// Advanced Animation Library for Relife Smart Alarm
// Comprehensive collection of smooth micro-interactions and delightful animations

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform, useInView } from 'framer-motion';

// ================================================================
// SPRING ANIMATIONS AND PHYSICS
// ================================================================

export const springConfig = {
  gentle: { type: "spring" as const, stiffness: 120, damping: 20 },
  bouncy: { type: "spring" as const, stiffness: 200, damping: 10 },
  snappy: { type: "spring" as const, stiffness: 300, damping: 30 },
  smooth: { type: "spring" as const, stiffness: 100, damping: 25 },
  elastic: { type: "spring" as const, stiffness: 400, damping: 8 }
} as const;

export const easingCurves = {
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  backOut: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
  anticipate: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number]
};

// ================================================================
// BUTTON ANIMATIONS
// ================================================================

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white text-gray-700 border border-gray-200 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-xl font-medium transition-all duration-200
        ${baseClasses[variant]} ${sizes[size]} ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}

      // Hover animations
      whileHover={!disabled ? {
        scale: 1.02,
        y: -1,
        transition: { type: "spring" as const, stiffness: 120, damping: 20 }
      } : {}}

      // Press animations
      whileTap={!disabled ? {
        scale: 0.98,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 30 }
      } : {}}

      // Focus animations
      whileFocus={{
        scale: 1.01,
        transition: { type: "spring" as const, stiffness: 120, damping: 20 }
      }}

      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Ripple effect */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
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
            <LoadingSpinner size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.span
        className="relative z-10 flex items-center justify-center space-x-2"
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// ================================================================
// LOADING ANIMATIONS
// ================================================================

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-500',
  className = ''
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <motion.div
      className={`${sizes[size]} ${color} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="8"
        />
      </svg>
    </motion.div>
  );
};

export const PulseLoader: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-2 h-2',
  className = ''
}) => {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className={`${size} bg-blue-500 rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
  animated?: boolean;
}> = ({ lines = 3, className = '', animated = true }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gray-200 rounded-lg"
          style={{ width: `${Math.random() * 40 + 60}%` }}
          animate={animated ? {
            opacity: [0.5, 1, 0.5],
          } : {}}
          transition={animated ? {
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1
          } : {}}
        />
      ))}
    </div>
  );
};

// ================================================================
// CARD ANIMATIONS
// ================================================================

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  pressEffect?: boolean;
  glowEffect?: boolean;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  pressEffect = true,
  glowEffect = false,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`
        relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20
        ${onClick ? 'cursor-pointer' : ''} ${className}
        ${glowEffect ? 'shadow-xl shadow-blue-500/10' : ''}
      `}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}

      // Hover animations
      whileHover={hoverEffect ? {
        y: -4,
        scale: 1.02,
        transition: { type: "spring" as const, stiffness: 120, damping: 20 },
        boxShadow: glowEffect
          ? "0 20px 40px rgba(59, 130, 246, 0.15)"
          : "0 20px 40px rgba(0, 0, 0, 0.1)"
      } : {}}

      // Press animations
      whileTap={pressEffect && onClick ? {
        scale: 0.98,
        transition: { type: "spring" as const, stiffness: 300, damping: 30 }
      } : {}}

      // Initial animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 120, damping: 20 }}
    >
      {/* Glow effect */}
      <AnimatePresence>
        {glowEffect && isHovered && (
          <motion.div
            className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// ================================================================
// SCROLL ANIMATIONS
// ================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  once = true,
  className = ''
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionOffset[direction]
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0
      } : {}}
      transition={{
        duration,
        delay,
        ease: [0, 0, 0.2, 1] as [number, number, number, number]
      }}
    >
      {children}
    </motion.div>
  );
};

// ================================================================
// TOGGLE ANIMATIONS
// ================================================================

interface AnimatedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'red';
  disabled?: boolean;
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  checked,
  onChange,
  size = 'md',
  color = 'blue',
  disabled = false
}) => {
  const sizes = {
    sm: { container: 'w-8 h-5', thumb: 'w-3 h-3' },
    md: { container: 'w-11 h-6', thumb: 'w-4 h-4' },
    lg: { container: 'w-14 h-8', thumb: 'w-6 h-6' }
  };

  const colors = {
    blue: checked ? 'bg-blue-500' : 'bg-gray-300',
    green: checked ? 'bg-green-500' : 'bg-gray-300',
    purple: checked ? 'bg-purple-500' : 'bg-gray-300',
    red: checked ? 'bg-red-500' : 'bg-gray-300'
  };

  return (
    <motion.button
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200
        ${sizes[size].container} ${colors[color]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={() => !disabled && onChange(!checked)}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        className={`
          ${sizes[size].thumb} bg-white rounded-full shadow-lg
          flex items-center justify-center
        `}
        animate={{
          x: checked ?
            (size === 'sm' ? 12 : size === 'md' ? 20 : 24) : 2
        }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
      >
        {/* Check mark icon when enabled */}
        <AnimatePresence>
          {checked && (
            <motion.svg
              className="w-2 h-2 text-green-500"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
};

// ================================================================
// FLOATING ACTION BUTTON
// ================================================================

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'red';
  tooltip?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'lg',
  color = 'blue',
  tooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  const sizes = {
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colors = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25',
    green: 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/25',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/25',
    red: 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/25'
  };

  return (
    <div className={positions[position]}>
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && showTooltip && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring" as const, stiffness: 120, damping: 20 }}
          >
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        className={`
          ${sizes[size]} ${colors[color]}
          rounded-full text-white shadow-xl flex items-center justify-center
          z-50 relative overflow-hidden
        `}
        onClick={onClick}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}

        whileHover={{
          scale: 1.1,
          y: -2,
          transition: { type: "spring" as const, stiffness: 120, damping: 20 }
        }}

        whileTap={{
          scale: 0.95,
          transition: { type: "spring" as const, stiffness: 300, damping: 30 }
        }}

        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring' as const,
          stiffness: 300,
          damping: 20,
          delay: 0.5
        }}
      >
        <motion.div
          whileHover={{ rotate: 5 }}
          transition={{ type: 'spring' as const, stiffness: 120, damping: 20 }}
        >
          {icon}
        </motion.div>

        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white"
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      </motion.button>
    </div>
  );
};

// ================================================================
// NOTIFICATION ANIMATIONS
// ================================================================

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export const AnimatedNotification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - (100 / (duration / 100))));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-500',
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      progress: 'bg-red-500'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      progress: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      progress: 'bg-blue-500'
    }
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-sm
        ${typeStyles[type].bg}
      `}
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ type: "spring" as const, stiffness: 120, damping: 20 }}

      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${typeStyles[type].icon}`}>
          {/* Icon would go here based on type */}
          <div className="w-6 h-6 rounded-full bg-current opacity-20" />
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          {message && (
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 ${typeStyles[type].progress}`}
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </motion.div>
  );
};

// ================================================================
// STAGGER ANIMATIONS
// ================================================================

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } }
      }}
    >
      {children}
    </motion.div>
  );
};

export default {
  AnimatedButton,
  LoadingSpinner,
  PulseLoader,
  SkeletonLoader,
  AnimatedCard,
  ScrollReveal,
  AnimatedToggle,
  FloatingActionButton,
  AnimatedNotification,
  StaggerContainer,
  StaggerItem,
  springConfig,
  easingCurves
};