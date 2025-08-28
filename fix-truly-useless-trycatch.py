#!/usr/bin/env python3

import os
import re
import json
from typing import List, Dict, Any
from pathlib import Path

class SelectiveTryCatchCleaner:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.changes_log = []
        self.files_processed = 0
        self.patterns_found = 0
        self.patterns_fixed = 0
        
    def find_files(self) -> List[Path]:
        """Find all TypeScript/JavaScript files to process."""
        extensions = ['.ts', '.tsx', '.js', '.jsx']
        files = []
        
        for ext in extensions:
            files.extend(self.base_dir.rglob(f'*{ext}'))
            
        # Filter out unwanted directories
        excluded_dirs = ['node_modules', 'backup', '.git', 'dist', 'build']
        filtered_files = []
        
        for file in files:
            if not any(excluded in str(file) for excluded in excluded_dirs):
                filtered_files.append(file)
                
        return filtered_files
    
    def detect_truly_useless_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Detect only truly useless try/catch patterns - those that just log and rethrow."""
        patterns = []
        
        # Very specific pattern: Only catch blocks that ONLY log and throw the same error
        # This excludes patterns that:
        # - Return different values
        # - Have other side effects
        # - Transform the error
        # - Have multiple statements beyond log + throw
        
        # Pattern: catch (error) { console.error/log/warn(...); throw error; }
        # Must be exactly 2 statements: log and throw
        pattern = re.compile(
            r'(\s*)try\s*\{\s*\n(.*?)\n\s*\}\s*catch\s*\(\s*(\w+)\s*\)\s*\{\s*\n'
            r'\s*console\.(error|log|warn)\s*\([^;]*\);\s*\n'
            r'\s*throw\s+\3;\s*\n'
            r'\s*\}',
            re.MULTILINE | re.DOTALL
        )
        
        for match in pattern.finditer(content):
            # Additional validation: ensure the catch block ONLY has console.X + throw
            catch_body_start = match.start() + len(match.group(1)) + len('try {') + len(match.group(2)) + len('} catch (' + match.group(3) + ') {')
            catch_body_end = match.end() - 1  # Before the closing }
            
            # Extract just the catch block content
            catch_content = content[catch_body_start:catch_body_end].strip()
            
            # Count non-empty lines in catch block
            non_empty_lines = [line.strip() for line in catch_content.split('\n') if line.strip()]
            
            # Only consider it useless if there are exactly 2 lines: console.X and throw
            if len(non_empty_lines) == 2:
                console_line = non_empty_lines[0]
                throw_line = non_empty_lines[1]
                
                # Verify the pattern
                if (console_line.startswith('console.') and 
                    console_line.endswith(';') and
                    throw_line == f'throw {match.group(3)};'):
                    
                    patterns.append({
                        'type': 'truly_useless_log_throw',
                        'full_match': match.group(0),
                        'indentation': match.group(1),
                        'try_body': match.group(2),
                        'error_var': match.group(3),
                        'start': match.start(),
                        'end': match.end(),
                        'console_line': console_line,
                        'throw_line': throw_line
                    })
        
        return sorted(patterns, key=lambda p: p['start'], reverse=True)
    
    def fix_pattern(self, content: str, pattern: Dict[str, Any]) -> str:
        """Fix a single truly useless try/catch pattern."""
        try_body = pattern['try_body'].strip()
        indentation = pattern['indentation']
        
        # Create the replacement - just the try body with proper indentation
        replacement_lines = []
        for line in try_body.split('\n'):
            if line.strip():  # Skip empty lines
                replacement_lines.append(indentation + line.strip())
        
        replacement = '\n'.join(replacement_lines)
        
        # Replace the full match with just the try body
        new_content = (
            content[:pattern['start']] + 
            replacement + 
            content[pattern['end']:]
        )
        
        return new_content
    
    def process_file(self, file_path: Path) -> bool:
        """Process a single file and fix truly useless try/catch patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            patterns = self.detect_truly_useless_patterns(original_content)
            self.patterns_found += len(patterns)
            
            if not patterns:
                return False
            
            content = original_content
            fixed_patterns = []
            
            for pattern in patterns:
                new_content = self.fix_pattern(content, pattern)
                if new_content != content:
                    fixed_patterns.append(pattern)
                    content = new_content
            
            if fixed_patterns:
                # Write the fixed content back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                self.patterns_fixed += len(fixed_patterns)
                
                # Log the changes
                self.changes_log.append({
                    'file': str(file_path.relative_to(self.base_dir)),
                    'patterns_fixed': len(fixed_patterns),
                    'patterns': [
                        {
                            'type': p['type'],
                            'console_line': p['console_line'],
                            'throw_line': p['throw_line']
                        }
                        for p in fixed_patterns
                    ]
                })
                
                return True
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
        return False
    
    def run_cleanup(self):
        """Run the selective cleanup process on all files."""
        print("🔍 Finding TypeScript/JavaScript files...")
        files = self.find_files()
        print(f"📂 Found {len(files)} files to analyze")
        
        print("\n🔎 Analyzing files for truly useless try/catch patterns...")
        print("   (Only patterns that just log and rethrow will be cleaned up)")
        
        for file_path in files:
            if self.process_file(file_path):
                self.files_processed += 1
                print(f"✅ Fixed {file_path.relative_to(self.base_dir)}")
            
        print(f"\n📊 Selective Cleanup Summary:")
        print(f"   Files analyzed: {len(files)}")
        print(f"   Files modified: {self.files_processed}")
        print(f"   Truly useless patterns found: {self.patterns_found}")
        print(f"   Patterns fixed: {self.patterns_fixed}")
        
        return {
            'files_analyzed': len(files),
            'files_modified': self.files_processed,
            'patterns_found': self.patterns_found,
            'patterns_fixed': self.patterns_fixed,
            'changes': self.changes_log
        }

