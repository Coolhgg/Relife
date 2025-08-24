# TypeScript Error Analysis - Phase 1b

## Summary

- **Total errors**: 2065
- **Categories**: 9

## Phase 1b Focus Areas

- **Wakeup Mood Enum**: 6 errors
- **Timeout Conflicts**: 37 errors
- **Import Export Mismatches**: 44 errors
- **Accessibility Styles**: 0 errors

## Detailed Breakdown by Category

### Other Errors (972 errors)

1. **src/components/AdaptiveButton.tsx:161** - TS2722 Cannot invoke an object which is possibly
   'undefined'.

2. **src/components/AnalyticsProvider.tsx:226** - TS2554 Expected 1 arguments, but got 0.

3. **Type 'undefined' is not assignable to type 'Alarm[]'. src/components/Dashboard.tsx:49** -
   TS18048 'alarms' is possibly 'undefined'.

4. **src/components/Dashboard.tsx:72** - TS18048 'alarms' is possibly 'undefined'.

5. **src/components/Dashboard.tsx:74** - TS18048 'alarms' is possibly 'undefined'.

6. **Type 'void' is not assignable to type 'Promise<void>'.
   src/components/HabitCelebration.tsx:98** - TS2554 Expected 1 arguments, but got 0.

7. **src/components/NuclearModeBattle.tsx:16** - TS2614 Module '"./PremiumGate"' has no exported
   member 'PremiumGate'. Did you mean to use 'import PremiumGate from "./PremiumGate"' instead?

8. **src/components/NuclearModeChallenge.tsx:32** - TS2395 Individual declarations in merged
   declaration 'NuclearModeChallenge' must be all exported or all local.

9. **src/components/NuclearModeChallenge.tsx:574** - TS2395 Individual declarations in merged
   declaration 'NuclearModeChallenge' must be all exported or all local.

10. **src/components/OfflineDiagnostics.tsx:175** - TS18046 'error' is of type 'unknown'.

    _... and 962 more errors in this category_

### Property Access Errors (422 errors)

1. **src/**tests**/utils/hook-testing-utils.tsx:68** - TS2339 Property '\_initialEntries' does not
   exist on type 'AllTheProvidersProps'.

2. **src/backend/cloudflare-functions.ts:881** - TS2339 Property 'list' does not exist on type
   'KVNamespace'.

3. **src/components/AdvancedAlarmScheduling.tsx:442** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

4. **src/components/AdvancedAlarmScheduling.tsx:447** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

5. **src/components/AdvancedAlarmScheduling.tsx:449** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

6. **src/components/AdvancedAlarmScheduling.tsx:456** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

7. **src/components/AdvancedAlarmScheduling.tsx:461** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

8. **src/components/AdvancedAlarmScheduling.tsx:463** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

9. **src/components/AdvancedAlarmScheduling.tsx:488** - TS2339 Property 'recurrencePattern' does not
   exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
   number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
   voiceMood: string; }'.

10. **src/components/AdvancedAlarmScheduling.tsx:494** - TS2339 Property 'recurrencePattern' does
    not exist on type '{ time: string; label: string; scheduleType: string; isActive: boolean; days:
    number[]; sound: string; difficulty: string; snoozeEnabled: boolean; snoozeInterval: number;
    voiceMood: string; }'.

    _... and 412 more errors in this category_

### Type Assignment Errors (327 errors)

1. **src/components/AlarmForm.tsx:98** - TS2345 Argument of type 'string' is not assignable to
   parameter of type 'SubscriptionTier'.

2. **src/components/CSRFProtection.tsx:63** - TS2769 No overload matches this call.

3. **props: P & { csrfToken: string; }): string | number | bigint | boolean | ReactElement<unknown,
   string | JSXElementConstructor<any>> | ... 4 more ... | undefined', gave the following error.
   Type 'PropsWithoutRef<P> & { csrfToken: string; ref: ForwardedRef<any>; }' is not assignable to
   type 'IntrinsicAttributes & P & { csrfToken: string; }'. Type 'PropsWithoutRef<P> & { csrfToken:
   string; ref: ForwardedRef<any>; }' is not assignable to type 'P'. 'PropsWithoutRef<P> & {
   csrfToken: string; ref: ForwardedRef<any>; }' is assignable to the constraint of type 'P', but
   'P' could be instantiated with a different subtype of constraint 'object'.
   src/components/CloudSyncControls.tsx:26** - TS2345 Argument of type 'Date | null | undefined' is
   not assignable to parameter of type 'SetStateAction<Date | null>'.

4. **src/components/CompleteThemeSystemDemo.tsx:743** - TS2322 Type 'string' is not assignable to
   type 'number'.

5. **src/components/CompleteThemeSystemDemo.tsx:743** - TS2322 Type 'string' is not assignable to
   type 'number'.

6. **src/components/CompleteThemeSystemDemo.tsx:743** - TS2322 Type 'string' is not assignable to
   type 'number'.

