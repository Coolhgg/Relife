#!/usr/bin/env python3
"""
Script to apply TimeoutHandle type fixes to files with timeout type conflicts
"""

import re
import os
import sys

def get_timeout_error_files():
    """Get list of files with timeout type errors from the tsc output"""
    timeout_files = []
    
    try:
        with open('ci/step-outputs/tsc_before.txt', 'r') as f:
            content = f.read()
            
        # Find lines with Timeout type errors
        timeout_pattern = r"src/([^(]+)\(\d+,\d+\): error TS\d+.*Type 'Timeout' is not assignable"
        matches = re.findall(timeout_pattern, content)
        
        # Get unique files
        unique_files = list(set(matches))
        return unique_files
    except FileNotFoundError:
        print("tsc_before.txt not found")
        return []

def analyze_file_for_timeouts(filepath):
    """Analyze a file to find timeout-related variable declarations and usages"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        issues = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            line_num = i + 1
            
            # Find declarations with number | null pattern that use setTimeout/setInterval
            if re.search(r':\s*(number\s*\|\s*null|NodeJS\.Timeout)', line):
                if any(keyword in line for keyword in ['timer', 'interval', 'timeout', 'Timer', 'Interval']):
                    issues.append({
                        'type': 'declaration',
                        'line': line_num,
                        'content': line.strip(),
                        'pattern': 'number | null'
                    })
            
            # Find setTimeout/setInterval assignments
            if re.search(r'(setTimeout|setInterval)\s*\(', line):
                issues.append({
                    'type': 'assignment',
                    'line': line_num,
                    'content': line.strip()
                })
        
        return issues
    except Exception as e:
        print(f"Error analyzing {filepath}: {e}")
        return []

def has_timeout_import(filepath):
    """Check if file already imports TimeoutHandle"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        return 'TimeoutHandle' in content
    except:
        return False

def main():
    print("Analyzing timeout type issues...")
    
    # Get files with timeout errors
    error_files = get_timeout_error_files()
    print(f"Found {len(error_files)} files with timeout errors")
    
    # Analyze each file
    for file_path in error_files[:10]:  # Process first 10 files
        full_path = f"src/{file_path}"
        if os.path.exists(full_path):
            print(f"\n=== {file_path} ===")
            
            # Check if already has import
            if has_timeout_import(full_path):
                print("  ✓ Already has TimeoutHandle import")
                continue
                
            issues = analyze_file_for_timeouts(full_path)
            
            if issues:
                print(f"  Found {len(issues)} issues:")
                for issue in issues:
                    print(f"    Line {issue['line']}: {issue['content']}")
            else:
                print("  No timeout patterns found")

if __name__ == "__main__":
    main()