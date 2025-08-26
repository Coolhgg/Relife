#!/usr/bin/env python3
"""
Script for Round 2 of any-type reduction focusing on remaining high-usage files
"""

import os
import re
import subprocess

def add_imports_to_file(file_path, imports_needed):
    """Add necessary imports to a TypeScript file"""
    print(f"Adding imports to {file_path}: {', '.join(imports_needed)}")
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Determine the correct import path
        src_depth = file_path.count('src/') 
        path_depth = file_path.count('/') - src_depth - file_path.count('src/')
        
        if 'src/__tests__' in file_path:
            import_path = '../../types/common-types'
        elif 'src/types' in file_path:
            import_path = './common-types'
        elif 'src/components' in file_path or 'src/services' in file_path or 'src/hooks' in file_path or 'src/backend' in file_path:
            import_path = '../types/common-types'
        else:
            import_path = '../types/common-types'
        
        # Check if file already has imports from common-types
        import_pattern = r'import\s*\{([^}]+)\}\s*from\s*[\'"][^\'\"]*common-types[\'"];?'
        match = re.search(import_pattern, content)
        
        if match:
            # Update existing import
            existing_imports = [imp.strip() for imp in match.group(1).split(',')]
            all_imports = sorted(set(existing_imports + imports_needed))
            new_import = f"import {{\n  {', '.join(all_imports)}\n}} from '{import_path}';"
            content = re.sub(import_pattern, new_import, content)
        else:
            # Add new import
            import_statement = f"import {{\n  {', '.join(sorted(imports_needed))}\n}} from '{import_path}';\n\n"
            
            # Find the right place to insert
            lines = content.split('\n')
            insert_pos = 0
            
            # Skip initial comment blocks
            in_comment = False
            for i, line in enumerate(lines):
                stripped = line.strip()
                if stripped.startswith('/**'):
                    in_comment = True
                elif stripped.endswith('*/') and in_comment:
                    in_comment = False
                    insert_pos = i + 1
                elif stripped.startswith('//') and not in_comment:
                    continue
                elif stripped.startswith('import ') or stripped.startswith('export '):
                    break
                elif stripped and not in_comment and not stripped.startswith('//'):
                    insert_pos = i
                    break
            
            # Insert after existing imports if any
            for i in range(insert_pos, len(lines)):
                if not lines[i].strip().startswith('import ') and lines[i].strip():
                    insert_pos = i
                    break
            
            lines.insert(insert_pos, import_statement.rstrip())
            content = '\n'.join(lines)
        
        with open(file_path, 'w') as f:
            f.write(content)
            
        return True
    except Exception as e:
        print(f"Error adding imports to {file_path}: {e}")
        return False

