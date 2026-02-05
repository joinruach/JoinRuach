# Phase 10 Backend Contracts: Transcription Pipeline

**Status:** Contract Definition (Implementation In Progress)
**Last Updated:** 2026-02-04
**Dependencies:** Phase 9 (Sync) must be complete

---

## Overview

Phase 10 bridges **time → meaning** by transcribing the master audio track and aligning all timestamps to the session timeline using sync offsets from Phase 9.

### Core Principle

**Transcription is a first-class artifact**, not a side effect. It drives:
- Subtitle generation
- EDL creation (Phase 11)
- Search/discovery
- Future AI features (summaries, shorts extraction)

### Data Flow (Authoritative)

```
┌─────────────────┐
│ Sync Complete   │
│ (Phase 9)       │
└────────┬────────┘
         │ syncOffsets_ms per asset
         │ masterAudioAssetId identified
         ↓
┌─────────────────┐
│ Transcription   │
│ Job Enqueued    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Provider        │
│ (AssemblyAI/    │
│  Mock)          │
└────────┬────────┘
         │ Raw transcript
         │ (segments + speakers + timestamps)
         ↓
┌─────────────────┐
│ Alignment       │
│ Service         │
└────────┬────────┘
         │ Apply sync offsets
         │ (raw timestamps → session timeline)
         ↓
┌─────────────────┐
│ Persist         │
│ Transcript      │
│ (ALIGNED)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Subtitle Export │
│ (SRT/VTT)       │
│ (on demand)     │
└─────────────────┘
```

---

## TypeScript Types

### Core Domain Models

```typescript
// Transcript Status
export type TranscriptStatus =
  | 'QUEUED'       // Job created, waiting for worker
  | 'PROCESSING'   // Provider is transcribing
  | 'RAW_READY'    // Provider completed, before alignment
  | 'ALIGNED'      // Sync offsets applied, ready for use
  | 'FAILED';      // Unrecoverable error

// Transcription Provider
export type TranscriptProvider =
  | 'assemblyai'
  | 'mock';

// Transcript Segment (utterance-level)
export interface TranscriptSegment {
  id: string;              // Stable UUID
  speaker?: string;        // "A", "B", "C" or "Speaker 1" (pre-alignment)
  startMs: number;         // Inclusive (session timeline after alignment)
  endMs: number;           // Exclusive (session timeline after alignment)
  text: string;
  confidence?: number;     // 0-1, provider-specific
}

// Transcript Word (for future word-level features)
export interface TranscriptWord {
  text: string;
  startMs: number;         // Session timeline after alignment
  endMs: number;           // Session timeline after alignment
  confidence?: number;     // 0-1
}

// Complete Transcript Document
export interface TranscriptDoc {
  id: string;
  sessionId: string;

  // Provider metadata
  provider: TranscriptProvider;
  providerJobId?: string;  // External provider's job ID

  // Status
  status: TranscriptStatus;

  // Language & features
  language?: string;       // ISO 639-1 code (e.g., "en", "es")
  hasDiarization: boolean; // Speaker identification enabled

  // Source tracking
  sourceAssetId: string;   // Which media-asset's audio was transcribed
  syncOffsets_ms: Record<string, number>; // Offsets used for alignment

  // Transcript content
  segments: TranscriptSegment[];
  words?: TranscriptWord[]; // Optional, for future use

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Error handling
  error?: {
    code: string;
    message: string;
    providerError?: unknown;
  };
}
```

---

## Service Contracts

### 1. TranscriptionProvider Interface

**Purpose:** Abstract provider (AssemblyAI, Whisper, etc.) behind a common interface.

```typescript
export interface TranscriptionProvider {
  /**
   * Start transcription job with provider
   * @returns Job ID for polling
   */
  startJob(args: {
    mediaUrl: string;       // Signed R2 URL or internal proxy
    diarization: boolean;   // Enable speaker identification
    language?: string;      // Target language (optional, auto-detect)
  }): Promise<{
    providerJobId: string
  }>;

  /**
   * Poll job status
   */
  getJobStatus(args: {
    providerJobId: string
  }): Promise<{
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    error?: { code: string; message: string };
  }>;

  /**
   * Fetch completed transcript
   */
  fetchResult(args: {
    providerJobId: string
  }): Promise<{
    language?: string;
    segments: TranscriptSegment[];
    words?: TranscriptWord[];
    hasDiarization: boolean;
  }>;
}
```

