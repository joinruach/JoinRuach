#!/bin/bash

################################################################################
# JoinRuach.org - Security Fixes Verification Script
################################################################################
#
# This script verifies the high-priority security fixes from the launch audit:
# - H2: CSP wildcard fix (connect-src explicit allowlist)
# - H3: Cookie security validation (COOKIE_SECURE)
# - H4: HTTPS enforcement middleware
# - M1: Login page loading state
#
# Usage:
#   chmod +x scripts/verify-security-fixes.sh
#   ./scripts/verify-security-fixes.sh [production-url]
#
# Example:
#   ./scripts/verify-security-fixes.sh https://joinruach.org
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_URL="${1:-http://localhost:3000}"
API_URL="${2:-http://localhost:1337}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       JoinRuach.org - Security Fixes Verification             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Target Frontend: ${TARGET_URL}${NC}"
echo -e "${YELLOW}Target Backend:  ${API_URL}${NC}"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
function pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

function fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

function warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

function section() {
    echo ""
    echo -e "${BLUE}═══ $1 ═══${NC}"
    echo ""
}

################################################################################
# Test 1: CSP Headers (H2 - CSP Wildcard Fix)
################################################################################

section "Test 1: Content Security Policy (CSP)"

echo "Fetching CSP headers from ${TARGET_URL}..."
CSP_HEADER=$(curl -s -I "${TARGET_URL}" | grep -i "content-security-policy:" || echo "")

if [ -z "$CSP_HEADER" ]; then
    fail "CSP header not found"
else
    pass "CSP header present"

    # Check for wildcard in connect-src
    if echo "$CSP_HEADER" | grep -q "connect-src.*\*"; then
        fail "CSP connect-src contains wildcard (*) - SECURITY RISK"
        echo "   Expected: Explicit domain allowlist"
        echo "   Found:    Wildcard (*)"
    else
        pass "CSP connect-src does not contain wildcard"
    fi

    # Check for expected domains
    EXPECTED_DOMAINS=("'self'" "cdn.joinruach.org" "api.convertkit.com" "plausible.io" "upstash.io")
    for domain in "${EXPECTED_DOMAINS[@]}"; do
        if echo "$CSP_HEADER" | grep -q "$domain"; then
            pass "CSP includes $domain"
        else
            warn "CSP may be missing $domain"
        fi
    done
fi

################################################################################
# Test 2: HTTPS Enforcement (H4 - HTTPS Middleware)
################################################################################

section "Test 2: HTTPS Enforcement"

