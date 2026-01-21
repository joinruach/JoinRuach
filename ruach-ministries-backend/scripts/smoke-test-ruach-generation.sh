#!/bin/bash
# Ruach Generation System - Smoke Test Suite
# Tests all 7 endpoints + validates structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STRAPI_URL="${STRAPI_URL:-http://localhost:1337}"
TOKEN="${TOKEN:-}"

# Check prerequisites
if [ -z "$TOKEN" ]; then
  echo -e "${RED}ERROR: TOKEN environment variable not set${NC}"
  echo "Create a token in Strapi Admin → Settings → API Tokens"
  echo "Then run: export TOKEN='your-token-here'"
  exit 1
fi

echo -e "${GREEN}Starting Ruach Generation Smoke Tests${NC}"
echo "Target: $STRAPI_URL"
echo ""

# Test 1: List Templates
echo -e "${YELLOW}[1/7] Testing GET /api/ruach-generation/templates${NC}"
TEMPLATES_RESPONSE=$(curl -s -X GET "$STRAPI_URL/api/ruach-generation/templates" \
  -H "Authorization: Bearer $TOKEN")

TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$TEMPLATE_COUNT" -eq "4" ]; then
  echo -e "${GREEN}✓ Found 4 templates${NC}"
else
  echo -e "${RED}✗ Expected 4 templates, found $TEMPLATE_COUNT${NC}"
  echo "$TEMPLATES_RESPONSE" | jq
  exit 1
fi

# Get a template ID for later tests
TEMPLATE_ID=$(echo "$TEMPLATES_RESPONSE" | jq -r '.data[0].attributes.templateId' 2>/dev/null)
echo "  Using template: $TEMPLATE_ID"
echo ""

# Test 2: List Guardrails
echo -e "${YELLOW}[2/7] Testing GET /api/ruach-generation/guardrails${NC}"
GUARDRAILS_RESPONSE=$(curl -s -X GET "$STRAPI_URL/api/ruach-generation/guardrails" \
  -H "Authorization: Bearer $TOKEN")

GUARDRAIL_COUNT=$(echo "$GUARDRAILS_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$GUARDRAIL_COUNT" -eq "3" ]; then
  echo -e "${GREEN}✓ Found 3 guardrails${NC}"
else
  echo -e "${RED}✗ Expected 3 guardrails, found $GUARDRAIL_COUNT${NC}"
  echo "$GUARDRAILS_RESPONSE" | jq
  exit 1
fi
echo ""

# Test 3: Generate Q&A (main test)
echo -e "${YELLOW}[3/7] Testing POST /api/ruach-generation/generate (Q&A, strict mode)${NC}"
GENERATE_RESPONSE=$(curl -s -X POST "$STRAPI_URL/api/ruach-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "What does Scripture say about fear?",
    "outputType": "qa_answer",
    "mode": "scripture_library",
    "strictMode": true,
    "retrievalLimit": 10
  }')

# Save response for manual inspection
echo "$GENERATE_RESPONSE" | jq > /tmp/ruach-generate-response.json

# Validate response structure
NODE_ID=$(echo "$GENERATE_RESPONSE" | jq -r '.nodeId' 2>/dev/null)
STATUS=$(echo "$GENERATE_RESPONSE" | jq -r '.status' 2>/dev/null)
CONTENT=$(echo "$GENERATE_RESPONSE" | jq -r '.content' 2>/dev/null)
CITATION_COUNT=$(echo "$GENERATE_RESPONSE" | jq '.citations | length' 2>/dev/null || echo "0")
COVERAGE=$(echo "$GENERATE_RESPONSE" | jq -r '.qualityMetrics.citationCoverage' 2>/dev/null)
SCRIPTURE_COUNT=$(echo "$GENERATE_RESPONSE" | jq -r '.qualityMetrics.scriptureCitationCount' 2>/dev/null)

if [ "$STATUS" = "success" ] || [ "$STATUS" = "partial" ]; then
  echo -e "${GREEN}✓ Generation succeeded${NC}"
  echo "  Node ID: $NODE_ID"
  echo "  Status: $STATUS"
  echo "  Citations: $CITATION_COUNT"
  echo "  Coverage: $COVERAGE"
  echo "  Scripture citations: $SCRIPTURE_COUNT"

  # Validate minimum requirements
  if [ "$CITATION_COUNT" -lt "2" ]; then
    echo -e "${YELLOW}⚠ Warning: Citation count below expected minimum (2)${NC}"
  fi

  if [ "$SCRIPTURE_COUNT" -lt "2" ]; then
    echo -e "${YELLOW}⚠ Warning: Scripture citation count below minimum (2)${NC}"
  fi

  # Save for manual review
  echo -e "${GREEN}  Response saved to: /tmp/ruach-generate-response.json${NC}"
else
  echo -e "${RED}✗ Generation failed${NC}"
  echo "$GENERATE_RESPONSE" | jq
  exit 1
fi
echo ""

