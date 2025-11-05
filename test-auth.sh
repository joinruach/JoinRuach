#!/bin/bash

###############################################################################
# JoinRuach Authentication System Test Suite
# Tests all authentication improvements from M2-M6 and H1-H4
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NEXT_URL="${NEXT_URL:-http://localhost:3000}"
STRAPI_URL="${STRAPI_URL:-http://localhost:1337}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo "====================================================================="
echo "  JoinRuach Authentication Test Suite"
echo "====================================================================="
echo ""
echo "Testing against:"
echo "  Next.js: $NEXT_URL"
echo "  Strapi:  $STRAPI_URL"
echo ""

###############################################################################
# Test 1: Signup Flow with Rate Limiting (M5)
###############################################################################
echo -e "${YELLOW}Test 1: Signup Flow with Rate Limiting${NC}"
echo "-----------------------------------------------------------------------"

echo "1.1 Testing signup endpoint..."
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$NEXT_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Signup successful${NC}"
  echo "  Response: $RESPONSE_BODY"
else
  echo -e "${RED}✗ Signup failed with code $HTTP_CODE${NC}"
  echo "  Response: $RESPONSE_BODY"
fi

echo ""
echo "1.2 Testing signup rate limiting (should fail after 5 attempts)..."
for i in {1..6}; do
  RATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$NEXT_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"ratelimit-$i@example.com\",\"password\":\"$TEST_PASSWORD\"}")

  RATE_CODE=$(echo "$RATE_RESPONSE" | tail -n1)

  if [ "$i" -le 5 ]; then
    if [ "$RATE_CODE" = "200" ] || [ "$RATE_CODE" = "400" ]; then
      echo -e "  ${GREEN}✓ Attempt $i: Allowed (code: $RATE_CODE)${NC}"
    else
      echo -e "  ${RED}✗ Attempt $i: Unexpected code $RATE_CODE${NC}"
    fi
  else
    if [ "$RATE_CODE" = "429" ]; then
      echo -e "  ${GREEN}✓ Attempt $i: Rate limited (code: 429)${NC}"
    else
      echo -e "  ${RED}✗ Attempt $i: Expected 429, got $RATE_CODE${NC}"
    fi
  fi
done

echo ""

###############################################################################
# Test 2: Login Flow with Rate Limiting (H1)
###############################################################################
echo -e "${YELLOW}Test 2: Login Flow with Rate Limiting${NC}"
echo "-----------------------------------------------------------------------"

echo "2.1 Testing login with invalid credentials (rate limiting)..."
for i in {1..4}; do
  LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$STRAPI_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"identifier\":\"$TEST_EMAIL\",\"password\":\"WrongPassword\"}")

  LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
  echo -e "  Attempt $i: Code $LOGIN_CODE"
  sleep 1
done

echo ""
echo "2.2 Testing Strapi backend rate limiting headers..."
HEADERS=$(curl -s -D - -X POST "$STRAPI_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"test@example.com\",\"password\":\"wrong\"}" \
  -o /dev/null)

if echo "$HEADERS" | grep -q "X-RateLimit-Limit"; then
  echo -e "${GREEN}✓ Rate limit headers present${NC}"
  echo "$HEADERS" | grep "X-RateLimit" || true
else
  echo -e "${RED}✗ Rate limit headers missing${NC}"
fi

echo ""

###############################################################################
# Test 3: Security Headers (H2, H4)
###############################################################################
echo -e "${YELLOW}Test 3: Security Headers (CSP, HTTPS)${NC}"
echo "-----------------------------------------------------------------------"

echo "3.1 Testing Content-Security-Policy header..."
CSP_HEADER=$(curl -s -D - "$NEXT_URL" -o /dev/null | grep -i "Content-Security-Policy" || echo "NOT FOUND")

if [[ "$CSP_HEADER" != "NOT FOUND" ]]; then
  echo -e "${GREEN}✓ CSP header present${NC}"
  echo "  $CSP_HEADER"

  # Check for wildcard
  if echo "$CSP_HEADER" | grep -q "connect-src.*\*"; then
    echo -e "${RED}✗ WARNING: Wildcard found in connect-src${NC}"
  else
    echo -e "${GREEN}✓ No wildcards in connect-src${NC}"
  fi
else
  echo -e "${RED}✗ CSP header missing${NC}"
fi

