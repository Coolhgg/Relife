/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback } from 'react';
import { getCurrentLanguage, SupportedLanguage } from '../config/i18n';
import {
  CulturalTheme,
  getRegionalTheme,
  applyTheme,
  REGIONAL_THEMES,
} from '../config/themes';

interface UseCulturalThemeOptions {
  autoApply?: boolean;
  followLanguage?: boolean;
  storageKey?: string;
}

interface UseCulturalThemeReturn {
  currentTheme: CulturalTheme;
  availableThemes: CulturalTheme[];
  setTheme: (theme: CulturalTheme | string) => void;
  resetToLanguageTheme: () => void;
  isCustomTheme: boolean;
  themeId: string;
}

/**
 * React hook for managing cultural themes
 * Automatically applies themes based on user language/region
 */
export const useCulturalTheme = (
  options: UseCulturalThemeOptions = {}
): UseCulturalThemeReturn => {
  const {
    autoApply = true,
    followLanguage = true,
    storageKey = 'cultural-theme',
  } = options;

  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>(getCurrentLanguage());
  const [themeId, setThemeId] = useState<string>('');
  const [customTheme, setCustomTheme] = useState<CulturalTheme | null>(null);

  // Get the theme for the current language
  const languageTheme = getRegionalTheme(currentLanguage);
  const currentTheme = customTheme || languageTheme;

  // Check if current theme is different from language default
  const isCustomTheme = customTheme !== null && customTheme.id !== languageTheme.id;

  // Get all available themes
  const availableThemes = Object.values(REGIONAL_THEMES);

  // Load saved theme from storage
  useEffect(() => {
    try {
      const savedThemeId = localStorage.getItem(storageKey);
      if (savedThemeId && REGIONAL_THEMES[savedThemeId]) {
        setThemeId(savedThemeId);
        if (!followLanguage || savedThemeId !== currentLanguage) {
          setCustomTheme(REGIONAL_THEMES[savedThemeId]);
        }
      } else {
        setThemeId(currentLanguage);
      }
    } catch (_error) {
      console.warn('Failed to load theme from storage:', _error);
      setThemeId(currentLanguage);
    }
  }, [storageKey, followLanguage, currentLanguage]);

  // Update language when it changes
  useEffect(() => {
    const newLanguage = getCurrentLanguage();
    if (newLanguage !== currentLanguage) {
      setCurrentLanguage(newLanguage);

      if (followLanguage && !customTheme) {
        setThemeId(newLanguage);
      }
    }
  }, [currentLanguage, followLanguage, customTheme]);

  // Apply theme to DOM
  useEffect(() => {
    if (autoApply) {
      applyTheme(currentTheme);
    }
  }, [currentTheme, autoApply]);

  // Set a new theme
  const setTheme = useCallback(
    (theme: CulturalTheme | string) => {
      const themeObj = typeof theme === 'string' ? REGIONAL_THEMES[theme] : theme;

      if (!themeObj) {
        console._error('Invalid theme:', theme);
        return;
      }

      setThemeId(themeObj.id);
      setCustomTheme(themeObj);

      // Save to storage
      try {
        localStorage.setItem(storageKey, themeObj.id);
      } catch (_error) {
        console.warn('Failed to save theme to storage:', _error);
      }
    },
    [storageKey]
  );

  // Reset to language-based theme
  const resetToLanguageTheme = useCallback(() => {
    setCustomTheme(null);
    setThemeId(currentLanguage);

    // Remove from storage
    try {
      localStorage.removeItem(storageKey);
    } catch (_error) {
      console.warn('Failed to remove theme from storage:', _error);
    }
  }, [currentLanguage, storageKey]);

  return {
    currentTheme,
    availableThemes,
    setTheme,
    resetToLanguageTheme,
    isCustomTheme,
    themeId,
  };
};

/**
 * Theme provider context for React components
 */
export interface CulturalThemeContextValue {
  theme: CulturalTheme;
  setTheme: (theme: CulturalTheme | string) => void;
  availableThemes: CulturalTheme[];
  isCustomTheme: boolean;
  resetToLanguageTheme: () => void;
}

import React, { createContext, useContext, ReactNode } from 'react';

const CulturalThemeContext = createContext<CulturalThemeContextValue | null>(null);

interface CulturalThemeProviderProps {
  children: ReactNode;
  options?: UseCulturalThemeOptions;
}

export const CulturalThemeProvider: React.FC<CulturalThemeProviderProps> = ({
  children,
  options = {},
}) => {
  const themeData = useCulturalTheme(options);

  const contextValue: CulturalThemeContextValue = {
    theme: themeData.currentTheme,
    setTheme: themeData.setTheme,
    availableThemes: themeData.availableThemes,
    isCustomTheme: themeData.isCustomTheme,
    resetToLanguageTheme: themeData.resetToLanguageTheme,
  };

  return (
    <CulturalThemeContext.Provider value={contextValue}>
      {children}
    </CulturalThemeContext.Provider>
  );
};

/**
 * Hook to use cultural theme context
 */
export const useThemeContext = (): CulturalThemeContextValue => {
  const context = useContext(CulturalThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a CulturalThemeProvider');
  }
  return context;
};

/**
 * Higher-order component for theme-aware components
 */
export const withCulturalTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: CulturalTheme }>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { theme } = useThemeContext();
    return <Component {...props} theme={theme} ref={ref} />;
  });
};

/**
 * Utility hook for getting theme-specific styles
 */
export const useThemeStyles = () => {
  const { theme } = useThemeContext();

  const getColorStyle = useCallback(
    (colorKey: keyof CulturalTheme['colors']) => {
      return { color: theme.colors[colorKey] };
    },
    [theme]
  );

  const getBackgroundStyle = useCallback(
    (colorKey: keyof CulturalTheme['colors']) => {
      return { backgroundColor: theme.colors[colorKey] };
    },
    [theme]
  );

  const getBorderStyle = useCallback(
    (colorKey: keyof CulturalTheme['colors'], width = '1px') => {
      return { border: `${width} solid ${theme.colors[colorKey]}` };
    },
    [theme]
  );

  const getGradientStyle = useCallback(
    (gradientKey: keyof CulturalTheme['gradients']) => {
      return { backgroundImage: theme.gradients[gradientKey] };
    },
    [theme]
  );

  const getShadowStyle = useCallback(
    (shadowKey: keyof CulturalTheme['shadows']) => {
      return { boxShadow: theme.shadows[shadowKey] };
    },
    [theme]
  );

  const getFontStyle = useCallback(
    (fontKey: keyof CulturalTheme['fonts']) => {
      return { fontFamily: theme.fonts[fontKey] };
    },
    [theme]
  );

  const getBorderRadiusStyle = useCallback(
    (radiusKey: keyof CulturalTheme['borderRadius']) => {
      return { borderRadius: theme.borderRadius[radiusKey] };
    },
    [theme]
  );

  return {
    theme,
    getColorStyle,
    getBackgroundStyle,
    getBorderStyle,
    getGradientStyle,
    getShadowStyle,
    getFontStyle,
    getBorderRadiusStyle,
  };
};
