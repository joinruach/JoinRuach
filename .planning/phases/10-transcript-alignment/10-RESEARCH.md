# Phase 10: Transcript Alignment - Research

**Researched:** 2026-02-03
**Domain:** Multi-camera video transcript alignment with sync offsets
**Confidence:** HIGH

<research_summary>
## Summary

Researched how to align transcripts with synchronized multi-camera video using Phase 9's audio sync offsets. The standard approach in 2025 involves using AI-powered speech-to-text APIs (AssemblyAI, Deepgram, or Whisper) to generate word-level timestamps, then applying camera sync offsets to align transcripts across all camera angles.

Key finding: Don't hand-roll speech-to-text or speaker diarization. Modern APIs (AssemblyAI, Deepgram) provide word-level timestamps with ~400ms accuracy, speaker identification, and confidence scores. The alignment task reduces to: (1) transcribe master audio, (2) apply sync offsets from Phase 9 to other cameras, (3) store in structured format (JSON with word-level timestamps).

**Primary recommendation:** Use AssemblyAI or Deepgram for transcription with word-level timestamps + speaker diarization. Store transcripts in JSON format with millisecond timestamps. Apply Phase 9 sync offsets to align transcripts across cameras. Generate SRT/VTT for video player display.
</research_summary>

<standard_stack>
## Standard Stack

### Core Transcription APIs

| Service | Pricing | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AssemblyAI | $0.46/hour | Speech-to-text with word timestamps | Industry leader, 400ms accuracy, excellent speaker diarization |
| Deepgram Nova-3 | $0.46/hour streaming | Real-time and batch transcription | 5-7% WER, <300ms latency, streaming support |
| OpenAI Whisper | Self-hosted | Open-source ASR | Free but requires GPU infrastructure, 10.6% WER |

### Supporting Libraries (Node.js/TypeScript)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| subtitle (subtitle.js) | 3.x | Parse/manipulate SRT/VTT | Converting between formats, resyncing |
| subsrt | 2.x | Convert subtitle formats | Multi-format support (SRT, VTT, SUB, ASS, SSA) |
| @assemblyai/sdk | Latest | AssemblyAI API wrapper | If using AssemblyAI |
| @deepgram/sdk | 3.x | Deepgram API wrapper | If using Deepgram |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AssemblyAI/Deepgram | Self-hosted Whisper + WhisperX | Whisper is free but requires GPU infrastructure, higher WER, more complex |
| JSON master format | SRT/VTT only | JSON preserves word-level data, SRT/VTT is phrase-level only |
| API transcription | FFmpeg subtitle extraction | APIs provide speaker diarization and confidence scores, FFmpeg doesn't |

### Installation

```bash
# AssemblyAI approach
npm install @assemblyai/assemblyai-node subtitle

# Deepgram approach
npm install @deepgram/sdk subtitle

# Self-hosted Whisper approach (requires Python)
pip install openai-whisper whisperx
npm install subtitle subsrt
```

**Recommended:** AssemblyAI for production (best speaker diarization), Deepgram for streaming/real-time, Whisper for cost-sensitive projects.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure

```
ruach-ministries-backend/src/
├── services/
│   ├── transcription-service.ts       # AssemblyAI/Deepgram integration
│   ├── transcript-alignment-service.ts # Apply sync offsets to transcripts
│   └── subtitle-generator.ts           # Convert JSON to SRT/VTT
├── api/
│   └── recording-session/
│       ├── controllers/
│       │   └── transcript-controller.ts
│       ├── services/
│       │   └── transcript-service.ts
│       └── routes/
│           └── transcript-routes.ts
└── types/
    └── transcript.ts                   # TypeScript interfaces
```

### Pattern 1: Master Camera Transcription with Sync Offset Application

**What:** Transcribe master camera audio (from Phase 9), then apply sync offsets to align transcripts for all cameras

**When to use:** Standard multi-camera workflow with audio sync already computed

