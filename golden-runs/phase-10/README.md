# Phase 10 Golden Run Protocol

This directory contains the infrastructure for validating Phase 10 and creating regression test artifacts.

---

## Quick Start

### 1. Prepare Environment

```bash
# Terminal 1: Start Strapi backend
cd ruach-ministries-backend
pnpm dev

# Terminal 2: Start Next.js frontend  
cd apps/ruach-next
pnpm dev

# Terminal 3: Ensure Redis is running (if using BullMQ)
redis-server
```

### 2. Verify Pre-flight Conditions

You need a session that:
- Has status `synced` or `editing`
- Has `syncOffsets_ms` populated (e.g., `{ "A": 1830, "B": -420, "C": 0 }`)
- Has `sourceAssetId` pointing to master audio asset
- Master asset has `angle` field set (A/B/C)

**Find a suitable session:**
```bash
# In Strapi admin or via API:
GET /api/recording-sessions?filters[status][$eq]=synced&populate=assets
```

### 3. Create Golden Run Folder

```bash
cd golden-runs/phase-10
./create-run.sh <session-id>
```

This creates a timestamped folder like:
```
2026-02-05-session-abc-123/
├── sessionId.txt
├── transcriptId.txt
├── syncOffsets_ms.json
├── export.srt
├── export.vtt
├── notes.md
└── (add screenshots and recordings here)
```

### 4. Run the Tests

Open `GOLDEN_RUN_CHECKLIST.md` and work through all 5 tests:

1. **Happy Path** - Status transitions
2. **Alignment Correctness** ⭐ - The critical test
3. **Editing + Persistence** - Save/reload
4. **Speaker Mapping** - Name propagation
5. **Export Validity** - SRT/VTT compliance

### 5. Capture Artifacts

As you complete each test, save artifacts to the run folder:
- Screenshots (status, edits before/after, speaker mapping)
- Exported SRT/VTT files
- 20s screen recording of subtitle sync proof
- syncOffsets_ms.json from session record
- Fill out notes.md

---

## What Makes This a "Golden Run"

A golden run proves:
1. All 5 tests pass
2. Visual/audio sync is accurate (Test 2)
3. Artifacts are captured for regression testing

**Once you have a golden run:**
- ✅ Phase 10 is validated
- ✅ You can proceed to Phase 11
- ✅ You have a regression test baseline forever

---

## Regression Testing

Future changes can be validated against a golden run:

```bash
# Use same session ID from golden run
# Regenerate transcript
# Compare exports:
diff golden-runs/phase-10/2026-02-05-session-abc-123/export.srt \
     new-test-run/export.srt

# Verify sync still accurate (visual check)
```

---

## If Tests Fail

**Do NOT proceed to Phase 11.**

1. Note which test failed
2. Note the exact symptom
3. Check `/docs/phase-10-patches-applied.md` for common failure modes
4. Apply targeted fix
5. Re-run golden run

**Common Failure Patterns:**

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Status stuck at QUEUED | Polling not working / cache issue | Check cache control patches |
| Alignment off by exact sync offset | Offset lookup bug | Check Patch 1 applied correctly |
| All edits lost after refresh | Segment corruption | Check Patch 2 applied |
| Negative timestamps in SRT | Validation not applied | Check Patch 4 applied |

---

## Files in This Directory

```
phase-10/
├── README.md                    # This file
├── GOLDEN_RUN_CHECKLIST.md      # Step-by-step test protocol
├── TEMPLATE_notes.md            # Template for notes
├── create-run.sh                # Helper script to create run folder
└── YYYY-MM-DD-session-*/        # Completed golden run folders
    ├── sessionId.txt
    ├── transcriptId.txt
    ├── syncOffsets_ms.json
    ├── export.srt
    ├── export.vtt
    ├── screenproof-20s.mov
    ├── screenshot-*.png
    └── notes.md
```

---

## Contact / Questions

If you encounter issues during golden run:
1. Check `/docs/phase-10-patches-applied.md` for fixes
2. Check backend logs for alignment offset log line
3. Check browser DevTools Network tab for API responses

---

**"Measure twice, cut once. Prove once, trust forever."**
