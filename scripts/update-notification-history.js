#!/usr/bin/env node

// Update notification history
// Usage: node update-notification-history.js <notification-file> <history-file> <test-mode> <run-id>

const fs = require('fs');

function main() {
  const [notificationFile, historyFile, testMode, runId] = process.argv.slice(2);

  if (!notificationFile || !historyFile) {
    console.error(
      'Usage: node update-notification-history.js <notification-file> <history-file> <test-mode> <run-id>'
    );
    process.exit(1);
  }

  try {
    const notification = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));

    // Load existing history
    let history = [];
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    // Add to history
    const historyEntry = {
      timestamp: notification.timestamp,
      type: notification.type,
      title: notification.title,
      urgency: notification.urgency,
      sent: testMode !== 'true',
      runId: runId || process.env.GITHUB_RUN_ID,
      summary: notification.data?.summary || {},
    };

    history.push(historyEntry);

    // Keep only last 50 notifications
    if (history.length > 50) {
      history = history.slice(-50);
    }

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    console.log('✅ Updated notification history');
  } catch (error) {
    console.error('Error updating history:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
