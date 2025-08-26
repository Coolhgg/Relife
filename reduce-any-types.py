#!/usr/bin/env python3
"""
Script to systematically reduce any-type usage in TypeScript files
Focuses on the highest impact files identified in the analysis
"""

import os
import re
import subprocess

# Define type replacements for common patterns
TYPE_REPLACEMENTS = [
    # Mock data and test patterns
    (r'Record<string,\s*any\[\]>', 'MockDataStore'),
    (r':\s*any\[\]', ': MockDataRecord[]'),
    (r'\.find\(\s*\(\s*item:\s*any\s*\)', '.find((item: MockDataRecord)'),
    (r'\.sort\(\s*\(\s*a:\s*any,\s*b:\s*any\s*\)', '.sort((a: MockDataRecord, b: MockDataRecord)'),
    (r'user:\s*null\s+as\s+any', 'user: null'),
    (r'session:\s*null\s+as\s+any', 'session: null'),
    
    # Function parameters with any
    (r'\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r'(\1: unknown)'),
    (r'\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any,', r'(\1: unknown,'),
    (r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r', \1: unknown)'),
    (r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any,', r', \1: unknown,'),
    
    # Event handler patterns
    (r'\.fn\(\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r'.fn((\1: unknown)'),
    (r'MockedFunction<\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r'MockedFunction<(\1: unknown)'),
    
    # Analytics and tracking patterns
    (r'track:\s*[^,]*\(\s*[^,]*,\s*properties\?\s*:\s*any\s*\)', 'track: jest.MockedFunction<(event: string, properties?: AnalyticsProperties) => void>'),
    (r'identify:\s*[^,]*\(\s*[^,]*,\s*traits\?\s*:\s*any\s*\)', 'identify: jest.MockedFunction<(userId: string, traits?: AnalyticsTraits) => void>'),
    (r'page:\s*[^,]*\(\s*[^,]*,\s*properties\?\s*:\s*any\s*\)', 'page: jest.MockedFunction<(name: string, properties?: AnalyticsProperties) => void>'),
    
    # Service method patterns
    (r'createAlarm:\s*[^,]*\(\s*alarm:\s*any\s*\)', 'createAlarm: jest.MockedFunction<(alarm: AlarmData) => Promise<AlarmData>>'),
    (r'updateAlarm:\s*[^,]*\(\s*[^,]*,\s*updates:\s*any\s*\)', 'updateAlarm: jest.MockedFunction<(id: string, updates: Partial<AlarmData>) => Promise<AlarmData>>'),
    (r'getAlarms:\s*[^,]*\(\s*\)\s*=>\s*Promise<any\[\]>', 'getAlarms: jest.MockedFunction<() => Promise<AlarmData[]>>'),
    (r'getAlarm:\s*[^,]*\(\s*[^,]*\)\s*=>\s*Promise<any\s*\|\s*null>', 'getAlarm: jest.MockedFunction<(id: string) => Promise<AlarmData | null>>'),
    
    # Battle and gaming patterns
    (r'createBattle:\s*[^,]*\(\s*_config:\s*any\s*\)', 'createBattle: jest.MockedFunction<(config: BattleConfig) => Promise<Battle>>'),
    (r'getBattles:\s*[^,]*\(\s*[^,]*\)\s*=>\s*Promise<any\[\]>', 'getBattles: jest.MockedFunction<(status?: string) => Promise<Battle[]>>'),
    (r'getBattle:\s*[^,]*\(\s*[^,]*\)\s*=>\s*Promise<any\s*\|\s*null>', 'getBattle: jest.MockedFunction<(id: string) => Promise<Battle | null>>'),
    
    # Reward system patterns
    (r'conditions:\s*any\[\]', 'conditions: RewardCondition[]'),
    (r'createReward\([^)]*\):\s*Promise<any>', 'createReward(reward: Omit<RewardData, "id" | "created_at" | "updated_at">): Promise<RewardData>'),
    (r'getUserRewards\([^)]*\):\s*Promise<any\[\]>', 'getUserRewards(userId: string): Promise<UserReward[]>'),
    (r'checkAchievements\([^)]*\):\s*Promise<any\[\]>', 'checkAchievements(userId: string, context: string, data: Record<string, unknown>): Promise<RewardData[]>'),
    (r'getPointHistory\([^)]*\):\s*Promise<any\[\]>', 'getPointHistory(userId: string, limit?: number): Promise<PointTransaction[]>'),
    
    # Generic service patterns
    (r':\s*Array<\{\s*method:\s*string;\s*args:\s*any\[\];', ': Array<{ method: string; args: unknown[];'),
    (r'logCall\(\s*method:\s*string,\s*args:\s*any\[\]\)', 'logCall(method: string, args: unknown[])'),
    (r'getCallHistory\(\):\s*Array<\{\s*method:\s*string;\s*args:\s*any\[\];', 'getCallHistory(): Array<{ method: string; args: unknown[];'),
]

def add_imports_to_file(file_path, imports_needed):
    """Add necessary imports to a TypeScript file"""
    print(f"Adding imports to {file_path}: {', '.join(imports_needed)}")
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Find existing imports or add at the top
        import_statement = f"import {{\n  {', '.join(sorted(imports_needed))}\n}} from '../../types/common-types';\n"
        
        # Check if file already has imports from common-types
        if 'from \'../../types/common-types\'' in content:
            # Update existing import
            pattern = r'import\s*\{([^}]+)\}\s*from\s*[\'"]\.\.\/\.\.\/types\/common-types[\'"];?'
            match = re.search(pattern, content)
            if match:
                existing_imports = [imp.strip() for imp in match.group(1).split(',')]
                all_imports = sorted(set(existing_imports + imports_needed))
                new_import = f"import {{\n  {', '.join(all_imports)}\n}} from '../../types/common-types';"
                content = re.sub(pattern, new_import, content)
            else:
                # Add new import after existing imports
                content = import_statement + content
        else:
            # Add import at the top after first comment block
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
                    break
                elif stripped.startswith('//') and not in_comment:
                    insert_pos = i + 1
                elif stripped and not in_comment:
                    break
            
            lines.insert(insert_pos, import_statement)
            content = '\n'.join(lines)
        
        with open(file_path, 'w') as f:
            f.write(content)
            
        return True
    except Exception as e:
        print(f"Error adding imports to {file_path}: {e}")
        return False

def process_file(file_path):
    """Process a single file to replace any types"""
    print(f"Processing: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original_content = content
        imports_needed = set()
        changes_made = 0
        
        # Apply type replacements
        for pattern, replacement in TYPE_REPLACEMENTS:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made += len(matches)
                print(f"  - Replaced {len(matches)} instances of pattern: {pattern[:50]}...")
                
                # Determine which imports are needed based on replacement
                if 'MockDataStore' in replacement or 'MockDataRecord' in replacement:
                    imports_needed.update(['MockDataStore', 'MockDataRecord'])
                if 'AnalyticsProperties' in replacement or 'AnalyticsTraits' in replacement:
                    imports_needed.update(['AnalyticsProperties', 'AnalyticsTraits'])
                if 'AlarmData' in replacement:
                    imports_needed.add('AlarmData')
                if 'BattleConfig' in replacement or 'Battle' in replacement:
                    imports_needed.update(['BattleConfig', 'Battle'])
                if 'RewardCondition' in replacement or 'RewardData' in replacement:
                    imports_needed.update(['RewardCondition', 'RewardData', 'UserReward', 'PointTransaction'])
        
        # Additional specific replacements for common any usage patterns
        additional_replacements = [
            # Generic any parameters
            (r'\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)\s*=>', r'(\1: unknown) =>'),
            (r'function\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)', r'function(\1: unknown)'),
            
            # Array of any
            (r':\s*any\[\](?!\s*=)', ': unknown[]'),
            
            # Object with any values
            (r':\s*Record<string,\s*any>', ': Record<string, unknown>'),
            
            # As any casts
            (r'\s+as\s+any\b', ' as unknown'),
        ]
        
        for pattern, replacement in additional_replacements:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made += len(matches)
                print(f"  - Replaced {len(matches)} additional any patterns")
        
        # Write back if changes were made
        if content != original_content:
            # Add necessary imports
            if imports_needed:
                add_imports_to_file(file_path, list(imports_needed))
                # Re-read the file with imports
                with open(file_path, 'r') as f:
                    content = f.read()
            
            # Apply the content changes
            for pattern, replacement in TYPE_REPLACEMENTS:
                content = re.sub(pattern, replacement, content)
            
            for pattern, replacement in additional_replacements:
                content = re.sub(pattern, replacement, content)
            
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
    """Main function to process high-usage any type files"""
    
    # Files with highest any usage (from our analysis)
    high_usage_files = [
        'src/__tests__/mocks/supabase.mock.ts',
        'src/__tests__/providers/service-providers.tsx',
        'src/types/domain-service-interfaces.ts',
        'src/types/realtime-service.ts',
        'src/services/advanced-analytics.ts',
        'src/__tests__/setup/after-env-setup.ts',
        'src/__tests__/mocks/enhanced-service-mocks.ts',
        'src/__tests__/factories/factories.test.ts',
        'src/__tests__/mocks/platform-service-mocks.ts'
    ]
    
    base_path = '/project/workspace/Coolhgg/Relife'
    total_changes = 0
    
    print("🚀 Starting systematic any-type reduction...")
    print(f"Processing {len(high_usage_files)} high-usage files...\n")
    
    for file_path in high_usage_files:
        full_path = os.path.join(base_path, file_path)
        if os.path.exists(full_path):
            changes = process_file(full_path)
            total_changes += changes
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n✅ Completed! Made {total_changes} total type improvements")
    
    # Count remaining any usage
    print("\n📊 Counting remaining any usage...")
    try:
        result = subprocess.run(
            ['grep', '-r', '-c', r'\bany\b', f'{base_path}/src/', '--include=*.ts', '--include=*.tsx'],
            capture_output=True, text=True, cwd=base_path
        )
        
        if result.returncode == 0:
            lines = [line for line in result.stdout.strip().split('\n') if line and not line.endswith(':0')]
            total_remaining = sum(int(line.split(':')[-1]) for line in lines if ':' in line)
            print(f"Remaining any usage: {total_remaining} occurrences")
            
            if total_remaining < 1500:
                print("🎉 SUCCESS: Reached target of < 1,500 any occurrences!")
            else:
                print(f"📈 Progress: Need to reduce {total_remaining - 1500} more occurrences")
        else:
            print("Could not count remaining any usage")
    except Exception as e:
        print(f"Error counting remaining usage: {e}")

if __name__ == '__main__':
    main()