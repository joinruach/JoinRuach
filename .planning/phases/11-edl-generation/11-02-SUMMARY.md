# Phase 11 Plan 2: EDL Generator Engine Summary

**Rules-based camera switching and AI chapter generation**

## Accomplishments

- Created EDL validator for structural and timing validation
- Implemented rules-based camera switcher with timing constraints
- Added AI-powered chapter title generation using Anthropic SDK
- Built EDL generator orchestrating full pipeline
- Integrated with Phase 9 sync and Phase 10 transcript data

## Files Created/Modified

- `ruach-ministries-backend/src/services/edl-validator.ts` - EDL structural validation
- `ruach-ministries-backend/src/services/camera-switcher.ts` - Rules-based camera selection
- `ruach-ministries-backend/src/services/chapter-generator.ts` - AI chapter title generation
- `ruach-ministries-backend/src/services/edl-generator.ts` - Main generator orchestration

## Decisions Made

### D-11-006: Rules-First Camera Switching
**Decision:** Use deterministic rules for camera selection instead of AI.

**Rationale:**
- Predictable and debuggable
- No API costs for camera switching
- Fast generation (milliseconds vs seconds)
- Easy to tune constraints (min/max shot length, cooldown)
- AI can be added later for "creative" mode

**Algorithm:**
- Speaker A → Camera A
- Speaker B → Camera B
- Unknown/Multiple speakers → Camera C (wide)
- Timing constraints: 2s min, 15s max, 1.5s cooldown

### D-11-007: AI Only for Chapter Titles
**Decision:** Use AI (Claude Haiku) only for generating chapter titles.

**Rationale:**
- Chapters benefit from semantic understanding
- Cheap model (Haiku) for cost efficiency
- Fast generation (~1-2s per chapter)
- Graceful fallback to "Section N" if AI fails
- User can review and edit titles before locking

**Model:** claude-3-haiku-20240307 (fast, $0.25/MTok input)

### D-11-008: Timing Constraints as Default Values
**Decision:** Hardcode reasonable defaults, allow override via options.

**Defaults:**
- minShotLengthMs: 2000 (avoid jarring cuts)
- maxShotLengthMs: 15000 (maintain energy)
- switchCooldownMs: 1500 (prevent rapid switching)

**Rationale:**
- Works for 90% of use cases
- Operators can override for specific styles
- Validates constraints during EDL validation

### D-11-009: Confidence Scoring Based on Transcript
**Decision:** Calculate cut confidence from transcript word confidence + duration.

**Formula:**
```typescript
confidence = avgWordConfidence + min(duration / 5000, 0.2)
```

**Rationale:**
- Higher confidence for longer, clearer segments
- Flags uncertain cuts for operator review
- Helps prioritize which cuts to review first

### D-11-010: Validation Before Storage
**Decision:** Validate EDL structure and timing before returning.

**Rationale:**
- Catch errors early (no gaps, no overlaps, valid cameras)
- Prevent invalid EDLs from reaching Strapi
- Provide actionable error messages
- Warnings for suggestions (long shots, high frequency)

## Technical Details

### EDL Validator

Validates 10+ rules:
1. Schema version check (1.0)
2. Program track required
3. Valid cameras (A/B/C)
4. Non-overlapping cuts
5. Sequential timing
6. Cuts within duration
7. Shot length constraints
8. Unique cut IDs
9. Sources for all cameras
10. Chapter timing and titles

Returns:
```typescript
{
  valid: boolean,
  errors: string[],  // Fatal issues
  warnings: string[] // Suggestions
}
```

### Camera Switcher

Rules engine:
1. Select preferred camera based on speaker
2. Check timing constraints (min/max/cooldown)
3. Decide whether to switch
4. Generate cut with UUID, timing, reason, confidence
5. Repeat for all transcript segments

Deterministic (same inputs = same cuts every time).

### Chapter Generator

AI pipeline:
1. Group transcript into 5-10 min sections
2. For each section, call Claude Haiku with prompt
3. Extract chapter title (3-5 words)
4. Graceful fallback to "Section N" on failure

Example chapters:
- "Opening Prayer and Welcome"
- "The Power of Faith"
- "Responding to God's Call"
- "Closing Benediction"

### EDL Generator

Orchestration:
1. Load session data (assets, transcript, sync offsets)
2. Validate prerequisites
3. Generate program cuts
4. Generate chapters (optional)
5. Build camera sources with offsets
6. Calculate metrics
7. Construct CanonicalEDL
8. Validate structure
9. Log warnings, throw on errors
10. Return valid EDL

## Example Output

```typescript
{
  schemaVersion: "1.0",
  sessionId: "session-123",
  masterCamera: "A",
  durationMs: 3600000,
  tracks: {
    program: [
      {
        id: "uuid-1",
        startMs: 0,
        endMs: 5000,
        camera: "A",
        reason: "speaker",
        confidence: 0.95
      },
      {
        id: "uuid-2",
        startMs: 5000,
        endMs: 12000,
        camera: "B",
        reason: "speaker",
        confidence: 0.92
      }
      // ... more cuts
    ],
    chapters: [
      { startMs: 0, title: "Opening Prayer and Welcome" },
      { startMs: 420000, title: "Main Teaching on Faith" },
      { startMs: 2100000, title: "Closing Remarks" }
    ]
  },
  sources: {
    "A": { assetId: "asset-A", offsetMs: 0, mezzanineUrl: "..." },
    "B": { assetId: "asset-B", offsetMs: 1830, mezzanineUrl: "..." },
    "C": { assetId: "asset-C", offsetMs: -420, mezzanineUrl: "..." }
  },
  metrics: {
    cutCount: 45,
    avgShotLenMs: 8000,
    speakerSwitchCount: 38,
    confidence: 0.91
  }
}
```

## Verification

✅ All tasks completed
✅ edl-validator.ts validates structure and timing
✅ camera-switcher.ts generates deterministic cuts
✅ chapter-generator.ts creates AI titles with fallback
✅ edl-generator.ts orchestrates full pipeline
✅ TypeScript compiles without errors
✅ Git commits created for each task

## Issues Encountered

None - implementation proceeded smoothly following the plan.

## Next Step

Ready for 11-03-PLAN.md: REST API endpoints and Strapi service wrapper

The next plan will:
1. Create Strapi EDL service wrapper
2. Implement REST API endpoints (compute, get, approve, lock)
3. Store generated EDLs in edit-decision-list content type
4. Follow Phase 9/10 API pattern for consistency

## Integration Points

Phase 11 Plan 2 provides the core EDL generation engine for:
- **Phase 11 Plan 3**: REST API + Strapi integration (expose via endpoints)
- **Phase 12**: Remotion rendering (consume CanonicalEDL for video generation)
- **Phase 13**: Studio UI (display cuts, edit timing, review chapters, lock workflow)

---

**Phase 11 Plan 2 Status:** ✅ COMPLETE

Ready to proceed with Plan 3 (REST API + Strapi service).
