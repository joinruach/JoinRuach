# Phase 6 Architecture Spec — Studio Automation & Intelligence

> **Status:** Draft
> **Author:** Forge Dev Intelligence
> **Date:** 2026-02-26

---

## Vision

Phase 6 transforms Ruach Studio from a content management system with manual operator workflows into **discipleship infrastructure with automated production**. Today, an operator must manually sync cameras, hand-cut an EDL, render each format individually, and manually sequence formation content. Phase 6 replaces these with a one-click pipeline: raw multicam footage in, synced/assembled/rendered artifacts out, and each user receives a personalized formation journey. The operator shifts from labor to review.

---

## Three Pillars

### Pillar 1 — Automated Multicam Assembly

**What Exists:**

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `sync-engine.ts` | 395 | Cross-correlation via `audio-offset-finder` |
| `audio-quality-analyzer.ts` | 85 | Master camera selection |
| `fcpxml-generator.ts` | 208 | NTSC rational timing |
| `canonical-edl.ts` | 203 | Full type system with `EDLGenerationOptions` |

**What to Build:**

1. **Audio Energy Analyzer** — Per-camera, per-500ms-window RMS energy via FFmpeg `astats`. Pure function. Input: WAV path + window size. Output: `Float32Array` of energy values.

2. **Angle Selection Heuristic** — Loudest camera wins with 6dB lead threshold. Enforces `minShotLength` (2s) + `switchCooldown` (1.5s). Wide shot selected during silence. Each cut annotated with confidence score (0–1).

3. **Auto-EDL Generator** — Chains the pipeline: sync offsets → energy analysis → angle selection → `CanonicalEDL` → draft saved in Strapi. Single orchestration function.

4. **Operator Review Endpoint** — Extends the existing sync approval pattern to EDL review. Cuts displayed with confidence-colored indicators (green ≥0.8, yellow ≥0.5, red <0.5).

**Output:** One-click "Assemble" → reviewable EDL with per-cut confidence colors.

---

### Pillar 2 — Render Pipeline Orchestration

**What Exists:**

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `render-job-service.ts` | 441 | Full CRUD for render jobs |
| `render-state-machine.ts` | 133 | State transitions |
| `render-queue.ts` | — | BullMQ, 3 retry attempts |
| `render-worker.ts` | 245 | Full render pipeline |
| `remotion-runner.ts` | 133 | CLI-based (not Lambda) |
| `r2-upload.ts` | 141 | Working S3-compatible client |

**What to Build:**

1. **Lambda RemotionRunner** — Replace CLI execution with `@remotion/lambda`. Removes the 30-minute local render bottleneck. Keeps the same `RemotionRunner` interface so the worker is unaffected.

2. **Format Presets** — Four standard output formats:
   - `full_16_9` — 1920×1080, -14 LUFS normalized
   - `short_9_16` — 1080×1920, 60s max, auto-subtitles
   - `clip_1_1` — 1080×1080, center-crop
   - `thumbnail` — 1920×1080 JPEG, key frame extraction

3. **Render All Endpoint** — `POST /render-jobs/render-all/:sessionId` → enqueues 4 parallel BullMQ jobs (one per format preset).

4. **Audio Normalization** — LUFS targeting via FFmpeg `loudnorm` filter as a post-render step. Applied to all audio-containing formats.

5. **Progress Streaming** — SSE endpoint (`GET /render-jobs/:jobId/progress`) for real-time render progress. Frontend subscribes per-job.

**Output:** Session → "Render All" → 4 formats queued → artifacts uploaded to R2 with CDN URLs.

---

### Pillar 3 — Formation Intelligence Layer

**What Exists:**

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `formation-engine.ts` | 353 | Event sourcing, 17 event types, `canAccessNode()` gating |
| `FormationState` | — | 5 phases, readinessLevel, privileges |
| pgvector | — | Semantic search operational |
| RAG pipeline | — | User history–aware retrieval |

