/// <reference lib="dom" />
import React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from 'react';
import {
  Theme,
  ThemeConfig,
  PersonalizationSettings,
  ThemePreset,
  ThemeUsageAnalytics,
  CustomThemeConfig,
} from '../types';
import CloudSyncService, { CloudSyncStatus } from '../services/CloudSyncService';
import ThemePersistenceService from '../services/theme-persistence';
import ThemePerformanceService from '../services/theme-performance';
import ThemeAccessibilityService from '../services/theme-accessibility';
import { PREMIUM_THEMES, PREMIUM_THEME_PRESETS } from '../themes/premium-themes';
import { TimeoutHandle } from '../types/timers';
import PremiumThemeAnimationService, {
  PremiumAnimationEffects,
} from '../services/premium-theme-animations';

export interface ThemeContextValue {
  // Current theme state
  theme: Theme;
  themeConfig: ThemeConfig;
  personalization: PersonalizationSettings;
  isDarkMode: boolean;
  isSystemTheme: boolean;

  // Theme management
  setTheme: (theme: Theme
) => void;
  toggleTheme: (
) => void;
  resetTheme: (
) => void;

  // Personalization
  updatePersonalization: (updates: Partial<PersonalizationSettings>
) => void;
  updateColorPreference: (property: string, value: any
) => void;
  updateTypographyPreference: (property: string, value: any
) => void;
  updateMotionPreference: (property: string, value: any
) => void;
  updateSoundPreference: (property: string, value: any
) => void;
  updateLayoutPreference: (property: string, value: any
) => void;
  updateAccessibilityPreference: (property: string, value: any
) => void;

  // Theme presets and customization
  availableThemes: ThemePreset[];
  createCustomTheme: (
    baseTheme: Theme,
    customizations: any
  
) => Promise<CustomThemeConfig>;
  saveThemePreset: (preset: ThemePreset
) => Promise<void>;
  loadThemePreset: (presetId: string
) => Promise<void>;

  // Analytics and insights
  themeAnalytics: ThemeUsageAnalytics;
  getThemeRecommendations: (
) => ThemePreset[];

  // Persistence
  exportThemes: (
) => Promise<string>;
  importThemes: (data: string
) => Promise<boolean>;
  syncThemes: (
) => Promise<void>;

  // Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  enableCloudSync: (enabled: boolean
) => void;
  forceCloudSync: (
) => Promise<void>;
  resetCloudData: (
) => Promise<void>;
  onCloudSyncStatusChange: (listener: (status: CloudSyncStatus
) => void
) => (
) => void;

  // Utility functions
  getCSSVariables: (
) => Record<string, string>;
  getThemeClasses: (
) => string[];
  isAccessibleContrast: (foreground: string, background: string
) => boolean;
  applyThemeWithPerformance: (options?: {
    animate?: boolean;
    duration?: number;
    immediate?: boolean;
  }
) => Promise<void>;
  preloadTheme: (targetTheme: Theme
) => void;

  // Accessibility functions
  testThemeAccessibility: (
) => {
    overallScore: number;
    issues: string[];
    recommendations: string[];
  };
  getAccessibilityStatus: (
) => {
    hasHighContrast: boolean;
    hasReducedMotion: boolean;
    hasScreenReaderOptimizations: boolean;
    hasSkipLinks: boolean;
    focusVisible: boolean;
  };
  announceThemeChange: (themeName: string, previousTheme?: string
) => void;
  calculateContrastRatio: (
    foreground: string,
    background: string
  
) => { ratio: number; level: string; isAccessible: boolean };
  simulateColorBlindness: (color: string
) => {
    protanopia: string;
    deuteranopia: string;
    tritanopia: string;
    achromatopsia: string;
  };

  // Premium animation functions
  initializePremiumAnimations: (effects?: PremiumAnimationEffects
) => void;
  setAnimationIntensity: (
    intensity: 'subtle' | 'moderate' | 'dynamic' | 'dramatic'
  
) => void;
  setAnimationsEnabled: (enabled: boolean
) => void;
  getDefaultAnimationEffects: (
) => PremiumAnimationEffects;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Default theme configurations
const DEFAULT_THEMES: Record<Theme, ThemeConfig> = {
  // Include premium themes
  ...PREMIUM_THEMES,
  light: {
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
        950: '#082f49',
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
        950: '#020617',
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
        950: '#450a0a',
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
        950: '#09090b',
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
        950: '#052e16',
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
        950: '#451a03',
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
        950: '#450a0a',
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
        950: '#172554',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        overlay: 'rgba(0, 0, 0, 0.5)',
        modal: '#ffffff',
        card: '#ffffff',
      },
      text: {
        primary: '#0f172a',
        secondary: '#334155',
        tertiary: '#64748b',
        inverse: '#ffffff',
        disabled: '#94a3b8',
        link: '#0ea5e9',
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
        focus: '#0ea5e9',
        hover: '#94a3b8',
        active: '#0284c7',
      },
      surface: {
        elevated: '#ffffff',
        depressed: '#f1f5f9',
        interactive: '#f8fafc',
        disabled: '#f4f4f5',
      },
    },
    typography: {
      fontFamily: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Inter, system-ui, sans-serif',
        monospace: 'Monaco, Consolas, monospace',
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
        '5xl': '3rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
      },
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
        64: '16rem',
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
        full: '9999px',
      },
    },
    animations: {
      enabled: true,
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      scale: 1,
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
        none: '0 0 #0000',
      },
      blur: {
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      opacity: {
        disabled: 0.5,
        hover: 0.8,
        focus: 0.9,
        overlay: 0.75,
      },
      gradients: {
        primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        secondary: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        accent: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      },
    },
    accessibility: {
      contrastRatio: 'AA',
      reduceMotion: false,
      highContrast: false,
      largeFonts: false,
      focusVisible: true,
      reducedTransparency: false,
    },
  },
  dark: {
    id: 'dark',
    name: 'dark',
    displayName: 'Dark',
    description: 'Easy on the eyes dark interface',
    category: 'system',
    isCustom: false,
    isPremium: false,
    colors: {
      primary: {
        50: '#082f49',
        100: '#0c4a6e',
        200: '#075985',
        300: '#0369a1',
        400: '#0284c7',
        500: '#0ea5e9',
        600: '#38bdf8',
        700: '#7dd3fc',
        800: '#bae6fd',
        900: '#e0f2fe',
        950: '#f0f9ff',
      },
      secondary: {
        50: '#020617',
        100: '#0f172a',
        200: '#1e293b',
        300: '#334155',
        400: '#475569',
        500: '#64748b',
        600: '#94a3b8',
        700: '#cbd5e1',
        800: '#e2e8f0',
        900: '#f1f5f9',
        950: '#f8fafc',
      },
      accent: {
        50: '#450a0a',
        100: '#7f1d1d',
        200: '#991b1b',
        300: '#b91c1c',
        400: '#dc2626',
        500: '#ef4444',
        600: '#f87171',
        700: '#fca5a5',
        800: '#fecaca',
        900: '#fee2e2',
        950: '#fef2f2',
      },
      neutral: {
        50: '#09090b',
        100: '#18181b',
        200: '#27272a',
        300: '#3f3f46',
        400: '#52525b',
        500: '#71717a',
        600: '#a1a1aa',
        700: '#d4d4d8',
        800: '#e4e4e7',
        900: '#f4f4f5',
        950: '#fafafa',
      },
      success: {
        50: '#052e16',
        100: '#14532d',
        200: '#166534',
        300: '#15803d',
        400: '#16a34a',
        500: '#22c55e',
        600: '#4ade80',
        700: '#86efac',
        800: '#bbf7d0',
        900: '#dcfce7',
        950: '#f0fdf4',
      },
      warning: {
        50: '#451a03',
        100: '#78350f',
        200: '#92400e',
        300: '#b45309',
        400: '#d97706',
        500: '#f59e0b',
        600: '#fbbf24',
        700: '#fcd34d',
        800: '#fde68a',
        900: '#fef3c7',
        950: '#fffbeb',
      },
      error: {
        50: '#450a0a',
        100: '#7f1d1d',
        200: '#991b1b',
        300: '#b91c1c',
        400: '#dc2626',
        500: '#ef4444',
        600: '#f87171',
        700: '#fca5a5',
        800: '#fecaca',
        900: '#fee2e2',
        950: '#fef2f2',
      },
      info: {
        50: '#172554',
        100: '#1e3a8a',
        200: '#1e40af',
        300: '#1d4ed8',
        400: '#2563eb',
        500: '#3b82f6',
        600: '#60a5fa',
        700: '#93c5fd',
        800: '#bfdbfe',
        900: '#dbeafe',
        950: '#eff6ff',
      },
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
        overlay: 'rgba(0, 0, 0, 0.8)',
        modal: '#1e293b',
        card: '#1e293b',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#e2e8f0',
        tertiary: '#cbd5e1',
        inverse: '#0f172a',
        disabled: '#64748b',
        link: '#38bdf8',
      },
      border: {
        primary: '#334155',
        secondary: '#475569',
        focus: '#38bdf8',
        hover: '#64748b',
        active: '#7dd3fc',
      },
      surface: {
        elevated: '#334155',
        depressed: '#1e293b',
        interactive: '#475569',
        disabled: '#334155',
      },
    },
    typography: {
      fontFamily: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Inter, system-ui, sans-serif',
        monospace: 'Monaco, Consolas, monospace',
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
        '5xl': '3rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
      },
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
        64: '16rem',
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
        full: '9999px',
      },
    },
    animations: {
      enabled: true,
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      scale: 1,
    },
    effects: {
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
        none: '0 0 #0000',
      },
      blur: {
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      opacity: {
        disabled: 0.5,
        hover: 0.8,
        focus: 0.9,
        overlay: 0.9,
      },
      gradients: {
        primary: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
        secondary: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
        accent: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      },
    },
    accessibility: {
      contrastRatio: 'AA',
      reduceMotion: false,
      highContrast: false,
      largeFonts: false,
      focusVisible: true,
      reducedTransparency: false,
    },
  },
  auto: {
    id: 'auto',
    name: 'auto',
    displayName: 'Auto',
    description: 'Follows system preference',
    category: 'system',
    isCustom: false,
    isPremium: false,
    // Auto theme uses system CSS to automatically switch between light and dark
    colors: {
      // Colors will be determined by CSS based on prefers-color-scheme
      primary: {
        50: 'rgb(240 249 255)',
        100: 'rgb(224 242 254)',
        200: 'rgb(186 230 253)',
        300: 'rgb(125 211 252)',
        400: 'rgb(56 189 248)',
        500: 'rgb(14 165 233)',
        600: 'rgb(2 132 199)',
        700: 'rgb(3 105 161)',
        800: 'rgb(7 89 133)',
        900: 'rgb(12 74 110)',
        950: 'rgb(8 47 73)',
      },
      secondary: {
        50: 'rgb(248 250 252)',
        100: 'rgb(241 245 249)',
        200: 'rgb(226 232 240)',
        300: 'rgb(203 213 225)',
        400: 'rgb(148 163 184)',
        500: 'rgb(100 116 139)',
        600: 'rgb(71 85 105)',
        700: 'rgb(51 65 85)',
        800: 'rgb(30 41 59)',
        900: 'rgb(15 23 42)',
        950: 'rgb(2 6 23)',
      },
      accent: {
        50: 'rgb(254 242 242)',
        100: 'rgb(254 226 226)',
        200: 'rgb(254 202 202)',
        300: 'rgb(252 165 165)',
        400: 'rgb(248 113 113)',
        500: 'rgb(239 68 68)',
        600: 'rgb(220 38 38)',
        700: 'rgb(185 28 28)',
        800: 'rgb(153 27 27)',
        900: 'rgb(127 29 29)',
        950: 'rgb(69 10 10)',
      },
      neutral: {
        50: 'rgb(250 250 250)',
        100: 'rgb(245 245 245)',
        200: 'rgb(229 229 229)',
        300: 'rgb(212 212 212)',
        400: 'rgb(163 163 163)',
        500: 'rgb(115 115 115)',
        600: 'rgb(82 82 82)',
        700: 'rgb(64 64 64)',
        800: 'rgb(38 38 38)',
        900: 'rgb(23 23 23)',
        950: 'rgb(10 10 10)',
      },
      background: {
        primary: 'rgb(255 255 255)',
        secondary: 'rgb(248 250 252)',
        tertiary: 'rgb(241 245 249)',
      },
      foreground: {
        primary: 'rgb(15 23 42)',
        secondary: 'rgb(51 65 85)',
        tertiary: 'rgb(100 116 139)',
      },
      border: {
        primary: 'rgb(226 232 240)',
        secondary: 'rgb(203 213 225)',
      },
    },
    accessibility: {
      highContrast: false,
      focusVisible: true,
      reducedTransparency: false,
    },
  },
  system: {
    id: 'system',
    name: 'system',
    displayName: 'System',
    description: 'Follows system preference',
    category: 'system',
    isCustom: false,
    isPremium: false,
    // System theme uses CSS to follow system prefers-color-scheme
    colors: {
      // Colors adapt to system preference automatically
      primary: {
        50: 'rgb(240 249 255)',
        100: 'rgb(224 242 254)',
        200: 'rgb(186 230 253)',
        300: 'rgb(125 211 252)',
        400: 'rgb(56 189 248)',
        500: 'rgb(14 165 233)',
        600: 'rgb(2 132 199)',
        700: 'rgb(3 105 161)',
        800: 'rgb(7 89 133)',
        900: 'rgb(12 74 110)',
        950: 'rgb(8 47 73)',
      },
      secondary: {
        50: 'rgb(248 250 252)',
        100: 'rgb(241 245 249)',
        200: 'rgb(226 232 240)',
        300: 'rgb(203 213 225)',
        400: 'rgb(148 163 184)',
        500: 'rgb(100 116 139)',
        600: 'rgb(71 85 105)',
        700: 'rgb(51 65 85)',
        800: 'rgb(30 41 59)',
        900: 'rgb(15 23 42)',
        950: 'rgb(2 6 23)',
      },
      accent: {
        50: 'rgb(254 242 242)',
        100: 'rgb(254 226 226)',
        200: 'rgb(254 202 202)',
        300: 'rgb(252 165 165)',
        400: 'rgb(248 113 113)',
        500: 'rgb(239 68 68)',
        600: 'rgb(220 38 38)',
        700: 'rgb(185 28 28)',
        800: 'rgb(153 27 27)',
        900: 'rgb(127 29 29)',
        950: 'rgb(69 10 10)',
      },
      neutral: {
        50: 'rgb(250 250 250)',
        100: 'rgb(245 245 245)',
        200: 'rgb(229 229 229)',
        300: 'rgb(212 212 212)',
        400: 'rgb(163 163 163)',
        500: 'rgb(115 115 115)',
        600: 'rgb(82 82 82)',
        700: 'rgb(64 64 64)',
        800: 'rgb(38 38 38)',
        900: 'rgb(23 23 23)',
        950: 'rgb(10 10 10)',
      },
      background: {
        primary: 'rgb(255 255 255)',
        secondary: 'rgb(248 250 252)',
        tertiary: 'rgb(241 245 249)',
      },
      foreground: {
        primary: 'rgb(15 23 42)',
        secondary: 'rgb(51 65 85)',
        tertiary: 'rgb(100 116 139)',
      },
      border: {
        primary: 'rgb(226 232 240)',
        secondary: 'rgb(203 213 225)',
      },
    },
    accessibility: {
      highContrast: false,
      focusVisible: true,
      reducedTransparency: false,
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'high-contrast',
    displayName: 'High Contrast',
    description: 'Maximum contrast for accessibility',
    category: 'accessibility',
    isCustom: false,
    isPremium: false,
    colors: {
      primary: {
        50: '#000000',
        100: '#1a1a1a',
        200: '#333333',
        300: '#4d4d4d',
        400: '#666666',
        500: '#000000',
        600: '#000000',
        700: '#000000',
        800: '#000000',
        900: '#000000',
        950: '#000000',
      },
      secondary: {
        50: '#ffffff',
        100: '#f5f5f5',
        200: '#ebebeb',
        300: '#e0e0e0',
        400: '#d6d6d6',
        500: '#ffffff',
        600: '#ffffff',
        700: '#ffffff',
        800: '#ffffff',
        900: '#ffffff',
        950: '#ffffff',
      },
      accent: {
        50: '#ff0000',
        100: '#ff1a1a',
        200: '#ff3333',
        300: '#ff4d4d',
        400: '#ff6666',
        500: '#ff0000',
        600: '#ff0000',
        700: '#ff0000',
        800: '#ff0000',
        900: '#ff0000',
        950: '#ff0000',
      },
      neutral: {
        50: '#000000',
        100: '#1a1a1a',
        200: '#333333',
        300: '#4d4d4d',
        400: '#666666',
        500: '#808080',
        600: '#999999',
        700: '#b3b3b3',
        800: '#cccccc',
        900: '#e6e6e6',
        950: '#ffffff',
      },
      success: {
        50: '#00ff00',
        100: '#1aff1a',
        200: '#33ff33',
        300: '#4dff4d',
        400: '#66ff66',
        500: '#00ff00',
        600: '#00ff00',
        700: '#00ff00',
        800: '#00ff00',
        900: '#00ff00',
        950: '#00ff00',
      },
      warning: {
        50: '#ffff00',
        100: '#ffff1a',
        200: '#ffff33',
        300: '#ffff4d',
        400: '#ffff66',
        500: '#ffff00',
        600: '#ffff00',
        700: '#ffff00',
        800: '#ffff00',
        900: '#ffff00',
        950: '#ffff00',
      },
      error: {
        50: '#ff0000',
        100: '#ff1a1a',
        200: '#ff3333',
        300: '#ff4d4d',
        400: '#ff6666',
        500: '#ff0000',
        600: '#ff0000',
        700: '#ff0000',
        800: '#ff0000',
        900: '#ff0000',
        950: '#ff0000',
      },
      info: {
        50: '#0000ff',
        100: '#1a1aff',
        200: '#3333ff',
        300: '#4d4dff',
        400: '#6666ff',
        500: '#0000ff',
        600: '#0000ff',
        700: '#0000ff',
        800: '#0000ff',
        900: '#0000ff',
        950: '#0000ff',
      },
      background: {
        primary: '#ffffff',
        secondary: '#ffffff',
        tertiary: '#ffffff',
        overlay: 'rgba(0, 0, 0, 0.9)',
        modal: '#ffffff',
        card: '#ffffff',
      },
      text: {
        primary: '#000000',
        secondary: '#000000',
        tertiary: '#000000',
        inverse: '#ffffff',
        disabled: '#666666',
        link: '#0000ff',
      },
      border: {
        primary: '#000000',
        secondary: '#000000',
        focus: '#ff0000',
        hover: '#000000',
        active: '#000000',
      },
      surface: {
        elevated: '#ffffff',
        depressed: '#ffffff',
        interactive: '#ffffff',
        disabled: '#cccccc',
      },
    },
    typography: {
      fontFamily: {
        primary: 'Arial, sans-serif',
        secondary: 'Arial, sans-serif',
        monospace: 'Courier, monospace',
      },
      fontSize: {
        xs: '0.875rem',
        sm: '1rem',
        base: '1.125rem',
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '1.75rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      fontWeight: {
        light: 400,
        normal: 600,
        medium: 700,
        semibold: 700,
        bold: 800,
        extrabold: 900,
      },
      lineHeight: {
        tight: 1.375,
        normal: 1.625,
        relaxed: 1.75,
        loose: 2.25,
      },
      letterSpacing: {
        tight: '0em',
        normal: '0.025em',
        wide: '0.05em',
      },
    },
    spacing: {
      scale: 1.25,
      sizes: {
        0: '0px',
        1: '0.3125rem',
        2: '0.625rem',
        3: '0.9375rem',
        4: '1.25rem',
        5: '1.5625rem',
        6: '1.875rem',
        8: '2.5rem',
        10: '3.125rem',
        12: '3.75rem',
        16: '5rem',
        20: '6.25rem',
        24: '7.5rem',
        32: '10rem',
        40: '12.5rem',
        48: '15rem',
        56: '17.5rem',
        64: '20rem',
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        base: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
    },
    animations: {
      enabled: false,
      duration: {
        fast: '0ms',
        normal: '0ms',
        slow: '0ms',
      },
      easing: {
        linear: 'linear',
        ease: 'linear',
        easeIn: 'linear',
        easeOut: 'linear',
        easeInOut: 'linear',
        bounce: 'linear',
        elastic: 'linear',
      },
      scale: 0,
    },
    effects: {
      shadows: {
        sm: 'none',
        base: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
        none: 'none',
      },
      blur: {
        sm: '0px',
        base: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
      opacity: {
        disabled: 1,
        hover: 1,
        focus: 1,
        overlay: 1,
      },
      gradients: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#ff0000',
        background: '#ffffff',
      },
    },
    accessibility: {
      contrastRatio: 'AAA',
      reduceMotion: true,
      highContrast: true,
      largeFonts: true,
      focusVisible: true,
      reducedTransparency: true,
    },
  },
  minimalist: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for minimalist theme
    id: 'minimalist',
    name: 'minimalist',
    displayName: 'Minimalist',
    description: 'Clean and simple design',
    category: 'abstract',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712',
      },
    },
  },
  colorful: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for colorful theme
    id: 'colorful',
    name: 'colorful',
    displayName: 'Colorful',
    description: 'Vibrant and energetic design',
    category: 'abstract',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843',
        950: '#500724',
      },
      accent: {
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
        950: '#082f49',
      },
    },
    effects: {
      ...DEFAULT_THEMES.light.effects,
      gradients: {
        primary: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #38bdf8 100%)',
        secondary: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%)',
        accent: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #f0f9ff 100%)',
      },
    },
  },
  nature: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for nature theme
    id: 'nature',
    name: 'nature',
    displayName: 'Nature',
    description: 'Earth tones and natural colors',
    category: 'nature',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
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
        950: '#052e16',
      },
      secondary: {
        50: '#fefce8',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03',
      },
    },
  },
  ocean: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for ocean theme
    id: 'ocean',
    name: 'ocean',
    displayName: 'Ocean',
    description: 'Deep blue ocean-inspired theme',
    category: 'nature',
    isPremium: true,
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
        950: '#083344',
      },
    },
  },
  sunset: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for sunset theme
    id: 'sunset',
    name: 'sunset',
    displayName: 'Sunset',
    description: 'Warm sunset gradient colors',
    category: 'gradient',
    isPremium: true,
    effects: {
      ...DEFAULT_THEMES.light.effects,
      gradients: {
        primary: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
        secondary: 'linear-gradient(135deg, #ff6a6b 0%, #ffa726 100%)',
        accent: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)',
        background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
      },
    },
  },
  forest: {
    // Spread base dark theme first
    ...DEFAULT_THEMES.dark,
    // Override with unique properties for forest theme
    id: 'forest',
    name: 'forest',
    displayName: 'Forest',
    description: 'Deep forest greens',
    category: 'nature',
    isPremium: true,
    colors: {
      ...DEFAULT_THEMES.dark.colors,
      background: {
        primary: '#064e3b',
        secondary: '#065f46',
        tertiary: '#047857',
        overlay: 'rgba(6, 78, 59, 0.9)',
        modal: '#065f46',
        card: '#065f46',
      },
    },
  },
  cosmic: {
    // Spread base dark theme first
    ...DEFAULT_THEMES.dark,
    // Override with unique properties for cosmic theme
    id: 'cosmic',
    name: 'cosmic',
    displayName: 'Cosmic',
    description: 'Deep space purple theme',
    category: 'gradient',
    isPremium: true,
    effects: {
      ...DEFAULT_THEMES.dark.effects,
      gradients: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
        accent: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      },
    },
  },
  gradient: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for gradient theme
    id: 'gradient',
    name: 'gradient',
    displayName: 'Gradient',
    description: 'Dynamic gradient theme',
    category: 'gradient',
    isPremium: true,
    effects: {
      ...DEFAULT_THEMES.light.effects,
      gradients: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      },
    },
  },
  neon: {
    // Spread base dark theme first
    ...DEFAULT_THEMES.dark,
    // Override with unique properties for neon theme
    id: 'neon',
    name: 'neon',
    displayName: 'Neon',
    description: 'Electric neon colors',
    category: 'abstract',
    isPremium: true,
    colors: {
      ...DEFAULT_THEMES.dark.colors,
      accent: {
        50: '#00ffff',
        100: '#1affff',
        200: '#33ffff',
        300: '#4dffff',
        400: '#66ffff',
        500: '#00ffff',
        600: '#00e6e6',
        700: '#00cccc',
        800: '#00b3b3',
        900: '#009999',
        950: '#008080',
      },
    },
  },
  pastel: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for pastel theme
    id: 'pastel',
    name: 'pastel',
    displayName: 'Pastel',
    description: 'Soft pastel colors',
    category: 'abstract',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843',
        950: '#500724',
      },
    },
  },
  monochrome: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for monochrome theme
    id: 'monochrome',
    name: 'monochrome',
    displayName: 'Monochrome',
    description: 'Black and white only',
    category: 'abstract',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#ffffff',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
        950: '#000000',
      },
    },
  },
  gaming: {
    // Spread base dark theme first
    ...DEFAULT_THEMES.dark,
    // Override with unique properties for gaming theme
    id: 'gaming',
    name: 'gaming',
    displayName: 'Gaming',
    description: 'Dark theme with neon gaming aesthetics',
    category: 'specialized',
    colors: {
      ...DEFAULT_THEMES.dark.colors,
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#00ff88', // Neon green
        600: '#00cc6a',
        700: '#009954',
        800: '#006b3c',
        900: '#004d2a',
        950: '#003319',
      },
      accent: {
        50: '#fff0f7',
        100: '#ffe0f2',
        200: '#ffc1e6',
        300: '#ff92d0',
        400: '#ff54b1',
        500: '#ff007f', // Neon pink
        600: '#e6006b',
        700: '#cc005d',
        800: '#b30052',
        900: '#990047',
        950: '#800040',
      },
      secondary: {
        50: '#f0f0ff',
        100: '#e0e0ff',
        200: '#c1c1ff',
        300: '#9292ff',
        400: '#5454ff',
        500: '#4040ff', // Electric blue
        600: '#3333e6',
        700: '#2929cc',
        800: '#2020b3',
        900: '#1a1a99',
        950: '#151580',
      },
    },
    effects: {
      ...DEFAULT_THEMES.dark.effects,
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 255, 136, 0.1)',
        md: '0 4px 6px -1px rgba(0, 255, 136, 0.1), 0 2px 4px -1px rgba(0, 255, 136, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 255, 136, 0.1), 0 4px 6px -2px rgba(0, 255, 136, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 255, 136, 0.1), 0 10px 10px -5px rgba(0, 255, 136, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 255, 136, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 255, 136, 0.06)',
      },
      gradients: {
        primary: 'linear-gradient(135deg, #00ff88 0%, #4040ff 100%)',
        secondary: 'linear-gradient(135deg, #ff007f 0%, #00ff88 100%)',
        accent: 'linear-gradient(135deg, #4040ff 0%, #ff007f 100%)',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a0a 100%)',
      },
    },
  },
  professional: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for professional theme
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    description: 'Clean business theme with corporate colors',
    category: 'specialized',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#475569', // Professional blue-gray
        600: '#334155',
        700: '#1e293b',
        800: '#0f172a',
        900: '#020617',
        950: '#000000',
      },
      accent: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Professional green
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#0a2e19',
      },
    },
    typography: {
      ...DEFAULT_THEMES.light.typography,
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  },
  retro: {
    // Spread base dark theme first
    ...DEFAULT_THEMES.dark,
    // Override with unique properties for retro theme
    id: 'retro',
    name: 'retro',
    displayName: 'Retro',
    description: '80s inspired theme with vibrant colors',
    category: 'specialized',
    isPremium: true,
    colors: {
      ...DEFAULT_THEMES.dark.colors,
      primary: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ff1493', // Hot pink
        600: '#e6127a',
        700: '#cc1068',
        800: '#b30e57',
        900: '#990c49',
        950: '#800a3d',
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#00bfff', // Electric blue
        600: '#0099cc',
        700: '#0077aa',
        800: '#005588',
        900: '#003d66',
        950: '#002544',
      },
      accent: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#ff6600', // Electric orange
        600: '#e55500',
        700: '#cc4400',
        800: '#b33300',
        900: '#992200',
        950: '#801100',
      },
    },
    effects: {
      ...DEFAULT_THEMES.dark.effects,
      gradients: {
        primary: 'linear-gradient(135deg, #ff1493 0%, #00bfff 100%)',
        secondary: 'linear-gradient(135deg, #ff6600 0%, #ff1493 100%)',
        accent: 'linear-gradient(135deg, #00bfff 0%, #ff6600 100%)',
        background: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #001133 100%)',
      },
    },
  },
  cyberpunk: {
    // Spread base dark theme first
    ...DEFAULT_THEMES.dark,
    // Override with unique properties for cyberpunk theme
    id: 'cyberpunk',
    name: 'cyberpunk',
    displayName: 'Cyberpunk',
    description: 'Futuristic neon theme with high contrast',
    category: 'specialized',
    isPremium: true,
    colors: {
      ...DEFAULT_THEMES.dark.colors,
      primary: {
        50: '#f0fff0',
        100: '#e0ffe0',
        200: '#c1ffc1',
        300: '#92ff92',
        400: '#54ff54',
        500: '#00ff00', // Matrix green
        600: '#00e600',
        700: '#00cc00',
        800: '#00b300',
        900: '#009900',
        950: '#008000',
      },
      secondary: {
        50: '#fff0ff',
        100: '#ffe0ff',
        200: '#ffc1ff',
        300: '#ff92ff',
        400: '#ff54ff',
        500: '#ff00ff', // Neon magenta
        600: '#e600e6',
        700: '#cc00cc',
        800: '#b300b3',
        900: '#990099',
        950: '#800080',
      },
      accent: {
        50: '#f0ffff',
        100: '#e0ffff',
        200: '#c1ffff',
        300: '#92ffff',
        400: '#54ffff',
        500: '#00ffff', // Cyan
        600: '#00e6e6',
        700: '#00cccc',
        800: '#00b3b3',
        900: '#009999',
        950: '#008080',
      },
      background: {
        primary: '#000011',
        secondary: '#110022',
        tertiary: '#220033',
        overlay: 'rgba(0, 0, 17, 0.95)',
        modal: '#000011',
        card: '#110022',
      },
    },
    effects: {
      ...DEFAULT_THEMES.dark.effects,
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 255, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 255, 0, 0.3), 0 2px 4px -1px rgba(0, 255, 255, 0.2)',
        lg: '0 10px 15px -3px rgba(0, 255, 0, 0.3), 0 4px 6px -2px rgba(255, 0, 255, 0.2)',
        xl: '0 20px 25px -5px rgba(0, 255, 0, 0.3), 0 10px 10px -5px rgba(0, 255, 255, 0.2)',
        '2xl': '0 25px 50px -12px rgba(0, 255, 0, 0.5)',
        inner: 'inset 0 2px 4px 0 rgba(0, 255, 0, 0.2)',
      },
      gradients: {
        primary: 'linear-gradient(135deg, #00ff00 0%, #ff00ff 100%)',
        secondary: 'linear-gradient(135deg, #00ffff 0%, #00ff00 100%)',
        accent: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
        background: 'linear-gradient(135deg, #000011 0%, #110022 50%, #220011 100%)',
      },
    },
  },
  spring: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for spring theme
    id: 'spring',
    name: 'spring',
    displayName: 'Spring',
    description: 'Fresh spring colors with soft greens and pastels',
    category: 'seasonal',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Spring green
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#0a2e19',
      },
      secondary: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308', // Spring yellow
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
        950: '#422006',
      },
      accent: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899', // Spring pink
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843',
        950: '#500724',
      },
    },
  },
  summer: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for summer theme
    id: 'summer',
    name: 'summer',
    displayName: 'Summer',
    description: 'Warm summer colors with bright blues and oranges',
    category: 'seasonal',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // Summer blue
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49',
      },
      secondary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316', // Summer orange
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
        950: '#431407',
      },
      accent: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308', // Summer yellow
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
        950: '#422006',
      },
    },
  },
  autumn: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for autumn theme
    id: 'autumn',
    name: 'autumn',
    displayName: 'Autumn',
    description: 'Rich autumn colors with warm browns and oranges',
    category: 'seasonal',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#fef7f0',
        100: '#fdedd3',
        200: '#fad7a6',
        300: '#f7b96e',
        400: '#f39234',
        500: '#f07316', // Autumn orange
        600: '#e1570c',
        700: '#bb420c',
        800: '#963512',
        900: '#782e12',
        950: '#411505',
      },
      secondary: {
        50: '#fdf8f6',
        100: '#f2e8e5',
        200: '#eaddd7',
        300: '#e0cec7',
        400: '#d2bab0',
        500: '#bfa094', // Autumn brown
        600: '#a18072',
        700: '#977669',
        800: '#846358',
        900: '#43302b',
        950: '#292017',
      },
      accent: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308', // Autumn gold
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
        950: '#422006',
      },
    },
  },
  winter: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for winter theme
    id: 'winter',
    name: 'winter',
    displayName: 'Winter',
    description: 'Cool winter colors with icy blues and whites',
    category: 'seasonal',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b', // Winter blue-gray
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // Winter ice blue
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49',
      },
      accent: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6', // Winter teal
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
        950: '#042f2e',
      },
    },
  },
  focus: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for focus theme
    id: 'focus',
    name: 'focus',
    displayName: 'Focus',
    description: 'Minimal distraction theme optimized for concentration',
    category: 'specialized',
    colors: {
      ...DEFAULT_THEMES.light.colors,
      primary: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a', // Neutral focus
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
      },
      secondary: {
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
        950: '#09090b',
      },
      accent: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // Minimal blue accent
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49',
      },
    },
    animations: {
      enabled: false, // Disabled for focus
      duration: 'fast',
      easing: 'ease',
      scale: 0.5,
    },
  },
  custom: {
    // Spread base light theme first
    ...DEFAULT_THEMES.light,
    // Override with unique properties for custom theme
    id: 'custom',
    name: 'custom',
    displayName: 'Custom',
    description: 'User-defined theme',
    category: 'custom',
    isCustom: true,
  },
};

