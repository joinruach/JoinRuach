# Testing Guide: Phase 9-11 (Multi-Camera Workflow)

**Date:** 2026-02-05
**Scope:** Complete testing protocol for Sync → Transcript → EDL workflow
**Duration:** 2-3 hours for full validation

---

## Overview

This guide walks through **proper testing** of the entire multi-camera workflow from upload to EDL export. By the end, you'll have validated:

- ✅ Phase 9: Multi-camera upload and sync
- ✅ Phase 10: Transcript generation and editing
- ✅ Phase 11: EDL generation and timeline editing

---

## Prerequisites

### 1. Environment Setup

**Required Services:**
```bash
# Terminal 1: Strapi Backend
cd ruach-ministries-backend
pnpm dev

# Terminal 2: Next.js Frontend
cd apps/ruach-next
pnpm dev

# Terminal 3: Redis (if using BullMQ)
redis-server

# Verify services:
# - Strapi: http://localhost:1337/admin
# - Frontend: http://localhost:3000
# - Redis: redis-cli ping (should return PONG)
```

**Environment Variables:**
```bash
# Required for transcript generation
ANTHROPIC_API_KEY=your-key-here

# Optional: Verify it's set
echo $ANTHROPIC_API_KEY
```

**Database:**
```bash
# Ensure database is migrated
cd ruach-ministries-backend
pnpm strapi ts:generate-types

# Verify content types exist:
# - recording-session
# - media-asset
# - library-transcription
# - edit-decision-list
```

---

### 2. Test Data Requirements

**You need:**
- **3 video files** (cameras A, B, C)
- **Same event** recorded from different angles
- **Synced audio** (for Phase 9 to detect offset)
- **Duration:** 5-10 minutes recommended (faster testing)
- **Format:** MP4, MOV, or any format supported by FFmpeg

**Where to get test videos:**
- Use actual multi-camera recording from a sermon/teaching
- Record 3-camera test session yourself (phones/cameras)
- Use sample multi-camera footage (YouTube, stock footage)

**Important:** Videos must have:
1. Overlapping audio (for sync detection)
2. Clear speech (for transcription)
3. Different angles (to test camera switching)

---

## Testing Protocol

### Phase 1: Session Creation & Upload (15 min)

**Objective:** Create session and upload 3 videos

**Steps:**

1. **Login to frontend**
   ```
   Navigate to: http://localhost:3000/en/studio/sessions
   Login with your Strapi credentials
   ```

2. **Create new session**
   ```
   Click: "Multi-Cam Sessions" card
   OR
   Navigate to: http://localhost:3000/en/studio/sessions/new
   ```

3. **Step 1: Session Metadata**
   - Title: "Test Session - Phase 9-11 Validation"
   - Recording Date: (today or any date)
   - Description: "Golden run test for multi-camera workflow"
   - Speakers: (select or leave empty)
   - Event Type: "teaching" (or other)
   - Anchor Angle: A (default)
   - Click "Next"

4. **Step 2: Upload 3 Videos**
   - Camera A: Upload your first video
   - Camera B: Upload your second video
   - Camera C: Upload your third video
   - **Wait for all 3 uploads to complete** (progress bars → 100%)
   - Click "Next"

