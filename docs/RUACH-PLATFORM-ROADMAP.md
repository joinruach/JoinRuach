# Ruach Formation Platform - Complete Roadmap

**Project:** Ruach Ministries Formation Platform
**Vision:** Scripture + AI-Sharpened Insights + Formation Journey
**Status:** Infrastructure Complete, Canonical Library End-to-End Validated ✅

---

## 🎯 Executive Summary

The Ruach Platform integrates three powerful systems:

1. **Living Scripture Stream (LSS)** - 103-book YahScriptures translation with reading modes
2. **Iron Chamber** - AI-sharpened margin reflections with community validation
3. **Formation Engine** - Event-sourced spiritual formation journey with gated unlocking

**Architecture:** Strapi v5 (CMS) + PostgreSQL (event store) + Redis (BullMQ) + Claude API (AI) + Next.js 16 (frontend)

---

## ✅ Phase 1: Foundation (COMPLETE)

### Infrastructure Built
- ✅ Strapi v5 backend operational
- ✅ PostgreSQL database configured
- ✅ Redis + BullMQ queue system
- ✅ Next.js 16 frontend (App Router)
- ✅ NextAuth v5 with anonymous user support
- ✅ Digital Ocean deployment pipeline

### Strapi Content Types (19 schemas)

**YahScriptures (8 types):**
- scripture-work, scripture-book, scripture-verse
- scripture-token, scripture-lemma, scripture-alignment
- scripture-theme, glossary-term

**Ministry Works (2 types):**
- ministry-work, ministry-text

**Canonical Library (6 types - NEW, replacing scripture-* + ministry-*):**
- library-license-policy, library-document, library-section
- library-chunk, library-citation, library-generated-node

**Iron Chamber (4 types):**
- iron-insight, insight-vote
- margin-reflection, living-commentary

**Formation Engine (5 types):**
- formation-phase, guidebook-node, canon-axiom, canon-release
- formation-event (existing), formation-journey (existing), formation-reflection (existing)

### Services Implemented
- ✅ Formation Engine service (event sourcing)
- ✅ AI Sharpening service (Claude API integration)
- ✅ BullMQ worker processes (async jobs)
- ✅ Formation Engine API (5 endpoints)
- ✅ Iron Chamber API (7 endpoints)

### Scripts Created
- ✅ YahScriptures PDF extraction (Python)
- ✅ Strapi import script (TypeScript)
- ✅ Supports all 103 books (66 canonical + 37 Apocrypha)

**Location:** `docs/FORMATION-ENGINE-IMPLEMENTATION.md`

---

## 🔄 Phase 2: Content Population (IN PROGRESS)

### Scripture Data Extraction
```bash
# Status: Running extraction now
python extract-yahscriptures.py yahscriptures.pdf output/
python extract-yahscriptures.py Apocrypha.pdf output/
```

**Expected Output:**
- 103 scripture-work records
- ~31,000 scripture-verse records
- Paleo-Hebrew divine names preserved

### Import to Strapi
```bash
export STRAPI_API_TOKEN=your_token_here
pnpm tsx import-to-strapi.ts output/
```

**Timeline:** 1-2 hours for extraction + import

---

### Ministry Works Data Extraction ✅ COMPLETE

**System:** AI-powered EGW ministry book ingestion pipeline
**Status:** Production-ready, first book complete
**Date Completed:** January 7, 2026

#### Phase 1: Core Extraction ✅
```bash
# Extract PDF to structured JSONL
scripts/ministry-extraction/run-ministry-pipeline.sh \
  ministry-pipeline/sources/egw/ministry-of-healing/the_ministry_of_healing.pdf \
  MOH "The Ministry of Healing" "Ellen G. White"
```

**Results (Ministry of Healing):**
- ✅ 2,225 paragraphs extracted
- ✅ 43 chapters detected (100% accuracy)
- ✅ 0 duplicates (fixed!)
- ✅ 0 extraction errors
- ✅ 352 pages processed
- ✅ Average paragraph length: 306.5 chars

**Tools Built:**
- `pdf-extractor.py` - Layout-aware PDF extraction with chapter detection
- `jsonl-to-strapi.py` - Converts JSONL to Strapi-ready JSON
- `validate-ministry-dump.py` - Comprehensive validation with quality gates
- `run-ministry-pipeline.sh` - Master orchestrator script

#### Phase 2: Queue Integration ✅
```bash
# Import to Strapi (idempotent)
export STRAPI_API_TOKEN=your_token_here
npx tsx scripts/ministry-extraction/import-to-strapi.ts \
  ministry-pipeline/ingest/egw/ministry-of-healing/v1
```

**Features:**
- ✅ Idempotent upserts (by workId/textId)
- ✅ Batch processing (100 texts per batch)
- ✅ Skips unchanged records (textHash comparison)
- ✅ Unified ingestion queue integration
- ✅ 5-step automated pipeline:
  1. PDF Extraction
  2. AI Enrichment (optional)
  3. Convert to Strapi format
  4. Validation
  5. Auto-import to Strapi

#### Phase 3: AI Enrichment ✅
```bash
# Enrich with scripture refs + embeddings
npx tsx scripts/ministry-extraction/ai-enrichment.ts \
  ministry-pipeline/exports/egw/ministry-of-healing/v1/paragraphs.jsonl \
  ministry-pipeline/exports/egw/ministry-of-healing/v1/enriched.jsonl \
  --scripture-refs --embeddings
```

