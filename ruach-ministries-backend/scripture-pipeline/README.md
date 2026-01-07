# 📖 YAH Scriptures Extraction Pipeline

## 4-Layer Architecture

This pipeline implements a **truth-preserving, auditable** extraction system with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: SOURCE (Immutable)                                    │
│  ├─ sources/yah/YSpc1.04.bbli          (original .bbli)        │
│  └─ sources/yah/SHA256SUMS.txt         (integrity check)        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: EXPORT (Reproducible)                                 │
│  ├─ exports/yah/v1/yahscriptures-full.jsonl  (raw export)      │
│  └─ exports/yah/v1/extract-meta.json         (extraction stats) │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: PATCHES (Auditable)                                   │
│  ├─ patches/yah/v1/patches.json        (surgical fixes)         │
│  ├─ patches/yah/v1/patch-log.jsonl     (audit trail)           │
│  └─ exports/yah/v1/yahscriptures-patched.jsonl (result)        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: INGEST (Production-Ready)                             │
│  ├─ ingest/yah/v1/works.json           (76 books)              │
│  ├─ ingest/yah/v1/verses/verses.*.json (36,728 verses chunked) │
│  ├─ ingest/yah/v1/meta.json            (counts + stats)        │
│  └─ ingest/yah/v1/validation-report.json (quality gates)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.8+
- YSpc1.04.bbli file (YAH Scriptures SQLite database)

### Run Full Pipeline

```bash
# From ruach-ministries-backend/
./scripts/scripture-extraction/run_pipeline.sh
```

This will:
1. ✅ Verify source .bbli integrity (SHA256)
2. ✅ Export to JSONL (36,728 verses)
3. ✅ Apply surgical patches (Genesis 2:25 fix)
4. ✅ Convert to Strapi-ready JSON (chunked)
5. ✅ Run full validation (duplicates, missing verses, canonical structure)

### Dry Run (Preview Only)

```bash
./scripts/scripture-extraction/run_pipeline.sh --dry-run
```

---

## Pipeline Scripts

### 1. `export-bbli.py`

**Purpose:** Export .bbli SQLite database to JSONL

```bash
python3 scripts/scripture-extraction/export-bbli.py \
  --db sources/yah/YSpc1.04.bbli \
  --out exports/yah/v1/yahscriptures-full.jsonl
```

**Output:** One verse per line in JSONL format:
```json
{"book_num":1,"book":"Genesis","testament":"old","chapter":1,"verse":1,"text":"..."}
```

### 2. `apply_patches.py`

**Purpose:** Apply surgical fixes with audit trail

```bash
python3 scripts/scripture-extraction/apply_patches.py \
  --in exports/yah/v1/yahscriptures-full.jsonl \
  --patches patches/yah/v1/patches.json \
  --out exports/yah/v1/yahscriptures-patched.jsonl \
  --log patches/yah/v1/patch-log.jsonl
```

**Patch Types:**
- `add` - Insert missing verse (e.g., Genesis 2:25)
- `replace` - Fix verse text
- `delete` - Remove erroneous verse (rare)

**Audit Trail:** Every patch logs:
- Timestamp (UTC)
- Patch ID
- Author
- Reason
- Source verification

### 3. `jsonl_to_strapi.py`

**Purpose:** Convert JSONL to Strapi-ready JSON payloads

```bash
python3 scripts/scripture-extraction/jsonl_to_strapi.py \
  --in exports/yah/v1/yahscriptures-patched.jsonl \
  --out ingest/yah/v1 \
  --chunk 2000
```

**Output:**
- `works.json` - 76 books (66 canonical + 10 Apocrypha)
- `verses/verses.0001.json` - Verse batches (2000/chunk)
- `meta.json` - Extraction metadata

### 4. `validate_strapi_dump.py`

**Purpose:** Full validation with quality gates

```bash
python3 scripts/scripture-extraction/validate_strapi_dump.py \
  --dir ingest/yah/v1 \
  --canonical scripts/scripture-extraction/canonical-structure.json
```

**Checks:**
- ❌ **Critical:** Duplicates (fail)
- ❌ **Critical:** Genesis 2:25 missing (fail)
- ⚠️  **Warning:** Empty verse text
- ⚠️  **Warning:** Canonical structure mismatches

**Exit Codes:**
- `0` = Pass
- `1` = Fail (critical issues)

Use `--strict` to fail on warnings.

---

## Patch System

### Creating a Patch

Edit `patches/yah/v1/patches.json`:

```json
{
  "version": "1.0.0",
  "patches": [
    {
      "id": "genesis-2-25-restore",
      "type": "add",
      "book": "Genesis",
      "chapter": 2,
      "verse": 25,
      "text": "And they were both naked, the man and his wife, and were not ashamed.",
      "reason": "Source merge anomaly - verse missing in bbli export",
      "source": "YAH Scriptures bbli database, cross-referenced with KJV",
      "author": "Marc Seals",
      "date": "2026-01-07"
    }
  ]
}
```

### Patch Audit Trail

Every patch application logs to `patch-log.jsonl`:

```json
{"timestamp":"2026-01-07T12:00:00Z","patch_id":"genesis-2-25-restore","type":"add","book":"Genesis","chapter":2,"verse":25,"reason":"...","author":"Marc Seals"}
```

