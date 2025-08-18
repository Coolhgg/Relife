# Relife Theme System Documentation

## Overview

The Relife Theme System is a comprehensive, enterprise-grade theming solution that provides dynamic theme switching, personalization, accessibility features, performance optimizations, and cloud synchronization for the Relife alarm application.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Getting Started](#getting-started)
4. [Theme Configuration](#theme-configuration)
5. [Personalization](#personalization)
6. [Accessibility Features](#accessibility-features)
7. [Performance Optimizations](#performance-optimizations)
8. [Cloud Synchronization](#cloud-synchronization)
9. [API Reference](#api-reference)
10. [Testing](#testing)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

## Architecture

The theme system consists of several interconnected services and components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Theme System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   ThemeProvider │    │  ThemeManager   │                │
│  │   (React Hook)  │◄──►│  (UI Component) │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                         │
│           ▼                       ▼                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Core Services Layer                        ││
│  │                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐               ││
│  │  │  Persistence    │  │  Performance    │               ││
│  │  │    Service      │  │    Service      │               ││
│  │  └─────────────────┘  └─────────────────┘               ││
│  │                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐               ││
│  │  │ Accessibility   │  │  Cloud Sync     │               ││
│  │  │    Service      │  │    Service      │               ││
│  │  └─────────────────┘  └─────────────────┘               ││
│  └─────────────────────────────────────────────────────────┘│
│           │                       │                         │
│           ▼                       ▼                         │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Local Storage  │    │   Cloud Storage │                │
│  │   & IndexedDB   │    │   (Supabase)    │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. ThemeProvider (`src/hooks/useTheme.tsx`)

The main React context provider that manages theme state and provides all theme-related functionality.

**Key Features:**
- Theme state management
- Personalization settings
- CSS variable generation
- Performance optimizations
- Accessibility integration

### 2. ThemePersistenceService (`src/services/theme-persistence.ts`)

Handles robust data persistence with automatic backups and corruption recovery.

**Key Features:**
- Automatic versioning and migration
- Backup and restore functionality
- Data validation and integrity checks
- Import/export capabilities

### 3. ThemePerformanceService (`src/services/theme-performance.ts`)

Optimizes theme switching and CSS variable application for better performance.

**Key Features:**
- CSS variable caching
- Batched DOM updates
- Smooth transitions
- Performance monitoring

### 4. ThemeAccessibilityService (`src/services/theme-accessibility.ts`)

Provides comprehensive accessibility features and WCAG compliance testing.

**Key Features:**
- ARIA announcements
- Contrast ratio calculation
- Color blindness simulation
- Screen reader optimizations
- Keyboard navigation

### 5. ThemeManager (`src/components/theme/ThemeManager.tsx`)

The main UI component for theme management and customization.

**Key Features:**
- Theme selection interface
- Personalization controls
- Accessibility testing
- Import/export UI

## Getting Started

### Basic Setup

1. **Wrap your app with ThemeProvider:**

```tsx
import { ThemeProvider } from './hooks/useTheme';

function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={true}>
      <YourAppContent />
    </ThemeProvider>
  );
}
```

2. **Use the theme hook in components:**

```tsx
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, getCSSVariables } = useTheme();
  
  return (
    <div style={getCSSVariables()}>
      Current theme: {theme}
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Advanced Setup

For advanced usage with all features enabled:

```tsx
import { ThemeProvider } from './hooks/useTheme';

function App() {
  return (
    <ThemeProvider 
      defaultTheme="light"
      enableSystem={true}
      storageKey="my-app-theme"
    >
      <YourAppContent />
    </ThemeProvider>
  );
}
```

## Theme Configuration

### Default Themes

The system includes several built-in themes:

- **Light**: Clean and bright interface
- **Dark**: Easy on the eyes dark interface
- **System**: Follows system preference
- **Auto**: Automatically switches based on time
- **High Contrast**: Enhanced contrast for accessibility
- **Custom**: User-defined themes

### Theme Structure

Each theme includes:

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

### Creating Custom Themes

```tsx
const { createCustomTheme } = useTheme();

const customTheme = await createCustomTheme('light', {
  colors: {
    primary: {
      500: '#ff6b6b'
    }
  },
  typography: {
    fontSize: {
      base: '18px'
    }
  }
});
```

## Personalization

### Available Personalization Options

#### Color Preferences
- Favorite and avoided colors
- Colorblind-friendly mode
- High contrast mode
- Saturation and brightness levels
- Color temperature (warmth)

#### Typography Preferences
- Font size scaling
- Font family selection
- Line height preference
- Letter spacing
- Dyslexia-friendly fonts

#### Motion Preferences
- Animation enable/disable
- Animation speed
- Reduced motion mode
- Hover effects
- Focus animations

#### Layout Preferences
- UI density (compact/comfortable/spacious)
- Navigation style
- Card styling
- Border radius
- Icon and label visibility

#### Accessibility Preferences
- Screen reader optimizations
- Keyboard-only navigation
- Large touch targets
- Bold text
- Link underlines
- Focus indicator styles

### Using Personalization

```tsx
const { updatePersonalization, personalization } = useTheme();

// Update color preferences
updatePersonalization({
  colorPreferences: {
    ...personalization.colorPreferences,
    highContrastMode: true
  }
});

// Update typography
updatePersonalization({
  typographyPreferences: {
    ...personalization.typographyPreferences,
    fontSizeScale: 1.2,
    dyslexiaFriendly: true
  }
});
```

## Accessibility Features

### WCAG Compliance

The theme system includes comprehensive WCAG compliance features:

#### Contrast Testing
```tsx
const { calculateContrastRatio, testThemeAccessibility } = useTheme();

// Test specific colors
const contrast = calculateContrastRatio('#000000', '#ffffff');
console.log(`Contrast ratio: ${contrast.ratio}, Level: ${contrast.level}`);

// Test entire theme
const accessibility = testThemeAccessibility();
console.log(`Overall score: ${accessibility.overallScore}%`);
```

#### Color Blindness Support
```tsx
const { simulateColorBlindness } = useTheme();

const simulations = simulateColorBlindness('#ff0000');
console.log('Protanopia:', simulations.protanopia);
console.log('Deuteranopia:', simulations.deuteranopia);
```

#### Screen Reader Support
- Automatic ARIA announcements for theme changes
- Skip links for keyboard navigation
- Descriptive labels for all controls
- Landmark enhancements

#### Keyboard Navigation
- Built-in keyboard shortcuts (Alt+T for theme toggle)
- Focus management
- Tab order optimization

### Accessibility Settings

```tsx
const { getAccessibilityStatus } = useTheme();

const status = getAccessibilityStatus();
// Returns: {
//   hasHighContrast: boolean,
//   hasReducedMotion: boolean,
//   hasScreenReaderOptimizations: boolean,
//   hasSkipLinks: boolean,
//   focusVisible: boolean
// }
```

## Performance Optimizations

### CSS Variable Caching

The system automatically caches CSS variables to prevent unnecessary recalculations:

```tsx
const { applyThemeWithPerformance, preloadTheme } = useTheme();

// Apply theme with optimizations
await applyThemeWithPerformance({
  animate: true,
  duration: 300,
  immediate: false
});

// Preload themes for faster switching
preloadTheme('dark');
```

### Performance Features

1. **Memoized CSS Variables**: CSS variables are computed only when theme or personalization changes
2. **Batched DOM Updates**: Multiple style changes are batched into single DOM operations
3. **Intelligent Caching**: Frequently used theme data is cached with intelligent cleanup
4. **Debounced Updates**: Rapid theme changes are debounced to prevent performance issues
5. **GPU Acceleration**: Transitions use CSS transforms for better performance

### Performance Monitoring

```tsx
import ThemePerformanceService from './services/theme-performance';

const performanceService = ThemePerformanceService.getInstance();
const stats = performanceService.getPerformanceStats();

console.log('Cache size:', stats.cacheSize);
console.log('Is applying theme:', stats.isApplyingTheme);
```

## Cloud Synchronization

### Enabling Cloud Sync

```tsx
const { enableCloudSync, cloudSyncStatus, syncThemes } = useTheme();

// Enable cloud synchronization
enableCloudSync(true);

// Monitor sync status
console.log('Sync status:', cloudSyncStatus);

// Force manual sync
await syncThemes();
```

### Sync Features

- **Cross-device synchronization**: Themes sync across all user devices
- **Conflict resolution**: Automatic handling of conflicting changes
- **Offline support**: Changes are queued when offline and synced when online
- **Real-time updates**: Live updates when changes occur on other devices

## API Reference

### useTheme Hook

#### Theme Management
- `theme: Theme` - Current active theme
- `setTheme(theme: Theme): void` - Set active theme
- `toggleTheme(): void` - Toggle between light/dark
- `resetTheme(): void` - Reset to default theme

#### Personalization
- `personalization: PersonalizationSettings` - Current personalization settings
- `updatePersonalization(updates: Partial<PersonalizationSettings>): void` - Update settings
- `updateColorPreference(property: string, value: any): void` - Update color preferences
- `updateTypographyPreference(property: string, value: any): void` - Update typography
- `updateMotionPreference(property: string, value: any): void` - Update motion settings
- `updateLayoutPreference(property: string, value: any): void` - Update layout settings
- `updateAccessibilityPreference(property: string, value: any): void` - Update accessibility

#### Theme Utilities
- `getCSSVariables(): Record<string, string>` - Get current CSS variables
- `getThemeClasses(): string[]` - Get current theme CSS classes
- `isAccessibleContrast(fg: string, bg: string): boolean` - Test color contrast

#### Performance
- `applyThemeWithPerformance(options?): Promise<void>` - Apply theme with optimizations
- `preloadTheme(theme: Theme): void` - Preload theme for faster switching

#### Accessibility
- `testThemeAccessibility()` - Test theme for accessibility compliance
- `getAccessibilityStatus()` - Get current accessibility settings status
- `announceThemeChange(name: string, previous?: string)` - Announce theme changes
- `calculateContrastRatio(fg: string, bg: string)` - Calculate WCAG contrast ratio
- `simulateColorBlindness(color: string)` - Simulate color blindness

#### Cloud Sync
- `cloudSyncStatus: CloudSyncStatus` - Current sync status
- `enableCloudSync(enabled: boolean): void` - Enable/disable sync
- `syncThemes(): Promise<void>` - Force synchronization
- `forceCloudSync(): Promise<void>` - Force sync with server

#### Import/Export
- `exportThemes(): Promise<string>` - Export theme data as JSON
- `importThemes(data: string): Promise<boolean>` - Import theme data

### Services

#### ThemePersistenceService
```typescript
class ThemePersistenceService {
  saveThemeData(data: ThemeData): Promise<void>
  loadThemeData(): Promise<ThemeData>
  createBackup(): Promise<void>
  restoreFromBackup(backupId?: string): Promise<boolean>
  exportThemes(): Promise<string>
  importThemes(data: string): Promise<boolean>
  clearAllData(): Promise<void>
  getStorageStats(): StorageStats
}
```

#### ThemePerformanceService
```typescript
class ThemePerformanceService {
  applyTheme(variables: Record<string, string>, classes: string[], options?): Promise<void>
  debouncedApplyTheme(variables, classes, delay?, options?): void
  cacheThemeData(themeId: string, variables, classes): CSSVariableCache
  preloadTheme(themeId: string, variables, classes): void
  clearCache(): void
  getPerformanceStats(): PerformanceStats
}
```

#### ThemeAccessibilityService
```typescript
class ThemeAccessibilityService {
  calculateContrastRatio(fg: string, bg: string): ContrastRatio
  simulateColorBlindness(color: string): ColorBlindnessSimulation
  applyAccessibilityEnhancements(settings: PersonalizationSettings): void
  testThemeAccessibility(colors: Record<string, string>): AccessibilityTestResult
  announceThemeChange(name: string, options?): void
  getAccessibilityStatus(): AccessibilityStatus
}
```

## Testing

### Running Tests

```bash
# Run all theme system tests
npm test -- --testPathPattern=theme

# Run specific test suites
npm test -- theme-persistence.test.ts
npm test -- theme-accessibility.test.ts
npm test -- useTheme.test.tsx
npm test -- theme-integration.test.tsx
```

### Test Coverage

The theme system includes comprehensive tests for:

- **Unit Tests**: Individual service and hook functionality
- **Integration Tests**: Component and service interactions
- **Accessibility Tests**: WCAG compliance and screen reader support
- **Performance Tests**: Optimization and caching functionality

### Writing Theme Tests

```typescript
import { renderHook } from '@testing-library/react';
import { useTheme, ThemeProvider } from '../hooks/useTheme';

test('should switch themes correctly', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );
  
  const { result } = renderHook(() => useTheme(), { wrapper });
  
  act(() => {
    result.current.setTheme('dark');
  });
  
  expect(result.current.theme).toBe('dark');
});
```

## Best Practices

### Theme Design

1. **Ensure Sufficient Contrast**: Always test color combinations for WCAG AA compliance
2. **Design for All Users**: Consider color blindness, motion sensitivity, and visual impairments
3. **Maintain Consistency**: Use the theme system's color scales and spacing consistently
4. **Test Across Devices**: Verify themes work well on different screen sizes and devices

### Performance

1. **Use CSS Custom Properties**: Leverage the built-in CSS variable system
2. **Minimize Direct DOM Manipulation**: Use the provided performance-optimized functions
3. **Preload Common Themes**: Use `preloadTheme()` for themes users are likely to switch to
4. **Cache Expensive Calculations**: The system automatically caches, but be mindful of custom calculations

### Accessibility

1. **Always Test Contrast**: Use `calculateContrastRatio()` for custom colors
2. **Provide Alternatives**: Don't rely solely on color to convey information
3. **Test with Screen Readers**: Verify announcements work correctly
4. **Support Keyboard Navigation**: Ensure all theme controls are keyboard accessible

### Code Organization

1. **Use TypeScript**: Take advantage of the strong typing for theme configurations
2. **Follow the Component Pattern**: Use the provided components rather than custom implementations
3. **Handle Errors Gracefully**: The system includes error boundaries and fallbacks
4. **Document Custom Themes**: Provide clear documentation for any custom theme configurations

## Troubleshooting

### Common Issues

#### Theme Not Applying
```typescript
// Check if theme is set correctly
const { theme, getCSSVariables } = useTheme();
console.log('Current theme:', theme);
console.log('CSS variables:', getCSSVariables());

// Ensure ThemeProvider is wrapping your app
// Check for CSS conflicts or specificity issues
```

#### Performance Issues
```typescript
// Check performance stats
import ThemePerformanceService from './services/theme-performance';
const service = ThemePerformanceService.getInstance();
console.log('Performance stats:', service.getPerformanceStats());

// Clear cache if needed
service.clearCache();
```

#### Accessibility Problems
```typescript
// Test theme accessibility
const { testThemeAccessibility } = useTheme();
const results = testThemeAccessibility();
console.log('Accessibility issues:', results.issues);
console.log('Recommendations:', results.recommendations);
```

#### Sync Issues
```typescript
// Check sync status
const { cloudSyncStatus, forceCloudSync } = useTheme();
console.log('Sync status:', cloudSyncStatus);

// Force sync if needed
try {
  await forceCloudSync();
} catch (error) {
  console.error('Sync failed:', error);
}
```

### Error Handling

The theme system includes comprehensive error handling:

1. **Graceful Degradation**: Falls back to default themes if custom themes fail
2. **Data Recovery**: Automatic backup restoration for corrupted data
3. **Network Resilience**: Offline support with sync when connection returns
4. **User Feedback**: Clear error messages and recovery suggestions

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// In development environment
localStorage.setItem('theme-debug', 'true');

// Check console for detailed theme system logs
```

### Getting Help

1. **Check the Console**: Look for theme system error messages
2. **Verify Configuration**: Ensure ThemeProvider is properly configured
3. **Test in Isolation**: Create minimal reproductions of issues
4. **Check Network**: Verify cloud sync connectivity
5. **Review Documentation**: Ensure you're following the documented patterns

## Conclusion

The Relife Theme System provides a comprehensive solution for theming, personalization, and accessibility. It's designed to be performant, accessible, and user-friendly while providing powerful customization capabilities.

For additional support or feature requests, please refer to the project's issue tracker or documentation updates.