7. **src/components/CompleteThemeSystemDemo.tsx:743** - TS2322 Type 'string' is not assignable to
   type 'number'.

8. **src/components/CompleteThemeSystemDemo.tsx:743** - TS2322 Type 'string' is not assignable to
   type 'number'.

9. **src/components/CustomThemeManager.tsx:186** - TS2345 Argument of type 'string | undefined' is
   not assignable to parameter of type 'string'.

10. **src/components/CustomThemeManager.tsx:730** - TS2322 Type 'string | undefined' is not
    assignable to type 'string'.

    _... and 317 more errors in this category_

### Object Property Errors (144 errors)

1. **src/components/BattleSystem.tsx:287** - TS2353 Object literal may only specify known
   properties, and 'wakeWindow' does not exist in type 'BattleSettings'.

2. **src/components/Gamification.tsx:352** - TS2561 Object literal may only specify known
   properties, but 'rewards' does not exist in type 'Partial<Quest>'. Did you mean to write
   'reward'?

3. **src/components/MediaContent.tsx:212** - TS2353 Object literal may only specify known
   properties, and 'percentage' does not exist in type 'StorageInfo'.

4. **src/components/MediaContent.tsx:217** - TS2353 Object literal may only specify known
   properties, and 'defaultSoundCategory' does not exist in type 'ContentPreferences'.

5. **src/components/PremiumDashboard.tsx:164** - TS2353 Object literal may only specify known
   properties, and 'tier' does not exist in type 'DashboardState | (() => DashboardState)'.

6. **src/components/WakeUpFeedbackModal.tsx:56** - TS2353 Object literal may only specify known
   properties, and 'wouldPreferEarlier' does not exist in type 'Partial<WakeUpFeedback> | (() =>
   Partial<WakeUpFeedback>)'.

7. **src/components/WakeUpFeedbackModal.tsx:75** - TS2353 Object literal may only specify known
   properties, and 'wouldPreferEarlier' does not exist in type
   'SetStateAction<Partial<WakeUpFeedback>>'.

8. **src/components/WakeUpFeedbackModal.tsx:293** - TS2561 Object literal may only specify known
   properties, but 'wouldPreferEarlier' does not exist in type 'Partial<WakeUpFeedback>'. Did you
   mean to write 'wouldPreferearlier'?

9. **src/components/WakeUpFeedbackModal.tsx:312** - TS2561 Object literal may only specify known
   properties, but 'wouldPreferEarlier' does not exist in type 'Partial<WakeUpFeedback>'. Did you
   mean to write 'wouldPreferearlier'?

10. **src/components/premium/EnhancedUpgradePrompt.tsx:104** - TS2353 Object literal may only
    specify known properties, and 'tier' does not exist in type '{ title: string; description:
    string; icon: ReactNode; benefits: string[]; color: string; gradient: string; }'.

    _... and 134 more errors in this category_

### Implicit Any (107 errors)

1. **src/components/AdvancedAlarmScheduling.tsx:236** - TS7006 Parameter 'o' implicitly has an 'any'
   type.

2. **src/components/AdvancedAlarmScheduling.tsx:246** - TS7006 Parameter 'r' implicitly has an 'any'
   type.

3. **src/components/AdvancedAlarmScheduling.tsx:256** - TS7006 Parameter 't' implicitly has an 'any'
   type.

4. **src/components/AdvancedAlarmScheduling.tsx:600** - TS7006 Parameter 'o' implicitly has an 'any'
   type.

5. **src/components/AdvancedAlarmScheduling.tsx:607** - TS7006 Parameter 'o' implicitly has an 'any'
   type.

6. **src/components/CommunityHub.tsx:580** - TS7006 Parameter 'e' implicitly has an 'any' type.

7. **Property 'rewards' does not exist on type '"spring"'.
   src/components/EnhancedBattles.tsx:388** - TS7006 Parameter 'reward' implicitly has an 'any'
   type.

8. **Property 'onAchievementClick' does not exist on type 'IntrinsicAttributes &
   AchievementBadgesProps'. src/components/EnhancedDashboard.tsx:283** - TS7006 Parameter
   'achievement' implicitly has an 'any' type.

9. **src/components/EnhancedDashboard.tsx:288** - TS7006 Parameter 'achievement' implicitly has an
   'any' type.

10. **Property 'onChallengeShare' does not exist on type 'IntrinsicAttributes &
    CommunityChallengeProps'. src/components/EnhancedDashboard.tsx:324** - TS7006 Parameter
    'challengeId' implicitly has an 'any' type.

    _... and 97 more errors in this category_

### Import Export Mismatches (44 errors)

1. **src/**tests**/utils/hook-testing-utils.tsx:6** - TS2724 '"react"' has no exported member named
   '\_ReactElement'. Did you mean 'ReactElement'?

2. **src/components/AlarmForm.tsx:26** - TS2307 Cannot find module './\_NuclearModeSelector' or its
   corresponding type declarations.