**Example:**

```typescript
// Source: AssemblyAI docs + Phase 9 sync offsets pattern
import { AssemblyAI } from 'assemblyai';

interface SyncOffsets {
  A: number; // master = 0
  B: number; // e.g., 1830ms
  C: number; // e.g., -420ms
}

interface WordTimestamp {
  word: string;
  start: number; // milliseconds
  end: number;
  confidence: number;
  speaker?: string;
}

interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

async function transcribeAndAlign(
  masterAudioUrl: string,
  syncOffsets: SyncOffsets,
  masterCamera: string
): Promise<Record<string, TranscriptSegment[]>> {
  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

  // 1. Transcribe master camera audio with speaker diarization
  const transcript = await client.transcripts.transcribe({
    audio_url: masterAudioUrl,
    speaker_labels: true,
    word_boost: ['specific', 'ministry', 'terms'], // Optional: boost domain vocabulary
  });

  if (transcript.status === 'error') {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  // 2. Extract word-level timestamps with speaker labels
  const masterSegments: TranscriptSegment[] = transcript.words.reduce((acc, word) => {
    const speakerId = word.speaker || 'SPEAKER_UNKNOWN';
    const lastSegment = acc[acc.length - 1];

    if (lastSegment && lastSegment.speaker === speakerId) {
      // Continue current segment
      lastSegment.end = word.end;
      lastSegment.text += ` ${word.text}`;
      lastSegment.words.push({
        word: word.text,
        start: word.start,
        end: word.end,
        confidence: word.confidence,
        speaker: speakerId,
      });
    } else {
      // Start new segment
      acc.push({
        speaker: speakerId,
        start: word.start,
        end: word.end,
        text: word.text,
        words: [{
          word: word.text,
          start: word.start,
          end: word.end,
          confidence: word.confidence,
          speaker: speakerId,
        }],
      });
    }

    return acc;
  }, [] as TranscriptSegment[]);

  // 3. Apply sync offsets to generate aligned transcripts for each camera
  const alignedTranscripts: Record<string, TranscriptSegment[]> = {};

  for (const [camera, offsetMs] of Object.entries(syncOffsets)) {
    alignedTranscripts[camera] = masterSegments.map(segment => ({
      ...segment,
      start: segment.start + offsetMs,
      end: segment.end + offsetMs,
      words: segment.words.map(word => ({
        ...word,
        start: word.start + offsetMs,
        end: word.end + offsetMs,
      })),
    }));
  }

  return alignedTranscripts;
}
```

### Pattern 2: Storing Transcripts in Strapi

**What:** Store transcript data in Strapi with proper relations to recording sessions

**When to use:** Persisting transcripts for later use in editing/rendering

**Example:**

```typescript
// Store transcript in Strapi
async function storeTranscript(
  strapi: Core.Strapi,
  sessionId: string,
  alignedTranscripts: Record<string, TranscriptSegment[]>
) {
  // Create or update transcript entity
  const transcript = await strapi.entityService.create(
    'api::library-transcription.library-transcription',
    {
      data: {
        recordingSession: sessionId,
        masterTranscript: JSON.stringify(alignedTranscripts), // Store all camera transcripts
        speakerCount: countUniqueSpeakers(alignedTranscripts),
        duration_ms: calculateDuration(alignedTranscripts),
        confidence: calculateAverageConfidence(alignedTranscripts),
        status: 'completed',
      },
    }
  );

  // Update session status
  await strapi.entityService.update(
    'api::recording-session.recording-session',
    sessionId,
    {
      data: {
        transcript: transcript.id,
        status: 'transcribed',
      },
    }
  );

  return transcript;
}
```

### Pattern 3: Generate SRT/VTT for Video Players

**What:** Convert JSON transcript to SRT/VTT for use in video players

**When to use:** Display captions/subtitles in preview UI or final renders

**Example:**

