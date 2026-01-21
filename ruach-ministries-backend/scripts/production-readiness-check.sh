#!/bin/bash
# Ruach Generation System - Production Readiness Check
# Validates security, performance, and operational concerns

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Ruach Generation - Production Readiness Check${NC}"
echo ""

PASS=0
WARN=0
FAIL=0

# Check 1: Environment Variables
echo -e "${YELLOW}[1] Checking environment variables...${NC}"
if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${RED}✗ OPENAI_API_KEY not set${NC}"
  ((FAIL++))
else
  echo -e "${GREEN}✓ OPENAI_API_KEY configured${NC}"
  ((PASS++))
fi

if [ -z "$CLAUDE_API_KEY" ]; then
  echo -e "${RED}✗ CLAUDE_API_KEY not set${NC}"
  ((FAIL++))
else
  echo -e "${GREEN}✓ CLAUDE_API_KEY configured${NC}"
  ((PASS++))
fi

if [ -z "$NODE_ENV" ]; then
  echo -e "${YELLOW}⚠ NODE_ENV not set (defaulting to development)${NC}"
  ((WARN++))
elif [ "$NODE_ENV" = "production" ]; then
  echo -e "${GREEN}✓ NODE_ENV=production${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ NODE_ENV=${NODE_ENV} (should be 'production')${NC}"
  ((WARN++))
fi
echo ""

# Check 2: Rate Limiting Configuration
echo -e "${YELLOW}[2] Checking rate limiting...${NC}"
if grep -q "strapi::ratelimit" config/middlewares.ts 2>/dev/null; then
  echo -e "${GREEN}✓ Rate limiting middleware configured${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ Rate limiting not configured${NC}"
  echo "  Add strapi::ratelimit to config/middlewares.ts"
  ((FAIL++))
fi
echo ""

# Check 3: Secrets in Git
echo -e "${YELLOW}[3] Checking for secrets in git...${NC}"
# Exclude .env.example (placeholder values are OK)
if git grep -E "(sk-ant-|sk-proj-)" HEAD -- ':!*.env.example' 2>/dev/null | grep -v "REPLACE_ME" | grep -v "your-key-here"; then
  echo -e "${RED}✗ Real API keys found in git history${NC}"
  echo "  Run: git filter-repo to remove them"
  ((FAIL++))
else
  echo -e "${GREEN}✓ No real API keys in git${NC}"
  ((PASS++))
fi
echo ""

# Check 4: .env in .gitignore
echo -e "${YELLOW}[4] Checking .gitignore...${NC}"
if grep -q "^.env$" .gitignore 2>/dev/null; then
  echo -e "${GREEN}✓ .env in .gitignore${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ .env not in .gitignore${NC}"
  echo "  Add .env to .gitignore"
  ((FAIL++))
fi
echo ""

# Check 5: Content Type Schemas
echo -e "${YELLOW}[5] Checking content type schemas...${NC}"
SCHEMAS_FOUND=0

if [ -f "src/api/ruach-guardrails/content-types/ruach-guardrails/schema.json" ]; then
  echo -e "${GREEN}✓ ruach-guardrails schema exists${NC}"
  ((SCHEMAS_FOUND++))
else
  echo -e "${RED}✗ ruach-guardrails schema missing${NC}"
fi

if [ -f "src/api/ruach-prompt-templates/content-types/ruach-prompt-templates/schema.json" ]; then
  echo -e "${GREEN}✓ ruach-prompt-templates schema exists${NC}"
  ((SCHEMAS_FOUND++))
else
  echo -e "${RED}✗ ruach-prompt-templates schema missing${NC}"
fi

if [ $SCHEMAS_FOUND -eq 2 ]; then
  ((PASS++))
else
  echo -e "${RED}✗ Missing content type schemas${NC}"
  ((FAIL++))
fi
echo ""

# Check 6: Service Files
echo -e "${YELLOW}[6] Checking service files...${NC}"
SERVICES_FOUND=0

if [ -f "src/api/library/services/ruach-generation.ts" ]; then
  echo -e "${GREEN}✓ ruach-generation.ts exists${NC}"
  ((SERVICES_FOUND++))
else
  echo -e "${RED}✗ ruach-generation.ts missing${NC}"
fi

if [ -f "src/api/library/services/ruach-citation-validator.ts" ]; then
  echo -e "${GREEN}✓ ruach-citation-validator.ts exists${NC}"
  ((SERVICES_FOUND++))
else
  echo -e "${RED}✗ ruach-citation-validator.ts missing${NC}"
fi

if [ -f "src/api/library/services/ruach-guardrail-engine.ts" ]; then
  echo -e "${GREEN}✓ ruach-guardrail-engine.ts exists${NC}"
  ((SERVICES_FOUND++))
else
  echo -e "${RED}✗ ruach-guardrail-engine.ts missing${NC}"
fi

if [ $SERVICES_FOUND -eq 3 ]; then
  ((PASS++))
else
  echo -e "${RED}✗ Missing service files${NC}"
  ((FAIL++))
