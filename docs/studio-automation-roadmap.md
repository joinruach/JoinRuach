# Studio Automation Roadmap (3-Stage)

> **Status:** Draft
> **Author:** Forge Dev Intelligence
> **Date:** 2026-02-26

---

## Stage 1: Render Foundation (Weeks 1–3)

**Goal:** One-click render from locked EDL. All 4 formats. Artifacts in R2 with CDN URLs.

### Deliverables

1. **Lambda RemotionRunner** — Replace `remotion-runner.ts` CLI execution with `@remotion/lambda`. Same interface, cloud execution. Removes the 30-minute local render bottleneck.

2. **Format Presets** — Four standard output configurations:
   | Preset | Resolution | Notes |
   |--------|-----------|-------|
   | `full_16_9` | 1920×1080 | -14 LUFS normalized audio |
   | `short_9_16` | 1080×1920 | 60s max, auto-generated subtitles |
   | `clip_1_1` | 1080×1080 | Center-crop from 16:9 source |
   | `thumbnail` | 1920×1080 | JPEG, key frame extraction |

3. **R2 + CDN Verification** — Production credentials confirmed, `Content-Type` headers set correctly per format, `Cache-Control` headers configured for immutable assets.

4. **Render All Endpoint** — `POST /render-jobs/render-all/:sessionId` → enqueues 4 parallel BullMQ jobs (one per format preset). Returns job IDs for progress tracking.

5. **Progress Streaming** — SSE endpoint (`GET /render-jobs/:jobId/progress`) for real-time render progress. Frontend subscribes per-job and displays progress bars.

6. **BullBoard for Operators** — Production-accessible queue dashboard with basic auth. Allows operators to monitor, retry, and cancel render jobs.

### Gate to Stage 2

- [ ] 10 successful renders across 4 formats (minimum 2 per format)
- [ ] No dropped frames in any output
- [ ] CDN URLs return HTTP 200 with correct `Content-Type`
- [ ] Render time <5 minutes for a 30-minute session
- [ ] Failed renders auto-retry via BullMQ (verified with intentional failure)

---

## Stage 2: Intelligent Assembly (Weeks 4–7)

**Goal:** Auto-generate a reviewable EDL from raw multicam footage. Operator reviews and locks.

### Deliverables

1. **Audio Energy Analyzer** — `audio-energy-analyzer.ts`. Extracts per-500ms-window RMS energy from each camera's audio track via FFmpeg `astats` filter. Pure function: WAV path in, `Float32Array` out.

2. **Per-Camera Energy Matrix** — N cameras × T windows. Each cell contains normalized energy value. Aligned to the sync timeline (offsets from `sync-engine.ts`).

3. **Angle Selection Heuristic** — `angle-selector.ts`. Rules:
   - Speaker dominance: loudest camera wins
   - 6dB lead threshold: must lead by 6dB to trigger a switch
   - `minShotLength`: 2 seconds (no rapid cuts)
   - `switchCooldown`: 1.5 seconds after any cut
   - Silence → wide shot
   - Each cut annotated with confidence score (0–1)

4. **Auto-EDL Generator** — `auto-edl-generator.ts`. Orchestration function that chains: sync offsets → energy analysis → angle selection → `CanonicalEDL`. Saves result as a draft EDL in Strapi.

5. **Operator Review UI** — Timeline visualization with confidence-colored cut markers:
   - Green (≥0.8): high confidence, likely correct
   - Yellow (≥0.5): moderate confidence, worth reviewing
   - Red (<0.5): low confidence, likely needs correction
   - Bulk approve button for green cuts. Individual edit for yellow/red.

### Gate to Stage 3

- [ ] 5 auto-assembled sessions reviewed by operator
- [ ] >80% of cuts accepted without correction
- [ ] No sync drift >50ms across any session
- [ ] Assembly completes in <2 minutes for 3-camera, 45-minute session
- [ ] Generated EDLs export as valid FCP XML (parseable by Final Cut Pro)

---

## Stage 3: Formation Intelligence (Weeks 8–10)

**Goal:** Personalized content journeys. Next step recommendations based on demonstrated formation.

### Pre-Requisite: Formation Versioning Strategy (Define During Stage 1–2)

> This must be designed before Week 8 implementation begins.

Formation paths are logic-driven. When scoring rules or dependency graphs change, existing users must not be stranded.

**Versioning Model:**
- Each `formation-dependency` graph has a `version` field (integer, monotonically increasing)
- When a user starts a path, their `FormationState` records `graphVersion` at enrollment time
- **Rule:** Users continue on their enrolled graph version until they complete the path or explicitly opt into a newer version
- Graph changes create a **new version**, never mutate the active version
- Migration: `migrateFormationPath(userId, fromVersion, toVersion)` maps completed nodes to equivalent nodes in the new graph. Unmappable nodes require operator review.

