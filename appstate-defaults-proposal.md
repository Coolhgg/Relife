# AppState Default Values Proposal - Step 01

## Current Issue
TypeScript compilation failing due to missing required properties in AppState initialization:
- `currentTheme: Theme`
- `themeConfig: ThemeConfig`
- `personalization: PersonalizationSettings`
- `availableThemes: ThemePreset[]`

## Current State (App.tsx line 152-169)
```typescript
const [appState, setAppState] = useState<AppState>({
  user: null,
  alarms: [],
  activeAlarm: null,
  permissions: {
    notifications: { granted: false },
    microphone: { granted: false }
  },
  isOnboarding: true,
  currentView: 'dashboard',
  activeBattles: [],
  friends: [],
  achievements: [],
  tournaments: [],
  teams: [],
  theme: 'minimalist' // LEGACY - this is what needs to be updated
});
```

## Proposed Default Values

### 1. currentTheme: Theme
**Default:** `'light'`
**Rationale:** 
- Most common default theme
- Current app has `theme: 'minimalist'` but `light` is more universally accessible
- Minimalist is available as an option but light provides better initial UX

### 2. themeConfig: ThemeConfig
**Default:** `DEFAULT_THEMES['light']` (from useTheme.tsx)
**Rationale:**
- Complete theme configuration object already defined in useTheme.tsx
- Contains all necessary colors, typography, spacing, animations, effects, and accessibility settings
- Matches the currentTheme value

### 3. personalization: PersonalizationSettings
**Default:** `DEFAULT_PERSONALIZATION` (from useTheme.tsx)
**Rationale:**
- Comprehensive default settings already defined in useTheme.tsx
- Includes sensible defaults for:
  - Color preferences (no favorites/avoids, normal saturation/brightness)
  - Typography (medium size, system font, comfortable line height)
  - Motion (animations enabled, normal speed)
  - Sound (enabled at 70% volume)
  - Layout (comfortable density, bottom navigation)
  - Accessibility (all features disabled by default)

### 4. availableThemes: ThemePreset[]
**Default:** Array with light, dark, and high-contrast presets
**Rationale:**
- Basic set of universally useful themes
- Includes accessibility option (high-contrast)
- Can be expanded later with premium themes

## Migration Strategy

### Phase 1: Add missing properties with defaults
```typescript
const [appState, setAppState] = useState<AppState>({
  // ... existing properties ...
  currentTheme: 'light' as Theme,
  themeConfig: DEFAULT_THEMES['light'],
  personalization: DEFAULT_PERSONALIZATION,
  availableThemes: [
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
  ],
  theme: 'minimalist' // KEEP for backward compatibility during transition
});
```

### Phase 2: Remove legacy theme field (Step 3)
After ensuring all components use `currentTheme` instead of `theme`, the legacy field can be safely removed.

## Required Imports
```typescript
import { Theme, ThemeConfig, PersonalizationSettings, ThemePreset } from './types';
// Import from useTheme.tsx or extract to separate constants file
```

## Next Steps
1. Apply these defaults to fix TypeScript compilation
2. Verify app runs without errors
3. Test theme switching functionality
4. Extract constants to separate file for maintainability (Step 3)

## TODO Comments for Follow-up
```typescript
// TODO: Consider user's system preference for initial theme
// TODO: Load user's saved theme preferences from localStorage
// TODO: Integrate with user authentication to sync theme preferences
// TODO: Add theme preview functionality
// TODO: Implement theme analytics tracking
```