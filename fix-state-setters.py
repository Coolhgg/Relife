#!/usr/bin/env python3
"""
Fix state setter types from any to proper types
"""
import re
import glob

def infer_setter_type(setter_name, content_context):
    """Infer the proper type for a state setter based on usage patterns"""
    
    # Common patterns for different types
    if any(word in setter_name.lower() for word in ['progress', 'count', 'index', 'intensity', 'volume', 'speed']):
        return 'number'
    
    if any(word in setter_name.lower() for word in ['loading', 'visible', 'enabled', 'active', 'open', 'expanded']):
        return 'boolean'
    
    if any(word in setter_name.lower() for word in ['text', 'message', 'title', 'description', 'name', 'email']):
        return 'string'
    
    if any(word in setter_name.lower() for word in ['list', 'items', 'data', 'results', 'options']):
        return 'any[]'
    
    if any(word in setter_name.lower() for word in ['settings', 'config', 'state', 'form', 'data']):
        return 'object'
    
    # Check content context for clues
    if 'Math.max' in content_context or 'Math.min' in content_context or '+ 1' in content_context or '- 1' in content_context:
        return 'number'
    
    if 'true' in content_context or 'false' in content_context or '!' in content_context:
        return 'boolean'
    
    if '"' in content_context or "'" in content_context or '.trim()' in content_context:
        return 'string'
    
    if '[' in content_context and ']' in content_context:
        return 'any[]'
    
    # Default to object for complex state
    return 'object'

def fix_state_setters():
    """Fix state setter types in all TypeScript files"""
    tsx_files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)
    fixed_count = 0
    total_fixes = 0
    
    for filepath in tsx_files:
        if '__tests__' in filepath or '.test.' in filepath or '.spec.' in filepath:
            continue  # Skip test files for now
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Pattern: set[Something]((prev: any\n) => ...)
            pattern = re.compile(r'(set\w+)\(\(prev: any\n\) => ([^}]+)\)')
            matches = pattern.findall(content)
            
            for setter_name, setter_body in matches:
                inferred_type = infer_setter_type(setter_name, setter_body)
                
                if inferred_type == 'number':
                    replacement = f'{setter_name}((prev: number) => {setter_body})'
                elif inferred_type == 'boolean':
                    replacement = f'{setter_name}((prev: boolean) => {setter_body})'
                elif inferred_type == 'string':
                    replacement = f'{setter_name}((prev: string) => {setter_body})'
                elif inferred_type == 'any[]':
                    replacement = f'{setter_name}((prev: any[]) => {setter_body})'
                else:  # object
                    replacement = f'{setter_name}((prev: any) => {setter_body})'  # Keep as any for complex objects for now
                
                old_pattern = f'{setter_name}((prev: any\\n) => {re.escape(setter_body)})'
                content = re.sub(old_pattern, replacement, content)
            
            # Pattern: set[Something]((prev: any) => ...) - single line
            pattern2 = re.compile(r'(set\w+)\(\(prev: any\) => ([^}]+)\)')
            matches2 = pattern2.findall(content)
            
            for setter_name, setter_body in matches2:
                inferred_type = infer_setter_type(setter_name, setter_body)
                
                if inferred_type == 'number':
                    replacement = f'{setter_name}((prev: number) => {setter_body})'
                elif inferred_type == 'boolean':
                    replacement = f'{setter_name}((prev: boolean) => {setter_body})'
                elif inferred_type == 'string':
                    replacement = f'{setter_name}((prev: string) => {setter_body})'
                elif inferred_type == 'any[]':
                    replacement = f'{setter_name}((prev: any[]) => {setter_body})'
                else:  # object
                    replacement = f'{setter_name}((prev: any) => {setter_body})'  # Keep as any for complex objects
                
                old_pattern = f'{setter_name}\\(\\(prev: any\\) => {re.escape(setter_body)}\\)'
                content = re.sub(old_pattern, replacement, content)
            
            changes_made = len(matches) + len(matches2)
            total_fixes += changes_made
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed {changes_made} state setters in {filepath}")
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    print(f"\nFixed state setters in {fixed_count} files")
    print(f"Total state setters fixed: {total_fixes}")

if __name__ == "__main__":
    fix_state_setters()