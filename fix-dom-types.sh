#!/bin/bash

# Script to fix DOM type references in files
cd /project/workspace/Coolhgg/Relife

echo "Adding DOM lib references to files that need DOM types..."

# Files that need DOM types based on ESLint errors
FILES_NEEDING_DOM=(
    "src/__tests__/providers/service-providers.tsx"
    "src/__tests__/utils/hook-testing-utils.tsx" 
    "src/hooks/useEnhancedServiceWorker.ts"
    "src/hooks/usePWA.ts"
    "src/services/__tests__/push-notifications.test.ts"
    "src/services/notification.ts"
    "src/services/pwa-manager.ts"
    "src/utils/service-worker-manager.ts"
    "tests/integration/notification-service-worker.integration.test.tsx"
)

for file in "${FILES_NEEDING_DOM[@]}"; do
    if [ -f "$file" ]; then
        echo "Adding DOM lib reference to $file"
        # Check if DOM reference already exists
        if ! grep -q "/// <reference lib=" "$file"; then
            sed -i '1i /// <reference lib="dom" />' "$file"
        fi
    fi
done

echo "DOM type fixes complete!"