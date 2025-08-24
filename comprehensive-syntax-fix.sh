#!/bin/bash

# Comprehensive fix for remaining syntax patterns
cd /project/workspace/Coolhgg/Relife

echo "Applying comprehensive syntax fixes..."

# Fix malformed object literals - ({{ should be ({
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/=> ({{/=> ({/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/=> ({{{/=> ({/g'

# Fix broken array map operations - &.map should be .map
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/&\.map/.map/g'

# Fix incomplete array spread operations - [ // auto: implicit any...prev should be [...prev
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[ \/\/ auto: implicit any\.\.\./[.../g'

# Fix broken function calls with missing parentheses
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/({prev + 1)/((prev + 1)/g'

# Fix property access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any\./ /g'

# Fix logical operators and comparison broken by comments
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any!/ !/g'

# Fix array method chaining
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\/\* auto: implicit any \*\///g'

# Fix broken arrow function returns 
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/) =>/\n) =>/g'

# Fix function calls with missing closing parentheses after auto comments
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\)\)/\)/g'

# Fix semicolon placement issues
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/));}/);/g'

# Remove dangling auto comments that break syntax
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^[ ]*\/\* auto: implicit any \*\/$/d'

# Fix specific patterns that are causing issues
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/anytheme/any theme/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/anyopen/any open/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/anypen/any pen/g'

echo "Comprehensive syntax fixes complete."