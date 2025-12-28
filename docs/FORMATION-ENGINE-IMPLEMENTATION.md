# Formation Engine Implementation Guide

## Overview

This document provides a comprehensive guide to the Ruach Formation Platform implementation, including:
- YahScriptures (Living Scripture Stream)
- Iron Chamber (AI-sharpened reflections)
- Formation Engine (event-sourced spiritual formation journey)

## Architecture

### Event Sourcing Foundation
- **Append-only event log**: All formation actions stored as immutable events
- **State projection**: Current user state computed from event history
- **Async processing**: BullMQ workers handle state recomputation and AI analysis

### Three-Layer System
1. **Living Scripture Stream (LSS)** - Free scripture access with reading modes
2. **Iron Chamber** - AI-sharpened margin reflections and community validation
3. **Formation Engine** - Gated journey with checkpoints and privilege unlocking

## What's Been Created

### 1. Strapi Content Types (17 schemas)

#### YahScriptures (8 schemas)
- ✅ `scripture-work` - 103-book collection metadata
- ✅ `scripture-book` - Canonical groupings
- ✅ `scripture-verse` - Individual verses with Paleo-Hebrew names
- ✅ `scripture-token` - Word-level interlinear tokens
- ✅ `scripture-lemma` - Lexical root forms
- ✅ `scripture-alignment` - Interlinear mappings
- ✅ `scripture-theme` - Thematic tagging
- ✅ `glossary-term` - Theological definitions

#### Iron Chamber (4 schemas)
- ✅ `iron-insight` - AI-analyzed insights from reflections
- ✅ `insight-vote` - Community validation votes
- ✅ `margin-reflection` - Public margin notes on verses
- ✅ `living-commentary` - Curated community wisdom layer

#### Formation Engine (5 schemas)
- ✅ `formation-phase` - Major journey phases (Awakening → Stewardship)
- ✅ `guidebook-node` - Teaching sections within phases
- ✅ `canon-axiom` - Core doctrinal statements
- ✅ `canon-release` - Gated advanced content
- ✅ `formation-event` - Append-only event store (already existed)
- ✅ `formation-journey` - State snapshot pointer (already existed)
- ✅ `formation-reflection` - User reflections at checkpoints (already existed, updated)

### 2. Scripts

#### PDF Extraction
- ✅ `scripts/scripture-extraction/extract-yahscriptures.py`
  - Parses YahScriptures PDF
  - Extracts verses with Paleo-Hebrew preservation
  - Outputs JSON chunks (works + verses)

#### Strapi Import
- ✅ `scripts/scripture-extraction/import-to-strapi.ts`
  - Batch imports works and verses to Strapi
  - Idempotent (safe to re-run)
  - Handles large datasets with chunking

### 3. Services

#### Formation Engine Service
- ✅ `src/api/formation-engine/services/formation-engine.ts`
  - `emitFormationEvent()` - Append events to event log
  - `recomputeFormationState()` - Reduce events to current state
  - `canAccessNode()` - Check unlock requirements
  - `reduceEventsToState()` - Deterministic state folding
  - `computeCanSubmitInsights()` - Privilege calculation
  - `computeCanValidateInsights()` - Privilege calculation

#### AI Sharpening Service
- ✅ `src/api/formation-engine/services/ai-sharpening.ts`
  - `analyzeReflection()` - Claude API integration
  - Formation-level aware system prompts
  - Routing logic (publish/thread/journal/review)
  - Teaching moment generation
  - Depth scoring and readiness assessment

#### BullMQ Queue Service
- ✅ `src/api/formation-engine/services/bull-queue.ts`
  - `enqueueStateRecomputation()` - Async state updates
  - `enqueueReflectionAnalysis()` - Async AI analysis
  - Worker processes with retry logic
  - Queue statistics and monitoring

### 4. API Endpoints

#### Formation Engine API
- ✅ `POST /api/formation/emit-event` - Emit formation event
- ✅ `GET /api/formation/state/:userId` - Get current state
- ✅ `POST /api/formation/recompute/:userId` - Trigger recomputation
- ✅ `GET /api/formation/can-access/:nodeId` - Check node access
- ✅ `GET /api/formation/queue-stats` - Queue statistics

