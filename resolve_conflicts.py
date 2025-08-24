#!/usr/bin/env python3

import os
import re
import glob

def resolve_conflict_file(file_path):
    """Resolve merge conflicts in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<<<<<<< HEAD' not in content:
        return False  # No conflicts in this file
    
    original_content = content
    
    # Pattern 1: Resolve global comment conflicts - prefer main version (cleaner)
    # Remove global comments from HEAD version
    pattern1 = r'<<<<<<< HEAD\n/\* global \w+ \*/\n[^\n]*\n=======\n([^\n]*)\n>>>>>>> origin/main'
    content = re.sub(pattern1, r'\1', content)
    
    # Pattern 2: Resolve duplicate React import conflicts - prefer main version
    pattern2 = r'<<<<<<< HEAD\n[^\n]*// auto: added missing React import[^\n]*\n=======\n([^\n]*)\n>>>>>>> origin/main'
    content = re.sub(pattern2, r'\1', content)
    
    # Pattern 3: Resolve JSX namespace conflicts - prefer main version
    pattern3 = r'<<<<<<< HEAD\n[^\n]*JSX[^\n]*\n=======\n([^\n]*)\n>>>>>>> origin/main'  
    content = re.sub(pattern3, r'\1', content)
    
    # Pattern 4: For most other conflicts, prefer the lint branch (HEAD) changes
    # But remove auto-generated comments
    pattern4 = r'<<<<<<< HEAD\n((?:(?!>>>>>>>).*\n)*?)=======\n(?:(?!>>>>>>>).*\n)*?>>>>>>> origin/main'
    
    def clean_head_content(match):
        head_content = match.group(1)
        # Remove auto-generated comments but keep the actual changes
        head_content = re.sub(r'\s*// auto: [^\n]*', '', head_content)
        head_content = re.sub(r'\s*/\* global [^*]* \*/', '', head_content)
        return head_content.rstrip() + '\n'
    
    content = re.sub(pattern4, clean_head_content, content, flags=re.DOTALL)
    
    # Final cleanup - remove any remaining conflict markers
    content = re.sub(r'<<<<<<< HEAD\n', '', content)
    content = re.sub(r'=======\n', '', content) 
    content = re.sub(r'>>>>>>> origin/main\n?', '', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    """Resolve all merge conflicts automatically"""
    # Get list of conflicted files
    conflicted_files = [
        'src/App.tsx',
        'src/components/AchievementBadges.tsx',
        'src/components/AlarmForm.tsx', 
        'src/components/AlarmList.tsx',
        'src/components/CustomThemeManager.tsx',
        'src/components/Dashboard.tsx',
        'src/components/EnhancedDashboard.tsx',
        'src/components/MobileAlarmCard.tsx',
        'src/components/NuclearModeBattle.tsx',
        'src/components/SmartAlarmDashboard.tsx',
        'src/components/SoundUploader.tsx',
        'src/components/VoiceCloning.tsx',
        'src/components/VoiceSelector.tsx',
        'src/components/animations/MicroInteractions.tsx',
        'src/components/premium/PremiumVoiceFeatures.tsx',
        'src/components/ui/alert.tsx',
        'src/components/ui/badge.tsx',
        'src/components/ui/button.tsx',
        'src/components/ui/toggle.tsx',
        'src/components/user-testing/RedesignedFeedbackWidget.tsx',
        'src/hooks/useAdvancedAlarms.ts',
        'src/hooks/useDeviceCapabilities.tsx',
        'src/hooks/useEnhancedSmartAlarms.ts',
        'src/services/alarm-stub.ts',
        'src/services/offline-manager.ts',
        'src/stories/components/AlarmForm.stories.tsx',
        'src/stories/components/Dashboard.stories.tsx',
        'src/stories/ui/Button.stories.tsx',
        'src/utils/performance-alerts.tsx'
    ]
    
    resolved_count = 0
    
    for file_path in conflicted_files:
        if os.path.isfile(file_path):
            if resolve_conflict_file(file_path):
                print(f"Resolved conflicts in: {file_path}")
                resolved_count += 1
        else:
            print(f"File not found: {file_path}")
    
    print(f"\nResolved conflicts in {resolved_count} files.")
    
    if resolved_count > 0:
        print("\nNext steps:")
        print("1. Review the resolved files")
        print("2. Run 'git add .' to stage resolved files") 
        print("3. Run 'git commit' to complete the merge")

if __name__ == "__main__":
    main()