**AI Features Completed:**
1. ✅ **Scripture Reference Detection**
   - 475 references found (21% coverage)
   - Supports 66 Bible books + abbreviations
   - Verse range support (John 3:16-18)
   - Free (regex-based)

2. ✅ **Semantic Embeddings**
   - Model: OpenAI text-embedding-3-small
   - Dimensions: 512
   - Cost: $0.0018 per book (~$0.08 for full library)
   - Speed: ~30 seconds per book
   - Unlocks: Semantic search, theme tagging, content clustering

3. ⏳ **Theme Tagging** (Placeholder)
   - Cosine similarity-based
   - Auto-tag with relevant themes
   - Free (local computation)

4. ⏳ **AI Metadata** (Placeholder)
   - Key topics extraction
   - Summary generation
   - Claude Haiku API (~$0.11 per book)

**Total Enrichment Cost (Ministry of Healing):**
- Scripture refs: $0.00 (regex)
- Embeddings: $0.0018
- Theme tagging: $0.00 (not implemented)
- AI metadata: $0.00 (not implemented)
- **Total: $0.0018** (under 1/5 of a cent!)

**Files Structure:**
```
ministry-pipeline/
├── sources/egw/ministry-of-healing/
│   ├── the_ministry_of_healing.pdf
│   └── SHA256SUMS.txt
├── exports/egw/ministry-of-healing/v1/
│   ├── paragraphs.jsonl (1.0M - raw extraction)
│   ├── enriched.jsonl (1.0M - with scripture refs)
│   ├── embedded.jsonl (15M - with embeddings ✨)
│   └── extraction-metadata.json
└── ingest/egw/ministry-of-healing/v1/
    ├── work.json
    ├── texts/texts.0001-0005.json (5 chunks, 2,225 paragraphs)
    ├── meta.json
    └── validation-report.json (PASSED ✅)
```

**Documentation Created:**
- ✅ `scripts/ministry-extraction/README.md` - Complete system docs
- ✅ `scripts/ministry-extraction/TEST-IMPORT.md` - Testing guide
- ✅ `scripts/ministry-extraction/PHASE-2-COMPLETE.md` - Completion summary
- ✅ `scripts/ministry-extraction/EMBEDDING-GENERATOR.md` - Embedding usage guide
- ✅ `scripts/ministry-extraction/EMBEDDINGS-COMPLETE.md` - Results summary

**Next Books to Process (49 remaining EGW books):**
- Desire of Ages
- Steps to Christ
- Patriarchs and Prophets
- Great Controversy
- Acts of the Apostles
- [45 more...]

**Estimated Total Cost for 50 Books:**
- Extraction: Free (local Python)
- Scripture detection: Free (regex)
- Embeddings: ~$0.08 (OpenAI)
- AI metadata: ~$5.50 (Claude Haiku)
- **Total: ~$5.58** for entire EGW library

---

### Canonical Library Schema ✅ PHASE 2 COMPLETE + END-TO-END VALIDATED

**System:** Unified RAG-powered library with licensing enforcement and citation tracking
**Status:** Phase 2 complete (database tables + policies + first import + retrieval test PASSED)
**Date Started:** January 7, 2026
**Phase 2 Completed:** January 8, 2026
**End-to-End Test:** ✅ PASSED (January 8, 2026)

#### Phase 1: Schema Creation ✅ COMPLETE

**Goal:** Replace fragmented `scripture-*` and `ministry-*` schemas with unified `library.*` content types

**New Strapi Content Types (6 schemas):**
1. ✅ `library.license-policy` - Legal gates for content retrieval
   - Enforcement: Max chunk length, chunks per response, RAG/FTS/embedding permissions
   - Default policies: public-domain, fair-use-500, fair-use-1200, cc-by-sa, internal-only, unknown-blocked

2. ✅ `library.document` - Unified parent for all sources
   - Replaces: scripture-work + ministry-work
   - Document types: scripture, ministry_book, theology_book, reference, article, web_content
   - Tracking: ingestionStatus, fileSha256, R2 URLs, license policy

3. ✅ `library.section` - Normalized content units
   - Replaces: scripture-verse + ministry-text
   - Section types: verse, paragraph, heading, blockquote, list_item, footnote
   - Deterministic keys: scripture:kjv:genesis:1:1, book:egw:ministry-of-healing:ch1:p5

4. ✅ `library.chunk` - RAG-optimized retrieval units
   - Chunking: 300-800 tokens, merged from sections with overlap
   - Scripture: 6-12 verses/chunk, 2-4 verse overlap
   - Ministry: 500-700 tokens/chunk, 80-150 token overlap
   - Vector storage: Separate pgvector table for 512-dim embeddings

5. ✅ `library.citation` - Receipt tracking (no hallucinations)
   - Links: generated-node → chunk
   - Tracking: retrieval method, relevance score, attribution text
   - Enforcement: Generated nodes MUST have citations

6. ✅ `library.generated-node` - AI/human teaching nodes
   - Types: teaching, commentary, summary, answer, devotional, study_note
   - Generation: ai_generated, human_authored, ai_assisted, collaborative
   - Review workflow: draft → pending_review → approved → published

**Database Enhancements:**
- ✅ Migration created: `20260107000000_add_library_canonical_schema.js`
- ✅ pgvector table: `library_chunk_embeddings` with IVFFlat index
- ✅ Indexes: Unique keys, locator lookups, full-text search (GIN), vector search (IVFFlat)
- ✅ Extensions enabled: vector, pg_trgm, btree_gin