# Test 4: Check Guardrails (utility endpoint)
echo -e "${YELLOW}[4/7] Testing POST /api/ruach-generation/check-guardrails${NC}"
GUARDRAIL_CHECK=$(curl -s -X POST "$STRAPI_URL/api/ruach-generation/check-guardrails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "This is a claim about God without any citation."
  }')

PASSED=$(echo "$GUARDRAIL_CHECK" | jq -r '.passed' 2>/dev/null)
if [ "$PASSED" = "false" ]; then
  echo -e "${GREEN}✓ Guardrails detected uncited claim (expected)${NC}"
else
  echo -e "${YELLOW}⚠ Warning: Guardrails may not be detecting violations${NC}"
fi
echo ""

# Test 5: Get Specific Template
echo -e "${YELLOW}[5/7] Testing GET /api/ruach-generation/templates/:templateId${NC}"
TEMPLATE_RESPONSE=$(curl -s -X GET "$STRAPI_URL/api/ruach-generation/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN")

TEMPLATE_NAME=$(echo "$TEMPLATE_RESPONSE" | jq -r '.data.attributes.templateName' 2>/dev/null)
if [ ! -z "$TEMPLATE_NAME" ]; then
  echo -e "${GREEN}✓ Retrieved template: $TEMPLATE_NAME${NC}"
else
  echo -e "${RED}✗ Failed to retrieve template${NC}"
  echo "$TEMPLATE_RESPONSE" | jq
  exit 1
fi
echo ""

# Test 6: Verify Citations (if we have a node ID)
if [ ! -z "$NODE_ID" ] && [ "$NODE_ID" != "null" ]; then
  echo -e "${YELLOW}[6/7] Testing POST /api/ruach-generation/verify-citations/:nodeId${NC}"
  VERIFY_RESPONSE=$(curl -s -X POST "$STRAPI_URL/api/ruach-generation/verify-citations/$NODE_ID" \
    -H "Authorization: Bearer $TOKEN")

  VERIFY_COVERAGE=$(echo "$VERIFY_RESPONSE" | jq -r '.coverage' 2>/dev/null)
  if [ ! -z "$VERIFY_COVERAGE" ] && [ "$VERIFY_COVERAGE" != "null" ]; then
    echo -e "${GREEN}✓ Citation verification completed${NC}"
    echo "  Coverage: $VERIFY_COVERAGE"
  else
    echo -e "${RED}✗ Citation verification failed${NC}"
    echo "$VERIFY_RESPONSE" | jq
  fi
else
  echo -e "${YELLOW}[6/7] Skipping citation verification (no node ID)${NC}"
fi
echo ""

# Test 7: Test with different output type (sermon)
echo -e "${YELLOW}[7/7] Testing POST /api/ruach-generation/generate (Sermon)${NC}"
SERMON_RESPONSE=$(curl -s -X POST "$STRAPI_URL/api/ruach-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "Create a sermon on Matthew 6:25-34",
    "outputType": "sermon",
    "mode": "scripture_library",
    "strictMode": false,
    "retrievalLimit": 10
  }')

SERMON_STATUS=$(echo "$SERMON_RESPONSE" | jq -r '.status' 2>/dev/null)
if [ "$SERMON_STATUS" = "success" ] || [ "$SERMON_STATUS" = "partial" ]; then
  SERMON_SCRIPTURE_COUNT=$(echo "$SERMON_RESPONSE" | jq -r '.qualityMetrics.scriptureCitationCount' 2>/dev/null)
  echo -e "${GREEN}✓ Sermon generation succeeded${NC}"
  echo "  Status: $SERMON_STATUS"
  echo "  Scripture citations: $SERMON_SCRIPTURE_COUNT"

  if [ "$SERMON_SCRIPTURE_COUNT" -lt "5" ]; then
    echo -e "${YELLOW}⚠ Warning: Sermon has fewer than 5 scripture citations${NC}"
  fi
else
  echo -e "${RED}✗ Sermon generation failed${NC}"
  echo "$SERMON_RESPONSE" | jq
fi
echo ""

# Final summary
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Smoke Test Complete${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review generated response: cat /tmp/ruach-generate-response.json | jq"
echo "2. Check Strapi Admin → Content Manager → library-generated-node"
echo "3. Verify citations are linked to actual chunks"
echo "4. Test edge cases (empty query, invalid template, etc.)"
echo ""
echo -e "${YELLOW}Production Hardening Checklist:${NC}"
echo "[ ] Add rate limiting to generation endpoints"
echo "[ ] Set max tokens per outputType"
echo "[ ] Add startup validation for OPENAI_API_KEY and CLAUDE_API_KEY"
echo "[ ] Enable audit logging (template, mode, coverage, failures)"
echo "[ ] Add explicit timeouts for retrieval + Claude calls"
echo "[ ] Configure TS2009 as default scripture translation"
echo "[ ] Test with production data volumes"
echo "[ ] Set up monitoring for quality metrics"
