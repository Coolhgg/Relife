#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SyntaxErrorScanner {
  constructor() {
    this.errors = {
      syntax: [],
      encoding: [],
      jsx_escapes: [],
      comments_strings: []
    };
    
    this.stats = {
      filesScanned: 0,
      errorsFound: 0
    };
  }

  scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && 
          !entry.name.startsWith('.') && 
          !['node_modules', 'dist', 'coverage'].includes(entry.name)) {
        this.scanDirectory(fullPath, extensions);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          this.scanFile(fullPath);
        }
      }
    }
  }

  scanFile(filePath) {
    try {
      this.stats.filesScanned++;
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Scanning: ${filePath.replace(process.cwd(), '.')}`);
      
      // Check for real issues only
      this.checkEncoding(filePath, content);
      this.checkJSXEscapes(filePath, content);
      this.checkCommentsStrings(filePath, content);
      this.checkSyntax(filePath, content);
      
    } catch (error) {
      this.errors.syntax.push({
        file: filePath,
        type: 'file_read_error',
        message: error.message,
        line: 0
      });
      this.stats.errorsFound++;
    }
  }

  checkEncoding(filePath, content) {
    const issues = [];
    
    // Check for BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      issues.push({
        type: 'utf8_bom',
        description: 'UTF-8 BOM detected'
      });
    }
    
    // Check for actual encoding corruption patterns
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      // Check for common encoding corruption patterns
      if (line.includes('â€™') || // Smart quote corruption 
          line.includes('â€œ') || // Smart quote corruption 
          line.includes('â€') ||  // Smart quote corruption
          line.includes('Ã¡') ||   // Accented character corruption
          line.includes('Ã©') ||   // Accented character corruption
          line.includes('\\u00') || // Unicode escape sequences that shouldn't be escaped
          line.match(/\\x[0-9a-fA-F]{2}/)) { // Hex escape sequences
        issues.push({
          line: idx + 1,
          content: line.trim(),
          type: 'encoding_corruption'
        });
      }
      
      // Check for malformed Unicode sequences
      if (line.includes('\uFFFD')) {
        issues.push({
          line: idx + 1,
          content: line.trim(),
          type: 'malformed_unicode'
        });
      }
    });
    
    if (issues.length > 0) {
      this.errors.encoding.push({
        file: filePath,
        issues
      });
      this.stats.errorsFound++;
    }
  }

  checkJSXEscapes(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      // Look for actual escaped quotes in JSX attributes (corruption patterns)
      // These patterns indicate corrupted JSX where quotes have been incorrectly escaped
      
      // Pattern 1: className=\"value\" (should be className="value")
      const pattern1 = /(\w+\s*=\s*)\\"/g;
      let match;
      while ((match = pattern1.exec(line)) !== null) {
        // Make sure this isn't inside a string literal
        const beforeMatch = line.substring(0, match.index);
        const inString = (beforeMatch.split('"').length - 1) % 2 !== 0;
        
        if (!inString) {
          issues.push({
            line: idx + 1,
            content: line.trim(),
            match: match[0],
            type: 'escaped_jsx_quotes',
            fix_suggestion: match[0].replace(/\\"/g, '"')
          });
        }
      }
      
      // Pattern 2: Double-escaped quotes className=\\"value\\"
      if (line.match(/\w+\s*=\s*\\\\"/)) {
        const matches = line.match(/\w+\s*=\s*\\\\"[^"]*\\\\"/g) || [];
        matches.forEach(match => {
          issues.push({
            line: idx + 1,
            content: line.trim(),
            match: match.trim(),
            type: 'double_escaped_jsx_quotes',
            fix_suggestion: match.replace(/\\\\"/g, '"')
          });
        });
      }
    });
    
    if (issues.length > 0) {
      this.errors.jsx_escapes.push({
        file: filePath,
        issues
      });
      this.stats.errorsFound++;
    }
  }

  checkCommentsStrings(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      // Only flag JSX-like syntax in comments if it could cause parsing confusion
      if (line.includes('//') || line.includes('/*') || line.includes('*/')) {
        // Look for unclosed JSX tags in comments that might confuse parsers
        const problematicPatterns = [
          /<div[^>]*(?!\/>)(?![^<]*<\/div>)/,  // Unclosed div tags
          /<span[^>]*(?!\/>)(?![^<]*<\/span>)/, // Unclosed span tags
          /<[A-Z][a-zA-Z]*[^>]*(?!\/>)(?![^<]*<\/[A-Z])/ // Unclosed React components
        ];
        
        problematicPatterns.forEach(pattern => {
          if (line.match(pattern)) {
            issues.push({
              line: idx + 1,
              content: line.trim(),
              type: 'problematic_jsx_in_comment',
              description: 'Unclosed JSX-like tag in comment may confuse parser'
            });
          }
        });
      }
    });
    
    if (issues.length > 0) {
      this.errors.comments_strings.push({
        file: filePath,
        issues
      });
      this.stats.errorsFound++;
    }
  }

  checkSyntax(filePath, content) {
    const issues = [];
    
    try {
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }
        
        // Look for obvious syntax errors
        if (trimmed.includes('undefined;undefined') || 
            trimmed.includes('}}}}') ||
            trimmed.match(/\)\)\)\)/) ||
            trimmed.includes(';;;;;;')) {
          issues.push({
            line: i + 1,
            content: trimmed,
            type: 'suspicious_syntax'
          });
        }
        
        // Check for unterminated template literals spanning lines incorrectly
        if (trimmed.includes('`') && !trimmed.match(/`[^`]*`/)) {
          // Check if this is part of a multiline template literal
          let openTicks = 0;
          for (let j = 0; j <= i; j++) {
            openTicks += (lines[j].match(/`/g) || []).length;
          }
          if (openTicks % 2 !== 0) {
            // This is fine - multiline template literal
            continue;
          }
        }
      }
      
    } catch (error) {
      issues.push({
        line: 0,
        content: 'File parsing error',
        type: 'parse_error',
        message: error.message
      });
    }
    
    if (issues.length > 0) {
      this.errors.syntax.push({
        file: filePath,
        issues
      });
      this.stats.errorsFound++;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      categorized_errors: this.errors,
      summary: {
        total_files_scanned: this.stats.filesScanned,
        total_errors_found: this.stats.errorsFound,
        syntax_issues: this.errors.syntax.length,
        encoding_issues: this.errors.encoding.length,
        jsx_escape_issues: this.errors.jsx_escapes.length,
        comment_string_issues: this.errors.comments_strings.length
      }
    };

    return report;
  }

  saveReport(outputPath) {
    const report = this.generateReport();
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${outputPath}`);
    
    // Print summary
    console.log('\n=== SYNTAX & ENCODING ERROR INVENTORY ===');
    console.log(`Files scanned: ${report.stats.filesScanned}`);
    console.log(`Total issues found: ${report.stats.errorsFound}`);
    console.log(`- Syntax issues: ${report.summary.syntax_issues}`);
    console.log(`- Encoding issues: ${report.summary.encoding_issues}`);
    console.log(`- JSX escape issues: ${report.summary.jsx_escape_issues}`);
    console.log(`- Comment/string issues: ${report.summary.comment_string_issues}`);
    
    // Show some examples if issues were found
    if (report.summary.jsx_escape_issues > 0) {
      console.log('\n--- JSX Escape Issues Examples ---');
      report.categorized_errors.jsx_escapes.slice(0, 3).forEach(fileError => {
        console.log(`File: ${fileError.file.replace(process.cwd(), '.')}`);
        fileError.issues.slice(0, 2).forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.match || issue.content}`);
          if (issue.fix_suggestion) {
            console.log(`  Fix: ${issue.fix_suggestion}`);
          }
        });
      });
    }

    if (report.summary.encoding_issues > 0) {
      console.log('\n--- Encoding Issues Examples ---');
      report.categorized_errors.encoding.slice(0, 3).forEach(fileError => {
        console.log(`File: ${fileError.file.replace(process.cwd(), '.')}`);
        fileError.issues.slice(0, 2).forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.type} - ${issue.content}`);
        });
      });
    }

    return report;
  }
}

// Run the scanner
if (require.main === module) {
  const scanner = new SyntaxErrorScanner();
  
  console.log('Starting comprehensive syntax and encoding error scan...\n');
  
  // Scan source directory
  scanner.scanDirectory('./src');
  
  // Create artifacts directory if it doesn't exist
  if (!fs.existsSync('./artifacts')) {
    fs.mkdirSync('./artifacts');
  }
  
  // Save the report
  const report = scanner.saveReport('./artifacts/syntax-error-inventory.json');
  
  console.log('\n=== SCAN COMPLETE ===');
}

module.exports = SyntaxErrorScanner;