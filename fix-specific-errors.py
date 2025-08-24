#!/usr/bin/env python3
"""
Fix specific known syntax errors
"""
import os

def fix_custom_sound_theme_creator():
    """Fix specific issues in CustomSoundThemeCreator.tsx"""
    filepath = 'src/components/CustomSoundThemeCreator.tsx'
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix line 679: category.label} - {category.description 
        content = content.replace(
            '>category.label} - {category.description<',
            '>{category.label} - {category.description}<'
        )
        
        # Fix multiline function parameters
        content = content.replace(
            'onChange={(e: React.ChangeEvent<HTMLInputElement>\n) => onUpdate(',
            'onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate('
        )
        
        # Fix broken function parameter definitions
        content = content.replace(
            'onSoundsUpdated: (sounds: CustomSound[]\n) => void;',
            'onSoundsUpdated: (sounds: CustomSound[]) => void;'
        )
        
        content = content.replace(
            '}) => ({ userId, uploadedSounds, onSoundsUpdated }\n) => (',
            '}) => ({ userId, uploadedSounds, onSoundsUpdated }) => ('
        )
        
        # Fix broken onSoundUploaded and onSoundDeleted callbacks
        content = content.replace(
            'onSoundUploaded={(sound: any\n) => onSoundsUpdated([...uploadedSounds, sound])}',
            'onSoundUploaded={(sound: any) => onSoundsUpdated([...uploadedSounds, sound])}'
        )
        
        content = content.replace(
            'onSoundDeleted={(soundId: any\n) => \n        onSoundsUpdated(uploadedSounds.filter((s: any\n) => s.id !== soundId)))\n      }',
            'onSoundDeleted={(soundId: any) => onSoundsUpdated(uploadedSounds.filter((s: any) => s.id !== soundId))}'
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed specific issues in {filepath}")
        return True
        
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def fix_custom_theme_manager():
    """Fix specific issues in CustomThemeManager.tsx"""
    filepath = 'src/components/CustomThemeManager.tsx'
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix missing comma around line 189
        content = content.replace(
            'filteredThemes={filteredThemes}\n        selectedThemeIds={selectedThemeIds}',
            'filteredThemes={filteredThemes},\n        selectedThemeIds={selectedThemeIds}'
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed specific issues in {filepath}")
        return True
        
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    """Main function"""
    fixed_count = 0
    
    if fix_custom_sound_theme_creator():
        fixed_count += 1
    if fix_custom_theme_manager():
        fixed_count += 1
        
    print(f"Fixed {fixed_count} files with specific issues")

if __name__ == "__main__":
    main()