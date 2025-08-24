#!/usr/bin/env node

// Check notification history to prevent spam
// Usage: node check-notification-history.js <history-file> <notification-type> <critical-issues> <force-notify>

const fs = require('fs');

function main() {
  const [historyFile, notificationType, criticalIssues, forceNotify] = process.argv.slice(2);
  
  if (!historyFile || !notificationType) {
    console.error('Usage: node check-notification-history.js <history-file> <notification-type> <critical-issues> <force-notify>');
    process.exit(1);
  }

  try {
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    // Check for recent similar notifications
    const recentNotifications = history.filter(n => 
      new Date(n.timestamp) > dayAgo && 
      n.type === notificationType
    );
    
    let shouldNotify = true;
    
    // Suppress daily notifications if sent recently unless critical
    if (notificationType === 'daily-check' && recentNotifications.length > 0) {
      const hasCritical = parseInt(criticalIssues || '0') > 0;
      const isForceNotify = forceNotify === 'true';
      
      if (!hasCritical && !isForceNotify) {
        shouldNotify = false;
        console.log('ℹ️ Suppressing daily notification - sent recently and no critical issues');
      }
    }
    
    // Set GitHub output
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    fs.appendFileSync(outputFile, `should-notify=${shouldNotify}\n`);
    
    console.log('Should notify:', shouldNotify);
    
  } catch (error) {
    console.error('Error checking notification history:', error.message);
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    fs.appendFileSync(outputFile, 'should-notify=true\n');
  }
}

if (require.main === module) {
  main();
}