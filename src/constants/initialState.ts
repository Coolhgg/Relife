import type { AppState, Theme, ThemeConfig, PersonalizationSettings, ThemePreset } from '../types';

/**
 * Default theme configuration for the 'light' theme
 * Contains comprehensive configuration for colors, typography, spacing, animations, effects, and accessibility
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  id: 'light',
  name: 'light',
  displayName: 'Light',
  description: 'Clean and bright interface',
  category: 'system',
  isCustom: false,
  isPremium: false,
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    accent: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      overlay: 'rgba(0, 0, 0, 0.5)',
      modal: '#ffffff',
      card: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      inverse: '#ffffff',
      disabled: '#94a3b8',
      link: '#0ea5e9'
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#0ea5e9',
      hover: '#94a3b8',
      active: '#0284c7'
    },
    surface: {
      elevated: '#ffffff',
      depressed: '#f1f5f9',
      interactive: '#f8fafc',
      disabled: '#f4f4f5'
    }
  },
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
      monospace: 'Monaco, Consolas, monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em'
    }
  },
  spacing: {
    scale: 1,
    sizes: {
      0: '0px',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      32: '8rem',
      40: '10rem',
      48: '12rem',
      56: '14rem',
      64: '16rem'
    },
    borderRadius: {
      none: '0px',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px'
    }
  },
  animations: {
    enabled: true,
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    scale: 1
  },
  effects: {
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: '0 0 #0000'
    },
    blur: {
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
      '3xl': '64px'
    },
    opacity: {
      disabled: 0.5,
      hover: 0.8,
      focus: 0.9,
      overlay: 0.75
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      secondary: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      accent: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
    }
  },
  accessibility: {
    contrastRatio: 'AA',
    reduceMotion: false,
    highContrast: false,
    largeFonts: false,
    focusVisible: true,
    reducedTransparency: false
  }
};

/**
 * Default personalization settings with sensible defaults for all preference categories
 * Includes color, typography, motion, sound, layout, and accessibility preferences
 */
export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  theme: 'light',
  colorPreferences: {
    favoriteColors: [],
    avoidColors: [],
    colorblindFriendly: false,
    highContrastMode: false,
    saturationLevel: 100,
    brightnessLevel: 100,
    warmthLevel: 50
  },
  typographyPreferences: {
    preferredFontSize: 'medium',
    fontSizeScale: 1,
    preferredFontFamily: 'system',
    lineHeightPreference: 'comfortable',
    letterSpacingPreference: 'normal',
    fontWeight: 'normal',
    dyslexiaFriendly: false
  },
  motionPreferences: {
    enableAnimations: true,
    animationSpeed: 'normal',
    reduceMotion: false,
    preferCrossfade: false,
    enableParallax: true,
    enableHoverEffects: true,
    enableFocusAnimations: true
  },
  soundPreferences: {
    enableSounds: true,
    soundVolume: 70,
    soundTheme: 'default',
    customSounds: {},
    muteOnFocus: false,
    hapticFeedback: true,
    spatialAudio: false
  },
  layoutPreferences: {
    density: 'comfortable',
    navigation: 'bottom',
    cardStyle: 'elevated',
    borderRadius: 'rounded',
    showLabels: true,
    showIcons: true,
    iconSize: 'medium',
    gridColumns: 2,
    listSpacing: 'normal'
  },
  accessibilityPreferences: {
    screenReaderOptimized: false,
    keyboardNavigationOnly: false,
    highContrastMode: false,
    largeTargets: false,
    reducedTransparency: false,
    boldText: false,
    underlineLinks: false,
    flashingElementsReduced: false,
    colorOnlyIndicators: false,
    focusIndicatorStyle: 'outline'
  },
  lastUpdated: new Date(),
  syncAcrossDevices: true
};

/**
 * Default available theme presets including system themes and accessibility options
 * Provides a basic set of themes that users can choose from
 */
export const DEFAULT_AVAILABLE_THEMES: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright interface',
    theme: 'light',
    personalization: {},
    preview: {
      primaryColor: '#0ea5e9',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      cardColor: '#ffffff',
      accentColor: '#ef4444'
    },
    tags: ['system', 'default'],
    isDefault: true,
    isPremium: false,
    popularityScore: 100
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes dark interface',
    theme: 'dark',
    personalization: {},
    preview: {
      primaryColor: '#38bdf8',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      cardColor: '#1e293b',
      accentColor: '#f87171'
    },
    tags: ['system', 'default'],
    isDefault: true,
    isPremium: false,
    popularityScore: 95
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for accessibility',
    theme: 'high-contrast',
    personalization: {},
    preview: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      cardColor: '#ffffff',
      accentColor: '#ff0000'
    },
    tags: ['accessibility'],
    isDefault: false,
    isPremium: false,
    popularityScore: 60
  }
];

/**
 * Complete initial AppState with all required properties and proper TypeScript typing
 * This provides a comprehensive default state that satisfies the AppState interface requirements
 */
export const INITIAL_APP_STATE: Pick<AppState, 'currentTheme' | 'themeConfig' | 'personalization' | 'availableThemes'> = {
  currentTheme: 'light' as Theme,
  themeConfig: DEFAULT_THEME_CONFIG,
  personalization: DEFAULT_PERSONALIZATION,
  availableThemes: DEFAULT_AVAILABLE_THEMES
};