#!/usr/bin/env python3
"""
Search for existing exports of undefined identifiers
"""
import subprocess
import os
import json
import re

def run_command(cmd):
    """Run a command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd='/project/workspace/Coolhgg/Relife')
        return result.stdout.strip()
    except:
        return ""

# List of identifiers to search for
identifiers = [
    'AddEventListenerOptions', 'Alarm', 'ApiError', 'ApiResponse', 'App', 'AppInfo', 'AppState', 'Award',
    'B', 'BackgroundMode', 'Badge', 'BlobPart', 'BufferSource', 'Bug', 'Button', 'Calendar', 'Card',
    'CardContent', 'ConnectionStatus', 'Console', 'D1Database', 'DBSchema', 'DurableObjectNamespace',
    'ExtendableEvent', 'FeatureAccess', 'FetchEvent', 'Gift', 'Heart', 'HttpClient', 'HttpError',
    'IDBDatabaseEventMap', 'IDBObjectStoreParameters', 'IDBPDatabase', 'IDBTransactionMode',
    'KVNamespace', 'KeepAwake', 'Lightbulb', 'Loader2', 'Mail', 'MessageSquare', 'NavigationTiming',
    'Network', 'NotificationEvent', 'NotificationPreferences', 'PaginatedResponse', 'PaginationParams',
    'PerformanceEntryList', 'PremiumFeature', 'Progress', 'PushEvent', 'RTLContainer', 'RTLFlex',
    'RTLForm', 'RTLGrid', 'RTLText', 'React', 'RealtimeServiceConfig', 'RedesignedFeedbackModal',
    'RegistrationOptions', 'Send', 'ServiceWorkerContainerEventMap', 'Sparkles', 'SpeechRecognition',
    'SubscriptionTier', 'Textarea', 'Theme', 'ThemePreset', 'TimeoutHandle', 'TrendingUp',
    'UserTestingService', 'Users', 'VariantProps', 'WebSocketConfig', 'WebSocketMessage',
    'WebSocketMessageType', 'WebhookPayload', 'X', 'Zap', '_config', '_error', '_event', '_index',
    '_persona', '_user', 'a', 'alarmOrNotification', 'alarms', 'analytics', 'config', 'currentTier',
    'e', 'error', 'fn', 'index', 'initial', 'newTier', 'openDB', 'paymentMethodId', 'persona',
    'prefix', 'rippleId', 'setUserTier', 'soundEffectsService', 'tier', 'timer', 'useEffect',
    'useState', 'useTheme', 'user', 'userTier'
]

# Categories for organization
categories = {
    'react_hooks': ['React', 'useEffect', 'useState', 'useTheme'],
    'lucide_icons': ['Loader2', 'Calendar', 'Badge', 'Heart', 'Mail', 'Users', 'X', 'Zap', 'Send', 'Sparkles', 'TrendingUp', 'MessageSquare', 'Gift', 'Lightbulb'],
    'ui_components': ['Button', 'Card', 'CardContent', 'Progress', 'Textarea'],
    'rtl_components': ['RTLContainer', 'RTLFlex', 'RTLForm', 'RTLGrid', 'RTLText'],
    'types_interfaces': ['ApiError', 'ApiResponse', 'AppInfo', 'AppState', 'Award', 'HttpClient', 'HttpError', 'PaginatedResponse', 'PaginationParams', 'WebhookPayload', 'Theme', 'ThemePreset', 'SubscriptionTier', 'PremiumFeature'],
    'capacitor_plugins': ['BackgroundMode', 'Network', 'KeepAwake', 'Alarm'],
    'web_apis': ['AddEventListenerOptions', 'BlobPart', 'BufferSource', 'IDBDatabaseEventMap', 'IDBObjectStoreParameters', 'IDBPDatabase', 'IDBTransactionMode', 'NavigationTiming', 'PerformanceEntryList', 'ServiceWorkerContainerEventMap', 'SpeechRecognition', 'TimeoutHandle'],
    'cloudflare_types': ['D1Database', 'KVNamespace', 'DurableObjectNamespace', 'ExtendableEvent', 'FetchEvent', 'PushEvent', 'NotificationEvent'],
    'user_testing': ['UserTestingService', 'RedesignedFeedbackModal'],
    'variables': ['App', 'config', 'user', 'error', 'analytics', 'alarms', 'persona', 'tier', 'userTier', 'currentTier', 'newTier', 'timer', 'soundEffectsService']
}

results = {
    'found_exports': {},
    'not_found': [],
    'react_related': [],
    'lucide_related': [],
    'ui_components': [],
    'types_from_files': [],
    'capacitor_related': [],
    'web_apis': [],
    'variables': []
}

print("Searching for existing exports...")

for identifier in identifiers:
    print(f"Searching for: {identifier}")
    
    # Search for exports
    export_search = f"grep -r --include='*.ts' --include='*.tsx' 'export.*{identifier}' src/"
    export_results = run_command(export_search)
    
    # Search for type definitions  
    type_search = f"grep -r --include='*.ts' --include='*.tsx' 'type.*{identifier}' src/"
    type_results = run_command(type_search)
    
    # Search for interface definitions
    interface_search = f"grep -r --include='*.ts' --include='*.tsx' 'interface.*{identifier}' src/"
    interface_results = run_command(interface_search)
    
    # Combine all results
    all_results = f"{export_results}\n{type_results}\n{interface_results}".strip()
    
    if all_results:
        results['found_exports'][identifier] = all_results.split('\n')
        
        # Categorize by type
        if identifier in categories['react_hooks']:
            results['react_related'].append(identifier)
        elif identifier in categories['lucide_icons']:
            results['lucide_related'].append(identifier)
        elif identifier in categories['ui_components']:
            results['ui_components'].append(identifier)
        elif identifier in categories['rtl_components']:
            results['ui_components'].append(identifier)
        elif identifier in categories['types_interfaces']:
            results['types_from_files'].append(identifier)
        elif identifier in categories['capacitor_plugins']:
            results['capacitor_related'].append(identifier)
        elif identifier in categories['web_apis']:
            results['web_apis'].append(identifier)
        elif identifier in categories['variables']:
            results['variables'].append(identifier)
    else:
        results['not_found'].append(identifier)
        
        # Categorize not found items  
        if identifier in categories['react_hooks']:
            results['react_related'].append(identifier)
        elif identifier in categories['lucide_icons']:
            results['lucide_related'].append(identifier)
        elif identifier in categories['ui_components']:
            results['ui_components'].append(identifier)
        elif identifier in categories['rtl_components']:
            results['ui_components'].append(identifier)
        elif identifier in categories['capacitor_plugins']:
            results['capacitor_related'].append(identifier)
        elif identifier in categories['web_apis']:
            results['web_apis'].append(identifier)

# Write results
with open('/project/workspace/Coolhgg/Relife/ci/step-outputs/identifier_search_results.json', 'w') as f:
    json.dump(results, f, indent=2)

# Generate summary
summary_lines = []
summary_lines.append("=== IDENTIFIER SEARCH RESULTS ===\n")
summary_lines.append(f"Total identifiers searched: {len(identifiers)}")
summary_lines.append(f"Found existing exports: {len(results['found_exports'])}")
summary_lines.append(f"Not found (need stubs): {len(results['not_found'])}\n")

summary_lines.append("FOUND EXPORTS:")
for identifier, files in results['found_exports'].items():
    summary_lines.append(f"  {identifier}: {len(files)} file(s)")
    for file_line in files[:2]:  # Show first 2 results
        summary_lines.append(f"    - {file_line}")
    if len(files) > 2:
        summary_lines.append(f"    ... and {len(files) - 2} more")
    summary_lines.append("")

summary_lines.append("NOT FOUND (NEED STUBS/IMPORTS):")
for identifier in results['not_found']:
    summary_lines.append(f"  - {identifier}")

summary_lines.append("\n=== CATEGORIZED RESULTS ===")
summary_lines.append(f"React-related: {results['react_related']}")
summary_lines.append(f"Lucide icons: {results['lucide_related']}")  
summary_lines.append(f"UI components: {results['ui_components']}")
summary_lines.append(f"Types from files: {results['types_from_files']}")
summary_lines.append(f"Capacitor-related: {results['capacitor_related']}")
summary_lines.append(f"Web APIs: {results['web_apis']}")
summary_lines.append(f"Variables: {results['variables']}")

with open('/project/workspace/Coolhgg/Relife/ci/step-outputs/identifier_search_summary.txt', 'w') as f:
    f.write('\n'.join(summary_lines))

print("Search complete! Results saved to:")
print("- identifier_search_results.json")
print("- identifier_search_summary.txt")