echo ""
echo "3.2 Testing HTTPS enforcement (middleware check)..."
if [ -f "apps/ruach-next/src/middleware.ts" ]; then
  if grep -q "x-forwarded-proto" "apps/ruach-next/src/middleware.ts"; then
    echo -e "${GREEN}✓ HTTPS enforcement middleware present in Next.js${NC}"
  else
    echo -e "${RED}✗ HTTPS enforcement not found in Next.js${NC}"
  fi
else
  echo -e "${YELLOW}⚠ middleware.ts not found${NC}"
fi

if [ -f "ruach-ministries-backend/src/middlewares/https-enforce.js" ]; then
  echo -e "${GREEN}✓ HTTPS enforcement middleware present in Strapi${NC}"
else
  echo -e "${RED}✗ HTTPS enforcement middleware missing in Strapi${NC}"
fi

echo ""

###############################################################################
# Test 4: Session Management (M2, M3)
###############################################################################
echo -e "${YELLOW}Test 4: Session Management & Idle Timeout${NC}"
echo "-----------------------------------------------------------------------"

echo "4.1 Checking session timeout configuration..."
if grep -q "IDLE_TIMEOUT.*30.*60.*1000" "apps/ruach-next/src/lib/auth.ts"; then
  echo -e "${GREEN}✓ Idle timeout set to 30 minutes${NC}"
else
  echo -e "${RED}✗ Idle timeout configuration not found${NC}"
fi

echo ""
echo "4.2 Checking activity tracking hooks..."
if [ -f "apps/ruach-next/src/hooks/useActivityTracker.ts" ]; then
  echo -e "${GREEN}✓ Activity tracker hook exists${NC}"
else
  echo -e "${RED}✗ Activity tracker hook missing${NC}"
fi

if [ -f "apps/ruach-next/src/hooks/useSessionExpiry.ts" ]; then
  echo -e "${GREEN}✓ Session expiry hook exists${NC}"
else
  echo -e "${RED}✗ Session expiry hook missing${NC}"
fi

echo ""
echo "4.3 Checking SessionChecker component..."
if [ -f "apps/ruach-next/src/components/SessionChecker.tsx" ]; then
  echo -e "${GREEN}✓ SessionChecker component exists${NC}"

  # Check for error handling
  if grep -q "IdleTimeout" "apps/ruach-next/src/components/SessionChecker.tsx"; then
    echo -e "${GREEN}✓ IdleTimeout error handling implemented${NC}"
  fi

  if grep -q "RefreshAccessTokenError" "apps/ruach-next/src/components/SessionChecker.tsx"; then
    echo -e "${GREEN}✓ Token refresh error handling implemented${NC}"
  fi
else
  echo -e "${RED}✗ SessionChecker component missing${NC}"
fi

echo ""

###############################################################################
# Test 5: Redis Integration (H1)
###############################################################################
echo -e "${YELLOW}Test 5: Redis Integration${NC}"
echo "-----------------------------------------------------------------------"

echo "5.1 Checking Redis client..."
if [ -f "ruach-ministries-backend/src/services/redis-client.js" ]; then
  echo -e "${GREEN}✓ Redis client service exists${NC}"

  # Check for Upstash support
  if grep -q "UPSTASH_REDIS_REST" "ruach-ministries-backend/src/services/redis-client.js"; then
    echo -e "${GREEN}✓ Upstash REST API support present${NC}"
  fi
else
  echo -e "${RED}✗ Redis client missing${NC}"
fi

echo ""
echo "5.2 Checking Redis usage in services..."

SERVICES=("token-blacklist.js" "refresh-token-store.js" "rate-limiter.js")
for service in "${SERVICES[@]}"; do
  if [ -f "ruach-ministries-backend/src/services/$service" ]; then
    if grep -q "redisClient" "ruach-ministries-backend/src/services/$service"; then
      echo -e "${GREEN}✓ $service uses Redis${NC}"
    else
      echo -e "${YELLOW}⚠ $service doesn't use Redis${NC}"
    fi
  else
    echo -e "${RED}✗ $service not found${NC}"
  fi
done

echo ""

###############################################################################
# Test 6: Email Confirmation UX (M6)
###############################################################################
echo -e "${YELLOW}Test 6: Email Confirmation UX${NC}"
echo "-----------------------------------------------------------------------"

echo "6.1 Checking confirmed page redirect..."
if [ -f "apps/ruach-next/src/app/confirmed/page.tsx" ]; then
  if grep -q "login?confirmed=true" "apps/ruach-next/src/app/confirmed/page.tsx"; then
    echo -e "${GREEN}✓ Confirmed page redirects to login with parameter${NC}"
  else
    echo -e "${YELLOW}⚠ Redirect parameter not found${NC}"
  fi
