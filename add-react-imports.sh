#!/bin/bash

# Script to add React imports to .tsx files that don't have them
# This script adds "import React from 'react';" as the first line for files that use JSX

echo "Adding React imports to .tsx files..."

# Counter for tracking changes
changed_files=0

# Find all .tsx files in src/ directory (excluding test files for now)
find src/ -name "*.tsx" -type f ! -path "*/test*" ! -path "*/__tests__/*" ! -path "*/stories/*" | while read file; do
  # Check if file already has "import React" or "import * as React"
  if ! grep -q "^import \(React\|\* as React\)" "$file"; then
    # Check if file uses JSX (has < followed by uppercase letter, indicating JSX elements)
    if grep -q "<[A-Z]" "$file" || grep -q "<div\|<span\|<button\|<input\|<form\|<h1\|<h2\|<h3\|<p\|<section" "$file"; then
      echo "Adding React import to: $file"
      # Create a temporary file with React import added as first line
      (echo "import React from 'react';" && cat "$file") > "$file.tmp" && mv "$file.tmp" "$file"
      changed_files=$((changed_files + 1))
    fi
  else
    echo "Skipping $file - already has React import"
  fi
done

echo "Process completed. Added React imports to $changed_files files."