#!/usr/bin/env python3
"""
Script to find files that may have been corrupted where newlines 
were converted to literal \\n sequences.
"""
import os
import glob
import re

def analyze_file_for_corruption(file_path):
    """
    Analyze a file to see if it might be corrupted with literal \\n sequences
    that should be actual newlines.
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        lines = content.splitlines()
        line_count = len(lines)
        
        # Count literal \\n sequences (not inside string literals ideally)
        escaped_newline_count = content.count('\\n')
        
        # Look for suspicious patterns:
        # 1. Very few lines but many \\n sequences
        # 2. Lines that look like they should be broken up
        suspicious_patterns = []
        
        if line_count < 6 and escaped_newline_count > 10:
            suspicious_patterns.append("few_lines_many_escapes")
        
        # Look for lines that contain many \\n sequences
        for i, line in enumerate(lines):
            line_escaped_count = line.count('\\n')
            if line_escaped_count > 5:
                suspicious_patterns.append(f"line_{i+1}_has_{line_escaped_count}_escapes")
        
        # Look for patterns like text\\ntext\\ntext that might be corrupted
        if re.search(r'\w\\n\w', content):
            suspicious_patterns.append("word_backslash_n_word_pattern")
        
        return {
            'path': file_path,
            'line_count': line_count,
            'escaped_count': escaped_newline_count,
            'suspicious_patterns': suspicious_patterns,
            'sample_lines': lines[:3] if lines else []
        }
        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def find_potentially_corrupted_files(root_dir):
    """Find files that might be corrupted"""
    extensions = ['*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md', '*.txt']
    potentially_corrupted = []
    
    for ext in extensions:
        pattern = os.path.join(root_dir, '**', ext)
        files = glob.glob(pattern, recursive=True)
        
        for file_path in files:
            # Skip node_modules and other directories
            if any(skip in file_path for skip in ['node_modules', '.git', 'dist', 'build']):
                continue
            
            analysis = analyze_file_for_corruption(file_path)
            if analysis and analysis['suspicious_patterns']:
                potentially_corrupted.append(analysis)
    
    return potentially_corrupted

if __name__ == "__main__":
    root_dir = "/project/workspace/Coolhgg/Relife"
    corrupted_files = find_potentially_corrupted_files(root_dir)
    
    if corrupted_files:
        print(f"Found {len(corrupted_files)} potentially corrupted files:")
        for file_info in corrupted_files:
            print(f"\n{file_info['path']}")
            print(f"  Lines: {file_info['line_count']}, \\n count: {file_info['escaped_count']}")
            print(f"  Patterns: {', '.join(file_info['suspicious_patterns'])}")
            if file_info['sample_lines']:
                print("  Sample lines:")
                for i, line in enumerate(file_info['sample_lines']):
                    print(f"    {i+1}: {repr(line[:100])}")
    else:
        print("No potentially corrupted files found")