#!/bin/bash

# Fix remaining syntax issues that are blocking prettier
cd /project/workspace/Coolhgg/Relife

echo "Fixing remaining syntax patterns..."

# Fix malformed object literal patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/({ \/\* auto: implicit any \*\/{ /({ /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/({ \/\* auto: implicit any \*\/{/({ /g'

# Fix broken property access patterns  
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i -E 's/([a-zA-Z_$][a-zA-Z0-9_$]*) \/\/ auto: implicit any\.([a-zA-Z_$][a-zA-Z0-9_$]*)/\1.\2/g'

# Fix broken function/method calls
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i -E 's/([a-zA-Z_$]) \/\/ auto: implicit any([a-zA-Z_$][a-zA-Z0-9_$]*)/\1\2/g'

# Fix arrow function returns with broken object syntax
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/=> { \/\* auto: implicit any \*\/{ /=> ({ /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/=> { \/\* auto: implicit any \*\/{/=> ({ /g'

# Fix method chaining issues
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\. \/\* auto: implicit any \*\//./g'

# Fix array/object access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\] \/\* auto: implicit any \*\//]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/} \/\* auto: implicit any \*\//}/g'

# Fix comparison operators
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any !== / !== /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any === / === /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any > / > /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any < / < /g'

# Fix logical operators
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any && / && /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ \/\/ auto: implicit any || / || /g'

echo "Done fixing syntax patterns."