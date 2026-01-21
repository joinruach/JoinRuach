# Ruach Generation System - Smoke Test Guide

**Time to complete:** ~30 minutes
**Goal:** Prove the system works in production, not just in theory

---

## Pre-Flight Checklist (5 minutes)

### 1. Boot Strapi

```bash
cd ruach-ministries-backend
pnpm develop
```

**Look for these lines in startup logs:**
```
✓ Initialized 4 Ruach prompt templates
✓ Initialized 3 Ruach guardrails
```

**If missing:** Bootstrap didn't run. Check `src/index.ts` line 30-35.

### 2. Verify Environment Variables

```bash
# Check these are set (server-side only)
echo $OPENAI_API_KEY   # Should return: sk-...
echo $CLAUDE_API_KEY   # Should return: sk-ant-...
```

**If missing:** Add to `.env`:
```env
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
```

### 3. Access Strapi Admin

Navigate to: `http://localhost:1337/admin`

Login with your admin credentials.

---

## Strapi Admin Validation (10 minutes)

### A) Content-Type Builder Checks

**Navigate:** Strapi Admin → Content-Type Builder

#### ✅ Verify: `ruach-guardrails`

**Expected fields:**
- `guardrailId` (Text, unique, required)
- `category` (Enumeration: doctrine | interpretation | application)
- `title` (Text, required)
- `description` (Text)
- `enforcementLevel` (Enumeration: blocking | warning | guidance)
- `detectionPatterns` (JSON, required)
- `correctionGuidance` (Text, required)
- `isActive` (Boolean, default: true)

**If missing:** Content type wasn't created. Check:
- `src/api/ruach-guardrails/content-types/ruach-guardrails/schema.json` exists
- Strapi detected the new content type on startup

#### ✅ Verify: `ruach-prompt-templates`

**Expected fields:**
- `templateId` (Text, unique, required)
- `templateName` (Text, required)
- `outputType` (Enumeration: sermon | study | qa_answer | doctrine_page)
- `generationMode` (Enumeration: scripture_library)
- `systemPrompt` (Text, required)
- `userPromptTemplate` (Text, required)
- `citationRequirements` (JSON, required)
- `responseFormat` (JSON, required)
- `maxTokens` (Integer, default: 4000)
- `temperature` (Decimal, default: 0.3)
- `guardrails` (Relation to ruach-guardrails, many-to-many)

**If missing:** Check same as above.

#### ✅ Verify: `library-generated-node` (extended)

**New fields added:**
- `citationCoverage` (Decimal, 0-1)
- `scriptureCitationCount` (Integer, default: 0)
- `libraryCitationCount` (Integer, default: 0)
- `guardrailViolations` (JSON)
- `verificationLog` (JSON)
- `sourceQuery` (Text)

**If missing:** Schema extension didn't apply. Check:
- `src/api/library-generated-node/content-types/library-generated-node/schema.json`
- Restart Strapi to apply schema changes

#### ✅ Verify: `library-citation` (extended)

**New fields added:**
- `isScripture` (Boolean, default: false)
- `usageType` (Enumeration: foundation | support | illustration)
- `verificationStatus` (Enumeration: pending | verified | flagged)
- `citationWeight` (Decimal, 0-1, default: 1.0)

**If missing:** Check same as above.

### B) Content Manager Checks

**Navigate:** Strapi Admin → Content Manager

#### ✅ Verify: `ruach-prompt-templates` has 4 entries

Click `ruach-prompt-templates`:

1. **Q&A Assistant**
   - `outputType`: qa_answer
   - `citationRequirements.minScripture`: 2
   - `citationRequirements.minLibrary`: 1
   - `citationRequirements.coverage`: 0.7

2. **Sermon Outline**
   - `outputType`: sermon
   - `citationRequirements.minScripture`: 5
   - `citationRequirements.coverage`: 0.8

3. **Doctrine Page**
   - `outputType`: doctrine_page
   - `citationRequirements.minScripture`: 8
   - `citationRequirements.coverage`: 0.9

