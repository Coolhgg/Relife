#!/bin/bash

# Prettier Setup and Formatting Script
# This script sets up and runs Prettier formatting across the entire codebase

echo "🎨 Setting up Prettier for consistent code formatting..."

# Update package.json scripts to use npx
echo "📝 Updating package.json scripts..."
npm pkg set scripts.format:check="npx --yes prettier@latest --check \"src/**/*.{ts,tsx,js,jsx,css,md,json}\" --ignore-path .prettierignore"
npm pkg set scripts.format:write="npx --yes prettier@latest --write \"src/**/*.{ts,tsx,js,jsx,css,md,json}\" --ignore-path .prettierignore"
npm pkg set scripts.lint:prettier="npm run format:check"
npm pkg set scripts.lint="eslint . && npm run format:check"
npm pkg set scripts.lint:fix="eslint . --fix && npm run format:write"

echo "🔍 Running Prettier formatting in batches..."

# Format TypeScript files
echo "  -> Formatting TypeScript files..."
npx --yes prettier@latest --write "src/**/*.{ts,tsx}" --ignore-path .prettierignore --silent

# Format JavaScript files  
echo "  -> Formatting JavaScript files..."
npx --yes prettier@latest --write "src/**/*.{js,jsx}" --ignore-path .prettierignore --silent

# Format CSS files
echo "  -> Formatting CSS files..."
npx --yes prettier@latest --write "src/**/*.css" --ignore-path .prettierignore --silent

# Format JSON files
echo "  -> Formatting JSON files..."
npx --yes prettier@latest --write "src/**/*.json" --ignore-path .prettierignore --silent

# Format Markdown files
echo "  -> Formatting Markdown files..."
npx --yes prettier@latest --write "src/**/*.md" --ignore-path .prettierignore --silent

echo "✅ Prettier setup and formatting completed!"

# Final check
echo "🔍 Running final formatting check..."
npx --yes prettier@latest --check "src/**/*.{ts,tsx,js,jsx,css,md,json}" --ignore-path .prettierignore | head -10