**What to Build:**

1. **Content Dependency Graph** — DAG stored as a Strapi content type (`formation-dependency`). Each node references a content piece + prerequisite nodes. Validated on save via lifecycle hook (reject cycles using topological sort).

2. **Watch-Path Sequencing** — Topological sort of the dependency graph → filter by user's completed prerequisites → rank by recency + content diversity. Returns an ordered list of "next watchable" content.

3. **Formation Scoring** — Weighted formula:
   | Factor | Weight |
   |--------|--------|
   | Sections completed | 20% |
   | Reflection quality (AI-assessed) | 25% |
   | Checkpoint passages | 35% |
   | Time-in-phase | 10% |
   | Engagement streak | 10% |

4. **Auto-Gating** — Extends `canAccessNode()` with `minimumScore` thresholds per node. Emits `formation.gated` and `formation.unlocked` events to the event-sourced log.

5. **Next Step Widget** — `GET /formation-engine/next-step` → returns top 3 recommended nodes for the authenticated user. Powers the dashboard "Continue Your Journey" widget.

**Output:** Personalized "Next Step" on dashboard. Content unlocks based on demonstrated formation, not time elapsed.

---

## Failure Isolation & Resilience

The three pillars are **independently deployable and independently degradable**. No pillar failure takes down another.

### Isolation Boundaries

| Scenario | Assembly (P1) | Render (P2) | Formation (P3) |
|----------|:-------------:|:-----------:|:--------------:|
| Render Pipeline down | Operates normally. EDLs created, queued for render. | **DOWN** — jobs queue in BullMQ dead-letter. | Operates normally. Existing CDN URLs still serve. |
| Assembly errors | **DOWN** — operator falls back to manual EDL. | Operates normally on any locked EDL. | Operates normally. |
| Formation engine down | Operates normally. | Operates normally. | **DOWN** — dashboard shows static content list. |
| Redis outage | Degrades (no queue). Sync still works. | Degrades (no queue). Manual render possible. | Degrades (no cache). Falls back to DB queries. |

### Idempotency Guarantees

| Operation | Idempotency Key | Behavior on Replay |
|-----------|----------------|-------------------|
| Auto-EDL generation | `sessionId + syncVersion` | Returns existing draft if already generated for this sync version. |
| Render job creation | `sessionId + format + edlVersion` | Returns existing job if already enqueued. No duplicate renders. |
| R2 upload | `sessionId + format + renderJobId` | Overwrites same key. S3 PUT is naturally idempotent. |
| Formation event emission | `userId + eventType + contentId + timestamp` | Event store rejects duplicate `(userId, eventType, contentId)` within 1-second window. |
| Stripe webhook processing | `stripeEventId` | Lookup before processing. Skip if already handled. |

### Replay Strategy

Every pillar supports **replay from its last known-good state**:

- **Assembly:** Re-run from sync offsets (immutable). Energy analysis is a pure function — same input, same output. Angle selection deterministic given same energy matrix.
- **Render:** BullMQ `render-queue` with 3 auto-retries + exponential backoff. Dead-letter queue (`render-jobs-dlq`) captures permanently failed jobs for operator review. Jobs are resumable from the last completed step (render → normalize → upload).
- **Formation:** Event-sourced. State is rebuildable from the event log at any time. `replayFormationEvents(userId)` reconstructs `FormationState` from scratch.

### Backpressure Handling

| Queue | Max Concurrency | Backpressure Mechanism |
|-------|----------------|----------------------|
| `render-jobs` | 3 concurrent | BullMQ rate limiter. New jobs wait. No rejection. |
| `media-transcoding` | 2 concurrent | Same. Memory-bound — FFmpeg processes are large. |
| `formation-state` | 10 concurrent | Lightweight event writes. Unlikely to back up. |

**Graduated Response (per queue):**

