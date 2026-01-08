# Testing Ministry Import to Strapi

## Prerequisites

✅ Strapi is running (http://localhost:1337)
✅ Ministry content types exist:
  - ministry-work
  - ministry-text
✅ Data is validated and ready:
  - ministry-pipeline/ingest/egw/ministry-of-healing/v1/

## Step 1: Generate API Token

### Option A: Via Strapi Admin UI

1. Open Strapi Admin: http://localhost:1337/admin
2. Navigate to: **Settings → API Tokens → Create new API Token**
3. Configure:
   - Name: `Ministry Import Script`
   - Token duration: `Unlimited`
   - Token type: `Full access`
4. Copy the generated token

### Option B: Via Database (Temporary for Testing)

```bash
# Connect to your database and run:
# (This is a simplified approach - production should use Strapi Admin)
```

## Step 2: Set Environment Variable

```bash
export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your-token-here
```

## Step 3: Run Import

```bash
npx tsx scripts/ministry-extraction/import-to-strapi.ts \
  ministry-pipeline/ingest/egw/ministry-of-healing/v1
```

## Expected Output

```
📚 Ministry Text Import to Strapi
   Ingest directory: ministry-pipeline/ingest/egw/ministry-of-healing/v1
   Strapi URL: http://localhost:1337

[1/3] Loading work metadata...
   📖 The Ministry of Healing by Ellen G. White
   📊 43 chapters, 2225 paragraphs

[2/3] Upserting ministry-work...
   ✨ Creating work: The Ministry of Healing
   ✅ Created work (ID: 1)

[3/3] Loading and importing texts...
   📝 Loaded 2225 texts from chunks

   Processing batch 1/23 (100 texts)...
   Processing batch 2/23 (100 texts)...
   ...
   Processing batch 23/23 (25 texts)...

✅ Import complete!

============================================================
IMPORT SUMMARY
============================================================
Works created:    1
Works updated:    0
Texts created:    2225
Texts updated:    0
Texts skipped:    0 (unchanged)
Errors:           0
============================================================
```

## Step 4: Verify Import

### Via Strapi Admin UI

1. Navigate to: **Content Manager → Ministry Works**
   - Should see: "The Ministry of Healing" (1 record)
2. Navigate to: **Content Manager → Ministry Texts**
   - Should see: 2,225 records
   - Filter by Chapter 1: Should see 35 paragraphs

### Via API

```bash
# Check work
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  http://localhost:1337/api/ministry-works

# Check texts (first page)
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  http://localhost:1337/api/ministry-texts?pagination[pageSize]=10

# Check specific chapter
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://localhost:1337/api/ministry-texts?filters[chapterNumber][\$eq]=1"
```

## Troubleshooting

### Error: "STRAPI_API_TOKEN environment variable is required"

**Solution:** Generate API token (see Step 1) and export it:
```bash
export STRAPI_API_TOKEN=your-token-here
```

### Error: "Failed to create ministry-work: 403"

**Solution:** API token doesn't have permissions. Generate a new token with "Full access".

### Error: "Failed to fetch ministry-work by workId"

**Solution:** Content types may not be registered. Restart Strapi:
```bash
pnpm develop
```

### Error: "ECONNREFUSED localhost:1337"

**Solution:** Strapi is not running. Start it:
```bash
cd ruach-ministries-backend
pnpm develop
```

## Re-running Import (Idempotent)

The import script is idempotent - you can run it multiple times safely:

```bash
# First run: Creates all records
npx tsx scripts/ministry-extraction/import-to-strapi.ts ministry-pipeline/ingest/egw/ministry-of-healing/v1
# Output: Works created: 1, Texts created: 2225

# Second run: Skips unchanged records
npx tsx scripts/ministry-extraction/import-to-strapi.ts ministry-pipeline/ingest/egw/ministry-of-healing/v1
# Output: Works updated: 0, Texts skipped: 2225

# After data changes: Updates only changed records
npx tsx scripts/ministry-extraction/import-to-strapi.ts ministry-pipeline/ingest/egw/ministry-of-healing/v1
# Output: Works updated: 1, Texts updated: 10, Texts skipped: 2215
```

## Next Steps

After successful import:

1. **Test Queries:**
   - Search by chapter
   - Search by heading
   - Full-text search in paragraphs

2. **Test Relations (Future):**
   - Link to scripture-verses (when detectedReferences is populated)
   - Link to scripture-themes (when AI tagging is complete)

3. **Proceed to Phase 3:**
   - Add AI enrichment features
   - Re-run extraction with `--embeddings --themes --ai-metadata`
   - Re-import to update records

## Success Criteria

✅ 1 ministry-work record created
✅ 2,225 ministry-text records created
✅ No errors in import log
✅ All records visible in Strapi Admin
✅ API endpoints respond correctly
✅ Chapter 1 has 35 paragraphs (not 52 with duplicates)
