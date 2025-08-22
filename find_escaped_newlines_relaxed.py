#!/usr/bin/env python3
"""
Script to find files with literal \\n sequences.
Let's see what we can find with relaxed criteria.
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

def find_files_with_escaped_newlines(root_dir, min_escaped=1):
    """Find files with escaped newlines"""
    extensions = ['*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md', '*.txt']
    files_with_escaped = []
    
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
                
                if escaped_count >= min_escaped:
                    files_with_escaped.append({
                        'path': file_path,
                        'escaped_count': escaped_count,
                        'line_count': line_count
                    })
                    
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                continue
    
    return files_with_escaped

if __name__ == "__main__":
    root_dir = "/project/workspace/Coolhgg/Relife"
    
    # First, let's see files with any escaped newlines
    print("=== Files with any escaped newlines ===")
    files = find_files_with_escaped_newlines(root_dir, min_escaped=1)
    
    if files:
        # Sort by escaped count descending
        files.sort(key=lambda x: x['escaped_count'], reverse=True)
        print(f"Found {len(files)} files with escaped newlines:")
        for file_info in files[:20]:  # Show top 20
            print(f"  {file_info['path']} (\\n: {file_info['escaped_count']}, lines: {file_info['line_count']})")
        if len(files) > 20:
            print(f"  ... and {len(files) - 20} more files")
            
    else:
        print("No files found with escaped newlines")
    
    # Now check for the original criteria
    print("\n=== Files with >10 escaped newlines and <6 lines ===")
    problematic = [f for f in files if f['escaped_count'] > 10 and f['line_count'] < 6]
    
    if problematic:
        print(f"Found {len(problematic)} files matching original criteria:")
        for file_info in problematic:
            print(f"  {file_info['path']} (\\n: {file_info['escaped_count']}, lines: {file_info['line_count']})")
    else:
        print("No files found matching original criteria")
    
    # Let's also try a different criteria - files with lots of escaped newlines relative to their size
    print("\n=== Files with high escaped newline density ===")
    high_density = [f for f in files if f['line_count'] > 0 and f['escaped_count'] / f['line_count'] > 5]
    
    if high_density:
        high_density.sort(key=lambda x: x['escaped_count'] / x['line_count'], reverse=True)
        print(f"Found {len(high_density)} files with high escaped newline density:")
        for file_info in high_density[:10]:  # Show top 10
            density = file_info['escaped_count'] / file_info['line_count']
            print(f"  {file_info['path']} (\\n: {file_info['escaped_count']}, lines: {file_info['line_count']}, density: {density:.1f})")
    else:
        print("No files found with high escaped newline density")