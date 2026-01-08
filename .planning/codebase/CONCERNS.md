# Codebase Concerns

**Analysis Date:** 2026-01-08

## Tech Debt

**Massive API client file:**
- Issue: `apps/ruach-next/src/lib/strapi.ts` is 1,935 lines - all data fetching logic in one file
- Why: Rapid development, incremental feature additions without refactoring
- Impact: Hard to maintain, test, and navigate; violates 250-line guideline
- Fix approach: Extract into focused modules: `strapi/auth.ts`, `strapi/media.ts`, `strapi/courses.ts`, etc.

**Large page components:**
- Issue: Several page files exceed 500-1,000 lines
  - `apps/ruach-next/src/app/[locale]/resources/page.tsx` (1,099 lines)
  - `apps/ruach-next/src/app/[locale]/members/account/page.tsx` (968 lines)
  - `apps/ruach-next/src/components/studio/UploadForm.tsx` (506 lines)
- Why: Feature-rich pages built without component extraction
- Impact: Difficult to test, reuse, and maintain
- Fix approach: Extract into smaller components following single responsibility

**Mixed TypeScript/JavaScript in backend:**
- Issue: Backend has mix of `.ts` and `.js` files, inconsistent typing
  - `ruach-ministries-backend/src/api/auth/controllers/custom-auth.js` (383 lines, plain JS)
  - `ruach-ministries-backend/src/services/redis-client.js` (391 lines, plain JS)
- Why: Legacy code from pre-TypeScript migration
- Impact: No type safety for critical auth and Redis logic
- Fix approach: Migrate remaining `.js` files to TypeScript with proper types

**91 occurrences of `any` type:**
- Issue: Extensive use of `any` defeats TypeScript type checking
- Files: `apps/ruach-next/src/lib/strapi.ts`, ingestion controllers, library controllers
- Why: Shortcuts taken for dynamic JSON responses
- Impact: No compile-time type safety
- Fix approach: Define proper interfaces for all API responses and dynamic data

## Known Bugs

**Formation prerequisite validation non-functional:**
- Symptoms: Formation scope progression doesn't check prerequisites
- Trigger: Any formation enrollment/progression attempt
- Files: `ruach-ministries-backend/src/validators/formation-scope.js` (lines 192, 197, 202)
- Root cause: TODO comments show logic returns hardcoded `true`/`false` - not implemented
- Remediation: Implement actual prerequisite queries against formation records

**Like button doesn't persist:**
- Symptoms: Likes stored only in localStorage, reset on logout
- Trigger: Click like on any content
- File: `apps/ruach-next/src/components/social/LikeButton.tsx` (line 60)
- Root cause: API call commented out with `// TODO: Uncomment when backend ready`
- Workaround: Likes work locally in browser session only
- Fix: Implement backend endpoint and enable API call

**Semantic search returns error:**
- Symptoms: Library search throws error when attempting semantic search
- Trigger: Search with `searchType: 'semantic'`
- File: `ruach-ministries-backend/src/api/library-document/controllers/library-document.ts` (line 61)
- Root cause: TODO for OpenAI embedding API integration - not implemented
- Workaround: Falls back to full-text search
- Fix: Implement embedding generation and vector search

**Embedding generation uses placeholder:**
- Symptoms: Semantic search won't work properly
- Trigger: Library document import
- File: `ruach-ministries-backend/scripts/library-migration/import-to-library.ts` (line 295)
- Root cause: TODO shows placeholder embedding values being used
- Impact: Vector search is non-functional
- Fix: Generate actual embeddings using OpenAI API

## Security Considerations

**XSS via dangerouslySetInnerHTML (7 instances):**
- Risk: Raw HTML injection from markdown without sanitization
- Files:
  - `apps/ruach-next/src/components/Prose.tsx` (line 56)
  - `apps/ruach-next/src/app/[locale]/resources/page.tsx`
  - `apps/ruach-next/src/app/[locale]/page.tsx`
  - `apps/ruach-next/src/app/[locale]/guidebook/awakening/[slug]/SectionView.tsx`
  - `apps/ruach-next/src/components/ruach/LessonTranscript.tsx`
  - `apps/ruach-next/src/components/ruach/embeds/EmbedScript.tsx` (embeds third-party scripts)
- Current mitigation: None - uses regex-based markdown parser
- Recommendations: Add DOMPurify sanitization or migrate to `react-markdown`

**Iron Chamber routes publicly accessible:**
- Risk: Curator-only endpoints have no authentication
- File: `ruach-ministries-backend/src/api/iron-chamber/routes/iron-chamber.ts` (line 73)
- Current mitigation: None - `auth: false` explicitly set with TODO comment
- Recommendations: Enable authentication, add curator role check

**Unvalidated file uploads:**
- Risk: Any file type/size can be uploaded to S3
- File: `apps/ruach-next/src/app/api/ingestion/upload/route.ts` (lines 31-83)
- Current mitigation: None - trusts client `contentType` header
- Recommendations:
  - Validate mimetype server-side
  - Enforce max file size (e.g., 50MB)
  - Scan for malicious content

**Environment variable non-null assertions:**
- Risk: Silent failures if env vars are missing
- Pattern: `process.env.NEXT_PUBLIC_STRAPI_URL!` throughout codebase
- Files: `apps/ruach-next/src/lib/strapi.ts`, `apps/ruach-next/src/lib/strapi-admin.ts`, upload routes
- Current mitigation: None
- Recommendations: Use validation library (zod) to check env vars at startup

