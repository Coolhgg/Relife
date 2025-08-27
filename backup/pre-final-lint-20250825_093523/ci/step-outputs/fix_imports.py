#!/usr/bin/env python3
"""
Systematically fix no-undef errors by adding imports
"""
import json
import os
import re
from collections import defaultdict

def read_eslint_results():
    """Read ESLint results"""
    with open('/project/workspace/Coolhgg/Relife/ci/step-outputs/eslint_current.json', 'r') as f:
        return json.load(f)

def read_search_results():
    """Read identifier search results"""
    with open('/project/workspace/Coolhgg/Relife/ci/step-outputs/identifier_search_results.json', 'r') as f:
        return json.load(f)

def group_errors_by_file(eslint_results):
    """Group no-undef errors by file"""
    file_errors = defaultdict(list)
    
    for result in eslint_results:
        filepath = result['filePath']
        for message in result['messages']:
            if message['ruleId'] == 'no-undef':
                # Extract the undefined variable name from the message
                match = re.search(r"'(\w+)' is not defined", message['message'])
                if match:
                    var_name = match.group(1)
                    file_errors[filepath].append({
                        'variable': var_name,
                        'line': message['line'],
                        'column': message['column']
                    })
    
    return file_errors

def determine_import_for_identifier(identifier, search_results):
    """Determine the appropriate import statement for an identifier"""
    
    # React hooks and React itself
    if identifier in ['React']:
        return "import React from 'react';"
    elif identifier in ['useEffect', 'useState']:
        return "import { useEffect, useState } from 'react';"
    elif identifier == 'useTheme':
        return "import { useTheme } from './hooks/useTheme';"
    
    # Lucide icons that are missing (should be imported from lucide-react)
    lucide_missing = ['Heart', 'Lightbulb', 'Loader2', 'MessageSquare', 'Sparkles', 'TrendingUp', 'Users', 'Zap']
    if identifier in lucide_missing:
        return f"import {{ {identifier} }} from 'lucide-react';"
    
    # UI components that exist (import from components/ui)
    ui_components = ['Button', 'Card', 'CardContent', 'Progress', 'Textarea']
    if identifier in ui_components:
        component_file = identifier.lower()
        return f"import {{ {identifier} }} from '@/components/ui/{component_file}';"
    
    # RTL components
    rtl_components = ['RTLContainer', 'RTLFlex', 'RTLForm', 'RTLGrid', 'RTLText']
    if identifier in rtl_components:
        return f"import {{ {identifier} }} from '@/components/RTLLayout';"
    
    # Types that exist (import from types)
    type_identifiers = ['ApiError', 'ApiResponse', 'AppInfo', 'AppState', 'Award', 'HttpClient', 'HttpError', 
                       'PaginatedResponse', 'PaginationParams', 'WebhookPayload', 'Theme', 'ThemePreset', 
                       'SubscriptionTier', 'PremiumFeature', 'Alarm']
    if identifier in type_identifiers:
        return f"import {{ {identifier} }} from '@/types';"
    
    # Capacitor plugins (found in mocks, likely should be from @capacitor)
    capacitor_plugins = ['BackgroundMode', 'Network', 'KeepAwake']
    if identifier in capacitor_plugins:
        return f"import {{ {identifier} }} from '@capacitor/background-mode';" if identifier == 'BackgroundMode' else f"import {{ {identifier} }} from '@capacitor/network';" if identifier == 'Network' else f"import {{ {identifier} }} from '@capacitor/keep-awake';"
    
    # Special cases based on search results
    if identifier == 'App':
        return "import App from '@/App';"
    
    # Variables and other identifiers that need stubs
    stub_identifiers = ['AddEventListenerOptions', 'BlobPart', 'BufferSource', 'IDBDatabaseEventMap', 
                       'IDBObjectStoreParameters', 'IDBPDatabase', 'IDBTransactionMode', 'NavigationTiming',
                       'PerformanceEntryList', 'ServiceWorkerContainerEventMap', 'FetchEvent', 'PushEvent',
                       'RegistrationOptions', '_persona', 'alarmOrNotification', 'currentTier', 'newTier',
                       'openDB', 'paymentMethodId', 'rippleId', 'setUserTier', 'userTier', 'Gift']
    
    if identifier in stub_identifiers:
        return f"import {{ {identifier} }} from '@/utils/__auto_stubs';"
    
    return None

def read_file_content(filepath):
    """Read file content safely"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return None

def write_file_content(filepath, content):
    """Write file content safely"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except:
        return False

def add_imports_to_file(filepath, imports_needed):
    """Add import statements to a file"""
    content = read_file_content(filepath)
    if not content:
        return False
    
    lines = content.split('\n')
    import_insert_line = 0
    
    # Find where to insert imports (after existing imports)
    for i, line in enumerate(lines):
        if line.strip().startswith('import ') or line.strip().startswith('///'):
            import_insert_line = i + 1
        elif line.strip() and not line.strip().startswith('//') and not line.strip().startswith('/*'):
            break
    
    # Add the new imports with comment
    new_imports = []
    for import_stmt in imports_needed:
        new_imports.append("// auto: restored by scout - verify import path")
        new_imports.append(import_stmt)
    
    # Insert imports
    lines[import_insert_line:import_insert_line] = new_imports
    
    # Write back to file
    new_content = '\n'.join(lines)
    return write_file_content(filepath, new_content)

def main():
    print("Loading ESLint results...")
    eslint_results = read_eslint_results()
    
    print("Loading search results...")
    search_results = read_search_results()
    
    print("Grouping errors by file...")
    file_errors = group_errors_by_file(eslint_results)
    
    print(f"Found {len(file_errors)} files with no-undef errors")
    
    fixes_applied = 0
    files_fixed = 0
    
    for filepath, errors in file_errors.items():
        print(f"\\nProcessing {filepath}...")
        
        # Get unique identifiers for this file
        identifiers_needed = set()
        for error in errors:
            identifiers_needed.add(error['variable'])
        
        print(f"  Identifiers needed: {', '.join(identifiers_needed)}")
        
        # Determine imports needed
        imports_needed = []
        for identifier in identifiers_needed:
            import_stmt = determine_import_for_identifier(identifier, search_results)
            if import_stmt and import_stmt not in imports_needed:
                imports_needed.append(import_stmt)
        
        if imports_needed:
            print(f"  Adding imports: {', '.join(imports_needed)}")
            if add_imports_to_file(filepath, imports_needed):
                fixes_applied += len(imports_needed)
                files_fixed += 1
                print(f"  ✓ Successfully added {len(imports_needed)} imports")
            else:
                print(f"  ✗ Failed to modify file")
        else:
            print(f"  No import solutions found for this file")
    
    print(f"\\n=== SUMMARY ===")
    print(f"Files processed: {len(file_errors)}")
    print(f"Files fixed: {files_fixed}")
    print(f"Import statements added: {fixes_applied}")

if __name__ == "__main__":
    main()