# Scripture Extractor v3 - Root Cause Fixes

## Overview

Version 3 of the scripture extractor addresses critical quality issues identified in Genesis extraction:
- Missing Genesis 1:1 (first verse)
- Missing Genesis 50:26 (last verse)  
- 149 duplicate verses
- Only 42/50 chapters detected

## Root Cause Analysis

### Issue 1: Genesis 1:1 Missing

**Root Cause**: Extractor required book header detection before processing verses. If verse 1:1 appeared before the "Genesis" header was detected, it was skipped.

**Fix**: 
- Implemented "verse marker wins" rule - lines with verse markers are never filtered
- Verse marker detection happens BEFORE book header requirement
- If chapter is 0 and verse 1 is detected, automatically set chapter to 1

### Issue 2: Duplicates (149 detected)

**Root Cause**: 
- No deduplication logic
- Same verse could be extracted multiple times from headers/footers
- Page boundaries caused re-anchoring and re-emitting

**Fix**:
- Deduplication with reconciliation in `_flush_verse()`
- Keeps best version based on:
  1. Longer text length
  2. Fewer header-like tokens
  3. Higher confidence score
- Alternative versions stored in `alternative_texts` for audit

### Issue 3: Missing Chapters (42/50)

**Root Cause**: Chapter markers weren't consistently formatted or detected.

**Fix**:
- Chapter inference fallback - when verse resets to 1 and we're far from last chapter marker, infer new chapter
- Automatic chapter 1 detection when verse 1:1 is found before chapter marker

### Issue 4: Missing Verses (405 total)

**Root Cause**: Single-pass parsing meant one bad detection could lose data permanently.

**Fix**:
- **2-pass parsing architecture**:
  - **Pass 1**: Tokenize lines → detect anchors (book, chapter, verse markers) without committing
  - **Pass 2**: Assemble verses with state machine, maintains context across boundaries

## Architecture Changes

### 2-Pass Parse

**Pass 1: Tokenize** (`pass1_tokenize()`)
```python
# Collects all potential tokens:
- BOOK_HEADER tokens
- CHAPTER_MARKER tokens  
- VERSE_MARKER tokens (checked FIRST - verse marker wins)
- TEXT tokens
```

**Pass 2: Assemble** (`pass2_assemble()`)
```python
# State machine with:
- current_book
- current_chapter  
- last_verse_num
- text_buffer
- lines_since_chapter (for inference)
```

### Verse Marker Wins Rule

```python
def has_verse_marker(text: str) -> Optional[Tuple[int, str]]:
    """Returns (verse_num, text) if verse marker found"""
    # Patterns checked:
    # - ^(\d{1,3})\s+  (e.g., "1 In the beginning...")
    # - ^(\d{1,3})[:.]\s+  (e.g., "1: In..." or "1. In...")
    # - ^\(?(\d{1,3})\)?\s+  (e.g., "(1) In...")
```

**Critical**: This check runs BEFORE any filtering logic.

### Chapter Inference

```python
# If verse == 1 and last_verse >= 20 and lines_since_chapter > 50:
#   → Infer new chapter
if verse_num == 1 and last_verse_num >= 20 and lines_since_chapter > 50:
    self.current_chapter += 1
```

### Deduplication Reconciliation

```python
# When same (chapter, verse) appears twice:
if key in self.verse_candidates:
    existing = self.verse_candidates[key]
    
    # Compare:
    # - Text length (longer = better)
    # - Header-like tokens (fewer = better)
    
    if new_version_is_better:
        existing.alternative_texts.append(existing.text)
        existing.text = new_text  # Replace
    else:
        existing.alternative_texts.append(new_text)  # Keep existing
```

## Validation Gates

Automated validation that **must pass** before import:

### Hard Fails (Exit Code 1):
1. ✅ Genesis 1:1 missing
2. ✅ Last verse missing  
3. ✅ Duplicates detected
4. ✅ Chapter count < 80% of expected
5. ✅ Verse count < 80% of expected

### Warnings (Exit Code 2):
- Verse count 80-90% of expected
- Chapter count slightly low

### Implementation

**Script**: `validation-gate.py`

**Usage**:
```bash
python3 validation-gate.py output/main/works.json output/main/
```

**Integration**: Called automatically by extractor in `validate()` method

## Files Created

1. **`scripture-extractor-v3.py`**
   - 2-pass extraction
   - Verse marker wins rule
   - Chapter inference
   - Deduplication reconciliation

2. **`validation-gate.py`**
   - Standalone validation script
   - Hard fail gates
   - Quality metrics

3. **`apply-patches.py`** (Future use only)
   - Applies manual verse corrections
   - Patches stored separately for traceability
   - Only use after extractor is stable

## Testing

### Run Genesis Test

```bash
cd ruach-ministries-backend
bash scripts/TEST-GENESIS.sh
```

**Expected Output**:
- ✅ Genesis 1:1 present
- ✅ Genesis 50:26 present
- ✅ 50 chapters found
- ✅ ~1,533 verses found
- ✅ 0 duplicates
- ✅ Validation gate passes

### Manual Verification

```bash
# Check specific verses
jq '.[] | select(.work == "yah-gen" and .chapter == 1 and .verse == 1)' \
   scripts/scripture-extraction/output/main/verses_chunk_*.json

# Run analysis
node scripts/scripture-extraction/analyze-genesis.js
```

## Migration Path

1. **Test v3 extractor** on Genesis only
2. **Validate results** pass all gates
3. **Replace** `scripture-extractor.py` with v3
4. **Re-run full extraction** on all 103 books
5. **Use patches** only if absolutely necessary (trace separately)

## Patch Script (Last Resort)

**⚠️  Only use after extractor is fixed and stable**

```bash
# Create patch file
cat > patches/genesis-missing.json << EOF
{
  "patches": [
    {
      "verseId": "yah-gen-001-001",
      "chapter": 1,
      "verse": 1,
      "text": "In the beginning Elohim created...",
      "source": "manual_verification",
      "reason": "Extractor missed due to header formatting",
      "timestamp": "2026-01-06T...",
      "verified_by": "Marc Seals"
    }
  ]
}
EOF

# Apply patches
python3 scripts/scripture-extraction/apply-patches.py \
  patches/genesis-missing.json \
  scripts/scripture-extraction/output/main/ \
  yah-gen
```

**Rules**:
- Patches must be manually verified against source PDF
- Each patch includes source, reason, timestamp, verifier
- Patches applied after deduplication
- All patched verses tagged with `_patch_applied` metadata

## Success Metrics

✅ **Extraction Quality**:
- Genesis 1:1: Present
- Genesis 50:26: Present
- Chapters: 50/50
- Verses: ~1,533 (within tolerance)
- Duplicates: 0
- Validation Gate: PASSED

✅ **Code Quality**:
- 2-pass architecture prevents data loss
- Verse marker wins rule prevents filtering
- Chapter inference catches missed markers
- Deduplication prevents duplicates
- Validation gates prevent bad imports

---

**Status**: v3 extractor ready for testing. Fixes root causes, not symptoms.
