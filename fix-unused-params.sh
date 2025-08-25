#!/bin/bash

# Script to fix unused parameters in test files according to ESLint rules
# Only fixes parameters that should be prefixed with underscore

cd /project/workspace/Coolhgg/Relife

# List of test files that need fixing based on our analysis
test_files=(
  "src/__tests__/factories/premium-factories.ts"
  "src/__tests__/integration/e2e-testing-utilities.ts"
  "src/__tests__/mocks/audio-mock.ts"
)

for file in "${test_files[@]}"; do
  echo "Processing $file..."
  if [ -f "$file" ]; then
    # Run ESLint to get specific line numbers and parameters
    npx eslint "$file" | grep "unused args must match" | while read -r line; do
      echo "  Found: $line"
    done
  else
    echo "  File not found: $file"
  fi
done