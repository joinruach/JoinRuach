# 🎯 Next Steps - YAH Scriptures Pipeline

## ✅ What's Complete

The full 4-layer extraction pipeline is built and ready:

- [x] **Layer 1 (SOURCE):** Folder structure for immutable .bbli
- [x] **Layer 2 (EXPORT):** JSONL export system
- [x] **Layer 3 (PATCHES):** Surgical patch system with audit trail
- [x] **Layer 4 (INGEST):** Strapi-ready JSON generation
- [x] **Validation:** Full quality gates (duplicates, Genesis 2:25, canonical structure)
- [x] **Documentation:** Complete README + pipeline guide
- [x] **Master Script:** One-command pipeline execution

---

## 🚀 Execute Pipeline (Quick)

### Step 1: Run the Pipeline

```bash
cd ruach-ministries-backend
./scripts/scripture-extraction/run_pipeline.sh
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════╗
║  YAH Scriptures Complete Extraction Pipeline                  ║
║  4-Layer Architecture: SOURCE → EXPORT → PATCH → INGEST       ║
╚════════════════════════════════════════════════════════════════╝

==> STEP 1: Verify source .bbli file
✅ Found source: ...
✅ SHA256: ...

==> STEP 2: Export .bbli to JSONL
✅ Exported to ...

==> STEP 3: Apply surgical patches
✅ Patched JSONL created: ...

==> STEP 4: Convert to Strapi-ready JSON
✅ Strapi payloads created in ...

==> STEP 5: Run full validation
✅ Validation passed!

╔════════════════════════════════════════════════════════════════╗
║  PIPELINE COMPLETE                                             ║
╚════════════════════════════════════════════════════════════════╝
```

**Time:** ~5-10 seconds

### Step 2: Review Validation Report

```bash
cat scripture-pipeline/ingest/yah/v1/validation-report.json
```

**Check for:**
- ✅ `genesis_2_25_present: true`
- ✅ `duplicates: 0`
- ✅ `issues: []`

### Step 3: Inspect Output

```bash
# View works (76 books)
cat scripture-pipeline/ingest/yah/v1/works.json | jq '.[:3]'

# View first verse chunk
cat scripture-pipeline/ingest/yah/v1/verses/verses.0001.json | jq '.[:3]'

# Check metadata
cat scripture-pipeline/ingest/yah/v1/meta.json
```

---

## 📦 Import to Strapi

### Option A: Using unified-ingestion-queue (Recommended)

If you have the ingestion queue service set up:

```typescript
// In your Strapi/Next.js code
import { queueScriptureIngestion } from '@/services/unified-ingestion-queue';

await queueScriptureIngestion({
  pipelineDir: 'scripture-pipeline/ingest/yah/v1',
  versionId: 'yah-scriptures-v1',
  batchSize: 2000,
});
```

### Option B: Manual Import Script (To Be Created)

Create `scripts/import-scripture.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import strapi from '@strapi/strapi';

async function importScripture() {
  // 1. Load works.json
  const works = JSON.parse(
    fs.readFileSync('scripture-pipeline/ingest/yah/v1/works.json', 'utf-8')
  );

  // 2. Create/find version
  let version = await strapi.entityService.findOne(
    'api::scripture-version.scripture-version',
    { filters: { versionId: 'yah-scriptures-v1' } }
  );

  if (!version) {
    version = await strapi.entityService.create(
      'api::scripture-version.scripture-version',
      {
        data: {
          versionId: 'yah-scriptures-v1',
          versionName: 'YAH Scriptures',
          versionCode: 'YS',
          language: 'en',
          canonStructure: 'protestant',
          totalBooks: 76,
          totalVerses: 36728,
        },
      }
    );
  }

  // 3. Create works (books)
  for (const work of works) {
    await strapi.entityService.create(
      'api::scripture-work.scripture-work',
      {
        data: {
          workId: work.slug,
          canonicalName: work.title,
          shortCode: work.slug.toUpperCase(),
          testament: work.testament,
          canonicalOrder: work.order,
          totalChapters: 0, // Calculate from verses
          totalVerses: 0,   // Calculate from verses
          version: version.id,
        },
      }
    );
  }

  // 4. Import verses (batched)
  const verseFiles = fs.readdirSync('scripture-pipeline/ingest/yah/v1/verses');

  for (const file of verseFiles) {
    const verses = JSON.parse(
      fs.readFileSync(
        path.join('scripture-pipeline/ingest/yah/v1/verses', file),
        'utf-8'
      )
    );

    for (const verse of verses) {
      // Find work by slug
      const work = await strapi.entityService.findOne(
        'api::scripture-work.scripture-work',
        { filters: { workId: verse.workSlug } }
      );

      if (!work) {
        console.error(`Work not found: ${verse.workSlug}`);
        continue;
      }

      await strapi.entityService.create(
        'api::scripture-verse.scripture-verse',
        {
          data: {
            verseId: `${verse.workSlug}-${verse.chapter}-${verse.verse}`,
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text,
            work: work.id,
          },
        }
      );
    }

    console.log(`✅ Imported ${file}`);
  }

  console.log('✅ Scripture import complete!');
}

importScripture();
```

