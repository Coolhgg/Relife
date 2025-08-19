#!/bin/bash

# Script to fix common parsing errors in JavaScript/TypeScript files
# 1. Fix unescaped apostrophes in strings
# 2. Fix literal newlines in strings

echo "🔧 Fixing parsing errors systematically..."

# Fix unescaped apostrophes in single-quoted strings
echo "Fixing unescaped apostrophes..."
find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" | \
grep -v node_modules | \
xargs grep -l "'" | \
while read file; do
    echo "Processing $file"
    # Fix common contractions in single-quoted strings
    sed -i "s/'\([^']*\)don't\([^']*\)'/'\1don\\'t\2'/g" "$file"
    sed -i "s/'\([^']*\)can't\([^']*\)'/'\1can\\'t\2'/g" "$file"
    sed -i "s/'\([^']*\)won't\([^']*\)'/'\1won\\'t\2'/g" "$file"
    sed -i "s/'\([^']*\)what's\([^']*\)'/'\1what\\'s\2'/g" "$file"
    sed -i "s/'\([^']*\)it's\([^']*\)'/'\1it\\'s\2'/g" "$file"
    sed -i "s/'\([^']*\)you're\([^']*\)'/'\1you\\'re\2'/g" "$file"
    sed -i "s/'\([^']*\)we're\([^']*\)'/'\1we\\'re\2'/g" "$file"
    sed -i "s/'\([^']*\)they're\([^']*\)'/'\1they\\'re\2'/g" "$file"
    sed -i "s/'\([^']*\)I'm\([^']*\)'/'\1I\\'m\2'/g" "$file"
    sed -i "s/'\([^']*\)here's\([^']*\)'/'\1here\\'s\2'/g" "$file"
    sed -i "s/'\([^']*\)there's\([^']*\)'/'\1there\\'s\2'/g" "$file"
    sed -i "s/'\([^']*\)let's\([^']*\)'/'\1let\\'s\2'/g" "$file"
    sed -i "s/'\([^']*\)haven't\([^']*\)'/'\1haven\\'t\2'/g" "$file"
    sed -i "s/'\([^']*\)doesn't\([^']*\)'/'\1doesn\\'t\2'/g" "$file"
done

# Fix literal newlines in console.log and other string contexts
echo "Fixing literal newlines in strings..."
find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" | \
grep -v node_modules | \
while read file; do
    echo "Processing $file for newlines"
    # Fix literal newlines in console.log statements
    sed -i ':a;N;$!ba;s/console\.log(\(['"'"'"`]\)[^'"'"'"`]*\n/console.log(\1/g' "$file"
    sed -i "s/'\([^']*\)\n\([^']*\)'/'\1\\\\n\2'/g" "$file"
    sed -i 's/"\([^"]*\)\n\([^"]*\)"/"\1\\n\2"/g' "$file"
    sed -i 's/`\([^`]*\)\n\([^`]*\)`/`\1\\n\2`/g' "$file"
done

echo "✅ Completed systematic parsing error fixes"