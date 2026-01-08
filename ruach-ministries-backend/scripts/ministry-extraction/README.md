# Ministry Text Extraction System

A production-ready pipeline for extracting, validating, and importing ministry texts (EGW books) into Strapi.

## Architecture

### 4-Layer Pipeline

```
Layer 1: SOURCES     → Immutable PDF + SHA256 verification
Layer 2: EXPORTS     → Raw JSONL (paragraph-based extraction)
Layer 3: PATCHES     → Surgical fixes with audit trail (if needed)
Layer 4: INGEST      → Strapi-ready JSON + validation reports
```

### Content Types

**ministry-work**: Book metadata
- workId, title, shortCode, author
- totalChapters, totalParagraphs
- extractionStatus, extractionMetadata

**ministry-text**: Paragraph content
- textId, chapterNumber, paragraphNumber, text
- heading, textHash
- detectedReferences, embedding, aiMetadata
- Relations: work, scriptureReferences, themes

## Quick Start

### Prerequisites

```bash
# Install Python dependencies
cd scripts/ministry-extraction
python3 -m venv .venv
source .venv/bin/activate
pip install pdfplumber

# Set environment variables
export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your-token-here
```

### Manual Extraction (Phase 1)

Extract a single ministry book:

```bash
# Step 1: Extract PDF → JSONL
scripts/ministry-extraction/.venv/bin/python3 scripts/ministry-extraction/pdf-extractor.py \
  --pdf ministry-pipeline/sources/egw/ministry-of-healing/the_ministry_of_healing.pdf \
  --out ministry-pipeline/exports/egw/ministry-of-healing/v1/paragraphs.jsonl \
  --book-code MOH

# Step 2: Convert JSONL → Strapi JSON
scripts/ministry-extraction/.venv/bin/python3 scripts/ministry-extraction/jsonl-to-strapi.py \
  --in ministry-pipeline/exports/egw/ministry-of-healing/v1/paragraphs.jsonl \
  --out ministry-pipeline/ingest/egw/ministry-of-healing/v1 \
  --chunk 500

# Step 3: Validate
scripts/ministry-extraction/.venv/bin/python3 scripts/ministry-extraction/validate-ministry-dump.py \
  --dir ministry-pipeline/ingest/egw/ministry-of-healing/v1

# Step 4: Import to Strapi
npx tsx scripts/ministry-extraction/import-to-strapi.ts \
  ministry-pipeline/ingest/egw/ministry-of-healing/v1
```

### Queue-Based Ingestion (Phase 2)

Enqueue a ministry book for automated processing:

```bash
curl -X POST http://localhost:1337/api/ingestion/enqueue \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "ministry",
    "sourceId": "egw-ministry-of-healing",
    "versionId": "MOH-v1",
    "fileUrl": "/Users/marcseals/Downloads/the_ministry_of_healing.pdf",
    "fileType": "pdf",
    "ministryParams": {
      "bookCode": "MOH",
      "bookTitle": "The Ministry of Healing",
      "author": "Ellen G. White",
      "enableEmbeddings": false,
      "enableThemeTagging": false,
      "enableAiMetadata": false
    }
  }'
```

## Scripts

### pdf-extractor.py

Extracts ministry texts from PDF using layout-aware parsing.

**Features:**
- Zone filtering (HEADER/FOOTER/MARGIN/BODY)
- Multi-pattern chapter detection
- Paragraph segmentation via visual spacing
- TOC filtering
- Front matter skipping

**Usage:**
```bash
python3 scripts/ministry-extraction/pdf-extractor.py \
  --pdf <path-to-pdf> \
  --out <output-jsonl> \
  --book-code <code>
```

**Chapter Detection Patterns:**
```python
r"^Chapter\s+(\d+|[IVXLCDM]+)[—\-:]\s*.+$"  # "Chapter 1—Our Example"
r"^CHAPTER\s+(\d+|[IVXLCDM]+)\.?\s*$"       # "CHAPTER 1"
r"^(\d+|[IVXLCDM]+)\.\s+[A-Z][A-Za-z\s]{3,50}$"  # "1. The Title"
```

**Output Format:**
```json
{
  "book": "MOH",
  "chapter": 1,
  "paragraph": 1,
  "text": "Our Lord Jesus Christ came to this world...",
  "pdfPage": 16,
  "heading": "Chapter 1—Our Example",
  "confidence": 1.0
}
```

