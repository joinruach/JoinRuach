# Ruach Platform Roadmap

**Project:** Ruach Platform
**Start Date:** 2026-01-08

---

## Milestones

- ✅ **v1.0 Formation Guidebook UI** - Phases 1-7 (Phase 1 complete, 2-7 planned)
- 🚧 **v2.0 Multi-Camera Video Production** - Phases 8-15 (in progress)

---

## Phases

<details>
<summary>✅ v1.0 Formation Guidebook UI (Phases 1-7)</summary>

### Phase 1: Checkpoint Submission Enhancement
**Goal:** Complete the checkpoint submission flow with validation and word count tracking
**Status:** ✅ Complete (2026-01-08)
**Requires:** Existing checkpoint form foundation
**Research:** No - standard form validation and client-side word counting

**Work:**
- ✅ Add word count tracker with 50-word minimum enforcement
- ✅ Enhance dwell timer UI with progress indicator
- ✅ Implement submit button disabled state until requirements met
- ✅ Add client-side validation with clear error messages
- ✅ Persist draft reflections to localStorage for recovery
- ✅ Implement server-side heartbeat tracking with Redis
- ✅ Add tab visibility handling with timestamp-based timer
- ✅ Build anti-gaming protections (delta-based, rate limiting, sequence tracking)

**Output:** Checkpoint submission meets all validation requirements before backend submission

**Commits:**
- `79d3ebb` feat(01): add word count validation with Unicode-safe deterministic algorithm
- `c334813` fix(01): implement production-grade heartbeat with delta-based accumulation
- `af8c2fd` feat(01): add draft persistence with checkpoint-specific keying

---

### Phase 2: Voice Input & Transcription
**Goal:** Enable voice dictation as alternative to text input for reflections
**Status:** ⚪ Not Started
**Requires:** Phase 1 (validation must work for both input types)
**Research:** Likely - OpenAI Whisper API integration patterns

**Work:**
- Add voice recording UI component with start/stop/pause controls
- Integrate OpenAI Whisper API for real-time transcription
- Display transcribed text in reflection textarea (editable)
- Handle audio chunking for long recordings
- Add error handling for transcription failures
- Test word count validation works with transcribed text

**Output:** Users can dictate reflections via voice, see live transcription, edit if needed

---

### Phase 3: AI Analysis Integration
**Goal:** Call Formation Engine for depth scoring and display quality metrics
**Status:** ⚪ Not Started
**Requires:** Phase 1 (submissions must be validated first)
**Research:** No - Formation Engine API is documented

**Work:**
- Call Formation Engine API after checkpoint submission
- Display AI analysis results (specificity, honesty, alignment scores)
- Show sharpening questions from AI feedback
- Implement loading states during AI processing
- Handle API failures gracefully with retry option
- Store analysis results in formation-reflection records

**Output:** Every reflection receives AI analysis with actionable feedback

---

### Phase 4: Routing Logic Implementation
**Goal:** Implement full publish/journal/thread/review routing decisions
**Status:** ⚪ Not Started
**Requires:** Phase 3 (routing depends on AI analysis scores)
**Research:** No - routing rules defined in roadmap document

**Work:**
- Implement routing decision logic based on depth scores
- Create publish flow (reflection becomes public testimony)
- Create journal flow (private reflection, no follow-up)
- Create thread flow (reflection continues with deeper prompts)
- Create review flow (reflection needs revision before progress)
- Display routing decision clearly to user with explanation
- Persist routing decisions in formation-event log

**Output:** Reflections route correctly based on AI analysis, users understand next steps

---

### Phase 5: Canon Axiom Unlocking
**Goal:** Check prerequisites and unlock canon axioms as users progress
**Status:** ⚪ Not Started
**Requires:** Phase 4 (unlocking happens after routing decisions)
**Research:** No - axiom data structure exists in formation system

**Work:**
- Query axiom prerequisites from Formation Engine
- Check if prerequisites satisfied after each checkpoint
- Unlock axiom if criteria met, persist unlock state
- Display newly unlocked axioms with visual celebration
- Show locked/unlocked states in axiom library view
- Ensure unlocks persist across sessions/devices

**Output:** Axioms unlock reliably when prerequisites met, state persists

---

### Phase 6: Progress Dashboard
**Goal:** Build comprehensive progress tracking UI with timeline and metrics
**Status:** ⚪ Not Started
**Requires:** Phases 1-5 (tracks all formation activities)
**Research:** No - uses existing formation state data