```typescript
// Source: subtitle.js docs
import { stringify } from 'subtitle';

function generateSRT(segments: TranscriptSegment[]): string {
  const subtitles = segments.map((segment, index) => ({
    type: 'cue' as const,
    data: {
      start: segment.start,
      end: segment.end,
      text: `[${segment.speaker}] ${segment.text}`,
    },
  }));

  return stringify(subtitles, { format: 'SRT' });
}

function generateVTT(segments: TranscriptSegment[]): string {
  const subtitles = segments.map((segment, index) => ({
    type: 'cue' as const,
    data: {
      start: segment.start,
      end: segment.end,
      text: `<v ${segment.speaker}>${segment.text}</v>`, // VTT voice tags
    },
  }));

  return stringify(subtitles, { format: 'WebVTT' });
}
```

### Anti-Patterns to Avoid

- **Transcribing all cameras separately:** Waste of API costs. Transcribe master only, apply offsets.
- **Not storing JSON master format:** SRT/VTT lose word-level data. Always keep JSON.
- **Hand-rolling speaker diarization:** APIs do this better with higher accuracy.
- **Ignoring confidence scores:** Use confidence to flag low-accuracy segments for manual review.
- **Not preserving original timestamps:** Keep master camera timestamps before offset application for debugging.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Speech-to-text | Custom ASR model | AssemblyAI/Deepgram | Modern APIs have 5-7% WER, your model won't match this without massive training data |
| Speaker diarization | Custom speaker identification | API speaker_labels feature | Pyannote (what APIs use) is state-of-the-art, trained on massive datasets |
| Word-level timestamps | Manual alignment | API word timestamps | APIs provide 400ms accuracy, manual alignment error-prone |
| Confidence scoring | Custom confidence metrics | API confidence scores | APIs calibrate confidence across millions of hours of audio |
| Subtitle format conversion | Custom parsers | subtitle.js, subsrt | Subtitle formats have edge cases (timecode overflows, style tags) |
| Sync offset application | Manual timestamp math | Simple addition in milliseconds | This is straightforward, but validate overflow/underflow |

**Key insight:** Speech recognition and speaker diarization are solved problems in 2025. AssemblyAI and Deepgram have invested millions in training models on diverse datasets. Custom solutions will have higher WER (Word Error Rate), worse speaker accuracy, and require ongoing maintenance. The cost of APIs ($0.46/hour) is negligible compared to infrastructure and engineering time for self-hosted solutions.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Timestamp Overflow/Underflow

**What goes wrong:** Applying negative sync offsets can create negative timestamps, breaking subtitle parsers

**Why it happens:** Camera C has offset -420ms, but transcript word starts at 200ms → 200 - 420 = -220ms (invalid)

**How to avoid:** Clamp timestamps to 0, or shift all timestamps by abs(min_offset) before applying offsets

**Warning signs:** SRT/VTT files fail to load, video player errors, negative timestamps in JSON

**Solution:**
```typescript
function applySyncOffset(timestamp: number, offset: number): number {
  return Math.max(0, timestamp + offset); // Clamp to 0
}

// OR: Shift all timestamps to avoid negatives
const minOffset = Math.min(...Object.values(syncOffsets));
const shift = minOffset < 0 ? Math.abs(minOffset) : 0;

alignedTranscripts[camera] = masterSegments.map(segment => ({
  start: segment.start + offsetMs + shift,
  end: segment.end + offsetMs + shift,
}));
```

### Pitfall 2: Low Confidence Segments Ignored

**What goes wrong:** Low-confidence transcription segments go unnoticed, causing incorrect captions

**Why it happens:** Not monitoring confidence scores from API responses

**How to avoid:** Flag segments with confidence < 0.85 for manual review, store flagged segments in metadata

**Warning signs:** User reports incorrect captions, specific words consistently wrong

