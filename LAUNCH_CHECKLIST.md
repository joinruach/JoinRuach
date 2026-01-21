# Ruach Generation System - 30-Minute Launch Checklist

**Goal:** Prove the system works in production within 30 minutes
**Approach:** Reality-check → Smoke test → Harden → Ship

---

## ⏱️ Timeline (30 minutes)

- **0-5 min:** Production readiness check (automated)
- **5-10 min:** Boot and verify Strapi Admin
- **10-20 min:** Run smoke tests (automated)
- **20-25 min:** Manual validation
- **25-30 min:** Final hardening checks

---

## Phase 1: Production Readiness Check (5 min)

### Run the automated checker:

```bash
cd ruach-ministries-backend
chmod +x scripts/production-readiness-check.sh
./scripts/production-readiness-check.sh
```

### Expected output:

```
✅ READY FOR PRODUCTION

Passed:  15
Warnings: 0
Failed:  0
```

### If you see failures:

| Failure | Fix |
|---------|-----|
| OPENAI_API_KEY not set | Add to `.env`: `OPENAI_API_KEY=sk-...` |
| CLAUDE_API_KEY not set | Add to `.env`: `CLAUDE_API_KEY=sk-ant-...` |
| Rate limiting not configured | See "Hardening" section below |
| API keys in git | Run `git filter-repo` to remove (critical!) |
| Schema files missing | Re-create content type schemas |
| Service files missing | Re-check implementation |
| Bootstrap not configured | Add `await seedPromptTemplates(strapi)` to `src/index.ts` |

---

## Phase 2: Boot and Verify (5 min)

### 1. Start Strapi

```bash
cd ruach-ministries-backend
pnpm develop
```

### 2. Check startup logs for:

```
✅ Initialized 4 Ruach prompt templates
✅ Initialized 3 Ruach guardrails
```

**If missing:** Bootstrap didn't run. Check `src/index.ts` line 27.

### 3. Access Strapi Admin

Navigate to: `http://localhost:1337/admin`

### 4. Verify Content-Type Builder

**Go to:** Content-Type Builder

**Check these exist:**
- ✅ `ruach-guardrails` (with 8 fields)
- ✅ `ruach-prompt-templates` (with 10 fields)
- ✅ `library-generated-node` (check for new fields: `citationCoverage`, `scriptureCitationCount`)
- ✅ `library-citation` (check for new fields: `isScripture`, `usageType`)

**If missing:** Schema files weren't detected. Restart Strapi or manually create.

### 5. Verify Content Manager

**Go to:** Content Manager

**Check record counts:**
- ✅ `ruach-prompt-templates`: **4 entries** (Q&A, Sermon, Doctrine, Study)
- ✅ `ruach-guardrails`: **3 entries** (Scripture Required, No External Theology, Synthesis Labeling)

**If missing:** Run initialize endpoint:

```bash
export TOKEN='your-admin-token'
curl -X POST http://localhost:1337/api/ruach-generation/initialize \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Create API Token

**Go to:** Settings → API Tokens

1. Click "Create new API Token"
2. Name: `Ruach Smoke Test`
3. Token duration: Unlimited
4. Token type: **Full access** (for testing)
5. Click "Save"
6. **Copy the token** (shown only once)

**Export for next phase:**

```bash
export TOKEN='your-token-here'
export STRAPI_URL='http://localhost:1337'
```

---

## Phase 3: Smoke Tests (10 min)

### Run all 7 endpoint tests:

```bash
chmod +x scripts/smoke-test-ruach-generation.sh
./scripts/smoke-test-ruach-generation.sh
```

### Expected output:

```
[1/7] Testing GET /api/ruach-generation/templates
✓ Found 4 templates

[2/7] Testing GET /api/ruach-generation/guardrails
✓ Found 3 guardrails

[3/7] Testing POST /api/ruach-generation/generate (Q&A, strict mode)
✓ Generation succeeded
  Node ID: abc-123
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

### If tests fail:

| Error | Diagnosis | Fix |
|-------|-----------|-----|
| 404 Not Found | Routes not registered | Check `src/api/ruach-generation/routes/` exists |
| 403 Forbidden | Token lacks permissions | Use admin token or enable public access |
| 500 Server Error | Service logic error | Check Strapi logs for stack trace |
| "No relevant chunks found" | Empty database | Run library ingestion first |
| Low citation coverage | Weak retrieval or templates too strict | Lower threshold or tune retrieval |
| Guardrails not triggering | Patterns too narrow | Check `detectionPatterns` in guardrail records |
| Claude API timeout | No API key or network issue | Verify `CLAUDE_API_KEY` set correctly |

