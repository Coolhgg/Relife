#!/usr/bin/env python3
"""
Fix remaining specific syntax errors after Prettier run.
"""

import re
import os
from pathlib import Path


# Define specific fixes for each file based on the error patterns
SPECIFIC_FIXES = {
    'src/__tests__/factories/support-factories.ts': [
        # Fix: `: AppSettings => ;` should be complete
        ('): AppSettings => ;', '): AppSettings =>'),
    ],
    
    'src/components/AlarmForm.tsx': [
        # Fix missing closing in setAlarm call - this looks like a formatting issue
        # Need to look at the actual context
    ],
    
    'src/components/CustomSoundThemeCreator.tsx': [
        # Fix: malformed arrow function in filter - missing closing parenthesis
        ('(s: any\n) => s.id !== soundId)))', '(s: any) => s.id !== soundId))'),
    ],
    
    'src/components/CustomThemeManager.tsx': [
        # Fix: malformed auto comment - should be completed
        (') => [ // auto: implicit any theme, ...prev]);', ') => [theme, ...prev]);'),
    ],
    
    'src/components/premium/EnhancedUpgradePrompt.tsx': [
        # Fix: missing closing parenthesis for setCurrentTestimonial
        ('setCurrentTestimonial((prev: any\n) => (prev + 1) % 100', 'setCurrentTestimonial((prev: any) => (prev + 1) % testimonials.length)'),
    ],
    
    'src/components/premium/PremiumFeaturePreview.tsx': [
        # Fix: missing closing parenthesis for setNuclearIntensity  
        ('setNuclearIntensity((prev: any\n) => (prev + 1) % 100', 'setNuclearIntensity((prev: any) => (prev + 1) % 100)'),
    ],
    
    'src/components/SettingsPage.tsx': [
        # Fix: missing closing brace
        ("onKeyDown={(e: any\n) => handleKeyDown(e, 'cloudsync'))", "onKeyDown={(e: any) => handleKeyDown(e, 'cloudsync')}"),
    ],
    
    'src/components/SignUpForm.tsx': [
        # Fix: missing closing brace
        ("onChange={(e: any\n) => handleInputChange('name', e.target.value))", "onChange={(e: any) => handleInputChange('name', e.target.value)}"),
    ],
    
    'src/components/SmartAlarmDashboard.tsx': [
        # Fix: .map should return JSX, not assignment
        ('.map((condition: any\n) => ({\n                              <div', '.map((condition: any) => (\n                              <div'),
    ],
    
    'src/components/ui/sidebar.tsx': [
        # Fix: incomplete expressions
        ('return isMobile ? setOpenMobile((open: any\n) => !) : setOpen((open: any\n) => !);', 
         'return isMobile ? setOpenMobile((open: any) => !open) : setOpen((open: any) => !open);'),
    ],
    
    'src/components/user-testing/BetaTestingProgram.tsx': [
        # Fix: malformed auto comment
        (') => n // auto: implicit any[0])', ') => n[0])'),
    ],
    
    'src/hooks/__tests__/useAdvancedAlarms.test.ts': [
        # Fix: extra closing brace
        ('  });\n})\n});', '  });\n});'),
    ],
    
    'src/hooks/useTheme.tsx': [
        # Fix: incomplete expression
        ('return availableThemes.filter((theme: any\n) => !).slice(0, 3);', 
         'return availableThemes.filter((theme: any) => !theme.isDefault).slice(0, 3);'),
    ],
    
    'src/services/revenue-analytics.ts': [
        # Fix: missing class context - this is likely a method that needs proper indentation
        # Will need to examine the actual file
    ],
    
    'src/services/subscription-service.ts': [
        # Fix: optional chaining formatting issue
        ('return (\n      data?\n      .map((item: any', 'return (\n      data?.map((item: any'),
    ],
    
    'src/services/voice-ai-enhanced.ts': [
        # Fix: optional chaining formatting issue  
        ('const learningData =\n        data?\n        .map((row: any', 'const learningData =\n        data?.map((row: any'),
    ],
    
    'src/types/utils.ts': [
        # Fix: incomplete function declaration
        ('(id: string): Branded<string, B> => ;', '(id: string): Branded<string, B> =>'),
    ],
}


def apply_file_specific_fixes(file_path: Path, content: str) -> tuple[str, list[dict]]:
    """Apply specific fixes for a file."""
    fixes = []
    fixed_content = content
    file_key = str(file_path.relative_to(file_path.parent.parent.parent.parent))
    
    if file_key in SPECIFIC_FIXES:
        for old_pattern, new_pattern in SPECIFIC_FIXES[file_key]:
            if old_pattern in fixed_content:
                fixed_content = fixed_content.replace(old_pattern, new_pattern)
                fixes.append({
                    'type': 'specific_file_fix',
                    'pattern': old_pattern[:50] + '...' if len(old_pattern) > 50 else old_pattern,
                    'description': f'Applied specific fix for {file_key}'
                })
    
    return fixed_content, fixes


