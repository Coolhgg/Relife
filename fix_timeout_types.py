#!/usr/bin/env python3
"""
Fix Timeout type conflicts across the codebase.
Replace `number` with `TimeoutHandle` for setTimeout/setInterval returns.
"""

import os
import re
import glob

def fix_timeout_types_in_file(file_path):
    """Fix timeout type issues in a single file."""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Add TimeoutHandle import if not present and setTimeout/setInterval is used
        has_timeout_usage = re.search(r'setTimeout|setInterval', content)
        has_timeout_import = 'TimeoutHandle' in content
        
        if has_timeout_usage and not has_timeout_import:
            # Find the last import statement
            import_match = list(re.finditer(r"import.*?from ['\"][^'\"]+['\"];", content))
            if import_match:
                last_import = import_match[-1]
                insertion_point = last_import.end()
                content = (content[:insertion_point] + 
                          "\nimport { TimeoutHandle } from '../types/timers';" +
                          content[insertion_point:])
        
        # Fix common timeout type patterns
        fixes = [
            # useRef declarations for timeouts
            (r'useRef<number \| null>', 'useRef<TimeoutHandle | null>'),
            (r'useRef<number \| undefined>', 'useRef<TimeoutHandle | undefined>'),
            (r'useRef<number>', 'useRef<TimeoutHandle>'),
            
            # Map declarations for timeouts  
            (r'Map<([^,]+), number>', r'Map<\1, TimeoutHandle>'),
            
            # Variable declarations
            (r': number \| null = null;', ': TimeoutHandle | null = null;'),
            (r': number \| undefined', ': TimeoutHandle | undefined'),
            
            # Function parameters
            (r'timeout: number', 'timeout: TimeoutHandle'),
            (r'interval: number', 'interval: TimeoutHandle'),
        ]
        
        for pattern, replacement in fixes:
            content = re.sub(pattern, replacement, content)
        
        # Write back if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False
    
    return False

def main():
    """Main function to fix timeout types across the codebase."""
    
    # Find all TypeScript/JavaScript files
    patterns = [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx'
    ]
    
    files_to_process = []
    for pattern in patterns:
        files_to_process.extend(glob.glob(pattern, recursive=True))
    
    # Remove test files and other excluded files
    files_to_process = [f for f in files_to_process if 
                       not any(exclude in f for exclude in [
                           '__tests__', '.test.', '.spec.', 'node_modules'
                       ])]
    
    print(f"Processing {len(files_to_process)} files for timeout type fixes...")
    
    modified_count = 0
    for file_path in files_to_process:
        if fix_timeout_types_in_file(file_path):
            modified_count += 1
            print(f"Modified: {file_path}")
    
    print(f"\nCompleted: {modified_count} files modified")

if __name__ == "__main__":
    main()