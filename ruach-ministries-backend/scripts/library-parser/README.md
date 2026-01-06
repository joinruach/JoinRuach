# Ruach Library Ingestion System

Production-grade system for ingesting PDFs and EPUBs into a searchable, AI-ready knowledge base.

## Architecture

**Clean separation of concerns:**
- **Strapi**: Admin UI, metadata, pointer fields only
- **Postgres**: All heavy data (sources, versions, chunks, embeddings, full-text)
- **BullMQ**: Async ingestion pipeline with retries
- **Python**: Deterministic parsing (PDF/EPUB extraction)
- **OpenAI**: Vector embeddings (text-embedding-3-large @ 1536 dims)

## Features

✅ **Hybrid Search**: Combines full-text (tsvector) + semantic (pgvector) with Reciprocal Rank Fusion
✅ **Deterministic Pipeline**: SHA256 checksums enable safe re-runs
✅ **Builder+ Access**: Premium feature gated to Builder/Steward tiers
✅ **Smart Chunking**: Context-aware segmentation (300-800 tokens)
✅ **Citation Tracking**: Precise page numbers and chapter references
✅ **QA Metrics**: Coverage ratio, OCR confidence, quality warnings

---

## Setup

### 1. Database Migration

The migration runs automatically on Strapi start. To verify:

```bash
pnpm develop
```

Check logs for:
```
📚 Library System: Adding tables...
✅ Created library_sources table
...
🎉 Library system migration completed successfully!
```

### 2. Python Environment

```bash
cd scripts/library-parser

# Create virtual environment
python3 -m venv .venv

# Activate
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables

Add to `.env`:

```env
# OpenAI API (for embeddings)
OPENAI_API_KEY=sk-...

# Database (already configured)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ruach
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=...

# Redis (already configured)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...
```

---

## Usage

### Upload a Book (Via Strapi Admin)

1. **Create Resource Entry**
   - Go to Content Manager → Resources
   - Click "Create new entry"
   - Fill in:
     - Type: `library_book` or `library_document`
     - Title: "The Elements of Style"
     - Author: "Strunk & White"
     - Category: `writing_craft`
     - Required Access Level: `leader` (Builder+)

2. **Upload File**
   - Upload PDF/EPUB via media field
   - File is uploaded to R2 automatically

3. **Trigger Ingestion**
   - Call POST `/api/library/ingest` endpoint (or use admin UI hook)
   - Ingestion job is queued

### Search the Library (API)

```bash
POST /api/library/search
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "query": "clarity in writing",
  "filters": {
    "categories": ["writing_craft"]
  },
  "limit": 20,
  "threshold": 0.7
}
```

**Response:**

```json
{
  "results": [
    {
      "chunkId": "lib:book:elements-of-style:c42",
      "score": 0.89,
      "textContent": "Vigorous writing is concise. A sentence should contain no unnecessary words...",
      "citation": {
        "sourceTitle": "The Elements of Style",
        "author": "Strunk & White",
        "chapter": "Chapter 3: Elementary Principles of Composition",
        "pageRange": "pp. 23-24"
      },
      "context": {
        "anchorTitle": "Chapter 3: Elementary Principles of Composition"
      }
    }
  ],
  "meta": {
    "totalResults": 15,
    "processingTimeMs": 234
  }
}
```

---

## API Endpoints

### Search

**POST** `/api/library/search`

Search library with hybrid retrieval (full-text + semantic).

**Auth:** Required (Builder+ tier)

**Body:**
```typescript
{
  query: string;
  filters?: {
    categories?: string[];
    sourceIds?: string[];
  };
  limit?: number;      // default: 20
  threshold?: number;  // default: 0.7
}
```

---

### List Sources

**GET** `/api/library/sources`

List all library sources.

**Auth:** Required (Builder+ tier)

**Query:**
- `category` (optional): Filter by category

---

### Get Source

**GET** `/api/library/sources/:sourceId`

Get library source by ID.

**Auth:** Required (Builder+ tier)

---

### Ingestion Status

**GET** `/api/library/status/:versionId`

Get ingestion status for a version.

**Auth:** Required (Builder+ tier)

**Response:**
```json
{
  "data": {
    "version_id": "lib:book:elements-of-style:v1",
    "status": "completed",
    "progress": 100,
    "qa_metrics": {
      "total_blocks": 423,
      "total_chunks": 87,
      "coverage_ratio": 0.97,
      "warnings": []
    }
  }
}
```

---

### Trigger Ingestion

**POST** `/api/library/ingest`

Manually trigger ingestion for a library source.

**Auth:** Required (Admin or Builder+ tier)

**Body:**
```typescript
{
  sourceId: string;       // e.g., "lib:book:elements-of-style"
  versionId: string;      // e.g., "lib:book:elements-of-style:v1"
  fileUrl: string;        // R2 URL to PDF/EPUB
  fileType: "pdf" | "epub";
  ingestionParams?: {
    maxChars: number;     // default: 1200
    maxTokens: number;    // default: 500
    includeToc: boolean;  // default: false
  };
}
```

---

## Ingestion Pipeline

The pipeline runs asynchronously via BullMQ:

```
1. Intake       → Validate file, compute SHA256, check dedup
2. Extract      → PDF/EPUB → raw text blocks
3. Normalize    → Clean OCR artifacts, fix hyphenation
4. Structure    → Detect chapters/sections → anchors
5. Chunk        → Smart segmentation (300-800 tokens)
6. Embed        → OpenAI text-embedding-3-large (1536 dims)
7. Index        → Populate tsvector for full-text search
8. Finalize     → Update status, compute QA metrics
```

**Idempotency:**
- `determinism_key = SHA256(parser_version + params + file_sha256)`
- Re-uploading the same file skips reprocessing

---

## Database Schema

### Core Tables

1. **`library_sources`** - Book metadata
2. **`library_versions`** - Ingestion versions (for idempotency)
3. **`library_anchors`** - Chapter/section structure
4. **`library_nodes`** - Pre-chunking units (paragraphs)
5. **`library_chunks`** - Embedding-optimized segments
6. **`library_embeddings`** - Vector embeddings (pgvector)

### Knowledge Layer

7. **`library_quotes`** - Curated extracts with tags
8. **`library_annotations`** - Community notes
9. **`writing_patterns`** - Reusable templates

---

## Access Control

**Tier Gating:**
- Supporter → `accessLevel: "basic"` → No library access
- Partner → `accessLevel: "full"` → No library access
- **Builder** → `accessLevel: "leader"` → ✅ Library access
- **Steward** → `accessLevel: "leader"` → ✅ Library access

All library endpoints check `user.accessLevel === "leader"`.

---

## Monitoring

### BullBoard Dashboard

View queue status at: http://localhost:3001

- Job progress
- Failed jobs
- Retry status

### Queue Logs

```bash
# Strapi logs
tail -f logs/strapi.log | grep library-ingestion

