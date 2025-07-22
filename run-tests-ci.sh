#!/bin/bash

# CI/CD Test Runner Script
# Simplified version for automated environments

set -e

echo "Running World Cup Simulator Tests..."

# Navigate to backend
cd backend

# Install dependencies
npm ci

# Run all tests
npm test

# Run coverage
npm run test:coverage

echo "All tests passed!"

exit 0