else
  echo -e "${RED}✗ Confirmed page not found${NC}"
fi

echo ""
echo "6.2 Checking login page success message..."
if [ -f "apps/ruach-next/src/app/login/page.tsx" ]; then
  if grep -q "confirmed.*true" "apps/ruach-next/src/app/login/page.tsx"; then
    echo -e "${GREEN}✓ Login page shows confirmation success message${NC}"
  else
    echo -e "${YELLOW}⚠ Confirmation success message not found${NC}"
  fi
else
  echo -e "${RED}✗ Login page not found${NC}"
fi

echo ""

###############################################################################
# Test 7: Role-Based Access Control (M4)
###############################################################################
echo -e "${YELLOW}Test 7: Role-Based Access Control${NC}"
echo "-----------------------------------------------------------------------"

echo "7.1 Checking Strapi user helper..."
if [ -f "apps/ruach-next/src/lib/strapi-user.ts" ]; then
  echo -e "${GREEN}✓ Strapi user helper exists${NC}"

  if grep -q "isModerator" "apps/ruach-next/src/lib/strapi-user.ts"; then
    echo -e "${GREEN}✓ isModerator function present${NC}"
  fi

  if grep -q "fetchStrapiUser" "apps/ruach-next/src/lib/strapi-user.ts"; then
    echo -e "${GREEN}✓ fetchStrapiUser function present${NC}"
  fi
else
  echo -e "${RED}✗ Strapi user helper missing${NC}"
fi

echo ""
echo "7.2 Checking moderator role usage in comment endpoints..."

ENDPOINTS=("approve/route.ts" "reject/route.ts")
for endpoint in "${ENDPOINTS[@]}"; do
  FILE="apps/ruach-next/src/app/api/comments/[id]/$endpoint"
  if [ -f "$FILE" ]; then
    if grep -q "isModerator" "$FILE"; then
      echo -e "${GREEN}✓ $endpoint uses role-based checking${NC}"
    else
      echo -e "${YELLOW}⚠ $endpoint may still use email-based checking${NC}"
    fi
  else
    echo -e "${RED}✗ $endpoint not found${NC}"
  fi
done

echo ""

###############################################################################
# Test 8: Cookie Security (H3)
###############################################################################
echo -e "${YELLOW}Test 8: Cookie Security${NC}"
echo "-----------------------------------------------------------------------"

echo "8.1 Checking COOKIE_SECURE configuration..."
if grep -q "COOKIE_SECURE" "ruach-ministries-backend/src/api/auth/controllers/custom-auth.js"; then
  echo -e "${GREEN}✓ COOKIE_SECURE environment variable implemented${NC}"

  if grep -q "COOKIE_SECURE.*true.*production" "ruach-ministries-backend/src/api/auth/controllers/custom-auth.js"; then
    echo -e "${GREEN}✓ Production validation present${NC}"
  fi
else
  echo -e "${RED}✗ COOKIE_SECURE not found${NC}"
fi

echo ""
echo "8.2 Checking cookie configuration in .env.production.example..."
if [ -f ".env.production.example" ]; then
  if grep -q "COOKIE_SECURE=true" ".env.production.example"; then
    echo -e "${GREEN}✓ COOKIE_SECURE documented in .env.production.example${NC}"
  else
    echo -e "${YELLOW}⚠ COOKIE_SECURE not documented${NC}"
  fi
else
  echo -e "${YELLOW}⚠ .env.production.example not found${NC}"
fi

echo ""

###############################################################################
# Summary
###############################################################################
echo "====================================================================="
echo "  Test Suite Complete"
echo "====================================================================="
echo ""
echo "Manual Tests Required:"
echo "  1. Test full signup → email confirmation → login flow"
echo "  2. Test 30-minute idle timeout (leave browser idle)"
echo "  3. Test activity tracking (move mouse, should reset timeout)"
echo "  4. Test token refresh after 1 hour"
echo "  5. Verify toast notifications appear for session events"
echo "  6. Test moderator role in Strapi admin panel"
echo "  7. Configure Redis and verify persistence"
echo ""
echo "Production Deployment Checklist:"
echo "  [ ] Set COOKIE_SECURE=true"
echo "  [ ] Set NODE_ENV=production"
echo "  [ ] Configure REDIS_URL or UPSTASH_REDIS_REST_*"
echo "  [ ] Create Moderator role in Strapi"
echo "  [ ] Verify HTTPS enforcement"
echo "  [ ] Test rate limiting in production"
echo ""