---

## Phase 4: Manual Validation (5 min)

### 1. Inspect generated response

```bash
cat /tmp/ruach-generate-response.json | jq
```

### Validate structure:

**Required fields:**
- ✅ `nodeId` (UUID)
- ✅ `status` ("success" or "partial")
- ✅ `content` (JSON string with answer structure)
- ✅ `citations` (array with ≥2 scripture citations)
- ✅ `qualityMetrics.citationCoverage` (≥0.7 for Q&A)
- ✅ `qualityMetrics.scriptureCitationCount` (≥2)
- ✅ `metadata.model` ("claude-sonnet-4-20250514")

### 2. Check citation structure:

**Each citation should have:**
```json
{
  "sourceId": "...",
  "locator": "Isaiah 41:10",  // or "Smith, Theology, p. 45"
  "text": "[Scripture: Isaiah 41:10]",
  "isScripture": true,
  "usageType": "foundation"  // or "support", "illustration"
}
```

### 3. Verify in Strapi Admin

**Go to:** Content Manager → library-generated-node

Find the node with the `nodeId` from response.

**Check:**
- ✅ `content` matches response
- ✅ `citationCoverage` matches `qualityMetrics.citationCoverage`
- ✅ `scriptureCitationCount` matches
- ✅ `sourceQuery` is the original query

**Go to:** Content Manager → library-citation

Find citations linked to this node.

**Check:**
- ✅ `isScripture` is true for scripture citations
- ✅ `usageType` is set
- ✅ Citations link to real chunks in `library-chunks`

---

## Phase 5: Hardening (5 min)

### Critical issues to fix before production:

#### 1. Rate Limiting

**Add to `config/middlewares.ts`:**

```typescript
export default [
  // ... existing middlewares
  {
    name: 'strapi::ratelimit',
    config: {
      interval: 60000, // 1 minute
      max: 10,
      targets: [
        {
          method: 'POST',
          route: '/api/ruach-generation/generate',
          max: 5, // 5 generations per minute
        }
      ]
    }
  }
];
```

#### 2. Environment Validation

**Add to `src/index.ts` (before bootstrap):**

```typescript
async bootstrap({ strapi }: { strapi: Core.Strapi }) {
  // Validate environment
  const required = ['OPENAI_API_KEY', 'CLAUDE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // ... rest of bootstrap
}
```

#### 3. Audit Logging

**Add to `ruach-generation.ts` after generation:**

```typescript
strapi.log.info('Generation completed', {
  template: template.templateName,
  mode: request.mode,
  strictMode: request.strictMode,
  coverage: verification.coverage,
  status: verification.status,
  durationMs: Date.now() - startTime
});
```

#### 4. Cost Controls

**Add to each template's `citationRequirements`:**

```typescript
maxTokens: {
  qa_answer: 2000,
  sermon: 4000,
  doctrine_page: 5000,
  study: 3500
}
```

#### 5. Timeouts

**Add to retrieval calls:**

```typescript
const retrievalTimeout = setTimeout(() => {
  throw new Error('Retrieval timeout after 5 seconds');
}, 5000);

try {
  const chunks = await retrieveRelevantChunks(request);
  clearTimeout(retrievalTimeout);
} catch (error) {
  clearTimeout(retrievalTimeout);
  throw error;
}
```

**Add to Claude API calls:**

```typescript
const claudeTimeout = setTimeout(() => {
  throw new Error('Claude API timeout after 30 seconds');
}, 30000);

try {
  const generation = await generateWithClaude(request, chunks, template);
  clearTimeout(claudeTimeout);
} catch (error) {
  clearTimeout(claudeTimeout);
  throw error;
}
```

---

## Final Validation

### Run production readiness check again:

```bash
./scripts/production-readiness-check.sh
```

### Expected after hardening:

```
✅ READY FOR PRODUCTION

Passed:  20
Warnings: 0
Failed:  0
```

---

## Ship It Checklist

Before deploying to production:

- [ ] All smoke tests pass
- [ ] Production readiness check passes with 0 failures
- [ ] Rate limiting configured and tested
- [ ] Environment validation added
- [ ] Audit logging enabled
- [ ] Cost controls in place (max tokens per template)
- [ ] Timeouts configured for retrieval and Claude API
- [ ] API tokens created with appropriate scopes
- [ ] Monitoring set up for:
  - [ ] Generation success rate
  - [ ] Citation coverage trends
  - [ ] Quality scores over time
  - [ ] API latency (p50, p95, p99)
  - [ ] Token usage per output type