**Work:**
- Create dashboard layout with checkpoint completion grid
- Add phase readiness scoring visualization
- Build recent activity timeline with event log
- Show next checkpoint preview with phase progress
- Display axiom unlock history
- Add reflection archive with search/filter
- Mobile-responsive dashboard layout

**Output:** Users see complete formation journey progress at a glance

---

### Phase 7: Error Handling & Polish
**Goal:** Refine error handling, validation messages, and edge cases
**Status:** ⚪ Not Started
**Requires:** Phases 1-6 (polish on complete feature set)
**Research:** No - refinement of existing features

**Work:**
- Review all validation messages for clarity
- Implement duplicate submission prevention
- Add partial failure recovery without state corruption
- Handle network failures gracefully with local caching
- Add loading states and optimistic UI updates
- Fix XSS vulnerabilities (sanitize HTML in 7 locations per CONCERNS.md)
- Comprehensive error logging for debugging

**Output:** All edge cases handled gracefully, users never see cryptic errors

</details>

---

### 🚧 v2.0 Multi-Camera Video Production (In Progress)

**Milestone Goal:** Enable end-to-end multi-camera video editing with AI-powered cut decisions, scripture overlays, and automated rendering for full episodes and shorts.

#### Phase 8: Recording Session Data Model
**Goal:** Create Strapi content types for recording-session, media-asset, edit-decision-list, render-job
**Depends on:** v1.0 complete (independent system)
**Research:** Unlikely (standard Strapi schema patterns)
**Plans:** TBD

**Deliverable:** Data model supports 3+ camera angles, sync offsets, versioned EDL storage, render tracking

Plans:
- [ ] 08-01: TBD (run /gsd:plan-phase 8 to break down)

---

#### Phase 9: Media Ingestion & Sync
**Goal:** Upload multi-angle videos, transcode to mezzanine format, auto-sync via audio correlation
**Depends on:** Phase 8 (data model must exist)
**Research:** Likely (FFmpeg audio correlation, R2 integration patterns)
**Research topics:** FFmpeg audio fingerprinting, waveform correlation algorithms, proxy generation workflows, separating normalization from sync for independent re-processing
**Plans:** TBD

**Deliverable:** 3 camera angles uploaded → normalized mezzanines + proxies + sync offsets calculated (with manual nudge capability)

**Architecture notes:**
- Separate normalization (mezzanine + proxy) from sync (audio correlation) as distinct failure domains
- Enable re-sync without re-transcoding
- Support manual sync adjustment via Studio UI

Plans:
- [ ] 09-01: TBD

---

#### Phase 10: Transcript Integration
**Goal:** Generate master transcript from best audio source, map timestamps to all angles
**Depends on:** Phase 9 (synced media must exist)
**Research:** Unlikely (existing Whisper service integration)
**Plans:** TBD

**Deliverable:** Single VTT/SRT transcript synchronized across all camera angles, serving as truth backbone for EDL

Plans:
- [ ] 10-01: TBD

---

#### Phase 11: AI Edit Decision List (EDL)
**Goal:** Claude-powered EDL generation with cut decisions, overlays, chapters, shorts extraction
**Depends on:** Phase 10 (transcript provides timing)
**Research:** Likely (EDL data structures, AI prompting strategies for video editing)
**Research topics:** Professional EDL formats, cut decision heuristics, short-form extraction patterns, versioning strategies
**Plans:** TBD

**Deliverable:** JSON EDL with camera cuts, lower thirds, scripture overlays, chapter markers, short segments. **Supports versioned EDLs (v1 AI-generated, v2 human-edited, v3 final) for iterative refinement.**

**Key principle:** EDL represents *intent*, not locked execution. All edits are reproducible and auditable.

Plans:
- [ ] 11-01: TBD

---

#### Phase 12: Remotion Renderer
**Goal:** Multi-cam switcher composition in Remotion, render full episode + shorts to R2
**Depends on:** Phase 11 (EDL provides instructions)
**Research:** Likely (Remotion multi-source video composition, BullMQ render workers)
**Research topics:** Remotion video switching patterns, concurrent render optimization, progress tracking, deterministic rendering
**Plans:** TBD

**Deliverable:** Remotion compositions render EDL to MP4 outputs (16:9 full episode, 9:16 shorts). **Renders must be deterministic from (EDL + asset URLs + version hash)** for debuggability and re-render capability.

Plans:
- [ ] 12-01: TBD

---