| Depth | Level | Behavior |
|-------|-------|----------|
| >50 | `warning` | Emit `queue.backpressure.warning` to operator dashboard. Log with correlation. |
| >200 | `degraded` | Pause non-critical queues (thumbnails, social clips). Keep `full_16_9` and formation events flowing. Emit `queue.backpressure.degraded`. |
| >500 | `shedding` | Block new non-essential render requests with HTTP 503 + `Retry-After: 300`. Only operator-initiated critical renders accepted. Emit `queue.backpressure.shedding`. |

No auto-scaling in Phase 6 — but the system protects itself. Operator decides when to resume normal mode.

---

### Operator Recovery Commands

These are the **only** recovery actions available. If it's not on this list, it requires a code change — not improvisation during an incident.

| Command | Pillar | When to Use | Side Effects |
|---------|--------|-------------|-------------|
| `render.retry(renderJobId, reason)` | Render | Job in DLQ, root cause fixed | Re-enqueues with new `renderJobId`, same `automationId`. Logged with operator reason. |
| `render.resume(sessionId, step)` | Render | Job stuck mid-pipeline (e.g., rendered but upload failed) | Resumes from specified step (`normalize`, `upload`). Skips completed steps. |
| `render.cancelAll(automationId, reason)` | Render | Batch gone wrong, need to abort all 4 format jobs | Transitions all jobs in automation to `cancelled`. Cleans temp files. |
| `assembly.replay(sessionId, fromOffset, toOffset, reason)` | Assembly | Energy analysis or angle selection produced bad results | Re-runs pipeline from sync offsets for the specified time range. Creates new draft EDL. |
| `formation.repair(enrollmentId, strategy, reason)` | Formation | Ghost state, corrupted score, missing events | Strategies: `replay` (rebuild from events), `reset-score` (recalculate from raw data), `unblock` (force-unlock a gated node). All logged. |
| `formation.migrate(enrollmentId, toGraphVersion, reason)` | Formation | User needs to move to newer graph version | Maps completed nodes to new graph. Flags unmappable nodes for manual resolution. |

**Rules:**
- Every command requires a `reason` string — no anonymous recovery actions
- Every command is logged to the audit trail with operator ID + timestamp
- `formation.repair` with strategy `unblock` requires a second operator confirmation (prevents accidental ungating)
- Commands are available via BullBoard UI (buttons) and CLI (`pnpm ops:render:retry <jobId> "reason"`)

---

### DLQ Triage Playbook

When jobs land in a dead-letter queue, use this rubric. Do not "requeue everything."

#### `render-jobs-dlq`

| # | Failure Cause | Check First | Safe to Requeue? | Escalate When |
|---|--------------|------------|-----------------|---------------|
| 1 | Lambda timeout | CloudWatch logs for the function invocation. Check input duration vs Lambda timeout setting. | Yes — if timeout was transient. Increase timeout if recurring. | 3+ timeouts on same session → likely a media format issue. |
| 2 | R2 upload failure | R2 status page + credentials validity. Check `r2-upload.ts` error log for HTTP status. | Yes — if R2 was temporarily down. | 401/403 → credential rotation needed. 5xx persisting >10min → escalate to Cloudflare. |
| 3 | FFmpeg crash (exit code 1) | `render-worker.ts` stderr log. Usually a codec issue or corrupt input frame. | No — requeue will hit the same error. Fix input or skip frame. | Crash on multiple sessions → possible FFmpeg version regression. |

#### `assembly-jobs-dlq`

| # | Failure Cause | Check First | Safe to Requeue? | Escalate When |
|---|--------------|------------|-----------------|---------------|
| 1 | FFmpeg `astats` failure | Input WAV file existence + codec. Check if file was deleted mid-analysis. | Yes — if file exists and is valid. | File genuinely corrupt → mark session for re-upload. |
| 2 | Sync offset out of range | `sync-engine.ts` offset log. Check if cameras were started at vastly different times. | No — requeue won't help. Operator must verify camera sync. | Offset >60s → likely wrong camera pairing. |
| 3 | Memory exhaustion | Worker memory usage log. Check input file sizes. | Yes — if memory was freed. Consider splitting into chunks. | Recurring on files >2GB → need streaming analysis. |

