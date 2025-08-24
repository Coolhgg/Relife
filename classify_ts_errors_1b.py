#!/usr/bin/env python3
"""
Classify TypeScript errors for Phase 1b fixes.
Focuses on: WakeUpMood enum, Timeout types, import/export mismatches, AccessibilityTester styles.
"""

import json
import re
from collections import defaultdict
from typing import Dict, List, Any


def classify_ts_error(file_path: str, error_code: str, error_msg: str) -> str:
    """Classify a TypeScript error into specific Phase 1b categories."""
    
    # WakeUpMood enum issues
    if "WakeUpMood" in error_msg:
        return "wakeup_mood_enum"
    
    # Timeout type conflicts (Node.js vs browser)
    if "Timeout" in error_msg or "NodeJS.Timeout" in error_msg or "setTimeout" in error_msg:
        return "timeout_conflicts"
    
    # Import/export mismatches - look for underscore prefixed imports and specific patterns
    if (re.search(r"'[^']*' has no exported member named '[^']*'", error_msg) or
        "_" in error_msg and ("exported member" in error_msg or "Cannot find module" in error_msg) or
        error_code in ["TS2724", "TS2307"]):
        return "import_export_mismatches"
    
    # AccessibilityTester style duplicates (look for duplicate properties)
    if ("AccessibilityTester" in file_path or "accessibility" in file_path.lower()) and \
       ("duplicate" in error_msg.lower() or "object literal may only specify known properties" in error_msg.lower()):
        return "accessibility_styles"
    
    # Implicit any types
    if error_code == "TS7006" or "implicitly has an 'any' type" in error_msg:
        return "implicit_any"
    
    # Property access errors
    if error_code in ["TS2339", "TS2741"] and "Property" in error_msg:
        return "property_access_errors"
    
    # Type assignment/compatibility errors
    if error_code in ["TS2322", "TS2345", "TS2769"]:
        return "type_assignment_errors"
    
    # Missing type exports/declarations
    if error_code in ["TS2305", "TS2307", "TS2724"]:
        return "missing_type_declarations"
    
    # Other specific error types
    if error_code in ["TS7053", "TS2561", "TS2353"]:
        return "object_property_errors"
    
    return "other_errors"


def parse_ts_errors(file_path: str) -> List[Dict[str, Any]]:
    """Parse TypeScript errors from the output file."""
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse errors using regex
    # Format: file(line,col): error TSxxxx: message
    error_pattern = r'([^(]+)\((\d+),(\d+)\): error (TS\d+): (.+)'
    
    for match in re.finditer(error_pattern, content, re.MULTILINE):
        file_path_match, line, col, error_code, error_msg = match.groups()
        
        # Clean up file path (remove leading ./)
        file_path_clean = file_path_match.strip()
        if file_path_clean.startswith('./'):
            file_path_clean = file_path_clean[2:]
        
        errors.append({
            'file': file_path_clean,
            'line': int(line),
            'col': int(col),
            'code': error_code,
            'message': error_msg.strip(),
            'category': classify_ts_error(file_path_clean, error_code, error_msg)
        })
    
    return errors


def create_error_buckets(errors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create categorized buckets of errors."""
    buckets = defaultdict(list)
    
    # Group by category
    for error in errors:
        buckets[error['category']].append(error)
    
    # Convert to regular dict and add stats
    result = {}
    for category, error_list in buckets.items():
        result[category] = {
            'count': len(error_list),
            'errors': error_list
        }
    
    # Add summary stats
    result['summary'] = {
        'total_errors': len(errors),
        'categories': len(result),
        'phase_1b_focus_areas': {
            'wakeup_mood_enum': result.get('wakeup_mood_enum', {}).get('count', 0),
            'timeout_conflicts': result.get('timeout_conflicts', {}).get('count', 0), 
            'import_export_mismatches': result.get('import_export_mismatches', {}).get('count', 0),
            'accessibility_styles': result.get('accessibility_styles', {}).get('count', 0),
        }
    }
    
    return result


def create_markdown_report(buckets: Dict[str, Any]) -> str:
    """Create a markdown report of the error analysis."""
    report = []
    
    report.append("# TypeScript Error Analysis - Phase 1b")
    report.append("")
    report.append("## Summary")
    report.append("")
    
    summary = buckets['summary']
    report.append(f"- **Total errors**: {summary['total_errors']}")
    report.append(f"- **Categories**: {summary['categories']}")
    report.append("")
    
    report.append("## Phase 1b Focus Areas")
    report.append("")
    
    focus_areas = summary['phase_1b_focus_areas']
    for area, count in focus_areas.items():
        area_name = area.replace('_', ' ').title()
        report.append(f"- **{area_name}**: {count} errors")
    
    report.append("")
    report.append("## Detailed Breakdown by Category")
    report.append("")
    
    # Sort categories by count (descending)
    sorted_categories = sorted(
        [(k, v) for k, v in buckets.items() if k != 'summary'],
        key=lambda x: x[1]['count'],
        reverse=True
    )
    
    for category, data in sorted_categories:
        count = data['count']
        category_name = category.replace('_', ' ').title()
        
        report.append(f"### {category_name} ({count} errors)")
        report.append("")
        
        # Show top 10 examples for each category
        examples = data['errors'][:10]
        
        for i, error in enumerate(examples, 1):
            report.append(f"{i}. **{error['file']}:{error['line']}** - {error['code']}")
            report.append(f"   {error['message']}")
            report.append("")
            
        if len(data['errors']) > 10:
            remaining = len(data['errors']) - 10
            report.append(f"   *... and {remaining} more errors in this category*")
            report.append("")
        
        report.append("")
    
    return '\n'.join(report)


def main():
    """Main function to analyze TypeScript errors."""
    input_file = "ci/step-outputs/tsc_before-1b.txt"
    output_json = "ci/step-outputs/tsc_buckets-1b.json"
    output_md = "ci/step-outputs/tsc_buckets-1b.md"
    
    print("Parsing TypeScript errors...")
    errors = parse_ts_errors(input_file)
    print(f"Found {len(errors)} errors")
    
    print("Categorizing errors...")
    buckets = create_error_buckets(errors)
    
    print("Creating outputs...")
    
    # Save JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(buckets, f, indent=2)
    
    # Save Markdown report
    report = create_markdown_report(buckets)
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Analysis complete!")
    print(f"- JSON output: {output_json}")
    print(f"- Markdown report: {output_md}")
    
    # Print summary
    summary = buckets['summary']
    print(f"\nSummary:")
    print(f"Total errors: {summary['total_errors']}")
    print(f"Phase 1b focus areas:")
    for area, count in summary['phase_1b_focus_areas'].items():
        print(f"  - {area.replace('_', ' ').title()}: {count}")


if __name__ == "__main__":
    main()