**Implementations:**
- `AssemblyAIProvider` - Real provider (requires API key)
- `MockProvider` - Synthetic fixtures for testing

---

### 2. TranscriptAlignmentService

**Purpose:** Apply sync offsets to transcript timestamps.

```typescript
export interface TranscriptAlignmentService {
  /**
   * Align transcript to session timeline
   *
   * @param transcript - Raw transcript from provider
   * @param offsetMs - Sync offset to apply (from Phase 9)
   * @returns Aligned transcript with corrected timestamps
   *
   * @example
   * // Master audio has +120ms offset from session timeline
   * alignTranscript({
   *   transcript: { segments: [{ startMs: 1000, endMs: 2000, ... }] },
   *   offsetMs: 120
   * })
   * // Returns: { segments: [{ startMs: 1120, endMs: 2120, ... }] }
   */
  alignTranscript(args: {
    transcript: Pick<TranscriptDoc, 'segments' | 'words'>;
    offsetMs: number;
  }): Pick<TranscriptDoc, 'segments' | 'words'>;
}
```

**Notes:**
- v1: Apply single offset (master audio → session timeline)
- Future: Support per-speaker alignment if using multiple audio sources

---

### 3. SubtitleGenerator

**Purpose:** Generate SRT/VTT from transcript segments.

```typescript
export type SubtitleFormat = 'srt' | 'vtt';

export interface SubtitleGenerator {
  /**
   * Generate subtitle file content
   *
   * @param segments - Transcript segments (already aligned)
   * @param format - Output format (SRT or VTT)
   * @returns File content as string
   */
  generate(args: {
    segments: TranscriptSegment[];
    format: SubtitleFormat;
  }): string;
}
```

**Formats:**
- **SRT** - Simple, widely supported (Premiere, Final Cut, VLC)
- **VTT** - WebVTT for HTML5 video players

---

## API Contracts

### 1. Start Transcription Job

```http
POST /api/recording-sessions/:sessionId/transcript/jobs
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "provider": "assemblyai",  // or "mock"
  "diarization": true,
  "language": "en"            // optional
}
```

**Response (201 Created):**
```json
{
  "transcriptId": "tr_abc123",
  "status": "QUEUED"
}
```

**Errors:**
- `400` - Invalid parameters
- `404` - Session not found
- `409` - Transcript already exists
- `422` - Session not synced yet (Phase 9 incomplete)

---

### 2. Get Transcript Status

```http
GET /api/recording-sessions/:sessionId/transcript
Authorization: Bearer <jwt>
```

**Response (200 OK):**
```json
{
  "transcript": {
    "id": "tr_abc123",
    "status": "ALIGNED",
    "provider": "assemblyai",
    "sourceAssetId": "asset_master",
    "language": "en",
    "hasDiarization": true,
    "segments": [
      {
        "id": "seg_1",
        "speaker": "A",
        "startMs": 1200,
        "endMs": 3400,
        "text": "Welcome to today's message.",
        "confidence": 0.95
      }
    ],
    "syncOffsets_ms": {
      "asset_master": -120
    },
    "createdAt": "2026-02-04T12:00:00Z",
    "updatedAt": "2026-02-04T12:02:00Z"
  }
}
```

**Errors:**
- `404` - Transcript not found (not started yet)

---

### 3. Export Subtitles

```http
GET /api/transcripts/:transcriptId/export?format=srt
Authorization: Bearer <jwt>
```

**Response (200 OK):**
```
Content-Type: text/plain; charset=utf-8

1
00:00:01,200 --> 00:00:03,400
Welcome to today's message.

2
00:00:03,500 --> 00:00:06,800
Today we'll be discussing...
```

**Query Parameters:**
- `format` - Required: `srt` or `vtt`

**Errors:**
- `404` - Transcript not found
- `422` - Transcript not aligned yet

---

## Queue Jobs

### Job: `transcript:create`

**Payload:**
```typescript
{
  sessionId: string;
  provider: TranscriptProvider;
  diarization: boolean;
  language?: string;
}
```

