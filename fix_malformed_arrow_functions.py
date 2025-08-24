#!/usr/bin/env python3
"""
Fix malformed arrow function completions created by previous script.

The previous script incorrectly added `{ /* TODO: implement */ }` to arrow functions
that were already complete, creating syntax errors.

This script identifies and fixes patterns like:
  parameter) => { /* TODO: implement */ }
      actual_function_body

And reverts them to:
  parameter) => actual_function_body
"""

import re
import os
import json
from pathlib import Path


def fix_malformed_arrow_functions(content: str) -> tuple[str, list[dict]]:
    """
    Fix malformed arrow function completions.
    
    Returns:
        tuple: (fixed_content, list_of_fixes)
    """
    fixes = []
    
    # Pattern to match malformed arrow function completions
    # Looks for: `) => { /* TODO: implement */ }\n    content`
    patterns = [
        # Pattern 1: Basic malformed completion
        (
            r'(\w+.*?)\s*\)\s*=>\s*\{\s*/\*\s*TODO:\s*implement\s*\*/\s*\}\s*\n\s*([^\n\}]+)',
            r'\1) => \2'
        ),
        # Pattern 2: Anonymous function with parameters  
        (
            r'(\([^)]*\))\s*=>\s*\{\s*/\*\s*TODO:\s*implement\s*\*/\s*\}\s*\n\s*([^\n\}]+)',
            r'\1 => \2'
        ),
        # Pattern 3: Single parameter without parentheses
        (
            r'(\w+)\s*=>\s*\{\s*/\*\s*TODO:\s*implement\s*\*/\s*\}\s*\n\s*([^\n\}]+)',
            r'\1 => \2'
        ),
        # Pattern 4: Complex parameter with type annotations
        (
            r'([^=]+=>\s*)\{\s*/\*\s*TODO:\s*implement\s*\*/\s*\}\s*\n\s*([^\n\}]+)',
            r'\1\2'
        ),
    ]
    
    fixed_content = content
    
    for pattern, replacement in patterns:
        matches = list(re.finditer(pattern, fixed_content, re.MULTILINE))
        for match in reversed(matches):  # Process in reverse to maintain positions
            original_text = match.group(0)
            line_num = fixed_content[:match.start()].count('\n') + 1
            
            # Apply the fix
            fixed_text = re.sub(pattern, replacement, original_text, count=1)
            fixed_content = (
                fixed_content[:match.start()] + 
                fixed_text + 
                fixed_content[match.end():]
            )
            
            fixes.append({
                'line': line_num,
                'pattern': pattern,
                'original': original_text.strip(),
                'fixed': fixed_text.strip(),
                'description': 'Removed malformed arrow function completion'
            })
    
    # Additional specific fixes for common malformed patterns
    specific_patterns = [
        # Fix: `) => { /* TODO: implement */ } code` to `) => code`
        (
            r'(\))\s*=>\s*\{\s*/\*\s*TODO:\s*implement\s*\*/\s*\}\s*([^{\n]+)',
            r'\1 => \2'
        ),
        # Fix inline malformed completions
        (
            r'(=>)\s*\{\s*/\*\s*TODO:\s*implement\s*\*/\s*\}\s*([^{\n]+)',
            r'\1 \2'
        ),
    ]
    
    for pattern, replacement in specific_patterns:
        matches = list(re.finditer(pattern, fixed_content, re.MULTILINE))
        for match in reversed(matches):
            original_text = match.group(0)
            line_num = fixed_content[:match.start()].count('\n') + 1
            
            fixed_text = re.sub(pattern, replacement, original_text)
            fixed_content = (
                fixed_content[:match.start()] + 
                fixed_text + 
                fixed_content[match.end():]
            )
            
            fixes.append({
                'line': line_num,
                'pattern': 'inline_malformed',
                'original': original_text.strip(),
                'fixed': fixed_text.strip(),
                'description': 'Fixed inline malformed arrow function'
            })
    
    return fixed_content, fixes


def process_file(file_path: Path) -> dict:
    """Process a single file and return results."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return {
            'file': str(file_path),
            'error': f"Failed to read file: {e}",
            'fixes': []
        }
    
    original_content = content
    fixed_content, fixes = fix_malformed_arrow_functions(content)
    
    # Only write if changes were made
    if fixed_content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
        except Exception as e:
            return {
                'file': str(file_path),
                'error': f"Failed to write file: {e}",
                'fixes': fixes
            }
    
    return {
        'file': str(file_path),
        'fixes': fixes,
        'changed': fixed_content != original_content
    }


def main():
    """Main function to fix malformed arrow functions."""
    base_dir = Path('/project/workspace/Coolhgg/Relife/src')
    
    # Find all TypeScript/JavaScript files
    file_patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
    files_to_process = []
    
    for pattern in file_patterns:
        files_to_process.extend(base_dir.glob(pattern))
    
    print(f"Processing {len(files_to_process)} files...")
    
    results = {
        'total_files': len(files_to_process),
        'files_processed': 0,
        'files_with_fixes': 0,
        'total_fixes': 0,
        'files': []
    }
    
    for file_path in files_to_process:
        if file_path.is_file():
            result = process_file(file_path)
            results['files'].append(result)
            results['files_processed'] += 1
            
            if result.get('fixes'):
                results['files_with_fixes'] += 1
                results['total_fixes'] += len(result['fixes'])
                print(f"Fixed {len(result['fixes'])} issues in {file_path.relative_to(base_dir)}")
    
    # Save results
    output_dir = Path('/project/workspace/Coolhgg/Relife/ci/step-outputs')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with open(output_dir / 'arrow-function-fixes.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nSummary:")
    print(f"- Files processed: {results['files_processed']}")
    print(f"- Files with fixes: {results['files_with_fixes']}")
    print(f"- Total fixes applied: {results['total_fixes']}")
    print(f"- Results saved to: ci/step-outputs/arrow-function-fixes.json")


if __name__ == '__main__':
    main()