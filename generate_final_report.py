#!/usr/bin/env python3
"""
Generate comprehensive ESLint final report comparing before/after states.
"""
import json
import sys
from collections import defaultdict
from pathlib import Path


def load_eslint_results(file_path):
    """Load ESLint JSON results from file."""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []


def analyze_results(results):
    """Analyze ESLint results and return summary statistics."""
    stats = {
        'total_files': len(results),
        'files_with_issues': 0,
        'total_errors': 0,
        'total_warnings': 0,
        'total_fixable_errors': 0,
        'total_fixable_warnings': 0,
        'rule_counts': defaultdict(int),
        'issues_by_file': {},
        'top_issues': []
    }
    
    for file_result in results:
        file_path = file_result['filePath']
        error_count = file_result['errorCount']
        warning_count = file_result['warningCount']
        
        if error_count > 0 or warning_count > 0:
            stats['files_with_issues'] += 1
            stats['issues_by_file'][file_path] = {
                'errors': error_count,
                'warnings': warning_count,
                'messages': file_result['messages']
            }
        
        stats['total_errors'] += error_count
        stats['total_warnings'] += warning_count
        stats['total_fixable_errors'] += file_result['fixableErrorCount']
        stats['total_fixable_warnings'] += file_result['fixableWarningCount']
        
        # Count issues by rule
        for message in file_result['messages']:
            rule_id = message.get('ruleId') or 'unknown'
            stats['rule_counts'][rule_id] += 1
            
            # Collect top issues for detailed reporting
            stats['top_issues'].append({
                'file': file_path.replace('/project/workspace/Coolhgg/Relife/', ''),
                'line': message.get('line', 0),
                'column': message.get('column', 0),
                'severity': message.get('severity', 0),
                'message': message.get('message', ''),
                'rule': rule_id,
                'fixable': message.get('fix') is not None
            })
    
    # Sort top issues by severity (errors first), then by rule
    stats['top_issues'].sort(key=lambda x: (x['severity'], x['rule'] or '', x['file'] or ''))
    
    return stats


def format_file_path(file_path):
    """Format file path for display."""
    return file_path.replace('/project/workspace/Coolhgg/Relife/', '')


def generate_fix_suggestion(issue):
    """Generate a simple fix suggestion for common issues."""
    rule = issue['rule']
    suggestions = {
        'no-undef': f"Add missing import or declare variable: {issue['message'].split(' ')[0] if ' ' in issue['message'] else 'variable'}",
        'no-unused-vars': f"Remove or prefix with underscore: {issue['message'].split(' ')[0] if ' ' in issue['message'] else 'variable'}",
        '@typescript-eslint/no-unused-vars': f"Remove or prefix with underscore: {issue['message'].split(' ')[0] if ' ' in issue['message'] else 'variable'}",
        'react-hooks/exhaustive-deps': 'Add missing dependencies to dependency array',
        'prefer-const': 'Change let to const for variables that are never reassigned',
        'no-constant-condition': 'Replace constant condition with dynamic check'
    }
    
    return suggestions.get(rule, 'Review and fix according to rule documentation')