#### `formation-state-dlq`

| # | Failure Cause | Check First | Safe to Requeue? | Escalate When |
|---|--------------|------------|-----------------|---------------|
| 1 | Duplicate event rejected | Event store uniqueness constraint error. Check if this is a replay artifact. | No — the event already exists. Discard safely. | Frequent duplicates → possible event bus retry storm. |
| 2 | Graph node not found | `formation-dependency` table. Check if graph was mutated (should be versioned). | No — run `formation.repair(enrollmentId, 'replay', reason)` instead. | Ghost state → graph versioning may have been bypassed. |
| 3 | Score computation error | `computeFormationScore` input events log. Check for null/undefined event fields. | Yes — if the bad event was corrected. | Recurring → Zod schema may not cover an edge case. |

---

### Explainability Contract

Every decision function in Phase 6 returns a standardized `DecisionResult` payload. No bespoke explainers.

```typescript
interface DecisionResult<T extends string> {
  decision: T;                    // Enum value (e.g., 'camera_b', 'gated', 'node_x')
  reasons: string[];              // Human-readable, specific ("8.2dB lead over Camera A at t=14:32")
  inputsHash: string;             // SHA-256 of the inputs evaluated (proves determinism)
  rulesVersion: string;           // Version of the rules/graph used (e.g., "angle-v1", "graph-v3")
  confidence?: number;            // Optional. If present: 0–1, bounded, with threshold documented.
  timestamp: string;              // ISO 8601
  correlationId: string;          // Links to the request that triggered this decision
}
```

**Where it applies:**
- `selectAngle()` → returns `DecisionResult<CameraId>`
- `computeFormationScore()` → returns `DecisionResult<'pass' | 'fail'>` with factor breakdown in `reasons`
- `canAccessNode()` → returns `DecisionResult<'granted' | 'gated'>` with score delta in `reasons`
- `rankNextSteps()` → returns `DecisionResult<ContentNodeId>[]` with ranking factors in `reasons`

**Audit:** All `DecisionResult` payloads are persisted to the `decision_audit` table (correlationId + automationId indexed). Queryable for post-hoc review.

---

### Queue Isolation Boundaries

Pillars communicate via **events only**. No pillar imports another pillar's service directly.

| Queue | Pillar | DLQ | Retry Policy | Cross-Pillar Interaction |
|-------|--------|-----|-------------|-------------------------|
| `assembly-jobs` | Assembly (P1) | `assembly-jobs-dlq` | 3 attempts, exponential backoff (1s, 4s, 16s) | Emits `edl.draft.created` event. Render subscribes. |
| `render-jobs` | Render (P2) | `render-jobs-dlq` | 3 attempts, exponential backoff (5s, 30s, 120s) | Emits `render.completed` event. Formation subscribes for CDN URLs. |
| `media-transcoding` | Render (P2) | `media-transcoding-dlq` | 2 attempts, linear (10s, 30s) | Internal to Render pillar only. |
| `formation-state` | Formation (P3) | `formation-state-dlq` | 5 attempts, exponential (1s, 2s, 4s, 8s, 16s) | Emits `formation.unlocked` / `formation.gated`. Dashboard subscribes. |

**Enforcement:** If a service in `src/features/render/` imports from `src/features/formation/`, CI flags it as a cross-pillar coupling violation. Pillars interact through the event bus or shared types only.

---

### Canonical ID Registry

Four IDs trace every operation across the platform. These are sacred — never rename, never derive differently.

