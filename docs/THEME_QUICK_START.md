# Theme System Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Basic Integration

```tsx
// App.tsx
import { ThemeProvider } from './hooks/useTheme';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Use Theme in Components

```tsx
// MyComponent.tsx
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, getCSSVariables } = useTheme();

  return (
    <div style={getCSSVariables()}>
      <h1>Current theme: {theme}</h1>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### 3. Add Theme Management UI

```tsx
// Settings.tsx
import { ThemeManager } from './components/theme/ThemeManager';

function Settings() {
  return (
    <div>
      <h2>Settings</h2>
      <ThemeManager />
    </div>
  );
}
```

## 💡 Common Use Cases

### Theme Toggle Button

```tsx
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Accessibility-First Theme

```tsx
function AccessibleTheme() {
  const {
    updatePersonalization,
    testThemeAccessibility,
    calculateContrastRatio
  } = useTheme();

  const enableHighContrast = () => {
    updatePersonalization({
      accessibilityPreferences: {
        highContrastMode: true,
        largeTargets: true,
        boldText: true
      }
    });
  };

  const accessibilityScore = testThemeAccessibility().overallScore;

  return (
    <div>
      <p>Accessibility Score: {accessibilityScore}%</p>
      <button onClick={enableHighContrast}>
        Enable High Contrast
      </button>
    </div>
  );
}
```

### Custom Theme Creation

```tsx
function CustomThemeCreator() {
  const { createCustomTheme, setTheme } = useTheme();

  const createMyTheme = async () => {
    const customTheme = await createCustomTheme('light', {
      colors: {
        primary: { 500: '#ff6b6b' },
        background: { primary: '#f8f9fa' }
      }
    });

    setTheme('custom');
  };

  return (
    <button onClick={createMyTheme}>
      Create Custom Theme
    </button>
  );
}
```

### Performance-Optimized Theme Switching

```tsx
function PerformantThemeSwitcher() {
  const {
    applyThemeWithPerformance,
    preloadTheme,
    setTheme
  } = useTheme();

  useEffect(() => {
    // Preload themes for faster switching
    preloadTheme('dark');
    preloadTheme('light');
  }, [preloadTheme]);

  const switchTheme = async (theme: Theme) => {
    setTheme(theme);
    await applyThemeWithPerformance({
      animate: true,
      duration: 300
    });
  };

  return (
    <div>
      <button onClick={() => switchTheme('light')}>Light</button>
      <button onClick={() => switchTheme('dark')}>Dark</button>
    </div>
  );
}
```

## 🎨 Styling with CSS Variables

The theme system automatically provides CSS variables:

```css
/* Use in your CSS */
.my-component {
  background-color: var(--theme-background);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}

.my-button {
  background: var(--color-primary-500);
  padding: var(--spacing-4);
  border-radius: var(--border-radius-md);
}
```

## 🔧 Configuration Options

### Theme Provider Options

```tsx
<ThemeProvider
  defaultTheme="system"          // Initial theme
  storageKey="my-app-theme"      // Storage key
  enableSystem={true}            // System theme detection
>
  <App />
</ThemeProvider>
```

### Available Themes

- `light` - Clean bright interface
- `dark` - Dark mode interface
- `system` - Follows OS preference
- `auto` - Time-based switching
- `high-contrast` - Enhanced accessibility
- `custom` - User-defined themes

## ♿ Accessibility Features

### Enable Accessibility Mode

```tsx
function AccessibilitySettings() {
  const { updatePersonalization } = useTheme();

  const enableAccessibility = () => {
    updatePersonalization({
      accessibilityPreferences: {
        screenReaderOptimized: true,
        keyboardNavigationOnly: true,
        highContrastMode: true,
        largeTargets: true,
        reducedTransparency: true,
        boldText: true,
        underlineLinks: true,
        flashingElementsReduced: true
      }
    });
  };

  return (
    <button onClick={enableAccessibility}>
      Enable Full Accessibility Mode
    </button>
  );
}
```

### Test Color Contrast

```tsx
function ContrastTester() {
  const { calculateContrastRatio } = useTheme();

  const checkContrast = (fg: string, bg: string) => {
    const result = calculateContrastRatio(fg, bg);
    console.log(`Contrast: ${result.ratio}, Level: ${result.level}`);
    return result.isAccessible;
  };

  return (
    <div>
      <p>Text is accessible: {checkContrast('#000', '#fff')}</p>
    </div>
  );
}
```

## 🌥️ Cloud Sync

### Enable Cloud Synchronization

```tsx
function CloudSyncSettings() {
  const {
    enableCloudSync,
    cloudSyncStatus,
    syncThemes
  } = useTheme();

  return (
    <div>
      <button onClick={() => enableCloudSync(true)}>
        Enable Cloud Sync
      </button>
      <p>Status: {cloudSyncStatus.isSyncing ? 'Syncing...' : 'Ready'}</p>
      <button onClick={syncThemes}>Force Sync</button>
    </div>
  );
}
```

## 📱 Responsive Theming

```css
/* Responsive theme utilities */
@media (max-width: 768px) {
  .theme-responsive {
    --spacing-scale: 0.8;
    --font-size-scale: 0.9;
  }
}

@media (min-width: 1200px) {
  .theme-responsive {
    --spacing-scale: 1.2;
    --font-size-scale: 1.1;
  }
}
```

## 🧪 Testing Themes

### Test Theme Accessibility

```tsx
function ThemeAccessibilityTest() {
  const { testThemeAccessibility } = useTheme();

  const runTest = () => {
    const results = testThemeAccessibility();
    console.log('Accessibility Score:', results.overallScore);
    console.log('Issues:', results.issues);
    console.log('Recommendations:', results.recommendations);
  };

  return <button onClick={runTest}>Test Accessibility</button>;
}
```

### Color Blindness Testing

```tsx
function ColorBlindnessTest() {
  const { simulateColorBlindness } = useTheme();

  const testColor = '#ff0000';
  const simulations = simulateColorBlindness(testColor);

  return (
    <div>
      <div style={{ background: testColor }}>Original</div>
      <div style={{ background: simulations.protanopia }}>Protanopia</div>
      <div style={{ background: simulations.deuteranopia }}>Deuteranopia</div>
      <div style={{ background: simulations.tritanopia }}>Tritanopia</div>
    </div>
  );
}
```

## 📦 Import/Export Themes

### Export User Themes

```tsx
function ThemeBackup() {
  const { exportThemes, importThemes } = useTheme();

  const backup = async () => {
    const data = await exportThemes();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-themes.json';
    a.click();
  };

  const restore = async (file: File) => {
    const text = await file.text();
    const success = await importThemes(text);
    console.log('Import success:', success);
  };

  return (
    <div>
      <button onClick={backup}>Export Themes</button>
      <input
        type="file"
        accept=".json"
        onChange={(e) => restore(e.target.files?.[0]!)}
      />
    </div>
  );
}
```

## ⚡ Performance Tips

1. **Use CSS Variables**: Always use the provided CSS variables instead of hardcoded values
2. **Preload Themes**: Use `preloadTheme()` for themes users might switch to
3. **Debounce Updates**: The system automatically debounces, but avoid rapid theme changes
4. **Test Performance**: Monitor performance with `getPerformanceStats()`

```tsx
// Good ✅
const { getCSSVariables } = useTheme();
const styles = getCSSVariables();

// Bad ❌
const styles = { color: '#000000' }; // Hardcoded values
```

## 🐛 Troubleshooting

### Common Issues

**Theme not applying?**
```tsx
// Check theme state
const { theme, getCSSVariables } = useTheme();
console.log('Current theme:', theme);
console.log('CSS variables:', getCSSVariables());
```

**Performance issues?**
```tsx
// Check performance stats
import ThemePerformanceService from './services/theme-performance';
const service = ThemePerformanceService.getInstance();
console.log(service.getPerformanceStats());
```

**Accessibility problems?**
```tsx
const { testThemeAccessibility } = useTheme();
const report = testThemeAccessibility();
console.log('Issues:', report.issues);
```

## 📚 Next Steps

1. Read the [Full Documentation](THEME_SYSTEM.md)
2. Check the [API Reference](THEME_API_REFERENCE.md)
3. Explore the [Component Examples](../src/components/theme/)
4. Run the test suite to see examples

## 🎯 Pro Tips

- Always test themes with accessibility tools
- Use the built-in contrast testing before deploying
- Enable cloud sync for better user experience
- Consider preloading themes for faster switching
- Test on different devices and screen sizes
- Use the performance monitoring tools in development

Happy theming! 🎨