**Solution:**
```typescript
const lowConfidenceSegments = transcript.words.filter(w => w.confidence < 0.85);

if (lowConfidenceSegments.length > 0) {
  await strapi.entityService.update('api::library-transcription.library-transcription', transcriptId, {
    data: {
      status: 'needs-review',
      metadata: {
        lowConfidenceCount: lowConfidenceSegments.length,
        lowConfidenceWords: lowConfidenceSegments.map(w => ({
          word: w.text,
          confidence: w.confidence,
          start: w.start,
        })),
      },
    },
  });
}
```

### Pitfall 3: Speaker Diarization Inaccuracy

**What goes wrong:** API mis-identifies speakers (Speaker A/B swap, or merges distinct speakers)

**Why it happens:** Poor audio quality, overlapping speech, similar voices, background noise

**How to avoid:** Use high-quality audio from Phase 9 (r2_audio_wav_url), provide speaker count hint if known, allow manual speaker correction

**Warning signs:** Speaker labels inconsistent, same speaker labeled A then B then A

**Solution:**
```typescript
// Provide speaker count hint to API
const transcript = await client.transcripts.transcribe({
  audio_url: masterAudioUrl,
  speaker_labels: true,
  speakers_expected: 3, // Hint: we know there are 3 speakers
});

// Store operator corrections
interface SpeakerCorrection {
  originalLabel: string; // e.g., "SPEAKER_A"
  correctedLabel: string; // e.g., "Pastor John"
  timeRange: { start: number; end: number };
}

// Apply corrections when generating final captions
```

### Pitfall 4: Transcription Cost Explosion

**What goes wrong:** Transcribing all 3 cameras separately costs 3x more

**Why it happens:** Not leveraging Phase 9's audio sync offsets

**How to avoid:** Transcribe master camera only, apply sync offsets to generate aligned transcripts for other cameras

**Warning signs:** API bills higher than expected, redundant transcription jobs

**Solution:** Use Pattern 1 (Master Camera Transcription with Sync Offset Application) above

### Pitfall 5: Missing Word-Level Timestamps

**What goes wrong:** Using sentence-level timestamps instead of word-level, losing granularity

**Why it happens:** Not requesting word-level timestamps from API

**How to avoid:** Ensure API request includes word-level timestamps (default for AssemblyAI/Deepgram)

**Warning signs:** Transcript JSON only has sentence start/end, no word array

**Solution:**
```typescript
// AssemblyAI automatically includes word-level timestamps
const transcript = await client.transcripts.transcribe({
  audio_url: masterAudioUrl,
  // No special flag needed - word-level is default
});

// Deepgram: enable word-level timestamps
const { result } = await deepgram.listen.prerecorded.transcribeUrl({
  url: masterAudioUrl,
}, {
  model: 'nova-2',
  smart_format: true,
  diarize: true,
  utterances: true, // Enables word-level timestamps
});
```

### Pitfall 6: Format Conversion Data Loss

**What goes wrong:** Converting JSON to SRT/VTT loses word-level data, then can't regenerate

**Why it happens:** Not keeping JSON as master format

**How to avoid:** Store JSON in database, generate SRT/VTT on-demand for display

**Warning signs:** Need word-level data later, only have SRT/VTT files

**Solution:** Always store JSON master format, treat SRT/VTT as derived output
</common_pitfalls>

<code_examples>
## Code Examples

### AssemblyAI Transcription with Speaker Labels

```typescript
// Source: AssemblyAI docs - https://www.assemblyai.com/docs/pre-recorded-audio/word-level-timestamps
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const transcript = await client.transcripts.transcribe({
  audio_url: 'https://r2.example.com/session-123/master-A.wav',
  speaker_labels: true,
  word_boost: ['ministry', 'scripture', 'congregation'], // Boost domain vocabulary
  language_code: 'en', // Optional: auto-detected by default
});

if (transcript.status === 'error') {
  throw new Error(`Transcription failed: ${transcript.error}`);
}

// Access word-level timestamps
transcript.words.forEach(word => {
  console.log(`${word.text}: ${word.start}ms - ${word.end}ms (Speaker: ${word.speaker}, Confidence: ${word.confidence})`);
});
```

