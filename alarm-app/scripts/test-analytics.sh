#!/bin/bash

# Analytics & Crash Reporting Test Runner
# Provides convenient commands for running analytics tests with various options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
COVERAGE=false
WATCH=false
VERBOSE=false
UPDATE_SNAPSHOTS=false
SPECIFIC_TEST=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage|-c)
      COVERAGE=true
      shift
      ;;
    --watch|-w)
      WATCH=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --update-snapshots|-u)
      UPDATE_SNAPSHOTS=true
      shift
      ;;
    --test|-t)
      SPECIFIC_TEST="$2"
      shift 2
      ;;
    --help|-h)
      echo -e "${BLUE}Analytics Test Runner${NC}"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -c, --coverage           Run tests with coverage report"
      echo "  -w, --watch             Run tests in watch mode"
      echo "  -v, --verbose           Run tests with verbose output"
      echo "  -u, --update-snapshots  Update test snapshots"
      echo "  -t, --test <pattern>    Run specific test file or pattern"
      echo "  -h, --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                      # Run all analytics tests"
      echo "  $0 -c                   # Run with coverage"
      echo "  $0 -w                   # Run in watch mode"
      echo "  $0 -t analytics-config  # Run specific test"
      echo "  $0 -c -v               # Coverage with verbose output"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🧪 Analytics & Crash Reporting Test Suite${NC}"
echo ""

# Change to project directory
cd "$(dirname "$0")/.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  npm install
fi

# Build test command
TEST_CMD="npm test"

# Add test path for analytics services
TEST_PATH="src/services/__tests__"

# Add specific test if provided
if [ -n "$SPECIFIC_TEST" ]; then
  TEST_PATH="${TEST_PATH}/${SPECIFIC_TEST}"
  echo -e "${YELLOW}🎯 Running specific test: ${SPECIFIC_TEST}${NC}"
fi

# Build Jest options
JEST_OPTIONS=""

if [ "$COVERAGE" = true ]; then
  JEST_OPTIONS="${JEST_OPTIONS} --coverage"
  JEST_OPTIONS="${JEST_OPTIONS} --collectCoverageFrom=src/services/**/*.{ts,tsx}"
  JEST_OPTIONS="${JEST_OPTIONS} --coverageDirectory=coverage/analytics"
  JEST_OPTIONS="${JEST_OPTIONS} --coverageReporters=text,lcov,html"
  echo -e "${GREEN}📊 Coverage reporting enabled${NC}"
fi

if [ "$WATCH" = true ]; then
  JEST_OPTIONS="${JEST_OPTIONS} --watch"
  echo -e "${YELLOW}👀 Watch mode enabled${NC}"
fi

if [ "$VERBOSE" = true ]; then
  JEST_OPTIONS="${JEST_OPTIONS} --verbose"
  echo -e "${BLUE}📝 Verbose output enabled${NC}"
fi

if [ "$UPDATE_SNAPSHOTS" = true ]; then
  JEST_OPTIONS="${JEST_OPTIONS} --updateSnapshot"
  echo -e "${YELLOW}📸 Updating snapshots${NC}"
fi

# Set test environment
export NODE_ENV=test
export REACT_APP_ENVIRONMENT=test

echo ""
echo -e "${GREEN}🚀 Running analytics tests...${NC}"
echo ""

# Run the tests
if [ -n "$JEST_OPTIONS" ]; then
  ${TEST_CMD} ${TEST_PATH} -- ${JEST_OPTIONS}
else
  ${TEST_CMD} ${TEST_PATH}
fi

TEST_EXIT_CODE=$?

echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All analytics tests passed!${NC}"
  
  if [ "$COVERAGE" = true ]; then
    echo ""
    echo -e "${BLUE}📊 Coverage report generated in: coverage/analytics/${NC}"
    echo -e "${BLUE}   Open coverage/analytics/lcov-report/index.html in your browser${NC}"
  fi
  
  echo ""
  echo -e "${BLUE}📋 Test Summary:${NC}"
  echo -e "   • Unit tests: AnalyticsConfig, Privacy, Sentry, Analytics, App, Performance"
  echo -e "   • Integration tests: Cross-service communication and workflows"
  echo -e "   • Test setup: Comprehensive mocking and utilities"
  echo ""
  
else
  echo -e "${RED}❌ Some tests failed!${NC}"
  echo ""
  echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
  echo -e "   • Check mock setup in test-setup.ts"
  echo -e "   • Verify singleton instance resets"
  echo -e "   • Ensure async operations are properly awaited"
  echo -e "   • Check for timer-related issues (use jest.useFakeTimers())"
  echo ""
  
  if [ "$VERBOSE" != true ]; then
    echo -e "${BLUE}   Run with -v flag for verbose output${NC}"
  fi
fi

echo -e "${BLUE}📚 For more information, see: src/services/__tests__/README.md${NC}"
echo ""

exit $TEST_EXIT_CODE