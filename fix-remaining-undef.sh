#!/bin/bash

# Script to fix remaining no-undef violations
cd /project/workspace/Coolhgg/Relife

echo "Fixing remaining no-undef violations..."

# Fix NodeJS types - add Node.js type reference where needed
echo "Adding Node.js type references..."
FILES_NEEDING_NODE=(
    "src/backend/analytics.ts"
    "src/backend/api.ts"
    "src/backend/data-processing.ts"
    "src/backend/edge-functions.ts"
    "src/services/analytics.ts"
    "src/services/cache.ts"
    "src/services/error-handler.ts"
    "src/utils/file-processor.ts"
    "src/utils/environment.ts"
)

for file in "${FILES_NEEDING_NODE[@]}"; do
    if [ -f "$file" ]; then
        if ! grep -q "/// <reference types=" "$file"; then
            sed -i '1i /// <reference types="node" />' "$file"
        fi
    fi
done

# Fix HeadersInit and other Fetch API types - add lib.dom reference
echo "Adding DOM references for Fetch API types..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "HeadersInit\|RequestInit\|ResponseInit" | while read file; do
    if ! grep -q "/// <reference lib=" "$file"; then
        sed -i '1i /// <reference lib="dom" />' "$file"
    fi
done

# Fix Web Vitals imports
echo "Adding web-vitals imports where needed..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "getCLS\|getFID\|getFCP\|getLCP\|getTTFB" | while read file; do
    if ! grep -q "web-vitals" "$file"; then
        sed -i '1i import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";' "$file"
    fi
done

# Fix jasmine globals - add to test files
echo "Adding jasmine globals to test files..."
find . -name "*.spec.ts" -o -name "*.spec.tsx" | while read file; do
    if ! grep -q "/// <reference types=" "$file"; then
        sed -i '1i /// <reference types="jasmine" />' "$file"
    fi
done

# Fix Service imports where missing
echo "Adding missing service imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "SubscriptionService" | while read file; do
    if ! grep -q "import.*SubscriptionService" "$file"; then
        sed -i '1i import { SubscriptionService } from "../services/subscription";' "$file"
    fi
done

echo "Remaining no-undef fixes complete!"