### Deepgram Transcription with Diarization

```typescript
// Source: Deepgram docs - https://deepgram.com/learn/working-with-timestamps-utterances-and-speaker-diarization-in-deepgram
import { createClient } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
  { url: 'https://r2.example.com/session-123/master-A.wav' },
  {
    model: 'nova-3',
    smart_format: true,
    diarize: true,
    utterances: true,
    punctuate: true,
  }
);

if (error) throw error;

// Access word-level timestamps with speaker labels
result.results.channels[0].alternatives[0].words.forEach(word => {
  console.log(`${word.word}: ${word.start * 1000}ms - ${word.end * 1000}ms (Speaker: ${word.speaker})`);
  // Note: Deepgram returns timestamps in seconds, multiply by 1000 for milliseconds
});
```

### Applying Sync Offsets to Transcript

```typescript
// Source: Custom implementation based on Phase 9 sync offsets
interface SyncOffsets {
  A: number; // master = 0
  B: number; // e.g., 1830ms
  C: number; // e.g., -420ms
}

function alignTranscriptForCamera(
  masterSegments: TranscriptSegment[],
  cameraOffset: number
): TranscriptSegment[] {
  return masterSegments.map(segment => ({
    ...segment,
    start: Math.max(0, segment.start + cameraOffset), // Clamp to 0
    end: Math.max(0, segment.end + cameraOffset),
    words: segment.words.map(word => ({
      ...word,
      start: Math.max(0, word.start + cameraOffset),
      end: Math.max(0, word.end + cameraOffset),
    })),
  }));
}

// Usage
const syncOffsets: SyncOffsets = { A: 0, B: 1830, C: -420 };
const alignedTranscripts: Record<string, TranscriptSegment[]> = {};

for (const [camera, offset] of Object.entries(syncOffsets)) {
  alignedTranscripts[camera] = alignTranscriptForCamera(masterSegments, offset);
}
```

### Generate SRT with Speaker Labels

```typescript
// Source: subtitle.js + custom formatting
import { stringify } from 'subtitle';

function generateSRTWithSpeakers(segments: TranscriptSegment[]): string {
  const subtitles = segments.map((segment, index) => ({
    type: 'cue' as const,
    data: {
      start: segment.start,
      end: segment.end,
      text: segment.speaker !== 'SPEAKER_UNKNOWN'
        ? `[${segment.speaker}] ${segment.text}`
        : segment.text,
    },
  }));

  return stringify(subtitles, { format: 'SRT' });
}
```

### Detect Low Confidence Segments