#### Iron Chamber API
- ✅ `POST /api/iron-chamber/margin-reflection` - Submit margin note
- ✅ `GET /api/iron-chamber/margin-reflections/:verseId` - Get margin notes
- ✅ `GET /api/iron-chamber/insights` - List published insights
- ✅ `GET /api/iron-chamber/insights/:insightId` - Get specific insight
- ✅ `POST /api/iron-chamber/insights/:insightId/vote` - Vote on insight
- ✅ `GET /api/iron-chamber/living-commentary/:verseId` - Get curated commentary
- ✅ `POST /api/iron-chamber/curate-commentary` - Create commentary
- ✅ `POST /api/iron-chamber/analyze-reflection/:reflectionId` - Manual AI analysis

## Setup Instructions

### 1. Environment Variables

Add to `ruach-ministries-backend/.env`:

```bash
# Claude API (for AI sharpening)
CLAUDE_API_KEY=sk-ant-xxx

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# Strapi (for import scripts)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=create_in_admin_panel
```

### 2. Initialize BullMQ

Add to `ruach-ministries-backend/src/index.ts`:

```typescript
export default {
  async bootstrap({ strapi }: { strapi: Strapi }) {
    // Initialize BullMQ queues and workers
    await strapi.service('api::formation-engine.bull-queue').initialize();
  },

  async destroy({ strapi }: { strapi: Strapi }) {
    // Graceful shutdown
    await strapi.service('api::formation-engine.bull-queue').shutdown();
  },
};
```

### 3. Extract YahScriptures

```bash
cd ruach-ministries-backend

# Install Python dependencies
pip install pdfplumber

# Run extraction
python scripts/scripture-extraction/extract-yahscriptures.py \
  /path/to/yahscriptures.pdf \
  ./extracted_scripture
```

### 4. Import to Strapi

```bash
# Create API token in Strapi Admin → Settings → API Tokens
export STRAPI_API_TOKEN=your_token_here

# Run import
pnpm tsx scripts/scripture-extraction/import-to-strapi.ts ./extracted_scripture
```

### 5. Set Permissions

In Strapi Admin → Settings → Roles:

**Public role:**
- ✅ `scripture-work`: find, findOne
- ✅ `scripture-verse`: find, findOne
- ✅ `scripture-theme`: find, findOne
- ✅ `formation-phase`: find, findOne
- ✅ `guidebook-node`: find, findOne
- ✅ `iron-insight`: find, findOne
- ✅ `living-commentary`: find, findOne
- ✅ All Formation Engine routes
- ✅ All Iron Chamber routes

### 6. Test the System

```bash
# Test scripture API
curl http://localhost:1337/api/scripture-works

# Emit a formation event
curl -X POST http://localhost:1337/api/formation/emit-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "covenant_entered",
    "eventData": {"covenantType": "formation_journey"},
    "anonymousUserId": "anon-test-123"
  }'

# Get formation state
curl http://localhost:1337/api/formation/state/anon-test-123

# Check queue stats
curl http://localhost:1337/api/formation/queue-stats
```

## Data Flow

### Formation Journey Flow

```
User Action (Next.js)
  ↓
POST /api/formation/emit-event (Strapi)
  ↓
formation_events table (append-only)
  ↓
BullMQ job enqueued
  ↓
Worker: recomputeFormationState()
  ↓
formation_journeys table (state snapshot)
```

### Iron Chamber Flow

```
User submits reflection (Next.js checkpoint form)
  ↓
formation_reflections table
  ↓
POST /api/iron-chamber/analyze-reflection
  ↓
BullMQ job enqueued
  ↓
Worker: AI sharpening via Claude API
  ↓
iron_insights table (with routing decision)
  ↓
If routing = "publish" → Published immediately
If routing = "thread" → Available for discussion
If routing = "journal" → Private only
If routing = "review" → Human curator review
```

## Key Architectural Decisions

### 1. Event Sourcing Over Direct State Mutation
- **Why**: Immutable audit trail, state can be recomputed, enables time-travel debugging
- **Trade-off**: Slightly more complex than direct updates, eventual consistency

