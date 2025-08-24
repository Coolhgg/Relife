#!/bin/bash

# Comprehensive Syntax Check for Manual Sweep Task C

echo "=== COMPREHENSIVE SYNTAX CHECK ==="
echo "Checking for various problematic patterns..."
echo ""

issues_found=0

# Check 1: Auto comments
echo "1. Checking for auto-comments..."
auto_comments=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "// auto" 2>/dev/null || true)
if [ -n "$auto_comments" ]; then
    echo "❌ Found auto-comments:"
    echo "$auto_comments"
    ((issues_found++))
else
    echo "✅ No auto-comments found"
fi
echo ""

# Check 2: Incomplete arrow functions
echo "2. Checking for incomplete arrow functions..."
incomplete_arrows=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "=>\s*$" 2>/dev/null || true)
if [ -n "$incomplete_arrows" ]; then
    echo "❌ Found incomplete arrow functions:"
    echo "$incomplete_arrows"
    ((issues_found++))
else
    echo "✅ No incomplete arrow functions found"
fi
echo ""

# Check 3: Arrow functions followed by comments
echo "3. Checking for arrow functions followed by comments..."
arrow_comments=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "=>\s*//" 2>/dev/null || true)
if [ -n "$arrow_comments" ]; then
    echo "❌ Found arrow functions followed by comments:"
    echo "$arrow_comments"
    ((issues_found++))
else
    echo "✅ No arrow functions followed by comments found"
fi
echo ""

# Check 4: Mid-expression comments (general pattern)
echo "4. Checking for mid-expression comments..."
mid_comments=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "}\s*//" 2>/dev/null || true)
if [ -n "$mid_comments" ]; then
    echo "❌ Found potential mid-expression comments:"
    echo "$mid_comments"
    ((issues_found++))
else
    echo "✅ No obvious mid-expression comments found"
fi
echo ""

# Check 5: TODO comments in functions
echo "5. Checking for TODO comments in incomplete functions..."
todo_functions=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -B2 -A2 "TODO.*implement" 2>/dev/null || true)
if [ -n "$todo_functions" ]; then
    echo "❌ Found TODO implement comments:"
    echo "$todo_functions"
    ((issues_found++))
else
    echo "✅ No TODO implement comments found"
fi
echo ""

# Check 6: Malformed callbacks patterns
echo "6. Checking for specific malformed callback patterns..."
malformed_callbacks=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "(\s*\w+:\s*any\s*)\s*=>\s*//" 2>/dev/null || true)
if [ -n "$malformed_callbacks" ]; then
    echo "❌ Found malformed callback patterns:"
    echo "$malformed_callbacks"
    ((issues_found++))
else
    echo "✅ No malformed callback patterns found"
fi
echo ""

# Check 7: Incomplete function bodies
echo "7. Checking for incomplete function bodies..."
incomplete_bodies=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -B1 -A1 "{\s*$" 2>/dev/null | grep -v "interface\|type\|export\|import\|class" | head -20 || true)
if [ -n "$incomplete_bodies" ]; then
    echo "⚠️ Found potential incomplete function bodies (sample):"
    echo "$incomplete_bodies"
else
    echo "✅ No obvious incomplete function bodies found"
fi
echo ""

echo "=== SUMMARY ==="
echo "Issues found: $issues_found"
if [ $issues_found -eq 0 ]; then
    echo "✅ No syntax issues found - likely already cleaned up in previous sweeps"
else
    echo "❌ Found $issues_found categories of issues that need fixing"
fi