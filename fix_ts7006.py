#!/usr/bin/env python3
"""
Script to fix TypeScript TS7006 implicit any parameter errors.
"""

import re
import sys
from pathlib import Path

def fix_ts7006_errors(file_path, errors_list):
    """Fix TS7006 errors in a given file."""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Track changes made
        changes_made = 0
        
        # Sort errors by line number in reverse order to avoid line number shifts
        errors_for_file = []
        for error_line in errors_list:
            if file_path.name in error_line:
                match = re.search(r'\((\d+),\d+\): error TS7006: Parameter \'([^\']+)\' implicitly has an \'any\' type', error_line)
                if match:
                    line_num = int(match.group(1))
                    param_name = match.group(2)
                    errors_for_file.append((line_num, param_name))
        
        # Sort by line number descending
        errors_for_file.sort(reverse=True)
        
        lines = content.split('\n')
        
        for line_num, param_name in errors_for_file:
            if line_num <= len(lines):
                line_idx = line_num - 1  # Convert to 0-based index
                line = lines[line_idx]
                
                # Common patterns to fix
                patterns = [
                    # State updater pattern: setX(prev => 
                    (rf'\b(\w+)\(({param_name}) =>', rf'\1((\2: any) => // auto: implicit any'),
                    # Filter/map pattern: .filter(item => 
                    (rf'\.filter\(({param_name}) =>', rf'.filter((\1: any) => // auto: implicit any'),
                    (rf'\.map\(({param_name}) =>', rf'.map((\1: any) => // auto: implicit any'),
                    # Event handler pattern: onChange={(e) =>
                    (rf'(\w+)=\{{({param_name}) =>', rf'\1={{(\2: any) => // auto: implicit any'),
                    # Generic callback pattern
                    (rf'\(({param_name}) =>', rf'((\1: any) => // auto: implicit any'),
                ]
                
                original_line = line
                for pattern, replacement in patterns:
                    new_line = re.sub(pattern, replacement, line)
                    if new_line != line:
                        lines[line_idx] = new_line
                        changes_made += 1
                        print(f"Fixed line {line_num}: {param_name}")
                        break
                
        if changes_made > 0:
            # Write the modified content back
            with open(file_path, 'w') as f:
                f.write('\n'.join(lines))
            print(f"Applied {changes_made} fixes to {file_path}")
        
        return changes_made
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0

def main():
    # Read the TypeScript errors
    errors_file = Path('ci/step-outputs/tsc_before_2b.txt')
    if not errors_file.exists():
        print(f"Error file {errors_file} not found")
        sys.exit(1)
    
    with open(errors_file, 'r') as f:
        all_errors = f.readlines()
    
    # Extract only TS7006 errors
    ts7006_errors = [line.strip() for line in all_errors if 'TS7006' in line]
    
    print(f"Found {len(ts7006_errors)} TS7006 errors to fix")
    
    # Group errors by file
    files_to_process = set()
    for error_line in ts7006_errors:
        match = re.search(r'^([^(]+)', error_line)
        if match:
            file_path = Path(match.group(1))
            if file_path.exists():
                files_to_process.add(file_path)
    
    print(f"Processing {len(files_to_process)} files")
    
    total_fixes = 0
    for file_path in sorted(files_to_process):
        fixes = fix_ts7006_errors(file_path, ts7006_errors)
        total_fixes += fixes
    
    print(f"Applied {total_fixes} total fixes across all files")

if __name__ == '__main__':
    main()