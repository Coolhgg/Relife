#!/bin/bash

echo "Fixing no-undef issues..."

# Fix missing global type declarations
echo "Adding global type declarations..."

# Add HeadersInit type - this is from DOM lib
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "HeadersInit" | while read file; do
    if ! grep -q "/// <reference lib=\"dom\"" "$file"; then
        sed -i '1i/// <reference lib="dom" />' "$file"
        echo "Added DOM reference to: $(basename "$file")"
    fi
done

# Fix Deno global
find . -name "*.ts" | xargs grep -l "Deno\." | while read file; do
    if ! grep -q "declare global" "$file"; then
        sed -i '1i// @ts-expect-error - Deno global for deployment' "$file"
        echo "Added Deno suppression to: $(basename "$file")"
    fi
done

# Fix EventListener type
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "EventListener" | while read file; do
    if ! grep -q "/// <reference lib=\"dom\"" "$file"; then
        sed -i '1i/// <reference lib="dom" />' "$file"
        echo "Added DOM reference for EventListener to: $(basename "$file")"
    fi
done

# Fix test files - add test imports
find . -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
    if ! grep -q "import.*expect.*from" "$file" && grep -q "expect(" "$file"; then
        sed -i '1iimport { expect, test, jest } from "@jest/globals";' "$file"
        echo "Added test imports to: $(basename "$file")"
    fi
done

# Fix NodeJS type references
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "NodeJS\." | while read file; do
    if ! grep -q "@types/node" "$file" && ! grep -q "/// <reference types=\"node\"" "$file"; then
        sed -i '1i/// <reference types="node" />' "$file"
        echo "Added Node types reference to: $(basename "$file")"
    fi
done

echo "Completed no-undef fixes"