def main():
    base_dir = "/project/workspace/lalpyaare440-star/Relife"
    cleaner = SelectiveTryCatchCleaner(base_dir)
    
    print("🚀 Starting selective try/catch cleanup process...")
    print("🎯 Only targeting patterns that provide no value (just log + throw)")
    results = cleaner.run_cleanup()
    
    # Save results to log file
    timestamp = "20250828_134500"  # Updated timestamp
    log_dir = Path(base_dir) / "ci" / "fix-reports"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / f"selective-trycatch-cleanup-{timestamp}.log"
    
    with open(log_file, 'w') as f:
        f.write("# Selective Try/Catch Cleanup Report\n")
        f.write(f"Timestamp: {timestamp}\n\n")
        f.write("## Approach\n")
        f.write("Only cleaned up patterns that are truly useless:\n")
        f.write("- Catch blocks with exactly 2 statements: console.log/error/warn + throw\n")
        f.write("- No return values, transformations, or other logic\n")
        f.write("- Patterns that provide no value over natural error propagation\n\n")
        f.write("## Summary\n")
        f.write(f"- Files analyzed: {results['files_analyzed']}\n")
        f.write(f"- Files modified: {results['files_modified']}\n") 
        f.write(f"- Truly useless patterns found: {results['patterns_found']}\n")
        f.write(f"- Patterns fixed: {results['patterns_fixed']}\n\n")
        
        f.write("## Detailed Changes\n")
        for change in results['changes']:
            f.write(f"\n### {change['file']}\n")
            f.write(f"Patterns fixed: {change['patterns_fixed']}\n")
            for pattern in change['patterns']:
                f.write(f"- Removed: {pattern['console_line']} + {pattern['throw_line']}\n")
    
    # Also save as JSON
    json_file = log_dir / f"selective-trycatch-cleanup-{timestamp}.json"
    with open(json_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Results saved to:")
    print(f"   {log_file}")
    print(f"   {json_file}")

if __name__ == "__main__":
    main()