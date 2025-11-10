#!/bin/bash

#######################################################################
# Ruach Monorepo Test Matrix Runner
#
# Comprehensive test suite that runs all tests across the monorepo
# and generates coverage reports.
#
# Usage:
#   ./scripts/test-matrix.sh           # Run all tests
#   ./scripts/test-matrix.sh --unit    # Run only unit tests
#   ./scripts/test-matrix.sh --e2e     # Run only E2E tests
#   ./scripts/test-matrix.sh --coverage # Run with coverage reporting
#######################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUN_UNIT=true
RUN_E2E=true
RUN_COVERAGE=false
VERBOSE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --unit) RUN_E2E=false ;;
        --e2e) RUN_UNIT=false ;;
        --coverage) RUN_COVERAGE=true ;;
        --verbose) VERBOSE=true ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --unit        Run only unit tests"
            echo "  --e2e         Run only E2E tests"
            echo "  --coverage    Generate coverage reports"
            echo "  --verbose     Enable verbose output"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Print header
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Ruach Monorepo Test Matrix                          ║${NC}"
echo -e "${BLUE}║  Target: 100% Coverage                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Track results
FAILED_TESTS=()
PASSED_TESTS=()

#######################################################################
# Helper Functions
#######################################################################

run_test() {
    local name="$1"
    local command="$2"

    echo -e "${YELLOW}▶ Running: ${name}${NC}"
    echo "  Command: $command"
    echo ""

    if $VERBOSE; then
        if eval "$command"; then
            echo -e "${GREEN}✓ ${name} - PASSED${NC}"
            PASSED_TESTS+=("$name")
            return 0
        else
            echo -e "${RED}✗ ${name} - FAILED${NC}"
            FAILED_TESTS+=("$name")
            return 1
        fi
    else
        if eval "$command" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ ${name} - PASSED${NC}"
            PASSED_TESTS+=("$name")
            return 0
        else
            echo -e "${RED}✗ ${name} - FAILED${NC}"
            FAILED_TESTS+=("$name")
            return 1
        fi
    fi

    echo ""
}

#######################################################################
# Unit Tests
#######################################################################

if $RUN_UNIT; then
    echo -e "${BLUE}═══ Unit Tests ═══${NC}"
    echo ""

    # Run tests for each package
    if $RUN_COVERAGE; then
        run_test "Next.js App Tests" "pnpm --filter ruach-next test:coverage" || true
        run_test "Strapi Backend Tests" "pnpm --filter ruach-ministries-backend test:coverage" || true
        run_test "@ruach/components Tests" "pnpm --filter @ruach/components test:coverage" || true
        run_test "@ruach/addons Tests" "pnpm --filter @ruach/addons test:coverage" || true
    else
        run_test "Next.js App Tests" "pnpm --filter ruach-next test" || true
        run_test "Strapi Backend Tests" "pnpm --filter ruach-ministries-backend test" || true
        run_test "@ruach/components Tests" "pnpm --filter @ruach/components test" || true
        run_test "@ruach/addons Tests" "pnpm --filter @ruach/addons test" || true
    fi

    echo ""
fi

#######################################################################
# E2E Tests
#######################################################################

if $RUN_E2E; then
    echo -e "${BLUE}═══ E2E Tests ═══${NC}"
    echo ""

    # Check if Playwright is installed
    if ! command -v playwright &> /dev/null; then
        echo -e "${YELLOW}⚠ Playwright not found. Installing...${NC}"
        npx playwright install --with-deps chromium
    fi

    run_test "Playwright E2E Tests" "pnpm test:e2e" || true

    echo ""
fi

#######################################################################
# Coverage Reports
#######################################################################

if $RUN_COVERAGE; then
    echo -e "${BLUE}═══ Coverage Summary ═══${NC}"
    echo ""

    # Check for coverage directories
    if [ -d "coverage" ]; then
        echo -e "${GREEN}✓ Root coverage reports generated${NC}"
    fi

    if [ -d "apps/ruach-next/coverage" ]; then
        echo -e "${GREEN}✓ Next.js coverage reports generated${NC}"
    fi

    if [ -d "ruach-ministries-backend/coverage" ]; then
        echo -e "${GREEN}✓ Backend coverage reports generated${NC}"
    fi

    if [ -d "packages/ruach-components/coverage" ]; then
        echo -e "${GREEN}✓ Components coverage reports generated${NC}"
    fi

    if [ -d "packages/ruach-next-addons/coverage" ]; then
        echo -e "${GREEN}✓ Addons coverage reports generated${NC}"
    fi

    echo ""
    echo -e "${BLUE}Coverage reports available at:${NC}"
    echo "  - coverage/index.html"
    echo "  - apps/ruach-next/coverage/index.html"
    echo "  - ruach-ministries-backend/coverage/index.html"
    echo "  - packages/ruach-components/coverage/index.html"
    echo "  - packages/ruach-next-addons/coverage/index.html"
    echo ""
fi

#######################################################################
# Summary
#######################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}║  Test Summary                                         ║${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
    echo -e "${GREEN}✓ Passed Tests: ${#PASSED_TESTS[@]}${NC}"
    for test in "${PASSED_TESTS[@]}"; do
        echo -e "  ${GREEN}✓${NC} $test"
    done
    echo ""
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}✗ Failed Tests: ${#FAILED_TESTS[@]}${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  All tests passed! 🎉                                 ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
fi