- [ ] Alerts configured for:
  - [ ] Generation failures > 5% in 5 minutes
  - [ ] Citation coverage < 70% for 3 consecutive generations
  - [ ] API latency p95 > 30 seconds
  - [ ] Guardrail violations (blocking only)

---

## One Thing to Make It Airtight

**Paste the actual JSON response from a successful `/generate` call:**

```bash
cat /tmp/ruach-generate-response.json | jq
```

**Share this with the team to validate:**

1. **Citation structure** - Are IDs, locators, and source types correct?
2. **Coverage math** - Does `citationCoverage` calculation make sense?
3. **Guardrail outputs** - Are violations detected accurately?
4. **What will break first** - Common culprits:
   - Permissions (403s after deploy)
   - Bootstrap seeding (templates/guardrails missing)
   - Citation validator edge cases (empty content, malformed citations)
   - Retrieval timeout with large datasets
   - Claude API rate limits

---

## Common Production Issues

### Issue 1: Permissions after deploy

**Symptom:** All endpoints return 403

**Fix:** Check Settings → Roles & Permissions → Public → Enable `ruach-generation.*`

### Issue 2: Bootstrap doesn't run in production

**Symptom:** Templates/guardrails missing after deploy

**Fix:** Check `NODE_ENV` - bootstrap may be environment-gated. Remove guards or manually initialize.

### Issue 3: Slow generation (>30s)

**Symptom:** User complaints, timeouts

**Fix:**
- Reduce `retrievalLimit` (20 → 10)
- Increase `relevanceThreshold` (0.7 → 0.8)
- Use Haiku model for faster responses
- Enable async generation with BullMQ

### Issue 4: Low quality scores

**Symptom:** Coverage < 70%, poor user feedback

**Fix:**
- Review retrieved chunks (are they relevant?)
- Tune template requirements (too strict?)
- Lower Claude temperature (0.3 → 0.2)
- Emphasize citations more in system prompt

### Issue 5: High token costs

**Symptom:** API bills spike

**Fix:**
- Enforce `maxTokens` per template
- Reduce `retrievalLimit`
- Monitor token usage per output type
- Consider caching frequent queries

---

## Success Criteria

✅ All 7 smoke tests pass
✅ Production readiness check passes (0 failures)
✅ Generated content has ≥70% citation coverage
✅ Scripture citations ≥2 per Q&A, ≥5 per sermon
✅ Citations link to real chunks in database
✅ Quality score ≥0.7
✅ Guardrail blocking works in strict mode
✅ Response time p95 < 20 seconds
✅ Database records persist correctly
✅ Rate limiting protects endpoints
✅ Environment validation prevents startup with missing keys

---

## Next Steps After Launch

1. **Monitor for 24 hours:**
   - Track success rate, coverage, quality, latency
   - Watch for error patterns

2. **Tune based on real data:**
   - Adjust guardrail patterns based on false positives
   - Tune citation requirements based on user feedback
   - Optimize retrieval based on relevance

3. **Scale preparation:**
   - Load test with 100 concurrent requests
   - Set up auto-scaling rules
   - Enable Redis caching for frequent queries

4. **Feature expansion:**
   - Add Teaching Voice mode
   - Expand to 10+ guardrails
   - Build admin UI for template management
   - Implement user feedback loop

---

**"Prove it works, then ship it."**

---

## Quick Reference

### Run all checks at once:

```bash
# 1. Production readiness
./scripts/production-readiness-check.sh

# 2. Boot Strapi
pnpm develop

# 3. Export token
export TOKEN='your-token'
export STRAPI_URL='http://localhost:1337'

# 4. Run smoke tests
./scripts/smoke-test-ruach-generation.sh

# 5. Review results
cat /tmp/ruach-generate-response.json | jq
```

### Critical files to check:

- `src/index.ts` - Bootstrap initialization
- `config/middlewares.ts` - Rate limiting
- `.env` - API keys (never commit!)
- `src/api/ruach-generation/routes/` - Route definitions
- `database/seeds/ruach-prompt-templates.ts` - Seed data

### Documentation:

- Full system docs: `docs/RUACH_GENERATION_SYSTEM.md`
- Smoke test guide: `docs/SMOKE_TEST_GUIDE.md`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
