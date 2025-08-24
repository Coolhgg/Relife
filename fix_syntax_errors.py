#!/usr/bin/env python3

import os
import re
import glob

def fix_syntax_errors(file_path):
    """Fix common syntax errors in TypeScript/JavaScript files"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Fix "=> a // auto: implicit any.prop" patterns
    content = re.sub(
        r'=> a // auto: implicit any\.(\w+)', 
        r'=> a.\1', 
        content
    )
    
    # Pattern 2: Fix "=> a // auto: implicit anyprop" patterns (missing dot)
    content = re.sub(
        r'=> a // auto: implicit any(\w+)', 
        r'=> a.\1', 
        content
    )
    
    # Pattern 3: Fix "prev.filter((alarm: any) => a // auto: implicit anylarm.prop" patterns
    content = re.sub(
        r'=> a // auto: implicit any(\w+)\.(\w+)', 
        r'=> \1.\2', 
        content
    )
    
    # Pattern 4: Fix "setVar((prev: any) => p // auto: implicit anyrev" patterns
    content = re.sub(
        r'=> p // auto: implicit anyrev', 
        r'=> prev', 
        content
    )
    
    # Pattern 5: Fix any remaining malformed arrow functions with broken variables
    content = re.sub(
        r'\(\((\w+): any\) => \w // auto: implicit any\w*(\1)\.(\w+)\)', 
        r'((\1: any) => \1.\3)', 
        content
    )
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # Find all TypeScript and JavaScript files
    patterns = [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx'
    ]
    
    files_fixed = 0
    
    for pattern in patterns:
        for file_path in glob.glob(pattern, recursive=True):
            if os.path.isfile(file_path):
                if fix_syntax_errors(file_path):
                    print(f"Fixed: {file_path}")
                    files_fixed += 1
    
    print(f"\nFixed syntax errors in {files_fixed} files.")

if __name__ == "__main__":
    main()