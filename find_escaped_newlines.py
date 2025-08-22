#!/usr/bin/env python3
"""
Script to find files with excessive literal \\n sequences and few lines.
Criteria: files with extensions .ts .tsx .js .jsx .json .md .txt
where count of '\\n' > 10 and line count < 6.
"""
import os
import glob
import re

def count_escaped_newlines(content):
    """Count literal \\n occurrences in content"""
    return content.count('\\n')

def count_lines(content):
    """Count actual lines in content"""
    return len(content.splitlines())

def find_problematic_files(root_dir):
    """Find files matching the criteria"""
    extensions = ['*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md', '*.txt']
    problematic_files = []
    
    for ext in extensions:
        pattern = os.path.join(root_dir, '**', ext)
        files = glob.glob(pattern, recursive=True)
        
        for file_path in files:
            # Skip node_modules and other common directories
            if any(skip in file_path for skip in ['node_modules', '.git', 'dist', 'build']):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                escaped_count = count_escaped_newlines(content)
                line_count = count_lines(content)
                
                if escaped_count > 10 and line_count < 6:
                    problematic_files.append({
                        'path': file_path,
                        'escaped_count': escaped_count,
                        'line_count': line_count
                    })
                    
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                continue
    
    return problematic_files

if __name__ == "__main__":
    root_dir = "/project/workspace/Coolhgg/Relife"
    files = find_problematic_files(root_dir)
    
    if files:
        print(f"Found {len(files)} files with excessive escaped newlines:")
        for file_info in files:
            print(f"  {file_info['path']} (\\n: {file_info['escaped_count']}, lines: {file_info['line_count']})")
    else:
        print("No files found matching the criteria")
    
    # Also output just the file paths for processing
    if files:
        print("\nFile paths only:")
        for file_info in files:
            print(file_info['path'])