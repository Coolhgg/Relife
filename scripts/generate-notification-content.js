#!/usr/bin/env node

// Generate notification content for translation monitoring
// Usage: node generate-notification-content.js <quality-status> <average-quality> <trend> <monitoring-type> <languages-below>

const fs = require('fs');

function main() {
  const [qualityStatus, averageQuality, trend, monitoringType, languagesBelow] =
    process.argv.slice(2);

  if (!qualityStatus || !averageQuality) {
    console.error(
      'Usage: node generate-notification-content.js <quality-status> <average-quality> <trend> <monitoring-type> <languages-below>'
    );
    process.exit(1);
  }

  try {
    let languages = [];
    try {
      languages = JSON.parse(languagesBelow || '[]');
    } catch (e) {
      languages = [];
    }

    let content = `# 🌐 Translation Quality Monitoring Alert

## 📊 Current Status
Quality Status: ${qualityStatus}  
Average Quality: ${averageQuality}%  
Trend: ${trend}  
Monitoring Type: ${monitoringType}

## 📈 Summary
The automated translation quality monitoring has detected the following:

`;

    // Add status-specific content
    switch (qualityStatus) {
      case 'needs-attention':
        content += `⚠️ **Immediate attention required**: Translation quality has fallen below acceptable thresholds.

### Action Items:
- Review translations in languages scoring below 75%
- Check for cultural sensitivity issues
- Verify terminology consistency
- Consider translator training or tooling improvements

`;
        break;
      case 'good':
        content += `🟡 **Minor issues detected**: Overall quality is good but some improvements are needed.

### Recommendations:
- Review flagged translations during next maintenance window
- Address consistency issues when convenient
- Continue current translation practices

`;
        break;
    }

    // Add trend information
    switch (trend) {
      case 'declining':
        content +=
          '📉 **Trend Alert**: Quality has been declining recently. Consider investigating root causes.\n\n';
        break;
      case 'improving':
        content +=
          '📈 **Positive Trend**: Quality is improving! Current practices are effective.\n\n';
        break;
    }

    if (languages.length > 0) {
      content += `### Languages Needing Attention:
${languages.map(lang => `- ${lang.toUpperCase()}`).join('\n')}

`;
    }

    content += `## 🔗 Resources
- [View Detailed Report](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})
- [Translation Dashboard](https://github.com/${process.env.GITHUB_REPOSITORY}/blob/main/src/components/TranslationDashboard.tsx)
- [Translation Guidelines](https://github.com/${process.env.GITHUB_REPOSITORY}/blob/main/TRANSLATION_GUIDELINES.md)

*This is an automated notification from the translation quality monitoring system.*`;

    fs.writeFileSync('notification-content.md', content);
    console.log('✅ Generated notification content');
  } catch (error) {
    console.error('Error generating notification content:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
