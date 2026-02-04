# Phase 10 Plan 2: Strapi Integration & API Summary

**Complete transcription workflow with REST API**

## Accomplishments

- Created subtitle-generator.ts for SRT/VTT conversion using subtitle.js
- Created transcript-service.ts (Strapi wrapper) orchestrating full workflow
- Created transcript-controller.ts and transcript-routes.ts for REST API
- Integrated with library-transcription entity for persistence
- Implemented SRT/VTT download with proper Content-Type headers

## Files Created/Modified

- `ruach-ministries-backend/src/services/subtitle-generator.ts` - SRT/VTT generation
- `ruach-ministries-backend/src/api/recording-session/services/transcript-service.ts` - Strapi workflow orchestration
- `ruach-ministries-backend/src/api/recording-session/controllers/transcript-controller.ts` - REST API controller
- `ruach-ministries-backend/src/api/recording-session/routes/transcript-routes.ts` - Route definitions

## Decisions Made

- Store all camera transcripts in single JSON field (metadata.masterTranscript) for atomic updates
- Use speaker labels in both SRT ([Speaker A] prefix) and VTT (<v Speaker A> tags) formats for clarity
- Follow Phase 9 sync API pattern for consistency
- Store transcript metadata in library-transcription.metadata JSON field
- Link transcript to session via session.transcript relation

## Technical Details

### SubtitleGenerator

```typescript
// SRT generation with speaker prefix
static generateSRT(segments: TranscriptSegment[]): string
// Format: [Speaker A] This is the text

// VTT generation with voice tags
static generateVTT(segments: TranscriptSegment[]): string
// Format: <v Speaker A>This is the text</v>
```

Uses subtitle.js stringify() for automatic timestamp and cue formatting.

### Transcript Service (Strapi Wrapper)

```typescript
// Orchestrate full transcription workflow
async transcribeSession(sessionId: string)
  1. Load session with assets and sync offsets
  2. Call TranscriptionService.transcribeSession()
  3. Call TranscriptAlignmentService.alignTranscripts()
  4. Create/update library-transcription entity
  5. Store aligned transcripts in metadata.masterTranscript
  6. Link to session via transcript relation

// Get transcript data
async getTranscript(sessionId: string)
  - Returns aligned segments per camera
  - Includes speakerCount, confidence, cameras list

// Generate subtitle file
async getSubtitle(sessionId: string, camera: string, format: 'SRT' | 'VTT')
  - Loads aligned transcripts from metadata
  - Calls SubtitleGenerator for requested format
```

### Storage Structure

Library-transcription entity fields used:
```json
{
  "status": "completed",
  "confidence": 0.95,
  "transcriptText": "Full transcript as plain text",
  "metadata": {
    "masterTranscript": {
      "A": [...segments...],
      "B": [...segments...],
      "C": [...segments...]
    },
    "speakerCount": 3,
    "lowConfidenceSegments": 2,
    "masterCamera": "A",
    "cameras": ["A", "B", "C"],
    "transcribedAt": "2025-02-03T..."
  }
}
```

### REST API Endpoints

```bash
# Trigger transcription
POST /api/recording-sessions/:id/transcript/compute
Response: {
  success: true,
  data: {
    sessionId: "123",
    speakerCount: 3,
    confidence: 0.95,
    cameras: ["A", "B", "C"],
    lowConfidenceSegments: 2
  }
}

# Get transcript JSON
GET /api/recording-sessions/:id/transcript
Response: {
  success: true,
  data: {
    sessionId: "123",
    transcriptId: "transcript-123",
    status: "completed",
    speakerCount: 3,
    confidence: 0.95,
    cameras: ["A", "B", "C"],
    transcripts: {
      "A": [...segments...],
      "B": [...segments...],
      "C": [...segments...]
    },
    lowConfidenceSegments: 2,
    transcribedAt: "2025-02-03T..."
  }
}

# Download SRT subtitle file
GET /api/recording-sessions/:id/transcript/srt/:camera
Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="session-123-camera-A.srt"

# Download VTT subtitle file
GET /api/recording-sessions/:id/transcript/vtt/:camera
Content-Type: text/vtt; charset=utf-8
Content-Disposition: attachment; filename="session-123-camera-A.vtt"
```

## Issues Encountered

None - implementation proceeded smoothly following the plan.

## Verification

✅ All tasks completed
✅ subtitle-generator.ts exports generateSRT and generateVTT
✅ transcript-service.ts orchestrates full workflow (transcribe → align → store)
✅ transcript-controller.ts handles all 4 API routes
✅ transcript-routes.ts registers 4 routes correctly
✅ Follows Phase 9 sync API pattern for consistency
✅ Git commits created for each task

Note: Pre-existing TypeScript errors in Phase 9 code remain outside the scope of this plan.

## Integration Points

Phase 10 (both plans) provides complete transcription infrastructure for:
- **Phase 11**: EDL generation (use aligned timestamps for multi-camera editing)
- **Phase 12**: Remotion rendering (use transcripts for captions/subtitles in video)
- **Phase 13**: Studio UI (display transcripts, allow operator corrections, show confidence scores)

## Workflow Example

```bash
# 1. Upload 3-camera session (Phase 9)
POST /api/recording-sessions
POST /api/media-assets (x3)

# 2. Sync cameras (Phase 9)
POST /api/recording-sessions/123/sync/compute
POST /api/recording-sessions/123/sync/approve

# 3. Transcribe master + align all cameras (Phase 10)
POST /api/recording-sessions/123/transcript/compute

# 4. Get transcript data
GET /api/recording-sessions/123/transcript

# 5. Download subtitles for video players
GET /api/recording-sessions/123/transcript/srt/A
GET /api/recording-sessions/123/transcript/vtt/B
```

## Next Phase Readiness

**Phase 10 Complete!** Transcript alignment system ready for production use.

Ready for integration with:
- **Phase 11**: EDL generation (use aligned timestamps for multi-camera editing)
- **Phase 12**: Remotion rendering (use transcripts for captions)
- **Phase 13**: Studio UI (display transcripts, allow corrections)

**Ready for production testing with real 3-camera sessions.**

---

**Phase 10 Status:** ✅ COMPLETE

Both Plan 1 (transcription services) and Plan 2 (Strapi integration & API) successfully implemented.
