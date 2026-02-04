# Phase 9: Media Ingestion & Sync - Context

**Captured:** 2026-02-03

## Vision Summary

Enable "drag & drop 3 videos → automatic audio correlation sync → confidence score review → ready to edit"

### How it works
- Drag & drop 3 videos → automatic audio correlation sync → confidence score review → ready to edit
- 90% flow: See confidence score + offsets → "Looks Good" → proceed
- Low confidence: System escalates to waveform review with manual nudge controls

### What must be nailed
1. **Sync correctness** - Reliable audio correlation offsets (broken sync = broken EDL)
2. **Preview usability** - Smooth proxy scrubbing for operators
3. **Storage patterns** - Cost-effective R2 structure supporting both

These aren't separate - they're interdependent. Optimize as a system.

### Out of scope
- EDL generation (Phase 11)
- Remotion rendering (Phase 12)
- Full Studio UI (Phase 13)
- Color grading/effects
- Batch processing
- Automatic angle detection

### Philosophy
Conservative correctness over automation breadth. Determinism and debuggability first.

## Technical Priorities

### Must Have
- BBC audio-offset-finder for MFCC cross-correlation (0.01s accuracy)
- Confidence scoring with thresholds (>10 = reliable, <5 = manual review)
- R2 storage with deterministic paths
- Proxy generation optimized for web scrubbing (H.264 baseline, -g 2)
- Mezzanine generation for Remotion (ProRes Standard or DNxHR SQ)

### Should Have
- VFR detection and CFR conversion before sync
- Multipart upload for large files (>5GB)
- Idempotent ingestion pipeline
- Operator manual nudge capability

### Could Have (Later)
- Batch processing multiple sessions
- Automatic camera angle detection
- Real-time sync preview during upload

## Research References

See `09-RESEARCH.md` for:
- Standard stack (FFmpeg, audio-offset-finder, R2, fluent-ffmpeg)
- Architecture patterns (4 detailed patterns with code)
- Common pitfalls (6 catalogued with warning signs)
- What NOT to hand-roll (BBC audio-offset-finder vs custom correlation)
