# Remaining ESLint Issues Analysis

## Issues Categories Found

Based on analysis of key files (`src/App.tsx`, `src/components/AlarmList.tsx`,
`src/components/SettingsPage.tsx`), the remaining issues fall into these categories:

### 1. Unused Imports (8 issues)

**Issue**: Components/types imported but never referenced in the file **Risk**: Low - Safe to remove
**Files Affected**:

- `src/App.tsx`: `AlarmDifficulty`, `EmotionalTone`
- `src/components/AlarmList.tsx`: `Zap`
- `src/components/SettingsPage.tsx`: `LogOut`, `AlertTriangle`

**Recommendation**: Remove unused imports

### 2. Unused Assigned Variables (15 issues)

**Issue**: Variables assigned from function calls but never used **Risk**: Low-Medium - May indicate
incomplete features **Files Affected**:

- `src/App.tsx`: `getActionLabels`, `isRTL`, `getDirectionStyles`, `formatAlarmTime`,
  `getCSSVariables`, `getThemeClasses`, `trackPageView`, `setUserProperties`,
  `trackFeatureDiscovery`, `performHealthCheck`, `playClick`, `playError`, `keyboardService`,
  `mobileService`, `focusService`
- `src/components/AlarmList.tsx`: `announceListChange`
- `src/components/SettingsPage.tsx`: `availableThemes`, `handlePushNotificationsToggle`

**Recommendation**: Prefix with underscore (`_`) to indicate intentionally unused

### 3. Unused Destructured Variables (4 issues)

**Issue**: Variables extracted from destructuring but not used **Risk**: Low - Safe to prefix with
underscore **Files Affected**:

- `src/App.tsx`: `tabProtectionEnabled`, `emotionalState`
- `src/components/AlarmList.tsx`: `hours`, `minutes`
- `src/components/SettingsPage.tsx`: `tabProtectionEnabled`, `setTabProtectionEnabled`

**Recommendation**: Prefix with underscore (`_`)

### 4. Unused Function Parameters (2 issues)

**Issue**: Event parameters in functions not used **Risk**: Low - Safe to prefix with underscore
**Files Affected**:

- `src/App.tsx`: `event` parameters (2 occurrences)

**Recommendation**: Rename to `_event`

### 5. React Hook Dependencies (5 issues)

**Issue**: Missing dependencies in useEffect/useCallback hooks **Risk**: HIGH - Can cause bugs or
infinite re-renders **Files Affected**:

- `src/App.tsx`:
  - Missing `refreshRewardsSystem` in useCallback deps
  - Missing `handleServiceWorkerAlarmTrigger` in useCallback deps
  - Missing `handleServiceWorkerMessage` in useEffect deps (2 occurrences)
  - Missing `track`, `trackSessionActivity` in useEffect deps
- `src/components/AlarmList.tsx`:
  - Missing `loadAlarmOptimizations` in useEffect deps

**Recommendation**: Careful review required - each needs individual analysis

## Priority Order for Fixes

### Phase 1: Safe Fixes (Low Risk)

1. Remove unused imports
2. Prefix unused parameters with underscore
3. Prefix unused destructured variables with underscore
4. Prefix unused assigned variables with underscore

### Phase 2: Careful Review (High Risk)

1. Analyze each React hook dependency case individually
2. Test thoroughly after each hook dependency fix

## Estimated Impact

- **26 issues** in `src/App.tsx` (main application file)
- **11 issues** across component files
- **Total**: ~37+ remaining issues across the codebase

## Tools for Analysis

Created systematic approach to:

1. Identify issue categories
2. Assess risk levels
3. Provide specific recommendations
4. Prioritize fixes by safety level
