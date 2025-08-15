#!/bin/bash

# Relife PWA Lighthouse Testing Script
echo "🚀 Starting Relife PWA Lighthouse Tests..."

# Ensure the app is running
if ! curl -f http://localhost:5173 > /dev/null 2>&1; then
  echo "❌ App not running. Please start with: npm run dev"
  exit 1
fi

echo "📊 Running Lighthouse PWA audit..."

# Run Lighthouse with PWA focus
lighthouse http://localhost:5173 \
  --config-path=./lighthouse-config.json \
  --output=html,json \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless --no-sandbox" \
  --verbose

echo "✅ Lighthouse audit complete!"
echo "📄 Reports saved to:"
echo "  - lighthouse-report.html (visual report)"
echo "  - lighthouse-report.json (raw data)"

# Check PWA score
if command -v jq &> /dev/null; then
  PWA_SCORE=$(jq '.categories.pwa.score * 100' lighthouse-report.json)
  echo "🏆 PWA Score: $PWA_SCORE/100"
  
  if (( $(echo "$PWA_SCORE >= 90" | bc -l) )); then
    echo "🎉 Excellent PWA score!"
  elif (( $(echo "$PWA_SCORE >= 70" | bc -l) )); then
    echo "⚠️  Good PWA score, room for improvement"
  else
    echo "❌ PWA score needs improvement"
  fi
fi