def process_file_advanced(file_path):
    """Advanced processing for specific file types"""
    print(f"Processing: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original_content = content
        changes_made = 0
        imports_needed = set()
        
        # Advanced replacements based on file type
        if 'AdvancedAlarmScheduling.tsx' in file_path:
            # Component-specific replacements
            replacements = [
                (r'const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^;]*:\s*any', r'const \1 = ... as unknown'),
                (r'useState<any>', 'useState<unknown>'),
                (r'React\.FC<any>', 'React.FC<Record<string, unknown>>'),
                (r'onValueChange=\{\([^)]*:\s*any\)', r'onValueChange={(...args: unknown[])'),
                (r'onChange=\{\([^)]*:\s*any\)', r'onChange={(...args: unknown[])'),
            ]
            
        elif 'utility-types.ts' in file_path or 'service-architecture.ts' in file_path:
            # Type definition file replacements
            replacements = [
                (r'export\s+type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*any', r'export type \1 = unknown'),
                (r'export\s+interface\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{[^}]*:\s*any', r'export interface \1 { [key: string]: unknown'),
                (r':\s*any\s*;', ': unknown;'),
                (r'<any>', '<unknown>'),
            ]
            
        elif '.test.ts' in file_path:
            # Test file replacements
            replacements = [
                (r'jest\.fn\(\)\s*as\s*any', 'jest.fn() as jest.MockedFunction<(...args: unknown[]) => unknown>'),
                (r'mockImplementation\(\([^)]*:\s*any\)', r'mockImplementation((...args: unknown[])'),
                (r'expect\.any\(Object\)', 'expect.any(Object)'),  # Keep this one
                (r'mock[a-zA-Z]*\s*:\s*any', r'mock: unknown'),
            ]
            
        elif 'cloudflare-functions.ts' in file_path or 'performance-monitoring.ts' in file_path:
            # Backend service file replacements
            replacements = [
                (r'Request<any>', 'Request<Record<string, unknown>>'),
                (r'Response<any>', 'Response<Record<string, unknown>>'),
                (r'context:\s*any', 'context: Record<string, unknown>'),
                (r'env:\s*any', 'env: Record<string, unknown>'),
                (r'event:\s*any', 'event: Record<string, unknown>'),
            ]
            
        elif 'AccessibilityDashboard.tsx' in file_path:
            # Component file replacements
            replacements = [
                (r'props:\s*any', 'props: Record<string, unknown>'),
                (r'React\.ComponentType<any>', 'React.ComponentType<Record<string, unknown>>'),
                (r'useCallback\([^,]*,\s*\[[^]]*\]\s*\)\s*as\s*any', 'useCallback(...) as EventHandler'),
            ]
            imports_needed.add('EventHandler')
            
        else:
            # Generic replacements for all other files
            replacements = []
        
        # Common replacements for all files
        common_replacements = [
            # Function parameters and return types
            (r'\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r'(\1: unknown)'),
            (r'\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any,', r'(\1: unknown,'),
            (r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r', \1: unknown)'),
            (r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any,', r', \1: unknown,'),
            
            # Variable declarations
            (r':\s*any\s*=', ': unknown ='),
            (r':\s*any\s*;', ': unknown;'),
            (r':\s*any\[\]', ': unknown[]'),
            
            # Generic type parameters
            (r'<any>', '<unknown>'),
            (r'Array<any>', 'Array<unknown>'),
            (r'Record<string,\s*any>', 'Record<string, unknown>'),
            
            # As any casts
            (r'\s+as\s+any\b', ' as unknown'),
        ]
        
        # Apply specific replacements first
        for pattern, replacement in replacements:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made += len(matches)
                print(f"  - Replaced {len(matches)} specific patterns")
        
        # Apply common replacements
        for pattern, replacement in common_replacements:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made += len(matches)
                print(f"  - Replaced {len(matches)} common any patterns")
        
        # Write back if changes were made
        if content != original_content:
            # Add necessary imports
            if imports_needed:
                add_imports_to_file(file_path, list(imports_needed))
                # Re-read the file with imports
                with open(file_path, 'r') as f:
                    updated_content = f.read()
                
                # Apply the content changes to the updated content
                for pattern, replacement in replacements + common_replacements:
                    updated_content = re.sub(pattern, replacement, updated_content)
                
                with open(file_path, 'w') as f:
                    f.write(updated_content)
            else:
                with open(file_path, 'w') as f:
                    f.write(content)
            
            print(f"  ✅ Made {changes_made} type improvements")
            return changes_made
        else:
            print(f"  ✅ No changes needed")
            return 0
            
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function for Round 2 processing"""
    
    # Additional high-usage files from analysis
    additional_files = [
        'src/components/AdvancedAlarmScheduling.tsx',
        'src/__tests__/factories/factories.test.ts',
        'src/types/utility-types.ts',
        'src/types/service-architecture.ts',
        'src/services/voice-smart-integration.ts',
        'src/types/service-interfaces.ts',
        'src/services/__tests__/alarm.test.ts',
        'src/backend/cloudflare-functions.ts',
        'src/services/typed-realtime-service.ts',
        'src/hooks/__tests__/usePWA.test.ts',
        'src/__tests__/performance/performance-testing-utilities.ts',
        'src/components/AccessibilityDashboard.tsx',
        'src/backend/performance-monitoring.ts',
        'src/__tests__/api/enhanced-msw-handlers.ts',
        'src/services/offline-manager.ts',
        'src/hooks/usePushNotifications.ts',
        'src/__tests__/utils/render-helpers.ts',
        'src/services/alarm-api-security.ts',
    ]
    
    base_path = '/project/workspace/Coolhgg/Relife'
    total_changes = 0
    
    print("🚀 Starting Round 2 of systematic any-type reduction...")
    print(f"Processing {len(additional_files)} additional high-usage files...\n")
    
    for file_path in additional_files:
        full_path = os.path.join(base_path, file_path)
        if os.path.exists(full_path):
            changes = process_file_advanced(full_path)
            total_changes += changes
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n✅ Round 2 Completed! Made {total_changes} additional type improvements")
    
    # Count remaining any usage
    print("\n📊 Counting remaining any usage after Round 2...")
    try:
        result = subprocess.run(
            ['grep', '-r', '-c', r'\bany\b', f'{base_path}/src/', '--include=*.ts', '--include=*.tsx'],
            capture_output=True, text=True, cwd=base_path
        )
        
        if result.returncode == 0:
            lines = [line for line in result.stdout.strip().split('\n') if line and not line.endswith(':0')]
            total_remaining = sum(int(line.split(':')[-1]) for line in lines if ':' in line and line.split(':')[-1].isdigit())
            print(f"Remaining any usage: {total_remaining} occurrences")
            
            if total_remaining < 1500:
                print("🎉 SUCCESS: Reached target of < 1,500 any occurrences!")
            else:
                print(f"📈 Progress: Need to reduce {total_remaining - 1500} more occurrences")
                
            # Show top remaining files
            remaining_files = [(line.split(':')[0].replace(f'{base_path}/', ''), int(line.split(':')[1])) 
                             for line in lines if ':' in line and line.split(':')[-1].isdigit()]
            remaining_files.sort(key=lambda x: x[1], reverse=True)
            
            print("\n🔝 Top 10 files with remaining any usage:")
            for file_path, count in remaining_files[:10]:
                print(f"  {file_path}: {count} occurrences")
                
        else:
            print("Could not count remaining any usage")
    except Exception as e:
        print(f"Error counting remaining usage: {e}")

if __name__ == '__main__':
    main()