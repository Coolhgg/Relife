#!/usr/bin/env python3

import re
import sys
from collections import defaultdict
from pathlib import Path

def parse_tsc_errors(file_path):
    """Parse TypeScript errors from the output file."""
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove ANSI color codes
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    clean_content = ansi_escape.sub('', content)
    
    # Pattern to match TypeScript errors
    # Format: src/file.tsx:line:col - error TSxxxx: Error message
    error_pattern = r'([^:]+):(\d+):(\d+) - error (TS\d+): (.+?)(?=\n|$)'
    
    matches = re.findall(error_pattern, clean_content, re.MULTILINE | re.DOTALL)
    
    for match in matches:
        file_path, line, col, error_code, message = match
        # Clean up the message
        message = message.strip().replace('\n', ' ')
        
        errors.append({
            'file': file_path,
            'line': int(line),
            'col': int(col),
            'code': error_code,
            'message': message,
            'full_line': f"{file_path}:{line}:{col} - error {error_code}: {message}"
        })
    
    return errors

def categorize_and_prioritize_errors(errors):
    """Categorize errors by severity and type."""
    
    # Define severity levels (higher number = more severe)
    severity_map = {
        # Critical parse blockers
        'TS1128': 10,  # Declaration or statement expected
        'TS1161': 10,  # Unterminated regular expression literal
        'TS1005': 10,  # Expected
        'TS2307': 9,   # Cannot find module
        'TS2875': 9,   # JSX tag requires module path
        'TS7026': 8,   # JSX element implicitly has type 'any'
        'TS2528': 8,   # Module cannot have multiple default exports
        'TS2580': 7,   # Cannot find name 'process'
        'TS2688': 7,   # Cannot find type definition file
        
        # Type system errors
        'TS2339': 6,   # Property does not exist
        'TS2322': 6,   # Type is not assignable
        'TS2345': 6,   # Argument of type X is not assignable
        'TS2554': 5,   # Expected X arguments, but got Y
        'TS7006': 4,   # Parameter implicitly has 'any' type
        'TS7031': 4,   # Binding element implicitly has 'any' type
        'TS7053': 4,   # Element implicitly has 'any' type
        'TS2741': 5,   # Property is missing in type
        'TS2353': 5,   # Object literal may only specify known properties
        
        # Less critical
        'TS2304': 3,   # Cannot find name
        'TS18048': 3,  # Possibly undefined
        'TS18046': 3,  # Is of type 'unknown'
        'TS2722': 3,   # Cannot invoke an object which is possibly 'undefined'
    }
    
    categorized = defaultdict(list)
    
    for error in errors:
        severity = severity_map.get(error['code'], 2)  # Default severity
        error['severity'] = severity
        
        # Categorize by type
        if error['code'] in ['TS1128', 'TS1161', 'TS1005']:
            category = 'parse_blockers'
        elif error['code'] in ['TS2307', 'TS2875', 'TS2580', 'TS2688']:
            category = 'module_resolution'
        elif error['code'] in ['TS7026', 'TS2528']:
            category = 'jsx_issues'
        elif error['code'] in ['TS7006', 'TS7031', 'TS7053']:
            category = 'implicit_any'
        elif error['code'] in ['TS2339', 'TS2322', 'TS2345', 'TS2741']:
            category = 'type_errors'
        else:
            category = 'other'
            
        error['category'] = category
        categorized[category].append(error)
    
    return categorized

def extract_top_errors(errors, limit=200):
    """Extract top errors by severity and frequency."""
    
    # Sort by severity (descending) then by file/line for consistency
    sorted_errors = sorted(
        errors, 
        key=lambda x: (-x['severity'], x['file'], x['line'])
    )
    
    # Deduplicate similar errors (same file, same error code, similar line numbers)
    seen_patterns = set()
    unique_errors = []
    
    for error in sorted_errors:
        # Create a pattern key for deduplication
        pattern_key = f"{error['file']}:{error['code']}:{error['line']//10*10}"  # Group by 10-line blocks
        
        if pattern_key not in seen_patterns or len(unique_errors) < limit//2:
            seen_patterns.add(pattern_key)
            unique_errors.append(error)
            
        if len(unique_errors) >= limit:
            break
    
    return unique_errors

def main():
    input_file = Path('ci/step-outputs/full_tsc_errors.txt')
    output_file = Path('ci/step-outputs/top_200_tsc_errors.txt')
    
    if not input_file.exists():
        print(f"Error: {input_file} not found")
        sys.exit(1)
    
    # Parse errors
    all_errors = parse_tsc_errors(input_file)
    print(f"Found {len(all_errors)} total errors")
    
    if not all_errors:
        print("No errors found in the input file")
        with open(output_file, 'w') as f:
            f.write("No TypeScript errors found!\nThe codebase appears to be clean.\n")
        return
    
    # Categorize and prioritize
    categorized = categorize_and_prioritize_errors(all_errors)
    
    # Get top errors
    top_errors = extract_top_errors(all_errors, 200)
    
    # Write to output file
    with open(output_file, 'w') as f:
        f.write("# Top 200 TypeScript Errors - Staged Remediation Analysis\n\n")
        f.write(f"Total errors found: {len(all_errors)}\n")
        f.write(f"Unique high-priority errors: {len(top_errors)}\n\n")
        
        # Summary by category
        f.write("## Error Categories Summary\n\n")
        for category, errors_in_cat in categorized.items():
            f.write(f"- **{category.replace('_', ' ').title()}**: {len(errors_in_cat)} errors\n")
        f.write("\n")
        
        # Write top errors
        f.write("## Top Priority Errors (by severity)\n\n")
        
        current_category = None
        for i, error in enumerate(top_errors, 1):
            if error['category'] != current_category:
                current_category = error['category']
                f.write(f"\n### {current_category.replace('_', ' ').title()}\n\n")
            
            f.write(f"{i}. **{error['file']}:{error['line']}:{error['col']}** "
                   f"[{error['code']}] (Severity: {error['severity']})\n")
            f.write(f"   {error['message']}\n\n")
    
    print(f"Written top {len(top_errors)} errors to {output_file}")
    
    # Print top 20 for console output
    print("\nTop 20 Errors:")
    for i, error in enumerate(top_errors[:20], 1):
        print(f"{i:2d}. {error['file']}:{error['line']} [{error['code']}] {error['message'][:80]}...")

if __name__ == "__main__":
    main()