#!/usr/bin/env python3
"""
Fix untyped React event handlers in TypeScript React components
"""

import re
import os
import glob

def fix_event_handler_typing(content):
    """Fix untyped React event handlers with proper TypeScript types"""
    
    patterns_replacements = [
        # onChange handlers for input elements
        (
            r'onChange=\{?\(e: any\)\s*=>',
            r'onChange={(e: React.ChangeEvent<HTMLInputElement>) =>'
        ),
        
        # onChange handlers for textarea elements (look for context clues)
        (
            r'onChange=\{?\(e: any\)\s*=>\s*[^}]*textarea[^}]*\}?',
            lambda m: m.group(0).replace('(e: any)', '(e: React.ChangeEvent<HTMLTextAreaElement>)')
        ),
        
        # onChange handlers for select elements
        (
            r'onChange=\{?\(e: any\)\s*=>\s*[^}]*\.value[^}]*target\.value[^}]*\}?',
            lambda m: m.group(0).replace('(e: any)', '(e: React.ChangeEvent<HTMLSelectElement>)')
        ),
        
        # onClick handlers for button elements  
        (
            r'onClick=\{?\(e: any\)\s*=>',
            r'onClick={(e: React.MouseEvent<HTMLButtonElement>) =>'
        ),
        
        # onSubmit handlers for form elements
        (
            r'onSubmit=\{?\(e: any\)\s*=>',
            r'onSubmit={(e: React.FormEvent<HTMLFormElement>) =>'
        ),
        
        # onKeyDown handlers
        (
            r'onKeyDown=\{?\(e: any\)\s*=>',
            r'onKeyDown={(e: React.KeyboardEvent) =>'
        ),
        
        # onFocus handlers
        (
            r'onFocus=\{?\(e: any\)\s*=>',
            r'onFocus={(e: React.FocusEvent<HTMLInputElement>) =>'
        ),
        
        # onBlur handlers
        (
            r'onBlur=\{?\(e: any\)\s*=>',
            r'onBlur={(e: React.FocusEvent<HTMLInputElement>) =>'
        ),
        
        # Generic event handlers that might be missed
        (
            r'on[A-Z][a-zA-Z]*=\{?\(e: any\)\s*=>',
            lambda m: m.group(0).replace('(e: any)', '(e: React.SyntheticEvent)')
        )
    ]
    
    modified = False
    for pattern, replacement in patterns_replacements:
        if callable(replacement):
            # For lambda replacements
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
            for match in reversed(list(matches)):  # Reverse to avoid offset issues
                new_content = replacement(match)
                if new_content != match.group(0):
                    content = content[:match.start()] + new_content + content[match.end():]
                    modified = True
        else:
            # For string replacements
            old_content = content
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
            if content != old_content:
                modified = True
    
    return content, modified

def infer_element_type_from_context(content, match_obj):
    """Try to infer the correct HTML element type from surrounding context"""
    
    start = max(0, match_obj.start() - 200)  # Look 200 chars before
    end = min(len(content), match_obj.end() + 200)  # Look 200 chars after
    context = content[start:end]
    
    # Check for element types
    if '<input' in context or 'type="text"' in context or 'type="email"' in context:
        return 'HTMLInputElement'
    elif '<textarea' in context:
        return 'HTMLTextAreaElement'
    elif '<select' in context:
        return 'HTMLSelectElement'  
    elif '<button' in context:
        return 'HTMLButtonElement'
    elif '<form' in context:
        return 'HTMLFormElement'
    else:
        return 'HTMLElement'  # Generic fallback

def fix_context_aware_handlers(content):
    """Fix handlers by looking at surrounding context to determine element type"""
    
    # Find all untyped event handlers
    pattern = r'(on[A-Z][a-zA-Z]*=\{?\(e:\s*any\)\s*=>)'
    
    def replacement_func(match):
        handler_name = match.group(0).split('=')[0]  # Extract handler name like 'onChange'
        element_type = infer_element_type_from_context(content, match)
        
        # Map handler types to React event types
        event_type_map = {
            'onChange': f'React.ChangeEvent<{element_type}>',
            'onClick': f'React.MouseEvent<{element_type}>',
            'onSubmit': f'React.FormEvent<{element_type}>',
            'onKeyDown': f'React.KeyboardEvent<{element_type}>',
            'onKeyUp': f'React.KeyboardEvent<{element_type}>',
            'onFocus': f'React.FocusEvent<{element_type}>',
            'onBlur': f'React.FocusEvent<{element_type}>',
        }
        
        event_type = event_type_map.get(handler_name, f'React.SyntheticEvent<{element_type}>')
        
        return match.group(0).replace('(e: any)', f'(e: {event_type})')
    
    return re.sub(pattern, replacement_func, content)

def ensure_react_import(content):
    """Ensure React is imported for React event types"""
    
    # Check if React is already imported
    if 'import React' in content:
        return content, False
    
    # Look for other imports to place React import appropriately
    import_pattern = r'^import\s+.*from\s+[\'"][^\'"]+[\'"];?\s*$'
    imports = re.findall(import_pattern, content, re.MULTILINE)
    
    if imports:
        # Add after existing imports
        first_import_line = content.find(imports[0])
        insert_point = content.find('\n', first_import_line) + 1
        new_import = "import React from 'react';\n"
        content = content[:insert_point] + new_import + content[insert_point:]
        return content, True
    else:
        # Add at the beginning
        content = "import React from 'react';\n" + content
        return content, True

def process_file(file_path):
    """Process a single TypeScript React file"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Skip if no event handlers found
        if not re.search(r'on[A-Z][a-zA-Z]*=.*\(e:\s*any\)', original_content):
            return False, []
        
        content = original_content
        changes = []
        
        # Fix event handler typing
        content, modified = fix_event_handler_typing(content)
        if modified:
            changes.append("Fixed event handler typing")
        
        # Context-aware fixing for remaining handlers
        context_fixed = fix_context_aware_handlers(content)
        if context_fixed != content:
            content = context_fixed
            changes.append("Applied context-aware handler fixes")
        
        # Ensure React import if we made changes
        if changes:
            content, import_added = ensure_react_import(content)
            if import_added:
                changes.append("Added React import")
        
        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return True, changes
        
        return False, []
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, []

def main():
    """Main function"""
    
    # Find all TypeScript React files
    component_files = glob.glob("./src/components/**/*.tsx", recursive=True)
    hook_files = glob.glob("./src/hooks/**/*.tsx", recursive=True)  
    context_files = glob.glob("./src/contexts/**/*.tsx", recursive=True)
    
    all_files = component_files + hook_files + context_files
    
    files_fixed = 0
    total_changes = []
    
    print(f"Processing {len(all_files)} React component files...")
    
    for file_path in all_files:
        was_fixed, changes = process_file(file_path)
        if was_fixed:
            files_fixed += 1
            print(f"Fixed: {file_path}")
            print(f"  Changes: {', '.join(changes)}")
            total_changes.extend(changes)
        
    print(f"\nSummary:")
    print(f"  Files processed: {len(all_files)}")
    print(f"  Files fixed: {files_fixed}")
    print(f"  Total changes made: {len(total_changes)}")
    
    if total_changes:
        change_counts = {}
        for change in total_changes:
            change_counts[change] = change_counts.get(change, 0) + 1
        
        print("\n  Change breakdown:")
        for change, count in change_counts.items():
            print(f"    {change}: {count}")

if __name__ == "__main__":
    main()