**Scripts Created:**
- ✅ `scripts/library-migration/seed-license-policies-db.ts` - Seeds 6 default policies (direct DB)
- ✅ `scripts/library-migration/register-content-types.ts` - Manually registers schemas in Strapi metadata
- ✅ `scripts/library-migration/create-tables.ts` - Manually creates database tables
- ✅ `scripts/library-migration/check-tables.ts` - Verifies table creation

#### Phase 2: Database Setup ✅ COMPLETE

**Goal:** Create database tables and seed initial license policies

**Completed Tasks:**
1. ✅ Manually registered 6 library content types in Strapi metadata
2. ✅ Created 8 database tables:
   - `library_license_policies` - 6 default policies seeded
   - `library_documents` - Ready for document imports
   - `library_sections` - Ready for content sections
   - `library_chunks` - RAG-optimized retrieval units
   - `library_citations` - Citation tracking
   - `library_generated_nodes` - AI/human teaching nodes
   - `library_chunk_embeddings` - pgvector table (from migration)
   - `library_chunks_sections_lnk` - Relation table
3. ✅ Seeded 6 default license policies:
   - `lic:public-domain` - Unrestricted use
   - `lic:fair-use-500` - Limited quotation (500 chars)
   - `lic:fair-use-1200` - Extended quotation (1200 chars)
   - `lic:cc-by-sa` - Creative Commons BY-SA 4.0
   - `lic:internal-only` - No retrieval allowed
   - `lic:unknown-blocked` - Default (blocks retrieval)

**Technical Notes:**
- Tables created manually due to Strapi v5 lazy loading behavior
- Content types registered in `strapi_content_types_schema` metadata
- All indexes and constraints properly configured
- pgvector extension confirmed operational

**Storage Strategy:**
- R2 for everything: /library/originals/, /artifacts/, /embeddings/
- Cost: ~$0.04/month per 100 books
- Compression: gzip for artifacts (70-90% reduction)
- Lifecycle: 90-day retention for old versions

**Phase 3: Data Migration - FIRST IMPORT COMPLETE ✅**

**Proof-of-Concept Import (Ministry of Healing):**
1. ✅ Imported Ministry of Healing (1 document, 2,225 sections, 488 chunks)
2. ✅ Generated RAG-optimized chunks (300-800 tokens with overlap)
3. ✅ Inserted embeddings (488 vectors, 512 dimensions, text-embedding-3-small)
4. ✅ End-to-end retrieval test PASSED (full-text search + license enforcement + embeddings verified)

**Test Results:**
- Query: "faith healing"
- Results: 3 relevant chunks from Ministry of Healing chapter 4
- License: Public Domain enforcement working
- Embeddings: All 488 chunks have embeddings for semantic search

**Next Steps (Remaining Migration):**
1. ⏳ Import remaining 49 EGW ministry books
2. ⏳ Migrate existing scripture-work/verse → library.document/section (103 YahScriptures books)
3. ⏳ Generate chunks for all scripture content (RAG optimization)
4. ⏳ Generate embeddings for all scripture chunks
5. ⏳ Upload source files to R2 storage
6. ⏳ Create retrieval API endpoint (semantic + full-text + hybrid search)

**Files Created:**
```
ruach-ministries-backend/
├── src/api/library-license-policy/content-types/library-license-policy/schema.json
├── src/api/library-document/content-types/library-document/schema.json
├── src/api/library-section/content-types/library-section/schema.json
├── src/api/library-chunk/content-types/library-chunk/schema.json
├── src/api/library-citation/content-types/library-citation/schema.json
├── src/api/library-generated-node/content-types/library-generated-node/schema.json
├── database/migrations/20260107000000_add_library_canonical_schema.js
└── scripts/library-migration/
    ├── seed-license-policies-db.ts       # Seeds default license policies
    ├── register-content-types.ts         # Registers schemas in Strapi metadata
    ├── create-tables.ts                  # Manually creates database tables
    ├── check-tables.ts                   # Verifies table creation
    ├── verify-policies.ts                # Verifies license policies seeded
    ├── import-to-library.ts              # Imports ministry works to canonical schema
    ├── insert-embeddings.ts              # Inserts pgvector embeddings
    ├── verify-import.ts                  # Comprehensive import verification
    └── test-retrieval.ts                 # End-to-end retrieval test (PASSED ✅)
```

**Benefits:**
- ✅ Unified retrieval across scripture + ministry + general books
- ✅ License enforcement prevents legal violations
- ✅ Citation tracking prevents AI hallucinations
- ✅ Proper chunking improves RAG quality (vs. 20-80 token sections)
- ✅ pgvector enables fast semantic search
- ✅ Gradual migration preserves existing data

---

### Formation Content Authoring

**Phase Nodes to Create (5 phases):**
1. Awakening (8-10 nodes)
2. Separation (8-10 nodes)
3. Discernment (10-12 nodes)
4. Commission (10-12 nodes)
5. Stewardship (12-15 nodes)

**Canon Axioms to Define:**
- Covenant foundations (10-15 axioms)
- Kingdom theology (10-15 axioms)
- Holiness and sanctification (8-12 axioms)
- Redemption and grace (8-12 axioms)
- Ecclesiology and eschatology (10-15 axioms)

**Canon Releases (Gated Content):**
- Advanced teachings (5-10 releases)
- Prophetic insights (3-5 releases)
- Strategic vision (3-5 releases)

**Timeline:** 4-6 weeks of content writing

**Location:** Strapi Admin → Content Manager

---

## 🚀 Phase 3: Frontend Integration (NEXT)

