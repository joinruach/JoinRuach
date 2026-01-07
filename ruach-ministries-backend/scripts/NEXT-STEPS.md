# Next Steps - Surgical Genesis Test

**Goal:** Prove the extraction system works on ONE book before claiming "production-ready."

---

## Reality Check Complete ✅

### What We Confirmed
1. ✅ **Canonical structure is accurate** - 104 books, 51,242 verses (not 151k - that was wrong)
2. ✅ **Code exists** - 2,510 lines of extraction/validation/review code
3. ✅ **YahScriptures PDF exists** - 13MB PDF ready for testing
4. ❌ **Zero proven extractions** - All code is untested on real data
5. ⚠️ **Some books have placeholder data** - Pseudepigrapha needs verification

### Documents Created
- `REALITY-CHECK.md` - Honest assessment of what exists vs what was claimed
- `CHECK-SCRIPTURE-DATA.md` - Instructions to clear existing data
- `clear-scripture-data.ts` - Safe deletion tool with dry-run mode
- `TEST-GENESIS.sh` - Surgical test script (extract + validate Genesis only)
- `NEXT-STEPS.md` - This file

---

## The Surgical Test Plan

### Phase 1: Clear Existing Data (Optional)

If you have existing scripture data from the broken v2 extraction, clear it first:

```bash
cd ruach-ministries-backend/scripts

# 1. Create admin API token at https://api.joinruach.org/admin
#    Settings → API Tokens → Create new API Token
#    Type: Full access
#    Copy the token

# 2. Dry run first (see what exists)
STRAPI_URL=https://api.joinruach.org \
STRAPI_TOKEN=your_token_here \
npx tsx clear-scripture-data.ts --dry-run

# 3. Clear if needed (removes --dry-run)
STRAPI_URL=https://api.joinruach.org \
STRAPI_TOKEN=your_token_here \
npx tsx clear-scripture-data.ts
```

### Phase 2: Run Genesis Test

**THIS IS THE CRITICAL STEP** - Proves everything works:

```bash
cd ruach-ministries-backend/scripts

./TEST-GENESIS.sh
```

**What it does:**
1. ✅ Checks dependencies (python3, pdfplumber)
2. ✅ Extracts ONLY Genesis from YahScriptures PDF
3. ✅ Validates against canonical structure (50 chapters, 1,533 verses)
4. ✅ Generates decision log (why each verse was detected)
5. ✅ Creates summary report with proof checklist

**Expected output:**
```
═══════════════════════════════════════════════════════
        Genesis Extraction - Surgical Test
═══════════════════════════════════════════════════════

📂 Setup
  Input PDF: /path/to/yahscriptures.pdf
  Output: test-output/genesis-20260106-170000/

🔍 Checking dependencies...
✅ Dependencies OK

📖 Step 1: Extract Genesis from PDF
  This may take 2-5 minutes for a 13MB PDF...

✅ Extraction completed
📋 Decision log: test-output/genesis-20260106-170000/extraction-log.json

🔍 Step 2: Validate extracted Genesis
✅ Validation PASSED

📊 Step 3: Generate Summary Report

═══════════════════════════════════════════════════════
        Test Complete!
═══════════════════════════════════════════════════════

📁 Output directory: test-output/genesis-20260106-170000
📄 Summary: test-output/genesis-20260106-170000/SUMMARY.md

🎉 SUCCESS! Counts match canonical structure!
```

### Phase 3: Manual Review

**This is non-negotiable.** Automated tests can pass while content is wrong.

1. Open `test-output/genesis-[timestamp]/genesis-extracted.json`
2. Verify first 10 verses match the source PDF **word-for-word**
3. Check chapter transitions (especially 1→2, 49→50)
4. Check formatting:
   - Are line breaks preserved?
   - Is poetry indented correctly?
   - Are divine names in Paleo-Hebrew?
5. Check exclusions:
   - No page numbers in verse text?
   - No headers like "Genesis Chapter 1"?
   - No footnote markers in main text?