# Redis monitor (dev only)
pnpm redis-cli MONITOR | grep library-ingestion
```

---

## Troubleshooting

### Migration Not Running

**Symptom:** Tables not created

**Fix:**
```bash
# Check migration status
ls -la database/migrations/

# Restart Strapi to trigger migration
pnpm develop
```

---

### Python Parser Fails

**Symptom:** Job fails with "Python script exited with code 1"

**Debug:**
```bash
# Test parser directly
cd scripts/library-parser
source .venv/bin/activate

python3 ruach_library_parser.py \
  --source-id "lib:book:test" \
  --version-id "lib:book:test:v1" \
  --file-url "https://example.com/test.pdf" \
  --file-type pdf
```

**Common Issues:**
- Missing `OPENAI_API_KEY` environment variable
- Database connection failed (check `DATABASE_*` env vars)
- PDF extraction failed (file corrupted or scanned image)

---

### Search Returns No Results

**Check:**

1. **Ingestion completed?**
   ```bash
   GET /api/library/status/:versionId
   # status should be "completed", not "failed"
   ```

2. **Query too specific?**
   - Try broader queries
   - Lower `threshold` parameter (default: 0.7)

3. **Embeddings generated?**
   ```sql
   SELECT COUNT(*) FROM library_embeddings;
   -- Should match number of chunks
   ```

4. **Full-text index working?**
   ```sql
   SELECT COUNT(*) FROM library_chunks
   WHERE text_search_vector @@ plainto_tsquery('english', 'clarity');
   ```

---

### OpenAI API Rate Limits

**Symptom:** Ingestion fails with "Rate limit exceeded"

**Fix:**
- Reduce batch size in `ruach_library_parser.py` (line ~380: `batch_size = 50` → `batch_size = 10`)
- Wait and retry (queue has exponential backoff)
- Upgrade OpenAI tier for higher rate limits

---

## Development

### Run Tests

```bash
# Python tests
cd scripts/library-parser
pytest

# TypeScript tests
pnpm test
```

### Add New Extraction Format

1. Create extractor in `ruach_library_parser.py`:
   ```python
   def extract_from_docx(file_path: Path) -> List[Block]:
       # Implementation
   ```

2. Update file type enum:
   ```typescript
   fileType: "pdf" | "epub" | "docx"
   ```

3. Update parser CLI args and main switch

---

## Performance

### Typical Metrics

- **PDF extraction**: ~2 seconds per 100 pages
- **Chunking**: ~1 second per 1000 paragraphs
- **Embedding generation**: ~5 seconds per 50 chunks (OpenAI API)
- **Search latency**: <300ms (with pgvector IVFFlat index)

### Optimization Tips

1. **Tune pgvector index:**
   ```sql
   -- Increase lists parameter for better recall (slower build)
   DROP INDEX library_embeddings_vector_idx;
   CREATE INDEX library_embeddings_vector_idx
   ON library_embeddings
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 200);  -- default: 100
   ```

2. **Adjust hybrid search weights:**
   - Edit `library.ts` service, line ~100
   - Current: `1/(60 + rank)` (equal weight to text + vector)
   - For more semantic: `1/(100 + text_rank) + 1/(40 + vector_rank)`

3. **Batch embedding generation:**
   - Current: 50 chunks per API call
   - Increase for faster ingestion (but watch rate limits)

---

## Roadmap

- [ ] Admin UI components (upload flow, status dashboard, outline viewer)
- [ ] Quote/annotation creation UI
- [ ] Writing patterns library
- [ ] Multi-language support (detect language, use appropriate dictionary)
- [ ] OCR for scanned PDFs (Tesseract integration)
- [ ] EPUB chapter extraction (improve TOC detection)
- [ ] Cross-reference detection (link to scripture/glossary)

---

## Credits

Built with:
- **pdfplumber** - PDF text extraction
- **ebooklib** - EPUB parsing
- **psycopg2** - Postgres driver with pgvector support
- **OpenAI** - text-embedding-3-large embeddings
- **BullMQ** - Redis-backed job queue
- **Strapi v5** - Headless CMS

---

## License

Internal use only - Ruach Ministries