## Performance Bottlenecks

**Strapi API client in 1,935-line file:**
- Problem: All API logic in single massive file
- File: `apps/ruach-next/src/lib/strapi.ts`
- Measurement: 1,935 lines defeats code splitting
- Cause: No module boundaries for different API domains
- Improvement path: Split into domain modules to enable tree-shaking

**N+1 query risk in media fetching:**
- Problem: Potential N+1 queries when populating relations
- File: `ruach-ministries-backend/src/api/media-item/controllers/media-item.ts`
- Measurement: Not measured, but pattern suggests risk
- Cause: Uses `populate` without explicit batching
- Improvement path: Verify queries with Strapi debug mode, add eager loading

**Unbounded search results:**
- Problem: No pagination in RAG keyword search fallback
- File: `apps/ruach-next/src/lib/ai/rag.ts` (line 102)
- Measurement: Could return entire database
- Cause: Fallback search has no limit clause
- Improvement path: Add pagination (limit: 50) and offset support

## Fragile Areas

**Ingestion queue job processing:**
- File: `ruach-ministries-backend/src/services/unified-ingestion-queue.ts` (806 lines)
- Why fragile: Complex multi-step pipeline with child process spawning, file parsing, database writes
- Common failures: Child process crashes, parsing errors, database connection issues
- Safe modification: Extensive logging and testing before changing job handlers
- Test coverage: No tests found for queue processing

**Regex-based markdown parsing:**
- File: `apps/ruach-next/src/components/Prose.tsx` (lines 48-61)
- Why fragile: Uses regex to parse HTML, prone to edge cases
- Common failures: Breaks on nested lists, special characters, malformed markdown
- Safe modification: Replace with proper markdown parser (react-markdown)
- Test coverage: No tests found

**Formation scope validation:**
- File: `ruach-ministries-backend/src/validators/formation-scope.js`
- Why fragile: Hardcoded logic with TODOs, not actually validating
- Common failures: Always returns success, allowing invalid progressions
- Safe modification: Cannot modify safely - needs complete implementation
- Test coverage: None

## Scaling Limits

**Client-side localStorage for likes:**
- Current capacity: Limited by browser storage (~5-10MB)
- Limit: Breaks when user likes >1000 items
- Symptoms at limit: localStorage quota exceeded, likes stop persisting
- Scaling path: Implement backend persistence via API

**Strapi query performance:**
- Current capacity: ~100-500 concurrent users (estimated)
- Limit: Database connection pool exhaustion
- Symptoms at limit: Slow responses, timeouts, 502 errors
- Scaling path: Add Redis caching, database read replicas, query optimization

## Dependencies at Risk

**AWS SDK at potentially old version:**
- Risk: AWS SDK packages pinned at 3.758.0 - may be 4+ months old
- Impact: Missing security patches and features
- Migration plan: Update to latest 3.x and test S3 integration

**pnpm overrides indicate vulnerabilities:**
- Risk: Multiple security overrides for axios, xml2js, koa, next-auth
- Impact: Known vulnerabilities in dependencies
- Files: Root `package.json` overrides section
- Migration plan: Run `pnpm audit`, update packages, remove overrides when fixed upstream

**Missing DOMPurify dependency:**
- Risk: Using `dangerouslySetInnerHTML` without sanitization library
- Impact: XSS vulnerabilities
- Migration plan: Add `dompurify` or `sanitize-html`, sanitize all HTML before rendering

## Missing Critical Features

**Like button backend persistence:**
- Problem: Likes only saved to localStorage, not database
- Current workaround: Works in single browser session
- Blocks: Cross-device sync, like analytics, fraud prevention
- Implementation complexity: Low - single API endpoint + database table

**Semantic search functionality:**
- Problem: Library search semantic mode throws errors
- Current workaround: Falls back to full-text search
- Blocks: Advanced semantic discovery, AI-powered recommendations
- Implementation complexity: Medium - requires embedding generation pipeline

**Formation prerequisite checking:**
- Problem: Users can skip required formation levels
- Current workaround: None - validation returns hardcoded values
- Blocks: Proper formation progression enforcement
- Implementation complexity: Medium - requires prerequisite graph queries

**Ingestion retry mechanism:**
- Problem: Failed ingestion jobs have no recovery
- Current workaround: Manual re-upload
- Blocks: Resilient content pipeline
- Implementation complexity: Low - add retry logic to BullMQ workers

## Test Coverage Gaps

**API routes almost entirely untested:**
- What's not tested: 15 API routes in `apps/ruach-next/src/app/api/` have zero tests
- Risk: Changes break authentication, ingestion, comments, payments silently
- Priority: HIGH
- Difficulty to test: Medium - requires mock Strapi/Stripe API

**Ingestion pipeline end-to-end:**
- What's not tested: Full upload → S3 → queue → extract → database flow
- Risk: Pipeline could break at any step without detection
- Priority: HIGH
- Difficulty to test: High - requires S3 mock, worker simulation, database fixtures

**Formation validation logic:**
- What's not tested: Formation scope validators have no tests
- Risk: Cannot verify prerequisite logic works (it doesn't currently)
- Priority: MEDIUM
- Difficulty to test: Medium - requires formation record fixtures

**XSS prevention:**
- What's not tested: No security tests for HTML sanitization
- Risk: XSS vulnerabilities go undetected
- Priority: HIGH
- Difficulty to test: Low - write tests with malicious payloads

---

*Concerns audit: 2026-01-08*
*Update as issues are fixed or new ones discovered*
