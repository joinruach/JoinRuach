# Phase 10 Golden Run Checklist

**Date:** _____________  
**Operator:** _____________  
**Duration:** _____________ minutes

---

## Pre-flight Checklist (2 minutes)

- [ ] Strapi running (`pnpm dev` in ruach-ministries-backend)
- [ ] Redis running (if using BullMQ for queue)
- [ ] Next.js frontend running (`pnpm dev` in apps/ruach-next)
- [ ] Database migrated (check library-transcription schema has Phase 10 fields)
- [ ] One synced session exists with:
  - [ ] `syncOffsets_ms` populated (e.g., `{ "A": 1830, "B": -420, "C": 0 }`)
  - [ ] `sourceAssetId` points to master audio asset
  - [ ] Master asset has `angle` field populated (A/B/C)
  - [ ] Status = `synced` or `editing`

**Session to test:**
- Session ID: _____________
- Sync offsets: _____________
- Master angle: _____________

---

## Test 1: Happy Path State Machine

**Goal:** Verify status transitions work without refreshes/loops

1. [ ] Open Session Detail page (`/studio/sessions/[id]`)
2. [ ] Click "Generate Transcript" button
3. [ ] Observe status transitions (don't refresh page):
   - [ ] QUEUED (appears immediately)
   - [ ] PROCESSING (after polling starts)
   - [ ] RAW_READY (provider completed)
   - [ ] ALIGNED (alignment applied)
4. [ ] Transcript editor loads without manual refresh

**Pass Condition:** Reaches ALIGNED without page reloads

**Capture:**
- [ ] Screenshot of ALIGNED status
- [ ] Note transcriptId: _____________

**Result:** ☐ PASS  ☐ FAIL

**If FAIL, note symptom:**
_____________________________________________

---

## Test 2: Alignment Correctness ⭐ CRITICAL

**Goal:** Prove timestamps reflect actual sync offsets

1. [ ] Open transcript editor
2. [ ] Find first segment (easiest to identify in audio)
3. [ ] Note segment start time: _____________ ms
4. [ ] Expected aligned time = raw time + offset: _____________ ms
5. [ ] Click "Subtitles" tab
6. [ ] Select SRT format
7. [ ] Click "Download SRT"
8. [ ] Open downloaded file, verify first timestamp matches expected
9. [ ] Import SRT into video player (VLC/QuickTime/Premiere/Final Cut)
10. [ ] Play master camera video at first segment timestamp
11. [ ] Verify subtitle cue appears when words are spoken (±200ms tolerance)

**Pass Condition:** Visual/audio sync is accurate

**Capture:**
- [ ] `syncOffsets_ms.json` (copy from session record)
- [ ] `export.srt` file (save to golden-runs folder)
- [ ] 20s screen recording showing subtitle sync (`screenproof-20s.mov`)
- [ ] Note first segment timestamp: _____________
- [ ] Note observed sync accuracy: ☐ Perfect  ☐ Within 200ms  ☐ Off by _____ms

**Result:** ☐ PASS  ☐ FAIL

**If FAIL, check:**
- [ ] sourceAssetId matches master asset?
- [ ] Master asset has `angle` field populated?
- [ ] Angle matches syncOffsets_ms key? (case-sensitive!)
- [ ] Backend log shows correct offset applied?

---

## Test 3: Editing + Persistence

**Goal:** Verify edits save correctly without corruption

1. [ ] In transcript editor, edit 3 segments:
   - Segment 1 text: _____________
   - Segment 2 text: _____________
   - Segment 3 text: _____________
2. [ ] Change speaker on 5 segments (any speakers)
3. [ ] Click "Save Changes" button
4. [ ] Wait for "saved successfully" confirmation
5. [ ] Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
6. [ ] Verify all 3 text edits persist
7. [ ] Verify all 5 speaker changes persist
8. [ ] Verify no segments disappeared
9. [ ] Verify segment order unchanged

**Pass Condition:** All edits persist identically after refresh

**Capture:**
- [ ] Screenshot BEFORE save (showing yellow "unsaved changes" bar)
- [ ] Screenshot AFTER refresh (showing persisted edits)

**Result:** ☐ PASS  ☐ FAIL

**If FAIL, note:**
- [ ] How many segments exist after refresh? _____________
- [ ] Were edits lost? ☐ Yes  ☐ No
- [ ] Were segments duplicated? ☐ Yes  ☐ No

---

## Test 4: Speaker Mapping Propagation

**Goal:** Verify speaker names update everywhere

1. [ ] Click "Speakers" tab
2. [ ] Map speakers:
   - Speaker A → _____________
   - Speaker B → _____________
3. [ ] Verify segment badges update in real-time
4. [ ] Switch to "Editor" tab
5. [ ] Verify speaker dropdowns show mapped names
6. [ ] Switch to "Subtitles" tab
7. [ ] Verify preview shows mapped names (if format includes speakers)
8. [ ] Download SRT
9. [ ] Open file and verify speaker labels (if included in format)

**Pass Condition:** Mapping affects all views deterministically

**Capture:**
- [ ] Screenshot of speaker mapping UI
- [ ] Screenshot of segment list with updated badges
- [ ] Note: Does SRT include speaker names? ☐ Yes  ☐ No

**Result:** ☐ PASS  ☐ FAIL

---

## Test 5: Export Validity (Standards Compliance)

**Goal:** Verify exports are standards-compliant

### SRT Validation
1. [ ] Open exported SRT in text editor
2. [ ] Check first 3 captions:
   - [ ] Sequential numbering (1, 2, 3...)
   - [ ] Timestamps monotonic (each start > previous end)
   - [ ] No negative times (all >= 00:00:00,000)
   - [ ] Format: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
   - [ ] No overlaps (if clamping applied)
3. [ ] Import into video editor (Premiere/Final Cut)
4. [ ] Verify no import errors

### VTT Validation
1. [ ] Download VTT format
2. [ ] Open in text editor
3. [ ] Check:
   - [ ] Starts with `WEBVTT`
   - [ ] Format: `HH:MM:SS.mmm --> HH:MM:SS.mmm` (dot not comma)
4. [ ] Test in HTML5 video player

**Pass Condition:** Both formats import without errors

**Capture:**
- [ ] `export.srt` (first 5 captions)
- [ ] `export.vtt` (first 5 captions)
- [ ] Note editor used for import: _____________

**Result:** ☐ PASS  ☐ FAIL

---

## Golden Run Artifact Bundle

Create folder: `/golden-runs/phase-10/YYYY-MM-DD-session-[ID]/`

Include:
- [ ] `sessionId.txt` - Just the session ID
- [ ] `transcriptId.txt` - Just the transcript ID
- [ ] `syncOffsets_ms.json` - Full offsets object
- [ ] `export.srt` - Full SRT file
- [ ] `export.vtt` - Full VTT file
- [ ] `screenproof-20s.mov` - Screen recording of Test 2
- [ ] `screenshot-aligned.png` - Status showing ALIGNED
- [ ] `screenshot-edits-before.png` - Before save
- [ ] `screenshot-edits-after.png` - After refresh
- [ ] `notes.md` - Any observations, issues, or edge cases

---

## Overall Result

**All 5 Tests:** ☐ PASS  ☐ FAIL

**If ALL PASS:**
✅ Phase 10 is production-ready for v1.
✅ Golden run artifacts captured for regression testing.
✅ Ready to proceed to Phase 11.

**If ANY FAIL:**
❌ Do NOT proceed to Phase 11.
❌ Report failing test number and symptom.
❌ Apply targeted fix, then re-run golden run.

---

## Notes / Observations

_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