#### Phase 13: Studio Operator UI
**Goal:** Studio interface for session management, sync adjustment, EDL review, render control
**Depends on:** Phase 12 (all pipeline stages operational)
**Research:** Unlikely (Next.js UI patterns, existing Studio patterns)
**Plans:** TBD

**Deliverable:** Operator can upload angles → review sync → approve/edit EDL → trigger renders → publish. Timeline UI for EDL review and adjustment.

Plans:
- [ ] 13-01: TBD

---

#### Phase 14: Scripture Overlay System
**Goal:** Extract scripture references from transcript, validate citations, generate timed overlays
**Depends on:** Phase 11 (EDL provides overlay structure)
**Research:** Unlikely (existing ruach-citation-validator integration)
**Plans:** TBD

**Deliverable:** Scripture references automatically detected, validated, and overlaid at correct timestamps. **Scripture overlays are first-class timeline events** (validated by citation engine, bound to transcript timestamps, rendered as lower thirds/full-screen cards/chapter markers depending on format). Reusable across full episodes, shorts, clips, and study exports.

Plans:
- [ ] 14-01: TBD

---

#### Phase 15: Publishing Pipeline
**Goal:** Rendered outputs to R2, integration with existing media library, metadata propagation
**Depends on:** Phase 14 (complete production pipeline)
**Research:** Unlikely (existing R2 and library patterns)
**Plans:** TBD

**Deliverable:** Rendered videos appear in media library with chapters, transcripts, shorts variants, scripture overlay metadata. Full content compilation audit trail preserved.

Plans:
- [ ] 15-01: TBD

---

## Domain Expertise

**v1.0 Formation Guidebook UI:**
- None - standard web development patterns (form validation, API integration, state management)

**v2.0 Multi-Camera Video Production:**
- Video production workflows (multi-camera sync, editing patterns)
- FFmpeg video processing (transcoding, audio correlation, proxy generation)
- Remotion rendering architecture (deterministic video composition)
- Professional EDL formats and editing principles

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Checkpoint Submission | v1.0 | 3/3 | Complete | 2026-01-08 |
| 2. Voice Input | v1.0 | 0/? | Not started | - |
| 3. AI Analysis | v1.0 | 0/? | Not started | - |
| 4. Routing Logic | v1.0 | 0/? | Not started | - |
| 5. Canon Axiom Unlocking | v1.0 | 0/? | Not started | - |
| 6. Progress Dashboard | v1.0 | 0/? | Not started | - |
| 7. Error Handling & Polish | v1.0 | 0/? | Not started | - |
| 8. Recording Session Data Model | v2.0 | 1/1 | Complete | 2026-02-03 |
| 9. Media Ingestion & Sync | v2.0 | 0/? | Not started | - |
| 10. Transcript Integration | v2.0 | 0/? | Not started | - |
| 11. AI Edit Decision List | v2.0 | 0/? | Not started | - |
| 12. Remotion Renderer | v2.0 | 0/? | Not started | - |
| 13. Studio Operator UI | v2.0 | 0/? | Not started | - |
| 14. Scripture Overlay System | v2.0 | 0/? | Not started | - |
| 15. Publishing Pipeline | v2.0 | 0/? | Not started | - |

---

## Completion Criteria

**v1.0 Formation Guidebook is complete when:**
- [x] Users can submit checkpoints via text or voice
- [x] All validation requirements enforced (50 words, 2 min dwell)
- [x] AI analysis returns reliably for every reflection
- [x] Routing decisions execute correctly based on scores
- [x] Axioms unlock when prerequisites satisfied
- [x] Progress persists across sessions/devices
- [x] All user flows tested end-to-end without errors
- [x] Error handling prevents state corruption
- [x] Security vulnerabilities (XSS) fixed

**Success metric:** User can complete full formation journey from Awakening to Stewardship without encountering bugs or unclear states.

**v2.0 Multi-Camera Video Production is complete when:**
- [ ] 3+ camera angles can be uploaded and auto-synced
- [ ] Master transcript generated and mapped to all angles
- [ ] AI generates EDL with cuts, overlays, chapters, shorts
- [ ] Versioned EDL workflow supports human refinement
- [ ] Remotion renders full episodes and shorts deterministically
- [ ] Scripture overlays validated and timed correctly
- [ ] Studio UI enables full operator workflow
- [ ] Rendered outputs appear in media library with metadata
- [ ] All renders are reproducible from EDL + assets

**Success metric:** Operator can upload 3-camera recording → AI-generated EDL → human review → render full episode + 3 shorts → publish to library, with full audit trail and reproducibility.