### Living Scripture Stream UI
```
Features to Build:
├── Scripture browser (by book, chapter)
├── Search functionality (full-text + thematic)
├── Reading modes:
│   ├── Canonical (straight through)
│   ├── Thematic (by theme tags)
│   └── Spirit-led (random meaningful passage)
├── Paleo-Hebrew divine name display
└── Verse sharing and bookmarking
```

**Timeline:** 2-3 weeks

### Ministry Works Reader UI
```
Features to Build:
├── Ministry book browser (by author, title, topic)
├── Chapter navigation with progress tracking
├── Semantic search (powered by embeddings)
│   ├── Natural language queries
│   ├── Similar paragraph recommendations
│   └── Theme-based browsing
├── Scripture reference overlay
│   ├── Inline Bible verse popups
│   ├── Cross-reference linking
│   └── YahScriptures integration
├── Reading features:
│   ├── Adjustable font size
│   ├── Night mode
│   ├── Bookmarks and highlights
│   ├── Reading progress sync
│   └── Notes and annotations
└── AI-powered features:
    ├── Key topics display
    ├── Related content suggestions
    └── Thematic tagging (when implemented)
```

**Timeline:** 3-4 weeks

### Formation Guidebook UI
```
Features to Build:
├── Phase landing pages (5 phases)
├── Guidebook node reader (teaching content)
├── Checkpoint submission flow
│   ├── Reflection prompt display
│   ├── Text/voice input
│   ├── Dwell timer (minimum 2 min)
│   ├── Word count tracker (minimum 50 words)
│   └── AI analysis feedback
├── Progress dashboard
│   ├── Checkpoints completed
│   ├── Reflections submitted
│   ├── Days in phase
│   ├── Current readiness level
│   └── Unlocked content
└── Canon axiom library (unlocked)
```

**Timeline:** 3-4 weeks

### Iron Chamber UI
```
Features to Build:
├── Margin reflection submission
│   ├── Verse context display
│   ├── Reflection editor (rich text)
│   ├── Submit for AI sharpening
│   └── Routing status (publish/journal/thread/review)
├── Published insights feed
│   ├── Filterable by theme
│   ├── Sortable by vote score
│   ├── Depth score badges
│   └── Teaching moments display
├── Insight voting interface
│   ├── Helpful / Profound / Needs Work
│   ├── Optional comment
│   └── Privilege check (Discernment+ phase)
├── Living Commentary viewer
│   ├── Curated wisdom by verse
│   ├── Multiple commentary types
│   ├── Contributor attribution
│   └── Source insight links
└── Thread discussions (routed insights)
```

**Timeline:** 4-5 weeks

**Total Frontend Timeline:** 12-16 weeks
- Living Scripture Stream: 2-3 weeks
- Ministry Works Reader: 3-4 weeks
- Formation Guidebook: 3-4 weeks
- Iron Chamber: 4-5 weeks

---

## 🎨 UI/UX Design Specifications

> **Design Philosophy:** "Sacred Simplicity with Depth on Demand"
> - Clean, distraction-free reading as default
> - Rich features accessible but not intrusive
> - Reverence through typography and whitespace
> - Progressive disclosure of complexity

### Design Principles

**Core Tenets:**
1. **Truth Over Comfort** – Precision matters more than validation
2. **Clarity Over Cleverness** – Simple, direct solutions win
3. **Reflection Over Reaction** – Pause, synthesize, then act
4. **Evolution Over Perfection** – Continuous refinement beats static ideals
5. **Wisdom Over Knowledge** – Applied understanding trumps mere information

### 1. Living Scripture Stream + Ministry Works Reader

These two reading experiences share a unified design language with deep interconnection through scripture reference overlays and cross-linking.

#### Living Scripture Stream Layout

**Triple Reading Mode Switcher:**
- **Canonical Mode:** Traditional book/chapter navigation with progress indicator
- **Thematic Mode:** Filter by theme tags (Creation, Covenant, Judgment, Redemption)
- **Spirit-Led Mode:** Meaningful random selection with weighted algorithm, auto-save to reading journal

**Divine Name Treatment:**
- Default: Paleo-Hebrew (𐤉𐤄𐤅𐤄)
- Alternative: Transliteration (YHWH), Traditional (LORD)
- Pronunciation guide on hover
- User preference saved

**Verse Interaction Layer:**
On verse hover/long-press:
- 🔖 Bookmark
- 📤 Share
- 💬 Add to Iron Chamber
- 📚 Ministry References (shows which books cite this verse)
- 🔗 Cross References

**Search Interface:**
- Full-text and thematic search
- Filters: Exact phrase, thematic, current book only
- Results ranked with relevance scores
- "View in context" option

#### Ministry Works Reader Layout

**Two-Pane Architecture:**
- Left sidebar: Book navigation, topic filters
- Right pane: Reading content with AI insights

**Semantic Search Experience:**
- Natural language queries: "What does Derek Prince teach about breaking generational curses?"
- AI-powered relevance scoring (85%, 78%, etc.)
- "Why this ranked high" explanation
- "Key concepts" extraction
- "Related teachings" from other authors
- "Scripture foundation" for each result

**Scripture Reference Overlay ⭐ Critical Feature:**
- Auto-link all scripture references in ministry text
- Instant popup on hover/tap showing verse from YahScriptures
- Deep link to full chapter
- "Referenced by" counter (cross-reference tracking)

**Reading Progress & Features:**
- Progress bar (% through chapter/book)
- Features panel: Night mode, text size, bookmarks, notes
- AI Insights: Key themes, cross-references, related content

