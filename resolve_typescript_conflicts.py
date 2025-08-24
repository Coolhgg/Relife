#!/usr/bin/env python3

import os
import re
import subprocess

def resolve_typescript_conflicts():
    """Resolve TypeScript type-related merge conflicts systematically"""
    
    # Get all files with conflicts
    result = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], 
                          capture_output=True, text=True, cwd='/project/workspace/Coolhgg/Relife')
    
    conflicted_files = result.stdout.strip().split('\n')
    
    resolved_count = 0
    
    for file_path in conflicted_files:
        if not file_path:
            continue
            
        full_path = f'/project/workspace/Coolhgg/Relife/{file_path}'
        
        if not os.path.exists(full_path):
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # TypeScript type improvement conflicts - prefer HEAD (better types)
            
            # Pattern 1: State setter types - prefer specific types over 'any'
            content = re.sub(
                r'<<<<<<< HEAD\n([^<>=]*\(prev:\s*[A-Za-z][A-Za-z0-9]*\)[^<>=]*)\n=======\n([^<>=]*\(prev:\s*any\)[^<>=]*)\n>>>>>>> origin/main',
                r'\1',
                content,
                flags=re.MULTILINE | re.DOTALL
            )
            
            # Pattern 2: Event handler types - prefer specific React event types over 'any'
            content = re.sub(
                r'<<<<<<< HEAD\n([^<>=]*\(e:\s*React\.[A-Za-z][A-Za-z0-9]*Event[^)]*\)[^<>=]*)\n=======\n([^<>=]*\(e:\s*any\)[^<>=]*)\n>>>>>>> origin/main',
                r'\1',
                content,
                flags=re.MULTILINE | re.DOTALL
            )
            
            # Pattern 3: onChange handlers - prefer typed over any
            content = re.sub(
                r'<<<<<<< HEAD\n([^<>=]*onChange.*:\s*React\.[A-Za-z][A-Za-z0-9]*Event[^<>=]*)\n=======\n([^<>=]*onChange.*:\s*any[^<>=]*)\n>>>>>>> origin/main',
                r'\1',
                content,
                flags=re.MULTILINE | re.DOTALL
            )
            
            # Pattern 4: Function parameter typing - prefer specific types
            content = re.sub(
                r'<<<<<<< HEAD\n([^<>=]*\([^)]*:\s*[A-Za-z][A-Za-z0-9]*(?:\[\])?[^)]*\)[^<>=]*)\n=======\n([^<>=]*\([^)]*:\s*any[^)]*\)[^<>=]*)\n>>>>>>> origin/main',
                r'\1',
                content,
                flags=re.MULTILINE | re.DOTALL
            )
            
            # Pattern 5: Generic/simple conflicts where HEAD has better typing
            remaining_conflicts = re.findall(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/main', content, re.DOTALL)
            
            for head_content, main_content in remaining_conflicts:
                # Check if HEAD has better typing (contains type annotations)
                head_has_types = bool(re.search(r':\s*[A-Za-z][A-Za-z0-9]*(?:<[^>]*>)?(?:\[\])?', head_content))
                main_has_any = 'any' in main_content
                
                if head_has_types and (main_has_any or not re.search(r':\s*[A-Za-z][A-Za-z0-9]*', main_content)):
                    # Prefer HEAD version with better types
                    replacement = head_content
                elif head_content.strip() == main_content.strip():
                    # If content is the same, use either
                    replacement = main_content
                else:
                    # For functional differences, be more careful
                    # Check if it's just whitespace/formatting differences
                    head_clean = re.sub(r'\s+', ' ', head_content.strip())
                    main_clean = re.sub(r'\s+', ' ', main_content.strip())
                    
                    if head_clean == main_clean:
                        replacement = main_content  # Prefer main formatting
                    else:
                        # Default to HEAD for type improvements
                        replacement = head_content
                
                # Replace the conflict with the chosen content
                conflict_pattern = re.escape(f'<<<<<<< HEAD\n{head_content}\n=======\n{main_content}\n>>>>>>> origin/main')
                content = re.sub(conflict_pattern, replacement, content)
            
            if content != original_content:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Resolved TypeScript conflicts in: {file_path}")
                resolved_count += 1
            else:
                print(f"⚠️  No TypeScript conflicts found in: {file_path}")
                
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\n🎯 Resolved TypeScript conflicts in {resolved_count} files")
    return resolved_count

if __name__ == "__main__":
    resolve_typescript_conflicts()