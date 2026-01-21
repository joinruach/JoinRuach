# Ruach-Aligned AI Content Generation System

**Core Principle:** "If the model can't cite it, it can't claim it."

## Overview

This system implements scripture-anchored content generation with mandatory citation tracking. All AI-generated content (Q&A, sermons, studies, doctrine pages) must carry citations to scripture and approved library sources.

## Architecture

```
User Request
    ↓
1. RETRIEVE: Hybrid search (scripture + library chunks)
    ↓
2. GROUND: Filter by authority, check guardrails
    ↓
3. GENERATE: Claude with structured prompt + citations
    ↓
4. VERIFY: Citation validation + quality gates
    ↓
5. SAVE: Persist to library-generated-node
    ↓
Response with citations + quality metrics
```

## Database Schema

### New Content Types

#### 1. `ruach-guardrails`
Doctrinal boundaries for AI validation

**Key Fields:**
- `guardrailId` - Unique identifier
- `category` - doctrine | interpretation | application
- `enforcementLevel` - blocking | warning | guidance
- `detectionPatterns` - JSON with regex/keywords
- `correctionGuidance` - Help text for violations

#### 2. `ruach-prompt-templates`
Structured prompts for each output type

**Key Fields:**
- `templateId` - Unique identifier
- `outputType` - sermon | study | qa_answer | doctrine_page
- `generationMode` - scripture_library | scripture_only | teaching_voice
- `systemPrompt` - Claude system prompt
- `userPromptTemplate` - User prompt with {{variables}}
- `citationRequirements` - Min citations, coverage threshold
- `responseFormat` - JSON schema for output

#### 3. Extended `library-generated-node`
Now includes:
- `citationCoverage` (0-1)
- `scriptureCitationCount`
- `libraryCitationCount`
- `guardrailViolations` (JSON)
- `verificationLog` (JSON)
- `sourceQuery` (original query)

#### 4. Extended `library-citation`
Now includes:
- `isScripture` (boolean)
- `usageType` - foundation | support | illustration
- `verificationStatus` - pending | verified | flagged
- `citationWeight` (0-1)

## API Endpoints

### Main Generation Endpoint

**POST /api/ruach-generation/generate**

```json
{
  "query": "What does Scripture say about fear?",
  "outputType": "qa_answer",
  "mode": "scripture_library",
  "strictMode": true
}
```