**Annotation System:**
- ✏️ Private Note
- 🔖 Bookmark
- 💬 Submit to Iron Chamber
- 🔗 Share
- Note tagging and organization

**Cross-Content Discovery:**
- "Related Content" sidebar showing:
  - Similar passages from other books
  - Scripture foundation verses
  - Related themes from YahScriptures
  - Iron Chamber insights on related topics

### 2. Formation Guidebook UI

#### Journey Overview Landing Page

**Phase Visualization:**
Ascending levels metaphor:
- ⚰️ DEATH (Acknowledging Need)
- 🏛️ FOUNDATION (Building on Truth) ← Current position
- 🌅 AWAKENING (Eyes Opened)
- ⛰️ SONSHIP (Identity Secured)
- 🏔️ SENDING (Summit - Mission)

**Progress Display:**
- Current phase and day count
- Checkpoint completion percentage
- Next checkpoint preview
- Recent activity feed
- Canon axiom unlock notifications

#### Phase Detail View

**Teaching Nodes Grid:**
- Visual grid of axiom cards
- Status indicators: ✓ Complete, ⟲ In Progress, ○ Locked
- Sequential unlocking pattern
- Estimated completion time

**Canon Axiom Library:**
- Unlocked axioms displayed prominently
- Locked axioms shown with unlock conditions
- Scripture foundation references
- Full axiom text on click

#### Teaching Node Reader

**Reading Experience:**
- Clean typography (Cormorant Garamond for headers, Charter for body)
- Scripture references underlined and clickable
- Popup previews for verse references
- Progress indicator showing % read
- Reading time estimate
- "Proceed to Checkpoint" CTA when complete

#### Checkpoint Submission Flow ⭐ Critical UX

**Step 1: Checkpoint Landing**
- Display reflection prompt (multi-part questions)
- Show requirements:
  - Minimum 50 words
  - Minimum 2 minutes dwell time
  - Honest, personal engagement
- Submission options: ✍️ Write or 🎤 Voice

**Step 2: Reflection Editor**
- Real-time word count (28 / 50 minimum)
- Dwell timer (0:43 / 2:00 minimum)
- Rich text editor for writing
- Voice dictation with real-time transcription
- Save draft capability
- Requirements warning until met
- Submit button disabled until requirements satisfied

**Step 3: Requirements Met**
- Visual confirmation (✅ checkmarks)
- Full reflection displayed
- "Submit for AI Analysis" enabled

**Step 4: AI Analysis + Routing**
- Depth score visualization (████░░ 72%)
- Quality metrics: Specificity, Personal Honesty, Kingdom Alignment
- AI feedback summary
- Sharpening question (follow-up prompt)
- Routing recommendation:
  - ○ Keep Private (Journal)
  - ◉ Publish to Iron Chamber ⭐
  - ○ Create Discussion Thread
  - ○ Needs More Work

**Step 5: Published Confirmation**
- Success message with checkpoint marked complete
- Progress update (9 of 17 checkpoints)
- New content unlock notification (Canon Axiom revealed)
- Iron Chamber activity preview (2 helpful votes received)
- Links: View in Iron Chamber, Continue Journey

#### Progress Dashboard

**Current Phase Summary:**
- Phase name, day count, start date
- Checkpoint completion bar (53%)
- Reflection count (9 submitted, 3 published)
- Canon unlocks (2 of 12 available)

**Phase Readiness Score:**
Criteria checklist:
- ✓ Complete all checkpoints
- ✓ Submit 5+ reflections to Iron Chamber
- ◯ Maintain 30-day minimum in phase
- ◯ Demonstrate consistent engagement
- Estimated unlock date

**Recent Activity Timeline:**
- Chronological list of completions, unlocks, and publications

### 3. Iron Chamber UI

#### Landing Page - Wisdom Feed

**Hero Section:**
- "As iron sharpens iron, so one person sharpens another." — Proverbs 27:17
- Quick actions: Submit Reflection, Browse Discussions, Living Commentary

**Community Insights Feed:**
- Filters: All, Scripture, Formation, Questions
- Sort: Helpful, Recent, Profound
- Insight cards showing:
  - Verse reference and quote
  - Author name and phase
  - Depth score badge (████░░ 78%)
  - Excerpt preview
  - Vote counts (23 helpful, 8 profound)
  - Comment count
  - "Read full insight" link

#### Margin Reflection Submission Flow

**Step 1: Verse Selection**
- Search YahScriptures interface
- Browse by book or recently viewed
- Select target verse

**Step 2: Reflection Editor**
- Verse context displayed at top
- Rich text editor for insight
- Formatting tools, image attach, voice note
- Save draft or submit for AI sharpening

**Step 3: AI Sharpening Analysis**
- Depth score (████░░ 78%)
- Strengths highlighted:
  - ✓ Strong linguistic insight
  - ✓ Clear practical application
  - ✓ Scripture-grounded reasoning
- Teaching moment detection
- AI suggestion for expansion
- Routing recommendation
- Edit or accept & publish

#### Published Insight View

**Insight Display:**
- Verse reference and full quote
- Author, phase, timestamp
- Depth score badge
- Full reflection text

**Community Response:**
- Vote tallies: 👍 23 Helpful, ⭐ 8 Profound, ⚠️ 0 Needs Work
- User voting interface (if privileged)
- Comment thread
- "Load more comments" pagination

#### Voting Interface - Privilege System

**For Discernment+ Phase Users:**
- Three voting options:
  - 👍 Helpful (Clear, useful, Kingdom-aligned)
  - ⭐ Profound (Deep wisdom, transformative)
  - ⚠️ Needs Work (Unclear, unbiblical, lacking depth)
