#!/usr/bin/env node

// Generate translation coverage report
// Usage: node generate-coverage-report.js <summary-file> <output-file>

const fs = require('fs');

function main() {
  const [summaryFile, outputFile] = process.argv.slice(2);
  
  if (!summaryFile || !outputFile) {
    console.error('Usage: node generate-coverage-report.js <summary-file> <output-file>');
    process.exit(1);
  }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    
    let coverageReport = `# 📊 Translation Coverage Report\n\n`;
    coverageReport += `**Generated**: ${new Date(summary.generated).toLocaleString()}\n`;
    coverageReport += `**Report Type**: ${summary.reportType}\n\n`;
    
    coverageReport += `## 📈 Overall Statistics\n\n`;
    coverageReport += `- **Total Languages**: ${summary.statistics.totalLanguages}\n`;
    coverageReport += `- **Average Quality Score**: ${summary.statistics.averageQuality}%\n`;
    coverageReport += `- **Total Translation Keys**: ${summary.statistics.totalKeys.toLocaleString()}\n`;
    coverageReport += `- **Average Completion**: ${summary.statistics.completionPercentage}%\n\n`;
    
    coverageReport += `## 🌍 Language Breakdown\n\n`;
    coverageReport += `| Language | Quality | Completion | Cultural | Consistency | Status |\n`;
    coverageReport += `|----------|---------|------------|----------|-------------|--------|\n`;
    
    summary.languageBreakdown
      .sort((a, b) => b.quality - a.quality)
      .forEach(lang => {
        const status = lang.quality >= 80 ? '✅ Excellent' : 
                     lang.quality >= 60 ? '🟡 Good' : '❌ Needs Work';
        
        coverageReport += `| ${lang.code.toUpperCase()} | ${lang.quality}% | ${lang.completion}% | ${lang.cultural}% | ${lang.consistency}% | ${status} |\n`;
      });
    
    coverageReport += `\n## 🎯 Quality Categories\n\n`;
    
    const excellent = summary.languageBreakdown.filter(l => l.quality >= 80);
    const good = summary.languageBreakdown.filter(l => l.quality >= 60 && l.quality < 80);
    const needsWork = summary.languageBreakdown.filter(l => l.quality < 60);
    
    coverageReport += `### ✅ Excellent (80%+): ${excellent.length} languages\n`;
    if (excellent.length > 0) {
      coverageReport += excellent.map(l => `- ${l.code.toUpperCase()}: ${l.quality}%`).join('\n') + '\n';
    }
    coverageReport += `\n`;
    
    coverageReport += `### 🟡 Good (60-79%): ${good.length} languages\n`;
    if (good.length > 0) {
      coverageReport += good.map(l => `- ${l.code.toUpperCase()}: ${l.quality}%`).join('\n') + '\n';
    }
    coverageReport += `\n`;
    
    coverageReport += `### ❌ Needs Work (<60%): ${needsWork.length} languages\n`;
    if (needsWork.length > 0) {
      coverageReport += needsWork.map(l => `- ${l.code.toUpperCase()}: ${l.quality}%`).join('\n') + '\n';
    }
    
    coverageReport += `\n## 🚀 Recommendations\n\n`;
    
    if (needsWork.length > 0) {
      coverageReport += `- **Priority**: Focus on improving translations for ${needsWork.map(l => l.code.toUpperCase()).join(', ')}\n`;
    }
    
    if (summary.statistics.averageQuality < 75) {
      coverageReport += `- **Quality**: Overall quality (${summary.statistics.averageQuality}%) is below target (75%). Consider translation review.\n`;
    }
    
    if (summary.statistics.completionPercentage < 90) {
      coverageReport += `- **Completion**: Some languages have missing translations. Run translation validation to identify gaps.\n`;
    }
    
    coverageReport += `\n---\n\n`;
    coverageReport += `*This report is automatically generated. For detailed analysis, see the [Translation Dashboard](../src/components/TranslationDashboard.tsx).*\n`;
    
    fs.writeFileSync(outputFile, coverageReport);
    console.log('✅ Generated translation coverage report');
    
  } catch (error) {
    console.error('Error generating coverage report:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}