**Response:**
```json
{
  "nodeId": "uuid",
  "status": "success",
  "content": "...",
  "citations": [...],
  "qualityMetrics": {
    "citationCoverage": 0.85,
    "scriptureCitationCount": 3,
    "libraryCitationCount": 2,
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

### Supporting Endpoints

**GET /api/ruach-generation/templates**
- List available prompt templates
- Filter by `outputType`

**GET /api/ruach-generation/templates/:templateId**
- Get specific template details

**POST /api/ruach-generation/verify-citations/:nodeId**
- Re-verify citations for existing content
- Updates quality metrics

**GET /api/ruach-generation/guardrails**
- List active guardrails
- Filter by `category`

**POST /api/ruach-generation/check-guardrails**
- Check content against guardrails (utility)

**POST /api/ruach-generation/initialize**
- Initialize starter guardrails (admin only)

## Services

### 1. ruach-generation.ts (Main Orchestrator)

**Key Functions:**
- `generateContent(request)` - Main pipeline
- `retrieveRelevantChunks()` - Hybrid + scripture search
- `groundChunks()` - Authority filtering
- `generateWithClaude()` - Claude API call
- `verifyGeneration()` - Quality checks
- `saveGeneratedNode()` - Persist results

### 2. ruach-citation-validator.ts

**Key Functions:**
- `calculateCitationCoverage()` - Sentence-level analysis
- `verifyCitations()` - Check requirements
- `validateCitationAccuracy()` - Verify against DB
- `generateQualityReport()` - Comprehensive metrics

### 3. ruach-guardrail-engine.ts

**Key Functions:**
- `checkGuardrails()` - Run all active guardrails
- `detectViolations()` - Pattern matching
- `initializeStarterGuardrails()` - Create defaults

## Starter Guardrails (3 Minimal)

### 1. Scripture Citation Required (BLOCKING)
- **Category:** doctrine
- **Pattern:** Doctrinal claims without citations
- **Guidance:** "Every doctrinal claim must cite scripture"

### 2. No External Theology (WARNING)
- **Category:** interpretation
- **Pattern:** References to unapproved sources
- **Guidance:** "Only use approved library sources"

### 3. Synthesis Labeling (GUIDANCE)
- **Category:** interpretation
- **Pattern:** Interpretation without synthesis labels
- **Guidance:** "Label synthesis: 'These passages suggest...'"

## Prompt Templates (4 Required)

### 1. Q&A Assistant
- **Min Scripture:** 2
- **Min Library:** 1
- **Coverage:** 70%
- **Response Format:** { question, directAnswer, explanation, relatedQuestions }

### 2. Sermon Outline
- **Min Scripture:** 5
- **Min Library:** 2
- **Coverage:** 80%
- **Response Format:** { title, mainText, introduction, points[], conclusion }

### 3. Doctrine Page
- **Min Scripture:** 8
- **Min Library:** 3
- **Coverage:** 90%
- **Response Format:** { topic, definition, scripturalFoundation, application, commonDistortions }

### 4. Bible Study
- **Min Scripture:** 6
- **Min Library:** 2
- **Coverage:** 75%
- **Response Format:** { title, mainPassage, sessions[] }

## Quality Metrics

### Citation Coverage Calculation

```typescript
function calculateCitationCoverage(content: string, citations: Citation[]): number {
  // 1. Parse content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // 2. Count sentences with citations
  let coveredSentences = 0;
  for (const sentence of sentences) {
    const hasCitation = citations.some(c => sentence.includes(c.text));
    if (hasCitation) coveredSentences++;
  }

  // 3. Return ratio
  return coveredSentences / sentences.length;
}
```

### Quality Score Formula

```typescript
function calculateQualityScore(metrics: Metrics): number {
  const weights = {
    citationCoverage: 0.35,
    scriptureRatio: 0.30,
    guardrailCompliance: 0.25,
    accuracy: 0.10
  };

  const scores = {
    citationCoverage: metrics.citationCoverage,
    scriptureRatio: Math.min(metrics.scriptureCitationCount / 3, 1.0),
    guardrailCompliance: metrics.guardrailScore,
    accuracy: metrics.citationAccuracy
  };

  return Object.keys(weights).reduce(
    (total, key) => total + (weights[key] * scores[key]),
    0
  );
}
```

### Quality Gates

1. **Citation Minimum** - Fail if scripture/library < required
2. **Coverage Threshold** - Fail if coverage < 70-90% (varies by template)
3. **Guardrail Compliance** - Fail if blocking guardrail violated
4. **Citation Accuracy** - Verify chunks exist in DB

## Scripture-Specific Retrieval

### Hybrid Search for Scripture

```sql
-- Combines full-text search + semantic embedding search
-- Uses Reciprocal Rank Fusion to merge results
WITH text_results AS (
  SELECT verse_id, verse_text, ts_rank(...) AS text_score
  FROM scripture_verses
  WHERE text_search_vector @@ plainto_tsquery(...)
),
vector_results AS (
  SELECT verse_id, verse_text, 1 - (embedding <=> query_vector) AS vector_score
  FROM scripture_verses
  JOIN scripture_embeddings USING (verse_id)
  ORDER BY embedding <=> query_vector
)
SELECT *, (text_score + vector_score) AS rrf_score
FROM fused_results
ORDER BY rrf_score DESC
```

### Exact Reference Matching

```
Input: "Matthew 6:25-34"
→ Parse: { book: "Matthew", chapter: 6, verseStart: 25, verseEnd: 34 }
→ Query: scripture_verses WHERE book ILIKE 'Matthew' AND chapter = 6 AND verse_number BETWEEN 25 AND 34
→ Return: Exact verses with score = 1.0
```

## Setup & Initialization

### 1. Database Migration

Run Strapi in development mode to auto-create new content types:

```bash
cd ruach-ministries-backend
pnpm develop
```

Strapi will auto-generate tables:
- `ruach_guardrails`
- `ruach_prompt_templates`
- Update `library_generated_nodes`
- Update `library_citations`

### 2. Initialize Starter Data

On first startup, the bootstrap hook will:
1. Create 3 starter guardrails
2. Create 4 prompt templates

**Manual initialization (if needed):**

```bash
# Via API (requires admin auth)
curl -X POST http://localhost:1337/api/ruach-generation/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Environment Variables

Add to `.env`:

```env
CLAUDE_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key  # For embeddings
```

## Usage Examples

### Example 1: Generate Q&A Answer

```javascript
const response = await fetch('http://localhost:1337/api/ruach-generation/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    query: "What does Scripture say about fear?",
    outputType: "qa_answer",
    mode: "scripture_library",
    retrievalLimit: 20,
    relevanceThreshold: 0.7,
    strictMode: true
  })
});

const result = await response.json();
console.log(result);
```

### Example 2: Generate Sermon Outline

```javascript
const response = await fetch('http://localhost:1337/api/ruach-generation/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    query: "Create a sermon on Matthew 6:25-34 about anxiety",
    outputType: "sermon",
    mode: "scripture_library",
    strictMode: false  // Allow warnings, don't fail on low coverage
  })
});

const result = await response.json();
console.log(result.content); // JSON with title, points, etc.
console.log(result.qualityMetrics); // Citation coverage, scores, etc.
```

### Example 3: Verify Existing Content

```javascript
const response = await fetch('http://localhost:1337/api/ruach-generation/verify-citations/node-uuid', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const report = await response.json();
console.log(report.coverage); // 0.85
console.log(report.report.errors); // ["Insufficient scripture citations"]
console.log(report.report.recommendations); // ["Add more scripture citations..."]
```