- Optional comment explaining vote
- Vote submission

**For Earlier Phase Users:**
- "Voting Privilege Locked" message
- Unlock requirements explained:
  - Reach Discernment Phase (3rd phase)
  - Demonstrated spiritual maturity
  - Consistent community contribution
- Available actions listed: Read, submit, comment

#### Living Commentary Viewer

**Verse-Based Organization:**
- Search by verse reference
- Display verse text from YahScriptures
- Community insights section (ranked by votes)
- Insight cards: Most Profound, Most Helpful
- Cross-references to related verses
- Ministry references from library (which books cite this verse)

#### Discussion Thread View

**Thread Structure:**
- Original post with question/topic
- Participant count and comment count
- Original post text with scripture references
- Top responses (sorted by helpful votes)
- Response cards showing:
  - Author, phase, timestamp
  - Vote count
  - Response text
  - Expand/collapse for long responses
  - Reply and vote buttons
- "Add your response" editor at bottom

### Shared Design System

#### Typography Hierarchy

**Headers:**
- H1: Book/Chapter Titles — Cormorant Garamond, 32px, 600 weight, -0.02em letter-spacing
- H2: Section Headers — Cormorant Garamond, 24px, 500 weight

**Body:**
- Reading Text — Charter or Freight Text, 18px, 400 weight, 1.7 line-height, max-width 680px
- Scripture References — Small caps variant, 16px, subtle underline on hover
- Divine Names — Paleo-Hebrew: 20px custom font, English fallback: Italicized

#### Color Palette

**Background Modes:**
- Light: #FDFBF7 (warm white)
- Sepia: #F4ECD8 (parchment)
- Night: #1A1A1A (true black with blue tint)

**Text:**
- Primary: #2D2D2D (soft black)
- Secondary: #6B6B6B (mid-gray)
- Accent: #8B4513 (saddle brown - sacred scrolls)

**Interactive:**
- Links: #4A5899 (royal blue)
- Hover: #6B7DB3 (lighter blue)
- Active: #2D3D6B (darker blue)

**Semantic Colors:**
- Divine Name: #D4AF37 (gold)
- AI Insight: #7B68EE (medium slate blue)
- Bookmark: #CD853F (peru)
- Note: #FFE4B5 (moccasin background)

**Phase Colors:**
- Death: #2D2D2D (charcoal)
- Foundation: #8B4513 (saddle brown)
- Awakening: #FFD700 (gold)
- Sonship: #4169E1 (royal blue)
- Sending: #DC143C (crimson)

#### Component Library

**Reading Card:**
- Subtle shadow
- Rounded corners (8px)
- White/dark background
- 24px padding
- Hover: lift effect (+2px)

**Button Styles:**
- Primary: Solid accent color, white text
- Secondary: Outline, accent border
- Ghost: Text only, hover background
- Icon: Circle background on hover

#### Iconography - Forging/Refinement Theme

**Phase Icons:**
- ⚰️ Death (tomb)
- 🏛️ Foundation (pillars)
- 🌅 Awakening (sunrise)
- ⛰️ Sonship (mountain)
- 🏔️ Sending (summit with flag)

**Iron Chamber Icons:**
- 🔨 Sharpening (primary action)
- 💎 Depth score (refined gem)
- ⚡ Teaching moment (insight spark)
- 🔥 Hot take (needs tempering)
- ✓ Validated wisdom (approved)

**Progress Icons:**
- ○ Locked
- ◐ In progress
- ● Complete
- ⭐ Exceptional quality

### Mobile Adaptations

#### Responsive Breakpoints

**Desktop (1024px+):**
- Sidebar + Content (60/40 split)
- Persistent navigation
- Hover interactions

**Tablet (768-1023px):**
- Collapsible sidebar
- Bottom navigation bar
- Touch-optimized targets

**Mobile (< 768px):**
- Full-width content
- Bottom sheet menus
- Swipe gestures
- Floating action button

#### Mobile-First Features

**Scripture Stream Mobile:**
- Full-width verse display
- Swipe gestures for navigation (← previous, → next)
- Long-press for verse menu
- Bottom navigation: [🏠][🔍][🔖][👤]

**Guidebook Mobile:**
- Swipe-based navigation between axioms
- Bottom drawer for checkpoints (swipe up to submit)
- Large mic button for voice input
- Real-time transcription and word count

**Iron Chamber Mobile:**
- Full-width swipeable insight cards
- Quick-vote with long-press
- Tap to expand full insight
- Floating action button: [+ Submit Reflection]

### Unique Differentiators

**1. "Living Link" Animation:**
When scripture reference is hovered:
- Pulse glow effect
- Popup slides up with verse content

**2. "Depth Score" Visualization:**
For AI-analyzed content:
- Spiritual Depth: ●●●●○ (4/5)
- Metrics: Scripture density, Theological accuracy, Practical application

**3. "Reading Streak" Gamification:**
- 🔥 7-day reading streak
- 📖 Book completion percentage
- ⏱️ Reading time this week

**4. "Canon Lens" Filter:**
Toggle to highlight passages aligned with Remnant Guidebook axioms:
- Relevant passages glow with subtle gold border
- Visual distinction without disrupting reading flow

### Cross-Integration Points

#### YahScriptures ↔ Ministry Works

**User Journey:**
1. Reading Derek Prince → cites John 3:16
2. Click reference
3. YahScriptures opens John 3 in split view
4. User can: Read context, Compare, See Iron Chamber insights, Return to book

#### Ministry Works → Formation Guidebook

