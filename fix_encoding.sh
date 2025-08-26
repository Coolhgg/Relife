#!/bin/bash

# Fix character encoding issues - replace curly quotes with regular quotes
# This fixes the TS1003, TS1005, TS1109, and TS1434 errors caused by curly quotes

echo "Fixing character encoding issues in TypeScript files..."

# List of files with character encoding issues
files=(
    # Components
    "src/components/NuclearModeBattle.tsx"
    "src/components/NuclearModeChallenge.tsx"
    "src/components/PersonaAnalyticsDashboard.tsx"
    "src/components/PersonaDrivenUI.tsx"
    "src/components/PersonaFocusDashboard.tsx"
    "src/components/PushNotificationSettings.tsx"
    "src/components/SmartAlarmSettings.tsx"
    "src/components/SoundPreviewSystem.tsx"
    "src/components/SoundUploader.tsx"
    "src/components/SpecializedErrorBoundaries.tsx"
    "src/components/UpgradePrompt.tsx"
    "src/components/premium/PaymentFlow.tsx"
    "src/components/premium/PremiumAlarmFeatures.tsx"
    "src/components/premium/SubscriptionDashboard.tsx"
    "src/components/premium/SubscriptionManagement.tsx"
    "src/components/premium/SubscriptionPage.tsx"
    "src/components/ui/form.tsx"
    "src/components/user-testing/FeedbackModal.tsx"
    "src/components/user-testing/RedesignedFeedbackModal.tsx"
    
    # Contexts
    "src/contexts/FeatureAccessContext.tsx"
    "src/contexts/LanguageContext.tsx"
    
    # Hooks
    "src/hooks/useAccessibilityPreferences.ts"
    "src/hooks/useAnimations.ts"
    "src/hooks/useAudioLazyLoading.ts"
    "src/hooks/useCapacitor.ts"
    "src/hooks/usePushNotifications.ts"
    "src/hooks/useRealtime.tsx"
    "src/hooks/useSubscription.ts"
    
    # Services
    "src/services/advanced-conditions-helper.ts"
    "src/services/alarm-executor.ts"
    "src/services/base/BaseService.ts"
    "src/services/capacitor-enhanced.ts"
    "src/services/convertkit-service.ts"
    "src/services/email-campaigns.ts"
    "src/services/enhanced-alarm.ts"
    "src/services/enhanced-analytics.ts"
    "src/services/enhanced-battle.ts"
    "src/services/enhanced-performance-monitor.ts"
    "src/services/enhanced-subscription.ts"
    "src/services/enhanced-voice.ts"
    "src/services/notification.ts"
    "src/services/nuclear-mode.ts"
    "src/services/offline-gaming.ts"
    "src/services/revenue-analytics.ts"
    "src/services/scheduler-core.ts"
    "src/services/smart-alarm-scheduler.ts"
    "src/services/stripe-service.ts"
    "src/services/struggling-sam-api.ts"
    "src/services/subscription-service.ts"
    "src/services/subscription.ts"
    "src/services/theme-persistence.ts"
    "src/services/typed-realtime-service.ts"
    "src/services/voice-smart-integration.ts"
    
    # Utils
    "src/utils/http-client.ts"
)

# Backup directory
BACKUP_DIR="backup/pre-encoding-fix-$(date +%s)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in $BACKUP_DIR..."

# Process each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Create backup
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
        
        # Fix character encoding issues
        # Replace left and right double quotation marks with regular quotes
        sed -i 's/"/"/g; s/"/"/g; s/'/'\''/g; s/'/'\''/g' "$file"
    else
        echo "File not found: $file"
    fi
done

echo "Character encoding fixes completed!"
echo "Backup created in: $BACKUP_DIR"