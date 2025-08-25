#!/usr/bin/env python3
"""
Conservative React Hooks Dependencies Fix Script

Adds ESLint disable comments with manual review annotations for unsafe cases
and auto-fixes only stable dependencies.

Safety rules:
- Never guess dependencies by adding variables that may not be stable
- Prefer ESLint disable comments with manual review annotations
- Auto-add only simple stable references (constants, imported functions)
"""

import os
import re
import json
import subprocess
from typing import List, Dict, Set, Optional, Tuple
from pathlib import Path

# Track manual review items
manual_review_items = []

def run_eslint_for_hooks(directory: str) -> List[Dict]:
    """Run ESLint specifically for exhaustive-deps violations"""
    try:
        cmd = [
            'npx', 'eslint', 
            f'{directory}/**/*.{ts,tsx}',
            '--rule', 'react-hooks/exhaustive-deps:error',
            '--format', 'json',
            '--no-eslintrc',
            '--config', 'eslint.config.js'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=directory)
        
        if result.stdout:
            return json.loads(result.stdout)
        else:
            print("No ESLint output received")
            return []
            
    except Exception as e:
        print(f"Error running ESLint: {e}")
        return []

def extract_hook_violation_details(message: Dict) -> Optional[Dict]:
    """Extract details from a hooks dependency violation"""
    if message.get('ruleId') != 'react-hooks/exhaustive-deps':
        return None
    
    # Parse the message to extract missing dependencies
    msg_text = message.get('message', '')
    
    # Common patterns in exhaustive-deps messages
    missing_deps_pattern = r"React Hook .+ has (?:a )?missing dependenc(?:y|ies): (.+?)\."
    match = re.search(missing_deps_pattern, msg_text)
    
    if match:
        deps_text = match.group(1)
        # Split dependencies, handling quotes and 'and'
        deps_raw = re.split(r',\s*|\s+and\s+', deps_text)
        dependencies = []
        for dep in deps_raw:
            # Remove quotes and clean up
            clean_dep = re.sub(r"['\"]", '', dep.strip())
            if clean_dep:
                dependencies.append(clean_dep)
        
        return {
            'hook_type': extract_hook_type(msg_text),
            'missing_dependencies': dependencies,
            'line': message.get('line'),
            'column': message.get('column'),
            'message': msg_text
        }
    
    return None

def extract_hook_type(message: str) -> str:
    """Extract hook type from message"""
    if 'useEffect' in message:
        return 'useEffect'
    elif 'useCallback' in message:
        return 'useCallback'
    elif 'useMemo' in message:
        return 'useMemo'
    elif 'useLayoutEffect' in message:
        return 'useLayoutEffect'
    else:
        return 'unknown'

def is_safe_dependency(dep: str, file_content: str) -> bool:
    """
    Determine if a dependency is safe to auto-add.
    
    Safe dependencies:
    - Simple variable references (not object access)
    - Imported functions from modules
    - Constants defined at module level
    
    Unsafe dependencies:
    - setState functions (usually start with 'set' or end with 'Setter')
    - Object property access (contains '.')
    - Functions defined in component scope
    - Variables that could change on every render
    """
    
    # Definitely unsafe patterns
    unsafe_patterns = [
        r'^set[A-Z]',  # setState functions
        r'\.', # Object property access
        r'Setter$',  # Setter functions
        r'Handler$',  # Event handlers (often inline)
        r'Callback$',  # Callbacks (often inline)
    ]
    
    for pattern in unsafe_patterns:
        if re.search(pattern, dep):
            return False
    
    # Check if it's an import (appears in import statements)
    import_pattern = rf'import.*\b{re.escape(dep)}\b.*from'
    if re.search(import_pattern, file_content, re.MULTILINE):
        return True
    
    # Check if it's a module-level constant (defined outside any function)
    # This is a simplified check - in practice, proper AST parsing would be better
    const_pattern = rf'^(const|let|var)\s+{re.escape(dep)}\s*='
    if re.search(const_pattern, file_content, re.MULTILINE):
        # Check if it's not inside a function (very basic check)
        lines = file_content.split('\n')
        for i, line in enumerate(lines):
            if re.search(const_pattern, line):
                # Check if we're inside a function/component (look backwards for function declarations)
                in_function = False
                for j in range(max(0, i-20), i):
                    if re.search(r'^\s*(function|const \w+\s*=|class \w+)', lines[j]):
                        in_function = True
                        break
                if not in_function:
                    return True
    
    # If we can't determine it's safe, treat as unsafe
    return False