## Testing

### Unit Tests (Vitest)

```bash
cd ruach-ministries-backend
pnpm test src/api/library/services/ruach-citation-validator.test.ts
```

**Test Coverage:**
- Citation coverage calculation
- Quality score formula
- Scripture reference parsing
- Guardrail pattern detection

### Integration Tests

```bash
pnpm test src/api/ruach-generation/integration.test.ts
```

**Test Scenarios:**
- End-to-end generation flow
- Template variable substitution
- Citation verification
- Guardrail enforcement

### Quality Tests

```bash
pnpm test src/api/ruach-generation/quality.test.ts
```

**Test Cases:**
- Generate 10 Q&A responses → verify 100% citation coverage
- Generate 5 sermons → verify scripture minimum met
- Test guardrail violations → verify blocking works
- Test zero retrieval results → verify graceful handling

## Verification Scenarios

### Scenario 1: Q&A Generation
```
Input: "What does Scripture say about fear?"
Expected:
  - 20 chunks retrieved (mix scripture + library)
  - 2+ scripture citations
  - Coverage > 70%
  - No guardrail violations
  - Quality score > 0.7
  - Node saved to DB
```

### Scenario 2: Sermon Outline
```
Input: "Create a sermon on Matthew 6:25-34"
Expected:
  - Matthew 6 verses retrieved
  - 3-point outline generated
  - 5+ scripture citations
  - Coverage > 80%
  - All points have application
  - Quality score > 0.75
```

### Scenario 3: Doctrine Page
```
Input: "Explain the doctrine of the Trinity"
Expected:
  - Scripture + theology books retrieved
  - Definition + foundation + application
  - 8+ scripture citations
  - 3+ library citations
  - Coverage > 90%
  - Quality score > 0.8
```

### Scenario 4: Guardrail Violation
```
Input: Generate content with uncited doctrinal claim
Expected:
  - Guardrail engine detects violation
  - Generation fails (strict mode) or warns
  - Error returned with guidance
  - No node saved
```

## Performance

**Target Metrics:**
- API latency p95 < 20 seconds
- Citation coverage > 70% (all output types)
- Quality score > 0.7 (all output types)
- Zero blocking guardrail failures in production

**Optimization Strategies:**
- Limit retrieval to 20 chunks (default)
- Cache frequent queries (Redis, 5 min TTL)
- Use BullMQ for async generation (future)
- Parallel scripture + library search

## Troubleshooting

### Issue: Low Citation Coverage

**Symptoms:** Quality score < 0.7, coverage < 70%

**Solutions:**
1. Check template citation requirements - may be too strict
2. Verify retrieval is returning relevant chunks
3. Adjust Claude temperature (lower = more structured)
4. Review prompt - ensure it emphasizes citations

### Issue: Guardrail False Positives

**Symptoms:** Content blocked with valid citations

**Solutions:**
1. Review detection patterns - may be too broad
2. Adjust enforcement level (blocking → warning)
3. Add exclusions to pattern (negative lookahead)
4. Tune pattern confidence threshold

### Issue: Slow Generation (>30s)

**Symptoms:** Timeouts, poor UX

**Solutions:**
1. Reduce `retrievalLimit` (20 → 10)
2. Increase `relevanceThreshold` (0.7 → 0.8)
3. Use Haiku model for faster responses (lower quality)
4. Enable async generation via BullMQ

### Issue: Inaccurate Citations

**Symptoms:** Citations don't match source chunks

**Solutions:**
1. Verify chunk embeddings are up-to-date
2. Check scripture_verses table has data
3. Review Claude prompt - may need clearer citation format
4. Enable citation accuracy validation (already implemented)

## Future Enhancements

### Phase 7: Teaching Voice Mode
- Requires `teaching-voice-guide` content type
- Mirrors specific teacher's style + tone
- Same citation requirements

### Phase 8: Expanded Guardrails
- Start with 3 minimal → expand to 10+ based on testing
- Add doctrinal checks (Trinity, deity of Christ, etc.)
- Add hermeneutical checks (context, genre, etc.)

### Phase 9: Admin UI
- Template management (create, edit, test)
- Guardrail configuration (patterns, enforcement)
- Analytics dashboard (violation rates, quality trends)

### Phase 10: Async Generation
- BullMQ job queue for long-running tasks
- Progress tracking via webhooks
- Batch generation support

### Phase 11: User Feedback Loop
- Upvote/downvote citations
- Flag inaccurate citations
- Suggest alternative citations
- Citation quality training data

## License & Attribution

**Co-Authored-By:** Claude Sonnet 4.5 <noreply@anthropic.com>

All generated content includes this attribution in metadata.

## Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check logs: `strapi.log.error` output
4. File issue in project repo

---

**"Truth in Code, Clarity in Creation."**
