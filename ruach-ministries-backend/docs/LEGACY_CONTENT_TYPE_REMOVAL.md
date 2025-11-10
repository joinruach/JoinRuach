# Legacy Content Type Removal Guide

## Overview

This document outlines the process for safely removing deprecated content types from the Strapi backend. These legacy types have been superseded by the `media-item` content type and other consolidated approaches.

## Legacy Content Types to Remove

### Primary Legacy Types (Superseded by media-item)
- `video` - Replaced by `media-item` with `type: "teaching"` or `type: "testimony"`
- `audio-file` - Replaced by `media-item` with audio source
- `image` - Replaced by `media-item` with image source
- `article` - Replaced by `media-item` with `type: "article"`
- `testimonial` - Replaced by `media-item` with `type: "testimony"`
- `gallery` - Replaced by `media-item` collections

### Secondary Legacy Types
- `reply` - Replaced by nested comment structure
- `about` - Moved to pages/settings
- `contact-info` - Consolidated into settings
- `hero-section` - Moved to page components
- `setting` - Consolidated into main settings

## Pre-Removal Checklist

**⚠️ CRITICAL: Complete these steps BEFORE removing any content types**

### 1. Verify No Active Data

Run the validation script:

```bash
node scripts/validate-legacy-content-types.js
```

This script will:
- Check for existing entries in each legacy content type
- Report counts and sample data
- Flag any dependencies or relations
- Generate a full report

### 2. Backup Database

```bash
# Create a full database backup
pg_dump -U your_user -d your_database > backup_before_removal_$(date +%Y%m%d_%H%M%S).sql

# Or use Strapi's data transfer
npm run strapi transfer:export -- --file backup_before_removal
```

### 3. Check for Dependencies

Look for:
- Relations to other content types
- API routes using these types
- Frontend code consuming these types
- Custom controllers/services
- Plugins depending on these types

Search commands:
```bash
# Search for references in API code
grep -r "api::video" src/
grep -r "api::audio-file" src/
grep -r "api::image" src/
# ... repeat for each type

# Search frontend for usage
cd ../apps/ruach-next
grep -r "videos" src/
grep -r "getVideos" src/
```

### 4. Migrate Existing Data

If the validation script reports existing data:

#### For Media Types (video, audio, image, etc.)
```bash
node scripts/migrate-legacy-media-to-media-item.js
```

This will:
- Convert all videos → media-items
- Convert all audio → media-items
- Convert all images → media-items
- Preserve relations, timestamps, and metadata
- Generate a migration report

#### For Other Types
Document any manual migration needed:
- Export data from legacy type
- Transform to new structure
- Import into new type
- Verify integrity

## Removal Process

### Step 1: Remove from Git

Only after validation and migration:

```bash
# Navigate to API directory
cd src/api

# Remove legacy content type directories
rm -rf video
rm -rf audio-file
rm -rf image
rm -rf article
rm -rf testimonial
rm -rf gallery
rm -rf reply
rm -rf about
rm -rf contact-info
rm -rf hero-section
rm -rf setting

# Commit changes
git add .
git commit -m "feat: remove legacy content types

Removed deprecated content types:
- video, audio-file, image (superseded by media-item)
- article, testimonial, gallery
- reply, about, contact-info, hero-section, setting

All data has been migrated to new structures.
See LEGACY_CONTENT_TYPE_REMOVAL.md for migration details."
```

### Step 2: Clean Up Database Schema

After removing from code, Strapi will handle schema cleanup on next restart. To manually verify:

```sql
-- Check for orphaned tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%videos%'
  OR tablename LIKE '%audio_files%'
  OR tablename LIKE '%images%';
```

If orphaned tables exist, decide whether to:
- Keep for rollback capability
- Archive to separate schema
- Drop permanently (⚠️ cannot undo)

```sql
-- To archive (safer)
CREATE SCHEMA IF NOT EXISTS archived;
ALTER TABLE videos SET SCHEMA archived;

-- Or to drop (permanent)
-- DROP TABLE videos CASCADE;
```

### Step 3: Update Frontend

Remove any frontend code consuming legacy types:

```bash
cd ../apps/ruach-next

# Remove old fetchers
rm src/lib/api/videos.ts
rm src/lib/api/audio-files.ts
# ... etc

# Update imports to use media-items
# Example:
# - import { getVideos } from '@/lib/api/videos'
# + import { getMediaItems } from '@/lib/api/media-items'
```

### Step 4: Restart and Verify

```bash
# Restart Strapi
npm run develop

# Verify in admin panel:
# 1. Legacy types no longer appear
# 2. Existing data accessible via new types
# 3. No console errors
# 4. API routes respond correctly
```

## Rollback Plan

If issues arise after removal:

### Immediate Rollback
```bash
# Revert git commit
git revert HEAD

# Restart Strapi
npm run develop
```

### Database Rollback
```bash
# Restore from backup
psql -U your_user -d your_database < backup_before_removal_*.sql

# Or use Strapi transfer
npm run strapi transfer:import -- --file backup_before_removal
```

## Post-Removal Tasks

- [ ] Update API documentation
- [ ] Remove legacy type references from README
- [ ] Update frontend integration tests
- [ ] Monitor error logs for 24-48 hours
- [ ] Archive removal validation reports

## Timeline

**Recommended Schedule:**

1. **Week 1**: Run validation, identify data
2. **Week 2**: Migrate data to new structures
3. **Week 3**: Verify migration, update frontend
4. **Week 4**: Remove types, deploy, monitor

Do not rush this process. Data loss cannot be recovered.

## Support

Questions or issues during removal process:
- Check logs in `ruach-ministries-backend/logs/`
- Review migration reports in `scripts/reports/`
- Consult team before dropping any database tables
