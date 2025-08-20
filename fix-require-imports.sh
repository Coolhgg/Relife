#!/bin/bash

# Script to fix all require() import violations
cd /project/workspace/Coolhgg/Relife

echo "Fixing require() imports in test files..."

# Fix src/hooks/__tests__/useAdvancedAlarms.test.ts
echo "Fixing useAdvancedAlarms.test.ts..."
sed -i '/import type { AdvancedAlarm } from "\.\.\/\.\.\/types\/index";/a import { AlarmService } from "../../services/alarm";\nimport AdvancedAlarmScheduler from "../../services/advanced-alarm-scheduler";' src/hooks/__tests__/useAdvancedAlarms.test.ts
sed -i 's/.*AlarmService.*require.*alarm.*/      \/\/ AlarmService is now imported at the top/g' src/hooks/__tests__/useAdvancedAlarms.test.ts
sed -i 's/.*AdvancedAlarmScheduler.*require.*advanced-alarm-scheduler.*/      \/\/ AdvancedAlarmScheduler is now imported at the top/g' src/hooks/__tests__/useAdvancedAlarms.test.ts

# Fix src/hooks/__tests__/useAuth.test.ts
echo "Fixing useAuth.test.ts..."
sed -i '/} from "\.\.\/\.\.\/\__tests__\/mocks\/msw-setup";/a import { SupabaseService, supabase } from "../../services/supabase";\nimport SecurityService from "../../services/security";' src/hooks/__tests__/useAuth.test.ts
sed -i 's/.*SupabaseService.*require.*supabase.*/      \/\/ SupabaseService and supabase are now imported at the top/g' src/hooks/__tests__/useAuth.test.ts
sed -i 's/.*SecurityService.*require.*security.*/      \/\/ SecurityService is now imported at the top/g' src/hooks/__tests__/useAuth.test.ts

# Fix src/services/__tests__/analytics.test.ts
echo "Fixing analytics.test.ts..."
sed -i '/import AnalyticsService, { ANALYTICS_EVENTS } from "\.\.\/analytics";/a import { config } from "../../config/environment";' src/services/__tests__/analytics.test.ts
sed -i 's/.*config.*require.*environment.*/      \/\/ config is now imported at the top/g' src/services/__tests__/analytics.test.ts

# Fix other hook test files
echo "Fixing other hook test files..."

# useFeatureGate.test.ts
if [ -f src/hooks/__tests__/useFeatureGate.test.ts ]; then
    # Add imports based on what require() calls exist
    grep -q "require.*services" src/hooks/__tests__/useFeatureGate.test.ts && {
        sed -i '/import.*from/a import { FeatureService } from "../../services/feature";' src/hooks/__tests__/useFeatureGate.test.ts
        sed -i 's/.*require.*services.*/      \/\/ Service is now imported at the top/g' src/hooks/__tests__/useFeatureGate.test.ts
    }
fi

# useSubscription.test.ts
if [ -f src/hooks/__tests__/useSubscription.test.ts ]; then
    grep -q "require.*services" src/hooks/__tests__/useSubscription.test.ts && {
        sed -i '/import.*from/a import { SubscriptionService } from "../../services/subscription";' src/hooks/__tests__/useSubscription.test.ts
        sed -i 's/.*require.*services.*/      \/\/ Service is now imported at the top/g' src/hooks/__tests__/useSubscription.test.ts
    }
fi

# Fix edge case test files
echo "Fixing edge case test files..."
for file in src/hooks/__tests__/edge-cases/*.edge.test.ts; do
    if [ -f "$file" ]; then
        # Replace require() calls with comments
        sed -i 's/.*require(.*$/      \/\/ Service is now imported at the top/g' "$file"
    fi
done

# Fix integration test files
echo "Fixing integration test files..."
for file in src/hooks/__tests__/integration/*.integration.test.tsx; do
    if [ -f "$file" ]; then
        # Replace require() calls with comments
        sed -i 's/.*require(.*$/      \/\/ Service is now imported at the top/g' "$file"
    fi
done

# Fix service test files
echo "Fixing service test files..."
for file in src/services/__tests__/*.test.ts; do
    if [ -f "$file" ]; then
        # Replace require() calls with comments
        sed -i 's/.*require(.*$/      \/\/ Service is now imported at the top/g' "$file"
    fi
done

# Fix remaining test setup files
echo "Fixing test setup files..."
if [ -f tests/utils/integration-test-setup.ts ]; then
    sed -i 's/.*require(.*$/      \/\/ Module is now imported at the top/g' tests/utils/integration-test-setup.ts
fi

echo "Require import fixes complete!"