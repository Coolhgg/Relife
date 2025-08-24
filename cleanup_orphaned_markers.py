#!/usr/bin/env python3

import os
import re
import subprocess

def cleanup_orphaned_markers():
    """Clean up orphaned conflict markers from all files"""
    
    # Get all files with conflicts from git
    result = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], 
                          capture_output=True, text=True, cwd='/project/workspace/Coolhgg/Relife')
    
    conflicted_files = result.stdout.strip().split('\n')
    
    cleaned_count = 0
    
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
            
            # Remove orphaned conflict markers
            content = re.sub(r'\n<<<<<<< HEAD\n', '\n', content)
            content = re.sub(r'<<<<<<< HEAD\n', '', content)
            content = re.sub(r'\n=======\n\n>>>>>>> origin/main', '', content)
            content = re.sub(r'=======\n\n>>>>>>> origin/main', '', content)
            content = re.sub(r'\n=======\n>>>>>>> origin/main', '', content) 
            content = re.sub(r'=======\n>>>>>>> origin/main', '', content)
            
            if content != original_content:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Cleaned up orphaned markers in: {file_path}")
                cleaned_count += 1
            else:
                print(f"✅ No orphaned markers in: {file_path}")
                
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\n🎯 Cleaned up orphaned markers in {cleaned_count} files")
    return cleaned_count

if __name__ == "__main__":
    cleanup_orphaned_markers()