#!/usr/bin/env python3
"""
Fix import/export mismatches in the codebase.
Specifically handles underscore-prefixed imports and missing modules.
"""

import os
import re
import glob

def fix_import_exports_in_file(file_path):
    """Fix import/export issues in a single file."""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix underscore-prefixed imports - pattern: import { _Name } from '...'
        underscore_import_fixes = [
            # React imports
            (r"import.*?{.*?_ReactElement.*?}", lambda m: m.group(0).replace('_ReactElement', 'ReactElement')),
            
            # UI component imports
            (r"import.*?{.*?_CardHeader.*?}", lambda m: m.group(0).replace('_CardHeader', 'CardHeader')),
            (r"import.*?{.*?_CardTitle.*?}", lambda m: m.group(0).replace('_CardTitle', 'CardTitle')),
            (r"import.*?{.*?_Badge.*?}", lambda m: m.group(0).replace('_Badge', 'Badge')),
            (r"import.*?{.*?_Separator.*?}", lambda m: m.group(0).replace('_Separator', 'Separator')),
            (r"import.*?{.*?_AvatarImage.*?}", lambda m: m.group(0).replace('_AvatarImage', 'AvatarImage')),
            
            # Lucide React icons
            (r"import.*?{.*?_Zap.*?}", lambda m: m.group(0).replace('_Zap', 'Zap')),
            (r"import.*?{.*?_Settings.*?}", lambda m: m.group(0).replace('_Settings', 'Settings')),
            (r"import.*?{.*?_Download.*?}", lambda m: m.group(0).replace('_Download', 'Download')),
            (r"import.*?{.*?_Upload.*?}", lambda m: m.group(0).replace('_Upload', 'Upload')),
            (r"import.*?{.*?_X.*?}", lambda m: m.group(0).replace('_X', 'X')),
            (r"import.*?{.*?_Moon.*?}", lambda m: m.group(0).replace('_Moon', 'Moon')),
            (r"import.*?{.*?_Star.*?}", lambda m: m.group(0).replace('_Star', 'Star')),
            (r"import.*?{.*?_Award.*?}", lambda m: m.group(0).replace('_Award', 'Award')),
            (r"import.*?{.*?_ChevronRight.*?}", lambda m: m.group(0).replace('_ChevronRight', 'ChevronRight')),
            (r"import.*?{.*?_Eye.*?}", lambda m: m.group(0).replace('_Eye', 'Eye')),
            
            # Type imports
            (r"import.*?{.*?_VoiceMood.*?}", lambda m: m.group(0).replace('_VoiceMood', 'VoiceMood')),
            (r"import.*?{.*?_CustomSoundAssignment.*?}", lambda m: m.group(0).replace('_CustomSoundAssignment', 'CustomSoundAssignment')),
            (r"import.*?{.*?_ChallengeParticipant.*?}", lambda m: m.group(0).replace('_ChallengeParticipant', 'ChallengeParticipant')),
            (r"import.*?{.*?_ChallengeLeaderboard.*?}", lambda m: m.group(0).replace('_ChallengeLeaderboard', 'ChallengeLeaderboard')),
        ]
        
        for pattern, replacement_fn in underscore_import_fixes:
            content = re.sub(pattern, replacement_fn, content)
        
        # Fix specific import issues
        specific_fixes = [
            # Fix incorrect module paths
            (r"from ['\"]\./_NuclearModeSelector['\"]", "from './NuclearModeSelector'"),
            (r"from ['\"]\.\.\/services\/sound['\"]", "from '../services/sound-effects'"),
            (r"from ['\"]\.\.\/types\/persona['\"]", "from '../types'"),
            
            # Fix AlertTriangle import (should be Alert or AlertTitle)
            (r"AlertTriangle", "Alert"),
            
            # Fix Robot import (should be Bot)
            (r"Robot", "Bot"),
            
            # Fix PaymentMethodType (should be PaymentMethod)  
            (r"PaymentMethodType", "PaymentMethod"),
            
            # Fix SUBSCRIPTION_LIMITS (should be SubscriptionLimits)
            (r"SUBSCRIPTION_LIMITS", "SubscriptionLimits"),
        ]
        
        for pattern, replacement in specific_fixes:
            content = re.sub(pattern, replacement, content)
            
        # Remove imports for unavailable packages (commented out with explanation)
        unavailable_packages = [
            "@capacitor/app",
            "@capacitor/network", 
            "@capacitor-community/keep-awake",
            "@capacitor-community/background-mode",
            "@capacitor/badge",
            "@storybook/test",
            "idb"
        ]
        
        for package in unavailable_packages:
            # Comment out import lines for unavailable packages
            pattern = f"import.*?from ['\"]({re.escape(package)})['\"];?"
            content = re.sub(pattern, r"// import ... from '\1'; // Package not available in current setup", content)
        
        # Write back if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False
    
    return False

def main():
    """Main function to fix import/export issues across the codebase."""
    
    # Find all TypeScript/JavaScript files
    patterns = [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx'
    ]
    
    files_to_process = []
    for pattern in patterns:
        files_to_process.extend(glob.glob(pattern, recursive=True))
    
    # Remove test files and other excluded files for some fixes
    files_to_process = [f for f in files_to_process if 
                       not any(exclude in f for exclude in ['node_modules'])]
    
    print(f"Processing {len(files_to_process)} files for import/export fixes...")
    
    modified_count = 0
    for file_path in files_to_process:
        if fix_import_exports_in_file(file_path):
            modified_count += 1
            print(f"Modified: {file_path}")
    
    print(f"\nCompleted: {modified_count} files modified")

if __name__ == "__main__":
    main()