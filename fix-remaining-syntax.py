#!/usr/bin/env python3
"""
Fix remaining specific syntax errors
"""
import os
import re

def fix_jsx_brace_issues(filepath):
    """Fix JSX brace and tag issues in a specific file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix malformed JSX attributes and closing issues
        # Pattern: Fix broken template literals in JSX
        content = re.sub(
            r'>\{`([^`]*)`\}([^<]*)<',
            r'>{\1}\2<',
            content
        )
        
        # Fix broken JSX closing tags
        content = re.sub(
            r'([^>])\s*\n\s*</(\w+)>',
            r'\1\n</\2>',
            content,
            flags=re.MULTILINE
        )
        
        # Fix unclosed JSX fragments
        content = re.sub(
            r'<>\s*\n([^<]*)\n([^<]*)\n$',
            r'<>\n\1\n\2\n</>',
            content,
            flags=re.MULTILINE | re.DOTALL
        )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed JSX issues in {filepath}")
            return True
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False
    
    return False

def fix_object_literal_issues(filepath):
    """Fix object literal syntax issues"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix missing commas in object literals  
        content = re.sub(
            r'(\w+): ([^,\n}]+)\n\s*(\w+):',
            r'\1: \2,\n  \3:',
            content
        )
        
        # Fix incomplete object destructuring
        content = re.sub(
            r'const \{ ([^}]*)\s*$',
            r'const { \1 }',
            content,
            flags=re.MULTILINE
        )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed object literal issues in {filepath}")
            return True
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False
    
    return False

def main():
    """Main function"""
    problem_files = [
        'src/components/CustomSoundThemeCreator.tsx',
        'src/components/CustomThemeManager.tsx', 
        'src/components/SettingsPage.tsx'
    ]
    
    fixed_count = 0
    for filepath in problem_files:
        if os.path.exists(filepath):
            if fix_jsx_brace_issues(filepath):
                fixed_count += 1
            if fix_object_literal_issues(filepath):
                fixed_count += 1
        else:
            print(f"File not found: {filepath}")
    
    print(f"\nAttempted fixes on {len(problem_files)} problem files")

if __name__ == "__main__":
    main()