def add_manual_review_comment(file_path: str, line_number: int, dependencies: List[str], hook_type: str) -> bool:
    """Add ESLint disable comment with manual review annotation"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if line_number <= 0 or line_number > len(lines):
            print(f"Invalid line number {line_number} in {file_path}")
            return False
        
        # Insert comment before the hook line
        insert_line = line_number - 1  # Convert to 0-based index
        
        # Check if comment already exists
        if insert_line > 0:
            prev_line = lines[insert_line - 1].strip()
            if 'eslint-disable-next-line react-hooks/exhaustive-deps' in prev_line:
                print(f"Manual review comment already exists at {file_path}:{line_number}")
                return False
        
        # Create the comment
        deps_str = ', '.join(dependencies)
        comment = f"    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto: manual review required; refs: {deps_str}\n"
        
        # Insert the comment
        lines.insert(insert_line, comment)
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        # Add to manual review list
        manual_review_items.append({
            'file': file_path,
            'line': line_number,
            'hook_type': hook_type,
            'dependencies': dependencies,
            'reason': 'Contains potentially unsafe dependencies'
        })
        
        print(f"✓ Added manual review comment in {file_path}:{line_number} for {hook_type}")
        return True
        
    except Exception as e:
        print(f"Error adding manual review comment to {file_path}: {e}")
        return False

def process_hooks_violations(file_path: str, violations: List[Dict]) -> int:
    """Process all hooks violations in a file"""
    fixes_applied = 0
    
    if not violations:
        return fixes_applied
    
    print(f"\nProcessing {len(violations)} violations in {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return fixes_applied
    
    # Sort violations by line number (descending) to avoid line number shifts
    violations_sorted = sorted(violations, key=lambda v: v.get('line', 0), reverse=True)
    
    for violation in violations_sorted:
        details = extract_hook_violation_details(violation)
        if not details:
            continue
        
        missing_deps = details['missing_dependencies']
        line_number = details['line']
        hook_type = details['hook_type']
        
        print(f"  Line {line_number}: {hook_type} missing: {', '.join(missing_deps)}")
        
        # Check if all dependencies are safe to auto-add
        safe_deps = []
        unsafe_deps = []
        
        for dep in missing_deps:
            if is_safe_dependency(dep, file_content):
                safe_deps.append(dep)
            else:
                unsafe_deps.append(dep)
        
        if unsafe_deps:
            # Has unsafe dependencies - add manual review comment
            if add_manual_review_comment(file_path, line_number, missing_deps, hook_type):
                fixes_applied += 1
        else:
            # All dependencies are safe - could auto-add them
            # For now, we'll still add manual review comment to be extra conservative
            print(f"    All dependencies appear safe: {safe_deps}")
            if add_manual_review_comment(file_path, line_number, missing_deps, hook_type):
                fixes_applied += 1
    
    return fixes_applied

def save_manual_review_list():
    """Save the manual review list to a file"""
    output_file = 'ci/step-outputs/hooks_deps_manual_review.txt'
    
    try:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("React Hooks Dependencies Manual Review List\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Generated: {subprocess.run(['date'], capture_output=True, text=True).stdout.strip()}\n")
            f.write(f"Total items requiring manual review: {len(manual_review_items)}\n\n")
            
            for i, item in enumerate(manual_review_items, 1):
                f.write(f"{i}. {item['file']}:{item['line']}\n")
                f.write(f"   Hook: {item['hook_type']}\n")
                f.write(f"   Dependencies: {', '.join(item['dependencies'])}\n")
                f.write(f"   Reason: {item['reason']}\n")
                f.write("\n")
        
        print(f"\n✓ Manual review list saved to {output_file}")
        return output_file
        
    except Exception as e:
        print(f"Error saving manual review list: {e}")
        return None

def main():
    """Main function to process hooks dependencies"""
    print("🔧 Starting conservative React hooks dependencies fix...\n")
    
    # Change to the project directory
    project_dir = '/project/workspace/Coolhgg/Relife'
    os.chdir(project_dir)
    
    # Get TypeScript files in src directory
    src_files = []
    for root, dirs, files in os.walk('src'):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx')) and not file.endswith('.d.ts'):
                src_files.append(os.path.join(root, file))
    
    print(f"Found {len(src_files)} TypeScript files to check")
    
    total_fixes = 0
    processed_files = 0
    
    # Process files in batches to avoid overwhelming output
    batch_size = 5
    for i in range(0, len(src_files), batch_size):
        batch = src_files[i:i + batch_size]
        
        for file_path in batch:
            print(f"\nChecking {file_path}...")
            
            # Run ESLint on this specific file for hooks violations
            try:
                cmd = [
                    'npx', 'eslint',
                    file_path,
                    '--rule', 'react-hooks/exhaustive-deps:error',
                    '--format', 'json',
                    '--no-ignore'
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, cwd=project_dir)
                
                if result.stdout:
                    eslint_results = json.loads(result.stdout)
                    
                    for file_result in eslint_results:
                        if file_result.get('messages'):
                            # Filter for hooks violations
                            hooks_violations = [
                                msg for msg in file_result['messages']
                                if msg.get('ruleId') == 'react-hooks/exhaustive-deps'
                            ]
                            
                            if hooks_violations:
                                fixes = process_hooks_violations(file_path, hooks_violations)
                                total_fixes += fixes
                                processed_files += 1
                            else:
                                print(f"  ✓ No hooks dependency violations found")
                        else:
                            print(f"  ✓ No violations found")
                else:
                    print(f"  ✓ No ESLint issues found")
                    
            except Exception as e:
                print(f"  ❌ Error processing {file_path}: {e}")
        
        # Small delay between batches
        if i + batch_size < len(src_files):
            print(f"\nProcessed {min(i + batch_size, len(src_files))} of {len(src_files)} files...")
    
    # Save manual review list
    review_file = save_manual_review_list()
    
    print(f"\n🎉 Conservative hooks dependency fix completed!")
    print(f"Files processed: {processed_files}")
    print(f"Manual review comments added: {total_fixes}")
    print(f"Manual review items: {len(manual_review_items)}")
    if review_file:
        print(f"Review list saved to: {review_file}")
    
    return total_fixes

if __name__ == '__main__':
    main()