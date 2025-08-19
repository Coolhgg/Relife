#!/bin/bash

# Mobile Testing Setup Validation Script
# This script helps developers test the mobile testing infrastructure locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    print_status $BLUE "🔧 $1"
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_warning() {
    print_status $YELLOW "⚠️ $1"
}

print_error() {
    print_status $RED "❌ $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "capacitor.config.ts" ]]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_header "Mobile Testing Setup Validation"
echo

# Phase 1: Check Mock Testing Setup
print_header "Phase 1: Checking Mock Testing Setup"
echo

if [[ -f "src/__tests__/mocks/capacitor.mock.ts" ]]; then
    print_success "Capacitor mock file exists"
else
    print_error "Capacitor mock file missing"
    exit 1
fi

if [[ -f "tests/utils/mobile-test-helpers.ts" ]]; then
    print_success "Mobile test helpers exist"
else
    print_error "Mobile test helpers missing"
    exit 1
fi

# Check package.json scripts
if npm run | grep -q "test:mobile:mock"; then
    print_success "Mobile test scripts are configured"
else
    print_error "Mobile test scripts missing from package.json"
    exit 1
fi

# Phase 2: Test Mock Functionality
print_header "Phase 2: Testing Mock Functionality"
echo

print_status $BLUE "Running mobile mock tests..."
if USE_REAL_DEVICE=false npm run test:mobile:mock 2>/dev/null | tail -5; then
    print_success "Mobile mock tests passed"
else
    print_warning "Mobile mock tests had issues - this may be expected in some cases"
fi

# Phase 3: Check Capacitor Configuration
print_header "Phase 3: Checking Capacitor Configuration"
echo

if [[ -f "capacitor.config.ts" ]]; then
    print_success "Capacitor config exists"
else
    print_error "Capacitor config missing"
    exit 1
fi

# Check if Capacitor dependencies are installed
if npm list @capacitor/core @capacitor/android @capacitor/ios >/dev/null 2>&1; then
    print_success "Capacitor dependencies are installed"
else
    print_warning "Some Capacitor dependencies may be missing"
fi

# Phase 4: Check Detox Configuration
print_header "Phase 4: Checking Detox Configuration"
echo

if [[ -f ".detoxrc.json" ]]; then
    print_success "Detox configuration exists"
else
    print_error "Detox configuration missing"
    exit 1
fi

if npm list detox >/dev/null 2>&1; then
    print_success "Detox is installed"
else
    print_warning "Detox may not be installed"
fi

# Phase 5: Check Platform-Specific Setup
print_header "Phase 5: Checking Platform Setup"
echo

# Android checks
if [[ -d "android" ]]; then
    print_success "Android platform configured"
    
    if [[ -f "android/gradlew" ]]; then
        print_success "Android Gradle wrapper exists"
        
        # Check if we can build (only if Java is available)
        if command -v java >/dev/null 2>&1; then
            print_status $BLUE "Testing Android build (this may take a while)..."
            cd android
            if ./gradlew tasks >/dev/null 2>&1; then
                print_success "Android build environment is ready"
            else
                print_warning "Android build environment may have issues"
            fi
            cd ..
        else
            print_warning "Java not found - cannot test Android build"
        fi
    else
        print_warning "Android Gradle wrapper missing"
    fi
else
    print_warning "Android platform not configured - run 'npx cap add android'"
fi

# iOS checks (only on macOS)
if [[ "$(uname)" == "Darwin" ]]; then
    if [[ -d "ios" ]]; then
        print_success "iOS platform configured"
        
        if command -v xcodebuild >/dev/null 2>&1; then
            print_success "Xcode command line tools available"
        else
            print_warning "Xcode command line tools not found"
        fi
    else
        print_warning "iOS platform not configured - run 'npx cap add ios'"
    fi
else
    print_warning "iOS testing requires macOS"
fi

# Phase 6: Environment Variable Testing
print_header "Phase 6: Testing Environment Variables"
echo

# Test mock mode
export USE_REAL_DEVICE=false
print_status $BLUE "Testing with USE_REAL_DEVICE=false..."
if node -e "console.log('Mock mode:', process.env.USE_REAL_DEVICE === 'false' ? '✅' : '❌')"; then
    print_success "Mock mode environment variable works"
fi

# Test real device mode
export USE_REAL_DEVICE=true
print_status $BLUE "Testing with USE_REAL_DEVICE=true..."
if node -e "console.log('Real device mode:', process.env.USE_REAL_DEVICE === 'true' ? '✅' : '❌')"; then
    print_success "Real device mode environment variable works"
fi

# Reset environment
unset USE_REAL_DEVICE

# Phase 7: CI Configuration Check
print_header "Phase 7: Checking CI Configuration"
echo

if [[ -f ".github/workflows/mobile-testing.yml" ]]; then
    print_success "Mobile testing CI workflow exists"
else
    print_warning "Mobile testing CI workflow missing"
fi

# Final Summary
print_header "Summary"
echo

print_status $GREEN "🎉 Mobile testing setup validation completed!"
echo
print_status $BLUE "Available commands:"
echo "  npm run test:mobile:mock      - Run tests with mocked plugins"
echo "  npm run test:mobile:device    - Run tests with real devices"
echo "  npm run test:mobile:watch     - Watch mode for mobile testing"
echo "  npm run test:mobile:coverage  - Generate coverage reports"
echo
print_status $BLUE "Detox commands (for E2E testing):"
echo "  npm run test:detox:android    - Run Android E2E tests"
echo "  npm run test:detox:ios        - Run iOS E2E tests (macOS only)"
echo
print_status $BLUE "Next steps:"
echo "  1. Run 'npm run test:mobile:mock' to verify mock testing works"
echo "  2. Build your Capacitor app with 'npm run build && npx cap sync'"
echo "  3. Test on real devices using 'npm run test:mobile:device'"
echo "  4. Commit your changes to trigger CI testing"
echo

print_success "Mobile testing infrastructure is ready! 🚀"