3. **src/components/AlarmManagement.tsx:3** - TS2724 '"@/components/ui/card"' has no exported member
   named '\_CardHeader'. Did you mean 'CardHeader'?

4. **src/components/AlarmManagement.tsx:3** - TS2724 '"@/components/ui/card"' has no exported member
   named '\_CardTitle'. Did you mean 'CardTitle'?

5. **src/components/AlarmTester.tsx:4** - TS2724 '"@/components/ui/badge"' has no exported member
   named '\_Badge'. Did you mean 'Badge'?

6. **src/components/AlarmTester.tsx:18** - TS2724 '"../types/index"' has no exported member named
   '\_VoiceMood'. Did you mean 'VoiceMood'?

7. **src/components/AlarmThemeBrowser.tsx:31** - TS2724 '"lucide-react"' has no exported member
   named '\_Zap'. Did you mean 'Zap'?

8. **src/components/AlarmThemeBrowser.tsx:36** - TS2724 '"lucide-react"' has no exported member
   named '\_Settings'. Did you mean 'Settings'?

9. **src/components/AlarmThemeBrowser.tsx:37** - TS2724 '"lucide-react"' has no exported member
   named '\_Download'. Did you mean 'Download'?

10. **src/components/AlarmThemeBrowser.tsx:38** - TS2724 '"lucide-react"' has no exported member
    named '\_Upload'. Did you mean 'Upload'?

    _... and 34 more errors in this category_

### Timeout Conflicts (37 errors)

1. **src/components/SoundPreviewSystem.tsx:373** - TS2345 Argument of type 'Timeout' is not
   assignable to parameter of type 'number'.

2. **src/components/VoiceCloning.tsx:97** - TS2322 Type 'Timeout' is not assignable to type
   'number'.

3. **src/hooks/useAudioLazyLoading.ts:249** - TS2322 Type 'Timeout' is not assignable to type
   'number'.

4. **Types of property 'favoriteCategories' are incompatible. Type 'string[] | undefined' is not
   assignable to type 'string[]'. Type 'undefined' is not assignable to type 'string[]'.
   src/hooks/useAuth.ts:9** - TS2300 Duplicate identifier 'TimeoutHandle'.

5. **src/hooks/useAuth.ts:10** - TS2300 Duplicate identifier 'TimeoutHandle'.

6. **src/hooks/useCriticalPreloading.ts:91** - TS2322 Type 'Timeout' is not assignable to type
   'number'.

7. **src/hooks/useEnhancedCaching.ts:103** - TS2322 Type 'Timeout' is not assignable to type
   'number'.

8. **src/hooks/useEnhancedCaching.ts:386** - TS2322 Type 'Timeout' is not assignable to type
   'number'.

9. **src/hooks/useScreenReaderAnnouncements.ts:331** - TS2322 Type 'Timeout' is not assignable to
   type 'number'.

10. **src/hooks/useSubscription.ts:211** - TS2322 Type 'Timeout' is not assignable to type 'number'.

    _... and 27 more errors in this category_

### Wakeup Mood Enum (6 errors)

1. **src/components/AdvancedAnalytics.tsx:381** - TS7053 Element implicitly has an 'any' type
   because expression of type 'WakeUpMood' can't be used to index type 'Record<WakeUpMood, number>'.

2. **src/components/AdvancedAnalytics.tsx:381** - TS7053 Element implicitly has an 'any' type
   because expression of type 'WakeUpMood' can't be used to index type 'Record<WakeUpMood, number>'.

3. **src/types/index.ts:1318** - TS2304 Cannot find name 'WakeUpMood'.

4. **src/types/index.ts:3174** - TS2304 Cannot find name 'WakeUpMood'.

5. **src/types/index.ts:3247** - TS2304 Cannot find name 'WakeUpMood'.

6. **src/types/index.ts:3302** - TS2304 Cannot find name 'WakeUpMood'.

### Missing Type Declarations (6 errors)

1. **src/components/NuclearModeBattle.tsx:13** - TS2305 Module '"lucide-react"' has no exported
   member 'Explosion'.

2. **Type 'undefined' is not assignable to type 'string'. src/components/SoundUploader.tsx:42** -
   TS2305 Module '"../types/custom-sound-themes"' has no exported member 'SoundUploadProgress'.

3. **src/components/SoundUploader.tsx:43** - TS2305 Module '"../types/custom-sound-themes"' has no
   exported member 'SoundUploadResult'.

4. **src/components/ThemeStudio.tsx:4** - TS2305 Module '"lucide-react"' has no exported member
   'Gallery'.

5. **src/components/VoicePersonalitySelector.tsx:16** - TS2305 Module '"lucide-react"' has no
   exported member 'Fire'.

6. **Types of parameters 'value' and 'value' are incompatible. Type 'string' is not assignable to
   type 'SetStateAction<"drill-sergeant" | "motivational" | "gentle" | "zen">'.
   src/components/premium/PsychologyDrivenCTA.tsx:15** - TS2305 Module '"lucide-react"' has no
   exported member 'Fire'.