4. **Bible Study**
   - `outputType`: study
   - `citationRequirements.minScripture`: 6
   - `citationRequirements.coverage`: 0.75

**If missing:** Bootstrap seed didn't run. Manually trigger:
```bash
curl -X POST http://localhost:1337/api/ruach-generation/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### ✅ Verify: `ruach-guardrails` has 3 entries

Click `ruach-guardrails`:

1. **Scripture Citation Required**
   - `category`: doctrine
   - `enforcementLevel`: blocking

2. **No External Theology**
   - `category`: interpretation
   - `enforcementLevel`: warning

3. **Synthesis Labeling**
   - `category`: interpretation
   - `enforcementLevel`: guidance

**If missing:** Check same as above.

### C) API Permissions

**Navigate:** Strapi Admin → Settings → Roles & Permissions → Public

**Verify these endpoints are enabled:**
- `ruach-generation.generate` (POST)
- `ruach-generation.listTemplates` (GET)
- `ruach-generation.getTemplate` (GET)
- `ruach-generation.verifyCitations` (POST)
- `ruach-generation.listGuardrails` (GET)
- `ruach-generation.checkGuardrails` (POST)
- `ruach-generation.initialize` (POST) - **Admin only**

**If disabled:** Enable them, or create an API token with full access for testing.

### D) Create API Token for Testing

**Navigate:** Strapi Admin → Settings → API Tokens

1. Click "Create new API Token"
2. Name: `Ruach Generation Test`
3. Token duration: Unlimited (for testing)
4. Token type: Full access
5. Click "Save"
6. **Copy the token** (you only see it once)

**Export for scripts:**
```bash
export TOKEN='your-token-here'
export STRAPI_URL='http://localhost:1337'
```

---

## Automated API Tests (10 minutes)

### Run the smoke test script:

```bash
cd ruach-ministries-backend
chmod +x scripts/smoke-test-ruach-generation.sh
./scripts/smoke-test-ruach-generation.sh
```

**Expected output:**
```
Starting Ruach Generation Smoke Tests
Target: http://localhost:1337

[1/7] Testing GET /api/ruach-generation/templates
✓ Found 4 templates

[2/7] Testing GET /api/ruach-generation/guardrails
✓ Found 3 guardrails

[3/7] Testing POST /api/ruach-generation/generate (Q&A, strict mode)
✓ Generation succeeded
  Node ID: 12345
  Status: success
  Citations: 3
  Coverage: 0.85
  Scripture citations: 2

[4/7] Testing POST /api/ruach-generation/check-guardrails
✓ Guardrails detected uncited claim (expected)

[5/7] Testing GET /api/ruach-generation/templates/:templateId
✓ Retrieved template: Q&A Assistant

[6/7] Testing POST /api/ruach-generation/verify-citations/:nodeId
✓ Citation verification completed
  Coverage: 0.85

[7/7] Testing POST /api/ruach-generation/generate (Sermon)
✓ Sermon generation succeeded
  Status: success
  Scripture citations: 6

