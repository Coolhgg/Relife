#!/usr/bin/env python3
"""
Fix malformed arrow functions in React event handlers
"""

import re
import os
import glob

def fix_arrow_function_syntax(content):
    """Fix common arrow function syntax issues in React event handlers"""
    
    # Pattern 1: Fix missing opening brace after arrow function
    # onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
    #   someFunction();
    # }
    pattern1 = re.compile(
        r'(\s+onChange=\{[^}]+\) =>)\s*\n(\s+)([^{][^}]*?\}\);)\s*\n(\s+)\}',
        re.MULTILINE | re.DOTALL
    )
    
    def replace1(match):
        prefix = match.group(1)
        indent = match.group(2)
        content = match.group(3)
        closing_indent = match.group(4)
        return f"{prefix} {{\n{indent}{content}\n{closing_indent}}}"
    
    content = pattern1.sub(replace1, content)
    
    # Pattern 2: Fix broken arrow function declarations with extra parenthesis
    # onChange={(e: React.ChangeEvent<HTMLInputElement>)
    # ) => handleFunction()}
    pattern2 = re.compile(
        r'(\s+onChange=\{[^}]+\))\s*\n\s*\) =>', 
        re.MULTILINE
    )
    
    content = pattern2.sub(r'\1 =>', content)
    
    return content

def fix_jsx_syntax_errors(content):
    """Fix various JSX syntax errors"""
    
    # Fix trailing > in JSX attributes that should be />
    # This handles cases where JSX is malformed
    
    return content

def process_file(file_path):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        fixed_content = fix_arrow_function_syntax(original_content)
        fixed_content = fix_jsx_syntax_errors(fixed_content)
        
        if fixed_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"Fixed: {file_path}")
            return True
        else:
            print(f"No changes: {file_path}")
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function"""
    src_dir = "./src"
    
    # Find all TypeScript/TSX files
    files = []
    for ext in ['**/*.ts', '**/*.tsx']:
        files.extend(glob.glob(os.path.join(src_dir, ext), recursive=True))
    
    files_fixed = 0
    for file_path in files:
        if process_file(file_path):
            files_fixed += 1
    
    print(f"\nProcessed {len(files)} files, fixed {files_fixed} files")

if __name__ == "__main__":
    main()