#!/bin/bash

echo "Fixing no-undef issues in source files only..."

# Fix only src/ files, not node_modules
# Fix HeadersInit type in our source files
find src relife-campaign-dashboard server scripts -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -l "HeadersInit" 2>/dev/null | while read file; do
    if ! grep -q "/// <reference lib=\"dom\"" "$file" 2>/dev/null; then
        sed -i '1i/// <reference lib="dom" />' "$file"
        echo "Added DOM reference to: $(basename "$file")"
    fi
done

# Fix EventListener type in our source files  
find src relife-campaign-dashboard server scripts -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -l "EventListener" 2>/dev/null | while read file; do
    if ! grep -q "/// <reference lib=\"dom\"" "$file" 2>/dev/null; then
        sed -i '1i/// <reference lib="dom" />' "$file"
        echo "Added DOM reference for EventListener to: $(basename "$file")"
    fi
done

# Fix Deno global in our files
find . -name "main.ts" 2>/dev/null | grep -v node_modules | while read file; do
    if grep -q "Deno\." "$file" && ! grep -q "@ts-expect-error.*Deno" "$file"; then
        sed -i 's/Deno\.serve/@ts-expect-error\nDeno.serve/' "$file"
        echo "Added Deno suppression to: $(basename "$file")"
    fi
done

echo "Completed targeted no-undef fixes"
