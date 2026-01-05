# 🛠️ Development Scripts

Utility scripts for development, testing, and database management.

---

## 📋 Available Scripts

### seed-development-data.js

Populates the database with sample data for development and testing.

**Prerequisites:**
1. Strapi backend running (`cd ruach-ministries-backend && pnpm develop`)
2. Admin user created (visit `http://localhost:1337/admin` and create account)
3. API Token created with full permissions:
   - Go to Settings → API Tokens → Create new API Token
   - Name: `Development Seeder`
   - Token type: Full access
   - Token duration: Unlimited
   - Copy the token

**Usage:**
```bash
# Set environment variables
export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your-api-token-here

# Run seeder
node scripts/seed-development-data.js
```

**What it creates:**
- 5 categories (Sermons, Worship, Testimonies, Bible Study, Prayer)
- 3 speakers (Pastor John, Sarah J., David W.)
- 5 media items with scripture references
- 3 courses
- 2 series
- 3 events

**Output:**
```
🌱 Seeding Development Data
=============================
API URL: http://localhost:1337

📁 Creating categories...
  ✓ Created: Sermons
  ✓ Created: Worship
  ...

✅ Seeding completed successfully!

Summary:
  Categories: 5/5
  Speakers: 3/3
  Media Items: 5
  Courses: 3
  Series: 2
  Events: 3

🎉 Your development database is ready!
```

### strapi/import-courses.ts

Upserts Formation Phases → Courses → Course Profiles → Modules → Lessons from a JSON seed file. The importer creates parents first, reuses existing entries via their unique fields (`phase`, `courseId`, `moduleId`, `lessonId`), and supports publishing/dry-run toggles.

**Prerequisites:**
1. Strapi backend running (`cd ruach-ministries-backend && pnpm develop`).
2. API token with write permissions stored in `STRAPI_TOKEN` (or `STRAPI_API_TOKEN` for legacy scripts).
3. A seed file such as `data/courses.seed.json` with `phases` + `courses` that match your Strapi schema.

**Usage:**
```
export STRAPI_URL=http://localhost:1337
export STRAPI_TOKEN=your-token

pnpm exec tsx scripts/strapi/import-courses.ts --file data/courses.seed.json

# Optional flags
pnpm exec tsx scripts/strapi/import-courses.ts --file data/courses.seed.json --publish true
pnpm exec tsx scripts/strapi/import-courses.ts --file data/courses.seed.json --dry-run
```

```
# Or import straight from Notion
export NOTION_TOKEN=your-token
export NOTION_DB_COURSES=your-courses-db-id
export NOTION_DB_LESSONS=your-lessons-db-id

pnpm exec tsx scripts/strapi/import-courses.ts --notion

# Limit to a single course by passing the configured Notion courseId or page URL/ID
pnpm exec tsx scripts/strapi/import-courses.ts --notion --notion-course course_babylon_001
```

**Notion env vars**
- `NOTION_TOKEN` (or legacy `NOTION_API_KEY`) with a Notion integration that has access to the databases below.
- `NOTION_DB_COURSES` and `NOTION_DB_LESSONS` pointing at your course/lesson tables.

**Seed format notes:**
- `phase` on each course must match the `formation_phases.phase` enum (awakening, separation, etc.).
- Richtext fields expect HTML strings (e.g., `<p>text</p>`).
- Lessons inherit the course’s `requiredAccessLevel` when omitted.
- `--notion` mode builds the same seeds automatically by reading your Notion Courses + Lessons databases; it honors `--notion-course` for a single course and still respects the publish/dry-run toggles.

This script uses `scripts/strapi/import-courses.ts` and can be run with `pnpm exec tsx` from the repo root.

---

## 🔄 Clearing Data

To clear all seeded data and start fresh:

```bash
# Option 1: Drop and recreate database (PostgreSQL)
dropdb ruach && createdb ruach
cd ruach-ministries-backend
pnpm strapi migrations:run

# Option 2: Use Strapi admin UI
# Navigate to each content type and delete all entries

# Then re-run seeder
node scripts/seed-development-data.js
```

---

## 🚀 Future Scripts

**Planned scripts:**
- `backup-database.js` - Create database backups
- `restore-database.js` - Restore from backup
- `migrate-legacy-data.js` - Migrate old content types
- `generate-thumbnails.js` - Generate missing thumbnails
- `cleanup-orphaned-media.js` - Remove unused media files

---

## 💡 Creating New Scripts

**Template:**

```javascript
#!/usr/bin/env node

/**
 * Script Name
 *
 * Description of what this script does.
 *
 * Usage:
 *   node scripts/my-script.js [arguments]
 */

const API_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function main() {
  console.log('🚀 Running Script');

  try {
    // Script logic here

    console.log('✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();
```

**Best Practices:**
1. Always validate environment variables
2. Provide clear console output with emojis
3. Handle errors gracefully
4. Exit with proper code (0 = success, 1 = error)
5. Include usage instructions in comments
6. Test with sample data first

---

## 📞 Support

If you encounter issues with any scripts:
1. Check that environment variables are set correctly
2. Verify Strapi backend is running
3. Ensure API token has proper permissions
4. Check script output for specific error messages

For more help, see [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) or open an issue on GitHub.
