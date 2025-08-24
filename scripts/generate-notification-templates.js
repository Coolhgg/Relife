#!/usr/bin/env node

// Generate notification templates for translation monitoring
// Usage: node generate-notification-templates.js <notification-data-file> <notification-type> <critical-issues>

const fs = require('fs');

function main() {
  const [dataFile, notificationType, criticalIssues] = process.argv.slice(2);
  
  if (!dataFile || !notificationType) {
    console.error('Usage: node generate-notification-templates.js <notification-data-file> <notification-type> <critical-issues>');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const critical = parseInt(criticalIssues || '0');
    
    console.log('Generating notification for type:', notificationType);
    
    let title = '';
    let content = '';
    let urgency = 'normal';
    
    switch (notificationType) {
      case 'daily-check':
        if (critical > 0) {
          title = '🚨 Critical Translation Issues Detected';
          urgency = 'high';
          content = `# 🚨 Critical Translation Issues Detected

**Date**: ${new Date(data.timestamp).toLocaleDateString()}

## ⚠️ Immediate Attention Required

**Critical Languages**: ${critical} languages have quality scores below 50%

${data.criticalLanguages.map(lang => `- **${lang.language.toUpperCase()}**: ${lang.quality}% quality`).join('\n')}

## 📊 Summary
- Total Languages: ${data.summary.totalLanguages}
- Average Quality: ${data.summary.averageQuality}%
- Below Threshold: ${data.summary.belowThreshold}
- Critical Issues: ${data.summary.critical}

## 🚀 Immediate Actions Needed
1. Review and fix critical quality issues in flagged languages
2. Check for cultural sensitivity problems
3. Validate translation consistency
4. Consider emergency translation review

## 🔗 Resources
- [Translation Dashboard](./src/components/TranslationDashboard.tsx)
- [Advanced Validation Tools](./scripts/advanced-translation-manager.mjs)
- [Translation Guidelines](./TRANSLATION_GUIDELINES.md)

*This is an urgent automated alert from the translation monitoring system.*`;
        } else if (data.summary.belowThreshold > 0) {
          title = '⚠️ Translation Quality Alert';
          content = `# ⚠️ Translation Quality Alert

**Date**: ${new Date(data.timestamp).toLocaleDateString()}

## 📊 Quality Issues Detected

${data.summary.belowThreshold} languages are below the quality threshold (${process.env.MIN_QUALITY_THRESHOLD || 70}%):

${data.alerts.map(alert => `- **${alert.language.toUpperCase()}**: ${alert.quality}% quality${alert.issues > 0 ? ` (${alert.issues} critical issues)` : ''}`).join('\n')}

## 🔍 Recommendations
- Schedule translation review for flagged languages
- Address cultural sensitivity issues
- Improve terminology consistency
- Update translation documentation

## 📈 Overall Status
- Average Quality: ${data.summary.averageQuality}%
- Total Languages: ${data.summary.totalLanguages}

[View Detailed Analysis](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`;
        }
        break;
        
      case 'weekly-summary':
        title = '📊 Weekly Translation Summary';
        content = `# 📊 Weekly Translation Summary

**Week of**: ${new Date(data.timestamp).toLocaleDateString()}

## 🎯 Key Metrics
- **Total Languages**: ${data.summary.totalLanguages}
- **Average Quality**: ${data.summary.averageQuality}%
- **Languages Needing Attention**: ${data.summary.belowThreshold}
- **Stale Translations**: ${data.summary.stale}
`;

        if (data.summary.critical > 0) {
          content += `
## 🚨 Critical Issues
${data.criticalLanguages.map(lang => `- ${lang.language.toUpperCase()}: ${lang.quality}%`).join('\n')}
`;
        }

        if (data.summary.stale > 0) {
          content += `
## 🔧 Maintenance Needed
The following languages haven't been updated recently:
${data.staleLanguages.slice(0, 5).map(lang => `- ${lang.language.toUpperCase()}: Last updated ${lang.lastUpdate ? new Date(lang.lastUpdate).toLocaleDateString() : 'Unknown'}`).join('\n')}
${data.staleLanguages.length > 5 ? `\n*... and ${data.staleLanguages.length - 5} more*` : ''}
`;
        }

        content += `
## 🚀 Next Steps
${data.summary.critical > 0 ? '1. **Priority**: Address critical quality issues\n' : ''}${data.summary.belowThreshold > 0 ? '2. Review languages below quality threshold\n' : ''}${data.summary.stale > 3 ? '3. Update stale translations\n' : ''}4. Continue regular monitoring

## 📊 Resources
- [Weekly Report](./docs/translation-reports/)
- [Translation Dashboard](./src/components/TranslationDashboard.tsx)
- [Quality Guidelines](./TRANSLATION_GUIDELINES.md)

*Automated weekly summary from translation monitoring system*`;
        break;
        
      case 'monthly-maintenance':
        title = '🔧 Monthly Translation Maintenance';
        content = `# 🔧 Monthly Translation Maintenance Reminder

**Month**: ${new Date(data.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}

## 📋 Maintenance Checklist

### 🎯 Quality Review
- [ ] Review languages with quality scores below 80%
- [ ] Address cultural sensitivity issues
- [ ] Check terminology consistency across languages
- [ ] Validate translation completeness

### 🔄 Updates
- [ ] Update outdated translations
- [ ] Review new feature translations
- [ ] Sync translation keys across all languages
- [ ] Validate translation file formatting

### 🧹 Housekeeping
- [ ] Archive old translation reports
- [ ] Update translation contributor credits
- [ ] Review and update translation guidelines
- [ ] Clean up unused translation keys

### 📊 Current Status
- **Languages**: ${data.summary.totalLanguages}
- **Average Quality**: ${data.summary.averageQuality}%
- **Completion**: Based on latest analysis

### 🎯 Focus Areas This Month
${data.summary.belowThreshold > 0 ? `- Improve quality in ${data.summary.belowThreshold} languages\n` : ''}${data.summary.stale > 0 ? `- Update ${data.summary.stale} stale translations\n` : ''}- Continue regular quality monitoring
- Enhance cultural adaptation where needed

## 🔗 Tools & Resources
- [Translation Manager Script](./scripts/advanced-translation-manager.mjs)
- [Quality Dashboard](./src/components/TranslationDashboard.tsx)
- [Contributor Guidelines](./TRANSLATION_GUIDELINES.md)
- [Quick Start Guide](./docs/TRANSLATOR_QUICK_START.md)

*Monthly maintenance reminder from translation monitoring system*`;
        break;
    }
    
    if (!title || !content) {
      console.log('No notification content generated for type:', notificationType);
      return;
    }
    
    // Save notification content
    const notification = {
      title,
      content,
      type: notificationType,
      urgency,
      timestamp: data.timestamp,
      data: data
    };
    
    fs.writeFileSync(process.env.NOTIFICATIONS_DIR + '/notification.json', JSON.stringify(notification, null, 2));
    fs.writeFileSync(process.env.NOTIFICATIONS_DIR + '/notification-content.md', content);
    
    console.log('✅ Generated notification:', title);
    console.log('Urgency level:', urgency);
    
  } catch (error) {
    console.error('Error generating notification templates:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}