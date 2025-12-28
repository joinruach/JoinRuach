# YahScriptures PDF Extraction & Import

This directory contains scripts to extract scripture data from the YahScriptures PDF and import it into Strapi.

## Prerequisites

### Python Dependencies
```bash
pip install pdfplumber
```

### Environment Variables
```bash
# Set in .env or export
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here
```

## Step 1: Extract from PDF

```bash
cd ruach-ministries-backend/scripts/scripture-extraction

python extract-yahscriptures.py /path/to/yahscriptures.pdf ./extracted_scripture
```

**Output:**
- `extracted_scripture/works.json` - Book metadata
- `extracted_scripture/verses_chunk_01.json` - Verse data (chunked)
- `extracted_scripture/verses_chunk_02.json` - More verses...

## Step 2: Import to Strapi

First, create an API token in Strapi:
1. Go to **Settings → API Tokens**
2. Click **Create new API Token**
3. Name: `Scripture Import`
4. Token type: `Full access`
5. Copy the token

Then run the import:

```bash
export STRAPI_API_TOKEN=your_token_here

pnpm tsx scripts/scripture-extraction/import-to-strapi.ts ./extracted_scripture
```

## Data Model

### scripture-work
- Contains metadata for each of the 103 books
- Fields: workId, canonicalName, shortCode, testament, genre, etc.

### scripture-verse
- Individual verses with full text
- Relations: belongs to scripture-work
- Preserves Paleo-Hebrew divine names

## Verification

After import, verify in Strapi Admin:

```bash
# Check works count
curl http://localhost:1337/api/scripture-works | jq '.meta.pagination.total'

# Check verses count
curl http://localhost:1337/api/scripture-verses | jq '.meta.pagination.total'

# Get a specific verse
curl 'http://localhost:1337/api/scripture-verses?filters[verseId][$eq]=yah-gen-001-001&populate=work'
```

## Troubleshooting

### "pdfplumber not installed"
```bash
pip install pdfplumber
```

### "STRAPI_API_TOKEN is required"
Make sure you've created an API token in Strapi Admin and exported it:
```bash
export STRAPI_API_TOKEN=your_token_here
```

### "Work not found in map"
This means the works import failed. Re-run:
```bash
pnpm tsx scripts/scripture-extraction/import-to-strapi.ts ./extracted_scripture
```

## Notes

- **Idempotent**: Scripts can be re-run safely. Duplicates are skipped.
- **Batched**: Verses are imported in batches of 100 to prevent timeouts.
- **Chunked**: Large datasets are split into multiple JSON files.
- **Paleo-Hebrew**: Divine names in original script are preserved.

## Next Steps

After successful import:
1. Set up public read permissions for `scripture-works` and `scripture-verses`
2. Test the Living Scripture Stream frontend
3. Begin importing themes and lemmas (future enhancement)
