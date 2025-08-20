/**
 * @file Initial Application State Constants
 * @description Centralized type-safe default values for the AppState interface.
 * These constants ensure all required AppState properties are properly initialized
 * with sensible default values to prevent TypeScript compilation errors.
 *
 * @author AppState Fix Step 3
 * @version 1.0.0
 */

import type {
  ThemeConfig,
  PersonalizationSettings,
  Theme,
  ThemePreset,
  AppState,
  ColorPalette,
  NotificationPermission,
  MicrophonePermission,
} from '../types';

/**
 * Default color palette for light theme configuration.
 * Provides a complete set of color shades from 50 (lightest) to 950 (darkest).
 */
const DEFAULT_COLOR_PALETTE: ColorPalette = {
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
};

/**
 * Default theme configuration for the light theme.
 * Provides comprehensive styling configuration including colors, typography,
 * spacing, animations, and accessibility settings.
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  id: 'light',
  name: 'light',
  displayName: 'Light Theme',
  description: 'Clean and bright theme optimized for daytime use',
  category: 'system',
  colors: {
    primary: DEFAULT_COLOR_PALETTE,
    secondary: DEFAULT_COLOR_PALETTE,
    accent: DEFAULT_COLOR_PALETTE,
    neutral: DEFAULT_COLOR_PALETTE,
    success: {
      ...DEFAULT_COLOR_PALETTE,
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      ...DEFAULT_COLOR_PALETTE,
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
    },
    error: {
      ...DEFAULT_COLOR_PALETTE,
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      ...DEFAULT_COLOR_PALETTE,
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
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
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      inverse: '#ffffff',
      disabled: '#cbd5e1',
      link: '#2563eb',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#2563eb',
      hover: '#94a3b8',
      active: '#475569',
    },
    surface: {
      elevated: '#ffffff',
      depressed: '#f1f5f9',
      interactive: '#f8fafc',
      disabled: '#f1f5f9',
    },
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
      monospace: '"Fira Code", "JetBrains Mono", monospace',
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
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none',
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
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  previewImage: undefined,
  isCustom: false,
  isPremium: false,
  createdBy: undefined,
  createdAt: undefined,
  popularity: 0,
  rating: 0,
};

/**
 * Default personalization settings with comprehensive user preference defaults.
 * Includes theme preferences, accessibility settings, and user interface customizations.
 */
export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  theme: 'light' as Theme,
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
    soundVolume: 75,
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

/**
 * Default available theme presets for the theme selection system.
 * Includes built-in themes with comprehensive metadata and preview information.
 */
export const DEFAULT_AVAILABLE_THEMES: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright theme perfect for daytime use',
    theme: 'light' as Theme,
    personalization: {
      theme: 'light' as Theme,
      colorPreferences: DEFAULT_PERSONALIZATION.colorPreferences,
      lastUpdated: new Date(),
      syncAcrossDevices: true,
    },
    preview: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      cardColor: '#ffffff',
      accentColor: '#2563eb',
      gradientPreview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    tags: ['system', 'default', 'bright'],
    isDefault: true,
    isPremium: false,
    popularityScore: 100,
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes theme optimized for low-light environments',
    theme: 'dark' as Theme,
    personalization: {
      theme: 'dark' as Theme,
      colorPreferences: {
        ...DEFAULT_PERSONALIZATION.colorPreferences,
        brightnessLevel: 20,
      },
      lastUpdated: new Date(),
      syncAcrossDevices: true,
    },
    preview: {
      primaryColor: '#3b82f6',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      cardColor: '#1e293b',
      accentColor: '#60a5fa',
      gradientPreview: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    },
    tags: ['system', 'dark', 'night'],
    isDefault: false,
    isPremium: false,
    popularityScore: 90,
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast theme for enhanced accessibility',
    theme: 'high-contrast' as Theme,
    personalization: {
      theme: 'high-contrast' as Theme,
      colorPreferences: {
        ...DEFAULT_PERSONALIZATION.colorPreferences,
        highContrastMode: true,
        saturationLevel: 100,
        brightnessLevel: 100,
      },
      accessibilityPreferences: {
        ...DEFAULT_PERSONALIZATION.accessibilityPreferences,
        highContrastMode: true,
        boldText: true,
        underlineLinks: true,
        largeTargets: true,
      },
      lastUpdated: new Date(),
      syncAcrossDevices: true,
    },
    preview: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      cardColor: '#ffffff',
      accentColor: '#0000ff',
      gradientPreview: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    },
    tags: ['accessibility', 'contrast', 'a11y'],
    isDefault: false,
    isPremium: false,
    popularityScore: 25,
  },
];

/**
 * Default notification permission state.
 * Represents the initial state before user has granted or denied permissions.
 */
const DEFAULT_NOTIFICATION_PERMISSION: NotificationPermission = {
  granted: false,
  requestedAt: undefined,
  deniedAt: undefined,
};

/**
 * Default microphone permission state.
 * Represents the initial state before user has granted or denied permissions.
 */
const DEFAULT_MICROPHONE_PERMISSION: MicrophonePermission = {
  granted: false,
  requestedAt: undefined,
  deniedAt: undefined,
};

/**
 * Complete initial application state with all required properties properly initialized.
 * This object ensures TypeScript compilation success by providing type-safe defaults
 * for every required field in the AppState interface.
 *
 * @remarks
 * This initial state serves as the foundation for the entire application state management.
 * All properties are initialized with sensible defaults that maintain functionality
 * while allowing the application to start successfully.
 *
 * @example
 * ```typescript
 * const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
 * ```
 */
export const INITIAL_APP_STATE: AppState = {
  // User and authentication state
  user: null,
  alarms: [],
  activeAlarm: null,

  // Permission states with proper initialization
  permissions: {
    notifications: DEFAULT_NOTIFICATION_PERMISSION,
    microphone: DEFAULT_MICROPHONE_PERMISSION,
  },

  // Application flow state
  isOnboarding: true,
  currentView: 'dashboard',

  // Reward system (optional, can be undefined initially)
  rewardSystem: undefined,

  // Required theme and personalization properties
  currentTheme: 'light' as Theme,
  themeConfig: DEFAULT_THEME_CONFIG,
  personalization: DEFAULT_PERSONALIZATION,
  availableThemes: DEFAULT_AVAILABLE_THEMES,

  // Theme store (optional, for advanced theme management)
  themeStore: undefined,

  // Enhanced Battles state (all optional)
  activeBattles: [],
  friends: [],
  achievements: [],
  tournaments: [],
  teams: [],
  currentSeason: undefined,

  // Legacy theme support (deprecated but maintained for compatibility)
  theme: 'light' as Theme,
};

/**
 * Type guard to validate if an object conforms to the AppState interface.
 * Useful for runtime validation of state objects.
 *
 * @param obj - The object to validate
 * @returns True if the object is a valid AppState, false otherwise
 */
export function isValidAppState(obj: any): obj is AppState {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.alarms) &&
    typeof obj.isOnboarding === 'boolean' &&
    typeof obj.currentView === 'string' &&
    typeof obj.currentTheme === 'string' &&
    obj.themeConfig &&
    obj.personalization &&
    Array.isArray(obj.availableThemes) &&
    obj.permissions &&
    typeof obj.permissions.notifications === 'object' &&
    typeof obj.permissions.microphone === 'object'
  );
}

/**
 * Creates a deep copy of the initial app state.
 * Useful when you need a fresh state object without references to the original.
 *
 * @returns A deep copy of the initial AppState
 */
export function createFreshAppState(): AppState {
  return JSON.parse(JSON.stringify(INITIAL_APP_STATE));
}