// Default personalization settings
const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  theme: 'light',
  colorPreferences: {
    favoriteColors: [],
    avoidColors: [],
    colorblindFriendly: false,
    highContrastMode: false,
    saturationLevel: 100,
    brightnessLevel: 100,
    warmthLevel: 50,
  },
  typographyPreferences: {
    preferredFontSize: 'medium',
    fontSizeScale: 1,
    preferredFontFamily: 'system',
    lineHeightPreference: 'comfortable',
    letterSpacingPreference: 'normal',
    fontWeight: 'normal',
    dyslexiaFriendly: false,
  },
  motionPreferences: {
    enableAnimations: true,
    animationSpeed: 'normal',
    reduceMotion: false,
    preferCrossfade: false,
    enableParallax: true,
    enableHoverEffects: true,
    enableFocusAnimations: true,
  },
  soundPreferences: {
    enableSounds: true,
    soundVolume: 70,
    soundTheme: 'default',
    customSounds: {},
    muteOnFocus: false,
    hapticFeedback: true,
    spatialAudio: false,
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
    listSpacing: 'normal',
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
    focusIndicatorStyle: 'outline',
  },
  lastUpdated: new Date(),
  syncAcrossDevices: true,
};

// Theme provider hook
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'relife-theme',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(
    DEFAULT_THEMES[defaultTheme]
  );
  const [personalization, setPersonalizationState] = useState<PersonalizationSettings>(
    DEFAULT_PERSONALIZATION
  );
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    hasConflicts: false,
    pendingChanges: 0,
    error: null,
  });
  const cloudSyncServiceRef = useRef<CloudSyncService | null>(null);
  const syncListenersRef = useRef<((status: CloudSyncStatus
) => void)[]>([]);
  const persistenceServiceRef = useRef<ThemePersistenceService | null>(null);
  const [availableThemes] = useState<ThemePreset[]>([
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
        accentColor: '#ef4444',
      },
      tags: ['system', 'default'],
      isDefault: true,
      isPremium: false,
      popularityScore: 100,
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
        accentColor: '#f87171',
      },
      tags: ['system', 'default'],
      isDefault: true,
      isPremium: false,
      popularityScore: 95,
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
        accentColor: '#ff0000',
      },
      tags: ['accessibility'],
      isDefault: false,
      isPremium: false,
      popularityScore: 60,
    },
    // Include premium themes
    ...PREMIUM_THEME_PRESETS,
  ]);
  const [themeAnalytics] = useState<ThemeUsageAnalytics>({
    mostUsedThemes: [],
    timeSpentPerTheme: [],
    switchFrequency: 0,
    favoriteColors: [],
    accessibilityFeatureUsage: [],
    customizationActivity: [],
  });

  // Initialize theme from enhanced persistence service
  useEffect((
) => {
    const initializeThemeData = async (
) => {
      try {
        // Initialize persistence service
        if (!persistenceServiceRef.current) {
          persistenceServiceRef.current = ThemePersistenceService.getInstance();
        }

        const themeData = await persistenceServiceRef.current.loadThemeData();

        // Set theme from stored data or system preference
        let selectedTheme = themeData.theme;
        if (enableSystem && (!themeData.theme || themeData.theme === 'system')) {
          selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        if (
          selectedTheme &&
          Object.keys(DEFAULT_THEMES).includes(selectedTheme) &&
          selectedTheme !== theme
        ) {
          setThemeState(selectedTheme);
          setThemeConfig(themeData.themeConfig || DEFAULT_THEMES[selectedTheme]);
        }

        // Load personalization settings
        if (
          themeData.personalization &&
          Object.keys(themeData.personalization).length > 0
        ) {
          setPersonalizationState({
            ...DEFAULT_PERSONALIZATION,
            ...themeData.personalization,
          });
        }
      } catch (error) {
        console.error('Failed to initialize theme data:', error);

        // Fallback to old localStorage method
        const storedTheme = localStorage.getItem(storageKey);
        const storedPersonalization = localStorage.getItem(
          `${storageKey}-personalization`
        );

        if (storedTheme && Object.keys(DEFAULT_THEMES).includes(storedTheme as Theme)) {
          setThemeState(storedTheme as Theme);
          setThemeConfig(DEFAULT_THEMES[storedTheme as Theme]);
        } else if (enableSystem) {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          setThemeState(systemTheme);
          setThemeConfig(DEFAULT_THEMES[systemTheme]);
        }

        if (storedPersonalization) {
          try {
            const parsed = JSON.parse(storedPersonalization);
            setPersonalizationState({ ...DEFAULT_PERSONALIZATION, ...parsed });
          } catch (parseError) {
            console.warn(
              'Failed to parse stored personalization settings:',
              parseError
            );
          }
        }
      }
    };

    initializeThemeData();
  }, [defaultTheme, enableSystem, storageKey, theme]);

  // Apply theme to DOM
  useEffect((
) => {
    const root = document.documentElement;

    // Apply theme class
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme}`);

    // Apply CSS custom properties
    const cssVars = getCSSVariables();
    Object.entries(cssVars).forEach(([property, value]
) => {
      root.style.setProperty(property, value);
    });

    // Apply accessibility preferences
    if (
      personalization.accessibilityPreferences.reduceMotion ||
      personalization.motionPreferences.reduceMotion
    ) {
      root.style.setProperty('--animation-duration-multiplier', '0');
    } else {
      const speedMultiplier =
        personalization.motionPreferences.animationSpeed === 'slow'
          ? '1.5'
          : personalization.motionPreferences.animationSpeed === 'fast'
            ? '0.5'
            : '1';
      root.style.setProperty('--animation-duration-multiplier', speedMultiplier);
    }

    // Apply font size scale
    if (personalization.typographyPreferences.fontSizeScale !== 1) {
      root.style.setProperty(
        '--font-size-scale',
        personalization.typographyPreferences.fontSizeScale.toString()
      );
    }
  }, [theme, themeConfig, personalization]);

  // Listen for system theme changes
  useEffect((
) => {
    if (!enableSystem || (theme !== 'system' && theme !== 'auto')) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent
) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      setThemeConfig(DEFAULT_THEMES[systemTheme]);
    };

    mediaQuery.addEventListener('change', handleChange);
    return (
) => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, enableSystem]);

  // Initialize cloud sync service
  useEffect((
) => {
    cloudSyncServiceRef.current = CloudSyncService.getInstance();

    const syncService = cloudSyncServiceRef.current;

    // Listen for sync status changes
    const unsubscribe = syncService.onStatusChange((status: any
) => { // auto
      setCloudSyncStatus(status);
      // Notify all registered listeners
      syncListenersRef.current.forEach((listener: any
) => listener(status));
    });

    // Initialize with current status
    setCloudSyncStatus(syncService.getStatus());

    // Start auto-sync if enabled
    syncService.initialize().catch((error: any
) => { // auto
      console.error('Failed to initialize cloud sync:', error);
    });

    return (
) => {
      unsubscribe();
    };
  }, []);

  // Sync preferences when they change
  useEffect((
) => {
    if (!cloudSyncServiceRef.current) return;

    const syncService = cloudSyncServiceRef.current;
    const preferences = {
      theme,
      personalization,
      lastModified: new Date(),
      deviceId: syncService.getDeviceId(),
      version: Date.now(),
    };

    // Debounce sync to avoid too frequent calls
    const timeoutId = setTimeout((
) => {
      syncService.updatePreferences(preferences).catch((error: any
) => { // auto
        console.error('Failed to sync preferences:', error);
      });
    }, 1000);

    return (
) => clearTimeout(timeoutId);
  }, [theme, personalization]);

  const setTheme = useCallback(
    (newTheme: Theme
) => {
      if (!Object.keys(DEFAULT_THEMES).includes(newTheme)) {
        console.error(`Unknown theme: ${newTheme}`);
        return;
      }

      setThemeState(newTheme);
      setThemeConfig(DEFAULT_THEMES[newTheme]);
      localStorage.setItem(storageKey, newTheme);

      // Update personalization theme
      const updatedPersonalization = {
        ...personalization,
        theme: newTheme,
        lastUpdated: new Date(),
      };
      setPersonalizationState(updatedPersonalization);
      localStorage.setItem(
        `${storageKey}-personalization`,
        JSON.stringify(updatedPersonalization)
      );
    },
    [storageKey, personalization]
  );

  const toggleTheme = useCallback((
) => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  const resetTheme = useCallback((
) => {
    setTheme(defaultTheme);
    setPersonalizationState(DEFAULT_PERSONALIZATION);
    localStorage.removeItem(`${storageKey}-personalization`);
  }, [defaultTheme, setTheme, storageKey]);

  const updatePersonalization = useCallback(
    (updates: Partial<PersonalizationSettings>
) => {
      const updatedPersonalization = {
        ...personalization,
        ...updates,
        lastUpdated: new Date(),
      };
      setPersonalizationState(updatedPersonalization);

      // Save to enhanced persistence service
      if (persistenceServiceRef.current) {
        persistenceServiceRef.current.saveThemeData({
          personalization: updatedPersonalization,
        });
      }

      // Fallback to localStorage
      localStorage.setItem(
        `${storageKey}-personalization`,
        JSON.stringify(updatedPersonalization)
      );
    },
    [personalization, storageKey]
  );

  const updateColorPreference = useCallback(
    (property: string, value: any
) => {
      updatePersonalization({
        colorPreferences: {
          ...personalization.colorPreferences,
          [property]: value,
        },
      });
    },
    [personalization, updatePersonalization]
  );

  const updateTypographyPreference = useCallback(
    (property: string, value: any
) => {
      updatePersonalization({
        typographyPreferences: {
          ...personalization.typographyPreferences,
          [property]: value,
        },
      });
    },
    [personalization, updatePersonalization]
  );

  const updateMotionPreference = useCallback(
    (property: string, value: any
) => {
      updatePersonalization({
        motionPreferences: {
          ...personalization.motionPreferences,
          [property]: value,
        },
      });
    },
    [personalization, updatePersonalization]
  );

  const updateSoundPreference = useCallback(
    (property: string, value: any
) => {
      updatePersonalization({
        soundPreferences: {
          ...personalization.soundPreferences,
          [property]: value,
        },
      });
    },
    [personalization, updatePersonalization]
  );

  const updateLayoutPreference = useCallback(
    (property: string, value: any
) => {
      updatePersonalization({
        layoutPreferences: {
          ...personalization.layoutPreferences,
          [property]: value,
        },
      });
    },
    [personalization, updatePersonalization]
  );

  const updateAccessibilityPreference = useCallback(
    (property: string, value: any
) => {
      updatePersonalization({
        accessibilityPreferences: {
          ...personalization.accessibilityPreferences,
          [property]: value,
        },
      });
    },
    [personalization, updatePersonalization]
  );

  const createCustomTheme = useCallback(
    async (baseTheme: Theme, customizations: any): Promise<CustomThemeConfig> => {
      // This would integrate with a backend service in a real app
      const customTheme: CustomThemeConfig = {
        ...DEFAULT_THEMES[baseTheme],
        id: `custom-${Date.now()}`,
        name: `custom-${Date.now()}`,
        displayName: `Custom Theme ${Date.now()}`,
        description: 'User-created custom theme',
        baseTheme,
        customizations,
        isShared: false,
        isCustom: true,
      };

      return customTheme;
    },
    []
  );

  const saveThemePreset = useCallback(async (preset: ThemePreset): Promise<void> => {
    // This would save to backend in a real app
    console.log('Saving theme preset:', preset);
  }, []);

  const loadThemePreset = useCallback(
    async (presetId: string): Promise<void> => {
      const preset = availableThemes.find((t: any
) => t.id === presetId);
      if (preset) {
        setTheme(preset.theme);
        if (preset.personalization) {
          updatePersonalization(preset.personalization);
        }
      }
    },
    [availableThemes, setTheme, updatePersonalization]
  );

  const getThemeRecommendations = useCallback((): ThemePreset[] => {
    // This would use AI/ML in a real app
    return availableThemes.filter((theme: any) => !theme.isDefault).slice(0, 3);
  }, [availableThemes]);

  const exportThemes = useCallback(async (): Promise<string> => {
    if (persistenceServiceRef.current) {
      return await persistenceServiceRef.current.exportThemes();
    }

    // Fallback to basic export
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      themes: [],
      personalization,
      metadata: {
        appVersion: '1.0.0',
        platform: 'web',
      },
    };
    return JSON.stringify(exportData, null, 2);
  }, [personalization]);

  const importThemes = useCallback(
    async (data: string): Promise<boolean> => {
      if (persistenceServiceRef.current) {
        const success = await persistenceServiceRef.current.importThemes(data);
        if (success) {
          // Reload theme data after successful import
          const themeData = await persistenceServiceRef.current.loadThemeData();
          if (themeData.theme) {
            setThemeState(themeData.theme);
            setThemeConfig(themeData.themeConfig || DEFAULT_THEMES[themeData.theme]);
          }
          if (themeData.personalization) {
            setPersonalizationState(themeData.personalization);
          }
        }
        return success;
      }

      // Fallback to basic import
      try {
        const importData = JSON.parse(data);
        if (importData.personalization) {
          updatePersonalization(importData.personalization);
        }
        return true;
      } catch (error) {
        console.error('Failed to import themes:', error);
        return false;
      }
    },
    [updatePersonalization]
  );

  const syncThemes = useCallback(async (): Promise<void> => {
    if (!cloudSyncServiceRef.current) {
      throw new Error('Cloud sync service not initialized');
    }

    if (!persistenceServiceRef.current) {
      throw new Error('Persistence service not initialized');
    }

    try {
      // Get current theme data from persistence service
      const themeData = await persistenceServiceRef.current.loadThemeData();

      // Update cloud sync service preferences
      await cloudSyncServiceRef.current.updatePreferences({
        theme,
        themeConfig,
        personalization,
        lastModified: new Date().toISOString(),
        deviceId: cloudSyncServiceRef.current.getStatus().isOnline ? 'web' : 'offline',
        version: 1,
      });

      // Perform the sync
      await cloudSyncServiceRef.current.sync();

      // Save updated data back to persistence service
      const updatedPreferences = await cloudSyncServiceRef.current.getPreferences();
      if (updatedPreferences) {
        await persistenceServiceRef.current.saveThemeData({
          theme: updatedPreferences.theme,
          themeConfig: updatedPreferences.themeConfig,
          personalization: updatedPreferences.personalization,
        });

        // Update local state if data changed from cloud
        if (updatedPreferences.theme !== theme) {
          setThemeState(updatedPreferences.theme);
          setThemeConfig(
            updatedPreferences.themeConfig || DEFAULT_THEMES[updatedPreferences.theme]
          );
        }
        if (updatedPreferences.personalization) {
          setPersonalizationState({
            ...DEFAULT_PERSONALIZATION,
            ...updatedPreferences.personalization,
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync themes:', error);
      throw error;
    }
  }, [theme, themeConfig, personalization]);

  const enableCloudSync = useCallback((enabled: boolean
) => {
    if (!cloudSyncServiceRef.current) return;

    const syncService = cloudSyncServiceRef.current;
    syncService.setOptions({
      ...syncService.getOptions(),
      autoSync: enabled,
    });

    if (enabled) {
      // Perform initial sync when enabling
      syncService.sync().catch((error: any
) => { // auto
        console.error('Failed to perform initial sync:', error);
      });
    }
  }, []);

  const forceCloudSync = useCallback(async (): Promise<void> => {
    if (!cloudSyncServiceRef.current) {
      throw new Error('Cloud sync service not initialized');
    }

    try {
      await cloudSyncServiceRef.current.sync();
    } catch (error) {
      console.error('Failed to force cloud sync:', error);
      throw error;
    }
  }, []);

  const resetCloudData = useCallback(async (): Promise<void> => {
    if (!cloudSyncServiceRef.current) {
      throw new Error('Cloud sync service not initialized');
    }

    try {
      await cloudSyncServiceRef.current.clearRemoteData();
      // Reset local preferences to defaults
      setThemeState(defaultTheme);
      setThemeConfig(DEFAULT_THEMES[defaultTheme]);
      setPersonalizationState(DEFAULT_PERSONALIZATION);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}-personalization`);
    } catch (error) {
      console.error('Failed to reset cloud data:', error);
      throw error;
    }
  }, [defaultTheme, storageKey]);

  const onCloudSyncStatusChange = useCallback(
    (listener: (status: CloudSyncStatus
) => void
) => {
      syncListenersRef.current.push(listener);

      // Return unsubscribe function
      return (
) => {
        const index = syncListenersRef.current.indexOf(listener);
        if (index > -1) {
          syncListenersRef.current.splice(index, 1);
        }
      };
    },
    []
  );

  // Memoized CSS variables with performance optimization
  const getCSSVariables = useMemo((): Record<string, string> => {
    const performanceService = ThemePerformanceService.getInstance();
    const cacheKey = `${theme}-${JSON.stringify(personalization.colorPreferences)}`;

    // Check cache first
    const cached = performanceService.getCachedThemeData(cacheKey);
    if (cached) {
      return cached.variables;
    }

    const vars: Record<string, string> = {};

    // Define critical variables first for better perceived performance
    const criticalVars = {
      '--theme-background': themeConfig.colors.background.primary,
      '--theme-surface': themeConfig.colors.background.secondary,
      '--theme-text-primary': themeConfig.colors.text.primary,
      '--theme-text-secondary': themeConfig.colors.text.secondary,
      '--theme-primary': themeConfig.colors.primary[500],
      '--theme-border': themeConfig.colors.border.primary,
    };

    Object.assign(vars, criticalVars);

    // Color variables - optimized with direct assignment
    const colorSections = [
      ['primary', themeConfig.colors.primary],
      ['secondary', themeConfig.colors.secondary],
      ['accent', themeConfig.colors.accent],
      ['neutral', themeConfig.colors.neutral],
    ] as const;

    colorSections.forEach(([section, colors]
) => {
      Object.entries(colors).forEach(([key, value]
) => {
        vars[`--color-${section}-${key}`] = value;
      });
    });

    // Background variables
    Object.entries(themeConfig.colors.background).forEach(([key, value]
) => {
      vars[`--color-background-${key}`] = value;
    });

    // Text variables
    Object.entries(themeConfig.colors.text).forEach(([key, value]
) => {
      vars[`--color-text-${key}`] = value;
    });

    // Border variables
    Object.entries(themeConfig.colors.border).forEach(([key, value]
) => {
      vars[`--color-border-${key}`] = value;
    });

    // Typography variables with personalization
    const fontSizeScale = personalization.typographyPreferences.fontSizeScale || 1;
    Object.entries(themeConfig.typography.fontSize).forEach(([key, value]
) => {
      const scaledValue =
        typeof value === 'string' && value.includes('rem')
          ? `${parseFloat(value) * fontSizeScale}rem`
          : value;
      vars[`--font-size-${key}`] = scaledValue;
    });

    // Spacing variables
    Object.entries(themeConfig.spacing.sizes).forEach(([key, value]
) => {
      vars[`--spacing-${key}`] = value;
    });

    // Border radius variables
    Object.entries(themeConfig.spacing.borderRadius).forEach(([key, value]
) => {
      vars[`--border-radius-${key}`] = value;
    });

    // Animation variables with motion preferences
    const animationScale = personalization.motionPreferences.enableAnimations ? 1 : 0;
    Object.entries(themeConfig.animations.duration).forEach(([key, value]
) => {
      const scaledValue =
        typeof value === 'string' && value.includes('ms')
          ? `${parseFloat(value) * animationScale}ms`
          : value;
      vars[`--duration-${key}`] = scaledValue;
    });

    // Shadow variables
    Object.entries(themeConfig.effects.shadows).forEach(([key, value]
) => {
      vars[`--shadow-${key}`] = value;
    });

    // Accessibility enhancements
    if (personalization.accessibilityPreferences.highContrastMode) {
      vars['--theme-contrast-multiplier'] = '1.5';
    }

    if (personalization.colorPreferences.brightnessLevel !== 100) {
      vars['--theme-brightness'] =
        `${personalization.colorPreferences.brightnessLevel}%`;
    }

    // Cache the result for future use
    const classes = getThemeClassesInternal();
    performanceService.cacheThemeData(cacheKey, vars, classes);

    return vars;
  }, [theme, themeConfig, personalization]);

  // Internal function for theme classes to avoid circular dependency in memoization
  const getThemeClassesInternal = (): string[] => {
    const classes = [`theme-${theme}`];

    // Accessibility classes
    if (personalization.accessibilityPreferences.highContrastMode) {
      classes.push('high-contrast');
    }

    if (
      personalization.motionPreferences.reduceMotion ||
      personalization.accessibilityPreferences.flashingElementsReduced
    ) {
      classes.push('reduce-motion');
    }

    if (personalization.typographyPreferences.dyslexiaFriendly) {
      classes.push('dyslexia-friendly');
    }

    // Font preferences
    if (personalization.typographyPreferences.fontSizeScale !== 1) {
      classes.push(
        `font-scale-${Math.round(personalization.typographyPreferences.fontSizeScale * 100)}`
      );
    }

    // Color preferences
    if (personalization.colorPreferences.colorblindFriendly) {
      classes.push('colorblind-friendly');
    }

    // Layout density
    if (personalization.layoutPreferences.density !== 'comfortable') {
      classes.push(`density-${personalization.layoutPreferences.density}`);
    }

    // RTL support if available
    if (document.dir === 'rtl') {
      classes.push('rtl');
    }

    return classes;
  };

  // Memoized public interface for theme classes
  const getThemeClasses = useMemo((): string[] => {
    return getThemeClassesInternal();
  }, [theme, personalization]);

  // Performance-optimized theme application
  const applyThemeWithPerformance = useCallback(
    async (options?: { animate?: boolean; duration?: number; immediate?: boolean }
) => {
      const performanceService = ThemePerformanceService.getInstance();
      const variables = getCSSVariables;
      const classes = getThemeClasses;

      if (options?.immediate) {
        await performanceService.applyTheme(variables, classes, {
          animate: false,
          skipIfSame: true,
        });
      } else {
        performanceService.debouncedApplyTheme(variables, classes, 16, {
          animate: options?.animate || false,
          duration: options?.duration || 300,
          skipIfSame: true,
        });
      }
    },
    [getCSSVariables, getThemeClasses]
  );

  // Preload theme for better performance
  const preloadTheme = useCallback((targetTheme: Theme
) => {
    const performanceService = ThemePerformanceService.getInstance();
    const targetConfig = DEFAULT_THEMES[targetTheme];

    if (targetConfig) {
      // Temporarily create variables for target theme
      const tempVars: Record<string, string> = {
        '--theme-background': targetConfig.colors.background.primary,
        '--theme-surface': targetConfig.colors.background.secondary,
        '--theme-text-primary': targetConfig.colors.text.primary,
        '--theme-text-secondary': targetConfig.colors.text.secondary,
        '--theme-primary': targetConfig.colors.primary[500],
        '--theme-border': targetConfig.colors.border.primary,
      };

      const tempClasses = [`theme-${targetTheme}`];
      performanceService.preloadTheme(targetTheme, tempVars, tempClasses);
    }
  }, []);

  const isAccessibleContrast = useCallback(
    (foreground: string, background: string): boolean => {
      const accessibilityService = ThemeAccessibilityService.getInstance();
      const result = accessibilityService.calculateContrastRatio(
        foreground,
        background
      );
      return result.isAccessible;
    },
    []
  );

  // Accessibility functions
  const testThemeAccessibility = useCallback((
) => {
    const accessibilityService = ThemeAccessibilityService.getInstance();
    const cssVars = getCSSVariables;
    return accessibilityService.testThemeAccessibility(cssVars);
  }, [getCSSVariables]);

  const getAccessibilityStatus = useCallback((
) => {
    const accessibilityService = ThemeAccessibilityService.getInstance();
    return accessibilityService.getAccessibilityStatus();
  }, []);

  const announceThemeChange = useCallback(
    (themeName: string, previousTheme?: string
) => {
      const accessibilityService = ThemeAccessibilityService.getInstance();
      accessibilityService.announceThemeChange(themeName, {
        includePreviousTheme: !!previousTheme,
        previousTheme,
        priority: 'polite',
      });
    },
    []
  );

  const calculateContrastRatio = useCallback(
    (foreground: string, background: string
) => {
      const accessibilityService = ThemeAccessibilityService.getInstance();
      return accessibilityService.calculateContrastRatio(foreground, background);
    },
    []
  );

  const simulateColorBlindness = useCallback((color: string
) => {
    const accessibilityService = ThemeAccessibilityService.getInstance();
    return accessibilityService.simulateColorBlindness(color);
  }, []);

  // Apply accessibility enhancements when personalization changes
  useEffect((
) => {
    const accessibilityService = ThemeAccessibilityService.getInstance();
    accessibilityService.applyAccessibilityEnhancements(personalization);
  }, [personalization]);

  // Premium animation functions
  const initializePremiumAnimations = useCallback(
    (effects?: PremiumAnimationEffects
) => {
      const animationService = PremiumThemeAnimationService.getInstance();
      const effectsToApply =
        effects || PremiumThemeAnimationService.getDefaultEffects(theme);
      animationService.initializePremiumAnimations(theme, effectsToApply);
    },
    [theme]
  );

  const setAnimationIntensity = useCallback(
    (intensity: 'subtle' | 'moderate' | 'dynamic' | 'dramatic'
) => {
      const animationService = PremiumThemeAnimationService.getInstance();
      animationService.setAnimationIntensity(intensity);
    },
    []
  );

  const setAnimationsEnabled = useCallback((enabled: boolean
) => {
    const animationService = PremiumThemeAnimationService.getInstance();
    animationService.setAnimationsEnabled(enabled);
  }, []);

  const getDefaultAnimationEffects = useCallback((): PremiumAnimationEffects => {
    return PremiumThemeAnimationService.getDefaultEffects(theme);
  }, [theme]);

  // Initialize premium animations when theme changes
  useEffect((
) => {
    if (themeConfig.isPremium) {
      initializePremiumAnimations();
    }
  }, [theme, themeConfig.isPremium, initializePremiumAnimations]);

  const isDarkMode = useMemo((
) => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (theme === 'system' || theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // For other themes, determine based on background color
    return (
      themeConfig.colors.background.primary.includes('#') &&
      parseInt(themeConfig.colors.background.primary.slice(1), 16) < 0x808080
    );
  }, [theme, themeConfig]);

  const isSystemTheme = useMemo((
) => {
    return theme === 'system' || theme === 'auto';
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    themeConfig,
    personalization,
    isDarkMode,
    isSystemTheme,
    setTheme,
    toggleTheme,
    resetTheme,
    updatePersonalization,
    updateColorPreference,
    updateTypographyPreference,
    updateMotionPreference,
    updateSoundPreference,
    updateLayoutPreference,
    updateAccessibilityPreference,
    availableThemes,
    createCustomTheme,
    saveThemePreset,
    loadThemePreset,
    themeAnalytics,
    getThemeRecommendations,
    exportThemes,
    importThemes,
    syncThemes,
    // Cloud Sync
    cloudSyncStatus,
    enableCloudSync,
    forceCloudSync,
    resetCloudData,
    onCloudSyncStatusChange,
    // Utility functions
    getCSSVariables,
    getThemeClasses,
    isAccessibleContrast,
    applyThemeWithPerformance,
    preloadTheme,

    // Accessibility functions
    testThemeAccessibility,
    getAccessibilityStatus,
    announceThemeChange,
    calculateContrastRatio,
    simulateColorBlindness,

    // Premium animation functions
    initializePremiumAnimations,
    setAnimationIntensity,
    setAnimationsEnabled,
    getDefaultAnimationEffects,
  };

  return <ThemeContext.Provider value={value}>children</ThemeContext.Provider>;
}

export default useTheme;
