# Phase 9: Decisions

Track implementation decisions and their rationale.

## D-09-001: Audio sync method + tooling

**Status:** proposed
**Decision:** Use BBC audio-offset-finder (Python CLI) via Node.js subprocess for audio correlation
**Rationale:**
- Production-tested by BBC, handles compression/noise robustly
- MFCC cross-correlation achieves 0.01s accuracy
- Built-in confidence scoring (>10 = reliable, <5 = unreliable)
- Alternative (FFmpeg axcorrelate) provides correlation matrix but not time offsets

**Consequences:**
- Python dependency (audio-offset-finder requires Python 3.8-3.12)
- Subprocess execution pattern needed in Node.js
- Confidence scores are validated and documented

**Alternatives Considered:**
- FFmpeg axcorrelate filter → Requires custom peak detection
- Custom MFCC implementation → Reinventing 20+ years of BBC work
- Manual waveform alignment only → No automation, operator bottleneck

---

## D-09-002: Mezzanine format

**Status:** proposed
**Decision:** ProRes Standard (profile 2) at 30fps for mezzanine files
**Rationale:**
- Remotion supports ProRes natively
- Intraframe codec = easy seeking during rendering
- Standard profile sufficient for web workflows (HQ overkill)
- 100-220 Mbps bitrate balances quality vs storage cost

**Consequences:**
- Larger file sizes than H.264 (3-5x)
- Better Remotion rendering performance (no inter-frame decoding)
- macOS/cross-platform compatibility (DNxHR better for Windows-only)

**Alternatives Considered:**
- H.264 mezzanines → Potential Lambda timeout in Remotion rendering
- ProRes HQ (profile 3) → Unnecessary quality for web delivery
- DNxHR SQ → Better Windows support, but ProRes more universal

---

## D-09-003: Storage layout + naming

**Status:** proposed
**Decision:** R2 storage with ISO 8601 dates, shallow hierarchy (<4 levels)
**Key Pattern:**
```
projects/{projectId}/{YYYYMMDD}/{assetType}s/{filename}
```
Example:
```
projects/proj-abc123/20260203/originals/angle-001_v001.mp4
projects/proj-abc123/20260203/proxies/angle-001_v001.mp4
projects/proj-abc123/20260203/mezzanines/angle-001_v001.mov
projects/proj-abc123/20260203/audios/angle-001_v001.wav
```

**Rationale:**
- ISO 8601 date format avoids international confusion
- Shallow hierarchy (<500 assets/branch) improves listing performance
- Alphanumeric + underscore/dash only (no spaces = no URL encoding issues)
- Predictable paths enable deterministic URL construction

**Consequences:**
- All dates in UTC to avoid timezone confusion
- Version numbers padded to 3 digits (v001, v002) for sorting
- Asset type pluralized (originals, proxies) for clarity

**Lifecycle Policy:**
- **Originals:** Standard storage, long-term retention
- **Mezzanines:** Standard storage, medium-term (or project-scoped)
- **Proxies:** Standard storage, long-term (cheap + enables UI)
- **Audio WAVs:** Standard storage, medium-term (regenerate on demand)

---

## D-09-004: Proxy generation settings

**Status:** proposed
**Decision:** H.264 baseline profile, -g 2 keyframe interval, 720p resolution
**FFmpeg Command Pattern:**
```bash
ffmpeg -i input.mp4 \
  -vcodec libx264 \
  -pix_fmt yuv420p \
  -profile:v baseline \
  -level 3.0 \
  -g 2 \
  -preset fast \
  -crf 23 \
  -vf "scale=-2:720" \
  -movflags +faststart \
  -an \
  proxy-720p.mp4
```

**Rationale:**
- `-g 2` = keyframe every 2 frames, balances scrubbing smoothness vs file size
- Baseline profile = maximum browser/device compatibility
- 720p = sufficient for operator review, keeps file size manageable
- `-an` = no audio in proxy (reduces size, audio comes from sync result)

**Consequences:**
- 2x larger than default keyframe interval but smooth scrubbing
- No audio in proxy means separate audio playback sync mechanism needed
- Fast preset balances encoding speed vs compression

**Alternatives Considered:**
- `-g 1` (all I-frames) → Perfect scrubbing but 2x file size
- ProRes Proxy → Better scrubbing but 5-10x file size
- Default keyframe interval → Laggy scrubbing in web player

---

## D-09-005: VFR handling

**Status:** proposed
**Decision:** Detect VFR with ffprobe, convert to CFR before sync analysis
**Detection Command:**
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate,avg_frame_rate -of json input.mp4
```

**Conversion Command:**
```bash
ffmpeg -i vfr-input.mp4 -vsync cfr -r 30 -c:v libx264 -crf 18 -c:a copy cfr-output.mp4
```

**Rationale:**
- VFR sources cause audio drift over time (sync perfect at start, drifts later)
- Modern cameras/phones often record VFR
- CFR conversion ensures consistent frame timing for sync

**Consequences:**
- Extra transcode step before sync analysis
- Potential quality loss from re-encode (mitigated with -crf 18)
- Storage for both VFR original and CFR working copy

**Warning Signs:**
- Sync offsets accurate at video start but drift over duration
- FFmpeg warnings: "frame rate changes" during processing

---

## D-09-006: Confidence thresholds

**Status:** proposed
**Decision:** Three-tier confidence system based on audio-offset-finder standard score
**Thresholds:**
- **>= 10:** "Looks Good" - Auto-apply offsets, green indicator
- **5-10:** "Review Suggested" - Show offsets + warning, require operator confirmation
- **< 5:** "Needs Manual Nudge" - Show waveform review UI, require manual adjustment

**Rationale:**
- audio-offset-finder docs state >10 = likely correct, <5 = unlikely correct
- Three tiers provide clear operator guidance
- Middle tier (5-10) allows operator to accept if they have context

**Consequences:**
- 90% case (>10 confidence) = one-click approval
- Edge cases get appropriate escalation
- All confidence scores logged for analysis/improvement

---

## Template for Future Decisions

**Status:** [proposed | accepted | rejected | superseded]
**Decision:** [What was decided]
**Rationale:** [Why this was chosen]
**Consequences:** [What this means going forward]
**Alternatives Considered:** [What else was evaluated]
