import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import type { Theme } from '../types';

export interface UseThemeReturn {
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  systemTheme: string | undefined;
  themes: string[];
  isSystemTheme: boolean;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  cycleTheme: () => void;
}

/**
 * Custom theme hook that wraps next-themes with additional functionality
 * for the Relife alarm app
 */
export function useTheme(): UseThemeReturn {
  const {
    theme,
    resolvedTheme,
    setTheme,
    systemTheme,
    themes
  } = useNextTheme();

  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isSystemTheme = theme === 'system';
  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const isLight = mounted ? resolvedTheme === 'light' : false;

  /**
   * Toggle between light and dark theme
   * If currently system, switches to the opposite of current resolved theme
   */
  const toggleTheme = () => {
    if (!mounted) return;
    
    if (theme === 'system') {
      // If system theme, switch to opposite of current resolved theme
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If explicit theme, toggle between light and dark
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  /**
   * Cycle through all available themes: light -> dark -> system
   */
  const cycleTheme = () => {
    if (!mounted) return;
    
    switch (theme) {
      case 'light':
        setTheme('dark');
        break;
      case 'dark':
        setTheme('system');
        break;
      case 'system':
      default:
        setTheme('light');
        break;
    }
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    systemTheme,
    themes,
    isSystemTheme,
    isDark,
    isLight,
    toggleTheme,
    cycleTheme
  };
}

/**
 * Hook to get theme-aware icon name for UI components
 */
export function useThemeIcon(): { icon: 'sun' | 'moon' | 'auto'; label: string } {
  const { theme, resolvedTheme, mounted } = useTheme();
  
  if (!mounted) {
    return { icon: 'auto', label: 'Theme' };
  }

  switch (theme) {
    case 'light':
      return { icon: 'sun', label: 'Light theme' };
    case 'dark':
      return { icon: 'moon', label: 'Dark theme' };
    case 'system':
    default:
      return { 
        icon: 'auto', 
        label: `System theme (${resolvedTheme})` 
      };
  }
}

/**
 * Hook to get CSS classes for theme-aware styling
 */
export function useThemeClasses() {
  const { isDark, isLight, theme, mounted } = useTheme();
  
  return {
    mounted,
    isDark,
    isLight,
    isSystem: theme === 'system',
    themeClass: mounted ? (isDark ? 'dark' : 'light') : 'light',
    containerClass: mounted ? 
      `theme-${theme} ${isDark ? 'dark' : 'light'}` : 
      'theme-system light'
  };
}

export default useTheme;