Run:
```bash
npx tsx scripts/import-scripture.ts
```

---

## 🔍 Verification Checklist

After import, verify in Strapi admin:

### scripture-version
- [ ] YAH Scriptures v1 exists
- [ ] totalBooks = 76
- [ ] totalVerses = 36,728

### scripture-work
- [ ] 76 books exist
- [ ] Genesis (order: 1)
- [ ] Revelation (order: 66)
- [ ] Tobit (testament: apocrypha)

### scripture-verse
- [ ] 36,728 verses exist
- [ ] Genesis 1:1 exists
- [ ] **Genesis 2:25 exists** ✅ (critical)
- [ ] Revelation 22:21 exists

### SQL Verification

```sql
-- Count verses per testament
SELECT
  w.testament,
  COUNT(v.id) as verse_count
FROM scripture_verses v
JOIN scripture_works w ON v.work_id = w.id
GROUP BY w.testament;

-- Check Genesis 2:25 specifically
SELECT
  v.verseId,
  v.chapter,
  v.verse,
  LEFT(v.text, 50) as text_preview
FROM scripture_verses v
JOIN scripture_works w ON v.work_id = w.id
WHERE w.workId = 'genesis'
  AND v.chapter = 2
  AND v.verse = 25;
```

---

## 🐛 Troubleshooting

### Issue: Pipeline fails at export step

**Cause:** .bbli file not found

**Fix:**
```bash
# Ensure .bbli is in the right place
ls scripts/scripture-extraction/input/YSpc1.04.bbli

# Or update BBLI_SOURCE in run_pipeline.sh
```

### Issue: Genesis 2:25 validation fails

**Cause:** Patch not applied

**Fix:**
```bash
# Check patches.json
cat scripture-pipeline/patches/yah/v1/patches.json

# Re-run just the patch step
python3 scripts/scripture-extraction/apply_patches.py \
  --in scripture-pipeline/exports/yah/v1/yahscriptures-full.jsonl \
  --patches scripture-pipeline/patches/yah/v1/patches.json \
  --out scripture-pipeline/exports/yah/v1/yahscriptures-patched.jsonl \
  --log scripture-pipeline/patches/yah/v1/patch-log.jsonl
```

### Issue: Import fails with duplicate key error

**Cause:** Verses already exist in Strapi

**Fix:**
```bash
# Clear existing data (BE CAREFUL)
# Option 1: Via Strapi admin (bulk delete)
# Option 2: Via SQL (if you're sure)
DELETE FROM scripture_verses WHERE work_id IN (
  SELECT id FROM scripture_works WHERE version_id = <yah_version_id>
);
DELETE FROM scripture_works WHERE version_id = <yah_version_id>;
```

---

## 📈 Performance Optimization

### For Large Imports

If importing all 36,728 verses is slow:

1. **Increase batch size:**
   ```bash
   python3 scripts/scripture-extraction/jsonl_to_strapi.py \
     --in ... \
     --out ... \
     --chunk 5000  # Larger chunks
   ```

2. **Use bulk insert:**
   ```typescript
   // Instead of individual creates, use bulk
   await strapi.db.query('api::scripture-verse.scripture-verse').createMany({
     data: verses,
   });
   ```

3. **Disable indexes temporarily:**
   ```sql
   -- Before import
   ALTER TABLE scripture_verses DISABLE KEYS;

   -- ... do import ...

   -- After import
   ALTER TABLE scripture_verses ENABLE KEYS;
   ```

---

## 🎯 Production Deployment

### Pre-deployment Checklist

- [ ] Pipeline runs successfully locally
- [ ] All 76 books imported
- [ ] Genesis 2:25 verified
- [ ] No duplicates
- [ ] Validation report clean
- [ ] Database indexes created
- [ ] Backup created

### Database Indexes (Recommended)

```sql
-- Speed up verse lookups
CREATE INDEX idx_verses_work_chapter_verse
ON scripture_verses(work_id, chapter, verse);

-- Speed up work lookups
CREATE INDEX idx_works_version_order
ON scripture_works(version_id, canonicalOrder);

-- Full-text search (if using MySQL/PostgreSQL)
CREATE FULLTEXT INDEX idx_verses_text
ON scripture_verses(text);
```

---

## 🔄 Future Enhancements

### Additional Bible Versions

To add KJV, ESV, etc.:

1. Create new version in `scripture-pipeline/sources/`
2. Run pipeline with different version ID
3. Import alongside YAH Scriptures

### Interlinear Support

To add Strong's numbers, morphology:

1. Update `scripture-verse` schema (add JSON fields)
2. Export from interlinear database
3. Merge with existing verses

### Cross-References

To add cross-references:

1. Create `scripture-cross-reference` content type
2. Import Treasury of Scripture Knowledge
3. Link verses via relations

---

## 📞 Support

If you encounter issues:

1. Check `scripture-pipeline/README.md`
2. Review validation report
3. Check patch audit log: `scripture-pipeline/patches/yah/v1/patch-log.jsonl`
4. Review git history for pipeline changes

---

**Ready to run the pipeline? Let's go! 🚀**

```bash
./scripts/scripture-extraction/run_pipeline.sh
```
