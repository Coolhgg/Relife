#!/usr/bin/env python3
"""
Fix syntax errors in TypeScript files
"""
import os
import re

def fix_file(filepath):
    """Fix common syntax patterns in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: Fix broken array spread syntax
        # setCustomSounds((prev: any\n) => [ // auto: implicit anyresult.customSound!, ...prev]);
        content = re.sub(
            r'setCustomSounds\(\(prev: any\n\) => \[ // auto: implicit anyresult\.customSound!,', 
            'setCustomSounds((prev: any) => [result.customSound!,', 
            content
        )
        
        # Pattern 2: Fix broken map functions
        # .map((condition: any\n) => ({\n              <div
        content = re.sub(
            r'\.map\(\(([^:]+): any\n\) => \(\{\n\s*<div',
            r'.map((\1: any) => (\n        <div',
            content
        )
        
        # Pattern 3: Fix comment fragments in setters
        content = re.sub(
            r'setSelectedThemes\(\(prev: any\n\) => \{ // auto: implicit any',
            'setSelectedThemes((prev: any) => {',
            content
        )
        
        # Pattern 4: Fix general comment fragments mixed with code
        content = re.sub(
            r'// auto: implicit any([a-zA-Z])',
            r'// auto: implicit any\n\1',
            content
        )
        
        # Pattern 5: Fix broken JSX attributes
        content = re.sub(
            r'(\w+)=\{([^}]+)\}\s*>\s*\{([^>]+)\}\s*<',
            r'\1={\2}>\3<',
            content
        )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed syntax issues in {filepath}")
            return True
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False
    
    return False

def main():
    """Main function to fix syntax errors in key files"""
    files_to_fix = [
        'src/components/AlarmForm.tsx',
        'src/components/CustomSoundThemeCreator.tsx', 
        'src/components/CustomThemeManager.tsx',
        'src/components/SettingsPage.tsx',
        'src/components/SignUpForm.tsx',
        'src/components/SmartAlarmDashboard.tsx',
        'src/components/premium/EnhancedUpgradePrompt.tsx',
        'src/components/premium/PremiumFeaturePreview.tsx',
        'src/components/ui/sidebar.tsx',
        'src/components/user-testing/BetaTestingProgram.tsx',
        'src/hooks/useTheme.tsx',
        'src/services/revenue-analytics.ts',
        'src/services/subscription-service.ts',
        'src/services/voice-ai-enhanced.ts'
    ]
    
    fixed_count = 0
    for filepath in files_to_fix:
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed_count += 1
        else:
            print(f"File not found: {filepath}")
    
    print(f"\nFixed syntax errors in {fixed_count} files")

if __name__ == "__main__":
    main()