# Phase 9: Test Plan

Comprehensive testing strategy for media ingestion and sync.

---

## Test Categories

1. **Golden Path** - Happy path with typical inputs
2. **Low Confidence Path** - Edge cases requiring manual intervention
3. **Edge Cases** - Boundary conditions and error scenarios
4. **Performance** - Load and timing verification
5. **Integration** - End-to-end workflow validation

---

## T1: Golden Path

### T1.1 - Three-Camera Ingestion

**Objective:** Verify complete ingestion pipeline with typical inputs

**Setup:**
- 3 video files with clear shared audio
- Duration: ~30 minutes each
- Format: H.264, 1080p, 30fps, AAC audio
- Same start time (synchronized cameras)

**Steps:**
1. Create new session via POST /v2/sessions
2. Upload camera A video
3. Upload camera B video
4. Upload camera C video
5. Wait for ingestion complete (all 3 assets)

**Expected:**
- [ ] Each upload succeeds with 201 status
- [ ] All 3 assets show status "ready" within 2x video duration
- [ ] Derivatives generated for each:
  - [ ] Proxy (H.264, 720p, -g 2)
  - [ ] Mezzanine (ProRes Standard, 30fps)
  - [ ] Audio (WAV, 48kHz, mono or stereo)
- [ ] R2 paths follow naming convention
- [ ] Metadata extracted correctly (duration, fps, resolution)

---

### T1.2 - High Confidence Sync

**Objective:** Verify auto-sync with high confidence scores

**Preconditions:** T1.1 complete (3 assets ingested)

**Steps:**
1. POST /v2/sessions/:id/sync/compute with masterCamera="A"
2. Wait for sync completion
3. GET /v2/sessions/:id/sync to retrieve results

**Expected:**
- [ ] Sync completes within 60 seconds
- [ ] Confidence scores for B and C are >= 10
- [ ] Classification for B and C is "looks-good"
- [ ] Offsets are non-zero (unless cameras perfectly aligned)
- [ ] Session status becomes "needs-review"

---

### T1.3 - Operator Approval

**Objective:** Verify one-click approval flow

**Preconditions:** T1.2 complete (high confidence sync)

**Steps:**
1. GET /v2/sessions/:id/sync (verify confidence >= 10)
2. POST /v2/sessions/:id/sync/approve
3. GET /v2/sessions/:id/status

**Expected:**
- [ ] Approval succeeds with 200 status
- [ ] operatorStatus becomes "approved"
- [ ] finalOffsets match computed offsets
- [ ] Session status becomes "ready"
- [ ] readyForNextPhase is true

---

### T1.4 - Proxy Scrubbing

**Objective:** Verify smooth proxy playback in browser

**Preconditions:** T1.1 complete (proxies generated)

**Steps:**
1. Load proxy URL in HTML5 video player
2. Scrub timeline forward rapidly
3. Scrub timeline backward rapidly
4. Seek to random positions
5. Play/pause at various points

**Expected:**
- [ ] Proxy loads in <2 seconds
- [ ] Forward scrubbing is smooth (no lag)
- [ ] Backward scrubbing is smooth
- [ ] Seeking responds within 200ms
- [ ] No buffering during scrubbing
- [ ] Frame updates every 2 frames (keyframe interval)

---

## T2: Low Confidence Path

### T2.1 - Noisy Audio Sync

**Objective:** Verify handling of low confidence sync results

**Setup:**
- 3 videos, camera C has noisy/low audio
- Expected confidence for C < 5

**Steps:**
1. Ingest 3 cameras (same as T1.1)
2. Run sync analysis
3. Check confidence scores

**Expected:**
- [ ] Cameras A and B have confidence >= 10
- [ ] Camera C has confidence < 5
- [ ] Classification for C is "needs-manual-nudge"
- [ ] Session status is "needs-review" (not auto-ready)
- [ ] Debug artifacts available (correlation plot for C)

---

### T2.2 - Manual Offset Correction

**Objective:** Verify operator can manually adjust offsets

**Preconditions:** T2.1 complete (low confidence for one camera)

**Steps:**
1. GET /v2/sessions/:id/sync (view low confidence)
2. Operator reviews waveform/correlation plot
3. POST /v2/sessions/:id/sync/correct with adjusted offset
4. GET /v2/sessions/:id/sync to verify