**AI Suggestion:**
While reading "No Greater Joy":
- 💡 "This aligns with: Foundation Phase → Family Axiom"
- Show related axiom quote
- [View in Guidebook] link

#### Any Reader → Iron Chamber

**Highlight Flow:**
1. User highlights meaningful passage
2. [💬 Submit to Iron Chamber] button
3. Pre-filled reflection form with source context
4. [Submit for AI sharpening]

### Performance Considerations

**Optimization Strategy:**
- Lazy load books: Only current chapter + adjacent
- Infinite scroll: Progressive chapter loading
- Search debounce: 300ms delay on semantic search
- Offline mode: Cache recently read content
- Image optimization: Ministry book covers at 3 sizes

### Advanced Features (Future)

**AI Coach Integration:**
```
🤖 Your Formation Coach
"I noticed you've been dwelling in the Family Axiom for 2 weeks.
 Ready to explore the deeper Canon Axiom on Blessing?"

[Show me] [Not yet]
```

**Community Metrics:**
Iron Chamber Impact:
- Insights submitted: 12
- Helpful votes received: 47
- Comments started: 8
- Teaching moments: 3 ⭐
- Living Commentary citations: 1

**Phase Graduation Ceremony:**
```
🎉 FOUNDATION COMPLETE!

You've completed all checkpoints, demonstrated depth,
and contributed to the community.

Ready to enter AWAKENING?

[Begin Next Phase →]
```

### Implementation Priority

**Phase 1 (Critical):** Guidebook checkpoint flow
- Most critical user journey
- Establishes formation pattern
- Validates AI analysis pipeline

**Phase 2 (Core Community):** Iron Chamber submission + voting
- Enables community wisdom building
- Tests privilege system
- Validates routing logic

**Phase 3 (Integration):** Living Commentary integration
- Connects all three systems
- Demonstrates cross-platform value
- Completes the ecosystem

---

## 🔒 Phase 4: Production Hardening (LATER)

### Security & Performance
- [ ] Rate limiting on all public API endpoints
- [ ] Input sanitization and validation (Zod schemas)
- [ ] Redis persistence configuration
- [ ] Claude API retry logic and fallbacks
- [ ] CDN setup for scripture assets
- [ ] Database query optimization and indexing

### Monitoring & Observability
- [ ] BullBoard dashboard (queue monitoring)
- [ ] Sentry error tracking
- [ ] Analytics integration (PostHog or similar)
- [ ] Log aggregation (Datadog or similar)
- [ ] Uptime monitoring (UptimeRobot)

### Data Integrity
- [ ] Automated database backups
- [ ] Event log backup strategy
- [ ] State recomputation testing
- [ ] Migration rollback procedures
- [ ] Data validation scripts

**Timeline:** 2-3 weeks

---

## 🌟 Phase 5: Community Features (FUTURE)

### Enhanced Collaboration
- [ ] User profiles with formation badges
- [ ] Cohort formation (automatic grouping)
- [ ] Thread discussions on insights
- [ ] Private messaging between users
- [ ] Formation mentorship matching

### Advanced AI Features
- [ ] Personalized reading recommendations
- [ ] Progress prediction and pacing guidance
- [ ] Comparative analysis (user vs. phase average)
- [ ] Teaching moment curriculum generation
- [ ] Automated insight synthesis (weekly digests)

### Gamification (Optional)
- [ ] Achievement system (badges)
- [ ] Streak tracking (daily engagement)
- [ ] Leaderboards (by phase, by insights)
- [ ] Challenges and collaborative goals

**Timeline:** 6-8 weeks

---

## 📊 Current Status Dashboard

### ✅ Completed (Phase 1)
- Strapi backend: 100%
- Database schema: 100%
- Formation Engine service: 100%
- AI Sharpening service: 100%
- BullMQ workers: 100%
- API endpoints: 100%
- Extraction scripts: 100%
- Anonymous user system: 100%

### 🔄 In Progress (Phase 2)
- Scripture extraction: ⏳ (pending)
- Scripture import: 0% (pending extraction)
- Ministry works extraction: **100% ✅** (1/50 books complete)
- Ministry works AI enrichment: **100% ✅** (scripture refs + embeddings)
- Ministry works import: 0% (ready - needs API token)
- **Canonical Library Schema: Phase 2 Complete ✅** (tables + policies seeded - Jan 8, 2026)
- **Canonical Library Schema: Phase 3 Pending** (data migration ready to begin)
- **UI/UX Design Specifications: 100% ✅** (complete design system documented)
- Formation content authoring: 0%
- Canon axiom definitions: 0%

### ⏳ Upcoming (Phase 3)
- Frontend UI development: 0% (ready to begin with complete design specs)

---

## 🗂️ Documentation Index

### Technical Documentation
- **FORMATION-ENGINE-IMPLEMENTATION.md** - Complete architecture guide (13KB)
- **formation-strapi-schema.md** - Original Strapi schema design (7.4KB)
- **scripture-extraction/README.md** - Extraction script usage
- **scripture-extraction/EXTRACTION_GUIDE.md** - Apocrypha support guide
- **scripts/ministry-extraction/README.md** - Ministry works extraction system
- **scripts/ministry-extraction/PHASE-2-COMPLETE.md** - Ministry system completion summary
- **scripts/ministry-extraction/EMBEDDING-GENERATOR.md** - AI embedding generation guide
- **scripts/ministry-extraction/EMBEDDINGS-COMPLETE.md** - Embeddings results report
- **scripts/ministry-extraction/TEST-IMPORT.md** - Ministry import testing guide
- **plans/rippling-skipping-tome.md** - Canonical library schema implementation plan