**Schema Migration Rules:**
- **Additive only:** v1 nodes remain valid in v2. New nodes may be added. Existing nodes may not be removed or re-keyed.
- **Deprecation, not deletion:** To "remove" a node, mark it `deprecated: true`. It remains valid for enrolled users but hidden from new enrollments.
- **Ghost state prevention:** Runtime validator runs on every `canAccessNode()` call. If a user's pinned graph references a node that no longer exists (data corruption or migration bug), the system emits `formation.ghost-state` error with `{ userId, enrollmentId, missingNodeId, graphVersion }` and **blocks access with a recoverable operator action** — not a silent dead-end.

**What this prevents:**
- User mid-path suddenly has new prerequisites they never saw
- Completed content disappearing from their history
- Score recalculation changing their gating status retroactively
- Ghost states where a user is stranded on a removed node with no path forward

### Deliverables

1. **Content Dependency Graph** — Strapi content type `formation-dependency`. Each node references a content piece and its prerequisite nodes. DAG validated on save via lifecycle hook (topological sort rejects cycles). Versioned — mutations create new graph version, never overwrite active.

2. **Watch-Path Sequencing** — `formation-sequencer.ts`. Algorithm:
   1. Topological sort of dependency graph
   2. Filter by user's completed prerequisites
   3. Rank remaining by recency + content diversity
   4. Return ordered list of next-watchable content

3. **Formation Scoring** — `computeFormationScore()`. Weighted 5-factor formula:
   | Factor | Weight | Measurement |
   |--------|--------|-------------|
   | Sections completed | 20% | Completion count / total sections |
   | Reflection quality | 25% | AI-assessed depth (not just word count) |
   | Checkpoint passages | 35% | Pass/fail on substantive understanding checks |
   | Time-in-phase | 10% | Days active in current phase (7-day minimum) |
   | Engagement streak | 10% | Consecutive days with meaningful activity |

4. **Auto-Gating** — Extends `canAccessNode()` with `minimumScore` thresholds per dependency node. When a user's score crosses the threshold, emits `formation.unlocked` event. When access is denied, emits `formation.gated` event with the delta needed.

5. **Next Step Widget** — `GET /formation-engine/next-step` → returns top 3 recommended nodes for the authenticated user. Powers the dashboard "Continue Your Journey" widget with title, description, and progress indicator.

### Gate to Launch

- [ ] 20 test users complete a formation pathway end-to-end
- [ ] NPS >7 on content relevance survey
- [ ] No dead-end states (every user has a valid next step)
- [ ] Scoring verified non-gameable (7-day minimum, AI-assessed reflections)
- [ ] Auto-gating correctly blocks in 5 pre-defined test scenarios

---

## Dependency Diagram

```
STAGE 1: Render Foundation (Weeks 1-3)
  [Lambda RemotionRunner]
  [Format Presets]
  [R2 + CDN] ─────────────────────────────┐
  [Render All Endpoint]                    │
  [Progress Streaming]                     │
         │                                 │
    GATE: 10 renders, CDN OK               │
         │                                 │
STAGE 2: Intelligent Assembly (Weeks 4-7)  │
  [Audio Energy Analyzer] ◄────────────────┘ (needs R2 for WAV storage)
  [Energy Matrix]
  [Angle Selector]
  [Auto-EDL Generator]
  [Operator Review UI]
         │
    GATE: 5 sessions, >80% accepted
         │
STAGE 3: Formation Intelligence (Weeks 8-10)
  [Dependency Graph] ← start during Stage 1 (no dependency)
  [Sequencing Engine]
  [Formation Scoring]
  [Auto-Gating]
  [Next Step Widget]
         │
    GATE: 20 users, NPS >7, no dead-ends
```

**Parallelization Note:** The Content Dependency Graph (Stage 3, Deliverable 1) has zero dependency on Stages 1–2. Content authors can define it in Strapi admin during Weeks 1–3, giving a head start on Stage 3.

---

## Timeline Summary

| Week | Stage | Key Milestone |
|------|-------|---------------|
| 1 | Stage 1 | Lambda RemotionRunner + Format Presets |
| 2 | Stage 1 | Render All endpoint + R2/CDN verification |
| 3 | Stage 1 | Progress streaming + BullBoard + **Gate 1** |
| 4 | Stage 2 | Audio Energy Analyzer + Energy Matrix |
| 5 | Stage 2 | Angle Selection Heuristic |
| 6 | Stage 2 | Auto-EDL Generator + Operator Review UI |
| 7 | Stage 2 | Integration testing + **Gate 2** |
| 8 | Stage 3 | Dependency Graph + Sequencing Engine |
| 9 | Stage 3 | Formation Scoring + Auto-Gating |
| 10 | Stage 3 | Next Step Widget + **Gate 3** |