fi
echo ""

# Check 7: Controller and Routes
echo -e "${YELLOW}[7] Checking controller and routes...${NC}"
if [ -f "src/api/ruach-generation/controllers/ruach-generation.ts" ]; then
  echo -e "${GREEN}✓ Controller exists${NC}"
else
  echo -e "${RED}✗ Controller missing${NC}"
  ((FAIL++))
fi

if [ -f "src/api/ruach-generation/routes/ruach-generation.ts" ]; then
  echo -e "${GREEN}✓ Routes exist${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ Routes missing${NC}"
  ((FAIL++))
fi
echo ""

# Check 8: Bootstrap Initialization
echo -e "${YELLOW}[8] Checking bootstrap initialization...${NC}"
if grep -q "seedPromptTemplates" src/index.ts 2>/dev/null; then
  echo -e "${GREEN}✓ Bootstrap calls seedPromptTemplates${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ Bootstrap doesn't initialize Ruach system${NC}"
  echo "  Add: await seedPromptTemplates(strapi); to src/index.ts"
  ((FAIL++))
fi
echo ""

# Check 9: Seed Script
echo -e "${YELLOW}[9] Checking seed script...${NC}"
if [ -f "database/seeds/ruach-prompt-templates.ts" ]; then
  echo -e "${GREEN}✓ Seed script exists${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ Seed script missing${NC}"
  ((FAIL++))
fi
echo ""

# Check 10: Documentation
echo -e "${YELLOW}[10] Checking documentation...${NC}"
DOCS_FOUND=0

if [ -f "docs/RUACH_GENERATION_SYSTEM.md" ]; then
  echo -e "${GREEN}✓ System documentation exists${NC}"
  ((DOCS_FOUND++))
fi

if [ -f "docs/SMOKE_TEST_GUIDE.md" ]; then
  echo -e "${GREEN}✓ Smoke test guide exists${NC}"
  ((DOCS_FOUND++))
fi

if [ -f "IMPLEMENTATION_SUMMARY.md" ]; then
  echo -e "${GREEN}✓ Implementation summary exists${NC}"
  ((DOCS_FOUND++))
fi

if [ $DOCS_FOUND -eq 3 ]; then
  ((PASS++))
else
  echo -e "${YELLOW}⚠ Some documentation missing (found $DOCS_FOUND/3)${NC}"
  ((WARN++))
fi
echo ""

# Check 11: Test Structure
echo -e "${YELLOW}[11] Checking test structure...${NC}"
if [ -f "src/api/library/services/__tests__/ruach-citation-validator.test.ts" ]; then
  echo -e "${GREEN}✓ Example tests exist${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ No tests found${NC}"
  ((WARN++))
fi
echo ""

# Check 12: TypeScript Strict Mode
echo -e "${YELLOW}[12] Checking TypeScript configuration...${NC}"
if grep -q '"strict": true' tsconfig.json 2>/dev/null; then
  echo -e "${GREEN}✓ TypeScript strict mode enabled${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ TypeScript strict mode not enabled${NC}"
  ((WARN++))
fi
echo ""

# Check 13: Error Handling in Services
echo -e "${YELLOW}[13] Checking error handling...${NC}"
if grep -q "try {" src/api/library/services/ruach-generation.ts 2>/dev/null; then
  echo -e "${GREEN}✓ Error handling present in main service${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ Limited error handling in services${NC}"
  ((WARN++))
fi
echo ""

# Check 14: Logging Configuration
echo -e "${YELLOW}[14] Checking logging...${NC}"
if grep -q "strapi.log" src/api/library/services/ruach-generation.ts 2>/dev/null; then
  echo -e "${GREEN}✓ Logging configured${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ No logging found in main service${NC}"
  ((WARN++))
fi
echo ""

# Check 15: CORS Configuration (production)
echo -e "${YELLOW}[15] Checking CORS configuration...${NC}"
if [ "$NODE_ENV" = "production" ]; then
  if grep -q "origin:" config/middlewares.ts 2>/dev/null; then
    echo -e "${GREEN}✓ CORS configured${NC}"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠ CORS not explicitly configured for production${NC}"
    ((WARN++))
  fi
else
  echo -e "${YELLOW}⚠ Skipping (not in production mode)${NC}"
  ((WARN++))
fi
echo ""

# Summary
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Production Readiness Summary${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${GREEN}Passed:  $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed:  $FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ NOT READY FOR PRODUCTION${NC}"
  echo "Fix all failures before deploying"
  exit 1
elif [ $WARN -gt 5 ]; then
  echo -e "${YELLOW}⚠️  READY WITH WARNINGS${NC}"
  echo "Review warnings and harden before production"
  exit 2
else
  echo -e "${GREEN}✅ READY FOR PRODUCTION${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run smoke tests: ./scripts/smoke-test-ruach-generation.sh"
  echo "2. Test with production data volumes"
  echo "3. Monitor generation metrics"
  echo "4. Set up alerts for quality degradation"
  exit 0
fi
