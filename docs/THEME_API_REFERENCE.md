# Theme System API Reference

## Table of Contents

1. [Type Definitions](#type-definitions)
2. [Hooks](#hooks)
3. [Components](#components)
4. [Services](#services)
5. [Utilities](#utilities)
6. [Constants](#constants)
7. [Error Handling](#error-handling)

## Type Definitions

### Core Types

#### Theme
```typescript
type Theme = 'light' | 'dark' | 'system' | 'auto' | 'high-contrast' | 'custom';
```

#### ThemeConfig
```typescript
interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'system' | 'custom' | 'premium';
  isCustom: boolean;
  isPremium: boolean;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    background: ColorVariants;
    text: ColorVariants;
    border: ColorVariants;
  };
  typography: TypographyConfig;
  spacing: SpacingConfig;
  animations: AnimationConfig;
  effects: EffectsConfig;
  accessibility: AccessibilityConfig;
}
```

#### ColorScale
```typescript
interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}
```

#### PersonalizationSettings
```typescript
interface PersonalizationSettings {
  theme: Theme;
  colorPreferences: {
    favoriteColors: string[];
    avoidColors: string[];
    colorblindFriendly: boolean;
    highContrastMode: boolean;
    saturationLevel: number;
    brightnessLevel: number;
    warmthLevel: number;
  };
  typographyPreferences: {
    preferredFontSize: 'small' | 'medium' | 'large';
    fontSizeScale: number;
    preferredFontFamily: 'system' | 'serif' | 'mono';
    lineHeightPreference: 'tight' | 'comfortable' | 'relaxed';
    letterSpacingPreference: 'tight' | 'normal' | 'wide';
    fontWeight: 'normal' | 'medium' | 'bold';
    dyslexiaFriendly: boolean;
  };
  motionPreferences: {
    enableAnimations: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
    reduceMotion: boolean;
    preferCrossfade: boolean;
    enableParallax: boolean;
    enableHoverEffects: boolean;
    enableFocusAnimations: boolean;
  };
  soundPreferences: {
    enableSounds: boolean;
    soundVolume: number;
    soundTheme: string;
    customSounds: Record<string, string>;
    muteOnFocus: boolean;
    hapticFeedback: boolean;
    spatialAudio: boolean;
  };
  layoutPreferences: {
    density: 'compact' | 'comfortable' | 'spacious';
    navigation: 'top' | 'bottom' | 'side';
    cardStyle: 'flat' | 'elevated' | 'outlined';
    borderRadius: 'none' | 'small' | 'rounded' | 'large';
    showLabels: boolean;
    showIcons: boolean;
    iconSize: 'small' | 'medium' | 'large';
    gridColumns: number;
    listSpacing: 'tight' | 'normal' | 'relaxed';
  };
  accessibilityPreferences: {
    screenReaderOptimized: boolean;
    keyboardNavigationOnly: boolean;
    highContrastMode: boolean;
    largeTargets: boolean;
    reducedTransparency: boolean;
    boldText: boolean;
    underlineLinks: boolean;
    flashingElementsReduced: boolean;
    colorOnlyIndicators: boolean;
    focusIndicatorStyle: 'outline' | 'highlight' | 'underline';
  };
  lastUpdated: Date;
  syncAcrossDevices: boolean;
}
```

#### CloudSyncStatus
```typescript
interface CloudSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  hasConflicts: boolean;
  pendingChanges: number;
  error: string | null;
}
```

### Performance Types

#### CSSVariableCache
```typescript
interface CSSVariableCache {
  variables: Record<string, string>;
  classes: string[];
  hash: string;
  timestamp: number;
}
```

#### PerformanceStats
```typescript
interface PerformanceStats {
  cacheSize: number;
  cacheEntries: string[];
  lastAppliedHash: string | null;
  isApplyingTheme: boolean;
}
```

### Accessibility Types

#### ContrastRatio
```typescript
interface ContrastRatio {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'fail';
  isAccessible: boolean;
}
```

#### AccessibilityTestResult
```typescript
interface AccessibilityTestResult {
  overallScore: number;
  issues: string[];
  recommendations: string[];
}
```

#### ColorBlindnessSimulation
```typescript
interface ColorBlindnessSimulation {
  protanopia: string;
  deuteranopia: string;
  tritanopia: string;
  achromatopsia: string;
}
```

## Hooks

### useTheme

Main hook for theme system integration.

```typescript
function useTheme(): ThemeContextValue
```

#### Returns

```typescript
interface ThemeContextValue {
  // Current theme state
  theme: Theme;
  themeConfig: ThemeConfig;
  personalization: PersonalizationSettings;
  isDarkMode: boolean;
  isSystemTheme: boolean;
  
  // Theme management
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resetTheme: () => void;
  
  // Personalization
  updatePersonalization: (updates: Partial<PersonalizationSettings>) => void;
  updateColorPreference: (property: string, value: any) => void;
  updateTypographyPreference: (property: string, value: any) => void;
  updateMotionPreference: (property: string, value: any) => void;
  updateSoundPreference: (property: string, value: any) => void;
  updateLayoutPreference: (property: string, value: any) => void;
  updateAccessibilityPreference: (property: string, value: any) => void;
  
  // Theme presets and customization
  availableThemes: ThemePreset[];
  createCustomTheme: (baseTheme: Theme, customizations: any) => Promise<CustomThemeConfig>;
  saveThemePreset: (preset: ThemePreset) => Promise<void>;
  loadThemePreset: (presetId: string) => Promise<void>;
  
  // Analytics and insights
  themeAnalytics: ThemeUsageAnalytics;
  getThemeRecommendations: () => ThemePreset[];
  
  // Persistence
  exportThemes: () => Promise<string>;
  importThemes: (data: string) => Promise<boolean>;
  syncThemes: () => Promise<void>;
  
  // Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  enableCloudSync: (enabled: boolean) => void;
  forceCloudSync: () => Promise<void>;
  resetCloudData: () => Promise<void>;
  onCloudSyncStatusChange: (listener: (status: CloudSyncStatus) => void) => () => void;
  
  // Utility functions
  getCSSVariables: () => Record<string, string>;
  getThemeClasses: () => string[];
  isAccessibleContrast: (foreground: string, background: string) => boolean;
  applyThemeWithPerformance: (options?: { 
    animate?: boolean; 
    duration?: number; 
    immediate?: boolean 
  }) => Promise<void>;
  preloadTheme: (targetTheme: Theme) => void;
  
  // Accessibility functions
  testThemeAccessibility: () => AccessibilityTestResult;
  getAccessibilityStatus: () => AccessibilityStatus;
  announceThemeChange: (themeName: string, previousTheme?: string) => void;
  calculateContrastRatio: (foreground: string, background: string) => ContrastRatio;
  simulateColorBlindness: (color: string) => ColorBlindnessSimulation;
}
```

#### Example Usage

```typescript
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const { 
    theme, 
    setTheme, 
    getCSSVariables, 
    testThemeAccessibility,
    applyThemeWithPerformance 
  } = useTheme();

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    await applyThemeWithPerformance({ animate: true });
  };

  const cssVars = getCSSVariables();
  const accessibilityReport = testThemeAccessibility();

  return (
    <div style={cssVars}>
      <p>Current theme: {theme}</p>
      <p>Accessibility score: {accessibilityReport.overallScore}%</p>
      <button onClick={() => handleThemeChange('dark')}>
        Switch to Dark Theme
      </button>
    </div>
  );
}
```

## Components

### ThemeProvider

React context provider for the theme system.

```typescript
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
}

function ThemeProvider(props: ThemeProviderProps): JSX.Element
```

#### Props

- **children**: React node tree to provide theme context to
- **defaultTheme**: Initial theme (default: 'light')
- **storageKey**: Local storage key for persistence (default: 'relife-theme')
- **enableSystem**: Enable system theme detection (default: true)

#### Example

```typescript
import { ThemeProvider } from './hooks/useTheme';

function App() {
  return (
    <ThemeProvider 
      defaultTheme="system"
      storageKey="my-app-theme"
      enableSystem={true}
    >
      <MyApp />
    </ThemeProvider>
  );
}
```

### ThemeManager

Main UI component for theme management.

```typescript
interface ThemeManagerProps {
  className?: string;
  showAdvancedOptions?: boolean;
  enableImportExport?: boolean;
  onThemeChange?: (theme: Theme) => void;
}

function ThemeManager(props: ThemeManagerProps): JSX.Element
```

#### Props

- **className**: Additional CSS classes
- **showAdvancedOptions**: Show advanced personalization options (default: true)
- **enableImportExport**: Enable import/export functionality (default: true)
- **onThemeChange**: Callback when theme changes

## Services

### ThemePersistenceService

Handles theme data persistence with backup and recovery.

```typescript
class ThemePersistenceService {
  static getInstance(): ThemePersistenceService;
  
  saveThemeData(data: ThemeData): Promise<void>;
  loadThemeData(): Promise<ThemeData>;
  createBackup(): Promise<void>;
  restoreFromBackup(backupId?: string): Promise<boolean>;
  exportThemes(): Promise<string>;
  importThemes(data: string): Promise<boolean>;
  clearAllData(): Promise<void>;
  getStorageStats(): StorageStats;
}
```

#### Methods

##### saveThemeData
```typescript
saveThemeData(data: ThemeData): Promise<void>
```
Saves theme data with automatic backup creation.

**Parameters:**
- `data`: Theme data to save

**Throws:** `Error` if save fails

##### loadThemeData
```typescript
loadThemeData(): Promise<ThemeData>
```
Loads theme data with corruption detection and recovery.

**Returns:** Promise resolving to theme data
**Throws:** `Error` if load fails and no backup available

##### createBackup
```typescript
createBackup(): Promise<void>
```
Manually create a backup of current theme data.

##### restoreFromBackup
```typescript
restoreFromBackup(backupId?: string): Promise<boolean>
```
Restore from a specific backup or the most recent.

**Parameters:**
- `backupId`: Optional backup ID (uses most recent if not provided)

**Returns:** Promise resolving to success status

##### exportThemes
```typescript
exportThemes(): Promise<string>
```
Export all theme data as JSON string.

**Returns:** Promise resolving to JSON string

##### importThemes
```typescript
importThemes(data: string): Promise<boolean>
```
Import theme data from JSON string.

**Parameters:**
- `data`: JSON string containing theme data

**Returns:** Promise resolving to success status

### ThemePerformanceService

Optimizes theme application performance.

```typescript
class ThemePerformanceService {
  static getInstance(): ThemePerformanceService;
  
  applyTheme(
    variables: Record<string, string>, 
    classes: string[],
    options?: {
      animate?: boolean;
      duration?: number;
      skipIfSame?: boolean;
    }
  ): Promise<void>;
  
  debouncedApplyTheme(
    variables: Record<string, string>, 
    classes: string[],
    delay?: number,
    options?: ApplyThemeOptions
  ): void;
  
  cacheThemeData(
    themeId: string, 
    variables: Record<string, string>, 
    classes: string[]
  ): CSSVariableCache;
  
  preloadTheme(
    themeId: string, 
    variables: Record<string, string>, 
    classes: string[]
  ): void;
  
  clearCache(): void;
  getPerformanceStats(): PerformanceStats;
}
```

### ThemeAccessibilityService

Provides accessibility features and testing.

```typescript
class ThemeAccessibilityService {
  static getInstance(): ThemeAccessibilityService;
  
  calculateContrastRatio(
    foreground: string, 
    background: string
  ): ContrastRatio;
  
  simulateColorBlindness(color: string): ColorBlindnessSimulation;
  
  applyAccessibilityEnhancements(
    settings: PersonalizationSettings
  ): void;
  
  testThemeAccessibility(
    themeColors: Record<string, string>
  ): AccessibilityTestResult;
  
  announceThemeChange(
    themeName: string,
    options?: {
      includePreviousTheme?: boolean;
      previousTheme?: string;
      priority?: 'polite' | 'assertive';
    }
  ): void;
  
  getAccessibilityStatus(): AccessibilityStatus;
}
```

## Utilities

### CSS Optimization Utilities

```typescript
// Batch CSS updates for better performance
function batchCSSUpdates(
  element: HTMLElement, 
  properties: Record<string, string>
): void;

// Create CSS custom property with fallback
function createCSSProperty(
  property: string, 
  value: string, 
  fallback?: string
): string;

// Get responsive values based on breakpoint
function getResponsiveValue(
  mobile: string,
  tablet: string,
  desktop: string,
  currentBreakpoint?: 'mobile' | 'tablet' | 'desktop'
): string;

// Calculate contrast color for better accessibility
function getContrastColor(hexColor: string): string;

// Generate color scale from base color
function generateColorScale(
  baseColor: string, 
  steps?: number
): Record<string, string>;

// CSS-in-JS to CSS string converter
function stylesToCSSString(styles: Record<string, any>): string;

// Create debounced style application function
function createDebouncedStyler(delay?: number): (
  element: HTMLElement, 
  styles: Record<string, string>
) => void;
```

### CSSCustomPropertiesManager

Advanced CSS custom properties management.

```typescript
class CSSCustomPropertiesManager {
  setProperty(
    property: string, 
    value: string, 
    immediate?: boolean
  ): void;
  
  getProperty(property: string): string | undefined;
  clearCache(): void;
  getCacheSize(): number;
}
```

## Constants

### Default Themes

```typescript
const DEFAULT_THEMES: Record<Theme, ThemeConfig>;
```

### Default Personalization

```typescript
const DEFAULT_PERSONALIZATION: PersonalizationSettings;
```

### Theme Categories

```typescript
const THEME_CATEGORIES = {
  SYSTEM: 'system',
  CUSTOM: 'custom', 
  PREMIUM: 'premium'
} as const;
```

### Color Scales

```typescript
const COLOR_SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
```

### Accessibility Levels

```typescript
const WCAG_LEVELS = {
  AAA: 7,
  AA: 4.5,
  A: 3
} as const;
```

## Error Handling

### Error Types

#### ThemeError
```typescript
class ThemeError extends Error {
  constructor(
    message: string, 
    public code: string, 
    public recoverable: boolean = true
  );
}
```

#### ThemePersistenceError
```typescript
class ThemePersistenceError extends ThemeError {
  constructor(message: string, public operation: string);
}
```

#### ThemeAccessibilityError
```typescript
class ThemeAccessibilityError extends ThemeError {
  constructor(message: string, public context: string);
}
```

### Error Codes

```typescript
const ERROR_CODES = {
  THEME_NOT_FOUND: 'THEME_NOT_FOUND',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
  SYNC_FAILED: 'SYNC_FAILED',
  ACCESSIBILITY_TEST_FAILED: 'ACCESSIBILITY_TEST_FAILED',
  INVALID_THEME_DATA: 'INVALID_THEME_DATA',
  PERFORMANCE_DEGRADED: 'PERFORMANCE_DEGRADED'
} as const;
```

### Error Handling Examples

```typescript
import { useTheme } from './hooks/useTheme';
import { ThemeError } from './services/theme-errors';

function MyComponent() {
  const { setTheme } = useTheme();
  
  const handleThemeChange = async (theme: Theme) => {
    try {
      setTheme(theme);
    } catch (error) {
      if (error instanceof ThemeError) {
        if (error.recoverable) {
          // Show user-friendly error message
          console.warn('Theme change failed, trying fallback:', error.message);
          setTheme('light'); // Fallback to safe theme
        } else {
          // Critical error, might need to reload
          console.error('Critical theme error:', error);
        }
      }
    }
  };
}
```

### Error Recovery

The theme system includes automatic error recovery mechanisms:

1. **Fallback Themes**: Automatically falls back to default themes
2. **Backup Restoration**: Restores from backups when data is corrupted
3. **Graceful Degradation**: Continues functioning with reduced features
4. **User Notification**: Provides clear error messages and recovery options

---

This API reference provides comprehensive documentation for all public interfaces and functionality in the Relife Theme System. For implementation examples and usage patterns, refer to the main [Theme System Documentation](THEME_SYSTEM.md).