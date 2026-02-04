# Phase 9: Media Ingestion & Sync - Context

**Gathered:** 2026-02-03
**Status:** Ready for research

<vision>
## How This Should Work

The ideal flow is **drag & drop 3 videos → automatic sync → ready to edit**, but reality needs a safety valve for when audio correlation isn't perfect.

**Primary flow (90% of sessions):**
- Upload 3 camera angles (Cam A/B/C)
- System auto-syncs via audio correlation
- Operator sees: "Sync Confidence: 92%"
- Calculated offsets displayed (Cam A: +0ms, Cam B: -134ms, Cam C: +87ms)
- One button: **"Looks Good"** → proceed to editing

**When confidence is low (<85%):**
- UI subtly escalates: "Sync confidence is lower than usual"
- CTA shifts to **"Review Sync"**
- Only then reveal: side-by-side waveforms + fine-grain nudge controls + audio preview scrub

**Philosophy:** Automation first. Human discernment only when required. Complexity is earned, not default.

</vision>

<essential>
## What Must Be Nailed

All three are foundational - the chain breaks at the weakest link:

1. **Sync correctness first** - Auto-sync correlation must produce reliable offsets. If sync is wrong, every multi-cam cut decision is wrong, EDL becomes untrustworthy, and Remotion outputs are broken.

2. **Preview usability** - Proxy quality tuned so operators can review footage without lag. If preview is laggy, operators stop using the tool correctly and "wing it" outside the system.

3. **Storage patterns designed to support both** - Original/proxy/mezzanine R2 patterns that are cost-effective and support sync + preview without runaway costs.

**Priority order:** Sync correctness first, then preview usability, with storage patterns designed to support both without runaway cost.

**The real truth:** Preview performance is a function of storage + proxy settings. Sync accuracy is a function of mezzanine consistency + audio extraction + correlation method. You can't optimize one without setting constraints for the others.

</essential>

<boundaries>
## What's Out of Scope

**Phase boundaries:**
- EDL generation - that's Phase 11
- Remotion rendering - that's Phase 12
- Studio UI for full editing - that's Phase 13

**Intentional exclusions (conservative correctness over automation breadth):**
- **No color grading or video effects** - Phase 9 is about truthful normalization, not aesthetics. Effects introduce subjectivity and belong downstream in rendering/finishing.
- **No multi-session batch processing** - Perfect one-session determinism first before scaling horizontally. Batch introduces queue orchestration, retries, partial failures.
- **No automatic angle detection** - Operator explicitly labels which file is Cam A/B/C. No AI guessing. Camera role misclassification is more damaging than slow labeling. Explicit metadata creates trust and debuggability.

**Phase 9 answers one question only:** "Are these assets correct, synced, and ready?"

**Not:** "Are they pretty?" "Are they smart?" "Are they scalable to infinity?"

That discipline is what lets Phases 11-13 move fast without rework.

</boundaries>

<specifics>
## Specific Ideas

**UX principles:**
- **Confidence-first review** with progressive disclosure
- Waveforms exist but are not shoved in operator's face
- Waveforms should be a debug tool, not the front door
- Complexity revealed only when confidence is low or operator requests details

**Technical philosophy:**
- Prioritize deterministic, well-documented industry best practices over clever or bespoke defaults
- Research-backed defaults that optimize for sync reliability, preview smoothness, and Remotion stability
- No strong preferences yet - let research phase validate VFR vs CFR tradeoffs, codec choices for waveform correlation, proxy settings for browser scrubbing

**Forensic metadata to persist:**
- `sync_confidence` (score)
- `sync_method` (audio-corr, fallback, manual)
- `approved_by` (user)
- `approved_at` (timestamp)

This becomes truth trail later when a render is off, a clip feels weird, or AI EDL decisions are questioned.

</specifics>

<notes>
## Additional Context

**Philosophy:** Phase 9 is intentionally conservative - correctness and determinism over automation breadth. Advanced intelligence and scale come later.

**Key insight:** Sync accuracy, storage efficiency, and preview performance aren't three separate "nice-to-haves" - they're a single interdependent chain. The weakest link breaks the entire pipeline.

**Research focus areas:**
- FFmpeg audio correlation sync (best-practice approach for waveform correlation)
- R2 integration + storage patterns (how we store originals vs mezzanine vs proxies, naming/versioning, retention rules)
- Proxy generation settings (Studio preview needs proxies tuned for smooth scrubbing - resolution/bitrate/keyframe interval)
- Mezzanine standard (consistent fps/codec/container across all angles so Remotion renders are stable and deterministic - avoids drift, VFR weirdness, audio desync)

**Why this is marked "Research: Likely":** It's not just implementation - it's selecting the standards and constraints the entire multi-cam pipeline will depend on.

</notes>

---

*Phase: 09-media-ingestion-sync*
*Context gathered: 2026-02-03*
