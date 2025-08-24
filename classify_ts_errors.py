#!/usr/bin/env python3

import re
import json
from pathlib import Path
from collections import defaultdict

def parse_tsc_output(file_path):
    """Parse TypeScript output and categorize errors"""
    
    if not Path(file_path).exists():
        print(f"Error: {file_path} does not exist")
        return {}
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    errors = []
    lines = content.split('\n')
    
    for line in lines:
        # Match TypeScript error format: file(line,col): error TScode: message
        match = re.match(r'^(.*?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.*?)$', line.strip())
        if match:
            file_path, line_num, col_num, error_code, message = match.groups()
            errors.append({
                'file': file_path,
                'line': int(line_num),
                'column': int(col_num),
                'code': error_code,
                'message': message.strip()
            })
    
    return errors

def classify_errors(errors):
    """Classify errors into buckets based on the user's requirements"""
    
    buckets = {
        'component_props': [],
        'user_subscription': [],
        'persona_analytics': [],
        'cloudflare_runtime': [],
        'react_jsx_missing': [],
        'implicit_any': [],
        'hoisting_issues': [],
        'other': []
    }
    
    for error in errors:
        file = error['file']
        code = error['code']
        message = error['message'].lower()
        
        # Component Props Issues
        if ('property' in message and 'does not exist on type' in message and 
            ('intrinsicattributes' in message or 'props' in message)):
            buckets['component_props'].append(error)
        
        # User/Subscription Type Issues
        elif ('subscription' in message or 'subscriptiontier' in message or 
              (file.endswith('user.ts') or file.endswith('subscription.ts')) or
              'user' in file.lower()):
            buckets['user_subscription'].append(error)
        
        # PersonaAnalytics Issues
        elif ('persona' in message or 'personadetectiondata' in message or 
              'personaanalytics' in file.lower()):
            buckets['persona_analytics'].append(error)
        
        # Cloudflare Runtime Types
        elif ('d1database' in message or 'kvnamespace' in message or 
              'durableobjectnamespace' in message or 'cloudflare' in message or
              file.endswith('cloudflare-functions.ts')):
            buckets['cloudflare_runtime'].append(error)
        
        # React/JSX Missing Types
        elif (code in ['TS2307'] and ('react' in message or 'jsx-runtime' in message)) or \
             (code in ['TS7026', 'TS2875'] and 'jsx' in message):
            buckets['react_jsx_missing'].append(error)
        
        # Implicit Any Issues
        elif code in ['TS7006', 'TS7031', 'TS7053', 'TS7015']:
            buckets['implicit_any'].append(error)
        
        # Hoisting Issues
        elif code in ['TS2448', 'TS2454'] and 'used before' in message:
            buckets['hoisting_issues'].append(error)
        
        # Other
        else:
            buckets['other'].append(error)
    
    return buckets

def create_analysis_report(buckets, output_path):
    """Create markdown analysis report"""
    
    total_errors = sum(len(bucket) for bucket in buckets.values())
    
    report = f"""# TypeScript Error Analysis Report - Phase 1a

## Summary
- **Total Errors**: {total_errors}
- **Component Props**: {len(buckets['component_props'])}
- **User/Subscription**: {len(buckets['user_subscription'])}  
- **PersonaAnalytics**: {len(buckets['persona_analytics'])}
- **Cloudflare Runtime**: {len(buckets['cloudflare_runtime'])}
- **React/JSX Missing**: {len(buckets['react_jsx_missing'])}
- **Implicit Any**: {len(buckets['implicit_any'])}
- **Hoisting Issues**: {len(buckets['hoisting_issues'])}
- **Other**: {len(buckets['other'])}

## Phase 1a Focus Areas

### 1. Component Props Issues ({len(buckets['component_props'])} errors)
These are prop interface mismatches where components are receiving props that don't exist in their interface definitions.

"""
    
    # Add sample of component props errors
    if buckets['component_props']:
        report += "**Key Files with Props Issues:**\n"
        files_with_props = {}
        for error in buckets['component_props']:
            file = error['file']
            if file not in files_with_props:
                files_with_props[file] = []
            files_with_props[file].append(error)
        
        for file, errors in list(files_with_props.items())[:5]:  # Top 5 files
            report += f"- `{file}`: {len(errors)} errors\n"
            if errors:
                report += f"  - Line {errors[0]['line']}: {errors[0]['message'][:100]}...\n"
    
    report += f"""

### 2. User/Subscription Types ({len(buckets['user_subscription'])} errors)
Issues with user type definitions and subscription logic mismatches.

### 3. PersonaAnalytics ({len(buckets['persona_analytics'])} errors)
PersonaDetectionData needs extension for PersonaAnalytics compatibility.

### 4. Cloudflare Runtime ({len(buckets['cloudflare_runtime'])} errors)
Missing type definitions for D1Database, KVNamespace, DurableObjectNamespace.

## Additional Issues (Not Phase 1a)

### React/JSX Missing Types ({len(buckets['react_jsx_missing'])} errors)
React type declarations are missing - likely needs proper package installation.

### Implicit Any Issues ({len(buckets['implicit_any'])} errors)
Parameters and variables with implicit any types - mostly in event handlers.

### Hoisting Issues ({len(buckets['hoisting_issues'])} errors)
Variables used before declaration - code organization issue.

"""
    
    with open(output_path, 'w') as f:
        f.write(report)

def main():
    # Parse errors
    errors = parse_tsc_output('ci/step-outputs/tsc_before.txt')
    print(f"Found {len(errors)} TypeScript errors")
    
    # Classify errors
    buckets = classify_errors(errors)
    
    # Save buckets as JSON
    with open('ci/step-outputs/tsc_buckets-1a.json', 'w') as f:
        json.dump(buckets, f, indent=2)
    
    # Create analysis report
    create_analysis_report(buckets, 'ci/step-outputs/tsc_buckets-1a.md')
    
    # Print summary
    print("\n=== Error Classification Summary ===")
    for bucket_name, errors in buckets.items():
        print(f"{bucket_name}: {len(errors)} errors")

if __name__ == "__main__":
    main()