if [[ "$TARGET_URL" == https://* ]]; then
    HTTP_URL=$(echo "$TARGET_URL" | sed 's/https:/http:/')
    echo "Testing HTTP redirect: ${HTTP_URL}"

    REDIRECT_RESPONSE=$(curl -s -I -L -w "%{http_code}" -o /dev/null "$HTTP_URL" || echo "000")
    REDIRECT_LOCATION=$(curl -s -I "$HTTP_URL" | grep -i "location:" | awk '{print $2}' | tr -d '\r')

    if [ "$REDIRECT_RESPONSE" == "301" ] || [ "$REDIRECT_RESPONSE" == "302" ]; then
        pass "HTTP request redirects (${REDIRECT_RESPONSE})"

        if [[ "$REDIRECT_LOCATION" == https://* ]]; then
            pass "Redirects to HTTPS: ${REDIRECT_LOCATION}"
        else
            fail "Does not redirect to HTTPS: ${REDIRECT_LOCATION}"
        fi
    else
        warn "HTTP redirect not detected (code: ${REDIRECT_RESPONSE})"
        echo "   Note: This may be expected if running in development mode"
        echo "   HTTPS enforcement only active when NODE_ENV=production"
    fi
else
    warn "Target URL is HTTP - skipping HTTPS enforcement test"
    echo "   To test HTTPS enforcement, provide production HTTPS URL"
fi

################################################################################
# Test 3: Cookie Security (H3 - COOKIE_SECURE)
################################################################################

section "Test 3: Cookie Security Flags"

echo "Note: Cookie security can only be verified after login"
echo "This test checks if the backend is configured correctly..."

# Check if Strapi backend environment is accessible
if command -v node &> /dev/null; then
    # Check if we're in the project directory
    if [ -f "ruach-ministries-backend/src/api/auth/controllers/custom-auth.js" ]; then
        echo "Checking backend configuration..."

        # Check for COOKIE_SECURE constant
        if grep -q "COOKIE_SECURE" "ruach-ministries-backend/src/api/auth/controllers/custom-auth.js"; then
            pass "COOKIE_SECURE constant found in backend code"
        else
            fail "COOKIE_SECURE constant not found in backend code"
        fi

        # Check for validation
        if grep -q "logSecurity.*COOKIE_SECURE" "ruach-ministries-backend/src/api/auth/controllers/custom-auth.js"; then
            pass "COOKIE_SECURE validation found in backend code"
        else
            warn "COOKIE_SECURE validation not found in backend code"
        fi
    else
        warn "Backend source code not found - skipping code verification"
        echo "   Run this script from the project root directory"
    fi
else
    warn "Node.js not found - skipping code verification"
fi

echo ""
echo "Manual verification steps:"
echo "1. Login to ${TARGET_URL}/login"
echo "2. Open Browser DevTools → Application → Cookies"
echo "3. Find 'refreshToken' cookie"
echo "4. Verify flags: Secure ✓, HttpOnly ✓, SameSite=Strict ✓"

################################################################################
# Test 4: Login Page Loading State (M1)
################################################################################

section "Test 4: Login Page Loading State"

echo "Checking login page source code..."

if [ -f "apps/ruach-next/src/app/login/page.tsx" ]; then
    # Check for loading state
    if grep -q "loading.*useState" "apps/ruach-next/src/app/login/page.tsx"; then
        pass "Loading state found in login page"
    else
        fail "Loading state not found in login page"
    fi

    # Check for disabled inputs
    if grep -q "disabled={loading}" "apps/ruach-next/src/app/login/page.tsx"; then
        pass "Form inputs disabled during loading"
    else
        warn "Form inputs may not be disabled during loading"
    fi

    # Check for loading button text
    if grep -q "Signing in" "apps/ruach-next/src/app/login/page.tsx"; then
        pass "Loading button text found"
    else
        warn "Loading button text may not be present"
    fi
else
    warn "Login page source code not found"
    echo "   Run this script from the project root directory"
fi

echo ""
echo "Manual verification steps:"
echo "1. Navigate to ${TARGET_URL}/login"
echo "2. Enter credentials and click 'Login'"
echo "3. Verify button shows 'Signing in...' during submission"
echo "4. Verify form inputs are disabled during submission"

################################################################################
# Test 5: Environment Configuration
################################################################################

section "Test 5: Environment Configuration"

echo "Checking environment configuration files..."

# Check for .env.production.example
if [ -f ".env.production.example" ]; then
    pass ".env.production.example template exists"

    # Check for required variables
    REQUIRED_VARS=("NEXTAUTH_SECRET" "COOKIE_SECURE" "UPSTASH_REDIS_REST_URL" "STRIPE_SECRET_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "$var" ".env.production.example"; then
            pass "Template includes $var"
        else
            warn "Template may be missing $var"
        fi
    done
else
    fail ".env.production.example not found"
fi

# Check for deployment checklist
if [ -f "DEPLOYMENT_CHECKLIST.md" ]; then
    pass "DEPLOYMENT_CHECKLIST.md exists"
else
    warn "DEPLOYMENT_CHECKLIST.md not found"
fi

# Check for audit report
if [ -f "LAUNCH_READINESS_AUDIT.md" ]; then
    pass "LAUNCH_READINESS_AUDIT.md exists"
else
    warn "LAUNCH_READINESS_AUDIT.md not found"
fi

################################################################################
# Test 6: Security Best Practices
################################################################################

section "Test 6: Security Best Practices"

echo "Checking for common security issues..."

# Check for hardcoded secrets in source
echo "Scanning for potential hardcoded secrets..."
if grep -r -i "sk_live_" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" apps/ 2>/dev/null | grep -v "REPLACE" | grep -v "example" | grep -v ".env"; then
    fail "Potential hardcoded Stripe secret found"
else
    pass "No hardcoded Stripe secrets detected"
fi

if grep -r "password.*=.*['\"]" --include="*.ts" --include="*.js" apps/ 2>/dev/null | grep -v "placeholder" | grep -v "type=" | grep -v "Password"; then
    warn "Potential hardcoded password found (may be false positive)"
else
    pass "No obvious hardcoded passwords detected"
fi

# Check for .env files in git
if git check-ignore .env 2>/dev/null; then
    pass ".env files are gitignored"
else
    fail ".env files are NOT gitignored - CRITICAL SECURITY RISK"
fi

################################################################################
# Summary
################################################################################

section "Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo -e "${GREEN}Passed:   ${PASSED}/${TOTAL}${NC}"
echo -e "${RED}Failed:   ${FAILED}/${TOTAL}${NC}"
echo -e "${YELLOW}Warnings: ${WARNINGS}/${TOTAL}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  ✓ ALL CRITICAL TESTS PASSED                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Note: ${WARNINGS} warning(s) found. Review warnings above.${NC}"
    fi

    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    ✗ TESTS FAILED                              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}${FAILED} test(s) failed. Review failures above and fix before deploying.${NC}"
    exit 1
fi
