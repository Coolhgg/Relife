#!/usr/bin/env python3
"""
Fix import statement corruption in TypeScript files.
Addresses incomplete imports, duplicates, and structural issues.
"""

import os
import re

def fix_import_corruption(content):
    """Fix various import corruption patterns."""
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Pattern 1: Incomplete import { followed by orphaned import
        if line.strip() == 'import {':
            # Look for orphaned import in next line
            if i + 1 < len(lines) and lines[i + 1].strip().startswith('import { '):
                orphaned_import = lines[i + 1].strip()
                # Extract component name from orphaned import
                match = re.search(r'import { (\w+) }', orphaned_import)
                if match:
                    component_name = match.group(1)
                    
                    # Find the end of the import block and collect imports
                    j = i + 2
                    import_items = [f'  {component_name},']
                    
                    while j < len(lines):
                        if '} from' in lines[j]:
                            # Extract the module path
                            module_match = re.search(r"} from ['\"]([^'\"]+)['\"];?", lines[j])
                            if module_match:
                                module_path = module_match.group(1)
                                # Add remaining imports before the closing brace
                                remaining_imports = lines[j].split('} from')[0].strip()
                                if remaining_imports and not remaining_imports.startswith('}'):
                                    import_items.append(f'  {remaining_imports}')
                                
                                # Rebuild the import statement
                                fixed_lines.append('import {')
                                fixed_lines.extend(import_items)
                                fixed_lines.append(f"}} from '{module_path}';")
                                i = j + 1
                                break
                        else:
                            # Add import item
                            clean_item = lines[j].strip()
                            if clean_item and not clean_item.startswith('//'):
                                import_items.append(f'  {clean_item}')
                        j += 1
                    else:
                        # Didn't find closing brace, keep original
                        fixed_lines.append(line)
                        i += 1
                else:
                    # Couldn't parse orphaned import, keep original
                    fixed_lines.append(line)
                    i += 1
            else:
                # No orphaned import found, keep original
                fixed_lines.append(line)
                i += 1
                
        # Pattern 2: Remove standalone duplicate imports that appear inside import blocks
        elif line.strip().startswith('import { ') and line.strip().endswith("'; // auto: restored by scout - verify"):
            # Skip this line as it's a duplicate
            i += 1
            
        # Pattern 3: Fix wrong import paths
        elif 'import { Progress } from ' in line and 'textarea' in line:
            fixed_lines.append("import { Progress } from './ui/progress';")
            i += 1
            
        # Pattern 4: Remove duplicate Textarea imports
        elif 'import { Textarea }' in line and i > 0:
            # Check if we already have a Textarea import
            has_textarea = any('import { Textarea }' in prev_line for prev_line in fixed_lines)
            if not has_textarea:
                # Clean up the import path
                if '@/components/ui/textarea' in line:
                    fixed_lines.append("import { Textarea } from './ui/textarea';")
                else:
                    fixed_lines.append(line)
            i += 1
            
        # Pattern 5: Remove auto-restoration comments
        elif '// auto: restored by scout - verify' in line:
            # Skip comment-only lines or clean the line if it has other content
            clean_line = line.replace('// auto: restored by scout - verify', '').strip()
            if clean_line:
                fixed_lines.append(clean_line)
            i += 1
            
        else:
            # Keep the line as-is
            fixed_lines.append(line)
            i += 1
    
    return '\n'.join(fixed_lines)

def fix_specific_file_patterns(file_path, content):
    """Apply file-specific fixes based on analysis."""
    
    if 'PersonaAnalyticsDashboard.tsx' in file_path:
        # Extract AnalyticsService import from inside recharts import block
        lines = content.split('\n')
        fixed_lines = []
        i = 0
        analytics_import_extracted = False
        
        while i < len(lines):
            line = lines[i]
            
            if line.strip() == 'import {' and not analytics_import_extracted:
                # Look for AnalyticsService import in the next few lines
                j = i + 1
                while j < len(lines) and '} from' not in lines[j]:
                    if 'import AnalyticsService' in lines[j]:
                        # Extract this import
                        fixed_lines.append(lines[j].strip())
                        analytics_import_extracted = True
                        # Remove this line from the import block
                        lines[j] = ''
                    j += 1
                # Add the import { line
                fixed_lines.append(line)
            else:
                if lines[i].strip():  # Skip empty lines we created
                    fixed_lines.append(line)
            i += 1
            
        content = '\n'.join(fixed_lines)
    
    return content

def main():
    """Fix import corruption in all affected files."""
    
    files = [
        # Components
        "src/components/NuclearModeBattle.tsx",
        "src/components/NuclearModeChallenge.tsx", 
        "src/components/PersonaAnalyticsDashboard.tsx",
        "src/components/PersonaDrivenUI.tsx",
        "src/components/PersonaFocusDashboard.tsx",
        "src/components/PushNotificationSettings.tsx",
        "src/components/SmartAlarmSettings.tsx",
        "src/components/SoundPreviewSystem.tsx",
        "src/components/SoundUploader.tsx",
        "src/components/SpecializedErrorBoundaries.tsx",
        "src/components/UpgradePrompt.tsx",
        "src/components/premium/PaymentFlow.tsx",
        "src/components/premium/PremiumAlarmFeatures.tsx",
        "src/components/premium/SubscriptionDashboard.tsx",
        "src/components/premium/SubscriptionManagement.tsx",
        "src/components/premium/SubscriptionPage.tsx",
        "src/components/ui/form.tsx",
        "src/components/user-testing/FeedbackModal.tsx",
        "src/components/user-testing/RedesignedFeedbackModal.tsx",
        
        # Contexts
        "src/contexts/FeatureAccessContext.tsx",
        "src/contexts/LanguageContext.tsx",
        
        # Hooks
        "src/hooks/useAccessibilityPreferences.ts",
        "src/hooks/useAnimations.ts",
        "src/hooks/useAudioLazyLoading.ts",
        "src/hooks/useCapacitor.ts",
        "src/hooks/usePushNotifications.ts",
        "src/hooks/useRealtime.tsx",
        "src/hooks/useSubscription.ts",
        
        # Services
        "src/services/advanced-conditions-helper.ts",
        "src/services/alarm-executor.ts",
        "src/services/base/BaseService.ts",
        "src/services/capacitor-enhanced.ts",
        "src/services/convertkit-service.ts",
        "src/services/email-campaigns.ts",
        "src/services/enhanced-alarm.ts",
        "src/services/enhanced-analytics.ts",
        "src/services/enhanced-battle.ts",
        "src/services/enhanced-performance-monitor.ts",
        "src/services/enhanced-subscription.ts",
        "src/services/enhanced-voice.ts",
        "src/services/notification.ts",
        "src/services/nuclear-mode.ts",
        "src/services/offline-gaming.ts",
        "src/services/revenue-analytics.ts",
        "src/services/scheduler-core.ts",
        "src/services/smart-alarm-scheduler.ts",
        "src/services/stripe-service.ts",
        "src/services/struggling-sam-api.ts",
        "src/services/subscription-service.ts",
        "src/services/subscription.ts",
        "src/services/theme-persistence.ts",
        "src/services/typed-realtime-service.ts",
        "src/services/voice-smart-integration.ts",
        
        # Utils
        "src/utils/http-client.ts"
    ]
    
    print("Fixing import statement corruption...")
    
    fixed_count = 0
    for file_path in files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Apply general fixes
                fixed_content = fix_import_corruption(content)
                
                # Apply file-specific fixes
                fixed_content = fix_specific_file_patterns(file_path, fixed_content)
                
                # Clean up extra newlines
                fixed_content = re.sub(r'\n{3,}', '\n\n', fixed_content)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                
                print(f"Fixed imports: {file_path}")
                fixed_count += 1
                
            except Exception as e:
                print(f"Error fixing {file_path}: {e}")
        else:
            print(f"File not found: {file_path}")
    
    print(f"\nCompleted! Fixed imports in {fixed_count} files.")

if __name__ == "__main__":
    main()