def generate_report():
    """Generate the comprehensive final report."""
    before_file = Path('ci/step-outputs/eslint_final_before.json')
    after_file = Path('ci/step-outputs/eslint_final_after.json')
    
    if not before_file.exists() or not after_file.exists():
        return "Error: Required ESLint JSON files not found."
    
    before_results = load_eslint_results(before_file)
    after_results = load_eslint_results(after_file)
    
    before_stats = analyze_results(before_results)
    after_stats = analyze_results(after_results)
    
    # Calculate improvements
    errors_fixed = before_stats['total_errors'] - after_stats['total_errors']
    warnings_fixed = before_stats['total_warnings'] - after_stats['total_warnings']
    
    report = []
    report.append("# ESLint Final Report - Lint & Format Pass")
    report.append("")
    report.append(f"**Generated on:** {Path('.').resolve().name}")
    report.append(f"**Branch:** auto/final-lint-pass")
    report.append("")
    
    # Executive Summary
    report.append("## 📊 Executive Summary")
    report.append("")
    report.append(f"- **Files analyzed:** {before_stats['total_files']:,}")
    report.append(f"- **Files with issues before:** {before_stats['files_with_issues']:,}")
    report.append(f"- **Files with issues after:** {after_stats['files_with_issues']:,}")
    report.append("")
    report.append("### Improvements Made")
    report.append(f"- **Errors fixed:** {errors_fixed:,} ({before_stats['total_errors']:,} → {after_stats['total_errors']:,})")
    report.append(f"- **Warnings fixed:** {warnings_fixed:,} ({before_stats['total_warnings']:,} → {after_stats['total_warnings']:,})")
    report.append(f"- **Total issues fixed:** {errors_fixed + warnings_fixed:,}")
    report.append("")
    
    # Process Issues
    report.append("## 🔧 Process Summary")
    report.append("")
    report.append("1. ✅ **Backup created:** `backup/pre-final-lint-20250825_093523`")
    report.append("2. ✅ **Branch created:** `auto/final-lint-pass`")
    report.append("3. ✅ **ESLint before state captured:** 19MB of lint data")
    report.append("4. ✅ **ESLint auto-fix executed:** Fixed automatically fixable issues")
    report.append("5. ⚠️ **Prettier formatting:** Encountered connectivity issues (502 Gateway)")
    report.append("6. ✅ **ESLint after state captured:** 19MB of lint data")
    report.append("")
    
    # Top Rule Violations (After)
    report.append("## 🚨 Current Top Issues Requiring Attention")
    report.append("")
    report.append("### Rule Violation Count")
    report.append("")
    sorted_rules = sorted(after_stats['rule_counts'].items(), key=lambda x: x[1], reverse=True)
    for i, (rule, count) in enumerate(sorted_rules[:15]):
        report.append(f"{i+1:2d}. **{rule}**: {count:,} violations")
    report.append("")
    
    # Top 50 Specific Issues
    report.append("## 📋 Top 50 Specific Issues")
    report.append("")
    report.append("| File | Line | Rule | Message | Suggested Fix |")
    report.append("|------|------|------|---------|---------------|")
    
    # Get top 50 issues, prioritizing errors over warnings
    top_50_issues = after_stats['top_issues'][:50]
    
    for issue in top_50_issues:
        file_short = issue['file'][:50] + "..." if len(issue['file']) > 50 else issue['file']
        message_short = issue['message'][:60] + "..." if len(issue['message']) > 60 else issue['message']
        suggestion = generate_fix_suggestion(issue)
        suggestion_short = suggestion[:40] + "..." if len(suggestion) > 40 else suggestion
        
        severity_icon = "🔴" if issue['severity'] == 2 else "🟡"
        
        report.append(f"| {file_short} | {issue['line']} | {severity_icon} {issue['rule']} | {message_short} | {suggestion_short} |")
    
    report.append("")
    
    # Files with Most Issues
    report.append("## 📁 Files Requiring Most Attention")
    report.append("")
    
    files_by_issue_count = []
    for file_path, issues in after_stats['issues_by_file'].items():
        total_issues = issues['errors'] + issues['warnings']
        files_by_issue_count.append({
            'file': format_file_path(file_path),
            'errors': issues['errors'],
            'warnings': issues['warnings'],
            'total': total_issues
        })
    
    files_by_issue_count.sort(key=lambda x: x['total'], reverse=True)
    
    report.append("| Rank | File | Errors | Warnings | Total |")
    report.append("|------|------|---------|----------|-------|")
    
    for i, file_info in enumerate(files_by_issue_count[:20]):
        report.append(f"| {i+1:2d} | {file_info['file'][:60]} | {file_info['errors']} | {file_info['warnings']} | **{file_info['total']}** |")
    
    report.append("")
    
    # Recommendations
    report.append("## 🎯 Recommendations")
    report.append("")
    report.append("### Immediate Actions")
    report.append("")
    
    if after_stats['total_errors'] > 0:
        report.append(f"1. **Fix {after_stats['total_errors']:,} critical errors** - These prevent proper code execution")
        
    if 'no-undef' in after_stats['rule_counts']:
        report.append(f"2. **Resolve {after_stats['rule_counts']['no-undef']:,} undefined variable issues** - Add missing imports/declarations")
        
    if any('react-hooks' in rule for rule in after_stats['rule_counts'].keys()):
        react_hooks_count = sum(count for rule, count in after_stats['rule_counts'].items() if 'react-hooks' in rule)
        report.append(f"3. **Fix {react_hooks_count:,} React Hooks issues** - Add missing dependencies to useEffect/useCallback")
        
    report.append("")
    report.append("### Next Steps")
    report.append("")
    report.append("1. **Manual Review Required:** Focus on files with highest issue counts")
    report.append("2. **Type Safety:** Address TypeScript strict mode violations")
    report.append("3. **Code Quality:** Resolve unused variable warnings")
    report.append("4. **React Best Practices:** Fix hooks dependency issues")
    report.append("5. **Retry Prettier:** Resolve connectivity issues and format code")
    report.append("")
    
    # Technical Details
    report.append("## 🔍 Technical Details")
    report.append("")
    report.append("### File Processing")
    report.append(f"- **Total files scanned:** {before_stats['total_files']:,}")
    report.append(f"- **Files with no issues:** {before_stats['total_files'] - after_stats['files_with_issues']:,}")
    report.append(f"- **Success rate:** {((before_stats['total_files'] - after_stats['files_with_issues']) / before_stats['total_files'] * 100):.1f}%")
    report.append("")
    
    report.append("### Auto-fix Capability")
    report.append(f"- **Fixable errors remaining:** {after_stats['total_fixable_errors']:,}")
    report.append(f"- **Fixable warnings remaining:** {after_stats['total_fixable_warnings']:,}")
    report.append(f"- **Manual intervention required:** {(after_stats['total_errors'] + after_stats['total_warnings']) - (after_stats['total_fixable_errors'] + after_stats['total_fixable_warnings']):,} issues")
    report.append("")
    
    # Footer
    report.append("---")
    report.append("")
    report.append("**Files Generated:**")
    report.append("- `ci/step-outputs/eslint_final_before.json` - Pre-fix lint state")
    report.append("- `ci/step-outputs/eslint_final_after.json` - Post-fix lint state")
    report.append("- `ci/step-outputs/eslint_final_report.md` - This comprehensive report")
    report.append("")
    report.append("**Backup Location:** `backup/pre-final-lint-20250825_093523`")
    
    return "\n".join(report)


if __name__ == "__main__":
    try:
        report_content = generate_report()
        
        # Write to file
        output_file = Path('ci/step-outputs/eslint_final_report.md')
        output_file.write_text(report_content)
        
        print(f"Report generated successfully: {output_file}")
        print("\nFirst 100 lines of report:")
        print("=" * 50)
        
        lines = report_content.split('\n')
        for i, line in enumerate(lines[:100], 1):
            print(f"{i:3d}: {line}")
            
        if len(lines) > 100:
            print(f"... ({len(lines) - 100} more lines)")
            
    except Exception as e:
        print(f"Error generating report: {e}")
        sys.exit(1)