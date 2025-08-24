#!/usr/bin/env node

// Generate PDF reports from HTML
// Usage: node generate-pdf-reports.js <html-file> <output-file>

const fs = require('fs');

async function main() {
  const [htmlFile, outputFile] = process.argv.slice(2);

  if (!htmlFile || !outputFile) {
    console.error('Usage: node generate-pdf-reports.js <html-file> <output-file>');
    process.exit(1);
  }

  try {
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Load HTML report
    if (fs.existsSync(htmlFile)) {
      const htmlContent = fs.readFileSync(htmlFile, 'utf8');
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: outputFile,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      });

      console.log('✅ Generated PDF report');
    } else {
      console.log('HTML report not found, skipping PDF generation');
    }

    await browser.close();
  } catch (error) {
    console.error('Error generating PDF:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
