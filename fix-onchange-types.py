#!/usr/bin/env python3
"""
Fix onChange event handler types from any to proper React types
"""
import os
import re
import glob

def fix_onchange_types():
    """Fix onChange handlers in all tsx files"""
    tsx_files = glob.glob('src/**/*.tsx', recursive=True)
    fixed_count = 0
    total_fixes = 0
    
    for filepath in tsx_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Pattern 1: onChange={(e: any\n) => ...} - for input elements
            pattern1 = re.compile(r'onChange=\{\(e: any\n\) => ([^}]+)\}')
            matches = pattern1.findall(content)
            if matches:
                content = pattern1.sub(r'onChange={(e: React.ChangeEvent<HTMLInputElement>) => \1}', content)
            
            # Pattern 2: onChange={(e: any) => ...} - already on one line
            pattern2 = re.compile(r'onChange=\{\(e: any\) => ([^}]+)\}')  
            matches2 = pattern2.findall(content)
            if matches2:
                content = pattern2.sub(r'onChange={(e: React.ChangeEvent<HTMLInputElement>) => \1}', content)
            
            # Pattern 3: Check for textarea elements and fix those
            if '<textarea' in content.lower() or '<Textarea' in content:
                content = re.sub(
                    r'onChange=\{\(e: React\.ChangeEvent<HTMLInputElement>\)',
                    r'onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)',
                    content
                )
            
            # Pattern 4: Check for select elements and fix those  
            if '<select' in content.lower() or '<Select' in content:
                # Find onChange handlers that are likely for selects
                select_pattern = re.compile(r'<Select[^>]*>\s*.*?onChange=\{\(e: React\.ChangeEvent<HTMLInputElement>\)', re.DOTALL)
                if select_pattern.search(content):
                    content = re.sub(
                        r'(<Select[^>]*>.*?)onChange=\{\(e: React\.ChangeEvent<HTMLInputElement>\)',
                        r'\1onChange={(e: React.ChangeEvent<HTMLSelectElement>)',
                        content,
                        flags=re.DOTALL
                    )
            
            changes_made = len(matches) + len(matches2)
            total_fixes += changes_made
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed {changes_made} onChange handlers in {filepath}")
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    print(f"\nFixed onChange handlers in {fixed_count} files")
    print(f"Total onChange handlers fixed: {total_fixes}")

if __name__ == "__main__":
    fix_onchange_types()