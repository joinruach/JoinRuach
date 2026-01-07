# Unified Content Extraction System v2.0

**A production-grade, quality-assured pipeline for extracting, validating, and importing books into Strapi**

---

## 🎯 Overview

This unified system handles extraction and import of three content types:
- **Scripture** (66 canonical + 37 Apocrypha = 103 books)
- **Canon** (Ellen G. White books)
- **Library** (General books/PDFs)

### Key Features

✅ **100% Accuracy** - Manual review required before database import
✅ **Context-Aware Extraction** - Intelligent verse/chapter detection (not just regex)
✅ **Canonical Validation** - Validates against expected chapter/verse counts
✅ **Formatting Preservation** - Retains poetry, line breaks, indentation
✅ **BullMQ Integration** - Async processing with retry logic
✅ **Web Review Interface** - Side-by-side comparison for manual QA
✅ **Idempotent** - Safe to re-run; skips duplicates
✅ **Unified Architecture** - Single pipeline for all content types

---

## 📁 Architecture

```
unified-extraction/
├── base-extractor.py           # Abstract base class for all extractors
├── scripture-extractor.py      # Scripture-specific (103 books)
├── review-server.ts            # Web UI for manual review (Express)
├── run-unified-pipeline.sh     # Main orchestration script
└── import-reviewed.sh          # Import only approved content

scripture-extraction/
├── canonical-structure.json    # Expected verse counts (103 books)
├── scripture-validator.ts      # Validates extracted data
└── import-to-strapi-reviewed.ts # Strapi import (filtered)

services/
└── unified-ingestion-queue.ts  # BullMQ async processing
```

---

## 🚀 Quick Start

### 1. Extract Scripture

```bash
cd ruach-ministries-backend/scripts

# Run extraction pipeline
./unified-extraction/run-unified-pipeline.sh \
  scripture \
  /path/to/yahscriptures.pdf \
  ./output/scripture-$(date +%Y%m%d)
```

**Output**:
- `works.json` - Book metadata (103 books)
- `verses_chunk_*.json` - Verse data (chunked)
- `extraction-metadata.json` - Pipeline metadata
- `extraction-log.json` - Decision log (debugging)
- `validation-report.txt` - Canonical validation results

### 2. Review Content

Open review interface:
```
http://localhost:4000
```

**Review each book**:
1. Verify verse counts match expectations
2. Check text accuracy (word-for-word)
3. Validate formatting (poetry, line breaks)
4. Approve or reject each book

### 3. Import to Strapi

```bash
# Set Strapi credentials
export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your_token_here

# Import only approved books
./unified-extraction/import-reviewed.sh \
  ./output/scripture-20260106
```

---

## 📊 Validation System

### Canonical Structure

File: `scripture-extraction/canonical-structure.json`

Contains expected chapter/verse counts for all 103 books:

```json
{
  "GEN": {
    "name": "Genesis",
    "chapters": 50,
    "verses": {
      "1": 31,
      "2": 25,
      ...
    },
    "totalVerses": 1533,
    "testament": "tanakh"
  }
}
```