==================================
Smoke Test Complete
==================================
```

### If any test fails:

1. **Templates/Guardrails not found (404)**
   - Check Content Manager has the seed data
   - Re-run initialize endpoint
   - Check bootstrap logs

2. **Permission denied (403)**
   - Check API token has permissions
   - Check Roles & Permissions settings

3. **Generation fails (500)**
   - Check OPENAI_API_KEY and CLAUDE_API_KEY are set
   - Check Strapi logs for errors
   - Verify library chunks exist (retrieval needs data)

4. **Low citation coverage**
   - Check retrieval is returning chunks
   - Check citation validator logic
   - Review Claude prompt in template

---

## Manual Validation (5 minutes)

### Review Generated Response

```bash
cat /tmp/ruach-generate-response.json | jq
```

**Validate structure:**

```json
{
  "nodeId": "uuid",
  "status": "success",
  "content": "{ \"question\": \"...\", \"directAnswer\": {...}, \"explanation\": {...} }",
  "citations": [
    {
      "sourceId": "...",
      "locator": "Isaiah 41:10",
      "text": "[Scripture: Isaiah 41:10]",
      "isScripture": true,
      "usageType": "foundation"
    }
  ],
  "qualityMetrics": {
    "citationCoverage": 0.85,
    "scriptureCitationCount": 2,
    "libraryCitationCount": 1,
    "guardrailScore": 1.0,
    "citationAccuracy": 1.0,
    "overallQuality": 0.87
  },
  "warnings": [],
  "errors": [],
  "metadata": {
    "generationTimeMs": 12500,
    "model": "claude-sonnet-4-20250514",
    "tokensUsed": 3200
  }
}
```

**Check citations:**
- [ ] At least 2 have `isScripture: true`
- [ ] Citation text is present in content
- [ ] `locator` format is correct (e.g., "Isaiah 41:10" or "Smith, Theology, p. 45")

**Check quality metrics:**
- [ ] `citationCoverage` >= 0.7 (for Q&A)
- [ ] `scriptureCitationCount` >= 2
- [ ] `overallQuality` >= 0.7

### Check Database Records

**Navigate:** Strapi Admin → Content Manager → library-generated-node

Find the node with the `nodeId` from the response.

**Verify:**
- [ ] `content` field has the generated JSON
- [ ] `citationCoverage` matches response
- [ ] `scriptureCitationCount` matches response
- [ ] `sourceQuery` is "What does Scripture say about fear?"

**Navigate:** Strapi Admin → Content Manager → library-citation

Find citations linked to this node.

**Verify:**
- [ ] `isScripture` is true for scripture citations
- [ ] `usageType` is set (foundation/support/illustration)
- [ ] `verificationStatus` is "verified"

---

## Edge Case Tests (Optional, 5 minutes)

### Test 1: Empty Query (should fail gracefully)

```bash
curl -X POST "$STRAPI_URL/api/ruach-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "query": "", "outputType": "qa_answer" }' | jq
```

**Expected:** Error with clear message about missing query.

### Test 2: Invalid Output Type (should fail)

```bash
curl -X POST "$STRAPI_URL/api/ruach-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "query": "Test", "outputType": "invalid" }' | jq
```

**Expected:** Error about invalid outputType.

### Test 3: Guardrail Violation (strict mode should block)

```bash
curl -X POST "$STRAPI_URL/api/ruach-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "God is love because I said so",
    "outputType": "qa_answer",
    "strictMode": true
  }' | jq