| ID | Format | Scope | Lifetime | Generated By |
|----|--------|-------|----------|-------------|
| `correlationId` | UUIDv4 | Single HTTP request chain | Ephemeral — dies with the request | API middleware (first entry point) |
| `automationId` | UUIDv4 | Logical workflow instance (e.g., "assemble session X") | Medium — lives until workflow completes or fails | Orchestration function that initiates the workflow |
| `renderJobId` | BullMQ job ID (UUIDv4) | Single render execution | Medium — lives until job completes, retries, or dead-letters | BullMQ on `queue.add()` |
| `formationEnrollmentId` | UUIDv4 | User's journey through a specific graph version | Long-lived — persists for the user's entire path | `enrollInFormationPath()` on first content access |

**Rules:**
- `correlationId` appears in **every** log line, **every** response header (`X-Correlation-ID`), **every** BullMQ job metadata
- `automationId` groups related jobs (e.g., the 4 render jobs from "Render All" share one `automationId`)
- `renderJobId` is **never** reused across retries — each retry gets a new job ID, linked to the same `automationId`
- `formationEnrollmentId` is **stable** — it survives graph version migrations. The enrollment persists; the graph version it references may change via explicit migration.

---

## Architecture Constraints

| Constraint | Rationale |
|-----------|-----------|
| No new databases | Postgres 15 + pgvector + Redis 7 cover all needs |
| No new queue systems | BullMQ is already proven in the render pipeline |
| Pure functions where possible | Energy analysis, angle selection, scoring — all testable without side effects |
| No file >250 lines | Per CLAUDE.md. Split modules at natural boundaries |
| Phase 6 is deterministic | No ML models, no predictive systems. Rules-based only. Intelligence grows in Phase 7+. |
| No cross-pillar imports | Pillars interact via events + shared types only. Direct service imports are CI violations. |

---

## Scope Boundary

Phase 6 delivers **deterministic, auditable, traceable automation**. The following are explicitly out of scope:

| Out of Scope | Why | When |
|-------------|-----|------|
| AI-driven recommendations | Requires training data we don't have yet | Phase 7+ |
| Behavioral scoring | Needs >1000 user interactions for validation | Phase 8+ |
| Predictive content adaptation | Requires A/B testing infrastructure | Phase 9+ |
| Real-time personalization | Needs streaming ML pipeline | Phase 9+ |
| Auto-publishing to social | Requires human review loop first | Phase 7 |

**Guard rail:** If a feature requires a model, a prediction, or adaptive behavior, it is not Phase 6.

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Remotion Lambda cold starts (15–30s) | Medium | High | Pre-warm via CloudWatch scheduled rule. Batch renders to amortize. |
| Audio energy false positives (wrong camera selected) | High | Medium | 6dB delta threshold prevents marginal switches. `switchCooldown` prevents rapid cuts. Low-confidence cuts flagged for operator review. |
| Formation scoring gaming | Medium | Low | 7-day minimum per phase. Reflection quality assessed by AI (not just word count). Substantive checkpoints require demonstrated understanding. |
| R2 upload failure mid-render | Medium | Low | Exponential backoff with 3 retries on R2 uploads. Local temp files cleaned regardless of upload success. |
| Circular dependency graph | High | Low | DAG validation runs on every save via Strapi lifecycle hook. Topological sort rejects cycles before persistence. |
| Scope bleed into ML/prediction territory | High | High | Phase 6 Non-Negotiables document. Every feature must pass: "Is this deterministic?" If no, defer to Phase 7+. |

---

## Data Flow Summary

```
                    ┌──────────────────────────────────────┐
                    │         Operator: "Assemble"         │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Sync Engine (existing offsets)       │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Audio Energy Analyzer (new)          │
                    │  → per-camera energy matrix           │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Angle Selection Heuristic (new)      │
                    │  → cut list with confidence scores    │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Auto-EDL Generator (new)             │
                    │  → CanonicalEDL saved as draft        │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Operator Review (approve/edit cuts)  │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Render All (4 format presets)        │
                    │  → BullMQ → Lambda Remotion → R2     │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  CDN URLs → Formation Graph           │
                    │  → Personalized Next Step             │
                    └──────────────────────────────────────┘
```
