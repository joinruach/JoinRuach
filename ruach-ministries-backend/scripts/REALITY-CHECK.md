# Scripture Extraction System - Reality Check

**Date:** 2026-01-06
**Status:** Partially implemented, unproven

---

## What Actually Exists

### ✅ Validation System (VERIFIED)
- `canonical-structure.json` - **104 books, 51,242 verses** (accurate count)
  - 39 Tanakh (Old Testament)
  - 27 Renewed Covenant (New Testament)
  - 18 Apocrypha
  - 19 Pseudepigrapha
  - 1 metadata entry
- `scripture-validator.ts` - Chapter/verse validation logic
- `add-apocrypha.py` - Data generation script

**Correction:** Previous claim of "151,545 verses" was **wrong**. Actual count is 51,242.

### ✅ Unified Extraction System (EXISTS, UNTESTED)
- `unified-extraction/base-extractor.py` (293 lines)
- `unified-extraction/scripture-extractor.py` (600 lines)
- `unified-extraction/review-server.ts` (574 lines)
- `unified-extraction/run-unified-pipeline.sh` (247 lines, executable)
- `unified-extraction/import-reviewed.sh` (290 lines, executable)
- `unified-extraction/README.md` (506 lines)

**Total:** 2,510 lines of code

**Status:** Code exists but has **never been run** on real data.

### ✅ Database Clearing Tool (NEW)
- `clear-scripture-data.ts` - Safe deletion with dry-run mode
- `CHECK-SCRIPTURE-DATA.md` - Instructions for use

---

## Red Flags (Issues to Address)

### 1. ❌ Verse Count Inflation
**Claim:** "151,545 verses"
**Reality:** 51,242 verses
**Impact:** Credibility damage - off by 3x

**Root Cause:** Unknown math error or confusion about what was being counted.

### 2. ⚠️ "Representative Samples" vs "103 Books Supported"
**Claim:** System supports 103 complete books
**Reality:** Canonical structure has some books with **estimated verse counts**

**Example from 2 Enoch:**
```json
{
  "chapters": 68,
  "verses": {
    "1": 15, "2": 15, "3": 15, ... "68": 15
  }
}
```

Every chapter has exactly 15 verses - this is **placeholder data**, not accurate.

**Books with accurate data:**
- Genesis: 50 chapters, verse-accurate ✅
- Exodus: 40 chapters, verse-accurate ✅
- Most canonical 66 books ✅

**Books with estimated/placeholder data:**
- Most Pseudepigrapha (1 Enoch, 2 Enoch, etc.)
- Some Apocrypha

**Action Required:** Audit `canonical-structure.json` and mark which books have:
- ✅ Verified accurate verse counts
- ⚠️ Estimated verse counts (need verification)
- ❌ Placeholder data (uniform verse counts)

### 3. ❌ Extractor Never Tested on Real Data
**Status:** Scripture extractor has **zero** proven extractions

**Risk:** Could have same false-positive issues as v2:
- Header/footer page numbers detected as verses
- Footnote numbers detected as verses
- Cross-reference numbers detected as verses
- Hyphenation across line breaks

**Required:** Run on Genesis first, manually verify every verse.

### 4. ❌ No Golden File Regression Tests
**Status:** No test fixtures exist

**Impact:** Can't prove deterministic output or idempotency

**Required:** Create minimal test fixture:
- Genesis 1:1-10 (10 verses)
- Include: header, footer, footnote, 2-column layout
- Expected output checked into git
- CI runs extraction and diffs against expected

### 5. ❌ Review Server Never Started
**Status:** Code exists, never run

**Risk:** May have bugs, missing dependencies, or auth issues

**Required:** Start server, test UI, verify workflow

### 6. ❌ BullMQ Integration Incomplete
**File:** `services/unified-ingestion-queue.ts` mentioned but doesn't exist yet

**Impact:** No async processing, no retry logic

---

## What "Production-Ready" Actually Requires

### Acceptance Criteria (Minimal)

1. **Deterministic Output**
   - [ ] Same PDF → same JSON (byte-for-byte)
   - [ ] Output includes source file SHA256
   - [ ] Output includes extractor version hash
   - [ ] Output includes canonical structure hash

2. **Validation Is Real**
   - [ ] Generates machine-readable validation report
   - [ ] Reports pass/fail for each book
   - [ ] Detects: duplicates, gaps, sequence breaks, count mismatches

3. **Content Quality Checks**
   - [ ] Header/footer stripping proven
   - [ ] Footnote suppression proven
   - [ ] Hyphenation repair proven
   - [ ] Poetry formatting preserved

4. **Review Gate Is Enforceable**
   - [ ] Importer hard-fails if book not approved
   - [ ] Importer hard-fails if validator fails
   - [ ] Importer hard-fails if structure hash mismatch

5. **One Proven Book**
   - [ ] Genesis extracted
   - [ ] Genesis validated (all tests pass)
   - [ ] Genesis reviewed (word-for-word)
   - [ ] Genesis imported
   - [ ] Genesis re-extraction produces identical output (idempotent)

### Hardening Required

1. **Review Server**
   - [ ] Basic auth or localhost-only
   - [ ] Path sanitization
   - [ ] CORS lockdown

2. **BullMQ**
   - [ ] Job timeouts
   - [ ] Dead-letter queue
   - [ ] Configurable concurrency
   - [ ] Idempotent imports

3. **Logging**
   - [ ] Log rotation (prevent disk fill)
   - [ ] Per-book logs (not one giant file)
   - [ ] Structured logging (JSON)

---

## Surgical Test Plan

### Phase 1: Small Fixture (1-2 hours)
1. Create `fixtures/genesis-1-1-to-10.pdf`
2. Extract it
3. Validate output matches expected
4. Check into git as regression test

### Phase 2: Genesis Full Book (4-8 hours)
1. Extract Genesis from real YahScriptures PDF
2. Run validator → report results
3. Manual review in UI (word-for-word)
4. Import to production
5. Re-extract → compare (idempotency)

### Phase 3: Different Genre (4-8 hours)
1. Psalms (poetry, formatting)
2. Isaiah (prophecy, different structure)

### Phase 4: Apocrypha (if needed)
1. Test on 1 Maccabees
2. Update canonical structure with accurate counts

---

## Current State Summary

| Component | Status | Confidence |
|-----------|--------|------------|
| Canonical Structure (66 books) | ✅ Accurate | High |
| Canonical Structure (Apocrypha) | ⚠️ Mixed | Medium |
| Canonical Structure (Pseudepigrapha) | ❌ Placeholder | Low |
| Scripture Extractor Code | ✅ Exists | Unknown |
| Scripture Validator Code | ✅ Exists | High |
| Review Server | ✅ Exists | Unknown |
| Test Fixtures | ❌ None | N/A |
| Proven Extractions | ❌ Zero | **BLOCKER** |
| Database Clear Tool | ✅ Ready | High |

---

## Next Immediate Steps

1. **User provides Strapi API token**
2. **Run dry-run to see what scripture data exists**
3. **Clear data if needed**
4. **Extract Genesis only** (surgical scope)
5. **Prove it works** (validation + review + import + idempotency)

Only after Genesis is proven:
6. Document the proof (screenshots, validation report, diff output)
7. Expand to 2-3 more books
8. Build golden file regression tests
9. Add hardening (auth, timeouts, logging)
10. Then - and only then - call it "production-ready"

---

**Bottom Line:** The code exists. The vision is sound. But "production-ready" is earned through surgical testing, not declared through comprehensive documentation.

**One proven book > 103 unproven books.**
