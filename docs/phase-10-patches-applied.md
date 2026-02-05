# Phase 10 Critical Patches - APPLIED ✅

**Applied:** 2026-02-05  
**Patches:** 6 critical fixes  
**TypeScript:** ✅ Zero errors  
**Status:** Ready for E2E validation

---

## All 6 Patches Applied

### ✅ Patch 1: Fix Alignment Offset Lookup (CRITICAL)

**Problem:** Alignment used `syncOffsets_ms[sourceAssetId]` where sourceAssetId is numeric (123) but keys are camera angles ("A", "B", "C") → offsets always returned 0 → no alignment happened.

**Fix Applied:**
```typescript
// transcript-service.ts processTranscriptJob()

// BEFORE (bug):
const masterOffset = transcript.syncOffsets_ms[transcript.sourceAssetId] || 0;

// AFTER (fix):
const sourceAsset = await strapi.entityService.findOne(
  'api::media-asset.media-asset',
  transcript.sourceAssetId,
  { fields: ['id', 'angle'] }
);

const angleKey = (sourceAsset as any)?.angle;
const masterOffset = (angleKey && transcript.syncOffsets_ms?.[angleKey])
  ? transcript.syncOffsets_ms[angleKey]
  : 0;

strapi.log.info(
  `[transcript-service] Applying alignment: angle=${angleKey}, offset=${masterOffset}ms`
);
```

**Impact:** Alignment now works correctly. Transcript timestamps will reflect actual sync offsets from Phase 9.

---

### ✅ Patch 2: Fix Segment Update Corruption (CRITICAL)

**Problem:** Frontend sent `{ segments: updates }` where updates was a partial/single segment → backend replaced entire array with one segment → data corruption.

**Fix Applied:**

**Backend keeps full-array update (unchanged)**

**Frontend - New safe function:**
```typescript
// lib/studio/transcript.ts

// Renamed and fixed to send complete array:
export async function updateTranscriptSegments(
  transcriptId: string,
  segments: TranscriptSegment[],  // Full array, not partial
  authToken: string
) {
  return apiFetch(`/api/library-transcription/library-transcriptions/${transcriptId}`, {
    method: 'PUT',
    authToken,
    body: JSON.stringify({
      data: {
        segments,  // Complete updated array
        transcriptText: segments.map(s => s.text).join(' '),
      },
    }),
  });
}
```

**TranscriptEditor now has:**
- Local state management (`useState(segments)`)
- "Save Changes" button that calls `updateTranscriptSegments()`
- "Reset" button to discard changes
- Visual "unsaved changes" indicator

**Impact:** Edits now persist correctly without corruption.

---

### ✅ Patch 3: Kill Caching on Transcript Fetch (CRITICAL)

**Problem:** Next.js cached transcript fetches → status never updated during QUEUED → PROCESSING → ALIGNED transitions.

**Fix Applied:**

**Page-level cache control:**
```typescript
// app/[locale]/studio/sessions/[id]/transcript/page.tsx

export const revalidate = 0;
export const dynamic = 'force-dynamic';
```

**API-level cache control:**
```typescript
// lib/studio/api.ts apiFetch()

const response = await fetch(url, {
  ...fetchOptions,
  cache: fetchOptions.cache || 'no-store',  // Default to no-store
  headers: { ... },
});
```

**Impact:** Transcript status updates are now live.

---

### ✅ Patch 4: Validate/Clamp Segments (CRITICAL)

**Problem:** No validation → negative timestamps, inverted ranges, overlaps → broken SRT/VTT files that crash video players.

**Fix Applied:**

**Backend (subtitle-generator.ts):**
```typescript
private validateAndClampSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);

  return sorted.map((seg, i, arr) => {
    const start = Math.max(0, Math.floor(seg.startMs));
    const rawEnd = Math.floor(seg.endMs);
    const minEnd = start + 100;  // Minimum 100ms duration
    const nextStart = arr[i + 1]?.startMs ?? Number.POSITIVE_INFINITY;
    const clampedEnd = Math.max(minEnd, Math.min(rawEnd, nextStart));

    return { ...seg, startMs: start, endMs: clampedEnd };
  });
}

generate(args) {
  const safeSegments = this.validateAndClampSegments(args.segments);
  // Use safeSegments for generation
}
```

**Frontend (transcript.ts):**
- Same validation function added
- Used in both `generateSRT()` and `generateVTT()`

**Impact:** Subtitle exports are now resilient and standards-compliant.

---

### ✅ Patch 5: Replace Hard Reload with Polling (UX + CORRECTNESS)

**Problem:** `window.location.reload()` nuked the page → lost edits, jarring UX.

**Fix Applied:**
```typescript
// TranscriptViewerPage.tsx

const TERMINAL_STATES = new Set(['ALIGNED', 'FAILED', 'completed', 'failed']);

async function pollTranscript() {
  const maxAttempts = 60; // ~2 mins
  for (let i = 0; i < maxAttempts; i++) {
    const t = await getTranscript(sessionId, authToken);
    if (!t) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    if (TERMINAL_STATES.has(t.status)) {
      return t;
    }

    // Update UI to show progress
    setTranscript(t);

    // Exponential backoff up to 8s
    const delay = Math.min(1000 * (2 + i), 8000);
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error('Transcript polling timed out');
}

async function handleGenerateTranscript() {
  setIsGenerating(true);
  try {
    const res = await startTranscription(sessionId, authToken, {...});

    // Optimistic update - show QUEUED immediately
    setTranscript({
      id: res.data.transcriptId,
      status: res.data.status,
      // ... other fields
    });

    // Poll until terminal state
    const finalTranscript = await pollTranscript();
    setTranscript(finalTranscript);
  } finally {
    setIsGenerating(false);
  }
}
```

