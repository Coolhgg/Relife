#!/usr/bin/env python3
"""
Script to fix malformed auto comments that break TypeScript syntax.
"""

import os
import re
from pathlib import Path

def fix_malformed_comments(file_path):
    """Fix malformed auto comments in a TypeScript/TSX file."""
    print(f"Processing {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Fix "=> // auto: implicit any (" to "=> ({ // auto: implicit any"
    content = re.sub(
        r'=> // auto: implicit any \(',
        r'=> ({ // auto: implicit any',
        content
    )
    
    # Pattern 2: Fix "=> // auto: implicit any ([^(])" to "=> $1 // auto: implicit any"
    content = re.sub(
        r'=> // auto: implicit any ([^(])',
        r'=> \1 // auto: implicit any',
        content
    )
    
    # Pattern 3: Fix "=> // auto: implicit any ({" to "=> ({ // auto: implicit any"
    content = re.sub(
        r'=> // auto: implicit any \(\{',
        r'=> ({ // auto: implicit any',
        content
    )
    
    # Pattern 4: Fix standalone "// auto: implicit any" at start of expression
    content = re.sub(
        r'\) => // auto: implicit any ([a-zA-Z_])',
        r') => \1 // auto: implicit any',
        content
    )
    
    # Pattern 5: Fix filter callbacks
    content = re.sub(
        r'\(([\w:]+)\) => // auto: implicit any ([a-zA-Z_])',
        r'(\1) => \2 // auto: implicit any',
        content
    )
    
    if content != original_content:
        print(f"  - Fixed malformed comments in {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    """Main function to process all TypeScript files."""
    src_dir = Path("src")
    
    if not src_dir.exists():
        print("Error: src directory not found")
        return
    
    # Find all .ts and .tsx files
    ts_files = list(src_dir.glob("**/*.ts")) + list(src_dir.glob("**/*.tsx"))
    
    fixed_count = 0
    for file_path in ts_files:
        if fix_malformed_comments(file_path):
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == "__main__":
    main()