def apply_general_syntax_fixes(content: str) -> tuple[str, list[dict]]:
    """Apply general syntax fixes."""
    fixes = []
    fixed_content = content
    
    # Fix 1: Optional chaining formatting issues
    # Pattern: `data?\n      .map(` should be `data?.map(`
    pattern = r'(\w+\?)\s*\n\s+(\.\w+\()'
    if re.search(pattern, fixed_content):
        fixed_content = re.sub(pattern, r'\1\2', fixed_content)
        fixes.append({
            'type': 'optional_chaining_fix',
            'description': 'Fixed optional chaining formatting'
        })
    
    # Fix 2: Incomplete arrow functions ending with `) => ;`
    pattern = r'\)\s*=>\s*;'
    if re.search(pattern, fixed_content):
        fixed_content = re.sub(pattern, ') => { /* TODO: implement */ }', fixed_content)
        fixes.append({
            'type': 'incomplete_arrow_fix',
            'description': 'Fixed incomplete arrow function'
        })
    
    # Fix 3: Malformed auto comments
    # Pattern: `// auto: implicit any theme` should be removed from array context
    pattern = r'//\s*auto:\s*implicit\s*any\s+(\w+)'
    if re.search(pattern, fixed_content):
        fixed_content = re.sub(pattern, r'\1', fixed_content)
        fixes.append({
            'type': 'auto_comment_fix', 
            'description': 'Fixed malformed auto comment'
        })
    
    # Fix 4: Expressions ending with `) => !);` should be `) => !value);`
    pattern = r'\)\s*=>\s*!\s*\);'
    if re.search(pattern, fixed_content):
        fixed_content = re.sub(pattern, ') => !open);', fixed_content)
        fixes.append({
            'type': 'incomplete_negation_fix',
            'description': 'Fixed incomplete negation expression'
        })
    
    # Fix 5: Array access patterns broken by auto comments
    pattern = r'(\w+)\s*//\s*auto:\s*implicit\s*any\[(\d+)\]\)'
    if re.search(pattern, fixed_content):
        fixed_content = re.sub(pattern, r'\1[\2])', fixed_content)
        fixes.append({
            'type': 'array_access_fix',
            'description': 'Fixed array access broken by auto comment'
        })
    
    return fixed_content, fixes


def process_file(file_path: Path) -> dict:
    """Process a single file and apply fixes."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return {
            'file': str(file_path),
            'error': f"Failed to read file: {e}",
            'fixes': []
        }
    
    original_content = content
    
    # Apply general fixes
    fixed_content, general_fixes = apply_general_syntax_fixes(content)
    
    # Apply file-specific fixes
    fixed_content, specific_fixes = apply_file_specific_fixes(file_path, fixed_content)
    
    all_fixes = general_fixes + specific_fixes
    
    # Only write if changes were made
    if fixed_content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
        except Exception as e:
            return {
                'file': str(file_path),
                'error': f"Failed to write file: {e}",
                'fixes': all_fixes
            }
    
    return {
        'file': str(file_path),
        'fixes': all_fixes,
        'changed': fixed_content != original_content
    }


def main():
    """Main function."""
    # Files with remaining syntax errors
    error_files = [
        'src/__tests__/factories/support-factories.ts',
        'src/components/AlarmForm.tsx',
        'src/components/CustomSoundThemeCreator.tsx',
        'src/components/CustomThemeManager.tsx',
        'src/components/premium/EnhancedUpgradePrompt.tsx',
        'src/components/premium/PremiumFeaturePreview.tsx',
        'src/components/SettingsPage.tsx',
        'src/components/SignUpForm.tsx',
        'src/components/SmartAlarmDashboard.tsx',
        'src/components/ui/sidebar.tsx',
        'src/components/user-testing/BetaTestingProgram.tsx',
        'src/hooks/__tests__/useAdvancedAlarms.test.ts',
        'src/hooks/useTheme.tsx',
        'src/services/revenue-analytics.ts',
        'src/services/subscription-service.ts',
        'src/services/voice-ai-enhanced.ts',
        'src/types/utils.ts'
    ]
    
    base_dir = Path('/project/workspace/Coolhgg/Relife')
    
    results = {
        'total_files': len(error_files),
        'files_processed': 0,
        'files_with_fixes': 0,
        'total_fixes': 0,
        'files': []
    }
    
    for file_rel_path in error_files:
        file_path = base_dir / file_rel_path
        if file_path.exists() and file_path.is_file():
            result = process_file(file_path)
            results['files'].append(result)
            results['files_processed'] += 1
            
            if result.get('fixes'):
                results['files_with_fixes'] += 1
                results['total_fixes'] += len(result['fixes'])
                print(f"Fixed {len(result['fixes'])} issues in {file_rel_path}")
    
    print(f"\nSummary:")
    print(f"- Files processed: {results['files_processed']}")
    print(f"- Files with fixes: {results['files_with_fixes']}")
    print(f"- Total fixes applied: {results['total_fixes']}")


if __name__ == '__main__':
    main()