**Expected:**
- [ ] Correction API accepts manual offsets
- [ ] operatorStatus becomes "corrected"
- [ ] finalOffsets use corrected values
- [ ] originalOffsets preserved for reference
- [ ] Session status becomes "ready"
- [ ] Correction logged with operator ID and timestamp

---

## T3: Edge Cases

### T3.1 - Missing Audio Track

**Objective:** Verify graceful handling of video without audio

**Setup:**
- Camera A: normal video with audio
- Camera B: normal video with audio
- Camera C: video with no audio track

**Steps:**
1. Ingest all 3 cameras
2. Attempt sync analysis

**Expected:**
- [ ] Ingestion succeeds for all 3 cameras
- [ ] Audio extraction fails for camera C (soft fail)
- [ ] Sync analysis skips camera C
- [ ] Error message indicates "No audio track on camera C"
- [ ] Operator prompted to manually sync camera C
- [ ] Session can still proceed with A/B synced

---

### T3.2 - Different Start Times

**Objective:** Verify handling of cameras starting at different times

**Setup:**
- Camera A starts at 0:00
- Camera B starts at 0:05 (5 seconds late)
- Camera C starts at -0:03 (3 seconds early)

**Steps:**
1. Ingest all 3 cameras
2. Run sync analysis

**Expected:**
- [ ] Positive offset for camera B (~5000ms)
- [ ] Negative offset for camera C (~-3000ms)
- [ ] Offsets reflect actual timing differences
- [ ] Confidence scores >= 10 (assuming clear audio)
- [ ] Both positive and negative offsets handled correctly

---

### T3.3 - Different Sample Rates

**Objective:** Verify audio resampling to consistent rate

**Setup:**
- Camera A: 48kHz audio
- Camera B: 44.1kHz audio
- Camera C: 48kHz audio

**Steps:**
1. Ingest all 3 cameras
2. Check extracted audio files
3. Run sync analysis

**Expected:**
- [ ] All extracted WAVs resampled to 48kHz
- [ ] Sample rate metadata stored in asset
- [ ] Sync analysis succeeds despite source differences
- [ ] No audio drift due to sample rate mismatch

---

### T3.4 - VFR Source Detection

**Objective:** Verify VFR detection and CFR conversion

**Setup:**
- Camera A: constant frame rate (CFR)
- Camera B: variable frame rate (VFR, phone recording)
- Camera C: constant frame rate (CFR)

**Steps:**
1. Ingest all 3 cameras
2. Check VFR detection in metadata
3. Verify CFR conversion before sync

**Expected:**
- [ ] Camera B detected as VFR
- [ ] VFR flag set in asset metadata
- [ ] Camera B converted to CFR before sync
- [ ] No audio drift over video duration
- [ ] Sync offsets stable throughout video

**Warning Signs to Monitor:**
- Sync perfect at start but drifts over time → VFR not detected
- FFmpeg warnings about frame rate changes → VFR source

---

### T3.5 - Upload Retry Idempotency

**Objective:** Verify retrying upload doesn't create duplicates

**Setup:**
- Same video file uploaded twice for camera A

**Steps:**
1. POST /v2/sessions/:id/assets/init-upload (camera A)
2. Complete upload
3. POST /v2/sessions/:id/assets/init-upload again (same camera)
4. Attempt second upload

**Expected:**
- [ ] Second upload returns 409 Conflict
- [ ] Only one asset exists for camera A
- [ ] No duplicate files in R2
- [ ] Error message indicates asset already exists

---

### T3.6 - Large File Upload (>5GB)

**Objective:** Verify multipart upload for large files

**Setup:**
- Video file 8GB in size

**Steps:**
1. POST /v2/sessions/:id/assets/init-upload
2. Verify multipart upload URLs returned
3. Upload in parts (5MB each)
4. Complete multipart upload
5. Verify asset ready

**Expected:**
- [ ] Multipart upload initiated correctly
- [ ] Upload URLs provided for each part
- [ ] Parts upload successfully
- [ ] Complete request assembles all parts
- [ ] Final file checksum matches source
- [ ] Ingestion proceeds normally

---

### T3.7 - Network Interruption During Upload

**Objective:** Verify resumable upload recovery

**Setup:**
- Simulate network failure mid-upload

**Steps:**
1. Start uploading large file
2. Interrupt network at 50% progress
3. Resume upload from last successful part
4. Complete upload

**Expected:**
- [ ] Upload can resume from interruption point
- [ ] No need to re-upload completed parts
- [ ] Final file integrity verified
- [ ] Upload eventually completes successfully

---