### Design Documentation
- **RUACH-PLATFORM-ROADMAP.md - UI/UX Design Specifications** - Complete design system for all four platform components (Living Scripture Stream, Ministry Works Reader, Formation Guidebook, Iron Chamber)

### Development Standards
- **TYPESCRIPT_STANDARDS.md** - TypeScript coding standards (14KB)
- **TESTING.md** - Testing guidelines (9.6KB)
- **100-PERCENT-COVERAGE-IMPLEMENTATION.md** - Coverage strategy (14KB)

### Infrastructure Guides
- **DIGITALOCEAN_SPACES_SETUP.md** - Media storage setup (8.9KB)
- **TROUBLESHOOTING_BUILD_BUCKET.md** - Build troubleshooting (4.4KB)

---

## 🚦 Decision Points

### Immediate Decisions Needed
1. ✅ Scripture extraction approach (DECIDED: Running now)
2. ⏳ Formation content authoring workflow (Who writes? How?)
3. ⏳ Canon axiom prioritization (Which doctrines first?)
4. ✅ UI/UX design direction (COMPLETE: Comprehensive design specs documented)

### Strategic Decisions (Future)
1. Mobile app vs. PWA vs. responsive web
2. Subscription model vs. free + donations
3. Community moderation approach (AI + human curators?)
4. Localization strategy (languages beyond English?)

---

## 📈 Success Metrics

### Phase 2 (Content) Success Criteria
- [ ] 103 scripture works imported
- [ ] ~31,000 verses searchable
- [x] 1 ministry work extracted (Ministry of Healing)
- [x] 2,225 ministry paragraphs enriched with AI
- [x] 475 scripture references detected
- [x] 2,225 semantic embeddings generated
- [ ] 49 additional EGW books processed
- [ ] 50+ formation nodes authored
- [ ] 50+ canon axioms defined
- [ ] 10+ canon releases created

### Phase 3 (Frontend) Success Criteria
- [ ] Users can read scripture seamlessly
- [ ] Users can enter covenant and submit reflections
- [ ] AI analysis routes insights correctly
- [ ] Progress tracking accurate across sessions
- [ ] Anonymous users persist via cookies

### Phase 4 (Production) Success Criteria
- [ ] 99.9% uptime
- [ ] < 200ms API response time (p95)
- [ ] Zero data loss in event log
- [ ] AI analysis < 5s per reflection
- [ ] Queue processing < 1 min latency

---

## 🔗 Key Resources

### Code Repositories
- **Monorepo Root:** `/Users/marcseals/Developer/ruach-new/ruach-monorepo`
- **Strapi Backend:** `ruach-ministries-backend/`
- **Next.js Frontend:** `apps/ruach-next/`
- **Formation Package:** `packages/ruach-formation/`

### API Endpoints (Local)
- Strapi Admin: `http://localhost:1337/admin`
- Formation API: `http://localhost:1337/api/formation/*`
- Iron Chamber API: `http://localhost:1337/api/iron-chamber/*`
- Scripture API: `http://localhost:1337/api/scripture-*`

### Production URLs (When Deployed)
- Frontend: `https://joinruach.org`
- API: `https://api.joinruach.org`
- Admin: `https://api.joinruach.org/admin`

---

## 🎉 Next Immediate Steps

### Scripture Pipeline
1. **Monitor scripture extraction** (running now)
2. **Run Strapi import** (once extraction completes)
3. **Verify data integrity** (check verse counts, Paleo-Hebrew preservation)

### Ministry Works Pipeline
1. **Generate Strapi API token** (Settings → API Tokens → Create new)
2. **Test import to Strapi** (Ministry of Healing with embeddings)
3. **Verify records in Strapi Admin** (check embeddings, scripture refs)
4. **Process next high-priority books**:
   - Desire of Ages (~600 pages, ~3,000 paragraphs)
   - Steps to Christ (~200 pages, ~1,000 paragraphs)
   - Great Controversy (~700 pages, ~3,500 paragraphs)
5. **Build theme tagger** (cosine similarity with embeddings)
6. **Build AI metadata generator** (Claude Haiku for key topics)

### Frontend Development
1. **Start formation content authoring** (Awakening phase first)
2. **Design frontend mockups** (Living Scripture Stream priority)
3. **Build ministry works reader** (semantic search with embeddings)

---

**Last Updated:** January 8, 2026
**Version:** 1.5.0
**Status:** Infrastructure Complete, Canonical Library End-to-End Validated ✅

**🔥 The foundation is rock-solid. Ministry works extraction is production-ready. Canonical library PROVEN end-to-end with first import complete!**

**Recent Milestones (January 8, 2026):**
- ✅ **Canonical Library End-to-End Test PASSED:** Ministry of Healing imported (1 document, 2,225 sections, 488 chunks, 488 embeddings). Full-text search + license enforcement + semantic embeddings all validated.
- ✅ **Canonical Library Schema Phase 2 Complete:** All 8 database tables created, 6 license policies seeded, content types registered in Strapi metadata.
- ✅ Ministry of Healing fully extracted, enriched with AI (scripture refs + semantic embeddings), successfully imported to canonical library. Cost: $0.0018.
- ✅ **UI/UX Design Specifications Complete:** Comprehensive design system documented for all four platform components (Living Scripture Stream, Ministry Works Reader, Formation Guidebook, Iron Chamber) including typography, color palette, component library, mobile adaptations, and cross-integration flows.
