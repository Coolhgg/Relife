#!/usr/bin/env python3
"""
Stage 2 TypeScript Error Analysis Script
Analyzes remaining TypeScript errors after Stage 1 (module resolution fixes)
"""

import re
import json
from collections import defaultdict, Counter
from pathlib import Path

def parse_stage2_errors(error_file):
    """Parse TypeScript errors from Stage 2 and categorize them"""
    
    if not Path(error_file).exists():
        print(f"Error file {error_file} not found")
        return None
    
    with open(error_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove ANSI color codes
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    content = ansi_escape.sub('', content)
    
    # Extract errors using pattern matching
    error_pattern = r'([^:\n]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+?)(?=\n\n|\n[^:\s]|\Z)'
    errors = re.findall(error_pattern, content, re.DOTALL)
    
    categorized_errors = defaultdict(list)
    error_counts = Counter()
    file_counts = Counter()
    
    for file_path, line, col, error_code, message in errors:
        clean_message = message.strip().replace('\n', ' ')
        
        error_info = {
            'file': file_path,
            'line': int(line),
            'column': int(col),
            'code': error_code,
            'message': clean_message
        }
        
        categorized_errors[error_code].append(error_info)
        error_counts[error_code] += 1
        file_counts[file_path] += 1
    
    return {
        'errors': dict(categorized_errors),
        'counts': dict(error_counts),
        'file_counts': dict(file_counts),
        'total_errors': len(errors)
    }

def categorize_by_priority(error_data):
    """Categorize errors by fix priority and impact"""
    
    priority_mapping = {
        # High Priority - Import/Export Issues (blocks compilation)
        'TS2724': {'priority': 1, 'category': 'Import/Export Issues', 'description': 'Missing or incorrect imports'},
        'TS2305': {'priority': 1, 'category': 'Import/Export Issues', 'description': 'Module has no exported member'},
        
        # Medium-High Priority - Type Safety Issues  
        'TS7006': {'priority': 2, 'category': 'Implicit Any Types', 'description': 'Parameter implicitly has any type'},
        'TS2722': {'priority': 2, 'category': 'Undefined Function Calls', 'description': 'Cannot invoke possibly undefined object'},
        'TS2741': {'priority': 2, 'category': 'Missing Properties', 'description': 'Property missing in type'},
        
        # Medium Priority - Property Access Issues
        'TS2339': {'priority': 3, 'category': 'Property Access', 'description': 'Property does not exist on type'},
        'TS2345': {'priority': 3, 'category': 'Type Mismatch', 'description': 'Argument not assignable to parameter'},
        'TS2322': {'priority': 3, 'category': 'Type Mismatch', 'description': 'Type not assignable to type'},
        
        # Lower Priority - Advanced Type Issues
        'TS2769': {'priority': 4, 'category': 'Function Overloads', 'description': 'No overload matches this call'},
        'TS2554': {'priority': 4, 'category': 'Function Arguments', 'description': 'Expected arguments mismatch'},
        'TS2304': {'priority': 4, 'category': 'Type Definitions', 'description': 'Cannot find name'},
        'TS2353': {'priority': 4, 'category': 'Object Literals', 'description': 'Unknown property in object literal'}
    }
    
    categorized = defaultdict(lambda: defaultdict(list))
    
    for error_code, errors in error_data['errors'].items():
        priority_info = priority_mapping.get(error_code, {
            'priority': 5, 
            'category': 'Other', 
            'description': 'Miscellaneous TypeScript error'
        })
        
        categorized[priority_info['priority']][error_code] = {
            'category': priority_info['category'],
            'description': priority_info['description'],
            'count': len(errors),
            'errors': errors[:5]  # Sample first 5 errors
        }
    
    return dict(categorized)

def generate_stage2_report(error_data, priority_data):
    """Generate comprehensive Stage 2 analysis report"""
    
    report = []
    report.append("# Stage 2 TypeScript Error Analysis Report")
    report.append("")
    report.append(f"**Total Errors**: {error_data['total_errors']}")
    report.append(f"**Unique Error Types**: {len(error_data['counts'])}")
    report.append(f"**Files Affected**: {len(error_data['file_counts'])}")
    report.append("")
    
    report.append("## Error Summary by Type")
    report.append("")
    for error_code, count in sorted(error_data['counts'].items(), key=lambda x: x[1], reverse=True):
        report.append(f"- **{error_code}**: {count} errors")
    report.append("")
    
    report.append("## Prioritized Fix Plan")
    report.append("")
    
    for priority in sorted(priority_data.keys()):
        report.append(f"### Priority {priority} - {'Critical' if priority == 1 else 'High' if priority == 2 else 'Medium' if priority == 3 else 'Low'}")
        report.append("")
        
        total_priority_errors = sum(data['count'] for data in priority_data[priority].values())
        report.append(f"**Total Priority {priority} Errors**: {total_priority_errors}")
        report.append("")
        
        for error_code, data in priority_data[priority].items():
            report.append(f"#### {error_code}: {data['category']}")
            report.append(f"- **Count**: {data['count']}")
            report.append(f"- **Description**: {data['description']}")
            report.append("")
            
            if data['errors']:
                report.append("**Sample Errors**:")
                for error in data['errors']:
                    report.append(f"- `{error['file']}:{error['line']}` - {error['message'][:100]}...")
                report.append("")
    
    report.append("## Most Problematic Files")
    report.append("")
    top_files = sorted(error_data['file_counts'].items(), key=lambda x: x[1], reverse=True)[:10]
    for file_path, count in top_files:
        report.append(f"- **{file_path}**: {count} errors")
    report.append("")
    
    report.append("## Recommended Fix Order")
    report.append("")
    report.append("1. **Import/Export Issues (TS2724, TS2305)** - Fix missing imports first")
    report.append("2. **Implicit Any Types (TS7006)** - Add proper type annotations")  
    report.append("3. **Undefined Function Calls (TS2722)** - Add null checks")
    report.append("4. **Missing Properties (TS2741)** - Add missing object properties")
    report.append("5. **Property Access (TS2339)** - Fix property access errors")
    report.append("6. **Type Mismatches (TS2345, TS2322)** - Fix type assignments")
    
    return "\n".join(report)

def main():
    error_file = "ci/step-outputs/stage2_initial_errors.txt"
    
    print("Analyzing Stage 2 TypeScript errors...")
    error_data = parse_stage2_errors(error_file)
    
    if not error_data:
        print("No error data found")
        return
    
    print(f"Found {error_data['total_errors']} total errors")
    
    priority_data = categorize_by_priority(error_data)
    report = generate_stage2_report(error_data, priority_data)
    
    # Save detailed analysis
    with open("ci/step-outputs/stage2_analysis.md", "w") as f:
        f.write(report)
    
    # Save JSON data for programmatic use
    with open("ci/step-outputs/stage2_analysis.json", "w") as f:
        json.dump({
            'error_data': error_data,
            'priority_data': priority_data
        }, f, indent=2, default=str)
    
    print("Analysis complete!")
    print(f"Report saved to: ci/step-outputs/stage2_analysis.md")
    print(f"JSON data saved to: ci/step-outputs/stage2_analysis.json")

if __name__ == "__main__":
    main()