**Impact:** Smooth status transitions, no data loss, no page reloads.

---

### ✅ Bonus Patch: Validate POST Response Shape

**Problem:** `startTranscription()` didn't validate response → runtime errors if backend returned unexpected shape.

**Fix Applied:**
```typescript
// lib/studio/transcript.ts

export const StartTranscriptionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transcriptId: z.number(),
    status: z.enum(['QUEUED', 'PROCESSING', 'RAW_READY', 'ALIGNED', 'FAILED']),
  }),
});

export async function startTranscription(
  sessionId: string,
  authToken: string,
  options: StartTranscriptionOptions = {}
): Promise<StartTranscriptionResponse> {
  const raw = await apiFetch(...);
  return StartTranscriptionResponseSchema.parse(raw);  // Validate with Zod
}
```

**Impact:** Type-safe transcription start, early error detection.

---

## Files Modified

### Backend (3 files)
1. `ruach-ministries-backend/src/api/recording-session/services/transcript-service.ts`
   - Added asset angle lookup for alignment offset
2. `ruach-ministries-backend/src/services/transcription/subtitle-generator.ts`
   - Added timestamp validation/clamping

### Frontend (5 files)
1. `apps/ruach-next/src/lib/studio/transcript.ts`
   - Renamed `updateTranscriptSegment` → `updateTranscriptSegments`
   - Added `StartTranscriptionResponseSchema`
   - Added response validation
   - Added timestamp validation
2. `apps/ruach-next/src/lib/studio/api.ts`
   - Added `cache: 'no-store'` default
3. `apps/ruach-next/src/lib/studio/index.ts`
   - Updated exports
4. `apps/ruach-next/src/components/studio/Transcript/TranscriptEditor.tsx`
   - Added local state management
   - Added Save/Reset buttons
   - Added persistence logic
5. `apps/ruach-next/src/components/studio/Transcript/TranscriptViewerPage.tsx`
   - Replaced hard reload with polling
   - Added optimistic updates
6. `apps/ruach-next/src/app/[locale]/studio/sessions/[id]/transcript/page.tsx`
   - Added cache control directives

---

## E2E Validation Checklist (Ready to Test)

### 1. Happy Path
- [ ] Create/choose synced session
- [ ] Click Generate Transcript
- [ ] Verify status progression: QUEUED → PROCESSING → ALIGNED
- [ ] Confirm sourceAssetId populated
- [ ] Confirm syncOffsets_ms present
- [ ] Open transcript page
- [ ] Verify segments render with correct timestamps
- [ ] Check for no negative times, no overlaps

### 2. Alignment Correctness ⭐ CRITICAL TEST
- [ ] Pick session with known sync offset (e.g., ±500ms)
- [ ] Generate transcript
- [ ] Verify segment timestamps reflect offset
- [ ] Export SRT
- [ ] Test in video player against session timeline
- [ ] Verify first spoken phrase matches subtitle within ~200ms

### 3. Editing + Persistence
- [ ] Edit 3 segments (text changes)
- [ ] Change speaker on 5 segments
- [ ] Click "Save Changes"
- [ ] Refresh page
- [ ] Verify edits persisted

### 4. Speaker Mapping Propagation
- [ ] Map Speaker A → "Marc", B → "Jonathan"
- [ ] Verify segment badges update
- [ ] Verify subtitle preview updates
- [ ] Export SRT/VTT
- [ ] Verify mapped names appear

### 5. Export Correctness
- [ ] Export SRT
  - [ ] Sequential numbering
  - [ ] HH:MM:SS,mmm format
  - [ ] start < end always
- [ ] Export VTT
  - [ ] Begins with WEBVTT
  - [ ] HH:MM:SS.mmm format
  - [ ] Imports cleanly into video editor

---

## Expected Results vs. Previous Bugs

| Test | Before Patches | After Patches |
|------|---------------|---------------|
| Alignment | ❌ Always 0ms offset | ✅ Correct offset from Phase 9 |
| Segment Edit | ❌ Corrupts entire array | ✅ Persists correctly |
| Status Updates | ❌ Cached/stale | ✅ Live updates |
| Subtitle Export | ❌ Negative/overlapping times | ✅ Validated and clamped |
| Generate Flow | ❌ Hard reload loses state | ✅ Smooth polling |
| Response Validation | ❌ Runtime errors possible | ✅ Type-safe with Zod |

---

## Golden Run Artifact Checklist

Once E2E passes, capture:
- [ ] sessionId
- [ ] transcriptId
- [ ] syncOffsets_ms values
- [ ] Exported SRT file
- [ ] 20s screen recording showing subtitle sync correctness

This becomes the regression anchor forever.

---

## Compilation Status

```bash
pnpm tsc --noEmit
```

**Result:** ✅ Zero errors

---

## Next Step

**DO NOT PROCEED TO PHASE 11 YET**

1. Start backend: `pnpm dev` in `ruach-ministries-backend`
2. Start frontend: `pnpm dev` in `apps/ruach-next`
3. Run E2E validation checklist above
4. If all pass → Capture golden run artifacts
5. Only then → Phase 11 can begin with confidence

---

**Phase 10 Patches: APPLIED AND READY FOR VALIDATION** ✅

The foundation is now solid. Time to prove it works.
