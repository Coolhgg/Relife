#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
      
      // Check for encoding issues
      this.checkEncoding(filePath, content);
      
      // Check for JSX escaped quotes
      this.checkJSXEscapes(filePath, content);
      
      // Check for JSX-like syntax in comments/strings
      this.checkCommentsStrings(filePath, content);
      
      // Try TypeScript parsing
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
      issues.push('UTF-8 BOM detected');
    }
    
    // Check for non-UTF8 sequences
    const bytes = Buffer.from(content, 'utf8');
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte > 127) {
        // Check for common encoding issues
        if (byte === 0x92 || byte === 0x93) { // Smart quotes
          issues.push(`Possible encoding issue at byte ${i}: 0x${byte.toString(16)}`);
        }
      }
    }
    
    // Check for escaped newlines
    if (content.includes('\\n') && !content.includes('"\\n"') && !content.includes("'\\n'")) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('\\n') && !line.match(/['""]\\n['""]/) && !line.includes('\\\\n')) {
          issues.push(`Suspicious escaped newline at line ${idx + 1}`);
        }
      });
    }
    
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
      // Look for escaped quotes in JSX attributes
      const escapedQuoteMatches = [
        /className=\\"[^"]*\\"/g,
        /className=\\\\"[^"]*\\\\"/g,
        /id=\\"[^"]*\\"/g,
        /src=\\"[^"]*\\"/g,
        /alt=\\"[^"]*\\"/g,
        /\w+=\\"[^"]*\\"/g,
        /\w+=\\\\"[^"]*\\\\"/g
      ];
      
      escapedQuoteMatches.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            issues.push({
              line: idx + 1,
              content: line.trim(),
              match: match,
              type: 'escaped_jsx_quotes'
            });
          });
        }
      });
      
      // Look for malformed JSX strings
      if (line.includes('className=') && (line.includes('\\"') || line.includes("\\'"))) {
        issues.push({
          line: idx + 1,
          content: line.trim(),
          type: 'malformed_jsx_attribute'
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
      // Ignore common HTML tags in documentation comments
      if (line.includes('//') || line.includes('/*') || line.includes('*/')) {
        // Look for unclosed JSX tags in comments that might confuse parsers
        const problematicPatterns = [
          /<div[^>]*(?!\/>)(?![^<]*<\/div>)/,  // Unclosed div tags
          /<span[^>]*(?!\/>)(?![^<]*<\/span>)/, // Unclosed span tags
          /<[A-Z][a-zA-Z]*[^>]*(?!\/>)(?![^<]*<\/[A-Z])/  // Unclosed React components
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
      
      // Check for JSX-like tags in strings that could cause parsing issues
      // Focus on patterns that actually break things
      const dangerousStringPatterns = [
        /["']([^"']*<[A-Z][a-zA-Z]*[^>]*>[^"']*)["']/,  // React components in strings
        /["']([^"']*<\w+[^>]*[^/]>[^"']*)["']/         // Unclosed HTML tags in strings
      ];
      
      dangerousStringPatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          issues.push({
            line: idx + 1,
            content: line.trim(),
            match: matches[1],
            type: 'jsx_in_string_dangerous'
          });
        }
      });
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
    
    // Run actual TypeScript/ESLint checks if available
    try {
      // For now, focus on real syntax issues that would break compilation
      // Multi-line template literals in JSX are valid, so don't flag them
      
      // Check for actual syntax errors by looking for problematic patterns
      const lines = content.split('\n');
      let inMultiLineString = false;
      let stringDelimiter = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }
        
        // Check for actual malformed JSX (not just multi-line)
        if (trimmed.includes('<') && !trimmed.includes('//')) {
          // Look for unclosed JSX tags on the same line (excluding valid cases)
          const jsxTagPattern = /<([a-zA-Z][\w-]*)(?:[^>]*?)>/g;
          const selfClosingPattern = /<([a-zA-Z][\w-]*)(?:[^>]*?\/\s*)>/g;
          const closingTagPattern = /<\/([a-zA-Z][\w-]*)>/g;
          
          const openTags = (line.match(jsxTagPattern) || []).filter(match => !match.includes('/'));
          const selfClosingTags = line.match(selfClosingPattern) || [];
          const closingTags = line.match(closingTagPattern) || [];
          
              // Only flag if there's clearly malformed JSX on a single line
          if (openTags.length > 0 && closingTags.length === 0 && selfClosingTags.length === 0) {
            // Check if this might be a multi-line JSX element (valid)
            if (!line.includes('className=') && !line.includes('onClick=') && !line.includes('=')) {
              issues.push({
                line: i + 1,
                content: trimmed,
                type: 'potentially_malformed_jsx'
              });
            }
          }
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
        console.log(`File: ${fileError.file}`);
        fileError.issues.slice(0, 2).forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.match || issue.content}`);
          if (issue.fix_suggestion) {
            console.log(`  Fix: ${issue.fix_suggestion}`);
          }
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