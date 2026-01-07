# Scripture Extractor v3 - Safety Improvements

## Improvements Based on Expert Review

### 1. ✅ Tightened Verse Marker Detection

**Before**: Could match anywhere, no book context check
**After**: 
- Requires book context (except during initial tokenization)
- Must start with letter after verse number (rejects page numbers)
- Anchored patterns only (start-of-line)
- Strict spacing rules

```python
# Pattern: ^(\d{1,3})\s+([A-Za-z].*)
# Must have text starting with letter (not number/page reference)
```

**Risk Mitigated**: Prevents false positives from page numbers, list numbering, etc.

### 2. ✅ Conservative Chapter Inference

**Before**: Could infer chapters too aggressively
**After**:
- Only infers if already "in scripture mode" (have book context)
- Requires substantial previous verse (>= 20)
- Requires distance from last chapter marker (> 50 lines)
- Only infers next sequential chapter (no wild jumps)
- Upper bound check (<= 200 chapters)

```python
if (self.current_book and 
    verse_num == 1 and 
    last_verse_num >= 20 and 
    lines_since_chapter > 50):
    expected_next_chapter = self.current_chapter + 1
    if expected_next_chapter <= 200:  # No wild jumps
        self.current_chapter = expected_next_chapter
```

**Risk Mitigated**: Prevents false positives from footnotes, parallel columns, repeated references.

### 3. ✅ Deterministic Reconciliation

**Before**: Could produce different results on re-runs
**After**:
- Priority order is deterministic:
  1. Text length (> 50% difference)
  2. Header-like token count (fewer = better)
  3. Lexicographic comparison (tiebreaker)
- Same inputs → same chosen "best" version

```python
# Deterministic tiebreaker
elif verse_text < existing.text:
    keep_existing = False  # Lexicographic order
else:
    keep_existing = True
```

**Risk Mitigated**: Prevents checksum churn, review churn, untrustworthy diffs.

### 4. ✅ Fixed Duplicate Detection

**Before**: Counted reconciliation events as duplicates
**After**:
- Reconciliation events are warnings (expected behavior)
- Only actual duplicates in final verse list are errors
- Checks for same (chapter, verse) appearing twice after reconciliation

**Risk Mitigated**: Prevents false positives from legitimate deduplication.

### 5. ✅ Enhanced Multi-Book Validation

**File**: `validation-gate-enhanced.py`

**Sentinel Books**:
- Genesis (law, long book)
- Psalms (poetry, 150 chapters)
- Isaiah (prophets, complex formatting)
- Matthew (gospels)
- Romans (epistles)
- Jude (short book)

**Per-Book Checks**:
- ✅ First verse present
- ✅ Last verse present
- ✅ Chapter count match
- ✅ Verse count within tolerance
- ✅ No backwards transitions
- ✅ Sequential validation

### 6. ✅ Artifact Bundle Creation

**File**: `create-artifact-bundle.py`

**Single Source of Truth** includes:
- `extraction-log.json` - All decisions
- `validation-report.json` - Errors/warnings, counts, score
- `dedup-report.json` - What merged, what kept as alternate
- `patches_applied.json` - Patches if used (empty otherwise)
- `canonical-diff.json` - Missing/extra vs canonical
- `quality_score` - 0-100 score with grade (A-F)

**Usage**: 
```bash
python3 create-artifact-bundle.py output/main/
```

### 7. ✅ Patch Script Safety

**File**: `apply-patches.py`

**Safety Features**:
- Requires `--apply-patches` flag (cannot run accidentally)
- Records `patches_applied.json` at run level
- All patched verses tagged with `_patch_applied` metadata
- Reviewer acknowledgment required before publish

**Usage**:
```bash
# Cannot run without explicit flag:
python3 apply-patches.py patches.json output/ yah-gen --apply-patches
```

## Remaining Risks (Documented)

### 1. Chapter Inference False Positives
**Mitigation**: Conservative thresholds (>= 20 previous verse, > 50 lines, sequential only)
**Monitoring**: Check inference logs in `extraction-log.json`

### 2. Verse Marker Regex Over-Matching
**Mitigation**: Requires letter after number, book context required (except pass 1)
**Monitoring**: Review decision log for false positives

### 3. Deterministic Reconciliation Edge Cases
**Mitigation**: Lexicographic tiebreaker ensures determinism
**Monitoring**: Check that same inputs produce same outputs

### 4. Genesis-Specific Gates
**Mitigation**: Enhanced validation gate covers 6 sentinel books
**Monitoring**: Expand sentinel set as needed

## Testing Sequence (Release Captain)

1. ✅ Run `TEST-GENESIS.sh`
2. ✅ Run enhanced validation on sentinel set (Genesis + Psalms + Matthew + Romans + Jude)
3. ✅ Run full canon extraction with gates on, publish off
4. ✅ Compare metrics:
   - Missing verses count
   - Duplicates count
   - Chapter counts
   - Total verses vs expected
5. ✅ Only then enable publish

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `scripture-extractor-v3.py` | Fixed extractor with all safety improvements | ✅ Complete |
| `validation-gate.py` | Genesis-specific validation | ✅ Complete |
| `validation-gate-enhanced.py` | Multi-book sentinel validation | ✅ Complete |
| `create-artifact-bundle.py` | Single artifact bundle | ✅ Complete |
| `apply-patches.py` | Safe patch application | ✅ Complete |

---

**Status**: ✅ **All safety improvements implemented. Ready for testing with enhanced safeguards.**
