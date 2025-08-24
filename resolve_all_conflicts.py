#!/usr/bin/env python3

import os
import re

def resolve_all_conflicts():
    """Resolve all merge conflicts in the repository"""
    
    # Get all files with conflicts
    import subprocess
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
            
            # Strategy: For lint cleanup conflicts, prefer cleaner main version
            # but preserve any essential functional changes
            
            # Pattern 1: Simple import conflicts with global comments - prefer main
            content = re.sub(
                r'<<<<<<< HEAD\n/\* global[^*]*\*/\n[^\n]*// auto: added missing React import[^\n]*\n=======\n([^\n]*)\n>>>>>>> origin/main',
                r'\1',
                content
            )
            
            # Pattern 2: JSX namespace conflicts - prefer main  
            content = re.sub(
                r'<<<<<<< HEAD\n[^\n]*JSX[^\n]*\n=======\n([^\n]*)\n>>>>>>> origin/main',
                r'\1', 
                content
            )
            
            # Pattern 3: Global function type conflicts - prefer main
            content = re.sub(
                r'<<<<<<< HEAD\n[^\n]*fn[^\n]*\n=======\n([^\n]*)\n>>>>>>> origin/main',
                r'\1',
                content
            )
            
            # Pattern 4: For remaining conflicts, take HEAD but clean up comments
            remaining_conflicts = re.findall(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/main', content, re.DOTALL)
            
            for head_content, main_content in remaining_conflicts:
                # Clean up HEAD content by removing auto-generated comments
                cleaned_head = head_content
                cleaned_head = re.sub(r'\s*// auto: [^\n]*', '', cleaned_head)
                cleaned_head = re.sub(r'\s*/\* global [^*]* \*/', '', cleaned_head)
                
                # If HEAD content is substantially the same as main after cleanup, use main
                if cleaned_head.strip() == main_content.strip():
                    replacement = main_content
                else:
                    # Use cleaned HEAD content
                    replacement = cleaned_head
                
                # Replace the conflict with the chosen content
                conflict_pattern = re.escape(f'<<<<<<< HEAD\n{head_content}\n=======\n{main_content}\n>>>>>>> origin/main')
                content = re.sub(conflict_pattern, replacement, content)
            
            if content != original_content:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Resolved conflicts in: {file_path}")
                resolved_count += 1
            else:
                print(f"⚠️  No conflicts found in: {file_path}")
                
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\n🎯 Resolved conflicts in {resolved_count} files")
    return resolved_count

if __name__ == "__main__":
    resolve_all_conflicts()