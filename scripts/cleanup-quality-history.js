#!/usr/bin/env node

// Clean up old quality history entries
// Usage: node cleanup-quality-history.js

const fs = require('fs');

function main() {
  try {
    const historyFile = '.github/translation-reports/history/quality-history.json';
    
    if (!fs.existsSync(historyFile)) {
      console.log('No quality history file found');
      return;
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    
    if (history.length > 100) {
      const trimmed = history.slice(-100);
      fs.writeFileSync(historyFile, JSON.stringify(trimmed, null, 2));
      console.log(`Trimmed quality history from ${history.length} to ${trimmed.length} entries`);
    } else {
      console.log(`Quality history has ${history.length} entries (no cleanup needed)`);
    }
    
  } catch (error) {
    console.error('Error cleaning up quality history:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}