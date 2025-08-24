#!/usr/bin/env bash

# Simple conflict resolution for common patterns
echo "🔧 Resolving merge conflicts..."

# Function to resolve conflicts in a file
resolve_file_conflicts() {
    local file="$1"
    if [[ -f "$file" ]]; then
        echo "Resolving $file..."
        
        # Remove global VariantProps comments and auto-import comments
        sed -i '/<<<<<<< HEAD/,/>>>>>>> origin\/main/{
            # For global comment conflicts, take the main version (cleaner)
            /<<<<<<< HEAD/{
                N;N;N;N;N
                if (/\/\* global.*\*\/.*auto: added missing React import/) {
                    N
                    s/<<<<<<< HEAD\n\/\* global[^*]*\*\/\n[^\n]*auto: added missing React import[^\n]*\n=======\n\([^\n]*\)\n>>>>>>> origin\/main/\1/
                }
            }
        }' "$file"
        
        # Simple pattern: prefer main for clean imports
        sed -i 's/<<<<<<< HEAD\n\/\* global[^*]*\*\/\n[^\n]*\n=======\n\([^\n]*\)\n>>>>>>> origin\/main/\1/g' "$file"
        sed -i 's/<<<<<<< HEAD\n[^\n]*\/\/ auto: added missing React import[^\n]*\n=======\n\([^\n]*\)\n>>>>>>> origin\/main/\1/g' "$file"
        
        # For most other conflicts, prefer HEAD but clean up auto comments
        # This is more complex and might need manual review
        
        echo "✅ Resolved basic conflicts in $file"
    fi
}

# List of conflicted files
files=(
    "src/components/ui/badge.tsx"
    "src/components/ui/button.tsx" 
    "src/components/ui/toggle.tsx"
    "src/stories/ui/Button.stories.tsx"
)

# Resolve conflicts in UI components first (they're simpler)
for file in "${files[@]}"; do
    resolve_file_conflicts "$file"
done

echo "🎯 Basic conflict resolution complete. Manual review needed for complex conflicts."