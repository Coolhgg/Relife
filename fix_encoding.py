#!/usr/bin/env python3
"""
Fix character encoding issues in TypeScript files.
Replace curly quotes with regular quotes to fix TS compilation errors.
"""

import os
import glob

def fix_file_encoding(file_path):
    """Fix character encoding in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace curly quotes with regular quotes
        content = content.replace('"', '"')  # Left double quotation mark
        content = content.replace('"', '"')  # Right double quotation mark
        content = content.replace(''', "'")  # Left single quotation mark
        content = content.replace(''', "'")  # Right single quotation mark
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Fixed: {file_path}")
        return True
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False

def main():
    """Fix encoding issues in all affected files."""
    
    # List of files with character encoding issues
    files = [
        # Components
        "src/components/NuclearModeBattle.tsx",
        "src/components/NuclearModeChallenge.tsx", 
        "src/components/PersonaAnalyticsDashboard.tsx",
        "src/components/PersonaDrivenUI.tsx",
        "src/components/PersonaFocusDashboard.tsx",
        "src/components/PushNotificationSettings.tsx",
        "src/components/SmartAlarmSettings.tsx",
        "src/components/SoundPreviewSystem.tsx",
        "src/components/SoundUploader.tsx",
        "src/components/SpecializedErrorBoundaries.tsx",
        "src/components/UpgradePrompt.tsx",
        "src/components/premium/PaymentFlow.tsx",
        "src/components/premium/PremiumAlarmFeatures.tsx",
        "src/components/premium/SubscriptionDashboard.tsx",
        "src/components/premium/SubscriptionManagement.tsx",
        "src/components/premium/SubscriptionPage.tsx",
        "src/components/ui/form.tsx",
        "src/components/user-testing/FeedbackModal.tsx",
        "src/components/user-testing/RedesignedFeedbackModal.tsx",
        
        # Contexts
        "src/contexts/FeatureAccessContext.tsx",
        "src/contexts/LanguageContext.tsx",
        
        # Hooks
        "src/hooks/useAccessibilityPreferences.ts",
        "src/hooks/useAnimations.ts",
        "src/hooks/useAudioLazyLoading.ts",
        "src/hooks/useCapacitor.ts",
        "src/hooks/usePushNotifications.ts",
        "src/hooks/useRealtime.tsx",
        "src/hooks/useSubscription.ts",
        
        # Services
        "src/services/advanced-conditions-helper.ts",
        "src/services/alarm-executor.ts",
        "src/services/base/BaseService.ts",
        "src/services/capacitor-enhanced.ts",
        "src/services/convertkit-service.ts",
        "src/services/email-campaigns.ts",
        "src/services/enhanced-alarm.ts",
        "src/services/enhanced-analytics.ts",
        "src/services/enhanced-battle.ts",
        "src/services/enhanced-performance-monitor.ts",
        "src/services/enhanced-subscription.ts",
        "src/services/enhanced-voice.ts",
        "src/services/notification.ts",
        "src/services/nuclear-mode.ts",
        "src/services/offline-gaming.ts",
        "src/services/revenue-analytics.ts",
        "src/services/scheduler-core.ts",
        "src/services/smart-alarm-scheduler.ts",
        "src/services/stripe-service.ts",
        "src/services/struggling-sam-api.ts",
        "src/services/subscription-service.ts",
        "src/services/subscription.ts",
        "src/services/theme-persistence.ts",
        "src/services/typed-realtime-service.ts",
        "src/services/voice-smart-integration.ts",
        
        # Utils
        "src/utils/http-client.ts"
    ]
    
    print("Fixing character encoding issues in TypeScript files...")
    
    fixed_count = 0
    for file_path in files:
        if os.path.exists(file_path):
            if fix_file_encoding(file_path):
                fixed_count += 1
        else:
            print(f"File not found: {file_path}")
    
    print(f"\nCompleted! Fixed {fixed_count} files.")

if __name__ == "__main__":
    main()