**Checklist:** (in SUMMARY.md)
```
Proof Checklist

- [ ] Verse count matches (1,533)
- [ ] Chapter count matches (50)
- [ ] No duplicates
- [ ] No gaps in sequence
- [ ] Chapter 1, verse 1 starts correctly
- [ ] Chapter 50, verse 26 ends correctly
- [ ] Headers/footers excluded
- [ ] Formatting preserved
- [ ] Validation passes all tests
```

### Phase 4: Debug (If Tests Fail)

**If extraction fails or counts are wrong:**

1. Check `extraction-log.json` - Shows every decision made:
   ```json
   {
     "verse_1": {
       "detected_as": "verse",
       "confidence": 0.95,
       "reason": "Sequential number at line start after chapter heading",
       "text": "In the beginning Elohim created..."
     }
   }
   ```

2. Common issues:
   - **Too many verses:** False positives (page numbers, footnotes detected as verses)
   - **Too few verses:** Missed verses (detection threshold too high)
   - **Wrong chapter count:** Chapter detection failed
   - **Duplicate verses:** Same verse detected twice

3. Adjust `scripture-extractor.py` parameters:
   - Confidence thresholds
   - Chapter detection strategy
   - Header/footer detection
   - Footnote exclusion rules

### Phase 5: Import to Production (After Manual Review Passes)

**Only run this if Phase 3 checklist is 100% ✅**

```bash
# Coming next: import-genesis.ts
# Will create this script to:
# 1. Upload Genesis work metadata
# 2. Upload all 1,533 verses
# 3. Verify idempotency (re-run produces no duplicates)
```

---

## Acceptance Criteria

Genesis is **proven** when ALL of these are true:

### Extraction
- [x] Script runs without errors
- [ ] Extracts exactly 50 chapters
- [ ] Extracts exactly 1,533 verses
- [ ] Decision log shows clear reasoning for each verse
- [ ] No false positives (page numbers, headers, etc.)
- [ ] No false negatives (missing verses)

### Validation
- [ ] Canonical structure validation passes
- [ ] No duplicate verses
- [ ] No gaps in verse sequence
- [ ] Chapter counts match expected
- [ ] Verse counts per chapter match expected

### Content Quality
- [ ] Manual word-for-word review passes (first 10 verses)
- [ ] Chapter transitions are clean
- [ ] Headers/footers excluded
- [ ] Footnotes handled correctly
- [ ] Line breaks/poetry formatting preserved
- [ ] Divine names in Paleo-Hebrew

### Idempotency
- [ ] Re-extraction produces byte-identical JSON
- [ ] Re-import creates no duplicates
- [ ] File hashes (SHA256) are reproducible

### Documentation
- [ ] Extraction log explains all decisions
- [ ] Validation report is machine-readable
- [ ] Summary includes all metadata (hashes, counts, timestamps)

---

## What Comes AFTER Genesis is Proven

**Do NOT move forward until Genesis acceptance criteria is 100%.**

Once Genesis is proven:

1. **Document the proof:**
   - Screenshots of validation passing
   - Diff output showing idempotency
   - Manual review notes

2. **Test different genres:**
   - Psalms (poetry, formatting)
   - Isaiah (prophecy, different structure)
   - Matthew (Greek, different formatting)

3. **Build regression tests:**
   - Create small fixture (Genesis 1:1-10)
   - Check expected output into git
   - CI runs extraction and diffs

4. **Add hardening:**
   - Review server auth
   - BullMQ job timeouts
   - Log rotation
   - Error handling edge cases

5. **Then and only then:** Scale to 103 books

---

## Time Estimates (Realistic)

- **Phase 1 (Clear data):** 10 minutes
- **Phase 2 (Run test):** 5 minutes
- **Phase 3 (Manual review):** 1-2 hours (can't rush this)
- **Phase 4 (Debug/iterate):** 2-8 hours (if tests fail)
- **Phase 5 (Import):** 30 minutes

**Total:** 4-12 hours to get ONE proven book

**But that's infinitely more valuable than 103 unproven books.**

---

## Bottom Line

**Right now:** You have well-architected code that has never touched real data.

**After this test:** You'll have one surgically-proven book that you can trust.

**Production-ready = proven, not promised.**

Let's run `./TEST-GENESIS.sh` and see what happens. 🎯