**Sources**:
- Canonical 66 books: [bkuhl/bible-verse-counts](https://github.com/bkuhl/bible-verse-counts-per-chapter)
- Apocrypha: Standard Septuagint editions

### Validation Checks

`scripture-validator.ts` performs:

1. **Chapter Count** - Expected 50 chapters in Genesis → Extracted 50 chapters ✓
2. **Verse Count per Chapter** - Genesis 1 expected 31 verses → Extracted 31 verses ✓
3. **Duplicate Detection** - No duplicate verse IDs ✓
4. **Gap Detection** - No missing verses (1, 2, 4, 5 missing verse 3) ✓
5. **Text Quality** - No empty verses, no extremely long verses ✓
6. **Sequential Validation** - Verses in order (1→2→3, not 1→45→2) ✓

**Example Output**:

```
================================================================================
SCRIPTURE EXTRACTION VALIDATION REPORT
================================================================================

Total Books: 103
Validated: 103
Failed: 0
Total Errors: 0
Total Warnings: 3

✅ VALIDATION PASSED
================================================================================
```

---

## 🔧 Technical Details

### Scripture Extractor

**File**: `unified-extraction/scripture-extractor.py`

**Key Improvements over v2**:

1. **Context-Aware Verse Detection**
   ```python
   def detect_verse_inline(line: str, chapter: int):
       # Not just regex - uses position, sequence, confidence
       confidence = 0.5  # Base

       if at_line_start:
           confidence += 0.2  # Likely a verse

       if sequential (verse_num == last_verse + 1):
           confidence += 0.2  # Very likely

       if out_of_range (verse_num > 200):
           confidence -= 0.3  # Probably not a verse

       return detections if confidence >= 0.5
   ```

2. **Multi-Strategy Chapter Detection**
   - Explicit "Chapter X" headings
   - Standalone numbers (with sequence validation)
   - Font size changes (future: PDF font analysis)
   - Page breaks + verse 1 markers

3. **Verbose Logging**
   - Every decision logged to `extraction-log.json`
   - Includes: verse detected, skipped, confidence, reason
   - Enables post-mortem debugging

### Review Interface

**File**: `unified-extraction/review-server.ts`

**Express server** with REST API + HTML UI:

**Endpoints**:
```
GET  /                              # Main UI
GET  /api/extractions               # List extractions
GET  /api/extractions/:id/works     # Get books
GET  /api/extractions/:id/verses/:workId  # Get verses
GET  /api/review-status             # Get review status
POST /api/review/:bookId/approve    # Approve book
POST /api/review/:bookId/reject     # Reject book
GET  /api/review-summary            # Stats
```

**Review Status File**: `review-status.json`

```json
{
  "Genesis": {
    "status": "approved",
    "reviewer": "Marc Seals",
    "timestamp": "2026-01-06T15:30:00Z",
    "checklist": {
      "content_complete": true,
      "content_accurate": true,
      "formatting_preserved": true,
      "no_duplicates": true,
      "special_chars_correct": true
    },
    "notes": ""
  },
  "Exodus": {
    "status": "pending"
  }
}
```

### BullMQ Integration

**File**: `services/unified-ingestion-queue.ts`

**Queue Architecture**:

```typescript
Queue: unified-ingestion

Jobs:
  - ScriptureIngestionJob
  - CanonIngestionJob
  - LibraryIngestionJob

Processor:
  1. Extract (Python subprocess)
  2. Validate (canonical structure)
  3. Normalize (text cleaning)
  4. Generate review report
  5. Wait for manual approval
  6. Import to Strapi (if approved)

Retry: 3 attempts, exponential backoff (60s)
Concurrency: 2 jobs in parallel
```

---

## 🛠️ Development

### Prerequisites

```bash
# Python dependencies
pip install pdfplumber

# Node dependencies
pnpm install

# Redis (for BullMQ)
brew install redis  # macOS
brew services start redis
```

### Running Tests

```bash
# Test extraction
python3 unified-extraction/scripture-extractor.py \
  test-data/sample.pdf \
  ./test-output

# Test validation
pnpm tsx scripture-extraction/scripture-validator.ts \
  ./test-output/works.json \
  ./test-output/

# Test review server
pnpm tsx unified-extraction/review-server.ts
```

### Make Scripts Executable

```bash
chmod +x unified-extraction/run-unified-pipeline.sh
chmod +x unified-extraction/import-reviewed.sh
```

---

## 📖 Usage Examples

### Example 1: Extract YahScriptures (Full Bible)

```bash
./unified-extraction/run-unified-pipeline.sh \
  scripture \
  ~/Downloads/yahscriptures.pdf \
  ./output/yahscriptures-full

# Review at: http://localhost:4000
# Import: ./unified-extraction/import-reviewed.sh ./output/yahscriptures-full
```

### Example 2: Extract Apocrypha Only

```bash
./unified-extraction/run-unified-pipeline.sh \
  scripture \
  ~/Downloads/Apocrypha.pdf \
  ./output/apocrypha

# Review & import same as above
```

### Example 3: Extract EGW Book

```bash
./unified-extraction/run-unified-pipeline.sh \
  canon \
  ~/Downloads/ministry-of-healing.pdf \
  ./output/ministry-of-healing

# Import: Uses existing canon-strapi-import.ts
```

### Example 4: Extract General Book

```bash
./unified-extraction/run-unified-pipeline.sh \
  library \
  ~/Downloads/elements-of-style.pdf \
  ./output/elements-of-style

# Queued for async processing via BullMQ
```

---

## 🔍 Troubleshooting

### Extraction Issues

**Problem**: Genesis extracted as 1 chapter instead of 50

**Cause**: Chapter detection regex too loose (matching verse numbers)

**Solution**: v2 uses context-aware detection with sequence validation

**Check**: `extraction-log.json` for decision log

---

**Problem**: Duplicate verses found

**Cause**: Inline verse numbers detected multiple times

**Solution**: Sequential validation prevents verse number regression

**Check**: Run validator to see specific duplicates

---

### Validation Issues

**Problem**: Validation fails with "Chapter count mismatch"

**Cause**: Extraction missed chapter markers

**Solution**: Review `extraction-log.json`, improve chapter detection

**Manual Fix**: Edit `works.json` and re-run validation

---

**Problem**: "Missing verses" errors

**Cause**: Verse numbers not sequential or skipped

**Solution**: Check PDF formatting, may need manual correction

**Workaround**: Mark as rejected, fix extraction manually

---

### Review Issues

**Problem**: Review server won't start

**Cause**: Port 4000 already in use

**Solution**:
```bash
export REVIEW_PORT=4001
pnpm tsx unified-extraction/review-server.ts
```

---

**Problem**: Can't see extraction in review UI

**Cause**: Symlink not created

**Solution**:
```bash
ln -s $(pwd)/output/scripture-20260106 ./extractions/latest
```

---

### Import Issues

**Problem**: "STRAPI_API_TOKEN not set"

**Solution**:
1. Go to Strapi Admin → Settings → API Tokens
2. Create new token (Full Access)
3. Export: `export STRAPI_API_TOKEN=your_token`

---

**Problem**: Import fails with "Work not found"

**Cause**: Works not imported before verses

**Solution**: Import runs works first, then verses. Check Strapi logs.

---

## 📈 Performance

**Extraction Speed**:
- Scripture (1500 pages): ~5 minutes
- Canon (400 pages): ~2 minutes
- Library (200 pages): ~1 minute

**Validation Speed**:
- 103 books, 31k verses: ~10 seconds

**Import Speed**:
- 103 books: ~30 seconds
- 31k verses (batched): ~5 minutes

**Review Time**:
- Per book: 5-10 minutes (manual)
- Full Bible (103 books): 8-17 hours (manual)

---

## 🤝 Contributing

### Adding New Content Types

1. Create extractor in `unified-extraction/`
2. Extend `BaseExtractor` class
3. Implement `extract_blocks()`, `parse_structure()`, `validate()`
4. Add to `unified-ingestion-queue.ts`
5. Update `run-unified-pipeline.sh`

### Improving Extraction Accuracy

1. Review `extraction-log.json` for false positives/negatives
2. Adjust confidence scoring in `detect_verse_inline()`
3. Add new detection strategies
4. Test against validation report
5. Iterate until 100% validation pass rate

---

## 📚 References

- [Canon Parser](../canon-parser/README.md) - EGW book extraction
- [Library Parser](../library-parser/README.md) - General book extraction
- [Scripture Extraction v2](../scripture-extraction/EXTRACTION_GUIDE.md) - Legacy system
- [BullMQ Documentation](https://docs.bullmq.io/) - Queue system

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Canonical verse counts: [bkuhl/bible-verse-counts-per-chapter](https://github.com/bkuhl/bible-verse-counts-per-chapter)
- PDF extraction: [pdfplumber](https://github.com/jsvine/pdfplumber)
- Queue system: [BullMQ](https://github.com/taskforcesh/bullmq)

---

**Built with ❤️ for 100% accuracy in Scripture extraction**

*"Truth in Code, Clarity in Creation."*
