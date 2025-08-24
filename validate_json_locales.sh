#!/bin/bash

# JSON Locale Validation Script for Manual Sweep Task C

echo "=== JSON LOCALE VALIDATION ==="
echo "Scanning all JSON files under public/locales/"
echo ""

failed_files=()
total_files=0
failed_count=0

# Find all JSON files in public/locales
while IFS= read -r -d '' file; do
    total_files=$((total_files + 1))
    echo "Validating: $file"
    
    # Use jq to validate JSON syntax
    if ! jq . "$file" > /dev/null 2>&1; then
        echo "❌ INVALID JSON: $file"
        failed_files+=("$file")
        failed_count=$((failed_count + 1))
        
        # Show the specific error
        echo "Error details:"
        jq . "$file" 2>&1 | head -3
        echo ""
    else
        echo "✅ Valid JSON: $file"
    fi
done < <(find public/locales -name "*.json" -print0)

echo ""
echo "=== VALIDATION SUMMARY ==="
echo "Total files checked: $total_files"
echo "Valid files: $((total_files - failed_count))"
echo "Invalid files: $failed_count"

if [ ${#failed_files[@]} -gt 0 ]; then
    echo ""
    echo "❌ FAILED FILES:"
    for file in "${failed_files[@]}"; do
        echo "  - $file"
    done
else
    echo ""
    echo "✅ All JSON files are valid!"
fi

echo ""
echo "=== DETAILED ERROR ANALYSIS ==="
# Show detailed errors for each failed file
for file in "${failed_files[@]}"; do
    echo ""
    echo ">>> Analyzing: $file"
    echo "Error output:"
    jq . "$file" 2>&1
    echo ""
    echo "First 10 lines of file for context:"
    head -10 "$file"
    echo "... (end of preview)"
    echo "---"
done