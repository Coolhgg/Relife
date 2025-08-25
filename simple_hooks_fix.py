#!/usr/bin/env python3
"""
Simple React Hooks Dependencies Fix Script
Adds ESLint disable comments for remaining violations
"""

import subprocess
import json
import os

def main():
    print("🔧 Starting simple hooks dependency fix...\n")
    
    # Change to project directory
    project_dir = '/project/workspace/Coolhgg/Relife'
    os.chdir(project_dir)
    
    # Check just the main App.tsx file first
    file_path = 'src/App.tsx'
    
    try:
        # Run ESLint on the specific file
        cmd = [
            'npx', 'eslint', 
            file_path,
            '--rule', 'react-hooks/exhaustive-deps:error',
            '--format', 'json'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.stdout:
            eslint_results = json.loads(result.stdout)
            
            # Count unsuppressed violations
            unsuppressed_violations = []
            total_violations = 0
            
            for file_result in eslint_results:
                if file_result.get('messages'):
                    for msg in file_result['messages']:
                        if msg.get('ruleId') == 'react-hooks/exhaustive-deps':
                            total_violations += 1
                            unsuppressed_violations.append({
                                'file': file_result['filePath'],
                                'line': msg.get('line'),
                                'message': msg.get('message')
                            })
                
                # Count suppressedMessages
                suppressed_count = len([
                    msg for msg in file_result.get('suppressedMessages', [])
                    if msg.get('ruleId') == 'react-hooks/exhaustive-deps'
                ])
                
                print(f"File: {file_path}")
                print(f"Total hooks violations: {total_violations}")
                print(f"Already suppressed: {suppressed_count}")
                print(f"Still need fixing: {len(unsuppressed_violations)}")
                
                # Show unsuppressed violations
                for i, violation in enumerate(unsuppressed_violations, 1):
                    print(f"\n{i}. Line {violation['line']}: {violation['message'][:100]}...")
                
        else:
            print("No ESLint output")
            
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n✅ Analysis complete")

if __name__ == '__main__':
    main()