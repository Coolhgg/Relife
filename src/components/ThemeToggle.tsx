import React, { useState, useEffect } from 'react';
import { Sun, Moon, Smartphone, Palette, Settings } from 'lucide-react';
import { useEnhancedTheme } from '../hooks/useEnhancedTheme';
import { useThemeGestures } from '../hooks/useThemeGestures';
import { themeVariants } from '../config/themes';

interface EnhancedThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  showVariantIndicator?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon' | 'floating';
  enableGestures?: boolean;
  onCustomizerOpen?: () => void;
}

const EnhancedThemeToggle: React.FC<EnhancedThemeToggleProps> = ({
  className = '',
  showLabel = false,
  showVariantIndicator = true,
  size = 'md',
  variant = 'icon',
  enableGestures = true,
  onCustomizerOpen
}) => {
  const {
    mode,
    toggleMode,
    resolvedTheme,
    variant: themeVariant,
    getCurrentColors,
    isScheduledModeActive
  } = useEnhancedTheme();
  
  const { triggerThemeToggle } = useThemeGestures({ enabled: enableGestures });
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = getCurrentColors();
  const currentTheme = themeVariants[themeVariant] || themeVariants.default;

  // Listen for gesture events to show feedback
  useEffect(() => {
    if (!enableGestures) return;

    const handleGestureEvent = (e: CustomEvent) => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 1500);
    };

    window.addEventListener('theme-horizontal-swipe', handleGestureEvent as EventListener);
    window.addEventListener('theme-vertical-swipe', handleGestureEvent as EventListener);
    
    return () => {
      window.removeEventListener('theme-horizontal-swipe', handleGestureEvent as EventListener);
      window.removeEventListener('theme-vertical-swipe', handleGestureEvent as EventListener);
    };
  }, [enableGestures]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const getThemeIcon = () => {
    if (mode === 'system') {
      return <Smartphone className={sizeClasses[size]} aria-hidden="true" />;
    }
    return resolvedTheme === 'dark' 
      ? <Sun className={sizeClasses[size]} aria-hidden="true" />
      : <Moon className={sizeClasses[size]} aria-hidden="true" />;
  };

  const getThemeLabel = () => {
    if (mode === 'system') {
      return `System (${resolvedTheme})`;
    }
    return resolvedTheme === 'dark' ? 'Light' : 'Dark';
  };

  const getAriaLabel = () => {
    let label = '';
    if (mode === 'system') {
      label = `System theme active (currently ${resolvedTheme}). Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme.`;
    } else {
      label = `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`;
    }
    
    if (enableGestures) {
      label += ' (Swipe left/right to toggle, up/down to change colors)';
    }
    
    return label;
  };

  const handleClick = () => {
    if (enableGestures) {
      triggerThemeToggle();
    } else {
      toggleMode();
    }
  };

  const handleLongPress = () => {
    if (onCustomizerOpen) {
      onCustomizerOpen();
    }
  };

  // Long press detection
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleMouseDown = () => {
    const timer = setTimeout(handleLongPress, 500);
    setPressTimer(timer);
  };
  
  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
        <div className="relative">
          <button
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="w-14 h-14 rounded-full shadow-lg backdrop-blur-lg border-2 border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/30"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}90 0%, ${colors.secondary}70 100%)`
            }}
            aria-label={getAriaLabel()}
          >
            <div className="flex items-center justify-center text-white">
              {getThemeIcon()}
            </div>
          </button>
          
          {/* Variant indicator */}
          {showVariantIndicator && (
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: colors.accent }}
              title={currentTheme.name}
            />
          )}
          
          {/* Scheduled mode indicator */}
          {isScheduledModeActive && (
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border border-white animate-pulse" />
          )}
          
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg backdrop-blur-sm">
              Theme switched!
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`inline-flex items-center gap-2 ${buttonSizeClasses[size]} px-3 rounded-lg text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${className}`}
        aria-label={getAriaLabel()}
      >
        <div className="relative">
          {getThemeIcon()}
          {showVariantIndicator && (
            <div 
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
          )}
        </div>
        {showLabel && (
          <span className="text-sm font-medium flex items-center gap-1">
            {getThemeLabel()}
            {isScheduledModeActive && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </span>
        )}
      </button>
    );
  }

  // Default icon variant
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`${buttonSizeClasses[size]} rounded-full text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${className}`}
        aria-label={getAriaLabel()}
      >
        <div className="relative">
          {getThemeIcon()}
          {showVariantIndicator && (
            <div 
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-800"
              style={{ backgroundColor: colors.primary }}
            />
          )}
        </div>
      </button>
      
      {/* Scheduled mode indicator */}
      {isScheduledModeActive && (
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
      
      {/* Gesture feedback tooltip */}
      {showTooltip && enableGestures && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded backdrop-blur-sm whitespace-nowrap">
          Theme changed!
        </div>
      )}
    </div>
  );
};

export default EnhancedThemeToggle;