# Phase 11 Plan 1: EDL Data Model & Schema Summary

**Canonical EDL foundation established**

## Accomplishments

- Created edit-decision-list Strapi content type for EDL storage
- Defined Canonical EDL v1.0 TypeScript interfaces
- Linked EDL to recording-session via oneToOne relation
- Established workflow status (draft → reviewing → approved → locked)

## Files Created/Modified

- `ruach-ministries-backend/src/api/edit-decision-list/content-types/edit-decision-list/schema.json` - EDL content type
- `ruach-ministries-backend/src/types/canonical-edl.ts` - Type definitions
- `ruach-ministries-backend/src/api/recording-session/content-types/recording-session/schema.json` - Added edl relation

## Decisions Made

### D-11-001: Canonical EDL JSON as Single Source of Truth
**Decision:** Store all edit decisions in a canonical JSON format (canonicalEdl field).

**Rationale:**
- Enables deterministic replay (same inputs = same output)
- Future-proof for adding new NLE export formats
- Audit trail with generation parameters
- Easy to validate and version
- No NLE-specific concepts in storage layer

### D-11-002: Master Timeline with Camera Offsets
**Decision:** All timestamps in master timeline (ms), camera offsets stored in sources.

**Rationale:**
- Consistent with Phase 9 sync architecture
- Easy to calculate camera-specific times on demand
- Simplifies EDL validation (no overlaps/gaps in single timeline)
- Phase 12 Remotion can use master timeline + offsets

### D-11-003: Workflow Status Enum
**Decision:** Status progression: draft → reviewing → approved → locked

**Rationale:**
- draft: Generated, not yet reviewed
- reviewing: Operator is reviewing
- approved: Operator approves, minor edits allowed
- locked: Final, ready for Phase 12 rendering (immutable)

Prevents accidental changes after operator approval.

### D-11-004: Source Tracking (ai | operator | hybrid)
**Decision:** Track how EDL was generated in source field.

**Rationale:**
- ai: Fully automated (rules + AI)
- operator: Manually created
- hybrid: AI-generated, then operator-edited

Helps with debugging, analytics, and workflow optimization.

### D-11-005: Audit Field for Determinism
**Decision:** Store generation parameters in audit JSON field.

**Rationale:**
- Track prompt, model, temperature, tool versions
- Store transcript hash and assets hash
- Enables reproducibility and debugging
- Helps identify why EDL changed when inputs are "the same"

## Technical Details

### Canonical EDL Schema

```typescript
interface CanonicalEDL {
  schemaVersion: "1.0";
  sessionId: string;
  masterCamera: "A" | "B" | "C";
  durationMs: number;
  fps?: number;

  tracks: {
    program: Cut[];          // Required: camera switches
    overlays?: Overlay[];    // Optional: graphics
    chapters?: Chapter[];    // Optional: section markers
    shorts?: ShortRecipe[];  // Optional: clip suggestions
  };

  sources: Record<string, CameraSource>; // Camera URLs + offsets

  metrics?: EDLMetrics; // Edit statistics
}
```

### Key Interfaces

```typescript
// Cut - Single camera shot
interface Cut {
  id: string;
  startMs: number;
  endMs: number;
  camera: "A" | "B" | "C";
  reason?: "speaker" | "reaction" | "wide" | "emphasis" | "operator";
  confidence?: number;
}

// CameraSource - Media URLs + timing
interface CameraSource {
  assetId: string;
  proxyUrl?: string;
  mezzanineUrl?: string;
  offsetMs: number; // From Phase 9
}

// Chapter - Section marker
interface Chapter {
  startMs: number;
  title: string;
}
```

### Storage Structure

```json
{
  "edlId": "edl-session-123",
  "session": "session-123",
  "version": 1,
  "status": "draft",
  "source": "ai",
  "timebase": "ms",
  "canonicalEdl": {
    "schemaVersion": "1.0",
    "sessionId": "session-123",
    "masterCamera": "A",
    "durationMs": 3600000,
    "tracks": {
      "program": [
        {
          "id": "cut-1",
          "startMs": 0,
          "endMs": 5000,
          "camera": "A",
          "reason": "speaker",
          "confidence": 0.95
        }
      ],
      "chapters": [
        {
          "startMs": 0,
          "title": "Opening Prayer"
        }
      ]
    },
    "sources": {
      "A": {
        "assetId": "asset-A",
        "offsetMs": 0,
        "mezzanineUrl": "..."
      },
      "B": {
        "assetId": "asset-B",
        "offsetMs": 1830,
        "mezzanineUrl": "..."
      },
      "C": {
        "assetId": "asset-C",
        "offsetMs": -420,
        "mezzanineUrl": "..."
      }
    },
    "metrics": {
      "cutCount": 45,
      "avgShotLenMs": 8000,
      "confidence": 0.92
    }
  },
  "audit": {
    "model": "claude-opus-4",
    "temperature": 0.7,
    "transcriptHash": "abc123...",
    "assetsHash": "def456...",
    "generatedAt": "2025-02-04T..."
  }
}
```

## Verification

✅ All tasks completed
✅ edit-decision-list content type exists
✅ canonical-edl.ts exports all interfaces
✅ recording-session has edl relation
✅ TypeScript interfaces match JSON spec
✅ Git commits created for each task

## Issues Encountered

None - implementation proceeded smoothly following the plan.

## Next Step

Ready for 11-02-PLAN.md: EDL Generator Engine (rules-based camera switching + AI chapter generation)

The next plan will:
1. Create EDL generator service with rules-based camera switching
2. Implement timing constraints (min/max shot length, cooldown)
3. Generate chapters using AI (from transcript segments)
4. Calculate EDL metrics
5. Store generated EDL in Strapi

## Integration Points

Phase 11 Plan 1 provides the foundation for:
- **Phase 11 Plan 2**: EDL Generator Engine (rules + AI)
- **Phase 11 Plan 3**: REST API endpoints (compute, get, approve, lock)
- **Phase 12**: Remotion rendering (consume canonical EDL JSON)
- **Phase 13**: Studio UI (display cuts, allow operator edits, lock workflow)

---

**Phase 11 Plan 1 Status:** ✅ COMPLETE

Ready to proceed with Plan 2 (EDL Generator Engine).
