#!/bin/bash

# World Cup Simulator Test Runner Script
# This script runs all tests for the backend API

set -e  # Exit on any error

echo "🏆 World Cup Simulator Test Suite 🏆"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to run tests with nice output
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "${BLUE}Running ${suite_name}...${NC}"
    echo "----------------------------------------"
    
    if npm run --prefix backend ${test_command}; then
        echo -e "${GREEN}✓ ${suite_name} passed${NC}"
    else
        echo -e "${RED}✗ ${suite_name} failed${NC}"
        return 1
    fi
    echo ""
}

# Install dependencies if needed
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if test dependencies are installed
if [ ! -d "backend/node_modules/mocha" ]; then
    echo "Installing test dependencies..."
    cd backend && npm install && cd ..
fi

echo ""

# Run different test suites
echo -e "${YELLOW}Starting test execution...${NC}"
echo ""

# Unit tests
if ! run_test_suite "Unit Tests" "test:unit"; then
    echo -e "${RED}Unit tests failed. Stopping execution.${NC}"
    exit 1
fi

# Integration tests
if ! run_test_suite "Integration Tests" "test:integration"; then
    echo -e "${RED}Integration tests failed. Stopping execution.${NC}"
    exit 1
fi

# Run all tests with coverage
echo -e "${BLUE}Running all tests with coverage report...${NC}"
echo "----------------------------------------"

cd backend

# Run coverage
if npm run test:coverage; then
    echo -e "${GREEN}✓ All tests passed with coverage${NC}"
    echo ""
    
    # Display coverage summary
    echo -e "${YELLOW}Coverage Summary:${NC}"
    echo "----------------------------------------"
    
    # Extract and display coverage from c8 output
    # Note: You might need to adjust this based on c8 output format
    
else
    echo -e "${RED}✗ Tests with coverage failed${NC}"
    cd ..
    exit 1
fi

cd ..

# Final summary
echo ""
echo "===================================="
echo -e "${GREEN}🎉 All tests completed successfully! 🎉${NC}"
echo "===================================="

# Optional: Open coverage report in browser
read -p "Open coverage report in browser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "backend/coverage/lcov-report/index.html" ]; then
        open backend/coverage/lcov-report/index.html 2>/dev/null || \
        xdg-open backend/coverage/lcov-report/index.html 2>/dev/null || \
        echo "Please open backend/coverage/lcov-report/index.html manually"
    else
        echo "Coverage report not found"
    fi
fi

exit 0