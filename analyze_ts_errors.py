#!/usr/bin/env python3
"""
Script to analyze TypeScript errors and categorize them into buckets.
"""

import re
import json
from collections import defaultdict

def categorize_error(file_path, error_code, error_message):
    """Categorize TypeScript error into buckets based on patterns."""
    
    # Category 1: Component prop interface mismatches
    if ('not assignable to type' in error_message and 'Props' in error_message) or \
       ('Property' in error_message and 'does not exist on type' in error_message and 'Props' in error_message):
        return "component_props"
    
    # Category 2: User type issues (subscriptionTier vs subscription)
    if 'subscriptionTier' in error_message or ('subscription' in error_message.lower() and 'User' in error_message):
        return "user_types"
    
    # Category 3: PersonaAnalytics / PersonaDetectionData missing properties
    if 'PersonaDetectionData' in error_message or 'PersonaAnalytics' in file_path:
        return "persona_analytics"
    
    # Category 4: Cloudflare runtime types
    if any(cf_type in error_message for cf_type in ['D1Database', 'KVNamespace', 'DurableObjectNamespace']):
        return "cloudflare_types"
    
    # Category 5: WakeUpMood enum issues
    if 'WakeUpMood' in error_message:
        return "wakeup_mood"
    
    # Category 6: Timeout type conflicts
    if 'Timeout' in error_message and ('not assignable to type' in error_message):
        return "timeout_types"
    
    # Category 7: Import/export mismatches
    if 'has no exported member' in error_message or 'has no default export' in error_message:
        return "import_exports"
    
    # Category 8: Duplicate style properties
    if 'is specified more than once' in error_message and 'style' in error_message:
        return "duplicate_styles"
    
    # Other categories
    if 'used before its declaration' in error_message or 'used before being assigned' in error_message:
        return "hoisting_issues"
    
    if 'implicitly has an \'any\' type' in error_message:
        return "implicit_any"
    
    if 'Cannot find name' in error_message:
        return "missing_imports"
    
    return "other"

def parse_ts_errors(file_path):
    """Parse TypeScript errors from file."""
    errors = []
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern: src/path/file.tsx(line,col): error TSxxxx: message
    pattern = r'(\S+)\((\d+),(\d+)\): error (TS\d+): (.+?)(?=\n\S|\n\n|\Z)'
    
    matches = re.findall(pattern, content, re.DOTALL)
    
    for match in matches:
        file_name, line, col, error_code, message = match
        errors.append({
            'file': file_name,
            'line': int(line),
            'column': int(col),
            'code': error_code,
            'message': message.strip().replace('\n  ', ' ')
        })
    
    return errors

def main():
    errors = parse_ts_errors('/project/workspace/Coolhgg/Relife/ci/step-outputs/tsc_before.txt')
    
    # Categorize errors
    buckets = defaultdict(list)
    
    for error in errors:
        category = categorize_error(error['file'], error['code'], error['message'])
        buckets[category].append(error)
    
    # Save buckets as JSON
    buckets_dict = dict(buckets)
    with open('/project/workspace/Coolhgg/Relife/ci/step-outputs/tsc_buckets.json', 'w') as f:
        json.dump(buckets_dict, f, indent=2)
    
    # Generate summary report
    report = []
    report.append("# TypeScript Error Buckets Analysis\n")
    report.append(f"Total errors found: {len(errors)}\n")
    
    for category, category_errors in buckets_dict.items():
        report.append(f"## {category.replace('_', ' ').title()} ({len(category_errors)} errors)\n")
        
        # Group by file
        files = defaultdict(list)
        for error in category_errors:
            files[error['file']].append(error)
        
        for file_path, file_errors in files.items():
            report.append(f"**{file_path}** ({len(file_errors)} errors)")
            for error in file_errors[:3]:  # Show first 3 errors per file
                report.append(f"- Line {error['line']}: {error['message'][:100]}...")
            if len(file_errors) > 3:
                report.append(f"- ... and {len(file_errors) - 3} more errors")
            report.append("")
        
        report.append("")
    
    with open('/project/workspace/Coolhgg/Relife/ci/step-outputs/tsc_buckets_report.md', 'w') as f:
        f.write('\n'.join(report))
    
    print(f"Analyzed {len(errors)} errors into {len(buckets_dict)} categories")
    for category, category_errors in buckets_dict.items():
        print(f"  {category}: {len(category_errors)} errors")

if __name__ == '__main__':
    main()