```typescript
function detectLowConfidenceSegments(
  segments: TranscriptSegment[],
  threshold: number = 0.85
): Array<{ text: string; start: number; end: number; avgConfidence: number }> {
  return segments
    .map(segment => {
      const avgConfidence =
        segment.words.reduce((sum, w) => sum + w.confidence, 0) / segment.words.length;

      return { ...segment, avgConfidence };
    })
    .filter(segment => segment.avgConfidence < threshold)
    .map(({ text, start, end, avgConfidence }) => ({
      text,
      start,
      end,
      avgConfidence,
    }));
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Whisper v2 (2023) | Whisper v3 + WhisperX (2024) | Late 2024 | Better word-level timestamps, integrated diarization |
| Pyannote 2.x | Pyannote 3.x | 2024 | Improved speaker diarization accuracy, better timestamp reconciliation |
| Deepgram Nova-2 | Deepgram Nova-3 (2025) | Early 2025 | 5.26-6.84% WER (down from ~8%), higher timestamp precision |
| Manual speaker labeling | API speaker diarization | 2023+ | Speaker identification is now standard, highly accurate |
| SRT/VTT only | JSON master + SRT/VTT derived | 2024+ | Word-level data preservation for advanced editing |

**New tools/patterns to consider:**
- **VidSTR (2025):** LLM-based transcript temporal alignment for video composition (90% accuracy vs manual)
- **WhisperX:** Combines Whisper + forced alignment + Pyannote for best-in-class word timestamps + diarization
- **AssemblyAI LeMUR:** Post-transcription LLM processing for summarization, Q&A, custom actions
- **Deepgram Nova-3:** State-of-the-art accuracy (5-7% WER) with streaming support

**Deprecated/outdated:**
- **Manual timestamping:** APIs now provide word-level timestamps by default
- **Whisper without forced alignment:** WhisperX significantly improves timestamp accuracy
- **Self-hosted diarization:** Pyannote 3.x requires Hugging Face API token, easier to use via AssemblyAI/Deepgram
</sota_updates>

<open_questions>
## Open Questions

1. **Should we support real-time transcription during recording?**
   - What we know: Deepgram supports streaming transcription with word-level timestamps
   - What's unclear: Whether operators need live transcripts or batch is sufficient
   - Recommendation: Start with batch (Phase 10), add streaming later if needed

2. **How to handle operator corrections to transcripts?**
   - What we know: APIs have 5-7% WER, some errors inevitable
   - What's unclear: UI workflow for corrections, versioning strategy
   - Recommendation: Store corrections in metadata, preserve original for reference

3. **Should transcripts be per-camera or unified?**
   - What we know: Master camera provides best audio for transcription
   - What's unclear: Whether to generate separate transcripts or unified with camera switches
   - Recommendation: Unified transcript with timestamps aligned for all cameras (Pattern 1)
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)

- [AssemblyAI Word-Level Timestamps Docs](https://www.assemblyai.com/docs/pre-recorded-audio/word-level-timestamps) - Word timestamp API spec
- [Deepgram Working with Timestamps](https://deepgram.com/learn/working-with-timestamps-utterances-and-speaker-diarization-in-deepgram) - Utterances and diarization
- [subtitle.js GitHub](https://github.com/gsantiago/subtitle.js) - Stream-based subtitle parsing
- [Deepgram vs Whisper 2025 Comparison](https://deepgram.com/learn/whisper-vs-deepgram) - Performance benchmarks

### Secondary (MEDIUM confidence - cross-verified)

- [Multi-Speaker Transcript Formats](https://brasstranscripts.com/blog/multi-speaker-transcript-formats-srt-vtt-json) - JSON structure best practices
- [AssemblyAI Transcribe with Timestamps Tutorial](https://www.assemblyai.com/blog/how-to-transcribe-audio-with-timestamps) - Code examples
- [WhisperX GitHub](https://github.com/m-bain/whisperX) - Whisper + diarization integration
- [VidSTR Research Paper (CHI 2025)](https://dl.acm.org/doi/10.1145/3706598.3713857) - LLM-based temporal alignment

### Tertiary (LOW confidence - for awareness)

- [AI-Powered Video Temporal Alignment](https://reelmind.ai/blog/ai-powered-video-temporal-alignment-sync-multiple-camera-angles-perfectly) - Industry trends
- [Transcript Alignment Feature](https://www.3playmedia.com/services/features/transcript-alignment/) - Commercial solutions
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: AssemblyAI / Deepgram speech-to-text APIs
- Ecosystem: subtitle.js, subsrt, WhisperX
- Patterns: Master camera transcription + offset alignment
- Pitfalls: Timestamp overflow, confidence scoring, cost optimization

**Confidence breakdown:**
- Standard stack: HIGH - AssemblyAI/Deepgram are industry standard in 2025
- Architecture: HIGH - Master transcription + offset pattern is established
- Pitfalls: HIGH - Common issues well-documented in API docs and community
- Code examples: HIGH - From official API documentation

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - APIs stable but check for model updates)

---

*Phase: 10-transcript-alignment*
*Research completed: 2026-02-03*
*Ready for planning: yes*
</metadata>