### jsonl-to-strapi.py

Converts extracted JSONL to Strapi-ready JSON format.

**Features:**
- Single work.json (book metadata)
- Chunked text files (500 paragraphs per chunk)
- Text hashing for change detection
- Duplicate detection
- Chapter distribution stats

**Usage:**
```bash
python3 scripts/ministry-extraction/jsonl-to-strapi.py \
  --in <input-jsonl> \
  --out <output-dir> \
  --chunk 500
```

**Output Structure:**
```
ingest/
├── work.json              # Book metadata
├── texts/
│   ├── texts.0001.json    # Paragraphs 1-500
│   ├── texts.0002.json    # Paragraphs 501-1000
│   └── ...
├── meta.json              # Statistics
└── validation-report.json # Validation results
```

### validate-ministry-dump.py

Validates extracted data against quality gates.

**Hard Fail Rules (exit code 1):**
- First paragraph (Ch1:P1) must exist
- No duplicate (chapter, paragraph) tuples
- No empty text fields
- JSON integrity (all files parse)

**Warning Rules (log but don't fail):**
- Missing headings (>50% paragraphs)
- Very short paragraphs (<10 chars)
- Missing page numbers in sourceMetadata

**Usage:**
```bash
python3 scripts/ministry-extraction/validate-ministry-dump.py \
  --dir <ingest-dir>
```

**Output:**
```json
{
  "passed": true,
  "errors": [],
  "warnings": [],
  "stats": {
    "chapters": 43,
    "paragraphs": 2225,
    "avgParagraphLength": 306.5,
    "duplicates": 0,
    "emptyTexts": 0
  },
  "contentChecks": {
    "firstParagraphPresent": true,
    "firstChapter": 1,
    "lastChapter": 43,
    "expectedChapters": 43,
    "chapterGaps": []
  }
}
```

### import-to-strapi.ts

Imports validated data to Strapi via API.

**Features:**
- Upserts ministry-work by workId (idempotent)
- Upserts ministry-texts by textId (allows re-runs)
- Batch imports texts (100 per batch)
- Skips unchanged texts (textHash comparison)
- Creates scripture-verse relations (if detectedReferences exists)
- Creates scripture-theme relations (if themes exists)

**Usage:**
```bash
npx tsx scripts/ministry-extraction/import-to-strapi.ts <ingest-dir>
```

**Environment Variables:**
- `STRAPI_URL` - Strapi base URL (default: http://localhost:1337)
- `STRAPI_API_TOKEN` - Strapi API token (required)

## Unified Ingestion Queue Integration

The ministry extraction pipeline is integrated into the unified ingestion queue (`src/services/unified-ingestion-queue.ts`).

### Job Flow

```
Enqueue Job → Process Ministry Ingestion → Update Status
                      ↓
    Step 1: PDF Extraction (pdf-extractor.py)
    Step 2: AI Enrichment (optional, ai-enrichment.ts)
    Step 3: Convert to Strapi format (jsonl-to-strapi.py)
    Step 4: Validation (validate-ministry-dump.py)
    Step 5: Auto-import to Strapi (import-to-strapi.ts)
```

### Job Parameters

```typescript
interface MinistryIngestionJob {
  contentType: "ministry";
  sourceId: string;
  versionId: string;
  fileUrl: string;
  fileType: "pdf" | "epub" | "docx" | "md";
  ministryParams: {
    bookCode: string;
    author: string;
    bookTitle: string;
    enableEmbeddings: boolean;
    enableThemeTagging: boolean;
    enableAiMetadata: boolean;
  };
}
```

### Monitoring

Job status is tracked in the database with:
- `status`: pending | processing | completed | failed
- `progress`: 0-100%
- `qaMetrics`: validation report data

## AI Enrichment (Phase 3)

### Scripture Reference Detection

Detects Bible references in text using regex patterns.

**Patterns:**
```typescript
/\b(Genesis|Exodus|...|Revelation)\s+(\d+):(\d+)(?:-(\d+))?\b/gi
/\b([123]\s*[A-Z][a-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/gi
```

**Output:**
```json
{
  "detectedReferences": [
    {
      "raw": "Matthew 8:17",
      "normalized": "matthew-8-17",
      "book": "Matthew",
      "chapter": 8,
      "verseStart": 17,
      "verseEnd": 17,
      "confidence": 0.95,
      "verseIds": [12345]
    }
  ]
}
```

### Embedding Generation

Generates semantic embeddings using OpenAI's text-embedding-3-small.

**Configuration:**
- Model: text-embedding-3-small
- Dimensions: 512
- Batch size: 100 paragraphs
- Cost: ~$0.002 per book (~2,225 paragraphs)

**Output:**
```json
{
  "embedding": {
    "model": "text-embedding-3-small",
    "dimensions": 512,
    "vector": [0.023, -0.045, ...]
  }
}
```

### Theme Tagging

Tags paragraphs with relevant themes using cosine similarity.

**Method:**
- Compare paragraph embeddings with theme embeddings
- Threshold: >0.75 similarity
- Output: Top 3-5 theme IDs per paragraph

### AI Metadata Generation

Generates metadata using Claude Haiku 3.5.

**Batch size:** 10 paragraphs per API call
**Cost:** ~$0.11 per book (~2,225 paragraphs)

**Metadata Fields:**
```json
{
  "aiMetadata": {
    "keyTopics": ["salvation", "grace", "healing"],
    "emotionalTone": "hopeful",
    "readingLevel": 10.2,
    "crossReferenceSuggestions": ["John 3:16", "Rom 8:28"],
    "discussionPrompts": ["How does this relate to modern healthcare?"],
    "ministryApplications": ["Evangelism", "Health Ministry"]
  }
}
```

## Error Handling

### Retry Logic
- API timeouts: Retry 3× with exponential backoff
- Rate limits: Sleep 60s, retry
- Validation failures: Stop pipeline, log errors
- Partial failures: Checkpoint-based recovery

### Logging
All operations are logged with:
- Timestamp
- Job ID
- Content type
- Version ID
- Status
- Error messages (if any)

## Testing

### Unit Tests (Future)
- Chapter detection accuracy
- Paragraph segmentation quality
- Scripture reference detection precision/recall

### Integration Test

```bash
# Run full pipeline on Ministry of Healing
./scripts/ministry-extraction/run-ministry-pipeline.sh \
  ministry-pipeline/sources/egw/ministry-of-healing/the_ministry_of_healing.pdf \
  MOH \
  ministry-pipeline/egw/ministry-of-healing/v1

# Verify output
ls -la ministry-pipeline/ingest/egw/ministry-of-healing/v1/

# Check validation
cat ministry-pipeline/ingest/egw/ministry-of-healing/v1/validation-report.json
```

**Expected Results:**
- 43 chapters detected
- ~2,225 paragraphs extracted
- 0 duplicates
- 0 errors
- 0 warnings
- Validation passes

## Cost Estimates

| Feature | Per Book Cost |
|---------|---------------|
| Embeddings (OpenAI) | $0.002 |
| Theme Tagging (local) | $0.000 |
| AI Metadata (Claude Haiku) | $0.110 |
| **Total AI Cost** | **$0.112** |

**Full EGW Library (50 books):** ~$5.60

## Troubleshooting

### No chapters detected

**Cause:** Chapter heading format doesn't match patterns
**Fix:** Add custom pattern to `CHAPTER_PATTERNS` in pdf-extractor.py

### Duplicate paragraphs

**Cause:** Front matter or TOC being included
**Fix:** Check `looks_like_toc_line()` and chapter detection logic

### Import fails

**Cause:** Missing STRAPI_API_TOKEN
**Fix:** Set environment variable before running import script

### Validation fails

**Cause:** Missing first paragraph or duplicates
**Fix:** Review extraction logs and check PDF structure

## Next Steps

1. ✅ Phase 1: Core extraction (completed)
2. ✅ Phase 2: Queue integration (completed)
3. ⏳ Phase 3: AI enrichment (in progress)
   - [ ] Scripture reference detector
   - [ ] Embedding generator
   - [ ] Theme tagger
   - [ ] AI metadata generator
4. ⏳ Phase 4: Production hardening
   - [ ] Error handling & retry logic
   - [ ] Cost monitoring
   - [ ] Performance optimization
   - [ ] Comprehensive testing

## Contributing

When adding new ministry books:

1. Add PDF to `ministry-pipeline/sources/<publisher>/<book-slug>/`
2. Generate SHA256: `sha256sum <pdf> > SHA256SUMS.txt`
3. Run extraction pipeline
4. Review validation report
5. Import to Strapi

## License

Internal use only - Ruach Ministries Backend
