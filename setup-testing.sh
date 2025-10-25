#!/bin/bash

# Testing Infrastructure Setup Script
# Run this script to install all testing dependencies

set -e

echo "🧪 Setting up Testing Infrastructure for Ruach Monorepo"
echo "======================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}Step 1: Installing Frontend Testing Dependencies${NC}"
cd apps/ruach-next
pnpm add -D \
  jest@^29.7.0 \
  @testing-library/react@^14.1.2 \
  @testing-library/jest-dom@^6.1.5 \
  @testing-library/user-event@^14.5.1 \
  jest-environment-jsdom@^29.7.0 \
  @types/jest@^29.5.11 \
  ts-jest@^29.1.1

echo ""
echo -e "${GREEN}✓${NC} Frontend testing dependencies installed"

echo ""
echo -e "${YELLOW}Step 2: Installing Backend Testing Dependencies${NC}"
cd ../../ruach-ministries-backend
pnpm add -D \
  jest@^29.7.0 \
  @types/jest@^29.5.11 \
  ts-jest@^29.1.1 \
  supertest@^6.3.3 \
  @types/supertest@^6.0.2

echo ""
echo -e "${GREEN}✓${NC} Backend testing dependencies installed"

echo ""
echo -e "${YELLOW}Step 3: Installing E2E Testing Dependencies${NC}"
cd ..
pnpm add -D -w \
  @playwright/test@^1.40.1 \
  playwright@^1.40.1

echo ""
echo -e "${GREEN}✓${NC} Playwright installed"

echo ""
echo -e "${YELLOW}Step 4: Installing Playwright Browsers${NC}"
npx playwright install chromium firefox webkit

echo ""
echo -e "${GREEN}✓${NC} Playwright browsers installed"

echo ""
echo "======================================================="
echo -e "${GREEN}✅ Testing infrastructure setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run tests: pnpm test"
echo "  2. Run tests with coverage: pnpm test:coverage"
echo "  3. Run E2E tests: pnpm test:e2e"
echo "  4. Run tests in watch mode: pnpm test:watch"
echo ""