5. **Step 3: Trigger Ingestion**
   - Review session details
   - Click "Create Session & Start Ingestion"
   - **Note the Session ID** from URL (you'll need this)

**Expected Result:**
- Redirects to `/studio/sessions/{session-id}`
- Session status shows "ingesting"
- Asset cards show transcoding progress

**Validation:**
- [ ] All 3 videos uploaded successfully
- [ ] Session created with correct metadata
- [ ] Asset cards visible for A, B, C
- [ ] Transcoding jobs running (check logs)

**Troubleshooting:**
- Upload fails → Check file size limits, network connection
- Transcoding stuck → Check backend logs for FFmpeg errors
- Session not created → Check Strapi admin for validation errors

---

### Phase 2: Sync Computation & Review (20 min)

**Objective:** Compute sync offsets and review results

**Steps:**

1. **Wait for transcoding to complete**
   - Refresh page periodically
   - Status should change: `ingesting` → `needs-review`
   - Asset cards show proxy/mezzanine URLs
   - **This may take 5-15 minutes** depending on video length

2. **Navigate to Sync Review**
   ```
   Click: "Review Sync" button
   OR
   Navigate to: /studio/sessions/{id}/sync-review
   ```

3. **Verify sync results**
   - Check `OffsetSummaryCard`:
     - Camera A: 0ms (anchor)
     - Camera B: some offset (e.g., -420ms)
     - Camera C: some offset (e.g., +1830ms)
   - Check confidence scores (standard_score from audio-offset-finder)
   - Check classifications:
     - **Green (≥10):** "Looks Good" ✓
     - **Yellow (5-10):** "Review Suggested" ⚠️
     - **Red (<5):** "Needs Manual Nudge" ⚠️

4. **Review waveform visualization**
   - Scroll to "Waveform Comparison" (if visible)
   - Verify waveforms load
   - Play audio and verify sync looks correct

5. **Approve or Correct Sync**

   **If confidence is HIGH (green):**
   ```
   Click: "✓ Approve Sync" button
   Confirm approval
   ```

   **If confidence is LOW (yellow/red):**
   ```
   Expand: "Manual Offset Adjuster"
   Adjust sliders for Camera B and C
   Click: "Save Manual Offsets"
   ```

6. **Verify session status update**
   - Page redirects to session detail
   - Session status now shows: `synced`
   - Green badge or checkmark visible

**Expected Result:**
- Session status: `synced`
- `syncOffsets_ms` populated: `{ "A": 0, "B": -420, "C": 1830 }`
- `operatorStatus`: `approved` or `corrected`

**Validation:**
- [ ] Sync offsets computed
- [ ] Confidence scores displayed
- [ ] Waveform visualization works (if implemented)
- [ ] Approval/correction saves successfully
- [ ] Session status updates to `synced`

**Capture Evidence:**
```bash
# Save sync offsets for golden run
curl http://localhost:1337/api/recording-sessions/{session-id} \
  -H "Authorization: Bearer YOUR_JWT" \
  | jq '.data.attributes.syncOffsets_ms' \
  > sync-offsets.json
```

**Troubleshooting:**
- Sync fails → Check backend logs for audio-offset-finder errors
- Confidence always 0 → Audio may not overlap, try different videos
- Approval doesn't save → Check network tab for API errors

---

### Phase 3: Transcript Generation (25 min)

**Objective:** Generate and verify aligned transcript

**Steps:**

1. **Navigate to Transcript Page**
   ```
   From session detail, click: "Generate Transcript"
   OR
   Navigate to: /studio/sessions/{id}/transcript
   ```

2. **Generate Transcript**
   - If no transcript exists, you'll see "No Transcript Yet"
   - Click: "Generate Transcript" button
   - Dialog may appear with options (use defaults)
   - Click "Start Generation"

3. **Monitor Status Transitions** (don't refresh page!)
   - **QUEUED** (appears immediately)
   - **PROCESSING** (polling starts, 2-5s)
   - **RAW_READY** (provider completed, 10-30s)
   - **ALIGNED** (alignment applied, 1-2s)
   - Transcript editor loads automatically

   **Expected timeline:** 15-60 seconds total (depends on video length)

4. **Verify Transcript Loaded**
   - Transcript editor shows segments
   - Speaker labels visible (Speaker A, Speaker B, etc.)
   - Timestamps aligned (check first segment)

5. **Validate Alignment (CRITICAL TEST)**

   **Calculate expected alignment:**
   ```
   Raw transcript time:   5000ms (for example)
   Sync offset (A):       0ms
   Expected aligned time: 5000ms + 0ms = 5000ms

   // For Camera B segment:
   Raw transcript time:   5000ms
   Sync offset (B):       -420ms (example)
   Expected aligned time: 5000ms + (-420ms) = 4580ms
   ```

   **Verify in transcript:**
   - First segment should have `startMs` = raw time + offset
   - Check backend logs for alignment log line:
     ```
     [transcript-service] Applying alignment: angle=A, offset=0ms
     ```

6. **Test Editing Workflow**

   **Edit 3 segments:**
   - Segment 1: Change text (fix typo or add word)
   - Segment 2: Change speaker (dropdown)
   - Segment 3: Change text
   - Verify yellow "Unsaved changes" bar appears
   - Click "Save Changes"
   - Wait for "Saved successfully" message

   **Hard refresh page:**
   ```
   Press: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

   **Verify edits persisted:**
   - [ ] Segment 1 text matches your edit
   - [ ] Segment 2 speaker matches your change
   - [ ] Segment 3 text matches your edit
   - [ ] No segments disappeared
   - [ ] Segment order unchanged

7. **Test Speaker Mapping**
   - Click "Speakers" tab
   - Map "Speaker A" → (select a real author/speaker)
   - Map "Speaker B" → (select another speaker)
   - Switch to "Editor" tab
   - Verify speaker labels updated in segment list

8. **Test Subtitle Export**
   - Click "Subtitles" tab
   - Select "SRT" format
   - Click "Preview" or "Download"
   - Verify download works
   - Open SRT file in text editor

   **Validate SRT format:**
   ```
   1
   00:00:00,000 --> 00:00:05,000
   [Segment text here]

   2
   00:00:05,000 --> 00:00:10,000
   [Next segment text]
   ```

   **Check for errors:**
   - [ ] No negative timestamps (00:00:-00,001)
   - [ ] Sequential numbering (1, 2, 3...)
   - [ ] Timestamps monotonic (each start > previous end)
   - [ ] Format correct (HH:MM:SS,mmm --> HH:MM:SS,mmm)

9. **Test VTT Export**
   - Select "VTT" format
   - Download VTT file
   - Verify format:
     ```
     WEBVTT

     00:00:00.000 --> 00:00:05.000
     [Segment text]
     ```
   - Note: VTT uses dots (.) not commas (,) for milliseconds

**Expected Result:**
- Transcript status: `ALIGNED`
- Segments editable and persist
- Speaker mapping functional
- SRT/VTT exports valid

**Validation:**
- [ ] Status transitions work without page reload
- [ ] Alignment offsets correctly applied
- [ ] Edits save and persist after refresh
- [ ] Speaker mapping updates all views
- [ ] SRT export valid (no errors in format)
- [ ] VTT export valid

**Capture Evidence:**
```bash
# Save transcript ID
echo "TRANSCRIPT_ID: {transcript-id}" > test-session.txt

# Save SRT file for comparison
cp ~/Downloads/export.srt golden-run-export.srt

# Save sync offsets used
echo '{ "A": 0, "B": -420, "C": 1830 }' > syncOffsets_ms.json
```

**Troubleshooting:**
- Status stuck at QUEUED → Check backend logs, cache issue
- Alignment wrong → Check Patch 1 applied (sourceAsset angle lookup)
- Edits lost after refresh → Check Patch 2 applied (full array update)
- Negative timestamps in SRT → Check Patch 4 applied (validation)

---

### Phase 4: EDL Generation & Timeline Editing (30 min)

**Objective:** Generate EDL and test timeline editing

**Steps:**

1. **Navigate to EDL Page**
   ```
   From session detail, click: "Edit Timeline"
   OR
   Navigate to: /studio/sessions/{id}/edl
   ```

2. **Generate EDL**
   - If no EDL exists, you'll see "No EDL Yet"
   - Click: "Generate EDL" button
   - Wait for generation (5-15 seconds)
   - Page should reload automatically (or show timeline)

3. **Verify EDL Generation**

   **Check backend logs:**
   ```
   [edl-generator] Starting EDL generation for session {id}
   [edl-generator] Generating camera cuts for session {id}
   [edl-generator] Generating chapters for session {id}
   [edl-generator] Validating EDL for session {id}
   [edl-generator] EDL generation complete: 47 cuts, 5 chapters, 4230ms avg shot length
   ```

   **Check frontend:**
   - Timeline editor visible
   - Cut blocks displayed on time ruler
   - Cuts colored by camera (blue/green/purple)
   - Chapter markers displayed (if generated)

4. **Validate Camera Switching Logic**

   **Check cut distribution:**
   - At least 2 cameras should be used (ideally all 3)
   - Cuts should correlate with speaker changes (if speakers mapped)
   - Shot lengths between 2-15 seconds (mostly)

   **Verify metrics:**
   - Bottom bar shows: "47 cuts • Avg 4s per shot"
   - Camera usage makes sense (not 100% on one camera)

5. **Test Cut Selection**
   - Click on a cut block in timeline
   - Cut inspector opens on right side
   - Selected cut has white ring + scale effect
   - Cut info displayed (duration, reason, confidence)

6. **Test Camera Change**
   - With cut selected, click different camera button (A/B/C)
   - Cut block color changes immediately
   - "Unsaved changes" indicator appears
   - **Don't save yet**

7. **Test Timing Nudge**

   **Nudge start time:**
   - Click "-500ms" button under "Start Time"
   - Start time decreases by 500ms
   - Cut block position updates on timeline
   - Verify cut doesn't go below 0ms

   **Nudge end time:**
   - Click "+500ms" button under "End Time"
   - End time increases by 500ms
   - Cut block width increases
   - Verify cut doesn't exceed session duration

8. **Test Split Cut**

   **Setup:**
   - Use playhead controls to seek to middle of a cut
   - Ensure playhead (red line) is inside cut boundaries
   - Click "Split at Playhead" in inspector

   **Verify:**
   - Original cut ends at playhead position
   - New cut starts at playhead position
   - Both cuts have same camera
   - Both cuts independently selectable

   **Edge case:**
   - Seek playhead outside cut boundaries
   - Click "Split at Playhead"
   - Should show alert: "Playhead must be within cut boundaries"

9. **Test Delete Cut**
   - Select a cut
   - Click "Delete Cut" button (red)
   - Cut disappears from timeline
   - Inspector closes
   - Cut count decreases

10. **Test Save Changes**
    - Click "Save Changes" button (top right)
    - Wait for save to complete
    - "Unsaved changes" indicator disappears
    - Refresh page (Cmd+Shift+R)
    - Verify all changes persisted

11. **Test Chapter Markers** (if generated)
    - Bottom panel shows chapter buttons
    - Click a chapter button
    - Playhead jumps to chapter timestamp
    - Active chapter highlighted in gold

12. **Test Playback Controls**
    - Click play button (gold circle)
    - Playhead should move (if video preview implemented)
    - Click pause
    - Use seek bar to scrub timeline
    - Use -5s / +5s buttons

13. **Test Reset**
    - Make some edits (don't save)
    - Click "Reset" button
    - Confirm dialog
    - Changes discarded
    - Timeline reverts to last saved state

**Expected Result:**
- EDL generates successfully
- 40-60 cuts created (typical for 5-10 min video)
- 3-7 chapters generated (if working)
- All editing operations functional
- Changes persist after refresh

**Validation:**
- [ ] EDL generation completes without errors
- [ ] Camera cuts visible on timeline
- [ ] Cut selection works
- [ ] Camera switching updates color
- [ ] Timing nudge updates position
- [ ] Split creates two cuts correctly
- [ ] Delete removes cut
- [ ] Save persists changes
- [ ] Reset discards changes
- [ ] Chapter markers clickable (if present)

**Troubleshooting:**
- EDL generation fails → Check backend logs for prerequisites
- No cuts displayed → Check browser console for errors
- Changes don't save → Check network tab for API errors
- Chapter generation fails → Check ANTHROPIC_API_KEY set

---

### Phase 5: Workflow Testing (15 min)

**Objective:** Test approval and lock workflow

**Steps:**

1. **Verify Current Status**
   - EDL status badge shows: "Draft"
   - Bottom bar shows status
   - "Approve EDL" button visible (green)

2. **Test Approve with Unsaved Changes**
   - Make an edit (don't save)
   - Click "Approve EDL"
   - Should show alert: "Please save your changes before approving"
   - Click "Save Changes"
   - Try approve again

3. **Approve EDL**
   - Click "Approve EDL" button
   - Confirm dialog
   - Status changes to "Approved"
   - Badge updates
   - "Lock EDL" button appears (blue)
   - "Approve EDL" button disappears

4. **Test Lock with Unsaved Changes**
   - Make an edit
   - Click "Lock EDL"
   - Should show alert: "Please save your changes before locking"
   - Save changes first

5. **Lock EDL**
   - Click "Lock EDL" button
   - Confirm dialog: "This will prevent further editing"
   - Confirm
   - Status changes to "Locked"
   - Badge updates
   - Both buttons disappear
   - Editing should be disabled (verify can't edit cuts)

6. **Verify Session Status Update**
   - Navigate back to session detail
   - Session status should now show: `rendering`
   - This indicates session is ready for Phase 12 (render pipeline)

**Expected Result:**
- Status flow: draft → approved → locked
- Session status updates to `rendering`
- Locked EDL prevents further editing

**Validation:**
- [ ] Approve requires saved changes
- [ ] Lock requires saved changes
- [ ] Lock requires approved status
- [ ] Locked EDL immutable
- [ ] Session status updates to `rendering`

---

### Phase 6: Export Testing (10 min)

**Objective:** Test EDL export functionality

**Steps:**

1. **Test JSON Export**
   - Click "Export" button (bottom bar)
   - Export menu appears
   - Click "Canonical JSON"
   - File downloads: `session-{id}.json`

2. **Verify JSON Content**
   - Open downloaded JSON in text editor
   - Validate structure:
     ```json
     {
       "success": true,
       "data": {
         "sessionId": "...",
         "edlId": "...",
         "version": 2,
         "status": "locked",
         "canonicalEdl": {
           "schemaVersion": "1.0",
           "sessionId": "...",
           "tracks": {
             "program": [ /* cuts */ ],
             "chapters": [ /* chapters */ ]
           }
         }
       }
     }
     ```
   - [ ] Valid JSON (no syntax errors)
   - [ ] Contains all cuts
   - [ ] Contains chapters (if generated)
   - [ ] Contains metrics

3. **Test FCP XML Export**
   - Click "Export" → "Final Cut Pro XML"
   - File downloads: `session-{id}.fcpxml`
   - Open in text editor
   - **Current status:** Placeholder only
   - Verify it's valid XML (starts with `<?xml`)

4. **Verify Disabled Formats**
   - Export menu shows:
     - Premiere Pro (grayed out, "Coming Soon")
     - DaVinci Resolve (grayed out, "Coming Soon")
   - These should not be clickable

**Expected Result:**
- JSON export downloads and is valid
- FCP XML downloads (placeholder for now)
- Disabled formats show tooltips

**Validation:**
- [ ] JSON export works
- [ ] JSON contains full EDL data
- [ ] FCP XML downloads (even if placeholder)
- [ ] Disabled formats show "Coming Soon"

**Capture Evidence:**
```bash
# Save exports for golden run
cp ~/Downloads/session-{id}.json golden-run-edl.json
cp ~/Downloads/session-{id}.fcpxml golden-run-edl.fcpxml
```

---

## Golden Run Artifact Bundle

**Create golden run folder:**
```bash
cd golden-runs/phase-10
./create-run.sh {your-session-id}
```

**Populate with evidence:**
```
golden-runs/phase-10/2026-02-05-session-{id}/
├── sessionId.txt              # Session ID
├── transcriptId.txt           # Transcript ID
├── syncOffsets_ms.json        # Sync offsets from Phase 9
├── export.srt                 # SRT export from Phase 10
├── export.vtt                 # VTT export from Phase 10
├── edl-export.json            # EDL JSON export from Phase 11
├── edl-export.fcpxml          # FCP XML export (placeholder)
├── screenshot-sync-review.png # Sync review with offsets
├── screenshot-transcript.png  # Transcript editor
├── screenshot-timeline.png    # EDL timeline
├── screenshot-locked.png      # Locked EDL status
└── notes.md                   # Your observations
```

**Fill out notes.md:**
```markdown
# Golden Run Notes

**Date:** 2026-02-05
**Operator:** [Your Name]
**Session ID:** {session-id}
**Transcript ID:** {transcript-id}

## Test Results

| Phase | Result | Notes |
|-------|--------|-------|
| Phase 9: Sync | ✅ PASS | Offsets: A=0, B=-420, C=1830 |
| Phase 10: Transcript | ✅ PASS | 47 segments, alignment correct |
| Phase 11: EDL | ✅ PASS | 52 cuts, 5 chapters |

## Observations

### What Worked Well
- [Your notes]

### Issues Encountered
- [Your notes]

### Edge Cases Discovered
- [Your notes]
```

---

## Automated Testing (Optional)

### API Testing with curl

**Test sync computation:**
```bash
SESSION_ID="your-session-id"
JWT="your-jwt-token"

curl -X POST http://localhost:1337/api/recording-sessions/$SESSION_ID/sync/compute \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  | jq
```

**Test transcript generation:**
```bash
curl -X POST http://localhost:1337/api/recording-sessions/$SESSION_ID/transcript/compute \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"provider":"mock","language":"en"}' \
  | jq
```

**Test EDL generation:**
```bash
curl -X POST http://localhost:1337/api/recording-sessions/$SESSION_ID/edl/generate \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"minShotLengthMs":2000,"maxShotLengthMs":15000}' \
  | jq
```

**Get EDL:**
```bash
curl http://localhost:1337/api/recording-sessions/$SESSION_ID/edl \
  -H "Authorization: Bearer $JWT" \
  | jq '.data.canonicalEdl.tracks.program | length'
```

---

## Common Issues & Solutions

### Issue: Upload Fails

**Symptoms:**
- Upload progress stuck at 0%
- Error message "Upload failed"

**Solutions:**
1. Check file size (must be < 2GB typically)
2. Check file format (MP4, MOV supported)
3. Check network connection
4. Check backend logs for errors
5. Verify S3/R2 credentials configured

---

### Issue: Transcoding Stuck

**Symptoms:**
- Session status stuck at "ingesting"
- Asset cards show "Transcoding..."

**Solutions:**
1. Check backend logs for FFmpeg errors
2. Verify FFmpeg installed: `ffmpeg -version`
3. Check disk space
4. Check worker queue (BullMQ)
5. Restart backend if stuck

---

### Issue: Sync Fails

**Symptoms:**
- Error "Sync computation failed"
- All offsets show 0ms

**Solutions:**
1. Check audio overlap (videos must have overlapping audio)
2. Verify audio tracks exist in videos
3. Check backend logs for audio-offset-finder errors
4. Try different videos with clearer audio

---

### Issue: Transcript Generation Fails

**Symptoms:**
- Status stuck at QUEUED
- Error "Transcript generation failed"

**Solutions:**
1. Check `ANTHROPIC_API_KEY` environment variable set
2. Check API key is valid
3. Check network can reach Anthropic API
4. Check backend logs for provider errors
5. Try with mock provider for testing

---

### Issue: Alignment Incorrect

**Symptoms:**
- Transcript timestamps don't match sync offsets
- Subtitles out of sync with video

**Solutions:**
1. Verify Patch 1 applied (angle-based offset lookup)
2. Check backend logs for alignment log line
3. Verify syncOffsets_ms has correct keys ("A", "B", "C")
4. Verify sourceAsset has angle field populated

---

### Issue: Edits Lost After Refresh

**Symptoms:**
- Save changes, refresh page, edits gone

**Solutions:**
1. Verify Patch 2 applied (full array update)
2. Check network tab - did PUT request succeed?
3. Check backend logs for update errors
4. Check browser console for frontend errors

---

### Issue: EDL Generation Fails

**Symptoms:**
- Error "EDL generation failed"
- No cuts displayed

**Solutions:**
1. Verify session is synced (status = "synced")
2. Verify transcript exists and is aligned
3. Check prerequisites (sync offsets, transcript, assets)
4. Check backend logs for validation errors

---

### Issue: Chapter Generation Fails

**Symptoms:**
- No chapters displayed
- Backend logs show chapter errors

**Solutions:**
1. Check `ANTHROPIC_API_KEY` set
2. Non-blocking - EDL should still generate
3. Check backend logs for AI errors
4. Should fallback to "Section 1", "Section 2", etc.

---

## Success Criteria

### Phase 9 ✅
- [ ] Session created with 3 videos
- [ ] Sync offsets computed
- [ ] Confidence scores displayed
- [ ] Approval/correction saves
- [ ] Session status: `synced`

### Phase 10 ✅
- [ ] Transcript generates successfully
- [ ] Status transitions without refresh
- [ ] Alignment offsets correctly applied
- [ ] Edits save and persist
- [ ] SRT/VTT exports valid

### Phase 11 ✅
- [ ] EDL generates successfully
- [ ] Camera cuts displayed on timeline
- [ ] All editing operations functional
- [ ] Workflow (approve → lock) works
- [ ] JSON export downloads

### Overall ✅
- [ ] Complete workflow: Upload → Sync → Transcript → EDL → Export
- [ ] No data loss at any step
- [ ] All state transitions deterministic
- [ ] Exports are valid and importable
- [ ] Golden run artifacts captured

---

## Next Steps After Testing

**If all tests pass:**
1. ✅ Phase 9-11 validated and production-ready
2. Capture golden run artifacts
3. Document any issues found
4. Proceed to Phase 12 (Render Pipeline) or deploy

**If tests fail:**
1. Document failing test and exact symptom
2. Check which phase failed
3. Review patches applied
4. Check backend logs for errors
5. Fix issue and re-run test

---

## Time Estimates

- **Environment Setup:** 10 min
- **Session Upload:** 15 min (+ transcoding time)
- **Sync Review:** 20 min
- **Transcript:** 25 min
- **EDL & Timeline:** 30 min
- **Workflow:** 15 min
- **Export:** 10 min
- **Documentation:** 15 min

**Total:** 2-3 hours (including transcoding wait time)

---

## Conclusion

This testing guide provides a **comprehensive validation** of the entire multi-camera workflow. By following it step-by-step, you'll:

- Verify all functionality works end-to-end
- Capture evidence for golden run
- Identify any remaining bugs
- Prove production readiness

**Once complete, you'll have a proven, validated system ready for deployment.**

---

**Last Updated:** 2026-02-05