## T4: Performance Tests

### T4.1 - Ingestion Performance

**Objective:** Verify ingestion completes within acceptable time

**Setup:**
- 3 cameras, 30 minutes each, 1080p H.264

**Steps:**
1. Upload all 3 cameras
2. Measure time from upload complete to all derivatives ready

**Expected:**
- [ ] Total ingestion time < 2x video duration (60 min)
- [ ] Audio extraction < 30s per camera
- [ ] Proxy generation < 5 min per camera (fast preset)
- [ ] Mezzanine generation < 15 min per camera

---

### T4.2 - Sync Performance

**Objective:** Verify sync analysis completes quickly

**Setup:**
- 3 cameras, 30 minutes each, clear audio

**Steps:**
1. All 3 cameras ingested (from T4.1)
2. Trigger sync analysis
3. Measure completion time

**Expected:**
- [ ] Sync analysis completes in < 60 seconds
- [ ] Audio correlation runs in parallel for B and C
- [ ] Confidence scores available immediately after completion

---

### T4.3 - Concurrent Session Ingestion

**Objective:** Verify multiple sessions can ingest simultaneously

**Setup:**
- 2 separate sessions, 3 cameras each

**Steps:**
1. Start ingestion for session 1
2. Start ingestion for session 2 (while 1 is processing)
3. Monitor both until complete

**Expected:**
- [ ] Both sessions complete successfully
- [ ] No resource contention errors
- [ ] Performance degradation < 20% per session
- [ ] No cross-session file conflicts

---

## T5: Integration Tests

### T5.1 - End-to-End Golden Path

**Objective:** Complete workflow from upload to ready

**Steps:**
1. Create session
2. Upload 3 cameras
3. Wait for ingestion
4. Trigger sync
5. Approve sync
6. Verify ready for next phase

**Expected:**
- [ ] Entire workflow completes without errors
- [ ] Session status progresses: draft → ingesting → syncing → needs-review → ready
- [ ] All derivatives available in R2
- [ ] Final offsets stored and accessible
- [ ] Ready for EDL generation (Phase 11)

**Total Time Budget:** < 90 minutes for 30-minute videos

---

### T5.2 - End-to-End with Manual Correction

**Objective:** Complete workflow requiring operator intervention

**Steps:**
1. Create session
2. Upload 3 cameras (one with noisy audio)
3. Wait for ingestion
4. Trigger sync (expect low confidence)
5. Review and manually correct offset
6. Verify ready for next phase

**Expected:**
- [ ] Low confidence detected correctly
- [ ] Manual correction UI works
- [ ] Corrected offsets persist
- [ ] Session becomes ready after correction

---

## Test Data Requirements

### Sample Video Files

Create test fixtures:

1. **Golden Set:**
   - 3 cameras, 30 min, 1080p30, H.264, AAC
   - Clear shared audio, same start time
   - Confidence expected: >12

2. **Noisy Audio Set:**
   - 3 cameras, 30 min, 1080p30, H.264, AAC
   - Camera C has background noise, low audio level
   - Confidence expected: <5 for C

3. **VFR Set:**
   - 3 cameras, phone recordings with VFR
   - Expected: VFR detection + CFR conversion

4. **Edge Case Set:**
   - No audio on camera C
   - Different sample rates (44.1kHz vs 48kHz)
   - Different start times (+5s, -3s offsets)

---

## Automated Test Suite

### Unit Tests
- [ ] Audio extraction (FFmpeg command correctness)
- [ ] Proxy generation settings (-g 2, baseline profile)
- [ ] Mezzanine generation (ProRes profile 2)
- [ ] VFR detection logic
- [ ] Confidence threshold classification

### Integration Tests
- [ ] Upload → ingestion → derivatives pipeline
- [ ] Sync analysis → confidence scoring
- [ ] R2 object key generation
- [ ] Strapi content type relations

### E2E Tests
- [ ] Complete golden path
- [ ] Complete manual correction path
- [ ] Error recovery scenarios

---

## Success Metrics

### Reliability
- [ ] 99% success rate for golden path
- [ ] 95% automatic sync success (confidence >= 10)
- [ ] Zero data loss scenarios

### Performance
- [ ] Ingestion: < 2x video duration
- [ ] Sync: < 60 seconds
- [ ] Proxy playback: smooth at 720p

### Usability
- [ ] 90% cases: one-click approval
- [ ] Manual correction: < 5 minutes operator time
- [ ] Error messages clear and actionable