**Worker Steps:**
1. Load session + assets
2. Identify master audio asset (from `anchorAngle`)
3. Resolve audio URL (R2 signed URL or proxy)
4. `provider.startJob()` → providerJobId
5. Poll `provider.getJobStatus()` (exponential backoff)
6. `provider.fetchResult()` → raw transcript
7. `alignment.alignTranscript()` → aligned transcript
8. Persist to `library-transcription` with status `ALIGNED`
9. Update `recording-session.transcript` relation

**Error Handling:**
- Provider failures → status `FAILED`, store error details
- Retry logic: 3 attempts with exponential backoff
- Dead letter queue after exhaustion

---

## Database Schema Extension

### Extended `library-transcription` Schema

**New Fields (Phase 10):**
```json
{
  "provider": {
    "type": "enumeration",
    "enum": ["assemblyai", "mock", "whisper"],
    "description": "Transcription provider used"
  },
  "providerJobId": {
    "type": "string",
    "maxLength": 255,
    "description": "External provider's job ID for polling"
  },
  "hasDiarization": {
    "type": "boolean",
    "default": false,
    "description": "Whether speaker diarization was enabled"
  },
  "sourceAssetId": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::media-asset.media-asset",
    "description": "Which media-asset's audio was transcribed"
  },
  "syncOffsets_ms": {
    "type": "json",
    "default": {},
    "description": "Sync offsets applied during alignment {asset_id: offset_ms}"
  },
  "segments": {
    "type": "json",
    "default": [],
    "description": "Array of TranscriptSegment objects"
  },
  "words": {
    "type": "json",
    "default": [],
    "description": "Optional word-level timestamps for future features"
  }
}
```

**Backward Compatibility:**
- Existing fields (`transcriptText`, `transcriptVTT`, `transcriptSRT`) remain
- Legacy transcripts without `segments` continue working
- New transcripts populate both `segments` (structured) and `transcriptText` (flat)

---

## Testing Strategy

### Unit Tests
- `TranscriptAlignmentService.alignTranscript()` - Offset math correctness
- `SubtitleGenerator.generate()` - SRT/VTT format compliance
- `MockProvider` - Fixtures return expected shape

### Integration Tests
- Queue job end-to-end (mock provider)
- API routes with authenticated requests
- Alignment with real sync offsets from Phase 9

### E2E Tests
- Upload session → sync → transcribe → export SRT
- Verify subtitle timestamps match video

---

## Success Criteria

Phase 10 is complete when:
1. ✅ Mock provider works end-to-end (queue → alignment → persist)
2. ✅ SRT export matches aligned segment timestamps
3. ✅ AssemblyAI provider can be swapped in with API key (no contract changes)
4. ✅ Transcript alignment math proven correct with synthetic offsets
5. ✅ Session status updates to `editing` after transcript aligned

---

## Future Enhancements (Out of Scope for v1)

- **Multi-language** - Auto-detect + translate
- **Custom vocabulary** - Biblical terms, speaker names
- **Word-level editing** - Fine-grained timestamp adjustment
- **AI rewriting** - Clarity improvements, summary generation
- **WebSocket status** - Real-time transcription progress
- **Webhook support** - AssemblyAI callback instead of polling

---

## Dependencies

**Phase 9 (Complete):**
- `syncOffsets_ms` populated on session
- `anchorAngle` identifies master audio source

**Phase 11 (Blocked Until This Completes):**
- EDL generation requires aligned transcript for speaker → camera mapping

---

## Implementation Checklist

- [ ] Extend `library-transcription` schema
- [ ] Create TypeScript types (`/src/types/transcript.ts`)
- [ ] Implement `TranscriptionProvider` interface
- [ ] Implement `MockProvider` with fixtures
- [ ] Implement `AssemblyAIProvider` (stub for API key)
- [ ] Implement `TranscriptAlignmentService`
- [ ] Implement `SubtitleGenerator` (SRT + VTT)
- [ ] Wire up API routes (`/api/transcript/*`)
- [ ] Implement queue worker (`transcript:create`)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Document AssemblyAI API key setup

---

**Contract Approved:** Ready for implementation.
