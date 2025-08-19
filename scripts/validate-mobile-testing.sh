#!/bin/bash
# Mobile Testing Setup Validation Script
# Usage: ./scripts/validate-mobile-testing.sh

set -e
echo "🔧 Mobile Testing Setup Validation"
echo "=================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing $1"
        return 1
    fi
}

echo "📋 Basic Requirements"
echo "-------------------"

check_command node
check_command npm

echo ""
echo "📱 Mobile Testing Files"  
echo "----------------------"

check_file "tests/mocks/capacitor-plugins.ts"
check_file "tests/utils/mobile-test-helpers.ts"
check_file ".detoxrc.json"

echo ""
echo "🧪 npm Scripts"
echo "--------------"

if [ -f package.json ]; then
    if grep -q "test:mobile:mock" package.json; then
        echo -e "${GREEN}✓${NC} test:mobile:mock script exists"
    else
        echo -e "${RED}✗${NC} test:mobile:mock script missing"
    fi
fi

echo ""
echo "🏁 Quick Test"
echo "------------"

if USE_REAL_DEVICE=false npm run test:mobile:mock --silent 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Mock tests work!"
else
    echo -e "${YELLOW}⚠${NC} Mock tests failed"
fi

echo ""
echo "Setup validation complete! 🚀"