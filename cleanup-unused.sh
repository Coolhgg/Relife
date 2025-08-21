#!/bin/bash

# Remove unused imports from specific files
echo "Cleaning up unused variables..."

# PersonaPrediction.tsx - already done
echo "✓ PersonaPrediction.tsx - already cleaned"

# form.tsx - already done  
echo "✓ form.tsx - already cleaned"

# sidebar.tsx
echo "Cleaning sidebar.tsx..."
sed -i '/useIsMobile/d' relife-campaign-dashboard/src/components/ui/sidebar.tsx
sed -i '/SIDEBAR_COOKIE_NAME,/d' relife-campaign-dashboard/src/components/ui/sidebar.tsx
sed -i '/SIDEBAR_COOKIE_MAX_AGE,/d' relife-campaign-dashboard/src/components/ui/sidebar.tsx
sed -i '/SIDEBAR_KEYBOARD_SHORTCUT,/d' relife-campaign-dashboard/src/components/ui/sidebar.tsx
sed -i '/SidebarContext,/d' relife-campaign-dashboard/src/components/ui/sidebar.tsx
sed -i '/type SidebarContextProps,/d' relife-campaign-dashboard/src/components/ui/sidebar.tsx

echo "Cleaned specific unused imports"
