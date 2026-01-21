#!/bin/bash

# Ruach Capture Endpoint Test Script
# Tests the /api/capture endpoint with various scenarios

set -e

API_URL="${API_URL:-http://localhost:3000/api/capture}"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo "================================================"
echo "🧪 Ruach Capture Endpoint Test"
echo "================================================"
echo ""
echo "Testing endpoint: $API_URL"
echo ""

# Test 1: Simple capture
echo -e "${COLOR_BLUE}Test 1: Simple text capture${COLOR_RESET}"
echo "---"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Power doesn'\''t need permission. It needs ignition. Stop waiting for someone to validate your calling.",
    "source": "TestScript"
  }')

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${COLOR_GREEN}✅ PASS${COLOR_RESET} - Snippet captured successfully"
  echo "$RESPONSE" | jq -r '.meta // empty' | head -5
else
  echo -e "${COLOR_RED}❌ FAIL${COLOR_RESET}"
  echo "$RESPONSE"
fi
echo ""

# Test 2: Capture with hints
echo -e "${COLOR_BLUE}Test 2: Capture with type and topic hints${COLOR_RESET}"
echo "---"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Love isn'\''t a feeling. It'\''s a decision you make when the feeling is gone.",
    "title": "Love Is A Decision",
    "type": "quote",
    "topics": ["love", "commitment", "marriage"],
    "source": "TestScript"
  }')

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${COLOR_GREEN}✅ PASS${COLOR_RESET} - Snippet with hints captured"
  echo "$RESPONSE" | jq -r '.saved.title // empty'
else
  echo -e "${COLOR_RED}❌ FAIL${COLOR_RESET}"
  echo "$RESPONSE"
fi
echo ""

# Test 3: Deduplication
echo -e "${COLOR_BLUE}Test 3: Deduplication test${COLOR_RESET}"
echo "---"
TEST_TEXT="This is a unique test string for deduplication testing $(date +%s)"

# First capture
RESPONSE1=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"source\": \"TestScript\"}")

# Second capture (should be deduplicated)
RESPONSE2=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"source\": \"TestScript\"}")

if echo "$RESPONSE1" | grep -q '"ok":true' && echo "$RESPONSE2" | grep -q '"deduped":true'; then
  echo -e "${COLOR_GREEN}✅ PASS${COLOR_RESET} - Deduplication working correctly"
  echo "First response created new snippet"
  echo "Second response detected duplicate"
else
  echo -e "${COLOR_RED}❌ FAIL${COLOR_RESET}"
  echo "Response 1: $RESPONSE1"
  echo "Response 2: $RESPONSE2"
fi
echo ""

# Test 4: Missing text validation
echo -e "${COLOR_BLUE}Test 4: Validation - missing text${COLOR_RESET}"
echo "---"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"source": "TestScript"}')

if echo "$RESPONSE" | grep -q '"error":"Missing text"'; then
  echo -e "${COLOR_GREEN}✅ PASS${COLOR_RESET} - Validation working"
else
  echo -e "${COLOR_RED}❌ FAIL${COLOR_RESET}"
  echo "$RESPONSE"
fi
echo ""

# Test 5: Teaching snippet
echo -e "${COLOR_BLUE}Test 5: Teaching type capture${COLOR_RESET}"
echo "---"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The Bride doesn'\''t compete. She prepares. While Babylon builds towers, the ekklesia builds altars. While the world markets platforms, we cultivate presence.",
    "type": "teaching",
    "topics": ["bride", "ekklesia", "kingdom"],
    "source": "TestScript"
  }')

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${COLOR_GREEN}✅ PASS${COLOR_RESET} - Teaching snippet captured"
  echo "$RESPONSE" | jq -r '.meta // empty'
else
  echo -e "${COLOR_RED}❌ FAIL${COLOR_RESET}"
  echo "$RESPONSE"
fi
echo ""

echo "================================================"
echo "✅ Tests Complete"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Check Strapi admin: http://localhost:1337/admin"
echo "2. View captured snippets in Content Manager"
echo "3. Verify topics were auto-created"
echo ""
