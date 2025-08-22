#!/usr/bin/env python3

import os
import re
from pathlib import Path

def find_unused_imports(file_path):
    """Find potentially unused imports in a TypeScript/JavaScript file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return []

    # Find all imports
    import_pattern = r'^import\s+(?:(?:\*\s+as\s+(\w+))|(?:\{\s*([^}]+)\s*\})|(?:(\w+)))\s+from\s+[\'"]([^\'"]+)[\'"];?\s*$'
    
    unused_imports = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        
        # Skip if not an import line
        if not line.startswith('import '):
            continue
            
        # Extract imported names
        match = re.match(import_pattern, line, re.MULTILINE)
        if not match:
            continue
            
        default_import = match.group(3)
        named_imports = match.group(2)
        namespace_import = match.group(1)
        module_path = match.group(4)
        
        # Check default import
        if default_import:
            # Look for usage of default import (excluding the import line itself)
            other_content = '\n'.join(lines[:i-1] + lines[i:])
            if not re.search(r'\b' + re.escape(default_import) + r'\b', other_content):
                unused_imports.append((i, default_import, module_path))
        
        # Check named imports
        if named_imports:
            imports = [imp.strip() for imp in named_imports.split(',')]
            for imp in imports:
                # Handle 'as' aliases
                if ' as ' in imp:
                    actual_name = imp.split(' as ')[-1].strip()
                else:
                    actual_name = imp.strip()
                
                # Look for usage (excluding the import line itself)
                other_content = '\n'.join(lines[:i-1] + lines[i:])
                if not re.search(r'\b' + re.escape(actual_name) + r'\b', other_content):
                    unused_imports.append((i, actual_name, module_path))
        
        # Check namespace import
        if namespace_import:
            other_content = '\n'.join(lines[:i-1] + lines[i:])
            if not re.search(r'\b' + re.escape(namespace_import) + r'\b', other_content):
                unused_imports.append((i, namespace_import, module_path))
    
    return unused_imports

def scan_directory(directory, extensions=['.ts', '.tsx', '.js', '.jsx']):
    """Scan a directory for files with unused imports."""
    results = {}
    
    for ext in extensions:
        pattern = f"**/*{ext}"
        files = Path(directory).glob(pattern)
        
        for file_path in files:
            # Skip node_modules and .git directories
            if 'node_modules' in str(file_path) or '.git' in str(file_path):
                continue
                
            unused = find_unused_imports(file_path)
            if unused:
                results[str(file_path)] = unused
    
    return results

if __name__ == "__main__":
    # Scan specific directories
    directories = [
        "relife-campaign-dashboard/src",
        "src"
    ]
    
    all_results = {}
    
    for directory in directories:
        if os.path.exists(directory):
            print(f"\nScanning {directory}...")
            results = scan_directory(directory)
            all_results.update(results)
    
    # Print results
    if all_results:
        print("\n=== POTENTIALLY UNUSED IMPORTS ===")
        for file_path, unused_imports in all_results.items():
            print(f"\n{file_path}:")
            for line_num, import_name, module_path in unused_imports:
                print(f"  Line {line_num}: {import_name} from '{module_path}'")
    else:
        print("\nNo unused imports found!")