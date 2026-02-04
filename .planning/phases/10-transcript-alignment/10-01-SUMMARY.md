# Phase 10 Plan 1: Transcription & Alignment Services Summary

**AssemblyAI integration complete with sync offset alignment**

## Accomplishments

- Installed AssemblyAI SDK and subtitle.js
- Created transcription-service.ts for master camera transcription with speaker diarization
- Created transcript-alignment-service.ts for applying Phase 9 sync offsets
- Implemented timestamp clamping to prevent negative values from offset application

## Files Created/Modified

- `ruach-ministries-backend/package.json` - Added assemblyai, subtitle dependencies
- `ruach-ministries-backend/src/services/transcription-service.ts` - AssemblyAI integration
- `ruach-ministries-backend/src/services/transcript-alignment-service.ts` - Offset alignment logic

## Decisions Made

- Using AssemblyAI (not Deepgram or Whisper) for best speaker diarization quality
- Transcribe master camera only, apply offsets to generate aligned transcripts for all cameras
- Clamp timestamps to Math.max(0, value) to handle negative offsets from Phase 9
- Low confidence threshold set to 0.7 for flagging segments that may need manual review

## Technical Details

### TranscriptionService

```typescript
// Key interfaces
interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

// Main method
async transcribeSession(sessionId: string, strapi: Core.Strapi): Promise<TranscriptionResult>
```

Features:
- Automatic speaker diarization with segment grouping
- Word-level timestamps (400ms accuracy)
- Confidence scoring for quality assessment
- Uses `anchorAngle` from session to identify master camera
- Loads audio from `r2_audio_wav_url` field

### TranscriptAlignmentService

```typescript
// Apply offsets to all cameras
static alignTranscripts(
  masterSegments: TranscriptSegment[],
  syncOffsets: Record<string, number>
): AlignedTranscripts

// Get aligned transcript for specific camera
static getCameraTranscript(
  masterSegments: TranscriptSegment[],
  camera: string,
  syncOffsets: Record<string, number>
): TranscriptSegment[]
```

Features:
- Applies millisecond offsets from Phase 9 sync engine
- Clamps timestamps to prevent negative values
- Preserves all metadata (speaker, confidence, text)
- Works for both segment-level and word-level timestamps

## Issues Encountered

None - implementation proceeded smoothly following the plan.

## Verification

✅ All tasks completed
✅ `pnpm add assemblyai subtitle` installed dependencies successfully
✅ transcription-service.ts exports TranscriptionService class
✅ transcript-alignment-service.ts exports TranscriptAlignmentService class
✅ All files follow Phase 9 sync-service.ts pattern for consistency
✅ TypeScript interfaces properly defined and exported
✅ Git commits created for each task

Note: Pre-existing TypeScript errors in Phase 9 sync-controller.ts were identified but are outside the scope of this plan. They relate to Zod validation error handling and schema type mismatches.

## Next Step

Ready for 10-02-PLAN.md: Strapi integration, SRT/VTT generation, and API endpoints

The next plan will:
1. Create subtitle-generator.ts using subtitle.js for SRT/VTT conversion
2. Create Strapi service wrapper (transcript-service.ts) to orchestrate the full workflow
3. Create REST API controller and routes for triggering transcription and downloading subtitles

## Integration Points

Phase 10 Plan 1 provides the foundation for:
- **Phase 10 Plan 2**: Strapi persistence and REST API endpoints
- **Phase 11**: EDL generation (use aligned timestamps for multi-camera editing)
- **Phase 12**: Remotion rendering (use transcripts for captions)
- **Phase 13**: Studio UI (display transcripts, allow corrections)

## API Usage

```typescript
// Example usage (to be wrapped by Plan 2)
import TranscriptionService from './services/transcription-service';
import TranscriptAlignmentService from './services/transcript-alignment-service';

// Transcribe master camera
const service = new TranscriptionService(process.env.ASSEMBLYAI_API_KEY);
const result = await service.transcribeSession(sessionId, strapi);

// Apply sync offsets
const aligned = TranscriptAlignmentService.alignTranscripts(
  result.segments,
  session.syncOffsets_ms
);

// Get transcript for specific camera
const cameraB = TranscriptAlignmentService.getCameraTranscript(
  result.segments,
  'B',
  session.syncOffsets_ms
);
```

---

**Phase 10 Plan 1 Status:** ✅ COMPLETE

Ready to proceed with Plan 2 (Strapi integration & API endpoints).
