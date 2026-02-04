# Phase 9: Acceptance Criteria

## Ingestion

- [ ] Upload 3 videos (cameras A/B/C) succeeds with resumable upload
- [ ] Each asset generates:
  - [ ] Original stored in R2 at deterministic path
  - [ ] Mezzanine (ProRes Standard, 30fps)
  - [ ] Proxy (H.264 baseline, -g 2, 720p)
  - [ ] Extracted audio (WAV, mono or stereo, 48kHz)
  - [ ] Metadata (duration, fps, resolution, codec)
- [ ] Upload pipeline is idempotent (retries don't create duplicates)
- [ ] Multipart upload works for files >5GB

## Sync

- [ ] System produces time offsets for each camera relative to master audio
- [ ] Confidence scores calculated for each non-master camera
- [ ] Confidence thresholds implemented:
  - [ ] >= 10: "Looks Good" (auto-approve flow)
  - [ ] 5-10: "Review Suggested" (manual confirmation)
  - [ ] < 5: "Needs Manual Nudge" (waveform + manual adjustment)
- [ ] VFR sources detected and converted to CFR before sync
- [ ] Sync results are deterministic (same inputs = same outputs)

## Preview

- [ ] Proxy scrubbing is smooth (no lag when dragging timeline)
- [ ] Proxies load quickly in browser (<2s for 30min video)
- [ ] Scrubbing works in both directions (forward/backward)
- [ ] Frame seeking is responsive (keyframe every 2 frames)

## Operator Workflow

- [ ] Operator can see sync results with confidence scores in < 30 seconds
- [ ] High confidence path: One-click "Looks Good" approval
- [ ] Low confidence path: Manual offset nudge UI available
- [ ] Manual adjustments persist as `operatorOffsetsMs`
- [ ] Final offsets available for downstream phases (EDL, rendering)

## Storage & Cost

- [ ] R2 paths are deterministic and stable
- [ ] Naming convention follows: `{projectId}/{YYYYMMDD}/{assetType}s/{filename}`
- [ ] No spaces in object keys (alphanumeric + underscore/dash only)
- [ ] Lifecycle policies defined:
  - [ ] Originals: long-term retention
  - [ ] Mezzanines: medium-term or project-scoped
  - [ ] Proxies: long-term (cheap, enables UI)
  - [ ] Audio WAVs: medium-term (regenerate on demand)

## Data Model (Strapi)

- [ ] Content types exist and support:
  - [ ] `recording-session` - Session metadata, status tracking
  - [ ] `media-asset` - Camera label, original file, metadata
  - [ ] `derived-media` - Mezzanine, proxy, audio, waveform
  - [ ] `sync-result` - Master camera, offsets, confidence, operator status
- [ ] Relations work correctly:
  - [ ] Session has many assets
  - [ ] Asset has many derived media
  - [ ] Session has one sync result
- [ ] Session status transitions:
  - [ ] draft → ingesting → syncing → needs-review → ready

## Error Handling

- [ ] Missing audio track on camera → soft-fail that camera, require manual
- [ ] Different start times (late start) → positive/negative offsets handled
- [ ] Different sample rates → automatic resampling to 48kHz
- [ ] Network interruption during upload → resumable upload recovers
- [ ] Sync failure → detailed error message, debug artifacts available

## Performance

- [ ] Ingestion completes within 2x video duration for 3 cameras
- [ ] Audio extraction completes in <30s per 30min video
- [ ] Sync analysis completes in <60s for 3x30min videos
- [ ] Proxy generation completes in <5min per 30min video (fast preset)

## Testing

- [ ] **Golden path test:** 3 clear audio sources → confidence >= 10 → approve
- [ ] **Low confidence test:** Noisy audio → confidence < 5 → manual nudge
- [ ] **Edge case tests:**
  - [ ] Missing audio track
  - [ ] Different start times
  - [ ] Different sample rates
  - [ ] VFR source
  - [ ] Retry idempotency

## Definition of Done

Phase 9 is complete when:

- [ ] 3-camera session can be ingested end-to-end
- [ ] Proxies available for operator preview
- [ ] Sync offsets + confidence produced and persisted
- [ ] Operator can approve or correct offsets
- [ ] Final offsets stored in stable location for Phase 10/11 consumption
- [ ] All acceptance criteria above are met
- [ ] Code committed with proper git history
- [ ] Phase 9 summary document created

## Manual Verification Steps

1. **Start session:**
   - Create new session in Strapi
   - Note session ID

2. **Upload 3 videos:**
   - Use API or UI to upload camera A, B, C
   - Verify resumable upload works (pause/resume one upload)

3. **Check ingestion:**
   - Verify all 3 assets appear in Strapi
   - Check R2 for original files at correct paths
   - Verify derived media generated (mezzanine, proxy, audio)

4. **Run sync:**
   - Trigger sync analysis
   - Check sync result in Strapi
   - Verify offsets and confidence scores present

5. **Operator review:**
   - Load sync review UI
   - Verify confidence scores display correctly
   - Test "Looks Good" approval flow
   - Test manual offset nudge (if low confidence)

6. **Preview:**
   - Load proxy in video player
   - Scrub timeline forward/backward
   - Verify smooth playback (no lag)

7. **Verify final state:**
   - Check session status = "ready"
   - Verify final offsets available in sync-result
   - Confirm all files in R2 with correct naming