```

**Expected:** Status "failed" with guardrail violation in errors array.

---

## Production Hardening Checklist

Once smoke tests pass, harden for production:

### 1. Environment Validation

**Add to `src/index.ts` (before bootstrap):**

```typescript
function validateEnvironment() {
  const required = ['OPENAI_API_KEY', 'CLAUDE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  strapi.log.info('✓ Environment validation passed');
}
```

### 2. Rate Limiting

**Add to `config/middlewares.ts`:**

```typescript
{
  name: 'strapi::ratelimit',
  config: {
    interval: 60000, // 1 minute
    max: 10, // 10 requests per minute for generation
    prefixKey: 'ruach-generation:',
    whitelist: [],
    targets: [
      {
        method: 'POST',
        route: '/api/ruach-generation/generate',
        max: 5, // Stricter for generation
      }
    ]
  }
}
```

### 3. Cost Controls

**Add to each template in seed script:**

```typescript
maxTokens: {
  qa_answer: 2000,
  sermon: 4000,
  doctrine_page: 5000,
  study: 3500
}
```

### 4. Audit Logging

**Add to `ruach-generation.ts` after generation:**

```typescript
strapi.log.info('Generation completed', {
  template: template.templateName,
  mode: request.mode,
  strictMode: request.strictMode,
  coverage: verification.coverage,
  status: verification.status,
  tokensUsed: generation.metadata?.tokensUsed,
  durationMs: Date.now() - startTime
});
```

### 5. Timeouts

**Add to retrieval and Claude calls:**

```typescript
// Retrieval timeout (5 seconds)
const retrievalTimeout = setTimeout(() => {
  throw new Error('Retrieval timeout after 5 seconds');
}, 5000);

// Claude API timeout (30 seconds)
const claudeTimeout = setTimeout(() => {
  throw new Error('Claude API timeout after 30 seconds');
}, 30000);
```

### 6. Translation Alignment (TS2009 / Yahu Scriptures)

**Update citation formatter in `ruach-citation-validator.ts`:**

```typescript
formatScriptureCitation(verse: any): string {
  // Use TS2009 / Yahu Scriptures format
  return `[Scripture: ${verse.book} ${verse.chapter}:${verse.verse} (TS2009)]`;
}
```

**Update scripture retrieval to prefer TS2009:**

```typescript
// In library.ts searchScripture()
WHERE sw.title = 'TS2009' OR sw.title = 'Yahu Scriptures'
ORDER BY sw.title = 'TS2009' DESC
```

### 7. Monitoring Setup

**Add Prometheus metrics:**

```typescript
// Track generation metrics
strapi.metrics.increment('ruach_generation.total');
strapi.metrics.histogram('ruach_generation.coverage', verification.coverage);
strapi.metrics.histogram('ruach_generation.duration_ms', durationMs);
```

---

## Common Issues & Fixes

### Issue 1: Bootstrap didn't run

**Symptoms:** Templates/guardrails missing in Content Manager

**Fix:**
1. Check `src/index.ts` has `await seedPromptTemplates(strapi);`
2. Check logs for "Initialized X templates"
3. Manually run: `POST /api/ruach-generation/initialize`

### Issue 2: Permissions 403

**Symptoms:** All API calls return 403

**Fix:**
1. Go to Settings → Roles & Permissions → Public
2. Enable all `ruach-generation.*` endpoints
3. Or use API token with full access

### Issue 3: No chunks retrieved

**Symptoms:** Generation fails with "No relevant chunks found"

**Fix:**
1. Verify `library_chunks` table has data
2. Check `library_embeddings` table has embeddings
3. Run library ingestion if empty
4. Lower `relevanceThreshold` in request

### Issue 4: Low citation coverage

**Symptoms:** Coverage < 70%, quality score < 0.7

**Fix:**
1. Review retrieved chunks (are they relevant?)
2. Check template `citationRequirements` (too strict?)
3. Adjust Claude `temperature` (lower = more structured)
4. Review prompt emphasizes citations

### Issue 5: Guardrails not detecting violations

**Symptoms:** Uncited claims pass through

**Fix:**
1. Check guardrail `detectionPatterns` (too narrow?)
2. Verify guardrail `isActive` is true
3. Test patterns manually in `check-guardrails` endpoint
4. Adjust pattern confidence threshold

---

## Success Criteria

✅ All 7 smoke tests pass
✅ 4 templates exist in Content Manager
✅ 3 guardrails exist and detect violations
✅ Generated content has ≥ 70% citation coverage
✅ Scripture citations ≥ 2 per Q&A
✅ Citations link to real chunks in database
✅ Quality score ≥ 0.7
✅ Guardrail blocking works in strict mode
✅ Response time < 20 seconds (p95)
✅ Database records persist correctly

---

## Next Steps After Smoke Test

1. **Load Testing:** Test with 100 concurrent requests
2. **Edge Cases:** Test with zero results, malformed queries, very long queries
3. **Translation Verification:** Ensure TS2009 is default scripture source
4. **Monitoring:** Set up dashboards for coverage, quality, latency
5. **User Testing:** Have real users test generation quality
6. **Guardrail Tuning:** Collect violations, tune patterns with real data
7. **Cost Analysis:** Monitor token usage per output type
8. **Documentation:** Update with production endpoints and examples

---

**"Prove it works, then ship it."**