This creates an **immutable audit trail** for all modifications.

---

## Validation Rules

### Critical (Fail Pipeline)

1. **Duplicates:** No duplicate (work, chapter, verse) tuples allowed
2. **Genesis 2:25:** Must exist with non-empty text
3. **JSON Integrity:** All files must parse correctly

### Warnings (Pass with Alert)

1. **Empty Verses:** Verses with empty text fields
2. **Canonical Mismatches:** Verse counts differ from canonical-structure.json

---

## Data Model

### Strapi Content Types

#### `scripture-version`

```json
{
  "versionId": "yah-scriptures-v1",
  "versionName": "YAH Scriptures",
  "versionCode": "YS",
  "canonStructure": "protestant",
  "totalBooks": 76,
  "totalVerses": 36728
}
```

#### `scripture-work`

```json
{
  "workId": "genesis",
  "canonicalName": "Genesis",
  "testament": "old",
  "canonicalOrder": 1,
  "totalChapters": 50,
  "totalVerses": 1533,
  "extractionStatus": "validated"
}
```

#### `scripture-verse`

```json
{
  "verseId": "genesis-1-1",
  "chapter": 1,
  "verse": 1,
  "text": "In the beginning Elohim created the heavens and the earth.",
  "work": { "id": 1 }
}
```

---

## Accuracy Report

### Extraction Results

| Metric | Count | Accuracy |
|--------|-------|----------|
| **Total Verses** | 36,728 | 99.997% |
| **Old Testament** | 23,249 | 100% |
| **New Testament** | 7,983 | 100% |
| **Apocrypha** | 5,496 | 100% |
| **Missing Verses** | 1 | Genesis 2:25* |

*Genesis 2:25 is fixed via patch system

### Apocrypha Breakdown

| Book | Verses |
|------|--------|
| Tobit | 244 |
| Judith | 339 |
| Wisdom | 436 |
| Sirach | 1,392 |
| Baruch | 213 |
| 1 Maccabees | 924 |
| 2 Maccabees | 555 |
| 1 Esdras | 448 |
| 2 Esdras | 944 |
| Prayer of Manasseh | 1 |

---

## Import to Strapi

### Using unified-ingestion-queue

```typescript
import { queueScriptureIngestion } from '@/services/unified-ingestion-queue';

// Queue version + works + verses
await queueScriptureIngestion({
  pipelineDir: 'scripture-pipeline/ingest/yah/v1',
  versionId: 'yah-scriptures-v1',
  batchSize: 2000,
});
```

### Manual Import (Development)

```bash
# Import works first (creates relations)
node scripts/import-works.ts \
  --file scripture-pipeline/ingest/yah/v1/works.json \
  --version yah-scriptures-v1

# Import verses (chunked batches)
node scripts/import-verses.ts \
  --dir scripture-pipeline/ingest/yah/v1/verses \
  --batch 2000
```

---

## Troubleshooting

### Issue: Genesis 2:25 Still Missing

**Cause:** Patch not applied

**Fix:**
```bash
# Verify patches.json exists
cat patches/yah/v1/patches.json

# Re-run patch step
python3 scripts/scripture-extraction/apply_patches.py \
  --in exports/yah/v1/yahscriptures-full.jsonl \
  --patches patches/yah/v1/patches.json \
  --out exports/yah/v1/yahscriptures-patched.jsonl \
  --log patches/yah/v1/patch-log.jsonl
```

### Issue: Validation Fails with Duplicates

**Cause:** Multiple exports merged without deduplication

**Fix:**
```bash
# Check for duplicates in source
sqlite3 sources/yah/YSpc1.04.bbli \
  "SELECT book, chapter, verse, COUNT(*) FROM verses GROUP BY book, chapter, verse HAVING COUNT(*) > 1"

# If source has duplicates, add to patches.json with type: "delete"
```

### Issue: Canonical Structure Mismatch

**Cause:** Source has extra verses (e.g., longer Psalms, alternate versifications)

**Fix:**
- Review validation report
- Cross-reference with Masoretic/LXX
- Document in patches.json if intentional variation

---

## Version History

### v1.0.0 (2026-01-07)

- ✅ Complete .bbli export (36,728 verses)
- ✅ Apocrypha included (10 books, 5,496 verses)
- ✅ Patch system with audit trail
- ✅ Full validation gates
- ✅ Strapi v5 integration
- ✅ 99.997% accuracy

---

## Contributing

### Adding New Patches

1. Edit `patches/yah/v1/patches.json`
2. Add patch with full metadata:
   - `id` (unique)
   - `type` (add/replace/delete)
   - `book`, `chapter`, `verse`
   - `text` (for add/replace)
   - `reason` (required)
   - `source` (verification)
   - `author`, `date`
3. Run validation:
   ```bash
   ./scripts/scripture-extraction/run_pipeline.sh --dry-run
   ```
4. Commit patch + audit log

### Updating Canonical Structure

Edit `canonical-structure.json` and increment version.

---

## License

YAH Scriptures © Institute for Scripture Research
Pipeline © 2026 Ruach Ministries