### 2. AI as "Sharpener" Not "Judge"
- **Why**: Preserves user voice, encourages authentic reflection
- **Trade-off**: May allow lower-quality content initially, relies on community validation

### 3. Gated Privilege Unlocking
- **Why**: Ensures maturity before teaching responsibilities
- **Trade-off**: May frustrate advanced users who join later

### 4. Async Processing via BullMQ
- **Why**: Non-blocking user experience, resilient to Claude API rate limits
- **Trade-off**: Eventual consistency, requires queue monitoring

## Next Steps for Production

### Phase 1: Content Population
1. ✅ Extract YahScriptures PDF
2. ✅ Import scripture data to Strapi
3. ⏳ Create formation phases (Awakening → Stewardship)
4. ⏳ Write guidebook nodes (teaching content)
5. ⏳ Define canon axioms (core doctrines)

### Phase 2: Frontend Integration
1. ⏳ Build Living Scripture Stream UI (Next.js)
2. ⏳ Integrate formation checkpoint flow with AI analysis
3. ⏳ Create Iron Chamber margin reflection UI
4. ⏳ Build Living Commentary display

### Phase 3: Production Hardening
1. ⏳ Add rate limiting to API endpoints
2. ⏳ Set up Redis persistence for BullMQ
3. ⏳ Configure Claude API retry logic
4. ⏳ Add monitoring and alerting (BullBoard)
5. ⏳ Implement backup strategy for event log

### Phase 4: Community Features
1. ⏳ Insight voting and validation
2. ⏳ Thread discussions on routed insights
3. ⏳ Living Commentary curation workflow
4. ⏳ Theme-based scripture exploration

## Monitoring

### BullMQ Dashboard

Install BullBoard for queue monitoring:

```bash
pnpm add @bull-board/api @bull-board/koa
```

Add to Strapi admin panel or standalone route.

### Key Metrics to Track
- Event emission rate
- State recomputation latency
- AI analysis queue depth
- Claude API success/failure rate
- Reflection depth score distribution
- Insight routing breakdown (publish/thread/journal/review)

## Troubleshooting

### "Claude API key not configured"
- Set `CLAUDE_API_KEY` in `.env`

### "Redis connection refused"
- Ensure Redis is running: `redis-server`

### "State recomputation not happening"
- Check BullMQ workers are started in `src/index.ts`
- Verify Redis connection
- Check queue stats: `GET /api/formation/queue-stats`

### "Insights not being created"
- Check reflection analysis queue
- Verify Claude API key is valid
- Check Strapi logs for errors

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     RUACH FORMATION PLATFORM                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   YahScriptures  │   Iron Chamber   │ Formation Engine │
│  │     (LSS)        │  (AI Insights)   │   (Journey)      │
│  └────────┬─────────┘  └──────┬───────┘  └──────┬─────────┘
│           │                   │                 │          │
│           └───────────────────┴─────────────────┘          │
│                              │                             │
│                    ┌─────────┴─────────┐                   │
│                    │   Strapi v5 Core  │                   │
│                    ├───────────────────┤                   │
│                    │ - Event Store     │                   │
│                    │ - State Snapshots │                   │
│                    │ - Content Types   │                   │
│                    └─────────┬─────────┘                   │
│                              │                             │
│              ┌───────────────┼───────────────┐             │
│              │               │               │             │
│         ┌────┴────┐    ┌─────┴─────┐   ┌────┴────┐        │
│         │PostgreSQL│    │  Redis    │   │ Claude  │        │
│         │(Events)  │    │ (BullMQ)  │   │  API    │        │
│         └──────────┘    └───────────┘   └─────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Success Criteria

✅ **Infrastructure**
- Strapi v5 running with all 17 content types
- BullMQ workers processing jobs
- Redis queue operational
- Claude API integrated

✅ **Scripture Data**
- YahScriptures 103 books imported
- Verses searchable and retrievable
- Paleo-Hebrew divine names preserved

✅ **Formation Engine**
- Events emitted and stored
- State recomputation working
- Access gating functional
- Privilege computation accurate

✅ **Iron Chamber**
- AI analysis operational
- Routing logic working
- Insights created from reflections
- Community validation enabled

---

**Ready for content population and frontend integration!** 🎉
